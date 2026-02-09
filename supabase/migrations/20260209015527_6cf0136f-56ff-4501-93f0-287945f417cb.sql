-- Criar bucket para fotos de inventário
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'inventario-fotos',
  'inventario-fotos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso ao bucket
CREATE POLICY "inventario_fotos_select_public"
ON storage.objects FOR SELECT
USING (bucket_id = 'inventario-fotos');

CREATE POLICY "inventario_fotos_insert_authenticated"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'inventario-fotos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "inventario_fotos_update_authenticated"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'inventario-fotos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "inventario_fotos_delete_authenticated"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'inventario-fotos' 
  AND auth.role() = 'authenticated'
);