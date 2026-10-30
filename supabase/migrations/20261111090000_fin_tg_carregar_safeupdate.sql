-- Convênios federais (Transferegov): fin_tg_carregar com DELETE qualificado.
--
-- A primeira carga em produção (30/10/2026) falhou com 21000 ("DELETE requires a WHERE clause"): o Supabase liga a
-- extensão pg_safeupdate nas conexões do PostgREST, que recusa DELETE sem WHERE mesmo dentro de função SECURITY
-- DEFINER. A troca do espelho continua inteira (WHERE true), na mesma transação. Nada mais muda na função.
-- Spec: docs/superpowers/specs/2026-10-29-convenios-federais-transferegov-design.md

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
  VALUES (p_data_carga, p_cnpj, v_propostas, v_emendas, v_convenios, v_movimentos);

  RETURN jsonb_build_object('propostas', v_propostas, 'emendas', v_emendas, 'convenios', v_convenios,
                            'movimentos', v_movimentos);
END;
$$;

COMMENT ON FUNCTION public.fin_tg_carregar(text, timestamptz, jsonb, boolean) IS
  'Troca o espelho do Transferegov (propostas, emendas, convênios e movimentos) numa transação. Só a service role executa.';

REVOKE ALL ON FUNCTION public.fin_tg_carregar(text, timestamptz, jsonb, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fin_tg_carregar(text, timestamptz, jsonb, boolean) TO service_role;
