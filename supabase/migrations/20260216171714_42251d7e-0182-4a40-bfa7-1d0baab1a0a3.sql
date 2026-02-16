
-- Tabela para documentos de requerimento do servidor
CREATE TABLE public.documentos_requerimento_servidor (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  servidor_id UUID NOT NULL REFERENCES public.servidores(id) ON DELETE CASCADE,
  tipo_documento TEXT NOT NULL, -- ex: 'requerimento_ferias', 'declaracao_acumulacao', etc.
  titulo TEXT NOT NULL,
  descricao TEXT,
  modelo_url TEXT, -- URL do modelo em branco (gerado pelo sistema)
  arquivo_assinado_url TEXT, -- URL do documento assinado pelo servidor
  data_solicitacao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_upload_assinado TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'recebido', 'analisado', 'arquivado')),
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_doc_req_servidor ON public.documentos_requerimento_servidor(servidor_id);
CREATE INDEX idx_doc_req_status ON public.documentos_requerimento_servidor(status);

-- RLS
ALTER TABLE public.documentos_requerimento_servidor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view" ON public.documentos_requerimento_servidor
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "RH users can insert" ON public.documentos_requerimento_servidor
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "RH users can update" ON public.documentos_requerimento_servidor
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only creator or admin can delete" ON public.documentos_requerimento_servidor
  FOR DELETE USING (auth.uid() = created_by);

-- Trigger updated_at
CREATE TRIGGER update_doc_req_servidor_updated_at
  BEFORE UPDATE ON public.documentos_requerimento_servidor
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket para documentos de requerimento
INSERT INTO storage.buckets (id, name, public) VALUES ('documentos-requerimento', 'documentos-requerimento', false)
ON CONFLICT (id) DO NOTHING;

-- Policies de storage
CREATE POLICY "Auth users can upload docs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documentos-requerimento' AND auth.uid() IS NOT NULL);

CREATE POLICY "Auth users can view docs" ON storage.objects
  FOR SELECT USING (bucket_id = 'documentos-requerimento' AND auth.uid() IS NOT NULL);

CREATE POLICY "Auth users can update docs" ON storage.objects
  FOR UPDATE USING (bucket_id = 'documentos-requerimento' AND auth.uid() IS NOT NULL);

CREATE POLICY "Auth users can delete docs" ON storage.objects
  FOR DELETE USING (bucket_id = 'documentos-requerimento' AND auth.uid() IS NOT NULL);
