-- ============================================
-- FASE 4.1 - BASE LAI (MIGRAÇÃO IDEMPOTENTE)
-- ============================================
-- Tabelas: historico_lai, recursos_lai, prazos_lai, debitos_tecnicos
-- Conformidade: LAI (20 dias + prorrogação 10), LGPD

-- ============================================
-- 1. ENUM TIPOS (idempotente)
-- ============================================

DO $$ BEGIN
  CREATE TYPE public.status_recurso_lai AS ENUM (
    'interposto',
    'em_analise',
    'deferido',
    'deferido_parcial',
    'indeferido',
    'nao_conhecido',
    'desistencia'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.instancia_recurso AS ENUM ('primeira', 'segunda');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.tipo_evento_lai AS ENUM (
    'abertura',
    'classificacao',
    'encaminhamento',
    'resposta_parcial',
    'prorrogacao',
    'resposta_final',
    'recurso_interposto',
    'recurso_respondido',
    'encerramento',
    'reativacao',
    'alteracao_responsavel'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.prioridade_debito AS ENUM ('critica', 'alta', 'media', 'baixa');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.status_debito AS ENUM ('pendente', 'em_andamento', 'resolvido', 'cancelado', 'adiado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 2. TABELA prazos_lai (parametrização LAI)
-- ============================================

CREATE TABLE IF NOT EXISTS public.prazos_lai (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_prazo VARCHAR(50) NOT NULL UNIQUE,
  descricao TEXT,
  prazo_dias INTEGER NOT NULL,
  prorrogavel BOOLEAN DEFAULT false,
  prorrogacao_dias INTEGER DEFAULT 0,
  dias_uteis BOOLEAN DEFAULT true,
  base_legal TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir prazos padrão LAI (ON CONFLICT para idempotência)
INSERT INTO public.prazos_lai (tipo_prazo, descricao, prazo_dias, prorrogavel, prorrogacao_dias, dias_uteis, base_legal)
VALUES 
  ('resposta_inicial', 'Prazo para resposta inicial ao pedido LAI', 20, true, 10, true, 'Lei 12.527/2011, Art. 11, §1º e §2º'),
  ('recurso_primeira_instancia', 'Prazo para interpor recurso em 1ª instância', 10, false, 0, true, 'Lei 12.527/2011, Art. 15'),
  ('resposta_recurso_primeira', 'Prazo para responder recurso 1ª instância', 5, false, 0, true, 'Lei 12.527/2011, Art. 16'),
  ('recurso_segunda_instancia', 'Prazo para interpor recurso em 2ª instância', 10, false, 0, true, 'Lei 12.527/2011, Art. 16, §1º'),
  ('resposta_recurso_segunda', 'Prazo para responder recurso 2ª instância', 5, false, 0, true, 'Lei 12.527/2011, Art. 16, §2º')
ON CONFLICT (tipo_prazo) DO UPDATE SET
  descricao = EXCLUDED.descricao,
  prazo_dias = EXCLUDED.prazo_dias,
  prorrogavel = EXCLUDED.prorrogavel,
  prorrogacao_dias = EXCLUDED.prorrogacao_dias,
  base_legal = EXCLUDED.base_legal,
  updated_at = now();

-- ============================================
-- 3. TABELA historico_lai (auditoria completa)
-- ============================================

CREATE TABLE IF NOT EXISTS public.historico_lai (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitacao_id UUID NOT NULL REFERENCES public.solicitacoes_sic(id) ON DELETE CASCADE,
  tipo_evento public.tipo_evento_lai NOT NULL,
  status_anterior VARCHAR(50),
  status_novo VARCHAR(50),
  prazo_anterior DATE,
  prazo_novo DATE,
  responsavel_anterior_id UUID,
  responsavel_novo_id UUID,
  unidade_anterior_id UUID,
  unidade_nova_id UUID,
  observacao TEXT,
  justificativa TEXT,
  dados_adicionais JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_historico_lai_solicitacao ON public.historico_lai(solicitacao_id);
CREATE INDEX IF NOT EXISTS idx_historico_lai_tipo_evento ON public.historico_lai(tipo_evento);
CREATE INDEX IF NOT EXISTS idx_historico_lai_created_at ON public.historico_lai(created_at DESC);

-- ============================================
-- 4. TABELA recursos_lai (1ª e 2ª instância)
-- ============================================

CREATE TABLE IF NOT EXISTS public.recursos_lai (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitacao_id UUID NOT NULL REFERENCES public.solicitacoes_sic(id) ON DELETE CASCADE,
  instancia public.instancia_recurso NOT NULL,
  numero_recurso VARCHAR(30),
  data_interposicao TIMESTAMPTZ NOT NULL DEFAULT now(),
  prazo_resposta DATE NOT NULL,
  fundamentacao TEXT NOT NULL,
  documentos_anexos JSONB DEFAULT '[]'::jsonb,
  status public.status_recurso_lai DEFAULT 'interposto',
  responsavel_analise_id UUID,
  data_analise TIMESTAMPTZ,
  decisao TEXT,
  fundamentacao_decisao TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_recurso_instancia UNIQUE(solicitacao_id, instancia)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_recursos_lai_solicitacao ON public.recursos_lai(solicitacao_id);
CREATE INDEX IF NOT EXISTS idx_recursos_lai_status ON public.recursos_lai(status);
CREATE INDEX IF NOT EXISTS idx_recursos_lai_prazo ON public.recursos_lai(prazo_resposta);

-- ============================================
-- 5. TABELA debitos_tecnicos (registro formal)
-- ============================================

CREATE TABLE IF NOT EXISTS public.debitos_tecnicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(20) NOT NULL UNIQUE,
  titulo VARCHAR(200) NOT NULL,
  descricao TEXT,
  modulo VARCHAR(100),
  fase_origem VARCHAR(50),
  fase_destino VARCHAR(50),
  prioridade public.prioridade_debito DEFAULT 'media',
  status public.status_debito DEFAULT 'pendente',
  impacto TEXT,
  solucao_proposta TEXT,
  estimativa_esforco VARCHAR(50),
  dependencias TEXT[],
  responsavel_id UUID,
  data_identificacao DATE DEFAULT CURRENT_DATE,
  data_prevista DATE,
  data_resolucao DATE,
  observacoes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_debitos_tecnicos_modulo ON public.debitos_tecnicos(modulo);
CREATE INDEX IF NOT EXISTS idx_debitos_tecnicos_status ON public.debitos_tecnicos(status);
CREATE INDEX IF NOT EXISTS idx_debitos_tecnicos_prioridade ON public.debitos_tecnicos(prioridade);

-- ============================================
-- 6. FUNÇÃO para calcular prazo LAI (dias úteis)
-- ============================================

CREATE OR REPLACE FUNCTION public.calcular_prazo_lai(
  p_data_inicio DATE,
  p_tipo_prazo VARCHAR DEFAULT 'resposta_inicial'
)
RETURNS DATE
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
DECLARE
  v_prazo_dias INTEGER;
  v_dias_uteis BOOLEAN;
  v_data_fim DATE;
  v_contador INTEGER := 0;
  v_dias_adicionados INTEGER := 0;
BEGIN
  -- Buscar configuração do prazo
  SELECT prazo_dias, dias_uteis 
  INTO v_prazo_dias, v_dias_uteis
  FROM public.prazos_lai
  WHERE tipo_prazo = p_tipo_prazo AND ativo = true
  LIMIT 1;
  
  IF v_prazo_dias IS NULL THEN
    -- Fallback: 20 dias úteis (padrão LAI)
    v_prazo_dias := 20;
    v_dias_uteis := true;
  END IF;
  
  v_data_fim := p_data_inicio;
  
  IF v_dias_uteis THEN
    -- Contar apenas dias úteis (excluindo sábados e domingos)
    WHILE v_dias_adicionados < v_prazo_dias LOOP
      v_data_fim := v_data_fim + INTERVAL '1 day';
      -- Verificar se é dia útil (1=segunda a 5=sexta)
      IF EXTRACT(DOW FROM v_data_fim) NOT IN (0, 6) THEN
        -- Verificar se não é feriado (usando tabela dias_nao_uteis se existir)
        IF NOT EXISTS (
          SELECT 1 FROM public.dias_nao_uteis 
          WHERE data = v_data_fim AND ativo = true
        ) THEN
          v_dias_adicionados := v_dias_adicionados + 1;
        END IF;
      END IF;
      
      -- Segurança: máximo 100 iterações
      v_contador := v_contador + 1;
      IF v_contador > 100 THEN EXIT; END IF;
    END LOOP;
  ELSE
    v_data_fim := p_data_inicio + (v_prazo_dias || ' days')::INTERVAL;
  END IF;
  
  RETURN v_data_fim;
END;
$$;

-- ============================================
-- 7. TRIGGER para prazo LAI correto (20 dias)
-- ============================================

CREATE OR REPLACE FUNCTION public.definir_prazo_lai_correto()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Calcular prazo inicial de 20 dias úteis (não 30 fixos)
  IF NEW.prazo_resposta IS NULL THEN
    NEW.prazo_resposta := public.calcular_prazo_lai(CURRENT_DATE, 'resposta_inicial');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS tr_definir_prazo_lai ON public.solicitacoes_sic;

-- Criar novo trigger
CREATE TRIGGER tr_definir_prazo_lai
  BEFORE INSERT ON public.solicitacoes_sic
  FOR EACH ROW
  EXECUTE FUNCTION public.definir_prazo_lai_correto();

-- ============================================
-- 8. TRIGGER para historico automático LAI
-- ============================================

CREATE OR REPLACE FUNCTION public.registrar_historico_lai()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tipo_evento public.tipo_evento_lai;
BEGIN
  -- Determinar tipo de evento
  IF TG_OP = 'INSERT' THEN
    v_tipo_evento := 'abertura';
  ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
    CASE NEW.status
      WHEN 'em_analise' THEN v_tipo_evento := 'classificacao';
      WHEN 'respondida' THEN v_tipo_evento := 'resposta_final';
      WHEN 'encerrada' THEN v_tipo_evento := 'encerramento';
      ELSE v_tipo_evento := 'classificacao';
    END CASE;
  ELSIF OLD.prazo_resposta IS DISTINCT FROM NEW.prazo_resposta THEN
    v_tipo_evento := 'prorrogacao';
  ELSIF OLD.responsavel_id IS DISTINCT FROM NEW.responsavel_id THEN
    v_tipo_evento := 'alteracao_responsavel';
  ELSE
    RETURN NEW; -- Sem mudança relevante
  END IF;
  
  -- Registrar no histórico
  INSERT INTO public.historico_lai (
    solicitacao_id,
    tipo_evento,
    status_anterior,
    status_novo,
    prazo_anterior,
    prazo_novo,
    responsavel_anterior_id,
    responsavel_novo_id,
    created_by
  ) VALUES (
    NEW.id,
    v_tipo_evento,
    CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END,
    NEW.status,
    CASE WHEN TG_OP = 'UPDATE' THEN OLD.prazo_resposta ELSE NULL END,
    NEW.prazo_resposta,
    CASE WHEN TG_OP = 'UPDATE' THEN OLD.responsavel_id ELSE NULL END,
    NEW.responsavel_id,
    auth.uid()
  );
  
  RETURN NEW;
END;
$$;

-- Criar trigger de histórico
DROP TRIGGER IF EXISTS tr_historico_lai ON public.solicitacoes_sic;
CREATE TRIGGER tr_historico_lai
  AFTER INSERT OR UPDATE ON public.solicitacoes_sic
  FOR EACH ROW
  EXECUTE FUNCTION public.registrar_historico_lai();

-- ============================================
-- 9. HABILITAR RLS
-- ============================================

ALTER TABLE public.prazos_lai ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_lai ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recursos_lai ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debitos_tecnicos ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 10. TRIGGERS DE UPDATED_AT
-- ============================================

DROP TRIGGER IF EXISTS tr_prazos_lai_updated ON public.prazos_lai;
CREATE TRIGGER tr_prazos_lai_updated
  BEFORE UPDATE ON public.prazos_lai
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_recursos_lai_updated ON public.recursos_lai;
CREATE TRIGGER tr_recursos_lai_updated
  BEFORE UPDATE ON public.recursos_lai
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_debitos_tecnicos_updated ON public.debitos_tecnicos;
CREATE TRIGGER tr_debitos_tecnicos_updated
  BEFORE UPDATE ON public.debitos_tecnicos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 11. REGISTRAR DÉBITO TÉCNICO: Folha Bloqueada
-- ============================================

INSERT INTO public.debitos_tecnicos (
  codigo, titulo, descricao, modulo, fase_origem, fase_destino, 
  prioridade, impacto, solucao_proposta, estimativa_esforco
) VALUES (
  'DT-2026-001',
  'Módulo Folha de Pagamento Bloqueado',
  'Implementação técnica completa (cálculos INSS/IRRF, CNAB, eSocial) porém desativada. Código preservado para ativação futura.',
  'Folha de Pagamento',
  'FASE 3',
  'FASE FUTURA',
  'media',
  'Funcionalidade de folha não operacional. Processamento manual externo necessário.',
  'Ativar módulo após definição de política de remuneração e integração com sistemas estaduais.',
  '2-4 sprints'
) ON CONFLICT (codigo) DO NOTHING;