-- ============================================
-- IDJuv - Schema de Migração
-- Arquivo 01: Tipos ENUM
-- ============================================
-- Execute este arquivo PRIMEIRO no SQL Editor
-- do seu novo projeto Supabase
-- ============================================

-- Escopo de acesso
CREATE TYPE public.access_scope AS ENUM (
  'all', 
  'org_unit', 
  'local_unit', 
  'own', 
  'readonly'
);

-- Módulos da aplicação
CREATE TYPE public.app_module AS ENUM (
  'rh', 
  'financeiro', 
  'compras', 
  'patrimonio', 
  'contratos', 
  'workflow', 
  'governanca', 
  'transparencia', 
  'comunicacao', 
  'programas', 
  'gestores_escolares', 
  'integridade', 
  'admin'
);

-- Permissões da aplicação
CREATE TYPE public.app_permission AS ENUM (
  'users.read', 
  'users.create', 
  'users.update', 
  'users.delete', 
  'content.read', 
  'content.create', 
  'content.update', 
  'content.delete', 
  'reports.view', 
  'reports.export', 
  'settings.view', 
  'settings.edit', 
  'processes.read', 
  'processes.create', 
  'processes.update', 
  'processes.delete', 
  'processes.approve', 
  'roles.manage', 
  'permissions.manage', 
  'documents.view', 
  'documents.create', 
  'documents.edit', 
  'documents.delete', 
  'requests.create', 
  'requests.view', 
  'requests.approve', 
  'requests.reject', 
  'audit.view', 
  'audit.export', 
  'approval.delegate', 
  'org_units.manage', 
  'mfa.manage'
);

-- Papéis da aplicação
CREATE TYPE public.app_role AS ENUM (
  'admin', 
  'manager', 
  'user'
);

-- Status de aprovação
CREATE TYPE public.approval_status AS ENUM (
  'draft', 
  'submitted', 
  'in_review', 
  'approved', 
  'rejected', 
  'cancelled'
);

-- Ações de auditoria
CREATE TYPE public.audit_action AS ENUM (
  'login', 
  'logout', 
  'login_failed', 
  'password_change', 
  'password_reset', 
  'create', 
  'update', 
  'delete', 
  'view', 
  'export', 
  'upload', 
  'download', 
  'approve', 
  'reject', 
  'submit'
);

-- Status de backup
CREATE TYPE public.backup_status AS ENUM (
  'pending', 
  'running', 
  'success', 
  'failed', 
  'partial'
);

-- Tipo de backup
CREATE TYPE public.backup_type AS ENUM (
  'daily', 
  'weekly', 
  'monthly', 
  'manual'
);

-- Categoria de bem patrimonial
CREATE TYPE public.categoria_bem AS ENUM (
  'mobiliario', 
  'informatica', 
  'equipamento_esportivo', 
  'veiculo', 
  'eletrodomestico', 
  'outros'
);

-- Categoria de cargo
CREATE TYPE public.categoria_cargo AS ENUM (
  'efetivo', 
  'comissionado', 
  'funcao_gratificada', 
  'temporario', 
  'estagiario'
);

-- Categoria de demanda ASCOM
CREATE TYPE public.categoria_demanda_ascom AS ENUM (
  'cobertura_institucional', 
  'criacao_artes', 
  'conteudo_institucional', 
  'gestao_redes_sociais', 
  'imprensa_relacoes', 
  'demandas_emergenciais'
);

-- Categoria de portaria
CREATE TYPE public.categoria_portaria AS ENUM (
  'estruturante', 
  'normativa', 
  'pessoal', 
  'delegacao', 
  'nomeacao', 
  'exoneracao', 
  'designacao', 
  'dispensa', 
  'cessao', 
  'ferias', 
  'licenca'
);

-- Decisão de despacho
CREATE TYPE public.decisao_despacho AS ENUM (
  'deferido', 
  'indeferido', 
  'parcialmente_deferido', 
  'encaminhar', 
  'arquivar', 
  'suspender', 
  'informar'
);

-- Esfera de governo
CREATE TYPE public.esfera_governo AS ENUM (
  'municipal', 
  'estadual', 
  'federal'
);

-- Estado de conservação
CREATE TYPE public.estado_conservacao AS ENUM (
  'otimo', 
  'bom', 
  'regular', 
  'ruim', 
  'inservivel'
);

-- Estado de conservação inventário
CREATE TYPE public.estado_conservacao_inventario AS ENUM (
  'novo', 
  'bom', 
  'regular', 
  'ruim', 
  'inservivel'
);

-- Fase de licitação
CREATE TYPE public.fase_licitacao AS ENUM (
  'planejamento', 
  'elaboracao', 
  'edital', 
  'publicacao', 
  'propostas', 
  'habilitacao', 
  'julgamento', 
  'homologacao', 
  'adjudicacao', 
  'contratacao', 
  'encerrado', 
  'revogado', 
  'anulado', 
  'deserto', 
  'fracassado'
);

-- Forma de aquisição
CREATE TYPE public.forma_aquisicao AS ENUM (
  'compra', 
  'doacao', 
  'cessao', 
  'transferencia'
);

-- Tipo de fórmula
CREATE TYPE public.formula_tipo AS ENUM (
  'valor_fixo', 
  'percentual_base', 
  'quantidade_valor', 
  'calculo_especial', 
  'referencia_cargo'
);

-- Instância de recurso
CREATE TYPE public.instancia_recurso AS ENUM (
  'primeira', 
  'segunda'
);

-- Modalidade de licitação
CREATE TYPE public.modalidade_licitacao AS ENUM (
  'pregao_eletronico', 
  'pregao_presencial', 
  'concorrencia', 
  'concurso', 
  'leilao', 
  'dialogo_competitivo', 
  'dispensa', 
  'inexigibilidade'
);

-- Motivo de baixa patrimonial
CREATE TYPE public.motivo_baixa_patrimonio AS ENUM (
  'inservivel', 
  'obsoleto', 
  'doacao', 
  'alienacao', 
  'perda'
);

-- Natureza do cargo
CREATE TYPE public.natureza_cargo AS ENUM (
  'efetivo', 
  'comissionado'
);

-- Natureza da conta
CREATE TYPE public.natureza_conta AS ENUM (
  'ativo', 
  'passivo', 
  'patrimonio_liquido', 
  'receita', 
  'despesa', 
  'resultado'
);

-- Natureza da rubrica
CREATE TYPE public.natureza_rubrica AS ENUM (
  'remuneratorio', 
  'indenizatorio', 
  'informativo'
);

-- Nível de perfil
CREATE TYPE public.nivel_perfil AS ENUM (
  'sistema', 
  'organizacional', 
  'operacional'
);

-- Nível de risco
CREATE TYPE public.nivel_risco AS ENUM (
  'muito_baixo', 
  'baixo', 
  'medio', 
  'alto', 
  'muito_alto'
);

-- Nível de sigilo do processo
CREATE TYPE public.nivel_sigilo_processo AS ENUM (
  'publico', 
  'restrito', 
  'sigiloso'
);

-- Origem de lançamento
CREATE TYPE public.origem_lancamento AS ENUM (
  'automatico', 
  'manual', 
  'importado', 
  'retroativo'
);

-- Periodicidade de controle
CREATE TYPE public.periodicidade_controle AS ENUM (
  'diario', 
  'semanal', 
  'quinzenal', 
  'mensal', 
  'bimestral', 
  'trimestral', 
  'semestral', 
  'anual', 
  'eventual'
);

-- Prioridade de demanda
CREATE TYPE public.prioridade_demanda AS ENUM (
  'baixa', 
  'media', 
  'alta', 
  'urgente'
);

-- Situação do bem patrimonial
CREATE TYPE public.situacao_bem_patrimonio AS ENUM (
  'localizado', 
  'nao_localizado', 
  'transferido', 
  'baixado', 
  'pendente_verificacao'
);

-- Situação funcional
CREATE TYPE public.situacao_funcional AS ENUM (
  'ativo', 
  'afastado', 
  'cedido', 
  'licenca', 
  'ferias', 
  'exonerado', 
  'aposentado', 
  'falecido'
);

-- Situação do servidor
CREATE TYPE public.situacao_servidor AS ENUM (
  'ativo', 
  'afastado', 
  'cedido', 
  'licenca', 
  'ferias', 
  'exonerado', 
  'aposentado', 
  'falecido', 
  'desligado', 
  'suspenso'
);

-- Status da agenda
CREATE TYPE public.status_agenda AS ENUM (
  'solicitado', 
  'aprovado', 
  'rejeitado', 
  'cancelado', 
  'concluido'
);

-- Status da campanha
CREATE TYPE public.status_campanha AS ENUM (
  'planejada', 
  'em_andamento', 
  'pausada', 
  'concluida', 
  'cancelada'
);

-- Status de checklist
CREATE TYPE public.status_checklist AS ENUM (
  'pendente', 
  'em_andamento', 
  'concluido', 
  'nao_aplicavel'
);

-- Status da demanda ASCOM
CREATE TYPE public.status_demanda_ascom AS ENUM (
  'nova', 
  'em_analise', 
  'aprovada', 
  'em_producao', 
  'revisao', 
  'concluida', 
  'cancelada', 
  'arquivada'
);

-- Status do documento
CREATE TYPE public.status_documento AS ENUM (
  'rascunho', 
  'aguardando_publicacao', 
  'publicado', 
  'vigente', 
  'revogado'
);

-- Status da folha
CREATE TYPE public.status_folha AS ENUM (
  'rascunho', 
  'em_processamento', 
  'calculada', 
  'conferencia', 
  'aprovada', 
  'fechada', 
  'paga', 
  'cancelada'
);

-- Status de nomeação
CREATE TYPE public.status_nomeacao AS ENUM (
  'ativo', 
  'encerrado', 
  'revogado'
);

-- Status de ponto
CREATE TYPE public.status_ponto AS ENUM (
  'completo', 
  'incompleto', 
  'pendente_justificativa', 
  'justificado', 
  'aprovado'
);

-- Status do processo
CREATE TYPE public.status_processo AS ENUM (
  'em_andamento', 
  'suspenso', 
  'arquivado', 
  'concluido', 
  'cancelado'
);

-- Status de solicitação
CREATE TYPE public.status_solicitacao AS ENUM (
  'pendente', 
  'aprovada', 
  'rejeitada', 
  'cancelada'
);

-- Status do termo de cessão
CREATE TYPE public.status_termo_cessao AS ENUM (
  'pendente', 
  'emitido', 
  'assinado', 
  'cancelado'
);

-- Status da unidade local
CREATE TYPE public.status_unidade_local AS ENUM (
  'ativa', 
  'inativa', 
  'manutencao', 
  'interditada'
);

-- Tipo de aditivo
CREATE TYPE public.tipo_aditivo AS ENUM (
  'prazo', 
  'valor', 
  'prazo_valor', 
  'supressao', 
  'acrescimo', 
  'reajuste', 
  'apostilamento'
);

-- Tipo de afastamento
CREATE TYPE public.tipo_afastamento AS ENUM (
  'licenca', 
  'suspensao', 
  'cessao', 
  'disposicao', 
  'servico_externo', 
  'missao', 
  'outro'
);

-- Tipo de ato de nomeação
CREATE TYPE public.tipo_ato_nomeacao AS ENUM (
  'portaria', 
  'decreto', 
  'ato', 
  'outro'
);

-- Tipo de conta bancária
CREATE TYPE public.tipo_conta_bancaria AS ENUM (
  'corrente', 
  'poupanca', 
  'salario', 
  'pagamento'
);

-- Tipo de documento
CREATE TYPE public.tipo_documento AS ENUM (
  'portaria', 
  'resolucao', 
  'instrucao_normativa', 
  'ordem_servico', 
  'comunicado', 
  'decreto', 
  'lei', 
  'outro'
);

-- Tipo de fechamento
CREATE TYPE public.tipo_fechamento AS ENUM (
  'mensal', 
  'extraordinario', 
  'especial'
);

-- Tipo de folha
CREATE TYPE public.tipo_folha AS ENUM (
  'normal', 
  'complementar', 
  'decimo_terceiro', 
  'ferias', 
  'rescisao', 
  'adiantamento'
);

-- Tipo de justificativa
CREATE TYPE public.tipo_justificativa AS ENUM (
  'atestado', 
  'declaracao', 
  'trabalho_externo', 
  'esquecimento', 
  'problema_sistema', 
  'outro'
);

-- Tipo de lançamento de horas
CREATE TYPE public.tipo_lancamento_horas AS ENUM (
  'credito', 
  'debito', 
  'ajuste'
);

-- Tipo de licença
CREATE TYPE public.tipo_licenca AS ENUM (
  'maternidade', 
  'paternidade', 
  'medica', 
  'casamento', 
  'luto', 
  'interesse_particular', 
  'capacitacao', 
  'premio', 
  'mandato_eletivo', 
  'mandato_classista', 
  'outra'
);

-- Tipo de movimentação funcional
CREATE TYPE public.tipo_movimentacao_funcional AS ENUM (
  'nomeacao', 
  'exoneracao', 
  'designacao', 
  'dispensa', 
  'promocao', 
  'transferencia', 
  'cessao', 
  'requisicao', 
  'redistribuicao', 
  'remocao', 
  'afastamento', 
  'retorno', 
  'aposentadoria', 
  'vacancia'
);

-- Tipo de portaria RH
CREATE TYPE public.tipo_portaria_rh AS ENUM (
  'nomeacao', 
  'exoneracao', 
  'designacao', 
  'dispensa', 
  'ferias', 
  'viagem', 
  'cessao', 
  'afastamento', 
  'substituicao', 
  'gratificacao', 
  'comissao', 
  'outro'
);

-- Tipo de processo administrativo
CREATE TYPE public.tipo_processo_administrativo AS ENUM (
  'compras', 
  'rh', 
  'juridico', 
  'financeiro', 
  'administrativo', 
  'licitacao', 
  'contrato', 
  'convenio', 
  'outro'
);

-- Tipo de registro de ponto
CREATE TYPE public.tipo_registro_ponto AS ENUM (
  'normal', 
  'feriado', 
  'folga', 
  'atestado', 
  'falta', 
  'ferias', 
  'licenca'
);

-- Tipo de rubrica
CREATE TYPE public.tipo_rubrica AS ENUM (
  'vencimento', 
  'gratificacao', 
  'adicional', 
  'desconto', 
  'beneficio', 
  'indenizacao', 
  'imposto', 
  'contribuicao', 
  'outros'
);

-- Tipo de servidor
CREATE TYPE public.tipo_servidor AS ENUM (
  'efetivo', 
  'comissionado', 
  'temporario', 
  'estagiario', 
  'cedido', 
  'requisitado'
);

-- Tipo de unidade
CREATE TYPE public.tipo_unidade AS ENUM (
  'presidencia', 
  'diretoria', 
  'departamento', 
  'setor', 
  'divisao', 
  'secao', 
  'coordenacao'
);

-- Tipo de unidade local
CREATE TYPE public.tipo_unidade_local AS ENUM (
  'ginasio', 
  'estadio', 
  'parque_aquatico', 
  'piscina', 
  'complexo', 
  'quadra', 
  'outro'
);

-- Tipo de usuário
CREATE TYPE public.tipo_usuario AS ENUM (
  'super_admin', 
  'administrador', 
  'servidor', 
  'cidadao', 
  'tecnico'
);

-- Vínculo funcional
CREATE TYPE public.vinculo_funcional AS ENUM (
  'efetivo', 
  'comissionado', 
  'cedido', 
  'temporario', 
  'estagiario', 
  'requisitado'
);

-- ============================================
-- FIM DO ARQUIVO 01_enums.sql
-- Próximo: 02_tabelas.sql
-- ============================================
