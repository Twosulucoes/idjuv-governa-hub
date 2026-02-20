
-- Correção: Garantir que o tipo tipo_usuario existe sem tentar recriá-lo
-- Isso resolve o erro "cannot drop type tipo_usuario" ao publicar

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_usuario' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.tipo_usuario AS ENUM ('servidor', 'tecnico');
  END IF;
END $$;
