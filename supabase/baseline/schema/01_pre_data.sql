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
    'em_manutencao'
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
-- Name: atualizar_situacao_servidor(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.atualizar_situacao_servidor() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Atualizar situação baseado no afastamento/licença
  IF TG_TABLE_NAME = 'licencas_afastamentos' THEN
    IF NEW.status = 'ativa' THEN
      UPDATE public.servidores 
      SET situacao = 
        CASE 
          WHEN NEW.tipo_afastamento = 'cessao' THEN 'cedido'::situacao_funcional
          WHEN NEW.tipo_afastamento = 'licenca' THEN 'licenca'::situacao_funcional
          ELSE 'afastado'::situacao_funcional
        END,
        updated_at = now()
      WHERE id = NEW.servidor_id;
    ELSIF NEW.status = 'encerrada' THEN
      UPDATE public.servidores 
      SET situacao = 'ativo'::situacao_funcional,
          updated_at = now()
      WHERE id = NEW.servidor_id;
    END IF;
  -- Atualizar situação baseado nas férias
  ELSIF TG_TABLE_NAME = 'ferias_servidor' THEN
    IF NEW.status = 'em_gozo' THEN
      UPDATE public.servidores 
      SET situacao = 'ferias'::situacao_funcional,
          updated_at = now()
      WHERE id = NEW.servidor_id;
    ELSIF NEW.status = 'concluida' THEN
      UPDATE public.servidores 
      SET situacao = 'ativo'::situacao_funcional,
          updated_at = now()
      WHERE id = NEW.servidor_id;
    END IF;
  END IF;
  
  RETURN NEW;
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
    'update', 'folhas_pagamento', p_folha_id, 'folha',
    format('Folha %s/%s fechada. Justificativa: %s', v_folha.competencia_mes, v_folha.competencia_ano, COALESCE(p_justificativa, 'Sem justificativa')),
    v_user_id
  );
  
  RETURN jsonb_build_object('success', true, 'message', 'Folha fechada com sucesso');
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
  v_nova_situacao situacao_funcional;
  v_tipo_servidor tipo_servidor;
  v_cargo_id UUID;
  v_unidade_id UUID;
  v_vinculo vinculo_funcional;
  v_lotacao RECORD;
BEGIN
  -- Prioridade de situação:
  -- 1. Falecido (permanente)
  -- 2. Exonerado/Desligado (se último provimento encerrado por exoneração)
  -- 3. Férias em gozo
  -- 4. Licença/Afastamento ativo
  -- 5. Cedido (saída ativa)
  -- 6. Ativo (se tem provimento ativo ou cessão de entrada ativa)
  -- 7. Inativo (nenhuma das anteriores)
  
  -- Verificar se já está marcado como falecido
  SELECT situacao INTO v_nova_situacao
  FROM servidores WHERE id = p_servidor_id;
  
  IF v_nova_situacao = 'falecido' THEN
    RETURN; -- Não alterar
  END IF;
  
  -- Verificar se tem provimento encerrado por exoneração/falecimento
  IF EXISTS (
    SELECT 1 FROM provimentos 
    WHERE servidor_id = p_servidor_id 
    AND status = 'encerrado'
    AND motivo_encerramento IN ('exoneracao_pedido', 'exoneracao_oficio', 'falecimento')
    AND NOT EXISTS (
      SELECT 1 FROM provimentos p2 
      WHERE p2.servidor_id = p_servidor_id 
      AND p2.status = 'ativo'
      AND p2.data_nomeacao > provimentos.data_encerramento
    )
  ) THEN
    SELECT CASE motivo_encerramento
      WHEN 'falecimento' THEN 'falecido'::situacao_funcional
      ELSE 'exonerado'::situacao_funcional
    END INTO v_nova_situacao
    FROM provimentos
    WHERE servidor_id = p_servidor_id
    AND status = 'encerrado'
    ORDER BY data_encerramento DESC
    LIMIT 1;
    
    -- Limpar cargo e unidade ao exonerar
    UPDATE servidores 
    SET situacao = v_nova_situacao, 
        cargo_atual_id = NULL,
        unidade_atual_id = NULL,
        updated_at = now() 
    WHERE id = p_servidor_id;
    RETURN;
  END IF;
  
  -- Verificar férias em gozo
  IF EXISTS (
    SELECT 1 FROM ferias_servidor
    WHERE servidor_id = p_servidor_id
    AND status = 'em_gozo'
    AND data_inicio <= CURRENT_DATE
    AND data_fim >= CURRENT_DATE
  ) THEN
    v_nova_situacao := 'ferias';
    -- Manter cargo e unidade durante férias
    UPDATE servidores SET situacao = v_nova_situacao, updated_at = now() WHERE id = p_servidor_id;
    RETURN;
  END IF;
  
  -- Verificar licença/afastamento ativo
  IF EXISTS (
    SELECT 1 FROM licencas_afastamentos
    WHERE servidor_id = p_servidor_id
    AND status = 'ativa'
    AND data_inicio <= CURRENT_DATE
    AND (data_fim IS NULL OR data_fim >= CURRENT_DATE)
  ) THEN
    SELECT CASE tipo_afastamento
      WHEN 'licenca' THEN 'licenca'::situacao_funcional
      ELSE 'afastado'::situacao_funcional
    END INTO v_nova_situacao
    FROM licencas_afastamentos
    WHERE servidor_id = p_servidor_id AND status = 'ativa'
    ORDER BY data_inicio DESC
    LIMIT 1;
    
    -- Manter cargo e unidade durante licença/afastamento
    UPDATE servidores SET situacao = v_nova_situacao, updated_at = now() WHERE id = p_servidor_id;
    RETURN;
  END IF;
  
  -- Verificar cessão de saída ativa (servidor cedido para outro órgão)
  IF EXISTS (
    SELECT 1 FROM cessoes
    WHERE servidor_id = p_servidor_id
    AND tipo = 'saida'
    AND ativa = true
  ) THEN
    v_nova_situacao := 'cedido';
    -- Manter cargo original mas pode ter unidade diferente
    UPDATE servidores SET situacao = v_nova_situacao, updated_at = now() WHERE id = p_servidor_id;
    RETURN;
  END IF;
  
  -- Verificar se tem provimento ativo
  IF EXISTS (
    SELECT 1 FROM provimentos
    WHERE servidor_id = p_servidor_id
    AND status = 'ativo'
  ) THEN
    v_nova_situacao := 'ativo';
    
    -- Buscar dados do provimento ativo mais recente
    SELECT 
      p.cargo_id,
      p.unidade_id,
      CASE c.categoria
        WHEN 'comissionado' THEN 'comissionado'::vinculo_funcional
        WHEN 'efetivo' THEN 'efetivo'::vinculo_funcional
        ELSE 'comissionado'::vinculo_funcional
      END,
      CASE c.categoria
        WHEN 'comissionado' THEN 'comissionado_idjuv'::tipo_servidor
        WHEN 'efetivo' THEN 'efetivo_idjuv'::tipo_servidor
        ELSE 'comissionado_idjuv'::tipo_servidor
      END
    INTO v_cargo_id, v_unidade_id, v_vinculo, v_tipo_servidor
    FROM provimentos p
    JOIN cargos c ON c.id = p.cargo_id
    WHERE p.servidor_id = p_servidor_id AND p.status = 'ativo'
    ORDER BY p.data_nomeacao DESC
    LIMIT 1;
    
    -- Verificar se tem lotação ativa (prioridade sobre provimento para unidade)
    SELECT * INTO v_lotacao
    FROM lotacoes
    WHERE servidor_id = p_servidor_id 
    AND ativo = true
    ORDER BY data_inicio DESC
    LIMIT 1;
    
    IF v_lotacao.id IS NOT NULL THEN
      -- Usar unidade da lotação ativa, mas manter cargo do provimento
      v_unidade_id := v_lotacao.unidade_id;
    END IF;
    
    UPDATE servidores 
    SET situacao = v_nova_situacao, 
        tipo_servidor = COALESCE(v_tipo_servidor, tipo_servidor),
        cargo_atual_id = v_cargo_id,
        unidade_atual_id = v_unidade_id,
        vinculo = v_vinculo,
        updated_at = now() 
    WHERE id = p_servidor_id;
    RETURN;
  END IF;
  
  -- Verificar cessão de entrada ativa (servidor de outro órgão cedido ao IDJuv)
  IF EXISTS (
    SELECT 1 FROM cessoes
    WHERE servidor_id = p_servidor_id
    AND tipo = 'entrada'
    AND ativa = true
  ) THEN
    v_nova_situacao := 'ativo';
    v_tipo_servidor := 'cedido_entrada';
    v_vinculo := 'cedido'::vinculo_funcional;
    
    -- Buscar unidade da cessão de entrada
    SELECT unidade_idjuv_id INTO v_unidade_id
    FROM cessoes
    WHERE servidor_id = p_servidor_id
    AND tipo = 'entrada'
    AND ativa = true
    ORDER BY data_inicio DESC
    LIMIT 1;
    
    UPDATE servidores 
    SET situacao = v_nova_situacao, 
        tipo_servidor = v_tipo_servidor,
        unidade_atual_id = v_unidade_id,
        vinculo = v_vinculo,
        updated_at = now() 
    WHERE id = p_servidor_id;
    RETURN;
  END IF;
  
  -- Nenhuma condição acima: inativo ou aguardando nomeação
  v_nova_situacao := 'inativo';
  UPDATE servidores 
  SET situacao = v_nova_situacao, 
      cargo_atual_id = NULL,
      unidade_atual_id = NULL,
      updated_at = now() 
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
    AS $$
DECLARE
  _action text;
  _before jsonb;
  _after jsonb;
  _entity_id uuid;
  _user_id uuid;
  _description text;
  _module text;
BEGIN
  -- Determinar ação
  IF TG_OP = 'INSERT' THEN
    _action := 'create';
    _before := NULL;
    _after := to_jsonb(NEW);
    _entity_id := NEW.id;
    _description := 'Registro criado em ' || TG_TABLE_NAME;
  ELSIF TG_OP = 'UPDATE' THEN
    _action := 'update';
    _before := to_jsonb(OLD);
    _after := to_jsonb(NEW);
    _entity_id := NEW.id;
    _description := 'Registro atualizado em ' || TG_TABLE_NAME;
  ELSIF TG_OP = 'DELETE' THEN
    _action := 'delete';
    _before := to_jsonb(OLD);
    _after := NULL;
    _entity_id := OLD.id;
    _description := 'Registro excluído de ' || TG_TABLE_NAME;
  END IF;

  -- Obter user_id da sessão (pode ser nulo em operações de sistema)
  _user_id := auth.uid();

  -- Obter o módulo a partir do TG_ARGV (passado como argumento do trigger)
  _module := TG_ARGV[0];

  -- Inserir log de auditoria
  INSERT INTO public.audit_logs (
    action,
    entity_type,
    entity_id,
    module_name,
    before_data,
    after_data,
    user_id,
    description,
    metadata
  ) VALUES (
    _action::audit_action,
    TG_TABLE_NAME,
    _entity_id,
    _module,
    _before,
    _after,
    _user_id,
    _description,
    jsonb_build_object('trigger', true, 'operation', TG_OP, 'table', TG_TABLE_NAME)
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;


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
DECLARE v_vinculo RECORD;
BEGIN
  IF NEW.tipo = 'saida' AND NEW.ativa = true THEN
    SELECT * INTO v_vinculo FROM public.vinculos_funcionais 
    WHERE servidor_id = NEW.servidor_id AND ativo = true ORDER BY data_inicio DESC LIMIT 1;
    
    IF v_vinculo.tipo_vinculo = 'comissionado_idjuv' THEN
      UPDATE public.provimentos SET status = 'encerrado', data_encerramento = NEW.data_inicio,
        motivo_encerramento = 'cessao_comissionado'
      WHERE servidor_id = NEW.servidor_id AND status = 'ativo';
    ELSIF v_vinculo.tipo_vinculo = 'efetivo_idjuv' THEN
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
-- Name: fn_reativar_provimento_retorno_cessao(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_reativar_provimento_retorno_cessao() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE v_vinculo RECORD;
BEGIN
  IF OLD.ativa = true AND NEW.ativa = false AND NEW.data_retorno IS NOT NULL THEN
    SELECT * INTO v_vinculo FROM public.vinculos_funcionais 
    WHERE servidor_id = NEW.servidor_id AND ativo = true ORDER BY data_inicio DESC LIMIT 1;
    
    IF v_vinculo.tipo_vinculo = 'efetivo_idjuv' THEN
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
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_liquido NUMERIC;
  v_margem_pct NUMERIC;
  v_utilizada NUMERIC;
BEGIN
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

  SELECT COUNT(*) INTO v_vagas_ocupadas 
  FROM public.provimentos 
  WHERE cargo_id = NEW.cargo_id AND status = 'ativo'
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
  
  IF v_vagas_ocupadas >= COALESCE(v_cargo.quantidade_vagas, 1) THEN
    RAISE EXCEPTION 'Não há vagas disponíveis para o cargo %', v_cargo.nome;
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
    LANGUAGE plpgsql
    AS $$
DECLARE
  max_codigo INTEGER;
  novo_codigo VARCHAR(10);
BEGIN
  -- Buscar o maior código existente
  SELECT COALESCE(MAX(NULLIF(regexp_replace(codigo_interno, '\D', '', 'g'), '')::INTEGER), 0)
  INTO max_codigo
  FROM public.servidores
  WHERE codigo_interno IS NOT NULL;
  
  -- Gerar novo código com prefixo SRV- e 5 dígitos
  novo_codigo := 'SRV-' || LPAD((max_codigo + 1)::TEXT, 5, '0');
  
  NEW.codigo_interno := novo_codigo;
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
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  v_codigo_unidade TEXT;
  v_prefixo TEXT;
  v_ultimo_seq INTEGER;
  v_novo_seq INTEGER;
  v_numero_patrimonio TEXT;
BEGIN
  -- Buscar código da unidade local
  SELECT codigo_unidade INTO v_codigo_unidade
  FROM unidades_locais
  WHERE id = p_unidade_local_id;

  -- Se não encontrou, usar código genérico
  IF v_codigo_unidade IS NULL THEN
    v_prefixo := 'IDJ-00';
  ELSE
    -- Extrair prefixo de 2 caracteres do tipo (GIN, EST, etc) ou usar primeiros 2 do código
    v_prefixo := 'IDJ-' || LPAD(SUBSTRING(v_codigo_unidade FROM 1 FOR 2), 2, '0');
  END IF;

  -- Buscar último sequencial para este prefixo
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(numero_patrimonio FROM '[0-9]+$') AS INTEGER)
  ), 0) INTO v_ultimo_seq
  FROM bens_patrimoniais
  WHERE numero_patrimonio LIKE v_prefixo || '-%';

  -- Incrementar
  v_novo_seq := v_ultimo_seq + 1;

  -- Formatar: IDJ-XX-0001
  v_numero_patrimonio := v_prefixo || '-' || LPAD(v_novo_seq::TEXT, 4, '0');

  RETURN v_numero_patrimonio;
END;
$_$;


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
  SELECT COALESCE(MAX(numero_remessa), 0) + 1 INTO v_numero
  FROM remessas_bancarias
  WHERE conta_autarquia_id = p_conta_id
  AND EXTRACT(YEAR FROM data_geracao) = p_ano;
  
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
BEGIN
  SELECT role INTO _user_role 
  FROM public.user_roles 
  WHERE user_id = auth.uid() 
  LIMIT 1;
  
  SELECT unidade_id INTO _user_org_unit
  FROM public.user_org_units
  WHERE user_id = auth.uid() AND is_primary = true
  LIMIT 1;
  
  INSERT INTO public.audit_logs (
    user_id, action, entity_type, entity_id, module_name,
    before_data, after_data, description, metadata,
    role_at_time, org_unit_id
  )
  VALUES (
    auth.uid(), _action, _entity_type, _entity_id, _module_name,
    _before_data, _after_data, _description, _metadata,
    _user_role, _user_org_unit
  )
  RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$$;


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
-- Name: meu_servidor_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.meu_servidor_id() RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT servidor_id FROM public.profiles WHERE id = auth.uid() AND is_active;
$$;


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
-- Name: perfil_ativo_atual(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.perfil_ativo_atual() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT COALESCE((SELECT p.is_active FROM public.profiles p WHERE p.id = auth.uid()), false);
$$;


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
-- Name: processar_folha_pagamento(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.processar_folha_pagamento(p_folha_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_folha RECORD;
  v_servidor RECORD;
  v_count INTEGER := 0;
  v_errors JSONB := '[]'::jsonb;
  v_base_inss NUMERIC;
  v_valor_inss NUMERIC;
  v_base_irrf NUMERIC;
  v_valor_irrf NUMERIC;
  v_qtd_dependentes INTEGER;
  v_deducao_dependentes NUMERIC;
  v_total_descontos NUMERIC;
  v_valor_liquido NUMERIC;
  v_vencimento NUMERIC;
  v_data_referencia DATE;
  v_total_servidores_ativos INTEGER := 0;
  v_total_com_provimento INTEGER := 0;
  v_total_sem_vencimento INTEGER := 0;
BEGIN
  -- Guarda (migração 20261010070000): só quem tem a permissão de processar a folha (ou o papel admin,
  -- via has_permission_code) executa. 42501 = insufficient_privilege, mesmo código das policies.
  IF NOT public.has_permission_code(auth.uid(), 'financeiro.folha.processar') THEN
    RAISE EXCEPTION 'Sem permissão para processar a folha' USING ERRCODE = '42501';
  END IF;

  -- Buscar folha
  SELECT * INTO v_folha FROM folhas_pagamento WHERE id = p_folha_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('sucesso', false, 'erro', 'Folha não encontrada', 'servidores_processados', 0);
  END IF;
  
  -- Verificar status - permitir previa, aberta, reaberta ou processando
  IF v_folha.status NOT IN ('aberta', 'processando', 'reaberta', 'previa') THEN
    RETURN jsonb_build_object('sucesso', false, 'erro', 'Folha não está em status que permita processamento. Status atual: ' || v_folha.status, 'servidores_processados', 0);
  END IF;
  
  -- Data de referência para cálculos (último dia do mês da competência)
  v_data_referencia := (make_date(v_folha.competencia_ano, v_folha.competencia_mes, 1) + interval '1 month - 1 day')::date;
  
  -- Atualizar status para processando
  UPDATE folhas_pagamento SET status = 'processando', updated_at = now() WHERE id = p_folha_id;
  
  -- Limpar fichas existentes desta folha (para reprocessamento)
  DELETE FROM fichas_financeiras WHERE folha_id = p_folha_id;
  
  -- Contar total de servidores ativos
  SELECT COUNT(*) INTO v_total_servidores_ativos
  FROM servidores s
  WHERE s.situacao = 'ativo' AND s.ativo = true;
  
  -- Contar servidores com provimento ativo
  SELECT COUNT(DISTINCT s.id) INTO v_total_com_provimento
  FROM servidores s
  INNER JOIN provimentos p ON p.servidor_id = s.id AND p.status = 'ativo'
  WHERE s.situacao = 'ativo' AND s.ativo = true;
  
  -- Buscar servidores ativos com provimento ativo (incluindo dados bancários)
  FOR v_servidor IN
    SELECT 
      s.id,
      s.nome_completo,
      s.cpf,
      s.matricula,
      s.pis_pasep,
      s.banco_codigo,
      s.banco_nome,
      s.banco_agencia,
      s.banco_conta,
      s.banco_tipo_conta,
      p.cargo_id,
      p.unidade_id,
      c.nome AS cargo_nome,
      COALESCE(c.vencimento_base, 0) AS vencimento_base,
      eo.nome AS unidade_nome,
      eo.sigla AS unidade_sigla
    FROM servidores s
    INNER JOIN provimentos p ON p.servidor_id = s.id AND p.status = 'ativo'
    INNER JOIN cargos c ON c.id = p.cargo_id
    LEFT JOIN estrutura_organizacional eo ON eo.id = p.unidade_id
    WHERE s.situacao = 'ativo'
      AND s.ativo = true
  LOOP
    BEGIN
      -- Vencimento base do cargo
      v_vencimento := COALESCE(v_servidor.vencimento_base, 0);
      
      -- Se não tem vencimento, registrar erro e pular
      IF v_vencimento <= 0 THEN
        v_total_sem_vencimento := v_total_sem_vencimento + 1;
        v_errors := v_errors || jsonb_build_object(
          'servidor_id', v_servidor.id,
          'nome', v_servidor.nome_completo,
          'cargo', v_servidor.cargo_nome,
          'erro', 'Cargo sem vencimento base definido'
        );
        CONTINUE;
      END IF;
      
      -- Calcular INSS
      v_base_inss := v_vencimento;
      v_valor_inss := calcular_inss_servidor(v_base_inss, v_data_referencia);
      
      -- Contar dependentes e calcular dedução
      v_qtd_dependentes := count_dependentes_irrf(v_servidor.id, v_data_referencia);
      v_deducao_dependentes := v_qtd_dependentes * COALESCE(get_parametro_vigente('deducao_dependente_irrf', v_data_referencia), 189.59);
      
      -- Calcular IRRF
      v_base_irrf := v_vencimento - v_valor_inss - v_deducao_dependentes;
      IF v_base_irrf < 0 THEN v_base_irrf := 0; END IF;
      v_valor_irrf := calcular_irrf(v_base_irrf, v_data_referencia);
      
      -- Total de descontos
      v_total_descontos := v_valor_inss + v_valor_irrf;
      
      -- Valor líquido
      v_valor_liquido := v_vencimento - v_total_descontos;
      
      -- Inserir ficha financeira COM DADOS BANCÁRIOS
      INSERT INTO fichas_financeiras (
        folha_id,
        servidor_id,
        competencia_ano,
        competencia_mes,
        tipo_folha,
        cargo_id,
        cargo_nome,
        cargo_vencimento,
        unidade_id,
        unidade_nome,
        total_proventos,
        total_descontos,
        valor_liquido,
        base_inss,
        valor_inss,
        base_irrf,
        valor_irrf,
        quantidade_dependentes,
        valor_deducao_dependentes,
        -- DADOS BANCÁRIOS COPIADOS DO SERVIDOR
        banco_codigo,
        banco_nome,
        banco_agencia,
        banco_conta,
        banco_tipo_conta,
        processado,
        data_processamento,
        created_at
      ) VALUES (
        p_folha_id,
        v_servidor.id,
        v_folha.competencia_ano,
        v_folha.competencia_mes,
        v_folha.tipo_folha,
        v_servidor.cargo_id,
        v_servidor.cargo_nome,
        v_vencimento,
        v_servidor.unidade_id,
        COALESCE(v_servidor.unidade_sigla, '') || ' - ' || COALESCE(v_servidor.unidade_nome, ''),
        v_vencimento,
        v_total_descontos,
        v_valor_liquido,
        v_base_inss,
        v_valor_inss,
        v_base_irrf,
        v_valor_irrf,
        v_qtd_dependentes,
        v_deducao_dependentes,
        -- DADOS BANCÁRIOS
        v_servidor.banco_codigo,
        v_servidor.banco_nome,
        v_servidor.banco_agencia,
        v_servidor.banco_conta,
        v_servidor.banco_tipo_conta,
        true,
        now(),
        now()
      );
      
      v_count := v_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors || jsonb_build_object(
        'servidor_id', v_servidor.id,
        'nome', v_servidor.nome_completo,
        'erro', SQLERRM
      );
    END;
  END LOOP;
  
  -- Atualizar totais da folha - manter status "aberta" para permitir ajustes
  UPDATE folhas_pagamento
  SET 
    total_bruto = COALESCE((SELECT SUM(total_proventos) FROM fichas_financeiras WHERE folha_id = p_folha_id), 0),
    total_descontos = COALESCE((SELECT SUM(total_descontos) FROM fichas_financeiras WHERE folha_id = p_folha_id), 0),
    total_liquido = COALESCE((SELECT SUM(valor_liquido) FROM fichas_financeiras WHERE folha_id = p_folha_id), 0),
    total_inss_servidor = COALESCE((SELECT SUM(valor_inss) FROM fichas_financeiras WHERE folha_id = p_folha_id), 0),
    total_irrf = COALESCE((SELECT SUM(valor_irrf) FROM fichas_financeiras WHERE folha_id = p_folha_id), 0),
    quantidade_servidores = v_count,
    status = 'aberta',
    data_processamento = now(),
    updated_at = now()
  WHERE id = p_folha_id;
  
  -- Retorno em formato JSONB
  RETURN jsonb_build_object(
    'sucesso', true,
    'servidores_processados', v_count,
    'total_servidores_ativos', v_total_servidores_ativos,
    'total_com_provimento', v_total_com_provimento,
    'total_sem_vencimento', v_total_sem_vencimento,
    'erros', v_errors
  );
  
EXCEPTION
  WHEN insufficient_privilege THEN
    -- Guarda de permissão (início do corpo): propaga o 42501. Sem esta cláusula o handler abaixo engolia
    -- a exceção e, como SECURITY DEFINER, "revertia" a folha para 'aberta' — inclusive uma folha fechada —
    -- a pedido de quem NÃO tem permissão.
    RAISE;
  WHEN OTHERS THEN
  -- Em caso de erro, reverter status
  UPDATE folhas_pagamento SET status = 'aberta', updated_at = now() WHERE id = p_folha_id;
  
  RETURN jsonb_build_object(
    'sucesso', false,
    'erro', SQLERRM,
    'servidores_processados', v_count
  );
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
  
  -- Buscar folha
  SELECT * INTO v_folha FROM public.folhas_pagamento WHERE id = p_folha_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Folha não encontrada');
  END IF;
  
  -- Verificar status atual
  IF v_folha.status != 'fechada' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Apenas folhas fechadas podem ser reabertas');
  END IF;
  
  -- Atualizar para reaberta
  UPDATE public.folhas_pagamento
  SET 
    status = 'reaberta',
    reaberto_por = v_user_id,
    reaberto_em = now(),
    justificativa_reabertura = p_justificativa
  WHERE id = p_folha_id;
  
  -- Registrar no audit_log
  INSERT INTO public.audit_logs (
    action, entity_type, entity_id, module_name, description, user_id
  ) VALUES (
    'update', 'folhas_pagamento', p_folha_id, 'folha',
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
    INSERT INTO historico_patrimonio (bem_id, tipo_evento, manutencao_id, justificativa, usuario_id)
    VALUES (NEW.bem_id, 'manutencao_inicio', NEW.id, NEW.descricao_problema, auth.uid());
    
    UPDATE bens_patrimoniais SET situacao = 'em_manutencao', updated_at = now() WHERE id = NEW.bem_id;
  END IF;
  
  IF TG_OP = 'UPDATE' AND NEW.status = 'concluida' AND (OLD.status IS DISTINCT FROM 'concluida') THEN
    INSERT INTO historico_patrimonio (bem_id, tipo_evento, manutencao_id, justificativa, usuario_id, dados_novos)
    VALUES (NEW.bem_id, 'manutencao_fim', NEW.id, NEW.observacoes, auth.uid(),
            jsonb_build_object('custo_final', NEW.custo_final, 'data_conclusao', NEW.data_conclusao));
    
    UPDATE bens_patrimoniais SET situacao = 'alocado', updated_at = now()
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
  IF NEW.status = 'aprovada' AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'aprovada') THEN
    INSERT INTO historico_patrimonio (
      bem_id, tipo_evento, unidade_local_id, responsavel_id,
      movimentacao_id, justificativa, documento_url,
      dados_anteriores, dados_novos, usuario_id
    ) VALUES (
      NEW.bem_id, 
      NEW.tipo::TEXT,
      NEW.unidade_local_destino_id,
      NEW.responsavel_destino_id,
      NEW.id,
      NEW.motivo,
      NEW.termo_transferencia_url,
      jsonb_build_object('unidade_local_id', NEW.unidade_local_origem_id),
      jsonb_build_object('unidade_local_id', NEW.unidade_local_destino_id),
      auth.uid()
    );
    
    UPDATE bens_patrimoniais
    SET 
      unidade_local_id = NEW.unidade_local_destino_id,
      responsavel_id = COALESCE(NEW.responsavel_destino_id, responsavel_id),
      updated_at = now()
    WHERE id = NEW.bem_id;
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
    
    IF OLD.situacao IS DISTINCT FROM NEW.situacao THEN
      INSERT INTO historico_patrimonio (
        bem_id, tipo_evento, unidade_local_id, responsavel_id,
        dados_anteriores, dados_novos, usuario_id
      ) VALUES (
        NEW.id, 'atualizacao_dados', NEW.unidade_local_id, NEW.responsavel_id,
        jsonb_build_object('situacao', OLD.situacao),
        jsonb_build_object('situacao', NEW.situacao),
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
-- Name: registrar_transicao_folha(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.registrar_transicao_folha() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_user_nome TEXT;
BEGIN
  SELECT full_name INTO v_user_nome FROM public.profiles WHERE id = auth.uid();

  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.folha_historico_status (
      folha_id, status_anterior, status_novo, usuario_id, usuario_nome, justificativa
    ) VALUES (
      NEW.id, OLD.status, NEW.status, auth.uid(), v_user_nome,
      CASE
        WHEN NEW.status = 'fechada' THEN NEW.justificativa_fechamento
        WHEN NEW.status = 'reaberta' THEN NEW.justificativa_reabertura
        ELSE NULL
      END
    );

    IF NEW.status = 'fechada' AND OLD.status != 'fechada' THEN
      NEW.fechado_por := COALESCE(NEW.fechado_por, auth.uid());
      NEW.fechado_em := COALESCE(NEW.fechado_em, now());
    END IF;

    IF NEW.status = 'processando' AND OLD.status = 'aberta' THEN
      NEW.conferido_por := COALESCE(NEW.conferido_por, auth.uid());
      NEW.conferido_em := COALESCE(NEW.conferido_em, now());
    END IF;

    IF NEW.status = 'reaberta' THEN
      NEW.reaberto_por := COALESCE(NEW.reaberto_por, auth.uid());
      NEW.reaberto_em := COALESCE(NEW.reaberto_em, now());
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


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
  IF coalesce(current_setting('role', true), 'none') NOT IN ('anon', 'authenticated')
     OR public.is_admin_user(v_uid) THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;
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
    IF n ->> 'status' IS NULL THEN
      RAISE EXCEPTION 'Abono: o status não pode ser nulo' USING ERRCODE = '42501';
    END IF;
    st_antes := coalesce(o ->> 'status', 'pendente');
    st_depois := n ->> 'status';
    mudou_status := st_depois IS DISTINCT FROM st_antes;
    -- status legado (CHECK do banco): nenhuma tela grava; fica fora da autoria, então ninguém transiciona para ele
    IF mudou_status AND st_depois = 'aprovado_rh' THEN
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
    IF TG_OP = 'UPDATE'
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
       AND (n ->> 'servidor_id')::uuid IS DISTINCT FROM public.meu_servidor_id() THEN
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
    IF n ->> 'status' IS NULL THEN
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


SET default_table_access_method = heap;

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
    created_by uuid
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
    created_at timestamp with time zone DEFAULT now()
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
    role_at_time public.app_role
);

ALTER TABLE ONLY public.audit_logs FORCE ROW LEVEL SECURITY;


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
    updated_at timestamp with time zone DEFAULT now()
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
    updated_at timestamp with time zone DEFAULT now()
);


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
    CONSTRAINT campanhas_inventario_status_check CHECK ((status = ANY (ARRAY['planejada'::text, 'em_andamento'::text, 'concluida'::text, 'cancelada'::text])))
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
    created_at timestamp with time zone DEFAULT now()
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
    natureza public.natureza_cargo
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
-- Name: composicao_cargos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.composicao_cargos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    unidade_id uuid NOT NULL,
    cargo_id uuid NOT NULL,
    quantidade_vagas integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT now()
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
    created_by uuid
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
    updated_by uuid
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
    updated_by uuid
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
    updated_by uuid
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
    updated_by uuid
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
    updated_by uuid
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
    updated_by uuid
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
    created_by uuid
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
    updated_at timestamp with time zone DEFAULT now()
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
    created_by uuid
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
    created_by uuid
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
    created_by uuid
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
    responsavel_id uuid
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
    updated_at timestamp with time zone DEFAULT now()
);


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
    enviado_por uuid
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
    created_at timestamp with time zone DEFAULT now()
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
    unidade_nome character varying
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
    created_by uuid
);

ALTER TABLE ONLY public.fin_alteracoes_orcamentarias FORCE ROW LEVEL SECURITY;


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
    conferido_em timestamp with time zone
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
    created_by uuid
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
    updated_at timestamp with time zone DEFAULT now()
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
    updated_at timestamp with time zone DEFAULT now() NOT NULL
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
    created_by uuid
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
    saida2 time without time zone
);


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
    CONSTRAINT itens_ficha_financeira_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['provento'::character varying, 'desconto'::character varying])::text[])))
);


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
    updated_at timestamp with time zone DEFAULT now()
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
    created_at timestamp with time zone DEFAULT now()
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
    created_at timestamp with time zone DEFAULT now()
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
    ato_doe_data date
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
    solicitado_por uuid,
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
    updated_at timestamp with time zone DEFAULT now()
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
    created_by uuid
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
    updated_by uuid
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
    created_by uuid
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
    updated_by uuid
);

ALTER TABLE ONLY public.provimentos FORCE ROW LEVEL SECURITY;


--
-- Name: TABLE provimentos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.provimentos IS 'Provimentos/nomeações de servidores. Portarias de nomeação devem ser gerenciadas pela Central de Portarias (tabela documentos).';


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
    updated_at timestamp with time zone DEFAULT now()
);


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
    CONSTRAINT remessas_bancarias_status_check CHECK (((status)::text = ANY ((ARRAY['gerada'::character varying, 'enviada'::character varying, 'processada'::character varying, 'erro'::character varying, 'cancelada'::character varying])::text[])))
);


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
    created_at timestamp with time zone DEFAULT now()
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
    updated_by uuid
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
    created_by uuid
);


--
-- Name: servidor_tag_vinculos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.servidor_tag_vinculos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    servidor_id uuid NOT NULL,
    tag_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid
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
    created_by uuid
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
    updated_at timestamp with time zone DEFAULT now()
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
    created_by uuid
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
    created_by uuid
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
    updated_by uuid
);


--
-- PostgreSQL database dump complete
--


