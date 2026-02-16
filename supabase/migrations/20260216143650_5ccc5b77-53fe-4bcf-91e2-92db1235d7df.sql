
CREATE OR REPLACE FUNCTION public.generate_schema_ddl()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  WITH enum_types AS (
    SELECT t.typname,
           string_agg(e.enumlabel, ',' ORDER BY e.enumsortorder) as labels
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    GROUP BY t.typname
  ),
  table_cols AS (
    SELECT c.table_name, 
           json_agg(json_build_object(
             'column_name', c.column_name,
             'data_type', c.data_type,
             'udt_name', c.udt_name,
             'column_default', c.column_default,
             'is_nullable', c.is_nullable,
             'char_max_length', c.character_maximum_length,
             'numeric_precision', c.numeric_precision,
             'numeric_scale', c.numeric_scale
           ) ORDER BY c.ordinal_position) as columns
    FROM information_schema.columns c
    JOIN information_schema.tables t ON c.table_name = t.table_name AND t.table_schema = 'public'
    WHERE c.table_schema = 'public' AND t.table_type = 'BASE TABLE'
      AND c.table_name NOT IN ('_realtime_subscription','schema_migrations','supabase_functions_migrations','supabase_functions_hooks')
    GROUP BY c.table_name
  ),
  pk_cols AS (
    SELECT tc.table_name,
           json_agg(kcu.column_name) as pk_columns
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public'
    GROUP BY tc.table_name
  )
  SELECT json_build_object(
    'enums', COALESCE((SELECT json_agg(json_build_object('name', typname, 'labels', labels)) FROM enum_types), '[]'::json),
    'tables', COALESCE((SELECT json_agg(json_build_object('name', tc.table_name, 'columns', tc.columns, 'pk', pk.pk_columns)) 
              FROM table_cols tc LEFT JOIN pk_cols pk ON tc.table_name = pk.table_name), '[]'::json)
  ) INTO result;
  
  RETURN result;
END;
$$;
