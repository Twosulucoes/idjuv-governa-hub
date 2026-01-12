
-- =====================================================
-- ETAPA 1: INFRAESTRUTURA - FOLHA DE PAGAMENTO IDJUV
-- PARTE A: Criação de ENUMs e Tabelas Básicas
-- =====================================================

-- 1. CRIAR ENUMS
DO $$ BEGIN
  CREATE TYPE tipo_rubrica AS ENUM ('provento', 'desconto', 'informativo', 'encargo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE natureza_rubrica AS ENUM ('remuneratorio', 'indenizatorio', 'informativo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE formula_tipo AS ENUM ('valor_fixo', 'percentual_base', 'quantidade_valor', 'calculo_especial', 'referencia_cargo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tipo_folha AS ENUM ('mensal', 'complementar', '13_1a_parcela', '13_2a_parcela', 'rescisao', 'retroativos');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE status_folha AS ENUM ('aberta', 'previa', 'processando', 'fechada', 'reaberta');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE origem_lancamento AS ENUM ('automatico', 'manual', 'importado', 'retroativo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE status_evento_esocial AS ENUM ('pendente', 'gerado', 'validado', 'enviado', 'aceito', 'rejeitado', 'erro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. TABELA CONFIG_AUTARQUIA
CREATE TABLE IF NOT EXISTS config_autarquia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj VARCHAR(18) NOT NULL,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  endereco_logradouro TEXT,
  endereco_numero VARCHAR(20),
  endereco_complemento TEXT,
  endereco_bairro TEXT,
  endereco_cidade TEXT DEFAULT 'Boa Vista',
  endereco_uf VARCHAR(2) DEFAULT 'RR',
  endereco_cep VARCHAR(9),
  telefone VARCHAR(20),
  email_institucional TEXT,
  site TEXT,
  responsavel_legal TEXT,
  cpf_responsavel VARCHAR(14),
  cargo_responsavel TEXT,
  responsavel_contabil TEXT,
  cpf_contabil VARCHAR(14),
  crc_contabil VARCHAR(20),
  regime_tributario VARCHAR(50) DEFAULT 'autarquia_estadual',
  natureza_juridica VARCHAR(10) DEFAULT '1244',
  codigo_municipio VARCHAR(7) DEFAULT '1400100',
  esocial_ambiente VARCHAR(10) DEFAULT 'producao_restrita',
  esocial_processo_emissao VARCHAR(1) DEFAULT '1',
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id)
);

ALTER TABLE config_autarquia ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "config_autarquia_select" ON config_autarquia;
DROP POLICY IF EXISTS "config_autarquia_admin" ON config_autarquia;
CREATE POLICY "config_autarquia_select" ON config_autarquia FOR SELECT TO authenticated USING (true);
CREATE POLICY "config_autarquia_admin" ON config_autarquia FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. TABELA PARAMETROS_FOLHA
CREATE TABLE IF NOT EXISTS parametros_folha (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_parametro VARCHAR(50) NOT NULL,
  valor DECIMAL(15,4) NOT NULL,
  vigencia_inicio DATE NOT NULL,
  vigencia_fim DATE,
  descricao TEXT,
  observacoes TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_parametros_folha_vigencia ON parametros_folha(tipo_parametro, vigencia_inicio, vigencia_fim);
ALTER TABLE parametros_folha ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "parametros_folha_select" ON parametros_folha;
DROP POLICY IF EXISTS "parametros_folha_admin" ON parametros_folha;
CREATE POLICY "parametros_folha_select" ON parametros_folha FOR SELECT TO authenticated USING (true);
CREATE POLICY "parametros_folha_admin" ON parametros_folha FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. TABELA INSS POR FAIXAS
CREATE TABLE IF NOT EXISTS tabela_inss (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vigencia_inicio DATE NOT NULL,
  vigencia_fim DATE,
  faixa_ordem INTEGER NOT NULL,
  valor_minimo DECIMAL(15,2) NOT NULL,
  valor_maximo DECIMAL(15,2),
  aliquota DECIMAL(6,4) NOT NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  UNIQUE(vigencia_inicio, faixa_ordem)
);

CREATE INDEX IF NOT EXISTS idx_tabela_inss_vigencia ON tabela_inss(vigencia_inicio, vigencia_fim, faixa_ordem);
ALTER TABLE tabela_inss ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tabela_inss_select" ON tabela_inss;
DROP POLICY IF EXISTS "tabela_inss_admin" ON tabela_inss;
CREATE POLICY "tabela_inss_select" ON tabela_inss FOR SELECT TO authenticated USING (true);
CREATE POLICY "tabela_inss_admin" ON tabela_inss FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. TABELA IRRF POR FAIXAS
CREATE TABLE IF NOT EXISTS tabela_irrf (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vigencia_inicio DATE NOT NULL,
  vigencia_fim DATE,
  faixa_ordem INTEGER NOT NULL,
  valor_minimo DECIMAL(15,2) NOT NULL,
  valor_maximo DECIMAL(15,2),
  aliquota DECIMAL(6,4) NOT NULL,
  parcela_deduzir DECIMAL(15,2) NOT NULL DEFAULT 0,
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  UNIQUE(vigencia_inicio, faixa_ordem)
);

CREATE INDEX IF NOT EXISTS idx_tabela_irrf_vigencia ON tabela_irrf(vigencia_inicio, vigencia_fim, faixa_ordem);
ALTER TABLE tabela_irrf ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tabela_irrf_select" ON tabela_irrf;
DROP POLICY IF EXISTS "tabela_irrf_admin" ON tabela_irrf;
CREATE POLICY "tabela_irrf_select" ON tabela_irrf FOR SELECT TO authenticated USING (true);
CREATE POLICY "tabela_irrf_admin" ON tabela_irrf FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 6. BANCOS CNAB
CREATE TABLE IF NOT EXISTS bancos_cnab (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_banco VARCHAR(3) NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  nome_reduzido VARCHAR(30),
  layout_cnab240 BOOLEAN DEFAULT TRUE,
  layout_cnab400 BOOLEAN DEFAULT FALSE,
  configuracao_cnab240 JSONB,
  configuracao_cnab400 JSONB,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bancos_cnab ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bancos_cnab_select" ON bancos_cnab;
DROP POLICY IF EXISTS "bancos_cnab_admin" ON bancos_cnab;
CREATE POLICY "bancos_cnab_select" ON bancos_cnab FOR SELECT TO authenticated USING (true);
CREATE POLICY "bancos_cnab_admin" ON bancos_cnab FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 7. CONTAS AUTARQUIA
CREATE TABLE IF NOT EXISTS contas_autarquia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banco_id UUID REFERENCES bancos_cnab(id),
  descricao TEXT NOT NULL,
  agencia VARCHAR(10) NOT NULL,
  agencia_digito VARCHAR(2),
  conta VARCHAR(20) NOT NULL,
  conta_digito VARCHAR(2),
  tipo_conta VARCHAR(20) DEFAULT 'corrente',
  convenio_pagamento VARCHAR(20),
  codigo_cedente VARCHAR(20),
  codigo_transmissao VARCHAR(20),
  uso_principal VARCHAR(30) DEFAULT 'folha',
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

ALTER TABLE contas_autarquia ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "contas_autarquia_select" ON contas_autarquia;
DROP POLICY IF EXISTS "contas_autarquia_admin" ON contas_autarquia;
CREATE POLICY "contas_autarquia_select" ON contas_autarquia FOR SELECT TO authenticated USING (true);
CREATE POLICY "contas_autarquia_admin" ON contas_autarquia FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 8. CENTROS DE CUSTO
CREATE TABLE IF NOT EXISTS centros_custo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(20) NOT NULL UNIQUE,
  descricao TEXT NOT NULL,
  unidade_id UUID REFERENCES estrutura_organizacional(id),
  elemento_despesa VARCHAR(20),
  natureza_despesa VARCHAR(20),
  fonte_recurso VARCHAR(20),
  programa_trabalho VARCHAR(30),
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE centros_custo ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "centros_custo_select" ON centros_custo;
DROP POLICY IF EXISTS "centros_custo_admin" ON centros_custo;
CREATE POLICY "centros_custo_select" ON centros_custo FOR SELECT TO authenticated USING (true);
CREATE POLICY "centros_custo_admin" ON centros_custo FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
