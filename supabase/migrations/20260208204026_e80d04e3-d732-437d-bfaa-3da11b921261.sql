-- ============================================
-- FASE 2: RLS PARA TABELAS RESTANTES
-- Módulos: Patrimônio, Governança, Inventário, Transparência, Compliance
-- ============================================

-- ============================================
-- 1. MÓDULO PATRIMÔNIO (7 tabelas)
-- ============================================

-- campanhas_inventario
CREATE POLICY "pat_campanhas_inventario_select" ON public.campanhas_inventario
FOR SELECT TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('patrimonio'::app_module)));

CREATE POLICY "pat_campanhas_inventario_insert" ON public.campanhas_inventario
FOR INSERT TO authenticated
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('patrimonio'::app_module)));

CREATE POLICY "pat_campanhas_inventario_update" ON public.campanhas_inventario
FOR UPDATE TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('patrimonio'::app_module)))
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('patrimonio'::app_module)));

CREATE POLICY "pat_campanhas_inventario_delete" ON public.campanhas_inventario
FOR DELETE TO authenticated
USING (public.is_active_user() AND public.has_role('admin'::app_role));

-- coletas_inventario
CREATE POLICY "pat_coletas_inventario_select" ON public.coletas_inventario
FOR SELECT TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('patrimonio'::app_module)));

CREATE POLICY "pat_coletas_inventario_insert" ON public.coletas_inventario
FOR INSERT TO authenticated
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('patrimonio'::app_module)));

CREATE POLICY "pat_coletas_inventario_update" ON public.coletas_inventario
FOR UPDATE TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('patrimonio'::app_module)))
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('patrimonio'::app_module)));

CREATE POLICY "pat_coletas_inventario_delete" ON public.coletas_inventario
FOR DELETE TO authenticated
USING (public.is_active_user() AND public.has_role('admin'::app_role));

-- conciliacoes_inventario
CREATE POLICY "pat_conciliacoes_inventario_select" ON public.conciliacoes_inventario
FOR SELECT TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('patrimonio'::app_module)));

CREATE POLICY "pat_conciliacoes_inventario_insert" ON public.conciliacoes_inventario
FOR INSERT TO authenticated
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('patrimonio'::app_module)));

CREATE POLICY "pat_conciliacoes_inventario_update" ON public.conciliacoes_inventario
FOR UPDATE TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('patrimonio'::app_module)))
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('patrimonio'::app_module)));

CREATE POLICY "pat_conciliacoes_inventario_delete" ON public.conciliacoes_inventario
FOR DELETE TO authenticated
USING (public.is_active_user() AND public.has_role('admin'::app_role));

-- manutencoes_patrimonio
CREATE POLICY "pat_manutencoes_patrimonio_select" ON public.manutencoes_patrimonio
FOR SELECT TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('patrimonio'::app_module)));

CREATE POLICY "pat_manutencoes_patrimonio_insert" ON public.manutencoes_patrimonio
FOR INSERT TO authenticated
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('patrimonio'::app_module)));

CREATE POLICY "pat_manutencoes_patrimonio_update" ON public.manutencoes_patrimonio
FOR UPDATE TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('patrimonio'::app_module)))
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('patrimonio'::app_module)));

CREATE POLICY "pat_manutencoes_patrimonio_delete" ON public.manutencoes_patrimonio
FOR DELETE TO authenticated
USING (public.is_active_user() AND public.has_role('admin'::app_role));

-- ocorrencias_patrimonio
CREATE POLICY "pat_ocorrencias_patrimonio_select" ON public.ocorrencias_patrimonio
FOR SELECT TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('patrimonio'::app_module)));

CREATE POLICY "pat_ocorrencias_patrimonio_insert" ON public.ocorrencias_patrimonio
FOR INSERT TO authenticated
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('patrimonio'::app_module)));

CREATE POLICY "pat_ocorrencias_patrimonio_update" ON public.ocorrencias_patrimonio
FOR UPDATE TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('patrimonio'::app_module)))
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('patrimonio'::app_module)));

CREATE POLICY "pat_ocorrencias_patrimonio_delete" ON public.ocorrencias_patrimonio
FOR DELETE TO authenticated
USING (public.is_active_user() AND public.has_role('admin'::app_role));

-- requisicoes_material
CREATE POLICY "pat_requisicoes_material_select" ON public.requisicoes_material
FOR SELECT TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('patrimonio'::app_module)));

CREATE POLICY "pat_requisicoes_material_insert" ON public.requisicoes_material
FOR INSERT TO authenticated
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('patrimonio'::app_module)));

CREATE POLICY "pat_requisicoes_material_update" ON public.requisicoes_material
FOR UPDATE TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('patrimonio'::app_module)))
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('patrimonio'::app_module)));

CREATE POLICY "pat_requisicoes_material_delete" ON public.requisicoes_material
FOR DELETE TO authenticated
USING (public.is_active_user() AND public.has_role('admin'::app_role));

-- requisicao_itens
CREATE POLICY "pat_requisicao_itens_select" ON public.requisicao_itens
FOR SELECT TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('patrimonio'::app_module)));

CREATE POLICY "pat_requisicao_itens_insert" ON public.requisicao_itens
FOR INSERT TO authenticated
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('patrimonio'::app_module)));

CREATE POLICY "pat_requisicao_itens_update" ON public.requisicao_itens
FOR UPDATE TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('patrimonio'::app_module)))
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('patrimonio'::app_module)));

CREATE POLICY "pat_requisicao_itens_delete" ON public.requisicao_itens
FOR DELETE TO authenticated
USING (public.is_active_user() AND public.has_role('admin'::app_role));

-- ============================================
-- 2. MÓDULO GOVERNANÇA/RISCOS (8 tabelas)
-- ============================================

-- riscos_institucionais
CREATE POLICY "gov_riscos_institucionais_select" ON public.riscos_institucionais
FOR SELECT TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('governanca'::app_module)));

CREATE POLICY "gov_riscos_institucionais_insert" ON public.riscos_institucionais
FOR INSERT TO authenticated
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('governanca'::app_module)));

CREATE POLICY "gov_riscos_institucionais_update" ON public.riscos_institucionais
FOR UPDATE TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('governanca'::app_module)))
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('governanca'::app_module)));

CREATE POLICY "gov_riscos_institucionais_delete" ON public.riscos_institucionais
FOR DELETE TO authenticated
USING (public.is_active_user() AND public.has_role('admin'::app_role));

-- avaliacoes_risco
CREATE POLICY "gov_avaliacoes_risco_select" ON public.avaliacoes_risco
FOR SELECT TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('governanca'::app_module)));

CREATE POLICY "gov_avaliacoes_risco_insert" ON public.avaliacoes_risco
FOR INSERT TO authenticated
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('governanca'::app_module)));

CREATE POLICY "gov_avaliacoes_risco_update" ON public.avaliacoes_risco
FOR UPDATE TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('governanca'::app_module)))
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('governanca'::app_module)));

CREATE POLICY "gov_avaliacoes_risco_delete" ON public.avaliacoes_risco
FOR DELETE TO authenticated
USING (public.is_active_user() AND public.has_role('admin'::app_role));

-- planos_tratamento_risco
CREATE POLICY "gov_planos_tratamento_risco_select" ON public.planos_tratamento_risco
FOR SELECT TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('governanca'::app_module)));

CREATE POLICY "gov_planos_tratamento_risco_insert" ON public.planos_tratamento_risco
FOR INSERT TO authenticated
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('governanca'::app_module)));

CREATE POLICY "gov_planos_tratamento_risco_update" ON public.planos_tratamento_risco
FOR UPDATE TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('governanca'::app_module)))
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('governanca'::app_module)));

CREATE POLICY "gov_planos_tratamento_risco_delete" ON public.planos_tratamento_risco
FOR DELETE TO authenticated
USING (public.is_active_user() AND public.has_role('admin'::app_role));

-- controles_internos
CREATE POLICY "gov_controles_internos_select" ON public.controles_internos
FOR SELECT TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('governanca'::app_module)));

CREATE POLICY "gov_controles_internos_insert" ON public.controles_internos
FOR INSERT TO authenticated
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('governanca'::app_module)));

CREATE POLICY "gov_controles_internos_update" ON public.controles_internos
FOR UPDATE TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('governanca'::app_module)))
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('governanca'::app_module)));

CREATE POLICY "gov_controles_internos_delete" ON public.controles_internos
FOR DELETE TO authenticated
USING (public.is_active_user() AND public.has_role('admin'::app_role));

-- avaliacoes_controle
CREATE POLICY "gov_avaliacoes_controle_select" ON public.avaliacoes_controle
FOR SELECT TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('governanca'::app_module)));

CREATE POLICY "gov_avaliacoes_controle_insert" ON public.avaliacoes_controle
FOR INSERT TO authenticated
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('governanca'::app_module)));

CREATE POLICY "gov_avaliacoes_controle_update" ON public.avaliacoes_controle
FOR UPDATE TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('governanca'::app_module)))
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('governanca'::app_module)));

CREATE POLICY "gov_avaliacoes_controle_delete" ON public.avaliacoes_controle
FOR DELETE TO authenticated
USING (public.is_active_user() AND public.has_role('admin'::app_role));

-- evidencias_controle
CREATE POLICY "gov_evidencias_controle_select" ON public.evidencias_controle
FOR SELECT TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('governanca'::app_module)));

CREATE POLICY "gov_evidencias_controle_insert" ON public.evidencias_controle
FOR INSERT TO authenticated
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('governanca'::app_module)));

CREATE POLICY "gov_evidencias_controle_update" ON public.evidencias_controle
FOR UPDATE TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('governanca'::app_module)))
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('governanca'::app_module)));

CREATE POLICY "gov_evidencias_controle_delete" ON public.evidencias_controle
FOR DELETE TO authenticated
USING (public.is_active_user() AND public.has_role('admin'::app_role));

-- matriz_raci_processos
CREATE POLICY "gov_matriz_raci_processos_select" ON public.matriz_raci_processos
FOR SELECT TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('governanca'::app_module)));

CREATE POLICY "gov_matriz_raci_processos_insert" ON public.matriz_raci_processos
FOR INSERT TO authenticated
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('governanca'::app_module)));

CREATE POLICY "gov_matriz_raci_processos_update" ON public.matriz_raci_processos
FOR UPDATE TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('governanca'::app_module)))
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('governanca'::app_module)));

CREATE POLICY "gov_matriz_raci_processos_delete" ON public.matriz_raci_processos
FOR DELETE TO authenticated
USING (public.is_active_user() AND public.has_role('admin'::app_role));

-- matriz_raci_papeis
CREATE POLICY "gov_matriz_raci_papeis_select" ON public.matriz_raci_papeis
FOR SELECT TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('governanca'::app_module)));

CREATE POLICY "gov_matriz_raci_papeis_insert" ON public.matriz_raci_papeis
FOR INSERT TO authenticated
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('governanca'::app_module)));

CREATE POLICY "gov_matriz_raci_papeis_update" ON public.matriz_raci_papeis
FOR UPDATE TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('governanca'::app_module)))
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('governanca'::app_module)));

CREATE POLICY "gov_matriz_raci_papeis_delete" ON public.matriz_raci_papeis
FOR DELETE TO authenticated
USING (public.is_active_user() AND public.has_role('admin'::app_role));

-- matriz_raci_atribuicoes
CREATE POLICY "gov_matriz_raci_atribuicoes_select" ON public.matriz_raci_atribuicoes
FOR SELECT TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('governanca'::app_module)));

CREATE POLICY "gov_matriz_raci_atribuicoes_insert" ON public.matriz_raci_atribuicoes
FOR INSERT TO authenticated
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('governanca'::app_module)));

CREATE POLICY "gov_matriz_raci_atribuicoes_update" ON public.matriz_raci_atribuicoes
FOR UPDATE TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('governanca'::app_module)))
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('governanca'::app_module)));

CREATE POLICY "gov_matriz_raci_atribuicoes_delete" ON public.matriz_raci_atribuicoes
FOR DELETE TO authenticated
USING (public.is_active_user() AND public.has_role('admin'::app_role));

-- ============================================
-- 3. MÓDULO COMPLIANCE/INTEGRIDADE (4 tabelas)
-- ============================================

-- checklists_conformidade
CREATE POLICY "int_checklists_conformidade_select" ON public.checklists_conformidade
FOR SELECT TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('integridade'::app_module)));

CREATE POLICY "int_checklists_conformidade_insert" ON public.checklists_conformidade
FOR INSERT TO authenticated
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('integridade'::app_module)));

CREATE POLICY "int_checklists_conformidade_update" ON public.checklists_conformidade
FOR UPDATE TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('integridade'::app_module)))
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('integridade'::app_module)));

CREATE POLICY "int_checklists_conformidade_delete" ON public.checklists_conformidade
FOR DELETE TO authenticated
USING (public.is_active_user() AND public.has_role('admin'::app_role));

-- itens_checklist
CREATE POLICY "int_itens_checklist_select" ON public.itens_checklist
FOR SELECT TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('integridade'::app_module)));

CREATE POLICY "int_itens_checklist_insert" ON public.itens_checklist
FOR INSERT TO authenticated
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('integridade'::app_module)));

CREATE POLICY "int_itens_checklist_update" ON public.itens_checklist
FOR UPDATE TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('integridade'::app_module)))
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('integridade'::app_module)));

CREATE POLICY "int_itens_checklist_delete" ON public.itens_checklist
FOR DELETE TO authenticated
USING (public.is_active_user() AND public.has_role('admin'::app_role));

-- respostas_checklist
CREATE POLICY "int_respostas_checklist_select" ON public.respostas_checklist
FOR SELECT TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('integridade'::app_module)));

CREATE POLICY "int_respostas_checklist_insert" ON public.respostas_checklist
FOR INSERT TO authenticated
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('integridade'::app_module)));

CREATE POLICY "int_respostas_checklist_update" ON public.respostas_checklist
FOR UPDATE TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('integridade'::app_module)))
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('integridade'::app_module)));

CREATE POLICY "int_respostas_checklist_delete" ON public.respostas_checklist
FOR DELETE TO authenticated
USING (public.is_active_user() AND public.has_role('admin'::app_role));

-- decisoes_administrativas
CREATE POLICY "int_decisoes_administrativas_select" ON public.decisoes_administrativas
FOR SELECT TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('integridade'::app_module)));

CREATE POLICY "int_decisoes_administrativas_insert" ON public.decisoes_administrativas
FOR INSERT TO authenticated
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('integridade'::app_module)));

CREATE POLICY "int_decisoes_administrativas_update" ON public.decisoes_administrativas
FOR UPDATE TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('integridade'::app_module)))
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('integridade'::app_module)));

CREATE POLICY "int_decisoes_administrativas_delete" ON public.decisoes_administrativas
FOR DELETE TO authenticated
USING (public.is_active_user() AND public.has_role('admin'::app_role));

-- ============================================
-- 4. MÓDULO TRANSPARÊNCIA (3 tabelas)
-- ============================================

-- solicitacoes_sic
CREATE POLICY "transp_solicitacoes_sic_select" ON public.solicitacoes_sic
FOR SELECT TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('transparencia'::app_module)));

CREATE POLICY "transp_solicitacoes_sic_insert" ON public.solicitacoes_sic
FOR INSERT TO authenticated
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('transparencia'::app_module)));

CREATE POLICY "transp_solicitacoes_sic_update" ON public.solicitacoes_sic
FOR UPDATE TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('transparencia'::app_module)))
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('transparencia'::app_module)));

CREATE POLICY "transp_solicitacoes_sic_delete" ON public.solicitacoes_sic
FOR DELETE TO authenticated
USING (public.is_active_user() AND public.has_role('admin'::app_role));

-- historico_lai
CREATE POLICY "transp_historico_lai_select" ON public.historico_lai
FOR SELECT TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('transparencia'::app_module)));

CREATE POLICY "transp_historico_lai_insert" ON public.historico_lai
FOR INSERT TO authenticated
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('transparencia'::app_module)));

CREATE POLICY "transp_historico_lai_update" ON public.historico_lai
FOR UPDATE TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('transparencia'::app_module)))
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('transparencia'::app_module)));

CREATE POLICY "transp_historico_lai_delete" ON public.historico_lai
FOR DELETE TO authenticated
USING (public.is_active_user() AND public.has_role('admin'::app_role));

-- acesso_processo_sigiloso
CREATE POLICY "transp_acesso_processo_sigiloso_select" ON public.acesso_processo_sigiloso
FOR SELECT TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('transparencia'::app_module)));

CREATE POLICY "transp_acesso_processo_sigiloso_insert" ON public.acesso_processo_sigiloso
FOR INSERT TO authenticated
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('transparencia'::app_module)));

CREATE POLICY "transp_acesso_processo_sigiloso_update" ON public.acesso_processo_sigiloso
FOR UPDATE TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('transparencia'::app_module)))
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('transparencia'::app_module)));

CREATE POLICY "transp_acesso_processo_sigiloso_delete" ON public.acesso_processo_sigiloso
FOR DELETE TO authenticated
USING (public.is_active_user() AND public.has_role('admin'::app_role));

-- ============================================
-- 5. MÓDULO COMUNICAÇÃO (1 tabela)
-- ============================================

-- conteudo_rascunho
CREATE POLICY "com_conteudo_rascunho_select" ON public.conteudo_rascunho
FOR SELECT TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('comunicacao'::app_module)));

CREATE POLICY "com_conteudo_rascunho_insert" ON public.conteudo_rascunho
FOR INSERT TO authenticated
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('comunicacao'::app_module)));

CREATE POLICY "com_conteudo_rascunho_update" ON public.conteudo_rascunho
FOR UPDATE TO authenticated
USING (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('comunicacao'::app_module)))
WITH CHECK (public.is_active_user() AND (public.has_role('admin'::app_role) OR public.has_module('comunicacao'::app_module)));

CREATE POLICY "com_conteudo_rascunho_delete" ON public.conteudo_rascunho
FOR DELETE TO authenticated
USING (public.is_active_user() AND public.has_role('admin'::app_role));

-- ============================================
-- 6. MÓDULO ADMIN/SISTEMA (4 tabelas)
-- ============================================

-- _backup_usuario_modulos_old (admin apenas)
CREATE POLICY "adm_backup_usuario_modulos_old_select" ON public._backup_usuario_modulos_old
FOR SELECT TO authenticated
USING (public.is_active_user() AND public.has_role('admin'::app_role));

CREATE POLICY "adm_backup_usuario_modulos_old_insert" ON public._backup_usuario_modulos_old
FOR INSERT TO authenticated
WITH CHECK (public.is_active_user() AND public.has_role('admin'::app_role));

CREATE POLICY "adm_backup_usuario_modulos_old_update" ON public._backup_usuario_modulos_old
FOR UPDATE TO authenticated
USING (public.is_active_user() AND public.has_role('admin'::app_role))
WITH CHECK (public.is_active_user() AND public.has_role('admin'::app_role));

CREATE POLICY "adm_backup_usuario_modulos_old_delete" ON public._backup_usuario_modulos_old
FOR DELETE TO authenticated
USING (public.is_active_user() AND public.has_role('admin'::app_role));

-- backup_integrity_checks (admin apenas)
CREATE POLICY "adm_backup_integrity_checks_select" ON public.backup_integrity_checks
FOR SELECT TO authenticated
USING (public.is_active_user() AND public.has_role('admin'::app_role));

CREATE POLICY "adm_backup_integrity_checks_insert" ON public.backup_integrity_checks
FOR INSERT TO authenticated
WITH CHECK (public.is_active_user() AND public.has_role('admin'::app_role));

CREATE POLICY "adm_backup_integrity_checks_update" ON public.backup_integrity_checks
FOR UPDATE TO authenticated
USING (public.is_active_user() AND public.has_role('admin'::app_role))
WITH CHECK (public.is_active_user() AND public.has_role('admin'::app_role));

CREATE POLICY "adm_backup_integrity_checks_delete" ON public.backup_integrity_checks
FOR DELETE TO authenticated
USING (public.is_active_user() AND public.has_role('admin'::app_role));

-- debitos_tecnicos (admin apenas)
CREATE POLICY "adm_debitos_tecnicos_select" ON public.debitos_tecnicos
FOR SELECT TO authenticated
USING (public.is_active_user() AND public.has_role('admin'::app_role));

CREATE POLICY "adm_debitos_tecnicos_insert" ON public.debitos_tecnicos
FOR INSERT TO authenticated
WITH CHECK (public.is_active_user() AND public.has_role('admin'::app_role));

CREATE POLICY "adm_debitos_tecnicos_update" ON public.debitos_tecnicos
FOR UPDATE TO authenticated
USING (public.is_active_user() AND public.has_role('admin'::app_role))
WITH CHECK (public.is_active_user() AND public.has_role('admin'::app_role));

CREATE POLICY "adm_debitos_tecnicos_delete" ON public.debitos_tecnicos
FOR DELETE TO authenticated
USING (public.is_active_user() AND public.has_role('admin'::app_role));

-- agrupamento_unidade_vinculo (admin apenas)
CREATE POLICY "adm_agrupamento_unidade_vinculo_select" ON public.agrupamento_unidade_vinculo
FOR SELECT TO authenticated
USING (public.is_active_user() AND public.has_role('admin'::app_role));

CREATE POLICY "adm_agrupamento_unidade_vinculo_insert" ON public.agrupamento_unidade_vinculo
FOR INSERT TO authenticated
WITH CHECK (public.is_active_user() AND public.has_role('admin'::app_role));

CREATE POLICY "adm_agrupamento_unidade_vinculo_update" ON public.agrupamento_unidade_vinculo
FOR UPDATE TO authenticated
USING (public.is_active_user() AND public.has_role('admin'::app_role))
WITH CHECK (public.is_active_user() AND public.has_role('admin'::app_role));

CREATE POLICY "adm_agrupamento_unidade_vinculo_delete" ON public.agrupamento_unidade_vinculo
FOR DELETE TO authenticated
USING (public.is_active_user() AND public.has_role('admin'::app_role));