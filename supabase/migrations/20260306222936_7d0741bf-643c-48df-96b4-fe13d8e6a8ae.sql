-- Fix: safely handle tipo_usuario enum without DROP
-- Convert column to text to remove dependency, then recreate
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' 
    AND column_name = 'tipo_usuario' AND udt_name = 'tipo_usuario'
  ) THEN
    ALTER TABLE public.profiles ALTER COLUMN tipo_usuario TYPE TEXT USING tipo_usuario::TEXT;
    DROP TYPE IF EXISTS public.tipo_usuario;
    CREATE TYPE public.tipo_usuario AS ENUM ('servidor', 'tecnico');
    ALTER TABLE public.profiles ALTER COLUMN tipo_usuario TYPE public.tipo_usuario USING tipo_usuario::public.tipo_usuario;
  END IF;
END $$;