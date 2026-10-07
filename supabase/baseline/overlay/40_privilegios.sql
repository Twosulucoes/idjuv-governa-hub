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
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon;

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

-- ---- funções só da service role (Edge Functions): fecham também para authenticated ----
REVOKE EXECUTE ON FUNCTION public.list_public_tables() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_schema_ddl() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.list_public_tables() TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_schema_ddl() TO service_role;
