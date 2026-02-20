
-- ============================================
-- LIMPEZA DE TABELAS LEGADAS / NÃO UTILIZADAS
-- ============================================
-- Removendo: role_permissions, user_permissions,
--            user_security_settings, perfil_permissoes, permissoes

-- 1. Remover tabelas legadas de permissões
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.user_permissions CASCADE;

-- 2. Remover tabela de segurança não utilizada
DROP TABLE IF EXISTS public.user_security_settings CASCADE;

-- 3. Remover tabelas de perfil/permissões legadas
DROP TABLE IF EXISTS public.perfil_permissoes CASCADE;
DROP TABLE IF EXISTS public.permissoes CASCADE;
