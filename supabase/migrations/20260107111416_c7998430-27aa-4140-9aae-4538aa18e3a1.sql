-- ============================================
-- PARTE 1: ENUMS NOVOS
-- ============================================

-- Escopo de acesso
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'access_scope') THEN
    CREATE TYPE public.access_scope AS ENUM (
      'all',           
      'org_unit',      
      'local_unit',    
      'own',           
      'readonly'       
    );
  END IF;
END $$;

-- Status do workflow de aprovação  
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_status') THEN
    CREATE TYPE public.approval_status AS ENUM (
      'draft',         
      'submitted',     
      'in_review',     
      'approved',      
      'rejected',      
      'cancelled'      
    );
  END IF;
END $$;

-- Tipo de ação de auditoria
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_action') THEN
    CREATE TYPE public.audit_action AS ENUM (
      'login',
      'logout',
      'login_failed',
      'password_change',
      'password_reset',
      'create',
      'update',
      'delete',
      'view',
      'export',
      'upload',
      'download',
      'approve',
      'reject',
      'submit'
    );
  END IF;
END $$;

-- Novos perfis do IDJuv no app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'presidencia';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'diraf';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'rh';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ti_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gabinete';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'controle_interno';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'juridico';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cpl';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ascom';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cadastrador_local';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cadastrador_setor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cadastrador_leitura';

-- Novas permissões
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'roles.manage';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'permissions.manage';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'documents.view';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'documents.create';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'documents.edit';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'documents.delete';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'requests.create';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'requests.view';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'requests.approve';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'requests.reject';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'audit.view';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'audit.export';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'approval.delegate';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'org_units.manage';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'mfa.manage';