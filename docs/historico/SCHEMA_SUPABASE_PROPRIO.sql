-- ============================================================
-- IDJUV - SCHEMA PARA SUPABASE PRÓPRIO
-- Atualizado em: 25/01/2026
-- 
-- INSTRUÇÕES:
-- 1. Crie um projeto no supabase.com
-- 2. Acesse SQL Editor
-- 3. Execute este script em ordem
-- ============================================================

-- ============================================================
-- PARTE 1: EXTENSÕES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PARTE 2: TIPOS ENUM
-- ============================================================

-- Acesso e Segurança
CREATE TYPE public.access_scope AS ENUM ('all', 'org_unit', 'local_unit', 'own', 'readonly');
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

-- Backup
CREATE TYPE public.backup_status AS ENUM ('pending', 'running', 'success', 'failed', 'partial');
CREATE TYPE public.backup_type AS ENUM ('daily', 'weekly', 'monthly', 'manual');

-- RH e Servidores
CREATE TYPE public.categoria_cargo AS ENUM ('efetivo', 'comissionado', 'funcao_gratificada', 'temporario', 'estagiario');
CREATE TYPE public.natureza_cargo AS ENUM ('livre_nomeacao', 'efetivo', 'temporario');
CREATE TYPE public.situacao_servidor AS ENUM ('ativo', 'afastado', 'cedido', 'licenca', 'ferias', 'exonerado', 'aposentado', 'falecido');
CREATE TYPE public.tipo_servidor AS ENUM ('comissionado', 'efetivo', 'cedido', 'requisitado', 'temporario', 'estagiario');
CREATE TYPE public.vinculo_servidor AS ENUM ('efetivo', 'comissionado', 'cedido', 'temporario', 'estagiario', 'requisitado');
CREATE TYPE public.tipo_usuario AS ENUM ('servidor', 'tecnico');

-- Estrutura
CREATE TYPE public.tipo_unidade AS ENUM ('presidencia', 'diretoria', 'departamento', 'setor', 'divisao', 'secao', 'coordenacao');
CREATE TYPE public.tipo_unidade_local AS ENUM ('ginasio', 'estadio', 'parque_aquatico', 'piscina', 'complexo', 'quadra', 'outro');
CREATE TYPE public.status_unidade_local AS ENUM ('ativa', 'inativa', 'manutencao', 'interditada');

-- Documentos
CREATE TYPE public.tipo_documento AS ENUM ('portaria', 'resolucao', 'instrucao_normativa', 'ordem_servico', 'comunicado', 'decreto', 'lei', 'outro');
CREATE TYPE public.status_documento AS ENUM ('rascunho', 'aguardando_publicacao', 'publicado', 'vigente', 'revogado');
CREATE TYPE public.categoria_portaria AS ENUM ('estruturante', 'normativa', 'pessoal', 'delegacao');
CREATE TYPE public.tipo_portaria_rh AS ENUM ('nomeacao', 'exoneracao', 'designacao', 'dispensa', 'ferias', 'viagem', 'cessao', 'afastamento', 'substituicao', 'gratificacao', 'comissao', 'outro');

-- Agenda e Patrimônio
CREATE TYPE public.status_agenda AS ENUM ('solicitado', 'aprovado', 'rejeitado', 'cancelado', 'concluido');
CREATE TYPE public.status_nomeacao AS ENUM ('ativo', 'encerrado', 'revogado');
CREATE TYPE public.tipo_ato_nomeacao AS ENUM ('portaria', 'decreto', 'ato', 'outro');
CREATE TYPE public.situacao_patrimonio AS ENUM ('em_uso', 'em_estoque', 'cedido', 'em_manutencao', 'baixado');
CREATE TYPE public.estado_conservacao AS ENUM ('otimo', 'bom', 'regular', 'ruim', 'inservivel');

-- Movimentações
CREATE TYPE public.tipo_movimentacao_funcional AS ENUM ('nomeacao', 'exoneracao', 'designacao', 'dispensa', 'promocao', 'transferencia', 'cessao', 'requisicao', 'redistribuicao', 'remocao', 'afastamento', 'retorno', 'aposentadoria', 'vacancia');
CREATE TYPE public.tipo_licenca AS ENUM ('maternidade', 'paternidade', 'medica', 'casamento', 'luto', 'interesse_particular', 'capacitacao', 'premio', 'mandato_eletivo', 'mandato_classista', 'outra');
CREATE TYPE public.tipo_vinculo AS ENUM ('efetivo', 'comissionado', 'cedido_entrada', 'cedido_saida', 'requisitado', 'temporario', 'estagiario');

-- ============================================================
-- PARTE 3: TABELAS DE AUTENTICAÇÃO E PERMISSÕES
-- ============================================================

-- Profiles (extensão de auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  cpf TEXT UNIQUE,
  tipo_usuario tipo_usuario DEFAULT 'servidor',
  servidor_id UUID,
  is_active BOOLEAN DEFAULT true,
  blocked_at TIMESTAMPTZ,
  blocked_reason TEXT,
  requires_password_change BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Perfis de Acesso (Sistema modular)
CREATE TABLE public.perfis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL UNIQUE,
  codigo VARCHAR(50) NOT NULL UNIQUE,
  descricao TEXT,
  nivel_hierarquia INTEGER NOT NULL DEFAULT 0,
  perfil_pai_id UUID REFERENCES public.perfis(id) ON DELETE SET NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  sistema BOOLEAN NOT NULL DEFAULT false,
  cor VARCHAR(20),
  icone VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Funções do Sistema (Permissões granulares)
CREATE TABLE public.funcoes_sistema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(100) NOT NULL UNIQUE,
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  modulo VARCHAR(100) NOT NULL,
  submodulo VARCHAR(100),
  tipo_acao VARCHAR(50) NOT NULL DEFAULT 'visualizar',
  funcao_pai_id UUID REFERENCES public.funcoes_sistema(id) ON DELETE SET NULL,
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

-- User Roles (legado, compatibilidade)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Audit Logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action audit_action NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  module_name TEXT,
  before_data JSONB,
  after_data JSONB,
  ip_address INET,
  user_agent TEXT,
  org_unit_id UUID,
  role_at_time app_role,
  description TEXT,
  metadata JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- PARTE 4: TABELAS DE RH
-- ============================================================

-- Cargos
CREATE TABLE public.cargos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  sigla TEXT,
  categoria categoria_cargo NOT NULL,
  natureza natureza_cargo,
  atribuicoes TEXT,
  requisitos TEXT[],
  competencias TEXT[],
  responsabilidades TEXT[],
  conhecimentos_necessarios TEXT[],
  escolaridade TEXT,
  experiencia_exigida TEXT,
  cbo VARCHAR(10),
  nivel_hierarquico INTEGER DEFAULT 1,
  quantidade_vagas INTEGER DEFAULT 1,
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
  nivel INTEGER DEFAULT 1,
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

-- Servidores
CREATE TABLE public.servidores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo TEXT NOT NULL,
  nome_social TEXT,
  cpf VARCHAR(14) NOT NULL UNIQUE,
  rg TEXT,
  rg_orgao TEXT,
  rg_uf VARCHAR(2),
  matricula TEXT UNIQUE,
  pis_pasep TEXT,
  titulo_eleitor TEXT,
  zona_eleitoral TEXT,
  secao_eleitoral TEXT,
  ctps_numero TEXT,
  ctps_serie TEXT,
  ctps_uf VARCHAR(2),
  cnh_numero TEXT,
  cnh_categoria TEXT,
  cnh_validade DATE,
  reservista TEXT,
  data_nascimento DATE,
  naturalidade TEXT,
  nacionalidade TEXT DEFAULT 'Brasileiro',
  sexo VARCHAR(20),
  estado_civil TEXT,
  escolaridade TEXT,
  email TEXT,
  email_institucional TEXT,
  telefone TEXT,
  telefone_secundario TEXT,
  endereco_logradouro TEXT,
  endereco_numero TEXT,
  endereco_complemento TEXT,
  endereco_bairro TEXT,
  endereco_cidade TEXT,
  endereco_uf VARCHAR(2),
  endereco_cep VARCHAR(10),
  situacao situacao_servidor NOT NULL DEFAULT 'ativo',
  tipo tipo_servidor,
  vinculo vinculo_servidor,
  cargo_atual_id UUID REFERENCES public.cargos(id),
  unidade_atual_id UUID REFERENCES public.estrutura_organizacional(id),
  data_admissao DATE,
  data_posse DATE,
  data_exercicio DATE,
  data_desligamento DATE,
  motivo_desligamento TEXT,
  banco_codigo TEXT,
  banco_nome TEXT,
  agencia TEXT,
  conta TEXT,
  tipo_conta TEXT,
  pix_tipo TEXT,
  pix_chave TEXT,
  foto_url TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Atualizar FK em profiles
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_servidor_id_fkey 
  FOREIGN KEY (servidor_id) REFERENCES public.servidores(id);

-- Atualizar FK em estrutura
ALTER TABLE public.estrutura_organizacional 
  ADD CONSTRAINT estrutura_servidor_responsavel_fkey 
  FOREIGN KEY (servidor_responsavel_id) REFERENCES public.servidores(id);

-- ============================================================
-- PARTE 5: FUNÇÕES DE SEGURANÇA
-- ============================================================

-- Verificar se usuário é admin
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
      AND p.codigo IN ('super_admin', 'admin')
  );
END;
$$;

-- Verificar permissão específica
CREATE OR REPLACE FUNCTION public.usuario_tem_permissao(
  check_user_id UUID,
  codigo_funcao VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuario_perfis up
    JOIN public.perfil_funcoes pf ON up.perfil_id = pf.perfil_id
    JOIN public.funcoes_sistema f ON pf.funcao_id = f.id
    WHERE up.user_id = check_user_id
      AND up.ativo = true
      AND (up.data_fim IS NULL OR up.data_fim >= CURRENT_DATE)
      AND pf.concedido = true
      AND f.codigo = codigo_funcao
      AND f.ativo = true
  );
END;
$$;

-- Listar todas as permissões de um usuário
CREATE OR REPLACE FUNCTION public.listar_permissoes_usuario(check_user_id UUID)
RETURNS TABLE(
  funcao_id UUID,
  funcao_codigo VARCHAR,
  funcao_nome VARCHAR,
  modulo VARCHAR,
  submodulo VARCHAR,
  tipo_acao VARCHAR,
  perfil_nome VARCHAR
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
    p.nome as perfil_nome
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

-- ============================================================
-- PARTE 6: RLS POLICIES
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcoes_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfil_funcoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuario_perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servidores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estrutura_organizacional ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.usuario_eh_admin(auth.uid()));

CREATE POLICY "Admins can manage all profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.usuario_eh_admin(auth.uid()));

-- Perfis
CREATE POLICY "Anyone can view active perfis"
  ON public.perfis FOR SELECT
  TO authenticated
  USING (ativo = true);

CREATE POLICY "Admins can manage perfis"
  ON public.perfis FOR ALL
  TO authenticated
  USING (public.usuario_eh_admin(auth.uid()));

-- Funções Sistema
CREATE POLICY "Anyone can view active funcoes"
  ON public.funcoes_sistema FOR SELECT
  TO authenticated
  USING (ativo = true);

CREATE POLICY "Admins can manage funcoes"
  ON public.funcoes_sistema FOR ALL
  TO authenticated
  USING (public.usuario_eh_admin(auth.uid()));

-- Perfil Funcoes
CREATE POLICY "Anyone can view perfil_funcoes"
  ON public.perfil_funcoes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage perfil_funcoes"
  ON public.perfil_funcoes FOR ALL
  TO authenticated
  USING (public.usuario_eh_admin(auth.uid()));

-- Usuario Perfis
CREATE POLICY "Users can view own perfis"
  ON public.usuario_perfis FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage usuario_perfis"
  ON public.usuario_perfis FOR ALL
  TO authenticated
  USING (public.usuario_eh_admin(auth.uid()));

-- Audit Logs
CREATE POLICY "Admins can view audit_logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.usuario_eh_admin(auth.uid()));

-- Servidores
CREATE POLICY "Anyone can view servidores"
  ON public.servidores FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage servidores"
  ON public.servidores FOR ALL
  TO authenticated
  USING (public.usuario_eh_admin(auth.uid()));

-- Cargos
CREATE POLICY "Anyone can view cargos"
  ON public.cargos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage cargos"
  ON public.cargos FOR ALL
  TO authenticated
  USING (public.usuario_eh_admin(auth.uid()));

-- Estrutura
CREATE POLICY "Anyone can view estrutura"
  ON public.estrutura_organizacional FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage estrutura"
  ON public.estrutura_organizacional FOR ALL
  TO authenticated
  USING (public.usuario_eh_admin(auth.uid()));

-- ============================================================
-- PARTE 7: DADOS INICIAIS
-- ============================================================

-- Perfis base
INSERT INTO public.perfis (nome, codigo, descricao, nivel_hierarquia, sistema) VALUES
  ('Super Administrador', 'super_admin', 'Acesso total ao sistema', 100, true),
  ('Administrador', 'admin', 'Administração geral', 90, true),
  ('Gestor', 'gestor', 'Gestão de equipes e processos', 70, false),
  ('Operador', 'operador', 'Operações básicas', 50, false),
  ('Visualizador', 'visualizador', 'Apenas consulta', 10, false);

-- Definir hierarquia
UPDATE public.perfis SET perfil_pai_id = (SELECT id FROM public.perfis WHERE codigo = 'super_admin') WHERE codigo = 'admin';
UPDATE public.perfis SET perfil_pai_id = (SELECT id FROM public.perfis WHERE codigo = 'admin') WHERE codigo = 'gestor';
UPDATE public.perfis SET perfil_pai_id = (SELECT id FROM public.perfis WHERE codigo = 'gestor') WHERE codigo = 'operador';
UPDATE public.perfis SET perfil_pai_id = (SELECT id FROM public.perfis WHERE codigo = 'operador') WHERE codigo = 'visualizador';

-- Funções do sistema
INSERT INTO public.funcoes_sistema (codigo, nome, modulo, submodulo, tipo_acao, ordem) VALUES
  -- Admin
  ('admin', 'Administração', 'admin', NULL, 'acessar', 1),
  ('admin.usuarios', 'Gestão de Usuários', 'admin', 'usuarios', 'acessar', 2),
  ('admin.usuarios.criar', 'Criar Usuário', 'admin', 'usuarios', 'criar', 3),
  ('admin.usuarios.editar', 'Editar Usuário', 'admin', 'usuarios', 'editar', 4),
  ('admin.usuarios.excluir', 'Excluir Usuário', 'admin', 'usuarios', 'excluir', 5),
  ('admin.perfis', 'Gestão de Perfis', 'admin', 'perfis', 'acessar', 6),
  ('admin.perfis.gerenciar', 'Gerenciar Perfis', 'admin', 'perfis', 'gerenciar', 7),
  ('admin.auditoria', 'Auditoria', 'admin', 'auditoria', 'visualizar', 8),
  
  -- RH
  ('rh', 'Recursos Humanos', 'rh', NULL, 'acessar', 10),
  ('rh.servidores', 'Gestão de Servidores', 'rh', 'servidores', 'acessar', 11),
  ('rh.servidores.criar', 'Cadastrar Servidor', 'rh', 'servidores', 'criar', 12),
  ('rh.servidores.editar', 'Editar Servidor', 'rh', 'servidores', 'editar', 13),
  ('rh.servidores.excluir', 'Excluir Servidor', 'rh', 'servidores', 'excluir', 14),
  ('rh.cargos', 'Gestão de Cargos', 'rh', 'cargos', 'acessar', 15),
  ('rh.estrutura', 'Estrutura Organizacional', 'rh', 'estrutura', 'acessar', 16),
  ('rh.portarias', 'Portarias', 'rh', 'portarias', 'acessar', 17),
  
  -- Relatórios
  ('relatorios', 'Relatórios', 'relatorios', NULL, 'acessar', 20),
  ('relatorios.rh', 'Relatórios de RH', 'relatorios', 'rh', 'visualizar', 21),
  ('relatorios.exportar', 'Exportar Relatórios', 'relatorios', NULL, 'exportar', 22);

-- Definir hierarquia de funções
UPDATE public.funcoes_sistema SET funcao_pai_id = (SELECT id FROM public.funcoes_sistema WHERE codigo = 'admin') WHERE codigo LIKE 'admin.%' AND codigo NOT LIKE 'admin.%.%';
UPDATE public.funcoes_sistema SET funcao_pai_id = (SELECT id FROM public.funcoes_sistema WHERE codigo = 'admin.usuarios') WHERE codigo LIKE 'admin.usuarios.%';
UPDATE public.funcoes_sistema SET funcao_pai_id = (SELECT id FROM public.funcoes_sistema WHERE codigo = 'admin.perfis') WHERE codigo LIKE 'admin.perfis.%';
UPDATE public.funcoes_sistema SET funcao_pai_id = (SELECT id FROM public.funcoes_sistema WHERE codigo = 'rh') WHERE codigo LIKE 'rh.%' AND codigo NOT LIKE 'rh.%.%';
UPDATE public.funcoes_sistema SET funcao_pai_id = (SELECT id FROM public.funcoes_sistema WHERE codigo = 'rh.servidores') WHERE codigo LIKE 'rh.servidores.%';
UPDATE public.funcoes_sistema SET funcao_pai_id = (SELECT id FROM public.funcoes_sistema WHERE codigo = 'relatorios') WHERE codigo LIKE 'relatorios.%';

-- Conceder todas as funções ao Super Admin
INSERT INTO public.perfil_funcoes (perfil_id, funcao_id)
SELECT 
  (SELECT id FROM public.perfis WHERE codigo = 'super_admin'),
  id
FROM public.funcoes_sistema;

-- ============================================================
-- PARTE 8: TRIGGERS
-- ============================================================

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_perfis_updated_at
  BEFORE UPDATE ON public.perfis
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_funcoes_updated_at
  BEFORE UPDATE ON public.funcoes_sistema
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_servidores_updated_at
  BEFORE UPDATE ON public.servidores
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_cargos_updated_at
  BEFORE UPDATE ON public.cargos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_estrutura_updated_at
  BEFORE UPDATE ON public.estrutura_organizacional
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger para criar profile automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- FIM DO SCHEMA
-- ============================================================

-- NOTA: Este é o schema base. 
-- As tabelas adicionais (folha, documentos, unidades locais, etc.)
-- podem ser adicionadas posteriormente conforme necessidade.
