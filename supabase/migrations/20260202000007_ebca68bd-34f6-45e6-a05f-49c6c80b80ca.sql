-- ============================================================
-- FASE 1E: ATAS, ITENS E CONTRATOS (CONTINUAÇÃO)
-- ============================================================

-- 3. ATAS DE REGISTRO DE PREÇO
CREATE TABLE IF NOT EXISTS public.atas_registro_preco (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id UUID REFERENCES public.processos_licitatorios(id) ON DELETE RESTRICT NOT NULL,
  numero_ata VARCHAR(50) NOT NULL,
  ano INTEGER NOT NULL,
  fornecedor_id UUID REFERENCES public.fornecedores(id) ON DELETE RESTRICT NOT NULL,
  data_assinatura DATE NOT NULL,
  data_publicacao_doe DATE,
  numero_doe VARCHAR(50),
  data_vigencia_inicio DATE NOT NULL,
  data_vigencia_fim DATE NOT NULL,
  valor_total_registrado DECIMAL(18,2) NOT NULL,
  saldo_disponivel DECIMAL(18,2),
  objeto TEXT NOT NULL,
  fundamentacao_legal TEXT,
  situacao VARCHAR(50) DEFAULT 'vigente',
  orgao_gerenciador VARCHAR(200),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  UNIQUE(numero_ata, ano)
);

-- 4. ITENS DA ATA DE REGISTRO DE PREÇO
CREATE TABLE IF NOT EXISTS public.itens_ata_registro_preco (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ata_id UUID REFERENCES public.atas_registro_preco(id) ON DELETE CASCADE NOT NULL,
  item_licitatorio_id UUID REFERENCES public.itens_processo_licitatorio(id),
  numero_item INTEGER NOT NULL,
  descricao TEXT NOT NULL,
  unidade_medida VARCHAR(20) NOT NULL,
  quantidade_registrada DECIMAL(18,4) NOT NULL,
  quantidade_consumida DECIMAL(18,4) DEFAULT 0,
  saldo_quantidade DECIMAL(18,4) GENERATED ALWAYS AS (quantidade_registrada - quantidade_consumida) STORED,
  valor_unitario DECIMAL(18,4) NOT NULL,
  valor_total DECIMAL(18,2) GENERATED ALWAYS AS (quantidade_registrada * valor_unitario) STORED,
  marca VARCHAR(200),
  modelo VARCHAR(200),
  situacao VARCHAR(50) DEFAULT 'disponivel',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_atas_registro_preco_processo ON public.atas_registro_preco(processo_id);
CREATE INDEX IF NOT EXISTS idx_atas_registro_preco_fornecedor ON public.atas_registro_preco(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_itens_ata_registro_preco_ata ON public.itens_ata_registro_preco(ata_id);

-- Triggers updated_at
DROP TRIGGER IF EXISTS update_atas_registro_preco_updated_at ON public.atas_registro_preco;
CREATE TRIGGER update_atas_registro_preco_updated_at
  BEFORE UPDATE ON public.atas_registro_preco
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_itens_ata_registro_preco_updated_at ON public.itens_ata_registro_preco;
CREATE TRIGGER update_itens_ata_registro_preco_updated_at
  BEFORE UPDATE ON public.itens_ata_registro_preco
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.atas_registro_preco ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_ata_registro_preco ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "atas_registro_preco_select" ON public.atas_registro_preco;
CREATE POLICY "atas_registro_preco_select" ON public.atas_registro_preco 
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "atas_registro_preco_all" ON public.atas_registro_preco;
CREATE POLICY "atas_registro_preco_all" ON public.atas_registro_preco 
  FOR ALL TO authenticated USING (public.usuario_eh_admin(auth.uid()));

DROP POLICY IF EXISTS "itens_ata_registro_preco_select" ON public.itens_ata_registro_preco;
CREATE POLICY "itens_ata_registro_preco_select" ON public.itens_ata_registro_preco 
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "itens_ata_registro_preco_all" ON public.itens_ata_registro_preco;
CREATE POLICY "itens_ata_registro_preco_all" ON public.itens_ata_registro_preco 
  FOR ALL TO authenticated USING (public.usuario_eh_admin(auth.uid()));

-- Auditoria
DROP TRIGGER IF EXISTS trg_audit_atas_registro_preco ON public.atas_registro_preco;
CREATE TRIGGER trg_audit_atas_registro_preco
  AFTER INSERT OR UPDATE OR DELETE ON public.atas_registro_preco
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();

DROP TRIGGER IF EXISTS trg_audit_itens_ata_registro_preco ON public.itens_ata_registro_preco;
CREATE TRIGGER trg_audit_itens_ata_registro_preco
  AFTER INSERT OR UPDATE OR DELETE ON public.itens_ata_registro_preco
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();