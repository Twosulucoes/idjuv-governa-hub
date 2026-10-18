-- ============================================================
-- IDJUV - BACKUP COMPLETO - TABELAS
-- Gerado em: 2026-02-08
-- Total: 160+ tabelas
-- ============================================================

-- ============================================
-- USUÁRIOS E AUTENTICAÇÃO
-- ============================================

-- Profiles (base para usuários)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  cpf VARCHAR(14),
  avatar_url TEXT,
  tipo_usuario VARCHAR DEFAULT 'servidor',
  servidor_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- User Roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

-- User Permissions
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission app_permission NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, permission)
);

-- Role Permissions
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  permission app_permission NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(role, permission)
);

-- User Security Settings
CREATE TABLE IF NOT EXISTS public.user_security_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  force_password_change BOOLEAN DEFAULT false,
  mfa_enabled BOOLEAN DEFAULT false,
  last_password_change TIMESTAMPTZ,
  password_expires_at TIMESTAMPTZ,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Module Access Scopes
CREATE TABLE IF NOT EXISTS public.module_access_scopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  module_name VARCHAR NOT NULL,
  access_scope access_scope DEFAULT 'own',
  can_create BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  can_approve BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User Modules
CREATE TABLE IF NOT EXISTS public.user_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module app_module NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  ativo BOOLEAN DEFAULT true,
  UNIQUE(user_id, module)
);

-- ============================================
-- PERFIS E FUNÇÕES DO SISTEMA
-- ============================================

CREATE TABLE IF NOT EXISTS public.perfis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  nivel_hierarquia INTEGER DEFAULT 0,
  perfil_pai_id UUID REFERENCES public.perfis(id),
  sistema BOOLEAN DEFAULT false,
  cor VARCHAR(20),
  icone VARCHAR(50),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

CREATE TABLE IF NOT EXISTS public.funcoes_sistema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(100) NOT NULL UNIQUE,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  modulo VARCHAR(50) NOT NULL,
  submodulo VARCHAR(50),
  tipo_acao VARCHAR(20) DEFAULT 'view',
  funcao_pai_id UUID REFERENCES public.funcoes_sistema(id),
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  rota VARCHAR(200),
  icone VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.perfil_funcoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
  funcao_id UUID NOT NULL REFERENCES public.funcoes_sistema(id) ON DELETE CASCADE,
  concedido BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  UNIQUE(perfil_id, funcao_id)
);

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

-- ============================================
-- ESTRUTURA ORGANIZACIONAL
-- ============================================

CREATE TABLE IF NOT EXISTS public.cargos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  sigla TEXT,
  categoria categoria_cargo NOT NULL,
  natureza natureza_cargo,
  nivel INTEGER DEFAULT 1,
  simbolo VARCHAR(20),
  atribuicoes TEXT,
  requisitos TEXT[],
  competencias TEXT[],
  responsabilidades TEXT[],
  conhecimentos_necessarios TEXT[],
  escolaridade TEXT,
  experiencia_exigida TEXT,
  cbo VARCHAR(10),
  nivel_hierarquico INTEGER,
  quantidade_vagas INTEGER DEFAULT 0,
  vencimento_base DECIMAL(12,2),
  valor_base DECIMAL(12,2),
  carga_horaria_semanal INTEGER DEFAULT 40,
  lei_criacao_numero TEXT,
  lei_criacao_data DATE,
  lei_criacao_artigo TEXT,
  lei_documento_url TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.estrutura_organizacional (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  sigla TEXT,
  tipo tipo_unidade NOT NULL,
  nivel INTEGER DEFAULT 0,
  ordem INTEGER DEFAULT 0,
  superior_id UUID REFERENCES public.estrutura_organizacional(id),
  cargo_chefe_id UUID REFERENCES public.cargos(id),
  servidor_responsavel_id UUID,
  descricao TEXT,
  atribuicoes TEXT,
  competencias TEXT[],
  email TEXT,
  telefone TEXT,
  ramal TEXT,
  localizacao TEXT,
  lei_criacao_numero TEXT,
  lei_criacao_data DATE,
  lei_criacao_artigo TEXT,
  lei_criacao_ementa TEXT,
  lei_documento_url TEXT,
  data_extincao DATE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_org_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unidade_id UUID NOT NULL REFERENCES public.estrutura_organizacional(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, unidade_id)
);

CREATE TABLE IF NOT EXISTS public.composicao_cargos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id UUID NOT NULL REFERENCES public.estrutura_organizacional(id) ON DELETE CASCADE,
  cargo_id UUID NOT NULL REFERENCES public.cargos(id) ON DELETE CASCADE,
  quantidade_vagas INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- SERVIDORES E RH
-- ============================================

CREATE TABLE IF NOT EXISTS public.servidores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula VARCHAR(50) UNIQUE,
  nome_completo TEXT NOT NULL,
  cpf VARCHAR(14) UNIQUE,
  rg VARCHAR(20),
  data_nascimento DATE,
  sexo VARCHAR(1),
  estado_civil VARCHAR(20),
  nacionalidade TEXT DEFAULT 'Brasileira',
  naturalidade TEXT,
  email TEXT,
  email_institucional TEXT,
  telefone TEXT,
  celular TEXT,
  endereco TEXT,
  bairro TEXT,
  cidade TEXT,
  uf VARCHAR(2),
  cep VARCHAR(10),
  pis_pasep VARCHAR(20),
  titulo_eleitor VARCHAR(20),
  zona_eleitoral VARCHAR(10),
  secao_eleitoral VARCHAR(10),
  carteira_trabalho VARCHAR(20),
  serie_ctps VARCHAR(10),
  uf_ctps VARCHAR(2),
  banco VARCHAR(100),
  agencia VARCHAR(20),
  conta VARCHAR(30),
  tipo_conta VARCHAR(20),
  escolaridade TEXT,
  formacao TEXT,
  especializacao TEXT,
  vinculo vinculo_funcional NOT NULL,
  tipo_servidor VARCHAR(50),
  cargo_id UUID REFERENCES public.cargos(id),
  cargo_atual_id UUID REFERENCES public.cargos(id),
  unidade_id UUID REFERENCES public.estrutura_organizacional(id),
  unidade_atual_id UUID REFERENCES public.estrutura_organizacional(id),
  data_admissao DATE,
  data_posse DATE,
  data_exercicio DATE,
  data_nomeacao DATE,
  portaria_nomeacao TEXT,
  data_exoneracao DATE,
  portaria_exoneracao TEXT,
  situacao situacao_funcional DEFAULT 'ativo',
  foto_url TEXT,
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

CREATE TABLE IF NOT EXISTS public.lotacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL,
  unidade_id UUID NOT NULL REFERENCES public.estrutura_organizacional(id) ON DELETE CASCADE,
  cargo_id UUID REFERENCES public.cargos(id),
  data_inicio DATE DEFAULT CURRENT_DATE,
  data_fim DATE,
  tipo_movimentacao TEXT,
  documento_referencia TEXT,
  portaria_numero TEXT,
  observacao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.historico_funcional (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL REFERENCES public.servidores(id) ON DELETE CASCADE,
  tipo tipo_movimentacao_funcional NOT NULL,
  data_evento DATE NOT NULL,
  data_vigencia_inicio DATE,
  data_vigencia_fim DATE,
  descricao TEXT,
  cargo_anterior_id UUID REFERENCES public.cargos(id),
  cargo_novo_id UUID REFERENCES public.cargos(id),
  unidade_anterior_id UUID REFERENCES public.estrutura_organizacional(id),
  unidade_nova_id UUID REFERENCES public.estrutura_organizacional(id),
  portaria_numero TEXT,
  portaria_data DATE,
  diario_oficial_numero TEXT,
  diario_oficial_data DATE,
  documento_url TEXT,
  fundamentacao_legal TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

CREATE TABLE IF NOT EXISTS public.vinculos_funcionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL REFERENCES public.servidores(id) ON DELETE CASCADE,
  tipo_vinculo VARCHAR(50) NOT NULL,
  regime_juridico VARCHAR(50),
  data_inicio DATE NOT NULL,
  data_fim DATE,
  ativo BOOLEAN DEFAULT true,
  numero_contrato VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.provimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL REFERENCES public.servidores(id) ON DELETE CASCADE,
  cargo_id UUID NOT NULL REFERENCES public.cargos(id),
  tipo_provimento VARCHAR(50) NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  ato_numero VARCHAR(100),
  ato_data DATE,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.designacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL REFERENCES public.servidores(id) ON DELETE CASCADE,
  cargo_id UUID NOT NULL REFERENCES public.cargos(id),
  unidade_id UUID REFERENCES public.estrutura_organizacional(id),
  tipo_designacao VARCHAR(50) NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  portaria_numero VARCHAR(100),
  portaria_data DATE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ferias_servidor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL REFERENCES public.servidores(id) ON DELETE CASCADE,
  exercicio INTEGER,
  periodo_aquisitivo_inicio DATE NOT NULL,
  periodo_aquisitivo_fim DATE NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  dias INTEGER,
  dias_gozados INTEGER NOT NULL,
  parcela INTEGER DEFAULT 1,
  total_parcelas INTEGER DEFAULT 1,
  abono_pecuniario BOOLEAN DEFAULT false,
  dias_abono INTEGER DEFAULT 0,
  tipo VARCHAR(50) DEFAULT 'normal',
  status VARCHAR(50) DEFAULT 'agendada',
  portaria_numero TEXT,
  portaria_data DATE,
  portaria_url TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

CREATE TABLE IF NOT EXISTS public.licencas_afastamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL REFERENCES public.servidores(id) ON DELETE CASCADE,
  tipo_afastamento tipo_afastamento NOT NULL,
  tipo_licenca tipo_licenca,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  dias_afastamento INTEGER,
  medico_nome TEXT,
  crm TEXT,
  cid TEXT,
  orgao_destino TEXT,
  onus_origem BOOLEAN DEFAULT true,
  portaria_numero TEXT,
  portaria_data DATE,
  portaria_url TEXT,
  documento_comprobatorio_url TEXT,
  fundamentacao_legal TEXT,
  status TEXT DEFAULT 'ativa',
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- ============================================
-- PONTO E FREQUÊNCIA
-- ============================================

CREATE TABLE IF NOT EXISTS public.configuracao_jornada (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID UNIQUE NOT NULL,
  carga_horaria_semanal INTEGER DEFAULT 40,
  horas_por_dia DECIMAL(4,2) DEFAULT 8,
  dias_trabalho INTEGER[] DEFAULT ARRAY[1,2,3,4,5],
  tolerancia_atraso INTEGER DEFAULT 10,
  tolerancia_saida_antecipada INTEGER DEFAULT 10,
  permite_compensacao BOOLEAN DEFAULT true,
  limite_banco_horas INTEGER DEFAULT 40,
  permite_ponto_remoto BOOLEAN DEFAULT false,
  exige_localizacao BOOLEAN DEFAULT false,
  exige_foto BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.registros_ponto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL,
  data DATE NOT NULL,
  tipo tipo_registro_ponto DEFAULT 'normal',
  entrada1 TIMESTAMPTZ,
  saida1 TIMESTAMPTZ,
  entrada2 TIMESTAMPTZ,
  saida2 TIMESTAMPTZ,
  entrada3 TIMESTAMPTZ,
  saida3 TIMESTAMPTZ,
  horas_trabalhadas DECIMAL(5,2),
  horas_extras DECIMAL(5,2) DEFAULT 0,
  atrasos INTEGER DEFAULT 0,
  saidas_antecipadas INTEGER DEFAULT 0,
  status status_ponto DEFAULT 'incompleto',
  observacao TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  ip_address TEXT,
  dispositivo TEXT,
  aprovado BOOLEAN DEFAULT false,
  aprovador_id UUID,
  data_aprovacao TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(servidor_id, data)
);

CREATE TABLE IF NOT EXISTS public.banco_horas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL,
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  saldo_anterior DECIMAL(6,2) DEFAULT 0,
  horas_extras DECIMAL(6,2) DEFAULT 0,
  horas_compensadas DECIMAL(6,2) DEFAULT 0,
  saldo_atual DECIMAL(6,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(servidor_id, ano, mes)
);

CREATE TABLE IF NOT EXISTS public.feriados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  data DATE NOT NULL,
  tipo TEXT DEFAULT 'nacional',
  recorrente BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- UNIDADES LOCAIS E AGENDA
-- ============================================

CREATE TABLE IF NOT EXISTS public.unidades_locais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  nome_unidade TEXT,
  codigo_unidade VARCHAR(50),
  sigla TEXT,
  tipo tipo_unidade_local,
  tipo_unidade tipo_unidade_local NOT NULL,
  endereco TEXT,
  endereco_logradouro TEXT,
  endereco_numero TEXT,
  endereco_bairro TEXT,
  endereco_cidade TEXT DEFAULT 'Goiânia',
  endereco_uf VARCHAR(2) DEFAULT 'GO',
  endereco_cep VARCHAR(10),
  bairro TEXT,
  cidade TEXT,
  municipio TEXT,
  uf VARCHAR(2) DEFAULT 'GO',
  cep VARCHAR(10),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  capacidade_pessoas INTEGER,
  capacidade_publico INTEGER,
  area_total_m2 DECIMAL(10,2),
  descricao TEXT,
  infraestrutura TEXT[],
  modalidades TEXT[],
  horario_funcionamento TEXT,
  telefone TEXT,
  email TEXT,
  responsavel_nome TEXT,
  responsavel_telefone TEXT,
  foto_principal_url TEXT,
  fotos_urls TEXT[],
  status status_unidade_local DEFAULT 'ativa',
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

CREATE TABLE IF NOT EXISTS public.agenda_unidade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_local_id UUID NOT NULL REFERENCES public.unidades_locais(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo_uso TEXT NOT NULL,
  solicitante_nome TEXT NOT NULL,
  solicitante_documento TEXT,
  solicitante_telefone TEXT,
  solicitante_email TEXT,
  data_inicio TIMESTAMPTZ NOT NULL,
  data_fim TIMESTAMPTZ NOT NULL,
  area_utilizada TEXT,
  publico_estimado INTEGER,
  status status_agenda DEFAULT 'solicitado',
  aprovador_id UUID,
  data_aprovacao TIMESTAMPTZ,
  motivo_rejeicao TEXT,
  observacoes TEXT,
  numero_protocolo VARCHAR(50),
  tipo_solicitante VARCHAR DEFAULT 'pessoa_fisica',
  solicitante_razao_social VARCHAR,
  solicitante_cnpj VARCHAR,
  solicitante_endereco TEXT,
  responsavel_legal VARCHAR,
  responsavel_legal_documento VARCHAR,
  finalidade_detalhada TEXT,
  espaco_especifico VARCHAR,
  horario_diario VARCHAR,
  documentos_anexos JSONB,
  ano_vigencia INTEGER,
  historico_status JSONB,
  encerrado_automaticamente BOOLEAN DEFAULT false,
  federacao_id UUID,
  instituicao_id UUID,
  numero_processo_sei VARCHAR(50),
  modalidades_esportivas TEXT[],
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- FINANCEIRO E FOLHA
-- ============================================

CREATE TABLE IF NOT EXISTS public.rubricas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(20) NOT NULL UNIQUE,
  nome VARCHAR(200) NOT NULL,
  tipo tipo_rubrica NOT NULL,
  natureza natureza_rubrica NOT NULL,
  incide_inss BOOLEAN DEFAULT false,
  incide_irrf BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.folhas_pagamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competencia_ano INTEGER NOT NULL,
  competencia_mes INTEGER NOT NULL,
  tipo tipo_folha NOT NULL,
  status status_folha DEFAULT 'aberta',
  data_abertura DATE NOT NULL,
  data_fechamento DATE,
  total_bruto DECIMAL(15,2) DEFAULT 0,
  total_descontos DECIMAL(15,2) DEFAULT 0,
  total_liquido DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

CREATE TABLE IF NOT EXISTS public.fichas_financeiras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL REFERENCES public.servidores(id) ON DELETE CASCADE,
  folha_id UUID NOT NULL REFERENCES public.folhas_pagamento(id) ON DELETE CASCADE,
  rubrica_id UUID REFERENCES public.rubricas(id),
  valor DECIMAL(12,2) NOT NULL,
  quantidade DECIMAL(8,2) DEFAULT 1,
  referencia VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bancos_cnab (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_banco VARCHAR(10) NOT NULL UNIQUE,
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

-- ============================================
-- FORNECEDORES E CONTRATOS
-- ============================================

CREATE TABLE IF NOT EXISTS public.fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social VARCHAR(300) NOT NULL,
  nome_fantasia VARCHAR(200),
  cnpj_cpf VARCHAR(20) NOT NULL UNIQUE,
  tipo_pessoa VARCHAR(2) DEFAULT 'PJ',
  email VARCHAR(200),
  telefone VARCHAR(20),
  endereco TEXT,
  cidade VARCHAR(100),
  uf VARCHAR(2),
  cep VARCHAR(10),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contratos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_contrato VARCHAR(50) NOT NULL,
  ano INTEGER NOT NULL,
  objeto TEXT NOT NULL,
  fornecedor_id UUID REFERENCES public.fornecedores(id),
  valor_total DECIMAL(15,2),
  valor_atual DECIMAL(15,2),
  valor_executado DECIMAL(15,2) DEFAULT 0,
  saldo_contrato DECIMAL(15,2),
  data_assinatura DATE NOT NULL,
  data_vigencia_inicio DATE NOT NULL,
  data_vigencia_fim DATE NOT NULL,
  situacao VARCHAR(50) DEFAULT 'vigente',
  modalidade_licitacao VARCHAR(100),
  numero_processo VARCHAR(50),
  fundamentacao_legal TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- ============================================
-- PATRIMÔNIO
-- ============================================

CREATE TABLE IF NOT EXISTS public.bens_patrimoniais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_patrimonio VARCHAR(50) NOT NULL UNIQUE,
  descricao TEXT NOT NULL,
  categoria_bem categoria_bem,
  marca VARCHAR(100),
  modelo VARCHAR(100),
  numero_serie VARCHAR(100),
  data_aquisicao DATE NOT NULL,
  valor_aquisicao DECIMAL(15,2) NOT NULL,
  valor_liquido DECIMAL(15,2),
  situacao VARCHAR(50) DEFAULT 'ativo',
  situacao_inventario situacao_bem_patrimonio,
  estado_conservacao VARCHAR(50),
  estado_conservacao_inventario estado_conservacao_inventario,
  unidade_id UUID REFERENCES public.estrutura_organizacional(id),
  unidade_local_id UUID REFERENCES public.unidades_locais(id),
  responsavel_id UUID REFERENCES public.servidores(id),
  nota_fiscal VARCHAR(100),
  fornecedor_id UUID REFERENCES public.fornecedores(id),
  processo_sei VARCHAR(50),
  localizacao_especifica TEXT,
  observacao TEXT,
  foto_bem_url TEXT,
  termo_responsabilidade_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- ============================================
-- FEDERAÇÕES E INSTITUIÇÕES
-- ============================================

CREATE TABLE IF NOT EXISTS public.federacoes_esportivas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(300) NOT NULL,
  sigla VARCHAR(20),
  cnpj VARCHAR(20),
  modalidade VARCHAR(100),
  email VARCHAR(200),
  telefone VARCHAR(30),
  situacao VARCHAR(50) DEFAULT 'ativa',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.instituicoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_instituicao VARCHAR(50),
  tipo_instituicao VARCHAR(50),
  nome_razao_social VARCHAR(300) NOT NULL,
  nome_fantasia VARCHAR(200),
  cnpj VARCHAR(20),
  esfera_governo esfera_governo,
  orgao_vinculado VARCHAR(200),
  endereco_cidade VARCHAR(100),
  endereco_uf VARCHAR(2),
  telefone VARCHAR(30),
  email VARCHAR(200),
  responsavel_nome VARCHAR(200),
  responsavel_cargo VARCHAR(100),
  status VARCHAR(50) DEFAULT 'ativo',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- AUDITORIA E BACKUP
-- ============================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action audit_action NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  module_name TEXT,
  before_data JSONB,
  after_data JSONB,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  role_at_time app_role,
  org_unit_id UUID,
  timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.backup_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled BOOLEAN DEFAULT true,
  schedule_cron TEXT DEFAULT '0 2 * * *',
  weekly_day INTEGER DEFAULT 0,
  retention_daily INTEGER DEFAULT 7,
  retention_weekly INTEGER DEFAULT 4,
  retention_monthly INTEGER DEFAULT 6,
  buckets_included TEXT[] DEFAULT ARRAY['documentos'],
  encryption_enabled BOOLEAN DEFAULT true,
  last_backup_at TIMESTAMPTZ,
  last_backup_status backup_status,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.backup_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type backup_type NOT NULL,
  status backup_status DEFAULT 'pending',
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  triggered_by UUID,
  trigger_mode TEXT DEFAULT 'manual',
  db_file_path TEXT,
  db_file_size BIGINT,
  db_checksum TEXT,
  storage_file_path TEXT,
  storage_file_size BIGINT,
  storage_checksum TEXT,
  storage_objects_count INTEGER,
  manifest_path TEXT,
  manifest_checksum TEXT,
  total_size BIGINT,
  duration_seconds INTEGER,
  error_message TEXT,
  error_details JSONB,
  metadata JSONB,
  system_version TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- PROCESSOS E APROVAÇÕES
-- ============================================

CREATE TABLE IF NOT EXISTS public.approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL,
  requester_org_unit_id UUID,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  module_name TEXT NOT NULL,
  status approval_status DEFAULT 'draft',
  priority TEXT DEFAULT 'normal',
  due_date TIMESTAMPTZ,
  justification TEXT,
  approver_id UUID,
  approver_decision TEXT,
  approved_at TIMESTAMPTZ,
  electronic_signature JSONB,
  attachments JSONB,
  status_history JSONB,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.approval_delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delegator_id UUID NOT NULL,
  delegate_id UUID NOT NULL,
  module_name TEXT,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  reason TEXT,
  is_active BOOLEAN DEFAULT true,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- ============================================
-- DOCUMENTOS
-- ============================================

CREATE TABLE IF NOT EXISTS public.documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo tipo_documento DEFAULT 'portaria',
  categoria categoria_portaria,
  numero TEXT NOT NULL,
  titulo TEXT NOT NULL,
  ementa TEXT,
  data_documento DATE DEFAULT CURRENT_DATE,
  data_publicacao DATE,
  data_vigencia_inicio DATE,
  data_vigencia_fim DATE,
  arquivo_url TEXT,
  status status_documento DEFAULT 'rascunho',
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID
);

-- ============================================================
-- NOTA: Este arquivo contém as tabelas principais.
-- Tabelas adicionais específicas de módulos podem ser
-- encontradas em arquivos separados ou criadas via migrações.
-- ============================================================

-- ============================================================
-- FIM: 03_tabelas.sql
-- Próximo: 04_funcoes.sql
-- ============================================================
