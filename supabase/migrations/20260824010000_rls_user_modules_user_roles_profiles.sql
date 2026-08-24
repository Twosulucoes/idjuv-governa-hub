-- ============================================================================
-- RLS — user_modules, user_roles, profiles (item C2 da auditoria de usuários)
-- ============================================================================
-- Origem: docs/AUDITORIA_USUARIOS.md (achado C2) e docs/RLS_USUARIOS_PROPOSTA.sql
-- (proposta já revisada). A gestão de módulos no front (useAdminRBAC /
-- useAdminUsuarios) grava DIRETO nestas tabelas pelo client — a única
-- barreira real é o RLS. Sem policy de escrita restrita a admin, um usuário
-- comum poderia se conceder o módulo "admin".
--
-- ⚠️ LIMITAÇÃO DESTA MIGRAÇÃO — leia antes de assumir o item C2 como fechado:
-- esta sessão não tinha acesso ao projeto Supabase real do IDJUV para rodar
-- a introspecção (SEÇÃO 0 do arquivo de proposta) nem `get_advisors`. As
-- policies abaixo são ADITIVAS (criadas com nomes novos). O Postgres combina
-- policies do mesmo comando com OR — se já existir uma policy antiga
-- permissiva (ex.: "allow all" / USING(true)) para INSERT/UPDATE/DELETE
-- nestas tabelas, ela CONTINUA valendo e esta migração não a revoga
-- sozinha. É obrigatório, após aplicar:
--   1. Rodar Database → Advisors (security) no painel do Supabase, ou a
--      query de introspecção da SEÇÃO 0.1 de docs/RLS_USUARIOS_PROPOSTA.sql;
--   2. Remover explicitamente qualquer policy legada permissiva encontrada
--      (por nome, com DROP POLICY) nas tabelas user_modules/user_roles/profiles;
--   3. Validar login + tela de gestão de usuários (/admin/usuarios) antes de
--      considerar o item C2 fechado.
-- ============================================================================

-- ============================================================================
-- SEÇÃO 1 — HELPER "é admin?" (SECURITY DEFINER evita recursão no RLS)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_admin_atual()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin_atual() FROM public;
GRANT EXECUTE ON FUNCTION public.is_admin_atual() TO authenticated;

-- ============================================================================
-- SEÇÃO 2 — GARANTIR RLS HABILITADO
-- ============================================================================
ALTER TABLE public.user_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SEÇÃO 3 — POLÍTICAS DE LEITURA (SELECT): próprio registro OU admin
-- ============================================================================
DROP POLICY IF EXISTS sel_user_modules_own_or_admin ON public.user_modules;
CREATE POLICY sel_user_modules_own_or_admin ON public.user_modules
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin_atual());

DROP POLICY IF EXISTS sel_user_roles_own_or_admin ON public.user_roles;
CREATE POLICY sel_user_roles_own_or_admin ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin_atual());

DROP POLICY IF EXISTS sel_profiles_own_or_admin ON public.profiles;
CREATE POLICY sel_profiles_own_or_admin ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin_atual());

-- ============================================================================
-- SEÇÃO 4 — POLÍTICAS DE ESCRITA (INSERT / UPDATE / DELETE): somente admin
-- ============================================================================
-- (Edge Functions usam service role e ignoram RLS, então não dependem destas
-- políticas — isto cobre a escrita direta do client.)

DROP POLICY IF EXISTS ins_user_modules_admin ON public.user_modules;
CREATE POLICY ins_user_modules_admin ON public.user_modules
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_atual());

DROP POLICY IF EXISTS upd_user_modules_admin ON public.user_modules;
CREATE POLICY upd_user_modules_admin ON public.user_modules
  FOR UPDATE TO authenticated
  USING (public.is_admin_atual())
  WITH CHECK (public.is_admin_atual());

DROP POLICY IF EXISTS del_user_modules_admin ON public.user_modules;
CREATE POLICY del_user_modules_admin ON public.user_modules
  FOR DELETE TO authenticated
  USING (public.is_admin_atual());

DROP POLICY IF EXISTS ins_user_roles_admin ON public.user_roles;
CREATE POLICY ins_user_roles_admin ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_atual());

DROP POLICY IF EXISTS upd_user_roles_admin ON public.user_roles;
CREATE POLICY upd_user_roles_admin ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.is_admin_atual())
  WITH CHECK (public.is_admin_atual());

DROP POLICY IF EXISTS del_user_roles_admin ON public.user_roles;
CREATE POLICY del_user_roles_admin ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.is_admin_atual());

-- profiles: o próprio usuário pode atualizar o PRÓPRIO perfil; admin atualiza
-- qualquer um (ex.: is_active/bloqueio). Isto NÃO impede um usuário comum de
-- alterar campos sensíveis do PRÓPRIO perfil (is_active, tipo_usuario,
-- servidor_id) — ver nota na proposta original sobre mover essas colunas
-- para uma Edge Function/trigger dedicados como reforço futuro.
DROP POLICY IF EXISTS upd_profiles_own_or_admin ON public.profiles;
CREATE POLICY upd_profiles_own_or_admin ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin_atual())
  WITH CHECK (id = auth.uid() OR public.is_admin_atual());

DROP POLICY IF EXISTS ins_profiles_admin ON public.profiles;
CREATE POLICY ins_profiles_admin ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_atual());

DROP POLICY IF EXISTS del_profiles_admin ON public.profiles;
CREATE POLICY del_profiles_admin ON public.profiles
  FOR DELETE TO authenticated
  USING (public.is_admin_atual());
