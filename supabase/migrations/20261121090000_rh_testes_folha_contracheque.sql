-- ============================================================================
-- RH — correções do teste de 06/11/2026 (entrega 1: folha e contracheque)
-- ============================================================================
-- Relatório "RH IDJuv: relatório de testes e bugs", prioridade 1 (docs/planejamento/ROADMAP.md):
--
--   item 1  falta em 02/11 (Finados, antes da admissão em 07/11) aceita e descontada: o proporcional já pagava
--           24/30 e a folha ainda tirava 1/30. Agora:
--             * rh_dia_nao_util(data): nome do feriado/ponto facultativo da Configuração de Frequência
--               (dias_nao_uteis ativo, na data ou recorrente no dia e mês) que não conta como dia de trabalho;
--             * trigger registros_ponto_validar_falta: recusa falta antes da admissão (ou do primeiro exercício)
--               e em dia não útil (P0001, mensagem para a tela);
--             * folha_montar_ficha: falta fora dos dias pagos ou em dia não útil não desconta (só retira do total do
--               resumo mensal) e a ficha ganha a inconsistência falta_fora_dos_dias_pagos_ignorada.
--   item 4  lotação: a ficha passa a guardar a lotação vigente no fim da competência (lotacao_vigente), com a unidade
--           do provimento como reserva; sem nenhuma, unidade_nome fica nulo (antes " - ").
--   item 6  sem alíquota patronal ou de RAT, a ficha de quem contribui para o regime geral ganha a inconsistência
--           aliquota_patronal_ou_rat_nao_configurada (o processamento continua servindo de prévia).
--   item 7  fechar_folha: ficha com inconsistência de tributo (tabela de INSS/IRRF ausente, dedução por dependente,
--           desconto simplificado ou redução do IRRF, alíquota patronal/RAT) bloqueia sempre; as demais exigem
--           justificativa de 20+ caracteres, que vai para o protocolo com a lista. A resposta traz a lista em
--           "inconsistencias". A folha importada do SIGRH não tem ficha com inconsistência e fecha como antes.
--
-- Corpos iguais aos do baseline (schema/01_pre_data.sql e overlay/18_funcoes_rpc.sql). Idempotente.
-- ============================================================================

SET lock_timeout = '10s';

CREATE OR REPLACE FUNCTION public.rh_dia_nao_util(p_data date) RETURNS text
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  SELECT d.nome::text
    FROM public.dias_nao_uteis d
   WHERE coalesce(d.ativo, true) AND NOT coalesce(d.conta_frequencia, false)
     AND (d.data = p_data
          OR (coalesce(d.recorrente, false) AND d.mes_recorrente = EXTRACT(MONTH FROM p_data)::int
              AND d.dia_recorrente = EXTRACT(DAY FROM p_data)::int))
   ORDER BY (d.data = p_data) DESC
   LIMIT 1;
$$;

COMMENT ON FUNCTION public.rh_dia_nao_util(date) IS 'Nome do feriado/ponto facultativo (dias_nao_uteis ativo que não conta frequência) na data, ou nulo';

CREATE OR REPLACE FUNCTION public.folha_inconsistencias_bloqueantes() RETURNS text[]
    LANGUAGE sql IMMUTABLE
    AS $$
  SELECT ARRAY['tabela_inss_ausente', 'tabela_irrf_ausente', 'deducao_dependente_nao_configurada',
               'desconto_simplificado_irrf_nao_configurado', 'reducao_irrf_nao_configurada',
               'aliquota_patronal_ou_rat_nao_configurada']::text[];
$$;

COMMENT ON FUNCTION public.folha_inconsistencias_bloqueantes() IS 'Inconsistências da ficha que impedem fechar a folha (tributo calculado sem tabela ou alíquota)';

CREATE OR REPLACE FUNCTION public.registros_ponto_validar_falta() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  v_inicio date;
  v_feriado text;
BEGIN
  IF NEW.tipo IS DISTINCT FROM 'falta' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.tipo = 'falta' AND OLD.data = NEW.data THEN RETURN NEW; END IF;

  SELECT coalesce(s.data_admissao,
                  (SELECT min(coalesce(p.data_exercicio, p.data_nomeacao)) FROM public.provimentos p WHERE p.servidor_id = s.id))
    INTO v_inicio FROM public.servidores s WHERE s.id = NEW.servidor_id;
  IF v_inicio IS NOT NULL AND NEW.data < v_inicio THEN
    RAISE EXCEPTION 'Falta em % recusada: é anterior à admissão do servidor (%).',
      to_char(NEW.data, 'DD/MM/YYYY'), to_char(v_inicio, 'DD/MM/YYYY') USING ERRCODE = 'P0001';
  END IF;

  v_feriado := public.rh_dia_nao_util(NEW.data);
  IF v_feriado IS NOT NULL THEN
    RAISE EXCEPTION 'Falta em % recusada: o dia não é útil (%).', to_char(NEW.data, 'DD/MM/YYYY'), v_feriado
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.registros_ponto_validar_falta() IS 'Trigger: falta só em dia útil e a partir da admissão (teste do RH de 06/11/2026, item 1)';

DROP TRIGGER IF EXISTS trg_registros_ponto_validar_falta ON public.registros_ponto;
CREATE TRIGGER trg_registros_ponto_validar_falta BEFORE INSERT OR UPDATE ON public.registros_ponto
  FOR EACH ROW EXECUTE FUNCTION public.registros_ponto_validar_falta();

REVOKE EXECUTE ON FUNCTION public.registros_ponto_validar_falta() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rh_dia_nao_util(date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rh_dia_nao_util(date) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.folha_inconsistencias_bloqueantes() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.folha_inconsistencias_bloqueantes() TO authenticated;

CREATE OR REPLACE FUNCTION public.folha_montar_ficha(p_servidor_id uuid, p_provimento_id uuid, p_tipo text, p_d1 date, p_d2 date, p_manuais jsonb, p_tabelas jsonb) RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_srv record;
  v_prv record;
  v_venc numeric;
  v_itens jsonb := '[]'::jsonb;
  v_inc jsonb := '[]'::jsonb;
  v_ano int := EXTRACT(YEAR FROM p_d2)::int;
  v_ini date; v_fim date; v_dias int; v_ini_pago date; v_fim_pago date; v_venc_prop numeric := 0;
  v_faltas int := 0; v_faltas_mes int := 0; v_faltas_fora int := 0; v_dias_lic int := 0; v_dias_ces int := 0; v_rest int;
  v_d_falta numeric := 0; v_d_lic numeric := 0; v_d_ces numeric := 0; v_terco numeric := 0; v_abono numeric := 0;
  v_nferias int := 0;
  v_man jsonb; v_man_val numeric; v_man_inss boolean; v_man_irrf boolean;
  v_man_prov_inss numeric := 0; v_man_prov_irrf numeric := 0; v_man_prov numeric := 0; v_man_desc numeric := 0;
  v_liq_dias numeric := 0;
  v_base_inss numeric := 0; v_inss numeric := 0; v_qdep int := 0; v_ded_unit numeric; v_ded numeric := 0;
  v_base_irrf numeric := 0; v_irrf numeric := 0;
  v_consig numeric := 0; v_pensao numeric := 0; v_c record; v_p record; v_base_pensao numeric; v_val numeric;
  v_prov numeric := 0; v_desc numeric := 0; v_liq numeric;
  v_teto numeric;
  v_avos int; v_v13 numeric; v_adiant numeric := 0;
  v_adm date; v_pa_ini date; v_meses int; v_resto int; v_avos_fer int; v_dias_prop numeric; v_dias_goz numeric; v_dias_ind numeric;
  v_val_fer numeric; v_pa_completos int; v_dias_reg numeric;
  v_tem_inss boolean := coalesce((p_tabelas ->> 'inss')::boolean, false);
  v_tem_irrf boolean := coalesce((p_tabelas ->> 'irrf')::boolean, false);
  v_ded_cfg numeric := nullif(p_tabelas ->> 'ded_dep', '')::numeric;
  v_rpps boolean := false;
  v_rend_irrf numeric := 0; v_irrf_r jsonb; v_irrf_ant numeric; v_iter int := 0; v_pens_itens jsonb := '[]'::jsonb;
  v_ref_irrf text;
BEGIN
  SELECT s.data_admissao, s.banco_codigo, s.banco_conta, s.possui_vinculo_externo, s.contribui_rpps_origem, s.rpps_origem_inicio
    INTO v_srv FROM public.servidores s WHERE s.id = p_servidor_id;
  -- opção pelo regime próprio do órgão de origem (efetivo de outro ente em cargo em comissão): sem INSS aqui
  v_rpps := coalesce(v_srv.contribui_rpps_origem, false) AND coalesce(v_srv.rpps_origem_inicio <= p_d2, true);
  SELECT p.*, coalesce(p.data_exercicio, p.data_nomeacao) AS inicio, public.vencimento_cargo_em(c.id, p_d2) AS venc
    INTO v_prv
    FROM public.provimentos p JOIN public.cargos c ON c.id = p.cargo_id
   WHERE p.id = p_provimento_id;
  v_venc := v_prv.venc;
  -- reajuste com vigência no meio da competência: o mês sai com o valor novo inteiro; a conferência decide a proporção
  IF EXISTS (SELECT 1 FROM public.cargo_vencimentos cv
              WHERE cv.cargo_id = v_prv.cargo_id AND cv.vigencia_inicio > p_d1 AND cv.vigencia_inicio <= p_d2) THEN
    v_inc := v_inc || jsonb_build_array('vencimento_alterado_na_competencia');
  END IF;
  v_ini := v_prv.inicio;
  v_fim := coalesce(v_prv.data_encerramento, p_d2);

  IF v_srv.banco_codigo IS NULL OR v_srv.banco_conta IS NULL THEN
    v_inc := v_inc || jsonb_build_array('sem_dados_bancarios');
  END IF;
  IF NOT v_tem_inss AND NOT v_rpps THEN v_inc := v_inc || jsonb_build_array('tabela_inss_ausente'); END IF;
  IF coalesce(v_srv.possui_vinculo_externo, false) AND NOT v_rpps THEN
    v_inc := v_inc || jsonb_build_array('regime_previdenciario_a_confirmar');
  END IF;
  IF NOT v_tem_irrf THEN v_inc := v_inc || jsonb_build_array('tabela_irrf_ausente'); END IF;

  -- lançamentos manuais do servidor (guardados antes de refazer as fichas)
  FOR v_man IN SELECT e FROM jsonb_array_elements(coalesce(p_manuais, '[]'::jsonb)) e
                WHERE (e ->> 'servidor_id')::uuid = p_servidor_id LOOP
    v_man_val := coalesce((v_man ->> 'valor')::numeric, 0);
    v_man_inss := true; v_man_irrf := true;
    IF (v_man ->> 'rubrica_id') IS NOT NULL THEN
      SELECT coalesce(r.incide_inss, true), coalesce(r.incide_irrf, true) INTO v_man_inss, v_man_irrf
        FROM public.rubricas r WHERE r.id = (v_man ->> 'rubrica_id')::uuid;
    END IF;
    v_itens := v_itens || jsonb_build_array(public.folha_item(v_man ->> 'descricao', v_man ->> 'tipo', v_man_val,
                  v_man ->> 'referencia', nullif(v_man ->> 'base_calculo', '')::numeric,
                  nullif(v_man ->> 'percentual', '')::numeric, 'manual', nullif(v_man ->> 'rubrica_id', '')::uuid));
    IF v_man ->> 'tipo' = 'provento' THEN
      v_man_prov := v_man_prov + v_man_val;
      IF v_man_inss THEN v_man_prov_inss := v_man_prov_inss + v_man_val; END IF;
      IF v_man_irrf THEN v_man_prov_irrf := v_man_prov_irrf + v_man_val; END IF;
    ELSE
      v_man_desc := v_man_desc + v_man_val;
    END IF;
  END LOOP;

  -- ===================================================================== MENSAL
  IF p_tipo = 'mensal' THEN
    v_dias := public.folha_dias_comerciais(v_ini, v_fim, p_d1, p_d2);
    v_venc_prop := round(v_venc / 30 * v_dias, 2);
    v_ini_pago := greatest(v_ini, p_d1);
    v_fim_pago := least(v_fim, p_d2);
    v_itens := jsonb_build_array(public.folha_item('Vencimento', 'provento', v_venc_prop, v_dias || '/30 dias', v_venc)) || v_itens;

    SELECT fm.dias_falta INTO v_faltas FROM public.frequencia_mensal fm
     WHERE fm.servidor_id = p_servidor_id AND fm.ano = v_ano AND fm.mes = EXTRACT(MONTH FROM p_d2)::int;
    IF NOT FOUND THEN v_inc := v_inc || jsonb_build_array('sem_frequencia_do_mes'); END IF;
    v_faltas := coalesce(v_faltas, 0);
    -- falta lançada fora dos dias pagos (antes do exercício, depois do encerramento) ou em dia não útil não desconta:
    -- o proporcional já tirou esses dias. Só retira; o resumo do mês continua sendo a fonte do total.
    SELECT count(*), count(*) FILTER (WHERE rp.data < v_ini_pago OR rp.data > v_fim_pago OR public.rh_dia_nao_util(rp.data) IS NOT NULL)
      INTO v_faltas_mes, v_faltas_fora
      FROM public.registros_ponto rp
     WHERE rp.servidor_id = p_servidor_id AND rp.tipo = 'falta' AND rp.data BETWEEN p_d1 AND p_d2;
    IF v_faltas_fora > 0 AND v_faltas > 0 THEN
      v_faltas := greatest(v_faltas - v_faltas_fora, 0);
      v_inc := v_inc || jsonb_build_array('falta_fora_dos_dias_pagos_ignorada');
    END IF;

    SELECT coalesce(sum(greatest(0, least(coalesce(l.data_fim, v_fim_pago), v_fim_pago)
                                    - greatest(l.data_inicio, v_ini_pago) + 1)), 0)::int
      INTO v_dias_lic
      FROM public.licencas_afastamentos l
     WHERE l.servidor_id = p_servidor_id AND l.status IN ('ativa', 'prorrogada', 'encerrada')
       AND NOT public.afastamento_remunerado(l.tipo_afastamento::text, l.tipo_licenca::text, p_d2);

    SELECT coalesce(sum(greatest(0, least(coalesce(c.data_retorno, c.data_fim, v_fim_pago), v_fim_pago)
                                    - greatest(c.data_inicio, v_ini_pago) + 1)), 0)::int
      INTO v_dias_ces
      FROM public.cessoes c
     WHERE c.servidor_id = p_servidor_id AND c.tipo = 'saida' AND c.onus = 'destino'
       AND c.data_inicio <= v_fim_pago AND coalesce(c.data_retorno, c.data_fim, v_fim_pago) >= v_ini_pago;
    IF EXISTS (SELECT 1 FROM public.cessoes c WHERE c.servidor_id = p_servidor_id AND c.tipo = 'saida' AND c.onus IS NULL
                  AND c.data_inicio <= v_fim_pago AND coalesce(c.data_retorno, c.data_fim, v_fim_pago) >= v_ini_pago) THEN
      v_inc := v_inc || jsonb_build_array('onus_da_cessao_nao_informado');
    END IF;

    -- os dias descontados nunca passam dos dias pagos
    v_rest := v_dias;
    v_faltas := least(v_faltas, v_rest); v_rest := v_rest - v_faltas;
    v_dias_lic := least(v_dias_lic, v_rest); v_rest := v_rest - v_dias_lic;
    v_dias_ces := least(v_dias_ces, v_rest);
    v_d_falta := round(v_venc / 30 * v_faltas, 2);
    v_d_lic := round(v_venc / 30 * v_dias_lic, 2);
    v_d_ces := round(v_venc / 30 * v_dias_ces, 2);
    IF v_faltas > 0 THEN
      v_itens := v_itens || jsonb_build_array(public.folha_item('Desconto de faltas', 'desconto', v_d_falta, v_faltas || ' dia(s)', v_venc));
    END IF;
    IF v_dias_lic > 0 THEN
      v_itens := v_itens || jsonb_build_array(public.folha_item('Desconto de licença/afastamento sem remuneração', 'desconto', v_d_lic, v_dias_lic || ' dia(s)', v_venc));
    END IF;
    IF v_dias_ces > 0 THEN
      v_itens := v_itens || jsonb_build_array(public.folha_item('Desconto de cessão com ônus no destino', 'desconto', v_d_ces, v_dias_ces || ' dia(s)', v_venc));
    END IF;

    -- férias iniciadas no mês: 1/3 constitucional (tributável só no IRRF) e abono pecuniário (indenizatório)
    SELECT coalesce(sum(round(v_venc / 30 * f.dias_gozados / 3.0, 2)), 0),
           coalesce(sum(round(v_venc / 30 * coalesce(f.dias_abono, 0) * 4.0 / 3.0, 2)), 0), count(*)
      INTO v_terco, v_abono, v_nferias
      FROM public.ferias_servidor f
     WHERE f.servidor_id = p_servidor_id AND f.data_inicio BETWEEN p_d1 AND p_d2
       AND f.status IN ('programada', 'em_gozo', 'concluida');
    IF v_terco > 0 THEN
      v_itens := v_itens || jsonb_build_array(public.folha_item('Adicional de 1/3 de férias', 'provento', v_terco, NULL, v_venc));
    END IF;
    IF v_abono > 0 THEN
      v_itens := v_itens || jsonb_build_array(public.folha_item('Abono pecuniário de férias (com 1/3)', 'provento', v_abono, NULL, v_venc));
    END IF;

    v_liq_dias := v_venc_prop - v_d_falta - v_d_lic - v_d_ces;
    v_base_inss := greatest(v_liq_dias + v_man_prov_inss, 0);
    IF v_tem_inss AND NOT v_rpps THEN v_inss := public.calcular_inss_servidor(v_base_inss, p_d2); END IF;

    v_qdep := public.count_dependentes_irrf(p_servidor_id, p_d2);
    IF v_qdep > 0 AND v_ded_cfg IS NULL THEN
      v_inc := v_inc || jsonb_build_array('deducao_dependente_nao_configurada');
    END IF;
    v_ded := v_qdep * coalesce(v_ded_cfg, 0);
    v_rend_irrf := greatest(v_liq_dias + v_terco + v_man_prov_irrf, 0);

    -- pensão alimentícia (percentual é número "30" = 30%; base líquida = proventos do mês − faltas − INSS − IRRF).
    -- A pensão judicial é dedutível do IRRF (Lei 9.250/1995, art. 4º, II) e, sobre o líquido, depende do IRRF:
    -- calcula pensão e IRRF de novo até o IRRF parar de mudar
    LOOP
      v_pensao := 0; v_pens_itens := '[]'::jsonb;
      FOR v_p IN SELECT * FROM public.pensoes_alimenticias pa
                  WHERE pa.servidor_id = p_servidor_id AND coalesce(pa.ativo, true) AND pa.data_inicio <= p_d2
                    AND (pa.data_fim IS NULL OR pa.data_fim >= p_d1) ORDER BY pa.prioridade NULLS LAST LOOP
        IF lower(v_p.tipo_calculo) LIKE 'perc%' THEN
          v_base_pensao := CASE WHEN lower(coalesce(v_p.base_calculo, '')) = 'bruto'
                                THEN v_liq_dias + v_terco + v_man_prov
                                ELSE greatest(v_liq_dias + v_terco + v_man_prov - v_inss - v_irrf, 0) END;
          v_val := round(v_base_pensao * coalesce(v_p.percentual, 0) / 100, 2);
        ELSE
          v_base_pensao := NULL;
          v_val := coalesce(v_p.valor_fixo, 0);
        END IF;
        v_pensao := v_pensao + v_val;
        v_pens_itens := v_pens_itens || jsonb_build_array(public.folha_item('Pensão alimentícia — ' || v_p.beneficiario_nome, 'desconto', v_val,
          NULL, v_base_pensao, CASE WHEN lower(v_p.tipo_calculo) LIKE 'perc%' THEN v_p.percentual END));
      END LOOP;

      v_irrf_ant := v_irrf;
      IF v_tem_irrf THEN
        v_irrf_r := public.calcular_irrf_mensal(v_rend_irrf, v_inss + v_ded + v_pensao, p_d2);
        v_irrf := (v_irrf_r ->> 'irrf')::numeric;
      END IF;
      v_iter := v_iter + 1;
      EXIT WHEN v_irrf = v_irrf_ant OR v_iter >= 20;
    END LOOP;

    IF v_tem_irrf THEN
      v_base_irrf := (v_irrf_r ->> 'base')::numeric;
      IF NOT (v_irrf_r ->> 'simplificado_configurado')::boolean THEN
        v_inc := v_inc || jsonb_build_array('desconto_simplificado_irrf_nao_configurado');
      END IF;
      IF NOT (v_irrf_r ->> 'reducao_configurada')::boolean THEN
        v_inc := v_inc || jsonb_build_array('reducao_irrf_nao_configurada');
      END IF;
    ELSE
      v_base_irrf := greatest(v_rend_irrf - v_inss - v_ded - v_pensao, 0);
    END IF;

    IF v_inss > 0 THEN
      v_itens := v_itens || jsonb_build_array(public.folha_item('INSS / previdência do servidor', 'desconto', v_inss, NULL, v_base_inss));
    END IF;
    IF v_irrf > 0 THEN
      v_ref_irrf := v_qdep || ' dependente(s)'
        || CASE WHEN (v_irrf_r ->> 'simplificado')::boolean THEN '; desconto simplificado' ELSE '' END
        || CASE WHEN (v_irrf_r ->> 'reducao')::numeric > 0 THEN '; redução Lei 15.270: ' || (v_irrf_r ->> 'reducao') ELSE '' END;
      v_itens := v_itens || jsonb_build_array(public.folha_item('IRRF', 'desconto', v_irrf, v_ref_irrf, v_base_irrf));
    END IF;

    -- consignações ativas na competência
    FOR v_c IN SELECT * FROM public.consignacoes c
                WHERE c.servidor_id = p_servidor_id AND coalesce(c.ativo, true) AND NOT coalesce(c.suspenso, false)
                  AND NOT coalesce(c.quitado, false) AND c.data_inicio <= p_d2 AND (c.data_fim IS NULL OR c.data_fim >= p_d1)
                  AND coalesce(c.parcelas_pagas, 0) < c.total_parcelas LOOP
      v_consig := v_consig + v_c.valor_parcela;
      v_itens := v_itens || jsonb_build_array(public.folha_item(
        'Consignação — ' || v_c.consignataria_nome, 'desconto', v_c.valor_parcela,
        (coalesce(v_c.parcelas_pagas, 0) + 1) || '/' || v_c.total_parcelas));
    END LOOP;

    v_itens := v_itens || v_pens_itens;

    v_prov := v_venc_prop + v_terco + v_abono + v_man_prov;
    v_desc := v_d_falta + v_d_lic + v_d_ces + v_inss + v_irrf + v_consig + v_pensao + v_man_desc;

  -- ================================================================== 13º SALÁRIO
  ELSIF p_tipo IN ('13_1a_parcela', '13_2a_parcela') THEN
    v_avos := public.folha_avos_13(v_ini, least(coalesce(v_prv.data_encerramento, make_date(v_ano, 12, 31)), make_date(v_ano, 12, 31)), v_ano);
    v_v13 := round(v_venc / 12 * v_avos, 2);
    IF p_tipo = '13_1a_parcela' THEN
      v_prov := round(v_v13 * 0.5, 2);
      v_itens := v_itens || jsonb_build_array(public.folha_item('13º salário — 1ª parcela (adiantamento)', 'provento', v_prov, v_avos || '/12 avos', v_venc));
      v_base_inss := 0; v_base_irrf := 0;
    ELSE
      v_prov := v_v13;
      v_itens := v_itens || jsonb_build_array(public.folha_item('13º salário', 'provento', v_v13, v_avos || '/12 avos', v_venc));
      SELECT coalesce(sum(i.valor), 0) INTO v_adiant
        FROM public.fichas_financeiras f JOIN public.itens_ficha_financeira i ON i.ficha_id = f.id
       WHERE f.servidor_id = p_servidor_id AND f.competencia_ano = v_ano AND f.tipo_folha = '13_1a_parcela'
         AND i.tipo = 'provento';
      IF v_adiant = 0 AND v_avos > 0 THEN v_inc := v_inc || jsonb_build_array('primeira_parcela_do_13_nao_localizada'); END IF;
      v_base_inss := v_v13;
      IF v_tem_inss AND NOT v_rpps THEN v_inss := public.calcular_inss_servidor(v_base_inss, p_d2); END IF;
      v_qdep := public.count_dependentes_irrf(p_servidor_id, p_d2);
      IF v_qdep > 0 AND v_ded_cfg IS NULL THEN v_inc := v_inc || jsonb_build_array('deducao_dependente_nao_configurada'); END IF;
      v_ded := v_qdep * coalesce(v_ded_cfg, 0);
      v_base_irrf := greatest(v_v13 - v_inss - v_ded, 0);
      IF v_tem_irrf THEN v_irrf := public.calcular_irrf(v_base_irrf, p_d2); END IF;
      IF v_adiant > 0 THEN
        v_itens := v_itens || jsonb_build_array(public.folha_item('Adiantamento do 13º (1ª parcela)', 'desconto', v_adiant));
      END IF;
      IF v_inss > 0 THEN
        v_itens := v_itens || jsonb_build_array(public.folha_item('INSS sobre o 13º', 'desconto', v_inss, NULL, v_base_inss));
      END IF;
      IF v_irrf > 0 THEN
        v_itens := v_itens || jsonb_build_array(public.folha_item('IRRF sobre o 13º (tributação exclusiva)', 'desconto', v_irrf, v_qdep || ' dependente(s)', v_base_irrf));
      END IF;
    END IF;
    v_prov := v_prov + v_man_prov;
    v_desc := v_adiant + v_inss + v_irrf + v_man_desc;
    v_liq_dias := v_prov;

  -- ===================================================================== RESCISÃO
  ELSE
    v_fim := v_prv.data_encerramento;
    v_avos := public.folha_avos_13(v_ini, v_fim, v_ano);
    v_v13 := round(v_venc / 12 * v_avos, 2);

    -- férias proporcionais: do último aniversário de admissão até o desligamento
    v_adm := coalesce(v_srv.data_admissao, v_ini);
    v_pa_ini := (v_adm + ((EXTRACT(YEAR FROM v_fim) - EXTRACT(YEAR FROM v_adm))::int * interval '1 year'))::date;
    IF v_pa_ini > v_fim THEN v_pa_ini := (v_pa_ini - interval '1 year')::date; END IF;
    v_meses := (EXTRACT(YEAR FROM age(v_fim + 1, v_pa_ini)) * 12 + EXTRACT(MONTH FROM age(v_fim + 1, v_pa_ini)))::int;
    v_resto := EXTRACT(DAY FROM age(v_fim + 1, v_pa_ini))::int;
    v_avos_fer := least(v_meses + CASE WHEN v_resto >= 15 THEN 1 ELSE 0 END, 12);
    v_dias_prop := 30 * v_avos_fer / 12.0;
    SELECT coalesce(sum(f.dias_gozados + coalesce(f.dias_abono, 0)), 0) INTO v_dias_goz
      FROM public.ferias_servidor f
     WHERE f.servidor_id = p_servidor_id AND f.status <> 'cancelada'
       AND f.periodo_aquisitivo_inicio BETWEEN v_pa_ini - 15 AND v_pa_ini + 15;
    v_dias_ind := greatest(v_dias_prop - v_dias_goz, 0);
    v_val_fer := round(v_venc / 30 * v_dias_ind, 2);

    -- períodos aquisitivos completos anteriores sem férias registradas: apurar à parte (não paga sozinho)
    v_pa_completos := greatest((EXTRACT(YEAR FROM age(v_pa_ini, v_adm)))::int, 0);
    SELECT coalesce(sum(f.dias_gozados + coalesce(f.dias_abono, 0)), 0) INTO v_dias_reg
      FROM public.ferias_servidor f
     WHERE f.servidor_id = p_servidor_id AND f.status <> 'cancelada' AND f.periodo_aquisitivo_inicio < v_pa_ini - 15;
    IF v_pa_completos * 30 > v_dias_reg THEN v_inc := v_inc || jsonb_build_array('ferias_vencidas_a_apurar'); END IF;
    v_inc := v_inc || jsonb_build_array('rescisao_conferir_calculo');

    IF v_val_fer > 0 THEN
      v_itens := v_itens || jsonb_build_array(
        public.folha_item('Férias proporcionais (indenizadas)', 'provento', v_val_fer, round(v_dias_ind, 2) || ' dia(s)', v_venc),
        public.folha_item('Adicional de 1/3 sobre férias proporcionais', 'provento', round(v_val_fer / 3.0, 2)));
    END IF;
    IF v_v13 > 0 THEN
      v_itens := v_itens || jsonb_build_array(public.folha_item('13º salário proporcional', 'provento', v_v13, v_avos || '/12 avos', v_venc));
    END IF;
    SELECT coalesce(sum(i.valor), 0) INTO v_adiant
      FROM public.fichas_financeiras f JOIN public.itens_ficha_financeira i ON i.ficha_id = f.id
     WHERE f.servidor_id = p_servidor_id AND f.competencia_ano = v_ano AND f.tipo_folha = '13_1a_parcela' AND i.tipo = 'provento';
    v_base_inss := v_v13;
    IF v_tem_inss AND NOT v_rpps THEN v_inss := public.calcular_inss_servidor(v_base_inss, p_d2); END IF;
    v_qdep := public.count_dependentes_irrf(p_servidor_id, p_d2);
    IF v_qdep > 0 AND v_ded_cfg IS NULL THEN v_inc := v_inc || jsonb_build_array('deducao_dependente_nao_configurada'); END IF;
    v_ded := v_qdep * coalesce(v_ded_cfg, 0);
    v_base_irrf := greatest(v_v13 - v_inss - v_ded, 0);
    IF v_tem_irrf THEN v_irrf := public.calcular_irrf(v_base_irrf, p_d2); END IF;
    IF v_adiant > 0 THEN
      v_itens := v_itens || jsonb_build_array(public.folha_item('Adiantamento do 13º (1ª parcela)', 'desconto', v_adiant));
    END IF;
    IF v_inss > 0 THEN v_itens := v_itens || jsonb_build_array(public.folha_item('INSS sobre o 13º', 'desconto', v_inss, NULL, v_base_inss)); END IF;
    IF v_irrf > 0 THEN v_itens := v_itens || jsonb_build_array(public.folha_item('IRRF sobre o 13º (tributação exclusiva)', 'desconto', v_irrf, NULL, v_base_irrf)); END IF;
    v_prov := v_val_fer + round(v_val_fer / 3.0, 2) + v_v13 + v_man_prov;
    v_desc := v_adiant + v_inss + v_irrf + v_man_desc;
  END IF;

  v_liq := v_prov - v_desc;
  IF v_liq < 0 THEN v_inc := v_inc || jsonb_build_array('liquido_negativo'); END IF;
  SELECT valor INTO v_teto FROM public.parametros_folha
   WHERE tipo_parametro = 'teto_remuneratorio' AND vigencia_inicio <= p_d2 AND (vigencia_fim IS NULL OR vigencia_fim >= p_d2)
   ORDER BY vigencia_inicio DESC LIMIT 1;
  IF v_teto IS NOT NULL AND v_prov > v_teto THEN v_inc := v_inc || jsonb_build_array('acima_do_teto_remuneratorio'); END IF;

  RETURN jsonb_build_object(
    'itens', v_itens, 'inconsistencias', v_inc, 'vencimento_base', v_venc,
    'total_proventos', round(v_prov, 2), 'total_descontos', round(v_desc, 2), 'valor_liquido', round(v_liq, 2),
    'base_inss', round(v_base_inss, 2), 'valor_inss', round(v_inss, 2),
    'base_irrf', round(v_base_irrf, 2), 'valor_irrf', round(v_irrf, 2),
    'quantidade_dependentes', v_qdep, 'valor_deducao_dependentes', round(v_ded, 2));
END;
$$;


CREATE OR REPLACE FUNCTION public.processar_folha_pagamento(p_folha_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_folha record;
  v_tipo text;
  v_d1 date;
  v_d2 date;
  v_ano int;
  v_srv record;
  v_r jsonb;
  v_item jsonb;
  v_ficha_id uuid;
  v_ordem int;
  v_manuais jsonb;
  v_manuais_total int;
  v_manuais_gravados int := 0;
  v_count int := 0;
  v_elegiveis int := 0;
  v_sem_venc int := 0;
  v_errors jsonb := '[]'::jsonb;
  v_avisos jsonb := '[]'::jsonb;
  v_tabelas jsonb;
  v_tem_inss boolean;
  v_tem_irrf boolean;
  v_ded_dep numeric;
  v_protocolo text;
  v_cedidos int;
  v_inicio timestamptz := clock_timestamp();
  v_aliq_patronal numeric;
  v_aliq_rat numeric;
  v_base_patronal numeric;
BEGIN
  IF NOT public.has_permission_code(auth.uid(), 'financeiro.folha.processar') THEN
    RAISE EXCEPTION 'Sem permissão para processar a folha' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_folha FROM public.folhas_pagamento WHERE id = p_folha_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('sucesso', false, 'erro', 'Folha não encontrada', 'servidores_processados', 0);
  END IF;
  IF v_folha.status NOT IN ('aberta', 'processando', 'reaberta', 'previa') THEN
    RETURN jsonb_build_object('sucesso', false, 'erro', 'Folha não está em status que permita processamento. Status atual: ' || v_folha.status, 'servidores_processados', 0);
  END IF;

  v_tipo := v_folha.tipo_folha::text;
  IF v_tipo NOT IN ('mensal', '13_1a_parcela', '13_2a_parcela', 'rescisao') THEN
    RETURN jsonb_build_object('sucesso', false, 'servidores_processados', 0,
      'erro', 'Folha do tipo ' || v_tipo || ' não tem cálculo automático: lance os valores manualmente nas fichas');
  END IF;

  v_ano := v_folha.competencia_ano;
  v_d1 := make_date(v_folha.competencia_ano, v_folha.competencia_mes, 1);
  v_d2 := (v_d1 + interval '1 month - 1 day')::date;

  v_protocolo := public.rh_protocolo_atual('folha',
    format('Processamento da folha %s/%s (%s)', v_folha.competencia_mes, v_folha.competencia_ano, v_tipo),
    NULL, jsonb_build_object('folha_id', p_folha_id, 'tipo_folha', v_tipo));

  -- tabelas e parâmetros necessários: existência na data de referência
  v_tem_inss := EXISTS (SELECT 1 FROM public.tabela_inss t WHERE t.vigencia_inicio <= v_d2 AND (t.vigencia_fim IS NULL OR t.vigencia_fim >= v_d2));
  v_tem_irrf := EXISTS (SELECT 1 FROM public.tabela_irrf t WHERE t.vigencia_inicio <= v_d2 AND (t.vigencia_fim IS NULL OR t.vigencia_fim >= v_d2));
  SELECT valor INTO v_ded_dep FROM public.parametros_folha
   WHERE tipo_parametro = 'deducao_dependente_irrf' AND vigencia_inicio <= v_d2 AND (vigencia_fim IS NULL OR vigencia_fim >= v_d2)
   ORDER BY vigencia_inicio DESC LIMIT 1;
  v_tabelas := jsonb_build_object('inss', v_tem_inss, 'irrf', v_tem_irrf, 'ded_dep', v_ded_dep);
  IF NOT v_tem_inss THEN v_avisos := v_avisos || jsonb_build_array('Tabela de INSS/previdência sem vigência em ' || v_d2 || ': o desconto saiu zero'); END IF;
  IF NOT v_tem_irrf THEN v_avisos := v_avisos || jsonb_build_array('Tabela de IRRF sem vigência em ' || v_d2 || ': o desconto saiu zero'); END IF;
  IF v_ded_dep IS NULL THEN v_avisos := v_avisos || jsonb_build_array('Parâmetro deducao_dependente_irrf não configurado: dependentes não foram deduzidos'); END IF;
  -- parte patronal do regime geral (migração 20261021100000): alíquotas em fração, com vigência
  v_aliq_patronal := public.get_parametro_vigente('inss_patronal_aliquota'::varchar, v_d2);
  v_aliq_rat := public.get_parametro_vigente('rat_fap_aliquota'::varchar, v_d2);
  IF v_aliq_patronal IS NULL THEN v_avisos := v_avisos || jsonb_build_array('Parâmetro inss_patronal_aliquota não configurado: o INSS patronal saiu zero'); END IF;
  IF v_aliq_rat IS NULL THEN v_avisos := v_avisos || jsonb_build_array('Parâmetro rat_fap_aliquota não configurado: o RAT saiu zero'); END IF;

  -- lançamentos manuais das fichas atuais: guardados e devolvidos às fichas novas
  SELECT coalesce(jsonb_agg(jsonb_build_object(
           'servidor_id', f.servidor_id, 'descricao', i.descricao, 'tipo', i.tipo, 'valor', i.valor,
           'rubrica_id', i.rubrica_id, 'referencia', i.referencia, 'base_calculo', i.base_calculo,
           'percentual', i.percentual)), '[]'::jsonb)
    INTO v_manuais
    FROM public.fichas_financeiras f JOIN public.itens_ficha_financeira i ON i.ficha_id = f.id
   WHERE f.folha_id = p_folha_id AND i.origem = 'manual';
  v_manuais_total := jsonb_array_length(v_manuais);

  DELETE FROM public.fichas_financeiras WHERE folha_id = p_folha_id;

  FOR v_srv IN
    SELECT s.id, s.nome_completo, s.banco_codigo, s.banco_nome, s.banco_agencia, s.banco_conta, s.banco_tipo_conta,
           pv.id AS provimento_id, pv.cargo_id, pv.unidade_id, c.nome AS cargo_nome,
           public.vencimento_cargo_em(c.id, v_d2) AS vencimento_base, eo.id AS unidade_id_vigente, eo.nome AS unidade_nome,
           eo.sigla AS unidade_sigla
      FROM public.servidores s
      JOIN LATERAL (
        SELECT p.* FROM public.provimentos p
         WHERE p.servidor_id = s.id AND p.status IN ('ativo', 'suspenso', 'encerrado')
           AND CASE v_tipo
                 WHEN 'mensal' THEN coalesce(p.data_exercicio, p.data_nomeacao) <= v_d2
                                    AND (p.data_encerramento IS NULL OR p.data_encerramento >= v_d1)
                 WHEN 'rescisao' THEN p.status = 'encerrado' AND p.data_encerramento BETWEEN v_d1 AND v_d2
                                    AND p.motivo_encerramento IN ('exoneracao', 'exoneracao_pedido', 'exoneracao_oficio',
                                        'termino_mandato', 'demissao', 'aposentadoria', 'vacancia', 'falecimento')
                 ELSE coalesce(p.data_exercicio, p.data_nomeacao) <= make_date(v_ano, 12, 31)
                      AND (p.data_encerramento IS NULL OR p.data_encerramento >= make_date(v_ano, 1, 1))
               END
         ORDER BY coalesce(p.data_exercicio, p.data_nomeacao) DESC LIMIT 1) pv ON true
      JOIN public.cargos c ON c.id = pv.cargo_id
      -- lotação vigente no fim da competência (Gestão de Lotação); sem ela, a unidade do provimento
      LEFT JOIN LATERAL (SELECT lv.unidade_id FROM public.lotacao_vigente(s.id, v_d2) lv LIMIT 1) lv ON true
      LEFT JOIN public.estrutura_organizacional eo ON eo.id = coalesce(lv.unidade_id, pv.unidade_id)
     ORDER BY s.nome_completo
  LOOP
    v_elegiveis := v_elegiveis + 1;
    BEGIN
      IF v_srv.vencimento_base <= 0 THEN
        v_sem_venc := v_sem_venc + 1;
        v_errors := v_errors || jsonb_build_object('servidor_id', v_srv.id, 'nome', v_srv.nome_completo,
                                                   'cargo', v_srv.cargo_nome, 'erro', 'Cargo sem vencimento base definido');
        CONTINUE;
      END IF;

      v_r := public.folha_montar_ficha(v_srv.id, v_srv.provimento_id, v_tipo, v_d1, v_d2, v_manuais, v_tabelas);
      IF NOT public.portaria_nomeacao_publicada(v_srv.id, v_srv.provimento_id, v_srv.cargo_id) THEN
        v_r := jsonb_set(v_r, '{inconsistencias}', (v_r -> 'inconsistencias') || jsonb_build_array('portaria_de_nomeacao_nao_publicada'));
      END IF;

      -- 13º sem avos (ingresso depois do ano) ou ficha sem nenhum valor: não gera ficha vazia
      IF (v_r ->> 'total_proventos')::numeric = 0 AND (v_r ->> 'total_descontos')::numeric = 0 THEN
        CONTINUE;
      END IF;

      INSERT INTO public.fichas_financeiras (
        folha_id, servidor_id, competencia_ano, competencia_mes, tipo_folha, cargo_id, cargo_nome, cargo_vencimento,
        unidade_id, unidade_nome, total_proventos, total_descontos, valor_liquido, base_inss, valor_inss, base_irrf,
        valor_irrf, quantidade_dependentes, valor_deducao_dependentes, banco_codigo, banco_nome, banco_agencia,
        banco_conta, banco_tipo_conta, processado, data_processamento, tem_inconsistencia, inconsistencias)
      VALUES (
        p_folha_id, v_srv.id, v_folha.competencia_ano, v_folha.competencia_mes, v_tipo, v_srv.cargo_id, v_srv.cargo_nome,
        v_srv.vencimento_base, v_srv.unidade_id_vigente,
        CASE WHEN v_srv.unidade_id_vigente IS NOT NULL THEN COALESCE(v_srv.unidade_sigla || ' - ', '') || v_srv.unidade_nome END,
        (v_r ->> 'total_proventos')::numeric, (v_r ->> 'total_descontos')::numeric, (v_r ->> 'valor_liquido')::numeric,
        (v_r ->> 'base_inss')::numeric, (v_r ->> 'valor_inss')::numeric, (v_r ->> 'base_irrf')::numeric,
        (v_r ->> 'valor_irrf')::numeric, (v_r ->> 'quantidade_dependentes')::int, (v_r ->> 'valor_deducao_dependentes')::numeric,
        v_srv.banco_codigo, v_srv.banco_nome, v_srv.banco_agencia, v_srv.banco_conta, v_srv.banco_tipo_conta,
        true, now(), jsonb_array_length(v_r -> 'inconsistencias') > 0, v_r -> 'inconsistencias')
      RETURNING id INTO v_ficha_id;

      v_ordem := 0;
      FOR v_item IN SELECT e FROM jsonb_array_elements(v_r -> 'itens') e LOOP
        v_ordem := v_ordem + 1;
        INSERT INTO public.itens_ficha_financeira (ficha_id, rubrica_id, descricao, tipo, valor, referencia, base_calculo,
                                                   percentual, ordem, origem)
        VALUES (v_ficha_id, nullif(v_item ->> 'rubrica_id', '')::uuid, v_item ->> 'descricao', v_item ->> 'tipo',
                (v_item ->> 'valor')::numeric, v_item ->> 'referencia', nullif(v_item ->> 'base', '')::numeric,
                nullif(v_item ->> 'percentual', '')::numeric, v_ordem, v_item ->> 'origem');
        IF v_item ->> 'origem' = 'manual' THEN v_manuais_gravados := v_manuais_gravados + 1; END IF;
      END LOOP;

      v_count := v_count + 1;
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors || jsonb_build_object('servidor_id', v_srv.id, 'nome', v_srv.nome_completo, 'erro', SQLERRM);
    END;
  END LOOP;

  IF v_manuais_gravados < v_manuais_total THEN
    v_avisos := v_avisos || jsonb_build_array(
      (v_manuais_total - v_manuais_gravados) || ' lançamento(s) manual(is) não voltaram porque o servidor não entra mais nesta folha');
  END IF;
  IF v_tipo = 'mensal' THEN
    SELECT count(DISTINCT c.servidor_id) INTO v_cedidos FROM public.cessoes c
     WHERE c.tipo = 'entrada' AND c.ativa AND NOT EXISTS (
       SELECT 1 FROM public.provimentos p WHERE p.servidor_id = c.servidor_id AND p.status IN ('ativo', 'suspenso'));
    IF v_cedidos > 0 THEN
      v_avisos := v_avisos || jsonb_build_array(v_cedidos || ' cedido(s) de outro órgão não entram na folha (ônus da origem)');
    END IF;
  END IF;

  -- sem as alíquotas da parte patronal, a ficha de quem contribui para o regime geral fica com inconsistência
  -- (bloqueia o fechamento, ver fechar_folha)
  IF v_aliq_patronal IS NULL OR v_aliq_rat IS NULL THEN
    UPDATE public.fichas_financeiras f
       SET inconsistencias = coalesce(f.inconsistencias, '[]'::jsonb) || jsonb_build_array('aliquota_patronal_ou_rat_nao_configurada'),
           tem_inconsistencia = true
      FROM public.servidores s
     WHERE f.folha_id = p_folha_id AND s.id = f.servidor_id AND f.base_inss > 0
       AND NOT coalesce(s.contribui_rpps_origem, false);
  END IF;

  -- parte patronal: sobre a base de INSS (sem o teto) de quem contribui para o regime geral nesta folha, ou seja,
  -- de quem teve INSS descontado (quem contribui para o regime próprio na origem fica fora). Por ficha, arredondada;
  -- o total da folha é a soma das bases vezes a alíquota, truncada no centavo, como a guia.
  UPDATE public.fichas_financeiras
     SET inss_patronal = round(base_inss * coalesce(v_aliq_patronal, 0), 2),
         rat = round(base_inss * coalesce(v_aliq_rat, 0), 2),
         total_encargos = round(base_inss * coalesce(v_aliq_patronal, 0), 2) + round(base_inss * coalesce(v_aliq_rat, 0), 2)
   WHERE folha_id = p_folha_id AND valor_inss > 0;
  SELECT coalesce(sum(base_inss), 0) INTO v_base_patronal
    FROM public.fichas_financeiras WHERE folha_id = p_folha_id AND valor_inss > 0;

  PERFORM set_config('trilha.renovar_decisao', 'folhas_pagamento.processado_por', true);
  UPDATE public.folhas_pagamento
     SET total_bruto = COALESCE((SELECT SUM(total_proventos) FROM public.fichas_financeiras WHERE folha_id = p_folha_id), 0),
         total_descontos = COALESCE((SELECT SUM(total_descontos) FROM public.fichas_financeiras WHERE folha_id = p_folha_id), 0),
         total_liquido = COALESCE((SELECT SUM(valor_liquido) FROM public.fichas_financeiras WHERE folha_id = p_folha_id), 0),
         total_inss_servidor = COALESCE((SELECT SUM(valor_inss) FROM public.fichas_financeiras WHERE folha_id = p_folha_id), 0),
         total_irrf = COALESCE((SELECT SUM(valor_irrf) FROM public.fichas_financeiras WHERE folha_id = p_folha_id), 0),
         total_inss_patronal = trunc(v_base_patronal * coalesce(v_aliq_patronal, 0), 2),
         total_rat = trunc(v_base_patronal * coalesce(v_aliq_rat, 0), 2),
         total_encargos_patronais = trunc(v_base_patronal * coalesce(v_aliq_patronal, 0), 2)
                                    + trunc(v_base_patronal * coalesce(v_aliq_rat, 0), 2),
         quantidade_servidores = v_count,
         status = 'aberta',
         data_processamento = now(),
         processado_por = auth.uid(),
         tempo_processamento_ms = (EXTRACT(EPOCH FROM clock_timestamp() - v_inicio) * 1000)::int,
         updated_at = now()
   WHERE id = p_folha_id;
  PERFORM set_config('trilha.renovar_decisao', '', true);

  RETURN jsonb_build_object(
    'sucesso', true,
    'protocolo', v_protocolo,
    'servidores_processados', v_count,
    'total_servidores_ativos', v_elegiveis,
    'total_com_provimento', v_elegiveis,
    'total_sem_vencimento', v_sem_venc,
    'erros', v_errors,
    'avisos', v_avisos);

EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE;
  WHEN OTHERS THEN
    PERFORM set_config('trilha.renovar_decisao', '', true);
    RETURN jsonb_build_object('sucesso', false, 'erro', SQLERRM, 'servidores_processados', v_count);
END;
$$;


CREATE OR REPLACE FUNCTION public.fechar_folha(p_folha_id uuid, p_justificativa text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_folha RECORD;
  v_user_id UUID;
  v_bloqueantes jsonb;
  v_pendentes jsonb;
BEGIN
  v_user_id := auth.uid();
  
  -- Verificar autenticação
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário não autenticado');
  END IF;
  
  -- Verificar permissão
  IF NOT public.usuario_pode_fechar_folha(v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão para fechar folha');
  END IF;
  
  -- Buscar folha
  SELECT * INTO v_folha FROM public.folhas_pagamento WHERE id = p_folha_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Folha não encontrada');
  END IF;
  
  -- Verificar status atual
  IF v_folha.status = 'fechada' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Folha já está fechada');
  END IF;
  
  IF v_folha.status NOT IN ('processando', 'aberta') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Folha deve estar em conferência ou aberta para ser fechada');
  END IF;
  
  -- Fichas com inconsistência (processar_folha_pagamento). As de tributo sem tabela ou alíquota não fecham nunca:
  -- o INSS, o IRRF ou a parte patronal saíram zero. As demais fecham só com justificativa (20+ caracteres),
  -- que vai para o protocolo junto com a lista.
  SELECT coalesce(jsonb_agg(jsonb_build_object('servidor', s.nome_completo, 'inconsistencias', fc.inconsistencias)
                            ORDER BY s.nome_completo) FILTER (WHERE fc.inconsistencias ?| public.folha_inconsistencias_bloqueantes()), '[]'::jsonb),
         coalesce(jsonb_agg(jsonb_build_object('servidor', s.nome_completo, 'inconsistencias', fc.inconsistencias)
                            ORDER BY s.nome_completo), '[]'::jsonb)
    INTO v_bloqueantes, v_pendentes
    FROM public.fichas_financeiras fc JOIN public.servidores s ON s.id = fc.servidor_id
   WHERE fc.folha_id = p_folha_id AND fc.tem_inconsistencia;
  IF jsonb_array_length(v_bloqueantes) > 0 THEN
    RETURN jsonb_build_object('success', false, 'inconsistencias', v_bloqueantes, 'bloqueante', true,
      'error', format('A folha não pode ser fechada: %s ficha(s) com INSS, IRRF ou parte patronal calculados sem tabela ou alíquota. '
                      'Cadastre as tabelas e os parâmetros em Configurações da Folha e processe de novo.', jsonb_array_length(v_bloqueantes)));
  END IF;
  IF jsonb_array_length(v_pendentes) > 0 AND length(btrim(coalesce(p_justificativa, ''))) < 20 THEN
    RETURN jsonb_build_object('success', false, 'inconsistencias', v_pendentes, 'bloqueante', false,
      'error', format('%s ficha(s) com inconsistência. Corrija e processe de novo, ou informe uma justificativa (pelo menos 20 caracteres) para fechar assim mesmo.',
                      jsonb_array_length(v_pendentes)));
  END IF;

  PERFORM public.rh_protocolo_atual('folha', format('Fechamento da folha %s/%s', v_folha.competencia_mes, v_folha.competencia_ano), NULL,
    jsonb_build_object('folha_id', p_folha_id, 'justificativa', p_justificativa, 'fichas_com_inconsistencia', v_pendentes));

  -- Atualizar para fechada
  UPDATE public.folhas_pagamento
  SET 
    status = 'fechada',
    fechado_por = v_user_id,
    fechado_em = now(),
    justificativa_fechamento = p_justificativa,
    data_fechamento = now()
  WHERE id = p_folha_id;
  
  -- Registrar no audit_log
  INSERT INTO public.audit_logs (
    action, entity_type, entity_id, module_name, description, user_id
  ) VALUES (
    'update', 'folhas_pagamento', p_folha_id, 'rh',
    format('Folha %s/%s fechada. Justificativa: %s', v_folha.competencia_mes, v_folha.competencia_ano, COALESCE(p_justificativa, 'Sem justificativa')),
    v_user_id
  );
  
  RETURN jsonb_build_object('success', true, 'message', 'Folha fechada com sucesso');
END;
$function$;
