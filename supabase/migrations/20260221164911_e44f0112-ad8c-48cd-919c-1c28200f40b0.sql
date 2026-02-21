
-- ============================================
-- FIX DEFINITIVO: Resolver erro de publicação "cannot drop type tipo_usuario"
-- Garante idempotência removendo dependências antes do DROP
-- ============================================

DO $$
DECLARE
  col_udt TEXT;
BEGIN
  -- 1. Verificar estado atual da coluna
  SELECT udt_name INTO col_udt
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'tipo_usuario';

  -- 2. Se a coluna usa o enum, converter para TEXT primeiro
  IF col_udt IS NOT NULL AND col_udt = 'tipo_usuario' THEN
    ALTER TABLE public.profiles ALTER COLUMN tipo_usuario TYPE TEXT USING tipo_usuario::TEXT;
  END IF;

  -- 3. Dropar o tipo (agora sem dependências)
  DROP TYPE IF EXISTS public.tipo_usuario;

  -- 4. Recriar o ENUM
  CREATE TYPE public.tipo_usuario AS ENUM ('servidor', 'tecnico');

  -- 5. Restaurar a coluna com o enum
  ALTER TABLE public.profiles 
    ALTER COLUMN tipo_usuario TYPE public.tipo_usuario 
    USING tipo_usuario::public.tipo_usuario;
END $$;

NOTIFY pgrst, 'reload schema';
