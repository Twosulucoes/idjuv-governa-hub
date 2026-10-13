-- ============================================================================
-- Workflow: processo do SEI, sigilo na RLS e limpeza de triggers
-- ============================================================================
-- Spec (aprovada pelo dono em 2026-10-13): docs/superpowers/specs/2026-10-13-tramitacao-acompanhamento-sei-design.md,
-- seções "Banco", "Sigilo e RLS" e "Limpeza". Segunda migração do acompanhamento do SEI: depois dos modelos
-- (20261013100000) e antes das RPCs (20261013100200), que passam a ser o ÚNICO caminho de escrita nestas tabelas.
-- A aprovação da spec é a confirmação do dono para mudar a RLS existente do workflow (invariante 2 do AGENTS.md).
--
-- Vale nos DOIS estados do banco (do baseline e só pelas migrações). Idempotente: ADD COLUMN IF NOT EXISTS,
-- CREATE ... IF NOT EXISTS, CREATE OR REPLACE, DROP ... IF EXISTS.
--
-- Blocos:
--   1. colunas novas de processos_administrativos (numero_sei, modelo, etapa atual, unidade atual, prazo) e de
--      movimentacoes_processo (etapa de origem e de destino)
--   2. tabela processo_checklist_respostas (respostas do checklist do modelo, por processo) e a trava das etapas de
--      modelo em uso (wf_recusar_etapa_em_uso: não apaga nem renumera etapa onde há processo)
--   3. wf_pode_ver_processo(processo): a regra de sigilo
--   4. policies das seis tabelas do processo: SELECT por wf_pode_ver_processo, DELETE só workflow.admin, sem
--      INSERT/UPDATE para authenticated (classe preservar do supabase/baseline/rls/mapa.csv)
--   5. limpeza: triggers duplicados, triggers de arquivamento (exigiam despacho conclusivo, regra do SEI interno) e
--      fn_pode_arquivar_processo; fn_calcular_sla_processo e fn_contar_processos_por_status respeitam o sigilo;
--      fn_proximo_numero_processo (4 dígitos, sem uso); número interno com trava por ano
--   6. privilégios (mesmas linhas no supabase/baseline/overlay/40_privilegios.sql)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Colunas do processo acompanhado e da movimentação
-- ----------------------------------------------------------------------------
-- numero_sei: opcional na abertura (o processo pode nascer antes de existir no SEI); a RPC normaliza (tira os
-- espaços) e exige o número para sair da etapa 1. Aqui só o mínimo: sem espaço e com algum dígito.
ALTER TABLE public.processos_administrativos
  ADD COLUMN IF NOT EXISTS numero_sei text
    CONSTRAINT processos_administrativos_numero_sei_check CHECK (numero_sei IS NULL OR (numero_sei !~ '\s' AND numero_sei ~ '[0-9]')),
  ADD COLUMN IF NOT EXISTS modelo_id uuid REFERENCES public.processo_modelos(id),
  ADD COLUMN IF NOT EXISTS etapa_atual_ordem integer
    CONSTRAINT processos_administrativos_etapa_atual_ordem_check CHECK (etapa_atual_ordem IS NULL OR etapa_atual_ordem >= 1),
  ADD COLUMN IF NOT EXISTS unidade_atual_id uuid REFERENCES public.estrutura_organizacional(id),
  ADD COLUMN IF NOT EXISTS etapa_iniciada_em timestamptz,
  ADD COLUMN IF NOT EXISTS etapa_prazo_limite date;

-- único quando preenchido (vários processos sem número SEI convivem)
CREATE UNIQUE INDEX IF NOT EXISTS processos_administrativos_numero_sei_key
  ON public.processos_administrativos (numero_sei) WHERE numero_sei IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_processos_admin_modelo ON public.processos_administrativos (modelo_id);
CREATE INDEX IF NOT EXISTS idx_processos_admin_unidade_atual ON public.processos_administrativos (unidade_atual_id);

ALTER TABLE public.movimentacoes_processo
  ADD COLUMN IF NOT EXISTS etapa_origem_ordem integer
    CONSTRAINT movimentacoes_processo_etapa_origem_ordem_check CHECK (etapa_origem_ordem IS NULL OR etapa_origem_ordem >= 1),
  ADD COLUMN IF NOT EXISTS etapa_destino_ordem integer
    CONSTRAINT movimentacoes_processo_etapa_destino_ordem_check CHECK (etapa_destino_ordem IS NULL OR etapa_destino_ordem >= 1);

-- ----------------------------------------------------------------------------
-- 2. Respostas do checklist
-- ----------------------------------------------------------------------------
-- Uma linha por (processo, item do modelo). Escrita só pela RPC wf_marcar_item (migração 20261013100200), que grava
-- marcado_por/marcado_em. O item não é apagado enquanto houver resposta (FK sem cascata).
CREATE TABLE IF NOT EXISTS public.processo_checklist_respostas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id uuid NOT NULL REFERENCES public.processos_administrativos(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.processo_modelo_checklist(id),
  marcado boolean NOT NULL DEFAULT false,
  marcado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  marcado_em timestamptz,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT processo_checklist_respostas_processo_item_key UNIQUE (processo_id, item_id)
);
CREATE INDEX IF NOT EXISTS idx_processo_checklist_respostas_item ON public.processo_checklist_respostas (item_id);

ALTER TABLE public.processo_checklist_respostas ENABLE ROW LEVEL SECURITY;
-- FORCE como as outras tabelas do workflow (o dono também passa pela RLS; as RPCs DEFINER usam o BYPASSRLS do postgres)
ALTER TABLE public.processo_checklist_respostas FORCE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS handle_updated_at ON public.processo_checklist_respostas;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.processo_checklist_respostas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Etapa de modelo em uso: apagar a etapa (ou mudar a ordem/o modelo dela) deixaria o processo que está nela apontando
-- para uma etapa que não existe (a trilha, o checklist e o avanço se perdem). Recusa com 22023 enquanto houver
-- processo (de qualquer situação) com (modelo_id, etapa_atual_ordem) iguais aos da etapa. Vale também na cascata de
-- processo_modelos. DEFINER: a conferência precisa ver os processos sigilosos que a RLS esconderia de quem edita o
-- modelo; a mensagem não diz quantos nem quais. Ninguém executa pela API (trigger não precisa de EXECUTE).
CREATE OR REPLACE FUNCTION public.wf_recusar_etapa_em_uso()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.ordem IS NOT DISTINCT FROM OLD.ordem AND NEW.modelo_id IS NOT DISTINCT FROM OLD.modelo_id THEN
    RETURN NEW;
  END IF;
  IF EXISTS (SELECT 1 FROM public.processos_administrativos p
              WHERE p.modelo_id = OLD.modelo_id AND p.etapa_atual_ordem = OLD.ordem) THEN
    RAISE EXCEPTION 'A etapa % (%) tem processo nela: mova os processos para outra etapa antes de apagá-la ou mudar a ordem.',
      OLD.ordem, OLD.nome USING ERRCODE = '22023';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS wf_recusar_etapa_em_uso ON public.processo_modelo_etapas;
CREATE TRIGGER wf_recusar_etapa_em_uso BEFORE DELETE OR UPDATE OF ordem, modelo_id ON public.processo_modelo_etapas
  FOR EACH ROW EXECUTE FUNCTION public.wf_recusar_etapa_em_uso();

-- ----------------------------------------------------------------------------
-- 3. Regra de sigilo
-- ----------------------------------------------------------------------------
-- O usuário logado (perfil ativo) vê o processo quando:
--   * o processo é público e ele tem o módulo workflow E workflow.visualizar (a permissão avulsa sem o módulo não
--     basta, como na classe permissao do mapa);
--   * ou foi ele quem abriu o processo;
--   * ou tem credencial no processo (acesso_processo_sigiloso);
--   * ou tem workflow.admin (o papel admin passa por has_permission_code).
-- DEFINER: lê processos_administrativos e acesso_processo_sigiloso sem passar pela RLS delas (as policies das seis
-- tabelas a chamam; sem isso a policy de processos_administrativos chamaria a si mesma). Processo inexistente dá
-- false (não revela se o id existe).
CREATE OR REPLACE FUNCTION public.wf_pode_ver_processo(p_processo_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.is_active_user(auth.uid()) AND EXISTS (
    SELECT 1
    FROM public.processos_administrativos p
    WHERE p.id = p_processo_id
      AND (
        (p.sigilo = 'publico'
          AND public.can_access_module(auth.uid(), 'workflow')
          AND public.has_permission_code(auth.uid(), 'workflow.visualizar'))
        OR p.created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM public.acesso_processo_sigiloso a
                   WHERE a.processo_id = p.id AND a.usuario_id = auth.uid())
        OR public.has_permission_code(auth.uid(), 'workflow.admin')
      )
  );
$$;

COMMENT ON FUNCTION public.wf_pode_ver_processo(uuid) IS
  'Sigilo do workflow: público -> módulo workflow + workflow.visualizar; restrito/sigiloso -> criador, credencial em acesso_processo_sigiloso ou workflow.admin. Usada nas policies das tabelas do processo e nas RPCs.';

-- ----------------------------------------------------------------------------
-- 4. Policies das seis tabelas do processo
-- ----------------------------------------------------------------------------
-- Saem todas as policies atuais. No banco (replay das migrações e baseline, conferido com
--   select tablename, policyname from pg_policies where tablename in (...)
-- ) só existem as rls_* geradas pelo mapa (migração 20261010200000); as da FASE 6 (20260202025914), as proc_*
-- (20260208203349) e as acesso_total_* já tinham saído, e entram aqui só por segurança (DROP IF EXISTS).
DO $$
DECLARE
  t text;
  nomes text[];
BEGIN
  FOREACH t IN ARRAY ARRAY['processos_administrativos', 'movimentacoes_processo', 'despachos', 'documentos_processo',
                           'prazos_processo', 'processo_checklist_respostas'] LOOP
    nomes := ARRAY['rls_select', 'rls_insert', 'rls_update', 'rls_delete',
                   'acesso_total_select', 'acesso_total_insert', 'acesso_total_update', 'acesso_total_delete',
                   'proc_' || t || '_select', 'proc_' || t || '_insert', 'proc_' || t || '_update', 'proc_' || t || '_delete',
                   'wf_select', 'wf_delete'];
    -- FASE 6 (20260202025914)
    nomes := nomes || CASE t
      WHEN 'processos_administrativos' THEN ARRAY['processos_admin_select', 'processos_admin_insert', 'processos_admin_update']
      WHEN 'movimentacoes_processo' THEN ARRAY['movimentacoes_select', 'movimentacoes_insert', 'movimentacoes_update']
      WHEN 'despachos' THEN ARRAY['despachos_select', 'despachos_insert']
      WHEN 'documentos_processo' THEN ARRAY['documentos_processo_select', 'documentos_processo_insert']
      WHEN 'prazos_processo' THEN ARRAY['prazos_processo_select', 'prazos_processo_insert', 'prazos_processo_update']
      ELSE ARRAY[]::text[] END;
    FOR i IN 1 .. array_length(nomes, 1) LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', nomes[i], t);
    END LOOP;
  END LOOP;
END $$;

-- Sobra de policy com outro nome (banco que divergiu do histórico) abriria o sigilo: as policies são permissivas
-- (OR). Sai também, com aviso.
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('processos_administrativos', 'movimentacoes_processo', 'despachos', 'documentos_processo',
                        'prazos_processo', 'processo_checklist_respostas')
  LOOP
    RAISE NOTICE 'removendo policy fora do histórico: %.%', pol.tablename, pol.policyname;
    EXECUTE format('DROP POLICY %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- SELECT pelo sigilo; DELETE só workflow.admin; nenhuma policy de INSERT/UPDATE (escrita só pelas RPCs DEFINER)
CREATE POLICY "wf_select" ON public.processos_administrativos FOR SELECT TO authenticated
  USING (public.wf_pode_ver_processo(id));
CREATE POLICY "wf_delete" ON public.processos_administrativos FOR DELETE TO authenticated
  USING (public.has_permission_code(auth.uid(), 'workflow.admin'));

CREATE POLICY "wf_select" ON public.movimentacoes_processo FOR SELECT TO authenticated
  USING (public.wf_pode_ver_processo(processo_id));
CREATE POLICY "wf_delete" ON public.movimentacoes_processo FOR DELETE TO authenticated
  USING (public.has_permission_code(auth.uid(), 'workflow.admin'));

CREATE POLICY "wf_select" ON public.despachos FOR SELECT TO authenticated
  USING (public.wf_pode_ver_processo(processo_id));
CREATE POLICY "wf_delete" ON public.despachos FOR DELETE TO authenticated
  USING (public.has_permission_code(auth.uid(), 'workflow.admin'));

CREATE POLICY "wf_select" ON public.documentos_processo FOR SELECT TO authenticated
  USING (public.wf_pode_ver_processo(processo_id));
CREATE POLICY "wf_delete" ON public.documentos_processo FOR DELETE TO authenticated
  USING (public.has_permission_code(auth.uid(), 'workflow.admin'));

CREATE POLICY "wf_select" ON public.prazos_processo FOR SELECT TO authenticated
  USING (public.wf_pode_ver_processo(processo_id));
CREATE POLICY "wf_delete" ON public.prazos_processo FOR DELETE TO authenticated
  USING (public.has_permission_code(auth.uid(), 'workflow.admin'));

CREATE POLICY "wf_select" ON public.processo_checklist_respostas FOR SELECT TO authenticated
  USING (public.wf_pode_ver_processo(processo_id));
CREATE POLICY "wf_delete" ON public.processo_checklist_respostas FOR DELETE TO authenticated
  USING (public.has_permission_code(auth.uid(), 'workflow.admin'));

-- ----------------------------------------------------------------------------
-- 5. Limpeza
-- ----------------------------------------------------------------------------
-- Triggers encontrados (replay das migrações e baseline, iguais), com
--   select tgrelid::regclass, tgname, tgfoid::regproc from pg_trigger where not tgisinternal and tgrelid in (...)
-- Auditoria em dobro (fn_audit_log_licitacoes): ficam os audit_* (20260202025914), saem os tr_audit_* (20260202033746).
DROP TRIGGER IF EXISTS tr_audit_processos ON public.processos_administrativos;
DROP TRIGGER IF EXISTS tr_audit_movimentacoes ON public.movimentacoes_processo;
DROP TRIGGER IF EXISTS tr_audit_despachos ON public.despachos;
-- updated_at em dobro (handle_updated_at): fica o trigger handle_updated_at, saem os tr_updated_at_*
DROP TRIGGER IF EXISTS tr_updated_at_processos ON public.processos_administrativos;
DROP TRIGGER IF EXISTS tr_updated_at_movimentacoes ON public.movimentacoes_processo;
DROP TRIGGER IF EXISTS tr_updated_at_despachos ON public.despachos;
DROP TRIGGER IF EXISTS tr_updated_at_documentos_processo ON public.documentos_processo;
DROP TRIGGER IF EXISTS tr_updated_at_prazos_processo ON public.prazos_processo;
-- Arquivar exigia despacho conclusivo (regra do SEI interno); agora é a RPC wf_arquivar com workflow.arquivar.
-- As duas funções de trigger só serviam a estes triggers e saem junto (fn_pode_arquivar_processo sai logo abaixo).
DROP TRIGGER IF EXISTS tr_verificar_arquivamento ON public.processos_administrativos;
DROP TRIGGER IF EXISTS tr_validar_arquivamento ON public.processos_administrativos;
DROP FUNCTION IF EXISTS public.verificar_arquivamento_processo();
DROP FUNCTION IF EXISTS public.fn_validar_arquivamento_processo();
-- Segundo gerador de número (4 dígitos), sem uso no código; o número vem do trigger tr_gerar_numero_processo
DROP FUNCTION IF EXISTS public.fn_proximo_numero_processo(integer);
-- fn_pode_arquivar_processo só servia ao trigger de arquivamento e, DEFINER, respondia sobre o despacho de qualquer
-- processo (inclusive sigiloso) a quem a chamasse; sem uso no front
DROP FUNCTION IF EXISTS public.fn_pode_arquivar_processo(uuid);

-- Funções antigas de leitura do workflow passam a respeitar o sigilo.
-- fn_calcular_sla_processo (DEFINER): processo que o usuário não vê (ou inexistente) devolve nenhuma linha, sem erro
-- próprio (não revela se o id existe).
CREATE OR REPLACE FUNCTION public.fn_calcular_sla_processo(p_processo_id uuid)
RETURNS TABLE(dias_aberto integer, dias_ultima_movimentacao integer, status_sla text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_data_abertura date;
  v_ultima_mov timestamptz;
  v_dias_aberto integer;
  v_dias_mov integer;
BEGIN
  IF NOT coalesce(public.wf_pode_ver_processo(p_processo_id), false) THEN
    RETURN;
  END IF;
  SELECT p.data_abertura, (SELECT max(m.created_at) FROM public.movimentacoes_processo m WHERE m.processo_id = p.id)
    INTO v_data_abertura, v_ultima_mov
    FROM public.processos_administrativos p
   WHERE p.id = p_processo_id;
  v_dias_aberto := current_date - v_data_abertura;
  v_dias_mov := CASE WHEN v_ultima_mov IS NOT NULL THEN current_date - v_ultima_mov::date ELSE v_dias_aberto END;
  RETURN QUERY SELECT v_dias_aberto, v_dias_mov,
    CASE WHEN v_dias_mov > 30 THEN 'critico' WHEN v_dias_mov > 15 THEN 'atencao' ELSE 'normal' END::text;
END;
$$;

-- fn_contar_processos_por_status: vira INVOKER e a RLS de processos_administrativos (wf_pode_ver_processo) decide o
-- que entra na contagem; antes, DEFINER, contava também os sigilosos para quem tinha workflow.visualizar
CREATE OR REPLACE FUNCTION public.fn_contar_processos_por_status()
RETURNS TABLE(status text, quantidade bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT p.status::text, count(*)::bigint
  FROM public.processos_administrativos p
  GROUP BY p.status;
$$;

-- Número interno (00001/ano): a trava por ano serializa as aberturas simultâneas antes do MAX+1 (sem ela, duas
-- aberturas no mesmo instante liam o mesmo MAX e uma caía no UNIQUE (numero_processo, ano)). DEFINER: precisa ver
-- todos os processos do ano, inclusive os que a RLS esconde de quem abre.
CREATE OR REPLACE FUNCTION public.gerar_numero_processo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_ano integer;
  v_sequencial integer;
BEGIN
  v_ano := coalesce(NEW.ano, extract(year FROM now())::integer);
  PERFORM pg_advisory_xact_lock(hashtext('processo_numero_' || v_ano));
  SELECT coalesce(max(CASE WHEN numero_processo ~ '^\d+$' THEN numero_processo::integer ELSE 0 END), 0) + 1
    INTO v_sequencial
    FROM public.processos_administrativos
   WHERE ano = v_ano;
  NEW.numero_processo := lpad(v_sequencial::text, 5, '0');
  NEW.ano := v_ano;
  RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- 6. Privilégios
-- ----------------------------------------------------------------------------
REVOKE ALL ON public.processo_checklist_respostas FROM anon;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.processo_checklist_respostas FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.wf_pode_ver_processo(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.wf_pode_ver_processo(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.wf_recusar_etapa_em_uso() FROM PUBLIC, anon, authenticated, service_role;
