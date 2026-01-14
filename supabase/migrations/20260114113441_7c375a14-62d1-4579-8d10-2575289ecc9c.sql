-- Add new columns to documentos table for improved workflow
ALTER TABLE public.documentos 
  ADD COLUMN IF NOT EXISTS assinado_por uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS data_assinatura date,
  ADD COLUMN IF NOT EXISTS arquivo_assinado_url text,
  ADD COLUMN IF NOT EXISTS servidores_ids uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS provimento_id uuid,
  ADD COLUMN IF NOT EXISTS designacao_id uuid,
  ADD COLUMN IF NOT EXISTS cargo_id uuid,
  ADD COLUMN IF NOT EXISTS unidade_id uuid,
  ADD COLUMN IF NOT EXISTS conteudo_html text,
  ADD COLUMN IF NOT EXISTS doe_numero text,
  ADD COLUMN IF NOT EXISTS doe_data date;

-- Add foreign key constraints
ALTER TABLE public.documentos
  ADD CONSTRAINT documentos_provimento_id_fkey 
    FOREIGN KEY (provimento_id) REFERENCES provimentos(id) ON DELETE SET NULL,
  ADD CONSTRAINT documentos_designacao_id_fkey 
    FOREIGN KEY (designacao_id) REFERENCES designacoes(id) ON DELETE SET NULL,
  ADD CONSTRAINT documentos_cargo_id_fkey 
    FOREIGN KEY (cargo_id) REFERENCES cargos(id) ON DELETE SET NULL,
  ADD CONSTRAINT documentos_unidade_id_fkey 
    FOREIGN KEY (unidade_id) REFERENCES estrutura_organizacional(id) ON DELETE SET NULL;

-- Create function for automatic portaria numbering
CREATE OR REPLACE FUNCTION public.gerar_numero_portaria(p_ano integer DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::integer)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ultimo integer;
  v_novo text;
BEGIN
  SELECT COALESCE(MAX(
    CASE 
      WHEN numero ~ '^[0-9]+/' THEN CAST(SPLIT_PART(numero, '/', 1) AS integer)
      ELSE 0
    END
  ), 0)
  INTO v_ultimo
  FROM documentos
  WHERE tipo = 'portaria'
    AND EXTRACT(YEAR FROM data_documento) = p_ano;
  
  v_novo := LPAD((v_ultimo + 1)::text, 3, '0') || '/' || p_ano;
  RETURN v_novo;
END;
$$;

-- Create index for faster portaria lookups
CREATE INDEX IF NOT EXISTS idx_documentos_tipo_ano 
  ON documentos(tipo, EXTRACT(YEAR FROM data_documento));

CREATE INDEX IF NOT EXISTS idx_documentos_provimento_id 
  ON documentos(provimento_id) WHERE provimento_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_documentos_designacao_id 
  ON documentos(designacao_id) WHERE designacao_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_documentos_servidores_ids 
  ON documentos USING GIN(servidores_ids) WHERE servidores_ids IS NOT NULL AND array_length(servidores_ids, 1) > 0;

-- Add new status values to the enum if they don't exist
DO $$
BEGIN
  -- Add new status values
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'minuta' AND enumtypid = 'status_documento'::regtype) THEN
    ALTER TYPE status_documento ADD VALUE 'minuta';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'aguardando_assinatura' AND enumtypid = 'status_documento'::regtype) THEN
    ALTER TYPE status_documento ADD VALUE 'aguardando_assinatura';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'assinado' AND enumtypid = 'status_documento'::regtype) THEN
    ALTER TYPE status_documento ADD VALUE 'assinado';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'aguardando_publicacao' AND enumtypid = 'status_documento'::regtype) THEN
    ALTER TYPE status_documento ADD VALUE 'aguardando_publicacao';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'publicado' AND enumtypid = 'status_documento'::regtype) THEN
    ALTER TYPE status_documento ADD VALUE 'publicado';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'revogado' AND enumtypid = 'status_documento'::regtype) THEN
    ALTER TYPE status_documento ADD VALUE 'revogado';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add new categoria values to the enum if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'nomeacao' AND enumtypid = 'categoria_portaria'::regtype) THEN
    ALTER TYPE categoria_portaria ADD VALUE 'nomeacao';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'exoneracao' AND enumtypid = 'categoria_portaria'::regtype) THEN
    ALTER TYPE categoria_portaria ADD VALUE 'exoneracao';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'designacao' AND enumtypid = 'categoria_portaria'::regtype) THEN
    ALTER TYPE categoria_portaria ADD VALUE 'designacao';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'dispensa' AND enumtypid = 'categoria_portaria'::regtype) THEN
    ALTER TYPE categoria_portaria ADD VALUE 'dispensa';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'cessao' AND enumtypid = 'categoria_portaria'::regtype) THEN
    ALTER TYPE categoria_portaria ADD VALUE 'cessao';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ferias' AND enumtypid = 'categoria_portaria'::regtype) THEN
    ALTER TYPE categoria_portaria ADD VALUE 'ferias';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'licenca' AND enumtypid = 'categoria_portaria'::regtype) THEN
    ALTER TYPE categoria_portaria ADD VALUE 'licenca';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;