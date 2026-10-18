-- ============================================================
-- IDJUV - SCHEMA SEGURO (Ignora tabelas existentes)
-- Execute este script no SQL Editor do seu Supabase
-- ============================================================

-- ============================================================
-- PARTE 1: EXTENSÕES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PARTE 2: TIPOS ENUM (DO NOTHING se já existir)
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.access_scope AS ENUM ('all', 'org_unit', 'local_unit', 'own', 'readonly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
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
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM (
    'admin', 'manager', 'user', 'guest', 'presidencia', 'diraf', 'rh', 'ti_admin',
    'gabinete', 'controle_interno', 'juridico', 'cpl', 'ascom',
    'cadastrador_local', 'cadastrador_setor', 'cadastrador_leitura'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.approval_status AS ENUM ('draft', 'submitted', 'in_review', 'approved', 'rejected', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.audit_action AS ENUM (
    'login', 'logout', 'login_failed', 'password_change', 'password_reset',
    'create', 'update', 'delete', 'view', 'export', 'upload', 'download',
    'approve', 'reject', 'submit'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.backup_status AS ENUM ('pending', 'running', 'success', 'failed', 'partial');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.backup_type AS ENUM ('daily', 'weekly', 'monthly', 'manual');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.categoria_cargo AS ENUM ('efetivo', 'comissionado', 'funcao_gratificada', 'temporario', 'estagiario');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.categoria_portaria AS ENUM ('estruturante', 'normativa', 'pessoal', 'delegacao');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.estado_conservacao AS ENUM ('otimo', 'bom', 'regular', 'ruim', 'inservivel');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.situacao_funcional AS ENUM ('ativo', 'afastado', 'cedido', 'licenca', 'ferias', 'exonerado', 'aposentado', 'falecido', 'inativo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.situacao_patrimonio AS ENUM ('em_uso', 'em_estoque', 'cedido', 'em_manutencao', 'baixado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.status_agenda AS ENUM ('solicitado', 'aprovado', 'rejeitado', 'cancelado', 'concluido');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.status_documento AS ENUM ('rascunho', 'aguardando_publicacao', 'publicado', 'vigente', 'revogado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.status_nomeacao AS ENUM ('ativo', 'encerrado', 'revogado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.status_ponto AS ENUM ('completo', 'incompleto', 'pendente_justificativa', 'justificado', 'aprovado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.status_solicitacao AS ENUM ('pendente', 'aprovada', 'rejeitada', 'cancelada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.status_termo_cessao AS ENUM ('pendente', 'emitido', 'assinado', 'cancelado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.status_unidade_local AS ENUM ('ativa', 'inativa', 'manutencao', 'interditada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.tipo_afastamento AS ENUM ('licenca', 'suspensao', 'cessao', 'disposicao', 'servico_externo', 'missao', 'outro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.tipo_ato_nomeacao AS ENUM ('portaria', 'decreto', 'ato', 'outro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.tipo_documento AS ENUM ('portaria', 'resolucao', 'instrucao_normativa', 'ordem_servico', 'comunicado', 'decreto', 'lei', 'outro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.tipo_justificativa AS ENUM ('atestado', 'declaracao', 'trabalho_externo', 'esquecimento', 'problema_sistema', 'outro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.tipo_lancamento_horas AS ENUM ('credito', 'debito', 'ajuste');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.tipo_licenca AS ENUM ('maternidade', 'paternidade', 'medica', 'casamento', 'luto', 'interesse_particular', 'capacitacao', 'premio', 'mandato_eletivo', 'mandato_classista', 'outra');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.tipo_movimentacao_funcional AS ENUM ('nomeacao', 'exoneracao', 'designacao', 'dispensa', 'promocao', 'transferencia', 'cessao', 'requisicao', 'redistribuicao', 'remocao', 'afastamento', 'retorno', 'aposentadoria', 'vacancia');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.tipo_portaria_rh AS ENUM ('nomeacao', 'exoneracao', 'designacao', 'dispensa', 'ferias', 'viagem', 'cessao', 'afastamento', 'substituicao', 'gratificacao', 'comissao', 'outro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.tipo_registro_ponto AS ENUM ('normal', 'feriado', 'folga', 'atestado', 'falta', 'ferias', 'licenca');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.tipo_unidade AS ENUM ('presidencia', 'diretoria', 'departamento', 'setor', 'divisao', 'secao', 'coordenacao');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.tipo_unidade_local AS ENUM ('ginasio', 'estadio', 'parque_aquatico', 'piscina', 'complexo', 'quadra', 'outro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.vinculo_funcional AS ENUM ('efetivo', 'comissionado', 'cedido', 'temporario', 'estagiario', 'requisitado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.tipo_servidor AS ENUM ('comissionado_idjuv', 'efetivo_idjuv', 'cedido_entrada', 'cedido_saida', 'temporario', 'estagiario');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.tipo_usuario AS ENUM ('servidor', 'tecnico');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.natureza_cargo AS ENUM ('direcao', 'chefia', 'assessoramento', 'execucao');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.status_provimento AS ENUM ('ativo', 'encerrado', 'suspenso');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.categoria_demanda_ascom AS ENUM ('interna', 'externa', 'evento', 'campanha', 'crise', 'rotina');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.tipo_demanda_ascom AS ENUM (
    'design_arte_simples', 'design_arte_complexa', 'design_identidade_visual',
    'video_gravacao', 'video_edicao', 'video_cobertura',
    'foto_cobertura', 'foto_institucional',
    'redes_post', 'redes_stories', 'redes_campanha',
    'conteudo_release', 'conteudo_nota_oficial', 'conteudo_materia',
    'imprensa_agendamento_entrevista', 'imprensa_atendimento',
    'evento_organizacao', 'evento_apoio', 'evento_cobertura_completa',
    'emergencial_crise', 'emergencial_posicionamento'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.status_demanda_ascom AS ENUM ('solicitado', 'em_analise', 'aprovado', 'em_execucao', 'aguardando_aprovacao', 'concluido', 'cancelado', 'indeferido');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.prioridade_demanda_ascom AS ENUM ('baixa', 'media', 'alta', 'urgente');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- PARTE 3: TABELAS (IF NOT EXISTS)
-- ============================================================

-- Adicionar colunas extras na profiles se não existirem
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tipo_usuario public.tipo_usuario DEFAULT 'servidor';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS servidor_id UUID;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf VARCHAR(14);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blocked_reason TEXT;

-- User Roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

-- User Permissions
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission public.app_permission NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, permission)
);

-- Role Permissions
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  permission public.app_permission NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(role, permission)
);

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

-- Perfis (Sistema de Permissões)
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
  configuracao_cnab240 JSONB,
  configuracao_cnab400 JSONB,
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
  incide_fgts BOOLEAN DEFAULT false,
  compoe_remuneracao BOOLEAN DEFAULT true,
  valor_fixo DECIMAL(10,2),
  percentual DECIMAL(5,2),
  formula TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unidades Locais
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
  endereco_logradouro VARCHAR(255),
  endereco_numero VARCHAR(20),
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
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- ============================================================
-- PARTE 4: FUNÇÕES RPC
-- ============================================================

-- Função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.usuario_eh_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuario_perfis up
    JOIN public.perfis p ON up.perfil_id = p.id
    WHERE up.user_id = check_user_id
      AND up.ativo = true
      AND (up.data_fim IS NULL OR up.data_fim >= CURRENT_DATE)
      AND (p.codigo IN ('super_admin', 'admin') OR p.nome IN ('Super Administrador', 'Administrador'))
  );
END;
$$;

-- Função para listar permissões do usuário
CREATE OR REPLACE FUNCTION public.listar_permissoes_usuario(check_user_id UUID)
RETURNS TABLE(
  funcao_id UUID,
  funcao_codigo VARCHAR,
  funcao_nome VARCHAR,
  modulo VARCHAR,
  submodulo VARCHAR,
  tipo_acao VARCHAR,
  perfil_nome VARCHAR,
  rota VARCHAR,
  icone VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    f.id,
    f.codigo,
    f.nome,
    f.modulo,
    f.submodulo,
    f.tipo_acao,
    p.nome as perfil_nome,
    f.rota,
    f.icone
  FROM public.usuario_perfis up
  JOIN public.perfis p ON up.perfil_id = p.id
  JOIN public.perfil_funcoes pf ON p.id = pf.perfil_id
  JOIN public.funcoes_sistema f ON pf.funcao_id = f.id
  WHERE up.user_id = check_user_id
    AND up.ativo = true
    AND (up.data_fim IS NULL OR up.data_fim >= CURRENT_DATE)
    AND pf.concedido = true
    AND f.ativo = true
  ORDER BY f.modulo, f.submodulo, f.ordem;
END;
$$;

-- Função para verificar permissão específica
CREATE OR REPLACE FUNCTION public.usuario_tem_permissao(_user_id UUID, _codigo_funcao VARCHAR)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tem_permissao BOOLEAN := false;
  _perfil RECORD;
  _perfil_atual UUID;
BEGIN
  FOR _perfil IN 
    SELECT up.perfil_id 
    FROM usuario_perfis up
    WHERE up.user_id = _user_id 
      AND up.ativo = true
      AND (up.data_fim IS NULL OR up.data_fim >= CURRENT_DATE)
  LOOP
    SELECT EXISTS (
      SELECT 1 
      FROM perfil_funcoes pf
      JOIN funcoes_sistema fs ON fs.id = pf.funcao_id
      WHERE pf.perfil_id = _perfil.perfil_id
        AND fs.codigo = _codigo_funcao
        AND pf.concedido = true
        AND fs.ativo = true
    ) INTO _tem_permissao;
    
    IF _tem_permissao THEN
      RETURN true;
    END IF;
  END LOOP;
  
  RETURN false;
END;
$$;

-- ============================================================
-- PARTE 5: RLS BÁSICO
-- ============================================================

ALTER TABLE public.servidores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcoes_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfil_funcoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuario_perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estrutura_organizacional ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotacoes ENABLE ROW LEVEL SECURITY;

-- Políticas básicas para leitura
DROP POLICY IF EXISTS "Permitir leitura de servidores" ON public.servidores;
CREATE POLICY "Permitir leitura de servidores" ON public.servidores FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir leitura de perfis" ON public.perfis;
CREATE POLICY "Permitir leitura de perfis" ON public.perfis FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir leitura de funcoes" ON public.funcoes_sistema;
CREATE POLICY "Permitir leitura de funcoes" ON public.funcoes_sistema FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir leitura de perfil_funcoes" ON public.perfil_funcoes;
CREATE POLICY "Permitir leitura de perfil_funcoes" ON public.perfil_funcoes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir leitura de usuario_perfis" ON public.usuario_perfis;
CREATE POLICY "Permitir leitura de usuario_perfis" ON public.usuario_perfis FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir leitura de cargos" ON public.cargos;
CREATE POLICY "Permitir leitura de cargos" ON public.cargos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir leitura de estrutura" ON public.estrutura_organizacional;
CREATE POLICY "Permitir leitura de estrutura" ON public.estrutura_organizacional FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir leitura de provimentos" ON public.provimentos;
CREATE POLICY "Permitir leitura de provimentos" ON public.provimentos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir leitura de lotacoes" ON public.lotacoes;
CREATE POLICY "Permitir leitura de lotacoes" ON public.lotacoes FOR SELECT USING (true);

-- Políticas de escrita para admins
DROP POLICY IF EXISTS "Admins podem gerenciar servidores" ON public.servidores;
CREATE POLICY "Admins podem gerenciar servidores" ON public.servidores FOR ALL USING (public.usuario_eh_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins podem gerenciar perfis" ON public.perfis;
CREATE POLICY "Admins podem gerenciar perfis" ON public.perfis FOR ALL USING (public.usuario_eh_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins podem gerenciar funcoes" ON public.funcoes_sistema;
CREATE POLICY "Admins podem gerenciar funcoes" ON public.funcoes_sistema FOR ALL USING (public.usuario_eh_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins podem gerenciar perfil_funcoes" ON public.perfil_funcoes;
CREATE POLICY "Admins podem gerenciar perfil_funcoes" ON public.perfil_funcoes FOR ALL USING (public.usuario_eh_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins podem gerenciar usuario_perfis" ON public.usuario_perfis;
CREATE POLICY "Admins podem gerenciar usuario_perfis" ON public.usuario_perfis FOR ALL USING (public.usuario_eh_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins podem gerenciar cargos" ON public.cargos;
CREATE POLICY "Admins podem gerenciar cargos" ON public.cargos FOR ALL USING (public.usuario_eh_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins podem gerenciar estrutura" ON public.estrutura_organizacional;
CREATE POLICY "Admins podem gerenciar estrutura" ON public.estrutura_organizacional FOR ALL USING (public.usuario_eh_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins podem gerenciar provimentos" ON public.provimentos;
CREATE POLICY "Admins podem gerenciar provimentos" ON public.provimentos FOR ALL USING (public.usuario_eh_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins podem gerenciar lotacoes" ON public.lotacoes;
CREATE POLICY "Admins podem gerenciar lotacoes" ON public.lotacoes FOR ALL USING (public.usuario_eh_admin(auth.uid()));

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
SELECT 'Schema criado/atualizado com sucesso!' as resultado;
