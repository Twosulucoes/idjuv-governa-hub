-- ============================================
-- IDJuv - Schema de Migração
-- Arquivo 02: Tabelas Principais
-- ============================================
-- Execute APÓS 01_enums.sql
-- ============================================

-- ============================================
-- TABELAS DE SISTEMA E AUTENTICAÇÃO
-- ============================================

-- Profiles (extensão de auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  cpf TEXT UNIQUE,
  tipo_usuario public.tipo_usuario DEFAULT 'servidor',
  servidor_id UUID,
  is_active BOOLEAN DEFAULT true,
  blocked_at TIMESTAMPTZ,
  blocked_reason TEXT,
  requires_password_change BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Perfis de acesso
CREATE TABLE public.perfis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL UNIQUE,
  codigo VARCHAR(50) NOT NULL UNIQUE,
  descricao TEXT,
  nivel_hierarquia INTEGER NOT NULL DEFAULT 0,
  perfil_pai_id UUID REFERENCES public.perfis(id),
  ativo BOOLEAN NOT NULL DEFAULT true,
  sistema BOOLEAN NOT NULL DEFAULT false,
  cor VARCHAR(20),
  icone VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Funções/Permissões do sistema
CREATE TABLE public.funcoes_sistema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(100) NOT NULL UNIQUE,
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  modulo VARCHAR(100) NOT NULL,
  submodulo VARCHAR(100),
  tipo_acao VARCHAR(50) NOT NULL DEFAULT 'visualizar',
  funcao_pai_id UUID REFERENCES public.funcoes_sistema(id),
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  rota VARCHAR(255),
  icone VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Associação Perfil <-> Funções
CREATE TABLE public.perfil_funcoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
  funcao_id UUID NOT NULL REFERENCES public.funcoes_sistema(id) ON DELETE CASCADE,
  concedido BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE(perfil_id, funcao_id)
);

-- Associação Usuário <-> Perfis
CREATE TABLE public.usuario_perfis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  perfil_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fim DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE(user_id, perfil_id)
);

-- ============================================
-- ESTRUTURA ORGANIZACIONAL
-- ============================================

-- Estrutura organizacional (organograma)
CREATE TABLE public.estrutura_organizacional (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  sigla TEXT,
  tipo public.tipo_unidade NOT NULL,
  nivel INTEGER NOT NULL DEFAULT 0,
  superior_id UUID REFERENCES public.estrutura_organizacional(id),
  responsavel_id UUID,
  email TEXT,
  telefone TEXT,
  localizacao TEXT,
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Cargos
CREATE TABLE public.cargos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  sigla TEXT,
  descricao TEXT,
  categoria public.categoria_cargo NOT NULL DEFAULT 'efetivo',
  natureza public.natureza_cargo DEFAULT 'efetivo',
  nivel INTEGER DEFAULT 1,
  simbolo TEXT,
  valor_base DECIMAL(12,2),
  carga_horaria_semanal INTEGER DEFAULT 40,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Composição de cargos (vagas por unidade)
CREATE TABLE public.composicao_cargos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id UUID NOT NULL REFERENCES public.estrutura_organizacional(id),
  cargo_id UUID NOT NULL REFERENCES public.cargos(id),
  quantidade_total INTEGER NOT NULL DEFAULT 1,
  quantidade_ocupada INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(unidade_id, cargo_id)
);

-- ============================================
-- SERVIDORES E RH
-- ============================================

-- Servidores
CREATE TABLE public.servidores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo TEXT NOT NULL,
  nome_social TEXT,
  cpf VARCHAR(14) NOT NULL UNIQUE,
  rg TEXT,
  rg_orgao TEXT,
  rg_uf VARCHAR(2),
  data_nascimento DATE,
  sexo VARCHAR(1),
  estado_civil TEXT,
  nacionalidade TEXT DEFAULT 'Brasileira',
  naturalidade TEXT,
  pis_pasep TEXT,
  titulo_eleitor TEXT,
  zona_eleitoral TEXT,
  secao_eleitoral TEXT,
  certificado_reservista TEXT,
  cnh TEXT,
  cnh_categoria TEXT,
  cnh_validade DATE,
  email TEXT,
  email_institucional TEXT,
  telefone TEXT,
  celular TEXT,
  endereco_logradouro TEXT,
  endereco_numero TEXT,
  endereco_complemento TEXT,
  endereco_bairro TEXT,
  endereco_cidade TEXT,
  endereco_uf VARCHAR(2),
  endereco_cep TEXT,
  matricula TEXT UNIQUE,
  tipo_servidor public.tipo_servidor,
  situacao public.situacao_servidor NOT NULL DEFAULT 'ativo',
  cargo_atual_id UUID REFERENCES public.cargos(id),
  unidade_atual_id UUID REFERENCES public.estrutura_organizacional(id),
  data_admissao DATE,
  data_posse DATE,
  data_exercicio DATE,
  data_desligamento DATE,
  motivo_desligamento TEXT,
  banco_codigo TEXT,
  banco_nome TEXT,
  banco_agencia TEXT,
  banco_conta TEXT,
  banco_tipo_conta TEXT,
  banco_pix TEXT,
  foto_url TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Adicionar FK em profiles para servidor
ALTER TABLE public.profiles 
  ADD CONSTRAINT fk_profiles_servidor 
  FOREIGN KEY (servidor_id) REFERENCES public.servidores(id);

-- Lotações
CREATE TABLE public.lotacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL REFERENCES public.servidores(id),
  unidade_id UUID NOT NULL REFERENCES public.estrutura_organizacional(id),
  cargo_id UUID REFERENCES public.cargos(id),
  data_inicio DATE NOT NULL,
  data_fim DATE,
  ativo BOOLEAN DEFAULT true,
  motivo_mudanca TEXT,
  portaria_numero TEXT,
  portaria_data DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Provimentos (nomeações/designações)
CREATE TABLE public.provimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL REFERENCES public.servidores(id),
  cargo_id UUID NOT NULL REFERENCES public.cargos(id),
  unidade_id UUID NOT NULL REFERENCES public.estrutura_organizacional(id),
  tipo public.tipo_movimentacao_funcional NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  ato_tipo public.tipo_ato_nomeacao DEFAULT 'portaria',
  ato_numero TEXT,
  ato_data DATE,
  doe_numero TEXT,
  doe_data DATE,
  valor_adicional DECIMAL(12,2),
  percentual_adicional DECIMAL(5,2),
  status public.status_nomeacao DEFAULT 'ativo',
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Designações (funções gratificadas)
CREATE TABLE public.designacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL REFERENCES public.servidores(id),
  cargo_id UUID NOT NULL REFERENCES public.cargos(id),
  unidade_id UUID NOT NULL REFERENCES public.estrutura_organizacional(id),
  data_inicio DATE NOT NULL,
  data_fim DATE,
  portaria_numero TEXT,
  portaria_data DATE,
  doe_numero TEXT,
  doe_data DATE,
  valor_adicional DECIMAL(12,2),
  status public.status_nomeacao DEFAULT 'ativo',
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Vínculos funcionais
CREATE TABLE public.vinculos_funcionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL REFERENCES public.servidores(id),
  tipo_vinculo public.vinculo_funcional NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  ativo BOOLEAN DEFAULT true,
  portaria_numero TEXT,
  portaria_data DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Férias do servidor
CREATE TABLE public.ferias_servidor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL REFERENCES public.servidores(id),
  exercicio INTEGER NOT NULL,
  periodo_aquisitivo_inicio DATE,
  periodo_aquisitivo_fim DATE,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  dias_gozo INTEGER NOT NULL,
  dias_abono INTEGER DEFAULT 0,
  dias_vendidos INTEGER DEFAULT 0,
  status TEXT DEFAULT 'programada',
  portaria_numero TEXT,
  portaria_data DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- UNIDADES LOCAIS (Ginásios, Estádios, etc.)
-- ============================================

CREATE TABLE public.unidades_locais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  codigo_unidade TEXT UNIQUE,
  tipo_unidade public.tipo_unidade_local NOT NULL,
  status public.status_unidade_local DEFAULT 'ativa',
  endereco_logradouro TEXT,
  endereco_numero TEXT,
  endereco_bairro TEXT,
  endereco_cidade TEXT DEFAULT 'Goiânia',
  endereco_uf VARCHAR(2) DEFAULT 'GO',
  endereco_cep TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  capacidade_publico INTEGER,
  area_total_m2 DECIMAL(12,2),
  ano_construcao INTEGER,
  responsavel_id UUID REFERENCES public.servidores(id),
  unidade_gestora_id UUID REFERENCES public.estrutura_organizacional(id),
  telefone TEXT,
  email TEXT,
  website TEXT,
  horario_funcionamento TEXT,
  descricao TEXT,
  infraestrutura JSONB,
  foto_principal_url TEXT,
  galeria_fotos JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- FINANCEIRO
-- ============================================

-- Rubricas
CREATE TABLE public.rubricas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  descricao TEXT,
  tipo public.tipo_rubrica NOT NULL,
  natureza public.natureza_rubrica DEFAULT 'remuneratorio',
  incide_inss BOOLEAN DEFAULT true,
  incide_irrf BOOLEAN DEFAULT true,
  incide_fgts BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  formula TEXT,
  formula_tipo public.formula_tipo,
  valor_referencia DECIMAL(12,2),
  percentual_referencia DECIMAL(5,2),
  base_calculo TEXT,
  ordem_calculo INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Folhas de pagamento
CREATE TABLE public.folhas_pagamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competencia_mes INTEGER NOT NULL,
  competencia_ano INTEGER NOT NULL,
  tipo public.tipo_folha NOT NULL DEFAULT 'normal',
  status public.status_folha DEFAULT 'rascunho',
  data_abertura DATE,
  data_fechamento DATE,
  data_pagamento DATE,
  total_bruto DECIMAL(14,2) DEFAULT 0,
  total_descontos DECIMAL(14,2) DEFAULT 0,
  total_liquido DECIMAL(14,2) DEFAULT 0,
  total_servidores INTEGER DEFAULT 0,
  observacoes TEXT,
  created_by UUID,
  fechada_por UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(competencia_mes, competencia_ano, tipo)
);

-- Fichas financeiras
CREATE TABLE public.fichas_financeiras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folha_id UUID NOT NULL REFERENCES public.folhas_pagamento(id),
  servidor_id UUID NOT NULL REFERENCES public.servidores(id),
  cargo_id UUID REFERENCES public.cargos(id),
  unidade_id UUID REFERENCES public.estrutura_organizacional(id),
  total_bruto DECIMAL(12,2) DEFAULT 0,
  total_descontos DECIMAL(12,2) DEFAULT 0,
  total_liquido DECIMAL(12,2) DEFAULT 0,
  base_inss DECIMAL(12,2) DEFAULT 0,
  valor_inss DECIMAL(12,2) DEFAULT 0,
  base_irrf DECIMAL(12,2) DEFAULT 0,
  valor_irrf DECIMAL(12,2) DEFAULT 0,
  status TEXT DEFAULT 'calculada',
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(folha_id, servidor_id)
);

-- Itens da ficha financeira
CREATE TABLE public.itens_ficha_financeira (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ficha_id UUID NOT NULL REFERENCES public.fichas_financeiras(id) ON DELETE CASCADE,
  rubrica_id UUID NOT NULL REFERENCES public.rubricas(id),
  tipo TEXT NOT NULL, -- 'provento' ou 'desconto'
  referencia DECIMAL(12,4),
  valor DECIMAL(12,2) NOT NULL,
  origem public.origem_lancamento DEFAULT 'automatico',
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Bancos para CNAB
CREATE TABLE public.bancos_cnab (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_banco VARCHAR(3) NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  nome_reduzido TEXT,
  layout_cnab240 BOOLEAN DEFAULT true,
  layout_cnab400 BOOLEAN DEFAULT false,
  configuracao_cnab240 JSONB,
  configuracao_cnab400 JSONB,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- AUDITORIA E LOGS
-- ============================================

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action public.audit_action NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  user_id UUID,
  before_data JSONB,
  after_data JSONB,
  description TEXT,
  module_name TEXT,
  org_unit_id UUID REFERENCES public.estrutura_organizacional(id),
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ÍNDICES PRINCIPAIS
-- ============================================

CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_cpf ON public.profiles(cpf);
CREATE INDEX idx_servidores_cpf ON public.servidores(cpf);
CREATE INDEX idx_servidores_matricula ON public.servidores(matricula);
CREATE INDEX idx_servidores_situacao ON public.servidores(situacao);
CREATE INDEX idx_lotacoes_servidor ON public.lotacoes(servidor_id);
CREATE INDEX idx_lotacoes_unidade ON public.lotacoes(unidade_id);
CREATE INDEX idx_provimentos_servidor ON public.provimentos(servidor_id);
CREATE INDEX idx_fichas_folha ON public.fichas_financeiras(folha_id);
CREATE INDEX idx_fichas_servidor ON public.fichas_financeiras(servidor_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs(timestamp);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

-- ============================================
-- FIM DO ARQUIVO 02_tabelas_principais.sql
-- Próximo: 03_funcoes.sql
-- ============================================
