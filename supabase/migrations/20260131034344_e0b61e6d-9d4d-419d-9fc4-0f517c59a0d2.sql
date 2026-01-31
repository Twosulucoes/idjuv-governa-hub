-- ============================================================
-- ETAPA 3 - FASE 3: RLS DENY-BY-DEFAULT
-- Tabela: public.lotacoes (RH - crítica)
-- Lotação/movimentação interna do servidor
-- ============================================================

-- Habilitar RLS
ALTER TABLE public.lotacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotacoes FORCE ROW LEVEL SECURITY;

-- ============================================================
-- Remover policies antigas/permissivas
-- ============================================================
DROP POLICY IF EXISTS "lotacoes_select" ON public.lotacoes;
DROP POLICY IF EXISTS "lotacoes_insert" ON public.lotacoes;
DROP POLICY IF EXISTS "lotacoes_update" ON public.lotacoes;
DROP POLICY IF EXISTS "lotacoes_delete" ON public.lotacoes;
DROP POLICY IF EXISTS "Anyone can view lotacoes" ON public.lotacoes;
DROP POLICY IF EXISTS "Authenticated users can view lotacoes" ON public.lotacoes;
DROP POLICY IF EXISTS "Admins can manage lotacoes" ON public.lotacoes;
DROP POLICY IF EXISTS "RH can manage lotacoes" ON public.lotacoes;
DROP POLICY IF EXISTS "Users can view their own lotacoes" ON public.lotacoes;

-- ============================================================
-- SELECT: super_admin, rh.lotacoes.visualizar, ou self-access
-- Self-access: o servidor vê APENAS suas próprias lotações
-- ============================================================
CREATE POLICY "lotacoes_select" ON public.lotacoes
FOR SELECT TO authenticated
USING (
  -- Super Admin pode ver todas
  public.usuario_eh_super_admin(auth.uid())
  OR
  -- Quem tem permissão rh.lotacoes.visualizar
  public.usuario_tem_permissao(auth.uid(), 'rh.lotacoes.visualizar')
  OR
  -- Self-access: usuário vê apenas suas próprias lotações
  EXISTS (
    SELECT 1 
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.servidor_id = lotacoes.servidor_id
  )
);

-- ============================================================
-- INSERT: super_admin ou rh.lotacoes.criar
-- ============================================================
CREATE POLICY "lotacoes_insert" ON public.lotacoes
FOR INSERT TO authenticated
WITH CHECK (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'rh.lotacoes.criar')
);

-- ============================================================
-- UPDATE: super_admin ou rh.lotacoes.editar
-- ============================================================
CREATE POLICY "lotacoes_update" ON public.lotacoes
FOR UPDATE TO authenticated
USING (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'rh.lotacoes.editar')
)
WITH CHECK (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'rh.lotacoes.editar')
);

-- ============================================================
-- DELETE: super_admin ou rh.lotacoes.excluir
-- ============================================================
CREATE POLICY "lotacoes_delete" ON public.lotacoes
FOR DELETE TO authenticated
USING (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'rh.lotacoes.excluir')
);

-- ============================================================
-- FIM DA MIGRAÇÃO - public.lotacoes
-- ============================================================