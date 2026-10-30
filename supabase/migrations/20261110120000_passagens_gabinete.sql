-- ============================================================================
-- PASSAGENS AÉREAS no Gabinete da Presidência
-- ============================================================================
-- O Gabinete recebe os pedidos (SEI, e-mail) e as faturas da agência; o contrato da agência continua com o setor
-- de Contratos. As telas foram para /gabinete/passagens e as regras do banco passam a aceitar o módulo gabinete
-- OU contratos (antes: só contratos). Os códigos de permissão continuam os mesmos (contratos.passagens.visualizar,
-- editar e financeiro) e as concessões avulsas e as feitas dentro de um módulo valem como antes. No catálogo eles
-- passam ao módulo gabinete: o padrão do papel (role_permissions) só vale para quem tem o módulo Gabinete.
--
--   1. RLS das 10 tabelas passagem_* (gerado de supabase/baseline/rls/mapa.csv por scripts/db/gerar-rls.mjs).
--   2. Bucket privado `passagens` (mesmo texto de supabase/baseline/overlay/50_storage.sql).
--   3. Leituras estreitas (RH, Financeiro) com a mesma troca de módulo.
--   4. passagem_contratos_agencia: o contrato da agência para quem lê passagens (contratos e fornecedores seguem
--      fechados para quem só tem o Gabinete).
--   5. Catálogo: as três permissões das passagens no módulo gabinete.
-- Nenhum dado muda. Idempotente (DROP/CREATE de policies, CREATE OR REPLACE, UPDATE sem efeito na 2ª vez).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. RLS (gerado de supabase/baseline/rls/mapa.csv por scripts/db/gerar-rls.mjs)
-- ----------------------------------------------------------------------------
-- passagem_anexos  [permissao: gabinete | contratos]
DROP POLICY IF EXISTS "rls_select" ON public.passagem_anexos;
CREATE POLICY "rls_select" ON public.passagem_anexos FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos')) AND (public.has_permission_code(auth.uid(), 'contratos.passagens.visualizar') OR public.has_permission_code(auth.uid(), 'contratos.passagens.editar'))));
DROP POLICY IF EXISTS "rls_insert" ON public.passagem_anexos;
CREATE POLICY "rls_insert" ON public.passagem_anexos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar'));
DROP POLICY IF EXISTS "rls_update" ON public.passagem_anexos;
CREATE POLICY "rls_update" ON public.passagem_anexos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar'));
DROP POLICY IF EXISTS "rls_delete" ON public.passagem_anexos;
CREATE POLICY "rls_delete" ON public.passagem_anexos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar'));

-- passagem_beneficiarios  [permissao: gabinete | contratos]
DROP POLICY IF EXISTS "rls_select" ON public.passagem_beneficiarios;
CREATE POLICY "rls_select" ON public.passagem_beneficiarios FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos')) AND (public.has_permission_code(auth.uid(), 'contratos.passagens.visualizar') OR public.has_permission_code(auth.uid(), 'contratos.passagens.editar'))));
DROP POLICY IF EXISTS "rls_insert" ON public.passagem_beneficiarios;
CREATE POLICY "rls_insert" ON public.passagem_beneficiarios FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar'));
DROP POLICY IF EXISTS "rls_update" ON public.passagem_beneficiarios;
CREATE POLICY "rls_update" ON public.passagem_beneficiarios FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar'));
DROP POLICY IF EXISTS "rls_delete" ON public.passagem_beneficiarios;

-- passagem_contrato_empenhos  [permissao: gabinete | contratos]
DROP POLICY IF EXISTS "rls_select" ON public.passagem_contrato_empenhos;
CREATE POLICY "rls_select" ON public.passagem_contrato_empenhos FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos')) AND (public.has_permission_code(auth.uid(), 'contratos.passagens.visualizar') OR public.has_permission_code(auth.uid(), 'contratos.passagens.editar') OR public.has_permission_code(auth.uid(), 'contratos.passagens.financeiro'))));
DROP POLICY IF EXISTS "rls_insert" ON public.passagem_contrato_empenhos;
CREATE POLICY "rls_insert" ON public.passagem_contrato_empenhos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.financeiro'));
DROP POLICY IF EXISTS "rls_update" ON public.passagem_contrato_empenhos;
CREATE POLICY "rls_update" ON public.passagem_contrato_empenhos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.financeiro'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.financeiro'));
DROP POLICY IF EXISTS "rls_delete" ON public.passagem_contrato_empenhos;
CREATE POLICY "rls_delete" ON public.passagem_contrato_empenhos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.financeiro'));

-- passagem_cotacoes  [permissao: gabinete | contratos]
DROP POLICY IF EXISTS "rls_select" ON public.passagem_cotacoes;
CREATE POLICY "rls_select" ON public.passagem_cotacoes FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos')) AND (public.has_permission_code(auth.uid(), 'contratos.passagens.visualizar') OR public.has_permission_code(auth.uid(), 'contratos.passagens.editar'))));
DROP POLICY IF EXISTS "rls_insert" ON public.passagem_cotacoes;
CREATE POLICY "rls_insert" ON public.passagem_cotacoes FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar'));
DROP POLICY IF EXISTS "rls_update" ON public.passagem_cotacoes;
CREATE POLICY "rls_update" ON public.passagem_cotacoes FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar'));
DROP POLICY IF EXISTS "rls_delete" ON public.passagem_cotacoes;
CREATE POLICY "rls_delete" ON public.passagem_cotacoes FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar'));

-- passagem_fatura_itens  [permissao: gabinete | contratos]
DROP POLICY IF EXISTS "rls_select" ON public.passagem_fatura_itens;
CREATE POLICY "rls_select" ON public.passagem_fatura_itens FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos')) AND (public.has_permission_code(auth.uid(), 'contratos.passagens.visualizar') OR public.has_permission_code(auth.uid(), 'contratos.passagens.editar') OR public.has_permission_code(auth.uid(), 'contratos.passagens.financeiro'))));
DROP POLICY IF EXISTS "rls_insert" ON public.passagem_fatura_itens;
CREATE POLICY "rls_insert" ON public.passagem_fatura_itens FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.financeiro'));
DROP POLICY IF EXISTS "rls_update" ON public.passagem_fatura_itens;
CREATE POLICY "rls_update" ON public.passagem_fatura_itens FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.financeiro'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.financeiro'));
DROP POLICY IF EXISTS "rls_delete" ON public.passagem_fatura_itens;
CREATE POLICY "rls_delete" ON public.passagem_fatura_itens FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.financeiro'));

-- passagem_faturas  [permissao: gabinete | contratos]
DROP POLICY IF EXISTS "rls_select" ON public.passagem_faturas;
CREATE POLICY "rls_select" ON public.passagem_faturas FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos')) AND (public.has_permission_code(auth.uid(), 'contratos.passagens.visualizar') OR public.has_permission_code(auth.uid(), 'contratos.passagens.editar') OR public.has_permission_code(auth.uid(), 'contratos.passagens.financeiro'))));
DROP POLICY IF EXISTS "rls_insert" ON public.passagem_faturas;
CREATE POLICY "rls_insert" ON public.passagem_faturas FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.financeiro'));
DROP POLICY IF EXISTS "rls_update" ON public.passagem_faturas;
CREATE POLICY "rls_update" ON public.passagem_faturas FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.financeiro'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.financeiro'));
DROP POLICY IF EXISTS "rls_delete" ON public.passagem_faturas;
CREATE POLICY "rls_delete" ON public.passagem_faturas FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.financeiro'));

-- passagem_historico  [trilha: gabinete | contratos]
DROP POLICY IF EXISTS "rls_select" ON public.passagem_historico;
CREATE POLICY "rls_select" ON public.passagem_historico FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos')) AND (public.has_permission_code(auth.uid(), 'contratos.passagens.visualizar') OR public.has_permission_code(auth.uid(), 'contratos.passagens.editar')));

-- passagem_passageiros  [permissao: gabinete | contratos]
DROP POLICY IF EXISTS "rls_select" ON public.passagem_passageiros;
CREATE POLICY "rls_select" ON public.passagem_passageiros FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos')) AND (public.has_permission_code(auth.uid(), 'contratos.passagens.visualizar') OR public.has_permission_code(auth.uid(), 'contratos.passagens.editar'))));
DROP POLICY IF EXISTS "rls_insert" ON public.passagem_passageiros;
CREATE POLICY "rls_insert" ON public.passagem_passageiros FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar'));
DROP POLICY IF EXISTS "rls_update" ON public.passagem_passageiros;
CREATE POLICY "rls_update" ON public.passagem_passageiros FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar'));
DROP POLICY IF EXISTS "rls_delete" ON public.passagem_passageiros;
CREATE POLICY "rls_delete" ON public.passagem_passageiros FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar'));

-- passagem_pedidos  [permissao: gabinete | contratos]
DROP POLICY IF EXISTS "rls_select" ON public.passagem_pedidos;
CREATE POLICY "rls_select" ON public.passagem_pedidos FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos')) AND (public.has_permission_code(auth.uid(), 'contratos.passagens.visualizar') OR public.has_permission_code(auth.uid(), 'contratos.passagens.editar'))));
DROP POLICY IF EXISTS "rls_insert" ON public.passagem_pedidos;
CREATE POLICY "rls_insert" ON public.passagem_pedidos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar'));
DROP POLICY IF EXISTS "rls_update" ON public.passagem_pedidos;
CREATE POLICY "rls_update" ON public.passagem_pedidos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar'));
DROP POLICY IF EXISTS "rls_delete" ON public.passagem_pedidos;

-- passagem_trechos  [permissao: gabinete | contratos]
DROP POLICY IF EXISTS "rls_select" ON public.passagem_trechos;
CREATE POLICY "rls_select" ON public.passagem_trechos FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos')) AND (public.has_permission_code(auth.uid(), 'contratos.passagens.visualizar') OR public.has_permission_code(auth.uid(), 'contratos.passagens.editar'))));
DROP POLICY IF EXISTS "rls_insert" ON public.passagem_trechos;
CREATE POLICY "rls_insert" ON public.passagem_trechos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar'));
DROP POLICY IF EXISTS "rls_update" ON public.passagem_trechos;
CREATE POLICY "rls_update" ON public.passagem_trechos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar'));
DROP POLICY IF EXISTS "rls_delete" ON public.passagem_trechos;
CREATE POLICY "rls_delete" ON public.passagem_trechos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar'));

-- ----------------------------------------------------------------------------
-- 2. Bucket privado `passagens`: ler com o módulo gabinete ou contratos E ver/editar; enviar e apagar com editar
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "st_passagens_select" ON storage.objects;
CREATE POLICY "st_passagens_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'passagens' AND (public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos'))
         AND (public.has_permission_code(auth.uid(), 'contratos.passagens.visualizar')
              OR public.has_permission_code(auth.uid(), 'contratos.passagens.editar')));
DROP POLICY IF EXISTS "st_passagens_insert" ON storage.objects;
CREATE POLICY "st_passagens_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'passagens' AND (public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos'))
              AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar')
              AND name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/'
              AND EXISTS (SELECT 1 FROM public.passagem_pedidos p WHERE p.id::text = left(objects.name, 36)));
DROP POLICY IF EXISTS "st_passagens_update" ON storage.objects;
DROP POLICY IF EXISTS "st_passagens_delete" ON storage.objects;
CREATE POLICY "st_passagens_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'passagens' AND (public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos'))
         AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar'));

-- ----------------------------------------------------------------------------
-- 3. Leituras estreitas do RH e do Financeiro
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.passagem_buscar_servidores(_termo text)
RETURNS TABLE (id uuid, nome text, matricula text, cargo text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos'))
          AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar')) THEN
    RAISE EXCEPTION 'Requer a permissão de editar passagens.' USING ERRCODE = '42501';
  END IF;
  IF char_length(regexp_replace(COALESCE(_termo, ''), '[^[:alnum:]]', '', 'g')) < 3 THEN
    RETURN;
  END IF;
  RETURN QUERY
  SELECT s.id, s.nome_completo, s.matricula, c.nome
    FROM public.servidores s
    LEFT JOIN public.cargos c ON c.id = s.cargo_atual_id
   WHERE s.ativo IS NOT FALSE
     AND (s.nome_completo ILIKE '%' || replace(replace(replace(btrim(_termo), '\', '\\'), '%', '\%'), '_', '\_') || '%'
          OR s.matricula = btrim(_termo))
   ORDER BY s.nome_completo
   LIMIT 20;
END;
$$;
REVOKE ALL ON FUNCTION public.passagem_buscar_servidores(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.passagem_buscar_servidores(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.passagem_viagens_servidor(_servidor_id uuid)
RETURNS TABLE (id uuid, destino text, data_saida date, data_retorno date, status text,
               relatorio_apresentado boolean, relatorio_data date)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos'))
          AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar')) THEN
    RAISE EXCEPTION 'Requer a permissão de editar passagens.' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT v.id, v.destino_cidade || '/' || v.destino_uf, v.data_saida, v.data_retorno, v.status,
         COALESCE(v.relatorio_apresentado, false), v.relatorio_data
    FROM public.viagens_diarias v
   WHERE v.servidor_id = _servidor_id AND v.status <> 'cancelada'
   ORDER BY v.data_saida DESC
   LIMIT 30;
END;
$$;
REVOKE ALL ON FUNCTION public.passagem_viagens_servidor(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.passagem_viagens_servidor(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.passagem_relatorio_rh(_passageiro_ids uuid[])
RETURNS TABLE (passageiro_id uuid, relatorio_apresentado boolean, relatorio_data date)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT ((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos'))
          AND (public.has_permission_code(auth.uid(), 'contratos.passagens.visualizar')
               OR public.has_permission_code(auth.uid(), 'contratos.passagens.editar'))) THEN
    RAISE EXCEPTION 'Requer a permissão de ver passagens.' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT p.id, COALESCE(v.relatorio_apresentado, false), v.relatorio_data
    FROM public.passagem_passageiros p
    JOIN public.viagens_diarias v ON v.id = p.viagem_id AND v.servidor_id = p.servidor_id
   WHERE p.id = ANY (_passageiro_ids);
END;
$$;
REVOKE ALL ON FUNCTION public.passagem_relatorio_rh(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.passagem_relatorio_rh(uuid[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.passagem_empenhos_contrato(_contrato_id uuid)
RETURNS TABLE (
  empenho_id uuid,
  numero text,
  exercicio integer,
  data_empenho date,
  natureza text,
  credor text,
  valor_empenhado numeric,
  valor_anulado numeric,
  valor_liquidado numeric,
  valor_pago numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT COALESCE((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos'))
                  AND (public.has_permission_code(auth.uid(), 'contratos.passagens.visualizar')
                       OR public.has_permission_code(auth.uid(), 'contratos.passagens.editar')
                       OR public.has_permission_code(auth.uid(), 'contratos.passagens.financeiro')), false) THEN
    RAISE EXCEPTION 'Requer a permissão de ver passagens.' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.contratos c WHERE c.id = _contrato_id AND c.controla_passagens) THEN
    RAISE EXCEPTION 'O contrato não é de passagens aéreas.' USING ERRCODE = '22023';
  END IF;
  RETURN QUERY
  SELECT e.id, e.numero::text, e.exercicio, e.data_empenho, nd.codigo::text, e.credor_nome,
         e.valor_empenhado, COALESCE(e.valor_anulado, 0), COALESCE(e.valor_liquidado, 0), COALESCE(e.valor_pago, 0)
    FROM public.passagem_contrato_empenhos l
    JOIN public.fin_empenhos e ON e.id = l.empenho_id
    LEFT JOIN public.fin_naturezas_despesa nd ON nd.id = e.natureza_despesa_id
   WHERE l.contrato_id = _contrato_id
   ORDER BY e.exercicio DESC, e.data_empenho DESC, e.numero;
END;
$$;
REVOKE ALL ON FUNCTION public.passagem_empenhos_contrato(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.passagem_empenhos_contrato(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.passagem_empenhos_candidatos(_contrato_id uuid, _exercicio integer DEFAULT NULL)
RETURNS TABLE (
  empenho_id uuid,
  numero text,
  exercicio integer,
  data_empenho date,
  natureza text,
  credor text,
  processo_sei text,
  valor_empenhado numeric,
  valor_anulado numeric,
  ligado boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT COALESCE((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos'))
                  AND public.has_permission_code(auth.uid(), 'contratos.passagens.financeiro'), false) THEN
    RAISE EXCEPTION 'Requer a permissão de faturas e empenhos das passagens.' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.contratos c WHERE c.id = _contrato_id AND c.controla_passagens) THEN
    RAISE EXCEPTION 'O contrato não é de passagens aéreas.' USING ERRCODE = '22023';
  END IF;
  RETURN QUERY
  SELECT e.id, e.numero::text, e.exercicio, e.data_empenho, nd.codigo::text, e.credor_nome, e.processo_sei::text,
         e.valor_empenhado, COALESCE(e.valor_anulado, 0), (l.empenho_id IS NOT NULL)
    FROM public.fin_empenhos e
    LEFT JOIN public.fin_naturezas_despesa nd ON nd.id = e.natureza_despesa_id
    LEFT JOIN public.passagem_contrato_empenhos l ON l.empenho_id = e.id AND l.contrato_id = _contrato_id
   WHERE (e.exercicio = COALESCE(_exercicio, extract(year FROM current_date)::integer) OR l.empenho_id IS NOT NULL)
     AND (l.empenho_id IS NOT NULL OR public.passagem_empenho_candidato(_contrato_id, e.id))
   ORDER BY (l.empenho_id IS NOT NULL) DESC, e.exercicio DESC, e.data_empenho DESC, e.numero
   LIMIT 300;
END;
$$;
REVOKE ALL ON FUNCTION public.passagem_empenhos_candidatos(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.passagem_empenhos_candidatos(uuid, integer) TO authenticated;

-- ----------------------------------------------------------------------------
-- 4. Contrato da agência para quem lê passagens
-- ----------------------------------------------------------------------------
-- Contrato(s) da agência para quem lê passagens: o Gabinete não tem o módulo Contratos (nem lê contratos e
-- fornecedores pela RLS). Só o que a tela das passagens mostra: nº, objeto, valor, vigência e nome da agência.
CREATE OR REPLACE FUNCTION public.passagem_contratos_agencia()
RETURNS TABLE (
  id uuid,
  numero_contrato text,
  ano integer,
  objeto text,
  objeto_resumido text,
  valor_atual numeric,
  data_inicio date,
  data_fim date,
  data_fim_atual date,
  fornecedor jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT COALESCE((public.can_access_module(auth.uid(), 'gabinete') OR public.can_access_module(auth.uid(), 'contratos'))
                  AND (public.has_permission_code(auth.uid(), 'contratos.passagens.visualizar')
                       OR public.has_permission_code(auth.uid(), 'contratos.passagens.editar')
                       OR public.has_permission_code(auth.uid(), 'contratos.passagens.financeiro')), false) THEN
    RAISE EXCEPTION 'Requer a permissão de ver passagens.' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT c.id, c.numero_contrato::text, c.ano::integer, c.objeto::text, c.objeto_resumido::text, c.valor_atual,
         c.data_inicio, c.data_fim, c.data_fim_atual,
         CASE WHEN f.id IS NULL THEN NULL
              ELSE jsonb_build_object('razao_social', f.razao_social, 'nome_fantasia', f.nome_fantasia) END
    FROM public.contratos c
    LEFT JOIN public.fornecedores f ON f.id = c.fornecedor_id
   WHERE c.controla_passagens
   ORDER BY c.ano DESC, c.numero_contrato;
END;
$$;
REVOKE ALL ON FUNCTION public.passagem_contratos_agencia() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.passagem_contratos_agencia() TO authenticated;

-- ----------------------------------------------------------------------------
-- 5. Catálogo: as permissões das passagens aparecem no Gabinete (o papel concede dentro dos módulos do usuário)
-- ----------------------------------------------------------------------------
UPDATE public.module_permissions_catalog
   SET module_code = 'gabinete'
 WHERE permission_code IN ('contratos.passagens.visualizar', 'contratos.passagens.editar', 'contratos.passagens.financeiro')
   AND module_code IS DISTINCT FROM 'gabinete';
