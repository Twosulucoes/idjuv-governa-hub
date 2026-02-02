-- Corrigir políticas RLS da tabela frequencia_mensal para usar permissões existentes
-- As permissões rh.frequencia.* não existem, o correto é usar rh.visualizar, rh.admin, rh.aprovar

-- Remover políticas antigas
DROP POLICY IF EXISTS frequencia_mensal_select ON frequencia_mensal;
DROP POLICY IF EXISTS frequencia_mensal_insert ON frequencia_mensal;
DROP POLICY IF EXISTS frequencia_mensal_update ON frequencia_mensal;
DROP POLICY IF EXISTS frequencia_mensal_delete ON frequencia_mensal;

-- Recriar políticas com permissões corretas
CREATE POLICY "frequencia_mensal_select" ON frequencia_mensal
FOR SELECT TO authenticated
USING (
  usuario_eh_super_admin(auth.uid()) 
  OR usuario_tem_permissao(auth.uid(), 'rh.visualizar')
  OR usuario_tem_permissao(auth.uid(), 'rh.admin')
  OR usuario_tem_permissao(auth.uid(), 'rh.aprovar')
  OR (EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.servidor_id = frequencia_mensal.servidor_id
  ))
);

CREATE POLICY "frequencia_mensal_insert" ON frequencia_mensal
FOR INSERT TO authenticated
WITH CHECK (
  usuario_eh_super_admin(auth.uid()) 
  OR usuario_tem_permissao(auth.uid(), 'rh.admin')
  OR usuario_tem_permissao(auth.uid(), 'rh.aprovar')
);

CREATE POLICY "frequencia_mensal_update" ON frequencia_mensal
FOR UPDATE TO authenticated
USING (
  usuario_eh_super_admin(auth.uid()) 
  OR usuario_tem_permissao(auth.uid(), 'rh.admin')
  OR usuario_tem_permissao(auth.uid(), 'rh.aprovar')
);

CREATE POLICY "frequencia_mensal_delete" ON frequencia_mensal
FOR DELETE TO authenticated
USING (
  usuario_eh_super_admin(auth.uid()) 
  OR usuario_tem_permissao(auth.uid(), 'rh.admin')
);

-- Corrigir também registros_ponto se tiver o mesmo problema
DROP POLICY IF EXISTS registros_ponto_select ON registros_ponto;
DROP POLICY IF EXISTS registros_ponto_insert ON registros_ponto;
DROP POLICY IF EXISTS registros_ponto_update ON registros_ponto;
DROP POLICY IF EXISTS registros_ponto_delete ON registros_ponto;

CREATE POLICY "registros_ponto_select" ON registros_ponto
FOR SELECT TO authenticated
USING (
  usuario_eh_super_admin(auth.uid()) 
  OR usuario_tem_permissao(auth.uid(), 'rh.visualizar')
  OR usuario_tem_permissao(auth.uid(), 'rh.admin')
  OR usuario_tem_permissao(auth.uid(), 'rh.aprovar')
  OR (EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.servidor_id = registros_ponto.servidor_id
  ))
);

CREATE POLICY "registros_ponto_insert" ON registros_ponto
FOR INSERT TO authenticated
WITH CHECK (
  usuario_eh_super_admin(auth.uid()) 
  OR usuario_tem_permissao(auth.uid(), 'rh.admin')
  OR usuario_tem_permissao(auth.uid(), 'rh.aprovar')
);

CREATE POLICY "registros_ponto_update" ON registros_ponto
FOR UPDATE TO authenticated
USING (
  usuario_eh_super_admin(auth.uid()) 
  OR usuario_tem_permissao(auth.uid(), 'rh.admin')
  OR usuario_tem_permissao(auth.uid(), 'rh.aprovar')
);

CREATE POLICY "registros_ponto_delete" ON registros_ponto
FOR DELETE TO authenticated
USING (
  usuario_eh_super_admin(auth.uid()) 
  OR usuario_tem_permissao(auth.uid(), 'rh.admin')
);