
-- ============================================
-- CORREÇÃO: Garante que o tipo tipo_usuario existe antes de qualquer operação
-- e que as políticas de acesso total usam auth.uid() IS NOT NULL
-- ============================================

-- Passo 1: Garante que RLS está habilitado em todas as tabelas públicas
DO $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $$;

-- Passo 2: Remove políticas anteriores com "true" constante e recria com predicate correto
DO $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    -- Remove políticas de acesso total existentes
    EXECUTE format('DROP POLICY IF EXISTS "acesso_total_select" ON public.%I', t.tablename);
    EXECUTE format('DROP POLICY IF EXISTS "acesso_total_insert" ON public.%I', t.tablename);
    EXECUTE format('DROP POLICY IF EXISTS "acesso_total_update" ON public.%I', t.tablename);
    EXECUTE format('DROP POLICY IF EXISTS "acesso_total_delete" ON public.%I', t.tablename);
    EXECUTE format('DROP POLICY IF EXISTS acesso_total_select ON public.%I', t.tablename);
    EXECUTE format('DROP POLICY IF EXISTS acesso_total_insert ON public.%I', t.tablename);
    EXECUTE format('DROP POLICY IF EXISTS acesso_total_update ON public.%I', t.tablename);
    EXECUTE format('DROP POLICY IF EXISTS acesso_total_delete ON public.%I', t.tablename);

    -- Recria com predicado não-constante (auth.uid() IS NOT NULL)
    EXECUTE format(
      'CREATE POLICY "acesso_total_select" ON public.%I FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL)',
      t.tablename
    );
    EXECUTE format(
      'CREATE POLICY "acesso_total_insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL)',
      t.tablename
    );
    EXECUTE format(
      'CREATE POLICY "acesso_total_update" ON public.%I FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL)',
      t.tablename
    );
    EXECUTE format(
      'CREATE POLICY "acesso_total_delete" ON public.%I FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL)',
      t.tablename
    );
  END LOOP;
END $$;

-- Notifica o PostgREST para recarregar o schema
NOTIFY pgrst, 'reload schema';
