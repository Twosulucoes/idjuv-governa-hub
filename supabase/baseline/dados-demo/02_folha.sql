-- Dados FICTÍCIOS de demonstração — Folha de pagamento. Só para o banco de TESTE, depois de dados-teste.sql.
-- Guia: docs/NOVO_BANCO.md §9.
--
-- O que entra: identidade da instituição para a folha (config_autarquia, com os dados do próprio cliente), contas
-- da instituição, configuração de fechamento, rubricas de uso do dia a dia, atos remuneratórios (dois aplicados pela
-- RPC, um em rascunho), dependentes de IRRF, consignações e pensões alimentícias; depois as folhas de 07/2026 a
-- 10/2026 e o 13º (1ª parcela), com as fichas CALCULADAS pelo próprio banco (processar_folha_pagamento), lançamentos
-- avulsos na ficha e reprocessamento, conferência, fechamento, reabertura, remessas CNAB 240 (uma cancelada pela
-- RPC), retornos do banco (registrar_retorno_remessa), eventos do eSocial em rascunho e exportações.
-- Pessoas, CPFs, CNPJs de terceiros e contas bancárias são inventados (CPF/CNPJ só válidos no dígito).
\set ON_ERROR_STOP on
\if :{?confirmo}
\else
  \set confirmo ''
\endif
BEGIN;
SELECT set_config('teste.confirmo', :'confirmo', true) AS _ \gset
DO $$
BEGIN
  IF current_setting('teste.confirmo') IS DISTINCT FROM 'banco_de_teste' THEN
    RAISE EXCEPTION 'recusado: rode com -v confirmo=banco_de_teste (e só num banco de TESTE)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.servidores WHERE id = 'c0000000-0000-4000-8000-000000000001') THEN
    RAISE EXCEPTION 'recusado: rode antes o supabase/baseline/dados-teste.sql';
  END IF;
  -- só a folha desta demonstração conta: o banco de teste pode já ter folha criada por quem testou a tela
  IF EXISTS (SELECT 1 FROM public.folhas_pagamento WHERE id = 'd2000000-0000-4000-8000-000000000001') THEN
    RAISE EXCEPTION 'recusado: os dados de demonstração deste módulo já foram carregados';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE servidor_id = 'c0000000-0000-4000-8000-000000000001') THEN
    RAISE EXCEPTION 'recusado: o login de teste não está ligado ao servidor fictício (rode o dados-teste.sql com -v email=...)';
  END IF;
END $$;
-- quem "faz" as ações (auth.uid() nos triggers de autoria): o login de teste ligado ao servidor fictício
SELECT set_config('request.jwt.claim.sub', coalesce((SELECT id::text FROM public.profiles
  WHERE servidor_id = 'c0000000-0000-4000-8000-000000000001'), ''), true) AS _ \gset
SELECT set_config('request.jwt.claim.role', 'authenticated', true) AS _ \gset

-- ===================================================================== utilitários (só nesta sessão)
CREATE FUNCTION pg_temp.cpf(base text) RETURNS text LANGUAGE plpgsql AS $f$
DECLARE s int; d1 int; d2 int; i int;
BEGIN
  s := 0; FOR i IN 1..9 LOOP s := s + substr(base, i, 1)::int * (11 - i); END LOOP;
  d1 := 11 - s % 11; IF d1 >= 10 THEN d1 := 0; END IF;
  s := 0; FOR i IN 1..9 LOOP s := s + substr(base, i, 1)::int * (12 - i); END LOOP;
  s := s + d1 * 2; d2 := 11 - s % 11; IF d2 >= 10 THEN d2 := 0; END IF;
  RETURN base || d1 || d2;
END $f$;

-- CNPJ formatado com dígitos válidos a partir dos 12 primeiros dígitos (inventados)
CREATE FUNCTION pg_temp.cnpj(base text) RETURNS text LANGUAGE plpgsql AS $f$
DECLARE p1 int[] := '{5,4,3,2,9,8,7,6,5,4,3,2}'; p2 int[] := '{6,5,4,3,2,9,8,7,6,5,4,3,2}';
        s int := 0; d1 int; d2 int; i int; n text;
BEGIN
  FOR i IN 1..12 LOOP s := s + substr(base, i, 1)::int * p1[i]; END LOOP;
  d1 := CASE WHEN s % 11 < 2 THEN 0 ELSE 11 - s % 11 END;
  n := base || d1; s := 0;
  FOR i IN 1..13 LOOP s := s + substr(n, i, 1)::int * p2[i]; END LOOP;
  d2 := CASE WHEN s % 11 < 2 THEN 0 ELSE 11 - s % 11 END;
  n := n || d2;
  RETURN substr(n, 1, 2) || '.' || substr(n, 3, 3) || '.' || substr(n, 6, 3) || '/' || substr(n, 9, 4) || '-' || substr(n, 13, 2);
END $f$;

CREATE FUNCTION pg_temp.srv(n int) RETURNS uuid LANGUAGE sql AS $f$
  SELECT ('c0000000-0000-4000-8000-0000000000' || lpad(n::text, 2, '0'))::uuid
$f$;

CREATE FUNCTION pg_temp.rub(c text) RETURNS uuid LANGUAGE sql AS $f$
  SELECT id FROM public.rubricas WHERE codigo = c
$f$;

-- lançamento avulso na ficha (o que a tela "Incluir item" grava); o reprocessamento o mantém e recalcula INSS/IRRF
CREATE FUNCTION pg_temp.lancar(p_folha uuid, p_srvs int[], p_rubrica text, p_valor numeric, p_ref text DEFAULT NULL,
                               p_base numeric DEFAULT NULL, p_perc numeric DEFAULT NULL) RETURNS void LANGUAGE plpgsql AS $f$
DECLARE v_ficha uuid; v_r record; p_srv int;
BEGIN
  FOREACH p_srv IN ARRAY p_srvs LOOP
  SELECT id INTO v_ficha FROM public.fichas_financeiras WHERE folha_id = p_folha AND servidor_id = pg_temp.srv(p_srv);
  IF v_ficha IS NULL THEN RAISE EXCEPTION 'ficha do servidor % não existe na folha %', p_srv, p_folha; END IF;
  SELECT id, descricao, tipo::text AS tipo INTO v_r FROM public.rubricas WHERE codigo = p_rubrica;
  INSERT INTO public.itens_ficha_financeira (ficha_id, rubrica_id, descricao, tipo, valor, referencia, base_calculo, percentual, ordem, origem)
  VALUES (v_ficha, v_r.id, v_r.descricao, v_r.tipo, p_valor, p_ref, p_base, p_perc, 900, 'manual');
  END LOOP;
END $f$;

CREATE FUNCTION pg_temp.processar(p_folha uuid) RETURNS void LANGUAGE plpgsql AS $f$
DECLARE r jsonb;
BEGIN
  r := public.processar_folha_pagamento(p_folha);
  IF NOT coalesce((r ->> 'sucesso')::boolean, false) OR jsonb_array_length(coalesce(r -> 'erros', '[]')) > 0 THEN
    RAISE EXCEPTION 'processar_folha_pagamento(%) falhou: %', p_folha, r;
  END IF;
END $f$;

CREATE FUNCTION pg_temp.ok(r jsonb, o text) RETURNS void LANGUAGE plpgsql AS $f$
BEGIN
  IF NOT coalesce((r ->> 'success')::boolean, false) THEN RAISE EXCEPTION '% falhou: %', o, r; END IF;
END $f$;

-- retorno do banco pela RPC do sistema. p_modo: 'final' (créditos pagos) ou 'previa' (agendados).
-- p_rejeitar: servidor cujo crédito volta recusado (conta do favorecido inválida).
CREATE FUNCTION pg_temp.retorno(p_remessa uuid, p_modo text, p_pagto date, p_arquivo text, p_nsa int,
                                p_rejeitar uuid DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql AS $f$
DECLARE v_rem record; v_itens jsonb;
BEGIN
  SELECT r.*, c.convenio_pagamento INTO v_rem
    FROM public.remessas_bancarias r JOIN public.contas_autarquia c ON c.id = r.conta_autarquia_id WHERE r.id = p_remessa;
  IF v_rem.tipo_credito = 'pensao' THEN
    SELECT jsonb_agg(jsonb_build_object(
             'ficha_id', f.id, 'identificador', left(replace(i.id::text, '-', ''), 20), 'favorecido_nome', pa.beneficiario_nome,
             'valor', i.valor, 'status', CASE WHEN p_modo = 'previa' THEN 'agendado' ELSE 'pago' END,
             'codigo_ocorrencia', CASE WHEN p_modo = 'previa' THEN 'BD' ELSE '00' END,
             'descricao_ocorrencia', NULL, 'data_pagamento', p_pagto) ORDER BY pa.beneficiario_nome)
      INTO v_itens
      FROM public.fichas_financeiras f
      JOIN public.itens_ficha_financeira i ON i.ficha_id = f.id AND i.tipo = 'desconto' AND i.valor > 0
      JOIN public.pensoes_alimenticias pa ON pa.servidor_id = f.servidor_id AND i.descricao = 'Pensão alimentícia — ' || pa.beneficiario_nome
     WHERE f.folha_id = v_rem.folha_id AND coalesce(pa.banco_conta, '') <> '';
  ELSE
    SELECT jsonb_agg(jsonb_build_object(
             'ficha_id', f.id, 'identificador', left(f.id::text, 20), 'favorecido_nome', s.nome_completo, 'valor', f.valor_liquido,
             'status', CASE WHEN f.servidor_id = p_rejeitar THEN 'rejeitado' WHEN p_modo = 'previa' THEN 'agendado' ELSE 'pago' END,
             'codigo_ocorrencia', CASE WHEN f.servidor_id = p_rejeitar THEN 'AN' WHEN p_modo = 'previa' THEN 'BD' ELSE '00' END,
             'descricao_ocorrencia', CASE WHEN f.servidor_id = p_rejeitar THEN 'AN: Conta corrente/DV do favorecido inválido' END,
             'data_pagamento', CASE WHEN f.servidor_id = p_rejeitar THEN NULL ELSE p_pagto END) ORDER BY s.nome_completo)
      INTO v_itens
      FROM public.fichas_financeiras f JOIN public.servidores s ON s.id = f.servidor_id
     WHERE f.folha_id = v_rem.folha_id AND f.valor_liquido > 0;
  END IF;
  RETURN public.registrar_retorno_remessa(p_remessa,
    jsonb_build_object('arquivo_nome', p_arquivo, 'arquivo_sha256', encode(sha256(convert_to(p_arquivo || p_remessa::text, 'UTF8')), 'hex'),
                       'nsa', p_nsa, 'data_arquivo', p_pagto - CASE WHEN p_modo = 'previa' THEN 2 ELSE 0 END,
                       'convenio', v_rem.convenio_pagamento, 'previa', p_modo = 'previa'),
    v_itens);
END $f$;

-- eventos do eSocial como a tela "Gerar eSocial" grava (rascunho, não transmitido): S-1200 e S-1210 por ficha e o
-- S-1299 da competência. Os servidores do dados-teste não têm PIS/PASEP: a tela marca o S-1200 com erro, e aqui também.
CREATE FUNCTION pg_temp.esocial(p_folha uuid, p_pagto date, p_gerado timestamptz) RETURNS void LANGUAGE plpgsql AS $f$
DECLARE
  v_f record; v_ficha record; v_seq int := 1; v_raiz text := '64689510'; v_cnpj text := '64689510000109';
  v_per text; v_id text; v_dm text; v_verbas text; v_json jsonb; v_xml text; v_ts text := to_char(p_gerado, 'YYYYMMDDHH24MISS');
  v_nr text := lpad('64689510', 14, '0'); v_erros text;
BEGIN
  SELECT * INTO v_f FROM public.folhas_pagamento WHERE id = p_folha;
  v_per := v_f.competencia_ano || '-' || lpad(v_f.competencia_mes::text, 2, '0');
  FOR v_ficha IN SELECT f.*, s.cpf, s.pis_pasep, s.matricula, s.nome_completo FROM public.fichas_financeiras f
                   JOIN public.servidores s ON s.id = f.servidor_id WHERE f.folha_id = p_folha ORDER BY s.matricula, f.id LOOP
    v_dm := left(replace(v_ficha.id::text, '-', ''), 30);
    -- S-1200
    v_id := 'ID1' || v_nr || v_ts || lpad(v_seq::text, 5, '0');
    SELECT string_agg(format(E'        <detVerbas>\n          <codRubr>%s</codRubr>\n          <ideTabRubr>01</ideTabRubr>\n          <vrRubr>%s</vrRubr>\n        </detVerbas>',
                             coalesce(r.codigo, CASE i.tipo WHEN 'provento' THEN 'VENC001' ELSE 'DESC001' END), to_char(i.valor, 'FM999999990.00')), E'\n' ORDER BY i.ordem)
      INTO v_verbas
      FROM public.itens_ficha_financeira i LEFT JOIN public.rubricas r ON r.id = i.rubrica_id WHERE i.ficha_id = v_ficha.id;
    v_xml := format(E'<?xml version="1.0" encoding="UTF-8"?>\n<!-- RASCUNHO NAO TRANSMITIDO -->\n<eSocial xmlns="http://www.esocial.gov.br/schema/evt/evtRemun/v_S_01_03_00">\n  <evtRemun Id="%s">\n    <ideEvento>\n      <indRetif>1</indRetif>\n      <perApur>%s</perApur>\n      <tpAmb>2</tpAmb>\n      <procEmi>1</procEmi>\n      <verProc>GovernaHub_1.0.0</verProc>\n    </ideEvento>\n    <ideEmpregador>\n      <tpInsc>1</tpInsc>\n      <nrInsc>%s</nrInsc>\n    </ideEmpregador>\n    <ideTrabalhador>\n      <cpfTrab>%s</cpfTrab>\n    </ideTrabalhador>\n    <dmDev>\n      <ideDmDev>%s</ideDmDev>\n      <codCateg>101</codCateg>\n      <infoPerApur>\n        <ideEstabLot>\n          <tpInsc>1</tpInsc>\n          <nrInsc>%s</nrInsc>\n          <codLotacao>001</codLotacao>\n%s\n        </ideEstabLot>\n      </infoPerApur>\n    </dmDev>\n  </evtRemun>\n</eSocial>',
                    v_id, v_per, v_raiz, v_ficha.cpf, v_dm, v_cnpj, v_verbas);
    v_json := jsonb_build_object('ideEvento', jsonb_build_object('indRetif', 1, 'perApur', v_per, 'tpAmb', 2, 'procEmi', 1, 'verProc', 'GovernaHub_1.0.0'),
      'ideEmpregador', jsonb_build_object('tpInsc', 1, 'nrInsc', v_raiz), 'ideTrabalhador', jsonb_build_object('cpfTrab', v_ficha.cpf),
      'dmDev', jsonb_build_array(jsonb_build_object('ideDmDev', v_dm, 'codCateg', 101)));
    v_erros := CASE WHEN length(coalesce(v_ficha.pis_pasep, '')) < 10 THEN 'PIS/PASEP inválido ou ausente' END;
    INSERT INTO public.eventos_esocial (tipo_evento, folha_id, servidor_id, competencia_ano, competencia_mes, id_evento, payload, payload_xml,
                                        status, mensagem_retorno, gerado_por, data_geracao)
    VALUES ('S-1200', p_folha, v_ficha.servidor_id, v_f.competencia_ano, v_f.competencia_mes, v_id, v_json, v_xml,
            CASE WHEN v_erros IS NULL THEN 'pendente' ELSE 'erro' END::public.status_evento_esocial, v_erros, auth.uid(), p_gerado);
    v_seq := v_seq + 1;
    -- S-1210
    v_id := 'ID1' || v_nr || v_ts || lpad(v_seq::text, 5, '0');
    v_xml := format(E'<?xml version="1.0" encoding="UTF-8"?>\n<!-- RASCUNHO NAO TRANSMITIDO -->\n<eSocial xmlns="http://www.esocial.gov.br/schema/evt/evtPgtos/v_S_01_03_00">\n  <evtPgtos Id="%s">\n    <ideEvento>\n      <indRetif>1</indRetif>\n      <perApur>%s</perApur>\n      <tpAmb>2</tpAmb>\n      <procEmi>1</procEmi>\n      <verProc>GovernaHub_1.0.0</verProc>\n    </ideEvento>\n    <ideEmpregador>\n      <tpInsc>1</tpInsc>\n      <nrInsc>%s</nrInsc>\n    </ideEmpregador>\n    <ideBenef>\n      <cpfBenef>%s</cpfBenef>\n      <infoPgto>\n        <dtPgto>%s</dtPgto>\n        <tpPgto>1</tpPgto>\n        <perRef>%s</perRef>\n        <ideDmDev>%s</ideDmDev>\n        <vrLiq>%s</vrLiq>\n      </infoPgto>\n    </ideBenef>\n  </evtPgtos>\n</eSocial>',
                    v_id, to_char(p_pagto, 'YYYY-MM'), v_raiz, v_ficha.cpf, p_pagto, v_per, v_dm, to_char(v_ficha.valor_liquido, 'FM999999990.00'));
    v_json := jsonb_build_object('ideEvento', jsonb_build_object('indRetif', 1, 'perApur', to_char(p_pagto, 'YYYY-MM'), 'tpAmb', 2, 'procEmi', 1, 'verProc', 'GovernaHub_1.0.0'),
      'ideEmpregador', jsonb_build_object('tpInsc', 1, 'nrInsc', v_raiz),
      'ideBenef', jsonb_build_object('cpfBenef', v_ficha.cpf, 'infoPgto', jsonb_build_array(jsonb_build_object(
        'dtPgto', p_pagto, 'tpPgto', 1, 'perRef', v_per, 'ideDmDev', v_dm, 'vrLiq', v_ficha.valor_liquido))));
    INSERT INTO public.eventos_esocial (tipo_evento, folha_id, servidor_id, competencia_ano, competencia_mes, id_evento, payload, payload_xml,
                                        status, gerado_por, data_geracao)
    VALUES ('S-1210', p_folha, v_ficha.servidor_id, v_f.competencia_ano, v_f.competencia_mes, v_id, v_json, v_xml, 'pendente', auth.uid(), p_gerado);
    v_seq := v_seq + 1;
  END LOOP;
  -- S-1299
  v_id := 'ID1' || v_nr || v_ts || lpad(v_seq::text, 5, '0');
  v_xml := format(E'<?xml version="1.0" encoding="UTF-8"?>\n<!-- RASCUNHO NAO TRANSMITIDO -->\n<eSocial xmlns="http://www.esocial.gov.br/schema/evt/evtFechaEvPer/v_S_01_03_00">\n  <evtFechaEvPer Id="%s">\n    <ideEvento>\n      <perApur>%s</perApur>\n      <tpAmb>2</tpAmb>\n      <procEmi>1</procEmi>\n      <verProc>GovernaHub_1.0.0</verProc>\n    </ideEvento>\n    <ideEmpregador>\n      <tpInsc>1</tpInsc>\n      <nrInsc>%s</nrInsc>\n    </ideEmpregador>\n    <infoFech>\n      <evtRemun>S</evtRemun>\n      <evtPgtos>S</evtPgtos>\n      <evtAqProd>N</evtAqProd>\n      <evtComProd>N</evtComProd>\n      <evtContratAvNP>N</evtContratAvNP>\n      <evtInfoComplPer>N</evtInfoComplPer>\n    </infoFech>\n  </evtFechaEvPer>\n</eSocial>',
                  v_id, v_per, v_raiz);
  INSERT INTO public.eventos_esocial (tipo_evento, folha_id, servidor_id, competencia_ano, competencia_mes, id_evento, payload, payload_xml,
                                      status, gerado_por, data_geracao)
  VALUES ('S-1299', p_folha, NULL, v_f.competencia_ano, v_f.competencia_mes, v_id,
          jsonb_build_object('ideEvento', jsonb_build_object('perApur', v_per, 'tpAmb', 2, 'procEmi', 1, 'verProc', 'GovernaHub_1.0.0'),
                             'ideEmpregador', jsonb_build_object('tpInsc', 1, 'nrInsc', v_raiz),
                             'infoFech', jsonb_build_object('evtRemun', 'S', 'evtPgtos', 'S', 'evtAqProd', 'N', 'evtComProd', 'N',
                                                            'evtContratAvNP', 'N', 'evtInfoComplPer', 'N')),
          v_xml, 'pendente', auth.uid(), p_gerado);
END $f$;

-- ===================================================================== instituição, contas e configuração
-- Identidade da instituição: a do próprio cliente (perfil tenants/idjuv). O CPF do dirigente não é preenchido.
INSERT INTO public.config_autarquia (id, cnpj, razao_social, nome_fantasia, endereco_logradouro, endereco_numero, endereco_bairro,
  endereco_cidade, endereco_uf, endereco_cep, telefone, email_institucional, site, responsavel_legal, cargo_responsavel,
  responsavel_contabil, cpf_contabil, crc_contabil, regime_tributario, natureza_juridica, codigo_municipio,
  esocial_ambiente, esocial_processo_emissao, ativo) VALUES
  ('d2000000-0000-4000-8000-0000000000a1', '64.689.510/0001-09',
   'Instituto de Desporto, Juventude e Lazer do Estado de Roraima – IDJuv', 'IDJuv',
   'Av. Brigadeiro Eduardo Gomes', '3232', 'Estados', 'Boa Vista', 'RR', '69305-455', '(95) 9133-0044',
   'idjuv.gab@gmail.com', 'https://idjuv.online', 'Marcelo de Magalhães Nunes', 'Presidente',
   'Rosângela Aguiar Pimentel', pg_temp.cpf('483217906'), 'CRC-RR 001284/O-7', 'autarquia_estadual', '1104',
   '1400100', 'producao_restrita', '1', true);

INSERT INTO public.contas_autarquia (id, banco_id, descricao, agencia, agencia_digito, conta, conta_digito, tipo_conta,
  convenio_pagamento, codigo_cedente, codigo_transmissao, uso_principal, nsa_inicial, obn_codigo_cliente, obn_unidade_gestora, obn_gestao, ativo) VALUES
  ('d2000000-0000-4000-8000-0000000000b1', (SELECT id FROM public.bancos_cnab WHERE codigo_banco = '001'),
   'Banco do Brasil – Folha de Pagamento', '2617', '5', '104563', '3', 'corrente', '000784512', NULL, NULL, 'folha', 152, NULL, NULL, NULL, true),
  ('d2000000-0000-4000-8000-0000000000b2', (SELECT id FROM public.bancos_cnab WHERE codigo_banco = '104'),
   'Caixa Econômica Federal – 13º Salário', '0610', '0', '00004128', '9', 'corrente', '421536', NULL, NULL, 'decimo', NULL, NULL, NULL, NULL, true),
  ('d2000000-0000-4000-8000-0000000000b3', (SELECT id FROM public.bancos_cnab WHERE codigo_banco = '001'),
   'Banco do Brasil – Conta Movimento (pagamentos)', '2617', '5', '107215', '0', 'corrente', '000784513', NULL, NULL, 'pagamentos', NULL, '000318442', '540001', '00001', true),
  ('d2000000-0000-4000-8000-0000000000b4', (SELECT id FROM public.bancos_cnab WHERE codigo_banco = '003'),
   'Banco da Amazônia – antiga conta da folha (encerrada)', '0041', NULL, '0098214', '6', 'corrente', NULL, NULL, NULL, 'folha', NULL, NULL, NULL, NULL, false);

INSERT INTO public.config_fechamento_folha (id, nome, descricao, dia_limite_lancamento, dia_limite_processamento, dia_pagamento,
  bloqueia_alteracoes, permite_reabertura, exige_aprovacao_reabertura, perfil_aprovador_reabertura, exige_frequencia_fechada,
  exige_todas_fichas_processadas, exige_validacao_inconsistencias, permite_fechar_com_pendencias, gera_remessa_automatica,
  conta_remessa_padrao_id, gera_esocial_automatico, registra_historico_alteracoes, prazo_guarda_historico_dias, padrao, ativo) VALUES
  ('d2000000-0000-4000-8000-0000000000c1', 'Calendário da folha mensal',
   'Lançamentos até o dia 18, processamento até o dia 22 e crédito no dia 30 (ou no dia útil anterior).',
   18, 22, 30, true, true, true, 'admin', true, true, true, false, false, 'd2000000-0000-4000-8000-0000000000b1', false, true, 1825, true, true),
  ('d2000000-0000-4000-8000-0000000000c2', 'Calendário do 13º salário',
   '1ª parcela com a folha de julho; 2ª parcela até 20 de dezembro.',
   10, 15, 20, true, true, true, 'admin', false, true, true, false, false, 'd2000000-0000-4000-8000-0000000000b2', false, true, 1825, false, true);

INSERT INTO public.config_compensacao (id, codigo, nome, permite_banco_horas, compensacao_automatica, compensacao_manual,
  prazo_compensar_dias, limite_acumulo_horas, limite_horas_extras_dia, limite_horas_extras_mes, quem_autoriza,
  exibe_na_frequencia, exibe_na_impressao, aplicar_a_todos, unidade_id, padrao, ativo) VALUES
  ('d2000000-0000-4000-8000-0000000000c5', 'PADRAO', 'Banco de horas – regra geral', true, false, true, 90, 40, 2, 40, 'chefia',
   true, true, true, NULL, true, true),
  ('d2000000-0000-4000-8000-0000000000c6', 'DIESP-EVENTOS', 'Banco de horas – equipes de eventos esportivos', true, false, true, 120, 60, 4, 60, 'ambos',
   true, true, false, 'a0000000-0000-4000-8000-000000000003', false, true);

-- ===================================================================== rubricas de uso corrente
INSERT INTO public.rubricas (codigo, descricao, tipo, natureza, incide_inss, incide_irrf, incide_13, incide_ferias, incide_base_consignavel,
  formula_tipo, formula_valor, prioridade_desconto, ordem_calculo, vigencia_inicio, codigo_esocial, ativo, observacoes) VALUES
  ('1105', 'Gratificação por Encargo de Curso ou Concurso', 'provento', 'remuneratorio', true, true, false, false, false,
   'quantidade_valor', 98.50, 100, 30, '2026-01-01', '1099', true, 'Valor por hora-aula de instrutoria interna'),
  ('1130', 'Gratificação de Atividade Desportiva', 'provento', 'remuneratorio', true, true, true, true, true,
   'percentual_base', 15, 100, 20, '2026-01-01', '1099', true, 'Professores de Educação Física em atividade de campo'),
  ('1210', 'Auxílio-Alimentação', 'provento', 'indenizatorio', false, false, false, false, false,
   'valor_fixo', 600, 100, 40, '2026-01-01', '1810', true, NULL),
  ('1220', 'Auxílio-Transporte', 'provento', 'indenizatorio', false, false, false, false, false,
   'valor_fixo', 220, 100, 41, '2026-01-01', '1811', true, 'Pago a quem recebe até três salários mínimos'),
  ('2110', 'Reposição ao Erário', 'desconto', 'informativo', false, false, false, false, false,
   'calculo_especial', NULL, 50, 120, '2026-01-01', '9213', true, 'Parcelamento de valores recebidos a maior'),
  ('2120', 'Plano de Saúde – Coparticipação', 'desconto', 'informativo', false, false, false, false, false,
   'calculo_especial', NULL, 80, 130, '2026-01-01', '9219', true, NULL);

INSERT INTO public.rubricas_historico (rubrica_id, versao, dados_anteriores, dados_novos, campos_alterados, justificativa, alterado_em, alterado_por) VALUES
  (pg_temp.rub('1210'), 1, '{}'::jsonb,
   jsonb_build_object('codigo', '1210', 'descricao', 'Auxílio-Alimentação', 'formula_tipo', 'valor_fixo', 'formula_valor', 550),
   ARRAY['codigo', 'descricao', 'formula_tipo', 'formula_valor'], 'Cadastro da rubrica', '2025-01-06 09:12-04', auth.uid()),
  (pg_temp.rub('1210'), 2, jsonb_build_object('formula_valor', 550), jsonb_build_object('formula_valor', 600),
   ARRAY['formula_valor'], 'Portaria nº 018/2026 – atualização do auxílio-alimentação a partir de janeiro', '2026-01-08 14:30-04', auth.uid()),
  (pg_temp.rub('1220'), 1, '{}'::jsonb,
   jsonb_build_object('codigo', '1220', 'descricao', 'Auxílio-Transporte', 'formula_tipo', 'valor_fixo', 'formula_valor', 220),
   ARRAY['codigo', 'descricao', 'formula_tipo', 'formula_valor'], 'Cadastro da rubrica', '2026-01-08 14:41-04', auth.uid());

-- ===================================================================== atos remuneratórios (aplicados pela RPC do sistema)
INSERT INTO public.atos_remuneratorios (id, tipo_ato, numero, data_ato, data_publicacao, vigencia_inicio, ementa, percentual, processo_sei, link_publicacao, observacoes) VALUES
  ('d2000000-0000-4000-8000-0000000000e1', 'lei', '2.214/2026', '2026-07-14', '2026-07-16', '2026-08-01',
   'Concede revisão geral anual de 5% aos vencimentos dos servidores efetivos do IDJuv.', 5, '00000.004187/2026-31', NULL,
   'Publicada no DOE nº 5.012, de 16/07/2026'),
  ('d2000000-0000-4000-8000-0000000000e2', 'portaria', '214/2026', '2026-08-20', '2026-08-24', '2026-09-01',
   'Reajusta o valor mensal do auxílio-alimentação para R$ 650,00.', NULL, '00000.005322/2026-08', NULL, NULL),
  ('d2000000-0000-4000-8000-0000000000e3', 'decreto', 'Minuta 03/2026', '2026-10-15', NULL, '2027-01-01',
   'Atualiza a dedução mensal por dependente do IRRF para 2027 (em análise na Procuradoria).', NULL, '00000.006904/2026-15', NULL,
   'Aguardando parecer jurídico');
INSERT INTO public.atos_remuneratorios_itens (ato_id, alvo, cargo_id, rubrica_id, tipo_parametro, valor_novo, observacao) VALUES
  ('d2000000-0000-4000-8000-0000000000e1', 'cargo', 'b0000000-0000-4000-8000-000000000005', NULL, NULL, 5040.00, 'Analista Administrativo'),
  ('d2000000-0000-4000-8000-0000000000e1', 'cargo', 'b0000000-0000-4000-8000-000000000006', NULL, NULL, 3045.00, 'Assistente Administrativo'),
  ('d2000000-0000-4000-8000-0000000000e1', 'cargo', 'b0000000-0000-4000-8000-000000000007', NULL, NULL, 5355.00, 'Professor de Educação Física'),
  ('d2000000-0000-4000-8000-0000000000e2', 'rubrica', NULL, pg_temp.rub('1210'), NULL, 650.00, NULL),
  ('d2000000-0000-4000-8000-0000000000e3', 'parametro', NULL, NULL, 'deducao_dependente_irrf', 198.49, 'Valor proposto');
SELECT public.aplicar_ato_remuneratorio('d2000000-0000-4000-8000-0000000000e1') AS _ \gset
SELECT public.aplicar_ato_remuneratorio('d2000000-0000-4000-8000-0000000000e2') AS _ \gset
INSERT INTO public.rubricas_historico (rubrica_id, versao, dados_anteriores, dados_novos, campos_alterados, justificativa, alterado_em, alterado_por) VALUES
  (pg_temp.rub('1210'), 3, jsonb_build_object('formula_valor', 600), jsonb_build_object('formula_valor', 650),
   ARRAY['formula_valor'], 'Portaria nº 214/2026 (ato remuneratório aplicado), vigência a partir de 01/09/2026', now(), auth.uid());

-- ===================================================================== dependentes, consignações e pensões
INSERT INTO public.dependentes_irrf (servidor_id, nome, cpf, data_nascimento, tipo_dependente, grau_instrucao, deduz_irrf,
  data_inicio_deducao, data_fim_deducao, observacoes, ativo) VALUES
  (pg_temp.srv(3),  'Lucas Andrade Bastos',     pg_temp.cpf('518204736'), '2012-04-18', 'filho', 'Fundamental incompleto', true, '2023-02-01', NULL, NULL, true),
  (pg_temp.srv(4),  'Rafael Sales Cordeiro',    pg_temp.cpf('527310948'), '2010-01-27', 'filho', 'Fundamental incompleto', true, '2023-02-01', NULL, NULL, true),
  (pg_temp.srv(4),  'Henrique Cordeiro Lima',   pg_temp.cpf('536427150'), '1981-06-11', 'conjuge', 'Superior completo', true, '2023-02-01', NULL, 'Sem rendimentos tributáveis', true),
  (pg_temp.srv(6),  'Beatriz Lins Carvalho',    pg_temp.cpf('545533362'), '2018-03-05', 'filho', 'Fundamental incompleto', true, '2023-04-03', NULL, NULL, true),
  (pg_temp.srv(9),  'Gabriel Costa Medeiros',   pg_temp.cpf('554649574'), '2003-07-14', 'filho_universitario', 'Superior incompleto', true, '2021-01-01', '2027-07-13', 'Declaração de matrícula 2026/2', true),
  (pg_temp.srv(10), 'Raimunda Rocha Antunes',   pg_temp.cpf('563755786'), '1952-02-09', 'pai_mae_avos', 'Fundamental completo', true, '2024-01-01', NULL, 'Mãe; sem rendimentos acima do limite', true),
  (pg_temp.srv(13), 'Davi Rocha Cunha',         pg_temp.cpf('572861998'), '2019-11-30', 'filho', 'Educação infantil', true, '2019-12-01', NULL, NULL, true),
  (pg_temp.srv(13), 'Laura Rocha Cunha',        pg_temp.cpf('581978101'), '2026-08-03', 'filho', NULL, true, '2026-08-01', NULL, 'Certidão de nascimento entregue em 10/08/2026', true),
  (pg_temp.srv(16), 'Pedro Duarte Fontes',      pg_temp.cpf('590184313'), '2001-08-08', 'filho_universitario', 'Superior completo', true, '2024-06-03', '2025-08-07', 'Completou 24 anos', false);

INSERT INTO public.consignacoes (id, servidor_id, rubrica_id, consignataria_nome, consignataria_cnpj, consignataria_codigo, numero_contrato,
  tipo_consignacao, valor_total, valor_parcela, total_parcelas, parcelas_pagas, saldo_devedor, data_inicio, data_fim,
  competencia_inicio, competencia_fim, ativo, suspenso, motivo_suspensao, data_suspensao, quitado, data_quitacao, observacoes) VALUES
  ('d2000000-0000-4000-8000-000000000101', pg_temp.srv(2), NULL, 'Banco Caburaí de Crédito S.A.', pg_temp.cnpj('318470250001'), '0412',
   'CCB-2025/0048213', 'emprestimo', 61797.60, 1287.45, 48, 14, 43773.30, '2025-05-01', '2029-04-30', '2025-05', '2029-04', true, false, NULL, NULL, false, NULL, NULL),
  ('d2000000-0000-4000-8000-000000000102', pg_temp.srv(3), NULL, 'Cooperativa de Crédito dos Servidores Públicos de Roraima – Credserv', pg_temp.cnpj('207813640001'), '0157',
   'CS-118742', 'emprestimo', 30322.80, 842.30, 36, 22, 11792.20, '2024-09-01', '2027-08-31', '2024-09', '2027-08', true, false, NULL, NULL, false, NULL, NULL),
  ('d2000000-0000-4000-8000-000000000103', pg_temp.srv(9), NULL, 'Cooperativa de Crédito dos Servidores Públicos de Roraima – Credserv', pg_temp.cnpj('207813640001'), '0157',
   'CS-131905', 'emprestimo', 12402.72, 516.78, 24, 5, 9818.82, '2026-02-01', '2028-01-31', '2026-02', '2028-01', true, false, NULL, NULL, false, NULL, NULL),
  ('d2000000-0000-4000-8000-000000000104', pg_temp.srv(11), NULL, 'Tepequém Administradora de Cartões Ltda.', pg_temp.cnpj('412975630001'), '0233',
   '5521-****-****-7740', 'cartao_credito', NULL, 145.90, 60, 8, NULL, '2026-01-01', NULL, '2026-01', NULL, true, false, NULL, NULL, false, NULL, 'Reserva de margem do cartão consignado'),
  ('d2000000-0000-4000-8000-000000000105', pg_temp.srv(14), NULL, 'Associação dos Servidores do IDJuv – ASIDJUV', pg_temp.cnpj('098564120001'), '0301',
   'ASS-0087', 'mensalidade_associativa', NULL, 52.00, 120, 30, NULL, '2024-02-01', NULL, '2024-02', NULL, true, false, NULL, NULL, false, NULL, NULL),
  ('d2000000-0000-4000-8000-000000000106', pg_temp.srv(13), NULL, 'Unimédica Roraima Cooperativa de Saúde', pg_temp.cnpj('153620870001'), '0510',
   'PS-77310', 'plano_saude', NULL, 389.60, 120, 41, NULL, '2023-03-01', NULL, '2023-03', NULL, true, false, NULL, NULL, false, NULL, 'Titular e dois dependentes'),
  ('d2000000-0000-4000-8000-000000000107', pg_temp.srv(5), NULL, 'Banco Caburaí de Crédito S.A.', pg_temp.cnpj('318470250001'), '0412',
   'CCB-2025/0051877', 'emprestimo', 27360.00, 760.00, 36, 12, 18240.00, '2025-07-01', '2028-06-30', '2025-07', '2028-06', true, false, NULL, NULL, false, NULL, NULL),
  ('d2000000-0000-4000-8000-000000000108', pg_temp.srv(17), NULL, 'Cooperativa de Crédito dos Servidores Públicos de Roraima – Credserv', pg_temp.cnpj('207813640001'), '0157',
   'CS-104477', 'emprestimo', 7416.00, 618.00, 12, 12, 0, '2025-07-01', '2026-06-30', '2025-07', '2026-06', false, false, NULL, NULL, true, '2026-06-30', 'Quitado na parcela de junho/2026'),
  ('d2000000-0000-4000-8000-000000000109', pg_temp.srv(12), NULL, 'Monte Cristo Seguros de Vida S.A.', pg_temp.cnpj('276591340001'), '0620',
   'APV-0093318', 'seguro', 460.80, 38.40, 12, 3, 345.60, '2026-04-01', '2027-03-31', '2026-04', '2027-03', true, false, NULL, NULL, false, NULL, 'Seguro de vida em grupo');

INSERT INTO public.pensoes_alimenticias (servidor_id, beneficiario_nome, beneficiario_cpf, beneficiario_data_nascimento, beneficiario_parentesco,
  numero_processo, vara_judicial, comarca, data_decisao, tipo_calculo, percentual, valor_fixo, base_calculo, prioridade,
  banco_codigo, banco_nome, banco_agencia, banco_conta, banco_tipo_conta, pix_chave, pix_tipo, ativo, data_inicio, data_fim, observacoes) VALUES
  (pg_temp.srv(3), 'Sofia Teixeira Bastos', pg_temp.cpf('603297415'), '2014-02-12', 'filha',
   '0812345-67.2024.8.23.0010', '2ª Vara de Família', 'Boa Vista', '2024-11-19', 'percentual', 15, NULL, 'liquido', 1,
   '001', 'Banco do Brasil', '3501-2', '27845-1', 'poupanca', NULL, NULL, true, '2024-12-01', NULL, 'Conta da representante legal'),
  (pg_temp.srv(7), 'Isabela Moraes Teles', pg_temp.cpf('612303627'), '2011-05-21', 'filha',
   '0807712-04.2023.8.23.0010', '1ª Vara de Família', 'Boa Vista', '2023-08-02', 'valor_fixo', NULL, 980.00, 'liquido', 1,
   '104', 'Caixa Econômica Federal', '0612', '00023456-1', 'corrente', NULL, NULL, true, '2023-09-01', NULL, NULL),
  (pg_temp.srv(15), 'Arthur Lago Siqueira', pg_temp.cpf('621419839'), '2017-10-03', 'filho',
   '0821930-55.2025.8.23.0010', '3ª Vara de Família', 'Boa Vista', '2025-06-10', 'percentual', 20, NULL, 'bruto', 1,
   NULL, NULL, NULL, NULL, NULL, 'mae.arthur@exemplo.test', 'email', true, '2025-07-01', NULL, 'Sem conta bancária: crédito por PIX, fora da remessa CNAB'),
  (pg_temp.srv(13), 'Kauã Cunha Prado', pg_temp.cpf('630525041'), '2005-03-17', 'filho',
   '0800415-22.2019.8.23.0010', '2ª Vara de Família', 'Boa Vista', '2019-04-08', 'percentual', 10, NULL, 'liquido', 1,
   '001', 'Banco do Brasil', '2617-5', '33012-9', 'corrente', NULL, NULL, false, '2019-05-01', '2026-03-31', 'Exonerado por sentença (maioridade e conclusão do curso)');

-- ===================================================================== folhas de pagamento
INSERT INTO public.folhas_pagamento (id, competencia_ano, competencia_mes, tipo_folha, observacoes) VALUES
  ('d2000000-0000-4000-8000-000000000001', 2026, 7, 'mensal', 'Folha mensal de julho/2026'),
  ('d2000000-0000-4000-8000-000000000002', 2026, 7, '13_1a_parcela', 'Adiantamento da 1ª parcela do 13º salário, paga com a folha de julho'),
  ('d2000000-0000-4000-8000-000000000003', 2026, 8, 'mensal', 'Folha mensal de agosto/2026 (com a revisão geral da Lei nº 2.214/2026)'),
  ('d2000000-0000-4000-8000-000000000004', 2026, 9, 'mensal', 'Folha mensal de setembro/2026');
-- outubro só entra se ninguém criou essa folha testando a tela (competência e tipo são únicos)
SELECT NOT EXISTS (SELECT 1 FROM public.folhas_pagamento WHERE competencia_ano = 2026 AND competencia_mes = 10
                   AND tipo_folha = 'mensal') AS criar_outubro \gset
\if :criar_outubro
INSERT INTO public.folhas_pagamento (id, competencia_ano, competencia_mes, tipo_folha, observacoes) VALUES
  ('d2000000-0000-4000-8000-000000000005', 2026, 10, 'mensal', 'Folha mensal de outubro/2026');
\endif
INSERT INTO public.folhas_pagamento (id, competencia_ano, competencia_mes, tipo_folha, status, observacoes) VALUES
  ('d2000000-0000-4000-8000-000000000006', 2026, 12, '13_2a_parcela', 'previa', 'Prévia da 2ª parcela do 13º salário (ainda não processada)');

-- ---------- julho/2026: 1º processamento, lançamentos avulsos, reprocessamento, conferência e fechamento
SELECT pg_temp.processar('d2000000-0000-4000-8000-000000000001') AS _ \gset
SELECT pg_temp.lancar('d2000000-0000-4000-8000-000000000001', (SELECT array_agg(g) FROM generate_series(1, 18) g), '1210', 600.00) AS _ \gset
SELECT pg_temp.lancar('d2000000-0000-4000-8000-000000000001', ARRAY[11, 12, 18], '1220', 220.00) AS _ \gset
SELECT pg_temp.lancar('d2000000-0000-4000-8000-000000000001', ARRAY[13, 14], '1130', 765.00, '15%', 5100.00, 15) AS _ \gset
SELECT pg_temp.lancar('d2000000-0000-4000-8000-000000000001', ARRAY[6], '2120', 84.70, 'Consultas e exames de junho') AS _ \gset
SELECT pg_temp.processar('d2000000-0000-4000-8000-000000000001') AS _ \gset
SELECT pg_temp.ok(public.enviar_folha_conferencia('d2000000-0000-4000-8000-000000000001'), 'conferência 07') AS _ \gset
SELECT pg_temp.ok(public.fechar_folha('d2000000-0000-4000-8000-000000000001', 'Conferida pela Divisão de Finanças; liberada para pagamento em 30/07.'), 'fechar 07') AS _ \gset

-- ---------- 13º salário, 1ª parcela (competência julho)
SELECT pg_temp.processar('d2000000-0000-4000-8000-000000000002') AS _ \gset
SELECT pg_temp.ok(public.enviar_folha_conferencia('d2000000-0000-4000-8000-000000000002'), 'conferência 13º') AS _ \gset
SELECT pg_temp.ok(public.fechar_folha('d2000000-0000-4000-8000-000000000002', 'Adiantamento do 13º conferido.'), 'fechar 13º') AS _ \gset

-- parcelas de julho descontadas: a consignatária informa a parcela seguinte
UPDATE public.consignacoes SET parcelas_pagas = parcelas_pagas + 1,
       saldo_devedor = CASE WHEN saldo_devedor IS NULL THEN NULL ELSE greatest(saldo_devedor - valor_parcela, 0) END
 WHERE ativo AND NOT quitado AND NOT suspenso;

-- ---------- agosto/2026: fechada, reaberta para corrigir e fechada de novo
SELECT pg_temp.processar('d2000000-0000-4000-8000-000000000003') AS _ \gset
SELECT pg_temp.lancar('d2000000-0000-4000-8000-000000000003', (SELECT array_agg(g) FROM generate_series(1, 18) g), '1210', 600.00) AS _ \gset
SELECT pg_temp.lancar('d2000000-0000-4000-8000-000000000003', ARRAY[11, 12, 18], '1220', 220.00) AS _ \gset
SELECT pg_temp.lancar('d2000000-0000-4000-8000-000000000003', ARRAY[13, 14], '1130', 803.25, '15%', 5355.00, 15) AS _ \gset
SELECT pg_temp.lancar('d2000000-0000-4000-8000-000000000003', ARRAY[10], '1105', 788.00, '8 h (curso de gestão de convênios)', 98.50) AS _ \gset
SELECT pg_temp.processar('d2000000-0000-4000-8000-000000000003') AS _ \gset
SELECT pg_temp.ok(public.enviar_folha_conferencia('d2000000-0000-4000-8000-000000000003'), 'conferência 08') AS _ \gset
SELECT pg_temp.ok(public.fechar_folha('d2000000-0000-4000-8000-000000000003', 'Folha conferida.'), 'fechar 08') AS _ \gset
SELECT pg_temp.ok(public.reabrir_folha('d2000000-0000-4000-8000-000000000003',
  'Inclusão da reposição ao erário de diária recebida a maior (processo 00000.005108/2026-44), apontada pela Controladoria após o fechamento.'), 'reabrir 08') AS _ \gset
SELECT pg_temp.lancar('d2000000-0000-4000-8000-000000000003', ARRAY[16], '2110', 312.40, 'Parcela 1/2 – processo 00000.005108/2026-44') AS _ \gset
SELECT pg_temp.processar('d2000000-0000-4000-8000-000000000003') AS _ \gset
SELECT pg_temp.ok(public.fechar_folha('d2000000-0000-4000-8000-000000000003', 'Refechada após a inclusão da reposição ao erário.'), 'refechar 08') AS _ \gset

UPDATE public.consignacoes SET parcelas_pagas = parcelas_pagas + 1,
       saldo_devedor = CASE WHEN saldo_devedor IS NULL THEN NULL ELSE greatest(saldo_devedor - valor_parcela, 0) END
 WHERE ativo AND NOT quitado AND NOT suspenso;
-- portabilidade pedida em setembro: consignação suspensa a partir da folha de setembro
UPDATE public.consignacoes SET suspenso = true, data_suspensao = '2026-09-04',
       motivo_suspensao = 'Pedido de portabilidade da dívida em análise (protocolo 00000.005611/2026-90)'
 WHERE id = 'd2000000-0000-4000-8000-000000000107';

-- ---------- setembro/2026: processada e enviada para conferência
SELECT pg_temp.processar('d2000000-0000-4000-8000-000000000004') AS _ \gset
SELECT pg_temp.lancar('d2000000-0000-4000-8000-000000000004', (SELECT array_agg(g) FROM generate_series(1, 18) g), '1210', 650.00) AS _ \gset
SELECT pg_temp.lancar('d2000000-0000-4000-8000-000000000004', ARRAY[11, 12, 18], '1220', 220.00) AS _ \gset
SELECT pg_temp.lancar('d2000000-0000-4000-8000-000000000004', ARRAY[13, 14], '1130', 803.25, '15%', 5355.00, 15) AS _ \gset
SELECT pg_temp.lancar('d2000000-0000-4000-8000-000000000004', ARRAY[16], '2110', 312.40, 'Parcela 2/2 – processo 00000.005108/2026-44') AS _ \gset
SELECT pg_temp.lancar('d2000000-0000-4000-8000-000000000004', ARRAY[6], '2120', 127.35, 'Consultas e exames de agosto') AS _ \gset
SELECT pg_temp.processar('d2000000-0000-4000-8000-000000000004') AS _ \gset
SELECT pg_temp.ok(public.enviar_folha_conferencia('d2000000-0000-4000-8000-000000000004'), 'conferência 09') AS _ \gset

-- ---------- outubro/2026: processada, aberta para lançamentos
\if :criar_outubro
SELECT pg_temp.processar('d2000000-0000-4000-8000-000000000005') AS _ \gset
SELECT pg_temp.lancar('d2000000-0000-4000-8000-000000000005', (SELECT array_agg(g) FROM generate_series(1, 18) g), '1210', 650.00) AS _ \gset
SELECT pg_temp.lancar('d2000000-0000-4000-8000-000000000005', ARRAY[11, 12, 18], '1220', 220.00) AS _ \gset
SELECT pg_temp.lancar('d2000000-0000-4000-8000-000000000005', ARRAY[13, 14], '1130', 803.25, '15%', 5355.00, 15) AS _ \gset
SELECT pg_temp.lancar('d2000000-0000-4000-8000-000000000005', ARRAY[9], '1105', 591.00, '6 h (oficina de arbitragem)', 98.50) AS _ \gset
SELECT pg_temp.processar('d2000000-0000-4000-8000-000000000005') AS _ \gset
\endif

-- lançamentos avulsos também no registro de lançamentos (rubrica, valor e incidências de cada um)
INSERT INTO public.lancamentos_folha (ficha_id, rubrica_id, rubrica_codigo, rubrica_descricao, rubrica_tipo, referencia, valor_base,
  valor_calculado, incidiu_inss, incidiu_irrf, origem, competencia_referencia, observacao)
SELECT i.ficha_id, r.id, r.codigo, r.descricao, r.tipo, i.percentual, i.base_calculo, i.valor, r.incide_inss, r.incide_irrf,
       'manual', f.competencia_ano || '-' || lpad(f.competencia_mes::text, 2, '0'), i.referencia
  FROM public.itens_ficha_financeira i
  JOIN public.rubricas r ON r.id = i.rubrica_id
  JOIN public.fichas_financeiras f ON f.id = i.ficha_id
 WHERE i.origem = 'manual' AND f.folha_id::text LIKE 'd2000000-%';

-- ===================================================================== remessas, retornos, eSocial e exportações
-- julho: remessa de servidores (retorno final, um crédito recusado) e de pensão (retorno final)
INSERT INTO public.remessas_bancarias (id, folha_id, conta_autarquia_id, numero_remessa, tipo_credito, nome_arquivo, layout, status, gerado_por, observacoes) VALUES
  ('d2000000-0000-4000-8000-000000000201', 'd2000000-0000-4000-8000-000000000001', 'd2000000-0000-4000-8000-0000000000b1', 0, 'servidores',
   'CNAB240_202607_20260727090512.REM', 'CNAB240', 'gerada', auth.uid(), 'Crédito em 30/07/2026'),
  ('d2000000-0000-4000-8000-000000000202', 'd2000000-0000-4000-8000-000000000001', 'd2000000-0000-4000-8000-0000000000b1', 0, 'pensao',
   'CNAB240_PENSAO_202607_20260727091204.REM', 'CNAB240', 'gerada', auth.uid(), 'Crédito em 30/07/2026'),
  ('d2000000-0000-4000-8000-000000000203', 'd2000000-0000-4000-8000-000000000002', 'd2000000-0000-4000-8000-0000000000b2', 0, 'servidores',
   'CNAB240_202607_20260727093340.REM', 'CNAB240', 'gerada', auth.uid(), '13º salário – 1ª parcela, crédito em 30/07/2026');
SELECT pg_temp.retorno('d2000000-0000-4000-8000-000000000201', 'final', '2026-07-30', 'RET_BB_20260730_0153.RET', 153, pg_temp.srv(17)) AS _ \gset
SELECT pg_temp.retorno('d2000000-0000-4000-8000-000000000202', 'final', '2026-07-30', 'RET_BB_20260730_0154.RET', 154) AS _ \gset
SELECT pg_temp.retorno('d2000000-0000-4000-8000-000000000203', 'final', '2026-07-30', 'RET_CEF_20260730_0001.RET', 1) AS _ \gset

-- agosto: remessa de servidores enviada, com a prévia do banco (créditos agendados); a de pensão não chegou a ser
-- enviada (a pensão de agosto saiu por TED avulsa) e é cancelada hoje pela RPC, com motivo
INSERT INTO public.remessas_bancarias (id, folha_id, conta_autarquia_id, numero_remessa, tipo_credito, nome_arquivo, layout, status, gerado_por, observacoes, data_geracao) VALUES
  ('d2000000-0000-4000-8000-000000000205', 'd2000000-0000-4000-8000-000000000003', 'd2000000-0000-4000-8000-0000000000b1', 0, 'servidores',
   'CNAB240_202608_20260826091522.REM', 'CNAB240', 'gerada', auth.uid(), 'Crédito em 28/08/2026', '2026-08-26 09:15-04');
-- a de pensão entra como "sistema" (com gerado_por e data_geracao informados): cancelada, ela não muda mais, e o
-- carimbo do INSERT feito pelo login seria o de hoje
SELECT set_config('teste.uid', auth.uid()::text, true) AS _ \gset
SELECT set_config('request.jwt.claim.sub', '', true) AS _ \gset
SELECT set_config('request.jwt.claim.role', '', true) AS _ \gset
INSERT INTO public.remessas_bancarias (id, folha_id, conta_autarquia_id, numero_remessa, tipo_credito, nome_arquivo, layout, status, gerado_por,
  created_by, observacoes, data_geracao) VALUES
  ('d2000000-0000-4000-8000-000000000206', 'd2000000-0000-4000-8000-000000000003', 'd2000000-0000-4000-8000-0000000000b1', 0, 'pensao',
   'CNAB240_PENSAO_202608_20260826092047.REM', 'CNAB240', 'gerada', current_setting('teste.uid')::uuid, current_setting('teste.uid')::uuid,
   'Crédito em 28/08/2026', '2026-08-26 09:20-04');
SELECT set_config('request.jwt.claim.sub', current_setting('teste.uid'), true) AS _ \gset
SELECT set_config('request.jwt.claim.role', 'authenticated', true) AS _ \gset
SELECT pg_temp.retorno('d2000000-0000-4000-8000-000000000205', 'previa', '2026-08-28', 'RET_BB_20260826_0156.RET', 156) AS _ \gset
SELECT 1 AS _ FROM public.cancelar_remessa('d2000000-0000-4000-8000-000000000206',
  'Não enviada ao banco: a pensão de agosto foi paga por TED avulsa em 28/08 (beneficiária mudou de conta). Cancelada para evitar crédito em dobro.') \gset

SELECT pg_temp.esocial('d2000000-0000-4000-8000-000000000001', '2026-07-30', '2026-08-05 10:20-04') AS _ \gset
SELECT pg_temp.esocial('d2000000-0000-4000-8000-000000000003', '2026-08-28', '2026-09-04 11:02-04') AS _ \gset

INSERT INTO public.exportacoes_folha (folha_id, tipo_exportacao, nome_arquivo, tamanho_bytes, hash_arquivo, quantidade_registros, valor_total,
  banco_id, status, mensagem_status, gerado_em, gerado_por, enviado_em, enviado_por)
SELECT r.folha_id, 'cnab240', r.nome_arquivo, 240 * (r.quantidade_registros * 2 + 4) + 2 * (r.quantidade_registros * 2 + 4),
       encode(sha256(convert_to(r.nome_arquivo, 'UTF8')), 'hex'), r.quantidade_registros, r.valor_total, c.banco_id,
       CASE r.status WHEN 'cancelada' THEN 'cancelado' WHEN 'gerada' THEN 'gerado' ELSE 'enviado' END,
       CASE r.status WHEN 'cancelada' THEN r.motivo_cancelamento END, now(), auth.uid(),
       CASE WHEN r.status IN ('enviada', 'processada') THEN now() END, CASE WHEN r.status IN ('enviada', 'processada') THEN auth.uid() END
  FROM public.remessas_bancarias r JOIN public.contas_autarquia c ON c.id = r.conta_autarquia_id;
INSERT INTO public.exportacoes_folha (folha_id, tipo_exportacao, nome_arquivo, tamanho_bytes, hash_arquivo, quantidade_registros, valor_total, status, gerado_em, gerado_por)
SELECT f.id, x.tipo, x.nome || f.competencia_ano || lpad(f.competencia_mes::text, 2, '0') || x.ext, x.tam,
       encode(sha256(convert_to(x.nome || f.id::text, 'UTF8')), 'hex'), f.quantidade_servidores, f.total_liquido, 'gerado', now(), auth.uid()
  FROM public.folhas_pagamento f
  CROSS JOIN (VALUES ('resumo_pdf', 'RESUMO_FOLHA_', '.pdf', 48213), ('planilha_xlsx', 'FOLHA_ANALITICA_', '.xlsx', 31877),
                     ('esocial_xml', 'ESOCIAL_RASCUNHO_', '.zip', 22950)) x(tipo, nome, ext, tam)
 WHERE f.id IN ('d2000000-0000-4000-8000-000000000001', 'd2000000-0000-4000-8000-000000000003');

-- ===================================================================== configuração paramétrica (cadastro de apoio)
INSERT INTO public.config_tipos_rubrica (id, codigo, nome, descricao, natureza, grupo, subgrupo, ordem_exibicao, exibe_contracheque, exibe_relatorio, ativo) VALUES
  ('d2000000-0000-4000-8000-000000000301', 'PREM', 'Proventos remuneratórios', 'Vencimento, gratificações e adicionais', 'provento', 'remuneracao', NULL, 1, true, true, true),
  ('d2000000-0000-4000-8000-000000000302', 'PIND', 'Proventos indenizatórios', 'Auxílios sem incidência de contribuição e IRRF', 'provento', 'indenizacao', NULL, 2, true, true, true),
  ('d2000000-0000-4000-8000-000000000303', 'DLEG', 'Descontos legais', 'Previdência, IRRF e pensão judicial', 'desconto', 'legais', NULL, 3, true, true, true),
  ('d2000000-0000-4000-8000-000000000304', 'DCON', 'Descontos consignados', 'Empréstimos, cartões, planos e mensalidades', 'desconto', 'consignados', NULL, 4, true, true, true),
  ('d2000000-0000-4000-8000-000000000305', 'ENCP', 'Encargos patronais', 'INSS patronal e RAT', 'encargo', 'encargos', NULL, 5, false, true, true);
INSERT INTO public.config_rubricas (id, tipo_rubrica_id, codigo, nome, descricao, natureza, tipo_calculo, valor_fixo, percentual, rubrica_base_id,
  incide_inss, incide_irrf, incide_ferias, incide_13_salario, compoe_base_inss, compoe_base_irrf, automatica, obrigatoria, proporcional_dias,
  desconta_faltas, codigo_esocial, natureza_esocial, vigencia_inicio, ordem_calculo, ativo) VALUES
  ('d2000000-0000-4000-8000-000000000311', 'd2000000-0000-4000-8000-000000000301', '0001', 'Vencimento', 'Vencimento do cargo', 'provento', 'referencia', NULL, NULL, NULL,
   true, true, true, true, true, true, true, true, true, true, '1000', '1000', '2026-01-01', 1, true),
  ('d2000000-0000-4000-8000-000000000312', 'd2000000-0000-4000-8000-000000000301', '1130', 'Gratificação de Atividade Desportiva', NULL, 'provento', 'percentual', NULL, 15, 'd2000000-0000-4000-8000-000000000311',
   true, true, true, true, true, true, false, false, true, true, '1099', '1099', '2026-01-01', 20, true),
  ('d2000000-0000-4000-8000-000000000313', 'd2000000-0000-4000-8000-000000000302', '1210', 'Auxílio-Alimentação', NULL, 'provento', 'fixo', 650, NULL, NULL,
   false, false, false, false, false, false, false, false, true, true, '1810', '1810', '2026-09-01', 40, true),
  ('d2000000-0000-4000-8000-000000000314', 'd2000000-0000-4000-8000-000000000303', '9201', 'Contribuição previdenciária', 'Tabela progressiva do INSS', 'desconto', 'tabela', NULL, NULL, NULL,
   false, false, false, false, false, false, true, true, false, false, '9201', '9201', '2026-01-01', 100, true),
  ('d2000000-0000-4000-8000-000000000315', 'd2000000-0000-4000-8000-000000000303', '9203', 'Imposto de renda retido na fonte', 'Tabela progressiva mensal', 'desconto', 'tabela', NULL, NULL, NULL,
   false, false, false, false, false, false, true, true, false, false, '9203', '9203', '2026-01-01', 110, true),
  ('d2000000-0000-4000-8000-000000000316', 'd2000000-0000-4000-8000-000000000304', '9220', 'Empréstimo consignado', NULL, 'desconto', 'manual', NULL, NULL, NULL,
   false, false, false, false, false, false, true, false, false, false, '9220', '9220', '2026-01-01', 130, true),
  ('d2000000-0000-4000-8000-000000000317', 'd2000000-0000-4000-8000-000000000305', '9901', 'INSS patronal', '20% sobre a base de contribuição', 'encargo', 'percentual', NULL, 20, NULL,
   false, false, false, false, false, false, true, true, false, false, NULL, NULL, '2026-01-01', 200, true);
INSERT INTO public.config_incidencias (rubrica_origem_id, rubrica_destino_id, tipo_incidencia, percentual_incidencia, vigencia_inicio, ativo) VALUES
  ('d2000000-0000-4000-8000-000000000311', 'd2000000-0000-4000-8000-000000000314', 'base_calculo', 100, '2026-01-01', true),
  ('d2000000-0000-4000-8000-000000000311', 'd2000000-0000-4000-8000-000000000315', 'base_calculo', 100, '2026-01-01', true),
  ('d2000000-0000-4000-8000-000000000312', 'd2000000-0000-4000-8000-000000000314', 'base_calculo', 100, '2026-01-01', true),
  ('d2000000-0000-4000-8000-000000000314', 'd2000000-0000-4000-8000-000000000315', 'deduz_base', 100, '2026-01-01', true),
  ('d2000000-0000-4000-8000-000000000313', 'd2000000-0000-4000-8000-000000000314', 'exclui', 100, '2026-01-01', true);
INSERT INTO public.config_regras_calculo (codigo, nome, descricao, escopo, escopo_id, tipo_regra, parametros, condicoes, vigencia_inicio, prioridade, ativo) VALUES
  ('PROP-DIAS', 'Proporcionalidade por dias', 'Mês comercial de 30 dias para admissão, exoneração e faltas', 'geral', NULL, 'proporcionalidade',
   '{"base_dias": 30, "mes_comercial": true}', '[]', '2026-01-01', 10, true),
  ('ARRED-CENT', 'Arredondamento no centavo', 'Arredonda cada item da ficha no centavo', 'geral', NULL, 'arredondamento', '{"casas": 2, "modo": "half_up"}', '[]', '2026-01-01', 90, true),
  ('GAD-PEF', 'Gratificação de Atividade Desportiva', '15% do vencimento para o cargo de Professor de Educação Física', 'cargo',
   'b0000000-0000-4000-8000-000000000007', 'gratificacao', '{"percentual": 15, "rubrica": "1130"}', '[{"campo": "em_atividade_de_campo", "igual": true}]', '2026-01-01', 20, true),
  ('TETO-EST', 'Teto remuneratório estadual', 'Subsídio do Governador como limite (art. 37, XI, da Constituição)', 'geral', NULL, 'teto',
   '{"parametro": "teto_remuneratorio"}', '[]', '2026-01-01', 99, true),
  ('MARG-CONS', 'Margem consignável', 'Até 35% da remuneração líquida para consignações facultativas, mais 5% para cartão', 'geral', NULL, 'desconto_voluntario',
   '{"margem_percentual": 35, "margem_cartao": 5}', '[]', '2026-01-01', 50, true);
INSERT INTO public.config_parametros_meta (codigo, dominio, tipo_dado, tipo_valor, permite_nivel_instituicao, permite_nivel_unidade,
  permite_nivel_tipo_servidor, permite_nivel_servidor, requer_vigencia, requer_aprovacao, editavel_producao, nome, descricao, valor_padrao, ativo, ordem) VALUES
  ('folha.dia_pagamento', 'FOLHA', 'simples', 'numeric', true, false, false, false, true, true, true, 'Dia do crédito da folha', 'Dia do mês em que o líquido é creditado', '30', true, 1),
  ('folha.margem_consignavel', 'FOLHA', 'simples', 'numeric', true, false, true, false, true, true, true, 'Margem consignável (%)', 'Percentual da remuneração líquida para consignações', '35', true, 2),
  ('folha.arredondamento', 'FOLHA', 'simples', 'text', true, false, false, false, false, false, true, 'Arredondamento', 'Regra de arredondamento dos itens', '"half_up"', true, 3),
  ('folha.exige_portaria_publicada', 'FOLHA', 'simples', 'boolean', true, false, false, false, false, true, false, 'Exigir portaria publicada', 'Marca a ficha como inconsistente sem portaria de nomeação publicada', 'true', true, 4),
  ('folha.esocial_ambiente', 'FOLHA', 'simples', 'text', true, false, false, false, false, true, true, 'Ambiente do eSocial', 'Produção restrita até a homologação', '"producao_restrita"', true, 5);

-- ===================================================================== datas dos atos (como "sistema": carimbos do dia em que cada passo ocorreu)
SELECT set_config('request.jwt.claim.sub', '', true) AS _ \gset
SELECT set_config('request.jwt.claim.role', '', true) AS _ \gset
UPDATE public.folhas_pagamento SET data_processamento = v.proc, conferido_em = v.conf, data_fechamento = v.fech, fechado_em = v.fech,
       reaberto_em = coalesce(v.reab, reaberto_em)
  FROM (VALUES
    ('d2000000-0000-4000-8000-000000000001'::uuid, timestamptz '2026-07-21 15:42-04', timestamptz '2026-07-22 10:05-04', timestamptz '2026-07-24 16:40-04', NULL::timestamptz),
    ('d2000000-0000-4000-8000-000000000002', '2026-07-21 16:10-04', '2026-07-22 10:20-04', '2026-07-24 16:52-04', NULL),
    ('d2000000-0000-4000-8000-000000000003', '2026-08-25 11:18-04', '2026-08-21 09:47-04', '2026-08-25 17:06-04', '2026-08-25 09:31-04'),
    ('d2000000-0000-4000-8000-000000000004', '2026-09-22 14:55-04', '2026-09-23 09:12-04', NULL, NULL),
    ('d2000000-0000-4000-8000-000000000005', '2026-10-21 10:37-04', NULL, NULL, NULL)
  ) v(id, proc, conf, fech, reab)
 WHERE folhas_pagamento.id = v.id;
UPDATE public.remessas_bancarias SET data_geracao = v.ger, enviado_em = CASE WHEN enviado_em IS NOT NULL THEN v.env END
  FROM (VALUES
    ('d2000000-0000-4000-8000-000000000201'::uuid, timestamptz '2026-07-27 09:05-04', timestamptz '2026-07-27 11:30-04'),
    ('d2000000-0000-4000-8000-000000000202', '2026-07-27 09:12-04', '2026-07-27 11:30-04'),
    ('d2000000-0000-4000-8000-000000000203', '2026-07-27 09:33-04', '2026-07-27 11:45-04'),
    ('d2000000-0000-4000-8000-000000000205', '2026-08-26 09:15-04', '2026-08-26 10:02-04')
  ) v(id, ger, env)
 WHERE remessas_bancarias.id = v.id AND remessas_bancarias.status <> 'cancelada';
-- reabrir_folha não marca `reaberto` e só conta as reaberturas desde a migração 20261107091000: fixa-se aqui a de agosto
UPDATE public.folhas_pagamento SET reaberto = true, quantidade_reaberturas = 1 WHERE id = 'd2000000-0000-4000-8000-000000000003';
UPDATE public.eventos_esocial SET data_geracao = CASE folha_id WHEN 'd2000000-0000-4000-8000-000000000001' THEN timestamptz '2026-08-05 10:20-04'
                                                               ELSE timestamptz '2026-09-04 11:02-04' END
 WHERE folha_id::text LIKE 'd2000000-%';
UPDATE public.retornos_bancarios SET data_processamento = coalesce(data_arquivo, data_processamento);
UPDATE public.exportacoes_folha e SET gerado_em = f.data_fechamento + interval '1 hour'
  FROM public.folhas_pagamento f
 WHERE f.id = e.folha_id AND e.tipo_exportacao <> 'cnab240' AND f.id::text LIKE 'd2000000-%';
UPDATE public.exportacoes_folha e SET gerado_em = r.data_geracao, enviado_em = CASE WHEN e.enviado_em IS NOT NULL THEN r.enviado_em END
  FROM public.remessas_bancarias r WHERE r.nome_arquivo = e.nome_arquivo;

SELECT 'folhas_pagamento' AS tabela, count(*) FROM public.folhas_pagamento
UNION ALL SELECT 'fichas_financeiras', count(*) FROM public.fichas_financeiras
UNION ALL SELECT 'itens_ficha_financeira', count(*) FROM public.itens_ficha_financeira
UNION ALL SELECT 'remessas_bancarias', count(*) FROM public.remessas_bancarias
UNION ALL SELECT 'retornos_bancarios', count(*) FROM public.retornos_bancarios
UNION ALL SELECT 'eventos_esocial', count(*) FROM public.eventos_esocial;

COMMIT;
