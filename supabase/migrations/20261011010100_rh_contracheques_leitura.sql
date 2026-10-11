-- ============================================================================
-- Onda E3 do RH — leitura dos contracheques por permissão e fim do DELETE pela API em remessas e eventos do eSocial
-- ============================================================================
-- Spec: docs/superpowers/specs/2026-10-11-rh-vazamentos-arquivos-design.md (item 1 de "O que muda", premissas 1 e 2;
-- itens 3 e 4: "sem DELETE pela API")
-- Levantamento: docs/planejamento/REVISAO_RH.md (seção 5, riscos 2 e 4)
--
-- Separada de 20261011010000_rh_cnab_esocial_integridade.sql porque MUDA RLS EXISTENTE (decisão 3 da revisão do RH:
-- o dono decide no merge). Pode ser segurada sem segurar a 20261011010000; sem ela, quem tem o módulo rh continua
-- lendo os contracheques de todos e apagando remessas e eventos do eSocial, como hoje.
-- Vale nos dois estados do banco (baseline e só migrações) e é idempotente (ON CONFLICT DO NOTHING, DROP/CREATE
-- POLICY, REVOKE).
--
-- 1. Permissão nova rh.contracheques.visualizar (módulo rh), concedida aos papéis admin e manager. Por que não
--    financeiro.folha.visualizar (premissa 2 da spec): o catálogo dá essa permissão ao papel `user`
--    (role_permissions; a carga de 20260916120000 dá ao `user` todo código com action_type = 'visualizar') e
--    get_user_permission_codes a soma a quem tem o módulo rh; o backfill daquela migração também a gravou em
--    user_modules.permissions de quem tinha o módulo sem permissões. Na prática todo usuário do RH a tem: restringir por
--    ela não restringiria nada. action_type 'consultar' (e não 'visualizar'), para nenhuma carga por action_type a dar
--    ao papel `user`; carga futura precisa excluir este código de propósito.
-- 2. fichas_financeiras e itens_ficha_financeira: o módulo rh lê com rh.contracheques.visualizar OU
--    financeiro.folha.processar (quem processa a folha confere as fichas antes de fechar); o servidor continua lendo as
--    próprias (posse por meu_servidor_id(), sem código). Escrita sem mudança. Classe permissao com o sufixo novo
--    ;leitura= do gerador (supabase/baseline/rls/mapa.csv); cópia literal de supabase/baseline/rls/35_policies_geradas.sql.
--    folhas_pagamento fica como está: tem só os totais da folha (o caminho do vazamento eram as fichas e os itens).
-- 3. remessas_bancarias e eventos_esocial: sem policy de DELETE (sufixo excluir=ninguem do gerador) e sem o privilégio
--    DELETE para authenticated (a API recebe 42501 em vez de "0 linhas"). A remessa é cancelada pela RPC
--    cancelar_remessa (20261011010000); a retificação de evento do eSocial fica para a onda G. A service role continua
--    podendo apagar (operação manual, fora da API do navegador).
-- Front: a rota /rh/contracheques e os itens de menu usam rh.contracheques.visualizar (ROUTE_PERMISSIONS).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Permissão de leitura dos contracheques
-- ----------------------------------------------------------------------------
INSERT INTO public.module_permissions_catalog
  (module_code, permission_code, label, description, category, action_type, sort_order)
VALUES
  ('rh', 'rh.contracheques.visualizar', 'Visualizar Contracheques de Outros Servidores',
   'Lê fichas financeiras e itens (contracheques) de todos os servidores; o servidor sempre lê o próprio',
   'Folha', 'consultar', 511)
ON CONFLICT (permission_code) DO NOTHING;

INSERT INTO public.role_permissions (role, permission)
VALUES ('admin', 'rh.contracheques.visualizar'), ('manager', 'rh.contracheques.visualizar')
ON CONFLICT (role, permission) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2 e 3. Policies (gerado por scripts/db/gerar-rls.mjs; cópia literal de supabase/baseline/rls/35_policies_geradas.sql)
-- ----------------------------------------------------------------------------
-- fichas_financeiras  [permissao: rh]
DROP POLICY IF EXISTS "rls_select" ON public.fichas_financeiras;
CREATE POLICY "rls_select" ON public.fichas_financeiras FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.contracheques.visualizar') OR public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.fichas_financeiras;
CREATE POLICY "rls_insert" ON public.fichas_financeiras FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_update" ON public.fichas_financeiras;
CREATE POLICY "rls_update" ON public.fichas_financeiras FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_delete" ON public.fichas_financeiras;
CREATE POLICY "rls_delete" ON public.fichas_financeiras FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));

-- itens_ficha_financeira  [permissao: rh]
DROP POLICY IF EXISTS "rls_select" ON public.itens_ficha_financeira;
CREATE POLICY "rls_select" ON public.itens_ficha_financeira FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.contracheques.visualizar') OR public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))) OR EXISTS (SELECT 1 FROM public.fichas_financeiras p WHERE p.id = itens_ficha_financeira.ficha_id AND p.servidor_id = public.meu_servidor_id()));
DROP POLICY IF EXISTS "rls_insert" ON public.itens_ficha_financeira;
CREATE POLICY "rls_insert" ON public.itens_ficha_financeira FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_update" ON public.itens_ficha_financeira;
CREATE POLICY "rls_update" ON public.itens_ficha_financeira FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_delete" ON public.itens_ficha_financeira;
CREATE POLICY "rls_delete" ON public.itens_ficha_financeira FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));

-- remessas_bancarias  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.remessas_bancarias;
CREATE POLICY "rls_select" ON public.remessas_bancarias FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.remessas_bancarias;
CREATE POLICY "rls_insert" ON public.remessas_bancarias FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.remessas_bancarias;
CREATE POLICY "rls_update" ON public.remessas_bancarias FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.remessas_bancarias;

-- eventos_esocial  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.eventos_esocial;
CREATE POLICY "rls_select" ON public.eventos_esocial FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.eventos_esocial;
CREATE POLICY "rls_insert" ON public.eventos_esocial FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.eventos_esocial;
CREATE POLICY "rls_update" ON public.eventos_esocial FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.eventos_esocial;

-- Sem DELETE também por privilégio (mesma linha no supabase/baseline/overlay/40_privilegios.sql)
REVOKE DELETE ON public.remessas_bancarias, public.eventos_esocial FROM anon, authenticated;

-- Aviso (não erro): policy fora das rls_* nestas quatro tabelas (criada fora das migrações no banco ao vivo). Policies
-- permissivas são OR: uma assim manteria a leitura ampla dos contracheques ou o DELETE e precisa ser revista à mão.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT tablename, policyname FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename IN ('fichas_financeiras', 'itens_ficha_financeira', 'remessas_bancarias', 'eventos_esocial')
       AND policyname NOT IN ('rls_select', 'rls_insert', 'rls_update', 'rls_delete')
  LOOP
    RAISE WARNING 'public.%: a policy "%" não é do gerador e soma (OR) com as rls_*; revise', r.tablename, r.policyname;
  END LOOP;
END $$;
