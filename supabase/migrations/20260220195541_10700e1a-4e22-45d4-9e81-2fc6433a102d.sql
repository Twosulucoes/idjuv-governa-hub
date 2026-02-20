
-- ============================================================
-- FASE DE TESTE: VIEW DIAGNÓSTICO + PILOTO RLS NO MÓDULO RH
-- Objetivo: testar a estratégia em 1 módulo antes de escalar
-- ============================================================

-- 1. VIEW DE DIAGNÓSTICO — mapa completo de acessos por usuário
CREATE OR REPLACE VIEW public.v_diagnostico_acessos
WITH (security_invoker = on)
AS
SELECT
  p.id as user_id,
  p.email,
  p.full_name,
  p.is_active,
  COALESCE(STRING_AGG(DISTINCT ur.role::text, ', '), 'nenhum') as roles,
  COALESCE(STRING_AGG(DISTINCT um.module::text, ', ' ORDER BY um.module::text), 'nenhum') as modulos,
  CASE
    WHEN bool_or(ur.role = 'admin') THEN 'SUPER_ADMIN'
    WHEN COUNT(um.module) > 0 THEN 'MODULAR'
    ELSE 'SEM_ACESSO'
  END as tipo_acesso,
  CASE
    WHEN bool_or(ur.role = 'admin') THEN '✅ Acesso total (admin)'
    WHEN COUNT(um.module) > 0 THEN '🔒 Acesso restrito por módulo'
    ELSE '❌ Bloqueado - sem módulos atribuídos'
  END as situacao_descritiva
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id
LEFT JOIN user_modules um ON um.user_id = p.id
GROUP BY p.id, p.email, p.full_name, p.is_active
ORDER BY tipo_acesso, p.email;

-- 2. VIEW DE DIAGNÓSTICO — quais tabelas cada módulo acessa
CREATE OR REPLACE VIEW public.v_modulos_tabelas AS
SELECT * FROM (VALUES
  ('rh',          'servidores'),
  ('rh',          'ferias_servidores'),
  ('rh',          'frequencias'),
  ('rh',          'portarias_servidor'),
  ('rh',          'folhas_pagamento'),
  ('rh',          'licencas'),
  ('rh',          'afastamentos'),
  ('financeiro',  'empenhos'),
  ('financeiro',  'folhas_pagamento'),
  ('financeiro',  'rubricas'),
  ('patrimonio',  'bens_patrimoniais'),
  ('patrimonio',  'movimentacoes_bem'),
  ('patrimonio',  'baixas_patrimonio'),
  ('compras',     'processos_licitatorios'),
  ('compras',     'fornecedores'),
  ('contratos',   'contratos'),
  ('contratos',   'aditivos_contrato'),
  ('admin',       'audit_logs'),
  ('admin',       'backup_config'),
  ('gabinete',    'pre_cadastros_servidores'),
  ('governanca',  'estrutura_organizacional'),
  ('governanca',  'cargos')
) AS t(modulo, tabela);

-- ============================================================
-- PILOTO: APLICAR RLS GRANULAR APENAS NA TABELA `servidores`
-- (módulo rh — mais crítico e com mais dados: 92 registros)
-- ============================================================

-- Remover política acesso_total existente
DROP POLICY IF EXISTS acesso_total_select ON public.servidores;
DROP POLICY IF EXISTS acesso_total_insert ON public.servidores;
DROP POLICY IF EXISTS acesso_total_update ON public.servidores;
DROP POLICY IF EXISTS acesso_total_delete ON public.servidores;

-- Nova política: SELECT restrito por módulo rh ou admin
CREATE POLICY "rh_select" ON public.servidores
  FOR SELECT TO authenticated
  USING (
    public.is_active_user() AND (
      public.is_admin_user(auth.uid()) OR
      public.has_module('rh'::app_module)
    )
  );

-- INSERT: só rh ou admin
CREATE POLICY "rh_insert" ON public.servidores
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_active_user() AND (
      public.is_admin_user(auth.uid()) OR
      public.has_module('rh'::app_module)
    )
  );

-- UPDATE: só rh ou admin
CREATE POLICY "rh_update" ON public.servidores
  FOR UPDATE TO authenticated
  USING (
    public.is_active_user() AND (
      public.is_admin_user(auth.uid()) OR
      public.has_module('rh'::app_module)
    )
  );

-- DELETE: só admin (preservação de dados históricos)
CREATE POLICY "rh_delete" ON public.servidores
  FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));
