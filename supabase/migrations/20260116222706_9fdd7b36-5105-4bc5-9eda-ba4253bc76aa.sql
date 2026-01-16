-- Corrige incompatibilidade: frontend envia nome (texto) mas coluna assinado_por foi criada como UUID
DO $$
DECLARE
  fk_name text;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'documentos'
      AND column_name = 'assinado_por'
  ) THEN
    -- Remove FK (se existir) para permitir armazenar nome livremente
    SELECT c.conname
      INTO fk_name
    FROM pg_constraint c
    JOIN pg_attribute a
      ON a.attrelid = c.conrelid
     AND a.attnum = ANY (c.conkey)
    WHERE c.conrelid = 'public.documentos'::regclass
      AND c.contype = 'f'
      AND a.attname = 'assinado_por'
    LIMIT 1;

    IF fk_name IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.documentos DROP CONSTRAINT %I', fk_name);
    END IF;

    -- Converte para texto (mantém valores existentes como string)
    EXECUTE 'ALTER TABLE public.documentos ALTER COLUMN assinado_por TYPE text USING assinado_por::text';
  END IF;
END $$;
