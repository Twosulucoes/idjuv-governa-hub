-- Atualizar políticas para incluir admin
DROP POLICY IF EXISTS backup_history_select ON backup_history;
DROP POLICY IF EXISTS backup_config_select ON backup_config;
DROP POLICY IF EXISTS backup_config_update ON backup_config;
DROP POLICY IF EXISTS backup_history_update ON backup_history;
DROP POLICY IF EXISTS backup_history_delete ON backup_history;

CREATE POLICY "backup_history_select" ON backup_history
FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'ti_admin'::app_role) OR 
  has_role(auth.uid(), 'presidencia'::app_role)
);

CREATE POLICY "backup_config_select" ON backup_config
FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'ti_admin'::app_role) OR 
  has_role(auth.uid(), 'presidencia'::app_role)
);

CREATE POLICY "backup_config_update" ON backup_config
FOR UPDATE USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'ti_admin'::app_role) OR 
  has_role(auth.uid(), 'presidencia'::app_role)
);

CREATE POLICY "backup_history_update" ON backup_history
FOR UPDATE USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'ti_admin'::app_role) OR 
  has_role(auth.uid(), 'presidencia'::app_role)
);

CREATE POLICY "backup_history_delete" ON backup_history
FOR DELETE USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'ti_admin'::app_role) OR 
  has_role(auth.uid(), 'presidencia'::app_role)
);