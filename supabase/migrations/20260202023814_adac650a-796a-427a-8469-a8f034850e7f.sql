-- ============================================================
-- FASE 5: GOVERNANÇA E COMPLIANCE - MIGRAÇÃO CORRIGIDA
-- Padrão do projeto: handle_updated_at(), fn_audit_log_licitacoes, idempotente
-- ============================================================

-- ============================================================
-- PARTE 1: ENUMS
-- ============================================================

DO $$ BEGIN
  CREATE TYPE public.tipo_papel_raci AS ENUM ('responsavel', 'aprovador', 'consultado', 'informado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.nivel_risco AS ENUM ('muito_baixo', 'baixo', 'medio', 'alto', 'muito_alto');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.status_risco AS ENUM ('identificado', 'em_analise', 'em_tratamento', 'monitorado', 'encerrado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.tipo_controle AS ENUM ('preventivo', 'detectivo', 'corretivo');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.periodicidade_controle AS ENUM ('diario', 'semanal', 'quinzenal', 'mensal', 'bimestral', 'trimestral', 'semestral', 'anual', 'eventual');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.status_conformidade AS ENUM ('conforme', 'parcialmente_conforme', 'nao_conforme', 'nao_aplicavel', 'pendente');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.tipo_decisao AS ENUM ('despacho', 'deliberacao', 'resolucao', 'determinacao', 'recomendacao');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.tipo_parecer AS ENUM ('juridico', 'tecnico', 'contabil', 'controle_interno', 'outro');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- PARTE 2: TABELAS - MATRIZ RACI
-- ============================================================

CREATE TABLE IF NOT EXISTS public.matriz_raci_processos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  modulo_sistema VARCHAR(100),
  ativo BOOLEAN NOT NULL DEFAULT true,
  versao INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);
COMMENT ON TABLE public.matriz_raci_processos IS 'Processos administrativos mapeados na Matriz RACI institucional';

CREATE TABLE IF NOT EXISTS public.matriz_raci_papeis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  unidade_id UUID REFERENCES public.estrutura_organizacional(id),
  cargo_id UUID REFERENCES public.cargos(id),
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);
COMMENT ON TABLE public.matriz_raci_papeis IS 'Papéis organizacionais para atribuição RACI';

CREATE TABLE IF NOT EXISTS public.matriz_raci_atribuicoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id UUID NOT NULL REFERENCES public.matriz_raci_processos(id) ON DELETE CASCADE,
  papel_id UUID NOT NULL REFERENCES public.matriz_raci_papeis(id) ON DELETE CASCADE,
  tipo_papel public.tipo_papel_raci NOT NULL,
  etapa_processo VARCHAR(200),
  observacoes TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  versao INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(processo_id, papel_id, tipo_papel, etapa_processo)
);
COMMENT ON TABLE public.matriz_raci_atribuicoes IS 'Atribuições RACI vinculando processos e papéis';

-- ============================================================
-- PARTE 3: TABELAS - GESTÃO DE RISCOS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.riscos_institucionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) NOT NULL UNIQUE,
  titulo VARCHAR(300) NOT NULL,
  descricao TEXT NOT NULL,
  causa TEXT,
  consequencia TEXT,
  modulo_afetado VARCHAR(100),
  processo_raci_id UUID REFERENCES public.matriz_raci_processos(id),
  probabilidade_inerente public.nivel_risco NOT NULL,
  impacto_inerente public.nivel_risco NOT NULL,
  nivel_risco_inerente public.nivel_risco NOT NULL,
  controle_existente TEXT,
  probabilidade_residual public.nivel_risco,
  impacto_residual public.nivel_risco,
  nivel_risco_residual public.nivel_risco,
  responsavel_id UUID REFERENCES public.servidores(id),
  unidade_responsavel_id UUID REFERENCES public.estrutura_organizacional(id),
  status public.status_risco NOT NULL DEFAULT 'identificado',
  data_identificacao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_ultima_avaliacao DATE,
  proxima_revisao DATE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);
COMMENT ON TABLE public.riscos_institucionais IS 'Registro de riscos institucionais conforme metodologia COSO/TCU';

CREATE TABLE IF NOT EXISTS public.planos_tratamento_risco (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risco_id UUID NOT NULL REFERENCES public.riscos_institucionais(id) ON DELETE CASCADE,
  codigo VARCHAR(50) NOT NULL,
  titulo VARCHAR(300) NOT NULL,
  descricao TEXT NOT NULL,
  tipo_resposta VARCHAR(50) NOT NULL,
  acao_proposta TEXT NOT NULL,
  recursos_necessarios TEXT,
  responsavel_id UUID REFERENCES public.servidores(id),
  prazo_inicio DATE,
  prazo_conclusao DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'planejado',
  percentual_execucao INTEGER DEFAULT 0 CHECK (percentual_execucao >= 0 AND percentual_execucao <= 100),
  resultado_obtido TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(risco_id, codigo)
);
COMMENT ON TABLE public.planos_tratamento_risco IS 'Planos de ação para tratamento de riscos identificados';

CREATE TABLE IF NOT EXISTS public.avaliacoes_risco (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risco_id UUID NOT NULL REFERENCES public.riscos_institucionais(id) ON DELETE CASCADE,
  data_avaliacao DATE NOT NULL DEFAULT CURRENT_DATE,
  avaliador_id UUID REFERENCES public.servidores(id),
  probabilidade_avaliada public.nivel_risco NOT NULL,
  impacto_avaliado public.nivel_risco NOT NULL,
  nivel_risco_avaliado public.nivel_risco NOT NULL,
  efetividade_controles VARCHAR(50),
  observacoes TEXT,
  recomendacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
COMMENT ON TABLE public.avaliacoes_risco IS 'Histórico de avaliações periódicas dos riscos';

-- ============================================================
-- PARTE 4: TABELAS - CONTROLES INTERNOS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.controles_internos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nome VARCHAR(300) NOT NULL,
  descricao TEXT NOT NULL,
  objetivo TEXT,
  tipo public.tipo_controle NOT NULL,
  periodicidade public.periodicidade_controle NOT NULL,
  modulo_sistema VARCHAR(100),
  processo_raci_id UUID REFERENCES public.matriz_raci_processos(id),
  risco_id UUID REFERENCES public.riscos_institucionais(id),
  responsavel_id UUID REFERENCES public.servidores(id),
  unidade_responsavel_id UUID REFERENCES public.estrutura_organizacional(id),
  procedimento TEXT,
  indicador_efetividade TEXT,
  meta_indicador VARCHAR(100),
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);
COMMENT ON TABLE public.controles_internos IS 'Controles internos da instituição';

CREATE TABLE IF NOT EXISTS public.evidencias_controle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  controle_id UUID NOT NULL REFERENCES public.controles_internos(id) ON DELETE CASCADE,
  titulo VARCHAR(300) NOT NULL,
  descricao TEXT,
  tipo_evidencia VARCHAR(50) NOT NULL,
  data_evidencia DATE NOT NULL,
  arquivo_url TEXT,
  arquivo_nome VARCHAR(255),
  arquivo_hash_sha512 VARCHAR(128),
  link_externo TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
COMMENT ON TABLE public.evidencias_controle IS 'Evidências documentais dos controles internos';

CREATE TABLE IF NOT EXISTS public.avaliacoes_controle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  controle_id UUID NOT NULL REFERENCES public.controles_internos(id) ON DELETE CASCADE,
  data_avaliacao DATE NOT NULL DEFAULT CURRENT_DATE,
  avaliador_id UUID REFERENCES public.servidores(id),
  periodo_referencia VARCHAR(50),
  status_execucao VARCHAR(50) NOT NULL,
  efetividade VARCHAR(50) NOT NULL,
  valor_indicador VARCHAR(100),
  conformidade_procedimento BOOLEAN,
  pontos_atencao TEXT,
  recomendacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
COMMENT ON TABLE public.avaliacoes_controle IS 'Avaliações periódicas de efetividade dos controles';

-- ============================================================
-- PARTE 5: TABELAS - CHECKLISTS CONFORMIDADE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.checklists_conformidade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) NOT NULL,
  nome VARCHAR(300) NOT NULL,
  descricao TEXT,
  orgao_fiscalizador VARCHAR(100) NOT NULL,
  exercicio INTEGER NOT NULL,
  base_legal TEXT,
  versao INTEGER NOT NULL DEFAULT 1,
  data_vigencia_inicio DATE,
  data_vigencia_fim DATE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(codigo, exercicio)
);
COMMENT ON TABLE public.checklists_conformidade IS 'Checklists de conformidade TCE/TCU/CGU';

CREATE TABLE IF NOT EXISTS public.itens_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES public.checklists_conformidade(id) ON DELETE CASCADE,
  numero_item VARCHAR(20) NOT NULL,
  descricao TEXT NOT NULL,
  fundamentacao_legal TEXT,
  categoria VARCHAR(100),
  peso INTEGER DEFAULT 1,
  obrigatorio BOOLEAN NOT NULL DEFAULT true,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(checklist_id, numero_item)
);
COMMENT ON TABLE public.itens_checklist IS 'Itens individuais dos checklists de conformidade';

CREATE TABLE IF NOT EXISTS public.respostas_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.itens_checklist(id) ON DELETE CASCADE,
  exercicio INTEGER NOT NULL,
  status public.status_conformidade NOT NULL DEFAULT 'pendente',
  justificativa TEXT,
  evidencia_url TEXT,
  evidencia_descricao TEXT,
  responsavel_id UUID REFERENCES public.servidores(id),
  data_resposta DATE,
  plano_acao TEXT,
  prazo_regularizacao DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(item_id, exercicio)
);
COMMENT ON TABLE public.respostas_checklist IS 'Respostas aos itens de checklist por exercício';

-- ============================================================
-- PARTE 6: TABELAS - DECISÕES E PARECERES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.decisoes_administrativas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_decisao VARCHAR(50) NOT NULL,
  ano INTEGER NOT NULL,
  tipo public.tipo_decisao NOT NULL,
  ementa TEXT NOT NULL,
  fundamentacao TEXT,
  dispositivo TEXT NOT NULL,
  data_decisao DATE NOT NULL,
  autoridade_id UUID REFERENCES public.servidores(id),
  unidade_origem_id UUID REFERENCES public.estrutura_organizacional(id),
  processo_sei VARCHAR(50),
  modulo_origem VARCHAR(100),
  entidade_origem_tipo VARCHAR(100),
  entidade_origem_id UUID,
  publicado BOOLEAN NOT NULL DEFAULT false,
  data_publicacao DATE,
  veiculo_publicacao VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(numero_decisao, ano)
);
COMMENT ON TABLE public.decisoes_administrativas IS 'Registro imutável de decisões administrativas';

CREATE TABLE IF NOT EXISTS public.pareceres_tecnicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_parecer VARCHAR(50) NOT NULL,
  ano INTEGER NOT NULL,
  tipo public.tipo_parecer NOT NULL,
  assunto VARCHAR(500) NOT NULL,
  analise TEXT NOT NULL,
  fundamentacao TEXT,
  conclusao TEXT NOT NULL,
  recomendacoes TEXT,
  data_parecer DATE NOT NULL,
  autor_id UUID REFERENCES public.servidores(id),
  unidade_origem_id UUID REFERENCES public.estrutura_organizacional(id),
  processo_sei VARCHAR(50),
  modulo_origem VARCHAR(100),
  entidade_origem_tipo VARCHAR(100),
  entidade_origem_id UUID,
  decisao_vinculada_id UUID REFERENCES public.decisoes_administrativas(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(numero_parecer, ano, tipo)
);
COMMENT ON TABLE public.pareceres_tecnicos IS 'Pareceres técnicos e jurídicos vinculados a processos';

CREATE TABLE IF NOT EXISTS public.encaminhamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_origem VARCHAR(100) NOT NULL,
  origem_id UUID NOT NULL,
  numero_sequencial INTEGER NOT NULL,
  unidade_destino_id UUID REFERENCES public.estrutura_organizacional(id),
  servidor_destino_id UUID REFERENCES public.servidores(id),
  assunto VARCHAR(500) NOT NULL,
  despacho TEXT NOT NULL,
  prazo_resposta DATE,
  urgente BOOLEAN NOT NULL DEFAULT false,
  data_encaminhamento TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_recebimento TIMESTAMPTZ,
  recebido_por UUID REFERENCES auth.users(id),
  status VARCHAR(50) NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(tipo_origem, origem_id, numero_sequencial)
);
COMMENT ON TABLE public.encaminhamentos IS 'Tramitação e encaminhamentos de documentos/processos';

-- ============================================================
-- PARTE 7: ÍNDICES DE PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_raci_atribuicoes_processo ON public.matriz_raci_atribuicoes(processo_id);
CREATE INDEX IF NOT EXISTS idx_raci_atribuicoes_papel ON public.matriz_raci_atribuicoes(papel_id);
CREATE INDEX IF NOT EXISTS idx_riscos_status ON public.riscos_institucionais(status);
CREATE INDEX IF NOT EXISTS idx_riscos_modulo ON public.riscos_institucionais(modulo_afetado);
CREATE INDEX IF NOT EXISTS idx_riscos_responsavel ON public.riscos_institucionais(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_planos_risco ON public.planos_tratamento_risco(risco_id);
CREATE INDEX IF NOT EXISTS idx_planos_status ON public.planos_tratamento_risco(status);
CREATE INDEX IF NOT EXISTS idx_controles_tipo ON public.controles_internos(tipo);
CREATE INDEX IF NOT EXISTS idx_controles_modulo ON public.controles_internos(modulo_sistema);
CREATE INDEX IF NOT EXISTS idx_evidencias_controle ON public.evidencias_controle(controle_id);
CREATE INDEX IF NOT EXISTS idx_checklist_exercicio ON public.checklists_conformidade(exercicio);
CREATE INDEX IF NOT EXISTS idx_checklist_orgao ON public.checklists_conformidade(orgao_fiscalizador);
CREATE INDEX IF NOT EXISTS idx_itens_checklist ON public.itens_checklist(checklist_id);
CREATE INDEX IF NOT EXISTS idx_respostas_item ON public.respostas_checklist(item_id);
CREATE INDEX IF NOT EXISTS idx_respostas_exercicio ON public.respostas_checklist(exercicio);
CREATE INDEX IF NOT EXISTS idx_decisoes_ano ON public.decisoes_administrativas(ano);
CREATE INDEX IF NOT EXISTS idx_decisoes_tipo ON public.decisoes_administrativas(tipo);
CREATE INDEX IF NOT EXISTS idx_pareceres_ano ON public.pareceres_tecnicos(ano);
CREATE INDEX IF NOT EXISTS idx_pareceres_tipo ON public.pareceres_tecnicos(tipo);
CREATE INDEX IF NOT EXISTS idx_encaminhamentos_origem ON public.encaminhamentos(tipo_origem, origem_id);
CREATE INDEX IF NOT EXISTS idx_encaminhamentos_destino ON public.encaminhamentos(unidade_destino_id);

-- ============================================================
-- PARTE 8: HABILITAR RLS EM TODAS AS TABELAS
-- ============================================================

ALTER TABLE public.matriz_raci_processos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matriz_raci_papeis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matriz_raci_atribuicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.riscos_institucionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos_tratamento_risco ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes_risco ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.controles_internos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidencias_controle ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes_controle ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklists_conformidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.respostas_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decisoes_administrativas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pareceres_tecnicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encaminhamentos ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PARTE 9: RLS POLICIES (IDEMPOTENTE COM DROP IF EXISTS)
-- ============================================================

-- === MATRIZ RACI PROCESSOS ===
DROP POLICY IF EXISTS "raci_processos_select" ON public.matriz_raci_processos;
CREATE POLICY "raci_processos_select" ON public.matriz_raci_processos FOR SELECT TO authenticated
  USING (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.raci.visualizar'));

DROP POLICY IF EXISTS "raci_processos_insert" ON public.matriz_raci_processos;
CREATE POLICY "raci_processos_insert" ON public.matriz_raci_processos FOR INSERT TO authenticated
  WITH CHECK (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.raci.gerenciar'));

DROP POLICY IF EXISTS "raci_processos_update" ON public.matriz_raci_processos;
CREATE POLICY "raci_processos_update" ON public.matriz_raci_processos FOR UPDATE TO authenticated
  USING (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.raci.gerenciar'))
  WITH CHECK (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.raci.gerenciar'));

DROP POLICY IF EXISTS "raci_processos_delete" ON public.matriz_raci_processos;
CREATE POLICY "raci_processos_delete" ON public.matriz_raci_processos FOR DELETE TO authenticated
  USING (public.usuario_eh_admin(auth.uid()));

-- === MATRIZ RACI PAPEIS ===
DROP POLICY IF EXISTS "raci_papeis_select" ON public.matriz_raci_papeis;
CREATE POLICY "raci_papeis_select" ON public.matriz_raci_papeis FOR SELECT TO authenticated
  USING (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.raci.visualizar'));

DROP POLICY IF EXISTS "raci_papeis_insert" ON public.matriz_raci_papeis;
CREATE POLICY "raci_papeis_insert" ON public.matriz_raci_papeis FOR INSERT TO authenticated
  WITH CHECK (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.raci.gerenciar'));

DROP POLICY IF EXISTS "raci_papeis_update" ON public.matriz_raci_papeis;
CREATE POLICY "raci_papeis_update" ON public.matriz_raci_papeis FOR UPDATE TO authenticated
  USING (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.raci.gerenciar'))
  WITH CHECK (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.raci.gerenciar'));

DROP POLICY IF EXISTS "raci_papeis_delete" ON public.matriz_raci_papeis;
CREATE POLICY "raci_papeis_delete" ON public.matriz_raci_papeis FOR DELETE TO authenticated
  USING (public.usuario_eh_admin(auth.uid()));

-- === MATRIZ RACI ATRIBUICOES ===
DROP POLICY IF EXISTS "raci_atribuicoes_select" ON public.matriz_raci_atribuicoes;
CREATE POLICY "raci_atribuicoes_select" ON public.matriz_raci_atribuicoes FOR SELECT TO authenticated
  USING (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.raci.visualizar'));

DROP POLICY IF EXISTS "raci_atribuicoes_insert" ON public.matriz_raci_atribuicoes;
CREATE POLICY "raci_atribuicoes_insert" ON public.matriz_raci_atribuicoes FOR INSERT TO authenticated
  WITH CHECK (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.raci.gerenciar'));

DROP POLICY IF EXISTS "raci_atribuicoes_update" ON public.matriz_raci_atribuicoes;
CREATE POLICY "raci_atribuicoes_update" ON public.matriz_raci_atribuicoes FOR UPDATE TO authenticated
  USING (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.raci.gerenciar'))
  WITH CHECK (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.raci.gerenciar'));

DROP POLICY IF EXISTS "raci_atribuicoes_delete" ON public.matriz_raci_atribuicoes;
CREATE POLICY "raci_atribuicoes_delete" ON public.matriz_raci_atribuicoes FOR DELETE TO authenticated
  USING (public.usuario_eh_admin(auth.uid()));

-- === RISCOS INSTITUCIONAIS ===
DROP POLICY IF EXISTS "riscos_select" ON public.riscos_institucionais;
CREATE POLICY "riscos_select" ON public.riscos_institucionais FOR SELECT TO authenticated
  USING (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.riscos.visualizar'));

DROP POLICY IF EXISTS "riscos_insert" ON public.riscos_institucionais;
CREATE POLICY "riscos_insert" ON public.riscos_institucionais FOR INSERT TO authenticated
  WITH CHECK (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.riscos.gerenciar'));

DROP POLICY IF EXISTS "riscos_update" ON public.riscos_institucionais;
CREATE POLICY "riscos_update" ON public.riscos_institucionais FOR UPDATE TO authenticated
  USING (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.riscos.gerenciar'))
  WITH CHECK (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.riscos.gerenciar'));

DROP POLICY IF EXISTS "riscos_delete" ON public.riscos_institucionais;
CREATE POLICY "riscos_delete" ON public.riscos_institucionais FOR DELETE TO authenticated
  USING (public.usuario_eh_admin(auth.uid()));

-- === PLANOS TRATAMENTO RISCO ===
DROP POLICY IF EXISTS "planos_risco_select" ON public.planos_tratamento_risco;
CREATE POLICY "planos_risco_select" ON public.planos_tratamento_risco FOR SELECT TO authenticated
  USING (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.riscos.visualizar'));

DROP POLICY IF EXISTS "planos_risco_insert" ON public.planos_tratamento_risco;
CREATE POLICY "planos_risco_insert" ON public.planos_tratamento_risco FOR INSERT TO authenticated
  WITH CHECK (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.riscos.gerenciar'));

DROP POLICY IF EXISTS "planos_risco_update" ON public.planos_tratamento_risco;
CREATE POLICY "planos_risco_update" ON public.planos_tratamento_risco FOR UPDATE TO authenticated
  USING (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.riscos.gerenciar'))
  WITH CHECK (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.riscos.gerenciar'));

DROP POLICY IF EXISTS "planos_risco_delete" ON public.planos_tratamento_risco;
CREATE POLICY "planos_risco_delete" ON public.planos_tratamento_risco FOR DELETE TO authenticated
  USING (public.usuario_eh_admin(auth.uid()));

-- === AVALIACOES RISCO ===
DROP POLICY IF EXISTS "avaliacoes_risco_select" ON public.avaliacoes_risco;
CREATE POLICY "avaliacoes_risco_select" ON public.avaliacoes_risco FOR SELECT TO authenticated
  USING (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.riscos.visualizar'));

DROP POLICY IF EXISTS "avaliacoes_risco_insert" ON public.avaliacoes_risco;
CREATE POLICY "avaliacoes_risco_insert" ON public.avaliacoes_risco FOR INSERT TO authenticated
  WITH CHECK (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.riscos.avaliar'));

DROP POLICY IF EXISTS "avaliacoes_risco_update" ON public.avaliacoes_risco;
CREATE POLICY "avaliacoes_risco_update" ON public.avaliacoes_risco FOR UPDATE TO authenticated
  USING (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.riscos.avaliar'))
  WITH CHECK (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.riscos.avaliar'));

DROP POLICY IF EXISTS "avaliacoes_risco_delete" ON public.avaliacoes_risco;
CREATE POLICY "avaliacoes_risco_delete" ON public.avaliacoes_risco FOR DELETE TO authenticated
  USING (public.usuario_eh_admin(auth.uid()));

-- === CONTROLES INTERNOS ===
DROP POLICY IF EXISTS "controles_select" ON public.controles_internos;
CREATE POLICY "controles_select" ON public.controles_internos FOR SELECT TO authenticated
  USING (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.controles.visualizar'));

DROP POLICY IF EXISTS "controles_insert" ON public.controles_internos;
CREATE POLICY "controles_insert" ON public.controles_internos FOR INSERT TO authenticated
  WITH CHECK (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.controles.gerenciar'));

DROP POLICY IF EXISTS "controles_update" ON public.controles_internos;
CREATE POLICY "controles_update" ON public.controles_internos FOR UPDATE TO authenticated
  USING (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.controles.gerenciar'))
  WITH CHECK (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.controles.gerenciar'));

DROP POLICY IF EXISTS "controles_delete" ON public.controles_internos;
CREATE POLICY "controles_delete" ON public.controles_internos FOR DELETE TO authenticated
  USING (public.usuario_eh_admin(auth.uid()));

-- === EVIDENCIAS CONTROLE ===
DROP POLICY IF EXISTS "evidencias_select" ON public.evidencias_controle;
CREATE POLICY "evidencias_select" ON public.evidencias_controle FOR SELECT TO authenticated
  USING (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.controles.visualizar'));

DROP POLICY IF EXISTS "evidencias_insert" ON public.evidencias_controle;
CREATE POLICY "evidencias_insert" ON public.evidencias_controle FOR INSERT TO authenticated
  WITH CHECK (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.controles.gerenciar'));

DROP POLICY IF EXISTS "evidencias_update" ON public.evidencias_controle;
CREATE POLICY "evidencias_update" ON public.evidencias_controle FOR UPDATE TO authenticated
  USING (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.controles.gerenciar'))
  WITH CHECK (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.controles.gerenciar'));

DROP POLICY IF EXISTS "evidencias_delete" ON public.evidencias_controle;
CREATE POLICY "evidencias_delete" ON public.evidencias_controle FOR DELETE TO authenticated
  USING (public.usuario_eh_admin(auth.uid()));

-- === AVALIACOES CONTROLE ===
DROP POLICY IF EXISTS "avaliacoes_controle_select" ON public.avaliacoes_controle;
CREATE POLICY "avaliacoes_controle_select" ON public.avaliacoes_controle FOR SELECT TO authenticated
  USING (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.controles.visualizar'));

DROP POLICY IF EXISTS "avaliacoes_controle_insert" ON public.avaliacoes_controle;
CREATE POLICY "avaliacoes_controle_insert" ON public.avaliacoes_controle FOR INSERT TO authenticated
  WITH CHECK (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.controles.avaliar'));

DROP POLICY IF EXISTS "avaliacoes_controle_update" ON public.avaliacoes_controle;
CREATE POLICY "avaliacoes_controle_update" ON public.avaliacoes_controle FOR UPDATE TO authenticated
  USING (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.controles.avaliar'))
  WITH CHECK (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.controles.avaliar'));

DROP POLICY IF EXISTS "avaliacoes_controle_delete" ON public.avaliacoes_controle;
CREATE POLICY "avaliacoes_controle_delete" ON public.avaliacoes_controle FOR DELETE TO authenticated
  USING (public.usuario_eh_admin(auth.uid()));

-- === CHECKLISTS CONFORMIDADE ===
DROP POLICY IF EXISTS "checklists_select" ON public.checklists_conformidade;
CREATE POLICY "checklists_select" ON public.checklists_conformidade FOR SELECT TO authenticated
  USING (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.checklists.visualizar'));

DROP POLICY IF EXISTS "checklists_insert" ON public.checklists_conformidade;
CREATE POLICY "checklists_insert" ON public.checklists_conformidade FOR INSERT TO authenticated
  WITH CHECK (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.checklists.gerenciar'));

DROP POLICY IF EXISTS "checklists_update" ON public.checklists_conformidade;
CREATE POLICY "checklists_update" ON public.checklists_conformidade FOR UPDATE TO authenticated
  USING (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.checklists.gerenciar'))
  WITH CHECK (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.checklists.gerenciar'));

DROP POLICY IF EXISTS "checklists_delete" ON public.checklists_conformidade;
CREATE POLICY "checklists_delete" ON public.checklists_conformidade FOR DELETE TO authenticated
  USING (public.usuario_eh_admin(auth.uid()));

-- === ITENS CHECKLIST ===
DROP POLICY IF EXISTS "itens_checklist_select" ON public.itens_checklist;
CREATE POLICY "itens_checklist_select" ON public.itens_checklist FOR SELECT TO authenticated
  USING (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.checklists.visualizar'));

DROP POLICY IF EXISTS "itens_checklist_insert" ON public.itens_checklist;
CREATE POLICY "itens_checklist_insert" ON public.itens_checklist FOR INSERT TO authenticated
  WITH CHECK (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.checklists.gerenciar'));

DROP POLICY IF EXISTS "itens_checklist_update" ON public.itens_checklist;
CREATE POLICY "itens_checklist_update" ON public.itens_checklist FOR UPDATE TO authenticated
  USING (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.checklists.gerenciar'))
  WITH CHECK (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.checklists.gerenciar'));

DROP POLICY IF EXISTS "itens_checklist_delete" ON public.itens_checklist;
CREATE POLICY "itens_checklist_delete" ON public.itens_checklist FOR DELETE TO authenticated
  USING (public.usuario_eh_admin(auth.uid()));

-- === RESPOSTAS CHECKLIST ===
DROP POLICY IF EXISTS "respostas_checklist_select" ON public.respostas_checklist;
CREATE POLICY "respostas_checklist_select" ON public.respostas_checklist FOR SELECT TO authenticated
  USING (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.checklists.visualizar'));

DROP POLICY IF EXISTS "respostas_checklist_insert" ON public.respostas_checklist;
CREATE POLICY "respostas_checklist_insert" ON public.respostas_checklist FOR INSERT TO authenticated
  WITH CHECK (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.checklists.responder'));

DROP POLICY IF EXISTS "respostas_checklist_update" ON public.respostas_checklist;
CREATE POLICY "respostas_checklist_update" ON public.respostas_checklist FOR UPDATE TO authenticated
  USING (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.checklists.responder'))
  WITH CHECK (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.checklists.responder'));

DROP POLICY IF EXISTS "respostas_checklist_delete" ON public.respostas_checklist;
CREATE POLICY "respostas_checklist_delete" ON public.respostas_checklist FOR DELETE TO authenticated
  USING (public.usuario_eh_admin(auth.uid()));

-- === DECISOES ADMINISTRATIVAS ===
DROP POLICY IF EXISTS "decisoes_select" ON public.decisoes_administrativas;
CREATE POLICY "decisoes_select" ON public.decisoes_administrativas FOR SELECT TO authenticated
  USING (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.decisoes.visualizar'));

DROP POLICY IF EXISTS "decisoes_insert" ON public.decisoes_administrativas;
CREATE POLICY "decisoes_insert" ON public.decisoes_administrativas FOR INSERT TO authenticated
  WITH CHECK (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.decisoes.registrar'));

DROP POLICY IF EXISTS "decisoes_update" ON public.decisoes_administrativas;
CREATE POLICY "decisoes_update" ON public.decisoes_administrativas FOR UPDATE TO authenticated
  USING (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.decisoes.registrar'))
  WITH CHECK (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.decisoes.registrar'));

DROP POLICY IF EXISTS "decisoes_delete" ON public.decisoes_administrativas;
CREATE POLICY "decisoes_delete" ON public.decisoes_administrativas FOR DELETE TO authenticated
  USING (public.usuario_eh_admin(auth.uid()));

-- === PARECERES TECNICOS ===
DROP POLICY IF EXISTS "pareceres_select" ON public.pareceres_tecnicos;
CREATE POLICY "pareceres_select" ON public.pareceres_tecnicos FOR SELECT TO authenticated
  USING (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.pareceres.visualizar'));

DROP POLICY IF EXISTS "pareceres_insert" ON public.pareceres_tecnicos;
CREATE POLICY "pareceres_insert" ON public.pareceres_tecnicos FOR INSERT TO authenticated
  WITH CHECK (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.pareceres.emitir'));

DROP POLICY IF EXISTS "pareceres_update" ON public.pareceres_tecnicos;
CREATE POLICY "pareceres_update" ON public.pareceres_tecnicos FOR UPDATE TO authenticated
  USING (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.pareceres.emitir'))
  WITH CHECK (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.pareceres.emitir'));

DROP POLICY IF EXISTS "pareceres_delete" ON public.pareceres_tecnicos;
CREATE POLICY "pareceres_delete" ON public.pareceres_tecnicos FOR DELETE TO authenticated
  USING (public.usuario_eh_admin(auth.uid()));

-- === ENCAMINHAMENTOS ===
DROP POLICY IF EXISTS "encaminhamentos_select" ON public.encaminhamentos;
CREATE POLICY "encaminhamentos_select" ON public.encaminhamentos FOR SELECT TO authenticated
  USING (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.encaminhamentos.visualizar'));

DROP POLICY IF EXISTS "encaminhamentos_insert" ON public.encaminhamentos;
CREATE POLICY "encaminhamentos_insert" ON public.encaminhamentos FOR INSERT TO authenticated
  WITH CHECK (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.encaminhamentos.criar'));

DROP POLICY IF EXISTS "encaminhamentos_update" ON public.encaminhamentos;
CREATE POLICY "encaminhamentos_update" ON public.encaminhamentos FOR UPDATE TO authenticated
  USING (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.encaminhamentos.criar'))
  WITH CHECK (public.usuario_eh_admin(auth.uid()) OR public.usuario_tem_permissao(auth.uid(), 'governanca.encaminhamentos.criar'));

DROP POLICY IF EXISTS "encaminhamentos_delete" ON public.encaminhamentos;
CREATE POLICY "encaminhamentos_delete" ON public.encaminhamentos FOR DELETE TO authenticated
  USING (public.usuario_eh_admin(auth.uid()));

-- ============================================================
-- PARTE 10: TRIGGERS UPDATED_AT (usando handle_updated_at existente)
-- ============================================================

DROP TRIGGER IF EXISTS update_matriz_raci_processos_updated_at ON public.matriz_raci_processos;
CREATE TRIGGER update_matriz_raci_processos_updated_at
  BEFORE UPDATE ON public.matriz_raci_processos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_matriz_raci_papeis_updated_at ON public.matriz_raci_papeis;
CREATE TRIGGER update_matriz_raci_papeis_updated_at
  BEFORE UPDATE ON public.matriz_raci_papeis
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_matriz_raci_atribuicoes_updated_at ON public.matriz_raci_atribuicoes;
CREATE TRIGGER update_matriz_raci_atribuicoes_updated_at
  BEFORE UPDATE ON public.matriz_raci_atribuicoes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_riscos_institucionais_updated_at ON public.riscos_institucionais;
CREATE TRIGGER update_riscos_institucionais_updated_at
  BEFORE UPDATE ON public.riscos_institucionais
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_planos_tratamento_risco_updated_at ON public.planos_tratamento_risco;
CREATE TRIGGER update_planos_tratamento_risco_updated_at
  BEFORE UPDATE ON public.planos_tratamento_risco
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_avaliacoes_risco_updated_at ON public.avaliacoes_risco;
CREATE TRIGGER update_avaliacoes_risco_updated_at
  BEFORE UPDATE ON public.avaliacoes_risco
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_controles_internos_updated_at ON public.controles_internos;
CREATE TRIGGER update_controles_internos_updated_at
  BEFORE UPDATE ON public.controles_internos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_evidencias_controle_updated_at ON public.evidencias_controle;
CREATE TRIGGER update_evidencias_controle_updated_at
  BEFORE UPDATE ON public.evidencias_controle
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_avaliacoes_controle_updated_at ON public.avaliacoes_controle;
CREATE TRIGGER update_avaliacoes_controle_updated_at
  BEFORE UPDATE ON public.avaliacoes_controle
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_checklists_conformidade_updated_at ON public.checklists_conformidade;
CREATE TRIGGER update_checklists_conformidade_updated_at
  BEFORE UPDATE ON public.checklists_conformidade
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_itens_checklist_updated_at ON public.itens_checklist;
CREATE TRIGGER update_itens_checklist_updated_at
  BEFORE UPDATE ON public.itens_checklist
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_respostas_checklist_updated_at ON public.respostas_checklist;
CREATE TRIGGER update_respostas_checklist_updated_at
  BEFORE UPDATE ON public.respostas_checklist
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_decisoes_administrativas_updated_at ON public.decisoes_administrativas;
CREATE TRIGGER update_decisoes_administrativas_updated_at
  BEFORE UPDATE ON public.decisoes_administrativas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_pareceres_tecnicos_updated_at ON public.pareceres_tecnicos;
CREATE TRIGGER update_pareceres_tecnicos_updated_at
  BEFORE UPDATE ON public.pareceres_tecnicos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_encaminhamentos_updated_at ON public.encaminhamentos;
CREATE TRIGGER update_encaminhamentos_updated_at
  BEFORE UPDATE ON public.encaminhamentos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- PARTE 11: TRIGGERS DE AUDITORIA (fn_audit_log_licitacoes)
-- ============================================================

DROP TRIGGER IF EXISTS audit_matriz_raci_processos ON public.matriz_raci_processos;
CREATE TRIGGER audit_matriz_raci_processos
  AFTER INSERT OR UPDATE OR DELETE ON public.matriz_raci_processos
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();

DROP TRIGGER IF EXISTS audit_matriz_raci_papeis ON public.matriz_raci_papeis;
CREATE TRIGGER audit_matriz_raci_papeis
  AFTER INSERT OR UPDATE OR DELETE ON public.matriz_raci_papeis
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();

DROP TRIGGER IF EXISTS audit_matriz_raci_atribuicoes ON public.matriz_raci_atribuicoes;
CREATE TRIGGER audit_matriz_raci_atribuicoes
  AFTER INSERT OR UPDATE OR DELETE ON public.matriz_raci_atribuicoes
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();

DROP TRIGGER IF EXISTS audit_riscos_institucionais ON public.riscos_institucionais;
CREATE TRIGGER audit_riscos_institucionais
  AFTER INSERT OR UPDATE OR DELETE ON public.riscos_institucionais
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();

DROP TRIGGER IF EXISTS audit_planos_tratamento_risco ON public.planos_tratamento_risco;
CREATE TRIGGER audit_planos_tratamento_risco
  AFTER INSERT OR UPDATE OR DELETE ON public.planos_tratamento_risco
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();

DROP TRIGGER IF EXISTS audit_avaliacoes_risco ON public.avaliacoes_risco;
CREATE TRIGGER audit_avaliacoes_risco
  AFTER INSERT OR UPDATE OR DELETE ON public.avaliacoes_risco
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();

DROP TRIGGER IF EXISTS audit_controles_internos ON public.controles_internos;
CREATE TRIGGER audit_controles_internos
  AFTER INSERT OR UPDATE OR DELETE ON public.controles_internos
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();

DROP TRIGGER IF EXISTS audit_evidencias_controle ON public.evidencias_controle;
CREATE TRIGGER audit_evidencias_controle
  AFTER INSERT OR UPDATE OR DELETE ON public.evidencias_controle
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();

DROP TRIGGER IF EXISTS audit_avaliacoes_controle ON public.avaliacoes_controle;
CREATE TRIGGER audit_avaliacoes_controle
  AFTER INSERT OR UPDATE OR DELETE ON public.avaliacoes_controle
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();

DROP TRIGGER IF EXISTS audit_checklists_conformidade ON public.checklists_conformidade;
CREATE TRIGGER audit_checklists_conformidade
  AFTER INSERT OR UPDATE OR DELETE ON public.checklists_conformidade
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();

DROP TRIGGER IF EXISTS audit_itens_checklist ON public.itens_checklist;
CREATE TRIGGER audit_itens_checklist
  AFTER INSERT OR UPDATE OR DELETE ON public.itens_checklist
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();

DROP TRIGGER IF EXISTS audit_respostas_checklist ON public.respostas_checklist;
CREATE TRIGGER audit_respostas_checklist
  AFTER INSERT OR UPDATE OR DELETE ON public.respostas_checklist
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();

DROP TRIGGER IF EXISTS audit_decisoes_administrativas ON public.decisoes_administrativas;
CREATE TRIGGER audit_decisoes_administrativas
  AFTER INSERT OR UPDATE OR DELETE ON public.decisoes_administrativas
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();

DROP TRIGGER IF EXISTS audit_pareceres_tecnicos ON public.pareceres_tecnicos;
CREATE TRIGGER audit_pareceres_tecnicos
  AFTER INSERT OR UPDATE OR DELETE ON public.pareceres_tecnicos
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();

DROP TRIGGER IF EXISTS audit_encaminhamentos ON public.encaminhamentos;
CREATE TRIGGER audit_encaminhamentos
  AFTER INSERT OR UPDATE OR DELETE ON public.encaminhamentos
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();

-- ============================================================
-- PARTE 12: INSERIR FUNÇÕES DO SISTEMA PARA RBAC
-- ============================================================

INSERT INTO public.funcoes_sistema (codigo, nome, modulo, submodulo, tipo_acao, ordem, ativo) VALUES
  ('governanca', 'Módulo Governança', 'governanca', NULL, 'acessar', 100, true),
  ('governanca.raci', 'Matriz RACI', 'governanca', 'raci', 'acessar', 101, true),
  ('governanca.raci.visualizar', 'Visualizar RACI', 'governanca', 'raci', 'visualizar', 102, true),
  ('governanca.raci.gerenciar', 'Gerenciar RACI', 'governanca', 'raci', 'gerenciar', 103, true),
  ('governanca.riscos', 'Gestão de Riscos', 'governanca', 'riscos', 'acessar', 110, true),
  ('governanca.riscos.visualizar', 'Visualizar Riscos', 'governanca', 'riscos', 'visualizar', 111, true),
  ('governanca.riscos.gerenciar', 'Gerenciar Riscos', 'governanca', 'riscos', 'gerenciar', 112, true),
  ('governanca.riscos.avaliar', 'Avaliar Riscos', 'governanca', 'riscos', 'avaliar', 113, true),
  ('governanca.controles', 'Controles Internos', 'governanca', 'controles', 'acessar', 120, true),
  ('governanca.controles.visualizar', 'Visualizar Controles', 'governanca', 'controles', 'visualizar', 121, true),
  ('governanca.controles.gerenciar', 'Gerenciar Controles', 'governanca', 'controles', 'gerenciar', 122, true),
  ('governanca.controles.avaliar', 'Avaliar Controles', 'governanca', 'controles', 'avaliar', 123, true),
  ('governanca.checklists', 'Checklists Conformidade', 'governanca', 'checklists', 'acessar', 130, true),
  ('governanca.checklists.visualizar', 'Visualizar Checklists', 'governanca', 'checklists', 'visualizar', 131, true),
  ('governanca.checklists.gerenciar', 'Gerenciar Checklists', 'governanca', 'checklists', 'gerenciar', 132, true),
  ('governanca.checklists.responder', 'Responder Checklists', 'governanca', 'checklists', 'responder', 133, true),
  ('governanca.decisoes', 'Decisões Administrativas', 'governanca', 'decisoes', 'acessar', 140, true),
  ('governanca.decisoes.visualizar', 'Visualizar Decisões', 'governanca', 'decisoes', 'visualizar', 141, true),
  ('governanca.decisoes.registrar', 'Registrar Decisões', 'governanca', 'decisoes', 'registrar', 142, true),
  ('governanca.pareceres', 'Pareceres Técnicos', 'governanca', 'pareceres', 'acessar', 150, true),
  ('governanca.pareceres.visualizar', 'Visualizar Pareceres', 'governanca', 'pareceres', 'visualizar', 151, true),
  ('governanca.pareceres.emitir', 'Emitir Pareceres', 'governanca', 'pareceres', 'emitir', 152, true),
  ('governanca.encaminhamentos', 'Encaminhamentos', 'governanca', 'encaminhamentos', 'acessar', 160, true),
  ('governanca.encaminhamentos.visualizar', 'Visualizar Encaminhamentos', 'governanca', 'encaminhamentos', 'visualizar', 161, true),
  ('governanca.encaminhamentos.criar', 'Criar Encaminhamentos', 'governanca', 'encaminhamentos', 'criar', 162, true)
ON CONFLICT (codigo) DO NOTHING;

-- Conceder funções de governança ao Super Admin
INSERT INTO public.perfil_funcoes (perfil_id, funcao_id, concedido)
SELECT 
  (SELECT id FROM public.perfis WHERE codigo = 'super_admin'),
  f.id,
  true
FROM public.funcoes_sistema f
WHERE f.modulo = 'governanca'
ON CONFLICT (perfil_id, funcao_id) DO NOTHING;

-- ============================================================
-- FIM DA MIGRAÇÃO FASE 5 - GOVERNANÇA E COMPLIANCE
-- ============================================================