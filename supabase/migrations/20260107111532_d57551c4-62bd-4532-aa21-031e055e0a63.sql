-- ============================================
-- PARTE 3: RLS E POLÍTICAS DE SEGURANÇA
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.user_org_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_access_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_delegations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- FUNÇÕES DE SUPORTE (usando apenas tipos já existentes)
-- ============================================

-- Verificar se usuário tem acesso a uma unidade
CREATE OR REPLACE FUNCTION public.user_has_unit_access(_user_id UUID, _unidade_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_org_units
    WHERE user_id = _user_id AND unidade_id = _unidade_id
  ) OR public.has_role(_user_id, 'admin'::app_role)
$$;

-- Verificar se usuário pode aprovar
CREATE OR REPLACE FUNCTION public.can_approve(_user_id UUID, _module_name VARCHAR DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    public.has_role(_user_id, 'admin'::app_role)
    OR public.has_permission(_user_id, 'requests.approve'::app_permission)
    OR EXISTS (
      SELECT 1 FROM public.approval_delegations
      WHERE delegate_id = _user_id
        AND is_active = true
        AND NOW() BETWEEN valid_from AND valid_until
        AND (module_name IS NULL OR approval_delegations.module_name = _module_name)
    )
$$;

-- Função para verificar se é admin ou ti_admin
CREATE OR REPLACE FUNCTION public.is_admin_user(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role IN ('admin', 'ti_admin', 'presidencia')
  )
$$;

-- Função para verificar permissão de auditoria
CREATE OR REPLACE FUNCTION public.can_view_audit(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    public.has_permission(_user_id, 'audit.view'::app_permission)
    OR public.is_admin_user(_user_id)
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = 'controle_interno'
    )
$$;

-- ============================================
-- POLÍTICAS: user_org_units
-- ============================================

DROP POLICY IF EXISTS "Admins manage user_org_units" ON public.user_org_units;
DROP POLICY IF EXISTS "Users view own org_units" ON public.user_org_units;

CREATE POLICY "admin_manage_user_org_units" ON public.user_org_units
  FOR ALL TO authenticated
  USING (public.is_admin_user(auth.uid()));

CREATE POLICY "users_view_own_org_units" ON public.user_org_units
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- POLÍTICAS: module_access_scopes
-- ============================================

DROP POLICY IF EXISTS "Admins manage module_access_scopes" ON public.module_access_scopes;
DROP POLICY IF EXISTS "All authenticated view module_access_scopes" ON public.module_access_scopes;

CREATE POLICY "admin_manage_module_access_scopes" ON public.module_access_scopes
  FOR ALL TO authenticated
  USING (public.is_admin_user(auth.uid()));

CREATE POLICY "all_view_module_access_scopes" ON public.module_access_scopes
  FOR SELECT TO authenticated
  USING (true);

-- ============================================
-- POLÍTICAS: approval_delegations
-- ============================================

DROP POLICY IF EXISTS "Delegators manage own delegations" ON public.approval_delegations;

CREATE POLICY "manage_approval_delegations" ON public.approval_delegations
  FOR ALL TO authenticated
  USING (
    delegator_id = auth.uid() OR
    delegate_id = auth.uid() OR
    public.is_admin_user(auth.uid())
  );

-- ============================================
-- POLÍTICAS: approval_requests
-- ============================================

DROP POLICY IF EXISTS "View own or assignable requests" ON public.approval_requests;
DROP POLICY IF EXISTS "Create own requests" ON public.approval_requests;
DROP POLICY IF EXISTS "Update assignable requests" ON public.approval_requests;

CREATE POLICY "view_approval_requests" ON public.approval_requests
  FOR SELECT TO authenticated
  USING (
    requester_id = auth.uid() OR
    approver_id = auth.uid() OR
    public.can_approve(auth.uid(), module_name) OR
    public.is_admin_user(auth.uid())
  );

CREATE POLICY "create_approval_requests" ON public.approval_requests
  FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "update_approval_requests" ON public.approval_requests
  FOR UPDATE TO authenticated
  USING (
    requester_id = auth.uid() OR
    public.can_approve(auth.uid(), module_name) OR
    public.is_admin_user(auth.uid())
  );

-- ============================================
-- POLÍTICAS: audit_logs
-- ============================================

DROP POLICY IF EXISTS "Authorized view audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System insert audit_logs" ON public.audit_logs;

CREATE POLICY "view_audit_logs" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.can_view_audit(auth.uid()));

CREATE POLICY "insert_audit_logs" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============================================
-- POLÍTICAS: user_security_settings
-- ============================================

DROP POLICY IF EXISTS "Users view own security" ON public.user_security_settings;
DROP POLICY IF EXISTS "Admins manage security" ON public.user_security_settings;

CREATE POLICY "users_view_own_security" ON public.user_security_settings
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "admin_manage_security" ON public.user_security_settings
  FOR ALL TO authenticated
  USING (public.is_admin_user(auth.uid()));

CREATE POLICY "users_update_own_security" ON public.user_security_settings
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- POLÍTICAS: user_permissions
-- ============================================

CREATE POLICY "admin_manage_user_permissions" ON public.user_permissions
  FOR ALL TO authenticated
  USING (public.is_admin_user(auth.uid()));

CREATE POLICY "users_view_own_permissions" ON public.user_permissions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- TRIGGER para histórico de status de aprovação
-- ============================================

CREATE OR REPLACE FUNCTION public.update_approval_status_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_history := COALESCE(OLD.status_history, '[]'::jsonb) || 
      jsonb_build_object(
        'from', OLD.status,
        'to', NEW.status,
        'changed_at', NOW(),
        'changed_by', auth.uid()
      );
    NEW.updated_at := NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_approval_status_history ON public.approval_requests;
CREATE TRIGGER trg_approval_status_history
BEFORE UPDATE ON public.approval_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_approval_status_history();

-- ============================================
-- FUNÇÃO: Registrar log de auditoria
-- ============================================

CREATE OR REPLACE FUNCTION public.log_audit(
  _action audit_action,
  _entity_type VARCHAR DEFAULT NULL,
  _entity_id UUID DEFAULT NULL,
  _module_name VARCHAR DEFAULT NULL,
  _before_data JSONB DEFAULT NULL,
  _after_data JSONB DEFAULT NULL,
  _description TEXT DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _log_id UUID;
  _user_role app_role;
  _user_org_unit UUID;
BEGIN
  SELECT role INTO _user_role 
  FROM public.user_roles 
  WHERE user_id = auth.uid() 
  LIMIT 1;
  
  SELECT unidade_id INTO _user_org_unit
  FROM public.user_org_units
  WHERE user_id = auth.uid() AND is_primary = true
  LIMIT 1;
  
  INSERT INTO public.audit_logs (
    user_id, action, entity_type, entity_id, module_name,
    before_data, after_data, description, metadata,
    role_at_time, org_unit_id
  )
  VALUES (
    auth.uid(), _action, _entity_type, _entity_id, _module_name,
    _before_data, _after_data, _description, _metadata,
    _user_role, _user_org_unit
  )
  RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$$;

-- ============================================
-- Atualizar handle_new_user para criar security settings
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  INSERT INTO public.user_security_settings (user_id, force_password_change)
  VALUES (NEW.id, true);
  
  RETURN NEW;
END;
$$;