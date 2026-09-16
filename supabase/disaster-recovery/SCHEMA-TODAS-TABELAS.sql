-- ============================================================
-- IDJUV - SCHEMA COMPLETO (TODAS AS 82 TABELAS)
-- Execute no SQL Editor do seu Supabase
-- ============================================================

-- ============================================================
-- PARTE 1: TIPOS ENUM
-- ============================================================
DO $$ BEGIN CREATE TYPE public.access_scope AS ENUM ('all', 'org_unit', 'local_unit', 'own', 'readonly'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.app_permission AS ENUM ('users.read', 'users.create', 'users.update', 'users.delete', 'content.read', 'content.create', 'content.update', 'content.delete', 'reports.view', 'reports.export', 'settings.view', 'settings.edit', 'processes.read', 'processes.create', 'processes.update', 'processes.delete', 'processes.approve', 'roles.manage', 'permissions.manage', 'documents.view', 'documents.create', 'documents.edit', 'documents.delete', 'requests.create', 'requests.view', 'requests.approve', 'requests.reject', 'audit.view', 'audit.export', 'approval.delegate', 'org_units.manage', 'mfa.manage'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'user', 'guest', 'presidencia', 'diraf', 'rh', 'ti_admin', 'gabinete', 'controle_interno', 'juridico', 'cpl', 'ascom', 'cadastrador_local', 'cadastrador_setor', 'cadastrador_leitura'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.approval_status AS ENUM ('draft', 'submitted', 'in_review', 'approved', 'rejected', 'cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.audit_action AS ENUM ('login', 'logout', 'login_failed', 'password_change', 'password_reset', 'create', 'update', 'delete', 'view', 'export', 'upload', 'download', 'approve', 'reject', 'submit'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.backup_status AS ENUM ('pending', 'running', 'success', 'failed', 'partial'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.backup_type AS ENUM ('daily', 'weekly', 'monthly', 'manual'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.categoria_cargo AS ENUM ('efetivo', 'comissionado', 'funcao_gratificada', 'temporario', 'estagiario'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.categoria_demanda_ascom AS ENUM ('interna', 'externa', 'evento', 'campanha', 'crise', 'rotina'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.categoria_portaria AS ENUM ('estruturante', 'normativa', 'pessoal', 'delegacao'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.estado_conservacao AS ENUM ('otimo', 'bom', 'regular', 'ruim', 'inservivel'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.natureza_cargo AS ENUM ('direcao', 'chefia', 'assessoramento', 'execucao'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.prioridade_demanda_ascom AS ENUM ('baixa', 'media', 'alta', 'urgente'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.situacao_funcional AS ENUM ('ativo', 'afastado', 'cedido', 'licenca', 'ferias', 'exonerado', 'aposentado', 'falecido', 'inativo'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.situacao_patrimonio AS ENUM ('em_uso', 'em_estoque', 'cedido', 'em_manutencao', 'baixado'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.status_agenda AS ENUM ('solicitado', 'aprovado', 'rejeitado', 'cancelado', 'concluido'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.status_demanda_ascom AS ENUM ('solicitado', 'em_analise', 'aprovado', 'em_execucao', 'aguardando_aprovacao', 'concluido', 'cancelado', 'indeferido'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.status_documento AS ENUM ('rascunho', 'aguardando_publicacao', 'publicado', 'vigente', 'revogado'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.status_folha AS ENUM ('aberta', 'processando', 'processada', 'fechada', 'paga', 'cancelada', 'reaberta', 'previa'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.status_nomeacao AS ENUM ('ativo', 'encerrado', 'revogado'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.status_ponto AS ENUM ('completo', 'incompleto', 'pendente_justificativa', 'justificado', 'aprovado'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.status_provimento AS ENUM ('ativo', 'encerrado', 'suspenso'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.status_reuniao AS ENUM ('agendada', 'confirmada', 'em_andamento', 'concluida', 'cancelada', 'adiada'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.status_solicitacao AS ENUM ('pendente', 'aprovada', 'rejeitada', 'cancelada'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.status_termo_cessao AS ENUM ('pendente', 'emitido', 'assinado', 'cancelado'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.status_unidade_local AS ENUM ('ativa', 'inativa', 'manutencao', 'interditada'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.tipo_afastamento AS ENUM ('licenca', 'suspensao', 'cessao', 'disposicao', 'servico_externo', 'missao', 'outro'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.tipo_ato_nomeacao AS ENUM ('portaria', 'decreto', 'ato', 'outro'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.tipo_demanda_ascom AS ENUM ('design_arte_simples', 'design_arte_complexa', 'design_identidade_visual', 'video_gravacao', 'video_edicao', 'video_cobertura', 'foto_cobertura', 'foto_institucional', 'redes_post', 'redes_stories', 'redes_campanha', 'conteudo_release', 'conteudo_nota_oficial', 'conteudo_materia', 'imprensa_agendamento_entrevista', 'imprensa_atendimento', 'evento_organizacao', 'evento_apoio', 'evento_cobertura_completa', 'emergencial_crise', 'emergencial_posicionamento'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.tipo_documento AS ENUM ('portaria', 'resolucao', 'instrucao_normativa', 'ordem_servico', 'comunicado', 'decreto', 'lei', 'outro'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.tipo_folha AS ENUM ('normal', 'complementar', 'decimo_terceiro', 'ferias', 'rescisao'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.tipo_justificativa AS ENUM ('atestado', 'declaracao', 'trabalho_externo', 'esquecimento', 'problema_sistema', 'outro'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.tipo_lancamento_horas AS ENUM ('credito', 'debito', 'ajuste'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.tipo_licenca AS ENUM ('maternidade', 'paternidade', 'medica', 'casamento', 'luto', 'interesse_particular', 'capacitacao', 'premio', 'mandato_eletivo', 'mandato_classista', 'outra'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.tipo_movimentacao_funcional AS ENUM ('nomeacao', 'exoneracao', 'designacao', 'dispensa', 'promocao', 'transferencia', 'cessao', 'requisicao', 'redistribuicao', 'remocao', 'afastamento', 'retorno', 'aposentadoria', 'vacancia'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.tipo_portaria_rh AS ENUM ('nomeacao', 'exoneracao', 'designacao', 'dispensa', 'ferias', 'viagem', 'cessao', 'afastamento', 'substituicao', 'gratificacao', 'comissao', 'outro'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.tipo_registro_ponto AS ENUM ('normal', 'feriado', 'folga', 'atestado', 'falta', 'ferias', 'licenca'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.tipo_servidor AS ENUM ('comissionado_idjuv', 'efetivo_idjuv', 'cedido_entrada', 'cedido_saida', 'temporario', 'estagiario'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.tipo_unidade AS ENUM ('presidencia', 'diretoria', 'departamento', 'setor', 'divisao', 'secao', 'coordenacao'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.tipo_unidade_local AS ENUM ('ginasio', 'estadio', 'parque_aquatico', 'piscina', 'complexo', 'quadra', 'outro'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.tipo_usuario AS ENUM ('servidor', 'tecnico'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.vinculo_funcional AS ENUM ('efetivo', 'comissionado', 'cedido', 'temporario', 'estagiario', 'requisitado'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- PARTE 2: TABELAS BASE
-- ============================================================

-- Adicionar colunas na profiles existente
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tipo_usuario public.tipo_usuario DEFAULT 'servidor';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS servidor_id UUID;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf VARCHAR(14);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blocked_reason TEXT;

-- user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

-- user_permissions
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission public.app_permission NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, permission)
);

-- role_permissions
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  permission public.app_permission NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(role, permission)
);

-- user_org_units
CREATE TABLE IF NOT EXISTS public.user_org_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unidade_id UUID NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- user_security_settings
CREATE TABLE IF NOT EXISTS public.user_security_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  force_password_change BOOLEAN DEFAULT true,
  mfa_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- module_access_scopes
CREATE TABLE IF NOT EXISTS public.module_access_scopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  module_name VARCHAR(100) NOT NULL,
  scope public.access_scope NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- cargos
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

-- estrutura_organizacional
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

-- servidores
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
  cargo_atual_id UUID,
  unidade_atual_id UUID,
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

-- perfis
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

-- funcoes_sistema
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

-- perfil_funcoes
CREATE TABLE IF NOT EXISTS public.perfil_funcoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
  funcao_id UUID NOT NULL REFERENCES public.funcoes_sistema(id) ON DELETE CASCADE,
  concedido BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(perfil_id, funcao_id)
);

-- usuario_perfis
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

-- provimentos
CREATE TABLE IF NOT EXISTS public.provimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL,
  cargo_id UUID NOT NULL,
  unidade_id UUID,
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

-- lotacoes
CREATE TABLE IF NOT EXISTS public.lotacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL,
  unidade_id UUID NOT NULL,
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

-- cessoes
CREATE TABLE IF NOT EXISTS public.cessoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL,
  tipo VARCHAR(20) NOT NULL,
  orgao_origem VARCHAR(200),
  orgao_destino VARCHAR(200),
  cargo_origem VARCHAR(200),
  cargo_destino VARCHAR(200),
  vinculo_origem VARCHAR(50),
  onus VARCHAR(50),
  data_inicio DATE NOT NULL,
  data_fim DATE,
  data_retorno DATE,
  fundamentacao_legal TEXT,
  unidade_idjuv_id UUID,
  funcao_exercida_idjuv VARCHAR(200),
  ato_tipo VARCHAR(50),
  ato_numero VARCHAR(50),
  ato_data DATE,
  ato_url TEXT,
  ato_doe_numero VARCHAR(50),
  ato_doe_data DATE,
  ato_retorno_numero VARCHAR(50),
  ato_retorno_data DATE,
  ativa BOOLEAN DEFAULT true,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- designacoes
CREATE TABLE IF NOT EXISTS public.designacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL,
  funcao VARCHAR(200) NOT NULL,
  unidade_id UUID,
  tipo VARCHAR(50),
  data_inicio DATE NOT NULL,
  data_fim DATE,
  portaria_numero VARCHAR(50),
  portaria_data DATE,
  doe_numero VARCHAR(50),
  doe_data DATE,
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- ferias_servidor
CREATE TABLE IF NOT EXISTS public.ferias_servidor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL,
  exercicio INTEGER NOT NULL,
  periodo_aquisitivo_inicio DATE,
  periodo_aquisitivo_fim DATE,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  dias_gozo INTEGER,
  dias_abono INTEGER,
  status VARCHAR(50) DEFAULT 'agendada',
  portaria_numero VARCHAR(50),
  portaria_data DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- licencas_afastamentos
CREATE TABLE IF NOT EXISTS public.licencas_afastamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL,
  tipo_afastamento public.tipo_afastamento NOT NULL,
  tipo_licenca public.tipo_licenca,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  dias_afastamento INTEGER,
  motivo TEXT,
  documento_numero VARCHAR(50),
  documento_data DATE,
  status VARCHAR(50) DEFAULT 'ativa',
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- historico_funcional
CREATE TABLE IF NOT EXISTS public.historico_funcional (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL,
  tipo_movimentacao public.tipo_movimentacao_funcional NOT NULL,
  data_movimentacao DATE NOT NULL,
  cargo_id UUID,
  unidade_id UUID,
  documento_tipo VARCHAR(50),
  documento_numero VARCHAR(50),
  documento_data DATE,
  descricao TEXT,
  observacoes TEXT,
  dados_adicionais JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- bancos_cnab
CREATE TABLE IF NOT EXISTS public.bancos_cnab (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_banco VARCHAR(10) NOT NULL,
  nome VARCHAR(200) NOT NULL,
  nome_reduzido VARCHAR(50),
  layout_cnab240 BOOLEAN DEFAULT false,
  layout_cnab400 BOOLEAN DEFAULT false,
  configuracao_cnab240 JSONB,
  configuracao_cnab400 JSONB,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- rubricas
CREATE TABLE IF NOT EXISTS public.rubricas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(20) NOT NULL,
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(20) NOT NULL,
  categoria VARCHAR(50),
  incide_inss BOOLEAN DEFAULT false,
  incide_irrf BOOLEAN DEFAULT false,
  incide_fgts BOOLEAN DEFAULT false,
  compoe_remuneracao BOOLEAN DEFAULT true,
  valor_fixo DECIMAL(10,2),
  percentual DECIMAL(5,2),
  formula TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- parametros_folha
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

-- tabela_inss
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

-- tabela_irrf
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

-- folhas_pagamento
CREATE TABLE IF NOT EXISTS public.folhas_pagamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competencia_ano INTEGER NOT NULL,
  competencia_mes INTEGER NOT NULL,
  tipo_folha public.tipo_folha DEFAULT 'normal',
  descricao VARCHAR(200),
  status public.status_folha DEFAULT 'aberta',
  data_abertura DATE,
  data_fechamento DATE,
  data_processamento TIMESTAMPTZ,
  data_pagamento DATE,
  quantidade_servidores INTEGER DEFAULT 0,
  total_bruto DECIMAL(15,2) DEFAULT 0,
  total_descontos DECIMAL(15,2) DEFAULT 0,
  total_liquido DECIMAL(15,2) DEFAULT 0,
  total_inss_servidor DECIMAL(15,2) DEFAULT 0,
  total_inss_patronal DECIMAL(15,2) DEFAULT 0,
  total_irrf DECIMAL(15,2) DEFAULT 0,
  total_fgts DECIMAL(15,2) DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  UNIQUE(competencia_ano, competencia_mes, tipo_folha)
);

-- fichas_financeiras
CREATE TABLE IF NOT EXISTS public.fichas_financeiras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folha_id UUID,
  servidor_id UUID NOT NULL,
  competencia_ano INTEGER NOT NULL,
  competencia_mes INTEGER NOT NULL,
  tipo_folha public.tipo_folha DEFAULT 'normal',
  cargo_id UUID,
  cargo_nome VARCHAR(200),
  cargo_vencimento DECIMAL(10,2),
  unidade_id UUID,
  unidade_nome VARCHAR(200),
  total_proventos DECIMAL(10,2) DEFAULT 0,
  total_descontos DECIMAL(10,2) DEFAULT 0,
  valor_liquido DECIMAL(10,2) DEFAULT 0,
  base_inss DECIMAL(10,2),
  valor_inss DECIMAL(10,2),
  base_irrf DECIMAL(10,2),
  valor_irrf DECIMAL(10,2),
  quantidade_dependentes INTEGER DEFAULT 0,
  valor_deducao_dependentes DECIMAL(10,2),
  banco_codigo VARCHAR(10),
  banco_nome VARCHAR(100),
  banco_agencia VARCHAR(20),
  banco_conta VARCHAR(30),
  banco_tipo_conta VARCHAR(20),
  processado BOOLEAN DEFAULT false,
  data_processamento TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- config_autarquia
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

-- contas_autarquia
CREATE TABLE IF NOT EXISTS public.contas_autarquia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banco_id UUID,
  descricao VARCHAR(200) NOT NULL,
  agencia VARCHAR(20) NOT NULL,
  agencia_digito VARCHAR(5),
  conta VARCHAR(30) NOT NULL,
  conta_digito VARCHAR(5),
  tipo_conta VARCHAR(20),
  codigo_cedente VARCHAR(20),
  convenio_pagamento VARCHAR(20),
  codigo_transmissao VARCHAR(30),
  uso_principal VARCHAR(50),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- unidades_locais
CREATE TABLE IF NOT EXISTS public.unidades_locais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(200) NOT NULL,
  codigo_unidade VARCHAR(50),
  tipo_unidade public.tipo_unidade_local NOT NULL,
  endereco_logradouro VARCHAR(255),
  endereco_numero VARCHAR(20),
  endereco_bairro VARCHAR(100),
  endereco_cidade VARCHAR(100),
  endereco_uf CHAR(2),
  endereco_cep VARCHAR(10),
  telefone VARCHAR(20),
  email VARCHAR(255),
  responsavel_nome VARCHAR(200),
  responsavel_cargo VARCHAR(100),
  capacidade INTEGER,
  area_total DECIMAL(10,2),
  status public.status_unidade_local DEFAULT 'ativa',
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- agenda_unidade
CREATE TABLE IF NOT EXISTS public.agenda_unidade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_local_id UUID NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  descricao TEXT,
  tipo_uso VARCHAR(100) NOT NULL,
  data_inicio TIMESTAMPTZ NOT NULL,
  data_fim TIMESTAMPTZ NOT NULL,
  solicitante_nome VARCHAR(200) NOT NULL,
  solicitante_documento VARCHAR(20),
  solicitante_telefone VARCHAR(20),
  solicitante_email VARCHAR(255),
  status public.status_agenda DEFAULT 'solicitado',
  aprovador_id UUID,
  data_aprovacao TIMESTAMPTZ,
  motivo_rejeicao TEXT,
  observacoes TEXT,
  numero_protocolo VARCHAR(50),
  ano_vigencia INTEGER,
  historico_status JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- patrimonio_unidade
CREATE TABLE IF NOT EXISTS public.patrimonio_unidade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_local_id UUID NOT NULL,
  numero_tombo VARCHAR(50),
  descricao VARCHAR(255) NOT NULL,
  categoria VARCHAR(100),
  marca VARCHAR(100),
  modelo VARCHAR(100),
  numero_serie VARCHAR(100),
  estado_conservacao public.estado_conservacao DEFAULT 'bom',
  situacao public.situacao_patrimonio DEFAULT 'em_uso',
  valor_aquisicao DECIMAL(12,2),
  data_aquisicao DATE,
  nota_fiscal VARCHAR(50),
  fornecedor VARCHAR(200),
  observacoes TEXT,
  foto_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- documentos
CREATE TABLE IF NOT EXISTS public.documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo public.tipo_documento NOT NULL,
  numero VARCHAR(50),
  ano INTEGER,
  data_documento DATE,
  ementa TEXT,
  conteudo TEXT,
  status public.status_documento DEFAULT 'rascunho',
  data_publicacao DATE,
  doe_numero VARCHAR(50),
  doe_data DATE,
  arquivo_url TEXT,
  categoria public.categoria_portaria,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- portarias_servidor
CREATE TABLE IF NOT EXISTS public.portarias_servidor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL,
  documento_id UUID,
  tipo_portaria public.tipo_portaria_rh NOT NULL,
  numero VARCHAR(50),
  data_portaria DATE,
  data_inicio_efeito DATE,
  data_fim_efeito DATE,
  descricao TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- pre_cadastros
CREATE TABLE IF NOT EXISTS public.pre_cadastros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_acesso VARCHAR(20) UNIQUE,
  status VARCHAR(50) DEFAULT 'pendente',
  nome_completo VARCHAR(200) NOT NULL,
  cpf VARCHAR(14) NOT NULL,
  email VARCHAR(255),
  telefone VARCHAR(20),
  dados_pessoais JSONB,
  documentos JSONB,
  endereco JSONB,
  dados_bancarios JSONB,
  escolaridade JSONB,
  aptidoes JSONB,
  dependentes JSONB,
  previdencia JSONB,
  checklist JSONB,
  observacoes TEXT,
  convertido_em TIMESTAMPTZ,
  servidor_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- reunioes
CREATE TABLE IF NOT EXISTS public.reunioes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(200) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(50),
  data_hora TIMESTAMPTZ NOT NULL,
  duracao_prevista INTEGER,
  local VARCHAR(255),
  link_virtual VARCHAR(500),
  status public.status_reuniao DEFAULT 'agendada',
  pauta TEXT,
  ata TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- participantes_reuniao
CREATE TABLE IF NOT EXISTS public.participantes_reuniao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reuniao_id UUID NOT NULL,
  servidor_id UUID,
  nome_externo VARCHAR(200),
  email VARCHAR(255),
  telefone VARCHAR(20),
  instituicao VARCHAR(200),
  confirmado BOOLEAN DEFAULT false,
  presente BOOLEAN DEFAULT false,
  data_confirmacao TIMESTAMPTZ,
  data_checkin TIMESTAMPTZ,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- federacoes_esportivas
CREATE TABLE IF NOT EXISTS public.federacoes_esportivas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(200) NOT NULL,
  sigla VARCHAR(20),
  modalidade VARCHAR(100),
  presidente VARCHAR(200),
  email VARCHAR(255),
  telefone VARCHAR(20),
  endereco TEXT,
  cnpj VARCHAR(20),
  data_fundacao DATE,
  situacao VARCHAR(50) DEFAULT 'ativa',
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action public.audit_action NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  module_name VARCHAR(100),
  before_data JSONB,
  after_data JSONB,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  role_at_time public.app_role,
  org_unit_id UUID,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- approval_requests
CREATE TABLE IF NOT EXISTS public.approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID NOT NULL,
  module_name VARCHAR(100) NOT NULL,
  requester_id UUID NOT NULL,
  requester_org_unit_id UUID,
  approver_id UUID,
  status public.approval_status DEFAULT 'draft',
  priority VARCHAR(20),
  due_date DATE,
  justification TEXT,
  approver_decision TEXT,
  approved_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  attachments JSONB,
  electronic_signature JSONB,
  status_history JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- approval_delegations
CREATE TABLE IF NOT EXISTS public.approval_delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delegator_id UUID NOT NULL,
  delegate_id UUID NOT NULL,
  module_name VARCHAR(100),
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  reason TEXT,
  is_active BOOLEAN DEFAULT true,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- backup_config
CREATE TABLE IF NOT EXISTS public.backup_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled BOOLEAN DEFAULT true,
  schedule_cron VARCHAR(50),
  retention_daily INTEGER DEFAULT 7,
  retention_weekly INTEGER DEFAULT 4,
  retention_monthly INTEGER DEFAULT 12,
  weekly_day INTEGER DEFAULT 0,
  encryption_enabled BOOLEAN DEFAULT true,
  buckets_included TEXT[],
  last_backup_at TIMESTAMPTZ,
  last_backup_status public.backup_status,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- backup_history
CREATE TABLE IF NOT EXISTS public.backup_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type public.backup_type NOT NULL,
  status public.backup_status DEFAULT 'pending',
  trigger_mode VARCHAR(20),
  triggered_by UUID,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  db_file_path TEXT,
  db_file_size BIGINT,
  db_checksum VARCHAR(64),
  storage_file_path TEXT,
  storage_file_size BIGINT,
  storage_checksum VARCHAR(64),
  storage_objects_count INTEGER,
  manifest_path TEXT,
  manifest_checksum VARCHAR(64),
  total_size BIGINT,
  system_version VARCHAR(20),
  error_message TEXT,
  error_details JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Demais tabelas auxiliares
CREATE TABLE IF NOT EXISTS public.dependentes_irrf (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), servidor_id UUID, nome VARCHAR(200), cpf VARCHAR(14), data_nascimento DATE, parentesco VARCHAR(50), ativo BOOLEAN DEFAULT true, deduz_irrf BOOLEAN DEFAULT true, data_inicio_deducao DATE, data_fim_deducao DATE, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS public.consignacoes (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), servidor_id UUID, consignataria_nome VARCHAR(200) NOT NULL, valor_parcela DECIMAL(10,2) NOT NULL, total_parcelas INTEGER NOT NULL, data_inicio DATE NOT NULL, ativo BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS public.pensoes_alimenticias (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), servidor_id UUID, beneficiario_nome VARCHAR(200), tipo_calculo VARCHAR(20), valor_fixo DECIMAL(10,2), percentual DECIMAL(5,2), ativo BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS public.viagens_diarias (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), servidor_id UUID, destino VARCHAR(200), data_inicio DATE, data_fim DATE, motivo TEXT, status VARCHAR(50) DEFAULT 'solicitada', created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS public.feriados (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), data DATE NOT NULL, descricao VARCHAR(200), tipo VARCHAR(50), abrangencia VARCHAR(50), created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS public.centros_custo (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), codigo VARCHAR(20) NOT NULL, descricao VARCHAR(200) NOT NULL, unidade_id UUID, ativo BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS public.composicao_cargos (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), unidade_id UUID NOT NULL, cargo_id UUID NOT NULL, quantidade_vagas INTEGER, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS public.cargo_unidade_compatibilidade (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), cargo_id UUID, tipo_unidade public.tipo_unidade, unidade_especifica_id UUID, quantidade_maxima INTEGER, observacao TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS public.vinculos_funcionais (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), servidor_id UUID NOT NULL, tipo_vinculo VARCHAR(50), data_inicio DATE, data_fim DATE, observacoes TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS public.ocorrencias_servidor (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), servidor_id UUID NOT NULL, tipo VARCHAR(50), data_ocorrencia DATE, descricao TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS public.memorandos_lotacao (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), lotacao_id UUID, numero_protocolo VARCHAR(50), ano INTEGER, data_emissao DATE, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS public.documentos_cedencia (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), unidade_local_id UUID, tipo_documento VARCHAR(50), nome_arquivo VARCHAR(255), url_arquivo TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS public.termos_cessao (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), unidade_local_id UUID, numero_termo VARCHAR(50), data_emissao DATE, status public.status_termo_cessao DEFAULT 'pendente', created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS public.nomeacoes_chefe_unidade (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), unidade_local_id UUID, servidor_id UUID, cargo VARCHAR(100), data_inicio DATE, data_fim DATE, ato_numero VARCHAR(50), status public.status_nomeacao DEFAULT 'ativo', created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS public.demandas_ascom (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), numero_demanda VARCHAR(50), ano INTEGER, titulo VARCHAR(200) NOT NULL, tipo public.tipo_demanda_ascom NOT NULL, categoria public.categoria_demanda_ascom NOT NULL, prioridade public.prioridade_demanda_ascom DEFAULT 'media', status public.status_demanda_ascom DEFAULT 'solicitado', nome_responsavel VARCHAR(200) NOT NULL, prazo_entrega DATE NOT NULL, descricao_detalhada TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now(), created_by UUID, updated_by UUID);
CREATE TABLE IF NOT EXISTS public.demandas_ascom_anexos (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), demanda_id UUID, nome_arquivo VARCHAR(255), url_arquivo TEXT, tipo_arquivo VARCHAR(50), created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS public.demandas_ascom_comentarios (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), demanda_id UUID, autor_id UUID, comentario TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS public.demandas_ascom_entregaveis (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), demanda_id UUID, nome VARCHAR(200), url_arquivo TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS public.config_assinatura_reuniao (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), nome_configuracao VARCHAR(100) NOT NULL, nome_assinante_1 VARCHAR(200), cargo_assinante_1 VARCHAR(100), nome_assinante_2 VARCHAR(200), cargo_assinante_2 VARCHAR(100), texto_cabecalho TEXT, texto_rodape TEXT, ativo BOOLEAN DEFAULT true, padrao BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS public.modelos_mensagem_reuniao (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), nome VARCHAR(100) NOT NULL, tipo VARCHAR(50), assunto VARCHAR(200), corpo TEXT, ativo BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS public.historico_convites_reuniao (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), participante_id UUID, tipo_envio VARCHAR(50), data_envio TIMESTAMPTZ, status VARCHAR(50), created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS public.registros_ponto (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), servidor_id UUID NOT NULL, data DATE NOT NULL, tipo_registro public.tipo_registro_ponto DEFAULT 'normal', entrada_1 TIMESTAMPTZ, saida_1 TIMESTAMPTZ, entrada_2 TIMESTAMPTZ, saida_2 TIMESTAMPTZ, status public.status_ponto DEFAULT 'completo', created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS public.frequencia_mensal (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), servidor_id UUID NOT NULL, ano INTEGER NOT NULL, mes INTEGER NOT NULL, dias_trabalhados INTEGER, faltas INTEGER, atrasos INTEGER, horas_extras DECIMAL(5,2), created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS public.justificativas_ponto (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), registro_ponto_id UUID, tipo public.tipo_justificativa, descricao TEXT, documento_url TEXT, aprovado BOOLEAN, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS public.solicitacoes_ajuste_ponto (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), servidor_id UUID, data_referencia DATE, motivo TEXT, status public.status_solicitacao DEFAULT 'pendente', created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS public.banco_horas (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), servidor_id UUID NOT NULL, ano INTEGER NOT NULL, mes INTEGER NOT NULL, saldo_anterior DECIMAL(6,2), horas_extras DECIMAL(6,2), horas_compensadas DECIMAL(6,2), saldo_atual DECIMAL(6,2), created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS public.lancamentos_banco_horas (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), banco_horas_id UUID, tipo public.tipo_lancamento_horas, horas DECIMAL(5,2), descricao TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS public.configuracao_jornada (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), servidor_id UUID NOT NULL UNIQUE, carga_horaria_semanal INTEGER DEFAULT 40, horas_por_dia DECIMAL(4,2) DEFAULT 8, dias_trabalho INTEGER[], tolerancia_atraso INTEGER DEFAULT 10, permite_ponto_remoto BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS public.horarios_jornada (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), configuracao_jornada_id UUID, dia_semana INTEGER, entrada TIME, saida TIME, intervalo_inicio TIME, intervalo_fim TIME);
CREATE TABLE IF NOT EXISTS public.itens_ficha_financeira (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ficha_id UUID, rubrica_id UUID, tipo VARCHAR(20), descricao VARCHAR(200), referencia DECIMAL(10,4), valor DECIMAL(10,2), created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS public.lancamentos_folha (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), folha_id UUID, servidor_id UUID, rubrica_id UUID, tipo VARCHAR(20), valor DECIMAL(10,2), referencia DECIMAL(10,4), observacao TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS public.remessas_bancarias (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), folha_id UUID, conta_autarquia_id UUID, tipo_arquivo VARCHAR(20), numero_remessa INTEGER, data_geracao TIMESTAMPTZ, arquivo_conteudo TEXT, status VARCHAR(50), created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS public.retornos_bancarios (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), remessa_id UUID, arquivo_nome VARCHAR(255), data_processamento TIMESTAMPTZ, registros_totais INTEGER, registros_pagos INTEGER, registros_rejeitados INTEGER, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS public.itens_retorno_bancario (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), retorno_id UUID, ficha_id UUID, codigo_ocorrencia VARCHAR(10), descricao_ocorrencia VARCHAR(255), status VARCHAR(50));
CREATE TABLE IF NOT EXISTS public.exportacoes_folha (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), folha_id UUID, tipo_exportacao VARCHAR(50), formato VARCHAR(20), arquivo_url TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS public.eventos_esocial (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), servidor_id UUID, tipo_evento VARCHAR(20), xml_conteudo TEXT, status VARCHAR(50), protocolo VARCHAR(100), created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS public.rubricas_historico (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), rubrica_id UUID, campo_alterado VARCHAR(50), valor_anterior TEXT, valor_novo TEXT, alterado_por UUID, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS public.backup_integrity_checks (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), backup_id UUID, is_valid BOOLEAN, db_checksum_valid BOOLEAN, storage_checksum_valid BOOLEAN, manifest_valid BOOLEAN, details JSONB, checked_at TIMESTAMPTZ, checked_by UUID, created_at TIMESTAMPTZ DEFAULT now());

SELECT 'TODAS as tabelas foram criadas com sucesso!' as resultado;
