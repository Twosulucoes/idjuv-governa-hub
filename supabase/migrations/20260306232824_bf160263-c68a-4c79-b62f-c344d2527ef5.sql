
-- Safe idempotent fix: ensure tipo_usuario enum exists and profiles column is correct
-- This migration does NOT use DROP TYPE to avoid dependency issues
DO $$
BEGIN
  -- If the type doesn't exist at all, create it
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_usuario' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.tipo_usuario AS ENUM ('servidor', 'tecnico');
  END IF;

  -- Ensure profiles column uses the enum type (convert from TEXT if needed)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' 
    AND column_name = 'tipo_usuario' AND data_type = 'text'
  ) THEN
    ALTER TABLE public.profiles 
      ALTER COLUMN tipo_usuario TYPE public.tipo_usuario 
      USING tipo_usuario::public.tipo_usuario;
  END IF;

  -- Ensure index exists
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_profiles_tipo_usuario') THEN
    CREATE INDEX idx_profiles_tipo_usuario ON public.profiles(tipo_usuario);
  END IF;
END $$;

-- Add delete policy for arbitros admin (for full CRUD)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_delete_arbitros' AND tablename = 'cadastro_arbitros'
  ) THEN
    CREATE POLICY "authenticated_delete_arbitros"
    ON public.cadastro_arbitros
    FOR DELETE
    TO authenticated
    USING (true);
  END IF;
END $$;
