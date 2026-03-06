
-- Fix: Resolve "cannot drop type tipo_usuario" by ensuring column uses TEXT
-- before any TYPE recreation attempts
DO $$
BEGIN
  -- Only act if the column still uses the enum type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'tipo_usuario'
    AND udt_name = 'tipo_usuario'
  ) THEN
    -- Convert column to TEXT first to remove dependency
    ALTER TABLE public.profiles ALTER COLUMN tipo_usuario TYPE TEXT USING tipo_usuario::TEXT;
  END IF;

  -- Now safely drop and recreate the type
  DROP TYPE IF EXISTS public.tipo_usuario CASCADE;
  
  CREATE TYPE public.tipo_usuario AS ENUM ('servidor', 'tecnico');
  
  -- Convert column back to enum
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'tipo_usuario'
  ) THEN
    ALTER TABLE public.profiles 
      ALTER COLUMN tipo_usuario TYPE public.tipo_usuario 
      USING tipo_usuario::public.tipo_usuario;
  END IF;

  -- Recreate index
  DROP INDEX IF EXISTS public.idx_profiles_tipo_usuario;
  CREATE INDEX IF NOT EXISTS idx_profiles_tipo_usuario ON public.profiles(tipo_usuario);
END $$;
