-- Corrigir políticas permissivas - adicionar DELETE policy restritiva para backup_history
CREATE POLICY "backup_history_delete" ON public.backup_history
  FOR DELETE USING (
    public.has_role(auth.uid(), 'ti_admin') OR 
    public.has_role(auth.uid(), 'presidencia')
  );

-- Adicionar UPDATE policy para backup_history (para atualizar status)
CREATE POLICY "backup_history_update" ON public.backup_history
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'ti_admin') OR 
    public.has_role(auth.uid(), 'presidencia')
  );