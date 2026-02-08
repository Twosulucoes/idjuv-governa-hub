
-- ============================================
-- Políticas RLS para Tabelas de CONFIG/SISTEMA
-- Acesso: admin OU módulo 'admin' (configurações gerais)
-- Leitura: autenticados podem visualizar configs
-- ============================================

-- 1. CONFIG_INSTITUCIONAL (leitura pública para autenticados)
CREATE POLICY "cfg_config_institucional_select" ON public.config_institucional FOR SELECT TO authenticated
USING (true);

CREATE POLICY "cfg_config_institucional_insert" ON public.config_institucional FOR INSERT TO authenticated
WITH CHECK (public.has_role('admin'::app_role));

CREATE POLICY "cfg_config_institucional_update" ON public.config_institucional FOR UPDATE TO authenticated
USING (public.has_role('admin'::app_role))
WITH CHECK (public.has_role('admin'::app_role));

CREATE POLICY "cfg_config_institucional_delete" ON public.config_institucional FOR DELETE TO authenticated
USING (public.has_role('admin'::app_role));

-- 2. CONFIG_AGRUPAMENTO_UNIDADES
CREATE POLICY "cfg_config_agrupamento_unidades_select" ON public.config_agrupamento_unidades FOR SELECT TO authenticated
USING (true);

CREATE POLICY "cfg_config_agrupamento_unidades_insert" ON public.config_agrupamento_unidades FOR INSERT TO authenticated
WITH CHECK (public.has_role('admin'::app_role));

CREATE POLICY "cfg_config_agrupamento_unidades_update" ON public.config_agrupamento_unidades FOR UPDATE TO authenticated
USING (public.has_role('admin'::app_role))
WITH CHECK (public.has_role('admin'::app_role));

CREATE POLICY "cfg_config_agrupamento_unidades_delete" ON public.config_agrupamento_unidades FOR DELETE TO authenticated
USING (public.has_role('admin'::app_role));

-- 3. CONFIG_MOTIVOS_DESLIGAMENTO (RH configs)
CREATE POLICY "cfg_config_motivos_desligamento_select" ON public.config_motivos_desligamento FOR SELECT TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('rh'::app_module));

CREATE POLICY "cfg_config_motivos_desligamento_insert" ON public.config_motivos_desligamento FOR INSERT TO authenticated
WITH CHECK (public.has_role('admin'::app_role));

CREATE POLICY "cfg_config_motivos_desligamento_update" ON public.config_motivos_desligamento FOR UPDATE TO authenticated
USING (public.has_role('admin'::app_role))
WITH CHECK (public.has_role('admin'::app_role));

CREATE POLICY "cfg_config_motivos_desligamento_delete" ON public.config_motivos_desligamento FOR DELETE TO authenticated
USING (public.has_role('admin'::app_role));

-- 4. CONFIG_PARAMETROS_META
CREATE POLICY "cfg_config_parametros_meta_select" ON public.config_parametros_meta FOR SELECT TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('programas'::app_module));

CREATE POLICY "cfg_config_parametros_meta_insert" ON public.config_parametros_meta FOR INSERT TO authenticated
WITH CHECK (public.has_role('admin'::app_role));

CREATE POLICY "cfg_config_parametros_meta_update" ON public.config_parametros_meta FOR UPDATE TO authenticated
USING (public.has_role('admin'::app_role))
WITH CHECK (public.has_role('admin'::app_role));

CREATE POLICY "cfg_config_parametros_meta_delete" ON public.config_parametros_meta FOR DELETE TO authenticated
USING (public.has_role('admin'::app_role));

-- 5. CONFIG_SITUACOES_FUNCIONAIS (RH configs)
CREATE POLICY "cfg_config_situacoes_funcionais_select" ON public.config_situacoes_funcionais FOR SELECT TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('rh'::app_module));

CREATE POLICY "cfg_config_situacoes_funcionais_insert" ON public.config_situacoes_funcionais FOR INSERT TO authenticated
WITH CHECK (public.has_role('admin'::app_role));

CREATE POLICY "cfg_config_situacoes_funcionais_update" ON public.config_situacoes_funcionais FOR UPDATE TO authenticated
USING (public.has_role('admin'::app_role))
WITH CHECK (public.has_role('admin'::app_role));

CREATE POLICY "cfg_config_situacoes_funcionais_delete" ON public.config_situacoes_funcionais FOR DELETE TO authenticated
USING (public.has_role('admin'::app_role));

-- 6. CONFIG_TIPOS_ATO (RH configs)
CREATE POLICY "cfg_config_tipos_ato_select" ON public.config_tipos_ato FOR SELECT TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('rh'::app_module));

CREATE POLICY "cfg_config_tipos_ato_insert" ON public.config_tipos_ato FOR INSERT TO authenticated
WITH CHECK (public.has_role('admin'::app_role));

CREATE POLICY "cfg_config_tipos_ato_update" ON public.config_tipos_ato FOR UPDATE TO authenticated
USING (public.has_role('admin'::app_role))
WITH CHECK (public.has_role('admin'::app_role));

CREATE POLICY "cfg_config_tipos_ato_delete" ON public.config_tipos_ato FOR DELETE TO authenticated
USING (public.has_role('admin'::app_role));

-- 7. CONFIG_TIPOS_ONUS (RH configs)
CREATE POLICY "cfg_config_tipos_onus_select" ON public.config_tipos_onus FOR SELECT TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('rh'::app_module));

CREATE POLICY "cfg_config_tipos_onus_insert" ON public.config_tipos_onus FOR INSERT TO authenticated
WITH CHECK (public.has_role('admin'::app_role));

CREATE POLICY "cfg_config_tipos_onus_update" ON public.config_tipos_onus FOR UPDATE TO authenticated
USING (public.has_role('admin'::app_role))
WITH CHECK (public.has_role('admin'::app_role));

CREATE POLICY "cfg_config_tipos_onus_delete" ON public.config_tipos_onus FOR DELETE TO authenticated
USING (public.has_role('admin'::app_role));

-- 8. CONFIG_TIPOS_SERVIDOR (RH configs)
CREATE POLICY "cfg_config_tipos_servidor_select" ON public.config_tipos_servidor FOR SELECT TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('rh'::app_module));

CREATE POLICY "cfg_config_tipos_servidor_insert" ON public.config_tipos_servidor FOR INSERT TO authenticated
WITH CHECK (public.has_role('admin'::app_role));

CREATE POLICY "cfg_config_tipos_servidor_update" ON public.config_tipos_servidor FOR UPDATE TO authenticated
USING (public.has_role('admin'::app_role))
WITH CHECK (public.has_role('admin'::app_role));

CREATE POLICY "cfg_config_tipos_servidor_delete" ON public.config_tipos_servidor FOR DELETE TO authenticated
USING (public.has_role('admin'::app_role));
