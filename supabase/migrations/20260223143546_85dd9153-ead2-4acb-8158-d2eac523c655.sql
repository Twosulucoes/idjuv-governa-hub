
-- Fix tipo_usuario: convert column to text, drop type with CASCADE, recreate
ALTER TABLE public.profiles ALTER COLUMN tipo_usuario TYPE TEXT USING tipo_usuario::TEXT;

DROP TYPE IF EXISTS public.tipo_usuario CASCADE;

CREATE TYPE public.tipo_usuario AS ENUM ('servidor', 'tecnico');

ALTER TABLE public.profiles 
  ALTER COLUMN tipo_usuario TYPE public.tipo_usuario 
  USING tipo_usuario::public.tipo_usuario;

DROP INDEX IF EXISTS public.idx_profiles_tipo_usuario;
CREATE INDEX IF NOT EXISTS idx_profiles_tipo_usuario ON public.profiles(tipo_usuario);
