-- CRIAR TABELA ITENS_CONTRATO (única faltante)
CREATE TABLE IF NOT EXISTS public.itens_contrato (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID REFERENCES public.contratos(id) ON DELETE CASCADE NOT NULL,
  item_ata_id UUID REFERENCES public.itens_ata_registro_preco(id),
  numero_item INTEGER NOT NULL,
  descricao TEXT NOT NULL,
  unidade_medida VARCHAR(20) NOT NULL,
  quantidade DECIMAL(18,4) NOT NULL,
  quantidade_entregue DECIMAL(18,4) DEFAULT 0,
  saldo_quantidade DECIMAL(18,4) GENERATED ALWAYS AS (quantidade - quantidade_entregue) STORED,
  valor_unitario DECIMAL(18,4) NOT NULL,
  valor_total DECIMAL(18,2) GENERATED ALWAYS AS (quantidade * valor_unitario) STORED,
  situacao VARCHAR(50) DEFAULT 'pendente',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índice
CREATE INDEX IF NOT EXISTS idx_itens_contrato_contrato ON public.itens_contrato(contrato_id);

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_itens_contrato_updated_at ON public.itens_contrato;
CREATE TRIGGER update_itens_contrato_updated_at
  BEFORE UPDATE ON public.itens_contrato
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.itens_contrato ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "itens_contrato_select" ON public.itens_contrato;
CREATE POLICY "itens_contrato_select" ON public.itens_contrato 
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "itens_contrato_all" ON public.itens_contrato;
CREATE POLICY "itens_contrato_all" ON public.itens_contrato 
  FOR ALL TO authenticated USING (public.usuario_eh_admin(auth.uid()));

-- Auditoria
DROP TRIGGER IF EXISTS trg_audit_itens_contrato ON public.itens_contrato;
CREATE TRIGGER trg_audit_itens_contrato
  AFTER INSERT OR UPDATE OR DELETE ON public.itens_contrato
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();