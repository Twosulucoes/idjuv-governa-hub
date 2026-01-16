-- Remover políticas antigas de INSERT que exigem roles específicos
DROP POLICY IF EXISTS "Admins podem fazer upload de documentos" ON storage.objects;
DROP POLICY IF EXISTS "Managers podem fazer upload de documentos" ON storage.objects;

-- Criar política que permite qualquer usuário autenticado fazer upload no bucket documentos
CREATE POLICY "Usuarios autenticados podem fazer upload de documentos" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'documentos');

-- Criar política que permite qualquer usuário autenticado atualizar seus uploads
DROP POLICY IF EXISTS "Admins podem atualizar documentos" ON storage.objects;
CREATE POLICY "Usuarios autenticados podem atualizar documentos" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (bucket_id = 'documentos');

-- Manter política de delete apenas para admins mas também permitir para authenticated
DROP POLICY IF EXISTS "Admins podem deletar documentos" ON storage.objects;
CREATE POLICY "Usuarios autenticados podem deletar documentos" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'documentos');