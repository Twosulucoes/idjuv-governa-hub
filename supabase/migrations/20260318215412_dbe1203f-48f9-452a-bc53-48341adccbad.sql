-- Fix: use CASCADE to handle dependent policies, then recreate them

-- Drop function with CASCADE to remove all dependent policies
DROP FUNCTION IF EXISTS public.usuario_tem_permissao(uuid, text) CASCADE;

-- Recreate the function
CREATE OR REPLACE FUNCTION public.usuario_tem_permissao(p_user_id uuid, p_modulo text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.usuario_tem_acesso_modulo(p_user_id, p_modulo);
$$;

-- Recreate the dependent policy on gestores_escolares_historico
DROP POLICY IF EXISTS "Admin pode ver todo histórico" ON public.gestores_escolares_historico;
CREATE POLICY "Admin pode ver todo histórico"
ON public.gestores_escolares_historico
FOR SELECT
TO authenticated
USING (
  public.usuario_tem_permissao(auth.uid(), 'educacao.gestores.visualizar'::text)
  OR public.usuario_eh_super_admin(auth.uid())
);