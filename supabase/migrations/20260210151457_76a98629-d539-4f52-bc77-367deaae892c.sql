-- Allow public update on pre_cadastros for drafts (rascunho/enviado)
CREATE POLICY "Qualquer um pode atualizar pre-cadastro rascunho"
  ON public.pre_cadastros
  FOR UPDATE
  USING (status IN ('rascunho', 'enviado'))
  WITH CHECK (status IN ('rascunho', 'enviado'));

-- Also allow admins (authenticated users) to update any pre-cadastro
CREATE POLICY "Admins podem atualizar pre-cadastros"
  ON public.pre_cadastros
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);