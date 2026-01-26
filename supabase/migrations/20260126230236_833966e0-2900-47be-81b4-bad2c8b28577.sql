-- ============================================
-- Função para descoberta automática de tabelas
-- Retorna todas as tabelas do schema public
-- ============================================

CREATE OR REPLACE FUNCTION public.list_public_tables()
RETURNS TABLE(table_name text, row_count bigint) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_name::text,
    (xpath('/row/count/text()', 
      query_to_xml(format('SELECT COUNT(*) FROM %I.%I', t.table_schema, t.table_name), false, true, '')
    ))[1]::text::bigint AS row_count
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND t.table_name NOT LIKE 'pg_%'
    AND t.table_name NOT LIKE '_realtime_%'
    AND t.table_name NOT LIKE 'schema_%'
    AND t.table_name NOT IN ('supabase_functions_migrations', 'buckets', 'objects', 'tenants', 'extensions')
  ORDER BY t.table_name;
END;
$$;

-- Permissão para service role (Edge Functions)
GRANT EXECUTE ON FUNCTION public.list_public_tables() TO service_role;

-- Comentário explicativo
COMMENT ON FUNCTION public.list_public_tables() IS 'Função para descoberta automática de tabelas do sistema. Usada pelas Edge Functions database-schema e backup-offsite para listar dinamicamente todas as tabelas sem necessidade de manutenção manual.';