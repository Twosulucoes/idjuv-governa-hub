-- ============================================================
-- ETAPA 3 - FASE 3: RLS DENY-BY-DEFAULT
-- Tabela: public.servidores (RH - crítica)
-- ============================================================

-- Habilitar RLS
ALTER TABLE public.servidores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servidores FORCE ROW LEVEL SECURITY;

-- ============================================================
-- Remover policies antigas/permissivas
-- ============================================================
DROP POLICY IF EXISTS "servidores_select" ON public.servidores;
DROP POLICY IF EXISTS "servidores_insert" ON public.servidores;
DROP POLICY IF EXISTS "servidores_update" ON public.servidores;
DROP POLICY IF EXISTS "servidores_delete" ON public.servidores;
DROP POLICY IF EXISTS "Anyone can view servidores" ON public.servidores;
DROP POLICY IF EXISTS "Admins can manage servidores" ON public.servidores;
DROP POLICY IF EXISTS "Authenticated users can view servidores" ON public.servidores;
DROP POLICY IF EXISTS "RH can manage servidores" ON public.servidores;

-- ============================================================
-- SELECT: super_admin, rh.servidores.visualizar, ou self-access
-- Self-access: o servidor vê APENAS o próprio registro
-- ============================================================
CREATE POLICY "servidores_select" ON public.servidores
FOR SELECT TO authenticated
USING (
  -- Super Admin pode ver todos
  public.usuario_eh_super_admin(auth.uid())
  OR
  -- Quem tem permissão rh.servidores.visualizar
  public.usuario_tem_permissao(auth.uid(), 'rh.servidores.visualizar')
  OR
  -- Self-access: usuário vê apenas seu próprio registro de servidor
  -- Verifica se o profile do usuário atual está vinculado a este servidor
  EXISTS (
    SELECT 1 
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.servidor_id = servidores.id
  )
);

-- ============================================================
-- INSERT: super_admin ou rh.servidores.criar
-- ============================================================
CREATE POLICY "servidores_insert" ON public.servidores
FOR INSERT TO authenticated
WITH CHECK (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'rh.servidores.criar')
);

-- ============================================================
-- UPDATE: super_admin ou rh.servidores.editar
-- ============================================================
CREATE POLICY "servidores_update" ON public.servidores
FOR UPDATE TO authenticated
USING (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'rh.servidores.editar')
)
WITH CHECK (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'rh.servidores.editar')
);

-- ============================================================
-- DELETE: super_admin ou rh.servidores.excluir
-- ============================================================
CREATE POLICY "servidores_delete" ON public.servidores
FOR DELETE TO authenticated
USING (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'rh.servidores.excluir')
);

-- ============================================================
-- FIM DA MIGRAÇÃO - public.servidores
-- ============================================================