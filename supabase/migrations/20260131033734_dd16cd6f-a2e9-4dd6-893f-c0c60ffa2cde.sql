-- ============================================================
-- ETAPA 3 - FASE 3: RLS DENY-BY-DEFAULT
-- Tabela: public.provimentos (RH - crítica)
-- ============================================================

-- Habilitar RLS
ALTER TABLE public.provimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provimentos FORCE ROW LEVEL SECURITY;

-- ============================================================
-- Remover policies antigas/permissivas
-- ============================================================
DROP POLICY IF EXISTS "provimentos_select" ON public.provimentos;
DROP POLICY IF EXISTS "provimentos_insert" ON public.provimentos;
DROP POLICY IF EXISTS "provimentos_update" ON public.provimentos;
DROP POLICY IF EXISTS "provimentos_delete" ON public.provimentos;
DROP POLICY IF EXISTS "Anyone can view provimentos" ON public.provimentos;
DROP POLICY IF EXISTS "Authenticated users can view provimentos" ON public.provimentos;
DROP POLICY IF EXISTS "Admins can manage provimentos" ON public.provimentos;
DROP POLICY IF EXISTS "RH can manage provimentos" ON public.provimentos;

-- ============================================================
-- SELECT: super_admin, rh.provimentos.visualizar, ou self-access
-- Self-access: o servidor vê APENAS seus próprios provimentos
-- ============================================================
CREATE POLICY "provimentos_select" ON public.provimentos
FOR SELECT TO authenticated
USING (
  -- Super Admin pode ver todos
  public.usuario_eh_super_admin(auth.uid())
  OR
  -- Quem tem permissão rh.provimentos.visualizar
  public.usuario_tem_permissao(auth.uid(), 'rh.provimentos.visualizar')
  OR
  -- Self-access: usuário vê apenas seus próprios provimentos
  -- Verifica se o servidor_id do provimento pertence ao usuário atual
  EXISTS (
    SELECT 1 
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.servidor_id = provimentos.servidor_id
  )
);

-- ============================================================
-- INSERT: super_admin ou rh.provimentos.criar
-- ============================================================
CREATE POLICY "provimentos_insert" ON public.provimentos
FOR INSERT TO authenticated
WITH CHECK (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'rh.provimentos.criar')
);

-- ============================================================
-- UPDATE: super_admin ou rh.provimentos.editar
-- ============================================================
CREATE POLICY "provimentos_update" ON public.provimentos
FOR UPDATE TO authenticated
USING (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'rh.provimentos.editar')
)
WITH CHECK (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'rh.provimentos.editar')
);

-- ============================================================
-- DELETE: super_admin ou rh.provimentos.excluir
-- ============================================================
CREATE POLICY "provimentos_delete" ON public.provimentos
FOR DELETE TO authenticated
USING (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'rh.provimentos.excluir')
);

-- ============================================================
-- FIM DA MIGRAÇÃO - public.provimentos
-- ============================================================