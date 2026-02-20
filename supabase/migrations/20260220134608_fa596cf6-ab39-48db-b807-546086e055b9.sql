
-- ============================================
-- FIX IDEMPOTENTE: Resolve erro "cannot drop type tipo_usuario"
-- Verifica estado antes de agir para ser seguro em Test e Live
-- ============================================

DO $$
DECLARE
  col_type TEXT;
  type_exists BOOLEAN;
BEGIN
  -- Verifica se o tipo existe
  SELECT EXISTS(
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'tipo_usuario' AND n.nspname = 'public'
  ) INTO type_exists;

  IF type_exists THEN
    -- Etapa 1: Converter coluna para TEXT (para remover dependência)
    SELECT udt_name INTO col_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'tipo_usuario';

    IF col_type IS NOT NULL AND col_type != 'text' THEN
      ALTER TABLE public.profiles ALTER COLUMN tipo_usuario TYPE TEXT USING tipo_usuario::TEXT;
    END IF;

    -- Etapa 2: DROP TYPE CASCADE
    DROP TYPE public.tipo_usuario CASCADE;
  END IF;

  -- Etapa 3: Recriar o TYPE como ENUM (sempre)
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'tipo_usuario' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.tipo_usuario AS ENUM ('servidor', 'tecnico');
  END IF;

  -- Etapa 4: Restaurar a coluna com o novo ENUM
  SELECT data_type INTO col_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'tipo_usuario';

  IF col_type = 'text' THEN
    ALTER TABLE public.profiles 
      ALTER COLUMN tipo_usuario TYPE public.tipo_usuario 
      USING tipo_usuario::public.tipo_usuario;
  END IF;
END $$;

-- Recarrega cache do PostgREST
NOTIFY pgrst, 'reload schema';
