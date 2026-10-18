-- ============================================================================
-- PROPOSTA DE RLS — TABELAS DO SISTEMA DE USUÁRIOS
-- ============================================================================
-- Item C2 da auditoria (docs/AUDITORIA_USUARIOS.md).
--
-- Contexto: a gestão de módulos no front (useAdminRBAC / useAdminUsuarios)
-- grava DIRETO em user_modules e atualiza profiles pelo client. A única
-- barreira é o RLS. Se as políticas de ESCRITA não estiverem restritas a
-- administradores, um usuário comum pode se conceder o módulo "admin".
--
-- ⚠️ NÃO É UMA MIGRAÇÃO AUTOMÁTICA. Este arquivo vive em docs/ de propósito —
--    arquivos em supabase/migrations/ são aplicados automaticamente no deploy.
--    Aqui o objetivo é REVISAR contra as políticas atuais antes de aplicar.
--
-- COMO USAR:
--   1. Rode a SEÇÃO 0 (introspecção) e analise as políticas/funções atuais.
--   2. Ajuste a SEÇÃO 3 (SELECT) conforme os fluxos reais de leitura.
--   3. Aplique as SEÇÕES 1–4 em ambiente de teste; valide login + tela de
--      gestão de usuários; só então promova para produção.
-- ============================================================================


-- ============================================================================
-- SEÇÃO 0 — INTROSPECÇÃO (rode primeiro, não altera nada)
-- ============================================================================

-- 0.1 Políticas existentes nas tabelas de usuário
SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('user_modules', 'user_roles', 'profiles')
ORDER BY tablename, cmd, policyname;

-- 0.2 RLS está habilitado?
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE relname IN ('user_modules', 'user_roles', 'profiles');

-- 0.3 Funções auxiliares de autorização já existentes (assinatura)
SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('has_role', 'usuario_eh_super_admin', 'has_permission', 'usuario_tem_permissao')
ORDER BY p.proname;


-- ============================================================================
-- SEÇÃO 1 — HELPER "é admin?" (SECURITY DEFINER evita recursão no RLS)
-- ============================================================================
-- Consulta user_roles ignorando o RLS da própria tabela (security definer),
-- o que evita recursão infinita ao usar este helper em políticas de user_roles.
-- Se já existir um helper equivalente (ver 0.3), prefira reutilizá-lo e pule
-- esta seção.

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
-- SEÇÃO 3 — POLÍTICAS DE LEITURA (SELECT)
-- ============================================================================
-- Fluxos observados no código:
--   - AuthContext/useRBAC leem os PRÓPRIOS módulos/roles/profile.
--   - useAdminUsuarios lê TODOS os profiles e TODOS os user_modules (admin).
-- Portanto: "próprio registro OU admin".

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
-- SEÇÃO 4 — POLÍTICAS DE ESCRITA (INSERT / UPDATE / DELETE)
-- ============================================================================
-- user_modules e user_roles: somente admin escreve (as Edge Functions usam
-- service role e ignoram o RLS, então não dependem destas políticas).

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
-- qualquer um (ex.: is_active/bloqueio). Para impedir auto-escalonamento,
-- recomenda-se que campos sensíveis (is_active, tipo_usuario, servidor_id)
-- só sejam alteráveis por admin — idealmente via coluna-a-coluna por trigger
-- ou movendo essas escritas para uma Edge Function. Política base:

DROP POLICY IF EXISTS upd_profiles_own_or_admin ON public.profiles;
CREATE POLICY upd_profiles_own_or_admin ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin_atual())
  WITH CHECK (id = auth.uid() OR public.is_admin_atual());

-- INSERT/DELETE de profiles ficam restritos a admin (criação real ocorre via
-- trigger em auth.users e/ou Edge Function com service role).
DROP POLICY IF EXISTS ins_profiles_admin ON public.profiles;
CREATE POLICY ins_profiles_admin ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_atual());

DROP POLICY IF EXISTS del_profiles_admin ON public.profiles;
CREATE POLICY del_profiles_admin ON public.profiles
  FOR DELETE TO authenticated
  USING (public.is_admin_atual());


-- ============================================================================
-- SEÇÃO 5 — LIMPEZA DE POLÍTICAS LEGADAS PERMISSIVAS (OPCIONAL / CUIDADO)
-- ============================================================================
-- ⚠️ O RLS do Postgres combina políticas com OR. Se já existir uma política
--    permissiva antiga (ex.: "allow all" / USING(true)) para escrita, as
--    políticas acima NÃO a anulam — a permissiva continua valendo.
--    Use a SEÇÃO 0.1 para identificar políticas legadas e remova-as
--    explicitamente, por nome, após revisão. Exemplo:
--
-- DROP POLICY IF EXISTS "<nome_da_policy_legada>" ON public.user_modules;
-- DROP POLICY IF EXISTS "<nome_da_policy_legada>" ON public.user_roles;
-- DROP POLICY IF EXISTS "<nome_da_policy_legada>" ON public.profiles;


-- ============================================================================
-- SEÇÃO 6 — VALIDAÇÃO PÓS-APLICAÇÃO
-- ============================================================================
-- Como um usuário NÃO-admin (use o painel "Run as role" ou um JWT de teste):
--   - SELECT em user_modules deve retornar só os próprios; INSERT deve falhar.
-- Como admin:
--   - SELECT deve ver todos; INSERT/DELETE de módulos deve funcionar.
-- No app: validar login, /admin/usuarios (listagem + toggle de módulo) e
-- /meu-perfil (atualização do próprio perfil).
</content>
