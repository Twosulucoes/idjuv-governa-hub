-- Dropar a policy dependente primeiro
DROP POLICY IF EXISTS "Admin pode ver todo histórico" ON public.gestores_escolares_historico;

-- Dropar a função antiga
DROP FUNCTION IF EXISTS public.usuario_tem_permissao(uuid, text);

-- Recriar a função com o mesmo nome e parâmetros
CREATE OR REPLACE FUNCTION public.usuario_tem_permissao(p_user_id uuid, p_modulo text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.usuario_tem_acesso_modulo(p_user_id, p_modulo);
$$;

-- Recriar a policy que dependia da função
CREATE POLICY "Admin pode ver todo histórico"
ON public.gestores_escolares_historico
FOR SELECT
TO authenticated
USING (
  usuario_tem_permissao(auth.uid(), 'educacao.gestores.visualizar'::text)
  OR usuario_eh_super_admin(auth.uid())
);