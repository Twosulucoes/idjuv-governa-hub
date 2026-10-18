-- ============================================================
-- IDJUV - BACKUP COMPLETO - TIPOS ENUM
-- Gerado em: 2026-02-08
-- Total: 60+ tipos
-- ============================================================

-- ============================================
-- TIPOS DE ACESSO E PERMISSÕES
-- ============================================

CREATE TYPE public.access_scope AS ENUM ('all', 'org_unit', 'local_unit', 'own', 'readonly');

CREATE TYPE public.app_module AS ENUM (
  'rh', 'financeiro', 'compras', 'patrimonio', 'contratos', 
  'workflow', 'governanca', 'transparencia', 'comunicacao', 
  'programas', 'gestores_escolares', 'integridade', 'admin'
);

CREATE TYPE public.app_permission AS ENUM (
  'users.read', 'users.create', 'users.update', 'users.delete',
  'content.read', 'content.create', 'content.update', 'content.delete',
  'reports.view', 'reports.export', 'settings.view', 'settings.edit',
  'processes.read', 'processes.create', 'processes.update', 'processes.delete', 'processes.approve',
  'roles.manage', 'permissions.manage',
  'documents.view', 'documents.create', 'documents.edit', 'documents.delete',
  'requests.create', 'requests.view', 'requests.approve', 'requests.reject',
  'audit.view', 'audit.export', 'approval.delegate', 'org_units.manage', 'mfa.manage'
);

CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'user');

CREATE TYPE public.approval_status AS ENUM ('draft', 'submitted', 'in_review', 'approved', 'rejected', 'cancelled');

CREATE TYPE public.audit_action AS ENUM (
  'login', 'logout', 'login_failed', 'password_change', 'password_reset',
  'create', 'update', 'delete', 'view', 'export', 'upload', 'download',
  'approve', 'reject', 'submit'
);

-- ============================================
-- TIPOS DE BACKUP
-- ============================================

CREATE TYPE public.backup_status AS ENUM ('pending', 'running', 'success', 'failed', 'partial');
CREATE TYPE public.backup_type AS ENUM ('daily', 'weekly', 'monthly', 'manual');

-- ============================================
-- TIPOS DE RH
-- ============================================

CREATE TYPE public.categoria_cargo AS ENUM ('efetivo', 'comissionado', 'funcao_gratificada', 'temporario', 'estagiario');
CREATE TYPE public.natureza_cargo AS ENUM ('efetivo', 'comissionado');

CREATE TYPE public.situacao_funcional AS ENUM (
  'ativo', 'afastado', 'cedido', 'licenca', 'ferias', 
  'exonerado', 'aposentado', 'falecido', 'inativo'
);

CREATE TYPE public.vinculo_funcional AS ENUM (
  'efetivo', 'comissionado', 'cedido', 'temporario', 'estagiario', 'requisitado'
);

CREATE TYPE public.tipo_afastamento AS ENUM (
  'licenca', 'suspensao', 'cessao', 'disposicao', 'servico_externo', 'missao', 'outro'
);

CREATE TYPE public.tipo_licenca AS ENUM (
  'maternidade', 'paternidade', 'medica', 'casamento', 'luto', 
  'interesse_particular', 'capacitacao', 'premio', 
  'mandato_eletivo', 'mandato_classista', 'outra'
);

CREATE TYPE public.tipo_movimentacao_funcional AS ENUM (
  'nomeacao', 'exoneracao', 'designacao', 'dispensa', 'promocao', 
  'transferencia', 'cessao', 'requisicao', 'redistribuicao', 'remocao', 
  'afastamento', 'retorno', 'aposentadoria', 'vacancia'
);

-- ============================================
-- TIPOS DE PONTO E FREQUÊNCIA
-- ============================================

CREATE TYPE public.status_ponto AS ENUM ('completo', 'incompleto', 'pendente_justificativa', 'justificado', 'aprovado');
CREATE TYPE public.tipo_registro_ponto AS ENUM ('normal', 'feriado', 'folga', 'atestado', 'falta', 'ferias', 'licenca');
CREATE TYPE public.tipo_justificativa AS ENUM ('atestado', 'declaracao', 'trabalho_externo', 'esquecimento', 'problema_sistema', 'outro');
CREATE TYPE public.tipo_lancamento_horas AS ENUM ('credito', 'debito', 'ajuste');

-- ============================================
-- TIPOS DE DOCUMENTOS E PORTARIAS
-- ============================================

CREATE TYPE public.categoria_portaria AS ENUM (
  'estruturante', 'normativa', 'pessoal', 'delegacao', 
  'nomeacao', 'exoneracao', 'designacao', 'dispensa', 
  'cessao', 'ferias', 'licenca'
);

CREATE TYPE public.tipo_documento AS ENUM (
  'portaria', 'resolucao', 'instrucao_normativa', 'ordem_servico', 
  'comunicado', 'decreto', 'lei', 'outro'
);

CREATE TYPE public.status_documento AS ENUM ('rascunho', 'aguardando_publicacao', 'publicado', 'vigente', 'revogado');

CREATE TYPE public.tipo_portaria_rh AS ENUM (
  'nomeacao', 'exoneracao', 'designacao', 'dispensa', 'ferias', 
  'viagem', 'cessao', 'afastamento', 'substituicao', 'gratificacao', 
  'comissao', 'outro'
);

CREATE TYPE public.tipo_ato_nomeacao AS ENUM ('portaria', 'decreto', 'ato', 'outro');
CREATE TYPE public.status_nomeacao AS ENUM ('ativo', 'encerrado', 'revogado');

-- ============================================
-- TIPOS DE ESTRUTURA ORGANIZACIONAL
-- ============================================

CREATE TYPE public.tipo_unidade AS ENUM (
  'presidencia', 'diretoria', 'departamento', 'setor', 'divisao', 'secao', 'coordenacao'
);

CREATE TYPE public.nivel_perfil AS ENUM ('sistema', 'organizacional', 'operacional');

-- ============================================
-- TIPOS DE UNIDADES LOCAIS / ESPORTIVAS
-- ============================================

CREATE TYPE public.tipo_unidade_local AS ENUM (
  'ginasio', 'estadio', 'parque_aquatico', 'piscina', 'complexo', 'quadra', 'outro'
);

CREATE TYPE public.status_unidade_local AS ENUM ('ativa', 'inativa', 'manutencao', 'interditada');
CREATE TYPE public.status_agenda AS ENUM ('solicitado', 'aprovado', 'rejeitado', 'cancelado', 'concluido');

-- ============================================
-- TIPOS DE PATRIMÔNIO
-- ============================================

CREATE TYPE public.categoria_bem AS ENUM (
  'mobiliario', 'informatica', 'equipamento_esportivo', 'veiculo', 'eletrodomestico', 'outros'
);

CREATE TYPE public.estado_conservacao AS ENUM ('otimo', 'bom', 'regular', 'ruim', 'inservivel');
CREATE TYPE public.estado_conservacao_inventario AS ENUM ('novo', 'bom', 'regular', 'ruim', 'inservivel');

CREATE TYPE public.situacao_patrimonio AS ENUM ('em_uso', 'em_estoque', 'cedido', 'em_manutencao', 'baixado');
CREATE TYPE public.situacao_bem_patrimonio AS ENUM ('cadastrado', 'tombado', 'alocado', 'em_manutencao', 'baixado', 'extraviado');

CREATE TYPE public.forma_aquisicao AS ENUM ('compra', 'doacao', 'cessao', 'transferencia');
CREATE TYPE public.motivo_baixa_patrimonio AS ENUM ('inservivel', 'obsoleto', 'doacao', 'alienacao', 'perda');

CREATE TYPE public.status_coleta_inventario AS ENUM ('conferido', 'nao_localizado', 'divergente', 'avariado', 'em_manutencao');
CREATE TYPE public.status_conciliacao AS ENUM ('pendente', 'conciliado', 'divergente', 'regularizado');

-- ============================================
-- TIPOS DE LICITAÇÕES E CONTRATOS
-- ============================================

CREATE TYPE public.modalidade_licitacao AS ENUM (
  'pregao_eletronico', 'pregao_presencial', 'concorrencia', 'concurso', 
  'leilao', 'dialogo_competitivo', 'dispensa', 'inexigibilidade'
);

CREATE TYPE public.fase_licitacao AS ENUM (
  'planejamento', 'elaboracao', 'edital', 'publicacao', 'propostas', 
  'habilitacao', 'julgamento', 'homologacao', 'adjudicacao', 
  'contratacao', 'encerrado', 'revogado', 'anulado', 'deserto', 'fracassado'
);

CREATE TYPE public.tipo_aditivo AS ENUM ('prazo', 'valor', 'objeto', 'misto');

-- ============================================
-- TIPOS DE PROCESSOS
-- ============================================

CREATE TYPE public.nivel_sigilo_processo AS ENUM ('publico', 'restrito', 'sigiloso');
CREATE TYPE public.referencia_prazo_processo AS ENUM ('legal', 'interno', 'judicial', 'contratual', 'regulamentar');
CREATE TYPE public.decisao_despacho AS ENUM ('deferido', 'indeferido', 'parcialmente_deferido', 'encaminhar', 'arquivar', 'suspender', 'informar');
CREATE TYPE public.instancia_recurso AS ENUM ('primeira', 'segunda');

-- ============================================
-- TIPOS DE GOVERNANÇA E RISCOS
-- ============================================

CREATE TYPE public.nivel_risco AS ENUM ('muito_baixo', 'baixo', 'medio', 'alto', 'muito_alto');
CREATE TYPE public.periodicidade_controle AS ENUM ('diario', 'semanal', 'quinzenal', 'mensal', 'bimestral', 'trimestral', 'semestral', 'anual', 'eventual');

-- ============================================
-- TIPOS FINANCEIROS
-- ============================================

CREATE TYPE public.natureza_rubrica AS ENUM ('remuneratorio', 'indenizatorio', 'informativo');
CREATE TYPE public.natureza_conta AS ENUM ('ativo', 'passivo', 'patrimonio_liquido', 'receita', 'despesa', 'resultado');
CREATE TYPE public.origem_lancamento AS ENUM ('automatico', 'manual', 'importado', 'retroativo');
CREATE TYPE public.formula_tipo AS ENUM ('valor_fixo', 'percentual_base', 'quantidade_valor', 'calculo_especial', 'referencia_cargo');

CREATE TYPE public.status_folha AS ENUM ('aberta', 'calculada', 'conferida', 'fechada', 'paga');
CREATE TYPE public.tipo_folha AS ENUM ('normal', 'complementar', 'ferias', 'rescisao', 'decimo_terceiro');
CREATE TYPE public.tipo_rubrica AS ENUM ('provento', 'desconto', 'base', 'informativo');

CREATE TYPE public.status_adiantamento AS ENUM (
  'solicitado', 'autorizado', 'liberado', 'em_uso', 
  'prestacao_pendente', 'prestado', 'aprovado', 'rejeitado', 'bloqueado'
);

-- ============================================
-- TIPOS DE CESSÃO
-- ============================================

CREATE TYPE public.status_termo_cessao AS ENUM ('pendente', 'emitido', 'assinado', 'cancelado');

-- ============================================
-- TIPOS DE DEMANDAS ASCOM
-- ============================================

CREATE TYPE public.categoria_demanda_ascom AS ENUM (
  'cobertura_institucional', 'criacao_artes', 'conteudo_institucional', 
  'gestao_redes_sociais', 'imprensa_relacoes', 'demandas_emergenciais'
);

CREATE TYPE public.prioridade_demanda_ascom AS ENUM ('baixa', 'normal', 'alta', 'urgente');
CREATE TYPE public.status_demanda_ascom AS ENUM ('solicitada', 'em_analise', 'em_producao', 'em_revisao', 'concluida', 'cancelada');

-- ============================================
-- TIPOS DE DÉBITOS TÉCNICOS
-- ============================================

CREATE TYPE public.prioridade_debito AS ENUM ('critica', 'alta', 'media', 'baixa');
CREATE TYPE public.status_debito AS ENUM ('identificado', 'em_analise', 'planejado', 'em_correcao', 'resolvido', 'aceito');

-- ============================================
-- OUTROS TIPOS
-- ============================================

CREATE TYPE public.esfera_governo AS ENUM ('municipal', 'estadual', 'federal');
CREATE TYPE public.status_solicitacao AS ENUM ('pendente', 'aprovada', 'rejeitada', 'cancelada');

-- ============================================================
-- FIM: 02_enums.sql
-- Próximo: 03_tabelas.sql
-- ============================================================
