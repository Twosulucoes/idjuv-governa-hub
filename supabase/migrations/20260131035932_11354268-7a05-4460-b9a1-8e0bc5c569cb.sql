-- ============================================================
-- ETAPA 3 - FASE 5: RLS DENY-BY-DEFAULT
-- Tabela: public.approval_delegations (Delegações de Aprovação)
-- Tabela de médio risco - delegação de poder de aprovação
-- ============================================================

-- Habilitar RLS
ALTER TABLE public.approval_delegations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_delegations FORCE ROW LEVEL SECURITY;

-- ============================================================
-- Remover policies antigas/permissivas
-- ============================================================
DROP POLICY IF EXISTS "approval_delegations_select" ON public.approval_delegations;
DROP POLICY IF EXISTS "approval_delegations_insert" ON public.approval_delegations;
DROP POLICY IF EXISTS "approval_delegations_update" ON public.approval_delegations;
DROP POLICY IF EXISTS "approval_delegations_delete" ON public.approval_delegations;
DROP POLICY IF EXISTS "Anyone can view approval_delegations" ON public.approval_delegations;
DROP POLICY IF EXISTS "Authenticated users can view approval_delegations" ON public.approval_delegations;
DROP POLICY IF EXISTS "Admins can manage approval_delegations" ON public.approval_delegations;
DROP POLICY IF EXISTS "Users can view their delegations" ON public.approval_delegations;

-- ============================================================
-- SELECT: super_admin, permissão, delegante ou delegado
-- - super_admin vê todas
-- - quem tem processos.aprovacoes.visualizar
-- - delegante (delegator_id) vê suas delegações criadas
-- - delegado (delegate_id) vê delegações recebidas
-- ============================================================
CREATE POLICY "approval_delegations_select" ON public.approval_delegations
FOR SELECT TO authenticated
USING (
  -- Super Admin pode ver todas
  public.usuario_eh_super_admin(auth.uid())
  OR
  -- Quem tem permissão processos.aprovacoes.visualizar
  public.usuario_tem_permissao(auth.uid(), 'processos.aprovacoes.visualizar')
  OR
  -- Delegante vê suas próprias delegações criadas
  delegator_id = auth.uid()
  OR
  -- Delegado vê delegações recebidas
  delegate_id = auth.uid()
);

-- ============================================================
-- INSERT: super_admin, permissão ou self-service (delegante)
-- - super_admin pode criar qualquer delegação
-- - quem tem processos.aprovacoes.delegar
-- - usuário pode criar delegação em seu próprio nome (self-service)
--   desde que delegator_id = auth.uid()
-- ============================================================
CREATE POLICY "approval_delegations_insert" ON public.approval_delegations
FOR INSERT TO authenticated
WITH CHECK (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'processos.aprovacoes.delegar')
  OR
  -- Self-service: delegante pode criar delegação em seu próprio nome
  delegator_id = auth.uid()
);

-- ============================================================
-- UPDATE: super_admin, permissão ou delegante
-- - super_admin pode atualizar qualquer delegação
-- - quem tem processos.aprovacoes.delegar
-- - delegante pode atualizar (ex: ajustar período, encerrar)
-- NOTA: Delegado NÃO pode editar a delegação
-- ============================================================
CREATE POLICY "approval_delegations_update" ON public.approval_delegations
FOR UPDATE TO authenticated
USING (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'processos.aprovacoes.delegar')
  OR
  -- Apenas o delegante pode atualizar
  delegator_id = auth.uid()
)
WITH CHECK (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'processos.aprovacoes.delegar')
  OR
  -- Apenas o delegante pode atualizar
  delegator_id = auth.uid()
);

-- ============================================================
-- DELETE: super_admin ou delegante (revogar delegação)
-- - super_admin pode excluir qualquer delegação
-- - delegante pode revogar/excluir sua própria delegação
-- NOTA: Delegado NÃO pode excluir a delegação
-- ============================================================
CREATE POLICY "approval_delegations_delete" ON public.approval_delegations
FOR DELETE TO authenticated
USING (
  public.usuario_eh_super_admin(auth.uid())
  OR
  -- Apenas o delegante pode excluir/revogar sua delegação
  delegator_id = auth.uid()
);

-- ============================================================
-- FIM DA MIGRAÇÃO - public.approval_delegations
-- ============================================================