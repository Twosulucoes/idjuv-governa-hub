-- P14 Patrimônio, entrega 4: permissões do patrimônio no banco.
--
-- Desenho aprovado: /levantamento/P14-entrega4-desenho.md (2026-10-20). O que muda:
--   1. App de coleta (módulo patrimonio_mobile) só com o que o app usa. Antes, 20 tabelas do patrimônio davam
--      SELECT/INSERT/UPDATE/DELETE a quem tinha só patrimonio_mobile. Agora (sufixo coletor= de rls/mapa.csv):
--        bens_patrimoniais e coletas_inventario: lê e insere; movimentacoes_patrimonio e baixas_patrimonio: só insere
--        (pedido; a decisão é das RPCs); campanhas_inventario_unidades: lê e muda a situação (vistoria);
--        unidades_locais e campanhas_inventario: só lê. As demais (almoxarifado, estoque, materiais, requisições,
--        manutenção, ocorrências, conciliação, histórico, agenda) saem do coletor e ficam só no módulo patrimonio.
--   2. Permissão nova patrimonio.editar: o UPDATE de bens_patrimoniais exige o módulo patrimonio E ela (cadastrar
--      continua pelo módulo); apagar bem fica só para o papel admin (o caminho normal é a baixa). Quem tem
--      patrimonio.criar recebe patrimonio.editar (role_permissions, user_permissions e user_modules.permissions):
--      ninguém perde a edição que já tinha.
--   3. Unidades locais: escrita exige unidades.gerenciar; agenda, termos de cessão e documentos de cedência exigem
--      unidades.cedencias.gerenciar (o módulo continua lendo).
--   4. fn_atualizar_estatisticas_campanha passa a SECURITY DEFINER: o trigger de coletas_inventario atualiza
--      campanhas_inventario, que o coletor não altera mais; sem isso os números da campanha parariam sem erro.
--   5. Trigger fn_bens_proteger_colunas: pela API (authenticated/anon), só o papel admin muda valor, data e forma de
--      aquisição e a situação do bem. As funções SECURITY DEFINER (patrimonio_decidir_baixa e afins) rodam como o
--      dono e passam.
--
-- As policies abaixo são o bloco de supabase/baseline/rls/35_policies_geradas.sql (gerado de rls/mapa.csv) das 23
-- tabelas que mudaram, copiado sem mudança. Idempotente: DROP/CREATE das policies, ON CONFLICT nas concessões,
-- CREATE OR REPLACE na função e DROP/CREATE do trigger. O baseline recebe o mesmo (schema regenerado, catálogo e
-- overlay/40_privilegios.sql).

SET lock_timeout = '10s';

-- ====================================================================================================
-- Permissão patrimonio.editar (catálogo) e concessão a quem já tem patrimonio.criar
-- ====================================================================================================

INSERT INTO public.module_permissions_catalog (module_code, permission_code, label, category, action_type, sort_order)
VALUES ('patrimonio', 'patrimonio.editar', 'Editar Patrimônio', 'Geral', 'editar', 511)
ON CONFLICT (permission_code) DO NOTHING;

-- padrão dos papéis (hoje admin e manager têm patrimonio.criar)
INSERT INTO public.role_permissions (role, permission)
SELECT DISTINCT rp.role, 'patrimonio.editar'
  FROM public.role_permissions rp
 WHERE rp.permission = 'patrimonio.criar'
ON CONFLICT (role, permission) DO NOTHING;

-- concessão avulsa
INSERT INTO public.user_permissions (user_id, permission, created_by)
SELECT up.user_id, 'patrimonio.editar', up.created_by
  FROM public.user_permissions up
 WHERE up.permission = 'patrimonio.criar'
ON CONFLICT (user_id, permission) DO NOTHING;

-- concessão dentro do módulo (array em user_modules.permissions), sem duplicar
UPDATE public.user_modules
   SET permissions = array_append(permissions, 'patrimonio.editar')
 WHERE 'patrimonio.criar' = ANY (permissions)
   AND NOT ('patrimonio.editar' = ANY (permissions));

-- ====================================================================================================
-- Estatísticas da campanha: o trigger de coletas_inventario grava em campanhas_inventario como o dono
-- ====================================================================================================

ALTER FUNCTION public.fn_atualizar_estatisticas_campanha() SECURITY DEFINER;
ALTER FUNCTION public.fn_atualizar_estatisticas_campanha() SET search_path = public;
-- função de trigger: ninguém a chama pela API
REVOKE EXECUTE ON FUNCTION public.fn_atualizar_estatisticas_campanha() FROM PUBLIC, anon, authenticated;

-- ====================================================================================================
-- Valor, data e forma de aquisição e situação do bem: pela API, só o papel admin muda
-- ====================================================================================================

CREATE OR REPLACE FUNCTION public.fn_bens_proteger_colunas()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  -- current_user é o papel da requisição (authenticated/anon) na API; dentro das funções SECURITY DEFINER
  -- (patrimonio_decidir_baixa, registrar_historico_manutencao...) é o dono da função, e a regra não se aplica.
  IF current_user IN ('authenticated', 'anon') AND NOT public.is_admin_user(auth.uid()) THEN
    IF NEW.valor_aquisicao IS DISTINCT FROM OLD.valor_aquisicao
       OR NEW.data_aquisicao IS DISTINCT FROM OLD.data_aquisicao
       OR NEW.forma_aquisicao IS DISTINCT FROM OLD.forma_aquisicao
       OR NEW.situacao IS DISTINCT FROM OLD.situacao
    THEN
      RAISE EXCEPTION 'Somente administradores alteram valor, data e forma de aquisição e a situação do bem (a baixa segue o fluxo de baixa)'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.fn_bens_proteger_colunas() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_bens_proteger_colunas ON public.bens_patrimoniais;
CREATE TRIGGER trg_bens_proteger_colunas
  BEFORE UPDATE OF valor_aquisicao, data_aquisicao, forma_aquisicao, situacao ON public.bens_patrimoniais
  FOR EACH ROW EXECUTE FUNCTION public.fn_bens_proteger_colunas();

-- ====================================================================================================
-- Policies (bloco de supabase/baseline/rls/35_policies_geradas.sql, gerado de rls/mapa.csv)
-- ====================================================================================================

-- agenda_unidade  [permissao: patrimonio]
DROP POLICY IF EXISTS "pat_module_delete" ON public.agenda_unidade;
DROP POLICY IF EXISTS "pat_module_select" ON public.agenda_unidade;
DROP POLICY IF EXISTS "pat_module_update" ON public.agenda_unidade;
DROP POLICY IF EXISTS "pat_module_write" ON public.agenda_unidade;
DROP POLICY IF EXISTS "rls_select" ON public.agenda_unidade;
CREATE POLICY "rls_select" ON public.agenda_unidade FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_insert" ON public.agenda_unidade;
CREATE POLICY "rls_insert" ON public.agenda_unidade FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')) AND public.has_permission_code(auth.uid(), 'unidades.cedencias.gerenciar'));
DROP POLICY IF EXISTS "rls_update" ON public.agenda_unidade;
CREATE POLICY "rls_update" ON public.agenda_unidade FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')) AND public.has_permission_code(auth.uid(), 'unidades.cedencias.gerenciar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')) AND public.has_permission_code(auth.uid(), 'unidades.cedencias.gerenciar'));
DROP POLICY IF EXISTS "rls_delete" ON public.agenda_unidade;
CREATE POLICY "rls_delete" ON public.agenda_unidade FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')) AND public.has_permission_code(auth.uid(), 'unidades.cedencias.gerenciar'));

-- almoxarifados  [modulo: patrimonio]
DROP POLICY IF EXISTS "pat_module_delete" ON public.almoxarifados;
DROP POLICY IF EXISTS "pat_module_select" ON public.almoxarifados;
DROP POLICY IF EXISTS "pat_module_update" ON public.almoxarifados;
DROP POLICY IF EXISTS "pat_module_write" ON public.almoxarifados;
DROP POLICY IF EXISTS "rls_select" ON public.almoxarifados;
CREATE POLICY "rls_select" ON public.almoxarifados FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_insert" ON public.almoxarifados;
CREATE POLICY "rls_insert" ON public.almoxarifados FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_update" ON public.almoxarifados;
CREATE POLICY "rls_update" ON public.almoxarifados FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_delete" ON public.almoxarifados;
CREATE POLICY "rls_delete" ON public.almoxarifados FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')));

-- baixas_patrimonio  [modulo: patrimonio]
DROP POLICY IF EXISTS "pat_module_delete" ON public.baixas_patrimonio;
DROP POLICY IF EXISTS "pat_module_select" ON public.baixas_patrimonio;
DROP POLICY IF EXISTS "pat_module_update" ON public.baixas_patrimonio;
DROP POLICY IF EXISTS "pat_module_write" ON public.baixas_patrimonio;
DROP POLICY IF EXISTS "rls_select" ON public.baixas_patrimonio;
CREATE POLICY "rls_select" ON public.baixas_patrimonio FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_insert" ON public.baixas_patrimonio;
CREATE POLICY "rls_insert" ON public.baixas_patrimonio FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'));
DROP POLICY IF EXISTS "rls_update" ON public.baixas_patrimonio;
CREATE POLICY "rls_update" ON public.baixas_patrimonio FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_delete" ON public.baixas_patrimonio;
CREATE POLICY "rls_delete" ON public.baixas_patrimonio FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')));

-- bens_patrimoniais  [modulo: patrimonio]
DROP POLICY IF EXISTS "pat_module_delete" ON public.bens_patrimoniais;
DROP POLICY IF EXISTS "pat_module_select" ON public.bens_patrimoniais;
DROP POLICY IF EXISTS "pat_module_update" ON public.bens_patrimoniais;
DROP POLICY IF EXISTS "pat_module_write" ON public.bens_patrimoniais;
DROP POLICY IF EXISTS "rls_select" ON public.bens_patrimoniais;
CREATE POLICY "rls_select" ON public.bens_patrimoniais FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'));
DROP POLICY IF EXISTS "rls_insert" ON public.bens_patrimoniais;
CREATE POLICY "rls_insert" ON public.bens_patrimoniais FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'));
DROP POLICY IF EXISTS "rls_update" ON public.bens_patrimoniais;
CREATE POLICY "rls_update" ON public.bens_patrimoniais FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')) AND public.has_permission_code(auth.uid(), 'patrimonio.editar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')) AND public.has_permission_code(auth.uid(), 'patrimonio.editar'));
DROP POLICY IF EXISTS "rls_delete" ON public.bens_patrimoniais;
CREATE POLICY "rls_delete" ON public.bens_patrimoniais FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));

-- campanhas_inventario  [modulo: patrimonio]
DROP POLICY IF EXISTS "rls_select" ON public.campanhas_inventario;
CREATE POLICY "rls_select" ON public.campanhas_inventario FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'));
DROP POLICY IF EXISTS "rls_insert" ON public.campanhas_inventario;
CREATE POLICY "rls_insert" ON public.campanhas_inventario FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_update" ON public.campanhas_inventario;
CREATE POLICY "rls_update" ON public.campanhas_inventario FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_delete" ON public.campanhas_inventario;
CREATE POLICY "rls_delete" ON public.campanhas_inventario FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')));

-- campanhas_inventario_unidades  [modulo: patrimonio]
DROP POLICY IF EXISTS "rls_select" ON public.campanhas_inventario_unidades;
CREATE POLICY "rls_select" ON public.campanhas_inventario_unidades FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'));
DROP POLICY IF EXISTS "rls_insert" ON public.campanhas_inventario_unidades;
CREATE POLICY "rls_insert" ON public.campanhas_inventario_unidades FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_update" ON public.campanhas_inventario_unidades;
CREATE POLICY "rls_update" ON public.campanhas_inventario_unidades FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'));
DROP POLICY IF EXISTS "rls_delete" ON public.campanhas_inventario_unidades;
CREATE POLICY "rls_delete" ON public.campanhas_inventario_unidades FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')));

-- categorias_material  [modulo: patrimonio]
DROP POLICY IF EXISTS "rls_select" ON public.categorias_material;
CREATE POLICY "rls_select" ON public.categorias_material FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_insert" ON public.categorias_material;
CREATE POLICY "rls_insert" ON public.categorias_material FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_update" ON public.categorias_material;
CREATE POLICY "rls_update" ON public.categorias_material FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_delete" ON public.categorias_material;
CREATE POLICY "rls_delete" ON public.categorias_material FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')));

-- coletas_inventario  [modulo: patrimonio]
DROP POLICY IF EXISTS "rls_select" ON public.coletas_inventario;
CREATE POLICY "rls_select" ON public.coletas_inventario FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'));
DROP POLICY IF EXISTS "rls_insert" ON public.coletas_inventario;
CREATE POLICY "rls_insert" ON public.coletas_inventario FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'));
DROP POLICY IF EXISTS "rls_update" ON public.coletas_inventario;
CREATE POLICY "rls_update" ON public.coletas_inventario FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_delete" ON public.coletas_inventario;
CREATE POLICY "rls_delete" ON public.coletas_inventario FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')));

-- conciliacoes_inventario  [modulo: patrimonio]
DROP POLICY IF EXISTS "rls_select" ON public.conciliacoes_inventario;
CREATE POLICY "rls_select" ON public.conciliacoes_inventario FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_insert" ON public.conciliacoes_inventario;
CREATE POLICY "rls_insert" ON public.conciliacoes_inventario FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_update" ON public.conciliacoes_inventario;
CREATE POLICY "rls_update" ON public.conciliacoes_inventario FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_delete" ON public.conciliacoes_inventario;
CREATE POLICY "rls_delete" ON public.conciliacoes_inventario FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')));

-- documentos_cedencia  [permissao: patrimonio]
DROP POLICY IF EXISTS "rls_select" ON public.documentos_cedencia;
CREATE POLICY "rls_select" ON public.documentos_cedencia FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_insert" ON public.documentos_cedencia;
CREATE POLICY "rls_insert" ON public.documentos_cedencia FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')) AND public.has_permission_code(auth.uid(), 'unidades.cedencias.gerenciar'));
DROP POLICY IF EXISTS "rls_update" ON public.documentos_cedencia;
CREATE POLICY "rls_update" ON public.documentos_cedencia FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')) AND public.has_permission_code(auth.uid(), 'unidades.cedencias.gerenciar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')) AND public.has_permission_code(auth.uid(), 'unidades.cedencias.gerenciar'));
DROP POLICY IF EXISTS "rls_delete" ON public.documentos_cedencia;
CREATE POLICY "rls_delete" ON public.documentos_cedencia FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')) AND public.has_permission_code(auth.uid(), 'unidades.cedencias.gerenciar'));

-- estoque  [modulo: patrimonio]
DROP POLICY IF EXISTS "rls_select" ON public.estoque;
CREATE POLICY "rls_select" ON public.estoque FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_insert" ON public.estoque;
CREATE POLICY "rls_insert" ON public.estoque FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_update" ON public.estoque;
CREATE POLICY "rls_update" ON public.estoque FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_delete" ON public.estoque;
CREATE POLICY "rls_delete" ON public.estoque FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')));

-- historico_patrimonio  [trilha: patrimonio]
DROP POLICY IF EXISTS "rls_select" ON public.historico_patrimonio;
CREATE POLICY "rls_select" ON public.historico_patrimonio FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')));

-- itens_material  [modulo: patrimonio]
DROP POLICY IF EXISTS "pat_module_delete" ON public.itens_material;
DROP POLICY IF EXISTS "pat_module_select" ON public.itens_material;
DROP POLICY IF EXISTS "pat_module_update" ON public.itens_material;
DROP POLICY IF EXISTS "pat_module_write" ON public.itens_material;
DROP POLICY IF EXISTS "rls_select" ON public.itens_material;
CREATE POLICY "rls_select" ON public.itens_material FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_insert" ON public.itens_material;
CREATE POLICY "rls_insert" ON public.itens_material FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_update" ON public.itens_material;
CREATE POLICY "rls_update" ON public.itens_material FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')) AND public.has_permission_code(auth.uid(), 'patrimonio.editar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')) AND public.has_permission_code(auth.uid(), 'patrimonio.editar'));
DROP POLICY IF EXISTS "rls_delete" ON public.itens_material;
CREATE POLICY "rls_delete" ON public.itens_material FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')));

-- manutencoes_patrimonio  [modulo: patrimonio]
DROP POLICY IF EXISTS "rls_select" ON public.manutencoes_patrimonio;
CREATE POLICY "rls_select" ON public.manutencoes_patrimonio FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_insert" ON public.manutencoes_patrimonio;
CREATE POLICY "rls_insert" ON public.manutencoes_patrimonio FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_update" ON public.manutencoes_patrimonio;
CREATE POLICY "rls_update" ON public.manutencoes_patrimonio FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_delete" ON public.manutencoes_patrimonio;
CREATE POLICY "rls_delete" ON public.manutencoes_patrimonio FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')));

-- movimentacoes_bem  [modulo: patrimonio]
DROP POLICY IF EXISTS "rls_select" ON public.movimentacoes_bem;
CREATE POLICY "rls_select" ON public.movimentacoes_bem FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_insert" ON public.movimentacoes_bem;
CREATE POLICY "rls_insert" ON public.movimentacoes_bem FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_update" ON public.movimentacoes_bem;
CREATE POLICY "rls_update" ON public.movimentacoes_bem FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_delete" ON public.movimentacoes_bem;
CREATE POLICY "rls_delete" ON public.movimentacoes_bem FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')));

-- movimentacoes_estoque  [modulo: patrimonio]
DROP POLICY IF EXISTS "rls_select" ON public.movimentacoes_estoque;
CREATE POLICY "rls_select" ON public.movimentacoes_estoque FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_insert" ON public.movimentacoes_estoque;
CREATE POLICY "rls_insert" ON public.movimentacoes_estoque FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_update" ON public.movimentacoes_estoque;
CREATE POLICY "rls_update" ON public.movimentacoes_estoque FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_delete" ON public.movimentacoes_estoque;
CREATE POLICY "rls_delete" ON public.movimentacoes_estoque FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')));

-- movimentacoes_patrimonio  [modulo: patrimonio]
DROP POLICY IF EXISTS "pat_module_delete" ON public.movimentacoes_patrimonio;
DROP POLICY IF EXISTS "pat_module_select" ON public.movimentacoes_patrimonio;
DROP POLICY IF EXISTS "pat_module_update" ON public.movimentacoes_patrimonio;
DROP POLICY IF EXISTS "pat_module_write" ON public.movimentacoes_patrimonio;
DROP POLICY IF EXISTS "rls_select" ON public.movimentacoes_patrimonio;
CREATE POLICY "rls_select" ON public.movimentacoes_patrimonio FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_insert" ON public.movimentacoes_patrimonio;
CREATE POLICY "rls_insert" ON public.movimentacoes_patrimonio FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'));
DROP POLICY IF EXISTS "rls_update" ON public.movimentacoes_patrimonio;
CREATE POLICY "rls_update" ON public.movimentacoes_patrimonio FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_delete" ON public.movimentacoes_patrimonio;
CREATE POLICY "rls_delete" ON public.movimentacoes_patrimonio FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')));

-- ocorrencias_patrimonio  [modulo: patrimonio]
DROP POLICY IF EXISTS "rls_select" ON public.ocorrencias_patrimonio;
CREATE POLICY "rls_select" ON public.ocorrencias_patrimonio FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_insert" ON public.ocorrencias_patrimonio;
CREATE POLICY "rls_insert" ON public.ocorrencias_patrimonio FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_update" ON public.ocorrencias_patrimonio;
CREATE POLICY "rls_update" ON public.ocorrencias_patrimonio FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_delete" ON public.ocorrencias_patrimonio;
CREATE POLICY "rls_delete" ON public.ocorrencias_patrimonio FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')));

-- patrimonio_unidade  [modulo: patrimonio]
DROP POLICY IF EXISTS "rls_select" ON public.patrimonio_unidade;
CREATE POLICY "rls_select" ON public.patrimonio_unidade FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_insert" ON public.patrimonio_unidade;
CREATE POLICY "rls_insert" ON public.patrimonio_unidade FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_update" ON public.patrimonio_unidade;
CREATE POLICY "rls_update" ON public.patrimonio_unidade FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_delete" ON public.patrimonio_unidade;
CREATE POLICY "rls_delete" ON public.patrimonio_unidade FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')));

-- requisicao_itens  [modulo: patrimonio]
DROP POLICY IF EXISTS "rls_select" ON public.requisicao_itens;
CREATE POLICY "rls_select" ON public.requisicao_itens FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_insert" ON public.requisicao_itens;
CREATE POLICY "rls_insert" ON public.requisicao_itens FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_update" ON public.requisicao_itens;
CREATE POLICY "rls_update" ON public.requisicao_itens FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_delete" ON public.requisicao_itens;
CREATE POLICY "rls_delete" ON public.requisicao_itens FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')));

-- requisicoes_material  [modulo: patrimonio]
DROP POLICY IF EXISTS "rls_select" ON public.requisicoes_material;
CREATE POLICY "rls_select" ON public.requisicoes_material FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_insert" ON public.requisicoes_material;
CREATE POLICY "rls_insert" ON public.requisicoes_material FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_update" ON public.requisicoes_material;
CREATE POLICY "rls_update" ON public.requisicoes_material FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_delete" ON public.requisicoes_material;
CREATE POLICY "rls_delete" ON public.requisicoes_material FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')));

-- termos_cessao  [permissao: patrimonio]
DROP POLICY IF EXISTS "rls_select" ON public.termos_cessao;
CREATE POLICY "rls_select" ON public.termos_cessao FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')));
DROP POLICY IF EXISTS "rls_insert" ON public.termos_cessao;
CREATE POLICY "rls_insert" ON public.termos_cessao FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')) AND public.has_permission_code(auth.uid(), 'unidades.cedencias.gerenciar'));
DROP POLICY IF EXISTS "rls_update" ON public.termos_cessao;
CREATE POLICY "rls_update" ON public.termos_cessao FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')) AND public.has_permission_code(auth.uid(), 'unidades.cedencias.gerenciar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')) AND public.has_permission_code(auth.uid(), 'unidades.cedencias.gerenciar'));
DROP POLICY IF EXISTS "rls_delete" ON public.termos_cessao;
CREATE POLICY "rls_delete" ON public.termos_cessao FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')) AND public.has_permission_code(auth.uid(), 'unidades.cedencias.gerenciar'));

-- unidades_locais  [permissao: patrimonio]
DROP POLICY IF EXISTS "pat_module_delete" ON public.unidades_locais;
DROP POLICY IF EXISTS "pat_module_select" ON public.unidades_locais;
DROP POLICY IF EXISTS "pat_module_update" ON public.unidades_locais;
DROP POLICY IF EXISTS "pat_module_write" ON public.unidades_locais;
DROP POLICY IF EXISTS "rls_select" ON public.unidades_locais;
CREATE POLICY "rls_select" ON public.unidades_locais FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'));
DROP POLICY IF EXISTS "rls_insert" ON public.unidades_locais;
CREATE POLICY "rls_insert" ON public.unidades_locais FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')) AND public.has_permission_code(auth.uid(), 'unidades.gerenciar'));
DROP POLICY IF EXISTS "rls_update" ON public.unidades_locais;
CREATE POLICY "rls_update" ON public.unidades_locais FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')) AND public.has_permission_code(auth.uid(), 'unidades.gerenciar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')) AND public.has_permission_code(auth.uid(), 'unidades.gerenciar'));
DROP POLICY IF EXISTS "rls_delete" ON public.unidades_locais;
CREATE POLICY "rls_delete" ON public.unidades_locais FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')) AND public.has_permission_code(auth.uid(), 'unidades.gerenciar'));
