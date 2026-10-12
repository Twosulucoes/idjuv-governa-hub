-- ============================================================================
-- Folha — cálculo completo no banco (decisão do dono, 12/10/2026: a folha é calculada aqui)
-- ============================================================================
-- Antes: processar_folha_pagamento calculava só vencimento do cargo − INSS − IRRF, só para situacao='ativo' (quem estava
-- em férias, licença ou afastado ficava FORA da folha), ignorava frequência, férias, licenças, consignações, pensões,
-- lançamentos manuais, proporcionalidade de ingresso/saída, 13º e rescisão, e tratava todos os tipos de folha igual.
--
-- Agora (tipos mensal, 13_1a_parcela, 13_2a_parcela, rescisao; os demais recusam com mensagem):
--   * entra na folha quem tem PROVIMENTO que cobre o período (ativo, suspenso ou encerrado) — férias e licença
--     remunerada continuam recebendo; servidor sem provimento (cedido de entrada, temporário sem cargo) não entra
--   * mensal: vencimento proporcional (mês comercial de 30 dias; ingresso/saída no mês), desconto de faltas
--     (frequencia_mensal), de licença/afastamento NÃO remunerado e de cessão de saída com ônus no destino, adicional de
--     1/3 e abono pecuniário de férias (no mês do início do gozo), lançamentos manuais preservados no reprocessamento,
--     INSS, IRRF (dependentes), consignações ativas, pensão alimentícia
--   * 13º: 1ª parcela = 50% do 13º (sem imposto); 2ª parcela = 13º integral com INSS/IRRF (tributação exclusiva) menos a
--     1ª parcela já paga
--   * rescisão: verbas do desligamento no mês — férias proporcionais + 1/3 (indenizatórias) e 13º proporcional (o saldo
--     de salário já vem na folha mensal do mês). Sempre marcada para conferência
--   * cada ficha leva `inconsistencias` (nomeação sem portaria publicada, tabela de INSS/IRRF ausente, dedução de dependente não configurada, sem
--     frequência do mês, sem dados bancários, líquido negativo, acima do teto, ônus de cessão não informado…)
--   * protocolo (RH-AAAA-NNNNNN) abre o processamento; a trilha (audit_logs) guarda cada ficha e item com esse número
--
-- Tabelas de INSS e IRRF, dedução por dependente e teto são DADOS (tabela_inss, tabela_irrf, parametros_folha) e hoje
-- estão VAZIAS em produção: sem elas o desconto sai zero e a ficha sai marcada. Quem carrega é o RH, com a tabela vigente
-- do regime do órgão (RPPS ou RGPS). Nenhum valor legal é fixado no código.
-- Parâmetros opcionais em parametros_folha: licenca_remunerada_<tipo>, afastamento_remunerado_<tipo> (1/0).
--   Padrão sem parâmetro: não remunerados interesse_particular, mandato_eletivo e suspensao.
-- Idempotente.
-- ============================================================================

ALTER TABLE public.itens_ficha_financeira
  ADD COLUMN IF NOT EXISTS origem text NOT NULL DEFAULT 'manual';
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.itens_ficha_financeira'::regclass
                  AND conname = 'itens_ficha_financeira_origem_check') THEN
    ALTER TABLE public.itens_ficha_financeira
      ADD CONSTRAINT itens_ficha_financeira_origem_check CHECK (origem IN ('automatico', 'manual'));
  END IF;
END $$;
COMMENT ON COLUMN public.itens_ficha_financeira.origem IS
  'automatico = calculado pelo processamento (refeito a cada processamento); manual = lançado pelo RH (preservado ao reprocessar)';

-- ---------------------------------------------------------------------------
-- apoio
-- ---------------------------------------------------------------------------
-- dias do mês comercial (30) entre duas datas, recortadas ao mês [p_mes_ini, p_mes_fim]
CREATE OR REPLACE FUNCTION public.folha_dias_comerciais(p_inicio date, p_fim date, p_mes_ini date, p_mes_fim date)
 RETURNS int
 LANGUAGE sql
 IMMUTABLE
AS $function$
  SELECT CASE
    WHEN p_inicio IS NULL OR p_fim IS NULL THEN 0
    ELSE (
      SELECT CASE WHEN x.i > x.f THEN 0
                  ELSE greatest(0,
                         (CASE WHEN x.f = p_mes_fim THEN 30 ELSE least(EXTRACT(day FROM x.f)::int, 30) END)
                         - least(EXTRACT(day FROM x.i)::int, 30) + 1) END
        FROM (SELECT greatest(p_inicio, p_mes_ini) AS i, least(p_fim, p_mes_fim) AS f) x)
  END;
$function$;

-- avos de 13º no ano: meses com 15 dias ou mais de serviço
CREATE OR REPLACE FUNCTION public.folha_avos_13(p_inicio date, p_fim date, p_ano int)
 RETURNS int
 LANGUAGE sql
 IMMUTABLE
AS $function$
  SELECT count(*)::int
    FROM generate_series(1, 12) m
   WHERE public.folha_dias_comerciais(p_inicio, p_fim, make_date(p_ano, m, 1),
                                      (make_date(p_ano, m, 1) + interval '1 month - 1 day')::date) >= 15;
$function$;

CREATE OR REPLACE FUNCTION public.folha_item(p_descricao text, p_tipo text, p_valor numeric, p_referencia text DEFAULT NULL,
                                             p_base numeric DEFAULT NULL, p_percentual numeric DEFAULT NULL,
                                             p_origem text DEFAULT 'automatico', p_rubrica uuid DEFAULT NULL)
 RETURNS jsonb
 LANGUAGE sql
 IMMUTABLE
AS $function$
  SELECT jsonb_build_object('descricao', p_descricao, 'tipo', p_tipo, 'valor', p_valor, 'referencia', p_referencia,
                            'base', p_base, 'percentual', p_percentual, 'origem', p_origem, 'rubrica_id', p_rubrica);
$function$;

-- o afastamento é remunerado? (parâmetro em parametros_folha; sem ele, o padrão do cabeçalho)
CREATE OR REPLACE FUNCTION public.afastamento_remunerado(p_tipo_afastamento text, p_tipo_licenca text, p_data date)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_chave text;
  v_valor numeric;
BEGIN
  v_chave := CASE WHEN p_tipo_afastamento = 'licenca'
                  THEN 'licenca_remunerada_' || coalesce(p_tipo_licenca, 'outra')
                  ELSE 'afastamento_remunerado_' || p_tipo_afastamento END;
  SELECT valor INTO v_valor FROM public.parametros_folha
   WHERE tipo_parametro = v_chave AND ativo IS NOT FALSE
     AND vigencia_inicio <= p_data AND (vigencia_fim IS NULL OR vigencia_fim >= p_data)
   ORDER BY vigencia_inicio DESC LIMIT 1;
  IF FOUND THEN RETURN v_valor <> 0; END IF;
  RETURN NOT (p_tipo_afastamento = 'suspensao'
              OR (p_tipo_afastamento = 'licenca' AND p_tipo_licenca IN ('interesse_particular', 'mandato_eletivo')));
END;
$function$;


-- a nomeação do servidor está amparada por portaria PUBLICADA (publicada ou vigente)? Sem ato publicado, a posse e o
-- exercício ainda não têm amparo: a folha marca a ficha (não bloqueia: a publicação pode vir depois, com efeito retroativo)
CREATE OR REPLACE FUNCTION public.portaria_nomeacao_publicada(p_servidor_id uuid, p_provimento_id uuid, p_cargo_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.documentos d
     WHERE d.tipo = 'portaria' AND d.categoria = 'nomeacao' AND d.status IN ('publicado', 'vigente')
       AND (d.provimento_id = p_provimento_id
            OR (p_servidor_id = ANY (d.servidores_ids) AND (d.cargo_id IS NULL OR d.cargo_id = p_cargo_id))));
$function$;
REVOKE EXECUTE ON FUNCTION public.portaria_nomeacao_publicada(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;

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
BEGIN
  SELECT s.data_admissao, s.banco_codigo, s.banco_conta INTO v_srv FROM public.servidores s WHERE s.id = p_servidor_id;
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
  IF NOT v_tem_inss THEN v_inc := v_inc || jsonb_build_array('tabela_inss_ausente'); END IF;
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
    IF v_tem_inss THEN v_inss := public.calcular_inss_servidor(v_base_inss, p_d2); END IF;

    v_qdep := public.count_dependentes_irrf(p_servidor_id, p_d2);
    IF v_qdep > 0 AND v_ded_cfg IS NULL THEN
      v_inc := v_inc || jsonb_build_array('deducao_dependente_nao_configurada');
    END IF;
    v_ded := v_qdep * coalesce(v_ded_cfg, 0);
    v_base_irrf := greatest(v_liq_dias + v_terco + v_man_prov_irrf - v_inss - v_ded, 0);
    IF v_tem_irrf THEN v_irrf := public.calcular_irrf(v_base_irrf, p_d2); END IF;

    IF v_inss > 0 THEN
      v_itens := v_itens || jsonb_build_array(public.folha_item('INSS / previdência do servidor', 'desconto', v_inss, NULL, v_base_inss));
    END IF;
    IF v_irrf > 0 THEN
      v_itens := v_itens || jsonb_build_array(public.folha_item('IRRF', 'desconto', v_irrf, v_qdep || ' dependente(s)', v_base_irrf));
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

    -- pensão alimentícia (percentual é número "30" = 30%; base líquida = proventos do mês − faltas − INSS − IRRF)
    FOR v_p IN SELECT * FROM public.pensoes_alimenticias pa
                WHERE pa.servidor_id = p_servidor_id AND coalesce(pa.ativo, true) AND pa.data_inicio <= p_d2
                  AND (pa.data_fim IS NULL OR pa.data_fim >= p_d1) ORDER BY pa.prioridade NULLS LAST LOOP
      IF lower(v_p.tipo_calculo) LIKE 'perc%' THEN
        v_base_pensao := CASE WHEN lower(coalesce(v_p.base_calculo, '')) = 'bruto'
                              THEN v_liq_dias + v_terco + v_man_prov
                              ELSE greatest(v_liq_dias + v_terco + v_man_prov - v_inss - v_irrf, 0) END;
        v_val := round(v_base_pensao * coalesce(v_p.percentual, 0) / 100, 2);
      ELSE
        v_val := coalesce(v_p.valor_fixo, 0);
      END IF;
      v_pensao := v_pensao + v_val;
      v_itens := v_itens || jsonb_build_array(public.folha_item('Pensão alimentícia — ' || v_p.beneficiario_nome, 'desconto', v_val,
        NULL, v_base_pensao, CASE WHEN lower(v_p.tipo_calculo) LIKE 'perc%' THEN v_p.percentual END));
    END LOOP;

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
      IF v_tem_inss THEN v_inss := public.calcular_inss_servidor(v_base_inss, p_d2); END IF;
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
    IF v_tem_inss THEN v_inss := public.calcular_inss_servidor(v_base_inss, p_d2); END IF;
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

-- ---------------------------------------------------------------------------
-- processamento da folha (mesma assinatura e mesmo retorno de antes, com avisos e protocolo a mais)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.processar_folha_pagamento(p_folha_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  UPDATE public.folhas_pagamento SET status = 'processando', updated_at = now() WHERE id = p_folha_id;

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
           coalesce(c.vencimento_base, 0) AS vencimento_base, eo.nome AS unidade_nome, eo.sigla AS unidade_sigla
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
      LEFT JOIN public.estrutura_organizacional eo ON eo.id = pv.unidade_id
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
        v_srv.vencimento_base, v_srv.unidade_id, COALESCE(v_srv.unidade_sigla, '') || ' - ' || COALESCE(v_srv.unidade_nome, ''),
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

  PERFORM set_config('trilha.renovar_decisao', 'folhas_pagamento.processado_por', true);
  UPDATE public.folhas_pagamento
     SET total_bruto = COALESCE((SELECT SUM(total_proventos) FROM public.fichas_financeiras WHERE folha_id = p_folha_id), 0),
         total_descontos = COALESCE((SELECT SUM(total_descontos) FROM public.fichas_financeiras WHERE folha_id = p_folha_id), 0),
         total_liquido = COALESCE((SELECT SUM(valor_liquido) FROM public.fichas_financeiras WHERE folha_id = p_folha_id), 0),
         total_inss_servidor = COALESCE((SELECT SUM(valor_inss) FROM public.fichas_financeiras WHERE folha_id = p_folha_id), 0),
         total_irrf = COALESCE((SELECT SUM(valor_irrf) FROM public.fichas_financeiras WHERE folha_id = p_folha_id), 0),
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
    UPDATE public.folhas_pagamento SET status = 'aberta', updated_at = now() WHERE id = p_folha_id;
    RETURN jsonb_build_object('sucesso', false, 'erro', SQLERRM, 'servidores_processados', v_count);
END;
$function$;

-- ---------------------------------------------------------------------------
-- privilégios das funções novas (apoio é interno; o cálculo de ficha não é chamado pela API)
-- ---------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.folha_montar_ficha(uuid, uuid, text, date, date, jsonb, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.afastamento_remunerado(text, text, date) FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- protocolo explícito nos atos da folha (enviar à conferência, fechar, reabrir)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enviar_folha_conferencia(p_folha_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_folha RECORD;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário não autenticado');
  END IF;
  
  IF NOT public.usuario_tem_permissao(v_user_id, 'rh.admin') AND NOT public.usuario_eh_admin(v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão para enviar para conferência');
  END IF;
  
  SELECT * INTO v_folha FROM public.folhas_pagamento WHERE id = p_folha_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Folha não encontrada');
  END IF;
  
  IF v_folha.status NOT IN ('aberta', 'reaberta') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Folha deve estar aberta ou reaberta para enviar à conferência');
  END IF;
  
  PERFORM public.rh_protocolo_atual('folha', format('Envio da folha %s/%s para conferência', v_folha.competencia_mes, v_folha.competencia_ano), NULL, jsonb_build_object('folha_id', p_folha_id));

  UPDATE public.folhas_pagamento
  SET 
    status = 'processando',
    conferido_por = v_user_id,
    conferido_em = now()
  WHERE id = p_folha_id;
  
  RETURN jsonb_build_object('success', true, 'message', 'Folha enviada para conferência');
END;
$function$;

CREATE OR REPLACE FUNCTION public.fechar_folha(p_folha_id uuid, p_justificativa text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_folha RECORD;
  v_user_id UUID;
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
  
  PERFORM public.rh_protocolo_atual('folha', format('Fechamento da folha %s/%s', v_folha.competencia_mes, v_folha.competencia_ano), NULL, jsonb_build_object('folha_id', p_folha_id, 'justificativa', p_justificativa));

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

CREATE OR REPLACE FUNCTION public.reabrir_folha(p_folha_id uuid, p_justificativa text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_folha RECORD;
  v_user_id UUID;
  v_remessas text;
BEGIN
  v_user_id := auth.uid();
  
  -- Verificar autenticação
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário não autenticado');
  END IF;
  
  -- Justificativa obrigatória
  IF p_justificativa IS NULL OR trim(p_justificativa) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Justificativa obrigatória para reabrir folha');
  END IF;
  
  -- Verificar permissão (apenas super_admin)
  IF NOT public.usuario_pode_reabrir_folha(v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Apenas super administradores podem reabrir folhas');
  END IF;
  
  -- Buscar folha (travada até o fim: geração de remessa/eSocial em curso termina antes; a que vier depois espera)
  SELECT * INTO v_folha FROM public.folhas_pagamento WHERE id = p_folha_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Folha não encontrada');
  END IF;
  
  -- Verificar status atual
  IF v_folha.status != 'fechada' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Apenas folhas fechadas podem ser reabertas');
  END IF;

  -- Remessa bancária ativa: cancelar antes (E3)
  SELECT string_agg(r.numero_remessa::text, ', ' ORDER BY r.numero_remessa) INTO v_remessas
    FROM public.remessas_bancarias r
   WHERE r.folha_id = p_folha_id AND r.status <> 'cancelada';
  IF v_remessas IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error',
      format('A folha tem remessa bancária ativa (nº %s). Cancele a remessa antes de reabrir a folha.', v_remessas));
  END IF;
  
  PERFORM public.rh_protocolo_atual('folha', format('Reabertura da folha %s/%s', v_folha.competencia_mes, v_folha.competencia_ano), NULL, jsonb_build_object('folha_id', p_folha_id, 'justificativa', p_justificativa));

  -- Atualizar para reaberta
  UPDATE public.folhas_pagamento
  SET 
    status = 'reaberta',
    reaberto_por = v_user_id,
    reaberto_em = now(),
    justificativa_reabertura = p_justificativa
  WHERE id = p_folha_id;

  -- Eventos do eSocial rascunho da folha saem da vigência (E3)
  UPDATE public.eventos_esocial
     SET status = 'erro', mensagem_retorno = 'Folha reaberta: gere o evento de novo depois de fechar'
   WHERE folha_id = p_folha_id AND recibo IS NULL AND status NOT IN ('erro', 'rejeitado');
  
  -- Registrar no audit_log
  INSERT INTO public.audit_logs (
    action, entity_type, entity_id, module_name, description, user_id
  ) VALUES (
    'update', 'folhas_pagamento', p_folha_id, 'rh',
    format('Folha %s/%s REABERTA por super_admin. Justificativa: %s', v_folha.competencia_mes, v_folha.competencia_ano, p_justificativa),
    v_user_id
  );
  
  RETURN jsonb_build_object('success', true, 'message', 'Folha reaberta com sucesso');
END;
$function$;

NOTIFY pgrst, 'reload schema';
