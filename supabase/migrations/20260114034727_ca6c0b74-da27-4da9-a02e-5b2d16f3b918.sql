-- Corrigir política de inserção para ser mais restritiva
DROP POLICY IF EXISTS "Usuários autenticados podem criar designacoes" ON public.designacoes;

CREATE POLICY "Usuários autenticados podem criar designacoes"
ON public.designacoes FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'ti_admin', 'presidencia', 'rh', 'manager', 'diraf')
  )
);