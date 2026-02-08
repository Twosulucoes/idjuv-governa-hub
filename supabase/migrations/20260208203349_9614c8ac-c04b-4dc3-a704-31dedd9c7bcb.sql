
-- ============================================
-- Políticas RLS para Módulo PROCESSOS
-- Acesso: admin OU módulo 'workflow' (gestão de processos)
-- ============================================

-- 1. PROCESSOS_ADMINISTRATIVOS
CREATE POLICY "proc_processos_administrativos_select" ON public.processos_administrativos FOR SELECT TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('workflow'::app_module));

CREATE POLICY "proc_processos_administrativos_insert" ON public.processos_administrativos FOR INSERT TO authenticated
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('workflow'::app_module));

CREATE POLICY "proc_processos_administrativos_update" ON public.processos_administrativos FOR UPDATE TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('workflow'::app_module))
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('workflow'::app_module));

CREATE POLICY "proc_processos_administrativos_delete" ON public.processos_administrativos FOR DELETE TO authenticated
USING (public.has_role('admin'::app_role));

-- 2. DOCUMENTOS_PROCESSO
CREATE POLICY "proc_documentos_processo_select" ON public.documentos_processo FOR SELECT TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('workflow'::app_module));

CREATE POLICY "proc_documentos_processo_insert" ON public.documentos_processo FOR INSERT TO authenticated
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('workflow'::app_module));

CREATE POLICY "proc_documentos_processo_update" ON public.documentos_processo FOR UPDATE TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('workflow'::app_module))
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('workflow'::app_module));

CREATE POLICY "proc_documentos_processo_delete" ON public.documentos_processo FOR DELETE TO authenticated
USING (public.has_role('admin'::app_role));

-- 3. DESPACHOS
CREATE POLICY "proc_despachos_select" ON public.despachos FOR SELECT TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('workflow'::app_module));

CREATE POLICY "proc_despachos_insert" ON public.despachos FOR INSERT TO authenticated
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('workflow'::app_module));

CREATE POLICY "proc_despachos_update" ON public.despachos FOR UPDATE TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('workflow'::app_module))
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('workflow'::app_module));

CREATE POLICY "proc_despachos_delete" ON public.despachos FOR DELETE TO authenticated
USING (public.has_role('admin'::app_role));

-- 4. ENCAMINHAMENTOS
CREATE POLICY "proc_encaminhamentos_select" ON public.encaminhamentos FOR SELECT TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('workflow'::app_module));

CREATE POLICY "proc_encaminhamentos_insert" ON public.encaminhamentos FOR INSERT TO authenticated
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('workflow'::app_module));

CREATE POLICY "proc_encaminhamentos_update" ON public.encaminhamentos FOR UPDATE TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('workflow'::app_module))
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('workflow'::app_module));

CREATE POLICY "proc_encaminhamentos_delete" ON public.encaminhamentos FOR DELETE TO authenticated
USING (public.has_role('admin'::app_role));

-- 5. MOVIMENTACOES_PROCESSO
CREATE POLICY "proc_movimentacoes_processo_select" ON public.movimentacoes_processo FOR SELECT TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('workflow'::app_module));

CREATE POLICY "proc_movimentacoes_processo_insert" ON public.movimentacoes_processo FOR INSERT TO authenticated
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('workflow'::app_module));

CREATE POLICY "proc_movimentacoes_processo_update" ON public.movimentacoes_processo FOR UPDATE TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('workflow'::app_module))
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('workflow'::app_module));

CREATE POLICY "proc_movimentacoes_processo_delete" ON public.movimentacoes_processo FOR DELETE TO authenticated
USING (public.has_role('admin'::app_role));

-- 6. PRAZOS_PROCESSO
CREATE POLICY "proc_prazos_processo_select" ON public.prazos_processo FOR SELECT TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('workflow'::app_module));

CREATE POLICY "proc_prazos_processo_insert" ON public.prazos_processo FOR INSERT TO authenticated
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('workflow'::app_module));

CREATE POLICY "proc_prazos_processo_update" ON public.prazos_processo FOR UPDATE TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('workflow'::app_module))
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('workflow'::app_module));

CREATE POLICY "proc_prazos_processo_delete" ON public.prazos_processo FOR DELETE TO authenticated
USING (public.has_role('admin'::app_role));

-- 7. PARECERES_TECNICOS
CREATE POLICY "proc_pareceres_tecnicos_select" ON public.pareceres_tecnicos FOR SELECT TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('workflow'::app_module));

CREATE POLICY "proc_pareceres_tecnicos_insert" ON public.pareceres_tecnicos FOR INSERT TO authenticated
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('workflow'::app_module));

CREATE POLICY "proc_pareceres_tecnicos_update" ON public.pareceres_tecnicos FOR UPDATE TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('workflow'::app_module))
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('workflow'::app_module));

CREATE POLICY "proc_pareceres_tecnicos_delete" ON public.pareceres_tecnicos FOR DELETE TO authenticated
USING (public.has_role('admin'::app_role));

-- 8. MOVIMENTACOES_PATRIMONIO (pertence ao patrimonio)
CREATE POLICY "pat_movimentacoes_patrimonio_select" ON public.movimentacoes_patrimonio FOR SELECT TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('patrimonio'::app_module));

CREATE POLICY "pat_movimentacoes_patrimonio_insert" ON public.movimentacoes_patrimonio FOR INSERT TO authenticated
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('patrimonio'::app_module));

CREATE POLICY "pat_movimentacoes_patrimonio_update" ON public.movimentacoes_patrimonio FOR UPDATE TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('patrimonio'::app_module))
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('patrimonio'::app_module));

CREATE POLICY "pat_movimentacoes_patrimonio_delete" ON public.movimentacoes_patrimonio FOR DELETE TO authenticated
USING (public.has_role('admin'::app_role));
