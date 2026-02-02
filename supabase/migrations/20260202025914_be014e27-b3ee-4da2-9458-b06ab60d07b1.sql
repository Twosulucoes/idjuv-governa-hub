
-- =============================================
-- FASE 6: WORKFLOW ADMINISTRATIVO FORMAL (SEI-LIKE)
-- Módulo transversal de tramitação de processos
-- MIGRAÇÃO CORRIGIDA
-- =============================================

-- ============================================
-- 1. ENUMS
-- ============================================

DO $$ BEGIN CREATE TYPE tipo_processo_administrativo AS ENUM ('compra', 'licitacao', 'rh', 'patrimonio', 'lai', 'governanca', 'convenio', 'diaria', 'viagem', 'federacao', 'outro'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE status_processo_administrativo AS ENUM ('aberto', 'em_tramitacao', 'suspenso', 'concluido', 'arquivado'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE nivel_sigilo_processo AS ENUM ('publico', 'restrito', 'sigiloso'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE tipo_movimentacao_processo AS ENUM ('despacho', 'encaminhamento', 'juntada', 'decisao', 'informacao', 'ciencia', 'devolucao'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE status_movimentacao_processo AS ENUM ('pendente', 'recebido', 'respondido', 'vencido', 'cancelado'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE tipo_despacho AS ENUM ('simples', 'decisorio', 'conclusivo'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE decisao_despacho AS ENUM ('deferido', 'indeferido', 'parcialmente_deferido', 'encaminhar', 'arquivar', 'suspender', 'informar'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE tipo_documento_processo AS ENUM ('oficio', 'nota_tecnica', 'parecer', 'despacho', 'anexo', 'requerimento', 'declaracao', 'certidao', 'outro'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE referencia_prazo_processo AS ENUM ('legal', 'interno', 'judicial', 'contratual', 'regulamentar'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================
-- 2. TABELAS PRINCIPAIS
-- ============================================

CREATE TABLE IF NOT EXISTS public.processos_administrativos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_processo TEXT NOT NULL,
  ano INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
  tipo_processo tipo_processo_administrativo NOT NULL DEFAULT 'outro',
  assunto TEXT NOT NULL,
  descricao TEXT,
  interessado_tipo TEXT NOT NULL DEFAULT 'interno' CHECK (interessado_tipo IN ('interno', 'externo')),
  interessado_nome TEXT NOT NULL,
  interessado_documento TEXT,
  unidade_origem_id UUID REFERENCES public.estrutura_organizacional(id),
  status status_processo_administrativo NOT NULL DEFAULT 'aberto',
  sigilo nivel_sigilo_processo NOT NULL DEFAULT 'publico',
  data_abertura DATE NOT NULL DEFAULT CURRENT_DATE,
  data_encerramento DATE,
  processo_origem_id UUID REFERENCES public.processos_administrativos(id),
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  CONSTRAINT processos_administrativos_numero_ano_unique UNIQUE (numero_processo, ano)
);

CREATE TABLE IF NOT EXISTS public.movimentacoes_processo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id UUID NOT NULL REFERENCES public.processos_administrativos(id) ON DELETE CASCADE,
  numero_sequencial INTEGER NOT NULL DEFAULT 1,
  tipo_movimentacao tipo_movimentacao_processo NOT NULL DEFAULT 'encaminhamento',
  descricao TEXT NOT NULL,
  unidade_origem_id UUID REFERENCES public.estrutura_organizacional(id),
  unidade_destino_id UUID REFERENCES public.estrutura_organizacional(id),
  servidor_origem_id UUID REFERENCES public.servidores(id),
  servidor_destino_id UUID REFERENCES public.servidores(id),
  prazo_dias INTEGER,
  prazo_limite DATE,
  status status_movimentacao_processo NOT NULL DEFAULT 'pendente',
  data_recebimento TIMESTAMPTZ,
  data_resposta TIMESTAMPTZ,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.despachos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id UUID NOT NULL REFERENCES public.processos_administrativos(id) ON DELETE CASCADE,
  movimentacao_id UUID REFERENCES public.movimentacoes_processo(id),
  numero_despacho INTEGER NOT NULL DEFAULT 1,
  texto_despacho TEXT NOT NULL,
  tipo_despacho tipo_despacho NOT NULL DEFAULT 'simples',
  fundamentacao_legal TEXT,
  decisao decisao_despacho,
  autoridade_id UUID REFERENCES public.servidores(id),
  data_despacho DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.documentos_processo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id UUID NOT NULL REFERENCES public.processos_administrativos(id) ON DELETE CASCADE,
  tipo_documento tipo_documento_processo NOT NULL DEFAULT 'anexo',
  numero_documento TEXT,
  titulo TEXT NOT NULL,
  conteudo_textual TEXT,
  arquivo_url TEXT,
  arquivo_nome TEXT,
  arquivo_tamanho INTEGER,
  hash_sha256 TEXT,
  sigilo nivel_sigilo_processo NOT NULL DEFAULT 'publico',
  ordem INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.prazos_processo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id UUID NOT NULL REFERENCES public.processos_administrativos(id) ON DELETE CASCADE,
  referencia referencia_prazo_processo NOT NULL DEFAULT 'interno',
  descricao TEXT NOT NULL,
  base_legal TEXT,
  prazo_dias INTEGER NOT NULL,
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_limite DATE NOT NULL,
  cumprido BOOLEAN NOT NULL DEFAULT FALSE,
  data_cumprimento DATE,
  responsavel_id UUID REFERENCES public.servidores(id),
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.acesso_processo_sigiloso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id UUID NOT NULL REFERENCES public.processos_administrativos(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES auth.users(id),
  nivel_acesso TEXT NOT NULL DEFAULT 'leitura' CHECK (nivel_acesso IN ('leitura', 'tramitacao', 'total')),
  motivo TEXT,
  concedido_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT acesso_sigiloso_unique UNIQUE (processo_id, usuario_id)
);

-- ============================================
-- 3. ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_processos_admin_tipo ON public.processos_administrativos(tipo_processo);
CREATE INDEX IF NOT EXISTS idx_processos_admin_status ON public.processos_administrativos(status);
CREATE INDEX IF NOT EXISTS idx_processos_admin_unidade ON public.processos_administrativos(unidade_origem_id);
CREATE INDEX IF NOT EXISTS idx_processos_admin_data ON public.processos_administrativos(data_abertura);
CREATE INDEX IF NOT EXISTS idx_processos_admin_sigilo ON public.processos_administrativos(sigilo);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_processo_id ON public.movimentacoes_processo(processo_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_status ON public.movimentacoes_processo(status);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_destino ON public.movimentacoes_processo(unidade_destino_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_servidor_destino ON public.movimentacoes_processo(servidor_destino_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_prazo ON public.movimentacoes_processo(prazo_limite);
CREATE INDEX IF NOT EXISTS idx_despachos_processo ON public.despachos(processo_id);
CREATE INDEX IF NOT EXISTS idx_despachos_tipo ON public.despachos(tipo_despacho);
CREATE INDEX IF NOT EXISTS idx_despachos_autoridade ON public.despachos(autoridade_id);
CREATE INDEX IF NOT EXISTS idx_documentos_processo_id ON public.documentos_processo(processo_id);
CREATE INDEX IF NOT EXISTS idx_documentos_tipo ON public.documentos_processo(tipo_documento);
CREATE INDEX IF NOT EXISTS idx_prazos_processo_id ON public.prazos_processo(processo_id);
CREATE INDEX IF NOT EXISTS idx_prazos_data_limite ON public.prazos_processo(data_limite);
CREATE INDEX IF NOT EXISTS idx_prazos_cumprido ON public.prazos_processo(cumprido);
CREATE INDEX IF NOT EXISTS idx_acesso_sigiloso_processo ON public.acesso_processo_sigiloso(processo_id);
CREATE INDEX IF NOT EXISTS idx_acesso_sigiloso_usuario ON public.acesso_processo_sigiloso(usuario_id);

-- ============================================
-- 4. FUNÇÕES DE NEGÓCIO
-- ============================================

CREATE OR REPLACE FUNCTION public.gerar_numero_processo()
RETURNS TRIGGER AS $$
DECLARE v_ano INTEGER; v_sequencial INTEGER;
BEGIN
  v_ano := COALESCE(NEW.ano, EXTRACT(YEAR FROM NOW())::INTEGER);
  SELECT COALESCE(MAX(CASE WHEN numero_processo ~ '^\d+$' THEN numero_processo::INTEGER ELSE 0 END), 0) + 1 INTO v_sequencial FROM public.processos_administrativos WHERE ano = v_ano;
  NEW.numero_processo := LPAD(v_sequencial::TEXT, 5, '0'); NEW.ano := v_ano;
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.verificar_arquivamento_processo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'arquivado' AND OLD.status != 'arquivado' THEN
    IF NOT EXISTS (SELECT 1 FROM public.despachos WHERE processo_id = NEW.id AND tipo_despacho = 'conclusivo') THEN
      RAISE EXCEPTION 'Processo não pode ser arquivado sem despacho conclusivo';
    END IF;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.numerar_despacho()
RETURNS TRIGGER AS $$
BEGIN
  SELECT COALESCE(MAX(numero_despacho), 0) + 1 INTO NEW.numero_despacho FROM public.despachos WHERE processo_id = NEW.processo_id;
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.numerar_movimentacao()
RETURNS TRIGGER AS $$
BEGIN
  SELECT COALESCE(MAX(numero_sequencial), 0) + 1 INTO NEW.numero_sequencial FROM public.movimentacoes_processo WHERE processo_id = NEW.processo_id;
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- 5. TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS tr_gerar_numero_processo ON public.processos_administrativos;
CREATE TRIGGER tr_gerar_numero_processo BEFORE INSERT ON public.processos_administrativos FOR EACH ROW WHEN (NEW.numero_processo IS NULL OR NEW.numero_processo = '') EXECUTE FUNCTION public.gerar_numero_processo();

DROP TRIGGER IF EXISTS tr_verificar_arquivamento ON public.processos_administrativos;
CREATE TRIGGER tr_verificar_arquivamento BEFORE UPDATE ON public.processos_administrativos FOR EACH ROW EXECUTE FUNCTION public.verificar_arquivamento_processo();

DROP TRIGGER IF EXISTS tr_numerar_despacho ON public.despachos;
CREATE TRIGGER tr_numerar_despacho BEFORE INSERT ON public.despachos FOR EACH ROW WHEN (NEW.numero_despacho IS NULL OR NEW.numero_despacho = 0) EXECUTE FUNCTION public.numerar_despacho();

DROP TRIGGER IF EXISTS tr_numerar_movimentacao ON public.movimentacoes_processo;
CREATE TRIGGER tr_numerar_movimentacao BEFORE INSERT ON public.movimentacoes_processo FOR EACH ROW WHEN (NEW.numero_sequencial IS NULL OR NEW.numero_sequencial = 0) EXECUTE FUNCTION public.numerar_movimentacao();

DROP TRIGGER IF EXISTS handle_updated_at ON public.processos_administrativos;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.processos_administrativos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON public.movimentacoes_processo;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.movimentacoes_processo FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON public.despachos;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.despachos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON public.documentos_processo;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.documentos_processo FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON public.prazos_processo;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.prazos_processo FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS audit_processos_administrativos ON public.processos_administrativos;
CREATE TRIGGER audit_processos_administrativos AFTER INSERT OR UPDATE OR DELETE ON public.processos_administrativos FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();

DROP TRIGGER IF EXISTS audit_movimentacoes_processo ON public.movimentacoes_processo;
CREATE TRIGGER audit_movimentacoes_processo AFTER INSERT OR UPDATE OR DELETE ON public.movimentacoes_processo FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();

DROP TRIGGER IF EXISTS audit_despachos ON public.despachos;
CREATE TRIGGER audit_despachos AFTER INSERT OR UPDATE OR DELETE ON public.despachos FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();

DROP TRIGGER IF EXISTS audit_documentos_processo ON public.documentos_processo;
CREATE TRIGGER audit_documentos_processo AFTER INSERT OR UPDATE OR DELETE ON public.documentos_processo FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();

DROP TRIGGER IF EXISTS audit_prazos_processo ON public.prazos_processo;
CREATE TRIGGER audit_prazos_processo AFTER INSERT OR UPDATE OR DELETE ON public.prazos_processo FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();

-- ============================================
-- 6. RLS - DENY BY DEFAULT
-- ============================================

ALTER TABLE public.processos_administrativos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processos_administrativos FORCE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_processo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_processo FORCE ROW LEVEL SECURITY;
ALTER TABLE public.despachos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despachos FORCE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_processo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_processo FORCE ROW LEVEL SECURITY;
ALTER TABLE public.prazos_processo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prazos_processo FORCE ROW LEVEL SECURITY;
ALTER TABLE public.acesso_processo_sigiloso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acesso_processo_sigiloso FORCE ROW LEVEL SECURITY;

-- ============================================
-- 7. POLÍTICAS RLS
-- ============================================

DROP POLICY IF EXISTS "processos_admin_select" ON public.processos_administrativos;
CREATE POLICY "processos_admin_select" ON public.processos_administrativos FOR SELECT USING (
  (sigilo = 'publico' AND public.usuario_tem_permissao(auth.uid(), 'workflow.visualizar'))
  OR (sigilo IN ('restrito', 'sigiloso') AND (created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.acesso_processo_sigiloso WHERE processo_id = processos_administrativos.id AND usuario_id = auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'workflow.admin')))
);

DROP POLICY IF EXISTS "processos_admin_insert" ON public.processos_administrativos;
CREATE POLICY "processos_admin_insert" ON public.processos_administrativos FOR INSERT WITH CHECK (public.usuario_tem_permissao(auth.uid(), 'workflow.criar'));

DROP POLICY IF EXISTS "processos_admin_update" ON public.processos_administrativos;
CREATE POLICY "processos_admin_update" ON public.processos_administrativos FOR UPDATE USING (public.usuario_tem_permissao(auth.uid(), 'workflow.tramitar') OR (created_by = auth.uid() AND status = 'aberto'));

DROP POLICY IF EXISTS "movimentacoes_select" ON public.movimentacoes_processo;
CREATE POLICY "movimentacoes_select" ON public.movimentacoes_processo FOR SELECT USING (EXISTS (SELECT 1 FROM public.processos_administrativos p WHERE p.id = movimentacoes_processo.processo_id AND ((p.sigilo = 'publico' AND public.usuario_tem_permissao(auth.uid(), 'workflow.visualizar')) OR p.created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.acesso_processo_sigiloso WHERE processo_id = p.id AND usuario_id = auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'workflow.admin'))));

DROP POLICY IF EXISTS "movimentacoes_insert" ON public.movimentacoes_processo;
CREATE POLICY "movimentacoes_insert" ON public.movimentacoes_processo FOR INSERT WITH CHECK (public.usuario_tem_permissao(auth.uid(), 'workflow.tramitar'));

DROP POLICY IF EXISTS "movimentacoes_update" ON public.movimentacoes_processo;
CREATE POLICY "movimentacoes_update" ON public.movimentacoes_processo FOR UPDATE USING (public.usuario_tem_permissao(auth.uid(), 'workflow.tramitar'));

DROP POLICY IF EXISTS "despachos_select" ON public.despachos;
CREATE POLICY "despachos_select" ON public.despachos FOR SELECT USING (EXISTS (SELECT 1 FROM public.processos_administrativos p WHERE p.id = despachos.processo_id AND ((p.sigilo = 'publico' AND public.usuario_tem_permissao(auth.uid(), 'workflow.visualizar')) OR p.created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.acesso_processo_sigiloso WHERE processo_id = p.id AND usuario_id = auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'workflow.admin'))));

DROP POLICY IF EXISTS "despachos_insert" ON public.despachos;
CREATE POLICY "despachos_insert" ON public.despachos FOR INSERT WITH CHECK (public.usuario_tem_permissao(auth.uid(), 'workflow.despachar'));

DROP POLICY IF EXISTS "documentos_processo_select" ON public.documentos_processo;
CREATE POLICY "documentos_processo_select" ON public.documentos_processo FOR SELECT USING (EXISTS (SELECT 1 FROM public.processos_administrativos p WHERE p.id = documentos_processo.processo_id AND ((p.sigilo = 'publico' AND public.usuario_tem_permissao(auth.uid(), 'workflow.visualizar')) OR p.created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.acesso_processo_sigiloso WHERE processo_id = p.id AND usuario_id = auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'workflow.admin'))));

DROP POLICY IF EXISTS "documentos_processo_insert" ON public.documentos_processo;
CREATE POLICY "documentos_processo_insert" ON public.documentos_processo FOR INSERT WITH CHECK (public.usuario_tem_permissao(auth.uid(), 'workflow.tramitar'));

DROP POLICY IF EXISTS "prazos_processo_select" ON public.prazos_processo;
CREATE POLICY "prazos_processo_select" ON public.prazos_processo FOR SELECT USING (EXISTS (SELECT 1 FROM public.processos_administrativos p WHERE p.id = prazos_processo.processo_id AND ((p.sigilo = 'publico' AND public.usuario_tem_permissao(auth.uid(), 'workflow.visualizar')) OR p.created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.acesso_processo_sigiloso WHERE processo_id = p.id AND usuario_id = auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'workflow.admin'))));

DROP POLICY IF EXISTS "prazos_processo_insert" ON public.prazos_processo;
CREATE POLICY "prazos_processo_insert" ON public.prazos_processo FOR INSERT WITH CHECK (public.usuario_tem_permissao(auth.uid(), 'workflow.tramitar'));

DROP POLICY IF EXISTS "prazos_processo_update" ON public.prazos_processo;
CREATE POLICY "prazos_processo_update" ON public.prazos_processo FOR UPDATE USING (public.usuario_tem_permissao(auth.uid(), 'workflow.tramitar'));

DROP POLICY IF EXISTS "acesso_sigiloso_select" ON public.acesso_processo_sigiloso;
CREATE POLICY "acesso_sigiloso_select" ON public.acesso_processo_sigiloso FOR SELECT USING (usuario_id = auth.uid() OR public.usuario_tem_permissao(auth.uid(), 'workflow.admin'));

DROP POLICY IF EXISTS "acesso_sigiloso_insert" ON public.acesso_processo_sigiloso;
CREATE POLICY "acesso_sigiloso_insert" ON public.acesso_processo_sigiloso FOR INSERT WITH CHECK (public.usuario_tem_permissao(auth.uid(), 'workflow.admin'));

-- ============================================
-- 8. PERMISSÕES NO SISTEMA
-- ============================================

INSERT INTO public.funcoes_sistema (codigo, nome, descricao, modulo, ativo) VALUES
  ('workflow.visualizar', 'Visualizar Processos', 'Permite visualizar processos públicos e suas movimentações', 'Workflow', true),
  ('workflow.criar', 'Criar Processos', 'Permite criar novos processos administrativos', 'Workflow', true),
  ('workflow.tramitar', 'Tramitar Processos', 'Permite movimentar, encaminhar e juntar documentos', 'Workflow', true),
  ('workflow.despachar', 'Emitir Despachos', 'Permite emitir despachos simples, decisórios e conclusivos', 'Workflow', true),
  ('workflow.concluir', 'Concluir Processos', 'Permite marcar processos como concluídos', 'Workflow', true),
  ('workflow.arquivar', 'Arquivar Processos', 'Permite arquivar processos (requer despacho conclusivo)', 'Workflow', true),
  ('workflow.admin', 'Administrar Workflow', 'Acesso total ao módulo de workflow, incluindo sigilosos', 'Workflow', true)
ON CONFLICT (codigo) DO NOTHING;

-- Vincular permissões ao super_admin (usando estrutura correta)
INSERT INTO public.perfil_funcoes (perfil_id, funcao_id, concedido)
SELECT p.id, f.id, true
FROM public.perfis p
CROSS JOIN public.funcoes_sistema f
WHERE p.codigo = 'super_admin' AND f.codigo LIKE 'workflow.%'
ON CONFLICT (perfil_id, funcao_id) DO NOTHING;

-- ============================================
-- 9. VIEW RESUMO
-- ============================================

CREATE OR REPLACE VIEW public.v_processos_resumo AS
SELECT 
  p.id,
  p.numero_processo || '/' || p.ano AS numero_formatado,
  p.tipo_processo::text,
  p.assunto,
  p.interessado_nome,
  p.status::text,
  p.sigilo::text,
  p.data_abertura,
  p.data_encerramento,
  uo.nome AS unidade_origem,
  (SELECT COUNT(*) FROM public.movimentacoes_processo m WHERE m.processo_id = p.id) AS total_movimentacoes,
  (SELECT COUNT(*) FROM public.despachos d WHERE d.processo_id = p.id) AS total_despachos,
  (SELECT COUNT(*) FROM public.documentos_processo doc WHERE doc.processo_id = p.id) AS total_documentos,
  (SELECT COUNT(*) FROM public.prazos_processo pr WHERE pr.processo_id = p.id AND NOT pr.cumprido AND pr.data_limite < CURRENT_DATE) AS prazos_vencidos,
  (SELECT MAX(m.created_at) FROM public.movimentacoes_processo m WHERE m.processo_id = p.id) AS ultima_movimentacao,
  p.created_at,
  p.created_by
FROM public.processos_administrativos p
LEFT JOIN public.estrutura_organizacional uo ON uo.id = p.unidade_origem_id;
