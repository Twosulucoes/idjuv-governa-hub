-- ============================================================
-- ETAPA 3 - FASE 4: RLS DENY-BY-DEFAULT
-- Tabela: public.dependentes_irrf (Financeiro - crítica)
-- Dependentes para fins de Imposto de Renda Retido na Fonte
-- Self-access permitido APENAS para SELECT
-- ============================================================

-- Habilitar RLS
ALTER TABLE public.dependentes_irrf ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dependentes_irrf FORCE ROW LEVEL SECURITY;

-- ============================================================
-- Remover policies antigas/permissivas
-- ============================================================
DROP POLICY IF EXISTS "dependentes_irrf_select" ON public.dependentes_irrf;
DROP POLICY IF EXISTS "dependentes_irrf_insert" ON public.dependentes_irrf;
DROP POLICY IF EXISTS "dependentes_irrf_update" ON public.dependentes_irrf;
DROP POLICY IF EXISTS "dependentes_irrf_delete" ON public.dependentes_irrf;
DROP POLICY IF EXISTS "Anyone can view dependentes_irrf" ON public.dependentes_irrf;
DROP POLICY IF EXISTS "Authenticated users can view dependentes_irrf" ON public.dependentes_irrf;
DROP POLICY IF EXISTS "Admins can manage dependentes_irrf" ON public.dependentes_irrf;
DROP POLICY IF EXISTS "Financeiro can manage dependentes_irrf" ON public.dependentes_irrf;
DROP POLICY IF EXISTS "Users can view their own dependentes" ON public.dependentes_irrf;

-- ============================================================
-- SELECT: super_admin, financeiro.dependentes.visualizar, ou self-access
-- Self-access: o servidor vê APENAS seus próprios dependentes
-- ============================================================
CREATE POLICY "dependentes_irrf_select" ON public.dependentes_irrf
FOR SELECT TO authenticated
USING (
  -- Super Admin pode ver todos
  public.usuario_eh_super_admin(auth.uid())
  OR
  -- Quem tem permissão financeiro.dependentes.visualizar
  public.usuario_tem_permissao(auth.uid(), 'financeiro.dependentes.visualizar')
  OR
  -- Self-access: usuário vê apenas seus próprios dependentes
  EXISTS (
    SELECT 1 
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.servidor_id = dependentes_irrf.servidor_id
  )
);

-- ============================================================
-- INSERT: super_admin ou financeiro.dependentes.criar
-- NÃO há self-access para INSERT
-- ============================================================
CREATE POLICY "dependentes_irrf_insert" ON public.dependentes_irrf
FOR INSERT TO authenticated
WITH CHECK (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'financeiro.dependentes.criar')
);

-- ============================================================
-- UPDATE: super_admin ou financeiro.dependentes.editar
-- NÃO há self-access para UPDATE
-- ============================================================
CREATE POLICY "dependentes_irrf_update" ON public.dependentes_irrf
FOR UPDATE TO authenticated
USING (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'financeiro.dependentes.editar')
)
WITH CHECK (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'financeiro.dependentes.editar')
);

-- ============================================================
-- DELETE: super_admin ou financeiro.dependentes.excluir
-- NÃO há self-access para DELETE
-- ============================================================
CREATE POLICY "dependentes_irrf_delete" ON public.dependentes_irrf
FOR DELETE TO authenticated
USING (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'financeiro.dependentes.excluir')
);

-- ============================================================
-- FIM DA MIGRAÇÃO - public.dependentes_irrf
-- ============================================================