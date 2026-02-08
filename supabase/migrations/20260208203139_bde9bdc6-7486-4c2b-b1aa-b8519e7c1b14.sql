
-- ============================================
-- Políticas RLS para Módulo FINANCEIRO
-- Acesso: admin OU módulo 'financeiro'
-- ============================================

-- 1. FIN_EMPENHOS
CREATE POLICY "fin_empenhos_select" ON public.fin_empenhos FOR SELECT TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module));

CREATE POLICY "fin_empenhos_insert" ON public.fin_empenhos FOR INSERT TO authenticated
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module));

CREATE POLICY "fin_empenhos_update" ON public.fin_empenhos FOR UPDATE TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module))
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module));

CREATE POLICY "fin_empenhos_delete" ON public.fin_empenhos FOR DELETE TO authenticated
USING (public.has_role('admin'::app_role));

-- 2. FIN_LIQUIDACOES
CREATE POLICY "fin_liquidacoes_select" ON public.fin_liquidacoes FOR SELECT TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module));

CREATE POLICY "fin_liquidacoes_insert" ON public.fin_liquidacoes FOR INSERT TO authenticated
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module));

CREATE POLICY "fin_liquidacoes_update" ON public.fin_liquidacoes FOR UPDATE TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module))
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module));

CREATE POLICY "fin_liquidacoes_delete" ON public.fin_liquidacoes FOR DELETE TO authenticated
USING (public.has_role('admin'::app_role));

-- 3. FIN_RECEITAS
CREATE POLICY "fin_receitas_select" ON public.fin_receitas FOR SELECT TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module));

CREATE POLICY "fin_receitas_insert" ON public.fin_receitas FOR INSERT TO authenticated
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module));

CREATE POLICY "fin_receitas_update" ON public.fin_receitas FOR UPDATE TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module))
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module));

CREATE POLICY "fin_receitas_delete" ON public.fin_receitas FOR DELETE TO authenticated
USING (public.has_role('admin'::app_role));

-- 4. FIN_ADIANTAMENTOS
CREATE POLICY "fin_adiantamentos_select" ON public.fin_adiantamentos FOR SELECT TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module));

CREATE POLICY "fin_adiantamentos_insert" ON public.fin_adiantamentos FOR INSERT TO authenticated
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module));

CREATE POLICY "fin_adiantamentos_update" ON public.fin_adiantamentos FOR UPDATE TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module))
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module));

CREATE POLICY "fin_adiantamentos_delete" ON public.fin_adiantamentos FOR DELETE TO authenticated
USING (public.has_role('admin'::app_role));

-- 5. FIN_ADIANTAMENTO_ITENS
CREATE POLICY "fin_adiantamento_itens_select" ON public.fin_adiantamento_itens FOR SELECT TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module));

CREATE POLICY "fin_adiantamento_itens_insert" ON public.fin_adiantamento_itens FOR INSERT TO authenticated
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module));

CREATE POLICY "fin_adiantamento_itens_update" ON public.fin_adiantamento_itens FOR UPDATE TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module))
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module));

CREATE POLICY "fin_adiantamento_itens_delete" ON public.fin_adiantamento_itens FOR DELETE TO authenticated
USING (public.has_role('admin'::app_role));

-- 6. FIN_ALTERACOES_ORCAMENTARIAS
CREATE POLICY "fin_alteracoes_orcamentarias_select" ON public.fin_alteracoes_orcamentarias FOR SELECT TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module));

CREATE POLICY "fin_alteracoes_orcamentarias_insert" ON public.fin_alteracoes_orcamentarias FOR INSERT TO authenticated
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module));

CREATE POLICY "fin_alteracoes_orcamentarias_update" ON public.fin_alteracoes_orcamentarias FOR UPDATE TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module))
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module));

CREATE POLICY "fin_alteracoes_orcamentarias_delete" ON public.fin_alteracoes_orcamentarias FOR DELETE TO authenticated
USING (public.has_role('admin'::app_role));

-- 7. FIN_CONTAS_BANCARIAS
CREATE POLICY "fin_contas_bancarias_select" ON public.fin_contas_bancarias FOR SELECT TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module));

CREATE POLICY "fin_contas_bancarias_insert" ON public.fin_contas_bancarias FOR INSERT TO authenticated
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module));

CREATE POLICY "fin_contas_bancarias_update" ON public.fin_contas_bancarias FOR UPDATE TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module))
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module));

CREATE POLICY "fin_contas_bancarias_delete" ON public.fin_contas_bancarias FOR DELETE TO authenticated
USING (public.has_role('admin'::app_role));

-- 8. FIN_EMPENHO_ANULACOES
CREATE POLICY "fin_empenho_anulacoes_select" ON public.fin_empenho_anulacoes FOR SELECT TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module));

CREATE POLICY "fin_empenho_anulacoes_insert" ON public.fin_empenho_anulacoes FOR INSERT TO authenticated
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module));

CREATE POLICY "fin_empenho_anulacoes_update" ON public.fin_empenho_anulacoes FOR UPDATE TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module))
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module));

CREATE POLICY "fin_empenho_anulacoes_delete" ON public.fin_empenho_anulacoes FOR DELETE TO authenticated
USING (public.has_role('admin'::app_role));

-- 9. FIN_EXTRATOS_BANCARIOS
CREATE POLICY "fin_extratos_bancarios_select" ON public.fin_extratos_bancarios FOR SELECT TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module));

CREATE POLICY "fin_extratos_bancarios_insert" ON public.fin_extratos_bancarios FOR INSERT TO authenticated
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module));

CREATE POLICY "fin_extratos_bancarios_update" ON public.fin_extratos_bancarios FOR UPDATE TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module))
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module));

CREATE POLICY "fin_extratos_bancarios_delete" ON public.fin_extratos_bancarios FOR DELETE TO authenticated
USING (public.has_role('admin'::app_role));

-- 10. FIN_EXTRATO_TRANSACOES
CREATE POLICY "fin_extrato_transacoes_select" ON public.fin_extrato_transacoes FOR SELECT TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module));

CREATE POLICY "fin_extrato_transacoes_insert" ON public.fin_extrato_transacoes FOR INSERT TO authenticated
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module));

CREATE POLICY "fin_extrato_transacoes_update" ON public.fin_extrato_transacoes FOR UPDATE TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module))
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module));

CREATE POLICY "fin_extrato_transacoes_delete" ON public.fin_extrato_transacoes FOR DELETE TO authenticated
USING (public.has_role('admin'::app_role));

-- 11. FIN_FECHAMENTOS
CREATE POLICY "fin_fechamentos_select" ON public.fin_fechamentos FOR SELECT TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module));

CREATE POLICY "fin_fechamentos_insert" ON public.fin_fechamentos FOR INSERT TO authenticated
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module));

CREATE POLICY "fin_fechamentos_update" ON public.fin_fechamentos FOR UPDATE TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module))
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module));

CREATE POLICY "fin_fechamentos_delete" ON public.fin_fechamentos FOR DELETE TO authenticated
USING (public.has_role('admin'::app_role));

-- 12. FIN_LANCAMENTOS_CONTABEIS
CREATE POLICY "fin_lancamentos_contabeis_select" ON public.fin_lancamentos_contabeis FOR SELECT TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module));

CREATE POLICY "fin_lancamentos_contabeis_insert" ON public.fin_lancamentos_contabeis FOR INSERT TO authenticated
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module));

CREATE POLICY "fin_lancamentos_contabeis_update" ON public.fin_lancamentos_contabeis FOR UPDATE TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module))
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module));

CREATE POLICY "fin_lancamentos_contabeis_delete" ON public.fin_lancamentos_contabeis FOR DELETE TO authenticated
USING (public.has_role('admin'::app_role));

-- 13. FIN_SOLICITACOES
CREATE POLICY "fin_solicitacoes_select" ON public.fin_solicitacoes FOR SELECT TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module));

CREATE POLICY "fin_solicitacoes_insert" ON public.fin_solicitacoes FOR INSERT TO authenticated
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module));

CREATE POLICY "fin_solicitacoes_update" ON public.fin_solicitacoes FOR UPDATE TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module))
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module));

CREATE POLICY "fin_solicitacoes_delete" ON public.fin_solicitacoes FOR DELETE TO authenticated
USING (public.has_role('admin'::app_role));

-- 14. FIN_SOLICITACAO_ITENS
CREATE POLICY "fin_solicitacao_itens_select" ON public.fin_solicitacao_itens FOR SELECT TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module));

CREATE POLICY "fin_solicitacao_itens_insert" ON public.fin_solicitacao_itens FOR INSERT TO authenticated
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module));

CREATE POLICY "fin_solicitacao_itens_update" ON public.fin_solicitacao_itens FOR UPDATE TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module))
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module));

CREATE POLICY "fin_solicitacao_itens_delete" ON public.fin_solicitacao_itens FOR DELETE TO authenticated
USING (public.has_role('admin'::app_role));

-- 15. FIN_CHECKLIST_CI
CREATE POLICY "fin_checklist_ci_select" ON public.fin_checklist_ci FOR SELECT TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module));

CREATE POLICY "fin_checklist_ci_insert" ON public.fin_checklist_ci FOR INSERT TO authenticated
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module));

CREATE POLICY "fin_checklist_ci_update" ON public.fin_checklist_ci FOR UPDATE TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module))
WITH CHECK (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module));

CREATE POLICY "fin_checklist_ci_delete" ON public.fin_checklist_ci FOR DELETE TO authenticated
USING (public.has_role('admin'::app_role));

-- 16. FIN_AUDIT_LOG (somente leitura, inserção pelo sistema)
CREATE POLICY "fin_audit_log_select" ON public.fin_audit_log FOR SELECT TO authenticated
USING (public.has_role('admin'::app_role) OR public.has_module('financeiro'::app_module));

CREATE POLICY "fin_audit_log_insert" ON public.fin_audit_log FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "fin_audit_log_update" ON public.fin_audit_log FOR UPDATE TO authenticated
USING (false) WITH CHECK (false);

CREATE POLICY "fin_audit_log_delete" ON public.fin_audit_log FOR DELETE TO authenticated
USING (false);
