-- ============================================================
-- SCRIPT 2: CRIAR TABELAS FALTANTES
-- Execute SEGUNDO no SQL Editor do Supabase
-- ============================================================

-- Cargos
CREATE TABLE IF NOT EXISTS public.cargos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(200) NOT NULL,
  sigla VARCHAR(20),
  categoria public.categoria_cargo NOT NULL,
  natureza public.natureza_cargo,
  nivel_hierarquico INTEGER,
  vencimento_base DECIMAL(10,2),
  quantidade_vagas INTEGER,
  cbo VARCHAR(10),
  escolaridade VARCHAR(100),
  atribuicoes TEXT,
  requisitos TEXT[],
  competencias TEXT[],
  responsabilidades TEXT[],
  conhecimentos_necessarios TEXT[],
  experiencia_exigida TEXT,
  lei_criacao_numero VARCHAR(50),
  lei_criacao_data DATE,
  lei_criacao_artigo VARCHAR(50),
  lei_documento_url TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Estrutura Organizacional
CREATE TABLE IF NOT EXISTS public.estrutura_organizacional (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(200) NOT NULL,
  sigla VARCHAR(20),
  tipo public.tipo_unidade NOT NULL,
  nivel INTEGER DEFAULT 1,
  superior_id UUID REFERENCES public.estrutura_organizacional(id),
  responsavel_id UUID,
  cargo_responsavel VARCHAR(200),
  email VARCHAR(255),
  telefone VARCHAR(20),
  localizacao TEXT,
  competencias TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Servidores
CREATE TABLE IF NOT EXISTS public.servidores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo VARCHAR(200) NOT NULL,
  nome_social VARCHAR(200),
  cpf VARCHAR(14) NOT NULL UNIQUE,
  rg VARCHAR(20),
  rg_orgao VARCHAR(20),
  rg_uf CHAR(2),
  data_nascimento DATE,
  sexo CHAR(1),
  estado_civil VARCHAR(20),
  nacionalidade VARCHAR(50),
  naturalidade VARCHAR(100),
  nome_mae VARCHAR(200),
  nome_pai VARCHAR(200),
  email_pessoal VARCHAR(255),
  email_institucional VARCHAR(255),
  telefone VARCHAR(20),
  celular VARCHAR(20),
  endereco_logradouro VARCHAR(255),
  endereco_numero VARCHAR(20),
  endereco_complemento VARCHAR(100),
  endereco_bairro VARCHAR(100),
  endereco_cidade VARCHAR(100),
  endereco_uf CHAR(2),
  endereco_cep VARCHAR(10),
  pis_pasep VARCHAR(20),
  titulo_eleitor VARCHAR(20),
  zona_eleitoral VARCHAR(10),
  secao_eleitoral VARCHAR(10),
  ctps_numero VARCHAR(20),
  ctps_serie VARCHAR(10),
  ctps_uf CHAR(2),
  cnh_numero VARCHAR(20),
  cnh_categoria VARCHAR(5),
  cnh_validade DATE,
  certificado_reservista VARCHAR(20),
  banco_codigo VARCHAR(10),
  banco_nome VARCHAR(100),
  banco_agencia VARCHAR(20),
  banco_conta VARCHAR(30),
  banco_tipo_conta VARCHAR(20),
  matricula VARCHAR(20),
  situacao public.situacao_funcional DEFAULT 'ativo',
  tipo_servidor public.tipo_servidor,
  vinculo public.vinculo_funcional,
  cargo_atual_id UUID REFERENCES public.cargos(id),
  unidade_atual_id UUID REFERENCES public.estrutura_organizacional(id),
  data_admissao DATE,
  data_posse DATE,
  data_exercicio DATE,
  foto_url TEXT,
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Perfis
CREATE TABLE IF NOT EXISTS public.perfis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL,
  codigo VARCHAR(50),
  descricao TEXT,
  nivel VARCHAR(50),
  nivel_hierarquia INTEGER DEFAULT 0,
  perfil_pai_id UUID REFERENCES public.perfis(id),
  ativo BOOLEAN DEFAULT true,
  is_sistema BOOLEAN DEFAULT false,
  cor VARCHAR(20),
  icone VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Funções do Sistema
CREATE TABLE IF NOT EXISTS public.funcoes_sistema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(100) NOT NULL,
  nome VARCHAR(200) NOT NULL,
  modulo VARCHAR(100),
  submodulo VARCHAR(100),
  tipo_acao VARCHAR(50),
  ordem INTEGER DEFAULT 0,
  rota VARCHAR(255),
  icone VARCHAR(50),
  funcao_pai_id UUID REFERENCES public.funcoes_sistema(id),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Perfil x Funções
CREATE TABLE IF NOT EXISTS public.perfil_funcoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
  funcao_id UUID NOT NULL REFERENCES public.funcoes_sistema(id) ON DELETE CASCADE,
  concedido BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(perfil_id, funcao_id)
);

-- Usuario x Perfis
CREATE TABLE IF NOT EXISTS public.usuario_perfis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  perfil_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
  ativo BOOLEAN DEFAULT true,
  data_inicio DATE DEFAULT CURRENT_DATE,
  data_fim DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  UNIQUE(user_id, perfil_id)
);

-- Provimentos
CREATE TABLE IF NOT EXISTS public.provimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL REFERENCES public.servidores(id) ON DELETE CASCADE,
  cargo_id UUID NOT NULL REFERENCES public.cargos(id),
  unidade_id UUID REFERENCES public.estrutura_organizacional(id),
  tipo_provimento VARCHAR(50) NOT NULL,
  data_nomeacao DATE NOT NULL,
  data_posse DATE,
  data_exercicio DATE,
  portaria_numero VARCHAR(50),
  portaria_data DATE,
  doe_numero VARCHAR(50),
  doe_data DATE,
  status public.status_provimento DEFAULT 'ativo',
  motivo_encerramento VARCHAR(100),
  data_encerramento DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Lotações
CREATE TABLE IF NOT EXISTS public.lotacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL REFERENCES public.servidores(id) ON DELETE CASCADE,
  unidade_id UUID NOT NULL REFERENCES public.estrutura_organizacional(id),
  data_inicio DATE NOT NULL,
  data_fim DATE,
  tipo_lotacao VARCHAR(50),
  memorando_numero VARCHAR(50),
  memorando_data DATE,
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- Bancos CNAB
CREATE TABLE IF NOT EXISTS public.bancos_cnab (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_banco VARCHAR(10) NOT NULL,
  nome VARCHAR(200) NOT NULL,
  nome_reduzido VARCHAR(50),
  layout_cnab240 BOOLEAN DEFAULT false,
  layout_cnab400 BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Rubricas
CREATE TABLE IF NOT EXISTS public.rubricas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(20) NOT NULL,
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(20) NOT NULL,
  categoria VARCHAR(50),
  incide_inss BOOLEAN DEFAULT false,
  incide_irrf BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Parâmetros Folha
CREATE TABLE IF NOT EXISTS public.parametros_folha (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_parametro VARCHAR(100) NOT NULL,
  descricao VARCHAR(255),
  valor DECIMAL(15,4) NOT NULL,
  vigencia_inicio DATE NOT NULL,
  vigencia_fim DATE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela INSS
CREATE TABLE IF NOT EXISTS public.tabela_inss (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faixa_ordem INTEGER NOT NULL,
  valor_minimo DECIMAL(10,2) NOT NULL,
  valor_maximo DECIMAL(10,2),
  aliquota DECIMAL(5,4) NOT NULL,
  vigencia_inicio DATE NOT NULL,
  vigencia_fim DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela IRRF
CREATE TABLE IF NOT EXISTS public.tabela_irrf (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faixa_ordem INTEGER NOT NULL,
  valor_minimo DECIMAL(10,2) NOT NULL,
  valor_maximo DECIMAL(10,2),
  aliquota DECIMAL(5,4) NOT NULL,
  parcela_deduzir DECIMAL(10,2) NOT NULL,
  vigencia_inicio DATE NOT NULL,
  vigencia_fim DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Config Autarquia
CREATE TABLE IF NOT EXISTS public.config_autarquia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social VARCHAR(255) NOT NULL,
  nome_fantasia VARCHAR(255),
  cnpj VARCHAR(20) NOT NULL,
  natureza_juridica VARCHAR(100),
  regime_tributario VARCHAR(50),
  codigo_municipio VARCHAR(10),
  endereco_logradouro VARCHAR(255),
  endereco_numero VARCHAR(20),
  endereco_complemento VARCHAR(100),
  endereco_bairro VARCHAR(100),
  endereco_cidade VARCHAR(100),
  endereco_uf CHAR(2),
  endereco_cep VARCHAR(10),
  telefone VARCHAR(20),
  email_institucional VARCHAR(255),
  site VARCHAR(255),
  responsavel_legal VARCHAR(200),
  cargo_responsavel VARCHAR(100),
  cpf_responsavel VARCHAR(14),
  responsavel_contabil VARCHAR(200),
  cpf_contabil VARCHAR(14),
  crc_contabil VARCHAR(20),
  esocial_ambiente VARCHAR(20),
  esocial_processo_emissao VARCHAR(10),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

SELECT 'Tabelas criadas com sucesso!' as resultado;
