-- ============================================================
-- ETAPA 3 - FASE 5: RLS DENY-BY-DEFAULT
-- Tabela: public.demandas_ascom (Comunicação Institucional)
-- Tabela de médio risco - demandas de comunicação
-- ============================================================

-- Habilitar RLS
ALTER TABLE public.demandas_ascom ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demandas_ascom FORCE ROW LEVEL SECURITY;

-- ============================================================
-- Remover policies antigas/permissivas
-- ============================================================
DROP POLICY IF EXISTS "demandas_ascom_select" ON public.demandas_ascom;
DROP POLICY IF EXISTS "demandas_ascom_insert" ON public.demandas_ascom;
DROP POLICY IF EXISTS "demandas_ascom_update" ON public.demandas_ascom;
DROP POLICY IF EXISTS "demandas_ascom_delete" ON public.demandas_ascom;
DROP POLICY IF EXISTS "Anyone can view demandas_ascom" ON public.demandas_ascom;
DROP POLICY IF EXISTS "Authenticated users can view demandas_ascom" ON public.demandas_ascom;
DROP POLICY IF EXISTS "Admins can manage demandas_ascom" ON public.demandas_ascom;
DROP POLICY IF EXISTS "Users can view their own demandas" ON public.demandas_ascom;
DROP POLICY IF EXISTS "Solicitantes podem ver suas demandas" ON public.demandas_ascom;
DROP POLICY IF EXISTS "ASCOM pode ver demandas" ON public.demandas_ascom;
DROP POLICY IF EXISTS "Usuários autenticados podem criar demandas" ON public.demandas_ascom;

-- ============================================================
-- SELECT: super_admin, permissão, solicitante, ou equipe ASCOM
-- - super_admin vê todas
-- - quem tem ascom.demandas.visualizar
-- - quem tem ascom.demandas.tratar (equipe ASCOM)
-- - solicitante da demanda (created_by)
-- - servidor vinculado como solicitante (servidor_solicitante_id)
-- ============================================================
CREATE POLICY "demandas_ascom_select" ON public.demandas_ascom
FOR SELECT TO authenticated
USING (
  -- Super Admin pode ver todas
  public.usuario_eh_super_admin(auth.uid())
  OR
  -- Quem tem permissão ascom.demandas.visualizar
  public.usuario_tem_permissao(auth.uid(), 'ascom.demandas.visualizar')
  OR
  -- Equipe ASCOM (pode tratar demandas)
  public.usuario_tem_permissao(auth.uid(), 'ascom.demandas.tratar')
  OR
  -- Criador da demanda
  created_by = auth.uid()
  OR
  -- Servidor vinculado como solicitante (self-access)
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.servidor_id = demandas_ascom.servidor_solicitante_id
  )
);

-- ============================================================
-- INSERT: super_admin, permissão, ou autosserviço
-- - super_admin pode criar qualquer demanda
-- - quem tem ascom.demandas.criar
-- - autosserviço: qualquer usuário autenticado pode criar
--   desde que created_by = auth.uid()
-- ============================================================
CREATE POLICY "demandas_ascom_insert" ON public.demandas_ascom
FOR INSERT TO authenticated
WITH CHECK (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'ascom.demandas.criar')
  OR
  -- Autosserviço: usuário pode criar demanda em seu nome
  created_by = auth.uid()
);

-- ============================================================
-- UPDATE: super_admin ou equipe ASCOM
-- - super_admin pode atualizar qualquer demanda
-- - equipe ASCOM (permissão ascom.demandas.tratar)
-- NOTA: Solicitante NÃO pode editar após envio
-- ============================================================
CREATE POLICY "demandas_ascom_update" ON public.demandas_ascom
FOR UPDATE TO authenticated
USING (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'ascom.demandas.tratar')
)
WITH CHECK (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'ascom.demandas.tratar')
);

-- ============================================================
-- DELETE: NÃO PERMITIDO
-- Demandas de comunicação devem ser preservadas para
-- histórico institucional e auditoria
-- ============================================================
CREATE POLICY "demandas_ascom_delete" ON public.demandas_ascom
FOR DELETE TO authenticated
USING (false);

-- ============================================================
-- FIM DA MIGRAÇÃO - public.demandas_ascom
-- ============================================================