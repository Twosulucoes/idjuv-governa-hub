-- ============================================================
-- ETAPA 3 - FASE 4: RLS DENY-BY-DEFAULT
-- Tabela: public.consignacoes (Financeiro - crítica)
-- Consignações/descontos em folha de pagamento
-- Self-access permitido APENAS para SELECT
-- ============================================================

-- Habilitar RLS
ALTER TABLE public.consignacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consignacoes FORCE ROW LEVEL SECURITY;

-- ============================================================
-- Remover policies antigas/permissivas
-- ============================================================
DROP POLICY IF EXISTS "consignacoes_select" ON public.consignacoes;
DROP POLICY IF EXISTS "consignacoes_insert" ON public.consignacoes;
DROP POLICY IF EXISTS "consignacoes_update" ON public.consignacoes;
DROP POLICY IF EXISTS "consignacoes_delete" ON public.consignacoes;
DROP POLICY IF EXISTS "Anyone can view consignacoes" ON public.consignacoes;
DROP POLICY IF EXISTS "Authenticated users can view consignacoes" ON public.consignacoes;
DROP POLICY IF EXISTS "Admins can manage consignacoes" ON public.consignacoes;
DROP POLICY IF EXISTS "Financeiro can manage consignacoes" ON public.consignacoes;
DROP POLICY IF EXISTS "Users can view their own consignacoes" ON public.consignacoes;

-- ============================================================
-- SELECT: super_admin, financeiro.consignacoes.visualizar, ou self-access
-- Self-access: o servidor vê APENAS suas próprias consignações
-- ============================================================
CREATE POLICY "consignacoes_select" ON public.consignacoes
FOR SELECT TO authenticated
USING (
  -- Super Admin pode ver todas
  public.usuario_eh_super_admin(auth.uid())
  OR
  -- Quem tem permissão financeiro.consignacoes.visualizar
  public.usuario_tem_permissao(auth.uid(), 'financeiro.consignacoes.visualizar')
  OR
  -- Self-access: usuário vê apenas suas próprias consignações
  EXISTS (
    SELECT 1 
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.servidor_id = consignacoes.servidor_id
  )
);

-- ============================================================
-- INSERT: super_admin ou financeiro.consignacoes.criar
-- NÃO há self-access para INSERT
-- ============================================================
CREATE POLICY "consignacoes_insert" ON public.consignacoes
FOR INSERT TO authenticated
WITH CHECK (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'financeiro.consignacoes.criar')
);

-- ============================================================
-- UPDATE: super_admin ou financeiro.consignacoes.editar
-- NÃO há self-access para UPDATE
-- ============================================================
CREATE POLICY "consignacoes_update" ON public.consignacoes
FOR UPDATE TO authenticated
USING (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'financeiro.consignacoes.editar')
)
WITH CHECK (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'financeiro.consignacoes.editar')
);

-- ============================================================
-- DELETE: super_admin ou financeiro.consignacoes.excluir
-- NÃO há self-access para DELETE
-- ============================================================
CREATE POLICY "consignacoes_delete" ON public.consignacoes
FOR DELETE TO authenticated
USING (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'financeiro.consignacoes.excluir')
);

-- ============================================================
-- FIM DA MIGRAÇÃO - public.consignacoes
-- ============================================================