-- Adicionar coluna responsavel_id para atribuição de portarias
ALTER TABLE public.documentos 
ADD COLUMN IF NOT EXISTS responsavel_id UUID REFERENCES public.servidores(id);

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_documentos_responsavel ON public.documentos(responsavel_id);

-- Comentário
COMMENT ON COLUMN public.documentos.responsavel_id IS 'Servidor responsável pela tramitação/acompanhamento do documento';