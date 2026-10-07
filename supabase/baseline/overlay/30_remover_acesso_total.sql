-- Remove TODAS as policies `acesso_total_*` (SELECT/INSERT/UPDATE/DELETE para qualquer usuário
-- logado, `auth.uid() IS NOT NULL`) deixadas pela migração 20260220132907.
-- Aplicar ANTES de rls/35_policies_geradas.sql.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND policyname ILIKE 'acesso_total%'
  LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- Cópia de segurança legada de user_modules (migração de 2026): sem uso no app nem em funções, e
-- sem dado num banco novo. Não faz sentido nascer junto com o schema.
DROP TABLE IF EXISTS public._backup_usuario_modulos_old;
