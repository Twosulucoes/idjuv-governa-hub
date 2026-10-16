-- ============================================================================
-- P11: limpeza e desempenho do banco
-- ============================================================================
-- Levantamento em /mnt/project-files/levantamento/P11-banco.md (replay das 295 migrações do main 47d4b7f).
-- Aprovado por Fabiano em 2026-10-16 ("vamos").
--
-- 1. fn_audit_log_licitacoes (trigger de auditoria em 43 tabelas) procurava o perfil do usuário em
--    usuario_perfis/perfis, que não existem mais: o erro era engolido e usuario_perfil saía sempre NULL.
--    Passa a ler os papéis de user_roles.
-- 2. search_path fixo nas 5 funções que ainda não tinham (alerta function_search_path_mutable do Supabase).
--    Nenhuma muda de resultado.
-- 3. Índice nas 196 chaves estrangeiras de dados sem índice que cubra a coluna. Ficam de fora as 225 colunas
--    de autoria (created_by, aprovado_por… apontando para auth.users/profiles): ninguém filtra por elas e
--    usuário não é apagado. A produção é pequena, então CREATE INDEX comum (sem CONCURRENTLY, que não roda
--    dentro da transação da migração) termina na hora.
-- 4. folhas_pagamento e fichas_financeiras saem da publicação supabase_realtime: nenhuma tela assina mudanças.
--
-- Idempotente: CREATE OR REPLACE, ALTER FUNCTION, CREATE INDEX IF NOT EXISTS e DROP TABLE condicional.
-- ============================================================================

-- 1. Auditoria grava o papel de quem mexeu ----------------------------------
CREATE OR REPLACE FUNCTION public.fn_audit_log_licitacoes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  SELECT p.full_name INTO v_usuario_nome FROM public.profiles p WHERE p.id = auth.uid();

  SELECT string_agg(ur.role::text, ', ' ORDER BY ur.role::text) INTO v_usuario_perfil
    FROM public.user_roles ur WHERE ur.user_id = auth.uid();

  INSERT INTO public.audit_log_licitacoes (tabela_origem, registro_id, acao, dados_anteriores, dados_novos, campos_alterados, usuario_id, usuario_nome, usuario_perfil)
  VALUES (TG_TABLE_NAME, v_registro_id, TG_OP, v_dados_anteriores, v_dados_novos, v_campos_alterados, auth.uid(), v_usuario_nome, v_usuario_perfil);

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$function$;

-- 2. search_path fixo -------------------------------------------------------
ALTER FUNCTION public.folha_avos_13(date, date, integer) SET search_path = public;
ALTER FUNCTION public.folha_dias_comerciais(date, date, date, date) SET search_path = public;
ALTER FUNCTION public.folha_item(text, text, numeric, text, numeric, numeric, text, uuid) SET search_path = public;
ALTER FUNCTION public.get_parametro_vigente(text, date) SET search_path = public;
ALTER FUNCTION public.get_parametro_vigente(character varying, date) SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- 3. Índices nas chaves estrangeiras de dados -------------------------------
CREATE INDEX IF NOT EXISTS idx_agenda_unidade_aprovador_id ON public.agenda_unidade (aprovador_id);
CREATE INDEX IF NOT EXISTS idx_almoxarifados_responsavel_id ON public.almoxarifados (responsavel_id);
CREATE INDEX IF NOT EXISTS idx_almoxarifados_unidade_id ON public.almoxarifados (unidade_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_requester_org_unit_id ON public.approval_requests (requester_org_unit_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_unit_id ON public.audit_logs (org_unit_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_controle_avaliador_id ON public.avaliacoes_controle (avaliador_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_controle_controle_id ON public.avaliacoes_controle (controle_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_risco_avaliador_id ON public.avaliacoes_risco (avaliador_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_risco_risco_id ON public.avaliacoes_risco (risco_id);
CREATE INDEX IF NOT EXISTS idx_backup_integrity_checks_backup_id ON public.backup_integrity_checks (backup_id);
CREATE INDEX IF NOT EXISTS idx_bens_patrimoniais_empenho_id ON public.bens_patrimoniais (empenho_id);
CREATE INDEX IF NOT EXISTS idx_bens_patrimoniais_fornecedor_id ON public.bens_patrimoniais (fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_bens_patrimoniais_item_id ON public.bens_patrimoniais (item_id);
CREATE INDEX IF NOT EXISTS idx_campanhas_inventario_responsavel_geral_id ON public.campanhas_inventario (responsavel_geral_id);
CREATE INDEX IF NOT EXISTS idx_cargo_unidade_compatibilidade_unidade_especifica_id ON public.cargo_unidade_compatibilidade (unidade_especifica_id);
CREATE INDEX IF NOT EXISTS idx_centros_custo_unidade_id ON public.centros_custo (unidade_id);
CREATE INDEX IF NOT EXISTS idx_cessoes_unidade_idjuv_id ON public.cessoes (unidade_idjuv_id);
CREATE INDEX IF NOT EXISTS idx_coletas_inventario_localizacao_encontrada_unidade_id ON public.coletas_inventario (localizacao_encontrada_unidade_id);
CREATE INDEX IF NOT EXISTS idx_coletas_inventario_responsavel_encontrado_id ON public.coletas_inventario (responsavel_encontrado_id);
CREATE INDEX IF NOT EXISTS idx_composicao_cargos_cargo_id ON public.composicao_cargos (cargo_id);
CREATE INDEX IF NOT EXISTS idx_conciliacoes_inventario_bem_id ON public.conciliacoes_inventario (bem_id);
CREATE INDEX IF NOT EXISTS idx_conciliacoes_inventario_coleta_id ON public.conciliacoes_inventario (coleta_id);
CREATE INDEX IF NOT EXISTS idx_config_compensacao_unidade_id ON public.config_compensacao (unidade_id);
CREATE INDEX IF NOT EXISTS idx_config_fechamento_folha_conta_remessa_padrao_id ON public.config_fechamento_folha (conta_remessa_padrao_id);
CREATE INDEX IF NOT EXISTS idx_config_incidencias_instituicao_id ON public.config_incidencias (instituicao_id);
CREATE INDEX IF NOT EXISTS idx_config_jornada_padrao_cargo_id ON public.config_jornada_padrao (cargo_id);
CREATE INDEX IF NOT EXISTS idx_config_jornada_padrao_servidor_id ON public.config_jornada_padrao (servidor_id);
CREATE INDEX IF NOT EXISTS idx_config_paginas_historico_pagina_id ON public.config_paginas_historico (pagina_id);
CREATE INDEX IF NOT EXISTS idx_config_parametros_valores_servidor_id ON public.config_parametros_valores (servidor_id);
CREATE INDEX IF NOT EXISTS idx_config_parametros_valores_versao_anterior_id ON public.config_parametros_valores (versao_anterior_id);
CREATE INDEX IF NOT EXISTS idx_config_rubricas_rubrica_base_id ON public.config_rubricas (rubrica_base_id);
CREATE INDEX IF NOT EXISTS idx_consignacoes_rubrica_id ON public.consignacoes (rubrica_id);
CREATE INDEX IF NOT EXISTS idx_contas_autarquia_banco_id ON public.contas_autarquia (banco_id);
CREATE INDEX IF NOT EXISTS idx_contratos_fiscal_id ON public.contratos (fiscal_id);
CREATE INDEX IF NOT EXISTS idx_contratos_fornecedor_id ON public.contratos (fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_contratos_gestor_id ON public.contratos (gestor_id);
CREATE INDEX IF NOT EXISTS idx_contratos_processo_licitatorio_id ON public.contratos (processo_licitatorio_id);
CREATE INDEX IF NOT EXISTS idx_controles_internos_processo_raci_id ON public.controles_internos (processo_raci_id);
CREATE INDEX IF NOT EXISTS idx_controles_internos_responsavel_id ON public.controles_internos (responsavel_id);
CREATE INDEX IF NOT EXISTS idx_controles_internos_risco_id ON public.controles_internos (risco_id);
CREATE INDEX IF NOT EXISTS idx_controles_internos_unidade_responsavel_id ON public.controles_internos (unidade_responsavel_id);
CREATE INDEX IF NOT EXISTS idx_creditos_adicionais_dotacao_id ON public.creditos_adicionais (dotacao_id);
CREATE INDEX IF NOT EXISTS idx_creditos_adicionais_dotacao_origem_id ON public.creditos_adicionais (dotacao_origem_id);
CREATE INDEX IF NOT EXISTS idx_decisoes_administrativas_autoridade_id ON public.decisoes_administrativas (autoridade_id);
CREATE INDEX IF NOT EXISTS idx_decisoes_administrativas_unidade_origem_id ON public.decisoes_administrativas (unidade_origem_id);
CREATE INDEX IF NOT EXISTS idx_demandas_ascom_aprovado_por_id ON public.demandas_ascom (aprovado_por_id);
CREATE INDEX IF NOT EXISTS idx_demandas_ascom_autorizado_presidencia_por_id ON public.demandas_ascom (autorizado_presidencia_por_id);
CREATE INDEX IF NOT EXISTS idx_demandas_ascom_responsavel_ascom_id ON public.demandas_ascom (responsavel_ascom_id);
CREATE INDEX IF NOT EXISTS idx_demandas_ascom_servidor_solicitante_id ON public.demandas_ascom (servidor_solicitante_id);
CREATE INDEX IF NOT EXISTS idx_demandas_ascom_unidade_solicitante_id ON public.demandas_ascom (unidade_solicitante_id);
CREATE INDEX IF NOT EXISTS idx_demandas_ascom_anexos_demanda_id ON public.demandas_ascom_anexos (demanda_id);
CREATE INDEX IF NOT EXISTS idx_demandas_ascom_comentarios_demanda_id ON public.demandas_ascom_comentarios (demanda_id);
CREATE INDEX IF NOT EXISTS idx_demandas_ascom_entregaveis_demanda_id ON public.demandas_ascom_entregaveis (demanda_id);
CREATE INDEX IF NOT EXISTS idx_designacoes_lotacao_id ON public.designacoes (lotacao_id);
CREATE INDEX IF NOT EXISTS idx_designacoes_unidade_origem_id ON public.designacoes (unidade_origem_id);
CREATE INDEX IF NOT EXISTS idx_despachos_movimentacao_id ON public.despachos (movimentacao_id);
CREATE INDEX IF NOT EXISTS idx_documentos_cargo_id ON public.documentos (cargo_id);
CREATE INDEX IF NOT EXISTS idx_documentos_unidade_id ON public.documentos (unidade_id);
CREATE INDEX IF NOT EXISTS idx_documentos_preparatorios_licitacao_aprovado_por ON public.documentos_preparatorios_licitacao (aprovado_por);
CREATE INDEX IF NOT EXISTS idx_documentos_preparatorios_licitacao_processo_licitatorio_id ON public.documentos_preparatorios_licitacao (processo_licitatorio_id);
CREATE INDEX IF NOT EXISTS idx_documentos_preparatorios_licitacao_responsavel_id ON public.documentos_preparatorios_licitacao (responsavel_id);
CREATE INDEX IF NOT EXISTS idx_dotacoes_orcamentarias_centro_custo_id ON public.dotacoes_orcamentarias (centro_custo_id);
CREATE INDEX IF NOT EXISTS idx_empenhos_processo_licitatorio_id ON public.empenhos (processo_licitatorio_id);
CREATE INDEX IF NOT EXISTS idx_encaminhamentos_servidor_destino_id ON public.encaminhamentos (servidor_destino_id);
CREATE INDEX IF NOT EXISTS idx_estrutura_organizacional_cargo_chefe_id ON public.estrutura_organizacional (cargo_chefe_id);
CREATE INDEX IF NOT EXISTS idx_exportacoes_folha_banco_id ON public.exportacoes_folha (banco_id);
CREATE INDEX IF NOT EXISTS idx_fichas_financeiras_centro_custo_id ON public.fichas_financeiras (centro_custo_id);
CREATE INDEX IF NOT EXISTS idx_fichas_financeiras_lotacao_id ON public.fichas_financeiras (lotacao_id);
CREATE INDEX IF NOT EXISTS idx_fichas_financeiras_unidade_id ON public.fichas_financeiras (unidade_id);
CREATE INDEX IF NOT EXISTS idx_fin_adiantamentos_conta_bancaria_id ON public.fin_adiantamentos (conta_bancaria_id);
CREATE INDEX IF NOT EXISTS idx_fin_adiantamentos_dotacao_id ON public.fin_adiantamentos (dotacao_id);
CREATE INDEX IF NOT EXISTS idx_fin_adiantamentos_empenho_id ON public.fin_adiantamentos (empenho_id);
CREATE INDEX IF NOT EXISTS idx_fin_adiantamentos_unidade_id ON public.fin_adiantamentos (unidade_id);
CREATE INDEX IF NOT EXISTS idx_fin_alteracoes_orcamentarias_dotacao_destino_id ON public.fin_alteracoes_orcamentarias (dotacao_destino_id);
CREATE INDEX IF NOT EXISTS idx_fin_alteracoes_orcamentarias_dotacao_origem_id ON public.fin_alteracoes_orcamentarias (dotacao_origem_id);
CREATE INDEX IF NOT EXISTS idx_fin_checklist_ci_solicitacao_id ON public.fin_checklist_ci (solicitacao_id);
CREATE INDEX IF NOT EXISTS idx_fin_contas_bancarias_fonte_recurso_id ON public.fin_contas_bancarias (fonte_recurso_id);
CREATE INDEX IF NOT EXISTS idx_fin_contas_bancarias_responsavel_id ON public.fin_contas_bancarias (responsavel_id);
CREATE INDEX IF NOT EXISTS idx_fin_documentos_documento_anterior_id ON public.fin_documentos (documento_anterior_id);
CREATE INDEX IF NOT EXISTS idx_fin_dotacoes_conta_contabil_id ON public.fin_dotacoes (conta_contabil_id);
CREATE INDEX IF NOT EXISTS idx_fin_dotacoes_natureza_despesa_id ON public.fin_dotacoes (natureza_despesa_id);
CREATE INDEX IF NOT EXISTS idx_fin_dotacoes_programa_id ON public.fin_dotacoes (programa_id);
CREATE INDEX IF NOT EXISTS idx_fin_empenho_anulacoes_empenho_id ON public.fin_empenho_anulacoes (empenho_id);
CREATE INDEX IF NOT EXISTS idx_fin_empenhos_conta_contabil_credito_id ON public.fin_empenhos (conta_contabil_credito_id);
CREATE INDEX IF NOT EXISTS idx_fin_empenhos_conta_contabil_debito_id ON public.fin_empenhos (conta_contabil_debito_id);
CREATE INDEX IF NOT EXISTS idx_fin_empenhos_fonte_recurso_id ON public.fin_empenhos (fonte_recurso_id);
CREATE INDEX IF NOT EXISTS idx_fin_empenhos_natureza_despesa_id ON public.fin_empenhos (natureza_despesa_id);
CREATE INDEX IF NOT EXISTS idx_fin_empenhos_solicitacao_id ON public.fin_empenhos (solicitacao_id);
CREATE INDEX IF NOT EXISTS idx_fin_extrato_transacoes_pagamento_id ON public.fin_extrato_transacoes (pagamento_id);
CREATE INDEX IF NOT EXISTS idx_fin_extrato_transacoes_receita_id ON public.fin_extrato_transacoes (receita_id);
CREATE INDEX IF NOT EXISTS idx_fin_lancamentos_contabeis_conta_credito_id ON public.fin_lancamentos_contabeis (conta_credito_id);
CREATE INDEX IF NOT EXISTS idx_fin_liquidacoes_conta_contabil_credito_id ON public.fin_liquidacoes (conta_contabil_credito_id);
CREATE INDEX IF NOT EXISTS idx_fin_liquidacoes_conta_contabil_debito_id ON public.fin_liquidacoes (conta_contabil_debito_id);
CREATE INDEX IF NOT EXISTS idx_fin_pagamentos_conta_contabil_credito_id ON public.fin_pagamentos (conta_contabil_credito_id);
CREATE INDEX IF NOT EXISTS idx_fin_pagamentos_conta_contabil_debito_id ON public.fin_pagamentos (conta_contabil_debito_id);
CREATE INDEX IF NOT EXISTS idx_fin_pagamentos_fornecedor_id ON public.fin_pagamentos (fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_fin_receitas_convenio_id ON public.fin_receitas (convenio_id);
CREATE INDEX IF NOT EXISTS idx_fin_receitas_fonte_recurso_id ON public.fin_receitas (fonte_recurso_id);
CREATE INDEX IF NOT EXISTS idx_fin_solicitacoes_contrato_id ON public.fin_solicitacoes (contrato_id);
CREATE INDEX IF NOT EXISTS idx_fin_solicitacoes_dotacao_sugerida_id ON public.fin_solicitacoes (dotacao_sugerida_id);
CREATE INDEX IF NOT EXISTS idx_fin_solicitacoes_fornecedor_id ON public.fin_solicitacoes (fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_fin_solicitacoes_processo_licitatorio_id ON public.fin_solicitacoes (processo_licitatorio_id);
CREATE INDEX IF NOT EXISTS idx_fin_solicitacoes_servidor_solicitante_id ON public.fin_solicitacoes (servidor_solicitante_id);
CREATE INDEX IF NOT EXISTS idx_fotos_vistoria_inventario_unidade_local_id ON public.fotos_vistoria_inventario (unidade_local_id);
CREATE INDEX IF NOT EXISTS idx_frequencia_pacotes_agrupamento_id ON public.frequencia_pacotes (agrupamento_id);
CREATE INDEX IF NOT EXISTS idx_frequencia_pacotes_unidade_id ON public.frequencia_pacotes (unidade_id);
CREATE INDEX IF NOT EXISTS idx_historico_convites_reuniao_modelo_id ON public.historico_convites_reuniao (modelo_id);
CREATE INDEX IF NOT EXISTS idx_historico_convites_reuniao_participante_id ON public.historico_convites_reuniao (participante_id);
CREATE INDEX IF NOT EXISTS idx_historico_funcional_cargo_anterior_id ON public.historico_funcional (cargo_anterior_id);
CREATE INDEX IF NOT EXISTS idx_historico_funcional_cargo_novo_id ON public.historico_funcional (cargo_novo_id);
CREATE INDEX IF NOT EXISTS idx_historico_funcional_unidade_anterior_id ON public.historico_funcional (unidade_anterior_id);
CREATE INDEX IF NOT EXISTS idx_historico_funcional_unidade_nova_id ON public.historico_funcional (unidade_nova_id);
CREATE INDEX IF NOT EXISTS idx_historico_patrimonio_baixa_id ON public.historico_patrimonio (baixa_id);
CREATE INDEX IF NOT EXISTS idx_historico_patrimonio_manutencao_id ON public.historico_patrimonio (manutencao_id);
CREATE INDEX IF NOT EXISTS idx_historico_patrimonio_movimentacao_id ON public.historico_patrimonio (movimentacao_id);
CREATE INDEX IF NOT EXISTS idx_itens_ata_registro_preco_item_licitatorio_id ON public.itens_ata_registro_preco (item_licitatorio_id);
CREATE INDEX IF NOT EXISTS idx_itens_contrato_item_ata_id ON public.itens_contrato (item_ata_id);
CREATE INDEX IF NOT EXISTS idx_itens_ficha_financeira_rubrica_id ON public.itens_ficha_financeira (rubrica_id);
CREATE INDEX IF NOT EXISTS idx_itens_licitacao_vencedor_id ON public.itens_licitacao (vencedor_id);
CREATE INDEX IF NOT EXISTS idx_itens_retorno_bancario_ficha_id ON public.itens_retorno_bancario (ficha_id);
CREATE INDEX IF NOT EXISTS idx_itens_retorno_bancario_retorno_id ON public.itens_retorno_bancario (retorno_id);
CREATE INDEX IF NOT EXISTS idx_itens_retorno_bancario_servidor_id ON public.itens_retorno_bancario (servidor_id);
CREATE INDEX IF NOT EXISTS idx_justificativas_ponto_registro_ponto_id ON public.justificativas_ponto (registro_ponto_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_banco_horas_banco_horas_id ON public.lancamentos_banco_horas (banco_horas_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_banco_horas_registro_ponto_id ON public.lancamentos_banco_horas (registro_ponto_id);
CREATE INDEX IF NOT EXISTS idx_liquidacoes_atestado_por ON public.liquidacoes (atestado_por);
CREATE INDEX IF NOT EXISTS idx_lotacoes_cargo_id ON public.lotacoes (cargo_id);
CREATE INDEX IF NOT EXISTS idx_manutencoes_patrimonio_fornecedor_id ON public.manutencoes_patrimonio (fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_matriz_raci_papeis_cargo_id ON public.matriz_raci_papeis (cargo_id);
CREATE INDEX IF NOT EXISTS idx_matriz_raci_papeis_unidade_id ON public.matriz_raci_papeis (unidade_id);
CREATE INDEX IF NOT EXISTS idx_medicoes_contrato_aprovado_por ON public.medicoes_contrato (aprovado_por);
CREATE INDEX IF NOT EXISTS idx_memorandos_lotacao_cargo_id ON public.memorandos_lotacao (cargo_id);
CREATE INDEX IF NOT EXISTS idx_memorandos_lotacao_unidade_destino_id ON public.memorandos_lotacao (unidade_destino_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_bem_responsavel_destino_id ON public.movimentacoes_bem (responsavel_destino_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_bem_responsavel_origem_id ON public.movimentacoes_bem (responsavel_origem_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_bem_unidade_destino_id ON public.movimentacoes_bem (unidade_destino_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_bem_unidade_origem_id ON public.movimentacoes_bem (unidade_origem_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_estoque_almoxarifado_destino_id ON public.movimentacoes_estoque (almoxarifado_destino_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_estoque_empenho_id ON public.movimentacoes_estoque (empenho_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_estoque_servidor_responsavel_id ON public.movimentacoes_estoque (servidor_responsavel_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_estoque_setor_destino_id ON public.movimentacoes_estoque (setor_destino_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_patrimonio_responsavel_destino_id ON public.movimentacoes_patrimonio (responsavel_destino_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_patrimonio_responsavel_origem_id ON public.movimentacoes_patrimonio (responsavel_origem_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_patrimonio_unidade_destino_id ON public.movimentacoes_patrimonio (unidade_destino_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_patrimonio_unidade_origem_id ON public.movimentacoes_patrimonio (unidade_origem_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_processo_servidor_origem_id ON public.movimentacoes_processo (servidor_origem_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_processo_unidade_origem_id ON public.movimentacoes_processo (unidade_origem_id);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_patrimonio_responsavel_relato_id ON public.ocorrencias_patrimonio (responsavel_relato_id);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_servidor_servidor_id ON public.ocorrencias_servidor (servidor_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_conta_autarquia_id ON public.pagamentos (conta_autarquia_id);
CREATE INDEX IF NOT EXISTS idx_pareceres_tecnicos_autor_id ON public.pareceres_tecnicos (autor_id);
CREATE INDEX IF NOT EXISTS idx_pareceres_tecnicos_decisao_vinculada_id ON public.pareceres_tecnicos (decisao_vinculada_id);
CREATE INDEX IF NOT EXISTS idx_pareceres_tecnicos_unidade_origem_id ON public.pareceres_tecnicos (unidade_origem_id);
CREATE INDEX IF NOT EXISTS idx_planos_tratamento_risco_responsavel_id ON public.planos_tratamento_risco (responsavel_id);
CREATE INDEX IF NOT EXISTS idx_portarias_servidor_historico_id ON public.portarias_servidor (historico_id);
CREATE INDEX IF NOT EXISTS idx_portarias_servidor_portaria_revogadora_id ON public.portarias_servidor (portaria_revogadora_id);
CREATE INDEX IF NOT EXISTS idx_prazos_processo_responsavel_id ON public.prazos_processo (responsavel_id);
CREATE INDEX IF NOT EXISTS idx_pre_cadastros_servidor_id ON public.pre_cadastros (servidor_id);
CREATE INDEX IF NOT EXISTS idx_processos_administrativos_processo_origem_id ON public.processos_administrativos (processo_origem_id);
CREATE INDEX IF NOT EXISTS idx_processos_licitatorios_pregoeiro_id ON public.processos_licitatorios (pregoeiro_id);
CREATE INDEX IF NOT EXISTS idx_processos_licitatorios_servidor_responsavel_id ON public.processos_licitatorios (servidor_responsavel_id);
CREATE INDEX IF NOT EXISTS idx_processos_licitatorios_unidade_requisitante_id ON public.processos_licitatorios (unidade_requisitante_id);
CREATE INDEX IF NOT EXISTS idx_programas_servidor_responsavel_id ON public.programas (servidor_responsavel_id);
CREATE INDEX IF NOT EXISTS idx_programas_unidade_responsavel_id ON public.programas (unidade_responsavel_id);
CREATE INDEX IF NOT EXISTS idx_propostas_licitacao_item_id ON public.propostas_licitacao (item_id);
CREATE INDEX IF NOT EXISTS idx_provimentos_unidade_id ON public.provimentos (unidade_id);
CREATE INDEX IF NOT EXISTS idx_publicacoes_lai_contrato_id ON public.publicacoes_lai (contrato_id);
CREATE INDEX IF NOT EXISTS idx_publicacoes_lai_servidor_id ON public.publicacoes_lai (servidor_id);
CREATE INDEX IF NOT EXISTS idx_publicacoes_lai_unidade_id ON public.publicacoes_lai (unidade_id);
CREATE INDEX IF NOT EXISTS idx_publicacoes_legais_contrato_id ON public.publicacoes_legais (contrato_id);
CREATE INDEX IF NOT EXISTS idx_publicacoes_legais_processo_licitatorio_id ON public.publicacoes_legais (processo_licitatorio_id);
CREATE INDEX IF NOT EXISTS idx_requisicao_itens_item_id ON public.requisicao_itens (item_id);
CREATE INDEX IF NOT EXISTS idx_requisicao_itens_requisicao_id ON public.requisicao_itens (requisicao_id);
CREATE INDEX IF NOT EXISTS idx_requisicoes_material_almoxarifado_id ON public.requisicoes_material (almoxarifado_id);
CREATE INDEX IF NOT EXISTS idx_requisicoes_material_responsavel_entrega_id ON public.requisicoes_material (responsavel_entrega_id);
CREATE INDEX IF NOT EXISTS idx_requisicoes_material_setor_solicitante_id ON public.requisicoes_material (setor_solicitante_id);
CREATE INDEX IF NOT EXISTS idx_requisicoes_material_solicitante_id ON public.requisicoes_material (solicitante_id);
CREATE INDEX IF NOT EXISTS idx_respostas_checklist_responsavel_id ON public.respostas_checklist (responsavel_id);
CREATE INDEX IF NOT EXISTS idx_reunioes_organizador_id ON public.reunioes (organizador_id);
CREATE INDEX IF NOT EXISTS idx_reunioes_unidade_responsavel_id ON public.reunioes (unidade_responsavel_id);
CREATE INDEX IF NOT EXISTS idx_riscos_institucionais_processo_raci_id ON public.riscos_institucionais (processo_raci_id);
CREATE INDEX IF NOT EXISTS idx_riscos_institucionais_unidade_responsavel_id ON public.riscos_institucionais (unidade_responsavel_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON public.role_permissions (permission);
CREATE INDEX IF NOT EXISTS idx_servidor_regime_jornada_id ON public.servidor_regime (jornada_id);
CREATE INDEX IF NOT EXISTS idx_servidor_regime_regime_id ON public.servidor_regime (regime_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_abono_tipo_abono_id ON public.solicitacoes_abono (tipo_abono_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_ajuste_ponto_registro_ponto_id ON public.solicitacoes_ajuste_ponto (registro_ponto_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_sic_recurso_respondido_por ON public.solicitacoes_sic (recurso_respondido_por);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_sic_respondido_por ON public.solicitacoes_sic (respondido_por);
CREATE INDEX IF NOT EXISTS idx_termos_cessao_agenda_id ON public.termos_cessao (agenda_id);
CREATE INDEX IF NOT EXISTS idx_termos_cessao_chefe_responsavel_id ON public.termos_cessao (chefe_responsavel_id);
CREATE INDEX IF NOT EXISTS idx_user_org_units_unidade_id ON public.user_org_units (unidade_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission ON public.user_permissions (permission);
CREATE INDEX IF NOT EXISTS idx_vinculos_funcionais_servidor_id ON public.vinculos_funcionais (servidor_id);
CREATE INDEX IF NOT EXISTS idx_vinculos_servidor_cargo_id ON public.vinculos_servidor (cargo_id);
CREATE INDEX IF NOT EXISTS idx_vinculos_servidor_unidade_id ON public.vinculos_servidor (unidade_id);

-- 4. Folha fora do Realtime -------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    FOREACH t IN ARRAY ARRAY['fichas_financeiras', 'folhas_pagamento'] LOOP
      IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime DROP TABLE public.%I', t);
      END IF;
    END LOOP;
  END IF;
END $$;
