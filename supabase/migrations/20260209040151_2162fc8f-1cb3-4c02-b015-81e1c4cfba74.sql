-- Criar bucket para fotos de patrimônio (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('patrimonio-fotos', 'patrimonio-fotos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para o bucket patrimonio-fotos
CREATE POLICY "Fotos patrimonio publicas para leitura"
ON storage.objects FOR SELECT
USING (bucket_id = 'patrimonio-fotos');

CREATE POLICY "Usuarios autenticados podem fazer upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'patrimonio-fotos' AND auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados podem atualizar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'patrimonio-fotos' AND auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados podem deletar"
ON storage.objects FOR DELETE
USING (bucket_id = 'patrimonio-fotos' AND auth.role() = 'authenticated');