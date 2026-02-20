
-- ============================================
-- ACESSO TOTAL: Remove todas as políticas RLS e cria acesso irrestrito
-- para todos os usuários autenticados em todas as tabelas
-- ============================================

DO $$
DECLARE
  r RECORD;
BEGIN
  -- Remove todas as políticas existentes em todas as tabelas públicas
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END$$;

-- Agora cria uma política de acesso total para cada tabela
DO $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    -- SELECT
    EXECUTE format('CREATE POLICY "acesso_total_select" ON public.%I FOR SELECT TO authenticated USING (true)', t.tablename);
    -- INSERT
    EXECUTE format('CREATE POLICY "acesso_total_insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (true)', t.tablename);
    -- UPDATE
    EXECUTE format('CREATE POLICY "acesso_total_update" ON public.%I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)', t.tablename);
    -- DELETE
    EXECUTE format('CREATE POLICY "acesso_total_delete" ON public.%I FOR DELETE TO authenticated USING (true)', t.tablename);
  END LOOP;
END$$;
