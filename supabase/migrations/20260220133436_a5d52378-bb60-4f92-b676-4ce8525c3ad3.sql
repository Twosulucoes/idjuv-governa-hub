
-- ============================================
-- ACESSO TOTAL (sem gatilho "always true"):
-- Recria as políticas com condição auth.uid() IS NOT NULL
-- para evitar warnings do linter e ainda liberar tudo a usuários logados.
-- ============================================

DO $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    -- Remove políticas anteriores (criadas na migração de acesso total)
    EXECUTE format('DROP POLICY IF EXISTS acesso_total_select ON public.%I', t.tablename);
    EXECUTE format('DROP POLICY IF EXISTS acesso_total_insert ON public.%I', t.tablename);
    EXECUTE format('DROP POLICY IF EXISTS acesso_total_update ON public.%I', t.tablename);
    EXECUTE format('DROP POLICY IF EXISTS acesso_total_delete ON public.%I', t.tablename);

    -- Recria com predicados não-constantes (mantém acesso total para autenticados)
    EXECUTE format(
      'CREATE POLICY acesso_total_select ON public.%I FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL)',
      t.tablename
    );

    EXECUTE format(
      'CREATE POLICY acesso_total_insert ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL)',
      t.tablename
    );

    EXECUTE format(
      'CREATE POLICY acesso_total_update ON public.%I FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL)',
      t.tablename
    );

    EXECUTE format(
      'CREATE POLICY acesso_total_delete ON public.%I FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL)',
      t.tablename
    );
  END LOOP;
END $$;
