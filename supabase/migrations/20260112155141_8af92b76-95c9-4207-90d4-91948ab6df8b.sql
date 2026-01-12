
-- =====================================================
-- ETAPA 1: INFRAESTRUTURA - FOLHA DE PAGAMENTO IDJUV
-- PARTE B: Rubricas e Folha de Pagamento
-- =====================================================

-- 9. RUBRICAS (EVENTOS DE FOLHA)
CREATE TABLE IF NOT EXISTS rubricas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(10) NOT NULL UNIQUE,
  descricao TEXT NOT NULL,
  tipo tipo_rubrica NOT NULL,
  natureza natureza_rubrica NOT NULL,
  incide_inss BOOLEAN DEFAULT FALSE,
  incide_irrf BOOLEAN DEFAULT FALSE,
  incide_fgts BOOLEAN DEFAULT FALSE,
  incide_13 BOOLEAN DEFAULT FALSE,
  incide_ferias BOOLEAN DEFAULT FALSE,
  incide_base_consignavel BOOLEAN DEFAULT FALSE,
  compoe_liquido BOOLEAN DEFAULT TRUE,
  formula_tipo formula_tipo NOT NULL,
  formula_valor DECIMAL(15,4),
  formula_referencia VARCHAR(50),
  formula_expressao TEXT,
  prioridade_desconto INTEGER DEFAULT 100,
  ordem_calculo INTEGER DEFAULT 100,
  valor_minimo DECIMAL(15,2),
  valor_maximo DECIMAL(15,2),
  vigencia_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  vigencia_fim DATE,
  codigo_esocial VARCHAR(10),
  ativo BOOLEAN DEFAULT TRUE,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_rubricas_codigo ON rubricas(codigo);
CREATE INDEX IF NOT EXISTS idx_rubricas_tipo ON rubricas(tipo);
CREATE INDEX IF NOT EXISTS idx_rubricas_vigencia ON rubricas(vigencia_inicio, vigencia_fim);
ALTER TABLE rubricas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rubricas_select" ON rubricas;
DROP POLICY IF EXISTS "rubricas_admin" ON rubricas;
CREATE POLICY "rubricas_select" ON rubricas FOR SELECT TO authenticated USING (true);
CREATE POLICY "rubricas_admin" ON rubricas FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 10. HISTÓRICO DE RUBRICAS
CREATE TABLE IF NOT EXISTS rubricas_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rubrica_id UUID REFERENCES rubricas(id) ON DELETE CASCADE,
  versao INTEGER NOT NULL,
  dados_anteriores JSONB NOT NULL,
  dados_novos JSONB NOT NULL,
  campos_alterados TEXT[],
  justificativa TEXT,
  alterado_em TIMESTAMPTZ DEFAULT NOW(),
  alterado_por UUID REFERENCES profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_rubricas_historico_rubrica ON rubricas_historico(rubrica_id, versao DESC);
ALTER TABLE rubricas_historico ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rubricas_historico_select" ON rubricas_historico;
CREATE POLICY "rubricas_historico_select" ON rubricas_historico FOR SELECT TO authenticated USING (true);

-- 11. FOLHAS DE PAGAMENTO
CREATE TABLE IF NOT EXISTS folhas_pagamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competencia_ano INTEGER NOT NULL,
  competencia_mes INTEGER NOT NULL,
  tipo_folha tipo_folha NOT NULL,
  status status_folha DEFAULT 'aberta',
  total_bruto DECIMAL(15,2) DEFAULT 0,
  total_descontos DECIMAL(15,2) DEFAULT 0,
  total_liquido DECIMAL(15,2) DEFAULT 0,
  total_encargos_patronais DECIMAL(15,2) DEFAULT 0,
  total_inss_servidor DECIMAL(15,2) DEFAULT 0,
  total_inss_patronal DECIMAL(15,2) DEFAULT 0,
  total_irrf DECIMAL(15,2) DEFAULT 0,
  quantidade_servidores INTEGER DEFAULT 0,
  data_processamento TIMESTAMPTZ,
  processado_por UUID REFERENCES profiles(id),
  tempo_processamento_ms INTEGER,
  hash_fechamento VARCHAR(64),
  data_fechamento TIMESTAMPTZ,
  fechado_por UUID REFERENCES profiles(id),
  reaberto BOOLEAN DEFAULT FALSE,
  reaberto_por UUID REFERENCES profiles(id),
  reaberto_em TIMESTAMPTZ,
  justificativa_reabertura TEXT,
  quantidade_reaberturas INTEGER DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  UNIQUE(competencia_ano, competencia_mes, tipo_folha)
);

CREATE INDEX IF NOT EXISTS idx_folhas_pagamento_competencia ON folhas_pagamento(competencia_ano, competencia_mes);
CREATE INDEX IF NOT EXISTS idx_folhas_pagamento_status ON folhas_pagamento(status);
ALTER TABLE folhas_pagamento ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "folhas_pagamento_select" ON folhas_pagamento;
DROP POLICY IF EXISTS "folhas_pagamento_rh_admin" ON folhas_pagamento;
CREATE POLICY "folhas_pagamento_select" ON folhas_pagamento FOR SELECT TO authenticated USING (true);
CREATE POLICY "folhas_pagamento_rh_admin" ON folhas_pagamento FOR ALL TO authenticated 
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'rh'::app_role));

-- 12. FICHAS FINANCEIRAS
CREATE TABLE IF NOT EXISTS fichas_financeiras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folha_id UUID REFERENCES folhas_pagamento(id) ON DELETE CASCADE,
  servidor_id UUID REFERENCES servidores(id),
  cargo_id UUID REFERENCES cargos(id),
  cargo_nome TEXT,
  cargo_vencimento DECIMAL(15,2),
  centro_custo_id UUID REFERENCES centros_custo(id),
  centro_custo_codigo VARCHAR(20),
  lotacao_id UUID REFERENCES lotacoes(id),
  total_proventos DECIMAL(15,2) DEFAULT 0,
  total_descontos DECIMAL(15,2) DEFAULT 0,
  valor_liquido DECIMAL(15,2) DEFAULT 0,
  base_inss DECIMAL(15,2) DEFAULT 0,
  valor_inss DECIMAL(15,2) DEFAULT 0,
  base_irrf DECIMAL(15,2) DEFAULT 0,
  valor_irrf DECIMAL(15,2) DEFAULT 0,
  base_consignavel DECIMAL(15,2) DEFAULT 0,
  margem_consignavel_usada DECIMAL(15,2) DEFAULT 0,
  inss_patronal DECIMAL(15,2) DEFAULT 0,
  rat DECIMAL(15,2) DEFAULT 0,
  outras_entidades DECIMAL(15,2) DEFAULT 0,
  total_encargos DECIMAL(15,2) DEFAULT 0,
  banco_codigo VARCHAR(3),
  banco_nome VARCHAR(100),
  banco_agencia VARCHAR(10),
  banco_conta VARCHAR(20),
  banco_tipo_conta VARCHAR(20),
  quantidade_dependentes INTEGER DEFAULT 0,
  valor_deducao_dependentes DECIMAL(15,2) DEFAULT 0,
  processado BOOLEAN DEFAULT FALSE,
  data_processamento TIMESTAMPTZ,
  tem_inconsistencia BOOLEAN DEFAULT FALSE,
  inconsistencias JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(folha_id, servidor_id)
);

CREATE INDEX IF NOT EXISTS idx_fichas_financeiras_folha ON fichas_financeiras(folha_id);
CREATE INDEX IF NOT EXISTS idx_fichas_financeiras_servidor ON fichas_financeiras(servidor_id);
CREATE INDEX IF NOT EXISTS idx_fichas_financeiras_cargo ON fichas_financeiras(cargo_id);
ALTER TABLE fichas_financeiras ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fichas_financeiras_select" ON fichas_financeiras;
DROP POLICY IF EXISTS "fichas_financeiras_rh_admin" ON fichas_financeiras;
CREATE POLICY "fichas_financeiras_select" ON fichas_financeiras FOR SELECT TO authenticated USING (true);
CREATE POLICY "fichas_financeiras_rh_admin" ON fichas_financeiras FOR ALL TO authenticated 
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'rh'::app_role));

-- 13. LANÇAMENTOS FOLHA
CREATE TABLE IF NOT EXISTS lancamentos_folha (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ficha_id UUID REFERENCES fichas_financeiras(id) ON DELETE CASCADE,
  rubrica_id UUID REFERENCES rubricas(id),
  rubrica_codigo VARCHAR(10) NOT NULL,
  rubrica_descricao TEXT NOT NULL,
  rubrica_tipo tipo_rubrica NOT NULL,
  referencia DECIMAL(15,4),
  valor_base DECIMAL(15,2),
  valor_calculado DECIMAL(15,2) NOT NULL,
  incidiu_inss BOOLEAN DEFAULT FALSE,
  incidiu_irrf BOOLEAN DEFAULT FALSE,
  origem origem_lancamento DEFAULT 'automatico',
  competencia_referencia VARCHAR(7),
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lancamentos_folha_ficha ON lancamentos_folha(ficha_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_folha_rubrica ON lancamentos_folha(rubrica_id);
ALTER TABLE lancamentos_folha ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lancamentos_folha_select" ON lancamentos_folha;
DROP POLICY IF EXISTS "lancamentos_folha_rh_admin" ON lancamentos_folha;
CREATE POLICY "lancamentos_folha_select" ON lancamentos_folha FOR SELECT TO authenticated USING (true);
CREATE POLICY "lancamentos_folha_rh_admin" ON lancamentos_folha FOR ALL TO authenticated 
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'rh'::app_role));

-- Habilitar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE folhas_pagamento;
ALTER PUBLICATION supabase_realtime ADD TABLE fichas_financeiras;
