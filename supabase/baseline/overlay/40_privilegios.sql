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
-- escrita (formulários públicos de cadastro); sem SELECT: ver as RPCs abaixo
GRANT INSERT ON public.cadastro_arbitros, public.cadastro_arbitros_modalidades,
                public.federacoes_esportivas, public.gestores_escolares TO anon;

-- ---- exceções públicas intencionais: RPCs ----
GRANT EXECUTE ON FUNCTION public.registrar_denuncia_publica(boolean, text, text, text, text, text, text, text, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.obter_dado_oficial(text) TO anon;
GRANT EXECUTE ON FUNCTION public.arbitro_cpf_cadastrado(text) TO anon;
GRANT EXECUTE ON FUNCTION public.obter_protocolo_arbitro(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.consultar_gestor_por_cpf(text) TO anon;
GRANT EXECUTE ON FUNCTION public.registrar_gestor_publico(uuid, text, text, text, date, text, text, text) TO anon;

-- ---- funções só da service role (Edge Functions): fecham também para authenticated ----
REVOKE EXECUTE ON FUNCTION public.list_public_tables() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_schema_ddl() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.list_public_tables() TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_schema_ddl() TO service_role;

-- ---- funções de trigger sem uso direto (migração 20261009160000; o dump não leva o REVOKE) ----
REVOKE EXECUTE ON FUNCTION public.fn_fotos_vistoria_inventario_imutavel() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_campanhas_inventario_unidades_autoria() FROM authenticated;

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
END $$;
REVOKE EXECUTE ON FUNCTION public.config_envio_servidor(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.config_envio_servidor(text) TO service_role;
REVOKE ALL ON public.avisos_leituras FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.avisos_leituras TO authenticated;
REVOKE ALL ON public.envios_log FROM anon, authenticated;
GRANT SELECT ON public.envios_log TO authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.importacoes FROM authenticated;
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
