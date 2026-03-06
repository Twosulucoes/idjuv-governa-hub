
-- Tabela de cadastro público de árbitros
CREATE TABLE public.cadastro_arbitros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'enviado',
  
  -- Dados Pessoais
  nome TEXT NOT NULL,
  nacionalidade TEXT NOT NULL DEFAULT 'brasileira',
  sexo TEXT NOT NULL,
  data_nascimento DATE NOT NULL,
  categoria TEXT NOT NULL,
  tipo_sanguineo TEXT,
  fator_rh TEXT,
  
  -- Documentos
  cpf TEXT NOT NULL,
  rg TEXT,
  rne TEXT,
  validade_rne DATE,
  pis_pasep TEXT,
  
  -- Endereço
  cep TEXT,
  endereco TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  uf TEXT,
  
  -- Contato
  email TEXT NOT NULL,
  ddd TEXT,
  celular TEXT NOT NULL,
  
  -- Profissional
  modalidade TEXT NOT NULL,
  local_trabalho TEXT,
  funcao TEXT,
  esfera TEXT,
  
  -- Dados Bancários
  banco TEXT,
  agencia TEXT,
  conta_corrente TEXT,
  
  -- Foto e documentos
  foto_url TEXT,
  documentos_urls JSONB DEFAULT '[]'::jsonb,
  
  -- Metadados
  protocolo TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.cadastro_arbitros ENABLE ROW LEVEL SECURITY;

-- Política pública de INSERT (qualquer pessoa pode se cadastrar)
CREATE POLICY "Qualquer pessoa pode se cadastrar como árbitro"
ON public.cadastro_arbitros FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Política de SELECT público por protocolo (para consulta)
CREATE POLICY "Consulta pública por protocolo"
ON public.cadastro_arbitros FOR SELECT
TO anon, authenticated
USING (true);

-- Gerar protocolo automático
CREATE OR REPLACE FUNCTION public.gerar_protocolo_arbitro()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  seq INT;
BEGIN
  SELECT COUNT(*) + 1 INTO seq FROM public.cadastro_arbitros WHERE id != NEW.id;
  NEW.protocolo := 'ARB-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(seq::text, 5, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_gerar_protocolo_arbitro
BEFORE INSERT ON public.cadastro_arbitros
FOR EACH ROW
EXECUTE FUNCTION public.gerar_protocolo_arbitro();

-- Bucket para fotos e documentos de árbitros
INSERT INTO storage.buckets (id, name, public) VALUES ('arbitros-docs', 'arbitros-docs', true)
ON CONFLICT (id) DO NOTHING;

-- Política de upload público no bucket
CREATE POLICY "Upload público de documentos de árbitros"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'arbitros-docs');

-- Política de leitura pública
CREATE POLICY "Leitura pública de documentos de árbitros"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'arbitros-docs');
