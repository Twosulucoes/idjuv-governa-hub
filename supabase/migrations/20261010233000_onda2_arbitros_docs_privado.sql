-- Onda 2 da revisão de permissões: documentos dos árbitros deixam de ser públicos
--
-- O bucket arbitros-docs guarda fotos e cópias de RG/CPF enviadas pelo formulário público de
-- árbitros. Ele era público (qualquer pessoa com o link baixava, sem login) e, no histórico de
-- migrações, qualquer usuário logado lia todos os arquivos (arbitros_docs_select_authenticated,
-- 20261006230500). Agora:
--   - bucket privado, com limite de 5 MB e só imagem/PDF (como o baseline);
--   - ler, sobrescrever e apagar: só quem tem o módulo arbitros (ou o papel admin), pela tela da equipe,
--     que abre os arquivos por URL assinada de curta duração;
--   - o formulário público continua só enviando (INSERT de anon nas pastas fotos/documentos/modalidades).
-- Os links já gravados em cadastro_arbitros(_modalidades) continuam no formato /object/public/...;
-- o front tira o caminho deles para assinar, então não há migração de dados.
-- Igual ao supabase/baseline/overlay/50_storage.sql (num banco do baseline é no-op).

UPDATE storage.buckets
   SET public = false,
       file_size_limit = 5242880,
       allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/heic','image/heif','application/pdf']
 WHERE id = 'arbitros-docs';

DROP POLICY IF EXISTS "Upload público de documentos de árbitros" ON storage.objects;
DROP POLICY IF EXISTS "Leitura pública de documentos de árbitros" ON storage.objects;
DROP POLICY IF EXISTS "arbitros_docs_select_authenticated" ON storage.objects;

DROP POLICY IF EXISTS "st_arbitros-docs_select" ON storage.objects;
CREATE POLICY "st_arbitros-docs_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'arbitros-docs' AND (public.can_access_module(auth.uid(), 'arbitros')));
DROP POLICY IF EXISTS "st_arbitros-docs_insert" ON storage.objects;
CREATE POLICY "st_arbitros-docs_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'arbitros-docs' AND (public.can_access_module(auth.uid(), 'arbitros')));
DROP POLICY IF EXISTS "st_arbitros-docs_update" ON storage.objects;
CREATE POLICY "st_arbitros-docs_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'arbitros-docs' AND (public.can_access_module(auth.uid(), 'arbitros')))
  WITH CHECK (bucket_id = 'arbitros-docs' AND (public.can_access_module(auth.uid(), 'arbitros')));
DROP POLICY IF EXISTS "st_arbitros-docs_delete" ON storage.objects;
CREATE POLICY "st_arbitros-docs_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'arbitros-docs' AND (public.can_access_module(auth.uid(), 'arbitros')));

-- Formulário público: só envia, e só nas três pastas que ele usa.
DROP POLICY IF EXISTS "st_arbitros-docs_insert_anon" ON storage.objects;
CREATE POLICY "st_arbitros-docs_insert_anon" ON storage.objects
  FOR INSERT TO anon
  WITH CHECK (bucket_id = 'arbitros-docs' AND (storage.foldername(name))[1] IN ('fotos', 'documentos', 'modalidades'));
