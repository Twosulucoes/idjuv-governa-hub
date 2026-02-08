
-- ============================================
-- Políticas RLS para Módulo RH - Acesso por Módulo
-- ============================================

-- ============================================
-- 1. FREQUENCIA_MENSAL
-- ============================================

CREATE POLICY "rh_frequencia_mensal_select"
ON public.frequencia_mensal FOR SELECT TO authenticated
USING (
  public.has_role('admin'::app_role) 
  OR public.has_module('rh'::app_module)
  OR EXISTS (SELECT 1 FROM public.servidores s WHERE s.id = frequencia_mensal.servidor_id AND s.user_id = auth.uid())
);

CREATE POLICY "rh_frequencia_mensal_insert"
ON public.frequencia_mensal FOR INSERT TO authenticated
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('rh'::app_module));

CREATE POLICY "rh_frequencia_mensal_update"
ON public.frequencia_mensal FOR UPDATE TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('rh'::app_module))
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('rh'::app_module));

CREATE POLICY "rh_frequencia_mensal_delete"
ON public.frequencia_mensal FOR DELETE TO authenticated
USING (public.has_role('admin'::app_role));

-- ============================================
-- 2. BANCO_HORAS (servidor_id referencia profiles.id)
-- ============================================

CREATE POLICY "rh_banco_horas_select"
ON public.banco_horas FOR SELECT TO authenticated
USING (
  public.has_role('admin'::app_role) 
  OR public.has_module('rh'::app_module)
  OR servidor_id = auth.uid()
);

CREATE POLICY "rh_banco_horas_insert"
ON public.banco_horas FOR INSERT TO authenticated
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('rh'::app_module));

CREATE POLICY "rh_banco_horas_update"
ON public.banco_horas FOR UPDATE TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('rh'::app_module))
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('rh'::app_module));

CREATE POLICY "rh_banco_horas_delete"
ON public.banco_horas FOR DELETE TO authenticated
USING (public.has_role('admin'::app_role));

-- ============================================
-- 3. LOTACOES
-- ============================================

CREATE POLICY "rh_lotacoes_select"
ON public.lotacoes FOR SELECT TO authenticated
USING (
  public.has_role('admin'::app_role) 
  OR public.has_module('rh'::app_module)
  OR EXISTS (SELECT 1 FROM public.servidores s WHERE s.id = lotacoes.servidor_id AND s.user_id = auth.uid())
);

CREATE POLICY "rh_lotacoes_insert"
ON public.lotacoes FOR INSERT TO authenticated
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('rh'::app_module));

CREATE POLICY "rh_lotacoes_update"
ON public.lotacoes FOR UPDATE TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('rh'::app_module))
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('rh'::app_module));

CREATE POLICY "rh_lotacoes_delete"
ON public.lotacoes FOR DELETE TO authenticated
USING (public.has_role('admin'::app_role));

-- ============================================
-- 4. REGISTROS_PONTO
-- ============================================

CREATE POLICY "rh_registros_ponto_select"
ON public.registros_ponto FOR SELECT TO authenticated
USING (
  public.has_role('admin'::app_role) 
  OR public.has_module('rh'::app_module)
  OR EXISTS (SELECT 1 FROM public.servidores s WHERE s.id = registros_ponto.servidor_id AND s.user_id = auth.uid())
);

CREATE POLICY "rh_registros_ponto_insert"
ON public.registros_ponto FOR INSERT TO authenticated
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('rh'::app_module));

CREATE POLICY "rh_registros_ponto_update"
ON public.registros_ponto FOR UPDATE TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('rh'::app_module))
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('rh'::app_module));

CREATE POLICY "rh_registros_ponto_delete"
ON public.registros_ponto FOR DELETE TO authenticated
USING (public.has_role('admin'::app_role));

-- ============================================
-- 5. FOLHAS_PAGAMENTO (sem self-access - conforme regra)
-- ============================================

CREATE POLICY "rh_folhas_pagamento_select"
ON public.folhas_pagamento FOR SELECT TO authenticated
USING (
  public.has_role('admin'::app_role) 
  OR public.has_module('rh'::app_module)
  OR public.has_module('financeiro'::app_module)
);

CREATE POLICY "rh_folhas_pagamento_insert"
ON public.folhas_pagamento FOR INSERT TO authenticated
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('rh'::app_module));

CREATE POLICY "rh_folhas_pagamento_update"
ON public.folhas_pagamento FOR UPDATE TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('rh'::app_module))
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('rh'::app_module));

CREATE POLICY "rh_folhas_pagamento_delete"
ON public.folhas_pagamento FOR DELETE TO authenticated
USING (public.has_role('admin'::app_role));

-- ============================================
-- 6. LANCAMENTOS_BANCO_HORAS (via banco_horas_id)
-- ============================================

CREATE POLICY "rh_lancamentos_banco_horas_select"
ON public.lancamentos_banco_horas FOR SELECT TO authenticated
USING (
  public.has_role('admin'::app_role) 
  OR public.has_module('rh'::app_module)
  OR EXISTS (SELECT 1 FROM public.banco_horas bh WHERE bh.id = lancamentos_banco_horas.banco_horas_id AND bh.servidor_id = auth.uid())
);

CREATE POLICY "rh_lancamentos_banco_horas_insert"
ON public.lancamentos_banco_horas FOR INSERT TO authenticated
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('rh'::app_module));

CREATE POLICY "rh_lancamentos_banco_horas_update"
ON public.lancamentos_banco_horas FOR UPDATE TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('rh'::app_module))
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('rh'::app_module));

CREATE POLICY "rh_lancamentos_banco_horas_delete"
ON public.lancamentos_banco_horas FOR DELETE TO authenticated
USING (public.has_role('admin'::app_role));

-- ============================================
-- 7. HORARIOS_JORNADA (vincula a configuracao_jornada)
-- ============================================

CREATE POLICY "rh_horarios_jornada_select"
ON public.horarios_jornada FOR SELECT TO authenticated
USING (
  public.has_role('admin'::app_role) 
  OR public.has_module('rh'::app_module)
  OR EXISTS (
    SELECT 1 FROM public.configuracao_jornada cj 
    WHERE cj.id = horarios_jornada.configuracao_id AND cj.servidor_id = auth.uid()
  )
);

CREATE POLICY "rh_horarios_jornada_insert"
ON public.horarios_jornada FOR INSERT TO authenticated
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('rh'::app_module));

CREATE POLICY "rh_horarios_jornada_update"
ON public.horarios_jornada FOR UPDATE TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('rh'::app_module))
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('rh'::app_module));

CREATE POLICY "rh_horarios_jornada_delete"
ON public.horarios_jornada FOR DELETE TO authenticated
USING (public.has_role('admin'::app_role));

-- ============================================
-- 8. CONFIGURACAO_JORNADA
-- ============================================

CREATE POLICY "rh_configuracao_jornada_select"
ON public.configuracao_jornada FOR SELECT TO authenticated
USING (
  public.has_role('admin'::app_role) 
  OR public.has_module('rh'::app_module)
  OR servidor_id = auth.uid()
);

CREATE POLICY "rh_configuracao_jornada_insert"
ON public.configuracao_jornada FOR INSERT TO authenticated
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('rh'::app_module));

CREATE POLICY "rh_configuracao_jornada_update"
ON public.configuracao_jornada FOR UPDATE TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('rh'::app_module))
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('rh'::app_module));

CREATE POLICY "rh_configuracao_jornada_delete"
ON public.configuracao_jornada FOR DELETE TO authenticated
USING (public.has_role('admin'::app_role));

-- ============================================
-- 9. CONSIGNACOES
-- ============================================

CREATE POLICY "rh_consignacoes_select"
ON public.consignacoes FOR SELECT TO authenticated
USING (
  public.has_role('admin'::app_role) 
  OR public.has_module('rh'::app_module)
  OR public.has_module('financeiro'::app_module)
  OR EXISTS (SELECT 1 FROM public.servidores s WHERE s.id = consignacoes.servidor_id AND s.user_id = auth.uid())
);

CREATE POLICY "rh_consignacoes_insert"
ON public.consignacoes FOR INSERT TO authenticated
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('rh'::app_module));

CREATE POLICY "rh_consignacoes_update"
ON public.consignacoes FOR UPDATE TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('rh'::app_module))
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('rh'::app_module));

CREATE POLICY "rh_consignacoes_delete"
ON public.consignacoes FOR DELETE TO authenticated
USING (public.has_role('admin'::app_role));

-- ============================================
-- 10. DEPENDENTES_IRRF
-- ============================================

CREATE POLICY "rh_dependentes_irrf_select"
ON public.dependentes_irrf FOR SELECT TO authenticated
USING (
  public.has_role('admin'::app_role) 
  OR public.has_module('rh'::app_module)
  OR public.has_module('financeiro'::app_module)
  OR EXISTS (SELECT 1 FROM public.servidores s WHERE s.id = dependentes_irrf.servidor_id AND s.user_id = auth.uid())
);

CREATE POLICY "rh_dependentes_irrf_insert"
ON public.dependentes_irrf FOR INSERT TO authenticated
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('rh'::app_module));

CREATE POLICY "rh_dependentes_irrf_update"
ON public.dependentes_irrf FOR UPDATE TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('rh'::app_module))
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('rh'::app_module));

CREATE POLICY "rh_dependentes_irrf_delete"
ON public.dependentes_irrf FOR DELETE TO authenticated
USING (public.has_role('admin'::app_role));

-- ============================================
-- 11. OCORRENCIAS_SERVIDOR
-- ============================================

CREATE POLICY "rh_ocorrencias_servidor_select"
ON public.ocorrencias_servidor FOR SELECT TO authenticated
USING (
  public.has_role('admin'::app_role) 
  OR public.has_module('rh'::app_module)
  OR EXISTS (SELECT 1 FROM public.servidores s WHERE s.id = ocorrencias_servidor.servidor_id AND s.user_id = auth.uid())
);

CREATE POLICY "rh_ocorrencias_servidor_insert"
ON public.ocorrencias_servidor FOR INSERT TO authenticated
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('rh'::app_module));

CREATE POLICY "rh_ocorrencias_servidor_update"
ON public.ocorrencias_servidor FOR UPDATE TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('rh'::app_module))
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('rh'::app_module));

CREATE POLICY "rh_ocorrencias_servidor_delete"
ON public.ocorrencias_servidor FOR DELETE TO authenticated
USING (public.has_role('admin'::app_role));

-- ============================================
-- 12. FICHAS_FINANCEIRAS (self-access para ver contracheque)
-- ============================================

CREATE POLICY "rh_fichas_financeiras_select"
ON public.fichas_financeiras FOR SELECT TO authenticated
USING (
  public.has_role('admin'::app_role) 
  OR public.has_module('rh'::app_module)
  OR public.has_module('financeiro'::app_module)
  OR EXISTS (SELECT 1 FROM public.servidores s WHERE s.id = fichas_financeiras.servidor_id AND s.user_id = auth.uid())
);

CREATE POLICY "rh_fichas_financeiras_insert"
ON public.fichas_financeiras FOR INSERT TO authenticated
WITH CHECK (
  public.has_role('admin'::app_role) 
  OR public.has_module('rh'::app_module)
  OR public.has_module('financeiro'::app_module)
);

CREATE POLICY "rh_fichas_financeiras_update"
ON public.fichas_financeiras FOR UPDATE TO authenticated
USING (
  public.has_role('admin'::app_role) 
  OR public.has_module('rh'::app_module)
  OR public.has_module('financeiro'::app_module)
)
WITH CHECK (
  public.has_role('admin'::app_role) 
  OR public.has_module('rh'::app_module)
  OR public.has_module('financeiro'::app_module)
);

CREATE POLICY "rh_fichas_financeiras_delete"
ON public.fichas_financeiras FOR DELETE TO authenticated
USING (public.has_role('admin'::app_role));
