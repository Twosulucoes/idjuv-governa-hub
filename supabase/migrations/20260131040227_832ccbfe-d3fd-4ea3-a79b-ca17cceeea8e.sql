-- ============================================================
-- ETAPA 3 - FASE 5: RLS DENY-BY-DEFAULT
-- Tabela: public.documentos (Governança - Documentos Oficiais)
-- Tabela de médio/alto risco - documentos oficiais do órgão
-- ============================================================

-- Habilitar RLS
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos FORCE ROW LEVEL SECURITY;

-- ============================================================
-- Remover policies antigas/permissivas
-- ============================================================
DROP POLICY IF EXISTS "documentos_select" ON public.documentos;
DROP POLICY IF EXISTS "documentos_insert" ON public.documentos;
DROP POLICY IF EXISTS "documentos_update" ON public.documentos;
DROP POLICY IF EXISTS "documentos_delete" ON public.documentos;
DROP POLICY IF EXISTS "Anyone can view documentos" ON public.documentos;
DROP POLICY IF EXISTS "Authenticated users can view documentos" ON public.documentos;
DROP POLICY IF EXISTS "Admins can manage documentos" ON public.documentos;
DROP POLICY IF EXISTS "Users can view their own documentos" ON public.documentos;
DROP POLICY IF EXISTS "Documentos públicos são visíveis" ON public.documentos;
DROP POLICY IF EXISTS "Public documents visible to all" ON public.documentos;

-- ============================================================
-- SELECT: super_admin, permissão ou autor
-- - super_admin vê todos
-- - quem tem governanca.documentos.visualizar
-- - autor do documento (created_by)
-- ============================================================
CREATE POLICY "documentos_select" ON public.documentos
FOR SELECT TO authenticated
USING (
  -- Super Admin pode ver todos
  public.usuario_eh_super_admin(auth.uid())
  OR
  -- Quem tem permissão governanca.documentos.visualizar
  public.usuario_tem_permissao(auth.uid(), 'governanca.documentos.visualizar')
  OR
  -- Autor do documento
  created_by = auth.uid()
);

-- ============================================================
-- INSERT: super_admin, permissão ou autosserviço (autor)
-- - super_admin pode criar qualquer documento
-- - quem tem governanca.documentos.criar
-- - autosserviço: usuário pode criar documento em seu nome
--   desde que created_by = auth.uid()
-- ============================================================
CREATE POLICY "documentos_insert" ON public.documentos
FOR INSERT TO authenticated
WITH CHECK (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'governanca.documentos.criar')
  OR
  -- Autosserviço: autor pode criar documento em seu nome
  created_by = auth.uid()
);

-- ============================================================
-- UPDATE: super_admin, permissão ou autor
-- - super_admin pode atualizar qualquer documento
-- - quem tem governanca.documentos.editar
-- - autor pode atualizar seu próprio documento
-- ============================================================
CREATE POLICY "documentos_update" ON public.documentos
FOR UPDATE TO authenticated
USING (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'governanca.documentos.editar')
  OR
  -- Autor pode atualizar seu próprio documento
  created_by = auth.uid()
)
WITH CHECK (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'governanca.documentos.editar')
  OR
  -- Autor pode atualizar seu próprio documento
  created_by = auth.uid()
);

-- ============================================================
-- DELETE: apenas super_admin (preservar histórico)
-- Documentos oficiais não devem ser excluídos para
-- manter rastreabilidade e conformidade legal
-- ============================================================
CREATE POLICY "documentos_delete" ON public.documentos
FOR DELETE TO authenticated
USING (
  public.usuario_eh_super_admin(auth.uid())
);

-- ============================================================
-- FIM DA MIGRAÇÃO - public.documentos
-- ============================================================