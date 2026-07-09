-- Publicações Oficiais (Transparência): leitura pública das já publicadas
-- e bucket de storage para os arquivos anexados.

-- A tabela public.publicacoes_lai já existe (migration 20260201224705) com a
-- policy "Publicações LAI são públicas" restrita a TO authenticated. Para
-- alimentar a seção "Publicações Oficiais" do portal público de transparência
-- (sem login), é preciso uma policy de SELECT para anon limitada às linhas
-- já publicadas.
DROP POLICY IF EXISTS "Publicacoes LAI publicadas sao publicas" ON public.publicacoes_lai;
CREATE POLICY "Publicacoes LAI publicadas sao publicas"
ON public.publicacoes_lai
FOR SELECT
TO anon
USING (publicado = true);

-- Bucket dedicado para os arquivos (PDF/DOC) das publicações oficiais
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'transparencia-publicacoes',
  'transparencia-publicacoes',
  true,
  10485760,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Leitura publica de publicacoes oficiais" ON storage.objects;
CREATE POLICY "Leitura publica de publicacoes oficiais"
ON storage.objects
FOR SELECT
USING (bucket_id = 'transparencia-publicacoes');

DROP POLICY IF EXISTS "Autenticados podem enviar publicacoes oficiais" ON storage.objects;
CREATE POLICY "Autenticados podem enviar publicacoes oficiais"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'transparencia-publicacoes');

DROP POLICY IF EXISTS "Autenticados podem atualizar publicacoes oficiais" ON storage.objects;
CREATE POLICY "Autenticados podem atualizar publicacoes oficiais"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'transparencia-publicacoes');

DROP POLICY IF EXISTS "Autenticados podem remover publicacoes oficiais" ON storage.objects;
CREATE POLICY "Autenticados podem remover publicacoes oficiais"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'transparencia-publicacoes');
