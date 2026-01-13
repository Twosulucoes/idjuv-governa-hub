-- Criar política para INSERT/UPDATE/DELETE - admins, rh e gestores
CREATE POLICY "Admins e RH podem gerenciar composição"
  ON public.composicao_cargos
  FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'rh'::app_role) OR
    has_role(auth.uid(), 'ti_admin'::app_role) OR
    has_role(auth.uid(), 'presidencia'::app_role) OR
    has_role(auth.uid(), 'diraf'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'rh'::app_role) OR
    has_role(auth.uid(), 'ti_admin'::app_role) OR
    has_role(auth.uid(), 'presidencia'::app_role) OR
    has_role(auth.uid(), 'diraf'::app_role)
  );