-- ============================================================================
-- S0 — Identidade: profiles, user_roles e user_modules iguais ao baseline
-- ============================================================================
-- Furo (banco montado SÓ pelas migrações de supabase/migrations/, sem o baseline):
--   a migração 20260220132907 criou em profiles, user_roles e user_modules as policies
--   acesso_total_select|insert|update|delete com `auth.uid() IS NOT NULL`. Policies permissivas
--   se somam por OR, então elas anulavam as policies de administrador que existiam ao lado.
--
-- Prova (cópia do replay das migrações, Postgres 16, usuário comum logado como `authenticated`):
--   INSERT INTO user_roles (user_id, role) VALUES (auth.uid(), 'admin');   -- passava
--   INSERT INTO user_modules (user_id, module) VALUES (auth.uid(), 'rh');  -- passava
--   => is_admin_user(auth.uid()) = true: qualquer logado virava administrador.
--   Também trocava o próprio profiles.servidor_id / is_active e lia os perfis de todos.
--   No banco do baseline (overlay/12_protecao_profiles.sql + rls/35_policies_geradas.sql) os
--   mesmos comandos dão "new row violates row-level security policy".
--
-- Esta migração deixa as três tabelas exatamente como no baseline:
--   profiles      -> trigger profiles_proteger_colunas + 4 policies (cópia de
--                    supabase/baseline/overlay/12_protecao_profiles.sql);
--   user_roles,
--   user_modules  -> classe proprio_user do mapa (rls_select|insert|update|delete; cópia literal de
--                    supabase/baseline/rls/35_policies_geradas.sql): cada usuário ativo lê as
--                    próprias linhas, admin lê todas, só admin escreve;
--   privilégios   -> anon sem nada; authenticated sem TRUNCATE/TRIGGER/REFERENCES; a função de
--                    trigger sem EXECUTE para PUBLIC/anon (como supabase/baseline/overlay/40_privilegios.sql).
--
-- Num banco montado pelo baseline a migração é praticamente no-op: derruba e recria as mesmas
-- policies, recria a mesma função/trigger e repete os mesmos REVOKE. Idempotente; não toca dado.
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_modules ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 1. Policies acesso_total_* (qualquer logado) saem das três tabelas
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "acesso_total_select" ON public.profiles;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.profiles;
DROP POLICY IF EXISTS "acesso_total_update" ON public.profiles;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.profiles;
DROP POLICY IF EXISTS "acesso_total_select" ON public.user_roles;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.user_roles;
DROP POLICY IF EXISTS "acesso_total_update" ON public.user_roles;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.user_roles;
DROP POLICY IF EXISTS "acesso_total_select" ON public.user_modules;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.user_modules;
DROP POLICY IF EXISTS "acesso_total_update" ON public.user_modules;
DROP POLICY IF EXISTS "acesso_total_delete" ON public.user_modules;

-- ---------------------------------------------------------------------------
-- 2. profiles (cópia de supabase/baseline/overlay/12_protecao_profiles.sql)
-- ---------------------------------------------------------------------------
-- Quem age como `authenticated`/`anon` e não é admin não muda as colunas de identidade, vínculo e
-- bloqueio. Funções SECURITY DEFINER (donas: postgres), a service role (Edge Functions) e
-- administradores passam. Um usuário comum ainda edita na própria linha: full_name, avatar_url,
-- requires_password_change e updated_at.
CREATE OR REPLACE FUNCTION public.profiles_proteger_colunas()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
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

-- Mesmo ACL do baseline (overlay/40_privilegios.sql: ninguém executa por PUBLIC nem por anon).
REVOKE EXECUTE ON FUNCTION public.profiles_proteger_colunas() FROM PUBLIC, anon;

DROP TRIGGER IF EXISTS profiles_proteger_colunas ON public.profiles;
CREATE TRIGGER profiles_proteger_colunas
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_proteger_colunas();

-- Policies: nomes antigos (duplicados) saem; ficam quatro.
DO $$
DECLARE nome text;
BEGIN
  FOREACH nome IN ARRAY ARRAY[
    'del_profiles_admin', 'ins_profiles_admin', 'profiles_insert_system', 'profiles_select_own',
    'profiles_update_own', 'sel_profiles_own_or_admin', 'upd_profiles_own_or_admin',
    'profiles_select', 'profiles_insert', 'profiles_update', 'profiles_delete'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', nome);
  END LOOP;
END $$;

CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin_user(auth.uid()));
CREATE POLICY profiles_insert ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
CREATE POLICY profiles_update ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin_user(auth.uid()))
  WITH CHECK (id = auth.uid() OR public.is_admin_user(auth.uid()));
CREATE POLICY profiles_delete ON public.profiles FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- ---------------------------------------------------------------------------
-- 3. user_modules e user_roles (cópia literal de supabase/baseline/rls/35_policies_geradas.sql)
-- ---------------------------------------------------------------------------
-- user_modules  [proprio_user]
DROP POLICY IF EXISTS "del_user_modules_admin" ON public.user_modules;
DROP POLICY IF EXISTS "ins_user_modules_admin" ON public.user_modules;
DROP POLICY IF EXISTS "sel_user_modules_own_or_admin" ON public.user_modules;
DROP POLICY IF EXISTS "upd_user_modules_admin" ON public.user_modules;
DROP POLICY IF EXISTS "user_modules_delete" ON public.user_modules;
DROP POLICY IF EXISTS "user_modules_insert" ON public.user_modules;
DROP POLICY IF EXISTS "user_modules_select" ON public.user_modules;
DROP POLICY IF EXISTS "user_modules_update" ON public.user_modules;
DROP POLICY IF EXISTS "rls_select" ON public.user_modules;
CREATE POLICY "rls_select" ON public.user_modules FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()) OR (user_id = auth.uid() AND public.is_active_user()));
DROP POLICY IF EXISTS "rls_insert" ON public.user_modules;
CREATE POLICY "rls_insert" ON public.user_modules FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.user_modules;
CREATE POLICY "rls_update" ON public.user_modules FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.user_modules;
CREATE POLICY "rls_delete" ON public.user_modules FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- user_roles  [proprio_user]
DROP POLICY IF EXISTS "del_user_roles_admin" ON public.user_roles;
DROP POLICY IF EXISTS "ins_user_roles_admin" ON public.user_roles;
DROP POLICY IF EXISTS "sel_user_roles_own_or_admin" ON public.user_roles;
DROP POLICY IF EXISTS "upd_user_roles_admin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update" ON public.user_roles;
DROP POLICY IF EXISTS "rls_select" ON public.user_roles;
CREATE POLICY "rls_select" ON public.user_roles FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()) OR (user_id = auth.uid() AND public.is_active_user()));
DROP POLICY IF EXISTS "rls_insert" ON public.user_roles;
CREATE POLICY "rls_insert" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.user_roles;
CREATE POLICY "rls_update" ON public.user_roles FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.user_roles;
CREATE POLICY "rls_delete" ON public.user_roles FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- ---------------------------------------------------------------------------
-- 4. Privilégios (os mesmos que overlay/40_privilegios.sql deixa no baseline)
-- ---------------------------------------------------------------------------
REVOKE ALL ON public.profiles, public.user_roles, public.user_modules FROM anon;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.profiles, public.user_roles, public.user_modules FROM authenticated;
