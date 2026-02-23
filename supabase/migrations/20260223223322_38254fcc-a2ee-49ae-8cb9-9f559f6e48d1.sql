
-- ============================================
-- FIX FINAL: Resolver "cannot drop type tipo_usuario" 
-- Abordagem segura: só age se necessário, com CASCADE
-- ============================================

DO $$
DECLARE
  col_type TEXT;
  type_exists BOOLEAN;
BEGIN
  -- Verificar se o tipo existe
  SELECT EXISTS(SELECT 1 FROM pg_type WHERE typname = 'tipo_usuario' AND typnamespace = 'public'::regnamespace) INTO type_exists;
  
  -- Verificar tipo atual da coluna
  SELECT udt_name INTO col_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'tipo_usuario';

  -- Se coluna já usa o enum correto, não precisa fazer nada
  IF col_type = 'tipo_usuario' AND type_exists THEN
    RAISE NOTICE 'tipo_usuario já está configurado corretamente. Nenhuma ação necessária.';
    RETURN;
  END IF;

  -- Se precisa recriar: converter coluna para TEXT primeiro
  IF col_type = 'tipo_usuario' THEN
    ALTER TABLE public.profiles ALTER COLUMN tipo_usuario TYPE TEXT USING tipo_usuario::TEXT;
  END IF;

  -- Drop com CASCADE para remover TODAS as dependências
  DROP TYPE IF EXISTS public.tipo_usuario CASCADE;

  -- Recriar o ENUM
  CREATE TYPE public.tipo_usuario AS ENUM ('servidor', 'tecnico');

  -- Restaurar coluna
  IF col_type IS NOT NULL THEN
    ALTER TABLE public.profiles 
      ALTER COLUMN tipo_usuario TYPE public.tipo_usuario 
      USING tipo_usuario::public.tipo_usuario;
  END IF;

  RAISE NOTICE 'tipo_usuario recriado com sucesso.';
END $$;
