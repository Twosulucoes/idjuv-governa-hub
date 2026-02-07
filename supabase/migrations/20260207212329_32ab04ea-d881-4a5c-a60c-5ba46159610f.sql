
-- Adicionar política de UPDATE para admins na tabela servidores
CREATE POLICY "Admins podem atualizar servidores"
ON public.servidores
FOR UPDATE
USING (has_role('admin'::app_role))
WITH CHECK (has_role('admin'::app_role));

-- Adicionar política de UPDATE para managers na tabela servidores
CREATE POLICY "Managers podem atualizar servidores"
ON public.servidores
FOR UPDATE
USING (has_role('manager'::app_role))
WITH CHECK (has_role('manager'::app_role));

-- Adicionar política de INSERT para admins e managers
CREATE POLICY "Admins podem criar servidores"
ON public.servidores
FOR INSERT
WITH CHECK (has_role('admin'::app_role));

CREATE POLICY "Managers podem criar servidores"
ON public.servidores
FOR INSERT
WITH CHECK (has_role('manager'::app_role));
