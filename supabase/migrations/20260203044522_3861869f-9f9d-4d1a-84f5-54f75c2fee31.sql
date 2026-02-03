-- ============================================
-- MÓDULO DE INVENTÁRIO IDJuv - SISTEMA COMPLETO
-- Extensão das tabelas de patrimônio e almoxarifado
-- ============================================

-- ============================================
-- 1. ENUMS ADICIONAIS
-- ============================================

-- Situação do bem patrimonial (estender)
DO $$ BEGIN
  CREATE TYPE situacao_bem_patrimonio AS ENUM (
    'cadastrado',
    'tombado',
    'alocado',
    'em_manutencao',
    'baixado',
    'extraviado'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Forma de aquisição
DO $$ BEGIN
  CREATE TYPE forma_aquisicao AS ENUM (
    'compra',
    'doacao',
    'cessao',
    'transferencia'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Categoria do bem
DO $$ BEGIN
  CREATE TYPE categoria_bem AS ENUM (
    'mobiliario',
    'informatica',
    'equipamento_esportivo',
    'veiculo',
    'eletrodomestico',
    'outros'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Estado de conservação (padronizado)
DO $$ BEGIN
  CREATE TYPE estado_conservacao_inventario AS ENUM (
    'novo',
    'bom',
    'regular',
    'ruim',
    'inservivel'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tipo de movimentação patrimonial
DO $$ BEGIN
  CREATE TYPE tipo_movimentacao_patrimonio AS ENUM (
    'transferencia_interna',
    'cessao',
    'emprestimo',
    'recolhimento'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Status de movimentação
DO $$ BEGIN
  CREATE TYPE status_movimentacao_patrimonio AS ENUM (
    'pendente',
    'aprovado',
    'rejeitado',
    'concluido'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tipo de manutenção
DO $$ BEGIN
  CREATE TYPE tipo_manutencao AS ENUM (
    'preventiva',
    'corretiva'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tipo de ocorrência
DO $$ BEGIN
  CREATE TYPE tipo_ocorrencia_patrimonio AS ENUM (
    'dano',
    'extravio',
    'sinistro'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tipo de campanha de inventário
DO $$ BEGIN
  CREATE TYPE tipo_campanha_inventario AS ENUM (
    'geral',
    'setorial',
    'rotativo'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Status da coleta no inventário
DO $$ BEGIN
  CREATE TYPE status_coleta_inventario AS ENUM (
    'conferido',
    'nao_localizado',
    'divergente',
    'avariado',
    'em_manutencao'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Motivo de baixa
DO $$ BEGIN
  CREATE TYPE motivo_baixa_patrimonio AS ENUM (
    'inservivel',
    'obsoleto',
    'doacao',
    'alienacao',
    'perda'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 2. EXTENSÃO DA TABELA bens_patrimoniais
-- ============================================

ALTER TABLE bens_patrimoniais
  ADD COLUMN IF NOT EXISTS codigo_qr TEXT,
  ADD COLUMN IF NOT EXISTS situacao_inventario situacao_bem_patrimonio DEFAULT 'cadastrado',
  ADD COLUMN IF NOT EXISTS categoria_bem categoria_bem,
  ADD COLUMN IF NOT EXISTS subcategoria TEXT,
  ADD COLUMN IF NOT EXISTS patrimonio_anterior TEXT,
  ADD COLUMN IF NOT EXISTS forma_aquisicao forma_aquisicao DEFAULT 'compra',
  ADD COLUMN IF NOT EXISTS fornecedor_cnpj_cpf TEXT,
  ADD COLUMN IF NOT EXISTS data_nota_fiscal DATE,
  ADD COLUMN IF NOT EXISTS processo_sei TEXT,
  ADD COLUMN IF NOT EXISTS fonte_recurso_id UUID,
  ADD COLUMN IF NOT EXISTS centro_custo_id UUID,
  ADD COLUMN IF NOT EXISTS estado_conservacao_inventario estado_conservacao_inventario DEFAULT 'bom',
  ADD COLUMN IF NOT EXISTS vida_util_anos INTEGER,
  ADD COLUMN IF NOT EXISTS data_ultima_avaliacao DATE,
  ADD COLUMN IF NOT EXISTS predio TEXT,
  ADD COLUMN IF NOT EXISTS andar TEXT,
  ADD COLUMN IF NOT EXISTS sala TEXT,
  ADD COLUMN IF NOT EXISTS ponto_especifico TEXT,
  ADD COLUMN IF NOT EXISTS cargo_responsavel TEXT,
  ADD COLUMN IF NOT EXISTS setor_responsavel_id UUID,
  ADD COLUMN IF NOT EXISTS data_atribuicao_responsabilidade DATE,
  ADD COLUMN IF NOT EXISTS termo_responsabilidade_url TEXT,
  ADD COLUMN IF NOT EXISTS foto_bem_url TEXT,
  ADD COLUMN IF NOT EXISTS foto_etiqueta_qr_url TEXT,
  ADD COLUMN IF NOT EXISTS pendencias JSONB DEFAULT '[]'::jsonb;

-- Índices para buscas
CREATE INDEX IF NOT EXISTS idx_bens_codigo_qr ON bens_patrimoniais(codigo_qr);
CREATE INDEX IF NOT EXISTS idx_bens_situacao_inventario ON bens_patrimoniais(situacao_inventario);
CREATE INDEX IF NOT EXISTS idx_bens_categoria ON bens_patrimoniais(categoria_bem);

-- ============================================
-- 3. MOVIMENTAÇÕES DE PATRIMÔNIO
-- ============================================

CREATE TABLE IF NOT EXISTS movimentacoes_patrimonio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bem_id UUID NOT NULL REFERENCES bens_patrimoniais(id),
  tipo tipo_movimentacao_patrimonio NOT NULL,
  data_movimentacao DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Origem
  unidade_origem_id UUID REFERENCES estrutura_organizacional(id),
  setor_origem TEXT,
  sala_origem TEXT,
  responsavel_origem_id UUID REFERENCES servidores(id),
  
  -- Destino
  unidade_destino_id UUID REFERENCES estrutura_organizacional(id),
  setor_destino TEXT,
  sala_destino TEXT,
  responsavel_destino_id UUID REFERENCES servidores(id),
  
  -- Justificativa
  motivo TEXT NOT NULL,
  observacoes TEXT,
  
  -- Workflow
  solicitado_por UUID REFERENCES auth.users(id),
  data_solicitacao TIMESTAMPTZ DEFAULT NOW(),
  aprovado_por UUID REFERENCES auth.users(id),
  data_aprovacao TIMESTAMPTZ,
  status status_movimentacao_patrimonio DEFAULT 'pendente',
  motivo_rejeicao TEXT,
  
  -- Documentos
  termo_transferencia_url TEXT,
  aceite_responsavel BOOLEAN DEFAULT FALSE,
  data_aceite TIMESTAMPTZ,
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_mov_patrimonio_bem ON movimentacoes_patrimonio(bem_id);
CREATE INDEX idx_mov_patrimonio_status ON movimentacoes_patrimonio(status);
CREATE INDEX idx_mov_patrimonio_data ON movimentacoes_patrimonio(data_movimentacao);

-- ============================================
-- 4. MANUTENÇÕES DE PATRIMÔNIO
-- ============================================

CREATE TABLE IF NOT EXISTS manutencoes_patrimonio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bem_id UUID NOT NULL REFERENCES bens_patrimoniais(id),
  tipo tipo_manutencao NOT NULL,
  data_abertura DATE NOT NULL DEFAULT CURRENT_DATE,
  
  descricao_problema TEXT NOT NULL,
  fornecedor_id UUID REFERENCES fornecedores(id),
  fornecedor_externo TEXT,
  
  custo_estimado NUMERIC(12,2),
  custo_final NUMERIC(12,2),
  
  data_inicio DATE,
  data_conclusao DATE,
  status TEXT DEFAULT 'aberta' CHECK (status IN ('aberta', 'em_andamento', 'concluida', 'cancelada')),
  
  laudo_url TEXT,
  nota_fiscal_url TEXT,
  fotos_urls JSONB DEFAULT '[]'::jsonb,
  observacoes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_manut_patrimonio_bem ON manutencoes_patrimonio(bem_id);
CREATE INDEX idx_manut_patrimonio_status ON manutencoes_patrimonio(status);

-- ============================================
-- 5. OCORRÊNCIAS DE PATRIMÔNIO
-- ============================================

CREATE TABLE IF NOT EXISTS ocorrencias_patrimonio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bem_id UUID NOT NULL REFERENCES bens_patrimoniais(id),
  tipo tipo_ocorrencia_patrimonio NOT NULL,
  data_fato DATE NOT NULL,
  
  relato_detalhado TEXT NOT NULL,
  responsavel_relato_id UUID REFERENCES servidores(id),
  
  providencias_adotadas TEXT,
  encaminhamento TEXT,
  
  anexos_urls JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_ocorr_patrimonio_bem ON ocorrencias_patrimonio(bem_id);
CREATE INDEX idx_ocorr_patrimonio_tipo ON ocorrencias_patrimonio(tipo);

-- ============================================
-- 6. CAMPANHAS DE INVENTÁRIO
-- ============================================

CREATE TABLE IF NOT EXISTS campanhas_inventario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  ano INTEGER NOT NULL,
  tipo tipo_campanha_inventario NOT NULL DEFAULT 'geral',
  
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  
  unidades_abrangidas UUID[] DEFAULT '{}',
  responsavel_geral_id UUID REFERENCES servidores(id),
  equipe_coleta UUID[] DEFAULT '{}',
  
  status TEXT DEFAULT 'planejada' CHECK (status IN ('planejada', 'em_andamento', 'concluida', 'cancelada')),
  observacoes TEXT,
  
  -- Estatísticas (atualizadas por trigger)
  total_bens_esperados INTEGER DEFAULT 0,
  total_conferidos INTEGER DEFAULT 0,
  total_divergencias INTEGER DEFAULT 0,
  percentual_conclusao NUMERIC(5,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_campanhas_ano ON campanhas_inventario(ano);
CREATE INDEX idx_campanhas_status ON campanhas_inventario(status);

-- ============================================
-- 7. COLETAS DO INVENTÁRIO
-- ============================================

CREATE TABLE IF NOT EXISTS coletas_inventario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id UUID NOT NULL REFERENCES campanhas_inventario(id),
  bem_id UUID NOT NULL REFERENCES bens_patrimoniais(id),
  
  status_coleta status_coleta_inventario NOT NULL DEFAULT 'conferido',
  
  -- Localização encontrada
  localizacao_encontrada_unidade_id UUID REFERENCES estrutura_organizacional(id),
  localizacao_encontrada_sala TEXT,
  localizacao_encontrada_detalhe TEXT,
  
  -- Responsável encontrado
  responsavel_encontrado_id UUID REFERENCES servidores(id),
  
  observacoes TEXT,
  foto_url TEXT,
  
  data_coleta TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  usuario_coletor_id UUID REFERENCES auth.users(id),
  
  -- Dispositivo/metadata
  dispositivo_info JSONB,
  coordenadas_gps JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(campanha_id, bem_id)
);

CREATE INDEX idx_coletas_campanha ON coletas_inventario(campanha_id);
CREATE INDEX idx_coletas_bem ON coletas_inventario(bem_id);
CREATE INDEX idx_coletas_status ON coletas_inventario(status_coleta);

-- ============================================
-- 8. CONCILIAÇÕES DO INVENTÁRIO
-- ============================================

CREATE TABLE IF NOT EXISTS conciliacoes_inventario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coleta_id UUID NOT NULL REFERENCES coletas_inventario(id),
  campanha_id UUID NOT NULL REFERENCES campanhas_inventario(id),
  bem_id UUID NOT NULL REFERENCES bens_patrimoniais(id),
  
  tipo_divergencia TEXT NOT NULL CHECK (tipo_divergencia IN ('localizacao', 'responsavel', 'situacao', 'outro')),
  descricao_divergencia TEXT NOT NULL,
  
  ajuste_proposto TEXT NOT NULL,
  necessita_aprovacao BOOLEAN DEFAULT TRUE,
  
  aprovador_id UUID REFERENCES auth.users(id),
  data_aprovacao TIMESTAMPTZ,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'aplicado')),
  
  observacoes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_conciliacoes_campanha ON conciliacoes_inventario(campanha_id);
CREATE INDEX idx_conciliacoes_status ON conciliacoes_inventario(status);

-- ============================================
-- 9. BAIXAS DE PATRIMÔNIO
-- ============================================

CREATE TABLE IF NOT EXISTS baixas_patrimonio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bem_id UUID NOT NULL REFERENCES bens_patrimoniais(id),
  
  motivo motivo_baixa_patrimonio NOT NULL,
  data_solicitacao DATE NOT NULL DEFAULT CURRENT_DATE,
  justificativa TEXT NOT NULL,
  
  valor_residual NUMERIC(12,2),
  
  comissao_responsavel TEXT,
  
  status TEXT DEFAULT 'solicitada' CHECK (status IN ('solicitada', 'em_analise', 'aprovada', 'rejeitada', 'concluida')),
  
  -- Documentos obrigatórios
  laudo_tecnico_url TEXT,
  autorizacao_url TEXT,
  termo_baixa_url TEXT,
  
  aprovado_por UUID REFERENCES auth.users(id),
  data_aprovacao TIMESTAMPTZ,
  motivo_rejeicao TEXT,
  
  -- Histórico imutável
  dados_bem_snapshot JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_baixas_bem ON baixas_patrimonio(bem_id);
CREATE INDEX idx_baixas_status ON baixas_patrimonio(status);

-- ============================================
-- 10. EXTENSÃO DE ESTOQUE/ALMOXARIFADO
-- ============================================

ALTER TABLE itens_material
  ADD COLUMN IF NOT EXISTS codigo_sku TEXT,
  ADD COLUMN IF NOT EXISTS validade DATE,
  ADD COLUMN IF NOT EXISTS lote TEXT,
  ADD COLUMN IF NOT EXISTS estoque_minimo INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estoque_maximo INTEGER;

-- Requisições de material (saída)
CREATE TABLE IF NOT EXISTS requisicoes_material (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL UNIQUE,
  
  almoxarifado_id UUID REFERENCES almoxarifados(id),
  
  solicitante_id UUID NOT NULL REFERENCES servidores(id),
  setor_solicitante_id UUID REFERENCES estrutura_organizacional(id),
  
  data_solicitacao DATE NOT NULL DEFAULT CURRENT_DATE,
  finalidade TEXT,
  
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'atendida', 'parcialmente_atendida', 'rejeitada', 'cancelada')),
  
  responsavel_entrega_id UUID REFERENCES servidores(id),
  data_entrega DATE,
  assinatura_eletronica_aceite TEXT,
  
  observacoes TEXT,
  anexos_urls JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS requisicao_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requisicao_id UUID NOT NULL REFERENCES requisicoes_material(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES itens_material(id),
  
  quantidade_solicitada INTEGER NOT NULL,
  quantidade_atendida INTEGER DEFAULT 0,
  
  observacoes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sequencial para número de requisição
CREATE SEQUENCE IF NOT EXISTS seq_requisicao_material START 1;

-- Função para gerar número de requisição
CREATE OR REPLACE FUNCTION fn_gerar_numero_requisicao()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_ano INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
  v_seq INTEGER;
BEGIN
  v_seq := nextval('seq_requisicao_material');
  NEW.numero := 'REQ-' || v_ano || '-' || LPAD(v_seq::TEXT, 6, '0');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_gerar_numero_requisicao ON requisicoes_material;
CREATE TRIGGER trg_gerar_numero_requisicao
  BEFORE INSERT ON requisicoes_material
  FOR EACH ROW
  WHEN (NEW.numero IS NULL)
  EXECUTE FUNCTION fn_gerar_numero_requisicao();

-- ============================================
-- 11. SEQUENCIAL PARA TOMBAMENTO
-- ============================================

CREATE SEQUENCE IF NOT EXISTS seq_tombamento_patrimonio START 1;

-- Função para gerar número de tombamento
CREATE OR REPLACE FUNCTION fn_gerar_numero_tombamento()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_ano INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
  v_seq INTEGER;
BEGIN
  IF NEW.numero_patrimonio IS NULL OR NEW.numero_patrimonio = '' THEN
    v_seq := nextval('seq_tombamento_patrimonio');
    NEW.numero_patrimonio := 'PAT-' || v_ano || '-' || LPAD(v_seq::TEXT, 6, '0');
  END IF;
  
  -- Gerar código QR automaticamente
  IF NEW.codigo_qr IS NULL THEN
    NEW.codigo_qr := 'IDJUV-' || NEW.numero_patrimonio || '-' || LEFT(gen_random_uuid()::TEXT, 8);
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_gerar_numero_tombamento ON bens_patrimoniais;
CREATE TRIGGER trg_gerar_numero_tombamento
  BEFORE INSERT ON bens_patrimoniais
  FOR EACH ROW
  EXECUTE FUNCTION fn_gerar_numero_tombamento();

-- ============================================
-- 12. FUNÇÃO PARA ATUALIZAR ESTATÍSTICAS DA CAMPANHA
-- ============================================

CREATE OR REPLACE FUNCTION fn_atualizar_estatisticas_campanha()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_campanha_id UUID;
  v_total_esperados INTEGER;
  v_total_conferidos INTEGER;
  v_total_divergencias INTEGER;
BEGIN
  v_campanha_id := COALESCE(NEW.campanha_id, OLD.campanha_id);
  
  -- Contar bens esperados (simplificado - todos os bens ativos)
  SELECT COUNT(*) INTO v_total_esperados
  FROM bens_patrimoniais
  WHERE situacao IS DISTINCT FROM 'baixado';
  
  -- Contar conferidos
  SELECT COUNT(*) INTO v_total_conferidos
  FROM coletas_inventario
  WHERE campanha_id = v_campanha_id;
  
  -- Contar divergências
  SELECT COUNT(*) INTO v_total_divergencias
  FROM coletas_inventario
  WHERE campanha_id = v_campanha_id
    AND status_coleta IN ('divergente', 'nao_localizado', 'avariado');
  
  UPDATE campanhas_inventario
  SET 
    total_bens_esperados = v_total_esperados,
    total_conferidos = v_total_conferidos,
    total_divergencias = v_total_divergencias,
    percentual_conclusao = CASE 
      WHEN v_total_esperados > 0 THEN ROUND((v_total_conferidos::NUMERIC / v_total_esperados) * 100, 2)
      ELSE 0
    END,
    updated_at = NOW()
  WHERE id = v_campanha_id;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_atualizar_estatisticas_campanha ON coletas_inventario;
CREATE TRIGGER trg_atualizar_estatisticas_campanha
  AFTER INSERT OR UPDATE OR DELETE ON coletas_inventario
  FOR EACH ROW
  EXECUTE FUNCTION fn_atualizar_estatisticas_campanha();

-- ============================================
-- 13. TRIGGERS DE UPDATED_AT
-- ============================================

CREATE TRIGGER update_movimentacoes_patrimonio_updated_at
  BEFORE UPDATE ON movimentacoes_patrimonio
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_manutencoes_patrimonio_updated_at
  BEFORE UPDATE ON manutencoes_patrimonio
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ocorrencias_patrimonio_updated_at
  BEFORE UPDATE ON ocorrencias_patrimonio
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campanhas_inventario_updated_at
  BEFORE UPDATE ON campanhas_inventario
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conciliacoes_inventario_updated_at
  BEFORE UPDATE ON conciliacoes_inventario
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_baixas_patrimonio_updated_at
  BEFORE UPDATE ON baixas_patrimonio
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requisicoes_material_updated_at
  BEFORE UPDATE ON requisicoes_material
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 14. RLS POLICIES
-- ============================================

-- Movimentações
ALTER TABLE movimentacoes_patrimonio ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes_patrimonio FORCE ROW LEVEL SECURITY;

CREATE POLICY "mov_patrimonio_select" ON movimentacoes_patrimonio
  FOR SELECT TO authenticated
  USING (public.usuario_tem_permissao(auth.uid(), 'patrimonio.visualizar'));

CREATE POLICY "mov_patrimonio_insert" ON movimentacoes_patrimonio
  FOR INSERT TO authenticated
  WITH CHECK (public.usuario_tem_permissao(auth.uid(), 'patrimonio.tramitar'));

CREATE POLICY "mov_patrimonio_update" ON movimentacoes_patrimonio
  FOR UPDATE TO authenticated
  USING (public.usuario_tem_permissao(auth.uid(), 'patrimonio.tramitar'));

-- Manutenções
ALTER TABLE manutencoes_patrimonio ENABLE ROW LEVEL SECURITY;
ALTER TABLE manutencoes_patrimonio FORCE ROW LEVEL SECURITY;

CREATE POLICY "manut_patrimonio_select" ON manutencoes_patrimonio
  FOR SELECT TO authenticated
  USING (public.usuario_tem_permissao(auth.uid(), 'patrimonio.visualizar'));

CREATE POLICY "manut_patrimonio_insert" ON manutencoes_patrimonio
  FOR INSERT TO authenticated
  WITH CHECK (public.usuario_tem_permissao(auth.uid(), 'patrimonio.criar'));

CREATE POLICY "manut_patrimonio_update" ON manutencoes_patrimonio
  FOR UPDATE TO authenticated
  USING (public.usuario_tem_permissao(auth.uid(), 'patrimonio.tramitar'));

-- Ocorrências
ALTER TABLE ocorrencias_patrimonio ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocorrencias_patrimonio FORCE ROW LEVEL SECURITY;

CREATE POLICY "ocorr_patrimonio_select" ON ocorrencias_patrimonio
  FOR SELECT TO authenticated
  USING (public.usuario_tem_permissao(auth.uid(), 'patrimonio.visualizar'));

CREATE POLICY "ocorr_patrimonio_insert" ON ocorrencias_patrimonio
  FOR INSERT TO authenticated
  WITH CHECK (public.usuario_tem_permissao(auth.uid(), 'patrimonio.criar'));

-- Campanhas
ALTER TABLE campanhas_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE campanhas_inventario FORCE ROW LEVEL SECURITY;

CREATE POLICY "campanhas_select" ON campanhas_inventario
  FOR SELECT TO authenticated
  USING (public.usuario_tem_permissao(auth.uid(), 'patrimonio.visualizar'));

CREATE POLICY "campanhas_insert" ON campanhas_inventario
  FOR INSERT TO authenticated
  WITH CHECK (public.usuario_tem_permissao(auth.uid(), 'patrimonio.criar'));

CREATE POLICY "campanhas_update" ON campanhas_inventario
  FOR UPDATE TO authenticated
  USING (public.usuario_tem_permissao(auth.uid(), 'patrimonio.tramitar'));

-- Coletas
ALTER TABLE coletas_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE coletas_inventario FORCE ROW LEVEL SECURITY;

CREATE POLICY "coletas_select" ON coletas_inventario
  FOR SELECT TO authenticated
  USING (public.usuario_tem_permissao(auth.uid(), 'patrimonio.visualizar'));

CREATE POLICY "coletas_insert" ON coletas_inventario
  FOR INSERT TO authenticated
  WITH CHECK (public.usuario_tem_permissao(auth.uid(), 'patrimonio.criar'));

CREATE POLICY "coletas_update" ON coletas_inventario
  FOR UPDATE TO authenticated
  USING (public.usuario_tem_permissao(auth.uid(), 'patrimonio.tramitar'));

-- Conciliações
ALTER TABLE conciliacoes_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE conciliacoes_inventario FORCE ROW LEVEL SECURITY;

CREATE POLICY "conciliacoes_select" ON conciliacoes_inventario
  FOR SELECT TO authenticated
  USING (public.usuario_tem_permissao(auth.uid(), 'patrimonio.visualizar'));

CREATE POLICY "conciliacoes_insert" ON conciliacoes_inventario
  FOR INSERT TO authenticated
  WITH CHECK (public.usuario_tem_permissao(auth.uid(), 'patrimonio.criar'));

CREATE POLICY "conciliacoes_update" ON conciliacoes_inventario
  FOR UPDATE TO authenticated
  USING (public.usuario_tem_permissao(auth.uid(), 'patrimonio.tramitar'));

-- Baixas
ALTER TABLE baixas_patrimonio ENABLE ROW LEVEL SECURITY;
ALTER TABLE baixas_patrimonio FORCE ROW LEVEL SECURITY;

CREATE POLICY "baixas_select" ON baixas_patrimonio
  FOR SELECT TO authenticated
  USING (public.usuario_tem_permissao(auth.uid(), 'patrimonio.visualizar'));

CREATE POLICY "baixas_insert" ON baixas_patrimonio
  FOR INSERT TO authenticated
  WITH CHECK (public.usuario_tem_permissao(auth.uid(), 'patrimonio.criar'));

CREATE POLICY "baixas_update" ON baixas_patrimonio
  FOR UPDATE TO authenticated
  USING (public.usuario_tem_permissao(auth.uid(), 'patrimonio.tramitar'));

-- Baixas são imutáveis após aprovação (DELETE bloqueado)
CREATE POLICY "baixas_no_delete" ON baixas_patrimonio
  FOR DELETE TO authenticated
  USING (FALSE);

-- Requisições
ALTER TABLE requisicoes_material ENABLE ROW LEVEL SECURITY;
ALTER TABLE requisicoes_material FORCE ROW LEVEL SECURITY;

CREATE POLICY "requisicoes_select" ON requisicoes_material
  FOR SELECT TO authenticated
  USING (public.usuario_tem_permissao(auth.uid(), 'patrimonio.visualizar'));

CREATE POLICY "requisicoes_insert" ON requisicoes_material
  FOR INSERT TO authenticated
  WITH CHECK (public.usuario_tem_permissao(auth.uid(), 'patrimonio.criar'));

CREATE POLICY "requisicoes_update" ON requisicoes_material
  FOR UPDATE TO authenticated
  USING (public.usuario_tem_permissao(auth.uid(), 'patrimonio.tramitar'));

ALTER TABLE requisicao_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE requisicao_itens FORCE ROW LEVEL SECURITY;

CREATE POLICY "req_itens_select" ON requisicao_itens
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM requisicoes_material r
    WHERE r.id = requisicao_itens.requisicao_id
    AND public.usuario_tem_permissao(auth.uid(), 'patrimonio.visualizar')
  ));

CREATE POLICY "req_itens_insert" ON requisicao_itens
  FOR INSERT TO authenticated
  WITH CHECK (public.usuario_tem_permissao(auth.uid(), 'patrimonio.criar'));

-- ============================================
-- 15. STORAGE BUCKET PARA DOCUMENTOS
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('patrimonio-docs', 'patrimonio-docs', false, 10485760)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage
CREATE POLICY "patrimonio_docs_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'patrimonio-docs' AND public.usuario_tem_permissao(auth.uid(), 'patrimonio.visualizar'));

CREATE POLICY "patrimonio_docs_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'patrimonio-docs' AND public.usuario_tem_permissao(auth.uid(), 'patrimonio.criar'));

CREATE POLICY "patrimonio_docs_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'patrimonio-docs' AND public.usuario_tem_permissao(auth.uid(), 'patrimonio.tramitar'));

-- ============================================
-- 16. VIEW RESUMO PARA DASHBOARD
-- ============================================

CREATE OR REPLACE VIEW v_resumo_patrimonio AS
SELECT
  COUNT(*) AS total_bens,
  COUNT(*) FILTER (WHERE situacao_inventario = 'alocado') AS bens_alocados,
  COUNT(*) FILTER (WHERE situacao_inventario = 'em_manutencao') AS bens_manutencao,
  COUNT(*) FILTER (WHERE situacao_inventario = 'baixado') AS bens_baixados,
  COUNT(*) FILTER (WHERE estado_conservacao_inventario = 'bom' OR estado_conservacao_inventario = 'novo') AS bens_bom_estado,
  COUNT(*) FILTER (WHERE estado_conservacao_inventario IN ('ruim', 'inservivel')) AS bens_atencao,
  SUM(valor_aquisicao) AS valor_total_aquisicao,
  SUM(COALESCE(valor_liquido, valor_aquisicao - COALESCE(depreciacao_acumulada, 0))) AS valor_total_liquido
FROM bens_patrimoniais
WHERE situacao IS DISTINCT FROM 'baixado';

GRANT SELECT ON v_resumo_patrimonio TO authenticated;