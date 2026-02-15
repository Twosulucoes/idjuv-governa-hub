
-- ============================================================
-- FASE 3A: RLS de escrita para tabelas funcionais do RH
-- Padrão: INSERT/UPDATE = admin OR módulo rh
--         DELETE = apenas admin
--         SELECT existente mantido + fallback admin/rh
-- ============================================================

-- ==================== CESSOES ====================
-- Adicionar SELECT para admin/rh (complementa a policy existente)
CREATE POLICY "rh_cessoes_select_admin"
ON public.cessoes FOR SELECT
TO authenticated
USING (has_role('admin'::app_role) OR has_module('rh'::app_module));

CREATE POLICY "rh_cessoes_insert"
ON public.cessoes FOR INSERT
TO authenticated
WITH CHECK (has_role('admin'::app_role) OR has_module('rh'::app_module));

CREATE POLICY "rh_cessoes_update"
ON public.cessoes FOR UPDATE
TO authenticated
USING (has_role('admin'::app_role) OR has_module('rh'::app_module))
WITH CHECK (has_role('admin'::app_role) OR has_module('rh'::app_module));

CREATE POLICY "rh_cessoes_delete"
ON public.cessoes FOR DELETE
TO authenticated
USING (has_role('admin'::app_role));

-- ==================== FERIAS_SERVIDOR ====================
CREATE POLICY "rh_ferias_select_admin"
ON public.ferias_servidor FOR SELECT
TO authenticated
USING (has_role('admin'::app_role) OR has_module('rh'::app_module));

CREATE POLICY "rh_ferias_insert"
ON public.ferias_servidor FOR INSERT
TO authenticated
WITH CHECK (has_role('admin'::app_role) OR has_module('rh'::app_module));

CREATE POLICY "rh_ferias_update"
ON public.ferias_servidor FOR UPDATE
TO authenticated
USING (has_role('admin'::app_role) OR has_module('rh'::app_module))
WITH CHECK (has_role('admin'::app_role) OR has_module('rh'::app_module));

CREATE POLICY "rh_ferias_delete"
ON public.ferias_servidor FOR DELETE
TO authenticated
USING (has_role('admin'::app_role));

-- ==================== HISTORICO_FUNCIONAL ====================
CREATE POLICY "rh_historico_select_admin"
ON public.historico_funcional FOR SELECT
TO authenticated
USING (has_role('admin'::app_role) OR has_module('rh'::app_module));

CREATE POLICY "rh_historico_insert"
ON public.historico_funcional FOR INSERT
TO authenticated
WITH CHECK (has_role('admin'::app_role) OR has_module('rh'::app_module));

CREATE POLICY "rh_historico_update"
ON public.historico_funcional FOR UPDATE
TO authenticated
USING (has_role('admin'::app_role) OR has_module('rh'::app_module))
WITH CHECK (has_role('admin'::app_role) OR has_module('rh'::app_module));

-- Histórico funcional NÃO deve ser deletável (imutabilidade)
-- Apenas admin pode deletar em casos excepcionais
CREATE POLICY "rh_historico_delete"
ON public.historico_funcional FOR DELETE
TO authenticated
USING (has_role('admin'::app_role));

-- ==================== LICENCAS_AFASTAMENTOS ====================
CREATE POLICY "rh_licencas_select_admin"
ON public.licencas_afastamentos FOR SELECT
TO authenticated
USING (has_role('admin'::app_role) OR has_module('rh'::app_module));

CREATE POLICY "rh_licencas_insert"
ON public.licencas_afastamentos FOR INSERT
TO authenticated
WITH CHECK (has_role('admin'::app_role) OR has_module('rh'::app_module));

CREATE POLICY "rh_licencas_update"
ON public.licencas_afastamentos FOR UPDATE
TO authenticated
USING (has_role('admin'::app_role) OR has_module('rh'::app_module))
WITH CHECK (has_role('admin'::app_role) OR has_module('rh'::app_module));

CREATE POLICY "rh_licencas_delete"
ON public.licencas_afastamentos FOR DELETE
TO authenticated
USING (has_role('admin'::app_role));
