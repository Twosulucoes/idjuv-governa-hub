-- ============================================================================
-- Folha: importação da folha histórica do SIGRH (espelho por servidor)
-- ============================================================================
-- Antes: a folha só nascia pelo cálculo do sistema (processar_folha_pagamento). Os meses pagos pelo SIGRH antes
-- do uso do sistema (2026: março a setembro) não tinham ficha, e sem ficha não há contracheque nem informe de
-- rendimentos do ano.
--
-- Agora: importar_folha_sigrh(p_competencia, p_fichas, p_arquivo, p_simular) recebe as fichas lidas no navegador
-- de um espelho do SIGRH (FPAG10, relatório analítico de conferência ou planilha analítica por evento; leitor em
-- src/lib/importacao/importadores/folhaSigrhParser.ts, que já conferiu a soma com o total impresso) e grava, tudo
-- ou nada:
--   1. a folha mensal da competência, com os totais e a observação "Folha histórica importada do SIGRH";
--   2. uma ficha por servidor (casado pelo CPF), com o cargo/função e o banco como pagos no espelho e o cargo e a
--      unidade do provimento vigente no mês, quando houver; INSS e IRRF somados das rubricas;
--   3. os itens da ficha (origem automatico: se a folha for reaberta e reprocessada, o cálculo do sistema os
--      substitui); a rubrica cadastrada com a mesma descrição é ligada ao item;
--   4. a parte patronal pela mesma regra do processamento (migração 20261021100000);
--   5. o fechamento pela RPC fechar_folha (a mesma regra de quem pode fechar), com a justificativa da importação.
-- Recusa a competência que já tem folha mensal (não grava por cima) e a competência futura. Servidor que não está
-- cadastrado é erro da linha: com qualquer erro, nada é gravado. Com p_simular = true tudo é desfeito no fim
-- (mesmo esquema da importação de portarias, migração 20261015120000: bloco externo com RAISE de SQLSTATE próprio
-- capturado ali mesmo).
--
-- Quem pode: perfil ativo, módulo rh, financeiro.folha.processar e usuario_pode_fechar_folha. As fichas passam
-- pelos gatilhos de setor e autoria como no processamento.
--
-- LGPD: o CPF só serve para achar o servidor; não é devolvido nem gravado no log (importacoes guarda competência,
-- totais e, por linha, o índice e a ficha criada). As mensagens de erro citam o nome como veio no arquivo.
-- Idempotente.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.importar_folha_sigrh(
  p_competencia jsonb,
  p_fichas jsonb,
  p_arquivo jsonb,
  p_simular boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_ano integer;
  v_mes integer;
  v_d1 date;
  v_d2 date;
  v_existente record;
  v_folha_id uuid;
  v_ficha jsonb;
  v_item jsonb;
  v_ind integer;
  v_pos integer := -1;
  v_nome text;
  v_cpf text;
  v_srv uuid;
  v_qtd_srv integer;
  v_pv record;
  v_ficha_id uuid;
  v_prov numeric;
  v_desc numeric;
  v_inss numeric;
  v_irrf numeric;
  v_valor numeric;
  v_tipo text;
  v_descricao text;
  v_comp text;
  v_ordem integer;
  v_avisos text[];
  v_vistos text[] := '{}';
  v_linhas_res jsonb := '[]'::jsonb;
  v_erros jsonb := '[]'::jsonb;
  v_detalhes jsonb := '[]'::jsonb;
  v_n integer := 0;
  v_aliq_patronal numeric;
  v_aliq_rat numeric;
  v_base_patronal numeric;
  v_fechamento jsonb;
  v_justificativa text;
  v_totais jsonb;
  v_resumo jsonb;
  v_import_id uuid;
BEGIN
  p_simular := COALESCE(p_simular, true);

  -- COALESCE: um NULL em qualquer checagem nega
  IF v_uid IS NULL
     OR NOT COALESCE(public.perfil_ativo_atual()
                     AND public.can_access_module(v_uid, 'rh')
                     AND public.has_permission_code(v_uid, 'financeiro.folha.processar')
                     AND public.usuario_pode_fechar_folha(v_uid), false) THEN
    RAISE EXCEPTION 'Sem permissão para importar a folha (processar e fechar a folha).' USING ERRCODE = '42501';
  END IF;

  IF COALESCE(p_competencia->>'ano', '') !~ '^\d{4}$' OR COALESCE(p_competencia->>'mes', '') !~ '^\d{1,2}$' THEN
    RAISE EXCEPTION 'Competência inválida.' USING ERRCODE = '22023';
  END IF;
  v_ano := (p_competencia->>'ano')::integer;
  v_mes := (p_competencia->>'mes')::integer;
  IF v_mes NOT BETWEEN 1 AND 12 OR v_ano NOT BETWEEN 2000 AND 2100 THEN
    RAISE EXCEPTION 'Competência inválida.' USING ERRCODE = '22023';
  END IF;
  v_d1 := make_date(v_ano, v_mes, 1);
  v_d2 := (v_d1 + interval '1 month - 1 day')::date;
  IF v_d1 > CURRENT_DATE THEN
    RAISE EXCEPTION 'A competência %/% ainda não chegou: só se importa folha já paga.', lpad(v_mes::text, 2, '0'), v_ano
      USING ERRCODE = '22023';
  END IF;

  IF jsonb_typeof(p_fichas) IS DISTINCT FROM 'array' OR jsonb_array_length(p_fichas) NOT BETWEEN 1 AND 3000 THEN
    RAISE EXCEPTION 'Envie de 1 a 3000 fichas.' USING ERRCODE = '22023';
  END IF;
  IF NOT p_simular AND (
       char_length(COALESCE(p_arquivo->>'nome', '')) NOT BETWEEN 1 AND 255
       OR COALESCE(p_arquivo->>'sha256', '') !~ '^[0-9a-f]{64}$'
       OR COALESCE(p_arquivo->>'tamanho', '') !~ '^\d{1,15}$') THEN
    RAISE EXCEPTION 'Dados do arquivo inválidos.' USING ERRCODE = '22023';
  END IF;

  -- uma importação por competência de cada vez; com outra em andamento recusa na hora
  IF NOT pg_try_advisory_xact_lock(hashtext('importar_folha_sigrh'), v_ano * 100 + v_mes) THEN
    RAISE EXCEPTION 'Já há uma importação desta folha em andamento; tente de novo em instantes.' USING ERRCODE = '55P03';
  END IF;

  SELECT f.id, f.status INTO v_existente FROM public.folhas_pagamento f
   WHERE f.competencia_ano = v_ano AND f.competencia_mes = v_mes AND f.tipo_folha = 'mensal';
  IF FOUND THEN
    RAISE EXCEPTION 'Já existe folha mensal de %/% no sistema (situação: %). A importação não grava por cima.',
      lpad(v_mes::text, 2, '0'), v_ano, v_existente.status USING ERRCODE = '23505';
  END IF;

  v_justificativa := left(format('Folha histórica importada do SIGRH (arquivo %s)',
                                 COALESCE(nullif(p_arquivo->>'nome', ''), 'sem nome')), 500);
  v_aliq_patronal := public.get_parametro_vigente('inss_patronal_aliquota'::varchar, v_d2);
  v_aliq_rat := public.get_parametro_vigente('rat_fap_aliquota'::varchar, v_d2);

  BEGIN
    INSERT INTO public.folhas_pagamento (competencia_ano, competencia_mes, tipo_folha, status, observacoes)
    VALUES (v_ano, v_mes, 'mensal', 'aberta', v_justificativa)
    RETURNING id INTO v_folha_id;

    FOR v_ficha IN SELECT e FROM jsonb_array_elements(p_fichas) e LOOP
      v_pos := v_pos + 1;
      v_ind := v_pos;
      v_avisos := '{}';
      v_nome := NULL;
      BEGIN
        IF jsonb_typeof(v_ficha) IS DISTINCT FROM 'object' THEN
          RAISE EXCEPTION 'Ficha em formato inválido.' USING ERRCODE = '22023';
        END IF;
        IF COALESCE(v_ficha->>'indice', '') ~ '^\d{1,6}$' THEN v_ind := (v_ficha->>'indice')::integer; END IF;
        v_nome := left(btrim(COALESCE(v_ficha->>'nome', '')), 200);
        v_cpf := COALESCE(v_ficha->>'cpf', '');
        IF v_cpf !~ '^\d{11}$' THEN
          RAISE EXCEPTION 'CPF ausente ou inválido no arquivo.' USING ERRCODE = '22023';
        END IF;
        IF v_cpf = ANY (v_vistos) THEN
          RAISE EXCEPTION 'O mesmo servidor aparece duas vezes no arquivo.' USING ERRCODE = '22023';
        END IF;
        v_vistos := v_vistos || v_cpf;
        IF jsonb_typeof(v_ficha->'itens') IS DISTINCT FROM 'array' OR jsonb_array_length(v_ficha->'itens') NOT BETWEEN 1 AND 200 THEN
          RAISE EXCEPTION 'Ficha sem rubricas.' USING ERRCODE = '22023';
        END IF;

        SELECT min(s.id::text)::uuid, count(*) INTO v_srv, v_qtd_srv FROM public.servidores s
         WHERE regexp_replace(COALESCE(s.cpf, ''), '[^0-9]', '', 'g') <> ''
           AND lpad(regexp_replace(s.cpf, '[^0-9]', '', 'g'), 11, '0') = v_cpf;
        IF v_qtd_srv = 0 THEN
          RAISE EXCEPTION 'Servidor não cadastrado no sistema (procurado pelo CPF): cadastre-o antes de importar.'
            USING ERRCODE = 'P0001';
        ELSIF v_qtd_srv > 1 THEN
          RAISE EXCEPTION 'O CPF está em % cadastros de servidor: junte os cadastros antes de importar.', v_qtd_srv
            USING ERRCODE = 'P0001';
        END IF;

        -- cargo e unidade do provimento vigente no mês (o mesmo critério do processamento da folha mensal)
        SELECT p.cargo_id, p.unidade_id, eo.nome AS unidade_nome, eo.sigla AS unidade_sigla INTO v_pv
          FROM public.provimentos p
          LEFT JOIN public.estrutura_organizacional eo ON eo.id = p.unidade_id
         WHERE p.servidor_id = v_srv AND p.status IN ('ativo', 'suspenso', 'encerrado')
           AND coalesce(p.data_exercicio, p.data_nomeacao) <= v_d2
           AND (p.data_encerramento IS NULL OR p.data_encerramento >= v_d1)
         ORDER BY coalesce(p.data_exercicio, p.data_nomeacao) DESC LIMIT 1;
        IF NOT FOUND THEN
          v_avisos := v_avisos || 'Sem provimento no sistema neste mês: a ficha fica sem cargo e sem unidade do cadastro.'::text;
        END IF;

        INSERT INTO public.fichas_financeiras (
          folha_id, servidor_id, competencia_ano, competencia_mes, tipo_folha, cargo_id, cargo_nome,
          unidade_id, unidade_nome, quantidade_dependentes, banco_codigo, banco_agencia, banco_conta,
          processado, data_processamento, tem_inconsistencia)
        VALUES (
          v_folha_id, v_srv, v_ano, v_mes, 'mensal', v_pv.cargo_id,
          nullif(left(btrim(COALESCE(v_ficha->>'funcao', '')), 200), ''),
          v_pv.unidade_id,
          CASE WHEN v_pv.unidade_id IS NOT NULL
               THEN COALESCE(v_pv.unidade_sigla, '') || ' - ' || COALESCE(v_pv.unidade_nome, '') END,
          CASE WHEN COALESCE(v_ficha->>'dependentes_ir', '') ~ '^\d{1,2}$' THEN (v_ficha->>'dependentes_ir')::integer ELSE 0 END,
          nullif(left(COALESCE(v_ficha->>'banco_codigo', ''), 3), ''),
          nullif(left(COALESCE(v_ficha->>'banco_agencia', ''), 10), ''),
          nullif(left(COALESCE(v_ficha->>'banco_conta', ''), 20), ''),
          true, now(), false)
        RETURNING id INTO v_ficha_id;

        v_prov := 0; v_desc := 0; v_inss := 0; v_irrf := 0; v_ordem := 0;
        FOR v_item IN SELECT e FROM jsonb_array_elements(v_ficha->'itens') e LOOP
          v_ordem := v_ordem + 1;
          v_tipo := v_item->>'tipo';
          v_descricao := left(btrim(COALESCE(v_item->>'descricao', '')), 120);
          IF v_tipo NOT IN ('provento', 'desconto') OR v_descricao = '' THEN
            RAISE EXCEPTION 'Rubrica % em formato inválido.', v_ordem USING ERRCODE = '22023';
          END IF;
          IF COALESCE(v_item->>'valor', '') !~ '^\d{1,9}(\.\d{1,2})?$' THEN
            RAISE EXCEPTION 'Valor inválido na rubrica %.', v_descricao USING ERRCODE = '22023';
          END IF;
          v_valor := (v_item->>'valor')::numeric;
          v_comp := CASE WHEN COALESCE(v_item->>'competencia', '') ~ '^20\d{2}-(0[1-9]|1[0-2])$'
                         THEN substr(v_item->>'competencia', 6, 2) || '/' || substr(v_item->>'competencia', 1, 4) END;
          INSERT INTO public.itens_ficha_financeira (ficha_id, rubrica_id, descricao, tipo, valor, referencia, ordem, origem)
          VALUES (
            v_ficha_id,
            (SELECT r.id FROM public.rubricas r
              WHERE upper(btrim(r.descricao)) = upper(v_descricao) AND r.tipo::text = v_tipo AND r.ativo
              ORDER BY r.vigencia_inicio DESC LIMIT 1),
            v_descricao || COALESCE(' (' || v_comp || ')', ''),
            v_tipo, v_valor,
            nullif(left(btrim(COALESCE(v_item->>'quantidade', '')), 40), ''),
            v_ordem, 'automatico');
          IF v_tipo = 'provento' THEN
            v_prov := v_prov + v_valor;
          ELSE
            v_desc := v_desc + v_valor;
            IF upper(v_descricao) LIKE 'INSS%' THEN v_inss := v_inss + v_valor; END IF;
            IF upper(v_descricao) LIKE 'IRRF%' THEN v_irrf := v_irrf + v_valor; END IF;
          END IF;
        END LOOP;

        -- base de INSS: o espelho não informa a incidência; nas folhas de cargo em comissão todo provento incide,
        -- então a base é o total de proventos de quem teve INSS descontado (é sobre ela que sai a parte patronal)
        UPDATE public.fichas_financeiras
           SET total_proventos = v_prov, total_descontos = v_desc, valor_liquido = v_prov - v_desc,
               valor_inss = v_inss, valor_irrf = v_irrf,
               base_inss = CASE WHEN v_inss > 0 THEN v_prov ELSE 0 END
         WHERE id = v_ficha_id;

        v_n := v_n + 1;
        v_linhas_res := v_linhas_res || jsonb_strip_nulls(jsonb_build_object(
          'indice', v_ind, 'acao', 'inserir',
          'avisos', CASE WHEN cardinality(v_avisos) > 0 THEN to_jsonb(v_avisos) END));
        v_detalhes := v_detalhes || jsonb_build_object('indice', v_ind, 'ficha_id', v_ficha_id);
      EXCEPTION
        WHEN OTHERS THEN
          v_erros := v_erros || jsonb_build_object('indice', v_ind, 'mensagem',
            COALESCE(nullif(v_nome, '') || ': ', '') ||
            CASE WHEN left(SQLSTATE, 2) IN ('22', '23') OR SQLSTATE IN ('P0001', 'RHS01', '42501') THEN SQLERRM
                 ELSE format('erro inesperado ao gravar a ficha (código %s).', SQLSTATE) END);
      END;
    END LOOP;

    -- parte patronal: mesma regra do processamento (migração 20261021100000)
    UPDATE public.fichas_financeiras
       SET inss_patronal = round(base_inss * coalesce(v_aliq_patronal, 0), 2),
           rat = round(base_inss * coalesce(v_aliq_rat, 0), 2),
           total_encargos = round(base_inss * coalesce(v_aliq_patronal, 0), 2) + round(base_inss * coalesce(v_aliq_rat, 0), 2)
     WHERE folha_id = v_folha_id AND valor_inss > 0;
    SELECT coalesce(sum(base_inss), 0) INTO v_base_patronal
      FROM public.fichas_financeiras WHERE folha_id = v_folha_id AND valor_inss > 0;

    PERFORM set_config('trilha.renovar_decisao', 'folhas_pagamento.processado_por', true);
    UPDATE public.folhas_pagamento
       SET total_bruto = COALESCE((SELECT SUM(total_proventos) FROM public.fichas_financeiras WHERE folha_id = v_folha_id), 0),
           total_descontos = COALESCE((SELECT SUM(total_descontos) FROM public.fichas_financeiras WHERE folha_id = v_folha_id), 0),
           total_liquido = COALESCE((SELECT SUM(valor_liquido) FROM public.fichas_financeiras WHERE folha_id = v_folha_id), 0),
           total_inss_servidor = COALESCE((SELECT SUM(valor_inss) FROM public.fichas_financeiras WHERE folha_id = v_folha_id), 0),
           total_irrf = COALESCE((SELECT SUM(valor_irrf) FROM public.fichas_financeiras WHERE folha_id = v_folha_id), 0),
           total_inss_patronal = trunc(v_base_patronal * coalesce(v_aliq_patronal, 0), 2),
           total_rat = trunc(v_base_patronal * coalesce(v_aliq_rat, 0), 2),
           total_encargos_patronais = trunc(v_base_patronal * coalesce(v_aliq_patronal, 0), 2)
                                      + trunc(v_base_patronal * coalesce(v_aliq_rat, 0), 2),
           quantidade_servidores = v_n,
           data_processamento = now(),
           processado_por = v_uid,
           updated_at = now()
     WHERE id = v_folha_id;
    PERFORM set_config('trilha.renovar_decisao', '', true);

    SELECT jsonb_build_object(
             'competencia', lpad(v_mes::text, 2, '0') || '/' || v_ano,
             'fichas', v_n,
             'total_bruto', f.total_bruto, 'total_descontos', f.total_descontos, 'total_liquido', f.total_liquido)
      INTO v_resumo FROM public.folhas_pagamento f WHERE f.id = v_folha_id;

    IF p_simular OR jsonb_array_length(v_erros) > 0 THEN
      RAISE EXCEPTION 'importação desfeita' USING ERRCODE = 'FSI01';
    END IF;

    v_fechamento := public.fechar_folha(v_folha_id, v_justificativa);
    IF NOT COALESCE((v_fechamento->>'success')::boolean, false) THEN
      RAISE EXCEPTION 'Não foi possível fechar a folha importada: %', COALESCE(v_fechamento->>'error', 'motivo não informado')
        USING ERRCODE = 'P0001';
    END IF;
  EXCEPTION
    WHEN SQLSTATE 'FSI01' THEN
      PERFORM set_config('trilha.renovar_decisao', '', true);
      v_folha_id := NULL;  -- desfeito: nada do que as fichas gravaram fica; as variáveis continuam valendo
  END;

  v_totais := jsonb_build_object('inserir', v_n, 'atualizar', 0, 'sem_alteracao', 0);

  IF NOT p_simular AND jsonb_array_length(v_erros) = 0 THEN
    INSERT INTO public.importacoes
      (tipo, modulo, arquivo_nome, arquivo_sha256, arquivo_tamanho, exercicio, resumo, detalhes, created_by)
    VALUES
      ('folha_sigrh', 'rh', p_arquivo->>'nome', p_arquivo->>'sha256', (p_arquivo->>'tamanho')::bigint,
       v_ano, v_resumo || jsonb_build_object('folha_id', v_folha_id, 'totais', v_totais), v_detalhes, v_uid)
    RETURNING id INTO v_import_id;
  END IF;

  RETURN jsonb_build_object(
    'simulacao', p_simular,
    'importacao_id', v_import_id,
    'folha_id', v_folha_id,
    'totais', v_totais,
    'linhas', v_linhas_res,
    'erros', v_erros
  );
END;
$$;

COMMENT ON FUNCTION public.importar_folha_sigrh(jsonb, jsonb, jsonb, boolean) IS
  'Importa a folha mensal histórica do SIGRH (fichas e rubricas por servidor, casado pelo CPF) e a fecha; p_simular = true só calcula; tudo ou nada; recusa competência que já tem folha mensal. Exige módulo rh, financeiro.folha.processar e poder fechar a folha. Migração 20261022090000.';

REVOKE ALL ON FUNCTION public.importar_folha_sigrh(jsonb, jsonb, jsonb, boolean) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.importar_folha_sigrh(jsonb, jsonb, jsonb, boolean) TO authenticated;
