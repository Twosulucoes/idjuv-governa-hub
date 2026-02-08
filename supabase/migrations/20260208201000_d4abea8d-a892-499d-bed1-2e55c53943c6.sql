-- ============================================
-- Políticas RLS para backup_history e backup_config
-- ============================================

-- Política para backup_history - Admins podem visualizar
CREATE POLICY "Admins podem visualizar histórico de backup"
ON public.backup_history
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
  )
);

-- Política para backup_history - Admins podem inserir
CREATE POLICY "Admins podem inserir histórico de backup"
ON public.backup_history
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
  )
);

-- Política para backup_history - Admins podem atualizar
CREATE POLICY "Admins podem atualizar histórico de backup"
ON public.backup_history
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
  )
);

-- Política para backup_config - Admins podem visualizar
CREATE POLICY "Admins podem visualizar config de backup"
ON public.backup_config
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
  )
);

-- Política para backup_config - Admins podem atualizar
CREATE POLICY "Admins podem atualizar config de backup"
ON public.backup_config
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
  )
);