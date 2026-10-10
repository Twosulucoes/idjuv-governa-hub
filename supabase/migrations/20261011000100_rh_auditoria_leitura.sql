-- ============================================================================
-- Onda E1 do RH — leitura da trilha do RH por permissão
-- ============================================================================
-- Spec: docs/superpowers/specs/2026-10-10-rh-trilha-auditoria-design.md
-- Separada de 20261011000000_rh_autoria_trilha.sql porque acrescenta uma policy a uma tabela que já tem RLS
-- (audit_logs): precisa do "sim" do dono e pode ser segurada sem segurar a autoria e a trilha. Sem esta migração,
-- só o papel admin lê audit_logs (policy admin_only_select), como antes da E1.
--
-- Vale nos dois estados do banco (baseline e só migrações) e é idempotente (ON CONFLICT DO NOTHING, DROP/CREATE POLICY).
--
-- action_type 'auditar' (e não 'visualizar'): a carga de 20260916120000_permissoes_granulares.sql dá ao papel `user`
-- todo código com action_type = 'visualizar'; uma reexecução ou cópia daquela carga não alcança esta permissão.
-- Nenhum papel a recebe aqui: o gestor concede por usuário (user_modules.permissions ou user_permissions). Carga
-- futura por action_type (ex.: "tudo menos excluir" para manager) precisa excluir este código de propósito.
-- ============================================================================

INSERT INTO public.module_permissions_catalog
  (module_code, permission_code, label, description, category, action_type, sort_order)
VALUES
  ('rh', 'rh.auditoria.visualizar', 'Visualizar Trilha de Auditoria do RH',
   'Lê a trilha (audit_logs) do módulo RH: quem lançou, alterou ou excluiu, e o antes/depois mascarado',
   'Auditoria', 'auditar', 510)
ON CONFLICT (permission_code) DO NOTHING;

-- Além do papel admin (policy admin_only_select), quem tem o módulo rh E a permissão lê as linhas do módulo 'rh' (as
-- do módulo 'admin', 'folha' e demais continuam só do admin). Policy fora do gerador (supabase/baseline/rls/mapa.csv,
-- classe admin_leitura de audit_logs), mantida por esta migração.
DROP POLICY IF EXISTS "audit_logs_rh_auditoria_select" ON public.audit_logs;
CREATE POLICY "audit_logs_rh_auditoria_select" ON public.audit_logs FOR SELECT TO authenticated
  USING (module_name = 'rh'
         AND public.can_access_module(auth.uid(), 'rh')
         AND public.has_permission_code(auth.uid(), 'rh.auditoria.visualizar'));
