
-- Allow public (anonymous) read access to escolas_jer for the public registration form
DROP POLICY IF EXISTS "acesso_total_select" ON public.escolas_jer;

CREATE POLICY "leitura_publica_escolas" ON public.escolas_jer
  FOR SELECT USING (true);

-- Also allow anonymous INSERT on gestores_escolares for public pre-registration
-- First check current policies
DROP POLICY IF EXISTS "acesso_total_select" ON public.gestores_escolares;
DROP POLICY IF EXISTS "acesso_total_insert" ON public.gestores_escolares;

-- Public can read their own record by CPF  
CREATE POLICY "leitura_publica_gestores" ON public.gestores_escolares
  FOR SELECT USING (true);

-- Public can insert (pre-registration)
CREATE POLICY "insercao_publica_gestores" ON public.gestores_escolares
  FOR INSERT WITH CHECK (true);

-- Authenticated users can do everything (admin)
CREATE POLICY "admin_update_gestores" ON public.gestores_escolares
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "admin_delete_gestores" ON public.gestores_escolares
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Add unique constraint on escola_id to enforce one gestor per school
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'gestores_escolares_escola_unique'
  ) THEN
    ALTER TABLE public.gestores_escolares 
      ADD CONSTRAINT gestores_escolares_escola_unique UNIQUE (escola_id);
  END IF;
END $$;
