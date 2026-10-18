-- ============================================================
-- IDJUV - BACKUP COMPLETO - POLÍTICAS RLS
-- Gerado em: 2026-02-08
-- Total: 288+ políticas
-- ============================================================

-- NOTA: Este arquivo contém as políticas principais.
-- As políticas são organizadas por módulo.

-- ============================================
-- POLÍTICAS PARA PROFILES
-- ============================================

CREATE POLICY "profiles_select_own" ON public.profiles 
  FOR SELECT TO authenticated 
  USING (id = auth.uid());

CREATE POLICY "profiles_select_admin" ON public.profiles 
  FOR SELECT TO authenticated 
  USING (public.is_admin_user(auth.uid()));

CREATE POLICY "profiles_update_own" ON public.profiles 
  FOR UPDATE TO authenticated 
  USING (id = auth.uid());

CREATE POLICY "profiles_all_admin" ON public.profiles 
  FOR ALL TO authenticated 
  USING (public.is_admin_user(auth.uid()));

-- ============================================
-- POLÍTICAS PARA USER_ROLES
-- ============================================

CREATE POLICY "user_roles_select" ON public.user_roles 
  FOR SELECT TO authenticated 
  USING (user_id = auth.uid() OR public.is_admin_user(auth.uid()));

CREATE POLICY "user_roles_manage_admin" ON public.user_roles 
  FOR ALL TO authenticated 
  USING (public.is_admin_user(auth.uid()));

-- ============================================
-- POLÍTICAS PARA ESTRUTURA ORGANIZACIONAL
-- ============================================

CREATE POLICY "estrutura_select_all" ON public.estrutura_organizacional 
  FOR SELECT TO authenticated 
  USING (true);

CREATE POLICY "estrutura_manage_admin" ON public.estrutura_organizacional 
  FOR ALL TO authenticated 
  USING (public.is_admin_user(auth.uid()));

CREATE POLICY "cargos_select_all" ON public.cargos 
  FOR SELECT TO authenticated 
  USING (true);

CREATE POLICY "cargos_manage_admin" ON public.cargos 
  FOR ALL TO authenticated 
  USING (public.is_admin_user(auth.uid()));

-- ============================================
-- POLÍTICAS PARA SERVIDORES
-- ============================================

CREATE POLICY "servidores_select_all" ON public.servidores 
  FOR SELECT TO authenticated 
  USING (public.is_active_user());

CREATE POLICY "servidores_manage_rh" ON public.servidores 
  FOR ALL TO authenticated 
  USING (
    public.is_active_user() AND 
    (public.has_role('admin') OR public.has_module('rh'::app_module))
  );

-- ============================================
-- POLÍTICAS PARA UNIDADES LOCAIS
-- ============================================

CREATE POLICY "unidades_select_public" ON public.unidades_locais 
  FOR SELECT 
  USING (true);

CREATE POLICY "unidades_manage_admin" ON public.unidades_locais 
  FOR ALL TO authenticated 
  USING (public.is_admin_user(auth.uid()));

-- ============================================
-- POLÍTICAS PARA AGENDA
-- ============================================

CREATE POLICY "agenda_select_public" ON public.agenda_unidade 
  FOR SELECT 
  USING (true);

CREATE POLICY "agenda_insert_authenticated" ON public.agenda_unidade 
  FOR INSERT TO authenticated 
  WITH CHECK (public.is_active_user());

CREATE POLICY "agenda_update_owner" ON public.agenda_unidade 
  FOR UPDATE TO authenticated 
  USING (
    created_by = auth.uid() OR 
    public.is_admin_user(auth.uid())
  );

-- ============================================
-- POLÍTICAS PARA PATRIMÔNIO
-- ============================================

CREATE POLICY "patrimonio_select" ON public.bens_patrimoniais 
  FOR SELECT TO authenticated 
  USING (
    public.is_active_user() AND 
    (public.has_role('admin') OR public.has_module('patrimonio'::app_module))
  );

CREATE POLICY "patrimonio_manage" ON public.bens_patrimoniais 
  FOR ALL TO authenticated 
  USING (
    public.is_active_user() AND 
    (public.has_role('admin') OR public.has_module('patrimonio'::app_module))
  );

-- ============================================
-- POLÍTICAS PARA FINANCEIRO
-- ============================================

CREATE POLICY "rubricas_select" ON public.rubricas 
  FOR SELECT TO authenticated 
  USING (public.is_active_user());

CREATE POLICY "rubricas_manage" ON public.rubricas 
  FOR ALL TO authenticated 
  USING (
    public.is_active_user() AND 
    (public.has_role('admin') OR public.has_module('financeiro'::app_module))
  );

CREATE POLICY "folhas_select" ON public.folhas_pagamento 
  FOR SELECT TO authenticated 
  USING (
    public.is_active_user() AND 
    (public.has_role('admin') OR public.has_module('financeiro'::app_module))
  );

CREATE POLICY "folhas_manage" ON public.folhas_pagamento 
  FOR ALL TO authenticated 
  USING (
    public.is_active_user() AND 
    (public.has_role('admin') OR public.has_module('financeiro'::app_module))
  );

-- ============================================
-- POLÍTICAS PARA AUDITORIA
-- ============================================

CREATE POLICY "audit_logs_select_admin" ON public.audit_logs 
  FOR SELECT TO authenticated 
  USING (
    public.is_admin_user(auth.uid()) OR 
    public.has_permission(auth.uid(), 'audit.view'::app_permission)
  );

CREATE POLICY "audit_logs_insert_all" ON public.audit_logs 
  FOR INSERT TO authenticated 
  WITH CHECK (true);

-- Audit logs não podem ser alterados ou deletados
-- (sem políticas de UPDATE ou DELETE)

-- ============================================
-- POLÍTICAS PARA BACKUP
-- ============================================

CREATE POLICY "backup_config_admin" ON public.backup_config 
  FOR ALL TO authenticated 
  USING (public.has_role('admin'));

CREATE POLICY "backup_history_admin" ON public.backup_history 
  FOR SELECT TO authenticated 
  USING (public.has_role('admin'));

CREATE POLICY "backup_history_insert" ON public.backup_history 
  FOR INSERT TO authenticated 
  WITH CHECK (public.has_role('admin'));

-- ============================================
-- POLÍTICAS PARA APROVAÇÕES
-- ============================================

CREATE POLICY "approval_requests_select" ON public.approval_requests 
  FOR SELECT TO authenticated 
  USING (
    requester_id = auth.uid() OR 
    public.can_approve(auth.uid(), module_name) OR 
    public.is_admin_user(auth.uid())
  );

CREATE POLICY "approval_requests_insert" ON public.approval_requests 
  FOR INSERT TO authenticated 
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "approval_requests_update" ON public.approval_requests 
  FOR UPDATE TO authenticated 
  USING (
    requester_id = auth.uid() OR 
    public.can_approve(auth.uid(), module_name) OR 
    public.is_admin_user(auth.uid())
  );

CREATE POLICY "approval_delegations_manage" ON public.approval_delegations 
  FOR ALL TO authenticated 
  USING (
    delegator_id = auth.uid() OR 
    delegate_id = auth.uid() OR 
    public.is_admin_user(auth.uid())
  );

-- ============================================
-- POLÍTICAS PARA DOCUMENTOS
-- ============================================

CREATE POLICY "documentos_select_all" ON public.documentos 
  FOR SELECT TO authenticated 
  USING (public.is_active_user());

CREATE POLICY "documentos_manage" ON public.documentos 
  FOR ALL TO authenticated 
  USING (
    public.is_active_user() AND 
    (public.has_role('admin') OR created_by = auth.uid())
  );

-- ============================================
-- POLÍTICAS PARA FEDERAÇÕES
-- ============================================

CREATE POLICY "federacoes_select" ON public.federacoes_esportivas 
  FOR SELECT TO authenticated 
  USING (public.is_active_user());

CREATE POLICY "federacoes_manage" ON public.federacoes_esportivas 
  FOR ALL TO authenticated 
  USING (public.is_admin_user(auth.uid()));

CREATE POLICY "instituicoes_select" ON public.instituicoes 
  FOR SELECT TO authenticated 
  USING (public.is_active_user());

CREATE POLICY "instituicoes_manage" ON public.instituicoes 
  FOR ALL TO authenticated 
  USING (public.is_admin_user(auth.uid()));

-- ============================================
-- POLÍTICAS PARA FORNECEDORES E CONTRATOS
-- ============================================

CREATE POLICY "fornecedores_select" ON public.fornecedores 
  FOR SELECT TO authenticated 
  USING (public.is_active_user());

CREATE POLICY "fornecedores_manage" ON public.fornecedores 
  FOR ALL TO authenticated 
  USING (
    public.is_active_user() AND 
    (public.has_role('admin') OR public.has_module('compras'::app_module))
  );

CREATE POLICY "contratos_select" ON public.contratos 
  FOR SELECT TO authenticated 
  USING (public.is_active_user());

CREATE POLICY "contratos_manage" ON public.contratos 
  FOR ALL TO authenticated 
  USING (
    public.is_active_user() AND 
    (public.has_role('admin') OR public.has_module('contratos'::app_module))
  );

-- ============================================================
-- NOTA: Este arquivo contém políticas essenciais.
-- Políticas adicionais específicas de módulos podem ser
-- encontradas nas migrações do sistema ou adicionadas conforme
-- necessário.
-- ============================================================

-- ============================================================
-- FIM: 07_rls_policies.sql
-- Próximo: 08_triggers.sql
-- ============================================================
