
-- Permitir INSERT anônimo para cadastro público de federações
CREATE POLICY "cadastro_publico_insert"
ON public.federacoes_esportivas
FOR INSERT TO anon
WITH CHECK (true);
