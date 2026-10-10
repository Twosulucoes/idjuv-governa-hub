-- GERADO por scripts/db/gerar-rls.mjs a partir de supabase/baseline/rls/mapa.csv.
-- NÃO edite à mão: altere o mapa e rode `node scripts/db/gerar-rls.mjs`.
--
-- Depende de: overlay/10_funcoes_acesso.sql (is_active_user, is_admin_user, meu_servidor_id
-- reescritos para exigir perfil ativo; can_access_module já era correta) e de
-- overlay/30_remover_acesso_total.sql (remove as policies acesso_total_* antes de estas entrarem).
-- Todas as policies são TO authenticated; nenhuma concede acesso a anon.

-- acesso_processo_sigiloso  [admin: admin]
DROP POLICY IF EXISTS "rls_select" ON public.acesso_processo_sigiloso;
CREATE POLICY "rls_select" ON public.acesso_processo_sigiloso FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_insert" ON public.acesso_processo_sigiloso;
CREATE POLICY "rls_insert" ON public.acesso_processo_sigiloso FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.acesso_processo_sigiloso;
CREATE POLICY "rls_update" ON public.acesso_processo_sigiloso FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.acesso_processo_sigiloso;
CREATE POLICY "rls_delete" ON public.acesso_processo_sigiloso FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- acoes  [modulo: programas]
DROP POLICY IF EXISTS "rls_select" ON public.acoes;
CREATE POLICY "rls_select" ON public.acoes FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'programas')));
DROP POLICY IF EXISTS "rls_insert" ON public.acoes;
CREATE POLICY "rls_insert" ON public.acoes FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'programas')));
DROP POLICY IF EXISTS "rls_update" ON public.acoes;
CREATE POLICY "rls_update" ON public.acoes FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'programas')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'programas')));
DROP POLICY IF EXISTS "rls_delete" ON public.acoes;
CREATE POLICY "rls_delete" ON public.acoes FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'programas')));

-- adicionais_tempo_servico  [modulo: rh]
DROP POLICY IF EXISTS "rh_module_delete" ON public.adicionais_tempo_servico;
DROP POLICY IF EXISTS "rh_module_select" ON public.adicionais_tempo_servico;
DROP POLICY IF EXISTS "rh_module_update" ON public.adicionais_tempo_servico;
DROP POLICY IF EXISTS "rh_module_write" ON public.adicionais_tempo_servico;
DROP POLICY IF EXISTS "rls_select" ON public.adicionais_tempo_servico;
CREATE POLICY "rls_select" ON public.adicionais_tempo_servico FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.adicionais_tempo_servico;
CREATE POLICY "rls_insert" ON public.adicionais_tempo_servico FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.adicionais_tempo_servico;
CREATE POLICY "rls_update" ON public.adicionais_tempo_servico FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.adicionais_tempo_servico;
CREATE POLICY "rls_delete" ON public.adicionais_tempo_servico FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- aditivos_contrato  [modulo: compras | contratos]
DROP POLICY IF EXISTS "comp_module_delete" ON public.aditivos_contrato;
DROP POLICY IF EXISTS "comp_module_select" ON public.aditivos_contrato;
DROP POLICY IF EXISTS "comp_module_update" ON public.aditivos_contrato;
DROP POLICY IF EXISTS "comp_module_write" ON public.aditivos_contrato;
DROP POLICY IF EXISTS "rls_select" ON public.aditivos_contrato;
CREATE POLICY "rls_select" ON public.aditivos_contrato FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_insert" ON public.aditivos_contrato;
CREATE POLICY "rls_insert" ON public.aditivos_contrato FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_update" ON public.aditivos_contrato;
CREATE POLICY "rls_update" ON public.aditivos_contrato FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_delete" ON public.aditivos_contrato;
CREATE POLICY "rls_delete" ON public.aditivos_contrato FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));

-- agenda_unidade  [modulo: patrimonio | patrimonio_mobile]
DROP POLICY IF EXISTS "pat_module_delete" ON public.agenda_unidade;
DROP POLICY IF EXISTS "pat_module_select" ON public.agenda_unidade;
DROP POLICY IF EXISTS "pat_module_update" ON public.agenda_unidade;
DROP POLICY IF EXISTS "pat_module_write" ON public.agenda_unidade;
DROP POLICY IF EXISTS "rls_select" ON public.agenda_unidade;
CREATE POLICY "rls_select" ON public.agenda_unidade FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_insert" ON public.agenda_unidade;
CREATE POLICY "rls_insert" ON public.agenda_unidade FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_update" ON public.agenda_unidade;
CREATE POLICY "rls_update" ON public.agenda_unidade FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_delete" ON public.agenda_unidade;
CREATE POLICY "rls_delete" ON public.agenda_unidade FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));

-- agrupamento_unidade_vinculo  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.agrupamento_unidade_vinculo;
CREATE POLICY "rls_select" ON public.agrupamento_unidade_vinculo FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.agrupamento_unidade_vinculo;
CREATE POLICY "rls_insert" ON public.agrupamento_unidade_vinculo FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.agrupamento_unidade_vinculo;
CREATE POLICY "rls_update" ON public.agrupamento_unidade_vinculo FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.agrupamento_unidade_vinculo;
CREATE POLICY "rls_delete" ON public.agrupamento_unidade_vinculo FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- almoxarifados  [modulo: patrimonio | patrimonio_mobile]
DROP POLICY IF EXISTS "pat_module_delete" ON public.almoxarifados;
DROP POLICY IF EXISTS "pat_module_select" ON public.almoxarifados;
DROP POLICY IF EXISTS "pat_module_update" ON public.almoxarifados;
DROP POLICY IF EXISTS "pat_module_write" ON public.almoxarifados;
DROP POLICY IF EXISTS "rls_select" ON public.almoxarifados;
CREATE POLICY "rls_select" ON public.almoxarifados FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_insert" ON public.almoxarifados;
CREATE POLICY "rls_insert" ON public.almoxarifados FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_update" ON public.almoxarifados;
CREATE POLICY "rls_update" ON public.almoxarifados FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_delete" ON public.almoxarifados;
CREATE POLICY "rls_delete" ON public.almoxarifados FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));

-- approval_delegations  [modulo: workflow]
DROP POLICY IF EXISTS "rls_select" ON public.approval_delegations;
CREATE POLICY "rls_select" ON public.approval_delegations FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_insert" ON public.approval_delegations;
CREATE POLICY "rls_insert" ON public.approval_delegations FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_update" ON public.approval_delegations;
CREATE POLICY "rls_update" ON public.approval_delegations FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_delete" ON public.approval_delegations;
CREATE POLICY "rls_delete" ON public.approval_delegations FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')));

-- approval_requests  [modulo: workflow]
DROP POLICY IF EXISTS "rls_select" ON public.approval_requests;
CREATE POLICY "rls_select" ON public.approval_requests FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_insert" ON public.approval_requests;
CREATE POLICY "rls_insert" ON public.approval_requests FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_update" ON public.approval_requests;
CREATE POLICY "rls_update" ON public.approval_requests FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_delete" ON public.approval_requests;
CREATE POLICY "rls_delete" ON public.approval_requests FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')));

-- atas_registro_preco  [modulo: compras | contratos]
DROP POLICY IF EXISTS "comp_module_delete" ON public.atas_registro_preco;
DROP POLICY IF EXISTS "comp_module_select" ON public.atas_registro_preco;
DROP POLICY IF EXISTS "comp_module_update" ON public.atas_registro_preco;
DROP POLICY IF EXISTS "comp_module_write" ON public.atas_registro_preco;
DROP POLICY IF EXISTS "rls_select" ON public.atas_registro_preco;
CREATE POLICY "rls_select" ON public.atas_registro_preco FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_insert" ON public.atas_registro_preco;
CREATE POLICY "rls_insert" ON public.atas_registro_preco FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_update" ON public.atas_registro_preco;
CREATE POLICY "rls_update" ON public.atas_registro_preco FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_delete" ON public.atas_registro_preco;
CREATE POLICY "rls_delete" ON public.atas_registro_preco FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));

-- audit_log_licitacoes  [trilha: compras | contratos]
DROP POLICY IF EXISTS "rls_select" ON public.audit_log_licitacoes;
CREATE POLICY "rls_select" ON public.audit_log_licitacoes FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));

-- audit_logs  [admin_leitura]
DROP POLICY IF EXISTS "admin_only_select" ON public.audit_logs;
DROP POLICY IF EXISTS "rls_select" ON public.audit_logs;
CREATE POLICY "rls_select" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- avaliacoes_controle  [modulo: governanca]
DROP POLICY IF EXISTS "rls_select" ON public.avaliacoes_controle;
CREATE POLICY "rls_select" ON public.avaliacoes_controle FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_insert" ON public.avaliacoes_controle;
CREATE POLICY "rls_insert" ON public.avaliacoes_controle FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_update" ON public.avaliacoes_controle;
CREATE POLICY "rls_update" ON public.avaliacoes_controle FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_delete" ON public.avaliacoes_controle;
CREATE POLICY "rls_delete" ON public.avaliacoes_controle FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')));

-- avaliacoes_risco  [modulo: governanca]
DROP POLICY IF EXISTS "rls_select" ON public.avaliacoes_risco;
CREATE POLICY "rls_select" ON public.avaliacoes_risco FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_insert" ON public.avaliacoes_risco;
CREATE POLICY "rls_insert" ON public.avaliacoes_risco FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_update" ON public.avaliacoes_risco;
CREATE POLICY "rls_update" ON public.avaliacoes_risco FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_delete" ON public.avaliacoes_risco;
CREATE POLICY "rls_delete" ON public.avaliacoes_risco FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')));

-- avisos  [preservar: comunicacao]
-- (nenhuma policy gerada)

-- avisos_leituras  [preservar: comunicacao]
-- (nenhuma policy gerada)

-- backup_config  [admin]
DROP POLICY IF EXISTS "admin_only_delete" ON public.backup_config;
DROP POLICY IF EXISTS "admin_only_insert" ON public.backup_config;
DROP POLICY IF EXISTS "admin_only_select" ON public.backup_config;
DROP POLICY IF EXISTS "admin_only_update" ON public.backup_config;
DROP POLICY IF EXISTS "rls_select" ON public.backup_config;
CREATE POLICY "rls_select" ON public.backup_config FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_insert" ON public.backup_config;
CREATE POLICY "rls_insert" ON public.backup_config FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.backup_config;
CREATE POLICY "rls_update" ON public.backup_config FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.backup_config;
CREATE POLICY "rls_delete" ON public.backup_config FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- backup_history  [admin]
DROP POLICY IF EXISTS "admin_only_delete" ON public.backup_history;
DROP POLICY IF EXISTS "admin_only_insert" ON public.backup_history;
DROP POLICY IF EXISTS "admin_only_select" ON public.backup_history;
DROP POLICY IF EXISTS "admin_only_update" ON public.backup_history;
DROP POLICY IF EXISTS "rls_select" ON public.backup_history;
CREATE POLICY "rls_select" ON public.backup_history FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_insert" ON public.backup_history;
CREATE POLICY "rls_insert" ON public.backup_history FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.backup_history;
CREATE POLICY "rls_update" ON public.backup_history FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.backup_history;
CREATE POLICY "rls_delete" ON public.backup_history FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- backup_integrity_checks  [admin]
DROP POLICY IF EXISTS "admin_only_delete" ON public.backup_integrity_checks;
DROP POLICY IF EXISTS "admin_only_insert" ON public.backup_integrity_checks;
DROP POLICY IF EXISTS "admin_only_select" ON public.backup_integrity_checks;
DROP POLICY IF EXISTS "admin_only_update" ON public.backup_integrity_checks;
DROP POLICY IF EXISTS "rls_select" ON public.backup_integrity_checks;
CREATE POLICY "rls_select" ON public.backup_integrity_checks FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_insert" ON public.backup_integrity_checks;
CREATE POLICY "rls_insert" ON public.backup_integrity_checks FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.backup_integrity_checks;
CREATE POLICY "rls_update" ON public.backup_integrity_checks FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.backup_integrity_checks;
CREATE POLICY "rls_delete" ON public.backup_integrity_checks FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- baixas_patrimonio  [modulo: patrimonio | patrimonio_mobile]
DROP POLICY IF EXISTS "pat_module_delete" ON public.baixas_patrimonio;
DROP POLICY IF EXISTS "pat_module_select" ON public.baixas_patrimonio;
DROP POLICY IF EXISTS "pat_module_update" ON public.baixas_patrimonio;
DROP POLICY IF EXISTS "pat_module_write" ON public.baixas_patrimonio;
DROP POLICY IF EXISTS "rls_select" ON public.baixas_patrimonio;
CREATE POLICY "rls_select" ON public.baixas_patrimonio FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_insert" ON public.baixas_patrimonio;
CREATE POLICY "rls_insert" ON public.baixas_patrimonio FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_update" ON public.baixas_patrimonio;
CREATE POLICY "rls_update" ON public.baixas_patrimonio FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_delete" ON public.baixas_patrimonio;
CREATE POLICY "rls_delete" ON public.baixas_patrimonio FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));

-- banco_horas  [proprio_leitura: rh]
DROP POLICY IF EXISTS "rls_select" ON public.banco_horas;
CREATE POLICY "rls_select" ON public.banco_horas FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.banco_horas;
CREATE POLICY "rls_insert" ON public.banco_horas FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.banco_horas;
CREATE POLICY "rls_update" ON public.banco_horas FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.banco_horas;
CREATE POLICY "rls_delete" ON public.banco_horas FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- bancos_cnab  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.bancos_cnab;
CREATE POLICY "rls_select" ON public.bancos_cnab FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.bancos_cnab;
CREATE POLICY "rls_insert" ON public.bancos_cnab FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.bancos_cnab;
CREATE POLICY "rls_update" ON public.bancos_cnab FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.bancos_cnab;
CREATE POLICY "rls_delete" ON public.bancos_cnab FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- bens_patrimoniais  [modulo: patrimonio | patrimonio_mobile]
DROP POLICY IF EXISTS "pat_module_delete" ON public.bens_patrimoniais;
DROP POLICY IF EXISTS "pat_module_select" ON public.bens_patrimoniais;
DROP POLICY IF EXISTS "pat_module_update" ON public.bens_patrimoniais;
DROP POLICY IF EXISTS "pat_module_write" ON public.bens_patrimoniais;
DROP POLICY IF EXISTS "rls_select" ON public.bens_patrimoniais;
CREATE POLICY "rls_select" ON public.bens_patrimoniais FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_insert" ON public.bens_patrimoniais;
CREATE POLICY "rls_insert" ON public.bens_patrimoniais FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_update" ON public.bens_patrimoniais;
CREATE POLICY "rls_update" ON public.bens_patrimoniais FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_delete" ON public.bens_patrimoniais;
CREATE POLICY "rls_delete" ON public.bens_patrimoniais FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));

-- cadastro_arbitros  [modulo: arbitros]
DROP POLICY IF EXISTS "authenticated_read_arbitros" ON public.cadastro_arbitros;
DROP POLICY IF EXISTS "authenticated_update_arbitros" ON public.cadastro_arbitros;
DROP POLICY IF EXISTS "authenticated_delete_arbitros" ON public.cadastro_arbitros;
DROP POLICY IF EXISTS "rls_select" ON public.cadastro_arbitros;
CREATE POLICY "rls_select" ON public.cadastro_arbitros FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'arbitros')));
DROP POLICY IF EXISTS "rls_insert" ON public.cadastro_arbitros;
CREATE POLICY "rls_insert" ON public.cadastro_arbitros FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'arbitros')));
DROP POLICY IF EXISTS "rls_update" ON public.cadastro_arbitros;
CREATE POLICY "rls_update" ON public.cadastro_arbitros FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'arbitros')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'arbitros')));
DROP POLICY IF EXISTS "rls_delete" ON public.cadastro_arbitros;
CREATE POLICY "rls_delete" ON public.cadastro_arbitros FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'arbitros')));

-- cadastro_arbitros_modalidades  [modulo: arbitros]
DROP POLICY IF EXISTS "arbitros_modalidades_select_authenticated" ON public.cadastro_arbitros_modalidades;
DROP POLICY IF EXISTS "Admin pode deletar modalidades" ON public.cadastro_arbitros_modalidades;
DROP POLICY IF EXISTS "Admin pode atualizar modalidades" ON public.cadastro_arbitros_modalidades;
DROP POLICY IF EXISTS "rls_select" ON public.cadastro_arbitros_modalidades;
CREATE POLICY "rls_select" ON public.cadastro_arbitros_modalidades FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'arbitros')));
DROP POLICY IF EXISTS "rls_insert" ON public.cadastro_arbitros_modalidades;
CREATE POLICY "rls_insert" ON public.cadastro_arbitros_modalidades FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'arbitros')));
DROP POLICY IF EXISTS "rls_update" ON public.cadastro_arbitros_modalidades;
CREATE POLICY "rls_update" ON public.cadastro_arbitros_modalidades FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'arbitros')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'arbitros')));
DROP POLICY IF EXISTS "rls_delete" ON public.cadastro_arbitros_modalidades;
CREATE POLICY "rls_delete" ON public.cadastro_arbitros_modalidades FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'arbitros')));

-- calendario_federacao  [modulo: federacoes]
DROP POLICY IF EXISTS "rls_select" ON public.calendario_federacao;
CREATE POLICY "rls_select" ON public.calendario_federacao FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'federacoes')));
DROP POLICY IF EXISTS "rls_insert" ON public.calendario_federacao;
CREATE POLICY "rls_insert" ON public.calendario_federacao FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'federacoes')));
DROP POLICY IF EXISTS "rls_update" ON public.calendario_federacao;
CREATE POLICY "rls_update" ON public.calendario_federacao FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'federacoes')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'federacoes')));
DROP POLICY IF EXISTS "rls_delete" ON public.calendario_federacao;
CREATE POLICY "rls_delete" ON public.calendario_federacao FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'federacoes')));

-- campanhas_inventario  [modulo: patrimonio | patrimonio_mobile]
DROP POLICY IF EXISTS "rls_select" ON public.campanhas_inventario;
CREATE POLICY "rls_select" ON public.campanhas_inventario FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_insert" ON public.campanhas_inventario;
CREATE POLICY "rls_insert" ON public.campanhas_inventario FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_update" ON public.campanhas_inventario;
CREATE POLICY "rls_update" ON public.campanhas_inventario FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_delete" ON public.campanhas_inventario;
CREATE POLICY "rls_delete" ON public.campanhas_inventario FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));

-- campanhas_inventario_unidades  [modulo: patrimonio | patrimonio_mobile]
DROP POLICY IF EXISTS "rls_select" ON public.campanhas_inventario_unidades;
CREATE POLICY "rls_select" ON public.campanhas_inventario_unidades FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_insert" ON public.campanhas_inventario_unidades;
CREATE POLICY "rls_insert" ON public.campanhas_inventario_unidades FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_update" ON public.campanhas_inventario_unidades;
CREATE POLICY "rls_update" ON public.campanhas_inventario_unidades FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_delete" ON public.campanhas_inventario_unidades;
CREATE POLICY "rls_delete" ON public.campanhas_inventario_unidades FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));

-- cargo_unidade_compatibilidade  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.cargo_unidade_compatibilidade;
CREATE POLICY "rls_select" ON public.cargo_unidade_compatibilidade FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.cargo_unidade_compatibilidade;
CREATE POLICY "rls_insert" ON public.cargo_unidade_compatibilidade FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.cargo_unidade_compatibilidade;
CREATE POLICY "rls_update" ON public.cargo_unidade_compatibilidade FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.cargo_unidade_compatibilidade;
CREATE POLICY "rls_delete" ON public.cargo_unidade_compatibilidade FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- cargos  [modulo: rh]
DROP POLICY IF EXISTS "rh_module_delete" ON public.cargos;
DROP POLICY IF EXISTS "rh_module_select" ON public.cargos;
DROP POLICY IF EXISTS "rh_module_update" ON public.cargos;
DROP POLICY IF EXISTS "rh_module_write" ON public.cargos;
DROP POLICY IF EXISTS "rls_select" ON public.cargos;
CREATE POLICY "rls_select" ON public.cargos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.cargos;
CREATE POLICY "rls_insert" ON public.cargos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.cargos;
CREATE POLICY "rls_update" ON public.cargos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.cargos;
CREATE POLICY "rls_delete" ON public.cargos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- categorias_material  [modulo: patrimonio | patrimonio_mobile]
DROP POLICY IF EXISTS "rls_select" ON public.categorias_material;
CREATE POLICY "rls_select" ON public.categorias_material FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_insert" ON public.categorias_material;
CREATE POLICY "rls_insert" ON public.categorias_material FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_update" ON public.categorias_material;
CREATE POLICY "rls_update" ON public.categorias_material FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_delete" ON public.categorias_material;
CREATE POLICY "rls_delete" ON public.categorias_material FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));

-- categorias_noticias_eventos  [modulo: comunicacao]
DROP POLICY IF EXISTS "rls_select" ON public.categorias_noticias_eventos;
CREATE POLICY "rls_select" ON public.categorias_noticias_eventos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_insert" ON public.categorias_noticias_eventos;
CREATE POLICY "rls_insert" ON public.categorias_noticias_eventos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_update" ON public.categorias_noticias_eventos;
CREATE POLICY "rls_update" ON public.categorias_noticias_eventos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_delete" ON public.categorias_noticias_eventos;
CREATE POLICY "rls_delete" ON public.categorias_noticias_eventos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));

-- centros_custo  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.centros_custo;
CREATE POLICY "rls_select" ON public.centros_custo FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.centros_custo;
CREATE POLICY "rls_insert" ON public.centros_custo FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.centros_custo;
CREATE POLICY "rls_update" ON public.centros_custo FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.centros_custo;
CREATE POLICY "rls_delete" ON public.centros_custo FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- cessoes  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.cessoes;
CREATE POLICY "rls_select" ON public.cessoes FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.cessoes;
CREATE POLICY "rls_insert" ON public.cessoes FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.cessoes;
CREATE POLICY "rls_update" ON public.cessoes FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.cessoes;
CREATE POLICY "rls_delete" ON public.cessoes FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- checklists_conformidade  [modulo: governanca]
DROP POLICY IF EXISTS "rls_select" ON public.checklists_conformidade;
CREATE POLICY "rls_select" ON public.checklists_conformidade FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_insert" ON public.checklists_conformidade;
CREATE POLICY "rls_insert" ON public.checklists_conformidade FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_update" ON public.checklists_conformidade;
CREATE POLICY "rls_update" ON public.checklists_conformidade FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_delete" ON public.checklists_conformidade;
CREATE POLICY "rls_delete" ON public.checklists_conformidade FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')));

-- cms_banners  [modulo: comunicacao]
DROP POLICY IF EXISTS "rls_select" ON public.cms_banners;
CREATE POLICY "rls_select" ON public.cms_banners FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_insert" ON public.cms_banners;
CREATE POLICY "rls_insert" ON public.cms_banners FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_update" ON public.cms_banners;
CREATE POLICY "rls_update" ON public.cms_banners FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_delete" ON public.cms_banners;
CREATE POLICY "rls_delete" ON public.cms_banners FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));

-- cms_categorias  [modulo: comunicacao]
DROP POLICY IF EXISTS "rls_select" ON public.cms_categorias;
CREATE POLICY "rls_select" ON public.cms_categorias FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_insert" ON public.cms_categorias;
CREATE POLICY "rls_insert" ON public.cms_categorias FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_update" ON public.cms_categorias;
CREATE POLICY "rls_update" ON public.cms_categorias FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_delete" ON public.cms_categorias;
CREATE POLICY "rls_delete" ON public.cms_categorias FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));

-- cms_conteudos  [modulo: comunicacao]
DROP POLICY IF EXISTS "rls_select" ON public.cms_conteudos;
CREATE POLICY "rls_select" ON public.cms_conteudos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_insert" ON public.cms_conteudos;
CREATE POLICY "rls_insert" ON public.cms_conteudos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_update" ON public.cms_conteudos;
CREATE POLICY "rls_update" ON public.cms_conteudos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_delete" ON public.cms_conteudos;
CREATE POLICY "rls_delete" ON public.cms_conteudos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));

-- cms_galeria_fotos  [modulo: comunicacao]
DROP POLICY IF EXISTS "rls_select" ON public.cms_galeria_fotos;
CREATE POLICY "rls_select" ON public.cms_galeria_fotos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_insert" ON public.cms_galeria_fotos;
CREATE POLICY "rls_insert" ON public.cms_galeria_fotos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_update" ON public.cms_galeria_fotos;
CREATE POLICY "rls_update" ON public.cms_galeria_fotos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_delete" ON public.cms_galeria_fotos;
CREATE POLICY "rls_delete" ON public.cms_galeria_fotos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));

-- cms_galerias  [modulo: comunicacao]
DROP POLICY IF EXISTS "rls_select" ON public.cms_galerias;
CREATE POLICY "rls_select" ON public.cms_galerias FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_insert" ON public.cms_galerias;
CREATE POLICY "rls_insert" ON public.cms_galerias FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_update" ON public.cms_galerias;
CREATE POLICY "rls_update" ON public.cms_galerias FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_delete" ON public.cms_galerias;
CREATE POLICY "rls_delete" ON public.cms_galerias FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));

-- cms_media  [modulo: comunicacao]
DROP POLICY IF EXISTS "rls_select" ON public.cms_media;
CREATE POLICY "rls_select" ON public.cms_media FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_insert" ON public.cms_media;
CREATE POLICY "rls_insert" ON public.cms_media FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_update" ON public.cms_media;
CREATE POLICY "rls_update" ON public.cms_media FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_delete" ON public.cms_media;
CREATE POLICY "rls_delete" ON public.cms_media FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));

-- coletas_inventario  [modulo: patrimonio | patrimonio_mobile]
DROP POLICY IF EXISTS "rls_select" ON public.coletas_inventario;
CREATE POLICY "rls_select" ON public.coletas_inventario FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_insert" ON public.coletas_inventario;
CREATE POLICY "rls_insert" ON public.coletas_inventario FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_update" ON public.coletas_inventario;
CREATE POLICY "rls_update" ON public.coletas_inventario FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_delete" ON public.coletas_inventario;
CREATE POLICY "rls_delete" ON public.coletas_inventario FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));

-- composicao_cargos  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.composicao_cargos;
CREATE POLICY "rls_select" ON public.composicao_cargos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.composicao_cargos;
CREATE POLICY "rls_insert" ON public.composicao_cargos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.composicao_cargos;
CREATE POLICY "rls_update" ON public.composicao_cargos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.composicao_cargos;
CREATE POLICY "rls_delete" ON public.composicao_cargos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- conciliacoes_inventario  [modulo: patrimonio | patrimonio_mobile]
DROP POLICY IF EXISTS "rls_select" ON public.conciliacoes_inventario;
CREATE POLICY "rls_select" ON public.conciliacoes_inventario FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_insert" ON public.conciliacoes_inventario;
CREATE POLICY "rls_insert" ON public.conciliacoes_inventario FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_update" ON public.conciliacoes_inventario;
CREATE POLICY "rls_update" ON public.conciliacoes_inventario FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_delete" ON public.conciliacoes_inventario;
CREATE POLICY "rls_delete" ON public.conciliacoes_inventario FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));

-- config_agrupamento_unidades  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.config_agrupamento_unidades;
CREATE POLICY "rls_select" ON public.config_agrupamento_unidades FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.config_agrupamento_unidades;
CREATE POLICY "rls_insert" ON public.config_agrupamento_unidades FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.config_agrupamento_unidades;
CREATE POLICY "rls_update" ON public.config_agrupamento_unidades FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.config_agrupamento_unidades;
CREATE POLICY "rls_delete" ON public.config_agrupamento_unidades FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- config_assinatura_frequencia  [catalogo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.config_assinatura_frequencia;
CREATE POLICY "rls_select" ON public.config_assinatura_frequencia FOR SELECT TO authenticated
  USING (public.is_active_user());
DROP POLICY IF EXISTS "rls_insert" ON public.config_assinatura_frequencia;
CREATE POLICY "rls_insert" ON public.config_assinatura_frequencia FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.config_assinatura_frequencia;
CREATE POLICY "rls_update" ON public.config_assinatura_frequencia FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.config_assinatura_frequencia;
CREATE POLICY "rls_delete" ON public.config_assinatura_frequencia FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- config_assinatura_reuniao  [modulo: gabinete]
DROP POLICY IF EXISTS "rls_select" ON public.config_assinatura_reuniao;
CREATE POLICY "rls_select" ON public.config_assinatura_reuniao FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gabinete')));
DROP POLICY IF EXISTS "rls_insert" ON public.config_assinatura_reuniao;
CREATE POLICY "rls_insert" ON public.config_assinatura_reuniao FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'gabinete')));
DROP POLICY IF EXISTS "rls_update" ON public.config_assinatura_reuniao;
CREATE POLICY "rls_update" ON public.config_assinatura_reuniao FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gabinete')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'gabinete')));
DROP POLICY IF EXISTS "rls_delete" ON public.config_assinatura_reuniao;
CREATE POLICY "rls_delete" ON public.config_assinatura_reuniao FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gabinete')));

-- config_autarquia  [modulo: rh | financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.config_autarquia;
CREATE POLICY "rls_select" ON public.config_autarquia FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.config_autarquia;
CREATE POLICY "rls_insert" ON public.config_autarquia FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.config_autarquia;
CREATE POLICY "rls_update" ON public.config_autarquia FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.config_autarquia;
CREATE POLICY "rls_delete" ON public.config_autarquia FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'financeiro')));

-- config_compensacao  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.config_compensacao;
CREATE POLICY "rls_select" ON public.config_compensacao FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.config_compensacao;
CREATE POLICY "rls_insert" ON public.config_compensacao FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.config_compensacao;
CREATE POLICY "rls_update" ON public.config_compensacao FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.config_compensacao;
CREATE POLICY "rls_delete" ON public.config_compensacao FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- config_envio  [preservar: admin]
-- (nenhuma policy gerada)

-- config_fechamento_folha  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.config_fechamento_folha;
CREATE POLICY "rls_select" ON public.config_fechamento_folha FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.config_fechamento_folha;
CREATE POLICY "rls_insert" ON public.config_fechamento_folha FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.config_fechamento_folha;
CREATE POLICY "rls_update" ON public.config_fechamento_folha FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.config_fechamento_folha;
CREATE POLICY "rls_delete" ON public.config_fechamento_folha FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- config_fechamento_frequencia  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.config_fechamento_frequencia;
CREATE POLICY "rls_select" ON public.config_fechamento_frequencia FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.config_fechamento_frequencia;
CREATE POLICY "rls_insert" ON public.config_fechamento_frequencia FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.config_fechamento_frequencia;
CREATE POLICY "rls_update" ON public.config_fechamento_frequencia FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.config_fechamento_frequencia;
CREATE POLICY "rls_delete" ON public.config_fechamento_frequencia FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- config_incidencias  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.config_incidencias;
CREATE POLICY "rls_select" ON public.config_incidencias FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.config_incidencias;
CREATE POLICY "rls_insert" ON public.config_incidencias FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.config_incidencias;
CREATE POLICY "rls_update" ON public.config_incidencias FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.config_incidencias;
CREATE POLICY "rls_delete" ON public.config_incidencias FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- config_institucional  [modulo: rh | financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.config_institucional;
CREATE POLICY "rls_select" ON public.config_institucional FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.config_institucional;
CREATE POLICY "rls_insert" ON public.config_institucional FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.config_institucional;
CREATE POLICY "rls_update" ON public.config_institucional FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.config_institucional;
CREATE POLICY "rls_delete" ON public.config_institucional FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'financeiro')));

-- config_jornada_padrao  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.config_jornada_padrao;
CREATE POLICY "rls_select" ON public.config_jornada_padrao FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.config_jornada_padrao;
CREATE POLICY "rls_insert" ON public.config_jornada_padrao FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.config_jornada_padrao;
CREATE POLICY "rls_update" ON public.config_jornada_padrao FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.config_jornada_padrao;
CREATE POLICY "rls_delete" ON public.config_jornada_padrao FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- config_menu_publico  [publico_admin]
DROP POLICY IF EXISTS "Apenas admins podem alterar menu publico" ON public.config_menu_publico;
DROP POLICY IF EXISTS "Leitura publica dos itens de menu" ON public.config_menu_publico;
DROP POLICY IF EXISTS "rls_select" ON public.config_menu_publico;
CREATE POLICY "rls_select" ON public.config_menu_publico FOR SELECT TO anon, authenticated
  USING (true);
DROP POLICY IF EXISTS "rls_insert" ON public.config_menu_publico;
CREATE POLICY "rls_insert" ON public.config_menu_publico FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.config_menu_publico;
CREATE POLICY "rls_update" ON public.config_menu_publico FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.config_menu_publico;
CREATE POLICY "rls_delete" ON public.config_menu_publico FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- config_motivos_desligamento  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.config_motivos_desligamento;
CREATE POLICY "rls_select" ON public.config_motivos_desligamento FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.config_motivos_desligamento;
CREATE POLICY "rls_insert" ON public.config_motivos_desligamento FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.config_motivos_desligamento;
CREATE POLICY "rls_update" ON public.config_motivos_desligamento FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.config_motivos_desligamento;
CREATE POLICY "rls_delete" ON public.config_motivos_desligamento FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- config_paginas_historico  [admin: admin]
DROP POLICY IF EXISTS "rls_select" ON public.config_paginas_historico;
CREATE POLICY "rls_select" ON public.config_paginas_historico FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_insert" ON public.config_paginas_historico;
CREATE POLICY "rls_insert" ON public.config_paginas_historico FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.config_paginas_historico;
CREATE POLICY "rls_update" ON public.config_paginas_historico FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.config_paginas_historico;
CREATE POLICY "rls_delete" ON public.config_paginas_historico FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- config_paginas_publicas  [publico_admin]
DROP POLICY IF EXISTS "Apenas admins podem alterar config paginas" ON public.config_paginas_publicas;
DROP POLICY IF EXISTS "Leitura publica do status das paginas" ON public.config_paginas_publicas;
DROP POLICY IF EXISTS "leitura_publica_status_paginas" ON public.config_paginas_publicas;
DROP POLICY IF EXISTS "rls_select" ON public.config_paginas_publicas;
CREATE POLICY "rls_select" ON public.config_paginas_publicas FOR SELECT TO anon, authenticated
  USING (true);
DROP POLICY IF EXISTS "rls_insert" ON public.config_paginas_publicas;
CREATE POLICY "rls_insert" ON public.config_paginas_publicas FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.config_paginas_publicas;
CREATE POLICY "rls_update" ON public.config_paginas_publicas FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.config_paginas_publicas;
CREATE POLICY "rls_delete" ON public.config_paginas_publicas FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- config_parametros_meta  [catalogo_admin]
DROP POLICY IF EXISTS "rls_select" ON public.config_parametros_meta;
CREATE POLICY "rls_select" ON public.config_parametros_meta FOR SELECT TO authenticated
  USING (public.is_active_user());
DROP POLICY IF EXISTS "rls_insert" ON public.config_parametros_meta;
CREATE POLICY "rls_insert" ON public.config_parametros_meta FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.config_parametros_meta;
CREATE POLICY "rls_update" ON public.config_parametros_meta FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.config_parametros_meta;
CREATE POLICY "rls_delete" ON public.config_parametros_meta FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- config_parametros_valores  [admin: admin]
DROP POLICY IF EXISTS "rls_select" ON public.config_parametros_valores;
CREATE POLICY "rls_select" ON public.config_parametros_valores FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_insert" ON public.config_parametros_valores;
CREATE POLICY "rls_insert" ON public.config_parametros_valores FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.config_parametros_valores;
CREATE POLICY "rls_update" ON public.config_parametros_valores FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.config_parametros_valores;
CREATE POLICY "rls_delete" ON public.config_parametros_valores FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- config_regras_calculo  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.config_regras_calculo;
CREATE POLICY "rls_select" ON public.config_regras_calculo FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.config_regras_calculo;
CREATE POLICY "rls_insert" ON public.config_regras_calculo FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.config_regras_calculo;
CREATE POLICY "rls_update" ON public.config_regras_calculo FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.config_regras_calculo;
CREATE POLICY "rls_delete" ON public.config_regras_calculo FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- config_rubricas  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.config_rubricas;
CREATE POLICY "rls_select" ON public.config_rubricas FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.config_rubricas;
CREATE POLICY "rls_insert" ON public.config_rubricas FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.config_rubricas;
CREATE POLICY "rls_update" ON public.config_rubricas FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.config_rubricas;
CREATE POLICY "rls_delete" ON public.config_rubricas FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- config_situacoes_funcionais  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.config_situacoes_funcionais;
CREATE POLICY "rls_select" ON public.config_situacoes_funcionais FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.config_situacoes_funcionais;
CREATE POLICY "rls_insert" ON public.config_situacoes_funcionais FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.config_situacoes_funcionais;
CREATE POLICY "rls_update" ON public.config_situacoes_funcionais FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.config_situacoes_funcionais;
CREATE POLICY "rls_delete" ON public.config_situacoes_funcionais FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- config_tipos_ato  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.config_tipos_ato;
CREATE POLICY "rls_select" ON public.config_tipos_ato FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.config_tipos_ato;
CREATE POLICY "rls_insert" ON public.config_tipos_ato FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.config_tipos_ato;
CREATE POLICY "rls_update" ON public.config_tipos_ato FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.config_tipos_ato;
CREATE POLICY "rls_delete" ON public.config_tipos_ato FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- config_tipos_onus  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.config_tipos_onus;
CREATE POLICY "rls_select" ON public.config_tipos_onus FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.config_tipos_onus;
CREATE POLICY "rls_insert" ON public.config_tipos_onus FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.config_tipos_onus;
CREATE POLICY "rls_update" ON public.config_tipos_onus FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.config_tipos_onus;
CREATE POLICY "rls_delete" ON public.config_tipos_onus FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- config_tipos_rubrica  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.config_tipos_rubrica;
CREATE POLICY "rls_select" ON public.config_tipos_rubrica FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.config_tipos_rubrica;
CREATE POLICY "rls_insert" ON public.config_tipos_rubrica FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.config_tipos_rubrica;
CREATE POLICY "rls_update" ON public.config_tipos_rubrica FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.config_tipos_rubrica;
CREATE POLICY "rls_delete" ON public.config_tipos_rubrica FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- config_tipos_servidor  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.config_tipos_servidor;
CREATE POLICY "rls_select" ON public.config_tipos_servidor FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.config_tipos_servidor;
CREATE POLICY "rls_insert" ON public.config_tipos_servidor FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.config_tipos_servidor;
CREATE POLICY "rls_update" ON public.config_tipos_servidor FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.config_tipos_servidor;
CREATE POLICY "rls_delete" ON public.config_tipos_servidor FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- configuracao_jornada  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.configuracao_jornada;
CREATE POLICY "rls_select" ON public.configuracao_jornada FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.configuracao_jornada;
CREATE POLICY "rls_insert" ON public.configuracao_jornada FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.configuracao_jornada;
CREATE POLICY "rls_update" ON public.configuracao_jornada FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.configuracao_jornada;
CREATE POLICY "rls_delete" ON public.configuracao_jornada FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- consignacoes  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.consignacoes;
CREATE POLICY "rls_select" ON public.consignacoes FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.consignacoes;
CREATE POLICY "rls_insert" ON public.consignacoes FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.consignacoes;
CREATE POLICY "rls_update" ON public.consignacoes FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.consignacoes;
CREATE POLICY "rls_delete" ON public.consignacoes FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- contas_autarquia  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.contas_autarquia;
CREATE POLICY "rls_select" ON public.contas_autarquia FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.contas_autarquia;
CREATE POLICY "rls_insert" ON public.contas_autarquia FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.contas_autarquia;
CREATE POLICY "rls_update" ON public.contas_autarquia FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.contas_autarquia;
CREATE POLICY "rls_delete" ON public.contas_autarquia FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- contatos_eventos_esportivos  [modulo: comunicacao]
DROP POLICY IF EXISTS "rls_select" ON public.contatos_eventos_esportivos;
CREATE POLICY "rls_select" ON public.contatos_eventos_esportivos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_insert" ON public.contatos_eventos_esportivos;
CREATE POLICY "rls_insert" ON public.contatos_eventos_esportivos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_update" ON public.contatos_eventos_esportivos;
CREATE POLICY "rls_update" ON public.contatos_eventos_esportivos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_delete" ON public.contatos_eventos_esportivos;
CREATE POLICY "rls_delete" ON public.contatos_eventos_esportivos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));

-- conteudo_rascunho  [modulo: comunicacao]
DROP POLICY IF EXISTS "rls_select" ON public.conteudo_rascunho;
CREATE POLICY "rls_select" ON public.conteudo_rascunho FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_insert" ON public.conteudo_rascunho;
CREATE POLICY "rls_insert" ON public.conteudo_rascunho FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_update" ON public.conteudo_rascunho;
CREATE POLICY "rls_update" ON public.conteudo_rascunho FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_delete" ON public.conteudo_rascunho;
CREATE POLICY "rls_delete" ON public.conteudo_rascunho FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));

-- contratos  [modulo: compras | contratos]
DROP POLICY IF EXISTS "comp_module_delete" ON public.contratos;
DROP POLICY IF EXISTS "comp_module_select" ON public.contratos;
DROP POLICY IF EXISTS "comp_module_update" ON public.contratos;
DROP POLICY IF EXISTS "comp_module_write" ON public.contratos;
DROP POLICY IF EXISTS "rls_select" ON public.contratos;
CREATE POLICY "rls_select" ON public.contratos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_insert" ON public.contratos;
CREATE POLICY "rls_insert" ON public.contratos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_update" ON public.contratos;
CREATE POLICY "rls_update" ON public.contratos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_delete" ON public.contratos;
CREATE POLICY "rls_delete" ON public.contratos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));

-- controles_internos  [modulo: governanca]
DROP POLICY IF EXISTS "rls_select" ON public.controles_internos;
CREATE POLICY "rls_select" ON public.controles_internos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_insert" ON public.controles_internos;
CREATE POLICY "rls_insert" ON public.controles_internos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_update" ON public.controles_internos;
CREATE POLICY "rls_update" ON public.controles_internos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_delete" ON public.controles_internos;
CREATE POLICY "rls_delete" ON public.controles_internos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')));

-- creditos_adicionais  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.creditos_adicionais;
CREATE POLICY "rls_select" ON public.creditos_adicionais FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.creditos_adicionais;
CREATE POLICY "rls_insert" ON public.creditos_adicionais FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.creditos_adicionais;
CREATE POLICY "rls_update" ON public.creditos_adicionais FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.creditos_adicionais;
CREATE POLICY "rls_delete" ON public.creditos_adicionais FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- dados_oficiais  [catalogo_admin]
DROP POLICY IF EXISTS "rls_select" ON public.dados_oficiais;
CREATE POLICY "rls_select" ON public.dados_oficiais FOR SELECT TO authenticated
  USING (public.is_active_user());
DROP POLICY IF EXISTS "rls_insert" ON public.dados_oficiais;
CREATE POLICY "rls_insert" ON public.dados_oficiais FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.dados_oficiais;
CREATE POLICY "rls_update" ON public.dados_oficiais FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.dados_oficiais;
CREATE POLICY "rls_delete" ON public.dados_oficiais FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- datas_importantes  [preservar: comunicacao]
-- (nenhuma policy gerada)

-- debitos_tecnicos  [admin: admin]
DROP POLICY IF EXISTS "rls_select" ON public.debitos_tecnicos;
CREATE POLICY "rls_select" ON public.debitos_tecnicos FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_insert" ON public.debitos_tecnicos;
CREATE POLICY "rls_insert" ON public.debitos_tecnicos FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.debitos_tecnicos;
CREATE POLICY "rls_update" ON public.debitos_tecnicos FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.debitos_tecnicos;
CREATE POLICY "rls_delete" ON public.debitos_tecnicos FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- decisoes_administrativas  [modulo: workflow]
DROP POLICY IF EXISTS "rls_select" ON public.decisoes_administrativas;
CREATE POLICY "rls_select" ON public.decisoes_administrativas FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_insert" ON public.decisoes_administrativas;
CREATE POLICY "rls_insert" ON public.decisoes_administrativas FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_update" ON public.decisoes_administrativas;
CREATE POLICY "rls_update" ON public.decisoes_administrativas FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_delete" ON public.decisoes_administrativas;
CREATE POLICY "rls_delete" ON public.decisoes_administrativas FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')));

-- demandas_ascom  [modulo: comunicacao]
DROP POLICY IF EXISTS "rls_select" ON public.demandas_ascom;
CREATE POLICY "rls_select" ON public.demandas_ascom FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_insert" ON public.demandas_ascom;
CREATE POLICY "rls_insert" ON public.demandas_ascom FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_update" ON public.demandas_ascom;
CREATE POLICY "rls_update" ON public.demandas_ascom FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_delete" ON public.demandas_ascom;
CREATE POLICY "rls_delete" ON public.demandas_ascom FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));

-- demandas_ascom_anexos  [modulo: comunicacao]
DROP POLICY IF EXISTS "rls_select" ON public.demandas_ascom_anexos;
CREATE POLICY "rls_select" ON public.demandas_ascom_anexos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_insert" ON public.demandas_ascom_anexos;
CREATE POLICY "rls_insert" ON public.demandas_ascom_anexos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_update" ON public.demandas_ascom_anexos;
CREATE POLICY "rls_update" ON public.demandas_ascom_anexos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_delete" ON public.demandas_ascom_anexos;
CREATE POLICY "rls_delete" ON public.demandas_ascom_anexos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));

-- demandas_ascom_comentarios  [modulo: comunicacao]
DROP POLICY IF EXISTS "rls_select" ON public.demandas_ascom_comentarios;
CREATE POLICY "rls_select" ON public.demandas_ascom_comentarios FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_insert" ON public.demandas_ascom_comentarios;
CREATE POLICY "rls_insert" ON public.demandas_ascom_comentarios FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_update" ON public.demandas_ascom_comentarios;
CREATE POLICY "rls_update" ON public.demandas_ascom_comentarios FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_delete" ON public.demandas_ascom_comentarios;
CREATE POLICY "rls_delete" ON public.demandas_ascom_comentarios FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));

-- demandas_ascom_entregaveis  [modulo: comunicacao]
DROP POLICY IF EXISTS "rls_select" ON public.demandas_ascom_entregaveis;
CREATE POLICY "rls_select" ON public.demandas_ascom_entregaveis FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_insert" ON public.demandas_ascom_entregaveis;
CREATE POLICY "rls_insert" ON public.demandas_ascom_entregaveis FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_update" ON public.demandas_ascom_entregaveis;
CREATE POLICY "rls_update" ON public.demandas_ascom_entregaveis FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_delete" ON public.demandas_ascom_entregaveis;
CREATE POLICY "rls_delete" ON public.demandas_ascom_entregaveis FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));

-- denuncias  [preservar: integridade]
-- (nenhuma policy gerada)

-- dependentes_irrf  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.dependentes_irrf;
CREATE POLICY "rls_select" ON public.dependentes_irrf FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.dependentes_irrf;
CREATE POLICY "rls_insert" ON public.dependentes_irrf FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.dependentes_irrf;
CREATE POLICY "rls_update" ON public.dependentes_irrf FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.dependentes_irrf;
CREATE POLICY "rls_delete" ON public.dependentes_irrf FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- designacoes  [proprio_leitura: rh]
DROP POLICY IF EXISTS "rls_select" ON public.designacoes;
CREATE POLICY "rls_select" ON public.designacoes FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.designacoes;
CREATE POLICY "rls_insert" ON public.designacoes FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.designacoes;
CREATE POLICY "rls_update" ON public.designacoes FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.designacoes;
CREATE POLICY "rls_delete" ON public.designacoes FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- despachos  [modulo: workflow]
DROP POLICY IF EXISTS "rls_select" ON public.despachos;
CREATE POLICY "rls_select" ON public.despachos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_insert" ON public.despachos;
CREATE POLICY "rls_insert" ON public.despachos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_update" ON public.despachos;
CREATE POLICY "rls_update" ON public.despachos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_delete" ON public.despachos;
CREATE POLICY "rls_delete" ON public.despachos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')));

-- dias_nao_uteis  [catalogo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.dias_nao_uteis;
CREATE POLICY "rls_select" ON public.dias_nao_uteis FOR SELECT TO authenticated
  USING (public.is_active_user());
DROP POLICY IF EXISTS "rls_insert" ON public.dias_nao_uteis;
CREATE POLICY "rls_insert" ON public.dias_nao_uteis FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.dias_nao_uteis;
CREATE POLICY "rls_update" ON public.dias_nao_uteis FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.dias_nao_uteis;
CREATE POLICY "rls_delete" ON public.dias_nao_uteis FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- documentos  [modulo: workflow | rh]
DROP POLICY IF EXISTS "rls_select" ON public.documentos;
CREATE POLICY "rls_select" ON public.documentos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow') OR public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.documentos;
CREATE POLICY "rls_insert" ON public.documentos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow') OR public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.documentos;
CREATE POLICY "rls_update" ON public.documentos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow') OR public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow') OR public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.documentos;
CREATE POLICY "rls_delete" ON public.documentos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow') OR public.can_access_module(auth.uid(), 'rh')));

-- documentos_cedencia  [modulo: patrimonio]
DROP POLICY IF EXISTS "rls_select" ON public.documentos_cedencia;
CREATE POLICY "rls_select" ON public.documentos_cedencia FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_insert" ON public.documentos_cedencia;
CREATE POLICY "rls_insert" ON public.documentos_cedencia FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_update" ON public.documentos_cedencia;
CREATE POLICY "rls_update" ON public.documentos_cedencia FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_delete" ON public.documentos_cedencia;
CREATE POLICY "rls_delete" ON public.documentos_cedencia FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')));

-- documentos_preparatorios_licitacao  [modulo: compras | contratos]
DROP POLICY IF EXISTS "rls_select" ON public.documentos_preparatorios_licitacao;
CREATE POLICY "rls_select" ON public.documentos_preparatorios_licitacao FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_insert" ON public.documentos_preparatorios_licitacao;
CREATE POLICY "rls_insert" ON public.documentos_preparatorios_licitacao FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_update" ON public.documentos_preparatorios_licitacao;
CREATE POLICY "rls_update" ON public.documentos_preparatorios_licitacao FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_delete" ON public.documentos_preparatorios_licitacao;
CREATE POLICY "rls_delete" ON public.documentos_preparatorios_licitacao FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));

-- documentos_processo  [modulo: workflow]
DROP POLICY IF EXISTS "rls_select" ON public.documentos_processo;
CREATE POLICY "rls_select" ON public.documentos_processo FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_insert" ON public.documentos_processo;
CREATE POLICY "rls_insert" ON public.documentos_processo FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_update" ON public.documentos_processo;
CREATE POLICY "rls_update" ON public.documentos_processo FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_delete" ON public.documentos_processo;
CREATE POLICY "rls_delete" ON public.documentos_processo FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')));

-- documentos_requerimento_servidor  [proprio: rh]
DROP POLICY IF EXISTS "rls_select" ON public.documentos_requerimento_servidor;
CREATE POLICY "rls_select" ON public.documentos_requerimento_servidor FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.documentos_requerimento_servidor;
CREATE POLICY "rls_insert" ON public.documentos_requerimento_servidor FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_update" ON public.documentos_requerimento_servidor;
CREATE POLICY "rls_update" ON public.documentos_requerimento_servidor FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.documentos_requerimento_servidor;
CREATE POLICY "rls_delete" ON public.documentos_requerimento_servidor FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- dotacoes_orcamentarias  [modulo: financeiro]
DROP POLICY IF EXISTS "fin_module_delete" ON public.dotacoes_orcamentarias;
DROP POLICY IF EXISTS "fin_module_select" ON public.dotacoes_orcamentarias;
DROP POLICY IF EXISTS "fin_module_update" ON public.dotacoes_orcamentarias;
DROP POLICY IF EXISTS "fin_module_write" ON public.dotacoes_orcamentarias;
DROP POLICY IF EXISTS "rls_select" ON public.dotacoes_orcamentarias;
CREATE POLICY "rls_select" ON public.dotacoes_orcamentarias FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.dotacoes_orcamentarias;
CREATE POLICY "rls_insert" ON public.dotacoes_orcamentarias FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.dotacoes_orcamentarias;
CREATE POLICY "rls_update" ON public.dotacoes_orcamentarias FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.dotacoes_orcamentarias;
CREATE POLICY "rls_delete" ON public.dotacoes_orcamentarias FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- empenhos  [modulo: financeiro]
DROP POLICY IF EXISTS "fin_module_delete" ON public.empenhos;
DROP POLICY IF EXISTS "fin_module_select" ON public.empenhos;
DROP POLICY IF EXISTS "fin_module_update" ON public.empenhos;
DROP POLICY IF EXISTS "fin_module_write" ON public.empenhos;
DROP POLICY IF EXISTS "rls_select" ON public.empenhos;
CREATE POLICY "rls_select" ON public.empenhos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.empenhos;
CREATE POLICY "rls_insert" ON public.empenhos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.empenhos;
CREATE POLICY "rls_update" ON public.empenhos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.empenhos;
CREATE POLICY "rls_delete" ON public.empenhos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- encaminhamentos  [modulo: workflow]
DROP POLICY IF EXISTS "rls_select" ON public.encaminhamentos;
CREATE POLICY "rls_select" ON public.encaminhamentos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_insert" ON public.encaminhamentos;
CREATE POLICY "rls_insert" ON public.encaminhamentos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_update" ON public.encaminhamentos;
CREATE POLICY "rls_update" ON public.encaminhamentos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_delete" ON public.encaminhamentos;
CREATE POLICY "rls_delete" ON public.encaminhamentos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')));

-- envios_log  [preservar: admin]
-- (nenhuma policy gerada)

-- escolas_jer  [modulo: gestores_escolares]
DROP POLICY IF EXISTS "rls_select" ON public.escolas_jer;
CREATE POLICY "rls_select" ON public.escolas_jer FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gestores_escolares')));
DROP POLICY IF EXISTS "rls_insert" ON public.escolas_jer;
CREATE POLICY "rls_insert" ON public.escolas_jer FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'gestores_escolares')));
DROP POLICY IF EXISTS "rls_update" ON public.escolas_jer;
CREATE POLICY "rls_update" ON public.escolas_jer FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gestores_escolares')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'gestores_escolares')));
DROP POLICY IF EXISTS "rls_delete" ON public.escolas_jer;
CREATE POLICY "rls_delete" ON public.escolas_jer FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gestores_escolares')));

-- estoque  [modulo: patrimonio | patrimonio_mobile]
DROP POLICY IF EXISTS "rls_select" ON public.estoque;
CREATE POLICY "rls_select" ON public.estoque FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_insert" ON public.estoque;
CREATE POLICY "rls_insert" ON public.estoque FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_update" ON public.estoque;
CREATE POLICY "rls_update" ON public.estoque FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_delete" ON public.estoque;
CREATE POLICY "rls_delete" ON public.estoque FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));

-- estrutura_organizacional  [catalogo: organizacoes]
DROP POLICY IF EXISTS "rls_select" ON public.estrutura_organizacional;
CREATE POLICY "rls_select" ON public.estrutura_organizacional FOR SELECT TO authenticated
  USING (public.is_active_user());
DROP POLICY IF EXISTS "rls_insert" ON public.estrutura_organizacional;
CREATE POLICY "rls_insert" ON public.estrutura_organizacional FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'organizacoes')));
DROP POLICY IF EXISTS "rls_update" ON public.estrutura_organizacional;
CREATE POLICY "rls_update" ON public.estrutura_organizacional FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'organizacoes')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'organizacoes')));
DROP POLICY IF EXISTS "rls_delete" ON public.estrutura_organizacional;
CREATE POLICY "rls_delete" ON public.estrutura_organizacional FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'organizacoes')));

-- eventos_esocial  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.eventos_esocial;
CREATE POLICY "rls_select" ON public.eventos_esocial FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.eventos_esocial;
CREATE POLICY "rls_insert" ON public.eventos_esocial FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.eventos_esocial;
CREATE POLICY "rls_update" ON public.eventos_esocial FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.eventos_esocial;
CREATE POLICY "rls_delete" ON public.eventos_esocial FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- evidencias_controle  [modulo: governanca]
DROP POLICY IF EXISTS "rls_select" ON public.evidencias_controle;
CREATE POLICY "rls_select" ON public.evidencias_controle FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_insert" ON public.evidencias_controle;
CREATE POLICY "rls_insert" ON public.evidencias_controle FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_update" ON public.evidencias_controle;
CREATE POLICY "rls_update" ON public.evidencias_controle FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_delete" ON public.evidencias_controle;
CREATE POLICY "rls_delete" ON public.evidencias_controle FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')));

-- exportacoes_folha  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.exportacoes_folha;
CREATE POLICY "rls_select" ON public.exportacoes_folha FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.exportacoes_folha;
CREATE POLICY "rls_insert" ON public.exportacoes_folha FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.exportacoes_folha;
CREATE POLICY "rls_update" ON public.exportacoes_folha FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.exportacoes_folha;
CREATE POLICY "rls_delete" ON public.exportacoes_folha FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- federacao_arbitros  [modulo: federacoes]
DROP POLICY IF EXISTS "rls_select" ON public.federacao_arbitros;
CREATE POLICY "rls_select" ON public.federacao_arbitros FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'federacoes')));
DROP POLICY IF EXISTS "rls_insert" ON public.federacao_arbitros;
CREATE POLICY "rls_insert" ON public.federacao_arbitros FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'federacoes')));
DROP POLICY IF EXISTS "rls_update" ON public.federacao_arbitros;
CREATE POLICY "rls_update" ON public.federacao_arbitros FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'federacoes')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'federacoes')));
DROP POLICY IF EXISTS "rls_delete" ON public.federacao_arbitros;
CREATE POLICY "rls_delete" ON public.federacao_arbitros FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'federacoes')));

-- federacao_espacos_cedidos  [modulo: federacoes]
DROP POLICY IF EXISTS "rls_select" ON public.federacao_espacos_cedidos;
CREATE POLICY "rls_select" ON public.federacao_espacos_cedidos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'federacoes')));
DROP POLICY IF EXISTS "rls_insert" ON public.federacao_espacos_cedidos;
CREATE POLICY "rls_insert" ON public.federacao_espacos_cedidos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'federacoes')));
DROP POLICY IF EXISTS "rls_update" ON public.federacao_espacos_cedidos;
CREATE POLICY "rls_update" ON public.federacao_espacos_cedidos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'federacoes')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'federacoes')));
DROP POLICY IF EXISTS "rls_delete" ON public.federacao_espacos_cedidos;
CREATE POLICY "rls_delete" ON public.federacao_espacos_cedidos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'federacoes')));

-- federacao_parcerias  [modulo: federacoes]
DROP POLICY IF EXISTS "rls_select" ON public.federacao_parcerias;
CREATE POLICY "rls_select" ON public.federacao_parcerias FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'federacoes')));
DROP POLICY IF EXISTS "rls_insert" ON public.federacao_parcerias;
CREATE POLICY "rls_insert" ON public.federacao_parcerias FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'federacoes')));
DROP POLICY IF EXISTS "rls_update" ON public.federacao_parcerias;
CREATE POLICY "rls_update" ON public.federacao_parcerias FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'federacoes')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'federacoes')));
DROP POLICY IF EXISTS "rls_delete" ON public.federacao_parcerias;
CREATE POLICY "rls_delete" ON public.federacao_parcerias FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'federacoes')));

-- federacoes_esportivas  [modulo: federacoes]
DROP POLICY IF EXISTS "rls_select" ON public.federacoes_esportivas;
CREATE POLICY "rls_select" ON public.federacoes_esportivas FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'federacoes')));
DROP POLICY IF EXISTS "rls_insert" ON public.federacoes_esportivas;
CREATE POLICY "rls_insert" ON public.federacoes_esportivas FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'federacoes')));
DROP POLICY IF EXISTS "rls_update" ON public.federacoes_esportivas;
CREATE POLICY "rls_update" ON public.federacoes_esportivas FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'federacoes')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'federacoes')));
DROP POLICY IF EXISTS "rls_delete" ON public.federacoes_esportivas;
CREATE POLICY "rls_delete" ON public.federacoes_esportivas FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'federacoes')));

-- feriados  [catalogo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.feriados;
CREATE POLICY "rls_select" ON public.feriados FOR SELECT TO authenticated
  USING (public.is_active_user());
DROP POLICY IF EXISTS "rls_insert" ON public.feriados;
CREATE POLICY "rls_insert" ON public.feriados FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.feriados;
CREATE POLICY "rls_update" ON public.feriados FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.feriados;
CREATE POLICY "rls_delete" ON public.feriados FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- ferias_servidor  [proprio_leitura: rh]
DROP POLICY IF EXISTS "rls_select" ON public.ferias_servidor;
CREATE POLICY "rls_select" ON public.ferias_servidor FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.ferias_servidor;
CREATE POLICY "rls_insert" ON public.ferias_servidor FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.ferias_servidor;
CREATE POLICY "rls_update" ON public.ferias_servidor FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.ferias_servidor;
CREATE POLICY "rls_delete" ON public.ferias_servidor FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- fichas_financeiras  [proprio_leitura: rh]
DROP POLICY IF EXISTS "rls_select" ON public.fichas_financeiras;
CREATE POLICY "rls_select" ON public.fichas_financeiras FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.fichas_financeiras;
CREATE POLICY "rls_insert" ON public.fichas_financeiras FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.fichas_financeiras;
CREATE POLICY "rls_update" ON public.fichas_financeiras FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.fichas_financeiras;
CREATE POLICY "rls_delete" ON public.fichas_financeiras FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- fin_acoes_orcamentarias  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_acoes_orcamentarias;
CREATE POLICY "rls_select" ON public.fin_acoes_orcamentarias FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_acoes_orcamentarias;
CREATE POLICY "rls_insert" ON public.fin_acoes_orcamentarias FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_acoes_orcamentarias;
CREATE POLICY "rls_update" ON public.fin_acoes_orcamentarias FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_acoes_orcamentarias;
CREATE POLICY "rls_delete" ON public.fin_acoes_orcamentarias FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_adiantamento_itens  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_adiantamento_itens;
CREATE POLICY "rls_select" ON public.fin_adiantamento_itens FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_adiantamento_itens;
CREATE POLICY "rls_insert" ON public.fin_adiantamento_itens FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_adiantamento_itens;
CREATE POLICY "rls_update" ON public.fin_adiantamento_itens FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_adiantamento_itens;
CREATE POLICY "rls_delete" ON public.fin_adiantamento_itens FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_adiantamentos  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_adiantamentos;
CREATE POLICY "rls_select" ON public.fin_adiantamentos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_adiantamentos;
CREATE POLICY "rls_insert" ON public.fin_adiantamentos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_adiantamentos;
CREATE POLICY "rls_update" ON public.fin_adiantamentos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_adiantamentos;
CREATE POLICY "rls_delete" ON public.fin_adiantamentos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_alteracoes_orcamentarias  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_alteracoes_orcamentarias;
CREATE POLICY "rls_select" ON public.fin_alteracoes_orcamentarias FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_alteracoes_orcamentarias;
CREATE POLICY "rls_insert" ON public.fin_alteracoes_orcamentarias FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_alteracoes_orcamentarias;
CREATE POLICY "rls_update" ON public.fin_alteracoes_orcamentarias FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_alteracoes_orcamentarias;
CREATE POLICY "rls_delete" ON public.fin_alteracoes_orcamentarias FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_audit_log  [trilha: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_audit_log;
CREATE POLICY "rls_select" ON public.fin_audit_log FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_checklist_ci  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_checklist_ci;
CREATE POLICY "rls_select" ON public.fin_checklist_ci FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_checklist_ci;
CREATE POLICY "rls_insert" ON public.fin_checklist_ci FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_checklist_ci;
CREATE POLICY "rls_update" ON public.fin_checklist_ci FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_checklist_ci;
CREATE POLICY "rls_delete" ON public.fin_checklist_ci FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_contas_bancarias  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_contas_bancarias;
CREATE POLICY "rls_select" ON public.fin_contas_bancarias FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_contas_bancarias;
CREATE POLICY "rls_insert" ON public.fin_contas_bancarias FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_contas_bancarias;
CREATE POLICY "rls_update" ON public.fin_contas_bancarias FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_contas_bancarias;
CREATE POLICY "rls_delete" ON public.fin_contas_bancarias FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_documentos  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_documentos;
CREATE POLICY "rls_select" ON public.fin_documentos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_documentos;
CREATE POLICY "rls_insert" ON public.fin_documentos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_documentos;
CREATE POLICY "rls_update" ON public.fin_documentos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_documentos;
CREATE POLICY "rls_delete" ON public.fin_documentos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_dotacoes  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_dotacoes;
CREATE POLICY "rls_select" ON public.fin_dotacoes FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_dotacoes;
CREATE POLICY "rls_insert" ON public.fin_dotacoes FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_dotacoes;
CREATE POLICY "rls_update" ON public.fin_dotacoes FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_dotacoes;
CREATE POLICY "rls_delete" ON public.fin_dotacoes FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_empenho_anulacoes  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_empenho_anulacoes;
CREATE POLICY "rls_select" ON public.fin_empenho_anulacoes FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_empenho_anulacoes;
CREATE POLICY "rls_insert" ON public.fin_empenho_anulacoes FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_empenho_anulacoes;
CREATE POLICY "rls_update" ON public.fin_empenho_anulacoes FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_empenho_anulacoes;
CREATE POLICY "rls_delete" ON public.fin_empenho_anulacoes FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_empenhos  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_empenhos;
CREATE POLICY "rls_select" ON public.fin_empenhos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_empenhos;
CREATE POLICY "rls_insert" ON public.fin_empenhos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_empenhos;
CREATE POLICY "rls_update" ON public.fin_empenhos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_empenhos;
CREATE POLICY "rls_delete" ON public.fin_empenhos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_extrato_transacoes  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_extrato_transacoes;
CREATE POLICY "rls_select" ON public.fin_extrato_transacoes FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_extrato_transacoes;
CREATE POLICY "rls_insert" ON public.fin_extrato_transacoes FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_extrato_transacoes;
CREATE POLICY "rls_update" ON public.fin_extrato_transacoes FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_extrato_transacoes;
CREATE POLICY "rls_delete" ON public.fin_extrato_transacoes FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_extratos_bancarios  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_extratos_bancarios;
CREATE POLICY "rls_select" ON public.fin_extratos_bancarios FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_extratos_bancarios;
CREATE POLICY "rls_insert" ON public.fin_extratos_bancarios FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_extratos_bancarios;
CREATE POLICY "rls_update" ON public.fin_extratos_bancarios FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_extratos_bancarios;
CREATE POLICY "rls_delete" ON public.fin_extratos_bancarios FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_fechamentos  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_fechamentos;
CREATE POLICY "rls_select" ON public.fin_fechamentos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_fechamentos;
CREATE POLICY "rls_insert" ON public.fin_fechamentos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_fechamentos;
CREATE POLICY "rls_update" ON public.fin_fechamentos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_fechamentos;
CREATE POLICY "rls_delete" ON public.fin_fechamentos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_fontes_recurso  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_fontes_recurso;
CREATE POLICY "rls_select" ON public.fin_fontes_recurso FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_fontes_recurso;
CREATE POLICY "rls_insert" ON public.fin_fontes_recurso FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_fontes_recurso;
CREATE POLICY "rls_update" ON public.fin_fontes_recurso FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_fontes_recurso;
CREATE POLICY "rls_delete" ON public.fin_fontes_recurso FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_lancamentos_contabeis  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_lancamentos_contabeis;
CREATE POLICY "rls_select" ON public.fin_lancamentos_contabeis FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_lancamentos_contabeis;
CREATE POLICY "rls_insert" ON public.fin_lancamentos_contabeis FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_lancamentos_contabeis;
CREATE POLICY "rls_update" ON public.fin_lancamentos_contabeis FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_lancamentos_contabeis;
CREATE POLICY "rls_delete" ON public.fin_lancamentos_contabeis FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_liquidacoes  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_liquidacoes;
CREATE POLICY "rls_select" ON public.fin_liquidacoes FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_liquidacoes;
CREATE POLICY "rls_insert" ON public.fin_liquidacoes FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_liquidacoes;
CREATE POLICY "rls_update" ON public.fin_liquidacoes FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_liquidacoes;
CREATE POLICY "rls_delete" ON public.fin_liquidacoes FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_naturezas_despesa  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_naturezas_despesa;
CREATE POLICY "rls_select" ON public.fin_naturezas_despesa FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_naturezas_despesa;
CREATE POLICY "rls_insert" ON public.fin_naturezas_despesa FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_naturezas_despesa;
CREATE POLICY "rls_update" ON public.fin_naturezas_despesa FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_naturezas_despesa;
CREATE POLICY "rls_delete" ON public.fin_naturezas_despesa FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_pagamentos  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_pagamentos;
CREATE POLICY "rls_select" ON public.fin_pagamentos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_pagamentos;
CREATE POLICY "rls_insert" ON public.fin_pagamentos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_pagamentos;
CREATE POLICY "rls_update" ON public.fin_pagamentos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_pagamentos;
CREATE POLICY "rls_delete" ON public.fin_pagamentos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_parametros  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_parametros;
CREATE POLICY "rls_select" ON public.fin_parametros FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_parametros;
CREATE POLICY "rls_insert" ON public.fin_parametros FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_parametros;
CREATE POLICY "rls_update" ON public.fin_parametros FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_parametros;
CREATE POLICY "rls_delete" ON public.fin_parametros FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_plano_contas  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_plano_contas;
CREATE POLICY "rls_select" ON public.fin_plano_contas FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_plano_contas;
CREATE POLICY "rls_insert" ON public.fin_plano_contas FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_plano_contas;
CREATE POLICY "rls_update" ON public.fin_plano_contas FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_plano_contas;
CREATE POLICY "rls_delete" ON public.fin_plano_contas FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_programas_orcamentarios  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_programas_orcamentarios;
CREATE POLICY "rls_select" ON public.fin_programas_orcamentarios FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_programas_orcamentarios;
CREATE POLICY "rls_insert" ON public.fin_programas_orcamentarios FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_programas_orcamentarios;
CREATE POLICY "rls_update" ON public.fin_programas_orcamentarios FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_programas_orcamentarios;
CREATE POLICY "rls_delete" ON public.fin_programas_orcamentarios FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_receitas  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_receitas;
CREATE POLICY "rls_select" ON public.fin_receitas FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_receitas;
CREATE POLICY "rls_insert" ON public.fin_receitas FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_receitas;
CREATE POLICY "rls_update" ON public.fin_receitas FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_receitas;
CREATE POLICY "rls_delete" ON public.fin_receitas FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_restos_pagar  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_restos_pagar;
CREATE POLICY "rls_select" ON public.fin_restos_pagar FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_restos_pagar;
CREATE POLICY "rls_insert" ON public.fin_restos_pagar FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_restos_pagar;
CREATE POLICY "rls_update" ON public.fin_restos_pagar FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_restos_pagar;
CREATE POLICY "rls_delete" ON public.fin_restos_pagar FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_solicitacao_itens  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_solicitacao_itens;
CREATE POLICY "rls_select" ON public.fin_solicitacao_itens FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_solicitacao_itens;
CREATE POLICY "rls_insert" ON public.fin_solicitacao_itens FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_solicitacao_itens;
CREATE POLICY "rls_update" ON public.fin_solicitacao_itens FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_solicitacao_itens;
CREATE POLICY "rls_delete" ON public.fin_solicitacao_itens FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_solicitacoes  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_solicitacoes;
CREATE POLICY "rls_select" ON public.fin_solicitacoes FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_solicitacoes;
CREATE POLICY "rls_insert" ON public.fin_solicitacoes FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_solicitacoes;
CREATE POLICY "rls_update" ON public.fin_solicitacoes FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_solicitacoes;
CREATE POLICY "rls_delete" ON public.fin_solicitacoes FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- fin_sub_empenhos  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_sub_empenhos;
CREATE POLICY "rls_select" ON public.fin_sub_empenhos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_sub_empenhos;
CREATE POLICY "rls_insert" ON public.fin_sub_empenhos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.fin_sub_empenhos;
CREATE POLICY "rls_update" ON public.fin_sub_empenhos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_sub_empenhos;
CREATE POLICY "rls_delete" ON public.fin_sub_empenhos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- folha_historico_status  [trilha: rh]
DROP POLICY IF EXISTS "rls_select" ON public.folha_historico_status;
CREATE POLICY "rls_select" ON public.folha_historico_status FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- folhas_pagamento  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.folhas_pagamento;
CREATE POLICY "rls_select" ON public.folhas_pagamento FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.folhas_pagamento;
CREATE POLICY "rls_insert" ON public.folhas_pagamento FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.folhas_pagamento;
CREATE POLICY "rls_update" ON public.folhas_pagamento FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.folhas_pagamento;
CREATE POLICY "rls_delete" ON public.folhas_pagamento FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- form_field_config  [modulo: admin]
DROP POLICY IF EXISTS "admin_write_form_config" ON public.form_field_config;
DROP POLICY IF EXISTS "rls_select" ON public.form_field_config;
CREATE POLICY "rls_select" ON public.form_field_config FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'admin')));
DROP POLICY IF EXISTS "rls_insert" ON public.form_field_config;
CREATE POLICY "rls_insert" ON public.form_field_config FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'admin')));
DROP POLICY IF EXISTS "rls_update" ON public.form_field_config;
CREATE POLICY "rls_update" ON public.form_field_config FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'admin')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'admin')));
DROP POLICY IF EXISTS "rls_delete" ON public.form_field_config;
CREATE POLICY "rls_delete" ON public.form_field_config FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'admin')));

-- fornecedores  [modulo: compras | contratos]
DROP POLICY IF EXISTS "comp_module_delete" ON public.fornecedores;
DROP POLICY IF EXISTS "comp_module_select" ON public.fornecedores;
DROP POLICY IF EXISTS "comp_module_update" ON public.fornecedores;
DROP POLICY IF EXISTS "comp_module_write" ON public.fornecedores;
DROP POLICY IF EXISTS "rls_select" ON public.fornecedores;
CREATE POLICY "rls_select" ON public.fornecedores FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_insert" ON public.fornecedores;
CREATE POLICY "rls_insert" ON public.fornecedores FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_update" ON public.fornecedores;
CREATE POLICY "rls_update" ON public.fornecedores FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_delete" ON public.fornecedores;
CREATE POLICY "rls_delete" ON public.fornecedores FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));

-- fotos_vistoria_inventario  [preservar: patrimonio | patrimonio_mobile]
-- (nenhuma policy gerada)

-- frequencia_arquivos  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.frequencia_arquivos;
CREATE POLICY "rls_select" ON public.frequencia_arquivos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.frequencia_arquivos;
CREATE POLICY "rls_insert" ON public.frequencia_arquivos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.frequencia_arquivos;
CREATE POLICY "rls_update" ON public.frequencia_arquivos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.frequencia_arquivos;
CREATE POLICY "rls_delete" ON public.frequencia_arquivos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- frequencia_fechamento  [proprio_leitura: rh]
DROP POLICY IF EXISTS "rls_select" ON public.frequencia_fechamento;
CREATE POLICY "rls_select" ON public.frequencia_fechamento FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.frequencia_fechamento;
CREATE POLICY "rls_insert" ON public.frequencia_fechamento FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.frequencia_fechamento;
CREATE POLICY "rls_update" ON public.frequencia_fechamento FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.frequencia_fechamento;
CREATE POLICY "rls_delete" ON public.frequencia_fechamento FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- frequencia_mensal  [proprio_leitura: rh]
DROP POLICY IF EXISTS "rls_select" ON public.frequencia_mensal;
CREATE POLICY "rls_select" ON public.frequencia_mensal FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.frequencia_mensal;
CREATE POLICY "rls_insert" ON public.frequencia_mensal FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.frequencia_mensal;
CREATE POLICY "rls_update" ON public.frequencia_mensal FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.frequencia_mensal;
CREATE POLICY "rls_delete" ON public.frequencia_mensal FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- frequencia_pacotes  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.frequencia_pacotes;
CREATE POLICY "rls_select" ON public.frequencia_pacotes FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.frequencia_pacotes;
CREATE POLICY "rls_insert" ON public.frequencia_pacotes FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.frequencia_pacotes;
CREATE POLICY "rls_update" ON public.frequencia_pacotes FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.frequencia_pacotes;
CREATE POLICY "rls_delete" ON public.frequencia_pacotes FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- galeria_eventos_esportivos  [modulo: comunicacao]
DROP POLICY IF EXISTS "rls_select" ON public.galeria_eventos_esportivos;
CREATE POLICY "rls_select" ON public.galeria_eventos_esportivos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_insert" ON public.galeria_eventos_esportivos;
CREATE POLICY "rls_insert" ON public.galeria_eventos_esportivos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_update" ON public.galeria_eventos_esportivos;
CREATE POLICY "rls_update" ON public.galeria_eventos_esportivos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_delete" ON public.galeria_eventos_esportivos;
CREATE POLICY "rls_delete" ON public.galeria_eventos_esportivos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));

-- gestores_escolares  [modulo: gestores_escolares]
DROP POLICY IF EXISTS "leitura_publica_gestores" ON public.gestores_escolares;
DROP POLICY IF EXISTS "admin_delete_gestores" ON public.gestores_escolares;
DROP POLICY IF EXISTS "admin_update_gestores" ON public.gestores_escolares;
DROP POLICY IF EXISTS "rls_select" ON public.gestores_escolares;
CREATE POLICY "rls_select" ON public.gestores_escolares FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gestores_escolares')));
DROP POLICY IF EXISTS "rls_insert" ON public.gestores_escolares;
CREATE POLICY "rls_insert" ON public.gestores_escolares FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'gestores_escolares')));
DROP POLICY IF EXISTS "rls_update" ON public.gestores_escolares;
CREATE POLICY "rls_update" ON public.gestores_escolares FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gestores_escolares')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'gestores_escolares')));
DROP POLICY IF EXISTS "rls_delete" ON public.gestores_escolares;
CREATE POLICY "rls_delete" ON public.gestores_escolares FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gestores_escolares')));

-- gestores_escolares_historico  [trilha: gestores_escolares]
DROP POLICY IF EXISTS "rls_select" ON public.gestores_escolares_historico;
CREATE POLICY "rls_select" ON public.gestores_escolares_historico FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gestores_escolares')));

-- historico_conteudo_oficial  [trilha: comunicacao]
DROP POLICY IF EXISTS "rls_select" ON public.historico_conteudo_oficial;
CREATE POLICY "rls_select" ON public.historico_conteudo_oficial FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));

-- historico_convites_reuniao  [trilha: gabinete]
DROP POLICY IF EXISTS "rls_select" ON public.historico_convites_reuniao;
CREATE POLICY "rls_select" ON public.historico_convites_reuniao FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gabinete')));

-- historico_funcional  [proprio_leitura: rh]
DROP POLICY IF EXISTS "rls_select" ON public.historico_funcional;
CREATE POLICY "rls_select" ON public.historico_funcional FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.historico_funcional;
CREATE POLICY "rls_insert" ON public.historico_funcional FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.historico_funcional;
CREATE POLICY "rls_update" ON public.historico_funcional FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.historico_funcional;
CREATE POLICY "rls_delete" ON public.historico_funcional FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- historico_lai  [trilha: transparencia]
DROP POLICY IF EXISTS "rls_select" ON public.historico_lai;
CREATE POLICY "rls_select" ON public.historico_lai FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'transparencia')));

-- historico_patrimonio  [trilha: patrimonio | patrimonio_mobile]
DROP POLICY IF EXISTS "rls_select" ON public.historico_patrimonio;
CREATE POLICY "rls_select" ON public.historico_patrimonio FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));

-- horarios_jornada  [catalogo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.horarios_jornada;
CREATE POLICY "rls_select" ON public.horarios_jornada FOR SELECT TO authenticated
  USING (public.is_active_user());
DROP POLICY IF EXISTS "rls_insert" ON public.horarios_jornada;
CREATE POLICY "rls_insert" ON public.horarios_jornada FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.horarios_jornada;
CREATE POLICY "rls_update" ON public.horarios_jornada FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.horarios_jornada;
CREATE POLICY "rls_delete" ON public.horarios_jornada FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- importacoes  [preservar: financeiro]
-- (nenhuma policy gerada)

-- instituicoes  [modulo: organizacoes]
DROP POLICY IF EXISTS "rls_select" ON public.instituicoes;
CREATE POLICY "rls_select" ON public.instituicoes FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'organizacoes')));
DROP POLICY IF EXISTS "rls_insert" ON public.instituicoes;
CREATE POLICY "rls_insert" ON public.instituicoes FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'organizacoes')));
DROP POLICY IF EXISTS "rls_update" ON public.instituicoes;
CREATE POLICY "rls_update" ON public.instituicoes FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'organizacoes')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'organizacoes')));
DROP POLICY IF EXISTS "rls_delete" ON public.instituicoes;
CREATE POLICY "rls_delete" ON public.instituicoes FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'organizacoes')));

-- itens_ata_registro_preco  [modulo: compras | contratos]
DROP POLICY IF EXISTS "rls_select" ON public.itens_ata_registro_preco;
CREATE POLICY "rls_select" ON public.itens_ata_registro_preco FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_insert" ON public.itens_ata_registro_preco;
CREATE POLICY "rls_insert" ON public.itens_ata_registro_preco FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_update" ON public.itens_ata_registro_preco;
CREATE POLICY "rls_update" ON public.itens_ata_registro_preco FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_delete" ON public.itens_ata_registro_preco;
CREATE POLICY "rls_delete" ON public.itens_ata_registro_preco FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));

-- itens_checklist  [modulo: governanca]
DROP POLICY IF EXISTS "rls_select" ON public.itens_checklist;
CREATE POLICY "rls_select" ON public.itens_checklist FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_insert" ON public.itens_checklist;
CREATE POLICY "rls_insert" ON public.itens_checklist FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_update" ON public.itens_checklist;
CREATE POLICY "rls_update" ON public.itens_checklist FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_delete" ON public.itens_checklist;
CREATE POLICY "rls_delete" ON public.itens_checklist FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')));

-- itens_contrato  [modulo: compras | contratos]
DROP POLICY IF EXISTS "rls_select" ON public.itens_contrato;
CREATE POLICY "rls_select" ON public.itens_contrato FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_insert" ON public.itens_contrato;
CREATE POLICY "rls_insert" ON public.itens_contrato FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_update" ON public.itens_contrato;
CREATE POLICY "rls_update" ON public.itens_contrato FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_delete" ON public.itens_contrato;
CREATE POLICY "rls_delete" ON public.itens_contrato FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));

-- itens_ficha_financeira  [proprio_filho: rh]
DROP POLICY IF EXISTS "rls_select" ON public.itens_ficha_financeira;
CREATE POLICY "rls_select" ON public.itens_ficha_financeira FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR EXISTS (SELECT 1 FROM public.fichas_financeiras p WHERE p.id = itens_ficha_financeira.ficha_id AND p.servidor_id = public.meu_servidor_id()));
DROP POLICY IF EXISTS "rls_insert" ON public.itens_ficha_financeira;
CREATE POLICY "rls_insert" ON public.itens_ficha_financeira FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.itens_ficha_financeira;
CREATE POLICY "rls_update" ON public.itens_ficha_financeira FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.itens_ficha_financeira;
CREATE POLICY "rls_delete" ON public.itens_ficha_financeira FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- itens_licitacao  [modulo: compras | contratos]
DROP POLICY IF EXISTS "comp_module_delete" ON public.itens_licitacao;
DROP POLICY IF EXISTS "comp_module_select" ON public.itens_licitacao;
DROP POLICY IF EXISTS "comp_module_update" ON public.itens_licitacao;
DROP POLICY IF EXISTS "comp_module_write" ON public.itens_licitacao;
DROP POLICY IF EXISTS "rls_select" ON public.itens_licitacao;
CREATE POLICY "rls_select" ON public.itens_licitacao FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_insert" ON public.itens_licitacao;
CREATE POLICY "rls_insert" ON public.itens_licitacao FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_update" ON public.itens_licitacao;
CREATE POLICY "rls_update" ON public.itens_licitacao FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_delete" ON public.itens_licitacao;
CREATE POLICY "rls_delete" ON public.itens_licitacao FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));

-- itens_material  [modulo: patrimonio | patrimonio_mobile]
DROP POLICY IF EXISTS "pat_module_delete" ON public.itens_material;
DROP POLICY IF EXISTS "pat_module_select" ON public.itens_material;
DROP POLICY IF EXISTS "pat_module_update" ON public.itens_material;
DROP POLICY IF EXISTS "pat_module_write" ON public.itens_material;
DROP POLICY IF EXISTS "rls_select" ON public.itens_material;
CREATE POLICY "rls_select" ON public.itens_material FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_insert" ON public.itens_material;
CREATE POLICY "rls_insert" ON public.itens_material FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_update" ON public.itens_material;
CREATE POLICY "rls_update" ON public.itens_material FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_delete" ON public.itens_material;
CREATE POLICY "rls_delete" ON public.itens_material FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));

-- itens_processo_licitatorio  [modulo: compras | contratos]
DROP POLICY IF EXISTS "rls_select" ON public.itens_processo_licitatorio;
CREATE POLICY "rls_select" ON public.itens_processo_licitatorio FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_insert" ON public.itens_processo_licitatorio;
CREATE POLICY "rls_insert" ON public.itens_processo_licitatorio FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_update" ON public.itens_processo_licitatorio;
CREATE POLICY "rls_update" ON public.itens_processo_licitatorio FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_delete" ON public.itens_processo_licitatorio;
CREATE POLICY "rls_delete" ON public.itens_processo_licitatorio FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));

-- itens_retorno_bancario  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.itens_retorno_bancario;
CREATE POLICY "rls_select" ON public.itens_retorno_bancario FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.itens_retorno_bancario;
CREATE POLICY "rls_insert" ON public.itens_retorno_bancario FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.itens_retorno_bancario;
CREATE POLICY "rls_update" ON public.itens_retorno_bancario FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.itens_retorno_bancario;
CREATE POLICY "rls_delete" ON public.itens_retorno_bancario FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- justificativas_ponto  [proprio_filho: rh]
DROP POLICY IF EXISTS "rls_select" ON public.justificativas_ponto;
CREATE POLICY "rls_select" ON public.justificativas_ponto FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR EXISTS (SELECT 1 FROM public.registros_ponto p WHERE p.id = justificativas_ponto.registro_ponto_id AND p.servidor_id = public.meu_servidor_id()));
DROP POLICY IF EXISTS "rls_insert" ON public.justificativas_ponto;
CREATE POLICY "rls_insert" ON public.justificativas_ponto FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) OR EXISTS (SELECT 1 FROM public.registros_ponto p WHERE p.id = justificativas_ponto.registro_ponto_id AND p.servidor_id = public.meu_servidor_id()));
DROP POLICY IF EXISTS "rls_update" ON public.justificativas_ponto;
CREATE POLICY "rls_update" ON public.justificativas_ponto FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.justificativas_ponto;
CREATE POLICY "rls_delete" ON public.justificativas_ponto FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- lancamentos_banco_horas  [proprio_filho: rh]
DROP POLICY IF EXISTS "rls_select" ON public.lancamentos_banco_horas;
CREATE POLICY "rls_select" ON public.lancamentos_banco_horas FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR EXISTS (SELECT 1 FROM public.banco_horas p WHERE p.id = lancamentos_banco_horas.banco_horas_id AND p.servidor_id = public.meu_servidor_id()));
DROP POLICY IF EXISTS "rls_insert" ON public.lancamentos_banco_horas;
CREATE POLICY "rls_insert" ON public.lancamentos_banco_horas FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.lancamentos_banco_horas;
CREATE POLICY "rls_update" ON public.lancamentos_banco_horas FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.lancamentos_banco_horas;
CREATE POLICY "rls_delete" ON public.lancamentos_banco_horas FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- lancamentos_folha  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.lancamentos_folha;
CREATE POLICY "rls_select" ON public.lancamentos_folha FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.lancamentos_folha;
CREATE POLICY "rls_insert" ON public.lancamentos_folha FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.lancamentos_folha;
CREATE POLICY "rls_update" ON public.lancamentos_folha FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.lancamentos_folha;
CREATE POLICY "rls_delete" ON public.lancamentos_folha FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- licencas_afastamentos  [proprio_leitura: rh]
DROP POLICY IF EXISTS "rls_select" ON public.licencas_afastamentos;
CREATE POLICY "rls_select" ON public.licencas_afastamentos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.licencas_afastamentos;
CREATE POLICY "rls_insert" ON public.licencas_afastamentos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.licencas_afastamentos;
CREATE POLICY "rls_update" ON public.licencas_afastamentos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.licencas_afastamentos;
CREATE POLICY "rls_delete" ON public.licencas_afastamentos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- links_uteis  [publico_admin]
DROP POLICY IF EXISTS "Apenas admins podem alterar links uteis" ON public.links_uteis;
DROP POLICY IF EXISTS "Leitura publica dos links uteis" ON public.links_uteis;
DROP POLICY IF EXISTS "rls_select" ON public.links_uteis;
CREATE POLICY "rls_select" ON public.links_uteis FOR SELECT TO anon, authenticated
  USING (true);
DROP POLICY IF EXISTS "rls_insert" ON public.links_uteis;
CREATE POLICY "rls_insert" ON public.links_uteis FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.links_uteis;
CREATE POLICY "rls_update" ON public.links_uteis FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.links_uteis;
CREATE POLICY "rls_delete" ON public.links_uteis FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- liquidacoes  [modulo: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.liquidacoes;
CREATE POLICY "rls_select" ON public.liquidacoes FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.liquidacoes;
CREATE POLICY "rls_insert" ON public.liquidacoes FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.liquidacoes;
CREATE POLICY "rls_update" ON public.liquidacoes FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.liquidacoes;
CREATE POLICY "rls_delete" ON public.liquidacoes FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- lotacoes  [modulo: rh]
DROP POLICY IF EXISTS "rh_module_delete" ON public.lotacoes;
DROP POLICY IF EXISTS "rh_module_select" ON public.lotacoes;
DROP POLICY IF EXISTS "rh_module_update" ON public.lotacoes;
DROP POLICY IF EXISTS "rh_module_write" ON public.lotacoes;
DROP POLICY IF EXISTS "rls_select" ON public.lotacoes;
CREATE POLICY "rls_select" ON public.lotacoes FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.lotacoes;
CREATE POLICY "rls_insert" ON public.lotacoes FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.lotacoes;
CREATE POLICY "rls_update" ON public.lotacoes FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.lotacoes;
CREATE POLICY "rls_delete" ON public.lotacoes FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- manutencoes_patrimonio  [modulo: patrimonio | patrimonio_mobile]
DROP POLICY IF EXISTS "rls_select" ON public.manutencoes_patrimonio;
CREATE POLICY "rls_select" ON public.manutencoes_patrimonio FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_insert" ON public.manutencoes_patrimonio;
CREATE POLICY "rls_insert" ON public.manutencoes_patrimonio FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_update" ON public.manutencoes_patrimonio;
CREATE POLICY "rls_update" ON public.manutencoes_patrimonio FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_delete" ON public.manutencoes_patrimonio;
CREATE POLICY "rls_delete" ON public.manutencoes_patrimonio FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));

-- matriz_raci_atribuicoes  [modulo: governanca]
DROP POLICY IF EXISTS "rls_select" ON public.matriz_raci_atribuicoes;
CREATE POLICY "rls_select" ON public.matriz_raci_atribuicoes FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_insert" ON public.matriz_raci_atribuicoes;
CREATE POLICY "rls_insert" ON public.matriz_raci_atribuicoes FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_update" ON public.matriz_raci_atribuicoes;
CREATE POLICY "rls_update" ON public.matriz_raci_atribuicoes FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_delete" ON public.matriz_raci_atribuicoes;
CREATE POLICY "rls_delete" ON public.matriz_raci_atribuicoes FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')));

-- matriz_raci_papeis  [modulo: governanca]
DROP POLICY IF EXISTS "rls_select" ON public.matriz_raci_papeis;
CREATE POLICY "rls_select" ON public.matriz_raci_papeis FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_insert" ON public.matriz_raci_papeis;
CREATE POLICY "rls_insert" ON public.matriz_raci_papeis FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_update" ON public.matriz_raci_papeis;
CREATE POLICY "rls_update" ON public.matriz_raci_papeis FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_delete" ON public.matriz_raci_papeis;
CREATE POLICY "rls_delete" ON public.matriz_raci_papeis FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')));

-- matriz_raci_processos  [modulo: governanca]
DROP POLICY IF EXISTS "rls_select" ON public.matriz_raci_processos;
CREATE POLICY "rls_select" ON public.matriz_raci_processos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_insert" ON public.matriz_raci_processos;
CREATE POLICY "rls_insert" ON public.matriz_raci_processos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_update" ON public.matriz_raci_processos;
CREATE POLICY "rls_update" ON public.matriz_raci_processos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_delete" ON public.matriz_raci_processos;
CREATE POLICY "rls_delete" ON public.matriz_raci_processos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')));

-- medicoes_contrato  [modulo: compras | contratos]
DROP POLICY IF EXISTS "comp_module_delete" ON public.medicoes_contrato;
DROP POLICY IF EXISTS "comp_module_select" ON public.medicoes_contrato;
DROP POLICY IF EXISTS "comp_module_update" ON public.medicoes_contrato;
DROP POLICY IF EXISTS "comp_module_write" ON public.medicoes_contrato;
DROP POLICY IF EXISTS "rls_select" ON public.medicoes_contrato;
CREATE POLICY "rls_select" ON public.medicoes_contrato FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_insert" ON public.medicoes_contrato;
CREATE POLICY "rls_insert" ON public.medicoes_contrato FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_update" ON public.medicoes_contrato;
CREATE POLICY "rls_update" ON public.medicoes_contrato FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_delete" ON public.medicoes_contrato;
CREATE POLICY "rls_delete" ON public.medicoes_contrato FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));

-- memorandos_lotacao  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.memorandos_lotacao;
CREATE POLICY "rls_select" ON public.memorandos_lotacao FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.memorandos_lotacao;
CREATE POLICY "rls_insert" ON public.memorandos_lotacao FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.memorandos_lotacao;
CREATE POLICY "rls_update" ON public.memorandos_lotacao FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.memorandos_lotacao;
CREATE POLICY "rls_delete" ON public.memorandos_lotacao FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- modelos_mensagem_reuniao  [modulo: gabinete]
DROP POLICY IF EXISTS "rls_select" ON public.modelos_mensagem_reuniao;
CREATE POLICY "rls_select" ON public.modelos_mensagem_reuniao FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gabinete')));
DROP POLICY IF EXISTS "rls_insert" ON public.modelos_mensagem_reuniao;
CREATE POLICY "rls_insert" ON public.modelos_mensagem_reuniao FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'gabinete')));
DROP POLICY IF EXISTS "rls_update" ON public.modelos_mensagem_reuniao;
CREATE POLICY "rls_update" ON public.modelos_mensagem_reuniao FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gabinete')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'gabinete')));
DROP POLICY IF EXISTS "rls_delete" ON public.modelos_mensagem_reuniao;
CREATE POLICY "rls_delete" ON public.modelos_mensagem_reuniao FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gabinete')));

-- module_access_scopes  [admin: admin]
DROP POLICY IF EXISTS "rls_select" ON public.module_access_scopes;
CREATE POLICY "rls_select" ON public.module_access_scopes FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_insert" ON public.module_access_scopes;
CREATE POLICY "rls_insert" ON public.module_access_scopes FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.module_access_scopes;
CREATE POLICY "rls_update" ON public.module_access_scopes FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.module_access_scopes;
CREATE POLICY "rls_delete" ON public.module_access_scopes FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- module_permissions_catalog  [catalogo_admin]
DROP POLICY IF EXISTS "rls_select" ON public.module_permissions_catalog;
CREATE POLICY "rls_select" ON public.module_permissions_catalog FOR SELECT TO authenticated
  USING (public.is_active_user());
DROP POLICY IF EXISTS "rls_insert" ON public.module_permissions_catalog;
CREATE POLICY "rls_insert" ON public.module_permissions_catalog FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.module_permissions_catalog;
CREATE POLICY "rls_update" ON public.module_permissions_catalog FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.module_permissions_catalog;
CREATE POLICY "rls_delete" ON public.module_permissions_catalog FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- module_settings  [catalogo_admin]
DROP POLICY IF EXISTS "rls_select" ON public.module_settings;
CREATE POLICY "rls_select" ON public.module_settings FOR SELECT TO authenticated
  USING (public.is_active_user());
DROP POLICY IF EXISTS "rls_insert" ON public.module_settings;
CREATE POLICY "rls_insert" ON public.module_settings FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.module_settings;
CREATE POLICY "rls_update" ON public.module_settings FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.module_settings;
CREATE POLICY "rls_delete" ON public.module_settings FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- movimentacoes_bem  [modulo: patrimonio | patrimonio_mobile]
DROP POLICY IF EXISTS "rls_select" ON public.movimentacoes_bem;
CREATE POLICY "rls_select" ON public.movimentacoes_bem FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_insert" ON public.movimentacoes_bem;
CREATE POLICY "rls_insert" ON public.movimentacoes_bem FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_update" ON public.movimentacoes_bem;
CREATE POLICY "rls_update" ON public.movimentacoes_bem FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_delete" ON public.movimentacoes_bem;
CREATE POLICY "rls_delete" ON public.movimentacoes_bem FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));

-- movimentacoes_estoque  [modulo: patrimonio | patrimonio_mobile]
DROP POLICY IF EXISTS "rls_select" ON public.movimentacoes_estoque;
CREATE POLICY "rls_select" ON public.movimentacoes_estoque FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_insert" ON public.movimentacoes_estoque;
CREATE POLICY "rls_insert" ON public.movimentacoes_estoque FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_update" ON public.movimentacoes_estoque;
CREATE POLICY "rls_update" ON public.movimentacoes_estoque FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_delete" ON public.movimentacoes_estoque;
CREATE POLICY "rls_delete" ON public.movimentacoes_estoque FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));

-- movimentacoes_patrimonio  [modulo: patrimonio | patrimonio_mobile]
DROP POLICY IF EXISTS "pat_module_delete" ON public.movimentacoes_patrimonio;
DROP POLICY IF EXISTS "pat_module_select" ON public.movimentacoes_patrimonio;
DROP POLICY IF EXISTS "pat_module_update" ON public.movimentacoes_patrimonio;
DROP POLICY IF EXISTS "pat_module_write" ON public.movimentacoes_patrimonio;
DROP POLICY IF EXISTS "rls_select" ON public.movimentacoes_patrimonio;
CREATE POLICY "rls_select" ON public.movimentacoes_patrimonio FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_insert" ON public.movimentacoes_patrimonio;
CREATE POLICY "rls_insert" ON public.movimentacoes_patrimonio FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_update" ON public.movimentacoes_patrimonio;
CREATE POLICY "rls_update" ON public.movimentacoes_patrimonio FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_delete" ON public.movimentacoes_patrimonio;
CREATE POLICY "rls_delete" ON public.movimentacoes_patrimonio FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));

-- movimentacoes_processo  [modulo: workflow]
DROP POLICY IF EXISTS "rls_select" ON public.movimentacoes_processo;
CREATE POLICY "rls_select" ON public.movimentacoes_processo FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_insert" ON public.movimentacoes_processo;
CREATE POLICY "rls_insert" ON public.movimentacoes_processo FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_update" ON public.movimentacoes_processo;
CREATE POLICY "rls_update" ON public.movimentacoes_processo FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_delete" ON public.movimentacoes_processo;
CREATE POLICY "rls_delete" ON public.movimentacoes_processo FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')));

-- nomeacoes_chefe_unidade  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.nomeacoes_chefe_unidade;
CREATE POLICY "rls_select" ON public.nomeacoes_chefe_unidade FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.nomeacoes_chefe_unidade;
CREATE POLICY "rls_insert" ON public.nomeacoes_chefe_unidade FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.nomeacoes_chefe_unidade;
CREATE POLICY "rls_update" ON public.nomeacoes_chefe_unidade FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.nomeacoes_chefe_unidade;
CREATE POLICY "rls_delete" ON public.nomeacoes_chefe_unidade FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- noticias_eventos_esportivos  [modulo: comunicacao]
DROP POLICY IF EXISTS "rls_select" ON public.noticias_eventos_esportivos;
CREATE POLICY "rls_select" ON public.noticias_eventos_esportivos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_insert" ON public.noticias_eventos_esportivos;
CREATE POLICY "rls_insert" ON public.noticias_eventos_esportivos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_update" ON public.noticias_eventos_esportivos;
CREATE POLICY "rls_update" ON public.noticias_eventos_esportivos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_delete" ON public.noticias_eventos_esportivos;
CREATE POLICY "rls_delete" ON public.noticias_eventos_esportivos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));

-- ocorrencias_patrimonio  [modulo: patrimonio | patrimonio_mobile]
DROP POLICY IF EXISTS "rls_select" ON public.ocorrencias_patrimonio;
CREATE POLICY "rls_select" ON public.ocorrencias_patrimonio FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_insert" ON public.ocorrencias_patrimonio;
CREATE POLICY "rls_insert" ON public.ocorrencias_patrimonio FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_update" ON public.ocorrencias_patrimonio;
CREATE POLICY "rls_update" ON public.ocorrencias_patrimonio FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_delete" ON public.ocorrencias_patrimonio;
CREATE POLICY "rls_delete" ON public.ocorrencias_patrimonio FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));

-- ocorrencias_servidor  [proprio_leitura: rh]
DROP POLICY IF EXISTS "rls_select" ON public.ocorrencias_servidor;
CREATE POLICY "rls_select" ON public.ocorrencias_servidor FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.ocorrencias_servidor;
CREATE POLICY "rls_insert" ON public.ocorrencias_servidor FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.ocorrencias_servidor;
CREATE POLICY "rls_update" ON public.ocorrencias_servidor FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.ocorrencias_servidor;
CREATE POLICY "rls_delete" ON public.ocorrencias_servidor FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- pagamentos  [modulo: financeiro]
DROP POLICY IF EXISTS "fin_module_delete" ON public.pagamentos;
DROP POLICY IF EXISTS "fin_module_select" ON public.pagamentos;
DROP POLICY IF EXISTS "fin_module_update" ON public.pagamentos;
DROP POLICY IF EXISTS "fin_module_write" ON public.pagamentos;
DROP POLICY IF EXISTS "rls_select" ON public.pagamentos;
CREATE POLICY "rls_select" ON public.pagamentos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.pagamentos;
CREATE POLICY "rls_insert" ON public.pagamentos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.pagamentos;
CREATE POLICY "rls_update" ON public.pagamentos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.pagamentos;
CREATE POLICY "rls_delete" ON public.pagamentos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));

-- parametros_folha  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.parametros_folha;
CREATE POLICY "rls_select" ON public.parametros_folha FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.parametros_folha;
CREATE POLICY "rls_insert" ON public.parametros_folha FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.parametros_folha;
CREATE POLICY "rls_update" ON public.parametros_folha FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.parametros_folha;
CREATE POLICY "rls_delete" ON public.parametros_folha FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- pareceres_tecnicos  [modulo: compras | contratos]
DROP POLICY IF EXISTS "rls_select" ON public.pareceres_tecnicos;
CREATE POLICY "rls_select" ON public.pareceres_tecnicos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_insert" ON public.pareceres_tecnicos;
CREATE POLICY "rls_insert" ON public.pareceres_tecnicos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_update" ON public.pareceres_tecnicos;
CREATE POLICY "rls_update" ON public.pareceres_tecnicos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_delete" ON public.pareceres_tecnicos;
CREATE POLICY "rls_delete" ON public.pareceres_tecnicos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));

-- participantes_reuniao  [modulo: gabinete]
DROP POLICY IF EXISTS "rls_select" ON public.participantes_reuniao;
CREATE POLICY "rls_select" ON public.participantes_reuniao FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gabinete')));
DROP POLICY IF EXISTS "rls_insert" ON public.participantes_reuniao;
CREATE POLICY "rls_insert" ON public.participantes_reuniao FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'gabinete')));
DROP POLICY IF EXISTS "rls_update" ON public.participantes_reuniao;
CREATE POLICY "rls_update" ON public.participantes_reuniao FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gabinete')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'gabinete')));
DROP POLICY IF EXISTS "rls_delete" ON public.participantes_reuniao;
CREATE POLICY "rls_delete" ON public.participantes_reuniao FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gabinete')));

-- patrimonio_unidade  [modulo: patrimonio | patrimonio_mobile]
DROP POLICY IF EXISTS "rls_select" ON public.patrimonio_unidade;
CREATE POLICY "rls_select" ON public.patrimonio_unidade FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_insert" ON public.patrimonio_unidade;
CREATE POLICY "rls_insert" ON public.patrimonio_unidade FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_update" ON public.patrimonio_unidade;
CREATE POLICY "rls_update" ON public.patrimonio_unidade FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_delete" ON public.patrimonio_unidade;
CREATE POLICY "rls_delete" ON public.patrimonio_unidade FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));

-- pensoes_alimenticias  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.pensoes_alimenticias;
CREATE POLICY "rls_select" ON public.pensoes_alimenticias FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.pensoes_alimenticias;
CREATE POLICY "rls_insert" ON public.pensoes_alimenticias FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.pensoes_alimenticias;
CREATE POLICY "rls_update" ON public.pensoes_alimenticias FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.pensoes_alimenticias;
CREATE POLICY "rls_delete" ON public.pensoes_alimenticias FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- planos_tratamento_risco  [modulo: governanca]
DROP POLICY IF EXISTS "rls_select" ON public.planos_tratamento_risco;
CREATE POLICY "rls_select" ON public.planos_tratamento_risco FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_insert" ON public.planos_tratamento_risco;
CREATE POLICY "rls_insert" ON public.planos_tratamento_risco FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_update" ON public.planos_tratamento_risco;
CREATE POLICY "rls_update" ON public.planos_tratamento_risco FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_delete" ON public.planos_tratamento_risco;
CREATE POLICY "rls_delete" ON public.planos_tratamento_risco FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')));

-- portal_diretoria  [modulo: comunicacao]
DROP POLICY IF EXISTS "rls_select" ON public.portal_diretoria;
CREATE POLICY "rls_select" ON public.portal_diretoria FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_insert" ON public.portal_diretoria;
CREATE POLICY "rls_insert" ON public.portal_diretoria FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_update" ON public.portal_diretoria;
CREATE POLICY "rls_update" ON public.portal_diretoria FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'comunicacao')));
DROP POLICY IF EXISTS "rls_delete" ON public.portal_diretoria;
CREATE POLICY "rls_delete" ON public.portal_diretoria FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'comunicacao')));

-- portarias_servidor  [proprio_leitura: rh]
DROP POLICY IF EXISTS "rls_select" ON public.portarias_servidor;
CREATE POLICY "rls_select" ON public.portarias_servidor FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.portarias_servidor;
CREATE POLICY "rls_insert" ON public.portarias_servidor FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.portarias_servidor;
CREATE POLICY "rls_update" ON public.portarias_servidor FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.portarias_servidor;
CREATE POLICY "rls_delete" ON public.portarias_servidor FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- prazos_lai  [modulo: transparencia]
DROP POLICY IF EXISTS "rls_select" ON public.prazos_lai;
CREATE POLICY "rls_select" ON public.prazos_lai FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'transparencia')));
DROP POLICY IF EXISTS "rls_insert" ON public.prazos_lai;
CREATE POLICY "rls_insert" ON public.prazos_lai FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'transparencia')));
DROP POLICY IF EXISTS "rls_update" ON public.prazos_lai;
CREATE POLICY "rls_update" ON public.prazos_lai FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'transparencia')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'transparencia')));
DROP POLICY IF EXISTS "rls_delete" ON public.prazos_lai;
CREATE POLICY "rls_delete" ON public.prazos_lai FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'transparencia')));

-- prazos_processo  [modulo: workflow]
DROP POLICY IF EXISTS "rls_select" ON public.prazos_processo;
CREATE POLICY "rls_select" ON public.prazos_processo FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_insert" ON public.prazos_processo;
CREATE POLICY "rls_insert" ON public.prazos_processo FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_update" ON public.prazos_processo;
CREATE POLICY "rls_update" ON public.prazos_processo FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_delete" ON public.prazos_processo;
CREATE POLICY "rls_delete" ON public.prazos_processo FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')));

-- pre_cadastros  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.pre_cadastros;
CREATE POLICY "rls_select" ON public.pre_cadastros FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.pre_cadastros;
CREATE POLICY "rls_insert" ON public.pre_cadastros FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.pre_cadastros;
CREATE POLICY "rls_update" ON public.pre_cadastros FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.pre_cadastros;
CREATE POLICY "rls_delete" ON public.pre_cadastros FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- processos_administrativos  [modulo: workflow]
DROP POLICY IF EXISTS "rls_select" ON public.processos_administrativos;
CREATE POLICY "rls_select" ON public.processos_administrativos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_insert" ON public.processos_administrativos;
CREATE POLICY "rls_insert" ON public.processos_administrativos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_update" ON public.processos_administrativos;
CREATE POLICY "rls_update" ON public.processos_administrativos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'workflow')));
DROP POLICY IF EXISTS "rls_delete" ON public.processos_administrativos;
CREATE POLICY "rls_delete" ON public.processos_administrativos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'workflow')));

-- processos_licitatorios  [modulo: compras | contratos]
DROP POLICY IF EXISTS "comp_module_delete" ON public.processos_licitatorios;
DROP POLICY IF EXISTS "comp_module_select" ON public.processos_licitatorios;
DROP POLICY IF EXISTS "comp_module_update" ON public.processos_licitatorios;
DROP POLICY IF EXISTS "comp_module_write" ON public.processos_licitatorios;
DROP POLICY IF EXISTS "rls_select" ON public.processos_licitatorios;
CREATE POLICY "rls_select" ON public.processos_licitatorios FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_insert" ON public.processos_licitatorios;
CREATE POLICY "rls_insert" ON public.processos_licitatorios FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_update" ON public.processos_licitatorios;
CREATE POLICY "rls_update" ON public.processos_licitatorios FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_delete" ON public.processos_licitatorios;
CREATE POLICY "rls_delete" ON public.processos_licitatorios FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));

-- profiles  [preservar]
-- (nenhuma policy gerada)

-- programas  [modulo: programas]
DROP POLICY IF EXISTS "rls_select" ON public.programas;
CREATE POLICY "rls_select" ON public.programas FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'programas')));
DROP POLICY IF EXISTS "rls_insert" ON public.programas;
CREATE POLICY "rls_insert" ON public.programas FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'programas')));
DROP POLICY IF EXISTS "rls_update" ON public.programas;
CREATE POLICY "rls_update" ON public.programas FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'programas')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'programas')));
DROP POLICY IF EXISTS "rls_delete" ON public.programas;
CREATE POLICY "rls_delete" ON public.programas FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'programas')));

-- propostas_licitacao  [modulo: compras | contratos]
DROP POLICY IF EXISTS "rls_select" ON public.propostas_licitacao;
CREATE POLICY "rls_select" ON public.propostas_licitacao FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_insert" ON public.propostas_licitacao;
CREATE POLICY "rls_insert" ON public.propostas_licitacao FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_update" ON public.propostas_licitacao;
CREATE POLICY "rls_update" ON public.propostas_licitacao FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_delete" ON public.propostas_licitacao;
CREATE POLICY "rls_delete" ON public.propostas_licitacao FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));

-- provimentos  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.provimentos;
CREATE POLICY "rls_select" ON public.provimentos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.provimentos;
CREATE POLICY "rls_insert" ON public.provimentos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.provimentos;
CREATE POLICY "rls_update" ON public.provimentos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.provimentos;
CREATE POLICY "rls_delete" ON public.provimentos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- publicacoes_lai  [modulo: transparencia]
DROP POLICY IF EXISTS "rls_select" ON public.publicacoes_lai;
CREATE POLICY "rls_select" ON public.publicacoes_lai FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'transparencia')));
DROP POLICY IF EXISTS "rls_insert" ON public.publicacoes_lai;
CREATE POLICY "rls_insert" ON public.publicacoes_lai FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'transparencia')));
DROP POLICY IF EXISTS "rls_update" ON public.publicacoes_lai;
CREATE POLICY "rls_update" ON public.publicacoes_lai FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'transparencia')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'transparencia')));
DROP POLICY IF EXISTS "rls_delete" ON public.publicacoes_lai;
CREATE POLICY "rls_delete" ON public.publicacoes_lai FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'transparencia')));

-- publicacoes_legais  [modulo: transparencia]
DROP POLICY IF EXISTS "rls_select" ON public.publicacoes_legais;
CREATE POLICY "rls_select" ON public.publicacoes_legais FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'transparencia')));
DROP POLICY IF EXISTS "rls_insert" ON public.publicacoes_legais;
CREATE POLICY "rls_insert" ON public.publicacoes_legais FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'transparencia')));
DROP POLICY IF EXISTS "rls_update" ON public.publicacoes_legais;
CREATE POLICY "rls_update" ON public.publicacoes_legais FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'transparencia')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'transparencia')));
DROP POLICY IF EXISTS "rls_delete" ON public.publicacoes_legais;
CREATE POLICY "rls_delete" ON public.publicacoes_legais FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'transparencia')));

-- recursos_lai  [modulo: transparencia]
DROP POLICY IF EXISTS "rls_select" ON public.recursos_lai;
CREATE POLICY "rls_select" ON public.recursos_lai FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'transparencia')));
DROP POLICY IF EXISTS "rls_insert" ON public.recursos_lai;
CREATE POLICY "rls_insert" ON public.recursos_lai FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'transparencia')));
DROP POLICY IF EXISTS "rls_update" ON public.recursos_lai;
CREATE POLICY "rls_update" ON public.recursos_lai FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'transparencia')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'transparencia')));
DROP POLICY IF EXISTS "rls_delete" ON public.recursos_lai;
CREATE POLICY "rls_delete" ON public.recursos_lai FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'transparencia')));

-- regimes_trabalho  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.regimes_trabalho;
CREATE POLICY "rls_select" ON public.regimes_trabalho FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.regimes_trabalho;
CREATE POLICY "rls_insert" ON public.regimes_trabalho FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.regimes_trabalho;
CREATE POLICY "rls_update" ON public.regimes_trabalho FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.regimes_trabalho;
CREATE POLICY "rls_delete" ON public.regimes_trabalho FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- registros_ponto  [proprio_leitura: rh]
DROP POLICY IF EXISTS "rls_select" ON public.registros_ponto;
CREATE POLICY "rls_select" ON public.registros_ponto FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.registros_ponto;
CREATE POLICY "rls_insert" ON public.registros_ponto FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.registros_ponto;
CREATE POLICY "rls_update" ON public.registros_ponto FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.registros_ponto;
CREATE POLICY "rls_delete" ON public.registros_ponto FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- remessas_bancarias  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.remessas_bancarias;
CREATE POLICY "rls_select" ON public.remessas_bancarias FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.remessas_bancarias;
CREATE POLICY "rls_insert" ON public.remessas_bancarias FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.remessas_bancarias;
CREATE POLICY "rls_update" ON public.remessas_bancarias FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.remessas_bancarias;
CREATE POLICY "rls_delete" ON public.remessas_bancarias FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- requisicao_itens  [modulo: patrimonio | patrimonio_mobile]
DROP POLICY IF EXISTS "rls_select" ON public.requisicao_itens;
CREATE POLICY "rls_select" ON public.requisicao_itens FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_insert" ON public.requisicao_itens;
CREATE POLICY "rls_insert" ON public.requisicao_itens FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_update" ON public.requisicao_itens;
CREATE POLICY "rls_update" ON public.requisicao_itens FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_delete" ON public.requisicao_itens;
CREATE POLICY "rls_delete" ON public.requisicao_itens FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));

-- requisicoes_material  [modulo: patrimonio | patrimonio_mobile]
DROP POLICY IF EXISTS "rls_select" ON public.requisicoes_material;
CREATE POLICY "rls_select" ON public.requisicoes_material FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_insert" ON public.requisicoes_material;
CREATE POLICY "rls_insert" ON public.requisicoes_material FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_update" ON public.requisicoes_material;
CREATE POLICY "rls_update" ON public.requisicoes_material FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_delete" ON public.requisicoes_material;
CREATE POLICY "rls_delete" ON public.requisicoes_material FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));

-- respostas_checklist  [modulo: governanca]
DROP POLICY IF EXISTS "rls_select" ON public.respostas_checklist;
CREATE POLICY "rls_select" ON public.respostas_checklist FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_insert" ON public.respostas_checklist;
CREATE POLICY "rls_insert" ON public.respostas_checklist FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_update" ON public.respostas_checklist;
CREATE POLICY "rls_update" ON public.respostas_checklist FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_delete" ON public.respostas_checklist;
CREATE POLICY "rls_delete" ON public.respostas_checklist FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')));

-- retornos_bancarios  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.retornos_bancarios;
CREATE POLICY "rls_select" ON public.retornos_bancarios FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.retornos_bancarios;
CREATE POLICY "rls_insert" ON public.retornos_bancarios FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.retornos_bancarios;
CREATE POLICY "rls_update" ON public.retornos_bancarios FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.retornos_bancarios;
CREATE POLICY "rls_delete" ON public.retornos_bancarios FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- reunioes  [modulo: gabinete]
DROP POLICY IF EXISTS "rls_select" ON public.reunioes;
CREATE POLICY "rls_select" ON public.reunioes FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gabinete')));
DROP POLICY IF EXISTS "rls_insert" ON public.reunioes;
CREATE POLICY "rls_insert" ON public.reunioes FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'gabinete')));
DROP POLICY IF EXISTS "rls_update" ON public.reunioes;
CREATE POLICY "rls_update" ON public.reunioes FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gabinete')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'gabinete')));
DROP POLICY IF EXISTS "rls_delete" ON public.reunioes;
CREATE POLICY "rls_delete" ON public.reunioes FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gabinete')));

-- riscos_institucionais  [modulo: governanca]
DROP POLICY IF EXISTS "rls_select" ON public.riscos_institucionais;
CREATE POLICY "rls_select" ON public.riscos_institucionais FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_insert" ON public.riscos_institucionais;
CREATE POLICY "rls_insert" ON public.riscos_institucionais FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_update" ON public.riscos_institucionais;
CREATE POLICY "rls_update" ON public.riscos_institucionais FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'governanca')));
DROP POLICY IF EXISTS "rls_delete" ON public.riscos_institucionais;
CREATE POLICY "rls_delete" ON public.riscos_institucionais FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'governanca')));

-- role_permissions  [catalogo_admin]
DROP POLICY IF EXISTS "del_role_permissions_admin" ON public.role_permissions;
DROP POLICY IF EXISTS "ins_role_permissions_admin" ON public.role_permissions;
DROP POLICY IF EXISTS "sel_role_permissions_authenticated" ON public.role_permissions;
DROP POLICY IF EXISTS "upd_role_permissions_admin" ON public.role_permissions;
DROP POLICY IF EXISTS "rls_select" ON public.role_permissions;
CREATE POLICY "rls_select" ON public.role_permissions FOR SELECT TO authenticated
  USING (public.is_active_user());
DROP POLICY IF EXISTS "rls_insert" ON public.role_permissions;
CREATE POLICY "rls_insert" ON public.role_permissions FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.role_permissions;
CREATE POLICY "rls_update" ON public.role_permissions FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.role_permissions;
CREATE POLICY "rls_delete" ON public.role_permissions FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- rubricas  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.rubricas;
CREATE POLICY "rls_select" ON public.rubricas FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.rubricas;
CREATE POLICY "rls_insert" ON public.rubricas FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.rubricas;
CREATE POLICY "rls_update" ON public.rubricas FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.rubricas;
CREATE POLICY "rls_delete" ON public.rubricas FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- rubricas_historico  [trilha: rh]
DROP POLICY IF EXISTS "rls_select" ON public.rubricas_historico;
CREATE POLICY "rls_select" ON public.rubricas_historico FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- servidor_regime  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.servidor_regime;
CREATE POLICY "rls_select" ON public.servidor_regime FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.servidor_regime;
CREATE POLICY "rls_insert" ON public.servidor_regime FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.servidor_regime;
CREATE POLICY "rls_update" ON public.servidor_regime FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.servidor_regime;
CREATE POLICY "rls_delete" ON public.servidor_regime FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- servidor_tag_vinculos  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.servidor_tag_vinculos;
CREATE POLICY "rls_select" ON public.servidor_tag_vinculos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.servidor_tag_vinculos;
CREATE POLICY "rls_insert" ON public.servidor_tag_vinculos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.servidor_tag_vinculos;
CREATE POLICY "rls_update" ON public.servidor_tag_vinculos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.servidor_tag_vinculos;
CREATE POLICY "rls_delete" ON public.servidor_tag_vinculos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- servidor_tags  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.servidor_tags;
CREATE POLICY "rls_select" ON public.servidor_tags FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.servidor_tags;
CREATE POLICY "rls_insert" ON public.servidor_tags FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.servidor_tags;
CREATE POLICY "rls_update" ON public.servidor_tags FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.servidor_tags;
CREATE POLICY "rls_delete" ON public.servidor_tags FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- servidores  [modulo: rh]
DROP POLICY IF EXISTS "rh_module_delete" ON public.servidores;
DROP POLICY IF EXISTS "rh_module_select" ON public.servidores;
DROP POLICY IF EXISTS "rh_module_update" ON public.servidores;
DROP POLICY IF EXISTS "rh_module_write" ON public.servidores;
DROP POLICY IF EXISTS "rls_select" ON public.servidores;
CREATE POLICY "rls_select" ON public.servidores FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.servidores;
CREATE POLICY "rls_insert" ON public.servidores FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.servidores;
CREATE POLICY "rls_update" ON public.servidores FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.servidores;
CREATE POLICY "rls_delete" ON public.servidores FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- solicitacoes_abono  [proprio: rh]
DROP POLICY IF EXISTS "rls_select" ON public.solicitacoes_abono;
CREATE POLICY "rls_select" ON public.solicitacoes_abono FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.solicitacoes_abono;
CREATE POLICY "rls_insert" ON public.solicitacoes_abono FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_update" ON public.solicitacoes_abono;
CREATE POLICY "rls_update" ON public.solicitacoes_abono FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.solicitacoes_abono;
CREATE POLICY "rls_delete" ON public.solicitacoes_abono FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- solicitacoes_ajuste_ponto  [proprio: rh]
DROP POLICY IF EXISTS "rls_select" ON public.solicitacoes_ajuste_ponto;
CREATE POLICY "rls_select" ON public.solicitacoes_ajuste_ponto FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.solicitacoes_ajuste_ponto;
CREATE POLICY "rls_insert" ON public.solicitacoes_ajuste_ponto FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_update" ON public.solicitacoes_ajuste_ponto;
CREATE POLICY "rls_update" ON public.solicitacoes_ajuste_ponto FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.solicitacoes_ajuste_ponto;
CREATE POLICY "rls_delete" ON public.solicitacoes_ajuste_ponto FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- solicitacoes_sic  [modulo: transparencia]
DROP POLICY IF EXISTS "rls_select" ON public.solicitacoes_sic;
CREATE POLICY "rls_select" ON public.solicitacoes_sic FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'transparencia')));
DROP POLICY IF EXISTS "rls_insert" ON public.solicitacoes_sic;
CREATE POLICY "rls_insert" ON public.solicitacoes_sic FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'transparencia')));
DROP POLICY IF EXISTS "rls_update" ON public.solicitacoes_sic;
CREATE POLICY "rls_update" ON public.solicitacoes_sic FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'transparencia')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'transparencia')));
DROP POLICY IF EXISTS "rls_delete" ON public.solicitacoes_sic;
CREATE POLICY "rls_delete" ON public.solicitacoes_sic FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'transparencia')));

-- tabela_inss  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.tabela_inss;
CREATE POLICY "rls_select" ON public.tabela_inss FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.tabela_inss;
CREATE POLICY "rls_insert" ON public.tabela_inss FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.tabela_inss;
CREATE POLICY "rls_update" ON public.tabela_inss FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.tabela_inss;
CREATE POLICY "rls_delete" ON public.tabela_inss FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- tabela_irrf  [modulo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.tabela_irrf;
CREATE POLICY "rls_select" ON public.tabela_irrf FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.tabela_irrf;
CREATE POLICY "rls_insert" ON public.tabela_irrf FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.tabela_irrf;
CREATE POLICY "rls_update" ON public.tabela_irrf FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.tabela_irrf;
CREATE POLICY "rls_delete" ON public.tabela_irrf FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- termos_cessao  [modulo: patrimonio]
DROP POLICY IF EXISTS "rls_select" ON public.termos_cessao;
CREATE POLICY "rls_select" ON public.termos_cessao FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_insert" ON public.termos_cessao;
CREATE POLICY "rls_insert" ON public.termos_cessao FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_update" ON public.termos_cessao;
CREATE POLICY "rls_update" ON public.termos_cessao FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_delete" ON public.termos_cessao;
CREATE POLICY "rls_delete" ON public.termos_cessao FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')));

-- tipos_abono  [catalogo: rh]
DROP POLICY IF EXISTS "rls_select" ON public.tipos_abono;
CREATE POLICY "rls_select" ON public.tipos_abono FOR SELECT TO authenticated
  USING (public.is_active_user());
DROP POLICY IF EXISTS "rls_insert" ON public.tipos_abono;
CREATE POLICY "rls_insert" ON public.tipos_abono FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.tipos_abono;
CREATE POLICY "rls_update" ON public.tipos_abono FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.tipos_abono;
CREATE POLICY "rls_delete" ON public.tipos_abono FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- unidades_locais  [modulo: patrimonio | patrimonio_mobile]
DROP POLICY IF EXISTS "pat_module_delete" ON public.unidades_locais;
DROP POLICY IF EXISTS "pat_module_select" ON public.unidades_locais;
DROP POLICY IF EXISTS "pat_module_update" ON public.unidades_locais;
DROP POLICY IF EXISTS "pat_module_write" ON public.unidades_locais;
DROP POLICY IF EXISTS "rls_select" ON public.unidades_locais;
CREATE POLICY "rls_select" ON public.unidades_locais FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_insert" ON public.unidades_locais;
CREATE POLICY "rls_insert" ON public.unidades_locais FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_update" ON public.unidades_locais;
CREATE POLICY "rls_update" ON public.unidades_locais FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "rls_delete" ON public.unidades_locais;
CREATE POLICY "rls_delete" ON public.unidades_locais FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));

-- user_modules  [proprio_user]
DROP POLICY IF EXISTS "del_user_modules_admin" ON public.user_modules;
DROP POLICY IF EXISTS "ins_user_modules_admin" ON public.user_modules;
DROP POLICY IF EXISTS "sel_user_modules_own_or_admin" ON public.user_modules;
DROP POLICY IF EXISTS "upd_user_modules_admin" ON public.user_modules;
DROP POLICY IF EXISTS "user_modules_delete" ON public.user_modules;
DROP POLICY IF EXISTS "user_modules_insert" ON public.user_modules;
DROP POLICY IF EXISTS "user_modules_select" ON public.user_modules;
DROP POLICY IF EXISTS "user_modules_update" ON public.user_modules;
DROP POLICY IF EXISTS "rls_select" ON public.user_modules;
CREATE POLICY "rls_select" ON public.user_modules FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()) OR (user_id = auth.uid() AND public.is_active_user()));
DROP POLICY IF EXISTS "rls_insert" ON public.user_modules;
CREATE POLICY "rls_insert" ON public.user_modules FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.user_modules;
CREATE POLICY "rls_update" ON public.user_modules FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.user_modules;
CREATE POLICY "rls_delete" ON public.user_modules FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- user_org_units  [proprio_user]
DROP POLICY IF EXISTS "rls_select" ON public.user_org_units;
CREATE POLICY "rls_select" ON public.user_org_units FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()) OR (user_id = auth.uid() AND public.is_active_user()));
DROP POLICY IF EXISTS "rls_insert" ON public.user_org_units;
CREATE POLICY "rls_insert" ON public.user_org_units FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.user_org_units;
CREATE POLICY "rls_update" ON public.user_org_units FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.user_org_units;
CREATE POLICY "rls_delete" ON public.user_org_units FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- user_permissions  [proprio_user]
DROP POLICY IF EXISTS "del_user_permissions_admin" ON public.user_permissions;
DROP POLICY IF EXISTS "ins_user_permissions_admin" ON public.user_permissions;
DROP POLICY IF EXISTS "sel_user_permissions_own_or_admin" ON public.user_permissions;
DROP POLICY IF EXISTS "upd_user_permissions_admin" ON public.user_permissions;
DROP POLICY IF EXISTS "rls_select" ON public.user_permissions;
CREATE POLICY "rls_select" ON public.user_permissions FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()) OR (user_id = auth.uid() AND public.is_active_user()));
DROP POLICY IF EXISTS "rls_insert" ON public.user_permissions;
CREATE POLICY "rls_insert" ON public.user_permissions FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.user_permissions;
CREATE POLICY "rls_update" ON public.user_permissions FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.user_permissions;
CREATE POLICY "rls_delete" ON public.user_permissions FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- user_roles  [proprio_user]
DROP POLICY IF EXISTS "del_user_roles_admin" ON public.user_roles;
DROP POLICY IF EXISTS "ins_user_roles_admin" ON public.user_roles;
DROP POLICY IF EXISTS "sel_user_roles_own_or_admin" ON public.user_roles;
DROP POLICY IF EXISTS "upd_user_roles_admin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update" ON public.user_roles;
DROP POLICY IF EXISTS "rls_select" ON public.user_roles;
CREATE POLICY "rls_select" ON public.user_roles FOR SELECT TO authenticated
  USING (public.is_admin_user(auth.uid()) OR (user_id = auth.uid() AND public.is_active_user()));
DROP POLICY IF EXISTS "rls_insert" ON public.user_roles;
CREATE POLICY "rls_insert" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.user_roles;
CREATE POLICY "rls_update" ON public.user_roles FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.user_roles;
CREATE POLICY "rls_delete" ON public.user_roles FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- viagens_diarias  [modulo: rh | financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.viagens_diarias;
CREATE POLICY "rls_select" ON public.viagens_diarias FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.viagens_diarias;
CREATE POLICY "rls_insert" ON public.viagens_diarias FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_update" ON public.viagens_diarias;
CREATE POLICY "rls_update" ON public.viagens_diarias FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'financeiro')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_delete" ON public.viagens_diarias;
CREATE POLICY "rls_delete" ON public.viagens_diarias FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'financeiro')));

-- vinculos_funcionais  [proprio_leitura: rh]
DROP POLICY IF EXISTS "rls_select" ON public.vinculos_funcionais;
CREATE POLICY "rls_select" ON public.vinculos_funcionais FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.vinculos_funcionais;
CREATE POLICY "rls_insert" ON public.vinculos_funcionais FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.vinculos_funcionais;
CREATE POLICY "rls_update" ON public.vinculos_funcionais FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.vinculos_funcionais;
CREATE POLICY "rls_delete" ON public.vinculos_funcionais FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- vinculos_servidor  [modulo: rh]
DROP POLICY IF EXISTS "vinculos_delete" ON public.vinculos_servidor;
DROP POLICY IF EXISTS "vinculos_insert" ON public.vinculos_servidor;
DROP POLICY IF EXISTS "vinculos_select" ON public.vinculos_servidor;
DROP POLICY IF EXISTS "vinculos_update" ON public.vinculos_servidor;
DROP POLICY IF EXISTS "rls_select" ON public.vinculos_servidor;
CREATE POLICY "rls_select" ON public.vinculos_servidor FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.vinculos_servidor;
CREATE POLICY "rls_insert" ON public.vinculos_servidor FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.vinculos_servidor;
CREATE POLICY "rls_update" ON public.vinculos_servidor FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.vinculos_servidor;
CREATE POLICY "rls_delete" ON public.vinculos_servidor FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
