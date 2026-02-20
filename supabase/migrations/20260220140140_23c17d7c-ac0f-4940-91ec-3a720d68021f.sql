
-- Adicionar foreign keys que estão faltando na tabela servidores
DO $$
BEGIN
  -- servidores.cargo_atual_id -> cargos(id)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'servidores_cargo_atual_id_fkey' 
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.servidores 
      ADD CONSTRAINT servidores_cargo_atual_id_fkey 
      FOREIGN KEY (cargo_atual_id) REFERENCES public.cargos(id) ON DELETE SET NULL;
  END IF;

  -- servidores.unidade_atual_id -> estrutura_organizacional(id)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'servidores_unidade_atual_id_fkey' 
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.servidores 
      ADD CONSTRAINT servidores_unidade_atual_id_fkey 
      FOREIGN KEY (unidade_atual_id) REFERENCES public.estrutura_organizacional(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Recarregar cache do PostgREST
NOTIFY pgrst, 'reload schema';
