-- ============================================================
-- FASE 1 CONFORMIDADE LEGAL (IDJUV) - SCHEMA COMPLETO
-- Lei 14.133/2021 (Licitações) + LAI (Transparência) + e-SIC
-- Ajustes: enum fase_licitacao expandido + prazo e-SIC 30 dias
-- ============================================================

-- ============================================================
-- PARTE 0: FUNÇÕES AUXILIARES
-- ============================================================

-- Função handle_updated_at (se não existir)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PARTE 1: TIPOS ENUM
-- ============================================================

DO $$ BEGIN
  CREATE TYPE public.modalidade_licitacao AS ENUM (
    'pregao_eletronico', 'pregao_presencial', 'concorrencia',
    'concurso', 'leilao', 'dialogo_competitivo', 'dispensa', 'inexigibilidade'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.fase_licitacao AS ENUM (
    'planejamento', 'elaboracao', 'edital', 'publicacao', 'propostas',
    'habilitacao', 'julgamento', 'homologacao', 'adjudicacao', 'contratacao',
    'encerrado', 'revogado', 'anulado', 'deserto', 'fracassado'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.status_contrato AS ENUM (
    'rascunho', 'vigente', 'suspenso', 'encerrado', 'rescindido', 'aditado'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.tipo_aditivo AS ENUM (
    'prazo', 'valor', 'prazo_valor', 'objeto', 'supressao', 'reequilibrio', 'apostilamento'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.status_medicao AS ENUM (
    'rascunho', 'enviada', 'aprovada', 'rejeitada', 'paga'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.tipo_documento_licitacao AS ENUM (
    'etp', 'termo_referencia', 'projeto_basico', 'pesquisa_precos',
    'parecer_juridico', 'autorizacao', 'dotacao_orcamentaria', 'mapa_riscos',
    'minuta_edital', 'minuta_contrato', 'ata_aprovacao', 'outro'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.veiculo_publicacao AS ENUM (
    'doe', 'pncp', 'dou', 'jornal', 'site', 'mural'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- PARTE 2: TABELAS
-- ============================================================

-- Fornecedores
CREATE TABLE IF NOT EXISTS public.fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_pessoa VARCHAR(2) NOT NULL CHECK (tipo_pessoa IN ('PF', 'PJ')),
  cpf_cnpj VARCHAR(18) NOT NULL UNIQUE,
  razao_social VARCHAR(255) NOT NULL,
  nome_fantasia VARCHAR(255),
  inscricao_estadual VARCHAR(20),
  inscricao_municipal VARCHAR(20),
  endereco_logradouro VARCHAR(255),
  endereco_numero VARCHAR(20),
  endereco_complemento VARCHAR(100),
  endereco_bairro VARCHAR(100),
  endereco_cidade VARCHAR(100),
  endereco_uf VARCHAR(2),
  endereco_cep VARCHAR(10),
  telefone VARCHAR(20),
  email VARCHAR(255),
  site VARCHAR(255),
  representante_nome VARCHAR(255),
  representante_cpf VARCHAR(14),
  representante_telefone VARCHAR(20),
  representante_email VARCHAR(255),
  banco_codigo VARCHAR(10),
  banco_nome VARCHAR(100),
  agencia VARCHAR(20),
  conta VARCHAR(30),
  tipo_conta VARCHAR(20),
  ativo BOOLEAN DEFAULT true,
  data_cadastro DATE DEFAULT CURRENT_DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_fornecedores_cpf_cnpj ON public.fornecedores(cpf_cnpj);

-- Processos Licitatórios
CREATE TABLE IF NOT EXISTS public.processos_licitatorios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_processo VARCHAR(30) NOT NULL UNIQUE,
  ano INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  modalidade public.modalidade_licitacao NOT NULL,
  tipo_licitacao VARCHAR(50),
  objeto TEXT NOT NULL,
  objeto_resumido VARCHAR(500),
  valor_estimado DECIMAL(15,2),
  data_abertura DATE,
  data_publicacao_edital DATE,
  data_limite_propostas TIMESTAMPTZ,
  data_sessao TIMESTAMPTZ,
  fase_atual public.fase_licitacao DEFAULT 'planejamento',
  historico_fases JSONB DEFAULT '[]',
  unidade_requisitante_id UUID REFERENCES public.estrutura_organizacional(id),
  servidor_responsavel_id UUID REFERENCES public.servidores(id),
  pregoeiro_id UUID REFERENCES public.servidores(id),
  dotacao_orcamentaria TEXT,
  fonte_recurso VARCHAR(50),
  programa_trabalho VARCHAR(50),
  elemento_despesa VARCHAR(50),
  fundamentacao_legal TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_processos_lic_numero ON public.processos_licitatorios(numero_processo);
CREATE INDEX IF NOT EXISTS idx_processos_lic_fase ON public.processos_licitatorios(fase_atual);

-- Itens Licitação
CREATE TABLE IF NOT EXISTS public.itens_licitacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id UUID NOT NULL REFERENCES public.processos_licitatorios(id) ON DELETE CASCADE,
  numero_item INTEGER NOT NULL,
  descricao TEXT NOT NULL,
  unidade_medida VARCHAR(50),
  quantidade DECIMAL(15,4) NOT NULL DEFAULT 1,
  valor_unitario_estimado DECIMAL(15,4),
  valor_total_estimado DECIMAL(15,2),
  vencedor_id UUID REFERENCES public.fornecedores(id),
  valor_unitario_final DECIMAL(15,4),
  valor_total_final DECIMAL(15,2),
  situacao VARCHAR(50) DEFAULT 'ativo',
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(processo_id, numero_item)
);

-- Propostas
CREATE TABLE IF NOT EXISTS public.propostas_licitacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id UUID NOT NULL REFERENCES public.processos_licitatorios(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.itens_licitacao(id) ON DELETE CASCADE,
  fornecedor_id UUID NOT NULL REFERENCES public.fornecedores(id),
  valor_unitario DECIMAL(15,4) NOT NULL,
  valor_total DECIMAL(15,2),
  marca VARCHAR(100),
  modelo VARCHAR(100),
  classificacao INTEGER,
  vencedora BOOLEAN DEFAULT false,
  desclassificada BOOLEAN DEFAULT false,
  motivo_desclassificacao TEXT,
  data_proposta TIMESTAMPTZ DEFAULT now(),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Contratos
CREATE TABLE IF NOT EXISTS public.contratos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_contrato VARCHAR(30) NOT NULL UNIQUE,
  ano INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  processo_licitatorio_id UUID REFERENCES public.processos_licitatorios(id),
  fornecedor_id UUID NOT NULL REFERENCES public.fornecedores(id),
  objeto TEXT NOT NULL,
  objeto_resumido VARCHAR(500),
  valor_inicial DECIMAL(15,2) NOT NULL,
  valor_atual DECIMAL(15,2) NOT NULL,
  valor_executado DECIMAL(15,2) DEFAULT 0,
  saldo_contrato DECIMAL(15,2),
  data_assinatura DATE NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  data_fim_atual DATE,
  status public.status_contrato DEFAULT 'rascunho',
  gestor_id UUID REFERENCES public.servidores(id),
  fiscal_id UUID REFERENCES public.servidores(id),
  garantia_tipo VARCHAR(50),
  garantia_valor DECIMAL(15,2),
  garantia_vencimento DATE,
  dotacao_orcamentaria TEXT,
  fonte_recurso VARCHAR(50),
  data_publicacao_doe DATE,
  numero_doe VARCHAR(20),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_contratos_numero ON public.contratos(numero_contrato);
CREATE INDEX IF NOT EXISTS idx_contratos_status ON public.contratos(status);

-- Aditivos
CREATE TABLE IF NOT EXISTS public.aditivos_contrato (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES public.contratos(id) ON DELETE CASCADE,
  numero_aditivo INTEGER NOT NULL,
  tipo public.tipo_aditivo NOT NULL,
  objeto TEXT NOT NULL,
  valor_acrescimo DECIMAL(15,2) DEFAULT 0,
  valor_supressao DECIMAL(15,2) DEFAULT 0,
  prazo_adicional_dias INTEGER DEFAULT 0,
  nova_data_fim DATE,
  data_assinatura DATE NOT NULL,
  data_publicacao_doe DATE,
  numero_doe VARCHAR(20),
  justificativa TEXT,
  fundamentacao_legal TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  UNIQUE(contrato_id, numero_aditivo)
);

-- Medições
CREATE TABLE IF NOT EXISTS public.medicoes_contrato (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES public.contratos(id) ON DELETE CASCADE,
  numero_medicao INTEGER NOT NULL,
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL,
  valor_medido DECIMAL(15,2) NOT NULL,
  valor_aprovado DECIMAL(15,2),
  status public.status_medicao DEFAULT 'rascunho',
  data_envio TIMESTAMPTZ,
  data_aprovacao TIMESTAMPTZ,
  aprovado_por UUID REFERENCES public.servidores(id),
  data_pagamento DATE,
  nota_fiscal_numero VARCHAR(50),
  nota_fiscal_data DATE,
  nota_fiscal_valor DECIMAL(15,2),
  observacoes TEXT,
  motivo_rejeicao TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  UNIQUE(contrato_id, numero_medicao)
);

-- Publicações LAI
CREATE TABLE IF NOT EXISTS public.publicacoes_lai (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria VARCHAR(100) NOT NULL,
  subcategoria VARCHAR(100),
  titulo VARCHAR(500) NOT NULL,
  descricao TEXT,
  conteudo TEXT,
  arquivo_url TEXT,
  arquivo_nome VARCHAR(255),
  servidor_id UUID REFERENCES public.servidores(id),
  unidade_id UUID REFERENCES public.estrutura_organizacional(id),
  contrato_id UUID REFERENCES public.contratos(id),
  periodo_referencia VARCHAR(50),
  ano_referencia INTEGER,
  mes_referencia INTEGER,
  publicado BOOLEAN DEFAULT false,
  data_publicacao TIMESTAMPTZ,
  publicado_por UUID,
  ordem_exibicao INTEGER DEFAULT 0,
  destaque BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID
);

-- Solicitações e-SIC
CREATE TABLE IF NOT EXISTS public.solicitacoes_sic (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo VARCHAR(20) NOT NULL UNIQUE,
  solicitante_nome VARCHAR(255) NOT NULL,
  solicitante_documento VARCHAR(20),
  solicitante_email VARCHAR(255),
  solicitante_telefone VARCHAR(20),
  solicitante_hash TEXT,
  descricao_pedido TEXT NOT NULL,
  categoria VARCHAR(100),
  forma_recebimento VARCHAR(50) DEFAULT 'email',
  status VARCHAR(50) DEFAULT 'pendente',
  prazo_resposta DATE,
  respondido_em TIMESTAMPTZ,
  respondido_por UUID REFERENCES public.servidores(id),
  resposta TEXT,
  resposta_arquivo_url TEXT,
  recurso_texto TEXT,
  recurso_data TIMESTAMPTZ,
  recurso_resposta TEXT,
  recurso_respondido_em TIMESTAMPTZ,
  recurso_respondido_por UUID REFERENCES public.servidores(id),
  token_consulta UUID DEFAULT gen_random_uuid(),
  tentativas_consulta INTEGER DEFAULT 0,
  bloqueado_ate TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sic_protocolo ON public.solicitacoes_sic(protocolo);
CREATE INDEX IF NOT EXISTS idx_sic_status ON public.solicitacoes_sic(status);

-- Documentos Preparatórios
CREATE TABLE IF NOT EXISTS public.documentos_preparatorios_licitacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_licitatorio_id UUID NOT NULL REFERENCES public.processos_licitatorios(id) ON DELETE CASCADE,
  tipo public.tipo_documento_licitacao NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  arquivo_url TEXT,
  arquivo_nome VARCHAR(255),
  numero_documento VARCHAR(50),
  data_documento DATE,
  responsavel_id UUID REFERENCES public.servidores(id),
  aprovado BOOLEAN DEFAULT false,
  aprovado_por UUID REFERENCES public.servidores(id),
  aprovado_em TIMESTAMPTZ,
  observacoes TEXT,
  versao INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID
);

-- Publicações Legais
CREATE TABLE IF NOT EXISTS public.publicacoes_legais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_licitatorio_id UUID REFERENCES public.processos_licitatorios(id) ON DELETE CASCADE,
  contrato_id UUID REFERENCES public.contratos(id) ON DELETE CASCADE,
  veiculo public.veiculo_publicacao NOT NULL,
  tipo_publicacao VARCHAR(100) NOT NULL,
  numero_publicacao VARCHAR(50),
  data_publicacao DATE NOT NULL,
  pagina VARCHAR(20),
  secao VARCHAR(50),
  url_publicacao TEXT,
  arquivo_url TEXT,
  conteudo_resumido TEXT,
  pncp_id VARCHAR(50),
  pncp_sequencial INTEGER,
  pncp_sincronizado BOOLEAN DEFAULT false,
  pncp_sincronizado_em TIMESTAMPTZ,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT chk_referencia_publicacao CHECK (
    processo_licitatorio_id IS NOT NULL OR contrato_id IS NOT NULL
  )
);

-- Auditoria Imutável
CREATE TABLE IF NOT EXISTS public.audit_log_licitacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tabela_origem VARCHAR(100) NOT NULL,
  registro_id UUID NOT NULL,
  acao VARCHAR(20) NOT NULL CHECK (acao IN ('INSERT', 'UPDATE', 'DELETE')),
  dados_anteriores JSONB,
  dados_novos JSONB,
  campos_alterados TEXT[],
  usuario_id UUID,
  usuario_nome TEXT,
  usuario_perfil TEXT,
  ip_address INET,
  user_agent TEXT,
  motivo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_lic_tabela ON public.audit_log_licitacoes(tabela_origem);
CREATE INDEX IF NOT EXISTS idx_audit_lic_registro ON public.audit_log_licitacoes(registro_id);
CREATE INDEX IF NOT EXISTS idx_audit_lic_data ON public.audit_log_licitacoes(created_at);

-- ============================================================
-- PARTE 3: TRIGGERS UPDATED_AT
-- ============================================================

DROP TRIGGER IF EXISTS update_fornecedores_updated_at ON public.fornecedores;
CREATE TRIGGER update_fornecedores_updated_at
  BEFORE UPDATE ON public.fornecedores
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_processos_lic_updated_at ON public.processos_licitatorios;
CREATE TRIGGER update_processos_lic_updated_at
  BEFORE UPDATE ON public.processos_licitatorios
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_contratos_updated_at ON public.contratos;
CREATE TRIGGER update_contratos_updated_at
  BEFORE UPDATE ON public.contratos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_publicacoes_lai_updated_at ON public.publicacoes_lai;
CREATE TRIGGER update_publicacoes_lai_updated_at
  BEFORE UPDATE ON public.publicacoes_lai
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_solicitacoes_sic_updated_at ON public.solicitacoes_sic;
CREATE TRIGGER update_solicitacoes_sic_updated_at
  BEFORE UPDATE ON public.solicitacoes_sic
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_docs_prep_updated_at ON public.documentos_preparatorios_licitacao;
CREATE TRIGGER update_docs_prep_updated_at
  BEFORE UPDATE ON public.documentos_preparatorios_licitacao
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_publicacoes_legais_updated_at ON public.publicacoes_legais;
CREATE TRIGGER update_publicacoes_legais_updated_at
  BEFORE UPDATE ON public.publicacoes_legais
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- PARTE 4: FUNÇÕES DE NEGÓCIO
-- ============================================================

-- Gerar protocolo e-SIC (30 dias corridos)
CREATE OR REPLACE FUNCTION public.gerar_protocolo_sic()
RETURNS TRIGGER AS $$
DECLARE
  v_ano TEXT;
  v_seq INTEGER;
BEGIN
  v_ano := to_char(CURRENT_DATE, 'YYYY');
  SELECT COALESCE(MAX(NULLIF(regexp_replace(protocolo, '^SIC-' || v_ano || '-', ''), '')::INTEGER), 0) + 1
  INTO v_seq FROM public.solicitacoes_sic WHERE protocolo LIKE 'SIC-' || v_ano || '-%';
  NEW.protocolo := 'SIC-' || v_ano || '-' || LPAD(v_seq::TEXT, 4, '0');
  IF NEW.prazo_resposta IS NULL THEN
    NEW.prazo_resposta := CURRENT_DATE + INTERVAL '30 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_gerar_protocolo_sic ON public.solicitacoes_sic;
CREATE TRIGGER trg_gerar_protocolo_sic
  BEFORE INSERT ON public.solicitacoes_sic
  FOR EACH ROW WHEN (NEW.protocolo IS NULL)
  EXECUTE FUNCTION public.gerar_protocolo_sic();

-- Hash solicitante (LGPD)
CREATE OR REPLACE FUNCTION public.gerar_hash_solicitante_sic()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.solicitante_documento IS NOT NULL THEN
    NEW.solicitante_hash := encode(sha256(convert_to(NEW.solicitante_documento, 'UTF8')), 'hex');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_hash_solicitante_sic ON public.solicitacoes_sic;
CREATE TRIGGER trg_hash_solicitante_sic
  BEFORE INSERT OR UPDATE OF solicitante_documento ON public.solicitacoes_sic
  FOR EACH ROW EXECUTE FUNCTION public.gerar_hash_solicitante_sic();

-- Registrar mudança fase licitação
CREATE OR REPLACE FUNCTION public.registrar_mudanca_fase_licitacao()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.fase_atual IS DISTINCT FROM NEW.fase_atual THEN
    NEW.historico_fases := COALESCE(OLD.historico_fases, '[]'::JSONB) || jsonb_build_object(
      'fase_anterior', OLD.fase_atual, 'fase_nova', NEW.fase_atual, 'data', now(), 'usuario_id', auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_registrar_fase_licitacao ON public.processos_licitatorios;
CREATE TRIGGER trg_registrar_fase_licitacao
  BEFORE UPDATE OF fase_atual ON public.processos_licitatorios
  FOR EACH ROW EXECUTE FUNCTION public.registrar_mudanca_fase_licitacao();

-- Atualizar saldo contrato
CREATE OR REPLACE FUNCTION public.atualizar_saldo_contrato()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.contratos SET 
    valor_executado = (SELECT COALESCE(SUM(valor_aprovado), 0) FROM public.medicoes_contrato 
      WHERE contrato_id = COALESCE(NEW.contrato_id, OLD.contrato_id) AND status = 'aprovada'),
    saldo_contrato = valor_atual - (SELECT COALESCE(SUM(valor_aprovado), 0) FROM public.medicoes_contrato 
      WHERE contrato_id = COALESCE(NEW.contrato_id, OLD.contrato_id) AND status = 'aprovada')
  WHERE id = COALESCE(NEW.contrato_id, OLD.contrato_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_atualizar_saldo_contrato ON public.medicoes_contrato;
CREATE TRIGGER trg_atualizar_saldo_contrato
  AFTER INSERT OR UPDATE OR DELETE ON public.medicoes_contrato
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_saldo_contrato();

-- Auditoria licitações
CREATE OR REPLACE FUNCTION public.fn_audit_log_licitacoes()
RETURNS TRIGGER AS $$
DECLARE
  v_registro_id UUID;
  v_dados_anteriores JSONB;
  v_dados_novos JSONB;
  v_campos_alterados TEXT[];
  v_usuario_nome TEXT;
  v_usuario_perfil TEXT;
  v_key TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_registro_id := OLD.id; v_dados_anteriores := to_jsonb(OLD); v_dados_novos := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    v_registro_id := NEW.id; v_dados_anteriores := NULL; v_dados_novos := to_jsonb(NEW);
  ELSE
    v_registro_id := NEW.id; v_dados_anteriores := to_jsonb(OLD); v_dados_novos := to_jsonb(NEW);
    FOR v_key IN SELECT jsonb_object_keys(v_dados_novos) LOOP
      IF v_dados_anteriores->v_key IS DISTINCT FROM v_dados_novos->v_key THEN
        v_campos_alterados := array_append(v_campos_alterados, v_key);
      END IF;
    END LOOP;
  END IF;

  BEGIN SELECT p.full_name INTO v_usuario_nome FROM public.profiles p WHERE p.id = auth.uid();
  EXCEPTION WHEN OTHERS THEN v_usuario_nome := NULL; END;

  BEGIN SELECT string_agg(pf.nome, ', ') INTO v_usuario_perfil FROM public.usuario_perfis up
    JOIN public.perfis pf ON up.perfil_id = pf.id WHERE up.user_id = auth.uid() AND up.ativo = true;
  EXCEPTION WHEN OTHERS THEN v_usuario_perfil := NULL; END;

  INSERT INTO public.audit_log_licitacoes (tabela_origem, registro_id, acao, dados_anteriores, dados_novos, campos_alterados, usuario_id, usuario_nome, usuario_perfil)
  VALUES (TG_TABLE_NAME, v_registro_id, TG_OP, v_dados_anteriores, v_dados_novos, v_campos_alterados, auth.uid(), v_usuario_nome, v_usuario_perfil);

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Triggers de auditoria
DROP TRIGGER IF EXISTS trg_audit_fornecedores ON public.fornecedores;
CREATE TRIGGER trg_audit_fornecedores AFTER INSERT OR UPDATE OR DELETE ON public.fornecedores FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();

DROP TRIGGER IF EXISTS trg_audit_processos_licitatorios ON public.processos_licitatorios;
CREATE TRIGGER trg_audit_processos_licitatorios AFTER INSERT OR UPDATE OR DELETE ON public.processos_licitatorios FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();

DROP TRIGGER IF EXISTS trg_audit_itens_licitacao ON public.itens_licitacao;
CREATE TRIGGER trg_audit_itens_licitacao AFTER INSERT OR UPDATE OR DELETE ON public.itens_licitacao FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();

DROP TRIGGER IF EXISTS trg_audit_propostas_licitacao ON public.propostas_licitacao;
CREATE TRIGGER trg_audit_propostas_licitacao AFTER INSERT OR UPDATE OR DELETE ON public.propostas_licitacao FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();

DROP TRIGGER IF EXISTS trg_audit_contratos ON public.contratos;
CREATE TRIGGER trg_audit_contratos AFTER INSERT OR UPDATE OR DELETE ON public.contratos FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();

DROP TRIGGER IF EXISTS trg_audit_aditivos_contrato ON public.aditivos_contrato;
CREATE TRIGGER trg_audit_aditivos_contrato AFTER INSERT OR UPDATE OR DELETE ON public.aditivos_contrato FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();

DROP TRIGGER IF EXISTS trg_audit_medicoes_contrato ON public.medicoes_contrato;
CREATE TRIGGER trg_audit_medicoes_contrato AFTER INSERT OR UPDATE OR DELETE ON public.medicoes_contrato FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();

DROP TRIGGER IF EXISTS trg_audit_publicacoes_lai ON public.publicacoes_lai;
CREATE TRIGGER trg_audit_publicacoes_lai AFTER INSERT OR UPDATE OR DELETE ON public.publicacoes_lai FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();

DROP TRIGGER IF EXISTS trg_audit_docs_preparatorios ON public.documentos_preparatorios_licitacao;
CREATE TRIGGER trg_audit_docs_preparatorios AFTER INSERT OR UPDATE OR DELETE ON public.documentos_preparatorios_licitacao FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();

DROP TRIGGER IF EXISTS trg_audit_publicacoes_legais ON public.publicacoes_legais;
CREATE TRIGGER trg_audit_publicacoes_legais AFTER INSERT OR UPDATE OR DELETE ON public.publicacoes_legais FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();

-- Consulta pública e-SIC
CREATE OR REPLACE FUNCTION public.consultar_protocolo_sic(p_protocolo VARCHAR, p_token UUID)
RETURNS TABLE (protocolo VARCHAR, data_solicitacao TIMESTAMPTZ, status VARCHAR, prazo_resposta DATE, data_resposta TIMESTAMPTZ, resposta TEXT, dias_restantes INTEGER)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_registro RECORD;
BEGIN
  SELECT s.* INTO v_registro FROM public.solicitacoes_sic s WHERE s.protocolo = p_protocolo;
  IF v_registro IS NULL THEN RAISE EXCEPTION 'Protocolo não encontrado'; END IF;
  IF v_registro.bloqueado_ate IS NOT NULL AND v_registro.bloqueado_ate > NOW() THEN
    RAISE EXCEPTION 'Consulta bloqueada. Tente após %', to_char(v_registro.bloqueado_ate, 'DD/MM/YYYY HH24:MI');
  END IF;
  IF v_registro.token_consulta != p_token THEN
    UPDATE public.solicitacoes_sic SET tentativas_consulta = COALESCE(tentativas_consulta, 0) + 1,
      bloqueado_ate = CASE WHEN COALESCE(tentativas_consulta, 0) >= 4 THEN NOW() + INTERVAL '1 hour' ELSE NULL END
    WHERE solicitacoes_sic.protocolo = p_protocolo;
    RAISE EXCEPTION 'Token inválido';
  END IF;
  UPDATE public.solicitacoes_sic SET tentativas_consulta = 0, bloqueado_ate = NULL WHERE solicitacoes_sic.protocolo = p_protocolo;
  RETURN QUERY SELECT v_registro.protocolo, v_registro.created_at, v_registro.status::VARCHAR, v_registro.prazo_resposta,
    v_registro.respondido_em, v_registro.resposta, (v_registro.prazo_resposta - CURRENT_DATE)::INTEGER;
END;
$$;

-- View pública e-SIC
CREATE OR REPLACE VIEW public.v_sic_consulta_publica AS
SELECT protocolo, created_at as data_solicitacao, status, prazo_resposta, respondido_em as data_resposta,
  CASE WHEN respondido_em IS NOT NULL AND prazo_resposta IS NOT NULL THEN respondido_em::date <= prazo_resposta ELSE NULL END as respondido_no_prazo,
  GREATEST(0, (prazo_resposta - CURRENT_DATE)) as dias_restantes
FROM public.solicitacoes_sic;

-- ============================================================
-- PARTE 5: RLS POLICIES
-- ============================================================

ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticados podem visualizar fornecedores" ON public.fornecedores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Gestores podem gerenciar fornecedores" ON public.fornecedores FOR ALL TO authenticated
  USING (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'licitacoes.fornecedores.editar'));

ALTER TABLE public.processos_licitatorios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticados podem visualizar processos" ON public.processos_licitatorios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Gestores podem gerenciar processos" ON public.processos_licitatorios FOR ALL TO authenticated
  USING (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'licitacoes.processos.editar'));

ALTER TABLE public.itens_licitacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticados podem visualizar itens" ON public.itens_licitacao FOR SELECT TO authenticated USING (true);
CREATE POLICY "Gestores podem gerenciar itens" ON public.itens_licitacao FOR ALL TO authenticated
  USING (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'licitacoes.processos.editar'));

ALTER TABLE public.propostas_licitacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticados podem visualizar propostas" ON public.propostas_licitacao FOR SELECT TO authenticated USING (true);
CREATE POLICY "Gestores podem gerenciar propostas" ON public.propostas_licitacao FOR ALL TO authenticated
  USING (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'licitacoes.processos.editar'));

ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticados podem visualizar contratos" ON public.contratos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Gestores podem gerenciar contratos" ON public.contratos FOR ALL TO authenticated
  USING (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'contratos.gestao.editar'));

ALTER TABLE public.aditivos_contrato ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticados podem visualizar aditivos" ON public.aditivos_contrato FOR SELECT TO authenticated USING (true);
CREATE POLICY "Gestores podem gerenciar aditivos" ON public.aditivos_contrato FOR ALL TO authenticated
  USING (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'contratos.gestao.editar'));

ALTER TABLE public.medicoes_contrato ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticados podem visualizar medições" ON public.medicoes_contrato FOR SELECT TO authenticated USING (true);
CREATE POLICY "Gestores podem gerenciar medições" ON public.medicoes_contrato FOR ALL TO authenticated
  USING (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'contratos.gestao.editar'));

ALTER TABLE public.publicacoes_lai ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Publicações LAI são públicas" ON public.publicacoes_lai FOR SELECT TO authenticated USING (true);
CREATE POLICY "Gestores podem gerenciar LAI" ON public.publicacoes_lai FOR ALL TO authenticated
  USING (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'transparencia.publicacoes.editar'));

ALTER TABLE public.solicitacoes_sic ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gestores podem visualizar SIC" ON public.solicitacoes_sic FOR SELECT TO authenticated
  USING (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'transparencia.sic.responder'));
CREATE POLICY "Gestores podem gerenciar SIC" ON public.solicitacoes_sic FOR ALL TO authenticated
  USING (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'transparencia.sic.responder'));

ALTER TABLE public.documentos_preparatorios_licitacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticados podem visualizar docs prep" ON public.documentos_preparatorios_licitacao FOR SELECT TO authenticated USING (true);
CREATE POLICY "Gestores podem gerenciar docs prep" ON public.documentos_preparatorios_licitacao FOR ALL TO authenticated
  USING (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'licitacoes.processos.editar'));

ALTER TABLE public.publicacoes_legais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Publicações legais são públicas" ON public.publicacoes_legais FOR SELECT TO authenticated USING (true);
CREATE POLICY "Gestores podem gerenciar publicações legais" ON public.publicacoes_legais FOR ALL TO authenticated
  USING (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'transparencia.publicacoes.editar'));

-- Auditoria (IMUTÁVEL)
ALTER TABLE public.audit_log_licitacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins podem visualizar audit_log_licitacoes" ON public.audit_log_licitacoes FOR SELECT TO authenticated
  USING (public.usuario_eh_admin(auth.uid()));
CREATE POLICY "Sistema pode inserir audit_log_licitacoes" ON public.audit_log_licitacoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Ninguém pode alterar audit_log_licitacoes" ON public.audit_log_licitacoes FOR UPDATE TO authenticated USING (false);
CREATE POLICY "Ninguém pode excluir audit_log_licitacoes" ON public.audit_log_licitacoes FOR DELETE TO authenticated USING (false);

-- ============================================================
-- PARTE 6: PERMISSÕES RBAC
-- ============================================================

INSERT INTO public.funcoes_sistema (codigo, nome, modulo, submodulo, tipo_acao, ordem) VALUES
  ('licitacoes', 'Módulo de Licitações', 'licitacoes', NULL, 'acessar', 100),
  ('licitacoes.fornecedores', 'Gestão de Fornecedores', 'licitacoes', 'fornecedores', 'acessar', 101),
  ('licitacoes.fornecedores.criar', 'Cadastrar Fornecedor', 'licitacoes', 'fornecedores', 'criar', 102),
  ('licitacoes.fornecedores.editar', 'Editar Fornecedor', 'licitacoes', 'fornecedores', 'editar', 103),
  ('licitacoes.processos', 'Gestão de Processos', 'licitacoes', 'processos', 'acessar', 110),
  ('licitacoes.processos.criar', 'Criar Processo', 'licitacoes', 'processos', 'criar', 111),
  ('licitacoes.processos.editar', 'Editar Processo', 'licitacoes', 'processos', 'editar', 112),
  ('licitacoes.documentos', 'Documentos Preparatórios', 'licitacoes', 'documentos', 'acessar', 120),
  ('licitacoes.documentos.criar', 'Criar Documento', 'licitacoes', 'documentos', 'criar', 121),
  ('licitacoes.documentos.editar', 'Editar Documento', 'licitacoes', 'documentos', 'editar', 122),
  ('licitacoes.documentos.aprovar', 'Aprovar Documento', 'licitacoes', 'documentos', 'aprovar', 123),
  ('licitacoes.publicidade', 'Publicidade Legal', 'licitacoes', 'publicidade', 'acessar', 130),
  ('licitacoes.publicidade.registrar', 'Registrar Publicação', 'licitacoes', 'publicidade', 'criar', 131),
  ('licitacoes.publicidade.pncp', 'Sincronizar PNCP', 'licitacoes', 'publicidade', 'executar', 132),
  ('contratos', 'Módulo de Contratos', 'contratos', NULL, 'acessar', 140),
  ('contratos.gestao', 'Gestão de Contratos', 'contratos', 'gestao', 'acessar', 141),
  ('contratos.gestao.criar', 'Criar Contrato', 'contratos', 'gestao', 'criar', 142),
  ('contratos.gestao.editar', 'Editar Contrato', 'contratos', 'gestao', 'editar', 143),
  ('contratos.aditivos', 'Gestão de Aditivos', 'contratos', 'aditivos', 'acessar', 150),
  ('contratos.medicoes', 'Gestão de Medições', 'contratos', 'medicoes', 'acessar', 151),
  ('transparencia', 'Módulo de Transparência', 'transparencia', NULL, 'acessar', 160),
  ('transparencia.publicacoes', 'Publicações LAI', 'transparencia', 'publicacoes', 'acessar', 161),
  ('transparencia.publicacoes.criar', 'Criar Publicação', 'transparencia', 'publicacoes', 'criar', 162),
  ('transparencia.publicacoes.editar', 'Editar Publicação', 'transparencia', 'publicacoes', 'editar', 163),
  ('transparencia.sic', 'Gestão e-SIC', 'transparencia', 'sic', 'acessar', 170),
  ('transparencia.sic.responder', 'Responder Solicitações', 'transparencia', 'sic', 'executar', 171),
  ('auditoria.licitacoes', 'Auditoria de Licitações', 'auditoria', 'licitacoes', 'visualizar', 180)
ON CONFLICT (codigo) DO NOTHING;

-- Hierarquia
UPDATE public.funcoes_sistema SET funcao_pai_id = (SELECT id FROM public.funcoes_sistema WHERE codigo = 'licitacoes') WHERE codigo LIKE 'licitacoes.%' AND codigo NOT LIKE 'licitacoes.%.%';
UPDATE public.funcoes_sistema SET funcao_pai_id = (SELECT id FROM public.funcoes_sistema WHERE codigo = 'licitacoes.fornecedores') WHERE codigo LIKE 'licitacoes.fornecedores.%';
UPDATE public.funcoes_sistema SET funcao_pai_id = (SELECT id FROM public.funcoes_sistema WHERE codigo = 'licitacoes.processos') WHERE codigo LIKE 'licitacoes.processos.%';
UPDATE public.funcoes_sistema SET funcao_pai_id = (SELECT id FROM public.funcoes_sistema WHERE codigo = 'licitacoes.documentos') WHERE codigo LIKE 'licitacoes.documentos.%';
UPDATE public.funcoes_sistema SET funcao_pai_id = (SELECT id FROM public.funcoes_sistema WHERE codigo = 'licitacoes.publicidade') WHERE codigo LIKE 'licitacoes.publicidade.%';
UPDATE public.funcoes_sistema SET funcao_pai_id = (SELECT id FROM public.funcoes_sistema WHERE codigo = 'contratos') WHERE codigo LIKE 'contratos.%' AND codigo NOT LIKE 'contratos.%.%';
UPDATE public.funcoes_sistema SET funcao_pai_id = (SELECT id FROM public.funcoes_sistema WHERE codigo = 'contratos.gestao') WHERE codigo LIKE 'contratos.gestao.%';
UPDATE public.funcoes_sistema SET funcao_pai_id = (SELECT id FROM public.funcoes_sistema WHERE codigo = 'transparencia') WHERE codigo LIKE 'transparencia.%' AND codigo NOT LIKE 'transparencia.%.%';
UPDATE public.funcoes_sistema SET funcao_pai_id = (SELECT id FROM public.funcoes_sistema WHERE codigo = 'transparencia.publicacoes') WHERE codigo LIKE 'transparencia.publicacoes.%';
UPDATE public.funcoes_sistema SET funcao_pai_id = (SELECT id FROM public.funcoes_sistema WHERE codigo = 'transparencia.sic') WHERE codigo LIKE 'transparencia.sic.%';

-- Conceder ao Super Admin
INSERT INTO public.perfil_funcoes (perfil_id, funcao_id)
SELECT (SELECT id FROM public.perfis WHERE codigo = 'super_admin'), f.id
FROM public.funcoes_sistema f
WHERE f.codigo LIKE 'licitacoes%' OR f.codigo LIKE 'contratos%' OR f.codigo LIKE 'transparencia%' OR f.codigo = 'auditoria.licitacoes'
ON CONFLICT (perfil_id, funcao_id) DO NOTHING;

GRANT SELECT ON public.v_sic_consulta_publica TO authenticated;