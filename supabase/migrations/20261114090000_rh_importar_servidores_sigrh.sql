-- ============================================================================
-- RH: cadastro inicial dos servidores pelo arquivo da Seplan (créditos bancários da folha do SIGRH)
-- ============================================================================
-- Antes: o servidor só entrava no sistema digitado um a um (/rh/servidores/novo). O banco de produção começou sem
-- nenhum, e a importação da folha histórica do SIGRH (migração 20261022090000) recusa servidor não cadastrado.
--
-- Agora: rh_importar_servidores_sigrh(p_origem, p_linhas, p_arquivo, p_simular) recebe as linhas lidas no navegador
-- (leitor em src/lib/importacao/importadores/servidoresSigrhParser.ts, que já conferiu a soma com o total impresso):
--   p_origem = 'credito'  PDF "Relação de Crédito Bancário — Servidores Ativos": cria o servidor que não existe
--                         (casado pelo CPF) com nome, CPF, matrícula do SIGRH, banco, agência e conta, vínculo
--                         comissionado e situação ativo; no que já existe atualiza só a conta bancária e, se estiver
--                         vazia, a matrícula. Nome e matrícula diferentes viram aviso, nunca troca.
--   p_origem = 'banco'    remessa CNAB 240 do banco: completa o endereço de quem já está cadastrado e tem o endereço
--                         todo vazio (nunca sobrescreve o que o RH digitou). CPF não cadastrado é erro da linha.
-- Tudo ou nada: com qualquer erro, nada é gravado. Com p_simular = true tudo é desfeito no fim (mesmo esquema da
-- importação da folha: bloco interno com RAISE de SQLSTATE próprio capturado ali mesmo).
--
-- Quem pode: perfil ativo, módulo rh e a permissão nova rh.servidores.importar (dada a quem já tem
-- rh.servidores.criar: ninguém perde nem ganha acesso além do que já tinha). As gravações passam pelos gatilhos de
-- setor (exigir_setor), autoria (fixar_autoria) e trilha (audit_servidores) como as da tela.
--
-- LGPD: o CPF só serve para achar o servidor; não volta na resposta nem vai para o log (importacoes guarda
-- competência, totais e, por linha, o índice e o servidor). As mensagens citam o nome como veio no arquivo.
-- Nenhuma tabela, policy ou grant de tabela muda. Idempotente.
-- ============================================================================

-- 1. Permissão ---------------------------------------------------------------
INSERT INTO public.module_permissions_catalog
  (module_code, permission_code, label, category, action_type, sort_order)
VALUES
  ('rh', 'rh.servidores.importar', 'Importar servidores do SIGRH (arquivo de créditos da Seplan)',
   'Servidores', 'importar', 5)
ON CONFLICT (permission_code) DO NOTHING;

INSERT INTO public.role_permissions (role, permission)
SELECT DISTINCT rp.role, 'rh.servidores.importar'
  FROM public.role_permissions rp
 WHERE rp.permission = 'rh.servidores.criar'
   AND NOT EXISTS (SELECT 1 FROM public.role_permissions x
                    WHERE x.role = rp.role AND x.permission = 'rh.servidores.importar');

UPDATE public.user_modules
   SET permissions = array_append(permissions, 'rh.servidores.importar')
 WHERE 'rh.servidores.criar' = ANY (permissions)
   AND NOT 'rh.servidores.importar' = ANY (permissions);

INSERT INTO public.user_permissions (user_id, permission)
SELECT DISTINCT up.user_id, 'rh.servidores.importar'
  FROM public.user_permissions up
 WHERE up.permission = 'rh.servidores.criar'
   AND NOT EXISTS (SELECT 1 FROM public.user_permissions x
                    WHERE x.user_id = up.user_id AND x.permission = 'rh.servidores.importar');


-- 2. Importação --------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rh_importar_servidores_sigrh(
  p_origem text,
  p_linhas jsonb,
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
  v_linha jsonb;
  v_end jsonb;
  v_pos integer := -1;
  v_ind integer;
  v_nome text;
  v_cpf text;
  v_matricula text;
  v_banco text;
  v_agencia text;
  v_conta text;
  v_proventos numeric;
  v_srv record;
  v_qtd integer;
  v_novo uuid;
  v_mud jsonb;
  v_avisos text[];
  v_acao text;
  v_vistos text[] := '{}';
  v_linhas_res jsonb := '[]'::jsonb;
  v_erros jsonb := '[]'::jsonb;
  v_detalhes jsonb := '[]'::jsonb;
  v_ausentes text[];
  v_ins integer := 0;
  v_upd integer := 0;
  v_igual integer := 0;
  v_ano integer;
  v_mes integer;
  v_totais jsonb;
  v_import_id uuid;
BEGIN
  p_simular := COALESCE(p_simular, true);

  -- COALESCE: um NULL em qualquer checagem nega
  IF v_uid IS NULL
     OR NOT COALESCE(public.perfil_ativo_atual()
                     AND public.can_access_module(v_uid, 'rh')
                     AND public.has_permission_code(v_uid, 'rh.servidores.importar'), false) THEN
    RAISE EXCEPTION 'Sem permissão para importar servidores (rh.servidores.importar).' USING ERRCODE = '42501';
  END IF;

  IF p_origem IS NULL OR p_origem NOT IN ('credito', 'banco') THEN
    RAISE EXCEPTION 'Origem inválida: use credito (PDF da relação de crédito) ou banco (TXT do banco).' USING ERRCODE = '22023';
  END IF;
  IF jsonb_typeof(p_linhas) IS DISTINCT FROM 'array' OR jsonb_array_length(p_linhas) NOT BETWEEN 1 AND 3000 THEN
    RAISE EXCEPTION 'Envie de 1 a 3000 servidores.' USING ERRCODE = '22023';
  END IF;
  IF NOT p_simular AND (
       char_length(COALESCE(p_arquivo->>'nome', '')) NOT BETWEEN 1 AND 255
       OR COALESCE(p_arquivo->>'sha256', '') !~ '^[0-9a-f]{64}$'
       OR COALESCE(p_arquivo->>'tamanho', '') !~ '^\d{1,15}$') THEN
    RAISE EXCEPTION 'Dados do arquivo inválidos.' USING ERRCODE = '22023';
  END IF;
  IF COALESCE(p_arquivo->>'ano', '') ~ '^\d{4}$' THEN v_ano := (p_arquivo->>'ano')::integer; END IF;
  IF COALESCE(p_arquivo->>'mes', '') ~ '^\d{1,2}$' THEN v_mes := (p_arquivo->>'mes')::integer; END IF;

  -- uma importação de servidores de cada vez; com outra em andamento recusa na hora
  IF NOT pg_try_advisory_xact_lock(hashtext('rh_importar_servidores_sigrh')) THEN
    RAISE EXCEPTION 'Já há uma importação de servidores em andamento; tente de novo em instantes.' USING ERRCODE = '55P03';
  END IF;

  BEGIN
    FOR v_linha IN SELECT e FROM jsonb_array_elements(p_linhas) e LOOP
      v_pos := v_pos + 1;
      v_ind := v_pos;
      v_avisos := '{}';
      v_nome := NULL;
      v_mud := '{}'::jsonb;
      BEGIN
        IF jsonb_typeof(v_linha) IS DISTINCT FROM 'object' THEN
          RAISE EXCEPTION 'Linha em formato inválido.' USING ERRCODE = '22023';
        END IF;
        IF COALESCE(v_linha->>'indice', '') ~ '^\d{1,6}$' THEN v_ind := (v_linha->>'indice')::integer; END IF;
        v_nome := left(regexp_replace(btrim(COALESCE(v_linha->>'nome', '')), '\s+', ' ', 'g'), 200);
        v_cpf := COALESCE(v_linha->>'cpf', '');
        IF v_cpf !~ '^\d{11}$' THEN
          RAISE EXCEPTION 'CPF ausente ou inválido no arquivo.' USING ERRCODE = '22023';
        END IF;
        IF v_cpf = ANY (v_vistos) THEN
          RAISE EXCEPTION 'O mesmo CPF aparece duas vezes no arquivo.' USING ERRCODE = '22023';
        END IF;
        v_vistos := v_vistos || v_cpf;

        v_matricula := nullif(left(btrim(COALESCE(v_linha->>'matricula', '')), 20), '');
        v_banco := nullif(left(btrim(COALESCE(v_linha->>'banco_codigo', '')), 3), '');
        v_agencia := nullif(left(btrim(COALESCE(v_linha->>'banco_agencia', '')), 10), '');
        v_conta := nullif(left(btrim(COALESCE(v_linha->>'banco_conta', '')), 20), '');
        v_proventos := CASE WHEN COALESCE(v_linha->>'proventos', '') ~ '^\d{1,9}(\.\d{1,2})?$'
                            THEN (v_linha->>'proventos')::numeric END;
        v_end := CASE WHEN jsonb_typeof(v_linha->'endereco') = 'object' THEN v_linha->'endereco' END;

        SELECT count(*) INTO v_qtd FROM public.servidores s
         WHERE lpad(regexp_replace(COALESCE(s.cpf, ''), '[^0-9]', '', 'g'), 11, '0') = v_cpf;
        IF v_qtd > 1 THEN
          RAISE EXCEPTION 'O CPF está em % cadastros de servidor: junte os cadastros antes de importar.', v_qtd
            USING ERRCODE = 'P0001';
        END IF;
        SELECT s.id, s.nome_completo, s.matricula, s.situacao, s.banco_codigo, s.banco_agencia, s.banco_conta,
               s.endereco_logradouro, s.endereco_numero, s.endereco_complemento, s.endereco_bairro,
               s.endereco_cidade, s.endereco_uf, s.endereco_cep
          INTO v_srv FROM public.servidores s
         WHERE lpad(regexp_replace(COALESCE(s.cpf, ''), '[^0-9]', '', 'g'), 11, '0') = v_cpf;

        IF v_qtd = 0 THEN
          IF p_origem = 'banco' THEN
            RAISE EXCEPTION 'Servidor não cadastrado: importe primeiro a Relação de Crédito Bancário (PDF).'
              USING ERRCODE = 'P0001';
          END IF;
          IF v_nome = '' THEN
            RAISE EXCEPTION 'Nome ausente no arquivo.' USING ERRCODE = '22023';
          END IF;
          IF v_matricula IS NOT NULL AND EXISTS (SELECT 1 FROM public.servidores s WHERE s.matricula = v_matricula) THEN
            RAISE EXCEPTION 'A matrícula % já é de outro servidor cadastrado.', v_matricula USING ERRCODE = 'P0001';
          END IF;
          INSERT INTO public.servidores (
            nome_completo, cpf, matricula, vinculo, situacao, tipo_servidor, ativo,
            banco_codigo, banco_nome, banco_agencia, banco_conta, banco_tipo_conta, remuneracao_bruta, observacoes)
          VALUES (
            v_nome, v_cpf, v_matricula, 'comissionado', 'ativo', 'comissionado_idjuv', true,
            v_banco,
            CASE v_banco WHEN '001' THEN 'Banco do Brasil' WHEN '104' THEN 'Caixa Econômica Federal'
                         WHEN '237' THEN 'Bradesco' WHEN '341' THEN 'Itaú Unibanco' WHEN '033' THEN 'Santander'
                         WHEN '077' THEN 'Banco Inter' WHEN '260' THEN 'Nu Pagamentos' END,
            v_agencia, v_conta, CASE WHEN v_conta IS NOT NULL THEN 'corrente' END, v_proventos,
            left(format('Cadastro inicial importado do SIGRH (crédito bancário %s). Conferir cargo, lotação e dados pessoais.',
                        COALESCE(lpad(v_mes::text, 2, '0') || '/' || v_ano, 'sem competência')), 500))
          RETURNING id INTO v_novo;
          v_acao := 'inserir';
          v_ins := v_ins + 1;
        ELSE
          v_novo := v_srv.id;
          IF v_srv.situacao::text <> 'ativo' THEN
            v_avisos := v_avisos || format('No sistema a situação é "%s", mas recebeu no SIGRH: confira.', v_srv.situacao)::text;
          END IF;
          IF upper(regexp_replace(btrim(v_srv.nome_completo), '\s+', ' ', 'g')) IS DISTINCT FROM upper(v_nome)
             AND p_origem = 'credito' THEN
            v_avisos := v_avisos || 'Nome no sistema diferente do SIGRH: o do sistema foi mantido.'::text;
          END IF;
          IF v_matricula IS NOT NULL AND v_srv.matricula IS DISTINCT FROM v_matricula THEN
            IF v_srv.matricula IS NULL OR btrim(v_srv.matricula) = '' THEN
              IF EXISTS (SELECT 1 FROM public.servidores s WHERE s.matricula = v_matricula AND s.id <> v_srv.id) THEN
                RAISE EXCEPTION 'A matrícula % já é de outro servidor cadastrado.', v_matricula USING ERRCODE = 'P0001';
              END IF;
              v_mud := v_mud || jsonb_build_object('matricula', jsonb_build_array(v_srv.matricula, v_matricula));
            ELSE
              v_avisos := v_avisos || format('Matrícula no sistema (%s) diferente da do SIGRH (%s): a do sistema foi mantida.',
                                             v_srv.matricula, v_matricula)::text;
            END IF;
          END IF;
          IF v_banco IS NOT NULL AND v_conta IS NOT NULL AND (
               v_srv.banco_codigo IS DISTINCT FROM v_banco OR v_srv.banco_agencia IS DISTINCT FROM v_agencia
               OR v_srv.banco_conta IS DISTINCT FROM v_conta) THEN
            v_mud := v_mud || jsonb_build_object(
              'banco_codigo', jsonb_build_array(v_srv.banco_codigo, v_banco),
              'banco_agencia', jsonb_build_array(v_srv.banco_agencia, v_agencia),
              'banco_conta', jsonb_build_array(v_srv.banco_conta, v_conta));
          END IF;
          -- endereço: só quando o cadastro está todo vazio e o arquivo traz rua ou cidade
          IF v_end IS NOT NULL AND (nullif(btrim(COALESCE(v_end->>'logradouro', '')), '') IS NOT NULL
                                    OR nullif(btrim(COALESCE(v_end->>'cidade', '')), '') IS NOT NULL) THEN
            IF COALESCE(v_srv.endereco_logradouro, v_srv.endereco_numero, v_srv.endereco_complemento,
                        v_srv.endereco_bairro, v_srv.endereco_cidade, v_srv.endereco_uf, v_srv.endereco_cep) IS NULL THEN
              v_mud := v_mud || jsonb_build_object(
                'endereco_logradouro', jsonb_build_array(NULL, nullif(left(btrim(COALESCE(v_end->>'logradouro', '')), 200), '')),
                'endereco_numero', jsonb_build_array(NULL, nullif(left(btrim(COALESCE(v_end->>'numero', '')), 20), '')),
                'endereco_complemento', jsonb_build_array(NULL, nullif(left(btrim(COALESCE(v_end->>'complemento', '')), 100), '')),
                'endereco_bairro', jsonb_build_array(NULL, nullif(left(btrim(COALESCE(v_end->>'bairro', '')), 100), '')),
                'endereco_cidade', jsonb_build_array(NULL, nullif(left(btrim(COALESCE(v_end->>'cidade', '')), 100), '')),
                'endereco_uf', jsonb_build_array(NULL, nullif(upper(left(btrim(COALESCE(v_end->>'uf', '')), 2)), '')),
                'endereco_cep', jsonb_build_array(NULL, nullif(left(btrim(COALESCE(v_end->>'cep', '')), 9), '')));
            ELSE
              v_avisos := v_avisos || 'Já tem endereço no cadastro: o do sistema foi mantido.'::text;
            END IF;
          END IF;

          IF v_mud = '{}'::jsonb THEN
            v_acao := 'sem_alteracao';
            v_igual := v_igual + 1;
          ELSE
            UPDATE public.servidores s SET
              matricula = CASE WHEN v_mud ? 'matricula' THEN v_mud->'matricula'->>1 ELSE s.matricula END,
              banco_codigo = CASE WHEN v_mud ? 'banco_codigo' THEN v_mud->'banco_codigo'->>1 ELSE s.banco_codigo END,
              banco_agencia = CASE WHEN v_mud ? 'banco_agencia' THEN v_mud->'banco_agencia'->>1 ELSE s.banco_agencia END,
              banco_conta = CASE WHEN v_mud ? 'banco_conta' THEN v_mud->'banco_conta'->>1 ELSE s.banco_conta END,
              endereco_logradouro = CASE WHEN v_mud ? 'endereco_logradouro' THEN v_mud->'endereco_logradouro'->>1 ELSE s.endereco_logradouro END,
              endereco_numero = CASE WHEN v_mud ? 'endereco_numero' THEN v_mud->'endereco_numero'->>1 ELSE s.endereco_numero END,
              endereco_complemento = CASE WHEN v_mud ? 'endereco_complemento' THEN v_mud->'endereco_complemento'->>1 ELSE s.endereco_complemento END,
              endereco_bairro = CASE WHEN v_mud ? 'endereco_bairro' THEN v_mud->'endereco_bairro'->>1 ELSE s.endereco_bairro END,
              endereco_cidade = CASE WHEN v_mud ? 'endereco_cidade' THEN v_mud->'endereco_cidade'->>1 ELSE s.endereco_cidade END,
              endereco_uf = CASE WHEN v_mud ? 'endereco_uf' THEN v_mud->'endereco_uf'->>1 ELSE s.endereco_uf END,
              endereco_cep = CASE WHEN v_mud ? 'endereco_cep' THEN v_mud->'endereco_cep'->>1 ELSE s.endereco_cep END
             WHERE s.id = v_srv.id;
            v_acao := 'atualizar';
            v_upd := v_upd + 1;
          END IF;
        END IF;

        v_linhas_res := v_linhas_res || jsonb_strip_nulls(jsonb_build_object(
          'indice', v_ind, 'acao', v_acao,
          'mudancas', CASE WHEN v_mud <> '{}'::jsonb THEN v_mud END,
          'avisos', CASE WHEN cardinality(v_avisos) > 0 THEN to_jsonb(v_avisos) END));
        v_detalhes := v_detalhes || jsonb_build_object('indice', v_ind, 'acao', v_acao, 'servidor_id', v_novo);
      EXCEPTION
        WHEN OTHERS THEN
          v_erros := v_erros || jsonb_build_object('indice', v_ind, 'mensagem',
            COALESCE(nullif(v_nome, '') || ': ', '') ||
            CASE WHEN left(SQLSTATE, 2) IN ('22', '23') OR SQLSTATE IN ('P0001', 'RHS01', '42501') THEN SQLERRM
                 ELSE format('erro inesperado ao gravar o servidor (código %s).', SQLSTATE) END);
      END;
    END LOOP;

    IF p_simular OR jsonb_array_length(v_erros) > 0 THEN
      RAISE EXCEPTION 'importação desfeita' USING ERRCODE = 'ISV01';
    END IF;
  EXCEPTION
    WHEN SQLSTATE 'ISV01' THEN
      NULL;  -- desfeito: nada do que as linhas gravaram fica; as variáveis continuam valendo
  END;

  -- servidores ativos no sistema que não vieram no arquivo de crédito (saíram? mudaram de vínculo?)
  IF p_origem = 'credito' THEN
    SELECT array_agg(s.nome_completo ORDER BY s.nome_completo) INTO v_ausentes
      FROM public.servidores s
     WHERE s.situacao = 'ativo' AND s.vinculo = 'comissionado'
       AND NOT (lpad(regexp_replace(COALESCE(s.cpf, ''), '[^0-9]', '', 'g'), 11, '0') = ANY (v_vistos));
  END IF;

  v_totais := jsonb_build_object('inserir', v_ins, 'atualizar', v_upd, 'sem_alteracao', v_igual);

  IF NOT p_simular AND jsonb_array_length(v_erros) = 0 THEN
    INSERT INTO public.importacoes
      (tipo, modulo, arquivo_nome, arquivo_sha256, arquivo_tamanho, exercicio, resumo, detalhes, created_by)
    VALUES
      ('servidores_sigrh', 'rh', p_arquivo->>'nome', p_arquivo->>'sha256', (p_arquivo->>'tamanho')::bigint, v_ano,
       jsonb_build_object('origem', p_origem,
                          'competencia', CASE WHEN v_mes IS NOT NULL AND v_ano IS NOT NULL
                                              THEN lpad(v_mes::text, 2, '0') || '/' || v_ano END,
                          'totais', v_totais),
       v_detalhes, v_uid)
    RETURNING id INTO v_import_id;
  END IF;

  RETURN jsonb_build_object(
    'simulacao', p_simular,
    'importacao_id', v_import_id,
    'totais', v_totais,
    'linhas', v_linhas_res,
    'ausentes', to_jsonb(COALESCE(v_ausentes, '{}'::text[])),
    'erros', v_erros
  );
END;
$$;

COMMENT ON FUNCTION public.rh_importar_servidores_sigrh(text, jsonb, jsonb, boolean) IS
  'Cadastro inicial dos servidores pelo arquivo de créditos bancários da Seplan (SIGRH): origem credito cria/atualiza pelo CPF (nome, matrícula, conta); origem banco completa endereço vazio. p_simular = true só calcula; tudo ou nada. Exige módulo rh e rh.servidores.importar. Migração 20261114090000.';

REVOKE ALL ON FUNCTION public.rh_importar_servidores_sigrh(text, jsonb, jsonb, boolean) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.rh_importar_servidores_sigrh(text, jsonb, jsonb, boolean) TO authenticated;
