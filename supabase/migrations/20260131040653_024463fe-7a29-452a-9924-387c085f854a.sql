-- ============================================================
-- ETAPA 3 - FASE 5: RLS DENY-BY-DEFAULT
-- Tabela: public.portarias_servidor (Governança - Atos Administrativos)
-- Tabela de alto risco - portarias são atos oficiais imutáveis
-- ============================================================

-- Habilitar RLS
ALTER TABLE public.portarias_servidor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portarias_servidor FORCE ROW LEVEL SECURITY;

-- ============================================================
-- Remover policies antigas/permissivas
-- ============================================================
DROP POLICY IF EXISTS "portarias_servidor_select" ON public.portarias_servidor;
DROP POLICY IF EXISTS "portarias_servidor_insert" ON public.portarias_servidor;
DROP POLICY IF EXISTS "portarias_servidor_update" ON public.portarias_servidor;
DROP POLICY IF EXISTS "portarias_servidor_delete" ON public.portarias_servidor;
DROP POLICY IF EXISTS "Anyone can view portarias_servidor" ON public.portarias_servidor;
DROP POLICY IF EXISTS "Authenticated users can view portarias_servidor" ON public.portarias_servidor;
DROP POLICY IF EXISTS "Admins can manage portarias_servidor" ON public.portarias_servidor;
DROP POLICY IF EXISTS "Users can view their own portarias" ON public.portarias_servidor;
DROP POLICY IF EXISTS "Servidores podem ver suas portarias" ON public.portarias_servidor;

-- ============================================================
-- SELECT: super_admin, permissão (governança ou RH), ou servidor vinculado
-- - super_admin vê todas
-- - quem tem governanca.portarias.visualizar
-- - quem tem rh.portarias.visualizar
-- - servidor diretamente vinculado à portaria (self-access)
-- ============================================================
CREATE POLICY "portarias_servidor_select" ON public.portarias_servidor
FOR SELECT TO authenticated
USING (
  -- Super Admin pode ver todas
  public.usuario_eh_super_admin(auth.uid())
  OR
  -- Quem tem permissão governanca.portarias.visualizar
  public.usuario_tem_permissao(auth.uid(), 'governanca.portarias.visualizar')
  OR
  -- Quem tem permissão rh.portarias.visualizar
  public.usuario_tem_permissao(auth.uid(), 'rh.portarias.visualizar')
  OR
  -- Servidor vinculado à portaria (self-access via profiles.servidor_id)
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.servidor_id = portarias_servidor.servidor_id
  )
);

-- ============================================================
-- INSERT: super_admin, permissão governança ou RH
-- Portarias são criadas por setores autorizados, não autosserviço
-- ============================================================
CREATE POLICY "portarias_servidor_insert" ON public.portarias_servidor
FOR INSERT TO authenticated
WITH CHECK (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'governanca.portarias.criar')
  OR
  public.usuario_tem_permissao(auth.uid(), 'rh.portarias.criar')
);

-- ============================================================
-- UPDATE: super_admin, permissão governança ou RH
-- Apenas setores autorizados podem editar portarias
-- ============================================================
CREATE POLICY "portarias_servidor_update" ON public.portarias_servidor
FOR UPDATE TO authenticated
USING (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'governanca.portarias.editar')
  OR
  public.usuario_tem_permissao(auth.uid(), 'rh.portarias.editar')
)
WITH CHECK (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'governanca.portarias.editar')
  OR
  public.usuario_tem_permissao(auth.uid(), 'rh.portarias.editar')
);

-- ============================================================
-- DELETE: NÃO PERMITIDO
-- Portarias são atos administrativos oficiais e devem ser
-- preservadas indefinidamente para conformidade legal
-- ============================================================
CREATE POLICY "portarias_servidor_delete" ON public.portarias_servidor
FOR DELETE TO authenticated
USING (false);

-- ============================================================
-- FIM DA MIGRAÇÃO - public.portarias_servidor
-- ============================================================