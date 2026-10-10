-- GERADO por scripts/db/gerar-baseline.sh (pós-dados). NÃO edite à mão.
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
-- Name: acesso_processo_sigiloso acesso_processo_sigiloso_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acesso_processo_sigiloso
    ADD CONSTRAINT acesso_processo_sigiloso_pkey PRIMARY KEY (id);


--
-- Name: acesso_processo_sigiloso acesso_sigiloso_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acesso_processo_sigiloso
    ADD CONSTRAINT acesso_sigiloso_unique UNIQUE (processo_id, usuario_id);


--
-- Name: acoes acoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acoes
    ADD CONSTRAINT acoes_pkey PRIMARY KEY (id);


--
-- Name: acoes acoes_programa_id_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acoes
    ADD CONSTRAINT acoes_programa_id_codigo_key UNIQUE (programa_id, codigo);


--
-- Name: adicionais_tempo_servico adicionais_tempo_servico_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adicionais_tempo_servico
    ADD CONSTRAINT adicionais_tempo_servico_pkey PRIMARY KEY (id);


--
-- Name: aditivos_contrato aditivos_contrato_contrato_id_numero_aditivo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aditivos_contrato
    ADD CONSTRAINT aditivos_contrato_contrato_id_numero_aditivo_key UNIQUE (contrato_id, numero_aditivo);


--
-- Name: aditivos_contrato aditivos_contrato_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aditivos_contrato
    ADD CONSTRAINT aditivos_contrato_pkey PRIMARY KEY (id);


--
-- Name: agenda_unidade agenda_unidade_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agenda_unidade
    ADD CONSTRAINT agenda_unidade_pkey PRIMARY KEY (id);


--
-- Name: agrupamento_unidade_vinculo agrupamento_unidade_vinculo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agrupamento_unidade_vinculo
    ADD CONSTRAINT agrupamento_unidade_vinculo_pkey PRIMARY KEY (id);


--
-- Name: agrupamento_unidade_vinculo agrupamento_unidade_vinculo_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agrupamento_unidade_vinculo
    ADD CONSTRAINT agrupamento_unidade_vinculo_unique UNIQUE (agrupamento_id, unidade_id);


--
-- Name: almoxarifados almoxarifados_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.almoxarifados
    ADD CONSTRAINT almoxarifados_codigo_key UNIQUE (codigo);


--
-- Name: almoxarifados almoxarifados_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.almoxarifados
    ADD CONSTRAINT almoxarifados_pkey PRIMARY KEY (id);


--
-- Name: approval_delegations approval_delegations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_delegations
    ADD CONSTRAINT approval_delegations_pkey PRIMARY KEY (id);


--
-- Name: approval_requests approval_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_requests
    ADD CONSTRAINT approval_requests_pkey PRIMARY KEY (id);


--
-- Name: atas_registro_preco atas_registro_preco_numero_ata_ano_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atas_registro_preco
    ADD CONSTRAINT atas_registro_preco_numero_ata_ano_key UNIQUE (numero_ata, ano);


--
-- Name: atas_registro_preco atas_registro_preco_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atas_registro_preco
    ADD CONSTRAINT atas_registro_preco_pkey PRIMARY KEY (id);


--
-- Name: audit_log_licitacoes audit_log_licitacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log_licitacoes
    ADD CONSTRAINT audit_log_licitacoes_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: avaliacoes_controle avaliacoes_controle_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avaliacoes_controle
    ADD CONSTRAINT avaliacoes_controle_pkey PRIMARY KEY (id);


--
-- Name: avaliacoes_risco avaliacoes_risco_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avaliacoes_risco
    ADD CONSTRAINT avaliacoes_risco_pkey PRIMARY KEY (id);


--
-- Name: avisos_leituras avisos_leituras_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avisos_leituras
    ADD CONSTRAINT avisos_leituras_pkey PRIMARY KEY (aviso_id, user_id);


--
-- Name: avisos avisos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avisos
    ADD CONSTRAINT avisos_pkey PRIMARY KEY (id);


--
-- Name: backup_config backup_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.backup_config
    ADD CONSTRAINT backup_config_pkey PRIMARY KEY (id);


--
-- Name: backup_history backup_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.backup_history
    ADD CONSTRAINT backup_history_pkey PRIMARY KEY (id);


--
-- Name: backup_integrity_checks backup_integrity_checks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.backup_integrity_checks
    ADD CONSTRAINT backup_integrity_checks_pkey PRIMARY KEY (id);


--
-- Name: baixas_patrimonio baixas_patrimonio_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.baixas_patrimonio
    ADD CONSTRAINT baixas_patrimonio_pkey PRIMARY KEY (id);


--
-- Name: banco_horas banco_horas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banco_horas
    ADD CONSTRAINT banco_horas_pkey PRIMARY KEY (id);


--
-- Name: banco_horas banco_horas_servidor_id_mes_ano_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banco_horas
    ADD CONSTRAINT banco_horas_servidor_id_mes_ano_key UNIQUE (servidor_id, mes, ano);


--
-- Name: bancos_cnab bancos_cnab_codigo_banco_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bancos_cnab
    ADD CONSTRAINT bancos_cnab_codigo_banco_key UNIQUE (codigo_banco);


--
-- Name: bancos_cnab bancos_cnab_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bancos_cnab
    ADD CONSTRAINT bancos_cnab_pkey PRIMARY KEY (id);


--
-- Name: bens_patrimoniais bens_patrimoniais_numero_patrimonio_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bens_patrimoniais
    ADD CONSTRAINT bens_patrimoniais_numero_patrimonio_key UNIQUE (numero_patrimonio);


--
-- Name: bens_patrimoniais bens_patrimoniais_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bens_patrimoniais
    ADD CONSTRAINT bens_patrimoniais_pkey PRIMARY KEY (id);


--
-- Name: cadastro_arbitros_modalidades cadastro_arbitros_modalidades_arbitro_id_modalidade_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cadastro_arbitros_modalidades
    ADD CONSTRAINT cadastro_arbitros_modalidades_arbitro_id_modalidade_key UNIQUE (arbitro_id, modalidade);


--
-- Name: cadastro_arbitros_modalidades cadastro_arbitros_modalidades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cadastro_arbitros_modalidades
    ADD CONSTRAINT cadastro_arbitros_modalidades_pkey PRIMARY KEY (id);


--
-- Name: cadastro_arbitros cadastro_arbitros_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cadastro_arbitros
    ADD CONSTRAINT cadastro_arbitros_pkey PRIMARY KEY (id);


--
-- Name: cadastro_arbitros cadastro_arbitros_protocolo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cadastro_arbitros
    ADD CONSTRAINT cadastro_arbitros_protocolo_key UNIQUE (protocolo);


--
-- Name: calendario_federacao calendario_federacao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendario_federacao
    ADD CONSTRAINT calendario_federacao_pkey PRIMARY KEY (id);


--
-- Name: campanhas_inventario campanhas_inventario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campanhas_inventario
    ADD CONSTRAINT campanhas_inventario_pkey PRIMARY KEY (id);


--
-- Name: campanhas_inventario_unidades campanhas_inventario_unidades_campanha_unidade_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campanhas_inventario_unidades
    ADD CONSTRAINT campanhas_inventario_unidades_campanha_unidade_key UNIQUE (campanha_id, unidade_local_id);


--
-- Name: campanhas_inventario_unidades campanhas_inventario_unidades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campanhas_inventario_unidades
    ADD CONSTRAINT campanhas_inventario_unidades_pkey PRIMARY KEY (id);


--
-- Name: cargo_unidade_compatibilidade cargo_unidade_compatibilidade_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cargo_unidade_compatibilidade
    ADD CONSTRAINT cargo_unidade_compatibilidade_pkey PRIMARY KEY (id);


--
-- Name: cargos cargos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cargos
    ADD CONSTRAINT cargos_pkey PRIMARY KEY (id);


--
-- Name: categorias_material categorias_material_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias_material
    ADD CONSTRAINT categorias_material_codigo_key UNIQUE (codigo);


--
-- Name: categorias_material categorias_material_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias_material
    ADD CONSTRAINT categorias_material_pkey PRIMARY KEY (id);


--
-- Name: categorias_noticias_eventos categorias_noticias_eventos_nome_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias_noticias_eventos
    ADD CONSTRAINT categorias_noticias_eventos_nome_key UNIQUE (nome);


--
-- Name: categorias_noticias_eventos categorias_noticias_eventos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias_noticias_eventos
    ADD CONSTRAINT categorias_noticias_eventos_pkey PRIMARY KEY (id);


--
-- Name: categorias_noticias_eventos categorias_noticias_eventos_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias_noticias_eventos
    ADD CONSTRAINT categorias_noticias_eventos_slug_key UNIQUE (slug);


--
-- Name: centros_custo centros_custo_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.centros_custo
    ADD CONSTRAINT centros_custo_codigo_key UNIQUE (codigo);


--
-- Name: centros_custo centros_custo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.centros_custo
    ADD CONSTRAINT centros_custo_pkey PRIMARY KEY (id);


--
-- Name: cessoes cessoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cessoes
    ADD CONSTRAINT cessoes_pkey PRIMARY KEY (id);


--
-- Name: checklists_conformidade checklists_conformidade_codigo_exercicio_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checklists_conformidade
    ADD CONSTRAINT checklists_conformidade_codigo_exercicio_key UNIQUE (codigo, exercicio);


--
-- Name: checklists_conformidade checklists_conformidade_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checklists_conformidade
    ADD CONSTRAINT checklists_conformidade_pkey PRIMARY KEY (id);


--
-- Name: cms_banners cms_banners_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_banners
    ADD CONSTRAINT cms_banners_pkey PRIMARY KEY (id);


--
-- Name: cms_categorias cms_categorias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_categorias
    ADD CONSTRAINT cms_categorias_pkey PRIMARY KEY (id);


--
-- Name: cms_categorias cms_categorias_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_categorias
    ADD CONSTRAINT cms_categorias_slug_key UNIQUE (slug);


--
-- Name: cms_conteudos cms_conteudos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_conteudos
    ADD CONSTRAINT cms_conteudos_pkey PRIMARY KEY (id);


--
-- Name: cms_conteudos cms_conteudos_slug_destino_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_conteudos
    ADD CONSTRAINT cms_conteudos_slug_destino_unique UNIQUE (slug, destino);


--
-- Name: cms_galeria_fotos cms_galeria_fotos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_galeria_fotos
    ADD CONSTRAINT cms_galeria_fotos_pkey PRIMARY KEY (id);


--
-- Name: cms_galerias cms_galerias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_galerias
    ADD CONSTRAINT cms_galerias_pkey PRIMARY KEY (id);


--
-- Name: cms_galerias cms_galerias_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_galerias
    ADD CONSTRAINT cms_galerias_slug_key UNIQUE (slug);


--
-- Name: cms_media cms_media_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_media
    ADD CONSTRAINT cms_media_pkey PRIMARY KEY (id);


--
-- Name: coletas_inventario coletas_inventario_campanha_id_bem_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coletas_inventario
    ADD CONSTRAINT coletas_inventario_campanha_id_bem_id_key UNIQUE (campanha_id, bem_id);


--
-- Name: coletas_inventario coletas_inventario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coletas_inventario
    ADD CONSTRAINT coletas_inventario_pkey PRIMARY KEY (id);


--
-- Name: composicao_cargos composicao_cargos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.composicao_cargos
    ADD CONSTRAINT composicao_cargos_pkey PRIMARY KEY (id);


--
-- Name: composicao_cargos composicao_cargos_unidade_id_cargo_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.composicao_cargos
    ADD CONSTRAINT composicao_cargos_unidade_id_cargo_id_key UNIQUE (unidade_id, cargo_id);


--
-- Name: conciliacoes_inventario conciliacoes_inventario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conciliacoes_inventario
    ADD CONSTRAINT conciliacoes_inventario_pkey PRIMARY KEY (id);


--
-- Name: config_agrupamento_unidades config_agrupamento_unidades_nome_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_agrupamento_unidades
    ADD CONSTRAINT config_agrupamento_unidades_nome_unique UNIQUE (nome);


--
-- Name: config_agrupamento_unidades config_agrupamento_unidades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_agrupamento_unidades
    ADD CONSTRAINT config_agrupamento_unidades_pkey PRIMARY KEY (id);


--
-- Name: config_assinatura_frequencia config_assinatura_frequencia_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_assinatura_frequencia
    ADD CONSTRAINT config_assinatura_frequencia_pkey PRIMARY KEY (id);


--
-- Name: config_assinatura_reuniao config_assinatura_reuniao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_assinatura_reuniao
    ADD CONSTRAINT config_assinatura_reuniao_pkey PRIMARY KEY (id);


--
-- Name: config_autarquia config_autarquia_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_autarquia
    ADD CONSTRAINT config_autarquia_pkey PRIMARY KEY (id);


--
-- Name: config_compensacao config_compensacao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_compensacao
    ADD CONSTRAINT config_compensacao_pkey PRIMARY KEY (id);


--
-- Name: config_envio config_envio_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_envio
    ADD CONSTRAINT config_envio_pkey PRIMARY KEY (canal);


--
-- Name: config_fechamento_folha config_fechamento_folha_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_fechamento_folha
    ADD CONSTRAINT config_fechamento_folha_pkey PRIMARY KEY (id);


--
-- Name: config_fechamento_frequencia config_fechamento_frequencia_ano_mes_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_fechamento_frequencia
    ADD CONSTRAINT config_fechamento_frequencia_ano_mes_key UNIQUE (ano, mes);


--
-- Name: config_fechamento_frequencia config_fechamento_frequencia_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_fechamento_frequencia
    ADD CONSTRAINT config_fechamento_frequencia_pkey PRIMARY KEY (id);


--
-- Name: config_incidencias config_incidencias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_incidencias
    ADD CONSTRAINT config_incidencias_pkey PRIMARY KEY (id);


--
-- Name: config_incidencias config_incidencias_rubrica_origem_id_rubrica_destino_id_vig_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_incidencias
    ADD CONSTRAINT config_incidencias_rubrica_origem_id_rubrica_destino_id_vig_key UNIQUE (rubrica_origem_id, rubrica_destino_id, vigencia_inicio);


--
-- Name: config_institucional config_institucional_cnpj_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_institucional
    ADD CONSTRAINT config_institucional_cnpj_key UNIQUE (cnpj);


--
-- Name: config_institucional config_institucional_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_institucional
    ADD CONSTRAINT config_institucional_codigo_key UNIQUE (codigo);


--
-- Name: config_institucional config_institucional_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_institucional
    ADD CONSTRAINT config_institucional_pkey PRIMARY KEY (id);


--
-- Name: config_jornada_padrao config_jornada_padrao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_jornada_padrao
    ADD CONSTRAINT config_jornada_padrao_pkey PRIMARY KEY (id);


--
-- Name: config_menu_publico config_menu_publico_chave_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_menu_publico
    ADD CONSTRAINT config_menu_publico_chave_key UNIQUE (chave);


--
-- Name: config_menu_publico config_menu_publico_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_menu_publico
    ADD CONSTRAINT config_menu_publico_pkey PRIMARY KEY (id);


--
-- Name: config_motivos_desligamento config_motivos_desligamento_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_motivos_desligamento
    ADD CONSTRAINT config_motivos_desligamento_pkey PRIMARY KEY (id);


--
-- Name: config_paginas_historico config_paginas_historico_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_paginas_historico
    ADD CONSTRAINT config_paginas_historico_pkey PRIMARY KEY (id);


--
-- Name: config_paginas_publicas config_paginas_publicas_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_paginas_publicas
    ADD CONSTRAINT config_paginas_publicas_codigo_key UNIQUE (codigo);


--
-- Name: config_paginas_publicas config_paginas_publicas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_paginas_publicas
    ADD CONSTRAINT config_paginas_publicas_pkey PRIMARY KEY (id);


--
-- Name: config_parametros_meta config_parametros_meta_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_parametros_meta
    ADD CONSTRAINT config_parametros_meta_codigo_key UNIQUE (codigo);


--
-- Name: config_parametros_meta config_parametros_meta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_parametros_meta
    ADD CONSTRAINT config_parametros_meta_pkey PRIMARY KEY (id);


--
-- Name: config_parametros_valores config_parametros_valores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_parametros_valores
    ADD CONSTRAINT config_parametros_valores_pkey PRIMARY KEY (id);


--
-- Name: config_regras_calculo config_regras_calculo_instituicao_id_codigo_vigencia_inicio_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_regras_calculo
    ADD CONSTRAINT config_regras_calculo_instituicao_id_codigo_vigencia_inicio_key UNIQUE (instituicao_id, codigo, vigencia_inicio);


--
-- Name: config_regras_calculo config_regras_calculo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_regras_calculo
    ADD CONSTRAINT config_regras_calculo_pkey PRIMARY KEY (id);


--
-- Name: config_rubricas config_rubricas_instituicao_id_codigo_vigencia_inicio_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_rubricas
    ADD CONSTRAINT config_rubricas_instituicao_id_codigo_vigencia_inicio_key UNIQUE (instituicao_id, codigo, vigencia_inicio);


--
-- Name: config_rubricas config_rubricas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_rubricas
    ADD CONSTRAINT config_rubricas_pkey PRIMARY KEY (id);


--
-- Name: config_situacoes_funcionais config_situacoes_funcionais_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_situacoes_funcionais
    ADD CONSTRAINT config_situacoes_funcionais_pkey PRIMARY KEY (id);


--
-- Name: config_tipos_ato config_tipos_ato_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_tipos_ato
    ADD CONSTRAINT config_tipos_ato_pkey PRIMARY KEY (id);


--
-- Name: config_tipos_onus config_tipos_onus_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_tipos_onus
    ADD CONSTRAINT config_tipos_onus_pkey PRIMARY KEY (id);


--
-- Name: config_tipos_rubrica config_tipos_rubrica_instituicao_id_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_tipos_rubrica
    ADD CONSTRAINT config_tipos_rubrica_instituicao_id_codigo_key UNIQUE (instituicao_id, codigo);


--
-- Name: config_tipos_rubrica config_tipos_rubrica_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_tipos_rubrica
    ADD CONSTRAINT config_tipos_rubrica_pkey PRIMARY KEY (id);


--
-- Name: config_tipos_servidor config_tipos_servidor_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_tipos_servidor
    ADD CONSTRAINT config_tipos_servidor_pkey PRIMARY KEY (id);


--
-- Name: configuracao_jornada configuracao_jornada_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracao_jornada
    ADD CONSTRAINT configuracao_jornada_pkey PRIMARY KEY (id);


--
-- Name: configuracao_jornada configuracao_jornada_servidor_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracao_jornada
    ADD CONSTRAINT configuracao_jornada_servidor_id_key UNIQUE (servidor_id);


--
-- Name: consignacoes consignacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consignacoes
    ADD CONSTRAINT consignacoes_pkey PRIMARY KEY (id);


--
-- Name: contas_autarquia contas_autarquia_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contas_autarquia
    ADD CONSTRAINT contas_autarquia_pkey PRIMARY KEY (id);


--
-- Name: contatos_eventos_esportivos contatos_eventos_esportivos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contatos_eventos_esportivos
    ADD CONSTRAINT contatos_eventos_esportivos_pkey PRIMARY KEY (id);


--
-- Name: conteudo_rascunho conteudo_rascunho_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conteudo_rascunho
    ADD CONSTRAINT conteudo_rascunho_pkey PRIMARY KEY (id);


--
-- Name: contratos contratos_numero_contrato_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT contratos_numero_contrato_key UNIQUE (numero_contrato);


--
-- Name: contratos contratos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT contratos_pkey PRIMARY KEY (id);


--
-- Name: controles_internos controles_internos_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.controles_internos
    ADD CONSTRAINT controles_internos_codigo_key UNIQUE (codigo);


--
-- Name: controles_internos controles_internos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.controles_internos
    ADD CONSTRAINT controles_internos_pkey PRIMARY KEY (id);


--
-- Name: creditos_adicionais creditos_adicionais_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.creditos_adicionais
    ADD CONSTRAINT creditos_adicionais_pkey PRIMARY KEY (id);


--
-- Name: dados_oficiais dados_oficiais_chave_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dados_oficiais
    ADD CONSTRAINT dados_oficiais_chave_key UNIQUE (chave);


--
-- Name: dados_oficiais dados_oficiais_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dados_oficiais
    ADD CONSTRAINT dados_oficiais_pkey PRIMARY KEY (id);


--
-- Name: datas_importantes datas_importantes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.datas_importantes
    ADD CONSTRAINT datas_importantes_pkey PRIMARY KEY (id);


--
-- Name: debitos_tecnicos debitos_tecnicos_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debitos_tecnicos
    ADD CONSTRAINT debitos_tecnicos_codigo_key UNIQUE (codigo);


--
-- Name: debitos_tecnicos debitos_tecnicos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debitos_tecnicos
    ADD CONSTRAINT debitos_tecnicos_pkey PRIMARY KEY (id);


--
-- Name: decisoes_administrativas decisoes_administrativas_numero_decisao_ano_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.decisoes_administrativas
    ADD CONSTRAINT decisoes_administrativas_numero_decisao_ano_key UNIQUE (numero_decisao, ano);


--
-- Name: decisoes_administrativas decisoes_administrativas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.decisoes_administrativas
    ADD CONSTRAINT decisoes_administrativas_pkey PRIMARY KEY (id);


--
-- Name: demandas_ascom_anexos demandas_ascom_anexos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demandas_ascom_anexos
    ADD CONSTRAINT demandas_ascom_anexos_pkey PRIMARY KEY (id);


--
-- Name: demandas_ascom_comentarios demandas_ascom_comentarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demandas_ascom_comentarios
    ADD CONSTRAINT demandas_ascom_comentarios_pkey PRIMARY KEY (id);


--
-- Name: demandas_ascom_entregaveis demandas_ascom_entregaveis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demandas_ascom_entregaveis
    ADD CONSTRAINT demandas_ascom_entregaveis_pkey PRIMARY KEY (id);


--
-- Name: demandas_ascom demandas_ascom_numero_demanda_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demandas_ascom
    ADD CONSTRAINT demandas_ascom_numero_demanda_key UNIQUE (numero_demanda);


--
-- Name: demandas_ascom demandas_ascom_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demandas_ascom
    ADD CONSTRAINT demandas_ascom_pkey PRIMARY KEY (id);


--
-- Name: denuncias denuncias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.denuncias
    ADD CONSTRAINT denuncias_pkey PRIMARY KEY (id);


--
-- Name: denuncias denuncias_protocolo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.denuncias
    ADD CONSTRAINT denuncias_protocolo_key UNIQUE (protocolo);


--
-- Name: dependentes_irrf dependentes_irrf_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dependentes_irrf
    ADD CONSTRAINT dependentes_irrf_pkey PRIMARY KEY (id);


--
-- Name: designacoes designacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.designacoes
    ADD CONSTRAINT designacoes_pkey PRIMARY KEY (id);


--
-- Name: despachos despachos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.despachos
    ADD CONSTRAINT despachos_pkey PRIMARY KEY (id);


--
-- Name: dias_nao_uteis dias_nao_uteis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dias_nao_uteis
    ADD CONSTRAINT dias_nao_uteis_pkey PRIMARY KEY (id);


--
-- Name: documentos_cedencia documentos_cedencia_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos_cedencia
    ADD CONSTRAINT documentos_cedencia_pkey PRIMARY KEY (id);


--
-- Name: documentos documentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos
    ADD CONSTRAINT documentos_pkey PRIMARY KEY (id);


--
-- Name: documentos_preparatorios_licitacao documentos_preparatorios_licitacao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos_preparatorios_licitacao
    ADD CONSTRAINT documentos_preparatorios_licitacao_pkey PRIMARY KEY (id);


--
-- Name: documentos_processo documentos_processo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos_processo
    ADD CONSTRAINT documentos_processo_pkey PRIMARY KEY (id);


--
-- Name: documentos_requerimento_servidor documentos_requerimento_servidor_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos_requerimento_servidor
    ADD CONSTRAINT documentos_requerimento_servidor_pkey PRIMARY KEY (id);


--
-- Name: dotacoes_orcamentarias dotacoes_orcamentarias_exercicio_classificacao_completa_fon_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dotacoes_orcamentarias
    ADD CONSTRAINT dotacoes_orcamentarias_exercicio_classificacao_completa_fon_key UNIQUE (exercicio, classificacao_completa, fonte_recurso);


--
-- Name: dotacoes_orcamentarias dotacoes_orcamentarias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dotacoes_orcamentarias
    ADD CONSTRAINT dotacoes_orcamentarias_pkey PRIMARY KEY (id);


--
-- Name: empenhos empenhos_numero_empenho_exercicio_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empenhos
    ADD CONSTRAINT empenhos_numero_empenho_exercicio_key UNIQUE (numero_empenho, exercicio);


--
-- Name: empenhos empenhos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empenhos
    ADD CONSTRAINT empenhos_pkey PRIMARY KEY (id);


--
-- Name: encaminhamentos encaminhamentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encaminhamentos
    ADD CONSTRAINT encaminhamentos_pkey PRIMARY KEY (id);


--
-- Name: encaminhamentos encaminhamentos_tipo_origem_origem_id_numero_sequencial_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encaminhamentos
    ADD CONSTRAINT encaminhamentos_tipo_origem_origem_id_numero_sequencial_key UNIQUE (tipo_origem, origem_id, numero_sequencial);


--
-- Name: envios_log envios_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.envios_log
    ADD CONSTRAINT envios_log_pkey PRIMARY KEY (id);


--
-- Name: escolas_jer escolas_jer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.escolas_jer
    ADD CONSTRAINT escolas_jer_pkey PRIMARY KEY (id);


--
-- Name: estoque estoque_item_id_almoxarifado_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estoque
    ADD CONSTRAINT estoque_item_id_almoxarifado_id_key UNIQUE (item_id, almoxarifado_id);


--
-- Name: estoque estoque_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estoque
    ADD CONSTRAINT estoque_pkey PRIMARY KEY (id);


--
-- Name: estrutura_organizacional estrutura_organizacional_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estrutura_organizacional
    ADD CONSTRAINT estrutura_organizacional_pkey PRIMARY KEY (id);


--
-- Name: eventos_esocial eventos_esocial_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eventos_esocial
    ADD CONSTRAINT eventos_esocial_pkey PRIMARY KEY (id);


--
-- Name: evidencias_controle evidencias_controle_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evidencias_controle
    ADD CONSTRAINT evidencias_controle_pkey PRIMARY KEY (id);


--
-- Name: exportacoes_folha exportacoes_folha_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exportacoes_folha
    ADD CONSTRAINT exportacoes_folha_pkey PRIMARY KEY (id);


--
-- Name: federacao_arbitros federacao_arbitros_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.federacao_arbitros
    ADD CONSTRAINT federacao_arbitros_pkey PRIMARY KEY (id);


--
-- Name: federacao_espacos_cedidos federacao_espacos_cedidos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.federacao_espacos_cedidos
    ADD CONSTRAINT federacao_espacos_cedidos_pkey PRIMARY KEY (id);


--
-- Name: federacao_parcerias federacao_parcerias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.federacao_parcerias
    ADD CONSTRAINT federacao_parcerias_pkey PRIMARY KEY (id);


--
-- Name: federacoes_esportivas federacoes_esportivas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.federacoes_esportivas
    ADD CONSTRAINT federacoes_esportivas_pkey PRIMARY KEY (id);


--
-- Name: feriados feriados_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feriados
    ADD CONSTRAINT feriados_pkey PRIMARY KEY (id);


--
-- Name: ferias_servidor ferias_servidor_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ferias_servidor
    ADD CONSTRAINT ferias_servidor_pkey PRIMARY KEY (id);


--
-- Name: fichas_financeiras fichas_financeiras_folha_id_servidor_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fichas_financeiras
    ADD CONSTRAINT fichas_financeiras_folha_id_servidor_id_key UNIQUE (folha_id, servidor_id);


--
-- Name: fichas_financeiras fichas_financeiras_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fichas_financeiras
    ADD CONSTRAINT fichas_financeiras_pkey PRIMARY KEY (id);


--
-- Name: fin_acoes_orcamentarias fin_acoes_orcamentarias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_acoes_orcamentarias
    ADD CONSTRAINT fin_acoes_orcamentarias_pkey PRIMARY KEY (id);


--
-- Name: fin_adiantamento_itens fin_adiantamento_itens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_adiantamento_itens
    ADD CONSTRAINT fin_adiantamento_itens_pkey PRIMARY KEY (id);


--
-- Name: fin_adiantamentos fin_adiantamentos_numero_exercicio_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_adiantamentos
    ADD CONSTRAINT fin_adiantamentos_numero_exercicio_key UNIQUE (numero, exercicio);


--
-- Name: fin_adiantamentos fin_adiantamentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_adiantamentos
    ADD CONSTRAINT fin_adiantamentos_pkey PRIMARY KEY (id);


--
-- Name: fin_alteracoes_orcamentarias fin_alteracoes_orcamentarias_numero_exercicio_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_alteracoes_orcamentarias
    ADD CONSTRAINT fin_alteracoes_orcamentarias_numero_exercicio_key UNIQUE (numero, exercicio);


--
-- Name: fin_alteracoes_orcamentarias fin_alteracoes_orcamentarias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_alteracoes_orcamentarias
    ADD CONSTRAINT fin_alteracoes_orcamentarias_pkey PRIMARY KEY (id);


--
-- Name: fin_audit_log fin_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_audit_log
    ADD CONSTRAINT fin_audit_log_pkey PRIMARY KEY (id);


--
-- Name: fin_checklist_ci fin_checklist_ci_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_checklist_ci
    ADD CONSTRAINT fin_checklist_ci_pkey PRIMARY KEY (id);


--
-- Name: fin_contas_bancarias fin_contas_bancarias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_contas_bancarias
    ADD CONSTRAINT fin_contas_bancarias_pkey PRIMARY KEY (id);


--
-- Name: fin_documentos fin_documentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_documentos
    ADD CONSTRAINT fin_documentos_pkey PRIMARY KEY (id);


--
-- Name: fin_dotacoes fin_dotacoes_codigo_dotacao_exercicio_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_dotacoes
    ADD CONSTRAINT fin_dotacoes_codigo_dotacao_exercicio_key UNIQUE (codigo_dotacao, exercicio);


--
-- Name: fin_dotacoes fin_dotacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_dotacoes
    ADD CONSTRAINT fin_dotacoes_pkey PRIMARY KEY (id);


--
-- Name: fin_empenho_anulacoes fin_empenho_anulacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_empenho_anulacoes
    ADD CONSTRAINT fin_empenho_anulacoes_pkey PRIMARY KEY (id);


--
-- Name: fin_empenhos fin_empenhos_numero_exercicio_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_empenhos
    ADD CONSTRAINT fin_empenhos_numero_exercicio_key UNIQUE (numero, exercicio);


--
-- Name: fin_empenhos fin_empenhos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_empenhos
    ADD CONSTRAINT fin_empenhos_pkey PRIMARY KEY (id);


--
-- Name: fin_extrato_transacoes fin_extrato_transacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_extrato_transacoes
    ADD CONSTRAINT fin_extrato_transacoes_pkey PRIMARY KEY (id);


--
-- Name: fin_extratos_bancarios fin_extratos_bancarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_extratos_bancarios
    ADD CONSTRAINT fin_extratos_bancarios_pkey PRIMARY KEY (id);


--
-- Name: fin_fechamentos fin_fechamentos_exercicio_mes_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_fechamentos
    ADD CONSTRAINT fin_fechamentos_exercicio_mes_key UNIQUE (exercicio, mes);


--
-- Name: fin_fechamentos fin_fechamentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_fechamentos
    ADD CONSTRAINT fin_fechamentos_pkey PRIMARY KEY (id);


--
-- Name: fin_fontes_recurso fin_fontes_recurso_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_fontes_recurso
    ADD CONSTRAINT fin_fontes_recurso_codigo_key UNIQUE (codigo);


--
-- Name: fin_fontes_recurso fin_fontes_recurso_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_fontes_recurso
    ADD CONSTRAINT fin_fontes_recurso_pkey PRIMARY KEY (id);


--
-- Name: fin_lancamentos_contabeis fin_lancamentos_contabeis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_lancamentos_contabeis
    ADD CONSTRAINT fin_lancamentos_contabeis_pkey PRIMARY KEY (id);


--
-- Name: fin_liquidacoes fin_liquidacoes_numero_exercicio_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_liquidacoes
    ADD CONSTRAINT fin_liquidacoes_numero_exercicio_key UNIQUE (numero, exercicio);


--
-- Name: fin_liquidacoes fin_liquidacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_liquidacoes
    ADD CONSTRAINT fin_liquidacoes_pkey PRIMARY KEY (id);


--
-- Name: fin_naturezas_despesa fin_naturezas_despesa_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_naturezas_despesa
    ADD CONSTRAINT fin_naturezas_despesa_codigo_key UNIQUE (codigo);


--
-- Name: fin_naturezas_despesa fin_naturezas_despesa_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_naturezas_despesa
    ADD CONSTRAINT fin_naturezas_despesa_pkey PRIMARY KEY (id);


--
-- Name: fin_pagamentos fin_pagamentos_numero_exercicio_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_pagamentos
    ADD CONSTRAINT fin_pagamentos_numero_exercicio_key UNIQUE (numero, exercicio);


--
-- Name: fin_pagamentos fin_pagamentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_pagamentos
    ADD CONSTRAINT fin_pagamentos_pkey PRIMARY KEY (id);


--
-- Name: fin_parametros fin_parametros_chave_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_parametros
    ADD CONSTRAINT fin_parametros_chave_key UNIQUE (chave);


--
-- Name: fin_parametros fin_parametros_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_parametros
    ADD CONSTRAINT fin_parametros_pkey PRIMARY KEY (id);


--
-- Name: fin_plano_contas fin_plano_contas_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_plano_contas
    ADD CONSTRAINT fin_plano_contas_codigo_key UNIQUE (codigo);


--
-- Name: fin_plano_contas fin_plano_contas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_plano_contas
    ADD CONSTRAINT fin_plano_contas_pkey PRIMARY KEY (id);


--
-- Name: fin_programas_orcamentarios fin_programas_orcamentarios_codigo_exercicio_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_programas_orcamentarios
    ADD CONSTRAINT fin_programas_orcamentarios_codigo_exercicio_key UNIQUE (codigo, exercicio);


--
-- Name: fin_programas_orcamentarios fin_programas_orcamentarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_programas_orcamentarios
    ADD CONSTRAINT fin_programas_orcamentarios_pkey PRIMARY KEY (id);


--
-- Name: fin_receitas fin_receitas_numero_exercicio_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_receitas
    ADD CONSTRAINT fin_receitas_numero_exercicio_key UNIQUE (numero, exercicio);


--
-- Name: fin_receitas fin_receitas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_receitas
    ADD CONSTRAINT fin_receitas_pkey PRIMARY KEY (id);


--
-- Name: fin_restos_pagar fin_restos_pagar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_restos_pagar
    ADD CONSTRAINT fin_restos_pagar_pkey PRIMARY KEY (id);


--
-- Name: fin_solicitacao_itens fin_solicitacao_itens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_solicitacao_itens
    ADD CONSTRAINT fin_solicitacao_itens_pkey PRIMARY KEY (id);


--
-- Name: fin_solicitacoes fin_solicitacoes_numero_exercicio_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_solicitacoes
    ADD CONSTRAINT fin_solicitacoes_numero_exercicio_key UNIQUE (numero, exercicio);


--
-- Name: fin_solicitacoes fin_solicitacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_solicitacoes
    ADD CONSTRAINT fin_solicitacoes_pkey PRIMARY KEY (id);


--
-- Name: fin_sub_empenhos fin_sub_empenhos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_sub_empenhos
    ADD CONSTRAINT fin_sub_empenhos_pkey PRIMARY KEY (id);


--
-- Name: folha_historico_status folha_historico_status_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.folha_historico_status
    ADD CONSTRAINT folha_historico_status_pkey PRIMARY KEY (id);


--
-- Name: folhas_pagamento folhas_pagamento_competencia_ano_competencia_mes_tipo_folha_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.folhas_pagamento
    ADD CONSTRAINT folhas_pagamento_competencia_ano_competencia_mes_tipo_folha_key UNIQUE (competencia_ano, competencia_mes, tipo_folha);


--
-- Name: folhas_pagamento folhas_pagamento_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.folhas_pagamento
    ADD CONSTRAINT folhas_pagamento_pkey PRIMARY KEY (id);


--
-- Name: form_field_config form_field_config_form_type_field_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_field_config
    ADD CONSTRAINT form_field_config_form_type_field_key_key UNIQUE (form_type, field_key);


--
-- Name: form_field_config form_field_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_field_config
    ADD CONSTRAINT form_field_config_pkey PRIMARY KEY (id);


--
-- Name: fornecedores fornecedores_cpf_cnpj_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fornecedores
    ADD CONSTRAINT fornecedores_cpf_cnpj_key UNIQUE (cpf_cnpj);


--
-- Name: fornecedores fornecedores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fornecedores
    ADD CONSTRAINT fornecedores_pkey PRIMARY KEY (id);


--
-- Name: fotos_vistoria_inventario fotos_vistoria_inventario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fotos_vistoria_inventario
    ADD CONSTRAINT fotos_vistoria_inventario_pkey PRIMARY KEY (id);


--
-- Name: fotos_vistoria_inventario fotos_vistoria_inventario_storage_path_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fotos_vistoria_inventario
    ADD CONSTRAINT fotos_vistoria_inventario_storage_path_key UNIQUE (storage_path);


--
-- Name: frequencia_arquivos frequencia_arquivos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frequencia_arquivos
    ADD CONSTRAINT frequencia_arquivos_pkey PRIMARY KEY (id);


--
-- Name: frequencia_fechamento frequencia_fechamento_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frequencia_fechamento
    ADD CONSTRAINT frequencia_fechamento_pkey PRIMARY KEY (id);


--
-- Name: frequencia_fechamento frequencia_fechamento_servidor_id_ano_mes_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frequencia_fechamento
    ADD CONSTRAINT frequencia_fechamento_servidor_id_ano_mes_key UNIQUE (servidor_id, ano, mes);


--
-- Name: frequencia_mensal frequencia_mensal_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frequencia_mensal
    ADD CONSTRAINT frequencia_mensal_pkey PRIMARY KEY (id);


--
-- Name: frequencia_mensal frequencia_mensal_servidor_ano_mes_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frequencia_mensal
    ADD CONSTRAINT frequencia_mensal_servidor_ano_mes_unique UNIQUE (servidor_id, ano, mes);


--
-- Name: frequencia_mensal frequencia_mensal_servidor_id_mes_ano_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frequencia_mensal
    ADD CONSTRAINT frequencia_mensal_servidor_id_mes_ano_key UNIQUE (servidor_id, mes, ano);


--
-- Name: frequencia_pacotes frequencia_pacotes_link_download_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frequencia_pacotes
    ADD CONSTRAINT frequencia_pacotes_link_download_key UNIQUE (link_download);


--
-- Name: frequencia_pacotes frequencia_pacotes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frequencia_pacotes
    ADD CONSTRAINT frequencia_pacotes_pkey PRIMARY KEY (id);


--
-- Name: galeria_eventos_esportivos galeria_eventos_esportivos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.galeria_eventos_esportivos
    ADD CONSTRAINT galeria_eventos_esportivos_pkey PRIMARY KEY (id);


--
-- Name: gestores_escolares gestores_escolares_cpf_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gestores_escolares
    ADD CONSTRAINT gestores_escolares_cpf_unique UNIQUE (cpf);


--
-- Name: gestores_escolares gestores_escolares_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gestores_escolares
    ADD CONSTRAINT gestores_escolares_email_unique UNIQUE (email);


--
-- Name: gestores_escolares gestores_escolares_escola_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gestores_escolares
    ADD CONSTRAINT gestores_escolares_escola_unique UNIQUE (escola_id);


--
-- Name: gestores_escolares_historico gestores_escolares_historico_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gestores_escolares_historico
    ADD CONSTRAINT gestores_escolares_historico_pkey PRIMARY KEY (id);


--
-- Name: gestores_escolares gestores_escolares_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gestores_escolares
    ADD CONSTRAINT gestores_escolares_pkey PRIMARY KEY (id);


--
-- Name: historico_conteudo_oficial historico_conteudo_oficial_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_conteudo_oficial
    ADD CONSTRAINT historico_conteudo_oficial_pkey PRIMARY KEY (id);


--
-- Name: historico_convites_reuniao historico_convites_reuniao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_convites_reuniao
    ADD CONSTRAINT historico_convites_reuniao_pkey PRIMARY KEY (id);


--
-- Name: historico_funcional historico_funcional_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_funcional
    ADD CONSTRAINT historico_funcional_pkey PRIMARY KEY (id);


--
-- Name: historico_lai historico_lai_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_lai
    ADD CONSTRAINT historico_lai_pkey PRIMARY KEY (id);


--
-- Name: historico_patrimonio historico_patrimonio_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_patrimonio
    ADD CONSTRAINT historico_patrimonio_pkey PRIMARY KEY (id);


--
-- Name: horarios_jornada horarios_jornada_configuracao_id_dia_semana_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horarios_jornada
    ADD CONSTRAINT horarios_jornada_configuracao_id_dia_semana_key UNIQUE (configuracao_id, dia_semana);


--
-- Name: horarios_jornada horarios_jornada_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horarios_jornada
    ADD CONSTRAINT horarios_jornada_pkey PRIMARY KEY (id);


--
-- Name: importacoes importacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.importacoes
    ADD CONSTRAINT importacoes_pkey PRIMARY KEY (id);


--
-- Name: instituicoes instituicoes_codigo_instituicao_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instituicoes
    ADD CONSTRAINT instituicoes_codigo_instituicao_key UNIQUE (codigo_instituicao);


--
-- Name: instituicoes instituicoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instituicoes
    ADD CONSTRAINT instituicoes_pkey PRIMARY KEY (id);


--
-- Name: itens_ata_registro_preco itens_ata_registro_preco_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_ata_registro_preco
    ADD CONSTRAINT itens_ata_registro_preco_pkey PRIMARY KEY (id);


--
-- Name: itens_checklist itens_checklist_checklist_id_numero_item_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_checklist
    ADD CONSTRAINT itens_checklist_checklist_id_numero_item_key UNIQUE (checklist_id, numero_item);


--
-- Name: itens_checklist itens_checklist_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_checklist
    ADD CONSTRAINT itens_checklist_pkey PRIMARY KEY (id);


--
-- Name: itens_contrato itens_contrato_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_contrato
    ADD CONSTRAINT itens_contrato_pkey PRIMARY KEY (id);


--
-- Name: itens_ficha_financeira itens_ficha_financeira_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_ficha_financeira
    ADD CONSTRAINT itens_ficha_financeira_pkey PRIMARY KEY (id);


--
-- Name: itens_licitacao itens_licitacao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_licitacao
    ADD CONSTRAINT itens_licitacao_pkey PRIMARY KEY (id);


--
-- Name: itens_licitacao itens_licitacao_processo_id_numero_item_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_licitacao
    ADD CONSTRAINT itens_licitacao_processo_id_numero_item_key UNIQUE (processo_id, numero_item);


--
-- Name: itens_material itens_material_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_material
    ADD CONSTRAINT itens_material_codigo_key UNIQUE (codigo);


--
-- Name: itens_material itens_material_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_material
    ADD CONSTRAINT itens_material_pkey PRIMARY KEY (id);


--
-- Name: itens_processo_licitatorio itens_processo_licitatorio_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_processo_licitatorio
    ADD CONSTRAINT itens_processo_licitatorio_pkey PRIMARY KEY (id);


--
-- Name: itens_retorno_bancario itens_retorno_bancario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_retorno_bancario
    ADD CONSTRAINT itens_retorno_bancario_pkey PRIMARY KEY (id);


--
-- Name: justificativas_ponto justificativas_ponto_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.justificativas_ponto
    ADD CONSTRAINT justificativas_ponto_pkey PRIMARY KEY (id);


--
-- Name: lancamentos_banco_horas lancamentos_banco_horas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lancamentos_banco_horas
    ADD CONSTRAINT lancamentos_banco_horas_pkey PRIMARY KEY (id);


--
-- Name: lancamentos_folha lancamentos_folha_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lancamentos_folha
    ADD CONSTRAINT lancamentos_folha_pkey PRIMARY KEY (id);


--
-- Name: licencas_afastamentos licencas_afastamentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.licencas_afastamentos
    ADD CONSTRAINT licencas_afastamentos_pkey PRIMARY KEY (id);


--
-- Name: links_uteis links_uteis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.links_uteis
    ADD CONSTRAINT links_uteis_pkey PRIMARY KEY (id);


--
-- Name: liquidacoes liquidacoes_empenho_id_numero_liquidacao_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.liquidacoes
    ADD CONSTRAINT liquidacoes_empenho_id_numero_liquidacao_key UNIQUE (empenho_id, numero_liquidacao);


--
-- Name: liquidacoes liquidacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.liquidacoes
    ADD CONSTRAINT liquidacoes_pkey PRIMARY KEY (id);


--
-- Name: lotacoes lotacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lotacoes
    ADD CONSTRAINT lotacoes_pkey PRIMARY KEY (id);


--
-- Name: manutencoes_patrimonio manutencoes_patrimonio_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manutencoes_patrimonio
    ADD CONSTRAINT manutencoes_patrimonio_pkey PRIMARY KEY (id);


--
-- Name: matriz_raci_atribuicoes matriz_raci_atribuicoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matriz_raci_atribuicoes
    ADD CONSTRAINT matriz_raci_atribuicoes_pkey PRIMARY KEY (id);


--
-- Name: matriz_raci_atribuicoes matriz_raci_atribuicoes_processo_id_papel_id_tipo_papel_eta_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matriz_raci_atribuicoes
    ADD CONSTRAINT matriz_raci_atribuicoes_processo_id_papel_id_tipo_papel_eta_key UNIQUE (processo_id, papel_id, tipo_papel, etapa_processo);


--
-- Name: matriz_raci_papeis matriz_raci_papeis_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matriz_raci_papeis
    ADD CONSTRAINT matriz_raci_papeis_codigo_key UNIQUE (codigo);


--
-- Name: matriz_raci_papeis matriz_raci_papeis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matriz_raci_papeis
    ADD CONSTRAINT matriz_raci_papeis_pkey PRIMARY KEY (id);


--
-- Name: matriz_raci_processos matriz_raci_processos_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matriz_raci_processos
    ADD CONSTRAINT matriz_raci_processos_codigo_key UNIQUE (codigo);


--
-- Name: matriz_raci_processos matriz_raci_processos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matriz_raci_processos
    ADD CONSTRAINT matriz_raci_processos_pkey PRIMARY KEY (id);


--
-- Name: medicoes_contrato medicoes_contrato_contrato_id_numero_medicao_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medicoes_contrato
    ADD CONSTRAINT medicoes_contrato_contrato_id_numero_medicao_key UNIQUE (contrato_id, numero_medicao);


--
-- Name: medicoes_contrato medicoes_contrato_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medicoes_contrato
    ADD CONSTRAINT medicoes_contrato_pkey PRIMARY KEY (id);


--
-- Name: memorandos_lotacao memorandos_lotacao_numero_protocolo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memorandos_lotacao
    ADD CONSTRAINT memorandos_lotacao_numero_protocolo_key UNIQUE (numero_protocolo);


--
-- Name: memorandos_lotacao memorandos_lotacao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memorandos_lotacao
    ADD CONSTRAINT memorandos_lotacao_pkey PRIMARY KEY (id);


--
-- Name: modelos_mensagem_reuniao modelos_mensagem_reuniao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modelos_mensagem_reuniao
    ADD CONSTRAINT modelos_mensagem_reuniao_pkey PRIMARY KEY (id);


--
-- Name: module_access_scopes module_access_scopes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.module_access_scopes
    ADD CONSTRAINT module_access_scopes_pkey PRIMARY KEY (id);


--
-- Name: module_permissions_catalog module_permissions_catalog_permission_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.module_permissions_catalog
    ADD CONSTRAINT module_permissions_catalog_permission_code_key UNIQUE (permission_code);


--
-- Name: module_permissions_catalog module_permissions_catalog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.module_permissions_catalog
    ADD CONSTRAINT module_permissions_catalog_pkey PRIMARY KEY (id);


--
-- Name: module_settings module_settings_module_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.module_settings
    ADD CONSTRAINT module_settings_module_code_key UNIQUE (module_code);


--
-- Name: module_settings module_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.module_settings
    ADD CONSTRAINT module_settings_pkey PRIMARY KEY (id);


--
-- Name: movimentacoes_bem movimentacoes_bem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentacoes_bem
    ADD CONSTRAINT movimentacoes_bem_pkey PRIMARY KEY (id);


--
-- Name: movimentacoes_estoque movimentacoes_estoque_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentacoes_estoque
    ADD CONSTRAINT movimentacoes_estoque_pkey PRIMARY KEY (id);


--
-- Name: movimentacoes_patrimonio movimentacoes_patrimonio_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentacoes_patrimonio
    ADD CONSTRAINT movimentacoes_patrimonio_pkey PRIMARY KEY (id);


--
-- Name: movimentacoes_processo movimentacoes_processo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentacoes_processo
    ADD CONSTRAINT movimentacoes_processo_pkey PRIMARY KEY (id);


--
-- Name: nomeacoes_chefe_unidade nomeacoes_chefe_unidade_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nomeacoes_chefe_unidade
    ADD CONSTRAINT nomeacoes_chefe_unidade_pkey PRIMARY KEY (id);


--
-- Name: noticias_eventos_esportivos noticias_eventos_esportivos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.noticias_eventos_esportivos
    ADD CONSTRAINT noticias_eventos_esportivos_pkey PRIMARY KEY (id);


--
-- Name: noticias_eventos_esportivos noticias_eventos_esportivos_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.noticias_eventos_esportivos
    ADD CONSTRAINT noticias_eventos_esportivos_slug_key UNIQUE (slug);


--
-- Name: ocorrencias_patrimonio ocorrencias_patrimonio_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ocorrencias_patrimonio
    ADD CONSTRAINT ocorrencias_patrimonio_pkey PRIMARY KEY (id);


--
-- Name: ocorrencias_servidor ocorrencias_servidor_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ocorrencias_servidor
    ADD CONSTRAINT ocorrencias_servidor_pkey PRIMARY KEY (id);


--
-- Name: pagamentos pagamentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagamentos
    ADD CONSTRAINT pagamentos_pkey PRIMARY KEY (id);


--
-- Name: parametros_folha parametros_folha_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parametros_folha
    ADD CONSTRAINT parametros_folha_pkey PRIMARY KEY (id);


--
-- Name: pareceres_tecnicos pareceres_tecnicos_numero_parecer_ano_tipo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pareceres_tecnicos
    ADD CONSTRAINT pareceres_tecnicos_numero_parecer_ano_tipo_key UNIQUE (numero_parecer, ano, tipo);


--
-- Name: pareceres_tecnicos pareceres_tecnicos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pareceres_tecnicos
    ADD CONSTRAINT pareceres_tecnicos_pkey PRIMARY KEY (id);


--
-- Name: participantes_reuniao participantes_reuniao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participantes_reuniao
    ADD CONSTRAINT participantes_reuniao_pkey PRIMARY KEY (id);


--
-- Name: patrimonio_unidade patrimonio_unidade_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patrimonio_unidade
    ADD CONSTRAINT patrimonio_unidade_pkey PRIMARY KEY (id);


--
-- Name: pensoes_alimenticias pensoes_alimenticias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pensoes_alimenticias
    ADD CONSTRAINT pensoes_alimenticias_pkey PRIMARY KEY (id);


--
-- Name: planos_tratamento_risco planos_tratamento_risco_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planos_tratamento_risco
    ADD CONSTRAINT planos_tratamento_risco_pkey PRIMARY KEY (id);


--
-- Name: planos_tratamento_risco planos_tratamento_risco_risco_id_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planos_tratamento_risco
    ADD CONSTRAINT planos_tratamento_risco_risco_id_codigo_key UNIQUE (risco_id, codigo);


--
-- Name: portal_diretoria portal_diretoria_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_diretoria
    ADD CONSTRAINT portal_diretoria_pkey PRIMARY KEY (id);


--
-- Name: portarias_servidor portarias_servidor_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portarias_servidor
    ADD CONSTRAINT portarias_servidor_pkey PRIMARY KEY (id);


--
-- Name: prazos_lai prazos_lai_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prazos_lai
    ADD CONSTRAINT prazos_lai_pkey PRIMARY KEY (id);


--
-- Name: prazos_lai prazos_lai_tipo_prazo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prazos_lai
    ADD CONSTRAINT prazos_lai_tipo_prazo_key UNIQUE (tipo_prazo);


--
-- Name: prazos_processo prazos_processo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prazos_processo
    ADD CONSTRAINT prazos_processo_pkey PRIMARY KEY (id);


--
-- Name: pre_cadastros pre_cadastros_codigo_acesso_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pre_cadastros
    ADD CONSTRAINT pre_cadastros_codigo_acesso_key UNIQUE (codigo_acesso);


--
-- Name: pre_cadastros pre_cadastros_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pre_cadastros
    ADD CONSTRAINT pre_cadastros_pkey PRIMARY KEY (id);


--
-- Name: processos_administrativos processos_administrativos_numero_ano_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.processos_administrativos
    ADD CONSTRAINT processos_administrativos_numero_ano_unique UNIQUE (numero_processo, ano);


--
-- Name: processos_administrativos processos_administrativos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.processos_administrativos
    ADD CONSTRAINT processos_administrativos_pkey PRIMARY KEY (id);


--
-- Name: processos_licitatorios processos_licitatorios_numero_processo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.processos_licitatorios
    ADD CONSTRAINT processos_licitatorios_numero_processo_key UNIQUE (numero_processo);


--
-- Name: processos_licitatorios processos_licitatorios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.processos_licitatorios
    ADD CONSTRAINT processos_licitatorios_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: programas programas_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.programas
    ADD CONSTRAINT programas_codigo_key UNIQUE (codigo);


--
-- Name: programas programas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.programas
    ADD CONSTRAINT programas_pkey PRIMARY KEY (id);


--
-- Name: propostas_licitacao propostas_licitacao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.propostas_licitacao
    ADD CONSTRAINT propostas_licitacao_pkey PRIMARY KEY (id);


--
-- Name: provimentos provimentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provimentos
    ADD CONSTRAINT provimentos_pkey PRIMARY KEY (id);


--
-- Name: publicacoes_lai publicacoes_lai_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publicacoes_lai
    ADD CONSTRAINT publicacoes_lai_pkey PRIMARY KEY (id);


--
-- Name: publicacoes_legais publicacoes_legais_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publicacoes_legais
    ADD CONSTRAINT publicacoes_legais_pkey PRIMARY KEY (id);


--
-- Name: recursos_lai recursos_lai_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recursos_lai
    ADD CONSTRAINT recursos_lai_pkey PRIMARY KEY (id);


--
-- Name: regimes_trabalho regimes_trabalho_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regimes_trabalho
    ADD CONSTRAINT regimes_trabalho_codigo_key UNIQUE (codigo);


--
-- Name: regimes_trabalho regimes_trabalho_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regimes_trabalho
    ADD CONSTRAINT regimes_trabalho_pkey PRIMARY KEY (id);


--
-- Name: registros_ponto registros_ponto_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_ponto
    ADD CONSTRAINT registros_ponto_pkey PRIMARY KEY (id);


--
-- Name: registros_ponto registros_ponto_servidor_data_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_ponto
    ADD CONSTRAINT registros_ponto_servidor_data_unique UNIQUE (servidor_id, data);


--
-- Name: registros_ponto registros_ponto_servidor_id_data_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_ponto
    ADD CONSTRAINT registros_ponto_servidor_id_data_key UNIQUE (servidor_id, data);


--
-- Name: remessas_bancarias remessas_bancarias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.remessas_bancarias
    ADD CONSTRAINT remessas_bancarias_pkey PRIMARY KEY (id);


--
-- Name: requisicao_itens requisicao_itens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requisicao_itens
    ADD CONSTRAINT requisicao_itens_pkey PRIMARY KEY (id);


--
-- Name: requisicoes_material requisicoes_material_numero_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requisicoes_material
    ADD CONSTRAINT requisicoes_material_numero_key UNIQUE (numero);


--
-- Name: requisicoes_material requisicoes_material_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requisicoes_material
    ADD CONSTRAINT requisicoes_material_pkey PRIMARY KEY (id);


--
-- Name: respostas_checklist respostas_checklist_item_id_exercicio_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.respostas_checklist
    ADD CONSTRAINT respostas_checklist_item_id_exercicio_key UNIQUE (item_id, exercicio);


--
-- Name: respostas_checklist respostas_checklist_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.respostas_checklist
    ADD CONSTRAINT respostas_checklist_pkey PRIMARY KEY (id);


--
-- Name: retornos_bancarios retornos_bancarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.retornos_bancarios
    ADD CONSTRAINT retornos_bancarios_pkey PRIMARY KEY (id);


--
-- Name: reunioes reunioes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reunioes
    ADD CONSTRAINT reunioes_pkey PRIMARY KEY (id);


--
-- Name: riscos_institucionais riscos_institucionais_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.riscos_institucionais
    ADD CONSTRAINT riscos_institucionais_codigo_key UNIQUE (codigo);


--
-- Name: riscos_institucionais riscos_institucionais_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.riscos_institucionais
    ADD CONSTRAINT riscos_institucionais_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_role_permission_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_permission_key UNIQUE (role, permission);


--
-- Name: rubricas rubricas_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rubricas
    ADD CONSTRAINT rubricas_codigo_key UNIQUE (codigo);


--
-- Name: rubricas_historico rubricas_historico_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rubricas_historico
    ADD CONSTRAINT rubricas_historico_pkey PRIMARY KEY (id);


--
-- Name: rubricas rubricas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rubricas
    ADD CONSTRAINT rubricas_pkey PRIMARY KEY (id);


--
-- Name: servidor_regime servidor_regime_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servidor_regime
    ADD CONSTRAINT servidor_regime_pkey PRIMARY KEY (id);


--
-- Name: servidor_regime servidor_regime_servidor_id_regime_id_data_inicio_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servidor_regime
    ADD CONSTRAINT servidor_regime_servidor_id_regime_id_data_inicio_key UNIQUE (servidor_id, regime_id, data_inicio);


--
-- Name: servidor_tag_vinculos servidor_tag_vinculos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servidor_tag_vinculos
    ADD CONSTRAINT servidor_tag_vinculos_pkey PRIMARY KEY (id);


--
-- Name: servidor_tag_vinculos servidor_tag_vinculos_servidor_id_tag_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servidor_tag_vinculos
    ADD CONSTRAINT servidor_tag_vinculos_servidor_id_tag_id_key UNIQUE (servidor_id, tag_id);


--
-- Name: servidor_tags servidor_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servidor_tags
    ADD CONSTRAINT servidor_tags_pkey PRIMARY KEY (id);


--
-- Name: servidores servidores_codigo_interno_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servidores
    ADD CONSTRAINT servidores_codigo_interno_key UNIQUE (codigo_interno);


--
-- Name: servidores servidores_cpf_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servidores
    ADD CONSTRAINT servidores_cpf_key UNIQUE (cpf);


--
-- Name: servidores servidores_matricula_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servidores
    ADD CONSTRAINT servidores_matricula_key UNIQUE (matricula);


--
-- Name: servidores servidores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servidores
    ADD CONSTRAINT servidores_pkey PRIMARY KEY (id);


--
-- Name: solicitacoes_abono solicitacoes_abono_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitacoes_abono
    ADD CONSTRAINT solicitacoes_abono_pkey PRIMARY KEY (id);


--
-- Name: solicitacoes_ajuste_ponto solicitacoes_ajuste_ponto_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitacoes_ajuste_ponto
    ADD CONSTRAINT solicitacoes_ajuste_ponto_pkey PRIMARY KEY (id);


--
-- Name: solicitacoes_sic solicitacoes_sic_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitacoes_sic
    ADD CONSTRAINT solicitacoes_sic_pkey PRIMARY KEY (id);


--
-- Name: solicitacoes_sic solicitacoes_sic_protocolo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitacoes_sic
    ADD CONSTRAINT solicitacoes_sic_protocolo_key UNIQUE (protocolo);


--
-- Name: tabela_inss tabela_inss_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tabela_inss
    ADD CONSTRAINT tabela_inss_pkey PRIMARY KEY (id);


--
-- Name: tabela_inss tabela_inss_vigencia_inicio_faixa_ordem_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tabela_inss
    ADD CONSTRAINT tabela_inss_vigencia_inicio_faixa_ordem_key UNIQUE (vigencia_inicio, faixa_ordem);


--
-- Name: tabela_irrf tabela_irrf_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tabela_irrf
    ADD CONSTRAINT tabela_irrf_pkey PRIMARY KEY (id);


--
-- Name: tabela_irrf tabela_irrf_vigencia_inicio_faixa_ordem_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tabela_irrf
    ADD CONSTRAINT tabela_irrf_vigencia_inicio_faixa_ordem_key UNIQUE (vigencia_inicio, faixa_ordem);


--
-- Name: termos_cessao termos_cessao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.termos_cessao
    ADD CONSTRAINT termos_cessao_pkey PRIMARY KEY (id);


--
-- Name: tipos_abono tipos_abono_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipos_abono
    ADD CONSTRAINT tipos_abono_codigo_key UNIQUE (codigo);


--
-- Name: tipos_abono tipos_abono_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipos_abono
    ADD CONSTRAINT tipos_abono_pkey PRIMARY KEY (id);


--
-- Name: unidades_locais unidades_locais_municipio_nome_unidade_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unidades_locais
    ADD CONSTRAINT unidades_locais_municipio_nome_unidade_key UNIQUE (municipio, nome_unidade);


--
-- Name: unidades_locais unidades_locais_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unidades_locais
    ADD CONSTRAINT unidades_locais_pkey PRIMARY KEY (id);


--
-- Name: user_modules unique_user_module; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_modules
    ADD CONSTRAINT unique_user_module UNIQUE (user_id, module);


--
-- Name: user_roles unique_user_role; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT unique_user_role UNIQUE (user_id);


--
-- Name: config_motivos_desligamento uq_motivos_desligamento_codigo; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_motivos_desligamento
    ADD CONSTRAINT uq_motivos_desligamento_codigo UNIQUE (instituicao_id, codigo);


--
-- Name: fin_restos_pagar uq_rap_empenho; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_restos_pagar
    ADD CONSTRAINT uq_rap_empenho UNIQUE (empenho_id, exercicio_inscricao);


--
-- Name: recursos_lai uq_recurso_instancia; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recursos_lai
    ADD CONSTRAINT uq_recurso_instancia UNIQUE (solicitacao_id, instancia);


--
-- Name: config_situacoes_funcionais uq_situacoes_funcionais_codigo; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_situacoes_funcionais
    ADD CONSTRAINT uq_situacoes_funcionais_codigo UNIQUE (instituicao_id, codigo);


--
-- Name: config_tipos_ato uq_tipos_ato_codigo; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_tipos_ato
    ADD CONSTRAINT uq_tipos_ato_codigo UNIQUE (instituicao_id, codigo);


--
-- Name: config_tipos_onus uq_tipos_onus_codigo; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_tipos_onus
    ADD CONSTRAINT uq_tipos_onus_codigo UNIQUE (instituicao_id, codigo);


--
-- Name: config_tipos_servidor uq_tipos_servidor_codigo; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_tipos_servidor
    ADD CONSTRAINT uq_tipos_servidor_codigo UNIQUE (instituicao_id, codigo);


--
-- Name: user_modules user_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_modules
    ADD CONSTRAINT user_modules_pkey PRIMARY KEY (id);


--
-- Name: user_org_units user_org_units_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_org_units
    ADD CONSTRAINT user_org_units_pkey PRIMARY KEY (id);


--
-- Name: user_org_units user_org_units_user_id_unidade_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_org_units
    ADD CONSTRAINT user_org_units_user_id_unidade_id_key UNIQUE (user_id, unidade_id);


--
-- Name: user_permissions user_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_pkey PRIMARY KEY (id);


--
-- Name: user_permissions user_permissions_user_id_permission_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_user_id_permission_key UNIQUE (user_id, permission);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: _backup_usuario_modulos_old usuario_modulos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._backup_usuario_modulos_old
    ADD CONSTRAINT usuario_modulos_pkey PRIMARY KEY (id);


--
-- Name: _backup_usuario_modulos_old usuario_modulos_user_id_modulo_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._backup_usuario_modulos_old
    ADD CONSTRAINT usuario_modulos_user_id_modulo_id_key UNIQUE (user_id, modulo_id);


--
-- Name: viagens_diarias viagens_diarias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.viagens_diarias
    ADD CONSTRAINT viagens_diarias_pkey PRIMARY KEY (id);


--
-- Name: vinculos_funcionais vinculos_funcionais_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vinculos_funcionais
    ADD CONSTRAINT vinculos_funcionais_pkey PRIMARY KEY (id);


--
-- Name: vinculos_servidor vinculos_servidor_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vinculos_servidor
    ADD CONSTRAINT vinculos_servidor_pkey PRIMARY KEY (id);


--
-- Name: idx_acesso_sigiloso_processo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_acesso_sigiloso_processo ON public.acesso_processo_sigiloso USING btree (processo_id);


--
-- Name: idx_acesso_sigiloso_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_acesso_sigiloso_usuario ON public.acesso_processo_sigiloso USING btree (usuario_id);


--
-- Name: idx_acoes_processo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_acoes_processo ON public.acoes USING btree (processo_licitatorio_id);


--
-- Name: idx_acoes_programa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_acoes_programa ON public.acoes USING btree (programa_id);


--
-- Name: idx_agenda_datas; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agenda_datas ON public.agenda_unidade USING btree (data_inicio, data_fim);


--
-- Name: idx_agenda_modalidades; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agenda_modalidades ON public.agenda_unidade USING gin (modalidades_esportivas);


--
-- Name: idx_agenda_protocolo; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_agenda_protocolo ON public.agenda_unidade USING btree (numero_protocolo) WHERE (numero_protocolo IS NOT NULL);


--
-- Name: idx_agenda_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agenda_status ON public.agenda_unidade USING btree (status);


--
-- Name: idx_agenda_unidade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agenda_unidade ON public.agenda_unidade USING btree (unidade_local_id);


--
-- Name: idx_agenda_unidade_federacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agenda_unidade_federacao ON public.agenda_unidade USING btree (federacao_id) WHERE (federacao_id IS NOT NULL);


--
-- Name: idx_agenda_unidade_instituicao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agenda_unidade_instituicao ON public.agenda_unidade USING btree (instituicao_id) WHERE (instituicao_id IS NOT NULL);


--
-- Name: idx_agenda_unidade_processo_sei; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agenda_unidade_processo_sei ON public.agenda_unidade USING btree (numero_processo_sei) WHERE (numero_processo_sei IS NOT NULL);


--
-- Name: idx_agrupamento_vinculo_agrupamento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agrupamento_vinculo_agrupamento ON public.agrupamento_unidade_vinculo USING btree (agrupamento_id);


--
-- Name: idx_agrupamento_vinculo_unidade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agrupamento_vinculo_unidade ON public.agrupamento_unidade_vinculo USING btree (unidade_id);


--
-- Name: idx_approval_requests_approver; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_approval_requests_approver ON public.approval_requests USING btree (approver_id);


--
-- Name: idx_approval_requests_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_approval_requests_entity ON public.approval_requests USING btree (entity_type, entity_id);


--
-- Name: idx_approval_requests_requester; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_approval_requests_requester ON public.approval_requests USING btree (requester_id);


--
-- Name: idx_approval_requests_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_approval_requests_status ON public.approval_requests USING btree (status);


--
-- Name: idx_arbitros_modalidades_arbitro; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_arbitros_modalidades_arbitro ON public.cadastro_arbitros_modalidades USING btree (arbitro_id);


--
-- Name: idx_arbitros_modalidades_modalidade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_arbitros_modalidades_modalidade ON public.cadastro_arbitros_modalidades USING btree (modalidade);


--
-- Name: idx_atas_registro_preco_fornecedor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_atas_registro_preco_fornecedor ON public.atas_registro_preco USING btree (fornecedor_id);


--
-- Name: idx_atas_registro_preco_processo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_atas_registro_preco_processo ON public.atas_registro_preco USING btree (processo_id);


--
-- Name: idx_ats_servidor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ats_servidor ON public.adicionais_tempo_servico USING btree (servidor_id);


--
-- Name: idx_ats_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ats_tipo ON public.adicionais_tempo_servico USING btree (tipo);


--
-- Name: idx_audit_lic_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_lic_data ON public.audit_log_licitacoes USING btree (created_at);


--
-- Name: idx_audit_lic_registro; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_lic_registro ON public.audit_log_licitacoes USING btree (registro_id);


--
-- Name: idx_audit_lic_tabela; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_lic_tabela ON public.audit_log_licitacoes USING btree (tabela_origem);


--
-- Name: idx_audit_logs_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action);


--
-- Name: idx_audit_logs_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_entity ON public.audit_logs USING btree (entity_type, entity_id);


--
-- Name: idx_audit_logs_module; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_module ON public.audit_logs USING btree (module_name);


--
-- Name: idx_audit_logs_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs USING btree ("timestamp" DESC);


--
-- Name: idx_audit_logs_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_user ON public.audit_logs USING btree (user_id);


--
-- Name: idx_avisos_leituras_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_avisos_leituras_user ON public.avisos_leituras USING btree (user_id);


--
-- Name: idx_avisos_vigentes; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_avisos_vigentes ON public.avisos USING btree (inicio_em DESC) WHERE ativo;


--
-- Name: idx_backup_history_started_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_backup_history_started_at ON public.backup_history USING btree (started_at DESC);


--
-- Name: idx_backup_history_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_backup_history_status ON public.backup_history USING btree (status);


--
-- Name: idx_backup_history_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_backup_history_type ON public.backup_history USING btree (backup_type);


--
-- Name: idx_baixas_bem; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_baixas_bem ON public.baixas_patrimonio USING btree (bem_id);


--
-- Name: idx_baixas_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_baixas_status ON public.baixas_patrimonio USING btree (status);


--
-- Name: idx_banco_horas_periodo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_banco_horas_periodo ON public.banco_horas USING btree (ano, mes);


--
-- Name: idx_banco_horas_servidor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_banco_horas_servidor ON public.banco_horas USING btree (servidor_id);


--
-- Name: idx_bens_categoria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bens_categoria ON public.bens_patrimoniais USING btree (categoria_bem);


--
-- Name: idx_bens_codigo_qr; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bens_codigo_qr ON public.bens_patrimoniais USING btree (codigo_qr);


--
-- Name: idx_bens_responsavel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bens_responsavel ON public.bens_patrimoniais USING btree (responsavel_id);


--
-- Name: idx_bens_situacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bens_situacao ON public.bens_patrimoniais USING btree (situacao);


--
-- Name: idx_bens_situacao_inventario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bens_situacao_inventario ON public.bens_patrimoniais USING btree (situacao_inventario);


--
-- Name: idx_bens_unidade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bens_unidade ON public.bens_patrimoniais USING btree (unidade_id);


--
-- Name: idx_bens_unidade_local; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bens_unidade_local ON public.bens_patrimoniais USING btree (unidade_local_id);


--
-- Name: idx_calendario_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_calendario_data ON public.calendario_federacao USING btree (data_inicio);


--
-- Name: idx_calendario_federacao_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_calendario_federacao_id ON public.calendario_federacao USING btree (federacao_id);


--
-- Name: idx_campanhas_ano; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_campanhas_ano ON public.campanhas_inventario USING btree (ano);


--
-- Name: idx_campanhas_inventario_unidades_campanha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_campanhas_inventario_unidades_campanha ON public.campanhas_inventario_unidades USING btree (campanha_id);


--
-- Name: idx_campanhas_inventario_unidades_unidade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_campanhas_inventario_unidades_unidade ON public.campanhas_inventario_unidades USING btree (unidade_local_id);


--
-- Name: idx_campanhas_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_campanhas_status ON public.campanhas_inventario USING btree (status);


--
-- Name: idx_cargo_unidade_compat_cargo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cargo_unidade_compat_cargo ON public.cargo_unidade_compatibilidade USING btree (cargo_id);


--
-- Name: idx_cargos_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cargos_ativo ON public.cargos USING btree (ativo);


--
-- Name: idx_cargos_categoria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cargos_categoria ON public.cargos USING btree (categoria);


--
-- Name: idx_cessoes_ativa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cessoes_ativa ON public.cessoes USING btree (ativa) WHERE (ativa = true);


--
-- Name: idx_cessoes_servidor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cessoes_servidor ON public.cessoes USING btree (servidor_id);


--
-- Name: idx_checklist_exercicio; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_checklist_exercicio ON public.checklists_conformidade USING btree (exercicio);


--
-- Name: idx_checklist_orgao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_checklist_orgao ON public.checklists_conformidade USING btree (orgao_fiscalizador);


--
-- Name: idx_cms_banners_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cms_banners_ativo ON public.cms_banners USING btree (ativo) WHERE (ativo = true);


--
-- Name: idx_cms_banners_destino; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cms_banners_destino ON public.cms_banners USING btree (destino);


--
-- Name: idx_cms_conteudos_data_publicacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cms_conteudos_data_publicacao ON public.cms_conteudos USING btree (data_publicacao);


--
-- Name: idx_cms_conteudos_destaque; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cms_conteudos_destaque ON public.cms_conteudos USING btree (destaque) WHERE (destaque = true);


--
-- Name: idx_cms_conteudos_destino; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cms_conteudos_destino ON public.cms_conteudos USING btree (destino);


--
-- Name: idx_cms_conteudos_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cms_conteudos_status ON public.cms_conteudos USING btree (status);


--
-- Name: idx_cms_conteudos_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cms_conteudos_tipo ON public.cms_conteudos USING btree (tipo);


--
-- Name: idx_cms_galeria_fotos_galeria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cms_galeria_fotos_galeria ON public.cms_galeria_fotos USING btree (galeria_id);


--
-- Name: idx_cms_galeria_fotos_ordem; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cms_galeria_fotos_ordem ON public.cms_galeria_fotos USING btree (galeria_id, ordem);


--
-- Name: idx_cms_galerias_destino; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cms_galerias_destino ON public.cms_galerias USING btree (destino);


--
-- Name: idx_cms_galerias_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cms_galerias_slug ON public.cms_galerias USING btree (slug);


--
-- Name: idx_cms_galerias_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cms_galerias_status ON public.cms_galerias USING btree (status);


--
-- Name: idx_cms_media_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cms_media_created_at ON public.cms_media USING btree (created_at DESC);


--
-- Name: idx_cms_media_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cms_media_tipo ON public.cms_media USING btree (tipo);


--
-- Name: idx_coletas_bem; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coletas_bem ON public.coletas_inventario USING btree (bem_id);


--
-- Name: idx_coletas_campanha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coletas_campanha ON public.coletas_inventario USING btree (campanha_id);


--
-- Name: idx_coletas_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coletas_status ON public.coletas_inventario USING btree (status_coleta);


--
-- Name: idx_conciliacoes_campanha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conciliacoes_campanha ON public.conciliacoes_inventario USING btree (campanha_id);


--
-- Name: idx_conciliacoes_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conciliacoes_status ON public.conciliacoes_inventario USING btree (status);


--
-- Name: idx_config_assinatura_frequencia_instituicao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_assinatura_frequencia_instituicao ON public.config_assinatura_frequencia USING btree (instituicao_id);


--
-- Name: idx_config_compensacao_instituicao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_compensacao_instituicao ON public.config_compensacao USING btree (instituicao_id);


--
-- Name: idx_config_fechamento_frequencia_instituicao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_fechamento_frequencia_instituicao ON public.config_fechamento_frequencia USING btree (instituicao_id);


--
-- Name: idx_config_fechamento_instituicao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_fechamento_instituicao ON public.config_fechamento_folha USING btree (instituicao_id);


--
-- Name: idx_config_fechamento_padrao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_fechamento_padrao ON public.config_fechamento_folha USING btree (padrao);


--
-- Name: idx_config_incidencias_destino; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_incidencias_destino ON public.config_incidencias USING btree (rubrica_destino_id);


--
-- Name: idx_config_incidencias_origem; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_incidencias_origem ON public.config_incidencias USING btree (rubrica_origem_id);


--
-- Name: idx_config_jornada_escopo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_jornada_escopo ON public.config_jornada_padrao USING btree (escopo, ativo);


--
-- Name: idx_config_jornada_padrao_instituicao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_jornada_padrao_instituicao ON public.config_jornada_padrao USING btree (instituicao_id);


--
-- Name: idx_config_jornada_unidade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_jornada_unidade ON public.config_jornada_padrao USING btree (unidade_id) WHERE (unidade_id IS NOT NULL);


--
-- Name: idx_config_motivos_desligamento_instituicao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_motivos_desligamento_instituicao ON public.config_motivos_desligamento USING btree (instituicao_id);


--
-- Name: idx_config_param_valores_codigo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_param_valores_codigo ON public.config_parametros_valores USING btree (parametro_codigo);


--
-- Name: idx_config_param_valores_instituicao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_param_valores_instituicao ON public.config_parametros_valores USING btree (instituicao_id);


--
-- Name: idx_config_param_valores_nivel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_param_valores_nivel ON public.config_parametros_valores USING btree (unidade_id, tipo_servidor, servidor_id);


--
-- Name: idx_config_param_valores_vigencia; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_param_valores_vigencia ON public.config_parametros_valores USING btree (vigencia_inicio, vigencia_fim);


--
-- Name: idx_config_parametros_valores_unicidade; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_config_parametros_valores_unicidade ON public.config_parametros_valores USING btree (instituicao_id, parametro_codigo, COALESCE(unidade_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(tipo_servidor, '__NULL__'::character varying), COALESCE(servidor_id, '00000000-0000-0000-0000-000000000000'::uuid), vigencia_inicio);


--
-- Name: INDEX idx_config_parametros_valores_unicidade; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_config_parametros_valores_unicidade IS 'Garante unicidade de parâmetros por instituição, código, contexto hierárquico e vigência. Suporta ON CONFLICT para upserts.';


--
-- Name: idx_config_regras_codigo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_regras_codigo ON public.config_regras_calculo USING btree (codigo);


--
-- Name: idx_config_regras_escopo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_regras_escopo ON public.config_regras_calculo USING btree (escopo);


--
-- Name: idx_config_regras_instituicao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_regras_instituicao ON public.config_regras_calculo USING btree (instituicao_id);


--
-- Name: idx_config_regras_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_regras_tipo ON public.config_regras_calculo USING btree (tipo_regra);


--
-- Name: idx_config_rubricas_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_rubricas_ativo ON public.config_rubricas USING btree (ativo);


--
-- Name: idx_config_rubricas_codigo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_rubricas_codigo ON public.config_rubricas USING btree (codigo);


--
-- Name: idx_config_rubricas_instituicao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_rubricas_instituicao ON public.config_rubricas USING btree (instituicao_id);


--
-- Name: idx_config_rubricas_natureza; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_rubricas_natureza ON public.config_rubricas USING btree (natureza);


--
-- Name: idx_config_rubricas_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_rubricas_tipo ON public.config_rubricas USING btree (tipo_rubrica_id);


--
-- Name: idx_config_rubricas_vigencia; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_rubricas_vigencia ON public.config_rubricas USING btree (vigencia_inicio, vigencia_fim);


--
-- Name: idx_config_situacoes_funcionais_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_situacoes_funcionais_ativo ON public.config_situacoes_funcionais USING btree (ativo) WHERE (ativo = true);


--
-- Name: idx_config_situacoes_funcionais_instituicao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_situacoes_funcionais_instituicao ON public.config_situacoes_funcionais USING btree (instituicao_id);


--
-- Name: idx_config_tipos_ato_instituicao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_tipos_ato_instituicao ON public.config_tipos_ato USING btree (instituicao_id);


--
-- Name: idx_config_tipos_rubrica_codigo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_tipos_rubrica_codigo ON public.config_tipos_rubrica USING btree (codigo);


--
-- Name: idx_config_tipos_rubrica_instituicao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_tipos_rubrica_instituicao ON public.config_tipos_rubrica USING btree (instituicao_id);


--
-- Name: idx_config_tipos_rubrica_natureza; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_tipos_rubrica_natureza ON public.config_tipos_rubrica USING btree (natureza);


--
-- Name: idx_config_tipos_servidor_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_tipos_servidor_ativo ON public.config_tipos_servidor USING btree (ativo) WHERE (ativo = true);


--
-- Name: idx_config_tipos_servidor_codigo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_tipos_servidor_codigo ON public.config_tipos_servidor USING btree (codigo);


--
-- Name: idx_config_tipos_servidor_instituicao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_config_tipos_servidor_instituicao ON public.config_tipos_servidor USING btree (instituicao_id);


--
-- Name: idx_consignacoes_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_consignacoes_ativo ON public.consignacoes USING btree (ativo, suspenso);


--
-- Name: idx_consignacoes_servidor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_consignacoes_servidor ON public.consignacoes USING btree (servidor_id);


--
-- Name: idx_conteudo_rascunho_identificador; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conteudo_rascunho_identificador ON public.conteudo_rascunho USING btree (identificador);


--
-- Name: idx_conteudo_rascunho_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conteudo_rascunho_status ON public.conteudo_rascunho USING btree (status);


--
-- Name: idx_conteudo_rascunho_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conteudo_rascunho_tipo ON public.conteudo_rascunho USING btree (tipo);


--
-- Name: idx_contratos_numero; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contratos_numero ON public.contratos USING btree (numero_contrato);


--
-- Name: idx_contratos_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contratos_status ON public.contratos USING btree (status);


--
-- Name: idx_controles_modulo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_controles_modulo ON public.controles_internos USING btree (modulo_sistema);


--
-- Name: idx_controles_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_controles_tipo ON public.controles_internos USING btree (tipo);


--
-- Name: idx_dados_oficiais_categoria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dados_oficiais_categoria ON public.dados_oficiais USING btree (categoria);


--
-- Name: idx_dados_oficiais_chave; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dados_oficiais_chave ON public.dados_oficiais USING btree (chave);


--
-- Name: idx_datas_importantes_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_datas_importantes_data ON public.datas_importantes USING btree (data) WHERE ativo;


--
-- Name: idx_debitos_tecnicos_modulo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_debitos_tecnicos_modulo ON public.debitos_tecnicos USING btree (modulo);


--
-- Name: idx_debitos_tecnicos_prioridade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_debitos_tecnicos_prioridade ON public.debitos_tecnicos USING btree (prioridade);


--
-- Name: idx_debitos_tecnicos_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_debitos_tecnicos_status ON public.debitos_tecnicos USING btree (status);


--
-- Name: idx_decisoes_ano; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_decisoes_ano ON public.decisoes_administrativas USING btree (ano);


--
-- Name: idx_decisoes_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_decisoes_tipo ON public.decisoes_administrativas USING btree (tipo);


--
-- Name: idx_denuncias_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_denuncias_created_at ON public.denuncias USING btree (created_at DESC);


--
-- Name: idx_denuncias_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_denuncias_status ON public.denuncias USING btree (status);


--
-- Name: idx_denuncias_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_denuncias_tipo ON public.denuncias USING btree (tipo);


--
-- Name: idx_dependentes_irrf_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dependentes_irrf_ativo ON public.dependentes_irrf USING btree (ativo, deduz_irrf);


--
-- Name: idx_dependentes_irrf_servidor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dependentes_irrf_servidor ON public.dependentes_irrf USING btree (servidor_id);


--
-- Name: idx_designacoes_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_designacoes_ativo ON public.designacoes USING btree (ativo) WHERE (ativo = true);


--
-- Name: idx_designacoes_servidor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_designacoes_servidor_id ON public.designacoes USING btree (servidor_id);


--
-- Name: idx_designacoes_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_designacoes_status ON public.designacoes USING btree (status);


--
-- Name: idx_designacoes_unidade_destino; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_designacoes_unidade_destino ON public.designacoes USING btree (unidade_destino_id);


--
-- Name: idx_despachos_autoridade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_despachos_autoridade ON public.despachos USING btree (autoridade_id);


--
-- Name: idx_despachos_processo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_despachos_processo ON public.despachos USING btree (processo_id);


--
-- Name: idx_despachos_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_despachos_tipo ON public.despachos USING btree (tipo_despacho);


--
-- Name: idx_dias_nao_uteis_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dias_nao_uteis_ativo ON public.dias_nao_uteis USING btree (ativo) WHERE (ativo = true);


--
-- Name: idx_dias_nao_uteis_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dias_nao_uteis_data ON public.dias_nao_uteis USING btree (data, ativo);


--
-- Name: idx_dias_nao_uteis_esfera; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dias_nao_uteis_esfera ON public.dias_nao_uteis USING btree (esfera);


--
-- Name: idx_dias_nao_uteis_instituicao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dias_nao_uteis_instituicao ON public.dias_nao_uteis USING btree (instituicao_id);


--
-- Name: idx_dias_nao_uteis_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dias_nao_uteis_tipo ON public.dias_nao_uteis USING btree (tipo, ativo);


--
-- Name: idx_doc_req_servidor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_doc_req_servidor ON public.documentos_requerimento_servidor USING btree (servidor_id);


--
-- Name: idx_doc_req_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_doc_req_status ON public.documentos_requerimento_servidor USING btree (status);


--
-- Name: idx_documentos_cedencia_agenda; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documentos_cedencia_agenda ON public.documentos_cedencia USING btree (agenda_id);


--
-- Name: idx_documentos_cedencia_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documentos_cedencia_tipo ON public.documentos_cedencia USING btree (tipo_documento);


--
-- Name: idx_documentos_designacao_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documentos_designacao_id ON public.documentos USING btree (designacao_id) WHERE (designacao_id IS NOT NULL);


--
-- Name: idx_documentos_numero; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documentos_numero ON public.documentos USING btree (numero);


--
-- Name: idx_documentos_processo_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documentos_processo_id ON public.documentos_processo USING btree (processo_id);


--
-- Name: idx_documentos_provimento_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documentos_provimento_id ON public.documentos USING btree (provimento_id) WHERE (provimento_id IS NOT NULL);


--
-- Name: idx_documentos_responsavel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documentos_responsavel ON public.documentos USING btree (responsavel_id);


--
-- Name: idx_documentos_servidores_ids; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documentos_servidores_ids ON public.documentos USING gin (servidores_ids) WHERE ((servidores_ids IS NOT NULL) AND (array_length(servidores_ids, 1) > 0));


--
-- Name: idx_documentos_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documentos_status ON public.documentos USING btree (status);


--
-- Name: idx_documentos_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documentos_tipo ON public.documentos USING btree (tipo);


--
-- Name: idx_documentos_tipo_ano; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documentos_tipo_ano ON public.documentos USING btree (tipo, EXTRACT(year FROM data_documento));


--
-- Name: idx_dotacoes_classificacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dotacoes_classificacao ON public.dotacoes_orcamentarias USING btree (classificacao_completa);


--
-- Name: idx_dotacoes_exercicio; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dotacoes_exercicio ON public.dotacoes_orcamentarias USING btree (exercicio);


--
-- Name: idx_empenhos_contrato; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_empenhos_contrato ON public.empenhos USING btree (contrato_id);


--
-- Name: idx_empenhos_dotacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_empenhos_dotacao ON public.empenhos USING btree (dotacao_id);


--
-- Name: idx_empenhos_exercicio; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_empenhos_exercicio ON public.empenhos USING btree (exercicio);


--
-- Name: idx_empenhos_fornecedor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_empenhos_fornecedor ON public.empenhos USING btree (fornecedor_id);


--
-- Name: idx_encaminhamentos_destino; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_encaminhamentos_destino ON public.encaminhamentos USING btree (unidade_destino_id);


--
-- Name: idx_encaminhamentos_origem; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_encaminhamentos_origem ON public.encaminhamentos USING btree (tipo_origem, origem_id);


--
-- Name: idx_envios_log_criado_em; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_envios_log_criado_em ON public.envios_log USING btree (criado_em DESC);


--
-- Name: idx_envios_log_origem; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_envios_log_origem ON public.envios_log USING btree (origem_modulo, origem_id);


--
-- Name: idx_escolas_jer_inep; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_escolas_jer_inep ON public.escolas_jer USING btree (inep) WHERE (inep IS NOT NULL);


--
-- Name: idx_escolas_jer_municipio; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_escolas_jer_municipio ON public.escolas_jer USING btree (municipio);


--
-- Name: idx_escolas_jer_nome; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_escolas_jer_nome ON public.escolas_jer USING btree (nome);


--
-- Name: idx_estoque_almoxarifado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_estoque_almoxarifado ON public.estoque USING btree (almoxarifado_id);


--
-- Name: idx_estoque_item; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_estoque_item ON public.estoque USING btree (item_id);


--
-- Name: idx_estrutura_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_estrutura_ativo ON public.estrutura_organizacional USING btree (ativo);


--
-- Name: idx_estrutura_superior; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_estrutura_superior ON public.estrutura_organizacional USING btree (superior_id);


--
-- Name: idx_estrutura_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_estrutura_tipo ON public.estrutura_organizacional USING btree (tipo);


--
-- Name: idx_eventos_esocial_folha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_eventos_esocial_folha ON public.eventos_esocial USING btree (folha_id);


--
-- Name: idx_eventos_esocial_lote; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_eventos_esocial_lote ON public.eventos_esocial USING btree (lote_id);


--
-- Name: idx_eventos_esocial_servidor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_eventos_esocial_servidor ON public.eventos_esocial USING btree (servidor_id);


--
-- Name: idx_eventos_esocial_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_eventos_esocial_status ON public.eventos_esocial USING btree (status);


--
-- Name: idx_eventos_esocial_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_eventos_esocial_tipo ON public.eventos_esocial USING btree (tipo_evento);


--
-- Name: idx_evidencias_controle; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_evidencias_controle ON public.evidencias_controle USING btree (controle_id);


--
-- Name: idx_exportacoes_folha_folha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_exportacoes_folha_folha ON public.exportacoes_folha USING btree (folha_id);


--
-- Name: idx_exportacoes_folha_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_exportacoes_folha_tipo ON public.exportacoes_folha USING btree (tipo_exportacao);


--
-- Name: idx_federacao_arbitros_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_federacao_arbitros_ativo ON public.federacao_arbitros USING btree (ativo);


--
-- Name: idx_federacao_arbitros_federacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_federacao_arbitros_federacao ON public.federacao_arbitros USING btree (federacao_id);


--
-- Name: idx_federacao_espacos_federacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_federacao_espacos_federacao ON public.federacao_espacos_cedidos USING btree (federacao_id);


--
-- Name: idx_federacao_espacos_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_federacao_espacos_status ON public.federacao_espacos_cedidos USING btree (status);


--
-- Name: idx_federacao_espacos_unidade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_federacao_espacos_unidade ON public.federacao_espacos_cedidos USING btree (unidade_local_id);


--
-- Name: idx_federacao_parcerias_federacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_federacao_parcerias_federacao ON public.federacao_parcerias USING btree (federacao_id);


--
-- Name: idx_federacao_parcerias_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_federacao_parcerias_status ON public.federacao_parcerias USING btree (status);


--
-- Name: idx_federacao_parcerias_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_federacao_parcerias_tipo ON public.federacao_parcerias USING btree (tipo);


--
-- Name: idx_federacoes_sigla; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_federacoes_sigla ON public.federacoes_esportivas USING btree (sigla);


--
-- Name: idx_federacoes_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_federacoes_status ON public.federacoes_esportivas USING btree (status);


--
-- Name: idx_feriados_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feriados_data ON public.feriados USING btree (data);


--
-- Name: idx_ferias_periodo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ferias_periodo ON public.ferias_servidor USING btree (periodo_aquisitivo_inicio, periodo_aquisitivo_fim);


--
-- Name: idx_ferias_servidor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ferias_servidor ON public.ferias_servidor USING btree (servidor_id);


--
-- Name: idx_fichas_financeiras_cargo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fichas_financeiras_cargo ON public.fichas_financeiras USING btree (cargo_id);


--
-- Name: idx_fichas_financeiras_folha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fichas_financeiras_folha ON public.fichas_financeiras USING btree (folha_id);


--
-- Name: idx_fichas_financeiras_servidor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fichas_financeiras_servidor ON public.fichas_financeiras USING btree (servidor_id);


--
-- Name: idx_fin_acoes_programa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_acoes_programa ON public.fin_acoes_orcamentarias USING btree (programa_id);


--
-- Name: idx_fin_adiantamento_itens_adi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_adiantamento_itens_adi ON public.fin_adiantamento_itens USING btree (adiantamento_id);


--
-- Name: idx_fin_adiantamentos_prazo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_adiantamentos_prazo ON public.fin_adiantamentos USING btree (prazo_prestacao_contas);


--
-- Name: idx_fin_adiantamentos_servidor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_adiantamentos_servidor ON public.fin_adiantamentos USING btree (servidor_suprido_id);


--
-- Name: idx_fin_adiantamentos_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_adiantamentos_status ON public.fin_adiantamentos USING btree (status);


--
-- Name: idx_fin_audit_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_audit_data ON public.fin_audit_log USING btree (created_at);


--
-- Name: idx_fin_audit_registro; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_audit_registro ON public.fin_audit_log USING btree (registro_id);


--
-- Name: idx_fin_audit_tabela; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_audit_tabela ON public.fin_audit_log USING btree (tabela_origem);


--
-- Name: idx_fin_contas_banco; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_contas_banco ON public.fin_contas_bancarias USING btree (banco_codigo);


--
-- Name: idx_fin_documentos_categoria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_documentos_categoria ON public.fin_documentos USING btree (categoria);


--
-- Name: idx_fin_documentos_entidade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_documentos_entidade ON public.fin_documentos USING btree (entidade_tipo, entidade_id);


--
-- Name: idx_fin_dotacoes_acao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_dotacoes_acao ON public.fin_dotacoes USING btree (acao_id);


--
-- Name: idx_fin_dotacoes_exercicio; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_dotacoes_exercicio ON public.fin_dotacoes USING btree (exercicio);


--
-- Name: idx_fin_dotacoes_fonte; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_dotacoes_fonte ON public.fin_dotacoes USING btree (fonte_recurso_id);


--
-- Name: idx_fin_dotacoes_unidade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_dotacoes_unidade ON public.fin_dotacoes USING btree (unidade_orcamentaria_id);


--
-- Name: idx_fin_empenhos_contrato; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_empenhos_contrato ON public.fin_empenhos USING btree (contrato_id);


--
-- Name: idx_fin_empenhos_dotacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_empenhos_dotacao ON public.fin_empenhos USING btree (dotacao_id);


--
-- Name: idx_fin_empenhos_exercicio; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_empenhos_exercicio ON public.fin_empenhos USING btree (exercicio);


--
-- Name: idx_fin_empenhos_fornecedor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_empenhos_fornecedor ON public.fin_empenhos USING btree (fornecedor_id);


--
-- Name: idx_fin_empenhos_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_empenhos_status ON public.fin_empenhos USING btree (status);


--
-- Name: idx_fin_extrato_trans_extrato; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_extrato_trans_extrato ON public.fin_extrato_transacoes USING btree (extrato_id);


--
-- Name: idx_fin_extrato_trans_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_extrato_trans_status ON public.fin_extrato_transacoes USING btree (status);


--
-- Name: idx_fin_extratos_periodo; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_fin_extratos_periodo ON public.fin_extratos_bancarios USING btree (conta_bancaria_id, ano_referencia, mes_referencia);


--
-- Name: idx_fin_lancamentos_contas; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_lancamentos_contas ON public.fin_lancamentos_contabeis USING btree (conta_debito_id, conta_credito_id);


--
-- Name: idx_fin_lancamentos_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_lancamentos_data ON public.fin_lancamentos_contabeis USING btree (data_lancamento);


--
-- Name: idx_fin_lancamentos_origem; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_lancamentos_origem ON public.fin_lancamentos_contabeis USING btree (tipo_origem, origem_id);


--
-- Name: idx_fin_liquidacoes_empenho; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_liquidacoes_empenho ON public.fin_liquidacoes USING btree (empenho_id);


--
-- Name: idx_fin_liquidacoes_exercicio; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_liquidacoes_exercicio ON public.fin_liquidacoes USING btree (exercicio);


--
-- Name: idx_fin_liquidacoes_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_liquidacoes_status ON public.fin_liquidacoes USING btree (status);


--
-- Name: idx_fin_naturezas_codigo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_naturezas_codigo ON public.fin_naturezas_despesa USING btree (codigo);


--
-- Name: idx_fin_pagamentos_conta; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_pagamentos_conta ON public.fin_pagamentos USING btree (conta_bancaria_id);


--
-- Name: idx_fin_pagamentos_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_pagamentos_data ON public.fin_pagamentos USING btree (data_pagamento);


--
-- Name: idx_fin_pagamentos_empenho; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_pagamentos_empenho ON public.fin_pagamentos USING btree (empenho_id);


--
-- Name: idx_fin_pagamentos_liquidacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_pagamentos_liquidacao ON public.fin_pagamentos USING btree (liquidacao_id);


--
-- Name: idx_fin_pagamentos_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_pagamentos_status ON public.fin_pagamentos USING btree (status);


--
-- Name: idx_fin_plano_contas_codigo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_plano_contas_codigo ON public.fin_plano_contas USING btree (codigo);


--
-- Name: idx_fin_plano_contas_pai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_plano_contas_pai ON public.fin_plano_contas USING btree (conta_pai_id);


--
-- Name: idx_fin_rap_empenho; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_rap_empenho ON public.fin_restos_pagar USING btree (empenho_id);


--
-- Name: idx_fin_rap_exercicio; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_rap_exercicio ON public.fin_restos_pagar USING btree (exercicio_inscricao, tipo);


--
-- Name: idx_fin_rap_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_rap_status ON public.fin_restos_pagar USING btree (status);


--
-- Name: idx_fin_receitas_conta; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_receitas_conta ON public.fin_receitas USING btree (conta_bancaria_id);


--
-- Name: idx_fin_receitas_exercicio; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_receitas_exercicio ON public.fin_receitas USING btree (exercicio);


--
-- Name: idx_fin_receitas_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_receitas_tipo ON public.fin_receitas USING btree (tipo);


--
-- Name: idx_fin_solicitacao_itens_sol; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_solicitacao_itens_sol ON public.fin_solicitacao_itens USING btree (solicitacao_id);


--
-- Name: idx_fin_solicitacoes_exercicio; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_solicitacoes_exercicio ON public.fin_solicitacoes USING btree (exercicio);


--
-- Name: idx_fin_solicitacoes_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_solicitacoes_status ON public.fin_solicitacoes USING btree (status);


--
-- Name: idx_fin_solicitacoes_unidade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_solicitacoes_unidade ON public.fin_solicitacoes USING btree (unidade_solicitante_id);


--
-- Name: idx_fin_sub_empenhos_empenho; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_sub_empenhos_empenho ON public.fin_sub_empenhos USING btree (empenho_id);


--
-- Name: idx_fin_sub_empenhos_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_sub_empenhos_tipo ON public.fin_sub_empenhos USING btree (tipo);


--
-- Name: idx_folha_historico_status_folha_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_folha_historico_status_folha_id ON public.folha_historico_status USING btree (folha_id);


--
-- Name: idx_folhas_pagamento_competencia; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_folhas_pagamento_competencia ON public.folhas_pagamento USING btree (competencia_ano, competencia_mes);


--
-- Name: idx_folhas_pagamento_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_folhas_pagamento_status ON public.folhas_pagamento USING btree (status);


--
-- Name: idx_fornecedores_cpf_cnpj; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fornecedores_cpf_cnpj ON public.fornecedores USING btree (cpf_cnpj);


--
-- Name: idx_fotos_vistoria_inventario_bem; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fotos_vistoria_inventario_bem ON public.fotos_vistoria_inventario USING btree (bem_id) WHERE (bem_id IS NOT NULL);


--
-- Name: idx_fotos_vistoria_inventario_campanha_unidade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fotos_vistoria_inventario_campanha_unidade ON public.fotos_vistoria_inventario USING btree (campanha_id, unidade_local_id);


--
-- Name: idx_fotos_vistoria_inventario_capturada_em; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fotos_vistoria_inventario_capturada_em ON public.fotos_vistoria_inventario USING btree (capturada_em);


--
-- Name: idx_frequencia_arquivos_periodo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_frequencia_arquivos_periodo ON public.frequencia_arquivos USING btree (periodo);


--
-- Name: idx_frequencia_arquivos_servidor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_frequencia_arquivos_servidor ON public.frequencia_arquivos USING btree (servidor_id);


--
-- Name: idx_frequencia_arquivos_unidade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_frequencia_arquivos_unidade ON public.frequencia_arquivos USING btree (unidade_id);


--
-- Name: idx_frequencia_fechamento_competencia; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_frequencia_fechamento_competencia ON public.frequencia_fechamento USING btree (ano, mes);


--
-- Name: idx_frequencia_pacotes_link; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_frequencia_pacotes_link ON public.frequencia_pacotes USING btree (link_download);


--
-- Name: idx_frequencia_pacotes_periodo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_frequencia_pacotes_periodo ON public.frequencia_pacotes USING btree (periodo);


--
-- Name: idx_frequencia_pacotes_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_frequencia_pacotes_status ON public.frequencia_pacotes USING btree (status);


--
-- Name: idx_galeria_eventos_destaque; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_galeria_eventos_destaque ON public.galeria_eventos_esportivos USING btree (destaque) WHERE (destaque = true);


--
-- Name: idx_galeria_eventos_evento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_galeria_eventos_evento ON public.galeria_eventos_esportivos USING btree (evento);


--
-- Name: idx_galeria_eventos_modalidade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_galeria_eventos_modalidade ON public.galeria_eventos_esportivos USING btree (modalidade);


--
-- Name: idx_galeria_eventos_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_galeria_eventos_status ON public.galeria_eventos_esportivos USING btree (status);


--
-- Name: idx_gestores_escolares_cpf; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gestores_escolares_cpf ON public.gestores_escolares USING btree (cpf);


--
-- Name: idx_gestores_escolares_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gestores_escolares_email ON public.gestores_escolares USING btree (email);


--
-- Name: idx_gestores_escolares_responsavel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gestores_escolares_responsavel ON public.gestores_escolares USING btree (responsavel_id);


--
-- Name: idx_gestores_escolares_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gestores_escolares_status ON public.gestores_escolares USING btree (status);


--
-- Name: idx_gestores_historico_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gestores_historico_created ON public.gestores_escolares_historico USING btree (created_at DESC);


--
-- Name: idx_gestores_historico_gestor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gestores_historico_gestor ON public.gestores_escolares_historico USING btree (gestor_id);


--
-- Name: idx_gestores_historico_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gestores_historico_status ON public.gestores_escolares_historico USING btree (status_novo);


--
-- Name: idx_gestores_historico_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gestores_historico_usuario ON public.gestores_escolares_historico USING btree (usuario_id);


--
-- Name: idx_historico_conteudo_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_historico_conteudo_tipo ON public.historico_conteudo_oficial USING btree (tipo);


--
-- Name: idx_historico_conteudo_versao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_historico_conteudo_versao ON public.historico_conteudo_oficial USING btree (tipo, versao DESC);


--
-- Name: idx_historico_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_historico_data ON public.historico_funcional USING btree (data_evento);


--
-- Name: idx_historico_lai_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_historico_lai_created_at ON public.historico_lai USING btree (created_at DESC);


--
-- Name: idx_historico_lai_solicitacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_historico_lai_solicitacao ON public.historico_lai USING btree (solicitacao_id);


--
-- Name: idx_historico_lai_tipo_evento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_historico_lai_tipo_evento ON public.historico_lai USING btree (tipo_evento);


--
-- Name: idx_historico_patrimonio_bem; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_historico_patrimonio_bem ON public.historico_patrimonio USING btree (bem_id);


--
-- Name: idx_historico_patrimonio_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_historico_patrimonio_data ON public.historico_patrimonio USING btree (data_evento DESC);


--
-- Name: idx_historico_patrimonio_responsavel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_historico_patrimonio_responsavel ON public.historico_patrimonio USING btree (responsavel_id);


--
-- Name: idx_historico_patrimonio_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_historico_patrimonio_tipo ON public.historico_patrimonio USING btree (tipo_evento);


--
-- Name: idx_historico_patrimonio_unidade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_historico_patrimonio_unidade ON public.historico_patrimonio USING btree (unidade_local_id);


--
-- Name: idx_historico_reuniao_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_historico_reuniao_id ON public.historico_convites_reuniao USING btree (reuniao_id);


--
-- Name: idx_historico_servidor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_historico_servidor ON public.historico_funcional USING btree (servidor_id);


--
-- Name: idx_historico_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_historico_tipo ON public.historico_funcional USING btree (tipo);


--
-- Name: idx_importacoes_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_importacoes_hash ON public.importacoes USING btree (arquivo_sha256);


--
-- Name: idx_importacoes_tipo_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_importacoes_tipo_data ON public.importacoes USING btree (tipo, created_at DESC);


--
-- Name: idx_instituicoes_cnpj; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_instituicoes_cnpj ON public.instituicoes USING btree (cnpj) WHERE (cnpj IS NOT NULL);


--
-- Name: idx_instituicoes_nome; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_instituicoes_nome ON public.instituicoes USING btree (nome_razao_social);


--
-- Name: idx_instituicoes_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_instituicoes_status ON public.instituicoes USING btree (status);


--
-- Name: idx_instituicoes_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_instituicoes_tipo ON public.instituicoes USING btree (tipo_instituicao);


--
-- Name: idx_itens_ata_registro_preco_ata; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_itens_ata_registro_preco_ata ON public.itens_ata_registro_preco USING btree (ata_id);


--
-- Name: idx_itens_checklist; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_itens_checklist ON public.itens_checklist USING btree (checklist_id);


--
-- Name: idx_itens_contrato_contrato; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_itens_contrato_contrato ON public.itens_contrato USING btree (contrato_id);


--
-- Name: idx_itens_ficha_ficha_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_itens_ficha_ficha_id ON public.itens_ficha_financeira USING btree (ficha_id);


--
-- Name: idx_itens_material_categoria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_itens_material_categoria ON public.itens_material USING btree (categoria_id);


--
-- Name: idx_itens_processo_licitatorio_processo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_itens_processo_licitatorio_processo ON public.itens_processo_licitatorio USING btree (processo_id);


--
-- Name: idx_lancamentos_folha_ficha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lancamentos_folha_ficha ON public.lancamentos_folha USING btree (ficha_id);


--
-- Name: idx_lancamentos_folha_rubrica; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lancamentos_folha_rubrica ON public.lancamentos_folha USING btree (rubrica_id);


--
-- Name: idx_licencas_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_licencas_data ON public.licencas_afastamentos USING btree (data_inicio);


--
-- Name: idx_licencas_servidor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_licencas_servidor ON public.licencas_afastamentos USING btree (servidor_id);


--
-- Name: idx_liquidacoes_empenho; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_liquidacoes_empenho ON public.liquidacoes USING btree (empenho_id);


--
-- Name: idx_liquidacoes_medicao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_liquidacoes_medicao ON public.liquidacoes USING btree (medicao_id);


--
-- Name: idx_lotacoes_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lotacoes_ativo ON public.lotacoes USING btree (ativo);


--
-- Name: idx_lotacoes_servidor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lotacoes_servidor ON public.lotacoes USING btree (servidor_id);


--
-- Name: idx_lotacoes_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lotacoes_tipo ON public.lotacoes USING btree (tipo_lotacao);


--
-- Name: idx_lotacoes_unidade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lotacoes_unidade ON public.lotacoes USING btree (unidade_id);


--
-- Name: idx_manut_patrimonio_bem; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_manut_patrimonio_bem ON public.manutencoes_patrimonio USING btree (bem_id);


--
-- Name: idx_manut_patrimonio_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_manut_patrimonio_status ON public.manutencoes_patrimonio USING btree (status);


--
-- Name: idx_memorandos_lotacao_ano; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_memorandos_lotacao_ano ON public.memorandos_lotacao USING btree (ano);


--
-- Name: idx_memorandos_lotacao_lotacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_memorandos_lotacao_lotacao ON public.memorandos_lotacao USING btree (lotacao_id);


--
-- Name: idx_memorandos_lotacao_protocolo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_memorandos_lotacao_protocolo ON public.memorandos_lotacao USING btree (numero_protocolo);


--
-- Name: idx_memorandos_lotacao_servidor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_memorandos_lotacao_servidor ON public.memorandos_lotacao USING btree (servidor_id);


--
-- Name: idx_mov_patrimonio_bem; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mov_patrimonio_bem ON public.movimentacoes_patrimonio USING btree (bem_id);


--
-- Name: idx_mov_patrimonio_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mov_patrimonio_data ON public.movimentacoes_patrimonio USING btree (data_movimentacao);


--
-- Name: idx_mov_patrimonio_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mov_patrimonio_status ON public.movimentacoes_patrimonio USING btree (status);


--
-- Name: idx_movbem_bem; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movbem_bem ON public.movimentacoes_bem USING btree (bem_id);


--
-- Name: idx_movest_almox; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movest_almox ON public.movimentacoes_estoque USING btree (almoxarifado_id);


--
-- Name: idx_movest_item; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movest_item ON public.movimentacoes_estoque USING btree (item_id);


--
-- Name: idx_movimentacoes_destino; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movimentacoes_destino ON public.movimentacoes_processo USING btree (unidade_destino_id);


--
-- Name: idx_movimentacoes_prazo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movimentacoes_prazo ON public.movimentacoes_processo USING btree (prazo_limite);


--
-- Name: idx_movimentacoes_processo_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movimentacoes_processo_id ON public.movimentacoes_processo USING btree (processo_id);


--
-- Name: idx_movimentacoes_servidor_destino; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movimentacoes_servidor_destino ON public.movimentacoes_processo USING btree (servidor_destino_id);


--
-- Name: idx_movimentacoes_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movimentacoes_status ON public.movimentacoes_processo USING btree (status);


--
-- Name: idx_movimentacoes_unidade_destino; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movimentacoes_unidade_destino ON public.movimentacoes_patrimonio USING btree (unidade_local_destino_id);


--
-- Name: idx_movimentacoes_unidade_origem; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movimentacoes_unidade_origem ON public.movimentacoes_patrimonio USING btree (unidade_local_origem_id);


--
-- Name: idx_nomeacoes_servidor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nomeacoes_servidor ON public.nomeacoes_chefe_unidade USING btree (servidor_id);


--
-- Name: idx_nomeacoes_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nomeacoes_status ON public.nomeacoes_chefe_unidade USING btree (status);


--
-- Name: idx_nomeacoes_unidade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nomeacoes_unidade ON public.nomeacoes_chefe_unidade USING btree (unidade_local_id);


--
-- Name: idx_noticias_eventos_categoria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_noticias_eventos_categoria ON public.noticias_eventos_esportivos USING btree (categoria);


--
-- Name: idx_noticias_eventos_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_noticias_eventos_data ON public.noticias_eventos_esportivos USING btree (data_publicacao DESC);


--
-- Name: idx_noticias_eventos_destaque; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_noticias_eventos_destaque ON public.noticias_eventos_esportivos USING btree (destaque) WHERE (destaque = true);


--
-- Name: idx_noticias_eventos_evento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_noticias_eventos_evento ON public.noticias_eventos_esportivos USING btree (evento_relacionado);


--
-- Name: idx_noticias_eventos_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_noticias_eventos_status ON public.noticias_eventos_esportivos USING btree (status);


--
-- Name: idx_ocorr_patrimonio_bem; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ocorr_patrimonio_bem ON public.ocorrencias_patrimonio USING btree (bem_id);


--
-- Name: idx_ocorr_patrimonio_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ocorr_patrimonio_tipo ON public.ocorrencias_patrimonio USING btree (tipo);


--
-- Name: idx_pagamentos_liquidacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagamentos_liquidacao ON public.pagamentos USING btree (liquidacao_id);


--
-- Name: idx_parametros_folha_vigencia; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_parametros_folha_vigencia ON public.parametros_folha USING btree (tipo_parametro, vigencia_inicio, vigencia_fim);


--
-- Name: idx_pareceres_ano; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pareceres_ano ON public.pareceres_tecnicos USING btree (ano);


--
-- Name: idx_pareceres_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pareceres_tipo ON public.pareceres_tecnicos USING btree (tipo);


--
-- Name: idx_participantes_reuniao_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_participantes_reuniao_id ON public.participantes_reuniao USING btree (reuniao_id);


--
-- Name: idx_participantes_servidor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_participantes_servidor_id ON public.participantes_reuniao USING btree (servidor_id);


--
-- Name: idx_patrimonio_unidade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patrimonio_unidade ON public.patrimonio_unidade USING btree (unidade_local_id);


--
-- Name: idx_pensoes_alimenticias_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pensoes_alimenticias_ativo ON public.pensoes_alimenticias USING btree (ativo);


--
-- Name: idx_pensoes_alimenticias_servidor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pensoes_alimenticias_servidor ON public.pensoes_alimenticias USING btree (servidor_id);


--
-- Name: idx_planos_risco; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planos_risco ON public.planos_tratamento_risco USING btree (risco_id);


--
-- Name: idx_planos_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planos_status ON public.planos_tratamento_risco USING btree (status);


--
-- Name: idx_ponto_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ponto_data ON public.registros_ponto USING btree (data);


--
-- Name: idx_ponto_servidor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ponto_servidor ON public.registros_ponto USING btree (servidor_id);


--
-- Name: idx_ponto_servidor_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ponto_servidor_data ON public.registros_ponto USING btree (servidor_id, data);


--
-- Name: idx_ponto_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ponto_status ON public.registros_ponto USING btree (status);


--
-- Name: idx_portal_diretoria_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_portal_diretoria_ativo ON public.portal_diretoria USING btree (ativo) WHERE (ativo = true);


--
-- Name: idx_portal_diretoria_ordem; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_portal_diretoria_ordem ON public.portal_diretoria USING btree (ordem_exibicao);


--
-- Name: idx_portarias_numero; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_portarias_numero ON public.portarias_servidor USING btree (numero, ano);


--
-- Name: idx_portarias_servidor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_portarias_servidor ON public.portarias_servidor USING btree (servidor_id);


--
-- Name: idx_portarias_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_portarias_tipo ON public.portarias_servidor USING btree (tipo);


--
-- Name: idx_prazos_cumprido; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prazos_cumprido ON public.prazos_processo USING btree (cumprido);


--
-- Name: idx_prazos_data_limite; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prazos_data_limite ON public.prazos_processo USING btree (data_limite);


--
-- Name: idx_prazos_processo_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prazos_processo_id ON public.prazos_processo USING btree (processo_id);


--
-- Name: idx_pre_cadastros_codigo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pre_cadastros_codigo ON public.pre_cadastros USING btree (codigo_acesso);


--
-- Name: idx_pre_cadastros_cpf; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pre_cadastros_cpf ON public.pre_cadastros USING btree (cpf);


--
-- Name: idx_pre_cadastros_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pre_cadastros_created ON public.pre_cadastros USING btree (created_at DESC);


--
-- Name: idx_pre_cadastros_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pre_cadastros_status ON public.pre_cadastros USING btree (status);


--
-- Name: idx_processos_admin_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_processos_admin_data ON public.processos_administrativos USING btree (data_abertura);


--
-- Name: idx_processos_admin_sigilo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_processos_admin_sigilo ON public.processos_administrativos USING btree (sigilo);


--
-- Name: idx_processos_admin_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_processos_admin_status ON public.processos_administrativos USING btree (status);


--
-- Name: idx_processos_admin_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_processos_admin_tipo ON public.processos_administrativos USING btree (tipo_processo);


--
-- Name: idx_processos_admin_unidade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_processos_admin_unidade ON public.processos_administrativos USING btree (unidade_origem_id);


--
-- Name: idx_processos_lic_fase; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_processos_lic_fase ON public.processos_licitatorios USING btree (fase_atual);


--
-- Name: idx_processos_lic_numero; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_processos_lic_numero ON public.processos_licitatorios USING btree (numero_processo);


--
-- Name: idx_profiles_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_active ON public.profiles USING btree (id) WHERE (is_active = true);


--
-- Name: idx_profiles_cpf; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_cpf ON public.profiles USING btree (cpf);


--
-- Name: idx_profiles_cpf_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_profiles_cpf_unique ON public.profiles USING btree (cpf) WHERE (cpf IS NOT NULL);


--
-- Name: idx_profiles_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_is_active ON public.profiles USING btree (is_active);


--
-- Name: idx_profiles_restringir_modulos; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_restringir_modulos ON public.profiles USING btree (id) WHERE (restringir_modulos = true);


--
-- Name: idx_profiles_servidor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_servidor_id ON public.profiles USING btree (servidor_id);


--
-- Name: idx_profiles_tipo_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_tipo_usuario ON public.profiles USING btree (tipo_usuario);


--
-- Name: idx_programas_situacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_programas_situacao ON public.programas USING btree (situacao);


--
-- Name: idx_propostas_licitacao_fornecedor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_propostas_licitacao_fornecedor ON public.propostas_licitacao USING btree (fornecedor_id);


--
-- Name: idx_propostas_licitacao_processo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_propostas_licitacao_processo ON public.propostas_licitacao USING btree (processo_id);


--
-- Name: idx_provimentos_cargo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_provimentos_cargo ON public.provimentos USING btree (cargo_id);


--
-- Name: idx_provimentos_servidor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_provimentos_servidor ON public.provimentos USING btree (servidor_id);


--
-- Name: idx_provimentos_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_provimentos_status ON public.provimentos USING btree (status) WHERE (status = 'ativo'::public.status_provimento);


--
-- Name: idx_raci_atribuicoes_papel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_raci_atribuicoes_papel ON public.matriz_raci_atribuicoes USING btree (papel_id);


--
-- Name: idx_raci_atribuicoes_processo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_raci_atribuicoes_processo ON public.matriz_raci_atribuicoes USING btree (processo_id);


--
-- Name: idx_recursos_lai_prazo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recursos_lai_prazo ON public.recursos_lai USING btree (prazo_resposta);


--
-- Name: idx_recursos_lai_solicitacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recursos_lai_solicitacao ON public.recursos_lai USING btree (solicitacao_id);


--
-- Name: idx_recursos_lai_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recursos_lai_status ON public.recursos_lai USING btree (status);


--
-- Name: idx_regimes_trabalho_instituicao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_regimes_trabalho_instituicao ON public.regimes_trabalho USING btree (instituicao_id);


--
-- Name: idx_remessas_folha_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_remessas_folha_id ON public.remessas_bancarias USING btree (folha_id);


--
-- Name: idx_remessas_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_remessas_status ON public.remessas_bancarias USING btree (status);


--
-- Name: idx_respostas_exercicio; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_respostas_exercicio ON public.respostas_checklist USING btree (exercicio);


--
-- Name: idx_respostas_item; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_respostas_item ON public.respostas_checklist USING btree (item_id);


--
-- Name: idx_retornos_remessa_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_retornos_remessa_id ON public.retornos_bancarios USING btree (remessa_id);


--
-- Name: idx_reunioes_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reunioes_data ON public.reunioes USING btree (data_reuniao);


--
-- Name: idx_reunioes_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reunioes_status ON public.reunioes USING btree (status);


--
-- Name: idx_reunioes_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reunioes_tipo ON public.reunioes USING btree (tipo);


--
-- Name: idx_riscos_modulo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_riscos_modulo ON public.riscos_institucionais USING btree (modulo_afetado);


--
-- Name: idx_riscos_responsavel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_riscos_responsavel ON public.riscos_institucionais USING btree (responsavel_id);


--
-- Name: idx_riscos_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_riscos_status ON public.riscos_institucionais USING btree (status);


--
-- Name: idx_role_permissions_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_role_permissions_role ON public.role_permissions USING btree (role);


--
-- Name: idx_rubricas_codigo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rubricas_codigo ON public.rubricas USING btree (codigo);


--
-- Name: idx_rubricas_historico_rubrica; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rubricas_historico_rubrica ON public.rubricas_historico USING btree (rubrica_id, versao DESC);


--
-- Name: idx_rubricas_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rubricas_tipo ON public.rubricas USING btree (tipo);


--
-- Name: idx_rubricas_vigencia; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rubricas_vigencia ON public.rubricas USING btree (vigencia_inicio, vigencia_fim);


--
-- Name: idx_servidor_regime_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_servidor_regime_ativo ON public.servidor_regime USING btree (servidor_id, ativo) WHERE (ativo = true);


--
-- Name: idx_servidor_tag_vinculos_servidor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_servidor_tag_vinculos_servidor ON public.servidor_tag_vinculos USING btree (servidor_id);


--
-- Name: idx_servidor_tag_vinculos_tag; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_servidor_tag_vinculos_tag ON public.servidor_tag_vinculos USING btree (tag_id);


--
-- Name: idx_servidores_cargo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_servidores_cargo ON public.servidores USING btree (cargo_atual_id);


--
-- Name: idx_servidores_codigo_interno; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_servidores_codigo_interno ON public.servidores USING btree (codigo_interno);


--
-- Name: idx_servidores_cpf; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_servidores_cpf ON public.servidores USING btree (cpf);


--
-- Name: idx_servidores_matricula; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_servidores_matricula ON public.servidores USING btree (matricula);


--
-- Name: idx_servidores_nome; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_servidores_nome ON public.servidores USING btree (nome_completo);


--
-- Name: idx_servidores_possui_vinculo_externo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_servidores_possui_vinculo_externo ON public.servidores USING btree (possui_vinculo_externo) WHERE (possui_vinculo_externo = true);


--
-- Name: idx_servidores_situacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_servidores_situacao ON public.servidores USING btree (situacao);


--
-- Name: idx_servidores_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_servidores_tipo ON public.servidores USING btree (tipo_servidor);


--
-- Name: idx_servidores_unidade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_servidores_unidade ON public.servidores USING btree (unidade_atual_id);


--
-- Name: idx_servidores_vinculo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_servidores_vinculo ON public.servidores USING btree (vinculo);


--
-- Name: idx_servidores_vinculo_externo_ato; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_servidores_vinculo_externo_ato ON public.servidores USING btree (vinculo_externo_ato_id) WHERE (vinculo_externo_ato_id IS NOT NULL);


--
-- Name: idx_sic_protocolo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sic_protocolo ON public.solicitacoes_sic USING btree (protocolo);


--
-- Name: idx_sic_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sic_status ON public.solicitacoes_sic USING btree (status);


--
-- Name: idx_solicitacoes_abono_servidor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_solicitacoes_abono_servidor ON public.solicitacoes_abono USING btree (servidor_id, status);


--
-- Name: idx_solicitacoes_abono_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_solicitacoes_abono_status ON public.solicitacoes_abono USING btree (status, created_at DESC);


--
-- Name: idx_solicitacoes_servidor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_solicitacoes_servidor ON public.solicitacoes_ajuste_ponto USING btree (servidor_id);


--
-- Name: idx_solicitacoes_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_solicitacoes_status ON public.solicitacoes_ajuste_ponto USING btree (status);


--
-- Name: idx_tabela_inss_vigencia; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tabela_inss_vigencia ON public.tabela_inss USING btree (vigencia_inicio, vigencia_fim, faixa_ordem);


--
-- Name: idx_tabela_irrf_vigencia; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tabela_irrf_vigencia ON public.tabela_irrf USING btree (vigencia_inicio, vigencia_fim, faixa_ordem);


--
-- Name: idx_termos_unidade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_termos_unidade ON public.termos_cessao USING btree (unidade_local_id);


--
-- Name: idx_tipos_abono_instituicao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tipos_abono_instituicao ON public.tipos_abono USING btree (instituicao_id);


--
-- Name: idx_unidades_locais_codigo; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_unidades_locais_codigo ON public.unidades_locais USING btree (codigo_unidade) WHERE (codigo_unidade IS NOT NULL);


--
-- Name: idx_unidades_locais_municipio; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unidades_locais_municipio ON public.unidades_locais USING btree (municipio);


--
-- Name: idx_unidades_locais_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unidades_locais_status ON public.unidades_locais USING btree (status);


--
-- Name: idx_unidades_locais_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unidades_locais_tipo ON public.unidades_locais USING btree (tipo_unidade);


--
-- Name: idx_user_modules_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_modules_lookup ON public.user_modules USING btree (user_id, module);


--
-- Name: idx_user_permissions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_permissions_user ON public.user_permissions USING btree (user_id);


--
-- Name: idx_user_primary_org_unit; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_user_primary_org_unit ON public.user_org_units USING btree (user_id) WHERE (is_primary = true);


--
-- Name: idx_user_roles_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_lookup ON public.user_roles USING btree (user_id, role);


--
-- Name: idx_usuario_modulos_modulo_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usuario_modulos_modulo_id ON public._backup_usuario_modulos_old USING btree (modulo_id);


--
-- Name: idx_usuario_modulos_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usuario_modulos_user_id ON public._backup_usuario_modulos_old USING btree (user_id) WHERE (ativo = true);


--
-- Name: idx_viagens_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_viagens_data ON public.viagens_diarias USING btree (data_saida);


--
-- Name: idx_viagens_servidor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_viagens_servidor ON public.viagens_diarias USING btree (servidor_id);


--
-- Name: idx_vinc_serv_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vinc_serv_ativo ON public.vinculos_servidor USING btree (servidor_id, ativo) WHERE (ativo = true);


--
-- Name: idx_vinc_serv_servidor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vinc_serv_servidor ON public.vinculos_servidor USING btree (servidor_id);


--
-- Name: idx_vinc_serv_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vinc_serv_tipo ON public.vinculos_servidor USING btree (tipo);


--
-- Name: itens_ficha_financeira_ficha_referencia_desconto_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX itens_ficha_financeira_ficha_referencia_desconto_uidx ON public.itens_ficha_financeira USING btree (ficha_id, lower(referencia)) WHERE (((tipo)::text = 'desconto'::text) AND (referencia IS NOT NULL));


--
-- Name: acoes audit_acoes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_acoes AFTER INSERT OR DELETE OR UPDATE ON public.acoes FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();


--
-- Name: avaliacoes_controle audit_avaliacoes_controle; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_avaliacoes_controle AFTER INSERT OR DELETE OR UPDATE ON public.avaliacoes_controle FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();


--
-- Name: avaliacoes_risco audit_avaliacoes_risco; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_avaliacoes_risco AFTER INSERT OR DELETE OR UPDATE ON public.avaliacoes_risco FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();


--
-- Name: banco_horas audit_banco_horas; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_banco_horas AFTER INSERT OR DELETE OR UPDATE ON public.banco_horas FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger('rh');


--
-- Name: bens_patrimoniais audit_bens; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_bens AFTER INSERT OR DELETE OR UPDATE ON public.bens_patrimoniais FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();


--
-- Name: checklists_conformidade audit_checklists_conformidade; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_checklists_conformidade AFTER INSERT OR DELETE OR UPDATE ON public.checklists_conformidade FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();


--
-- Name: consignacoes audit_consignacoes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_consignacoes AFTER INSERT OR DELETE OR UPDATE ON public.consignacoes FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger('rh');


--
-- Name: controles_internos audit_controles_internos; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_controles_internos AFTER INSERT OR DELETE OR UPDATE ON public.controles_internos FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();


--
-- Name: decisoes_administrativas audit_decisoes_administrativas; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_decisoes_administrativas AFTER INSERT OR DELETE OR UPDATE ON public.decisoes_administrativas FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();


--
-- Name: designacoes audit_designacoes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_designacoes AFTER INSERT OR DELETE OR UPDATE ON public.designacoes FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger('rh');


--
-- Name: despachos audit_despachos; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_despachos AFTER INSERT OR DELETE OR UPDATE ON public.despachos FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();


--
-- Name: documentos_processo audit_documentos_processo; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_documentos_processo AFTER INSERT OR DELETE OR UPDATE ON public.documentos_processo FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();


--
-- Name: dotacoes_orcamentarias audit_dotacoes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_dotacoes AFTER INSERT OR DELETE OR UPDATE ON public.dotacoes_orcamentarias FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();


--
-- Name: empenhos audit_empenhos; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_empenhos AFTER INSERT OR DELETE OR UPDATE ON public.empenhos FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();


--
-- Name: encaminhamentos audit_encaminhamentos; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_encaminhamentos AFTER INSERT OR DELETE OR UPDATE ON public.encaminhamentos FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();


--
-- Name: evidencias_controle audit_evidencias_controle; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_evidencias_controle AFTER INSERT OR DELETE OR UPDATE ON public.evidencias_controle FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();


--
-- Name: ferias_servidor audit_ferias_servidor; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_ferias_servidor AFTER INSERT OR DELETE OR UPDATE ON public.ferias_servidor FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger('rh');


--
-- Name: folhas_pagamento audit_folhas_pagamento; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_folhas_pagamento AFTER INSERT OR DELETE OR UPDATE ON public.folhas_pagamento FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger('rh');


--
-- Name: frequencia_mensal audit_frequencia_mensal; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_frequencia_mensal AFTER INSERT OR DELETE OR UPDATE ON public.frequencia_mensal FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger('rh');


--
-- Name: historico_funcional audit_historico_funcional; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_historico_funcional AFTER INSERT OR DELETE OR UPDATE ON public.historico_funcional FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger('rh');


--
-- Name: itens_checklist audit_itens_checklist; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_itens_checklist AFTER INSERT OR DELETE OR UPDATE ON public.itens_checklist FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();


--
-- Name: itens_ficha_financeira audit_itens_ficha_financeira; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_itens_ficha_financeira AFTER INSERT OR DELETE OR UPDATE ON public.itens_ficha_financeira FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger('rh');


--
-- Name: licencas_afastamentos audit_licencas_afastamentos; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_licencas_afastamentos AFTER INSERT OR DELETE OR UPDATE ON public.licencas_afastamentos FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger('rh');


--
-- Name: liquidacoes audit_liquidacoes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_liquidacoes AFTER INSERT OR DELETE OR UPDATE ON public.liquidacoes FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();


--
-- Name: lotacoes audit_lotacoes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_lotacoes AFTER INSERT OR DELETE OR UPDATE ON public.lotacoes FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger('rh');


--
-- Name: matriz_raci_atribuicoes audit_matriz_raci_atribuicoes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_matriz_raci_atribuicoes AFTER INSERT OR DELETE OR UPDATE ON public.matriz_raci_atribuicoes FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();


--
-- Name: matriz_raci_papeis audit_matriz_raci_papeis; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_matriz_raci_papeis AFTER INSERT OR DELETE OR UPDATE ON public.matriz_raci_papeis FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();


--
-- Name: matriz_raci_processos audit_matriz_raci_processos; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_matriz_raci_processos AFTER INSERT OR DELETE OR UPDATE ON public.matriz_raci_processos FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();


--
-- Name: movimentacoes_bem audit_movimentacoes_bem; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_movimentacoes_bem AFTER INSERT OR DELETE OR UPDATE ON public.movimentacoes_bem FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();


--
-- Name: movimentacoes_estoque audit_movimentacoes_estoque; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_movimentacoes_estoque AFTER INSERT OR DELETE OR UPDATE ON public.movimentacoes_estoque FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();


--
-- Name: movimentacoes_processo audit_movimentacoes_processo; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_movimentacoes_processo AFTER INSERT OR DELETE OR UPDATE ON public.movimentacoes_processo FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();


--
-- Name: nomeacoes_chefe_unidade audit_nomeacoes_chefe_unidade; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_nomeacoes_chefe_unidade AFTER INSERT OR DELETE OR UPDATE ON public.nomeacoes_chefe_unidade FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger('rh');


--
-- Name: pagamentos audit_pagamentos; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_pagamentos AFTER INSERT OR DELETE OR UPDATE ON public.pagamentos FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();


--
-- Name: pareceres_tecnicos audit_pareceres_tecnicos; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_pareceres_tecnicos AFTER INSERT OR DELETE OR UPDATE ON public.pareceres_tecnicos FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();


--
-- Name: planos_tratamento_risco audit_planos_tratamento_risco; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_planos_tratamento_risco AFTER INSERT OR DELETE OR UPDATE ON public.planos_tratamento_risco FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();


--
-- Name: prazos_processo audit_prazos_processo; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_prazos_processo AFTER INSERT OR DELETE OR UPDATE ON public.prazos_processo FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();


--
-- Name: processos_administrativos audit_processos_administrativos; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_processos_administrativos AFTER INSERT OR DELETE OR UPDATE ON public.processos_administrativos FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();


--
-- Name: programas audit_programas; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_programas AFTER INSERT OR DELETE OR UPDATE ON public.programas FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();


--
-- Name: provimentos audit_provimentos; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_provimentos AFTER INSERT OR DELETE OR UPDATE ON public.provimentos FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger('rh');


--
-- Name: registros_ponto audit_registros_ponto; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_registros_ponto AFTER INSERT OR DELETE OR UPDATE ON public.registros_ponto FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger('rh');


--
-- Name: respostas_checklist audit_respostas_checklist; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_respostas_checklist AFTER INSERT OR DELETE OR UPDATE ON public.respostas_checklist FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();


--
-- Name: riscos_institucionais audit_riscos_institucionais; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_riscos_institucionais AFTER INSERT OR DELETE OR UPDATE ON public.riscos_institucionais FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();


--
-- Name: servidores audit_servidores; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_servidores AFTER INSERT OR DELETE OR UPDATE ON public.servidores FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger('rh');


--
-- Name: user_modules audit_user_modules; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_user_modules AFTER INSERT OR DELETE OR UPDATE ON public.user_modules FOR EACH ROW EXECUTE FUNCTION public.audit_permission_changes();


--
-- Name: user_roles audit_user_roles; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_user_roles AFTER INSERT OR DELETE OR UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.audit_permission_changes();


--
-- Name: viagens_diarias audit_viagens_diarias; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_viagens_diarias AFTER INSERT OR DELETE OR UPDATE ON public.viagens_diarias FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger('rh');


--
-- Name: folhas_pagamento folhas_proteger_fechamento; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER folhas_proteger_fechamento BEFORE UPDATE ON public.folhas_pagamento FOR EACH ROW EXECUTE FUNCTION public.folhas_proteger_fechamento();


--
-- Name: acoes handle_acoes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_acoes_updated_at BEFORE UPDATE ON public.acoes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: bens_patrimoniais handle_bens_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_bens_updated_at BEFORE UPDATE ON public.bens_patrimoniais FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: dotacoes_orcamentarias handle_dotacoes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_dotacoes_updated_at BEFORE UPDATE ON public.dotacoes_orcamentarias FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: empenhos handle_empenhos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_empenhos_updated_at BEFORE UPDATE ON public.empenhos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: itens_material handle_itens_material_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_itens_material_updated_at BEFORE UPDATE ON public.itens_material FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: liquidacoes handle_liquidacoes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_liquidacoes_updated_at BEFORE UPDATE ON public.liquidacoes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: programas handle_programas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_programas_updated_at BEFORE UPDATE ON public.programas FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: despachos handle_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.despachos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: documentos_processo handle_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.documentos_processo FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: movimentacoes_processo handle_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.movimentacoes_processo FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: prazos_processo handle_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.prazos_processo FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: processos_administrativos handle_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.processos_administrativos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: config_paginas_publicas log_alteracao_pagina_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER log_alteracao_pagina_trigger AFTER UPDATE ON public.config_paginas_publicas FOR EACH ROW EXECUTE FUNCTION public.log_alteracao_pagina();


--
-- Name: profiles profiles_proteger_colunas; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER profiles_proteger_colunas BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.profiles_proteger_colunas();


--
-- Name: config_assinatura_frequencia set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.config_assinatura_frequencia FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: config_compensacao set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.config_compensacao FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: config_fechamento_frequencia set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.config_fechamento_frequencia FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: config_jornada_padrao set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.config_jornada_padrao FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: frequencia_fechamento set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.frequencia_fechamento FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: regimes_trabalho set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.regimes_trabalho FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: servidor_regime set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.servidor_regime FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: solicitacoes_abono set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.solicitacoes_abono FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: tipos_abono set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.tipos_abono FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: dias_nao_uteis set_updated_at_dias_nao_uteis; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at_dias_nao_uteis BEFORE UPDATE ON public.dias_nao_uteis FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: vinculos_servidor set_vinculos_servidor_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_vinculos_servidor_updated_at BEFORE UPDATE ON public.vinculos_servidor FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: despachos tr_audit_despachos; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_audit_despachos AFTER INSERT OR DELETE OR UPDATE ON public.despachos FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();


--
-- Name: gestores_escolares tr_audit_gestores_escolares; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_audit_gestores_escolares AFTER INSERT OR UPDATE ON public.gestores_escolares FOR EACH ROW EXECUTE FUNCTION public.fn_audit_gestores_escolares();


--
-- Name: movimentacoes_processo tr_audit_movimentacoes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_audit_movimentacoes AFTER INSERT OR DELETE OR UPDATE ON public.movimentacoes_processo FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();


--
-- Name: processos_administrativos tr_audit_processos; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_audit_processos AFTER INSERT OR DELETE OR UPDATE ON public.processos_administrativos FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();


--
-- Name: debitos_tecnicos tr_debitos_tecnicos_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_debitos_tecnicos_updated BEFORE UPDATE ON public.debitos_tecnicos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: solicitacoes_sic tr_definir_prazo_lai; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_definir_prazo_lai BEFORE INSERT ON public.solicitacoes_sic FOR EACH ROW EXECUTE FUNCTION public.definir_prazo_lai_correto();


--
-- Name: unidades_locais tr_gerar_codigo_unidade_local; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_gerar_codigo_unidade_local BEFORE INSERT ON public.unidades_locais FOR EACH ROW WHEN (((new.codigo_unidade IS NULL) OR ((new.codigo_unidade)::text = ''::text))) EXECUTE FUNCTION public.gerar_codigo_unidade_local();


--
-- Name: demandas_ascom tr_gerar_numero_demanda_ascom; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_gerar_numero_demanda_ascom BEFORE INSERT ON public.demandas_ascom FOR EACH ROW WHEN ((new.numero_demanda IS NULL)) EXECUTE FUNCTION public.gerar_numero_demanda_ascom();


--
-- Name: processos_administrativos tr_gerar_numero_processo; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_gerar_numero_processo BEFORE INSERT ON public.processos_administrativos FOR EACH ROW WHEN (((new.numero_processo IS NULL) OR (new.numero_processo = ''::text))) EXECUTE FUNCTION public.gerar_numero_processo();


--
-- Name: patrimonio_unidade tr_gerar_numero_tombo_patrimonio; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_gerar_numero_tombo_patrimonio BEFORE INSERT ON public.patrimonio_unidade FOR EACH ROW WHEN (((new.numero_tombo IS NULL) OR (new.numero_tombo = ''::text))) EXECUTE FUNCTION public.gerar_numero_tombo_patrimonio();


--
-- Name: demandas_ascom tr_historico_demanda_ascom; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_historico_demanda_ascom BEFORE UPDATE ON public.demandas_ascom FOR EACH ROW EXECUTE FUNCTION public.registrar_historico_demanda_ascom();


--
-- Name: solicitacoes_sic tr_historico_lai; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_historico_lai AFTER INSERT OR UPDATE ON public.solicitacoes_sic FOR EACH ROW EXECUTE FUNCTION public.registrar_historico_lai();


--
-- Name: manutencoes_patrimonio tr_historico_manutencao; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_historico_manutencao AFTER INSERT OR UPDATE ON public.manutencoes_patrimonio FOR EACH ROW EXECUTE FUNCTION public.registrar_historico_manutencao();


--
-- Name: movimentacoes_patrimonio tr_historico_movimentacao; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_historico_movimentacao AFTER INSERT OR UPDATE ON public.movimentacoes_patrimonio FOR EACH ROW EXECUTE FUNCTION public.registrar_historico_movimentacao();


--
-- Name: bens_patrimoniais tr_historico_patrimonio; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_historico_patrimonio AFTER INSERT OR UPDATE ON public.bens_patrimoniais FOR EACH ROW EXECUTE FUNCTION public.registrar_historico_patrimonio();


--
-- Name: despachos tr_numerar_despacho; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_numerar_despacho BEFORE INSERT ON public.despachos FOR EACH ROW WHEN (((new.numero_despacho IS NULL) OR (new.numero_despacho = 0))) EXECUTE FUNCTION public.numerar_despacho();


--
-- Name: movimentacoes_processo tr_numerar_movimentacao; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_numerar_movimentacao BEFORE INSERT ON public.movimentacoes_processo FOR EACH ROW WHEN (((new.numero_sequencial IS NULL) OR (new.numero_sequencial = 0))) EXECUTE FUNCTION public.numerar_movimentacao();


--
-- Name: prazos_lai tr_prazos_lai_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_prazos_lai_updated BEFORE UPDATE ON public.prazos_lai FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: recursos_lai tr_recursos_lai_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_recursos_lai_updated BEFORE UPDATE ON public.recursos_lai FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: reunioes tr_set_reuniao_created_by; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_set_reuniao_created_by BEFORE INSERT ON public.reunioes FOR EACH ROW EXECUTE FUNCTION public.set_reuniao_created_by();


--
-- Name: despachos tr_updated_at_despachos; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_updated_at_despachos BEFORE UPDATE ON public.despachos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: documentos_processo tr_updated_at_documentos_processo; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_updated_at_documentos_processo BEFORE UPDATE ON public.documentos_processo FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: movimentacoes_processo tr_updated_at_movimentacoes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_updated_at_movimentacoes BEFORE UPDATE ON public.movimentacoes_processo FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: prazos_processo tr_updated_at_prazos_processo; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_updated_at_prazos_processo BEFORE UPDATE ON public.prazos_processo FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: processos_administrativos tr_updated_at_processos; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_updated_at_processos BEFORE UPDATE ON public.processos_administrativos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: processos_administrativos tr_validar_arquivamento; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_validar_arquivamento BEFORE UPDATE ON public.processos_administrativos FOR EACH ROW EXECUTE FUNCTION public.fn_validar_arquivamento_processo();


--
-- Name: processos_administrativos tr_verificar_arquivamento; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_verificar_arquivamento BEFORE UPDATE ON public.processos_administrativos FOR EACH ROW EXECUTE FUNCTION public.verificar_arquivamento_processo();


--
-- Name: demandas_ascom tr_verificar_autorizacao_presidencia; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_verificar_autorizacao_presidencia BEFORE INSERT OR UPDATE ON public.demandas_ascom FOR EACH ROW EXECUTE FUNCTION public.verificar_autorizacao_presidencia_ascom();


--
-- Name: approval_requests trg_approval_status_history; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_approval_status_history BEFORE UPDATE ON public.approval_requests FOR EACH ROW EXECUTE FUNCTION public.update_approval_status_history();


--
-- Name: fin_liquidacoes trg_atualizar_empenho_liquidacao; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_atualizar_empenho_liquidacao AFTER INSERT OR UPDATE OF status ON public.fin_liquidacoes FOR EACH ROW EXECUTE FUNCTION public.fn_atualizar_empenho_liquidacao();


--
-- Name: fin_pagamentos trg_atualizar_empenho_pagamento; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_atualizar_empenho_pagamento AFTER INSERT OR UPDATE OF status ON public.fin_pagamentos FOR EACH ROW EXECUTE FUNCTION public.fn_atualizar_empenho_pagamento();


--
-- Name: coletas_inventario trg_atualizar_estatisticas_campanha; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_atualizar_estatisticas_campanha AFTER INSERT OR DELETE OR UPDATE ON public.coletas_inventario FOR EACH ROW EXECUTE FUNCTION public.fn_atualizar_estatisticas_campanha();


--
-- Name: medicoes_contrato trg_atualizar_saldo_contrato; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_atualizar_saldo_contrato AFTER INSERT OR DELETE OR UPDATE ON public.medicoes_contrato FOR EACH ROW EXECUTE FUNCTION public.atualizar_saldo_contrato();


--
-- Name: fin_empenhos trg_atualizar_saldo_empenho; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_atualizar_saldo_empenho AFTER INSERT OR DELETE OR UPDATE OF valor_empenhado ON public.fin_empenhos FOR EACH ROW EXECUTE FUNCTION public.fn_atualizar_saldo_dotacao_empenho();


--
-- Name: aditivos_contrato trg_audit_aditivos_contrato; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_audit_aditivos_contrato AFTER INSERT OR DELETE OR UPDATE ON public.aditivos_contrato FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();


--
-- Name: atas_registro_preco trg_audit_atas_registro_preco; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_audit_atas_registro_preco AFTER INSERT OR DELETE OR UPDATE ON public.atas_registro_preco FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();


--
-- Name: contratos trg_audit_contratos; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_audit_contratos AFTER INSERT OR DELETE OR UPDATE ON public.contratos FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();


--
-- Name: documentos_preparatorios_licitacao trg_audit_docs_preparatorios; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_audit_docs_preparatorios AFTER INSERT OR DELETE OR UPDATE ON public.documentos_preparatorios_licitacao FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();


--
-- Name: fin_empenhos trg_audit_empenhos; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_audit_empenhos AFTER INSERT OR DELETE OR UPDATE ON public.fin_empenhos FOR EACH ROW EXECUTE FUNCTION public.fn_audit_financeiro();


--
-- Name: fornecedores trg_audit_fornecedores; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_audit_fornecedores AFTER INSERT OR DELETE OR UPDATE ON public.fornecedores FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();


--
-- Name: itens_ata_registro_preco trg_audit_itens_ata_registro_preco; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_audit_itens_ata_registro_preco AFTER INSERT OR DELETE OR UPDATE ON public.itens_ata_registro_preco FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();


--
-- Name: itens_contrato trg_audit_itens_contrato; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_audit_itens_contrato AFTER INSERT OR DELETE OR UPDATE ON public.itens_contrato FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();


--
-- Name: itens_licitacao trg_audit_itens_licitacao; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_audit_itens_licitacao AFTER INSERT OR DELETE OR UPDATE ON public.itens_licitacao FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();


--
-- Name: itens_processo_licitatorio trg_audit_itens_processo_licitatorio; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_audit_itens_processo_licitatorio AFTER INSERT OR DELETE OR UPDATE ON public.itens_processo_licitatorio FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();


--
-- Name: fin_liquidacoes trg_audit_liquidacoes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_audit_liquidacoes AFTER INSERT OR DELETE OR UPDATE ON public.fin_liquidacoes FOR EACH ROW EXECUTE FUNCTION public.fn_audit_financeiro();


--
-- Name: medicoes_contrato trg_audit_medicoes_contrato; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_audit_medicoes_contrato AFTER INSERT OR DELETE OR UPDATE ON public.medicoes_contrato FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();


--
-- Name: fin_pagamentos trg_audit_pagamentos; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_audit_pagamentos AFTER INSERT OR DELETE OR UPDATE ON public.fin_pagamentos FOR EACH ROW EXECUTE FUNCTION public.fn_audit_financeiro();


--
-- Name: config_parametros_valores trg_audit_parametros; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_audit_parametros AFTER INSERT OR DELETE OR UPDATE ON public.config_parametros_valores FOR EACH ROW EXECUTE FUNCTION public.fn_audit_parametros();


--
-- Name: processos_licitatorios trg_audit_processos_licitatorios; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_audit_processos_licitatorios AFTER INSERT OR DELETE OR UPDATE ON public.processos_licitatorios FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();


--
-- Name: propostas_licitacao trg_audit_propostas_licitacao; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_audit_propostas_licitacao AFTER INSERT OR DELETE OR UPDATE ON public.propostas_licitacao FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();


--
-- Name: publicacoes_lai trg_audit_publicacoes_lai; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_audit_publicacoes_lai AFTER INSERT OR DELETE OR UPDATE ON public.publicacoes_lai FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();


--
-- Name: publicacoes_legais trg_audit_publicacoes_legais; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_audit_publicacoes_legais AFTER INSERT OR DELETE OR UPDATE ON public.publicacoes_legais FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();


--
-- Name: avisos trg_avisos_autoria; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_avisos_autoria BEFORE INSERT OR UPDATE ON public.avisos FOR EACH ROW EXECUTE FUNCTION public.fixar_autoria_aviso();


--
-- Name: avisos trg_avisos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_avisos_updated_at BEFORE UPDATE ON public.avisos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: fin_adiantamentos trg_bloquear_adiantamento; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_bloquear_adiantamento BEFORE UPDATE ON public.fin_adiantamentos FOR EACH ROW EXECUTE FUNCTION public.fn_bloquear_adiantamento_vencido();


--
-- Name: fichas_financeiras trg_bloquear_alteracao_ficha_fechada; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_bloquear_alteracao_ficha_fechada BEFORE UPDATE ON public.fichas_financeiras FOR EACH ROW EXECUTE FUNCTION public.bloquear_alteracao_ficha_fechada();


--
-- Name: itens_ficha_financeira trg_bloquear_alteracao_item_ficha_fechada; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_bloquear_alteracao_item_ficha_fechada BEFORE DELETE OR UPDATE ON public.itens_ficha_financeira FOR EACH ROW EXECUTE FUNCTION public.bloquear_alteracao_item_ficha_fechada();


--
-- Name: fichas_financeiras trg_bloquear_exclusao_ficha_fechada; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_bloquear_exclusao_ficha_fechada BEFORE DELETE ON public.fichas_financeiras FOR EACH ROW EXECUTE FUNCTION public.bloquear_exclusao_ficha_fechada();


--
-- Name: fichas_financeiras trg_bloquear_insercao_ficha_fechada; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_bloquear_insercao_ficha_fechada BEFORE INSERT ON public.fichas_financeiras FOR EACH ROW EXECUTE FUNCTION public.bloquear_insercao_ficha_fechada();


--
-- Name: itens_ficha_financeira trg_bloquear_insercao_item_ficha_fechada; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_bloquear_insercao_item_ficha_fechada BEFORE INSERT ON public.itens_ficha_financeira FOR EACH ROW EXECUTE FUNCTION public.bloquear_insercao_item_ficha_fechada();


--
-- Name: campanhas_inventario_unidades trg_campanhas_inventario_unidades_autoria; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_campanhas_inventario_unidades_autoria BEFORE INSERT ON public.campanhas_inventario_unidades FOR EACH ROW EXECUTE FUNCTION public.fn_campanhas_inventario_unidades_autoria();


--
-- Name: campanhas_inventario_unidades trg_campanhas_inventario_unidades_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_campanhas_inventario_unidades_updated_at BEFORE UPDATE ON public.campanhas_inventario_unidades FOR EACH ROW EXECUTE FUNCTION public.fn_update_timestamp_parametros();


--
-- Name: cessoes trg_cessao_atualiza_situacao; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_cessao_atualiza_situacao AFTER INSERT OR UPDATE ON public.cessoes FOR EACH ROW EXECUTE FUNCTION public.trigger_cessao_atualiza_situacao();


--
-- Name: config_envio trg_config_envio_autoria; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_config_envio_autoria BEFORE INSERT OR UPDATE ON public.config_envio FOR EACH ROW EXECUTE FUNCTION public.fixar_autoria_config_envio();


--
-- Name: config_motivos_desligamento trg_config_motivos_desligamento_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_config_motivos_desligamento_updated_at BEFORE UPDATE ON public.config_motivos_desligamento FOR EACH ROW EXECUTE FUNCTION public.fn_update_timestamp_parametros();


--
-- Name: config_situacoes_funcionais trg_config_situacoes_funcionais_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_config_situacoes_funcionais_updated_at BEFORE UPDATE ON public.config_situacoes_funcionais FOR EACH ROW EXECUTE FUNCTION public.fn_update_timestamp_parametros();


--
-- Name: config_tipos_ato trg_config_tipos_ato_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_config_tipos_ato_updated_at BEFORE UPDATE ON public.config_tipos_ato FOR EACH ROW EXECUTE FUNCTION public.fn_update_timestamp_parametros();


--
-- Name: config_tipos_servidor trg_config_tipos_servidor_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_config_tipos_servidor_updated_at BEFORE UPDATE ON public.config_tipos_servidor FOR EACH ROW EXECUTE FUNCTION public.fn_update_timestamp_parametros();


--
-- Name: datas_importantes trg_datas_importantes_autoria; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_datas_importantes_autoria BEFORE INSERT OR UPDATE ON public.datas_importantes FOR EACH ROW EXECUTE FUNCTION public.fixar_autoria_aviso();


--
-- Name: datas_importantes trg_datas_importantes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_datas_importantes_updated_at BEFORE UPDATE ON public.datas_importantes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: empenhos trg_empenho_atualiza_dotacao; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_empenho_atualiza_dotacao AFTER INSERT OR DELETE OR UPDATE ON public.empenhos FOR EACH ROW EXECUTE FUNCTION public.fn_atualizar_saldo_dotacao();


--
-- Name: lotacoes trg_encerrar_lotacao_anterior; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_encerrar_lotacao_anterior AFTER INSERT OR UPDATE ON public.lotacoes FOR EACH ROW WHEN ((new.ativo = true)) EXECUTE FUNCTION public.fn_encerrar_lotacao_anterior();


--
-- Name: cessoes trg_encerrar_provimento_comissionado_cessao; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_encerrar_provimento_comissionado_cessao AFTER INSERT OR UPDATE ON public.cessoes FOR EACH ROW EXECUTE FUNCTION public.fn_encerrar_provimento_comissionado_cessao();


--
-- Name: vinculos_funcionais trg_encerrar_vinculo_anterior; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_encerrar_vinculo_anterior AFTER INSERT OR UPDATE ON public.vinculos_funcionais FOR EACH ROW WHEN ((new.ativo = true)) EXECUTE FUNCTION public.fn_encerrar_vinculo_anterior();


--
-- Name: ferias_servidor trg_ferias_atualiza_situacao; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_ferias_atualiza_situacao AFTER INSERT OR UPDATE ON public.ferias_servidor FOR EACH ROW EXECUTE FUNCTION public.trigger_ferias_atualiza_situacao();


--
-- Name: folhas_pagamento trg_folhas_proteger_exclusao; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_folhas_proteger_exclusao BEFORE DELETE ON public.folhas_pagamento FOR EACH ROW EXECUTE FUNCTION public.folhas_proteger_exclusao();


--
-- Name: documentos_requerimento_servidor trg_forcar_campos_iniciais; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_forcar_campos_iniciais BEFORE INSERT ON public.documentos_requerimento_servidor FOR EACH ROW EXECUTE FUNCTION public.forcar_campos_iniciais('rh', 'status=pendente', 'created_by=@uid');


--
-- Name: justificativas_ponto trg_forcar_campos_iniciais; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_forcar_campos_iniciais BEFORE INSERT ON public.justificativas_ponto FOR EACH ROW EXECUTE FUNCTION public.forcar_campos_iniciais('perm:rh:rh.aprovar|rh.frequencia.lancar:registros_ponto.registro_ponto_id', 'status=pendente', 'aprovador_id=NULL', 'data_aprovacao=NULL', 'observacao_aprovador=NULL', 'motivo_rejeicao=NULL', 'created_by=@uid');


--
-- Name: solicitacoes_abono trg_forcar_campos_iniciais; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_forcar_campos_iniciais BEFORE INSERT ON public.solicitacoes_abono FOR EACH ROW EXECUTE FUNCTION public.forcar_campos_iniciais('perm:rh:rh.aprovar|rh.frequencia.lancar', 'status=pendente', 'aprovado_chefia_por=NULL', 'aprovado_chefia_em=NULL', 'aprovado_rh_por=NULL', 'aprovado_rh_em=NULL', 'observacao_aprovador=NULL', 'motivo_rejeicao=NULL', 'created_by=@uid');


--
-- Name: solicitacoes_ajuste_ponto trg_forcar_campos_iniciais; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_forcar_campos_iniciais BEFORE INSERT ON public.solicitacoes_ajuste_ponto FOR EACH ROW EXECUTE FUNCTION public.forcar_campos_iniciais('perm:rh:rh.aprovar|rh.frequencia.lancar:usuario', 'status=pendente', 'aprovador_id=NULL', 'data_aprovacao=NULL', 'observacao_aprovador=NULL', 'motivo_rejeicao=NULL', 'created_by=@uid');


--
-- Name: fotos_vistoria_inventario trg_fotos_vistoria_inventario_imutavel; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_fotos_vistoria_inventario_imutavel BEFORE UPDATE ON public.fotos_vistoria_inventario FOR EACH ROW EXECUTE FUNCTION public.fn_fotos_vistoria_inventario_imutavel();


--
-- Name: requisicoes_material trg_gerar_numero_requisicao; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_gerar_numero_requisicao BEFORE INSERT ON public.requisicoes_material FOR EACH ROW WHEN ((new.numero IS NULL)) EXECUTE FUNCTION public.fn_gerar_numero_requisicao();


--
-- Name: bens_patrimoniais trg_gerar_numero_tombamento; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_gerar_numero_tombamento BEFORE INSERT ON public.bens_patrimoniais FOR EACH ROW EXECUTE FUNCTION public.fn_gerar_numero_tombamento();


--
-- Name: cadastro_arbitros trg_gerar_protocolo_arbitro; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_gerar_protocolo_arbitro BEFORE INSERT ON public.cadastro_arbitros FOR EACH ROW EXECUTE FUNCTION public.gerar_protocolo_arbitro();


--
-- Name: solicitacoes_sic trg_gerar_protocolo_sic; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_gerar_protocolo_sic BEFORE INSERT ON public.solicitacoes_sic FOR EACH ROW WHEN ((new.protocolo IS NULL)) EXECUTE FUNCTION public.gerar_protocolo_sic();


--
-- Name: solicitacoes_sic trg_hash_solicitante_sic; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_hash_solicitante_sic BEFORE INSERT OR UPDATE OF solicitante_documento ON public.solicitacoes_sic FOR EACH ROW EXECUTE FUNCTION public.gerar_hash_solicitante_sic();


--
-- Name: fin_adiantamentos trg_historico_adiantamento; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_historico_adiantamento BEFORE UPDATE ON public.fin_adiantamentos FOR EACH ROW EXECUTE FUNCTION public.fn_registrar_historico_status_financeiro();


--
-- Name: fin_pagamentos trg_historico_pagamento; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_historico_pagamento BEFORE UPDATE ON public.fin_pagamentos FOR EACH ROW EXECUTE FUNCTION public.fn_registrar_historico_status_financeiro();


--
-- Name: fin_solicitacoes trg_historico_solicitacao; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_historico_solicitacao BEFORE UPDATE ON public.fin_solicitacoes FOR EACH ROW EXECUTE FUNCTION public.fn_registrar_historico_status_financeiro();


--
-- Name: config_parametros_valores trg_impedir_delecao_parametro; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_impedir_delecao_parametro BEFORE DELETE ON public.config_parametros_valores FOR EACH ROW EXECUTE FUNCTION public.fn_impedir_delecao_parametro();


--
-- Name: licencas_afastamentos trg_licenca_atualiza_situacao; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_licenca_atualiza_situacao AFTER INSERT OR UPDATE ON public.licencas_afastamentos FOR EACH ROW EXECUTE FUNCTION public.trigger_licenca_atualiza_situacao();


--
-- Name: movimentacoes_estoque trg_movimentacao_atualiza_estoque; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_movimentacao_atualiza_estoque AFTER INSERT ON public.movimentacoes_estoque FOR EACH ROW EXECUTE FUNCTION public.fn_atualizar_estoque();


--
-- Name: provimentos trg_provimento_atualiza_situacao; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_provimento_atualiza_situacao AFTER INSERT OR UPDATE ON public.provimentos FOR EACH ROW EXECUTE FUNCTION public.trigger_provimento_atualiza_situacao();


--
-- Name: cessoes trg_reativar_provimento_retorno_cessao; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_reativar_provimento_retorno_cessao AFTER UPDATE ON public.cessoes FOR EACH ROW EXECUTE FUNCTION public.fn_reativar_provimento_retorno_cessao();


--
-- Name: processos_licitatorios trg_registrar_fase_licitacao; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_registrar_fase_licitacao BEFORE UPDATE OF fase_atual ON public.processos_licitatorios FOR EACH ROW EXECUTE FUNCTION public.registrar_mudanca_fase_licitacao();


--
-- Name: folhas_pagamento trg_registrar_transicao_folha; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_registrar_transicao_folha BEFORE UPDATE ON public.folhas_pagamento FOR EACH ROW EXECUTE FUNCTION public.registrar_transicao_folha();


--
-- Name: servidores trg_servidores_proteger_cpf; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_servidores_proteger_cpf BEFORE UPDATE OF cpf ON public.servidores FOR EACH ROW EXECUTE FUNCTION public.servidores_proteger_cpf();


--
-- Name: fin_sub_empenhos trg_sub_empenho_saldo; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_sub_empenho_saldo AFTER INSERT ON public.fin_sub_empenhos FOR EACH ROW EXECUTE FUNCTION public.fn_atualizar_saldo_sub_empenho();


--
-- Name: config_institucional trg_update_timestamp_config_institucional; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_timestamp_config_institucional BEFORE UPDATE ON public.config_institucional FOR EACH ROW EXECUTE FUNCTION public.fn_update_timestamp_parametros();


--
-- Name: config_parametros_valores trg_update_timestamp_config_parametros; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_timestamp_config_parametros BEFORE UPDATE ON public.config_parametros_valores FOR EACH ROW EXECUTE FUNCTION public.fn_update_timestamp_parametros();


--
-- Name: frequencia_fechamento trg_validar_etapa_frequencia; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_validar_etapa_frequencia BEFORE INSERT OR DELETE OR UPDATE ON public.frequencia_fechamento FOR EACH ROW EXECUTE FUNCTION public.validar_etapa_frequencia();


--
-- Name: justificativas_ponto trg_validar_etapa_frequencia; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_validar_etapa_frequencia BEFORE INSERT OR DELETE OR UPDATE ON public.justificativas_ponto FOR EACH ROW EXECUTE FUNCTION public.validar_etapa_frequencia();


--
-- Name: solicitacoes_abono trg_validar_etapa_frequencia; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_validar_etapa_frequencia BEFORE INSERT OR DELETE OR UPDATE ON public.solicitacoes_abono FOR EACH ROW EXECUTE FUNCTION public.validar_etapa_frequencia();


--
-- Name: solicitacoes_ajuste_ponto trg_validar_etapa_frequencia; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_validar_etapa_frequencia BEFORE INSERT OR DELETE OR UPDATE ON public.solicitacoes_ajuste_ponto FOR EACH ROW EXECUTE FUNCTION public.validar_etapa_frequencia();


--
-- Name: provimentos trg_validar_provimento; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_validar_provimento BEFORE INSERT OR UPDATE ON public.provimentos FOR EACH ROW EXECUTE FUNCTION public.fn_validar_provimento();


--
-- Name: fin_empenhos trg_validar_saldo_empenho; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_validar_saldo_empenho BEFORE INSERT ON public.fin_empenhos FOR EACH ROW EXECUTE FUNCTION public.fn_validar_saldo_empenho();


--
-- Name: fin_sub_empenhos trg_validar_sub_empenho; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_validar_sub_empenho BEFORE INSERT ON public.fin_sub_empenhos FOR EACH ROW EXECUTE FUNCTION public.fn_validar_sub_empenho_anulacao();


--
-- Name: config_parametros_valores trg_validar_vigencia_parametro; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_validar_vigencia_parametro BEFORE INSERT OR UPDATE ON public.config_parametros_valores FOR EACH ROW EXECUTE FUNCTION public.fn_validar_vigencia_parametro();


--
-- Name: fin_empenhos trg_verificar_saldo_empenho; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_verificar_saldo_empenho BEFORE INSERT ON public.fin_empenhos FOR EACH ROW EXECUTE FUNCTION public.fn_verificar_saldo_dotacao();


--
-- Name: ferias_servidor trigger_atualizar_situacao_ferias; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_atualizar_situacao_ferias AFTER INSERT OR UPDATE OF status ON public.ferias_servidor FOR EACH ROW EXECUTE FUNCTION public.atualizar_situacao_servidor();


--
-- Name: licencas_afastamentos trigger_atualizar_situacao_licenca; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_atualizar_situacao_licenca AFTER INSERT OR UPDATE OF status ON public.licencas_afastamentos FOR EACH ROW EXECUTE FUNCTION public.atualizar_situacao_servidor();


--
-- Name: vinculos_funcionais trigger_atualizar_tipo_servidor; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_atualizar_tipo_servidor AFTER INSERT ON public.vinculos_funcionais FOR EACH ROW WHEN ((new.ativo = true)) EXECUTE FUNCTION public.atualizar_tipo_servidor();


--
-- Name: conteudo_rascunho trigger_conteudo_rascunho_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_conteudo_rascunho_updated_at BEFORE UPDATE ON public.conteudo_rascunho FOR EACH ROW EXECUTE FUNCTION public.update_conteudo_rascunho_updated_at();


--
-- Name: dados_oficiais trigger_dados_oficiais_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_dados_oficiais_updated_at BEFORE UPDATE ON public.dados_oficiais FOR EACH ROW EXECUTE FUNCTION public.update_dados_oficiais_updated_at();


--
-- Name: gestores_escolares trigger_desmarcar_escola_cadastrada; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_desmarcar_escola_cadastrada AFTER DELETE ON public.gestores_escolares FOR EACH ROW EXECUTE FUNCTION public.desmarcar_escola_cadastrada();


--
-- Name: nomeacoes_chefe_unidade trigger_encerrar_nomeacao_anterior; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_encerrar_nomeacao_anterior AFTER INSERT OR UPDATE ON public.nomeacoes_chefe_unidade FOR EACH ROW EXECUTE FUNCTION public.encerrar_nomeacao_anterior();


--
-- Name: escolas_jer trigger_escolas_jer_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_escolas_jer_updated_at BEFORE UPDATE ON public.escolas_jer FOR EACH ROW EXECUTE FUNCTION public.update_gestores_updated_at();


--
-- Name: instituicoes trigger_generate_codigo_instituicao; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_generate_codigo_instituicao BEFORE INSERT ON public.instituicoes FOR EACH ROW WHEN ((new.codigo_instituicao IS NULL)) EXECUTE FUNCTION public.generate_codigo_instituicao();


--
-- Name: servidores trigger_gerar_codigo_interno_servidor; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_gerar_codigo_interno_servidor BEFORE INSERT ON public.servidores FOR EACH ROW WHEN ((new.codigo_interno IS NULL)) EXECUTE FUNCTION public.gerar_codigo_interno_servidor();


--
-- Name: gestores_escolares trigger_gestores_escolares_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_gestores_escolares_updated_at BEFORE UPDATE ON public.gestores_escolares FOR EACH ROW EXECUTE FUNCTION public.update_gestores_updated_at();


--
-- Name: agenda_unidade trigger_historico_status_agenda; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_historico_status_agenda BEFORE UPDATE ON public.agenda_unidade FOR EACH ROW EXECUTE FUNCTION public.registrar_historico_status();


--
-- Name: gestores_escolares trigger_marcar_escola_cadastrada; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_marcar_escola_cadastrada AFTER INSERT ON public.gestores_escolares FOR EACH ROW EXECUTE FUNCTION public.marcar_escola_cadastrada();


--
-- Name: servidores trigger_sync_usuario_servidor; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_sync_usuario_servidor AFTER UPDATE OF situacao ON public.servidores FOR EACH ROW EXECUTE FUNCTION public.sync_usuario_servidor_status();


--
-- Name: lotacoes trigger_validar_lotacao_unica; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_validar_lotacao_unica BEFORE INSERT OR UPDATE ON public.lotacoes FOR EACH ROW EXECUTE FUNCTION public.validar_lotacao_unica();


--
-- Name: provimentos trigger_validar_provimento; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_validar_provimento BEFORE INSERT OR UPDATE ON public.provimentos FOR EACH ROW EXECUTE FUNCTION public.validar_provimento();


--
-- Name: vinculos_funcionais trigger_validar_vinculo_unico; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_validar_vinculo_unico BEFORE INSERT OR UPDATE ON public.vinculos_funcionais FOR EACH ROW EXECUTE FUNCTION public.validar_vinculo_unico();


--
-- Name: agenda_unidade trigger_validate_processo_sei; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_validate_processo_sei BEFORE UPDATE ON public.agenda_unidade FOR EACH ROW EXECUTE FUNCTION public.validate_processo_sei_para_aprovacao();


--
-- Name: agenda_unidade update_agenda_unidade_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_agenda_unidade_updated_at BEFORE UPDATE ON public.agenda_unidade FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: atas_registro_preco update_atas_registro_preco_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_atas_registro_preco_updated_at BEFORE UPDATE ON public.atas_registro_preco FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: avaliacoes_controle update_avaliacoes_controle_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_avaliacoes_controle_updated_at BEFORE UPDATE ON public.avaliacoes_controle FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: avaliacoes_risco update_avaliacoes_risco_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_avaliacoes_risco_updated_at BEFORE UPDATE ON public.avaliacoes_risco FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: backup_config update_backup_config_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_backup_config_updated_at BEFORE UPDATE ON public.backup_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: baixas_patrimonio update_baixas_patrimonio_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_baixas_patrimonio_updated_at BEFORE UPDATE ON public.baixas_patrimonio FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: banco_horas update_banco_horas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_banco_horas_updated_at BEFORE UPDATE ON public.banco_horas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: bancos_cnab update_bancos_cnab_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_bancos_cnab_updated_at BEFORE UPDATE ON public.bancos_cnab FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: campanhas_inventario update_campanhas_inventario_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_campanhas_inventario_updated_at BEFORE UPDATE ON public.campanhas_inventario FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: cargos update_cargos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_cargos_updated_at BEFORE UPDATE ON public.cargos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: centros_custo update_centros_custo_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_centros_custo_updated_at BEFORE UPDATE ON public.centros_custo FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: checklists_conformidade update_checklists_conformidade_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_checklists_conformidade_updated_at BEFORE UPDATE ON public.checklists_conformidade FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: cms_banners update_cms_banners_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_cms_banners_updated_at BEFORE UPDATE ON public.cms_banners FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: cms_conteudos update_cms_conteudos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_cms_conteudos_updated_at BEFORE UPDATE ON public.cms_conteudos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: cms_galerias update_cms_galerias_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_cms_galerias_updated_at BEFORE UPDATE ON public.cms_galerias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: cms_media update_cms_media_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_cms_media_updated_at BEFORE UPDATE ON public.cms_media FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: conciliacoes_inventario update_conciliacoes_inventario_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_conciliacoes_inventario_updated_at BEFORE UPDATE ON public.conciliacoes_inventario FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: config_agrupamento_unidades update_config_agrupamento_unidades_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_config_agrupamento_unidades_updated_at BEFORE UPDATE ON public.config_agrupamento_unidades FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: config_assinatura_reuniao update_config_assinatura_reuniao_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_config_assinatura_reuniao_updated_at BEFORE UPDATE ON public.config_assinatura_reuniao FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: config_autarquia update_config_autarquia_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_config_autarquia_updated_at BEFORE UPDATE ON public.config_autarquia FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: configuracao_jornada update_config_jornada_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_config_jornada_updated_at BEFORE UPDATE ON public.configuracao_jornada FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: config_menu_publico update_config_menu_publico_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_config_menu_publico_updated_at BEFORE UPDATE ON public.config_menu_publico FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: config_paginas_publicas update_config_paginas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_config_paginas_updated_at BEFORE UPDATE ON public.config_paginas_publicas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: consignacoes update_consignacoes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_consignacoes_updated_at BEFORE UPDATE ON public.consignacoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: contas_autarquia update_contas_autarquia_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_contas_autarquia_updated_at BEFORE UPDATE ON public.contas_autarquia FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: contatos_eventos_esportivos update_contatos_eventos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_contatos_eventos_updated_at BEFORE UPDATE ON public.contatos_eventos_esportivos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: contratos update_contratos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_contratos_updated_at BEFORE UPDATE ON public.contratos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: controles_internos update_controles_internos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_controles_internos_updated_at BEFORE UPDATE ON public.controles_internos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: decisoes_administrativas update_decisoes_administrativas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_decisoes_administrativas_updated_at BEFORE UPDATE ON public.decisoes_administrativas FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: demandas_ascom update_demandas_ascom_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_demandas_ascom_updated_at BEFORE UPDATE ON public.demandas_ascom FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: denuncias update_denuncias_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_denuncias_updated_at BEFORE UPDATE ON public.denuncias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dependentes_irrf update_dependentes_irrf_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_dependentes_irrf_updated_at BEFORE UPDATE ON public.dependentes_irrf FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: designacoes update_designacoes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_designacoes_updated_at BEFORE UPDATE ON public.designacoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: documentos_requerimento_servidor update_doc_req_servidor_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_doc_req_servidor_updated_at BEFORE UPDATE ON public.documentos_requerimento_servidor FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: documentos_preparatorios_licitacao update_docs_prep_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_docs_prep_updated_at BEFORE UPDATE ON public.documentos_preparatorios_licitacao FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: documentos_cedencia update_documentos_cedencia_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_documentos_cedencia_updated_at BEFORE UPDATE ON public.documentos_cedencia FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: documentos update_documentos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_documentos_updated_at BEFORE UPDATE ON public.documentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: encaminhamentos update_encaminhamentos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_encaminhamentos_updated_at BEFORE UPDATE ON public.encaminhamentos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: estrutura_organizacional update_estrutura_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_estrutura_updated_at BEFORE UPDATE ON public.estrutura_organizacional FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: eventos_esocial update_eventos_esocial_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_eventos_esocial_updated_at BEFORE UPDATE ON public.eventos_esocial FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: evidencias_controle update_evidencias_controle_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_evidencias_controle_updated_at BEFORE UPDATE ON public.evidencias_controle FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: federacao_arbitros update_federacao_arbitros_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_federacao_arbitros_updated_at BEFORE UPDATE ON public.federacao_arbitros FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: federacao_espacos_cedidos update_federacao_espacos_cedidos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_federacao_espacos_cedidos_updated_at BEFORE UPDATE ON public.federacao_espacos_cedidos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: federacao_parcerias update_federacao_parcerias_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_federacao_parcerias_updated_at BEFORE UPDATE ON public.federacao_parcerias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: federacoes_esportivas update_federacoes_esportivas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_federacoes_esportivas_updated_at BEFORE UPDATE ON public.federacoes_esportivas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: fichas_financeiras update_fichas_financeiras_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_fichas_financeiras_updated_at BEFORE UPDATE ON public.fichas_financeiras FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: fin_restos_pagar update_fin_restos_pagar_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_fin_restos_pagar_updated_at BEFORE UPDATE ON public.fin_restos_pagar FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: fin_sub_empenhos update_fin_sub_empenhos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_fin_sub_empenhos_updated_at BEFORE UPDATE ON public.fin_sub_empenhos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: folhas_pagamento update_folhas_pagamento_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_folhas_pagamento_updated_at BEFORE UPDATE ON public.folhas_pagamento FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: fornecedores update_fornecedores_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_fornecedores_updated_at BEFORE UPDATE ON public.fornecedores FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: frequencia_pacotes update_frequencia_pacotes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_frequencia_pacotes_updated_at BEFORE UPDATE ON public.frequencia_pacotes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: frequencia_mensal update_frequencia_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_frequencia_updated_at BEFORE UPDATE ON public.frequencia_mensal FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: galeria_eventos_esportivos update_galeria_eventos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_galeria_eventos_updated_at BEFORE UPDATE ON public.galeria_eventos_esportivos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: instituicoes update_instituicoes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_instituicoes_updated_at BEFORE UPDATE ON public.instituicoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: itens_ata_registro_preco update_itens_ata_registro_preco_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_itens_ata_registro_preco_updated_at BEFORE UPDATE ON public.itens_ata_registro_preco FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: itens_checklist update_itens_checklist_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_itens_checklist_updated_at BEFORE UPDATE ON public.itens_checklist FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: itens_contrato update_itens_contrato_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_itens_contrato_updated_at BEFORE UPDATE ON public.itens_contrato FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: itens_processo_licitatorio update_itens_processo_licitatorio_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_itens_processo_licitatorio_updated_at BEFORE UPDATE ON public.itens_processo_licitatorio FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: justificativas_ponto update_justificativas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_justificativas_updated_at BEFORE UPDATE ON public.justificativas_ponto FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: links_uteis update_links_uteis_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_links_uteis_updated_at BEFORE UPDATE ON public.links_uteis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: lotacoes update_lotacoes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_lotacoes_updated_at BEFORE UPDATE ON public.lotacoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: manutencoes_patrimonio update_manutencoes_patrimonio_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_manutencoes_patrimonio_updated_at BEFORE UPDATE ON public.manutencoes_patrimonio FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: matriz_raci_atribuicoes update_matriz_raci_atribuicoes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_matriz_raci_atribuicoes_updated_at BEFORE UPDATE ON public.matriz_raci_atribuicoes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: matriz_raci_papeis update_matriz_raci_papeis_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_matriz_raci_papeis_updated_at BEFORE UPDATE ON public.matriz_raci_papeis FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: matriz_raci_processos update_matriz_raci_processos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_matriz_raci_processos_updated_at BEFORE UPDATE ON public.matriz_raci_processos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: memorandos_lotacao update_memorandos_lotacao_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_memorandos_lotacao_updated_at BEFORE UPDATE ON public.memorandos_lotacao FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: modelos_mensagem_reuniao update_modelos_mensagem_reuniao_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_modelos_mensagem_reuniao_updated_at BEFORE UPDATE ON public.modelos_mensagem_reuniao FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: module_settings update_module_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_module_settings_updated_at BEFORE UPDATE ON public.module_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: movimentacoes_patrimonio update_movimentacoes_patrimonio_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_movimentacoes_patrimonio_updated_at BEFORE UPDATE ON public.movimentacoes_patrimonio FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: nomeacoes_chefe_unidade update_nomeacoes_chefe_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_nomeacoes_chefe_updated_at BEFORE UPDATE ON public.nomeacoes_chefe_unidade FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: noticias_eventos_esportivos update_noticias_eventos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_noticias_eventos_updated_at BEFORE UPDATE ON public.noticias_eventos_esportivos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ocorrencias_patrimonio update_ocorrencias_patrimonio_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_ocorrencias_patrimonio_updated_at BEFORE UPDATE ON public.ocorrencias_patrimonio FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: parametros_folha update_parametros_folha_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_parametros_folha_updated_at BEFORE UPDATE ON public.parametros_folha FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: pareceres_tecnicos update_pareceres_tecnicos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_pareceres_tecnicos_updated_at BEFORE UPDATE ON public.pareceres_tecnicos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: participantes_reuniao update_participantes_reuniao_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_participantes_reuniao_updated_at BEFORE UPDATE ON public.participantes_reuniao FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: patrimonio_unidade update_patrimonio_unidade_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_patrimonio_unidade_updated_at BEFORE UPDATE ON public.patrimonio_unidade FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: pensoes_alimenticias update_pensoes_alimenticias_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_pensoes_alimenticias_updated_at BEFORE UPDATE ON public.pensoes_alimenticias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: planos_tratamento_risco update_planos_tratamento_risco_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_planos_tratamento_risco_updated_at BEFORE UPDATE ON public.planos_tratamento_risco FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: portal_diretoria update_portal_diretoria_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_portal_diretoria_updated_at BEFORE UPDATE ON public.portal_diretoria FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: pre_cadastros update_pre_cadastros_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_pre_cadastros_updated_at BEFORE UPDATE ON public.pre_cadastros FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: processos_licitatorios update_processos_lic_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_processos_lic_updated_at BEFORE UPDATE ON public.processos_licitatorios FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: propostas_licitacao update_propostas_licitacao_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_propostas_licitacao_updated_at BEFORE UPDATE ON public.propostas_licitacao FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: publicacoes_lai update_publicacoes_lai_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_publicacoes_lai_updated_at BEFORE UPDATE ON public.publicacoes_lai FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: publicacoes_legais update_publicacoes_legais_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_publicacoes_legais_updated_at BEFORE UPDATE ON public.publicacoes_legais FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: registros_ponto update_registros_ponto_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_registros_ponto_updated_at BEFORE UPDATE ON public.registros_ponto FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: remessas_bancarias update_remessas_bancarias_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_remessas_bancarias_updated_at BEFORE UPDATE ON public.remessas_bancarias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: requisicoes_material update_requisicoes_material_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_requisicoes_material_updated_at BEFORE UPDATE ON public.requisicoes_material FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: respostas_checklist update_respostas_checklist_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_respostas_checklist_updated_at BEFORE UPDATE ON public.respostas_checklist FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: reunioes update_reunioes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_reunioes_updated_at BEFORE UPDATE ON public.reunioes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: riscos_institucionais update_riscos_institucionais_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_riscos_institucionais_updated_at BEFORE UPDATE ON public.riscos_institucionais FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: rubricas update_rubricas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_rubricas_updated_at BEFORE UPDATE ON public.rubricas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: servidores update_servidores_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_servidores_updated_at BEFORE UPDATE ON public.servidores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: solicitacoes_sic update_solicitacoes_sic_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_solicitacoes_sic_updated_at BEFORE UPDATE ON public.solicitacoes_sic FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: solicitacoes_ajuste_ponto update_solicitacoes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_solicitacoes_updated_at BEFORE UPDATE ON public.solicitacoes_ajuste_ponto FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: termos_cessao update_termos_cessao_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_termos_cessao_updated_at BEFORE UPDATE ON public.termos_cessao FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: unidades_locais update_unidades_locais_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_unidades_locais_updated_at BEFORE UPDATE ON public.unidades_locais FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: viagens_diarias update_viagens_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_viagens_updated_at BEFORE UPDATE ON public.viagens_diarias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: acesso_processo_sigiloso acesso_processo_sigiloso_concedido_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acesso_processo_sigiloso
    ADD CONSTRAINT acesso_processo_sigiloso_concedido_por_fkey FOREIGN KEY (concedido_por) REFERENCES auth.users(id);


--
-- Name: acesso_processo_sigiloso acesso_processo_sigiloso_processo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acesso_processo_sigiloso
    ADD CONSTRAINT acesso_processo_sigiloso_processo_id_fkey FOREIGN KEY (processo_id) REFERENCES public.processos_administrativos(id) ON DELETE CASCADE;


--
-- Name: acesso_processo_sigiloso acesso_processo_sigiloso_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acesso_processo_sigiloso
    ADD CONSTRAINT acesso_processo_sigiloso_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES auth.users(id);


--
-- Name: acoes acoes_processo_licitatorio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acoes
    ADD CONSTRAINT acoes_processo_licitatorio_id_fkey FOREIGN KEY (processo_licitatorio_id) REFERENCES public.processos_licitatorios(id);


--
-- Name: acoes acoes_programa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acoes
    ADD CONSTRAINT acoes_programa_id_fkey FOREIGN KEY (programa_id) REFERENCES public.programas(id) ON DELETE CASCADE;


--
-- Name: adicionais_tempo_servico adicionais_tempo_servico_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adicionais_tempo_servico
    ADD CONSTRAINT adicionais_tempo_servico_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.servidores(id) ON DELETE CASCADE;


--
-- Name: aditivos_contrato aditivos_contrato_contrato_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aditivos_contrato
    ADD CONSTRAINT aditivos_contrato_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES public.contratos(id) ON DELETE CASCADE;


--
-- Name: agenda_unidade agenda_unidade_aprovador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agenda_unidade
    ADD CONSTRAINT agenda_unidade_aprovador_id_fkey FOREIGN KEY (aprovador_id) REFERENCES public.servidores(id);


--
-- Name: agenda_unidade agenda_unidade_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agenda_unidade
    ADD CONSTRAINT agenda_unidade_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: agenda_unidade agenda_unidade_federacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agenda_unidade
    ADD CONSTRAINT agenda_unidade_federacao_id_fkey FOREIGN KEY (federacao_id) REFERENCES public.federacoes_esportivas(id) ON DELETE SET NULL;


--
-- Name: agenda_unidade agenda_unidade_instituicao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agenda_unidade
    ADD CONSTRAINT agenda_unidade_instituicao_id_fkey FOREIGN KEY (instituicao_id) REFERENCES public.instituicoes(id);


--
-- Name: agenda_unidade agenda_unidade_unidade_local_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agenda_unidade
    ADD CONSTRAINT agenda_unidade_unidade_local_id_fkey FOREIGN KEY (unidade_local_id) REFERENCES public.unidades_locais(id) ON DELETE CASCADE;


--
-- Name: agenda_unidade agenda_unidade_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agenda_unidade
    ADD CONSTRAINT agenda_unidade_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: agrupamento_unidade_vinculo agrupamento_unidade_vinculo_agrupamento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agrupamento_unidade_vinculo
    ADD CONSTRAINT agrupamento_unidade_vinculo_agrupamento_id_fkey FOREIGN KEY (agrupamento_id) REFERENCES public.config_agrupamento_unidades(id) ON DELETE CASCADE;


--
-- Name: agrupamento_unidade_vinculo agrupamento_unidade_vinculo_unidade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agrupamento_unidade_vinculo
    ADD CONSTRAINT agrupamento_unidade_vinculo_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.estrutura_organizacional(id) ON DELETE CASCADE;


--
-- Name: almoxarifados almoxarifados_responsavel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.almoxarifados
    ADD CONSTRAINT almoxarifados_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES public.servidores(id);


--
-- Name: almoxarifados almoxarifados_unidade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.almoxarifados
    ADD CONSTRAINT almoxarifados_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.estrutura_organizacional(id);


--
-- Name: approval_delegations approval_delegations_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_delegations
    ADD CONSTRAINT approval_delegations_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: approval_delegations approval_delegations_delegate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_delegations
    ADD CONSTRAINT approval_delegations_delegate_id_fkey FOREIGN KEY (delegate_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: approval_delegations approval_delegations_delegator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_delegations
    ADD CONSTRAINT approval_delegations_delegator_id_fkey FOREIGN KEY (delegator_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: approval_delegations approval_delegations_revoked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_delegations
    ADD CONSTRAINT approval_delegations_revoked_by_fkey FOREIGN KEY (revoked_by) REFERENCES auth.users(id);


--
-- Name: approval_requests approval_requests_approver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_requests
    ADD CONSTRAINT approval_requests_approver_id_fkey FOREIGN KEY (approver_id) REFERENCES auth.users(id);


--
-- Name: approval_requests approval_requests_requester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_requests
    ADD CONSTRAINT approval_requests_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES auth.users(id);


--
-- Name: approval_requests approval_requests_requester_org_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_requests
    ADD CONSTRAINT approval_requests_requester_org_unit_id_fkey FOREIGN KEY (requester_org_unit_id) REFERENCES public.estrutura_organizacional(id);


--
-- Name: atas_registro_preco atas_registro_preco_fornecedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atas_registro_preco
    ADD CONSTRAINT atas_registro_preco_fornecedor_id_fkey FOREIGN KEY (fornecedor_id) REFERENCES public.fornecedores(id) ON DELETE RESTRICT;


--
-- Name: atas_registro_preco atas_registro_preco_processo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atas_registro_preco
    ADD CONSTRAINT atas_registro_preco_processo_id_fkey FOREIGN KEY (processo_id) REFERENCES public.processos_licitatorios(id) ON DELETE RESTRICT;


--
-- Name: audit_logs audit_logs_org_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_org_unit_id_fkey FOREIGN KEY (org_unit_id) REFERENCES public.estrutura_organizacional(id);


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: avaliacoes_controle avaliacoes_controle_avaliador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avaliacoes_controle
    ADD CONSTRAINT avaliacoes_controle_avaliador_id_fkey FOREIGN KEY (avaliador_id) REFERENCES public.servidores(id);


--
-- Name: avaliacoes_controle avaliacoes_controle_controle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avaliacoes_controle
    ADD CONSTRAINT avaliacoes_controle_controle_id_fkey FOREIGN KEY (controle_id) REFERENCES public.controles_internos(id) ON DELETE CASCADE;


--
-- Name: avaliacoes_controle avaliacoes_controle_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avaliacoes_controle
    ADD CONSTRAINT avaliacoes_controle_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: avaliacoes_risco avaliacoes_risco_avaliador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avaliacoes_risco
    ADD CONSTRAINT avaliacoes_risco_avaliador_id_fkey FOREIGN KEY (avaliador_id) REFERENCES public.servidores(id);


--
-- Name: avaliacoes_risco avaliacoes_risco_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avaliacoes_risco
    ADD CONSTRAINT avaliacoes_risco_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: avaliacoes_risco avaliacoes_risco_risco_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avaliacoes_risco
    ADD CONSTRAINT avaliacoes_risco_risco_id_fkey FOREIGN KEY (risco_id) REFERENCES public.riscos_institucionais(id) ON DELETE CASCADE;


--
-- Name: avisos avisos_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avisos
    ADD CONSTRAINT avisos_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: avisos_leituras avisos_leituras_aviso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avisos_leituras
    ADD CONSTRAINT avisos_leituras_aviso_id_fkey FOREIGN KEY (aviso_id) REFERENCES public.avisos(id) ON DELETE CASCADE;


--
-- Name: avisos_leituras avisos_leituras_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avisos_leituras
    ADD CONSTRAINT avisos_leituras_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: backup_history backup_history_triggered_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.backup_history
    ADD CONSTRAINT backup_history_triggered_by_fkey FOREIGN KEY (triggered_by) REFERENCES auth.users(id);


--
-- Name: backup_integrity_checks backup_integrity_checks_backup_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.backup_integrity_checks
    ADD CONSTRAINT backup_integrity_checks_backup_id_fkey FOREIGN KEY (backup_id) REFERENCES public.backup_history(id) ON DELETE CASCADE;


--
-- Name: backup_integrity_checks backup_integrity_checks_checked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.backup_integrity_checks
    ADD CONSTRAINT backup_integrity_checks_checked_by_fkey FOREIGN KEY (checked_by) REFERENCES auth.users(id);


--
-- Name: baixas_patrimonio baixas_patrimonio_aprovado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.baixas_patrimonio
    ADD CONSTRAINT baixas_patrimonio_aprovado_por_fkey FOREIGN KEY (aprovado_por) REFERENCES auth.users(id);


--
-- Name: baixas_patrimonio baixas_patrimonio_bem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.baixas_patrimonio
    ADD CONSTRAINT baixas_patrimonio_bem_id_fkey FOREIGN KEY (bem_id) REFERENCES public.bens_patrimoniais(id);


--
-- Name: baixas_patrimonio baixas_patrimonio_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.baixas_patrimonio
    ADD CONSTRAINT baixas_patrimonio_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: banco_horas banco_horas_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banco_horas
    ADD CONSTRAINT banco_horas_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: bens_patrimoniais bens_patrimoniais_empenho_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bens_patrimoniais
    ADD CONSTRAINT bens_patrimoniais_empenho_id_fkey FOREIGN KEY (empenho_id) REFERENCES public.empenhos(id);


--
-- Name: bens_patrimoniais bens_patrimoniais_fornecedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bens_patrimoniais
    ADD CONSTRAINT bens_patrimoniais_fornecedor_id_fkey FOREIGN KEY (fornecedor_id) REFERENCES public.fornecedores(id);


--
-- Name: bens_patrimoniais bens_patrimoniais_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bens_patrimoniais
    ADD CONSTRAINT bens_patrimoniais_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.itens_material(id);


--
-- Name: bens_patrimoniais bens_patrimoniais_responsavel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bens_patrimoniais
    ADD CONSTRAINT bens_patrimoniais_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES public.servidores(id);


--
-- Name: bens_patrimoniais bens_patrimoniais_unidade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bens_patrimoniais
    ADD CONSTRAINT bens_patrimoniais_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.estrutura_organizacional(id);


--
-- Name: bens_patrimoniais bens_patrimoniais_unidade_local_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bens_patrimoniais
    ADD CONSTRAINT bens_patrimoniais_unidade_local_id_fkey FOREIGN KEY (unidade_local_id) REFERENCES public.unidades_locais(id);


--
-- Name: cadastro_arbitros_modalidades cadastro_arbitros_modalidades_arbitro_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cadastro_arbitros_modalidades
    ADD CONSTRAINT cadastro_arbitros_modalidades_arbitro_id_fkey FOREIGN KEY (arbitro_id) REFERENCES public.cadastro_arbitros(id) ON DELETE CASCADE;


--
-- Name: calendario_federacao calendario_federacao_federacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendario_federacao
    ADD CONSTRAINT calendario_federacao_federacao_id_fkey FOREIGN KEY (federacao_id) REFERENCES public.federacoes_esportivas(id) ON DELETE CASCADE;


--
-- Name: campanhas_inventario campanhas_inventario_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campanhas_inventario
    ADD CONSTRAINT campanhas_inventario_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: campanhas_inventario campanhas_inventario_responsavel_geral_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campanhas_inventario
    ADD CONSTRAINT campanhas_inventario_responsavel_geral_id_fkey FOREIGN KEY (responsavel_geral_id) REFERENCES public.servidores(id);


--
-- Name: campanhas_inventario_unidades campanhas_inventario_unidades_campanha_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campanhas_inventario_unidades
    ADD CONSTRAINT campanhas_inventario_unidades_campanha_id_fkey FOREIGN KEY (campanha_id) REFERENCES public.campanhas_inventario(id) ON DELETE CASCADE;


--
-- Name: campanhas_inventario_unidades campanhas_inventario_unidades_unidade_local_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campanhas_inventario_unidades
    ADD CONSTRAINT campanhas_inventario_unidades_unidade_local_id_fkey FOREIGN KEY (unidade_local_id) REFERENCES public.unidades_locais(id) ON DELETE RESTRICT;


--
-- Name: cargo_unidade_compatibilidade cargo_unidade_compatibilidade_cargo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cargo_unidade_compatibilidade
    ADD CONSTRAINT cargo_unidade_compatibilidade_cargo_id_fkey FOREIGN KEY (cargo_id) REFERENCES public.cargos(id) ON DELETE CASCADE;


--
-- Name: cargo_unidade_compatibilidade cargo_unidade_compatibilidade_unidade_especifica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cargo_unidade_compatibilidade
    ADD CONSTRAINT cargo_unidade_compatibilidade_unidade_especifica_id_fkey FOREIGN KEY (unidade_especifica_id) REFERENCES public.estrutura_organizacional(id) ON DELETE CASCADE;


--
-- Name: centros_custo centros_custo_unidade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.centros_custo
    ADD CONSTRAINT centros_custo_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.estrutura_organizacional(id);


--
-- Name: cessoes cessoes_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cessoes
    ADD CONSTRAINT cessoes_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.servidores(id) ON DELETE CASCADE;


--
-- Name: cessoes cessoes_unidade_idjuv_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cessoes
    ADD CONSTRAINT cessoes_unidade_idjuv_id_fkey FOREIGN KEY (unidade_idjuv_id) REFERENCES public.estrutura_organizacional(id);


--
-- Name: checklists_conformidade checklists_conformidade_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checklists_conformidade
    ADD CONSTRAINT checklists_conformidade_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: checklists_conformidade checklists_conformidade_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checklists_conformidade
    ADD CONSTRAINT checklists_conformidade_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: cms_banners cms_banners_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_banners
    ADD CONSTRAINT cms_banners_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: cms_conteudos cms_conteudos_aprovador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_conteudos
    ADD CONSTRAINT cms_conteudos_aprovador_id_fkey FOREIGN KEY (aprovador_id) REFERENCES auth.users(id);


--
-- Name: cms_conteudos cms_conteudos_autor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_conteudos
    ADD CONSTRAINT cms_conteudos_autor_id_fkey FOREIGN KEY (autor_id) REFERENCES auth.users(id);


--
-- Name: cms_conteudos cms_conteudos_revisor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_conteudos
    ADD CONSTRAINT cms_conteudos_revisor_id_fkey FOREIGN KEY (revisor_id) REFERENCES auth.users(id);


--
-- Name: cms_galeria_fotos cms_galeria_fotos_galeria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_galeria_fotos
    ADD CONSTRAINT cms_galeria_fotos_galeria_id_fkey FOREIGN KEY (galeria_id) REFERENCES public.cms_galerias(id) ON DELETE CASCADE;


--
-- Name: cms_galerias cms_galerias_autor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_galerias
    ADD CONSTRAINT cms_galerias_autor_id_fkey FOREIGN KEY (autor_id) REFERENCES auth.users(id);


--
-- Name: cms_media cms_media_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_media
    ADD CONSTRAINT cms_media_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: coletas_inventario coletas_inventario_bem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coletas_inventario
    ADD CONSTRAINT coletas_inventario_bem_id_fkey FOREIGN KEY (bem_id) REFERENCES public.bens_patrimoniais(id);


--
-- Name: coletas_inventario coletas_inventario_campanha_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coletas_inventario
    ADD CONSTRAINT coletas_inventario_campanha_id_fkey FOREIGN KEY (campanha_id) REFERENCES public.campanhas_inventario(id);


--
-- Name: coletas_inventario coletas_inventario_localizacao_encontrada_unidade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coletas_inventario
    ADD CONSTRAINT coletas_inventario_localizacao_encontrada_unidade_id_fkey FOREIGN KEY (localizacao_encontrada_unidade_id) REFERENCES public.estrutura_organizacional(id);


--
-- Name: coletas_inventario coletas_inventario_responsavel_encontrado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coletas_inventario
    ADD CONSTRAINT coletas_inventario_responsavel_encontrado_id_fkey FOREIGN KEY (responsavel_encontrado_id) REFERENCES public.servidores(id);


--
-- Name: coletas_inventario coletas_inventario_usuario_coletor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coletas_inventario
    ADD CONSTRAINT coletas_inventario_usuario_coletor_id_fkey FOREIGN KEY (usuario_coletor_id) REFERENCES auth.users(id);


--
-- Name: composicao_cargos composicao_cargos_cargo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.composicao_cargos
    ADD CONSTRAINT composicao_cargos_cargo_id_fkey FOREIGN KEY (cargo_id) REFERENCES public.cargos(id) ON DELETE CASCADE;


--
-- Name: composicao_cargos composicao_cargos_unidade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.composicao_cargos
    ADD CONSTRAINT composicao_cargos_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.estrutura_organizacional(id) ON DELETE CASCADE;


--
-- Name: conciliacoes_inventario conciliacoes_inventario_aprovador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conciliacoes_inventario
    ADD CONSTRAINT conciliacoes_inventario_aprovador_id_fkey FOREIGN KEY (aprovador_id) REFERENCES auth.users(id);


--
-- Name: conciliacoes_inventario conciliacoes_inventario_bem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conciliacoes_inventario
    ADD CONSTRAINT conciliacoes_inventario_bem_id_fkey FOREIGN KEY (bem_id) REFERENCES public.bens_patrimoniais(id);


--
-- Name: conciliacoes_inventario conciliacoes_inventario_campanha_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conciliacoes_inventario
    ADD CONSTRAINT conciliacoes_inventario_campanha_id_fkey FOREIGN KEY (campanha_id) REFERENCES public.campanhas_inventario(id);


--
-- Name: conciliacoes_inventario conciliacoes_inventario_coleta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conciliacoes_inventario
    ADD CONSTRAINT conciliacoes_inventario_coleta_id_fkey FOREIGN KEY (coleta_id) REFERENCES public.coletas_inventario(id);


--
-- Name: conciliacoes_inventario conciliacoes_inventario_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conciliacoes_inventario
    ADD CONSTRAINT conciliacoes_inventario_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: config_agrupamento_unidades config_agrupamento_unidades_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_agrupamento_unidades
    ADD CONSTRAINT config_agrupamento_unidades_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: config_assinatura_frequencia config_assinatura_frequencia_instituicao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_assinatura_frequencia
    ADD CONSTRAINT config_assinatura_frequencia_instituicao_id_fkey FOREIGN KEY (instituicao_id) REFERENCES public.config_institucional(id);


--
-- Name: config_autarquia config_autarquia_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_autarquia
    ADD CONSTRAINT config_autarquia_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: config_autarquia config_autarquia_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_autarquia
    ADD CONSTRAINT config_autarquia_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.profiles(id);


--
-- Name: config_compensacao config_compensacao_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_compensacao
    ADD CONSTRAINT config_compensacao_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: config_compensacao config_compensacao_instituicao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_compensacao
    ADD CONSTRAINT config_compensacao_instituicao_id_fkey FOREIGN KEY (instituicao_id) REFERENCES public.config_institucional(id);


--
-- Name: config_compensacao config_compensacao_unidade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_compensacao
    ADD CONSTRAINT config_compensacao_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.estrutura_organizacional(id);


--
-- Name: config_envio config_envio_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_envio
    ADD CONSTRAINT config_envio_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: config_fechamento_folha config_fechamento_folha_conta_remessa_padrao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_fechamento_folha
    ADD CONSTRAINT config_fechamento_folha_conta_remessa_padrao_id_fkey FOREIGN KEY (conta_remessa_padrao_id) REFERENCES public.contas_autarquia(id);


--
-- Name: config_fechamento_folha config_fechamento_folha_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_fechamento_folha
    ADD CONSTRAINT config_fechamento_folha_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: config_fechamento_folha config_fechamento_folha_instituicao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_fechamento_folha
    ADD CONSTRAINT config_fechamento_folha_instituicao_id_fkey FOREIGN KEY (instituicao_id) REFERENCES public.config_institucional(id) ON DELETE SET NULL;


--
-- Name: config_fechamento_folha config_fechamento_folha_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_fechamento_folha
    ADD CONSTRAINT config_fechamento_folha_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: config_fechamento_frequencia config_fechamento_frequencia_consolidado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_fechamento_frequencia
    ADD CONSTRAINT config_fechamento_frequencia_consolidado_por_fkey FOREIGN KEY (consolidado_por) REFERENCES auth.users(id);


--
-- Name: config_fechamento_frequencia config_fechamento_frequencia_fechado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_fechamento_frequencia
    ADD CONSTRAINT config_fechamento_frequencia_fechado_por_fkey FOREIGN KEY (fechado_por) REFERENCES auth.users(id);


--
-- Name: config_fechamento_frequencia config_fechamento_frequencia_instituicao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_fechamento_frequencia
    ADD CONSTRAINT config_fechamento_frequencia_instituicao_id_fkey FOREIGN KEY (instituicao_id) REFERENCES public.config_institucional(id);


--
-- Name: config_incidencias config_incidencias_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_incidencias
    ADD CONSTRAINT config_incidencias_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: config_incidencias config_incidencias_instituicao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_incidencias
    ADD CONSTRAINT config_incidencias_instituicao_id_fkey FOREIGN KEY (instituicao_id) REFERENCES public.config_institucional(id) ON DELETE SET NULL;


--
-- Name: config_incidencias config_incidencias_rubrica_destino_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_incidencias
    ADD CONSTRAINT config_incidencias_rubrica_destino_id_fkey FOREIGN KEY (rubrica_destino_id) REFERENCES public.config_rubricas(id) ON DELETE CASCADE;


--
-- Name: config_incidencias config_incidencias_rubrica_origem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_incidencias
    ADD CONSTRAINT config_incidencias_rubrica_origem_id_fkey FOREIGN KEY (rubrica_origem_id) REFERENCES public.config_rubricas(id) ON DELETE CASCADE;


--
-- Name: config_institucional config_institucional_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_institucional
    ADD CONSTRAINT config_institucional_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: config_institucional config_institucional_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_institucional
    ADD CONSTRAINT config_institucional_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: config_jornada_padrao config_jornada_padrao_cargo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_jornada_padrao
    ADD CONSTRAINT config_jornada_padrao_cargo_id_fkey FOREIGN KEY (cargo_id) REFERENCES public.cargos(id);


--
-- Name: config_jornada_padrao config_jornada_padrao_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_jornada_padrao
    ADD CONSTRAINT config_jornada_padrao_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: config_jornada_padrao config_jornada_padrao_instituicao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_jornada_padrao
    ADD CONSTRAINT config_jornada_padrao_instituicao_id_fkey FOREIGN KEY (instituicao_id) REFERENCES public.config_institucional(id);


--
-- Name: config_jornada_padrao config_jornada_padrao_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_jornada_padrao
    ADD CONSTRAINT config_jornada_padrao_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.servidores(id);


--
-- Name: config_jornada_padrao config_jornada_padrao_unidade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_jornada_padrao
    ADD CONSTRAINT config_jornada_padrao_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.estrutura_organizacional(id);


--
-- Name: config_jornada_padrao config_jornada_padrao_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_jornada_padrao
    ADD CONSTRAINT config_jornada_padrao_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: config_menu_publico config_menu_publico_alterado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_menu_publico
    ADD CONSTRAINT config_menu_publico_alterado_por_fkey FOREIGN KEY (alterado_por) REFERENCES auth.users(id);


--
-- Name: config_motivos_desligamento config_motivos_desligamento_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_motivos_desligamento
    ADD CONSTRAINT config_motivos_desligamento_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: config_motivos_desligamento config_motivos_desligamento_instituicao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_motivos_desligamento
    ADD CONSTRAINT config_motivos_desligamento_instituicao_id_fkey FOREIGN KEY (instituicao_id) REFERENCES public.config_institucional(id);


--
-- Name: config_motivos_desligamento config_motivos_desligamento_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_motivos_desligamento
    ADD CONSTRAINT config_motivos_desligamento_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: config_paginas_historico config_paginas_historico_pagina_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_paginas_historico
    ADD CONSTRAINT config_paginas_historico_pagina_id_fkey FOREIGN KEY (pagina_id) REFERENCES public.config_paginas_publicas(id) ON DELETE CASCADE;


--
-- Name: config_paginas_historico config_paginas_historico_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_paginas_historico
    ADD CONSTRAINT config_paginas_historico_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES auth.users(id);


--
-- Name: config_paginas_publicas config_paginas_publicas_alterado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_paginas_publicas
    ADD CONSTRAINT config_paginas_publicas_alterado_por_fkey FOREIGN KEY (alterado_por) REFERENCES auth.users(id);


--
-- Name: config_parametros_meta config_parametros_meta_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_parametros_meta
    ADD CONSTRAINT config_parametros_meta_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: config_parametros_valores config_parametros_valores_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_parametros_valores
    ADD CONSTRAINT config_parametros_valores_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: config_parametros_valores config_parametros_valores_instituicao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_parametros_valores
    ADD CONSTRAINT config_parametros_valores_instituicao_id_fkey FOREIGN KEY (instituicao_id) REFERENCES public.config_institucional(id);


--
-- Name: config_parametros_valores config_parametros_valores_parametro_codigo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_parametros_valores
    ADD CONSTRAINT config_parametros_valores_parametro_codigo_fkey FOREIGN KEY (parametro_codigo) REFERENCES public.config_parametros_meta(codigo);


--
-- Name: config_parametros_valores config_parametros_valores_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_parametros_valores
    ADD CONSTRAINT config_parametros_valores_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.servidores(id);


--
-- Name: config_parametros_valores config_parametros_valores_unidade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_parametros_valores
    ADD CONSTRAINT config_parametros_valores_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.estrutura_organizacional(id);


--
-- Name: config_parametros_valores config_parametros_valores_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_parametros_valores
    ADD CONSTRAINT config_parametros_valores_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: config_parametros_valores config_parametros_valores_versao_anterior_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_parametros_valores
    ADD CONSTRAINT config_parametros_valores_versao_anterior_id_fkey FOREIGN KEY (versao_anterior_id) REFERENCES public.config_parametros_valores(id);


--
-- Name: config_regras_calculo config_regras_calculo_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_regras_calculo
    ADD CONSTRAINT config_regras_calculo_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: config_regras_calculo config_regras_calculo_instituicao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_regras_calculo
    ADD CONSTRAINT config_regras_calculo_instituicao_id_fkey FOREIGN KEY (instituicao_id) REFERENCES public.config_institucional(id) ON DELETE SET NULL;


--
-- Name: config_regras_calculo config_regras_calculo_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_regras_calculo
    ADD CONSTRAINT config_regras_calculo_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: config_rubricas config_rubricas_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_rubricas
    ADD CONSTRAINT config_rubricas_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: config_rubricas config_rubricas_instituicao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_rubricas
    ADD CONSTRAINT config_rubricas_instituicao_id_fkey FOREIGN KEY (instituicao_id) REFERENCES public.config_institucional(id) ON DELETE SET NULL;


--
-- Name: config_rubricas config_rubricas_rubrica_base_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_rubricas
    ADD CONSTRAINT config_rubricas_rubrica_base_id_fkey FOREIGN KEY (rubrica_base_id) REFERENCES public.config_rubricas(id);


--
-- Name: config_rubricas config_rubricas_tipo_rubrica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_rubricas
    ADD CONSTRAINT config_rubricas_tipo_rubrica_id_fkey FOREIGN KEY (tipo_rubrica_id) REFERENCES public.config_tipos_rubrica(id) ON DELETE SET NULL;


--
-- Name: config_rubricas config_rubricas_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_rubricas
    ADD CONSTRAINT config_rubricas_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: config_situacoes_funcionais config_situacoes_funcionais_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_situacoes_funcionais
    ADD CONSTRAINT config_situacoes_funcionais_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: config_situacoes_funcionais config_situacoes_funcionais_instituicao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_situacoes_funcionais
    ADD CONSTRAINT config_situacoes_funcionais_instituicao_id_fkey FOREIGN KEY (instituicao_id) REFERENCES public.config_institucional(id);


--
-- Name: config_situacoes_funcionais config_situacoes_funcionais_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_situacoes_funcionais
    ADD CONSTRAINT config_situacoes_funcionais_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: config_tipos_ato config_tipos_ato_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_tipos_ato
    ADD CONSTRAINT config_tipos_ato_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: config_tipos_ato config_tipos_ato_instituicao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_tipos_ato
    ADD CONSTRAINT config_tipos_ato_instituicao_id_fkey FOREIGN KEY (instituicao_id) REFERENCES public.config_institucional(id);


--
-- Name: config_tipos_ato config_tipos_ato_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_tipos_ato
    ADD CONSTRAINT config_tipos_ato_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: config_tipos_onus config_tipos_onus_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_tipos_onus
    ADD CONSTRAINT config_tipos_onus_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: config_tipos_onus config_tipos_onus_instituicao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_tipos_onus
    ADD CONSTRAINT config_tipos_onus_instituicao_id_fkey FOREIGN KEY (instituicao_id) REFERENCES public.config_institucional(id);


--
-- Name: config_tipos_rubrica config_tipos_rubrica_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_tipos_rubrica
    ADD CONSTRAINT config_tipos_rubrica_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: config_tipos_rubrica config_tipos_rubrica_instituicao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_tipos_rubrica
    ADD CONSTRAINT config_tipos_rubrica_instituicao_id_fkey FOREIGN KEY (instituicao_id) REFERENCES public.config_institucional(id) ON DELETE SET NULL;


--
-- Name: config_tipos_rubrica config_tipos_rubrica_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_tipos_rubrica
    ADD CONSTRAINT config_tipos_rubrica_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: config_tipos_servidor config_tipos_servidor_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_tipos_servidor
    ADD CONSTRAINT config_tipos_servidor_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: config_tipos_servidor config_tipos_servidor_instituicao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_tipos_servidor
    ADD CONSTRAINT config_tipos_servidor_instituicao_id_fkey FOREIGN KEY (instituicao_id) REFERENCES public.config_institucional(id);


--
-- Name: config_tipos_servidor config_tipos_servidor_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_tipos_servidor
    ADD CONSTRAINT config_tipos_servidor_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: configuracao_jornada configuracao_jornada_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracao_jornada
    ADD CONSTRAINT configuracao_jornada_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: consignacoes consignacoes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consignacoes
    ADD CONSTRAINT consignacoes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: consignacoes consignacoes_rubrica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consignacoes
    ADD CONSTRAINT consignacoes_rubrica_id_fkey FOREIGN KEY (rubrica_id) REFERENCES public.rubricas(id);


--
-- Name: consignacoes consignacoes_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consignacoes
    ADD CONSTRAINT consignacoes_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.servidores(id);


--
-- Name: contas_autarquia contas_autarquia_banco_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contas_autarquia
    ADD CONSTRAINT contas_autarquia_banco_id_fkey FOREIGN KEY (banco_id) REFERENCES public.bancos_cnab(id);


--
-- Name: contas_autarquia contas_autarquia_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contas_autarquia
    ADD CONSTRAINT contas_autarquia_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: conteudo_rascunho conteudo_rascunho_aprovado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conteudo_rascunho
    ADD CONSTRAINT conteudo_rascunho_aprovado_por_fkey FOREIGN KEY (aprovado_por) REFERENCES auth.users(id);


--
-- Name: conteudo_rascunho conteudo_rascunho_atualizado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conteudo_rascunho
    ADD CONSTRAINT conteudo_rascunho_atualizado_por_fkey FOREIGN KEY (atualizado_por) REFERENCES auth.users(id);


--
-- Name: conteudo_rascunho conteudo_rascunho_criado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conteudo_rascunho
    ADD CONSTRAINT conteudo_rascunho_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES auth.users(id);


--
-- Name: contratos contratos_fiscal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT contratos_fiscal_id_fkey FOREIGN KEY (fiscal_id) REFERENCES public.servidores(id);


--
-- Name: contratos contratos_fornecedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT contratos_fornecedor_id_fkey FOREIGN KEY (fornecedor_id) REFERENCES public.fornecedores(id);


--
-- Name: contratos contratos_gestor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT contratos_gestor_id_fkey FOREIGN KEY (gestor_id) REFERENCES public.servidores(id);


--
-- Name: contratos contratos_processo_licitatorio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT contratos_processo_licitatorio_id_fkey FOREIGN KEY (processo_licitatorio_id) REFERENCES public.processos_licitatorios(id);


--
-- Name: controles_internos controles_internos_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.controles_internos
    ADD CONSTRAINT controles_internos_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: controles_internos controles_internos_processo_raci_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.controles_internos
    ADD CONSTRAINT controles_internos_processo_raci_id_fkey FOREIGN KEY (processo_raci_id) REFERENCES public.matriz_raci_processos(id);


--
-- Name: controles_internos controles_internos_responsavel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.controles_internos
    ADD CONSTRAINT controles_internos_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES public.servidores(id);


--
-- Name: controles_internos controles_internos_risco_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.controles_internos
    ADD CONSTRAINT controles_internos_risco_id_fkey FOREIGN KEY (risco_id) REFERENCES public.riscos_institucionais(id);


--
-- Name: controles_internos controles_internos_unidade_responsavel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.controles_internos
    ADD CONSTRAINT controles_internos_unidade_responsavel_id_fkey FOREIGN KEY (unidade_responsavel_id) REFERENCES public.estrutura_organizacional(id);


--
-- Name: controles_internos controles_internos_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.controles_internos
    ADD CONSTRAINT controles_internos_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: creditos_adicionais creditos_adicionais_dotacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.creditos_adicionais
    ADD CONSTRAINT creditos_adicionais_dotacao_id_fkey FOREIGN KEY (dotacao_id) REFERENCES public.dotacoes_orcamentarias(id) ON DELETE CASCADE;


--
-- Name: creditos_adicionais creditos_adicionais_dotacao_origem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.creditos_adicionais
    ADD CONSTRAINT creditos_adicionais_dotacao_origem_id_fkey FOREIGN KEY (dotacao_origem_id) REFERENCES public.dotacoes_orcamentarias(id);


--
-- Name: dados_oficiais dados_oficiais_ultima_alteracao_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dados_oficiais
    ADD CONSTRAINT dados_oficiais_ultima_alteracao_por_fkey FOREIGN KEY (ultima_alteracao_por) REFERENCES auth.users(id);


--
-- Name: datas_importantes datas_importantes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.datas_importantes
    ADD CONSTRAINT datas_importantes_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: decisoes_administrativas decisoes_administrativas_autoridade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.decisoes_administrativas
    ADD CONSTRAINT decisoes_administrativas_autoridade_id_fkey FOREIGN KEY (autoridade_id) REFERENCES public.servidores(id);


--
-- Name: decisoes_administrativas decisoes_administrativas_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.decisoes_administrativas
    ADD CONSTRAINT decisoes_administrativas_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: decisoes_administrativas decisoes_administrativas_unidade_origem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.decisoes_administrativas
    ADD CONSTRAINT decisoes_administrativas_unidade_origem_id_fkey FOREIGN KEY (unidade_origem_id) REFERENCES public.estrutura_organizacional(id);


--
-- Name: decisoes_administrativas decisoes_administrativas_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.decisoes_administrativas
    ADD CONSTRAINT decisoes_administrativas_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: demandas_ascom_anexos demandas_ascom_anexos_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demandas_ascom_anexos
    ADD CONSTRAINT demandas_ascom_anexos_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: demandas_ascom_anexos demandas_ascom_anexos_demanda_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demandas_ascom_anexos
    ADD CONSTRAINT demandas_ascom_anexos_demanda_id_fkey FOREIGN KEY (demanda_id) REFERENCES public.demandas_ascom(id) ON DELETE CASCADE;


--
-- Name: demandas_ascom demandas_ascom_aprovado_por_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demandas_ascom
    ADD CONSTRAINT demandas_ascom_aprovado_por_id_fkey FOREIGN KEY (aprovado_por_id) REFERENCES public.servidores(id);


--
-- Name: demandas_ascom demandas_ascom_autorizado_presidencia_por_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demandas_ascom
    ADD CONSTRAINT demandas_ascom_autorizado_presidencia_por_id_fkey FOREIGN KEY (autorizado_presidencia_por_id) REFERENCES public.servidores(id);


--
-- Name: demandas_ascom_comentarios demandas_ascom_comentarios_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demandas_ascom_comentarios
    ADD CONSTRAINT demandas_ascom_comentarios_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: demandas_ascom_comentarios demandas_ascom_comentarios_demanda_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demandas_ascom_comentarios
    ADD CONSTRAINT demandas_ascom_comentarios_demanda_id_fkey FOREIGN KEY (demanda_id) REFERENCES public.demandas_ascom(id) ON DELETE CASCADE;


--
-- Name: demandas_ascom demandas_ascom_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demandas_ascom
    ADD CONSTRAINT demandas_ascom_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: demandas_ascom_entregaveis demandas_ascom_entregaveis_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demandas_ascom_entregaveis
    ADD CONSTRAINT demandas_ascom_entregaveis_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: demandas_ascom_entregaveis demandas_ascom_entregaveis_demanda_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demandas_ascom_entregaveis
    ADD CONSTRAINT demandas_ascom_entregaveis_demanda_id_fkey FOREIGN KEY (demanda_id) REFERENCES public.demandas_ascom(id) ON DELETE CASCADE;


--
-- Name: demandas_ascom demandas_ascom_responsavel_ascom_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demandas_ascom
    ADD CONSTRAINT demandas_ascom_responsavel_ascom_id_fkey FOREIGN KEY (responsavel_ascom_id) REFERENCES public.servidores(id);


--
-- Name: demandas_ascom demandas_ascom_servidor_solicitante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demandas_ascom
    ADD CONSTRAINT demandas_ascom_servidor_solicitante_id_fkey FOREIGN KEY (servidor_solicitante_id) REFERENCES public.servidores(id);


--
-- Name: demandas_ascom demandas_ascom_unidade_solicitante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demandas_ascom
    ADD CONSTRAINT demandas_ascom_unidade_solicitante_id_fkey FOREIGN KEY (unidade_solicitante_id) REFERENCES public.estrutura_organizacional(id);


--
-- Name: demandas_ascom demandas_ascom_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demandas_ascom
    ADD CONSTRAINT demandas_ascom_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: denuncias denuncias_atualizado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.denuncias
    ADD CONSTRAINT denuncias_atualizado_por_fkey FOREIGN KEY (atualizado_por) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: dependentes_irrf dependentes_irrf_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dependentes_irrf
    ADD CONSTRAINT dependentes_irrf_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: dependentes_irrf dependentes_irrf_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dependentes_irrf
    ADD CONSTRAINT dependentes_irrf_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.servidores(id);


--
-- Name: designacoes designacoes_aprovado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.designacoes
    ADD CONSTRAINT designacoes_aprovado_por_fkey FOREIGN KEY (aprovado_por) REFERENCES public.profiles(id);


--
-- Name: designacoes designacoes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.designacoes
    ADD CONSTRAINT designacoes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: designacoes designacoes_lotacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.designacoes
    ADD CONSTRAINT designacoes_lotacao_id_fkey FOREIGN KEY (lotacao_id) REFERENCES public.lotacoes(id);


--
-- Name: designacoes designacoes_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.designacoes
    ADD CONSTRAINT designacoes_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.servidores(id) ON DELETE CASCADE;


--
-- Name: designacoes designacoes_unidade_destino_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.designacoes
    ADD CONSTRAINT designacoes_unidade_destino_id_fkey FOREIGN KEY (unidade_destino_id) REFERENCES public.estrutura_organizacional(id);


--
-- Name: designacoes designacoes_unidade_origem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.designacoes
    ADD CONSTRAINT designacoes_unidade_origem_id_fkey FOREIGN KEY (unidade_origem_id) REFERENCES public.estrutura_organizacional(id);


--
-- Name: despachos despachos_autoridade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.despachos
    ADD CONSTRAINT despachos_autoridade_id_fkey FOREIGN KEY (autoridade_id) REFERENCES public.servidores(id);


--
-- Name: despachos despachos_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.despachos
    ADD CONSTRAINT despachos_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: despachos despachos_movimentacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.despachos
    ADD CONSTRAINT despachos_movimentacao_id_fkey FOREIGN KEY (movimentacao_id) REFERENCES public.movimentacoes_processo(id);


--
-- Name: despachos despachos_processo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.despachos
    ADD CONSTRAINT despachos_processo_id_fkey FOREIGN KEY (processo_id) REFERENCES public.processos_administrativos(id) ON DELETE CASCADE;


--
-- Name: dias_nao_uteis dias_nao_uteis_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dias_nao_uteis
    ADD CONSTRAINT dias_nao_uteis_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: dias_nao_uteis dias_nao_uteis_instituicao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dias_nao_uteis
    ADD CONSTRAINT dias_nao_uteis_instituicao_id_fkey FOREIGN KEY (instituicao_id) REFERENCES public.config_institucional(id);


--
-- Name: dias_nao_uteis dias_nao_uteis_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dias_nao_uteis
    ADD CONSTRAINT dias_nao_uteis_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: documentos documentos_cargo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos
    ADD CONSTRAINT documentos_cargo_id_fkey FOREIGN KEY (cargo_id) REFERENCES public.cargos(id) ON DELETE SET NULL;


--
-- Name: documentos_cedencia documentos_cedencia_agenda_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos_cedencia
    ADD CONSTRAINT documentos_cedencia_agenda_id_fkey FOREIGN KEY (agenda_id) REFERENCES public.agenda_unidade(id) ON DELETE CASCADE;


--
-- Name: documentos documentos_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos
    ADD CONSTRAINT documentos_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: documentos documentos_designacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos
    ADD CONSTRAINT documentos_designacao_id_fkey FOREIGN KEY (designacao_id) REFERENCES public.designacoes(id) ON DELETE SET NULL;


--
-- Name: documentos_preparatorios_licitacao documentos_preparatorios_licitacao_aprovado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos_preparatorios_licitacao
    ADD CONSTRAINT documentos_preparatorios_licitacao_aprovado_por_fkey FOREIGN KEY (aprovado_por) REFERENCES public.servidores(id);


--
-- Name: documentos_preparatorios_licitacao documentos_preparatorios_licitacao_processo_licitatorio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos_preparatorios_licitacao
    ADD CONSTRAINT documentos_preparatorios_licitacao_processo_licitatorio_id_fkey FOREIGN KEY (processo_licitatorio_id) REFERENCES public.processos_licitatorios(id) ON DELETE CASCADE;


--
-- Name: documentos_preparatorios_licitacao documentos_preparatorios_licitacao_responsavel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos_preparatorios_licitacao
    ADD CONSTRAINT documentos_preparatorios_licitacao_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES public.servidores(id);


--
-- Name: documentos_processo documentos_processo_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos_processo
    ADD CONSTRAINT documentos_processo_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: documentos_processo documentos_processo_processo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos_processo
    ADD CONSTRAINT documentos_processo_processo_id_fkey FOREIGN KEY (processo_id) REFERENCES public.processos_administrativos(id) ON DELETE CASCADE;


--
-- Name: documentos documentos_provimento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos
    ADD CONSTRAINT documentos_provimento_id_fkey FOREIGN KEY (provimento_id) REFERENCES public.provimentos(id) ON DELETE SET NULL;


--
-- Name: documentos_requerimento_servidor documentos_requerimento_servidor_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos_requerimento_servidor
    ADD CONSTRAINT documentos_requerimento_servidor_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: documentos_requerimento_servidor documentos_requerimento_servidor_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos_requerimento_servidor
    ADD CONSTRAINT documentos_requerimento_servidor_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.servidores(id) ON DELETE CASCADE;


--
-- Name: documentos documentos_responsavel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos
    ADD CONSTRAINT documentos_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES public.servidores(id);


--
-- Name: documentos documentos_unidade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos
    ADD CONSTRAINT documentos_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.estrutura_organizacional(id) ON DELETE SET NULL;


--
-- Name: dotacoes_orcamentarias dotacoes_orcamentarias_centro_custo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dotacoes_orcamentarias
    ADD CONSTRAINT dotacoes_orcamentarias_centro_custo_id_fkey FOREIGN KEY (centro_custo_id) REFERENCES public.centros_custo(id);


--
-- Name: empenhos empenhos_contrato_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empenhos
    ADD CONSTRAINT empenhos_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES public.contratos(id);


--
-- Name: empenhos empenhos_dotacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empenhos
    ADD CONSTRAINT empenhos_dotacao_id_fkey FOREIGN KEY (dotacao_id) REFERENCES public.dotacoes_orcamentarias(id);


--
-- Name: empenhos empenhos_fornecedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empenhos
    ADD CONSTRAINT empenhos_fornecedor_id_fkey FOREIGN KEY (fornecedor_id) REFERENCES public.fornecedores(id);


--
-- Name: empenhos empenhos_processo_licitatorio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empenhos
    ADD CONSTRAINT empenhos_processo_licitatorio_id_fkey FOREIGN KEY (processo_licitatorio_id) REFERENCES public.processos_licitatorios(id);


--
-- Name: encaminhamentos encaminhamentos_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encaminhamentos
    ADD CONSTRAINT encaminhamentos_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: encaminhamentos encaminhamentos_recebido_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encaminhamentos
    ADD CONSTRAINT encaminhamentos_recebido_por_fkey FOREIGN KEY (recebido_por) REFERENCES auth.users(id);


--
-- Name: encaminhamentos encaminhamentos_servidor_destino_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encaminhamentos
    ADD CONSTRAINT encaminhamentos_servidor_destino_id_fkey FOREIGN KEY (servidor_destino_id) REFERENCES public.servidores(id);


--
-- Name: encaminhamentos encaminhamentos_unidade_destino_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encaminhamentos
    ADD CONSTRAINT encaminhamentos_unidade_destino_id_fkey FOREIGN KEY (unidade_destino_id) REFERENCES public.estrutura_organizacional(id);


--
-- Name: envios_log envios_log_disparado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.envios_log
    ADD CONSTRAINT envios_log_disparado_por_fkey FOREIGN KEY (disparado_por) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: estoque estoque_almoxarifado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estoque
    ADD CONSTRAINT estoque_almoxarifado_id_fkey FOREIGN KEY (almoxarifado_id) REFERENCES public.almoxarifados(id) ON DELETE CASCADE;


--
-- Name: estoque estoque_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estoque
    ADD CONSTRAINT estoque_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.itens_material(id) ON DELETE CASCADE;


--
-- Name: estrutura_organizacional estrutura_organizacional_servidor_responsavel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estrutura_organizacional
    ADD CONSTRAINT estrutura_organizacional_servidor_responsavel_id_fkey FOREIGN KEY (servidor_responsavel_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: estrutura_organizacional estrutura_organizacional_superior_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estrutura_organizacional
    ADD CONSTRAINT estrutura_organizacional_superior_id_fkey FOREIGN KEY (superior_id) REFERENCES public.estrutura_organizacional(id) ON DELETE SET NULL;


--
-- Name: eventos_esocial eventos_esocial_folha_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eventos_esocial
    ADD CONSTRAINT eventos_esocial_folha_id_fkey FOREIGN KEY (folha_id) REFERENCES public.folhas_pagamento(id);


--
-- Name: eventos_esocial eventos_esocial_gerado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eventos_esocial
    ADD CONSTRAINT eventos_esocial_gerado_por_fkey FOREIGN KEY (gerado_por) REFERENCES public.profiles(id);


--
-- Name: eventos_esocial eventos_esocial_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eventos_esocial
    ADD CONSTRAINT eventos_esocial_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.servidores(id);


--
-- Name: evidencias_controle evidencias_controle_controle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evidencias_controle
    ADD CONSTRAINT evidencias_controle_controle_id_fkey FOREIGN KEY (controle_id) REFERENCES public.controles_internos(id) ON DELETE CASCADE;


--
-- Name: evidencias_controle evidencias_controle_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evidencias_controle
    ADD CONSTRAINT evidencias_controle_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: exportacoes_folha exportacoes_folha_banco_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exportacoes_folha
    ADD CONSTRAINT exportacoes_folha_banco_id_fkey FOREIGN KEY (banco_id) REFERENCES public.bancos_cnab(id);


--
-- Name: exportacoes_folha exportacoes_folha_enviado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exportacoes_folha
    ADD CONSTRAINT exportacoes_folha_enviado_por_fkey FOREIGN KEY (enviado_por) REFERENCES public.profiles(id);


--
-- Name: exportacoes_folha exportacoes_folha_folha_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exportacoes_folha
    ADD CONSTRAINT exportacoes_folha_folha_id_fkey FOREIGN KEY (folha_id) REFERENCES public.folhas_pagamento(id);


--
-- Name: exportacoes_folha exportacoes_folha_gerado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exportacoes_folha
    ADD CONSTRAINT exportacoes_folha_gerado_por_fkey FOREIGN KEY (gerado_por) REFERENCES public.profiles(id);


--
-- Name: federacao_arbitros federacao_arbitros_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.federacao_arbitros
    ADD CONSTRAINT federacao_arbitros_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: federacao_arbitros federacao_arbitros_federacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.federacao_arbitros
    ADD CONSTRAINT federacao_arbitros_federacao_id_fkey FOREIGN KEY (federacao_id) REFERENCES public.federacoes_esportivas(id) ON DELETE CASCADE;


--
-- Name: federacao_espacos_cedidos federacao_espacos_cedidos_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.federacao_espacos_cedidos
    ADD CONSTRAINT federacao_espacos_cedidos_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: federacao_espacos_cedidos federacao_espacos_cedidos_federacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.federacao_espacos_cedidos
    ADD CONSTRAINT federacao_espacos_cedidos_federacao_id_fkey FOREIGN KEY (federacao_id) REFERENCES public.federacoes_esportivas(id) ON DELETE CASCADE;


--
-- Name: federacao_espacos_cedidos federacao_espacos_cedidos_unidade_local_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.federacao_espacos_cedidos
    ADD CONSTRAINT federacao_espacos_cedidos_unidade_local_id_fkey FOREIGN KEY (unidade_local_id) REFERENCES public.unidades_locais(id);


--
-- Name: federacao_parcerias federacao_parcerias_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.federacao_parcerias
    ADD CONSTRAINT federacao_parcerias_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: federacao_parcerias federacao_parcerias_federacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.federacao_parcerias
    ADD CONSTRAINT federacao_parcerias_federacao_id_fkey FOREIGN KEY (federacao_id) REFERENCES public.federacoes_esportivas(id) ON DELETE CASCADE;


--
-- Name: federacoes_esportivas federacoes_esportivas_analisado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.federacoes_esportivas
    ADD CONSTRAINT federacoes_esportivas_analisado_por_fkey FOREIGN KEY (analisado_por) REFERENCES auth.users(id);


--
-- Name: ferias_servidor ferias_servidor_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ferias_servidor
    ADD CONSTRAINT ferias_servidor_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: ferias_servidor ferias_servidor_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ferias_servidor
    ADD CONSTRAINT ferias_servidor_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.servidores(id) ON DELETE CASCADE;


--
-- Name: fichas_financeiras fichas_financeiras_cargo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fichas_financeiras
    ADD CONSTRAINT fichas_financeiras_cargo_id_fkey FOREIGN KEY (cargo_id) REFERENCES public.cargos(id);


--
-- Name: fichas_financeiras fichas_financeiras_centro_custo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fichas_financeiras
    ADD CONSTRAINT fichas_financeiras_centro_custo_id_fkey FOREIGN KEY (centro_custo_id) REFERENCES public.centros_custo(id);


--
-- Name: fichas_financeiras fichas_financeiras_folha_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fichas_financeiras
    ADD CONSTRAINT fichas_financeiras_folha_id_fkey FOREIGN KEY (folha_id) REFERENCES public.folhas_pagamento(id) ON DELETE CASCADE;


--
-- Name: fichas_financeiras fichas_financeiras_lotacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fichas_financeiras
    ADD CONSTRAINT fichas_financeiras_lotacao_id_fkey FOREIGN KEY (lotacao_id) REFERENCES public.lotacoes(id);


--
-- Name: fichas_financeiras fichas_financeiras_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fichas_financeiras
    ADD CONSTRAINT fichas_financeiras_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.servidores(id);


--
-- Name: fichas_financeiras fichas_financeiras_unidade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fichas_financeiras
    ADD CONSTRAINT fichas_financeiras_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.estrutura_organizacional(id);


--
-- Name: fin_acoes_orcamentarias fin_acoes_orcamentarias_programa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_acoes_orcamentarias
    ADD CONSTRAINT fin_acoes_orcamentarias_programa_id_fkey FOREIGN KEY (programa_id) REFERENCES public.fin_programas_orcamentarios(id);


--
-- Name: fin_adiantamento_itens fin_adiantamento_itens_adiantamento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_adiantamento_itens
    ADD CONSTRAINT fin_adiantamento_itens_adiantamento_id_fkey FOREIGN KEY (adiantamento_id) REFERENCES public.fin_adiantamentos(id) ON DELETE CASCADE;


--
-- Name: fin_adiantamento_itens fin_adiantamento_itens_validado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_adiantamento_itens
    ADD CONSTRAINT fin_adiantamento_itens_validado_por_fkey FOREIGN KEY (validado_por) REFERENCES auth.users(id);


--
-- Name: fin_adiantamentos fin_adiantamentos_autorizado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_adiantamentos
    ADD CONSTRAINT fin_adiantamentos_autorizado_por_fkey FOREIGN KEY (autorizado_por) REFERENCES auth.users(id);


--
-- Name: fin_adiantamentos fin_adiantamentos_conta_bancaria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_adiantamentos
    ADD CONSTRAINT fin_adiantamentos_conta_bancaria_id_fkey FOREIGN KEY (conta_bancaria_id) REFERENCES public.fin_contas_bancarias(id);


--
-- Name: fin_adiantamentos fin_adiantamentos_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_adiantamentos
    ADD CONSTRAINT fin_adiantamentos_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: fin_adiantamentos fin_adiantamentos_dotacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_adiantamentos
    ADD CONSTRAINT fin_adiantamentos_dotacao_id_fkey FOREIGN KEY (dotacao_id) REFERENCES public.fin_dotacoes(id);


--
-- Name: fin_adiantamentos fin_adiantamentos_empenho_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_adiantamentos
    ADD CONSTRAINT fin_adiantamentos_empenho_id_fkey FOREIGN KEY (empenho_id) REFERENCES public.fin_empenhos(id);


--
-- Name: fin_adiantamentos fin_adiantamentos_liberado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_adiantamentos
    ADD CONSTRAINT fin_adiantamentos_liberado_por_fkey FOREIGN KEY (liberado_por) REFERENCES auth.users(id);


--
-- Name: fin_adiantamentos fin_adiantamentos_prestacao_aprovada_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_adiantamentos
    ADD CONSTRAINT fin_adiantamentos_prestacao_aprovada_por_fkey FOREIGN KEY (prestacao_aprovada_por) REFERENCES auth.users(id);


--
-- Name: fin_adiantamentos fin_adiantamentos_servidor_suprido_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_adiantamentos
    ADD CONSTRAINT fin_adiantamentos_servidor_suprido_id_fkey FOREIGN KEY (servidor_suprido_id) REFERENCES public.servidores(id);


--
-- Name: fin_adiantamentos fin_adiantamentos_unidade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_adiantamentos
    ADD CONSTRAINT fin_adiantamentos_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.estrutura_organizacional(id);


--
-- Name: fin_alteracoes_orcamentarias fin_alteracoes_orcamentarias_aprovado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_alteracoes_orcamentarias
    ADD CONSTRAINT fin_alteracoes_orcamentarias_aprovado_por_fkey FOREIGN KEY (aprovado_por) REFERENCES auth.users(id);


--
-- Name: fin_alteracoes_orcamentarias fin_alteracoes_orcamentarias_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_alteracoes_orcamentarias
    ADD CONSTRAINT fin_alteracoes_orcamentarias_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: fin_alteracoes_orcamentarias fin_alteracoes_orcamentarias_dotacao_destino_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_alteracoes_orcamentarias
    ADD CONSTRAINT fin_alteracoes_orcamentarias_dotacao_destino_id_fkey FOREIGN KEY (dotacao_destino_id) REFERENCES public.fin_dotacoes(id);


--
-- Name: fin_alteracoes_orcamentarias fin_alteracoes_orcamentarias_dotacao_origem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_alteracoes_orcamentarias
    ADD CONSTRAINT fin_alteracoes_orcamentarias_dotacao_origem_id_fkey FOREIGN KEY (dotacao_origem_id) REFERENCES public.fin_dotacoes(id);


--
-- Name: fin_checklist_ci fin_checklist_ci_solicitacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_checklist_ci
    ADD CONSTRAINT fin_checklist_ci_solicitacao_id_fkey FOREIGN KEY (solicitacao_id) REFERENCES public.fin_solicitacoes(id);


--
-- Name: fin_checklist_ci fin_checklist_ci_verificado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_checklist_ci
    ADD CONSTRAINT fin_checklist_ci_verificado_por_fkey FOREIGN KEY (verificado_por) REFERENCES auth.users(id);


--
-- Name: fin_contas_bancarias fin_contas_bancarias_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_contas_bancarias
    ADD CONSTRAINT fin_contas_bancarias_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: fin_contas_bancarias fin_contas_bancarias_fonte_recurso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_contas_bancarias
    ADD CONSTRAINT fin_contas_bancarias_fonte_recurso_id_fkey FOREIGN KEY (fonte_recurso_id) REFERENCES public.fin_fontes_recurso(id);


--
-- Name: fin_contas_bancarias fin_contas_bancarias_responsavel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_contas_bancarias
    ADD CONSTRAINT fin_contas_bancarias_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES public.servidores(id);


--
-- Name: fin_documentos fin_documentos_documento_anterior_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_documentos
    ADD CONSTRAINT fin_documentos_documento_anterior_id_fkey FOREIGN KEY (documento_anterior_id) REFERENCES public.fin_documentos(id);


--
-- Name: fin_documentos fin_documentos_excluido_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_documentos
    ADD CONSTRAINT fin_documentos_excluido_por_fkey FOREIGN KEY (excluido_por) REFERENCES auth.users(id);


--
-- Name: fin_documentos fin_documentos_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_documentos
    ADD CONSTRAINT fin_documentos_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES auth.users(id);


--
-- Name: fin_dotacoes fin_dotacoes_acao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_dotacoes
    ADD CONSTRAINT fin_dotacoes_acao_id_fkey FOREIGN KEY (acao_id) REFERENCES public.fin_acoes_orcamentarias(id);


--
-- Name: fin_dotacoes fin_dotacoes_conta_contabil_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_dotacoes
    ADD CONSTRAINT fin_dotacoes_conta_contabil_id_fkey FOREIGN KEY (conta_contabil_id) REFERENCES public.fin_plano_contas(id);


--
-- Name: fin_dotacoes fin_dotacoes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_dotacoes
    ADD CONSTRAINT fin_dotacoes_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: fin_dotacoes fin_dotacoes_fonte_recurso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_dotacoes
    ADD CONSTRAINT fin_dotacoes_fonte_recurso_id_fkey FOREIGN KEY (fonte_recurso_id) REFERENCES public.fin_fontes_recurso(id);


--
-- Name: fin_dotacoes fin_dotacoes_natureza_despesa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_dotacoes
    ADD CONSTRAINT fin_dotacoes_natureza_despesa_id_fkey FOREIGN KEY (natureza_despesa_id) REFERENCES public.fin_naturezas_despesa(id);


--
-- Name: fin_dotacoes fin_dotacoes_programa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_dotacoes
    ADD CONSTRAINT fin_dotacoes_programa_id_fkey FOREIGN KEY (programa_id) REFERENCES public.fin_programas_orcamentarios(id);


--
-- Name: fin_dotacoes fin_dotacoes_unidade_orcamentaria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_dotacoes
    ADD CONSTRAINT fin_dotacoes_unidade_orcamentaria_id_fkey FOREIGN KEY (unidade_orcamentaria_id) REFERENCES public.estrutura_organizacional(id);


--
-- Name: fin_empenho_anulacoes fin_empenho_anulacoes_anulado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_empenho_anulacoes
    ADD CONSTRAINT fin_empenho_anulacoes_anulado_por_fkey FOREIGN KEY (anulado_por) REFERENCES auth.users(id);


--
-- Name: fin_empenho_anulacoes fin_empenho_anulacoes_empenho_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_empenho_anulacoes
    ADD CONSTRAINT fin_empenho_anulacoes_empenho_id_fkey FOREIGN KEY (empenho_id) REFERENCES public.fin_empenhos(id);


--
-- Name: fin_empenhos fin_empenhos_conta_contabil_credito_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_empenhos
    ADD CONSTRAINT fin_empenhos_conta_contabil_credito_id_fkey FOREIGN KEY (conta_contabil_credito_id) REFERENCES public.fin_plano_contas(id);


--
-- Name: fin_empenhos fin_empenhos_conta_contabil_debito_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_empenhos
    ADD CONSTRAINT fin_empenhos_conta_contabil_debito_id_fkey FOREIGN KEY (conta_contabil_debito_id) REFERENCES public.fin_plano_contas(id);


--
-- Name: fin_empenhos fin_empenhos_contrato_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_empenhos
    ADD CONSTRAINT fin_empenhos_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES public.contratos(id);


--
-- Name: fin_empenhos fin_empenhos_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_empenhos
    ADD CONSTRAINT fin_empenhos_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: fin_empenhos fin_empenhos_dotacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_empenhos
    ADD CONSTRAINT fin_empenhos_dotacao_id_fkey FOREIGN KEY (dotacao_id) REFERENCES public.fin_dotacoes(id);


--
-- Name: fin_empenhos fin_empenhos_emitido_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_empenhos
    ADD CONSTRAINT fin_empenhos_emitido_por_fkey FOREIGN KEY (emitido_por) REFERENCES auth.users(id);


--
-- Name: fin_empenhos fin_empenhos_fonte_recurso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_empenhos
    ADD CONSTRAINT fin_empenhos_fonte_recurso_id_fkey FOREIGN KEY (fonte_recurso_id) REFERENCES public.fin_fontes_recurso(id);


--
-- Name: fin_empenhos fin_empenhos_fornecedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_empenhos
    ADD CONSTRAINT fin_empenhos_fornecedor_id_fkey FOREIGN KEY (fornecedor_id) REFERENCES public.fornecedores(id);


--
-- Name: fin_empenhos fin_empenhos_natureza_despesa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_empenhos
    ADD CONSTRAINT fin_empenhos_natureza_despesa_id_fkey FOREIGN KEY (natureza_despesa_id) REFERENCES public.fin_naturezas_despesa(id);


--
-- Name: fin_empenhos fin_empenhos_solicitacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_empenhos
    ADD CONSTRAINT fin_empenhos_solicitacao_id_fkey FOREIGN KEY (solicitacao_id) REFERENCES public.fin_solicitacoes(id);


--
-- Name: fin_extrato_transacoes fin_extrato_transacoes_conciliado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_extrato_transacoes
    ADD CONSTRAINT fin_extrato_transacoes_conciliado_por_fkey FOREIGN KEY (conciliado_por) REFERENCES auth.users(id);


--
-- Name: fin_extrato_transacoes fin_extrato_transacoes_extrato_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_extrato_transacoes
    ADD CONSTRAINT fin_extrato_transacoes_extrato_id_fkey FOREIGN KEY (extrato_id) REFERENCES public.fin_extratos_bancarios(id) ON DELETE CASCADE;


--
-- Name: fin_extrato_transacoes fin_extrato_transacoes_pagamento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_extrato_transacoes
    ADD CONSTRAINT fin_extrato_transacoes_pagamento_id_fkey FOREIGN KEY (pagamento_id) REFERENCES public.fin_pagamentos(id);


--
-- Name: fin_extrato_transacoes fin_extrato_transacoes_receita_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_extrato_transacoes
    ADD CONSTRAINT fin_extrato_transacoes_receita_id_fkey FOREIGN KEY (receita_id) REFERENCES public.fin_receitas(id);


--
-- Name: fin_extratos_bancarios fin_extratos_bancarios_conciliado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_extratos_bancarios
    ADD CONSTRAINT fin_extratos_bancarios_conciliado_por_fkey FOREIGN KEY (conciliado_por) REFERENCES auth.users(id);


--
-- Name: fin_extratos_bancarios fin_extratos_bancarios_conta_bancaria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_extratos_bancarios
    ADD CONSTRAINT fin_extratos_bancarios_conta_bancaria_id_fkey FOREIGN KEY (conta_bancaria_id) REFERENCES public.fin_contas_bancarias(id);


--
-- Name: fin_extratos_bancarios fin_extratos_bancarios_importado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_extratos_bancarios
    ADD CONSTRAINT fin_extratos_bancarios_importado_por_fkey FOREIGN KEY (importado_por) REFERENCES auth.users(id);


--
-- Name: fin_fechamentos fin_fechamentos_fechado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_fechamentos
    ADD CONSTRAINT fin_fechamentos_fechado_por_fkey FOREIGN KEY (fechado_por) REFERENCES auth.users(id);


--
-- Name: fin_fechamentos fin_fechamentos_reaberto_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_fechamentos
    ADD CONSTRAINT fin_fechamentos_reaberto_por_fkey FOREIGN KEY (reaberto_por) REFERENCES auth.users(id);


--
-- Name: fin_lancamentos_contabeis fin_lancamentos_contabeis_conta_credito_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_lancamentos_contabeis
    ADD CONSTRAINT fin_lancamentos_contabeis_conta_credito_id_fkey FOREIGN KEY (conta_credito_id) REFERENCES public.fin_plano_contas(id);


--
-- Name: fin_lancamentos_contabeis fin_lancamentos_contabeis_conta_debito_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_lancamentos_contabeis
    ADD CONSTRAINT fin_lancamentos_contabeis_conta_debito_id_fkey FOREIGN KEY (conta_debito_id) REFERENCES public.fin_plano_contas(id);


--
-- Name: fin_lancamentos_contabeis fin_lancamentos_contabeis_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_lancamentos_contabeis
    ADD CONSTRAINT fin_lancamentos_contabeis_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: fin_liquidacoes fin_liquidacoes_aprovado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_liquidacoes
    ADD CONSTRAINT fin_liquidacoes_aprovado_por_fkey FOREIGN KEY (aprovado_por) REFERENCES auth.users(id);


--
-- Name: fin_liquidacoes fin_liquidacoes_atestado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_liquidacoes
    ADD CONSTRAINT fin_liquidacoes_atestado_por_fkey FOREIGN KEY (atestado_por) REFERENCES auth.users(id);


--
-- Name: fin_liquidacoes fin_liquidacoes_conta_contabil_credito_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_liquidacoes
    ADD CONSTRAINT fin_liquidacoes_conta_contabil_credito_id_fkey FOREIGN KEY (conta_contabil_credito_id) REFERENCES public.fin_plano_contas(id);


--
-- Name: fin_liquidacoes fin_liquidacoes_conta_contabil_debito_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_liquidacoes
    ADD CONSTRAINT fin_liquidacoes_conta_contabil_debito_id_fkey FOREIGN KEY (conta_contabil_debito_id) REFERENCES public.fin_plano_contas(id);


--
-- Name: fin_liquidacoes fin_liquidacoes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_liquidacoes
    ADD CONSTRAINT fin_liquidacoes_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: fin_liquidacoes fin_liquidacoes_empenho_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_liquidacoes
    ADD CONSTRAINT fin_liquidacoes_empenho_id_fkey FOREIGN KEY (empenho_id) REFERENCES public.fin_empenhos(id);


--
-- Name: fin_pagamentos fin_pagamentos_autorizado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_pagamentos
    ADD CONSTRAINT fin_pagamentos_autorizado_por_fkey FOREIGN KEY (autorizado_por) REFERENCES auth.users(id);


--
-- Name: fin_pagamentos fin_pagamentos_conta_bancaria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_pagamentos
    ADD CONSTRAINT fin_pagamentos_conta_bancaria_id_fkey FOREIGN KEY (conta_bancaria_id) REFERENCES public.fin_contas_bancarias(id);


--
-- Name: fin_pagamentos fin_pagamentos_conta_contabil_credito_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_pagamentos
    ADD CONSTRAINT fin_pagamentos_conta_contabil_credito_id_fkey FOREIGN KEY (conta_contabil_credito_id) REFERENCES public.fin_plano_contas(id);


--
-- Name: fin_pagamentos fin_pagamentos_conta_contabil_debito_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_pagamentos
    ADD CONSTRAINT fin_pagamentos_conta_contabil_debito_id_fkey FOREIGN KEY (conta_contabil_debito_id) REFERENCES public.fin_plano_contas(id);


--
-- Name: fin_pagamentos fin_pagamentos_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_pagamentos
    ADD CONSTRAINT fin_pagamentos_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: fin_pagamentos fin_pagamentos_empenho_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_pagamentos
    ADD CONSTRAINT fin_pagamentos_empenho_id_fkey FOREIGN KEY (empenho_id) REFERENCES public.fin_empenhos(id);


--
-- Name: fin_pagamentos fin_pagamentos_estornado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_pagamentos
    ADD CONSTRAINT fin_pagamentos_estornado_por_fkey FOREIGN KEY (estornado_por) REFERENCES auth.users(id);


--
-- Name: fin_pagamentos fin_pagamentos_executado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_pagamentos
    ADD CONSTRAINT fin_pagamentos_executado_por_fkey FOREIGN KEY (executado_por) REFERENCES auth.users(id);


--
-- Name: fin_pagamentos fin_pagamentos_fornecedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_pagamentos
    ADD CONSTRAINT fin_pagamentos_fornecedor_id_fkey FOREIGN KEY (fornecedor_id) REFERENCES public.fornecedores(id);


--
-- Name: fin_pagamentos fin_pagamentos_liquidacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_pagamentos
    ADD CONSTRAINT fin_pagamentos_liquidacao_id_fkey FOREIGN KEY (liquidacao_id) REFERENCES public.fin_liquidacoes(id);


--
-- Name: fin_plano_contas fin_plano_contas_conta_pai_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_plano_contas
    ADD CONSTRAINT fin_plano_contas_conta_pai_id_fkey FOREIGN KEY (conta_pai_id) REFERENCES public.fin_plano_contas(id);


--
-- Name: fin_plano_contas fin_plano_contas_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_plano_contas
    ADD CONSTRAINT fin_plano_contas_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: fin_receitas fin_receitas_conta_bancaria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_receitas
    ADD CONSTRAINT fin_receitas_conta_bancaria_id_fkey FOREIGN KEY (conta_bancaria_id) REFERENCES public.fin_contas_bancarias(id);


--
-- Name: fin_receitas fin_receitas_convenio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_receitas
    ADD CONSTRAINT fin_receitas_convenio_id_fkey FOREIGN KEY (convenio_id) REFERENCES public.contratos(id);


--
-- Name: fin_receitas fin_receitas_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_receitas
    ADD CONSTRAINT fin_receitas_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: fin_receitas fin_receitas_fonte_recurso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_receitas
    ADD CONSTRAINT fin_receitas_fonte_recurso_id_fkey FOREIGN KEY (fonte_recurso_id) REFERENCES public.fin_fontes_recurso(id);


--
-- Name: fin_restos_pagar fin_restos_pagar_empenho_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_restos_pagar
    ADD CONSTRAINT fin_restos_pagar_empenho_id_fkey FOREIGN KEY (empenho_id) REFERENCES public.fin_empenhos(id);


--
-- Name: fin_solicitacao_itens fin_solicitacao_itens_solicitacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_solicitacao_itens
    ADD CONSTRAINT fin_solicitacao_itens_solicitacao_id_fkey FOREIGN KEY (solicitacao_id) REFERENCES public.fin_solicitacoes(id) ON DELETE CASCADE;


--
-- Name: fin_solicitacoes fin_solicitacoes_autorizado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_solicitacoes
    ADD CONSTRAINT fin_solicitacoes_autorizado_por_fkey FOREIGN KEY (autorizado_por) REFERENCES auth.users(id);


--
-- Name: fin_solicitacoes fin_solicitacoes_ci_aprovado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_solicitacoes
    ADD CONSTRAINT fin_solicitacoes_ci_aprovado_por_fkey FOREIGN KEY (ci_aprovado_por) REFERENCES auth.users(id);


--
-- Name: fin_solicitacoes fin_solicitacoes_contrato_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_solicitacoes
    ADD CONSTRAINT fin_solicitacoes_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES public.contratos(id);


--
-- Name: fin_solicitacoes fin_solicitacoes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_solicitacoes
    ADD CONSTRAINT fin_solicitacoes_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: fin_solicitacoes fin_solicitacoes_dotacao_sugerida_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_solicitacoes
    ADD CONSTRAINT fin_solicitacoes_dotacao_sugerida_id_fkey FOREIGN KEY (dotacao_sugerida_id) REFERENCES public.fin_dotacoes(id);


--
-- Name: fin_solicitacoes fin_solicitacoes_fornecedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_solicitacoes
    ADD CONSTRAINT fin_solicitacoes_fornecedor_id_fkey FOREIGN KEY (fornecedor_id) REFERENCES public.fornecedores(id);


--
-- Name: fin_solicitacoes fin_solicitacoes_processo_licitatorio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_solicitacoes
    ADD CONSTRAINT fin_solicitacoes_processo_licitatorio_id_fkey FOREIGN KEY (processo_licitatorio_id) REFERENCES public.processos_licitatorios(id);


--
-- Name: fin_solicitacoes fin_solicitacoes_servidor_solicitante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_solicitacoes
    ADD CONSTRAINT fin_solicitacoes_servidor_solicitante_id_fkey FOREIGN KEY (servidor_solicitante_id) REFERENCES public.servidores(id);


--
-- Name: fin_solicitacoes fin_solicitacoes_unidade_solicitante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_solicitacoes
    ADD CONSTRAINT fin_solicitacoes_unidade_solicitante_id_fkey FOREIGN KEY (unidade_solicitante_id) REFERENCES public.estrutura_organizacional(id);


--
-- Name: fin_sub_empenhos fin_sub_empenhos_empenho_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_sub_empenhos
    ADD CONSTRAINT fin_sub_empenhos_empenho_id_fkey FOREIGN KEY (empenho_id) REFERENCES public.fin_empenhos(id);


--
-- Name: estrutura_organizacional fk_cargo_chefe; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estrutura_organizacional
    ADD CONSTRAINT fk_cargo_chefe FOREIGN KEY (cargo_chefe_id) REFERENCES public.cargos(id) ON DELETE SET NULL;


--
-- Name: folha_historico_status folha_historico_status_folha_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.folha_historico_status
    ADD CONSTRAINT folha_historico_status_folha_id_fkey FOREIGN KEY (folha_id) REFERENCES public.folhas_pagamento(id) ON DELETE CASCADE;


--
-- Name: folha_historico_status folha_historico_status_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.folha_historico_status
    ADD CONSTRAINT folha_historico_status_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES auth.users(id);


--
-- Name: folhas_pagamento folhas_pagamento_conferido_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.folhas_pagamento
    ADD CONSTRAINT folhas_pagamento_conferido_por_fkey FOREIGN KEY (conferido_por) REFERENCES auth.users(id);


--
-- Name: folhas_pagamento folhas_pagamento_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.folhas_pagamento
    ADD CONSTRAINT folhas_pagamento_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: folhas_pagamento folhas_pagamento_fechado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.folhas_pagamento
    ADD CONSTRAINT folhas_pagamento_fechado_por_fkey FOREIGN KEY (fechado_por) REFERENCES public.profiles(id);


--
-- Name: folhas_pagamento folhas_pagamento_processado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.folhas_pagamento
    ADD CONSTRAINT folhas_pagamento_processado_por_fkey FOREIGN KEY (processado_por) REFERENCES public.profiles(id);


--
-- Name: folhas_pagamento folhas_pagamento_reaberto_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.folhas_pagamento
    ADD CONSTRAINT folhas_pagamento_reaberto_por_fkey FOREIGN KEY (reaberto_por) REFERENCES public.profiles(id);


--
-- Name: form_field_config form_field_config_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_field_config
    ADD CONSTRAINT form_field_config_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: fotos_vistoria_inventario fotos_vistoria_inventario_bem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fotos_vistoria_inventario
    ADD CONSTRAINT fotos_vistoria_inventario_bem_id_fkey FOREIGN KEY (bem_id) REFERENCES public.bens_patrimoniais(id) ON DELETE SET NULL;


--
-- Name: fotos_vistoria_inventario fotos_vistoria_inventario_campanha_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fotos_vistoria_inventario
    ADD CONSTRAINT fotos_vistoria_inventario_campanha_id_fkey FOREIGN KEY (campanha_id) REFERENCES public.campanhas_inventario(id) ON DELETE CASCADE;


--
-- Name: fotos_vistoria_inventario fotos_vistoria_inventario_unidade_local_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fotos_vistoria_inventario
    ADD CONSTRAINT fotos_vistoria_inventario_unidade_local_id_fkey FOREIGN KEY (unidade_local_id) REFERENCES public.unidades_locais(id) ON DELETE RESTRICT;


--
-- Name: frequencia_arquivos frequencia_arquivos_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frequencia_arquivos
    ADD CONSTRAINT frequencia_arquivos_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: frequencia_arquivos frequencia_arquivos_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frequencia_arquivos
    ADD CONSTRAINT frequencia_arquivos_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.servidores(id) ON DELETE SET NULL;


--
-- Name: frequencia_arquivos frequencia_arquivos_unidade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frequencia_arquivos
    ADD CONSTRAINT frequencia_arquivos_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.estrutura_organizacional(id) ON DELETE SET NULL;


--
-- Name: frequencia_fechamento frequencia_fechamento_consolidado_rh_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frequencia_fechamento
    ADD CONSTRAINT frequencia_fechamento_consolidado_rh_por_fkey FOREIGN KEY (consolidado_rh_por) REFERENCES auth.users(id);


--
-- Name: frequencia_fechamento frequencia_fechamento_reaberto_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frequencia_fechamento
    ADD CONSTRAINT frequencia_fechamento_reaberto_por_fkey FOREIGN KEY (reaberto_por) REFERENCES auth.users(id);


--
-- Name: frequencia_fechamento frequencia_fechamento_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frequencia_fechamento
    ADD CONSTRAINT frequencia_fechamento_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.servidores(id);


--
-- Name: frequencia_fechamento frequencia_fechamento_validado_chefia_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frequencia_fechamento
    ADD CONSTRAINT frequencia_fechamento_validado_chefia_por_fkey FOREIGN KEY (validado_chefia_por) REFERENCES auth.users(id);


--
-- Name: frequencia_mensal frequencia_mensal_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frequencia_mensal
    ADD CONSTRAINT frequencia_mensal_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.servidores(id) ON DELETE CASCADE;


--
-- Name: frequencia_pacotes frequencia_pacotes_agrupamento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frequencia_pacotes
    ADD CONSTRAINT frequencia_pacotes_agrupamento_id_fkey FOREIGN KEY (agrupamento_id) REFERENCES public.config_agrupamento_unidades(id) ON DELETE SET NULL;


--
-- Name: frequencia_pacotes frequencia_pacotes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frequencia_pacotes
    ADD CONSTRAINT frequencia_pacotes_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: frequencia_pacotes frequencia_pacotes_unidade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frequencia_pacotes
    ADD CONSTRAINT frequencia_pacotes_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.estrutura_organizacional(id) ON DELETE SET NULL;


--
-- Name: galeria_eventos_esportivos galeria_eventos_esportivos_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.galeria_eventos_esportivos
    ADD CONSTRAINT galeria_eventos_esportivos_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: gestores_escolares gestores_escolares_escola_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gestores_escolares
    ADD CONSTRAINT gestores_escolares_escola_id_fkey FOREIGN KEY (escola_id) REFERENCES public.escolas_jer(id) ON DELETE RESTRICT;


--
-- Name: gestores_escolares_historico gestores_escolares_historico_gestor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gestores_escolares_historico
    ADD CONSTRAINT gestores_escolares_historico_gestor_id_fkey FOREIGN KEY (gestor_id) REFERENCES public.gestores_escolares(id) ON DELETE CASCADE;


--
-- Name: gestores_escolares gestores_escolares_responsavel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gestores_escolares
    ADD CONSTRAINT gestores_escolares_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: historico_conteudo_oficial historico_conteudo_oficial_promovido_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_conteudo_oficial
    ADD CONSTRAINT historico_conteudo_oficial_promovido_por_fkey FOREIGN KEY (promovido_por) REFERENCES auth.users(id);


--
-- Name: historico_convites_reuniao historico_convites_reuniao_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_convites_reuniao
    ADD CONSTRAINT historico_convites_reuniao_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: historico_convites_reuniao historico_convites_reuniao_modelo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_convites_reuniao
    ADD CONSTRAINT historico_convites_reuniao_modelo_id_fkey FOREIGN KEY (modelo_id) REFERENCES public.modelos_mensagem_reuniao(id);


--
-- Name: historico_convites_reuniao historico_convites_reuniao_participante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_convites_reuniao
    ADD CONSTRAINT historico_convites_reuniao_participante_id_fkey FOREIGN KEY (participante_id) REFERENCES public.participantes_reuniao(id) ON DELETE CASCADE;


--
-- Name: historico_convites_reuniao historico_convites_reuniao_reuniao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_convites_reuniao
    ADD CONSTRAINT historico_convites_reuniao_reuniao_id_fkey FOREIGN KEY (reuniao_id) REFERENCES public.reunioes(id) ON DELETE CASCADE;


--
-- Name: historico_funcional historico_funcional_cargo_anterior_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_funcional
    ADD CONSTRAINT historico_funcional_cargo_anterior_id_fkey FOREIGN KEY (cargo_anterior_id) REFERENCES public.cargos(id);


--
-- Name: historico_funcional historico_funcional_cargo_novo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_funcional
    ADD CONSTRAINT historico_funcional_cargo_novo_id_fkey FOREIGN KEY (cargo_novo_id) REFERENCES public.cargos(id);


--
-- Name: historico_funcional historico_funcional_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_funcional
    ADD CONSTRAINT historico_funcional_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: historico_funcional historico_funcional_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_funcional
    ADD CONSTRAINT historico_funcional_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.servidores(id) ON DELETE CASCADE;


--
-- Name: historico_funcional historico_funcional_unidade_anterior_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_funcional
    ADD CONSTRAINT historico_funcional_unidade_anterior_id_fkey FOREIGN KEY (unidade_anterior_id) REFERENCES public.estrutura_organizacional(id);


--
-- Name: historico_funcional historico_funcional_unidade_nova_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_funcional
    ADD CONSTRAINT historico_funcional_unidade_nova_id_fkey FOREIGN KEY (unidade_nova_id) REFERENCES public.estrutura_organizacional(id);


--
-- Name: historico_lai historico_lai_solicitacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_lai
    ADD CONSTRAINT historico_lai_solicitacao_id_fkey FOREIGN KEY (solicitacao_id) REFERENCES public.solicitacoes_sic(id) ON DELETE CASCADE;


--
-- Name: historico_patrimonio historico_patrimonio_baixa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_patrimonio
    ADD CONSTRAINT historico_patrimonio_baixa_id_fkey FOREIGN KEY (baixa_id) REFERENCES public.baixas_patrimonio(id);


--
-- Name: historico_patrimonio historico_patrimonio_bem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_patrimonio
    ADD CONSTRAINT historico_patrimonio_bem_id_fkey FOREIGN KEY (bem_id) REFERENCES public.bens_patrimoniais(id);


--
-- Name: historico_patrimonio historico_patrimonio_manutencao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_patrimonio
    ADD CONSTRAINT historico_patrimonio_manutencao_id_fkey FOREIGN KEY (manutencao_id) REFERENCES public.manutencoes_patrimonio(id);


--
-- Name: historico_patrimonio historico_patrimonio_movimentacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_patrimonio
    ADD CONSTRAINT historico_patrimonio_movimentacao_id_fkey FOREIGN KEY (movimentacao_id) REFERENCES public.movimentacoes_patrimonio(id);


--
-- Name: historico_patrimonio historico_patrimonio_responsavel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_patrimonio
    ADD CONSTRAINT historico_patrimonio_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES public.servidores(id);


--
-- Name: historico_patrimonio historico_patrimonio_unidade_local_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_patrimonio
    ADD CONSTRAINT historico_patrimonio_unidade_local_id_fkey FOREIGN KEY (unidade_local_id) REFERENCES public.unidades_locais(id);


--
-- Name: horarios_jornada horarios_jornada_configuracao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horarios_jornada
    ADD CONSTRAINT horarios_jornada_configuracao_id_fkey FOREIGN KEY (configuracao_id) REFERENCES public.configuracao_jornada(id) ON DELETE CASCADE;


--
-- Name: importacoes importacoes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.importacoes
    ADD CONSTRAINT importacoes_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: itens_ata_registro_preco itens_ata_registro_preco_ata_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_ata_registro_preco
    ADD CONSTRAINT itens_ata_registro_preco_ata_id_fkey FOREIGN KEY (ata_id) REFERENCES public.atas_registro_preco(id) ON DELETE CASCADE;


--
-- Name: itens_ata_registro_preco itens_ata_registro_preco_item_licitatorio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_ata_registro_preco
    ADD CONSTRAINT itens_ata_registro_preco_item_licitatorio_id_fkey FOREIGN KEY (item_licitatorio_id) REFERENCES public.itens_processo_licitatorio(id);


--
-- Name: itens_checklist itens_checklist_checklist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_checklist
    ADD CONSTRAINT itens_checklist_checklist_id_fkey FOREIGN KEY (checklist_id) REFERENCES public.checklists_conformidade(id) ON DELETE CASCADE;


--
-- Name: itens_checklist itens_checklist_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_checklist
    ADD CONSTRAINT itens_checklist_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: itens_contrato itens_contrato_contrato_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_contrato
    ADD CONSTRAINT itens_contrato_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES public.contratos(id) ON DELETE CASCADE;


--
-- Name: itens_contrato itens_contrato_item_ata_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_contrato
    ADD CONSTRAINT itens_contrato_item_ata_id_fkey FOREIGN KEY (item_ata_id) REFERENCES public.itens_ata_registro_preco(id);


--
-- Name: itens_ficha_financeira itens_ficha_financeira_ficha_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_ficha_financeira
    ADD CONSTRAINT itens_ficha_financeira_ficha_id_fkey FOREIGN KEY (ficha_id) REFERENCES public.fichas_financeiras(id) ON DELETE CASCADE;


--
-- Name: itens_ficha_financeira itens_ficha_financeira_rubrica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_ficha_financeira
    ADD CONSTRAINT itens_ficha_financeira_rubrica_id_fkey FOREIGN KEY (rubrica_id) REFERENCES public.rubricas(id);


--
-- Name: itens_licitacao itens_licitacao_processo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_licitacao
    ADD CONSTRAINT itens_licitacao_processo_id_fkey FOREIGN KEY (processo_id) REFERENCES public.processos_licitatorios(id) ON DELETE CASCADE;


--
-- Name: itens_licitacao itens_licitacao_vencedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_licitacao
    ADD CONSTRAINT itens_licitacao_vencedor_id_fkey FOREIGN KEY (vencedor_id) REFERENCES public.fornecedores(id);


--
-- Name: itens_material itens_material_categoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_material
    ADD CONSTRAINT itens_material_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias_material(id);


--
-- Name: itens_processo_licitatorio itens_processo_licitatorio_processo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_processo_licitatorio
    ADD CONSTRAINT itens_processo_licitatorio_processo_id_fkey FOREIGN KEY (processo_id) REFERENCES public.processos_licitatorios(id) ON DELETE CASCADE;


--
-- Name: itens_retorno_bancario itens_retorno_bancario_ficha_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_retorno_bancario
    ADD CONSTRAINT itens_retorno_bancario_ficha_id_fkey FOREIGN KEY (ficha_id) REFERENCES public.fichas_financeiras(id);


--
-- Name: itens_retorno_bancario itens_retorno_bancario_retorno_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_retorno_bancario
    ADD CONSTRAINT itens_retorno_bancario_retorno_id_fkey FOREIGN KEY (retorno_id) REFERENCES public.retornos_bancarios(id) ON DELETE CASCADE;


--
-- Name: itens_retorno_bancario itens_retorno_bancario_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_retorno_bancario
    ADD CONSTRAINT itens_retorno_bancario_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.servidores(id);


--
-- Name: justificativas_ponto justificativas_ponto_aprovador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.justificativas_ponto
    ADD CONSTRAINT justificativas_ponto_aprovador_id_fkey FOREIGN KEY (aprovador_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: justificativas_ponto justificativas_ponto_registro_ponto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.justificativas_ponto
    ADD CONSTRAINT justificativas_ponto_registro_ponto_id_fkey FOREIGN KEY (registro_ponto_id) REFERENCES public.registros_ponto(id) ON DELETE CASCADE;


--
-- Name: lancamentos_banco_horas lancamentos_banco_horas_banco_horas_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lancamentos_banco_horas
    ADD CONSTRAINT lancamentos_banco_horas_banco_horas_id_fkey FOREIGN KEY (banco_horas_id) REFERENCES public.banco_horas(id) ON DELETE CASCADE;


--
-- Name: lancamentos_banco_horas lancamentos_banco_horas_registro_ponto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lancamentos_banco_horas
    ADD CONSTRAINT lancamentos_banco_horas_registro_ponto_id_fkey FOREIGN KEY (registro_ponto_id) REFERENCES public.registros_ponto(id) ON DELETE SET NULL;


--
-- Name: lancamentos_folha lancamentos_folha_ficha_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lancamentos_folha
    ADD CONSTRAINT lancamentos_folha_ficha_id_fkey FOREIGN KEY (ficha_id) REFERENCES public.fichas_financeiras(id) ON DELETE CASCADE;


--
-- Name: lancamentos_folha lancamentos_folha_rubrica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lancamentos_folha
    ADD CONSTRAINT lancamentos_folha_rubrica_id_fkey FOREIGN KEY (rubrica_id) REFERENCES public.rubricas(id);


--
-- Name: licencas_afastamentos licencas_afastamentos_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.licencas_afastamentos
    ADD CONSTRAINT licencas_afastamentos_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: licencas_afastamentos licencas_afastamentos_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.licencas_afastamentos
    ADD CONSTRAINT licencas_afastamentos_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.servidores(id) ON DELETE CASCADE;


--
-- Name: links_uteis links_uteis_alterado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.links_uteis
    ADD CONSTRAINT links_uteis_alterado_por_fkey FOREIGN KEY (alterado_por) REFERENCES auth.users(id);


--
-- Name: liquidacoes liquidacoes_atestado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.liquidacoes
    ADD CONSTRAINT liquidacoes_atestado_por_fkey FOREIGN KEY (atestado_por) REFERENCES public.servidores(id);


--
-- Name: liquidacoes liquidacoes_empenho_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.liquidacoes
    ADD CONSTRAINT liquidacoes_empenho_id_fkey FOREIGN KEY (empenho_id) REFERENCES public.empenhos(id) ON DELETE CASCADE;


--
-- Name: liquidacoes liquidacoes_medicao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.liquidacoes
    ADD CONSTRAINT liquidacoes_medicao_id_fkey FOREIGN KEY (medicao_id) REFERENCES public.medicoes_contrato(id);


--
-- Name: lotacoes lotacoes_cargo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lotacoes
    ADD CONSTRAINT lotacoes_cargo_id_fkey FOREIGN KEY (cargo_id) REFERENCES public.cargos(id) ON DELETE SET NULL;


--
-- Name: lotacoes lotacoes_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lotacoes
    ADD CONSTRAINT lotacoes_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.servidores(id) ON DELETE CASCADE;


--
-- Name: lotacoes lotacoes_unidade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lotacoes
    ADD CONSTRAINT lotacoes_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.estrutura_organizacional(id) ON DELETE CASCADE;


--
-- Name: manutencoes_patrimonio manutencoes_patrimonio_bem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manutencoes_patrimonio
    ADD CONSTRAINT manutencoes_patrimonio_bem_id_fkey FOREIGN KEY (bem_id) REFERENCES public.bens_patrimoniais(id);


--
-- Name: manutencoes_patrimonio manutencoes_patrimonio_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manutencoes_patrimonio
    ADD CONSTRAINT manutencoes_patrimonio_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: manutencoes_patrimonio manutencoes_patrimonio_fornecedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manutencoes_patrimonio
    ADD CONSTRAINT manutencoes_patrimonio_fornecedor_id_fkey FOREIGN KEY (fornecedor_id) REFERENCES public.fornecedores(id);


--
-- Name: matriz_raci_atribuicoes matriz_raci_atribuicoes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matriz_raci_atribuicoes
    ADD CONSTRAINT matriz_raci_atribuicoes_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: matriz_raci_atribuicoes matriz_raci_atribuicoes_papel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matriz_raci_atribuicoes
    ADD CONSTRAINT matriz_raci_atribuicoes_papel_id_fkey FOREIGN KEY (papel_id) REFERENCES public.matriz_raci_papeis(id) ON DELETE CASCADE;


--
-- Name: matriz_raci_atribuicoes matriz_raci_atribuicoes_processo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matriz_raci_atribuicoes
    ADD CONSTRAINT matriz_raci_atribuicoes_processo_id_fkey FOREIGN KEY (processo_id) REFERENCES public.matriz_raci_processos(id) ON DELETE CASCADE;


--
-- Name: matriz_raci_atribuicoes matriz_raci_atribuicoes_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matriz_raci_atribuicoes
    ADD CONSTRAINT matriz_raci_atribuicoes_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: matriz_raci_papeis matriz_raci_papeis_cargo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matriz_raci_papeis
    ADD CONSTRAINT matriz_raci_papeis_cargo_id_fkey FOREIGN KEY (cargo_id) REFERENCES public.cargos(id);


--
-- Name: matriz_raci_papeis matriz_raci_papeis_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matriz_raci_papeis
    ADD CONSTRAINT matriz_raci_papeis_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: matriz_raci_papeis matriz_raci_papeis_unidade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matriz_raci_papeis
    ADD CONSTRAINT matriz_raci_papeis_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.estrutura_organizacional(id);


--
-- Name: matriz_raci_papeis matriz_raci_papeis_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matriz_raci_papeis
    ADD CONSTRAINT matriz_raci_papeis_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: matriz_raci_processos matriz_raci_processos_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matriz_raci_processos
    ADD CONSTRAINT matriz_raci_processos_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: matriz_raci_processos matriz_raci_processos_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matriz_raci_processos
    ADD CONSTRAINT matriz_raci_processos_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: medicoes_contrato medicoes_contrato_aprovado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medicoes_contrato
    ADD CONSTRAINT medicoes_contrato_aprovado_por_fkey FOREIGN KEY (aprovado_por) REFERENCES public.servidores(id);


--
-- Name: medicoes_contrato medicoes_contrato_contrato_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medicoes_contrato
    ADD CONSTRAINT medicoes_contrato_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES public.contratos(id) ON DELETE CASCADE;


--
-- Name: memorandos_lotacao memorandos_lotacao_cargo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memorandos_lotacao
    ADD CONSTRAINT memorandos_lotacao_cargo_id_fkey FOREIGN KEY (cargo_id) REFERENCES public.cargos(id);


--
-- Name: memorandos_lotacao memorandos_lotacao_emitido_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memorandos_lotacao
    ADD CONSTRAINT memorandos_lotacao_emitido_por_fkey FOREIGN KEY (emitido_por) REFERENCES public.profiles(id);


--
-- Name: memorandos_lotacao memorandos_lotacao_lotacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memorandos_lotacao
    ADD CONSTRAINT memorandos_lotacao_lotacao_id_fkey FOREIGN KEY (lotacao_id) REFERENCES public.lotacoes(id) ON DELETE CASCADE;


--
-- Name: memorandos_lotacao memorandos_lotacao_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memorandos_lotacao
    ADD CONSTRAINT memorandos_lotacao_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.profiles(id);


--
-- Name: memorandos_lotacao memorandos_lotacao_unidade_destino_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memorandos_lotacao
    ADD CONSTRAINT memorandos_lotacao_unidade_destino_id_fkey FOREIGN KEY (unidade_destino_id) REFERENCES public.estrutura_organizacional(id);


--
-- Name: modelos_mensagem_reuniao modelos_mensagem_reuniao_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modelos_mensagem_reuniao
    ADD CONSTRAINT modelos_mensagem_reuniao_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: module_settings module_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.module_settings
    ADD CONSTRAINT module_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: movimentacoes_bem movimentacoes_bem_bem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentacoes_bem
    ADD CONSTRAINT movimentacoes_bem_bem_id_fkey FOREIGN KEY (bem_id) REFERENCES public.bens_patrimoniais(id) ON DELETE CASCADE;


--
-- Name: movimentacoes_bem movimentacoes_bem_responsavel_destino_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentacoes_bem
    ADD CONSTRAINT movimentacoes_bem_responsavel_destino_id_fkey FOREIGN KEY (responsavel_destino_id) REFERENCES public.servidores(id);


--
-- Name: movimentacoes_bem movimentacoes_bem_responsavel_origem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentacoes_bem
    ADD CONSTRAINT movimentacoes_bem_responsavel_origem_id_fkey FOREIGN KEY (responsavel_origem_id) REFERENCES public.servidores(id);


--
-- Name: movimentacoes_bem movimentacoes_bem_unidade_destino_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentacoes_bem
    ADD CONSTRAINT movimentacoes_bem_unidade_destino_id_fkey FOREIGN KEY (unidade_destino_id) REFERENCES public.estrutura_organizacional(id);


--
-- Name: movimentacoes_bem movimentacoes_bem_unidade_origem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentacoes_bem
    ADD CONSTRAINT movimentacoes_bem_unidade_origem_id_fkey FOREIGN KEY (unidade_origem_id) REFERENCES public.estrutura_organizacional(id);


--
-- Name: movimentacoes_estoque movimentacoes_estoque_almoxarifado_destino_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentacoes_estoque
    ADD CONSTRAINT movimentacoes_estoque_almoxarifado_destino_id_fkey FOREIGN KEY (almoxarifado_destino_id) REFERENCES public.almoxarifados(id);


--
-- Name: movimentacoes_estoque movimentacoes_estoque_almoxarifado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentacoes_estoque
    ADD CONSTRAINT movimentacoes_estoque_almoxarifado_id_fkey FOREIGN KEY (almoxarifado_id) REFERENCES public.almoxarifados(id);


--
-- Name: movimentacoes_estoque movimentacoes_estoque_empenho_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentacoes_estoque
    ADD CONSTRAINT movimentacoes_estoque_empenho_id_fkey FOREIGN KEY (empenho_id) REFERENCES public.empenhos(id);


--
-- Name: movimentacoes_estoque movimentacoes_estoque_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentacoes_estoque
    ADD CONSTRAINT movimentacoes_estoque_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.itens_material(id);


--
-- Name: movimentacoes_estoque movimentacoes_estoque_servidor_responsavel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentacoes_estoque
    ADD CONSTRAINT movimentacoes_estoque_servidor_responsavel_id_fkey FOREIGN KEY (servidor_responsavel_id) REFERENCES public.servidores(id);


--
-- Name: movimentacoes_estoque movimentacoes_estoque_setor_destino_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentacoes_estoque
    ADD CONSTRAINT movimentacoes_estoque_setor_destino_id_fkey FOREIGN KEY (setor_destino_id) REFERENCES public.estrutura_organizacional(id);


--
-- Name: movimentacoes_patrimonio movimentacoes_patrimonio_aprovado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentacoes_patrimonio
    ADD CONSTRAINT movimentacoes_patrimonio_aprovado_por_fkey FOREIGN KEY (aprovado_por) REFERENCES auth.users(id);


--
-- Name: movimentacoes_patrimonio movimentacoes_patrimonio_bem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentacoes_patrimonio
    ADD CONSTRAINT movimentacoes_patrimonio_bem_id_fkey FOREIGN KEY (bem_id) REFERENCES public.bens_patrimoniais(id);


--
-- Name: movimentacoes_patrimonio movimentacoes_patrimonio_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentacoes_patrimonio
    ADD CONSTRAINT movimentacoes_patrimonio_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: movimentacoes_patrimonio movimentacoes_patrimonio_responsavel_destino_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentacoes_patrimonio
    ADD CONSTRAINT movimentacoes_patrimonio_responsavel_destino_id_fkey FOREIGN KEY (responsavel_destino_id) REFERENCES public.servidores(id);


--
-- Name: movimentacoes_patrimonio movimentacoes_patrimonio_responsavel_origem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentacoes_patrimonio
    ADD CONSTRAINT movimentacoes_patrimonio_responsavel_origem_id_fkey FOREIGN KEY (responsavel_origem_id) REFERENCES public.servidores(id);


--
-- Name: movimentacoes_patrimonio movimentacoes_patrimonio_solicitado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentacoes_patrimonio
    ADD CONSTRAINT movimentacoes_patrimonio_solicitado_por_fkey FOREIGN KEY (solicitado_por) REFERENCES auth.users(id);


--
-- Name: movimentacoes_patrimonio movimentacoes_patrimonio_unidade_destino_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentacoes_patrimonio
    ADD CONSTRAINT movimentacoes_patrimonio_unidade_destino_id_fkey FOREIGN KEY (unidade_destino_id) REFERENCES public.estrutura_organizacional(id);


--
-- Name: movimentacoes_patrimonio movimentacoes_patrimonio_unidade_local_destino_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentacoes_patrimonio
    ADD CONSTRAINT movimentacoes_patrimonio_unidade_local_destino_id_fkey FOREIGN KEY (unidade_local_destino_id) REFERENCES public.unidades_locais(id);


--
-- Name: movimentacoes_patrimonio movimentacoes_patrimonio_unidade_local_origem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentacoes_patrimonio
    ADD CONSTRAINT movimentacoes_patrimonio_unidade_local_origem_id_fkey FOREIGN KEY (unidade_local_origem_id) REFERENCES public.unidades_locais(id);


--
-- Name: movimentacoes_patrimonio movimentacoes_patrimonio_unidade_origem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentacoes_patrimonio
    ADD CONSTRAINT movimentacoes_patrimonio_unidade_origem_id_fkey FOREIGN KEY (unidade_origem_id) REFERENCES public.estrutura_organizacional(id);


--
-- Name: movimentacoes_processo movimentacoes_processo_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentacoes_processo
    ADD CONSTRAINT movimentacoes_processo_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: movimentacoes_processo movimentacoes_processo_processo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentacoes_processo
    ADD CONSTRAINT movimentacoes_processo_processo_id_fkey FOREIGN KEY (processo_id) REFERENCES public.processos_administrativos(id) ON DELETE CASCADE;


--
-- Name: movimentacoes_processo movimentacoes_processo_servidor_destino_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentacoes_processo
    ADD CONSTRAINT movimentacoes_processo_servidor_destino_id_fkey FOREIGN KEY (servidor_destino_id) REFERENCES public.servidores(id);


--
-- Name: movimentacoes_processo movimentacoes_processo_servidor_origem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentacoes_processo
    ADD CONSTRAINT movimentacoes_processo_servidor_origem_id_fkey FOREIGN KEY (servidor_origem_id) REFERENCES public.servidores(id);


--
-- Name: movimentacoes_processo movimentacoes_processo_unidade_destino_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentacoes_processo
    ADD CONSTRAINT movimentacoes_processo_unidade_destino_id_fkey FOREIGN KEY (unidade_destino_id) REFERENCES public.estrutura_organizacional(id);


--
-- Name: movimentacoes_processo movimentacoes_processo_unidade_origem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentacoes_processo
    ADD CONSTRAINT movimentacoes_processo_unidade_origem_id_fkey FOREIGN KEY (unidade_origem_id) REFERENCES public.estrutura_organizacional(id);


--
-- Name: nomeacoes_chefe_unidade nomeacoes_chefe_unidade_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nomeacoes_chefe_unidade
    ADD CONSTRAINT nomeacoes_chefe_unidade_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: nomeacoes_chefe_unidade nomeacoes_chefe_unidade_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nomeacoes_chefe_unidade
    ADD CONSTRAINT nomeacoes_chefe_unidade_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.servidores(id);


--
-- Name: nomeacoes_chefe_unidade nomeacoes_chefe_unidade_unidade_local_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nomeacoes_chefe_unidade
    ADD CONSTRAINT nomeacoes_chefe_unidade_unidade_local_id_fkey FOREIGN KEY (unidade_local_id) REFERENCES public.unidades_locais(id) ON DELETE CASCADE;


--
-- Name: nomeacoes_chefe_unidade nomeacoes_chefe_unidade_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nomeacoes_chefe_unidade
    ADD CONSTRAINT nomeacoes_chefe_unidade_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: noticias_eventos_esportivos noticias_eventos_esportivos_autor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.noticias_eventos_esportivos
    ADD CONSTRAINT noticias_eventos_esportivos_autor_id_fkey FOREIGN KEY (autor_id) REFERENCES auth.users(id);


--
-- Name: ocorrencias_patrimonio ocorrencias_patrimonio_bem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ocorrencias_patrimonio
    ADD CONSTRAINT ocorrencias_patrimonio_bem_id_fkey FOREIGN KEY (bem_id) REFERENCES public.bens_patrimoniais(id);


--
-- Name: ocorrencias_patrimonio ocorrencias_patrimonio_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ocorrencias_patrimonio
    ADD CONSTRAINT ocorrencias_patrimonio_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: ocorrencias_patrimonio ocorrencias_patrimonio_responsavel_relato_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ocorrencias_patrimonio
    ADD CONSTRAINT ocorrencias_patrimonio_responsavel_relato_id_fkey FOREIGN KEY (responsavel_relato_id) REFERENCES public.servidores(id);


--
-- Name: ocorrencias_servidor ocorrencias_servidor_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ocorrencias_servidor
    ADD CONSTRAINT ocorrencias_servidor_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: ocorrencias_servidor ocorrencias_servidor_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ocorrencias_servidor
    ADD CONSTRAINT ocorrencias_servidor_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.servidores(id) ON DELETE CASCADE;


--
-- Name: pagamentos pagamentos_conta_autarquia_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagamentos
    ADD CONSTRAINT pagamentos_conta_autarquia_id_fkey FOREIGN KEY (conta_autarquia_id) REFERENCES public.contas_autarquia(id);


--
-- Name: pagamentos pagamentos_liquidacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagamentos
    ADD CONSTRAINT pagamentos_liquidacao_id_fkey FOREIGN KEY (liquidacao_id) REFERENCES public.liquidacoes(id) ON DELETE CASCADE;


--
-- Name: parametros_folha parametros_folha_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parametros_folha
    ADD CONSTRAINT parametros_folha_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: parametros_folha parametros_folha_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parametros_folha
    ADD CONSTRAINT parametros_folha_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.profiles(id);


--
-- Name: pareceres_tecnicos pareceres_tecnicos_autor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pareceres_tecnicos
    ADD CONSTRAINT pareceres_tecnicos_autor_id_fkey FOREIGN KEY (autor_id) REFERENCES public.servidores(id);


--
-- Name: pareceres_tecnicos pareceres_tecnicos_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pareceres_tecnicos
    ADD CONSTRAINT pareceres_tecnicos_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: pareceres_tecnicos pareceres_tecnicos_decisao_vinculada_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pareceres_tecnicos
    ADD CONSTRAINT pareceres_tecnicos_decisao_vinculada_id_fkey FOREIGN KEY (decisao_vinculada_id) REFERENCES public.decisoes_administrativas(id);


--
-- Name: pareceres_tecnicos pareceres_tecnicos_unidade_origem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pareceres_tecnicos
    ADD CONSTRAINT pareceres_tecnicos_unidade_origem_id_fkey FOREIGN KEY (unidade_origem_id) REFERENCES public.estrutura_organizacional(id);


--
-- Name: participantes_reuniao participantes_reuniao_convite_enviado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participantes_reuniao
    ADD CONSTRAINT participantes_reuniao_convite_enviado_por_fkey FOREIGN KEY (convite_enviado_por) REFERENCES auth.users(id);


--
-- Name: participantes_reuniao participantes_reuniao_reuniao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participantes_reuniao
    ADD CONSTRAINT participantes_reuniao_reuniao_id_fkey FOREIGN KEY (reuniao_id) REFERENCES public.reunioes(id) ON DELETE CASCADE;


--
-- Name: participantes_reuniao participantes_reuniao_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participantes_reuniao
    ADD CONSTRAINT participantes_reuniao_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.servidores(id);


--
-- Name: patrimonio_unidade patrimonio_unidade_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patrimonio_unidade
    ADD CONSTRAINT patrimonio_unidade_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: patrimonio_unidade patrimonio_unidade_unidade_local_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patrimonio_unidade
    ADD CONSTRAINT patrimonio_unidade_unidade_local_id_fkey FOREIGN KEY (unidade_local_id) REFERENCES public.unidades_locais(id) ON DELETE CASCADE;


--
-- Name: patrimonio_unidade patrimonio_unidade_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patrimonio_unidade
    ADD CONSTRAINT patrimonio_unidade_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: pensoes_alimenticias pensoes_alimenticias_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pensoes_alimenticias
    ADD CONSTRAINT pensoes_alimenticias_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: pensoes_alimenticias pensoes_alimenticias_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pensoes_alimenticias
    ADD CONSTRAINT pensoes_alimenticias_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.servidores(id);


--
-- Name: planos_tratamento_risco planos_tratamento_risco_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planos_tratamento_risco
    ADD CONSTRAINT planos_tratamento_risco_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: planos_tratamento_risco planos_tratamento_risco_responsavel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planos_tratamento_risco
    ADD CONSTRAINT planos_tratamento_risco_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES public.servidores(id);


--
-- Name: planos_tratamento_risco planos_tratamento_risco_risco_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planos_tratamento_risco
    ADD CONSTRAINT planos_tratamento_risco_risco_id_fkey FOREIGN KEY (risco_id) REFERENCES public.riscos_institucionais(id) ON DELETE CASCADE;


--
-- Name: planos_tratamento_risco planos_tratamento_risco_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planos_tratamento_risco
    ADD CONSTRAINT planos_tratamento_risco_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: portarias_servidor portarias_servidor_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portarias_servidor
    ADD CONSTRAINT portarias_servidor_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: portarias_servidor portarias_servidor_historico_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portarias_servidor
    ADD CONSTRAINT portarias_servidor_historico_id_fkey FOREIGN KEY (historico_id) REFERENCES public.historico_funcional(id);


--
-- Name: portarias_servidor portarias_servidor_portaria_revogadora_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portarias_servidor
    ADD CONSTRAINT portarias_servidor_portaria_revogadora_id_fkey FOREIGN KEY (portaria_revogadora_id) REFERENCES public.portarias_servidor(id);


--
-- Name: portarias_servidor portarias_servidor_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portarias_servidor
    ADD CONSTRAINT portarias_servidor_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.servidores(id) ON DELETE CASCADE;


--
-- Name: prazos_processo prazos_processo_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prazos_processo
    ADD CONSTRAINT prazos_processo_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: prazos_processo prazos_processo_processo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prazos_processo
    ADD CONSTRAINT prazos_processo_processo_id_fkey FOREIGN KEY (processo_id) REFERENCES public.processos_administrativos(id) ON DELETE CASCADE;


--
-- Name: prazos_processo prazos_processo_responsavel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prazos_processo
    ADD CONSTRAINT prazos_processo_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES public.servidores(id);


--
-- Name: pre_cadastros pre_cadastros_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pre_cadastros
    ADD CONSTRAINT pre_cadastros_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.servidores(id);


--
-- Name: processos_administrativos processos_administrativos_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.processos_administrativos
    ADD CONSTRAINT processos_administrativos_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: processos_administrativos processos_administrativos_processo_origem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.processos_administrativos
    ADD CONSTRAINT processos_administrativos_processo_origem_id_fkey FOREIGN KEY (processo_origem_id) REFERENCES public.processos_administrativos(id);


--
-- Name: processos_administrativos processos_administrativos_unidade_origem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.processos_administrativos
    ADD CONSTRAINT processos_administrativos_unidade_origem_id_fkey FOREIGN KEY (unidade_origem_id) REFERENCES public.estrutura_organizacional(id);


--
-- Name: processos_licitatorios processos_licitatorios_pregoeiro_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.processos_licitatorios
    ADD CONSTRAINT processos_licitatorios_pregoeiro_id_fkey FOREIGN KEY (pregoeiro_id) REFERENCES public.servidores(id);


--
-- Name: processos_licitatorios processos_licitatorios_servidor_responsavel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.processos_licitatorios
    ADD CONSTRAINT processos_licitatorios_servidor_responsavel_id_fkey FOREIGN KEY (servidor_responsavel_id) REFERENCES public.servidores(id);


--
-- Name: processos_licitatorios processos_licitatorios_unidade_requisitante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.processos_licitatorios
    ADD CONSTRAINT processos_licitatorios_unidade_requisitante_id_fkey FOREIGN KEY (unidade_requisitante_id) REFERENCES public.estrutura_organizacional(id);


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.servidores(id) ON DELETE SET NULL;


--
-- Name: programas programas_servidor_responsavel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.programas
    ADD CONSTRAINT programas_servidor_responsavel_id_fkey FOREIGN KEY (servidor_responsavel_id) REFERENCES public.servidores(id);


--
-- Name: programas programas_unidade_responsavel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.programas
    ADD CONSTRAINT programas_unidade_responsavel_id_fkey FOREIGN KEY (unidade_responsavel_id) REFERENCES public.estrutura_organizacional(id);


--
-- Name: propostas_licitacao propostas_licitacao_fornecedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.propostas_licitacao
    ADD CONSTRAINT propostas_licitacao_fornecedor_id_fkey FOREIGN KEY (fornecedor_id) REFERENCES public.fornecedores(id);


--
-- Name: propostas_licitacao propostas_licitacao_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.propostas_licitacao
    ADD CONSTRAINT propostas_licitacao_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.itens_licitacao(id) ON DELETE CASCADE;


--
-- Name: propostas_licitacao propostas_licitacao_processo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.propostas_licitacao
    ADD CONSTRAINT propostas_licitacao_processo_id_fkey FOREIGN KEY (processo_id) REFERENCES public.processos_licitatorios(id) ON DELETE CASCADE;


--
-- Name: provimentos provimentos_cargo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provimentos
    ADD CONSTRAINT provimentos_cargo_id_fkey FOREIGN KEY (cargo_id) REFERENCES public.cargos(id);


--
-- Name: provimentos provimentos_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provimentos
    ADD CONSTRAINT provimentos_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.servidores(id) ON DELETE CASCADE;


--
-- Name: provimentos provimentos_unidade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provimentos
    ADD CONSTRAINT provimentos_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.estrutura_organizacional(id);


--
-- Name: publicacoes_lai publicacoes_lai_contrato_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publicacoes_lai
    ADD CONSTRAINT publicacoes_lai_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES public.contratos(id);


--
-- Name: publicacoes_lai publicacoes_lai_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publicacoes_lai
    ADD CONSTRAINT publicacoes_lai_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.servidores(id);


--
-- Name: publicacoes_lai publicacoes_lai_unidade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publicacoes_lai
    ADD CONSTRAINT publicacoes_lai_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.estrutura_organizacional(id);


--
-- Name: publicacoes_legais publicacoes_legais_contrato_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publicacoes_legais
    ADD CONSTRAINT publicacoes_legais_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES public.contratos(id) ON DELETE CASCADE;


--
-- Name: publicacoes_legais publicacoes_legais_processo_licitatorio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publicacoes_legais
    ADD CONSTRAINT publicacoes_legais_processo_licitatorio_id_fkey FOREIGN KEY (processo_licitatorio_id) REFERENCES public.processos_licitatorios(id) ON DELETE CASCADE;


--
-- Name: recursos_lai recursos_lai_solicitacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recursos_lai
    ADD CONSTRAINT recursos_lai_solicitacao_id_fkey FOREIGN KEY (solicitacao_id) REFERENCES public.solicitacoes_sic(id) ON DELETE CASCADE;


--
-- Name: regimes_trabalho regimes_trabalho_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regimes_trabalho
    ADD CONSTRAINT regimes_trabalho_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: regimes_trabalho regimes_trabalho_instituicao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regimes_trabalho
    ADD CONSTRAINT regimes_trabalho_instituicao_id_fkey FOREIGN KEY (instituicao_id) REFERENCES public.config_institucional(id);


--
-- Name: registros_ponto registros_ponto_aprovador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_ponto
    ADD CONSTRAINT registros_ponto_aprovador_id_fkey FOREIGN KEY (aprovador_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: registros_ponto registros_ponto_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_ponto
    ADD CONSTRAINT registros_ponto_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.servidores(id) ON DELETE CASCADE;


--
-- Name: remessas_bancarias remessas_bancarias_conta_autarquia_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.remessas_bancarias
    ADD CONSTRAINT remessas_bancarias_conta_autarquia_id_fkey FOREIGN KEY (conta_autarquia_id) REFERENCES public.contas_autarquia(id);


--
-- Name: remessas_bancarias remessas_bancarias_enviado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.remessas_bancarias
    ADD CONSTRAINT remessas_bancarias_enviado_por_fkey FOREIGN KEY (enviado_por) REFERENCES public.profiles(id);


--
-- Name: remessas_bancarias remessas_bancarias_folha_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.remessas_bancarias
    ADD CONSTRAINT remessas_bancarias_folha_id_fkey FOREIGN KEY (folha_id) REFERENCES public.folhas_pagamento(id);


--
-- Name: remessas_bancarias remessas_bancarias_gerado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.remessas_bancarias
    ADD CONSTRAINT remessas_bancarias_gerado_por_fkey FOREIGN KEY (gerado_por) REFERENCES public.profiles(id);


--
-- Name: requisicao_itens requisicao_itens_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requisicao_itens
    ADD CONSTRAINT requisicao_itens_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.itens_material(id);


--
-- Name: requisicao_itens requisicao_itens_requisicao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requisicao_itens
    ADD CONSTRAINT requisicao_itens_requisicao_id_fkey FOREIGN KEY (requisicao_id) REFERENCES public.requisicoes_material(id) ON DELETE CASCADE;


--
-- Name: requisicoes_material requisicoes_material_almoxarifado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requisicoes_material
    ADD CONSTRAINT requisicoes_material_almoxarifado_id_fkey FOREIGN KEY (almoxarifado_id) REFERENCES public.almoxarifados(id);


--
-- Name: requisicoes_material requisicoes_material_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requisicoes_material
    ADD CONSTRAINT requisicoes_material_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: requisicoes_material requisicoes_material_responsavel_entrega_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requisicoes_material
    ADD CONSTRAINT requisicoes_material_responsavel_entrega_id_fkey FOREIGN KEY (responsavel_entrega_id) REFERENCES public.servidores(id);


--
-- Name: requisicoes_material requisicoes_material_setor_solicitante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requisicoes_material
    ADD CONSTRAINT requisicoes_material_setor_solicitante_id_fkey FOREIGN KEY (setor_solicitante_id) REFERENCES public.estrutura_organizacional(id);


--
-- Name: requisicoes_material requisicoes_material_solicitante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requisicoes_material
    ADD CONSTRAINT requisicoes_material_solicitante_id_fkey FOREIGN KEY (solicitante_id) REFERENCES public.servidores(id);


--
-- Name: respostas_checklist respostas_checklist_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.respostas_checklist
    ADD CONSTRAINT respostas_checklist_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: respostas_checklist respostas_checklist_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.respostas_checklist
    ADD CONSTRAINT respostas_checklist_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.itens_checklist(id) ON DELETE CASCADE;


--
-- Name: respostas_checklist respostas_checklist_responsavel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.respostas_checklist
    ADD CONSTRAINT respostas_checklist_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES public.servidores(id);


--
-- Name: respostas_checklist respostas_checklist_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.respostas_checklist
    ADD CONSTRAINT respostas_checklist_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: retornos_bancarios retornos_bancarios_processado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.retornos_bancarios
    ADD CONSTRAINT retornos_bancarios_processado_por_fkey FOREIGN KEY (processado_por) REFERENCES public.profiles(id);


--
-- Name: retornos_bancarios retornos_bancarios_remessa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.retornos_bancarios
    ADD CONSTRAINT retornos_bancarios_remessa_id_fkey FOREIGN KEY (remessa_id) REFERENCES public.remessas_bancarias(id);


--
-- Name: reunioes reunioes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reunioes
    ADD CONSTRAINT reunioes_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: reunioes reunioes_organizador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reunioes
    ADD CONSTRAINT reunioes_organizador_id_fkey FOREIGN KEY (organizador_id) REFERENCES public.servidores(id);


--
-- Name: reunioes reunioes_unidade_responsavel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reunioes
    ADD CONSTRAINT reunioes_unidade_responsavel_id_fkey FOREIGN KEY (unidade_responsavel_id) REFERENCES public.estrutura_organizacional(id);


--
-- Name: reunioes reunioes_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reunioes
    ADD CONSTRAINT reunioes_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: riscos_institucionais riscos_institucionais_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.riscos_institucionais
    ADD CONSTRAINT riscos_institucionais_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: riscos_institucionais riscos_institucionais_processo_raci_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.riscos_institucionais
    ADD CONSTRAINT riscos_institucionais_processo_raci_id_fkey FOREIGN KEY (processo_raci_id) REFERENCES public.matriz_raci_processos(id);


--
-- Name: riscos_institucionais riscos_institucionais_responsavel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.riscos_institucionais
    ADD CONSTRAINT riscos_institucionais_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES public.servidores(id);


--
-- Name: riscos_institucionais riscos_institucionais_unidade_responsavel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.riscos_institucionais
    ADD CONSTRAINT riscos_institucionais_unidade_responsavel_id_fkey FOREIGN KEY (unidade_responsavel_id) REFERENCES public.estrutura_organizacional(id);


--
-- Name: riscos_institucionais riscos_institucionais_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.riscos_institucionais
    ADD CONSTRAINT riscos_institucionais_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: role_permissions role_permissions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: role_permissions role_permissions_permission_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_fkey FOREIGN KEY (permission) REFERENCES public.module_permissions_catalog(permission_code) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: rubricas rubricas_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rubricas
    ADD CONSTRAINT rubricas_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: rubricas_historico rubricas_historico_alterado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rubricas_historico
    ADD CONSTRAINT rubricas_historico_alterado_por_fkey FOREIGN KEY (alterado_por) REFERENCES public.profiles(id);


--
-- Name: rubricas_historico rubricas_historico_rubrica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rubricas_historico
    ADD CONSTRAINT rubricas_historico_rubrica_id_fkey FOREIGN KEY (rubrica_id) REFERENCES public.rubricas(id) ON DELETE CASCADE;


--
-- Name: rubricas rubricas_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rubricas
    ADD CONSTRAINT rubricas_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.profiles(id);


--
-- Name: servidor_regime servidor_regime_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servidor_regime
    ADD CONSTRAINT servidor_regime_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: servidor_regime servidor_regime_jornada_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servidor_regime
    ADD CONSTRAINT servidor_regime_jornada_id_fkey FOREIGN KEY (jornada_id) REFERENCES public.config_jornada_padrao(id);


--
-- Name: servidor_regime servidor_regime_regime_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servidor_regime
    ADD CONSTRAINT servidor_regime_regime_id_fkey FOREIGN KEY (regime_id) REFERENCES public.regimes_trabalho(id);


--
-- Name: servidor_regime servidor_regime_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servidor_regime
    ADD CONSTRAINT servidor_regime_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.servidores(id);


--
-- Name: servidor_tag_vinculos servidor_tag_vinculos_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servidor_tag_vinculos
    ADD CONSTRAINT servidor_tag_vinculos_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: servidor_tag_vinculos servidor_tag_vinculos_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servidor_tag_vinculos
    ADD CONSTRAINT servidor_tag_vinculos_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.servidores(id) ON DELETE CASCADE;


--
-- Name: servidor_tag_vinculos servidor_tag_vinculos_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servidor_tag_vinculos
    ADD CONSTRAINT servidor_tag_vinculos_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.servidor_tags(id) ON DELETE CASCADE;


--
-- Name: servidor_tags servidor_tags_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servidor_tags
    ADD CONSTRAINT servidor_tags_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: servidores servidores_cargo_atual_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servidores
    ADD CONSTRAINT servidores_cargo_atual_id_fkey FOREIGN KEY (cargo_atual_id) REFERENCES public.cargos(id);


--
-- Name: servidores servidores_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servidores
    ADD CONSTRAINT servidores_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: servidores servidores_unidade_atual_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servidores
    ADD CONSTRAINT servidores_unidade_atual_id_fkey FOREIGN KEY (unidade_atual_id) REFERENCES public.estrutura_organizacional(id);


--
-- Name: servidores servidores_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servidores
    ADD CONSTRAINT servidores_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: servidores servidores_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servidores
    ADD CONSTRAINT servidores_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: servidores servidores_vinculo_externo_ato_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servidores
    ADD CONSTRAINT servidores_vinculo_externo_ato_id_fkey FOREIGN KEY (vinculo_externo_ato_id) REFERENCES public.documentos(id) ON DELETE SET NULL;


--
-- Name: solicitacoes_abono solicitacoes_abono_aprovado_chefia_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitacoes_abono
    ADD CONSTRAINT solicitacoes_abono_aprovado_chefia_por_fkey FOREIGN KEY (aprovado_chefia_por) REFERENCES auth.users(id);


--
-- Name: solicitacoes_abono solicitacoes_abono_aprovado_rh_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitacoes_abono
    ADD CONSTRAINT solicitacoes_abono_aprovado_rh_por_fkey FOREIGN KEY (aprovado_rh_por) REFERENCES auth.users(id);


--
-- Name: solicitacoes_abono solicitacoes_abono_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitacoes_abono
    ADD CONSTRAINT solicitacoes_abono_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: solicitacoes_abono solicitacoes_abono_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitacoes_abono
    ADD CONSTRAINT solicitacoes_abono_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.servidores(id);


--
-- Name: solicitacoes_abono solicitacoes_abono_tipo_abono_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitacoes_abono
    ADD CONSTRAINT solicitacoes_abono_tipo_abono_id_fkey FOREIGN KEY (tipo_abono_id) REFERENCES public.tipos_abono(id);


--
-- Name: solicitacoes_ajuste_ponto solicitacoes_ajuste_ponto_aprovador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitacoes_ajuste_ponto
    ADD CONSTRAINT solicitacoes_ajuste_ponto_aprovador_id_fkey FOREIGN KEY (aprovador_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: solicitacoes_ajuste_ponto solicitacoes_ajuste_ponto_registro_ponto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitacoes_ajuste_ponto
    ADD CONSTRAINT solicitacoes_ajuste_ponto_registro_ponto_id_fkey FOREIGN KEY (registro_ponto_id) REFERENCES public.registros_ponto(id) ON DELETE CASCADE;


--
-- Name: solicitacoes_ajuste_ponto solicitacoes_ajuste_ponto_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitacoes_ajuste_ponto
    ADD CONSTRAINT solicitacoes_ajuste_ponto_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: solicitacoes_sic solicitacoes_sic_recurso_respondido_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitacoes_sic
    ADD CONSTRAINT solicitacoes_sic_recurso_respondido_por_fkey FOREIGN KEY (recurso_respondido_por) REFERENCES public.servidores(id);


--
-- Name: solicitacoes_sic solicitacoes_sic_respondido_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitacoes_sic
    ADD CONSTRAINT solicitacoes_sic_respondido_por_fkey FOREIGN KEY (respondido_por) REFERENCES public.servidores(id);


--
-- Name: tabela_inss tabela_inss_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tabela_inss
    ADD CONSTRAINT tabela_inss_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: tabela_irrf tabela_irrf_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tabela_irrf
    ADD CONSTRAINT tabela_irrf_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: termos_cessao termos_cessao_agenda_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.termos_cessao
    ADD CONSTRAINT termos_cessao_agenda_id_fkey FOREIGN KEY (agenda_id) REFERENCES public.agenda_unidade(id) ON DELETE CASCADE;


--
-- Name: termos_cessao termos_cessao_chefe_responsavel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.termos_cessao
    ADD CONSTRAINT termos_cessao_chefe_responsavel_id_fkey FOREIGN KEY (chefe_responsavel_id) REFERENCES public.nomeacoes_chefe_unidade(id);


--
-- Name: termos_cessao termos_cessao_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.termos_cessao
    ADD CONSTRAINT termos_cessao_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: termos_cessao termos_cessao_unidade_local_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.termos_cessao
    ADD CONSTRAINT termos_cessao_unidade_local_id_fkey FOREIGN KEY (unidade_local_id) REFERENCES public.unidades_locais(id);


--
-- Name: termos_cessao termos_cessao_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.termos_cessao
    ADD CONSTRAINT termos_cessao_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: tipos_abono tipos_abono_instituicao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipos_abono
    ADD CONSTRAINT tipos_abono_instituicao_id_fkey FOREIGN KEY (instituicao_id) REFERENCES public.config_institucional(id);


--
-- Name: unidades_locais unidades_locais_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unidades_locais
    ADD CONSTRAINT unidades_locais_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: unidades_locais unidades_locais_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unidades_locais
    ADD CONSTRAINT unidades_locais_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: user_modules user_modules_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_modules
    ADD CONSTRAINT user_modules_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_org_units user_org_units_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_org_units
    ADD CONSTRAINT user_org_units_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: user_org_units user_org_units_unidade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_org_units
    ADD CONSTRAINT user_org_units_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.estrutura_organizacional(id) ON DELETE CASCADE;


--
-- Name: user_org_units user_org_units_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_org_units
    ADD CONSTRAINT user_org_units_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_permissions user_permissions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: user_permissions user_permissions_permission_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_permission_fkey FOREIGN KEY (permission) REFERENCES public.module_permissions_catalog(permission_code) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_permissions user_permissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: _backup_usuario_modulos_old usuario_modulos_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._backup_usuario_modulos_old
    ADD CONSTRAINT usuario_modulos_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: _backup_usuario_modulos_old usuario_modulos_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._backup_usuario_modulos_old
    ADD CONSTRAINT usuario_modulos_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: viagens_diarias viagens_diarias_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.viagens_diarias
    ADD CONSTRAINT viagens_diarias_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: viagens_diarias viagens_diarias_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.viagens_diarias
    ADD CONSTRAINT viagens_diarias_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.servidores(id) ON DELETE CASCADE;


--
-- Name: vinculos_funcionais vinculos_funcionais_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vinculos_funcionais
    ADD CONSTRAINT vinculos_funcionais_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.servidores(id) ON DELETE CASCADE;


--
-- Name: vinculos_servidor vinculos_servidor_cargo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vinculos_servidor
    ADD CONSTRAINT vinculos_servidor_cargo_id_fkey FOREIGN KEY (cargo_id) REFERENCES public.cargos(id);


--
-- Name: vinculos_servidor vinculos_servidor_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vinculos_servidor
    ADD CONSTRAINT vinculos_servidor_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.servidores(id) ON DELETE CASCADE;


--
-- Name: vinculos_servidor vinculos_servidor_unidade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vinculos_servidor
    ADD CONSTRAINT vinculos_servidor_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.estrutura_organizacional(id);


--
-- Name: cadastro_arbitros_modalidades Admin pode atualizar modalidades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin pode atualizar modalidades" ON public.cadastro_arbitros_modalidades FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: cadastro_arbitros_modalidades Admin pode deletar modalidades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin pode deletar modalidades" ON public.cadastro_arbitros_modalidades FOR DELETE TO authenticated USING (true);


--
-- Name: gestores_escolares_historico Admin pode ver todo histórico; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin pode ver todo histórico" ON public.gestores_escolares_historico FOR SELECT TO authenticated USING ((public.usuario_tem_permissao(auth.uid(), 'educacao.gestores.visualizar'::text) OR public.usuario_eh_super_admin(auth.uid())));


--
-- Name: config_paginas_publicas Apenas admins podem alterar config paginas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Apenas admins podem alterar config paginas" ON public.config_paginas_publicas USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));


--
-- Name: links_uteis Apenas admins podem alterar links uteis; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Apenas admins podem alterar links uteis" ON public.links_uteis USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));


--
-- Name: config_menu_publico Apenas admins podem alterar menu publico; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Apenas admins podem alterar menu publico" ON public.config_menu_publico USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));


--
-- Name: config_paginas_publicas Leitura publica do status das paginas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Leitura publica do status das paginas" ON public.config_paginas_publicas FOR SELECT TO anon, authenticated USING (true);


--
-- Name: config_menu_publico Leitura publica dos itens de menu; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Leitura publica dos itens de menu" ON public.config_menu_publico FOR SELECT USING (true);


--
-- Name: links_uteis Leitura publica dos links uteis; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Leitura publica dos links uteis" ON public.links_uteis FOR SELECT TO anon, authenticated USING (true);


--
-- Name: publicacoes_lai Publicacoes LAI publicadas sao publicas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Publicacoes LAI publicadas sao publicas" ON public.publicacoes_lai FOR SELECT TO anon USING ((publicado = true));


--
-- Name: cadastro_arbitros_modalidades Público pode inserir modalidades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Público pode inserir modalidades" ON public.cadastro_arbitros_modalidades FOR INSERT TO anon, authenticated WITH CHECK (true);


--
-- Name: cadastro_arbitros Qualquer pessoa pode se cadastrar como árbitro; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Qualquer pessoa pode se cadastrar como árbitro" ON public.cadastro_arbitros FOR INSERT TO anon, authenticated WITH CHECK (true);


--
-- Name: _backup_usuario_modulos_old; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public._backup_usuario_modulos_old ENABLE ROW LEVEL SECURITY;

--
-- Name: acesso_processo_sigiloso; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acesso_processo_sigiloso ENABLE ROW LEVEL SECURITY;

--
-- Name: _backup_usuario_modulos_old acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public._backup_usuario_modulos_old FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: acesso_processo_sigiloso acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.acesso_processo_sigiloso FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: acoes acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.acoes FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: agrupamento_unidade_vinculo acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.agrupamento_unidade_vinculo FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: approval_delegations acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.approval_delegations FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: approval_requests acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.approval_requests FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: audit_log_licitacoes acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.audit_log_licitacoes FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: avaliacoes_controle acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.avaliacoes_controle FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: avaliacoes_risco acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.avaliacoes_risco FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: bancos_cnab acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.bancos_cnab FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: calendario_federacao acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.calendario_federacao FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: campanhas_inventario acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.campanhas_inventario FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: cargo_unidade_compatibilidade acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.cargo_unidade_compatibilidade FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: categorias_material acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.categorias_material FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: categorias_noticias_eventos acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.categorias_noticias_eventos FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: centros_custo acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.centros_custo FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: cessoes acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.cessoes FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: checklists_conformidade acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.checklists_conformidade FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: cms_banners acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.cms_banners FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: cms_categorias acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.cms_categorias FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: cms_conteudos acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.cms_conteudos FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: cms_galeria_fotos acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.cms_galeria_fotos FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: cms_galerias acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.cms_galerias FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: cms_media acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.cms_media FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: coletas_inventario acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.coletas_inventario FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: composicao_cargos acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.composicao_cargos FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: conciliacoes_inventario acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.conciliacoes_inventario FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: config_agrupamento_unidades acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.config_agrupamento_unidades FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: config_assinatura_frequencia acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.config_assinatura_frequencia FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: config_assinatura_reuniao acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.config_assinatura_reuniao FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: config_autarquia acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.config_autarquia FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: config_compensacao acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.config_compensacao FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: config_fechamento_folha acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.config_fechamento_folha FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: config_incidencias acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.config_incidencias FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: config_institucional acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.config_institucional FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: config_jornada_padrao acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.config_jornada_padrao FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: config_motivos_desligamento acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.config_motivos_desligamento FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: config_paginas_historico acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.config_paginas_historico FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: config_paginas_publicas acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.config_paginas_publicas FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: config_parametros_meta acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.config_parametros_meta FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: config_parametros_valores acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.config_parametros_valores FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: config_regras_calculo acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.config_regras_calculo FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: config_rubricas acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.config_rubricas FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: config_situacoes_funcionais acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.config_situacoes_funcionais FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: config_tipos_ato acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.config_tipos_ato FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: config_tipos_onus acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.config_tipos_onus FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: config_tipos_rubrica acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.config_tipos_rubrica FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: config_tipos_servidor acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.config_tipos_servidor FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: configuracao_jornada acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.configuracao_jornada FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: contas_autarquia acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.contas_autarquia FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: contatos_eventos_esportivos acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.contatos_eventos_esportivos FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: conteudo_rascunho acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.conteudo_rascunho FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: controles_internos acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.controles_internos FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: creditos_adicionais acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.creditos_adicionais FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: dados_oficiais acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.dados_oficiais FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: debitos_tecnicos acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.debitos_tecnicos FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: decisoes_administrativas acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.decisoes_administrativas FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: demandas_ascom acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.demandas_ascom FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: demandas_ascom_anexos acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.demandas_ascom_anexos FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: demandas_ascom_comentarios acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.demandas_ascom_comentarios FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: demandas_ascom_entregaveis acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.demandas_ascom_entregaveis FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: designacoes acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.designacoes FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: despachos acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.despachos FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: dias_nao_uteis acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.dias_nao_uteis FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: documentos acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.documentos FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: documentos_cedencia acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.documentos_cedencia FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: documentos_preparatorios_licitacao acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.documentos_preparatorios_licitacao FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: documentos_processo acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.documentos_processo FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: documentos_requerimento_servidor acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.documentos_requerimento_servidor FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: encaminhamentos acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.encaminhamentos FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: escolas_jer acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.escolas_jer FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: estoque acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.estoque FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: estrutura_organizacional acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.estrutura_organizacional FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: eventos_esocial acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.eventos_esocial FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: evidencias_controle acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.evidencias_controle FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: exportacoes_folha acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.exportacoes_folha FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: federacao_arbitros acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.federacao_arbitros FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: federacao_espacos_cedidos acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.federacao_espacos_cedidos FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: federacao_parcerias acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.federacao_parcerias FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: federacoes_esportivas acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.federacoes_esportivas FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: feriados acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.feriados FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_acoes_orcamentarias acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.fin_acoes_orcamentarias FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_adiantamento_itens acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.fin_adiantamento_itens FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_adiantamentos acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.fin_adiantamentos FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_alteracoes_orcamentarias acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.fin_alteracoes_orcamentarias FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_audit_log acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.fin_audit_log FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_checklist_ci acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.fin_checklist_ci FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_contas_bancarias acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.fin_contas_bancarias FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_documentos acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.fin_documentos FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_dotacoes acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.fin_dotacoes FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_empenho_anulacoes acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.fin_empenho_anulacoes FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_empenhos acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.fin_empenhos FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_extrato_transacoes acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.fin_extrato_transacoes FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_extratos_bancarios acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.fin_extratos_bancarios FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_fechamentos acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.fin_fechamentos FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_fontes_recurso acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.fin_fontes_recurso FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_lancamentos_contabeis acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.fin_lancamentos_contabeis FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_liquidacoes acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.fin_liquidacoes FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_naturezas_despesa acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.fin_naturezas_despesa FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_pagamentos acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.fin_pagamentos FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_parametros acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.fin_parametros FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_plano_contas acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.fin_plano_contas FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_programas_orcamentarios acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.fin_programas_orcamentarios FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_receitas acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.fin_receitas FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_restos_pagar acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.fin_restos_pagar FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_solicitacao_itens acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.fin_solicitacao_itens FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_solicitacoes acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.fin_solicitacoes FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_sub_empenhos acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.fin_sub_empenhos FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: folha_historico_status acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.folha_historico_status FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: frequencia_arquivos acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.frequencia_arquivos FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: frequencia_pacotes acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.frequencia_pacotes FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: galeria_eventos_esportivos acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.galeria_eventos_esportivos FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: gestores_escolares acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.gestores_escolares FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: gestores_escolares_historico acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.gestores_escolares_historico FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: historico_conteudo_oficial acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.historico_conteudo_oficial FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: historico_convites_reuniao acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.historico_convites_reuniao FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: historico_funcional acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.historico_funcional FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: historico_lai acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.historico_lai FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: historico_patrimonio acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.historico_patrimonio FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: horarios_jornada acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.horarios_jornada FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: instituicoes acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.instituicoes FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: itens_ata_registro_preco acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.itens_ata_registro_preco FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: itens_checklist acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.itens_checklist FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: itens_contrato acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.itens_contrato FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: itens_processo_licitatorio acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.itens_processo_licitatorio FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: itens_retorno_bancario acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.itens_retorno_bancario FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: liquidacoes acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.liquidacoes FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: manutencoes_patrimonio acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.manutencoes_patrimonio FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: matriz_raci_atribuicoes acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.matriz_raci_atribuicoes FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: matriz_raci_papeis acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.matriz_raci_papeis FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: matriz_raci_processos acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.matriz_raci_processos FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: memorandos_lotacao acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.memorandos_lotacao FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: modelos_mensagem_reuniao acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.modelos_mensagem_reuniao FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: module_access_scopes acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.module_access_scopes FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: module_permissions_catalog acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.module_permissions_catalog FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: module_settings acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.module_settings FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: movimentacoes_bem acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.movimentacoes_bem FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: movimentacoes_estoque acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.movimentacoes_estoque FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: movimentacoes_processo acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.movimentacoes_processo FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: nomeacoes_chefe_unidade acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.nomeacoes_chefe_unidade FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: noticias_eventos_esportivos acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.noticias_eventos_esportivos FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: ocorrencias_patrimonio acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.ocorrencias_patrimonio FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: ocorrencias_servidor acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.ocorrencias_servidor FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: pareceres_tecnicos acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.pareceres_tecnicos FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: participantes_reuniao acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.participantes_reuniao FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: patrimonio_unidade acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.patrimonio_unidade FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: pensoes_alimenticias acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.pensoes_alimenticias FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: planos_tratamento_risco acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.planos_tratamento_risco FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: portal_diretoria acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.portal_diretoria FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: portarias_servidor acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.portarias_servidor FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: prazos_lai acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.prazos_lai FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: prazos_processo acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.prazos_processo FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: pre_cadastros acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.pre_cadastros FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: processos_administrativos acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.processos_administrativos FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: programas acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.programas FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: propostas_licitacao acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.propostas_licitacao FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: provimentos acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.provimentos FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: publicacoes_lai acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.publicacoes_lai FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: publicacoes_legais acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.publicacoes_legais FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: recursos_lai acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.recursos_lai FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: regimes_trabalho acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.regimes_trabalho FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: remessas_bancarias acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.remessas_bancarias FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: requisicao_itens acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.requisicao_itens FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: requisicoes_material acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.requisicoes_material FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: respostas_checklist acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.respostas_checklist FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: retornos_bancarios acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.retornos_bancarios FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: reunioes acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.reunioes FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: riscos_institucionais acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.riscos_institucionais FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: rubricas_historico acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.rubricas_historico FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: servidor_regime acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.servidor_regime FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: servidor_tag_vinculos acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.servidor_tag_vinculos FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: servidor_tags acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.servidor_tags FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: solicitacoes_sic acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.solicitacoes_sic FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: termos_cessao acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.termos_cessao FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: user_org_units acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.user_org_units FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: vinculos_funcionais acesso_total_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_delete ON public.vinculos_funcionais FOR DELETE TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: _backup_usuario_modulos_old acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public._backup_usuario_modulos_old FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: acesso_processo_sigiloso acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.acesso_processo_sigiloso FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: acoes acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.acoes FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: agrupamento_unidade_vinculo acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.agrupamento_unidade_vinculo FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: approval_delegations acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.approval_delegations FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: approval_requests acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.approval_requests FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: audit_log_licitacoes acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.audit_log_licitacoes FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: avaliacoes_controle acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.avaliacoes_controle FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: avaliacoes_risco acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.avaliacoes_risco FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: bancos_cnab acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.bancos_cnab FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: calendario_federacao acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.calendario_federacao FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: campanhas_inventario acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.campanhas_inventario FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: cargo_unidade_compatibilidade acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.cargo_unidade_compatibilidade FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: categorias_material acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.categorias_material FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: categorias_noticias_eventos acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.categorias_noticias_eventos FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: centros_custo acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.centros_custo FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: cessoes acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.cessoes FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: checklists_conformidade acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.checklists_conformidade FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: cms_banners acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.cms_banners FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: cms_categorias acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.cms_categorias FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: cms_conteudos acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.cms_conteudos FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: cms_galeria_fotos acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.cms_galeria_fotos FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: cms_galerias acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.cms_galerias FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: cms_media acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.cms_media FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: coletas_inventario acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.coletas_inventario FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: composicao_cargos acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.composicao_cargos FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: conciliacoes_inventario acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.conciliacoes_inventario FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: config_agrupamento_unidades acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.config_agrupamento_unidades FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: config_assinatura_frequencia acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.config_assinatura_frequencia FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: config_assinatura_reuniao acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.config_assinatura_reuniao FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: config_autarquia acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.config_autarquia FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: config_compensacao acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.config_compensacao FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: config_fechamento_folha acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.config_fechamento_folha FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: config_incidencias acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.config_incidencias FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: config_institucional acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.config_institucional FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: config_jornada_padrao acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.config_jornada_padrao FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: config_motivos_desligamento acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.config_motivos_desligamento FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: config_paginas_historico acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.config_paginas_historico FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: config_paginas_publicas acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.config_paginas_publicas FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: config_parametros_meta acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.config_parametros_meta FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: config_parametros_valores acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.config_parametros_valores FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: config_regras_calculo acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.config_regras_calculo FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: config_rubricas acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.config_rubricas FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: config_situacoes_funcionais acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.config_situacoes_funcionais FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: config_tipos_ato acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.config_tipos_ato FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: config_tipos_onus acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.config_tipos_onus FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: config_tipos_rubrica acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.config_tipos_rubrica FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: config_tipos_servidor acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.config_tipos_servidor FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: configuracao_jornada acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.configuracao_jornada FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: contas_autarquia acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.contas_autarquia FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: contatos_eventos_esportivos acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.contatos_eventos_esportivos FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: conteudo_rascunho acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.conteudo_rascunho FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: controles_internos acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.controles_internos FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: creditos_adicionais acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.creditos_adicionais FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: dados_oficiais acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.dados_oficiais FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: debitos_tecnicos acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.debitos_tecnicos FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: decisoes_administrativas acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.decisoes_administrativas FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: demandas_ascom acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.demandas_ascom FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: demandas_ascom_anexos acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.demandas_ascom_anexos FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: demandas_ascom_comentarios acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.demandas_ascom_comentarios FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: demandas_ascom_entregaveis acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.demandas_ascom_entregaveis FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: designacoes acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.designacoes FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: despachos acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.despachos FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: dias_nao_uteis acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.dias_nao_uteis FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: documentos acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.documentos FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: documentos_cedencia acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.documentos_cedencia FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: documentos_preparatorios_licitacao acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.documentos_preparatorios_licitacao FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: documentos_processo acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.documentos_processo FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: documentos_requerimento_servidor acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.documentos_requerimento_servidor FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: encaminhamentos acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.encaminhamentos FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: escolas_jer acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.escolas_jer FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: estoque acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.estoque FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: estrutura_organizacional acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.estrutura_organizacional FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: eventos_esocial acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.eventos_esocial FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: evidencias_controle acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.evidencias_controle FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: exportacoes_folha acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.exportacoes_folha FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: federacao_arbitros acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.federacao_arbitros FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: federacao_espacos_cedidos acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.federacao_espacos_cedidos FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: federacao_parcerias acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.federacao_parcerias FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: federacoes_esportivas acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.federacoes_esportivas FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: feriados acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.feriados FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_acoes_orcamentarias acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.fin_acoes_orcamentarias FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_adiantamento_itens acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.fin_adiantamento_itens FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_adiantamentos acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.fin_adiantamentos FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_alteracoes_orcamentarias acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.fin_alteracoes_orcamentarias FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_audit_log acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.fin_audit_log FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_checklist_ci acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.fin_checklist_ci FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_contas_bancarias acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.fin_contas_bancarias FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_documentos acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.fin_documentos FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_dotacoes acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.fin_dotacoes FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_empenho_anulacoes acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.fin_empenho_anulacoes FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_empenhos acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.fin_empenhos FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_extrato_transacoes acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.fin_extrato_transacoes FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_extratos_bancarios acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.fin_extratos_bancarios FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_fechamentos acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.fin_fechamentos FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_fontes_recurso acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.fin_fontes_recurso FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_lancamentos_contabeis acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.fin_lancamentos_contabeis FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_liquidacoes acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.fin_liquidacoes FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_naturezas_despesa acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.fin_naturezas_despesa FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_pagamentos acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.fin_pagamentos FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_parametros acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.fin_parametros FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_plano_contas acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.fin_plano_contas FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_programas_orcamentarios acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.fin_programas_orcamentarios FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_receitas acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.fin_receitas FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_restos_pagar acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.fin_restos_pagar FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_solicitacao_itens acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.fin_solicitacao_itens FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_solicitacoes acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.fin_solicitacoes FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_sub_empenhos acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.fin_sub_empenhos FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: folha_historico_status acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.folha_historico_status FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: frequencia_arquivos acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.frequencia_arquivos FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: frequencia_pacotes acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.frequencia_pacotes FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: galeria_eventos_esportivos acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.galeria_eventos_esportivos FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: gestores_escolares_historico acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.gestores_escolares_historico FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: historico_conteudo_oficial acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.historico_conteudo_oficial FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: historico_convites_reuniao acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.historico_convites_reuniao FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: historico_funcional acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.historico_funcional FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: historico_lai acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.historico_lai FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: historico_patrimonio acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.historico_patrimonio FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: horarios_jornada acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.horarios_jornada FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: instituicoes acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.instituicoes FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: itens_ata_registro_preco acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.itens_ata_registro_preco FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: itens_checklist acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.itens_checklist FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: itens_contrato acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.itens_contrato FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: itens_processo_licitatorio acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.itens_processo_licitatorio FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: itens_retorno_bancario acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.itens_retorno_bancario FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: liquidacoes acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.liquidacoes FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: manutencoes_patrimonio acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.manutencoes_patrimonio FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: matriz_raci_atribuicoes acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.matriz_raci_atribuicoes FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: matriz_raci_papeis acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.matriz_raci_papeis FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: matriz_raci_processos acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.matriz_raci_processos FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: memorandos_lotacao acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.memorandos_lotacao FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: modelos_mensagem_reuniao acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.modelos_mensagem_reuniao FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: module_access_scopes acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.module_access_scopes FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: module_permissions_catalog acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.module_permissions_catalog FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: module_settings acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.module_settings FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: movimentacoes_bem acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.movimentacoes_bem FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: movimentacoes_estoque acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.movimentacoes_estoque FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: movimentacoes_processo acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.movimentacoes_processo FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: nomeacoes_chefe_unidade acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.nomeacoes_chefe_unidade FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: noticias_eventos_esportivos acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.noticias_eventos_esportivos FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: ocorrencias_patrimonio acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.ocorrencias_patrimonio FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: ocorrencias_servidor acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.ocorrencias_servidor FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: pareceres_tecnicos acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.pareceres_tecnicos FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: participantes_reuniao acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.participantes_reuniao FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: patrimonio_unidade acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.patrimonio_unidade FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: pensoes_alimenticias acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.pensoes_alimenticias FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: planos_tratamento_risco acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.planos_tratamento_risco FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: portal_diretoria acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.portal_diretoria FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: portarias_servidor acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.portarias_servidor FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: prazos_lai acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.prazos_lai FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: prazos_processo acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.prazos_processo FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: pre_cadastros acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.pre_cadastros FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: processos_administrativos acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.processos_administrativos FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: programas acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.programas FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: propostas_licitacao acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.propostas_licitacao FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: provimentos acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.provimentos FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: publicacoes_lai acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.publicacoes_lai FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: publicacoes_legais acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.publicacoes_legais FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: recursos_lai acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.recursos_lai FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: regimes_trabalho acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.regimes_trabalho FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: remessas_bancarias acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.remessas_bancarias FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: requisicao_itens acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.requisicao_itens FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: requisicoes_material acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.requisicoes_material FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: respostas_checklist acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.respostas_checklist FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: retornos_bancarios acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.retornos_bancarios FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: reunioes acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.reunioes FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: riscos_institucionais acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.riscos_institucionais FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: rubricas_historico acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.rubricas_historico FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: servidor_regime acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.servidor_regime FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: servidor_tag_vinculos acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.servidor_tag_vinculos FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: servidor_tags acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.servidor_tags FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: solicitacoes_sic acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.solicitacoes_sic FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: termos_cessao acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.termos_cessao FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: user_org_units acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.user_org_units FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: vinculos_funcionais acesso_total_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_insert ON public.vinculos_funcionais FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: _backup_usuario_modulos_old acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public._backup_usuario_modulos_old FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: acesso_processo_sigiloso acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.acesso_processo_sigiloso FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: acoes acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.acoes FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: agrupamento_unidade_vinculo acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.agrupamento_unidade_vinculo FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: approval_delegations acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.approval_delegations FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: approval_requests acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.approval_requests FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: audit_log_licitacoes acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.audit_log_licitacoes FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: avaliacoes_controle acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.avaliacoes_controle FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: avaliacoes_risco acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.avaliacoes_risco FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: bancos_cnab acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.bancos_cnab FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: calendario_federacao acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.calendario_federacao FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: campanhas_inventario acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.campanhas_inventario FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: cargo_unidade_compatibilidade acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.cargo_unidade_compatibilidade FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: categorias_material acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.categorias_material FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: categorias_noticias_eventos acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.categorias_noticias_eventos FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: centros_custo acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.centros_custo FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: cessoes acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.cessoes FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: checklists_conformidade acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.checklists_conformidade FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: cms_banners acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.cms_banners FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: cms_categorias acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.cms_categorias FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: cms_conteudos acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.cms_conteudos FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: cms_galeria_fotos acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.cms_galeria_fotos FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: cms_galerias acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.cms_galerias FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: cms_media acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.cms_media FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: coletas_inventario acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.coletas_inventario FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: composicao_cargos acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.composicao_cargos FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: conciliacoes_inventario acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.conciliacoes_inventario FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: config_agrupamento_unidades acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.config_agrupamento_unidades FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: config_assinatura_frequencia acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.config_assinatura_frequencia FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: config_assinatura_reuniao acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.config_assinatura_reuniao FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: config_autarquia acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.config_autarquia FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: config_compensacao acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.config_compensacao FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: config_fechamento_folha acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.config_fechamento_folha FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: config_incidencias acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.config_incidencias FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: config_institucional acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.config_institucional FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: config_jornada_padrao acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.config_jornada_padrao FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: config_motivos_desligamento acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.config_motivos_desligamento FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: config_paginas_historico acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.config_paginas_historico FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: config_parametros_meta acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.config_parametros_meta FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: config_parametros_valores acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.config_parametros_valores FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: config_regras_calculo acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.config_regras_calculo FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: config_rubricas acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.config_rubricas FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: config_situacoes_funcionais acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.config_situacoes_funcionais FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: config_tipos_ato acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.config_tipos_ato FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: config_tipos_onus acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.config_tipos_onus FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: config_tipos_rubrica acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.config_tipos_rubrica FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: config_tipos_servidor acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.config_tipos_servidor FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: configuracao_jornada acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.configuracao_jornada FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: contas_autarquia acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.contas_autarquia FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: contatos_eventos_esportivos acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.contatos_eventos_esportivos FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: conteudo_rascunho acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.conteudo_rascunho FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: controles_internos acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.controles_internos FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: creditos_adicionais acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.creditos_adicionais FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: dados_oficiais acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.dados_oficiais FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: debitos_tecnicos acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.debitos_tecnicos FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: decisoes_administrativas acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.decisoes_administrativas FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: demandas_ascom acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.demandas_ascom FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: demandas_ascom_anexos acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.demandas_ascom_anexos FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: demandas_ascom_comentarios acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.demandas_ascom_comentarios FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: demandas_ascom_entregaveis acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.demandas_ascom_entregaveis FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: designacoes acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.designacoes FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: despachos acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.despachos FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: dias_nao_uteis acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.dias_nao_uteis FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: documentos acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.documentos FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: documentos_cedencia acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.documentos_cedencia FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: documentos_preparatorios_licitacao acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.documentos_preparatorios_licitacao FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: documentos_processo acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.documentos_processo FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: documentos_requerimento_servidor acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.documentos_requerimento_servidor FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: encaminhamentos acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.encaminhamentos FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: estoque acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.estoque FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: estrutura_organizacional acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.estrutura_organizacional FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: eventos_esocial acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.eventos_esocial FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: evidencias_controle acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.evidencias_controle FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: exportacoes_folha acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.exportacoes_folha FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: federacao_arbitros acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.federacao_arbitros FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: federacao_espacos_cedidos acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.federacao_espacos_cedidos FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: federacao_parcerias acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.federacao_parcerias FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: federacoes_esportivas acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.federacoes_esportivas FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: feriados acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.feriados FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_acoes_orcamentarias acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.fin_acoes_orcamentarias FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_adiantamento_itens acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.fin_adiantamento_itens FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_adiantamentos acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.fin_adiantamentos FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_alteracoes_orcamentarias acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.fin_alteracoes_orcamentarias FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_audit_log acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.fin_audit_log FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_checklist_ci acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.fin_checklist_ci FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_contas_bancarias acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.fin_contas_bancarias FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_documentos acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.fin_documentos FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_dotacoes acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.fin_dotacoes FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_empenho_anulacoes acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.fin_empenho_anulacoes FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_empenhos acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.fin_empenhos FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_extrato_transacoes acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.fin_extrato_transacoes FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_extratos_bancarios acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.fin_extratos_bancarios FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_fechamentos acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.fin_fechamentos FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_fontes_recurso acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.fin_fontes_recurso FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_lancamentos_contabeis acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.fin_lancamentos_contabeis FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_liquidacoes acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.fin_liquidacoes FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_naturezas_despesa acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.fin_naturezas_despesa FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_pagamentos acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.fin_pagamentos FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_parametros acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.fin_parametros FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_plano_contas acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.fin_plano_contas FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_programas_orcamentarios acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.fin_programas_orcamentarios FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_receitas acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.fin_receitas FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_restos_pagar acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.fin_restos_pagar FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_solicitacao_itens acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.fin_solicitacao_itens FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_solicitacoes acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.fin_solicitacoes FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: fin_sub_empenhos acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.fin_sub_empenhos FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: folha_historico_status acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.folha_historico_status FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: frequencia_arquivos acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.frequencia_arquivos FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: frequencia_pacotes acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.frequencia_pacotes FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: galeria_eventos_esportivos acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.galeria_eventos_esportivos FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: gestores_escolares_historico acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.gestores_escolares_historico FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: historico_conteudo_oficial acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.historico_conteudo_oficial FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: historico_convites_reuniao acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.historico_convites_reuniao FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: historico_funcional acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.historico_funcional FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: historico_lai acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.historico_lai FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: historico_patrimonio acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.historico_patrimonio FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: horarios_jornada acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.horarios_jornada FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: instituicoes acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.instituicoes FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: itens_ata_registro_preco acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.itens_ata_registro_preco FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: itens_checklist acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.itens_checklist FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: itens_contrato acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.itens_contrato FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: itens_processo_licitatorio acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.itens_processo_licitatorio FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: itens_retorno_bancario acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.itens_retorno_bancario FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: liquidacoes acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.liquidacoes FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: manutencoes_patrimonio acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.manutencoes_patrimonio FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: matriz_raci_atribuicoes acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.matriz_raci_atribuicoes FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: matriz_raci_papeis acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.matriz_raci_papeis FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: matriz_raci_processos acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.matriz_raci_processos FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: memorandos_lotacao acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.memorandos_lotacao FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: modelos_mensagem_reuniao acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.modelos_mensagem_reuniao FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: module_access_scopes acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.module_access_scopes FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: module_permissions_catalog acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.module_permissions_catalog FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: module_settings acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.module_settings FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: movimentacoes_bem acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.movimentacoes_bem FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: movimentacoes_estoque acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.movimentacoes_estoque FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: movimentacoes_processo acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.movimentacoes_processo FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: nomeacoes_chefe_unidade acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.nomeacoes_chefe_unidade FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: noticias_eventos_esportivos acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.noticias_eventos_esportivos FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: ocorrencias_patrimonio acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.ocorrencias_patrimonio FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: ocorrencias_servidor acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.ocorrencias_servidor FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: pareceres_tecnicos acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.pareceres_tecnicos FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: participantes_reuniao acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.participantes_reuniao FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: patrimonio_unidade acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.patrimonio_unidade FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: pensoes_alimenticias acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.pensoes_alimenticias FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: planos_tratamento_risco acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.planos_tratamento_risco FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: portal_diretoria acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.portal_diretoria FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: portarias_servidor acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.portarias_servidor FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: prazos_lai acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.prazos_lai FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: prazos_processo acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.prazos_processo FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: pre_cadastros acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.pre_cadastros FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: processos_administrativos acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.processos_administrativos FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: programas acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.programas FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: propostas_licitacao acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.propostas_licitacao FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: provimentos acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.provimentos FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: publicacoes_lai acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.publicacoes_lai FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: publicacoes_legais acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.publicacoes_legais FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: recursos_lai acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.recursos_lai FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: regimes_trabalho acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.regimes_trabalho FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: remessas_bancarias acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.remessas_bancarias FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: requisicao_itens acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.requisicao_itens FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: requisicoes_material acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.requisicoes_material FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: respostas_checklist acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.respostas_checklist FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: retornos_bancarios acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.retornos_bancarios FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: reunioes acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.reunioes FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: riscos_institucionais acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.riscos_institucionais FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: rubricas_historico acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.rubricas_historico FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: servidor_regime acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.servidor_regime FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: servidor_tag_vinculos acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.servidor_tag_vinculos FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: servidor_tags acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.servidor_tags FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: solicitacoes_sic acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.solicitacoes_sic FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: termos_cessao acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.termos_cessao FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: user_org_units acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.user_org_units FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: vinculos_funcionais acesso_total_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_select ON public.vinculos_funcionais FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));


--
-- Name: _backup_usuario_modulos_old acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public._backup_usuario_modulos_old FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: acesso_processo_sigiloso acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.acesso_processo_sigiloso FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: acoes acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.acoes FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: agrupamento_unidade_vinculo acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.agrupamento_unidade_vinculo FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: approval_delegations acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.approval_delegations FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: approval_requests acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.approval_requests FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: audit_log_licitacoes acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.audit_log_licitacoes FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: avaliacoes_controle acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.avaliacoes_controle FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: avaliacoes_risco acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.avaliacoes_risco FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: bancos_cnab acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.bancos_cnab FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: calendario_federacao acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.calendario_federacao FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: campanhas_inventario acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.campanhas_inventario FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: cargo_unidade_compatibilidade acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.cargo_unidade_compatibilidade FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: categorias_material acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.categorias_material FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: categorias_noticias_eventos acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.categorias_noticias_eventos FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: centros_custo acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.centros_custo FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: cessoes acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.cessoes FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: checklists_conformidade acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.checklists_conformidade FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: cms_banners acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.cms_banners FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: cms_categorias acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.cms_categorias FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: cms_conteudos acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.cms_conteudos FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: cms_galeria_fotos acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.cms_galeria_fotos FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: cms_galerias acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.cms_galerias FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: cms_media acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.cms_media FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: coletas_inventario acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.coletas_inventario FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: composicao_cargos acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.composicao_cargos FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: conciliacoes_inventario acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.conciliacoes_inventario FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: config_agrupamento_unidades acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.config_agrupamento_unidades FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: config_assinatura_frequencia acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.config_assinatura_frequencia FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: config_assinatura_reuniao acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.config_assinatura_reuniao FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: config_autarquia acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.config_autarquia FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: config_compensacao acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.config_compensacao FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: config_fechamento_folha acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.config_fechamento_folha FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: config_incidencias acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.config_incidencias FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: config_institucional acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.config_institucional FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: config_jornada_padrao acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.config_jornada_padrao FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: config_motivos_desligamento acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.config_motivos_desligamento FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: config_paginas_historico acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.config_paginas_historico FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: config_paginas_publicas acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.config_paginas_publicas FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: config_parametros_meta acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.config_parametros_meta FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: config_parametros_valores acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.config_parametros_valores FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: config_regras_calculo acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.config_regras_calculo FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: config_rubricas acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.config_rubricas FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: config_situacoes_funcionais acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.config_situacoes_funcionais FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: config_tipos_ato acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.config_tipos_ato FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: config_tipos_onus acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.config_tipos_onus FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: config_tipos_rubrica acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.config_tipos_rubrica FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: config_tipos_servidor acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.config_tipos_servidor FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: configuracao_jornada acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.configuracao_jornada FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: contas_autarquia acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.contas_autarquia FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: contatos_eventos_esportivos acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.contatos_eventos_esportivos FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: conteudo_rascunho acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.conteudo_rascunho FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: controles_internos acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.controles_internos FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: creditos_adicionais acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.creditos_adicionais FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: dados_oficiais acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.dados_oficiais FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: debitos_tecnicos acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.debitos_tecnicos FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: decisoes_administrativas acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.decisoes_administrativas FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: demandas_ascom acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.demandas_ascom FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: demandas_ascom_anexos acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.demandas_ascom_anexos FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: demandas_ascom_comentarios acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.demandas_ascom_comentarios FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: demandas_ascom_entregaveis acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.demandas_ascom_entregaveis FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: designacoes acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.designacoes FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: despachos acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.despachos FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: dias_nao_uteis acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.dias_nao_uteis FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: documentos acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.documentos FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: documentos_cedencia acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.documentos_cedencia FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: documentos_preparatorios_licitacao acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.documentos_preparatorios_licitacao FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: documentos_processo acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.documentos_processo FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: documentos_requerimento_servidor acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.documentos_requerimento_servidor FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: encaminhamentos acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.encaminhamentos FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: escolas_jer acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.escolas_jer FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: estoque acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.estoque FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: estrutura_organizacional acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.estrutura_organizacional FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: eventos_esocial acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.eventos_esocial FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: evidencias_controle acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.evidencias_controle FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: exportacoes_folha acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.exportacoes_folha FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: federacao_arbitros acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.federacao_arbitros FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: federacao_espacos_cedidos acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.federacao_espacos_cedidos FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: federacao_parcerias acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.federacao_parcerias FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: federacoes_esportivas acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.federacoes_esportivas FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: feriados acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.feriados FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_acoes_orcamentarias acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.fin_acoes_orcamentarias FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_adiantamento_itens acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.fin_adiantamento_itens FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_adiantamentos acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.fin_adiantamentos FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_alteracoes_orcamentarias acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.fin_alteracoes_orcamentarias FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_audit_log acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.fin_audit_log FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_checklist_ci acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.fin_checklist_ci FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_contas_bancarias acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.fin_contas_bancarias FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_documentos acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.fin_documentos FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_dotacoes acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.fin_dotacoes FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_empenho_anulacoes acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.fin_empenho_anulacoes FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_empenhos acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.fin_empenhos FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_extrato_transacoes acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.fin_extrato_transacoes FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_extratos_bancarios acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.fin_extratos_bancarios FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_fechamentos acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.fin_fechamentos FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_fontes_recurso acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.fin_fontes_recurso FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_lancamentos_contabeis acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.fin_lancamentos_contabeis FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_liquidacoes acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.fin_liquidacoes FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_naturezas_despesa acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.fin_naturezas_despesa FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_pagamentos acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.fin_pagamentos FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_parametros acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.fin_parametros FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_plano_contas acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.fin_plano_contas FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_programas_orcamentarios acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.fin_programas_orcamentarios FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_receitas acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.fin_receitas FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_restos_pagar acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.fin_restos_pagar FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_solicitacao_itens acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.fin_solicitacao_itens FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_solicitacoes acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.fin_solicitacoes FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: fin_sub_empenhos acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.fin_sub_empenhos FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: folha_historico_status acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.folha_historico_status FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: frequencia_arquivos acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.frequencia_arquivos FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: frequencia_pacotes acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.frequencia_pacotes FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: galeria_eventos_esportivos acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.galeria_eventos_esportivos FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: gestores_escolares acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.gestores_escolares FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: gestores_escolares_historico acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.gestores_escolares_historico FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: historico_conteudo_oficial acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.historico_conteudo_oficial FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: historico_convites_reuniao acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.historico_convites_reuniao FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: historico_funcional acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.historico_funcional FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: historico_lai acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.historico_lai FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: historico_patrimonio acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.historico_patrimonio FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: horarios_jornada acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.horarios_jornada FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: instituicoes acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.instituicoes FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: itens_ata_registro_preco acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.itens_ata_registro_preco FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: itens_checklist acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.itens_checklist FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: itens_contrato acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.itens_contrato FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: itens_processo_licitatorio acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.itens_processo_licitatorio FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: itens_retorno_bancario acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.itens_retorno_bancario FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: liquidacoes acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.liquidacoes FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: manutencoes_patrimonio acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.manutencoes_patrimonio FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: matriz_raci_atribuicoes acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.matriz_raci_atribuicoes FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: matriz_raci_papeis acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.matriz_raci_papeis FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: matriz_raci_processos acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.matriz_raci_processos FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: memorandos_lotacao acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.memorandos_lotacao FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: modelos_mensagem_reuniao acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.modelos_mensagem_reuniao FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: module_access_scopes acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.module_access_scopes FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: module_permissions_catalog acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.module_permissions_catalog FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: module_settings acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.module_settings FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: movimentacoes_bem acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.movimentacoes_bem FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: movimentacoes_estoque acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.movimentacoes_estoque FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: movimentacoes_processo acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.movimentacoes_processo FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: nomeacoes_chefe_unidade acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.nomeacoes_chefe_unidade FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: noticias_eventos_esportivos acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.noticias_eventos_esportivos FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: ocorrencias_patrimonio acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.ocorrencias_patrimonio FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: ocorrencias_servidor acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.ocorrencias_servidor FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: pareceres_tecnicos acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.pareceres_tecnicos FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: participantes_reuniao acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.participantes_reuniao FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: patrimonio_unidade acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.patrimonio_unidade FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: pensoes_alimenticias acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.pensoes_alimenticias FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: planos_tratamento_risco acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.planos_tratamento_risco FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: portal_diretoria acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.portal_diretoria FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: portarias_servidor acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.portarias_servidor FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: prazos_lai acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.prazos_lai FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: prazos_processo acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.prazos_processo FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: pre_cadastros acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.pre_cadastros FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: processos_administrativos acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.processos_administrativos FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: programas acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.programas FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: propostas_licitacao acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.propostas_licitacao FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: provimentos acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.provimentos FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: publicacoes_lai acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.publicacoes_lai FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: publicacoes_legais acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.publicacoes_legais FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: recursos_lai acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.recursos_lai FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: regimes_trabalho acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.regimes_trabalho FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: remessas_bancarias acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.remessas_bancarias FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: requisicao_itens acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.requisicao_itens FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: requisicoes_material acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.requisicoes_material FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: respostas_checklist acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.respostas_checklist FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: retornos_bancarios acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.retornos_bancarios FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: reunioes acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.reunioes FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: riscos_institucionais acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.riscos_institucionais FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: rubricas_historico acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.rubricas_historico FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: servidor_regime acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.servidor_regime FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: servidor_tag_vinculos acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.servidor_tag_vinculos FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: servidor_tags acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.servidor_tags FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: solicitacoes_sic acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.solicitacoes_sic FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: termos_cessao acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.termos_cessao FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: user_org_units acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.user_org_units FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: vinculos_funcionais acesso_total_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY acesso_total_update ON public.vinculos_funcionais FOR UPDATE TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: acoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acoes ENABLE ROW LEVEL SECURITY;

--
-- Name: adicionais_tempo_servico; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.adicionais_tempo_servico ENABLE ROW LEVEL SECURITY;

--
-- Name: aditivos_contrato; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.aditivos_contrato ENABLE ROW LEVEL SECURITY;

--
-- Name: gestores_escolares admin_delete_gestores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_delete_gestores ON public.gestores_escolares FOR DELETE USING ((auth.uid() IS NOT NULL));


--
-- Name: backup_config admin_only_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_only_delete ON public.backup_config FOR DELETE TO authenticated USING (public.is_admin_user(auth.uid()));


--
-- Name: backup_history admin_only_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_only_delete ON public.backup_history FOR DELETE TO authenticated USING (public.is_admin_user(auth.uid()));


--
-- Name: backup_integrity_checks admin_only_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_only_delete ON public.backup_integrity_checks FOR DELETE TO authenticated USING (public.is_admin_user(auth.uid()));


--
-- Name: backup_config admin_only_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_only_insert ON public.backup_config FOR INSERT TO authenticated WITH CHECK (public.is_admin_user(auth.uid()));


--
-- Name: backup_history admin_only_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_only_insert ON public.backup_history FOR INSERT TO authenticated WITH CHECK (public.is_admin_user(auth.uid()));


--
-- Name: backup_integrity_checks admin_only_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_only_insert ON public.backup_integrity_checks FOR INSERT TO authenticated WITH CHECK (public.is_admin_user(auth.uid()));


--
-- Name: audit_logs admin_only_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_only_select ON public.audit_logs FOR SELECT TO authenticated USING (public.is_admin_user(auth.uid()));


--
-- Name: backup_config admin_only_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_only_select ON public.backup_config FOR SELECT TO authenticated USING (public.is_admin_user(auth.uid()));


--
-- Name: backup_history admin_only_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_only_select ON public.backup_history FOR SELECT TO authenticated USING (public.is_admin_user(auth.uid()));


--
-- Name: backup_integrity_checks admin_only_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_only_select ON public.backup_integrity_checks FOR SELECT TO authenticated USING (public.is_admin_user(auth.uid()));


--
-- Name: backup_config admin_only_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_only_update ON public.backup_config FOR UPDATE TO authenticated USING (public.is_admin_user(auth.uid()));


--
-- Name: backup_history admin_only_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_only_update ON public.backup_history FOR UPDATE TO authenticated USING (public.is_admin_user(auth.uid()));


--
-- Name: backup_integrity_checks admin_only_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_only_update ON public.backup_integrity_checks FOR UPDATE TO authenticated USING (public.is_admin_user(auth.uid()));


--
-- Name: form_field_config admin_read_form_config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_read_form_config ON public.form_field_config FOR SELECT TO authenticated USING (true);


--
-- Name: gestores_escolares admin_update_gestores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_update_gestores ON public.gestores_escolares FOR UPDATE USING ((auth.uid() IS NOT NULL));


--
-- Name: form_field_config admin_write_form_config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_write_form_config ON public.form_field_config TO authenticated USING (public.can_access_module(auth.uid(), 'admin'::text)) WITH CHECK (public.can_access_module(auth.uid(), 'admin'::text));


--
-- Name: agenda_unidade; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.agenda_unidade ENABLE ROW LEVEL SECURITY;

--
-- Name: agrupamento_unidade_vinculo; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.agrupamento_unidade_vinculo ENABLE ROW LEVEL SECURITY;

--
-- Name: almoxarifados; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.almoxarifados ENABLE ROW LEVEL SECURITY;

--
-- Name: form_field_config anon_read_form_config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY anon_read_form_config ON public.form_field_config FOR SELECT TO anon USING (true);


--
-- Name: approval_delegations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.approval_delegations ENABLE ROW LEVEL SECURITY;

--
-- Name: approval_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: cadastro_arbitros_modalidades arbitros_modalidades_select_authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY arbitros_modalidades_select_authenticated ON public.cadastro_arbitros_modalidades FOR SELECT TO authenticated USING (true);


--
-- Name: atas_registro_preco; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.atas_registro_preco ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_log_licitacoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_log_licitacoes ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs audit_logs_insert_owner; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY audit_logs_insert_owner ON public.audit_logs FOR INSERT TO postgres WITH CHECK (true);


--
-- Name: cadastro_arbitros authenticated_delete_arbitros; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY authenticated_delete_arbitros ON public.cadastro_arbitros FOR DELETE TO authenticated USING (true);


--
-- Name: cadastro_arbitros authenticated_read_arbitros; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY authenticated_read_arbitros ON public.cadastro_arbitros FOR SELECT TO authenticated USING (true);


--
-- Name: cadastro_arbitros authenticated_update_arbitros; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY authenticated_update_arbitros ON public.cadastro_arbitros FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: avaliacoes_controle; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.avaliacoes_controle ENABLE ROW LEVEL SECURITY;

--
-- Name: avaliacoes_risco; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.avaliacoes_risco ENABLE ROW LEVEL SECURITY;

--
-- Name: avisos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.avisos ENABLE ROW LEVEL SECURITY;

--
-- Name: avisos avisos_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY avisos_delete ON public.avisos FOR DELETE TO authenticated USING (( SELECT public.pode_gerenciar_avisos() AS pode_gerenciar_avisos));


--
-- Name: avisos avisos_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY avisos_insert ON public.avisos FOR INSERT TO authenticated WITH CHECK (( SELECT public.pode_gerenciar_avisos() AS pode_gerenciar_avisos));


--
-- Name: avisos_leituras; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.avisos_leituras ENABLE ROW LEVEL SECURITY;

--
-- Name: avisos_leituras avisos_leituras_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY avisos_leituras_delete ON public.avisos_leituras FOR DELETE TO authenticated USING ((user_id = ( SELECT auth.uid() AS uid)));


--
-- Name: avisos_leituras avisos_leituras_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY avisos_leituras_insert ON public.avisos_leituras FOR INSERT TO authenticated WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) AND ( SELECT public.perfil_ativo_atual() AS perfil_ativo_atual) AND (EXISTS ( SELECT 1
   FROM public.avisos a
  WHERE (a.id = avisos_leituras.aviso_id)))));


--
-- Name: avisos_leituras avisos_leituras_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY avisos_leituras_select ON public.avisos_leituras FOR SELECT TO authenticated USING (((user_id = ( SELECT auth.uid() AS uid)) OR ( SELECT public.pode_gerenciar_avisos() AS pode_gerenciar_avisos)));


--
-- Name: avisos avisos_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY avisos_select ON public.avisos FOR SELECT TO authenticated USING ((( SELECT public.pode_gerenciar_avisos() AS pode_gerenciar_avisos) OR (( SELECT public.perfil_ativo_atual() AS perfil_ativo_atual) AND ativo AND (inicio_em <= now()) AND ((expira_em IS NULL) OR (expira_em > now())) AND ((publico = 'todos'::text) OR public.alcanca_modulos_alvo(modulos_alvo)))));


--
-- Name: avisos avisos_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY avisos_update ON public.avisos FOR UPDATE TO authenticated USING (( SELECT public.pode_gerenciar_avisos() AS pode_gerenciar_avisos)) WITH CHECK (( SELECT public.pode_gerenciar_avisos() AS pode_gerenciar_avisos));


--
-- Name: backup_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.backup_config ENABLE ROW LEVEL SECURITY;

--
-- Name: backup_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.backup_history ENABLE ROW LEVEL SECURITY;

--
-- Name: backup_integrity_checks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.backup_integrity_checks ENABLE ROW LEVEL SECURITY;

--
-- Name: baixas_patrimonio; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.baixas_patrimonio ENABLE ROW LEVEL SECURITY;

--
-- Name: banco_horas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.banco_horas ENABLE ROW LEVEL SECURITY;

--
-- Name: bancos_cnab; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bancos_cnab ENABLE ROW LEVEL SECURITY;

--
-- Name: bens_patrimoniais; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bens_patrimoniais ENABLE ROW LEVEL SECURITY;

--
-- Name: cadastro_arbitros; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cadastro_arbitros ENABLE ROW LEVEL SECURITY;

--
-- Name: cadastro_arbitros_modalidades; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cadastro_arbitros_modalidades ENABLE ROW LEVEL SECURITY;

--
-- Name: federacoes_esportivas cadastro_publico_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cadastro_publico_insert ON public.federacoes_esportivas FOR INSERT TO anon WITH CHECK (true);


--
-- Name: calendario_federacao; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.calendario_federacao ENABLE ROW LEVEL SECURITY;

--
-- Name: campanhas_inventario; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.campanhas_inventario ENABLE ROW LEVEL SECURITY;

--
-- Name: campanhas_inventario_unidades; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.campanhas_inventario_unidades ENABLE ROW LEVEL SECURITY;

--
-- Name: cargo_unidade_compatibilidade; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cargo_unidade_compatibilidade ENABLE ROW LEVEL SECURITY;

--
-- Name: cargos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;

--
-- Name: categorias_material; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.categorias_material ENABLE ROW LEVEL SECURITY;

--
-- Name: categorias_noticias_eventos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.categorias_noticias_eventos ENABLE ROW LEVEL SECURITY;

--
-- Name: centros_custo; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.centros_custo ENABLE ROW LEVEL SECURITY;

--
-- Name: cessoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cessoes ENABLE ROW LEVEL SECURITY;

--
-- Name: checklists_conformidade; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.checklists_conformidade ENABLE ROW LEVEL SECURITY;

--
-- Name: cms_banners; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cms_banners ENABLE ROW LEVEL SECURITY;

--
-- Name: cms_categorias; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cms_categorias ENABLE ROW LEVEL SECURITY;

--
-- Name: cms_conteudos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cms_conteudos ENABLE ROW LEVEL SECURITY;

--
-- Name: cms_galeria_fotos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cms_galeria_fotos ENABLE ROW LEVEL SECURITY;

--
-- Name: cms_galerias; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cms_galerias ENABLE ROW LEVEL SECURITY;

--
-- Name: cms_media; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cms_media ENABLE ROW LEVEL SECURITY;

--
-- Name: coletas_inventario; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.coletas_inventario ENABLE ROW LEVEL SECURITY;

--
-- Name: aditivos_contrato comp_module_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY comp_module_delete ON public.aditivos_contrato FOR DELETE TO authenticated USING ((public.can_access_module(auth.uid(), 'compras'::text) OR public.can_access_module(auth.uid(), 'contratos'::text)));


--
-- Name: atas_registro_preco comp_module_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY comp_module_delete ON public.atas_registro_preco FOR DELETE TO authenticated USING ((public.can_access_module(auth.uid(), 'compras'::text) OR public.can_access_module(auth.uid(), 'contratos'::text)));


--
-- Name: contratos comp_module_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY comp_module_delete ON public.contratos FOR DELETE TO authenticated USING ((public.can_access_module(auth.uid(), 'compras'::text) OR public.can_access_module(auth.uid(), 'contratos'::text)));


--
-- Name: fornecedores comp_module_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY comp_module_delete ON public.fornecedores FOR DELETE TO authenticated USING ((public.can_access_module(auth.uid(), 'compras'::text) OR public.can_access_module(auth.uid(), 'contratos'::text)));


--
-- Name: itens_licitacao comp_module_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY comp_module_delete ON public.itens_licitacao FOR DELETE TO authenticated USING ((public.can_access_module(auth.uid(), 'compras'::text) OR public.can_access_module(auth.uid(), 'contratos'::text)));


--
-- Name: medicoes_contrato comp_module_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY comp_module_delete ON public.medicoes_contrato FOR DELETE TO authenticated USING ((public.can_access_module(auth.uid(), 'compras'::text) OR public.can_access_module(auth.uid(), 'contratos'::text)));


--
-- Name: processos_licitatorios comp_module_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY comp_module_delete ON public.processos_licitatorios FOR DELETE TO authenticated USING ((public.can_access_module(auth.uid(), 'compras'::text) OR public.can_access_module(auth.uid(), 'contratos'::text)));


--
-- Name: aditivos_contrato comp_module_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY comp_module_select ON public.aditivos_contrato FOR SELECT TO authenticated USING ((public.can_access_module(auth.uid(), 'compras'::text) OR public.can_access_module(auth.uid(), 'contratos'::text)));


--
-- Name: atas_registro_preco comp_module_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY comp_module_select ON public.atas_registro_preco FOR SELECT TO authenticated USING ((public.can_access_module(auth.uid(), 'compras'::text) OR public.can_access_module(auth.uid(), 'contratos'::text)));


--
-- Name: contratos comp_module_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY comp_module_select ON public.contratos FOR SELECT TO authenticated USING ((public.can_access_module(auth.uid(), 'compras'::text) OR public.can_access_module(auth.uid(), 'contratos'::text)));


--
-- Name: fornecedores comp_module_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY comp_module_select ON public.fornecedores FOR SELECT TO authenticated USING ((public.can_access_module(auth.uid(), 'compras'::text) OR public.can_access_module(auth.uid(), 'contratos'::text)));


--
-- Name: itens_licitacao comp_module_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY comp_module_select ON public.itens_licitacao FOR SELECT TO authenticated USING ((public.can_access_module(auth.uid(), 'compras'::text) OR public.can_access_module(auth.uid(), 'contratos'::text)));


--
-- Name: medicoes_contrato comp_module_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY comp_module_select ON public.medicoes_contrato FOR SELECT TO authenticated USING ((public.can_access_module(auth.uid(), 'compras'::text) OR public.can_access_module(auth.uid(), 'contratos'::text)));


--
-- Name: processos_licitatorios comp_module_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY comp_module_select ON public.processos_licitatorios FOR SELECT TO authenticated USING ((public.can_access_module(auth.uid(), 'compras'::text) OR public.can_access_module(auth.uid(), 'contratos'::text)));


--
-- Name: aditivos_contrato comp_module_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY comp_module_update ON public.aditivos_contrato FOR UPDATE TO authenticated USING ((public.can_access_module(auth.uid(), 'compras'::text) OR public.can_access_module(auth.uid(), 'contratos'::text)));


--
-- Name: atas_registro_preco comp_module_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY comp_module_update ON public.atas_registro_preco FOR UPDATE TO authenticated USING ((public.can_access_module(auth.uid(), 'compras'::text) OR public.can_access_module(auth.uid(), 'contratos'::text)));


--
-- Name: contratos comp_module_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY comp_module_update ON public.contratos FOR UPDATE TO authenticated USING ((public.can_access_module(auth.uid(), 'compras'::text) OR public.can_access_module(auth.uid(), 'contratos'::text)));


--
-- Name: fornecedores comp_module_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY comp_module_update ON public.fornecedores FOR UPDATE TO authenticated USING ((public.can_access_module(auth.uid(), 'compras'::text) OR public.can_access_module(auth.uid(), 'contratos'::text)));


--
-- Name: itens_licitacao comp_module_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY comp_module_update ON public.itens_licitacao FOR UPDATE TO authenticated USING ((public.can_access_module(auth.uid(), 'compras'::text) OR public.can_access_module(auth.uid(), 'contratos'::text)));


--
-- Name: medicoes_contrato comp_module_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY comp_module_update ON public.medicoes_contrato FOR UPDATE TO authenticated USING ((public.can_access_module(auth.uid(), 'compras'::text) OR public.can_access_module(auth.uid(), 'contratos'::text)));


--
-- Name: processos_licitatorios comp_module_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY comp_module_update ON public.processos_licitatorios FOR UPDATE TO authenticated USING ((public.can_access_module(auth.uid(), 'compras'::text) OR public.can_access_module(auth.uid(), 'contratos'::text)));


--
-- Name: aditivos_contrato comp_module_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY comp_module_write ON public.aditivos_contrato FOR INSERT TO authenticated WITH CHECK ((public.can_access_module(auth.uid(), 'compras'::text) OR public.can_access_module(auth.uid(), 'contratos'::text)));


--
-- Name: atas_registro_preco comp_module_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY comp_module_write ON public.atas_registro_preco FOR INSERT TO authenticated WITH CHECK ((public.can_access_module(auth.uid(), 'compras'::text) OR public.can_access_module(auth.uid(), 'contratos'::text)));


--
-- Name: contratos comp_module_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY comp_module_write ON public.contratos FOR INSERT TO authenticated WITH CHECK ((public.can_access_module(auth.uid(), 'compras'::text) OR public.can_access_module(auth.uid(), 'contratos'::text)));


--
-- Name: fornecedores comp_module_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY comp_module_write ON public.fornecedores FOR INSERT TO authenticated WITH CHECK ((public.can_access_module(auth.uid(), 'compras'::text) OR public.can_access_module(auth.uid(), 'contratos'::text)));


--
-- Name: itens_licitacao comp_module_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY comp_module_write ON public.itens_licitacao FOR INSERT TO authenticated WITH CHECK ((public.can_access_module(auth.uid(), 'compras'::text) OR public.can_access_module(auth.uid(), 'contratos'::text)));


--
-- Name: medicoes_contrato comp_module_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY comp_module_write ON public.medicoes_contrato FOR INSERT TO authenticated WITH CHECK ((public.can_access_module(auth.uid(), 'compras'::text) OR public.can_access_module(auth.uid(), 'contratos'::text)));


--
-- Name: processos_licitatorios comp_module_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY comp_module_write ON public.processos_licitatorios FOR INSERT TO authenticated WITH CHECK ((public.can_access_module(auth.uid(), 'compras'::text) OR public.can_access_module(auth.uid(), 'contratos'::text)));


--
-- Name: composicao_cargos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.composicao_cargos ENABLE ROW LEVEL SECURITY;

--
-- Name: conciliacoes_inventario; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.conciliacoes_inventario ENABLE ROW LEVEL SECURITY;

--
-- Name: config_agrupamento_unidades; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.config_agrupamento_unidades ENABLE ROW LEVEL SECURITY;

--
-- Name: config_assinatura_frequencia; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.config_assinatura_frequencia ENABLE ROW LEVEL SECURITY;

--
-- Name: config_assinatura_reuniao; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.config_assinatura_reuniao ENABLE ROW LEVEL SECURITY;

--
-- Name: config_autarquia; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.config_autarquia ENABLE ROW LEVEL SECURITY;

--
-- Name: config_compensacao; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.config_compensacao ENABLE ROW LEVEL SECURITY;

--
-- Name: config_envio; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.config_envio ENABLE ROW LEVEL SECURITY;

--
-- Name: config_envio config_envio_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY config_envio_insert ON public.config_envio FOR INSERT TO authenticated WITH CHECK (( SELECT public.pode_configurar_envios() AS pode_configurar_envios));


--
-- Name: config_envio config_envio_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY config_envio_select ON public.config_envio FOR SELECT TO authenticated USING (( SELECT public.pode_ver_envios() AS pode_ver_envios));


--
-- Name: config_envio config_envio_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY config_envio_update ON public.config_envio FOR UPDATE TO authenticated USING (( SELECT public.pode_configurar_envios() AS pode_configurar_envios)) WITH CHECK (( SELECT public.pode_configurar_envios() AS pode_configurar_envios));


--
-- Name: config_fechamento_folha; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.config_fechamento_folha ENABLE ROW LEVEL SECURITY;

--
-- Name: config_fechamento_frequencia; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.config_fechamento_frequencia ENABLE ROW LEVEL SECURITY;

--
-- Name: config_incidencias; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.config_incidencias ENABLE ROW LEVEL SECURITY;

--
-- Name: config_institucional; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.config_institucional ENABLE ROW LEVEL SECURITY;

--
-- Name: config_jornada_padrao; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.config_jornada_padrao ENABLE ROW LEVEL SECURITY;

--
-- Name: config_menu_publico; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.config_menu_publico ENABLE ROW LEVEL SECURITY;

--
-- Name: config_motivos_desligamento; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.config_motivos_desligamento ENABLE ROW LEVEL SECURITY;

--
-- Name: config_paginas_historico; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.config_paginas_historico ENABLE ROW LEVEL SECURITY;

--
-- Name: config_paginas_publicas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.config_paginas_publicas ENABLE ROW LEVEL SECURITY;

--
-- Name: config_parametros_meta; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.config_parametros_meta ENABLE ROW LEVEL SECURITY;

--
-- Name: config_parametros_valores; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.config_parametros_valores ENABLE ROW LEVEL SECURITY;

--
-- Name: config_regras_calculo; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.config_regras_calculo ENABLE ROW LEVEL SECURITY;

--
-- Name: config_rubricas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.config_rubricas ENABLE ROW LEVEL SECURITY;

--
-- Name: config_situacoes_funcionais; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.config_situacoes_funcionais ENABLE ROW LEVEL SECURITY;

--
-- Name: config_tipos_ato; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.config_tipos_ato ENABLE ROW LEVEL SECURITY;

--
-- Name: config_tipos_onus; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.config_tipos_onus ENABLE ROW LEVEL SECURITY;

--
-- Name: config_tipos_rubrica; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.config_tipos_rubrica ENABLE ROW LEVEL SECURITY;

--
-- Name: config_tipos_servidor; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.config_tipos_servidor ENABLE ROW LEVEL SECURITY;

--
-- Name: configuracao_jornada; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.configuracao_jornada ENABLE ROW LEVEL SECURITY;

--
-- Name: consignacoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.consignacoes ENABLE ROW LEVEL SECURITY;

--
-- Name: contas_autarquia; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contas_autarquia ENABLE ROW LEVEL SECURITY;

--
-- Name: contatos_eventos_esportivos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contatos_eventos_esportivos ENABLE ROW LEVEL SECURITY;

--
-- Name: conteudo_rascunho; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.conteudo_rascunho ENABLE ROW LEVEL SECURITY;

--
-- Name: contratos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;

--
-- Name: controles_internos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.controles_internos ENABLE ROW LEVEL SECURITY;

--
-- Name: creditos_adicionais; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.creditos_adicionais ENABLE ROW LEVEL SECURITY;

--
-- Name: dados_oficiais; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dados_oficiais ENABLE ROW LEVEL SECURITY;

--
-- Name: datas_importantes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.datas_importantes ENABLE ROW LEVEL SECURITY;

--
-- Name: datas_importantes datas_importantes_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY datas_importantes_delete ON public.datas_importantes FOR DELETE TO authenticated USING (( SELECT public.pode_gerenciar_avisos() AS pode_gerenciar_avisos));


--
-- Name: datas_importantes datas_importantes_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY datas_importantes_insert ON public.datas_importantes FOR INSERT TO authenticated WITH CHECK (( SELECT public.pode_gerenciar_avisos() AS pode_gerenciar_avisos));


--
-- Name: datas_importantes datas_importantes_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY datas_importantes_select ON public.datas_importantes FOR SELECT TO authenticated USING ((( SELECT public.pode_gerenciar_avisos() AS pode_gerenciar_avisos) OR (( SELECT public.perfil_ativo_atual() AS perfil_ativo_atual) AND ativo AND public.alcanca_modulos_alvo(modulos_alvo))));


--
-- Name: datas_importantes datas_importantes_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY datas_importantes_update ON public.datas_importantes FOR UPDATE TO authenticated USING (( SELECT public.pode_gerenciar_avisos() AS pode_gerenciar_avisos)) WITH CHECK (( SELECT public.pode_gerenciar_avisos() AS pode_gerenciar_avisos));


--
-- Name: debitos_tecnicos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.debitos_tecnicos ENABLE ROW LEVEL SECURITY;

--
-- Name: decisoes_administrativas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.decisoes_administrativas ENABLE ROW LEVEL SECURITY;

--
-- Name: role_permissions del_role_permissions_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY del_role_permissions_admin ON public.role_permissions FOR DELETE TO authenticated USING (public.is_admin_atual());


--
-- Name: user_permissions del_user_permissions_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY del_user_permissions_admin ON public.user_permissions FOR DELETE TO authenticated USING (public.is_admin_atual());


--
-- Name: demandas_ascom; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.demandas_ascom ENABLE ROW LEVEL SECURITY;

--
-- Name: demandas_ascom_anexos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.demandas_ascom_anexos ENABLE ROW LEVEL SECURITY;

--
-- Name: demandas_ascom_comentarios; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.demandas_ascom_comentarios ENABLE ROW LEVEL SECURITY;

--
-- Name: demandas_ascom_entregaveis; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.demandas_ascom_entregaveis ENABLE ROW LEVEL SECURITY;

--
-- Name: denuncias; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.denuncias ENABLE ROW LEVEL SECURITY;

--
-- Name: dependentes_irrf; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dependentes_irrf ENABLE ROW LEVEL SECURITY;

--
-- Name: designacoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.designacoes ENABLE ROW LEVEL SECURITY;

--
-- Name: despachos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.despachos ENABLE ROW LEVEL SECURITY;

--
-- Name: dias_nao_uteis; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dias_nao_uteis ENABLE ROW LEVEL SECURITY;

--
-- Name: documentos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

--
-- Name: documentos_cedencia; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.documentos_cedencia ENABLE ROW LEVEL SECURITY;

--
-- Name: documentos_preparatorios_licitacao; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.documentos_preparatorios_licitacao ENABLE ROW LEVEL SECURITY;

--
-- Name: documentos_processo; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.documentos_processo ENABLE ROW LEVEL SECURITY;

--
-- Name: documentos_requerimento_servidor; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.documentos_requerimento_servidor ENABLE ROW LEVEL SECURITY;

--
-- Name: dotacoes_orcamentarias; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dotacoes_orcamentarias ENABLE ROW LEVEL SECURITY;

--
-- Name: empenhos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.empenhos ENABLE ROW LEVEL SECURITY;

--
-- Name: encaminhamentos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.encaminhamentos ENABLE ROW LEVEL SECURITY;

--
-- Name: envios_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.envios_log ENABLE ROW LEVEL SECURITY;

--
-- Name: envios_log envios_log_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY envios_log_select ON public.envios_log FOR SELECT TO authenticated USING (( SELECT public.pode_ver_envios() AS pode_ver_envios));


--
-- Name: escolas_jer; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.escolas_jer ENABLE ROW LEVEL SECURITY;

--
-- Name: estoque; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.estoque ENABLE ROW LEVEL SECURITY;

--
-- Name: estrutura_organizacional; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.estrutura_organizacional ENABLE ROW LEVEL SECURITY;

--
-- Name: eventos_esocial; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.eventos_esocial ENABLE ROW LEVEL SECURITY;

--
-- Name: evidencias_controle; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.evidencias_controle ENABLE ROW LEVEL SECURITY;

--
-- Name: exportacoes_folha; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.exportacoes_folha ENABLE ROW LEVEL SECURITY;

--
-- Name: federacao_arbitros; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.federacao_arbitros ENABLE ROW LEVEL SECURITY;

--
-- Name: federacao_espacos_cedidos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.federacao_espacos_cedidos ENABLE ROW LEVEL SECURITY;

--
-- Name: federacao_parcerias; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.federacao_parcerias ENABLE ROW LEVEL SECURITY;

--
-- Name: federacoes_esportivas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.federacoes_esportivas ENABLE ROW LEVEL SECURITY;

--
-- Name: feriados; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.feriados ENABLE ROW LEVEL SECURITY;

--
-- Name: ferias_servidor; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ferias_servidor ENABLE ROW LEVEL SECURITY;

--
-- Name: fichas_financeiras; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fichas_financeiras ENABLE ROW LEVEL SECURITY;

--
-- Name: fin_acoes_orcamentarias; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fin_acoes_orcamentarias ENABLE ROW LEVEL SECURITY;

--
-- Name: fin_adiantamento_itens; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fin_adiantamento_itens ENABLE ROW LEVEL SECURITY;

--
-- Name: fin_adiantamentos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fin_adiantamentos ENABLE ROW LEVEL SECURITY;

--
-- Name: fin_alteracoes_orcamentarias; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fin_alteracoes_orcamentarias ENABLE ROW LEVEL SECURITY;

--
-- Name: fin_audit_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fin_audit_log ENABLE ROW LEVEL SECURITY;

--
-- Name: fin_checklist_ci; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fin_checklist_ci ENABLE ROW LEVEL SECURITY;

--
-- Name: fin_contas_bancarias; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fin_contas_bancarias ENABLE ROW LEVEL SECURITY;

--
-- Name: fin_documentos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fin_documentos ENABLE ROW LEVEL SECURITY;

--
-- Name: fin_dotacoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fin_dotacoes ENABLE ROW LEVEL SECURITY;

--
-- Name: fin_empenho_anulacoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fin_empenho_anulacoes ENABLE ROW LEVEL SECURITY;

--
-- Name: fin_empenhos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fin_empenhos ENABLE ROW LEVEL SECURITY;

--
-- Name: fin_extrato_transacoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fin_extrato_transacoes ENABLE ROW LEVEL SECURITY;

--
-- Name: fin_extratos_bancarios; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fin_extratos_bancarios ENABLE ROW LEVEL SECURITY;

--
-- Name: fin_fechamentos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fin_fechamentos ENABLE ROW LEVEL SECURITY;

--
-- Name: fin_fontes_recurso; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fin_fontes_recurso ENABLE ROW LEVEL SECURITY;

--
-- Name: fin_lancamentos_contabeis; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fin_lancamentos_contabeis ENABLE ROW LEVEL SECURITY;

--
-- Name: fin_liquidacoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fin_liquidacoes ENABLE ROW LEVEL SECURITY;

--
-- Name: dotacoes_orcamentarias fin_module_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fin_module_delete ON public.dotacoes_orcamentarias FOR DELETE TO authenticated USING (public.can_access_module(auth.uid(), 'financeiro'::text));


--
-- Name: empenhos fin_module_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fin_module_delete ON public.empenhos FOR DELETE TO authenticated USING (public.can_access_module(auth.uid(), 'financeiro'::text));


--
-- Name: pagamentos fin_module_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fin_module_delete ON public.pagamentos FOR DELETE TO authenticated USING (public.can_access_module(auth.uid(), 'financeiro'::text));


--
-- Name: dotacoes_orcamentarias fin_module_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fin_module_select ON public.dotacoes_orcamentarias FOR SELECT TO authenticated USING (public.can_access_module(auth.uid(), 'financeiro'::text));


--
-- Name: empenhos fin_module_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fin_module_select ON public.empenhos FOR SELECT TO authenticated USING (public.can_access_module(auth.uid(), 'financeiro'::text));


--
-- Name: pagamentos fin_module_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fin_module_select ON public.pagamentos FOR SELECT TO authenticated USING (public.can_access_module(auth.uid(), 'financeiro'::text));


--
-- Name: dotacoes_orcamentarias fin_module_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fin_module_update ON public.dotacoes_orcamentarias FOR UPDATE TO authenticated USING (public.can_access_module(auth.uid(), 'financeiro'::text));


--
-- Name: empenhos fin_module_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fin_module_update ON public.empenhos FOR UPDATE TO authenticated USING (public.can_access_module(auth.uid(), 'financeiro'::text));


--
-- Name: pagamentos fin_module_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fin_module_update ON public.pagamentos FOR UPDATE TO authenticated USING (public.can_access_module(auth.uid(), 'financeiro'::text));


--
-- Name: dotacoes_orcamentarias fin_module_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fin_module_write ON public.dotacoes_orcamentarias FOR INSERT TO authenticated WITH CHECK (public.can_access_module(auth.uid(), 'financeiro'::text));


--
-- Name: empenhos fin_module_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fin_module_write ON public.empenhos FOR INSERT TO authenticated WITH CHECK (public.can_access_module(auth.uid(), 'financeiro'::text));


--
-- Name: pagamentos fin_module_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fin_module_write ON public.pagamentos FOR INSERT TO authenticated WITH CHECK (public.can_access_module(auth.uid(), 'financeiro'::text));


--
-- Name: fin_naturezas_despesa; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fin_naturezas_despesa ENABLE ROW LEVEL SECURITY;

--
-- Name: fin_pagamentos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fin_pagamentos ENABLE ROW LEVEL SECURITY;

--
-- Name: fin_parametros; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fin_parametros ENABLE ROW LEVEL SECURITY;

--
-- Name: fin_plano_contas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fin_plano_contas ENABLE ROW LEVEL SECURITY;

--
-- Name: fin_programas_orcamentarios; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fin_programas_orcamentarios ENABLE ROW LEVEL SECURITY;

--
-- Name: fin_receitas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fin_receitas ENABLE ROW LEVEL SECURITY;

--
-- Name: fin_restos_pagar; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fin_restos_pagar ENABLE ROW LEVEL SECURITY;

--
-- Name: fin_solicitacao_itens; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fin_solicitacao_itens ENABLE ROW LEVEL SECURITY;

--
-- Name: fin_solicitacoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fin_solicitacoes ENABLE ROW LEVEL SECURITY;

--
-- Name: fin_sub_empenhos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fin_sub_empenhos ENABLE ROW LEVEL SECURITY;

--
-- Name: folha_historico_status; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.folha_historico_status ENABLE ROW LEVEL SECURITY;

--
-- Name: folhas_pagamento; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.folhas_pagamento ENABLE ROW LEVEL SECURITY;

--
-- Name: form_field_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.form_field_config ENABLE ROW LEVEL SECURITY;

--
-- Name: fornecedores; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;

--
-- Name: fotos_vistoria_inventario; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fotos_vistoria_inventario ENABLE ROW LEVEL SECURITY;

--
-- Name: frequencia_arquivos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.frequencia_arquivos ENABLE ROW LEVEL SECURITY;

--
-- Name: frequencia_fechamento; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.frequencia_fechamento ENABLE ROW LEVEL SECURITY;

--
-- Name: frequencia_mensal; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.frequencia_mensal ENABLE ROW LEVEL SECURITY;

--
-- Name: frequencia_pacotes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.frequencia_pacotes ENABLE ROW LEVEL SECURITY;

--
-- Name: galeria_eventos_esportivos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.galeria_eventos_esportivos ENABLE ROW LEVEL SECURITY;

--
-- Name: gestores_escolares; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.gestores_escolares ENABLE ROW LEVEL SECURITY;

--
-- Name: gestores_escolares_historico; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.gestores_escolares_historico ENABLE ROW LEVEL SECURITY;

--
-- Name: historico_conteudo_oficial; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.historico_conteudo_oficial ENABLE ROW LEVEL SECURITY;

--
-- Name: historico_convites_reuniao; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.historico_convites_reuniao ENABLE ROW LEVEL SECURITY;

--
-- Name: historico_funcional; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.historico_funcional ENABLE ROW LEVEL SECURITY;

--
-- Name: historico_lai; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.historico_lai ENABLE ROW LEVEL SECURITY;

--
-- Name: historico_patrimonio; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.historico_patrimonio ENABLE ROW LEVEL SECURITY;

--
-- Name: horarios_jornada; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.horarios_jornada ENABLE ROW LEVEL SECURITY;

--
-- Name: importacoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.importacoes ENABLE ROW LEVEL SECURITY;

--
-- Name: importacoes importacoes_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY importacoes_select ON public.importacoes FOR SELECT TO authenticated USING ((( SELECT public.perfil_ativo_atual() AS perfil_ativo_atual) AND public.can_access_module(auth.uid(), (modulo)::text)));


--
-- Name: role_permissions ins_role_permissions_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ins_role_permissions_admin ON public.role_permissions FOR INSERT TO authenticated WITH CHECK (public.is_admin_atual());


--
-- Name: user_permissions ins_user_permissions_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ins_user_permissions_admin ON public.user_permissions FOR INSERT TO authenticated WITH CHECK (public.is_admin_atual());


--
-- Name: gestores_escolares insercao_publica_gestores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY insercao_publica_gestores ON public.gestores_escolares FOR INSERT WITH CHECK (true);


--
-- Name: instituicoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.instituicoes ENABLE ROW LEVEL SECURITY;

--
-- Name: itens_ata_registro_preco; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.itens_ata_registro_preco ENABLE ROW LEVEL SECURITY;

--
-- Name: itens_checklist; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.itens_checklist ENABLE ROW LEVEL SECURITY;

--
-- Name: itens_contrato; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.itens_contrato ENABLE ROW LEVEL SECURITY;

--
-- Name: itens_ficha_financeira; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.itens_ficha_financeira ENABLE ROW LEVEL SECURITY;

--
-- Name: itens_licitacao; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.itens_licitacao ENABLE ROW LEVEL SECURITY;

--
-- Name: itens_material; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.itens_material ENABLE ROW LEVEL SECURITY;

--
-- Name: itens_processo_licitatorio; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.itens_processo_licitatorio ENABLE ROW LEVEL SECURITY;

--
-- Name: itens_retorno_bancario; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.itens_retorno_bancario ENABLE ROW LEVEL SECURITY;

--
-- Name: justificativas_ponto; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.justificativas_ponto ENABLE ROW LEVEL SECURITY;

--
-- Name: lancamentos_banco_horas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lancamentos_banco_horas ENABLE ROW LEVEL SECURITY;

--
-- Name: lancamentos_folha; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lancamentos_folha ENABLE ROW LEVEL SECURITY;

--
-- Name: escolas_jer leitura_publica_escolas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY leitura_publica_escolas ON public.escolas_jer FOR SELECT USING (true);


--
-- Name: gestores_escolares leitura_publica_gestores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY leitura_publica_gestores ON public.gestores_escolares FOR SELECT USING (true);


--
-- Name: config_paginas_publicas leitura_publica_status_paginas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY leitura_publica_status_paginas ON public.config_paginas_publicas FOR SELECT TO anon, authenticated USING (true);


--
-- Name: licencas_afastamentos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.licencas_afastamentos ENABLE ROW LEVEL SECURITY;

--
-- Name: links_uteis; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.links_uteis ENABLE ROW LEVEL SECURITY;

--
-- Name: liquidacoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.liquidacoes ENABLE ROW LEVEL SECURITY;

--
-- Name: lotacoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lotacoes ENABLE ROW LEVEL SECURITY;

--
-- Name: manutencoes_patrimonio; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.manutencoes_patrimonio ENABLE ROW LEVEL SECURITY;

--
-- Name: matriz_raci_atribuicoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.matriz_raci_atribuicoes ENABLE ROW LEVEL SECURITY;

--
-- Name: matriz_raci_papeis; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.matriz_raci_papeis ENABLE ROW LEVEL SECURITY;

--
-- Name: matriz_raci_processos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.matriz_raci_processos ENABLE ROW LEVEL SECURITY;

--
-- Name: medicoes_contrato; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.medicoes_contrato ENABLE ROW LEVEL SECURITY;

--
-- Name: memorandos_lotacao; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.memorandos_lotacao ENABLE ROW LEVEL SECURITY;

--
-- Name: modelos_mensagem_reuniao; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.modelos_mensagem_reuniao ENABLE ROW LEVEL SECURITY;

--
-- Name: module_access_scopes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.module_access_scopes ENABLE ROW LEVEL SECURITY;

--
-- Name: module_permissions_catalog; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.module_permissions_catalog ENABLE ROW LEVEL SECURITY;

--
-- Name: module_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.module_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: movimentacoes_bem; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.movimentacoes_bem ENABLE ROW LEVEL SECURITY;

--
-- Name: movimentacoes_estoque; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.movimentacoes_estoque ENABLE ROW LEVEL SECURITY;

--
-- Name: movimentacoes_patrimonio; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.movimentacoes_patrimonio ENABLE ROW LEVEL SECURITY;

--
-- Name: movimentacoes_processo; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.movimentacoes_processo ENABLE ROW LEVEL SECURITY;

--
-- Name: nomeacoes_chefe_unidade; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.nomeacoes_chefe_unidade ENABLE ROW LEVEL SECURITY;

--
-- Name: noticias_eventos_esportivos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.noticias_eventos_esportivos ENABLE ROW LEVEL SECURITY;

--
-- Name: ocorrencias_patrimonio; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ocorrencias_patrimonio ENABLE ROW LEVEL SECURITY;

--
-- Name: ocorrencias_servidor; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ocorrencias_servidor ENABLE ROW LEVEL SECURITY;

--
-- Name: pagamentos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

--
-- Name: parametros_folha; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.parametros_folha ENABLE ROW LEVEL SECURITY;

--
-- Name: pareceres_tecnicos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pareceres_tecnicos ENABLE ROW LEVEL SECURITY;

--
-- Name: participantes_reuniao; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.participantes_reuniao ENABLE ROW LEVEL SECURITY;

--
-- Name: agenda_unidade pat_module_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pat_module_delete ON public.agenda_unidade FOR DELETE TO authenticated USING ((public.can_access_module(auth.uid(), 'patrimonio'::text) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'::text)));


--
-- Name: almoxarifados pat_module_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pat_module_delete ON public.almoxarifados FOR DELETE TO authenticated USING ((public.can_access_module(auth.uid(), 'patrimonio'::text) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'::text)));


--
-- Name: baixas_patrimonio pat_module_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pat_module_delete ON public.baixas_patrimonio FOR DELETE TO authenticated USING ((public.can_access_module(auth.uid(), 'patrimonio'::text) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'::text)));


--
-- Name: bens_patrimoniais pat_module_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pat_module_delete ON public.bens_patrimoniais FOR DELETE TO authenticated USING ((public.can_access_module(auth.uid(), 'patrimonio'::text) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'::text)));


--
-- Name: itens_material pat_module_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pat_module_delete ON public.itens_material FOR DELETE TO authenticated USING ((public.can_access_module(auth.uid(), 'patrimonio'::text) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'::text)));


--
-- Name: movimentacoes_patrimonio pat_module_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pat_module_delete ON public.movimentacoes_patrimonio FOR DELETE TO authenticated USING ((public.can_access_module(auth.uid(), 'patrimonio'::text) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'::text)));


--
-- Name: unidades_locais pat_module_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pat_module_delete ON public.unidades_locais FOR DELETE TO authenticated USING ((public.can_access_module(auth.uid(), 'patrimonio'::text) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'::text)));


--
-- Name: agenda_unidade pat_module_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pat_module_select ON public.agenda_unidade FOR SELECT TO authenticated USING ((public.can_access_module(auth.uid(), 'patrimonio'::text) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'::text)));


--
-- Name: almoxarifados pat_module_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pat_module_select ON public.almoxarifados FOR SELECT TO authenticated USING ((public.can_access_module(auth.uid(), 'patrimonio'::text) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'::text)));


--
-- Name: baixas_patrimonio pat_module_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pat_module_select ON public.baixas_patrimonio FOR SELECT TO authenticated USING ((public.can_access_module(auth.uid(), 'patrimonio'::text) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'::text)));


--
-- Name: bens_patrimoniais pat_module_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pat_module_select ON public.bens_patrimoniais FOR SELECT TO authenticated USING ((public.can_access_module(auth.uid(), 'patrimonio'::text) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'::text)));


--
-- Name: itens_material pat_module_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pat_module_select ON public.itens_material FOR SELECT TO authenticated USING ((public.can_access_module(auth.uid(), 'patrimonio'::text) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'::text)));


--
-- Name: movimentacoes_patrimonio pat_module_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pat_module_select ON public.movimentacoes_patrimonio FOR SELECT TO authenticated USING ((public.can_access_module(auth.uid(), 'patrimonio'::text) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'::text)));


--
-- Name: unidades_locais pat_module_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pat_module_select ON public.unidades_locais FOR SELECT TO authenticated USING ((public.can_access_module(auth.uid(), 'patrimonio'::text) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'::text)));


--
-- Name: agenda_unidade pat_module_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pat_module_update ON public.agenda_unidade FOR UPDATE TO authenticated USING ((public.can_access_module(auth.uid(), 'patrimonio'::text) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'::text)));


--
-- Name: almoxarifados pat_module_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pat_module_update ON public.almoxarifados FOR UPDATE TO authenticated USING ((public.can_access_module(auth.uid(), 'patrimonio'::text) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'::text)));


--
-- Name: baixas_patrimonio pat_module_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pat_module_update ON public.baixas_patrimonio FOR UPDATE TO authenticated USING ((public.can_access_module(auth.uid(), 'patrimonio'::text) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'::text)));


--
-- Name: bens_patrimoniais pat_module_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pat_module_update ON public.bens_patrimoniais FOR UPDATE TO authenticated USING ((public.can_access_module(auth.uid(), 'patrimonio'::text) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'::text)));


--
-- Name: itens_material pat_module_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pat_module_update ON public.itens_material FOR UPDATE TO authenticated USING ((public.can_access_module(auth.uid(), 'patrimonio'::text) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'::text)));


--
-- Name: movimentacoes_patrimonio pat_module_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pat_module_update ON public.movimentacoes_patrimonio FOR UPDATE TO authenticated USING ((public.can_access_module(auth.uid(), 'patrimonio'::text) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'::text)));


--
-- Name: unidades_locais pat_module_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pat_module_update ON public.unidades_locais FOR UPDATE TO authenticated USING ((public.can_access_module(auth.uid(), 'patrimonio'::text) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'::text)));


--
-- Name: agenda_unidade pat_module_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pat_module_write ON public.agenda_unidade FOR INSERT TO authenticated WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio'::text) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'::text)));


--
-- Name: almoxarifados pat_module_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pat_module_write ON public.almoxarifados FOR INSERT TO authenticated WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio'::text) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'::text)));


--
-- Name: baixas_patrimonio pat_module_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pat_module_write ON public.baixas_patrimonio FOR INSERT TO authenticated WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio'::text) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'::text)));


--
-- Name: bens_patrimoniais pat_module_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pat_module_write ON public.bens_patrimoniais FOR INSERT TO authenticated WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio'::text) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'::text)));


--
-- Name: itens_material pat_module_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pat_module_write ON public.itens_material FOR INSERT TO authenticated WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio'::text) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'::text)));


--
-- Name: movimentacoes_patrimonio pat_module_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pat_module_write ON public.movimentacoes_patrimonio FOR INSERT TO authenticated WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio'::text) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'::text)));


--
-- Name: unidades_locais pat_module_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pat_module_write ON public.unidades_locais FOR INSERT TO authenticated WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio'::text) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'::text)));


--
-- Name: patrimonio_unidade; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.patrimonio_unidade ENABLE ROW LEVEL SECURITY;

--
-- Name: pensoes_alimenticias; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pensoes_alimenticias ENABLE ROW LEVEL SECURITY;

--
-- Name: planos_tratamento_risco; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.planos_tratamento_risco ENABLE ROW LEVEL SECURITY;

--
-- Name: portal_diretoria; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.portal_diretoria ENABLE ROW LEVEL SECURITY;

--
-- Name: portarias_servidor; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.portarias_servidor ENABLE ROW LEVEL SECURITY;

--
-- Name: prazos_lai; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.prazos_lai ENABLE ROW LEVEL SECURITY;

--
-- Name: prazos_processo; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.prazos_processo ENABLE ROW LEVEL SECURITY;

--
-- Name: pre_cadastros; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pre_cadastros ENABLE ROW LEVEL SECURITY;

--
-- Name: processos_administrativos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.processos_administrativos ENABLE ROW LEVEL SECURITY;

--
-- Name: processos_licitatorios; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.processos_licitatorios ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles profiles_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_delete ON public.profiles FOR DELETE TO authenticated USING (public.is_admin_user(auth.uid()));


--
-- Name: profiles profiles_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_insert ON public.profiles FOR INSERT TO authenticated WITH CHECK (public.is_admin_user(auth.uid()));


--
-- Name: profiles profiles_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated USING (((id = auth.uid()) OR public.is_admin_user(auth.uid())));


--
-- Name: profiles profiles_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_update ON public.profiles FOR UPDATE TO authenticated USING (((id = auth.uid()) OR public.is_admin_user(auth.uid()))) WITH CHECK (((id = auth.uid()) OR public.is_admin_user(auth.uid())));


--
-- Name: programas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.programas ENABLE ROW LEVEL SECURITY;

--
-- Name: propostas_licitacao; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.propostas_licitacao ENABLE ROW LEVEL SECURITY;

--
-- Name: provimentos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.provimentos ENABLE ROW LEVEL SECURITY;

--
-- Name: publicacoes_lai; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.publicacoes_lai ENABLE ROW LEVEL SECURITY;

--
-- Name: publicacoes_legais; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.publicacoes_legais ENABLE ROW LEVEL SECURITY;

--
-- Name: recursos_lai; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.recursos_lai ENABLE ROW LEVEL SECURITY;

--
-- Name: regimes_trabalho; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.regimes_trabalho ENABLE ROW LEVEL SECURITY;

--
-- Name: registros_ponto; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.registros_ponto ENABLE ROW LEVEL SECURITY;

--
-- Name: remessas_bancarias; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.remessas_bancarias ENABLE ROW LEVEL SECURITY;

--
-- Name: requisicao_itens; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.requisicao_itens ENABLE ROW LEVEL SECURITY;

--
-- Name: requisicoes_material; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.requisicoes_material ENABLE ROW LEVEL SECURITY;

--
-- Name: respostas_checklist; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.respostas_checklist ENABLE ROW LEVEL SECURITY;

--
-- Name: retornos_bancarios; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.retornos_bancarios ENABLE ROW LEVEL SECURITY;

--
-- Name: reunioes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reunioes ENABLE ROW LEVEL SECURITY;

--
-- Name: adicionais_tempo_servico rh_module_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rh_module_delete ON public.adicionais_tempo_servico FOR DELETE TO authenticated USING (public.can_access_module(auth.uid(), 'rh'::text));


--
-- Name: adicionais_tempo_servico rh_module_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rh_module_select ON public.adicionais_tempo_servico FOR SELECT TO authenticated USING (public.can_access_module(auth.uid(), 'rh'::text));


--
-- Name: adicionais_tempo_servico rh_module_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rh_module_update ON public.adicionais_tempo_servico FOR UPDATE TO authenticated USING (public.can_access_module(auth.uid(), 'rh'::text));


--
-- Name: adicionais_tempo_servico rh_module_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rh_module_write ON public.adicionais_tempo_servico FOR INSERT TO authenticated WITH CHECK (public.can_access_module(auth.uid(), 'rh'::text));


--
-- Name: riscos_institucionais; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.riscos_institucionais ENABLE ROW LEVEL SECURITY;

--
-- Name: banco_horas rls_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_delete ON public.banco_horas FOR DELETE TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'rh.frequencia.lancar'::text) AND (public.is_admin_user(auth.uid()) OR (servidor_id IS DISTINCT FROM auth.uid()))));


--
-- Name: campanhas_inventario_unidades rls_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_delete ON public.campanhas_inventario_unidades FOR DELETE TO authenticated USING ((public.can_access_module(auth.uid(), 'patrimonio'::text) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'::text)));


--
-- Name: cargos rls_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_delete ON public.cargos FOR DELETE TO authenticated USING (public.can_access_module(auth.uid(), 'rh'::text));


--
-- Name: config_fechamento_frequencia rls_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_delete ON public.config_fechamento_frequencia FOR DELETE TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'rh.frequencia.configurar'::text)));


--
-- Name: consignacoes rls_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_delete ON public.consignacoes FOR DELETE TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'::text)));


--
-- Name: dependentes_irrf rls_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_delete ON public.dependentes_irrf FOR DELETE TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'::text)));


--
-- Name: ferias_servidor rls_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_delete ON public.ferias_servidor FOR DELETE TO authenticated USING (public.is_admin_user(auth.uid()));


--
-- Name: fichas_financeiras rls_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_delete ON public.fichas_financeiras FOR DELETE TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'::text)));


--
-- Name: folhas_pagamento rls_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_delete ON public.folhas_pagamento FOR DELETE TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'::text)));


--
-- Name: fotos_vistoria_inventario rls_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_delete ON public.fotos_vistoria_inventario FOR DELETE TO authenticated USING (public.has_permission_code(auth.uid(), 'patrimonio.tramitar'::text));


--
-- Name: frequencia_fechamento rls_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_delete ON public.frequencia_fechamento FOR DELETE TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'rh.frequencia.lancar'::text) AND (public.is_admin_user(auth.uid()) OR (NOT public.eh_meu_servidor(servidor_id)))));


--
-- Name: frequencia_mensal rls_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_delete ON public.frequencia_mensal FOR DELETE TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar'::text) OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar'::text) OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar'::text)) AND (public.is_admin_user(auth.uid()) OR (NOT public.eh_meu_servidor(servidor_id)))));


--
-- Name: itens_ficha_financeira rls_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_delete ON public.itens_ficha_financeira FOR DELETE TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'::text)));


--
-- Name: justificativas_ponto rls_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_delete ON public.justificativas_ponto FOR DELETE TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'rh.frequencia.lancar'::text) AND (public.is_admin_user(auth.uid()) OR (NOT public.eh_meu_servidor(( SELECT p.servidor_id
   FROM public.registros_ponto p
  WHERE (p.id = justificativas_ponto.registro_ponto_id)))))));


--
-- Name: lancamentos_banco_horas rls_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_delete ON public.lancamentos_banco_horas FOR DELETE TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'rh.frequencia.lancar'::text) AND (public.is_admin_user(auth.uid()) OR (( SELECT p.servidor_id
   FROM public.banco_horas p
  WHERE (p.id = lancamentos_banco_horas.banco_horas_id)) IS DISTINCT FROM auth.uid()))));


--
-- Name: lancamentos_folha rls_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_delete ON public.lancamentos_folha FOR DELETE TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'::text)));


--
-- Name: licencas_afastamentos rls_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_delete ON public.licencas_afastamentos FOR DELETE TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'rh.licencas.gerenciar'::text) AND (public.is_admin_user(auth.uid()) OR (NOT public.eh_meu_servidor(servidor_id)))));


--
-- Name: lotacoes rls_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_delete ON public.lotacoes FOR DELETE TO authenticated USING (public.can_access_module(auth.uid(), 'rh'::text));


--
-- Name: parametros_folha rls_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_delete ON public.parametros_folha FOR DELETE TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'::text)));


--
-- Name: registros_ponto rls_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_delete ON public.registros_ponto FOR DELETE TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar'::text) OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar'::text) OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar'::text)) AND (public.is_admin_user(auth.uid()) OR (NOT public.eh_meu_servidor(servidor_id)))));


--
-- Name: rubricas rls_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_delete ON public.rubricas FOR DELETE TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'::text)));


--
-- Name: servidores rls_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_delete ON public.servidores FOR DELETE TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'rh.servidores.excluir'::text) AND (public.is_admin_user(auth.uid()) OR (NOT public.eh_meu_servidor(id)))));


--
-- Name: solicitacoes_abono rls_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_delete ON public.solicitacoes_abono FOR DELETE TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'rh.frequencia.lancar'::text) AND (public.is_admin_user(auth.uid()) OR (NOT public.eh_meu_servidor(servidor_id)))));


--
-- Name: solicitacoes_ajuste_ponto rls_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_delete ON public.solicitacoes_ajuste_ponto FOR DELETE TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'rh.frequencia.lancar'::text) AND (public.is_admin_user(auth.uid()) OR (servidor_id IS DISTINCT FROM auth.uid()))));


--
-- Name: tabela_inss rls_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_delete ON public.tabela_inss FOR DELETE TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'::text)));


--
-- Name: tabela_irrf rls_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_delete ON public.tabela_irrf FOR DELETE TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'::text)));


--
-- Name: tipos_abono rls_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_delete ON public.tipos_abono FOR DELETE TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'rh.frequencia.configurar'::text)));


--
-- Name: user_modules rls_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_delete ON public.user_modules FOR DELETE TO authenticated USING (public.is_admin_user(auth.uid()));


--
-- Name: user_roles rls_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_delete ON public.user_roles FOR DELETE TO authenticated USING (public.is_admin_user(auth.uid()));


--
-- Name: viagens_diarias rls_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_delete ON public.viagens_diarias FOR DELETE TO authenticated USING (public.is_admin_user(auth.uid()));


--
-- Name: vinculos_servidor rls_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_delete ON public.vinculos_servidor FOR DELETE TO authenticated USING (public.can_access_module(auth.uid(), 'rh'::text));


--
-- Name: banco_horas rls_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_insert ON public.banco_horas FOR INSERT TO authenticated WITH CHECK ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'rh.frequencia.lancar'::text) AND (public.is_admin_user(auth.uid()) OR (servidor_id IS DISTINCT FROM auth.uid()))));


--
-- Name: campanhas_inventario_unidades rls_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_insert ON public.campanhas_inventario_unidades FOR INSERT TO authenticated WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio'::text) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'::text)));


--
-- Name: cargos rls_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_insert ON public.cargos FOR INSERT TO authenticated WITH CHECK (public.can_access_module(auth.uid(), 'rh'::text));


--
-- Name: config_fechamento_frequencia rls_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_insert ON public.config_fechamento_frequencia FOR INSERT TO authenticated WITH CHECK ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'rh.frequencia.configurar'::text)));


--
-- Name: consignacoes rls_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_insert ON public.consignacoes FOR INSERT TO authenticated WITH CHECK ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'::text)));


--
-- Name: dependentes_irrf rls_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_insert ON public.dependentes_irrf FOR INSERT TO authenticated WITH CHECK ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'::text)));


--
-- Name: ferias_servidor rls_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_insert ON public.ferias_servidor FOR INSERT TO authenticated WITH CHECK ((public.can_access_module(auth.uid(), 'rh'::text) AND (public.has_permission_code(auth.uid(), 'rh.ferias.criar'::text) OR public.has_permission_code(auth.uid(), 'rh.ferias.editar'::text) OR public.has_permission_code(auth.uid(), 'rh.ferias.gerenciar'::text)) AND (public.is_admin_user(auth.uid()) OR (NOT public.eh_meu_servidor(servidor_id)))));


--
-- Name: fichas_financeiras rls_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_insert ON public.fichas_financeiras FOR INSERT TO authenticated WITH CHECK ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'::text)));


--
-- Name: folhas_pagamento rls_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_insert ON public.folhas_pagamento FOR INSERT TO authenticated WITH CHECK ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'::text)));


--
-- Name: fotos_vistoria_inventario rls_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_insert ON public.fotos_vistoria_inventario FOR INSERT TO authenticated WITH CHECK (((public.can_access_module(auth.uid(), 'patrimonio'::text) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'::text)) AND (usuario_id = auth.uid())));


--
-- Name: frequencia_fechamento rls_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_insert ON public.frequencia_fechamento FOR INSERT TO authenticated WITH CHECK ((public.can_access_module(auth.uid(), 'rh'::text) AND (public.has_permission_code(auth.uid(), 'rh.aprovar'::text) OR public.has_permission_code(auth.uid(), 'rh.frequencia.lancar'::text)) AND (public.is_admin_user(auth.uid()) OR (NOT public.eh_meu_servidor(servidor_id)))));


--
-- Name: frequencia_mensal rls_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_insert ON public.frequencia_mensal FOR INSERT TO authenticated WITH CHECK ((public.can_access_module(auth.uid(), 'rh'::text) AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar'::text) OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar'::text) OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar'::text)) AND (public.is_admin_user(auth.uid()) OR (NOT public.eh_meu_servidor(servidor_id)))));


--
-- Name: itens_ficha_financeira rls_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_insert ON public.itens_ficha_financeira FOR INSERT TO authenticated WITH CHECK ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'::text)));


--
-- Name: justificativas_ponto rls_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_insert ON public.justificativas_ponto FOR INSERT TO authenticated WITH CHECK (((public.can_access_module(auth.uid(), 'rh'::text) AND (public.has_permission_code(auth.uid(), 'rh.aprovar'::text) OR public.has_permission_code(auth.uid(), 'rh.frequencia.lancar'::text)) AND (public.is_admin_user(auth.uid()) OR (NOT public.eh_meu_servidor(( SELECT p.servidor_id
   FROM public.registros_ponto p
  WHERE (p.id = justificativas_ponto.registro_ponto_id)))))) OR (EXISTS ( SELECT 1
   FROM public.registros_ponto p
  WHERE ((p.id = justificativas_ponto.registro_ponto_id) AND (p.servidor_id = public.meu_servidor_id()))))));


--
-- Name: lancamentos_banco_horas rls_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_insert ON public.lancamentos_banco_horas FOR INSERT TO authenticated WITH CHECK ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'rh.frequencia.lancar'::text) AND (public.is_admin_user(auth.uid()) OR (( SELECT p.servidor_id
   FROM public.banco_horas p
  WHERE (p.id = lancamentos_banco_horas.banco_horas_id)) IS DISTINCT FROM auth.uid()))));


--
-- Name: lancamentos_folha rls_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_insert ON public.lancamentos_folha FOR INSERT TO authenticated WITH CHECK ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'::text)));


--
-- Name: licencas_afastamentos rls_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_insert ON public.licencas_afastamentos FOR INSERT TO authenticated WITH CHECK ((public.can_access_module(auth.uid(), 'rh'::text) AND (public.has_permission_code(auth.uid(), 'rh.licencas.criar'::text) OR public.has_permission_code(auth.uid(), 'rh.licencas.editar'::text) OR public.has_permission_code(auth.uid(), 'rh.licencas.gerenciar'::text)) AND (public.is_admin_user(auth.uid()) OR (NOT public.eh_meu_servidor(servidor_id)))));


--
-- Name: lotacoes rls_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_insert ON public.lotacoes FOR INSERT TO authenticated WITH CHECK (public.can_access_module(auth.uid(), 'rh'::text));


--
-- Name: parametros_folha rls_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_insert ON public.parametros_folha FOR INSERT TO authenticated WITH CHECK ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'::text)));


--
-- Name: registros_ponto rls_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_insert ON public.registros_ponto FOR INSERT TO authenticated WITH CHECK ((public.can_access_module(auth.uid(), 'rh'::text) AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar'::text) OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar'::text) OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar'::text)) AND (public.is_admin_user(auth.uid()) OR (NOT public.eh_meu_servidor(servidor_id)))));


--
-- Name: rubricas rls_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_insert ON public.rubricas FOR INSERT TO authenticated WITH CHECK ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'::text)));


--
-- Name: servidores rls_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_insert ON public.servidores FOR INSERT TO authenticated WITH CHECK ((public.can_access_module(auth.uid(), 'rh'::text) AND (public.is_admin_user(auth.uid()) OR (NOT public.eh_meu_servidor(id)))));


--
-- Name: solicitacoes_abono rls_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_insert ON public.solicitacoes_abono FOR INSERT TO authenticated WITH CHECK (((public.can_access_module(auth.uid(), 'rh'::text) AND (public.has_permission_code(auth.uid(), 'rh.aprovar'::text) OR public.has_permission_code(auth.uid(), 'rh.frequencia.lancar'::text)) AND (public.is_admin_user(auth.uid()) OR (NOT public.eh_meu_servidor(servidor_id)))) OR (servidor_id = public.meu_servidor_id())));


--
-- Name: solicitacoes_ajuste_ponto rls_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_insert ON public.solicitacoes_ajuste_ponto FOR INSERT TO authenticated WITH CHECK (((public.can_access_module(auth.uid(), 'rh'::text) AND (public.has_permission_code(auth.uid(), 'rh.aprovar'::text) OR public.has_permission_code(auth.uid(), 'rh.frequencia.lancar'::text)) AND (public.is_admin_user(auth.uid()) OR (servidor_id IS DISTINCT FROM auth.uid()))) OR ((servidor_id = auth.uid()) AND public.is_active_user())));


--
-- Name: tabela_inss rls_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_insert ON public.tabela_inss FOR INSERT TO authenticated WITH CHECK ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'::text)));


--
-- Name: tabela_irrf rls_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_insert ON public.tabela_irrf FOR INSERT TO authenticated WITH CHECK ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'::text)));


--
-- Name: tipos_abono rls_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_insert ON public.tipos_abono FOR INSERT TO authenticated WITH CHECK ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'rh.frequencia.configurar'::text)));


--
-- Name: user_modules rls_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_insert ON public.user_modules FOR INSERT TO authenticated WITH CHECK (public.is_admin_user(auth.uid()));


--
-- Name: user_roles rls_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_insert ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.is_admin_user(auth.uid()));


--
-- Name: viagens_diarias rls_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_insert ON public.viagens_diarias FOR INSERT TO authenticated WITH CHECK (((public.can_access_module(auth.uid(), 'rh'::text) OR public.can_access_module(auth.uid(), 'financeiro'::text)) AND (public.has_permission_code(auth.uid(), 'rh.viagens.criar'::text) OR public.has_permission_code(auth.uid(), 'rh.viagens.editar'::text) OR public.has_permission_code(auth.uid(), 'rh.viagens.gerenciar'::text) OR public.has_permission_code(auth.uid(), 'financeiro.diarias.gerenciar'::text)) AND (public.is_admin_user(auth.uid()) OR (NOT public.eh_meu_servidor(servidor_id)))));


--
-- Name: vinculos_servidor rls_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_insert ON public.vinculos_servidor FOR INSERT TO authenticated WITH CHECK (public.can_access_module(auth.uid(), 'rh'::text));


--
-- Name: banco_horas rls_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_select ON public.banco_horas FOR SELECT TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) OR ((servidor_id = auth.uid()) AND public.is_active_user())));


--
-- Name: campanhas_inventario_unidades rls_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_select ON public.campanhas_inventario_unidades FOR SELECT TO authenticated USING ((public.can_access_module(auth.uid(), 'patrimonio'::text) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'::text)));


--
-- Name: cargos rls_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_select ON public.cargos FOR SELECT TO authenticated USING (public.is_active_user());


--
-- Name: config_fechamento_frequencia rls_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_select ON public.config_fechamento_frequencia FOR SELECT TO authenticated USING (public.can_access_module(auth.uid(), 'rh'::text));


--
-- Name: consignacoes rls_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_select ON public.consignacoes FOR SELECT TO authenticated USING (public.can_access_module(auth.uid(), 'rh'::text));


--
-- Name: dependentes_irrf rls_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_select ON public.dependentes_irrf FOR SELECT TO authenticated USING (public.can_access_module(auth.uid(), 'rh'::text));


--
-- Name: ferias_servidor rls_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_select ON public.ferias_servidor FOR SELECT TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) OR (servidor_id = public.meu_servidor_id())));


--
-- Name: fichas_financeiras rls_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_select ON public.fichas_financeiras FOR SELECT TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) OR (servidor_id = public.meu_servidor_id())));


--
-- Name: folhas_pagamento rls_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_select ON public.folhas_pagamento FOR SELECT TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) OR (EXISTS ( SELECT 1
   FROM public.fichas_financeiras f
  WHERE ((f.folha_id = folhas_pagamento.id) AND (f.servidor_id = public.meu_servidor_id()))))));


--
-- Name: fotos_vistoria_inventario rls_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_select ON public.fotos_vistoria_inventario FOR SELECT TO authenticated USING ((public.can_access_module(auth.uid(), 'patrimonio'::text) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'::text)));


--
-- Name: frequencia_fechamento rls_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_select ON public.frequencia_fechamento FOR SELECT TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) OR (servidor_id = public.meu_servidor_id())));


--
-- Name: frequencia_mensal rls_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_select ON public.frequencia_mensal FOR SELECT TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) OR (servidor_id = public.meu_servidor_id())));


--
-- Name: itens_ficha_financeira rls_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_select ON public.itens_ficha_financeira FOR SELECT TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) OR (EXISTS ( SELECT 1
   FROM public.fichas_financeiras p
  WHERE ((p.id = itens_ficha_financeira.ficha_id) AND (p.servidor_id = public.meu_servidor_id()))))));


--
-- Name: justificativas_ponto rls_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_select ON public.justificativas_ponto FOR SELECT TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) OR (EXISTS ( SELECT 1
   FROM public.registros_ponto p
  WHERE ((p.id = justificativas_ponto.registro_ponto_id) AND (p.servidor_id = public.meu_servidor_id()))))));


--
-- Name: lancamentos_banco_horas rls_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_select ON public.lancamentos_banco_horas FOR SELECT TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) OR (EXISTS ( SELECT 1
   FROM public.banco_horas p
  WHERE ((p.id = lancamentos_banco_horas.banco_horas_id) AND ((p.servidor_id = auth.uid()) AND public.is_active_user()))))));


--
-- Name: lancamentos_folha rls_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_select ON public.lancamentos_folha FOR SELECT TO authenticated USING (public.can_access_module(auth.uid(), 'rh'::text));


--
-- Name: licencas_afastamentos rls_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_select ON public.licencas_afastamentos FOR SELECT TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) OR (servidor_id = public.meu_servidor_id())));


--
-- Name: lotacoes rls_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_select ON public.lotacoes FOR SELECT TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) OR (servidor_id = public.meu_servidor_id())));


--
-- Name: parametros_folha rls_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_select ON public.parametros_folha FOR SELECT TO authenticated USING (public.can_access_module(auth.uid(), 'rh'::text));


--
-- Name: registros_ponto rls_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_select ON public.registros_ponto FOR SELECT TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) OR (servidor_id = public.meu_servidor_id())));


--
-- Name: rubricas rls_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_select ON public.rubricas FOR SELECT TO authenticated USING (public.can_access_module(auth.uid(), 'rh'::text));


--
-- Name: servidores rls_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_select ON public.servidores FOR SELECT TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) OR (id = public.meu_servidor_id())));


--
-- Name: solicitacoes_abono rls_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_select ON public.solicitacoes_abono FOR SELECT TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) OR (servidor_id = public.meu_servidor_id())));


--
-- Name: solicitacoes_ajuste_ponto rls_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_select ON public.solicitacoes_ajuste_ponto FOR SELECT TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) OR ((servidor_id = auth.uid()) AND public.is_active_user())));


--
-- Name: tabela_inss rls_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_select ON public.tabela_inss FOR SELECT TO authenticated USING (public.can_access_module(auth.uid(), 'rh'::text));


--
-- Name: tabela_irrf rls_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_select ON public.tabela_irrf FOR SELECT TO authenticated USING (public.can_access_module(auth.uid(), 'rh'::text));


--
-- Name: tipos_abono rls_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_select ON public.tipos_abono FOR SELECT TO authenticated USING (public.is_active_user());


--
-- Name: user_modules rls_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_select ON public.user_modules FOR SELECT TO authenticated USING ((public.is_admin_user(auth.uid()) OR ((user_id = auth.uid()) AND public.is_active_user())));


--
-- Name: user_roles rls_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_select ON public.user_roles FOR SELECT TO authenticated USING ((public.is_admin_user(auth.uid()) OR ((user_id = auth.uid()) AND public.is_active_user())));


--
-- Name: viagens_diarias rls_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_select ON public.viagens_diarias FOR SELECT TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) OR public.can_access_module(auth.uid(), 'financeiro'::text) OR (servidor_id = public.meu_servidor_id())));


--
-- Name: vinculos_servidor rls_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_select ON public.vinculos_servidor FOR SELECT TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) OR (servidor_id = public.meu_servidor_id())));


--
-- Name: banco_horas rls_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_update ON public.banco_horas FOR UPDATE TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'rh.frequencia.lancar'::text) AND (public.is_admin_user(auth.uid()) OR (servidor_id IS DISTINCT FROM auth.uid())))) WITH CHECK ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'rh.frequencia.lancar'::text) AND (public.is_admin_user(auth.uid()) OR (servidor_id IS DISTINCT FROM auth.uid()))));


--
-- Name: campanhas_inventario_unidades rls_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_update ON public.campanhas_inventario_unidades FOR UPDATE TO authenticated USING ((public.can_access_module(auth.uid(), 'patrimonio'::text) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'::text))) WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio'::text) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'::text)));


--
-- Name: cargos rls_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_update ON public.cargos FOR UPDATE TO authenticated USING (public.can_access_module(auth.uid(), 'rh'::text)) WITH CHECK (public.can_access_module(auth.uid(), 'rh'::text));


--
-- Name: config_fechamento_frequencia rls_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_update ON public.config_fechamento_frequencia FOR UPDATE TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'rh.frequencia.configurar'::text))) WITH CHECK ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'rh.frequencia.configurar'::text)));


--
-- Name: consignacoes rls_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_update ON public.consignacoes FOR UPDATE TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'::text))) WITH CHECK ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'::text)));


--
-- Name: dependentes_irrf rls_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_update ON public.dependentes_irrf FOR UPDATE TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'::text))) WITH CHECK ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'::text)));


--
-- Name: ferias_servidor rls_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_update ON public.ferias_servidor FOR UPDATE TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) AND (public.has_permission_code(auth.uid(), 'rh.ferias.criar'::text) OR public.has_permission_code(auth.uid(), 'rh.ferias.editar'::text) OR public.has_permission_code(auth.uid(), 'rh.ferias.gerenciar'::text)) AND (public.is_admin_user(auth.uid()) OR (NOT public.eh_meu_servidor(servidor_id))))) WITH CHECK ((public.can_access_module(auth.uid(), 'rh'::text) AND (public.has_permission_code(auth.uid(), 'rh.ferias.criar'::text) OR public.has_permission_code(auth.uid(), 'rh.ferias.editar'::text) OR public.has_permission_code(auth.uid(), 'rh.ferias.gerenciar'::text)) AND (public.is_admin_user(auth.uid()) OR (NOT public.eh_meu_servidor(servidor_id)))));


--
-- Name: fichas_financeiras rls_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_update ON public.fichas_financeiras FOR UPDATE TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'::text))) WITH CHECK ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'::text)));


--
-- Name: folhas_pagamento rls_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_update ON public.folhas_pagamento FOR UPDATE TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'::text))) WITH CHECK ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'::text)));


--
-- Name: fotos_vistoria_inventario rls_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_update ON public.fotos_vistoria_inventario FOR UPDATE TO authenticated USING (((public.can_access_module(auth.uid(), 'patrimonio'::text) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'::text)) AND ((usuario_id = auth.uid()) OR public.has_permission_code(auth.uid(), 'patrimonio.tramitar'::text)))) WITH CHECK (((public.can_access_module(auth.uid(), 'patrimonio'::text) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'::text)) AND ((usuario_id = auth.uid()) OR public.has_permission_code(auth.uid(), 'patrimonio.tramitar'::text))));


--
-- Name: frequencia_fechamento rls_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_update ON public.frequencia_fechamento FOR UPDATE TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) AND (public.has_permission_code(auth.uid(), 'rh.aprovar'::text) OR public.has_permission_code(auth.uid(), 'rh.frequencia.lancar'::text)) AND (public.is_admin_user(auth.uid()) OR (NOT public.eh_meu_servidor(servidor_id))))) WITH CHECK ((public.can_access_module(auth.uid(), 'rh'::text) AND (public.has_permission_code(auth.uid(), 'rh.aprovar'::text) OR public.has_permission_code(auth.uid(), 'rh.frequencia.lancar'::text)) AND (public.is_admin_user(auth.uid()) OR (NOT public.eh_meu_servidor(servidor_id)))));


--
-- Name: frequencia_mensal rls_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_update ON public.frequencia_mensal FOR UPDATE TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar'::text) OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar'::text) OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar'::text)) AND (public.is_admin_user(auth.uid()) OR (NOT public.eh_meu_servidor(servidor_id))))) WITH CHECK ((public.can_access_module(auth.uid(), 'rh'::text) AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar'::text) OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar'::text) OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar'::text)) AND (public.is_admin_user(auth.uid()) OR (NOT public.eh_meu_servidor(servidor_id)))));


--
-- Name: itens_ficha_financeira rls_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_update ON public.itens_ficha_financeira FOR UPDATE TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'::text))) WITH CHECK ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'::text)));


--
-- Name: justificativas_ponto rls_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_update ON public.justificativas_ponto FOR UPDATE TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) AND (public.has_permission_code(auth.uid(), 'rh.aprovar'::text) OR public.has_permission_code(auth.uid(), 'rh.frequencia.lancar'::text)) AND (public.is_admin_user(auth.uid()) OR (NOT public.eh_meu_servidor(( SELECT p.servidor_id
   FROM public.registros_ponto p
  WHERE (p.id = justificativas_ponto.registro_ponto_id))))))) WITH CHECK ((public.can_access_module(auth.uid(), 'rh'::text) AND (public.has_permission_code(auth.uid(), 'rh.aprovar'::text) OR public.has_permission_code(auth.uid(), 'rh.frequencia.lancar'::text)) AND (public.is_admin_user(auth.uid()) OR (NOT public.eh_meu_servidor(( SELECT p.servidor_id
   FROM public.registros_ponto p
  WHERE (p.id = justificativas_ponto.registro_ponto_id)))))));


--
-- Name: lancamentos_banco_horas rls_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_update ON public.lancamentos_banco_horas FOR UPDATE TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'rh.frequencia.lancar'::text) AND (public.is_admin_user(auth.uid()) OR (( SELECT p.servidor_id
   FROM public.banco_horas p
  WHERE (p.id = lancamentos_banco_horas.banco_horas_id)) IS DISTINCT FROM auth.uid())))) WITH CHECK ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'rh.frequencia.lancar'::text) AND (public.is_admin_user(auth.uid()) OR (( SELECT p.servidor_id
   FROM public.banco_horas p
  WHERE (p.id = lancamentos_banco_horas.banco_horas_id)) IS DISTINCT FROM auth.uid()))));


--
-- Name: lancamentos_folha rls_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_update ON public.lancamentos_folha FOR UPDATE TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'::text))) WITH CHECK ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'::text)));


--
-- Name: licencas_afastamentos rls_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_update ON public.licencas_afastamentos FOR UPDATE TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) AND (public.has_permission_code(auth.uid(), 'rh.licencas.criar'::text) OR public.has_permission_code(auth.uid(), 'rh.licencas.editar'::text) OR public.has_permission_code(auth.uid(), 'rh.licencas.gerenciar'::text)) AND (public.is_admin_user(auth.uid()) OR (NOT public.eh_meu_servidor(servidor_id))))) WITH CHECK ((public.can_access_module(auth.uid(), 'rh'::text) AND (public.has_permission_code(auth.uid(), 'rh.licencas.criar'::text) OR public.has_permission_code(auth.uid(), 'rh.licencas.editar'::text) OR public.has_permission_code(auth.uid(), 'rh.licencas.gerenciar'::text)) AND (public.is_admin_user(auth.uid()) OR (NOT public.eh_meu_servidor(servidor_id)))));


--
-- Name: lotacoes rls_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_update ON public.lotacoes FOR UPDATE TO authenticated USING (public.can_access_module(auth.uid(), 'rh'::text)) WITH CHECK (public.can_access_module(auth.uid(), 'rh'::text));


--
-- Name: parametros_folha rls_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_update ON public.parametros_folha FOR UPDATE TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'::text))) WITH CHECK ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'::text)));


--
-- Name: registros_ponto rls_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_update ON public.registros_ponto FOR UPDATE TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar'::text) OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar'::text) OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar'::text)) AND (public.is_admin_user(auth.uid()) OR (NOT public.eh_meu_servidor(servidor_id))))) WITH CHECK ((public.can_access_module(auth.uid(), 'rh'::text) AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar'::text) OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar'::text) OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar'::text)) AND (public.is_admin_user(auth.uid()) OR (NOT public.eh_meu_servidor(servidor_id)))));


--
-- Name: rubricas rls_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_update ON public.rubricas FOR UPDATE TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'::text))) WITH CHECK ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'::text)));


--
-- Name: servidores rls_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_update ON public.servidores FOR UPDATE TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) AND (public.is_admin_user(auth.uid()) OR (NOT public.eh_meu_servidor(id))))) WITH CHECK ((public.can_access_module(auth.uid(), 'rh'::text) AND (public.is_admin_user(auth.uid()) OR (NOT public.eh_meu_servidor(id)))));


--
-- Name: solicitacoes_abono rls_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_update ON public.solicitacoes_abono FOR UPDATE TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) AND (public.has_permission_code(auth.uid(), 'rh.aprovar'::text) OR public.has_permission_code(auth.uid(), 'rh.frequencia.lancar'::text)) AND (public.is_admin_user(auth.uid()) OR (NOT public.eh_meu_servidor(servidor_id))))) WITH CHECK ((public.can_access_module(auth.uid(), 'rh'::text) AND (public.has_permission_code(auth.uid(), 'rh.aprovar'::text) OR public.has_permission_code(auth.uid(), 'rh.frequencia.lancar'::text)) AND (public.is_admin_user(auth.uid()) OR (NOT public.eh_meu_servidor(servidor_id)))));


--
-- Name: solicitacoes_ajuste_ponto rls_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_update ON public.solicitacoes_ajuste_ponto FOR UPDATE TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) AND (public.has_permission_code(auth.uid(), 'rh.aprovar'::text) OR public.has_permission_code(auth.uid(), 'rh.frequencia.lancar'::text)) AND (public.is_admin_user(auth.uid()) OR (servidor_id IS DISTINCT FROM auth.uid())))) WITH CHECK ((public.can_access_module(auth.uid(), 'rh'::text) AND (public.has_permission_code(auth.uid(), 'rh.aprovar'::text) OR public.has_permission_code(auth.uid(), 'rh.frequencia.lancar'::text)) AND (public.is_admin_user(auth.uid()) OR (servidor_id IS DISTINCT FROM auth.uid()))));


--
-- Name: tabela_inss rls_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_update ON public.tabela_inss FOR UPDATE TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'::text))) WITH CHECK ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'::text)));


--
-- Name: tabela_irrf rls_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_update ON public.tabela_irrf FOR UPDATE TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'::text))) WITH CHECK ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'::text)));


--
-- Name: tipos_abono rls_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_update ON public.tipos_abono FOR UPDATE TO authenticated USING ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'rh.frequencia.configurar'::text))) WITH CHECK ((public.can_access_module(auth.uid(), 'rh'::text) AND public.has_permission_code(auth.uid(), 'rh.frequencia.configurar'::text)));


--
-- Name: user_modules rls_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_update ON public.user_modules FOR UPDATE TO authenticated USING (public.is_admin_user(auth.uid())) WITH CHECK (public.is_admin_user(auth.uid()));


--
-- Name: user_roles rls_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_update ON public.user_roles FOR UPDATE TO authenticated USING (public.is_admin_user(auth.uid())) WITH CHECK (public.is_admin_user(auth.uid()));


--
-- Name: viagens_diarias rls_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_update ON public.viagens_diarias FOR UPDATE TO authenticated USING (((public.can_access_module(auth.uid(), 'rh'::text) OR public.can_access_module(auth.uid(), 'financeiro'::text)) AND (public.has_permission_code(auth.uid(), 'rh.viagens.criar'::text) OR public.has_permission_code(auth.uid(), 'rh.viagens.editar'::text) OR public.has_permission_code(auth.uid(), 'rh.viagens.gerenciar'::text) OR public.has_permission_code(auth.uid(), 'financeiro.diarias.gerenciar'::text)) AND (public.is_admin_user(auth.uid()) OR (NOT public.eh_meu_servidor(servidor_id))))) WITH CHECK (((public.can_access_module(auth.uid(), 'rh'::text) OR public.can_access_module(auth.uid(), 'financeiro'::text)) AND (public.has_permission_code(auth.uid(), 'rh.viagens.criar'::text) OR public.has_permission_code(auth.uid(), 'rh.viagens.editar'::text) OR public.has_permission_code(auth.uid(), 'rh.viagens.gerenciar'::text) OR public.has_permission_code(auth.uid(), 'financeiro.diarias.gerenciar'::text)) AND (public.is_admin_user(auth.uid()) OR (NOT public.eh_meu_servidor(servidor_id)))));


--
-- Name: vinculos_servidor rls_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rls_update ON public.vinculos_servidor FOR UPDATE TO authenticated USING (public.can_access_module(auth.uid(), 'rh'::text)) WITH CHECK (public.can_access_module(auth.uid(), 'rh'::text));


--
-- Name: role_permissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: rubricas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rubricas ENABLE ROW LEVEL SECURITY;

--
-- Name: rubricas_historico; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rubricas_historico ENABLE ROW LEVEL SECURITY;

--
-- Name: denuncias sel_denuncias_gerenciar; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sel_denuncias_gerenciar ON public.denuncias FOR SELECT TO authenticated USING (public.has_permission_code(auth.uid(), 'integridade.gerenciar'::text));


--
-- Name: role_permissions sel_role_permissions_authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sel_role_permissions_authenticated ON public.role_permissions FOR SELECT TO authenticated USING (true);


--
-- Name: user_permissions sel_user_permissions_own_or_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sel_user_permissions_own_or_admin ON public.user_permissions FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR public.is_admin_atual()));


--
-- Name: servidor_regime; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.servidor_regime ENABLE ROW LEVEL SECURITY;

--
-- Name: servidor_tag_vinculos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.servidor_tag_vinculos ENABLE ROW LEVEL SECURITY;

--
-- Name: servidor_tags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.servidor_tags ENABLE ROW LEVEL SECURITY;

--
-- Name: servidores; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.servidores ENABLE ROW LEVEL SECURITY;

--
-- Name: solicitacoes_abono; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.solicitacoes_abono ENABLE ROW LEVEL SECURITY;

--
-- Name: solicitacoes_ajuste_ponto; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.solicitacoes_ajuste_ponto ENABLE ROW LEVEL SECURITY;

--
-- Name: solicitacoes_sic; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.solicitacoes_sic ENABLE ROW LEVEL SECURITY;

--
-- Name: tabela_inss; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tabela_inss ENABLE ROW LEVEL SECURITY;

--
-- Name: tabela_irrf; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tabela_irrf ENABLE ROW LEVEL SECURITY;

--
-- Name: termos_cessao; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.termos_cessao ENABLE ROW LEVEL SECURITY;

--
-- Name: tipos_abono; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tipos_abono ENABLE ROW LEVEL SECURITY;

--
-- Name: unidades_locais; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.unidades_locais ENABLE ROW LEVEL SECURITY;

--
-- Name: denuncias upd_denuncias_gerenciar; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY upd_denuncias_gerenciar ON public.denuncias FOR UPDATE TO authenticated USING (public.has_permission_code(auth.uid(), 'integridade.gerenciar'::text)) WITH CHECK (public.has_permission_code(auth.uid(), 'integridade.gerenciar'::text));


--
-- Name: role_permissions upd_role_permissions_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY upd_role_permissions_admin ON public.role_permissions FOR UPDATE TO authenticated USING (public.is_admin_atual()) WITH CHECK (public.is_admin_atual());


--
-- Name: user_permissions upd_user_permissions_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY upd_user_permissions_admin ON public.user_permissions FOR UPDATE TO authenticated USING (public.is_admin_atual()) WITH CHECK (public.is_admin_atual());


--
-- Name: user_modules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_modules ENABLE ROW LEVEL SECURITY;

--
-- Name: user_org_units; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_org_units ENABLE ROW LEVEL SECURITY;

--
-- Name: user_permissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: viagens_diarias; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.viagens_diarias ENABLE ROW LEVEL SECURITY;

--
-- Name: vinculos_funcionais; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vinculos_funcionais ENABLE ROW LEVEL SECURITY;

--
-- Name: vinculos_servidor; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vinculos_servidor ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


