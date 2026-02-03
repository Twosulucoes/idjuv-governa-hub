-- =====================================================
-- MÓDULO FINANCEIRO COMPLETO - AUTARQUIA IDJuv
-- =====================================================
-- Fase 1: Cadastros Base e Orçamento
-- Fase 2: Fluxo de Despesa (Solicitação → Pagamento)
-- Fase 3: Receitas, Adiantamentos e Conciliação
-- Fase 4: Contabilidade e Controles
-- =====================================================

-- ===========================================
-- 1. ENUMS DO MÓDULO FINANCEIRO
-- ===========================================

-- Status genérico de workflow financeiro
CREATE TYPE public.status_workflow_financeiro AS ENUM (
  'rascunho',
  'pendente_analise',
  'em_analise',
  'aprovado',
  'rejeitado',
  'cancelado',
  'executado',
  'estornado'
);

-- Tipos de alteração orçamentária
CREATE TYPE public.tipo_alteracao_orcamentaria AS ENUM (
  'suplementacao',
  'reducao',
  'remanejamento',
  'transposicao',
  'transferencia',
  'credito_especial',
  'credito_extraordinario'
);

-- Status de empenho
CREATE TYPE public.status_empenho AS ENUM (
  'emitido',
  'parcialmente_liquidado',
  'liquidado',
  'parcialmente_pago',
  'pago',
  'anulado'
);

-- Tipos de empenho
CREATE TYPE public.tipo_empenho AS ENUM (
  'ordinario',
  'estimativo',
  'global'
);

-- Status de liquidação
CREATE TYPE public.status_liquidacao AS ENUM (
  'pendente',
  'atestada',
  'aprovada',
  'rejeitada',
  'cancelada'
);

-- Status de pagamento
CREATE TYPE public.status_pagamento AS ENUM (
  'programado',
  'autorizado',
  'pago',
  'devolvido',
  'estornado',
  'cancelado'
);

-- Tipos de receita
CREATE TYPE public.tipo_receita AS ENUM (
  'repasse_tesouro',
  'convenio',
  'doacao',
  'restituicao',
  'rendimento_aplicacao',
  'taxa_servico',
  'multa',
  'outros'
);

-- Status de adiantamento
CREATE TYPE public.status_adiantamento AS ENUM (
  'solicitado',
  'autorizado',
  'liberado',
  'em_uso',
  'prestacao_pendente',
  'prestado',
  'aprovado',
  'rejeitado',
  'bloqueado'
);

-- Tipos de conta bancária
CREATE TYPE public.tipo_conta_bancaria AS ENUM (
  'corrente',
  'poupanca',
  'aplicacao',
  'vinculada'
);

-- Status de conciliação
CREATE TYPE public.status_conciliacao AS ENUM (
  'pendente',
  'conciliado',
  'divergente',
  'justificado'
);

-- Natureza contábil
CREATE TYPE public.natureza_conta AS ENUM (
  'ativo',
  'passivo',
  'patrimonio_liquido',
  'receita',
  'despesa',
  'resultado'
);

-- ===========================================
-- 2. CADASTROS BASE
-- ===========================================

-- 2.1 Plano de Contas Contábil
CREATE TABLE public.fin_plano_contas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(20) NOT NULL UNIQUE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  natureza natureza_conta NOT NULL,
  nivel INTEGER NOT NULL DEFAULT 1,
  conta_pai_id UUID REFERENCES public.fin_plano_contas(id),
  aceita_lancamento BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_fin_plano_contas_codigo ON public.fin_plano_contas(codigo);
CREATE INDEX idx_fin_plano_contas_pai ON public.fin_plano_contas(conta_pai_id);

-- 2.2 Fontes de Recurso
CREATE TABLE public.fin_fontes_recurso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(20) NOT NULL UNIQUE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  origem VARCHAR(100), -- 'tesouro_estadual', 'convenio_federal', 'doacao', etc.
  detalhamento_fonte VARCHAR(50),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.3 Natureza de Despesa (elemento de despesa)
CREATE TABLE public.fin_naturezas_despesa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(20) NOT NULL UNIQUE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  categoria_economica VARCHAR(1), -- 3=Corrente, 4=Capital
  grupo_natureza VARCHAR(1), -- 1=Pessoal, 2=Encargos, 3=ODC, 4=Investimentos, 5=Inversões, 6=Amortização
  modalidade_aplicacao VARCHAR(2),
  elemento VARCHAR(2),
  subelemento VARCHAR(2),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_fin_naturezas_codigo ON public.fin_naturezas_despesa(codigo);

-- 2.4 Programas e Ações Orçamentárias
CREATE TABLE public.fin_programas_orcamentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(20) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  objetivo TEXT,
  exercicio INTEGER NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(codigo, exercicio)
);

CREATE TABLE public.fin_acoes_orcamentarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  programa_id UUID NOT NULL REFERENCES public.fin_programas_orcamentarios(id),
  codigo VARCHAR(20) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(20) DEFAULT 'atividade', -- atividade, projeto, operacao_especial
  descricao TEXT,
  produto VARCHAR(255),
  unidade_medida VARCHAR(50),
  meta_fisica NUMERIC(15,2),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_fin_acoes_programa ON public.fin_acoes_orcamentarias(programa_id);

-- 2.5 Dotações Orçamentárias (LOA)
CREATE TABLE public.fin_dotacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercicio INTEGER NOT NULL,
  unidade_orcamentaria_id UUID REFERENCES public.estrutura_organizacional(id),
  programa_id UUID REFERENCES public.fin_programas_orcamentarios(id),
  acao_id UUID REFERENCES public.fin_acoes_orcamentarias(id),
  natureza_despesa_id UUID REFERENCES public.fin_naturezas_despesa(id),
  fonte_recurso_id UUID REFERENCES public.fin_fontes_recurso(id),
  codigo_dotacao VARCHAR(50) NOT NULL,
  valor_inicial NUMERIC(15,2) NOT NULL DEFAULT 0,
  valor_suplementado NUMERIC(15,2) DEFAULT 0,
  valor_reduzido NUMERIC(15,2) DEFAULT 0,
  valor_atual NUMERIC(15,2) GENERATED ALWAYS AS (valor_inicial + COALESCE(valor_suplementado, 0) - COALESCE(valor_reduzido, 0)) STORED,
  valor_empenhado NUMERIC(15,2) DEFAULT 0,
  valor_liquidado NUMERIC(15,2) DEFAULT 0,
  valor_pago NUMERIC(15,2) DEFAULT 0,
  saldo_disponivel NUMERIC(15,2) GENERATED ALWAYS AS (
    valor_inicial + COALESCE(valor_suplementado, 0) - COALESCE(valor_reduzido, 0) - COALESCE(valor_empenhado, 0)
  ) STORED,
  bloqueado BOOLEAN DEFAULT false,
  motivo_bloqueio TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(codigo_dotacao, exercicio)
);

CREATE INDEX idx_fin_dotacoes_exercicio ON public.fin_dotacoes(exercicio);
CREATE INDEX idx_fin_dotacoes_unidade ON public.fin_dotacoes(unidade_orcamentaria_id);
CREATE INDEX idx_fin_dotacoes_acao ON public.fin_dotacoes(acao_id);
CREATE INDEX idx_fin_dotacoes_fonte ON public.fin_dotacoes(fonte_recurso_id);

-- 2.6 Alterações Orçamentárias
CREATE TABLE public.fin_alteracoes_orcamentarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero VARCHAR(20) NOT NULL,
  exercicio INTEGER NOT NULL,
  tipo tipo_alteracao_orcamentaria NOT NULL,
  data_alteracao DATE NOT NULL DEFAULT CURRENT_DATE,
  dotacao_origem_id UUID REFERENCES public.fin_dotacoes(id),
  dotacao_destino_id UUID REFERENCES public.fin_dotacoes(id),
  valor NUMERIC(15,2) NOT NULL,
  justificativa TEXT NOT NULL,
  fundamentacao_legal TEXT,
  status status_workflow_financeiro DEFAULT 'rascunho',
  aprovado_por UUID REFERENCES auth.users(id),
  aprovado_em TIMESTAMPTZ,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(numero, exercicio)
);

-- 2.7 Contas Bancárias
CREATE TABLE public.fin_contas_bancarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banco_codigo VARCHAR(3) NOT NULL,
  banco_nome VARCHAR(100) NOT NULL,
  agencia VARCHAR(10) NOT NULL,
  agencia_digito VARCHAR(2),
  conta VARCHAR(20) NOT NULL,
  conta_digito VARCHAR(2),
  tipo tipo_conta_bancaria NOT NULL DEFAULT 'corrente',
  nome_conta VARCHAR(255) NOT NULL,
  finalidade TEXT,
  fonte_recurso_id UUID REFERENCES public.fin_fontes_recurso(id),
  saldo_atual NUMERIC(15,2) DEFAULT 0,
  data_ultimo_saldo DATE,
  responsavel_id UUID REFERENCES public.servidores(id),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_fin_contas_banco ON public.fin_contas_bancarias(banco_codigo);

-- 2.8 Parâmetros Financeiros
CREATE TABLE public.fin_parametros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave VARCHAR(100) NOT NULL UNIQUE,
  valor TEXT NOT NULL,
  tipo VARCHAR(20) DEFAULT 'texto', -- texto, numero, booleano, json
  descricao TEXT,
  categoria VARCHAR(50),
  editavel BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================================
-- 3. FLUXO DE DESPESA
-- ===========================================

-- 3.1 Solicitações de Despesa
CREATE TABLE public.fin_solicitacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero VARCHAR(20) NOT NULL,
  exercicio INTEGER NOT NULL,
  data_solicitacao DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Demandante
  unidade_solicitante_id UUID NOT NULL REFERENCES public.estrutura_organizacional(id),
  servidor_solicitante_id UUID REFERENCES public.servidores(id),
  
  -- Classificação
  tipo_despesa VARCHAR(50) NOT NULL, -- material, servico, diaria, evento, repasse, obra
  objeto TEXT NOT NULL,
  justificativa TEXT NOT NULL,
  
  -- Orçamento estimado
  valor_estimado NUMERIC(15,2) NOT NULL,
  dotacao_sugerida_id UUID REFERENCES public.fin_dotacoes(id),
  
  -- Fornecedor (se já definido)
  fornecedor_id UUID REFERENCES public.fornecedores(id),
  
  -- Vinculações
  contrato_id UUID REFERENCES public.contratos(id),
  processo_licitatorio_id UUID REFERENCES public.processos_licitatorios(id),
  
  -- Workflow
  status status_workflow_financeiro DEFAULT 'rascunho',
  prioridade VARCHAR(20) DEFAULT 'normal', -- baixa, normal, alta, urgente
  prazo_execucao DATE,
  
  -- Controle Interno
  parecer_ci TEXT,
  ci_aprovado_por UUID REFERENCES auth.users(id),
  ci_aprovado_em TIMESTAMPTZ,
  ressalvas_ci TEXT,
  
  -- Autorização
  autorizado_por UUID REFERENCES auth.users(id),
  autorizado_em TIMESTAMPTZ,
  motivo_rejeicao TEXT,
  
  -- Metadata
  observacoes TEXT,
  historico_status JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(numero, exercicio)
);

CREATE INDEX idx_fin_solicitacoes_unidade ON public.fin_solicitacoes(unidade_solicitante_id);
CREATE INDEX idx_fin_solicitacoes_status ON public.fin_solicitacoes(status);
CREATE INDEX idx_fin_solicitacoes_exercicio ON public.fin_solicitacoes(exercicio);

-- 3.2 Itens da Solicitação
CREATE TABLE public.fin_solicitacao_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitacao_id UUID NOT NULL REFERENCES public.fin_solicitacoes(id) ON DELETE CASCADE,
  item_numero INTEGER NOT NULL,
  descricao TEXT NOT NULL,
  unidade VARCHAR(20),
  quantidade NUMERIC(15,4) NOT NULL DEFAULT 1,
  valor_unitario_estimado NUMERIC(15,4),
  valor_total_estimado NUMERIC(15,2) GENERATED ALWAYS AS (quantidade * COALESCE(valor_unitario_estimado, 0)) STORED,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_fin_solicitacao_itens_sol ON public.fin_solicitacao_itens(solicitacao_id);

-- 3.3 Checklist do Controle Interno
CREATE TABLE public.fin_checklist_ci (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitacao_id UUID NOT NULL REFERENCES public.fin_solicitacoes(id),
  item_verificacao VARCHAR(255) NOT NULL,
  obrigatorio BOOLEAN DEFAULT true,
  conforme BOOLEAN,
  observacao TEXT,
  verificado_por UUID REFERENCES auth.users(id),
  verificado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3.4 Empenhos
CREATE TABLE public.fin_empenhos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero VARCHAR(20) NOT NULL,
  exercicio INTEGER NOT NULL,
  data_empenho DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Vinculações
  solicitacao_id UUID REFERENCES public.fin_solicitacoes(id),
  dotacao_id UUID NOT NULL REFERENCES public.fin_dotacoes(id),
  fornecedor_id UUID NOT NULL REFERENCES public.fornecedores(id),
  contrato_id UUID REFERENCES public.contratos(id),
  
  -- Classificação
  tipo tipo_empenho NOT NULL DEFAULT 'ordinario',
  natureza_despesa_id UUID REFERENCES public.fin_naturezas_despesa(id),
  fonte_recurso_id UUID REFERENCES public.fin_fontes_recurso(id),
  
  -- Valores
  valor_empenhado NUMERIC(15,2) NOT NULL,
  valor_liquidado NUMERIC(15,2) DEFAULT 0,
  valor_pago NUMERIC(15,2) DEFAULT 0,
  valor_anulado NUMERIC(15,2) DEFAULT 0,
  saldo_liquidar NUMERIC(15,2) GENERATED ALWAYS AS (valor_empenhado - COALESCE(valor_anulado, 0) - COALESCE(valor_liquidado, 0)) STORED,
  saldo_pagar NUMERIC(15,2) GENERATED ALWAYS AS (COALESCE(valor_liquidado, 0) - COALESCE(valor_pago, 0)) STORED,
  
  -- Detalhamento
  objeto TEXT NOT NULL,
  processo_sei VARCHAR(50),
  
  -- Status e controle
  status status_empenho DEFAULT 'emitido',
  emitido_por UUID REFERENCES auth.users(id),
  
  -- Inscrição em Restos a Pagar
  inscrito_rp BOOLEAN DEFAULT false,
  data_inscricao_rp DATE,
  tipo_rp VARCHAR(20), -- processado, nao_processado
  
  -- Metadata
  observacoes TEXT,
  historico_status JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(numero, exercicio)
);

CREATE INDEX idx_fin_empenhos_exercicio ON public.fin_empenhos(exercicio);
CREATE INDEX idx_fin_empenhos_fornecedor ON public.fin_empenhos(fornecedor_id);
CREATE INDEX idx_fin_empenhos_dotacao ON public.fin_empenhos(dotacao_id);
CREATE INDEX idx_fin_empenhos_contrato ON public.fin_empenhos(contrato_id);
CREATE INDEX idx_fin_empenhos_status ON public.fin_empenhos(status);

-- 3.5 Anulações de Empenho
CREATE TABLE public.fin_empenho_anulacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empenho_id UUID NOT NULL REFERENCES public.fin_empenhos(id),
  numero VARCHAR(20) NOT NULL,
  data_anulacao DATE NOT NULL DEFAULT CURRENT_DATE,
  valor NUMERIC(15,2) NOT NULL,
  motivo TEXT NOT NULL,
  anulado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3.6 Liquidações
CREATE TABLE public.fin_liquidacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero VARCHAR(20) NOT NULL,
  exercicio INTEGER NOT NULL,
  data_liquidacao DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Vinculação ao empenho
  empenho_id UUID NOT NULL REFERENCES public.fin_empenhos(id),
  
  -- Documento fiscal
  tipo_documento VARCHAR(50) NOT NULL, -- nota_fiscal, recibo, fatura, cupom_fiscal
  numero_documento VARCHAR(50) NOT NULL,
  serie_documento VARCHAR(10),
  data_documento DATE NOT NULL,
  chave_nfe VARCHAR(50),
  
  -- Valores
  valor_documento NUMERIC(15,2) NOT NULL,
  valor_liquidado NUMERIC(15,2) NOT NULL,
  valor_retencoes NUMERIC(15,2) DEFAULT 0,
  valor_liquido NUMERIC(15,2) GENERATED ALWAYS AS (valor_liquidado - COALESCE(valor_retencoes, 0)) STORED,
  
  -- Retenções detalhadas
  retencao_inss NUMERIC(15,2) DEFAULT 0,
  retencao_irrf NUMERIC(15,2) DEFAULT 0,
  retencao_iss NUMERIC(15,2) DEFAULT 0,
  outras_retencoes NUMERIC(15,2) DEFAULT 0,
  
  -- Atesto
  atestado_por UUID REFERENCES auth.users(id),
  atestado_em TIMESTAMPTZ,
  cargo_atestante VARCHAR(255),
  
  -- Status
  status status_liquidacao DEFAULT 'pendente',
  aprovado_por UUID REFERENCES auth.users(id),
  aprovado_em TIMESTAMPTZ,
  motivo_rejeicao TEXT,
  
  -- Metadata
  observacoes TEXT,
  historico_status JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(numero, exercicio)
);

CREATE INDEX idx_fin_liquidacoes_empenho ON public.fin_liquidacoes(empenho_id);
CREATE INDEX idx_fin_liquidacoes_status ON public.fin_liquidacoes(status);
CREATE INDEX idx_fin_liquidacoes_exercicio ON public.fin_liquidacoes(exercicio);

-- 3.7 Pagamentos
CREATE TABLE public.fin_pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero VARCHAR(20) NOT NULL,
  exercicio INTEGER NOT NULL,
  data_pagamento DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Vinculação
  liquidacao_id UUID NOT NULL REFERENCES public.fin_liquidacoes(id),
  empenho_id UUID NOT NULL REFERENCES public.fin_empenhos(id),
  conta_bancaria_id UUID NOT NULL REFERENCES public.fin_contas_bancarias(id),
  
  -- Favorecido
  fornecedor_id UUID REFERENCES public.fornecedores(id),
  banco_favorecido VARCHAR(3),
  agencia_favorecido VARCHAR(10),
  conta_favorecido VARCHAR(20),
  tipo_conta_favorecido VARCHAR(20),
  
  -- Valores
  valor_bruto NUMERIC(15,2) NOT NULL,
  valor_retencoes NUMERIC(15,2) DEFAULT 0,
  valor_liquido NUMERIC(15,2) GENERATED ALWAYS AS (valor_bruto - COALESCE(valor_retencoes, 0)) STORED,
  
  -- Forma de pagamento
  forma_pagamento VARCHAR(20) NOT NULL, -- ted, pix, doc, boleto, ob, cheque
  identificador_transacao VARCHAR(100), -- código TED/PIX/DOC
  data_efetivacao DATE,
  
  -- Status
  status status_pagamento DEFAULT 'programado',
  autorizado_por UUID REFERENCES auth.users(id),
  autorizado_em TIMESTAMPTZ,
  executado_por UUID REFERENCES auth.users(id),
  executado_em TIMESTAMPTZ,
  
  -- Estorno
  estornado BOOLEAN DEFAULT false,
  data_estorno DATE,
  motivo_estorno TEXT,
  estornado_por UUID REFERENCES auth.users(id),
  
  -- Metadata
  observacoes TEXT,
  historico_status JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(numero, exercicio)
);

CREATE INDEX idx_fin_pagamentos_liquidacao ON public.fin_pagamentos(liquidacao_id);
CREATE INDEX idx_fin_pagamentos_empenho ON public.fin_pagamentos(empenho_id);
CREATE INDEX idx_fin_pagamentos_conta ON public.fin_pagamentos(conta_bancaria_id);
CREATE INDEX idx_fin_pagamentos_status ON public.fin_pagamentos(status);
CREATE INDEX idx_fin_pagamentos_data ON public.fin_pagamentos(data_pagamento);

-- ===========================================
-- 4. RECEITAS E ARRECADAÇÃO
-- ===========================================

CREATE TABLE public.fin_receitas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero VARCHAR(20) NOT NULL,
  exercicio INTEGER NOT NULL,
  data_receita DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Classificação
  tipo tipo_receita NOT NULL,
  fonte_recurso_id UUID REFERENCES public.fin_fontes_recurso(id),
  conta_bancaria_id UUID REFERENCES public.fin_contas_bancarias(id),
  
  -- Origem
  origem_descricao TEXT NOT NULL,
  documento_origem VARCHAR(100), -- número do termo/convênio/etc
  entidade_pagadora VARCHAR(255),
  cnpj_cpf_pagador VARCHAR(20),
  
  -- Valores
  valor NUMERIC(15,2) NOT NULL,
  
  -- Vinculação a convênio/contrato
  convenio_id UUID REFERENCES public.contratos(id),
  
  -- Conciliação
  conciliado BOOLEAN DEFAULT false,
  conciliacao_id UUID, -- referência à transação bancária
  
  -- Metadata
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(numero, exercicio)
);

CREATE INDEX idx_fin_receitas_tipo ON public.fin_receitas(tipo);
CREATE INDEX idx_fin_receitas_conta ON public.fin_receitas(conta_bancaria_id);
CREATE INDEX idx_fin_receitas_exercicio ON public.fin_receitas(exercicio);

-- ===========================================
-- 5. ADIANTAMENTOS / SUPRIMENTO DE FUNDOS
-- ===========================================

CREATE TABLE public.fin_adiantamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero VARCHAR(20) NOT NULL,
  exercicio INTEGER NOT NULL,
  data_solicitacao DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Suprido (quem recebe o adiantamento)
  servidor_suprido_id UUID NOT NULL REFERENCES public.servidores(id),
  unidade_id UUID NOT NULL REFERENCES public.estrutura_organizacional(id),
  
  -- Valores
  valor_solicitado NUMERIC(15,2) NOT NULL,
  valor_aprovado NUMERIC(15,2),
  valor_utilizado NUMERIC(15,2) DEFAULT 0,
  valor_devolvido NUMERIC(15,2) DEFAULT 0,
  
  -- Finalidade
  finalidade TEXT NOT NULL,
  periodo_utilizacao_inicio DATE,
  periodo_utilizacao_fim DATE,
  prazo_prestacao_contas DATE,
  
  -- Orçamento
  empenho_id UUID REFERENCES public.fin_empenhos(id),
  dotacao_id UUID REFERENCES public.fin_dotacoes(id),
  
  -- Conta para depósito
  conta_bancaria_id UUID REFERENCES public.fin_contas_bancarias(id),
  conta_suprido_banco VARCHAR(3),
  conta_suprido_agencia VARCHAR(10),
  conta_suprido_numero VARCHAR(20),
  
  -- Status e workflow
  status status_adiantamento DEFAULT 'solicitado',
  
  -- Autorização
  autorizado_por UUID REFERENCES auth.users(id),
  autorizado_em TIMESTAMPTZ,
  
  -- Liberação
  liberado_por UUID REFERENCES auth.users(id),
  liberado_em TIMESTAMPTZ,
  data_liberacao DATE,
  
  -- Prestação de contas
  data_prestacao DATE,
  prestacao_aprovada_por UUID REFERENCES auth.users(id),
  prestacao_aprovada_em TIMESTAMPTZ,
  parecer_prestacao TEXT,
  
  -- Bloqueio automático
  bloqueado BOOLEAN DEFAULT false,
  data_bloqueio DATE,
  motivo_bloqueio TEXT,
  
  -- Metadata
  observacoes TEXT,
  historico_status JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(numero, exercicio)
);

CREATE INDEX idx_fin_adiantamentos_servidor ON public.fin_adiantamentos(servidor_suprido_id);
CREATE INDEX idx_fin_adiantamentos_status ON public.fin_adiantamentos(status);
CREATE INDEX idx_fin_adiantamentos_prazo ON public.fin_adiantamentos(prazo_prestacao_contas);

-- 5.2 Itens do Adiantamento (prestação de contas detalhada)
CREATE TABLE public.fin_adiantamento_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adiantamento_id UUID NOT NULL REFERENCES public.fin_adiantamentos(id) ON DELETE CASCADE,
  item_numero INTEGER NOT NULL,
  
  -- Documento comprobatório
  tipo_documento VARCHAR(50) NOT NULL, -- nota_fiscal, cupom, recibo
  numero_documento VARCHAR(50),
  data_documento DATE NOT NULL,
  cnpj_cpf_fornecedor VARCHAR(20),
  nome_fornecedor VARCHAR(255),
  
  -- Detalhes
  descricao TEXT NOT NULL,
  valor NUMERIC(15,2) NOT NULL,
  
  -- Validação
  valido BOOLEAN,
  motivo_invalido TEXT,
  validado_por UUID REFERENCES auth.users(id),
  validado_em TIMESTAMPTZ,
  
  -- Documento anexo obrigatório
  documento_id UUID, -- referência ao storage
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_fin_adiantamento_itens_adi ON public.fin_adiantamento_itens(adiantamento_id);

-- ===========================================
-- 6. CONCILIAÇÃO BANCÁRIA
-- ===========================================

-- 6.1 Extratos Bancários
CREATE TABLE public.fin_extratos_bancarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_bancaria_id UUID NOT NULL REFERENCES public.fin_contas_bancarias(id),
  mes_referencia INTEGER NOT NULL,
  ano_referencia INTEGER NOT NULL,
  saldo_anterior NUMERIC(15,2),
  total_creditos NUMERIC(15,2) DEFAULT 0,
  total_debitos NUMERIC(15,2) DEFAULT 0,
  saldo_final NUMERIC(15,2),
  data_importacao TIMESTAMPTZ DEFAULT now(),
  arquivo_original VARCHAR(255),
  importado_por UUID REFERENCES auth.users(id),
  conciliado BOOLEAN DEFAULT false,
  conciliado_por UUID REFERENCES auth.users(id),
  conciliado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_fin_extratos_periodo ON public.fin_extratos_bancarios(conta_bancaria_id, ano_referencia, mes_referencia);

-- 6.2 Transações do Extrato
CREATE TABLE public.fin_extrato_transacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extrato_id UUID NOT NULL REFERENCES public.fin_extratos_bancarios(id) ON DELETE CASCADE,
  data_transacao DATE NOT NULL,
  data_balancete DATE,
  tipo VARCHAR(1) NOT NULL, -- C=Crédito, D=Débito
  valor NUMERIC(15,2) NOT NULL,
  historico TEXT,
  documento VARCHAR(50),
  numero_sequencial INTEGER,
  
  -- Conciliação
  status status_conciliacao DEFAULT 'pendente',
  pagamento_id UUID REFERENCES public.fin_pagamentos(id),
  receita_id UUID REFERENCES public.fin_receitas(id),
  justificativa_divergencia TEXT,
  conciliado_por UUID REFERENCES auth.users(id),
  conciliado_em TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_fin_extrato_trans_extrato ON public.fin_extrato_transacoes(extrato_id);
CREATE INDEX idx_fin_extrato_trans_status ON public.fin_extrato_transacoes(status);

-- ===========================================
-- 7. CONTABILIDADE
-- ===========================================

-- 7.1 Lançamentos Contábeis
CREATE TABLE public.fin_lancamentos_contabeis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero VARCHAR(20) NOT NULL,
  data_lancamento DATE NOT NULL,
  data_competencia DATE NOT NULL,
  
  -- Partidas
  conta_debito_id UUID NOT NULL REFERENCES public.fin_plano_contas(id),
  conta_credito_id UUID NOT NULL REFERENCES public.fin_plano_contas(id),
  valor NUMERIC(15,2) NOT NULL,
  
  -- Origem
  tipo_origem VARCHAR(50) NOT NULL, -- empenho, liquidacao, pagamento, receita, ajuste
  origem_id UUID,
  
  -- Descrição
  historico TEXT NOT NULL,
  complemento TEXT,
  
  -- Controle
  exercicio INTEGER NOT NULL,
  mes_referencia INTEGER NOT NULL,
  fechamento_id UUID, -- referência ao fechamento mensal
  estornado BOOLEAN DEFAULT false,
  lancamento_estorno_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_fin_lancamentos_data ON public.fin_lancamentos_contabeis(data_lancamento);
CREATE INDEX idx_fin_lancamentos_contas ON public.fin_lancamentos_contabeis(conta_debito_id, conta_credito_id);
CREATE INDEX idx_fin_lancamentos_origem ON public.fin_lancamentos_contabeis(tipo_origem, origem_id);

-- 7.2 Fechamentos Mensais
CREATE TABLE public.fin_fechamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercicio INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  data_fechamento TIMESTAMPTZ DEFAULT now(),
  
  -- Saldos calculados
  total_receitas NUMERIC(15,2) DEFAULT 0,
  total_despesas NUMERIC(15,2) DEFAULT 0,
  resultado_mes NUMERIC(15,2) DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'aberto', -- aberto, fechado, reaberto
  fechado_por UUID REFERENCES auth.users(id),
  fechado_em TIMESTAMPTZ,
  reaberto_por UUID REFERENCES auth.users(id),
  reaberto_em TIMESTAMPTZ,
  motivo_reabertura TEXT,
  
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(exercicio, mes)
);

-- ===========================================
-- 8. DOCUMENTOS E ARQUIVOS
-- ===========================================

CREATE TABLE public.fin_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Vinculação polimórfica
  entidade_tipo VARCHAR(50) NOT NULL, -- solicitacao, empenho, liquidacao, pagamento, adiantamento, receita
  entidade_id UUID NOT NULL,
  
  -- Arquivo
  nome_arquivo VARCHAR(255) NOT NULL,
  tipo_arquivo VARCHAR(100),
  tamanho_bytes INTEGER,
  storage_path TEXT NOT NULL,
  hash_arquivo VARCHAR(64), -- SHA-256 para integridade
  
  -- Classificação
  categoria VARCHAR(50) NOT NULL, -- nota_fiscal, recibo, comprovante_pagamento, contrato, termo, atesto, extrato
  obrigatorio BOOLEAN DEFAULT false,
  
  -- Metadados do documento
  numero_documento VARCHAR(50),
  data_documento DATE,
  valor_documento NUMERIC(15,2),
  
  -- Versão e controle
  versao INTEGER DEFAULT 1,
  documento_anterior_id UUID REFERENCES public.fin_documentos(id),
  
  -- Auditoria
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  ip_address INET,
  
  -- Controle de exclusão
  ativo BOOLEAN DEFAULT true,
  excluido_por UUID REFERENCES auth.users(id),
  excluido_em TIMESTAMPTZ,
  motivo_exclusao TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_fin_documentos_entidade ON public.fin_documentos(entidade_tipo, entidade_id);
CREATE INDEX idx_fin_documentos_categoria ON public.fin_documentos(categoria);

-- ===========================================
-- 9. AUDITORIA FINANCEIRA
-- ===========================================

CREATE TABLE public.fin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tabela_origem VARCHAR(100) NOT NULL,
  registro_id UUID NOT NULL,
  acao VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
  dados_anteriores JSONB,
  dados_novos JSONB,
  campos_alterados TEXT[],
  usuario_id UUID,
  usuario_nome VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_fin_audit_tabela ON public.fin_audit_log(tabela_origem);
CREATE INDEX idx_fin_audit_registro ON public.fin_audit_log(registro_id);
CREATE INDEX idx_fin_audit_data ON public.fin_audit_log(created_at);

-- ===========================================
-- 10. FUNÇÕES E TRIGGERS
-- ===========================================

-- Função para gerar número sequencial
CREATE OR REPLACE FUNCTION public.fn_gerar_numero_financeiro(
  p_tipo VARCHAR,
  p_exercicio INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
)
RETURNS VARCHAR
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_prefixo VARCHAR;
  v_ultimo INTEGER;
  v_numero VARCHAR;
BEGIN
  v_prefixo := CASE p_tipo
    WHEN 'solicitacao' THEN 'SOL'
    WHEN 'empenho' THEN 'NE'
    WHEN 'liquidacao' THEN 'NL'
    WHEN 'pagamento' THEN 'OP'
    WHEN 'receita' THEN 'REC'
    WHEN 'adiantamento' THEN 'ADI'
    WHEN 'alteracao' THEN 'ALT'
    ELSE 'DOC'
  END;
  
  -- Buscar último número do tipo/exercício
  EXECUTE format(
    'SELECT COALESCE(MAX(NULLIF(regexp_replace(numero, ''^%s-'', ''''), '''')::INTEGER), 0) + 1 FROM fin_%ss WHERE exercicio = $1',
    v_prefixo, p_tipo
  ) INTO v_ultimo USING p_exercicio;
  
  v_numero := v_prefixo || '-' || LPAD(COALESCE(v_ultimo, 1)::TEXT, 6, '0');
  
  RETURN v_numero;
END;
$$;

-- Função para atualizar saldos de dotação após empenho
CREATE OR REPLACE FUNCTION public.fn_atualizar_saldo_dotacao_empenho()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE fin_dotacoes
    SET valor_empenhado = valor_empenhado + NEW.valor_empenhado,
        updated_at = now()
    WHERE id = NEW.dotacao_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.valor_empenhado != NEW.valor_empenhado THEN
    UPDATE fin_dotacoes
    SET valor_empenhado = valor_empenhado - OLD.valor_empenhado + NEW.valor_empenhado,
        updated_at = now()
    WHERE id = NEW.dotacao_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE fin_dotacoes
    SET valor_empenhado = valor_empenhado - OLD.valor_empenhado,
        updated_at = now()
    WHERE id = OLD.dotacao_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_atualizar_saldo_empenho
AFTER INSERT OR UPDATE OF valor_empenhado OR DELETE ON public.fin_empenhos
FOR EACH ROW EXECUTE FUNCTION public.fn_atualizar_saldo_dotacao_empenho();

-- Função para atualizar valores do empenho após liquidação
CREATE OR REPLACE FUNCTION public.fn_atualizar_empenho_liquidacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'aprovada' THEN
    UPDATE fin_empenhos
    SET valor_liquidado = valor_liquidado + NEW.valor_liquidado,
        status = CASE 
          WHEN valor_liquidado + NEW.valor_liquidado >= valor_empenhado - COALESCE(valor_anulado, 0) THEN 'liquidado'
          ELSE 'parcialmente_liquidado'
        END,
        updated_at = now()
    WHERE id = NEW.empenho_id;
    
    -- Atualizar dotação
    UPDATE fin_dotacoes
    SET valor_liquidado = valor_liquidado + NEW.valor_liquidado,
        updated_at = now()
    WHERE id = (SELECT dotacao_id FROM fin_empenhos WHERE id = NEW.empenho_id);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_atualizar_empenho_liquidacao
AFTER INSERT OR UPDATE OF status ON public.fin_liquidacoes
FOR EACH ROW EXECUTE FUNCTION public.fn_atualizar_empenho_liquidacao();

-- Função para atualizar valores após pagamento
CREATE OR REPLACE FUNCTION public.fn_atualizar_empenho_pagamento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'pago' THEN
    -- Atualizar empenho
    UPDATE fin_empenhos
    SET valor_pago = valor_pago + NEW.valor_bruto,
        status = CASE 
          WHEN valor_pago + NEW.valor_bruto >= valor_liquidado THEN 'pago'
          ELSE 'parcialmente_pago'
        END,
        updated_at = now()
    WHERE id = NEW.empenho_id;
    
    -- Atualizar dotação
    UPDATE fin_dotacoes
    SET valor_pago = valor_pago + NEW.valor_bruto,
        updated_at = now()
    WHERE id = (SELECT dotacao_id FROM fin_empenhos WHERE id = NEW.empenho_id);
    
    -- Atualizar saldo da conta bancária
    UPDATE fin_contas_bancarias
    SET saldo_atual = saldo_atual - NEW.valor_liquido,
        data_ultimo_saldo = NEW.data_pagamento,
        updated_at = now()
    WHERE id = NEW.conta_bancaria_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_atualizar_empenho_pagamento
AFTER INSERT OR UPDATE OF status ON public.fin_pagamentos
FOR EACH ROW EXECUTE FUNCTION public.fn_atualizar_empenho_pagamento();

-- Função para registrar histórico de status
CREATE OR REPLACE FUNCTION public.fn_registrar_historico_status_financeiro()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.historico_status := COALESCE(OLD.historico_status, '[]'::jsonb) || 
      jsonb_build_object(
        'status_anterior', OLD.status,
        'status_novo', NEW.status,
        'data', NOW(),
        'usuario_id', auth.uid()
      );
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Aplicar trigger de histórico nas tabelas principais
CREATE TRIGGER trg_historico_solicitacao
BEFORE UPDATE ON public.fin_solicitacoes
FOR EACH ROW EXECUTE FUNCTION public.fn_registrar_historico_status_financeiro();

CREATE TRIGGER trg_historico_pagamento
BEFORE UPDATE ON public.fin_pagamentos
FOR EACH ROW EXECUTE FUNCTION public.fn_registrar_historico_status_financeiro();

CREATE TRIGGER trg_historico_adiantamento
BEFORE UPDATE ON public.fin_adiantamentos
FOR EACH ROW EXECUTE FUNCTION public.fn_registrar_historico_status_financeiro();

-- Função de auditoria financeira
CREATE OR REPLACE FUNCTION public.fn_audit_financeiro()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_usuario_nome TEXT;
  v_campos_alterados TEXT[];
  v_key TEXT;
BEGIN
  -- Buscar nome do usuário
  BEGIN
    SELECT full_name INTO v_usuario_nome FROM public.profiles WHERE id = auth.uid();
  EXCEPTION WHEN OTHERS THEN
    v_usuario_nome := NULL;
  END;
  
  -- Identificar campos alterados
  IF TG_OP = 'UPDATE' THEN
    FOR v_key IN SELECT jsonb_object_keys(to_jsonb(NEW)) LOOP
      IF to_jsonb(OLD)->v_key IS DISTINCT FROM to_jsonb(NEW)->v_key THEN
        v_campos_alterados := array_append(v_campos_alterados, v_key);
      END IF;
    END LOOP;
  END IF;
  
  INSERT INTO public.fin_audit_log (
    tabela_origem, registro_id, acao,
    dados_anteriores, dados_novos, campos_alterados,
    usuario_id, usuario_nome
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    v_campos_alterados,
    auth.uid(),
    v_usuario_nome
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Aplicar auditoria nas tabelas críticas
CREATE TRIGGER trg_audit_empenhos
AFTER INSERT OR UPDATE OR DELETE ON public.fin_empenhos
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_financeiro();

CREATE TRIGGER trg_audit_liquidacoes
AFTER INSERT OR UPDATE OR DELETE ON public.fin_liquidacoes
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_financeiro();

CREATE TRIGGER trg_audit_pagamentos
AFTER INSERT OR UPDATE OR DELETE ON public.fin_pagamentos
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_financeiro();

-- Função para verificar saldo antes de empenhar
CREATE OR REPLACE FUNCTION public.fn_verificar_saldo_dotacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_saldo NUMERIC;
BEGIN
  SELECT saldo_disponivel INTO v_saldo
  FROM fin_dotacoes
  WHERE id = NEW.dotacao_id;
  
  IF v_saldo < NEW.valor_empenhado THEN
    RAISE EXCEPTION 'Saldo insuficiente na dotação. Disponível: %, Solicitado: %', v_saldo, NEW.valor_empenhado;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_verificar_saldo_empenho
BEFORE INSERT ON public.fin_empenhos
FOR EACH ROW EXECUTE FUNCTION public.fn_verificar_saldo_dotacao();

-- Função para bloquear adiantamentos vencidos
CREATE OR REPLACE FUNCTION public.fn_bloquear_adiantamento_vencido()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Se passou do prazo e não prestou contas, bloquear
  IF NEW.status = 'em_uso' AND NEW.prazo_prestacao_contas < CURRENT_DATE THEN
    NEW.status := 'bloqueado';
    NEW.bloqueado := true;
    NEW.data_bloqueio := CURRENT_DATE;
    NEW.motivo_bloqueio := 'Prazo de prestação de contas expirado em ' || NEW.prazo_prestacao_contas;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bloquear_adiantamento
BEFORE UPDATE ON public.fin_adiantamentos
FOR EACH ROW EXECUTE FUNCTION public.fn_bloquear_adiantamento_vencido();

-- ===========================================
-- 11. RLS POLICIES
-- ===========================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.fin_plano_contas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_fontes_recurso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_naturezas_despesa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_programas_orcamentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_acoes_orcamentarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_dotacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_alteracoes_orcamentarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_contas_bancarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_parametros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_solicitacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_solicitacao_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_checklist_ci ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_empenhos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_empenho_anulacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_liquidacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_receitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_adiantamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_adiantamento_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_extratos_bancarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_extrato_transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_lancamentos_contabeis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_fechamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_audit_log ENABLE ROW LEVEL SECURITY;

-- Forçar RLS em todas as tabelas
ALTER TABLE public.fin_plano_contas FORCE ROW LEVEL SECURITY;
ALTER TABLE public.fin_fontes_recurso FORCE ROW LEVEL SECURITY;
ALTER TABLE public.fin_naturezas_despesa FORCE ROW LEVEL SECURITY;
ALTER TABLE public.fin_programas_orcamentarios FORCE ROW LEVEL SECURITY;
ALTER TABLE public.fin_acoes_orcamentarias FORCE ROW LEVEL SECURITY;
ALTER TABLE public.fin_dotacoes FORCE ROW LEVEL SECURITY;
ALTER TABLE public.fin_alteracoes_orcamentarias FORCE ROW LEVEL SECURITY;
ALTER TABLE public.fin_contas_bancarias FORCE ROW LEVEL SECURITY;
ALTER TABLE public.fin_parametros FORCE ROW LEVEL SECURITY;
ALTER TABLE public.fin_solicitacoes FORCE ROW LEVEL SECURITY;
ALTER TABLE public.fin_solicitacao_itens FORCE ROW LEVEL SECURITY;
ALTER TABLE public.fin_checklist_ci FORCE ROW LEVEL SECURITY;
ALTER TABLE public.fin_empenhos FORCE ROW LEVEL SECURITY;
ALTER TABLE public.fin_empenho_anulacoes FORCE ROW LEVEL SECURITY;
ALTER TABLE public.fin_liquidacoes FORCE ROW LEVEL SECURITY;
ALTER TABLE public.fin_pagamentos FORCE ROW LEVEL SECURITY;
ALTER TABLE public.fin_receitas FORCE ROW LEVEL SECURITY;
ALTER TABLE public.fin_adiantamentos FORCE ROW LEVEL SECURITY;
ALTER TABLE public.fin_adiantamento_itens FORCE ROW LEVEL SECURITY;
ALTER TABLE public.fin_extratos_bancarios FORCE ROW LEVEL SECURITY;
ALTER TABLE public.fin_extrato_transacoes FORCE ROW LEVEL SECURITY;
ALTER TABLE public.fin_lancamentos_contabeis FORCE ROW LEVEL SECURITY;
ALTER TABLE public.fin_fechamentos FORCE ROW LEVEL SECURITY;
ALTER TABLE public.fin_documentos FORCE ROW LEVEL SECURITY;
ALTER TABLE public.fin_audit_log FORCE ROW LEVEL SECURITY;

-- Função helper para verificar permissão financeira
CREATE OR REPLACE FUNCTION public.usuario_tem_permissao_financeira(
  p_user_id UUID,
  p_permissao VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Super admin tem acesso total
  IF public.usuario_eh_super_admin(p_user_id) THEN
    RETURN TRUE;
  END IF;
  
  -- Verificar permissão específica via RBAC
  RETURN EXISTS (
    SELECT 1 
    FROM public.usuario_perfis up
    JOIN public.perfil_funcoes pf ON up.perfil_id = pf.perfil_id
    JOIN public.funcoes_sistema f ON pf.funcao_id = f.id
    WHERE up.user_id = p_user_id
      AND up.ativo = true
      AND (up.data_fim IS NULL OR up.data_fim >= CURRENT_DATE)
      AND pf.concedido = true
      AND f.codigo = p_permissao
      AND f.ativo = true
  );
END;
$$;

-- Políticas de leitura (cadastros base - todos autenticados podem ler)
CREATE POLICY "fin_plano_contas_select" ON public.fin_plano_contas
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "fin_fontes_recurso_select" ON public.fin_fontes_recurso
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "fin_naturezas_despesa_select" ON public.fin_naturezas_despesa
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "fin_programas_select" ON public.fin_programas_orcamentarios
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "fin_acoes_select" ON public.fin_acoes_orcamentarias
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "fin_parametros_select" ON public.fin_parametros
  FOR SELECT TO authenticated
  USING (true);

-- Políticas de escrita em cadastros (apenas administradores financeiros)
CREATE POLICY "fin_plano_contas_manage" ON public.fin_plano_contas
  FOR ALL TO authenticated
  USING (public.usuario_tem_permissao_financeira(auth.uid(), 'fin.contabilidade.administrar'))
  WITH CHECK (public.usuario_tem_permissao_financeira(auth.uid(), 'fin.contabilidade.administrar'));

CREATE POLICY "fin_fontes_manage" ON public.fin_fontes_recurso
  FOR ALL TO authenticated
  USING (public.usuario_tem_permissao_financeira(auth.uid(), 'fin.orcamento.administrar'))
  WITH CHECK (public.usuario_tem_permissao_financeira(auth.uid(), 'fin.orcamento.administrar'));

CREATE POLICY "fin_naturezas_manage" ON public.fin_naturezas_despesa
  FOR ALL TO authenticated
  USING (public.usuario_tem_permissao_financeira(auth.uid(), 'fin.orcamento.administrar'))
  WITH CHECK (public.usuario_tem_permissao_financeira(auth.uid(), 'fin.orcamento.administrar'));

-- Políticas para Dotações
CREATE POLICY "fin_dotacoes_select" ON public.fin_dotacoes
  FOR SELECT TO authenticated
  USING (
    public.usuario_tem_permissao_financeira(auth.uid(), 'fin.orcamento.visualizar')
    OR public.usuario_eh_admin(auth.uid())
  );

CREATE POLICY "fin_dotacoes_manage" ON public.fin_dotacoes
  FOR ALL TO authenticated
  USING (public.usuario_tem_permissao_financeira(auth.uid(), 'fin.orcamento.administrar'))
  WITH CHECK (public.usuario_tem_permissao_financeira(auth.uid(), 'fin.orcamento.administrar'));

-- Políticas para Solicitações
CREATE POLICY "fin_solicitacoes_select" ON public.fin_solicitacoes
  FOR SELECT TO authenticated
  USING (
    -- Criador pode ver suas solicitações
    created_by = auth.uid()
    -- Ou quem tem permissão de visualizar solicitações
    OR public.usuario_tem_permissao_financeira(auth.uid(), 'fin.solicitacao.visualizar')
    -- Ou administradores
    OR public.usuario_eh_admin(auth.uid())
  );

CREATE POLICY "fin_solicitacoes_insert" ON public.fin_solicitacoes
  FOR INSERT TO authenticated
  WITH CHECK (
    public.usuario_tem_permissao_financeira(auth.uid(), 'fin.solicitacao.criar')
    OR public.usuario_eh_admin(auth.uid())
  );

CREATE POLICY "fin_solicitacoes_update" ON public.fin_solicitacoes
  FOR UPDATE TO authenticated
  USING (
    -- Criador pode editar se em rascunho
    (created_by = auth.uid() AND status = 'rascunho')
    -- Ou quem tem permissão de tramitar
    OR public.usuario_tem_permissao_financeira(auth.uid(), 'fin.solicitacao.tramitar')
    -- Ou administradores
    OR public.usuario_eh_admin(auth.uid())
  );

-- Políticas para itens de solicitação (segue a solicitação)
CREATE POLICY "fin_solicitacao_itens_all" ON public.fin_solicitacao_itens
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.fin_solicitacoes s
      WHERE s.id = solicitacao_id
      AND (
        s.created_by = auth.uid()
        OR public.usuario_tem_permissao_financeira(auth.uid(), 'fin.solicitacao.visualizar')
        OR public.usuario_eh_admin(auth.uid())
      )
    )
  );

-- Políticas para Empenhos
CREATE POLICY "fin_empenhos_select" ON public.fin_empenhos
  FOR SELECT TO authenticated
  USING (
    public.usuario_tem_permissao_financeira(auth.uid(), 'fin.empenho.visualizar')
    OR public.usuario_eh_admin(auth.uid())
  );

CREATE POLICY "fin_empenhos_insert" ON public.fin_empenhos
  FOR INSERT TO authenticated
  WITH CHECK (
    public.usuario_tem_permissao_financeira(auth.uid(), 'fin.empenho.criar')
    OR public.usuario_eh_admin(auth.uid())
  );

CREATE POLICY "fin_empenhos_update" ON public.fin_empenhos
  FOR UPDATE TO authenticated
  USING (
    public.usuario_tem_permissao_financeira(auth.uid(), 'fin.empenho.tramitar')
    OR public.usuario_eh_admin(auth.uid())
  );

-- Políticas para Liquidações
CREATE POLICY "fin_liquidacoes_select" ON public.fin_liquidacoes
  FOR SELECT TO authenticated
  USING (
    public.usuario_tem_permissao_financeira(auth.uid(), 'fin.liquidacao.visualizar')
    OR public.usuario_eh_admin(auth.uid())
  );

CREATE POLICY "fin_liquidacoes_manage" ON public.fin_liquidacoes
  FOR ALL TO authenticated
  USING (
    public.usuario_tem_permissao_financeira(auth.uid(), 'fin.liquidacao.criar')
    OR public.usuario_eh_admin(auth.uid())
  );

-- Políticas para Pagamentos
CREATE POLICY "fin_pagamentos_select" ON public.fin_pagamentos
  FOR SELECT TO authenticated
  USING (
    public.usuario_tem_permissao_financeira(auth.uid(), 'fin.pagamento.visualizar')
    OR public.usuario_eh_admin(auth.uid())
  );

CREATE POLICY "fin_pagamentos_insert" ON public.fin_pagamentos
  FOR INSERT TO authenticated
  WITH CHECK (
    public.usuario_tem_permissao_financeira(auth.uid(), 'fin.pagamento.criar')
    OR public.usuario_eh_admin(auth.uid())
  );

CREATE POLICY "fin_pagamentos_update" ON public.fin_pagamentos
  FOR UPDATE TO authenticated
  USING (
    -- Só pode alterar se não estiver pago, ou se for super admin
    (status != 'pago' AND public.usuario_tem_permissao_financeira(auth.uid(), 'fin.pagamento.tramitar'))
    OR public.usuario_eh_super_admin(auth.uid())
  );

-- Políticas para Receitas
CREATE POLICY "fin_receitas_select" ON public.fin_receitas
  FOR SELECT TO authenticated
  USING (
    public.usuario_tem_permissao_financeira(auth.uid(), 'fin.receita.visualizar')
    OR public.usuario_eh_admin(auth.uid())
  );

CREATE POLICY "fin_receitas_manage" ON public.fin_receitas
  FOR ALL TO authenticated
  USING (
    public.usuario_tem_permissao_financeira(auth.uid(), 'fin.receita.criar')
    OR public.usuario_eh_admin(auth.uid())
  );

-- Políticas para Adiantamentos
CREATE POLICY "fin_adiantamentos_select" ON public.fin_adiantamentos
  FOR SELECT TO authenticated
  USING (
    -- Servidor suprido pode ver seus adiantamentos
    servidor_suprido_id IN (SELECT id FROM servidores WHERE user_id = auth.uid())
    -- Ou quem tem permissão de visualizar
    OR public.usuario_tem_permissao_financeira(auth.uid(), 'fin.adiantamento.visualizar')
    OR public.usuario_eh_admin(auth.uid())
  );

CREATE POLICY "fin_adiantamentos_manage" ON public.fin_adiantamentos
  FOR ALL TO authenticated
  USING (
    public.usuario_tem_permissao_financeira(auth.uid(), 'fin.adiantamento.criar')
    OR public.usuario_eh_admin(auth.uid())
  );

-- Políticas para Conciliação
CREATE POLICY "fin_extratos_select" ON public.fin_extratos_bancarios
  FOR SELECT TO authenticated
  USING (
    public.usuario_tem_permissao_financeira(auth.uid(), 'fin.conciliacao.visualizar')
    OR public.usuario_eh_admin(auth.uid())
  );

CREATE POLICY "fin_extratos_manage" ON public.fin_extratos_bancarios
  FOR ALL TO authenticated
  USING (
    public.usuario_tem_permissao_financeira(auth.uid(), 'fin.conciliacao.executar')
    OR public.usuario_eh_admin(auth.uid())
  );

CREATE POLICY "fin_extrato_transacoes_all" ON public.fin_extrato_transacoes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.fin_extratos_bancarios e
      WHERE e.id = extrato_id
      AND (
        public.usuario_tem_permissao_financeira(auth.uid(), 'fin.conciliacao.visualizar')
        OR public.usuario_eh_admin(auth.uid())
      )
    )
  );

-- Políticas para Contabilidade
CREATE POLICY "fin_lancamentos_select" ON public.fin_lancamentos_contabeis
  FOR SELECT TO authenticated
  USING (
    public.usuario_tem_permissao_financeira(auth.uid(), 'fin.contabilidade.visualizar')
    OR public.usuario_eh_admin(auth.uid())
  );

CREATE POLICY "fin_lancamentos_manage" ON public.fin_lancamentos_contabeis
  FOR ALL TO authenticated
  USING (
    public.usuario_tem_permissao_financeira(auth.uid(), 'fin.contabilidade.administrar')
    OR public.usuario_eh_admin(auth.uid())
  );

CREATE POLICY "fin_fechamentos_all" ON public.fin_fechamentos
  FOR ALL TO authenticated
  USING (
    public.usuario_tem_permissao_financeira(auth.uid(), 'fin.contabilidade.administrar')
    OR public.usuario_eh_admin(auth.uid())
  );

-- Políticas para Documentos
CREATE POLICY "fin_documentos_select" ON public.fin_documentos
  FOR SELECT TO authenticated
  USING (true); -- Documentos podem ser lidos por todos autenticados

CREATE POLICY "fin_documentos_insert" ON public.fin_documentos
  FOR INSERT TO authenticated
  WITH CHECK (true); -- Upload permitido para todos autenticados

CREATE POLICY "fin_documentos_update" ON public.fin_documentos
  FOR UPDATE TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR public.usuario_eh_admin(auth.uid())
  );

-- Políticas para Contas Bancárias
CREATE POLICY "fin_contas_bancarias_select" ON public.fin_contas_bancarias
  FOR SELECT TO authenticated
  USING (
    public.usuario_tem_permissao_financeira(auth.uid(), 'fin.conta_bancaria.visualizar')
    OR public.usuario_eh_admin(auth.uid())
  );

CREATE POLICY "fin_contas_bancarias_manage" ON public.fin_contas_bancarias
  FOR ALL TO authenticated
  USING (
    public.usuario_tem_permissao_financeira(auth.uid(), 'fin.conta_bancaria.administrar')
    OR public.usuario_eh_admin(auth.uid())
  );

-- Políticas para Checklist CI
CREATE POLICY "fin_checklist_ci_all" ON public.fin_checklist_ci
  FOR ALL TO authenticated
  USING (
    public.usuario_tem_permissao_financeira(auth.uid(), 'fin.controle_interno.avaliar')
    OR public.usuario_eh_admin(auth.uid())
  );

-- Políticas para Anulações
CREATE POLICY "fin_anulacoes_all" ON public.fin_empenho_anulacoes
  FOR ALL TO authenticated
  USING (
    public.usuario_tem_permissao_financeira(auth.uid(), 'fin.empenho.anular')
    OR public.usuario_eh_admin(auth.uid())
  );

-- Políticas para Alterações Orçamentárias
CREATE POLICY "fin_alteracoes_select" ON public.fin_alteracoes_orcamentarias
  FOR SELECT TO authenticated
  USING (
    public.usuario_tem_permissao_financeira(auth.uid(), 'fin.orcamento.visualizar')
    OR public.usuario_eh_admin(auth.uid())
  );

CREATE POLICY "fin_alteracoes_manage" ON public.fin_alteracoes_orcamentarias
  FOR ALL TO authenticated
  USING (
    public.usuario_tem_permissao_financeira(auth.uid(), 'fin.orcamento.administrar')
    OR public.usuario_eh_admin(auth.uid())
  );

-- Políticas para Itens de Adiantamento
CREATE POLICY "fin_adiantamento_itens_all" ON public.fin_adiantamento_itens
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.fin_adiantamentos a
      WHERE a.id = adiantamento_id
      AND (
        a.servidor_suprido_id IN (SELECT id FROM servidores WHERE user_id = auth.uid())
        OR public.usuario_tem_permissao_financeira(auth.uid(), 'fin.adiantamento.visualizar')
        OR public.usuario_eh_admin(auth.uid())
      )
    )
  );

-- Políticas para Audit Log (somente leitura para admins)
CREATE POLICY "fin_audit_log_select" ON public.fin_audit_log
  FOR SELECT TO authenticated
  USING (public.usuario_eh_admin(auth.uid()));

-- Políticas para Programas e Ações (gerenciamento)
CREATE POLICY "fin_programas_manage" ON public.fin_programas_orcamentarios
  FOR ALL TO authenticated
  USING (public.usuario_tem_permissao_financeira(auth.uid(), 'fin.orcamento.administrar'))
  WITH CHECK (public.usuario_tem_permissao_financeira(auth.uid(), 'fin.orcamento.administrar'));

CREATE POLICY "fin_acoes_manage" ON public.fin_acoes_orcamentarias
  FOR ALL TO authenticated
  USING (public.usuario_tem_permissao_financeira(auth.uid(), 'fin.orcamento.administrar'))
  WITH CHECK (public.usuario_tem_permissao_financeira(auth.uid(), 'fin.orcamento.administrar'));

CREATE POLICY "fin_parametros_manage" ON public.fin_parametros
  FOR ALL TO authenticated
  USING (public.usuario_eh_super_admin(auth.uid()))
  WITH CHECK (public.usuario_eh_super_admin(auth.uid()));

-- ===========================================
-- 12. SEEDS DE DADOS INICIAIS
-- ===========================================

-- Fontes de Recurso padrão
INSERT INTO public.fin_fontes_recurso (codigo, nome, origem) VALUES
('100', 'Recursos Ordinários', 'tesouro_estadual'),
('101', 'Recursos de Convênios Federais', 'convenio_federal'),
('102', 'Recursos de Convênios Estaduais', 'convenio_estadual'),
('103', 'Doações', 'doacao'),
('104', 'Recursos Próprios', 'receita_propria');

-- Naturezas de Despesa mais comuns
INSERT INTO public.fin_naturezas_despesa (codigo, nome, categoria_economica, grupo_natureza) VALUES
('3.3.90.14', 'Diárias - Civil', '3', '3'),
('3.3.90.30', 'Material de Consumo', '3', '3'),
('3.3.90.33', 'Passagens e Despesas com Locomoção', '3', '3'),
('3.3.90.35', 'Serviços de Consultoria', '3', '3'),
('3.3.90.36', 'Outros Serviços de Terceiros - Pessoa Física', '3', '3'),
('3.3.90.39', 'Outros Serviços de Terceiros - Pessoa Jurídica', '3', '3'),
('3.3.90.40', 'Serviços de Tecnologia da Informação', '3', '3'),
('3.3.90.47', 'Obrigações Tributárias e Contributivas', '3', '3'),
('3.3.90.48', 'Outros Auxílios Financeiros a Pessoas Físicas', '3', '3'),
('4.4.90.52', 'Equipamentos e Material Permanente', '4', '4');

-- Parâmetros financeiros iniciais
INSERT INTO public.fin_parametros (chave, valor, tipo, descricao, categoria) VALUES
('exercicio_atual', '2026', 'numero', 'Exercício orçamentário atual', 'orcamento'),
('prazo_prestacao_adiantamento', '30', 'numero', 'Prazo em dias para prestação de contas de adiantamento', 'adiantamento'),
('valor_maximo_adiantamento', '5000.00', 'numero', 'Valor máximo para adiantamento único', 'adiantamento'),
('cnpj_idjuv', '47.673.413/0001-90', 'texto', 'CNPJ do IDJuv', 'institucional'),
('ug_idjuv', '110001', 'texto', 'Unidade Gestora do IDJuv', 'institucional');

-- Plano de Contas básico
INSERT INTO public.fin_plano_contas (codigo, nome, natureza, nivel, aceita_lancamento) VALUES
('1', 'ATIVO', 'ativo', 1, false),
('1.1', 'ATIVO CIRCULANTE', 'ativo', 2, false),
('1.1.1', 'DISPONIBILIDADES', 'ativo', 3, false),
('1.1.1.1', 'Caixa e Equivalentes', 'ativo', 4, true),
('1.1.1.2', 'Bancos Conta Movimento', 'ativo', 4, true),
('1.1.1.3', 'Aplicações Financeiras', 'ativo', 4, true),
('2', 'PASSIVO', 'passivo', 1, false),
('2.1', 'PASSIVO CIRCULANTE', 'passivo', 2, false),
('2.1.1', 'OBRIGAÇÕES A PAGAR', 'passivo', 3, false),
('2.1.1.1', 'Fornecedores a Pagar', 'passivo', 4, true),
('2.1.1.2', 'Obrigações Tributárias', 'passivo', 4, true),
('3', 'PATRIMÔNIO LÍQUIDO', 'patrimonio_liquido', 1, false),
('4', 'VARIAÇÕES PATRIMONIAIS DIMINUTIVAS', 'despesa', 1, false),
('4.1', 'DESPESAS CORRENTES', 'despesa', 2, false),
('4.1.1', 'Pessoal e Encargos', 'despesa', 3, true),
('4.1.2', 'Outras Despesas Correntes', 'despesa', 3, true),
('5', 'VARIAÇÕES PATRIMONIAIS AUMENTATIVAS', 'receita', 1, false),
('5.1', 'RECEITAS CORRENTES', 'receita', 2, false),
('5.1.1', 'Transferências Recebidas', 'receita', 3, true);