-- Allow authenticated users to read and update cadastro_arbitros
CREATE POLICY "authenticated_read_arbitros"
ON public.cadastro_arbitros
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "authenticated_update_arbitros"
ON public.cadastro_arbitros
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);