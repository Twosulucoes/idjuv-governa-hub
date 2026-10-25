-- Privilégios: `anon` não recebe nada por padrão; só as exceções públicas intencionais.
--
-- Por padrão o Supabase concede ALL em tudo que o postgres cria em public a anon/authenticated/
-- service_role, e funções ficam executáveis por PUBLIC. A RLS protege as tabelas, mas FUNÇÕES
-- SECURITY DEFINER não passam por RLS: no estado atual, 159 funções de public eram executáveis
-- por anon (133 SECURITY DEFINER), entre elas processar_folha_pagamento, fechar_folha,
-- fn_gerar_esocial_s2200 e generate_schema_ddl().
--
-- Este arquivo é idempotente e também serve a um banco já em uso (revisar a lista de exceções
-- antes). authenticated e service_role mantêm os privilégios padrão.

-- ---- tabelas e sequências: anon sem nada ----
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

-- ---- funções: ninguém executa por PUBLIC; anon só as RPCs públicas abaixo ----
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon;

-- ---- objetos futuros herdam o mesmo padrão fechado ----
-- O EXECUTE para PUBLIC é um privilégio padrão GLOBAL do Postgres: `IN SCHEMA` só revoga o que foi
-- concedido por default privileges daquele schema e NÃO o remove. Sem a linha global, uma função
-- criada depois deste arquivo nascia executável por anon (verificado em banco vazio).
ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon;
-- Funções novas ainda nascem executáveis por `authenticated` (padrão do Supabase, usado pelas
-- policies e pelo front). Toda função SECURITY DEFINER nova precisa checar quem chama ou receber
-- REVOKE explícito: scripts/db/testar-rls.sql falha se aparecer uma sem checagem fora da lista revisada.

-- ---- TRUNCATE/TRIGGER/REFERENCES não servem à API: ninguém de fora precisa deles ----
REVOKE TRUNCATE, TRIGGER, REFERENCES ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE TRUNCATE, TRIGGER, REFERENCES ON TABLES FROM anon, authenticated;

-- ---- trilha de auditoria: só acréscimo, por privilégio e por RLS ----
-- (migração 20261006230500; o dump do schema não leva GRANT/REVOKE, então a revogação volta aqui)
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.audit_logs FROM anon, authenticated;

-- ---- exceções públicas intencionais: tabelas ----
-- leitura (portal e formulários públicos); as policies de RLS filtram o conteúdo
GRANT SELECT ON public.config_menu_publico, public.config_paginas_publicas, public.links_uteis,
                public.escolas_jer, public.form_field_config, public.publicacoes_lai TO anon;
-- configuração do cliente (migração 20261011023500): só as colunas públicas, não a autoria nem o motivo
GRANT SELECT (chave, valor, categoria) ON public.dados_oficiais TO anon;
-- escrita (formulários públicos de cadastro); sem SELECT: ver as RPCs abaixo. gestores_escolares saiu na P12
-- (migração 20261017090000): o cadastro público é só pela RPC registrar_gestor_publico
GRANT INSERT ON public.cadastro_arbitros, public.cadastro_arbitros_modalidades,
                public.federacoes_esportivas TO anon;

-- ---- exceções públicas intencionais: RPCs ----
GRANT EXECUTE ON FUNCTION public.registrar_denuncia_publica(boolean, text, text, text, text, text, text, text, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.obter_dado_oficial(text) TO anon;
GRANT EXECUTE ON FUNCTION public.arbitro_cpf_cadastrado(text) TO anon;
GRANT EXECUTE ON FUNCTION public.obter_protocolo_arbitro(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.consultar_gestor_por_cpf(text) TO anon;
GRANT EXECUTE ON FUNCTION public.registrar_gestor_publico(uuid, text, text, text, date, text, text, text) TO anon;
-- Portal da Transparência (migração 20261010200100): só os campos das telas, filtro de LGPD no servidor
GRANT EXECUTE ON FUNCTION public.transparencia_execucao_orcamentaria() TO anon;
GRANT EXECUTE ON FUNCTION public.transparencia_licitacoes(integer, text) TO anon;
GRANT EXECUTE ON FUNCTION public.transparencia_patrimonio() TO anon;
-- Quadro de cargos comissionados (migração 20261010234000): nome do ocupante sim; indicação, CPF e contato nunca
GRANT EXECUTE ON FUNCTION public.transparencia_cargos_publicos() TO anon;

-- ---- funções só da service role (Edge Functions): fecham também para authenticated ----
REVOKE EXECUTE ON FUNCTION public.list_public_tables() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_schema_ddl() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.list_public_tables() TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_schema_ddl() TO service_role;
REVOKE EXECUTE ON FUNCTION public.consumir_cota_uso(uuid, text, integer, integer, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.consumir_cota_uso(uuid, text, integer, integer, text, text) TO service_role;

-- ---- funções de trigger sem uso direto (migração 20261009160000; o dump não leva o REVOKE) ----
REVOKE EXECUTE ON FUNCTION public.fn_fotos_vistoria_inventario_imutavel() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_campanhas_inventario_unidades_autoria() FROM authenticated;

-- ---- patrimônio (migração 20261010230000): o número de tombamento nasce no INSERT do bem ----
REVOKE EXECUTE ON FUNCTION public.gerar_numero_tombamento(uuid) FROM authenticated;

-- ---- privilégios das migrações de 2026-10-09/10 (o dump do schema não leva GRANT/REVOKE) ----
-- Copiados das migrações 20261009120000 (avisos), 20261009150000 (envios), 20261009153000 (importações)
-- e 20261010070000 (folha): funções de trigger sem EXECUTE para authenticated; RPC só da service role;
-- tabelas com escrita restrita e config_envio com privilégios por coluna (segredo_id nunca legível pela API).
REVOKE EXECUTE ON FUNCTION public.fixar_autoria_aviso() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.fixar_autoria_config_envio() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.bloquear_insercao_ficha_fechada() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.bloquear_insercao_item_ficha_fechada() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.folhas_proteger_fechamento() FROM authenticated;
-- triggers de folha fechada que já existiam (o dump não leva o REVOKE; a migração 20261010070000 também o faz)
REVOKE EXECUTE ON FUNCTION public.bloquear_alteracao_ficha_fechada() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.bloquear_alteracao_item_ficha_fechada() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.bloquear_exclusao_ficha_fechada() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.folhas_proteger_exclusao() FROM authenticated;
-- trigger de etapas do abono/fechamento (migração 20261010090000, B2). Guardado por existência: a função só
-- entra em schema/ quando o baseline é regenerado a partir do replay.
DO $$ BEGIN
  IF to_regprocedure('public.validar_etapa_frequencia()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.validar_etapa_frequencia() FROM authenticated;
  END IF;
  -- trigger que protege servidores.cpf (migração 20261010100000), mesma guarda por existência
  IF to_regprocedure('public.servidores_proteger_cpf()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.servidores_proteger_cpf() FROM authenticated;
  END IF;
END $$;
-- ajudantes das policies de storage do RH (migração 20261010210000, B3; definidos no overlay/10): só authenticated
-- executa (as policies os chamam como o usuário; a service role não passa por RLS). O dump não leva o REVOKE.
REVOKE EXECUTE ON FUNCTION public.eh_meu_arquivo_frequencia(text) FROM PUBLIC, anon, service_role;
REVOKE EXECUTE ON FUNCTION public.eh_minha_pasta_servidor(text) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.eh_meu_arquivo_frequencia(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.eh_minha_pasta_servidor(text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.config_envio_servidor(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.config_envio_servidor(text) TO service_role;
-- trilha e autoria do RH (migração 20261011000000, E1; o dump não leva GRANT/REVOKE): funções de apoio e de trigger
-- sem EXECUTE para a API; registrar_evento só para authenticated (a guarda no corpo exige usuário ativo)
REVOKE EXECUTE ON FUNCTION public.trilha_contexto() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trilha_contexto_invalidar() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.responsavel_atual() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rh_exige_servidor_vinculado() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mascarar_parcial(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trilha_mascarar(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trilha_contexto_requisicao() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trilha_completar_contexto() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trilha_imutavel() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fixar_autoria() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.registrar_evento(text, text, uuid, text, jsonb) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.registrar_evento(text, text, uuid, text, jsonb) TO authenticated;
-- trilha dos arquivos do RH no Storage (migração 20261011000200, E2): função de trigger e de apoio fora da API
REVOKE EXECUTE ON FUNCTION public.trilha_storage_chave(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trilha_storage() FROM PUBLIC, anon, authenticated;
-- integridade da remessa CNAB e do eSocial (migração 20261011010000, E3): funções de trigger fora da API;
-- cancelar_remessa só para authenticated (a guarda no corpo exige o módulo rh e financeiro.folha.processar)
REVOKE EXECUTE ON FUNCTION public.exigir_folha_fechada() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.remessa_integridade() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cancelar_remessa(uuid, text) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.cancelar_remessa(uuid, text) TO authenticated;
-- lançamento por setor (migração 20261011020000, fase 1): funções de apoio e de trigger fora da API;
-- meus_fundamentos_lancamento e saneamento_lancamento só para authenticated (a guarda no corpo exige usuário ativo
-- e, no saneamento, admin ou rh.auditoria.visualizar)
REVOKE EXECUTE ON FUNCTION public.data_local() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.lotacao_vigente(uuid, date) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.unidade_e_superiores(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.lancamento_modulos_tabela(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fundamento_lancamento(text[]) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fundamento_tabela(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fundamento_linha(text, text, jsonb, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.lancamento_cache_invalidar() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.exigir_setor() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.exigir_setor_fim() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.regra_lancamento_proteger_exigir() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.comissoes_membros_validar() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.meus_fundamentos_lancamento(public.app_module[]) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.meus_fundamentos_lancamento(public.app_module[]) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.saneamento_lancamento() FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.saneamento_lancamento() TO authenticated;
-- RH de 2026-10-12 (migrações 20261012090000 a 20261012140000; o dump não leva GRANT/REVOKE e o baseline só foi
-- regenerado com elas na migração 20261012150000): funções de apoio e de trigger fora da API; o pré-cadastro público
-- expõe ao anônimo só as quatro RPCs do formulário (guarda: token)
REVOKE EXECUTE ON FUNCTION public.trilha_atribuir_protocolo() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rh_avancar_status_por_data() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.portaria_nomeacao_publicada(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.folha_montar_ficha(uuid, uuid, text, date, date, jsonb, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.afastamento_remunerado(text, text, date) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.viagens_diarias_validar() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.documentos_portaria_validar() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.pre_cadastros_gerar_token() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.pre_cadastro_publico_colunas() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.pre_cadastro_publico_filtrar(jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.pre_cadastro_publico_buscar(text, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pre_cadastro_publico_criar(jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pre_cadastro_publico_obter(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pre_cadastro_publico_salvar(text, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pre_cadastro_publico_enviar(text) TO anon, authenticated;
-- quadro de vagas (migração 20261012150000): funções de trigger fora da API; rh_vaga_situacao e
-- rh_vaga_ocupante_atual (guarda: usuário ativo; sem dado pessoal) e rh_importar_quadro_vagas (INVOKER, guarda:
-- governanca.cargos.gerenciar) seguem executáveis por authenticated
REVOKE EXECUTE ON FUNCTION public.rh_provimento_vaga() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rh_vagas_cargo_validar() FROM PUBLIC, anon, authenticated;
-- portaria pelo SEI (migração 20261012160000): a gravação do DOE na ficha é função de trigger, fora da API
REVOKE EXECUTE ON FUNCTION public.documentos_portaria_ficha() FROM PUBLIC, anon, authenticated;
-- remessas e eventos do eSocial sem DELETE pela API (migração 20261011010100, E3; a RLS também não tem policy de DELETE,
-- classe modulo com excluir=ninguem no rls/mapa.csv): a remessa é cancelada por cancelar_remessa
REVOKE DELETE ON public.remessas_bancarias, public.eventos_esocial FROM anon, authenticated;
REVOKE ALL ON public.avisos_leituras FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.avisos_leituras TO authenticated;
REVOKE ALL ON public.envios_log FROM anon, authenticated;
GRANT SELECT ON public.envios_log TO authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.importacoes FROM authenticated;
-- tabelas do FIPLAN (migração 20261019100000): só leitura pela API; escrita pela RPC importar_classificadores_fiplan
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.fin_classificadores_fiplan FROM authenticated;
-- histórico do FIP 614 (migração 20261027090000): só leitura pela API; escrita pela RPC importar_empenhos_fip614
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.fin_empenho_documentos_fiplan FROM authenticated;
-- financeiro: arquivos bancários, reenvio e extrato do BB (migrações 20261011100000 a 20261011100300). As tabelas só
-- são lidas pela API (escrita pelas RPCs com pagamento.conciliar ou pela service role na Edge Function bb-api);
-- funções de apoio e de trigger fora da API; registrar_extrato_bb só para a service role.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.fin_movimentos_bancarios, public.fin_remessas_bancarias,
                                           public.fin_extrato_lancamentos FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.fin_alteracoes_proteger_situacao_fiplan() FROM PUBLIC, anon, authenticated;
-- baixa do pagamento só pelo banco e exclusão de alteração confirmada (migração 20261011100400): triggers fora da API
REVOKE EXECUTE ON FUNCTION public.fin_pagamentos_proteger_baixa() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fin_alteracoes_bloquear_exclusao_confirmada() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fin_casar_movimento_pagamento(text, text, numeric, date) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fin_marcar_pagamento_pago(uuid, date) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fin_remessa_bancaria_json(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.registrar_extrato_bb(uuid, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_extrato_bb(uuid, jsonb) TO service_role;
REVOKE ALL ON public.config_envio FROM anon, authenticated;
GRANT SELECT (
  canal, ativo, provedor, remetente_nome, remetente_email, responder_para,
  smtp_host, smtp_porta, smtp_seguranca, smtp_usuario,
  marca_nome, marca_logo_url, marca_cor, rodape,
  wa_phone_number_id, wa_business_account_id, wa_templates,
  segredo_atualizado_em, updated_by, created_at, updated_at
) ON public.config_envio TO authenticated;
GRANT INSERT (
  canal, ativo, provedor, remetente_nome, remetente_email, responder_para,
  smtp_host, smtp_porta, smtp_seguranca, smtp_usuario,
  marca_nome, marca_logo_url, marca_cor, rodape,
  wa_phone_number_id, wa_business_account_id, wa_templates
) ON public.config_envio TO authenticated;
GRANT UPDATE (
  ativo, provedor, remetente_nome, remetente_email, responder_para,
  smtp_host, smtp_porta, smtp_seguranca, smtp_usuario,
  marca_nome, marca_logo_url, marca_cor, rodape,
  wa_phone_number_id, wa_business_account_id, wa_templates
) ON public.config_envio TO authenticated;

-- ---- funções que ESCREVEM e não são chamadas por usuário logado ----
-- fn_atualizar_situacao_servidor só é chamada por triggers SECURITY DEFINER. processar_folha_pagamento
-- saiu desta lista na migração 20261010070000: ganhou guarda has_permission_code('financeiro.folha.processar')
-- no corpo e EXECUTE para authenticated (o front chama a RPC no botão Processar).
DO $$
DECLARE f record;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS assinatura
    FROM pg_proc p
    WHERE p.pronamespace = 'public'::regnamespace
      AND p.proname IN ('fn_atualizar_situacao_servidor')
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM authenticated', f.assinatura);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f.assinatura);
  END LOOP;
END $$;

-- ---- workflow ----
-- modelos de fluxo do workflow (migração 20261013100000): anon sem nada nas três tabelas; fn_somar_dias_uteis só
-- para authenticated
REVOKE ALL ON public.processo_modelos, public.processo_modelo_etapas, public.processo_modelo_checklist FROM anon;
REVOKE EXECUTE ON FUNCTION public.fn_somar_dias_uteis(date, integer) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.fn_somar_dias_uteis(date, integer) TO authenticated;
-- sigilo do workflow (migração 20261013100100): anon sem nada nas respostas do checklist; wf_pode_ver_processo é
-- chamada pelas policies das tabelas do processo, então authenticated executa; a função do trigger que recusa apagar
-- etapa em uso ninguém executa pela API
REVOKE ALL ON public.processo_checklist_respostas FROM anon;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.processo_checklist_respostas FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.wf_pode_ver_processo(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.wf_pode_ver_processo(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.wf_recusar_etapa_em_uso() FROM PUBLIC, anon, authenticated, service_role;
-- RPCs do acompanhamento (migração 20261013100200): as internas (resolver unidade, travar processo, pendências,
-- número SEI, movimentação) ninguém executa pela API; as RPCs e o semáforo só authenticated; a view só SELECT para
-- authenticated
REVOKE EXECUTE ON FUNCTION public.wf_resolver_unidade(text, uuid) FROM PUBLIC, anon, authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.wf_travar_processo(uuid, boolean) FROM PUBLIC, anon, authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.wf_exigir_em_andamento(public.status_processo_administrativo) FROM PUBLIC, anon, authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.wf_pendencias(uuid, uuid, integer, integer) FROM PUBLIC, anon, authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.wf_preparar_numero_sei(text, uuid) FROM PUBLIC, anon, authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.wf_registrar_movimentacao(uuid, public.tipo_movimentacao_processo, text, text, uuid, uuid, integer, integer, integer, date) FROM PUBLIC, anon, authenticated, service_role;
DO $$
DECLARE f text;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'public.wf_abrir_processo(text, text, text, text, text, text, public.nivel_sigilo_processo, text)',
    'public.wf_marcar_item(uuid, text, boolean, text)',
    'public.wf_avancar_etapa(uuid, integer, text)',
    'public.wf_devolver_etapa(uuid, integer, integer, text)',
    'public.wf_suspender(uuid, text)',
    'public.wf_reativar(uuid, text)',
    'public.wf_concluir(uuid, text)',
    'public.wf_arquivar(uuid, text)',
    'public.wf_atualizar_numero_sei(uuid, text)',
    'public.wf_conceder_acesso(uuid, uuid, text, text)',
    'public.wf_revogar_acesso(uuid, uuid)',
    'public.wf_listar_credenciais(uuid)',
    'public.wf_listar_usuarios_ativos()',
    'public.fn_situacao_prazo(date)'] LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, service_role', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', f);
  END LOOP;
END $$;
REVOKE ALL ON public.v_processos_acompanhamento FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.v_processos_acompanhamento TO authenticated;

-- ---- P12 (migração 20261017090000): limite por IP dos formulários e consultas públicas ----
-- A tabela das tentativas não é da API (RLS sem policy e sem privilégio); as duas funções só rodam por dentro
-- das RPCs públicas e do trigger trg_limite_publico.
REVOKE ALL ON TABLE public.limite_requisicoes_publicas FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.limite_publico_consumir(text, integer, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.limite_publico_insercao() FROM PUBLIC, anon, authenticated;
REVOKE INSERT ON public.gestores_escolares FROM anon;

-- ---- folha (migração 20261019200000): IRRF mensal só por dentro de folha_montar_ficha ----
REVOKE EXECUTE ON FUNCTION public.calcular_irrf_mensal(numeric, numeric, date) FROM PUBLIC, anon, authenticated;

-- ---- folha (migração 20261020100000): atos remuneratórios ----
-- triggers só por dentro; aplicar_ato_remuneratorio só para authenticated (a guarda no corpo exige o módulo rh e
-- financeiro.folha.configurar); vencimento_cargo_em roda como quem chama (RLS de cargo_vencimentos vale)
REVOKE EXECUTE ON FUNCTION public.ato_remuneratorio_integridade() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ato_remuneratorio_item_integridade() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cargo_vencimento_pelo_cadastro() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.aplicar_ato_remuneratorio(uuid) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.aplicar_ato_remuneratorio(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.vencimento_cargo_em(uuid, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vencimento_cargo_em(uuid, date) TO authenticated;

-- ---- folha (migração 20261021090000): retorno do banco da remessa ----
-- só para authenticated (a guarda no corpo exige o módulo rh e financeiro.folha.processar)
REVOKE EXECUTE ON FUNCTION public.registrar_retorno_remessa(uuid, jsonb, jsonb) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.registrar_retorno_remessa(uuid, jsonb, jsonb) TO authenticated;

-- ---- folha (migração 20261022090000): importação da folha histórica do SIGRH ----
-- só para authenticated (a guarda no corpo exige o módulo rh, financeiro.folha.processar e poder fechar a folha)
REVOKE ALL ON FUNCTION public.importar_folha_sigrh(jsonb, jsonb, jsonb, boolean) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.importar_folha_sigrh(jsonb, jsonb, jsonb, boolean) TO authenticated;

-- ---- patrimônio (migração 20261023100000, P14 entrega 4): funções de trigger só por dentro ----
-- fn_atualizar_estatisticas_campanha virou SECURITY DEFINER (o coletor não altera campanhas_inventario) e
-- fn_bens_proteger_colunas guarda valor, data e forma de aquisição e situação do bem
REVOKE EXECUTE ON FUNCTION public.fn_atualizar_estatisticas_campanha() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_bens_proteger_colunas() FROM PUBLIC, anon, authenticated;

-- ---- financeiro (migração 20261026090000): conciliação mensal ----
-- trigger só por dentro; as RPCs só para authenticated (salvar e fechar rodam como quem chama: a RLS vale)
REVOKE EXECUTE ON FUNCTION public.fin_conciliacao_proteger() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fin_conciliacao_conferir_anteriores(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fin_conciliacao_conferir_anteriores(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.salvar_conciliacao_mensal(uuid, date, jsonb, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.salvar_conciliacao_mensal(uuid, date, jsonb, jsonb) TO authenticated;
REVOKE ALL ON FUNCTION public.fechar_conciliacao_mensal(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fechar_conciliacao_mensal(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.reabrir_conciliacao_mensal(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reabrir_conciliacao_mensal(uuid, text) TO authenticated;

-- ---- Compras: PCA (migração 20261028090000): gatilhos sem EXECUTE para a API ----
REVOKE EXECUTE ON FUNCTION public.pca_carimbar() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.pca_registrar_historico() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.pca_classificadores(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pca_classificadores(integer) TO authenticated;
REVOKE ALL ON FUNCTION public.pca_usar_qdd(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pca_usar_qdd(uuid) TO authenticated;

-- ---- Compras: processos de contratação (migração 20261029090000): gatilhos sem EXECUTE para a API ----
REVOKE EXECUTE ON FUNCTION public.processo_licitatorio_normalizar() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.processo_andamento_no_processo() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.processo_andamento_carimbar() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.processo_empenhos(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.processo_empenhos(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.importar_processos_planilha(jsonb, jsonb, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.importar_processos_planilha(jsonb, jsonb, boolean) TO authenticated;

-- ---- Contratos: passagens aéreas (migração 20261031090000): gatilhos sem EXECUTE para a API ----
REVOKE EXECUTE ON FUNCTION public.passagem_carimbar() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.passagem_copiar_nome() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.passagem_proteger_emitido() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.passagem_registrar_historico() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.passagem_propagar_nome_beneficiario() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.passagem_buscar_servidores(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.passagem_buscar_servidores(text) TO authenticated;
REVOKE ALL ON FUNCTION public.passagem_viagens_servidor(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.passagem_viagens_servidor(uuid) TO authenticated;
