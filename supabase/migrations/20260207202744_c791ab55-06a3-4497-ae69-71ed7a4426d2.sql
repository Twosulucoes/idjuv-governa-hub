-- Permitir que administradores vejam/gerenciem todos os perfis (necessário para /admin/usuarios)
-- Mantém a política existente de “ver próprio perfil”.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- SELECT (listar todos os usuários)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role('admin'::app_role));

-- UPDATE (bloquear/desbloquear, vincular servidor, etc.)
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (has_role('admin'::app_role))
WITH CHECK (has_role('admin'::app_role));
