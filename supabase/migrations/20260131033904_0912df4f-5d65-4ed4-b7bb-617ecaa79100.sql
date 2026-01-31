-- ============================================================
-- ETAPA 3 - FASE 3: RLS DENY-BY-DEFAULT
-- Tabela: public.cessoes (RH - crítica)
-- ============================================================

-- Habilitar RLS
ALTER TABLE public.cessoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cessoes FORCE ROW LEVEL SECURITY;

-- ============================================================
-- Remover policies antigas/permissivas
-- ============================================================
DROP POLICY IF EXISTS "cessoes_select" ON public.cessoes;
DROP POLICY IF EXISTS "cessoes_insert" ON public.cessoes;
DROP POLICY IF EXISTS "cessoes_update" ON public.cessoes;
DROP POLICY IF EXISTS "cessoes_delete" ON public.cessoes;
DROP POLICY IF EXISTS "Anyone can view cessoes" ON public.cessoes;
DROP POLICY IF EXISTS "Authenticated users can view cessoes" ON public.cessoes;
DROP POLICY IF EXISTS "Admins can manage cessoes" ON public.cessoes;
DROP POLICY IF EXISTS "RH can manage cessoes" ON public.cessoes;

-- ============================================================
-- SELECT: super_admin, rh.cessoes.visualizar, ou self-access
-- Self-access: o servidor vê APENAS suas próprias cessões
-- ============================================================
CREATE POLICY "cessoes_select" ON public.cessoes
FOR SELECT TO authenticated
USING (
  -- Super Admin pode ver todas
  public.usuario_eh_super_admin(auth.uid())
  OR
  -- Quem tem permissão rh.cessoes.visualizar
  public.usuario_tem_permissao(auth.uid(), 'rh.cessoes.visualizar')
  OR
  -- Self-access: usuário vê apenas suas próprias cessões
  -- Verifica se o servidor_id da cessão pertence ao usuário atual
  EXISTS (
    SELECT 1 
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.servidor_id = cessoes.servidor_id
  )
);

-- ============================================================
-- INSERT: super_admin ou rh.cessoes.criar
-- ============================================================
CREATE POLICY "cessoes_insert" ON public.cessoes
FOR INSERT TO authenticated
WITH CHECK (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'rh.cessoes.criar')
);

-- ============================================================
-- UPDATE: super_admin ou rh.cessoes.editar
-- ============================================================
CREATE POLICY "cessoes_update" ON public.cessoes
FOR UPDATE TO authenticated
USING (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'rh.cessoes.editar')
)
WITH CHECK (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'rh.cessoes.editar')
);

-- ============================================================
-- DELETE: super_admin ou rh.cessoes.excluir
-- ============================================================
CREATE POLICY "cessoes_delete" ON public.cessoes
FOR DELETE TO authenticated
USING (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'rh.cessoes.excluir')
);

-- ============================================================
-- FIM DA MIGRAÇÃO - public.cessoes
-- ============================================================