-- ============================================================================
-- Onda 0 — correções urgentes de permissão no banco montado pelas migrações
-- ============================================================================
-- Revisão de autenticação e permissões de 10/10/2026. Os quatro furos abaixo existem no estado que
-- supabase/migrations/ produz (provados num replay das 255 migrações em Postgres 16 com o shim do
-- Supabase) e já estavam fechados no baseline (supabase/baseline/). Esta migração leva ao histórico
-- as mesmas correções do baseline, como a 20261010080000 fez para profiles/user_roles/user_modules.
--
-- 1) Injeção de SQL sem login (crítico). fn_gerar_numero_financeiro é SECURITY DEFINER, executável
--    por `anon`, e montava o nome da tabela com format('... fin_%ss ...', p_tipo). Prova: um visitante
--    sem login extraía nome e CPF de public.servidores pela mensagem de erro do cast. Agora p_tipo
--    precisa estar numa lista fechada que mapeia para o nome real da tabela (cópia de
--    baseline/overlay/18_funcoes_rpc.sql). Efeito colateral bom: 'solicitacao' e 'alteracao' geravam
--    fin_solicitacaos/fin_alteracaos, que não existem.
--
-- 2) Autoconcessão de permissão pelo catálogo (crítico, não coberto pela 20261010080000).
--    module_permissions_catalog, module_settings, module_access_scopes e user_org_units tinham
--    acesso_total_* (qualquer logado escreve). role_permissions.permission e
--    user_permissions.permission têm FK ON UPDATE CASCADE para o catálogo: renomear no catálogo um
--    código que o próprio papel já tem reescrevia role_permissions. Prova: usuário comum passou a ter
--    integridade.gerenciar (denúncias) e admin.envios.configurar. Agora as quatro tabelas ficam como no
--    baseline (classes catalogo_admin, admin e proprio_user do rls/mapa.csv): escrita só do papel admin.
--
-- 3) Dados pessoais de formulários públicos (alto).
--    gestores_escolares: leitura PÚBLICA (anon) de CPF, RG, nascimento, e-mail, celular e endereço de
--    todos os gestores, e UPDATE/DELETE por qualquer logado. cadastro_arbitros(+_modalidades): qualquer
--    logado lia, editava e apagava CPF, RG, PIS e conta bancária. Agora a gestão exige o módulo dono
--    (gestores_escolares / arbitros) e o formulário público só INSERE. A consulta pública por CPF passa
--    pelas RPCs consultar_gestor_por_cpf e registrar_gestor_publico do baseline, que devolvem só id,
--    nome, status e escola; o front (src/hooks/useGestoresEscolares.ts) já usa as RPCs quando existem.
--
-- 4) Funções de acesso "logado = autorizado" (alto). usuario_eh_super_admin, is_active_user(),
--    has_role(app_role), has_module(app_module) e can_access_module(app_module) eram
--    `SELECT auth.uid() IS NOT NULL`; usuario_tem_permissao(_financeira) liam tabelas removidas em
--    20260207182933 (a financeira caía no stub de super admin: TRUE para qualquer logado). Passam a
--    seguir o modelo vigente (cópia de baseline/overlay/10_funcoes_acesso.sql). is_active_user(uuid)
--    devolvia TRUE para perfil inexistente (cópia do M6 do overlay 18).
--    NÃO muda aqui: is_admin_user e has_permission_code continuam sem exigir perfil ativo (o baseline
--    exige). Fica para a onda de bloqueio de conta, para não trancar um administrador sem querer.
--
-- 5) EXECUTE de `anon` (alto). 159 funções de public eram executáveis por visitante sem login,
--    incluindo SECURITY DEFINER que escrevem (processar_folha_pagamento, fechar_folha). `anon` passa a
--    executar só as RPCs dos formulários públicos. `authenticated` e `service_role` mantêm exatamente o
--    que tinham (concessão explícita antes de tirar o PUBLIC). Tabelas de `anon` NÃO mudam aqui: o
--    portal público lê várias delas; isso fica para a onda que troca as acesso_total restantes.
--
-- Num banco montado pelo baseline esta migração é praticamente no-op. Idempotente; não toca dado.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) fn_gerar_numero_financeiro com lista fechada
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_gerar_numero_financeiro(
  p_tipo character varying,
  p_exercicio integer DEFAULT (EXTRACT(year FROM CURRENT_DATE))::integer
) RETURNS character varying
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
$$;

-- ---------------------------------------------------------------------------
-- 4) Funções de acesso no modelo vigente (papel em user_roles, módulo em user_modules,
--    permissão granular por has_permission_code)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.usuario_eh_super_admin(check_user_id uuid DEFAULT NULL)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_admin_user(COALESCE(check_user_id, auth.uid()));
$$;

CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT is_active FROM public.profiles WHERE id = auth.uid()), false);
$$;

CREATE OR REPLACE FUNCTION public.is_active_user(p_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT is_active FROM public.profiles WHERE id = p_user_id), false);
$$;

CREATE OR REPLACE FUNCTION public.has_role(_role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.has_module(_module public.app_module)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_module(auth.uid(), _module::text);
$$;

CREATE OR REPLACE FUNCTION public.can_access_module(_module public.app_module)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.can_access_module(auth.uid(), _module::text);
$$;

CREATE OR REPLACE FUNCTION public.usuario_tem_permissao(_user_id uuid, _codigo_funcao text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_permission_code(_user_id, _codigo_funcao);
$$;

CREATE OR REPLACE FUNCTION public.usuario_tem_permissao_financeira(p_user_id uuid, p_permissao character varying)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_permission_code(p_user_id, p_permissao::text);
$$;

-- ---------------------------------------------------------------------------
-- 2) Catálogo de permissões, configuração de módulos, escopos e unidades do usuário
--    (policies literais de supabase/baseline/rls/35_policies_geradas.sql)
-- ---------------------------------------------------------------------------
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('module_permissions_catalog', 'module_settings', 'module_access_scopes', 'user_org_units')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

ALTER TABLE public.module_permissions_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_access_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_org_units ENABLE ROW LEVEL SECURITY;

-- module_permissions_catalog  [catalogo_admin]: o AuthContext lê no login de todo usuário ativo
CREATE POLICY "rls_select" ON public.module_permissions_catalog FOR SELECT TO authenticated
  USING (public.is_active_user());
CREATE POLICY "rls_insert" ON public.module_permissions_catalog FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
CREATE POLICY "rls_update" ON public.module_permissions_catalog FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
CREATE POLICY "rls_delete" ON public.module_permissions_catalog FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- module_settings  [catalogo_admin]: menu lateral e módulos habilitados
CREATE POLICY "rls_select" ON public.module_settings FOR SELECT TO authenticated
  USING (public.is_active_user());
CREATE POLICY "rls_insert" ON public.module_settings FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
CREATE POLICY "rls_update" ON public.module_settings FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
CREATE POLICY "rls_delete" ON public.module_settings FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- module_access_scopes  [admin]
CREATE POLICY "rls_select" ON public.module_access_scopes FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()));
CREATE POLICY "rls_insert" ON public.module_access_scopes FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
CREATE POLICY "rls_update" ON public.module_access_scopes FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
CREATE POLICY "rls_delete" ON public.module_access_scopes FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- user_org_units  [proprio_user]: cada usuário ativo lê as suas; só admin escreve
CREATE POLICY "rls_select" ON public.user_org_units FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()) OR (user_id = auth.uid() AND public.is_active_user()));
CREATE POLICY "rls_insert" ON public.user_org_units FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
CREATE POLICY "rls_update" ON public.user_org_units FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
CREATE POLICY "rls_delete" ON public.user_org_units FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- ---------------------------------------------------------------------------
-- 3) Formulários públicos: gestores escolares e árbitros
-- ---------------------------------------------------------------------------
-- RPCs públicas do formulário de gestores (cópia de baseline/overlay/18_funcoes_rpc.sql, item I5)
CREATE OR REPLACE FUNCTION public.consultar_gestor_por_cpf(p_cpf text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
           'id', g.id, 'nome', g.nome, 'status', g.status,
           'escola', jsonb_build_object('id', e.id, 'nome', e.nome))
  FROM public.gestores_escolares g
  LEFT JOIN public.escolas_jer e ON e.id = g.escola_id
  WHERE length(regexp_replace(coalesce(p_cpf, ''), '\D', '', 'g')) = 11
    AND regexp_replace(coalesce(g.cpf, ''), '\D', '', 'g') = regexp_replace(p_cpf, '\D', '', 'g')
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.registrar_gestor_publico(
  p_escola_id uuid, p_nome text, p_cpf text, p_rg text, p_data_nascimento date,
  p_email text, p_celular text, p_endereco text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

-- gestores_escolares  [modulo: gestores_escolares]; fica o INSERT público (insercao_publica_gestores)
DROP POLICY IF EXISTS "leitura_publica_gestores" ON public.gestores_escolares;
DROP POLICY IF EXISTS "admin_update_gestores" ON public.gestores_escolares;
DROP POLICY IF EXISTS "admin_delete_gestores" ON public.gestores_escolares;
DROP POLICY IF EXISTS "acesso_total_select" ON public.gestores_escolares;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.gestores_escolares;
DROP POLICY IF EXISTS "acesso_total_update" ON public.gestores_escolares;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.gestores_escolares;
DROP POLICY IF EXISTS "rls_select" ON public.gestores_escolares;
DROP POLICY IF EXISTS "rls_insert" ON public.gestores_escolares;
DROP POLICY IF EXISTS "rls_update" ON public.gestores_escolares;
DROP POLICY IF EXISTS "rls_delete" ON public.gestores_escolares;
ALTER TABLE public.gestores_escolares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rls_select" ON public.gestores_escolares FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gestores_escolares')));
CREATE POLICY "rls_insert" ON public.gestores_escolares FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'gestores_escolares')));
CREATE POLICY "rls_update" ON public.gestores_escolares FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gestores_escolares')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'gestores_escolares')));
CREATE POLICY "rls_delete" ON public.gestores_escolares FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gestores_escolares')));

-- O formulário público só cria pré-cadastro "aguardando" (antes o anon escolhia o status no INSERT direto).
DROP POLICY IF EXISTS "insercao_publica_gestores" ON public.gestores_escolares;
CREATE POLICY "insercao_publica_gestores" ON public.gestores_escolares FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'aguardando');

-- gestores_escolares_historico  [trilha]: o módulo lê; ninguém escreve por API (o trigger
-- tr_audit_gestores_escolares é SECURITY DEFINER e grava sem passar pela RLS)
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies
           WHERE schemaname = 'public' AND tablename = 'gestores_escolares_historico'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.gestores_escolares_historico', r.policyname);
  END LOOP;
END $$;
ALTER TABLE public.gestores_escolares_historico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rls_select" ON public.gestores_escolares_historico FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gestores_escolares')));

-- escolas_jer  [modulo: gestores_escolares]; fica a leitura pública (leitura_publica_escolas: o
-- formulário lista as escolas)
DROP POLICY IF EXISTS "acesso_total_select" ON public.escolas_jer;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.escolas_jer;
DROP POLICY IF EXISTS "acesso_total_update" ON public.escolas_jer;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.escolas_jer;
DROP POLICY IF EXISTS "rls_select" ON public.escolas_jer;
DROP POLICY IF EXISTS "rls_insert" ON public.escolas_jer;
DROP POLICY IF EXISTS "rls_update" ON public.escolas_jer;
DROP POLICY IF EXISTS "rls_delete" ON public.escolas_jer;
ALTER TABLE public.escolas_jer ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rls_select" ON public.escolas_jer FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gestores_escolares')));
CREATE POLICY "rls_insert" ON public.escolas_jer FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'gestores_escolares')));
CREATE POLICY "rls_update" ON public.escolas_jer FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gestores_escolares')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'gestores_escolares')));
CREATE POLICY "rls_delete" ON public.escolas_jer FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gestores_escolares')));

-- cadastro_arbitros  [modulo: arbitros]; fica o INSERT público do formulário
DROP POLICY IF EXISTS "authenticated_read_arbitros" ON public.cadastro_arbitros;
DROP POLICY IF EXISTS "authenticated_update_arbitros" ON public.cadastro_arbitros;
DROP POLICY IF EXISTS "authenticated_delete_arbitros" ON public.cadastro_arbitros;
DROP POLICY IF EXISTS "acesso_total_select" ON public.cadastro_arbitros;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.cadastro_arbitros;
DROP POLICY IF EXISTS "acesso_total_update" ON public.cadastro_arbitros;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.cadastro_arbitros;
DROP POLICY IF EXISTS "rls_select" ON public.cadastro_arbitros;
DROP POLICY IF EXISTS "rls_insert" ON public.cadastro_arbitros;
DROP POLICY IF EXISTS "rls_update" ON public.cadastro_arbitros;
DROP POLICY IF EXISTS "rls_delete" ON public.cadastro_arbitros;
ALTER TABLE public.cadastro_arbitros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rls_select" ON public.cadastro_arbitros FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'arbitros')));
CREATE POLICY "rls_insert" ON public.cadastro_arbitros FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'arbitros')));
CREATE POLICY "rls_update" ON public.cadastro_arbitros FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'arbitros')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'arbitros')));
CREATE POLICY "rls_delete" ON public.cadastro_arbitros FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'arbitros')));

-- cadastro_arbitros_modalidades  [modulo: arbitros]; fica o INSERT público do formulário
DROP POLICY IF EXISTS "arbitros_modalidades_select_authenticated" ON public.cadastro_arbitros_modalidades;
DROP POLICY IF EXISTS "Admin pode deletar modalidades" ON public.cadastro_arbitros_modalidades;
DROP POLICY IF EXISTS "Admin pode atualizar modalidades" ON public.cadastro_arbitros_modalidades;
DROP POLICY IF EXISTS "acesso_total_select" ON public.cadastro_arbitros_modalidades;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.cadastro_arbitros_modalidades;
DROP POLICY IF EXISTS "acesso_total_update" ON public.cadastro_arbitros_modalidades;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.cadastro_arbitros_modalidades;
DROP POLICY IF EXISTS "rls_select" ON public.cadastro_arbitros_modalidades;
DROP POLICY IF EXISTS "rls_insert" ON public.cadastro_arbitros_modalidades;
DROP POLICY IF EXISTS "rls_update" ON public.cadastro_arbitros_modalidades;
DROP POLICY IF EXISTS "rls_delete" ON public.cadastro_arbitros_modalidades;
ALTER TABLE public.cadastro_arbitros_modalidades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rls_select" ON public.cadastro_arbitros_modalidades FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'arbitros')));
CREATE POLICY "rls_insert" ON public.cadastro_arbitros_modalidades FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'arbitros')));
CREATE POLICY "rls_update" ON public.cadastro_arbitros_modalidades FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'arbitros')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'arbitros')));
CREATE POLICY "rls_delete" ON public.cadastro_arbitros_modalidades FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'arbitros')));

-- ---------------------------------------------------------------------------
-- 5) EXECUTE: `anon` só nas RPCs públicas; authenticated/service_role sem mudança
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  f record;
  -- RPCs chamadas por páginas públicas (formulários de árbitros, gestores, denúncia e mini-currículo)
  -- e a leitura de dado oficial do portal (mesma lista de baseline/overlay/40_privilegios.sql).
  publicas text[] := ARRAY[
    'registrar_denuncia_publica', 'obter_dado_oficial', 'arbitro_cpf_cadastrado',
    'obter_protocolo_arbitro', 'consultar_gestor_por_cpf', 'registrar_gestor_publico',
    'gerar_codigo_pre_cadastro'
  ];
BEGIN
  FOR f IN
    SELECT p.oid, p.oid::regprocedure AS assinatura, p.proname,
           has_function_privilege('authenticated', p.oid, 'EXECUTE') AS autenticado,
           has_function_privilege('service_role', p.oid, 'EXECUTE') AS servico
    FROM pg_proc p
    WHERE p.pronamespace = 'public'::regnamespace
      AND p.prokind = 'f'
  LOOP
    -- quem tinha EXECUTE (talvez só via PUBLIC) passa a tê-lo de forma explícita
    IF f.autenticado THEN EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', f.assinatura); END IF;
    IF f.servico THEN EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f.assinatura); END IF;

    IF f.proname = ANY (publicas) THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon', f.assinatura);
    ELSE
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', f.assinatura);
    END IF;
  END LOOP;
END $$;

-- Funções criadas depois nascem sem EXECUTE para anon/PUBLIC, mas executáveis por quem já usava.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
