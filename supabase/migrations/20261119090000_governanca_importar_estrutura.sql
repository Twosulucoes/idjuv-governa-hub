-- ============================================================================
-- Governança: importação da estrutura organizacional por planilha
-- ============================================================================
-- Antes: a estrutura só entrava uma unidade por vez, na Gestão do organograma. Uma instituição nova começa com o
-- banco vazio (docs/NOVO_BANCO.md), e o quadro de vagas e a lotação dos servidores dependem das unidades; para o
-- IDJUV a carga inicial precisou de uma migração (20261118090000).
--
-- Agora: governanca_importar_estrutura(p_linhas, p_arquivo, p_simular) recebe as linhas da planilha já lidas no
-- navegador (src/lib/importacao/importadores/estruturaPlanilhaParser.ts), na ordem de hierarquia (superior antes do
-- subordinado), e por linha:
--   - confere sigla, nome e tipo;
--   - acha a unidade existente pela sigla (sem diferença de maiúscula); sem sigla igual, pelo nome de uma unidade
--     ativa sem sigla. Unidade existente só tem os campos vazios completados (sigla, superior, descrição, lei);
--     nome, tipo ou superior diferentes viram aviso e fica o que está no cadastro. Desativada é erro (reative na tela);
--   - acha o superior pela sigla entre as unidades ativas (as criadas por linhas anteriores da mesma importação
--     contam); superior que não existe é erro; ligar uma unidade existente a uma subordinada sua também;
--   - cria a unidade nova com nível = nível do superior + 1 (1 sem superior) e a ordem da planilha.
-- Nada é apagado nem desativado. Tudo ou nada; p_simular = true desfaz tudo no fim. Log em importacoes
-- (tipo estrutura_planilha, módulo governanca).
--
-- Quem pode: perfil ativo, módulo governanca (ou organizacoes, o da policy de escrita da tabela) e
-- governanca.estrutura.editar (permissão que já existe; nenhuma permissão nova). SECURITY DEFINER como as outras
-- importações (grava o log, que não tem policy de escrita). Nenhuma tabela, policy ou grant de tabela muda.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.governanca_importar_estrutura(
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
  l jsonb;
  v_ind integer;
  v_sigla text;
  v_nome text;
  v_tipo public.tipo_unidade;
  v_sup_sigla text;
  v_sup_id uuid;
  v_sup_nivel integer;
  v_sup_nome text;
  v_atual public.estrutura_organizacional%ROWTYPE;
  v_achou boolean;
  v_id uuid;
  v_acao text;
  v_mudancas jsonb;
  v_avisos jsonb;
  v_descricao text;
  v_lei_numero text;
  v_lei_data date;
  v_chaves text[] := '{}';
  v_linhas_res jsonb := '[]'::jsonb;
  v_erros jsonb := '[]'::jsonb;
  v_detalhes jsonb := '[]'::jsonb;
  v_criadas text[] := '{}';
  v_ins integer := 0; v_atu integer := 0; v_igual integer := 0;
  v_totais jsonb;
  v_import_id uuid;
BEGIN
  p_simular := coalesce(p_simular, true);

  IF v_uid IS NULL
     OR NOT coalesce(public.perfil_ativo_atual()
                     AND (public.can_access_module(v_uid, 'governanca') OR public.can_access_module(v_uid, 'organizacoes'))
                     AND public.has_permission_code(v_uid, 'governanca.estrutura.editar'), false) THEN
    RAISE EXCEPTION 'Importar a estrutura exige a permissão "Editar Estrutura".' USING ERRCODE = '42501';
  END IF;
  IF jsonb_typeof(p_linhas) IS DISTINCT FROM 'array' OR jsonb_array_length(p_linhas) NOT BETWEEN 1 AND 500 THEN
    RAISE EXCEPTION 'Envie de 1 a 500 unidades.' USING ERRCODE = '22023';
  END IF;
  IF NOT p_simular AND (
       char_length(coalesce(p_arquivo->>'nome', '')) NOT BETWEEN 1 AND 255
       OR coalesce(p_arquivo->>'sha256', '') !~ '^[0-9a-f]{64}$'
       OR coalesce(p_arquivo->>'tamanho', '') !~ '^\d{1,15}$') THEN
    RAISE EXCEPTION 'Dados do arquivo inválidos.' USING ERRCODE = '22023';
  END IF;

  BEGIN
    FOR l IN SELECT value FROM jsonb_array_elements(p_linhas) LOOP
      v_ind := CASE WHEN coalesce(l->>'indice', '') ~ '^\d{1,6}$' THEN (l->>'indice')::integer ELSE -1 END;
      BEGIN
        IF jsonb_typeof(l) <> 'object' THEN
          RAISE EXCEPTION 'Linha em formato inválido.' USING ERRCODE = '22023';
        END IF;
        v_mudancas := '{}'::jsonb;
        v_avisos := '[]'::jsonb;

        v_sigla := nullif(btrim(l->>'sigla'), '');
        v_nome := nullif(regexp_replace(btrim(coalesce(l->>'nome', '')), '\s+', ' ', 'g'), '');
        v_sup_sigla := nullif(btrim(l->>'superior_sigla'), '');
        v_descricao := nullif(btrim(l->>'descricao'), '');
        v_lei_numero := nullif(btrim(l->>'lei_criacao_numero'), '');
        IF v_sigla IS NULL OR char_length(v_sigla) > 30 THEN
          RAISE EXCEPTION 'Informe a sigla (até 30 caracteres).' USING ERRCODE = '22023';
        END IF;
        IF v_nome IS NULL OR char_length(v_nome) > 200 THEN
          RAISE EXCEPTION 'Informe o nome da unidade (até 200 caracteres).' USING ERRCODE = '22023';
        END IF;
        IF upper(v_sigla) = ANY (v_chaves) THEN
          RAISE EXCEPTION 'A sigla % aparece mais de uma vez na planilha.', v_sigla USING ERRCODE = '22023';
        END IF;
        IF v_sup_sigla IS NOT NULL AND upper(v_sup_sigla) = upper(v_sigla) THEN
          RAISE EXCEPTION 'A unidade % não pode responder a ela mesma.', v_sigla USING ERRCODE = '22023';
        END IF;
        BEGIN
          v_tipo := (l->>'tipo')::public.tipo_unidade;
        EXCEPTION WHEN invalid_text_representation OR null_value_not_allowed THEN
          RAISE EXCEPTION 'Tipo "%" inválido.', l->>'tipo' USING ERRCODE = '22023';
        END;
        IF v_tipo IS NULL THEN
          RAISE EXCEPTION 'Informe o tipo da unidade.' USING ERRCODE = '22023';
        END IF;
        BEGIN
          v_lei_data := nullif(l->>'lei_criacao_data', '')::date;
        EXCEPTION WHEN invalid_datetime_format OR datetime_field_overflow THEN
          RAISE EXCEPTION 'Data da lei inválida.' USING ERRCODE = '22023';
        END;

        -- superior: unidade ativa com a sigla (as criadas pelas linhas anteriores já estão na tabela)
        v_sup_id := NULL; v_sup_nivel := NULL; v_sup_nome := NULL;
        IF v_sup_sigla IS NOT NULL THEN
          SELECT e.id, e.nivel, e.nome INTO v_sup_id, v_sup_nivel, v_sup_nome FROM public.estrutura_organizacional e
           WHERE e.ativo AND upper(btrim(e.sigla)) = upper(v_sup_sigla)
           ORDER BY e.created_at
           LIMIT 1;
          IF v_sup_id IS NULL THEN
            RAISE EXCEPTION 'A unidade superior % não está na planilha nem no cadastro.', v_sup_sigla USING ERRCODE = '22023';
          END IF;
        END IF;

        -- unidade existente: pela sigla; sem sigla igual, pelo nome de uma ativa sem sigla
        SELECT * INTO v_atual FROM public.estrutura_organizacional e
         WHERE upper(btrim(e.sigla)) = upper(v_sigla)
         ORDER BY e.ativo DESC NULLS LAST, e.created_at
         LIMIT 1;
        v_achou := FOUND;
        IF NOT v_achou THEN
          SELECT * INTO v_atual FROM public.estrutura_organizacional e
           WHERE e.ativo AND nullif(btrim(e.sigla), '') IS NULL AND lower(btrim(e.nome)) = lower(v_nome)
           ORDER BY e.created_at
           LIMIT 1;
          v_achou := FOUND;
        END IF;

        IF NOT v_achou THEN
          INSERT INTO public.estrutura_organizacional
            (nome, sigla, tipo, nivel, superior_id, descricao, lei_criacao_numero, lei_criacao_data, base_legal,
             ordem, ordem_exibicao, ativo)
          VALUES
            (v_nome, v_sigla, v_tipo, coalesce(v_sup_nivel + 1, 1), v_sup_id, v_descricao, v_lei_numero, v_lei_data,
             v_lei_numero IS NOT NULL, v_ind + 1, v_ind + 1, true)
          RETURNING id INTO v_id;
          v_acao := 'inserir';
          v_criadas := v_criadas || format('%s – %s', v_sigla, v_nome);
        ELSE
          IF v_atual.ativo IS NOT TRUE THEN
            RAISE EXCEPTION 'A unidade % está desativada no cadastro: reative-a na Gestão do organograma antes de importar.',
              v_sigla USING ERRCODE = '22023';
          END IF;
          v_id := v_atual.id;
          IF lower(btrim(v_atual.nome)) <> lower(v_nome) THEN
            v_avisos := v_avisos || to_jsonb(format('No cadastro o nome é "%s"; fica o do cadastro.', v_atual.nome));
          END IF;
          IF v_atual.tipo <> v_tipo THEN
            v_avisos := v_avisos || to_jsonb(format('No cadastro o tipo é %s; fica o do cadastro.', v_atual.tipo));
          END IF;
          IF v_sup_id IS NOT NULL AND v_atual.superior_id IS NOT NULL AND v_atual.superior_id <> v_sup_id THEN
            v_avisos := v_avisos || to_jsonb(format(
              'No cadastro ela responde a outra unidade; fica a do cadastro (troque na edição da unidade).'));
          END IF;

          IF nullif(btrim(v_atual.sigla), '') IS NULL THEN
            UPDATE public.estrutura_organizacional SET sigla = v_sigla WHERE id = v_id;
            v_mudancas := v_mudancas || jsonb_build_object('sigla', jsonb_build_array(NULL, v_sigla));
          END IF;
          IF v_atual.superior_id IS NULL AND v_sup_id IS NOT NULL THEN
            -- o superior não pode ser a própria unidade nem uma subordinada dela
            IF EXISTS (
              WITH RECURSIVE abaixo AS (
                SELECT id FROM public.estrutura_organizacional WHERE id = v_id
                UNION
                SELECT e.id FROM public.estrutura_organizacional e JOIN abaixo a ON e.superior_id = a.id
              )
              SELECT 1 FROM abaixo WHERE id = v_sup_id
            ) THEN
              RAISE EXCEPTION 'A unidade % não pode responder a %, que está abaixo dela.', v_sigla, v_sup_sigla
                USING ERRCODE = '22023';
            END IF;
            UPDATE public.estrutura_organizacional
               SET superior_id = v_sup_id, nivel = v_sup_nivel + 1
             WHERE id = v_id;
            v_mudancas := v_mudancas || jsonb_build_object('superior_id', jsonb_build_array(NULL, v_sup_nome));
          END IF;
          IF v_atual.descricao IS NULL AND v_descricao IS NOT NULL THEN
            UPDATE public.estrutura_organizacional SET descricao = v_descricao WHERE id = v_id;
            v_mudancas := v_mudancas || jsonb_build_object('descricao', jsonb_build_array(NULL, v_descricao));
          END IF;
          IF v_atual.lei_criacao_numero IS NULL AND v_lei_numero IS NOT NULL THEN
            UPDATE public.estrutura_organizacional SET lei_criacao_numero = v_lei_numero, base_legal = true WHERE id = v_id;
            v_mudancas := v_mudancas || jsonb_build_object('lei_criacao_numero', jsonb_build_array(NULL, v_lei_numero));
          END IF;
          IF v_atual.lei_criacao_data IS NULL AND v_lei_data IS NOT NULL THEN
            UPDATE public.estrutura_organizacional SET lei_criacao_data = v_lei_data WHERE id = v_id;
            v_mudancas := v_mudancas || jsonb_build_object('lei_criacao_data', jsonb_build_array(NULL, v_lei_data));
          END IF;
          v_acao := CASE WHEN v_mudancas <> '{}'::jsonb THEN 'atualizar' ELSE 'sem_alteracao' END;
        END IF;

        v_chaves := v_chaves || upper(v_sigla);
        CASE v_acao WHEN 'inserir' THEN v_ins := v_ins + 1; WHEN 'atualizar' THEN v_atu := v_atu + 1; ELSE v_igual := v_igual + 1; END CASE;
        v_linhas_res := v_linhas_res || jsonb_build_object('indice', v_ind, 'acao', v_acao,
          'mudancas', CASE WHEN v_mudancas <> '{}'::jsonb THEN v_mudancas END,
          'avisos', CASE WHEN jsonb_array_length(v_avisos) > 0 THEN v_avisos END);
        v_detalhes := v_detalhes || jsonb_build_object('indice', v_ind, 'sigla', v_sigla, 'acao', v_acao, 'unidade_id', v_id);
      EXCEPTION
        WHEN OTHERS THEN
          v_erros := v_erros || jsonb_build_object('indice', v_ind, 'mensagem',
            CASE WHEN left(SQLSTATE, 2) IN ('22', '23') OR SQLSTATE IN ('P0001', '42501') THEN SQLERRM
                 ELSE format('Erro inesperado ao gravar a linha (código %s).', SQLSTATE) END);
      END;
    END LOOP;

    IF p_simular OR jsonb_array_length(v_erros) > 0 THEN
      RAISE EXCEPTION 'importação desfeita' USING ERRCODE = 'PRI01';
    END IF;
  EXCEPTION
    WHEN SQLSTATE 'PRI01' THEN NULL;  -- desfaz tudo o que as linhas gravaram; as variáveis continuam valendo
  END;

  v_totais := jsonb_build_object('inserir', v_ins, 'atualizar', v_atu, 'sem_alteracao', v_igual);

  IF NOT p_simular AND jsonb_array_length(v_erros) = 0 THEN
    INSERT INTO public.importacoes
      (tipo, modulo, arquivo_nome, arquivo_sha256, arquivo_tamanho, exercicio, resumo, detalhes, created_by)
    VALUES
      ('estrutura_planilha', 'governanca', p_arquivo->>'nome', p_arquivo->>'sha256', (p_arquivo->>'tamanho')::bigint,
       NULL, jsonb_build_object('totais', v_totais), v_detalhes, v_uid)
    RETURNING id INTO v_import_id;
  END IF;

  RETURN jsonb_build_object(
    'simulacao', p_simular,
    'importacao_id', v_import_id,
    'totais', v_totais,
    'linhas', v_linhas_res,
    'erros', v_erros,
    'criados', jsonb_strip_nulls(jsonb_build_object(
      'Unidades', CASE WHEN cardinality(v_criadas) > 0 THEN to_jsonb(v_criadas) END)));
END;
$$;
COMMENT ON FUNCTION public.governanca_importar_estrutura(jsonb, jsonb, boolean) IS
  'Importa a planilha da estrutura organizacional (p_simular = true só calcula; aplicação é tudo ou nada, com log em importacoes). Nunca apaga, desativa nem sobrescreve: unidade existente (mesma sigla) só ganha o que está vazio. Exige governanca.estrutura.editar. Migração 20261119090000.';
REVOKE ALL ON FUNCTION public.governanca_importar_estrutura(jsonb, jsonb, boolean) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.governanca_importar_estrutura(jsonb, jsonb, boolean) TO authenticated;
