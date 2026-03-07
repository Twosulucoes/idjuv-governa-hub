
-- Fix: Remove function dependency on tipo_usuario type, and convert column to TEXT
-- so that the pending migration 20260306221801 becomes safe to apply

-- Drop the function that depends on tipo_usuario type
DROP FUNCTION IF EXISTS public.is_usuario_tecnico CASCADE;

-- Drop the index that depends on the column type
DROP INDEX IF EXISTS public.idx_profiles_tipo_usuario;

-- Convert column to TEXT to remove dependency on the enum
ALTER TABLE public.profiles ALTER COLUMN tipo_usuario TYPE TEXT USING tipo_usuario::TEXT;

-- Now drop the type safely
DROP TYPE IF EXISTS public.tipo_usuario;

-- Recreate as TEXT column with index (no enum needed)
CREATE INDEX IF NOT EXISTS idx_profiles_tipo_usuario ON public.profiles(tipo_usuario);
