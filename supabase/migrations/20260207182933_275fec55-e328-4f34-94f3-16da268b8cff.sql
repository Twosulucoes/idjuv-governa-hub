-- ============================================
-- MIGRAÇÃO RBAC: LIMPEZA E NOVA ESTRUTURA
-- ============================================

-- PARTE 1: Dropar triggers existentes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trigger_validate_user_creation ON public.profiles;

-- PARTE 2: Dropar funções antigas
DROP FUNCTION IF EXISTS public.usuario_eh_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.usuario_tem_permissao(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.usuario_tem_permissao(uuid, varchar) CASCADE;
DROP FUNCTION IF EXISTS public.user_context() CASCADE;
DROP FUNCTION IF EXISTS public.is_active_user() CASCADE;
DROP FUNCTION IF EXISTS public.has_role(public.app_role) CASCADE;
DROP FUNCTION IF EXISTS public.has_module(public.app_module) CASCADE;
DROP FUNCTION IF EXISTS public.can_access_module(public.app_module) CASCADE;
DROP FUNCTION IF EXISTS public.audit_permission_changes() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.bloquear_novo_usuario() CASCADE;
DROP FUNCTION IF EXISTS public.validate_user_creation() CASCADE;

-- PARTE 3: Dropar tabelas antigas (ordem correta por FK)
DROP TABLE IF EXISTS public.perfil_funcoes CASCADE;
DROP TABLE IF EXISTS public.usuario_perfis CASCADE;
DROP TABLE IF EXISTS public.usuario_modulos CASCADE;
DROP TABLE IF EXISTS public.funcoes_sistema CASCADE;
DROP TABLE IF EXISTS public.perfis CASCADE;
DROP TABLE IF EXISTS public.modulos_sistema CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- PARTE 4: Dropar enums antigos
DROP TYPE IF EXISTS public.app_role CASCADE;
DROP TYPE IF EXISTS public.app_module CASCADE;

-- ============================================
-- PARTE 5: CRIAR NOVA ESTRUTURA
-- ============================================

-- 5.1 Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'user');

CREATE TYPE public.app_module AS ENUM (
  'rh', 
  'financeiro', 
  'compras', 
  'patrimonio', 
  'contratos', 
  'workflow', 
  'governanca', 
  'transparencia', 
  'comunicacao', 
  'programas', 
  'gestores_escolares', 
  'integridade', 
  'admin'
);

-- 5.2 Tabela user_roles (1 role por usuário)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  CONSTRAINT unique_user_role UNIQUE (user_id)
);

-- 5.3 Tabela user_modules (N módulos por usuário)
CREATE TABLE public.user_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module public.app_module NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  CONSTRAINT unique_user_module UNIQUE (user_id, module)
);

-- ============================================
-- PARTE 6: ÍNDICES DE PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_active 
ON public.profiles(id) WHERE is_active = true;

CREATE INDEX idx_user_roles_lookup 
ON public.user_roles(user_id, role);

CREATE INDEX idx_user_modules_lookup 
ON public.user_modules(user_id, module);

-- ============================================
-- PARTE 7: FUNÇÕES DE SEGURANÇA
-- ============================================

-- 7.1 Cache de Contexto (1 query por request)
CREATE OR REPLACE FUNCTION public.user_context()
RETURNS TABLE(is_active boolean, roles public.app_role[], modules public.app_module[])
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT 
    COALESCE(p.is_active, false),
    COALESCE(array_agg(DISTINCT ur.role) FILTER (WHERE ur.role IS NOT NULL), '{}'::public.app_role[]),
    COALESCE(array_agg(DISTINCT um.module) FILTER (WHERE um.module IS NOT NULL), '{}'::public.app_module[])
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON ur.user_id = p.id
  LEFT JOIN public.user_modules um ON um.user_id = p.id
  WHERE p.id = auth.uid()
  GROUP BY p.is_active;
$$;

-- 7.2 Verificar se usuário está ativo
CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE((SELECT is_active FROM public.user_context()), false);
$$;

-- 7.3 Verificar role
CREATE OR REPLACE FUNCTION public.has_role(_role public.app_role)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT _role = ANY(COALESCE((SELECT roles FROM public.user_context()), '{}'::public.app_role[]));
$$;

-- 7.4 Verificar módulo
CREATE OR REPLACE FUNCTION public.has_module(_module public.app_module)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT _module = ANY(COALESCE((SELECT modules FROM public.user_context()), '{}'::public.app_module[]));
$$;

-- 7.5 Helper combinado para RLS
CREATE OR REPLACE FUNCTION public.can_access_module(_module public.app_module)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT public.is_active_user() 
    AND (public.has_role('admin') OR public.has_module(_module));
$$;

-- ============================================
-- PARTE 8: RLS PARA TABELAS DE PERMISSÃO
-- ============================================

-- 8.1 RLS para user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles FORCE ROW LEVEL SECURITY;

CREATE POLICY "view_own_roles" ON public.user_roles
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "admin_manage_roles" ON public.user_roles
FOR ALL TO authenticated
USING (public.has_role('admin'))
WITH CHECK (public.has_role('admin'));

-- 8.2 RLS para user_modules
ALTER TABLE public.user_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_modules FORCE ROW LEVEL SECURITY;

CREATE POLICY "view_own_modules" ON public.user_modules
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "admin_manage_modules" ON public.user_modules
FOR ALL TO authenticated
USING (public.has_role('admin'))
WITH CHECK (public.has_role('admin'));

-- ============================================
-- PARTE 9: TRIGGER DE ONBOARDING
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Inserir perfil (inativos por padrão)
  INSERT INTO public.profiles (id, email, full_name, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    false
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Inserir role padrão 'user'
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- PARTE 10: AUDITORIA
-- ============================================

CREATE OR REPLACE FUNCTION public.audit_permission_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    action,
    entity_type,
    entity_id,
    before_data,
    after_data,
    user_id,
    description
  )
  VALUES (
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'create'
      WHEN TG_OP = 'UPDATE' THEN 'update'
      WHEN TG_OP = 'DELETE' THEN 'delete'
    END::public.audit_action,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id)::text,
    CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) END,
    auth.uid(),
    'Alteração em ' || TG_TABLE_NAME
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER audit_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_permission_changes();

CREATE TRIGGER audit_user_modules
  AFTER INSERT OR UPDATE OR DELETE ON public.user_modules
  FOR EACH ROW EXECUTE FUNCTION public.audit_permission_changes();