-- ============================================
-- ACESSO TOTAL: Sobrescrever funções de verificação para liberar tudo
-- ============================================

-- Função is_active_user: retorna true para qualquer autenticado
CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT auth.uid() IS NOT NULL;
$$;

-- Função has_role: retorna true para qualquer autenticado
CREATE OR REPLACE FUNCTION public.has_role(_role public.app_role)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT auth.uid() IS NOT NULL;
$$;

-- Função has_module: retorna true para qualquer autenticado
CREATE OR REPLACE FUNCTION public.has_module(_module public.app_module)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT auth.uid() IS NOT NULL;
$$;

-- Função can_access_module: retorna true para qualquer autenticado
CREATE OR REPLACE FUNCTION public.can_access_module(_module public.app_module)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT auth.uid() IS NOT NULL;
$$;

-- Função usuario_eh_super_admin: todos são super admin
CREATE OR REPLACE FUNCTION public.usuario_eh_super_admin(check_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT auth.uid() IS NOT NULL;
$$;

-- Função is_admin_user: todos são admin
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT auth.uid() IS NOT NULL;
$$;