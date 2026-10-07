-- Storage: buckets e policies por módulo.
--
-- Estado anterior (replay das migrações): 26 policies em storage.objects, várias com
-- `auth.uid() IS NOT NULL` (qualquer usuário logado lê/escreve), leitura anônima de buckets
-- públicos e bucket de documentos de servidores (documentos-requerimento) legível por qualquer
-- logado. Aqui tudo passa a exigir módulo; anônimo só INSERE no formulário de árbitros.
--
-- Buckets públicos continuam servindo o arquivo por URL (isso não passa por policy), mas
-- ninguém consegue LISTAR/consultar a tabela de objetos sem módulo. Para fechar o acesso por URL
-- é preciso bucket privado + URL assinada no front (pendência registrada em supabase/baseline/README.md).
--
-- Remove só as policies conhecidas (por nome), para não apagar nada que a plataforma ou outro
-- sistema tenha criado em storage.objects.

DO $$
DECLARE nome text;
BEGIN
  FOREACH nome IN ARRAY ARRAY[
    'Autenticados podem atualizar publicacoes oficiais','Autenticados podem enviar publicacoes oficiais',
    'Autenticados podem remover publicacoes oficiais','Auth users can delete docs','Auth users can update docs',
    'Auth users can upload docs','Auth users can view docs','Fotos patrimonio publicas para leitura',
    'Leitura publica de publicacoes oficiais','Upload público de documentos de árbitros',
    'Usuarios autenticados podem atualizar','Usuarios autenticados podem atualizar documentos',
    'Usuarios autenticados podem deletar','Usuarios autenticados podem deletar documentos',
    'Usuarios autenticados podem fazer upload','Usuarios autenticados podem fazer upload de documentos',
    'Usuários autenticados podem atualizar frequências','Usuários autenticados podem fazer upload',
    'Usuários autenticados podem inserir frequências','Usuários autenticados podem visualizar arquivos ASCOM',
    'Usuários autenticados podem visualizar frequências','arbitros_docs_select_authenticated',
    'inventario_fotos_delete_authenticated','inventario_fotos_insert_authenticated',
    'inventario_fotos_select_public','inventario_fotos_update_authenticated',
    'Leitura pública de documentos de árbitros'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', nome);
  END LOOP;
END $$;

-- Buckets (idempotente). public = leitura por URL sem login.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('arbitros-docs',             'arbitros-docs',             true,  5242880,  ARRAY['image/jpeg','image/png','image/webp','image/heic','image/heif','application/pdf']),
  ('ascom-demandas',            'ascom-demandas',            false, NULL,     NULL),
  ('documentos',                'documentos',                false, 52428800, ARRAY['application/pdf','image/jpeg','image/png','image/webp']),
  ('documentos-requerimento',   'documentos-requerimento',   false, NULL,     NULL),
  ('frequencias',               'frequencias',               false, 52428800, ARRAY['application/pdf','application/zip','application/x-zip-compressed']),
  ('inventario-fotos',          'inventario-fotos',          true,  5242880,  ARRAY['image/jpeg','image/png','image/webp']),
  ('patrimonio-docs',           'patrimonio-docs',           false, 10485760, NULL),
  ('patrimonio-fotos',          'patrimonio-fotos',          true,  NULL,     NULL),
  ('transparencia-publicacoes', 'transparencia-publicacoes', true,  10485760, ARRAY['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Policies: leitura e escrita por módulo (can_access_module já exige perfil ativo e dá passagem ao papel admin).
DO $$
DECLARE
  b record; mods text; cond text; cmd text;
BEGIN
  FOR b IN SELECT * FROM (VALUES
    ('arbitros-docs',             ARRAY['arbitros']),
    ('ascom-demandas',            ARRAY['comunicacao']),
    ('documentos',                ARRAY['workflow','rh']),
    ('documentos-requerimento',   ARRAY['rh']),
    ('frequencias',               ARRAY['rh']),
    ('inventario-fotos',          ARRAY['patrimonio','patrimonio_mobile']),
    ('patrimonio-docs',           ARRAY['patrimonio','patrimonio_mobile']),
    ('patrimonio-fotos',          ARRAY['patrimonio','patrimonio_mobile']),
    ('transparencia-publicacoes', ARRAY['transparencia'])
  ) AS v(bucket, modulos)
  LOOP
    SELECT string_agg(format('public.can_access_module(auth.uid(), %L)', m), ' OR ') INTO mods FROM unnest(b.modulos) m;
    cond := format('bucket_id = %L AND (%s)', b.bucket, mods);
    FOREACH cmd IN ARRAY ARRAY['SELECT','INSERT','UPDATE','DELETE'] LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', 'st_' || b.bucket || '_' || lower(cmd));
      EXECUTE format('CREATE POLICY %I ON storage.objects FOR %s TO authenticated %s',
        'st_' || b.bucket || '_' || lower(cmd), cmd,
        CASE cmd WHEN 'INSERT' THEN format('WITH CHECK (%s)', cond)
                 WHEN 'UPDATE' THEN format('USING (%s) WITH CHECK (%s)', cond, cond)
                 ELSE format('USING (%s)', cond) END);
    END LOOP;
  END LOOP;
END $$;

-- Formulário público de árbitros: upload de foto/documentos sem login (só INSERT; a leitura
-- fica para o módulo arbitros acima). Só nas três pastas que o formulário usa; o bucket limita tamanho
-- (5 MB; o front limita a 2 MB, mas isso é só do navegador) e tipo (imagem e PDF). Continua sem
-- limite de taxa: aplique no proxy (Kong/nginx) e use CAPTCHA no formulário (docs/NOVO_BANCO.md).
DROP POLICY IF EXISTS "st_arbitros-docs_insert_anon" ON storage.objects;
CREATE POLICY "st_arbitros-docs_insert_anon" ON storage.objects
  FOR INSERT TO anon
  WITH CHECK (bucket_id = 'arbitros-docs' AND (storage.foldername(name))[1] IN ('fotos', 'documentos', 'modalidades'));
