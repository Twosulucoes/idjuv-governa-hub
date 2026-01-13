
-- Tabela de Pré-Cadastros para Mini-Currículo
CREATE TABLE public.pre_cadastros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_acesso TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'enviado', 'aprovado', 'rejeitado', 'convertido')),
  
  -- Dados Pessoais
  nome_completo TEXT NOT NULL,
  nome_social TEXT,
  data_nascimento DATE,
  sexo TEXT,
  estado_civil TEXT,
  nacionalidade TEXT DEFAULT 'Brasileira',
  naturalidade_cidade TEXT,
  naturalidade_uf TEXT,
  foto_url TEXT,
  
  -- Documentos Pessoais
  cpf TEXT NOT NULL,
  rg TEXT,
  rg_orgao_expedidor TEXT,
  rg_uf TEXT,
  rg_data_emissao DATE,
  certidao_tipo TEXT,
  titulo_eleitor TEXT,
  titulo_zona TEXT,
  titulo_secao TEXT,
  certificado_reservista TEXT,
  
  -- Contato e Endereço
  email TEXT NOT NULL,
  telefone_celular TEXT,
  telefone_fixo TEXT,
  endereco_logradouro TEXT,
  endereco_numero TEXT,
  endereco_complemento TEXT,
  endereco_bairro TEXT,
  endereco_cidade TEXT,
  endereco_uf TEXT,
  endereco_cep TEXT,
  
  -- Documentos Previdenciários
  pis_pasep TEXT,
  
  -- Escolaridade/Habilitação
  escolaridade TEXT,
  formacao_academica TEXT,
  instituicao_ensino TEXT,
  ano_conclusao INTEGER,
  registro_conselho TEXT,
  conselho_numero TEXT,
  cnh_numero TEXT,
  cnh_categoria TEXT,
  cnh_validade DATE,
  
  -- Aptidões e Características
  habilidades TEXT[],
  idiomas JSONB DEFAULT '[]'::jsonb,
  experiencia_resumo TEXT,
  cursos_complementares JSONB DEFAULT '[]'::jsonb,
  
  -- Checklist de Documentos
  doc_rg BOOLEAN DEFAULT FALSE,
  doc_cpf BOOLEAN DEFAULT FALSE,
  doc_certidao BOOLEAN DEFAULT FALSE,
  doc_titulo_eleitor BOOLEAN DEFAULT FALSE,
  doc_certificado_reservista BOOLEAN DEFAULT FALSE,
  doc_comprovante_residencia BOOLEAN DEFAULT FALSE,
  doc_pis_pasep BOOLEAN DEFAULT FALSE,
  doc_diploma BOOLEAN DEFAULT FALSE,
  doc_historico_escolar BOOLEAN DEFAULT FALSE,
  doc_registro_conselho BOOLEAN DEFAULT FALSE,
  doc_certidao_criminal_estadual BOOLEAN DEFAULT FALSE,
  doc_certidao_criminal_federal BOOLEAN DEFAULT FALSE,
  doc_quitacao_eleitoral BOOLEAN DEFAULT FALSE,
  doc_certidao_improbidade BOOLEAN DEFAULT FALSE,
  doc_declaracao_acumulacao BOOLEAN DEFAULT FALSE,
  doc_declaracao_bens BOOLEAN DEFAULT FALSE,
  doc_termo_responsabilidade BOOLEAN DEFAULT FALSE,
  doc_comprovante_bancario BOOLEAN DEFAULT FALSE,
  
  -- Dados Bancários
  banco_nome TEXT,
  banco_codigo TEXT,
  banco_agencia TEXT,
  banco_conta TEXT,
  banco_tipo_conta TEXT,
  
  -- Dependentes
  dependentes JSONB DEFAULT '[]'::jsonb,
  
  -- Observações e Metadados
  observacoes TEXT,
  ip_envio TEXT,
  data_envio TIMESTAMP WITH TIME ZONE,
  servidor_id UUID REFERENCES public.servidores(id),
  convertido_em TIMESTAMP WITH TIME ZONE,
  convertido_por UUID,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_pre_cadastros_cpf ON public.pre_cadastros(cpf);
CREATE INDEX idx_pre_cadastros_status ON public.pre_cadastros(status);
CREATE INDEX idx_pre_cadastros_codigo ON public.pre_cadastros(codigo_acesso);
CREATE INDEX idx_pre_cadastros_created ON public.pre_cadastros(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.pre_cadastros ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Qualquer um pode criar um pré-cadastro (formulário público)
CREATE POLICY "Qualquer um pode criar pre-cadastro"
  ON public.pre_cadastros FOR INSERT
  WITH CHECK (true);

-- Qualquer um pode ler pelo código de acesso (para edição)
CREATE POLICY "Pre-cadastro pode ser lido publicamente"
  ON public.pre_cadastros FOR SELECT
  USING (true);

-- Qualquer um pode atualizar seu próprio pré-cadastro pelo código
CREATE POLICY "Pre-cadastro pode ser atualizado"
  ON public.pre_cadastros FOR UPDATE
  USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_pre_cadastros_updated_at
  BEFORE UPDATE ON public.pre_cadastros
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para gerar código de acesso único
CREATE OR REPLACE FUNCTION public.gerar_codigo_pre_cadastro()
RETURNS TEXT AS $$
DECLARE
  ano TEXT;
  sequencia INTEGER;
  codigo TEXT;
BEGIN
  ano := EXTRACT(YEAR FROM NOW())::TEXT;
  
  SELECT COALESCE(MAX(
    CASE 
      WHEN codigo_acesso LIKE 'PC-' || ano || '-%' 
      THEN NULLIF(SPLIT_PART(codigo_acesso, '-', 3), '')::INTEGER 
      ELSE 0 
    END
  ), 0) + 1
  INTO sequencia
  FROM public.pre_cadastros
  WHERE codigo_acesso LIKE 'PC-' || ano || '-%';
  
  codigo := 'PC-' || ano || '-' || LPAD(sequencia::TEXT, 4, '0');
  
  RETURN codigo;
END;
$$ LANGUAGE plpgsql;

-- Comentários
COMMENT ON TABLE public.pre_cadastros IS 'Pré-cadastros de candidatos via formulário de mini-currículo';
COMMENT ON COLUMN public.pre_cadastros.codigo_acesso IS 'Código único para o candidato acessar e editar seu formulário';
COMMENT ON COLUMN public.pre_cadastros.status IS 'Status do pré-cadastro: rascunho, enviado, aprovado, rejeitado, convertido';
