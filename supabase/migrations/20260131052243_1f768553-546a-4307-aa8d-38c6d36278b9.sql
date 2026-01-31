-- ============================================================
-- MÓDULO FREQUÊNCIA: PARAMETRIZAÇÕES INSTITUCIONAIS
-- Sistema robusto, auditável e juridicamente seguro
-- ============================================================

-- =============================================
-- 1. TABELA: CONFIGURAÇÃO DE JORNADA (POR UNIDADE/CARGO)
-- =============================================
CREATE TABLE IF NOT EXISTS public.config_jornada_padrao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  
  -- Carga horária
  carga_horaria_diaria NUMERIC(4,2) NOT NULL DEFAULT 8,
  carga_horaria_semanal NUMERIC(5,2) NOT NULL DEFAULT 40,
  
  -- Horários padrão
  entrada_manha TIME,
  saida_manha TIME,
  entrada_tarde TIME,
  saida_tarde TIME,
  
  -- Intervalo intrajornada
  intervalo_minimo INTEGER DEFAULT 60,
  intervalo_maximo INTEGER DEFAULT 120,
  intervalo_obrigatorio BOOLEAN DEFAULT true,
  intervalo_remunerado BOOLEAN DEFAULT false,
  
  -- Tolerâncias
  tolerancia_atraso INTEGER DEFAULT 10,
  tolerancia_saida_antecipada INTEGER DEFAULT 10,
  tolerancia_intervalo INTEGER DEFAULT 5,
  banco_tolerancia_diario BOOLEAN DEFAULT false,
  banco_tolerancia_mensal BOOLEAN DEFAULT true,
  
  -- Escopo de aplicação
  escopo VARCHAR(20) DEFAULT 'orgao' CHECK (escopo IN ('orgao', 'unidade', 'cargo', 'servidor')),
  unidade_id UUID REFERENCES public.estrutura_organizacional(id),
  cargo_id UUID REFERENCES public.cargos(id),
  servidor_id UUID REFERENCES public.servidores(id),
  
  -- Metadados
  ativo BOOLEAN DEFAULT true,
  padrao BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- =============================================
-- 2. TABELA: REGIMES DE TRABALHO
-- =============================================
CREATE TABLE IF NOT EXISTS public.regimes_trabalho (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(20) NOT NULL UNIQUE,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('presencial', 'teletrabalho', 'hibrido', 'plantao', 'escala')),
  padrao_escala VARCHAR(20),
  dias_trabalho INTEGER[] DEFAULT ARRAY[1,2,3,4,5],
  exige_registro_ponto BOOLEAN DEFAULT true,
  exige_assinatura_servidor BOOLEAN DEFAULT true,
  exige_validacao_chefia BOOLEAN DEFAULT true,
  permite_ponto_remoto BOOLEAN DEFAULT false,
  exige_localizacao BOOLEAN DEFAULT false,
  exige_foto BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- =============================================
-- 3. TABELA: DIAS NÃO ÚTEIS INSTITUCIONAIS
-- =============================================
CREATE TABLE IF NOT EXISTS public.dias_nao_uteis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  nome VARCHAR(200) NOT NULL,
  tipo VARCHAR(30) NOT NULL CHECK (tipo IN (
    'feriado_nacional', 'feriado_estadual', 'feriado_municipal',
    'ponto_facultativo', 'recesso', 'suspensao_expediente', 'expediente_reduzido'
  )),
  conta_frequencia BOOLEAN DEFAULT false,
  exige_compensacao BOOLEAN DEFAULT false,
  horas_expediente NUMERIC(4,2),
  recorrente BOOLEAN DEFAULT false,
  mes_recorrente INTEGER,
  dia_recorrente INTEGER,
  abrangencia VARCHAR(20) DEFAULT 'todas' CHECK (abrangencia IN ('todas', 'especifica')),
  unidades_aplicaveis UUID[],
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  observacao TEXT
);

-- =============================================
-- 4. TABELA: TIPOS DE ABONO/JUSTIFICATIVA
-- =============================================
CREATE TABLE IF NOT EXISTS public.tipos_abono (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(20) NOT NULL UNIQUE,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  conta_como_presenca BOOLEAN DEFAULT true,
  exige_documento BOOLEAN DEFAULT false,
  exige_aprovacao_chefia BOOLEAN DEFAULT true,
  exige_aprovacao_rh BOOLEAN DEFAULT false,
  impacto_horas VARCHAR(20) DEFAULT 'neutro' CHECK (impacto_horas IN ('neutro', 'reduz', 'compensa')),
  max_horas_dia NUMERIC(4,2),
  max_ocorrencias_mes INTEGER,
  tipos_documento_aceitos TEXT[],
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- 5. TABELA: CONFIGURAÇÃO DE COMPENSAÇÃO DE HORAS
-- =============================================
CREATE TABLE IF NOT EXISTS public.config_compensacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL,
  permite_banco_horas BOOLEAN DEFAULT true,
  compensacao_automatica BOOLEAN DEFAULT false,
  compensacao_manual BOOLEAN DEFAULT true,
  prazo_compensar_dias INTEGER DEFAULT 90,
  limite_acumulo_horas NUMERIC(6,2) DEFAULT 40,
  limite_horas_extras_dia NUMERIC(4,2) DEFAULT 2,
  limite_horas_extras_mes NUMERIC(5,2) DEFAULT 40,
  quem_autoriza VARCHAR(30) DEFAULT 'chefia' CHECK (quem_autoriza IN ('chefia', 'rh', 'ambos')),
  exibe_na_frequencia BOOLEAN DEFAULT true,
  exibe_na_impressao BOOLEAN DEFAULT true,
  aplicar_a_todos BOOLEAN DEFAULT true,
  unidade_id UUID REFERENCES public.estrutura_organizacional(id),
  ativo BOOLEAN DEFAULT true,
  padrao BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- =============================================
-- 6. TABELA: CONFIGURAÇÃO DE FECHAMENTO
-- =============================================
CREATE TABLE IF NOT EXISTS public.config_fechamento_frequencia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  data_limite_servidor DATE,
  data_limite_chefia DATE,
  data_limite_rh DATE,
  status VARCHAR(20) DEFAULT 'aberto' CHECK (status IN ('aberto', 'fechado_servidor', 'fechado_chefia', 'consolidado')),
  permite_reabertura BOOLEAN DEFAULT true,
  prazo_reabertura_dias INTEGER DEFAULT 5,
  reabertura_exige_justificativa BOOLEAN DEFAULT true,
  servidor_pode_fechar BOOLEAN DEFAULT true,
  chefia_pode_fechar BOOLEAN DEFAULT true,
  rh_pode_fechar BOOLEAN DEFAULT true,
  fechado_em TIMESTAMPTZ,
  fechado_por UUID REFERENCES auth.users(id),
  consolidado_em TIMESTAMPTZ,
  consolidado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ano, mes)
);

-- =============================================
-- 7. TABELA: CONFIGURAÇÃO DE ASSINATURAS
-- =============================================
CREATE TABLE IF NOT EXISTS public.config_assinatura_frequencia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL,
  assinatura_servidor_obrigatoria BOOLEAN DEFAULT true,
  assinatura_chefia_obrigatoria BOOLEAN DEFAULT true,
  assinatura_rh_obrigatoria BOOLEAN DEFAULT false,
  tipo_assinatura VARCHAR(20) DEFAULT 'digital' CHECK (tipo_assinatura IN ('manual', 'digital', 'ambas')),
  ordem_assinaturas TEXT[] DEFAULT ARRAY['servidor', 'chefia'],
  quem_valida_final VARCHAR(20) DEFAULT 'chefia' CHECK (quem_valida_final IN ('servidor', 'chefia', 'rh')),
  texto_declaracao TEXT DEFAULT 'Declaro que as informações acima são verídicas e correspondem à minha efetiva jornada de trabalho no período.',
  ativo BOOLEAN DEFAULT true,
  padrao BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- 8. TABELA: SOLICITAÇÕES DE ABONO (WORKFLOW)
-- =============================================
CREATE TABLE IF NOT EXISTS public.solicitacoes_abono (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL REFERENCES public.servidores(id),
  tipo_abono_id UUID NOT NULL REFERENCES public.tipos_abono(id),
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  hora_inicio TIME,
  hora_fim TIME,
  justificativa TEXT NOT NULL,
  documento_url TEXT,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado_chefia', 'aprovado_rh', 'aprovado', 'rejeitado', 'cancelado')),
  aprovado_chefia_por UUID REFERENCES auth.users(id),
  aprovado_chefia_em TIMESTAMPTZ,
  aprovado_rh_por UUID REFERENCES auth.users(id),
  aprovado_rh_em TIMESTAMPTZ,
  motivo_rejeicao TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- =============================================
-- 9. TABELA: FECHAMENTO INDIVIDUAL (POR SERVIDOR)
-- =============================================
CREATE TABLE IF NOT EXISTS public.frequencia_fechamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL REFERENCES public.servidores(id),
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  assinado_servidor BOOLEAN DEFAULT false,
  assinado_servidor_em TIMESTAMPTZ,
  validado_chefia BOOLEAN DEFAULT false,
  validado_chefia_por UUID REFERENCES auth.users(id),
  validado_chefia_em TIMESTAMPTZ,
  consolidado_rh BOOLEAN DEFAULT false,
  consolidado_rh_por UUID REFERENCES auth.users(id),
  consolidado_rh_em TIMESTAMPTZ,
  reaberto BOOLEAN DEFAULT false,
  reaberto_por UUID REFERENCES auth.users(id),
  reaberto_em TIMESTAMPTZ,
  justificativa_reabertura TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(servidor_id, ano, mes)
);

-- =============================================
-- 10. TABELA: REGIME POR SERVIDOR
-- =============================================
CREATE TABLE IF NOT EXISTS public.servidor_regime (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL REFERENCES public.servidores(id),
  regime_id UUID NOT NULL REFERENCES public.regimes_trabalho(id),
  jornada_id UUID REFERENCES public.config_jornada_padrao(id),
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fim DATE,
  carga_horaria_customizada NUMERIC(5,2),
  dias_trabalho_customizados INTEGER[],
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(servidor_id, regime_id, data_inicio)
);

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_config_jornada_escopo ON public.config_jornada_padrao(escopo, ativo);
CREATE INDEX IF NOT EXISTS idx_config_jornada_unidade ON public.config_jornada_padrao(unidade_id) WHERE unidade_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dias_nao_uteis_data ON public.dias_nao_uteis(data, ativo);
CREATE INDEX IF NOT EXISTS idx_dias_nao_uteis_tipo ON public.dias_nao_uteis(tipo, ativo);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_abono_servidor ON public.solicitacoes_abono(servidor_id, status);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_abono_status ON public.solicitacoes_abono(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_frequencia_fechamento_competencia ON public.frequencia_fechamento(ano, mes);
CREATE INDEX IF NOT EXISTS idx_servidor_regime_ativo ON public.servidor_regime(servidor_id, ativo) WHERE ativo = true;

-- =============================================
-- HABILITAR RLS EM TODAS AS TABELAS
-- =============================================
ALTER TABLE public.config_jornada_padrao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regimes_trabalho ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dias_nao_uteis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipos_abono ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_compensacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_fechamento_frequencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_assinatura_frequencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacoes_abono ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frequencia_fechamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servidor_regime ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLÍTICAS RLS DENY-BY-DEFAULT (CORRIGIDAS)
-- =============================================

-- CONFIG_JORNADA_PADRAO
CREATE POLICY "config_jornada_padrao_select" ON public.config_jornada_padrao
  FOR SELECT TO authenticated
  USING (
    ativo = true
    OR public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.configurar')
    OR public.usuario_eh_super_admin(auth.uid())
  );

CREATE POLICY "config_jornada_padrao_insert" ON public.config_jornada_padrao
  FOR INSERT TO authenticated
  WITH CHECK (
    public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.configurar')
    OR public.usuario_eh_super_admin(auth.uid())
  );

CREATE POLICY "config_jornada_padrao_update" ON public.config_jornada_padrao
  FOR UPDATE TO authenticated
  USING (
    public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.configurar')
    OR public.usuario_eh_super_admin(auth.uid())
  );

CREATE POLICY "config_jornada_padrao_delete" ON public.config_jornada_padrao
  FOR DELETE TO authenticated
  USING (public.usuario_eh_super_admin(auth.uid()));

-- REGIMES_TRABALHO
CREATE POLICY "regimes_trabalho_select" ON public.regimes_trabalho
  FOR SELECT TO authenticated
  USING (ativo = true OR public.usuario_eh_super_admin(auth.uid()));

CREATE POLICY "regimes_trabalho_insert" ON public.regimes_trabalho
  FOR INSERT TO authenticated
  WITH CHECK (
    public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.configurar')
    OR public.usuario_eh_super_admin(auth.uid())
  );

CREATE POLICY "regimes_trabalho_update" ON public.regimes_trabalho
  FOR UPDATE TO authenticated
  USING (
    public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.configurar')
    OR public.usuario_eh_super_admin(auth.uid())
  );

CREATE POLICY "regimes_trabalho_delete" ON public.regimes_trabalho
  FOR DELETE TO authenticated
  USING (public.usuario_eh_super_admin(auth.uid()));

-- DIAS_NAO_UTEIS
CREATE POLICY "dias_nao_uteis_select" ON public.dias_nao_uteis
  FOR SELECT TO authenticated
  USING (ativo = true OR public.usuario_eh_super_admin(auth.uid()));

CREATE POLICY "dias_nao_uteis_insert" ON public.dias_nao_uteis
  FOR INSERT TO authenticated
  WITH CHECK (
    public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.configurar')
    OR public.usuario_eh_super_admin(auth.uid())
  );

CREATE POLICY "dias_nao_uteis_update" ON public.dias_nao_uteis
  FOR UPDATE TO authenticated
  USING (
    public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.configurar')
    OR public.usuario_eh_super_admin(auth.uid())
  );

CREATE POLICY "dias_nao_uteis_delete" ON public.dias_nao_uteis
  FOR DELETE TO authenticated
  USING (public.usuario_eh_super_admin(auth.uid()));

-- TIPOS_ABONO
CREATE POLICY "tipos_abono_select" ON public.tipos_abono
  FOR SELECT TO authenticated
  USING (ativo = true OR public.usuario_eh_super_admin(auth.uid()));

CREATE POLICY "tipos_abono_insert" ON public.tipos_abono
  FOR INSERT TO authenticated
  WITH CHECK (
    public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.configurar')
    OR public.usuario_eh_super_admin(auth.uid())
  );

CREATE POLICY "tipos_abono_update" ON public.tipos_abono
  FOR UPDATE TO authenticated
  USING (
    public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.configurar')
    OR public.usuario_eh_super_admin(auth.uid())
  );

CREATE POLICY "tipos_abono_delete" ON public.tipos_abono
  FOR DELETE TO authenticated
  USING (public.usuario_eh_super_admin(auth.uid()));

-- CONFIG_COMPENSACAO
CREATE POLICY "config_compensacao_select" ON public.config_compensacao
  FOR SELECT TO authenticated
  USING (ativo = true OR public.usuario_eh_super_admin(auth.uid()));

CREATE POLICY "config_compensacao_insert" ON public.config_compensacao
  FOR INSERT TO authenticated
  WITH CHECK (
    public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.configurar')
    OR public.usuario_eh_super_admin(auth.uid())
  );

CREATE POLICY "config_compensacao_update" ON public.config_compensacao
  FOR UPDATE TO authenticated
  USING (
    public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.configurar')
    OR public.usuario_eh_super_admin(auth.uid())
  );

CREATE POLICY "config_compensacao_delete" ON public.config_compensacao
  FOR DELETE TO authenticated
  USING (public.usuario_eh_super_admin(auth.uid()));

-- CONFIG_FECHAMENTO_FREQUENCIA
CREATE POLICY "config_fechamento_select" ON public.config_fechamento_frequencia
  FOR SELECT TO authenticated
  USING (
    public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.visualizar')
    OR public.usuario_eh_super_admin(auth.uid())
  );

CREATE POLICY "config_fechamento_insert" ON public.config_fechamento_frequencia
  FOR INSERT TO authenticated
  WITH CHECK (
    public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.configurar')
    OR public.usuario_eh_super_admin(auth.uid())
  );

CREATE POLICY "config_fechamento_update" ON public.config_fechamento_frequencia
  FOR UPDATE TO authenticated
  USING (
    public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.configurar')
    OR public.usuario_eh_super_admin(auth.uid())
  );

CREATE POLICY "config_fechamento_delete" ON public.config_fechamento_frequencia
  FOR DELETE TO authenticated
  USING (public.usuario_eh_super_admin(auth.uid()));

-- CONFIG_ASSINATURA_FREQUENCIA
CREATE POLICY "config_assinatura_freq_select" ON public.config_assinatura_frequencia
  FOR SELECT TO authenticated
  USING (ativo = true OR public.usuario_eh_super_admin(auth.uid()));

CREATE POLICY "config_assinatura_freq_insert" ON public.config_assinatura_frequencia
  FOR INSERT TO authenticated
  WITH CHECK (
    public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.configurar')
    OR public.usuario_eh_super_admin(auth.uid())
  );

CREATE POLICY "config_assinatura_freq_update" ON public.config_assinatura_frequencia
  FOR UPDATE TO authenticated
  USING (
    public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.configurar')
    OR public.usuario_eh_super_admin(auth.uid())
  );

CREATE POLICY "config_assinatura_freq_delete" ON public.config_assinatura_frequencia
  FOR DELETE TO authenticated
  USING (public.usuario_eh_super_admin(auth.uid()));

-- SOLICITACOES_ABONO
CREATE POLICY "solicitacoes_abono_select" ON public.solicitacoes_abono
  FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.visualizar')
    OR public.usuario_eh_super_admin(auth.uid())
  );

CREATE POLICY "solicitacoes_abono_insert" ON public.solicitacoes_abono
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    OR public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.lancar')
    OR public.usuario_eh_super_admin(auth.uid())
  );

CREATE POLICY "solicitacoes_abono_update" ON public.solicitacoes_abono
  FOR UPDATE TO authenticated
  USING (
    (created_by = auth.uid() AND status = 'pendente')
    OR public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.lancar')
    OR public.usuario_eh_super_admin(auth.uid())
  );

CREATE POLICY "solicitacoes_abono_delete" ON public.solicitacoes_abono
  FOR DELETE TO authenticated
  USING (
    (created_by = auth.uid() AND status = 'pendente')
    OR public.usuario_eh_super_admin(auth.uid())
  );

-- FREQUENCIA_FECHAMENTO
CREATE POLICY "frequencia_fechamento_select" ON public.frequencia_fechamento
  FOR SELECT TO authenticated
  USING (
    public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.visualizar')
    OR public.usuario_eh_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.servidores s
      JOIN public.profiles p ON p.servidor_id = s.id
      WHERE s.id = servidor_id AND p.id = auth.uid()
    )
  );

CREATE POLICY "frequencia_fechamento_insert" ON public.frequencia_fechamento
  FOR INSERT TO authenticated
  WITH CHECK (
    public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.lancar')
    OR public.usuario_eh_super_admin(auth.uid())
  );

CREATE POLICY "frequencia_fechamento_update" ON public.frequencia_fechamento
  FOR UPDATE TO authenticated
  USING (
    public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.lancar')
    OR public.usuario_eh_super_admin(auth.uid())
  );

CREATE POLICY "frequencia_fechamento_delete" ON public.frequencia_fechamento
  FOR DELETE TO authenticated
  USING (public.usuario_eh_super_admin(auth.uid()));

-- SERVIDOR_REGIME
CREATE POLICY "servidor_regime_select" ON public.servidor_regime
  FOR SELECT TO authenticated
  USING (
    public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.visualizar')
    OR public.usuario_eh_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.servidores s
      JOIN public.profiles p ON p.servidor_id = s.id
      WHERE s.id = servidor_id AND p.id = auth.uid()
    )
  );

CREATE POLICY "servidor_regime_insert" ON public.servidor_regime
  FOR INSERT TO authenticated
  WITH CHECK (
    public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.configurar')
    OR public.usuario_eh_super_admin(auth.uid())
  );

CREATE POLICY "servidor_regime_update" ON public.servidor_regime
  FOR UPDATE TO authenticated
  USING (
    public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.configurar')
    OR public.usuario_eh_super_admin(auth.uid())
  );

CREATE POLICY "servidor_regime_delete" ON public.servidor_regime
  FOR DELETE TO authenticated
  USING (public.usuario_eh_super_admin(auth.uid()));

-- =============================================
-- TRIGGER PARA UPDATED_AT
-- =============================================
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Aplicar trigger nas tabelas
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'config_jornada_padrao',
    'regimes_trabalho', 
    'tipos_abono',
    'config_compensacao',
    'config_fechamento_frequencia',
    'config_assinatura_frequencia',
    'solicitacoes_abono',
    'frequencia_fechamento',
    'servidor_regime'
  ])
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS set_updated_at ON public.%I;
      CREATE TRIGGER set_updated_at
        BEFORE UPDATE ON public.%I
        FOR EACH ROW
        EXECUTE FUNCTION public.trigger_set_updated_at();
    ', t, t);
  END LOOP;
END $$;