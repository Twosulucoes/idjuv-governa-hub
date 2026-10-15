-- ============================================================================
-- Trilha de auditoria (audit_log_licitacoes) respeita o sigilo do processo do workflow
-- ============================================================================
-- Falha: fn_audit_log_licitacoes grava em audit_log_licitacoes a linha inteira (dados_anteriores/dados_novos) de
-- processos_administrativos, despachos, documentos_processo, movimentacoes_processo e prazos_processo. A policy
-- de leitura era a da classe "trilha" (módulo compras OU contratos), então quem tinha um desses módulos lia, pela
-- API, o conteúdo de processo restrito/sigiloso que a RLS das tabelas de origem (wf_pode_ver_processo, migração
-- 20261013100100) esconde dele.
--
-- Correção: o mesmo gate de módulo de antes e, para as linhas dessas cinco tabelas, também wf_pode_ver_processo
-- do processo de origem (registro_id em processos_administrativos; processo_id da linha nas demais). O papel
-- admin continua lendo tudo, inclusive a trilha de processo já apagado (perícia). As demais tabelas auditadas não
-- mudam. Confirmação do dono para mudar a RLS existente (invariante 2 do AGENTS.md): Fabiano, 2026-10-15,
-- "pode fechar".
--
-- No baseline: a mesma policy sai de supabase/baseline/rls/mapa.csv (classe trilha com extra=sigilo_workflow,
-- scripts/db/gerar-rls.mjs); o bloco abaixo é cópia do rls/35_policies_geradas.sql regenerado.
-- Idempotente: DROP POLICY IF EXISTS + CREATE POLICY.
-- ============================================================================

DROP POLICY IF EXISTS "rls_select" ON public.audit_log_licitacoes;
CREATE POLICY "rls_select" ON public.audit_log_licitacoes FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')) AND (tabela_origem NOT IN ('processos_administrativos', 'despachos', 'documentos_processo', 'movimentacoes_processo', 'prazos_processo') OR public.is_admin_user(auth.uid()) OR public.wf_pode_ver_processo(CASE WHEN tabela_origem = 'processos_administrativos' THEN registro_id ELSE (coalesce(dados_novos, dados_anteriores) ->> 'processo_id')::uuid END)));
