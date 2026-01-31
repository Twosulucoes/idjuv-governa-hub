
-- =============================================
-- CORREÇÃO RLS: Tabela frequencia_mensal
-- Permitir que RH (com permissão rh.frequencia.editar) gerencie
-- =============================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Admins podem gerenciar frequência" ON public.frequencia_mensal;
DROP POLICY IF EXISTS "Usuários podem ver própria frequência" ON public.frequencia_mensal;

-- =============================================
-- NOVAS POLÍTICAS (padrão granular)
-- =============================================

-- SELECT: Servidor vê própria ou admin/RH vê todas
CREATE POLICY "frequencia_mensal_select"
ON public.frequencia_mensal FOR SELECT TO authenticated
USING (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.visualizar')
  OR
  public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.editar')
  OR
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.servidor_id = frequencia_mensal.servidor_id
  )
);

-- INSERT: RH pode inserir
CREATE POLICY "frequencia_mensal_insert"
ON public.frequencia_mensal FOR INSERT TO authenticated
WITH CHECK (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.editar')
);

-- UPDATE: RH pode atualizar
CREATE POLICY "frequencia_mensal_update"
ON public.frequencia_mensal FOR UPDATE TO authenticated
USING (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.editar')
);

-- DELETE: Apenas super admin ou RH
CREATE POLICY "frequencia_mensal_delete"
ON public.frequencia_mensal FOR DELETE TO authenticated
USING (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.editar')
);
