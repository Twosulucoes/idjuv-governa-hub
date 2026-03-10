
-- Recreate the policy using the correct function name
CREATE POLICY "Admin pode ver todo histórico" ON public.gestores_escolares_historico
FOR SELECT TO authenticated
USING (
  public.usuario_tem_permissao(auth.uid(), 'educacao.gestores.visualizar')
  OR public.usuario_eh_super_admin(auth.uid())
);
