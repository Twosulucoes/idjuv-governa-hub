-- ============================================================================
-- Convênios federais (Transferegov): histórico do que mudou entre as cargas e permissão para pedir carga na hora.
-- Spec: docs/superpowers/specs/2026-10-29-convenios-federais-transferegov-design.md (§6, pedido de 30/10/2026)
--
--   fin_tg_mudancas               uma linha por mudança achada numa carga: proposta, emenda, convênio ou movimento
--                                 novo, removido, ou campo alterado (valor anterior e novo). A primeira carga, com o
--                                 espelho vazio, não registra nada. Trilha: só leitura pela API.
--   fin_tg_mapa(entidade)         foto de uma tabela do espelho em jsonb (chave → linha), para comparar.
--   fin_tg_registrar_diferencas   compara duas fotos e grava as mudanças. Interna (sem EXECUTE para a API).
--   fin_tg_carregar               a mesma troca do espelho (WHERE true por causa do pg_safeupdate), agora com o
--                                 registro das mudanças; devolve também quantas mudanças achou.
--   fin_tg_sincronizacoes.mudancas  quantas mudanças a carga achou.
--   pode_atualizar_convenios_federais()  a Edge Function transferegov-atualizar pergunta se o usuário pode pedir
--                                 uma carga na hora (perfil ativo, módulo financeiro e financeiro.convenios.visualizar).
-- Idempotente (IF NOT EXISTS, CREATE OR REPLACE, DROP/CREATE de policies).
-- ============================================================================

SET lock_timeout = '10s';

-- ----------------------------------------------------------------------------
-- 1. Tabela de mudanças
-- ----------------------------------------------------------------------------
ALTER TABLE public.fin_tg_sincronizacoes ADD COLUMN IF NOT EXISTS mudancas integer NOT NULL DEFAULT 0;
COMMENT ON COLUMN public.fin_tg_sincronizacoes.mudancas IS 'Quantas mudanças a carga achou em relação à anterior (fin_tg_mudancas).';

CREATE TABLE IF NOT EXISTS public.fin_tg_mudancas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sincronizacao_id uuid NOT NULL REFERENCES public.fin_tg_sincronizacoes(id) ON DELETE CASCADE,
  registrada_em timestamptz NOT NULL DEFAULT now(),
  entidade text NOT NULL CHECK (entidade IN ('proposta', 'emenda', 'convenio', 'movimento')),
  chave text NOT NULL,
  id_proposta bigint,
  numero_convenio text,
  tipo text NOT NULL CHECK (tipo IN ('novo', 'removido', 'alterado')),
  campo text,
  valor_anterior text,
  valor_novo text,
  dados jsonb,
  CONSTRAINT fin_tg_mudancas_campo_ck CHECK ((tipo = 'alterado') = (campo IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_fin_tg_mudancas_registrada ON public.fin_tg_mudancas (registrada_em DESC);
CREATE INDEX IF NOT EXISTS idx_fin_tg_mudancas_proposta ON public.fin_tg_mudancas (id_proposta, registrada_em DESC);
CREATE INDEX IF NOT EXISTS idx_fin_tg_mudancas_sincronizacao ON public.fin_tg_mudancas (sincronizacao_id);
COMMENT ON TABLE public.fin_tg_mudancas IS
  'O que mudou no Transferegov entre uma carga e a anterior (novo, removido ou campo alterado). Sem chave estrangeira para o espelho: a mudança fica mesmo quando a proposta some de lá.';

ALTER TABLE public.fin_tg_mudancas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.fin_tg_mudancas FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.fin_tg_mudancas FROM authenticated;

-- ----------------------------------------------------------------------------
-- 2. Foto e comparação
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fin_tg_mapa(p_entidade text)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT CASE p_entidade
    WHEN 'proposta' THEN (SELECT coalesce(jsonb_object_agg(id_proposta::text, to_jsonb(t) - 'atualizado_em'), '{}')
                            FROM public.fin_tg_propostas t)
    WHEN 'emenda' THEN (SELECT coalesce(jsonb_object_agg(id_proposta::text || ':' || numero_emenda, to_jsonb(t) - 'atualizado_em'), '{}')
                          FROM public.fin_tg_emendas t)
    WHEN 'convenio' THEN (SELECT coalesce(jsonb_object_agg(numero, to_jsonb(t) - 'atualizado_em'), '{}')
                            FROM public.fin_tg_convenios t)
    WHEN 'movimento' THEN (SELECT coalesce(jsonb_object_agg(tipo || ':' || id_origem::text,
                                     to_jsonb(t) - 'atualizado_em' || jsonb_build_object('id_proposta', c.id_proposta)), '{}')
                             FROM public.fin_tg_movimentos t
                             LEFT JOIN public.fin_tg_convenios c ON c.numero = t.numero_convenio)
  END;
$$;

CREATE OR REPLACE FUNCTION public.fin_tg_registrar_diferencas(p_sinc uuid, p_entidade text, p_ant jsonb, p_novo jsonb)
RETURNS integer
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_total integer := 0;
  v_n integer;
BEGIN
  -- novo: chave que não existia
  INSERT INTO public.fin_tg_mudancas (sincronizacao_id, entidade, chave, id_proposta, numero_convenio, tipo, dados)
  SELECT p_sinc, p_entidade, n.chave, (n.linha->>'id_proposta')::bigint,
         CASE WHEN p_entidade = 'convenio' THEN n.chave ELSE n.linha->>'numero_convenio' END, 'novo', n.linha
    FROM jsonb_each(p_novo) AS n(chave, linha)
   WHERE NOT p_ant ? n.chave;
  GET DIAGNOSTICS v_n = ROW_COUNT; v_total := v_total + v_n;

  -- removido: chave que sumiu do Transferegov
  INSERT INTO public.fin_tg_mudancas (sincronizacao_id, entidade, chave, id_proposta, numero_convenio, tipo, dados)
  SELECT p_sinc, p_entidade, a.chave, (a.linha->>'id_proposta')::bigint,
         CASE WHEN p_entidade = 'convenio' THEN a.chave ELSE a.linha->>'numero_convenio' END, 'removido', a.linha
    FROM jsonb_each(p_ant) AS a(chave, linha)
   WHERE NOT p_novo ? a.chave;
  GET DIAGNOSTICS v_n = ROW_COUNT; v_total := v_total + v_n;

  -- alterado: um registro por campo que mudou
  INSERT INTO public.fin_tg_mudancas (sincronizacao_id, entidade, chave, id_proposta, numero_convenio, tipo, campo,
                                      valor_anterior, valor_novo)
  SELECT p_sinc, p_entidade, n.chave, (n.linha->>'id_proposta')::bigint,
         CASE WHEN p_entidade = 'convenio' THEN n.chave ELSE n.linha->>'numero_convenio' END, 'alterado', c.campo,
         a.linha->>c.campo, n.linha->>c.campo
    FROM jsonb_each(p_novo) AS n(chave, linha)
    JOIN jsonb_each(p_ant) AS a(chave, linha) ON a.chave = n.chave
   CROSS JOIN LATERAL (SELECT k AS campo FROM jsonb_object_keys(n.linha || a.linha) AS k) c
   WHERE (a.linha -> c.campo) IS DISTINCT FROM (n.linha -> c.campo);
  GET DIAGNOSTICS v_n = ROW_COUNT; v_total := v_total + v_n;

  RETURN v_total;
END;
$$;

REVOKE ALL ON FUNCTION public.fin_tg_mapa(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fin_tg_registrar_diferencas(uuid, text, jsonb, jsonb) FROM PUBLIC, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 3. Carga com registro das mudanças
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fin_tg_carregar(
  p_cnpj text,
  p_data_carga timestamptz,
  p_dados jsonb,
  p_forcar boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cadastrado text;
  v_propostas integer;
  v_emendas integer;
  v_convenios integer;
  v_movimentos integer;
  v_sinc uuid;
  v_mudancas integer := 0;
  v_tinha boolean;
  v_ant_propostas jsonb;
  v_ant_emendas jsonb;
  v_ant_convenios jsonb;
  v_ant_movimentos jsonb;
BEGIN
  IF p_cnpj IS NULL OR p_cnpj !~ '^[0-9]{14}$' THEN
    RAISE EXCEPTION 'CNPJ inválido' USING ERRCODE = '22023';
  END IF;
  SELECT regexp_replace(valor, '\D', '', 'g') INTO v_cadastrado FROM public.dados_oficiais WHERE chave = 'cnpj';
  IF v_cadastrado IS DISTINCT FROM p_cnpj THEN
    RAISE EXCEPTION 'CNPJ diferente do cadastrado na Configuração do cliente' USING ERRCODE = '22023';
  END IF;
  IF jsonb_typeof(p_dados) <> 'object'
     OR jsonb_typeof(coalesce(p_dados->'propostas', '[]')) <> 'array'
     OR jsonb_typeof(coalesce(p_dados->'emendas', '[]')) <> 'array'
     OR jsonb_typeof(coalesce(p_dados->'convenios', '[]')) <> 'array'
     OR jsonb_typeof(coalesce(p_dados->'movimentos', '[]')) <> 'array' THEN
    RAISE EXCEPTION 'Dados em formato inesperado' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(coalesce(p_dados->'propostas', '[]')) e
              WHERE e->>'cnpj_proponente' IS DISTINCT FROM p_cnpj) THEN
    RAISE EXCEPTION 'Proposta de outro proponente' USING ERRCODE = '22023';
  END IF;
  IF jsonb_array_length(coalesce(p_dados->'propostas', '[]')) = 0 AND NOT p_forcar
     AND EXISTS (SELECT 1 FROM public.fin_tg_propostas) THEN
    RAISE EXCEPTION 'Nenhuma proposta veio e o espelho tem propostas: confira a leitura ou use p_forcar' USING ERRCODE = '22023';
  END IF;

  -- Foto do espelho antes da troca, para registrar o que mudou (a primeira carga não registra nada)
  v_tinha := EXISTS (SELECT 1 FROM public.fin_tg_propostas);
  v_ant_propostas := public.fin_tg_mapa('proposta');
  v_ant_emendas := public.fin_tg_mapa('emenda');
  v_ant_convenios := public.fin_tg_mapa('convenio');
  v_ant_movimentos := public.fin_tg_mapa('movimento');

  -- O espelho inteiro é trocado (WHERE true: o pg_safeupdate recusa DELETE sem WHERE): o que sumiu do Transferegov sai daqui também (filhas saem em cascata)
  DELETE FROM public.fin_tg_propostas WHERE true;

  INSERT INTO public.fin_tg_propostas (
    id_proposta, numero, ano, data_proposta, cnpj_proponente, orgao_superior, orgao, modalidade, objeto, situacao,
    situacao_projeto_basico, inicio_vigencia, fim_vigencia, valor_global, valor_repasse, valor_contrapartida,
    banco, agencia, conta)
  SELECT id_proposta, numero, ano, data_proposta, cnpj_proponente, orgao_superior, orgao, modalidade, objeto, situacao,
         situacao_projeto_basico, inicio_vigencia, fim_vigencia, valor_global, valor_repasse, valor_contrapartida,
         banco, agencia, conta
    FROM jsonb_populate_recordset(NULL::public.fin_tg_propostas, coalesce(p_dados->'propostas', '[]'));
  GET DIAGNOSTICS v_propostas = ROW_COUNT;

  INSERT INTO public.fin_tg_emendas (
    id_proposta, numero_emenda, programa_emenda, parlamentar, tipo_parlamentar, qualificacao_proponente, impositiva,
    cnpj_beneficiario, valor_repasse_proposta, valor_repasse_emenda)
  SELECT id_proposta, numero_emenda, programa_emenda, parlamentar, tipo_parlamentar, qualificacao_proponente, impositiva,
         cnpj_beneficiario, valor_repasse_proposta, valor_repasse_emenda
    FROM jsonb_populate_recordset(NULL::public.fin_tg_emendas, coalesce(p_dados->'emendas', '[]'));
  GET DIAGNOSTICS v_emendas = ROW_COUNT;

  INSERT INTO public.fin_tg_convenios (
    numero, id_proposta, situacao, subsituacao, situacao_publicacao, instrumento_ativo, assinado, numero_processo,
    ug_emitente, data_assinatura, data_publicacao, inicio_vigencia, fim_vigencia, fim_vigencia_original,
    data_limite_prestacao_contas, dias_prestacao_contas, qtd_aditivos, qtd_prorrogacoes, valor_global, valor_repasse,
    valor_contrapartida, valor_empenhado, valor_desembolsado, saldo_reman_tesouro, saldo_reman_convenente,
    rendimento_aplicacao, ingresso_contrapartida, saldo_conta, valor_global_original)
  SELECT numero, id_proposta, situacao, subsituacao, situacao_publicacao, instrumento_ativo, assinado, numero_processo,
         ug_emitente, data_assinatura, data_publicacao, inicio_vigencia, fim_vigencia, fim_vigencia_original,
         data_limite_prestacao_contas, dias_prestacao_contas, qtd_aditivos, qtd_prorrogacoes, valor_global, valor_repasse,
         valor_contrapartida, valor_empenhado, valor_desembolsado, saldo_reman_tesouro, saldo_reman_convenente,
         rendimento_aplicacao, ingresso_contrapartida, saldo_conta, valor_global_original
    FROM jsonb_populate_recordset(NULL::public.fin_tg_convenios, coalesce(p_dados->'convenios', '[]'));
  GET DIAGNOSTICS v_convenios = ROW_COUNT;

  INSERT INTO public.fin_tg_movimentos (
    tipo, id_origem, numero_convenio, numero, data, valor, situacao, descricao, indicacao, natureza_despesa, ug_emitente)
  SELECT tipo, id_origem, numero_convenio, numero, data, valor, situacao, descricao, indicacao, natureza_despesa, ug_emitente
    FROM jsonb_populate_recordset(NULL::public.fin_tg_movimentos, coalesce(p_dados->'movimentos', '[]'));
  GET DIAGNOSTICS v_movimentos = ROW_COUNT;

  INSERT INTO public.fin_tg_sincronizacoes (data_carga, cnpj, propostas, emendas, convenios, movimentos)
  VALUES (p_data_carga, p_cnpj, v_propostas, v_emendas, v_convenios, v_movimentos)
  RETURNING id INTO v_sinc;

  IF v_tinha THEN
    v_mudancas := public.fin_tg_registrar_diferencas(v_sinc, 'proposta', v_ant_propostas, public.fin_tg_mapa('proposta'))
                + public.fin_tg_registrar_diferencas(v_sinc, 'emenda', v_ant_emendas, public.fin_tg_mapa('emenda'))
                + public.fin_tg_registrar_diferencas(v_sinc, 'convenio', v_ant_convenios, public.fin_tg_mapa('convenio'))
                + public.fin_tg_registrar_diferencas(v_sinc, 'movimento', v_ant_movimentos, public.fin_tg_mapa('movimento'));
  END IF;
  UPDATE public.fin_tg_sincronizacoes SET mudancas = v_mudancas WHERE id = v_sinc;

  RETURN jsonb_build_object('propostas', v_propostas, 'emendas', v_emendas, 'convenios', v_convenios,
                            'movimentos', v_movimentos, 'mudancas', v_mudancas);
END;
$$;

COMMENT ON FUNCTION public.fin_tg_carregar(text, timestamptz, jsonb, boolean) IS
  'Troca o espelho do Transferegov (propostas, emendas, convênios e movimentos) numa transação e registra em fin_tg_mudancas o que mudou desde a carga anterior. Só a service role executa.';

REVOKE ALL ON FUNCTION public.fin_tg_carregar(text, timestamptz, jsonb, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fin_tg_carregar(text, timestamptz, jsonb, boolean) TO service_role;

-- ----------------------------------------------------------------------------
-- 4. Quem pode pedir uma carga na hora (botão "Atualizar agora")
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.pode_atualizar_convenios_federais()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(auth.uid() IS NOT NULL
                  AND public.perfil_ativo_atual()
                  AND public.can_access_module(auth.uid(), 'financeiro')
                  AND public.has_permission_code(auth.uid(), 'financeiro.convenios.visualizar'), false);
$$;

COMMENT ON FUNCTION public.pode_atualizar_convenios_federais() IS
  'Verdadeiro se o usuário logado tem perfil ativo, o módulo financeiro e financeiro.convenios.visualizar (Edge Function transferegov-atualizar).';

REVOKE ALL ON FUNCTION public.pode_atualizar_convenios_federais() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pode_atualizar_convenios_federais() TO authenticated;

-- ----------------------------------------------------------------------------
-- 5. RLS (gerada por scripts/db/gerar-rls.mjs a partir de supabase/baseline/rls/mapa.csv)
-- ----------------------------------------------------------------------------
-- fin_tg_mudancas  [trilha: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_tg_mudancas;
CREATE POLICY "rls_select" ON public.fin_tg_mudancas FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')) AND public.has_permission_code(auth.uid(), 'financeiro.convenios.visualizar'));

