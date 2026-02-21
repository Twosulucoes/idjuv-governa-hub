
-- ============================================
-- FIX DEFINITIVO: tipo_usuario com CASCADE total
-- Resolve definitivamente o erro de publicação
-- ============================================

DO $$
DECLARE
  col_udt TEXT;
BEGIN
  -- 1. Verificar estado da coluna
  SELECT udt_name INTO col_udt
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'tipo_usuario';

  -- 2. Se usa o enum, converter para TEXT
  IF col_udt IS NOT NULL AND col_udt = 'tipo_usuario' THEN
    ALTER TABLE public.profiles ALTER COLUMN tipo_usuario TYPE TEXT USING tipo_usuario::TEXT;
  END IF;

  -- 3. DROP com CASCADE para remover TODAS as dependências (views, functions, indexes)
  DROP TYPE IF EXISTS public.tipo_usuario CASCADE;

  -- 4. Recriar o ENUM
  CREATE TYPE public.tipo_usuario AS ENUM ('servidor', 'tecnico');

  -- 5. Restaurar coluna
  IF col_udt IS NOT NULL THEN
    ALTER TABLE public.profiles 
      ALTER COLUMN tipo_usuario TYPE public.tipo_usuario 
      USING tipo_usuario::public.tipo_usuario;
  END IF;

  -- 6. Recriar index que pode ter sido dropado pelo CASCADE
  DROP INDEX IF EXISTS public.idx_profiles_tipo_usuario;
  CREATE INDEX IF NOT EXISTS idx_profiles_tipo_usuario ON public.profiles(tipo_usuario);
END $$;

NOTIFY pgrst, 'reload schema';
