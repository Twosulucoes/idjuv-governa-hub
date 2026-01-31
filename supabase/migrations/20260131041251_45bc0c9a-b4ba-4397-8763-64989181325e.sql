-- ============================================================
-- ETAPA 3 - FASE 5: RLS DENY-BY-DEFAULT
-- Tabela: public.viagens_diarias (Viagens e Diárias)
-- Tabela de médio risco - controle de viagens e diárias
-- ============================================================

-- Habilitar RLS
ALTER TABLE public.viagens_diarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viagens_diarias FORCE ROW LEVEL SECURITY;

-- ============================================================
-- Remover policies antigas/permissivas
-- ============================================================
DROP POLICY IF EXISTS "viagens_diarias_select" ON public.viagens_diarias;
DROP POLICY IF EXISTS "viagens_diarias_insert" ON public.viagens_diarias;
DROP POLICY IF EXISTS "viagens_diarias_update" ON public.viagens_diarias;
DROP POLICY IF EXISTS "viagens_diarias_delete" ON public.viagens_diarias;
DROP POLICY IF EXISTS "Anyone can view viagens_diarias" ON public.viagens_diarias;
DROP POLICY IF EXISTS "Authenticated users can view viagens_diarias" ON public.viagens_diarias;
DROP POLICY IF EXISTS "Admins can manage viagens_diarias" ON public.viagens_diarias;
DROP POLICY IF EXISTS "Users can view their own viagens" ON public.viagens_diarias;
DROP POLICY IF EXISTS "Servidores podem ver suas viagens" ON public.viagens_diarias;

-- ============================================================
-- SELECT: super_admin, permissão, criador, ou servidor vinculado
-- - super_admin vê todas
-- - quem tem rh.viagens.visualizar
-- - quem tem financeiro.diarias.visualizar
-- - criador da solicitação (created_by)
-- - servidor vinculado à viagem (self-access via profiles.servidor_id)
-- ============================================================
CREATE POLICY "viagens_diarias_select" ON public.viagens_diarias
FOR SELECT TO authenticated
USING (
  -- Super Admin pode ver todas
  public.usuario_eh_super_admin(auth.uid())
  OR
  -- Quem tem permissão rh.viagens.visualizar
  public.usuario_tem_permissao(auth.uid(), 'rh.viagens.visualizar')
  OR
  -- Quem tem permissão financeiro.diarias.visualizar
  public.usuario_tem_permissao(auth.uid(), 'financeiro.diarias.visualizar')
  OR
  -- Criador da solicitação
  created_by = auth.uid()
  OR
  -- Servidor vinculado à viagem (self-access)
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.servidor_id = viagens_diarias.servidor_id
  )
);

-- ============================================================
-- INSERT: super_admin, permissão, ou autosserviço
-- - super_admin pode criar qualquer registro
-- - quem tem rh.viagens.criar
-- - quem tem financeiro.diarias.criar
-- - autosserviço: servidor pode solicitar viagem para si
--   (created_by = auth.uid() E servidor_id = seu próprio)
-- ============================================================
CREATE POLICY "viagens_diarias_insert" ON public.viagens_diarias
FOR INSERT TO authenticated
WITH CHECK (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'rh.viagens.criar')
  OR
  public.usuario_tem_permissao(auth.uid(), 'financeiro.diarias.criar')
  OR
  -- Autosserviço: usuário pode criar solicitação em seu nome
  (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.servidor_id = viagens_diarias.servidor_id
    )
  )
);

-- ============================================================
-- UPDATE: super_admin ou permissão
-- - super_admin pode atualizar qualquer registro
-- - quem tem rh.viagens.editar
-- - quem tem financeiro.diarias.editar
-- NOTA: Servidor NÃO pode editar após submissão (controle de fluxo)
-- ============================================================
CREATE POLICY "viagens_diarias_update" ON public.viagens_diarias
FOR UPDATE TO authenticated
USING (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'rh.viagens.editar')
  OR
  public.usuario_tem_permissao(auth.uid(), 'financeiro.diarias.editar')
)
WITH CHECK (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'rh.viagens.editar')
  OR
  public.usuario_tem_permissao(auth.uid(), 'financeiro.diarias.editar')
);

-- ============================================================
-- DELETE: NÃO PERMITIDO
-- Viagens e diárias são registros contábeis/administrativos
-- e devem ser preservados para auditoria
-- ============================================================
CREATE POLICY "viagens_diarias_delete" ON public.viagens_diarias
FOR DELETE TO authenticated
USING (false);

-- ============================================================
-- FIM DA MIGRAÇÃO - public.viagens_diarias
-- ============================================================