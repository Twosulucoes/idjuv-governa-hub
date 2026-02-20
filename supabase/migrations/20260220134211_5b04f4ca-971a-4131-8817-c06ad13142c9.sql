
-- ============================================
-- FIX: Resolve o erro de publicação "cannot drop type tipo_usuario"
-- Padrão de 4 etapas para recriar enum com dependentes
-- ============================================

-- Etapa 1: Converter coluna dependente para TEXT
ALTER TABLE public.profiles 
  ALTER COLUMN tipo_usuario TYPE TEXT;

-- Etapa 2: DROP TYPE CASCADE (agora sem dependentes)
DROP TYPE IF EXISTS public.tipo_usuario CASCADE;

-- Etapa 3: Recriar o TYPE como ENUM
CREATE TYPE public.tipo_usuario AS ENUM ('servidor', 'tecnico');

-- Etapa 4: Restaurar a coluna com o novo ENUM
ALTER TABLE public.profiles 
  ALTER COLUMN tipo_usuario TYPE public.tipo_usuario 
  USING tipo_usuario::public.tipo_usuario;

-- Recarrega cache do PostgREST
NOTIFY pgrst, 'reload schema';
