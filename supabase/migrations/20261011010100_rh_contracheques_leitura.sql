-- ============================================================================
-- Onda E3 do RH — leitura de contracheques e remuneração por permissão; remessas e eSocial sem DELETE pela API
-- ============================================================================
-- Spec: docs/superpowers/specs/2026-10-11-rh-vazamentos-arquivos-design.md (item 1 de "O que muda", premissas 1 e 2;
-- itens 3 e 4: "sem DELETE pela API")
-- Levantamento: docs/planejamento/REVISAO_RH.md (seção 5, riscos 2 e 4)
--
-- Separada de 20261011010000_rh_cnab_esocial_integridade.sql porque MUDA RLS EXISTENTE (decisão 3 da revisão do RH:
-- o dono decide no merge). Pode ser segurada sem segurar a 20261011010000; sem ela, quem tem o módulo rh continua
-- lendo contracheques, lançamentos, consignações, pensões e eventos do eSocial de todos e apagando remessas e eventos,
-- como hoje.
-- Vale nos dois estados do banco (baseline e só migrações) e é idempotente (ON CONFLICT DO NOTHING, DROP/CREATE
-- POLICY, REVOKE).
--
-- 1. Permissão nova rh.contracheques.visualizar (módulo rh), concedida aos papéis admin e manager. Por que não
--    financeiro.folha.visualizar (premissa 2 da spec): o catálogo dá essa permissão ao papel `user`
--    (role_permissions; a carga de 20260916120000 dá ao `user` todo código com action_type = 'visualizar') e
--    get_user_permission_codes a soma a quem tem o módulo rh; o backfill daquela migração também a gravou em
--    user_modules.permissions de quem tinha o módulo sem permissões. Na prática todo usuário do RH a tem: restringir por
--    ela não restringiria nada. action_type 'consultar' (e não 'visualizar'), para nenhuma carga por action_type a dar
--    ao papel `user`; carga futura precisa excluir este código de propósito.
-- 2. Leitura de remuneração e dado bancário por pessoa: o módulo rh lê com rh.contracheques.visualizar OU
--    financeiro.folha.processar (quem processa a folha confere antes de fechar), sufixo ;leitura= do gerador
--    (supabase/baseline/rls/mapa.csv; cópia literal de supabase/baseline/rls/35_policies_geradas.sql):
--      fichas_financeiras e itens_ficha_financeira (o servidor continua lendo as próprias, posse por meu_servidor_id());
--      lancamentos_folha (rubricas calculadas por ficha) e consignacoes (parcela e saldo devedor por servidor);
--      eventos_esocial (payload com CPF e remuneração);
--      pensoes_alimenticias (CPF e conta do beneficiário, valor) e itens_retorno_bancario (valor pago por servidor).
--    Escrita: as quatro primeiras já exigiam financeiro.folha.processar (B1); eventos_esocial, pensoes_alimenticias e
--    itens_retorno_bancario passam a exigir (antes bastava o módulo). folhas_pagamento fica como está (só totais).
-- 3. remessas_bancarias: o módulo rh continua lendo (só totais da folha; o arquivo, com conta por servidor, fica no
--    bucket remessas-cnab, que já exige financeiro.folha.processar); INSERT e UPDATE passam a exigir
--    financeiro.folha.processar. remessas_bancarias e eventos_esocial: sem policy de DELETE (sufixo excluir=ninguem) e
--    sem o privilégio DELETE para authenticated (a API recebe 42501 em vez de "0 linhas"). A remessa é cancelada pela
--    RPC cancelar_remessa (20261011010000); a retificação de evento do eSocial fica para a onda G. A service role
--    continua podendo apagar (operação manual, fora da API do navegador).
-- 4. fn_validar_margem_consignavel (líquido e consignações de um servidor): SECURITY INVOKER e a mesma regra de
--    leitura (42501 fora dela).
-- 5. Fora desta migração (sem remuneração por pessoa na linha, ou exigem outra solução): retornos_bancarios e
--    exportacoes_folha (totais por arquivo), dependentes_irrf (dado pessoal de dependente, sem valor),
--    adicionais_tempo_servico (registro funcional do RH), as colunas de remuneração e banco de servidores,
--    vinculos_servidor e pre_cadastros (RLS é por linha; privilégio por coluna quebraria os select('*') do front: risco
--    registrado) — ver docs/BANCO_DE_DADOS.md.
-- Front: a rota /rh/contracheques e os itens de menu usam rh.contracheques.visualizar (ROUTE_PERMISSIONS).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Permissão de leitura dos contracheques
-- ----------------------------------------------------------------------------
INSERT INTO public.module_permissions_catalog
  (module_code, permission_code, label, description, category, action_type, sort_order)
VALUES
  ('rh', 'rh.contracheques.visualizar', 'Visualizar Contracheques de Outros Servidores',
   'Lê contracheques (fichas e itens), lançamentos, consignações, pensões, retorno bancário e eventos do eSocial de todos os servidores; o servidor sempre lê o próprio contracheque',
   'Folha', 'consultar', 511)
ON CONFLICT (permission_code) DO NOTHING;

INSERT INTO public.role_permissions (role, permission)
VALUES ('admin', 'rh.contracheques.visualizar'), ('manager', 'rh.contracheques.visualizar')
ON CONFLICT (role, permission) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2 e 3. Policies (gerado por scripts/db/gerar-rls.mjs; cópia literal de supabase/baseline/rls/35_policies_geradas.sql)
-- ----------------------------------------------------------------------------
-- fichas_financeiras  [permissao: rh]
DROP POLICY IF EXISTS "rls_select" ON public.fichas_financeiras;
CREATE POLICY "rls_select" ON public.fichas_financeiras FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.contracheques.visualizar') OR public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.fichas_financeiras;
CREATE POLICY "rls_insert" ON public.fichas_financeiras FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_update" ON public.fichas_financeiras;
CREATE POLICY "rls_update" ON public.fichas_financeiras FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_delete" ON public.fichas_financeiras;
CREATE POLICY "rls_delete" ON public.fichas_financeiras FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
-- itens_ficha_financeira  [permissao: rh]
DROP POLICY IF EXISTS "rls_select" ON public.itens_ficha_financeira;
CREATE POLICY "rls_select" ON public.itens_ficha_financeira FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.contracheques.visualizar') OR public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))) OR EXISTS (SELECT 1 FROM public.fichas_financeiras p WHERE p.id = itens_ficha_financeira.ficha_id AND p.servidor_id = public.meu_servidor_id()));
DROP POLICY IF EXISTS "rls_insert" ON public.itens_ficha_financeira;
CREATE POLICY "rls_insert" ON public.itens_ficha_financeira FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_update" ON public.itens_ficha_financeira;
CREATE POLICY "rls_update" ON public.itens_ficha_financeira FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_delete" ON public.itens_ficha_financeira;
CREATE POLICY "rls_delete" ON public.itens_ficha_financeira FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
-- lancamentos_folha  [permissao: rh]
DROP POLICY IF EXISTS "rls_select" ON public.lancamentos_folha;
CREATE POLICY "rls_select" ON public.lancamentos_folha FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.contracheques.visualizar') OR public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))));
DROP POLICY IF EXISTS "rls_insert" ON public.lancamentos_folha;
CREATE POLICY "rls_insert" ON public.lancamentos_folha FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_update" ON public.lancamentos_folha;
CREATE POLICY "rls_update" ON public.lancamentos_folha FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_delete" ON public.lancamentos_folha;
CREATE POLICY "rls_delete" ON public.lancamentos_folha FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
-- consignacoes  [permissao: rh]
DROP POLICY IF EXISTS "rls_select" ON public.consignacoes;
CREATE POLICY "rls_select" ON public.consignacoes FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.contracheques.visualizar') OR public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))));
DROP POLICY IF EXISTS "rls_insert" ON public.consignacoes;
CREATE POLICY "rls_insert" ON public.consignacoes FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_update" ON public.consignacoes;
CREATE POLICY "rls_update" ON public.consignacoes FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_delete" ON public.consignacoes;
CREATE POLICY "rls_delete" ON public.consignacoes FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
-- pensoes_alimenticias  [permissao: rh]
DROP POLICY IF EXISTS "rls_select" ON public.pensoes_alimenticias;
CREATE POLICY "rls_select" ON public.pensoes_alimenticias FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.contracheques.visualizar') OR public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))));
DROP POLICY IF EXISTS "rls_insert" ON public.pensoes_alimenticias;
CREATE POLICY "rls_insert" ON public.pensoes_alimenticias FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_update" ON public.pensoes_alimenticias;
CREATE POLICY "rls_update" ON public.pensoes_alimenticias FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_delete" ON public.pensoes_alimenticias;
CREATE POLICY "rls_delete" ON public.pensoes_alimenticias FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
-- itens_retorno_bancario  [permissao: rh]
DROP POLICY IF EXISTS "rls_select" ON public.itens_retorno_bancario;
CREATE POLICY "rls_select" ON public.itens_retorno_bancario FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.contracheques.visualizar') OR public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))));
DROP POLICY IF EXISTS "rls_insert" ON public.itens_retorno_bancario;
CREATE POLICY "rls_insert" ON public.itens_retorno_bancario FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_update" ON public.itens_retorno_bancario;
CREATE POLICY "rls_update" ON public.itens_retorno_bancario FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_delete" ON public.itens_retorno_bancario;
CREATE POLICY "rls_delete" ON public.itens_retorno_bancario FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
-- eventos_esocial  [permissao: rh]
DROP POLICY IF EXISTS "rls_select" ON public.eventos_esocial;
CREATE POLICY "rls_select" ON public.eventos_esocial FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.contracheques.visualizar') OR public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))));
DROP POLICY IF EXISTS "rls_insert" ON public.eventos_esocial;
CREATE POLICY "rls_insert" ON public.eventos_esocial FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_update" ON public.eventos_esocial;
CREATE POLICY "rls_update" ON public.eventos_esocial FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_delete" ON public.eventos_esocial;
-- remessas_bancarias  [permissao: rh]
DROP POLICY IF EXISTS "rls_select" ON public.remessas_bancarias;
CREATE POLICY "rls_select" ON public.remessas_bancarias FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.remessas_bancarias;
CREATE POLICY "rls_insert" ON public.remessas_bancarias FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_update" ON public.remessas_bancarias;
CREATE POLICY "rls_update" ON public.remessas_bancarias FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'));
DROP POLICY IF EXISTS "rls_delete" ON public.remessas_bancarias;

-- Sem DELETE também por privilégio (mesma linha no supabase/baseline/overlay/40_privilegios.sql)
REVOKE DELETE ON public.remessas_bancarias, public.eventos_esocial FROM anon, authenticated;

-- ----------------------------------------------------------------------------
-- 4. fn_validar_margem_consignavel: mesma regra de leitura
-- ----------------------------------------------------------------------------
-- Devolve o líquido do servidor e a soma das consignações. No banco só de migrações era SECURITY DEFINER sem checagem
-- (qualquer logado consultava qualquer servidor); no baseline o overlay 18 já a fazia rodar como o usuário. Agora, nos
-- dois: SECURITY INVOKER (a RLS de servidores e consignacoes vale) e checagem explícita — módulo rh com
-- rh.contracheques.visualizar ou financeiro.folha.processar, ou o próprio servidor (42501 fora disso). Limite: o
-- próprio servidor não lê as próprias consignações pela RLS (consignacoes não tem posse), então para ele
-- margem_utilizada sai 0; nenhuma tela do servidor usa a função hoje. O EXECUTE continua como estava.
CREATE OR REPLACE FUNCTION public.fn_validar_margem_consignavel(p_servidor_id uuid)
 RETURNS TABLE(salario_liquido numeric, margem_total_percentual numeric, margem_total_valor numeric, margem_utilizada numeric, margem_disponivel numeric, percentual_utilizado numeric, dentro_limite boolean)
 LANGUAGE plpgsql
 STABLE SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_liquido NUMERIC;
  v_margem_pct NUMERIC;
  v_utilizada NUMERIC;
BEGIN
  -- coalesce: sem servidor vinculado, meu_servidor_id() é nulo e a comparação daria nulo (o IF não recusaria)
  IF NOT coalesce((auth.uid() IS NOT NULL AND public.can_access_module(auth.uid(), 'rh')
                   AND (public.has_permission_code(auth.uid(), 'rh.contracheques.visualizar')
                        OR public.has_permission_code(auth.uid(), 'financeiro.folha.processar')))
                  OR p_servidor_id = public.meu_servidor_id(), false) THEN
    RAISE EXCEPTION 'fn_validar_margem_consignavel: exige o módulo rh com rh.contracheques.visualizar ou financeiro.folha.processar, ou ser o próprio servidor'
      USING ERRCODE = '42501';
  END IF;

  -- Buscar remuneração líquida do servidor
  SELECT COALESCE(s.remuneracao_bruta, 0) - COALESCE(s.descontos, 0)
  INTO v_liquido
  FROM servidores s WHERE s.id = p_servidor_id;

  -- Buscar percentual da margem
  SELECT COALESCE(valor * 100, 35)
  INTO v_margem_pct
  FROM parametros_folha
  WHERE tipo_parametro = 'margem_consignavel' AND ativo = true
  ORDER BY vigencia_inicio DESC LIMIT 1;

  -- Somar consignações ativas
  SELECT COALESCE(SUM(valor_parcela), 0)
  INTO v_utilizada
  FROM consignacoes
  WHERE servidor_id = p_servidor_id AND ativo = true AND suspenso = false AND quitado = false;

  RETURN QUERY SELECT
    v_liquido,
    v_margem_pct,
    ROUND(v_liquido * v_margem_pct / 100, 2),
    v_utilizada,
    ROUND(v_liquido * v_margem_pct / 100 - v_utilizada, 2),
    CASE WHEN v_liquido > 0 THEN ROUND(v_utilizada / (v_liquido * v_margem_pct / 100) * 100, 2) ELSE 0 END,
    v_utilizada <= ROUND(v_liquido * v_margem_pct / 100, 2);
END;
$function$;

-- Aviso (não erro): policy fora das rls_* nestas oito tabelas (criada fora das migrações no banco ao vivo). Policies
-- permissivas são OR: uma assim manteria a leitura ampla dos contracheques ou o DELETE e precisa ser revista à mão.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT tablename, policyname FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename IN ('fichas_financeiras', 'itens_ficha_financeira', 'lancamentos_folha', 'consignacoes',
                         'pensoes_alimenticias', 'itens_retorno_bancario', 'eventos_esocial', 'remessas_bancarias')
       AND policyname NOT IN ('rls_select', 'rls_insert', 'rls_update', 'rls_delete')
  LOOP
    RAISE WARNING 'public.%: a policy "%" não é do gerador e soma (OR) com as rls_*; revise', r.tablename, r.policyname;
  END LOOP;
END $$;
