-- ============================================================
-- ETAPA 3 - FASE 4: RLS DENY-BY-DEFAULT
-- Tabela: public.folhas_pagamento (Financeiro - crítica)
-- Processamento de folha de pagamento
-- NOTA: Servidor NÃO tem self-access aqui (vê via fichas_financeiras)
-- ============================================================

-- Habilitar RLS
ALTER TABLE public.folhas_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folhas_pagamento FORCE ROW LEVEL SECURITY;

-- ============================================================
-- Remover policies antigas/permissivas
-- ============================================================
DROP POLICY IF EXISTS "folhas_pagamento_select" ON public.folhas_pagamento;
DROP POLICY IF EXISTS "folhas_pagamento_insert" ON public.folhas_pagamento;
DROP POLICY IF EXISTS "folhas_pagamento_update" ON public.folhas_pagamento;
DROP POLICY IF EXISTS "folhas_pagamento_delete" ON public.folhas_pagamento;
DROP POLICY IF EXISTS "Anyone can view folhas_pagamento" ON public.folhas_pagamento;
DROP POLICY IF EXISTS "Authenticated users can view folhas_pagamento" ON public.folhas_pagamento;
DROP POLICY IF EXISTS "Admins can manage folhas_pagamento" ON public.folhas_pagamento;
DROP POLICY IF EXISTS "Financeiro can manage folhas_pagamento" ON public.folhas_pagamento;

-- ============================================================
-- SELECT: super_admin ou financeiro.folha.visualizar
-- NÃO há self-access nesta tabela
-- ============================================================
CREATE POLICY "folhas_pagamento_select" ON public.folhas_pagamento
FOR SELECT TO authenticated
USING (
  -- Super Admin pode ver todas
  public.usuario_eh_super_admin(auth.uid())
  OR
  -- Quem tem permissão financeiro.folha.visualizar
  public.usuario_tem_permissao(auth.uid(), 'financeiro.folha.visualizar')
);

-- ============================================================
-- INSERT: super_admin ou financeiro.folha.processar
-- ============================================================
CREATE POLICY "folhas_pagamento_insert" ON public.folhas_pagamento
FOR INSERT TO authenticated
WITH CHECK (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'financeiro.folha.processar')
);

-- ============================================================
-- UPDATE: super_admin ou financeiro.folha.processar
-- ============================================================
CREATE POLICY "folhas_pagamento_update" ON public.folhas_pagamento
FOR UPDATE TO authenticated
USING (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'financeiro.folha.processar')
)
WITH CHECK (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'financeiro.folha.processar')
);

-- ============================================================
-- DELETE: super_admin ou financeiro.folha.excluir
-- ============================================================
CREATE POLICY "folhas_pagamento_delete" ON public.folhas_pagamento
FOR DELETE TO authenticated
USING (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'financeiro.folha.excluir')
);

-- ============================================================
-- FIM DA MIGRAÇÃO - public.folhas_pagamento
-- ============================================================