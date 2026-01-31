-- ============================================================
-- ETAPA 3 - FASE 4: RLS DENY-BY-DEFAULT
-- Tabela: public.fichas_financeiras (Financeiro - crítica)
-- Contracheques/demonstrativos individuais dos servidores
-- Self-access permitido APENAS para SELECT
-- ============================================================

-- Habilitar RLS
ALTER TABLE public.fichas_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fichas_financeiras FORCE ROW LEVEL SECURITY;

-- ============================================================
-- Remover policies antigas/permissivas
-- ============================================================
DROP POLICY IF EXISTS "fichas_financeiras_select" ON public.fichas_financeiras;
DROP POLICY IF EXISTS "fichas_financeiras_insert" ON public.fichas_financeiras;
DROP POLICY IF EXISTS "fichas_financeiras_update" ON public.fichas_financeiras;
DROP POLICY IF EXISTS "fichas_financeiras_delete" ON public.fichas_financeiras;
DROP POLICY IF EXISTS "Anyone can view fichas_financeiras" ON public.fichas_financeiras;
DROP POLICY IF EXISTS "Authenticated users can view fichas_financeiras" ON public.fichas_financeiras;
DROP POLICY IF EXISTS "Admins can manage fichas_financeiras" ON public.fichas_financeiras;
DROP POLICY IF EXISTS "Financeiro can manage fichas_financeiras" ON public.fichas_financeiras;
DROP POLICY IF EXISTS "Users can view their own fichas" ON public.fichas_financeiras;

-- ============================================================
-- SELECT: super_admin, financeiro.fichas.visualizar, ou self-access
-- Self-access: o servidor vê APENAS suas próprias fichas financeiras
-- ============================================================
CREATE POLICY "fichas_financeiras_select" ON public.fichas_financeiras
FOR SELECT TO authenticated
USING (
  -- Super Admin pode ver todas
  public.usuario_eh_super_admin(auth.uid())
  OR
  -- Quem tem permissão financeiro.fichas.visualizar
  public.usuario_tem_permissao(auth.uid(), 'financeiro.fichas.visualizar')
  OR
  -- Self-access: usuário vê apenas suas próprias fichas financeiras
  EXISTS (
    SELECT 1 
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.servidor_id = fichas_financeiras.servidor_id
  )
);

-- ============================================================
-- INSERT: super_admin ou financeiro.fichas.gerar
-- NÃO há self-access para INSERT
-- ============================================================
CREATE POLICY "fichas_financeiras_insert" ON public.fichas_financeiras
FOR INSERT TO authenticated
WITH CHECK (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'financeiro.fichas.gerar')
);

-- ============================================================
-- UPDATE: super_admin ou financeiro.fichas.gerar
-- NÃO há self-access para UPDATE
-- ============================================================
CREATE POLICY "fichas_financeiras_update" ON public.fichas_financeiras
FOR UPDATE TO authenticated
USING (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'financeiro.fichas.gerar')
)
WITH CHECK (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'financeiro.fichas.gerar')
);

-- ============================================================
-- DELETE: super_admin ou financeiro.fichas.excluir
-- NÃO há self-access para DELETE
-- ============================================================
CREATE POLICY "fichas_financeiras_delete" ON public.fichas_financeiras
FOR DELETE TO authenticated
USING (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'financeiro.fichas.excluir')
);

-- ============================================================
-- FIM DA MIGRAÇÃO - public.fichas_financeiras
-- ============================================================