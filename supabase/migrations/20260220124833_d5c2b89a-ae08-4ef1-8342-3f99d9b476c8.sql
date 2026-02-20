
-- Parte 2: Corrigir funções com conflito de nomes de parâmetros

-- Dropar explicitamente antes de recriar
DROP FUNCTION IF EXISTS public.is_admin_user(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_active_user(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.usuario_tem_permissao(uuid, text) CASCADE;

-- Recriar função is_active_user sem parâmetro default
CREATE OR REPLACE FUNCTION public.is_active_user(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(is_active, true) FROM public.profiles WHERE id = p_user_id;
$$;

-- Recriar função is_admin_user sem parâmetro default
CREATE OR REPLACE FUNCTION public.is_admin_user(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id AND role = 'admin'
  );
$$;

-- Recriar usuario_tem_permissao (alias simples para acesso a módulo)
CREATE OR REPLACE FUNCTION public.usuario_tem_permissao(
  p_user_id UUID,
  p_modulo TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.usuario_tem_acesso_modulo(p_user_id, p_modulo);
$$;
