-- ============================================================================
-- COMPRAS — processos SEI, P2: próxima etapa, responsável e prazo em cada movimentação
-- ============================================================================
-- Plano: docs/superpowers/plans/2026-11-07-processos-sei-p2-proxima-acao.md (desenho no planejamento de 07/11;
-- o dono pediu para seguir em 07/11 04:01).
--
--   processo_andamentos          ganha proxima_etapa, responsavel_servidor_id, responsavel_nome (copiado do servidor
--                                pelo banco), responsavel_setor e prazo_proxima. Toda movimentação NOVA gravada pela
--                                API exige os três (próxima etapa, responsável e prazo, não antes da data), menos em
--                                Encerrado e Cancelado. As antigas e as da importação da planilha ficam como estão.
--   processos_licitatorios       ganha a próxima ação da movimentação que vale (copiada por processo_recalcular_estado).
--   compras_etapa_parametros     dias padrão do prazo e limite de dias parado por etapa (o sistema sugere o prazo; a
--                                P3 usa o limite); lê quem vê processos, altera quem edita processos.
--   processo_buscar_servidores   busca estreita de servidores (nome, matrícula, cargo) para escolher o responsável.
--
-- Nenhuma policy existente muda. Idempotente.
-- ============================================================================

SET lock_timeout = '10s';

-- ----------------------------------------------------------------------------
-- 1. Colunas
-- ----------------------------------------------------------------------------
ALTER TABLE public.processo_andamentos
  ADD COLUMN IF NOT EXISTS proxima_etapa text,
  ADD COLUMN IF NOT EXISTS responsavel_servidor_id uuid REFERENCES public.servidores(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS responsavel_nome text,
  ADD COLUMN IF NOT EXISTS responsavel_setor text,
  ADD COLUMN IF NOT EXISTS prazo_proxima date;

ALTER TABLE public.processo_andamentos DROP CONSTRAINT IF EXISTS processo_andamentos_proxima_etapa_check;
ALTER TABLE public.processo_andamentos ADD CONSTRAINT processo_andamentos_proxima_etapa_check CHECK (
  proxima_etapa IS NULL OR proxima_etapa = ANY (ARRAY[
    'abertura', 'dfd', 'etp', 'tr', 'cotacao', 'levantamento_tecnico', 'instrucao_adesao', 'analise_juridica',
    'selecao', 'contrato', 'execucao', 'encerrado', 'cancelado']));
ALTER TABLE public.processo_andamentos DROP CONSTRAINT IF EXISTS processo_andamentos_responsavel_setor_check;
ALTER TABLE public.processo_andamentos ADD CONSTRAINT processo_andamentos_responsavel_setor_check CHECK (
  responsavel_setor IS NULL OR char_length(responsavel_setor) <= 200);

COMMENT ON COLUMN public.processo_andamentos.proxima_etapa IS 'Etapa que vem depois desta movimentação (P2).';
COMMENT ON COLUMN public.processo_andamentos.responsavel_servidor_id IS 'Servidor responsável pela próxima ação (ou responsavel_setor).';
COMMENT ON COLUMN public.processo_andamentos.responsavel_nome IS 'Nome do servidor responsável, copiado pelo banco (quem vê processos não lê a tabela servidores).';
COMMENT ON COLUMN public.processo_andamentos.prazo_proxima IS 'Prazo da próxima ação (não antes da data da movimentação).';

ALTER TABLE public.processos_licitatorios
  ADD COLUMN IF NOT EXISTS proxima_etapa text,
  ADD COLUMN IF NOT EXISTS proximo_responsavel_servidor_id uuid,
  ADD COLUMN IF NOT EXISTS proximo_responsavel_nome text,
  ADD COLUMN IF NOT EXISTS proximo_responsavel_setor text,
  ADD COLUMN IF NOT EXISTS prazo_proxima_acao date;

COMMENT ON COLUMN public.processos_licitatorios.prazo_proxima_acao IS
  'Prazo da próxima ação, da movimentação que vale (processo_recalcular_estado).';

-- ----------------------------------------------------------------------------
-- 2. Parâmetros por etapa
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.compras_etapa_parametros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  etapa text NOT NULL UNIQUE CHECK (etapa = ANY (ARRAY[
    'abertura', 'dfd', 'etp', 'tr', 'cotacao', 'levantamento_tecnico', 'instrucao_adesao', 'analise_juridica',
    'selecao', 'contrato', 'execucao', 'encerrado', 'cancelado'])),
  dias_prazo integer NOT NULL CHECK (dias_prazo BETWEEN 1 AND 365),
  dias_limite_parado integer NOT NULL CHECK (dias_limite_parado BETWEEN 1 AND 365),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid DEFAULT auth.uid()
);
ALTER TABLE public.compras_etapa_parametros ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.compras_etapa_parametros IS
  'Processos de contratação: dias padrão do prazo da próxima ação (sugestão na movimentação) e limite de dias parado de cada etapa (P2/P3).';

INSERT INTO public.compras_etapa_parametros (etapa, dias_prazo, dias_limite_parado) VALUES
  ('abertura', 5, 15), ('dfd', 10, 15), ('etp', 15, 15), ('tr', 10, 15), ('cotacao', 15, 15),
  ('levantamento_tecnico', 10, 15), ('instrucao_adesao', 10, 15), ('analise_juridica', 10, 15), ('selecao', 30, 15),
  ('contrato', 10, 15), ('execucao', 30, 15), ('encerrado', 30, 365), ('cancelado', 30, 365)
ON CONFLICT (etapa) DO NOTHING;

CREATE OR REPLACE FUNCTION public.compras_etapa_parametros_carimbar()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  NEW.updated_by := COALESCE(auth.uid(), NEW.updated_by);
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.compras_etapa_parametros_carimbar() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_compras_etapa_parametros_carimbar ON public.compras_etapa_parametros;
CREATE TRIGGER trg_compras_etapa_parametros_carimbar BEFORE INSERT OR UPDATE ON public.compras_etapa_parametros
  FOR EACH ROW EXECUTE FUNCTION public.compras_etapa_parametros_carimbar();

-- ----------------------------------------------------------------------------
-- 3. Regra da próxima ação
-- ----------------------------------------------------------------------------
-- Devolve a mensagem do que falta (NULL = ok). Encerrado e Cancelado não pedem próxima ação.
CREATE OR REPLACE FUNCTION public.processo_proxima_acao_falta(
  p_etapa text, p_data date, p_proxima text, p_servidor uuid, p_setor text, p_prazo date)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_etapa IN ('encerrado', 'cancelado') THEN NULL
    WHEN p_proxima IS NULL THEN 'Informe a próxima etapa.'
    WHEN p_servidor IS NULL AND NULLIF(btrim(p_setor), '') IS NULL THEN 'Informe o responsável pela próxima ação (servidor ou setor).'
    WHEN p_prazo IS NULL THEN 'Informe o prazo da próxima ação.'
    WHEN p_prazo < p_data THEN 'O prazo da próxima ação não pode ser antes da data da movimentação.'
  END
$$;
REVOKE EXECUTE ON FUNCTION public.processo_proxima_acao_falta(text, date, text, uuid, text, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.processo_proxima_acao_falta(text, date, text, uuid, text, date) TO authenticated;

-- Antes de inserir: autoria; movimentação nova não nasce excluída nem editada; pela API (papel authenticated), a
-- próxima ação é obrigatória. A importação da planilha roda como dona da função (SECURITY DEFINER) e não é cobrada.
CREATE OR REPLACE FUNCTION public.processo_andamento_carimbar()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_falta text;
BEGIN
  NEW.created_by := COALESCE(auth.uid(), NEW.created_by);
  NEW.created_at := now();
  NEW.setor := NULLIF(btrim(NEW.setor), '');
  NEW.situacao := btrim(NEW.situacao);
  NEW.excluido_em := NULL;
  NEW.excluido_por := NULL;
  NEW.excluido_motivo := NULL;
  NEW.alterado_em := NULL;
  NEW.alterado_por := NULL;
  NEW.alteracao_motivo := NULL;
  NEW.responsavel_setor := NULLIF(btrim(NEW.responsavel_setor), '');
  IF NEW.etapa IN ('encerrado', 'cancelado') THEN
    NEW.proxima_etapa := NULL;
    NEW.responsavel_servidor_id := NULL;
    NEW.responsavel_setor := NULL;
    NEW.prazo_proxima := NULL;
  ELSIF current_user IN ('authenticated', 'anon') THEN
    v_falta := public.processo_proxima_acao_falta(NEW.etapa, NEW.data, NEW.proxima_etapa, NEW.responsavel_servidor_id,
                                                  NEW.responsavel_setor, NEW.prazo_proxima);
    IF v_falta IS NOT NULL THEN
      RAISE EXCEPTION '%', v_falta USING ERRCODE = '22023';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.processo_andamento_carimbar() FROM PUBLIC, anon, authenticated;

-- Nome do responsável copiado do servidor (SECURITY DEFINER: quem vê processos não lê a tabela servidores). Roda
-- depois dos outros gatilhos BEFORE (ordem alfabética do nome do gatilho).
CREATE OR REPLACE FUNCTION public.processo_andamento_responsavel_nome()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.responsavel_servidor_id IS NULL THEN
    NEW.responsavel_nome := NULL;
  ELSE
    SELECT s.nome_completo INTO NEW.responsavel_nome FROM public.servidores s WHERE s.id = NEW.responsavel_servidor_id;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.processo_andamento_responsavel_nome() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_processo_andamentos_responsavel_nome ON public.processo_andamentos;
CREATE TRIGGER trg_processo_andamentos_responsavel_nome BEFORE INSERT OR UPDATE ON public.processo_andamentos
  FOR EACH ROW EXECUTE FUNCTION public.processo_andamento_responsavel_nome();

-- Edição (P1) passa a cobrir a próxima ação: entra na comparação, na trilha e, se a movimentação já tinha próxima
-- ação (ou a correção informa alguma), ela continua completa.
CREATE OR REPLACE FUNCTION public.processo_andamento_alterar()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_falta text;
BEGIN
  IF OLD.excluido_em IS NOT NULL THEN
    RAISE EXCEPTION 'Esta movimentação foi excluída e não pode mais ser alterada.' USING ERRCODE = '22023';
  END IF;

  NEW.id := OLD.id;
  NEW.processo_id := OLD.processo_id;
  NEW.created_at := OLD.created_at;
  NEW.created_by := OLD.created_by;

  IF NEW.excluido_em IS NOT NULL THEN
    NEW.excluido_motivo := btrim(COALESCE(NEW.excluido_motivo, ''));
    IF char_length(NEW.excluido_motivo) NOT BETWEEN 3 AND 500 THEN
      RAISE EXCEPTION 'Informe o motivo da exclusão (de 3 a 500 caracteres).' USING ERRCODE = '22023';
    END IF;
    NEW.excluido_em := now();
    NEW.excluido_por := auth.uid();
    NEW.data := OLD.data;
    NEW.data_informada := OLD.data_informada;
    NEW.etapa := OLD.etapa;
    NEW.setor := OLD.setor;
    NEW.situacao := OLD.situacao;
    NEW.proxima_etapa := OLD.proxima_etapa;
    NEW.responsavel_servidor_id := OLD.responsavel_servidor_id;
    NEW.responsavel_nome := OLD.responsavel_nome;
    NEW.responsavel_setor := OLD.responsavel_setor;
    NEW.prazo_proxima := OLD.prazo_proxima;
    NEW.alterado_em := OLD.alterado_em;
    NEW.alterado_por := OLD.alterado_por;
    NEW.alteracao_motivo := OLD.alteracao_motivo;
    RETURN NEW;
  END IF;

  NEW.excluido_por := NULL;
  NEW.excluido_motivo := NULL;
  NEW.setor := NULLIF(btrim(NEW.setor), '');
  NEW.situacao := btrim(NEW.situacao);
  NEW.responsavel_setor := NULLIF(btrim(NEW.responsavel_setor), '');
  IF NEW.data IS DISTINCT FROM OLD.data THEN
    NEW.data_informada := true;
  END IF;
  IF NEW.etapa IN ('encerrado', 'cancelado') THEN
    NEW.proxima_etapa := NULL;
    NEW.responsavel_servidor_id := NULL;
    NEW.responsavel_setor := NULL;
    NEW.prazo_proxima := NULL;
  END IF;

  IF (NEW.data, NEW.data_informada, NEW.etapa, NEW.setor, NEW.situacao,
      NEW.proxima_etapa, NEW.responsavel_servidor_id, NEW.responsavel_setor, NEW.prazo_proxima)
     IS NOT DISTINCT FROM (OLD.data, OLD.data_informada, OLD.etapa, OLD.setor, OLD.situacao,
      OLD.proxima_etapa, OLD.responsavel_servidor_id, OLD.responsavel_setor, OLD.prazo_proxima) THEN
    RETURN OLD;  -- nada mudou: não grava nem vai para a trilha
  END IF;

  IF NEW.data > CURRENT_DATE THEN
    RAISE EXCEPTION 'A data da movimentação não pode ser futura.' USING ERRCODE = '22023';
  END IF;
  IF OLD.proxima_etapa IS NOT NULL OR NEW.proxima_etapa IS NOT NULL OR NEW.responsavel_servidor_id IS NOT NULL
     OR NEW.responsavel_setor IS NOT NULL OR NEW.prazo_proxima IS NOT NULL THEN
    v_falta := public.processo_proxima_acao_falta(NEW.etapa, NEW.data, NEW.proxima_etapa, NEW.responsavel_servidor_id,
                                                  NEW.responsavel_setor, NEW.prazo_proxima);
    IF v_falta IS NOT NULL THEN
      RAISE EXCEPTION '%', v_falta USING ERRCODE = '22023';
    END IF;
  END IF;
  NEW.alteracao_motivo := btrim(COALESCE(NEW.alteracao_motivo, ''));
  IF NEW.alteracao_motivo = '' OR NEW.alteracao_motivo IS NOT DISTINCT FROM OLD.alteracao_motivo
     OR char_length(NEW.alteracao_motivo) NOT BETWEEN 3 AND 500 THEN
    RAISE EXCEPTION 'Informe o motivo da correção (de 3 a 500 caracteres).' USING ERRCODE = '22023';
  END IF;
  NEW.alterado_em := now();
  NEW.alterado_por := auth.uid();
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.processo_andamento_alterar() FROM PUBLIC, anon, authenticated;

-- Trilha da edição com a próxima ação.
CREATE OR REPLACE FUNCTION public.processo_andamento_registrar_alteracao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_antes jsonb := jsonb_build_object('data', OLD.data, 'data_informada', OLD.data_informada, 'etapa', OLD.etapa,
                                      'setor', OLD.setor, 'situacao', OLD.situacao, 'proxima_etapa', OLD.proxima_etapa,
                                      'responsavel', COALESCE(OLD.responsavel_nome, OLD.responsavel_setor),
                                      'prazo_proxima', OLD.prazo_proxima);
BEGIN
  IF NEW.excluido_em IS NULL AND NEW.alterado_em IS NOT DISTINCT FROM OLD.alterado_em THEN
    RETURN NULL;  -- UPDATE sem mudança (o gatilho de antes devolveu a linha como estava)
  END IF;
  IF NEW.excluido_em IS NOT NULL THEN
    INSERT INTO public.processo_andamento_alteracoes (andamento_id, processo_id, acao, antes, depois, motivo, feito_por)
    VALUES (NEW.id, NEW.processo_id, 'exclusao', v_antes, NULL, NEW.excluido_motivo, auth.uid());
  ELSE
    INSERT INTO public.processo_andamento_alteracoes (andamento_id, processo_id, acao, antes, depois, motivo, feito_por)
    VALUES (NEW.id, NEW.processo_id, 'edicao', v_antes,
            jsonb_build_object('data', NEW.data, 'data_informada', NEW.data_informada, 'etapa', NEW.etapa,
                               'setor', NEW.setor, 'situacao', NEW.situacao, 'proxima_etapa', NEW.proxima_etapa,
                               'responsavel', COALESCE(NEW.responsavel_nome, NEW.responsavel_setor),
                               'prazo_proxima', NEW.prazo_proxima),
            NEW.alteracao_motivo, auth.uid());
  END IF;
  PERFORM public.processo_recalcular_estado(NEW.processo_id);
  RETURN NULL;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.processo_andamento_registrar_alteracao() FROM PUBLIC, anon, authenticated;

-- Estado do processo: também a próxima ação da movimentação que vale.
CREATE OR REPLACE FUNCTION public.processo_recalcular_estado(p_processo_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ult public.processo_andamentos%ROWTYPE;
  v_setor text;
  v_data date;
BEGIN
  SELECT * INTO v_ult
    FROM public.processo_andamentos a
   WHERE a.processo_id = p_processo_id AND a.excluido_em IS NULL
   ORDER BY a.data_informada DESC, a.data DESC, a.created_at DESC
   LIMIT 1;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT a.setor INTO v_setor
    FROM public.processo_andamentos a
   WHERE a.processo_id = p_processo_id AND a.excluido_em IS NULL AND a.setor IS NOT NULL
   ORDER BY a.data_informada DESC, a.data DESC, a.created_at DESC
   LIMIT 1;

  SELECT max(a.data) INTO v_data
    FROM public.processo_andamentos a
   WHERE a.processo_id = p_processo_id AND a.excluido_em IS NULL AND a.data_informada;

  UPDATE public.processos_licitatorios
     SET etapa = v_ult.etapa,
         setor_atual = COALESCE(v_setor, setor_atual),
         situacao_atual = v_ult.situacao,
         atualizado_em = COALESCE(v_data, atualizado_em),
         proxima_etapa = v_ult.proxima_etapa,
         proximo_responsavel_servidor_id = v_ult.responsavel_servidor_id,
         proximo_responsavel_nome = v_ult.responsavel_nome,
         proximo_responsavel_setor = v_ult.responsavel_setor,
         prazo_proxima_acao = v_ult.prazo_proxima,
         updated_at = now()
   WHERE id = p_processo_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.processo_recalcular_estado(uuid) FROM PUBLIC, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 4. Busca de servidores para o responsável
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.processo_buscar_servidores(_termo text)
RETURNS TABLE (id uuid, nome text, matricula text, cargo text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT COALESCE(public.can_access_module(auth.uid(), 'compras')
                  AND public.has_permission_code(auth.uid(), 'compras.processos.editar'), false) THEN
    RAISE EXCEPTION 'Requer a permissão de editar processos de contratação.' USING ERRCODE = '42501';
  END IF;
  IF char_length(regexp_replace(coalesce(_termo, ''), '[^[:alnum:]]', '', 'g')) < 3 THEN
    RETURN;
  END IF;
  RETURN QUERY
  SELECT s.id, s.nome_completo::text, s.matricula::text, c.nome::text
    FROM public.servidores s
    LEFT JOIN public.cargos c ON c.id = s.cargo_atual_id
   WHERE s.ativo IS NOT FALSE
     AND (s.nome_completo ILIKE '%' || replace(replace(replace(btrim(_termo), '\', '\\'), '%', '\%'), '_', '\_') || '%'
          OR s.matricula = btrim(_termo))
   ORDER BY s.nome_completo
   LIMIT 20;
END;
$$;
REVOKE ALL ON FUNCTION public.processo_buscar_servidores(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.processo_buscar_servidores(text) TO authenticated;

COMMENT ON FUNCTION public.processo_buscar_servidores(text) IS
  'Servidores ativos por nome ou matrícula (só nome, matrícula e cargo) para escolher o responsável da próxima ação. Exige compras.processos.editar.';

-- ----------------------------------------------------------------------------
-- 5. RLS (gerada de supabase/baseline/rls/mapa.csv por scripts/db/gerar-rls.mjs)
-- ----------------------------------------------------------------------------
-- compras_etapa_parametros  [permissao: compras]
DROP POLICY IF EXISTS "rls_select" ON public.compras_etapa_parametros;
CREATE POLICY "rls_select" ON public.compras_etapa_parametros FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'compras')) AND (public.has_permission_code(auth.uid(), 'compras.processos.visualizar') OR public.has_permission_code(auth.uid(), 'compras.processos.editar'))));
DROP POLICY IF EXISTS "rls_insert" ON public.compras_etapa_parametros;
CREATE POLICY "rls_insert" ON public.compras_etapa_parametros FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras')) AND public.has_permission_code(auth.uid(), 'compras.processos.editar'));
DROP POLICY IF EXISTS "rls_update" ON public.compras_etapa_parametros;
CREATE POLICY "rls_update" ON public.compras_etapa_parametros FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras')) AND public.has_permission_code(auth.uid(), 'compras.processos.editar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras')) AND public.has_permission_code(auth.uid(), 'compras.processos.editar'));
DROP POLICY IF EXISTS "rls_delete" ON public.compras_etapa_parametros;

