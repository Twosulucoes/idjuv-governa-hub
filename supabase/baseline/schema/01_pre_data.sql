-- GERADO por scripts/db/gerar-baseline.sh (pré-dados). NÃO edite à mão.
-- Fonte: replay das migrações de supabase/migrations + supabase/baseline/lacunas.
-- Ordem completa de aplicação: supabase/baseline/aplicar.sh

--
-- PostgreSQL database dump
--


-- Dumped from database version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: access_scope; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.access_scope AS ENUM (
    'all',
    'org_unit',
    'local_unit',
    'own',
    'readonly'
);


--
-- Name: app_module; Type: TYPE; Schema: public; Owner: -
--

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
    'admin',
    'federacoes',
    'organizacoes',
    'gabinete',
    'patrimonio_mobile',
    'arbitros'
);


--
-- Name: TYPE app_module; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TYPE public.app_module IS 'Lista de módulos funcionais do sistema: rh, financeiro, compras, patrimonio, contratos, workflow, governanca, transparencia, comunicacao, programas, gestores_escolares, integridade, admin, organizacoes, gabinete';


--
-- Name: app_permission; Type: TYPE; Schema: public; Owner: -
--

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


--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'manager',
    'user'
);


--
-- Name: approval_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.approval_status AS ENUM (
    'draft',
    'submitted',
    'in_review',
    'approved',
    'rejected',
    'cancelled'
);


--
-- Name: audit_action; Type: TYPE; Schema: public; Owner: -
--

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


--
-- Name: backup_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.backup_status AS ENUM (
    'pending',
    'running',
    'success',
    'failed',
    'partial'
);


--
-- Name: backup_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.backup_type AS ENUM (
    'daily',
    'weekly',
    'monthly',
    'manual'
);


--
-- Name: categoria_bem; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.categoria_bem AS ENUM (
    'mobiliario',
    'informatica',
    'equipamento_esportivo',
    'veiculo',
    'eletrodomestico',
    'outros'
);


--
-- Name: categoria_cargo; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.categoria_cargo AS ENUM (
    'efetivo',
    'comissionado',
    'funcao_gratificada',
    'temporario',
    'estagiario'
);


--
-- Name: categoria_demanda_ascom; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.categoria_demanda_ascom AS ENUM (
    'cobertura_institucional',
    'criacao_artes',
    'conteudo_institucional',
    'gestao_redes_sociais',
    'imprensa_relacoes',
    'demandas_emergenciais'
);


--
-- Name: categoria_portaria; Type: TYPE; Schema: public; Owner: -
--

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


--
-- Name: cms_destino; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.cms_destino AS ENUM (
    'portal_home',
    'portal_noticias',
    'portal_eventos',
    'portal_programas',
    'selecoes_estudantis',
    'jogos_escolares',
    'esports',
    'institucional',
    'transparencia',
    'redes_sociais'
);


--
-- Name: cms_tipo_conteudo; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.cms_tipo_conteudo AS ENUM (
    'noticia',
    'comunicado',
    'banner',
    'destaque',
    'evento',
    'galeria',
    'video',
    'documento'
);


--
-- Name: decisao_despacho; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.decisao_despacho AS ENUM (
    'deferido',
    'indeferido',
    'parcialmente_deferido',
    'encaminhar',
    'arquivar',
    'suspender',
    'informar'
);


--
-- Name: esfera_governo; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.esfera_governo AS ENUM (
    'municipal',
    'estadual',
    'federal'
);


--
-- Name: estado_conservacao; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.estado_conservacao AS ENUM (
    'otimo',
    'bom',
    'regular',
    'ruim',
    'inservivel'
);


--
-- Name: estado_conservacao_inventario; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.estado_conservacao_inventario AS ENUM (
    'novo',
    'bom',
    'regular',
    'ruim',
    'inservivel'
);


--
-- Name: fase_licitacao; Type: TYPE; Schema: public; Owner: -
--

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


--
-- Name: forma_aquisicao; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.forma_aquisicao AS ENUM (
    'compra',
    'doacao',
    'cessao',
    'transferencia'
);


--
-- Name: formula_tipo; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.formula_tipo AS ENUM (
    'valor_fixo',
    'percentual_base',
    'quantidade_valor',
    'calculo_especial',
    'referencia_cargo'
);


--
-- Name: instancia_recurso; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.instancia_recurso AS ENUM (
    'primeira',
    'segunda'
);


--
-- Name: modalidade_licitacao; Type: TYPE; Schema: public; Owner: -
--

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


--
-- Name: motivo_baixa_patrimonio; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.motivo_baixa_patrimonio AS ENUM (
    'inservivel',
    'obsoleto',
    'doacao',
    'alienacao',
    'perda'
);


--
-- Name: natureza_cargo; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.natureza_cargo AS ENUM (
    'efetivo',
    'comissionado'
);


--
-- Name: natureza_conta; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.natureza_conta AS ENUM (
    'ativo',
    'passivo',
    'patrimonio_liquido',
    'receita',
    'despesa',
    'resultado'
);


--
-- Name: natureza_rubrica; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.natureza_rubrica AS ENUM (
    'remuneratorio',
    'indenizatorio',
    'informativo'
);


--
-- Name: nivel_risco; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.nivel_risco AS ENUM (
    'muito_baixo',
    'baixo',
    'medio',
    'alto',
    'muito_alto'
);


--
-- Name: nivel_sigilo_processo; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.nivel_sigilo_processo AS ENUM (
    'publico',
    'restrito',
    'sigiloso'
);


--
-- Name: origem_lancamento; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.origem_lancamento AS ENUM (
    'automatico',
    'manual',
    'importado',
    'retroativo'
);


--
-- Name: origem_vinculo; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.origem_vinculo AS ENUM (
    'idjuv',
    'estado_rr',
    'federal',
    'municipal',
    'outro_orgao'
);


--
-- Name: periodicidade_controle; Type: TYPE; Schema: public; Owner: -
--

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


--
-- Name: prioridade_debito; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.prioridade_debito AS ENUM (
    'critica',
    'alta',
    'media',
    'baixa'
);


--
-- Name: prioridade_demanda_ascom; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.prioridade_demanda_ascom AS ENUM (
    'baixa',
    'normal',
    'alta',
    'urgente'
);


--
-- Name: referencia_prazo_processo; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.referencia_prazo_processo AS ENUM (
    'legal',
    'interno',
    'judicial',
    'contratual',
    'regulamentar'
);


--
-- Name: situacao_bem_patrimonio; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.situacao_bem_patrimonio AS ENUM (
    'cadastrado',
    'tombado',
    'alocado',
    'em_manutencao',
    'baixado',
    'extraviado'
);


--
-- Name: situacao_funcional; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.situacao_funcional AS ENUM (
    'ativo',
    'afastado',
    'cedido',
    'licenca',
    'ferias',
    'exonerado',
    'aposentado',
    'falecido',
    'inativo'
);


--
-- Name: situacao_patrimonio; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.situacao_patrimonio AS ENUM (
    'em_uso',
    'em_estoque',
    'cedido',
    'em_manutencao',
    'baixado'
);


--
-- Name: status_adiantamento; Type: TYPE; Schema: public; Owner: -
--

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


--
-- Name: status_agenda; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_agenda AS ENUM (
    'solicitado',
    'aprovado',
    'rejeitado',
    'cancelado',
    'concluido'
);


--
-- Name: status_coleta_inventario; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_coleta_inventario AS ENUM (
    'conferido',
    'nao_localizado',
    'divergente',
    'avariado',
    'em_manutencao',
    'sem_etiqueta'
);


--
-- Name: status_conciliacao; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_conciliacao AS ENUM (
    'pendente',
    'conciliado',
    'divergente',
    'justificado'
);


--
-- Name: status_conformidade; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_conformidade AS ENUM (
    'conforme',
    'parcialmente_conforme',
    'nao_conforme',
    'nao_aplicavel',
    'pendente'
);


--
-- Name: status_conteudo; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_conteudo AS ENUM (
    'rascunho',
    'em_revisao',
    'aprovado',
    'publicado',
    'arquivado'
);


--
-- Name: status_contrato; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_contrato AS ENUM (
    'rascunho',
    'vigente',
    'suspenso',
    'encerrado',
    'rescindido',
    'aditado'
);


--
-- Name: status_debito; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_debito AS ENUM (
    'pendente',
    'em_andamento',
    'resolvido',
    'cancelado',
    'adiado'
);


--
-- Name: status_demanda_ascom; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_demanda_ascom AS ENUM (
    'rascunho',
    'enviada',
    'em_analise',
    'aguardando_autorizacao',
    'aprovada',
    'em_execucao',
    'concluida',
    'indeferida',
    'cancelada'
);


--
-- Name: status_documento; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_documento AS ENUM (
    'rascunho',
    'aguardando_publicacao',
    'publicado',
    'vigente',
    'revogado',
    'minuta',
    'aguardando_assinatura',
    'assinado'
);


--
-- Name: status_empenho; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_empenho AS ENUM (
    'emitido',
    'parcialmente_liquidado',
    'liquidado',
    'parcialmente_pago',
    'pago',
    'anulado'
);


--
-- Name: status_evento_esocial; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_evento_esocial AS ENUM (
    'pendente',
    'gerado',
    'validado',
    'enviado',
    'aceito',
    'rejeitado',
    'erro'
);


--
-- Name: status_folha; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_folha AS ENUM (
    'aberta',
    'previa',
    'processando',
    'fechada',
    'reaberta'
);


--
-- Name: status_instituicao; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_instituicao AS ENUM (
    'ativo',
    'inativo',
    'pendente_validacao'
);


--
-- Name: status_liquidacao; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_liquidacao AS ENUM (
    'pendente',
    'atestada',
    'aprovada',
    'rejeitada',
    'cancelada'
);


--
-- Name: status_medicao; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_medicao AS ENUM (
    'rascunho',
    'enviada',
    'aprovada',
    'rejeitada',
    'paga'
);


--
-- Name: status_movimentacao_patrimonio; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_movimentacao_patrimonio AS ENUM (
    'pendente',
    'aprovado',
    'rejeitado',
    'concluido'
);


--
-- Name: status_movimentacao_processo; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_movimentacao_processo AS ENUM (
    'pendente',
    'recebido',
    'respondido',
    'vencido',
    'cancelado'
);


--
-- Name: status_nomeacao; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_nomeacao AS ENUM (
    'ativo',
    'encerrado',
    'revogado'
);


--
-- Name: status_pagamento; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_pagamento AS ENUM (
    'programado',
    'autorizado',
    'pago',
    'devolvido',
    'estornado',
    'cancelado'
);


--
-- Name: status_participante; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_participante AS ENUM (
    'pendente',
    'confirmado',
    'recusado',
    'ausente',
    'presente'
);


--
-- Name: status_ponto; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_ponto AS ENUM (
    'completo',
    'incompleto',
    'pendente_justificativa',
    'justificado',
    'aprovado'
);


--
-- Name: status_processo_administrativo; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_processo_administrativo AS ENUM (
    'aberto',
    'em_tramitacao',
    'suspenso',
    'concluido',
    'arquivado'
);


--
-- Name: status_provimento; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_provimento AS ENUM (
    'ativo',
    'suspenso',
    'encerrado',
    'vacante'
);


--
-- Name: status_recurso_lai; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_recurso_lai AS ENUM (
    'interposto',
    'em_analise',
    'deferido',
    'deferido_parcial',
    'indeferido',
    'nao_conhecido',
    'desistencia'
);


--
-- Name: status_reuniao; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_reuniao AS ENUM (
    'agendada',
    'confirmada',
    'em_andamento',
    'realizada',
    'cancelada',
    'adiada'
);


--
-- Name: status_risco; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_risco AS ENUM (
    'identificado',
    'em_analise',
    'em_tratamento',
    'monitorado',
    'encerrado'
);


--
-- Name: status_solicitacao; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_solicitacao AS ENUM (
    'pendente',
    'aprovada',
    'rejeitada',
    'cancelada'
);


--
-- Name: status_termo_cessao; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_termo_cessao AS ENUM (
    'pendente',
    'emitido',
    'assinado',
    'cancelado'
);


--
-- Name: status_unidade_local; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_unidade_local AS ENUM (
    'ativa',
    'inativa',
    'manutencao',
    'interditada'
);


--
-- Name: status_workflow_financeiro; Type: TYPE; Schema: public; Owner: -
--

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


--
-- Name: tipo_aditivo; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_aditivo AS ENUM (
    'prazo',
    'valor',
    'prazo_valor',
    'objeto',
    'supressao',
    'reequilibrio',
    'apostilamento'
);


--
-- Name: tipo_afastamento; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_afastamento AS ENUM (
    'licenca',
    'suspensao',
    'cessao',
    'disposicao',
    'servico_externo',
    'missao',
    'outro'
);


--
-- Name: tipo_alteracao_orcamentaria; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_alteracao_orcamentaria AS ENUM (
    'suplementacao',
    'reducao',
    'remanejamento',
    'transposicao',
    'transferencia',
    'credito_especial',
    'credito_extraordinario'
);


--
-- Name: tipo_ato_nomeacao; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_ato_nomeacao AS ENUM (
    'portaria',
    'decreto',
    'ato',
    'outro'
);


--
-- Name: tipo_campanha_inventario; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_campanha_inventario AS ENUM (
    'geral',
    'setorial',
    'rotativo'
);


--
-- Name: tipo_conta_bancaria; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_conta_bancaria AS ENUM (
    'corrente',
    'poupanca',
    'aplicacao',
    'vinculada'
);


--
-- Name: tipo_conteudo_institucional; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_conteudo_institucional AS ENUM (
    'missao',
    'visao',
    'valores',
    'objetivos_estrategicos',
    'descricao_programa',
    'slogan',
    'narrativa_institucional',
    'identidade_visual'
);


--
-- Name: tipo_controle; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_controle AS ENUM (
    'preventivo',
    'detectivo',
    'corretivo'
);


--
-- Name: tipo_decisao; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_decisao AS ENUM (
    'despacho',
    'deliberacao',
    'resolucao',
    'determinacao',
    'recomendacao'
);


--
-- Name: tipo_demanda_ascom; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_demanda_ascom AS ENUM (
    'cobertura_fotografica',
    'cobertura_audiovisual',
    'cobertura_jornalistica',
    'cobertura_redes_sociais',
    'cobertura_transmissao_ao_vivo',
    'arte_redes_sociais',
    'arte_banner',
    'arte_cartaz',
    'arte_folder',
    'arte_convite',
    'arte_certificado',
    'arte_identidade_visual',
    'conteudo_noticia_site',
    'conteudo_texto_redes',
    'conteudo_nota_oficial',
    'conteudo_release',
    'conteudo_discurso',
    'redes_publicacao_programada',
    'redes_campanha',
    'redes_cobertura_tempo_real',
    'imprensa_atendimento',
    'imprensa_agendamento_entrevista',
    'imprensa_resposta_oficial',
    'imprensa_nota_esclarecimento',
    'emergencial_crise',
    'emergencial_nota_urgente',
    'emergencial_posicionamento'
);


--
-- Name: tipo_despacho; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_despacho AS ENUM (
    'simples',
    'decisorio',
    'conclusivo'
);


--
-- Name: tipo_documento; Type: TYPE; Schema: public; Owner: -
--

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


--
-- Name: tipo_documento_licitacao; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_documento_licitacao AS ENUM (
    'etp',
    'termo_referencia',
    'projeto_basico',
    'pesquisa_precos',
    'parecer_juridico',
    'autorizacao',
    'dotacao_orcamentaria',
    'mapa_riscos',
    'minuta_edital',
    'minuta_contrato',
    'ata_aprovacao',
    'outro'
);


--
-- Name: tipo_documento_processo; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_documento_processo AS ENUM (
    'oficio',
    'nota_tecnica',
    'parecer',
    'despacho',
    'anexo',
    'requerimento',
    'declaracao',
    'certidao',
    'outro'
);


--
-- Name: tipo_empenho; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_empenho AS ENUM (
    'ordinario',
    'estimativo',
    'global'
);


--
-- Name: tipo_evento_lai; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_evento_lai AS ENUM (
    'abertura',
    'classificacao',
    'encaminhamento',
    'resposta_parcial',
    'prorrogacao',
    'resposta_final',
    'recurso_interposto',
    'recurso_respondido',
    'encerramento',
    'reativacao',
    'alteracao_responsavel'
);


--
-- Name: tipo_folha; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_folha AS ENUM (
    'mensal',
    'complementar',
    '13_1a_parcela',
    '13_2a_parcela',
    'rescisao',
    'retroativos'
);


--
-- Name: tipo_instituicao; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_instituicao AS ENUM (
    'formal',
    'informal',
    'orgao_publico'
);


--
-- Name: tipo_justificativa; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_justificativa AS ENUM (
    'atestado',
    'declaracao',
    'trabalho_externo',
    'esquecimento',
    'problema_sistema',
    'outro'
);


--
-- Name: tipo_lancamento_horas; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_lancamento_horas AS ENUM (
    'credito',
    'debito',
    'ajuste'
);


--
-- Name: tipo_licenca; Type: TYPE; Schema: public; Owner: -
--

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


--
-- Name: tipo_lotacao; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_lotacao AS ENUM (
    'lotacao_interna',
    'designacao',
    'cessao_interna',
    'lotacao_externa'
);


--
-- Name: tipo_manutencao; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_manutencao AS ENUM (
    'preventiva',
    'corretiva'
);


--
-- Name: tipo_movimentacao_funcional; Type: TYPE; Schema: public; Owner: -
--

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


--
-- Name: tipo_movimentacao_patrimonio; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_movimentacao_patrimonio AS ENUM (
    'transferencia_interna',
    'cessao',
    'emprestimo',
    'recolhimento'
);


--
-- Name: tipo_movimentacao_processo; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_movimentacao_processo AS ENUM (
    'despacho',
    'encaminhamento',
    'juntada',
    'decisao',
    'informacao',
    'ciencia',
    'devolucao'
);


--
-- Name: tipo_ocorrencia_patrimonio; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_ocorrencia_patrimonio AS ENUM (
    'dano',
    'extravio',
    'sinistro'
);


--
-- Name: tipo_papel_raci; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_papel_raci AS ENUM (
    'responsavel',
    'aprovador',
    'consultado',
    'informado'
);


--
-- Name: tipo_parecer; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_parecer AS ENUM (
    'juridico',
    'tecnico',
    'contabil',
    'controle_interno',
    'outro'
);


--
-- Name: tipo_portaria_rh; Type: TYPE; Schema: public; Owner: -
--

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


--
-- Name: tipo_processo_administrativo; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_processo_administrativo AS ENUM (
    'compra',
    'licitacao',
    'rh',
    'patrimonio',
    'lai',
    'governanca',
    'convenio',
    'diaria',
    'viagem',
    'federacao',
    'outro'
);


--
-- Name: tipo_receita; Type: TYPE; Schema: public; Owner: -
--

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


--
-- Name: tipo_registro_ponto; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_registro_ponto AS ENUM (
    'normal',
    'feriado',
    'folga',
    'atestado',
    'falta',
    'ferias',
    'licenca'
);


--
-- Name: tipo_reuniao; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_reuniao AS ENUM (
    'ordinaria',
    'extraordinaria',
    'audiencia',
    'sessao_solene',
    'reuniao_trabalho'
);


--
-- Name: tipo_rubrica; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_rubrica AS ENUM (
    'provento',
    'desconto',
    'informativo',
    'encargo'
);


--
-- Name: tipo_servidor; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_servidor AS ENUM (
    'efetivo_idjuv',
    'comissionado_idjuv',
    'cedido_entrada',
    'cedido_saida'
);


--
-- Name: tipo_unidade; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_unidade AS ENUM (
    'presidencia',
    'diretoria',
    'departamento',
    'setor',
    'divisao',
    'secao',
    'coordenacao',
    'assessoria',
    'nucleo'
);


--
-- Name: tipo_unidade_local; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_unidade_local AS ENUM (
    'ginasio',
    'estadio',
    'parque_aquatico',
    'piscina',
    'complexo',
    'quadra',
    'outro'
);


--
-- Name: tipo_vinculo_funcional; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_vinculo_funcional AS ENUM (
    'efetivo_idjuv',
    'comissionado_idjuv',
    'cedido_entrada',
    'cedido_saida'
);


--
-- Name: tipo_vinculo_servidor; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_vinculo_servidor AS ENUM (
    'efetivo',
    'comissionado',
    'cedido_entrada',
    'requisitado',
    'federal',
    'temporario',
    'estagiario'
);


--
-- Name: veiculo_publicacao; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.veiculo_publicacao AS ENUM (
    'doe',
    'pncp',
    'dou',
    'jornal',
    'site',
    'mural'
);


--
-- Name: vinculo_funcional; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.vinculo_funcional AS ENUM (
    'efetivo',
    'comissionado',
    'cedido',
    'temporario',
    'estagiario',
    'requisitado'
);


--
-- Name: afastamento_remunerado(text, text, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.afastamento_remunerado(p_tipo_afastamento text, p_tipo_licenca text, p_data date) RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_chave text;
  v_valor numeric;
BEGIN
  v_chave := CASE WHEN p_tipo_afastamento = 'licenca'
                  THEN 'licenca_remunerada_' || coalesce(p_tipo_licenca, 'outra')
                  ELSE 'afastamento_remunerado_' || p_tipo_afastamento END;
  SELECT valor INTO v_valor FROM public.parametros_folha
   WHERE tipo_parametro = v_chave AND ativo IS NOT FALSE
     AND vigencia_inicio <= p_data AND (vigencia_fim IS NULL OR vigencia_fim >= p_data)
   ORDER BY vigencia_inicio DESC LIMIT 1;
  IF FOUND THEN RETURN v_valor <> 0; END IF;
  RETURN NOT (p_tipo_afastamento = 'suspensao'
              OR (p_tipo_afastamento = 'licenca' AND p_tipo_licenca IN ('interesse_particular', 'mandato_eletivo')));
END;
$$;


--
-- Name: alcanca_modulos_alvo(public.app_module[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.alcanca_modulos_alvo(_modulos public.app_module[]) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT COALESCE(cardinality(_modulos), 0) = 0
      OR EXISTS (
           SELECT 1 FROM unnest(_modulos) AS m
           WHERE public.can_access_module(auth.uid(), m::text)
         );
$$;


--
-- Name: aniversariantes_do_mes(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.aniversariantes_do_mes(p_mes integer) RETURNS TABLE(nome text, dia integer)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT COALESCE(NULLIF(btrim(s.nome_social), ''), s.nome_completo)::text AS nome,
         EXTRACT(DAY FROM s.data_nascimento)::integer AS dia
  FROM public.servidores s
  WHERE public.perfil_ativo_atual()
    AND p_mes BETWEEN 1 AND 12
    AND s.situacao IN ('ativo', 'afastado', 'cedido', 'licenca', 'ferias')
    AND s.data_nascimento IS NOT NULL
    AND EXTRACT(MONTH FROM s.data_nascimento) = p_mes
  ORDER BY 2, 1;
$$;


--
-- Name: arbitro_cpf_cadastrado(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.arbitro_cpf_cadastrado(p_cpf text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT length(regexp_replace(coalesce(p_cpf, ''), '\D', '', 'g')) = 11
     AND EXISTS (
       SELECT 1
       FROM public.cadastro_arbitros
       WHERE regexp_replace(coalesce(cpf, ''), '\D', '', 'g')
           = regexp_replace(p_cpf, '\D', '', 'g')
     );
$$;


--
-- Name: atualizar_codigos_unidades_locais(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.atualizar_codigos_unidades_locais() RETURNS void
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  r RECORD;
  v_prefixo TEXT;
  v_ano INTEGER;
  v_sequencia INTEGER;
  v_codigo TEXT;
BEGIN
  v_ano := EXTRACT(YEAR FROM CURRENT_DATE);
  
  FOR r IN (
    SELECT id, tipo_unidade, created_at
    FROM public.unidades_locais
    WHERE codigo_unidade IS NULL OR codigo_unidade = ''
    ORDER BY created_at ASC
  ) LOOP
    v_prefixo := CASE r.tipo_unidade
      WHEN 'ginasio' THEN 'GIN'
      WHEN 'estadio' THEN 'EST'
      WHEN 'parque_aquatico' THEN 'PAQ'
      WHEN 'piscina' THEN 'PIS'
      WHEN 'complexo' THEN 'CPX'
      WHEN 'quadra' THEN 'QUA'
      ELSE 'OUT'
    END;
    
    SELECT COALESCE(MAX(
      CAST(SPLIT_PART(codigo_unidade, '-', 3) AS INTEGER)
    ), 0) + 1
    INTO v_sequencia
    FROM public.unidades_locais
    WHERE codigo_unidade LIKE v_prefixo || '-' || v_ano || '-%';
    
    v_codigo := v_prefixo || '-' || v_ano || '-' || LPAD(v_sequencia::TEXT, 3, '0');
    
    UPDATE public.unidades_locais
    SET codigo_unidade = v_codigo
    WHERE id = r.id;
  END LOOP;
END;
$$;


--
-- Name: atualizar_saldo_contrato(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.atualizar_saldo_contrato() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  UPDATE public.contratos SET 
    valor_executado = (SELECT COALESCE(SUM(valor_aprovado), 0) FROM public.medicoes_contrato 
      WHERE contrato_id = COALESCE(NEW.contrato_id, OLD.contrato_id) AND status = 'aprovada'),
    saldo_contrato = valor_atual - (SELECT COALESCE(SUM(valor_aprovado), 0) FROM public.medicoes_contrato 
      WHERE contrato_id = COALESCE(NEW.contrato_id, OLD.contrato_id) AND status = 'aprovada')
  WHERE id = COALESCE(NEW.contrato_id, OLD.contrato_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;


--
-- Name: atualizar_tipo_servidor(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.atualizar_tipo_servidor() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Atualizar o tipo_servidor no registro do servidor baseado no vínculo
  UPDATE public.servidores
  SET tipo_servidor = NEW.tipo_vinculo::text::tipo_servidor
  WHERE id = NEW.servidor_id;
  
  RETURN NEW;
END;
$$;


--
-- Name: audit_permission_changes(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.audit_permission_changes() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.audit_logs (
    action,
    entity_type,
    entity_id,
    before_data,
    after_data,
    user_id,
    description
  )
  VALUES (
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'create'
      WHEN TG_OP = 'UPDATE' THEN 'update'
      WHEN TG_OP = 'DELETE' THEN 'delete'
    END::audit_action,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id)::uuid,  -- Cast explícito para UUID
    CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) END,
    auth.uid(),
    'Alteração em ' || TG_TABLE_NAME
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


--
-- Name: bloquear_alteracao_ficha_fechada(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.bloquear_alteracao_ficha_fechada() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Verificar se a folha (de destino OU de origem) está fechada
  IF public.folha_esta_bloqueada(NEW.folha_id) OR public.folha_esta_bloqueada(OLD.folha_id) THEN
    -- Permitir apenas para super_admin
    IF NOT public.usuario_eh_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Folha fechada: não é possível alterar fichas financeiras' USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: bloquear_alteracao_item_ficha_fechada(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.bloquear_alteracao_item_ficha_fechada() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_folha_id UUID;
  v_folha_origem_id UUID;
BEGIN
  -- Buscar folha_id via ficha (destino no UPDATE, a própria no DELETE)
  SELECT folha_id INTO v_folha_id
  FROM public.fichas_financeiras
  WHERE id = COALESCE(NEW.ficha_id, OLD.ficha_id);

  -- No UPDATE que troca a ficha, a folha da ficha de ORIGEM também conta
  IF TG_OP = 'UPDATE' AND NEW.ficha_id IS DISTINCT FROM OLD.ficha_id THEN
    SELECT folha_id INTO v_folha_origem_id FROM public.fichas_financeiras WHERE id = OLD.ficha_id;
  END IF;

  IF public.folha_esta_bloqueada(v_folha_id) OR public.folha_esta_bloqueada(v_folha_origem_id) THEN
    IF NOT public.usuario_eh_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Folha fechada: não é possível alterar itens de fichas financeiras' USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;


--
-- Name: bloquear_exclusao_ficha_fechada(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.bloquear_exclusao_ficha_fechada() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF public.folha_esta_bloqueada(OLD.folha_id) THEN
    IF NOT public.usuario_eh_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Folha fechada: não é possível excluir fichas financeiras';
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$;


--
-- Name: bloquear_insercao_ficha_fechada(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.bloquear_insercao_ficha_fechada() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF public.folha_esta_bloqueada(NEW.folha_id) AND NOT public.usuario_eh_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Folha fechada: não é possível incluir fichas financeiras' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: bloquear_insercao_item_ficha_fechada(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.bloquear_insercao_item_ficha_fechada() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_folha_id uuid;
BEGIN
  -- a folha vem pela ficha
  SELECT folha_id INTO v_folha_id FROM public.fichas_financeiras WHERE id = NEW.ficha_id;
  IF public.folha_esta_bloqueada(v_folha_id) AND NOT public.usuario_eh_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Folha fechada: não é possível incluir itens de fichas financeiras' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: calcular_horas_trabalhadas(timestamp with time zone, timestamp with time zone, timestamp with time zone, timestamp with time zone, timestamp with time zone, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calcular_horas_trabalhadas(p_entrada1 timestamp with time zone, p_saida1 timestamp with time zone, p_entrada2 timestamp with time zone, p_saida2 timestamp with time zone, p_entrada3 timestamp with time zone DEFAULT NULL::timestamp with time zone, p_saida3 timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS numeric
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  total_minutos INTEGER := 0;
BEGIN
  -- Período 1
  IF p_entrada1 IS NOT NULL AND p_saida1 IS NOT NULL THEN
    total_minutos := total_minutos + EXTRACT(EPOCH FROM (p_saida1 - p_entrada1)) / 60;
  END IF;
  
  -- Período 2
  IF p_entrada2 IS NOT NULL AND p_saida2 IS NOT NULL THEN
    total_minutos := total_minutos + EXTRACT(EPOCH FROM (p_saida2 - p_entrada2)) / 60;
  END IF;
  
  -- Período 3
  IF p_entrada3 IS NOT NULL AND p_saida3 IS NOT NULL THEN
    total_minutos := total_minutos + EXTRACT(EPOCH FROM (p_saida3 - p_entrada3)) / 60;
  END IF;
  
  RETURN ROUND(total_minutos / 60.0, 2);
END;
$$;


--
-- Name: calcular_inss_servidor(numeric, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calcular_inss_servidor(p_base_inss numeric, p_vigencia date DEFAULT CURRENT_DATE) RETURNS numeric
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_inss_total DECIMAL := 0;
  v_base_restante DECIMAL;
  v_teto_inss DECIMAL;
  v_faixa_anterior DECIMAL := 0;
  v_valor_faixa DECIMAL;
  r RECORD;
BEGIN
  SELECT valor INTO v_teto_inss
  FROM parametros_folha
  WHERE tipo_parametro = 'teto_inss'
    AND vigencia_inicio <= p_vigencia
    AND (vigencia_fim IS NULL OR vigencia_fim >= p_vigencia)
  ORDER BY vigencia_inicio DESC LIMIT 1;
  
  v_base_restante := CASE 
    WHEN v_teto_inss IS NOT NULL THEN LEAST(p_base_inss, v_teto_inss)
    ELSE p_base_inss
  END;
  
  IF v_base_restante <= 0 THEN
    RETURN 0;
  END IF;
  
  FOR r IN (
    SELECT * FROM tabela_inss
    WHERE vigencia_inicio <= p_vigencia
      AND (vigencia_fim IS NULL OR vigencia_fim >= p_vigencia)
    ORDER BY faixa_ordem
  ) LOOP
    IF v_base_restante > r.valor_minimo THEN
      IF r.valor_maximo IS NULL OR v_base_restante <= r.valor_maximo THEN
        v_valor_faixa := v_base_restante - GREATEST(r.valor_minimo, v_faixa_anterior);
      ELSE
        v_valor_faixa := r.valor_maximo - GREATEST(r.valor_minimo, v_faixa_anterior);
      END IF;
      
      IF v_valor_faixa > 0 THEN
        v_inss_total := v_inss_total + (v_valor_faixa * r.aliquota);
      END IF;
      
      v_faixa_anterior := COALESCE(r.valor_maximo, v_base_restante);
    END IF;
  END LOOP;
  
  RETURN ROUND(v_inss_total, 2);
END;
$$;


--
-- Name: calcular_irrf(numeric, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calcular_irrf(p_base_irrf numeric, p_vigencia date DEFAULT CURRENT_DATE) RETURNS numeric
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_irrf DECIMAL := 0;
  r RECORD;
BEGIN
  IF p_base_irrf <= 0 THEN
    RETURN 0;
  END IF;
  
  SELECT * INTO r
  FROM tabela_irrf
  WHERE vigencia_inicio <= p_vigencia
    AND (vigencia_fim IS NULL OR vigencia_fim >= p_vigencia)
    AND p_base_irrf > valor_minimo
    AND (valor_maximo IS NULL OR p_base_irrf <= valor_maximo)
  ORDER BY faixa_ordem DESC LIMIT 1;
  
  IF FOUND THEN
    v_irrf := (p_base_irrf * r.aliquota) - r.parcela_deduzir;
  END IF;
  
  RETURN GREATEST(ROUND(v_irrf, 2), 0);
END;
$$;


--
-- Name: calcular_prazo_lai(date, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calcular_prazo_lai(p_data_inicio date, p_tipo_prazo character varying DEFAULT 'resposta_inicial'::character varying) RETURNS date
    LANGUAGE plpgsql STABLE
    SET search_path TO 'public'
    AS $$
DECLARE
  v_prazo_dias INTEGER;
  v_dias_uteis BOOLEAN;
  v_data_fim DATE;
  v_contador INTEGER := 0;
  v_dias_adicionados INTEGER := 0;
BEGIN
  -- Buscar configuração do prazo
  SELECT prazo_dias, dias_uteis 
  INTO v_prazo_dias, v_dias_uteis
  FROM public.prazos_lai
  WHERE tipo_prazo = p_tipo_prazo AND ativo = true
  LIMIT 1;
  
  IF v_prazo_dias IS NULL THEN
    -- Fallback: 20 dias úteis (padrão LAI)
    v_prazo_dias := 20;
    v_dias_uteis := true;
  END IF;
  
  v_data_fim := p_data_inicio;
  
  IF v_dias_uteis THEN
    -- Contar apenas dias úteis (excluindo sábados e domingos)
    WHILE v_dias_adicionados < v_prazo_dias LOOP
      v_data_fim := v_data_fim + INTERVAL '1 day';
      -- Verificar se é dia útil (1=segunda a 5=sexta)
      IF EXTRACT(DOW FROM v_data_fim) NOT IN (0, 6) THEN
        -- Verificar se não é feriado (usando tabela dias_nao_uteis se existir)
        IF NOT EXISTS (
          SELECT 1 FROM public.dias_nao_uteis 
          WHERE data = v_data_fim AND ativo = true
        ) THEN
          v_dias_adicionados := v_dias_adicionados + 1;
        END IF;
      END IF;
      
      -- Segurança: máximo 100 iterações
      v_contador := v_contador + 1;
      IF v_contador > 100 THEN EXIT; END IF;
    END LOOP;
  ELSE
    v_data_fim := p_data_inicio + (v_prazo_dias || ' days')::INTERVAL;
  END IF;
  
  RETURN v_data_fim;
END;
$$;


--
-- Name: can_access_module(public.app_module); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_access_module(_module public.app_module) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT public.can_access_module(auth.uid(), _module::text);
$$;


--
-- Name: can_access_module(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_access_module(_user_id uuid, _module text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT 
    COALESCE((SELECT is_active FROM public.profiles WHERE id = _user_id), false)
    AND (
      EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin')
      OR EXISTS (SELECT 1 FROM public.user_modules WHERE user_id = _user_id AND module::text = _module)
    );
$$;


--
-- Name: can_approve(uuid, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_approve(_user_id uuid, _module_name character varying DEFAULT NULL::character varying) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT 
    public.has_role(_user_id, 'admin'::app_role)
    OR public.has_permission(_user_id, 'requests.approve'::app_permission)
    OR EXISTS (
      SELECT 1 FROM public.approval_delegations
      WHERE delegate_id = _user_id
        AND is_active = true
        AND NOW() BETWEEN valid_from AND valid_until
        AND (module_name IS NULL OR approval_delegations.module_name = _module_name)
    )
$$;


--
-- Name: can_manage_cms(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_manage_cms() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM public.user_modules WHERE user_id = auth.uid() AND module = 'comunicacao'
  )
$$;


--
-- Name: can_view_audit(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_view_audit(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT 
    public.has_permission(_user_id, 'audit.view'::app_permission)
    OR public.is_admin_user(_user_id)
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = 'controle_interno'
    )
$$;


--
-- Name: can_view_indicacao(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_view_indicacao(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role IN ('admin', 'ti_admin', 'presidencia')
  )
$$;


--
-- Name: cancelar_remessa(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cancelar_remessa(p_remessa_id uuid, p_motivo text) RETURNS TABLE(id uuid, numero_remessa integer, status text, cancelada_em timestamp with time zone, cancelada_por uuid, motivo_cancelamento text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_motivo text := btrim(coalesce(p_motivo, ''));
  v_status text;
BEGIN
  IF v_uid IS NULL OR NOT coalesce(public.can_access_module(v_uid, 'rh')
                                    AND public.has_permission_code(v_uid, 'financeiro.folha.processar'), false) THEN
    RAISE EXCEPTION 'cancelar_remessa: exige o módulo rh e a permissão financeiro.folha.processar' USING ERRCODE = '42501';
  END IF;
  IF length(v_motivo) < 5 OR length(v_motivo) > 1000 THEN
    RAISE EXCEPTION 'cancelar_remessa: motivo obrigatório (de 5 a 1000 caracteres)' USING ERRCODE = '22023';
  END IF;
  SELECT x.status INTO v_status FROM public.remessas_bancarias x WHERE x.id = p_remessa_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'cancelar_remessa: remessa não encontrada' USING ERRCODE = 'P0002';
  END IF;
  IF v_status = 'cancelada' THEN
    RAISE EXCEPTION 'cancelar_remessa: a remessa já está cancelada' USING ERRCODE = 'RHE03';
  END IF;
  IF v_status = 'processada' THEN
    RAISE EXCEPTION 'cancelar_remessa: remessa processada pelo banco não se cancela' USING ERRCODE = 'RHE03';
  END IF;
  PERFORM set_config('remessa.cancelar', p_remessa_id::text, true);
  UPDATE public.remessas_bancarias AS x
     SET status = 'cancelada', cancelada_em = now(), cancelada_por = v_uid, motivo_cancelamento = v_motivo
   WHERE x.id = p_remessa_id;
  PERFORM set_config('remessa.cancelar', '', true);
  RETURN QUERY
    SELECT x.id, x.numero_remessa, x.status::text, x.cancelada_em, x.cancelada_por, x.motivo_cancelamento
      FROM public.remessas_bancarias x WHERE x.id = p_remessa_id;
END;
$$;


--
-- Name: FUNCTION cancelar_remessa(p_remessa_id uuid, p_motivo text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.cancelar_remessa(p_remessa_id uuid, p_motivo text) IS 'Cancela a remessa CNAB (status cancelada, cancelada_em/por, motivo). Exige módulo rh e financeiro.folha.processar';


--
-- Name: cancelar_remessa_bancaria(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cancelar_remessa_bancaria(p_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_rem public.fin_remessas_bancarias%ROWTYPE;
  v_liberados integer := 0;
BEGIN
  IF v_uid IS NULL
     OR NOT COALESCE(public.perfil_ativo_atual()
                     AND public.can_access_module(v_uid, 'financeiro')
                     AND public.has_permission_code(v_uid, 'pagamento.conciliar'), false) THEN
    RAISE EXCEPTION 'Sem permissão para cancelar remessa bancária (pagamento.conciliar).' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_rem FROM public.fin_remessas_bancarias WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Remessa não encontrada.' USING ERRCODE = 'P0002';
  END IF;
  IF v_rem.arquivo_sha256 IS NOT NULL THEN
    RAISE EXCEPTION 'A remessa NSA % já foi confirmada (arquivo gerado): não pode ser cancelada.', v_rem.nsa
      USING ERRCODE = '22023';
  END IF;
  IF v_rem.created_by IS DISTINCT FROM v_uid AND NOT COALESCE(public.is_admin_user(v_uid), false) THEN
    RAISE EXCEPTION 'Só quem reservou a remessa NSA % (ou um administrador) cancela.', v_rem.nsa USING ERRCODE = '42501';
  END IF;

  UPDATE public.fin_movimentos_bancarios
     SET remessa_id = NULL, updated_at = now()
   WHERE remessa_id = p_id AND reenviado_em IS NULL;
  GET DIAGNOSTICS v_liberados = ROW_COUNT;

  DELETE FROM public.fin_remessas_bancarias WHERE id = p_id;

  RETURN jsonb_build_object('id', p_id, 'nsa', v_rem.nsa, 'movimentos_liberados', v_liberados);
END;
$$;


--
-- Name: FUNCTION cancelar_remessa_bancaria(p_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.cancelar_remessa_bancaria(p_id uuid) IS 'Cancela (apaga) uma reserva de remessa de reenvio não confirmada e libera os movimentos. Autor da reserva ou administrador; exige pagamento.conciliar.';


--
-- Name: comissoes_membros_validar(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.comissoes_membros_validar() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_criador uuid;
  v_meu uuid;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.servidor_id IS NOT DISTINCT FROM OLD.servidor_id
     AND NEW.comissao_id IS NOT DISTINCT FROM OLD.comissao_id THEN
    RETURN NEW;
  END IF;
  SELECT co.created_by_servidor_id INTO v_criador FROM public.comissoes co WHERE co.id = NEW.comissao_id;
  IF v_criador IS NOT NULL AND NEW.servidor_id = v_criador THEN
    RAISE EXCEPTION 'Quem cadastrou a comissão não pode ser membro dela' USING ERRCODE = '42501';
  END IF;
  IF v_uid IS NOT NULL AND NOT public.is_admin_user(v_uid) THEN
    SELECT p.servidor_id INTO v_meu FROM public.profiles p WHERE p.id = v_uid;
    IF v_meu IS NOT NULL AND NEW.servidor_id = v_meu THEN
      RAISE EXCEPTION 'Você não pode se incluir numa comissão' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: conciliar_movimento_bancario(uuid, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.conciliar_movimento_bancario(p_movimento_id uuid, p_pagamento_id uuid, p_justificativa text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_mov public.fin_movimentos_bancarios%ROWTYPE;
  v_pag public.fin_pagamentos%ROWTYPE;
  v_just text := NULLIF(btrim(COALESCE(p_justificativa, '')), '');
  v_confere boolean;
  v_outro text;
  v_marcado text;
BEGIN
  IF v_uid IS NULL
     OR NOT COALESCE(public.perfil_ativo_atual()
                     AND public.can_access_module(v_uid, 'financeiro')
                     AND public.has_permission_code(v_uid, 'pagamento.conciliar'), false) THEN
    RAISE EXCEPTION 'Sem permissão para conciliar pagamentos (pagamento.conciliar).' USING ERRCODE = '42501';
  END IF;
  IF char_length(COALESCE(v_just, '')) > 500 THEN
    RAISE EXCEPTION 'Justificativa com mais de 500 caracteres.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_mov FROM public.fin_movimentos_bancarios WHERE id = p_movimento_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Movimento bancário não encontrado.' USING ERRCODE = 'P0002';
  END IF;

  IF p_pagamento_id IS NULL THEN
    UPDATE public.fin_movimentos_bancarios
       SET pagamento_id = NULL, conciliado_em = NULL, conciliado_por = NULL,
           conciliacao_justificativa = NULL, updated_at = now()
     WHERE id = p_movimento_id;
    RETURN jsonb_build_object('movimento_id', p_movimento_id, 'pagamento_id', NULL,
                              'desvinculado_de', v_mov.pagamento_id, 'status_revertido', false);
  END IF;

  IF v_mov.pagamento_id IS NOT NULL AND v_mov.pagamento_id <> p_pagamento_id THEN
    RAISE EXCEPTION 'O movimento já está vinculado a outro pagamento: desvincule antes de vincular de novo.'
      USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_pag FROM public.fin_pagamentos WHERE id = p_pagamento_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pagamento não encontrado.' USING ERRCODE = 'P0002';
  END IF;

  SELECT m.identificador INTO v_outro
    FROM public.fin_movimentos_bancarios m
   WHERE m.pagamento_id = p_pagamento_id AND m.id <> p_movimento_id AND m.situacao = 'pago'
   LIMIT 1;
  IF FOUND THEN
    RAISE EXCEPTION 'O pagamento % já tem outro movimento pago vinculado (%).', v_pag.numero, v_outro
      USING ERRCODE = '22023';
  END IF;

  v_confere := v_pag.valor_liquido IS NOT DISTINCT FROM v_mov.valor;
  IF NOT v_confere AND v_just IS NULL THEN
    RAISE EXCEPTION 'O valor do movimento (%) não confere com o líquido do pagamento % (%): informe a justificativa.',
      v_mov.valor, v_pag.numero, v_pag.valor_liquido USING ERRCODE = '22023';
  END IF;

  UPDATE public.fin_movimentos_bancarios
     SET pagamento_id = p_pagamento_id, conciliado_em = now(), conciliado_por = v_uid,
         conciliacao_justificativa = CASE WHEN v_confere THEN NULL ELSE v_just END,
         updated_at = now()
   WHERE id = p_movimento_id;

  IF v_mov.situacao = 'pago' THEN
    v_marcado := public.fin_marcar_pagamento_pago(p_pagamento_id, COALESCE(v_mov.data_efetivacao, v_mov.data_pagamento));
  END IF;

  RETURN jsonb_build_object(
    'movimento_id', p_movimento_id,
    'pagamento_id', p_pagamento_id,
    'pagamento_numero', v_pag.numero,
    'pagamento_marcado_pago', v_marcado IS NOT NULL,
    'valor_confere', v_confere
  );
END;
$$;


--
-- Name: FUNCTION conciliar_movimento_bancario(p_movimento_id uuid, p_pagamento_id uuid, p_justificativa text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.conciliar_movimento_bancario(p_movimento_id uuid, p_pagamento_id uuid, p_justificativa text) IS 'Vincula manualmente um movimento bancário a um pagamento (NULL desfaz, sem reverter o status do pagamento). Recusa troca direta de pagamento e pagamento com outro movimento pago; valor diferente exige justificativa. Movimento pago marca o pagamento como pago. Exige pagamento.conciliar.';


--
-- Name: config_envio_servidor(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.config_envio_servidor(p_canal text) RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_cfg public.config_envio%ROWTYPE;
  v_segredo text;
BEGIN
  SELECT * INTO v_cfg FROM public.config_envio WHERE canal = p_canal;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  IF v_cfg.segredo_id IS NOT NULL THEN
    SELECT d.decrypted_secret INTO v_segredo FROM vault.decrypted_secrets d WHERE d.id = v_cfg.segredo_id;
  END IF;
  RETURN (to_jsonb(v_cfg) - 'segredo_id') || jsonb_build_object('segredo', v_segredo);
END;
$$;


--
-- Name: confirmar_alteracao_fiplan(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.confirmar_alteracao_fiplan(p_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_alt public.fin_alteracoes_orcamentarias%ROWTYPE;
  v_ja boolean;
BEGIN
  IF v_uid IS NULL
     OR NOT COALESCE(public.perfil_ativo_atual()
                     AND public.can_access_module(v_uid, 'financeiro')
                     AND public.has_permission_code(v_uid, 'orcamento.aprovar'), false) THEN
    RAISE EXCEPTION 'Sem permissão para confirmar alteração no FIPLAN (orcamento.aprovar).' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_alt FROM public.fin_alteracoes_orcamentarias WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Alteração orçamentária não encontrada.' USING ERRCODE = 'P0002';
  END IF;
  IF v_alt.status IN ('cancelado', 'rejeitado') THEN
    RAISE EXCEPTION 'Alteração % está %: não pode ser confirmada no FIPLAN.', v_alt.numero, v_alt.status
      USING ERRCODE = '22023';
  END IF;

  v_ja := v_alt.situacao_fiplan = 'confirmada';
  IF NOT v_ja THEN
    UPDATE public.fin_alteracoes_orcamentarias
       SET situacao_fiplan = 'confirmada',
           confirmado_fiplan_em = now(),
           confirmado_fiplan_por = v_uid,
           updated_at = now()
     WHERE id = p_id
     RETURNING * INTO v_alt;
  END IF;

  RETURN jsonb_build_object(
    'id', v_alt.id,
    'situacao_fiplan', v_alt.situacao_fiplan,
    'confirmado_fiplan_em', v_alt.confirmado_fiplan_em,
    'confirmado_fiplan_por', v_alt.confirmado_fiplan_por,
    'ja_confirmada', v_ja
  );
END;
$$;


--
-- Name: FUNCTION confirmar_alteracao_fiplan(p_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.confirmar_alteracao_fiplan(p_id uuid) IS 'Marca a alteração orçamentária como confirmada no FIPLAN (data e autor). Exige o módulo financeiro e orcamento.aprovar.';


--
-- Name: confirmar_remessa_bancaria(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.confirmar_remessa_bancaria(p_id uuid, p_sha256 text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  v_uid uuid := auth.uid();
  v_rem public.fin_remessas_bancarias%ROWTYPE;
  v_ok integer;
  v_marcados integer := 0;
BEGIN
  IF v_uid IS NULL
     OR NOT COALESCE(public.perfil_ativo_atual()
                     AND public.can_access_module(v_uid, 'financeiro')
                     AND public.has_permission_code(v_uid, 'pagamento.conciliar'), false) THEN
    RAISE EXCEPTION 'Sem permissão para confirmar remessa bancária (pagamento.conciliar).' USING ERRCODE = '42501';
  END IF;
  IF COALESCE(p_sha256, '') !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'Hash do arquivo inválido.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_rem FROM public.fin_remessas_bancarias WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Remessa não encontrada.' USING ERRCODE = 'P0002';
  END IF;
  IF v_rem.arquivo_sha256 IS NOT NULL THEN
    IF v_rem.arquivo_sha256 <> p_sha256 THEN
      RAISE EXCEPTION 'A remessa NSA % já foi confirmada com outro arquivo.', v_rem.nsa USING ERRCODE = '22023';
    END IF;
    RETURN jsonb_build_object('id', v_rem.id, 'nsa', v_rem.nsa, 'arquivo_sha256', v_rem.arquivo_sha256,
                              'movimentos_marcados', 0, 'ja_confirmada', true);
  END IF;
  IF v_rem.created_by IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'Só quem gerou a remessa NSA % confirma o arquivo.', v_rem.nsa USING ERRCODE = '42501';
  END IF;

  PERFORM 1 FROM public.fin_movimentos_bancarios WHERE id = ANY (v_rem.movimentos) ORDER BY id FOR UPDATE;
  SELECT count(*) INTO v_ok
    FROM public.fin_movimentos_bancarios
   WHERE id = ANY (v_rem.movimentos) AND remessa_id = p_id AND reenviado_em IS NULL AND situacao = 'recusado';
  IF v_ok <> cardinality(v_rem.movimentos) THEN
    RAISE EXCEPTION '% movimento(s) da remessa NSA % não estão mais reservados para ela (ou deixaram de estar recusados): gere de novo.',
      cardinality(v_rem.movimentos) - v_ok, v_rem.nsa USING ERRCODE = '22023';
  END IF;

  UPDATE public.fin_remessas_bancarias SET arquivo_sha256 = p_sha256 WHERE id = p_id;

  UPDATE public.fin_movimentos_bancarios
     SET reenviado_em = now(), updated_at = now()
   WHERE id = ANY (v_rem.movimentos) AND remessa_id = p_id AND reenviado_em IS NULL;
  GET DIAGNOSTICS v_marcados = ROW_COUNT;

  RETURN jsonb_build_object('id', v_rem.id, 'nsa', v_rem.nsa, 'arquivo_sha256', p_sha256,
                            'movimentos_marcados', v_marcados, 'ja_confirmada', false);
END;
$_$;


--
-- Name: FUNCTION confirmar_remessa_bancaria(p_id uuid, p_sha256 text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.confirmar_remessa_bancaria(p_id uuid, p_sha256 text) IS 'Grava o SHA-256 do arquivo de reenvio gerado e marca os movimentos reservados como reenviados (falha se algum saiu da reserva). Só o autor da reserva. Exige pagamento.conciliar.';


--
-- Name: consultar_gestor_por_cpf(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.consultar_gestor_por_cpf(p_cpf text) RETURNS jsonb
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT jsonb_build_object(
           'id', g.id, 'nome', g.nome, 'status', g.status,
           'escola', jsonb_build_object('id', e.id, 'nome', e.nome))
  FROM public.gestores_escolares g
  LEFT JOIN public.escolas_jer e ON e.id = g.escola_id
  WHERE length(regexp_replace(coalesce(p_cpf, ''), '\D', '', 'g')) = 11
    AND regexp_replace(coalesce(g.cpf, ''), '\D', '', 'g') = regexp_replace(p_cpf, '\D', '', 'g')
  LIMIT 1;
$$;


--
-- Name: consultar_protocolo_sic(character varying, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.consultar_protocolo_sic(p_protocolo character varying, p_token uuid) RETURNS TABLE(protocolo character varying, data_solicitacao timestamp with time zone, status character varying, prazo_resposta date, data_resposta timestamp with time zone, resposta text, dias_restantes integer)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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


--
-- Name: consumir_cota_uso(uuid, text, integer, integer, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.consumir_cota_uso(_usuario uuid, _tipo text, _quantidade integer, _limite integer, _modulo text, _descricao text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  usado integer;
BEGIN
  IF _usuario IS NULL OR _tipo IS NULL OR coalesce(_quantidade, 0) < 1 OR coalesce(_limite, 0) < 1 THEN
    RETURN false;
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext('cota_uso:' || _tipo), hashtext(_usuario::text));
  SELECT coalesce(sum(coalesce((metadata ->> 'quantidade')::integer, 1)), 0) INTO usado
    FROM public.audit_logs
   WHERE user_id = _usuario AND entity_type = _tipo AND "timestamp" >= now() - interval '1 hour';
  IF usado + _quantidade > _limite THEN
    RETURN false;
  END IF;
  INSERT INTO public.audit_logs (action, entity_type, user_id, module_name, description, metadata)
  VALUES ('submit', _tipo, _usuario, _modulo, _descricao, jsonb_build_object('quantidade', _quantidade));
  RETURN true;
END;
$$;


--
-- Name: corrigir_conta_movimento(uuid, text, text, text, text, text, text, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.corrigir_conta_movimento(p_movimento_id uuid, p_banco text, p_agencia text, p_agencia_dv text, p_conta text, p_conta_dv text, p_justificativa text, p_validado_bb boolean DEFAULT false) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  v_uid uuid := auth.uid();
  v_mov public.fin_movimentos_bancarios%ROWTYPE;
  v_banco text := btrim(COALESCE(p_banco, ''));
  v_agencia text := btrim(COALESCE(p_agencia, ''));
  v_agencia_dv text := upper(btrim(COALESCE(p_agencia_dv, '')));
  v_conta text := btrim(COALESCE(p_conta, ''));
  v_conta_dv text := upper(btrim(COALESCE(p_conta_dv, '')));
  v_just text := btrim(COALESCE(p_justificativa, ''));
  v_validado boolean := COALESCE(p_validado_bb, false);
  v_corrigida jsonb;
  v_agora timestamptz := now();
BEGIN
  IF v_uid IS NULL
     OR NOT COALESCE(public.perfil_ativo_atual()
                     AND public.can_access_module(v_uid, 'financeiro')
                     AND public.has_permission_code(v_uid, 'pagamento.conciliar'), false) THEN
    RAISE EXCEPTION 'Sem permissão para corrigir a conta do pagamento (pagamento.conciliar).' USING ERRCODE = '42501';
  END IF;

  IF v_banco !~ '^\d{3}$' OR v_agencia !~ '^\d{1,5}$' OR v_agencia_dv !~ '^[0-9X]?$'
     OR v_conta !~ '^\d{1,12}$' OR v_conta_dv !~ '^[0-9X]?$' THEN
    RAISE EXCEPTION 'Banco (3 dígitos), agência (até 5 dígitos), conta (até 12 dígitos) ou dígitos (1 posição) inválidos.'
      USING ERRCODE = '22023';
  END IF;
  IF v_just = '' OR char_length(v_just) > 500 THEN
    RAISE EXCEPTION 'Informe a justificativa da correção (até 500 caracteres).' USING ERRCODE = '22023';
  END IF;
  IF v_banco = '001' AND NOT v_validado AND char_length(v_just) < 15 THEN
    RAISE EXCEPTION 'Conta do Banco do Brasil não validada na API: detalhe a justificativa (mínimo de 15 caracteres).'
      USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_mov FROM public.fin_movimentos_bancarios WHERE id = p_movimento_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Movimento bancário não encontrado.' USING ERRCODE = 'P0002';
  END IF;
  IF v_mov.situacao <> 'recusado' THEN
    RAISE EXCEPTION 'Só pagamento recusado tem a conta corrigida para reenvio.' USING ERRCODE = '22023';
  END IF;
  IF v_mov.tipo_lancamento = 'fatura' OR v_mov.codigo_barras IS NOT NULL THEN
    RAISE EXCEPTION 'Fatura/guia (código de barras) não tem conta de destino.' USING ERRCODE = '22023';
  END IF;
  IF v_mov.reenviado_em IS NOT NULL THEN
    RAISE EXCEPTION 'O pagamento já foi reenviado: a conta não muda mais.' USING ERRCODE = '22023';
  END IF;
  IF v_mov.remessa_id IS NOT NULL THEN
    RAISE EXCEPTION 'O pagamento está reservado numa remessa de reenvio não confirmada: cancele a reserva antes de corrigir.'
      USING ERRCODE = '22023';
  END IF;

  v_corrigida := jsonb_build_object(
    'banco', v_banco, 'agencia', v_agencia, 'agencia_dv', v_agencia_dv,
    'conta', v_conta, 'conta_dv', v_conta_dv,
    'validado_bb', v_validado, 'justificativa', v_just);

  UPDATE public.fin_movimentos_bancarios
     SET conta_corrigida = v_corrigida, corrigido_por = v_uid, corrigido_em = v_agora, updated_at = v_agora
   WHERE id = p_movimento_id;

  RETURN jsonb_build_object('movimento_id', p_movimento_id, 'conta_corrigida', v_corrigida,
                            'corrigido_por', v_uid, 'corrigido_em', v_agora);
END;
$_$;


--
-- Name: FUNCTION corrigir_conta_movimento(p_movimento_id uuid, p_banco text, p_agencia text, p_agencia_dv text, p_conta text, p_conta_dv text, p_justificativa text, p_validado_bb boolean); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.corrigir_conta_movimento(p_movimento_id uuid, p_banco text, p_agencia text, p_agencia_dv text, p_conta text, p_conta_dv text, p_justificativa text, p_validado_bb boolean) IS 'Registra a conta de destino corrigida de um pagamento recusado (antes do reenvio), com justificativa. Exige pagamento.conciliar.';


--
-- Name: count_dependentes_irrf(uuid, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.count_dependentes_irrf(p_servidor_id uuid, p_data date DEFAULT CURRENT_DATE) RETURNS integer
    LANGUAGE plpgsql STABLE
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN COALESCE((
    SELECT COUNT(*)::INTEGER
    FROM dependentes_irrf
    WHERE servidor_id = p_servidor_id
      AND ativo = true
      AND deduz_irrf = true
      AND data_inicio_deducao <= p_data
      AND (data_fim_deducao IS NULL OR data_fim_deducao >= p_data)
  ), 0);
END;
$$;


--
-- Name: data_local(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.data_local() RETURNS date
    LANGUAGE plpgsql STABLE
    SET search_path TO 'public'
    AS $$
DECLARE
  v_fuso text := nullif(btrim(current_setting('app.fuso_horario', true)), '');
BEGIN
  IF v_fuso IS NOT NULL THEN
    BEGIN
      RETURN (now() AT TIME ZONE v_fuso)::date;
    EXCEPTION WHEN invalid_parameter_value THEN
      NULL;   -- fuso inválido: cai no padrão (não derruba a gravação)
    END;
  END IF;
  RETURN (now() AT TIME ZONE 'America/Sao_Paulo')::date;
END;
$$;


--
-- Name: FUNCTION data_local(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.data_local() IS 'Data de hoje no fuso do órgão (app.fuso_horario do banco; padrão America/Sao_Paulo). Usada pela regra de setor no lugar de CURRENT_DATE';


--
-- Name: definir_prazo_lai_correto(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.definir_prazo_lai_correto() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Calcular prazo inicial de 20 dias úteis (não 30 fixos)
  IF NEW.prazo_resposta IS NULL THEN
    NEW.prazo_resposta := public.calcular_prazo_lai(CURRENT_DATE, 'resposta_inicial');
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: desmarcar_escola_cadastrada(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.desmarcar_escola_cadastrada() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  UPDATE public.escolas_jer 
  SET ja_cadastrada = false, updated_at = now()
  WHERE id = OLD.escola_id;
  RETURN OLD;
END;
$$;


--
-- Name: documentos_portaria_validar(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.documentos_portaria_validar() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_de text;
  v_para text;
  v_ok boolean;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.tipo = 'portaria' AND OLD.status::text IN ('assinado', 'aguardando_publicacao', 'publicado', 'vigente', 'revogado') THEN
      RAISE EXCEPTION 'Portaria % (%) não pode ser excluída: ato assinado ou publicado se revoga, não se apaga',
        OLD.numero, OLD.status USING ERRCODE = '42501';
    END IF;
    RETURN OLD;
  END IF;

  IF NEW.tipo IS DISTINCT FROM 'portaria' OR NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  v_de := OLD.status::text;
  v_para := NEW.status::text;
  v_ok := CASE v_de
    WHEN 'rascunho' THEN v_para IN ('minuta', 'aguardando_assinatura', 'revogado')
    WHEN 'minuta' THEN v_para IN ('aguardando_assinatura', 'revogado')
    WHEN 'aguardando_assinatura' THEN v_para IN ('assinado', 'minuta', 'revogado')
    WHEN 'assinado' THEN v_para IN ('aguardando_publicacao', 'revogado')
    WHEN 'aguardando_publicacao' THEN v_para IN ('publicado', 'assinado', 'revogado')
    WHEN 'publicado' THEN v_para IN ('vigente', 'revogado')
    WHEN 'vigente' THEN v_para IN ('revogado')
    ELSE false
  END;
  IF NOT v_ok THEN
    RAISE EXCEPTION 'Portaria %: não passa de "%" para "%" (ordem: minuta, aguardando assinatura, assinada, aguardando publicação, publicada, vigente)',
      NEW.numero, v_de, v_para USING ERRCODE = '23514';
  END IF;

  IF v_para = 'assinado' AND (NEW.assinado_por IS NULL OR btrim(NEW.assinado_por) = '' OR NEW.data_assinatura IS NULL) THEN
    RAISE EXCEPTION 'Portaria %: registre quem assinou e a data da assinatura', NEW.numero USING ERRCODE = '23514';
  END IF;
  IF v_para = 'publicado' AND (NEW.doe_numero IS NULL OR btrim(NEW.doe_numero) = '' OR NEW.doe_data IS NULL) THEN
    RAISE EXCEPTION 'Portaria %: registre o número e a data do DOE', NEW.numero USING ERRCODE = '23514';
  END IF;
  IF v_para = 'vigente' AND NEW.data_vigencia_inicio IS NULL THEN
    RAISE EXCEPTION 'Portaria %: informe a data de início da vigência', NEW.numero USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: eh_meu_arquivo_frequencia(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.eh_meu_arquivo_frequencia(_path text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT auth.uid() IS NOT NULL
     AND _path IS NOT NULL
     AND public.is_active_user()
     AND EXISTS (
       SELECT 1
         FROM public.frequencia_arquivos fa
        WHERE fa.arquivo_path = _path
          AND fa.servidor_id = public.meu_servidor_id());
$$;


--
-- Name: eh_meu_servidor(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.eh_meu_servidor(_servidor_id uuid) RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_meu uuid;
  v_cpf text;
BEGIN
  IF _servidor_id IS NULL OR auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  v_meu := public.meu_servidor_id();
  IF v_meu IS NOT NULL THEN
    RETURN _servidor_id = v_meu;
  END IF;
  SELECT regexp_replace(coalesce(p.cpf, ''), '[^0-9]', '', 'g') INTO v_cpf
    FROM public.profiles p WHERE p.id = auth.uid();
  IF coalesce(v_cpf, '') = '' THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.servidores s
     WHERE s.id = _servidor_id
       AND regexp_replace(coalesce(s.cpf, ''), '[^0-9]', '', 'g') <> ''
       AND lpad(regexp_replace(s.cpf, '[^0-9]', '', 'g'), 11, '0') = lpad(v_cpf, 11, '0'));
END;
$$;


--
-- Name: eh_minha_pasta_servidor(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.eh_minha_pasta_servidor(_name text) RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  v_pasta text;
BEGIN
  IF _name IS NULL OR auth.uid() IS NULL OR NOT public.is_active_user() THEN
    RETURN false;
  END IF;
  v_pasta := (storage.foldername(_name))[1];
  IF v_pasta IS NULL
     OR v_pasta !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN false;
  END IF;
  RETURN coalesce(v_pasta::uuid = public.meu_servidor_id(), false);
END;
$_$;


--
-- Name: encerrar_nomeacao_anterior(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.encerrar_nomeacao_anterior() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Encerrar nomeação ativa anterior para a mesma unidade
  IF NEW.status = 'ativo' THEN
    UPDATE public.nomeacoes_chefe_unidade
    SET 
      status = 'encerrado',
      data_fim = NEW.data_inicio - INTERVAL '1 day',
      updated_at = now()
    WHERE unidade_local_id = NEW.unidade_local_id
      AND status = 'ativo'
      AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: enviar_folha_conferencia(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.enviar_folha_conferencia(p_folha_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_folha RECORD;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário não autenticado');
  END IF;
  
  IF NOT public.usuario_tem_permissao(v_user_id, 'rh.admin') AND NOT public.usuario_eh_admin(v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão para enviar para conferência');
  END IF;
  
  SELECT * INTO v_folha FROM public.folhas_pagamento WHERE id = p_folha_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Folha não encontrada');
  END IF;
  
  IF v_folha.status NOT IN ('aberta', 'reaberta') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Folha deve estar aberta ou reaberta para enviar à conferência');
  END IF;
  
  PERFORM public.rh_protocolo_atual('folha', format('Envio da folha %s/%s para conferência', v_folha.competencia_mes, v_folha.competencia_ano), NULL, jsonb_build_object('folha_id', p_folha_id));

  UPDATE public.folhas_pagamento
  SET 
    status = 'processando',
    conferido_por = v_user_id,
    conferido_em = now()
  WHERE id = p_folha_id;
  
  RETURN jsonb_build_object('success', true, 'message', 'Folha enviada para conferência');
END;
$$;


--
-- Name: exigir_folha_fechada(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.exigir_folha_fechada() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_status text;
  v_ano int;
  v_mes int;
BEGIN
  IF NEW.folha_id IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT f.status::text, f.competencia_ano, f.competencia_mes INTO v_status, v_ano, v_mes
    FROM public.folhas_pagamento f WHERE f.id = NEW.folha_id
    FOR SHARE OF f;
  IF FOUND AND v_status IS DISTINCT FROM 'fechada' THEN
    RAISE EXCEPTION 'Folha %/% não está fechada (status: %): % só sai de folha fechada',
      lpad(v_mes::text, 2, '0'), v_ano, coalesce(v_status, 'sem status'),
      CASE TG_TABLE_NAME WHEN 'remessas_bancarias' THEN 'a remessa bancária' ELSE 'o evento do eSocial' END
      USING ERRCODE = 'RHE01',
            HINT = 'Feche a folha antes de gerar o arquivo (migração 20261011010000).';
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: exigir_setor(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.exigir_setor() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  f jsonb;
  v_setor text;
  v_via text;
  v_det text;
BEGIN
  IF pg_trigger_depth() > 1 AND current_setting('lancamento.cadeia', true) = 'on' THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;
  f := public.fundamento_tabela(TG_TABLE_NAME);
  IF f IS NULL OR f ->> 'modo' IS DISTINCT FROM 'exigir' OR (f ->> 'permitido') = 'true'
     OR (TG_TABLE_NAME IN ('solicitacoes_abono', 'solicitacoes_ajuste_ponto', 'justificativas_ponto',
                           'frequencia_fechamento', 'documentos_requerimento_servidor')
         AND public.fundamento_linha(TG_TABLE_NAME, TG_OP,
               CASE WHEN TG_OP <> 'DELETE' THEN to_jsonb(NEW) END,
               CASE WHEN TG_OP <> 'INSERT' THEN to_jsonb(OLD) END) IS NOT NULL) THEN
    IF pg_trigger_depth() = 1 AND current_setting('lancamento.cadeia', true) IS DISTINCT FROM 'on' THEN
      PERFORM set_config('lancamento.cadeia', 'on', true);
    END IF;
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;
  SELECT string_agg(coalesce(nome.n, x.m), ' ou ' ORDER BY x.o) INTO v_setor
    FROM jsonb_array_elements_text(f -> 'modulos') WITH ORDINALITY AS x(m, o)
    LEFT JOIN LATERAL (SELECT nullif(btrim(ms.display_name), '') AS n FROM public.module_settings ms
                        WHERE ms.module_code = x.m LIMIT 1) nome ON true;
  v_via := coalesce(f ->> 'via', 'negado_setor');
  v_det := format('via=%s; tabela=%s', v_via, TG_TABLE_NAME);
  IF v_via = 'negado_sem_servidor' THEN
    RAISE EXCEPTION 'Seu login não tem servidor vinculado: lançamento no setor de % recusado', v_setor
      USING ERRCODE = 'RHS01', DETAIL = v_det,
            HINT = 'Sem servidor vinculado, o login só consulta. Peça ao administrador o vínculo do seu servidor ao login.';
  ELSIF v_via = 'negado_sem_login' THEN
    RAISE EXCEPTION 'Sessão sem usuário identificado: lançamento no setor de % recusado', v_setor
      USING ERRCODE = 'RHS01', DETAIL = v_det, HINT = 'Entre de novo no sistema.';
  END IF;
  RAISE EXCEPTION 'Você não está lotado nem designado no setor de %: lançamento recusado', v_setor
    USING ERRCODE = 'RHS01', DETAIL = v_det,
          HINT = 'Vale a lotação ativa no setor (não lançada por você) ou a designação aprovada por outra pessoa, vigente e com ato.';
END;
$$;


--
-- Name: exigir_setor_fim(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.exigir_setor_fim() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  IF pg_trigger_depth() = 1 AND current_setting('lancamento.cadeia', true) = 'on' THEN
    PERFORM set_config('lancamento.cadeia', '', true);
  END IF;
  RETURN NULL;
END;
$$;


--
-- Name: fechar_folha(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fechar_folha(p_folha_id uuid, p_justificativa text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_folha RECORD;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- Verificar autenticação
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário não autenticado');
  END IF;
  
  -- Verificar permissão
  IF NOT public.usuario_pode_fechar_folha(v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão para fechar folha');
  END IF;
  
  -- Buscar folha
  SELECT * INTO v_folha FROM public.folhas_pagamento WHERE id = p_folha_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Folha não encontrada');
  END IF;
  
  -- Verificar status atual
  IF v_folha.status = 'fechada' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Folha já está fechada');
  END IF;
  
  IF v_folha.status NOT IN ('processando', 'aberta') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Folha deve estar em conferência ou aberta para ser fechada');
  END IF;
  
  PERFORM public.rh_protocolo_atual('folha', format('Fechamento da folha %s/%s', v_folha.competencia_mes, v_folha.competencia_ano), NULL, jsonb_build_object('folha_id', p_folha_id, 'justificativa', p_justificativa));

  -- Atualizar para fechada
  UPDATE public.folhas_pagamento
  SET 
    status = 'fechada',
    fechado_por = v_user_id,
    fechado_em = now(),
    justificativa_fechamento = p_justificativa,
    data_fechamento = now()
  WHERE id = p_folha_id;
  
  -- Registrar no audit_log
  INSERT INTO public.audit_logs (
    action, entity_type, entity_id, module_name, description, user_id
  ) VALUES (
    'update', 'folhas_pagamento', p_folha_id, 'rh',
    format('Folha %s/%s fechada. Justificativa: %s', v_folha.competencia_mes, v_folha.competencia_ano, COALESCE(p_justificativa, 'Sem justificativa')),
    v_user_id
  );
  
  RETURN jsonb_build_object('success', true, 'message', 'Folha fechada com sucesso');
END;
$$;


--
-- Name: fin_alteracoes_bloquear_exclusao_confirmada(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fin_alteracoes_bloquear_exclusao_confirmada() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') AND OLD.situacao_fiplan = 'confirmada' THEN
    RAISE EXCEPTION 'Alteração % já confirmada no FIPLAN: não pode ser excluída.', OLD.numero USING ERRCODE = '42501';
  END IF;
  RETURN OLD;
END;
$$;


--
-- Name: FUNCTION fin_alteracoes_bloquear_exclusao_confirmada(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fin_alteracoes_bloquear_exclusao_confirmada() IS 'Trigger: alteração orçamentária confirmada no FIPLAN não é excluída pela API (anon/authenticated, admin inclusive).';


--
-- Name: fin_alteracoes_proteger_situacao_fiplan(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fin_alteracoes_proteger_situacao_fiplan() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.situacao_fiplan := 'pendente';
      NEW.confirmado_fiplan_em := NULL;
      NEW.confirmado_fiplan_por := NULL;
    ELSIF NEW.situacao_fiplan IS DISTINCT FROM OLD.situacao_fiplan
       OR NEW.confirmado_fiplan_em IS DISTINCT FROM OLD.confirmado_fiplan_em
       OR NEW.confirmado_fiplan_por IS DISTINCT FROM OLD.confirmado_fiplan_por THEN
      RAISE EXCEPTION 'A situação no FIPLAN só muda pela ação "Confirmar no FIPLAN".' USING ERRCODE = '42501';
    ELSIF OLD.situacao_fiplan = 'confirmada'
      AND (NEW.valor IS DISTINCT FROM OLD.valor
           OR NEW.dotacao_origem_id IS DISTINCT FROM OLD.dotacao_origem_id
           OR NEW.dotacao_destino_id IS DISTINCT FROM OLD.dotacao_destino_id
           OR NEW.tipo IS DISTINCT FROM OLD.tipo
           OR NEW.exercicio IS DISTINCT FROM OLD.exercicio
           OR NEW.status IS DISTINCT FROM OLD.status) THEN
      RAISE EXCEPTION 'Alteração % já confirmada no FIPLAN: valor, dotações, tipo, exercício e status não mudam.', OLD.numero
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: fin_casar_movimento_pagamento(text, text, numeric, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fin_casar_movimento_pagamento(p_identificador text, p_documento text, p_valor numeric, p_data date) RETURNS uuid
    LANGUAGE plpgsql STABLE
    SET search_path TO 'public'
    AS $$
DECLARE
  v_doc text := NULLIF(ltrim(COALESCE(p_documento, ''), '0'), '');
  v_ident text := NULLIF(btrim(COALESCE(p_identificador, '')), '');
  v_pag uuid;
  v_ids uuid[];
  v_pontos integer[];
BEGIN
  IF v_ident IS NOT NULL THEN
    -- a) seu número de um crédito de remessa de reenvio confirmada
    SELECT m.pagamento_id INTO v_pag
      FROM public.fin_remessas_bancarias r
      CROSS JOIN LATERAL jsonb_array_elements(r.creditos) AS c(cred)
      JOIN public.fin_movimentos_bancarios m ON m.id = (c.cred->>'movimento_id')::uuid
     WHERE r.arquivo_sha256 IS NOT NULL
       AND c.cred->>'seu_numero' = v_ident
       AND (c.cred->>'valor')::numeric = p_valor
       AND (v_doc IS NULL OR NULLIF(ltrim(COALESCE(c.cred->>'documento', ''), '0'), '') IS NULL
            OR ltrim(c.cred->>'documento', '0') = v_doc)
       AND m.pagamento_id IS NOT NULL
     ORDER BY r.data_geracao DESC
     LIMIT 1;
    IF v_pag IS NOT NULL THEN
      RETURN v_pag;
    END IF;

    -- b) movimento original reenviado com o mesmo identificador
    SELECT m.pagamento_id INTO v_pag
      FROM public.fin_movimentos_bancarios m
     WHERE m.reenviado_em IS NOT NULL
       AND m.remessa_id IS NOT NULL
       AND m.pagamento_id IS NOT NULL
       AND btrim(m.identificador) = v_ident
       AND m.valor = p_valor
       AND (v_doc IS NULL OR m.favorecido_documento IS NULL OR ltrim(m.favorecido_documento, '0') = v_doc)
     ORDER BY m.reenviado_em DESC
     LIMIT 1;
    IF v_pag IS NOT NULL THEN
      RETURN v_pag;
    END IF;
  END IF;

  SELECT array_agg(c.id ORDER BY c.pontos DESC, c.id), array_agg(c.pontos ORDER BY c.pontos DESC, c.id)
    INTO v_ids, v_pontos
    FROM (
      SELECT p.id,
             (CASE WHEN p.identificador_transacao IS NOT NULL
                        AND btrim(p.identificador_transacao) = v_ident THEN 100 ELSE 0 END)
           + (CASE WHEN p.data_pagamento = p_data THEN 10 ELSE 0 END)
           + (CASE WHEN NOT EXISTS (SELECT 1 FROM public.fin_movimentos_bancarios m
                                     WHERE m.pagamento_id = p.id) THEN 1 ELSE 0 END) AS pontos
        FROM public.fin_pagamentos p
        LEFT JOIN public.fornecedores f ON f.id = p.fornecedor_id
       WHERE COALESCE(p.status::text, '') NOT IN ('cancelado', 'estornado')
         AND NOT COALESCE(p.estornado, false)
         AND (
           (p.identificador_transacao IS NOT NULL AND v_ident IS NOT NULL
            AND btrim(p.identificador_transacao) = v_ident)
           OR (v_doc IS NOT NULL AND p_data IS NOT NULL AND p.data_pagamento IS NOT NULL
               AND abs(p.data_pagamento - p_data) <= 5
               AND p.valor_liquido = p_valor
               AND ltrim(regexp_replace(COALESCE(f.cpf_cnpj, ''), '\D', '', 'g'), '0') = v_doc)
         )
    ) c;

  IF v_ids IS NULL THEN
    RETURN NULL;
  END IF;
  IF cardinality(v_ids) > 1 AND v_pontos[1] = v_pontos[2] THEN
    RETURN NULL;  -- empate: deixa para a conciliação manual
  END IF;
  RETURN v_ids[1];
END;
$$;


--
-- Name: FUNCTION fin_casar_movimento_pagamento(p_identificador text, p_documento text, p_valor numeric, p_data date); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fin_casar_movimento_pagamento(p_identificador text, p_documento text, p_valor numeric, p_data date) IS 'Uso interno das RPCs de conciliação bancária: devolve o pagamento que casa com o movimento (retorno de reenvio -> pagamento original; senão identificador, ou documento + valor + data a até 5 dias; NULL se nenhum/empate). Fora da API.';


--
-- Name: fin_marcar_pagamento_pago(uuid, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fin_marcar_pagamento_pago(p_pagamento_id uuid, p_data date) RETURNS text
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  v_numero text;
BEGIN
  UPDATE public.fin_pagamentos
     SET status = 'pago',
         data_efetivacao = COALESCE(p_data, data_efetivacao, CURRENT_DATE),
         updated_at = now()
   WHERE id = p_pagamento_id
     AND COALESCE(status::text, '') NOT IN ('pago', 'estornado', 'cancelado', 'devolvido')
     AND NOT COALESCE(estornado, false)
  RETURNING numero INTO v_numero;
  RETURN v_numero;
END;
$$;


--
-- Name: FUNCTION fin_marcar_pagamento_pago(p_pagamento_id uuid, p_data date); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fin_marcar_pagamento_pago(p_pagamento_id uuid, p_data date) IS 'Uso interno das RPCs de conciliação bancária: marca o pagamento como pago (status e data_efetivacao). Fora da API.';


--
-- Name: fin_pagamentos_proteger_baixa(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fin_pagamentos_proteger_baixa() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.status::text = 'pago' OR NEW.data_efetivacao IS NOT NULL THEN
        RAISE EXCEPTION 'Pagamento não nasce pago: a baixa vem do retorno do banco ou da conciliação bancária.'
          USING ERRCODE = '42501';
      END IF;
    ELSIF (NEW.status::text = 'pago' AND OLD.status IS DISTINCT FROM NEW.status)
       OR NEW.data_efetivacao IS DISTINCT FROM OLD.data_efetivacao THEN
      RAISE EXCEPTION 'O pagamento % só é baixado (pago/data de efetivação) pelo retorno do banco ou pela conciliação bancária.', OLD.numero
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: FUNCTION fin_pagamentos_proteger_baixa(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fin_pagamentos_proteger_baixa() IS 'Trigger: pela API (anon/authenticated) fin_pagamentos não passa a pago, não nasce pago e não muda data_efetivacao; a baixa é de fin_marcar_pagamento_pago (RPCs de conciliação bancária).';


--
-- Name: fin_remessa_bancaria_json(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fin_remessa_bancaria_json(p_id uuid) RETURNS jsonb
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  SELECT jsonb_build_object(
    'id', r.id, 'nsa', r.nsa, 'convenio', r.convenio,
    'agencia', r.agencia, 'agencia_digito', r.agencia_digito, 'conta', r.conta, 'conta_digito', r.conta_digito,
    'data_geracao', r.data_geracao, 'data_pagamento', r.data_pagamento, 'tipo_servico', r.tipo_servico,
    'creditos', r.creditos,
    'arquivo_sha256', r.arquivo_sha256)
    FROM public.fin_remessas_bancarias r
   WHERE r.id = p_id;
$$;


--
-- Name: FUNCTION fin_remessa_bancaria_json(p_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fin_remessa_bancaria_json(p_id uuid) IS 'Uso interno das RPCs de remessa de reenvio: remessa no formato devolvido à tela. Fora da API.';


--
-- Name: fixar_autoria(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fixar_autoria() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  c jsonb := public.trilha_contexto();
  v_uid uuid := (c ->> 'user_id')::uuid;
  v_informa boolean := c ->> 'origem' = 'sistema';
  v_renovar text;
  n jsonb;
  o jsonb;
  ov jsonb := '{}'::jsonb;
  i int;
  arg text;
  v_criacao boolean;
  c_por text;
  c_em text;
  c_flag text;
BEGIN
  -- colunas padrão
  IF TG_OP = 'INSERT' THEN
    IF v_informa THEN
      NEW.created_by_servidor_id := coalesce(
        (SELECT p.servidor_id FROM public.profiles p WHERE p.id = NEW.created_by), NEW.created_by_servidor_id);
      NEW.created_at := coalesce(NEW.created_at, now());
    ELSE
      NEW.created_by := v_uid;
      NEW.created_by_servidor_id := (c ->> 'servidor_id')::uuid;
      NEW.created_at := now();
    END IF;
    NEW.updated_by := NEW.created_by;
    NEW.updated_by_servidor_id := NEW.created_by_servidor_id;
    NEW.updated_at := NEW.created_at;
  ELSE
    NEW.created_by := OLD.created_by;
    NEW.created_by_servidor_id := OLD.created_by_servidor_id;
    NEW.created_at := OLD.created_at;
    IF v_informa THEN
      IF NEW.updated_by IS NOT NULL AND NEW.updated_by IS DISTINCT FROM OLD.updated_by THEN
        NEW.updated_by_servidor_id := coalesce(
          (SELECT p.servidor_id FROM public.profiles p WHERE p.id = NEW.updated_by), NEW.updated_by_servidor_id);
      ELSE
        NEW.updated_by := NULL;
        NEW.updated_by_servidor_id := NULL;
      END IF;
    ELSE
      NEW.updated_by := v_uid;
      NEW.updated_by_servidor_id := (c ->> 'servidor_id')::uuid;
    END IF;
    NEW.updated_at := now();
  END IF;

  -- colunas de decisão (argumentos)
  IF TG_NARGS > 0 AND NOT v_informa THEN
    n := to_jsonb(NEW);
    o := CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE '{}'::jsonb END;
    v_renovar := coalesce(current_setting('trilha.renovar_decisao', true), '');
    FOR i IN 0 .. TG_NARGS - 1 LOOP
      arg := TG_ARGV[i];
      v_criacao := left(arg, 1) = '+';
      IF v_criacao THEN
        arg := substr(arg, 2);
      END IF;
      c_por := split_part(arg, ':', 1);
      c_em := nullif(split_part(arg, ':', 2), '');
      c_flag := nullif(split_part(arg, ':', 3), '');
      CONTINUE WHEN NOT (n ? c_por);
      IF c_em IS NOT NULL AND NOT (n ? c_em) THEN
        c_em := NULL;
      END IF;
      IF c_flag IS NOT NULL AND NOT (n ? c_flag) THEN
        c_flag := NULL;
      END IF;
      IF v_criacao THEN
        IF TG_OP = 'INSERT' THEN
          ov := ov || jsonb_build_object(c_por, v_uid);
          IF c_em IS NOT NULL THEN ov := ov || jsonb_build_object(c_em, now()); END IF;
        ELSE
          ov := ov || jsonb_build_object(c_por, o -> c_por);
          IF c_em IS NOT NULL THEN ov := ov || jsonb_build_object(c_em, o -> c_em); END IF;
        END IF;
      ELSIF v_renovar = TG_TABLE_NAME || '.' || c_por
            OR (c_flag IS NOT NULL AND (n ->> c_flag) = 'true' AND (o ->> c_flag) IS DISTINCT FROM 'true') THEN
        ov := ov || jsonb_build_object(c_por, v_uid);                 -- decisão refeita pela RPC ou flag virou true
        IF c_em IS NOT NULL THEN ov := ov || jsonb_build_object(c_em, now()); END IF;
      ELSIF (n ->> c_por) IS NULL THEN
        IF (o ->> c_por) IS NOT NULL THEN
          ov := ov || jsonb_build_object(c_por, o -> c_por);          -- a API não apaga a decisão
          IF c_em IS NOT NULL THEN ov := ov || jsonb_build_object(c_em, o -> c_em); END IF;
        ELSIF c_em IS NOT NULL AND (n ->> c_em) IS DISTINCT FROM (o ->> c_em) THEN
          ov := ov || jsonb_build_object(c_em, coalesce(o -> c_em, 'null'::jsonb));   -- data sem autor não muda
        END IF;
      ELSIF (n ->> c_por) IS DISTINCT FROM (o ->> c_por) THEN
        ov := ov || jsonb_build_object(c_por, v_uid);                 -- nova decisão: de quem age, agora
        IF c_em IS NOT NULL THEN ov := ov || jsonb_build_object(c_em, now()); END IF;
      ELSIF c_em IS NOT NULL AND (n ->> c_em) IS DISTINCT FROM (o ->> c_em) THEN
        ov := ov || jsonb_build_object(c_em, coalesce(o -> c_em, 'null'::jsonb));     -- só a data mudou: volta
      END IF;
    END LOOP;
    IF ov <> '{}'::jsonb THEN
      NEW := jsonb_populate_record(NEW, ov);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: fixar_autoria_aviso(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fixar_autoria_aviso() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := auth.uid();
    NEW.created_at := now();
  ELSE
    NEW.created_by := OLD.created_by;
    NEW.created_at := OLD.created_at;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: fixar_autoria_config_envio(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fixar_autoria_config_envio() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_by := auth.uid();
  NEW.updated_at := now();
  IF TG_OP = 'INSERT' THEN
    NEW.created_at := now();
  ELSE
    NEW.created_at := OLD.created_at;
    IF NEW.provedor IS DISTINCT FROM OLD.provedor
       OR NEW.smtp_host IS DISTINCT FROM OLD.smtp_host
       OR NEW.smtp_porta IS DISTINCT FROM OLD.smtp_porta
       OR NEW.smtp_seguranca IS DISTINCT FROM OLD.smtp_seguranca
       OR NEW.smtp_usuario IS DISTINCT FROM OLD.smtp_usuario THEN
      NEW.segredo_id := NULL;
      NEW.segredo_atualizado_em := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: fixar_autoria_ia_config(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fixar_autoria_ia_config() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_by := auth.uid();
  NEW.updated_at := now();
  IF TG_OP = 'INSERT' THEN
    NEW.created_at := now();
  ELSE
    NEW.created_at := OLD.created_at;
    IF NEW.provedor IS DISTINCT FROM OLD.provedor
       OR NEW.url_base IS DISTINCT FROM OLD.url_base THEN
      NEW.segredo_id := NULL;
      NEW.segredo_final := NULL;
      NEW.segredo_atualizado_em := NULL;
      NEW.ativo := false;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: fn_atualizar_empenho_liquidacao(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_atualizar_empenho_liquidacao() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: fn_atualizar_empenho_pagamento(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_atualizar_empenho_pagamento() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.status = 'pago'
     AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM 'pago')) THEN
    -- Atualizar empenho
    UPDATE fin_empenhos
    SET valor_pago = valor_pago + NEW.valor_bruto,
        status = (CASE
          WHEN valor_pago + NEW.valor_bruto >= valor_liquidado THEN 'pago'
          ELSE 'parcialmente_pago'
        END)::public.status_empenho,
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
        data_ultimo_saldo = COALESCE(NEW.data_efetivacao, NEW.data_pagamento),
        updated_at = now()
    WHERE id = NEW.conta_bancaria_id;
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: FUNCTION fn_atualizar_empenho_pagamento(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fn_atualizar_empenho_pagamento() IS 'Trigger de fin_pagamentos: na passagem para pago (INSERT já pago ou UPDATE de outro status para pago) soma o valor pago no empenho e na dotação e baixa o saldo da conta bancária. Não estorna ao sair de pago. O QDD do FIPLAN sobrescreve a dotação.';


--
-- Name: fn_atualizar_estatisticas_campanha(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_atualizar_estatisticas_campanha() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
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


--
-- Name: fn_atualizar_estoque(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_atualizar_estoque() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


--
-- Name: fn_atualizar_saldo_dotacao(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_atualizar_saldo_dotacao() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


--
-- Name: fn_atualizar_saldo_dotacao_empenho(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_atualizar_saldo_dotacao_empenho() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: fn_atualizar_saldo_sub_empenho(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_atualizar_saldo_sub_empenho() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.tipo = 'reforco' THEN
    UPDATE public.fin_empenhos
    SET valor_empenhado = valor_empenhado + NEW.valor,
        saldo_liquidar = COALESCE(saldo_liquidar, 0) + NEW.valor,
        updated_at = now()
    WHERE id = NEW.empenho_id;
    
    -- Atualizar dotação
    UPDATE public.fin_dotacoes
    SET valor_empenhado = COALESCE(valor_empenhado, 0) + NEW.valor,
        updated_at = now()
    WHERE id = (SELECT dotacao_id FROM public.fin_empenhos WHERE id = NEW.empenho_id);
        
  ELSIF NEW.tipo = 'anulacao' THEN
    UPDATE public.fin_empenhos
    SET valor_anulado = COALESCE(valor_anulado, 0) + NEW.valor,
        saldo_liquidar = COALESCE(saldo_liquidar, 0) - NEW.valor,
        updated_at = now()
    WHERE id = NEW.empenho_id;
    
    -- Devolver saldo à dotação
    UPDATE public.fin_dotacoes
    SET valor_empenhado = COALESCE(valor_empenhado, 0) - NEW.valor,
        updated_at = now()
    WHERE id = (SELECT dotacao_id FROM public.fin_empenhos WHERE id = NEW.empenho_id);
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: fn_atualizar_situacao_servidor(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_atualizar_situacao_servidor(p_servidor_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_atual situacao_funcional;
  v_nova situacao_funcional;
  v_tipo_servidor tipo_servidor;
  v_cargo_id uuid;
  v_unidade_id uuid;
  v_vinculo vinculo_funcional;
  v_lotacao RECORD;
  v_hoje date := public.data_local();
BEGIN
  -- Prioridade: falecido (permanente) > exonerado/aposentado/falecido por provimento encerrado > férias em gozo >
  -- licença/afastamento ativo ou prorrogado > cessão de saída > provimento ativo > cessão de entrada >
  -- vínculo ativo sem provimento > desligado preservado > inativo.
  SELECT situacao INTO v_atual FROM public.servidores WHERE id = p_servidor_id;
  IF NOT FOUND OR v_atual = 'falecido' THEN
    RETURN;
  END IF;

  -- Provimento encerrado por desligamento, sem nomeação posterior
  IF EXISTS (
    SELECT 1 FROM public.provimentos pe
     WHERE pe.servidor_id = p_servidor_id
       AND pe.status = 'encerrado'
       AND pe.motivo_encerramento IN ('exoneracao', 'exoneracao_pedido', 'exoneracao_oficio', 'termino_mandato',
                                      'demissao', 'aposentadoria', 'vacancia', 'falecimento')
       AND NOT EXISTS (
         SELECT 1 FROM public.provimentos p2
          WHERE p2.servidor_id = p_servidor_id AND p2.status IN ('ativo', 'suspenso')
            AND p2.data_nomeacao > pe.data_encerramento)
  ) THEN
    SELECT CASE motivo_encerramento
             WHEN 'falecimento' THEN 'falecido'::situacao_funcional
             WHEN 'aposentadoria' THEN 'aposentado'::situacao_funcional
             ELSE 'exonerado'::situacao_funcional
           END
      INTO v_nova
      FROM public.provimentos
     WHERE servidor_id = p_servidor_id AND status = 'encerrado'
       AND motivo_encerramento IN ('exoneracao', 'exoneracao_pedido', 'exoneracao_oficio', 'termino_mandato',
                                   'demissao', 'aposentadoria', 'vacancia', 'falecimento')
     ORDER BY data_encerramento DESC NULLS LAST
     LIMIT 1;

    UPDATE public.servidores
       SET situacao = v_nova, ativo = false, cargo_atual_id = NULL, unidade_atual_id = NULL, updated_at = now()
     WHERE id = p_servidor_id;
    RETURN;
  END IF;

  -- Férias em gozo
  IF EXISTS (
    SELECT 1 FROM public.ferias_servidor
     WHERE servidor_id = p_servidor_id AND status = 'em_gozo'
       AND data_inicio <= v_hoje AND data_fim >= v_hoje
  ) THEN
    UPDATE public.servidores SET situacao = 'ferias', ativo = true, updated_at = now() WHERE id = p_servidor_id;
    RETURN;
  END IF;

  -- Licença/afastamento vigente (ativa ou prorrogada)
  IF EXISTS (
    SELECT 1 FROM public.licencas_afastamentos
     WHERE servidor_id = p_servidor_id AND status IN ('ativa', 'prorrogada')
       AND data_inicio <= v_hoje AND (data_fim IS NULL OR data_fim >= v_hoje)
  ) THEN
    SELECT CASE tipo_afastamento WHEN 'licenca' THEN 'licenca'::situacao_funcional ELSE 'afastado'::situacao_funcional END
      INTO v_nova
      FROM public.licencas_afastamentos
     WHERE servidor_id = p_servidor_id AND status IN ('ativa', 'prorrogada')
       AND data_inicio <= v_hoje AND (data_fim IS NULL OR data_fim >= v_hoje)
     ORDER BY data_inicio DESC
     LIMIT 1;
    UPDATE public.servidores SET situacao = v_nova, ativo = true, updated_at = now() WHERE id = p_servidor_id;
    RETURN;
  END IF;

  -- Cessão de saída ativa
  IF EXISTS (SELECT 1 FROM public.cessoes WHERE servidor_id = p_servidor_id AND tipo = 'saida' AND ativa = true) THEN
    UPDATE public.servidores SET situacao = 'cedido', ativo = true, updated_at = now() WHERE id = p_servidor_id;
    RETURN;
  END IF;

  -- Provimento ativo
  IF EXISTS (SELECT 1 FROM public.provimentos WHERE servidor_id = p_servidor_id AND status = 'ativo') THEN
    SELECT p.cargo_id, p.unidade_id,
           CASE c.categoria WHEN 'efetivo' THEN 'efetivo'::vinculo_funcional ELSE 'comissionado'::vinculo_funcional END,
           CASE c.categoria WHEN 'efetivo' THEN 'efetivo_idjuv'::tipo_servidor ELSE 'comissionado_idjuv'::tipo_servidor END
      INTO v_cargo_id, v_unidade_id, v_vinculo, v_tipo_servidor
      FROM public.provimentos p
      JOIN public.cargos c ON c.id = p.cargo_id
     WHERE p.servidor_id = p_servidor_id AND p.status = 'ativo'
     ORDER BY p.data_nomeacao DESC
     LIMIT 1;

    -- a lotação ativa tem prioridade para a unidade; o cargo vem do provimento
    SELECT * INTO v_lotacao FROM public.lotacoes
     WHERE servidor_id = p_servidor_id AND ativo = true
     ORDER BY data_inicio DESC LIMIT 1;
    IF v_lotacao.id IS NOT NULL THEN
      v_unidade_id := v_lotacao.unidade_id;
    END IF;

    UPDATE public.servidores
       SET situacao = 'ativo', ativo = true,
           tipo_servidor = COALESCE(v_tipo_servidor, tipo_servidor),
           cargo_atual_id = v_cargo_id, unidade_atual_id = v_unidade_id,
           vinculo = v_vinculo, data_desligamento = NULL, updated_at = now()
     WHERE id = p_servidor_id;
    RETURN;
  END IF;

  -- Cessão de entrada ativa
  IF EXISTS (SELECT 1 FROM public.cessoes WHERE servidor_id = p_servidor_id AND tipo = 'entrada' AND ativa = true) THEN
    SELECT unidade_idjuv_id INTO v_unidade_id
      FROM public.cessoes
     WHERE servidor_id = p_servidor_id AND tipo = 'entrada' AND ativa = true
     ORDER BY data_inicio DESC LIMIT 1;
    UPDATE public.servidores
       SET situacao = 'ativo', ativo = true, tipo_servidor = 'cedido_entrada', unidade_atual_id = v_unidade_id,
           vinculo = 'cedido', data_desligamento = NULL, updated_at = now()
     WHERE id = p_servidor_id;
    RETURN;
  END IF;

  -- Vínculo ativo sem provimento (temporário, estagiário, requisitado, federal…): continua ativo
  IF EXISTS (SELECT 1 FROM public.vinculos_servidor WHERE servidor_id = p_servidor_id AND ativo = true) THEN
    SELECT cargo_id, unidade_id INTO v_cargo_id, v_unidade_id
      FROM public.vinculos_servidor
     WHERE servidor_id = p_servidor_id AND ativo = true
     ORDER BY data_inicio DESC LIMIT 1;
    UPDATE public.servidores
       SET situacao = 'ativo', ativo = true, cargo_atual_id = v_cargo_id, unidade_atual_id = v_unidade_id,
           data_desligamento = NULL, updated_at = now()
     WHERE id = p_servidor_id;
    RETURN;
  END IF;

  -- Já desligado (exonerado/aposentado) e sem nada ativo: preserva a situação
  IF v_atual IN ('exonerado', 'aposentado') THEN
    UPDATE public.servidores SET ativo = false, cargo_atual_id = NULL, unidade_atual_id = NULL WHERE id = p_servidor_id;
    RETURN;
  END IF;

  UPDATE public.servidores
     SET situacao = 'inativo', ativo = false, cargo_atual_id = NULL, unidade_atual_id = NULL, updated_at = now()
   WHERE id = p_servidor_id;
END;
$$;


--
-- Name: fn_audit_financeiro(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_audit_financeiro() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: fn_audit_gestores_escolares(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_audit_gestores_escolares() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_acao TEXT;
    v_detalhes JSONB;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_acao := 'criacao';
        v_detalhes := jsonb_build_object('escola_id', NEW.escola_id, 'nome', NEW.nome, 'email', NEW.email);
        
        INSERT INTO public.gestores_escolares_historico (
            gestor_id, status_anterior, status_novo, usuario_id, usuario_nome, acao, detalhes
        ) VALUES (NEW.id, NULL, NEW.status, NULL, 'Sistema (Pré-cadastro)', v_acao, v_detalhes);
        
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            CASE NEW.status
                WHEN 'em_processamento' THEN v_acao := 'assumir_tarefa';
                WHEN 'cadastrado_cbde' THEN v_acao := 'cadastro_cbde';
                WHEN 'contato_realizado' THEN v_acao := 'contato_realizado';
                WHEN 'confirmado' THEN v_acao := 'confirmacao';
                WHEN 'problema' THEN v_acao := 'problema';
                ELSE v_acao := 'mudanca_status';
            END CASE;
            
            v_detalhes := jsonb_build_object('status_anterior', OLD.status, 'status_novo', NEW.status);
            
            IF NEW.observacoes IS DISTINCT FROM OLD.observacoes THEN
                v_detalhes := v_detalhes || jsonb_build_object('observacoes', NEW.observacoes);
            END IF;
            
            INSERT INTO public.gestores_escolares_historico (
                gestor_id, status_anterior, status_novo, usuario_id, usuario_nome, usuario_email, acao, detalhes
            ) VALUES (NEW.id, OLD.status, NEW.status, NEW.responsavel_id, NEW.responsavel_nome, NEW.responsavel_nome, v_acao, v_detalhes);
            
        ELSIF NEW.observacoes IS DISTINCT FROM OLD.observacoes THEN
            v_acao := 'observacao';
            v_detalhes := jsonb_build_object('observacao_nova', LEFT(COALESCE(NEW.observacoes, ''), 200));
            
            INSERT INTO public.gestores_escolares_historico (
                gestor_id, status_anterior, status_novo, usuario_id, usuario_nome, acao, detalhes
            ) VALUES (NEW.id, OLD.status, NEW.status, NEW.responsavel_id, NEW.responsavel_nome, v_acao, v_detalhes);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


--
-- Name: fn_audit_log_licitacoes(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_audit_log_licitacoes() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


--
-- Name: fn_audit_parametros(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_audit_parametros() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_action audit_action;
BEGIN
  -- Determinar a ação baseada no tipo de operação
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update';
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
  END IF;

  -- Inserir no audit_logs existente
  INSERT INTO public.audit_logs (
    action,
    entity_type,
    entity_id,
    before_data,
    after_data,
    user_id,
    module_name,
    description
  ) VALUES (
    v_action,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id)::text,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    auth.uid(),
    'config.parametros',
    format('Parâmetro %s: %s', 
      COALESCE(NEW.parametro_codigo, OLD.parametro_codigo),
      TG_OP
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;


--
-- Name: FUNCTION fn_audit_parametros(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fn_audit_parametros() IS 'Registra alterações em parâmetros no audit_logs existente do sistema';


--
-- Name: fn_audit_trigger(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_audit_trigger() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  v_acao text;
  v_antes jsonb;
  v_depois jsonb;
  v_campos text[];
  v_id text;
  v_entidade uuid;
  v_chave jsonb;
  v_descricao text;
  v_fund jsonb;
  v_linha jsonb;
  c jsonb;
  s record;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_acao := 'create';
    v_depois := to_jsonb(NEW);
    v_descricao := 'Registro criado em ' || TG_TABLE_NAME;
  ELSIF TG_OP = 'UPDATE' THEN
    v_acao := 'update';
    v_antes := to_jsonb(OLD);
    v_depois := to_jsonb(NEW);
    SELECT array_agg(k ORDER BY k) INTO v_campos
      FROM jsonb_object_keys(v_depois) AS k
     WHERE (v_depois -> k) IS DISTINCT FROM (v_antes -> k)
       AND k NOT IN ('updated_at', 'updated_by', 'updated_by_servidor_id');
    IF v_campos IS NULL THEN
      RETURN NEW;   -- nada mudou além do carimbo de atualização
    END IF;
    v_descricao := 'Registro atualizado em ' || TG_TABLE_NAME;
  ELSE
    v_acao := 'delete';
    v_antes := to_jsonb(OLD);
    v_descricao := 'Registro excluído de ' || TG_TABLE_NAME;
  END IF;

  -- fundamento da regra de lançamento por setor (antes da máscara: a posse da linha é lida sem ela)
  v_fund := public.fundamento_tabela(TG_TABLE_NAME);
  IF v_fund IS NOT NULL THEN
    IF v_fund ->> 'modo' = 'desligado' THEN
      v_fund := NULL;
    ELSIF pg_trigger_depth() > 1 AND current_setting('lancamento.cadeia', true) = 'on' THEN
      v_fund := v_fund || jsonb_build_object('em_cascata', true);
    ELSIF (v_fund ->> 'permitido') = 'false'
          AND TG_TABLE_NAME IN ('solicitacoes_abono', 'solicitacoes_ajuste_ponto', 'justificativas_ponto',
                                'frequencia_fechamento', 'documentos_requerimento_servidor') THEN
      v_linha := public.fundamento_linha(TG_TABLE_NAME, TG_OP, v_depois, v_antes);
      IF v_linha IS NOT NULL THEN
        v_fund := jsonb_build_object('modo', v_fund -> 'modo', 'modulos', v_fund -> 'modulos') || v_linha;
      END IF;
    END IF;
  END IF;

  v_id := coalesce(v_depois, v_antes) ->> 'id';
  IF v_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    v_entidade := v_id::uuid;
  END IF;

  -- máscara (mesma regra de trilha_mascarar, numa só leitura do catálogo para antes e depois)
  FOR s IN SELECT m.coluna, m.tratamento FROM public.audit_colunas_sensiveis m WHERE m.tabela = TG_TABLE_NAME LOOP
    IF v_antes ? s.coluna AND jsonb_typeof(v_antes -> s.coluna) <> 'null' THEN
      v_antes := jsonb_set(v_antes, ARRAY[s.coluna], CASE WHEN s.tratamento = 'parcial'
                   THEN to_jsonb(public.mascarar_parcial(v_antes ->> s.coluna)) ELSE to_jsonb('[protegido]'::text) END);
    END IF;
    IF v_depois ? s.coluna AND jsonb_typeof(v_depois -> s.coluna) <> 'null' THEN
      v_depois := jsonb_set(v_depois, ARRAY[s.coluna], CASE WHEN s.tratamento = 'parcial'
                   THEN to_jsonb(public.mascarar_parcial(v_depois ->> s.coluna)) ELSE to_jsonb('[protegido]'::text) END);
    END IF;
  END LOOP;

  IF v_entidade IS NULL THEN
    SELECT jsonb_object_agg(a.attname, coalesce(v_depois, v_antes) -> a.attname) INTO v_chave
      FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY (i.indkey)
     WHERE i.indrelid = TG_RELID AND i.indisprimary;
  END IF;

  c := public.trilha_contexto();

  INSERT INTO public.audit_logs (
    action, entity_type, entity_id, module_name, before_data, after_data, user_id, description, metadata,
    campos_alterados, origem, servidor_id, servidor_nome, servidor_matricula, role_at_time, org_unit_id,
    ip_address, user_agent, transacao, fundamento
  ) VALUES (
    v_acao::public.audit_action, TG_TABLE_NAME, v_entidade, TG_ARGV[0], v_antes, v_depois, (c ->> 'user_id')::uuid,
    v_descricao,
    jsonb_build_object('trigger', true, 'operation', TG_OP, 'table', TG_TABLE_NAME)
      || CASE WHEN v_chave IS NOT NULL THEN jsonb_build_object('chave', v_chave) ELSE '{}'::jsonb END,
    v_campos, c ->> 'origem', (c ->> 'servidor_id')::uuid, c ->> 'servidor_nome', c ->> 'servidor_matricula',
    (c ->> 'papel')::public.app_role, coalesce((v_fund ->> 'unidade_id')::uuid, (c ->> 'unidade_id')::uuid),
    (c ->> 'ip')::inet, c ->> 'agente', txid_current(), v_fund
  );

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$_$;


--
-- Name: fn_bloquear_adiantamento_vencido(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_bloquear_adiantamento_vencido() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: fn_calcular_13_proporcional(uuid, integer, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_calcular_13_proporcional(p_servidor_id uuid, p_ano integer, p_remuneracao_base numeric) RETURNS TABLE(meses_trabalhados integer, valor_proporcional numeric, valor_integral numeric)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_data_admissao DATE;
  v_meses INTEGER;
BEGIN
  SELECT data_admissao INTO v_data_admissao
  FROM servidores
  WHERE id = p_servidor_id;

  IF v_data_admissao IS NULL OR EXTRACT(YEAR FROM v_data_admissao) < p_ano THEN
    v_meses := 12;
  ELSIF EXTRACT(YEAR FROM v_data_admissao) = p_ano THEN
    v_meses := 12 - EXTRACT(MONTH FROM v_data_admissao)::INTEGER + 1;
    -- Só conta mês se trabalhou 15+ dias
    IF EXTRACT(DAY FROM v_data_admissao) > 15 THEN
      v_meses := v_meses - 1;
    END IF;
  ELSE
    v_meses := 0;
  END IF;

  v_meses := GREATEST(0, LEAST(12, v_meses));

  RETURN QUERY SELECT
    v_meses,
    ROUND(p_remuneracao_base * v_meses / 12, 2),
    p_remuneracao_base;
END;
$$;


--
-- Name: fn_calcular_ferias(numeric, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_calcular_ferias(p_remuneracao_base numeric, p_dias_ferias integer DEFAULT 30) RETURNS TABLE(valor_ferias numeric, terco_constitucional numeric, valor_total numeric, dias integer)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_ferias NUMERIC;
  v_terco NUMERIC;
BEGIN
  v_ferias := ROUND(p_remuneracao_base * p_dias_ferias / 30, 2);
  v_terco := ROUND(v_ferias / 3, 2);

  RETURN QUERY SELECT
    v_ferias,
    v_terco,
    v_ferias + v_terco,
    p_dias_ferias;
END;
$$;


--
-- Name: fn_calcular_nivel_parametro(uuid, character varying, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_calcular_nivel_parametro(p_servidor_id uuid, p_tipo_servidor character varying, p_unidade_id uuid) RETURNS integer
    LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    IF p_servidor_id IS NOT NULL THEN RETURN 4; END IF;
    IF p_tipo_servidor IS NOT NULL THEN RETURN 3; END IF;
    IF p_unidade_id IS NOT NULL THEN RETURN 2; END IF;
    RETURN 1;
END;
$$;


--
-- Name: FUNCTION fn_calcular_nivel_parametro(p_servidor_id uuid, p_tipo_servidor character varying, p_unidade_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fn_calcular_nivel_parametro(p_servidor_id uuid, p_tipo_servidor character varying, p_unidade_id uuid) IS 'Calcula o nível hierárquico de um parâmetro: 1=Instituição, 2=Unidade, 3=TipoServidor, 4=Servidor';


--
-- Name: fn_calcular_sla_processo(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_calcular_sla_processo(p_processo_id uuid) RETURNS TABLE(dias_aberto integer, dias_ultima_movimentacao integer, status_sla text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_data_abertura DATE;
  v_ultima_mov TIMESTAMPTZ;
  v_dias_aberto INTEGER;
  v_dias_mov INTEGER;
BEGIN
  SELECT 
    p.data_abertura,
    (SELECT MAX(m.created_at) FROM movimentacoes_processo m WHERE m.processo_id = p.id)
  INTO v_data_abertura, v_ultima_mov
  FROM processos_administrativos p
  WHERE p.id = p_processo_id;
  
  v_dias_aberto := CURRENT_DATE - v_data_abertura;
  v_dias_mov := CASE WHEN v_ultima_mov IS NOT NULL 
    THEN (CURRENT_DATE - v_ultima_mov::DATE)
    ELSE v_dias_aberto
  END;
  
  RETURN QUERY SELECT 
    v_dias_aberto,
    v_dias_mov,
    CASE 
      WHEN v_dias_mov > 30 THEN 'critico'
      WHEN v_dias_mov > 15 THEN 'atencao'
      ELSE 'normal'
    END::TEXT;
END;
$$;


--
-- Name: fn_campanhas_inventario_unidades_autoria(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_campanhas_inventario_unidades_autoria() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.created_by := auth.uid();
  NEW.updated_by := auth.uid();
  RETURN NEW;
END;
$$;


--
-- Name: fn_contar_processos_por_status(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_contar_processos_por_status() RETURNS TABLE(status text, quantidade bigint)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.status::TEXT,
    COUNT(*)::BIGINT
  FROM processos_administrativos p
  WHERE public.usuario_tem_permissao(auth.uid(), 'workflow.visualizar')
    OR public.usuario_eh_admin(auth.uid())
  GROUP BY p.status;
END;
$$;


--
-- Name: fn_encerrar_lotacao_anterior(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_encerrar_lotacao_anterior() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.ativo = true THEN
    UPDATE public.lotacoes 
    SET ativo = false, data_fim = COALESCE(data_fim, NEW.data_inicio - INTERVAL '1 day')
    WHERE servidor_id = NEW.servidor_id AND ativo = true AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: fn_encerrar_provimento_comissionado_cessao(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_encerrar_provimento_comissionado_cessao() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.tipo = 'saida' AND NEW.ativa = true THEN
    IF EXISTS (SELECT 1 FROM public.vinculos_servidor
                WHERE servidor_id = NEW.servidor_id AND ativo = true AND tipo = 'comissionado') THEN
      UPDATE public.provimentos
         SET status = 'encerrado', data_encerramento = NEW.data_inicio, motivo_encerramento = 'cessao_comissionado'
       WHERE servidor_id = NEW.servidor_id AND status = 'ativo';
    ELSIF EXISTS (SELECT 1 FROM public.vinculos_servidor
                   WHERE servidor_id = NEW.servidor_id AND ativo = true AND tipo = 'efetivo') THEN
      UPDATE public.provimentos SET status = 'suspenso'
       WHERE servidor_id = NEW.servidor_id AND status = 'ativo';
    END IF;

    UPDATE public.lotacoes SET ativo = false, data_fim = NEW.data_inicio
     WHERE servidor_id = NEW.servidor_id AND ativo = true;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: fn_encerrar_vinculo_anterior(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_encerrar_vinculo_anterior() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.ativo = true THEN
    UPDATE public.vinculos_funcionais 
    SET ativo = false, data_fim = COALESCE(data_fim, NEW.data_inicio - INTERVAL '1 day')
    WHERE servidor_id = NEW.servidor_id AND ativo = true AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: fn_fotos_vistoria_inventario_imutavel(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_fotos_vistoria_inventario_imutavel() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  IF (to_jsonb(NEW) - ARRAY['legenda', 'tem_pessoa', 'codigo_objeto'])
     IS DISTINCT FROM (to_jsonb(OLD) - ARRAY['legenda', 'tem_pessoa', 'codigo_objeto']) THEN
    RAISE EXCEPTION 'fotos_vistoria_inventario: só legenda, tem_pessoa e codigo_objeto podem ser alterados'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: fn_gerar_esocial_s1200(uuid, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_gerar_esocial_s1200(p_servidor_id uuid, p_competencia_ano integer, p_competencia_mes integer) RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_servidor RECORD;
  v_lancamentos JSONB;
  v_payload JSONB;
BEGIN
  SELECT * INTO v_servidor FROM servidores WHERE id = p_servidor_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Servidor não encontrado'; END IF;

  -- Buscar lançamentos da folha
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'rubrica_id', l.rubrica_id,
    'tipo', l.tipo,
    'valor', l.valor,
    'referencia', l.referencia
  )), '[]'::jsonb)
  INTO v_lancamentos
  FROM lancamentos_folha l
  JOIN folhas_pagamento f ON f.id = l.folha_id
  WHERE l.servidor_id = p_servidor_id
    AND f.ano = p_competencia_ano AND f.mes = p_competencia_mes;

  v_payload := jsonb_build_object(
    'evento', 'S-1200',
    'tipo', 'evtRemun',
    'ideEvento', jsonb_build_object(
      'indRetif', 1,
      'perApur', LPAD(p_competencia_mes::TEXT, 2, '0') || '-' || p_competencia_ano,
      'tpAmb', 2,
      'procEmi', 1
    ),
    'trabalhador', jsonb_build_object(
      'cpfTrab', v_servidor.cpf,
      'nmTrab', v_servidor.nome_completo,
      'matricula', v_servidor.matricula
    ),
    'dmDev', v_lancamentos,
    'geradoEm', now(),
    'status', 'pendente'
  );

  RETURN v_payload;
END;
$$;


--
-- Name: fn_gerar_esocial_s2200(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_gerar_esocial_s2200(p_servidor_id uuid) RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_servidor RECORD;
  v_payload JSONB;
BEGIN
  SELECT * INTO v_servidor FROM servidores WHERE id = p_servidor_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Servidor não encontrado: %', p_servidor_id;
  END IF;

  v_payload := jsonb_build_object(
    'evento', 'S-2200',
    'tipo', 'evtAdmissao',
    'ideEvento', jsonb_build_object(
      'indRetif', 1,
      'tpAmb', 2, -- 1=Produção, 2=Homologação
      'procEmi', 1,
      'verProc', '1.0.0'
    ),
    'trabalhador', jsonb_build_object(
      'cpfTrab', v_servidor.cpf,
      'nmTrab', v_servidor.nome_completo,
      'nmSoc', v_servidor.nome_social,
      'sexo', CASE v_servidor.sexo WHEN 'masculino' THEN 'M' WHEN 'feminino' THEN 'F' ELSE NULL END,
      'racaCor', v_servidor.raca_cor,
      'estCiv', v_servidor.estado_civil,
      'dtNascto', v_servidor.data_nascimento,
      'paisNac', 105, -- Brasil
      'nmMae', v_servidor.nome_mae,
      'nmPai', v_servidor.nome_pai
    ),
    'documentos', jsonb_build_object(
      'CTPS', jsonb_build_object('nrCtps', v_servidor.ctps_numero, 'serieCtps', v_servidor.ctps_serie),
      'RG', jsonb_build_object('nrRg', v_servidor.rg, 'orgaoEmissor', v_servidor.rg_orgao_expedidor),
      'RIC', NULL,
      'NIS', jsonb_build_object('nrNis', v_servidor.pis_pasep)
    ),
    'endereco', jsonb_build_object(
      'tpLograd', v_servidor.endereco_logradouro,
      'nrLograd', v_servidor.endereco_numero,
      'complemento', v_servidor.endereco_complemento,
      'bairro', v_servidor.endereco_bairro,
      'cep', v_servidor.endereco_cep,
      'codMunic', NULL,
      'uf', v_servidor.endereco_uf
    ),
    'vinculo', jsonb_build_object(
      'matricula', v_servidor.matricula,
      'tpRegTrab', 2, -- Estatutário
      'tpRegPrev', 2, -- RPPS
      'dtAdm', v_servidor.data_admissao,
      'cadIni', 'S'
    ),
    'deficiencia', CASE WHEN v_servidor.pcd THEN jsonb_build_object(
      'defFisica', v_servidor.pcd_tipo,
      'infoCota', 'S'
    ) ELSE NULL END,
    'geradoEm', now(),
    'status', 'pendente'
  );

  RETURN v_payload;
END;
$$;


--
-- Name: fn_gerar_numero_financeiro(character varying, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_gerar_numero_financeiro(p_tipo character varying, p_exercicio integer DEFAULT (EXTRACT(year FROM CURRENT_DATE))::integer) RETURNS character varying
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  v_prefixo text;
  v_tabela  text;
  v_ultimo  integer;
BEGIN
  SELECT t.prefixo, t.tabela INTO v_prefixo, v_tabela
  FROM (VALUES
    ('solicitacao', 'SOL', 'fin_solicitacoes'),
    ('empenho',     'NE',  'fin_empenhos'),
    ('liquidacao',  'NL',  'fin_liquidacoes'),
    ('pagamento',   'OP',  'fin_pagamentos'),
    ('receita',     'REC', 'fin_receitas'),
    ('adiantamento','ADI', 'fin_adiantamentos'),
    ('alteracao',   'ALT', 'fin_alteracoes_orcamentarias')
  ) AS t(tipo, prefixo, tabela)
  WHERE t.tipo = p_tipo;

  IF v_prefixo IS NULL THEN
    RAISE EXCEPTION 'Tipo de documento financeiro inválido: %', left(coalesce(p_tipo, ''), 40)
      USING ERRCODE = '22023';
  END IF;

  EXECUTE format(
    'SELECT COALESCE(MAX(NULLIF(regexp_replace(numero, %L, %L), %L)::integer), 0) + 1 FROM public.%I WHERE exercicio = $1',
    '^' || v_prefixo || '-', '', '', v_tabela
  ) INTO v_ultimo USING p_exercicio;

  RETURN v_prefixo || '-' || LPAD(COALESCE(v_ultimo, 1)::text, 6, '0');
END;
$_$;


--
-- Name: fn_gerar_numero_requisicao(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_gerar_numero_requisicao() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
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


--
-- Name: fn_gerar_numero_tombamento(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_gerar_numero_tombamento() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.numero_patrimonio   := NULLIF(upper(btrim(NEW.numero_patrimonio)), '');
  NEW.patrimonio_anterior := NULLIF(upper(btrim(NEW.patrimonio_anterior)), '');
  NEW.codigo_qr           := NULLIF(upper(btrim(NEW.codigo_qr)), '');

  IF TG_OP = 'INSERT' THEN
    IF NEW.numero_patrimonio IS NULL THEN
      NEW.numero_patrimonio := public.fn_proximo_numero_tombamento();
    END IF;
    NEW.codigo_qr := COALESCE(NEW.codigo_qr, NEW.numero_patrimonio);
    RETURN NEW;
  END IF;

  -- UPDATE
  -- Vazio ou igual ao atual (a menos de maiúsculas/espaços): mantém o valor gravado.
  IF NEW.numero_patrimonio IS NULL OR NEW.numero_patrimonio = upper(btrim(OLD.numero_patrimonio)) THEN
    NEW.numero_patrimonio := OLD.numero_patrimonio;
  END IF;
  IF NEW.numero_patrimonio IS DISTINCT FROM OLD.numero_patrimonio THEN
    -- auth.uid() nulo = manutenção feita no servidor (service role / SQL), não pela API do app.
    IF auth.uid() IS NOT NULL AND NOT public.is_admin_user(auth.uid()) THEN
      RAISE EXCEPTION 'O número de tombamento não pode ser alterado depois de criado'
        USING ERRCODE = '42501';
    END IF;
    NEW.patrimonio_anterior := COALESCE(NEW.patrimonio_anterior, OLD.numero_patrimonio);
    IF NEW.codigo_qr IS NOT DISTINCT FROM upper(btrim(OLD.codigo_qr)) THEN
      NEW.codigo_qr := NEW.numero_patrimonio;
    END IF;
  ELSIF NEW.codigo_qr IS NULL OR NEW.codigo_qr = upper(btrim(OLD.codigo_qr)) THEN
    NEW.codigo_qr := OLD.codigo_qr;
  ELSIF auth.uid() IS NOT NULL AND NOT public.is_admin_user(auth.uid()) THEN
    -- O QR é o que a plaqueta carrega: trocá-lo desvia a leitura para outro bem.
    RAISE EXCEPTION 'O código QR do bem não pode ser alterado' USING ERRCODE = '42501';
  END IF;
  NEW.codigo_qr := COALESCE(NEW.codigo_qr, NEW.numero_patrimonio);
  RETURN NEW;
END;
$$;


--
-- Name: fn_guardar_decisao_patrimonio(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_guardar_decisao_patrimonio() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  v_iniciais text[] := CASE TG_TABLE_NAME
                         WHEN 'baixas_patrimonio' THEN ARRAY['solicitada', 'em_analise']
                         ELSE ARRAY['pendente'] END;
BEGIN
  IF auth.uid() IS NULL
     OR public.has_permission_code(auth.uid(), 'patrimonio.tramitar')
     OR public.is_admin_user(auth.uid()) THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF COALESCE(NEW.status::text, v_iniciais[1]) <> ALL (v_iniciais)
       OR NEW.aprovado_por IS NOT NULL OR NEW.data_aprovacao IS NOT NULL THEN
      RAISE EXCEPTION 'Pedido de patrimônio nasce pendente; a decisão exige patrimonio.tramitar'
        USING ERRCODE = '42501';
    END IF;
  ELSIF NEW.status::text IS DISTINCT FROM OLD.status::text
          AND NOT (OLD.status::text = ANY (v_iniciais) AND NEW.status::text = ANY (v_iniciais))
        OR NEW.aprovado_por IS DISTINCT FROM OLD.aprovado_por
        OR NEW.data_aprovacao IS DISTINCT FROM OLD.data_aprovacao
        OR NEW.motivo_rejeicao IS DISTINCT FROM OLD.motivo_rejeicao THEN
    RAISE EXCEPTION 'Aprovar ou rejeitar exige a permissão patrimonio.tramitar'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: fn_impedir_delecao_parametro(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_impedir_delecao_parametro() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    RAISE EXCEPTION 'Deleção física não permitida. Use UPDATE SET ativo = false para inativar o parâmetro.';
    RETURN NULL;
END;
$$;


--
-- Name: fn_inscrever_restos_pagar(integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_inscrever_restos_pagar(p_exercicio_origem integer, p_exercicio_inscricao integer DEFAULT NULL::integer) RETURNS integer
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  v_exercicio_inscricao INTEGER;
  v_count INTEGER := 0;
BEGIN
  v_exercicio_inscricao := COALESCE(p_exercicio_inscricao, p_exercicio_origem + 1);
  
  -- Inscrever empenhos com saldo a liquidar (não processados)
  INSERT INTO public.fin_restos_pagar (empenho_id, exercicio_origem, exercicio_inscricao, tipo, valor_inscrito)
  SELECT id, exercicio, v_exercicio_inscricao, 'nao_processado', 
         COALESCE(saldo_liquidar, valor_empenhado - COALESCE(valor_liquidado, 0))
  FROM public.fin_empenhos
  WHERE exercicio = p_exercicio_origem
    AND status IN ('emitido', 'parcialmente_liquidado')
    AND COALESCE(saldo_liquidar, valor_empenhado - COALESCE(valor_liquidado, 0)) > 0
    AND inscrito_rp IS NOT TRUE
  ON CONFLICT (empenho_id, exercicio_inscricao) DO NOTHING;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  -- Inscrever empenhos liquidados não pagos (processados)
  INSERT INTO public.fin_restos_pagar (empenho_id, exercicio_origem, exercicio_inscricao, tipo, valor_inscrito)
  SELECT id, exercicio, v_exercicio_inscricao, 'processado',
         COALESCE(saldo_pagar, COALESCE(valor_liquidado, 0) - COALESCE(valor_pago, 0))
  FROM public.fin_empenhos
  WHERE exercicio = p_exercicio_origem
    AND COALESCE(saldo_pagar, COALESCE(valor_liquidado, 0) - COALESCE(valor_pago, 0)) > 0
    AND inscrito_rp IS NOT TRUE
  ON CONFLICT (empenho_id, exercicio_inscricao) DO NOTHING;
  
  -- Marcar empenhos como inscritos
  UPDATE public.fin_empenhos
  SET inscrito_rp = TRUE,
      data_inscricao_rp = CURRENT_DATE,
      updated_at = now()
  WHERE exercicio = p_exercicio_origem
    AND inscrito_rp IS NOT TRUE
    AND id IN (SELECT empenho_id FROM public.fin_restos_pagar WHERE exercicio_inscricao = v_exercicio_inscricao);
  
  RETURN v_count;
END;
$$;


--
-- Name: fn_pode_arquivar_processo(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_pode_arquivar_processo(p_processo_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM despachos
    WHERE processo_id = p_processo_id
      AND tipo_despacho = 'conclusivo'
      AND decisao = 'arquivar'
  );
END;
$$;


--
-- Name: fn_proximo_numero_processo(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_proximo_numero_processo(p_ano integer DEFAULT (EXTRACT(year FROM now()))::integer) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  v_sequencial INTEGER;
BEGIN
  SELECT COALESCE(MAX(
    CASE WHEN numero_processo ~ '^\d+$' THEN numero_processo::INTEGER ELSE 0 END
  ), 0) + 1
  INTO v_sequencial
  FROM processos_administrativos
  WHERE ano = p_ano;
  
  RETURN LPAD(v_sequencial::TEXT, 4, '0');
END;
$_$;


--
-- Name: fn_proximo_numero_tombamento(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_proximo_numero_tombamento() RETURNS text
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  v_numero text;
BEGIN
  -- Só quem tem o módulo consome a sequence (evita lacunas abertas por outros usuários).
  IF auth.uid() IS NOT NULL
     AND NOT (public.can_access_module(auth.uid(), 'patrimonio')
              OR public.can_access_module(auth.uid(), 'patrimonio_mobile')) THEN
    RAISE EXCEPTION 'Sem acesso ao módulo de patrimônio' USING ERRCODE = '42501';
  END IF;
  -- Sequence: sem corrida e sem reaproveitamento. O laço só pula um número que alguém
  -- já tenha digitado à mão no mesmo formato.
  LOOP
    v_numero := 'PAT-' || to_char(CURRENT_DATE, 'YYYY') || '-'
             || lpad(nextval('public.seq_tombamento_patrimonio')::text, 6, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM bens_patrimoniais WHERE upper(btrim(numero_patrimonio)) = v_numero);
  END LOOP;
  RETURN v_numero;
END;
$$;


--
-- Name: fn_reativar_provimento_retorno_cessao(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_reativar_provimento_retorno_cessao() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF OLD.ativa = true AND NEW.ativa = false AND NEW.data_retorno IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.vinculos_servidor
                WHERE servidor_id = NEW.servidor_id AND ativo = true AND tipo = 'efetivo') THEN
      UPDATE public.provimentos SET status = 'ativo'
       WHERE servidor_id = NEW.servidor_id AND status = 'suspenso';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: fn_registrar_historico_status_financeiro(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_registrar_historico_status_financeiro() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: fn_update_timestamp_parametros(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_update_timestamp_parametros() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    NEW.updated_at = now();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$;


--
-- Name: fn_validar_arquivamento_processo(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_validar_arquivamento_processo() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.status = 'arquivado' AND OLD.status != 'arquivado' THEN
    IF NOT public.fn_pode_arquivar_processo(NEW.id) THEN
      RAISE EXCEPTION 'Processo não pode ser arquivado sem despacho conclusivo com decisão de arquivamento';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: fn_validar_margem_consignavel(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_validar_margem_consignavel(p_servidor_id uuid) RETURNS TABLE(salario_liquido numeric, margem_total_percentual numeric, margem_total_valor numeric, margem_utilizada numeric, margem_disponivel numeric, percentual_utilizado numeric, dentro_limite boolean)
    LANGUAGE plpgsql STABLE
    SET search_path TO 'public'
    AS $$
DECLARE
  v_liquido NUMERIC;
  v_margem_pct NUMERIC;
  v_utilizada NUMERIC;
BEGIN
  -- coalesce: sem servidor vinculado, meu_servidor_id() é nulo e a comparação daria nulo (o IF não recusaria)
  IF NOT coalesce((auth.uid() IS NOT NULL AND public.can_access_module(auth.uid(), 'rh')
                   AND (public.has_permission_code(auth.uid(), 'rh.contracheques.visualizar')
                        OR public.has_permission_code(auth.uid(), 'financeiro.folha.processar')))
                  OR p_servidor_id = public.meu_servidor_id(), false) THEN
    RAISE EXCEPTION 'fn_validar_margem_consignavel: exige o módulo rh com rh.contracheques.visualizar ou financeiro.folha.processar, ou ser o próprio servidor'
      USING ERRCODE = '42501';
  END IF;

  -- Buscar remuneração líquida do servidor
  SELECT COALESCE(s.remuneracao_bruta, 0) - COALESCE(s.descontos, 0)
  INTO v_liquido
  FROM servidores s WHERE s.id = p_servidor_id;

  -- Buscar percentual da margem
  SELECT COALESCE(valor * 100, 35)
  INTO v_margem_pct
  FROM parametros_folha
  WHERE tipo_parametro = 'margem_consignavel' AND ativo = true
  ORDER BY vigencia_inicio DESC LIMIT 1;

  -- Somar consignações ativas
  SELECT COALESCE(SUM(valor_parcela), 0)
  INTO v_utilizada
  FROM consignacoes
  WHERE servidor_id = p_servidor_id AND ativo = true AND suspenso = false AND quitado = false;

  RETURN QUERY SELECT
    v_liquido,
    v_margem_pct,
    ROUND(v_liquido * v_margem_pct / 100, 2),
    v_utilizada,
    ROUND(v_liquido * v_margem_pct / 100 - v_utilizada, 2),
    CASE WHEN v_liquido > 0 THEN ROUND(v_utilizada / (v_liquido * v_margem_pct / 100) * 100, 2) ELSE 0 END,
    v_utilizada <= ROUND(v_liquido * v_margem_pct / 100, 2);
END;
$$;


--
-- Name: fn_validar_provimento(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_validar_provimento() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_cargo RECORD;
  v_vinculo_ativo RECORD;
  v_provimento_ativo INTEGER;
  v_vagas_ocupadas INTEGER;
BEGIN
  SELECT * INTO v_cargo FROM public.cargos WHERE id = NEW.cargo_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Cargo não encontrado'; END IF;

  IF NEW.status = 'ativo' THEN
    SELECT COUNT(*) INTO v_provimento_ativo
    FROM public.provimentos
    WHERE servidor_id = NEW.servidor_id AND status = 'ativo'
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

    IF v_provimento_ativo > 0 THEN
      RAISE EXCEPTION 'Servidor já possui provimento ativo';
    END IF;
  END IF;

  -- cargo com quadro de vagas: a vaga (trg_provimento_vaga) já garante o limite. Sem vaga, conta só quando o
  -- provimento entra em ativo (nomeação, reativação ou troca de cargo): encerrar ou suspender quem sobrou acima do
  -- quadro nunca é barrado.
  IF NEW.vaga_id IS NULL AND NEW.status = 'ativo'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'ativo' OR OLD.cargo_id IS DISTINCT FROM NEW.cargo_id) THEN
    SELECT COUNT(*) INTO v_vagas_ocupadas
    FROM public.provimentos
    WHERE cargo_id = NEW.cargo_id AND status = 'ativo'
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

    IF v_vagas_ocupadas >= COALESCE(v_cargo.quantidade_vagas, 1) THEN
      RAISE EXCEPTION 'Não há vagas disponíveis para o cargo %', v_cargo.nome;
    END IF;
  END IF;

  SELECT * INTO v_vinculo_ativo
  FROM public.vinculos_funcionais
  WHERE servidor_id = NEW.servidor_id AND ativo = true
  ORDER BY data_inicio DESC LIMIT 1;

  IF v_vinculo_ativo.tipo_vinculo = 'cedido_entrada' THEN
    RAISE EXCEPTION 'Servidor cedido de outro órgão não pode ter nomeação no IDJuv';
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: fn_validar_saldo_empenho(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_validar_saldo_empenho() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $_$
DECLARE
  v_saldo NUMERIC;
BEGIN
  SELECT saldo_disponivel INTO v_saldo
  FROM public.fin_dotacoes
  WHERE id = NEW.dotacao_id;

  IF v_saldo IS NULL THEN
    RAISE EXCEPTION 'Dotação não encontrada (id: %)', NEW.dotacao_id;
  END IF;

  IF NEW.valor_empenhado > v_saldo THEN
    RAISE EXCEPTION 'Valor do empenho (R$ %) excede o saldo disponível da dotação (R$ %)', 
      NEW.valor_empenhado, v_saldo;
  END IF;

  RETURN NEW;
END;
$_$;


--
-- Name: fn_validar_sub_empenho_anulacao(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_validar_sub_empenho_anulacao() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $_$
DECLARE
  v_saldo_liquidar NUMERIC;
BEGIN
  IF NEW.tipo = 'anulacao' THEN
    SELECT COALESCE(saldo_liquidar, valor_empenhado - COALESCE(valor_liquidado, 0))
    INTO v_saldo_liquidar
    FROM public.fin_empenhos
    WHERE id = NEW.empenho_id;
    
    IF NEW.valor > v_saldo_liquidar THEN
      RAISE EXCEPTION 'Valor da anulação (R$ %) excede o saldo a liquidar do empenho (R$ %)',
        NEW.valor, v_saldo_liquidar;
    END IF;
  END IF;
  RETURN NEW;
END;
$_$;


--
-- Name: fn_validar_teto_remuneratorio(numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_validar_teto_remuneratorio(p_remuneracao_bruta numeric) RETURNS TABLE(dentro_teto boolean, valor_teto numeric, valor_excedente numeric, percentual_teto numeric)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_teto NUMERIC;
BEGIN
  SELECT valor INTO v_teto
  FROM parametros_folha
  WHERE tipo_parametro = 'teto_remuneratorio'
    AND ativo = true
    AND vigencia_inicio <= CURRENT_DATE
    AND (vigencia_fim IS NULL OR vigencia_fim >= CURRENT_DATE)
  ORDER BY vigencia_inicio DESC
  LIMIT 1;

  IF v_teto IS NULL THEN
    v_teto := 44008.52; -- Fallback para teto STF 2025
  END IF;

  RETURN QUERY SELECT
    p_remuneracao_bruta <= v_teto,
    v_teto,
    GREATEST(0, p_remuneracao_bruta - v_teto),
    CASE WHEN v_teto > 0 THEN ROUND((p_remuneracao_bruta / v_teto) * 100, 2) ELSE 0 END;
END;
$$;


--
-- Name: fn_validar_vigencia_parametro(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_validar_vigencia_parametro() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_conflito boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM public.config_parametros_valores
        WHERE id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
          AND instituicao_id = NEW.instituicao_id
          AND parametro_codigo = NEW.parametro_codigo
          AND COALESCE(unidade_id::text, '') = COALESCE(NEW.unidade_id::text, '')
          AND COALESCE(tipo_servidor, '') = COALESCE(NEW.tipo_servidor, '')
          AND COALESCE(servidor_id::text, '') = COALESCE(NEW.servidor_id::text, '')
          AND ativo = true
          AND (
              (NEW.vigencia_inicio >= vigencia_inicio AND (vigencia_fim IS NULL OR NEW.vigencia_inicio <= vigencia_fim))
              OR (NEW.vigencia_fim IS NOT NULL AND NEW.vigencia_fim >= vigencia_inicio AND (vigencia_fim IS NULL OR NEW.vigencia_fim <= vigencia_fim))
              OR (NEW.vigencia_inicio <= vigencia_inicio AND (NEW.vigencia_fim IS NULL OR NEW.vigencia_fim >= COALESCE(vigencia_fim, '9999-12-31'::date)))
          )
    ) INTO v_conflito;
    
    IF v_conflito THEN
        RAISE EXCEPTION 'Conflito de vigência: já existe parâmetro ativo para este código/nível no período informado.';
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: fn_verificar_saldo_dotacao(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_verificar_saldo_dotacao() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: folha_avos_13(date, date, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.folha_avos_13(p_inicio date, p_fim date, p_ano integer) RETURNS integer
    LANGUAGE sql IMMUTABLE
    AS $$
  SELECT count(*)::int
    FROM generate_series(1, 12) m
   WHERE public.folha_dias_comerciais(p_inicio, p_fim, make_date(p_ano, m, 1),
                                      (make_date(p_ano, m, 1) + interval '1 month - 1 day')::date) >= 15;
$$;


--
-- Name: folha_dias_comerciais(date, date, date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.folha_dias_comerciais(p_inicio date, p_fim date, p_mes_ini date, p_mes_fim date) RETURNS integer
    LANGUAGE sql IMMUTABLE
    AS $$
  SELECT CASE
    WHEN p_inicio IS NULL OR p_fim IS NULL THEN 0
    ELSE (
      SELECT CASE WHEN x.i > x.f THEN 0
                  ELSE greatest(0,
                         (CASE WHEN x.f = p_mes_fim THEN 30 ELSE least(EXTRACT(day FROM x.f)::int, 30) END)
                         - least(EXTRACT(day FROM x.i)::int, 30) + 1) END
        FROM (SELECT greatest(p_inicio, p_mes_ini) AS i, least(p_fim, p_mes_fim) AS f) x)
  END;
$$;


--
-- Name: folha_esta_bloqueada(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.folha_esta_bloqueada(p_folha_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT status = 'fechada'
  FROM public.folhas_pagamento
  WHERE id = p_folha_id;
$$;


--
-- Name: folha_item(text, text, numeric, text, numeric, numeric, text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.folha_item(p_descricao text, p_tipo text, p_valor numeric, p_referencia text DEFAULT NULL::text, p_base numeric DEFAULT NULL::numeric, p_percentual numeric DEFAULT NULL::numeric, p_origem text DEFAULT 'automatico'::text, p_rubrica uuid DEFAULT NULL::uuid) RETURNS jsonb
    LANGUAGE sql IMMUTABLE
    AS $$
  SELECT jsonb_build_object('descricao', p_descricao, 'tipo', p_tipo, 'valor', p_valor, 'referencia', p_referencia,
                            'base', p_base, 'percentual', p_percentual, 'origem', p_origem, 'rubrica_id', p_rubrica);
$$;


--
-- Name: folha_montar_ficha(uuid, uuid, text, date, date, jsonb, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.folha_montar_ficha(p_servidor_id uuid, p_provimento_id uuid, p_tipo text, p_d1 date, p_d2 date, p_manuais jsonb, p_tabelas jsonb) RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_srv record;
  v_prv record;
  v_venc numeric;
  v_itens jsonb := '[]'::jsonb;
  v_inc jsonb := '[]'::jsonb;
  v_ano int := EXTRACT(YEAR FROM p_d2)::int;
  v_ini date; v_fim date; v_dias int; v_ini_pago date; v_fim_pago date; v_venc_prop numeric := 0;
  v_faltas int := 0; v_dias_lic int := 0; v_dias_ces int := 0; v_rest int;
  v_d_falta numeric := 0; v_d_lic numeric := 0; v_d_ces numeric := 0; v_terco numeric := 0; v_abono numeric := 0;
  v_nferias int := 0;
  v_man jsonb; v_man_val numeric; v_man_inss boolean; v_man_irrf boolean;
  v_man_prov_inss numeric := 0; v_man_prov_irrf numeric := 0; v_man_prov numeric := 0; v_man_desc numeric := 0;
  v_liq_dias numeric := 0;
  v_base_inss numeric := 0; v_inss numeric := 0; v_qdep int := 0; v_ded_unit numeric; v_ded numeric := 0;
  v_base_irrf numeric := 0; v_irrf numeric := 0;
  v_consig numeric := 0; v_pensao numeric := 0; v_c record; v_p record; v_base_pensao numeric; v_val numeric;
  v_prov numeric := 0; v_desc numeric := 0; v_liq numeric;
  v_teto numeric;
  v_avos int; v_v13 numeric; v_adiant numeric := 0;
  v_adm date; v_pa_ini date; v_meses int; v_resto int; v_avos_fer int; v_dias_prop numeric; v_dias_goz numeric; v_dias_ind numeric;
  v_val_fer numeric; v_pa_completos int; v_dias_reg numeric;
  v_tem_inss boolean := coalesce((p_tabelas ->> 'inss')::boolean, false);
  v_tem_irrf boolean := coalesce((p_tabelas ->> 'irrf')::boolean, false);
  v_ded_cfg numeric := nullif(p_tabelas ->> 'ded_dep', '')::numeric;
BEGIN
  SELECT s.data_admissao, s.banco_codigo, s.banco_conta INTO v_srv FROM public.servidores s WHERE s.id = p_servidor_id;
  SELECT p.*, coalesce(p.data_exercicio, p.data_nomeacao) AS inicio, coalesce(c.vencimento_base, 0) AS venc
    INTO v_prv
    FROM public.provimentos p JOIN public.cargos c ON c.id = p.cargo_id
   WHERE p.id = p_provimento_id;
  v_venc := v_prv.venc;
  v_ini := v_prv.inicio;
  v_fim := coalesce(v_prv.data_encerramento, p_d2);

  IF v_srv.banco_codigo IS NULL OR v_srv.banco_conta IS NULL THEN
    v_inc := v_inc || jsonb_build_array('sem_dados_bancarios');
  END IF;
  IF NOT v_tem_inss THEN v_inc := v_inc || jsonb_build_array('tabela_inss_ausente'); END IF;
  IF NOT v_tem_irrf THEN v_inc := v_inc || jsonb_build_array('tabela_irrf_ausente'); END IF;

  -- lançamentos manuais do servidor (guardados antes de refazer as fichas)
  FOR v_man IN SELECT e FROM jsonb_array_elements(coalesce(p_manuais, '[]'::jsonb)) e
                WHERE (e ->> 'servidor_id')::uuid = p_servidor_id LOOP
    v_man_val := coalesce((v_man ->> 'valor')::numeric, 0);
    v_man_inss := true; v_man_irrf := true;
    IF (v_man ->> 'rubrica_id') IS NOT NULL THEN
      SELECT coalesce(r.incide_inss, true), coalesce(r.incide_irrf, true) INTO v_man_inss, v_man_irrf
        FROM public.rubricas r WHERE r.id = (v_man ->> 'rubrica_id')::uuid;
    END IF;
    v_itens := v_itens || jsonb_build_array(public.folha_item(v_man ->> 'descricao', v_man ->> 'tipo', v_man_val,
                  v_man ->> 'referencia', nullif(v_man ->> 'base_calculo', '')::numeric,
                  nullif(v_man ->> 'percentual', '')::numeric, 'manual', nullif(v_man ->> 'rubrica_id', '')::uuid));
    IF v_man ->> 'tipo' = 'provento' THEN
      v_man_prov := v_man_prov + v_man_val;
      IF v_man_inss THEN v_man_prov_inss := v_man_prov_inss + v_man_val; END IF;
      IF v_man_irrf THEN v_man_prov_irrf := v_man_prov_irrf + v_man_val; END IF;
    ELSE
      v_man_desc := v_man_desc + v_man_val;
    END IF;
  END LOOP;

  -- ===================================================================== MENSAL
  IF p_tipo = 'mensal' THEN
    v_dias := public.folha_dias_comerciais(v_ini, v_fim, p_d1, p_d2);
    v_venc_prop := round(v_venc / 30 * v_dias, 2);
    v_ini_pago := greatest(v_ini, p_d1);
    v_fim_pago := least(v_fim, p_d2);
    v_itens := jsonb_build_array(public.folha_item('Vencimento', 'provento', v_venc_prop, v_dias || '/30 dias', v_venc)) || v_itens;

    SELECT fm.dias_falta INTO v_faltas FROM public.frequencia_mensal fm
     WHERE fm.servidor_id = p_servidor_id AND fm.ano = v_ano AND fm.mes = EXTRACT(MONTH FROM p_d2)::int;
    IF NOT FOUND THEN v_inc := v_inc || jsonb_build_array('sem_frequencia_do_mes'); END IF;
    v_faltas := coalesce(v_faltas, 0);

    SELECT coalesce(sum(greatest(0, least(coalesce(l.data_fim, v_fim_pago), v_fim_pago)
                                    - greatest(l.data_inicio, v_ini_pago) + 1)), 0)::int
      INTO v_dias_lic
      FROM public.licencas_afastamentos l
     WHERE l.servidor_id = p_servidor_id AND l.status IN ('ativa', 'prorrogada', 'encerrada')
       AND NOT public.afastamento_remunerado(l.tipo_afastamento::text, l.tipo_licenca::text, p_d2);

    SELECT coalesce(sum(greatest(0, least(coalesce(c.data_retorno, c.data_fim, v_fim_pago), v_fim_pago)
                                    - greatest(c.data_inicio, v_ini_pago) + 1)), 0)::int
      INTO v_dias_ces
      FROM public.cessoes c
     WHERE c.servidor_id = p_servidor_id AND c.tipo = 'saida' AND c.onus = 'destino'
       AND c.data_inicio <= v_fim_pago AND coalesce(c.data_retorno, c.data_fim, v_fim_pago) >= v_ini_pago;
    IF EXISTS (SELECT 1 FROM public.cessoes c WHERE c.servidor_id = p_servidor_id AND c.tipo = 'saida' AND c.onus IS NULL
                  AND c.data_inicio <= v_fim_pago AND coalesce(c.data_retorno, c.data_fim, v_fim_pago) >= v_ini_pago) THEN
      v_inc := v_inc || jsonb_build_array('onus_da_cessao_nao_informado');
    END IF;

    -- os dias descontados nunca passam dos dias pagos
    v_rest := v_dias;
    v_faltas := least(v_faltas, v_rest); v_rest := v_rest - v_faltas;
    v_dias_lic := least(v_dias_lic, v_rest); v_rest := v_rest - v_dias_lic;
    v_dias_ces := least(v_dias_ces, v_rest);
    v_d_falta := round(v_venc / 30 * v_faltas, 2);
    v_d_lic := round(v_venc / 30 * v_dias_lic, 2);
    v_d_ces := round(v_venc / 30 * v_dias_ces, 2);
    IF v_faltas > 0 THEN
      v_itens := v_itens || jsonb_build_array(public.folha_item('Desconto de faltas', 'desconto', v_d_falta, v_faltas || ' dia(s)', v_venc));
    END IF;
    IF v_dias_lic > 0 THEN
      v_itens := v_itens || jsonb_build_array(public.folha_item('Desconto de licença/afastamento sem remuneração', 'desconto', v_d_lic, v_dias_lic || ' dia(s)', v_venc));
    END IF;
    IF v_dias_ces > 0 THEN
      v_itens := v_itens || jsonb_build_array(public.folha_item('Desconto de cessão com ônus no destino', 'desconto', v_d_ces, v_dias_ces || ' dia(s)', v_venc));
    END IF;

    -- férias iniciadas no mês: 1/3 constitucional (tributável só no IRRF) e abono pecuniário (indenizatório)
    SELECT coalesce(sum(round(v_venc / 30 * f.dias_gozados / 3.0, 2)), 0),
           coalesce(sum(round(v_venc / 30 * coalesce(f.dias_abono, 0) * 4.0 / 3.0, 2)), 0), count(*)
      INTO v_terco, v_abono, v_nferias
      FROM public.ferias_servidor f
     WHERE f.servidor_id = p_servidor_id AND f.data_inicio BETWEEN p_d1 AND p_d2
       AND f.status IN ('programada', 'em_gozo', 'concluida');
    IF v_terco > 0 THEN
      v_itens := v_itens || jsonb_build_array(public.folha_item('Adicional de 1/3 de férias', 'provento', v_terco, NULL, v_venc));
    END IF;
    IF v_abono > 0 THEN
      v_itens := v_itens || jsonb_build_array(public.folha_item('Abono pecuniário de férias (com 1/3)', 'provento', v_abono, NULL, v_venc));
    END IF;

    v_liq_dias := v_venc_prop - v_d_falta - v_d_lic - v_d_ces;
    v_base_inss := greatest(v_liq_dias + v_man_prov_inss, 0);
    IF v_tem_inss THEN v_inss := public.calcular_inss_servidor(v_base_inss, p_d2); END IF;

    v_qdep := public.count_dependentes_irrf(p_servidor_id, p_d2);
    IF v_qdep > 0 AND v_ded_cfg IS NULL THEN
      v_inc := v_inc || jsonb_build_array('deducao_dependente_nao_configurada');
    END IF;
    v_ded := v_qdep * coalesce(v_ded_cfg, 0);
    v_base_irrf := greatest(v_liq_dias + v_terco + v_man_prov_irrf - v_inss - v_ded, 0);
    IF v_tem_irrf THEN v_irrf := public.calcular_irrf(v_base_irrf, p_d2); END IF;

    IF v_inss > 0 THEN
      v_itens := v_itens || jsonb_build_array(public.folha_item('INSS / previdência do servidor', 'desconto', v_inss, NULL, v_base_inss));
    END IF;
    IF v_irrf > 0 THEN
      v_itens := v_itens || jsonb_build_array(public.folha_item('IRRF', 'desconto', v_irrf, v_qdep || ' dependente(s)', v_base_irrf));
    END IF;

    -- consignações ativas na competência
    FOR v_c IN SELECT * FROM public.consignacoes c
                WHERE c.servidor_id = p_servidor_id AND coalesce(c.ativo, true) AND NOT coalesce(c.suspenso, false)
                  AND NOT coalesce(c.quitado, false) AND c.data_inicio <= p_d2 AND (c.data_fim IS NULL OR c.data_fim >= p_d1)
                  AND coalesce(c.parcelas_pagas, 0) < c.total_parcelas LOOP
      v_consig := v_consig + v_c.valor_parcela;
      v_itens := v_itens || jsonb_build_array(public.folha_item(
        'Consignação — ' || v_c.consignataria_nome, 'desconto', v_c.valor_parcela,
        (coalesce(v_c.parcelas_pagas, 0) + 1) || '/' || v_c.total_parcelas));
    END LOOP;

    -- pensão alimentícia (percentual é número "30" = 30%; base líquida = proventos do mês − faltas − INSS − IRRF)
    FOR v_p IN SELECT * FROM public.pensoes_alimenticias pa
                WHERE pa.servidor_id = p_servidor_id AND coalesce(pa.ativo, true) AND pa.data_inicio <= p_d2
                  AND (pa.data_fim IS NULL OR pa.data_fim >= p_d1) ORDER BY pa.prioridade NULLS LAST LOOP
      IF lower(v_p.tipo_calculo) LIKE 'perc%' THEN
        v_base_pensao := CASE WHEN lower(coalesce(v_p.base_calculo, '')) = 'bruto'
                              THEN v_liq_dias + v_terco + v_man_prov
                              ELSE greatest(v_liq_dias + v_terco + v_man_prov - v_inss - v_irrf, 0) END;
        v_val := round(v_base_pensao * coalesce(v_p.percentual, 0) / 100, 2);
      ELSE
        v_val := coalesce(v_p.valor_fixo, 0);
      END IF;
      v_pensao := v_pensao + v_val;
      v_itens := v_itens || jsonb_build_array(public.folha_item('Pensão alimentícia — ' || v_p.beneficiario_nome, 'desconto', v_val,
        NULL, v_base_pensao, CASE WHEN lower(v_p.tipo_calculo) LIKE 'perc%' THEN v_p.percentual END));
    END LOOP;

    v_prov := v_venc_prop + v_terco + v_abono + v_man_prov;
    v_desc := v_d_falta + v_d_lic + v_d_ces + v_inss + v_irrf + v_consig + v_pensao + v_man_desc;

  -- ================================================================== 13º SALÁRIO
  ELSIF p_tipo IN ('13_1a_parcela', '13_2a_parcela') THEN
    v_avos := public.folha_avos_13(v_ini, least(coalesce(v_prv.data_encerramento, make_date(v_ano, 12, 31)), make_date(v_ano, 12, 31)), v_ano);
    v_v13 := round(v_venc / 12 * v_avos, 2);
    IF p_tipo = '13_1a_parcela' THEN
      v_prov := round(v_v13 * 0.5, 2);
      v_itens := v_itens || jsonb_build_array(public.folha_item('13º salário — 1ª parcela (adiantamento)', 'provento', v_prov, v_avos || '/12 avos', v_venc));
      v_base_inss := 0; v_base_irrf := 0;
    ELSE
      v_prov := v_v13;
      v_itens := v_itens || jsonb_build_array(public.folha_item('13º salário', 'provento', v_v13, v_avos || '/12 avos', v_venc));
      SELECT coalesce(sum(i.valor), 0) INTO v_adiant
        FROM public.fichas_financeiras f JOIN public.itens_ficha_financeira i ON i.ficha_id = f.id
       WHERE f.servidor_id = p_servidor_id AND f.competencia_ano = v_ano AND f.tipo_folha = '13_1a_parcela'
         AND i.tipo = 'provento';
      IF v_adiant = 0 AND v_avos > 0 THEN v_inc := v_inc || jsonb_build_array('primeira_parcela_do_13_nao_localizada'); END IF;
      v_base_inss := v_v13;
      IF v_tem_inss THEN v_inss := public.calcular_inss_servidor(v_base_inss, p_d2); END IF;
      v_qdep := public.count_dependentes_irrf(p_servidor_id, p_d2);
      IF v_qdep > 0 AND v_ded_cfg IS NULL THEN v_inc := v_inc || jsonb_build_array('deducao_dependente_nao_configurada'); END IF;
      v_ded := v_qdep * coalesce(v_ded_cfg, 0);
      v_base_irrf := greatest(v_v13 - v_inss - v_ded, 0);
      IF v_tem_irrf THEN v_irrf := public.calcular_irrf(v_base_irrf, p_d2); END IF;
      IF v_adiant > 0 THEN
        v_itens := v_itens || jsonb_build_array(public.folha_item('Adiantamento do 13º (1ª parcela)', 'desconto', v_adiant));
      END IF;
      IF v_inss > 0 THEN
        v_itens := v_itens || jsonb_build_array(public.folha_item('INSS sobre o 13º', 'desconto', v_inss, NULL, v_base_inss));
      END IF;
      IF v_irrf > 0 THEN
        v_itens := v_itens || jsonb_build_array(public.folha_item('IRRF sobre o 13º (tributação exclusiva)', 'desconto', v_irrf, v_qdep || ' dependente(s)', v_base_irrf));
      END IF;
    END IF;
    v_prov := v_prov + v_man_prov;
    v_desc := v_adiant + v_inss + v_irrf + v_man_desc;
    v_liq_dias := v_prov;

  -- ===================================================================== RESCISÃO
  ELSE
    v_fim := v_prv.data_encerramento;
    v_avos := public.folha_avos_13(v_ini, v_fim, v_ano);
    v_v13 := round(v_venc / 12 * v_avos, 2);

    -- férias proporcionais: do último aniversário de admissão até o desligamento
    v_adm := coalesce(v_srv.data_admissao, v_ini);
    v_pa_ini := (v_adm + ((EXTRACT(YEAR FROM v_fim) - EXTRACT(YEAR FROM v_adm))::int * interval '1 year'))::date;
    IF v_pa_ini > v_fim THEN v_pa_ini := (v_pa_ini - interval '1 year')::date; END IF;
    v_meses := (EXTRACT(YEAR FROM age(v_fim + 1, v_pa_ini)) * 12 + EXTRACT(MONTH FROM age(v_fim + 1, v_pa_ini)))::int;
    v_resto := EXTRACT(DAY FROM age(v_fim + 1, v_pa_ini))::int;
    v_avos_fer := least(v_meses + CASE WHEN v_resto >= 15 THEN 1 ELSE 0 END, 12);
    v_dias_prop := 30 * v_avos_fer / 12.0;
    SELECT coalesce(sum(f.dias_gozados + coalesce(f.dias_abono, 0)), 0) INTO v_dias_goz
      FROM public.ferias_servidor f
     WHERE f.servidor_id = p_servidor_id AND f.status <> 'cancelada'
       AND f.periodo_aquisitivo_inicio BETWEEN v_pa_ini - 15 AND v_pa_ini + 15;
    v_dias_ind := greatest(v_dias_prop - v_dias_goz, 0);
    v_val_fer := round(v_venc / 30 * v_dias_ind, 2);

    -- períodos aquisitivos completos anteriores sem férias registradas: apurar à parte (não paga sozinho)
    v_pa_completos := greatest((EXTRACT(YEAR FROM age(v_pa_ini, v_adm)))::int, 0);
    SELECT coalesce(sum(f.dias_gozados + coalesce(f.dias_abono, 0)), 0) INTO v_dias_reg
      FROM public.ferias_servidor f
     WHERE f.servidor_id = p_servidor_id AND f.status <> 'cancelada' AND f.periodo_aquisitivo_inicio < v_pa_ini - 15;
    IF v_pa_completos * 30 > v_dias_reg THEN v_inc := v_inc || jsonb_build_array('ferias_vencidas_a_apurar'); END IF;
    v_inc := v_inc || jsonb_build_array('rescisao_conferir_calculo');

    IF v_val_fer > 0 THEN
      v_itens := v_itens || jsonb_build_array(
        public.folha_item('Férias proporcionais (indenizadas)', 'provento', v_val_fer, round(v_dias_ind, 2) || ' dia(s)', v_venc),
        public.folha_item('Adicional de 1/3 sobre férias proporcionais', 'provento', round(v_val_fer / 3.0, 2)));
    END IF;
    IF v_v13 > 0 THEN
      v_itens := v_itens || jsonb_build_array(public.folha_item('13º salário proporcional', 'provento', v_v13, v_avos || '/12 avos', v_venc));
    END IF;
    SELECT coalesce(sum(i.valor), 0) INTO v_adiant
      FROM public.fichas_financeiras f JOIN public.itens_ficha_financeira i ON i.ficha_id = f.id
     WHERE f.servidor_id = p_servidor_id AND f.competencia_ano = v_ano AND f.tipo_folha = '13_1a_parcela' AND i.tipo = 'provento';
    v_base_inss := v_v13;
    IF v_tem_inss THEN v_inss := public.calcular_inss_servidor(v_base_inss, p_d2); END IF;
    v_qdep := public.count_dependentes_irrf(p_servidor_id, p_d2);
    IF v_qdep > 0 AND v_ded_cfg IS NULL THEN v_inc := v_inc || jsonb_build_array('deducao_dependente_nao_configurada'); END IF;
    v_ded := v_qdep * coalesce(v_ded_cfg, 0);
    v_base_irrf := greatest(v_v13 - v_inss - v_ded, 0);
    IF v_tem_irrf THEN v_irrf := public.calcular_irrf(v_base_irrf, p_d2); END IF;
    IF v_adiant > 0 THEN
      v_itens := v_itens || jsonb_build_array(public.folha_item('Adiantamento do 13º (1ª parcela)', 'desconto', v_adiant));
    END IF;
    IF v_inss > 0 THEN v_itens := v_itens || jsonb_build_array(public.folha_item('INSS sobre o 13º', 'desconto', v_inss, NULL, v_base_inss)); END IF;
    IF v_irrf > 0 THEN v_itens := v_itens || jsonb_build_array(public.folha_item('IRRF sobre o 13º (tributação exclusiva)', 'desconto', v_irrf, NULL, v_base_irrf)); END IF;
    v_prov := v_val_fer + round(v_val_fer / 3.0, 2) + v_v13 + v_man_prov;
    v_desc := v_adiant + v_inss + v_irrf + v_man_desc;
  END IF;

  v_liq := v_prov - v_desc;
  IF v_liq < 0 THEN v_inc := v_inc || jsonb_build_array('liquido_negativo'); END IF;
  SELECT valor INTO v_teto FROM public.parametros_folha
   WHERE tipo_parametro = 'teto_remuneratorio' AND vigencia_inicio <= p_d2 AND (vigencia_fim IS NULL OR vigencia_fim >= p_d2)
   ORDER BY vigencia_inicio DESC LIMIT 1;
  IF v_teto IS NOT NULL AND v_prov > v_teto THEN v_inc := v_inc || jsonb_build_array('acima_do_teto_remuneratorio'); END IF;

  RETURN jsonb_build_object(
    'itens', v_itens, 'inconsistencias', v_inc, 'vencimento_base', v_venc,
    'total_proventos', round(v_prov, 2), 'total_descontos', round(v_desc, 2), 'valor_liquido', round(v_liq, 2),
    'base_inss', round(v_base_inss, 2), 'valor_inss', round(v_inss, 2),
    'base_irrf', round(v_base_irrf, 2), 'valor_irrf', round(v_irrf, 2),
    'quantidade_dependentes', v_qdep, 'valor_deducao_dependentes', round(v_ded, 2));
END;
$$;


--
-- Name: folhas_proteger_exclusao(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.folhas_proteger_exclusao() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF OLD.status = 'fechada' AND NOT public.usuario_eh_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Folha fechada: não é possível excluir a folha' USING ERRCODE = '42501';
  END IF;
  RETURN OLD;
END;
$$;


--
-- Name: folhas_proteger_fechamento(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.folhas_proteger_fechamento() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'fechada' AND NOT public.usuario_pode_fechar_folha(auth.uid()) THEN
      RAISE EXCEPTION 'Sem permissão para fechar a folha' USING ERRCODE = '42501';
    END IF;
    IF (NEW.status = 'reaberta' OR OLD.status = 'fechada') AND NOT public.usuario_pode_reabrir_folha(auth.uid()) THEN
      RAISE EXCEPTION 'Apenas administradores reabrem folhas' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: forcar_campos_iniciais(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.forcar_campos_iniciais() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  ov jsonb := '{}'::jsonb;
  kv text;
  i int;
  isento boolean;
  partes text[];
  ref text[];
  posse uuid;
BEGIN
  IF coalesce(current_setting('role', true), 'none') NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;
  IF TG_ARGV[0] LIKE 'perm:%' THEN
    partes := string_to_array(TG_ARGV[0], ':');
    isento := public.can_access_module(auth.uid(), partes[2])
      AND EXISTS (SELECT 1 FROM unnest(string_to_array(partes[3], '|')) AS c(codigo)
                  WHERE public.has_permission_code(auth.uid(), c.codigo));
    IF isento AND NOT public.is_admin_user(auth.uid()) THEN
      IF partes[4] = 'usuario' THEN
        -- posse por usuário: a coluna servidor_id guarda o id de profiles
        IF (to_jsonb(NEW) ->> 'servidor_id')::uuid = auth.uid() THEN
          isento := false;
        END IF;
      ELSE
        IF partes[4] IS NOT NULL THEN
          ref := string_to_array(partes[4], '.');
          EXECUTE format('SELECT servidor_id FROM public.%I WHERE id = $1', ref[1])
            INTO posse USING (to_jsonb(NEW) ->> ref[2])::uuid;
        ELSE
          posse := (to_jsonb(NEW) ->> 'servidor_id')::uuid;
        END IF;
        IF public.eh_meu_servidor(posse) THEN
          isento := false;
        END IF;
      END IF;
    END IF;
  ELSE
    isento := public.can_access_module(auth.uid(), TG_ARGV[0]);
  END IF;
  IF NOT isento THEN
    FOR i IN 1 .. TG_NARGS - 1 LOOP
      kv := TG_ARGV[i];
      IF to_jsonb(NEW) ? split_part(kv, '=', 1) THEN
        ov := ov || jsonb_build_object(
          split_part(kv, '=', 1),
          CASE split_part(kv, '=', 2) WHEN 'NULL' THEN NULL WHEN '@uid' THEN auth.uid()::text ELSE split_part(kv, '=', 2) END
        );
      END IF;
    END LOOP;
    NEW := jsonb_populate_record(NEW, to_jsonb(NEW) || ov);
  END IF;
  RETURN NEW;
END;
$_$;


--
-- Name: frequencia_competencia_travada(uuid, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.frequencia_competencia_travada(p_servidor_id uuid, p_data date) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  -- mesma regra de lancamentoBloqueado() (src/lib/frequenciaFluxo.ts): competência consolidada, ou fechamento do
  -- servidor consolidado pelo RH e não reaberto
  SELECT EXISTS (
           SELECT 1 FROM public.config_fechamento_frequencia c
            WHERE c.ano = EXTRACT(YEAR FROM p_data)::int AND c.mes = EXTRACT(MONTH FROM p_data)::int
              AND c.status = 'consolidado')
      OR EXISTS (
           SELECT 1 FROM public.frequencia_fechamento f
            WHERE f.servidor_id = p_servidor_id
              AND f.ano = EXTRACT(YEAR FROM p_data)::int AND f.mes = EXTRACT(MONTH FROM p_data)::int
              AND coalesce(f.consolidado_rh, false) AND NOT coalesce(f.reaberto, false));
$$;


--
-- Name: fundamento_lancamento(text[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fundamento_lancamento(p_modulos text[]) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_mods text[];
  v_chave text;
  v_guc text;
  v_cache text;
  v_papel_sessao text := coalesce(current_setting('role', true), 'none');
  c jsonb;
  v_uid uuid;
  v_srv uuid;
  v_data date := public.data_local();
  v_modo text;
  v_unid uuid;
  f jsonb;
  r record;
BEGIN
  SELECT array_agg(u.m ORDER BY u.o) INTO v_mods
    FROM (SELECT x.m, min(x.o) AS o FROM unnest(p_modulos) WITH ORDINALITY AS x(m, o)
           WHERE x.m IS NOT NULL AND btrim(x.m) <> '' GROUP BY x.m) u;
  IF v_mods IS NULL THEN
    RETURN NULL;
  END IF;
  v_chave := coalesce(auth.uid()::text, '-') || '|' || v_papel_sessao || '|'
             || coalesce(current_setting('lancamento.geracao', true), '');
  v_guc := 'lancamento.m_' || md5(array_to_string(v_mods, ','));
  v_cache := current_setting(v_guc, true);
  IF v_cache IS NOT NULL AND left(v_cache, length(v_chave) + 1) = v_chave || chr(10) THEN
    RETURN substr(v_cache, length(v_chave) + 2)::jsonb;
  END IF;

  SELECT CASE max(CASE rl.modo WHEN 'exigir' THEN 2 WHEN 'registrar' THEN 1 ELSE 0 END)
           WHEN 2 THEN 'exigir' WHEN 1 THEN 'registrar' ELSE 'desligado' END
    INTO v_modo
    FROM public.regra_lancamento rl
   WHERE rl.modulo::text = ANY (v_mods);
  v_modo := coalesce(v_modo, 'desligado');

  c := public.trilha_contexto();
  v_uid := (c ->> 'user_id')::uuid;
  v_srv := (c ->> 'servidor_id')::uuid;

  IF v_uid IS NULL THEN
    f := CASE v_papel_sessao
           WHEN 'anon' THEN jsonb_build_object('permitido', true, 'via', 'anonimo')
           WHEN 'authenticated' THEN jsonb_build_object('permitido', false, 'via', 'negado_sem_login', 'modulo', v_mods[1])
           ELSE jsonb_build_object('permitido', true, 'via', 'sistema')
         END;
  ELSIF v_srv IS NULL THEN
    f := jsonb_build_object('permitido', false, 'via', 'negado_sem_servidor', 'modulo', v_mods[1]);
  ELSE
    -- 1. lotação (ou cessão de entrada) vigente numa unidade do setor, não lançada pelo próprio servidor
    SELECT lv.origem, lv.registro_id, lv.unidade_id, sm.unidade_id AS setor_id, sm.modulo::text AS modulo,
           lv.ato_tipo, lv.ato_numero, lv.ato_data, lv.ato_doe_numero, lv.ato_doe_data
      INTO r
      FROM public.lotacao_vigente(v_srv, v_data) lv
      JOIN public.setores_modulo sm
        ON sm.ativo AND sm.modulo::text = ANY (v_mods)
       AND (sm.unidade_id = lv.unidade_id
            OR (sm.inclui_subordinadas AND sm.unidade_id = ANY (public.unidade_e_superiores(lv.unidade_id))))
     WHERE lv.created_by_servidor_id IS DISTINCT FROM v_srv
     ORDER BY array_position(v_mods, sm.modulo::text), (lv.origem = 'cessao'), lv.data_inicio DESC
     LIMIT 1;
    IF FOUND THEN
      f := jsonb_build_object('permitido', true, 'via', 'lotacao', 'modulo', r.modulo, 'unidade_id', r.unidade_id,
                              'setor_unidade_id', r.setor_id,
                              CASE WHEN r.origem = 'cessao' THEN 'cessao_id' ELSE 'lotacao_id' END, r.registro_id,
                              'ato', nullif(jsonb_strip_nulls(jsonb_build_object('tipo', r.ato_tipo, 'numero', r.ato_numero,
                                'data', r.ato_data, 'doe_numero', r.ato_doe_numero, 'doe_data', r.ato_doe_data)), '{}'::jsonb));
    ELSE
      -- 2. designação aprovada (por outra pessoa), ativa, vigente e com ato para uma unidade do setor
      SELECT d.id, d.unidade_destino_id, sm.unidade_id AS setor_id, sm.modulo::text AS modulo,
             d.ato_tipo, d.ato_numero, d.ato_data, d.ato_doe_numero, d.ato_doe_data
        INTO r
        FROM public.designacoes d
        JOIN public.setores_modulo sm
          ON sm.ativo AND sm.modulo::text = ANY (v_mods)
         AND (sm.unidade_id = d.unidade_destino_id
              OR (sm.inclui_subordinadas AND sm.unidade_id = ANY (public.unidade_e_superiores(d.unidade_destino_id))))
       WHERE d.servidor_id = v_srv AND d.status = 'aprovada' AND d.ativo IS NOT FALSE
         AND d.data_inicio <= v_data AND (d.data_fim IS NULL OR d.data_fim >= v_data)
         AND nullif(btrim(d.ato_numero), '') IS NOT NULL AND d.ato_data IS NOT NULL
         AND d.aprovado_por IS NOT NULL AND d.aprovado_por IS DISTINCT FROM d.created_by
         AND d.aprovado_por <> v_uid
         AND NOT EXISTS (SELECT 1 FROM public.profiles pa WHERE pa.id = d.aprovado_por AND pa.servidor_id = d.servidor_id)
       ORDER BY array_position(v_mods, sm.modulo::text), d.data_inicio DESC
       LIMIT 1;
      IF FOUND THEN
        f := jsonb_build_object('permitido', true, 'via', 'designacao', 'modulo', r.modulo, 'unidade_id', r.unidade_destino_id,
                                'setor_unidade_id', r.setor_id, 'designacao_id', r.id,
                                'ato', jsonb_strip_nulls(jsonb_build_object('tipo', r.ato_tipo, 'numero', r.ato_numero,
                                  'data', r.ato_data, 'doe_numero', r.ato_doe_numero, 'doe_data', r.ato_doe_data)));
      ELSE
        SELECT lv.unidade_id INTO v_unid FROM public.lotacao_vigente(v_srv, v_data) lv LIMIT 1;
        f := jsonb_build_object('permitido', false, 'via', 'negado_setor', 'modulo', v_mods[1], 'unidade_id', v_unid);
      END IF;
    END IF;
  END IF;

  f := jsonb_strip_nulls(f || jsonb_build_object('modo', v_modo, 'modulos', to_jsonb(v_mods), 'servidor_id', v_srv,
                                                 'data', v_data));
  PERFORM set_config(v_guc, v_chave || chr(10) || f::text, true);
  RETURN f;
END;
$$;


--
-- Name: FUNCTION fundamento_lancamento(p_modulos text[]); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fundamento_lancamento(p_modulos text[]) IS 'Fundamento do login atual para lançar nos módulos (lotação, designação, sistema, anônimo ou negado), com o modo da regra; cache por transação';


--
-- Name: fundamento_linha(text, text, jsonb, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fundamento_linha(p_tabela text, p_op text, p_novo jsonb, p_velho jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  c jsonb := public.trilha_contexto();
  v_uid uuid := (c ->> 'user_id')::uuid;
  v_srv uuid := (c ->> 'servidor_id')::uuid;
  v_via text;
  v_mudou text[];
  v_decisao text[];
BEGIN
  IF v_uid IS NULL OR v_srv IS NULL THEN
    RETURN NULL;
  END IF;
  IF p_op = 'UPDATE' THEN
    SELECT array_agg(k) INTO v_mudou
      FROM jsonb_object_keys(p_novo) AS k
     WHERE (p_novo -> k) IS DISTINCT FROM (p_velho -> k)
       AND k NOT IN ('updated_at', 'updated_by', 'updated_by_servidor_id');
  END IF;

  -- autoatendimento
  IF p_op = 'INSERT' THEN
    v_decisao := CASE p_tabela
      WHEN 'solicitacoes_abono' THEN ARRAY['aprovado_chefia_por', 'aprovado_chefia_em', 'aprovado_rh_por', 'aprovado_rh_em',
                                           'motivo_rejeicao']
      WHEN 'documentos_requerimento_servidor' THEN ARRAY['arquivo_assinado_url', 'data_upload_assinado']
      WHEN 'solicitacoes_ajuste_ponto' THEN ARRAY['aprovador_id', 'data_aprovacao', 'observacao_aprovador']
      WHEN 'justificativas_ponto' THEN ARRAY['aprovador_id', 'data_aprovacao', 'observacao_aprovador']
    END;
    IF v_decisao IS NOT NULL
       AND p_novo ->> 'status' = 'pendente'
       AND NOT EXISTS (SELECT 1 FROM unnest(v_decisao) AS k WHERE p_novo ->> k IS NOT NULL)
       AND ((p_tabela IN ('solicitacoes_abono', 'documentos_requerimento_servidor') AND (p_novo ->> 'servidor_id')::uuid = v_srv)
            OR (p_tabela = 'solicitacoes_ajuste_ponto' AND (p_novo ->> 'servidor_id')::uuid = v_uid)
            OR (p_tabela = 'justificativas_ponto' AND EXISTS (
                  SELECT 1 FROM public.registros_ponto rp
                   WHERE rp.id = (p_novo ->> 'registro_ponto_id')::uuid AND rp.servidor_id = v_srv))) THEN
      v_via := 'autoatendimento';
    END IF;
  ELSIF p_op = 'UPDATE' AND p_tabela = 'frequencia_fechamento'
        AND (p_velho ->> 'servidor_id')::uuid = v_srv AND (p_novo ->> 'servidor_id')::uuid = v_srv
        AND v_mudou IS NOT NULL AND v_mudou <@ ARRAY['assinado_servidor', 'assinado_servidor_em'] THEN
    v_via := 'autoatendimento';
  END IF;

  -- chefia
  IF v_via IS NULL
     AND p_tabela IN ('solicitacoes_abono', 'frequencia_fechamento', 'justificativas_ponto', 'solicitacoes_ajuste_ponto')
     AND ((p_op = 'UPDATE' AND (p_tabela <> 'frequencia_fechamento'
                                OR (v_mudou IS NOT NULL
                                    AND v_mudou <@ ARRAY['validado_chefia', 'validado_chefia_por', 'validado_chefia_em', 'observacoes'])))
          OR (p_op = 'INSERT' AND p_tabela = 'frequencia_fechamento' AND (p_novo ->> 'validado_chefia') = 'true'))
     AND public.has_permission_code(v_uid, 'rh.aprovar')
     AND NOT public.has_permission_code(v_uid, 'rh.frequencia.lancar') THEN
    v_via := 'chefia';
  END IF;

  IF v_via IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN jsonb_build_object('permitido', true, 'via', v_via, 'modulo', 'rh', 'servidor_id', v_srv, 'data', public.data_local());
END;
$$;


--
-- Name: fundamento_tabela(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fundamento_tabela(p_tabela text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_chave text;
  v_guc text := 'lancamento.t_' || p_tabela;
  v_cache text := current_setting('lancamento.t_' || p_tabela, true);
  v_mods text[];
  f jsonb;
BEGIN
  v_chave := coalesce(auth.uid()::text, '-') || '|' || coalesce(current_setting('role', true), 'none') || '|'
             || coalesce(current_setting('lancamento.geracao', true), '');
  IF v_cache IS NOT NULL AND left(v_cache, length(v_chave) + 1) = v_chave || chr(10) THEN
    v_cache := substr(v_cache, length(v_chave) + 2);
    RETURN CASE WHEN v_cache = '' THEN NULL ELSE v_cache::jsonb END;
  END IF;
  v_mods := public.lancamento_modulos_tabela(p_tabela);
  IF v_mods IS NOT NULL THEN
    f := public.fundamento_lancamento(v_mods);
  END IF;
  PERFORM set_config(v_guc, v_chave || chr(10) || coalesce(f::text, ''), true);
  RETURN f;
END;
$$;


--
-- Name: generate_codigo_instituicao(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_codigo_instituicao() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(codigo_instituicao FROM 5) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.instituicoes;
  
  NEW.codigo_instituicao := 'INS-' || LPAD(next_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$;


--
-- Name: generate_schema_ddl(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_schema_ddl() RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  result json;
BEGIN
  WITH enum_types AS (
    SELECT t.typname,
           string_agg(e.enumlabel, ',' ORDER BY e.enumsortorder) as labels
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    GROUP BY t.typname
  ),
  table_cols AS (
    SELECT c.table_name, 
           json_agg(json_build_object(
             'column_name', c.column_name,
             'data_type', c.data_type,
             'udt_name', c.udt_name,
             'column_default', c.column_default,
             'is_nullable', c.is_nullable,
             'char_max_length', c.character_maximum_length,
             'numeric_precision', c.numeric_precision,
             'numeric_scale', c.numeric_scale
           ) ORDER BY c.ordinal_position) as columns
    FROM information_schema.columns c
    JOIN information_schema.tables t ON c.table_name = t.table_name AND t.table_schema = 'public'
    WHERE c.table_schema = 'public' AND t.table_type = 'BASE TABLE'
      AND c.table_name NOT IN ('_realtime_subscription','schema_migrations','supabase_functions_migrations','supabase_functions_hooks')
    GROUP BY c.table_name
  ),
  pk_cols AS (
    SELECT tc.table_name,
           json_agg(kcu.column_name) as pk_columns
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public'
    GROUP BY tc.table_name
  )
  SELECT json_build_object(
    'enums', COALESCE((SELECT json_agg(json_build_object('name', typname, 'labels', labels)) FROM enum_types), '[]'::json),
    'tables', COALESCE((SELECT json_agg(json_build_object('name', tc.table_name, 'columns', tc.columns, 'pk', pk.pk_columns)) 
              FROM table_cols tc LEFT JOIN pk_cols pk ON tc.table_name = pk.table_name), '[]'::json)
  ) INTO result;
  
  RETURN result;
END;
$$;


--
-- Name: gerar_codigo_interno_servidor(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.gerar_codigo_interno_servidor() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_max numeric;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('servidores.codigo_interno'));
  SELECT coalesce(max(nullif(regexp_replace(codigo_interno, '\D', '', 'g'), '')::numeric), 0) INTO v_max
    FROM public.servidores WHERE codigo_interno IS NOT NULL;
  NEW.codigo_interno := 'SRV-' || CASE WHEN length((v_max + 1)::text) >= 5 THEN (v_max + 1)::text
                                       ELSE lpad((v_max + 1)::text, 5, '0') END;
  RETURN NEW;
END;
$$;


--
-- Name: gerar_codigo_pre_cadastro(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.gerar_codigo_pre_cadastro() RETURNS text
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  ano TEXT;
  sequencia INTEGER;
  codigo TEXT;
BEGIN
  ano := EXTRACT(YEAR FROM NOW())::TEXT;
  
  SELECT COALESCE(MAX(
    CASE 
      WHEN codigo_acesso LIKE 'PC-' || ano || '-%' 
      THEN NULLIF(SPLIT_PART(codigo_acesso, '-', 3), '')::INTEGER 
      ELSE 0 
    END
  ), 0) + 1
  INTO sequencia
  FROM public.pre_cadastros
  WHERE codigo_acesso LIKE 'PC-' || ano || '-%';
  
  codigo := 'PC-' || ano || '-' || LPAD(sequencia::TEXT, 4, '0');
  
  RETURN codigo;
END;
$$;


--
-- Name: gerar_codigo_unidade_local(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.gerar_codigo_unidade_local() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  v_prefixo TEXT;
  v_ano INTEGER;
  v_sequencia INTEGER;
  v_codigo TEXT;
BEGIN
  -- Definir prefixo baseado no tipo
  v_prefixo := CASE NEW.tipo_unidade
    WHEN 'ginasio' THEN 'GIN'
    WHEN 'estadio' THEN 'EST'
    WHEN 'parque_aquatico' THEN 'PAQ'
    WHEN 'piscina' THEN 'PIS'
    WHEN 'complexo' THEN 'CPX'
    WHEN 'quadra' THEN 'QUA'
    ELSE 'OUT'
  END;
  
  -- Ano atual
  v_ano := EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Buscar próxima sequência para o tipo/ano
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(codigo_unidade, '-', 3) AS INTEGER)
  ), 0) + 1
  INTO v_sequencia
  FROM public.unidades_locais
  WHERE tipo_unidade = NEW.tipo_unidade
    AND codigo_unidade LIKE v_prefixo || '-' || v_ano || '-%';
  
  -- Montar código final
  v_codigo := v_prefixo || '-' || v_ano || '-' || LPAD(v_sequencia::TEXT, 3, '0');
  
  NEW.codigo_unidade := v_codigo;
  
  RETURN NEW;
END;
$$;


--
-- Name: gerar_hash_solicitante_sic(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.gerar_hash_solicitante_sic() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.solicitante_documento IS NOT NULL THEN
    NEW.solicitante_hash := encode(sha256(convert_to(NEW.solicitante_documento, 'UTF8')), 'hex');
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: gerar_link_frequencia(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.gerar_link_frequencia() RETURNS text
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  novo_link TEXT;
BEGIN
  novo_link := encode(gen_random_bytes(16), 'hex');
  RETURN novo_link;
END;
$$;


--
-- Name: gerar_matricula_servidor(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.gerar_matricula_servidor() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_max numeric;
BEGIN
  IF NEW.matricula IS NULL OR btrim(NEW.matricula) = '' THEN
    PERFORM pg_advisory_xact_lock(hashtext('servidores.matricula'));
    -- numérico: '9999' < '10000' (a ordenação por texto errava na virada)
    SELECT coalesce(max(nullif(regexp_replace(matricula, '\D', '', 'g'), '')::numeric), 0) INTO v_max
      FROM public.servidores;
    -- lpad() TRUNCA texto maior que o tamanho; só completa com zeros quando faltam dígitos
    NEW.matricula := CASE WHEN length((v_max + 1)::text) >= 4 THEN (v_max + 1)::text ELSE lpad((v_max + 1)::text, 4, '0') END;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: gerar_numero_demanda_ascom(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.gerar_numero_demanda_ascom() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_ano INTEGER;
  v_sequencial INTEGER;
BEGIN
  v_ano := EXTRACT(YEAR FROM CURRENT_DATE);
  
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(numero_demanda, '/', 1) AS INTEGER)
  ), 0) + 1
  INTO v_sequencial
  FROM public.demandas_ascom
  WHERE ano = v_ano;
  
  NEW.numero_demanda := LPAD(v_sequencial::TEXT, 4, '0') || '/' || v_ano || '-ASCOM';
  NEW.ano := v_ano;
  
  RETURN NEW;
END;
$$;


--
-- Name: gerar_numero_portaria(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.gerar_numero_portaria(p_ano integer DEFAULT (EXTRACT(year FROM CURRENT_DATE))::integer) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_ultimo integer;
  v_novo text;
BEGIN
  SELECT COALESCE(MAX(
    CASE 
      WHEN numero ~ '^[0-9]+/' THEN CAST(SPLIT_PART(numero, '/', 1) AS integer)
      ELSE 0
    END
  ), 0)
  INTO v_ultimo
  FROM documentos
  WHERE tipo = 'portaria'
    AND EXTRACT(YEAR FROM data_documento) = p_ano;
  
  v_novo := LPAD((v_ultimo + 1)::text, 3, '0') || '/' || p_ano;
  RETURN v_novo;
END;
$$;


--
-- Name: gerar_numero_processo(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.gerar_numero_processo() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE v_ano INTEGER; v_sequencial INTEGER;
BEGIN
  v_ano := COALESCE(NEW.ano, EXTRACT(YEAR FROM NOW())::INTEGER);
  SELECT COALESCE(MAX(CASE WHEN numero_processo ~ '^\d+$' THEN numero_processo::INTEGER ELSE 0 END), 0) + 1 INTO v_sequencial FROM public.processos_administrativos WHERE ano = v_ano;
  NEW.numero_processo := LPAD(v_sequencial::TEXT, 5, '0'); NEW.ano := v_ano;
  RETURN NEW;
END; $_$;


--
-- Name: gerar_numero_tombamento(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.gerar_numero_tombamento(p_unidade_local_id uuid) RETURNS text
    LANGUAGE sql
    SET search_path TO 'public'
    AS $$ SELECT public.fn_proximo_numero_tombamento() $$;


--
-- Name: FUNCTION gerar_numero_tombamento(p_unidade_local_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.gerar_numero_tombamento(p_unidade_local_id uuid) IS 'Gera número de tombamento automático no formato IDJ-XX-XXXX para bens patrimoniais';


--
-- Name: gerar_numero_tombo_patrimonio(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.gerar_numero_tombo_patrimonio() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  v_tipo_unidade TEXT;
  v_prefixo_unidade TEXT;
  v_ano INTEGER;
  v_sequencia INTEGER;
  v_tombo TEXT;
BEGIN
  -- Buscar tipo da unidade
  SELECT tipo_unidade INTO v_tipo_unidade
  FROM public.unidades_locais
  WHERE id = NEW.unidade_local_id;
  
  -- Definir prefixo baseado no tipo da unidade
  v_prefixo_unidade := CASE v_tipo_unidade
    WHEN 'ginasio' THEN 'GIN'
    WHEN 'estadio' THEN 'EST'
    WHEN 'parque_aquatico' THEN 'PAQ'
    WHEN 'piscina' THEN 'PIS'
    WHEN 'complexo' THEN 'CPX'
    WHEN 'quadra' THEN 'QUA'
    ELSE 'OUT'
  END;
  
  -- Ano atual
  v_ano := EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Buscar próxima sequência global do ano
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(numero_tombo, '-', 4) AS INTEGER)
  ), 0) + 1
  INTO v_sequencia
  FROM public.patrimonio_unidade
  WHERE numero_tombo LIKE 'PAT-%-' || v_ano || '-%';
  
  -- Montar número de tombo
  v_tombo := 'PAT-' || v_prefixo_unidade || '-' || v_ano || '-' || LPAD(v_sequencia::TEXT, 5, '0');
  
  NEW.numero_tombo := v_tombo;
  
  RETURN NEW;
END;
$$;


--
-- Name: gerar_protocolo_arbitro(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.gerar_protocolo_arbitro() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  next_num bigint;
  year_txt text;
BEGIN
  IF NEW.protocolo IS NOT NULL AND NEW.protocolo <> '' THEN
    RETURN NEW;
  END IF;

  year_txt := to_char(now(), 'YYYY');
  next_num := nextval('public.cadastro_arbitros_protocolo_seq');
  NEW.protocolo := format('ARB-%s-%s', year_txt, lpad(next_num::text, 5, '0'));

  RETURN NEW;
END;
$$;


--
-- Name: gerar_protocolo_cedencia(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.gerar_protocolo_cedencia(p_unidade_id uuid) RETURNS character varying
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_ano INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
  v_sequencial INTEGER;
  v_protocolo VARCHAR(50);
BEGIN
  SELECT COUNT(*) + 1 INTO v_sequencial
  FROM public.agenda_unidade
  WHERE ano_vigencia = v_ano
    AND numero_protocolo IS NOT NULL;
  
  v_protocolo := v_ano || '.' || LPAD(v_sequencial::TEXT, 5, '0');
  
  RETURN v_protocolo;
END;
$$;


--
-- Name: gerar_protocolo_memorando_lotacao(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.gerar_protocolo_memorando_lotacao() RETURNS character varying
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_ano INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
  v_sequencial INTEGER;
  v_protocolo VARCHAR(50);
BEGIN
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(numero_protocolo, '/', 1) AS INTEGER)
  ), 0) + 1 INTO v_sequencial
  FROM public.memorandos_lotacao
  WHERE ano = v_ano;
  
  v_protocolo := LPAD(v_sequencial::TEXT, 4, '0') || '/' || v_ano || '-MEMO-LOT';
  
  RETURN v_protocolo;
END;
$$;


--
-- Name: gerar_protocolo_sic(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.gerar_protocolo_sic() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
$$;


--
-- Name: gerar_relatorio_responsavel(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.gerar_relatorio_responsavel(p_responsavel_id uuid) RETURNS TABLE(bem_id uuid, numero_patrimonio text, descricao text, categoria text, unidade_local text, localizacao text, estado_conservacao text, valor_aquisicao numeric, data_atribuicao date)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT 
    bp.id, bp.numero_patrimonio::TEXT, bp.descricao, bp.categoria_bem::TEXT,
    ul.nome_unidade,
    COALESCE(bp.predio || ' - ', '') || COALESCE(bp.andar || ' - ', '') || COALESCE(bp.sala, ''),
    bp.estado_conservacao, bp.valor_aquisicao, bp.data_atribuicao_responsabilidade
  FROM bens_patrimoniais bp
  LEFT JOIN unidades_locais ul ON ul.id = bp.unidade_local_id
  WHERE bp.responsavel_id = p_responsavel_id
    AND bp.situacao NOT IN ('baixado', 'extraviado')
  ORDER BY ul.nome_unidade, bp.descricao;
$$;


--
-- Name: get_chefe_unidade_atual(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_chefe_unidade_atual(p_unidade_id uuid) RETURNS TABLE(nomeacao_id uuid, servidor_id uuid, servidor_nome text, cargo text, data_inicio date, ato_numero text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT 
    n.id as nomeacao_id,
    n.servidor_id,
    s.nome_completo as servidor_nome,
    n.cargo,
    n.data_inicio,
    n.ato_numero
  FROM public.nomeacoes_chefe_unidade n
  JOIN public.servidores s ON s.id = n.servidor_id
  WHERE n.unidade_local_id = p_unidade_id
    AND n.status = 'ativo'
  ORDER BY n.data_inicio DESC
  LIMIT 1;
$$;


--
-- Name: get_diagnostico_acessos(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_diagnostico_acessos() RETURNS TABLE(user_id uuid, email text, full_name text, is_active boolean, roles text, modulos text, tipo_acesso text, situacao_descritiva text)
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT
    p.id as user_id,
    p.email,
    p.full_name,
    p.is_active,
    COALESCE(STRING_AGG(DISTINCT ur.role::text, ', '), 'nenhum') as roles,
    COALESCE(STRING_AGG(DISTINCT um.module::text, ', ' ORDER BY um.module::text), 'nenhum') as modulos,
    CASE
      WHEN bool_or(ur.role = 'admin') THEN 'SUPER_ADMIN'
      WHEN COUNT(um.module) > 0 THEN 'MODULAR'
      ELSE 'SEM_ACESSO'
    END as tipo_acesso,
    CASE
      WHEN bool_or(ur.role = 'admin') THEN '✅ Acesso total (admin)'
      WHEN COUNT(um.module) > 0 THEN '🔒 Acesso restrito por módulo'
      ELSE '❌ Bloqueado - sem módulos atribuídos'
    END as situacao_descritiva
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON ur.user_id = p.id
  LEFT JOIN public.user_modules um ON um.user_id = p.id
  -- Só retorna dados se o chamador for admin
  WHERE public.is_admin_user(auth.uid())
  GROUP BY p.id, p.email, p.full_name, p.is_active
  ORDER BY tipo_acesso, p.email;
$$;


--
-- Name: get_hierarquia_unidade(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_hierarquia_unidade(p_unidade_id uuid) RETURNS TABLE(id uuid, nome text, tipo public.tipo_unidade, nivel integer)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  WITH RECURSIVE hierarquia AS (
    SELECT e.id, e.nome, e.tipo, e.nivel, e.superior_id
    FROM public.estrutura_organizacional e
    WHERE e.id = p_unidade_id
    
    UNION ALL
    
    SELECT e.id, e.nome, e.tipo, e.nivel, e.superior_id
    FROM public.estrutura_organizacional e
    INNER JOIN hierarquia h ON e.id = h.superior_id
  )
  SELECT h.id, h.nome, h.tipo, h.nivel
  FROM hierarquia h
  ORDER BY h.nivel;
$$;


--
-- Name: get_my_access_context(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_my_access_context() RETURNS jsonb
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT jsonb_build_object(
    'is_active', COALESCE((SELECT is_active FROM public.profiles WHERE id = auth.uid()), false),
    'is_admin', EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'),
    'modules', (SELECT jsonb_agg(module::text) FROM public.user_modules WHERE user_id = auth.uid()),
    'roles', (SELECT jsonb_agg(role::text) FROM public.user_roles WHERE user_id = auth.uid())
  );
$$;


--
-- Name: get_my_modules(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_my_modules() RETURNS TABLE(module text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT um.module::text FROM public.user_modules um
  WHERE um.user_id = auth.uid() 
  AND COALESCE((SELECT is_active FROM public.profiles WHERE id = auth.uid()), false);
$$;


--
-- Name: get_parametro_vigente(text, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_parametro_vigente(p_tipo text, p_data date DEFAULT CURRENT_DATE) RETURNS numeric
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
  RETURN COALESCE((
    SELECT valor
    FROM parametros_folha
    WHERE tipo_parametro = p_tipo
      AND ativo = true
      AND vigencia_inicio <= p_data
      AND (vigencia_fim IS NULL OR vigencia_fim >= p_data)
    ORDER BY vigencia_inicio DESC
    LIMIT 1
  ), 0);
END;
$$;


--
-- Name: get_parametro_vigente(character varying, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_parametro_vigente(p_tipo character varying, p_vigencia date DEFAULT CURRENT_DATE) RETURNS numeric
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_valor DECIMAL;
BEGIN
  SELECT valor INTO v_valor
  FROM parametros_folha
  WHERE tipo_parametro = p_tipo
    AND vigencia_inicio <= p_vigencia
    AND (vigencia_fim IS NULL OR vigencia_fim >= p_vigencia)
    AND ativo = TRUE
  ORDER BY vigencia_inicio DESC LIMIT 1;
  
  RETURN v_valor;
END;
$$;


--
-- Name: get_permissions_from_servidor(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_permissions_from_servidor(_user_id uuid) RETURNS public.app_permission[]
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_servidor RECORD;
  v_permissions app_permission[] := ARRAY[]::app_permission[];
  v_role app_role;
BEGIN
  -- Buscar dados do servidor vinculado
  SELECT s.cargo_atual_id, s.unidade_atual_id, c.nome as cargo_nome
  INTO v_servidor
  FROM public.profiles p
  JOIN public.servidores s ON s.id = p.servidor_id
  LEFT JOIN public.cargos c ON c.id = s.cargo_atual_id
  WHERE p.id = _user_id;
  
  -- Se não tem servidor vinculado, retorna vazio
  IF v_servidor IS NULL THEN
    RETURN v_permissions;
  END IF;
  
  -- Buscar role do usuário
  SELECT role INTO v_role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1;
  
  -- Buscar permissões baseadas no role
  SELECT ARRAY_AGG(DISTINCT rp.permission) INTO v_permissions
  FROM public.role_permissions rp
  WHERE rp.role = v_role;
  
  RETURN COALESCE(v_permissions, ARRAY[]::app_permission[]);
END;
$$;


--
-- Name: get_proximo_numero_remessa(uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_proximo_numero_remessa(p_conta_id uuid, p_ano integer) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_numero INTEGER;
BEGIN
  IF NOT coalesce((auth.uid() IS NULL AND coalesce(current_setting('role', true), 'none') NOT IN ('anon', 'authenticated'))
                  OR (auth.uid() IS NOT NULL AND public.can_access_module(auth.uid(), 'rh')), false) THEN
    RAISE EXCEPTION 'get_proximo_numero_remessa: exige o módulo rh' USING ERRCODE = '42501';
  END IF;
  SELECT COALESCE(MAX(numero_remessa), 0) + 1 INTO v_numero
  FROM remessas_bancarias
  WHERE conta_autarquia_id = p_conta_id;

  RETURN v_numero;
END;
$$;


--
-- Name: get_subordinados_unidade(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_subordinados_unidade(p_unidade_id uuid) RETURNS TABLE(id uuid, nome text, tipo public.tipo_unidade, nivel integer)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  WITH RECURSIVE subordinados AS (
    SELECT e.id, e.nome, e.tipo, e.nivel, e.superior_id
    FROM public.estrutura_organizacional e
    WHERE e.id = p_unidade_id
    
    UNION ALL
    
    SELECT e.id, e.nome, e.tipo, e.nivel, e.superior_id
    FROM public.estrutura_organizacional e
    INNER JOIN subordinados s ON e.superior_id = s.id
  )
  SELECT s.id, s.nome, s.tipo, s.nivel
  FROM subordinados s
  ORDER BY s.nivel, s.nome;
$$;


--
-- Name: get_user_permission_codes(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_permission_codes(_user_id uuid) RETURNS text[]
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT COALESCE(array_agg(DISTINCT permission), '{}'::text[])
  FROM (
    -- 1. concessão avulsa
    SELECT up.permission
    FROM public.user_permissions up
    WHERE up.user_id = _user_id
    UNION
    -- 2. padrão do papel, RESTRITO aos módulos que o usuário tem.
    --    Sem esse recorte, o papel `user` (que recebe todos os `visualizar`
    --    do catálogo) daria leitura de financeiro a quem só tem o módulo rh —
    --    o papel define o QUE se pode fazer, o módulo define ONDE.
    SELECT rp.permission
    FROM public.user_roles ur
    JOIN public.role_permissions rp
      ON rp.role = ur.role
    JOIN public.module_permissions_catalog mpc
      ON mpc.permission_code = rp.permission
    JOIN public.user_modules um
      ON um.user_id = ur.user_id
     AND um.module::text = mpc.module_code
    WHERE ur.user_id = _user_id
    UNION
    -- 3. concessão dentro do módulo
    SELECT unnest(um.permissions)
    FROM public.user_modules um
    WHERE um.user_id = _user_id
      AND um.permissions IS NOT NULL
  ) fontes(permission);
$$;


--
-- Name: FUNCTION get_user_permission_codes(_user_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_user_permission_codes(_user_id uuid) IS 'União das três fontes de permissão: user_permissions (avulsa), role_permissions (via user_roles, restrita aos módulos do usuário) e user_modules.permissions.';


--
-- Name: get_user_permissions(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_permissions(_user_id uuid) RETURNS text[]
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT ARRAY_AGG(DISTINCT permission::TEXT)
  FROM (
    SELECT permission FROM public.user_permissions WHERE user_id = _user_id
    UNION
    SELECT rp.permission FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role = rp.role
    WHERE ur.user_id = _user_id
  ) perms
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Inserir perfil (inativos por padrão)
  INSERT INTO public.profiles (id, email, full_name, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    false
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Inserir role padrão 'user'
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;


--
-- Name: handle_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: has_module(public.app_module); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_module(_module public.app_module) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT public.has_module(auth.uid(), _module::text);
$$;


--
-- Name: has_module(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_module(_user_id uuid, _module text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_modules WHERE user_id = _user_id AND module::text = _module);
$$;


--
-- Name: has_permission(uuid, public.app_permission); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_permission(_user_id uuid, _permission public.app_permission) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    -- Permissão direta do usuário
    SELECT 1 FROM public.user_permissions
    WHERE user_id = _user_id AND permission = _permission
    UNION
    -- Permissão herdada do role
    SELECT 1 FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role = rp.role
    WHERE ur.user_id = _user_id AND rp.permission = _permission
  )
$$;


--
-- Name: has_permission_code(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_permission_code(_user_id uuid, _permission text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT COALESCE((SELECT p.is_active FROM public.profiles p WHERE p.id = _user_id), false)
     AND (
       -- super admin passa por cima
       EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin')
       OR _permission = ANY (public.get_user_permission_codes(_user_id))
     );
$$;


--
-- Name: has_role(public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = _role);
$$;


--
-- Name: ia_config_servidor(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ia_config_servidor() RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_cfg public.ia_config%ROWTYPE;
  v_chave text;
  v_tokens bigint;
BEGIN
  SELECT * INTO v_cfg FROM public.ia_config WHERE id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  IF v_cfg.segredo_id IS NOT NULL THEN
    SELECT d.decrypted_secret INTO v_chave FROM vault.decrypted_secrets d WHERE d.id = v_cfg.segredo_id;
  END IF;
  SELECT coalesce(sum(u.tokens_entrada::bigint + u.tokens_saida), 0) INTO v_tokens
    FROM public.ia_uso u
   WHERE u.created_at >= date_trunc('month', now(), 'UTC');
  RETURN (to_jsonb(v_cfg) - 'segredo_id') || jsonb_build_object('chave', v_chave, 'tokens_mes', v_tokens);
END;
$$;


--
-- Name: ia_disponivel(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ia_disponivel() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT public.pode_usar_ia()
     AND coalesce((SELECT c.ativo FROM public.ia_config c WHERE c.id), false);
$$;


--
-- Name: importar_arquivo_bancario(jsonb, jsonb, jsonb, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.importar_arquivo_bancario(p_linhas jsonb, p_arquivo jsonb, p_parametros jsonb, p_simular boolean DEFAULT true) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  v_uid uuid := auth.uid();
  v_origem text := p_parametros->>'origem';
  v_sentido text := p_parametros->>'sentido';
  v_data_arquivo date;
  v_seq text := NULLIF(btrim(COALESCE(p_parametros->>'sequencial_arquivo', '')), '');
  v_linha jsonb;
  v_idx integer := -1;
  v_ident text; v_doc text; v_tipo text; v_sit text; v_valor numeric(15,2); v_data date; v_efet date;
  v_chave text;
  v_chaves text[] := '{}';
  v_existente public.fin_movimentos_bancarios%ROWTYPE;
  v_achou boolean;
  v_novo jsonb;
  v_mudancas jsonb;
  v_pag_id uuid;
  v_pag_status text;
  v_pago_numero text;
  v_mov_id uuid;
  v_resultado jsonb := '[]'::jsonb;
  v_ins integer := 0; v_upd integer := 0; v_igual integer := 0;
  v_vinculados text[] := '{}';
  v_pagos text[] := '{}';
  v_resumo jsonb;
  v_import_id uuid;
BEGIN
  p_simular := COALESCE(p_simular, true);

  -- COALESCE: um NULL em qualquer checagem nega (NOT NULL não dispararia o RAISE).
  IF v_uid IS NULL
     OR NOT COALESCE(public.perfil_ativo_atual()
                     AND public.can_access_module(v_uid, 'financeiro')
                     AND public.has_permission_code(v_uid, 'pagamento.conciliar'), false) THEN
    RAISE EXCEPTION 'Sem permissão para importar arquivo bancário (pagamento.conciliar).' USING ERRCODE = '42501';
  END IF;

  IF jsonb_typeof(p_parametros) IS DISTINCT FROM 'object'
     OR COALESCE(v_origem, '') NOT IN ('obn600', 'cnab240')
     OR COALESCE(v_sentido, '') NOT IN ('remessa', 'retorno') THEN
    RAISE EXCEPTION 'Parâmetros do arquivo inválidos (origem obn600|cnab240, sentido remessa|retorno).' USING ERRCODE = '22023';
  END IF;
  IF char_length(COALESCE(v_seq, '')) > 20
     OR char_length(COALESCE(p_parametros->>'convenio', '')) > 20 THEN
    RAISE EXCEPTION 'Sequencial ou convênio do arquivo inválido.' USING ERRCODE = '22023';
  END IF;
  IF NULLIF(p_parametros->>'data_arquivo', '') IS NOT NULL THEN
    IF (p_parametros->>'data_arquivo') !~ '^\d{4}-\d{2}-\d{2}$' THEN
      RAISE EXCEPTION 'Data do arquivo inválida.' USING ERRCODE = '22023';
    END IF;
    BEGIN
      v_data_arquivo := (p_parametros->>'data_arquivo')::date;
    EXCEPTION WHEN others THEN
      RAISE EXCEPTION 'Data do arquivo inválida.' USING ERRCODE = '22023';
    END;
  END IF;
  IF jsonb_typeof(p_linhas) IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_linhas) > 20000 THEN
    RAISE EXCEPTION 'Envie até 20000 pagamentos.' USING ERRCODE = '22023';
  END IF;
  IF NOT p_simular AND (
       char_length(COALESCE(p_arquivo->>'nome', '')) NOT BETWEEN 1 AND 255
       OR COALESCE(p_arquivo->>'sha256', '') !~ '^[0-9a-f]{64}$'
       OR COALESCE(p_arquivo->>'tamanho', '') !~ '^\d{1,15}$') THEN
    RAISE EXCEPTION 'Dados do arquivo inválidos.' USING ERRCODE = '22023';
  END IF;

  -- Uma importação de arquivo bancário de cada vez (a chave é global).
  PERFORM pg_advisory_xact_lock(hashtext('importar_arquivo_bancario'));

  IF NOT p_simular THEN
    -- O log nasce antes para os movimentos apontarem para ele; resumo e detalhes vêm no fim.
    INSERT INTO public.importacoes
      (tipo, modulo, arquivo_nome, arquivo_sha256, arquivo_tamanho, exercicio, created_by)
    VALUES
      ('arquivo_bancario', 'financeiro', p_arquivo->>'nome', p_arquivo->>'sha256',
       (p_arquivo->>'tamanho')::bigint, extract(year FROM v_data_arquivo)::integer, v_uid)
    RETURNING id INTO v_import_id;
  END IF;

  FOR v_linha IN SELECT value FROM jsonb_array_elements(p_linhas) LOOP
    v_idx := v_idx + 1;

    IF jsonb_typeof(v_linha) IS DISTINCT FROM 'object' THEN
      RAISE EXCEPTION 'Linha %: formato inválido.', v_idx + 1 USING ERRCODE = '22023';
    END IF;
    v_ident := btrim(COALESCE(v_linha->>'identificador', ''));
    v_doc := NULLIF(v_linha->>'favorecido_documento', '');
    v_tipo := btrim(COALESCE(v_linha->>'tipo_lancamento', ''));
    v_sit := v_linha->>'situacao';

    IF COALESCE(v_linha->>'origem', v_origem) <> v_origem
       OR COALESCE(v_linha->>'sentido', v_sentido) <> v_sentido THEN
      RAISE EXCEPTION 'Linha %: origem/sentido diferente do arquivo.', v_idx + 1 USING ERRCODE = '22023';
    END IF;
    IF char_length(v_ident) NOT BETWEEN 1 AND 60
       OR char_length(v_tipo) > 50
       OR COALESCE(v_sit, '') NOT IN ('enviado', 'pago', 'recusado')
       OR (v_doc IS NOT NULL AND v_doc !~ '^(\d{11}|\d{14})$')
       OR char_length(COALESCE(v_linha->>'favorecido_nome', '')) > 255
       OR char_length(COALESCE(v_linha->>'banco', '')) > 10
       OR char_length(COALESCE(v_linha->>'agencia', '')) > 20
       OR char_length(COALESCE(v_linha->>'conta', '')) > 30
       OR char_length(COALESCE(v_linha->>'codigo_barras', '')) > 60
       OR char_length(COALESCE(v_linha->>'autenticacao', '')) > 100
       OR char_length(COALESCE(v_linha->>'codigo_retorno', '')) > 50
       OR char_length(COALESCE(v_linha->>'motivo_recusa', '')) > 500 THEN
      RAISE EXCEPTION 'Linha %: campos fora do padrão do arquivo bancário.', v_idx + 1 USING ERRCODE = '22023';
    END IF;
    IF v_sentido = 'remessa' AND v_sit <> 'enviado' THEN
      RAISE EXCEPTION 'Linha %: remessa só tem pagamentos enviados (pago/recusado vêm do retorno).', v_idx + 1
        USING ERRCODE = '22023';
    END IF;
    IF jsonb_typeof(v_linha->'valor') IS DISTINCT FROM 'number'
       OR (v_linha->>'valor')::numeric < 0
       OR (v_linha->>'valor')::numeric >= 1e13 THEN
      RAISE EXCEPTION 'Linha %: valor inválido.', v_idx + 1 USING ERRCODE = '22023';
    END IF;
    v_valor := round((v_linha->>'valor')::numeric, 2);
    v_data := NULL;
    IF NULLIF(v_linha->>'data_pagamento', '') IS NOT NULL THEN
      IF (v_linha->>'data_pagamento') !~ '^\d{4}-\d{2}-\d{2}$' THEN
        RAISE EXCEPTION 'Linha %: data de pagamento inválida.', v_idx + 1 USING ERRCODE = '22023';
      END IF;
      BEGIN
        v_data := (v_linha->>'data_pagamento')::date;
      EXCEPTION WHEN others THEN
        RAISE EXCEPTION 'Linha %: data de pagamento inválida.', v_idx + 1 USING ERRCODE = '22023';
      END;
    END IF;
    v_efet := NULL;
    IF NULLIF(v_linha->>'data_efetivacao', '') IS NOT NULL THEN
      IF (v_linha->>'data_efetivacao') !~ '^\d{4}-\d{2}-\d{2}$' THEN
        RAISE EXCEPTION 'Linha %: data de efetivação inválida.', v_idx + 1 USING ERRCODE = '22023';
      END IF;
      BEGIN
        v_efet := (v_linha->>'data_efetivacao')::date;
      EXCEPTION WHEN others THEN
        RAISE EXCEPTION 'Linha %: data de efetivação inválida.', v_idx + 1 USING ERRCODE = '22023';
      END;
    END IF;

    v_chave := concat_ws('|', v_origem, v_ident, v_valor::text, COALESCE(v_data::text, ''), v_tipo);
    IF v_chave = ANY (v_chaves) THEN
      RAISE EXCEPTION 'Linha %: pagamento repetido no arquivo (identificador %).', v_idx + 1, v_ident USING ERRCODE = '22023';
    END IF;
    v_chaves := v_chaves || v_chave;

    SELECT * INTO v_existente FROM public.fin_movimentos_bancarios WHERE chave_unica = v_chave FOR UPDATE;
    v_achou := FOUND;

    -- Casamento com fin_pagamentos (só quando ainda não há vínculo)
    v_pag_id := CASE WHEN v_achou THEN v_existente.pagamento_id END;
    IF v_pag_id IS NULL THEN
      v_pag_id := public.fin_casar_movimento_pagamento(v_ident, v_doc, v_valor, v_data);
    END IF;

    IF NOT v_achou THEN
      v_ins := v_ins + 1;
      IF NOT p_simular THEN
        INSERT INTO public.fin_movimentos_bancarios (
          origem, sentido, importacao_id, data_arquivo, sequencial_arquivo, tipo_lancamento, identificador,
          favorecido_nome, favorecido_documento, banco, agencia, conta, valor, data_pagamento, data_efetivacao,
          codigo_barras, autenticacao, situacao, motivo_recusa, codigo_retorno,
          pagamento_id, conciliado_em, importacao_retorno_id, chave_unica
        ) VALUES (
          v_origem, v_sentido, v_import_id, v_data_arquivo, v_seq, v_tipo, v_ident,
          NULLIF(btrim(COALESCE(v_linha->>'favorecido_nome', '')), ''), v_doc,
          NULLIF(v_linha->>'banco', ''), NULLIF(v_linha->>'agencia', ''), NULLIF(v_linha->>'conta', ''),
          v_valor, v_data, v_efet,
          NULLIF(v_linha->>'codigo_barras', ''), NULLIF(v_linha->>'autenticacao', ''), v_sit,
          NULLIF(v_linha->>'motivo_recusa', ''), NULLIF(v_linha->>'codigo_retorno', ''),
          v_pag_id, CASE WHEN v_pag_id IS NOT NULL THEN now() END,
          CASE WHEN v_sentido = 'retorno' THEN v_import_id END, v_chave
        );
      END IF;
      v_resultado := v_resultado || jsonb_strip_nulls(jsonb_build_object(
        'indice', v_idx, 'acao', 'inserir',
        'mudancas', CASE WHEN v_pag_id IS NOT NULL
                         THEN jsonb_build_object('pagamento_id', jsonb_build_array(NULL, v_pag_id)) END));
      v_mov_id := NULL;
    ELSE
      v_mov_id := v_existente.id;
      -- A remessa nunca rebaixa o que o retorno já disse: reimportar remessa só pode vincular.
      IF v_sentido = 'retorno' THEN
        v_novo := jsonb_build_object(
          -- Retorno que só diz "agendado/enviado" não desfaz um pago.
          'situacao', CASE WHEN v_existente.situacao = 'pago' AND v_sit = 'enviado' THEN 'pago' ELSE v_sit END,
          'codigo_retorno', NULLIF(v_linha->>'codigo_retorno', ''),
          'motivo_recusa', NULLIF(v_linha->>'motivo_recusa', ''),
          'autenticacao', COALESCE(NULLIF(v_linha->>'autenticacao', ''), v_existente.autenticacao),
          'data_efetivacao', COALESCE(v_efet, v_existente.data_efetivacao)
        );
      ELSE
        v_novo := '{}'::jsonb;
      END IF;
      v_novo := v_novo || jsonb_strip_nulls(jsonb_build_object('pagamento_id', v_pag_id));

      SELECT COALESCE(jsonb_object_agg(k, jsonb_build_array(to_jsonb(v_existente) -> k, v_novo -> k)), '{}'::jsonb)
        INTO v_mudancas
        FROM jsonb_object_keys(v_novo) AS k
       WHERE (to_jsonb(v_existente) -> k) IS DISTINCT FROM (v_novo -> k);

      IF v_mudancas = '{}'::jsonb THEN
        v_igual := v_igual + 1;
        v_resultado := v_resultado || jsonb_build_object('indice', v_idx, 'acao', 'sem_alteracao');
      ELSE
        v_upd := v_upd + 1;
        v_resultado := v_resultado || jsonb_build_object('indice', v_idx, 'acao', 'atualizar', 'mudancas', v_mudancas);
        IF NOT p_simular THEN
          UPDATE public.fin_movimentos_bancarios SET
            situacao       = COALESCE(v_novo->>'situacao', situacao),
            codigo_retorno = CASE WHEN v_novo ? 'situacao' THEN v_novo->>'codigo_retorno' ELSE codigo_retorno END,
            motivo_recusa  = CASE WHEN v_novo ? 'situacao' THEN v_novo->>'motivo_recusa' ELSE motivo_recusa END,
            autenticacao   = CASE WHEN v_novo ? 'situacao' THEN v_novo->>'autenticacao' ELSE autenticacao END,
            data_efetivacao = CASE WHEN v_novo ? 'situacao' THEN (v_novo->>'data_efetivacao')::date ELSE data_efetivacao END,
            importacao_retorno_id = CASE WHEN v_novo ? 'situacao' THEN v_import_id ELSE importacao_retorno_id END,
            pagamento_id   = COALESCE(v_pag_id, pagamento_id),
            conciliado_em  = CASE WHEN pagamento_id IS NULL AND v_pag_id IS NOT NULL THEN now() ELSE conciliado_em END,
            updated_at     = now()
          WHERE id = v_existente.id;
        END IF;
      END IF;
      v_sit := COALESCE(v_novo->>'situacao', v_existente.situacao);
      v_efet := COALESCE((v_novo->>'data_efetivacao')::date, v_existente.data_efetivacao);
    END IF;

    -- Pagamento vinculado e pago pelo banco: marca no fin_pagamentos.
    IF v_pag_id IS NOT NULL THEN
      SELECT p.numero, p.status::text INTO v_pago_numero, v_pag_status FROM public.fin_pagamentos p WHERE p.id = v_pag_id;
      IF NOT (v_pago_numero = ANY (v_vinculados)) THEN v_vinculados := v_vinculados || v_pago_numero; END IF;
      IF v_sit = 'pago' AND COALESCE(v_pag_status, '') NOT IN ('pago', 'estornado', 'cancelado', 'devolvido') THEN
        IF p_simular THEN
          IF NOT (v_pago_numero = ANY (v_pagos)) THEN v_pagos := v_pagos || v_pago_numero; END IF;
        ELSE
          v_pago_numero := public.fin_marcar_pagamento_pago(v_pag_id, COALESCE(v_efet, v_data));
          IF v_pago_numero IS NOT NULL AND NOT (v_pago_numero = ANY (v_pagos)) THEN
            v_pagos := v_pagos || v_pago_numero;
          END IF;
        END IF;
      END IF;
    END IF;
  END LOOP;

  v_resumo := jsonb_build_object(
    'totais', jsonb_build_object('inserir', v_ins, 'atualizar', v_upd, 'sem_alteracao', v_igual),
    'criados', jsonb_strip_nulls(jsonb_build_object(
      'Pagamentos vinculados', CASE WHEN cardinality(v_vinculados) > 0 THEN to_jsonb(v_vinculados) END,
      'Pagamentos marcados como pagos', CASE WHEN cardinality(v_pagos) > 0 THEN to_jsonb(v_pagos) END)),
    'ausentes', '[]'::jsonb,
    'parametros', jsonb_strip_nulls(jsonb_build_object(
      'origem', v_origem, 'sentido', v_sentido, 'data_arquivo', v_data_arquivo,
      'sequencial_arquivo', v_seq, 'convenio', NULLIF(p_parametros->>'convenio', '')))
  );

  IF NOT p_simular THEN
    UPDATE public.importacoes SET resumo = v_resumo, detalhes = v_resultado WHERE id = v_import_id;
  END IF;

  RETURN v_resumo || jsonb_build_object(
    'simulacao', p_simular,
    'importacao_id', v_import_id,
    'linhas', v_resultado
  );
END;
$_$;


--
-- Name: FUNCTION importar_arquivo_bancario(p_linhas jsonb, p_arquivo jsonb, p_parametros jsonb, p_simular boolean); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.importar_arquivo_bancario(p_linhas jsonb, p_arquivo jsonb, p_parametros jsonb, p_simular boolean) IS 'Importa as linhas de um arquivo bancário (OBN600/CNAB240) para fin_movimentos_bancarios, casa com fin_pagamentos e marca os pagos (p_simular = true só calcula). Exige pagamento.conciliar.';


--
-- Name: importar_qdd_fiplan(integer, jsonb, jsonb, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.importar_qdd_fiplan(p_exercicio integer, p_linhas jsonb, p_arquivo jsonb, p_simular boolean DEFAULT true) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  v_uid uuid := auth.uid();
  v_linha jsonb;
  v_val jsonb;
  v_idx integer := -1;
  v_nat text; v_fonte text; v_prog text; v_paoe text; v_paoe_desc text;
  v_codigo text;
  v_codigos text[] := '{}';
  v_prog_id uuid; v_acao_id uuid; v_nat_id uuid; v_fonte_id uuid;
  v_existente public.fin_dotacoes%ROWTYPE;
  v_achou boolean;
  v_novo jsonb;
  v_mudancas jsonb;
  v_dotacao_id uuid;
  v_ids uuid[] := '{}';
  v_paoes text[] := '{}';
  v_resultado jsonb := '[]'::jsonb;
  v_ins integer := 0; v_upd integer := 0; v_igual integer := 0;
  v_cri_prog text[] := '{}'; v_cri_acao text[] := '{}';
  v_cri_nat text[] := '{}'; v_cri_fonte text[] := '{}';
  v_ausentes text[];
  v_resumo jsonb;
  v_import_id uuid;
BEGIN
  p_simular := COALESCE(p_simular, true);

  -- COALESCE: um NULL em qualquer checagem nega (NOT NULL não dispararia o RAISE).
  IF v_uid IS NULL
     OR NOT COALESCE(public.perfil_ativo_atual()
                     AND public.can_access_module(v_uid, 'financeiro')
                     AND public.has_permission_code(v_uid, 'orcamento.importar'), false) THEN
    RAISE EXCEPTION 'Sem permissão para importar o QDD (orcamento.importar).' USING ERRCODE = '42501';
  END IF;

  IF p_exercicio IS NULL OR p_exercicio NOT BETWEEN 2000 AND 2100 THEN
    RAISE EXCEPTION 'Exercício inválido: %', p_exercicio USING ERRCODE = '22023';
  END IF;
  IF jsonb_typeof(p_linhas) IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_linhas) NOT BETWEEN 1 AND 5000 THEN
    RAISE EXCEPTION 'Envie de 1 a 5000 dotações.' USING ERRCODE = '22023';
  END IF;
  IF NOT p_simular AND (
       char_length(COALESCE(p_arquivo->>'nome', '')) NOT BETWEEN 1 AND 255
       OR COALESCE(p_arquivo->>'sha256', '') !~ '^[0-9a-f]{64}$'
       OR COALESCE(p_arquivo->>'tamanho', '') !~ '^\d{1,15}$') THEN
    RAISE EXCEPTION 'Dados do arquivo inválidos.' USING ERRCODE = '22023';
  END IF;

  -- Uma importação de QDD por exercício de cada vez.
  PERFORM pg_advisory_xact_lock(hashtext('importar_qdd_fiplan'), p_exercicio);

  FOR v_linha IN SELECT value FROM jsonb_array_elements(p_linhas) LOOP
    v_idx := v_idx + 1;
    v_val := COALESCE(v_linha->'valores', '{}'::jsonb);
    v_nat := v_linha->>'natureza';
    v_fonte := v_linha->>'fonte';
    v_prog := v_linha->>'programa_codigo';
    v_paoe := v_linha->>'paoe_codigo';

    IF COALESCE(v_nat, '') !~ '^\d{8}$'
       OR COALESCE(v_fonte, '') !~ '^\d\.\d{3}$'
       OR COALESCE(v_linha->>'cod_acomp', '') !~ '^\d{4}$'
       OR COALESCE(v_linha->>'funcao', '') !~ '^\d{1,2}$'
       OR COALESCE(v_linha->>'subfuncao', '') !~ '^\d{1,3}$'
       OR COALESCE(v_prog, '') !~ '^\d{1,4}$'
       OR COALESCE(v_paoe, '') !~ '^\d{1,4}$'
       OR COALESCE(v_linha->>'regional', '') !~ '^\d{1,4}$'
       OR COALESCE(v_linha->>'idu', '') !~ '^[^.[:space:][:cntrl:]]{1,6}$'
       OR COALESCE(v_linha->>'tro', '') !~ '^[^.[:space:][:cntrl:]]{0,10}$'
       OR char_length(COALESCE(v_linha->>'programa_nome', '')) > 255
       OR char_length(COALESCE(v_linha->>'paoe_nome', '')) > 255 THEN
      RAISE EXCEPTION 'Linha %: classificação fora do padrão do QDD.', v_idx + 1 USING ERRCODE = '22023';
    END IF;
    IF EXISTS (
      SELECT 1 FROM jsonb_each(v_val) e
      WHERE jsonb_typeof(e.value) <> 'number' OR abs((e.value)::text::numeric) >= 1e13
    ) THEN
      RAISE EXCEPTION 'Linha %: valor inválido.', v_idx + 1 USING ERRCODE = '22023';
    END IF;

    v_codigo := concat_ws('.', v_linha->>'funcao', v_linha->>'subfuncao', v_prog, v_paoe,
                          v_linha->>'regional', v_nat, v_fonte, v_linha->>'cod_acomp', v_linha->>'idu');
    IF v_codigo = ANY (v_codigos) THEN
      RAISE EXCEPTION 'Linha %: dotação % repetida no arquivo.', v_idx + 1, v_codigo USING ERRCODE = '22023';
    END IF;
    v_codigos := v_codigos || v_codigo;
    v_paoe_desc := v_paoe || ' - ' || COALESCE(NULLIF(v_linha->>'paoe_nome', ''), 'PAOE ' || v_paoe);
    IF NOT v_paoe = ANY (v_paoes) THEN v_paoes := v_paoes || v_paoe; END IF;

    -- Programa
    SELECT id INTO v_prog_id FROM public.fin_programas_orcamentarios
     WHERE exercicio = p_exercicio AND ltrim(codigo, '0') = ltrim(v_prog, '0')
     ORDER BY (codigo = v_prog) DESC LIMIT 1;
    IF v_prog_id IS NULL THEN
      IF NOT v_prog = ANY (v_cri_prog) THEN v_cri_prog := v_cri_prog || v_prog; END IF;
      IF NOT p_simular THEN
        INSERT INTO public.fin_programas_orcamentarios (codigo, nome, exercicio)
        VALUES (v_prog, COALESCE(NULLIF(v_linha->>'programa_nome', ''), 'Programa ' || v_prog), p_exercicio)
        RETURNING id INTO v_prog_id;
      END IF;
    END IF;

    -- Ação (PAOE)
    v_acao_id := NULL;
    IF v_prog_id IS NOT NULL THEN
      SELECT id INTO v_acao_id FROM public.fin_acoes_orcamentarias
       WHERE programa_id = v_prog_id AND ltrim(codigo, '0') = ltrim(v_paoe, '0')
       ORDER BY (codigo = v_paoe) DESC, ativo DESC NULLS LAST, created_at LIMIT 1;
    END IF;
    IF v_acao_id IS NULL THEN
      IF NOT v_paoe_desc = ANY (v_cri_acao) THEN v_cri_acao := v_cri_acao || v_paoe_desc; END IF;
      IF NOT p_simular THEN
        INSERT INTO public.fin_acoes_orcamentarias (programa_id, codigo, nome)
        VALUES (v_prog_id, v_paoe, COALESCE(NULLIF(v_linha->>'paoe_nome', ''), 'PAOE ' || v_paoe))
        RETURNING id INTO v_acao_id;
      END IF;
    END IF;

    -- Natureza: 8 dígitos do FIPLAN ou o elemento (6 dígitos) quando o subelemento é 00
    SELECT id INTO v_nat_id FROM public.fin_naturezas_despesa
     WHERE regexp_replace(codigo, '\D', '', 'g') = v_nat
        OR (substr(v_nat, 7, 2) = '00' AND regexp_replace(codigo, '\D', '', 'g') = substr(v_nat, 1, 6))
     ORDER BY (regexp_replace(codigo, '\D', '', 'g') = v_nat) DESC, ativo DESC NULLS LAST
     LIMIT 1;
    IF v_nat_id IS NULL THEN
      DECLARE
        v_nat_cod text := concat_ws('.', substr(v_nat, 1, 1), substr(v_nat, 2, 1), substr(v_nat, 3, 2),
                                    substr(v_nat, 5, 2), NULLIF(substr(v_nat, 7, 2), '00'));
      BEGIN
        IF NOT v_nat_cod = ANY (v_cri_nat) THEN v_cri_nat := v_cri_nat || v_nat_cod; END IF;
        IF NOT p_simular THEN
          INSERT INTO public.fin_naturezas_despesa
            (codigo, nome, categoria_economica, grupo_natureza, modalidade_aplicacao, elemento, subelemento)
          VALUES (v_nat_cod, 'Natureza ' || v_nat_cod || ' (importada do QDD, revisar descrição)',
                  substr(v_nat, 1, 1), substr(v_nat, 2, 1), substr(v_nat, 3, 2), substr(v_nat, 5, 2), substr(v_nat, 7, 2))
          RETURNING id INTO v_nat_id;
        END IF;
      END;
    END IF;

    -- Fonte: compara só os dígitos (1.500 = 1500)
    SELECT id INTO v_fonte_id FROM public.fin_fontes_recurso
     WHERE regexp_replace(codigo, '\D', '', 'g') = replace(v_fonte, '.', '')
     ORDER BY ativo DESC NULLS LAST LIMIT 1;
    IF v_fonte_id IS NULL THEN
      IF NOT v_fonte = ANY (v_cri_fonte) THEN v_cri_fonte := v_cri_fonte || v_fonte; END IF;
      IF NOT p_simular THEN
        INSERT INTO public.fin_fontes_recurso (codigo, nome)
        VALUES (v_fonte, 'Fonte ' || v_fonte || ' (importada do QDD, revisar descrição)')
        RETURNING id INTO v_fonte_id;
      END IF;
    END IF;

    -- Dotação existente: chave nova; senão, a do importador antigo de planilha
    SELECT * INTO v_existente FROM public.fin_dotacoes
     WHERE exercicio = p_exercicio AND codigo_dotacao = v_codigo;
    v_achou := FOUND;
    IF NOT v_achou THEN
      SELECT * INTO v_existente FROM public.fin_dotacoes
       WHERE exercicio = p_exercicio
         AND codigo_dotacao IN (v_nat || '.' || v_fonte || '.' || (v_linha->>'idu'),
                                v_nat || '.' || replace(v_fonte, '.', '') || '.' || (v_linha->>'idu'))
         AND split_part(COALESCE(paoe, ''), ' ', 1) = v_paoe
         AND NOT (id = ANY (v_ids))
       LIMIT 1;
      v_achou := FOUND;
    END IF;

    v_novo := jsonb_build_object(
      'valor_inicial',       COALESCE((v_val->>'inicial')::numeric, 0),
      'valor_suplementado',  COALESCE((v_val->>'suplementado')::numeric, 0),
      'valor_reduzido',      COALESCE((v_val->>'anulado')::numeric, 0),
      'valor_bloqueado',     COALESCE((v_val->>'bloqueado')::numeric, 0),
      'valor_reserva',       COALESCE((v_val->>'reserva')::numeric, 0),
      'valor_ped',           COALESCE((v_val->>'ped')::numeric, 0),
      'valor_empenhado',     COALESCE((v_val->>'empenhado')::numeric, 0),
      'valor_liquidado',     COALESCE((v_val->>'liquidado')::numeric, 0),
      'valor_em_liquidacao', COALESCE((v_val->>'em_liquidacao')::numeric, 0),
      'valor_pago',          COALESCE((v_val->>'pago')::numeric, 0),
      'valor_restos_pagar',  COALESCE((v_val->>'restos')::numeric, 0),
      'paoe',                v_paoe_desc,
      'regional',            v_linha->>'regional',
      'cod_acompanhamento',  v_linha->>'cod_acomp',
      'idu',                 v_linha->>'idu',
      'tro',                 v_linha->>'tro',
      'ativo',               true
    )
    -- Vínculos só entram na comparação quando já existem (na simulação, os que seriam
    -- criados aparecem em "criados").
    || jsonb_strip_nulls(jsonb_build_object(
      'programa_id',         v_prog_id,
      'acao_id',             v_acao_id,
      'natureza_despesa_id', v_nat_id,
      'fonte_recurso_id',    v_fonte_id
    ));

    IF NOT v_achou THEN
      v_ins := v_ins + 1;
      v_dotacao_id := NULL;
      IF NOT p_simular THEN
        INSERT INTO public.fin_dotacoes (
          exercicio, codigo_dotacao, programa_id, acao_id, natureza_despesa_id, fonte_recurso_id,
          paoe, regional, cod_acompanhamento, idu, tro,
          valor_inicial, valor_suplementado, valor_reduzido, valor_bloqueado, valor_reserva, valor_ped,
          valor_empenhado, valor_liquidado, valor_em_liquidacao, valor_pago, valor_restos_pagar,
          ativo, created_by
        ) VALUES (
          p_exercicio, v_codigo, v_prog_id, v_acao_id, v_nat_id, v_fonte_id,
          v_paoe_desc, v_linha->>'regional', v_linha->>'cod_acomp', v_linha->>'idu', v_linha->>'tro',
          (v_novo->>'valor_inicial')::numeric, (v_novo->>'valor_suplementado')::numeric,
          (v_novo->>'valor_reduzido')::numeric, (v_novo->>'valor_bloqueado')::numeric,
          (v_novo->>'valor_reserva')::numeric, (v_novo->>'valor_ped')::numeric,
          (v_novo->>'valor_empenhado')::numeric, (v_novo->>'valor_liquidado')::numeric,
          (v_novo->>'valor_em_liquidacao')::numeric, (v_novo->>'valor_pago')::numeric,
          (v_novo->>'valor_restos_pagar')::numeric,
          true, v_uid
        ) RETURNING id INTO v_dotacao_id;
        v_ids := v_ids || v_dotacao_id;
      END IF;
      v_resultado := v_resultado || jsonb_build_object('indice', v_idx, 'acao', 'inserir');
    ELSE
      v_ids := v_ids || v_existente.id;
      SELECT COALESCE(jsonb_object_agg(k, jsonb_build_array(to_jsonb(v_existente) -> k, v_novo -> k)), '{}'::jsonb)
        INTO v_mudancas
        FROM jsonb_object_keys(v_novo) AS k
       WHERE (to_jsonb(v_existente) -> k) IS DISTINCT FROM (v_novo -> k);
      IF v_existente.codigo_dotacao <> v_codigo THEN
        v_mudancas := v_mudancas || jsonb_build_object('codigo_dotacao',
                        jsonb_build_array(v_existente.codigo_dotacao, v_codigo));
      END IF;

      IF v_mudancas = '{}'::jsonb THEN
        v_igual := v_igual + 1;
        v_resultado := v_resultado || jsonb_build_object('indice', v_idx, 'acao', 'sem_alteracao');
      ELSE
        v_upd := v_upd + 1;
        v_resultado := v_resultado || jsonb_build_object('indice', v_idx, 'acao', 'atualizar', 'mudancas', v_mudancas);
      END IF;

      IF NOT p_simular AND v_mudancas <> '{}'::jsonb THEN
        UPDATE public.fin_dotacoes SET
          codigo_dotacao      = v_codigo,
          programa_id         = COALESCE(v_prog_id, programa_id),
          acao_id             = COALESCE(v_acao_id, acao_id),
          natureza_despesa_id = COALESCE(v_nat_id, natureza_despesa_id),
          fonte_recurso_id    = COALESCE(v_fonte_id, fonte_recurso_id),
          paoe                = v_paoe_desc,
          regional            = v_linha->>'regional',
          cod_acompanhamento  = v_linha->>'cod_acomp',
          idu                 = v_linha->>'idu',
          tro                 = v_linha->>'tro',
          valor_inicial       = (v_novo->>'valor_inicial')::numeric,
          valor_suplementado  = (v_novo->>'valor_suplementado')::numeric,
          valor_reduzido      = (v_novo->>'valor_reduzido')::numeric,
          valor_bloqueado     = (v_novo->>'valor_bloqueado')::numeric,
          valor_reserva       = (v_novo->>'valor_reserva')::numeric,
          valor_ped           = (v_novo->>'valor_ped')::numeric,
          valor_empenhado     = (v_novo->>'valor_empenhado')::numeric,
          valor_liquidado     = (v_novo->>'valor_liquidado')::numeric,
          valor_em_liquidacao = (v_novo->>'valor_em_liquidacao')::numeric,
          valor_pago          = (v_novo->>'valor_pago')::numeric,
          valor_restos_pagar  = (v_novo->>'valor_restos_pagar')::numeric,
          ativo               = true,
          updated_at          = now()
        WHERE id = v_existente.id;
      END IF;
    END IF;
  END LOOP;

  -- Dotações ativas dos mesmos PAOEs que não vieram no arquivo: só avisadas, nunca apagadas.
  SELECT array_agg(d.codigo_dotacao ORDER BY d.codigo_dotacao) INTO v_ausentes
    FROM public.fin_dotacoes d
   WHERE d.exercicio = p_exercicio
     AND d.ativo
     AND split_part(COALESCE(d.paoe, ''), ' ', 1) = ANY (v_paoes)
     AND NOT (d.id = ANY (v_ids));

  v_resumo := jsonb_build_object(
    'totais', jsonb_build_object('inserir', v_ins, 'atualizar', v_upd, 'sem_alteracao', v_igual),
    'criados', jsonb_strip_nulls(jsonb_build_object(
      'Programas', CASE WHEN cardinality(v_cri_prog) > 0 THEN to_jsonb(v_cri_prog) END,
      'Ações (PAOE)', CASE WHEN cardinality(v_cri_acao) > 0 THEN to_jsonb(v_cri_acao) END,
      'Naturezas de despesa', CASE WHEN cardinality(v_cri_nat) > 0 THEN to_jsonb(v_cri_nat) END,
      'Fontes de recurso', CASE WHEN cardinality(v_cri_fonte) > 0 THEN to_jsonb(v_cri_fonte) END)),
    'ausentes', to_jsonb(COALESCE(v_ausentes, '{}'::text[]))
  );

  IF NOT p_simular THEN
    INSERT INTO public.importacoes
      (tipo, modulo, arquivo_nome, arquivo_sha256, arquivo_tamanho, exercicio, resumo, detalhes, created_by)
    VALUES
      ('qdd_fiplan', 'financeiro', p_arquivo->>'nome', p_arquivo->>'sha256', (p_arquivo->>'tamanho')::bigint,
       p_exercicio, v_resumo, v_resultado, v_uid)
    RETURNING id INTO v_import_id;
  END IF;

  RETURN v_resumo || jsonb_build_object(
    'simulacao', p_simular,
    'importacao_id', v_import_id,
    'linhas', v_resultado
  );
END;
$_$;


--
-- Name: FUNCTION importar_qdd_fiplan(p_exercicio integer, p_linhas jsonb, p_arquivo jsonb, p_simular boolean); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.importar_qdd_fiplan(p_exercicio integer, p_linhas jsonb, p_arquivo jsonb, p_simular boolean) IS 'Importa o QDD exportado do FIPLAN para fin_dotacoes (p_simular = true só calcula as mudanças). Exige orcamento.importar.';


--
-- Name: is_active_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_active_user() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT COALESCE((SELECT is_active FROM public.profiles WHERE id = auth.uid()), false);
$$;


--
-- Name: is_active_user(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_active_user(p_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT COALESCE((SELECT is_active FROM public.profiles WHERE id = p_user_id), false);
$$;


--
-- Name: is_admin_atual(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin_atual() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT public.is_admin_user(auth.uid());
$$;


--
-- Name: is_admin_user(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin_user(_user_id uuid DEFAULT auth.uid()) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.user_id = _user_id AND ur.role = 'admin' AND p.is_active
  );
$$;


--
-- Name: is_user_active(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_user_active(_user_id uuid DEFAULT auth.uid()) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT COALESCE((SELECT is_active FROM public.profiles WHERE id = _user_id), false);
$$;


--
-- Name: lancamento_cache_invalidar(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.lancamento_cache_invalidar() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  PERFORM set_config('lancamento.geracao',
    (coalesce(nullif(current_setting('lancamento.geracao', true), ''), '0')::bigint + 1)::text, true);
  PERFORM set_config('trilha.contexto', '', true);
  RETURN NULL;
END;
$$;


--
-- Name: lancamento_modulos_tabela(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.lancamento_modulos_tabela(p_tabela text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN CASE
    WHEN p_tabela IN ('consignacoes', 'dependentes_irrf', 'eventos_esocial', 'fichas_financeiras', 'folhas_pagamento',
                      'itens_ficha_financeira', 'itens_retorno_bancario', 'lancamentos_folha', 'parametros_folha',
                      'pensoes_alimenticias', 'remessas_bancarias', 'rubricas', 'tabela_inss', 'tabela_irrf',
                      'retornos_bancarios', 'exportacoes_folha', 'viagens_diarias', 'contas_autarquia', 'config_autarquia',
                      'config_institucional')
      THEN ARRAY['rh', 'financeiro']
    WHEN p_tabela = 'documentos' THEN ARRAY['rh', 'workflow', 'gabinete', 'governanca', 'admin']
    WHEN p_tabela IN ('historico_funcional', 'pre_cadastros', 'provimentos') THEN ARRAY['rh', 'gabinete']
    WHEN p_tabela IN ('composicao_cargos', 'vagas_cargo') THEN ARRAY['rh', 'governanca']
    WHEN p_tabela = 'nomeacoes_chefe_unidade' THEN ARRAY['rh', 'patrimonio']
    WHEN p_tabela IN ('adicionais_tempo_servico', 'agrupamento_unidade_vinculo', 'banco_horas', 'bancos_cnab',
                      'cargo_unidade_compatibilidade', 'cargos', 'cessoes', 'comissoes', 'comissoes_membros',
                      'config_agrupamento_unidades', 'config_assinatura_frequencia', 'config_compensacao',
                      'config_fechamento_folha', 'config_fechamento_frequencia', 'config_incidencias',
                      'config_jornada_padrao', 'config_motivos_desligamento', 'config_regras_calculo', 'config_rubricas',
                      'config_situacoes_funcionais', 'config_tipos_ato', 'config_tipos_onus', 'config_tipos_rubrica',
                      'config_tipos_servidor', 'configuracao_jornada', 'designacoes', 'dias_nao_uteis',
                      'documentos_requerimento_servidor', 'feriados', 'ferias_servidor', 'frequencia_arquivos',
                      'frequencia_fechamento', 'frequencia_mensal', 'frequencia_pacotes', 'horarios_jornada',
                      'justificativas_ponto', 'lancamentos_banco_horas', 'licencas_afastamentos', 'lotacoes',
                      'memorandos_lotacao', 'ocorrencias_servidor', 'portarias_servidor', 'regimes_trabalho',
                      'registros_ponto', 'servidor_regime', 'servidor_tag_vinculos', 'servidor_tags', 'servidores',
                      'solicitacoes_abono', 'solicitacoes_ajuste_ponto', 'tipos_abono', 'vinculos_funcionais',
                      'vinculos_servidor')
      THEN ARRAY['rh']
  END;
END;
$$;


--
-- Name: list_public_tables(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.list_public_tables() RETURNS TABLE(table_name text, row_count bigint)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_name::text,
    (xpath('/row/count/text()', 
      query_to_xml(format('SELECT COUNT(*) FROM %I.%I', t.table_schema, t.table_name), false, true, '')
    ))[1]::text::bigint AS row_count
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND t.table_name NOT LIKE 'pg_%'
    AND t.table_name NOT LIKE '_realtime_%'
    AND t.table_name NOT LIKE 'schema_%'
    AND t.table_name NOT IN ('supabase_functions_migrations', 'buckets', 'objects', 'tenants', 'extensions')
  ORDER BY t.table_name;
END;
$$;


--
-- Name: FUNCTION list_public_tables(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.list_public_tables() IS 'Função para descoberta automática de tabelas do sistema. Usada pelas Edge Functions database-schema e backup-offsite para listar dinamicamente todas as tabelas sem necessidade de manutenção manual.';


--
-- Name: listar_permissoes_usuario(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.listar_permissoes_usuario(check_user_id uuid) RETURNS TABLE(funcao_id text, funcao_codigo text, funcao_nome text, modulo text, submodulo text, tipo_acao text, perfil_nome text, rota text, icone text)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  user_role text;
BEGIN
  SELECT ur.role::text INTO user_role
  FROM public.user_roles ur
  WHERE ur.user_id = check_user_id
  ORDER BY (ur.role = 'admin') DESC
  LIMIT 1;

  -- Super admin: uma entrada sintética, o bypass é resolvido no front.
  IF user_role = 'admin' THEN
    RETURN QUERY SELECT
      'admin'::text, 'admin'::text, 'Administrador'::text,
      'admin'::text, NULL::text, 'full'::text,
      'Administrador'::text, '/admin'::text, 'shield'::text;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    mpc.id::text,
    mpc.permission_code::text,
    mpc.label::text,
    mpc.module_code::text,
    mpc.category::text,
    mpc.action_type::text,
    COALESCE(user_role, 'user')::text,
    NULL::text,
    NULL::text
  FROM public.module_permissions_catalog mpc
  WHERE mpc.permission_code = ANY (public.get_user_permission_codes(check_user_id))
  ORDER BY mpc.module_code, mpc.sort_order;
END;
$$;


--
-- Name: log_alteracao_pagina(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_alteracao_pagina() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  acao_descricao TEXT;
BEGIN
  -- Determinar ação
  IF OLD.ativo != NEW.ativo THEN
    acao_descricao := CASE WHEN NEW.ativo THEN 'ativar' ELSE 'desativar' END;
  ELSIF OLD.em_manutencao != NEW.em_manutencao THEN
    acao_descricao := CASE WHEN NEW.em_manutencao THEN 'manutencao_on' ELSE 'manutencao_off' END;
  ELSE
    acao_descricao := 'atualizar';
  END IF;

  INSERT INTO public.config_paginas_historico (
    pagina_id,
    acao,
    dados_anteriores,
    dados_novos,
    usuario_id
  ) VALUES (
    NEW.id,
    acao_descricao,
    row_to_json(OLD)::jsonb,
    row_to_json(NEW)::jsonb,
    auth.uid()
  );

  RETURN NEW;
END;
$$;


--
-- Name: log_audit(public.audit_action, character varying, uuid, character varying, jsonb, jsonb, text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_audit(_action public.audit_action, _entity_type character varying DEFAULT NULL::character varying, _entity_id uuid DEFAULT NULL::uuid, _module_name character varying DEFAULT NULL::character varying, _before_data jsonb DEFAULT NULL::jsonb, _after_data jsonb DEFAULT NULL::jsonb, _description text DEFAULT NULL::text, _metadata jsonb DEFAULT '{}'::jsonb) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  _log_id UUID;
  _user_role app_role;
  _user_org_unit UUID;
  _meta jsonb;
BEGIN
  -- perfil bloqueado/inexistente não grava (a sessão do Auth dele pode continuar válida). Sem usuário
  -- (service role, ou registrar_denuncia_publica chamada por anon) segue como antes.
  IF auth.uid() IS NOT NULL AND NOT public.is_active_user() THEN
    RAISE EXCEPTION 'Usuário inativo' USING ERRCODE = '42501';
  END IF;
  IF lower(btrim(coalesce(_module_name, ''))) = 'rh' THEN
    IF _action::text NOT IN ('view', 'export', 'download') THEN
      RAISE EXCEPTION 'log_audit: no módulo rh só view, export e download (lançamentos entram pela trilha do banco)'
        USING ERRCODE = '22023';
    END IF;
    IF _before_data IS NOT NULL OR _after_data IS NOT NULL THEN
      RAISE EXCEPTION 'log_audit: no módulo rh a linha não leva antes/depois' USING ERRCODE = '22023';
    END IF;
  END IF;
  -- linha de arquivo do Storage (entity_type storage.<bucket>) só vem do trigger trilha_storage (E2)
  IF lower(btrim(coalesce(_entity_type, ''))) LIKE 'storage.%' THEN
    RAISE EXCEPTION 'log_audit: entity_type storage.* é gravado só pelo banco (trilha do Storage)' USING ERRCODE = '22023';
  END IF;
  IF length(coalesce(_before_data::text, '')) > 32768 OR length(coalesce(_after_data::text, '')) > 32768
     OR length(coalesce(_metadata::text, '')) > 32768 THEN
    RAISE EXCEPTION 'log_audit: antes, depois e metadados têm limite de 32 KB cada' USING ERRCODE = '22023';
  END IF;
  _meta := CASE WHEN _metadata IS NULL THEN '{}'::jsonb
                WHEN jsonb_typeof(_metadata) = 'object' THEN _metadata
                ELSE jsonb_build_object('valor', _metadata) END;
  _meta := (_meta - ARRAY['trigger', 'operation', 'table', 'registrar_evento', 'fonte', 'servidor_alvo_id'])
           || jsonb_build_object('fonte', 'log_audit');

  SELECT role INTO _user_role 
  FROM public.user_roles 
  WHERE user_id = auth.uid() 
  LIMIT 1;
  
  -- unidade da lotação vigente do servidor do login (como o resto da trilha, regra de setor 20261011020000); antes,
  -- a unidade principal de user_org_units (escopo de acesso, não onde a pessoa trabalha)
  SELECT lv.unidade_id INTO _user_org_unit
    FROM public.profiles p CROSS JOIN LATERAL public.lotacao_vigente(p.servidor_id) lv
   WHERE p.id = auth.uid() AND p.servidor_id IS NOT NULL
   LIMIT 1;
  
  INSERT INTO public.audit_logs (
    user_id, action, entity_type, entity_id, module_name,
    before_data, after_data, description, metadata,
    role_at_time, org_unit_id
  )
  VALUES (
    auth.uid(), _action, _entity_type, _entity_id, _module_name,
    _before_data, _after_data, _description, _meta,
    _user_role, _user_org_unit
  )
  RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$$;


--
-- Name: lotacao_vigente(uuid, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.lotacao_vigente(p_servidor_id uuid, p_data date DEFAULT NULL::date) RETURNS TABLE(origem text, registro_id uuid, unidade_id uuid, tipo text, data_inicio date, data_fim date, ato_tipo text, ato_numero text, ato_data date, ato_doe_numero text, ato_doe_data date, created_by_servidor_id uuid)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  d date := coalesce(p_data, public.data_local());
BEGIN
  RETURN QUERY
  SELECT x.o, x.rid, x.uni, x.tp, x.di, x.df, x.a_tipo, x.a_num, x.a_data, x.a_doe_num, x.a_doe_data, x.autor
    FROM (
      SELECT 'lotacao'::text AS o, l.id AS rid, l.unidade_id AS uni, coalesce(l.tipo_lotacao::text, 'lotacao_interna') AS tp,
             l.data_inicio AS di, l.data_fim AS df, l.ato_tipo AS a_tipo, l.ato_numero AS a_num, l.ato_data AS a_data,
             l.ato_doe_numero AS a_doe_num, l.ato_doe_data AS a_doe_data, l.created_by_servidor_id AS autor
        FROM public.lotacoes l
       WHERE l.servidor_id = p_servidor_id AND l.ativo IS TRUE
         AND l.data_inicio <= d AND (l.data_fim IS NULL OR l.data_fim >= d)
         AND l.tipo_lotacao IS DISTINCT FROM 'lotacao_externa'
         AND EXISTS (SELECT 1 FROM public.estrutura_organizacional e WHERE e.id = l.unidade_id)
      UNION ALL
      SELECT 'cessao'::text, c.id, c.unidade_idjuv_id, 'cessao_entrada', c.data_inicio, coalesce(c.data_retorno, c.data_fim),
             c.ato_tipo, c.ato_numero, c.ato_data, c.ato_doe_numero, c.ato_doe_data, c.created_by_servidor_id
        FROM public.cessoes c
       WHERE c.servidor_id = p_servidor_id AND c.tipo = 'entrada' AND c.ativa IS TRUE AND c.unidade_idjuv_id IS NOT NULL
         AND c.data_inicio <= d AND (coalesce(c.data_retorno, c.data_fim) IS NULL OR coalesce(c.data_retorno, c.data_fim) >= d)
         AND EXISTS (SELECT 1 FROM public.estrutura_organizacional e WHERE e.id = c.unidade_idjuv_id)
    ) x
   ORDER BY (x.o = 'cessao'), x.di DESC;
END;
$$;


--
-- Name: FUNCTION lotacao_vigente(p_servidor_id uuid, p_data date); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.lotacao_vigente(p_servidor_id uuid, p_data date) IS 'Lotação ativa vigente do servidor na data (padrão: data_local(); fora lotacao_externa) e cessão de entrada com unidade no órgão; lotação primeiro; created_by_servidor_id = quem lançou';


--
-- Name: marcar_escola_cadastrada(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.marcar_escola_cadastrada() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  UPDATE public.escolas_jer 
  SET ja_cadastrada = true, updated_at = now()
  WHERE id = NEW.escola_id;
  RETURN NEW;
END;
$$;


--
-- Name: mascarar_parcial(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mascarar_parcial(p_valor text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    SET search_path TO 'public'
    AS $_$
DECLARE
  d text;
BEGIN
  IF p_valor IS NULL THEN
    RETURN NULL;
  END IF;
  IF p_valor = '[protegido]' OR p_valor ~ '^\*\*\*\.[0-9]{3}\.[0-9]{3}-\*\*$' OR p_valor ~ '^\*\*\*[0-9]*\*\*$' THEN
    RETURN p_valor;
  END IF;
  d := regexp_replace(p_valor, '\D', '', 'g');
  IF length(d) = 11 THEN
    RETURN '***.' || substr(d, 4, 3) || '.' || substr(d, 7, 3) || '-**';
  ELSIF length(d) >= 6 THEN
    RETURN '***' || substr(d, 4, length(d) - 5) || '**';
  END IF;
  RETURN '[protegido]';
END;
$_$;


--
-- Name: meu_servidor_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.meu_servidor_id() RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT servidor_id FROM public.profiles WHERE id = auth.uid() AND is_active;
$$;


--
-- Name: meus_fundamentos_lancamento(public.app_module[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.meus_fundamentos_lancamento(p_modulos public.app_module[] DEFAULT NULL::public.app_module[]) RETURNS TABLE(modulo text, modo text, permitido boolean, bloqueado boolean, via text, unidade_id uuid, unidade_nome text, lotacao_id uuid, cessao_id uuid, designacao_id uuid, comissao_id uuid, ato jsonb)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  m text;
  f jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_active_user() THEN
    RAISE EXCEPTION 'meus_fundamentos_lancamento: usuário não autenticado ou inativo' USING ERRCODE = '42501';
  END IF;
  FOR m IN SELECT e::text FROM unnest(enum_range(NULL::public.app_module)) AS e
            WHERE p_modulos IS NULL OR e = ANY (p_modulos) LOOP
    f := public.fundamento_lancamento(ARRAY[m]);
    modulo := m;
    modo := f ->> 'modo';
    permitido := (f ->> 'permitido')::boolean;
    bloqueado := modo = 'exigir' AND NOT permitido;
    via := f ->> 'via';
    unidade_id := (f ->> 'unidade_id')::uuid;
    unidade_nome := (SELECT e.nome FROM public.estrutura_organizacional e WHERE e.id = unidade_id);
    lotacao_id := (f ->> 'lotacao_id')::uuid;
    cessao_id := (f ->> 'cessao_id')::uuid;
    designacao_id := (f ->> 'designacao_id')::uuid;
    comissao_id := (f ->> 'comissao_id')::uuid;
    ato := f -> 'ato';
    RETURN NEXT;
  END LOOP;
END;
$$;


--
-- Name: FUNCTION meus_fundamentos_lancamento(p_modulos public.app_module[]); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.meus_fundamentos_lancamento(p_modulos public.app_module[]) IS 'Por módulo (todos, ou os de p_modulos): modo da regra de lançamento, se o login tem fundamento de setor hoje (via, unidade, ato) e se está bloqueado (exigir sem fundamento)';


--
-- Name: numerar_despacho(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.numerar_despacho() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  SELECT COALESCE(MAX(numero_despacho), 0) + 1 INTO NEW.numero_despacho FROM public.despachos WHERE processo_id = NEW.processo_id;
  RETURN NEW;
END; $$;


--
-- Name: numerar_movimentacao(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.numerar_movimentacao() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  SELECT COALESCE(MAX(numero_sequencial), 0) + 1 INTO NEW.numero_sequencial FROM public.movimentacoes_processo WHERE processo_id = NEW.processo_id;
  RETURN NEW;
END; $$;


--
-- Name: obter_dado_oficial(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.obter_dado_oficial(p_chave text) RETURNS text
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT valor FROM public.dados_oficiais WHERE chave = p_chave LIMIT 1;
$$;


--
-- Name: obter_parametro_simples(uuid, character varying, date, uuid, character varying, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.obter_parametro_simples(p_instituicao_id uuid, p_parametro_codigo character varying, p_data_referencia date DEFAULT CURRENT_DATE, p_servidor_id uuid DEFAULT NULL::uuid, p_tipo_servidor character varying DEFAULT NULL::character varying, p_unidade_id uuid DEFAULT NULL::uuid) RETURNS text
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_json jsonb;
BEGIN
    v_json := public.obter_parametro_vigente(
        p_instituicao_id, p_parametro_codigo, p_data_referencia,
        p_servidor_id, p_tipo_servidor, p_unidade_id
    );
    IF v_json ? 'v' THEN RETURN v_json->>'v'; END IF;
    RETURN v_json::text;
END;
$$;


--
-- Name: FUNCTION obter_parametro_simples(p_instituicao_id uuid, p_parametro_codigo character varying, p_data_referencia date, p_servidor_id uuid, p_tipo_servidor character varying, p_unidade_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.obter_parametro_simples(p_instituicao_id uuid, p_parametro_codigo character varying, p_data_referencia date, p_servidor_id uuid, p_tipo_servidor character varying, p_unidade_id uuid) IS 'Wrapper que extrai valor simples de parâmetro. Para valores simples usa {"v": valor}.';


--
-- Name: obter_parametro_vigente(uuid, character varying, date, uuid, character varying, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.obter_parametro_vigente(p_instituicao_id uuid, p_parametro_codigo character varying, p_data_referencia date DEFAULT CURRENT_DATE, p_servidor_id uuid DEFAULT NULL::uuid, p_tipo_servidor character varying DEFAULT NULL::character varying, p_unidade_id uuid DEFAULT NULL::uuid) RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_resultado jsonb;
    v_valor_padrao jsonb;
BEGIN
    -- Nível 4: Servidor individual
    IF p_servidor_id IS NOT NULL THEN
        SELECT valor INTO v_resultado
        FROM public.config_parametros_valores
        WHERE instituicao_id = p_instituicao_id
          AND parametro_codigo = p_parametro_codigo
          AND servidor_id = p_servidor_id
          AND ativo = true
          AND vigencia_inicio <= p_data_referencia
          AND (vigencia_fim IS NULL OR vigencia_fim >= p_data_referencia)
        ORDER BY vigencia_inicio DESC
        LIMIT 1;
        IF v_resultado IS NOT NULL THEN RETURN v_resultado; END IF;
    END IF;
    
    -- Nível 3: Tipo de servidor
    IF p_tipo_servidor IS NOT NULL THEN
        SELECT valor INTO v_resultado
        FROM public.config_parametros_valores
        WHERE instituicao_id = p_instituicao_id
          AND parametro_codigo = p_parametro_codigo
          AND tipo_servidor = p_tipo_servidor
          AND servidor_id IS NULL
          AND ativo = true
          AND vigencia_inicio <= p_data_referencia
          AND (vigencia_fim IS NULL OR vigencia_fim >= p_data_referencia)
        ORDER BY vigencia_inicio DESC
        LIMIT 1;
        IF v_resultado IS NOT NULL THEN RETURN v_resultado; END IF;
    END IF;
    
    -- Nível 2: Unidade
    IF p_unidade_id IS NOT NULL THEN
        SELECT valor INTO v_resultado
        FROM public.config_parametros_valores
        WHERE instituicao_id = p_instituicao_id
          AND parametro_codigo = p_parametro_codigo
          AND unidade_id = p_unidade_id
          AND tipo_servidor IS NULL
          AND servidor_id IS NULL
          AND ativo = true
          AND vigencia_inicio <= p_data_referencia
          AND (vigencia_fim IS NULL OR vigencia_fim >= p_data_referencia)
        ORDER BY vigencia_inicio DESC
        LIMIT 1;
        IF v_resultado IS NOT NULL THEN RETURN v_resultado; END IF;
    END IF;
    
    -- Nível 1: Instituição (padrão)
    SELECT valor INTO v_resultado
    FROM public.config_parametros_valores
    WHERE instituicao_id = p_instituicao_id
      AND parametro_codigo = p_parametro_codigo
      AND unidade_id IS NULL
      AND tipo_servidor IS NULL
      AND servidor_id IS NULL
      AND ativo = true
      AND vigencia_inicio <= p_data_referencia
      AND (vigencia_fim IS NULL OR vigencia_fim >= p_data_referencia)
    ORDER BY vigencia_inicio DESC
    LIMIT 1;
    IF v_resultado IS NOT NULL THEN RETURN v_resultado; END IF;
    
    -- Nível 0: Fallback do sistema (valor_padrao do metadado)
    SELECT valor_padrao INTO v_valor_padrao
    FROM public.config_parametros_meta
    WHERE codigo = p_parametro_codigo AND ativo = true;
    
    RETURN COALESCE(v_valor_padrao, '{}'::jsonb);
END;
$$;


--
-- Name: FUNCTION obter_parametro_vigente(p_instituicao_id uuid, p_parametro_codigo character varying, p_data_referencia date, p_servidor_id uuid, p_tipo_servidor character varying, p_unidade_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.obter_parametro_vigente(p_instituicao_id uuid, p_parametro_codigo character varying, p_data_referencia date, p_servidor_id uuid, p_tipo_servidor character varying, p_unidade_id uuid) IS 'Resolve parâmetro por hierarquia (Servidor→TipoServidor→Unidade→Instituição→Fallback) considerando vigência temporal. Retorna JSONB.';


--
-- Name: obter_protocolo_arbitro(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.obter_protocolo_arbitro(p_id uuid) RETURNS text
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT protocolo FROM public.cadastro_arbitros WHERE id = p_id;
$$;


--
-- Name: obter_remessa_bancaria(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.obter_remessa_bancaria(p_id uuid) RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_json jsonb;
BEGIN
  IF v_uid IS NULL
     OR NOT COALESCE(public.perfil_ativo_atual()
                     AND public.can_access_module(v_uid, 'financeiro')
                     AND public.has_permission_code(v_uid, 'pagamento.conciliar'), false) THEN
    RAISE EXCEPTION 'Sem permissão para obter remessa bancária (pagamento.conciliar).' USING ERRCODE = '42501';
  END IF;
  v_json := public.fin_remessa_bancaria_json(p_id);
  IF v_json IS NULL THEN
    RAISE EXCEPTION 'Remessa não encontrada.' USING ERRCODE = 'P0002';
  END IF;
  RETURN v_json;
END;
$$;


--
-- Name: FUNCTION obter_remessa_bancaria(p_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.obter_remessa_bancaria(p_id uuid) IS 'Devolve a remessa de reenvio (convênio, conta pagadora, data, créditos e hash) para baixar o arquivo de novo. Exige pagamento.conciliar.';


SET default_table_access_method = heap;

--
-- Name: bens_patrimoniais; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bens_patrimoniais (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero_patrimonio character varying(30) NOT NULL,
    item_id uuid,
    descricao character varying(200) NOT NULL,
    especificacao text,
    marca character varying(100),
    modelo character varying(100),
    numero_serie character varying(100),
    data_aquisicao date NOT NULL,
    valor_aquisicao numeric(18,2) NOT NULL,
    nota_fiscal character varying(50),
    empenho_id uuid,
    fornecedor_id uuid,
    unidade_id uuid,
    unidade_local_id uuid,
    responsavel_id uuid,
    localizacao_especifica text,
    valor_residual numeric(18,2),
    depreciacao_acumulada numeric(18,2) DEFAULT 0,
    valor_liquido numeric(18,2) GENERATED ALWAYS AS ((valor_aquisicao - COALESCE(depreciacao_acumulada, (0)::numeric))) STORED,
    estado_conservacao character varying(30),
    situacao character varying(30) DEFAULT 'ativo'::character varying,
    garantia_ate date,
    observacao text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    codigo_qr text,
    situacao_inventario public.situacao_bem_patrimonio DEFAULT 'cadastrado'::public.situacao_bem_patrimonio,
    categoria_bem public.categoria_bem,
    subcategoria text,
    patrimonio_anterior text,
    forma_aquisicao public.forma_aquisicao DEFAULT 'compra'::public.forma_aquisicao,
    fornecedor_cnpj_cpf text,
    data_nota_fiscal date,
    processo_sei text,
    fonte_recurso_id uuid,
    centro_custo_id uuid,
    estado_conservacao_inventario public.estado_conservacao_inventario DEFAULT 'bom'::public.estado_conservacao_inventario,
    vida_util_anos integer,
    data_ultima_avaliacao date,
    predio text,
    andar text,
    sala text,
    ponto_especifico text,
    cargo_responsavel text,
    setor_responsavel_id uuid,
    data_atribuicao_responsabilidade date,
    termo_responsabilidade_url text,
    foto_bem_url text,
    foto_etiqueta_qr_url text,
    pendencias jsonb DEFAULT '[]'::jsonb,
    CONSTRAINT bens_patrimoniais_estado_conservacao_check CHECK (((estado_conservacao)::text = ANY ((ARRAY['otimo'::character varying, 'bom'::character varying, 'regular'::character varying, 'ruim'::character varying, 'inservivel'::character varying])::text[]))),
    CONSTRAINT bens_patrimoniais_situacao_check CHECK (((situacao)::text = ANY ((ARRAY['ativo'::character varying, 'em_manutencao'::character varying, 'cedido'::character varying, 'baixado'::character varying, 'extraviado'::character varying, 'em_transferencia'::character varying])::text[])))
);


--
-- Name: COLUMN bens_patrimoniais.unidade_local_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.bens_patrimoniais.unidade_local_id IS 'Referência obrigatória à Unidade Local onde o bem está fisicamente localizado';


--
-- Name: patrimonio_buscar_bem_por_codigo(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.patrimonio_buscar_bem_por_codigo(p_codigo text) RETURNS SETOF public.bens_patrimoniais
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  WITH c AS (SELECT NULLIF(upper(btrim(p_codigo)), '') AS v)
  SELECT b.*
    FROM bens_patrimoniais b, c
   WHERE c.v IS NOT NULL
     AND (upper(btrim(b.numero_patrimonio)) = c.v
          OR upper(btrim(b.codigo_qr)) = c.v
          OR upper(btrim(b.patrimonio_anterior)) = c.v)
   ORDER BY (upper(btrim(b.numero_patrimonio)) = c.v) DESC,
            (upper(btrim(b.codigo_qr)) = c.v) DESC,
            b.created_at
   LIMIT 5
$$;


--
-- Name: patrimonio_decidir_baixa(uuid, boolean, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.patrimonio_decidir_baixa(p_baixa_id uuid, p_aprovar boolean, p_motivo_rejeicao text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_baixa baixas_patrimonio%ROWTYPE;
BEGIN
  IF NOT (public.has_permission_code(auth.uid(), 'patrimonio.tramitar')
          OR public.is_admin_user(auth.uid())) THEN
    RAISE EXCEPTION 'Sem permissão para decidir baixas de patrimônio' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_baixa FROM baixas_patrimonio WHERE id = p_baixa_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Baixa não encontrada' USING ERRCODE = 'P0002';
  END IF;
  IF v_baixa.status NOT IN ('solicitada', 'em_analise') THEN
    RAISE EXCEPTION 'Esta baixa já foi decidida (%)', v_baixa.status USING ERRCODE = '22023';
  END IF;

  IF p_aprovar THEN
    UPDATE baixas_patrimonio
       SET status = 'aprovada', aprovado_por = auth.uid(), data_aprovacao = now(),
           dados_bem_snapshot = COALESCE(dados_bem_snapshot,
             (SELECT to_jsonb(b) FROM bens_patrimoniais b WHERE b.id = v_baixa.bem_id))
     WHERE id = p_baixa_id;

    PERFORM set_config('patrimonio.evento_registrado', 'on', true);
    UPDATE bens_patrimoniais SET situacao = 'baixado', updated_at = now() WHERE id = v_baixa.bem_id;
    PERFORM set_config('patrimonio.evento_registrado', 'off', true);
  ELSE
    IF btrim(COALESCE(p_motivo_rejeicao, '')) = '' THEN
      RAISE EXCEPTION 'Informe o motivo da rejeição' USING ERRCODE = '22023';
    END IF;
    UPDATE baixas_patrimonio
       SET status = 'rejeitada', aprovado_por = auth.uid(), data_aprovacao = now(),
           motivo_rejeicao = btrim(p_motivo_rejeicao)
     WHERE id = p_baixa_id;
  END IF;

  INSERT INTO historico_patrimonio (bem_id, tipo_evento, justificativa, dados_novos, usuario_id)
  VALUES (v_baixa.bem_id,
          CASE WHEN p_aprovar THEN 'baixa_aprovada' ELSE 'baixa_rejeitada' END,
          CASE WHEN p_aprovar THEN v_baixa.justificativa ELSE btrim(p_motivo_rejeicao) END,
          jsonb_build_object('baixa_id', p_baixa_id, 'motivo', v_baixa.motivo),
          auth.uid());
END;
$$;


--
-- Name: patrimonio_decidir_movimentacao(uuid, boolean, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.patrimonio_decidir_movimentacao(p_movimentacao_id uuid, p_aprovar boolean, p_motivo_rejeicao text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_status status_movimentacao_patrimonio;
BEGIN
  IF NOT (public.has_permission_code(auth.uid(), 'patrimonio.tramitar')
          OR public.is_admin_user(auth.uid())) THEN
    RAISE EXCEPTION 'Sem permissão para decidir movimentações de patrimônio' USING ERRCODE = '42501';
  END IF;

  SELECT status INTO v_status FROM movimentacoes_patrimonio WHERE id = p_movimentacao_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Movimentação não encontrada' USING ERRCODE = 'P0002';
  END IF;
  IF v_status IS DISTINCT FROM 'pendente' THEN
    RAISE EXCEPTION 'Esta movimentação já foi decidida (%)', v_status USING ERRCODE = '22023';
  END IF;

  IF p_aprovar THEN
    UPDATE movimentacoes_patrimonio
       SET status = 'aprovado', aprovado_por = auth.uid(), data_aprovacao = now()
     WHERE id = p_movimentacao_id;
  ELSE
    IF btrim(COALESCE(p_motivo_rejeicao, '')) = '' THEN
      RAISE EXCEPTION 'Informe o motivo da rejeição' USING ERRCODE = '22023';
    END IF;
    UPDATE movimentacoes_patrimonio
       SET status = 'rejeitado', aprovado_por = auth.uid(), data_aprovacao = now(),
           motivo_rejeicao = btrim(p_motivo_rejeicao)
     WHERE id = p_movimentacao_id;
  END IF;
END;
$$;


--
-- Name: perfil_ativo_atual(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.perfil_ativo_atual() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT COALESCE((SELECT p.is_active FROM public.profiles p WHERE p.id = auth.uid()), false);
$$;


--
-- Name: pode_conciliar_pagamentos(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.pode_conciliar_pagamentos() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT COALESCE(auth.uid() IS NOT NULL
                  AND public.perfil_ativo_atual()
                  AND public.can_access_module(auth.uid(), 'financeiro')
                  AND public.has_permission_code(auth.uid(), 'pagamento.conciliar'), false);
$$;


--
-- Name: FUNCTION pode_conciliar_pagamentos(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.pode_conciliar_pagamentos() IS 'Verdadeiro se o usuário logado tem perfil ativo, o módulo financeiro e pagamento.conciliar.';


--
-- Name: pode_configurar_envios(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.pode_configurar_envios() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT public.perfil_ativo_atual()
     AND public.has_permission_code(auth.uid(), 'admin.envios.configurar');
$$;


--
-- Name: pode_configurar_ia(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.pode_configurar_ia() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT public.perfil_ativo_atual()
     AND public.has_permission_code(auth.uid(), 'ia.configurar');
$$;


--
-- Name: pode_gerenciar_avisos(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.pode_gerenciar_avisos() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT public.perfil_ativo_atual()
     AND public.has_permission_code(auth.uid(), 'avisos.gerenciar');
$$;


--
-- Name: pode_usar_ia(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.pode_usar_ia() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT public.perfil_ativo_atual()
     AND public.can_access_module(auth.uid(), 'compras')
     AND public.has_permission_code(auth.uid(), 'ia.usar');
$$;


--
-- Name: pode_ver_envios(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.pode_ver_envios() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT public.perfil_ativo_atual()
     AND (public.has_permission_code(auth.uid(), 'admin.envios')
          OR public.has_permission_code(auth.uid(), 'admin.envios.configurar'));
$$;


--
-- Name: portaria_nomeacao_publicada(uuid, uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.portaria_nomeacao_publicada(p_servidor_id uuid, p_provimento_id uuid, p_cargo_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.documentos d
     WHERE d.tipo = 'portaria' AND d.categoria = 'nomeacao' AND d.status IN ('publicado', 'vigente')
       AND (d.provimento_id = p_provimento_id
            OR (p_servidor_id = ANY (d.servidores_ids) AND (d.cargo_id IS NULL OR d.cargo_id = p_cargo_id))));
$$;


--
-- Name: pre_cadastros; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pre_cadastros (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo_acesso text NOT NULL,
    status text DEFAULT 'rascunho'::text,
    nome_completo text NOT NULL,
    nome_social text,
    data_nascimento date,
    sexo text,
    estado_civil text,
    nacionalidade text DEFAULT 'Brasileira'::text,
    naturalidade_cidade text,
    naturalidade_uf text,
    foto_url text,
    cpf text NOT NULL,
    rg text,
    rg_orgao_expedidor text,
    rg_uf text,
    rg_data_emissao date,
    certidao_tipo text,
    titulo_eleitor text,
    titulo_zona text,
    titulo_secao text,
    certificado_reservista text,
    email text NOT NULL,
    telefone_celular text,
    telefone_fixo text,
    endereco_logradouro text,
    endereco_numero text,
    endereco_complemento text,
    endereco_bairro text,
    endereco_cidade text,
    endereco_uf text,
    endereco_cep text,
    pis_pasep text,
    escolaridade text,
    formacao_academica text,
    instituicao_ensino text,
    ano_conclusao integer,
    registro_conselho text,
    conselho_numero text,
    cnh_numero text,
    cnh_categoria text,
    cnh_validade date,
    habilidades text[],
    idiomas jsonb DEFAULT '[]'::jsonb,
    experiencia_resumo text,
    cursos_complementares jsonb DEFAULT '[]'::jsonb,
    doc_rg boolean DEFAULT false,
    doc_cpf boolean DEFAULT false,
    doc_certidao boolean DEFAULT false,
    doc_titulo_eleitor boolean DEFAULT false,
    doc_certificado_reservista boolean DEFAULT false,
    doc_comprovante_residencia boolean DEFAULT false,
    doc_pis_pasep boolean DEFAULT false,
    doc_diploma boolean DEFAULT false,
    doc_historico_escolar boolean DEFAULT false,
    doc_registro_conselho boolean DEFAULT false,
    doc_certidao_criminal_estadual boolean DEFAULT false,
    doc_certidao_criminal_federal boolean DEFAULT false,
    doc_quitacao_eleitoral boolean DEFAULT false,
    doc_certidao_improbidade boolean DEFAULT false,
    doc_declaracao_acumulacao boolean DEFAULT false,
    doc_declaracao_bens boolean DEFAULT false,
    doc_termo_responsabilidade boolean DEFAULT false,
    doc_comprovante_bancario boolean DEFAULT false,
    banco_nome text,
    banco_codigo text,
    banco_agencia text,
    banco_conta text,
    banco_tipo_conta text,
    dependentes jsonb DEFAULT '[]'::jsonb,
    observacoes text,
    ip_envio text,
    data_envio timestamp with time zone,
    servidor_id uuid,
    convertido_em timestamp with time zone,
    convertido_por uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    raca_cor text,
    pcd boolean DEFAULT false,
    pcd_tipo text,
    nome_mae text,
    nome_pai text,
    ctps_numero text,
    ctps_serie text,
    ctps_uf character varying(2),
    ctps_data_emissao date,
    titulo_cidade_votacao text,
    titulo_uf_votacao character varying(2),
    titulo_data_emissao date,
    reservista_orgao text,
    reservista_data_emissao date,
    tipo_sanguineo text,
    reservista_categoria text,
    reservista_ano integer,
    cnh_data_expedicao date,
    cnh_primeira_habilitacao date,
    cnh_uf text,
    acumula_cargo boolean DEFAULT false,
    acumulo_descricao text,
    indicacao text,
    telefone_emergencia text,
    contato_emergencia_nome text,
    contato_emergencia_parentesco text,
    estrangeiro_data_chegada date,
    estrangeiro_data_limite_permanencia date,
    estrangeiro_registro_nacional text,
    estrangeiro_ano_chegada integer,
    molestia_grave boolean DEFAULT false,
    ano_inicio_primeiro_emprego integer,
    ano_fim_primeiro_emprego integer,
    created_by uuid,
    created_by_servidor_id uuid,
    updated_by uuid,
    updated_by_servidor_id uuid,
    token_acesso text,
    token_expira_em timestamp with time zone,
    criado_ip_hash text,
    CONSTRAINT pre_cadastros_status_check CHECK ((status = ANY (ARRAY['rascunho'::text, 'enviado'::text, 'aprovado'::text, 'rejeitado'::text, 'convertido'::text])))
);


--
-- Name: TABLE pre_cadastros; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.pre_cadastros IS 'Pré-cadastros de candidatos via formulário de mini-currículo';


--
-- Name: COLUMN pre_cadastros.codigo_acesso; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pre_cadastros.codigo_acesso IS 'Código único para o candidato acessar e editar seu formulário';


--
-- Name: COLUMN pre_cadastros.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pre_cadastros.status IS 'Status do pré-cadastro: rascunho, enviado, aprovado, rejeitado, convertido';


--
-- Name: pre_cadastro_publico_buscar(text, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.pre_cadastro_publico_buscar(p_token text, p_bloquear boolean DEFAULT false) RETURNS public.pre_cadastros
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  v_row public.pre_cadastros;
BEGIN
  IF p_token IS NULL OR p_token !~ '^[0-9a-f]{32}$' THEN
    RAISE EXCEPTION 'Link inválido ou expirado' USING ERRCODE = 'PT404';
  END IF;
  IF p_bloquear THEN
    SELECT * INTO v_row FROM public.pre_cadastros WHERE token_acesso = p_token AND token_expira_em > now() FOR UPDATE;
  ELSE
    SELECT * INTO v_row FROM public.pre_cadastros WHERE token_acesso = p_token AND token_expira_em > now();
  END IF;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Link inválido ou expirado' USING ERRCODE = 'PT404';
  END IF;
  RETURN v_row;
END;
$_$;


--
-- Name: pre_cadastro_publico_colunas(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.pre_cadastro_publico_colunas() RETURNS text[]
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  SELECT coalesce(array_agg(column_name::text ORDER BY ordinal_position), '{}')
    FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'pre_cadastros'
     AND column_name <> ALL (ARRAY['id', 'codigo_acesso', 'status', 'observacoes', 'ip_envio', 'data_envio', 'servidor_id',
                                   'convertido_em', 'convertido_por', 'created_at', 'updated_at', 'created_by',
                                   'created_by_servidor_id', 'updated_by', 'updated_by_servidor_id', 'token_acesso',
                                   'token_expira_em', 'criado_ip_hash']);
$$;


--
-- Name: pre_cadastro_publico_criar(jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.pre_cadastro_publico_criar(p_dados jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  v_dados jsonb := public.pre_cadastro_publico_filtrar(p_dados);
  v_ip text := (SELECT ip::text FROM public.trilha_contexto_requisicao());
  v_hash text := md5('pc|' || coalesce(v_ip, 'sem-ip'));
  v_cols text;
  v_codigo text;
  v_token text;
  v_tentativa int := 0;
BEGIN
  IF coalesce(btrim(v_dados ->> 'nome_completo'), '') = '' OR coalesce(btrim(v_dados ->> 'email'), '') NOT LIKE '%_@_%'
     OR length(regexp_replace(coalesce(v_dados ->> 'cpf', ''), '\D', '', 'g')) <> 11 THEN
    RAISE EXCEPTION 'Informe nome, CPF (11 dígitos) e e-mail válidos' USING ERRCODE = '22023';
  END IF;
  IF (SELECT count(*) FROM public.pre_cadastros WHERE criado_ip_hash = v_hash AND created_at > now() - interval '1 hour') >= 20 THEN
    RAISE EXCEPTION 'Muitas solicitações deste endereço. Tente novamente mais tarde.' USING ERRCODE = 'PT429';
  END IF;

  SELECT string_agg(format('%I', k), ', ') INTO v_cols FROM jsonb_object_keys(v_dados) k;
  LOOP
    v_codigo := public.gerar_codigo_pre_cadastro();
    BEGIN
      EXECUTE format(
        'INSERT INTO public.pre_cadastros (%s, codigo_acesso, status, criado_ip_hash)
           SELECT %s, $2, ''rascunho'', $3 FROM jsonb_populate_record(NULL::public.pre_cadastros, $1)
         RETURNING token_acesso', v_cols, v_cols)
        INTO v_token USING v_dados, v_codigo, v_hash;
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      -- código sequencial disputado por dois candidatos ao mesmo tempo: tenta o próximo
      v_tentativa := v_tentativa + 1;
      IF v_tentativa >= 5 THEN RAISE; END IF;
    END;
  END LOOP;
  RETURN jsonb_build_object('token', v_token, 'codigo', v_codigo);
END;
$_$;


--
-- Name: pre_cadastro_publico_enviar(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.pre_cadastro_publico_enviar(p_token text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_row public.pre_cadastros := public.pre_cadastro_publico_buscar(p_token, true);
  v_ip text := (SELECT ip::text FROM public.trilha_contexto_requisicao());
BEGIN
  IF v_row.status <> 'rascunho' THEN
    RAISE EXCEPTION 'Este pré-cadastro já foi enviado' USING ERRCODE = 'PT409';
  END IF;
  IF coalesce(btrim(v_row.nome_completo), '') = '' OR coalesce(btrim(v_row.email), '') = ''
     OR length(regexp_replace(coalesce(v_row.cpf, ''), '\D', '', 'g')) <> 11
     OR v_row.data_nascimento IS NULL OR coalesce(btrim(v_row.telefone_celular), '') = '' THEN
    RAISE EXCEPTION 'Preencha nome, CPF, e-mail, data de nascimento e celular antes de enviar' USING ERRCODE = '22023';
  END IF;
  UPDATE public.pre_cadastros SET status = 'enviado', data_envio = now(), ip_envio = v_ip, updated_at = now()
   WHERE id = v_row.id;
  RETURN jsonb_build_object('ok', true, 'codigo', v_row.codigo_acesso);
END;
$$;


--
-- Name: pre_cadastro_publico_filtrar(jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.pre_cadastro_publico_filtrar(p_dados jsonb) RETURNS jsonb
    LANGUAGE plpgsql STABLE
    SET search_path TO 'public'
    AS $$
DECLARE
  v_cols text[] := public.pre_cadastro_publico_colunas();
BEGIN
  IF p_dados IS NULL OR jsonb_typeof(p_dados) <> 'object' THEN
    RAISE EXCEPTION 'Dados inválidos' USING ERRCODE = '22023';
  END IF;
  IF length(p_dados::text) > 60000 THEN
    RAISE EXCEPTION 'Dados grandes demais' USING ERRCODE = '22023';
  END IF;
  RETURN coalesce((SELECT jsonb_object_agg(k, v) FROM jsonb_each(p_dados) AS e(k, v) WHERE k = ANY (v_cols)), '{}'::jsonb);
END;
$$;


--
-- Name: pre_cadastro_publico_obter(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.pre_cadastro_publico_obter(p_token text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_row public.pre_cadastros := public.pre_cadastro_publico_buscar(p_token);
BEGIN
  -- sem id, IP, autoria, servidor, token nem a anotação do RH (esta só aparece quando o pré-cadastro foi rejeitado)
  RETURN to_jsonb(v_row)
         - ARRAY['id', 'ip_envio', 'servidor_id', 'convertido_em', 'convertido_por', 'created_by',
                 'created_by_servidor_id', 'updated_by', 'updated_by_servidor_id', 'token_acesso', 'criado_ip_hash',
                 'observacoes']
         || CASE WHEN v_row.status = 'rejeitado' THEN jsonb_build_object('motivo_rejeicao', v_row.observacoes) ELSE '{}'::jsonb END;
END;
$$;


--
-- Name: pre_cadastro_publico_salvar(text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.pre_cadastro_publico_salvar(p_token text, p_dados jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  v_row public.pre_cadastros := public.pre_cadastro_publico_buscar(p_token, true);
  v_dados jsonb := public.pre_cadastro_publico_filtrar(p_dados);
  v_set text;
BEGIN
  IF v_row.status <> 'rascunho' THEN
    RAISE EXCEPTION 'Este pré-cadastro já foi enviado e não pode mais ser alterado' USING ERRCODE = 'PT409';
  END IF;
  IF v_dados ? 'cpf' AND length(regexp_replace(coalesce(v_dados ->> 'cpf', ''), '\D', '', 'g')) <> 11 THEN
    RAISE EXCEPTION 'CPF deve ter 11 dígitos' USING ERRCODE = '22023';
  END IF;
  SELECT string_agg(format('%I = r.%I', k, k), ', ') INTO v_set FROM jsonb_object_keys(v_dados) k;
  IF v_set IS NOT NULL THEN
    EXECUTE format(
      'UPDATE public.pre_cadastros p SET %s, token_expira_em = now() + interval ''30 days'', updated_at = now()
         FROM jsonb_populate_record(NULL::public.pre_cadastros, $1) r WHERE p.id = $2', v_set)
      USING v_dados, v_row.id;
  END IF;
  RETURN jsonb_build_object('ok', true);
END;
$_$;


--
-- Name: pre_cadastros_gerar_token(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.pre_cadastros_gerar_token() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.token_acesso IS NULL THEN
    -- gen_random_uuid() é nativo (sem extensão) e vem do gerador criptográfico do servidor: 122 bits de entropia
    NEW.token_acesso := replace(gen_random_uuid()::text, '-', '');
  END IF;
  IF NEW.token_expira_em IS NULL THEN
    NEW.token_expira_em := now() + interval '30 days';
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: processar_folha_pagamento(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.processar_folha_pagamento(p_folha_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_folha record;
  v_tipo text;
  v_d1 date;
  v_d2 date;
  v_ano int;
  v_srv record;
  v_r jsonb;
  v_item jsonb;
  v_ficha_id uuid;
  v_ordem int;
  v_manuais jsonb;
  v_manuais_total int;
  v_manuais_gravados int := 0;
  v_count int := 0;
  v_elegiveis int := 0;
  v_sem_venc int := 0;
  v_errors jsonb := '[]'::jsonb;
  v_avisos jsonb := '[]'::jsonb;
  v_tabelas jsonb;
  v_tem_inss boolean;
  v_tem_irrf boolean;
  v_ded_dep numeric;
  v_protocolo text;
  v_cedidos int;
  v_inicio timestamptz := clock_timestamp();
BEGIN
  IF NOT public.has_permission_code(auth.uid(), 'financeiro.folha.processar') THEN
    RAISE EXCEPTION 'Sem permissão para processar a folha' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_folha FROM public.folhas_pagamento WHERE id = p_folha_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('sucesso', false, 'erro', 'Folha não encontrada', 'servidores_processados', 0);
  END IF;
  IF v_folha.status NOT IN ('aberta', 'processando', 'reaberta', 'previa') THEN
    RETURN jsonb_build_object('sucesso', false, 'erro', 'Folha não está em status que permita processamento. Status atual: ' || v_folha.status, 'servidores_processados', 0);
  END IF;

  v_tipo := v_folha.tipo_folha::text;
  IF v_tipo NOT IN ('mensal', '13_1a_parcela', '13_2a_parcela', 'rescisao') THEN
    RETURN jsonb_build_object('sucesso', false, 'servidores_processados', 0,
      'erro', 'Folha do tipo ' || v_tipo || ' não tem cálculo automático: lance os valores manualmente nas fichas');
  END IF;

  v_ano := v_folha.competencia_ano;
  v_d1 := make_date(v_folha.competencia_ano, v_folha.competencia_mes, 1);
  v_d2 := (v_d1 + interval '1 month - 1 day')::date;

  v_protocolo := public.rh_protocolo_atual('folha',
    format('Processamento da folha %s/%s (%s)', v_folha.competencia_mes, v_folha.competencia_ano, v_tipo),
    NULL, jsonb_build_object('folha_id', p_folha_id, 'tipo_folha', v_tipo));

  UPDATE public.folhas_pagamento SET status = 'processando', updated_at = now() WHERE id = p_folha_id;

  -- tabelas e parâmetros necessários: existência na data de referência
  v_tem_inss := EXISTS (SELECT 1 FROM public.tabela_inss t WHERE t.vigencia_inicio <= v_d2 AND (t.vigencia_fim IS NULL OR t.vigencia_fim >= v_d2));
  v_tem_irrf := EXISTS (SELECT 1 FROM public.tabela_irrf t WHERE t.vigencia_inicio <= v_d2 AND (t.vigencia_fim IS NULL OR t.vigencia_fim >= v_d2));
  SELECT valor INTO v_ded_dep FROM public.parametros_folha
   WHERE tipo_parametro = 'deducao_dependente_irrf' AND vigencia_inicio <= v_d2 AND (vigencia_fim IS NULL OR vigencia_fim >= v_d2)
   ORDER BY vigencia_inicio DESC LIMIT 1;
  v_tabelas := jsonb_build_object('inss', v_tem_inss, 'irrf', v_tem_irrf, 'ded_dep', v_ded_dep);
  IF NOT v_tem_inss THEN v_avisos := v_avisos || jsonb_build_array('Tabela de INSS/previdência sem vigência em ' || v_d2 || ': o desconto saiu zero'); END IF;
  IF NOT v_tem_irrf THEN v_avisos := v_avisos || jsonb_build_array('Tabela de IRRF sem vigência em ' || v_d2 || ': o desconto saiu zero'); END IF;
  IF v_ded_dep IS NULL THEN v_avisos := v_avisos || jsonb_build_array('Parâmetro deducao_dependente_irrf não configurado: dependentes não foram deduzidos'); END IF;

  -- lançamentos manuais das fichas atuais: guardados e devolvidos às fichas novas
  SELECT coalesce(jsonb_agg(jsonb_build_object(
           'servidor_id', f.servidor_id, 'descricao', i.descricao, 'tipo', i.tipo, 'valor', i.valor,
           'rubrica_id', i.rubrica_id, 'referencia', i.referencia, 'base_calculo', i.base_calculo,
           'percentual', i.percentual)), '[]'::jsonb)
    INTO v_manuais
    FROM public.fichas_financeiras f JOIN public.itens_ficha_financeira i ON i.ficha_id = f.id
   WHERE f.folha_id = p_folha_id AND i.origem = 'manual';
  v_manuais_total := jsonb_array_length(v_manuais);

  DELETE FROM public.fichas_financeiras WHERE folha_id = p_folha_id;

  FOR v_srv IN
    SELECT s.id, s.nome_completo, s.banco_codigo, s.banco_nome, s.banco_agencia, s.banco_conta, s.banco_tipo_conta,
           pv.id AS provimento_id, pv.cargo_id, pv.unidade_id, c.nome AS cargo_nome,
           coalesce(c.vencimento_base, 0) AS vencimento_base, eo.nome AS unidade_nome, eo.sigla AS unidade_sigla
      FROM public.servidores s
      JOIN LATERAL (
        SELECT p.* FROM public.provimentos p
         WHERE p.servidor_id = s.id AND p.status IN ('ativo', 'suspenso', 'encerrado')
           AND CASE v_tipo
                 WHEN 'mensal' THEN coalesce(p.data_exercicio, p.data_nomeacao) <= v_d2
                                    AND (p.data_encerramento IS NULL OR p.data_encerramento >= v_d1)
                 WHEN 'rescisao' THEN p.status = 'encerrado' AND p.data_encerramento BETWEEN v_d1 AND v_d2
                                    AND p.motivo_encerramento IN ('exoneracao', 'exoneracao_pedido', 'exoneracao_oficio',
                                        'termino_mandato', 'demissao', 'aposentadoria', 'vacancia', 'falecimento')
                 ELSE coalesce(p.data_exercicio, p.data_nomeacao) <= make_date(v_ano, 12, 31)
                      AND (p.data_encerramento IS NULL OR p.data_encerramento >= make_date(v_ano, 1, 1))
               END
         ORDER BY coalesce(p.data_exercicio, p.data_nomeacao) DESC LIMIT 1) pv ON true
      JOIN public.cargos c ON c.id = pv.cargo_id
      LEFT JOIN public.estrutura_organizacional eo ON eo.id = pv.unidade_id
     ORDER BY s.nome_completo
  LOOP
    v_elegiveis := v_elegiveis + 1;
    BEGIN
      IF v_srv.vencimento_base <= 0 THEN
        v_sem_venc := v_sem_venc + 1;
        v_errors := v_errors || jsonb_build_object('servidor_id', v_srv.id, 'nome', v_srv.nome_completo,
                                                   'cargo', v_srv.cargo_nome, 'erro', 'Cargo sem vencimento base definido');
        CONTINUE;
      END IF;

      v_r := public.folha_montar_ficha(v_srv.id, v_srv.provimento_id, v_tipo, v_d1, v_d2, v_manuais, v_tabelas);
      IF NOT public.portaria_nomeacao_publicada(v_srv.id, v_srv.provimento_id, v_srv.cargo_id) THEN
        v_r := jsonb_set(v_r, '{inconsistencias}', (v_r -> 'inconsistencias') || jsonb_build_array('portaria_de_nomeacao_nao_publicada'));
      END IF;

      -- 13º sem avos (ingresso depois do ano) ou ficha sem nenhum valor: não gera ficha vazia
      IF (v_r ->> 'total_proventos')::numeric = 0 AND (v_r ->> 'total_descontos')::numeric = 0 THEN
        CONTINUE;
      END IF;

      INSERT INTO public.fichas_financeiras (
        folha_id, servidor_id, competencia_ano, competencia_mes, tipo_folha, cargo_id, cargo_nome, cargo_vencimento,
        unidade_id, unidade_nome, total_proventos, total_descontos, valor_liquido, base_inss, valor_inss, base_irrf,
        valor_irrf, quantidade_dependentes, valor_deducao_dependentes, banco_codigo, banco_nome, banco_agencia,
        banco_conta, banco_tipo_conta, processado, data_processamento, tem_inconsistencia, inconsistencias)
      VALUES (
        p_folha_id, v_srv.id, v_folha.competencia_ano, v_folha.competencia_mes, v_tipo, v_srv.cargo_id, v_srv.cargo_nome,
        v_srv.vencimento_base, v_srv.unidade_id, COALESCE(v_srv.unidade_sigla, '') || ' - ' || COALESCE(v_srv.unidade_nome, ''),
        (v_r ->> 'total_proventos')::numeric, (v_r ->> 'total_descontos')::numeric, (v_r ->> 'valor_liquido')::numeric,
        (v_r ->> 'base_inss')::numeric, (v_r ->> 'valor_inss')::numeric, (v_r ->> 'base_irrf')::numeric,
        (v_r ->> 'valor_irrf')::numeric, (v_r ->> 'quantidade_dependentes')::int, (v_r ->> 'valor_deducao_dependentes')::numeric,
        v_srv.banco_codigo, v_srv.banco_nome, v_srv.banco_agencia, v_srv.banco_conta, v_srv.banco_tipo_conta,
        true, now(), jsonb_array_length(v_r -> 'inconsistencias') > 0, v_r -> 'inconsistencias')
      RETURNING id INTO v_ficha_id;

      v_ordem := 0;
      FOR v_item IN SELECT e FROM jsonb_array_elements(v_r -> 'itens') e LOOP
        v_ordem := v_ordem + 1;
        INSERT INTO public.itens_ficha_financeira (ficha_id, rubrica_id, descricao, tipo, valor, referencia, base_calculo,
                                                   percentual, ordem, origem)
        VALUES (v_ficha_id, nullif(v_item ->> 'rubrica_id', '')::uuid, v_item ->> 'descricao', v_item ->> 'tipo',
                (v_item ->> 'valor')::numeric, v_item ->> 'referencia', nullif(v_item ->> 'base', '')::numeric,
                nullif(v_item ->> 'percentual', '')::numeric, v_ordem, v_item ->> 'origem');
        IF v_item ->> 'origem' = 'manual' THEN v_manuais_gravados := v_manuais_gravados + 1; END IF;
      END LOOP;

      v_count := v_count + 1;
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors || jsonb_build_object('servidor_id', v_srv.id, 'nome', v_srv.nome_completo, 'erro', SQLERRM);
    END;
  END LOOP;

  IF v_manuais_gravados < v_manuais_total THEN
    v_avisos := v_avisos || jsonb_build_array(
      (v_manuais_total - v_manuais_gravados) || ' lançamento(s) manual(is) não voltaram porque o servidor não entra mais nesta folha');
  END IF;
  IF v_tipo = 'mensal' THEN
    SELECT count(DISTINCT c.servidor_id) INTO v_cedidos FROM public.cessoes c
     WHERE c.tipo = 'entrada' AND c.ativa AND NOT EXISTS (
       SELECT 1 FROM public.provimentos p WHERE p.servidor_id = c.servidor_id AND p.status IN ('ativo', 'suspenso'));
    IF v_cedidos > 0 THEN
      v_avisos := v_avisos || jsonb_build_array(v_cedidos || ' cedido(s) de outro órgão não entram na folha (ônus da origem)');
    END IF;
  END IF;

  PERFORM set_config('trilha.renovar_decisao', 'folhas_pagamento.processado_por', true);
  UPDATE public.folhas_pagamento
     SET total_bruto = COALESCE((SELECT SUM(total_proventos) FROM public.fichas_financeiras WHERE folha_id = p_folha_id), 0),
         total_descontos = COALESCE((SELECT SUM(total_descontos) FROM public.fichas_financeiras WHERE folha_id = p_folha_id), 0),
         total_liquido = COALESCE((SELECT SUM(valor_liquido) FROM public.fichas_financeiras WHERE folha_id = p_folha_id), 0),
         total_inss_servidor = COALESCE((SELECT SUM(valor_inss) FROM public.fichas_financeiras WHERE folha_id = p_folha_id), 0),
         total_irrf = COALESCE((SELECT SUM(valor_irrf) FROM public.fichas_financeiras WHERE folha_id = p_folha_id), 0),
         quantidade_servidores = v_count,
         status = 'aberta',
         data_processamento = now(),
         processado_por = auth.uid(),
         tempo_processamento_ms = (EXTRACT(EPOCH FROM clock_timestamp() - v_inicio) * 1000)::int,
         updated_at = now()
   WHERE id = p_folha_id;
  PERFORM set_config('trilha.renovar_decisao', '', true);

  RETURN jsonb_build_object(
    'sucesso', true,
    'protocolo', v_protocolo,
    'servidores_processados', v_count,
    'total_servidores_ativos', v_elegiveis,
    'total_com_provimento', v_elegiveis,
    'total_sem_vencimento', v_sem_venc,
    'erros', v_errors,
    'avisos', v_avisos);

EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE;
  WHEN OTHERS THEN
    PERFORM set_config('trilha.renovar_decisao', '', true);
    UPDATE public.folhas_pagamento SET status = 'aberta', updated_at = now() WHERE id = p_folha_id;
    RETURN jsonb_build_object('sucesso', false, 'erro', SQLERRM, 'servidores_processados', v_count);
END;
$$;


--
-- Name: profiles_proteger_colunas(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.profiles_proteger_colunas() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') AND NOT public.is_admin_user(auth.uid()) THEN
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.email IS DISTINCT FROM OLD.email
       OR NEW.is_active IS DISTINCT FROM OLD.is_active
       OR NEW.blocked_at IS DISTINCT FROM OLD.blocked_at
       OR NEW.blocked_reason IS DISTINCT FROM OLD.blocked_reason
       OR NEW.servidor_id IS DISTINCT FROM OLD.servidor_id
       OR NEW.tipo_usuario IS DISTINCT FROM OLD.tipo_usuario
       OR NEW.restringir_modulos IS DISTINCT FROM OLD.restringir_modulos
       OR NEW.cpf IS DISTINCT FROM OLD.cpf
    THEN
      RAISE EXCEPTION 'Somente administradores alteram identidade, vínculo e bloqueio do perfil'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: promover_rascunho(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.promover_rascunho(p_rascunho_id uuid, p_justificativa text DEFAULT NULL::text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_rascunho RECORD;
  v_proxima_versao INTEGER;
BEGIN
  -- Verificar se usuário é super_admin
  IF NOT EXISTS (
    SELECT 1 FROM public.usuario_perfis up
    JOIN public.perfis p ON up.perfil_id = p.id
    WHERE up.user_id = auth.uid() AND p.codigo = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Apenas Super Admin pode promover conteúdo';
  END IF;

  SELECT * INTO v_rascunho FROM public.conteudo_rascunho WHERE id = p_rascunho_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Rascunho não encontrado';
  END IF;
  
  SELECT COALESCE(MAX(versao), 0) + 1 INTO v_proxima_versao
  FROM public.historico_conteudo_oficial
  WHERE tipo = v_rascunho.tipo AND identificador IS NOT DISTINCT FROM v_rascunho.identificador;
  
  INSERT INTO public.historico_conteudo_oficial (
    tipo, identificador, titulo, conteudo, conteudo_estruturado,
    versao, promovido_por, justificativa
  ) VALUES (
    v_rascunho.tipo, v_rascunho.identificador, v_rascunho.titulo,
    v_rascunho.conteudo, v_rascunho.conteudo_estruturado,
    v_proxima_versao, auth.uid(), p_justificativa
  );
  
  UPDATE public.conteudo_rascunho
  SET status = 'publicado',
      aprovado_por = auth.uid(),
      aprovado_em = now(),
      updated_at = now()
  WHERE id = p_rascunho_id;
  
  RETURN true;
END;
$$;


--
-- Name: reabrir_folha(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.reabrir_folha(p_folha_id uuid, p_justificativa text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_folha RECORD;
  v_user_id UUID;
  v_remessas text;
BEGIN
  v_user_id := auth.uid();
  
  -- Verificar autenticação
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário não autenticado');
  END IF;
  
  -- Justificativa obrigatória
  IF p_justificativa IS NULL OR trim(p_justificativa) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Justificativa obrigatória para reabrir folha');
  END IF;
  
  -- Verificar permissão (apenas super_admin)
  IF NOT public.usuario_pode_reabrir_folha(v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Apenas super administradores podem reabrir folhas');
  END IF;
  
  -- Buscar folha (travada até o fim: geração de remessa/eSocial em curso termina antes; a que vier depois espera)
  SELECT * INTO v_folha FROM public.folhas_pagamento WHERE id = p_folha_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Folha não encontrada');
  END IF;
  
  -- Verificar status atual
  IF v_folha.status != 'fechada' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Apenas folhas fechadas podem ser reabertas');
  END IF;

  -- Remessa bancária ativa: cancelar antes (E3)
  SELECT string_agg(r.numero_remessa::text, ', ' ORDER BY r.numero_remessa) INTO v_remessas
    FROM public.remessas_bancarias r
   WHERE r.folha_id = p_folha_id AND r.status <> 'cancelada';
  IF v_remessas IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error',
      format('A folha tem remessa bancária ativa (nº %s). Cancele a remessa antes de reabrir a folha.', v_remessas));
  END IF;
  
  PERFORM public.rh_protocolo_atual('folha', format('Reabertura da folha %s/%s', v_folha.competencia_mes, v_folha.competencia_ano), NULL, jsonb_build_object('folha_id', p_folha_id, 'justificativa', p_justificativa));

  -- Atualizar para reaberta
  UPDATE public.folhas_pagamento
  SET 
    status = 'reaberta',
    reaberto_por = v_user_id,
    reaberto_em = now(),
    justificativa_reabertura = p_justificativa
  WHERE id = p_folha_id;

  -- Eventos do eSocial rascunho da folha saem da vigência (E3)
  UPDATE public.eventos_esocial
     SET status = 'erro', mensagem_retorno = 'Folha reaberta: gere o evento de novo depois de fechar'
   WHERE folha_id = p_folha_id AND recibo IS NULL AND status NOT IN ('erro', 'rejeitado');
  
  -- Registrar no audit_log
  INSERT INTO public.audit_logs (
    action, entity_type, entity_id, module_name, description, user_id
  ) VALUES (
    'update', 'folhas_pagamento', p_folha_id, 'rh',
    format('Folha %s/%s REABERTA por super_admin. Justificativa: %s', v_folha.competencia_mes, v_folha.competencia_ano, p_justificativa),
    v_user_id
  );
  
  RETURN jsonb_build_object('success', true, 'message', 'Folha reaberta com sucesso');
END;
$$;


--
-- Name: registrar_denuncia_publica(boolean, text, text, text, text, text, text, text, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.registrar_denuncia_publica(p_anonima boolean, p_tipo text, p_envolvidos text, p_data_ocorrencia text, p_local_ocorrencia text, p_descricao text, p_evidencias text DEFAULT NULL::text, p_nome text DEFAULT NULL::text, p_email text DEFAULT NULL::text, p_telefone text DEFAULT NULL::text, p_cargo text DEFAULT NULL::text) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  _protocolo text;
  _id uuid;
BEGIN
  IF p_tipo NOT IN ('corrupcao', 'assedio', 'conflito', 'favorecimento', 'irregularidade', 'outro') THEN
    RAISE EXCEPTION 'Tipo de denúncia inválido';
  END IF;

  IF coalesce(trim(p_envolvidos), '') = ''
     OR coalesce(trim(p_data_ocorrencia), '') = ''
     OR coalesce(trim(p_local_ocorrencia), '') = ''
     OR coalesce(trim(p_descricao), '') = '' THEN
    RAISE EXCEPTION 'Preencha todos os campos obrigatórios da denúncia';
  END IF;

  IF NOT p_anonima AND coalesce(trim(p_nome), '') = '' THEN
    RAISE EXCEPTION 'Informe seu nome ou selecione denúncia anônima';
  END IF;

  _protocolo := 'DEN-' || to_char(now(), 'YYYY') || '-' ||
                lpad(nextval('public.denuncias_protocolo_seq')::text, 4, '0');

  INSERT INTO public.denuncias (
    protocolo, tipo, anonima,
    nome_denunciante, email_denunciante, telefone_denunciante, cargo_denunciante,
    envolvidos, data_ocorrencia, local_ocorrencia, descricao, evidencias
  ) VALUES (
    _protocolo, p_tipo, p_anonima,
    CASE WHEN p_anonima THEN NULL ELSE nullif(trim(p_nome), '') END,
    CASE WHEN p_anonima THEN NULL ELSE nullif(trim(p_email), '') END,
    CASE WHEN p_anonima THEN NULL ELSE nullif(trim(p_telefone), '') END,
    CASE WHEN p_anonima THEN NULL ELSE nullif(trim(p_cargo), '') END,
    p_envolvidos, p_data_ocorrencia, p_local_ocorrencia, p_descricao, nullif(trim(p_evidencias), '')
  )
  RETURNING id INTO _id;

  BEGIN
    PERFORM public.log_audit(
      'create'::audit_action,
      'denuncia',
      _id,
      'integridade',
      NULL,
      NULL,
      'Nova denúncia registrada: ' || _protocolo,
      jsonb_build_object('protocolo', _protocolo, 'tipo', p_tipo, 'anonima', p_anonima)
    );
  EXCEPTION WHEN OTHERS THEN
    NULL; -- auditoria é best-effort; não pode bloquear o registro da denúncia
  END;

  RETURN _protocolo;
END;
$$;


--
-- Name: registrar_evento(text, text, uuid, text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.registrar_evento(p_acao text, p_entidade text, p_entidade_id uuid DEFAULT NULL::uuid, p_descricao text DEFAULT NULL::text, p_metadados jsonb DEFAULT '{}'::jsonb) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_id uuid;
  v_fund jsonb;
BEGIN
  IF v_uid IS NULL OR NOT public.is_active_user() THEN
    RAISE EXCEPTION 'registrar_evento: usuário não autenticado ou inativo' USING ERRCODE = '42501';
  END IF;
  IF p_acao IS NULL OR p_acao NOT IN ('view', 'export', 'download') THEN
    RAISE EXCEPTION 'registrar_evento: ação fora da lista (view, export, download; imprimir = download): %',
      left(coalesce(p_acao, '(nula)'), 40) USING ERRCODE = '22023';
  END IF;
  IF p_entidade IS NULL OR p_entidade <> ALL (ARRAY[
      -- tabelas do RH (as mesmas do laço do bloco 6 e as duas de trilha)
      'adicionais_tempo_servico', 'agrupamento_unidade_vinculo', 'banco_horas', 'bancos_cnab',
      'cargo_unidade_compatibilidade', 'cargos', 'cessoes', 'comissoes', 'comissoes_membros', 'composicao_cargos',
      'config_agrupamento_unidades',
      'config_assinatura_frequencia', 'config_autarquia', 'config_compensacao', 'config_fechamento_folha',
      'config_fechamento_frequencia', 'config_incidencias', 'config_institucional', 'config_jornada_padrao',
      'config_motivos_desligamento', 'config_regras_calculo', 'config_rubricas', 'config_situacoes_funcionais',
      'config_tipos_ato', 'config_tipos_onus', 'config_tipos_rubrica', 'config_tipos_servidor', 'configuracao_jornada',
      'consignacoes', 'contas_autarquia', 'dependentes_irrf', 'designacoes', 'dias_nao_uteis', 'documentos',
      'documentos_requerimento_servidor', 'eventos_esocial', 'exportacoes_folha', 'feriados', 'ferias_servidor',
      'fichas_financeiras', 'folha_historico_status', 'folhas_pagamento', 'frequencia_arquivos',
      'frequencia_fechamento', 'frequencia_mensal', 'frequencia_pacotes', 'historico_funcional', 'horarios_jornada',
      'itens_ficha_financeira', 'itens_retorno_bancario', 'justificativas_ponto', 'lancamentos_banco_horas',
      'lancamentos_folha', 'licencas_afastamentos', 'lotacoes', 'memorandos_lotacao', 'nomeacoes_chefe_unidade',
      'ocorrencias_servidor', 'parametros_folha', 'pensoes_alimenticias', 'portarias_servidor', 'pre_cadastros',
      'provimentos', 'regimes_trabalho', 'registros_ponto', 'remessas_bancarias', 'retornos_bancarios', 'rubricas',
      'rubricas_historico', 'servidor_regime', 'servidor_tag_vinculos', 'servidor_tags', 'servidores',
      'solicitacoes_abono', 'solicitacoes_ajuste_ponto', 'tabela_inss', 'tabela_irrf', 'tipos_abono',
      'viagens_diarias', 'vinculos_funcionais', 'vinculos_servidor',
      -- documentos e consultas que não são uma tabela
      'contracheque', 'relatorio_rh', 'exportacao_rh', 'arquivo_esocial', 'arquivo_cnab', 'trilha_auditoria'
    ]) THEN
    RAISE EXCEPTION 'registrar_evento: entidade fora da lista: %', left(coalesce(p_entidade, '(nula)'), 60)
      USING ERRCODE = '22023';
  END IF;
  IF p_metadados IS NOT NULL AND (jsonb_typeof(p_metadados) <> 'object' OR length(p_metadados::text) > 4000) THEN
    RAISE EXCEPTION 'registrar_evento: metadados devem ser um objeto JSON de até 4000 caracteres' USING ERRCODE = '22023';
  END IF;
  IF NOT public.can_access_module(v_uid, 'rh') THEN
    IF p_entidade <> 'contracheque' OR p_entidade_id IS NULL
       OR NOT EXISTS (SELECT 1 FROM public.fichas_financeiras f
                       WHERE f.id = p_entidade_id AND public.eh_meu_servidor(f.servidor_id)) THEN
      RAISE EXCEPTION 'registrar_evento: sem o módulo rh, só o próprio contracheque' USING ERRCODE = '42501';
    END IF;
  END IF;

  v_fund := public.fundamento_lancamento(ARRAY['rh']);
  IF v_fund ->> 'modo' = 'desligado' THEN
    v_fund := NULL;
  END IF;

  INSERT INTO public.audit_logs (action, entity_type, entity_id, module_name, user_id, description, metadata, fundamento)
  VALUES (p_acao::public.audit_action, p_entidade, p_entidade_id, 'rh', v_uid, left(p_descricao, 500),
          (coalesce(p_metadados, '{}'::jsonb) - ARRAY['trigger', 'operation', 'table', 'fonte', 'servidor_alvo_id'])
            || jsonb_build_object('registrar_evento', true, 'fonte', 'registrar_evento'),
          v_fund)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;


--
-- Name: FUNCTION registrar_evento(p_acao text, p_entidade text, p_entidade_id uuid, p_descricao text, p_metadados jsonb); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.registrar_evento(p_acao text, p_entidade text, p_entidade_id uuid, p_descricao text, p_metadados jsonb) IS 'Registra na trilha do RH uma ação sem gravação (view, export, download; imprimir = download) sobre entidade de lista fechada';


--
-- Name: registrar_extrato_bb(uuid, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.registrar_extrato_bb(p_conta_bancaria_id uuid, p_lancamentos jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  v_l jsonb;
  v_idx integer := 0;
  v_chave text;
  v_id uuid;
  v_ins integer := 0; v_exist integer := 0; v_casados integer := 0;
  v_lanc record;
  v_pag uuid[];
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.fin_contas_bancarias WHERE id = p_conta_bancaria_id) THEN
    RAISE EXCEPTION 'Conta bancária não encontrada.' USING ERRCODE = 'P0002';
  END IF;
  IF jsonb_typeof(p_lancamentos) IS DISTINCT FROM 'array' OR jsonb_array_length(p_lancamentos) > 50000 THEN
    RAISE EXCEPTION 'Lançamentos inválidos.' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('registrar_extrato_bb'), hashtext(p_conta_bancaria_id::text));

  FOR v_l IN SELECT value FROM jsonb_array_elements(p_lancamentos) LOOP
    v_idx := v_idx + 1;
    IF jsonb_typeof(v_l) IS DISTINCT FROM 'object'
       OR char_length(COALESCE(v_l->>'identificador_bb', '')) NOT BETWEEN 1 AND 200
       OR COALESCE(v_l->>'data_lancamento', '') !~ '^\d{4}-\d{2}-\d{2}$'
       OR (NULLIF(v_l->>'data_movimento', '') IS NOT NULL AND (v_l->>'data_movimento') !~ '^\d{4}-\d{2}-\d{2}$')
       OR jsonb_typeof(v_l->'valor') IS DISTINCT FROM 'number'
       OR (v_l->>'valor')::numeric < 0 OR (v_l->>'valor')::numeric >= 1e13
       OR COALESCE(v_l->>'sinal', '') NOT IN ('C', 'D') THEN
      RAISE EXCEPTION 'Lançamento %: formato inválido.', v_idx USING ERRCODE = '22023';
    END IF;

    v_chave := p_conta_bancaria_id::text || '|' || (v_l->>'identificador_bb');
    INSERT INTO public.fin_extrato_lancamentos (
      conta_bancaria_id, data_lancamento, data_movimento, valor, sinal, codigo_historico, descricao,
      informacao_complementar, contrapartida_documento, contrapartida_tipo, contrapartida_banco,
      contrapartida_agencia, contrapartida_conta, numero_documento, identificador_bb, chave_unica
    ) VALUES (
      p_conta_bancaria_id, (v_l->>'data_lancamento')::date, NULLIF(v_l->>'data_movimento', '')::date,
      round((v_l->>'valor')::numeric, 2), v_l->>'sinal', NULLIF(v_l->>'codigo_historico', '')::integer,
      left(NULLIF(btrim(COALESCE(v_l->>'descricao', '')), ''), 255),
      left(NULLIF(btrim(COALESCE(v_l->>'informacao_complementar', '')), ''), 500),
      NULLIF(v_l->>'contrapartida_documento', ''), NULLIF(v_l->>'contrapartida_tipo', ''),
      NULLIF(v_l->>'contrapartida_banco', '')::integer, NULLIF(v_l->>'contrapartida_agencia', '')::integer,
      NULLIF(v_l->>'contrapartida_conta', ''), NULLIF(v_l->>'numero_documento', ''),
      v_l->>'identificador_bb', v_chave
    )
    ON CONFLICT (chave_unica) DO NOTHING
    RETURNING id INTO v_id;
    IF v_id IS NULL THEN v_exist := v_exist + 1; ELSE v_ins := v_ins + 1; END IF;
    v_id := NULL;
  END LOOP;

  -- Casamento dos débitos ainda sem vínculo desta conta (inclui os de importações anteriores).
  FOR v_lanc IN
    SELECT e.id, e.valor, e.data_lancamento, ltrim(e.contrapartida_documento, '0') AS doc
      FROM public.fin_extrato_lancamentos e
     WHERE e.conta_bancaria_id = p_conta_bancaria_id
       AND e.sinal = 'D' AND e.pagamento_id IS NULL
       AND NULLIF(ltrim(COALESCE(e.contrapartida_documento, ''), '0'), '') IS NOT NULL
  LOOP
    SELECT array_agg(p.id) INTO v_pag
      FROM public.fin_pagamentos p
      JOIN public.fornecedores f ON f.id = p.fornecedor_id
     WHERE COALESCE(p.status::text, '') NOT IN ('cancelado', 'estornado')
       AND NOT COALESCE(p.estornado, false)
       AND p.valor_liquido = v_lanc.valor
       AND COALESCE(p.data_efetivacao, p.data_pagamento) = v_lanc.data_lancamento
       AND ltrim(regexp_replace(COALESCE(f.cpf_cnpj, ''), '\D', '', 'g'), '0') = v_lanc.doc
       AND NOT EXISTS (SELECT 1 FROM public.fin_extrato_lancamentos o WHERE o.pagamento_id = p.id);
    IF cardinality(v_pag) = 1 THEN
      UPDATE public.fin_extrato_lancamentos SET pagamento_id = v_pag[1] WHERE id = v_lanc.id;
      v_casados := v_casados + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'recebidos', v_idx,
    'inseridos', v_ins,
    'existentes', v_exist,
    'conciliados', v_casados
  );
END;
$_$;


--
-- Name: FUNCTION registrar_extrato_bb(p_conta_bancaria_id uuid, p_lancamentos jsonb); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.registrar_extrato_bb(p_conta_bancaria_id uuid, p_lancamentos jsonb) IS 'Grava lançamentos do extrato do BB (idempotente pela chave_unica) e casa débitos com fin_pagamentos. Só a service role executa (Edge Function bb-api, que confere usuário e pagamento.conciliar).';


--
-- Name: registrar_gestor_publico(uuid, text, text, text, date, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.registrar_gestor_publico(p_escola_id uuid, p_nome text, p_cpf text, p_rg text, p_data_nascimento date, p_email text, p_celular text, p_endereco text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.gestores_escolares (escola_id, nome, cpf, rg, data_nascimento, email, celular, endereco, status)
  VALUES (p_escola_id, p_nome, p_cpf, p_rg, p_data_nascimento, p_email, p_celular, p_endereco, 'aguardando')
  RETURNING id INTO v_id;
  RETURN (SELECT jsonb_build_object('id', g.id, 'nome', g.nome, 'status', g.status,
                                    'escola', jsonb_build_object('id', e.id, 'nome', e.nome))
          FROM public.gestores_escolares g LEFT JOIN public.escolas_jer e ON e.id = g.escola_id
          WHERE g.id = v_id);
END;
$$;


--
-- Name: registrar_historico_baixa(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.registrar_historico_baixa() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO historico_patrimonio (bem_id, tipo_evento, justificativa, dados_novos, usuario_id)
  VALUES (NEW.bem_id, 'baixa_solicitada', NEW.justificativa,
          jsonb_build_object('baixa_id', NEW.id, 'motivo', NEW.motivo), auth.uid());
  RETURN NEW;
END;
$$;


--
-- Name: registrar_historico_demanda_ascom(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.registrar_historico_demanda_ascom() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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
  
  RETURN NEW;
END;
$$;


--
-- Name: registrar_historico_lai(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.registrar_historico_lai() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_tipo_evento public.tipo_evento_lai;
BEGIN
  -- Determinar tipo de evento
  IF TG_OP = 'INSERT' THEN
    v_tipo_evento := 'abertura';
  ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
    CASE NEW.status
      WHEN 'em_analise' THEN v_tipo_evento := 'classificacao';
      WHEN 'respondida' THEN v_tipo_evento := 'resposta_final';
      WHEN 'encerrada' THEN v_tipo_evento := 'encerramento';
      ELSE v_tipo_evento := 'classificacao';
    END CASE;
  ELSIF OLD.prazo_resposta IS DISTINCT FROM NEW.prazo_resposta THEN
    v_tipo_evento := 'prorrogacao';
  ELSIF OLD.responsavel_id IS DISTINCT FROM NEW.responsavel_id THEN
    v_tipo_evento := 'alteracao_responsavel';
  ELSE
    RETURN NEW; -- Sem mudança relevante
  END IF;
  
  -- Registrar no histórico
  INSERT INTO public.historico_lai (
    solicitacao_id,
    tipo_evento,
    status_anterior,
    status_novo,
    prazo_anterior,
    prazo_novo,
    responsavel_anterior_id,
    responsavel_novo_id,
    created_by
  ) VALUES (
    NEW.id,
    v_tipo_evento,
    CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END,
    NEW.status,
    CASE WHEN TG_OP = 'UPDATE' THEN OLD.prazo_resposta ELSE NULL END,
    NEW.prazo_resposta,
    CASE WHEN TG_OP = 'UPDATE' THEN OLD.responsavel_id ELSE NULL END,
    NEW.responsavel_id,
    auth.uid()
  );
  
  RETURN NEW;
END;
$$;


--
-- Name: registrar_historico_manutencao(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.registrar_historico_manutencao() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF EXISTS (SELECT 1 FROM bens_patrimoniais
                WHERE id = NEW.bem_id AND situacao IN ('baixado', 'extraviado')) THEN
      RAISE EXCEPTION 'Bem baixado ou extraviado não entra em manutenção' USING ERRCODE = '22023';
    END IF;
    INSERT INTO historico_patrimonio (bem_id, tipo_evento, manutencao_id, justificativa, usuario_id)
    VALUES (NEW.bem_id, 'manutencao_inicio', NEW.id, NEW.descricao_problema, auth.uid());

    UPDATE bens_patrimoniais SET situacao = 'em_manutencao', updated_at = now() WHERE id = NEW.bem_id;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status IN ('concluida', 'cancelada')
     AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO historico_patrimonio (bem_id, tipo_evento, manutencao_id, justificativa, usuario_id, dados_novos)
    VALUES (NEW.bem_id, 'manutencao_fim', NEW.id, NEW.observacoes, auth.uid(),
            jsonb_build_object('status', NEW.status, 'custo_final', NEW.custo_final,
                               'data_conclusao', NEW.data_conclusao));

    UPDATE bens_patrimoniais SET situacao = 'ativo', updated_at = now()
     WHERE id = NEW.bem_id AND situacao = 'em_manutencao';
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: registrar_historico_movimentacao(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.registrar_historico_movimentacao() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.status = 'aprovado' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'aprovado') THEN
    INSERT INTO historico_patrimonio (
      bem_id, tipo_evento, unidade_local_id, responsavel_id,
      movimentacao_id, justificativa, documento_url,
      dados_anteriores, dados_novos, usuario_id
    ) VALUES (
      NEW.bem_id,
      CASE NEW.tipo WHEN 'transferencia_interna' THEN 'transferencia' ELSE NEW.tipo::text END,
      COALESCE(NEW.unidade_local_destino_id, NEW.unidade_local_origem_id),
      NEW.responsavel_destino_id,
      NEW.id,
      NEW.motivo,
      NEW.termo_transferencia_url,
      jsonb_build_object('unidade_local_id', NEW.unidade_local_origem_id,
                         'unidade_id', NEW.unidade_origem_id,
                         'responsavel_id', NEW.responsavel_origem_id),
      jsonb_build_object('unidade_local_id', NEW.unidade_local_destino_id,
                         'unidade_id', NEW.unidade_destino_id,
                         'responsavel_id', NEW.responsavel_destino_id),
      auth.uid()
    );

    -- O evento acima já registra a mudança; o trigger do bem não grava outro.
    PERFORM set_config('patrimonio.evento_registrado', 'on', true);
    UPDATE bens_patrimoniais
       SET unidade_local_id = COALESCE(NEW.unidade_local_destino_id, unidade_local_id),
           unidade_id       = COALESCE(NEW.unidade_destino_id, unidade_id),
           responsavel_id   = COALESCE(NEW.responsavel_destino_id, responsavel_id),
           updated_at       = now()
     WHERE id = NEW.bem_id;
    PERFORM set_config('patrimonio.evento_registrado', 'off', true);
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: registrar_historico_patrimonio(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.registrar_historico_patrimonio() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO historico_patrimonio (
      bem_id, tipo_evento, unidade_local_id, responsavel_id,
      localizacao_especifica, estado_conservacao, valor_aquisicao,
      dados_novos, usuario_id
    ) VALUES (
      NEW.id, 'cadastro', NEW.unidade_local_id, NEW.responsavel_id,
      NEW.localizacao_especifica, NEW.estado_conservacao, NEW.valor_aquisicao,
      to_jsonb(NEW), auth.uid()
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Movimentação aprovada e baixa decidida já gravaram o próprio evento.
    IF current_setting('patrimonio.evento_registrado', true) = 'on' THEN
      RETURN NEW;
    END IF;

    IF OLD.unidade_local_id IS DISTINCT FROM NEW.unidade_local_id THEN
      INSERT INTO historico_patrimonio (
        bem_id, tipo_evento, unidade_local_id, responsavel_id,
        localizacao_especifica, estado_conservacao, valor_aquisicao,
        dados_anteriores, dados_novos, justificativa, usuario_id
      ) VALUES (
        NEW.id, 'transferencia', NEW.unidade_local_id, NEW.responsavel_id,
        NEW.localizacao_especifica, NEW.estado_conservacao, NEW.valor_aquisicao,
        jsonb_build_object('unidade_local_id', OLD.unidade_local_id),
        jsonb_build_object('unidade_local_id', NEW.unidade_local_id),
        'Transferência automática', auth.uid()
      );
    END IF;

    IF OLD.responsavel_id IS DISTINCT FROM NEW.responsavel_id THEN
      INSERT INTO historico_patrimonio (
        bem_id, tipo_evento, unidade_local_id, responsavel_id,
        dados_anteriores, dados_novos, justificativa, usuario_id
      ) VALUES (
        NEW.id, 'troca_responsavel', NEW.unidade_local_id, NEW.responsavel_id,
        jsonb_build_object('responsavel_id', OLD.responsavel_id),
        jsonb_build_object('responsavel_id', NEW.responsavel_id),
        'Troca de responsável', auth.uid()
      );
    END IF;

    IF OLD.situacao IS DISTINCT FROM NEW.situacao
       OR OLD.numero_patrimonio IS DISTINCT FROM NEW.numero_patrimonio THEN
      INSERT INTO historico_patrimonio (
        bem_id, tipo_evento, unidade_local_id, responsavel_id,
        dados_anteriores, dados_novos, usuario_id
      ) VALUES (
        NEW.id, 'atualizacao_dados', NEW.unidade_local_id, NEW.responsavel_id,
        jsonb_build_object('situacao', OLD.situacao, 'numero_patrimonio', OLD.numero_patrimonio),
        jsonb_build_object('situacao', NEW.situacao, 'numero_patrimonio', NEW.numero_patrimonio),
        auth.uid()
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: registrar_historico_status(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.registrar_historico_status() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_historico JSONB;
  v_novo_registro JSONB;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    v_historico := COALESCE(NEW.historico_status, '[]'::jsonb);
    
    v_novo_registro := jsonb_build_object(
      'status_anterior', OLD.status,
      'status_novo', NEW.status,
      'data', NOW(),
      'usuario_id', auth.uid()
    );
    
    NEW.historico_status := v_historico || v_novo_registro;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: registrar_mudanca_fase_licitacao(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.registrar_mudanca_fase_licitacao() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF OLD.fase_atual IS DISTINCT FROM NEW.fase_atual THEN
    NEW.historico_fases := COALESCE(OLD.historico_fases, '[]'::JSONB) || jsonb_build_object(
      'fase_anterior', OLD.fase_atual, 'fase_nova', NEW.fase_atual, 'data', now(), 'usuario_id', auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: registrar_remessa_bancaria(uuid, text, uuid[], date, integer, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.registrar_remessa_bancaria(p_conta_autarquia_id uuid, p_layout text, p_movimentos uuid[], p_data_pagamento date, p_nsa_minimo integer DEFAULT NULL::integer, p_tipo_servico text DEFAULT '98'::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  v_uid uuid := auth.uid();
  v_conta public.contas_autarquia%ROWTYPE;
  v_ultima public.fin_remessas_bancarias%ROWTYPE;
  v_tem_ultima boolean;
  v_reuso uuid;
  v_outras boolean;
  v_movs uuid[] := COALESCE(p_movimentos, '{}');
  v_mov public.fin_movimentos_bancarios%ROWTYPE;
  v_mov_id uuid;
  v_ord bigint;
  v_nsa integer;
  v_id uuid;
  v_creditos jsonb := '[]'::jsonb;
  v_total numeric(15,2) := 0;
  v_banco text; v_ag text; v_ag_dv text; v_ct text; v_ct_dv text;
  v_partes text[];
  v_seu text;
BEGIN
  IF v_uid IS NULL
     OR NOT COALESCE(public.perfil_ativo_atual()
                     AND public.can_access_module(v_uid, 'financeiro')
                     AND public.has_permission_code(v_uid, 'pagamento.conciliar'), false) THEN
    RAISE EXCEPTION 'Sem permissão para gerar remessa bancária (pagamento.conciliar).' USING ERRCODE = '42501';
  END IF;

  IF COALESCE(p_layout, '') NOT IN ('gestao_max_cnab240') THEN
    RAISE EXCEPTION 'Layout de remessa inválido: %', p_layout USING ERRCODE = '22023';
  END IF;
  IF p_data_pagamento IS NULL OR p_data_pagamento < CURRENT_DATE - 1 OR p_data_pagamento > CURRENT_DATE + 60 THEN
    RAISE EXCEPTION 'Data do pagamento inválida (de hoje a 60 dias à frente).' USING ERRCODE = '22023';
  END IF;
  IF p_nsa_minimo IS NOT NULL AND p_nsa_minimo NOT BETWEEN 1 AND 999999 THEN
    RAISE EXCEPTION 'NSA mínimo inválido.' USING ERRCODE = '22023';
  END IF;
  IF COALESCE(p_tipo_servico, '98') NOT IN ('98', '30') THEN
    RAISE EXCEPTION 'Tipo de serviço inválido (98 pagamentos diversos ou 30 salários).' USING ERRCODE = '22023';
  END IF;
  IF cardinality(v_movs) NOT BETWEEN 1 AND 999
     OR array_position(v_movs, NULL) IS NOT NULL
     OR cardinality(v_movs) <> (SELECT count(DISTINCT m) FROM unnest(v_movs) m) THEN
    RAISE EXCEPTION 'Informe de 1 a 999 movimentos, sem repetição.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_conta FROM public.contas_autarquia WHERE id = p_conta_autarquia_id AND COALESCE(ativo, true);
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conta pagadora não encontrada ou inativa.' USING ERRCODE = 'P0002';
  END IF;
  IF NULLIF(btrim(COALESCE(v_conta.convenio_pagamento, '')), '') IS NULL THEN
    RAISE EXCEPTION 'A conta pagadora não tem convênio de pagamento cadastrado.' USING ERRCODE = '22023';
  END IF;
  IF NULLIF(btrim(COALESCE(v_conta.agencia, '')), '') IS NULL OR NULLIF(btrim(COALESCE(v_conta.conta, '')), '') IS NULL THEN
    RAISE EXCEPTION 'A conta pagadora não tem agência/conta cadastradas.' USING ERRCODE = '22023';
  END IF;

  -- Um NSA por vez para a mesma conta e layout.
  PERFORM pg_advisory_xact_lock(hashtext('registrar_remessa_bancaria'), hashtext(p_conta_autarquia_id::text || '|' || p_layout));

  SELECT * INTO v_ultima FROM public.fin_remessas_bancarias
   WHERE conta_autarquia_id = p_conta_autarquia_id AND layout = p_layout
   ORDER BY nsa DESC LIMIT 1;
  v_tem_ultima := FOUND;
  IF v_tem_ultima AND v_ultima.arquivo_sha256 IS NULL AND v_ultima.created_by = v_uid THEN
    -- Nova tentativa do mesmo usuário: reaproveita a reserva não confirmada (NSA e linha).
    v_reuso := v_ultima.id;
  END IF;
  v_outras := EXISTS (SELECT 1 FROM public.fin_remessas_bancarias
                       WHERE conta_autarquia_id = p_conta_autarquia_id AND layout = p_layout
                         AND id IS DISTINCT FROM v_reuso);

  IF NOT v_outras AND p_nsa_minimo IS NOT NULL THEN
    v_nsa := p_nsa_minimo;              -- primeira remessa da conta/layout: define a numeração
  ELSIF v_reuso IS NOT NULL THEN
    v_nsa := v_ultima.nsa;
  ELSE
    v_nsa := COALESCE(v_ultima.nsa, 0) + 1;  -- p_nsa_minimo ignorado depois da primeira remessa
  END IF;
  IF v_nsa > 999999 THEN
    RAISE EXCEPTION 'NSA esgotado para esta conta.' USING ERRCODE = '22023';
  END IF;

  -- Trava os movimentos (ordem fixa evita deadlock) e monta os créditos na ordem pedida.
  PERFORM 1 FROM public.fin_movimentos_bancarios WHERE id = ANY (v_movs) ORDER BY id FOR UPDATE;

  FOR v_mov_id, v_ord IN SELECT x.id, x.ord FROM unnest(v_movs) WITH ORDINALITY AS x(id, ord) ORDER BY x.ord LOOP
    SELECT * INTO v_mov FROM public.fin_movimentos_bancarios WHERE id = v_mov_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Movimento % não encontrado.', v_ord USING ERRCODE = 'P0002';
    END IF;
    IF v_mov.situacao <> 'recusado' THEN
      RAISE EXCEPTION 'Movimento % (%) não está recusado.', v_ord, v_mov.identificador USING ERRCODE = '22023';
    END IF;
    IF v_mov.tipo_lancamento = 'fatura' OR v_mov.codigo_barras IS NOT NULL THEN
      RAISE EXCEPTION 'Movimento % (%) é fatura/guia: não se reenvia como crédito.', v_ord, v_mov.identificador USING ERRCODE = '22023';
    END IF;
    IF v_mov.reenviado_em IS NOT NULL THEN
      RAISE EXCEPTION 'Movimento % (%) já foi reenviado.', v_ord, v_mov.identificador USING ERRCODE = '22023';
    END IF;
    IF v_mov.remessa_id IS NOT NULL AND v_mov.remessa_id IS DISTINCT FROM v_reuso THEN
      RAISE EXCEPTION 'Movimento % (%) está reservado em outra remessa ainda não confirmada (NSA %).', v_ord, v_mov.identificador,
        (SELECT nsa FROM public.fin_remessas_bancarias WHERE id = v_mov.remessa_id) USING ERRCODE = '22023';
    END IF;
    IF v_mov.favorecido_documento IS NULL THEN
      RAISE EXCEPTION 'Movimento % (%) sem CPF/CNPJ do favorecido.', v_ord, v_mov.identificador USING ERRCODE = '22023';
    END IF;
    IF v_mov.valor <= 0 THEN
      RAISE EXCEPTION 'Movimento % (%) sem valor.', v_ord, v_mov.identificador USING ERRCODE = '22023';
    END IF;

    IF v_mov.conta_corrigida IS NOT NULL THEN
      v_banco := v_mov.conta_corrigida->>'banco';
      v_ag := v_mov.conta_corrigida->>'agencia';
      v_ag_dv := COALESCE(v_mov.conta_corrigida->>'agencia_dv', '');
      v_ct := v_mov.conta_corrigida->>'conta';
      v_ct_dv := COALESCE(v_mov.conta_corrigida->>'conta_dv', '');
    ELSE
      -- Formato gravado pelos parsers: agência "1234" ou "1234-5"; conta "1111" ou "1111-X".
      v_banco := btrim(COALESCE(v_mov.banco, ''));
      v_partes := regexp_match(btrim(COALESCE(v_mov.agencia, '')), '^(\d{1,5})(?:-([0-9Xx]))?$');
      v_ag := v_partes[1]; v_ag_dv := upper(COALESCE(v_partes[2], ''));
      v_partes := regexp_match(btrim(COALESCE(v_mov.conta, '')), '^(\d{1,12})(?:-([0-9Xx]))?$');
      v_ct := v_partes[1]; v_ct_dv := upper(COALESCE(v_partes[2], ''));
    END IF;
    IF COALESCE(v_banco, '') !~ '^\d{3}$' OR COALESCE(v_ag, '') !~ '^\d{1,5}$' OR COALESCE(v_ct, '') !~ '^\d{1,12}$'
       OR v_ct ~ '^0+$' THEN
      RAISE EXCEPTION 'Movimento % (%) sem banco/agência/conta válidos: corrija a conta antes do reenvio.', v_ord, v_mov.identificador
        USING ERRCODE = '22023';
    END IF;

    v_seu := CASE WHEN btrim(v_mov.identificador) ~ '^\d{1,20}$' THEN btrim(v_mov.identificador)
                  ELSE (v_nsa::bigint * 1000 + v_ord)::text END;
    v_creditos := v_creditos || jsonb_build_array(jsonb_build_object(
      'movimento_id', v_mov.id, 'pagamento_id', v_mov.pagamento_id,
      'nome', COALESCE(v_mov.favorecido_nome, ''), 'documento', v_mov.favorecido_documento,
      'banco', v_banco, 'agencia', v_ag, 'agencia_dv', v_ag_dv, 'conta', v_ct, 'conta_dv', v_ct_dv,
      'valor', v_mov.valor, 'seu_numero', v_seu));
    v_total := v_total + v_mov.valor;
  END LOOP;

  IF v_total >= 1e13 THEN
    RAISE EXCEPTION 'Valor total inválido.' USING ERRCODE = '22023';
  END IF;

  IF v_reuso IS NOT NULL THEN
    -- Libera o que a tentativa anterior reservou e não está na nova lista.
    UPDATE public.fin_movimentos_bancarios
       SET remessa_id = NULL, updated_at = now()
     WHERE remessa_id = v_reuso AND reenviado_em IS NULL AND NOT (id = ANY (v_movs));
    UPDATE public.fin_remessas_bancarias
       SET nsa = v_nsa, convenio = btrim(v_conta.convenio_pagamento),
           agencia = btrim(v_conta.agencia), agencia_digito = NULLIF(btrim(COALESCE(v_conta.agencia_digito, '')), ''),
           conta = btrim(v_conta.conta), conta_digito = NULLIF(btrim(COALESCE(v_conta.conta_digito, '')), ''),
           data_geracao = now(), data_pagamento = p_data_pagamento, tipo_servico = COALESCE(p_tipo_servico, '98'),
           quantidade = cardinality(v_movs), valor_total = v_total, creditos = v_creditos, movimentos = v_movs
     WHERE id = v_reuso
     RETURNING id INTO v_id;
  ELSE
    INSERT INTO public.fin_remessas_bancarias
      (layout, conta_autarquia_id, convenio, agencia, agencia_digito, conta, conta_digito, nsa,
       data_pagamento, tipo_servico, quantidade, valor_total, creditos, movimentos, created_by)
    VALUES
      (p_layout, p_conta_autarquia_id, btrim(v_conta.convenio_pagamento),
       btrim(v_conta.agencia), NULLIF(btrim(COALESCE(v_conta.agencia_digito, '')), ''),
       btrim(v_conta.conta), NULLIF(btrim(COALESCE(v_conta.conta_digito, '')), ''), v_nsa,
       p_data_pagamento, COALESCE(p_tipo_servico, '98'), cardinality(v_movs), v_total, v_creditos, v_movs, v_uid)
    RETURNING id INTO v_id;
  END IF;

  -- Reserva: os movimentos passam a apontar para esta remessa (reenviado_em só na confirmação).
  UPDATE public.fin_movimentos_bancarios
     SET remessa_id = v_id, updated_at = now()
   WHERE id = ANY (v_movs) AND remessa_id IS DISTINCT FROM v_id;

  RETURN public.fin_remessa_bancaria_json(v_id) - 'arquivo_sha256';
END;
$_$;


--
-- Name: FUNCTION registrar_remessa_bancaria(p_conta_autarquia_id uuid, p_layout text, p_movimentos uuid[], p_data_pagamento date, p_nsa_minimo integer, p_tipo_servico text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.registrar_remessa_bancaria(p_conta_autarquia_id uuid, p_layout text, p_movimentos uuid[], p_data_pagamento date, p_nsa_minimo integer, p_tipo_servico text) IS 'Monta no servidor os créditos de uma remessa de reenvio (Gestão MAX) a partir dos movimentos recusados (com a conta corrigida), reserva o NSA e os movimentos e devolve convênio, conta pagadora e créditos. Exige pagamento.conciliar.';


--
-- Name: registrar_transicao_folha(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.registrar_transicao_folha() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_user_nome TEXT;
  v_uid uuid := auth.uid();
  v_informa boolean := auth.uid() IS NULL
    AND coalesce(current_setting('role', true), 'none') NOT IN ('anon', 'authenticated');
BEGIN
  SELECT full_name INTO v_user_nome FROM public.profiles WHERE id = v_uid;

  -- quem fechou, conferiu ou reabriu só muda na transição de status (abaixo)
  IF NOT v_informa THEN
    NEW.fechado_por := OLD.fechado_por;
    NEW.fechado_em := OLD.fechado_em;
    NEW.conferido_por := OLD.conferido_por;
    NEW.conferido_em := OLD.conferido_em;
    NEW.reaberto_por := OLD.reaberto_por;
    NEW.reaberto_em := OLD.reaberto_em;
  END IF;

  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.folha_historico_status (
      folha_id, status_anterior, status_novo, usuario_id, usuario_nome, justificativa
    ) VALUES (
      NEW.id, OLD.status, NEW.status, v_uid, v_user_nome,
      CASE
        WHEN NEW.status = 'fechada' THEN NEW.justificativa_fechamento
        WHEN NEW.status = 'reaberta' THEN NEW.justificativa_reabertura
        ELSE NULL
      END
    );

    IF NEW.status = 'fechada' AND OLD.status != 'fechada' THEN
      NEW.fechado_por := CASE WHEN v_informa THEN COALESCE(NEW.fechado_por, v_uid) ELSE v_uid END;
      NEW.fechado_em := CASE WHEN v_informa THEN COALESCE(NEW.fechado_em, now()) ELSE now() END;
    END IF;

    IF NEW.status = 'processando' AND OLD.status = 'aberta' THEN
      NEW.conferido_por := CASE WHEN v_informa THEN COALESCE(NEW.conferido_por, v_uid) ELSE v_uid END;
      NEW.conferido_em := CASE WHEN v_informa THEN COALESCE(NEW.conferido_em, now()) ELSE now() END;
    END IF;

    IF NEW.status = 'reaberta' THEN
      NEW.reaberto_por := CASE WHEN v_informa THEN COALESCE(NEW.reaberto_por, v_uid) ELSE v_uid END;
      NEW.reaberto_em := CASE WHEN v_informa THEN COALESCE(NEW.reaberto_em, now()) ELSE now() END;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: registros_ponto_travar_competencia(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.registros_ponto_travar_competencia() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- só a API (anon/authenticated); job, Edge Function e service role seguem livres
  IF coalesce(current_setting('role', true), 'none') NOT IN ('anon', 'authenticated') THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;
  IF TG_OP IN ('UPDATE', 'DELETE') AND public.frequencia_competencia_travada(OLD.servidor_id, OLD.data) THEN
    RAISE EXCEPTION 'Frequência: a competência %/% de este servidor está consolidada; reabra a frequência para alterar o ponto',
      to_char(OLD.data, 'MM'), to_char(OLD.data, 'YYYY') USING ERRCODE = '42501';
  END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') AND public.frequencia_competencia_travada(NEW.servidor_id, NEW.data) THEN
    RAISE EXCEPTION 'Frequência: a competência %/% de este servidor está consolidada; reabra a frequência para alterar o ponto',
      to_char(NEW.data, 'MM'), to_char(NEW.data, 'YYYY') USING ERRCODE = '42501';
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;


--
-- Name: regra_lancamento_proteger_exigir(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.regra_lancamento_proteger_exigir() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.modo = 'exigir' AND auth.uid() IS NOT NULL
     AND (TG_OP = 'INSERT' OR OLD.modo IS DISTINCT FROM 'exigir' OR OLD.modulo IS DISTINCT FROM NEW.modulo) THEN
    RAISE EXCEPTION 'O modo exigir da regra de lançamento (módulo %) só entra por migração', NEW.modulo
      USING ERRCODE = '42501',
            HINT = 'Pela tela, os modos são desligado e registrar; exigir é ligado por migração, módulo a módulo.';
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: remessa_integridade(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.remessa_integridade() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  v_uid uuid := auth.uid();
  v_sistema boolean := auth.uid() IS NULL
    AND coalesce(current_setting('role', true), 'none') NOT IN ('anon', 'authenticated');
  v_cancelando boolean;
  v_carimbo text[] := ARRAY['updated_at', 'updated_by', 'updated_by_servidor_id'];
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'cancelada' THEN
      RAISE EXCEPTION 'Remessa não nasce cancelada: use cancelar_remessa depois de gerada'
        USING ERRCODE = 'RHE03';
    END IF;
    NEW.cancelada_em := NULL;
    NEW.cancelada_por := NULL;
    NEW.motivo_cancelamento := NULL;
    PERFORM pg_advisory_xact_lock(hashtextextended('remessas_bancarias.numero_remessa:' || NEW.conta_autarquia_id::text, 0));
    SELECT coalesce(max(r.numero_remessa), 0) + 1 INTO NEW.numero_remessa
      FROM public.remessas_bancarias r WHERE r.conta_autarquia_id = NEW.conta_autarquia_id;
    SELECT count(*)::integer, coalesce(round(sum(f.valor_liquido), 2), 0)
      INTO NEW.quantidade_registros, NEW.valor_total
      FROM public.fichas_financeiras f
     WHERE f.folha_id = NEW.folha_id AND f.valor_liquido > 0
       AND coalesce(f.banco_codigo, '') <> '' AND coalesce(f.banco_agencia, '') <> '' AND coalesce(f.banco_conta, '') <> '';
  ELSE
    -- campos que identificam o arquivo gerado
    IF NEW.folha_id IS DISTINCT FROM OLD.folha_id OR NEW.conta_autarquia_id IS DISTINCT FROM OLD.conta_autarquia_id
       OR NEW.numero_remessa IS DISTINCT FROM OLD.numero_remessa OR NEW.valor_total IS DISTINCT FROM OLD.valor_total
       OR NEW.quantidade_registros IS DISTINCT FROM OLD.quantidade_registros THEN
      RAISE EXCEPTION 'Remessa %: folha, conta, número, valor e quantidade não mudam depois de gerada', OLD.numero_remessa
        USING ERRCODE = 'RHE02';
    END IF;
    -- arquivo já gravado não muda nem some
    IF OLD.arquivo_path IS NOT NULL OR OLD.arquivo_sha256 IS NOT NULL THEN
      IF NEW.arquivo_path IS DISTINCT FROM OLD.arquivo_path OR NEW.arquivo_sha256 IS DISTINCT FROM OLD.arquivo_sha256 THEN
        RAISE EXCEPTION 'Remessa %: o arquivo já foi guardado (caminho e sha256 não mudam)', OLD.numero_remessa
          USING ERRCODE = 'RHE02';
      END IF;
    END IF;
    -- remessa cancelada não muda mais (só o carimbo de atualização, que os triggers seguintes regravam)
    IF OLD.status = 'cancelada' THEN
      IF (to_jsonb(NEW) - v_carimbo) IS DISTINCT FROM (to_jsonb(OLD) - v_carimbo) THEN
        RAISE EXCEPTION 'Remessa % está cancelada e não muda mais', OLD.numero_remessa
          USING ERRCODE = 'RHE02';
      END IF;
      RETURN NEW;
    END IF;
    -- cancelar só pela RPC (ela liga a variável local remessa.cancelar com o id; a API não define variáveis)
    v_cancelando := coalesce(current_setting('remessa.cancelar', true), '') = OLD.id::text;
    IF NOT v_cancelando
       AND (NEW.status = 'cancelada' OR NEW.cancelada_em IS DISTINCT FROM OLD.cancelada_em
            OR NEW.cancelada_por IS DISTINCT FROM OLD.cancelada_por
            OR NEW.motivo_cancelamento IS DISTINCT FROM OLD.motivo_cancelamento) THEN
      RAISE EXCEPTION 'Remessa %: cancelamento só pela RPC cancelar_remessa (com motivo)', OLD.numero_remessa
        USING ERRCODE = 'RHE03';
    END IF;
  END IF;

  -- arquivo: de nulo para valor, uma vez, caminho e hash juntos, por quem gerou a remessa e processa a folha
  IF (NEW.arquivo_path IS NOT NULL OR NEW.arquivo_sha256 IS NOT NULL)
     AND (TG_OP = 'INSERT' OR (OLD.arquivo_path IS NULL AND OLD.arquivo_sha256 IS NULL)) THEN
    IF NOT v_sistema AND NOT coalesce(v_uid IS NOT NULL AND public.can_access_module(v_uid, 'rh')
                                      AND public.has_permission_code(v_uid, 'financeiro.folha.processar'), false) THEN
      RAISE EXCEPTION 'Guardar o arquivo da remessa exige o módulo rh e a permissão financeiro.folha.processar'
        USING ERRCODE = '42501';
    END IF;
    IF NOT v_sistema AND (TG_OP = 'INSERT' OR OLD.gerado_por IS DISTINCT FROM v_uid) THEN
      RAISE EXCEPTION 'Só quem gerou a remessa guarda o arquivo dela (depois do INSERT)'
        USING ERRCODE = '42501';
    END IF;
    IF NEW.arquivo_path IS NULL OR NEW.arquivo_sha256 IS NULL THEN
      RAISE EXCEPTION 'Informe arquivo_path e arquivo_sha256 juntos' USING ERRCODE = '22023';
    END IF;
    IF NEW.arquivo_path <> NEW.id::text || '.rem' THEN
      RAISE EXCEPTION 'arquivo_path deve ser <id da remessa>.rem (bucket remessas-cnab)' USING ERRCODE = '22023';
    END IF;
    IF NEW.arquivo_sha256 !~ '^[0-9a-f]{64}$' THEN
      RAISE EXCEPTION 'arquivo_sha256 deve ter 64 dígitos hexadecimais minúsculos' USING ERRCODE = '22023';
    END IF;
    IF NOT v_sistema AND NOT EXISTS (
         SELECT 1 FROM storage.objects o
          WHERE o.bucket_id = 'remessas-cnab' AND o.name = NEW.arquivo_path
            AND coalesce(to_jsonb(o) ->> 'owner_id', to_jsonb(o) ->> 'owner') = v_uid::text) THEN
      RAISE EXCEPTION 'O arquivo % não foi enviado ao bucket remessas-cnab por este usuário', NEW.arquivo_path
        USING ERRCODE = 'P0002';
    END IF;
  END IF;
  RETURN NEW;
END;
$_$;


--
-- Name: responsavel_atual(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.responsavel_atual() RETURNS TABLE(user_id uuid, servidor_id uuid, servidor_nome text, servidor_matricula text, origem text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  c jsonb := public.trilha_contexto();
BEGIN
  user_id := (c ->> 'user_id')::uuid;
  servidor_id := (c ->> 'servidor_id')::uuid;
  servidor_nome := c ->> 'servidor_nome';
  servidor_matricula := c ->> 'servidor_matricula';
  origem := c ->> 'origem';
  RETURN NEXT;
END;
$$;


--
-- Name: FUNCTION responsavel_atual(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.responsavel_atual() IS 'Responsável pelo comando atual: usuário, servidor vinculado (retrato), nome, matrícula e origem (usuario, usuario_sem_vinculo, sistema, anonimo)';


--
-- Name: resumo_uso_ia_mes(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.resumo_uso_ia_mes() RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v jsonb;
BEGIN
  IF NOT public.pode_configurar_ia() THEN
    RAISE EXCEPTION 'Sem permissão para ver o uso da IA' USING ERRCODE = '42501';
  END IF;
  SELECT jsonb_build_object(
           'chamadas', count(*),
           'tokens_entrada', coalesce(sum(u.tokens_entrada), 0),
           'tokens_saida', coalesce(sum(u.tokens_saida), 0),
           'teto_tokens_mes', (SELECT c.teto_tokens_mes FROM public.ia_config c WHERE c.id))
    INTO v
    FROM public.ia_uso u
   WHERE u.created_at >= date_trunc('month', now(), 'UTC');
  RETURN v;
END;
$$;


--
-- Name: rh_admitir_servidor(uuid, public.tipo_vinculo_servidor, uuid, uuid, date, text, text, text, date, text, date, boolean, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rh_admitir_servidor(p_servidor_id uuid, p_tipo public.tipo_vinculo_servidor, p_cargo_id uuid, p_unidade_id uuid, p_data_inicio date, p_orgao_origem text DEFAULT NULL::text, p_ato_tipo text DEFAULT NULL::text, p_ato_numero text DEFAULT NULL::text, p_ato_data date DEFAULT NULL::date, p_ato_doe_numero text DEFAULT NULL::text, p_ato_doe_data date DEFAULT NULL::date, p_gerar_minuta boolean DEFAULT true, p_funcao_exercida text DEFAULT NULL::text, p_observacao text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  v_servidor RECORD;
  v_cargo_nome text;
  v_unidade_nome text;
  v_vinculo_id uuid;
  v_lotacao_id uuid;
  v_provimento_id uuid;
  v_minuta_id uuid;
  v_minuta_numero text;
  v_exige_cargo boolean := p_tipo IN ('efetivo', 'comissionado');
  v_descricao text;
  v_protocolo text;
BEGIN
  IF auth.uid() IS NULL OR NOT (public.has_permission_code(auth.uid(), 'rh.servidores.criar')
                                OR public.has_permission_code(auth.uid(), 'rh.lotacoes.criar')) THEN
    RAISE EXCEPTION 'Sem permissão para admitir/lotar servidor' USING ERRCODE = '42501';
  END IF;
  IF p_data_inicio IS NULL THEN RAISE EXCEPTION 'Informe a data de início'; END IF;

  SELECT id, nome_completo, situacao INTO v_servidor FROM public.servidores WHERE id = p_servidor_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Servidor não encontrado'; END IF;
  IF v_servidor.situacao = 'falecido' THEN RAISE EXCEPTION 'Servidor falecido não pode ser admitido'; END IF;

  SELECT nome INTO v_unidade_nome FROM public.estrutura_organizacional WHERE id = p_unidade_id AND ativo;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unidade não encontrada ou inativa'; END IF;

  IF v_exige_cargo THEN
    IF p_cargo_id IS NULL THEN RAISE EXCEPTION 'Selecione o cargo'; END IF;
  END IF;
  IF p_cargo_id IS NOT NULL THEN
    SELECT coalesce(sigla || ' - ', '') || nome INTO v_cargo_nome FROM public.cargos WHERE id = p_cargo_id AND ativo;
    IF NOT FOUND THEN RAISE EXCEPTION 'Cargo não encontrado ou inativo'; END IF;
  END IF;
  IF p_tipo = 'cedido_entrada' AND coalesce(btrim(p_orgao_origem), '') = '' THEN
    RAISE EXCEPTION 'Informe o órgão de origem do servidor cedido';
  END IF;

  -- protocolo do ato (migração 20261012090000): todas as gravações abaixo e na trilha levam este número
  v_protocolo := public.rh_protocolo_atual('admissao',
    'Admissão de ' || v_servidor.nome_completo || ' (' || p_tipo::text || ') em ' || v_unidade_nome
      || ' a partir de ' || to_char(p_data_inicio, 'DD/MM/YYYY'),
    p_servidor_id, jsonb_build_object('tipo_vinculo', p_tipo, 'cargo_id', p_cargo_id, 'unidade_id', p_unidade_id));

  -- uma admissão por vez: quem já tem vínculo, lotação ou provimento ativo usa os fluxos de movimentação
  IF EXISTS (SELECT 1 FROM public.lotacoes WHERE servidor_id = p_servidor_id AND ativo)
     OR EXISTS (SELECT 1 FROM public.provimentos WHERE servidor_id = p_servidor_id AND status IN ('ativo', 'suspenso'))
     OR EXISTS (SELECT 1 FROM public.vinculos_servidor WHERE servidor_id = p_servidor_id AND ativo) THEN
    RAISE EXCEPTION 'Servidor já possui vínculo, lotação ou provimento ativo; encerre o atual antes de admitir de novo';
  END IF;

  INSERT INTO public.vinculos_servidor (servidor_id, tipo, origem, orgao_nome, cargo_id, unidade_id, data_inicio,
                                        data_posse, data_exercicio, ativo,
                                        ato_tipo, ato_numero, ato_data, ato_doe_numero, ato_doe_data)
  VALUES (p_servidor_id, p_tipo,
          CASE WHEN p_tipo = 'cedido_entrada' THEN 'outro_orgao'::origem_vinculo ELSE 'idjuv'::origem_vinculo END,
          CASE WHEN p_tipo = 'cedido_entrada' THEN p_orgao_origem END,
          p_cargo_id, p_unidade_id, p_data_inicio, p_data_inicio, p_data_inicio, true,
          p_ato_tipo, p_ato_numero, p_ato_data, p_ato_doe_numero, p_ato_doe_data)
  RETURNING id INTO v_vinculo_id;

  INSERT INTO public.lotacoes (servidor_id, unidade_id, cargo_id, tipo_lotacao, tipo_movimentacao, data_inicio, ativo,
                               funcao_exercida, observacao,
                               ato_tipo, ato_numero, ato_data, ato_doe_numero, ato_doe_data)
  VALUES (p_servidor_id, p_unidade_id, p_cargo_id, 'lotacao_interna', 'lotacao_inicial', p_data_inicio, true,
          p_funcao_exercida, p_observacao,
          p_ato_tipo, p_ato_numero, p_ato_data, p_ato_doe_numero, p_ato_doe_data)
  RETURNING id INTO v_lotacao_id;

  IF p_tipo = 'cedido_entrada' THEN
    INSERT INTO public.cessoes (servidor_id, tipo, orgao_origem, unidade_idjuv_id, data_inicio, ativa,
                                ato_tipo, ato_numero, ato_data, ato_doe_numero, ato_doe_data)
    VALUES (p_servidor_id, 'entrada', p_orgao_origem, p_unidade_id, p_data_inicio, true,
            p_ato_tipo, p_ato_numero, p_ato_data, p_ato_doe_numero, p_ato_doe_data);
  ELSIF v_exige_cargo THEN
    INSERT INTO public.provimentos (servidor_id, cargo_id, unidade_id, status, data_nomeacao, data_posse, data_exercicio)
    VALUES (p_servidor_id, p_cargo_id, p_unidade_id, 'ativo', p_data_inicio, p_data_inicio, p_data_inicio)
    RETURNING id INTO v_provimento_id;
  END IF;

  v_descricao := CASE WHEN p_tipo = 'cedido_entrada'
                      THEN 'Cessão de entrada de ' || p_orgao_origem || ' para ' || v_unidade_nome
                      ELSE 'Nomeação' || coalesce(' para ' || v_cargo_nome, '') || ' - ' || v_unidade_nome END;

  INSERT INTO public.historico_funcional (servidor_id, tipo, data_evento, data_vigencia_inicio, cargo_novo_id,
                                          unidade_nova_id, portaria_numero, portaria_data,
                                          diario_oficial_numero, diario_oficial_data, descricao)
  VALUES (p_servidor_id, CASE WHEN p_tipo = 'cedido_entrada' THEN 'cessao'::tipo_movimentacao_funcional
                              ELSE 'nomeacao'::tipo_movimentacao_funcional END,
          p_data_inicio, p_data_inicio, p_cargo_id, p_unidade_id, p_ato_numero, p_ato_data,
          p_ato_doe_numero, p_ato_doe_data, v_descricao);

  IF p_gerar_minuta AND p_cargo_id IS NOT NULL AND v_exige_cargo THEN
    v_minuta_numero := public.gerar_numero_portaria(EXTRACT(YEAR FROM p_data_inicio)::int);
    INSERT INTO public.documentos (tipo, categoria, status, titulo, ementa, numero, data_documento, servidores_ids,
                                   cargo_id, unidade_id, provimento_id)
    VALUES ('portaria', 'nomeacao', 'minuta', 'Portaria de Nomeação - ' || v_servidor.nome_completo,
            'Nomeia ' || v_servidor.nome_completo || ' para o cargo de ' || v_cargo_nome || ' na ' || v_unidade_nome || '.',
            v_minuta_numero, p_data_inicio, ARRAY[p_servidor_id], p_cargo_id, p_unidade_id, v_provimento_id)
    RETURNING id INTO v_minuta_id;
  END IF;

  -- situação explícita: vale para vínculo sem provimento (temporário, estagiário…) e para reingresso; com provimento
  -- ou cessão, os triggers refinam cargo/unidade logo em seguida
  UPDATE public.servidores
     SET data_admissao = coalesce(data_admissao, p_data_inicio),
         data_posse = coalesce(data_posse, p_data_inicio),
         data_exercicio = coalesce(data_exercicio, p_data_inicio),
         data_desligamento = NULL,
         ativo = true,
         situacao = CASE WHEN situacao IN ('exonerado', 'aposentado', 'inativo') THEN 'ativo'::situacao_funcional
                         ELSE situacao END,
         cargo_atual_id = p_cargo_id,
         unidade_atual_id = p_unidade_id
   WHERE id = p_servidor_id;

  RETURN jsonb_build_object('protocolo', v_protocolo, 'vinculo_id', v_vinculo_id, 'lotacao_id', v_lotacao_id,
                            'provimento_id', v_provimento_id, 'minuta_id', v_minuta_id, 'minuta_numero', v_minuta_numero);
END;
$$;


--
-- Name: rh_avancar_status_por_data(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rh_avancar_status_por_data() RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_hoje date := public.data_local();
  v_ids uuid[];
  v_fer_ini int; v_fer_fim int; v_lic int; v_viag int;
  v_protocolo text;
BEGIN
  v_protocolo := public.rh_protocolo_atual('sistema', 'Avanço automático de status por data (férias, licenças, viagens)',
                                            NULL, jsonb_build_object('rotina', 'rh_avancar_status_por_data'));
  WITH a AS (
    UPDATE public.ferias_servidor SET status = 'em_gozo'
     WHERE status = 'programada' AND data_inicio <= v_hoje AND data_fim >= v_hoje RETURNING servidor_id)
  SELECT array_agg(DISTINCT servidor_id), count(*) INTO v_ids, v_fer_ini FROM a;

  WITH a AS (
    UPDATE public.ferias_servidor SET status = 'concluida'
     WHERE status = 'em_gozo' AND data_fim < v_hoje RETURNING servidor_id)
  SELECT coalesce(v_ids, '{}') || coalesce(array_agg(DISTINCT servidor_id), '{}'), count(*) INTO v_ids, v_fer_fim FROM a;

  WITH a AS (
    UPDATE public.licencas_afastamentos SET status = 'encerrada'
     WHERE status IN ('ativa', 'prorrogada') AND data_fim IS NOT NULL AND data_fim < v_hoje RETURNING servidor_id)
  SELECT coalesce(v_ids, '{}') || coalesce(array_agg(DISTINCT servidor_id), '{}'), count(*) INTO v_ids, v_lic FROM a;

  WITH a AS (
    UPDATE public.viagens_diarias SET status = 'em_andamento'
     WHERE status = 'autorizada' AND data_saida <= v_hoje AND data_retorno >= v_hoje RETURNING id)
  SELECT count(*) INTO v_viag FROM a;

  -- licença com início futuro não muda a situação hoje (a função confere as datas); recalcula quem mudou
  PERFORM public.fn_atualizar_situacao_servidor(s) FROM unnest(coalesce(v_ids, '{}')) AS s;

  RETURN jsonb_build_object('protocolo', v_protocolo, 'data', v_hoje, 'ferias_iniciadas', v_fer_ini, 'ferias_concluidas', v_fer_fim,
                            'licencas_encerradas', v_lic, 'viagens_em_andamento', v_viag);
END;
$$;


--
-- Name: rh_desligar_servidor(uuid, date, text, text, text, text, date, text, date, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rh_desligar_servidor(p_servidor_id uuid, p_data date, p_motivo text, p_observacao text DEFAULT NULL::text, p_ato_tipo text DEFAULT NULL::text, p_ato_numero text DEFAULT NULL::text, p_ato_data date DEFAULT NULL::date, p_ato_doe_numero text DEFAULT NULL::text, p_ato_doe_data date DEFAULT NULL::date, p_gerar_minuta boolean DEFAULT true) RETURNS jsonb
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  v_servidor RECORD;
  v_prov RECORD;
  v_unidade_id uuid;
  v_cargo_id uuid;
  v_cargo_nome text;
  v_nova situacao_funcional;
  v_hist tipo_movimentacao_funcional;
  v_n_lot int; v_n_vinc int; v_n_prov int; v_n_cess int; v_n_desig int; v_n_fer int; v_n_lic int;
  v_n_viag int; v_n_chefe int; v_n_com int; v_viag_andamento int;
  v_minuta_numero text;
  v_avisos text[] := '{}';
  v_protocolo text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_permission_code(auth.uid(), 'rh.servidores.editar') THEN
    RAISE EXCEPTION 'Sem permissão para desligar servidor' USING ERRCODE = '42501';
  END IF;
  IF p_motivo NOT IN ('exoneracao', 'exoneracao_pedido', 'exoneracao_oficio', 'termino_mandato', 'demissao',
                      'aposentadoria', 'falecimento', 'vacancia') THEN
    RAISE EXCEPTION 'Motivo de desligamento inválido: %', p_motivo;
  END IF;
  IF p_data IS NULL THEN RAISE EXCEPTION 'Informe a data do desligamento'; END IF;

  SELECT id, nome_completo, situacao INTO v_servidor FROM public.servidores WHERE id = p_servidor_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Servidor não encontrado'; END IF;
  IF v_servidor.situacao IN ('exonerado', 'aposentado', 'falecido') THEN
    RAISE EXCEPTION 'Servidor já desligado (%)', v_servidor.situacao;
  END IF;

  v_protocolo := public.rh_protocolo_atual('desligamento',
    'Desligamento de ' || v_servidor.nome_completo || ' (' || p_motivo || ') em ' || to_char(p_data, 'DD/MM/YYYY')
      || coalesce(' — ' || nullif(btrim(p_observacao), ''), ''),
    p_servidor_id, jsonb_build_object('motivo', p_motivo, 'ato_numero', p_ato_numero, 'ato_doe_numero', p_ato_doe_numero));

  v_nova := CASE p_motivo WHEN 'falecimento' THEN 'falecido' WHEN 'aposentadoria' THEN 'aposentado' ELSE 'exonerado' END;
  v_hist := CASE WHEN p_motivo = 'aposentadoria' THEN 'aposentadoria'
                 WHEN p_motivo IN ('falecimento', 'vacancia') THEN 'vacancia'
                 ELSE 'exoneracao' END;

  -- o que ele ocupava, para o histórico e a portaria
  SELECT p.cargo_id, p.unidade_id INTO v_prov FROM public.provimentos p
   WHERE p.servidor_id = p_servidor_id AND p.status IN ('ativo', 'suspenso')
   ORDER BY p.data_nomeacao DESC LIMIT 1;
  v_cargo_id := v_prov.cargo_id;
  v_unidade_id := coalesce(v_prov.unidade_id,
                           (SELECT unidade_id FROM public.lotacoes WHERE servidor_id = p_servidor_id AND ativo
                             ORDER BY data_inicio DESC LIMIT 1));
  IF v_cargo_id IS NOT NULL THEN
    SELECT coalesce(sigla || ' - ', '') || nome INTO v_cargo_nome FROM public.cargos WHERE id = v_cargo_id;
  END IF;

  UPDATE public.lotacoes SET ativo = false, data_fim = p_data,
         observacao = coalesce(p_observacao, 'Desligamento: ' || p_motivo)
   WHERE servidor_id = p_servidor_id AND ativo;
  GET DIAGNOSTICS v_n_lot = ROW_COUNT;

  UPDATE public.vinculos_servidor SET ativo = false, data_fim = p_data, motivo_encerramento = p_motivo
   WHERE servidor_id = p_servidor_id AND ativo;
  GET DIAGNOSTICS v_n_vinc = ROW_COUNT;

  UPDATE public.provimentos SET status = 'encerrado', data_encerramento = p_data, motivo_encerramento = p_motivo,
         ato_encerramento_tipo = p_ato_tipo, ato_encerramento_numero = p_ato_numero, ato_encerramento_data = p_ato_data
   WHERE servidor_id = p_servidor_id AND status IN ('ativo', 'suspenso');
  GET DIAGNOSTICS v_n_prov = ROW_COUNT;

  UPDATE public.cessoes SET ativa = false, data_fim = coalesce(least(data_fim, p_data), p_data)
   WHERE servidor_id = p_servidor_id AND ativa;
  GET DIAGNOSTICS v_n_cess = ROW_COUNT;

  UPDATE public.designacoes
     SET status = CASE WHEN status = 'pendente' THEN 'rejeitada' ELSE 'encerrada' END,
         motivo_rejeicao = CASE WHEN status = 'pendente' THEN 'Servidor desligado em ' || p_data END,
         data_fim = CASE WHEN status = 'aprovada' THEN coalesce(least(data_fim, p_data), p_data) ELSE data_fim END,
         ativo = false
   WHERE servidor_id = p_servidor_id AND status IN ('pendente', 'aprovada');
  GET DIAGNOSTICS v_n_desig = ROW_COUNT;

  UPDATE public.ferias_servidor
     SET status = CASE WHEN status = 'em_gozo' THEN 'interrompida' ELSE 'cancelada' END,
         observacoes = trim(both E'\n' from coalesce(observacoes, '') || E'\nDesligamento em ' || p_data)
   WHERE servidor_id = p_servidor_id AND status IN ('programada', 'em_gozo');
  GET DIAGNOSTICS v_n_fer = ROW_COUNT;

  UPDATE public.licencas_afastamentos
     SET status = 'encerrada', data_fim = coalesce(least(data_fim, p_data), p_data)
   WHERE servidor_id = p_servidor_id AND status IN ('ativa', 'prorrogada');
  GET DIAGNOSTICS v_n_lic = ROW_COUNT;

  UPDATE public.viagens_diarias
     SET status = 'cancelada',
         observacoes = trim(both E'\n' from coalesce(observacoes, '') || E'\nCancelada: desligamento em ' || p_data)
   WHERE servidor_id = p_servidor_id AND status IN ('solicitada', 'autorizada');
  GET DIAGNOSTICS v_n_viag = ROW_COUNT;
  SELECT count(*) INTO v_viag_andamento FROM public.viagens_diarias
   WHERE servidor_id = p_servidor_id AND status = 'em_andamento';

  UPDATE public.nomeacoes_chefe_unidade SET status = 'encerrado', data_fim = p_data
   WHERE servidor_id = p_servidor_id AND status = 'ativo';
  GET DIAGNOSTICS v_n_chefe = ROW_COUNT;

  UPDATE public.comissoes_membros SET data_fim = p_data
   WHERE servidor_id = p_servidor_id AND (data_fim IS NULL OR data_fim > p_data);
  GET DIAGNOSTICS v_n_com = ROW_COUNT;

  INSERT INTO public.historico_funcional (servidor_id, tipo, data_evento, data_vigencia_inicio, cargo_anterior_id,
                                          unidade_anterior_id, portaria_numero, portaria_data,
                                          diario_oficial_numero, diario_oficial_data, descricao)
  VALUES (p_servidor_id, v_hist, p_data, p_data, v_cargo_id, v_unidade_id, p_ato_numero, p_ato_data,
          p_ato_doe_numero, p_ato_doe_data,
          'Desligamento (' || p_motivo || ')' || coalesce(' do cargo ' || v_cargo_nome, '')
            || coalesce('. ' || p_observacao, ''));

  IF p_gerar_minuta AND v_cargo_id IS NOT NULL AND p_motivo <> 'falecimento' THEN
    v_minuta_numero := public.gerar_numero_portaria(EXTRACT(YEAR FROM p_data)::int);
    INSERT INTO public.documentos (tipo, categoria, status, titulo, ementa, numero, data_documento, servidores_ids,
                                   cargo_id, unidade_id)
    VALUES ('portaria', CASE WHEN p_motivo IN ('aposentadoria', 'vacancia') THEN 'pessoal'::categoria_portaria
                             ELSE 'exoneracao'::categoria_portaria END,
            'minuta',
            CASE WHEN p_motivo = 'aposentadoria' THEN 'Aposentadoria - ' ELSE 'Exoneração - ' END || v_servidor.nome_completo,
            CASE WHEN p_motivo = 'aposentadoria' THEN 'Concede aposentadoria a ' ELSE 'Exonera ' END
              || v_servidor.nome_completo || ' do cargo de ' || v_cargo_nome || '.',
            v_minuta_numero, p_data, ARRAY[p_servidor_id], v_cargo_id, v_unidade_id);
  END IF;

  -- UPDATE barrado pela RLS não dá erro, só afeta 0 linhas. Se sobrou algo aberto, quem chamou não tem permissão
  -- sobre alguma das tabelas: desfaz tudo (nada fica pela metade).
  IF EXISTS (SELECT 1 FROM public.lotacoes WHERE servidor_id = p_servidor_id AND ativo)
     OR EXISTS (SELECT 1 FROM public.vinculos_servidor WHERE servidor_id = p_servidor_id AND ativo)
     OR EXISTS (SELECT 1 FROM public.provimentos WHERE servidor_id = p_servidor_id AND status IN ('ativo', 'suspenso'))
     OR EXISTS (SELECT 1 FROM public.cessoes WHERE servidor_id = p_servidor_id AND ativa)
     OR EXISTS (SELECT 1 FROM public.designacoes WHERE servidor_id = p_servidor_id AND status IN ('pendente', 'aprovada'))
     OR EXISTS (SELECT 1 FROM public.ferias_servidor WHERE servidor_id = p_servidor_id AND status IN ('programada', 'em_gozo'))
     OR EXISTS (SELECT 1 FROM public.licencas_afastamentos WHERE servidor_id = p_servidor_id AND status IN ('ativa', 'prorrogada'))
     OR EXISTS (SELECT 1 FROM public.viagens_diarias WHERE servidor_id = p_servidor_id AND status IN ('solicitada', 'autorizada'))
     OR EXISTS (SELECT 1 FROM public.nomeacoes_chefe_unidade WHERE servidor_id = p_servidor_id AND status = 'ativo') THEN
    RAISE EXCEPTION 'Sem permissão para encerrar todos os registros do servidor (férias, licenças, viagens, designações…); nada foi gravado'
      USING ERRCODE = '42501';
  END IF;

  -- por último: a situação explícita (vale também para vínculo sem provimento) e a data de desligamento
  UPDATE public.servidores
     SET situacao = v_nova, ativo = false, cargo_atual_id = NULL, unidade_atual_id = NULL, data_desligamento = p_data
   WHERE id = p_servidor_id;

  IF v_viag_andamento > 0 THEN
    v_avisos := array_append(v_avisos, v_viag_andamento || ' viagem(ns) em andamento: concluir ou cancelar manualmente');
  END IF;
  v_avisos := array_append(v_avisos, 'Acerto financeiro (férias proporcionais, 13º, rescisão) não é calculado pelo sistema');
  v_avisos := array_append(v_avisos, 'Conferir bens patrimoniais em carga do servidor e revogar acessos fora do RH');

  RETURN jsonb_build_object('protocolo', v_protocolo, 'situacao', v_nova, 'minuta_numero', v_minuta_numero, 'avisos', to_jsonb(v_avisos),
                            'encerrados', jsonb_build_object('lotacoes', v_n_lot, 'vinculos', v_n_vinc,
                              'provimentos', v_n_prov, 'cessoes', v_n_cess, 'designacoes', v_n_desig,
                              'ferias', v_n_fer, 'licencas', v_n_lic, 'viagens', v_n_viag,
                              'chefias_de_unidade', v_n_chefe, 'comissoes', v_n_com));
END;
$$;


--
-- Name: rh_exige_servidor_vinculado(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rh_exige_servidor_vinculado() RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN coalesce((SELECT rl.modo = 'exigir' FROM public.regra_lancamento rl WHERE rl.modulo = 'rh'), false);
END;
$$;


--
-- Name: rh_importar_quadro_vagas(jsonb, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rh_importar_quadro_vagas(p_linhas jsonb, p_gravar boolean DEFAULT false) RETURNS jsonb
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $_$
DECLARE
  c_simulacao constant text := 'rh_importar_quadro_vagas: simulação';
  l jsonb;
  i int := 0;
  k int;
  n int;
  v_erros jsonb := '[]'::jsonb;
  v_avisos jsonb := '[]'::jsonb;
  v_cargos_criados int := 0;
  v_cargos_existentes int := 0;
  v_vagas_criadas int := 0;
  v_vagas_existentes int := 0;
  v_ocupantes int := 0;
  v_cargos uuid[] := '{}';
  v_nome text;
  v_sigla text;
  v_txt text;
  v_cat public.categoria_cargo;
  v_venc numeric;
  v_lei_numero text;
  v_lei_data date;
  v_cargo_id uuid;
  v_unidade_id uuid;
  v_cod text;
  v_dono uuid;
  v_qtd int;
  v_existentes int;
  v_prefixo text;
  v_seq int;
  v_vaga uuid;
  v_gravado boolean := false;
  v_linha int;
  v_cargo_ativo boolean;
  v_chaves text[] := '{}';
  l_cargo_criado int;
  l_cargo_existente int;
  l_vagas_criadas int;
  l_vagas_existentes int;
  l_chave text;
  c_max_vagas constant int := 5000;
  p record;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_permission_code(auth.uid(), 'governanca.cargos.gerenciar') THEN
    RAISE EXCEPTION 'Sem permissão para importar o quadro de vagas' USING ERRCODE = '42501';
  END IF;
  IF p_linhas IS NULL OR jsonb_typeof(p_linhas) <> 'array' THEN
    RAISE EXCEPTION 'Envie as linhas da planilha como uma lista';
  END IF;
  IF jsonb_array_length(p_linhas) > 2000 THEN
    RAISE EXCEPTION 'Planilha grande demais (% linhas; máximo 2000)', jsonb_array_length(p_linhas);
  END IF;

  BEGIN
    FOR l IN SELECT x FROM jsonb_array_elements(p_linhas) AS x LOOP
      i := i + 1;
      v_linha := i;
      BEGIN
        IF jsonb_typeof(l) <> 'object' THEN
          RAISE EXCEPTION 'linha em formato inválido';
        END IF;
        -- número da linha na planilha, quando a tela informa (senão, a posição na lista)
        IF coalesce(l ->> 'linha', '') ~ '^\d{1,7}$' THEN
          v_linha := (l ->> 'linha')::int;
        END IF;
        -- contadores da linha: só entram no total se a linha inteira der certo
        l_cargo_criado := 0;
        l_cargo_existente := 0;
        l_vagas_criadas := 0;
        l_vagas_existentes := 0;
        l_chave := NULL;

        v_nome := nullif(btrim(l ->> 'cargo'), '');
        IF v_nome IS NULL THEN
          RAISE EXCEPTION 'informe o nome do cargo';
        END IF;
        v_sigla := nullif(upper(btrim(l ->> 'sigla')), '');
        v_lei_numero := nullif(btrim(l ->> 'lei_numero'), '');

        -- data da lei: AAAA-MM-DD ou DD/MM/AAAA (também com - ou . no lugar da barra); nada que dependa de DateStyle
        v_txt := nullif(btrim(l ->> 'lei_data'), '');
        v_lei_data := NULL;
        BEGIN
          IF v_txt ~ '^\d{4}-\d{2}-\d{2}$' THEN
            v_lei_data := to_date(v_txt, 'YYYY-MM-DD');
          ELSIF v_txt ~ '^\d{1,2}[/.-]\d{1,2}[/.-]\d{4}$' THEN
            v_lei_data := to_date(translate(v_txt, '.-', '//'), 'DD/MM/YYYY');
          ELSIF v_txt IS NOT NULL THEN
            RAISE EXCEPTION USING ERRCODE = '22007';
          END IF;
        EXCEPTION WHEN invalid_datetime_format OR datetime_field_overflow THEN
          RAISE EXCEPTION 'data da lei "%" inválida (use DD/MM/AAAA)', v_txt;
        END;

        -- unidade: pela sigla, depois pelo nome (só unidades ativas)
        v_txt := nullif(btrim(l ->> 'unidade'), '');
        v_unidade_id := NULL;
        IF v_txt IS NOT NULL THEN
          SELECT id INTO v_unidade_id FROM public.estrutura_organizacional
           WHERE ativo AND upper(btrim(sigla)) = upper(v_txt) ORDER BY nome LIMIT 1;
          IF v_unidade_id IS NULL THEN
            SELECT id INTO v_unidade_id FROM public.estrutura_organizacional
             WHERE ativo AND lower(btrim(nome)) = lower(v_txt) ORDER BY nome LIMIT 1;
          END IF;
          IF v_unidade_id IS NULL THEN
            RAISE EXCEPTION 'unidade "%" não encontrada (use a sigla ou o nome cadastrado na estrutura)', v_txt;
          END IF;
        END IF;

        -- cargo: o existente com o mesmo nome e símbolo é reaproveitado (nada dele é alterado)
        SELECT id, ativo INTO v_cargo_id, v_cargo_ativo FROM public.cargos
         WHERE lower(btrim(nome)) = lower(v_nome) AND coalesce(upper(btrim(sigla)), '') = coalesce(v_sigla, '')
         ORDER BY ativo DESC NULLS LAST, created_at
         LIMIT 1;
        IF v_cargo_id IS NULL THEN
          v_txt := translate(lower(btrim(coalesce(l ->> 'categoria', ''))), 'áàâãéêíóôõúç ', 'aaaaeeiooouc_');
          v_txt := CASE v_txt WHEN 'fg' THEN 'funcao_gratificada' WHEN 'funcao' THEN 'funcao_gratificada'
                              WHEN 'cargo_em_comissao' THEN 'comissionado' WHEN 'comissao' THEN 'comissionado'
                              WHEN 'estagio' THEN 'estagiario' ELSE v_txt END;
          IF v_txt = '' THEN
            RAISE EXCEPTION 'cargo novo "%": informe a categoria (efetivo, comissionado, funcao_gratificada, temporario ou estagiario)', v_nome;
          END IF;
          BEGIN
            v_cat := v_txt::public.categoria_cargo;
          EXCEPTION WHEN invalid_text_representation THEN
            RAISE EXCEPTION 'categoria "%" inválida (use efetivo, comissionado, funcao_gratificada, temporario ou estagiario)', l ->> 'categoria';
          END;
          -- vencimento (só para cargo novo): 15000,00 | 15.000,00 | 15.000 | 15000.00
          v_txt := regexp_replace(coalesce(l ->> 'vencimento', ''), '[R$[:space:]]', '', 'g');
          v_venc := NULL;
          IF v_txt ~ '^\d{1,3}(\.\d{3})+(,\d{1,2})?$' OR v_txt ~ '^\d+(,\d{1,2})?$' THEN
            v_venc := replace(replace(v_txt, '.', ''), ',', '.')::numeric;
          ELSIF v_txt ~ '^\d+\.\d{1,2}$' THEN
            v_venc := v_txt::numeric;
          ELSIF v_txt <> '' THEN
            RAISE EXCEPTION 'vencimento "%" inválido (use 15000,00)', l ->> 'vencimento';
          END IF;
          INSERT INTO public.cargos (nome, sigla, categoria, natureza, vencimento_base, lei_criacao_numero, lei_criacao_data,
                                     quantidade_vagas, ativo)
          VALUES (v_nome, v_sigla, v_cat,
                  CASE WHEN v_cat = 'efetivo' THEN 'efetivo'::public.natureza_cargo
                       WHEN v_cat IN ('comissionado', 'funcao_gratificada') THEN 'comissionado'::public.natureza_cargo END,
                  v_venc, v_lei_numero, v_lei_data, 0, true)
          RETURNING id INTO v_cargo_id;
          l_cargo_criado := 1;
        ELSIF NOT (v_cargo_id = ANY (v_cargos)) THEN
          l_cargo_existente := 1;
          IF v_cargo_ativo IS NOT TRUE THEN
            v_avisos := v_avisos || jsonb_build_object('linha', v_linha, 'aviso',
              format('o cargo %s está inativo no cadastro; as vagas foram ligadas a ele assim mesmo', v_nome));
          END IF;
        END IF;

        v_cod := nullif(upper(btrim(l ->> 'codigo')), '');
        IF v_cod IS NOT NULL THEN
          SELECT cargo_id INTO v_dono FROM public.vagas_cargo WHERE codigo = v_cod;
          IF FOUND AND v_dono = v_cargo_id THEN
            l_vagas_existentes := 1;
          ELSIF FOUND THEN
            RAISE EXCEPTION 'o código de vaga % já pertence a outro cargo', v_cod;
          ELSE
            INSERT INTO public.vagas_cargo (codigo, cargo_id, unidade_id, data_criacao, ato_criacao)
            VALUES (v_cod, v_cargo_id, v_unidade_id, v_lei_data,
                    CASE WHEN v_lei_numero IS NOT NULL THEN 'Lei ' || v_lei_numero END);
            l_vagas_criadas := 1;
          END IF;
        ELSE
          v_txt := nullif(btrim(l ->> 'quantidade'), '');
          IF v_txt IS NOT NULL AND v_txt !~ '^\d{1,3}$' THEN
            RAISE EXCEPTION 'quantidade de vagas "%" inválida (use um número inteiro)', v_txt;
          END IF;
          v_qtd := coalesce(v_txt::int, 1);
          IF v_qtd < 1 OR v_qtd > 500 THEN
            RAISE EXCEPTION 'quantidade de vagas inválida (%)', v_txt;
          END IF;
          -- a quantidade é o total do cargo naquela unidade: duas linhas iguais na planilha não somariam
          l_chave := v_cargo_id::text || '|' || coalesce(v_unidade_id::text, '-');
          IF l_chave = ANY (v_chaves) THEN
            RAISE EXCEPTION 'cargo % repetido na planilha para a mesma unidade: some as quantidades numa linha só', v_nome;
          END IF;
          SELECT count(*) INTO v_existentes FROM public.vagas_cargo
           WHERE cargo_id = v_cargo_id AND unidade_id IS NOT DISTINCT FROM v_unidade_id AND data_extincao IS NULL;
          IF v_existentes > v_qtd THEN
            v_avisos := v_avisos || jsonb_build_object('linha', v_linha, 'aviso',
              format('%s já tem %s vaga(s) ativas e a planilha pede %s: nenhuma vaga foi extinta (extinção é por ato, na tela)',
                     v_nome, v_existentes, v_qtd));
          END IF;
          l_vagas_existentes := least(v_existentes, v_qtd);
          IF v_existentes < v_qtd THEN
            v_prefixo := coalesce(nullif(btrim(regexp_replace(coalesce(v_sigla, ''), '[^A-Z0-9-]+', '-', 'g'), '-'), ''), 'VAGA');
            SELECT coalesce(max(substr(codigo, length(v_prefixo) + 2)::int), 0) INTO v_seq
              FROM public.vagas_cargo WHERE codigo ~ ('^' || v_prefixo || '\.[0-9]+$');
            IF v_vagas_criadas + (v_qtd - v_existentes) > c_max_vagas THEN
              RAISE EXCEPTION 'importação passaria de % vagas novas; divida a planilha', c_max_vagas;
            END IF;
            FOR k IN 1 .. (v_qtd - v_existentes) LOOP
              v_seq := v_seq + 1;
              INSERT INTO public.vagas_cargo (codigo, cargo_id, unidade_id, data_criacao, ato_criacao)
              VALUES (v_prefixo || '.' || lpad(v_seq::text, 3, '0'), v_cargo_id, v_unidade_id,
                      v_lei_data,
                      CASE WHEN v_lei_numero IS NOT NULL THEN 'Lei ' || v_lei_numero END);
              l_vagas_criadas := l_vagas_criadas + 1;
            END LOOP;
          END IF;
        END IF;

        -- linha concluída
        v_cargos_criados := v_cargos_criados + l_cargo_criado;
        v_cargos_existentes := v_cargos_existentes + l_cargo_existente;
        v_vagas_criadas := v_vagas_criadas + l_vagas_criadas;
        v_vagas_existentes := v_vagas_existentes + l_vagas_existentes;
        IF NOT (v_cargo_id = ANY (v_cargos)) THEN
          v_cargos := v_cargos || v_cargo_id;
        END IF;
        IF l_chave IS NOT NULL THEN
          v_chaves := v_chaves || l_chave;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        v_erros := v_erros || jsonb_build_object('linha', v_linha, 'erro', SQLERRM);
      END;
    END LOOP;

    -- a ligação dos ocupantes lê e altera provimentos, que a RLS só abre para rh ou gabinete
    IF jsonb_array_length(v_erros) = 0
       AND NOT (public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'gabinete')) THEN
      v_avisos := v_avisos || jsonb_build_object('aviso',
        'os ocupantes atuais não foram ligados às vagas: isso exige acesso ao RH. Peça a alguém do RH para reimportar a mesma planilha');
    END IF;

    IF jsonb_array_length(v_erros) = 0 THEN
      -- ocupantes atuais sem vaga: ligados a uma vaga livre do cargo (mesma unidade primeiro), por ordem de nomeação
      FOR p IN
        SELECT pr.id, pr.cargo_id, pr.unidade_id, pr.data_nomeacao, c.nome AS cargo_nome,
               coalesce(s.nome_social, s.nome_completo) AS nome
          FROM public.provimentos pr
          JOIN public.cargos c ON c.id = pr.cargo_id
          LEFT JOIN public.servidores s ON s.id = pr.servidor_id
         WHERE pr.cargo_id = ANY (v_cargos) AND pr.vaga_id IS NULL AND pr.status IN ('ativo', 'suspenso')
         ORDER BY pr.data_nomeacao, pr.id
      LOOP
        SELECT v.id INTO v_vaga FROM public.vagas_cargo v
         WHERE v.cargo_id = p.cargo_id AND v.data_extincao IS NULL
           AND NOT EXISTS (SELECT 1 FROM public.provimentos o
                            WHERE o.vaga_id = v.id
                              AND daterange(o.data_nomeacao, o.data_encerramento, '[)') && daterange(p.data_nomeacao, NULL, '[)'))
         ORDER BY (v.unidade_id IS NOT DISTINCT FROM p.unidade_id) DESC, (v.unidade_id IS NULL) DESC, v.codigo
         LIMIT 1;
        IF v_vaga IS NULL THEN
          v_avisos := v_avisos || jsonb_build_object('aviso',
            format('%s ocupa %s além do número de vagas: ficou sem vaga até alguém sair ou uma vaga ser criada',
                   coalesce(p.nome, 'um servidor'), p.cargo_nome));
          CONTINUE;
        END IF;
        BEGIN
          UPDATE public.provimentos SET vaga_id = v_vaga WHERE id = p.id;
          GET DIAGNOSTICS n = ROW_COUNT;
          v_ocupantes := v_ocupantes + n;
        EXCEPTION WHEN OTHERS THEN
          v_avisos := v_avisos || jsonb_build_object('aviso',
            format('não consegui ligar %s à vaga do cargo %s: %s', coalesce(p.nome, 'um servidor'), p.cargo_nome, SQLERRM));
        END;
      END LOOP;

      -- o número do cargo acompanha o quadro (telas antigas leem cargos.quantidade_vagas)
      BEGIN
        UPDATE public.cargos c
           SET quantidade_vagas = (SELECT count(*) FROM public.vagas_cargo v
                                    WHERE v.cargo_id = c.id AND v.data_extincao IS NULL)
         WHERE c.id = ANY (v_cargos)
           AND c.quantidade_vagas IS DISTINCT FROM (SELECT count(*) FROM public.vagas_cargo v
                                                     WHERE v.cargo_id = c.id AND v.data_extincao IS NULL);
      EXCEPTION WHEN OTHERS THEN
        v_avisos := v_avisos || jsonb_build_object('aviso',
          'o número de vagas no cadastro do cargo não foi atualizado: ' || SQLERRM);
      END;
    END IF;

    IF jsonb_array_length(v_erros) > 0 OR NOT p_gravar THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = c_simulacao;
    END IF;
    v_gravado := true;
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> c_simulacao THEN
      RAISE;
    END IF;
  END;

  RETURN jsonb_build_object(
    'gravado', v_gravado,
    'linhas', i,
    'cargos_criados', v_cargos_criados,
    'cargos_existentes', v_cargos_existentes,
    'vagas_criadas', v_vagas_criadas,
    'vagas_existentes', v_vagas_existentes,
    'ocupantes_vinculados', v_ocupantes,
    'erros', v_erros,
    'avisos', v_avisos);
END;
$_$;


--
-- Name: FUNCTION rh_importar_quadro_vagas(p_linhas jsonb, p_gravar boolean); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.rh_importar_quadro_vagas(p_linhas jsonb, p_gravar boolean) IS 'Importa a planilha de cargos e vagas (simula com gravar=false). Nunca apaga nem sobrescreve; liga os ocupantes atuais às vagas. Exige governanca.cargos.gerenciar. Migração 20261012150000.';


--
-- Name: rh_pendencias_nomeacao(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rh_pendencias_nomeacao() RETURNS TABLE(servidor_id uuid, nome text, matricula text, cargo text, provimento_id uuid, data_nomeacao date, portaria_numero text, portaria_status text)
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  SELECT s.id, s.nome_completo, s.matricula, c.nome, p.id, p.data_nomeacao,
         (SELECT d.numero FROM public.documentos d
           WHERE d.tipo = 'portaria' AND d.categoria = 'nomeacao'
             AND (d.provimento_id = p.id OR s.id = ANY (d.servidores_ids))
           ORDER BY d.created_at DESC LIMIT 1),
         (SELECT d.status::text FROM public.documentos d
           WHERE d.tipo = 'portaria' AND d.categoria = 'nomeacao'
             AND (d.provimento_id = p.id OR s.id = ANY (d.servidores_ids))
           ORDER BY d.created_at DESC LIMIT 1)
    FROM public.provimentos p
    JOIN public.servidores s ON s.id = p.servidor_id
    JOIN public.cargos c ON c.id = p.cargo_id
   WHERE p.status = 'ativo'
     AND NOT EXISTS (
       SELECT 1 FROM public.documentos d
        WHERE d.tipo = 'portaria' AND d.categoria = 'nomeacao' AND d.status IN ('publicado', 'vigente')
          AND (d.provimento_id = p.id OR (s.id = ANY (d.servidores_ids) AND (d.cargo_id IS NULL OR d.cargo_id = p.cargo_id))))
   ORDER BY p.data_nomeacao, s.nome_completo;
$$;


--
-- Name: rh_protocolo_atual(text, text, uuid, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rh_protocolo_atual(p_tipo text DEFAULT NULL::text, p_descricao text DEFAULT NULL::text, p_servidor_alvo uuid DEFAULT NULL::uuid, p_dados jsonb DEFAULT '{}'::jsonb) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_tx text := txid_current()::text;
  v_cache text := current_setting('trilha.protocolo', true);
  v_ano int := EXTRACT(YEAR FROM public.data_local())::int;
  v_seq_nome text;
  v_seq bigint;
  v_num text;
  v_tipo text := coalesce(p_tipo, 'alteracao');
BEGIN
  -- chamada direta pela API: só quem tem o módulo rh abre protocolo (dentro de trigger/RPC de ato a guarda não se aplica,
  -- o ato já passou pela permissão e pela RLS da própria operação)
  IF pg_trigger_depth() = 0 AND coalesce(current_setting('role', true), 'none') IN ('anon', 'authenticated')
     AND (auth.uid() IS NULL OR NOT public.can_access_module(auth.uid(), 'rh')) THEN
    RAISE EXCEPTION 'Sem permissão para abrir protocolo do RH' USING ERRCODE = '42501';
  END IF;
  IF p_dados IS NOT NULL AND (jsonb_typeof(p_dados) <> 'object' OR length(p_dados::text) > 4000) THEN
    RAISE EXCEPTION 'Dados do protocolo devem ser um objeto JSON de até 4000 caracteres' USING ERRCODE = '22023';
  END IF;

  -- uma transação, um protocolo (a chave inclui o txid: a variável de sessão não vaza para outra transação)
  IF v_cache IS NOT NULL AND v_cache <> '' AND split_part(v_cache, '|', 1) = v_tx THEN
    RETURN split_part(v_cache, '|', 2);
  END IF;

  IF v_tipo NOT IN ('admissao', 'desligamento', 'cadastro', 'movimentacao', 'ferias', 'licenca', 'viagem', 'frequencia',
                    'folha', 'portaria', 'ocorrencia', 'configuracao', 'consulta', 'sistema', 'alteracao') THEN
    RAISE EXCEPTION 'Tipo de protocolo inválido: %', v_tipo USING ERRCODE = '22023';
  END IF;

  v_seq_nome := 'rh_protocolo_seq_' || v_ano;
  IF to_regclass('public.' || v_seq_nome) IS NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext('rh_protocolo_seq'));
    EXECUTE format('CREATE SEQUENCE IF NOT EXISTS public.%I', v_seq_nome);
  END IF;
  EXECUTE format('SELECT nextval(%L)', 'public.' || v_seq_nome) INTO v_seq;
  v_num := 'RH-' || v_ano || '-' || CASE WHEN v_seq >= 1000000 THEN v_seq::text ELSE lpad(v_seq::text, 6, '0') END;

  -- linha de abertura: o contexto (servidor responsável, papel, unidade, IP, agente, transação) é completado pelo
  -- trigger trilha_completar_contexto, como em qualquer linha da trilha
  INSERT INTO public.audit_logs (action, entity_type, module_name, user_id, description, metadata, protocolo)
  VALUES ('create', 'protocolo', 'rh', auth.uid(),
          left(coalesce(p_descricao, 'Ato do RH (' || v_tipo || ')'), 500),
          coalesce(p_dados, '{}'::jsonb)
            || jsonb_build_object('abertura', true, 'tipo', v_tipo, 'numero', v_num,
                                  'servidor_id', p_servidor_alvo, 'fonte', 'protocolo'),
          v_num);

  PERFORM set_config('trilha.protocolo', v_tx || '|' || v_num, true);
  RETURN v_num;
END;
$$;


--
-- Name: rh_protocolo_consultar(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rh_protocolo_consultar(p_numero text) RETURNS jsonb
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  SELECT jsonb_build_object(
    'numero', p_numero,
    'abertura', (SELECT jsonb_build_object(
                          'em', a."timestamp", 'descricao', a.description, 'tipo', a.metadata ->> 'tipo',
                          'servidor_alvo_id', a.metadata ->> 'servidor_id',
                          'aberto_por_usuario', a.user_id, 'aberto_por_servidor', a.servidor_nome,
                          'matricula', a.servidor_matricula, 'papel', a.role_at_time, 'origem', a.origem,
                          'unidade_id', a.org_unit_id, 'ip', host(a.ip_address), 'transacao', a.transacao)
                   FROM public.audit_logs a
                  WHERE a.protocolo = p_numero AND a.entity_type = 'protocolo' LIMIT 1),
    'registros', coalesce((SELECT jsonb_agg(jsonb_build_object(
                          'sequencia', l.sequencia, 'em', l."timestamp", 'acao', l.action, 'entidade', l.entity_type,
                          'registro_id', l.entity_id, 'campos_alterados', l.campos_alterados, 'descricao', l.description,
                          'responsavel', l.servidor_nome, 'matricula', l.servidor_matricula, 'usuario', l.user_id)
                          ORDER BY l.sequencia)
                   FROM public.audit_logs l
                  WHERE l.protocolo = p_numero AND l.entity_type IS DISTINCT FROM 'protocolo'), '[]'::jsonb));
$$;


--
-- Name: rh_protocolos_listar(uuid, text, date, date, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rh_protocolos_listar(p_servidor uuid DEFAULT NULL::uuid, p_tipo text DEFAULT NULL::text, p_desde date DEFAULT NULL::date, p_ate date DEFAULT NULL::date, p_limite integer DEFAULT 100) RETURNS TABLE(numero text, em timestamp with time zone, tipo text, descricao text, servidor_alvo_id uuid, responsavel text, matricula text, origem text)
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  SELECT a.protocolo, a."timestamp", a.metadata ->> 'tipo', a.description,
         nullif(a.metadata ->> 'servidor_id', '')::uuid, a.servidor_nome, a.servidor_matricula, a.origem
    FROM public.audit_logs a
   WHERE a.entity_type = 'protocolo' AND a.module_name = 'rh'
     AND (p_servidor IS NULL OR a.metadata ->> 'servidor_id' = p_servidor::text)
     AND (p_tipo IS NULL OR a.metadata ->> 'tipo' = p_tipo)
     AND (p_desde IS NULL OR a."timestamp" >= p_desde::timestamptz)
     AND (p_ate IS NULL OR a."timestamp" < (p_ate + 1)::timestamptz)
   ORDER BY a.sequencia DESC
   LIMIT least(greatest(coalesce(p_limite, 100), 1), 500);
$$;


--
-- Name: rh_provimento_vaga(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rh_provimento_vaga() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_vaga record;
  v_conf record;
  v_cargo text;
  v_total int;
BEGIN
  -- encerrado sem data: a vaga fica livre a partir de hoje (senão o período ficaria aberto para sempre)
  IF NEW.vaga_id IS NOT NULL AND NEW.status IN ('encerrado', 'vacante') AND NEW.data_encerramento IS NULL THEN
    NEW.data_encerramento := public.data_local();
  END IF;

  -- tirar a vaga de quem continua no cargo liberaria a vaga para outra pessoa (duas pessoas para uma vaga)
  IF TG_OP = 'UPDATE' AND OLD.vaga_id IS NOT NULL AND NEW.vaga_id IS NULL AND NEW.status IN ('ativo', 'suspenso') THEN
    RAISE EXCEPTION 'Provimento em vigor não pode ficar sem vaga: registre a saída ou troque por outra vaga livre do cargo';
  END IF;

  -- provimento que passa a ocupar o cargo sem vaga informada: pega a primeira vaga livre do cargo
  IF NEW.vaga_id IS NULL AND NEW.status IN ('ativo', 'suspenso')
     AND (TG_OP = 'INSERT' OR OLD.status NOT IN ('ativo', 'suspenso') OR NEW.cargo_id IS DISTINCT FROM OLD.cargo_id)
     AND EXISTS (SELECT 1 FROM public.vagas_cargo WHERE cargo_id = NEW.cargo_id) THEN
    FOR v_vaga IN
      SELECT v.id FROM public.vagas_cargo v
       WHERE v.cargo_id = NEW.cargo_id
         AND v.data_extincao IS NULL
       ORDER BY (v.unidade_id IS NOT DISTINCT FROM NEW.unidade_id) DESC, (v.unidade_id IS NULL) DESC, v.codigo
    LOOP
      PERFORM 1 FROM public.vagas_cargo WHERE id = v_vaga.id FOR UPDATE;
      IF NOT EXISTS (SELECT 1 FROM public.provimentos p
                      WHERE p.vaga_id = v_vaga.id AND p.id <> NEW.id
                        AND daterange(p.data_nomeacao, p.data_encerramento, '[)')
                            && daterange(NEW.data_nomeacao, NEW.data_encerramento, '[)')) THEN
        NEW.vaga_id := v_vaga.id;
        EXIT;
      END IF;
    END LOOP;
    IF NEW.vaga_id IS NULL THEN
      SELECT coalesce(sigla || ' - ', '') || nome INTO v_cargo FROM public.cargos WHERE id = NEW.cargo_id;
      SELECT count(*) INTO v_total FROM public.vagas_cargo WHERE cargo_id = NEW.cargo_id AND data_extincao IS NULL;
      RAISE EXCEPTION 'Não há vaga livre no cargo % (% vaga(s), todas ocupadas em %)',
        v_cargo, v_total, to_char(NEW.data_nomeacao, 'DD/MM/YYYY')
        USING ERRCODE = '23P01',
              HINT = 'Registre a saída (exoneração) de quem ocupa a vaga, ou crie uma vaga nova por ato, antes de nomear.';
    END IF;
  END IF;

  IF NEW.vaga_id IS NOT NULL THEN
    SELECT * INTO v_vaga FROM public.vagas_cargo WHERE id = NEW.vaga_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Vaga não encontrada';
    END IF;
    IF v_vaga.cargo_id IS DISTINCT FROM NEW.cargo_id THEN
      RAISE EXCEPTION 'A vaga % é de outro cargo', v_vaga.codigo;
    END IF;
    IF NEW.status IN ('ativo', 'suspenso') AND NEW.data_encerramento IS NOT NULL
       AND NEW.data_encerramento <= public.data_local() THEN
      RAISE EXCEPTION 'Provimento em vigor com data de saída já passada (%): limpe a data ao reativar',
        to_char(NEW.data_encerramento, 'DD/MM/YYYY');
    END IF;
    IF NEW.data_encerramento IS NOT NULL AND NEW.data_encerramento < NEW.data_nomeacao THEN
      RAISE EXCEPTION 'Data de saída (%) anterior à de entrada (%)',
        to_char(NEW.data_encerramento, 'DD/MM/YYYY'), to_char(NEW.data_nomeacao, 'DD/MM/YYYY');
    END IF;
    IF v_vaga.data_extincao IS NOT NULL
       AND coalesce(NEW.data_encerramento, 'infinity'::date) > v_vaga.data_extincao THEN
      RAISE EXCEPTION 'A vaga % foi extinta em %: ocupação não pode passar dessa data',
        v_vaga.codigo, to_char(v_vaga.data_extincao, 'DD/MM/YYYY');
    END IF;
    -- o nome do ocupante só vai na mensagem para quem lê servidores (RH); o gabinete também grava provimentos
    SELECT p.data_nomeacao, p.data_encerramento,
           CASE WHEN public.can_access_module(auth.uid(), 'rh') THEN coalesce(s.nome_social, s.nome_completo) END AS nome
      INTO v_conf
      FROM public.provimentos p
      LEFT JOIN public.servidores s ON s.id = p.servidor_id
     WHERE p.vaga_id = NEW.vaga_id AND p.id <> NEW.id
       AND daterange(p.data_nomeacao, p.data_encerramento, '[)')
           && daterange(NEW.data_nomeacao, NEW.data_encerramento, '[)')
     ORDER BY p.data_nomeacao DESC
     LIMIT 1;
    IF FOUND THEN
      RAISE EXCEPTION 'A vaga % já está ocupada por % de % até %', v_vaga.codigo, coalesce(v_conf.nome, 'outro servidor'),
        to_char(v_conf.data_nomeacao, 'DD/MM/YYYY'),
        coalesce(to_char(v_conf.data_encerramento, 'DD/MM/YYYY'), 'hoje (sem data de saída)')
        USING ERRCODE = '23P01',
              HINT = 'Uma vaga tem uma pessoa por vez: registre a saída do ocupante antes de nomear outra pessoa nela.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: rh_tipo_protocolo(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rh_tipo_protocolo(p_entidade text) RETURNS text
    LANGUAGE sql IMMUTABLE
    SET search_path TO 'public'
    AS $$
  SELECT CASE
    WHEN p_entidade IN ('servidores', 'pre_cadastros', 'servidor_tags', 'servidor_tag_vinculos', 'dependentes_irrf',
                        'documentos_requerimento_servidor', 'adicionais_tempo_servico') THEN 'cadastro'
    WHEN p_entidade IN ('lotacoes', 'provimentos', 'vinculos_servidor', 'vinculos_funcionais', 'designacoes', 'cessoes',
                        'nomeacoes_chefe_unidade', 'memorandos_lotacao', 'historico_funcional', 'comissoes',
                        'comissoes_membros') THEN 'movimentacao'
    WHEN p_entidade = 'ferias_servidor' THEN 'ferias'
    WHEN p_entidade = 'licencas_afastamentos' THEN 'licenca'
    WHEN p_entidade = 'viagens_diarias' THEN 'viagem'
    WHEN p_entidade IN ('registros_ponto', 'frequencia_mensal', 'frequencia_fechamento', 'frequencia_arquivos',
                        'frequencia_pacotes', 'solicitacoes_abono', 'solicitacoes_ajuste_ponto', 'justificativas_ponto',
                        'banco_horas', 'lancamentos_banco_horas', 'servidor_regime') THEN 'frequencia'
    WHEN p_entidade IN ('folhas_pagamento', 'fichas_financeiras', 'itens_ficha_financeira', 'lancamentos_folha',
                        'consignacoes', 'pensoes_alimenticias', 'exportacoes_folha', 'eventos_esocial',
                        'remessas_bancarias', 'retornos_bancarios', 'itens_retorno_bancario',
                        'folha_historico_status') THEN 'folha'
    WHEN p_entidade IN ('documentos', 'portarias_servidor') THEN 'portaria'
    WHEN p_entidade = 'ocorrencias_servidor' THEN 'ocorrencia'
    WHEN p_entidade IN ('contracheque', 'relatorio_rh', 'exportacao_rh', 'arquivo_esocial', 'arquivo_cnab',
                        'trilha_auditoria') THEN 'consulta'
    WHEN p_entidade LIKE 'config\_%' OR p_entidade IN ('cargos', 'composicao_cargos', 'cargo_unidade_compatibilidade',
                        'tipos_abono', 'rubricas', 'rubricas_historico', 'parametros_folha', 'tabela_inss', 'tabela_irrf',
                        'feriados', 'dias_nao_uteis', 'regimes_trabalho', 'horarios_jornada', 'configuracao_jornada',
                        'bancos_cnab', 'contas_autarquia') THEN 'configuracao'
    ELSE 'alteracao'
  END;
$$;


--
-- Name: rh_transferir_servidor(uuid, uuid, date, text, text, text, text, date, text, date, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rh_transferir_servidor(p_servidor_id uuid, p_unidade_id uuid, p_data date, p_motivo text DEFAULT 'transferencia'::text, p_observacao text DEFAULT NULL::text, p_ato_tipo text DEFAULT NULL::text, p_ato_numero text DEFAULT NULL::text, p_ato_data date DEFAULT NULL::date, p_ato_doe_numero text DEFAULT NULL::text, p_ato_doe_data date DEFAULT NULL::date, p_gerar_minuta boolean DEFAULT true) RETURNS jsonb
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  v_servidor record;
  v_lot record;
  v_unid_ant text;
  v_unid_nova text;
  v_cargo_id uuid;
  v_cargo_nome text;
  v_nova_lotacao uuid;
  v_hist tipo_movimentacao_funcional;
  v_minuta_numero text;
  v_protocolo text;
  v_avisos text[] := '{}';
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_permission_code(auth.uid(), 'rh.lotacoes.editar') THEN
    RAISE EXCEPTION 'Sem permissão para transferir servidor' USING ERRCODE = '42501';
  END IF;
  IF p_motivo NOT IN ('transferencia', 'remocao') THEN
    RAISE EXCEPTION 'Motivo inválido: % (use transferencia ou remocao)', p_motivo;
  END IF;
  IF p_data IS NULL THEN RAISE EXCEPTION 'Informe a data da transferência'; END IF;

  SELECT id, nome_completo, situacao INTO v_servidor FROM public.servidores WHERE id = p_servidor_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Servidor não encontrado'; END IF;
  IF v_servidor.situacao IN ('exonerado', 'aposentado', 'falecido', 'inativo') THEN
    RAISE EXCEPTION 'Servidor % não pode ser transferido (situação %)', v_servidor.nome_completo, v_servidor.situacao;
  END IF;

  SELECT l.* INTO v_lot FROM public.lotacoes l
   WHERE l.servidor_id = p_servidor_id AND l.ativo ORDER BY l.data_inicio DESC LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Servidor sem lotação ativa: use a lotação/admissão, não a transferência';
  END IF;
  IF p_data < v_lot.data_inicio THEN
    RAISE EXCEPTION 'A data da transferência (%) é anterior ao início da lotação atual (%)', p_data, v_lot.data_inicio;
  END IF;
  IF v_lot.unidade_id = p_unidade_id THEN
    RAISE EXCEPTION 'O servidor já está lotado nessa unidade';
  END IF;

  SELECT nome INTO v_unid_nova FROM public.estrutura_organizacional WHERE id = p_unidade_id AND ativo;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unidade de destino não encontrada ou inativa'; END IF;
  SELECT nome INTO v_unid_ant FROM public.estrutura_organizacional WHERE id = v_lot.unidade_id;

  v_cargo_id := coalesce(v_lot.cargo_id,
                         (SELECT p.cargo_id FROM public.provimentos p
                           WHERE p.servidor_id = p_servidor_id AND p.status IN ('ativo', 'suspenso')
                           ORDER BY p.data_nomeacao DESC LIMIT 1));
  IF v_cargo_id IS NOT NULL THEN
    SELECT coalesce(sigla || ' - ', '') || nome INTO v_cargo_nome FROM public.cargos WHERE id = v_cargo_id;
    -- o cargo só pode ser lotado onde a composição do cargo permite (quando ela existe)
    IF EXISTS (SELECT 1 FROM public.composicao_cargos cc WHERE cc.cargo_id = v_cargo_id)
       AND NOT EXISTS (SELECT 1 FROM public.composicao_cargos cc WHERE cc.cargo_id = v_cargo_id AND cc.unidade_id = p_unidade_id) THEN
      RAISE EXCEPTION 'O cargo % não está previsto para a unidade % (composição do cargo)', v_cargo_nome, v_unid_nova;
    END IF;
  END IF;

  v_protocolo := public.rh_protocolo_atual('movimentacao',
    CASE p_motivo WHEN 'remocao' THEN 'Remoção' ELSE 'Transferência' END || ' de ' || v_servidor.nome_completo
      || ' de ' || coalesce(v_unid_ant, '?') || ' para ' || v_unid_nova || ' em ' || to_char(p_data, 'DD/MM/YYYY')
      || coalesce(' — ' || nullif(btrim(p_observacao), ''), ''),
    p_servidor_id, jsonb_build_object('motivo', p_motivo, 'unidade_anterior_id', v_lot.unidade_id,
                                      'unidade_nova_id', p_unidade_id, 'ato_numero', p_ato_numero));

  UPDATE public.lotacoes SET ativo = false, data_fim = p_data - 1,
         observacao = coalesce(p_observacao, 'Transferido em ' || p_data)
   WHERE id = v_lot.id;

  INSERT INTO public.lotacoes (servidor_id, unidade_id, cargo_id, tipo_lotacao, tipo_movimentacao, data_inicio, ativo,
                               funcao_exercida, observacao, ato_tipo, ato_numero, ato_data, ato_doe_numero, ato_doe_data)
  VALUES (p_servidor_id, p_unidade_id, v_cargo_id, coalesce(v_lot.tipo_lotacao, 'lotacao_interna'), p_motivo, p_data, true,
          v_lot.funcao_exercida, p_observacao, p_ato_tipo, p_ato_numero, p_ato_data, p_ato_doe_numero, p_ato_doe_data)
  RETURNING id INTO v_nova_lotacao;

  UPDATE public.provimentos SET unidade_id = p_unidade_id
   WHERE servidor_id = p_servidor_id AND status IN ('ativo', 'suspenso');
  UPDATE public.vinculos_servidor SET unidade_id = p_unidade_id
   WHERE servidor_id = p_servidor_id AND ativo;

  -- chefia de unidade local (nomeacoes_chefe_unidade) é de outra estrutura (unidades locais): não muda aqui
  IF EXISTS (SELECT 1 FROM public.nomeacoes_chefe_unidade WHERE servidor_id = p_servidor_id AND status = 'ativo') THEN
    v_avisos := array_append(v_avisos, 'O servidor tem chefia de unidade local ativa: confira se continua válida após a transferência');
  END IF;

  v_hist := CASE p_motivo WHEN 'remocao' THEN 'remocao' ELSE 'transferencia' END;
  INSERT INTO public.historico_funcional (servidor_id, tipo, data_evento, data_vigencia_inicio, cargo_anterior_id,
                                          cargo_novo_id, unidade_anterior_id, unidade_nova_id, portaria_numero,
                                          portaria_data, diario_oficial_numero, diario_oficial_data, descricao)
  VALUES (p_servidor_id, v_hist, p_data, p_data, v_cargo_id, v_cargo_id, v_lot.unidade_id, p_unidade_id, p_ato_numero,
          p_ato_data, p_ato_doe_numero, p_ato_doe_data,
          CASE p_motivo WHEN 'remocao' THEN 'Remoção' ELSE 'Transferência' END || ' de ' || coalesce(v_unid_ant, '?')
            || ' para ' || v_unid_nova || coalesce('. ' || p_observacao, ''));

  IF p_gerar_minuta THEN
    v_minuta_numero := public.gerar_numero_portaria(EXTRACT(YEAR FROM p_data)::int);
    INSERT INTO public.documentos (tipo, categoria, status, titulo, ementa, numero, data_documento, servidores_ids,
                                   cargo_id, unidade_id)
    VALUES ('portaria', 'pessoal', 'minuta',
            CASE p_motivo WHEN 'remocao' THEN 'Remoção - ' ELSE 'Transferência - ' END || v_servidor.nome_completo,
            CASE p_motivo WHEN 'remocao' THEN 'Remove ' ELSE 'Transfere ' END || v_servidor.nome_completo
              || coalesce(' (' || v_cargo_nome || ')', '') || ' da ' || coalesce(v_unid_ant, '?') || ' para a ' || v_unid_nova || '.',
            v_minuta_numero, p_data, ARRAY[p_servidor_id], v_cargo_id, p_unidade_id);
  END IF;

  -- UPDATE barrado pela RLS não dá erro: confere que a mudança valeu por inteiro (senão desfaz tudo)
  IF EXISTS (SELECT 1 FROM public.lotacoes WHERE id = v_lot.id AND ativo)
     OR EXISTS (SELECT 1 FROM public.provimentos WHERE servidor_id = p_servidor_id AND status IN ('ativo', 'suspenso')
                  AND unidade_id IS DISTINCT FROM p_unidade_id)
     OR EXISTS (SELECT 1 FROM public.vinculos_servidor WHERE servidor_id = p_servidor_id AND ativo
                  AND unidade_id IS DISTINCT FROM p_unidade_id) THEN
    RAISE EXCEPTION 'Sem permissão para atualizar todos os registros da transferência; nada foi gravado'
      USING ERRCODE = '42501';
  END IF;

  RETURN jsonb_build_object('protocolo', v_protocolo, 'lotacao_id', v_nova_lotacao, 'minuta_numero', v_minuta_numero,
                            'unidade_anterior_id', v_lot.unidade_id, 'avisos', to_jsonb(v_avisos));
END;
$$;


--
-- Name: rh_vaga_ocupante_atual(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rh_vaga_ocupante_atual(p_vaga_id uuid) RETURNS uuid
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_id uuid;
BEGIN
  -- o id do provimento só para quem já lê provimentos pela RLS (rh ou gabinete)
  IF NOT (public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'gabinete')) THEN
    RETURN NULL;
  END IF;
  SELECT p.id INTO v_id FROM public.provimentos p
   WHERE p.vaga_id = p_vaga_id
     AND p.data_nomeacao <= public.data_local()
     AND (p.data_encerramento IS NULL OR p.data_encerramento > public.data_local())
   ORDER BY p.data_nomeacao DESC
   LIMIT 1;
  RETURN v_id;
END;
$$;


--
-- Name: rh_vaga_situacao(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rh_vaga_situacao(p_vaga_id uuid) RETURNS text
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_extincao date;
BEGIN
  IF NOT public.is_active_user() THEN
    RETURN NULL;
  END IF;
  SELECT data_extincao INTO v_extincao FROM public.vagas_cargo WHERE id = p_vaga_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  IF v_extincao IS NOT NULL AND v_extincao <= public.data_local() THEN
    RETURN 'extinta';
  END IF;
  RETURN CASE WHEN EXISTS (SELECT 1 FROM public.provimentos p
                            WHERE p.vaga_id = p_vaga_id
                              AND p.data_nomeacao <= public.data_local()
                              AND (p.data_encerramento IS NULL OR p.data_encerramento > public.data_local()))
              THEN 'ocupada' ELSE 'livre' END;
END;
$$;


--
-- Name: rh_vagas_cargo_validar(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rh_vagas_cargo_validar() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF EXISTS (SELECT 1 FROM public.provimentos WHERE vaga_id = OLD.id) THEN
      RAISE EXCEPTION 'A vaga % tem histórico de ocupação e não pode ser apagada; registre a extinção', OLD.codigo;
    END IF;
    RETURN OLD;
  END IF;
  NEW.codigo := upper(btrim(NEW.codigo));
  -- sem data de criação: hoje no fuso do órgão (data_local não é executável pela API, por isso aqui e não no DEFAULT)
  NEW.data_criacao := coalesce(NEW.data_criacao, public.data_local());
  IF TG_OP = 'UPDATE' THEN
    IF NEW.cargo_id IS DISTINCT FROM OLD.cargo_id
       AND EXISTS (SELECT 1 FROM public.provimentos WHERE vaga_id = NEW.id) THEN
      RAISE EXCEPTION 'A vaga % já teve ocupantes e não pode mudar de cargo', NEW.codigo;
    END IF;
    IF NEW.codigo IS DISTINCT FROM OLD.codigo
       AND EXISTS (SELECT 1 FROM public.provimentos WHERE vaga_id = NEW.id) THEN
      RAISE EXCEPTION 'A vaga % já teve ocupantes e o código não pode mudar', OLD.codigo;
    END IF;
  END IF;
  IF NEW.data_extincao IS NOT NULL AND EXISTS (
       SELECT 1 FROM public.provimentos p
        WHERE p.vaga_id = NEW.id AND coalesce(p.data_encerramento, 'infinity'::date) > NEW.data_extincao) THEN
    RAISE EXCEPTION 'A vaga % tem ocupante depois de %: registre a saída antes de extinguir',
      NEW.codigo, to_char(NEW.data_extincao, 'DD/MM/YYYY');
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: salvar_chave_ia(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.salvar_chave_ia(p_chave text) RETURNS timestamp with time zone
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  v_id uuid;
  v_nome constant text := 'ia_chave_api';
  v_agora timestamptz := now();
BEGIN
  IF NOT public.pode_configurar_ia() THEN
    RAISE EXCEPTION 'Sem permissão para configurar a IA' USING ERRCODE = '42501';
  END IF;
  -- [[:graph:]] em todo o texto: sem espaço, quebra de linha nem caractere de controle (a chave vai
  -- num header HTTP; um \n embutido permitiria injetar header).
  IF p_chave IS NULL OR char_length(p_chave) < 8 OR char_length(p_chave) > 4096
     OR p_chave !~ '^[[:graph:]]+$' THEN
    RAISE EXCEPTION 'Chave inválida: de 8 a 4096 caracteres, sem espaço, quebra de linha ou caractere de controle' USING ERRCODE = '22023';
  END IF;

  -- Exige a configuração salva antes: trocar o provedor depois apagaria a chave (trigger acima).
  SELECT segredo_id INTO v_id FROM public.ia_config
   WHERE id AND provedor IS NOT NULL
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Salve o provedor da IA antes de gravar a chave' USING ERRCODE = '22023';
  END IF;

  -- vínculo apagado (troca de provedor/URL) mas segredo ainda no Vault: reaproveita pelo nome (que é único)
  IF v_id IS NULL THEN
    SELECT s.id INTO v_id FROM vault.secrets s WHERE s.name = v_nome;
  END IF;

  IF v_id IS NULL THEN
    v_id := vault.create_secret(p_chave, v_nome, 'Chave de API do provedor de IA');
  ELSE
    PERFORM vault.update_secret(v_id, p_chave);
  END IF;

  UPDATE public.ia_config
     SET segredo_id = v_id, segredo_final = right(p_chave, 4), segredo_atualizado_em = v_agora
   WHERE id;

  RETURN v_agora;
END;
$_$;


--
-- Name: salvar_segredo_envio(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.salvar_segredo_envio(p_canal text, p_segredo text) RETURNS timestamp with time zone
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_id uuid;
  v_nome text;
  v_agora timestamptz := now();
BEGIN
  IF NOT public.pode_configurar_envios() THEN
    RAISE EXCEPTION 'Sem permissão para configurar envios' USING ERRCODE = '42501';
  END IF;
  IF p_canal NOT IN ('email', 'whatsapp') THEN
    RAISE EXCEPTION 'Canal inválido' USING ERRCODE = '22023';
  END IF;
  IF p_segredo IS NULL OR char_length(btrim(p_segredo)) = 0 OR char_length(p_segredo) > 4096 THEN
    RAISE EXCEPTION 'Credencial vazia ou longa demais' USING ERRCODE = '22023';
  END IF;

  -- Exige a configuração salva antes: trocar o provedor depois apagaria a credencial (trigger acima).
  SELECT segredo_id INTO v_id FROM public.config_envio
   WHERE canal = p_canal AND provedor IS NOT NULL
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Salve a configuração do canal antes de gravar a credencial' USING ERRCODE = '22023';
  END IF;
  v_nome := 'config_envio_' || p_canal;

  -- linha recriada mas segredo antigo ainda no Vault: reaproveita pelo nome (que é único)
  IF v_id IS NULL THEN
    SELECT s.id INTO v_id FROM vault.secrets s WHERE s.name = v_nome;
  END IF;

  IF v_id IS NULL THEN
    v_id := vault.create_secret(p_segredo, v_nome, 'Credencial de envio (' || p_canal || ')');
  ELSE
    PERFORM vault.update_secret(v_id, p_segredo);
  END IF;

  UPDATE public.config_envio
     SET segredo_id = v_id, segredo_atualizado_em = v_agora
   WHERE canal = p_canal;

  RETURN v_agora;
END;
$$;


--
-- Name: saneamento_lancamento(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.saneamento_lancamento() RETURNS TABLE(servidor_id uuid, nome text, matricula text, situacao text, tem_login boolean, login_ativo boolean, lotacao_unidade_id uuid, lotacao_unidade_nome text, unidade_atual_id uuid, unidade_atual_nome text, problemas text[])
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_hoje date := public.data_local();
BEGIN
  IF auth.uid() IS NULL OR NOT (public.is_admin_user(auth.uid())
       OR (public.can_access_module(auth.uid(), 'rh') AND public.has_permission_code(auth.uid(), 'rh.auditoria.visualizar'))) THEN
    RAISE EXCEPTION 'saneamento_lancamento: exige o papel admin ou o módulo rh com rh.auditoria.visualizar'
      USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT x.sid, x.snome, x.smat, x.ssit, x.tem, x.ativo_login, x.luni, el.nome::text, x.uatual, ea.nome::text, x.probs
    FROM (
      SELECT s.id AS sid, s.nome_completo::text AS snome, s.matricula::text AS smat, s.situacao::text AS ssit,
             p.tem, p.ativo_login, lv.unidade_id AS luni, s.unidade_atual_id AS uatual,
             array_remove(ARRAY[
               CASE WHEN NOT p.tem THEN 'sem_login' END,
               CASE WHEN lv.unidade_id IS NULL THEN 'sem_lotacao' END,
               CASE WHEN lv.unidade_id IS NOT NULL AND s.unidade_atual_id IS DISTINCT FROM lv.unidade_id
                    THEN 'lotacao_divergente' END,
               CASE WHEN EXISTS (SELECT 1 FROM public.lotacao_vigente(s.id, v_hoje) a WHERE a.created_by_servidor_id = s.id)
                      OR EXISTS (SELECT 1 FROM public.designacoes d
                                  WHERE d.servidor_id = s.id AND d.status = 'aprovada' AND d.ativo IS NOT FALSE
                                    AND d.data_inicio <= v_hoje AND (d.data_fim IS NULL OR d.data_fim >= v_hoje)
                                    AND d.aprovado_por IS NOT NULL
                                    AND (d.aprovado_por = d.created_by
                                         OR EXISTS (SELECT 1 FROM public.profiles pa
                                                     WHERE pa.id = d.aprovado_por AND pa.servidor_id = s.id)))
                    THEN 'fundamento_autoconcedido' END], NULL) AS probs
        FROM public.servidores s
        CROSS JOIN LATERAL (
          SELECT EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.servidor_id = s.id) AS tem,
                 EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.servidor_id = s.id AND pr.is_active) AS ativo_login) p
        LEFT JOIN LATERAL (SELECT v.unidade_id FROM public.lotacao_vigente(s.id, v_hoje) v LIMIT 1) lv ON true
       WHERE s.ativo IS NOT FALSE AND s.situacao::text NOT IN ('exonerado', 'aposentado', 'falecido', 'inativo')
    ) x
    LEFT JOIN public.estrutura_organizacional el ON el.id = x.luni
    LEFT JOIN public.estrutura_organizacional ea ON ea.id = x.uatual
   WHERE cardinality(x.probs) > 0
   ORDER BY x.snome;
END;
$$;


--
-- Name: FUNCTION saneamento_lancamento(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.saneamento_lancamento() IS 'Servidores ativos sem login vinculado, sem lotação vigente, com unidade_atual_id divergente da lotação ou com fundamento autoconcedido (sem CPF)';


--
-- Name: servidores_proteger_cpf(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.servidores_proteger_cpf() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF coalesce(current_setting('role', true), 'none') IN ('anon', 'authenticated')
     AND NOT public.is_admin_user(auth.uid())
     AND lpad(regexp_replace(coalesce(NEW.cpf, ''), '[^0-9]', '', 'g'), 11, '0')
         IS DISTINCT FROM lpad(regexp_replace(coalesce(OLD.cpf, ''), '[^0-9]', '', 'g'), 11, '0') THEN
    RAISE EXCEPTION 'Ficha do servidor: o CPF só é alterado pelo papel admin (ele identifica o servidor nas aprovações)'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: set_reuniao_created_by(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_reuniao_created_by() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: sync_usuario_servidor_status(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_usuario_servidor_status() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Quando servidor é exonerado, inativo ou falecido, bloqueia o usuário
  IF NEW.situacao IN ('exonerado', 'inativo', 'falecido') 
     AND OLD.situacao NOT IN ('exonerado', 'inativo', 'falecido') THEN
    UPDATE public.profiles
    SET is_active = false,
        blocked_at = now(),
        blocked_reason = 'Servidor ' || NEW.situacao || ' em ' || now()::date
    WHERE servidor_id = NEW.id;
  -- Quando servidor é reativado
  ELSIF NEW.situacao = 'ativo' AND OLD.situacao IN ('exonerado', 'inativo') THEN
    UPDATE public.profiles
    SET is_active = true,
        blocked_at = NULL,
        blocked_reason = NULL
    WHERE servidor_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: transparencia_cargos_publicos(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.transparencia_cargos_publicos() RETURNS TABLE(cargo_id uuid, cargo text, simbolo text, categoria text, natureza text, nivel_hierarquico integer, vencimento numeric, lei_criacao_numero text, lei_criacao_data date, unidade_id uuid, unidade text, unidade_sigla text, unidade_superior text, diretoria text, diretoria_tipo text, vaga integer, vagas_previstas integer, vagas_ocupadas integer, ocupante text, atualizado_em timestamp with time zone)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  WITH RECURSIVE
  cargos_pub AS (
    SELECT c.*
    FROM public.cargos c
    WHERE coalesce(c.ativo, true)
      AND (c.categoria IN ('comissionado', 'funcao_gratificada') OR c.natureza = 'comissionado')
  ),
  -- só o nome do ocupante sai daqui (nunca CPF, matrícula, indicação ou contato)
  ocupantes AS (
    SELECT vs.cargo_id, vs.unidade_id,
           coalesce(nullif(btrim(s.nome_social), ''), s.nome_completo) AS nome
    FROM public.vinculos_servidor vs
    JOIN cargos_pub c ON c.id = vs.cargo_id
    JOIN public.servidores s ON s.id = vs.servidor_id
    WHERE vs.ativo
  ),
  composicao AS (
    SELECT cc.cargo_id, cc.unidade_id, coalesce(cc.quantidade_vagas, 0) AS vagas
    FROM public.composicao_cargos cc
    JOIN cargos_pub c ON c.id = cc.cargo_id
    JOIN public.estrutura_organizacional eo ON eo.id = cc.unidade_id
    WHERE coalesce(eo.ativo, true)
  ),
  grupos AS (
    SELECT g.cargo_id, g.unidade_id, sum(g.vagas)::integer AS vagas
    FROM (
      -- vagas previstas por unidade
      SELECT cp.cargo_id, cp.unidade_id, cp.vagas FROM composicao cp
      UNION ALL
      -- cargo sem composição: vagas do cargo sem unidade (descontados os ocupantes já lotados numa unidade)
      SELECT c.id, NULL::uuid,
             greatest(coalesce(c.quantidade_vagas, 0)
                      - (SELECT count(*) FROM ocupantes o WHERE o.cargo_id = c.id AND o.unidade_id IS NOT NULL), 0)::integer
      FROM cargos_pub c
      WHERE NOT EXISTS (SELECT 1 FROM composicao cp WHERE cp.cargo_id = c.id)
      UNION ALL
      -- ocupante numa unidade sem vaga prevista: ganha a própria linha
      SELECT DISTINCT o.cargo_id, o.unidade_id, 0
      FROM ocupantes o
      WHERE NOT EXISTS (SELECT 1 FROM composicao cp
                        WHERE cp.cargo_id = o.cargo_id AND cp.unidade_id IS NOT DISTINCT FROM o.unidade_id)
    ) g
    GROUP BY g.cargo_id, g.unidade_id
  ),
  ocupantes_num AS (
    SELECT o.cargo_id, o.unidade_id, o.nome,
           row_number() OVER (PARTITION BY o.cargo_id, o.unidade_id ORDER BY o.nome)::integer AS posicao,
           count(*) OVER (PARTITION BY o.cargo_id, o.unidade_id)::integer AS quantidade
    FROM ocupantes o
  ),
  -- sobe a hierarquia até a primeira diretoria (ou até a raiz); profundidade limita ciclo acidental
  subida AS (
    SELECT eo.id AS unidade_id, eo.id AS atual_id, eo.superior_id, eo.tipo, 0 AS profundidade
    FROM public.estrutura_organizacional eo
    WHERE eo.id IN (SELECT g.unidade_id FROM grupos g WHERE g.unidade_id IS NOT NULL)
    UNION ALL
    SELECT s.unidade_id, p.id, p.superior_id, p.tipo, s.profundidade + 1
    FROM subida s
    JOIN public.estrutura_organizacional p ON p.id = s.superior_id
    WHERE s.tipo <> 'diretoria' AND s.profundidade < 20
  ),
  diretorias AS (
    SELECT DISTINCT ON (s.unidade_id) s.unidade_id, s.atual_id AS diretoria_id
    FROM subida s
    ORDER BY s.unidade_id, s.profundidade DESC
  )
  SELECT c.id,
         c.nome,
         c.sigla,
         c.categoria::text,
         c.natureza::text,
         c.nivel_hierarquico,
         c.vencimento_base,
         c.lei_criacao_numero,
         c.lei_criacao_data,
         u.id,
         u.nome,
         u.sigla,
         coalesce(nullif(sup.sigla, ''), sup.nome),
         coalesce(nullif(d.sigla, ''), d.nome),
         d.tipo::text,
         v.n,
         g.vagas,
         coalesce(oq.quantidade, 0),
         o.nome,
         c.updated_at
  FROM grupos g
  JOIN cargos_pub c ON c.id = g.cargo_id
  LEFT JOIN public.estrutura_organizacional u ON u.id = g.unidade_id
  LEFT JOIN public.estrutura_organizacional sup ON sup.id = u.superior_id
  LEFT JOIN diretorias dr ON dr.unidade_id = g.unidade_id
  LEFT JOIN public.estrutura_organizacional d ON d.id = dr.diretoria_id
  LEFT JOIN LATERAL (
    SELECT max(onum.quantidade) AS quantidade FROM ocupantes_num onum
    WHERE onum.cargo_id = g.cargo_id AND onum.unidade_id IS NOT DISTINCT FROM g.unidade_id
  ) oq ON true
  CROSS JOIN LATERAL generate_series(1, greatest(g.vagas, coalesce(oq.quantidade, 0))) AS v(n)
  LEFT JOIN ocupantes_num o
         ON o.cargo_id = g.cargo_id AND o.unidade_id IS NOT DISTINCT FROM g.unidade_id AND o.posicao = v.n
  ORDER BY c.vencimento_base DESC NULLS LAST, c.nome, u.nome NULLS LAST, v.n;
$$;


--
-- Name: FUNCTION transparencia_cargos_publicos(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.transparencia_cargos_publicos() IS 'Exceção pública intencional (LAI, transparência ativa): executável por anon. Quadro de cargos em comissão e funções gratificadas ativos, uma linha por vaga: de cargos id, nome, sigla (símbolo), categoria, natureza, nível hierárquico, vencimento_base, número e data da lei de criação e updated_at; nome, sigla, unidade superior e diretoria da unidade (composicao_cargos/estrutura_organizacional); vagas previstas e ocupadas; e o nome do ocupante (vínculo ativo em vinculos_servidor; nome social quando houver). Nunca CPF, matrícula, indicação, contato, endereço, dado bancário nem remuneração individual.';


--
-- Name: transparencia_execucao_orcamentaria(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.transparencia_execucao_orcamentaria() RETURNS TABLE(exercicio integer, valor_inicial numeric, valor_atual numeric, valor_empenhado numeric, valor_liquidado numeric, valor_pago numeric, quantidade_dotacoes bigint)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT d.exercicio,
         coalesce(sum(d.valor_inicial), 0),
         coalesce(sum(d.valor_atual), 0),
         coalesce(sum(d.valor_empenhado), 0),
         coalesce(sum(d.valor_liquidado), 0),
         coalesce(sum(d.valor_pago), 0),
         count(*)
  FROM public.dotacoes_orcamentarias d
  GROUP BY d.exercicio
  ORDER BY d.exercicio DESC;
$$;


--
-- Name: FUNCTION transparencia_execucao_orcamentaria(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.transparencia_execucao_orcamentaria() IS 'Exceção pública intencional (LAI, transparência ativa): executável por anon. Expõe só totais de dotacoes_orcamentarias por exercício (valor_inicial, valor_atual, valor_empenhado, valor_liquidado, valor_pago, quantidade de dotações).';


--
-- Name: transparencia_licitacoes(integer, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.transparencia_licitacoes(p_ano integer DEFAULT NULL::integer, p_modalidade text DEFAULT NULL::text) RETURNS TABLE(id uuid, numero_processo text, ano integer, modalidade text, objeto text, fase_atual text, valor_estimado numeric, data_abertura date, data_homologacao date, unidade_requisitante text, vencedor_razao_social text, vencedor_cnpj_parcial text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  WITH vencedores AS (
    SELECT pr.processo_id, pr.fornecedor_id
    FROM public.propostas_licitacao pr
    WHERE pr.vencedora AND NOT coalesce(pr.desclassificada, false)
    UNION
    SELECT il.processo_id, il.vencedor_id
    FROM public.itens_licitacao il
    WHERE il.vencedor_id IS NOT NULL
  )
  SELECT p.id,
         p.numero_processo::text,
         p.ano,
         p.modalidade::text,
         p.objeto,
         p.fase_atual::text,
         p.valor_estimado,
         p.data_abertura,
         NULL::date,
         eo.nome,
         v.razao_social::text,
         -- CNPJ mascarado como a tela fazia: 8 primeiros dígitos, ****, 2 últimos (nunca CPF)
         CASE WHEN length(v.doc) = 14 THEN left(v.doc, 8) || '****' || substr(v.doc, 13) END
  FROM public.processos_licitatorios p
  LEFT JOIN public.estrutura_organizacional eo ON eo.id = p.unidade_requisitante_id
  -- LGPD: só vencedor pessoa jurídica; se o único vencedor é pessoa física, nome e documento saem NULL
  LEFT JOIN LATERAL (
    SELECT f.razao_social, regexp_replace(f.cpf_cnpj, '\D', '', 'g') AS doc
    FROM vencedores vc
    JOIN public.fornecedores f ON f.id = vc.fornecedor_id
    WHERE vc.processo_id = p.id AND f.tipo_pessoa = 'PJ'
    ORDER BY f.razao_social
    LIMIT 1
  ) v ON p.fase_atual IN ('homologacao', 'adjudicacao', 'contratacao', 'encerrado')
  -- Fase interna (antes da publicação do edital) não é pública: o valor estimado pode ser
  -- sigiloso até o julgamento (Lei 14.133, art. 24). O vencedor só aparece após a homologação.
  WHERE p.fase_atual NOT IN ('planejamento', 'elaboracao', 'edital')
    AND (p_ano IS NULL OR p.ano = p_ano)
    AND (p_modalidade IS NULL OR p.modalidade::text = p_modalidade)
  ORDER BY p.ano DESC, p.numero_processo DESC;
$$;


--
-- Name: FUNCTION transparencia_licitacoes(p_ano integer, p_modalidade text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.transparencia_licitacoes(p_ano integer, p_modalidade text) IS 'Exceção pública intencional (LAI, transparência ativa): executável por anon. Expõe de processos_licitatorios id, numero_processo, ano, modalidade, objeto, fase_atual, valor_estimado, data_abertura, data_homologacao (NULL: a tabela não tem a coluna), nome da unidade requisitante e, do vencedor pessoa jurídica, razão social e CNPJ mascarado (8 dígitos + **** + 2). Processos na fase interna (planejamento, elaboração, edital) ou sem fase não aparecem (valor estimado pode ser sigiloso, Lei 14.133 art. 24); o vencedor só aparece a partir da homologação; vencedor pessoa física nunca é exposto: sem vencedor PJ, razão social e CNPJ saem NULL.';


--
-- Name: transparencia_patrimonio(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.transparencia_patrimonio() RETURNS TABLE(id uuid, numero_patrimonio text, descricao text, marca text, modelo text, situacao text, estado_conservacao text, valor_aquisicao numeric, data_aquisicao date, unidade_local_nome text, unidade_local_municipio text, unidade_organizacional_nome text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT b.id,
         b.numero_patrimonio::text,
         b.descricao::text,
         b.marca::text,
         b.modelo::text,
         b.situacao::text,
         b.estado_conservacao::text,
         b.valor_aquisicao,
         b.data_aquisicao,
         ul.nome_unidade,
         ul.municipio,
         eo.nome
  FROM public.bens_patrimoniais b
  LEFT JOIN public.unidades_locais ul ON ul.id = b.unidade_local_id
  LEFT JOIN public.estrutura_organizacional eo ON eo.id = b.unidade_id
  ORDER BY b.numero_patrimonio;
$$;


--
-- Name: FUNCTION transparencia_patrimonio(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.transparencia_patrimonio() IS 'Exceção pública intencional (LAI, transparência ativa): executável por anon. Expõe de bens_patrimoniais id, numero_patrimonio, descricao, marca, modelo, situacao, estado_conservacao, valor_aquisicao, data_aquisicao, nome e município da unidade local e nome da unidade organizacional. Nunca responsável nem dado pessoal.';


--
-- Name: trigger_cessao_atualiza_situacao(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trigger_cessao_atualiza_situacao() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  PERFORM fn_atualizar_situacao_servidor(NEW.servidor_id);
  RETURN NEW;
END;
$$;


--
-- Name: trigger_ferias_atualiza_situacao(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trigger_ferias_atualiza_situacao() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  PERFORM fn_atualizar_situacao_servidor(NEW.servidor_id);
  RETURN NEW;
END;
$$;


--
-- Name: trigger_licenca_atualiza_situacao(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trigger_licenca_atualiza_situacao() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  PERFORM fn_atualizar_situacao_servidor(NEW.servidor_id);
  RETURN NEW;
END;
$$;


--
-- Name: trigger_provimento_atualiza_situacao(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trigger_provimento_atualiza_situacao() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  PERFORM fn_atualizar_situacao_servidor(NEW.servidor_id);
  RETURN NEW;
END;
$$;


--
-- Name: trigger_set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trigger_set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: trilha_atribuir_protocolo(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trilha_atribuir_protocolo() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.protocolo := public.rh_protocolo_atual(
    public.rh_tipo_protocolo(NEW.entity_type),
    CASE NEW.action::text
      WHEN 'create' THEN 'Inclusão'
      WHEN 'update' THEN 'Alteração'
      WHEN 'delete' THEN 'Exclusão'
      WHEN 'view' THEN 'Consulta'
      WHEN 'export' THEN 'Exportação'
      WHEN 'download' THEN 'Download/impressão'
      ELSE initcap(NEW.action::text)
    END || ' em ' || coalesce(NEW.entity_type, '(sem entidade)'),
    NULL, jsonb_build_object('automatico', true));
  RETURN NEW;
END;
$$;


--
-- Name: trilha_completar_contexto(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trilha_completar_contexto() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  c jsonb := public.trilha_contexto();
  v_srv uuid;
  v_nome text;
  v_mat text;
BEGIN
  NEW.transacao := coalesce(NEW.transacao, txid_current());
  NEW.origem := coalesce(NEW.origem, c ->> 'origem');
  IF NEW.user_id IS NOT NULL THEN
    IF NEW.user_id = (c ->> 'user_id')::uuid THEN
      IF NEW.servidor_id IS NULL THEN
        NEW.servidor_id := (c ->> 'servidor_id')::uuid;
        NEW.servidor_nome := coalesce(NEW.servidor_nome, c ->> 'servidor_nome');
        NEW.servidor_matricula := coalesce(NEW.servidor_matricula, c ->> 'servidor_matricula');
      END IF;
      NEW.role_at_time := coalesce(NEW.role_at_time, (c ->> 'papel')::public.app_role);
      NEW.org_unit_id := coalesce(NEW.org_unit_id, (c ->> 'unidade_id')::uuid);
    ELSE
      -- outro usuário (ex.: Edge Function que grava em nome do administrador que a chamou)
      IF NEW.servidor_id IS NULL THEN
        SELECT p.servidor_id, s.nome_completo::text, s.matricula::text INTO v_srv, v_nome, v_mat
          FROM public.profiles p LEFT JOIN public.servidores s ON s.id = p.servidor_id
         WHERE p.id = NEW.user_id;
        NEW.servidor_id := v_srv;
        NEW.servidor_nome := coalesce(NEW.servidor_nome, v_nome);
        NEW.servidor_matricula := coalesce(NEW.servidor_matricula, v_mat);
      END IF;
      IF NEW.role_at_time IS NULL THEN
        SELECT ur.role INTO NEW.role_at_time FROM public.user_roles ur
         WHERE ur.user_id = NEW.user_id ORDER BY (ur.role = 'admin') DESC LIMIT 1;
      END IF;
      IF NEW.org_unit_id IS NULL THEN
        SELECT lv.unidade_id INTO NEW.org_unit_id
          FROM public.profiles p CROSS JOIN LATERAL public.lotacao_vigente(p.servidor_id) lv
         WHERE p.id = NEW.user_id AND p.servidor_id IS NOT NULL
         LIMIT 1;
      END IF;
    END IF;
  END IF;
  NEW.ip_address := coalesce(NEW.ip_address, (c ->> 'ip')::inet);
  NEW.user_agent := coalesce(NEW.user_agent, c ->> 'agente');
  RETURN NEW;
END;
$$;


--
-- Name: trilha_contexto(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trilha_contexto() RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_papel_sessao text := coalesce(current_setting('role', true), 'none');
  v_chave text;
  v_cache text := current_setting('trilha.contexto', true);
  v_ctx jsonb;
  v_srv uuid;
  v_nome text;
  v_mat text;
  v_papel text;
  v_unid uuid;
  r record;
BEGIN
  v_chave := coalesce(v_uid::text, '-') || '|' || v_papel_sessao || '|'
             || md5(coalesce(current_setting('request.headers', true), ''));
  IF v_cache IS NOT NULL AND v_cache <> '' THEN
    v_ctx := v_cache::jsonb;
    IF v_ctx ->> 'k' = v_chave THEN
      RETURN v_ctx;
    END IF;
  END IF;
  IF v_uid IS NOT NULL THEN
    SELECT p.servidor_id, s.nome_completo::text, s.matricula::text INTO v_srv, v_nome, v_mat
      FROM public.profiles p LEFT JOIN public.servidores s ON s.id = p.servidor_id
     WHERE p.id = v_uid;
    SELECT ur.role::text INTO v_papel FROM public.user_roles ur
     WHERE ur.user_id = v_uid ORDER BY (ur.role = 'admin') DESC LIMIT 1;
    IF v_srv IS NOT NULL THEN
      SELECT lv.unidade_id INTO v_unid FROM public.lotacao_vigente(v_srv) lv LIMIT 1;
    END IF;
  END IF;
  SELECT * INTO r FROM public.trilha_contexto_requisicao();
  v_ctx := jsonb_build_object(
    'k', v_chave,
    'user_id', v_uid,
    'servidor_id', v_srv,
    'servidor_nome', v_nome,
    'servidor_matricula', v_mat,
    'origem', CASE
                WHEN v_uid IS NULL AND v_papel_sessao IN ('anon', 'authenticated') THEN 'anonimo'
                WHEN v_uid IS NULL THEN 'sistema'
                WHEN v_srv IS NULL THEN 'usuario_sem_vinculo'
                ELSE 'usuario'
              END,
    'papel', v_papel,
    'unidade_id', v_unid,
    'ip', r.ip::text,
    'agente', r.agente);
  PERFORM set_config('trilha.contexto', v_ctx::text, true);
  RETURN v_ctx;
END;
$$;


--
-- Name: trilha_contexto_invalidar(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trilha_contexto_invalidar() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  PERFORM set_config('trilha.contexto', '', true);
  RETURN NULL;
END;
$$;


--
-- Name: trilha_contexto_requisicao(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trilha_contexto_requisicao(OUT ip inet, OUT agente text) RETURNS record
    LANGUAGE plpgsql STABLE
    SET search_path TO 'public'
    AS $$
DECLARE
  bruto text := current_setting('request.headers', true);
  h jsonb;
  v text;
  itens text[];
BEGIN
  IF bruto IS NULL OR btrim(bruto) = '' THEN
    RETURN;
  END IF;
  BEGIN
    h := bruto::jsonb;
    IF jsonb_typeof(h) <> 'object' THEN
      RETURN;
    END IF;
    agente := left(h ->> 'user-agent', 500);
    v := nullif(btrim(h ->> 'x-real-ip'), '');
    IF v IS NULL THEN
      itens := string_to_array(h ->> 'x-forwarded-for', ',');
      v := nullif(btrim(itens[coalesce(array_length(itens, 1), 0)]), '');
    END IF;
    ip := v::inet;
  EXCEPTION WHEN OTHERS THEN
    ip := NULL;
  END;
END;
$$;


--
-- Name: trilha_imutavel(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trilha_imutavel() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  v_pai_existe boolean;
BEGIN
  IF current_setting('trilha.expurgo', true) = 'autorizado' THEN
    RETURN CASE TG_OP WHEN 'DELETE' THEN OLD WHEN 'UPDATE' THEN NEW ELSE NULL END;
  END IF;
  IF TG_OP = 'DELETE' AND TG_NARGS = 2 AND (to_jsonb(OLD) ->> TG_ARGV[0]) IS NOT NULL THEN
    EXECUTE format('SELECT EXISTS (SELECT 1 FROM public.%I WHERE id = $1)', TG_ARGV[1])
      INTO v_pai_existe USING (to_jsonb(OLD) ->> TG_ARGV[0])::uuid;
    IF NOT v_pai_existe THEN
      RETURN OLD;
    END IF;
  END IF;
  RAISE EXCEPTION 'Trilha de auditoria imutável: % em % recusado', TG_OP, TG_TABLE_NAME
    USING ERRCODE = '42501',
          HINT = 'Registros de auditoria não são alterados nem apagados (migração 20261011000000).';
END;
$_$;


--
-- Name: trilha_mascarar(text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trilha_mascarar(p_tabela text, p_linha jsonb) RETURNS jsonb
    LANGUAGE plpgsql STABLE
    SET search_path TO 'public'
    AS $$
DECLARE
  s record;
  v jsonb := p_linha;
BEGIN
  IF p_linha IS NULL OR jsonb_typeof(p_linha) <> 'object' THEN
    RETURN p_linha;
  END IF;
  FOR s IN SELECT m.coluna, m.tratamento FROM public.audit_colunas_sensiveis m WHERE m.tabela = p_tabela LOOP
    IF v ? s.coluna AND jsonb_typeof(v -> s.coluna) <> 'null' THEN
      v := jsonb_set(v, ARRAY[s.coluna], CASE WHEN s.tratamento = 'parcial'
                                              THEN to_jsonb(public.mascarar_parcial(v ->> s.coluna))
                                              ELSE to_jsonb('[protegido]'::text) END);
    END IF;
  END LOOP;
  RETURN v;
END;
$$;


--
-- Name: trilha_storage(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trilha_storage() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  v_novo jsonb;
  v_velho jsonb;
  v_obj jsonb;
  v_acao text;
  v_campos text[];
  v_bucket text;
  v_nome text;
  v_id uuid;
  v_alvo uuid;
  v_pasta text;
  v_tamanho text;
  v_meta jsonb;
  c jsonb;
BEGIN
  IF TG_OP <> 'DELETE' THEN v_novo := to_jsonb(NEW); END IF;
  IF TG_OP <> 'INSERT' THEN v_velho := to_jsonb(OLD); END IF;
  v_obj := coalesce(v_novo, v_velho);

  IF TG_OP = 'INSERT' THEN
    v_acao := 'upload';
  ELSIF TG_OP = 'UPDATE' THEN
    v_acao := 'update';
    SELECT array_agg(k ORDER BY k) INTO v_campos
      FROM unnest(ARRAY['bucket_id', 'name', 'owner', 'owner_id', 'version', 'metadata', 'user_metadata']) AS k
     WHERE (v_novo -> k) IS DISTINCT FROM (v_velho -> k);
    IF v_campos IS NULL THEN
      RETURN NULL;   -- só carimbos (updated_at, last_accessed_at)
    END IF;
    IF v_campos = ARRAY['metadata'] AND coalesce(jsonb_typeof(v_velho -> 'metadata'), 'null') = 'null' THEN
      RETURN NULL;   -- a Storage API completou os metadados do upload que acabou de gravar
    END IF;
  ELSE
    v_acao := 'delete';
  END IF;

  v_bucket := v_obj ->> 'bucket_id';
  v_nome := v_obj ->> 'name';
  IF (v_obj ->> 'id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    v_id := (v_obj ->> 'id')::uuid;
  END IF;

  -- servidor a que o arquivo pertence (não é quem agiu: esse vai em servidor_id)
  IF v_nome IS NOT NULL THEN
    IF v_bucket = 'frequencias' THEN
      SELECT fa.servidor_id INTO v_alvo FROM public.frequencia_arquivos fa
       WHERE fa.arquivo_path = v_nome AND fa.servidor_id IS NOT NULL LIMIT 1;
    ELSIF v_bucket = 'documentos-requerimento' THEN
      v_pasta := split_part(v_nome, '/', 1);
      IF v_pasta ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        SELECT s.id INTO v_alvo FROM public.servidores s WHERE s.id = v_pasta::uuid;
      END IF;
    END IF;
  END IF;

  v_tamanho := v_obj -> 'metadata' ->> 'size';
  v_meta := jsonb_build_object(
      'trigger', true, 'operation', TG_OP, 'table', 'storage.objects', 'fonte', 'storage',
      'chave', public.trilha_storage_chave(v_bucket, v_nome),
      'objeto_id', v_id)
    || jsonb_strip_nulls(jsonb_build_object(
      'tamanho', CASE WHEN v_tamanho ~ '^[0-9]{1,18}$' THEN v_tamanho::bigint END,
      'tipo_conteudo', CASE WHEN lower(v_obj -> 'metadata' ->> 'mimetype') ~ '^[a-z0-9.+-]{1,50}/[a-z0-9.+-]{1,50}$'
                            THEN lower(v_obj -> 'metadata' ->> 'mimetype') END,
      'operacao_storage', left(nullif(current_setting('storage.operation', true), ''), 60),
      'servidor_alvo_id', v_alvo));
  IF TG_OP = 'UPDATE' AND ('bucket_id' = ANY (v_campos) OR 'name' = ANY (v_campos)) THEN
    v_meta := v_meta || jsonb_build_object('anterior',
      public.trilha_storage_chave(v_velho ->> 'bucket_id', v_velho ->> 'name'));
  END IF;

  c := public.trilha_contexto();

  INSERT INTO public.audit_logs (
    action, entity_type, entity_id, module_name, user_id, description, metadata, campos_alterados, origem,
    servidor_id, servidor_nome, servidor_matricula, role_at_time, org_unit_id, ip_address, user_agent, transacao
  ) VALUES (
    v_acao::public.audit_action, 'storage.' || coalesce(v_bucket, '?'), v_id, coalesce(TG_ARGV[0], 'rh'),
    (c ->> 'user_id')::uuid,
    CASE v_acao WHEN 'upload' THEN 'Arquivo enviado ao bucket '
                WHEN 'update' THEN 'Arquivo substituído ou movido no bucket '
                ELSE 'Arquivo excluído do bucket ' END || coalesce(v_bucket, '?'),
    v_meta, v_campos, c ->> 'origem', (c ->> 'servidor_id')::uuid, c ->> 'servidor_nome', c ->> 'servidor_matricula',
    (c ->> 'papel')::public.app_role, (c ->> 'unidade_id')::uuid, (c ->> 'ip')::inet, c ->> 'agente', txid_current()
  );
  RETURN NULL;
END;
$_$;


--
-- Name: FUNCTION trilha_storage(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.trilha_storage() IS 'Trigger de storage.objects: gravação, troca e exclusão de arquivo viram linha em audit_logs (módulo do argumento), sem conteúdo nem caminho com dado pessoal';


--
-- Name: trilha_storage_chave(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trilha_storage_chave(p_bucket text, p_nome text) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    SET search_path TO 'public'
    AS $_$
DECLARE
  u constant text := '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';
  ext constant text := '(pdf|png|jpe?g|webp|zip|docx?|odt|xlsx?|csv)';
  v jsonb;
BEGIN
  v := jsonb_build_object('bucket', p_bucket);
  IF p_nome IS NULL THEN
    RETURN v || jsonb_build_object('caminho', NULL);
  END IF;
  v := v || jsonb_build_object(
    'caminho', CASE WHEN p_nome ~* ('^((' || u || '|[0-9]{4}-[0-9]{2})/)*' || u || '(\.' || ext || ')?$')
                    THEN p_nome END,
    'caminho_sha256', encode(sha256(convert_to(p_nome, 'UTF8')), 'hex'));
  IF p_nome ~ '^[0-9]{4}-[0-9]{2}/' THEN
    v := v || jsonb_build_object('periodo', left(p_nome, 7));
  END IF;
  IF p_nome ~* ('\.' || ext || '$') THEN
    v := v || jsonb_build_object('extensao', lower(substring(p_nome FROM ('(?i)\.' || ext || '$'))));
  END IF;
  RETURN v;
END;
$_$;


--
-- Name: FUNCTION trilha_storage_chave(p_bucket text, p_nome text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.trilha_storage_chave(p_bucket text, p_nome text) IS 'Chave de um objeto do Storage para a trilha: bucket, caminho só quando é feito de uuid/AAAA-MM com extensão da lista fechada, sha256 do caminho, período e extensão';


--
-- Name: unidade_e_superiores(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.unidade_e_superiores(p_unidade_id uuid) RETURNS uuid[]
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v uuid[];
BEGIN
  IF p_unidade_id IS NULL THEN
    RETURN '{}'::uuid[];
  END IF;
  WITH RECURSIVE s(id, superior_id, n) AS (
    SELECT e.id, e.superior_id, 1 FROM public.estrutura_organizacional e WHERE e.id = p_unidade_id
    UNION
    SELECT e.id, e.superior_id, s.n + 1 FROM public.estrutura_organizacional e JOIN s ON e.id = s.superior_id WHERE s.n < 50
  )
  SELECT array_agg(DISTINCT s.id) INTO v FROM s;
  RETURN coalesce(v, ARRAY[p_unidade_id]);
END;
$$;


--
-- Name: update_approval_status_history(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_approval_status_history() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_history := COALESCE(OLD.status_history, '[]'::jsonb) || 
      jsonb_build_object(
        'from', OLD.status,
        'to', NEW.status,
        'changed_at', NOW(),
        'changed_by', auth.uid()
      );
    NEW.updated_at := NOW();
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: update_conteudo_rascunho_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_conteudo_rascunho_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  NEW.atualizado_por = auth.uid();
  RETURN NEW;
END;
$$;


--
-- Name: update_dados_oficiais_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_dados_oficiais_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  NEW.ultima_alteracao_em = now();
  NEW.ultima_alteracao_por = auth.uid();
  RETURN NEW;
END;
$$;


--
-- Name: update_gestores_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_gestores_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: user_context(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.user_context() RETURNS TABLE(is_active boolean, roles public.app_role[], modules public.app_module[])
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT 
    COALESCE(p.is_active, false),
    COALESCE(array_agg(DISTINCT ur.role) FILTER (WHERE ur.role IS NOT NULL), '{}'::public.app_role[]),
    COALESCE(array_agg(DISTINCT um.module) FILTER (WHERE um.module IS NOT NULL), '{}'::public.app_module[])
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON ur.user_id = p.id
  LEFT JOIN public.user_modules um ON um.user_id = p.id
  WHERE p.id = auth.uid()
  GROUP BY p.is_active;
$$;


--
-- Name: user_has_unit_access(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.user_has_unit_access(_user_id uuid, _unidade_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_org_units
    WHERE user_id = _user_id AND unidade_id = _unidade_id
  ) OR public.has_role(_user_id, 'admin'::app_role)
$$;


--
-- Name: usuario_eh_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.usuario_eh_admin(check_user_id uuid DEFAULT NULL::uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT public.is_admin_user(COALESCE(check_user_id, auth.uid()));
$$;


--
-- Name: usuario_eh_super_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.usuario_eh_super_admin(check_user_id uuid DEFAULT NULL::uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT public.is_admin_user(COALESCE(check_user_id, auth.uid()));
$$;


--
-- Name: usuario_pode_fechar_folha(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.usuario_pode_fechar_folha(p_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT public.usuario_tem_permissao(p_user_id, 'rh.admin')
    OR public.usuario_eh_admin(p_user_id);
$$;


--
-- Name: usuario_pode_reabrir_folha(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.usuario_pode_reabrir_folha(p_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT public.usuario_eh_admin(p_user_id);
$$;


--
-- Name: usuario_tem_acesso_modulo(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.usuario_tem_acesso_modulo(_user_id uuid, _codigo_modulo text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT 
    -- Super admin tem acesso total
    CASE WHEN public.usuario_eh_admin(_user_id) THEN true
    -- Usuário sem restrição tem acesso total
    WHEN NOT COALESCE((SELECT restringir_modulos FROM public.profiles WHERE id = _user_id), false) THEN true
    -- Usuário com restrição: verificar se módulo está autorizado
    ELSE EXISTS (
      SELECT 1 
      FROM public.usuario_modulos um
      JOIN public.modulos_sistema ms ON ms.id = um.modulo_id
      WHERE um.user_id = _user_id 
        AND um.ativo = true
        AND ms.codigo = _codigo_modulo
        AND ms.ativo = true
    )
    END
$$;


--
-- Name: usuario_tem_acesso_rota(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.usuario_tem_acesso_rota(_user_id uuid, _pathname text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT 
    -- Super admin tem acesso total
    CASE WHEN public.usuario_eh_admin(_user_id) THEN true
    -- Usuário sem restrição tem acesso total
    WHEN NOT COALESCE((SELECT restringir_modulos FROM public.profiles WHERE id = _user_id), false) THEN true
    -- Usuário com restrição: verificar se algum módulo autorizado cobre a rota
    ELSE EXISTS (
      SELECT 1 
      FROM public.usuario_modulos um
      JOIN public.modulos_sistema ms ON ms.id = um.modulo_id
      WHERE um.user_id = _user_id 
        AND um.ativo = true
        AND ms.ativo = true
        AND EXISTS (
          SELECT 1 FROM unnest(ms.prefixos_rota) AS prefixo
          WHERE _pathname LIKE prefixo OR _pathname LIKE prefixo || '%'
        )
    )
    END
$$;


--
-- Name: usuario_tem_permissao(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.usuario_tem_permissao(_user_id uuid, _codigo_funcao text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT public.has_permission_code(_user_id, _codigo_funcao);
$$;


--
-- Name: usuario_tem_permissao_financeira(uuid, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.usuario_tem_permissao_financeira(p_user_id uuid, p_permissao character varying) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT public.has_permission_code(p_user_id, p_permissao::text);
$$;


--
-- Name: validar_etapa_frequencia(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validar_etapa_frequencia() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_uid uuid := auth.uid();
  -- E1: o papel admin continua dispensado das REGRAS de etapa (abaixo, `NOT v_admin`; as checagens de permissão
  -- passam porque has_permission_code dá passagem ao admin), mas não da AUTORIA: o par _por/_em e o created_by
  -- do abono são gravados pelo banco também para ele.
  v_admin boolean;
  v_chefia boolean;
  v_rh boolean;
  o jsonb;
  n jsonb;
  ov jsonb := '{}'::jsonb;
  st_antes text;
  st_depois text;
  mudou_status boolean;
  mudou_chefia boolean;
  mudou_rh boolean;
  pela_chefia boolean;
  dispensa_rh boolean;
  dados text[];
  col text;
  -- pares de autoria: coluna _por, coluna _em, forçar agora (a etapa acontece neste comando), etapa ativa
  -- (enquanto vale, o par não é apagado)
  p_por text[] := '{}';
  p_em text[] := '{}';
  p_forca boolean[] := '{}';
  p_ativo boolean[] := '{}';
  -- fora da etapa ativa: true = o par fica como estava (a etapa aconteceu e o pedido terminou depois, ex.: a chefia
  -- aprovou e o RH rejeitou), false = o par vai a NULL (não sugere uma aprovação que não houve)
  p_hist boolean[] := '{}';
  i int;
BEGIN
  IF coalesce(current_setting('role', true), 'none') NOT IN ('anon', 'authenticated') THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;
  v_admin := public.is_admin_user(v_uid);
  v_chefia := public.has_permission_code(v_uid, 'rh.aprovar');
  v_rh := public.has_permission_code(v_uid, 'rh.frequencia.lancar');

  IF TG_OP = 'DELETE' THEN
    IF NOT v_rh THEN
      RAISE EXCEPTION 'Etapa do RH: excluir % exige a permissão rh.frequencia.lancar',
        CASE TG_TABLE_NAME
          WHEN 'solicitacoes_abono' THEN 'a solicitação de abono'
          WHEN 'frequencia_fechamento' THEN 'o fechamento da frequência'
          WHEN 'justificativas_ponto' THEN 'a justificativa de ponto'
          ELSE 'a solicitação de ajuste de ponto' END
        USING ERRCODE = '42501';
    END IF;
    RETURN OLD;
  END IF;

  -- comparações sempre por ->> (texto): no INSERT `o` é vazio e coluna nula em `n` também vira NULL
  n := to_jsonb(NEW);
  o := CASE WHEN TG_OP = 'INSERT' THEN '{}'::jsonb ELSE to_jsonb(OLD) END;

  IF TG_TABLE_NAME = 'solicitacoes_abono' THEN
    IF n ->> 'status' IS NULL AND NOT v_admin THEN
      RAISE EXCEPTION 'Abono: o status não pode ser nulo' USING ERRCODE = '42501';
    END IF;
    st_antes := coalesce(o ->> 'status', 'pendente');
    st_depois := n ->> 'status';
    mudou_status := st_depois IS DISTINCT FROM st_antes;
    -- status legado (CHECK do banco): nenhuma tela grava; fica fora da autoria, então ninguém transiciona para ele
    IF mudou_status AND st_depois = 'aprovado_rh' AND NOT v_admin THEN
      RAISE EXCEPTION 'Abono: o status legado aprovado_rh não é mais usado (o RH aprova com aprovado)' USING ERRCODE = '42501';
    END IF;
    -- sem RH, o pedido nasce na etapa inicial: status pendente (decidido é recusado) e campos de decisão nulos
    IF TG_OP = 'INSERT' AND NOT v_rh THEN
      IF st_depois <> 'pendente' THEN
        RAISE EXCEPTION 'Etapa do RH: só quem tem rh.frequencia.lancar registra o abono já decidido (status %); a chefia decide depois, sobre o pendente', st_depois
          USING ERRCODE = '42501';
      END IF;
      ov := ov || jsonb_build_object('motivo_rejeicao', NULL);
    END IF;
    mudou_chefia := (n ->> 'aprovado_chefia_por') IS DISTINCT FROM (o ->> 'aprovado_chefia_por')
                 OR (n ->> 'aprovado_chefia_em') IS DISTINCT FROM (o ->> 'aprovado_chefia_em');
    mudou_rh := (n ->> 'aprovado_rh_por') IS DISTINCT FROM (o ->> 'aprovado_rh_por')
             OR (n ->> 'aprovado_rh_em') IS DISTINCT FROM (o ->> 'aprovado_rh_em');

    -- autor do pedido: quem insere (mesmo isento em forcar_campos_iniciais); não muda depois
    IF TG_OP = 'INSERT' THEN
      ov := ov || jsonb_build_object('created_by', v_uid);
    ELSIF (n ->> 'created_by') IS DISTINCT FROM (o ->> 'created_by') THEN
      RAISE EXCEPTION 'Abono: o autor do pedido (created_by) não muda' USING ERRCODE = '42501';
    END IF;

    -- dados do pedido: sem RH, nada muda (a chefia decide, não edita); o motivo da rejeição só entra junto com a
    -- rejeição de um pendente; a aprovação da chefia só junto com a decisão sobre um pendente
    IF TG_OP = 'UPDATE' AND NOT v_rh THEN
      FOREACH col IN ARRAY ARRAY['servidor_id', 'tipo_abono_id', 'data_inicio', 'data_fim', 'hora_inicio', 'hora_fim',
                                 'justificativa', 'documento_url'] LOOP
        IF (n ->> col) IS DISTINCT FROM (o ->> col) THEN
          RAISE EXCEPTION 'Etapa do RH: alterar os dados do abono (%) exige a permissão rh.frequencia.lancar (a chefia decide, não edita)', col
            USING ERRCODE = '42501';
        END IF;
      END LOOP;
      IF (n ->> 'motivo_rejeicao') IS DISTINCT FROM (o ->> 'motivo_rejeicao')
         AND NOT (st_antes = 'pendente' AND st_depois = 'rejeitado') THEN
        RAISE EXCEPTION 'Etapa do RH: o motivo da rejeição só é registrado ao rejeitar um abono pendente (status %); fora disso exige a permissão rh.frequencia.lancar', st_antes
          USING ERRCODE = '42501';
      END IF;
      IF mudou_chefia AND (st_antes <> 'pendente' OR NOT mudou_status) THEN
        RAISE EXCEPTION 'Etapa do RH: a aprovação da chefia só é registrada junto com a decisão sobre um abono pendente (status %); fora disso exige a permissão rh.frequencia.lancar', st_antes
          USING ERRCODE = '42501';
      END IF;
    END IF;

    IF mudou_chefia AND NOT v_chefia THEN
      RAISE EXCEPTION 'Etapa da chefia: registrar a aprovação da chefia exige a permissão rh.aprovar' USING ERRCODE = '42501';
    END IF;
    IF mudou_rh AND NOT v_rh THEN
      RAISE EXCEPTION 'Etapa do RH: registrar a aprovação do RH exige a permissão rh.frequencia.lancar' USING ERRCODE = '42501';
    END IF;

    IF mudou_status THEN
      IF st_depois = 'aprovado_chefia' AND NOT v_chefia THEN
        RAISE EXCEPTION 'Etapa da chefia: aprovar o abono pela chefia exige a permissão rh.aprovar' USING ERRCODE = '42501';
      END IF;
      IF NOT v_rh THEN
        -- a chefia só tira o pedido de pendente
        IF st_antes <> 'pendente' THEN
          RAISE EXCEPTION 'Etapa do RH: mudar o status do abono de % para % exige a permissão rh.frequencia.lancar', st_antes, st_depois
            USING ERRCODE = '42501';
        ELSIF st_depois = 'aprovado' THEN
          -- o tipo que vale é o da linha antes do comando (no UPDATE), não o que vem nele
          SELECT ta.exige_aprovacao_rh IS FALSE INTO dispensa_rh
            FROM public.tipos_abono ta
           WHERE ta.id = (CASE WHEN TG_OP = 'UPDATE' THEN o ELSE n END ->> 'tipo_abono_id')::uuid;
          IF NOT (v_chefia AND mudou_chefia AND coalesce(dispensa_rh, false)) THEN
            RAISE EXCEPTION 'Etapa do RH: aprovar o abono exige a permissão rh.frequencia.lancar (a chefia só encerra o fluxo quando o tipo de abono dispensa o RH)'
              USING ERRCODE = '42501';
          END IF;
        ELSIF st_depois = 'rejeitado' THEN
          IF NOT v_chefia THEN
            RAISE EXCEPTION 'Etapa da chefia: rejeitar o abono exige a permissão rh.aprovar ou rh.frequencia.lancar' USING ERRCODE = '42501';
          END IF;
        ELSIF st_depois <> 'aprovado_chefia' THEN
          RAISE EXCEPTION 'Etapa do RH: mudar o status do abono de % para % exige a permissão rh.frequencia.lancar', st_antes, st_depois
            USING ERRCODE = '42501';
        END IF;
      END IF;
    END IF;
    -- ir para `aprovado` pela chefia (encerra o fluxo; quem tem as duas permissões e só registra a chefia) grava o par
    -- da chefia; pelo RH, o par do RH. A rejeição não tem coluna de autoria no abono.
    pela_chefia := NOT v_rh OR (mudou_chefia AND NOT mudou_rh);
    p_por := ARRAY['aprovado_chefia_por', 'aprovado_rh_por'];
    p_em := ARRAY['aprovado_chefia_em', 'aprovado_rh_em'];
    p_forca := ARRAY[mudou_status AND (st_depois = 'aprovado_chefia' OR (st_depois = 'aprovado' AND pela_chefia)),
                     mudou_status AND st_depois = 'aprovado' AND NOT pela_chefia];
    p_ativo := ARRAY[st_depois IN ('aprovado_chefia', 'aprovado'), st_depois = 'aprovado'];
    -- (aprovado_rh: linhas legadas mantêm o que tinham)
    p_hist := ARRAY[st_depois IN ('rejeitado', 'cancelado', 'aprovado_rh'), st_depois IN ('rejeitado', 'cancelado', 'aprovado_rh')];

  ELSIF TG_TABLE_NAME = 'frequencia_fechamento' THEN
    IF TG_OP = 'UPDATE' AND NOT v_admin
       AND ((n ->> 'servidor_id') IS DISTINCT FROM (o ->> 'servidor_id')
            OR (n ->> 'ano') IS DISTINCT FROM (o ->> 'ano')
            OR (n ->> 'mes') IS DISTINCT FROM (o ->> 'mes')) THEN
      RAISE EXCEPTION 'Fechamento da frequência: servidor, ano e mês não mudam depois de criados (só o papel admin corrige)'
        USING ERRCODE = '42501';
    END IF;
    IF TG_OP = 'UPDATE' AND NOT v_rh AND coalesce((o ->> 'consolidado_rh')::boolean, false)
       AND (n - 'updated_at') IS DISTINCT FROM (o - 'updated_at') THEN
      RAISE EXCEPTION 'Etapa do RH: alterar uma frequência já consolidada exige a permissão rh.frequencia.lancar' USING ERRCODE = '42501';
    END IF;
    IF (coalesce((n ->> 'assinado_servidor')::boolean, false) IS DISTINCT FROM coalesce((o ->> 'assinado_servidor')::boolean, false)
        OR (n ->> 'assinado_servidor_em') IS DISTINCT FROM (o ->> 'assinado_servidor_em'))
       AND (n ->> 'servidor_id')::uuid IS DISTINCT FROM public.meu_servidor_id() AND NOT v_admin THEN
      RAISE EXCEPTION 'Assinatura do servidor: só o próprio servidor assina (ou desfaz a assinatura de) a sua frequência'
        USING ERRCODE = '42501';
    END IF;
    IF coalesce((n ->> 'validado_chefia')::boolean, false) IS DISTINCT FROM coalesce((o ->> 'validado_chefia')::boolean, false)
       OR (n ->> 'validado_chefia_por') IS DISTINCT FROM (o ->> 'validado_chefia_por')
       OR (n ->> 'validado_chefia_em') IS DISTINCT FROM (o ->> 'validado_chefia_em') THEN
      IF coalesce((n ->> 'validado_chefia')::boolean, false) THEN
        IF NOT v_chefia THEN
          RAISE EXCEPTION 'Etapa da chefia: validar a frequência exige a permissão rh.aprovar' USING ERRCODE = '42501';
        END IF;
      ELSIF NOT v_rh THEN
        RAISE EXCEPTION 'Etapa do RH: desfazer a validação da chefia (reabertura) exige a permissão rh.frequencia.lancar' USING ERRCODE = '42501';
      END IF;
    END IF;
    IF (coalesce((n ->> 'consolidado_rh')::boolean, false) IS DISTINCT FROM coalesce((o ->> 'consolidado_rh')::boolean, false)
        OR (n ->> 'consolidado_rh_por') IS DISTINCT FROM (o ->> 'consolidado_rh_por')
        OR (n ->> 'consolidado_rh_em') IS DISTINCT FROM (o ->> 'consolidado_rh_em')
        OR coalesce((n ->> 'reaberto')::boolean, false) IS DISTINCT FROM coalesce((o ->> 'reaberto')::boolean, false)
        OR (n ->> 'reaberto_por') IS DISTINCT FROM (o ->> 'reaberto_por')
        OR (n ->> 'reaberto_em') IS DISTINCT FROM (o ->> 'reaberto_em')
        OR (n ->> 'justificativa_reabertura') IS DISTINCT FROM (o ->> 'justificativa_reabertura'))
       AND NOT v_rh THEN
      RAISE EXCEPTION 'Etapa do RH: consolidar ou reabrir a frequência exige a permissão rh.frequencia.lancar' USING ERRCODE = '42501';
    END IF;
    -- a flag que vira true grava o seu par; enquanto ela vale, o par não é apagado
    FOREACH col IN ARRAY ARRAY['validado_chefia', 'consolidado_rh', 'reaberto'] LOOP
      p_por := p_por || (col || '_por');
      p_em := p_em || (col || '_em');
      p_forca := p_forca || (coalesce((n ->> col)::boolean, false) AND NOT coalesce((o ->> col)::boolean, false));
      p_ativo := p_ativo || coalesce((n ->> col)::boolean, false);
      -- a reabertura que já aconteceu continua registrada depois da reconsolidação (reaberto volta a false)
      p_hist := p_hist || (col = 'reaberto');
    END LOOP;

  ELSE
    -- justificativas_ponto e solicitacoes_ajuste_ponto: uma etapa só (chefia ou RH decidem; status_solicitacao)
    IF n ->> 'status' IS NULL AND NOT v_admin THEN
      RAISE EXCEPTION 'Pedido de ponto: o status não pode ser nulo' USING ERRCODE = '42501';
    END IF;
    st_antes := coalesce(o ->> 'status', 'pendente');
    st_depois := n ->> 'status';
    mudou_status := st_depois IS DISTINCT FROM st_antes;
    -- sem RH, o pedido nasce na etapa inicial: status pendente (decidido é recusado) e campos de decisão nulos
    IF TG_OP = 'INSERT' AND NOT v_rh THEN
      IF st_depois <> 'pendente' THEN
        RAISE EXCEPTION 'Etapa do RH: só quem tem rh.frequencia.lancar registra o pedido já decidido (status %); a chefia decide depois, sobre o pendente', st_depois
          USING ERRCODE = '42501';
      END IF;
      ov := ov || jsonb_build_object('observacao_aprovador', NULL);
    END IF;
    dados := CASE TG_TABLE_NAME
      WHEN 'justificativas_ponto' THEN ARRAY['registro_ponto_id', 'tipo', 'descricao', 'arquivo_url']
      ELSE ARRAY['servidor_id', 'registro_ponto_id', 'data_ocorrido', 'tipo_ajuste', 'campo_ajuste', 'horario_atual',
                 'horario_correto', 'motivo', 'comprovante_url'] END;
    IF TG_OP = 'UPDATE' AND NOT v_rh THEN
      FOREACH col IN ARRAY dados LOOP
        IF (n ->> col) IS DISTINCT FROM (o ->> col) THEN
          RAISE EXCEPTION 'Etapa do RH: alterar o texto do pedido (%) exige a permissão rh.frequencia.lancar (a chefia decide, não edita)', col
            USING ERRCODE = '42501';
        END IF;
      END LOOP;
      IF ((n ->> 'observacao_aprovador') IS DISTINCT FROM (o ->> 'observacao_aprovador')
          OR (n ->> 'aprovador_id') IS DISTINCT FROM (o ->> 'aprovador_id')
          OR (n ->> 'data_aprovacao') IS DISTINCT FROM (o ->> 'data_aprovacao'))
         AND NOT (st_antes = 'pendente' AND mudou_status) THEN
        RAISE EXCEPTION 'Etapa do RH: a decisão só é registrada junto com a mudança de status de um pedido pendente (status %); fora disso exige a permissão rh.frequencia.lancar', st_antes
          USING ERRCODE = '42501';
      END IF;
    END IF;
    IF mudou_status AND NOT v_rh THEN
      IF NOT v_chefia OR st_antes <> 'pendente' OR st_depois NOT IN ('aprovada', 'rejeitada') THEN
        RAISE EXCEPTION 'Etapa do RH: mudar o status do pedido de % para % exige a permissão rh.frequencia.lancar (a chefia só aprova ou rejeita o pendente)', st_antes, st_depois
          USING ERRCODE = '42501';
      END IF;
    END IF;
    p_por := ARRAY['aprovador_id'];
    p_em := ARRAY['data_aprovacao'];
    p_forca := ARRAY[mudou_status AND st_depois IN ('aprovada', 'rejeitada')];
    p_ativo := ARRAY[st_depois IN ('aprovada', 'rejeitada')];
    p_hist := ARRAY[st_depois = 'cancelada'];
  END IF;

  -- autoria: o par da etapa que acontece neste comando é de quem age, agora. Enquanto a etapa vale, o par não é
  -- apagado (nem em parte) e, se mudar para um valor não nulo, também é de quem age, agora. Fora da etapa ativa, o
  -- par fica como estava (p_hist: a etapa aconteceu e o pedido terminou depois) ou vai a NULL.
  FOR i IN 1 .. coalesce(array_length(p_por, 1), 0) LOOP
    IF p_forca[i] THEN
      ov := ov || jsonb_build_object(p_por[i], v_uid, p_em[i], now());
    ELSIF p_ativo[i] THEN
      IF ((o ->> p_por[i]) IS NOT NULL AND (n ->> p_por[i]) IS NULL)
         OR ((o ->> p_em[i]) IS NOT NULL AND (n ->> p_em[i]) IS NULL) THEN
        RAISE EXCEPTION 'Autoria: o registro da etapa (%, %) não é apagado enquanto ela vale', p_por[i], p_em[i]
          USING ERRCODE = '42501';
      ELSIF ((n ->> p_por[i]) IS DISTINCT FROM (o ->> p_por[i]) OR (n ->> p_em[i]) IS DISTINCT FROM (o ->> p_em[i]))
            AND ((n ->> p_por[i]) IS NOT NULL OR (n ->> p_em[i]) IS NOT NULL) THEN
        ov := ov || jsonb_build_object(p_por[i], v_uid, p_em[i], now());
      END IF;
    ELSIF p_hist[i] THEN
      ov := ov || jsonb_build_object(p_por[i], o -> p_por[i], p_em[i], o -> p_em[i]);
    ELSE
      ov := ov || jsonb_build_object(p_por[i], NULL, p_em[i], NULL);
    END IF;
  END LOOP;
  IF ov <> '{}'::jsonb THEN
    NEW := jsonb_populate_record(NEW, n || ov);
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: validar_lotacao_unica(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validar_lotacao_unica() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.ativo = true THEN
    -- Desativar lotações anteriores
    UPDATE public.lotacoes
    SET ativo = false, data_fim = COALESCE(NEW.data_inicio - INTERVAL '1 day', CURRENT_DATE)
    WHERE servidor_id = NEW.servidor_id
      AND ativo = true
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: validar_provimento(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validar_provimento() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  qtd_atual INTEGER;
  qtd_max INTEGER;
BEGIN
  -- cargo com quadro de vagas: a vaga (trg_provimento_vaga) já garante o limite; sem vaga, conta só quando o
  -- provimento entra em ativo (encerrar ou suspender quem sobrou acima do quadro nunca é barrado)
  IF NEW.vaga_id IS NOT NULL
     OR (TG_OP = 'UPDATE' AND OLD.status = 'ativo' AND OLD.cargo_id IS NOT DISTINCT FROM NEW.cargo_id) THEN
    RETURN NEW;
  END IF;

  -- Contar provimentos ativos para o cargo
  SELECT COUNT(*) INTO qtd_atual
  FROM public.provimentos
  WHERE cargo_id = NEW.cargo_id
    AND status = 'ativo'
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

  -- Obter quantidade máxima de vagas
  SELECT quantidade_vagas INTO qtd_max
  FROM public.cargos
  WHERE id = NEW.cargo_id;

  -- Validar se não excede
  IF NEW.status = 'ativo' AND qtd_atual >= COALESCE(qtd_max, 0) THEN
    RAISE EXCEPTION 'Quantidade máxima de provimentos para este cargo foi atingida (% de %)', qtd_atual, qtd_max;
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: validar_vinculo_unico(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validar_vinculo_unico() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.ativo = true THEN
    -- Desativar vínculos anteriores
    UPDATE public.vinculos_funcionais
    SET ativo = false, data_fim = COALESCE(NEW.data_inicio - INTERVAL '1 day', CURRENT_DATE)
    WHERE servidor_id = NEW.servidor_id
      AND ativo = true
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: validate_processo_sei_para_aprovacao(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_processo_sei_para_aprovacao() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.status = 'aprovado' AND OLD.status != 'aprovado' THEN
    IF NEW.numero_processo_sei IS NULL OR TRIM(NEW.numero_processo_sei) = '' THEN
      RAISE EXCEPTION 'É obrigatório informar o número do processo SEI para aprovar a solicitação';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: verificar_arquivamento_processo(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.verificar_arquivamento_processo() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.status = 'arquivado' AND OLD.status != 'arquivado' THEN
    IF NOT EXISTS (SELECT 1 FROM public.despachos WHERE processo_id = NEW.id AND tipo_despacho = 'conclusivo') THEN
      RAISE EXCEPTION 'Processo não pode ser arquivado sem despacho conclusivo';
    END IF;
  END IF;
  RETURN NEW;
END; $$;


--
-- Name: verificar_autorizacao_presidencia_ascom(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.verificar_autorizacao_presidencia_ascom() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Tipos que requerem autorização da presidência
  IF NEW.tipo IN (
    'conteudo_nota_oficial',
    'emergencial_crise',
    'imprensa_agendamento_entrevista',
    'emergencial_posicionamento',
    'redes_campanha'
  ) THEN
    NEW.requer_autorizacao_presidencia := true;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: verificar_conflito_agenda(uuid, timestamp with time zone, timestamp with time zone, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.verificar_conflito_agenda(p_unidade_id uuid, p_data_inicio timestamp with time zone, p_data_fim timestamp with time zone, p_agenda_id uuid DEFAULT NULL::uuid) RETURNS TABLE(tem_conflito boolean, agendas_conflitantes jsonb)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_conflitos JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', a.id,
      'titulo', a.titulo,
      'data_inicio', a.data_inicio,
      'data_fim', a.data_fim,
      'solicitante', a.solicitante_nome,
      'status', a.status
    )
  ) INTO v_conflitos
  FROM public.agenda_unidade a
  WHERE a.unidade_local_id = p_unidade_id
    AND a.status::text NOT IN ('cancelado', 'rejeitado')
    AND (p_agenda_id IS NULL OR a.id != p_agenda_id)
    AND (a.data_inicio <= p_data_fim AND a.data_fim >= p_data_inicio);
  
  RETURN QUERY SELECT 
    v_conflitos IS NOT NULL AND jsonb_array_length(v_conflitos) > 0,
    COALESCE(v_conflitos, '[]'::jsonb);
END;
$$;


--
-- Name: viagens_diarias_validar(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.viagens_diarias_validar() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_hoje date := public.data_local();
  v_conf text;
BEGIN
  IF NEW.status = 'cancelada' THEN
    RETURN NEW;
  END IF;
  IF NEW.data_retorno < NEW.data_saida THEN
    RAISE EXCEPTION 'Viagem: a data de retorno (%) é anterior à saída (%)', NEW.data_retorno, NEW.data_saida
      USING ERRCODE = '23514';
  END IF;

  -- conflitos: só quando a viagem nasce ou muda de período/servidor/situação
  IF TG_OP = 'INSERT'
     OR NEW.servidor_id IS DISTINCT FROM OLD.servidor_id
     OR NEW.data_saida IS DISTINCT FROM OLD.data_saida
     OR NEW.data_retorno IS DISTINCT FROM OLD.data_retorno
     OR OLD.status = 'cancelada' THEN

    SELECT 'férias de ' || to_char(f.data_inicio, 'DD/MM/YYYY') || ' a ' || to_char(f.data_fim, 'DD/MM/YYYY') INTO v_conf
      FROM public.ferias_servidor f
     WHERE f.servidor_id = NEW.servidor_id AND f.status IN ('programada', 'em_gozo', 'concluida')
       AND f.data_inicio <= NEW.data_retorno AND f.data_fim >= NEW.data_saida
     LIMIT 1;
    IF v_conf IS NOT NULL THEN
      RAISE EXCEPTION 'Viagem de % a % conflita com %', to_char(NEW.data_saida, 'DD/MM/YYYY'),
        to_char(NEW.data_retorno, 'DD/MM/YYYY'), v_conf USING ERRCODE = '23P01';
    END IF;

    -- missão e serviço externo são deslocamentos a serviço, não impedem a viagem
    SELECT 'licença/afastamento de ' || to_char(l.data_inicio, 'DD/MM/YYYY') || coalesce(' a ' || to_char(l.data_fim, 'DD/MM/YYYY'), ' (sem data final)') INTO v_conf
      FROM public.licencas_afastamentos l
     WHERE l.servidor_id = NEW.servidor_id AND l.status IN ('ativa', 'prorrogada', 'encerrada')
       AND l.tipo_afastamento NOT IN ('missao', 'servico_externo')
       AND l.data_inicio <= NEW.data_retorno AND coalesce(l.data_fim, 'infinity'::date) >= NEW.data_saida
     LIMIT 1;
    IF v_conf IS NOT NULL THEN
      RAISE EXCEPTION 'Viagem de % a % conflita com %', to_char(NEW.data_saida, 'DD/MM/YYYY'),
        to_char(NEW.data_retorno, 'DD/MM/YYYY'), v_conf USING ERRCODE = '23P01';
    END IF;

    SELECT 'outra viagem de ' || to_char(v.data_saida, 'DD/MM/YYYY') || ' a ' || to_char(v.data_retorno, 'DD/MM/YYYY') INTO v_conf
      FROM public.viagens_diarias v
     WHERE v.servidor_id = NEW.servidor_id AND v.id <> NEW.id AND v.status <> 'cancelada'
       AND v.data_saida <= NEW.data_retorno AND v.data_retorno >= NEW.data_saida
     LIMIT 1;
    IF v_conf IS NOT NULL THEN
      RAISE EXCEPTION 'Viagem de % a % conflita com %', to_char(NEW.data_saida, 'DD/MM/YYYY'),
        to_char(NEW.data_retorno, 'DD/MM/YYYY'), v_conf USING ERRCODE = '23P01';
    END IF;
  END IF;

  -- prestação de contas pendente impede viagem nova
  IF TG_OP = 'INSERT' AND EXISTS (
       SELECT 1 FROM public.viagens_diarias v
        WHERE v.servidor_id = NEW.servidor_id AND v.status IN ('em_andamento', 'autorizada')
          AND v.data_retorno < v_hoje AND NOT coalesce(v.relatorio_apresentado, false)) THEN
    RAISE EXCEPTION 'Viagem: o servidor tem prestação de contas pendente (viagem já retornada sem relatório); regularize antes de abrir outra'
      USING ERRCODE = '23514';
  END IF;

  -- concluir exige o relatório
  IF NEW.status = 'concluida' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'concluida')
     AND (NOT coalesce(NEW.relatorio_apresentado, false) OR NEW.relatorio_data IS NULL) THEN
    RAISE EXCEPTION 'Prestação de contas: registre o relatório da viagem (apresentado e data) antes de concluir'
      USING ERRCODE = '23514';
  END IF;
  IF coalesce(NEW.relatorio_apresentado, false) AND NEW.relatorio_data IS NOT NULL AND NEW.relatorio_data < NEW.data_retorno THEN
    RAISE EXCEPTION 'Prestação de contas: a data do relatório (%) é anterior ao retorno (%)', NEW.relatorio_data, NEW.data_retorno
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: _backup_usuario_modulos_old; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._backup_usuario_modulos_old (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    modulo_id uuid NOT NULL,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid
);


--
-- Name: acesso_processo_sigiloso; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.acesso_processo_sigiloso (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    processo_id uuid NOT NULL,
    usuario_id uuid NOT NULL,
    nivel_acesso text DEFAULT 'leitura'::text NOT NULL,
    motivo text,
    concedido_por uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT acesso_processo_sigiloso_nivel_acesso_check CHECK ((nivel_acesso = ANY (ARRAY['leitura'::text, 'tramitacao'::text, 'total'::text])))
);

ALTER TABLE ONLY public.acesso_processo_sigiloso FORCE ROW LEVEL SECURITY;


--
-- Name: acoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.acoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    programa_id uuid NOT NULL,
    codigo character varying(20) NOT NULL,
    nome character varying(200) NOT NULL,
    descricao text,
    tipo character varying(30) DEFAULT 'atividade'::character varying,
    processo_licitatorio_id uuid,
    meta_fisica numeric(18,2),
    meta_financeira numeric(18,2),
    unidade_medida character varying(50),
    data_inicio date,
    data_fim date,
    situacao character varying(30) DEFAULT 'planejada'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    CONSTRAINT acoes_situacao_check CHECK (((situacao)::text = ANY ((ARRAY['planejada'::character varying, 'em_execucao'::character varying, 'concluida'::character varying, 'cancelada'::character varying, 'suspensa'::character varying])::text[]))),
    CONSTRAINT acoes_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['atividade'::character varying, 'projeto'::character varying, 'operacao_especial'::character varying])::text[])))
);


--
-- Name: adicionais_tempo_servico; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.adicionais_tempo_servico (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    servidor_id uuid NOT NULL,
    tipo character varying(50) NOT NULL,
    percentual numeric(5,2) NOT NULL,
    quantidade integer DEFAULT 1 NOT NULL,
    data_base date NOT NULL,
    data_concessao date NOT NULL,
    data_proximo date,
    valor_referencia numeric(12,2),
    valor_adicional numeric(12,2),
    ato_numero character varying(50),
    ato_data date,
    fundamentacao_legal text,
    observacoes text,
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    created_by_servidor_id uuid,
    updated_by uuid,
    updated_by_servidor_id uuid
);


--
-- Name: aditivos_contrato; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.aditivos_contrato (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    contrato_id uuid NOT NULL,
    numero_aditivo integer NOT NULL,
    tipo public.tipo_aditivo NOT NULL,
    objeto text NOT NULL,
    valor_acrescimo numeric(15,2) DEFAULT 0,
    valor_supressao numeric(15,2) DEFAULT 0,
    prazo_adicional_dias integer DEFAULT 0,
    nova_data_fim date,
    data_assinatura date NOT NULL,
    data_publicacao_doe date,
    numero_doe character varying(20),
    justificativa text,
    fundamentacao_legal text,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid
);


--
-- Name: agenda_unidade; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agenda_unidade (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    unidade_local_id uuid NOT NULL,
    titulo text NOT NULL,
    descricao text,
    tipo_uso text NOT NULL,
    solicitante_nome text NOT NULL,
    solicitante_documento text,
    solicitante_telefone text,
    solicitante_email text,
    data_inicio timestamp with time zone NOT NULL,
    data_fim timestamp with time zone NOT NULL,
    area_utilizada text,
    publico_estimado integer,
    status public.status_agenda DEFAULT 'solicitado'::public.status_agenda NOT NULL,
    aprovador_id uuid,
    data_aprovacao timestamp with time zone,
    motivo_rejeicao text,
    observacoes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    numero_protocolo character varying(50),
    tipo_solicitante character varying(30) DEFAULT 'pessoa_fisica'::character varying,
    solicitante_razao_social character varying(200),
    solicitante_cnpj character varying(20),
    solicitante_endereco text,
    responsavel_legal character varying(200),
    responsavel_legal_documento character varying(20),
    finalidade_detalhada text,
    espaco_especifico character varying(100),
    horario_diario character varying(50),
    historico_status jsonb DEFAULT '[]'::jsonb,
    documentos_anexos jsonb DEFAULT '[]'::jsonb,
    ano_vigencia integer DEFAULT EXTRACT(year FROM CURRENT_DATE),
    encerrado_automaticamente boolean DEFAULT false,
    federacao_id uuid,
    instituicao_id uuid,
    numero_processo_sei text,
    modalidades_esportivas text[] DEFAULT '{}'::text[]
);


--
-- Name: COLUMN agenda_unidade.federacao_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.agenda_unidade.federacao_id IS 'Referência à federação esportiva quando o solicitante é uma federação. Usado para integração com módulo de Federações.';


--
-- Name: COLUMN agenda_unidade.modalidades_esportivas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.agenda_unidade.modalidades_esportivas IS 'Array de modalidades esportivas praticadas no evento';


--
-- Name: agrupamento_unidade_vinculo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agrupamento_unidade_vinculo (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agrupamento_id uuid NOT NULL,
    unidade_id uuid NOT NULL,
    ordem integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    created_by_servidor_id uuid,
    updated_at timestamp with time zone,
    updated_by uuid,
    updated_by_servidor_id uuid
);


--
-- Name: TABLE agrupamento_unidade_vinculo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.agrupamento_unidade_vinculo IS 'Vínculo entre agrupamentos e unidades administrativas';


--
-- Name: almoxarifados; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.almoxarifados (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo character varying(20) NOT NULL,
    nome character varying(100) NOT NULL,
    unidade_id uuid,
    responsavel_id uuid,
    localizacao text,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: approval_delegations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.approval_delegations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    delegator_id uuid NOT NULL,
    delegate_id uuid NOT NULL,
    module_name character varying(100),
    valid_from timestamp with time zone NOT NULL,
    valid_until timestamp with time zone NOT NULL,
    reason text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    revoked_at timestamp with time zone,
    revoked_by uuid,
    CONSTRAINT check_valid_dates CHECK ((valid_until > valid_from))
);

ALTER TABLE ONLY public.approval_delegations FORCE ROW LEVEL SECURITY;


--
-- Name: approval_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.approval_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entity_type character varying(100) NOT NULL,
    entity_id uuid NOT NULL,
    module_name character varying(100) NOT NULL,
    status public.approval_status DEFAULT 'draft'::public.approval_status,
    requester_id uuid NOT NULL,
    requester_org_unit_id uuid,
    submitted_at timestamp with time zone,
    justification text,
    attachments jsonb DEFAULT '[]'::jsonb,
    approver_id uuid,
    approved_at timestamp with time zone,
    approver_decision text,
    electronic_signature jsonb,
    priority character varying(20) DEFAULT 'normal'::character varying,
    due_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    status_history jsonb DEFAULT '[]'::jsonb
);

ALTER TABLE ONLY public.approval_requests FORCE ROW LEVEL SECURITY;


--
-- Name: atas_registro_preco; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.atas_registro_preco (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    processo_id uuid NOT NULL,
    numero_ata character varying(50) NOT NULL,
    ano integer NOT NULL,
    fornecedor_id uuid NOT NULL,
    data_assinatura date NOT NULL,
    data_publicacao_doe date,
    numero_doe character varying(50),
    data_vigencia_inicio date NOT NULL,
    data_vigencia_fim date NOT NULL,
    valor_total_registrado numeric(18,2) NOT NULL,
    saldo_disponivel numeric(18,2),
    objeto text NOT NULL,
    fundamentacao_legal text,
    situacao character varying(50) DEFAULT 'vigente'::character varying,
    orgao_gerenciador character varying(200),
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid
);


--
-- Name: audit_colunas_sensiveis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_colunas_sensiveis (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tabela text NOT NULL,
    coluna text NOT NULL,
    tratamento text NOT NULL,
    motivo text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT audit_colunas_sensiveis_tratamento_check CHECK ((tratamento = ANY (ARRAY['parcial'::text, 'omitir'::text])))
);


--
-- Name: TABLE audit_colunas_sensiveis; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.audit_colunas_sensiveis IS 'Máscara LGPD da trilha (fn_audit_trigger): coluna e tratamento (parcial/omitir). Só o papel admin altera.';


--
-- Name: audit_log_licitacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log_licitacoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tabela_origem character varying(100) NOT NULL,
    registro_id uuid NOT NULL,
    acao character varying(20) NOT NULL,
    dados_anteriores jsonb,
    dados_novos jsonb,
    campos_alterados text[],
    usuario_id uuid,
    usuario_nome text,
    usuario_perfil text,
    ip_address inet,
    user_agent text,
    motivo text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT audit_log_licitacoes_acao_check CHECK (((acao)::text = ANY ((ARRAY['INSERT'::character varying, 'UPDATE'::character varying, 'DELETE'::character varying])::text[])))
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid,
    action public.audit_action NOT NULL,
    entity_type character varying(100),
    entity_id uuid,
    module_name character varying(100),
    before_data jsonb,
    after_data jsonb,
    ip_address inet,
    user_agent text,
    org_unit_id uuid,
    description text,
    metadata jsonb DEFAULT '{}'::jsonb,
    role_at_time public.app_role,
    servidor_id uuid,
    servidor_nome text,
    servidor_matricula text,
    campos_alterados text[],
    origem text,
    transacao bigint,
    sequencia bigint NOT NULL,
    alvos text[] GENERATED ALWAYS AS (array_remove(ARRAY[
CASE
    WHEN ((entity_type)::text = 'servidores'::text) THEN ('s:'::text || (entity_id)::text)
    ELSE NULL::text
END, ('s:'::text || (after_data ->> 'servidor_id'::text)), ('s:'::text || (before_data ->> 'servidor_id'::text)), ('s:'::text || (metadata ->> 'servidor_id'::text)),
CASE
    WHEN ((metadata ->> 'fonte'::text) = 'storage'::text) THEN ('s:'::text || (metadata ->> 'servidor_alvo_id'::text))
    ELSE NULL::text
END,
CASE
    WHEN ((entity_type)::text = 'folhas_pagamento'::text) THEN ('f:'::text || (entity_id)::text)
    ELSE NULL::text
END, ('f:'::text || (after_data ->> 'folha_id'::text)), ('f:'::text || (before_data ->> 'folha_id'::text)), ('f:'::text || (metadata ->> 'folha_id'::text))], NULL::text)) STORED,
    fundamento jsonb,
    protocolo text,
    CONSTRAINT audit_logs_origem_check CHECK (((origem IS NULL) OR (origem = ANY (ARRAY['usuario'::text, 'usuario_sem_vinculo'::text, 'sistema'::text, 'anonimo'::text]))))
);

ALTER TABLE ONLY public.audit_logs FORCE ROW LEVEL SECURITY;


--
-- Name: COLUMN audit_logs.servidor_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audit_logs.servidor_id IS 'Retrato do servidor vinculado ao perfil de quem agiu, no momento do registro (sem FK: não muda se o vínculo mudar)';


--
-- Name: COLUMN audit_logs.campos_alterados; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audit_logs.campos_alterados IS 'Colunas que mudaram no UPDATE (o nome aparece mesmo quando o valor é mascarado)';


--
-- Name: COLUMN audit_logs.origem; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audit_logs.origem IS 'usuario | usuario_sem_vinculo | sistema | anonimo (ver public.responsavel_atual)';


--
-- Name: COLUMN audit_logs.transacao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audit_logs.transacao IS 'txid_current() do registro: agrupa o que mudou no mesmo comando/transação';


--
-- Name: COLUMN audit_logs.sequencia; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audit_logs.sequencia IS 'Ordem de gravação na trilha (identity; desempata o "timestamp", que é o da transação)';


--
-- Name: COLUMN audit_logs.alvos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audit_logs.alvos IS 'Recorte da aba de histórico (gerada): s:<servidor_id> e f:<folha_id> citados pela linha; filtro alvos @> ARRAY[''s:<id>'']';


--
-- Name: COLUMN audit_logs.fundamento; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audit_logs.fundamento IS 'Fundamento do lançamento pela regra de setor (via, permitido, modo, módulo, unidade, lotação/designação/comissão, ato); nulo com a regra desligada';


--
-- Name: COLUMN audit_logs.protocolo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audit_logs.protocolo IS 'Protocolo RH-AAAA-NNNNNN do ato (módulo rh): agrupa as gravações da mesma transação; a linha de abertura descreve o ato';


--
-- Name: audit_logs_sequencia_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.audit_logs ALTER COLUMN sequencia ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.audit_logs_sequencia_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: avaliacoes_controle; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.avaliacoes_controle (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    controle_id uuid NOT NULL,
    data_avaliacao date DEFAULT CURRENT_DATE NOT NULL,
    avaliador_id uuid,
    periodo_referencia character varying(50),
    status_execucao character varying(50) NOT NULL,
    efetividade character varying(50) NOT NULL,
    valor_indicador character varying(100),
    conformidade_procedimento boolean,
    pontos_atencao text,
    recomendacoes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid
);


--
-- Name: TABLE avaliacoes_controle; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.avaliacoes_controle IS 'Avaliações periódicas de efetividade dos controles';


--
-- Name: avaliacoes_risco; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.avaliacoes_risco (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    risco_id uuid NOT NULL,
    data_avaliacao date DEFAULT CURRENT_DATE NOT NULL,
    avaliador_id uuid,
    probabilidade_avaliada public.nivel_risco NOT NULL,
    impacto_avaliado public.nivel_risco NOT NULL,
    nivel_risco_avaliado public.nivel_risco NOT NULL,
    efetividade_controles character varying(50),
    observacoes text,
    recomendacoes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid
);


--
-- Name: TABLE avaliacoes_risco; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.avaliacoes_risco IS 'Histórico de avaliações periódicas dos riscos';


--
-- Name: avisos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.avisos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    titulo text NOT NULL,
    conteudo text NOT NULL,
    prioridade text DEFAULT 'normal'::text NOT NULL,
    destaque boolean DEFAULT false NOT NULL,
    publico text DEFAULT 'todos'::text NOT NULL,
    modulos_alvo public.app_module[] DEFAULT '{}'::public.app_module[] NOT NULL,
    inicio_em timestamp with time zone DEFAULT now() NOT NULL,
    expira_em timestamp with time zone,
    link text,
    ativo boolean DEFAULT true NOT NULL,
    created_by uuid DEFAULT auth.uid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT avisos_conteudo_check CHECK ((char_length(conteudo) <= 5000)),
    CONSTRAINT avisos_link_check CHECK (((link IS NULL) OR ((char_length(link) <= 500) AND (link ~ '^(/$|/[^/\\]|https://[^/\\])'::text) AND (link !~ '[[:space:][:cntrl:]]'::text)))),
    CONSTRAINT avisos_prioridade_check CHECK ((prioridade = ANY (ARRAY['baixa'::text, 'normal'::text, 'alta'::text, 'urgente'::text]))),
    CONSTRAINT avisos_publico_check CHECK ((publico = ANY (ARRAY['todos'::text, 'modulos'::text]))),
    CONSTRAINT avisos_publico_ck CHECK (((publico = 'todos'::text) OR (cardinality(modulos_alvo) > 0))),
    CONSTRAINT avisos_titulo_check CHECK (((char_length(btrim(titulo)) >= 3) AND (char_length(btrim(titulo)) <= 200))),
    CONSTRAINT avisos_validade_ck CHECK (((expira_em IS NULL) OR (expira_em > inicio_em)))
);


--
-- Name: TABLE avisos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.avisos IS 'Mural de avisos internos (prioridade, destaque, validade, público por módulo).';


--
-- Name: avisos_leituras; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.avisos_leituras (
    aviso_id uuid NOT NULL,
    user_id uuid DEFAULT auth.uid() NOT NULL,
    lido_em timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE avisos_leituras; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.avisos_leituras IS 'Confirmação de leitura de avisos por usuário.';


--
-- Name: backup_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.backup_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    enabled boolean DEFAULT true,
    schedule_cron character varying(100) DEFAULT '0 2 * * *'::character varying,
    weekly_day integer DEFAULT 0,
    retention_daily integer DEFAULT 14,
    retention_weekly integer DEFAULT 8,
    retention_monthly integer DEFAULT 12,
    buckets_included text[] DEFAULT ARRAY['documentos'::text],
    encryption_enabled boolean DEFAULT true,
    last_backup_at timestamp with time zone,
    last_backup_status public.backup_status,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: backup_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.backup_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    backup_type public.backup_type NOT NULL,
    status public.backup_status DEFAULT 'pending'::public.backup_status,
    started_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    triggered_by uuid,
    trigger_mode character varying(20) DEFAULT 'auto'::character varying,
    db_file_path text,
    db_file_size bigint,
    db_checksum character varying(64),
    storage_file_path text,
    storage_file_size bigint,
    storage_checksum character varying(64),
    storage_objects_count integer,
    manifest_path text,
    manifest_checksum character varying(64),
    total_size bigint,
    duration_seconds integer,
    error_message text,
    error_details jsonb,
    system_version character varying(50),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: backup_integrity_checks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.backup_integrity_checks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    backup_id uuid,
    checked_by uuid,
    checked_at timestamp with time zone DEFAULT now(),
    is_valid boolean,
    db_checksum_valid boolean,
    storage_checksum_valid boolean,
    manifest_valid boolean,
    details jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: baixas_patrimonio; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.baixas_patrimonio (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bem_id uuid NOT NULL,
    motivo public.motivo_baixa_patrimonio NOT NULL,
    data_solicitacao date DEFAULT CURRENT_DATE NOT NULL,
    justificativa text NOT NULL,
    valor_residual numeric(12,2),
    comissao_responsavel text,
    status text DEFAULT 'solicitada'::text,
    laudo_tecnico_url text,
    autorizacao_url text,
    termo_baixa_url text,
    aprovado_por uuid,
    data_aprovacao timestamp with time zone,
    motivo_rejeicao text,
    dados_bem_snapshot jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    CONSTRAINT baixas_patrimonio_status_check CHECK ((status = ANY (ARRAY['solicitada'::text, 'em_analise'::text, 'aprovada'::text, 'rejeitada'::text, 'concluida'::text])))
);

ALTER TABLE ONLY public.baixas_patrimonio FORCE ROW LEVEL SECURITY;


--
-- Name: banco_horas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.banco_horas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    servidor_id uuid NOT NULL,
    mes integer NOT NULL,
    ano integer NOT NULL,
    saldo_anterior numeric(6,2) DEFAULT 0,
    horas_extras numeric(6,2) DEFAULT 0,
    horas_compensadas numeric(6,2) DEFAULT 0,
    saldo_atual numeric(6,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    created_by_servidor_id uuid,
    updated_by uuid,
    updated_by_servidor_id uuid
);


--
-- Name: bancos_cnab; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bancos_cnab (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo_banco character varying(3) NOT NULL,
    nome text NOT NULL,
    nome_reduzido character varying(30),
    layout_cnab240 boolean DEFAULT true,
    layout_cnab400 boolean DEFAULT false,
    configuracao_cnab240 jsonb,
    configuracao_cnab400 jsonb,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    created_by_servidor_id uuid,
    updated_by uuid,
    updated_by_servidor_id uuid
);


--
-- Name: cadastro_arbitros; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cadastro_arbitros (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    status text DEFAULT 'enviado'::text NOT NULL,
    nome text NOT NULL,
    nacionalidade text DEFAULT 'brasileira'::text NOT NULL,
    sexo text NOT NULL,
    data_nascimento date NOT NULL,
    categoria text,
    tipo_sanguineo text,
    fator_rh text,
    cpf text NOT NULL,
    rg text,
    rne text,
    validade_rne date,
    pis_pasep text,
    cep text,
    endereco text,
    complemento text,
    bairro text,
    cidade text,
    uf text,
    email text NOT NULL,
    ddd text,
    celular text NOT NULL,
    modalidade text,
    local_trabalho text,
    funcao text,
    esfera text,
    banco text,
    agencia text,
    conta_corrente text,
    foto_url text,
    documentos_urls jsonb DEFAULT '[]'::jsonb,
    protocolo text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: cadastro_arbitros_modalidades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cadastro_arbitros_modalidades (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    arbitro_id uuid NOT NULL,
    modalidade text NOT NULL,
    categoria text DEFAULT 'estadual'::text NOT NULL,
    status text DEFAULT 'pendente'::text NOT NULL,
    documentos_urls jsonb DEFAULT '[]'::jsonb,
    observacoes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: cadastro_arbitros_protocolo_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cadastro_arbitros_protocolo_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: calendario_federacao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.calendario_federacao (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    federacao_id uuid NOT NULL,
    titulo text NOT NULL,
    descricao text,
    tipo text DEFAULT 'Campeonato'::text NOT NULL,
    data_inicio date NOT NULL,
    data_fim date,
    local text,
    cidade text,
    publico_estimado integer,
    categorias text,
    observacoes text,
    status text DEFAULT 'planejado'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.calendario_federacao FORCE ROW LEVEL SECURITY;


--
-- Name: campanhas_inventario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campanhas_inventario (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    ano integer NOT NULL,
    tipo public.tipo_campanha_inventario DEFAULT 'geral'::public.tipo_campanha_inventario NOT NULL,
    data_inicio date NOT NULL,
    data_fim date NOT NULL,
    unidades_abrangidas uuid[] DEFAULT '{}'::uuid[],
    responsavel_geral_id uuid,
    equipe_coleta uuid[] DEFAULT '{}'::uuid[],
    status text DEFAULT 'planejada'::text,
    observacoes text,
    total_bens_esperados integer DEFAULT 0,
    total_conferidos integer DEFAULT 0,
    total_divergencias integer DEFAULT 0,
    percentual_conclusao numeric(5,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    CONSTRAINT campanhas_inventario_status_check CHECK ((status = ANY (ARRAY['planejada'::text, 'em_andamento'::text, 'pausada'::text, 'concluida'::text, 'cancelada'::text])))
);

ALTER TABLE ONLY public.campanhas_inventario FORCE ROW LEVEL SECURITY;


--
-- Name: campanhas_inventario_unidades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campanhas_inventario_unidades (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    campanha_id uuid NOT NULL,
    unidade_local_id uuid NOT NULL,
    situacao text DEFAULT 'a_visitar'::text NOT NULL,
    equipe text,
    data_prevista date,
    iniciada_em timestamp with time zone,
    concluida_em timestamp with time zone,
    observacao text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid DEFAULT auth.uid(),
    updated_by uuid DEFAULT auth.uid(),
    CONSTRAINT campanhas_inventario_unidades_observacao_check CHECK ((length(observacao) <= 2000)),
    CONSTRAINT campanhas_inventario_unidades_situacao_check CHECK ((situacao = ANY (ARRAY['a_visitar'::text, 'em_vistoria'::text, 'concluida'::text, 'com_pendencia'::text, 'excluida'::text])))
);

ALTER TABLE ONLY public.campanhas_inventario_unidades FORCE ROW LEVEL SECURITY;


--
-- Name: TABLE campanhas_inventario_unidades; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.campanhas_inventario_unidades IS 'Situação de cada unidade local numa campanha de inventário (complementa campanhas_inventario.unidades_abrangidas).';


--
-- Name: cargo_unidade_compatibilidade; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cargo_unidade_compatibilidade (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cargo_id uuid,
    tipo_unidade public.tipo_unidade,
    unidade_especifica_id uuid,
    quantidade_maxima integer DEFAULT 1,
    observacao text,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    created_by_servidor_id uuid,
    updated_at timestamp with time zone,
    updated_by uuid,
    updated_by_servidor_id uuid
);


--
-- Name: TABLE cargo_unidade_compatibilidade; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.cargo_unidade_compatibilidade IS 'Compatibilidade cargo/unidade conforme lei do IDJuv';


--
-- Name: cargos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cargos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    sigla text,
    cbo text,
    categoria public.categoria_cargo NOT NULL,
    nivel_hierarquico integer DEFAULT 1,
    escolaridade text,
    requisitos text[],
    conhecimentos_necessarios text[],
    experiencia_exigida text,
    vencimento_base numeric(12,2),
    atribuicoes text,
    competencias text[],
    responsabilidades text[],
    lei_criacao_numero text,
    lei_criacao_data date,
    lei_criacao_artigo text,
    lei_documento_url text,
    quantidade_vagas integer DEFAULT 1,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    natureza public.natureza_cargo,
    created_by uuid,
    created_by_servidor_id uuid,
    updated_by uuid,
    updated_by_servidor_id uuid
);


--
-- Name: categorias_material; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categorias_material (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo character varying(20) NOT NULL,
    nome character varying(100) NOT NULL,
    tipo character varying(30),
    vida_util_meses integer,
    depreciavel boolean DEFAULT false,
    taxa_depreciacao_anual numeric(5,2),
    conta_contabil character varying(20),
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT categorias_material_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['consumo'::character varying, 'permanente'::character varying, 'servico'::character varying])::text[])))
);


--
-- Name: categorias_noticias_eventos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categorias_noticias_eventos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    slug text NOT NULL,
    descricao text,
    cor text,
    icone text,
    ordem integer DEFAULT 0,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: centros_custo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.centros_custo (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo character varying(20) NOT NULL,
    descricao text NOT NULL,
    unidade_id uuid,
    elemento_despesa character varying(20),
    natureza_despesa character varying(20),
    fonte_recurso character varying(20),
    programa_trabalho character varying(30),
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: cessoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cessoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    servidor_id uuid NOT NULL,
    tipo text NOT NULL,
    orgao_origem text,
    cargo_origem text,
    vinculo_origem text,
    orgao_destino text,
    cargo_destino text,
    onus text,
    funcao_exercida_idjuv text,
    unidade_idjuv_id uuid,
    data_inicio date NOT NULL,
    data_fim date,
    data_retorno date,
    ativa boolean DEFAULT true,
    ato_tipo text,
    ato_numero text,
    ato_data date,
    ato_doe_numero text,
    ato_doe_data date,
    ato_url text,
    ato_retorno_numero text,
    ato_retorno_data date,
    observacoes text,
    fundamentacao_legal text,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid,
    created_by_servidor_id uuid,
    updated_by_servidor_id uuid,
    CONSTRAINT cessoes_onus_check CHECK ((onus = ANY (ARRAY['origem'::text, 'destino'::text, 'compartilhado'::text]))),
    CONSTRAINT cessoes_tipo_check CHECK ((tipo = ANY (ARRAY['entrada'::text, 'saida'::text])))
);

ALTER TABLE ONLY public.cessoes FORCE ROW LEVEL SECURITY;


--
-- Name: checklists_conformidade; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.checklists_conformidade (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo character varying(50) NOT NULL,
    nome character varying(300) NOT NULL,
    descricao text,
    orgao_fiscalizador character varying(100) NOT NULL,
    exercicio integer NOT NULL,
    base_legal text,
    versao integer DEFAULT 1 NOT NULL,
    data_vigencia_inicio date,
    data_vigencia_fim date,
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_by uuid
);


--
-- Name: TABLE checklists_conformidade; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.checklists_conformidade IS 'Checklists de conformidade TCE/TCU/CGU';


--
-- Name: cms_banners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cms_banners (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    titulo text NOT NULL,
    subtitulo text,
    imagem_url text NOT NULL,
    imagem_mobile_url text,
    link_url text,
    link_texto text,
    link_externo boolean DEFAULT false,
    destino public.cms_destino DEFAULT 'portal_home'::public.cms_destino NOT NULL,
    posicao text DEFAULT 'hero'::text,
    ativo boolean DEFAULT true,
    ordem integer DEFAULT 0,
    data_inicio timestamp with time zone,
    data_fim timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: cms_categorias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cms_categorias (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    slug text NOT NULL,
    descricao text,
    cor text,
    icone text,
    destino public.cms_destino,
    ordem integer DEFAULT 0,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: cms_conteudos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cms_conteudos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    titulo text NOT NULL,
    slug text NOT NULL,
    subtitulo text,
    resumo text,
    conteudo text,
    conteudo_html text,
    tipo public.cms_tipo_conteudo DEFAULT 'noticia'::public.cms_tipo_conteudo NOT NULL,
    destino public.cms_destino DEFAULT 'portal_noticias'::public.cms_destino NOT NULL,
    categoria text,
    tags text[] DEFAULT '{}'::text[],
    imagem_destaque_url text,
    imagem_destaque_alt text,
    video_url text,
    meta_title text,
    meta_description text,
    status text DEFAULT 'rascunho'::text NOT NULL,
    destaque boolean DEFAULT false,
    ordem integer DEFAULT 0,
    data_publicacao timestamp with time zone,
    data_expiracao timestamp with time zone,
    autor_id uuid,
    autor_nome text,
    revisor_id uuid,
    revisor_nome text,
    aprovador_id uuid,
    data_aprovacao timestamp with time zone,
    visualizacoes integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT cms_conteudos_status_check CHECK ((status = ANY (ARRAY['rascunho'::text, 'revisao'::text, 'aprovado'::text, 'publicado'::text, 'arquivado'::text])))
);


--
-- Name: cms_galeria_fotos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cms_galeria_fotos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    galeria_id uuid NOT NULL,
    url text NOT NULL,
    thumbnail_url text,
    titulo text,
    legenda text,
    ordem integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: cms_galerias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cms_galerias (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    titulo text NOT NULL,
    slug text NOT NULL,
    descricao text,
    destino text DEFAULT 'portal_noticias'::text NOT NULL,
    categoria text,
    status text DEFAULT 'rascunho'::text NOT NULL,
    imagem_capa_url text,
    autor_id uuid,
    autor_nome text,
    data_publicacao timestamp with time zone,
    visualizacoes integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT cms_galerias_status_check CHECK ((status = ANY (ARRAY['rascunho'::text, 'publicado'::text, 'arquivado'::text])))
);


--
-- Name: cms_media; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cms_media (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    url text NOT NULL,
    filename text NOT NULL,
    alt_text text,
    tipo text DEFAULT 'imagem'::text NOT NULL,
    tamanho_bytes bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT cms_media_tipo_check CHECK ((tipo = ANY (ARRAY['imagem'::text, 'video'::text, 'documento'::text])))
);


--
-- Name: coletas_inventario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coletas_inventario (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    campanha_id uuid NOT NULL,
    bem_id uuid NOT NULL,
    status_coleta public.status_coleta_inventario DEFAULT 'conferido'::public.status_coleta_inventario NOT NULL,
    localizacao_encontrada_unidade_id uuid,
    localizacao_encontrada_sala text,
    localizacao_encontrada_detalhe text,
    responsavel_encontrado_id uuid,
    observacoes text,
    foto_url text,
    data_coleta timestamp with time zone DEFAULT now() NOT NULL,
    usuario_coletor_id uuid,
    dispositivo_info jsonb,
    coordenadas_gps jsonb,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.coletas_inventario FORCE ROW LEVEL SECURITY;


--
-- Name: comissoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comissoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    tipo text NOT NULL,
    modulo public.app_module NOT NULL,
    objeto_tipo text,
    objeto_id uuid,
    ato_tipo text NOT NULL,
    ato_numero text NOT NULL,
    ato_data date NOT NULL,
    ato_doe_numero text,
    ato_doe_data date,
    data_inicio date NOT NULL,
    data_fim date,
    motivo text NOT NULL,
    status text DEFAULT 'ativa'::text NOT NULL,
    observacao text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    created_by_servidor_id uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid,
    updated_by_servidor_id uuid,
    CONSTRAINT comissoes_objeto_check CHECK (((objeto_tipo IS NULL) = (objeto_id IS NULL))),
    CONSTRAINT comissoes_objeto_obrigatorio_check CHECK (((tipo = 'outra'::text) OR ((objeto_tipo IS NOT NULL) AND (objeto_id IS NOT NULL)))),
    CONSTRAINT comissoes_objeto_tipo_check CHECK ((objeto_tipo = ANY (ARRAY['campanha_inventario'::text, 'contrato'::text, 'processo_licitatorio'::text]))),
    CONSTRAINT comissoes_periodo_check CHECK (((data_fim IS NULL) OR (data_fim >= data_inicio))),
    CONSTRAINT comissoes_status_check CHECK ((status = ANY (ARRAY['ativa'::text, 'encerrada'::text]))),
    CONSTRAINT comissoes_tipo_check CHECK ((tipo = ANY (ARRAY['inventario'::text, 'licitacao'::text, 'fiscalizacao_contrato'::text, 'outra'::text])))
);


--
-- Name: TABLE comissoes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.comissoes IS 'Comissões com ato, período e motivo (inventário, licitação, fiscalização de contrato...). Membro de comissão vale só no objeto dela (premissa 6, fase 2); na fase 1 a comissão é só cadastro, não fundamento.';


--
-- Name: comissoes_membros; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comissoes_membros (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    comissao_id uuid NOT NULL,
    servidor_id uuid NOT NULL,
    papel text DEFAULT 'membro'::text NOT NULL,
    data_inicio date,
    data_fim date,
    observacao text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    created_by_servidor_id uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid,
    updated_by_servidor_id uuid,
    CONSTRAINT comissoes_membros_papel_check CHECK ((papel = ANY (ARRAY['presidente'::text, 'membro'::text, 'secretario'::text]))),
    CONSTRAINT comissoes_membros_periodo_check CHECK (((data_fim IS NULL) OR (data_inicio IS NULL) OR (data_fim >= data_inicio)))
);


--
-- Name: TABLE comissoes_membros; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.comissoes_membros IS 'Membros das comissões: papel e período (data_inicio/data_fim nulas = o período da comissão).';


--
-- Name: composicao_cargos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.composicao_cargos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    unidade_id uuid NOT NULL,
    cargo_id uuid NOT NULL,
    quantidade_vagas integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    created_by_servidor_id uuid,
    updated_at timestamp with time zone,
    updated_by uuid,
    updated_by_servidor_id uuid
);


--
-- Name: conciliacoes_inventario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conciliacoes_inventario (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    coleta_id uuid NOT NULL,
    campanha_id uuid NOT NULL,
    bem_id uuid NOT NULL,
    tipo_divergencia text NOT NULL,
    descricao_divergencia text NOT NULL,
    ajuste_proposto text NOT NULL,
    necessita_aprovacao boolean DEFAULT true,
    aprovador_id uuid,
    data_aprovacao timestamp with time zone,
    status text DEFAULT 'pendente'::text,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    CONSTRAINT conciliacoes_inventario_status_check CHECK ((status = ANY (ARRAY['pendente'::text, 'aprovado'::text, 'rejeitado'::text, 'aplicado'::text]))),
    CONSTRAINT conciliacoes_inventario_tipo_divergencia_check CHECK ((tipo_divergencia = ANY (ARRAY['localizacao'::text, 'responsavel'::text, 'situacao'::text, 'outro'::text])))
);

ALTER TABLE ONLY public.conciliacoes_inventario FORCE ROW LEVEL SECURITY;


--
-- Name: config_agrupamento_unidades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.config_agrupamento_unidades (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome character varying(100) NOT NULL,
    descricao text,
    cor character varying(20) DEFAULT '#3b82f6'::character varying,
    ordem integer DEFAULT 0,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    created_by_servidor_id uuid,
    updated_by uuid,
    updated_by_servidor_id uuid
);


--
-- Name: TABLE config_agrupamento_unidades; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.config_agrupamento_unidades IS 'Configuração de agrupamentos de unidades para impressão em lote de frequência';


--
-- Name: config_assinatura_frequencia; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.config_assinatura_frequencia (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome character varying(100) NOT NULL,
    assinatura_servidor_obrigatoria boolean DEFAULT true,
    assinatura_chefia_obrigatoria boolean DEFAULT true,
    assinatura_rh_obrigatoria boolean DEFAULT false,
    tipo_assinatura character varying(20) DEFAULT 'digital'::character varying,
    ordem_assinaturas text[] DEFAULT ARRAY['servidor'::text, 'chefia'::text],
    quem_valida_final character varying(20) DEFAULT 'chefia'::character varying,
    texto_declaracao text DEFAULT 'Declaro que as informações acima são verídicas e correspondem à minha efetiva jornada de trabalho no período.'::text,
    ativo boolean DEFAULT true,
    padrao boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    instituicao_id uuid,
    codigo character varying(50),
    created_by uuid,
    created_by_servidor_id uuid,
    updated_by uuid,
    updated_by_servidor_id uuid,
    CONSTRAINT config_assinatura_frequencia_quem_valida_final_check CHECK (((quem_valida_final)::text = ANY ((ARRAY['servidor'::character varying, 'chefia'::character varying, 'rh'::character varying])::text[]))),
    CONSTRAINT config_assinatura_frequencia_tipo_assinatura_check CHECK (((tipo_assinatura)::text = ANY ((ARRAY['manual'::character varying, 'digital'::character varying, 'ambas'::character varying])::text[])))
);


--
-- Name: TABLE config_assinatura_frequencia; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.config_assinatura_frequencia IS 'Configurações de assinatura de folha de frequência';


--
-- Name: config_assinatura_reuniao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.config_assinatura_reuniao (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome_configuracao text NOT NULL,
    cargo_assinante_1 text,
    nome_assinante_1 text,
    cargo_assinante_2 text,
    nome_assinante_2 text,
    texto_cabecalho text,
    texto_rodape text,
    padrao boolean DEFAULT false,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: config_autarquia; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.config_autarquia (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cnpj character varying(18) NOT NULL,
    razao_social text NOT NULL,
    nome_fantasia text,
    endereco_logradouro text,
    endereco_numero character varying(30),
    endereco_complemento text,
    endereco_bairro text,
    endereco_cidade text DEFAULT 'Boa Vista'::text,
    endereco_uf character varying(2) DEFAULT 'RR'::character varying,
    endereco_cep character varying(9),
    telefone character varying(30),
    email_institucional text,
    site text,
    responsavel_legal text,
    cpf_responsavel character varying(14),
    cargo_responsavel text,
    responsavel_contabil text,
    cpf_contabil character varying(14),
    crc_contabil character varying(30),
    regime_tributario character varying(100) DEFAULT 'autarquia_estadual'::character varying,
    natureza_juridica character varying(100) DEFAULT '1244'::character varying,
    codigo_municipio character varying(7) DEFAULT '1400100'::character varying,
    esocial_ambiente character varying(50) DEFAULT 'producao_restrita'::character varying,
    esocial_processo_emissao character varying(10) DEFAULT '1'::character varying,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    created_by_servidor_id uuid,
    updated_by_servidor_id uuid
);


--
-- Name: config_compensacao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.config_compensacao (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome character varying(100) NOT NULL,
    permite_banco_horas boolean DEFAULT true,
    compensacao_automatica boolean DEFAULT false,
    compensacao_manual boolean DEFAULT true,
    prazo_compensar_dias integer DEFAULT 90,
    limite_acumulo_horas numeric(6,2) DEFAULT 40,
    limite_horas_extras_dia numeric(4,2) DEFAULT 2,
    limite_horas_extras_mes numeric(5,2) DEFAULT 40,
    quem_autoriza character varying(30) DEFAULT 'chefia'::character varying,
    exibe_na_frequencia boolean DEFAULT true,
    exibe_na_impressao boolean DEFAULT true,
    aplicar_a_todos boolean DEFAULT true,
    unidade_id uuid,
    ativo boolean DEFAULT true,
    padrao boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    instituicao_id uuid,
    codigo character varying(50),
    created_by_servidor_id uuid,
    updated_by uuid,
    updated_by_servidor_id uuid,
    CONSTRAINT config_compensacao_quem_autoriza_check CHECK (((quem_autoriza)::text = ANY ((ARRAY['chefia'::character varying, 'rh'::character varying, 'ambos'::character varying])::text[])))
);


--
-- Name: TABLE config_compensacao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.config_compensacao IS 'Regras de compensação de horas e banco de horas';


--
-- Name: config_envio; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.config_envio (
    canal text NOT NULL,
    ativo boolean DEFAULT false NOT NULL,
    provedor text,
    remetente_nome text,
    remetente_email text,
    responder_para text,
    smtp_host text,
    smtp_porta integer,
    smtp_seguranca text,
    smtp_usuario text,
    marca_nome text,
    marca_logo_url text,
    marca_cor text,
    rodape text,
    wa_phone_number_id text,
    wa_business_account_id text,
    wa_templates jsonb DEFAULT '{}'::jsonb NOT NULL,
    segredo_id uuid,
    segredo_atualizado_em timestamp with time zone,
    updated_by uuid DEFAULT auth.uid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT config_envio_canal_check CHECK ((canal = ANY (ARRAY['email'::text, 'whatsapp'::text]))),
    CONSTRAINT config_envio_marca_cor_check CHECK (((marca_cor IS NULL) OR (marca_cor ~ '^#[0-9A-Fa-f]{6}$'::text))),
    CONSTRAINT config_envio_marca_logo_url_check CHECK (((marca_logo_url IS NULL) OR ((char_length(marca_logo_url) <= 500) AND (marca_logo_url ~ '^https://[^[:space:]"''<>]+$'::text)))),
    CONSTRAINT config_envio_marca_nome_check CHECK (((marca_nome IS NULL) OR (char_length(marca_nome) <= 200))),
    CONSTRAINT config_envio_provedor_check CHECK ((provedor = ANY (ARRAY['smtp'::text, 'resend'::text, 'meta_cloud'::text]))),
    CONSTRAINT config_envio_provedor_ck CHECK (((provedor IS NULL) OR ((canal = 'email'::text) AND (provedor = ANY (ARRAY['smtp'::text, 'resend'::text]))) OR ((canal = 'whatsapp'::text) AND (provedor = 'meta_cloud'::text)))),
    CONSTRAINT config_envio_remetente_email_check CHECK (((remetente_email IS NULL) OR (remetente_email ~* '^[^@[:space:]<>]+@[^@[:space:]<>]+\.[^@[:space:]<>]+$'::text))),
    CONSTRAINT config_envio_remetente_nome_check CHECK (((remetente_nome IS NULL) OR (char_length(remetente_nome) <= 120))),
    CONSTRAINT config_envio_responder_para_check CHECK (((responder_para IS NULL) OR (responder_para ~* '^[^@[:space:]<>]+@[^@[:space:]<>]+\.[^@[:space:]<>]+$'::text))),
    CONSTRAINT config_envio_rodape_check CHECK (((rodape IS NULL) OR (char_length(rodape) <= 500))),
    CONSTRAINT config_envio_smtp_host_check CHECK (((smtp_host IS NULL) OR (smtp_host ~ '^[A-Za-z0-9.-]{1,253}$'::text))),
    CONSTRAINT config_envio_smtp_porta_check CHECK (((smtp_porta IS NULL) OR (smtp_porta = ANY (ARRAY[25, 465, 587, 2525])))),
    CONSTRAINT config_envio_smtp_seguranca_check CHECK (((smtp_seguranca IS NULL) OR (smtp_seguranca = ANY (ARRAY['ssl'::text, 'starttls'::text])))),
    CONSTRAINT config_envio_smtp_usuario_check CHECK (((smtp_usuario IS NULL) OR (char_length(smtp_usuario) <= 255))),
    CONSTRAINT config_envio_wa_business_account_id_check CHECK (((wa_business_account_id IS NULL) OR (wa_business_account_id ~ '^[0-9]{5,30}$'::text))),
    CONSTRAINT config_envio_wa_phone_number_id_check CHECK (((wa_phone_number_id IS NULL) OR (wa_phone_number_id ~ '^[0-9]{5,30}$'::text))),
    CONSTRAINT config_envio_wa_templates_check CHECK ((jsonb_typeof(wa_templates) = 'object'::text))
);


--
-- Name: TABLE config_envio; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.config_envio IS 'Configuração de envio por canal (e-mail/WhatsApp) da instância. Credenciais ficam no Vault (segredo_id).';


--
-- Name: config_fechamento_folha; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.config_fechamento_folha (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    instituicao_id uuid,
    nome character varying(100) DEFAULT 'Padrão'::character varying NOT NULL,
    descricao text,
    dia_limite_lancamento integer DEFAULT 20,
    dia_limite_processamento integer DEFAULT 25,
    dia_pagamento integer DEFAULT 30,
    bloqueia_alteracoes boolean DEFAULT true,
    permite_reabertura boolean DEFAULT true,
    exige_aprovacao_reabertura boolean DEFAULT true,
    perfil_aprovador_reabertura character varying(50) DEFAULT 'admin'::character varying,
    exige_frequencia_fechada boolean DEFAULT true,
    exige_todas_fichas_processadas boolean DEFAULT true,
    exige_validacao_inconsistencias boolean DEFAULT true,
    permite_fechar_com_pendencias boolean DEFAULT false,
    gera_remessa_automatica boolean DEFAULT false,
    conta_remessa_padrao_id uuid,
    gera_esocial_automatico boolean DEFAULT false,
    registra_historico_alteracoes boolean DEFAULT true,
    prazo_guarda_historico_dias integer DEFAULT 1825,
    padrao boolean DEFAULT false,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid,
    created_by_servidor_id uuid,
    updated_by_servidor_id uuid
);


--
-- Name: TABLE config_fechamento_folha; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.config_fechamento_folha IS 'Configuração de regras de fechamento e workflow da folha';


--
-- Name: config_fechamento_frequencia; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.config_fechamento_frequencia (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ano integer NOT NULL,
    mes integer NOT NULL,
    data_limite_servidor date,
    data_limite_chefia date,
    data_limite_rh date,
    status character varying(20) DEFAULT 'aberto'::character varying,
    permite_reabertura boolean DEFAULT true,
    prazo_reabertura_dias integer DEFAULT 5,
    reabertura_exige_justificativa boolean DEFAULT true,
    servidor_pode_fechar boolean DEFAULT true,
    chefia_pode_fechar boolean DEFAULT true,
    rh_pode_fechar boolean DEFAULT true,
    fechado_em timestamp with time zone,
    fechado_por uuid,
    consolidado_em timestamp with time zone,
    consolidado_por uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    instituicao_id uuid,
    created_by uuid,
    created_by_servidor_id uuid,
    updated_by uuid,
    updated_by_servidor_id uuid,
    CONSTRAINT config_fechamento_frequencia_mes_check CHECK (((mes >= 1) AND (mes <= 12))),
    CONSTRAINT config_fechamento_frequencia_status_check CHECK (((status)::text = ANY ((ARRAY['aberto'::character varying, 'fechado_servidor'::character varying, 'fechado_chefia'::character varying, 'consolidado'::character varying])::text[])))
);


--
-- Name: TABLE config_fechamento_frequencia; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.config_fechamento_frequencia IS 'Configurações de fechamento mensal de frequência';


--
-- Name: config_incidencias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.config_incidencias (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    instituicao_id uuid,
    rubrica_origem_id uuid NOT NULL,
    rubrica_destino_id uuid NOT NULL,
    tipo_incidencia character varying(30) NOT NULL,
    percentual_incidencia numeric(8,4) DEFAULT 100,
    valor_limite numeric(15,2),
    vigencia_inicio date DEFAULT CURRENT_DATE,
    vigencia_fim date,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    created_by_servidor_id uuid,
    updated_at timestamp with time zone,
    updated_by uuid,
    updated_by_servidor_id uuid,
    CONSTRAINT config_incidencias_tipo_incidencia_check CHECK (((tipo_incidencia)::text = ANY ((ARRAY['base_calculo'::character varying, 'deduz_base'::character varying, 'proporcionaliza'::character varying, 'condiciona'::character varying, 'exclui'::character varying])::text[])))
);


--
-- Name: TABLE config_incidencias; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.config_incidencias IS 'Define como rubricas incidem umas sobre as outras';


--
-- Name: config_institucional; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.config_institucional (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo character varying(20) NOT NULL,
    nome character varying(255) NOT NULL,
    nome_fantasia character varying(255),
    cnpj character varying(18) NOT NULL,
    natureza_juridica character varying(100),
    endereco jsonb DEFAULT '{}'::jsonb,
    contato jsonb DEFAULT '{}'::jsonb,
    responsavel_legal character varying(255),
    cpf_responsavel character varying(14),
    cargo_responsavel character varying(100),
    logo_url text,
    brasao_url text,
    cores jsonb DEFAULT '{}'::jsonb,
    expediente jsonb DEFAULT '{"fim": "14:00", "dias": [1, 2, 3, 4, 5], "inicio": "08:00"}'::jsonb,
    politicas jsonb DEFAULT '{}'::jsonb,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid,
    created_by_servidor_id uuid,
    updated_by_servidor_id uuid
);


--
-- Name: TABLE config_institucional; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.config_institucional IS 'Cadastro de instituições para suporte multi-institucional. Cada instituição tem seus próprios parâmetros.';


--
-- Name: COLUMN config_institucional.codigo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.config_institucional.codigo IS 'Código único da instituição (ex: IDJUV)';


--
-- Name: COLUMN config_institucional.expediente; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.config_institucional.expediente IS 'Horário de expediente padrão: {inicio, fim, dias}';


--
-- Name: COLUMN config_institucional.politicas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.config_institucional.politicas IS 'Políticas gerais configuráveis em JSON';


--
-- Name: config_jornada_padrao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.config_jornada_padrao (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome character varying(100) NOT NULL,
    descricao text,
    carga_horaria_diaria numeric(4,2) DEFAULT 8 NOT NULL,
    carga_horaria_semanal numeric(5,2) DEFAULT 40 NOT NULL,
    entrada_manha time without time zone,
    saida_manha time without time zone,
    entrada_tarde time without time zone,
    saida_tarde time without time zone,
    intervalo_minimo integer DEFAULT 60,
    intervalo_maximo integer DEFAULT 120,
    intervalo_obrigatorio boolean DEFAULT true,
    intervalo_remunerado boolean DEFAULT false,
    tolerancia_atraso integer DEFAULT 10,
    tolerancia_saida_antecipada integer DEFAULT 10,
    tolerancia_intervalo integer DEFAULT 5,
    banco_tolerancia_diario boolean DEFAULT false,
    banco_tolerancia_mensal boolean DEFAULT true,
    escopo character varying(20) DEFAULT 'orgao'::character varying,
    unidade_id uuid,
    cargo_id uuid,
    servidor_id uuid,
    ativo boolean DEFAULT true,
    padrao boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    vigencia_inicio date,
    vigencia_fim date,
    fundamentacao_legal text,
    instituicao_id uuid,
    created_by_servidor_id uuid,
    updated_by_servidor_id uuid,
    CONSTRAINT config_jornada_padrao_escopo_check CHECK (((escopo)::text = ANY ((ARRAY['orgao'::character varying, 'unidade'::character varying, 'cargo'::character varying, 'servidor'::character varying])::text[])))
);


--
-- Name: TABLE config_jornada_padrao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.config_jornada_padrao IS 'Configurações de jornada de trabalho por instituição, unidade, cargo ou servidor';


--
-- Name: config_menu_publico; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.config_menu_publico (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    chave text NOT NULL,
    label text NOT NULL,
    visivel boolean DEFAULT true NOT NULL,
    ordem integer DEFAULT 0 NOT NULL,
    alterado_por uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: config_motivos_desligamento; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.config_motivos_desligamento (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    instituicao_id uuid NOT NULL,
    codigo character varying(50) NOT NULL,
    nome character varying(100) NOT NULL,
    descricao text,
    aplica_efetivo boolean DEFAULT true NOT NULL,
    aplica_comissionado boolean DEFAULT true NOT NULL,
    aplica_cedido boolean DEFAULT true NOT NULL,
    gera_vacancia boolean DEFAULT true NOT NULL,
    requer_portaria boolean DEFAULT true NOT NULL,
    requer_doe boolean DEFAULT false NOT NULL,
    ordem integer DEFAULT 0,
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid,
    created_by_servidor_id uuid,
    updated_by_servidor_id uuid
);

ALTER TABLE ONLY public.config_motivos_desligamento FORCE ROW LEVEL SECURITY;


--
-- Name: TABLE config_motivos_desligamento; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.config_motivos_desligamento IS 'Configuração dos motivos de desligamento/encerramento de provimento por instituição';


--
-- Name: config_paginas_historico; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.config_paginas_historico (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pagina_id uuid NOT NULL,
    acao text NOT NULL,
    dados_anteriores jsonb,
    dados_novos jsonb,
    usuario_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: config_paginas_publicas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.config_paginas_publicas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo text NOT NULL,
    nome text NOT NULL,
    descricao text,
    rota text NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    em_manutencao boolean DEFAULT false NOT NULL,
    mensagem_manutencao text DEFAULT 'Esta página está temporariamente em manutenção. Voltaremos em breve!'::text,
    titulo_manutencao text DEFAULT 'Página em Manutenção'::text,
    previsao_retorno timestamp with time zone,
    alterado_por uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: config_parametros_meta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.config_parametros_meta (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo character varying(100) NOT NULL,
    dominio character varying(20) NOT NULL,
    tipo_dado character varying(20) NOT NULL,
    tipo_valor character varying(20) NOT NULL,
    permite_nivel_instituicao boolean DEFAULT true,
    permite_nivel_unidade boolean DEFAULT false,
    permite_nivel_tipo_servidor boolean DEFAULT false,
    permite_nivel_servidor boolean DEFAULT false,
    requer_vigencia boolean DEFAULT false,
    requer_aprovacao boolean DEFAULT false,
    editavel_producao boolean DEFAULT true,
    nome character varying(100) NOT NULL,
    descricao text,
    valor_padrao jsonb,
    ativo boolean DEFAULT true,
    ordem integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    CONSTRAINT config_parametros_meta_dominio_check CHECK (((dominio)::text = ANY ((ARRAY['INST'::character varying, 'CAL'::character varying, 'VF'::character varying, 'FREQ'::character varying, 'FOLHA'::character varying, 'DOC'::character varying])::text[]))),
    CONSTRAINT config_parametros_meta_tipo_dado_check CHECK (((tipo_dado)::text = ANY ((ARRAY['simples'::character varying, 'json'::character varying, 'temporal'::character varying, 'condicional'::character varying])::text[]))),
    CONSTRAINT config_parametros_meta_tipo_valor_check CHECK (((tipo_valor)::text = ANY ((ARRAY['text'::character varying, 'numeric'::character varying, 'boolean'::character varying, 'date'::character varying, 'json'::character varying])::text[])))
);


--
-- Name: TABLE config_parametros_meta; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.config_parametros_meta IS 'Catálogo de metadados dos parâmetros. Define quais parâmetros existem, seus tipos e regras.';


--
-- Name: COLUMN config_parametros_meta.codigo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.config_parametros_meta.codigo IS 'Código único do parâmetro (ex: FREQ.JORNADA, FOLHA.SAL_MINIMO)';


--
-- Name: COLUMN config_parametros_meta.dominio; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.config_parametros_meta.dominio IS 'Domínio funcional: INST=Institucional, CAL=Calendário, VF=Vida Funcional, FREQ=Frequência, FOLHA=Folha, DOC=Documentos';


--
-- Name: COLUMN config_parametros_meta.permite_nivel_instituicao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.config_parametros_meta.permite_nivel_instituicao IS 'Define se pode ser configurado no nível institucional';


--
-- Name: COLUMN config_parametros_meta.permite_nivel_unidade; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.config_parametros_meta.permite_nivel_unidade IS 'Define se pode ser configurado no nível de unidade';


--
-- Name: COLUMN config_parametros_meta.permite_nivel_tipo_servidor; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.config_parametros_meta.permite_nivel_tipo_servidor IS 'Define se pode ser configurado no nível de tipo de servidor';


--
-- Name: COLUMN config_parametros_meta.permite_nivel_servidor; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.config_parametros_meta.permite_nivel_servidor IS 'Define se pode ser configurado no nível de servidor individual';


--
-- Name: COLUMN config_parametros_meta.valor_padrao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.config_parametros_meta.valor_padrao IS 'Valor fallback do sistema em JSON';


--
-- Name: config_parametros_valores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.config_parametros_valores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    instituicao_id uuid NOT NULL,
    parametro_codigo character varying(100) NOT NULL,
    unidade_id uuid,
    tipo_servidor character varying(50),
    servidor_id uuid,
    valor jsonb NOT NULL,
    vigencia_inicio date DEFAULT CURRENT_DATE NOT NULL,
    vigencia_fim date,
    ativo boolean DEFAULT true,
    versao integer DEFAULT 1,
    versao_anterior_id uuid,
    justificativa text,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid,
    CONSTRAINT chk_vigencia_valida CHECK (((vigencia_fim IS NULL) OR (vigencia_fim >= vigencia_inicio)))
);


--
-- Name: TABLE config_parametros_valores; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.config_parametros_valores IS 'Valores dos parâmetros configuráveis com hierarquia e vigência temporal.
   DEPENDÊNCIA: Utiliza audit_logs e audit_action para registro de alterações.
   TRIGGER: trg_audit_parametros registra todas as modificações nesta tabela.';


--
-- Name: COLUMN config_parametros_valores.unidade_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.config_parametros_valores.unidade_id IS 'Se preenchido, parâmetro aplica-se apenas a esta unidade';


--
-- Name: COLUMN config_parametros_valores.tipo_servidor; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.config_parametros_valores.tipo_servidor IS 'Se preenchido, parâmetro aplica-se apenas a este tipo de servidor';


--
-- Name: COLUMN config_parametros_valores.servidor_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.config_parametros_valores.servidor_id IS 'Se preenchido, parâmetro aplica-se apenas a este servidor';


--
-- Name: COLUMN config_parametros_valores.valor; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.config_parametros_valores.valor IS 'Valor do parâmetro em JSONB. Para simples: {"v": 123}. Para JSON: objeto completo.';


--
-- Name: COLUMN config_parametros_valores.versao_anterior_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.config_parametros_valores.versao_anterior_id IS 'Referência para a versão anterior (versionamento)';


--
-- Name: CONSTRAINT chk_vigencia_valida ON config_parametros_valores; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT chk_vigencia_valida ON public.config_parametros_valores IS 'Garante que a data de fim de vigência não seja anterior à data de início';


--
-- Name: config_regras_calculo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.config_regras_calculo (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    instituicao_id uuid,
    codigo character varying(50) NOT NULL,
    nome character varying(100) NOT NULL,
    descricao text,
    escopo character varying(30) DEFAULT 'geral'::character varying NOT NULL,
    escopo_id uuid,
    tipo_regra character varying(30) NOT NULL,
    parametros jsonb DEFAULT '{}'::jsonb NOT NULL,
    condicoes jsonb DEFAULT '[]'::jsonb,
    vigencia_inicio date DEFAULT CURRENT_DATE,
    vigencia_fim date,
    prioridade integer DEFAULT 0,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid,
    created_by_servidor_id uuid,
    updated_by_servidor_id uuid,
    CONSTRAINT config_regras_calculo_escopo_check CHECK (((escopo)::text = ANY ((ARRAY['geral'::character varying, 'cargo'::character varying, 'vinculo'::character varying, 'regime'::character varying, 'unidade'::character varying, 'servidor'::character varying])::text[]))),
    CONSTRAINT config_regras_calculo_tipo_regra_check CHECK (((tipo_regra)::text = ANY ((ARRAY['calculo_base'::character varying, 'adicional_tempo'::character varying, 'gratificacao'::character varying, 'desconto_legal'::character varying, 'desconto_voluntario'::character varying, 'proporcionalidade'::character varying, 'arredondamento'::character varying, 'teto'::character varying])::text[])))
);


--
-- Name: TABLE config_regras_calculo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.config_regras_calculo IS 'Regras de cálculo parametrizadas para o motor de folha';


--
-- Name: config_rubricas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.config_rubricas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    instituicao_id uuid,
    tipo_rubrica_id uuid,
    codigo character varying(20) NOT NULL,
    nome character varying(100) NOT NULL,
    descricao text,
    natureza character varying(20) NOT NULL,
    tipo_calculo character varying(20) DEFAULT 'fixo'::character varying NOT NULL,
    valor_fixo numeric(15,2),
    percentual numeric(8,4),
    formula text,
    rubrica_base_id uuid,
    valor_minimo numeric(15,2),
    valor_maximo numeric(15,2),
    teto_constitucional boolean DEFAULT false,
    incide_inss boolean DEFAULT false,
    incide_irrf boolean DEFAULT false,
    incide_fgts boolean DEFAULT false,
    incide_ferias boolean DEFAULT false,
    incide_13_salario boolean DEFAULT false,
    incide_rescisao boolean DEFAULT false,
    compoe_base_inss boolean DEFAULT false,
    compoe_base_irrf boolean DEFAULT false,
    compoe_base_fgts boolean DEFAULT false,
    automatica boolean DEFAULT true,
    obrigatoria boolean DEFAULT false,
    proporcional_dias boolean DEFAULT false,
    proporcional_horas boolean DEFAULT false,
    desconta_faltas boolean DEFAULT false,
    codigo_esocial character varying(20),
    natureza_esocial character varying(10),
    vigencia_inicio date DEFAULT CURRENT_DATE,
    vigencia_fim date,
    ordem_calculo integer DEFAULT 0,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid,
    created_by_servidor_id uuid,
    updated_by_servidor_id uuid,
    CONSTRAINT config_rubricas_natureza_check CHECK (((natureza)::text = ANY ((ARRAY['provento'::character varying, 'desconto'::character varying, 'encargo'::character varying, 'informativo'::character varying])::text[]))),
    CONSTRAINT config_rubricas_tipo_calculo_check CHECK (((tipo_calculo)::text = ANY ((ARRAY['fixo'::character varying, 'percentual'::character varying, 'formula'::character varying, 'referencia'::character varying, 'tabela'::character varying, 'manual'::character varying])::text[])))
);


--
-- Name: TABLE config_rubricas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.config_rubricas IS 'Configuração parametrizada de rubricas com regras de cálculo e incidência';


--
-- Name: config_situacoes_funcionais; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.config_situacoes_funcionais (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    instituicao_id uuid NOT NULL,
    codigo character varying(50) NOT NULL,
    nome character varying(100) NOT NULL,
    descricao text,
    cor_classe character varying(100) DEFAULT 'bg-muted text-muted-foreground border-muted'::character varying,
    icone character varying(50),
    permite_trabalho boolean DEFAULT true NOT NULL,
    permite_remuneracao boolean DEFAULT true NOT NULL,
    exige_documento boolean DEFAULT false NOT NULL,
    situacao_final boolean DEFAULT false NOT NULL,
    ordem integer DEFAULT 0,
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid,
    created_by_servidor_id uuid,
    updated_by_servidor_id uuid
);

ALTER TABLE ONLY public.config_situacoes_funcionais FORCE ROW LEVEL SECURITY;


--
-- Name: TABLE config_situacoes_funcionais; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.config_situacoes_funcionais IS 'Configuração das situações funcionais com labels, cores e regras por instituição';


--
-- Name: config_tipos_ato; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.config_tipos_ato (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    instituicao_id uuid NOT NULL,
    codigo character varying(50) NOT NULL,
    nome character varying(100) NOT NULL,
    sigla character varying(20),
    descricao text,
    requer_doe boolean DEFAULT true NOT NULL,
    requer_assinatura boolean DEFAULT true NOT NULL,
    ordem integer DEFAULT 0,
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid,
    created_by_servidor_id uuid,
    updated_by_servidor_id uuid
);

ALTER TABLE ONLY public.config_tipos_ato FORCE ROW LEVEL SECURITY;


--
-- Name: TABLE config_tipos_ato; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.config_tipos_ato IS 'Configuração dos tipos de ato administrativo por instituição';


--
-- Name: config_tipos_onus; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.config_tipos_onus (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    instituicao_id uuid NOT NULL,
    codigo character varying(50) NOT NULL,
    nome character varying(100) NOT NULL,
    descricao text,
    ordem integer DEFAULT 0,
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    created_by_servidor_id uuid,
    updated_at timestamp with time zone,
    updated_by uuid,
    updated_by_servidor_id uuid
);

ALTER TABLE ONLY public.config_tipos_onus FORCE ROW LEVEL SECURITY;


--
-- Name: TABLE config_tipos_onus; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.config_tipos_onus IS 'Configuração dos tipos de ônus para cessões por instituição';


--
-- Name: config_tipos_rubrica; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.config_tipos_rubrica (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    instituicao_id uuid,
    codigo character varying(20) NOT NULL,
    nome character varying(100) NOT NULL,
    descricao text,
    natureza character varying(20) NOT NULL,
    grupo character varying(50),
    subgrupo character varying(50),
    ordem_exibicao integer DEFAULT 0,
    exibe_contracheque boolean DEFAULT true,
    exibe_relatorio boolean DEFAULT true,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid,
    created_by_servidor_id uuid,
    updated_by_servidor_id uuid,
    CONSTRAINT config_tipos_rubrica_natureza_check CHECK (((natureza)::text = ANY ((ARRAY['provento'::character varying, 'desconto'::character varying, 'encargo'::character varying, 'informativo'::character varying])::text[])))
);


--
-- Name: TABLE config_tipos_rubrica; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.config_tipos_rubrica IS 'Categorias de rubricas para agrupamento e classificação';


--
-- Name: config_tipos_servidor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.config_tipos_servidor (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    instituicao_id uuid NOT NULL,
    codigo character varying(50) NOT NULL,
    nome character varying(100) NOT NULL,
    descricao text,
    cor_classe character varying(100) DEFAULT 'bg-muted text-muted-foreground border-muted'::character varying,
    icone character varying(50),
    permite_cargo boolean DEFAULT true NOT NULL,
    tipos_cargo_permitidos character varying(50)[] DEFAULT '{}'::character varying[],
    permite_lotacao_interna boolean DEFAULT true NOT NULL,
    permite_lotacao_externa boolean DEFAULT false NOT NULL,
    requer_provimento boolean DEFAULT true NOT NULL,
    requer_orgao_origem boolean DEFAULT false NOT NULL,
    requer_orgao_destino boolean DEFAULT false NOT NULL,
    impacta_folha boolean DEFAULT true NOT NULL,
    impacta_frequencia boolean DEFAULT true NOT NULL,
    gera_matricula boolean DEFAULT true NOT NULL,
    ordem integer DEFAULT 0,
    ativo boolean DEFAULT true NOT NULL,
    vigencia_inicio date DEFAULT CURRENT_DATE NOT NULL,
    vigencia_fim date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid,
    created_by_servidor_id uuid,
    updated_by_servidor_id uuid,
    CONSTRAINT chk_tipos_servidor_vigencia CHECK (((vigencia_fim IS NULL) OR (vigencia_fim >= vigencia_inicio)))
);

ALTER TABLE ONLY public.config_tipos_servidor FORCE ROW LEVEL SECURITY;


--
-- Name: TABLE config_tipos_servidor; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.config_tipos_servidor IS 'Configuração dos tipos de servidor com labels, cores e regras de negócio por instituição';


--
-- Name: configuracao_jornada; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.configuracao_jornada (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    servidor_id uuid NOT NULL,
    carga_horaria_semanal numeric(4,2) DEFAULT 40,
    horas_por_dia numeric(4,2) DEFAULT 8,
    dias_trabalho integer[] DEFAULT ARRAY[1, 2, 3, 4, 5],
    tolerancia_atraso integer DEFAULT 10,
    tolerancia_saida_antecipada integer DEFAULT 10,
    exige_localizacao boolean DEFAULT false,
    permite_ponto_remoto boolean DEFAULT true,
    exige_foto boolean DEFAULT false,
    permite_compensacao boolean DEFAULT true,
    limite_banco_horas numeric(6,2) DEFAULT 40,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    created_by_servidor_id uuid,
    updated_by uuid,
    updated_by_servidor_id uuid
);


--
-- Name: consignacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.consignacoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    servidor_id uuid,
    rubrica_id uuid,
    consignataria_nome text NOT NULL,
    consignataria_cnpj character varying(18),
    consignataria_codigo character varying(20),
    numero_contrato character varying(50),
    tipo_consignacao character varying(30),
    valor_total numeric(15,2),
    valor_parcela numeric(15,2) NOT NULL,
    total_parcelas integer NOT NULL,
    parcelas_pagas integer DEFAULT 0,
    saldo_devedor numeric(15,2),
    data_inicio date NOT NULL,
    data_fim date,
    competencia_inicio character varying(7),
    competencia_fim character varying(7),
    ativo boolean DEFAULT true,
    suspenso boolean DEFAULT false,
    motivo_suspensao text,
    data_suspensao date,
    quitado boolean DEFAULT false,
    data_quitacao date,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    created_by_servidor_id uuid,
    updated_by uuid,
    updated_by_servidor_id uuid
);

ALTER TABLE ONLY public.consignacoes FORCE ROW LEVEL SECURITY;


--
-- Name: contas_autarquia; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contas_autarquia (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    banco_id uuid,
    descricao text NOT NULL,
    agencia character varying(10) NOT NULL,
    agencia_digito character varying(2),
    conta character varying(20) NOT NULL,
    conta_digito character varying(2),
    tipo_conta character varying(20) DEFAULT 'corrente'::character varying,
    convenio_pagamento character varying(20),
    codigo_cedente character varying(20),
    codigo_transmissao character varying(20),
    uso_principal character varying(30) DEFAULT 'folha'::character varying,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    created_by_servidor_id uuid,
    updated_by uuid,
    updated_by_servidor_id uuid
);


--
-- Name: contatos_eventos_esportivos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contatos_eventos_esportivos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tipo text NOT NULL,
    titulo text NOT NULL,
    subtitulo text,
    valor text NOT NULL,
    icone text,
    evento text DEFAULT 'seletivas_2026'::text NOT NULL,
    ordem integer DEFAULT 0,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: conteudo_rascunho; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conteudo_rascunho (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tipo public.tipo_conteudo_institucional NOT NULL,
    identificador text,
    titulo text,
    conteudo text NOT NULL,
    conteudo_estruturado jsonb,
    status public.status_conteudo DEFAULT 'rascunho'::public.status_conteudo,
    criado_por uuid,
    atualizado_por uuid,
    aprovado_por uuid,
    aprovado_em timestamp with time zone,
    motivo_rejeicao text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: contratos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contratos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero_contrato character varying(30) NOT NULL,
    ano integer DEFAULT EXTRACT(year FROM CURRENT_DATE) NOT NULL,
    processo_licitatorio_id uuid,
    fornecedor_id uuid NOT NULL,
    objeto text NOT NULL,
    objeto_resumido character varying(500),
    valor_inicial numeric(15,2) NOT NULL,
    valor_atual numeric(15,2) NOT NULL,
    valor_executado numeric(15,2) DEFAULT 0,
    saldo_contrato numeric(15,2),
    data_assinatura date NOT NULL,
    data_inicio date NOT NULL,
    data_fim date NOT NULL,
    data_fim_atual date,
    status public.status_contrato DEFAULT 'rascunho'::public.status_contrato,
    gestor_id uuid,
    fiscal_id uuid,
    garantia_tipo character varying(50),
    garantia_valor numeric(15,2),
    garantia_vencimento date,
    dotacao_orcamentaria text,
    fonte_recurso character varying(50),
    data_publicacao_doe date,
    numero_doe character varying(20),
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid
);


--
-- Name: controles_internos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.controles_internos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo character varying(50) NOT NULL,
    nome character varying(300) NOT NULL,
    descricao text NOT NULL,
    objetivo text,
    tipo public.tipo_controle NOT NULL,
    periodicidade public.periodicidade_controle NOT NULL,
    modulo_sistema character varying(100),
    processo_raci_id uuid,
    risco_id uuid,
    responsavel_id uuid,
    unidade_responsavel_id uuid,
    procedimento text,
    indicador_efetividade text,
    meta_indicador character varying(100),
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_by uuid
);


--
-- Name: TABLE controles_internos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.controles_internos IS 'Controles internos da instituição';


--
-- Name: creditos_adicionais; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.creditos_adicionais (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    dotacao_id uuid NOT NULL,
    tipo character varying(30) NOT NULL,
    numero_decreto character varying(30),
    data_decreto date,
    valor numeric(18,2) NOT NULL,
    origem character varying(30),
    dotacao_origem_id uuid,
    justificativa text,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    CONSTRAINT creditos_adicionais_origem_check CHECK (((origem)::text = ANY ((ARRAY['anulacao'::character varying, 'superavit'::character varying, 'excesso_arrecadacao'::character varying, 'operacao_credito'::character varying])::text[]))),
    CONSTRAINT creditos_adicionais_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['suplementar'::character varying, 'especial'::character varying, 'extraordinario'::character varying])::text[])))
);


--
-- Name: dados_oficiais; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dados_oficiais (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    chave text NOT NULL,
    valor text NOT NULL,
    descricao text,
    categoria text DEFAULT 'geral'::text,
    lei_referencia text,
    documento_url text,
    bloqueado boolean DEFAULT true,
    ultima_alteracao_por uuid,
    ultima_alteracao_em timestamp with time zone DEFAULT now(),
    motivo_alteracao text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: datas_importantes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.datas_importantes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    titulo text NOT NULL,
    descricao text,
    data date NOT NULL,
    data_fim date,
    tipo text DEFAULT 'evento'::text NOT NULL,
    recorrente_anual boolean DEFAULT false NOT NULL,
    modulos_alvo public.app_module[] DEFAULT '{}'::public.app_module[] NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    created_by uuid DEFAULT auth.uid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT datas_importantes_descricao_check CHECK (((descricao IS NULL) OR (char_length(descricao) <= 2000))),
    CONSTRAINT datas_importantes_periodo_ck CHECK (((data_fim IS NULL) OR (data_fim >= data))),
    CONSTRAINT datas_importantes_tipo_check CHECK ((tipo = ANY (ARRAY['prazo'::text, 'evento'::text, 'reuniao'::text, 'comemorativa'::text, 'outro'::text]))),
    CONSTRAINT datas_importantes_titulo_check CHECK (((char_length(btrim(titulo)) >= 3) AND (char_length(btrim(titulo)) <= 200)))
);


--
-- Name: TABLE datas_importantes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.datas_importantes IS 'Prazos, eventos e datas institucionais. Feriados ficam em dias_nao_uteis. modulos_alvo vazio = todos.';


--
-- Name: debitos_tecnicos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.debitos_tecnicos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo character varying(20) NOT NULL,
    titulo character varying(200) NOT NULL,
    descricao text,
    modulo character varying(100),
    fase_origem character varying(50),
    fase_destino character varying(50),
    prioridade public.prioridade_debito DEFAULT 'media'::public.prioridade_debito,
    status public.status_debito DEFAULT 'pendente'::public.status_debito,
    impacto text,
    solucao_proposta text,
    estimativa_esforco character varying(50),
    dependencias text[],
    responsavel_id uuid,
    data_identificacao date DEFAULT CURRENT_DATE,
    data_prevista date,
    data_resolucao date,
    observacoes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: decisoes_administrativas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.decisoes_administrativas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero_decisao character varying(50) NOT NULL,
    ano integer NOT NULL,
    tipo public.tipo_decisao NOT NULL,
    ementa text NOT NULL,
    fundamentacao text,
    dispositivo text NOT NULL,
    data_decisao date NOT NULL,
    autoridade_id uuid,
    unidade_origem_id uuid,
    processo_sei character varying(50),
    modulo_origem character varying(100),
    entidade_origem_tipo character varying(100),
    entidade_origem_id uuid,
    publicado boolean DEFAULT false NOT NULL,
    data_publicacao date,
    veiculo_publicacao character varying(100),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_by uuid
);


--
-- Name: TABLE decisoes_administrativas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.decisoes_administrativas IS 'Registro imutável de decisões administrativas';


--
-- Name: demandas_ascom; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.demandas_ascom (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero_demanda character varying(20),
    ano integer DEFAULT EXTRACT(year FROM CURRENT_DATE) NOT NULL,
    unidade_solicitante_id uuid,
    servidor_solicitante_id uuid,
    nome_responsavel character varying(255) NOT NULL,
    cargo_funcao character varying(255),
    contato_telefone character varying(20),
    contato_email character varying(255),
    categoria public.categoria_demanda_ascom NOT NULL,
    tipo public.tipo_demanda_ascom NOT NULL,
    titulo character varying(255) NOT NULL,
    descricao_detalhada text NOT NULL,
    objetivo_institucional text,
    publico_alvo text,
    data_evento date,
    hora_evento time without time zone,
    local_evento text,
    prazo_entrega date NOT NULL,
    status public.status_demanda_ascom DEFAULT 'rascunho'::public.status_demanda_ascom NOT NULL,
    prioridade public.prioridade_demanda_ascom DEFAULT 'normal'::public.prioridade_demanda_ascom NOT NULL,
    requer_autorizacao_presidencia boolean DEFAULT false,
    responsavel_ascom_id uuid,
    data_inicio_execucao timestamp with time zone,
    data_conclusao timestamp with time zone,
    observacoes_internas_ascom text,
    aprovado_por_id uuid,
    data_aprovacao timestamp with time zone,
    autorizado_presidencia_por_id uuid,
    data_autorizacao_presidencia timestamp with time zone,
    justificativa_indeferimento text,
    historico_status jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid,
    email_solicitante text,
    telefone_solicitante text
);

ALTER TABLE ONLY public.demandas_ascom FORCE ROW LEVEL SECURITY;


--
-- Name: demandas_ascom_anexos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.demandas_ascom_anexos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    demanda_id uuid NOT NULL,
    tipo_anexo character varying(50) NOT NULL,
    nome_arquivo character varying(255) NOT NULL,
    descricao text,
    url_arquivo text NOT NULL,
    tipo_mime character varying(100),
    tamanho_bytes bigint,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid
);


--
-- Name: demandas_ascom_comentarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.demandas_ascom_comentarios (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    demanda_id uuid NOT NULL,
    tipo character varying(50) DEFAULT 'comentario'::character varying NOT NULL,
    conteudo text NOT NULL,
    visivel_solicitante boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid
);


--
-- Name: demandas_ascom_entregaveis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.demandas_ascom_entregaveis (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    demanda_id uuid NOT NULL,
    tipo_entregavel character varying(100) NOT NULL,
    descricao text NOT NULL,
    url_arquivo text,
    link_publicacao text,
    data_entrega timestamp with time zone DEFAULT now(),
    relatorio_cobertura text,
    metricas jsonb,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    link_drive text
);


--
-- Name: denuncias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.denuncias (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    protocolo text NOT NULL,
    tipo text NOT NULL,
    anonima boolean DEFAULT true NOT NULL,
    nome_denunciante text,
    email_denunciante text,
    telefone_denunciante text,
    cargo_denunciante text,
    envolvidos text NOT NULL,
    data_ocorrencia text NOT NULL,
    local_ocorrencia text NOT NULL,
    descricao text NOT NULL,
    evidencias text,
    status text DEFAULT 'pendente'::text NOT NULL,
    parecer text,
    responsavel text,
    atualizado_por uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT denuncias_status_check CHECK ((status = ANY (ARRAY['pendente'::text, 'em_analise'::text, 'em_investigacao'::text, 'concluida'::text, 'arquivada'::text]))),
    CONSTRAINT denuncias_tipo_check CHECK ((tipo = ANY (ARRAY['corrupcao'::text, 'assedio'::text, 'conflito'::text, 'favorecimento'::text, 'irregularidade'::text, 'outro'::text])))
);


--
-- Name: TABLE denuncias; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.denuncias IS 'Canal de denúncias do módulo integridade. Só é gravável via public.registrar_denuncia_publica(); leitura/tratamento exige integridade.gerenciar.';


--
-- Name: denuncias_protocolo_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.denuncias_protocolo_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: dependentes_irrf; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dependentes_irrf (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    servidor_id uuid,
    nome text NOT NULL,
    cpf character varying(14),
    data_nascimento date NOT NULL,
    tipo_dependente character varying(30) NOT NULL,
    grau_instrucao character varying(50),
    deduz_irrf boolean DEFAULT true,
    data_inicio_deducao date NOT NULL,
    data_fim_deducao date,
    documento_url text,
    certidao_url text,
    observacoes text,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    created_by_servidor_id uuid,
    updated_by uuid,
    updated_by_servidor_id uuid
);

ALTER TABLE ONLY public.dependentes_irrf FORCE ROW LEVEL SECURITY;


--
-- Name: designacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.designacoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    servidor_id uuid NOT NULL,
    lotacao_id uuid,
    unidade_origem_id uuid NOT NULL,
    unidade_destino_id uuid NOT NULL,
    data_inicio date NOT NULL,
    data_fim date,
    status text DEFAULT 'pendente'::text,
    aprovado_por uuid,
    data_aprovacao timestamp with time zone,
    motivo_rejeicao text,
    ato_tipo text,
    ato_numero text,
    ato_data date,
    ato_doe_numero text,
    ato_doe_data date,
    justificativa text,
    observacao text,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    created_by_servidor_id uuid,
    updated_by uuid,
    updated_by_servidor_id uuid,
    CONSTRAINT designacoes_status_check CHECK ((status = ANY (ARRAY['pendente'::text, 'aprovada'::text, 'rejeitada'::text, 'encerrada'::text])))
);


--
-- Name: TABLE designacoes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.designacoes IS 'Designações temporárias de servidores para trabalhar em outras unidades';


--
-- Name: COLUMN designacoes.unidade_origem_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.designacoes.unidade_origem_id IS 'Unidade onde o servidor está lotado oficialmente';


--
-- Name: COLUMN designacoes.unidade_destino_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.designacoes.unidade_destino_id IS 'Unidade onde o servidor vai trabalhar temporariamente';


--
-- Name: despachos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.despachos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    processo_id uuid NOT NULL,
    movimentacao_id uuid,
    numero_despacho integer DEFAULT 1 NOT NULL,
    texto_despacho text NOT NULL,
    tipo_despacho public.tipo_despacho DEFAULT 'simples'::public.tipo_despacho NOT NULL,
    fundamentacao_legal text,
    decisao public.decisao_despacho,
    autoridade_id uuid,
    data_despacho date DEFAULT CURRENT_DATE NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid
);

ALTER TABLE ONLY public.despachos FORCE ROW LEVEL SECURITY;


--
-- Name: dias_nao_uteis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dias_nao_uteis (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    data date NOT NULL,
    nome character varying(200) NOT NULL,
    tipo character varying(30) NOT NULL,
    conta_frequencia boolean DEFAULT false,
    exige_compensacao boolean DEFAULT false,
    horas_expediente numeric(4,2),
    recorrente boolean DEFAULT false,
    mes_recorrente integer,
    dia_recorrente integer,
    abrangencia character varying(20) DEFAULT 'todas'::character varying,
    unidades_aplicaveis uuid[],
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    observacao text,
    esfera character varying(20) DEFAULT 'nacional'::character varying,
    uf character(2),
    municipio character varying(100),
    updated_at timestamp with time zone,
    updated_by uuid,
    fundamentacao_legal text,
    instituicao_id uuid,
    created_by_servidor_id uuid,
    updated_by_servidor_id uuid,
    CONSTRAINT dias_nao_uteis_abrangencia_check CHECK (((abrangencia)::text = ANY ((ARRAY['todas'::character varying, 'especifica'::character varying])::text[]))),
    CONSTRAINT dias_nao_uteis_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['feriado_nacional'::character varying, 'feriado_estadual'::character varying, 'feriado_municipal'::character varying, 'ponto_facultativo'::character varying, 'recesso'::character varying, 'suspensao_expediente'::character varying, 'expediente_reduzido'::character varying])::text[])))
);


--
-- Name: TABLE dias_nao_uteis; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.dias_nao_uteis IS 'Calendário de feriados e dias não úteis';


--
-- Name: COLUMN dias_nao_uteis.esfera; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.dias_nao_uteis.esfera IS 'Esfera do feriado: nacional, estadual, municipal ou institucional';


--
-- Name: COLUMN dias_nao_uteis.uf; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.dias_nao_uteis.uf IS 'UF aplicável para feriados estaduais (ex: RR)';


--
-- Name: COLUMN dias_nao_uteis.municipio; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.dias_nao_uteis.municipio IS 'Município aplicável para feriados municipais';


--
-- Name: COLUMN dias_nao_uteis.fundamentacao_legal; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.dias_nao_uteis.fundamentacao_legal IS 'Lei, decreto ou portaria que fundamenta o dia não útil';


--
-- Name: documentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documentos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero text NOT NULL,
    titulo text NOT NULL,
    ementa text,
    tipo public.tipo_documento DEFAULT 'portaria'::public.tipo_documento NOT NULL,
    status public.status_documento DEFAULT 'rascunho'::public.status_documento NOT NULL,
    data_documento date DEFAULT CURRENT_DATE NOT NULL,
    data_publicacao date,
    data_vigencia_inicio date,
    data_vigencia_fim date,
    arquivo_url text,
    observacoes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    categoria public.categoria_portaria,
    assinado_por text,
    data_assinatura date,
    arquivo_assinado_url text,
    servidores_ids uuid[] DEFAULT '{}'::uuid[],
    provimento_id uuid,
    designacao_id uuid,
    cargo_id uuid,
    unidade_id uuid,
    conteudo_html text,
    doe_numero text,
    doe_data date,
    conteudo_unificado jsonb,
    doe_link text,
    responsavel_id uuid,
    created_by_servidor_id uuid,
    updated_by uuid,
    updated_by_servidor_id uuid
);

ALTER TABLE ONLY public.documentos FORCE ROW LEVEL SECURITY;


--
-- Name: COLUMN documentos.conteudo_unificado; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.documentos.conteudo_unificado IS 'Estrutura JSON com preambulo, artigos, configTabela, assinatura e camposEspecificos para o sistema unificado de portarias';


--
-- Name: COLUMN documentos.responsavel_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.documentos.responsavel_id IS 'Servidor responsável pela tramitação/acompanhamento do documento';


--
-- Name: documentos_cedencia; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documentos_cedencia (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agenda_id uuid NOT NULL,
    tipo_documento character varying(100) NOT NULL,
    nome_arquivo character varying(255) NOT NULL,
    url_arquivo text NOT NULL,
    tamanho_bytes bigint,
    mime_type character varying(100),
    versao integer DEFAULT 1,
    documento_principal boolean DEFAULT false,
    observacoes text,
    uploaded_by uuid,
    uploaded_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: documentos_preparatorios_licitacao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documentos_preparatorios_licitacao (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    processo_licitatorio_id uuid NOT NULL,
    tipo public.tipo_documento_licitacao NOT NULL,
    titulo character varying(255) NOT NULL,
    descricao text,
    arquivo_url text,
    arquivo_nome character varying(255),
    numero_documento character varying(50),
    data_documento date,
    responsavel_id uuid,
    aprovado boolean DEFAULT false,
    aprovado_por uuid,
    aprovado_em timestamp with time zone,
    observacoes text,
    versao integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid
);


--
-- Name: documentos_processo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documentos_processo (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    processo_id uuid NOT NULL,
    tipo_documento public.tipo_documento_processo DEFAULT 'anexo'::public.tipo_documento_processo NOT NULL,
    numero_documento text,
    titulo text NOT NULL,
    conteudo_textual text,
    arquivo_url text,
    arquivo_nome text,
    arquivo_tamanho integer,
    hash_sha256 text,
    sigilo public.nivel_sigilo_processo DEFAULT 'publico'::public.nivel_sigilo_processo NOT NULL,
    ordem integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid
);

ALTER TABLE ONLY public.documentos_processo FORCE ROW LEVEL SECURITY;


--
-- Name: documentos_requerimento_servidor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documentos_requerimento_servidor (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    servidor_id uuid NOT NULL,
    tipo_documento text NOT NULL,
    titulo text NOT NULL,
    descricao text,
    modelo_url text,
    arquivo_assinado_url text,
    data_solicitacao date DEFAULT CURRENT_DATE NOT NULL,
    data_upload_assinado timestamp with time zone,
    status text DEFAULT 'pendente'::text NOT NULL,
    observacoes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by_servidor_id uuid,
    updated_by uuid,
    updated_by_servidor_id uuid,
    CONSTRAINT documentos_requerimento_servidor_status_check CHECK ((status = ANY (ARRAY['pendente'::text, 'recebido'::text, 'analisado'::text, 'arquivado'::text])))
);


--
-- Name: dotacoes_orcamentarias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dotacoes_orcamentarias (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    exercicio integer NOT NULL,
    unidade_orcamentaria character varying(10) NOT NULL,
    funcao character varying(2) NOT NULL,
    subfuncao character varying(3) NOT NULL,
    programa character varying(4) NOT NULL,
    acao_orcamentaria character varying(4) NOT NULL,
    categoria_economica character varying(1) NOT NULL,
    grupo_despesa character varying(1) NOT NULL,
    modalidade_aplicacao character varying(2) NOT NULL,
    elemento_despesa character varying(2) NOT NULL,
    classificacao_completa character varying(50) GENERATED ALWAYS AS (((((((((((((((unidade_orcamentaria)::text || '.'::text) || (funcao)::text) || '.'::text) || (subfuncao)::text) || '.'::text) || (programa)::text) || '.'::text) || (acao_orcamentaria)::text) || '.'::text) || (categoria_economica)::text) || (grupo_despesa)::text) || (modalidade_aplicacao)::text) || (elemento_despesa)::text)) STORED,
    fonte_recurso character varying(10) NOT NULL,
    descricao_fonte character varying(200),
    valor_inicial numeric(18,2) DEFAULT 0 NOT NULL,
    valor_suplementado numeric(18,2) DEFAULT 0 NOT NULL,
    valor_anulado numeric(18,2) DEFAULT 0 NOT NULL,
    valor_atual numeric(18,2) GENERATED ALWAYS AS (((valor_inicial + valor_suplementado) - valor_anulado)) STORED,
    valor_empenhado numeric(18,2) DEFAULT 0 NOT NULL,
    valor_liquidado numeric(18,2) DEFAULT 0 NOT NULL,
    valor_pago numeric(18,2) DEFAULT 0 NOT NULL,
    saldo_disponivel numeric(18,2) GENERATED ALWAYS AS ((((valor_inicial + valor_suplementado) - valor_anulado) - valor_empenhado)) STORED,
    centro_custo_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid
);


--
-- Name: empenhos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.empenhos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero_empenho character varying(20) NOT NULL,
    exercicio integer NOT NULL,
    data_empenho date NOT NULL,
    tipo character varying(30) NOT NULL,
    modalidade character varying(30) NOT NULL,
    dotacao_id uuid NOT NULL,
    contrato_id uuid,
    fornecedor_id uuid NOT NULL,
    processo_licitatorio_id uuid,
    valor_empenhado numeric(18,2) NOT NULL,
    valor_anulado numeric(18,2) DEFAULT 0 NOT NULL,
    valor_liquidado numeric(18,2) DEFAULT 0 NOT NULL,
    valor_pago numeric(18,2) DEFAULT 0 NOT NULL,
    saldo_empenho numeric(18,2) GENERATED ALWAYS AS (((valor_empenhado - valor_anulado) - valor_liquidado)) STORED,
    historico text NOT NULL,
    observacao text,
    situacao character varying(30) DEFAULT 'ativo'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    CONSTRAINT empenhos_situacao_check CHECK (((situacao)::text = ANY ((ARRAY['ativo'::character varying, 'anulado'::character varying, 'liquidado'::character varying, 'pago'::character varying, 'inscrito_rp'::character varying])::text[]))),
    CONSTRAINT empenhos_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['ordinario'::character varying, 'estimativo'::character varying, 'global'::character varying])::text[])))
);


--
-- Name: encaminhamentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.encaminhamentos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tipo_origem character varying(100) NOT NULL,
    origem_id uuid NOT NULL,
    numero_sequencial integer NOT NULL,
    unidade_destino_id uuid,
    servidor_destino_id uuid,
    assunto character varying(500) NOT NULL,
    despacho text NOT NULL,
    prazo_resposta date,
    urgente boolean DEFAULT false NOT NULL,
    data_encaminhamento timestamp with time zone DEFAULT now() NOT NULL,
    data_recebimento timestamp with time zone,
    recebido_por uuid,
    status character varying(50) DEFAULT 'pendente'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid
);


--
-- Name: TABLE encaminhamentos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.encaminhamentos IS 'Tramitação e encaminhamentos de documentos/processos';


--
-- Name: envios_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.envios_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    canal text NOT NULL,
    provedor text NOT NULL,
    destinatario text NOT NULL,
    assunto text,
    origem_modulo text NOT NULL,
    origem_id uuid,
    status text NOT NULL,
    erro text,
    id_externo text,
    disparado_por uuid,
    CONSTRAINT envios_log_canal_check CHECK ((canal = ANY (ARRAY['email'::text, 'whatsapp'::text]))),
    CONSTRAINT envios_log_status_check CHECK ((status = ANY (ARRAY['enviado'::text, 'falhou'::text])))
);


--
-- Name: TABLE envios_log; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.envios_log IS 'Trilha de disparos de e-mail/WhatsApp (sem corpo da mensagem). Gravada só pelas Edge Functions (service role).';


--
-- Name: escolas_jer; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.escolas_jer (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    municipio text,
    inep text,
    ja_cadastrada boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: estoque; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.estoque (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    item_id uuid NOT NULL,
    almoxarifado_id uuid NOT NULL,
    quantidade numeric(18,4) DEFAULT 0 NOT NULL,
    valor_total numeric(18,2) DEFAULT 0 NOT NULL,
    ultima_movimentacao timestamp with time zone
);


--
-- Name: estrutura_organizacional; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.estrutura_organizacional (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    sigla text,
    tipo public.tipo_unidade NOT NULL,
    nivel integer DEFAULT 1 NOT NULL,
    superior_id uuid,
    descricao text,
    competencias text[],
    atribuicoes text,
    cargo_chefe_id uuid,
    servidor_responsavel_id uuid,
    lei_criacao_numero text,
    lei_criacao_data date,
    lei_criacao_artigo text,
    lei_criacao_ementa text,
    lei_documento_url text,
    telefone text,
    ramal text,
    email text,
    localizacao text,
    ordem integer DEFAULT 0,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    data_extincao date,
    base_legal boolean DEFAULT false,
    ordem_exibicao integer DEFAULT 0
);


--
-- Name: eventos_esocial; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.eventos_esocial (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tipo_evento character varying(10) NOT NULL,
    id_evento character varying(50),
    folha_id uuid,
    servidor_id uuid,
    competencia_ano integer,
    competencia_mes integer,
    payload jsonb NOT NULL,
    payload_xml text,
    status public.status_evento_esocial DEFAULT 'pendente'::public.status_evento_esocial,
    mensagem_retorno text,
    protocolo_envio character varying(50),
    recibo character varying(50),
    data_geracao timestamp with time zone DEFAULT now(),
    gerado_por uuid,
    data_envio timestamp with time zone,
    data_retorno timestamp with time zone,
    tentativas_envio integer DEFAULT 0,
    lote_id character varying(50),
    sequencia_lote integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    enviado_por uuid,
    created_by uuid,
    created_by_servidor_id uuid,
    updated_by uuid,
    updated_by_servidor_id uuid,
    rascunho boolean GENERATED ALWAYS AS ((recibo IS NULL)) STORED,
    CONSTRAINT eventos_esocial_periodico_com_folha_check CHECK (((status = ANY (ARRAY['erro'::public.status_evento_esocial, 'rejeitado'::public.status_evento_esocial])) OR ((tipo_evento)::text <> ALL (ARRAY['S-1200'::text, 'S-1210'::text, 'S-1299'::text])) OR ((folha_id IS NOT NULL) AND (((tipo_evento)::text = 'S-1299'::text) OR (servidor_id IS NOT NULL))))),
    CONSTRAINT eventos_esocial_transmitido_com_recibo_check CHECK (((status <> ALL (ARRAY['enviado'::public.status_evento_esocial, 'aceito'::public.status_evento_esocial])) OR (recibo IS NOT NULL)))
);


--
-- Name: COLUMN eventos_esocial.rascunho; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.eventos_esocial.rascunho IS 'true enquanto o evento não foi transmitido (sem recibo do eSocial). Gerada a partir de recibo';


--
-- Name: evidencias_controle; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evidencias_controle (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    controle_id uuid NOT NULL,
    titulo character varying(300) NOT NULL,
    descricao text,
    tipo_evidencia character varying(50) NOT NULL,
    data_evidencia date NOT NULL,
    arquivo_url text,
    arquivo_nome character varying(255),
    arquivo_hash_sha512 character varying(128),
    link_externo text,
    observacoes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid
);


--
-- Name: TABLE evidencias_controle; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.evidencias_controle IS 'Evidências documentais dos controles internos';


--
-- Name: exportacoes_folha; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exportacoes_folha (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    folha_id uuid,
    tipo_exportacao character varying(30) NOT NULL,
    nome_arquivo text NOT NULL,
    arquivo_url text,
    tamanho_bytes integer,
    hash_arquivo character varying(64),
    quantidade_registros integer,
    valor_total numeric(15,2),
    banco_id uuid,
    status character varying(20) DEFAULT 'gerado'::character varying,
    mensagem_status text,
    gerado_em timestamp with time zone DEFAULT now(),
    gerado_por uuid,
    enviado_em timestamp with time zone,
    enviado_por uuid,
    created_at timestamp with time zone,
    created_by uuid,
    created_by_servidor_id uuid,
    updated_at timestamp with time zone,
    updated_by uuid,
    updated_by_servidor_id uuid
);


--
-- Name: federacao_arbitros; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.federacao_arbitros (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    federacao_id uuid NOT NULL,
    nome text NOT NULL,
    telefone text,
    email text,
    modalidades text[],
    disponibilidade text,
    ativo boolean DEFAULT true NOT NULL,
    observacoes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid
);


--
-- Name: federacao_espacos_cedidos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.federacao_espacos_cedidos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    federacao_id uuid NOT NULL,
    unidade_local_id uuid,
    nome_espaco text NOT NULL,
    descricao_espaco text,
    data_inicio date NOT NULL,
    data_fim date,
    dias_semana text[],
    horario_inicio time without time zone,
    horario_fim time without time zone,
    processo_sei text,
    numero_termo_cessao text,
    numero_portaria text,
    status text DEFAULT 'ativo'::text NOT NULL,
    observacoes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid
);


--
-- Name: federacao_parcerias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.federacao_parcerias (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    federacao_id uuid NOT NULL,
    titulo text NOT NULL,
    descricao text,
    tipo text DEFAULT 'parceria'::text NOT NULL,
    data_inicio date NOT NULL,
    data_fim date,
    status text DEFAULT 'vigente'::text NOT NULL,
    processo_sei text,
    numero_termo text,
    numero_portaria text,
    documento_url text,
    observacoes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid
);


--
-- Name: federacoes_esportivas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.federacoes_esportivas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    sigla text NOT NULL,
    data_criacao date NOT NULL,
    endereco text NOT NULL,
    telefone text NOT NULL,
    email text NOT NULL,
    instagram text,
    mandato_inicio date NOT NULL,
    mandato_fim date NOT NULL,
    presidente_nome text NOT NULL,
    presidente_nascimento date NOT NULL,
    presidente_telefone text NOT NULL,
    presidente_email text NOT NULL,
    presidente_endereco text,
    presidente_instagram text,
    vice_presidente_nome text NOT NULL,
    vice_presidente_telefone text NOT NULL,
    diretor_tecnico_nome text,
    diretor_tecnico_telefone text,
    status text DEFAULT 'em_analise'::text NOT NULL,
    observacoes_internas text,
    analisado_por uuid,
    data_analise timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    endereco_logradouro text,
    endereco_numero text,
    endereco_bairro text,
    presidente_endereco_logradouro text,
    presidente_endereco_numero text,
    presidente_endereco_bairro text,
    facebook text,
    presidente_facebook text,
    vice_presidente_facebook text,
    diretor_tecnico_facebook text,
    vice_presidente_data_nascimento date,
    diretor_tecnico_data_nascimento date,
    vice_presidente_instagram text,
    diretor_tecnico_instagram text,
    cnpj text,
    site character varying(255) DEFAULT NULL::character varying,
    CONSTRAINT federacoes_esportivas_status_check CHECK ((status = ANY (ARRAY['em_analise'::text, 'ativo'::text, 'inativo'::text, 'rejeitado'::text])))
);

ALTER TABLE ONLY public.federacoes_esportivas FORCE ROW LEVEL SECURITY;


--
-- Name: TABLE federacoes_esportivas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.federacoes_esportivas IS 'Cadastro de Federações Esportivas vinculadas ao IDJuv';


--
-- Name: COLUMN federacoes_esportivas.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.federacoes_esportivas.status IS 'Status: em_analise, ativo, inativo, rejeitado';


--
-- Name: COLUMN federacoes_esportivas.cnpj; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.federacoes_esportivas.cnpj IS 'CNPJ da federação - obrigatório para novos cadastros';


--
-- Name: feriados; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feriados (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    data date NOT NULL,
    nome text NOT NULL,
    tipo text DEFAULT 'nacional'::text,
    recorrente boolean DEFAULT false,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    created_by_servidor_id uuid,
    updated_at timestamp with time zone,
    updated_by uuid,
    updated_by_servidor_id uuid
);


--
-- Name: ferias_servidor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ferias_servidor (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    servidor_id uuid NOT NULL,
    periodo_aquisitivo_inicio date NOT NULL,
    periodo_aquisitivo_fim date NOT NULL,
    data_inicio date NOT NULL,
    data_fim date NOT NULL,
    dias_gozados integer NOT NULL,
    abono_pecuniario boolean DEFAULT false,
    dias_abono integer,
    parcela integer DEFAULT 1,
    total_parcelas integer DEFAULT 1,
    portaria_numero text,
    portaria_data date,
    portaria_url text,
    status text DEFAULT 'programada'::text,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    created_by_servidor_id uuid,
    updated_at timestamp with time zone,
    updated_by uuid,
    updated_by_servidor_id uuid,
    CONSTRAINT ferias_servidor_status_check CHECK ((status = ANY (ARRAY['programada'::text, 'em_gozo'::text, 'concluida'::text, 'interrompida'::text, 'cancelada'::text])))
);


--
-- Name: fichas_financeiras; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fichas_financeiras (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    folha_id uuid,
    servidor_id uuid,
    cargo_id uuid,
    cargo_nome text,
    cargo_vencimento numeric(15,2),
    centro_custo_id uuid,
    centro_custo_codigo character varying(20),
    lotacao_id uuid,
    total_proventos numeric(15,2) DEFAULT 0,
    total_descontos numeric(15,2) DEFAULT 0,
    valor_liquido numeric(15,2) DEFAULT 0,
    base_inss numeric(15,2) DEFAULT 0,
    valor_inss numeric(15,2) DEFAULT 0,
    base_irrf numeric(15,2) DEFAULT 0,
    valor_irrf numeric(15,2) DEFAULT 0,
    base_consignavel numeric(15,2) DEFAULT 0,
    margem_consignavel_usada numeric(15,2) DEFAULT 0,
    inss_patronal numeric(15,2) DEFAULT 0,
    rat numeric(15,2) DEFAULT 0,
    outras_entidades numeric(15,2) DEFAULT 0,
    total_encargos numeric(15,2) DEFAULT 0,
    banco_codigo character varying(3),
    banco_nome character varying(100),
    banco_agencia character varying(10),
    banco_conta character varying(20),
    banco_tipo_conta character varying(20),
    quantidade_dependentes integer DEFAULT 0,
    valor_deducao_dependentes numeric(15,2) DEFAULT 0,
    processado boolean DEFAULT false,
    data_processamento timestamp with time zone,
    tem_inconsistencia boolean DEFAULT false,
    inconsistencias jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    competencia_ano integer,
    competencia_mes integer,
    tipo_folha character varying,
    unidade_id uuid,
    unidade_nome character varying,
    created_by uuid,
    created_by_servidor_id uuid,
    updated_by uuid,
    updated_by_servidor_id uuid
);

ALTER TABLE ONLY public.fichas_financeiras FORCE ROW LEVEL SECURITY;


--
-- Name: fin_acoes_orcamentarias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_acoes_orcamentarias (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    programa_id uuid NOT NULL,
    codigo character varying(20) NOT NULL,
    nome character varying(255) NOT NULL,
    tipo character varying(20) DEFAULT 'atividade'::character varying,
    descricao text,
    produto character varying(255),
    unidade_medida character varying(50),
    meta_fisica numeric(15,2),
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.fin_acoes_orcamentarias FORCE ROW LEVEL SECURITY;


--
-- Name: fin_adiantamento_itens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_adiantamento_itens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    adiantamento_id uuid NOT NULL,
    item_numero integer NOT NULL,
    tipo_documento character varying(50) NOT NULL,
    numero_documento character varying(50),
    data_documento date NOT NULL,
    cnpj_cpf_fornecedor character varying(20),
    nome_fornecedor character varying(255),
    descricao text NOT NULL,
    valor numeric(15,2) NOT NULL,
    valido boolean,
    motivo_invalido text,
    validado_por uuid,
    validado_em timestamp with time zone,
    documento_id uuid,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.fin_adiantamento_itens FORCE ROW LEVEL SECURITY;


--
-- Name: fin_adiantamentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_adiantamentos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero character varying(20) NOT NULL,
    exercicio integer NOT NULL,
    data_solicitacao date DEFAULT CURRENT_DATE NOT NULL,
    servidor_suprido_id uuid NOT NULL,
    unidade_id uuid NOT NULL,
    valor_solicitado numeric(15,2) NOT NULL,
    valor_aprovado numeric(15,2),
    valor_utilizado numeric(15,2) DEFAULT 0,
    valor_devolvido numeric(15,2) DEFAULT 0,
    finalidade text NOT NULL,
    periodo_utilizacao_inicio date,
    periodo_utilizacao_fim date,
    prazo_prestacao_contas date,
    empenho_id uuid,
    dotacao_id uuid,
    conta_bancaria_id uuid,
    conta_suprido_banco character varying(3),
    conta_suprido_agencia character varying(10),
    conta_suprido_numero character varying(20),
    status public.status_adiantamento DEFAULT 'solicitado'::public.status_adiantamento,
    autorizado_por uuid,
    autorizado_em timestamp with time zone,
    liberado_por uuid,
    liberado_em timestamp with time zone,
    data_liberacao date,
    data_prestacao date,
    prestacao_aprovada_por uuid,
    prestacao_aprovada_em timestamp with time zone,
    parecer_prestacao text,
    bloqueado boolean DEFAULT false,
    data_bloqueio date,
    motivo_bloqueio text,
    observacoes text,
    historico_status jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid
);

ALTER TABLE ONLY public.fin_adiantamentos FORCE ROW LEVEL SECURITY;


--
-- Name: fin_alteracoes_orcamentarias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_alteracoes_orcamentarias (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero character varying(20) NOT NULL,
    exercicio integer NOT NULL,
    tipo public.tipo_alteracao_orcamentaria NOT NULL,
    data_alteracao date DEFAULT CURRENT_DATE NOT NULL,
    dotacao_origem_id uuid,
    dotacao_destino_id uuid,
    valor numeric(15,2) NOT NULL,
    justificativa text NOT NULL,
    fundamentacao_legal text,
    status public.status_workflow_financeiro DEFAULT 'rascunho'::public.status_workflow_financeiro,
    aprovado_por uuid,
    aprovado_em timestamp with time zone,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    processo_sei character varying(50),
    situacao_fiplan text DEFAULT 'pendente'::text NOT NULL,
    confirmado_fiplan_em timestamp with time zone,
    confirmado_fiplan_por uuid,
    CONSTRAINT fin_alteracoes_orcamentarias_situacao_fiplan_check CHECK ((situacao_fiplan = ANY (ARRAY['pendente'::text, 'confirmada'::text])))
);

ALTER TABLE ONLY public.fin_alteracoes_orcamentarias FORCE ROW LEVEL SECURITY;


--
-- Name: COLUMN fin_alteracoes_orcamentarias.processo_sei; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fin_alteracoes_orcamentarias.processo_sei IS 'Número do processo SEI que formaliza a alteração.';


--
-- Name: COLUMN fin_alteracoes_orcamentarias.situacao_fiplan; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fin_alteracoes_orcamentarias.situacao_fiplan IS 'pendente = registrada só no sistema; confirmada = lançada no FIPLAN (marcada por confirmar_alteracao_fiplan).';


--
-- Name: fin_audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tabela_origem character varying(100) NOT NULL,
    registro_id uuid NOT NULL,
    acao character varying(20) NOT NULL,
    dados_anteriores jsonb,
    dados_novos jsonb,
    campos_alterados text[],
    usuario_id uuid,
    usuario_nome character varying(255),
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.fin_audit_log FORCE ROW LEVEL SECURITY;


--
-- Name: fin_checklist_ci; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_checklist_ci (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    solicitacao_id uuid NOT NULL,
    item_verificacao character varying(255) NOT NULL,
    obrigatorio boolean DEFAULT true,
    conforme boolean,
    observacao text,
    verificado_por uuid,
    verificado_em timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.fin_checklist_ci FORCE ROW LEVEL SECURITY;


--
-- Name: fin_contas_bancarias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_contas_bancarias (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    banco_codigo character varying(3) NOT NULL,
    banco_nome character varying(100) NOT NULL,
    agencia character varying(10) NOT NULL,
    agencia_digito character varying(2),
    conta character varying(20) NOT NULL,
    conta_digito character varying(2),
    tipo public.tipo_conta_bancaria DEFAULT 'corrente'::public.tipo_conta_bancaria NOT NULL,
    nome_conta character varying(255) NOT NULL,
    finalidade text,
    fonte_recurso_id uuid,
    saldo_atual numeric(15,2) DEFAULT 0,
    data_ultimo_saldo date,
    responsavel_id uuid,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid
);

ALTER TABLE ONLY public.fin_contas_bancarias FORCE ROW LEVEL SECURITY;


--
-- Name: fin_documentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_documentos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entidade_tipo character varying(50) NOT NULL,
    entidade_id uuid NOT NULL,
    nome_arquivo character varying(255) NOT NULL,
    tipo_arquivo character varying(100),
    tamanho_bytes integer,
    storage_path text NOT NULL,
    hash_arquivo character varying(64),
    categoria character varying(50) NOT NULL,
    obrigatorio boolean DEFAULT false,
    numero_documento character varying(50),
    data_documento date,
    valor_documento numeric(15,2),
    versao integer DEFAULT 1,
    documento_anterior_id uuid,
    uploaded_by uuid,
    uploaded_at timestamp with time zone DEFAULT now(),
    ip_address inet,
    ativo boolean DEFAULT true,
    excluido_por uuid,
    excluido_em timestamp with time zone,
    motivo_exclusao text,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.fin_documentos FORCE ROW LEVEL SECURITY;


--
-- Name: fin_dotacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_dotacoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    exercicio integer NOT NULL,
    unidade_orcamentaria_id uuid,
    programa_id uuid,
    acao_id uuid,
    natureza_despesa_id uuid,
    fonte_recurso_id uuid,
    codigo_dotacao character varying(50) NOT NULL,
    valor_inicial numeric(15,2) DEFAULT 0 NOT NULL,
    valor_suplementado numeric(15,2) DEFAULT 0,
    valor_reduzido numeric(15,2) DEFAULT 0,
    valor_atual numeric(15,2) GENERATED ALWAYS AS (((valor_inicial + COALESCE(valor_suplementado, (0)::numeric)) - COALESCE(valor_reduzido, (0)::numeric))) STORED,
    valor_empenhado numeric(15,2) DEFAULT 0,
    valor_liquidado numeric(15,2) DEFAULT 0,
    valor_pago numeric(15,2) DEFAULT 0,
    saldo_disponivel numeric(15,2) GENERATED ALWAYS AS ((((valor_inicial + COALESCE(valor_suplementado, (0)::numeric)) - COALESCE(valor_reduzido, (0)::numeric)) - COALESCE(valor_empenhado, (0)::numeric))) STORED,
    bloqueado boolean DEFAULT false,
    motivo_bloqueio text,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    regional text,
    cod_acompanhamento text DEFAULT '0000'::text,
    idu text DEFAULT 'Não'::text,
    tro text DEFAULT 'No'::text,
    valor_bloqueado numeric(15,2) DEFAULT 0,
    valor_reserva numeric(15,2) DEFAULT 0,
    valor_ped numeric(15,2) DEFAULT 0,
    valor_em_liquidacao numeric(15,2) DEFAULT 0,
    valor_restos_pagar numeric(15,2) DEFAULT 0,
    paoe text,
    conta_contabil_id uuid,
    classificacao_pcasp character varying(30)
);

ALTER TABLE ONLY public.fin_dotacoes FORCE ROW LEVEL SECURITY;


--
-- Name: COLUMN fin_dotacoes.regional; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fin_dotacoes.regional IS 'Regional orçamentária (ex: 9900 - Estado)';


--
-- Name: COLUMN fin_dotacoes.cod_acompanhamento; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fin_dotacoes.cod_acompanhamento IS 'Código de acompanhamento orçamentário';


--
-- Name: COLUMN fin_dotacoes.idu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fin_dotacoes.idu IS 'Identificador de Uso (Não, EII, ECNI, ECI)';


--
-- Name: COLUMN fin_dotacoes.tro; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fin_dotacoes.tro IS 'Tipo de Recurso Orçamentário';


--
-- Name: COLUMN fin_dotacoes.valor_bloqueado; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fin_dotacoes.valor_bloqueado IS 'Valor bloqueado/contingenciado';


--
-- Name: COLUMN fin_dotacoes.valor_reserva; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fin_dotacoes.valor_reserva IS 'Valor em contingenciamento/reserva';


--
-- Name: COLUMN fin_dotacoes.valor_ped; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fin_dotacoes.valor_ped IS 'Valor de pedido em andamento';


--
-- Name: COLUMN fin_dotacoes.valor_em_liquidacao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fin_dotacoes.valor_em_liquidacao IS 'Valor em processo de liquidação';


--
-- Name: COLUMN fin_dotacoes.valor_restos_pagar; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fin_dotacoes.valor_restos_pagar IS 'Valor inscrito em restos a pagar';


--
-- Name: COLUMN fin_dotacoes.paoe; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fin_dotacoes.paoe IS 'Código PAOE - Programa/Ação Orçamentária';


--
-- Name: fin_empenho_anulacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_empenho_anulacoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    empenho_id uuid NOT NULL,
    numero character varying(20) NOT NULL,
    data_anulacao date DEFAULT CURRENT_DATE NOT NULL,
    valor numeric(15,2) NOT NULL,
    motivo text NOT NULL,
    anulado_por uuid,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.fin_empenho_anulacoes FORCE ROW LEVEL SECURITY;


--
-- Name: fin_empenhos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_empenhos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero character varying(20) NOT NULL,
    exercicio integer NOT NULL,
    data_empenho date DEFAULT CURRENT_DATE NOT NULL,
    solicitacao_id uuid,
    dotacao_id uuid NOT NULL,
    fornecedor_id uuid NOT NULL,
    contrato_id uuid,
    tipo public.tipo_empenho DEFAULT 'ordinario'::public.tipo_empenho NOT NULL,
    natureza_despesa_id uuid,
    fonte_recurso_id uuid,
    valor_empenhado numeric(15,2) NOT NULL,
    valor_liquidado numeric(15,2) DEFAULT 0,
    valor_pago numeric(15,2) DEFAULT 0,
    valor_anulado numeric(15,2) DEFAULT 0,
    saldo_liquidar numeric(15,2) GENERATED ALWAYS AS (((valor_empenhado - COALESCE(valor_anulado, (0)::numeric)) - COALESCE(valor_liquidado, (0)::numeric))) STORED,
    saldo_pagar numeric(15,2) GENERATED ALWAYS AS ((COALESCE(valor_liquidado, (0)::numeric) - COALESCE(valor_pago, (0)::numeric))) STORED,
    objeto text NOT NULL,
    processo_sei character varying(50),
    status public.status_empenho DEFAULT 'emitido'::public.status_empenho,
    emitido_por uuid,
    inscrito_rp boolean DEFAULT false,
    data_inscricao_rp date,
    tipo_rp character varying(20),
    observacoes text,
    historico_status jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    conta_contabil_debito_id uuid,
    conta_contabil_credito_id uuid
);

ALTER TABLE ONLY public.fin_empenhos FORCE ROW LEVEL SECURITY;


--
-- Name: fin_extrato_lancamentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_extrato_lancamentos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conta_bancaria_id uuid NOT NULL,
    data_lancamento date NOT NULL,
    data_movimento date,
    valor numeric(15,2) NOT NULL,
    sinal character(1) NOT NULL,
    codigo_historico integer,
    descricao text,
    informacao_complementar text,
    contrapartida_documento text,
    contrapartida_tipo character(1),
    contrapartida_banco integer,
    contrapartida_agencia integer,
    contrapartida_conta text,
    numero_documento text,
    identificador_bb text NOT NULL,
    chave_unica text NOT NULL,
    pagamento_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT fin_extrato_lancamentos_contrapartida_conta_check CHECK ((char_length(contrapartida_conta) <= 30)),
    CONSTRAINT fin_extrato_lancamentos_contrapartida_documento_check CHECK ((contrapartida_documento ~ '^\d{1,14}$'::text)),
    CONSTRAINT fin_extrato_lancamentos_contrapartida_tipo_check CHECK ((contrapartida_tipo = ANY (ARRAY['F'::bpchar, 'J'::bpchar]))),
    CONSTRAINT fin_extrato_lancamentos_descricao_check CHECK ((char_length(descricao) <= 255)),
    CONSTRAINT fin_extrato_lancamentos_identificador_bb_check CHECK (((char_length(identificador_bb) >= 1) AND (char_length(identificador_bb) <= 200))),
    CONSTRAINT fin_extrato_lancamentos_informacao_complementar_check CHECK ((char_length(informacao_complementar) <= 500)),
    CONSTRAINT fin_extrato_lancamentos_numero_documento_check CHECK ((char_length(numero_documento) <= 50)),
    CONSTRAINT fin_extrato_lancamentos_sinal_check CHECK ((sinal = ANY (ARRAY['C'::bpchar, 'D'::bpchar]))),
    CONSTRAINT fin_extrato_lancamentos_valor_check CHECK ((valor >= (0)::numeric))
);


--
-- Name: TABLE fin_extrato_lancamentos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fin_extrato_lancamentos IS 'Lançamentos do extrato do Banco do Brasil (API Extratos v2), gravados pela Edge Function bb-api via registrar_extrato_bb. chave_unica = conta_bancaria_id|identificador_bb. Contrapartida (CPF/CNPJ e conta): só o módulo financeiro lê.';


--
-- Name: COLUMN fin_extrato_lancamentos.identificador_bb; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fin_extrato_lancamentos.identificador_bb IS 'Identificação do lançamento montada pela Edge Function a partir dos campos do BB (data, lote, documento, histórico, valor, sinal e ordem dos repetidos no dia).';


--
-- Name: fin_extrato_transacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_extrato_transacoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    extrato_id uuid NOT NULL,
    data_transacao date NOT NULL,
    data_balancete date,
    tipo character varying(1) NOT NULL,
    valor numeric(15,2) NOT NULL,
    historico text,
    documento character varying(50),
    numero_sequencial integer,
    status public.status_conciliacao DEFAULT 'pendente'::public.status_conciliacao,
    pagamento_id uuid,
    receita_id uuid,
    justificativa_divergencia text,
    conciliado_por uuid,
    conciliado_em timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.fin_extrato_transacoes FORCE ROW LEVEL SECURITY;


--
-- Name: fin_extratos_bancarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_extratos_bancarios (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conta_bancaria_id uuid NOT NULL,
    mes_referencia integer NOT NULL,
    ano_referencia integer NOT NULL,
    saldo_anterior numeric(15,2),
    total_creditos numeric(15,2) DEFAULT 0,
    total_debitos numeric(15,2) DEFAULT 0,
    saldo_final numeric(15,2),
    data_importacao timestamp with time zone DEFAULT now(),
    arquivo_original character varying(255),
    importado_por uuid,
    conciliado boolean DEFAULT false,
    conciliado_por uuid,
    conciliado_em timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.fin_extratos_bancarios FORCE ROW LEVEL SECURITY;


--
-- Name: fin_fechamentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_fechamentos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    exercicio integer NOT NULL,
    mes integer NOT NULL,
    data_fechamento timestamp with time zone DEFAULT now(),
    total_receitas numeric(15,2) DEFAULT 0,
    total_despesas numeric(15,2) DEFAULT 0,
    resultado_mes numeric(15,2) DEFAULT 0,
    status character varying(20) DEFAULT 'aberto'::character varying,
    fechado_por uuid,
    fechado_em timestamp with time zone,
    reaberto_por uuid,
    reaberto_em timestamp with time zone,
    motivo_reabertura text,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.fin_fechamentos FORCE ROW LEVEL SECURITY;


--
-- Name: fin_fontes_recurso; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_fontes_recurso (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo character varying(20) NOT NULL,
    nome character varying(255) NOT NULL,
    descricao text,
    origem character varying(100),
    detalhamento_fonte character varying(50),
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.fin_fontes_recurso FORCE ROW LEVEL SECURITY;


--
-- Name: fin_lancamentos_contabeis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_lancamentos_contabeis (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero character varying(20) NOT NULL,
    data_lancamento date NOT NULL,
    data_competencia date NOT NULL,
    conta_debito_id uuid NOT NULL,
    conta_credito_id uuid NOT NULL,
    valor numeric(15,2) NOT NULL,
    tipo_origem character varying(50) NOT NULL,
    origem_id uuid,
    historico text NOT NULL,
    complemento text,
    exercicio integer NOT NULL,
    mes_referencia integer NOT NULL,
    fechamento_id uuid,
    estornado boolean DEFAULT false,
    lancamento_estorno_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid
);

ALTER TABLE ONLY public.fin_lancamentos_contabeis FORCE ROW LEVEL SECURITY;


--
-- Name: fin_liquidacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_liquidacoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero character varying(20) NOT NULL,
    exercicio integer NOT NULL,
    data_liquidacao date DEFAULT CURRENT_DATE NOT NULL,
    empenho_id uuid NOT NULL,
    tipo_documento character varying(50) NOT NULL,
    numero_documento character varying(50) NOT NULL,
    serie_documento character varying(10),
    data_documento date NOT NULL,
    chave_nfe character varying(50),
    valor_documento numeric(15,2) NOT NULL,
    valor_liquidado numeric(15,2) NOT NULL,
    valor_retencoes numeric(15,2) DEFAULT 0,
    valor_liquido numeric(15,2) GENERATED ALWAYS AS ((valor_liquidado - COALESCE(valor_retencoes, (0)::numeric))) STORED,
    retencao_inss numeric(15,2) DEFAULT 0,
    retencao_irrf numeric(15,2) DEFAULT 0,
    retencao_iss numeric(15,2) DEFAULT 0,
    outras_retencoes numeric(15,2) DEFAULT 0,
    atestado_por uuid,
    atestado_em timestamp with time zone,
    cargo_atestante character varying(255),
    status public.status_liquidacao DEFAULT 'pendente'::public.status_liquidacao,
    aprovado_por uuid,
    aprovado_em timestamp with time zone,
    motivo_rejeicao text,
    observacoes text,
    historico_status jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    conta_contabil_debito_id uuid,
    conta_contabil_credito_id uuid
);

ALTER TABLE ONLY public.fin_liquidacoes FORCE ROW LEVEL SECURITY;


--
-- Name: fin_movimentos_bancarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_movimentos_bancarios (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    origem text NOT NULL,
    sentido text NOT NULL,
    importacao_id uuid,
    data_arquivo date,
    sequencial_arquivo text,
    tipo_lancamento text DEFAULT ''::text NOT NULL,
    identificador text NOT NULL,
    favorecido_nome text,
    favorecido_documento text,
    banco text,
    agencia text,
    conta text,
    valor numeric(15,2) NOT NULL,
    data_pagamento date,
    codigo_barras text,
    autenticacao text,
    situacao text NOT NULL,
    motivo_recusa text,
    codigo_retorno text,
    data_efetivacao date,
    pagamento_id uuid,
    conciliado_em timestamp with time zone,
    conciliado_por uuid,
    conciliacao_justificativa text,
    importacao_retorno_id uuid,
    chave_unica text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    remessa_id uuid,
    reenviado_em timestamp with time zone,
    conta_corrigida jsonb,
    corrigido_por uuid,
    corrigido_em timestamp with time zone,
    CONSTRAINT fin_movimentos_bancarios_agencia_check CHECK ((char_length(agencia) <= 20)),
    CONSTRAINT fin_movimentos_bancarios_autenticacao_check CHECK ((char_length(autenticacao) <= 100)),
    CONSTRAINT fin_movimentos_bancarios_banco_check CHECK ((char_length(banco) <= 10)),
    CONSTRAINT fin_movimentos_bancarios_codigo_barras_check CHECK ((char_length(codigo_barras) <= 60)),
    CONSTRAINT fin_movimentos_bancarios_codigo_retorno_check CHECK ((char_length(codigo_retorno) <= 50)),
    CONSTRAINT fin_movimentos_bancarios_conciliacao_justificativa_check CHECK ((char_length(conciliacao_justificativa) <= 500)),
    CONSTRAINT fin_movimentos_bancarios_conta_check CHECK ((char_length(conta) <= 30)),
    CONSTRAINT fin_movimentos_bancarios_conta_corrigida_check CHECK (((conta_corrigida IS NULL) OR (jsonb_typeof(conta_corrigida) = 'object'::text))),
    CONSTRAINT fin_movimentos_bancarios_favorecido_documento_check CHECK ((favorecido_documento ~ '^(\d{11}|\d{14})$'::text)),
    CONSTRAINT fin_movimentos_bancarios_favorecido_nome_check CHECK ((char_length(favorecido_nome) <= 255)),
    CONSTRAINT fin_movimentos_bancarios_identificador_check CHECK (((char_length(btrim(identificador)) >= 1) AND (char_length(btrim(identificador)) <= 60))),
    CONSTRAINT fin_movimentos_bancarios_motivo_recusa_check CHECK ((char_length(motivo_recusa) <= 500)),
    CONSTRAINT fin_movimentos_bancarios_origem_check CHECK ((origem = ANY (ARRAY['obn600'::text, 'cnab240'::text]))),
    CONSTRAINT fin_movimentos_bancarios_sentido_check CHECK ((sentido = ANY (ARRAY['remessa'::text, 'retorno'::text]))),
    CONSTRAINT fin_movimentos_bancarios_sequencial_arquivo_check CHECK ((char_length(sequencial_arquivo) <= 20)),
    CONSTRAINT fin_movimentos_bancarios_situacao_check CHECK ((situacao = ANY (ARRAY['enviado'::text, 'pago'::text, 'recusado'::text]))),
    CONSTRAINT fin_movimentos_bancarios_tipo_lancamento_check CHECK ((char_length(tipo_lancamento) <= 50)),
    CONSTRAINT fin_movimentos_bancarios_valor_check CHECK ((valor >= (0)::numeric))
);


--
-- Name: TABLE fin_movimentos_bancarios; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fin_movimentos_bancarios IS 'Pagamentos vistos nos arquivos do banco (OBN600 do FIPLAN, CNAB240 da SEGAD e do Gestão MAX). Escrita só pelas RPCs importar_arquivo_bancario e conciliar_movimento_bancario. CPF/CNPJ e conta do favorecido: só o módulo financeiro lê.';


--
-- Name: COLUMN fin_movimentos_bancarios.importacao_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fin_movimentos_bancarios.importacao_id IS 'Importação que criou o registro (remessa ou, sem remessa prévia, o retorno).';


--
-- Name: COLUMN fin_movimentos_bancarios.data_efetivacao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fin_movimentos_bancarios.data_efetivacao IS 'Data real do débito informada pelo retorno do banco (fora da chave_unica). Vai para fin_pagamentos.data_efetivacao.';


--
-- Name: COLUMN fin_movimentos_bancarios.conciliacao_justificativa; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fin_movimentos_bancarios.conciliacao_justificativa IS 'Justificativa da conciliação manual quando o valor do movimento não confere com o líquido do pagamento.';


--
-- Name: COLUMN fin_movimentos_bancarios.importacao_retorno_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fin_movimentos_bancarios.importacao_retorno_id IS 'Última importação de retorno que atualizou a situação do registro.';


--
-- Name: COLUMN fin_movimentos_bancarios.chave_unica; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fin_movimentos_bancarios.chave_unica IS 'origem|identificador|valor|data_pagamento|tipo_lancamento, calculada pela RPC de importação.';


--
-- Name: COLUMN fin_movimentos_bancarios.remessa_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fin_movimentos_bancarios.remessa_id IS 'Remessa de reenvio (fin_remessas_bancarias) que reservou o recusado; com reenviado_em preenchido, a remessa confirmada em que ele foi reenviado.';


--
-- Name: COLUMN fin_movimentos_bancarios.reenviado_em; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fin_movimentos_bancarios.reenviado_em IS 'Quando a remessa de reenvio foi confirmada (arquivo gerado). Nulo com remessa_id preenchido = só reservado.';


--
-- Name: COLUMN fin_movimentos_bancarios.conta_corrigida; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fin_movimentos_bancarios.conta_corrigida IS 'Conta de destino do reenvio, gravada por corrigir_conta_movimento: {banco, agencia, agencia_dv, conta, conta_dv, validado_bb, justificativa}. validado_bb é declarado pela tela depois da consulta à bb-api (que fica na trilha audit_logs).';


--
-- Name: fin_naturezas_despesa; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_naturezas_despesa (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo character varying(20) NOT NULL,
    nome character varying(255) NOT NULL,
    descricao text,
    categoria_economica character varying(1),
    grupo_natureza character varying(1),
    modalidade_aplicacao character varying(2),
    elemento character varying(2),
    subelemento character varying(2),
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.fin_naturezas_despesa FORCE ROW LEVEL SECURITY;


--
-- Name: fin_pagamentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_pagamentos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero character varying(20) NOT NULL,
    exercicio integer NOT NULL,
    data_pagamento date DEFAULT CURRENT_DATE NOT NULL,
    liquidacao_id uuid NOT NULL,
    empenho_id uuid NOT NULL,
    conta_bancaria_id uuid NOT NULL,
    fornecedor_id uuid,
    banco_favorecido character varying(3),
    agencia_favorecido character varying(10),
    conta_favorecido character varying(20),
    tipo_conta_favorecido character varying(20),
    valor_bruto numeric(15,2) NOT NULL,
    valor_retencoes numeric(15,2) DEFAULT 0,
    valor_liquido numeric(15,2) GENERATED ALWAYS AS ((valor_bruto - COALESCE(valor_retencoes, (0)::numeric))) STORED,
    forma_pagamento character varying(20) NOT NULL,
    identificador_transacao character varying(100),
    data_efetivacao date,
    status public.status_pagamento DEFAULT 'programado'::public.status_pagamento,
    autorizado_por uuid,
    autorizado_em timestamp with time zone,
    executado_por uuid,
    executado_em timestamp with time zone,
    estornado boolean DEFAULT false,
    data_estorno date,
    motivo_estorno text,
    estornado_por uuid,
    observacoes text,
    historico_status jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    conta_contabil_debito_id uuid,
    conta_contabil_credito_id uuid
);

ALTER TABLE ONLY public.fin_pagamentos FORCE ROW LEVEL SECURITY;


--
-- Name: fin_parametros; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_parametros (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    chave character varying(100) NOT NULL,
    valor text NOT NULL,
    tipo character varying(20) DEFAULT 'texto'::character varying,
    descricao text,
    categoria character varying(50),
    editavel boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.fin_parametros FORCE ROW LEVEL SECURITY;


--
-- Name: fin_plano_contas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_plano_contas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo character varying(20) NOT NULL,
    nome character varying(255) NOT NULL,
    descricao text,
    natureza public.natureza_conta NOT NULL,
    nivel integer DEFAULT 1 NOT NULL,
    conta_pai_id uuid,
    aceita_lancamento boolean DEFAULT false,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid
);

ALTER TABLE ONLY public.fin_plano_contas FORCE ROW LEVEL SECURITY;


--
-- Name: fin_programas_orcamentarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_programas_orcamentarios (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo character varying(20) NOT NULL,
    nome character varying(255) NOT NULL,
    objetivo text,
    exercicio integer NOT NULL,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.fin_programas_orcamentarios FORCE ROW LEVEL SECURITY;


--
-- Name: fin_receitas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_receitas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero character varying(20) NOT NULL,
    exercicio integer NOT NULL,
    data_receita date DEFAULT CURRENT_DATE NOT NULL,
    tipo public.tipo_receita NOT NULL,
    fonte_recurso_id uuid,
    conta_bancaria_id uuid,
    origem_descricao text NOT NULL,
    documento_origem character varying(100),
    entidade_pagadora character varying(255),
    cnpj_cpf_pagador character varying(20),
    valor numeric(15,2) NOT NULL,
    convenio_id uuid,
    conciliado boolean DEFAULT false,
    conciliacao_id uuid,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid
);

ALTER TABLE ONLY public.fin_receitas FORCE ROW LEVEL SECURITY;


--
-- Name: fin_remessas_bancarias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_remessas_bancarias (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    layout text DEFAULT 'gestao_max_cnab240'::text NOT NULL,
    conta_autarquia_id uuid NOT NULL,
    convenio text NOT NULL,
    agencia text NOT NULL,
    agencia_digito text,
    conta text NOT NULL,
    conta_digito text,
    nsa integer NOT NULL,
    data_geracao timestamp with time zone DEFAULT now() NOT NULL,
    data_pagamento date NOT NULL,
    tipo_servico text DEFAULT '98'::text NOT NULL,
    quantidade integer NOT NULL,
    valor_total numeric(15,2) NOT NULL,
    creditos jsonb NOT NULL,
    arquivo_sha256 text,
    movimentos uuid[] DEFAULT '{}'::uuid[] NOT NULL,
    created_by uuid DEFAULT auth.uid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT fin_remessas_bancarias_agencia_check CHECK (((char_length(agencia) >= 1) AND (char_length(agencia) <= 10))),
    CONSTRAINT fin_remessas_bancarias_agencia_digito_check CHECK ((char_length(agencia_digito) <= 2)),
    CONSTRAINT fin_remessas_bancarias_arquivo_sha256_check CHECK ((arquivo_sha256 ~ '^[0-9a-f]{64}$'::text)),
    CONSTRAINT fin_remessas_bancarias_conta_check CHECK (((char_length(conta) >= 1) AND (char_length(conta) <= 20))),
    CONSTRAINT fin_remessas_bancarias_conta_digito_check CHECK ((char_length(conta_digito) <= 2)),
    CONSTRAINT fin_remessas_bancarias_convenio_check CHECK (((char_length(convenio) >= 1) AND (char_length(convenio) <= 20))),
    CONSTRAINT fin_remessas_bancarias_creditos_check CHECK ((jsonb_typeof(creditos) = 'array'::text)),
    CONSTRAINT fin_remessas_bancarias_layout_check CHECK ((layout = 'gestao_max_cnab240'::text)),
    CONSTRAINT fin_remessas_bancarias_nsa_check CHECK (((nsa >= 1) AND (nsa <= 999999))),
    CONSTRAINT fin_remessas_bancarias_quantidade_check CHECK (((quantidade >= 1) AND (quantidade <= 999))),
    CONSTRAINT fin_remessas_bancarias_tipo_servico_check CHECK ((tipo_servico = ANY (ARRAY['98'::text, '30'::text]))),
    CONSTRAINT fin_remessas_bancarias_valor_total_check CHECK ((valor_total > (0)::numeric))
);


--
-- Name: TABLE fin_remessas_bancarias; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fin_remessas_bancarias IS 'Arquivos de reenvio (CNAB240 do BB Gestão MAX) gerados pelo sistema: NSA e créditos montados por registrar_remessa_bancaria, hash gravado por confirmar_remessa_bancaria. arquivo_sha256 nulo = reserva não confirmada (cancelável). Escrita só pelas RPCs.';


--
-- Name: COLUMN fin_remessas_bancarias.agencia; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fin_remessas_bancarias.agencia IS 'Cópia da agência da conta pagadora (contas_autarquia) no momento da remessa; idem agencia_digito, conta e conta_digito.';


--
-- Name: COLUMN fin_remessas_bancarias.tipo_servico; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fin_remessas_bancarias.tipo_servico IS 'Serviço dos créditos em conta BB no arquivo: 98 = pagamentos diversos (padrão), 30 = salários. Gravado para o arquivo baixado de novo sair igual.';


--
-- Name: COLUMN fin_remessas_bancarias.creditos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fin_remessas_bancarias.creditos IS 'Retrato dos créditos do arquivo: [{movimento_id, pagamento_id, nome, documento, banco, agencia, agencia_dv, conta, conta_dv, valor, seu_numero}], montado pelo servidor.';


--
-- Name: COLUMN fin_remessas_bancarias.movimentos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fin_remessas_bancarias.movimentos IS 'fin_movimentos_bancarios recusados reenviados neste arquivo (mesma ordem de creditos).';


--
-- Name: fin_restos_pagar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_restos_pagar (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    empenho_id uuid NOT NULL,
    exercicio_origem integer NOT NULL,
    exercicio_inscricao integer NOT NULL,
    tipo character varying(20) NOT NULL,
    valor_inscrito numeric(15,2) NOT NULL,
    valor_cancelado numeric(15,2) DEFAULT 0 NOT NULL,
    valor_liquidado numeric(15,2) DEFAULT 0 NOT NULL,
    valor_pago numeric(15,2) DEFAULT 0 NOT NULL,
    saldo numeric(15,2) GENERATED ALWAYS AS (((valor_inscrito - valor_cancelado) - valor_pago)) STORED,
    status character varying(20) DEFAULT 'inscrito'::character varying NOT NULL,
    data_inscricao date DEFAULT CURRENT_DATE NOT NULL,
    data_cancelamento date,
    data_prescricao date,
    motivo_cancelamento text,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    CONSTRAINT fin_restos_pagar_status_check CHECK (((status)::text = ANY ((ARRAY['inscrito'::character varying, 'em_liquidacao'::character varying, 'liquidado'::character varying, 'pago'::character varying, 'cancelado'::character varying, 'prescrito'::character varying])::text[]))),
    CONSTRAINT fin_restos_pagar_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['processado'::character varying, 'nao_processado'::character varying])::text[])))
);


--
-- Name: fin_solicitacao_itens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_solicitacao_itens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    solicitacao_id uuid NOT NULL,
    item_numero integer NOT NULL,
    descricao text NOT NULL,
    unidade character varying(20),
    quantidade numeric(15,4) DEFAULT 1 NOT NULL,
    valor_unitario_estimado numeric(15,4),
    valor_total_estimado numeric(15,2) GENERATED ALWAYS AS ((quantidade * COALESCE(valor_unitario_estimado, (0)::numeric))) STORED,
    observacoes text,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.fin_solicitacao_itens FORCE ROW LEVEL SECURITY;


--
-- Name: fin_solicitacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_solicitacoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero character varying(20) NOT NULL,
    exercicio integer NOT NULL,
    data_solicitacao date DEFAULT CURRENT_DATE NOT NULL,
    unidade_solicitante_id uuid NOT NULL,
    servidor_solicitante_id uuid,
    tipo_despesa character varying(50) NOT NULL,
    objeto text NOT NULL,
    justificativa text NOT NULL,
    valor_estimado numeric(15,2) NOT NULL,
    dotacao_sugerida_id uuid,
    fornecedor_id uuid,
    contrato_id uuid,
    processo_licitatorio_id uuid,
    status public.status_workflow_financeiro DEFAULT 'rascunho'::public.status_workflow_financeiro,
    prioridade character varying(20) DEFAULT 'normal'::character varying,
    prazo_execucao date,
    parecer_ci text,
    ci_aprovado_por uuid,
    ci_aprovado_em timestamp with time zone,
    ressalvas_ci text,
    autorizado_por uuid,
    autorizado_em timestamp with time zone,
    motivo_rejeicao text,
    observacoes text,
    historico_status jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid
);

ALTER TABLE ONLY public.fin_solicitacoes FORCE ROW LEVEL SECURITY;


--
-- Name: fin_sub_empenhos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_sub_empenhos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    empenho_id uuid NOT NULL,
    numero character varying(30) NOT NULL,
    tipo character varying(15) NOT NULL,
    valor numeric(15,2) NOT NULL,
    data_registro date DEFAULT CURRENT_DATE NOT NULL,
    justificativa text NOT NULL,
    documento_referencia character varying(50),
    status character varying(15) DEFAULT 'ativo'::character varying NOT NULL,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    CONSTRAINT fin_sub_empenhos_status_check CHECK (((status)::text = ANY ((ARRAY['ativo'::character varying, 'cancelado'::character varying])::text[]))),
    CONSTRAINT fin_sub_empenhos_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['reforco'::character varying, 'anulacao'::character varying])::text[])))
);


--
-- Name: folha_historico_status; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.folha_historico_status (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    folha_id uuid NOT NULL,
    status_anterior text,
    status_novo text NOT NULL,
    usuario_id uuid,
    usuario_nome text,
    justificativa text,
    ip_address inet DEFAULT inet_client_addr(),
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.folha_historico_status FORCE ROW LEVEL SECURITY;


--
-- Name: folhas_pagamento; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.folhas_pagamento (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    competencia_ano integer NOT NULL,
    competencia_mes integer NOT NULL,
    tipo_folha public.tipo_folha NOT NULL,
    status public.status_folha DEFAULT 'aberta'::public.status_folha,
    total_bruto numeric(15,2) DEFAULT 0,
    total_descontos numeric(15,2) DEFAULT 0,
    total_liquido numeric(15,2) DEFAULT 0,
    total_encargos_patronais numeric(15,2) DEFAULT 0,
    total_inss_servidor numeric(15,2) DEFAULT 0,
    total_inss_patronal numeric(15,2) DEFAULT 0,
    total_irrf numeric(15,2) DEFAULT 0,
    quantidade_servidores integer DEFAULT 0,
    data_processamento timestamp with time zone,
    processado_por uuid,
    tempo_processamento_ms integer,
    hash_fechamento character varying(64),
    data_fechamento timestamp with time zone,
    fechado_por uuid,
    reaberto boolean DEFAULT false,
    reaberto_por uuid,
    reaberto_em timestamp with time zone,
    justificativa_reabertura text,
    quantidade_reaberturas integer DEFAULT 0,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    fechado_em timestamp with time zone,
    justificativa_fechamento text,
    conferido_por uuid,
    conferido_em timestamp with time zone,
    created_by_servidor_id uuid,
    updated_by uuid,
    updated_by_servidor_id uuid
);

ALTER TABLE ONLY public.folhas_pagamento FORCE ROW LEVEL SECURITY;


--
-- Name: form_field_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.form_field_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    form_type text DEFAULT 'pre_cadastro'::text NOT NULL,
    field_key text NOT NULL,
    section text NOT NULL,
    label text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    required boolean DEFAULT false NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid
);


--
-- Name: fornecedores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fornecedores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tipo_pessoa character varying(2) NOT NULL,
    cpf_cnpj character varying(18) NOT NULL,
    razao_social character varying(255) NOT NULL,
    nome_fantasia character varying(255),
    inscricao_estadual character varying(20),
    inscricao_municipal character varying(20),
    endereco_logradouro character varying(255),
    endereco_numero character varying(20),
    endereco_complemento character varying(100),
    endereco_bairro character varying(100),
    endereco_cidade character varying(100),
    endereco_uf character varying(2),
    endereco_cep character varying(10),
    telefone character varying(20),
    email character varying(255),
    site character varying(255),
    representante_nome character varying(255),
    representante_cpf character varying(14),
    representante_telefone character varying(20),
    representante_email character varying(255),
    banco_codigo character varying(10),
    banco_nome character varying(100),
    agencia character varying(20),
    conta character varying(30),
    tipo_conta character varying(20),
    ativo boolean DEFAULT true,
    data_cadastro date DEFAULT CURRENT_DATE,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid,
    CONSTRAINT fornecedores_tipo_pessoa_check CHECK (((tipo_pessoa)::text = ANY ((ARRAY['PF'::character varying, 'PJ'::character varying])::text[])))
);


--
-- Name: fotos_vistoria_inventario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fotos_vistoria_inventario (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    campanha_id uuid NOT NULL,
    unidade_local_id uuid NOT NULL,
    bem_id uuid,
    codigo_objeto text,
    legenda text,
    storage_path text NOT NULL,
    hash_sha256 text NOT NULL,
    latitude numeric(10,8),
    longitude numeric(11,8),
    precisao_m numeric(8,2),
    capturada_em timestamp with time zone NOT NULL,
    enviada_em timestamp with time zone DEFAULT now() NOT NULL,
    mime_type text,
    tamanho_bytes integer,
    tem_pessoa boolean DEFAULT false NOT NULL,
    dispositivo_info jsonb,
    usuario_id uuid DEFAULT auth.uid() NOT NULL,
    CONSTRAINT fotos_vistoria_inventario_hash_sha256_check CHECK ((hash_sha256 ~ '^[0-9a-f]{64}$'::text)),
    CONSTRAINT fotos_vistoria_inventario_latitude_check CHECK (((latitude >= ('-90'::integer)::numeric) AND (latitude <= (90)::numeric))),
    CONSTRAINT fotos_vistoria_inventario_legenda_check CHECK ((length(legenda) <= 500)),
    CONSTRAINT fotos_vistoria_inventario_longitude_check CHECK (((longitude >= ('-180'::integer)::numeric) AND (longitude <= (180)::numeric))),
    CONSTRAINT fotos_vistoria_inventario_mime_type_check CHECK ((mime_type = ANY (ARRAY['image/jpeg'::text, 'image/webp'::text]))),
    CONSTRAINT fotos_vistoria_inventario_precisao_m_check CHECK ((precisao_m >= (0)::numeric)),
    CONSTRAINT fotos_vistoria_inventario_tamanho_bytes_check CHECK (((tamanho_bytes > 0) AND (tamanho_bytes <= 10485760)))
);

ALTER TABLE ONLY public.fotos_vistoria_inventario FORCE ROW LEVEL SECURITY;


--
-- Name: TABLE fotos_vistoria_inventario; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fotos_vistoria_inventario IS 'Evidência fotográfica da vistoria de inventário. Arquivo no bucket privado inventario-evidencias; hash, caminho, captura, coordenadas e autor são imutáveis.';


--
-- Name: frequencia_arquivos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.frequencia_arquivos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    periodo character varying(7) NOT NULL,
    ano integer NOT NULL,
    mes integer NOT NULL,
    servidor_id uuid,
    servidor_nome character varying(255),
    servidor_matricula character varying(50),
    unidade_id uuid,
    unidade_nome character varying(255),
    unidade_sigla character varying(20),
    tipo character varying(20) DEFAULT 'individual'::character varying NOT NULL,
    arquivo_path text NOT NULL,
    arquivo_nome character varying(255) NOT NULL,
    arquivo_tamanho integer,
    hash_conteudo character varying(64),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    created_by_servidor_id uuid,
    updated_at timestamp with time zone,
    updated_by uuid,
    updated_by_servidor_id uuid
);


--
-- Name: frequencia_fechamento; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.frequencia_fechamento (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    servidor_id uuid NOT NULL,
    ano integer NOT NULL,
    mes integer NOT NULL,
    assinado_servidor boolean DEFAULT false,
    assinado_servidor_em timestamp with time zone,
    validado_chefia boolean DEFAULT false,
    validado_chefia_por uuid,
    validado_chefia_em timestamp with time zone,
    consolidado_rh boolean DEFAULT false,
    consolidado_rh_por uuid,
    consolidado_rh_em timestamp with time zone,
    reaberto boolean DEFAULT false,
    reaberto_por uuid,
    reaberto_em timestamp with time zone,
    justificativa_reabertura text,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    created_by_servidor_id uuid,
    updated_by uuid,
    updated_by_servidor_id uuid,
    CONSTRAINT frequencia_fechamento_mes_check CHECK (((mes >= 1) AND (mes <= 12)))
);


--
-- Name: frequencia_mensal; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.frequencia_mensal (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    servidor_id uuid NOT NULL,
    mes integer NOT NULL,
    ano integer NOT NULL,
    dias_trabalhados integer DEFAULT 0,
    dias_falta integer DEFAULT 0,
    dias_atestado integer DEFAULT 0,
    dias_folga integer DEFAULT 0,
    dias_ferias integer DEFAULT 0,
    dias_licenca integer DEFAULT 0,
    horas_trabalhadas numeric(6,2) DEFAULT 0,
    horas_extras numeric(6,2) DEFAULT 0,
    horas_devidas numeric(6,2) DEFAULT 0,
    total_atrasos integer DEFAULT 0,
    total_saidas_antecipadas integer DEFAULT 0,
    percentual_presenca numeric(5,2) DEFAULT 0,
    fechado boolean DEFAULT false,
    data_fechamento timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    created_by_servidor_id uuid,
    updated_by uuid,
    updated_by_servidor_id uuid
);


--
-- Name: frequencia_pacotes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.frequencia_pacotes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    periodo character varying(7) NOT NULL,
    ano integer NOT NULL,
    mes integer NOT NULL,
    unidade_id uuid,
    unidade_nome character varying(255),
    agrupamento_id uuid,
    agrupamento_nome character varying(255),
    tipo character varying(20) DEFAULT 'unidade'::character varying NOT NULL,
    status character varying(20) DEFAULT 'pendente'::character varying NOT NULL,
    arquivo_path text,
    arquivo_nome character varying(255),
    arquivo_tamanho integer,
    total_arquivos integer DEFAULT 0,
    link_download character varying(255),
    link_expira_em timestamp with time zone,
    erro_mensagem text,
    gerado_em timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by_servidor_id uuid,
    updated_by uuid,
    updated_by_servidor_id uuid
);


--
-- Name: galeria_eventos_esportivos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.galeria_eventos_esportivos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    titulo text NOT NULL,
    descricao text,
    foto_url text NOT NULL,
    foto_thumbnail_url text,
    modalidade text,
    naipe text,
    evento text DEFAULT 'seletivas_2026'::text NOT NULL,
    data_evento date,
    fotografo text,
    ordem integer DEFAULT 0,
    destaque boolean DEFAULT false,
    status text DEFAULT 'publicado'::text NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT galeria_eventos_esportivos_status_check CHECK ((status = ANY (ARRAY['rascunho'::text, 'publicado'::text, 'arquivado'::text])))
);


--
-- Name: gestores_escolares; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gestores_escolares (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    escola_id uuid NOT NULL,
    nome text NOT NULL,
    cpf text NOT NULL,
    rg text,
    data_nascimento date,
    email text NOT NULL,
    celular text NOT NULL,
    endereco text,
    status text DEFAULT 'aguardando'::text NOT NULL,
    responsavel_id uuid,
    responsavel_nome text,
    observacoes text,
    contato_realizado boolean DEFAULT false NOT NULL,
    acesso_testado boolean DEFAULT false NOT NULL,
    data_cadastro_cbde timestamp with time zone,
    data_contato timestamp with time zone,
    data_confirmacao timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT gestores_escolares_status_check CHECK ((status = ANY (ARRAY['aguardando'::text, 'em_processamento'::text, 'cadastrado_cbde'::text, 'contato_realizado'::text, 'confirmado'::text, 'problema'::text])))
);


--
-- Name: gestores_escolares_historico; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gestores_escolares_historico (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    gestor_id uuid NOT NULL,
    status_anterior text,
    status_novo text NOT NULL,
    usuario_id uuid,
    usuario_nome text,
    usuario_email text,
    acao text NOT NULL,
    detalhes jsonb DEFAULT '{}'::jsonb,
    ip_address inet,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE gestores_escolares_historico; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.gestores_escolares_historico IS 'Histórico completo de workflow do módulo Gestores Escolares';


--
-- Name: historico_conteudo_oficial; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.historico_conteudo_oficial (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tipo public.tipo_conteudo_institucional NOT NULL,
    identificador text,
    titulo text,
    conteudo text NOT NULL,
    conteudo_estruturado jsonb,
    versao integer DEFAULT 1 NOT NULL,
    promovido_por uuid,
    promovido_em timestamp with time zone DEFAULT now(),
    justificativa text,
    documento_aprovacao_url text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: historico_convites_reuniao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.historico_convites_reuniao (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    reuniao_id uuid NOT NULL,
    participante_id uuid NOT NULL,
    tipo_envio text DEFAULT 'email'::text NOT NULL,
    destinatario text NOT NULL,
    assunto text,
    conteudo text,
    status_envio text DEFAULT 'pendente'::text,
    data_envio timestamp with time zone,
    erro_envio text,
    modelo_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid
);


--
-- Name: historico_funcional; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.historico_funcional (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    servidor_id uuid NOT NULL,
    tipo public.tipo_movimentacao_funcional NOT NULL,
    data_evento date NOT NULL,
    data_vigencia_inicio date,
    data_vigencia_fim date,
    cargo_anterior_id uuid,
    cargo_novo_id uuid,
    unidade_anterior_id uuid,
    unidade_nova_id uuid,
    portaria_numero text,
    portaria_data date,
    documento_url text,
    diario_oficial_numero text,
    diario_oficial_data date,
    descricao text,
    fundamentacao_legal text,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    created_by_servidor_id uuid,
    updated_at timestamp with time zone,
    updated_by uuid,
    updated_by_servidor_id uuid
);


--
-- Name: historico_lai; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.historico_lai (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    solicitacao_id uuid NOT NULL,
    tipo_evento public.tipo_evento_lai NOT NULL,
    status_anterior character varying(50),
    status_novo character varying(50),
    prazo_anterior date,
    prazo_novo date,
    responsavel_anterior_id uuid,
    responsavel_novo_id uuid,
    unidade_anterior_id uuid,
    unidade_nova_id uuid,
    observacao text,
    justificativa text,
    dados_adicionais jsonb DEFAULT '{}'::jsonb,
    ip_address inet,
    user_agent text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: historico_patrimonio; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.historico_patrimonio (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bem_id uuid NOT NULL,
    tipo_evento text NOT NULL,
    data_evento timestamp with time zone DEFAULT now() NOT NULL,
    unidade_local_id uuid,
    responsavel_id uuid,
    localizacao_especifica text,
    estado_conservacao text,
    valor_aquisicao numeric(15,2),
    movimentacao_id uuid,
    manutencao_id uuid,
    baixa_id uuid,
    justificativa text,
    documento_url text,
    dados_anteriores jsonb,
    dados_novos jsonb,
    usuario_id uuid,
    ip_address inet,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT historico_patrimonio_tipo_evento_check CHECK ((tipo_evento = ANY (ARRAY['cadastro'::text, 'tombamento'::text, 'transferencia'::text, 'cessao'::text, 'emprestimo'::text, 'recolhimento'::text, 'manutencao_inicio'::text, 'manutencao_fim'::text, 'baixa_solicitada'::text, 'baixa_aprovada'::text, 'baixa_rejeitada'::text, 'atualizacao_dados'::text, 'troca_responsavel'::text])))
);


--
-- Name: horarios_jornada; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.horarios_jornada (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    configuracao_id uuid NOT NULL,
    dia_semana integer NOT NULL,
    entrada1 time without time zone,
    saida1 time without time zone,
    entrada2 time without time zone,
    saida2 time without time zone,
    created_at timestamp with time zone,
    created_by uuid,
    created_by_servidor_id uuid,
    updated_at timestamp with time zone,
    updated_by uuid,
    updated_by_servidor_id uuid
);


--
-- Name: ia_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ia_config (
    id boolean DEFAULT true NOT NULL,
    ativo boolean DEFAULT false NOT NULL,
    provedor text,
    url_base text,
    modelo text,
    limite_chamadas_hora integer DEFAULT 30 NOT NULL,
    teto_tokens_mes bigint,
    enviar_dados_pessoais boolean DEFAULT false NOT NULL,
    segredo_id uuid,
    segredo_final text,
    segredo_atualizado_em timestamp with time zone,
    updated_by uuid DEFAULT auth.uid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ia_config_ativo_ck CHECK (((NOT ativo) OR ((provedor IS NOT NULL) AND (modelo IS NOT NULL) AND (segredo_id IS NOT NULL)))),
    CONSTRAINT ia_config_id_check CHECK (id),
    CONSTRAINT ia_config_limite_chamadas_hora_check CHECK (((limite_chamadas_hora >= 1) AND (limite_chamadas_hora <= 1000))),
    CONSTRAINT ia_config_modelo_check CHECK (((modelo IS NULL) OR (modelo ~ '^[A-Za-z0-9._:/@-]{1,120}$'::text))),
    CONSTRAINT ia_config_provedor_check CHECK ((provedor = ANY (ARRAY['openai'::text, 'anthropic'::text, 'gemini'::text, 'compativel_openai'::text]))),
    CONSTRAINT ia_config_segredo_final_check CHECK (((segredo_final IS NULL) OR (char_length(segredo_final) = 4))),
    CONSTRAINT ia_config_teto_tokens_mes_check CHECK (((teto_tokens_mes IS NULL) OR (teto_tokens_mes > 0))),
    CONSTRAINT ia_config_url_base_check CHECK (((url_base IS NULL) OR ((char_length(url_base) <= 300) AND (url_base ~ '^https://[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+(:[0-9]{2,5})?(/[A-Za-z0-9._~/-]*)?$'::text)))),
    CONSTRAINT ia_config_url_base_ck CHECK (((url_base IS NOT NULL) = (NOT (provedor IS DISTINCT FROM 'compativel_openai'::text))))
);


--
-- Name: TABLE ia_config; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.ia_config IS 'Configuração da IA da instância (linha única). A chave de API fica no Vault (segredo_id), nunca legível pela API.';


--
-- Name: ia_uso; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ia_uso (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    recurso text NOT NULL,
    provedor text NOT NULL,
    modelo text NOT NULL,
    tokens_entrada integer DEFAULT 0 NOT NULL,
    tokens_saida integer DEFAULT 0 NOT NULL,
    tokens_estimados boolean DEFAULT false NOT NULL,
    status text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ia_uso_recurso_check CHECK ((recurso ~ '^[a-z0-9_]{2,40}$'::text)),
    CONSTRAINT ia_uso_status_check CHECK ((status = ANY (ARRAY['ok'::text, 'erro'::text, 'cortado'::text]))),
    CONSTRAINT ia_uso_tokens_entrada_check CHECK ((tokens_entrada >= 0)),
    CONSTRAINT ia_uso_tokens_saida_check CHECK ((tokens_saida >= 0))
);


--
-- Name: TABLE ia_uso; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.ia_uso IS 'Uma linha por chamada de IA (sem prompt nem resposta). Gravada só pela Edge Function ia-gateway (service role).';


--
-- Name: importacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.importacoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tipo text NOT NULL,
    modulo public.app_module NOT NULL,
    arquivo_nome text NOT NULL,
    arquivo_sha256 text NOT NULL,
    arquivo_tamanho bigint NOT NULL,
    exercicio integer,
    resumo jsonb DEFAULT '{}'::jsonb NOT NULL,
    detalhes jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_by uuid DEFAULT auth.uid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT importacoes_arquivo_nome_check CHECK (((char_length(arquivo_nome) >= 1) AND (char_length(arquivo_nome) <= 255))),
    CONSTRAINT importacoes_arquivo_sha256_check CHECK ((arquivo_sha256 ~ '^[0-9a-f]{64}$'::text)),
    CONSTRAINT importacoes_arquivo_tamanho_check CHECK ((arquivo_tamanho >= 0)),
    CONSTRAINT importacoes_tipo_check CHECK ((tipo ~ '^[a-z0-9_]{3,50}$'::text))
);


--
-- Name: TABLE importacoes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.importacoes IS 'Log das importações de dados aplicadas (tipo do importador, arquivo, hash, resumo e mudanças). Escrita só pelas RPCs de importação. Nome e hash do arquivo são informados pelo navegador: servem para conferência, não como prova.';


--
-- Name: instituicoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.instituicoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo_instituicao text,
    tipo_instituicao public.tipo_instituicao NOT NULL,
    nome_razao_social text NOT NULL,
    nome_fantasia text,
    cnpj text,
    inscricao_estadual text,
    esfera_governo public.esfera_governo,
    orgao_vinculado text,
    endereco_logradouro text,
    endereco_numero text,
    endereco_complemento text,
    endereco_bairro text,
    endereco_cidade text,
    endereco_uf text,
    endereco_cep text,
    telefone text,
    email text,
    site text,
    responsavel_nome text NOT NULL,
    responsavel_cpf text,
    responsavel_cargo text,
    responsavel_telefone text,
    responsavel_email text,
    ato_constituicao text,
    ato_documento_url text,
    data_fundacao date,
    area_atuacao text[],
    observacoes text,
    status public.status_instituicao DEFAULT 'ativo'::public.status_instituicao NOT NULL,
    validado_por uuid,
    data_validacao timestamp with time zone,
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid,
    responsavel_data_nascimento date
);


--
-- Name: COLUMN instituicoes.responsavel_data_nascimento; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.instituicoes.responsavel_data_nascimento IS 'Data de nascimento do representante/responsável da instituição';


--
-- Name: itens_ata_registro_preco; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.itens_ata_registro_preco (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ata_id uuid NOT NULL,
    item_licitatorio_id uuid,
    numero_item integer NOT NULL,
    descricao text NOT NULL,
    unidade_medida character varying(20) NOT NULL,
    quantidade_registrada numeric(18,4) NOT NULL,
    quantidade_consumida numeric(18,4) DEFAULT 0,
    saldo_quantidade numeric(18,4) GENERATED ALWAYS AS ((quantidade_registrada - quantidade_consumida)) STORED,
    valor_unitario numeric(18,4) NOT NULL,
    valor_total numeric(18,2) GENERATED ALWAYS AS ((quantidade_registrada * valor_unitario)) STORED,
    marca character varying(200),
    modelo character varying(200),
    situacao character varying(50) DEFAULT 'disponivel'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: itens_checklist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.itens_checklist (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    checklist_id uuid NOT NULL,
    numero_item character varying(20) NOT NULL,
    descricao text NOT NULL,
    fundamentacao_legal text,
    categoria character varying(100),
    peso integer DEFAULT 1,
    obrigatorio boolean DEFAULT true NOT NULL,
    ordem integer DEFAULT 0 NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid
);


--
-- Name: TABLE itens_checklist; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.itens_checklist IS 'Itens individuais dos checklists de conformidade';


--
-- Name: itens_contrato; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.itens_contrato (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    contrato_id uuid NOT NULL,
    item_ata_id uuid,
    numero_item integer NOT NULL,
    descricao text NOT NULL,
    unidade_medida character varying(20) NOT NULL,
    quantidade numeric(18,4) NOT NULL,
    quantidade_entregue numeric(18,4) DEFAULT 0,
    saldo_quantidade numeric(18,4) GENERATED ALWAYS AS ((quantidade - quantidade_entregue)) STORED,
    valor_unitario numeric(18,4) NOT NULL,
    valor_total numeric(18,2) GENERATED ALWAYS AS ((quantidade * valor_unitario)) STORED,
    situacao character varying(50) DEFAULT 'pendente'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: itens_ficha_financeira; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.itens_ficha_financeira (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ficha_id uuid NOT NULL,
    rubrica_id uuid,
    descricao text NOT NULL,
    tipo character varying(20) NOT NULL,
    valor numeric(15,2) DEFAULT 0 NOT NULL,
    referencia text,
    base_calculo numeric(15,2),
    percentual numeric(8,4),
    ordem integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    created_by_servidor_id uuid,
    updated_at timestamp with time zone,
    updated_by uuid,
    updated_by_servidor_id uuid,
    origem text DEFAULT 'manual'::text NOT NULL,
    CONSTRAINT itens_ficha_financeira_origem_check CHECK ((origem = ANY (ARRAY['automatico'::text, 'manual'::text]))),
    CONSTRAINT itens_ficha_financeira_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['provento'::character varying, 'desconto'::character varying])::text[])))
);


--
-- Name: COLUMN itens_ficha_financeira.origem; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.itens_ficha_financeira.origem IS 'automatico = calculado pelo processamento (refeito a cada processamento); manual = lançado pelo RH (preservado ao reprocessar)';


--
-- Name: itens_licitacao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.itens_licitacao (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    processo_id uuid NOT NULL,
    numero_item integer NOT NULL,
    descricao text NOT NULL,
    unidade_medida character varying(50),
    quantidade numeric(15,4) DEFAULT 1 NOT NULL,
    valor_unitario_estimado numeric(15,4),
    valor_total_estimado numeric(15,2),
    vencedor_id uuid,
    valor_unitario_final numeric(15,4),
    valor_total_final numeric(15,2),
    situacao character varying(50) DEFAULT 'ativo'::character varying,
    observacoes text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: itens_material; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.itens_material (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    categoria_id uuid,
    codigo character varying(30) NOT NULL,
    descricao character varying(200) NOT NULL,
    especificacao text,
    unidade_medida character varying(20) NOT NULL,
    estoque_minimo numeric(18,4) DEFAULT 0,
    estoque_maximo numeric(18,4),
    ponto_reposicao numeric(18,4),
    valor_unitario_medio numeric(18,4),
    ultimo_valor_compra numeric(18,4),
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    codigo_sku text,
    validade date,
    lote text
);


--
-- Name: itens_processo_licitatorio; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.itens_processo_licitatorio (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    processo_id uuid NOT NULL,
    numero_item integer NOT NULL,
    descricao text NOT NULL,
    unidade_medida character varying(20) NOT NULL,
    quantidade numeric(18,4) NOT NULL,
    valor_estimado_unitario numeric(18,4),
    valor_estimado_total numeric(18,2) GENERATED ALWAYS AS ((quantidade * valor_estimado_unitario)) STORED,
    especificacao_tecnica text,
    marca_referencia character varying(200),
    catmat_catser character varying(20),
    situacao character varying(50) DEFAULT 'pendente'::character varying,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: itens_retorno_bancario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.itens_retorno_bancario (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    retorno_id uuid NOT NULL,
    ficha_id uuid,
    servidor_id uuid,
    valor numeric(15,2),
    status character varying(20),
    codigo_ocorrencia character varying(10),
    descricao_ocorrencia text,
    data_pagamento date,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    created_by_servidor_id uuid,
    updated_at timestamp with time zone,
    updated_by uuid,
    updated_by_servidor_id uuid,
    CONSTRAINT itens_retorno_bancario_status_check CHECK (((status)::text = ANY ((ARRAY['pago'::character varying, 'rejeitado'::character varying, 'devolvido'::character varying])::text[])))
);


--
-- Name: justificativas_ponto; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.justificativas_ponto (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    registro_ponto_id uuid NOT NULL,
    tipo public.tipo_justificativa NOT NULL,
    descricao text NOT NULL,
    arquivo_url text,
    status public.status_solicitacao DEFAULT 'pendente'::public.status_solicitacao,
    aprovador_id uuid,
    data_aprovacao timestamp with time zone,
    observacao_aprovador text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    created_by_servidor_id uuid,
    updated_by uuid,
    updated_by_servidor_id uuid
);


--
-- Name: lancamentos_banco_horas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lancamentos_banco_horas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    banco_horas_id uuid NOT NULL,
    data date NOT NULL,
    tipo public.tipo_lancamento_horas NOT NULL,
    horas numeric(5,2) NOT NULL,
    motivo text,
    registro_ponto_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    created_by_servidor_id uuid,
    updated_at timestamp with time zone,
    updated_by uuid,
    updated_by_servidor_id uuid
);


--
-- Name: lancamentos_folha; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lancamentos_folha (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ficha_id uuid,
    rubrica_id uuid,
    rubrica_codigo character varying(10) NOT NULL,
    rubrica_descricao text NOT NULL,
    rubrica_tipo public.tipo_rubrica NOT NULL,
    referencia numeric(15,4),
    valor_base numeric(15,2),
    valor_calculado numeric(15,2) NOT NULL,
    incidiu_inss boolean DEFAULT false,
    incidiu_irrf boolean DEFAULT false,
    origem public.origem_lancamento DEFAULT 'automatico'::public.origem_lancamento,
    competencia_referencia character varying(7),
    observacao text,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    created_by_servidor_id uuid,
    updated_at timestamp with time zone,
    updated_by uuid,
    updated_by_servidor_id uuid
);


--
-- Name: licencas_afastamentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.licencas_afastamentos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    servidor_id uuid NOT NULL,
    tipo_afastamento public.tipo_afastamento NOT NULL,
    tipo_licenca public.tipo_licenca,
    data_inicio date NOT NULL,
    data_fim date,
    dias_afastamento integer,
    portaria_numero text,
    portaria_data date,
    portaria_url text,
    documento_comprobatorio_url text,
    cid text,
    medico_nome text,
    crm text,
    orgao_destino text,
    onus_origem boolean DEFAULT true,
    status text DEFAULT 'ativa'::text,
    fundamentacao_legal text,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    created_by_servidor_id uuid,
    updated_at timestamp with time zone,
    updated_by uuid,
    updated_by_servidor_id uuid,
    CONSTRAINT licencas_afastamentos_status_check CHECK ((status = ANY (ARRAY['ativa'::text, 'encerrada'::text, 'prorrogada'::text, 'cancelada'::text])))
);

ALTER TABLE ONLY public.licencas_afastamentos FORCE ROW LEVEL SECURITY;


--
-- Name: links_uteis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.links_uteis (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    titulo text NOT NULL,
    url text NOT NULL,
    descricao text,
    ordem integer DEFAULT 0 NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    alterado_por uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: liquidacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.liquidacoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero_liquidacao character varying(20) NOT NULL,
    data_liquidacao date NOT NULL,
    empenho_id uuid NOT NULL,
    medicao_id uuid,
    nota_fiscal character varying(50),
    data_nota_fiscal date,
    valor_liquidado numeric(18,2) NOT NULL,
    valor_retido numeric(18,2) DEFAULT 0 NOT NULL,
    valor_liquido numeric(18,2) GENERATED ALWAYS AS ((valor_liquidado - valor_retido)) STORED,
    retencao_inss numeric(18,2) DEFAULT 0,
    retencao_irrf numeric(18,2) DEFAULT 0,
    retencao_iss numeric(18,2) DEFAULT 0,
    outras_retencoes numeric(18,2) DEFAULT 0,
    atestado_por uuid,
    data_atestado date,
    observacao text,
    situacao character varying(30) DEFAULT 'pendente'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    CONSTRAINT liquidacoes_situacao_check CHECK (((situacao)::text = ANY ((ARRAY['pendente'::character varying, 'aprovada'::character varying, 'paga'::character varying, 'cancelada'::character varying])::text[])))
);


--
-- Name: lotacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lotacoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    servidor_id uuid NOT NULL,
    unidade_id uuid NOT NULL,
    cargo_id uuid,
    data_inicio date DEFAULT CURRENT_DATE NOT NULL,
    data_fim date,
    tipo_movimentacao text,
    documento_referencia text,
    observacao text,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    tipo_lotacao public.tipo_lotacao DEFAULT 'lotacao_interna'::public.tipo_lotacao,
    funcao_exercida text,
    orgao_externo text,
    ato_numero text,
    ato_data date,
    ato_url text,
    ato_tipo text,
    ato_doe_numero text,
    ato_doe_data date,
    created_by uuid,
    created_by_servidor_id uuid,
    updated_by uuid,
    updated_by_servidor_id uuid
);

ALTER TABLE ONLY public.lotacoes FORCE ROW LEVEL SECURITY;


--
-- Name: manutencoes_patrimonio; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.manutencoes_patrimonio (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bem_id uuid NOT NULL,
    tipo public.tipo_manutencao NOT NULL,
    data_abertura date DEFAULT CURRENT_DATE NOT NULL,
    descricao_problema text NOT NULL,
    fornecedor_id uuid,
    fornecedor_externo text,
    custo_estimado numeric(12,2),
    custo_final numeric(12,2),
    data_inicio date,
    data_conclusao date,
    status text DEFAULT 'aberta'::text,
    laudo_url text,
    nota_fiscal_url text,
    fotos_urls jsonb DEFAULT '[]'::jsonb,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    CONSTRAINT manutencoes_patrimonio_status_check CHECK ((status = ANY (ARRAY['aberta'::text, 'em_andamento'::text, 'concluida'::text, 'cancelada'::text])))
);

ALTER TABLE ONLY public.manutencoes_patrimonio FORCE ROW LEVEL SECURITY;


--
-- Name: matriz_raci_atribuicoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.matriz_raci_atribuicoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    processo_id uuid NOT NULL,
    papel_id uuid NOT NULL,
    tipo_papel public.tipo_papel_raci NOT NULL,
    etapa_processo character varying(200),
    observacoes text,
    ativo boolean DEFAULT true NOT NULL,
    versao integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_by uuid
);


--
-- Name: TABLE matriz_raci_atribuicoes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.matriz_raci_atribuicoes IS 'Atribuições RACI vinculando processos e papéis';


--
-- Name: matriz_raci_papeis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.matriz_raci_papeis (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo character varying(50) NOT NULL,
    nome character varying(200) NOT NULL,
    descricao text,
    unidade_id uuid,
    cargo_id uuid,
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_by uuid
);


--
-- Name: TABLE matriz_raci_papeis; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.matriz_raci_papeis IS 'Papéis organizacionais para atribuição RACI';


--
-- Name: matriz_raci_processos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.matriz_raci_processos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo character varying(50) NOT NULL,
    nome character varying(200) NOT NULL,
    descricao text,
    modulo_sistema character varying(100),
    ativo boolean DEFAULT true NOT NULL,
    versao integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_by uuid
);


--
-- Name: TABLE matriz_raci_processos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.matriz_raci_processos IS 'Processos administrativos mapeados na Matriz RACI institucional';


--
-- Name: medicoes_contrato; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.medicoes_contrato (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    contrato_id uuid NOT NULL,
    numero_medicao integer NOT NULL,
    periodo_inicio date NOT NULL,
    periodo_fim date NOT NULL,
    valor_medido numeric(15,2) NOT NULL,
    valor_aprovado numeric(15,2),
    status public.status_medicao DEFAULT 'rascunho'::public.status_medicao,
    data_envio timestamp with time zone,
    data_aprovacao timestamp with time zone,
    aprovado_por uuid,
    data_pagamento date,
    nota_fiscal_numero character varying(50),
    nota_fiscal_data date,
    nota_fiscal_valor numeric(15,2),
    observacoes text,
    motivo_rejeicao text,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid
);


--
-- Name: memorandos_lotacao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.memorandos_lotacao (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero_protocolo character varying(50) NOT NULL,
    ano integer DEFAULT EXTRACT(year FROM CURRENT_DATE) NOT NULL,
    lotacao_id uuid NOT NULL,
    servidor_id uuid NOT NULL,
    servidor_nome text NOT NULL,
    servidor_matricula text,
    unidade_destino_id uuid NOT NULL,
    unidade_destino_nome text NOT NULL,
    cargo_id uuid,
    cargo_nome text,
    tipo_movimentacao text NOT NULL,
    data_inicio_exercicio date NOT NULL,
    data_emissao date DEFAULT CURRENT_DATE NOT NULL,
    emitido_por uuid,
    emitido_por_nome text,
    entregue boolean DEFAULT false,
    data_entrega timestamp with time zone,
    recebido_por text,
    assinatura_recebimento text,
    observacoes_entrega text,
    documento_url text,
    observacoes text,
    status character varying(20) DEFAULT 'gerado'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    created_by_servidor_id uuid,
    updated_by uuid,
    updated_by_servidor_id uuid,
    CONSTRAINT memorandos_lotacao_status_check CHECK (((status)::text = ANY ((ARRAY['gerado'::character varying, 'entregue'::character varying, 'cancelado'::character varying])::text[])))
);


--
-- Name: modelos_mensagem_reuniao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.modelos_mensagem_reuniao (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    tipo text DEFAULT 'convite'::text NOT NULL,
    assunto text NOT NULL,
    conteudo_html text NOT NULL,
    variaveis_disponiveis text[],
    ativo boolean DEFAULT true,
    padrao boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: module_access_scopes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.module_access_scopes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    module_name character varying(100) NOT NULL,
    access_scope public.access_scope DEFAULT 'org_unit'::public.access_scope NOT NULL,
    can_create boolean DEFAULT false,
    can_edit boolean DEFAULT false,
    can_delete boolean DEFAULT false,
    can_approve boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: module_permissions_catalog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.module_permissions_catalog (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    module_code text NOT NULL,
    permission_code text NOT NULL,
    label text NOT NULL,
    description text,
    category text,
    action_type text DEFAULT 'visualizar'::text NOT NULL,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: module_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.module_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    module_code text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    display_name text,
    description text,
    features jsonb DEFAULT '[]'::jsonb,
    settings jsonb DEFAULT '{}'::jsonb,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid
);


--
-- Name: movimentacoes_bem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.movimentacoes_bem (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bem_id uuid NOT NULL,
    tipo character varying(30) NOT NULL,
    unidade_origem_id uuid,
    unidade_destino_id uuid,
    responsavel_origem_id uuid,
    responsavel_destino_id uuid,
    data_movimentacao date NOT NULL,
    data_previsao_retorno date,
    data_retorno date,
    valor_anterior numeric(18,2),
    valor_novo numeric(18,2),
    numero_termo character varying(30),
    motivo text,
    observacao text,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    CONSTRAINT movimentacoes_bem_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['transferencia'::character varying, 'cessao'::character varying, 'manutencao'::character varying, 'baixa'::character varying, 'reavaliacao'::character varying, 'inventario'::character varying])::text[])))
);


--
-- Name: movimentacoes_estoque; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.movimentacoes_estoque (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    item_id uuid NOT NULL,
    almoxarifado_id uuid NOT NULL,
    tipo character varying(30) NOT NULL,
    subtipo character varying(30),
    quantidade numeric(18,4) NOT NULL,
    valor_unitario numeric(18,4),
    valor_total numeric(18,2),
    empenho_id uuid,
    nota_fiscal character varying(50),
    requisicao_id uuid,
    almoxarifado_destino_id uuid,
    servidor_responsavel_id uuid,
    setor_destino_id uuid,
    observacao text,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    CONSTRAINT movimentacoes_estoque_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['entrada'::character varying, 'saida'::character varying, 'transferencia'::character varying, 'ajuste'::character varying, 'devolucao'::character varying])::text[])))
);


--
-- Name: movimentacoes_patrimonio; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.movimentacoes_patrimonio (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bem_id uuid NOT NULL,
    tipo public.tipo_movimentacao_patrimonio NOT NULL,
    data_movimentacao date DEFAULT CURRENT_DATE NOT NULL,
    unidade_origem_id uuid,
    setor_origem text,
    sala_origem text,
    responsavel_origem_id uuid,
    unidade_destino_id uuid,
    setor_destino text,
    sala_destino text,
    responsavel_destino_id uuid,
    motivo text NOT NULL,
    observacoes text,
    solicitado_por uuid DEFAULT auth.uid(),
    data_solicitacao timestamp with time zone DEFAULT now(),
    aprovado_por uuid,
    data_aprovacao timestamp with time zone,
    status public.status_movimentacao_patrimonio DEFAULT 'pendente'::public.status_movimentacao_patrimonio,
    motivo_rejeicao text,
    termo_transferencia_url text,
    aceite_responsavel boolean DEFAULT false,
    data_aceite timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    unidade_local_origem_id uuid,
    unidade_local_destino_id uuid,
    documento_url text,
    dados_snapshot jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE ONLY public.movimentacoes_patrimonio FORCE ROW LEVEL SECURITY;


--
-- Name: movimentacoes_processo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.movimentacoes_processo (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    processo_id uuid NOT NULL,
    numero_sequencial integer DEFAULT 1 NOT NULL,
    tipo_movimentacao public.tipo_movimentacao_processo DEFAULT 'encaminhamento'::public.tipo_movimentacao_processo NOT NULL,
    descricao text NOT NULL,
    unidade_origem_id uuid,
    unidade_destino_id uuid,
    servidor_origem_id uuid,
    servidor_destino_id uuid,
    prazo_dias integer,
    prazo_limite date,
    status public.status_movimentacao_processo DEFAULT 'pendente'::public.status_movimentacao_processo NOT NULL,
    data_recebimento timestamp with time zone,
    data_resposta timestamp with time zone,
    observacoes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid
);

ALTER TABLE ONLY public.movimentacoes_processo FORCE ROW LEVEL SECURITY;


--
-- Name: nomeacoes_chefe_unidade; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nomeacoes_chefe_unidade (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    unidade_local_id uuid NOT NULL,
    servidor_id uuid NOT NULL,
    cargo text DEFAULT 'Chefe de Unidade Local'::text NOT NULL,
    ato_nomeacao_tipo public.tipo_ato_nomeacao NOT NULL,
    ato_numero text NOT NULL,
    ato_data_publicacao date NOT NULL,
    ato_doe_numero text,
    ato_doe_data date,
    data_inicio date NOT NULL,
    data_fim date,
    status public.status_nomeacao DEFAULT 'ativo'::public.status_nomeacao NOT NULL,
    documento_nomeacao_url text,
    observacoes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    created_by_servidor_id uuid,
    updated_by_servidor_id uuid
);


--
-- Name: noticias_eventos_esportivos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.noticias_eventos_esportivos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    titulo text NOT NULL,
    slug text NOT NULL,
    subtitulo text,
    conteudo text NOT NULL,
    resumo text,
    imagem_destaque_url text,
    imagem_destaque_alt text,
    categoria text DEFAULT 'geral'::text NOT NULL,
    tags text[] DEFAULT '{}'::text[],
    evento_relacionado text,
    autor_id uuid,
    autor_nome text,
    status text DEFAULT 'rascunho'::text NOT NULL,
    destaque boolean DEFAULT false,
    data_publicacao timestamp with time zone,
    visualizacoes integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT noticias_eventos_esportivos_status_check CHECK ((status = ANY (ARRAY['rascunho'::text, 'publicado'::text, 'arquivado'::text])))
);


--
-- Name: ocorrencias_patrimonio; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ocorrencias_patrimonio (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bem_id uuid NOT NULL,
    tipo public.tipo_ocorrencia_patrimonio NOT NULL,
    data_fato date NOT NULL,
    relato_detalhado text NOT NULL,
    responsavel_relato_id uuid,
    providencias_adotadas text,
    encaminhamento text,
    anexos_urls jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid
);

ALTER TABLE ONLY public.ocorrencias_patrimonio FORCE ROW LEVEL SECURITY;


--
-- Name: ocorrencias_servidor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ocorrencias_servidor (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    servidor_id uuid NOT NULL,
    tipo text NOT NULL,
    data_ocorrencia date NOT NULL,
    descricao text NOT NULL,
    documento_url text,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    created_by_servidor_id uuid,
    updated_at timestamp with time zone,
    updated_by uuid,
    updated_by_servidor_id uuid
);


--
-- Name: pagamentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pagamentos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero_pagamento character varying(20) NOT NULL,
    data_pagamento date NOT NULL,
    liquidacao_id uuid NOT NULL,
    conta_autarquia_id uuid,
    valor_pago numeric(18,2) NOT NULL,
    forma_pagamento character varying(30),
    banco character varying(10),
    agencia character varying(10),
    conta character varying(20),
    numero_documento_bancario character varying(30),
    observacao text,
    situacao character varying(30) DEFAULT 'efetuado'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    CONSTRAINT pagamentos_forma_pagamento_check CHECK (((forma_pagamento)::text = ANY ((ARRAY['ordem_bancaria'::character varying, 'ted'::character varying, 'doc'::character varying, 'pix'::character varying, 'cheque'::character varying, 'dinheiro'::character varying])::text[]))),
    CONSTRAINT pagamentos_situacao_check CHECK (((situacao)::text = ANY ((ARRAY['efetuado'::character varying, 'estornado'::character varying, 'devolvido'::character varying])::text[])))
);


--
-- Name: parametros_folha; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parametros_folha (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tipo_parametro character varying(50) NOT NULL,
    valor numeric(15,4) NOT NULL,
    vigencia_inicio date NOT NULL,
    vigencia_fim date,
    descricao text,
    observacoes text,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    created_by_servidor_id uuid,
    updated_by_servidor_id uuid
);


--
-- Name: pareceres_tecnicos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pareceres_tecnicos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero_parecer character varying(50) NOT NULL,
    ano integer NOT NULL,
    tipo public.tipo_parecer NOT NULL,
    assunto character varying(500) NOT NULL,
    analise text NOT NULL,
    fundamentacao text,
    conclusao text NOT NULL,
    recomendacoes text,
    data_parecer date NOT NULL,
    autor_id uuid,
    unidade_origem_id uuid,
    processo_sei character varying(50),
    modulo_origem character varying(100),
    entidade_origem_tipo character varying(100),
    entidade_origem_id uuid,
    decisao_vinculada_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid
);


--
-- Name: TABLE pareceres_tecnicos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.pareceres_tecnicos IS 'Pareceres técnicos e jurídicos vinculados a processos';


--
-- Name: participantes_reuniao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.participantes_reuniao (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    reuniao_id uuid NOT NULL,
    servidor_id uuid,
    nome_externo text,
    email_externo text,
    telefone_externo text,
    instituicao_externa text,
    cargo_funcao text,
    tipo_participante text DEFAULT 'membro'::text,
    status public.status_participante DEFAULT 'pendente'::public.status_participante,
    obrigatorio boolean DEFAULT false,
    data_confirmacao timestamp with time zone,
    justificativa_ausencia text,
    assinatura_presenca boolean DEFAULT false,
    data_assinatura timestamp with time zone,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    convite_enviado boolean DEFAULT false,
    convite_enviado_em timestamp with time zone,
    convite_enviado_por uuid,
    convite_canal text,
    CONSTRAINT chk_participante CHECK (((servidor_id IS NOT NULL) OR (nome_externo IS NOT NULL)))
);


--
-- Name: patrimonio_unidade; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patrimonio_unidade (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    unidade_local_id uuid NOT NULL,
    item text NOT NULL,
    numero_tombo text,
    categoria text,
    quantidade integer DEFAULT 1,
    estado_conservacao public.estado_conservacao DEFAULT 'bom'::public.estado_conservacao,
    situacao public.situacao_patrimonio DEFAULT 'em_uso'::public.situacao_patrimonio,
    descricao text,
    valor_estimado numeric(12,2),
    data_aquisicao date,
    anexos text[] DEFAULT '{}'::text[],
    observacoes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_by uuid,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: pensoes_alimenticias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pensoes_alimenticias (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    servidor_id uuid,
    beneficiario_nome text NOT NULL,
    beneficiario_cpf character varying(14),
    beneficiario_data_nascimento date,
    beneficiario_parentesco character varying(30),
    numero_processo character varying(50),
    vara_judicial text,
    comarca text,
    data_decisao date,
    tipo_calculo character varying(20) NOT NULL,
    percentual numeric(6,4),
    valor_fixo numeric(15,2),
    base_calculo character varying(50) DEFAULT 'liquido'::character varying,
    prioridade integer DEFAULT 1,
    banco_codigo character varying(3),
    banco_nome character varying(100),
    banco_agencia character varying(10),
    banco_conta character varying(20),
    banco_tipo_conta character varying(20),
    pix_chave text,
    pix_tipo character varying(20),
    ativo boolean DEFAULT true,
    data_inicio date NOT NULL,
    data_fim date,
    decisao_judicial_url text,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    created_by_servidor_id uuid,
    updated_by uuid,
    updated_by_servidor_id uuid
);


--
-- Name: planos_tratamento_risco; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planos_tratamento_risco (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    risco_id uuid NOT NULL,
    codigo character varying(50) NOT NULL,
    titulo character varying(300) NOT NULL,
    descricao text NOT NULL,
    tipo_resposta character varying(50) NOT NULL,
    acao_proposta text NOT NULL,
    recursos_necessarios text,
    responsavel_id uuid,
    prazo_inicio date,
    prazo_conclusao date,
    status character varying(50) DEFAULT 'planejado'::character varying NOT NULL,
    percentual_execucao integer DEFAULT 0,
    resultado_obtido text,
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_by uuid,
    CONSTRAINT planos_tratamento_risco_percentual_execucao_check CHECK (((percentual_execucao >= 0) AND (percentual_execucao <= 100)))
);


--
-- Name: TABLE planos_tratamento_risco; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.planos_tratamento_risco IS 'Planos de ação para tratamento de riscos identificados';


--
-- Name: portal_diretoria; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portal_diretoria (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    cargo text NOT NULL,
    unidade text,
    foto_url text,
    email text,
    telefone text,
    bio text,
    linkedin_url text,
    decreto_nomeacao text,
    data_posse date,
    ordem_exibicao integer DEFAULT 0,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE portal_diretoria; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.portal_diretoria IS 'Diretoria do IDJuv para exibição no portal público';


--
-- Name: portarias_servidor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portarias_servidor (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    servidor_id uuid NOT NULL,
    numero text NOT NULL,
    ano integer NOT NULL,
    data_publicacao date NOT NULL,
    tipo public.tipo_portaria_rh NOT NULL,
    assunto text NOT NULL,
    ementa text,
    conteudo text,
    data_vigencia_inicio date,
    data_vigencia_fim date,
    documento_url text,
    diario_oficial_numero text,
    diario_oficial_data date,
    historico_id uuid,
    status text DEFAULT 'vigente'::text,
    portaria_revogadora_id uuid,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    created_by_servidor_id uuid,
    updated_at timestamp with time zone,
    updated_by uuid,
    updated_by_servidor_id uuid,
    CONSTRAINT portarias_servidor_status_check CHECK ((status = ANY (ARRAY['vigente'::text, 'revogada'::text, 'substituida'::text])))
);

ALTER TABLE ONLY public.portarias_servidor FORCE ROW LEVEL SECURITY;


--
-- Name: prazos_lai; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.prazos_lai (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tipo_prazo character varying(50) NOT NULL,
    descricao text,
    prazo_dias integer NOT NULL,
    prorrogavel boolean DEFAULT false,
    prorrogacao_dias integer DEFAULT 0,
    dias_uteis boolean DEFAULT true,
    base_legal text,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: prazos_processo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.prazos_processo (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    processo_id uuid NOT NULL,
    referencia public.referencia_prazo_processo DEFAULT 'interno'::public.referencia_prazo_processo NOT NULL,
    descricao text NOT NULL,
    base_legal text,
    prazo_dias integer NOT NULL,
    data_inicio date DEFAULT CURRENT_DATE NOT NULL,
    data_limite date NOT NULL,
    cumprido boolean DEFAULT false NOT NULL,
    data_cumprimento date,
    responsavel_id uuid,
    observacoes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid
);

ALTER TABLE ONLY public.prazos_processo FORCE ROW LEVEL SECURITY;


--
-- Name: processos_administrativos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.processos_administrativos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero_processo text NOT NULL,
    ano integer DEFAULT EXTRACT(year FROM now()) NOT NULL,
    tipo_processo public.tipo_processo_administrativo DEFAULT 'outro'::public.tipo_processo_administrativo NOT NULL,
    assunto text NOT NULL,
    descricao text,
    interessado_tipo text DEFAULT 'interno'::text NOT NULL,
    interessado_nome text NOT NULL,
    interessado_documento text,
    unidade_origem_id uuid,
    status public.status_processo_administrativo DEFAULT 'aberto'::public.status_processo_administrativo NOT NULL,
    sigilo public.nivel_sigilo_processo DEFAULT 'publico'::public.nivel_sigilo_processo NOT NULL,
    data_abertura date DEFAULT CURRENT_DATE NOT NULL,
    data_encerramento date,
    processo_origem_id uuid,
    observacoes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    CONSTRAINT processos_administrativos_interessado_tipo_check CHECK ((interessado_tipo = ANY (ARRAY['interno'::text, 'externo'::text])))
);

ALTER TABLE ONLY public.processos_administrativos FORCE ROW LEVEL SECURITY;


--
-- Name: processos_licitatorios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.processos_licitatorios (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero_processo character varying(30) NOT NULL,
    ano integer DEFAULT EXTRACT(year FROM CURRENT_DATE) NOT NULL,
    modalidade public.modalidade_licitacao NOT NULL,
    tipo_licitacao character varying(50),
    objeto text NOT NULL,
    objeto_resumido character varying(500),
    valor_estimado numeric(15,2),
    data_abertura date,
    data_publicacao_edital date,
    data_limite_propostas timestamp with time zone,
    data_sessao timestamp with time zone,
    fase_atual public.fase_licitacao DEFAULT 'planejamento'::public.fase_licitacao,
    historico_fases jsonb DEFAULT '[]'::jsonb,
    unidade_requisitante_id uuid,
    servidor_responsavel_id uuid,
    pregoeiro_id uuid,
    dotacao_orcamentaria text,
    fonte_recurso character varying(50),
    programa_trabalho character varying(50),
    elemento_despesa character varying(50),
    fundamentacao_legal text,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text,
    email text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    tipo_usuario text NOT NULL,
    servidor_id uuid,
    is_active boolean DEFAULT true NOT NULL,
    blocked_at timestamp with time zone,
    blocked_reason text,
    cpf text,
    requires_password_change boolean DEFAULT false,
    restringir_modulos boolean DEFAULT false
);


--
-- Name: programas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.programas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo character varying(20) NOT NULL,
    nome character varying(200) NOT NULL,
    descricao text,
    objetivo text,
    publico_alvo text,
    ano_inicio integer NOT NULL,
    ano_fim integer,
    situacao character varying(30) DEFAULT 'ativo'::character varying,
    unidade_responsavel_id uuid,
    servidor_responsavel_id uuid,
    meta_fisica_total numeric(18,2),
    unidade_medida character varying(50),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    CONSTRAINT programas_situacao_check CHECK (((situacao)::text = ANY ((ARRAY['ativo'::character varying, 'suspenso'::character varying, 'encerrado'::character varying, 'planejamento'::character varying])::text[])))
);


--
-- Name: propostas_licitacao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.propostas_licitacao (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    processo_id uuid NOT NULL,
    item_id uuid,
    fornecedor_id uuid NOT NULL,
    valor_unitario numeric(15,4) NOT NULL,
    valor_total numeric(15,2),
    marca character varying(100),
    modelo character varying(100),
    classificacao integer,
    vencedora boolean DEFAULT false,
    desclassificada boolean DEFAULT false,
    motivo_desclassificacao text,
    data_proposta timestamp with time zone DEFAULT now(),
    observacoes text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: provimentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.provimentos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    servidor_id uuid NOT NULL,
    cargo_id uuid NOT NULL,
    unidade_id uuid,
    status public.status_provimento DEFAULT 'ativo'::public.status_provimento,
    data_nomeacao date NOT NULL,
    data_posse date,
    data_exercicio date,
    data_encerramento date,
    ato_encerramento_tipo text,
    ato_encerramento_numero text,
    ato_encerramento_data date,
    motivo_encerramento text,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid,
    created_by_servidor_id uuid,
    updated_by_servidor_id uuid,
    vaga_id uuid
);

ALTER TABLE ONLY public.provimentos FORCE ROW LEVEL SECURITY;


--
-- Name: TABLE provimentos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.provimentos IS 'Provimentos/nomeações de servidores. Portarias de nomeação devem ser gerenciadas pela Central de Portarias (tabela documentos).';


--
-- Name: COLUMN provimentos.vaga_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.provimentos.vaga_id IS 'Vaga ocupada (vagas_cargo). Período: data_nomeacao até data_encerramento (exclusiva); sem sobreposição na mesma vaga.';


--
-- Name: publicacoes_lai; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.publicacoes_lai (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    categoria character varying(100) NOT NULL,
    subcategoria character varying(100),
    titulo character varying(500) NOT NULL,
    descricao text,
    conteudo text,
    arquivo_url text,
    arquivo_nome character varying(255),
    servidor_id uuid,
    unidade_id uuid,
    contrato_id uuid,
    periodo_referencia character varying(50),
    ano_referencia integer,
    mes_referencia integer,
    publicado boolean DEFAULT false,
    data_publicacao timestamp with time zone,
    publicado_por uuid,
    ordem_exibicao integer DEFAULT 0,
    destaque boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid
);


--
-- Name: publicacoes_legais; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.publicacoes_legais (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    processo_licitatorio_id uuid,
    contrato_id uuid,
    veiculo public.veiculo_publicacao NOT NULL,
    tipo_publicacao character varying(100) NOT NULL,
    numero_publicacao character varying(50),
    data_publicacao date NOT NULL,
    pagina character varying(20),
    secao character varying(50),
    url_publicacao text,
    arquivo_url text,
    conteudo_resumido text,
    pncp_id character varying(50),
    pncp_sequencial integer,
    pncp_sincronizado boolean DEFAULT false,
    pncp_sincronizado_em timestamp with time zone,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_referencia_publicacao CHECK (((processo_licitatorio_id IS NOT NULL) OR (contrato_id IS NOT NULL)))
);


--
-- Name: recursos_lai; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recursos_lai (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    solicitacao_id uuid NOT NULL,
    instancia public.instancia_recurso NOT NULL,
    numero_recurso character varying(30),
    data_interposicao timestamp with time zone DEFAULT now() NOT NULL,
    prazo_resposta date NOT NULL,
    fundamentacao text NOT NULL,
    documentos_anexos jsonb DEFAULT '[]'::jsonb,
    status public.status_recurso_lai DEFAULT 'interposto'::public.status_recurso_lai,
    responsavel_analise_id uuid,
    data_analise timestamp with time zone,
    decisao text,
    fundamentacao_decisao text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: regimes_trabalho; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.regimes_trabalho (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo character varying(20) NOT NULL,
    nome character varying(100) NOT NULL,
    descricao text,
    tipo character varying(30) NOT NULL,
    padrao_escala character varying(20),
    dias_trabalho integer[] DEFAULT ARRAY[1, 2, 3, 4, 5],
    exige_registro_ponto boolean DEFAULT true,
    exige_assinatura_servidor boolean DEFAULT true,
    exige_validacao_chefia boolean DEFAULT true,
    permite_ponto_remoto boolean DEFAULT false,
    exige_localizacao boolean DEFAULT false,
    exige_foto boolean DEFAULT false,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    instituicao_id uuid,
    created_by_servidor_id uuid,
    updated_by uuid,
    updated_by_servidor_id uuid,
    CONSTRAINT regimes_trabalho_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['presencial'::character varying, 'teletrabalho'::character varying, 'hibrido'::character varying, 'plantao'::character varying, 'escala'::character varying])::text[])))
);


--
-- Name: TABLE regimes_trabalho; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.regimes_trabalho IS 'Regimes de trabalho (presencial, teletrabalho, híbrido, etc.)';


--
-- Name: registros_ponto; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.registros_ponto (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    servidor_id uuid NOT NULL,
    data date NOT NULL,
    entrada1 timestamp with time zone,
    saida1 timestamp with time zone,
    entrada2 timestamp with time zone,
    saida2 timestamp with time zone,
    entrada3 timestamp with time zone,
    saida3 timestamp with time zone,
    tipo public.tipo_registro_ponto DEFAULT 'normal'::public.tipo_registro_ponto,
    status public.status_ponto DEFAULT 'incompleto'::public.status_ponto,
    horas_trabalhadas numeric(5,2) DEFAULT 0,
    horas_extras numeric(5,2) DEFAULT 0,
    atrasos integer DEFAULT 0,
    saidas_antecipadas integer DEFAULT 0,
    observacao text,
    latitude numeric(10,8),
    longitude numeric(11,8),
    ip_address text,
    dispositivo text,
    aprovado boolean DEFAULT false,
    aprovador_id uuid,
    data_aprovacao timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    created_by_servidor_id uuid,
    updated_by uuid,
    updated_by_servidor_id uuid
);


--
-- Name: regra_lancamento; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.regra_lancamento (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    modulo public.app_module NOT NULL,
    modo text DEFAULT 'desligado'::text NOT NULL,
    observacao text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    created_by_servidor_id uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid,
    updated_by_servidor_id uuid,
    CONSTRAINT regra_lancamento_modo_check CHECK ((modo = ANY (ARRAY['desligado'::text, 'registrar'::text, 'exigir'::text])))
);


--
-- Name: TABLE regra_lancamento; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.regra_lancamento IS 'Modo da regra de lançamento por setor de cada módulo: desligado, registrar (só anota na trilha) ou exigir (recusa, RHS01). Só o papel admin altera.';


--
-- Name: remessas_bancarias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.remessas_bancarias (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    folha_id uuid NOT NULL,
    conta_autarquia_id uuid NOT NULL,
    numero_remessa integer NOT NULL,
    data_geracao timestamp with time zone DEFAULT now(),
    nome_arquivo text NOT NULL,
    layout character varying(20) DEFAULT 'CNAB240'::character varying NOT NULL,
    quantidade_registros integer DEFAULT 0,
    valor_total numeric(15,2) DEFAULT 0,
    status character varying(20) DEFAULT 'gerada'::character varying,
    arquivo_url text,
    hash_arquivo text,
    observacoes text,
    gerado_por uuid,
    enviado_em timestamp with time zone,
    enviado_por uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    created_by_servidor_id uuid,
    updated_by uuid,
    updated_by_servidor_id uuid,
    arquivo_path text,
    arquivo_sha256 text,
    cancelada_em timestamp with time zone,
    cancelada_por uuid,
    motivo_cancelamento text,
    CONSTRAINT remessas_bancarias_status_check CHECK (((status)::text = ANY ((ARRAY['gerada'::character varying, 'enviada'::character varying, 'processada'::character varying, 'erro'::character varying, 'cancelada'::character varying])::text[])))
);


--
-- Name: COLUMN remessas_bancarias.numero_remessa; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.remessas_bancarias.numero_remessa IS 'Número sequencial do arquivo (NSA) por conta, dado pelo banco no INSERT (o valor do cliente é ignorado)';


--
-- Name: COLUMN remessas_bancarias.quantidade_registros; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.remessas_bancarias.quantidade_registros IS 'Fichas da folha com valor líquido > 0 e banco, agência e conta (favorecidos do arquivo); calculada no INSERT';


--
-- Name: COLUMN remessas_bancarias.valor_total; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.remessas_bancarias.valor_total IS 'Soma do líquido das fichas da folha com valor > 0 e banco, agência e conta; calculada pelo banco no INSERT';


--
-- Name: COLUMN remessas_bancarias.arquivo_path; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.remessas_bancarias.arquivo_path IS 'Objeto do arquivo CNAB no bucket privado remessas-cnab (<id>.rem). Gravado uma vez, por quem processa a folha';


--
-- Name: COLUMN remessas_bancarias.arquivo_sha256; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.remessas_bancarias.arquivo_sha256 IS 'SHA-256 (hex minúsculo) do arquivo guardado em arquivo_path. Gravado junto com o caminho, uma vez';


--
-- Name: COLUMN remessas_bancarias.cancelada_em; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.remessas_bancarias.cancelada_em IS 'Quando a remessa foi cancelada (só pela RPC cancelar_remessa)';


--
-- Name: COLUMN remessas_bancarias.cancelada_por; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.remessas_bancarias.cancelada_por IS 'Usuário que cancelou (auth.uid() na RPC cancelar_remessa; sem FK, como as colunas de autoria da E1)';


--
-- Name: COLUMN remessas_bancarias.motivo_cancelamento; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.remessas_bancarias.motivo_cancelamento IS 'Motivo informado no cancelamento (obrigatório)';


--
-- Name: requisicao_itens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.requisicao_itens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    requisicao_id uuid NOT NULL,
    item_id uuid NOT NULL,
    quantidade_solicitada integer NOT NULL,
    quantidade_atendida integer DEFAULT 0,
    observacoes text,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.requisicao_itens FORCE ROW LEVEL SECURITY;


--
-- Name: requisicoes_material; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.requisicoes_material (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero text NOT NULL,
    almoxarifado_id uuid,
    solicitante_id uuid NOT NULL,
    setor_solicitante_id uuid,
    data_solicitacao date DEFAULT CURRENT_DATE NOT NULL,
    finalidade text,
    status text DEFAULT 'pendente'::text,
    responsavel_entrega_id uuid,
    data_entrega date,
    assinatura_eletronica_aceite text,
    observacoes text,
    anexos_urls jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    CONSTRAINT requisicoes_material_status_check CHECK ((status = ANY (ARRAY['pendente'::text, 'atendida'::text, 'parcialmente_atendida'::text, 'rejeitada'::text, 'cancelada'::text])))
);

ALTER TABLE ONLY public.requisicoes_material FORCE ROW LEVEL SECURITY;


--
-- Name: respostas_checklist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.respostas_checklist (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    item_id uuid NOT NULL,
    exercicio integer NOT NULL,
    status public.status_conformidade DEFAULT 'pendente'::public.status_conformidade NOT NULL,
    justificativa text,
    evidencia_url text,
    evidencia_descricao text,
    responsavel_id uuid,
    data_resposta date,
    plano_acao text,
    prazo_regularizacao date,
    observacoes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_by uuid
);


--
-- Name: TABLE respostas_checklist; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.respostas_checklist IS 'Respostas aos itens de checklist por exercício';


--
-- Name: retornos_bancarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.retornos_bancarios (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    remessa_id uuid,
    data_processamento date,
    arquivo_nome text,
    arquivo_url text,
    quantidade_pagos integer DEFAULT 0,
    quantidade_rejeitados integer DEFAULT 0,
    valor_pago numeric(15,2) DEFAULT 0,
    valor_rejeitado numeric(15,2) DEFAULT 0,
    detalhes jsonb DEFAULT '[]'::jsonb,
    processado_por uuid,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    created_by_servidor_id uuid,
    updated_at timestamp with time zone,
    updated_by uuid,
    updated_by_servidor_id uuid
);


--
-- Name: reunioes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reunioes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    titulo text NOT NULL,
    tipo public.tipo_reuniao DEFAULT 'ordinaria'::public.tipo_reuniao NOT NULL,
    status public.status_reuniao DEFAULT 'agendada'::public.status_reuniao NOT NULL,
    data_reuniao date NOT NULL,
    hora_inicio time without time zone NOT NULL,
    hora_fim time without time zone,
    local text,
    endereco_completo text,
    link_virtual text,
    pauta text,
    observacoes text,
    ata_conteudo text,
    ata_aprovada boolean DEFAULT false,
    unidade_responsavel_id uuid,
    organizador_id uuid,
    numero_protocolo text,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid,
    mensagem_convite text
);


--
-- Name: riscos_institucionais; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.riscos_institucionais (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo character varying(50) NOT NULL,
    titulo character varying(300) NOT NULL,
    descricao text NOT NULL,
    causa text,
    consequencia text,
    modulo_afetado character varying(100),
    processo_raci_id uuid,
    probabilidade_inerente public.nivel_risco NOT NULL,
    impacto_inerente public.nivel_risco NOT NULL,
    nivel_risco_inerente public.nivel_risco NOT NULL,
    controle_existente text,
    probabilidade_residual public.nivel_risco,
    impacto_residual public.nivel_risco,
    nivel_risco_residual public.nivel_risco,
    responsavel_id uuid,
    unidade_responsavel_id uuid,
    status public.status_risco DEFAULT 'identificado'::public.status_risco NOT NULL,
    data_identificacao date DEFAULT CURRENT_DATE NOT NULL,
    data_ultima_avaliacao date,
    proxima_revisao date,
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_by uuid
);


--
-- Name: TABLE riscos_institucionais; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.riscos_institucionais IS 'Registro de riscos institucionais conforme metodologia COSO/TCU';


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    role public.app_role NOT NULL,
    permission text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid
);


--
-- Name: TABLE role_permissions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.role_permissions IS 'Permissões padrão por papel (app_role). Fonte 2 de 3 do RBAC granular; ver docs/RBAC_PERMISSOES.md.';


--
-- Name: rubricas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rubricas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo character varying(10) NOT NULL,
    descricao text NOT NULL,
    tipo public.tipo_rubrica NOT NULL,
    natureza public.natureza_rubrica NOT NULL,
    incide_inss boolean DEFAULT false,
    incide_irrf boolean DEFAULT false,
    incide_fgts boolean DEFAULT false,
    incide_13 boolean DEFAULT false,
    incide_ferias boolean DEFAULT false,
    incide_base_consignavel boolean DEFAULT false,
    compoe_liquido boolean DEFAULT true,
    formula_tipo public.formula_tipo NOT NULL,
    formula_valor numeric(15,4),
    formula_referencia character varying(50),
    formula_expressao text,
    prioridade_desconto integer DEFAULT 100,
    ordem_calculo integer DEFAULT 100,
    valor_minimo numeric(15,2),
    valor_maximo numeric(15,2),
    vigencia_inicio date DEFAULT CURRENT_DATE NOT NULL,
    vigencia_fim date,
    codigo_esocial character varying(10),
    ativo boolean DEFAULT true,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    created_by_servidor_id uuid,
    updated_by_servidor_id uuid
);


--
-- Name: rubricas_historico; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rubricas_historico (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    rubrica_id uuid,
    versao integer NOT NULL,
    dados_anteriores jsonb NOT NULL,
    dados_novos jsonb NOT NULL,
    campos_alterados text[],
    justificativa text,
    alterado_em timestamp with time zone DEFAULT now(),
    alterado_por uuid
);


--
-- Name: seq_requisicao_material; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.seq_requisicao_material
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: seq_tombamento_patrimonio; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.seq_tombamento_patrimonio
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: servidor_regime; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.servidor_regime (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    servidor_id uuid NOT NULL,
    regime_id uuid NOT NULL,
    jornada_id uuid,
    data_inicio date DEFAULT CURRENT_DATE NOT NULL,
    data_fim date,
    carga_horaria_customizada numeric(5,2),
    dias_trabalho_customizados integer[],
    observacoes text,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    created_by_servidor_id uuid,
    updated_by uuid,
    updated_by_servidor_id uuid
);


--
-- Name: servidor_tag_vinculos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.servidor_tag_vinculos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    servidor_id uuid NOT NULL,
    tag_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    created_by_servidor_id uuid,
    updated_at timestamp with time zone,
    updated_by uuid,
    updated_by_servidor_id uuid
);


--
-- Name: servidor_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.servidor_tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    cor text DEFAULT 'blue'::text NOT NULL,
    descricao text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    created_by_servidor_id uuid,
    updated_at timestamp with time zone,
    updated_by uuid,
    updated_by_servidor_id uuid
);


--
-- Name: servidores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.servidores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    nome_completo text NOT NULL,
    nome_social text,
    data_nascimento date,
    sexo text,
    estado_civil text,
    nacionalidade text DEFAULT 'Brasileira'::text,
    naturalidade_cidade text,
    naturalidade_uf text,
    cpf text NOT NULL,
    rg text,
    rg_orgao_expedidor text,
    rg_uf text,
    rg_data_emissao date,
    titulo_eleitor text,
    titulo_zona text,
    titulo_secao text,
    pis_pasep text,
    ctps_numero text,
    ctps_serie text,
    ctps_uf text,
    cnh_numero text,
    cnh_categoria text,
    cnh_validade date,
    certificado_reservista text,
    email_pessoal text,
    email_institucional text,
    telefone_fixo text,
    telefone_celular text,
    telefone_emergencia text,
    contato_emergencia_nome text,
    contato_emergencia_parentesco text,
    endereco_logradouro text,
    endereco_numero text,
    endereco_complemento text,
    endereco_bairro text,
    endereco_cidade text,
    endereco_uf text,
    endereco_cep text,
    banco_codigo text,
    banco_nome text,
    banco_agencia text,
    banco_conta text,
    banco_tipo_conta text,
    matricula text,
    vinculo public.vinculo_funcional DEFAULT 'comissionado'::public.vinculo_funcional NOT NULL,
    situacao public.situacao_funcional DEFAULT 'ativo'::public.situacao_funcional NOT NULL,
    cargo_atual_id uuid,
    unidade_atual_id uuid,
    data_admissao date,
    data_posse date,
    data_exercicio date,
    data_desligamento date,
    carga_horaria integer DEFAULT 40,
    regime_juridico text,
    remuneracao_bruta numeric(12,2),
    gratificacoes numeric(12,2),
    descontos numeric(12,2),
    escolaridade text,
    formacao_academica text,
    instituicao_ensino text,
    ano_conclusao integer,
    cursos_especializacao text[],
    dependentes jsonb DEFAULT '[]'::jsonb,
    declaracao_bens_url text,
    declaracao_bens_data date,
    declaracao_acumulacao_url text,
    declaracao_acumulacao_data date,
    acumula_cargo boolean DEFAULT false,
    acumulo_descricao text,
    observacoes text,
    foto_url text,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    tipo_servidor public.tipo_servidor,
    funcao_exercida text,
    orgao_origem text,
    orgao_destino_cessao text,
    indicacao text,
    raca_cor text,
    pcd boolean DEFAULT false,
    pcd_tipo text,
    nome_mae text,
    nome_pai text,
    ctps_data_emissao date,
    titulo_cidade_votacao text,
    titulo_uf_votacao character varying(2),
    titulo_data_emissao date,
    reservista_orgao text,
    reservista_data_emissao date,
    tipo_sanguineo text,
    reservista_categoria text,
    reservista_ano integer,
    cnh_data_expedicao date,
    cnh_primeira_habilitacao date,
    cnh_uf text,
    possui_vinculo_externo boolean DEFAULT false,
    vinculo_externo_esfera text,
    vinculo_externo_orgao text,
    vinculo_externo_cargo text,
    vinculo_externo_matricula text,
    vinculo_externo_situacao text,
    vinculo_externo_forma text,
    vinculo_externo_ato_id uuid,
    vinculo_externo_observacoes text,
    codigo_interno character varying(10),
    estrangeiro_data_chegada date,
    estrangeiro_data_limite_permanencia date,
    estrangeiro_registro_nacional text,
    estrangeiro_ano_chegada integer,
    molestia_grave boolean DEFAULT false,
    ano_inicio_primeiro_emprego integer,
    ano_fim_primeiro_emprego integer,
    created_by_servidor_id uuid,
    updated_by_servidor_id uuid,
    CONSTRAINT servidores_sexo_check CHECK ((sexo = ANY (ARRAY['M'::text, 'F'::text, 'O'::text])))
);

ALTER TABLE ONLY public.servidores FORCE ROW LEVEL SECURITY;


--
-- Name: COLUMN servidores.indicacao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.servidores.indicacao IS 'Campo estratégico de indicação - acesso restrito a administradores';


--
-- Name: COLUMN servidores.raca_cor; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.servidores.raca_cor IS 'Raça/Cor autodeclarada conforme IBGE';


--
-- Name: COLUMN servidores.pcd; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.servidores.pcd IS 'Pessoa com Deficiência';


--
-- Name: COLUMN servidores.pcd_tipo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.servidores.pcd_tipo IS 'Tipo de deficiência quando PCD=true';


--
-- Name: COLUMN servidores.nome_mae; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.servidores.nome_mae IS 'Nome completo da mãe';


--
-- Name: COLUMN servidores.nome_pai; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.servidores.nome_pai IS 'Nome completo do pai';


--
-- Name: COLUMN servidores.tipo_sanguineo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.servidores.tipo_sanguineo IS 'Tipo sanguíneo do servidor (A+, A-, B+, B-, AB+, AB-, O+, O-)';


--
-- Name: COLUMN servidores.reservista_categoria; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.servidores.reservista_categoria IS 'Categoria da reserva militar';


--
-- Name: COLUMN servidores.reservista_ano; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.servidores.reservista_ano IS 'Ano de entrada na reserva';


--
-- Name: COLUMN servidores.cnh_data_expedicao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.servidores.cnh_data_expedicao IS 'Data de expedição da CNH';


--
-- Name: COLUMN servidores.cnh_primeira_habilitacao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.servidores.cnh_primeira_habilitacao IS 'Data da primeira habilitação';


--
-- Name: COLUMN servidores.cnh_uf; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.servidores.cnh_uf IS 'UF de expedição da CNH';


--
-- Name: COLUMN servidores.possui_vinculo_externo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.servidores.possui_vinculo_externo IS 'Indica se o servidor possui vínculo efetivo em outro órgão';


--
-- Name: COLUMN servidores.vinculo_externo_esfera; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.servidores.vinculo_externo_esfera IS 'Esfera do vínculo: federal, estadual_rr, estadual_outro, municipal';


--
-- Name: COLUMN servidores.vinculo_externo_orgao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.servidores.vinculo_externo_orgao IS 'Nome do órgão onde possui vínculo externo';


--
-- Name: COLUMN servidores.vinculo_externo_cargo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.servidores.vinculo_externo_cargo IS 'Cargo que ocupa no órgão externo';


--
-- Name: COLUMN servidores.vinculo_externo_matricula; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.servidores.vinculo_externo_matricula IS 'Matrícula no órgão externo';


--
-- Name: COLUMN servidores.vinculo_externo_situacao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.servidores.vinculo_externo_situacao IS 'Situação do vínculo externo: ativo, licenciado, cedido, afastado';


--
-- Name: COLUMN servidores.vinculo_externo_forma; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.servidores.vinculo_externo_forma IS 'Forma do vínculo: informal, cessao, requisicao, licenca';


--
-- Name: COLUMN servidores.vinculo_externo_ato_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.servidores.vinculo_externo_ato_id IS 'Referência ao documento/ato formal na Central de Portarias';


--
-- Name: COLUMN servidores.vinculo_externo_observacoes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.servidores.vinculo_externo_observacoes IS 'Observações adicionais sobre o vínculo externo';


--
-- Name: COLUMN servidores.codigo_interno; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.servidores.codigo_interno IS 'Código interno sequencial automático (SRV-00001) para organização de pastas físicas';


--
-- Name: setores_modulo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.setores_modulo (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    modulo public.app_module NOT NULL,
    unidade_id uuid NOT NULL,
    inclui_subordinadas boolean DEFAULT false NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    observacao text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    created_by_servidor_id uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid,
    updated_by_servidor_id uuid
);


--
-- Name: TABLE setores_modulo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.setores_modulo IS 'Unidades da estrutura que são o setor de cada módulo (lançamento por setor). Só o papel admin altera.';


--
-- Name: COLUMN setores_modulo.inclui_subordinadas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.setores_modulo.inclui_subordinadas IS 'true: as unidades abaixo desta na estrutura (superior_id) também são o setor do módulo (padrão false)';


--
-- Name: solicitacoes_abono; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solicitacoes_abono (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    servidor_id uuid NOT NULL,
    tipo_abono_id uuid NOT NULL,
    data_inicio date NOT NULL,
    data_fim date NOT NULL,
    hora_inicio time without time zone,
    hora_fim time without time zone,
    justificativa text NOT NULL,
    documento_url text,
    status character varying(20) DEFAULT 'pendente'::character varying,
    aprovado_chefia_por uuid,
    aprovado_chefia_em timestamp with time zone,
    aprovado_rh_por uuid,
    aprovado_rh_em timestamp with time zone,
    motivo_rejeicao text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    created_by_servidor_id uuid,
    updated_by uuid,
    updated_by_servidor_id uuid,
    CONSTRAINT solicitacoes_abono_status_check CHECK (((status)::text = ANY ((ARRAY['pendente'::character varying, 'aprovado_chefia'::character varying, 'aprovado_rh'::character varying, 'aprovado'::character varying, 'rejeitado'::character varying, 'cancelado'::character varying])::text[])))
);


--
-- Name: solicitacoes_ajuste_ponto; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solicitacoes_ajuste_ponto (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    servidor_id uuid NOT NULL,
    registro_ponto_id uuid,
    data_ocorrido date NOT NULL,
    tipo_ajuste text NOT NULL,
    campo_ajuste text,
    horario_atual timestamp with time zone,
    horario_correto timestamp with time zone,
    motivo text NOT NULL,
    comprovante_url text,
    status public.status_solicitacao DEFAULT 'pendente'::public.status_solicitacao,
    aprovador_id uuid,
    data_aprovacao timestamp with time zone,
    observacao_aprovador text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    created_by_servidor_id uuid,
    updated_by uuid,
    updated_by_servidor_id uuid
);


--
-- Name: solicitacoes_sic; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solicitacoes_sic (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    protocolo character varying(20) NOT NULL,
    solicitante_nome character varying(255) NOT NULL,
    solicitante_documento character varying(20),
    solicitante_email character varying(255),
    solicitante_telefone character varying(20),
    solicitante_hash text,
    descricao_pedido text NOT NULL,
    categoria character varying(100),
    forma_recebimento character varying(50) DEFAULT 'email'::character varying,
    status character varying(50) DEFAULT 'pendente'::character varying,
    prazo_resposta date,
    respondido_em timestamp with time zone,
    respondido_por uuid,
    resposta text,
    resposta_arquivo_url text,
    recurso_texto text,
    recurso_data timestamp with time zone,
    recurso_resposta text,
    recurso_respondido_em timestamp with time zone,
    recurso_respondido_por uuid,
    token_consulta uuid DEFAULT gen_random_uuid(),
    tentativas_consulta integer DEFAULT 0,
    bloqueado_ate timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: tabela_inss; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tabela_inss (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vigencia_inicio date NOT NULL,
    vigencia_fim date,
    faixa_ordem integer NOT NULL,
    valor_minimo numeric(15,2) NOT NULL,
    valor_maximo numeric(15,2),
    aliquota numeric(6,4) NOT NULL,
    descricao text,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    created_by_servidor_id uuid,
    updated_at timestamp with time zone,
    updated_by uuid,
    updated_by_servidor_id uuid
);


--
-- Name: tabela_irrf; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tabela_irrf (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vigencia_inicio date NOT NULL,
    vigencia_fim date,
    faixa_ordem integer NOT NULL,
    valor_minimo numeric(15,2) NOT NULL,
    valor_maximo numeric(15,2),
    aliquota numeric(6,4) NOT NULL,
    parcela_deduzir numeric(15,2) DEFAULT 0 NOT NULL,
    descricao text,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    created_by_servidor_id uuid,
    updated_at timestamp with time zone,
    updated_by uuid,
    updated_by_servidor_id uuid
);


--
-- Name: termos_cessao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.termos_cessao (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agenda_id uuid NOT NULL,
    unidade_local_id uuid NOT NULL,
    numero_termo text NOT NULL,
    ano integer NOT NULL,
    cessionario_nome text NOT NULL,
    cessionario_documento text,
    cessionario_endereco text,
    cessionario_telefone text,
    finalidade text NOT NULL,
    periodo_inicio timestamp with time zone NOT NULL,
    periodo_fim timestamp with time zone NOT NULL,
    condicoes_uso text,
    responsabilidades text,
    chefe_responsavel_id uuid,
    status public.status_termo_cessao DEFAULT 'pendente'::public.status_termo_cessao NOT NULL,
    documento_gerado_url text,
    documento_assinado_url text,
    data_emissao timestamp with time zone,
    data_assinatura date,
    observacoes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    tipo_termo character varying(30) DEFAULT 'autorizacao'::character varying,
    numero_protocolo character varying(50),
    cessionario_tipo character varying(30) DEFAULT 'pessoa_fisica'::character varying,
    cessionario_email character varying(150),
    autoridade_concedente character varying(200),
    autoridade_cargo character varying(100),
    restricoes_uso text,
    termo_responsabilidade_aceito boolean DEFAULT false,
    data_aceite_responsabilidade timestamp with time zone,
    historico_renovacoes jsonb DEFAULT '[]'::jsonb
);


--
-- Name: tipos_abono; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipos_abono (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo character varying(20) NOT NULL,
    nome character varying(100) NOT NULL,
    descricao text,
    conta_como_presenca boolean DEFAULT true,
    exige_documento boolean DEFAULT false,
    exige_aprovacao_chefia boolean DEFAULT true,
    exige_aprovacao_rh boolean DEFAULT false,
    impacto_horas character varying(20) DEFAULT 'neutro'::character varying,
    max_horas_dia numeric(4,2),
    max_ocorrencias_mes integer,
    tipos_documento_aceitos text[],
    ativo boolean DEFAULT true,
    ordem integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    instituicao_id uuid,
    created_by uuid,
    created_by_servidor_id uuid,
    updated_by uuid,
    updated_by_servidor_id uuid,
    CONSTRAINT tipos_abono_impacto_horas_check CHECK (((impacto_horas)::text = ANY ((ARRAY['neutro'::character varying, 'reduz'::character varying, 'compensa'::character varying])::text[])))
);


--
-- Name: TABLE tipos_abono; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tipos_abono IS 'Tipos de abono permitidos (atestado, licença, etc.)';


--
-- Name: unidades_locais; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unidades_locais (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    municipio text NOT NULL,
    tipo_unidade public.tipo_unidade_local NOT NULL,
    nome_unidade text NOT NULL,
    endereco_completo text,
    status public.status_unidade_local DEFAULT 'ativa'::public.status_unidade_local NOT NULL,
    capacidade integer,
    areas_disponiveis text[] DEFAULT '{}'::text[],
    horario_funcionamento text,
    regras_de_uso text,
    observacoes text,
    fotos text[] DEFAULT '{}'::text[],
    documentos text[] DEFAULT '{}'::text[],
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    codigo_unidade character varying(50),
    natureza_uso character varying(50) DEFAULT 'esportivo'::character varying,
    diretoria_vinculada character varying(100),
    unidade_administrativa character varying(100),
    autoridade_autorizadora character varying(150),
    estrutura_disponivel text,
    historico_alteracoes jsonb DEFAULT '[]'::jsonb,
    latitude numeric(10,8),
    longitude numeric(11,8),
    poligono_geojson jsonb,
    area_terreno_m2 numeric(14,2),
    area_construida_m2 numeric(14,2),
    fonte_geometria text,
    geometria_atualizada_em timestamp with time zone,
    geometria_atualizada_por uuid,
    CONSTRAINT unidades_locais_area_construida_m2_check CHECK ((area_construida_m2 >= (0)::numeric)),
    CONSTRAINT unidades_locais_area_terreno_m2_check CHECK ((area_terreno_m2 >= (0)::numeric)),
    CONSTRAINT unidades_locais_fonte_geometria_check CHECK ((fonte_geometria = ANY (ARRAY['manual'::text, 'gps'::text, 'kml'::text]))),
    CONSTRAINT unidades_locais_latitude_check CHECK (((latitude >= ('-90'::integer)::numeric) AND (latitude <= (90)::numeric))),
    CONSTRAINT unidades_locais_longitude_check CHECK (((longitude >= ('-180'::integer)::numeric) AND (longitude <= (180)::numeric))),
    CONSTRAINT unidades_locais_poligono_geojson_check CHECK (((poligono_geojson IS NULL) OR ((poligono_geojson ->> 'type'::text) = ANY (ARRAY['Polygon'::text, 'MultiPolygon'::text]))))
);


--
-- Name: user_modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_modules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    module public.app_module NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    permissions text[] DEFAULT '{}'::text[]
);

ALTER TABLE ONLY public.user_modules FORCE ROW LEVEL SECURITY;


--
-- Name: user_org_units; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_org_units (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    unidade_id uuid NOT NULL,
    is_primary boolean DEFAULT false,
    access_scope public.access_scope DEFAULT 'org_unit'::public.access_scope,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid
);


--
-- Name: user_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    permission text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid
);


--
-- Name: TABLE user_permissions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.user_permissions IS 'Permissões concedidas avulsamente a um usuário. Fonte 1 de 3 do RBAC granular; ver docs/RBAC_PERMISSOES.md.';


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid
);

ALTER TABLE ONLY public.user_roles FORCE ROW LEVEL SECURITY;


--
-- Name: v_cedencias_a_vencer; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_cedencias_a_vencer WITH (security_invoker='on') AS
 SELECT a.id AS agenda_id,
    a.numero_protocolo,
    a.titulo,
    a.solicitante_nome,
    a.data_inicio,
    a.data_fim,
    a.status,
    u.id AS unidade_id,
    u.nome_unidade,
    u.municipio,
    (EXTRACT(day FROM (((a.data_fim)::timestamp without time zone)::timestamp with time zone - CURRENT_TIMESTAMP)))::integer AS dias_para_vencer
   FROM (public.agenda_unidade a
     JOIN public.unidades_locais u ON ((u.id = a.unidade_local_id)))
  WHERE ((a.status = 'aprovado'::public.status_agenda) AND (a.data_fim > CURRENT_TIMESTAMP) AND (EXTRACT(day FROM (((a.data_fim)::timestamp without time zone)::timestamp with time zone - CURRENT_TIMESTAMP)) <= (30)::numeric))
  ORDER BY a.data_fim;


--
-- Name: v_gestores_workflow_auditoria; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_gestores_workflow_auditoria WITH (security_invoker='on') AS
 SELECT h.id AS historico_id,
    h.gestor_id,
    g.nome AS gestor_nome,
    g.cpf AS gestor_cpf,
    g.email AS gestor_email,
    e.nome AS escola_nome,
    e.municipio AS escola_municipio,
    h.status_anterior,
    h.status_novo,
    h.acao,
    h.usuario_id,
    h.usuario_nome AS responsavel,
    h.detalhes,
    h.created_at AS data_acao,
    g.status AS status_atual,
    g.created_at AS data_criacao,
    g.updated_at AS ultima_atualizacao,
        CASE
            WHEN ((g.status <> ALL (ARRAY['confirmado'::text, 'problema'::text])) AND ((EXTRACT(epoch FROM (now() - g.updated_at)) / (3600)::numeric) > (48)::numeric)) THEN true
            ELSE false
        END AS alerta_parado,
    EXTRACT(day FROM (now() - g.updated_at)) AS dias_no_status_atual
   FROM ((public.gestores_escolares_historico h
     JOIN public.gestores_escolares g ON ((g.id = h.gestor_id)))
     LEFT JOIN public.escolas_jer e ON ((e.id = g.escola_id)));


--
-- Name: VIEW v_gestores_workflow_auditoria; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_gestores_workflow_auditoria IS 'View de auditoria do workflow de gestores escolares';


--
-- Name: v_historico_bem_completo; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_historico_bem_completo WITH (security_invoker='on') AS
 SELECT hp.id,
    hp.bem_id,
    hp.tipo_evento,
    hp.data_evento,
    hp.justificativa,
    hp.documento_url,
    hp.dados_anteriores,
    hp.dados_novos,
    bp.numero_patrimonio,
    bp.descricao AS bem_descricao,
    ul.id AS unidade_local_id,
    ul.nome_unidade,
    ul.codigo_unidade,
    s.id AS responsavel_id,
    s.nome_completo AS responsavel_nome
   FROM (((public.historico_patrimonio hp
     JOIN public.bens_patrimoniais bp ON ((bp.id = hp.bem_id)))
     LEFT JOIN public.unidades_locais ul ON ((ul.id = hp.unidade_local_id)))
     LEFT JOIN public.servidores s ON ((s.id = hp.responsavel_id)))
  ORDER BY hp.data_evento DESC;


--
-- Name: v_instituicoes_resumo; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_instituicoes_resumo WITH (security_invoker='on') AS
 SELECT id,
    codigo_instituicao,
    tipo_instituicao,
    nome_razao_social,
    nome_fantasia,
    cnpj,
    esfera_governo,
    orgao_vinculado,
    endereco_cidade,
    endereco_uf,
    telefone,
    email,
    responsavel_nome,
    responsavel_cargo,
    status,
    ativo,
    created_at,
    ( SELECT count(*) AS count
           FROM public.agenda_unidade a
          WHERE (a.instituicao_id = i.id)) AS total_solicitacoes,
    ( SELECT count(*) AS count
           FROM public.agenda_unidade a
          WHERE ((a.instituicao_id = i.id) AND (a.status = 'aprovado'::public.status_agenda))) AS solicitacoes_aprovadas
   FROM public.instituicoes i;


--
-- Name: v_movimentacoes_completas; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_movimentacoes_completas WITH (security_invoker='on') AS
 SELECT m.id,
    m.tipo,
    m.data_movimentacao,
    m.status,
    m.motivo,
    m.observacoes,
    m.termo_transferencia_url,
    m.documento_url,
    m.aceite_responsavel,
    m.data_aceite,
    m.created_at,
    bp.id AS bem_id,
    bp.numero_patrimonio,
    bp.descricao AS bem_descricao,
    bp.categoria_bem,
    bp.valor_aquisicao AS bem_valor,
    uo.id AS origem_unidade_id,
    uo.nome_unidade AS origem_nome,
    uo.codigo_unidade AS origem_codigo,
    so.nome_completo AS origem_responsavel_nome,
    ud.id AS destino_unidade_id,
    ud.nome_unidade AS destino_nome,
    ud.codigo_unidade AS destino_codigo,
    sd.nome_completo AS destino_responsavel_nome,
    sol.nome_completo AS solicitante_nome,
    apr.nome_completo AS aprovador_nome,
    m.data_aprovacao
   FROM (((((((public.movimentacoes_patrimonio m
     JOIN public.bens_patrimoniais bp ON ((bp.id = m.bem_id)))
     LEFT JOIN public.unidades_locais uo ON ((uo.id = m.unidade_local_origem_id)))
     LEFT JOIN public.unidades_locais ud ON ((ud.id = m.unidade_local_destino_id)))
     LEFT JOIN public.servidores so ON ((so.id = m.responsavel_origem_id)))
     LEFT JOIN public.servidores sd ON ((sd.id = m.responsavel_destino_id)))
     LEFT JOIN public.servidores sol ON ((sol.id = m.solicitado_por)))
     LEFT JOIN public.servidores apr ON ((apr.id = m.aprovado_por)));


--
-- Name: v_patrimonio_por_unidade; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_patrimonio_por_unidade WITH (security_invoker='on') AS
 SELECT ul.id AS unidade_id,
    ul.codigo_unidade,
    ul.nome_unidade,
    ul.municipio,
    ul.tipo_unidade,
    ul.status AS status_unidade,
    count(bp.id) AS total_bens,
    COALESCE(sum(bp.valor_aquisicao), (0)::numeric) AS valor_total,
    sum(
        CASE
            WHEN ((bp.situacao)::text = 'alocado'::text) THEN 1
            ELSE 0
        END) AS bens_alocados,
    sum(
        CASE
            WHEN ((bp.situacao)::text = 'em_manutencao'::text) THEN 1
            ELSE 0
        END) AS bens_manutencao,
    sum(
        CASE
            WHEN ((bp.situacao)::text = 'baixado'::text) THEN 1
            ELSE 0
        END) AS bens_baixados,
    count(DISTINCT bp.responsavel_id) AS total_responsaveis
   FROM (public.unidades_locais ul
     LEFT JOIN public.bens_patrimoniais bp ON ((bp.unidade_local_id = ul.id)))
  GROUP BY ul.id, ul.codigo_unidade, ul.nome_unidade, ul.municipio, ul.tipo_unidade, ul.status;


--
-- Name: v_processos_resumo; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_processos_resumo WITH (security_invoker='on') AS
 SELECT p.id,
    ((p.numero_processo || '/'::text) || p.ano) AS numero_formatado,
    (p.tipo_processo)::text AS tipo_processo,
    p.assunto,
    p.interessado_nome,
    (p.status)::text AS status,
    (p.sigilo)::text AS sigilo,
    p.data_abertura,
    p.data_encerramento,
    uo.nome AS unidade_origem,
    ( SELECT count(*) AS count
           FROM public.movimentacoes_processo m
          WHERE (m.processo_id = p.id)) AS total_movimentacoes,
    ( SELECT count(*) AS count
           FROM public.despachos d
          WHERE (d.processo_id = p.id)) AS total_despachos,
    ( SELECT count(*) AS count
           FROM public.documentos_processo doc
          WHERE (doc.processo_id = p.id)) AS total_documentos,
    ( SELECT count(*) AS count
           FROM public.prazos_processo pr
          WHERE ((pr.processo_id = p.id) AND (NOT pr.cumprido) AND (pr.data_limite < CURRENT_DATE))) AS prazos_vencidos,
    ( SELECT max(m.created_at) AS max
           FROM public.movimentacoes_processo m
          WHERE (m.processo_id = p.id)) AS ultima_movimentacao,
    p.created_at,
    p.created_by
   FROM (public.processos_administrativos p
     LEFT JOIN public.estrutura_organizacional uo ON ((uo.id = p.unidade_origem_id)));


--
-- Name: vagas_cargo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vagas_cargo (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo text NOT NULL,
    cargo_id uuid NOT NULL,
    unidade_id uuid,
    data_criacao date NOT NULL,
    ato_criacao text,
    data_extincao date,
    ato_extincao text,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    created_by_servidor_id uuid,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid,
    updated_by_servidor_id uuid,
    CONSTRAINT vagas_cargo_codigo_check CHECK (((codigo = upper(btrim(codigo))) AND (codigo <> ''::text))),
    CONSTRAINT vagas_cargo_extincao_check CHECK (((data_extincao IS NULL) OR (data_extincao >= data_criacao)))
);

ALTER TABLE ONLY public.vagas_cargo FORCE ROW LEVEL SECURITY;


--
-- Name: TABLE vagas_cargo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.vagas_cargo IS 'Quadro de vagas: cada vaga de um cargo, com código único. Quem ocupa e quando: provimentos.vaga_id (sem sobreposição, trigger trg_provimento_vaga). Migração 20261012150000.';


--
-- Name: COLUMN vagas_cargo.codigo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vagas_cargo.codigo IS 'Código único da vaga (maiúsculo). Gerado como <símbolo>.<nnn> pela importação quando a planilha não traz.';


--
-- Name: v_quadro_vagas; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_quadro_vagas WITH (security_invoker='true') AS
 SELECT v.id,
    v.codigo,
    v.cargo_id,
    c.nome AS cargo_nome,
    c.sigla AS cargo_sigla,
    c.categoria AS cargo_categoria,
    v.unidade_id,
    u.nome AS unidade_nome,
    u.sigla AS unidade_sigla,
    v.data_criacao,
    v.ato_criacao,
    v.data_extincao,
    v.ato_extincao,
    v.observacoes,
    public.rh_vaga_situacao(v.id) AS situacao,
    o.id AS provimento_id,
    o.servidor_id AS ocupante_servidor_id,
    COALESCE(s.nome_social, s.nome_completo) AS ocupante_nome,
    o.data_nomeacao AS ocupante_desde,
    o.status AS ocupante_status
   FROM ((((public.vagas_cargo v
     JOIN public.cargos c ON ((c.id = v.cargo_id)))
     LEFT JOIN public.estrutura_organizacional u ON ((u.id = v.unidade_id)))
     LEFT JOIN public.provimentos o ON ((o.id = public.rh_vaga_ocupante_atual(v.id))))
     LEFT JOIN public.servidores s ON ((s.id = o.servidor_id)));


--
-- Name: VIEW v_quadro_vagas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_quadro_vagas IS 'Situação atual de cada vaga (livre, ocupada, extinta) e o ocupante (nome visível a quem lê provimentos e servidores pela RLS). Migração 20261012150000.';


--
-- Name: v_relatorio_patrimonio; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_relatorio_patrimonio WITH (security_invoker='on') AS
 SELECT pu.id,
    pu.numero_tombo,
    pu.item,
    pu.categoria,
    pu.descricao,
    pu.quantidade,
    pu.estado_conservacao,
    pu.situacao,
    pu.valor_estimado,
    pu.data_aquisicao,
    pu.observacoes,
    pu.anexos,
    pu.created_at,
    pu.updated_at,
    ul.id AS unidade_id,
    ul.codigo_unidade,
    ul.nome_unidade,
    ul.tipo_unidade,
    ul.municipio,
    ul.status AS unidade_status,
    (pu.valor_estimado * (COALESCE(pu.quantidade, 1))::numeric) AS valor_total
   FROM (public.patrimonio_unidade pu
     JOIN public.unidades_locais ul ON ((ul.id = pu.unidade_local_id)));


--
-- Name: v_relatorio_tce_pessoal; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_relatorio_tce_pessoal WITH (security_invoker='true') AS
 SELECT s.id,
    s.nome_completo,
    s.cpf,
    s.matricula,
    s.tipo_servidor,
    s.situacao,
    s.data_admissao,
    s.data_posse,
    s.regime_juridico,
    s.carga_horaria,
    s.remuneracao_bruta,
    s.gratificacoes,
    s.descontos,
    ((COALESCE(s.remuneracao_bruta, (0)::numeric) + COALESCE(s.gratificacoes, (0)::numeric)) - COALESCE(s.descontos, (0)::numeric)) AS remuneracao_liquida,
    eo.nome AS unidade_nome,
    eo.sigla AS unidade_sigla,
    c.nome AS cargo_nome,
    s.escolaridade,
    s.raca_cor,
    s.pcd,
    s.pcd_tipo,
    s.sexo,
    s.data_nascimento,
    (EXTRACT(year FROM age((CURRENT_DATE)::timestamp with time zone, (s.data_nascimento)::timestamp with time zone)))::integer AS idade,
    (EXTRACT(year FROM age((CURRENT_DATE)::timestamp with time zone, (s.data_admissao)::timestamp with time zone)))::integer AS anos_servico
   FROM ((public.servidores s
     LEFT JOIN public.estrutura_organizacional eo ON ((eo.id = s.unidade_atual_id)))
     LEFT JOIN public.cargos c ON ((c.id = s.cargo_atual_id)))
  WHERE (s.ativo = true)
  ORDER BY s.nome_completo;


--
-- Name: v_relatorio_unidades_locais; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_relatorio_unidades_locais WITH (security_invoker='on') AS
 SELECT ul.id,
    ul.codigo_unidade,
    ul.nome_unidade,
    ul.tipo_unidade,
    ul.municipio,
    ul.endereco_completo,
    ul.status,
    ul.natureza_uso,
    ul.diretoria_vinculada,
    ul.unidade_administrativa,
    ul.autoridade_autorizadora,
    ul.capacidade,
    ul.horario_funcionamento,
    ul.estrutura_disponivel,
    ul.areas_disponiveis,
    ul.regras_de_uso,
    ul.observacoes,
    ul.fotos,
    ul.documentos,
    ul.created_at,
    ul.updated_at,
    ncu.servidor_id AS chefe_atual_id,
    s.nome_completo AS chefe_atual_nome,
    ncu.cargo AS chefe_atual_cargo,
    ncu.ato_numero AS chefe_ato_numero,
    ncu.data_inicio AS chefe_data_inicio,
    COALESCE(pat.total_itens, (0)::bigint) AS total_patrimonio,
    COALESCE(pat.valor_total, (0)::numeric) AS patrimonio_valor_total,
    COALESCE(pat.itens_bom_estado, (0)::bigint) AS patrimonio_bom_estado,
    COALESCE(pat.itens_manutencao, (0)::bigint) AS patrimonio_manutencao,
    COALESCE(ag.total_agendamentos, (0)::bigint) AS total_agendamentos,
    COALESCE(ag.agendamentos_aprovados, (0)::bigint) AS agendamentos_aprovados,
    COALESCE(ag.agendamentos_solicitados, (0)::bigint) AS agendamentos_pendentes,
    COALESCE(tc.total_termos, (0)::bigint) AS total_termos_cessao,
    COALESCE(tc.termos_vigentes, (0)::bigint) AS termos_vigentes
   FROM (((((public.unidades_locais ul
     LEFT JOIN LATERAL ( SELECT nomeacoes_chefe_unidade.servidor_id,
            nomeacoes_chefe_unidade.cargo,
            nomeacoes_chefe_unidade.ato_numero,
            nomeacoes_chefe_unidade.data_inicio
           FROM public.nomeacoes_chefe_unidade
          WHERE ((nomeacoes_chefe_unidade.unidade_local_id = ul.id) AND (nomeacoes_chefe_unidade.status = 'ativo'::public.status_nomeacao))
          ORDER BY nomeacoes_chefe_unidade.data_inicio DESC
         LIMIT 1) ncu ON (true))
     LEFT JOIN public.servidores s ON ((s.id = ncu.servidor_id)))
     LEFT JOIN LATERAL ( SELECT count(*) AS total_itens,
            sum((patrimonio_unidade.valor_estimado * (COALESCE(patrimonio_unidade.quantidade, 1))::numeric)) AS valor_total,
            count(*) FILTER (WHERE (patrimonio_unidade.estado_conservacao = 'bom'::public.estado_conservacao)) AS itens_bom_estado,
            count(*) FILTER (WHERE (patrimonio_unidade.estado_conservacao = ANY (ARRAY['regular'::public.estado_conservacao, 'ruim'::public.estado_conservacao]))) AS itens_manutencao
           FROM public.patrimonio_unidade
          WHERE (patrimonio_unidade.unidade_local_id = ul.id)) pat ON (true))
     LEFT JOIN LATERAL ( SELECT count(*) AS total_agendamentos,
            count(*) FILTER (WHERE (agenda_unidade.status = 'aprovado'::public.status_agenda)) AS agendamentos_aprovados,
            count(*) FILTER (WHERE (agenda_unidade.status = 'solicitado'::public.status_agenda)) AS agendamentos_solicitados
           FROM public.agenda_unidade
          WHERE (agenda_unidade.unidade_local_id = ul.id)) ag ON (true))
     LEFT JOIN LATERAL ( SELECT count(*) AS total_termos,
            count(*) FILTER (WHERE (termos_cessao.periodo_fim >= CURRENT_DATE)) AS termos_vigentes
           FROM public.termos_cessao
          WHERE (termos_cessao.unidade_local_id = ul.id)) tc ON (true));


--
-- Name: v_relatorio_uso_unidades; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_relatorio_uso_unidades WITH (security_invoker='on') AS
 SELECT ul.id AS unidade_id,
    ul.nome_unidade,
    ul.tipo_unidade,
    ul.municipio,
    a.id AS agenda_id,
    a.titulo,
    a.tipo_uso,
    a.solicitante_nome,
    a.data_inicio,
    a.data_fim,
    a.status AS status_agenda,
    a.publico_estimado,
    (EXTRACT(day FROM (a.data_fim - a.data_inicio)) + (1)::numeric) AS dias_uso
   FROM (public.unidades_locais ul
     JOIN public.agenda_unidade a ON ((a.unidade_local_id = ul.id)))
  WHERE (a.status = ANY (ARRAY['aprovado'::public.status_agenda, 'concluido'::public.status_agenda]));


--
-- Name: v_resumo_patrimonio; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_resumo_patrimonio WITH (security_invoker='on') AS
 SELECT count(*) AS total_bens,
    count(*) FILTER (WHERE (situacao_inventario = 'alocado'::public.situacao_bem_patrimonio)) AS bens_alocados,
    count(*) FILTER (WHERE (situacao_inventario = 'em_manutencao'::public.situacao_bem_patrimonio)) AS bens_manutencao,
    count(*) FILTER (WHERE (situacao_inventario = 'baixado'::public.situacao_bem_patrimonio)) AS bens_baixados,
    count(*) FILTER (WHERE ((estado_conservacao_inventario = 'bom'::public.estado_conservacao_inventario) OR (estado_conservacao_inventario = 'novo'::public.estado_conservacao_inventario))) AS bens_bom_estado,
    count(*) FILTER (WHERE (estado_conservacao_inventario = ANY (ARRAY['ruim'::public.estado_conservacao_inventario, 'inservivel'::public.estado_conservacao_inventario]))) AS bens_atencao,
    sum(valor_aquisicao) AS valor_total_aquisicao,
    sum(COALESCE(valor_liquido, (valor_aquisicao - COALESCE(depreciacao_acumulada, (0)::numeric)))) AS valor_total_liquido
   FROM public.bens_patrimoniais
  WHERE ((situacao)::text IS DISTINCT FROM 'baixado'::text);


--
-- Name: vinculos_servidor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vinculos_servidor (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    servidor_id uuid NOT NULL,
    tipo public.tipo_vinculo_servidor NOT NULL,
    origem public.origem_vinculo DEFAULT 'idjuv'::public.origem_vinculo NOT NULL,
    orgao_nome text,
    cargo_id uuid,
    unidade_id uuid,
    funcao_exercida text,
    onus text,
    data_inicio date NOT NULL,
    data_fim date,
    ativo boolean DEFAULT true NOT NULL,
    ato_tipo text,
    ato_numero text,
    ato_data date,
    ato_doe_numero text,
    ato_doe_data date,
    ato_url text,
    remuneracao_bruta numeric(12,2),
    gratificacoes numeric(12,2),
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    data_posse date,
    data_exercicio date,
    motivo_encerramento text,
    created_by_servidor_id uuid,
    updated_by uuid,
    updated_by_servidor_id uuid,
    CONSTRAINT vinculos_servidor_onus_check CHECK ((onus = ANY (ARRAY['origem'::text, 'destino'::text, 'compartilhado'::text])))
);

ALTER TABLE ONLY public.vinculos_servidor FORCE ROW LEVEL SECURITY;


--
-- Name: v_servidor_tipo_derivado; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_servidor_tipo_derivado WITH (security_invoker='true') AS
 SELECT id AS servidor_id,
    nome_completo,
    matricula,
        CASE
            WHEN ((EXISTS ( SELECT 1
               FROM public.vinculos_servidor v
              WHERE ((v.servidor_id = s.id) AND v.ativo AND (v.tipo = 'efetivo'::public.tipo_vinculo_servidor)))) AND (EXISTS ( SELECT 1
               FROM public.vinculos_servidor v
              WHERE ((v.servidor_id = s.id) AND v.ativo AND (v.tipo = 'comissionado'::public.tipo_vinculo_servidor))))) THEN 'efetivo_comissionado'::text
            WHEN (EXISTS ( SELECT 1
               FROM public.vinculos_servidor v
              WHERE ((v.servidor_id = s.id) AND v.ativo AND (v.tipo = 'efetivo'::public.tipo_vinculo_servidor)))) THEN 'efetivo'::text
            WHEN ((EXISTS ( SELECT 1
               FROM public.vinculos_servidor v
              WHERE ((v.servidor_id = s.id) AND v.ativo AND (v.tipo = 'cedido_entrada'::public.tipo_vinculo_servidor)))) AND (EXISTS ( SELECT 1
               FROM public.vinculos_servidor v
              WHERE ((v.servidor_id = s.id) AND v.ativo AND (v.tipo = 'comissionado'::public.tipo_vinculo_servidor))))) THEN 'cedido_comissionado'::text
            WHEN (EXISTS ( SELECT 1
               FROM public.vinculos_servidor v
              WHERE ((v.servidor_id = s.id) AND v.ativo AND (v.tipo = 'cedido_entrada'::public.tipo_vinculo_servidor)))) THEN 'cedido_entrada'::text
            WHEN ((EXISTS ( SELECT 1
               FROM public.vinculos_servidor v
              WHERE ((v.servidor_id = s.id) AND v.ativo AND (v.tipo = 'federal'::public.tipo_vinculo_servidor)))) AND (EXISTS ( SELECT 1
               FROM public.vinculos_servidor v
              WHERE ((v.servidor_id = s.id) AND v.ativo AND (v.tipo = 'comissionado'::public.tipo_vinculo_servidor))))) THEN 'federal_comissionado'::text
            WHEN (EXISTS ( SELECT 1
               FROM public.vinculos_servidor v
              WHERE ((v.servidor_id = s.id) AND v.ativo AND (v.tipo = 'federal'::public.tipo_vinculo_servidor)))) THEN 'federal'::text
            WHEN (EXISTS ( SELECT 1
               FROM public.vinculos_servidor v
              WHERE ((v.servidor_id = s.id) AND v.ativo AND (v.tipo = 'comissionado'::public.tipo_vinculo_servidor)))) THEN 'comissionado'::text
            WHEN (EXISTS ( SELECT 1
               FROM public.vinculos_servidor v
              WHERE ((v.servidor_id = s.id) AND v.ativo AND (v.tipo = 'requisitado'::public.tipo_vinculo_servidor)))) THEN 'requisitado'::text
            ELSE 'nao_classificado'::text
        END AS tipo_derivado,
    ( SELECT count(*) AS count
           FROM public.vinculos_servidor v
          WHERE ((v.servidor_id = s.id) AND v.ativo)) AS total_vinculos_ativos,
    ( SELECT array_agg(DISTINCT (v.tipo)::text ORDER BY (v.tipo)::text) AS array_agg
           FROM public.vinculos_servidor v
          WHERE ((v.servidor_id = s.id) AND v.ativo)) AS tipos_ativos
   FROM public.servidores s;


--
-- Name: v_servidores_situacao; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_servidores_situacao WITH (security_invoker='on') AS
 SELECT s.id,
    s.nome_completo,
    s.cpf,
    s.matricula,
    s.situacao,
    s.tipo_servidor,
    s.vinculo,
    s.ativo,
    s.foto_url,
    s.cargo_atual_id AS cargo_id,
    s.unidade_atual_id AS unidade_id,
    c.nome AS cargo_nome,
    c.sigla AS cargo_sigla,
    eo.nome AS unidade_nome,
    eo.sigla AS unidade_sigla,
    p.id AS provimento_id,
    p.data_nomeacao,
    p.data_posse,
    p.data_exercicio
   FROM (((public.servidores s
     LEFT JOIN public.cargos c ON ((c.id = s.cargo_atual_id)))
     LEFT JOIN public.estrutura_organizacional eo ON ((eo.id = s.unidade_atual_id)))
     LEFT JOIN LATERAL ( SELECT provimentos.id,
            provimentos.data_nomeacao,
            provimentos.data_posse,
            provimentos.data_exercicio
           FROM public.provimentos
          WHERE ((provimentos.servidor_id = s.id) AND (provimentos.status = 'ativo'::public.status_provimento))
          ORDER BY provimentos.data_nomeacao DESC
         LIMIT 1) p ON (true));


--
-- Name: v_sic_consulta_publica; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_sic_consulta_publica WITH (security_invoker='on') AS
 SELECT protocolo,
    status,
    prazo_resposta,
    respondido_em,
        CASE
            WHEN (respondido_em IS NOT NULL) THEN resposta
            ELSE NULL::text
        END AS resposta,
    (prazo_resposta - CURRENT_DATE) AS dias_restantes
   FROM public.solicitacoes_sic;


--
-- Name: v_vagas_historico; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_vagas_historico WITH (security_invoker='true') AS
 SELECT v.data_criacao AS data,
    'vaga_criada'::text AS evento,
    v.id AS vaga_id,
    v.codigo,
    v.cargo_id,
    c.nome AS cargo_nome,
    c.sigla AS cargo_sigla,
    v.unidade_id,
    u.sigla AS unidade_sigla,
    NULL::uuid AS provimento_id,
    NULL::uuid AS servidor_id,
    NULL::text AS servidor_nome,
    v.ato_criacao AS detalhe,
    v.created_at AS registrado_em
   FROM ((public.vagas_cargo v
     JOIN public.cargos c ON ((c.id = v.cargo_id)))
     LEFT JOIN public.estrutura_organizacional u ON ((u.id = v.unidade_id)))
UNION ALL
 SELECT v.data_extincao AS data,
    'vaga_extinta'::text AS evento,
    v.id AS vaga_id,
    v.codigo,
    v.cargo_id,
    c.nome AS cargo_nome,
    c.sigla AS cargo_sigla,
    v.unidade_id,
    u.sigla AS unidade_sigla,
    NULL::uuid AS provimento_id,
    NULL::uuid AS servidor_id,
    NULL::text AS servidor_nome,
    v.ato_extincao AS detalhe,
    v.updated_at AS registrado_em
   FROM ((public.vagas_cargo v
     JOIN public.cargos c ON ((c.id = v.cargo_id)))
     LEFT JOIN public.estrutura_organizacional u ON ((u.id = v.unidade_id)))
  WHERE (v.data_extincao IS NOT NULL)
UNION ALL
 SELECT p.data_nomeacao AS data,
    'entrada'::text AS evento,
    v.id AS vaga_id,
    v.codigo,
    v.cargo_id,
    c.nome AS cargo_nome,
    c.sigla AS cargo_sigla,
    v.unidade_id,
    u.sigla AS unidade_sigla,
    p.id AS provimento_id,
    p.servidor_id,
    COALESCE(s.nome_social, s.nome_completo) AS servidor_nome,
    NULL::text AS detalhe,
    p.created_at AS registrado_em
   FROM ((((public.provimentos p
     JOIN public.vagas_cargo v ON ((v.id = p.vaga_id)))
     JOIN public.cargos c ON ((c.id = v.cargo_id)))
     LEFT JOIN public.estrutura_organizacional u ON ((u.id = v.unidade_id)))
     LEFT JOIN public.servidores s ON ((s.id = p.servidor_id)))
UNION ALL
 SELECT p.data_encerramento AS data,
    'saida'::text AS evento,
    v.id AS vaga_id,
    v.codigo,
    v.cargo_id,
    c.nome AS cargo_nome,
    c.sigla AS cargo_sigla,
    v.unidade_id,
    u.sigla AS unidade_sigla,
    p.id AS provimento_id,
    p.servidor_id,
    COALESCE(s.nome_social, s.nome_completo) AS servidor_nome,
    NULLIF(concat_ws(' '::text, p.motivo_encerramento, NULLIF(concat_ws(' '::text, p.ato_encerramento_tipo, p.ato_encerramento_numero), ''::text)), ''::text) AS detalhe,
    p.updated_at AS registrado_em
   FROM ((((public.provimentos p
     JOIN public.vagas_cargo v ON ((v.id = p.vaga_id)))
     JOIN public.cargos c ON ((c.id = v.cargo_id)))
     LEFT JOIN public.estrutura_organizacional u ON ((u.id = v.unidade_id)))
     LEFT JOIN public.servidores s ON ((s.id = p.servidor_id)))
  WHERE (p.data_encerramento IS NOT NULL);


--
-- Name: VIEW v_vagas_historico; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_vagas_historico IS 'Histórico do quadro de vagas: vaga criada/extinta (todos leem) e entrada/saída de ocupantes (RLS de provimentos). Migração 20261012150000.';


--
-- Name: viagens_diarias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.viagens_diarias (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    servidor_id uuid NOT NULL,
    data_saida date NOT NULL,
    data_retorno date NOT NULL,
    destino_cidade text NOT NULL,
    destino_uf text NOT NULL,
    destino_pais text DEFAULT 'Brasil'::text,
    finalidade text NOT NULL,
    justificativa text,
    portaria_numero text,
    portaria_data date,
    portaria_url text,
    quantidade_diarias numeric(4,1),
    valor_diaria numeric(10,2),
    valor_total numeric(12,2),
    meio_transporte text,
    veiculo_oficial boolean DEFAULT false,
    passagem_aerea boolean DEFAULT false,
    relatorio_apresentado boolean DEFAULT false,
    relatorio_data date,
    relatorio_url text,
    status text DEFAULT 'solicitada'::text,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    tipo_onus text DEFAULT 'com_onus'::text NOT NULL,
    numero_sei_diarias text,
    workflow_diraf_status text DEFAULT 'pendente'::text,
    workflow_diraf_solicitado_em timestamp with time zone,
    workflow_diraf_concluido_em timestamp with time zone,
    workflow_diraf_observacoes text,
    created_by_servidor_id uuid,
    updated_by uuid,
    updated_by_servidor_id uuid,
    CONSTRAINT viagens_diarias_status_check CHECK ((status = ANY (ARRAY['solicitada'::text, 'autorizada'::text, 'em_andamento'::text, 'concluida'::text, 'cancelada'::text])))
);

ALTER TABLE ONLY public.viagens_diarias FORCE ROW LEVEL SECURITY;


--
-- Name: COLUMN viagens_diarias.tipo_onus; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.viagens_diarias.tipo_onus IS 'sem_onus ou com_onus - define se a viagem gera diárias';


--
-- Name: COLUMN viagens_diarias.numero_sei_diarias; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.viagens_diarias.numero_sei_diarias IS 'Número do processo SEI gerado pela DIRAF para pagamento das diárias';


--
-- Name: COLUMN viagens_diarias.workflow_diraf_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.viagens_diarias.workflow_diraf_status IS 'Status do workflow DIRAF: pendente, solicitado, em_andamento, concluido';


--
-- Name: vinculos_funcionais; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vinculos_funcionais (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    servidor_id uuid NOT NULL,
    tipo_vinculo public.tipo_vinculo_funcional NOT NULL,
    data_inicio date NOT NULL,
    data_fim date,
    ativo boolean DEFAULT true,
    ato_tipo text,
    ato_numero text,
    ato_data date,
    ato_doe_numero text,
    ato_doe_data date,
    ato_url text,
    orgao_origem text,
    onus_origem boolean DEFAULT true,
    orgao_destino text,
    fundamentacao_legal text,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid,
    created_by_servidor_id uuid,
    updated_by_servidor_id uuid
);


--
-- PostgreSQL database dump complete
--


