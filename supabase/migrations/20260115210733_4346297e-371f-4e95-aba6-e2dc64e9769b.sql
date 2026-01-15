-- Adicionar coluna para armazenar estrutura unificada da portaria
ALTER TABLE public.documentos ADD COLUMN IF NOT EXISTS conteudo_unificado jsonb;

-- Comentário para documentação
COMMENT ON COLUMN public.documentos.conteudo_unificado IS 'Estrutura JSON com preambulo, artigos, configTabela, assinatura e camposEspecificos para o sistema unificado de portarias';