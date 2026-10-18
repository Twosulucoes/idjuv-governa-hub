-- ============================================================
-- IDJUV - SCHEMA COMPLETO PARA DISASTER RECOVERY
-- Gerado em: 2026-01-07
-- Este script cria toda a estrutura necessária no Supabase externo
-- ============================================================

-- ============================================================
-- PARTE 1: EXTENSÕES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ============================================================
-- PARTE 2: TIPOS ENUM
-- ============================================================

CREATE TYPE public.access_scope AS ENUM ('all', 'org_unit', 'local_unit', 'own', 'readonly');

CREATE TYPE public.app_permission AS ENUM (
  'users.read', 'users.create', 'users.update', 'users.delete',
  'content.read', 'content.create', 'content.update', 'content.delete',
  'reports.view', 'reports.export', 'settings.view', 'settings.edit',
  'processes.read', 'processes.create', 'processes.update', 'processes.delete', 'processes.approve',
  'roles.manage', 'permissions.manage',
  'documents.view', 'documents.create', 'documents.edit', 'documents.delete',
  'requests.create', 'requests.view', 'requests.approve', 'requests.reject',
  'audit.view', 'audit.export', 'approval.delegate', 'org_units.manage', 'mfa.manage'
);

CREATE TYPE public.app_role AS ENUM (
  'admin', 'manager', 'user', 'guest', 'presidencia', 'diraf', 'rh', 'ti_admin',
  'gabinete', 'controle_interno', 'juridico', 'cpl', 'ascom',
  'cadastrador_local', 'cadastrador_setor', 'cadastrador_leitura'
);

CREATE TYPE public.approval_status AS ENUM ('draft', 'submitted', 'in_review', 'approved', 'rejected', 'cancelled');

CREATE TYPE public.audit_action AS ENUM (
  'login', 'logout', 'login_failed', 'password_change', 'password_reset',
  'create', 'update', 'delete', 'view', 'export', 'upload', 'download',
  'approve', 'reject', 'submit'
);

CREATE TYPE public.backup_status AS ENUM ('pending', 'running', 'success', 'failed', 'partial');
CREATE TYPE public.backup_type AS ENUM ('daily', 'weekly', 'monthly', 'manual');

CREATE TYPE public.categoria_cargo AS ENUM ('efetivo', 'comissionado', 'funcao_gratificada', 'temporario', 'estagiario');
CREATE TYPE public.categoria_portaria AS ENUM ('estruturante', 'normativa', 'pessoal', 'delegacao');

CREATE TYPE public.estado_conservacao AS ENUM ('otimo', 'bom', 'regular', 'ruim', 'inservivel');
CREATE TYPE public.situacao_funcional AS ENUM ('ativo', 'afastado', 'cedido', 'licenca', 'ferias', 'exonerado', 'aposentado', 'falecido');
CREATE TYPE public.situacao_patrimonio AS ENUM ('em_uso', 'em_estoque', 'cedido', 'em_manutencao', 'baixado');

CREATE TYPE public.status_agenda AS ENUM ('solicitado', 'aprovado', 'rejeitado', 'cancelado', 'concluido');
CREATE TYPE public.status_documento AS ENUM ('rascunho', 'aguardando_publicacao', 'publicado', 'vigente', 'revogado');
CREATE TYPE public.status_nomeacao AS ENUM ('ativo', 'encerrado', 'revogado');
CREATE TYPE public.status_ponto AS ENUM ('completo', 'incompleto', 'pendente_justificativa', 'justificado', 'aprovado');
CREATE TYPE public.status_solicitacao AS ENUM ('pendente', 'aprovada', 'rejeitada', 'cancelada');
CREATE TYPE public.status_termo_cessao AS ENUM ('pendente', 'emitido', 'assinado', 'cancelado');
CREATE TYPE public.status_unidade_local AS ENUM ('ativa', 'inativa', 'manutencao', 'interditada');

CREATE TYPE public.tipo_afastamento AS ENUM ('licenca', 'suspensao', 'cessao', 'disposicao', 'servico_externo', 'missao', 'outro');
CREATE TYPE public.tipo_ato_nomeacao AS ENUM ('portaria', 'decreto', 'ato', 'outro');
CREATE TYPE public.tipo_documento AS ENUM ('portaria', 'resolucao', 'instrucao_normativa', 'ordem_servico', 'comunicado', 'decreto', 'lei', 'outro');
CREATE TYPE public.tipo_justificativa AS ENUM ('atestado', 'declaracao', 'trabalho_externo', 'esquecimento', 'problema_sistema', 'outro');
CREATE TYPE public.tipo_lancamento_horas AS ENUM ('credito', 'debito', 'ajuste');
CREATE TYPE public.tipo_licenca AS ENUM ('maternidade', 'paternidade', 'medica', 'casamento', 'luto', 'interesse_particular', 'capacitacao', 'premio', 'mandato_eletivo', 'mandato_classista', 'outra');
CREATE TYPE public.tipo_movimentacao_funcional AS ENUM ('nomeacao', 'exoneracao', 'designacao', 'dispensa', 'promocao', 'transferencia', 'cessao', 'requisicao', 'redistribuicao', 'remocao', 'afastamento', 'retorno', 'aposentadoria', 'vacancia');
CREATE TYPE public.tipo_portaria_rh AS ENUM ('nomeacao', 'exoneracao', 'designacao', 'dispensa', 'ferias', 'viagem', 'cessao', 'afastamento', 'substituicao', 'gratificacao', 'comissao', 'outro');
CREATE TYPE public.tipo_registro_ponto AS ENUM ('normal', 'feriado', 'folga', 'atestado', 'falta', 'ferias', 'licenca');
CREATE TYPE public.tipo_unidade AS ENUM ('presidencia', 'diretoria', 'departamento', 'setor', 'divisao', 'secao', 'coordenacao');
CREATE TYPE public.tipo_unidade_local AS ENUM ('ginasio', 'estadio', 'parque_aquatico', 'piscina', 'complexo', 'quadra', 'outro');
CREATE TYPE public.vinculo_funcional AS ENUM ('efetivo', 'comissionado', 'cedido', 'temporario', 'estagiario', 'requisitado');

-- ============================================================
-- PARTE 3: TABELAS BASE (sem foreign keys)
-- ============================================================

-- Profiles (base para usuários)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- User Roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

-- User Permissions
CREATE TABLE public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission app_permission NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, permission)
);

-- Role Permissions
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  permission app_permission NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(role, permission)
);

-- User Security Settings
CREATE TABLE public.user_security_settings (
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
CREATE TABLE public.module_access_scopes (
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

-- Cargos
CREATE TABLE public.cargos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  sigla TEXT,
  categoria categoria_cargo NOT NULL,
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
  lei_criacao_numero TEXT,
  lei_criacao_data DATE,
  lei_criacao_artigo TEXT,
  lei_documento_url TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Estrutura Organizacional
CREATE TABLE public.estrutura_organizacional (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  sigla TEXT,
  tipo tipo_unidade NOT NULL,
  nivel INTEGER DEFAULT 0,
  ordem INTEGER DEFAULT 0,
  superior_id UUID REFERENCES public.estrutura_organizacional(id),
  cargo_chefe_id UUID REFERENCES public.cargos(id),
  servidor_responsavel_id UUID REFERENCES public.profiles(id),
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

-- User Org Units
CREATE TABLE public.user_org_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unidade_id UUID NOT NULL REFERENCES public.estrutura_organizacional(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, unidade_id)
);

-- Composição de Cargos
CREATE TABLE public.composicao_cargos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id UUID NOT NULL REFERENCES public.estrutura_organizacional(id) ON DELETE CASCADE,
  cargo_id UUID NOT NULL REFERENCES public.cargos(id) ON DELETE CASCADE,
  quantidade_vagas INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Servidores
CREATE TABLE public.servidores (
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
  cargo_id UUID REFERENCES public.cargos(id),
  unidade_id UUID REFERENCES public.estrutura_organizacional(id),
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

-- Lotações
CREATE TABLE public.lotacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  unidade_id UUID NOT NULL REFERENCES public.estrutura_organizacional(id) ON DELETE CASCADE,
  cargo_id UUID REFERENCES public.cargos(id),
  data_inicio DATE DEFAULT CURRENT_DATE,
  data_fim DATE,
  tipo_movimentacao TEXT,
  documento_referencia TEXT,
  observacao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Histórico Funcional
CREATE TABLE public.historico_funcional (
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

-- Portarias do Servidor
CREATE TABLE public.portarias_servidor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL REFERENCES public.servidores(id) ON DELETE CASCADE,
  historico_id UUID REFERENCES public.historico_funcional(id),
  tipo tipo_portaria_rh NOT NULL,
  numero TEXT NOT NULL,
  ano INTEGER NOT NULL,
  data_publicacao DATE NOT NULL,
  data_vigencia_inicio DATE,
  data_vigencia_fim DATE,
  assunto TEXT NOT NULL,
  ementa TEXT,
  conteudo TEXT,
  diario_oficial_numero TEXT,
  diario_oficial_data DATE,
  documento_url TEXT,
  status TEXT DEFAULT 'vigente',
  portaria_revogadora_id UUID REFERENCES public.portarias_servidor(id),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- Ocorrências do Servidor
CREATE TABLE public.ocorrencias_servidor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL REFERENCES public.servidores(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  data_ocorrencia DATE NOT NULL,
  descricao TEXT NOT NULL,
  documento_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- Férias do Servidor
CREATE TABLE public.ferias_servidor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL REFERENCES public.servidores(id) ON DELETE CASCADE,
  periodo_aquisitivo_inicio DATE NOT NULL,
  periodo_aquisitivo_fim DATE NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  dias_gozados INTEGER NOT NULL,
  parcela INTEGER DEFAULT 1,
  total_parcelas INTEGER DEFAULT 1,
  abono_pecuniario BOOLEAN DEFAULT false,
  dias_abono INTEGER DEFAULT 0,
  status TEXT DEFAULT 'agendada',
  portaria_numero TEXT,
  portaria_data DATE,
  portaria_url TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- Licenças e Afastamentos
CREATE TABLE public.licencas_afastamentos (
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

-- Configuração de Jornada
CREATE TABLE public.configuracao_jornada (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
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

-- Horários de Jornada
CREATE TABLE public.horarios_jornada (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  configuracao_id UUID NOT NULL REFERENCES public.configuracao_jornada(id) ON DELETE CASCADE,
  dia_semana INTEGER NOT NULL,
  entrada1 TIME,
  saida1 TIME,
  entrada2 TIME,
  saida2 TIME
);

-- Registros de Ponto
CREATE TABLE public.registros_ponto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
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
  aprovador_id UUID REFERENCES public.profiles(id),
  data_aprovacao TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(servidor_id, data)
);

-- Justificativas de Ponto
CREATE TABLE public.justificativas_ponto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registro_ponto_id UUID NOT NULL REFERENCES public.registros_ponto(id) ON DELETE CASCADE,
  tipo tipo_justificativa NOT NULL,
  descricao TEXT NOT NULL,
  arquivo_url TEXT,
  status status_solicitacao DEFAULT 'pendente',
  aprovador_id UUID REFERENCES public.profiles(id),
  data_aprovacao TIMESTAMPTZ,
  observacao_aprovador TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Solicitações de Ajuste de Ponto
CREATE TABLE public.solicitacoes_ajuste_ponto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registro_ponto_id UUID NOT NULL REFERENCES public.registros_ponto(id) ON DELETE CASCADE,
  campo_alterado TEXT NOT NULL,
  valor_atual TEXT,
  valor_solicitado TEXT NOT NULL,
  motivo TEXT NOT NULL,
  status status_solicitacao DEFAULT 'pendente',
  aprovador_id UUID REFERENCES public.profiles(id),
  data_aprovacao TIMESTAMPTZ,
  observacao_aprovador TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Banco de Horas
CREATE TABLE public.banco_horas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
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

-- Lançamentos de Banco de Horas
CREATE TABLE public.lancamentos_banco_horas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banco_horas_id UUID NOT NULL REFERENCES public.banco_horas(id) ON DELETE CASCADE,
  registro_ponto_id UUID REFERENCES public.registros_ponto(id),
  tipo tipo_lancamento_horas NOT NULL,
  horas DECIMAL(5,2) NOT NULL,
  data DATE NOT NULL,
  motivo TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Frequência Mensal
CREATE TABLE public.frequencia_mensal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  dias_trabalhados INTEGER DEFAULT 0,
  dias_falta INTEGER DEFAULT 0,
  dias_atestado INTEGER DEFAULT 0,
  dias_licenca INTEGER DEFAULT 0,
  dias_ferias INTEGER DEFAULT 0,
  dias_folga INTEGER DEFAULT 0,
  horas_trabalhadas DECIMAL(6,2) DEFAULT 0,
  horas_extras DECIMAL(6,2) DEFAULT 0,
  horas_devidas DECIMAL(6,2) DEFAULT 0,
  total_atrasos INTEGER DEFAULT 0,
  total_saidas_antecipadas INTEGER DEFAULT 0,
  percentual_presenca DECIMAL(5,2) DEFAULT 0,
  fechado BOOLEAN DEFAULT false,
  data_fechamento TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(servidor_id, ano, mes)
);

-- Feriados
CREATE TABLE public.feriados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  data DATE NOT NULL,
  tipo TEXT DEFAULT 'nacional',
  recorrente BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Viagens e Diárias
CREATE TABLE public.viagens_diarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL REFERENCES public.servidores(id) ON DELETE CASCADE,
  destino TEXT NOT NULL,
  objetivo TEXT NOT NULL,
  data_saida DATE NOT NULL,
  data_retorno DATE NOT NULL,
  quantidade_diarias DECIMAL(4,2),
  valor_diaria DECIMAL(10,2),
  valor_total DECIMAL(10,2),
  meio_transporte TEXT,
  veiculo_oficial BOOLEAN DEFAULT false,
  placa_veiculo TEXT,
  km_previsto INTEGER,
  passagem_aerea BOOLEAN DEFAULT false,
  hospedagem TEXT,
  portaria_numero TEXT,
  portaria_data DATE,
  portaria_url TEXT,
  relatorio_url TEXT,
  status TEXT DEFAULT 'solicitada',
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- Unidades Locais
CREATE TABLE public.unidades_locais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  sigla TEXT,
  tipo tipo_unidade_local NOT NULL,
  endereco TEXT,
  bairro TEXT,
  cidade TEXT DEFAULT 'Boa Vista',
  uf VARCHAR(2) DEFAULT 'RR',
  cep VARCHAR(10),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  capacidade_pessoas INTEGER,
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
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- Agenda de Unidade
CREATE TABLE public.agenda_unidade (
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
  aprovador_id UUID REFERENCES public.servidores(id),
  data_aprovacao TIMESTAMPTZ,
  motivo_rejeicao TEXT,
  observacoes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now(),
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
  encerrado_automaticamente BOOLEAN DEFAULT false
);

-- Documentos de Cedência
CREATE TABLE public.documentos_cedencia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_id UUID NOT NULL REFERENCES public.agenda_unidade(id) ON DELETE CASCADE,
  tipo_documento TEXT NOT NULL,
  nome_arquivo TEXT NOT NULL,
  url_arquivo TEXT NOT NULL,
  mime_type TEXT,
  tamanho_bytes INTEGER,
  documento_principal BOOLEAN DEFAULT false,
  versao INTEGER DEFAULT 1,
  observacoes TEXT,
  uploaded_by UUID,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Termos de Cessão
CREATE TABLE public.termos_cessao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_id UUID NOT NULL REFERENCES public.agenda_unidade(id) ON DELETE CASCADE,
  numero_termo VARCHAR(50),
  data_emissao DATE,
  data_assinatura DATE,
  assinado_por VARCHAR,
  cargo_assinante VARCHAR,
  testemunha1_nome VARCHAR,
  testemunha1_cpf VARCHAR,
  testemunha2_nome VARCHAR,
  testemunha2_cpf VARCHAR,
  clausulas_adicionais TEXT,
  pdf_url TEXT,
  status status_termo_cessao DEFAULT 'pendente',
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Patrimônio de Unidade
CREATE TABLE public.patrimonio_unidade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_local_id UUID NOT NULL REFERENCES public.unidades_locais(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT,
  numero_tombo VARCHAR(50),
  quantidade INTEGER DEFAULT 1,
  estado_conservacao estado_conservacao DEFAULT 'bom',
  situacao situacao_patrimonio DEFAULT 'em_uso',
  data_aquisicao DATE,
  valor_estimado DECIMAL(12,2),
  observacoes TEXT,
  anexos TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Nomeações de Chefe de Unidade
CREATE TABLE public.nomeacoes_chefe_unidade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_local_id UUID NOT NULL REFERENCES public.unidades_locais(id) ON DELETE CASCADE,
  servidor_id UUID NOT NULL REFERENCES public.servidores(id) ON DELETE CASCADE,
  cargo TEXT DEFAULT 'Chefe de Unidade',
  data_inicio DATE NOT NULL,
  data_fim DATE,
  ato_nomeacao_tipo tipo_ato_nomeacao NOT NULL,
  ato_numero TEXT NOT NULL,
  ato_data_publicacao DATE NOT NULL,
  ato_doe_numero TEXT,
  ato_doe_data DATE,
  documento_nomeacao_url TEXT,
  status status_nomeacao DEFAULT 'ativo',
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID
);

-- Documentos
CREATE TABLE public.documentos (
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

-- Solicitações de Aprovação
CREATE TABLE public.approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_org_unit_id UUID REFERENCES public.estrutura_organizacional(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  module_name TEXT NOT NULL,
  status approval_status DEFAULT 'draft',
  priority TEXT DEFAULT 'normal',
  due_date TIMESTAMPTZ,
  justification TEXT,
  approver_id UUID REFERENCES auth.users(id),
  approver_decision TEXT,
  approved_at TIMESTAMPTZ,
  electronic_signature JSONB,
  attachments JSONB,
  status_history JSONB,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Delegações de Aprovação
CREATE TABLE public.approval_delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delegator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delegate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_name TEXT,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  reason TEXT,
  is_active BOOLEAN DEFAULT true,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Logs de Auditoria
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
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
  org_unit_id UUID REFERENCES public.estrutura_organizacional(id),
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- Configuração de Backup
CREATE TABLE public.backup_config (
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

-- Histórico de Backup
CREATE TABLE public.backup_history (
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

-- Verificações de Integridade de Backup
CREATE TABLE public.backup_integrity_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_id UUID REFERENCES public.backup_history(id) ON DELETE CASCADE,
  checked_by UUID,
  checked_at TIMESTAMPTZ DEFAULT now(),
  is_valid BOOLEAN,
  db_checksum_valid BOOLEAN,
  storage_checksum_valid BOOLEAN,
  manifest_valid BOOLEAN,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PARTE 4: FUNÇÕES
-- ============================================================

-- Função has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função has_permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission app_permission)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_permissions
    WHERE user_id = _user_id AND permission = _permission
    UNION
    SELECT 1 FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role = rp.role
    WHERE ur.user_id = _user_id AND rp.permission = _permission
  )
$$;

-- Função is_admin_user
CREATE OR REPLACE FUNCTION public.is_admin_user(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role IN ('admin', 'ti_admin', 'presidencia')
  )
$$;

-- Função get_user_role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Função update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Função handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  INSERT INTO public.user_security_settings (user_id, force_password_change)
  VALUES (NEW.id, true);
  
  RETURN NEW;
END;
$$;

-- Função log_audit
CREATE OR REPLACE FUNCTION public.log_audit(
  _action audit_action,
  _entity_type VARCHAR DEFAULT NULL,
  _entity_id UUID DEFAULT NULL,
  _module_name VARCHAR DEFAULT NULL,
  _before_data JSONB DEFAULT NULL,
  _after_data JSONB DEFAULT NULL,
  _description TEXT DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _log_id UUID;
  _user_role app_role;
  _user_org_unit UUID;
BEGIN
  SELECT role INTO _user_role 
  FROM public.user_roles 
  WHERE user_id = auth.uid() 
  LIMIT 1;
  
  SELECT unidade_id INTO _user_org_unit
  FROM public.user_org_units
  WHERE user_id = auth.uid() AND is_primary = true
  LIMIT 1;
  
  INSERT INTO public.audit_logs (
    user_id, action, entity_type, entity_id, module_name,
    before_data, after_data, description, metadata,
    role_at_time, org_unit_id
  )
  VALUES (
    auth.uid(), _action, _entity_type, _entity_id, _module_name,
    _before_data, _after_data, _description, _metadata,
    _user_role, _user_org_unit
  )
  RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$$;

-- ============================================================
-- PARTE 5: TRIGGERS
-- ============================================================

-- Trigger para criar perfil quando usuário é criado
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers de updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_servidores_updated_at BEFORE UPDATE ON public.servidores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cargos_updated_at BEFORE UPDATE ON public.cargos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_estrutura_updated_at BEFORE UPDATE ON public.estrutura_organizacional
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_unidades_locais_updated_at BEFORE UPDATE ON public.unidades_locais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- PARTE 6: RLS POLICIES (básicas)
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servidores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estrutura_organizacional ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_history ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (ajustar conforme necessário)
CREATE POLICY "Profiles públicos para leitura" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Usuários podem editar próprio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins podem ver roles" ON public.user_roles FOR SELECT USING (is_admin_user(auth.uid()));
CREATE POLICY "Admins podem gerenciar roles" ON public.user_roles FOR ALL USING (is_admin_user(auth.uid()));

CREATE POLICY "Cargos públicos" ON public.cargos FOR SELECT USING (true);
CREATE POLICY "Admins gerenciam cargos" ON public.cargos FOR ALL USING (is_admin_user(auth.uid()));

CREATE POLICY "Estrutura pública" ON public.estrutura_organizacional FOR SELECT USING (true);
CREATE POLICY "Admins gerenciam estrutura" ON public.estrutura_organizacional FOR ALL USING (is_admin_user(auth.uid()));

CREATE POLICY "Servidores visíveis para autenticados" ON public.servidores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins gerenciam servidores" ON public.servidores FOR ALL USING (is_admin_user(auth.uid()));

CREATE POLICY "Admins veem audit logs" ON public.audit_logs FOR SELECT USING (is_admin_user(auth.uid()));

CREATE POLICY "Admins veem backup config" ON public.backup_config FOR SELECT USING (is_admin_user(auth.uid()));
CREATE POLICY "Admins editam backup config" ON public.backup_config FOR UPDATE USING (is_admin_user(auth.uid()));

CREATE POLICY "Admins veem backup history" ON public.backup_history FOR SELECT USING (is_admin_user(auth.uid()));
CREATE POLICY "Sistema insere backup history" ON public.backup_history FOR INSERT WITH CHECK (true);

-- ============================================================
-- PARTE 7: STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('documentos', 'documentos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('idjuv-backups', 'idjuv-backups', false);

-- Políticas de storage
CREATE POLICY "Documentos públicos para leitura" ON storage.objects FOR SELECT USING (bucket_id = 'documentos');
CREATE POLICY "Autenticados podem upload documentos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documentos');

-- ============================================================
-- PARTE 8: DADOS INICIAIS
-- ============================================================

-- Inserir configuração inicial de backup
INSERT INTO public.backup_config (enabled, schedule_cron, retention_daily, retention_weekly, retention_monthly, buckets_included, encryption_enabled)
VALUES (true, '0 2 * * *', 7, 4, 6, ARRAY['documentos'], true);

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
