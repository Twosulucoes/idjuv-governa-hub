-- ============================================================================
-- Folha: retorno do banco da remessa CNAB 240 (crédito agendado, pago ou recusado por servidor)
-- ============================================================================
-- Antes: retornos_bancarios e itens_retorno_bancario existiam sem tela nem regra. O retorno do banco só entrava pelo
-- importador do financeiro (fin_movimentos_bancarios), sem ligar o crédito à ficha do servidor nem à remessa da folha.
--
-- Agora:
--   1. retornos_bancarios ganha o que identifica o arquivo do banco: sha256, NSA, data, convênio e se é prévia
--      (o BB manda uma prévia ao receber a remessa, com os créditos agendados, e o retorno depois do crédito), além de
--      quantidade e valor agendados. O mesmo arquivo não entra duas vezes na mesma remessa.
--   2. itens_retorno_bancario ganha a situação 'agendado' e o identificador e o nome do favorecido (a pensão paga a
--      quem não é servidor); o crédito do retorno que não acha a remessa fica sem ficha.
--   3. registrar_retorno_remessa(remessa, retorno, itens): exige o módulo rh e financeiro.folha.processar; grava o
--      retorno e os itens de uma vez, confere que cada ficha é da folha da remessa e atualiza a remessa: gerada passa
--      a enviada (o banco recebeu); sem prévia e sem crédito agendado, processada.
-- Quem lê o arquivo e casa cada crédito com a ficha é a tela (src/lib/bancario/retornoFolha.ts), pelo seu número
-- que a remessa do sistema grava (início do id da ficha ou do item de pensão) ou, sem ele, pelo CPF e o valor.
-- Idempotente.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Retorno: identificação do arquivo do banco
-- ---------------------------------------------------------------------------
ALTER TABLE public.retornos_bancarios
  ADD COLUMN IF NOT EXISTS arquivo_sha256 text,
  ADD COLUMN IF NOT EXISTS nsa integer,
  ADD COLUMN IF NOT EXISTS data_arquivo date,
  ADD COLUMN IF NOT EXISTS convenio text,
  ADD COLUMN IF NOT EXISTS previa boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS quantidade_agendados integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_agendado numeric(15,2) DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'retornos_bancarios_arquivo_sha256_check') THEN
    ALTER TABLE public.retornos_bancarios ADD CONSTRAINT retornos_bancarios_arquivo_sha256_check
      CHECK (arquivo_sha256 IS NULL OR arquivo_sha256 ~ '^[0-9a-f]{64}$');
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS retornos_bancarios_remessa_arquivo_key
  ON public.retornos_bancarios (remessa_id, arquivo_sha256) WHERE arquivo_sha256 IS NOT NULL;

COMMENT ON COLUMN public.retornos_bancarios.previa IS 'Prévia do banco (créditos aceitos e agendados, antes da data do crédito). Migração 20261021090000.';
COMMENT ON COLUMN public.retornos_bancarios.arquivo_sha256 IS 'sha256 do arquivo de retorno: o mesmo arquivo não entra duas vezes na mesma remessa.';

-- ---------------------------------------------------------------------------
-- 2. Itens: situação agendado e favorecido
-- ---------------------------------------------------------------------------
ALTER TABLE public.itens_retorno_bancario
  ADD COLUMN IF NOT EXISTS identificador varchar(40),
  ADD COLUMN IF NOT EXISTS favorecido_nome text;

ALTER TABLE public.itens_retorno_bancario DROP CONSTRAINT IF EXISTS itens_retorno_bancario_status_check;
ALTER TABLE public.itens_retorno_bancario ADD CONSTRAINT itens_retorno_bancario_status_check
  CHECK ((status)::text = ANY ((ARRAY['agendado'::character varying, 'pago'::character varying,
                                      'rejeitado'::character varying, 'devolvido'::character varying])::text[]));

COMMENT ON COLUMN public.itens_retorno_bancario.status IS 'agendado (aceito pelo banco, crédito na data), pago, rejeitado (com a ocorrência) ou devolvido.';
COMMENT ON COLUMN public.itens_retorno_bancario.identificador IS 'Seu número do crédito no arquivo (a remessa do sistema grava o início do id da ficha ou do item de pensão).';

-- ---------------------------------------------------------------------------
-- 3. Registrar o retorno de uma remessa
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.registrar_retorno_remessa(p_remessa_id uuid, p_retorno jsonb, p_itens jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_remessa record;
  v_sha text := lower(btrim(coalesce(p_retorno->>'arquivo_sha256', '')));
  v_previa boolean := coalesce((p_retorno->>'previa')::boolean, false);
  v_retorno_id uuid;
  v_fora int;
  v_ag int; v_pg int; v_rj int;
  v_status text;
BEGIN
  IF v_uid IS NULL OR NOT coalesce(public.can_access_module(v_uid, 'rh')
                                   AND public.has_permission_code(v_uid, 'financeiro.folha.processar'), false) THEN
    RAISE EXCEPTION 'Registrar o retorno do banco exige o módulo rh e a permissão financeiro.folha.processar'
      USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_remessa FROM public.remessas_bancarias WHERE id = p_remessa_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Remessa não encontrada' USING ERRCODE = 'P0002';
  END IF;
  IF v_remessa.status = 'cancelada' THEN
    RAISE EXCEPTION 'A remessa % está cancelada: o retorno não é registrado nela', v_remessa.numero_remessa
      USING ERRCODE = '22023';
  END IF;
  IF v_sha !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'Retorno sem o sha256 do arquivo' USING ERRCODE = '22023';
  END IF;
  IF jsonb_typeof(p_itens) IS DISTINCT FROM 'array' OR jsonb_array_length(p_itens) = 0 THEN
    RAISE EXCEPTION 'O retorno não traz créditos' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (SELECT 1 FROM public.retornos_bancarios WHERE remessa_id = p_remessa_id AND arquivo_sha256 = v_sha) THEN
    RAISE EXCEPTION 'Este arquivo de retorno já foi registrado na remessa %', v_remessa.numero_remessa
      USING ERRCODE = '23505';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(p_itens) e
              WHERE coalesce(e->>'status', '') NOT IN ('agendado', 'pago', 'rejeitado')
                 OR (e->>'valor') IS NULL OR (e->>'valor')::numeric < 0) THEN
    RAISE EXCEPTION 'Crédito do retorno com situação ou valor inválido' USING ERRCODE = '22023';
  END IF;
  SELECT count(*) INTO v_fora
    FROM jsonb_array_elements(p_itens) e
   WHERE nullif(e->>'ficha_id', '') IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.fichas_financeiras f
                      WHERE f.id = (e->>'ficha_id')::uuid AND f.folha_id = v_remessa.folha_id);
  IF v_fora > 0 THEN
    RAISE EXCEPTION '% crédito(s) do retorno apontam fichas de outra folha', v_fora USING ERRCODE = '22023';
  END IF;

  SELECT count(*) FILTER (WHERE e->>'status' = 'agendado'), count(*) FILTER (WHERE e->>'status' = 'pago'),
         count(*) FILTER (WHERE e->>'status' = 'rejeitado')
    INTO v_ag, v_pg, v_rj
    FROM jsonb_array_elements(p_itens) e;

  INSERT INTO public.retornos_bancarios (
    remessa_id, data_processamento, arquivo_nome, arquivo_sha256, nsa, data_arquivo, convenio, previa,
    quantidade_pagos, valor_pago, quantidade_rejeitados, valor_rejeitado, quantidade_agendados, valor_agendado,
    processado_por)
  SELECT p_remessa_id, public.data_local(), left(nullif(btrim(p_retorno->>'arquivo_nome'), ''), 255), v_sha,
         (p_retorno->>'nsa')::integer, (p_retorno->>'data_arquivo')::date,
         left(nullif(btrim(p_retorno->>'convenio'), ''), 20), v_previa,
         v_pg, coalesce(sum((e->>'valor')::numeric) FILTER (WHERE e->>'status' = 'pago'), 0),
         v_rj, coalesce(sum((e->>'valor')::numeric) FILTER (WHERE e->>'status' = 'rejeitado'), 0),
         v_ag, coalesce(sum((e->>'valor')::numeric) FILTER (WHERE e->>'status' = 'agendado'), 0),
         v_uid
    FROM jsonb_array_elements(p_itens) e
  RETURNING id INTO v_retorno_id;

  -- servidor pela ficha (não pelo que a tela mandou)
  INSERT INTO public.itens_retorno_bancario (
    retorno_id, ficha_id, servidor_id, valor, status, codigo_ocorrencia, descricao_ocorrencia, data_pagamento,
    identificador, favorecido_nome)
  SELECT v_retorno_id, f.id, f.servidor_id, round((e->>'valor')::numeric, 2), e->>'status',
         left(nullif(btrim(e->>'codigo_ocorrencia'), ''), 10), left(nullif(btrim(e->>'descricao_ocorrencia'), ''), 500),
         (nullif(e->>'data_pagamento', ''))::date, left(nullif(btrim(e->>'identificador'), ''), 40),
         left(nullif(btrim(e->>'favorecido_nome'), ''), 120)
    FROM jsonb_array_elements(p_itens) e
    LEFT JOIN public.fichas_financeiras f ON f.id = (nullif(e->>'ficha_id', ''))::uuid;

  -- o banco respondeu: a remessa foi enviada; retorno final sem crédito agendado fecha a remessa
  v_status := v_remessa.status;
  IF v_status = 'gerada' THEN
    v_status := 'enviada';
  END IF;
  IF NOT v_previa AND v_ag = 0 THEN
    v_status := 'processada';
  END IF;
  UPDATE public.remessas_bancarias
     SET status = v_status,
         enviado_em = coalesce(enviado_em, now()),
         enviado_por = coalesce(enviado_por, v_uid)
   WHERE id = p_remessa_id;

  RETURN jsonb_build_object('retorno_id', v_retorno_id, 'agendados', v_ag, 'pagos', v_pg, 'rejeitados', v_rj,
                            'sem_ficha', (SELECT count(*) FROM public.itens_retorno_bancario
                                           WHERE retorno_id = v_retorno_id AND ficha_id IS NULL),
                            'status_remessa', v_status);
END;
$$;

COMMENT ON FUNCTION public.registrar_retorno_remessa(uuid, jsonb, jsonb) IS 'Grava o retorno do banco de uma remessa da folha (arquivo, créditos agendados, pagos e recusados por ficha) e atualiza a situação da remessa. Exige o módulo rh e financeiro.folha.processar. Migração 20261021090000.';

REVOKE EXECUTE ON FUNCTION public.registrar_retorno_remessa(uuid, jsonb, jsonb) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.registrar_retorno_remessa(uuid, jsonb, jsonb) TO authenticated;
