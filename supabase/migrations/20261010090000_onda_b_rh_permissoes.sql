-- ============================================================================
-- Onda B / B2 — férias, licenças, viagens e frequência por permissão; autoatendimento do servidor
-- ============================================================================
-- Spec: docs/superpowers/specs/2026-10-10-onda-b-rh-permissoes-design.md
-- Plano: docs/superpowers/plans/2026-10-10-onda-b-rh-permissoes.md
--
-- Premissas (sessão autônoma; ver a spec):
--   * Vale nos DOIS estados do banco, como a B1 (20261010070000_onda_b_folha_rls_permissao.sql):
--       (a) baseline (docs/NOVO_BANCO.md): policies `rls_*` por módulo, overlays 10/12/18/20/40, a função
--           forcar_campos_iniciais e os seus triggers já existem;
--       (b) só-migrações (replay): policies `acesso_total_*` (e `rh_module_*`/`vinculos_*` em banco_horas,
--           servidores, lotacoes, cargos e vinculos_servidor), forcar_campos_iniciais NÃO existe.
--     Tudo é idempotente (DROP ... IF EXISTS, CREATE OR REPLACE); no estado (a) a migração só aperta a escrita.
--   * Depende da B1 (funções-base has_permission_code/can_access_module/meu_servidor_id/is_admin_user já
--     revisadas nos dois estados) e da S0 (20261010080000_s0_identidade_policies.sql, outra PR): no estado (b)
--     sem a S0, profiles/user_roles/user_modules têm acesso_total_* e qualquer logado troca o próprio
--     profiles.servidor_id — meu_servidor_id() seria forjável e a leitura da própria linha de `servidores`
--     (CPF, banco) exporia qualquer servidor. A ordem de merge é S0 -> B1 -> B2.
--   * Nenhum código novo de permissão: só os do catálogo (rh.ferias.*, rh.licencas.*, rh.viagens.*,
--     financeiro.diarias.gerenciar, rh.frequencia.*, rh.aprovar, rh.servidores.excluir).
--   * O papel `user` perde a escrita em licenças e no lançamento de frequência; quem tem o módulo sem a
--     permissão perde a escrita em férias, viagens, abono e fechamento. Leitura não muda (e o servidor passa
--     a ler a própria linha em servidores, vinculos_servidor e lotacoes; qualquer usuário ativo lê cargos).
--
-- Blocos:
--   0. eh_meu_servidor(uuid): "este servidor é o do usuário logado?" (vínculo do perfil ou, sem vínculo, o CPF);
--      base de ;sem_autoaprovacao e da isenção de forcar_campos_iniciais (mesmo texto do overlay/10).
--   1. policies das 16 tabelas da spec §2 — cópia literal de supabase/baseline/rls/35_policies_geradas.sql
--      (gerado de rls/mapa.csv; não editar à mão, regenerar). Antes de cada uma: RLS ligado e DROP das
--      `acesso_total_*`. Depois: anon sem privilégio; authenticated sem TRUNCATE/TRIGGER/REFERENCES.
--   2. trigger validar_etapa_frequencia em solicitacoes_abono e frequencia_fechamento: cada etapa exige a sua
--      permissão (chefia rh.aprovar; RH rh.frequencia.lancar), dados do pedido imutáveis fora de pendente, fechamento
--      consolidado intocável sem o RH, assinatura só do dono, autoria (_por/_em) gravada pelo banco; o papel admin
--      passa; 42501 com a etapa na mensagem.
--   3. forcar_campos_iniciais com isenção por permissão (formato perm:, posse por servidor ou por usuário) e os
--      triggers das tabelas do RH (mesmo texto de supabase/baseline/overlay/20_campos_iniciais.sql).
--   4. fn_atualizar_situacao_servidor sem EXECUTE para PUBLIC/anon/authenticated (só os triggers SECURITY DEFINER a
--      chamam; espelha o overlay/40).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Função auxiliar das policies (antes delas: CREATE POLICY confere que a função existe)
-- ----------------------------------------------------------------------------
-- Este servidor é do usuário logado? Base de ";sem_autoaprovacao" (rls/mapa.csv) e da isenção por permissão de
-- forcar_campos_iniciais (overlay 20): ninguém decide sobre o próprio pedido. Verdadeira quando _servidor_id =
-- meu_servidor_id() ou, se o perfil não tem vínculo (meu_servidor_id() nulo), quando o CPF do perfil é o do
-- servidor (só os dígitos; CPF nulo ou vazio nunca casa): o aprovador sem vínculo que é servidor não aprova o
-- próprio pedido. Nunca devolve NULL. Mesmo texto em supabase/baseline/overlay/10_funcoes_acesso.sql.
-- EXECUTE só para authenticated (as policies a chamam como o usuário; a service role não passa por RLS).
CREATE OR REPLACE FUNCTION public.eh_meu_servidor(_servidor_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN _servidor_id IS NULL OR auth.uid() IS NULL THEN false
    WHEN public.meu_servidor_id() IS NOT NULL THEN _servidor_id = public.meu_servidor_id()
    ELSE EXISTS (
      SELECT 1
      FROM public.profiles p
      JOIN public.servidores s ON s.id = _servidor_id
      WHERE p.id = auth.uid()
        AND nullif(regexp_replace(coalesce(p.cpf, ''), '[^0-9]', '', 'g'), '')
            = regexp_replace(coalesce(s.cpf, ''), '[^0-9]', '', 'g')
    )
  END;
$$;
REVOKE EXECUTE ON FUNCTION public.eh_meu_servidor(uuid) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.eh_meu_servidor(uuid) TO authenticated;

-- ----------------------------------------------------------------------------
-- 1. Policies (classe permissao/proprio_leitura/catalogo do gerador)
-- ----------------------------------------------------------------------------
-- Policies permissivas são OR: qualquer `acesso_total_*`/`rh_module_*`/`vinculos_*` que sobrasse anularia a
-- restrição; os nomes do estado (b) são removidos antes de criar as geradas.

-- ferias_servidor
ALTER TABLE public.ferias_servidor ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acesso_total_select ON public.ferias_servidor;
DROP POLICY IF EXISTS acesso_total_insert ON public.ferias_servidor;
DROP POLICY IF EXISTS acesso_total_update ON public.ferias_servidor;
DROP POLICY IF EXISTS acesso_total_delete ON public.ferias_servidor;
-- (gerado por scripts/db/gerar-rls.mjs — classe permissao, módulo rh; os DROP dos nomes rls_* e de remover_policies vêm no próprio SQL gerado)
DROP POLICY IF EXISTS "rls_select" ON public.ferias_servidor;
CREATE POLICY "rls_select" ON public.ferias_servidor FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.ferias_servidor;
CREATE POLICY "rls_insert" ON public.ferias_servidor FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.ferias.criar') OR public.has_permission_code(auth.uid(), 'rh.ferias.editar') OR public.has_permission_code(auth.uid(), 'rh.ferias.gerenciar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)));
DROP POLICY IF EXISTS "rls_update" ON public.ferias_servidor;
CREATE POLICY "rls_update" ON public.ferias_servidor FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.ferias.criar') OR public.has_permission_code(auth.uid(), 'rh.ferias.editar') OR public.has_permission_code(auth.uid(), 'rh.ferias.gerenciar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.ferias.criar') OR public.has_permission_code(auth.uid(), 'rh.ferias.editar') OR public.has_permission_code(auth.uid(), 'rh.ferias.gerenciar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)));
DROP POLICY IF EXISTS "rls_delete" ON public.ferias_servidor;
CREATE POLICY "rls_delete" ON public.ferias_servidor FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- licencas_afastamentos
ALTER TABLE public.licencas_afastamentos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acesso_total_select ON public.licencas_afastamentos;
DROP POLICY IF EXISTS acesso_total_insert ON public.licencas_afastamentos;
DROP POLICY IF EXISTS acesso_total_update ON public.licencas_afastamentos;
DROP POLICY IF EXISTS acesso_total_delete ON public.licencas_afastamentos;
-- (gerado por scripts/db/gerar-rls.mjs — classe permissao, módulo rh; os DROP dos nomes rls_* e de remover_policies vêm no próprio SQL gerado)
DROP POLICY IF EXISTS "rls_select" ON public.licencas_afastamentos;
CREATE POLICY "rls_select" ON public.licencas_afastamentos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.licencas_afastamentos;
CREATE POLICY "rls_insert" ON public.licencas_afastamentos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.licencas.criar') OR public.has_permission_code(auth.uid(), 'rh.licencas.editar') OR public.has_permission_code(auth.uid(), 'rh.licencas.gerenciar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)));
DROP POLICY IF EXISTS "rls_update" ON public.licencas_afastamentos;
CREATE POLICY "rls_update" ON public.licencas_afastamentos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.licencas.criar') OR public.has_permission_code(auth.uid(), 'rh.licencas.editar') OR public.has_permission_code(auth.uid(), 'rh.licencas.gerenciar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.licencas.criar') OR public.has_permission_code(auth.uid(), 'rh.licencas.editar') OR public.has_permission_code(auth.uid(), 'rh.licencas.gerenciar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)));
DROP POLICY IF EXISTS "rls_delete" ON public.licencas_afastamentos;
CREATE POLICY "rls_delete" ON public.licencas_afastamentos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.licencas.gerenciar') AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)));

-- viagens_diarias
ALTER TABLE public.viagens_diarias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acesso_total_select ON public.viagens_diarias;
DROP POLICY IF EXISTS acesso_total_insert ON public.viagens_diarias;
DROP POLICY IF EXISTS acesso_total_update ON public.viagens_diarias;
DROP POLICY IF EXISTS acesso_total_delete ON public.viagens_diarias;
-- (gerado por scripts/db/gerar-rls.mjs — classe permissao, módulo rh | financeiro; os DROP dos nomes rls_* e de remover_policies vêm no próprio SQL gerado)
DROP POLICY IF EXISTS "rls_select" ON public.viagens_diarias;
CREATE POLICY "rls_select" ON public.viagens_diarias FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'financeiro')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.viagens_diarias;
CREATE POLICY "rls_insert" ON public.viagens_diarias FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'financeiro')) AND (public.has_permission_code(auth.uid(), 'rh.viagens.criar') OR public.has_permission_code(auth.uid(), 'rh.viagens.editar') OR public.has_permission_code(auth.uid(), 'rh.viagens.gerenciar') OR public.has_permission_code(auth.uid(), 'financeiro.diarias.gerenciar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)));
DROP POLICY IF EXISTS "rls_update" ON public.viagens_diarias;
CREATE POLICY "rls_update" ON public.viagens_diarias FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'financeiro')) AND (public.has_permission_code(auth.uid(), 'rh.viagens.criar') OR public.has_permission_code(auth.uid(), 'rh.viagens.editar') OR public.has_permission_code(auth.uid(), 'rh.viagens.gerenciar') OR public.has_permission_code(auth.uid(), 'financeiro.diarias.gerenciar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'financeiro')) AND (public.has_permission_code(auth.uid(), 'rh.viagens.criar') OR public.has_permission_code(auth.uid(), 'rh.viagens.editar') OR public.has_permission_code(auth.uid(), 'rh.viagens.gerenciar') OR public.has_permission_code(auth.uid(), 'financeiro.diarias.gerenciar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)));
DROP POLICY IF EXISTS "rls_delete" ON public.viagens_diarias;
CREATE POLICY "rls_delete" ON public.viagens_diarias FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- registros_ponto
ALTER TABLE public.registros_ponto ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acesso_total_select ON public.registros_ponto;
DROP POLICY IF EXISTS acesso_total_insert ON public.registros_ponto;
DROP POLICY IF EXISTS acesso_total_update ON public.registros_ponto;
DROP POLICY IF EXISTS acesso_total_delete ON public.registros_ponto;
-- (gerado por scripts/db/gerar-rls.mjs — classe permissao, módulo rh; os DROP dos nomes rls_* e de remover_policies vêm no próprio SQL gerado)
DROP POLICY IF EXISTS "rls_select" ON public.registros_ponto;
CREATE POLICY "rls_select" ON public.registros_ponto FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.registros_ponto;
CREATE POLICY "rls_insert" ON public.registros_ponto FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)));
DROP POLICY IF EXISTS "rls_update" ON public.registros_ponto;
CREATE POLICY "rls_update" ON public.registros_ponto FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)));
DROP POLICY IF EXISTS "rls_delete" ON public.registros_ponto;
CREATE POLICY "rls_delete" ON public.registros_ponto FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)));

-- frequencia_mensal
ALTER TABLE public.frequencia_mensal ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acesso_total_select ON public.frequencia_mensal;
DROP POLICY IF EXISTS acesso_total_insert ON public.frequencia_mensal;
DROP POLICY IF EXISTS acesso_total_update ON public.frequencia_mensal;
DROP POLICY IF EXISTS acesso_total_delete ON public.frequencia_mensal;
-- (gerado por scripts/db/gerar-rls.mjs — classe permissao, módulo rh; os DROP dos nomes rls_* e de remover_policies vêm no próprio SQL gerado)
DROP POLICY IF EXISTS "rls_select" ON public.frequencia_mensal;
CREATE POLICY "rls_select" ON public.frequencia_mensal FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.frequencia_mensal;
CREATE POLICY "rls_insert" ON public.frequencia_mensal FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)));
DROP POLICY IF EXISTS "rls_update" ON public.frequencia_mensal;
CREATE POLICY "rls_update" ON public.frequencia_mensal FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)));
DROP POLICY IF EXISTS "rls_delete" ON public.frequencia_mensal;
CREATE POLICY "rls_delete" ON public.frequencia_mensal FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)));

-- solicitacoes_abono
ALTER TABLE public.solicitacoes_abono ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acesso_total_select ON public.solicitacoes_abono;
DROP POLICY IF EXISTS acesso_total_insert ON public.solicitacoes_abono;
DROP POLICY IF EXISTS acesso_total_update ON public.solicitacoes_abono;
DROP POLICY IF EXISTS acesso_total_delete ON public.solicitacoes_abono;
-- (gerado por scripts/db/gerar-rls.mjs — classe permissao, módulo rh; os DROP dos nomes rls_* e de remover_policies vêm no próprio SQL gerado)
DROP POLICY IF EXISTS "rls_select" ON public.solicitacoes_abono;
CREATE POLICY "rls_select" ON public.solicitacoes_abono FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.solicitacoes_abono;
CREATE POLICY "rls_insert" ON public.solicitacoes_abono FOR INSERT TO authenticated
  WITH CHECK (((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.aprovar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.lancar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id))) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_update" ON public.solicitacoes_abono;
CREATE POLICY "rls_update" ON public.solicitacoes_abono FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.aprovar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.lancar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.aprovar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.lancar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)));
DROP POLICY IF EXISTS "rls_delete" ON public.solicitacoes_abono;
CREATE POLICY "rls_delete" ON public.solicitacoes_abono FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)));

-- frequencia_fechamento
ALTER TABLE public.frequencia_fechamento ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acesso_total_select ON public.frequencia_fechamento;
DROP POLICY IF EXISTS acesso_total_insert ON public.frequencia_fechamento;
DROP POLICY IF EXISTS acesso_total_update ON public.frequencia_fechamento;
DROP POLICY IF EXISTS acesso_total_delete ON public.frequencia_fechamento;
-- (gerado por scripts/db/gerar-rls.mjs — classe permissao, módulo rh; os DROP dos nomes rls_* e de remover_policies vêm no próprio SQL gerado)
DROP POLICY IF EXISTS "rls_select" ON public.frequencia_fechamento;
CREATE POLICY "rls_select" ON public.frequencia_fechamento FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.frequencia_fechamento;
CREATE POLICY "rls_insert" ON public.frequencia_fechamento FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.aprovar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.lancar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)));
DROP POLICY IF EXISTS "rls_update" ON public.frequencia_fechamento;
CREATE POLICY "rls_update" ON public.frequencia_fechamento FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.aprovar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.lancar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.aprovar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.lancar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)));
DROP POLICY IF EXISTS "rls_delete" ON public.frequencia_fechamento;
CREATE POLICY "rls_delete" ON public.frequencia_fechamento FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor(servidor_id)));

-- config_fechamento_frequencia
ALTER TABLE public.config_fechamento_frequencia ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acesso_total_select ON public.config_fechamento_frequencia;
DROP POLICY IF EXISTS acesso_total_insert ON public.config_fechamento_frequencia;
DROP POLICY IF EXISTS acesso_total_update ON public.config_fechamento_frequencia;
DROP POLICY IF EXISTS acesso_total_delete ON public.config_fechamento_frequencia;
-- (gerado por scripts/db/gerar-rls.mjs — classe permissao, módulo rh; os DROP dos nomes rls_* e de remover_policies vêm no próprio SQL gerado)
DROP POLICY IF EXISTS "rls_select" ON public.config_fechamento_frequencia;
CREATE POLICY "rls_select" ON public.config_fechamento_frequencia FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.config_fechamento_frequencia;
CREATE POLICY "rls_insert" ON public.config_fechamento_frequencia FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.frequencia.configurar'));
DROP POLICY IF EXISTS "rls_update" ON public.config_fechamento_frequencia;
CREATE POLICY "rls_update" ON public.config_fechamento_frequencia FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.frequencia.configurar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.frequencia.configurar'));
DROP POLICY IF EXISTS "rls_delete" ON public.config_fechamento_frequencia;
CREATE POLICY "rls_delete" ON public.config_fechamento_frequencia FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.frequencia.configurar'));

-- solicitacoes_ajuste_ponto
ALTER TABLE public.solicitacoes_ajuste_ponto ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acesso_total_select ON public.solicitacoes_ajuste_ponto;
DROP POLICY IF EXISTS acesso_total_insert ON public.solicitacoes_ajuste_ponto;
DROP POLICY IF EXISTS acesso_total_update ON public.solicitacoes_ajuste_ponto;
DROP POLICY IF EXISTS acesso_total_delete ON public.solicitacoes_ajuste_ponto;
-- (gerado por scripts/db/gerar-rls.mjs — classe permissao, módulo rh; os DROP dos nomes rls_* e de remover_policies vêm no próprio SQL gerado)
DROP POLICY IF EXISTS "rls_select" ON public.solicitacoes_ajuste_ponto;
CREATE POLICY "rls_select" ON public.solicitacoes_ajuste_ponto FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR (servidor_id = auth.uid() AND public.is_active_user()));
DROP POLICY IF EXISTS "rls_insert" ON public.solicitacoes_ajuste_ponto;
CREATE POLICY "rls_insert" ON public.solicitacoes_ajuste_ponto FOR INSERT TO authenticated
  WITH CHECK (((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.aprovar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.lancar')) AND (public.is_admin_user(auth.uid()) OR servidor_id IS DISTINCT FROM auth.uid())) OR (servidor_id = auth.uid() AND public.is_active_user()));
DROP POLICY IF EXISTS "rls_update" ON public.solicitacoes_ajuste_ponto;
CREATE POLICY "rls_update" ON public.solicitacoes_ajuste_ponto FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.aprovar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.lancar')) AND (public.is_admin_user(auth.uid()) OR servidor_id IS DISTINCT FROM auth.uid()))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.aprovar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.lancar')) AND (public.is_admin_user(auth.uid()) OR servidor_id IS DISTINCT FROM auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.solicitacoes_ajuste_ponto;
CREATE POLICY "rls_delete" ON public.solicitacoes_ajuste_ponto FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.aprovar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.lancar')) AND (public.is_admin_user(auth.uid()) OR servidor_id IS DISTINCT FROM auth.uid()));

-- justificativas_ponto
ALTER TABLE public.justificativas_ponto ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acesso_total_select ON public.justificativas_ponto;
DROP POLICY IF EXISTS acesso_total_insert ON public.justificativas_ponto;
DROP POLICY IF EXISTS acesso_total_update ON public.justificativas_ponto;
DROP POLICY IF EXISTS acesso_total_delete ON public.justificativas_ponto;
-- (gerado por scripts/db/gerar-rls.mjs — classe permissao, módulo rh; os DROP dos nomes rls_* e de remover_policies vêm no próprio SQL gerado)
DROP POLICY IF EXISTS "rls_select" ON public.justificativas_ponto;
CREATE POLICY "rls_select" ON public.justificativas_ponto FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR EXISTS (SELECT 1 FROM public.registros_ponto p WHERE p.id = justificativas_ponto.registro_ponto_id AND p.servidor_id = public.meu_servidor_id()));
DROP POLICY IF EXISTS "rls_insert" ON public.justificativas_ponto;
CREATE POLICY "rls_insert" ON public.justificativas_ponto FOR INSERT TO authenticated
  WITH CHECK (((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.aprovar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.lancar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor((SELECT p.servidor_id FROM public.registros_ponto p WHERE p.id = justificativas_ponto.registro_ponto_id)))) OR EXISTS (SELECT 1 FROM public.registros_ponto p WHERE p.id = justificativas_ponto.registro_ponto_id AND p.servidor_id = public.meu_servidor_id()));
DROP POLICY IF EXISTS "rls_update" ON public.justificativas_ponto;
CREATE POLICY "rls_update" ON public.justificativas_ponto FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.aprovar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.lancar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor((SELECT p.servidor_id FROM public.registros_ponto p WHERE p.id = justificativas_ponto.registro_ponto_id))))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.aprovar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.lancar')) AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor((SELECT p.servidor_id FROM public.registros_ponto p WHERE p.id = justificativas_ponto.registro_ponto_id))));
DROP POLICY IF EXISTS "rls_delete" ON public.justificativas_ponto;
CREATE POLICY "rls_delete" ON public.justificativas_ponto FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') AND (public.is_admin_user(auth.uid()) OR NOT public.eh_meu_servidor((SELECT p.servidor_id FROM public.registros_ponto p WHERE p.id = justificativas_ponto.registro_ponto_id))));

-- banco_horas
ALTER TABLE public.banco_horas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acesso_total_select ON public.banco_horas;
DROP POLICY IF EXISTS acesso_total_insert ON public.banco_horas;
DROP POLICY IF EXISTS acesso_total_update ON public.banco_horas;
DROP POLICY IF EXISTS acesso_total_delete ON public.banco_horas;
-- (gerado por scripts/db/gerar-rls.mjs — classe permissao, módulo rh; os DROP dos nomes rls_* e de remover_policies vêm no próprio SQL gerado)
DROP POLICY IF EXISTS "rh_module_delete" ON public.banco_horas;
DROP POLICY IF EXISTS "rh_module_select" ON public.banco_horas;
DROP POLICY IF EXISTS "rh_module_update" ON public.banco_horas;
DROP POLICY IF EXISTS "rh_module_write" ON public.banco_horas;
DROP POLICY IF EXISTS "rls_select" ON public.banco_horas;
CREATE POLICY "rls_select" ON public.banco_horas FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR (servidor_id = auth.uid() AND public.is_active_user()));
DROP POLICY IF EXISTS "rls_insert" ON public.banco_horas;
CREATE POLICY "rls_insert" ON public.banco_horas FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') AND (public.is_admin_user(auth.uid()) OR servidor_id IS DISTINCT FROM auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.banco_horas;
CREATE POLICY "rls_update" ON public.banco_horas FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') AND (public.is_admin_user(auth.uid()) OR servidor_id IS DISTINCT FROM auth.uid()))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') AND (public.is_admin_user(auth.uid()) OR servidor_id IS DISTINCT FROM auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.banco_horas;
CREATE POLICY "rls_delete" ON public.banco_horas FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') AND (public.is_admin_user(auth.uid()) OR servidor_id IS DISTINCT FROM auth.uid()));

-- lancamentos_banco_horas
ALTER TABLE public.lancamentos_banco_horas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acesso_total_select ON public.lancamentos_banco_horas;
DROP POLICY IF EXISTS acesso_total_insert ON public.lancamentos_banco_horas;
DROP POLICY IF EXISTS acesso_total_update ON public.lancamentos_banco_horas;
DROP POLICY IF EXISTS acesso_total_delete ON public.lancamentos_banco_horas;
-- (gerado por scripts/db/gerar-rls.mjs — classe permissao, módulo rh; os DROP dos nomes rls_* e de remover_policies vêm no próprio SQL gerado)
DROP POLICY IF EXISTS "rls_select" ON public.lancamentos_banco_horas;
CREATE POLICY "rls_select" ON public.lancamentos_banco_horas FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR EXISTS (SELECT 1 FROM public.banco_horas p WHERE p.id = lancamentos_banco_horas.banco_horas_id AND (p.servidor_id = auth.uid() AND public.is_active_user())));
DROP POLICY IF EXISTS "rls_insert" ON public.lancamentos_banco_horas;
CREATE POLICY "rls_insert" ON public.lancamentos_banco_horas FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') AND (public.is_admin_user(auth.uid()) OR (SELECT p.servidor_id FROM public.banco_horas p WHERE p.id = lancamentos_banco_horas.banco_horas_id) IS DISTINCT FROM auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.lancamentos_banco_horas;
CREATE POLICY "rls_update" ON public.lancamentos_banco_horas FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') AND (public.is_admin_user(auth.uid()) OR (SELECT p.servidor_id FROM public.banco_horas p WHERE p.id = lancamentos_banco_horas.banco_horas_id) IS DISTINCT FROM auth.uid()))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') AND (public.is_admin_user(auth.uid()) OR (SELECT p.servidor_id FROM public.banco_horas p WHERE p.id = lancamentos_banco_horas.banco_horas_id) IS DISTINCT FROM auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.lancamentos_banco_horas;
CREATE POLICY "rls_delete" ON public.lancamentos_banco_horas FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') AND (public.is_admin_user(auth.uid()) OR (SELECT p.servidor_id FROM public.banco_horas p WHERE p.id = lancamentos_banco_horas.banco_horas_id) IS DISTINCT FROM auth.uid()));

-- servidores
ALTER TABLE public.servidores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acesso_total_select ON public.servidores;
DROP POLICY IF EXISTS acesso_total_insert ON public.servidores;
DROP POLICY IF EXISTS acesso_total_update ON public.servidores;
DROP POLICY IF EXISTS acesso_total_delete ON public.servidores;
-- (gerado por scripts/db/gerar-rls.mjs — classe proprio_leitura, módulo rh; os DROP dos nomes rls_* e de remover_policies vêm no próprio SQL gerado)
DROP POLICY IF EXISTS "rh_module_delete" ON public.servidores;
DROP POLICY IF EXISTS "rh_module_select" ON public.servidores;
DROP POLICY IF EXISTS "rh_module_update" ON public.servidores;
DROP POLICY IF EXISTS "rh_module_write" ON public.servidores;
DROP POLICY IF EXISTS "rls_select" ON public.servidores;
CREATE POLICY "rls_select" ON public.servidores FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.servidores;
CREATE POLICY "rls_insert" ON public.servidores FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_update" ON public.servidores;
CREATE POLICY "rls_update" ON public.servidores FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_delete" ON public.servidores;
CREATE POLICY "rls_delete" ON public.servidores FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.servidores.excluir'));

-- vinculos_servidor
ALTER TABLE public.vinculos_servidor ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acesso_total_select ON public.vinculos_servidor;
DROP POLICY IF EXISTS acesso_total_insert ON public.vinculos_servidor;
DROP POLICY IF EXISTS acesso_total_update ON public.vinculos_servidor;
DROP POLICY IF EXISTS acesso_total_delete ON public.vinculos_servidor;
-- (gerado por scripts/db/gerar-rls.mjs — classe proprio_leitura, módulo rh; os DROP dos nomes rls_* e de remover_policies vêm no próprio SQL gerado)
DROP POLICY IF EXISTS "vinculos_delete" ON public.vinculos_servidor;
DROP POLICY IF EXISTS "vinculos_insert" ON public.vinculos_servidor;
DROP POLICY IF EXISTS "vinculos_select" ON public.vinculos_servidor;
DROP POLICY IF EXISTS "vinculos_update" ON public.vinculos_servidor;
DROP POLICY IF EXISTS "rls_select" ON public.vinculos_servidor;
CREATE POLICY "rls_select" ON public.vinculos_servidor FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
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

-- lotacoes
ALTER TABLE public.lotacoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acesso_total_select ON public.lotacoes;
DROP POLICY IF EXISTS acesso_total_insert ON public.lotacoes;
DROP POLICY IF EXISTS acesso_total_update ON public.lotacoes;
DROP POLICY IF EXISTS acesso_total_delete ON public.lotacoes;
-- (gerado por scripts/db/gerar-rls.mjs — classe proprio_leitura, módulo rh; os DROP dos nomes rls_* e de remover_policies vêm no próprio SQL gerado)
DROP POLICY IF EXISTS "rh_module_delete" ON public.lotacoes;
DROP POLICY IF EXISTS "rh_module_select" ON public.lotacoes;
DROP POLICY IF EXISTS "rh_module_update" ON public.lotacoes;
DROP POLICY IF EXISTS "rh_module_write" ON public.lotacoes;
DROP POLICY IF EXISTS "rls_select" ON public.lotacoes;
CREATE POLICY "rls_select" ON public.lotacoes FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
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

-- cargos
ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acesso_total_select ON public.cargos;
DROP POLICY IF EXISTS acesso_total_insert ON public.cargos;
DROP POLICY IF EXISTS acesso_total_update ON public.cargos;
DROP POLICY IF EXISTS acesso_total_delete ON public.cargos;
-- (gerado por scripts/db/gerar-rls.mjs — classe catalogo, módulo rh; os DROP dos nomes rls_* e de remover_policies vêm no próprio SQL gerado)
DROP POLICY IF EXISTS "rh_module_delete" ON public.cargos;
DROP POLICY IF EXISTS "rh_module_select" ON public.cargos;
DROP POLICY IF EXISTS "rh_module_update" ON public.cargos;
DROP POLICY IF EXISTS "rh_module_write" ON public.cargos;
DROP POLICY IF EXISTS "rls_select" ON public.cargos;
CREATE POLICY "rls_select" ON public.cargos FOR SELECT TO authenticated
  USING (public.is_active_user());
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

-- ---- privilégios de tabela (estado (b): anon/authenticated tinham ALL; o baseline já faz isto no overlay/40) ----
-- anon não lê nem escreve nestas tabelas; TRUNCATE/TRIGGER/REFERENCES não servem à API. Idempotente.
REVOKE ALL ON public.ferias_servidor, public.licencas_afastamentos, public.viagens_diarias, public.registros_ponto, public.frequencia_mensal, public.solicitacoes_abono, public.frequencia_fechamento, public.config_fechamento_frequencia, public.solicitacoes_ajuste_ponto, public.justificativas_ponto, public.banco_horas, public.lancamentos_banco_horas, public.servidores, public.vinculos_servidor, public.lotacoes, public.cargos FROM anon;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.ferias_servidor, public.licencas_afastamentos, public.viagens_diarias, public.registros_ponto, public.frequencia_mensal, public.solicitacoes_abono, public.frequencia_fechamento, public.config_fechamento_frequencia, public.solicitacoes_ajuste_ponto, public.justificativas_ponto, public.banco_horas, public.lancamentos_banco_horas, public.servidores, public.vinculos_servidor, public.lotacoes, public.cargos FROM authenticated;

-- ----------------------------------------------------------------------------
-- 2. Etapas do abono e do fechamento da frequência (spec §3)
-- ----------------------------------------------------------------------------
-- A RLS deixa escrever quem tem o módulo rh E rh.aprovar OU rh.frequencia.lancar (e nunca na própria linha); o
-- DELETE só com rh.frequencia.lancar. Este trigger separa as etapas, espelhando ValidacaoFrequenciaPage
-- (chefia = rh.aprovar; RH = rh.frequencia.lancar). "Sem RH" abaixo = sem rh.frequencia.lancar (a chefia):
--   solicitacoes_abono
--     * servidor_id e tipo_abono_id ............................................. sem RH, nunca mudam (a chefia não
--       troca o tipo para encerrar o fluxo nem muda o dono do pedido)
--     * datas, horas, justificativa, documento_url, motivo_rejeicao, created_by ... sem RH, só enquanto pendente
--     * aprovado_chefia_por/_em mudam ........................................... rh.aprovar; sem RH, só a partir
--       de pendente
--     * aprovado_rh_por/_em mudam ............................................... rh.frequencia.lancar
--     * status, sem RH: só a partir de pendente, para
--         aprovado_chefia ...................................................... rh.aprovar
--         rejeitado ............................................................ rh.aprovar
--         aprovado ............................................................. rh.aprovar, aprovação da chefia no
--           mesmo comando e o tipo de abono ATUAL da linha (o de OLD no UPDATE) com exige_aprovacao_rh = false (o
--           critério de chefiaEncerraFluxo no front)
--       qualquer outra mudança de status (rebaixar o aprovado, ressuscitar o rejeitado, cancelar) .. rh.frequencia.lancar
--     * status -> aprovado_chefia exige rh.aprovar também para o RH
--   frequencia_fechamento
--     * servidor_id, ano e mes .................................................. nunca mudam no UPDATE (só o admin)
--     * assinado_servidor/_em ................................................... só o dono da linha
--       (servidor_id = meu_servidor_id())
--     * linha já consolidada (OLD.consolidado_rh) ............................... nada muda sem rh.frequencia.lancar
--     * validar (validado_chefia = true, validado_chefia_por/_em) ............. rh.aprovar
--     * desfazer a validação (reabertura), consolidado_rh*, reaberto*, justificativa_reabertura
--                                                                                rh.frequencia.lancar
--   autoria (as duas tabelas): quando um par <etapa>_por/_em muda para um valor não nulo, o trigger grava
--     _por = auth.uid() e _em = now() (ninguém registra a etapa em nome de outro; o front já manda user.id e a hora)
--   nas duas tabelas, DELETE ........................................................ rh.frequencia.lancar (a policy
--     de DELETE já exige; aqui é defesa extra)
-- Vale também no INSERT (o front valida/consolida por upsert: a linha nova não pode nascer já consolidada por
-- quem só valida), comparando com a linha vazia (status pendente, flags false). O nome começa com "trg_v" para
-- rodar DEPOIS de trg_forcar_campos_iniciais (os triggers BEFORE rodam em ordem alfabética).
-- Só para quem age como anon/authenticated (GUC role, como o overlay 20): service role e funções internas passam;
-- o papel admin passa (corrige qualquer etapa). Erros de permissão com ERRCODE 42501 e a etapa na mensagem.
CREATE OR REPLACE FUNCTION public.validar_etapa_frequencia()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_chefia boolean;
  v_rh boolean;
  o jsonb;
  n jsonb;
  ov jsonb := '{}'::jsonb;
  st_antes text;
  st_depois text;
  mudou_chefia boolean;
  mudou_rh boolean;
  dispensa_rh boolean;
  pares text[];
  i int;
BEGIN
  IF coalesce(current_setting('role', true), 'none') NOT IN ('anon', 'authenticated')
     OR public.is_admin_user(v_uid) THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;
  v_chefia := public.has_permission_code(v_uid, 'rh.aprovar');
  v_rh := public.has_permission_code(v_uid, 'rh.frequencia.lancar');

  IF TG_OP = 'DELETE' THEN
    IF NOT v_rh THEN
      RAISE EXCEPTION 'Etapa do RH: excluir % exige a permissão rh.frequencia.lancar',
        CASE TG_TABLE_NAME WHEN 'solicitacoes_abono' THEN 'a solicitação de abono' ELSE 'o fechamento da frequência' END
        USING ERRCODE = '42501';
    END IF;
    RETURN OLD;
  END IF;

  -- comparações sempre por ->> (texto): no INSERT `o` é vazio e coluna nula em `n` também vira NULL
  n := to_jsonb(NEW);
  o := CASE WHEN TG_OP = 'INSERT' THEN '{}'::jsonb ELSE to_jsonb(OLD) END;

  IF TG_TABLE_NAME = 'solicitacoes_abono' THEN
    st_antes := coalesce(o ->> 'status', 'pendente');
    st_depois := coalesce(n ->> 'status', 'pendente');
    mudou_chefia := (n ->> 'aprovado_chefia_por') IS DISTINCT FROM (o ->> 'aprovado_chefia_por')
                 OR (n ->> 'aprovado_chefia_em') IS DISTINCT FROM (o ->> 'aprovado_chefia_em');
    mudou_rh := (n ->> 'aprovado_rh_por') IS DISTINCT FROM (o ->> 'aprovado_rh_por')
             OR (n ->> 'aprovado_rh_em') IS DISTINCT FROM (o ->> 'aprovado_rh_em');

    -- dados do pedido: sem RH, dono e tipo nunca mudam; o resto só enquanto pendente
    IF TG_OP = 'UPDATE' AND NOT v_rh THEN
      IF (n ->> 'servidor_id') IS DISTINCT FROM (o ->> 'servidor_id')
         OR (n ->> 'tipo_abono_id') IS DISTINCT FROM (o ->> 'tipo_abono_id') THEN
        RAISE EXCEPTION 'Etapa do RH: trocar o servidor ou o tipo do abono exige a permissão rh.frequencia.lancar'
          USING ERRCODE = '42501';
      END IF;
      IF st_antes <> 'pendente' AND EXISTS (
           SELECT 1 FROM unnest(ARRAY['data_inicio', 'data_fim', 'hora_inicio', 'hora_fim', 'justificativa',
                                      'documento_url', 'motivo_rejeicao', 'created_by']) AS c(col)
           WHERE (n ->> c.col) IS DISTINCT FROM (o ->> c.col)) THEN
        RAISE EXCEPTION 'Etapa do RH: alterar o abono que já saiu de pendente (status %) exige a permissão rh.frequencia.lancar', st_antes
          USING ERRCODE = '42501';
      END IF;
      IF mudou_chefia AND st_antes <> 'pendente' THEN
        RAISE EXCEPTION 'Etapa do RH: alterar a aprovação da chefia de um abono que já saiu de pendente (status %) exige a permissão rh.frequencia.lancar', st_antes
          USING ERRCODE = '42501';
      END IF;
    END IF;

    IF mudou_chefia AND NOT v_chefia THEN
      RAISE EXCEPTION 'Etapa da chefia: registrar a aprovação da chefia exige a permissão rh.aprovar' USING ERRCODE = '42501';
    END IF;
    IF mudou_rh AND NOT v_rh THEN
      RAISE EXCEPTION 'Etapa do RH: registrar a aprovação do RH exige a permissão rh.frequencia.lancar' USING ERRCODE = '42501';
    END IF;

    IF st_depois IS DISTINCT FROM st_antes THEN
      IF st_depois = 'aprovado_chefia' AND NOT v_chefia THEN
        RAISE EXCEPTION 'Etapa da chefia: aprovar o abono pela chefia exige a permissão rh.aprovar' USING ERRCODE = '42501';
      END IF;
      IF NOT v_rh THEN
        -- a chefia só tira o pedido de pendente
        IF st_antes <> 'pendente' THEN
          RAISE EXCEPTION 'Etapa do RH: mudar o status do abono de % para % exige a permissão rh.frequencia.lancar', st_antes, st_depois
            USING ERRCODE = '42501';
        ELSIF st_depois = 'aprovado' THEN
          -- o tipo que vale é o da linha antes do comando (no UPDATE), não o que vem nele
          SELECT ta.exige_aprovacao_rh IS FALSE INTO dispensa_rh
            FROM public.tipos_abono ta
           WHERE ta.id = (CASE WHEN TG_OP = 'UPDATE' THEN o ELSE n END ->> 'tipo_abono_id')::uuid;
          IF NOT (v_chefia AND mudou_chefia AND coalesce(dispensa_rh, false)) THEN
            RAISE EXCEPTION 'Etapa do RH: aprovar o abono exige a permissão rh.frequencia.lancar (a chefia só encerra o fluxo quando o tipo de abono dispensa o RH)'
              USING ERRCODE = '42501';
          END IF;
        ELSIF st_depois = 'rejeitado' THEN
          IF NOT v_chefia THEN
            RAISE EXCEPTION 'Etapa da chefia: rejeitar o abono exige a permissão rh.aprovar ou rh.frequencia.lancar' USING ERRCODE = '42501';
          END IF;
        ELSIF st_depois <> 'aprovado_chefia' THEN
          RAISE EXCEPTION 'Etapa do RH: mudar o status do abono de % para % exige a permissão rh.frequencia.lancar', st_antes, st_depois
            USING ERRCODE = '42501';
        END IF;
      END IF;
    END IF;
    pares := ARRAY['aprovado_chefia_por', 'aprovado_chefia_em', 'aprovado_rh_por', 'aprovado_rh_em'];

  ELSIF TG_TABLE_NAME = 'frequencia_fechamento' THEN
    IF TG_OP = 'UPDATE'
       AND ((n ->> 'servidor_id') IS DISTINCT FROM (o ->> 'servidor_id')
            OR (n ->> 'ano') IS DISTINCT FROM (o ->> 'ano')
            OR (n ->> 'mes') IS DISTINCT FROM (o ->> 'mes')) THEN
      RAISE EXCEPTION 'Fechamento da frequência: servidor, ano e mês não mudam depois de criados (só o papel admin corrige)'
        USING ERRCODE = '42501';
    END IF;
    IF TG_OP = 'UPDATE' AND NOT v_rh AND coalesce((o ->> 'consolidado_rh')::boolean, false)
       AND (n - 'updated_at') IS DISTINCT FROM (o - 'updated_at') THEN
      RAISE EXCEPTION 'Etapa do RH: alterar uma frequência já consolidada exige a permissão rh.frequencia.lancar' USING ERRCODE = '42501';
    END IF;
    IF (coalesce((n ->> 'assinado_servidor')::boolean, false) IS DISTINCT FROM coalesce((o ->> 'assinado_servidor')::boolean, false)
        OR (n ->> 'assinado_servidor_em') IS DISTINCT FROM (o ->> 'assinado_servidor_em'))
       AND (n ->> 'servidor_id')::uuid IS DISTINCT FROM public.meu_servidor_id() THEN
      RAISE EXCEPTION 'Assinatura do servidor: só o próprio servidor assina (ou desfaz a assinatura de) a sua frequência'
        USING ERRCODE = '42501';
    END IF;
    IF coalesce((n ->> 'validado_chefia')::boolean, false) IS DISTINCT FROM coalesce((o ->> 'validado_chefia')::boolean, false)
       OR (n ->> 'validado_chefia_por') IS DISTINCT FROM (o ->> 'validado_chefia_por')
       OR (n ->> 'validado_chefia_em') IS DISTINCT FROM (o ->> 'validado_chefia_em') THEN
      IF coalesce((n ->> 'validado_chefia')::boolean, false) THEN
        IF NOT v_chefia THEN
          RAISE EXCEPTION 'Etapa da chefia: validar a frequência exige a permissão rh.aprovar' USING ERRCODE = '42501';
        END IF;
      ELSIF NOT v_rh THEN
        RAISE EXCEPTION 'Etapa do RH: desfazer a validação da chefia (reabertura) exige a permissão rh.frequencia.lancar' USING ERRCODE = '42501';
      END IF;
    END IF;
    IF (coalesce((n ->> 'consolidado_rh')::boolean, false) IS DISTINCT FROM coalesce((o ->> 'consolidado_rh')::boolean, false)
        OR (n ->> 'consolidado_rh_por') IS DISTINCT FROM (o ->> 'consolidado_rh_por')
        OR (n ->> 'consolidado_rh_em') IS DISTINCT FROM (o ->> 'consolidado_rh_em')
        OR coalesce((n ->> 'reaberto')::boolean, false) IS DISTINCT FROM coalesce((o ->> 'reaberto')::boolean, false)
        OR (n ->> 'reaberto_por') IS DISTINCT FROM (o ->> 'reaberto_por')
        OR (n ->> 'reaberto_em') IS DISTINCT FROM (o ->> 'reaberto_em')
        OR (n ->> 'justificativa_reabertura') IS DISTINCT FROM (o ->> 'justificativa_reabertura'))
       AND NOT v_rh THEN
      RAISE EXCEPTION 'Etapa do RH: consolidar ou reabrir a frequência exige a permissão rh.frequencia.lancar' USING ERRCODE = '42501';
    END IF;
    pares := ARRAY['validado_chefia_por', 'validado_chefia_em', 'consolidado_rh_por', 'consolidado_rh_em',
                   'reaberto_por', 'reaberto_em'];
  END IF;

  -- autoria: o par <etapa>_por/_em que muda para um valor não nulo é de quem age, agora
  FOR i IN 1 .. coalesce(array_length(pares, 1), 0) / 2 LOOP
    IF ((n ->> pares[2 * i - 1]) IS DISTINCT FROM (o ->> pares[2 * i - 1])
        OR (n ->> pares[2 * i]) IS DISTINCT FROM (o ->> pares[2 * i]))
       AND ((n ->> pares[2 * i - 1]) IS NOT NULL OR (n ->> pares[2 * i]) IS NOT NULL) THEN
      ov := ov || jsonb_build_object(pares[2 * i - 1], v_uid, pares[2 * i], now());
    END IF;
  END LOOP;
  IF ov <> '{}'::jsonb THEN
    NEW := jsonb_populate_record(NEW, n || ov);
  END IF;
  RETURN NEW;
END;
$$;
-- função de trigger: ninguém a chama diretamente (padrão do overlay/40)
REVOKE EXECUTE ON FUNCTION public.validar_etapa_frequencia() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_validar_etapa_frequencia ON public.solicitacoes_abono;
CREATE TRIGGER trg_validar_etapa_frequencia
  BEFORE INSERT OR UPDATE OR DELETE ON public.solicitacoes_abono
  FOR EACH ROW EXECUTE FUNCTION public.validar_etapa_frequencia();

DROP TRIGGER IF EXISTS trg_validar_etapa_frequencia ON public.frequencia_fechamento;
CREATE TRIGGER trg_validar_etapa_frequencia
  BEFORE INSERT OR UPDATE OR DELETE ON public.frequencia_fechamento
  FOR EACH ROW EXECUTE FUNCTION public.validar_etapa_frequencia();

-- ----------------------------------------------------------------------------
-- 3. Campos iniciais dos pedidos do RH isentos por PERMISSÃO (spec §4; texto de overlay/20_campos_iniciais.sql)
-- ----------------------------------------------------------------------------
-- Antes a isenção era ter o módulo rh: depois do bloco 1, quem tem o módulo sem a permissão continua inserindo
-- o PRÓPRIO pedido (caminho da posse) e o gravaria já aprovado. Agora, nos pedidos do RH, só fica isento quem
-- tem o módulo E rh.aprovar ou rh.frequencia.lancar, e nunca na própria linha. O formato antigo (só o módulo)
-- continua valendo para os formulários de outros domínios (overlay 20). No estado (a) a função já existe e é
-- substituída; no estado (b) é criada (CREATE OR REPLACE resolve os dois), com os triggers do RH.
-- documentos_requerimento_servidor segue isento por módulo (B3).
-- SECURITY DEFINER porque `anon` não tem EXECUTE em can_access_module (nem deve ter). Dentro de uma
-- função definer current_user vira o dono, então o papel de quem chamou vem do GUC `role` (o PostgREST
-- faz SET LOCAL ROLE anon/authenticated); service role e conexões diretas têm `role` = none/postgres.
--
-- Primeiro argumento (quem fica isento, ou seja, pode gravar status/aprovação já no INSERT):
--   <módulo>                                   quem tem o módulo (formato original; tabelas de outros domínios)
--   perm:<módulo>:<código>[|<código>...][:<tabela_pai>.<coluna_fk> | :usuario]
--                                              quem tem o módulo E qualquer dos códigos (Onda B / B2: no RH,
--                                              ter o módulo sem a permissão não basta), e mesmo assim NÃO na
--                                              linha do próprio servidor (ninguém decide sobre o próprio pedido):
--                                              a posse é NEW.servidor_id ou, com <tabela_pai>.<coluna_fk>, o
--                                              servidor_id da linha pai, conferida por eh_meu_servidor() (vínculo
--                                              do perfil ou, sem vínculo, o CPF). Com `:usuario` a posse é o
--                                              USUÁRIO: NEW.servidor_id guarda o id de profiles (FK para
--                                              profiles(id), ex.: solicitacoes_ajuste_ponto) e é comparado com
--                                              auth.uid(). O papel admin é sempre isento.
CREATE OR REPLACE FUNCTION public.forcar_campos_iniciais()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  ov jsonb := '{}'::jsonb;
  kv text;
  i int;
  isento boolean;
  partes text[];
  ref text[];
  posse uuid;
BEGIN
  IF coalesce(current_setting('role', true), 'none') NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;
  IF TG_ARGV[0] LIKE 'perm:%' THEN
    partes := string_to_array(TG_ARGV[0], ':');
    isento := public.can_access_module(auth.uid(), partes[2])
      AND EXISTS (SELECT 1 FROM unnest(string_to_array(partes[3], '|')) AS c(codigo)
                  WHERE public.has_permission_code(auth.uid(), c.codigo));
    IF isento AND NOT public.is_admin_user(auth.uid()) THEN
      IF partes[4] = 'usuario' THEN
        -- posse por usuário: a coluna servidor_id guarda o id de profiles
        IF (to_jsonb(NEW) ->> 'servidor_id')::uuid = auth.uid() THEN
          isento := false;
        END IF;
      ELSE
        IF partes[4] IS NOT NULL THEN
          ref := string_to_array(partes[4], '.');
          EXECUTE format('SELECT servidor_id FROM public.%I WHERE id = $1', ref[1])
            INTO posse USING (to_jsonb(NEW) ->> ref[2])::uuid;
        ELSE
          posse := (to_jsonb(NEW) ->> 'servidor_id')::uuid;
        END IF;
        IF public.eh_meu_servidor(posse) THEN
          isento := false;
        END IF;
      END IF;
    END IF;
  ELSE
    isento := public.can_access_module(auth.uid(), TG_ARGV[0]);
  END IF;
  IF NOT isento THEN
    FOR i IN 1 .. TG_NARGS - 1 LOOP
      kv := TG_ARGV[i];
      IF to_jsonb(NEW) ? split_part(kv, '=', 1) THEN
        ov := ov || jsonb_build_object(
          split_part(kv, '=', 1),
          CASE split_part(kv, '=', 2) WHEN 'NULL' THEN NULL WHEN '@uid' THEN auth.uid()::text ELSE split_part(kv, '=', 2) END
        );
      END IF;
    END LOOP;
    NEW := jsonb_populate_record(NEW, to_jsonb(NEW) || ov);
  END IF;
  RETURN NEW;
END;
$$;

-- Privilégios como no baseline (overlay/40 revoga de PUBLIC e anon; authenticated e service_role mantêm o
-- padrão). No estado (b) a função nova nasceria executável por anon pelos privilégios padrão da plataforma.
REVOKE EXECUTE ON FUNCTION public.forcar_campos_iniciais() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.forcar_campos_iniciais() TO authenticated, service_role;

DROP TRIGGER IF EXISTS trg_forcar_campos_iniciais ON public.solicitacoes_abono;
CREATE TRIGGER trg_forcar_campos_iniciais BEFORE INSERT ON public.solicitacoes_abono
  FOR EACH ROW EXECUTE FUNCTION public.forcar_campos_iniciais('perm:rh:rh.aprovar|rh.frequencia.lancar', 'status=pendente', 'aprovado_chefia_por=NULL', 'aprovado_chefia_em=NULL', 'aprovado_rh_por=NULL', 'aprovado_rh_em=NULL', 'observacao_aprovador=NULL', 'motivo_rejeicao=NULL', 'created_by=@uid');

DROP TRIGGER IF EXISTS trg_forcar_campos_iniciais ON public.justificativas_ponto;
CREATE TRIGGER trg_forcar_campos_iniciais BEFORE INSERT ON public.justificativas_ponto
  FOR EACH ROW EXECUTE FUNCTION public.forcar_campos_iniciais('perm:rh:rh.aprovar|rh.frequencia.lancar:registros_ponto.registro_ponto_id', 'status=pendente', 'aprovador_id=NULL', 'data_aprovacao=NULL', 'observacao_aprovador=NULL', 'motivo_rejeicao=NULL', 'created_by=@uid');

DROP TRIGGER IF EXISTS trg_forcar_campos_iniciais ON public.solicitacoes_ajuste_ponto;
CREATE TRIGGER trg_forcar_campos_iniciais BEFORE INSERT ON public.solicitacoes_ajuste_ponto
  FOR EACH ROW EXECUTE FUNCTION public.forcar_campos_iniciais('perm:rh:rh.aprovar|rh.frequencia.lancar:usuario', 'status=pendente', 'aprovador_id=NULL', 'data_aprovacao=NULL', 'observacao_aprovador=NULL', 'motivo_rejeicao=NULL', 'created_by=@uid');

DROP TRIGGER IF EXISTS trg_forcar_campos_iniciais ON public.documentos_requerimento_servidor;
CREATE TRIGGER trg_forcar_campos_iniciais BEFORE INSERT ON public.documentos_requerimento_servidor
  FOR EACH ROW EXECUTE FUNCTION public.forcar_campos_iniciais('rh', 'status=pendente', 'created_by=@uid');

-- ----------------------------------------------------------------------------
-- 4. fn_atualizar_situacao_servidor: só os triggers a chamam (espelha supabase/baseline/overlay/40_privilegios.sql)
-- ----------------------------------------------------------------------------
-- Escreve em servidores (situação, cargo, unidade) sem conferir quem chama. O front não a chama por .rpc(); quem a
-- usa são os triggers SECURITY DEFINER de provimentos, cessões, férias e licenças (rodam como o dono). No estado (b)
-- ela era executável por PUBLIC, anon e authenticated. Guardado por existência e por assinatura (idempotente).
DO $$
DECLARE f record;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS assinatura
    FROM pg_proc p
    WHERE p.pronamespace = 'public'::regnamespace
      AND p.proname = 'fn_atualizar_situacao_servidor'
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', f.assinatura);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f.assinatura);
  END LOOP;
END $$;
