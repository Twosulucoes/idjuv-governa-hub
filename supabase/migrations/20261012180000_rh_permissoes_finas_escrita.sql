-- ============================================================================
-- Permissões finas de escrita em lotações, provimentos, histórico funcional, designações, cessões e ocorrências
-- ============================================================================
-- Antes: qualquer usuário com o MÓDULO rh (ou gabinete, em provimentos e histórico) lia, gravava e APAGAVA estas
-- seis tabelas, mesmo sem a permissão da tela. Agora a leitura segue igual e a ESCRITA exige o módulo E um código:
--   lotacoes             rh.lotacoes.criar|editar ou rh.servidores.criar|editar (admissão, transferência, desligamento);
--                        apagar: rh.lotacoes.gerenciar
--   provimentos          rh.servidores.criar|editar, rh.lotacoes.criar|editar ou governanca.cargos.gerenciar
--                        (o importador do quadro de vagas grava vaga_id); apagar: rh.servidores.excluir
--   historico_funcional  códigos de servidor, lotação, designação ou portaria (criar/editar); apagar: rh.servidores.excluir
--   designacoes          rh.designacoes.criar|editar; apagar: rh.designacoes.editar
--   cessoes              rh.servidores.criar|editar; apagar: rh.servidores.excluir
--   ocorrencias_servidor rh.servidores.editar; apagar: rh.servidores.excluir (rito disciplinar sem decisão; sem tela)
-- O papel admin passa por todos. As RPCs rh_admitir/desligar/transferir_servidor são SECURITY INVOKER e já checam o
-- código antes; desligar e transferir ainda desfazem tudo se a RLS barrar um UPDATE sem erro.
-- Bloco copiado de supabase/baseline/rls/35_policies_geradas.sql (gerado de rls/mapa.csv). Idempotente; não toca dado.
-- ============================================================================

-- cessoes  [permissao: rh]
DROP POLICY IF EXISTS "rls_select" ON public.cessoes;
CREATE POLICY "rls_select" ON public.cessoes FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.cessoes;
CREATE POLICY "rls_insert" ON public.cessoes FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.servidores.criar') OR public.has_permission_code(auth.uid(), 'rh.servidores.editar')));
DROP POLICY IF EXISTS "rls_update" ON public.cessoes;
CREATE POLICY "rls_update" ON public.cessoes FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.servidores.criar') OR public.has_permission_code(auth.uid(), 'rh.servidores.editar')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.servidores.criar') OR public.has_permission_code(auth.uid(), 'rh.servidores.editar')));
DROP POLICY IF EXISTS "rls_delete" ON public.cessoes;
CREATE POLICY "rls_delete" ON public.cessoes FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.servidores.excluir'));

-- designacoes  [permissao: rh]
DROP POLICY IF EXISTS "rls_select" ON public.designacoes;
CREATE POLICY "rls_select" ON public.designacoes FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.designacoes;
CREATE POLICY "rls_insert" ON public.designacoes FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.designacoes.criar') OR public.has_permission_code(auth.uid(), 'rh.designacoes.editar')));
DROP POLICY IF EXISTS "rls_update" ON public.designacoes;
CREATE POLICY "rls_update" ON public.designacoes FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.designacoes.criar') OR public.has_permission_code(auth.uid(), 'rh.designacoes.editar')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.designacoes.criar') OR public.has_permission_code(auth.uid(), 'rh.designacoes.editar')));
DROP POLICY IF EXISTS "rls_delete" ON public.designacoes;
CREATE POLICY "rls_delete" ON public.designacoes FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.designacoes.editar'));

-- historico_funcional  [permissao: rh | gabinete]
DROP POLICY IF EXISTS "rls_select" ON public.historico_funcional;
CREATE POLICY "rls_select" ON public.historico_funcional FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'gabinete')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.historico_funcional;
CREATE POLICY "rls_insert" ON public.historico_funcional FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'gabinete')) AND (public.has_permission_code(auth.uid(), 'rh.servidores.criar') OR public.has_permission_code(auth.uid(), 'rh.servidores.editar') OR public.has_permission_code(auth.uid(), 'rh.lotacoes.criar') OR public.has_permission_code(auth.uid(), 'rh.lotacoes.editar') OR public.has_permission_code(auth.uid(), 'rh.designacoes.criar') OR public.has_permission_code(auth.uid(), 'rh.designacoes.editar') OR public.has_permission_code(auth.uid(), 'rh.portarias.criar') OR public.has_permission_code(auth.uid(), 'rh.portarias.editar')));
DROP POLICY IF EXISTS "rls_update" ON public.historico_funcional;
CREATE POLICY "rls_update" ON public.historico_funcional FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'gabinete')) AND (public.has_permission_code(auth.uid(), 'rh.servidores.criar') OR public.has_permission_code(auth.uid(), 'rh.servidores.editar') OR public.has_permission_code(auth.uid(), 'rh.lotacoes.criar') OR public.has_permission_code(auth.uid(), 'rh.lotacoes.editar') OR public.has_permission_code(auth.uid(), 'rh.designacoes.criar') OR public.has_permission_code(auth.uid(), 'rh.designacoes.editar') OR public.has_permission_code(auth.uid(), 'rh.portarias.criar') OR public.has_permission_code(auth.uid(), 'rh.portarias.editar')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'gabinete')) AND (public.has_permission_code(auth.uid(), 'rh.servidores.criar') OR public.has_permission_code(auth.uid(), 'rh.servidores.editar') OR public.has_permission_code(auth.uid(), 'rh.lotacoes.criar') OR public.has_permission_code(auth.uid(), 'rh.lotacoes.editar') OR public.has_permission_code(auth.uid(), 'rh.designacoes.criar') OR public.has_permission_code(auth.uid(), 'rh.designacoes.editar') OR public.has_permission_code(auth.uid(), 'rh.portarias.criar') OR public.has_permission_code(auth.uid(), 'rh.portarias.editar')));
DROP POLICY IF EXISTS "rls_delete" ON public.historico_funcional;
CREATE POLICY "rls_delete" ON public.historico_funcional FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'gabinete')) AND public.has_permission_code(auth.uid(), 'rh.servidores.excluir'));

-- lotacoes  [permissao: rh]
DROP POLICY IF EXISTS "rh_module_delete" ON public.lotacoes;
DROP POLICY IF EXISTS "rh_module_select" ON public.lotacoes;
DROP POLICY IF EXISTS "rh_module_update" ON public.lotacoes;
DROP POLICY IF EXISTS "rh_module_write" ON public.lotacoes;
DROP POLICY IF EXISTS "rls_select" ON public.lotacoes;
CREATE POLICY "rls_select" ON public.lotacoes FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.lotacoes;
CREATE POLICY "rls_insert" ON public.lotacoes FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.lotacoes.criar') OR public.has_permission_code(auth.uid(), 'rh.lotacoes.editar') OR public.has_permission_code(auth.uid(), 'rh.servidores.criar') OR public.has_permission_code(auth.uid(), 'rh.servidores.editar')));
DROP POLICY IF EXISTS "rls_update" ON public.lotacoes;
CREATE POLICY "rls_update" ON public.lotacoes FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.lotacoes.criar') OR public.has_permission_code(auth.uid(), 'rh.lotacoes.editar') OR public.has_permission_code(auth.uid(), 'rh.servidores.criar') OR public.has_permission_code(auth.uid(), 'rh.servidores.editar')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.lotacoes.criar') OR public.has_permission_code(auth.uid(), 'rh.lotacoes.editar') OR public.has_permission_code(auth.uid(), 'rh.servidores.criar') OR public.has_permission_code(auth.uid(), 'rh.servidores.editar')));
DROP POLICY IF EXISTS "rls_delete" ON public.lotacoes;
CREATE POLICY "rls_delete" ON public.lotacoes FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.lotacoes.gerenciar'));

-- ocorrencias_servidor  [permissao: rh]
DROP POLICY IF EXISTS "rls_select" ON public.ocorrencias_servidor;
CREATE POLICY "rls_select" ON public.ocorrencias_servidor FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.ocorrencias_servidor;
CREATE POLICY "rls_insert" ON public.ocorrencias_servidor FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.servidores.editar'));
DROP POLICY IF EXISTS "rls_update" ON public.ocorrencias_servidor;
CREATE POLICY "rls_update" ON public.ocorrencias_servidor FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.servidores.editar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.servidores.editar'));
DROP POLICY IF EXISTS "rls_delete" ON public.ocorrencias_servidor;
CREATE POLICY "rls_delete" ON public.ocorrencias_servidor FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.servidores.excluir'));

-- provimentos  [permissao: rh | gabinete]
DROP POLICY IF EXISTS "rls_select" ON public.provimentos;
CREATE POLICY "rls_select" ON public.provimentos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'gabinete')));
DROP POLICY IF EXISTS "rls_insert" ON public.provimentos;
CREATE POLICY "rls_insert" ON public.provimentos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'gabinete')) AND (public.has_permission_code(auth.uid(), 'rh.servidores.criar') OR public.has_permission_code(auth.uid(), 'rh.servidores.editar') OR public.has_permission_code(auth.uid(), 'rh.lotacoes.criar') OR public.has_permission_code(auth.uid(), 'rh.lotacoes.editar') OR public.has_permission_code(auth.uid(), 'governanca.cargos.gerenciar')));
DROP POLICY IF EXISTS "rls_update" ON public.provimentos;
CREATE POLICY "rls_update" ON public.provimentos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'gabinete')) AND (public.has_permission_code(auth.uid(), 'rh.servidores.criar') OR public.has_permission_code(auth.uid(), 'rh.servidores.editar') OR public.has_permission_code(auth.uid(), 'rh.lotacoes.criar') OR public.has_permission_code(auth.uid(), 'rh.lotacoes.editar') OR public.has_permission_code(auth.uid(), 'governanca.cargos.gerenciar')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'gabinete')) AND (public.has_permission_code(auth.uid(), 'rh.servidores.criar') OR public.has_permission_code(auth.uid(), 'rh.servidores.editar') OR public.has_permission_code(auth.uid(), 'rh.lotacoes.criar') OR public.has_permission_code(auth.uid(), 'rh.lotacoes.editar') OR public.has_permission_code(auth.uid(), 'governanca.cargos.gerenciar')));
DROP POLICY IF EXISTS "rls_delete" ON public.provimentos;
CREATE POLICY "rls_delete" ON public.provimentos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'gabinete')) AND public.has_permission_code(auth.uid(), 'rh.servidores.excluir'));
