
-- =============================================================
-- FASE 2: RESTOS A PAGAR, SUB-EMPENHOS E INTEGRAÇÃO PCASP
-- =============================================================

-- 1) TABELA: RESTOS A PAGAR (controle por exercício)
CREATE TABLE public.fin_restos_pagar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empenho_id UUID NOT NULL REFERENCES public.fin_empenhos(id),
  exercicio_origem INTEGER NOT NULL,
  exercicio_inscricao INTEGER NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('processado', 'nao_processado')),
  valor_inscrito NUMERIC(15,2) NOT NULL,
  valor_cancelado NUMERIC(15,2) NOT NULL DEFAULT 0,
  valor_liquidado NUMERIC(15,2) NOT NULL DEFAULT 0,
  valor_pago NUMERIC(15,2) NOT NULL DEFAULT 0,
  saldo NUMERIC(15,2) GENERATED ALWAYS AS (valor_inscrito - valor_cancelado - valor_pago) STORED,
  status VARCHAR(20) NOT NULL DEFAULT 'inscrito' CHECK (status IN ('inscrito', 'em_liquidacao', 'liquidado', 'pago', 'cancelado', 'prescrito')),
  data_inscricao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_cancelamento DATE,
  data_prescricao DATE,
  motivo_cancelamento TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  CONSTRAINT uq_rap_empenho UNIQUE (empenho_id, exercicio_inscricao)
);

ALTER TABLE public.fin_restos_pagar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "RAP visível para financeiro" ON public.fin_restos_pagar
  FOR SELECT USING (
    public.has_role('admin') OR public.has_module('financeiro')
  );

CREATE POLICY "RAP inserção para financeiro" ON public.fin_restos_pagar
  FOR INSERT WITH CHECK (
    public.has_role('admin') OR public.has_module('financeiro')
  );

CREATE POLICY "RAP atualização para financeiro" ON public.fin_restos_pagar
  FOR UPDATE USING (
    public.has_role('admin') OR public.has_module('financeiro')
  );

-- Índices para RAP
CREATE INDEX idx_fin_rap_empenho ON public.fin_restos_pagar(empenho_id);
CREATE INDEX idx_fin_rap_exercicio ON public.fin_restos_pagar(exercicio_inscricao, tipo);
CREATE INDEX idx_fin_rap_status ON public.fin_restos_pagar(status);

-- 2) TABELA: SUB-EMPENHOS (reforço e anulação)
CREATE TABLE public.fin_sub_empenhos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empenho_id UUID NOT NULL REFERENCES public.fin_empenhos(id),
  numero VARCHAR(30) NOT NULL,
  tipo VARCHAR(15) NOT NULL CHECK (tipo IN ('reforco', 'anulacao')),
  valor NUMERIC(15,2) NOT NULL,
  data_registro DATE NOT NULL DEFAULT CURRENT_DATE,
  justificativa TEXT NOT NULL,
  documento_referencia VARCHAR(50),
  status VARCHAR(15) NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'cancelado')),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

ALTER TABLE public.fin_sub_empenhos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sub-empenhos visível para financeiro" ON public.fin_sub_empenhos
  FOR SELECT USING (
    public.has_role('admin') OR public.has_module('financeiro')
  );

CREATE POLICY "Sub-empenhos inserção para financeiro" ON public.fin_sub_empenhos
  FOR INSERT WITH CHECK (
    public.has_role('admin') OR public.has_module('financeiro')
  );

CREATE POLICY "Sub-empenhos atualização para financeiro" ON public.fin_sub_empenhos
  FOR UPDATE USING (
    public.has_role('admin') OR public.has_module('financeiro')
  );

CREATE INDEX idx_fin_sub_empenhos_empenho ON public.fin_sub_empenhos(empenho_id);
CREATE INDEX idx_fin_sub_empenhos_tipo ON public.fin_sub_empenhos(tipo);

-- 3) INTEGRAÇÃO PCASP: adicionar conta contábil nas dotações e empenhos
ALTER TABLE public.fin_dotacoes 
  ADD COLUMN IF NOT EXISTS conta_contabil_id UUID REFERENCES public.fin_plano_contas(id),
  ADD COLUMN IF NOT EXISTS classificacao_pcasp VARCHAR(30);

ALTER TABLE public.fin_empenhos 
  ADD COLUMN IF NOT EXISTS conta_contabil_debito_id UUID REFERENCES public.fin_plano_contas(id),
  ADD COLUMN IF NOT EXISTS conta_contabil_credito_id UUID REFERENCES public.fin_plano_contas(id);

ALTER TABLE public.fin_liquidacoes 
  ADD COLUMN IF NOT EXISTS conta_contabil_debito_id UUID REFERENCES public.fin_plano_contas(id),
  ADD COLUMN IF NOT EXISTS conta_contabil_credito_id UUID REFERENCES public.fin_plano_contas(id);

ALTER TABLE public.fin_pagamentos 
  ADD COLUMN IF NOT EXISTS conta_contabil_debito_id UUID REFERENCES public.fin_plano_contas(id),
  ADD COLUMN IF NOT EXISTS conta_contabil_credito_id UUID REFERENCES public.fin_plano_contas(id);

-- 4) TRIGGER: ao inserir sub-empenho, atualizar saldos do empenho
CREATE OR REPLACE FUNCTION public.fn_atualizar_saldo_sub_empenho()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tipo = 'reforco' THEN
    UPDATE public.fin_empenhos
    SET valor_empenhado = valor_empenhado + NEW.valor,
        saldo_liquidar = COALESCE(saldo_liquidar, 0) + NEW.valor,
        updated_at = now()
    WHERE id = NEW.empenho_id;
    
    -- Atualizar dotação
    UPDATE public.fin_dotacoes
    SET valor_empenhado = COALESCE(valor_empenhado, 0) + NEW.valor,
        updated_at = now()
    WHERE id = (SELECT dotacao_id FROM public.fin_empenhos WHERE id = NEW.empenho_id);
        
  ELSIF NEW.tipo = 'anulacao' THEN
    UPDATE public.fin_empenhos
    SET valor_anulado = COALESCE(valor_anulado, 0) + NEW.valor,
        saldo_liquidar = COALESCE(saldo_liquidar, 0) - NEW.valor,
        updated_at = now()
    WHERE id = NEW.empenho_id;
    
    -- Devolver saldo à dotação
    UPDATE public.fin_dotacoes
    SET valor_empenhado = COALESCE(valor_empenhado, 0) - NEW.valor,
        updated_at = now()
    WHERE id = (SELECT dotacao_id FROM public.fin_empenhos WHERE id = NEW.empenho_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_sub_empenho_saldo
  AFTER INSERT ON public.fin_sub_empenhos
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_atualizar_saldo_sub_empenho();

-- 5) TRIGGER: validar sub-empenho de anulação (não pode anular mais que o saldo)
CREATE OR REPLACE FUNCTION public.fn_validar_sub_empenho_anulacao()
RETURNS TRIGGER AS $$
DECLARE
  v_saldo_liquidar NUMERIC;
BEGIN
  IF NEW.tipo = 'anulacao' THEN
    SELECT COALESCE(saldo_liquidar, valor_empenhado - COALESCE(valor_liquidado, 0))
    INTO v_saldo_liquidar
    FROM public.fin_empenhos
    WHERE id = NEW.empenho_id;
    
    IF NEW.valor > v_saldo_liquidar THEN
      RAISE EXCEPTION 'Valor da anulação (R$ %) excede o saldo a liquidar do empenho (R$ %)',
        NEW.valor, v_saldo_liquidar;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_validar_sub_empenho
  BEFORE INSERT ON public.fin_sub_empenhos
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_validar_sub_empenho_anulacao();

-- 6) FUNÇÃO: inscrever empenhos em RAP (batch no encerramento de exercício)
CREATE OR REPLACE FUNCTION public.fn_inscrever_restos_pagar(
  p_exercicio_origem INTEGER,
  p_exercicio_inscricao INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_exercicio_inscricao INTEGER;
  v_count INTEGER := 0;
BEGIN
  v_exercicio_inscricao := COALESCE(p_exercicio_inscricao, p_exercicio_origem + 1);
  
  -- Inscrever empenhos com saldo a liquidar (não processados)
  INSERT INTO public.fin_restos_pagar (empenho_id, exercicio_origem, exercicio_inscricao, tipo, valor_inscrito)
  SELECT id, exercicio, v_exercicio_inscricao, 'nao_processado', 
         COALESCE(saldo_liquidar, valor_empenhado - COALESCE(valor_liquidado, 0))
  FROM public.fin_empenhos
  WHERE exercicio = p_exercicio_origem
    AND status IN ('emitido', 'parcialmente_liquidado')
    AND COALESCE(saldo_liquidar, valor_empenhado - COALESCE(valor_liquidado, 0)) > 0
    AND inscrito_rp IS NOT TRUE
  ON CONFLICT (empenho_id, exercicio_inscricao) DO NOTHING;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  -- Inscrever empenhos liquidados não pagos (processados)
  INSERT INTO public.fin_restos_pagar (empenho_id, exercicio_origem, exercicio_inscricao, tipo, valor_inscrito)
  SELECT id, exercicio, v_exercicio_inscricao, 'processado',
         COALESCE(saldo_pagar, COALESCE(valor_liquidado, 0) - COALESCE(valor_pago, 0))
  FROM public.fin_empenhos
  WHERE exercicio = p_exercicio_origem
    AND COALESCE(saldo_pagar, COALESCE(valor_liquidado, 0) - COALESCE(valor_pago, 0)) > 0
    AND inscrito_rp IS NOT TRUE
  ON CONFLICT (empenho_id, exercicio_inscricao) DO NOTHING;
  
  -- Marcar empenhos como inscritos
  UPDATE public.fin_empenhos
  SET inscrito_rp = TRUE,
      data_inscricao_rp = CURRENT_DATE,
      updated_at = now()
  WHERE exercicio = p_exercicio_origem
    AND inscrito_rp IS NOT TRUE
    AND id IN (SELECT empenho_id FROM public.fin_restos_pagar WHERE exercicio_inscricao = v_exercicio_inscricao);
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 7) Atualizar timestamps automáticos
CREATE TRIGGER update_fin_restos_pagar_updated_at
  BEFORE UPDATE ON public.fin_restos_pagar
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fin_sub_empenhos_updated_at
  BEFORE UPDATE ON public.fin_sub_empenhos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
