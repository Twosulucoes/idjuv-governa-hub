-- ============================================================================
-- COMPRAS — processos SEI, P1: editar e excluir movimentação, com motivo e trilha; estado do processo recalculado
-- ============================================================================
-- Plano aprovado pelo dono em 2026-11-07 ("pode fazer"): docs/superpowers/plans/2026-11-07-processos-sei-p1-andamento.md
--
--   processo_andamentos            ganha exclusão lógica (excluido_em/por/motivo) e o motivo da última edição
--                                  (alteracao_motivo, alterado_em/por). A policy de UPDATE que já existia
--                                  (compras.processos.editar) continua a mesma; o DELETE continua sem policy: excluir
--                                  é marcar como excluída, a linha fica guardada.
--   processo_andamento_alteracoes  trilha de cada edição e exclusão (antes, depois, motivo, quem, quando), gravada pelo
--                                  gatilho; ninguém escreve nela pela API e ela não muda (trilha_imutavel).
--   processo_recalcular_estado     etapa, setor, situação e última movimentação do processo saem sempre da
--                                  movimentação mais recente QUE NÃO FOI EXCLUÍDA, e a com data ganha da sem data
--                                  (antes, a sem data da carga da planilha ficava com a data do dia da carga e
--                                  impedia que uma movimentação com a data real do SEI virasse o estado do processo).
--
-- Nenhum dado existente muda nesta migração: o recálculo acontece quando a movimentação do processo é incluída,
-- editada ou excluída. Nenhuma policy existente muda. Idempotente.
-- ============================================================================

SET lock_timeout = '10s';

-- ----------------------------------------------------------------------------
-- 1. Colunas novas em processo_andamentos
-- ----------------------------------------------------------------------------
ALTER TABLE public.processo_andamentos
  ADD COLUMN IF NOT EXISTS excluido_em timestamptz,
  ADD COLUMN IF NOT EXISTS excluido_por uuid,
  ADD COLUMN IF NOT EXISTS excluido_motivo text,
  ADD COLUMN IF NOT EXISTS alterado_em timestamptz,
  ADD COLUMN IF NOT EXISTS alterado_por uuid,
  ADD COLUMN IF NOT EXISTS alteracao_motivo text;

ALTER TABLE public.processo_andamentos DROP CONSTRAINT IF EXISTS processo_andamentos_exclusao_check;
ALTER TABLE public.processo_andamentos ADD CONSTRAINT processo_andamentos_exclusao_check CHECK (
  (excluido_em IS NULL AND excluido_motivo IS NULL)
  OR (excluido_em IS NOT NULL AND char_length(btrim(excluido_motivo)) BETWEEN 3 AND 500));
ALTER TABLE public.processo_andamentos DROP CONSTRAINT IF EXISTS processo_andamentos_alteracao_motivo_check;
ALTER TABLE public.processo_andamentos ADD CONSTRAINT processo_andamentos_alteracao_motivo_check CHECK (
  alteracao_motivo IS NULL OR char_length(btrim(alteracao_motivo)) BETWEEN 3 AND 500);

COMMENT ON COLUMN public.processo_andamentos.excluido_em IS
  'Movimentação excluída (exclusão lógica): some da linha do tempo e não conta para o estado do processo; a linha e o motivo ficam guardados.';
COMMENT ON COLUMN public.processo_andamentos.alteracao_motivo IS
  'Motivo da última edição (obrigatório em toda edição; o histórico completo fica em processo_andamento_alteracoes).';

-- ----------------------------------------------------------------------------
-- 2. Trilha das edições e exclusões
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.processo_andamento_alteracoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  andamento_id uuid NOT NULL REFERENCES public.processo_andamentos(id) ON DELETE CASCADE,
  processo_id uuid NOT NULL REFERENCES public.processos_licitatorios(id) ON DELETE CASCADE,
  acao text NOT NULL CHECK (acao = ANY (ARRAY['edicao', 'exclusao'])),
  antes jsonb NOT NULL,
  depois jsonb,
  motivo text NOT NULL CHECK (char_length(btrim(motivo)) BETWEEN 3 AND 500),
  feito_em timestamptz NOT NULL DEFAULT now(),
  feito_por uuid
);
ALTER TABLE public.processo_andamento_alteracoes ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.processo_andamento_alteracoes IS
  'Trilha das edições e exclusões das movimentações do processo de contratação (gatilho processo_andamento_registrar_alteracao); imutável.';

CREATE INDEX IF NOT EXISTS idx_processo_andamento_alteracoes_processo
  ON public.processo_andamento_alteracoes (processo_id, feito_em DESC);
CREATE INDEX IF NOT EXISTS idx_processo_andamento_alteracoes_andamento
  ON public.processo_andamento_alteracoes (andamento_id);

DROP TRIGGER IF EXISTS trilha_imutavel ON public.processo_andamento_alteracoes;
CREATE TRIGGER trilha_imutavel BEFORE DELETE OR UPDATE ON public.processo_andamento_alteracoes
  FOR EACH ROW EXECUTE FUNCTION public.trilha_imutavel('andamento_id', 'processo_andamentos');

-- ----------------------------------------------------------------------------
-- 3. Estado do processo a partir das movimentações
-- ----------------------------------------------------------------------------
-- A movimentação que vale: não excluída, a com data antes da sem data, depois a data mais recente e a gravada por
-- último. Sem nenhuma movimentação válida, o processo fica como está (os dados podem ter vindo da planilha).
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
         updated_at = now()
   WHERE id = p_processo_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.processo_recalcular_estado(uuid) FROM PUBLIC, anon, authenticated;

COMMENT ON FUNCTION public.processo_recalcular_estado(uuid) IS
  'Copia para o processo a etapa, o setor e a situação da movimentação que vale (não excluída; com data antes da sem data; mais recente) e a data da última movimentação com data. Só os gatilhos de processo_andamentos chamam.';

-- Depois de inserir: o estado do processo é recalculado (substitui a regra "só se for a mais recente pela data").
CREATE OR REPLACE FUNCTION public.processo_andamento_no_processo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.processo_recalcular_estado(NEW.processo_id);
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.processo_andamento_no_processo() FROM PUBLIC, anon, authenticated;

-- Antes de inserir: autoria pelo banco; movimentação nova nunca nasce excluída nem editada.
CREATE OR REPLACE FUNCTION public.processo_andamento_carimbar()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
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
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.processo_andamento_carimbar() FROM PUBLIC, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 4. Edição e exclusão (UPDATE pela policy que já existe, com as regras no gatilho)
-- ----------------------------------------------------------------------------
-- Excluir: UPDATE com excluido_em preenchido e excluido_motivo (3 a 500 caracteres); os demais campos ficam como
-- estavam e o banco carimba quando e quem. Editar: UPDATE de data, etapa, setor e/ou situação com alteracao_motivo
-- novo (3 a 500 caracteres); informar a data de uma movimentação sem data a marca como "com data". Excluída não muda
-- mais. Processo, autoria e criação nunca mudam.
CREATE OR REPLACE FUNCTION public.processo_andamento_alterar()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
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
    NEW.alterado_em := OLD.alterado_em;
    NEW.alterado_por := OLD.alterado_por;
    NEW.alteracao_motivo := OLD.alteracao_motivo;
    RETURN NEW;
  END IF;

  NEW.excluido_por := NULL;
  NEW.excluido_motivo := NULL;
  NEW.setor := NULLIF(btrim(NEW.setor), '');
  NEW.situacao := btrim(NEW.situacao);
  IF NEW.data IS DISTINCT FROM OLD.data THEN
    NEW.data_informada := true;
  END IF;

  IF (NEW.data, NEW.data_informada, NEW.etapa, NEW.setor, NEW.situacao)
     IS NOT DISTINCT FROM (OLD.data, OLD.data_informada, OLD.etapa, OLD.setor, OLD.situacao) THEN
    RETURN OLD;  -- nada mudou: não grava nem vai para a trilha
  END IF;

  IF NEW.data > CURRENT_DATE THEN
    RAISE EXCEPTION 'A data da movimentação não pode ser futura.' USING ERRCODE = '22023';
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

-- Depois da edição ou exclusão: trilha e recálculo do estado do processo. SECURITY DEFINER: ninguém escreve na trilha
-- pela API, e o processo é atualizado sem depender da policy de UPDATE dele.
CREATE OR REPLACE FUNCTION public.processo_andamento_registrar_alteracao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_antes jsonb := jsonb_build_object('data', OLD.data, 'data_informada', OLD.data_informada, 'etapa', OLD.etapa,
                                      'setor', OLD.setor, 'situacao', OLD.situacao);
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
                               'setor', NEW.setor, 'situacao', NEW.situacao),
            NEW.alteracao_motivo, auth.uid());
  END IF;
  PERFORM public.processo_recalcular_estado(NEW.processo_id);
  RETURN NULL;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.processo_andamento_registrar_alteracao() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_processo_andamentos_alterar ON public.processo_andamentos;
CREATE TRIGGER trg_processo_andamentos_alterar BEFORE UPDATE ON public.processo_andamentos
  FOR EACH ROW EXECUTE FUNCTION public.processo_andamento_alterar();
DROP TRIGGER IF EXISTS trg_processo_andamentos_registrar_alteracao ON public.processo_andamentos;
CREATE TRIGGER trg_processo_andamentos_registrar_alteracao AFTER UPDATE ON public.processo_andamentos
  FOR EACH ROW EXECUTE FUNCTION public.processo_andamento_registrar_alteracao();

-- ----------------------------------------------------------------------------
-- 5. RLS (gerada de supabase/baseline/rls/mapa.csv por scripts/db/gerar-rls.mjs)
-- ----------------------------------------------------------------------------
-- processo_andamento_alteracoes  [trilha: compras]
DROP POLICY IF EXISTS "rls_select" ON public.processo_andamento_alteracoes;
CREATE POLICY "rls_select" ON public.processo_andamento_alteracoes FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras')) AND (public.has_permission_code(auth.uid(), 'compras.processos.visualizar') OR public.has_permission_code(auth.uid(), 'compras.processos.editar')));

