-- ============================================================================
-- Folha: IRRF pela lei de 2026, opção pelo regime próprio de origem e alíquota das tabelas como fração
-- ============================================================================
-- Achado em 19/10/2026 ao rodar o cálculo contra o espelho do SIGRH de 09/2026 (96 servidores):
--   * o IRRF mensal não tinha o desconto simplificado nem a redução da Lei 15.270/2025 (isenção até R$ 5.000 e
--     redução decrescente até R$ 7.350): quem hoje não paga IR passaria a pagar;
--   * a pensão alimentícia não saía da base do IRRF (Lei 9.250/1995, art. 4º, II);
--   * o INSS saía para todos, inclusive para o efetivo de outro ente em cargo em comissão que contribui para o regime
--     próprio do órgão de origem;
--   * a tela das tabelas de INSS e IRRF grava a alíquota em % (7,5) e o cálculo multiplica pela fração (0,075).
-- Agora:
--   * servidores.contribui_rpps_origem (+ fundamento e início): com a opção, a folha não desconta INSS; vínculo
--     efetivo externo sem a opção marca a ficha (regime_previdenciario_a_confirmar)
--   * calcular_irrf_mensal(rendimentos, deduções legais, data): usa a maior entre as deduções legais (INSS,
--     dependentes, pensão) e o desconto simplificado, e aplica a redução da Lei 15.270 sobre os rendimentos.
--     Os valores são DADOS em parametros_folha (desconto_simplificado_irrf, irrf_reducao_limite_isencao,
--     irrf_reducao_maxima, irrf_reducao_limite, irrf_reducao_constante, irrf_reducao_coeficiente): sem eles a
--     parte correspondente não se aplica e a ficha sai marcada
--   * folha mensal: pensão antes do IRRF e deduzida da base (sobre o líquido, recalcula até fechar)
--   * tabela_inss/tabela_irrf: alíquota é fração (0 a 1); linha já gravada em % é convertida
--   * parametros_folha.valor com 6 casas (o coeficiente da redução é 0,133145)
-- 13º e rescisão continuam com o cálculo anterior do IRRF (a regra do redutor no 13º ainda será conferida).
-- Idempotente.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- opção pelo regime próprio do órgão de origem
-- ---------------------------------------------------------------------------
ALTER TABLE public.servidores
  ADD COLUMN IF NOT EXISTS contribui_rpps_origem boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS rpps_origem_fundamento text,
  ADD COLUMN IF NOT EXISTS rpps_origem_inicio date;

COMMENT ON COLUMN public.servidores.contribui_rpps_origem IS
  'Efetivo de outro ente que contribui para o regime próprio de origem: a folha não desconta INSS';
COMMENT ON COLUMN public.servidores.rpps_origem_fundamento IS
  'Ato ou instrução normativa que fundamenta a opção (obrigatório com a opção)';
COMMENT ON COLUMN public.servidores.rpps_origem_inicio IS 'Início da opção (obrigatório com a opção)';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'servidores_rpps_origem_fundamentado') THEN
    ALTER TABLE public.servidores ADD CONSTRAINT servidores_rpps_origem_fundamentado
      CHECK (NOT contribui_rpps_origem
             OR (nullif(btrim(rpps_origem_fundamento), '') IS NOT NULL AND rpps_origem_inicio IS NOT NULL));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- alíquota das tabelas é fração; o que já foi gravado em % vira fração
-- ---------------------------------------------------------------------------
UPDATE public.tabela_inss SET aliquota = aliquota / 100 WHERE aliquota > 1;
UPDATE public.tabela_irrf SET aliquota = aliquota / 100 WHERE aliquota > 1;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tabela_inss_aliquota_fracao') THEN
    ALTER TABLE public.tabela_inss ADD CONSTRAINT tabela_inss_aliquota_fracao CHECK (aliquota >= 0 AND aliquota <= 1);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tabela_irrf_aliquota_fracao') THEN
    ALTER TABLE public.tabela_irrf ADD CONSTRAINT tabela_irrf_aliquota_fracao CHECK (aliquota >= 0 AND aliquota <= 1);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- parâmetros com 6 casas decimais
-- ---------------------------------------------------------------------------
ALTER TABLE public.parametros_folha ALTER COLUMN valor TYPE numeric(18,6);

-- ---------------------------------------------------------------------------
-- IRRF mensal: dedução mais vantajosa e redução da Lei 15.270/2025
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.calcular_irrf_mensal(p_rendimentos numeric, p_deducoes_legais numeric,
                                                       p_vigencia date DEFAULT CURRENT_DATE)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_rend numeric := greatest(coalesce(p_rendimentos, 0), 0);
  v_legal numeric := greatest(coalesce(p_deducoes_legais, 0), 0);
  v_simpl numeric := public.get_parametro_vigente('desconto_simplificado_irrf'::varchar, p_vigencia);
  v_isencao numeric := public.get_parametro_vigente('irrf_reducao_limite_isencao'::varchar, p_vigencia);
  v_red_max numeric := public.get_parametro_vigente('irrf_reducao_maxima'::varchar, p_vigencia);
  v_red_lim numeric := public.get_parametro_vigente('irrf_reducao_limite'::varchar, p_vigencia);
  v_red_const numeric := public.get_parametro_vigente('irrf_reducao_constante'::varchar, p_vigencia);
  v_red_coef numeric := public.get_parametro_vigente('irrf_reducao_coeficiente'::varchar, p_vigencia);
  v_usa_simpl boolean;
  v_deducao numeric;
  v_base numeric;
  v_imposto numeric;
  v_red numeric := 0;
  v_red_ok boolean;
BEGIN
  v_usa_simpl := coalesce(v_simpl, 0) > v_legal;
  v_deducao := CASE WHEN v_usa_simpl THEN v_simpl ELSE v_legal END;
  v_base := greatest(v_rend - v_deducao, 0);
  v_imposto := public.calcular_irrf(v_base, p_vigencia);

  v_red_ok := v_isencao IS NOT NULL AND v_red_max IS NOT NULL AND v_red_lim IS NOT NULL
              AND v_red_const IS NOT NULL AND v_red_coef IS NOT NULL;
  IF v_red_ok THEN
    IF v_rend <= v_isencao THEN
      v_red := v_red_max;
    ELSIF v_rend <= v_red_lim THEN
      v_red := greatest(v_red_const - v_red_coef * v_rend, 0);
    END IF;
    v_red := round(least(v_red, v_imposto), 2);
  END IF;

  RETURN jsonb_build_object(
    'rendimentos', round(v_rend, 2), 'deducao', round(v_deducao, 2), 'simplificado', v_usa_simpl,
    'base', round(v_base, 2), 'imposto', v_imposto, 'reducao', v_red, 'irrf', v_imposto - v_red,
    'simplificado_configurado', v_simpl IS NOT NULL, 'reducao_configurada', v_red_ok);
END;
$function$;

-- ---------------------------------------------------------------------------
-- monta uma ficha (sem gravar): itens, bases, impostos, totais e inconsistências
-- p_tabelas: {"inss": bool, "irrf": bool, "ded_dep": numeric|null}
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.folha_montar_ficha(
  p_servidor_id uuid, p_provimento_id uuid, p_tipo text, p_d1 date, p_d2 date, p_manuais jsonb, p_tabelas jsonb
) RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_srv record;
  v_prv record;
  v_venc numeric;
  v_itens jsonb := '[]'::jsonb;
  v_inc jsonb := '[]'::jsonb;
  v_ano int := EXTRACT(YEAR FROM p_d2)::int;
  v_ini date; v_fim date; v_dias int; v_ini_pago date; v_fim_pago date; v_venc_prop numeric := 0;
  v_faltas int := 0; v_dias_lic int := 0; v_dias_ces int := 0; v_rest int;
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
  SELECT p.*, coalesce(p.data_exercicio, p.data_nomeacao) AS inicio, coalesce(c.vencimento_base, 0) AS venc
    INTO v_prv
    FROM public.provimentos p JOIN public.cargos c ON c.id = p.cargo_id
   WHERE p.id = p_provimento_id;
  v_venc := v_prv.venc;
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
$function$;

REVOKE EXECUTE ON FUNCTION public.folha_montar_ficha(uuid, uuid, text, date, date, jsonb, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calcular_irrf_mensal(numeric, numeric, date) FROM PUBLIC, anon, authenticated;

NOTIFY pgrst, 'reload schema';
