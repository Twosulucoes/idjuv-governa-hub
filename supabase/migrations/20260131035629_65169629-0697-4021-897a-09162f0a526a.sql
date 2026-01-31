-- ============================================================
-- ETAPA 3 - FASE 5: RLS DENY-BY-DEFAULT
-- Tabela: public.approval_requests (Aprovações)
-- Tabela de médio risco - fluxo de aprovações
-- ============================================================

-- Habilitar RLS
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests FORCE ROW LEVEL SECURITY;

-- ============================================================
-- Remover policies antigas/permissivas
-- ============================================================
DROP POLICY IF EXISTS "approval_requests_select" ON public.approval_requests;
DROP POLICY IF EXISTS "approval_requests_insert" ON public.approval_requests;
DROP POLICY IF EXISTS "approval_requests_update" ON public.approval_requests;
DROP POLICY IF EXISTS "approval_requests_delete" ON public.approval_requests;
DROP POLICY IF EXISTS "Anyone can view approval_requests" ON public.approval_requests;
DROP POLICY IF EXISTS "Authenticated users can view approval_requests" ON public.approval_requests;
DROP POLICY IF EXISTS "Admins can manage approval_requests" ON public.approval_requests;
DROP POLICY IF EXISTS "Users can view their own requests" ON public.approval_requests;
DROP POLICY IF EXISTS "Approvers can view assigned requests" ON public.approval_requests;

-- ============================================================
-- SELECT: super_admin, permissão, solicitante ou aprovador
-- - super_admin vê todas
-- - quem tem processos.aprovacoes.visualizar
-- - solicitante vê suas próprias solicitações (requester_id)
-- - aprovador vê solicitações atribuídas a ele (approver_id)
-- ============================================================
CREATE POLICY "approval_requests_select" ON public.approval_requests
FOR SELECT TO authenticated
USING (
  -- Super Admin pode ver todas
  public.usuario_eh_super_admin(auth.uid())
  OR
  -- Quem tem permissão processos.aprovacoes.visualizar
  public.usuario_tem_permissao(auth.uid(), 'processos.aprovacoes.visualizar')
  OR
  -- Solicitante vê suas próprias solicitações
  requester_id = auth.uid()
  OR
  -- Aprovador vê solicitações atribuídas a ele
  approver_id = auth.uid()
);

-- ============================================================
-- INSERT: super_admin, permissão ou autosserviço
-- - super_admin pode criar qualquer solicitação
-- - quem tem processos.aprovacoes.solicitar
-- - usuário pode criar solicitação para si mesmo (autosserviço)
-- ============================================================
CREATE POLICY "approval_requests_insert" ON public.approval_requests
FOR INSERT TO authenticated
WITH CHECK (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'processos.aprovacoes.solicitar')
  OR
  -- Autosserviço: usuário pode criar solicitação em seu próprio nome
  requester_id = auth.uid()
);

-- ============================================================
-- UPDATE: super_admin, permissão ou aprovador responsável
-- - super_admin pode atualizar qualquer solicitação
-- - quem tem processos.aprovacoes.aprovar
-- - aprovador responsável pode atualizar (para registrar decisão)
-- ============================================================
CREATE POLICY "approval_requests_update" ON public.approval_requests
FOR UPDATE TO authenticated
USING (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'processos.aprovacoes.aprovar')
  OR
  -- Aprovador responsável pode atualizar
  approver_id = auth.uid()
)
WITH CHECK (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'processos.aprovacoes.aprovar')
  OR
  -- Aprovador responsável pode atualizar
  approver_id = auth.uid()
);

-- ============================================================
-- DELETE: apenas super_admin (imutabilidade do registro)
-- Solicitações de aprovação não devem ser excluídas para
-- manter rastreabilidade e auditoria
-- ============================================================
CREATE POLICY "approval_requests_delete" ON public.approval_requests
FOR DELETE TO authenticated
USING (
  public.usuario_eh_super_admin(auth.uid())
);

-- ============================================================
-- FIM DA MIGRAÇÃO - public.approval_requests
-- ============================================================