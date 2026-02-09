
-- Políticas RLS para tabela documentos (portarias)

-- SELECT: qualquer usuário autenticado pode visualizar
CREATE POLICY "documentos_select_authenticated"
ON public.documentos
FOR SELECT
TO authenticated
USING (true);

-- INSERT: qualquer usuário autenticado pode criar
CREATE POLICY "documentos_insert_authenticated"
ON public.documentos
FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE: criador ou admin
CREATE POLICY "documentos_update_owner_admin"
ON public.documentos
FOR UPDATE
TO authenticated
USING (created_by = auth.uid() OR public.is_admin_user(auth.uid()));
