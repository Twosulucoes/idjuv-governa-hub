-- ============================================================
-- ETAPA 3 - FASE 3: RLS DENY-BY-DEFAULT
-- Tabela: public.licencas_afastamentos (RH - crítica)
-- ============================================================

-- Habilitar RLS
ALTER TABLE public.licencas_afastamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licencas_afastamentos FORCE ROW LEVEL SECURITY;

-- ============================================================
-- Remover policies antigas/permissivas
-- ============================================================
DROP POLICY IF EXISTS "licencas_afastamentos_select" ON public.licencas_afastamentos;
DROP POLICY IF EXISTS "licencas_afastamentos_insert" ON public.licencas_afastamentos;
DROP POLICY IF EXISTS "licencas_afastamentos_update" ON public.licencas_afastamentos;
DROP POLICY IF EXISTS "licencas_afastamentos_delete" ON public.licencas_afastamentos;
DROP POLICY IF EXISTS "Anyone can view licencas_afastamentos" ON public.licencas_afastamentos;
DROP POLICY IF EXISTS "Authenticated users can view licencas_afastamentos" ON public.licencas_afastamentos;
DROP POLICY IF EXISTS "Admins can manage licencas_afastamentos" ON public.licencas_afastamentos;
DROP POLICY IF EXISTS "RH can manage licencas_afastamentos" ON public.licencas_afastamentos;

-- ============================================================
-- SELECT: super_admin, rh.licencas.visualizar, ou self-access
-- Self-access: o servidor vê APENAS suas próprias licenças/afastamentos
-- ============================================================
CREATE POLICY "licencas_afastamentos_select" ON public.licencas_afastamentos
FOR SELECT TO authenticated
USING (
  -- Super Admin pode ver todas
  public.usuario_eh_super_admin(auth.uid())
  OR
  -- Quem tem permissão rh.licencas.visualizar
  public.usuario_tem_permissao(auth.uid(), 'rh.licencas.visualizar')
  OR
  -- Self-access: usuário vê apenas suas próprias licenças/afastamentos
  EXISTS (
    SELECT 1 
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.servidor_id = licencas_afastamentos.servidor_id
  )
);

-- ============================================================
-- INSERT: super_admin ou rh.licencas.criar
-- ============================================================
CREATE POLICY "licencas_afastamentos_insert" ON public.licencas_afastamentos
FOR INSERT TO authenticated
WITH CHECK (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'rh.licencas.criar')
);

-- ============================================================
-- UPDATE: super_admin ou rh.licencas.editar
-- ============================================================
CREATE POLICY "licencas_afastamentos_update" ON public.licencas_afastamentos
FOR UPDATE TO authenticated
USING (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'rh.licencas.editar')
)
WITH CHECK (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'rh.licencas.editar')
);

-- ============================================================
-- DELETE: super_admin ou rh.licencas.excluir
-- ============================================================
CREATE POLICY "licencas_afastamentos_delete" ON public.licencas_afastamentos
FOR DELETE TO authenticated
USING (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'rh.licencas.excluir')
);

-- ============================================================
-- FIM DA MIGRAÇÃO - public.licencas_afastamentos
-- ============================================================