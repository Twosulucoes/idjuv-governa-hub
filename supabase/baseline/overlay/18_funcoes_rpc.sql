-- RPCs: injeção de SQL, função quebrada e SECURITY DEFINER que vazava dado pessoal.
--
-- 1) fn_gerar_numero_financeiro(p_tipo, p_exercicio) montava o nome da tabela com
--    format('... fin_%ss ...', p_tipo) sem validar nem usar %I e rodava como SECURITY DEFINER
--    (dono com BYPASSRLS), executável por qualquer logado. Reproduzido em banco vazio por usuário
--    inativo e sem módulo: p_tipo = 'parametros, (select nome_completo as numero from servidores) q --'
--    devolvia, pelo erro de cast, o nome de um servidor (qualquer coluna de qualquer tabela). Agora
--    p_tipo precisa estar na lista fechada abaixo, que também mapeia para o nome real da tabela
--    (o formato antigo gerava fin_solicitacaos e fin_liquidacaos, que não existem).
-- 2) registrar_transicao_folha lia profiles.nome (a coluna é full_name): qualquer UPDATE em
--    folhas_pagamento falhava.
-- 3) Funções somente-leitura que devolvem dado pessoal rodavam como dono (BYPASSRLS) e eram
--    executáveis por qualquer logado, ativo ou não, com módulo ou não (reproduzido com
--    fn_gerar_esocial_s2200: CPF e nome). Passam a SECURITY INVOKER: valem as policies de quem chama.
--    As que ESCREVEM (processar_folha_pagamento, fn_atualizar_situacao_servidor) perdem o EXECUTE de
--    authenticated em overlay/40_privilegios.sql.

CREATE OR REPLACE FUNCTION public.fn_gerar_numero_financeiro(
  p_tipo character varying,
  p_exercicio integer DEFAULT (EXTRACT(year FROM CURRENT_DATE))::integer
) RETURNS character varying
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_prefixo text;
  v_tabela  text;
  v_ultimo  integer;
BEGIN
  SELECT t.prefixo, t.tabela INTO v_prefixo, v_tabela
  FROM (VALUES
    ('solicitacao', 'SOL', 'fin_solicitacoes'),
    ('empenho',     'NE',  'fin_empenhos'),
    ('liquidacao',  'NL',  'fin_liquidacoes'),
    ('pagamento',   'OP',  'fin_pagamentos'),
    ('receita',     'REC', 'fin_receitas'),
    ('adiantamento','ADI', 'fin_adiantamentos'),
    ('alteracao',   'ALT', 'fin_alteracoes_orcamentarias')
  ) AS t(tipo, prefixo, tabela)
  WHERE t.tipo = p_tipo;

  IF v_prefixo IS NULL THEN
    RAISE EXCEPTION 'Tipo de documento financeiro inválido: %', left(coalesce(p_tipo, ''), 40)
      USING ERRCODE = '22023';
  END IF;

  EXECUTE format(
    'SELECT COALESCE(MAX(NULLIF(regexp_replace(numero, %L, %L), %L)::integer), 0) + 1 FROM public.%I WHERE exercicio = $1',
    '^' || v_prefixo || '-', '', '', v_tabela
  ) INTO v_ultimo USING p_exercicio;

  RETURN v_prefixo || '-' || LPAD(COALESCE(v_ultimo, 1)::text, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.registrar_transicao_folha()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_nome TEXT;
BEGIN
  SELECT full_name INTO v_user_nome FROM public.profiles WHERE id = auth.uid();

  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.folha_historico_status (
      folha_id, status_anterior, status_novo, usuario_id, usuario_nome, justificativa
    ) VALUES (
      NEW.id, OLD.status, NEW.status, auth.uid(), v_user_nome,
      CASE
        WHEN NEW.status = 'fechada' THEN NEW.justificativa_fechamento
        WHEN NEW.status = 'reaberta' THEN NEW.justificativa_reabertura
        ELSE NULL
      END
    );

    IF NEW.status = 'fechada' AND OLD.status != 'fechada' THEN
      NEW.fechado_por := COALESCE(NEW.fechado_por, auth.uid());
      NEW.fechado_em := COALESCE(NEW.fechado_em, now());
    END IF;

    IF NEW.status = 'processando' AND OLD.status = 'aberta' THEN
      NEW.conferido_por := COALESCE(NEW.conferido_por, auth.uid());
      NEW.conferido_em := COALESCE(NEW.conferido_em, now());
    END IF;

    IF NEW.status = 'reaberta' THEN
      NEW.reaberto_por := COALESCE(NEW.reaberto_por, auth.uid());
      NEW.reaberto_em := COALESCE(NEW.reaberto_em, now());
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Somente-leitura com dado pessoal: passam a respeitar a RLS de quem chama.
DO $$
DECLARE f record;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS assinatura
    FROM pg_proc p
    WHERE p.pronamespace = 'public'::regnamespace
      AND p.proname IN ('fn_gerar_esocial_s1200', 'fn_gerar_esocial_s2200', 'fn_validar_margem_consignavel',
                        'fn_calcular_13_proporcional', 'gerar_relatorio_responsavel', 'verificar_conflito_agenda')
      AND p.prosecdef
  LOOP
    EXECUTE format('ALTER FUNCTION %s SECURITY INVOKER', f.assinatura);
  END LOOP;
END $$;
