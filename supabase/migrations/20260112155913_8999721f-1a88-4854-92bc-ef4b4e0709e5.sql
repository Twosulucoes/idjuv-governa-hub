
-- =====================================================
-- ETAPA 1: INFRAESTRUTURA - FOLHA DE PAGAMENTO IDJUV
-- PARTE C: Consignações, Pensões, Dependentes, Exportações, eSocial
-- =====================================================

-- 14. CONSIGNAÇÕES
CREATE TABLE IF NOT EXISTS consignacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID REFERENCES servidores(id),
  rubrica_id UUID REFERENCES rubricas(id),
  consignataria_nome TEXT NOT NULL,
  consignataria_cnpj VARCHAR(18),
  consignataria_codigo VARCHAR(20),
  numero_contrato VARCHAR(50),
  tipo_consignacao VARCHAR(30),
  valor_total DECIMAL(15,2),
  valor_parcela DECIMAL(15,2) NOT NULL,
  total_parcelas INTEGER NOT NULL,
  parcelas_pagas INTEGER DEFAULT 0,
  saldo_devedor DECIMAL(15,2),
  data_inicio DATE NOT NULL,
  data_fim DATE,
  competencia_inicio VARCHAR(7),
  competencia_fim VARCHAR(7),
  ativo BOOLEAN DEFAULT TRUE,
  suspenso BOOLEAN DEFAULT FALSE,
  motivo_suspensao TEXT,
  data_suspensao DATE,
  quitado BOOLEAN DEFAULT FALSE,
  data_quitacao DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_consignacoes_servidor ON consignacoes(servidor_id);
CREATE INDEX IF NOT EXISTS idx_consignacoes_ativo ON consignacoes(ativo, suspenso);
ALTER TABLE consignacoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "consignacoes_select" ON consignacoes;
DROP POLICY IF EXISTS "consignacoes_rh_admin" ON consignacoes;
CREATE POLICY "consignacoes_select" ON consignacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "consignacoes_rh_admin" ON consignacoes FOR ALL TO authenticated 
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'rh'::app_role));

-- 15. PENSÕES ALIMENTÍCIAS
CREATE TABLE IF NOT EXISTS pensoes_alimenticias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID REFERENCES servidores(id),
  beneficiario_nome TEXT NOT NULL,
  beneficiario_cpf VARCHAR(14),
  beneficiario_data_nascimento DATE,
  beneficiario_parentesco VARCHAR(30),
  numero_processo VARCHAR(50),
  vara_judicial TEXT,
  comarca TEXT,
  data_decisao DATE,
  tipo_calculo VARCHAR(20) NOT NULL,
  percentual DECIMAL(6,4),
  valor_fixo DECIMAL(15,2),
  base_calculo VARCHAR(50) DEFAULT 'liquido',
  prioridade INTEGER DEFAULT 1,
  banco_codigo VARCHAR(3),
  banco_nome VARCHAR(100),
  banco_agencia VARCHAR(10),
  banco_conta VARCHAR(20),
  banco_tipo_conta VARCHAR(20),
  pix_chave TEXT,
  pix_tipo VARCHAR(20),
  ativo BOOLEAN DEFAULT TRUE,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  decisao_judicial_url TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_pensoes_alimenticias_servidor ON pensoes_alimenticias(servidor_id);
CREATE INDEX IF NOT EXISTS idx_pensoes_alimenticias_ativo ON pensoes_alimenticias(ativo);
ALTER TABLE pensoes_alimenticias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pensoes_alimenticias_select" ON pensoes_alimenticias;
DROP POLICY IF EXISTS "pensoes_alimenticias_rh_admin" ON pensoes_alimenticias;
CREATE POLICY "pensoes_alimenticias_select" ON pensoes_alimenticias FOR SELECT TO authenticated USING (true);
CREATE POLICY "pensoes_alimenticias_rh_admin" ON pensoes_alimenticias FOR ALL TO authenticated 
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'rh'::app_role));

-- 16. DEPENDENTES IRRF
CREATE TABLE IF NOT EXISTS dependentes_irrf (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID REFERENCES servidores(id),
  nome TEXT NOT NULL,
  cpf VARCHAR(14),
  data_nascimento DATE NOT NULL,
  tipo_dependente VARCHAR(30) NOT NULL,
  grau_instrucao VARCHAR(50),
  deduz_irrf BOOLEAN DEFAULT TRUE,
  data_inicio_deducao DATE NOT NULL,
  data_fim_deducao DATE,
  documento_url TEXT,
  certidao_url TEXT,
  observacoes TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_dependentes_irrf_servidor ON dependentes_irrf(servidor_id);
CREATE INDEX IF NOT EXISTS idx_dependentes_irrf_ativo ON dependentes_irrf(ativo, deduz_irrf);
ALTER TABLE dependentes_irrf ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dependentes_irrf_select" ON dependentes_irrf;
DROP POLICY IF EXISTS "dependentes_irrf_rh_admin" ON dependentes_irrf;
CREATE POLICY "dependentes_irrf_select" ON dependentes_irrf FOR SELECT TO authenticated USING (true);
CREATE POLICY "dependentes_irrf_rh_admin" ON dependentes_irrf FOR ALL TO authenticated 
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'rh'::app_role));

-- 17. EXPORTAÇÕES FOLHA
CREATE TABLE IF NOT EXISTS exportacoes_folha (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folha_id UUID REFERENCES folhas_pagamento(id),
  tipo_exportacao VARCHAR(30) NOT NULL,
  nome_arquivo TEXT NOT NULL,
  arquivo_url TEXT,
  tamanho_bytes INTEGER,
  hash_arquivo VARCHAR(64),
  quantidade_registros INTEGER,
  valor_total DECIMAL(15,2),
  banco_id UUID REFERENCES bancos_cnab(id),
  status VARCHAR(20) DEFAULT 'gerado',
  mensagem_status TEXT,
  gerado_em TIMESTAMPTZ DEFAULT NOW(),
  gerado_por UUID REFERENCES profiles(id),
  enviado_em TIMESTAMPTZ,
  enviado_por UUID REFERENCES profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_exportacoes_folha_folha ON exportacoes_folha(folha_id);
CREATE INDEX IF NOT EXISTS idx_exportacoes_folha_tipo ON exportacoes_folha(tipo_exportacao);
ALTER TABLE exportacoes_folha ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "exportacoes_folha_select" ON exportacoes_folha;
DROP POLICY IF EXISTS "exportacoes_folha_rh_admin" ON exportacoes_folha;
CREATE POLICY "exportacoes_folha_select" ON exportacoes_folha FOR SELECT TO authenticated USING (true);
CREATE POLICY "exportacoes_folha_rh_admin" ON exportacoes_folha FOR ALL TO authenticated 
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'rh'::app_role));

-- 18. EVENTOS eSocial
CREATE TABLE IF NOT EXISTS eventos_esocial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_evento VARCHAR(10) NOT NULL,
  id_evento VARCHAR(50),
  folha_id UUID REFERENCES folhas_pagamento(id),
  servidor_id UUID REFERENCES servidores(id),
  competencia_ano INTEGER,
  competencia_mes INTEGER,
  payload JSONB NOT NULL,
  payload_xml TEXT,
  status status_evento_esocial DEFAULT 'pendente',
  mensagem_retorno TEXT,
  protocolo_envio VARCHAR(50),
  recibo VARCHAR(50),
  data_geracao TIMESTAMPTZ DEFAULT NOW(),
  gerado_por UUID REFERENCES profiles(id),
  data_envio TIMESTAMPTZ,
  data_retorno TIMESTAMPTZ,
  tentativas_envio INTEGER DEFAULT 0,
  lote_id VARCHAR(50),
  sequencia_lote INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eventos_esocial_tipo ON eventos_esocial(tipo_evento);
CREATE INDEX IF NOT EXISTS idx_eventos_esocial_folha ON eventos_esocial(folha_id);
CREATE INDEX IF NOT EXISTS idx_eventos_esocial_servidor ON eventos_esocial(servidor_id);
CREATE INDEX IF NOT EXISTS idx_eventos_esocial_status ON eventos_esocial(status);
CREATE INDEX IF NOT EXISTS idx_eventos_esocial_lote ON eventos_esocial(lote_id);
ALTER TABLE eventos_esocial ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "eventos_esocial_select" ON eventos_esocial;
DROP POLICY IF EXISTS "eventos_esocial_rh_admin" ON eventos_esocial;
CREATE POLICY "eventos_esocial_select" ON eventos_esocial FOR SELECT TO authenticated USING (true);
CREATE POLICY "eventos_esocial_rh_admin" ON eventos_esocial FOR ALL TO authenticated 
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'rh'::app_role));
