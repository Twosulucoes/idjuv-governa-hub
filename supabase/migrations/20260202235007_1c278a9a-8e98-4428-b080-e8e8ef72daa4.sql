
-- ============================================================================
-- MIGRAÇÃO: Tabelas de Configuração de Vida Funcional
-- Versão: 1.0.0 | Data: 2026-02-02
-- Objetivo: Migrar hardcodes de tipos/labels/regras para tabelas configuráveis
-- ============================================================================

-- ============================================================================
-- 1️⃣ TABELA: config_tipos_servidor
-- Substitui: TIPO_SERVIDOR_LABELS, TIPO_SERVIDOR_COLORS, REGRAS_TIPO_SERVIDOR
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.config_tipos_servidor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao_id UUID NOT NULL REFERENCES public.config_institucional(id),
  
  -- Identificação
  codigo VARCHAR(50) NOT NULL,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  
  -- Visual
  cor_classe VARCHAR(100) DEFAULT 'bg-muted text-muted-foreground border-muted',
  icone VARCHAR(50),
  
  -- Regras de negócio (migrado de REGRAS_TIPO_SERVIDOR)
  permite_cargo BOOLEAN NOT NULL DEFAULT true,
  tipos_cargo_permitidos VARCHAR(50)[] DEFAULT '{}',
  permite_lotacao_interna BOOLEAN NOT NULL DEFAULT true,
  permite_lotacao_externa BOOLEAN NOT NULL DEFAULT false,
  requer_provimento BOOLEAN NOT NULL DEFAULT true,
  requer_orgao_origem BOOLEAN NOT NULL DEFAULT false,
  requer_orgao_destino BOOLEAN NOT NULL DEFAULT false,
  
  -- Impactos em outros módulos
  impacta_folha BOOLEAN NOT NULL DEFAULT true,
  impacta_frequencia BOOLEAN NOT NULL DEFAULT true,
  gera_matricula BOOLEAN NOT NULL DEFAULT true,
  
  -- Controle
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  vigencia_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  vigencia_fim DATE,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT chk_tipos_servidor_vigencia CHECK (vigencia_fim IS NULL OR vigencia_fim >= vigencia_inicio),
  CONSTRAINT uq_tipos_servidor_codigo UNIQUE (instituicao_id, codigo)
);

COMMENT ON TABLE config_tipos_servidor IS 
  'Configuração dos tipos de servidor com labels, cores e regras de negócio por instituição';

-- Índices
CREATE INDEX IF NOT EXISTS idx_config_tipos_servidor_instituicao 
  ON public.config_tipos_servidor(instituicao_id);
CREATE INDEX IF NOT EXISTS idx_config_tipos_servidor_codigo 
  ON public.config_tipos_servidor(codigo);
CREATE INDEX IF NOT EXISTS idx_config_tipos_servidor_ativo 
  ON public.config_tipos_servidor(ativo) WHERE ativo = true;

-- ============================================================================
-- 2️⃣ TABELA: config_situacoes_funcionais
-- Substitui: SITUACAO_LABELS, SITUACAO_COLORS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.config_situacoes_funcionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao_id UUID NOT NULL REFERENCES public.config_institucional(id),
  
  -- Identificação
  codigo VARCHAR(50) NOT NULL,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  
  -- Visual
  cor_classe VARCHAR(100) DEFAULT 'bg-muted text-muted-foreground border-muted',
  icone VARCHAR(50),
  
  -- Regras
  permite_trabalho BOOLEAN NOT NULL DEFAULT true,
  permite_remuneracao BOOLEAN NOT NULL DEFAULT true,
  exige_documento BOOLEAN NOT NULL DEFAULT false,
  situacao_final BOOLEAN NOT NULL DEFAULT false,
  
  -- Controle
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT uq_situacoes_funcionais_codigo UNIQUE (instituicao_id, codigo)
);

COMMENT ON TABLE config_situacoes_funcionais IS 
  'Configuração das situações funcionais com labels, cores e regras por instituição';

CREATE INDEX IF NOT EXISTS idx_config_situacoes_funcionais_instituicao 
  ON public.config_situacoes_funcionais(instituicao_id);
CREATE INDEX IF NOT EXISTS idx_config_situacoes_funcionais_ativo 
  ON public.config_situacoes_funcionais(ativo) WHERE ativo = true;

-- ============================================================================
-- 3️⃣ TABELA: config_motivos_desligamento
-- Substitui: MOTIVOS_ENCERRAMENTO
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.config_motivos_desligamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao_id UUID NOT NULL REFERENCES public.config_institucional(id),
  
  -- Identificação
  codigo VARCHAR(50) NOT NULL,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  
  -- Regras
  aplica_efetivo BOOLEAN NOT NULL DEFAULT true,
  aplica_comissionado BOOLEAN NOT NULL DEFAULT true,
  aplica_cedido BOOLEAN NOT NULL DEFAULT true,
  gera_vacancia BOOLEAN NOT NULL DEFAULT true,
  requer_portaria BOOLEAN NOT NULL DEFAULT true,
  requer_doe BOOLEAN NOT NULL DEFAULT false,
  
  -- Controle
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT uq_motivos_desligamento_codigo UNIQUE (instituicao_id, codigo)
);

COMMENT ON TABLE config_motivos_desligamento IS 
  'Configuração dos motivos de desligamento/encerramento de provimento por instituição';

CREATE INDEX IF NOT EXISTS idx_config_motivos_desligamento_instituicao 
  ON public.config_motivos_desligamento(instituicao_id);

-- ============================================================================
-- 4️⃣ TABELA: config_tipos_ato
-- Substitui: TIPOS_ATO
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.config_tipos_ato (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao_id UUID NOT NULL REFERENCES public.config_institucional(id),
  
  -- Identificação
  codigo VARCHAR(50) NOT NULL,
  nome VARCHAR(100) NOT NULL,
  sigla VARCHAR(20),
  descricao TEXT,
  
  -- Regras
  requer_doe BOOLEAN NOT NULL DEFAULT true,
  requer_assinatura BOOLEAN NOT NULL DEFAULT true,
  
  -- Controle
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT uq_tipos_ato_codigo UNIQUE (instituicao_id, codigo)
);

COMMENT ON TABLE config_tipos_ato IS 
  'Configuração dos tipos de ato administrativo por instituição';

CREATE INDEX IF NOT EXISTS idx_config_tipos_ato_instituicao 
  ON public.config_tipos_ato(instituicao_id);

-- ============================================================================
-- 5️⃣ TABELA: config_tipos_onus
-- Substitui: TIPOS_ONUS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.config_tipos_onus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao_id UUID NOT NULL REFERENCES public.config_institucional(id),
  
  -- Identificação
  codigo VARCHAR(50) NOT NULL,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  
  -- Controle
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT uq_tipos_onus_codigo UNIQUE (instituicao_id, codigo)
);

COMMENT ON TABLE config_tipos_onus IS 
  'Configuração dos tipos de ônus para cessões por instituição';

-- ============================================================================
-- 6️⃣ HABILITAR RLS EM TODAS AS TABELAS
-- ============================================================================

ALTER TABLE public.config_tipos_servidor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_tipos_servidor FORCE ROW LEVEL SECURITY;

ALTER TABLE public.config_situacoes_funcionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_situacoes_funcionais FORCE ROW LEVEL SECURITY;

ALTER TABLE public.config_motivos_desligamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_motivos_desligamento FORCE ROW LEVEL SECURITY;

ALTER TABLE public.config_tipos_ato ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_tipos_ato FORCE ROW LEVEL SECURITY;

ALTER TABLE public.config_tipos_onus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_tipos_onus FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- 7️⃣ POLÍTICAS DE RLS (Padrão: admin.config ou rh.vidafuncional)
-- ============================================================================

-- config_tipos_servidor
CREATE POLICY "config_tipos_servidor_select" ON public.config_tipos_servidor
FOR SELECT TO authenticated
USING (
  usuario_eh_admin(auth.uid()) 
  OR usuario_tem_permissao(auth.uid(), 'admin.config')
  OR usuario_tem_permissao(auth.uid(), 'rh.vidafuncional')
);

CREATE POLICY "config_tipos_servidor_write" ON public.config_tipos_servidor
FOR ALL TO authenticated
USING (usuario_eh_admin(auth.uid()) OR usuario_tem_permissao(auth.uid(), 'admin.config'))
WITH CHECK (usuario_eh_admin(auth.uid()) OR usuario_tem_permissao(auth.uid(), 'admin.config'));

-- config_situacoes_funcionais
CREATE POLICY "config_situacoes_funcionais_select" ON public.config_situacoes_funcionais
FOR SELECT TO authenticated
USING (
  usuario_eh_admin(auth.uid()) 
  OR usuario_tem_permissao(auth.uid(), 'admin.config')
  OR usuario_tem_permissao(auth.uid(), 'rh.vidafuncional')
);

CREATE POLICY "config_situacoes_funcionais_write" ON public.config_situacoes_funcionais
FOR ALL TO authenticated
USING (usuario_eh_admin(auth.uid()) OR usuario_tem_permissao(auth.uid(), 'admin.config'))
WITH CHECK (usuario_eh_admin(auth.uid()) OR usuario_tem_permissao(auth.uid(), 'admin.config'));

-- config_motivos_desligamento
CREATE POLICY "config_motivos_desligamento_select" ON public.config_motivos_desligamento
FOR SELECT TO authenticated
USING (
  usuario_eh_admin(auth.uid()) 
  OR usuario_tem_permissao(auth.uid(), 'admin.config')
  OR usuario_tem_permissao(auth.uid(), 'rh.vidafuncional')
);

CREATE POLICY "config_motivos_desligamento_write" ON public.config_motivos_desligamento
FOR ALL TO authenticated
USING (usuario_eh_admin(auth.uid()) OR usuario_tem_permissao(auth.uid(), 'admin.config'))
WITH CHECK (usuario_eh_admin(auth.uid()) OR usuario_tem_permissao(auth.uid(), 'admin.config'));

-- config_tipos_ato
CREATE POLICY "config_tipos_ato_select" ON public.config_tipos_ato
FOR SELECT TO authenticated
USING (
  usuario_eh_admin(auth.uid()) 
  OR usuario_tem_permissao(auth.uid(), 'admin.config')
  OR usuario_tem_permissao(auth.uid(), 'rh.vidafuncional')
);

CREATE POLICY "config_tipos_ato_write" ON public.config_tipos_ato
FOR ALL TO authenticated
USING (usuario_eh_admin(auth.uid()) OR usuario_tem_permissao(auth.uid(), 'admin.config'))
WITH CHECK (usuario_eh_admin(auth.uid()) OR usuario_tem_permissao(auth.uid(), 'admin.config'));

-- config_tipos_onus
CREATE POLICY "config_tipos_onus_select" ON public.config_tipos_onus
FOR SELECT TO authenticated
USING (
  usuario_eh_admin(auth.uid()) 
  OR usuario_tem_permissao(auth.uid(), 'admin.config')
  OR usuario_tem_permissao(auth.uid(), 'rh.vidafuncional')
);

CREATE POLICY "config_tipos_onus_write" ON public.config_tipos_onus
FOR ALL TO authenticated
USING (usuario_eh_admin(auth.uid()) OR usuario_tem_permissao(auth.uid(), 'admin.config'))
WITH CHECK (usuario_eh_admin(auth.uid()) OR usuario_tem_permissao(auth.uid(), 'admin.config'));

-- ============================================================================
-- 8️⃣ TRIGGERS DE UPDATED_AT
-- ============================================================================

CREATE TRIGGER trg_config_tipos_servidor_updated_at
  BEFORE UPDATE ON public.config_tipos_servidor
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp_parametros();

CREATE TRIGGER trg_config_situacoes_funcionais_updated_at
  BEFORE UPDATE ON public.config_situacoes_funcionais
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp_parametros();

CREATE TRIGGER trg_config_motivos_desligamento_updated_at
  BEFORE UPDATE ON public.config_motivos_desligamento
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp_parametros();

CREATE TRIGGER trg_config_tipos_ato_updated_at
  BEFORE UPDATE ON public.config_tipos_ato
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp_parametros();

-- ============================================================================
-- FIM DA MIGRAÇÃO
-- ============================================================================
