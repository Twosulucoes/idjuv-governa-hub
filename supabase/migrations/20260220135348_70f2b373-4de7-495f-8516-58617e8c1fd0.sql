
-- Adiciona FKs que o cache PostgREST precisa para resolver os joins
-- Faz de forma segura (IF NOT EXISTS via DO block)

DO $$
BEGIN
  -- FK: servidores.cargo_atual_id -> cargos
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'servidores_cargo_atual_id_fkey' 
    AND table_name = 'servidores'
  ) THEN
    ALTER TABLE public.servidores 
      ADD CONSTRAINT servidores_cargo_atual_id_fkey 
      FOREIGN KEY (cargo_atual_id) REFERENCES public.cargos(id);
  END IF;

  -- FK: servidores.unidade_atual_id -> estrutura_organizacional
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'servidores_unidade_atual_id_fkey' 
    AND table_name = 'servidores'
  ) THEN
    ALTER TABLE public.servidores 
      ADD CONSTRAINT servidores_unidade_atual_id_fkey 
      FOREIGN KEY (unidade_atual_id) REFERENCES public.estrutura_organizacional(id);
  END IF;

  -- FK: documentos.cargo_id -> cargos
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'documentos_cargo_id_fkey' 
    AND table_name = 'documentos'
  ) THEN
    ALTER TABLE public.documentos 
      ADD CONSTRAINT documentos_cargo_id_fkey 
      FOREIGN KEY (cargo_id) REFERENCES public.cargos(id);
  END IF;

  -- FK: documentos.unidade_id -> estrutura_organizacional
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'documentos_unidade_id_fkey' 
    AND table_name = 'documentos'
  ) THEN
    ALTER TABLE public.documentos 
      ADD CONSTRAINT documentos_unidade_id_fkey 
      FOREIGN KEY (unidade_id) REFERENCES public.estrutura_organizacional(id);
  END IF;
END $$;

-- Força reload do cache PostgREST após adicionar as FKs
NOTIFY pgrst, 'reload schema';
