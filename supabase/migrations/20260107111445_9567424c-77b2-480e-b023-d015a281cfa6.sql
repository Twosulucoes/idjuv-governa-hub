-- ============================================
-- PARTE 2: TABELAS DO MÓDULO DE AUTENTICAÇÃO
-- ============================================

-- 1) VÍNCULO USUÁRIO-UNIDADE ORGANIZACIONAL
CREATE TABLE IF NOT EXISTS public.user_org_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unidade_id UUID NOT NULL REFERENCES public.estrutura_organizacional(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  access_scope public.access_scope DEFAULT 'org_unit',
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, unidade_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_primary_org_unit 
ON public.user_org_units(user_id) WHERE is_primary = true;

-- 2) ESCOPO DE ACESSO POR MÓDULO
CREATE TABLE IF NOT EXISTS public.module_access_scopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  module_name VARCHAR(100) NOT NULL,
  access_scope public.access_scope NOT NULL DEFAULT 'org_unit',
  can_create BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  can_approve BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(role, module_name)
);

-- 3) DELEGAÇÃO DE APROVAÇÃO
CREATE TABLE IF NOT EXISTS public.approval_delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delegator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delegate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_name VARCHAR(100),
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  reason TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES auth.users(id),
  CONSTRAINT check_valid_dates CHECK (valid_until > valid_from)
);

-- 4) WORKFLOW DE APROVAÇÃO
CREATE TABLE IF NOT EXISTS public.approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID NOT NULL,
  module_name VARCHAR(100) NOT NULL,
  status public.approval_status DEFAULT 'draft',
  requester_id UUID NOT NULL REFERENCES auth.users(id),
  requester_org_unit_id UUID REFERENCES public.estrutura_organizacional(id),
  submitted_at TIMESTAMPTZ,
  justification TEXT,
  attachments JSONB DEFAULT '[]',
  approver_id UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  approver_decision TEXT,
  electronic_signature JSONB,
  priority VARCHAR(20) DEFAULT 'normal',
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  status_history JSONB DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON public.approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_requester ON public.approval_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_approver ON public.approval_requests(approver_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_entity ON public.approval_requests(entity_type, entity_id);

-- 5) AUDITORIA
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT now() NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  action public.audit_action NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  module_name VARCHAR(100),
  before_data JSONB,
  after_data JSONB,
  ip_address INET,
  user_agent TEXT,
  org_unit_id UUID REFERENCES public.estrutura_organizacional(id),
  role_at_time public.app_role,
  description TEXT,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON public.audit_logs(module_name);

-- 6) CONFIGURAÇÕES DE SEGURANÇA DO USUÁRIO
CREATE TABLE IF NOT EXISTS public.user_security_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  mfa_enabled BOOLEAN DEFAULT false,
  mfa_required BOOLEAN DEFAULT false,
  mfa_method VARCHAR(20) DEFAULT 'app',
  password_changed_at TIMESTAMPTZ,
  force_password_change BOOLEAN DEFAULT false,
  failed_login_attempts INT DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  last_login_ip INET,
  active_sessions INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  deactivated_at TIMESTAMPTZ,
  deactivated_by UUID REFERENCES auth.users(id),
  deactivation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7) PERMISSÕES DIRETAS DO USUÁRIO (caso não exista)
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission public.app_permission NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, permission)
);