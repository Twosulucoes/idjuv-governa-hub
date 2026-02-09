-- Ajuste de RLS para permitir salvar (INSERT/UPDATE) no módulo de Patrimônio

-- ============================
-- BENS PATRIMONIAIS
-- ============================
-- Observação: já existe policy de SELECT. Aqui adicionamos INSERT/UPDATE/DELETE.

DROP POLICY IF EXISTS "pat_bens_patrimoniais_insert" ON public.bens_patrimoniais;
CREATE POLICY "pat_bens_patrimoniais_insert"
ON public.bens_patrimoniais
FOR INSERT
TO authenticated
WITH CHECK (
  is_active_user()
  AND (has_role('admin'::app_role) OR has_module('patrimonio'::app_module))
);

DROP POLICY IF EXISTS "pat_bens_patrimoniais_update" ON public.bens_patrimoniais;
CREATE POLICY "pat_bens_patrimoniais_update"
ON public.bens_patrimoniais
FOR UPDATE
TO authenticated
USING (
  is_active_user()
  AND (has_role('admin'::app_role) OR has_module('patrimonio'::app_module))
)
WITH CHECK (
  is_active_user()
  AND (has_role('admin'::app_role) OR has_module('patrimonio'::app_module))
);

DROP POLICY IF EXISTS "pat_bens_patrimoniais_delete" ON public.bens_patrimoniais;
CREATE POLICY "pat_bens_patrimoniais_delete"
ON public.bens_patrimoniais
FOR DELETE
TO authenticated
USING (
  is_active_user()
  AND has_role('admin'::app_role)
);

-- ============================
-- BAIXAS DE PATRIMÔNIO
-- ============================
-- Hoje existe uma policy que bloqueia DELETE. Aqui adicionamos SELECT/INSERT/UPDATE.

DROP POLICY IF EXISTS "pat_baixas_patrimonio_select" ON public.baixas_patrimonio;
CREATE POLICY "pat_baixas_patrimonio_select"
ON public.baixas_patrimonio
FOR SELECT
TO authenticated
USING (
  is_active_user()
  AND (has_role('admin'::app_role) OR has_module('patrimonio'::app_module))
);

DROP POLICY IF EXISTS "pat_baixas_patrimonio_insert" ON public.baixas_patrimonio;
CREATE POLICY "pat_baixas_patrimonio_insert"
ON public.baixas_patrimonio
FOR INSERT
TO authenticated
WITH CHECK (
  is_active_user()
  AND (has_role('admin'::app_role) OR has_module('patrimonio'::app_module))
);

DROP POLICY IF EXISTS "pat_baixas_patrimonio_update" ON public.baixas_patrimonio;
CREATE POLICY "pat_baixas_patrimonio_update"
ON public.baixas_patrimonio
FOR UPDATE
TO authenticated
USING (
  is_active_user()
  AND (has_role('admin'::app_role) OR has_module('patrimonio'::app_module))
)
WITH CHECK (
  is_active_user()
  AND (has_role('admin'::app_role) OR has_module('patrimonio'::app_module))
);
