
-- Adicionar política para admins verem todos os servidores
CREATE POLICY "Admins podem ver todos servidores"
ON public.servidores
FOR SELECT
TO authenticated
USING (
  public.has_role('admin'::app_role)
);

-- Adicionar política para managers verem servidores
CREATE POLICY "Managers podem ver todos servidores"
ON public.servidores
FOR SELECT
TO authenticated
USING (
  public.has_role('manager'::app_role)
);
