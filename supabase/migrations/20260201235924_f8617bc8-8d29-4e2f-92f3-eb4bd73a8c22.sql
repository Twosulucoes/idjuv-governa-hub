-- ============================================================
-- FASE 1D: TABELAS EM ORDEM CORRETA DE DEPENDÊNCIA
-- ============================================================

-- 1. ITENS DO PROCESSO LICITATÓRIO (base)
CREATE TABLE IF NOT EXISTS public.itens_processo_licitatorio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id UUID REFERENCES public.processos_licitatorios(id) ON DELETE CASCADE NOT NULL,
  numero_item INTEGER NOT NULL,
  descricao TEXT NOT NULL,
  unidade_medida VARCHAR(20) NOT NULL,
  quantidade DECIMAL(18,4) NOT NULL,
  valor_estimado_unitario DECIMAL(18,4),
  valor_estimado_total DECIMAL(18,2) GENERATED ALWAYS AS (quantidade * valor_estimado_unitario) STORED,
  especificacao_tecnica TEXT,
  marca_referencia VARCHAR(200),
  catmat_catser VARCHAR(20),
  situacao VARCHAR(50) DEFAULT 'pendente',
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_itens_processo_licitatorio_processo ON public.itens_processo_licitatorio(processo_id);

DROP TRIGGER IF EXISTS update_itens_processo_licitatorio_updated_at ON public.itens_processo_licitatorio;
CREATE TRIGGER update_itens_processo_licitatorio_updated_at
  BEFORE UPDATE ON public.itens_processo_licitatorio
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.itens_processo_licitatorio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "itens_processo_licitatorio_select" ON public.itens_processo_licitatorio;
CREATE POLICY "itens_processo_licitatorio_select" ON public.itens_processo_licitatorio 
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "itens_processo_licitatorio_all" ON public.itens_processo_licitatorio;
CREATE POLICY "itens_processo_licitatorio_all" ON public.itens_processo_licitatorio 
  FOR ALL TO authenticated USING (public.usuario_eh_admin(auth.uid()));

DROP TRIGGER IF EXISTS trg_audit_itens_processo_licitatorio ON public.itens_processo_licitatorio;
CREATE TRIGGER trg_audit_itens_processo_licitatorio
  AFTER INSERT OR UPDATE OR DELETE ON public.itens_processo_licitatorio
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();

-- 2. PROPOSTAS DE LICITAÇÃO
CREATE TABLE IF NOT EXISTS public.propostas_licitacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id UUID REFERENCES public.processos_licitatorios(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES public.itens_processo_licitatorio(id) ON DELETE CASCADE,
  fornecedor_id UUID REFERENCES public.fornecedores(id) ON DELETE RESTRICT NOT NULL,
  numero_proposta VARCHAR(50),
  data_proposta DATE NOT NULL,
  validade_proposta DATE,
  valor_unitario DECIMAL(18,4) NOT NULL,
  quantidade DECIMAL(18,4) NOT NULL,
  valor_total DECIMAL(18,2) GENERATED ALWAYS AS (valor_unitario * quantidade) STORED,
  marca VARCHAR(200),
  modelo VARCHAR(200),
  prazo_entrega_dias INTEGER,
  condicoes_pagamento TEXT,
  situacao VARCHAR(50) DEFAULT 'em_analise',
  classificacao INTEGER,
  motivo_desclassificacao TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_propostas_licitacao_processo ON public.propostas_licitacao(processo_id);
CREATE INDEX IF NOT EXISTS idx_propostas_licitacao_fornecedor ON public.propostas_licitacao(fornecedor_id);

DROP TRIGGER IF EXISTS update_propostas_licitacao_updated_at ON public.propostas_licitacao;
CREATE TRIGGER update_propostas_licitacao_updated_at
  BEFORE UPDATE ON public.propostas_licitacao
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.propostas_licitacao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "propostas_licitacao_select" ON public.propostas_licitacao;
CREATE POLICY "propostas_licitacao_select" ON public.propostas_licitacao 
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "propostas_licitacao_all" ON public.propostas_licitacao;
CREATE POLICY "propostas_licitacao_all" ON public.propostas_licitacao 
  FOR ALL TO authenticated USING (public.usuario_eh_admin(auth.uid()));

DROP TRIGGER IF EXISTS trg_audit_propostas_licitacao ON public.propostas_licitacao;
CREATE TRIGGER trg_audit_propostas_licitacao
  AFTER INSERT OR UPDATE OR DELETE ON public.propostas_licitacao
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();