-- ============================================================================
-- Folha: parte patronal do regime geral (INSS patronal e RAT) e INSS truncado por faixa
-- ============================================================================
-- Antes: a folha não calculava a parte patronal. fichas_financeiras.inss_patronal/rat/total_encargos e
-- folhas_pagamento.total_inss_patronal/total_encargos_patronais existiam, mas ficavam em zero. O INSS do servidor
-- arredondava a soma das faixas; o SIGRH trunca cada faixa nos centavos (R$ 988,07 no teto, contra R$ 988,09).
--
-- Conferido com o FIPLAN: as 2 guias patronais de 09/2026 (remessa OBN de 19/10/2026) são 20% e 2% da soma das bases
-- de INSS de quem contribui para o regime geral, sem o teto, e a de 2% sai truncada no centavo.
--
-- Agora:
--   1. parametros_folha (dados, com vigência): inss_patronal_aliquota e rat_fap_aliquota em fração (0,20 e 0,02;
--      o RAT já ajustado pelo FAP) e inss_truncar_por_faixa (1 = trunca cada faixa, como o SIGRH; 0 ou ausente =
--      arredonda a soma). Nenhum valor é semeado: sem a alíquota, a parte correspondente sai zero e o processamento
--      avisa. Alíquota acima de 1 (digitada em %) é recusada.
--   2. calcular_inss_servidor: com inss_truncar_por_faixa = 1, trunca a contribuição de cada faixa antes de somar.
--   3. processar_folha_pagamento: depois das fichas, grava o INSS patronal e o RAT de cada ficha de quem teve INSS
--      descontado (quem contribui para o regime próprio na origem fica fora) e os totais da folha, que seguem a guia:
--      soma das bases vezes a alíquota, truncada no centavo. folhas_pagamento ganha total_rat.
-- Mesma regra do hrms_brasil (calcular_inss com arredondamento "por_faixa"); vetores em scripts/db/testar-rls.sql.
-- Idempotente.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Parâmetros: fração de 0 a 1 e opção sim/não (vale para linhas novas; as antigas não são revalidadas)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'parametros_folha_encargos_check') THEN
    ALTER TABLE public.parametros_folha ADD CONSTRAINT parametros_folha_encargos_check CHECK (
      (tipo_parametro NOT IN ('inss_patronal_aliquota', 'rat_fap_aliquota') OR (valor >= 0 AND valor <= 1))
      AND (tipo_parametro <> 'inss_truncar_por_faixa' OR valor IN (0, 1))) NOT VALID;
  END IF;
END $$;

ALTER TABLE public.folhas_pagamento ADD COLUMN IF NOT EXISTS total_rat numeric(15,2) DEFAULT 0;

COMMENT ON COLUMN public.folhas_pagamento.total_inss_patronal IS 'INSS patronal: soma das bases de INSS de quem contribui para o regime geral × inss_patronal_aliquota, truncada no centavo (como a guia). Migração 20261021100000.';
COMMENT ON COLUMN public.folhas_pagamento.total_rat IS 'RAT ajustado pelo FAP: soma das bases de INSS × rat_fap_aliquota, truncada no centavo. Migração 20261021100000.';
COMMENT ON COLUMN public.folhas_pagamento.total_encargos_patronais IS 'INSS patronal + RAT da folha. Migração 20261021100000.';

-- ---------------------------------------------------------------------------
-- 2. INSS do servidor: truncado por faixa quando o parâmetro manda
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.calcular_inss_servidor(p_base_inss numeric, p_vigencia date DEFAULT CURRENT_DATE) RETURNS numeric
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_inss_total DECIMAL := 0;
  v_base_restante DECIMAL;
  v_teto_inss DECIMAL;
  v_faixa_anterior DECIMAL := 0;
  v_valor_faixa DECIMAL;
  v_truncar boolean := coalesce(public.get_parametro_vigente('inss_truncar_por_faixa'::varchar, p_vigencia), 0) = 1;
  r RECORD;
BEGIN
  SELECT valor INTO v_teto_inss
  FROM parametros_folha
  WHERE tipo_parametro = 'teto_inss'
    AND vigencia_inicio <= p_vigencia
    AND (vigencia_fim IS NULL OR vigencia_fim >= p_vigencia)
  ORDER BY vigencia_inicio DESC LIMIT 1;
  
  v_base_restante := CASE 
    WHEN v_teto_inss IS NOT NULL THEN LEAST(p_base_inss, v_teto_inss)
    ELSE p_base_inss
  END;
  
  IF v_base_restante <= 0 THEN
    RETURN 0;
  END IF;
  
  FOR r IN (
    SELECT * FROM tabela_inss
    WHERE vigencia_inicio <= p_vigencia
      AND (vigencia_fim IS NULL OR vigencia_fim >= p_vigencia)
    ORDER BY faixa_ordem
  ) LOOP
    IF v_base_restante > r.valor_minimo THEN
      IF r.valor_maximo IS NULL OR v_base_restante <= r.valor_maximo THEN
        v_valor_faixa := v_base_restante - GREATEST(r.valor_minimo, v_faixa_anterior);
      ELSE
        v_valor_faixa := r.valor_maximo - GREATEST(r.valor_minimo, v_faixa_anterior);
      END IF;
      
      IF v_valor_faixa > 0 THEN
        v_inss_total := v_inss_total + CASE WHEN v_truncar THEN trunc(v_valor_faixa * r.aliquota, 2)
                                            ELSE v_valor_faixa * r.aliquota END;
      END IF;
      
      v_faixa_anterior := COALESCE(r.valor_maximo, v_base_restante);
    END IF;
  END LOOP;
  
  RETURN ROUND(v_inss_total, 2);
END;
$$;

COMMENT ON FUNCTION public.calcular_inss_servidor(numeric, date) IS 'INSS progressivo do servidor no regime geral, até teto_inss; com inss_truncar_por_faixa = 1 trunca cada faixa nos centavos, como o SIGRH. Migração 20261021100000.';

-- ---------------------------------------------------------------------------
-- 3. Processamento da folha: parte patronal por ficha e totais da folha
-- ---------------------------------------------------------------------------
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
           public.vencimento_cargo_em(c.id, v_d2) AS vencimento_base, eo.nome AS unidade_nome, eo.sigla AS unidade_sigla
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
    UPDATE public.folhas_pagamento SET status = 'aberta', updated_at = now() WHERE id = p_folha_id;
    RETURN jsonb_build_object('sucesso', false, 'erro', SQLERRM, 'servidores_processados', v_count);
END;
$$;

COMMENT ON FUNCTION public.processar_folha_pagamento(uuid) IS 'Processa a folha (mensal, 13º e rescisão): monta as fichas pelo cálculo do banco, devolve os lançamentos manuais e grava os totais, inclusive o INSS patronal e o RAT do regime geral (migração 20261021100000).';
