-- ============================================================================
-- Bucket "documentos" — criado originalmente fora do fluxo de migração
-- ============================================================================
-- Achado durante a preparação da saída do Lovable Cloud: as policies de RLS
-- para o bucket "documentos" já existem desde
-- supabase/migrations/20260116221736_c8638ad0-89cf-46f9-9c49-db11020f8d45.sql
-- e o bucket é usado ativamente pelo app (src/components/rh/DocumentosServidorTab.tsx),
-- mas nenhuma migração faz o `INSERT INTO storage.buckets` correspondente —
-- foi criado manualmente pelo dashboard do Lovable em algum momento. Sem esta
-- migração, uma instância nova (Supabase próprio) teria as policies mas não
-- o bucket, e o upload de documentos de servidor falharia.
--
-- Privado (não público) e limitado aos tipos aceitos pelo formulário de
-- upload (accept=".pdf,.jpg,.jpeg,.png,.webp").
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documentos',
  'documentos',
  false,
  52428800, -- 50MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;
