-- ============================================================
-- FASE 2: PLANEJAMENTO ORÇAMENTÁRIO, EXECUÇÃO FINANCEIRA E PATRIMÔNIO
-- Migração consolidada com integração total à Fase 1 (Licitações e Contratos)
-- ============================================================

-- ============================================================
-- MÓDULO 2A: PLANEJAMENTO - PROGRAMAS E METAS
-- ============================================================

-- Tabela de Programas/Projetos de Governo
CREATE TABLE IF NOT EXISTS public.programas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(20) NOT NULL UNIQUE,
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  objetivo TEXT,
  publico_alvo TEXT,
  ano_inicio INTEGER NOT NULL,
  ano_fim INTEGER,
  situacao VARCHAR(30) DEFAULT 'ativo' CHECK (situacao IN ('ativo', 'suspenso', 'encerrado', 'planejamento')),
  unidade_responsavel_id UUID REFERENCES public.estrutura_organizacional(id),
  servidor_responsavel_id UUID REFERENCES public.servidores(id),
  
  -- Métricas e indicadores
  meta_fisica_total DECIMAL(18,2),
  unidade_medida VARCHAR(50),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Tabela de Ações vinculadas aos Programas
CREATE TABLE IF NOT EXISTS public.acoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  programa_id UUID REFERENCES public.programas(id) ON DELETE CASCADE NOT NULL,
  codigo VARCHAR(20) NOT NULL,
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(30) DEFAULT 'atividade' CHECK (tipo IN ('atividade', 'projeto', 'operacao_especial')),
  
  -- Vinculação com Licitações (Fase 1)
  processo_licitatorio_id UUID REFERENCES public.processos_licitatorios(id),
  
  -- Metas
  meta_fisica DECIMAL(18,2),
  meta_financeira DECIMAL(18,2),
  unidade_medida VARCHAR(50),
  
  -- Período de execução
  data_inicio DATE,
  data_fim DATE,
  situacao VARCHAR(30) DEFAULT 'planejada' CHECK (situacao IN ('planejada', 'em_execucao', 'concluida', 'cancelada', 'suspensa')),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  
  UNIQUE(programa_id, codigo)
);

-- ============================================================
-- MÓDULO 2B: ORÇAMENTO - DOTAÇÃO E CRÉDITOS
-- ============================================================

-- Tabela de Dotações Orçamentárias
CREATE TABLE IF NOT EXISTS public.dotacoes_orcamentarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercicio INTEGER NOT NULL,
  
  -- Classificação Orçamentária
  unidade_orcamentaria VARCHAR(10) NOT NULL,
  funcao VARCHAR(2) NOT NULL,
  subfuncao VARCHAR(3) NOT NULL,
  programa VARCHAR(4) NOT NULL,
  acao_orcamentaria VARCHAR(4) NOT NULL,
  categoria_economica VARCHAR(1) NOT NULL,
  grupo_despesa VARCHAR(1) NOT NULL,
  modalidade_aplicacao VARCHAR(2) NOT NULL,
  elemento_despesa VARCHAR(2) NOT NULL,
  
  -- Classificação completa (código concatenado)
  classificacao_completa VARCHAR(50) GENERATED ALWAYS AS (
    unidade_orcamentaria || '.' || funcao || '.' || subfuncao || '.' || 
    programa || '.' || acao_orcamentaria || '.' || 
    categoria_economica || grupo_despesa || modalidade_aplicacao || elemento_despesa
  ) STORED,
  
  -- Fonte de recursos
  fonte_recurso VARCHAR(10) NOT NULL,
  descricao_fonte VARCHAR(200),
  
  -- Valores
  valor_inicial DECIMAL(18,2) NOT NULL DEFAULT 0,
  valor_suplementado DECIMAL(18,2) NOT NULL DEFAULT 0,
  valor_anulado DECIMAL(18,2) NOT NULL DEFAULT 0,
  valor_atual DECIMAL(18,2) GENERATED ALWAYS AS (valor_inicial + valor_suplementado - valor_anulado) STORED,
  valor_empenhado DECIMAL(18,2) NOT NULL DEFAULT 0,
  valor_liquidado DECIMAL(18,2) NOT NULL DEFAULT 0,
  valor_pago DECIMAL(18,2) NOT NULL DEFAULT 0,
  saldo_disponivel DECIMAL(18,2) GENERATED ALWAYS AS (valor_inicial + valor_suplementado - valor_anulado - valor_empenhado) STORED,
  
  -- Vínculo com centro de custo
  centro_custo_id UUID REFERENCES public.centros_custo(id),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  
  UNIQUE(exercicio, classificacao_completa, fonte_recurso)
);

-- Tabela de Créditos Adicionais
CREATE TABLE IF NOT EXISTS public.creditos_adicionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dotacao_id UUID REFERENCES public.dotacoes_orcamentarias(id) ON DELETE CASCADE NOT NULL,
  tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('suplementar', 'especial', 'extraordinario')),
  numero_decreto VARCHAR(30),
  data_decreto DATE,
  valor DECIMAL(18,2) NOT NULL,
  origem VARCHAR(30) CHECK (origem IN ('anulacao', 'superavit', 'excesso_arrecadacao', 'operacao_credito')),
  dotacao_origem_id UUID REFERENCES public.dotacoes_orcamentarias(id),
  justificativa TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- ============================================================
-- MÓDULO 2C: EXECUÇÃO FINANCEIRA - EMPENHO, LIQUIDAÇÃO, PAGAMENTO
-- ============================================================

-- Tabela de Empenhos
CREATE TABLE IF NOT EXISTS public.empenhos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  numero_empenho VARCHAR(20) NOT NULL,
  exercicio INTEGER NOT NULL,
  data_empenho DATE NOT NULL,
  
  -- Classificação
  tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('ordinario', 'estimativo', 'global')),
  modalidade VARCHAR(30) NOT NULL,
  
  -- Vinculações com Fase 1
  dotacao_id UUID REFERENCES public.dotacoes_orcamentarias(id) NOT NULL,
  contrato_id UUID REFERENCES public.contratos(id),
  fornecedor_id UUID REFERENCES public.fornecedores(id) NOT NULL,
  processo_licitatorio_id UUID REFERENCES public.processos_licitatorios(id),
  
  -- Valores
  valor_empenhado DECIMAL(18,2) NOT NULL,
  valor_anulado DECIMAL(18,2) NOT NULL DEFAULT 0,
  valor_liquidado DECIMAL(18,2) NOT NULL DEFAULT 0,
  valor_pago DECIMAL(18,2) NOT NULL DEFAULT 0,
  saldo_empenho DECIMAL(18,2) GENERATED ALWAYS AS (valor_empenhado - valor_anulado - valor_liquidado) STORED,
  
  -- Descrição
  historico TEXT NOT NULL,
  observacao TEXT,
  
  -- Status
  situacao VARCHAR(30) DEFAULT 'ativo' CHECK (situacao IN ('ativo', 'anulado', 'liquidado', 'pago', 'inscrito_rp')),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  
  UNIQUE(numero_empenho, exercicio)
);

-- Tabela de Liquidações
CREATE TABLE IF NOT EXISTS public.liquidacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  numero_liquidacao VARCHAR(20) NOT NULL,
  data_liquidacao DATE NOT NULL,
  
  -- Vinculações
  empenho_id UUID REFERENCES public.empenhos(id) ON DELETE CASCADE NOT NULL,
  medicao_id UUID REFERENCES public.medicoes_contrato(id),
  nota_fiscal VARCHAR(50),
  data_nota_fiscal DATE,
  
  -- Valores
  valor_liquidado DECIMAL(18,2) NOT NULL,
  valor_retido DECIMAL(18,2) NOT NULL DEFAULT 0,
  valor_liquido DECIMAL(18,2) GENERATED ALWAYS AS (valor_liquidado - valor_retido) STORED,
  
  -- Retenções detalhadas
  retencao_inss DECIMAL(18,2) DEFAULT 0,
  retencao_irrf DECIMAL(18,2) DEFAULT 0,
  retencao_iss DECIMAL(18,2) DEFAULT 0,
  outras_retencoes DECIMAL(18,2) DEFAULT 0,
  
  -- Atestação
  atestado_por UUID REFERENCES public.servidores(id),
  data_atestado DATE,
  
  observacao TEXT,
  situacao VARCHAR(30) DEFAULT 'pendente' CHECK (situacao IN ('pendente', 'aprovada', 'paga', 'cancelada')),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  
  UNIQUE(empenho_id, numero_liquidacao)
);

-- Tabela de Pagamentos
CREATE TABLE IF NOT EXISTS public.pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  numero_pagamento VARCHAR(20) NOT NULL,
  data_pagamento DATE NOT NULL,
  
  -- Vinculações
  liquidacao_id UUID REFERENCES public.liquidacoes(id) ON DELETE CASCADE NOT NULL,
  conta_autarquia_id UUID REFERENCES public.contas_autarquia(id),
  
  -- Valores
  valor_pago DECIMAL(18,2) NOT NULL,
  
  -- Dados bancários
  forma_pagamento VARCHAR(30) CHECK (forma_pagamento IN ('ordem_bancaria', 'ted', 'doc', 'pix', 'cheque', 'dinheiro')),
  banco VARCHAR(10),
  agencia VARCHAR(10),
  conta VARCHAR(20),
  numero_documento_bancario VARCHAR(30),
  
  observacao TEXT,
  situacao VARCHAR(30) DEFAULT 'efetuado' CHECK (situacao IN ('efetuado', 'estornado', 'devolvido')),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- ============================================================
-- MÓDULO 2D: PATRIMÔNIO E ALMOXARIFADO
-- ============================================================

-- Tabela de Categorias de Material
CREATE TABLE IF NOT EXISTS public.categorias_material (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(20) NOT NULL UNIQUE,
  nome VARCHAR(100) NOT NULL,
  tipo VARCHAR(30) CHECK (tipo IN ('consumo', 'permanente', 'servico')),
  vida_util_meses INTEGER,
  depreciavel BOOLEAN DEFAULT false,
  taxa_depreciacao_anual DECIMAL(5,2),
  conta_contabil VARCHAR(20),
  ativo BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Itens de Material/Patrimônio
CREATE TABLE IF NOT EXISTS public.itens_material (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id UUID REFERENCES public.categorias_material(id),
  codigo VARCHAR(30) NOT NULL UNIQUE,
  descricao VARCHAR(200) NOT NULL,
  especificacao TEXT,
  unidade_medida VARCHAR(20) NOT NULL,
  
  -- Controle de estoque
  estoque_minimo DECIMAL(18,4) DEFAULT 0,
  estoque_maximo DECIMAL(18,4),
  ponto_reposicao DECIMAL(18,4),
  
  -- Valores de referência
  valor_unitario_medio DECIMAL(18,4),
  ultimo_valor_compra DECIMAL(18,4),
  
  ativo BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Almoxarifados/Depósitos
CREATE TABLE IF NOT EXISTS public.almoxarifados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(20) NOT NULL UNIQUE,
  nome VARCHAR(100) NOT NULL,
  unidade_id UUID REFERENCES public.estrutura_organizacional(id),
  responsavel_id UUID REFERENCES public.servidores(id),
  localizacao TEXT,
  ativo BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Saldo de Estoque
CREATE TABLE IF NOT EXISTS public.estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.itens_material(id) ON DELETE CASCADE NOT NULL,
  almoxarifado_id UUID REFERENCES public.almoxarifados(id) ON DELETE CASCADE NOT NULL,
  quantidade DECIMAL(18,4) NOT NULL DEFAULT 0,
  valor_total DECIMAL(18,2) NOT NULL DEFAULT 0,
  ultima_movimentacao TIMESTAMPTZ,
  
  UNIQUE(item_id, almoxarifado_id)
);

-- Tabela de Movimentações de Estoque
CREATE TABLE IF NOT EXISTS public.movimentacoes_estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.itens_material(id) NOT NULL,
  almoxarifado_id UUID REFERENCES public.almoxarifados(id) NOT NULL,
  
  tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('entrada', 'saida', 'transferencia', 'ajuste', 'devolucao')),
  subtipo VARCHAR(30),
  
  quantidade DECIMAL(18,4) NOT NULL,
  valor_unitario DECIMAL(18,4),
  valor_total DECIMAL(18,2),
  
  -- Vinculações
  empenho_id UUID REFERENCES public.empenhos(id),
  nota_fiscal VARCHAR(50),
  requisicao_id UUID,
  
  -- Transferência
  almoxarifado_destino_id UUID REFERENCES public.almoxarifados(id),
  
  -- Rastreabilidade
  servidor_responsavel_id UUID REFERENCES public.servidores(id),
  setor_destino_id UUID REFERENCES public.estrutura_organizacional(id),
  observacao TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- Tabela de Bens Patrimoniais
CREATE TABLE IF NOT EXISTS public.bens_patrimoniais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_patrimonio VARCHAR(30) NOT NULL UNIQUE,
  item_id UUID REFERENCES public.itens_material(id),
  
  -- Descrição
  descricao VARCHAR(200) NOT NULL,
  especificacao TEXT,
  marca VARCHAR(100),
  modelo VARCHAR(100),
  numero_serie VARCHAR(100),
  
  -- Aquisição
  data_aquisicao DATE NOT NULL,
  valor_aquisicao DECIMAL(18,2) NOT NULL,
  nota_fiscal VARCHAR(50),
  empenho_id UUID REFERENCES public.empenhos(id),
  fornecedor_id UUID REFERENCES public.fornecedores(id),
  
  -- Localização atual
  unidade_id UUID REFERENCES public.estrutura_organizacional(id),
  unidade_local_id UUID REFERENCES public.unidades_locais(id),
  responsavel_id UUID REFERENCES public.servidores(id),
  localizacao_especifica TEXT,
  
  -- Depreciação
  valor_residual DECIMAL(18,2),
  depreciacao_acumulada DECIMAL(18,2) DEFAULT 0,
  valor_liquido DECIMAL(18,2) GENERATED ALWAYS AS (valor_aquisicao - COALESCE(depreciacao_acumulada, 0)) STORED,
  
  -- Estado
  estado_conservacao VARCHAR(30) CHECK (estado_conservacao IN ('otimo', 'bom', 'regular', 'ruim', 'inservivel')),
  situacao VARCHAR(30) DEFAULT 'ativo' CHECK (situacao IN ('ativo', 'em_manutencao', 'cedido', 'baixado', 'extraviado', 'em_transferencia')),
  
  -- Garantia
  garantia_ate DATE,
  
  observacao TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- Tabela de Movimentações de Bens
CREATE TABLE IF NOT EXISTS public.movimentacoes_bem (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bem_id UUID REFERENCES public.bens_patrimoniais(id) ON DELETE CASCADE NOT NULL,
  tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('transferencia', 'cessao', 'manutencao', 'baixa', 'reavaliacao', 'inventario')),
  
  -- Origem e destino
  unidade_origem_id UUID REFERENCES public.estrutura_organizacional(id),
  unidade_destino_id UUID REFERENCES public.estrutura_organizacional(id),
  responsavel_origem_id UUID REFERENCES public.servidores(id),
  responsavel_destino_id UUID REFERENCES public.servidores(id),
  
  -- Datas
  data_movimentacao DATE NOT NULL,
  data_previsao_retorno DATE,
  data_retorno DATE,
  
  -- Valores (para reavaliações e baixas)
  valor_anterior DECIMAL(18,2),
  valor_novo DECIMAL(18,2),
  
  -- Documentação
  numero_termo VARCHAR(30),
  motivo TEXT,
  observacao TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- ============================================================
-- TRIGGERS DE ATUALIZAÇÃO AUTOMÁTICA
-- ============================================================

-- Triggers para updated_at
CREATE TRIGGER handle_programas_updated_at BEFORE UPDATE ON public.programas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_acoes_updated_at BEFORE UPDATE ON public.acoes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_dotacoes_updated_at BEFORE UPDATE ON public.dotacoes_orcamentarias
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_empenhos_updated_at BEFORE UPDATE ON public.empenhos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_liquidacoes_updated_at BEFORE UPDATE ON public.liquidacoes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_itens_material_updated_at BEFORE UPDATE ON public.itens_material
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_bens_updated_at BEFORE UPDATE ON public.bens_patrimoniais
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- FUNÇÃO: Atualizar saldo de dotação ao empenhar
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_atualizar_saldo_dotacao()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.dotacoes_orcamentarias
    SET valor_empenhado = valor_empenhado + NEW.valor_empenhado
    WHERE id = NEW.dotacao_id;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.dotacoes_orcamentarias
    SET valor_empenhado = valor_empenhado - OLD.valor_empenhado + NEW.valor_empenhado
    WHERE id = NEW.dotacao_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.dotacoes_orcamentarias
    SET valor_empenhado = valor_empenhado - OLD.valor_empenhado
    WHERE id = OLD.dotacao_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_empenho_atualiza_dotacao
  AFTER INSERT OR UPDATE OR DELETE ON public.empenhos
  FOR EACH ROW EXECUTE FUNCTION public.fn_atualizar_saldo_dotacao();

-- ============================================================
-- FUNÇÃO: Atualizar saldo de estoque
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_atualizar_estoque()
RETURNS TRIGGER AS $$
DECLARE
  v_multiplicador INTEGER;
BEGIN
  -- Determinar se é entrada ou saída
  IF NEW.tipo IN ('entrada', 'devolucao') THEN
    v_multiplicador := 1;
  ELSIF NEW.tipo IN ('saida') THEN
    v_multiplicador := -1;
  ELSIF NEW.tipo = 'ajuste' THEN
    v_multiplicador := CASE WHEN NEW.quantidade > 0 THEN 1 ELSE -1 END;
  ELSE
    v_multiplicador := 0;
  END IF;

  -- Upsert no estoque
  INSERT INTO public.estoque (item_id, almoxarifado_id, quantidade, valor_total, ultima_movimentacao)
  VALUES (
    NEW.item_id, 
    NEW.almoxarifado_id, 
    ABS(NEW.quantidade) * v_multiplicador, 
    COALESCE(NEW.valor_total, 0) * v_multiplicador,
    now()
  )
  ON CONFLICT (item_id, almoxarifado_id) DO UPDATE SET
    quantidade = public.estoque.quantidade + (ABS(NEW.quantidade) * v_multiplicador),
    valor_total = public.estoque.valor_total + (COALESCE(NEW.valor_total, 0) * v_multiplicador),
    ultima_movimentacao = now();

  -- Se for transferência, dar baixa no almoxarifado destino (entrada)
  IF NEW.tipo = 'transferencia' AND NEW.almoxarifado_destino_id IS NOT NULL THEN
    INSERT INTO public.estoque (item_id, almoxarifado_id, quantidade, valor_total, ultima_movimentacao)
    VALUES (
      NEW.item_id, 
      NEW.almoxarifado_destino_id, 
      ABS(NEW.quantidade), 
      COALESCE(NEW.valor_total, 0),
      now()
    )
    ON CONFLICT (item_id, almoxarifado_id) DO UPDATE SET
      quantidade = public.estoque.quantidade + ABS(NEW.quantidade),
      valor_total = public.estoque.valor_total + COALESCE(NEW.valor_total, 0),
      ultima_movimentacao = now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_movimentacao_atualiza_estoque
  AFTER INSERT ON public.movimentacoes_estoque
  FOR EACH ROW EXECUTE FUNCTION public.fn_atualizar_estoque();

-- ============================================================
-- AUDITORIA - APLICAR TRIGGERS
-- ============================================================

CREATE TRIGGER audit_programas AFTER INSERT OR UPDATE OR DELETE ON public.programas
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();

CREATE TRIGGER audit_acoes AFTER INSERT OR UPDATE OR DELETE ON public.acoes
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();

CREATE TRIGGER audit_dotacoes AFTER INSERT OR UPDATE OR DELETE ON public.dotacoes_orcamentarias
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();

CREATE TRIGGER audit_empenhos AFTER INSERT OR UPDATE OR DELETE ON public.empenhos
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();

CREATE TRIGGER audit_liquidacoes AFTER INSERT OR UPDATE OR DELETE ON public.liquidacoes
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();

CREATE TRIGGER audit_pagamentos AFTER INSERT OR UPDATE OR DELETE ON public.pagamentos
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();

CREATE TRIGGER audit_bens AFTER INSERT OR UPDATE OR DELETE ON public.bens_patrimoniais
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();

CREATE TRIGGER audit_movimentacoes_bem AFTER INSERT OR UPDATE OR DELETE ON public.movimentacoes_bem
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();

CREATE TRIGGER audit_movimentacoes_estoque AFTER INSERT OR UPDATE OR DELETE ON public.movimentacoes_estoque
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();

-- ============================================================
-- RLS - HABILITAR EM TODAS AS TABELAS
-- ============================================================

ALTER TABLE public.programas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dotacoes_orcamentarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creditos_adicionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empenhos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liquidacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_material ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_material ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.almoxarifados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bens_patrimoniais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_bem ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES - LEITURA PARA AUTENTICADOS
-- ============================================================

CREATE POLICY "programas_select" ON public.programas FOR SELECT TO authenticated USING (true);
CREATE POLICY "acoes_select" ON public.acoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "dotacoes_select" ON public.dotacoes_orcamentarias FOR SELECT TO authenticated USING (true);
CREATE POLICY "creditos_select" ON public.creditos_adicionais FOR SELECT TO authenticated USING (true);
CREATE POLICY "empenhos_select" ON public.empenhos FOR SELECT TO authenticated USING (true);
CREATE POLICY "liquidacoes_select" ON public.liquidacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "pagamentos_select" ON public.pagamentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "categorias_material_select" ON public.categorias_material FOR SELECT TO authenticated USING (true);
CREATE POLICY "itens_material_select" ON public.itens_material FOR SELECT TO authenticated USING (true);
CREATE POLICY "almoxarifados_select" ON public.almoxarifados FOR SELECT TO authenticated USING (true);
CREATE POLICY "estoque_select" ON public.estoque FOR SELECT TO authenticated USING (true);
CREATE POLICY "movimentacoes_estoque_select" ON public.movimentacoes_estoque FOR SELECT TO authenticated USING (true);
CREATE POLICY "bens_select" ON public.bens_patrimoniais FOR SELECT TO authenticated USING (true);
CREATE POLICY "movimentacoes_bem_select" ON public.movimentacoes_bem FOR SELECT TO authenticated USING (true);

-- ============================================================
-- RLS POLICIES - ESCRITA PARA ADMINS
-- ============================================================

CREATE POLICY "programas_all" ON public.programas FOR ALL TO authenticated USING (public.usuario_eh_admin(auth.uid()));
CREATE POLICY "acoes_all" ON public.acoes FOR ALL TO authenticated USING (public.usuario_eh_admin(auth.uid()));
CREATE POLICY "dotacoes_all" ON public.dotacoes_orcamentarias FOR ALL TO authenticated USING (public.usuario_eh_admin(auth.uid()));
CREATE POLICY "creditos_all" ON public.creditos_adicionais FOR ALL TO authenticated USING (public.usuario_eh_admin(auth.uid()));
CREATE POLICY "empenhos_all" ON public.empenhos FOR ALL TO authenticated USING (public.usuario_eh_admin(auth.uid()));
CREATE POLICY "liquidacoes_all" ON public.liquidacoes FOR ALL TO authenticated USING (public.usuario_eh_admin(auth.uid()));
CREATE POLICY "pagamentos_all" ON public.pagamentos FOR ALL TO authenticated USING (public.usuario_eh_admin(auth.uid()));
CREATE POLICY "categorias_material_all" ON public.categorias_material FOR ALL TO authenticated USING (public.usuario_eh_admin(auth.uid()));
CREATE POLICY "itens_material_all" ON public.itens_material FOR ALL TO authenticated USING (public.usuario_eh_admin(auth.uid()));
CREATE POLICY "almoxarifados_all" ON public.almoxarifados FOR ALL TO authenticated USING (public.usuario_eh_admin(auth.uid()));
CREATE POLICY "estoque_all" ON public.estoque FOR ALL TO authenticated USING (public.usuario_eh_admin(auth.uid()));
CREATE POLICY "movimentacoes_estoque_all" ON public.movimentacoes_estoque FOR ALL TO authenticated USING (public.usuario_eh_admin(auth.uid()));
CREATE POLICY "bens_all" ON public.bens_patrimoniais FOR ALL TO authenticated USING (public.usuario_eh_admin(auth.uid()));
CREATE POLICY "movimentacoes_bem_all" ON public.movimentacoes_bem FOR ALL TO authenticated USING (public.usuario_eh_admin(auth.uid()));

-- ============================================================
-- ÍNDICES DE PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_programas_situacao ON public.programas(situacao);
CREATE INDEX IF NOT EXISTS idx_acoes_programa ON public.acoes(programa_id);
CREATE INDEX IF NOT EXISTS idx_acoes_processo ON public.acoes(processo_licitatorio_id);
CREATE INDEX IF NOT EXISTS idx_dotacoes_exercicio ON public.dotacoes_orcamentarias(exercicio);
CREATE INDEX IF NOT EXISTS idx_dotacoes_classificacao ON public.dotacoes_orcamentarias(classificacao_completa);
CREATE INDEX IF NOT EXISTS idx_empenhos_dotacao ON public.empenhos(dotacao_id);
CREATE INDEX IF NOT EXISTS idx_empenhos_contrato ON public.empenhos(contrato_id);
CREATE INDEX IF NOT EXISTS idx_empenhos_fornecedor ON public.empenhos(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_empenhos_exercicio ON public.empenhos(exercicio);
CREATE INDEX IF NOT EXISTS idx_liquidacoes_empenho ON public.liquidacoes(empenho_id);
CREATE INDEX IF NOT EXISTS idx_liquidacoes_medicao ON public.liquidacoes(medicao_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_liquidacao ON public.pagamentos(liquidacao_id);
CREATE INDEX IF NOT EXISTS idx_itens_material_categoria ON public.itens_material(categoria_id);
CREATE INDEX IF NOT EXISTS idx_estoque_item ON public.estoque(item_id);
CREATE INDEX IF NOT EXISTS idx_estoque_almoxarifado ON public.estoque(almoxarifado_id);
CREATE INDEX IF NOT EXISTS idx_movest_item ON public.movimentacoes_estoque(item_id);
CREATE INDEX IF NOT EXISTS idx_movest_almox ON public.movimentacoes_estoque(almoxarifado_id);
CREATE INDEX IF NOT EXISTS idx_bens_situacao ON public.bens_patrimoniais(situacao);
CREATE INDEX IF NOT EXISTS idx_bens_unidade ON public.bens_patrimoniais(unidade_id);
CREATE INDEX IF NOT EXISTS idx_bens_responsavel ON public.bens_patrimoniais(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_movbem_bem ON public.movimentacoes_bem(bem_id);