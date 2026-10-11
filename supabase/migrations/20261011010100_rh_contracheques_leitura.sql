-- ============================================================================
-- Onda E3 do RH — leitura de contracheques e remuneração por permissão; remessas e eSocial sem DELETE pela API
-- ============================================================================
-- Spec: docs/superpowers/specs/2026-10-11-rh-vazamentos-arquivos-design.md (item 1 de "O que muda", premissas 1 e 2;
-- itens 3 e 4: "sem DELETE pela API")
-- Levantamento: docs/planejamento/REVISAO_RH.md (seção 5, riscos 2 e 4)
--
-- Separada de 20261011010000_rh_cnab_esocial_integridade.sql porque MUDA RLS EXISTENTE (decisão 3 da revisão do RH:
-- o dono decide no merge). Pode ser segurada sem segurar a 20261011010000; sem ela, quem tem o módulo rh continua
-- lendo contracheques, lançamentos, consignações, pensões e eventos do eSocial de todos e apagando remessas e eventos,
-- como hoje.
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
-- 2. Leitura de remuneração e dado bancário por pessoa: o módulo rh lê com rh.contracheques.visualizar OU
--    financeiro.folha.processar (quem processa a folha confere antes de fechar), sufixo ;leitura= do gerador
--    (supabase/baseline/rls/mapa.csv; cópia literal de supabase/baseline/rls/35_policies_geradas.sql):
--      fichas_financeiras e itens_ficha_financeira (o servidor continua lendo as próprias, posse por meu_servidor_id());
--      lancamentos_folha (rubricas calculadas por ficha) e consignacoes (parcela e saldo devedor por servidor);
--      eventos_esocial (payload com CPF e remuneração);
--      pensoes_alimenticias (CPF e conta do beneficiário, valor) e itens_retorno_bancario (valor pago por servidor).
--    Escrita: as quatro primeiras já exigiam financeiro.folha.processar (B1); eventos_esocial, pensoes_alimenticias e
--    itens_retorno_bancario passam a exigir (antes bastava o módulo). folhas_pagamento fica como está (só totais).
-- 3. remessas_bancarias: o módulo rh continua lendo (só totais da folha; o arquivo, com conta por servidor, fica no
--    bucket remessas-cnab, que já exige financeiro.folha.processar); INSERT e UPDATE passam a exigir
--    financeiro.folha.processar. remessas_bancarias e eventos_esocial: sem policy de DELETE (sufixo excluir=ninguem) e
--    sem o privilégio DELETE para authenticated (a API recebe 42501 em vez de "0 linhas"). A remessa é cancelada pela
--    RPC cancelar_remessa (20261011010000); a retificação de evento do eSocial fica para a onda G. A service role
--    continua podendo apagar (operação manual, fora da API do navegador).
-- 4. Fora desta migração (sem remuneração por pessoa na linha, ou exigem outra solução): retornos_bancarios e
--    exportacoes_folha (totais por arquivo), dependentes_irrf (dado pessoal de dependente, sem valor),
--    adicionais_tempo_servico (registro funcional do RH), as colunas de remuneração e banco de servidores,
--    vinculos_servidor e pre_cadastros (RLS é por linha: pede view ou privilégio por coluna) — ver docs/BANCO_DE_DADOS.md.
-- Front: a rota /rh/contracheques e os itens de menu usam rh.contracheques.visualizar (ROUTE_PERMISSIONS).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Permissão de leitura dos contracheques
-- ----------------------------------------------------------------------------
INSERT INTO public.module_permissions_catalog
  (module_code, permission_code, label, description, category, action_type, sort_order)
VALUES
  ('rh', 'rh.contracheques.visualizar', 'Visualizar Contracheques de Outros Servidores',
   'Lê contracheques (fichas e itens), lançamentos, consignações, pensões, retorno bancário e eventos do eSocial de todos os servidores; o servidor sempre lê o próprio contracheque',
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
-- lancamentos_folha  [permissao: rh]
DROP POLICY IF EXISTS "rls_select" ON public.lancamentos_folha;
CREATE POLICY "rls_select" ON public.lancamentos_folha FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.contracheques.visualizar') OR public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))));
DROP POLICY IF EXISTS "rls_insert" ON public.lancamentos_folha;
CREATE POLICY "rls_insert" ON public.lancamentos_folha FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_update" ON public.lancamentos_folha;
CREATE POLICY "rls_update" ON public.lancamentos_folha FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_delete" ON public.lancamentos_folha;
CREATE POLICY "rls_delete" ON public.lancamentos_folha FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
-- consignacoes  [permissao: rh]
DROP POLICY IF EXISTS "rls_select" ON public.consignacoes;
CREATE POLICY "rls_select" ON public.consignacoes FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.contracheques.visualizar') OR public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))));
DROP POLICY IF EXISTS "rls_insert" ON public.consignacoes;
CREATE POLICY "rls_insert" ON public.consignacoes FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_update" ON public.consignacoes;
CREATE POLICY "rls_update" ON public.consignacoes FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_delete" ON public.consignacoes;
CREATE POLICY "rls_delete" ON public.consignacoes FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
-- pensoes_alimenticias  [permissao: rh]
DROP POLICY IF EXISTS "rls_select" ON public.pensoes_alimenticias;
CREATE POLICY "rls_select" ON public.pensoes_alimenticias FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.contracheques.visualizar') OR public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))));
DROP POLICY IF EXISTS "rls_insert" ON public.pensoes_alimenticias;
CREATE POLICY "rls_insert" ON public.pensoes_alimenticias FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_update" ON public.pensoes_alimenticias;
CREATE POLICY "rls_update" ON public.pensoes_alimenticias FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_delete" ON public.pensoes_alimenticias;
CREATE POLICY "rls_delete" ON public.pensoes_alimenticias FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
-- itens_retorno_bancario  [permissao: rh]
DROP POLICY IF EXISTS "rls_select" ON public.itens_retorno_bancario;
CREATE POLICY "rls_select" ON public.itens_retorno_bancario FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.contracheques.visualizar') OR public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))));
DROP POLICY IF EXISTS "rls_insert" ON public.itens_retorno_bancario;
CREATE POLICY "rls_insert" ON public.itens_retorno_bancario FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_update" ON public.itens_retorno_bancario;
CREATE POLICY "rls_update" ON public.itens_retorno_bancario FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_delete" ON public.itens_retorno_bancario;
CREATE POLICY "rls_delete" ON public.itens_retorno_bancario FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
-- eventos_esocial  [permissao: rh]
DROP POLICY IF EXISTS "rls_select" ON public.eventos_esocial;
CREATE POLICY "rls_select" ON public.eventos_esocial FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.contracheques.visualizar') OR public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))));
DROP POLICY IF EXISTS "rls_insert" ON public.eventos_esocial;
CREATE POLICY "rls_insert" ON public.eventos_esocial FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_update" ON public.eventos_esocial;
CREATE POLICY "rls_update" ON public.eventos_esocial FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_delete" ON public.eventos_esocial;
-- remessas_bancarias  [permissao: rh]
DROP POLICY IF EXISTS "rls_select" ON public.remessas_bancarias;
CREATE POLICY "rls_select" ON public.remessas_bancarias FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.remessas_bancarias;
CREATE POLICY "rls_insert" ON public.remessas_bancarias FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_update" ON public.remessas_bancarias;
CREATE POLICY "rls_update" ON public.remessas_bancarias FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_delete" ON public.remessas_bancarias;

-- Sem DELETE também por privilégio (mesma linha no supabase/baseline/overlay/40_privilegios.sql)
REVOKE DELETE ON public.remessas_bancarias, public.eventos_esocial FROM anon, authenticated;

-- Aviso (não erro): policy fora das rls_* nestas oito tabelas (criada fora das migrações no banco ao vivo). Policies
-- permissivas são OR: uma assim manteria a leitura ampla dos contracheques ou o DELETE e precisa ser revista à mão.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT tablename, policyname FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename IN ('fichas_financeiras', 'itens_ficha_financeira', 'lancamentos_folha', 'consignacoes',
                         'pensoes_alimenticias', 'itens_retorno_bancario', 'eventos_esocial', 'remessas_bancarias')
       AND policyname NOT IN ('rls_select', 'rls_insert', 'rls_update', 'rls_delete')
  LOOP
    RAISE WARNING 'public.%: a policy "%" não é do gerador e soma (OR) com as rls_*; revise', r.tablename, r.policyname;
  END LOOP;
END $$;
