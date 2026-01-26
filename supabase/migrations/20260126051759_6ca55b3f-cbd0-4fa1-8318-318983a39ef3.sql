-- Adicionar política de DELETE para federações (apenas usuários autenticados podem excluir)
CREATE POLICY "Usuários autenticados podem excluir federações"
ON public.federacoes_esportivas
FOR DELETE
TO authenticated
USING (true);