
-- ============================================
-- MIGRAÇÃO: CAMADA DE CONFIGURAÇÃO DE FREQUÊNCIA
-- Adiciona instituicao_id e melhora RLS
-- Data: 02/02/2026
-- ============================================

-- ============================================
-- 1. ADICIONAR instituicao_id ÀS TABELAS DE CONFIG
-- ============================================

-- 1.1 config_jornada_padrao
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'config_jornada_padrao' 
    AND column_name = 'instituicao_id'
  ) THEN
    ALTER TABLE public.config_jornada_padrao 
    ADD COLUMN instituicao_id uuid REFERENCES public.config_institucional(id);
  END IF;
END $$;

-- 1.2 regimes_trabalho
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'regimes_trabalho' 
    AND column_name = 'instituicao_id'
  ) THEN
    ALTER TABLE public.regimes_trabalho 
    ADD COLUMN instituicao_id uuid REFERENCES public.config_institucional(id);
  END IF;
END $$;

-- 1.3 tipos_abono
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tipos_abono' 
    AND column_name = 'instituicao_id'
  ) THEN
    ALTER TABLE public.tipos_abono 
    ADD COLUMN instituicao_id uuid REFERENCES public.config_institucional(id);
  END IF;
END $$;

-- 1.4 config_compensacao
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'config_compensacao' 
    AND column_name = 'instituicao_id'
  ) THEN
    ALTER TABLE public.config_compensacao 
    ADD COLUMN instituicao_id uuid REFERENCES public.config_institucional(id);
  END IF;
END $$;

-- 1.5 config_fechamento_frequencia
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'config_fechamento_frequencia' 
    AND column_name = 'instituicao_id'
  ) THEN
    ALTER TABLE public.config_fechamento_frequencia 
    ADD COLUMN instituicao_id uuid REFERENCES public.config_institucional(id);
  END IF;
END $$;

-- 1.6 config_assinatura_frequencia
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'config_assinatura_frequencia' 
    AND column_name = 'instituicao_id'
  ) THEN
    ALTER TABLE public.config_assinatura_frequencia 
    ADD COLUMN instituicao_id uuid REFERENCES public.config_institucional(id);
  END IF;
END $$;

-- 1.7 dias_nao_uteis
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'dias_nao_uteis' 
    AND column_name = 'instituicao_id'
  ) THEN
    ALTER TABLE public.dias_nao_uteis 
    ADD COLUMN instituicao_id uuid REFERENCES public.config_institucional(id);
  END IF;
END $$;

-- ============================================
-- 2. ATUALIZAR REGISTROS EXISTENTES COM IDJUV
-- ============================================

-- Atualizar registros existentes para vincular ao IDJUV
UPDATE public.config_jornada_padrao 
SET instituicao_id = (SELECT id FROM public.config_institucional WHERE codigo = 'IDJUV')
WHERE instituicao_id IS NULL;

UPDATE public.regimes_trabalho 
SET instituicao_id = (SELECT id FROM public.config_institucional WHERE codigo = 'IDJUV')
WHERE instituicao_id IS NULL;

UPDATE public.tipos_abono 
SET instituicao_id = (SELECT id FROM public.config_institucional WHERE codigo = 'IDJUV')
WHERE instituicao_id IS NULL;

UPDATE public.config_compensacao 
SET instituicao_id = (SELECT id FROM public.config_institucional WHERE codigo = 'IDJUV')
WHERE instituicao_id IS NULL;

UPDATE public.config_fechamento_frequencia 
SET instituicao_id = (SELECT id FROM public.config_institucional WHERE codigo = 'IDJUV')
WHERE instituicao_id IS NULL;

UPDATE public.config_assinatura_frequencia 
SET instituicao_id = (SELECT id FROM public.config_institucional WHERE codigo = 'IDJUV')
WHERE instituicao_id IS NULL;

UPDATE public.dias_nao_uteis 
SET instituicao_id = (SELECT id FROM public.config_institucional WHERE codigo = 'IDJUV')
WHERE instituicao_id IS NULL;

-- ============================================
-- 3. CRIAR ÍNDICES PARA instituicao_id
-- ============================================

CREATE INDEX IF NOT EXISTS idx_config_jornada_padrao_instituicao 
ON public.config_jornada_padrao(instituicao_id);

CREATE INDEX IF NOT EXISTS idx_regimes_trabalho_instituicao 
ON public.regimes_trabalho(instituicao_id);

CREATE INDEX IF NOT EXISTS idx_tipos_abono_instituicao 
ON public.tipos_abono(instituicao_id);

CREATE INDEX IF NOT EXISTS idx_config_compensacao_instituicao 
ON public.config_compensacao(instituicao_id);

CREATE INDEX IF NOT EXISTS idx_config_fechamento_frequencia_instituicao 
ON public.config_fechamento_frequencia(instituicao_id);

CREATE INDEX IF NOT EXISTS idx_config_assinatura_frequencia_instituicao 
ON public.config_assinatura_frequencia(instituicao_id);

CREATE INDEX IF NOT EXISTS idx_dias_nao_uteis_instituicao 
ON public.dias_nao_uteis(instituicao_id);

-- ============================================
-- 4. REFORÇAR RLS COM admin.config
-- ============================================

-- 4.1 config_jornada_padrao
DROP POLICY IF EXISTS config_jornada_padrao_insert ON public.config_jornada_padrao;
DROP POLICY IF EXISTS config_jornada_padrao_update ON public.config_jornada_padrao;

CREATE POLICY config_jornada_padrao_insert ON public.config_jornada_padrao
FOR INSERT TO authenticated
WITH CHECK (
  public.usuario_tem_permissao(auth.uid(), 'admin.config') 
  OR public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.configurar')
  OR public.usuario_eh_super_admin(auth.uid())
);

CREATE POLICY config_jornada_padrao_update ON public.config_jornada_padrao
FOR UPDATE TO authenticated
USING (
  public.usuario_tem_permissao(auth.uid(), 'admin.config') 
  OR public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.configurar')
  OR public.usuario_eh_super_admin(auth.uid())
)
WITH CHECK (
  public.usuario_tem_permissao(auth.uid(), 'admin.config') 
  OR public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.configurar')
  OR public.usuario_eh_super_admin(auth.uid())
);

-- 4.2 regimes_trabalho
DROP POLICY IF EXISTS regimes_trabalho_insert ON public.regimes_trabalho;
DROP POLICY IF EXISTS regimes_trabalho_update ON public.regimes_trabalho;

CREATE POLICY regimes_trabalho_insert ON public.regimes_trabalho
FOR INSERT TO authenticated
WITH CHECK (
  public.usuario_tem_permissao(auth.uid(), 'admin.config') 
  OR public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.configurar')
  OR public.usuario_eh_super_admin(auth.uid())
);

CREATE POLICY regimes_trabalho_update ON public.regimes_trabalho
FOR UPDATE TO authenticated
USING (
  public.usuario_tem_permissao(auth.uid(), 'admin.config') 
  OR public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.configurar')
  OR public.usuario_eh_super_admin(auth.uid())
)
WITH CHECK (
  public.usuario_tem_permissao(auth.uid(), 'admin.config') 
  OR public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.configurar')
  OR public.usuario_eh_super_admin(auth.uid())
);

-- 4.3 tipos_abono
DROP POLICY IF EXISTS tipos_abono_insert ON public.tipos_abono;
DROP POLICY IF EXISTS tipos_abono_update ON public.tipos_abono;

CREATE POLICY tipos_abono_insert ON public.tipos_abono
FOR INSERT TO authenticated
WITH CHECK (
  public.usuario_tem_permissao(auth.uid(), 'admin.config') 
  OR public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.configurar')
  OR public.usuario_eh_super_admin(auth.uid())
);

CREATE POLICY tipos_abono_update ON public.tipos_abono
FOR UPDATE TO authenticated
USING (
  public.usuario_tem_permissao(auth.uid(), 'admin.config') 
  OR public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.configurar')
  OR public.usuario_eh_super_admin(auth.uid())
)
WITH CHECK (
  public.usuario_tem_permissao(auth.uid(), 'admin.config') 
  OR public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.configurar')
  OR public.usuario_eh_super_admin(auth.uid())
);

-- 4.4 config_compensacao
DROP POLICY IF EXISTS config_compensacao_insert ON public.config_compensacao;
DROP POLICY IF EXISTS config_compensacao_update ON public.config_compensacao;

CREATE POLICY config_compensacao_insert ON public.config_compensacao
FOR INSERT TO authenticated
WITH CHECK (
  public.usuario_tem_permissao(auth.uid(), 'admin.config') 
  OR public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.configurar')
  OR public.usuario_eh_super_admin(auth.uid())
);

CREATE POLICY config_compensacao_update ON public.config_compensacao
FOR UPDATE TO authenticated
USING (
  public.usuario_tem_permissao(auth.uid(), 'admin.config') 
  OR public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.configurar')
  OR public.usuario_eh_super_admin(auth.uid())
)
WITH CHECK (
  public.usuario_tem_permissao(auth.uid(), 'admin.config') 
  OR public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.configurar')
  OR public.usuario_eh_super_admin(auth.uid())
);

-- 4.5 config_fechamento_frequencia
DROP POLICY IF EXISTS config_fechamento_insert ON public.config_fechamento_frequencia;
DROP POLICY IF EXISTS config_fechamento_update ON public.config_fechamento_frequencia;

CREATE POLICY config_fechamento_insert ON public.config_fechamento_frequencia
FOR INSERT TO authenticated
WITH CHECK (
  public.usuario_tem_permissao(auth.uid(), 'admin.config') 
  OR public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.configurar')
  OR public.usuario_eh_super_admin(auth.uid())
);

CREATE POLICY config_fechamento_update ON public.config_fechamento_frequencia
FOR UPDATE TO authenticated
USING (
  public.usuario_tem_permissao(auth.uid(), 'admin.config') 
  OR public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.configurar')
  OR public.usuario_eh_super_admin(auth.uid())
)
WITH CHECK (
  public.usuario_tem_permissao(auth.uid(), 'admin.config') 
  OR public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.configurar')
  OR public.usuario_eh_super_admin(auth.uid())
);

-- ============================================
-- 5. ADICIONAR CAMPO codigo A TABELAS QUE NÃO TÊM
-- ============================================

-- Verificar e adicionar 'codigo' a config_compensacao se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'config_compensacao' 
    AND column_name = 'codigo'
  ) THEN
    ALTER TABLE public.config_compensacao 
    ADD COLUMN codigo varchar(50);
  END IF;
END $$;

-- Verificar e adicionar 'codigo' a config_assinatura_frequencia se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'config_assinatura_frequencia' 
    AND column_name = 'codigo'
  ) THEN
    ALTER TABLE public.config_assinatura_frequencia 
    ADD COLUMN codigo varchar(50);
  END IF;
END $$;

-- ============================================
-- 6. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ============================================

COMMENT ON TABLE public.config_jornada_padrao IS 'Configurações de jornada de trabalho por instituição, unidade, cargo ou servidor';
COMMENT ON TABLE public.regimes_trabalho IS 'Regimes de trabalho (presencial, teletrabalho, híbrido, etc.)';
COMMENT ON TABLE public.tipos_abono IS 'Tipos de abono permitidos (atestado, licença, etc.)';
COMMENT ON TABLE public.config_compensacao IS 'Regras de compensação de horas e banco de horas';
COMMENT ON TABLE public.config_fechamento_frequencia IS 'Configurações de fechamento mensal de frequência';
COMMENT ON TABLE public.config_assinatura_frequencia IS 'Configurações de assinatura de folha de frequência';
COMMENT ON TABLE public.dias_nao_uteis IS 'Calendário de feriados e dias não úteis';
