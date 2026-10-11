-- ============================================================================
-- FINANCEIRO — remessa de reenvio dos pagamentos recusados (layout do BB Gestão MAX)
-- ============================================================================
-- Spec: docs/superpowers/specs/2026-10-11-financeiro-fiplan-banco-design.md (Etapa 3)
--
--   fin_remessas_bancarias          uma linha por arquivo de reenvio gerado pelo sistema
--                                   (NSA, convênio, quantidade, valor, hash, movimentos reenviados).
--   registrar_remessa_bancaria(...) reserva o próximo NSA da conta pagadora (max + 1, ou o mínimo
--                                   informado se for maior: o cliente já usou NSAs no Gestão MAX)
--                                   e devolve convênio, agência e conta lidos de contas_autarquia.
--   confirmar_remessa_bancaria(...) depois que o navegador gera o arquivo: grava o SHA-256 e marca
--                                   os movimentos recusados como reenviados.
--   fin_movimentos_bancarios        + remessa_id, reenviado_em
--
-- O arquivo é montado no navegador e enviado pelo usuário no Gestão MAX; o retorno volta pela
-- importação de arquivo bancário (migração 20261011100100). Convênio e conta pagadora ficam só em
-- contas_autarquia (nada de dado do cliente no código).
--
-- Reserva não confirmada: se a última remessa da conta/layout ainda não foi confirmada e é do
-- mesmo usuário, a próxima chamada reaproveita o mesmo NSA (nova tentativa); de outro usuário,
-- o NSA reservado fica pulado.
--
-- Quem gera: módulo financeiro e `pagamento.conciliar`.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. fin_remessas_bancarias
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fin_remessas_bancarias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  layout text NOT NULL DEFAULT 'gestao_max_cnab240' CHECK (layout IN ('gestao_max_cnab240')),
  conta_autarquia_id uuid NOT NULL REFERENCES public.contas_autarquia(id),
  convenio text NOT NULL CHECK (char_length(convenio) BETWEEN 1 AND 20),
  nsa integer NOT NULL CHECK (nsa BETWEEN 1 AND 999999),
  data_geracao timestamptz NOT NULL DEFAULT now(),
  quantidade integer NOT NULL CHECK (quantidade BETWEEN 1 AND 100000),
  valor_total numeric(15,2) NOT NULL CHECK (valor_total >= 0),
  arquivo_sha256 text CHECK (arquivo_sha256 ~ '^[0-9a-f]{64}$'),
  movimentos uuid[] NOT NULL DEFAULT '{}',
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fin_remessas_bancarias_conta_layout_nsa_key UNIQUE (conta_autarquia_id, layout, nsa)
);

COMMENT ON TABLE public.fin_remessas_bancarias IS
  'Arquivos de reenvio (CNAB240 do BB Gestão MAX) gerados pelo sistema: NSA reservado por registrar_remessa_bancaria e hash gravado por confirmar_remessa_bancaria. arquivo_sha256 nulo = reserva não confirmada. Escrita só pelas RPCs.';
COMMENT ON COLUMN public.fin_remessas_bancarias.movimentos IS
  'fin_movimentos_bancarios recusados reenviados neste arquivo.';

ALTER TABLE public.fin_remessas_bancarias ENABLE ROW LEVEL SECURITY;

-- Leitura: quem acessa o módulo financeiro. Sem policy de escrita: ninguém grava pela API.
DROP POLICY IF EXISTS fin_remessas_bancarias_select ON public.fin_remessas_bancarias;
CREATE POLICY fin_remessas_bancarias_select ON public.fin_remessas_bancarias
  FOR SELECT TO authenticated
  USING (
    (SELECT public.perfil_ativo_atual())
    AND public.can_access_module(auth.uid(), 'financeiro')
  );

REVOKE ALL ON public.fin_remessas_bancarias FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.fin_remessas_bancarias FROM authenticated;


-- ----------------------------------------------------------------------------
-- 2. fin_movimentos_bancarios: marca de reenvio
-- ----------------------------------------------------------------------------
ALTER TABLE public.fin_movimentos_bancarios
  ADD COLUMN IF NOT EXISTS remessa_id uuid,
  ADD COLUMN IF NOT EXISTS reenviado_em timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                  WHERE conname = 'fin_movimentos_bancarios_remessa_id_fkey'
                    AND conrelid = 'public.fin_movimentos_bancarios'::regclass) THEN
    ALTER TABLE public.fin_movimentos_bancarios
      ADD CONSTRAINT fin_movimentos_bancarios_remessa_id_fkey
      FOREIGN KEY (remessa_id) REFERENCES public.fin_remessas_bancarias(id) ON DELETE SET NULL;
  END IF;
END $$;

COMMENT ON COLUMN public.fin_movimentos_bancarios.remessa_id IS
  'Remessa de reenvio (fin_remessas_bancarias) em que o pagamento recusado foi reenviado.';

CREATE INDEX IF NOT EXISTS idx_fin_mov_bancarios_remessa ON public.fin_movimentos_bancarios (remessa_id);


-- ----------------------------------------------------------------------------
-- 3. registrar_remessa_bancaria
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.registrar_remessa_bancaria(
  p_conta_autarquia_id uuid,
  p_layout text,
  p_quantidade integer,
  p_valor_total numeric,
  p_movimentos uuid[],
  p_nsa_minimo integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_conta public.contas_autarquia%ROWTYPE;
  v_ultima public.fin_remessas_bancarias%ROWTYPE;
  v_movs uuid[] := COALESCE(p_movimentos, '{}');
  v_invalidos integer;
  v_nsa integer;
  v_id uuid;
  v_reaproveitada boolean := false;
BEGIN
  IF v_uid IS NULL
     OR NOT COALESCE(public.perfil_ativo_atual()
                     AND public.can_access_module(v_uid, 'financeiro')
                     AND public.has_permission_code(v_uid, 'pagamento.conciliar'), false) THEN
    RAISE EXCEPTION 'Sem permissão para gerar remessa bancária (pagamento.conciliar).' USING ERRCODE = '42501';
  END IF;

  IF COALESCE(p_layout, '') NOT IN ('gestao_max_cnab240') THEN
    RAISE EXCEPTION 'Layout de remessa inválido: %', p_layout USING ERRCODE = '22023';
  END IF;
  IF p_quantidade IS NULL OR p_quantidade NOT BETWEEN 1 AND 100000 THEN
    RAISE EXCEPTION 'Quantidade de pagamentos inválida.' USING ERRCODE = '22023';
  END IF;
  IF p_valor_total IS NULL OR p_valor_total < 0 OR p_valor_total >= 1e13 THEN
    RAISE EXCEPTION 'Valor total inválido.' USING ERRCODE = '22023';
  END IF;
  IF p_nsa_minimo IS NOT NULL AND p_nsa_minimo NOT BETWEEN 1 AND 999999 THEN
    RAISE EXCEPTION 'NSA mínimo inválido.' USING ERRCODE = '22023';
  END IF;
  IF array_position(v_movs, NULL) IS NOT NULL
     OR cardinality(v_movs) > p_quantidade
     OR cardinality(v_movs) <> (SELECT count(DISTINCT m) FROM unnest(v_movs) m) THEN
    RAISE EXCEPTION 'Lista de movimentos reenviados inválida.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_conta FROM public.contas_autarquia WHERE id = p_conta_autarquia_id AND COALESCE(ativo, true);
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conta pagadora não encontrada ou inativa.' USING ERRCODE = 'P0002';
  END IF;
  IF NULLIF(btrim(COALESCE(v_conta.convenio_pagamento, '')), '') IS NULL THEN
    RAISE EXCEPTION 'A conta pagadora não tem convênio de pagamento cadastrado.' USING ERRCODE = '22023';
  END IF;

  -- Só recusados que ainda não foram reenviados num arquivo confirmado.
  SELECT count(*) INTO v_invalidos
    FROM unnest(v_movs) AS x(id)
    LEFT JOIN public.fin_movimentos_bancarios m ON m.id = x.id
   WHERE m.id IS NULL OR m.situacao <> 'recusado' OR m.reenviado_em IS NOT NULL;
  IF v_invalidos > 0 THEN
    RAISE EXCEPTION '% movimento(s) não existem, não estão recusados ou já foram reenviados.', v_invalidos
      USING ERRCODE = '22023';
  END IF;

  -- Um NSA por vez para a mesma conta e layout.
  PERFORM pg_advisory_xact_lock(hashtext('registrar_remessa_bancaria'), hashtext(p_conta_autarquia_id::text || '|' || p_layout));

  SELECT * INTO v_ultima FROM public.fin_remessas_bancarias
   WHERE conta_autarquia_id = p_conta_autarquia_id AND layout = p_layout
   ORDER BY nsa DESC LIMIT 1;

  IF FOUND AND v_ultima.arquivo_sha256 IS NULL AND v_ultima.created_by = v_uid
     AND v_ultima.nsa >= COALESCE(p_nsa_minimo, 0) THEN
    -- Nova tentativa do mesmo usuário: reaproveita a reserva não confirmada.
    v_reaproveitada := true;
    v_nsa := v_ultima.nsa;
    UPDATE public.fin_remessas_bancarias
       SET convenio = btrim(v_conta.convenio_pagamento), quantidade = p_quantidade,
           valor_total = round(p_valor_total, 2), movimentos = v_movs, data_geracao = now()
     WHERE id = v_ultima.id
     RETURNING id INTO v_id;
  ELSE
    v_nsa := GREATEST(COALESCE(v_ultima.nsa, 0) + 1, COALESCE(p_nsa_minimo, 1));
    IF v_nsa > 999999 THEN
      RAISE EXCEPTION 'NSA esgotado para esta conta.' USING ERRCODE = '22023';
    END IF;
    INSERT INTO public.fin_remessas_bancarias
      (layout, conta_autarquia_id, convenio, nsa, quantidade, valor_total, movimentos, created_by)
    VALUES
      (p_layout, p_conta_autarquia_id, btrim(v_conta.convenio_pagamento), v_nsa, p_quantidade,
       round(p_valor_total, 2), v_movs, v_uid)
    RETURNING id INTO v_id;
  END IF;

  RETURN jsonb_build_object(
    'id', v_id,
    'nsa', v_nsa,
    'convenio', btrim(v_conta.convenio_pagamento),
    'agencia', v_conta.agencia,
    'agencia_digito', v_conta.agencia_digito,
    'conta', v_conta.conta,
    'conta_digito', v_conta.conta_digito,
    'reaproveitada', v_reaproveitada
  );
END;
$$;

COMMENT ON FUNCTION public.registrar_remessa_bancaria(uuid, text, integer, numeric, uuid[], integer) IS
  'Reserva o próximo NSA da conta pagadora para uma remessa de reenvio (Gestão MAX) e devolve convênio, agência e conta. Exige pagamento.conciliar.';

REVOKE ALL ON FUNCTION public.registrar_remessa_bancaria(uuid, text, integer, numeric, uuid[], integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_remessa_bancaria(uuid, text, integer, numeric, uuid[], integer) TO authenticated;


-- ----------------------------------------------------------------------------
-- 4. confirmar_remessa_bancaria
-- ----------------------------------------------------------------------------
-- Idempotente com o mesmo hash; hash diferente numa remessa já confirmada é recusado.
CREATE OR REPLACE FUNCTION public.confirmar_remessa_bancaria(p_id uuid, p_sha256 text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_rem public.fin_remessas_bancarias%ROWTYPE;
  v_marcados integer := 0;
BEGIN
  IF v_uid IS NULL
     OR NOT COALESCE(public.perfil_ativo_atual()
                     AND public.can_access_module(v_uid, 'financeiro')
                     AND public.has_permission_code(v_uid, 'pagamento.conciliar'), false) THEN
    RAISE EXCEPTION 'Sem permissão para confirmar remessa bancária (pagamento.conciliar).' USING ERRCODE = '42501';
  END IF;
  IF COALESCE(p_sha256, '') !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'Hash do arquivo inválido.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_rem FROM public.fin_remessas_bancarias WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Remessa não encontrada.' USING ERRCODE = 'P0002';
  END IF;
  IF v_rem.arquivo_sha256 IS NOT NULL THEN
    IF v_rem.arquivo_sha256 <> p_sha256 THEN
      RAISE EXCEPTION 'A remessa NSA % já foi confirmada com outro arquivo.', v_rem.nsa USING ERRCODE = '22023';
    END IF;
    RETURN jsonb_build_object('id', v_rem.id, 'nsa', v_rem.nsa, 'arquivo_sha256', v_rem.arquivo_sha256,
                              'movimentos_marcados', 0, 'ja_confirmada', true);
  END IF;

  UPDATE public.fin_remessas_bancarias SET arquivo_sha256 = p_sha256 WHERE id = p_id;

  UPDATE public.fin_movimentos_bancarios
     SET remessa_id = p_id, reenviado_em = now(), updated_at = now()
   WHERE id = ANY (v_rem.movimentos) AND reenviado_em IS NULL;
  GET DIAGNOSTICS v_marcados = ROW_COUNT;

  RETURN jsonb_build_object('id', v_rem.id, 'nsa', v_rem.nsa, 'arquivo_sha256', p_sha256,
                            'movimentos_marcados', v_marcados, 'ja_confirmada', false);
END;
$$;

COMMENT ON FUNCTION public.confirmar_remessa_bancaria(uuid, text) IS
  'Grava o SHA-256 do arquivo de reenvio gerado e marca os movimentos recusados como reenviados. Exige pagamento.conciliar.';

REVOKE ALL ON FUNCTION public.confirmar_remessa_bancaria(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirmar_remessa_bancaria(uuid, text) TO authenticated;
