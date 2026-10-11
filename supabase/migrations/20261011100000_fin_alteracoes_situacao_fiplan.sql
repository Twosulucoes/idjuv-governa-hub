-- ============================================================================
-- FINANCEIRO — alteração orçamentária nasce no sistema e é confirmada no FIPLAN
-- ============================================================================
-- Spec: docs/superpowers/specs/2026-10-11-financeiro-fiplan-banco-design.md (premissa 4, Etapa 1)
--
--   fin_alteracoes_orcamentarias   + processo_sei, situacao_fiplan (pendente|confirmada),
--                                  confirmado_fiplan_em, confirmado_fiplan_por
--   confirmar_alteracao_fiplan(id) marca a alteração como confirmada no FIPLAN (ação manual).
--
-- Quem confirma: acesso ao módulo financeiro e `orcamento.aprovar` (o catálogo não tem permissão
-- própria de alteração orçamentária; a tela de alterações exige orcamento.criar na rota e
-- orcamento.aprovar é a de aprovação do orçamento). O papel admin passa por has_permission_code.
--
-- A RLS de fin_alteracoes_orcamentarias (classe `modulo` do baseline) deixa quem tem o módulo
-- editar a linha; por isso um trigger impede que a situação no FIPLAN seja mudada direto pela API
-- (papéis anon/authenticated): só a RPC (SECURITY DEFINER, roda como o dono) muda essas colunas.
-- Depois de confirmada no FIPLAN, a alteração também fica travada pela API nos campos que o FIPLAN já
-- registrou: valor, dotações de origem e destino, tipo, exercício e status (processo SEI, observações e
-- demais campos seguem editáveis). A policy de DELETE do baseline (classe `modulo`) não muda aqui.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Colunas
-- ----------------------------------------------------------------------------
ALTER TABLE public.fin_alteracoes_orcamentarias
  ADD COLUMN IF NOT EXISTS processo_sei varchar(50),
  ADD COLUMN IF NOT EXISTS situacao_fiplan text NOT NULL DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS confirmado_fiplan_em timestamptz,
  ADD COLUMN IF NOT EXISTS confirmado_fiplan_por uuid;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                  WHERE conname = 'fin_alteracoes_orcamentarias_situacao_fiplan_check'
                    AND conrelid = 'public.fin_alteracoes_orcamentarias'::regclass) THEN
    ALTER TABLE public.fin_alteracoes_orcamentarias
      ADD CONSTRAINT fin_alteracoes_orcamentarias_situacao_fiplan_check
      CHECK (situacao_fiplan IN ('pendente', 'confirmada'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                  WHERE conname = 'fin_alteracoes_orcamentarias_confirmado_fiplan_por_fkey'
                    AND conrelid = 'public.fin_alteracoes_orcamentarias'::regclass) THEN
    ALTER TABLE public.fin_alteracoes_orcamentarias
      ADD CONSTRAINT fin_alteracoes_orcamentarias_confirmado_fiplan_por_fkey
      FOREIGN KEY (confirmado_fiplan_por) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

COMMENT ON COLUMN public.fin_alteracoes_orcamentarias.processo_sei IS
  'Número do processo SEI que formaliza a alteração.';
COMMENT ON COLUMN public.fin_alteracoes_orcamentarias.situacao_fiplan IS
  'pendente = registrada só no sistema; confirmada = lançada no FIPLAN (marcada por confirmar_alteracao_fiplan).';

CREATE INDEX IF NOT EXISTS idx_fin_alteracoes_situacao_fiplan
  ON public.fin_alteracoes_orcamentarias (exercicio, situacao_fiplan);


-- ----------------------------------------------------------------------------
-- 2. Proteção: a situação no FIPLAN só muda pela RPC; confirmada, os campos do FIPLAN travam
-- ----------------------------------------------------------------------------
-- SECURITY INVOKER de propósito: current_user é o papel de quem executa o comando. Pela API é
-- anon/authenticated; dentro da RPC SECURITY DEFINER é o dono da função.
CREATE OR REPLACE FUNCTION public.fin_alteracoes_proteger_situacao_fiplan()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.situacao_fiplan := 'pendente';
      NEW.confirmado_fiplan_em := NULL;
      NEW.confirmado_fiplan_por := NULL;
    ELSIF NEW.situacao_fiplan IS DISTINCT FROM OLD.situacao_fiplan
       OR NEW.confirmado_fiplan_em IS DISTINCT FROM OLD.confirmado_fiplan_em
       OR NEW.confirmado_fiplan_por IS DISTINCT FROM OLD.confirmado_fiplan_por THEN
      RAISE EXCEPTION 'A situação no FIPLAN só muda pela ação "Confirmar no FIPLAN".' USING ERRCODE = '42501';
    ELSIF OLD.situacao_fiplan = 'confirmada'
      AND (NEW.valor IS DISTINCT FROM OLD.valor
           OR NEW.dotacao_origem_id IS DISTINCT FROM OLD.dotacao_origem_id
           OR NEW.dotacao_destino_id IS DISTINCT FROM OLD.dotacao_destino_id
           OR NEW.tipo IS DISTINCT FROM OLD.tipo
           OR NEW.exercicio IS DISTINCT FROM OLD.exercicio
           OR NEW.status IS DISTINCT FROM OLD.status) THEN
      RAISE EXCEPTION 'Alteração % já confirmada no FIPLAN: valor, dotações, tipo, exercício e status não mudam.', OLD.numero
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.fin_alteracoes_proteger_situacao_fiplan() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_fin_alteracoes_proteger_situacao_fiplan ON public.fin_alteracoes_orcamentarias;
CREATE TRIGGER trg_fin_alteracoes_proteger_situacao_fiplan
  BEFORE INSERT OR UPDATE ON public.fin_alteracoes_orcamentarias
  FOR EACH ROW EXECUTE FUNCTION public.fin_alteracoes_proteger_situacao_fiplan();


-- ----------------------------------------------------------------------------
-- 3. confirmar_alteracao_fiplan
-- ----------------------------------------------------------------------------
-- Idempotente: confirmar de novo devolve a confirmação original (ja_confirmada = true).
-- Alteração cancelada ou rejeitada não pode ser confirmada.
CREATE OR REPLACE FUNCTION public.confirmar_alteracao_fiplan(p_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_alt public.fin_alteracoes_orcamentarias%ROWTYPE;
  v_ja boolean;
BEGIN
  IF v_uid IS NULL
     OR NOT COALESCE(public.perfil_ativo_atual()
                     AND public.can_access_module(v_uid, 'financeiro')
                     AND public.has_permission_code(v_uid, 'orcamento.aprovar'), false) THEN
    RAISE EXCEPTION 'Sem permissão para confirmar alteração no FIPLAN (orcamento.aprovar).' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_alt FROM public.fin_alteracoes_orcamentarias WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Alteração orçamentária não encontrada.' USING ERRCODE = 'P0002';
  END IF;
  IF v_alt.status IN ('cancelado', 'rejeitado') THEN
    RAISE EXCEPTION 'Alteração % está %: não pode ser confirmada no FIPLAN.', v_alt.numero, v_alt.status
      USING ERRCODE = '22023';
  END IF;

  v_ja := v_alt.situacao_fiplan = 'confirmada';
  IF NOT v_ja THEN
    UPDATE public.fin_alteracoes_orcamentarias
       SET situacao_fiplan = 'confirmada',
           confirmado_fiplan_em = now(),
           confirmado_fiplan_por = v_uid,
           updated_at = now()
     WHERE id = p_id
     RETURNING * INTO v_alt;
  END IF;

  RETURN jsonb_build_object(
    'id', v_alt.id,
    'situacao_fiplan', v_alt.situacao_fiplan,
    'confirmado_fiplan_em', v_alt.confirmado_fiplan_em,
    'confirmado_fiplan_por', v_alt.confirmado_fiplan_por,
    'ja_confirmada', v_ja
  );
END;
$$;

COMMENT ON FUNCTION public.confirmar_alteracao_fiplan(uuid) IS
  'Marca a alteração orçamentária como confirmada no FIPLAN (data e autor). Exige o módulo financeiro e orcamento.aprovar.';

REVOKE ALL ON FUNCTION public.confirmar_alteracao_fiplan(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirmar_alteracao_fiplan(uuid) TO authenticated;
