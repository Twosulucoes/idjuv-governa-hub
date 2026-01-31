-- =============================================
-- SISTEMA DE ARMAZENAMENTO DE FREQUÊNCIAS
-- =============================================

-- 1. Bucket para armazenar PDFs e ZIPs de frequência
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'frequencias',
  'frequencias',
  false,
  52428800, -- 50MB
  ARRAY['application/pdf', 'application/zip', 'application/x-zip-compressed']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas de acesso ao bucket (apenas usuários autenticados)
CREATE POLICY "Usuários autenticados podem visualizar frequências"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'frequencias');

CREATE POLICY "Usuários autenticados podem inserir frequências"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'frequencias');

CREATE POLICY "Usuários autenticados podem atualizar frequências"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'frequencias');

-- 3. Tabela de registro de PDFs individuais gerados
CREATE TABLE public.frequencia_arquivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  periodo VARCHAR(7) NOT NULL, -- formato: 2026-01
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  servidor_id UUID REFERENCES public.servidores(id) ON DELETE SET NULL,
  servidor_nome VARCHAR(255),
  servidor_matricula VARCHAR(50),
  unidade_id UUID REFERENCES public.estrutura_organizacional(id) ON DELETE SET NULL,
  unidade_nome VARCHAR(255),
  unidade_sigla VARCHAR(20),
  tipo VARCHAR(20) NOT NULL DEFAULT 'individual', -- individual, lote
  arquivo_path TEXT NOT NULL,
  arquivo_nome VARCHAR(255) NOT NULL,
  arquivo_tamanho INTEGER,
  hash_conteudo VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Índices para busca eficiente
CREATE INDEX idx_frequencia_arquivos_periodo ON public.frequencia_arquivos(periodo);
CREATE INDEX idx_frequencia_arquivos_unidade ON public.frequencia_arquivos(unidade_id);
CREATE INDEX idx_frequencia_arquivos_servidor ON public.frequencia_arquivos(servidor_id);

-- 4. Tabela de pacotes ZIP gerados
CREATE TABLE public.frequencia_pacotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  periodo VARCHAR(7) NOT NULL, -- formato: 2026-01
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  unidade_id UUID REFERENCES public.estrutura_organizacional(id) ON DELETE SET NULL,
  unidade_nome VARCHAR(255),
  agrupamento_id UUID REFERENCES public.config_agrupamento_unidades(id) ON DELETE SET NULL,
  agrupamento_nome VARCHAR(255),
  tipo VARCHAR(20) NOT NULL DEFAULT 'unidade', -- unidade, agrupamento, geral
  status VARCHAR(20) NOT NULL DEFAULT 'pendente', -- pendente, gerando, gerado, erro
  arquivo_path TEXT,
  arquivo_nome VARCHAR(255),
  arquivo_tamanho INTEGER,
  total_arquivos INTEGER DEFAULT 0,
  link_download VARCHAR(255) UNIQUE,
  link_expira_em TIMESTAMPTZ,
  erro_mensagem TEXT,
  gerado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_frequencia_pacotes_periodo ON public.frequencia_pacotes(periodo);
CREATE INDEX idx_frequencia_pacotes_link ON public.frequencia_pacotes(link_download);
CREATE INDEX idx_frequencia_pacotes_status ON public.frequencia_pacotes(status);

-- 5. RLS para frequencia_arquivos
ALTER TABLE public.frequencia_arquivos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem visualizar arquivos"
ON public.frequencia_arquivos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuários autenticados podem inserir arquivos"
ON public.frequencia_arquivos FOR INSERT
TO authenticated
WITH CHECK (true);

-- 6. RLS para frequencia_pacotes
ALTER TABLE public.frequencia_pacotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem visualizar pacotes"
ON public.frequencia_pacotes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuários autenticados podem inserir pacotes"
ON public.frequencia_pacotes FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar pacotes"
ON public.frequencia_pacotes FOR UPDATE
TO authenticated
USING (true);

-- 7. Função para gerar link único
CREATE OR REPLACE FUNCTION public.gerar_link_frequencia()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  novo_link TEXT;
BEGIN
  novo_link := encode(gen_random_bytes(16), 'hex');
  RETURN novo_link;
END;
$$;

-- 8. Trigger para atualizar updated_at
CREATE TRIGGER update_frequencia_pacotes_updated_at
BEFORE UPDATE ON public.frequencia_pacotes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();