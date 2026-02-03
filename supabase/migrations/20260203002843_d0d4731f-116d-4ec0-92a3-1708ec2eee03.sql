-- ============================================
-- CAMADA DE CONFIGURAÇÃO DO MÓDULO DE FOLHA DE PAGAMENTO
-- ============================================
-- Criação das tabelas de parametrização que eliminarão regras hardcoded
-- do motor de cálculo da folha.
--
-- Segue o mesmo padrão arquitetural do módulo de Frequência:
-- - Suporte multi-institucional (instituicao_id)
-- - Controle de vigência temporal
-- - RLS restritivo usando funções existentes
-- - Auditoria (created_at, created_by)
-- ============================================

-- ============================================
-- 1. TIPOS DE RUBRICA (categorização)
-- ============================================
CREATE TABLE IF NOT EXISTS public.config_tipos_rubrica (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instituicao_id UUID REFERENCES public.config_institucional(id) ON DELETE SET NULL,
  
  codigo VARCHAR(20) NOT NULL,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  
  natureza VARCHAR(20) NOT NULL CHECK (natureza IN ('provento', 'desconto', 'encargo', 'informativo')),
  grupo VARCHAR(50),
  subgrupo VARCHAR(50),
  
  ordem_exibicao INTEGER DEFAULT 0,
  exibe_contracheque BOOLEAN DEFAULT true,
  exibe_relatorio BOOLEAN DEFAULT true,
  
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  
  UNIQUE(instituicao_id, codigo)
);

COMMENT ON TABLE public.config_tipos_rubrica IS 'Categorias de rubricas para agrupamento e classificação';

-- ============================================
-- 2. CONFIGURAÇÃO DE RUBRICAS (parametrizada)
-- ============================================
CREATE TABLE IF NOT EXISTS public.config_rubricas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instituicao_id UUID REFERENCES public.config_institucional(id) ON DELETE SET NULL,
  tipo_rubrica_id UUID REFERENCES public.config_tipos_rubrica(id) ON DELETE SET NULL,
  
  codigo VARCHAR(20) NOT NULL,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  
  natureza VARCHAR(20) NOT NULL CHECK (natureza IN ('provento', 'desconto', 'encargo', 'informativo')),
  
  tipo_calculo VARCHAR(20) NOT NULL DEFAULT 'fixo' CHECK (tipo_calculo IN ('fixo', 'percentual', 'formula', 'referencia', 'tabela', 'manual')),
  
  valor_fixo NUMERIC(15,2),
  percentual NUMERIC(8,4),
  formula TEXT,
  rubrica_base_id UUID REFERENCES public.config_rubricas(id),
  
  valor_minimo NUMERIC(15,2),
  valor_maximo NUMERIC(15,2),
  teto_constitucional BOOLEAN DEFAULT false,
  
  incide_inss BOOLEAN DEFAULT false,
  incide_irrf BOOLEAN DEFAULT false,
  incide_fgts BOOLEAN DEFAULT false,
  incide_ferias BOOLEAN DEFAULT false,
  incide_13_salario BOOLEAN DEFAULT false,
  incide_rescisao BOOLEAN DEFAULT false,
  
  compoe_base_inss BOOLEAN DEFAULT false,
  compoe_base_irrf BOOLEAN DEFAULT false,
  compoe_base_fgts BOOLEAN DEFAULT false,
  
  automatica BOOLEAN DEFAULT true,
  obrigatoria BOOLEAN DEFAULT false,
  proporcional_dias BOOLEAN DEFAULT false,
  proporcional_horas BOOLEAN DEFAULT false,
  desconta_faltas BOOLEAN DEFAULT false,
  
  codigo_esocial VARCHAR(20),
  natureza_esocial VARCHAR(10),
  
  vigencia_inicio DATE DEFAULT CURRENT_DATE,
  vigencia_fim DATE,
  
  ordem_calculo INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  
  UNIQUE(instituicao_id, codigo, vigencia_inicio)
);

COMMENT ON TABLE public.config_rubricas IS 'Configuração parametrizada de rubricas com regras de cálculo e incidência';

-- ============================================
-- 3. INCIDÊNCIAS ENTRE RUBRICAS
-- ============================================
CREATE TABLE IF NOT EXISTS public.config_incidencias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instituicao_id UUID REFERENCES public.config_institucional(id) ON DELETE SET NULL,
  
  rubrica_origem_id UUID NOT NULL REFERENCES public.config_rubricas(id) ON DELETE CASCADE,
  rubrica_destino_id UUID NOT NULL REFERENCES public.config_rubricas(id) ON DELETE CASCADE,
  
  tipo_incidencia VARCHAR(30) NOT NULL CHECK (tipo_incidencia IN (
    'base_calculo', 'deduz_base', 'proporcionaliza', 'condiciona', 'exclui'
  )),
  
  percentual_incidencia NUMERIC(8,4) DEFAULT 100,
  valor_limite NUMERIC(15,2),
  
  vigencia_inicio DATE DEFAULT CURRENT_DATE,
  vigencia_fim DATE,
  
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(rubrica_origem_id, rubrica_destino_id, vigencia_inicio)
);

COMMENT ON TABLE public.config_incidencias IS 'Define como rubricas incidem umas sobre as outras';

-- ============================================
-- 4. REGRAS DE CÁLCULO PARAMETRIZADAS
-- ============================================
CREATE TABLE IF NOT EXISTS public.config_regras_calculo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instituicao_id UUID REFERENCES public.config_institucional(id) ON DELETE SET NULL,
  
  codigo VARCHAR(50) NOT NULL,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  
  escopo VARCHAR(30) NOT NULL DEFAULT 'geral' CHECK (escopo IN (
    'geral', 'cargo', 'vinculo', 'regime', 'unidade', 'servidor'
  )),
  escopo_id UUID,
  
  tipo_regra VARCHAR(30) NOT NULL CHECK (tipo_regra IN (
    'calculo_base', 'adicional_tempo', 'gratificacao', 'desconto_legal',
    'desconto_voluntario', 'proporcionalidade', 'arredondamento', 'teto'
  )),
  
  parametros JSONB NOT NULL DEFAULT '{}',
  condicoes JSONB DEFAULT '[]',
  
  vigencia_inicio DATE DEFAULT CURRENT_DATE,
  vigencia_fim DATE,
  
  prioridade INTEGER DEFAULT 0,
  
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  
  UNIQUE(instituicao_id, codigo, vigencia_inicio)
);

COMMENT ON TABLE public.config_regras_calculo IS 'Regras de cálculo parametrizadas para o motor de folha';

-- ============================================
-- 5. CONFIGURAÇÃO DE FECHAMENTO DA FOLHA
-- ============================================
CREATE TABLE IF NOT EXISTS public.config_fechamento_folha (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instituicao_id UUID REFERENCES public.config_institucional(id) ON DELETE SET NULL,
  
  nome VARCHAR(100) NOT NULL DEFAULT 'Padrão',
  descricao TEXT,
  
  dia_limite_lancamento INTEGER DEFAULT 20,
  dia_limite_processamento INTEGER DEFAULT 25,
  dia_pagamento INTEGER DEFAULT 30,
  
  bloqueia_alteracoes BOOLEAN DEFAULT true,
  permite_reabertura BOOLEAN DEFAULT true,
  exige_aprovacao_reabertura BOOLEAN DEFAULT true,
  perfil_aprovador_reabertura VARCHAR(50) DEFAULT 'admin',
  
  exige_frequencia_fechada BOOLEAN DEFAULT true,
  exige_todas_fichas_processadas BOOLEAN DEFAULT true,
  exige_validacao_inconsistencias BOOLEAN DEFAULT true,
  permite_fechar_com_pendencias BOOLEAN DEFAULT false,
  
  gera_remessa_automatica BOOLEAN DEFAULT false,
  conta_remessa_padrao_id UUID REFERENCES public.contas_autarquia(id),
  gera_esocial_automatico BOOLEAN DEFAULT false,
  
  registra_historico_alteracoes BOOLEAN DEFAULT true,
  prazo_guarda_historico_dias INTEGER DEFAULT 1825,
  
  padrao BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

COMMENT ON TABLE public.config_fechamento_folha IS 'Configuração de regras de fechamento e workflow da folha';

-- ============================================
-- HABILITAR RLS
-- ============================================
ALTER TABLE public.config_tipos_rubrica ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_rubricas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_incidencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_regras_calculo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_fechamento_folha ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS RLS - Usando funções existentes do sistema
-- ============================================

-- config_tipos_rubrica
CREATE POLICY "config_tipos_rubrica_select" ON public.config_tipos_rubrica
  FOR SELECT USING (
    ativo = true 
    OR usuario_tem_permissao(auth.uid(), 'rh.folha.gerenciar')
    OR usuario_tem_permissao(auth.uid(), 'admin.config')
    OR usuario_eh_super_admin(auth.uid())
  );

CREATE POLICY "config_tipos_rubrica_insert" ON public.config_tipos_rubrica
  FOR INSERT WITH CHECK (
    usuario_tem_permissao(auth.uid(), 'admin.config')
    OR usuario_tem_permissao(auth.uid(), 'rh.folha.gerenciar')
    OR usuario_eh_super_admin(auth.uid())
  );

CREATE POLICY "config_tipos_rubrica_update" ON public.config_tipos_rubrica
  FOR UPDATE USING (
    usuario_tem_permissao(auth.uid(), 'admin.config')
    OR usuario_tem_permissao(auth.uid(), 'rh.folha.gerenciar')
    OR usuario_eh_super_admin(auth.uid())
  );

CREATE POLICY "config_tipos_rubrica_delete" ON public.config_tipos_rubrica
  FOR DELETE USING (usuario_eh_super_admin(auth.uid()));

-- config_rubricas
CREATE POLICY "config_rubricas_select" ON public.config_rubricas
  FOR SELECT USING (
    ativo = true 
    OR usuario_tem_permissao(auth.uid(), 'rh.folha.gerenciar')
    OR usuario_tem_permissao(auth.uid(), 'admin.config')
    OR usuario_eh_super_admin(auth.uid())
  );

CREATE POLICY "config_rubricas_insert" ON public.config_rubricas
  FOR INSERT WITH CHECK (
    usuario_tem_permissao(auth.uid(), 'admin.config')
    OR usuario_tem_permissao(auth.uid(), 'rh.folha.gerenciar')
    OR usuario_eh_super_admin(auth.uid())
  );

CREATE POLICY "config_rubricas_update" ON public.config_rubricas
  FOR UPDATE USING (
    usuario_tem_permissao(auth.uid(), 'admin.config')
    OR usuario_tem_permissao(auth.uid(), 'rh.folha.gerenciar')
    OR usuario_eh_super_admin(auth.uid())
  );

CREATE POLICY "config_rubricas_delete" ON public.config_rubricas
  FOR DELETE USING (usuario_eh_super_admin(auth.uid()));

-- config_incidencias
CREATE POLICY "config_incidencias_select" ON public.config_incidencias
  FOR SELECT USING (
    ativo = true 
    OR usuario_tem_permissao(auth.uid(), 'rh.folha.gerenciar')
    OR usuario_tem_permissao(auth.uid(), 'admin.config')
    OR usuario_eh_super_admin(auth.uid())
  );

CREATE POLICY "config_incidencias_insert" ON public.config_incidencias
  FOR INSERT WITH CHECK (
    usuario_tem_permissao(auth.uid(), 'admin.config')
    OR usuario_tem_permissao(auth.uid(), 'rh.folha.gerenciar')
    OR usuario_eh_super_admin(auth.uid())
  );

CREATE POLICY "config_incidencias_update" ON public.config_incidencias
  FOR UPDATE USING (
    usuario_tem_permissao(auth.uid(), 'admin.config')
    OR usuario_tem_permissao(auth.uid(), 'rh.folha.gerenciar')
    OR usuario_eh_super_admin(auth.uid())
  );

CREATE POLICY "config_incidencias_delete" ON public.config_incidencias
  FOR DELETE USING (usuario_eh_super_admin(auth.uid()));

-- config_regras_calculo
CREATE POLICY "config_regras_calculo_select" ON public.config_regras_calculo
  FOR SELECT USING (
    ativo = true 
    OR usuario_tem_permissao(auth.uid(), 'rh.folha.gerenciar')
    OR usuario_tem_permissao(auth.uid(), 'admin.config')
    OR usuario_eh_super_admin(auth.uid())
  );

CREATE POLICY "config_regras_calculo_insert" ON public.config_regras_calculo
  FOR INSERT WITH CHECK (
    usuario_tem_permissao(auth.uid(), 'admin.config')
    OR usuario_tem_permissao(auth.uid(), 'rh.folha.gerenciar')
    OR usuario_eh_super_admin(auth.uid())
  );

CREATE POLICY "config_regras_calculo_update" ON public.config_regras_calculo
  FOR UPDATE USING (
    usuario_tem_permissao(auth.uid(), 'admin.config')
    OR usuario_tem_permissao(auth.uid(), 'rh.folha.gerenciar')
    OR usuario_eh_super_admin(auth.uid())
  );

CREATE POLICY "config_regras_calculo_delete" ON public.config_regras_calculo
  FOR DELETE USING (usuario_eh_super_admin(auth.uid()));

-- config_fechamento_folha
CREATE POLICY "config_fechamento_folha_select" ON public.config_fechamento_folha
  FOR SELECT USING (
    ativo = true 
    OR usuario_tem_permissao(auth.uid(), 'rh.folha.gerenciar')
    OR usuario_tem_permissao(auth.uid(), 'admin.config')
    OR usuario_eh_super_admin(auth.uid())
  );

CREATE POLICY "config_fechamento_folha_insert" ON public.config_fechamento_folha
  FOR INSERT WITH CHECK (
    usuario_tem_permissao(auth.uid(), 'admin.config')
    OR usuario_tem_permissao(auth.uid(), 'rh.folha.gerenciar')
    OR usuario_eh_super_admin(auth.uid())
  );

CREATE POLICY "config_fechamento_folha_update" ON public.config_fechamento_folha
  FOR UPDATE USING (
    usuario_tem_permissao(auth.uid(), 'admin.config')
    OR usuario_tem_permissao(auth.uid(), 'rh.folha.gerenciar')
    OR usuario_eh_super_admin(auth.uid())
  );

CREATE POLICY "config_fechamento_folha_delete" ON public.config_fechamento_folha
  FOR DELETE USING (usuario_eh_super_admin(auth.uid()));

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_config_tipos_rubrica_instituicao ON public.config_tipos_rubrica(instituicao_id);
CREATE INDEX IF NOT EXISTS idx_config_tipos_rubrica_codigo ON public.config_tipos_rubrica(codigo);
CREATE INDEX IF NOT EXISTS idx_config_tipos_rubrica_natureza ON public.config_tipos_rubrica(natureza);

CREATE INDEX IF NOT EXISTS idx_config_rubricas_instituicao ON public.config_rubricas(instituicao_id);
CREATE INDEX IF NOT EXISTS idx_config_rubricas_codigo ON public.config_rubricas(codigo);
CREATE INDEX IF NOT EXISTS idx_config_rubricas_tipo ON public.config_rubricas(tipo_rubrica_id);
CREATE INDEX IF NOT EXISTS idx_config_rubricas_natureza ON public.config_rubricas(natureza);
CREATE INDEX IF NOT EXISTS idx_config_rubricas_vigencia ON public.config_rubricas(vigencia_inicio, vigencia_fim);
CREATE INDEX IF NOT EXISTS idx_config_rubricas_ativo ON public.config_rubricas(ativo);

CREATE INDEX IF NOT EXISTS idx_config_incidencias_origem ON public.config_incidencias(rubrica_origem_id);
CREATE INDEX IF NOT EXISTS idx_config_incidencias_destino ON public.config_incidencias(rubrica_destino_id);

CREATE INDEX IF NOT EXISTS idx_config_regras_instituicao ON public.config_regras_calculo(instituicao_id);
CREATE INDEX IF NOT EXISTS idx_config_regras_codigo ON public.config_regras_calculo(codigo);
CREATE INDEX IF NOT EXISTS idx_config_regras_escopo ON public.config_regras_calculo(escopo);
CREATE INDEX IF NOT EXISTS idx_config_regras_tipo ON public.config_regras_calculo(tipo_regra);

CREATE INDEX IF NOT EXISTS idx_config_fechamento_instituicao ON public.config_fechamento_folha(instituicao_id);
CREATE INDEX IF NOT EXISTS idx_config_fechamento_padrao ON public.config_fechamento_folha(padrao);