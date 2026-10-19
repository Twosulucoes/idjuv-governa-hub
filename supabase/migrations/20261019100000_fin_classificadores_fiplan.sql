-- ============================================================================
-- FINANCEIRO — tabelas de classificação do FIPLAN ("Consultar ..." exportadas em planilha)
-- ============================================================================
-- Spec: docs/superpowers/specs/2026-10-19-classificadores-fiplan-design.md
--
--   fin_classificadores_fiplan          uma linha por código de cada tabela do FIPLAN e exercício:
--                                       função, programa, elemento, subelemento, fonte de recurso e
--                                       finalidade de pagamento. Só leitura pela API: as linhas nascem
--                                       na RPC abaixo (SECURITY DEFINER).
--   importar_classificadores_fiplan()   recebe as linhas lidas da planilha e, numa transação, cria ou
--                                       atualiza os classificadores e corrige os nomes dos cadastros que
--                                       já existem (fin_fontes_recurso, fin_programas_orcamentarios e as
--                                       naturezas com o nome provisório do QDD). Nada é apagado.
--                                       Com p_simular = true só calcula o que mudaria.
--
-- Quem importa: a mesma permissão do QDD (`orcamento.importar`) e acesso ao módulo financeiro;
-- o rótulo da permissão passa a cobrir as duas importações.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Permissão (já existe desde 20261009153000; só o rótulo muda)
-- ----------------------------------------------------------------------------
UPDATE public.module_permissions_catalog
   SET label = 'Importar dados do FIPLAN (QDD e tabelas)'
 WHERE permission_code = 'orcamento.importar';


-- ----------------------------------------------------------------------------
-- 2. fin_classificadores_fiplan
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fin_classificadores_fiplan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL CHECK (tipo IN ('funcao', 'programa', 'elemento', 'subelemento', 'fonte', 'finalidade_pagamento')),
  exercicio integer NOT NULL CHECK (exercicio BETWEEN 2000 AND 2100),
  codigo text NOT NULL CHECK (codigo ~ '^[0-9][0-9.]{0,9}$'),
  nome text NOT NULL CHECK (char_length(nome) BETWEEN 1 AND 500),
  nome_resumido text CHECK (char_length(nome_resumido) <= 200),
  ativo boolean NOT NULL DEFAULT true,
  -- demais colunas da planilha (cabeçalho normalizado → texto), para consulta
  atributos jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(atributos) = 'object'),
  importacao_id uuid REFERENCES public.importacoes(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fin_classificadores_fiplan_chave UNIQUE (tipo, exercicio, codigo)
);

COMMENT ON TABLE public.fin_classificadores_fiplan IS
  'Tabelas de classificação do FIPLAN por exercício (função, programa, elemento, subelemento, fonte, finalidade de pagamento). Escrita só pela RPC importar_classificadores_fiplan.';
COMMENT ON COLUMN public.fin_classificadores_fiplan.codigo IS
  'Código como o FIPLAN mostra: função 27, programa 030, elemento 39, subelemento 39.01, fonte 1.500, finalidade 0.';

CREATE INDEX IF NOT EXISTS idx_fin_classificadores_fiplan_importacao
  ON public.fin_classificadores_fiplan (importacao_id);

ALTER TABLE public.fin_classificadores_fiplan ENABLE ROW LEVEL SECURITY;

-- Leitura: quem acessa o módulo financeiro. Sem policy de escrita: ninguém grava pela API.
CREATE POLICY fin_classificadores_fiplan_select ON public.fin_classificadores_fiplan
  FOR SELECT TO authenticated
  USING (
    (SELECT public.perfil_ativo_atual())
    AND (SELECT public.can_access_module(auth.uid(), 'financeiro'))
  );

REVOKE ALL ON public.fin_classificadores_fiplan FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.fin_classificadores_fiplan FROM authenticated;


-- ----------------------------------------------------------------------------
-- 3. importar_classificadores_fiplan
-- ----------------------------------------------------------------------------
-- p_tipo: funcao | programa | elemento | subelemento | fonte | finalidade_pagamento
-- p_linhas: array de {codigo, nome, nome_resumido, ativo, atributos}
-- p_arquivo: {nome, sha256, tamanho}
--
-- Efeito nos cadastros que já existem (só nomes; nada é criado nem apagado lá):
--   fonte        fin_fontes_recurso com os mesmos dígitos (1.500 = 1500): nome
--   programa     fin_programas_orcamentarios do exercício com o mesmo número (030 = 30): nome
--   elemento     naturezas com o nome provisório do QDD, sem subelemento, desse elemento: nome
--   subelemento  naturezas com o nome provisório do QDD desse elemento.subelemento: nome
CREATE OR REPLACE FUNCTION public.importar_classificadores_fiplan(
  p_tipo text,
  p_exercicio integer,
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
  c_provisorio constant text := '% (importada do QDD, revisar descrição)';
  v_uid uuid := auth.uid();
  v_padrao text;
  v_linha jsonb;
  v_idx integer := -1;
  v_codigo text; v_nome text; v_resumido text; v_ativo boolean; v_atrib jsonb;
  v_codigos text[] := '{}';
  v_existente public.fin_classificadores_fiplan%ROWTYPE;
  v_achou boolean;
  v_mudancas jsonb;
  v_avisos text[];
  v_digitos text;
  v_n integer;
  v_lateral boolean;
  v_recente boolean;
  v_resultado jsonb := '[]'::jsonb;
  v_erros jsonb := '[]'::jsonb;
  v_ins integer := 0; v_upd integer := 0; v_igual integer := 0;
  v_ausentes text[];
  v_resumo jsonb;
  v_import_id uuid;
BEGIN
  p_simular := COALESCE(p_simular, true);

  -- COALESCE: um NULL em qualquer checagem nega (NOT NULL não dispararia o RAISE).
  IF v_uid IS NULL
     OR NOT COALESCE(public.perfil_ativo_atual()
                     AND public.can_access_module(v_uid, 'financeiro')
                     AND public.has_permission_code(v_uid, 'orcamento.importar'), false) THEN
    RAISE EXCEPTION 'Sem permissão para importar tabelas do FIPLAN (orcamento.importar).' USING ERRCODE = '42501';
  END IF;

  v_padrao := CASE p_tipo
    WHEN 'funcao' THEN '^\d{2}$'
    WHEN 'programa' THEN '^\d{3}$'
    WHEN 'elemento' THEN '^\d{2}$'
    WHEN 'subelemento' THEN '^\d{2}\.\d{2}$'
    WHEN 'fonte' THEN '^\d\.\d{3}$'
    WHEN 'finalidade_pagamento' THEN '^\d{1,4}$'
  END;
  IF v_padrao IS NULL THEN
    RAISE EXCEPTION 'Tabela do FIPLAN desconhecida: %', p_tipo USING ERRCODE = '22023';
  END IF;
  IF p_exercicio IS NULL OR p_exercicio NOT BETWEEN 2000 AND 2100 THEN
    RAISE EXCEPTION 'Exercício inválido: %', p_exercicio USING ERRCODE = '22023';
  END IF;
  IF jsonb_typeof(p_linhas) IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_linhas) NOT BETWEEN 1 AND 5000 THEN
    RAISE EXCEPTION 'Envie de 1 a 5000 linhas.' USING ERRCODE = '22023';
  END IF;
  IF NOT p_simular AND (
       char_length(COALESCE(p_arquivo->>'nome', '')) NOT BETWEEN 1 AND 255
       OR COALESCE(p_arquivo->>'sha256', '') !~ '^[0-9a-f]{64}$'
       OR COALESCE(p_arquivo->>'tamanho', '') !~ '^\d{1,15}$') THEN
    RAISE EXCEPTION 'Dados do arquivo inválidos.' USING ERRCODE = '22023';
  END IF;

  -- Uma importação por tabela e exercício de cada vez.
  PERFORM pg_advisory_xact_lock(hashtext('importar_classificadores_fiplan:' || p_tipo), p_exercicio);

  -- Fontes não têm exercício no cadastro: só o exercício mais recente já importado corrige o nome
  v_recente := p_exercicio >= COALESCE((SELECT max(exercicio) FROM public.fin_classificadores_fiplan
                                         WHERE tipo = p_tipo), p_exercicio);

  IF NOT p_simular THEN
    -- O log nasce antes para as linhas apontarem para ele; o resumo é preenchido no fim.
    INSERT INTO public.importacoes
      (tipo, modulo, arquivo_nome, arquivo_sha256, arquivo_tamanho, exercicio, created_by)
    VALUES
      ('classificadores_fiplan', 'financeiro', p_arquivo->>'nome', p_arquivo->>'sha256',
       (p_arquivo->>'tamanho')::bigint, p_exercicio, v_uid)
    RETURNING id INTO v_import_id;
  END IF;

  FOR v_linha IN SELECT value FROM jsonb_array_elements(p_linhas) LOOP
    v_idx := v_idx + 1;
    v_codigo := btrim(COALESCE(v_linha->>'codigo', ''));
    v_nome := btrim(COALESCE(v_linha->>'nome', ''));
    v_resumido := NULLIF(btrim(COALESCE(v_linha->>'nome_resumido', '')), '');
    v_ativo := COALESCE((v_linha->>'ativo')::boolean, true);
    v_atrib := COALESCE(v_linha->'atributos', '{}'::jsonb);
    v_avisos := '{}';

    IF v_codigo !~ v_padrao THEN
      v_erros := v_erros || jsonb_build_object('indice', v_idx, 'mensagem', format('Código "%s" fora do padrão.', left(v_codigo, 20)));
      CONTINUE;
    END IF;
    IF char_length(v_nome) NOT BETWEEN 1 AND 500 OR char_length(COALESCE(v_resumido, '')) > 200
       OR jsonb_typeof(v_atrib) IS DISTINCT FROM 'object' OR octet_length(v_atrib::text) > 8000 THEN
      v_erros := v_erros || jsonb_build_object('indice', v_idx, 'mensagem', format('Linha do código %s com nome ou colunas inválidos.', v_codigo));
      CONTINUE;
    END IF;
    -- Outras colunas: só texto, e nada que pareça dado pessoal (o parser já descarta; a API direta também)
    SELECT COALESCE(jsonb_object_agg(k, v), '{}'::jsonb) INTO v_atrib
      FROM jsonb_each(v_atrib) AS a(k, v)
     WHERE jsonb_typeof(v) = 'string' AND k !~* '(respons|cpf|e_?mail|telefone|celular|matricula)';
    IF v_codigo = ANY (v_codigos) THEN
      v_erros := v_erros || jsonb_build_object('indice', v_idx, 'mensagem', format('Código %s repetido no arquivo.', v_codigo));
      CONTINUE;
    END IF;
    v_codigos := v_codigos || v_codigo;

    SELECT * INTO v_existente FROM public.fin_classificadores_fiplan
     WHERE tipo = p_tipo AND exercicio = p_exercicio AND codigo = v_codigo
     FOR UPDATE;
    v_achou := FOUND;

    -- Cadastros que já existem e passam a ter o nome do FIPLAN
    v_digitos := replace(v_codigo, '.', '');
    v_n := 0;
    IF p_tipo = 'fonte' AND v_recente THEN
      -- Só o nome: a situação não passa (importar um exercício antigo desativaria fonte em uso hoje)
      SELECT count(*) INTO v_n FROM public.fin_fontes_recurso
       WHERE regexp_replace(codigo, '\D', '', 'g') = v_digitos
         AND nome IS DISTINCT FROM left(v_nome, 255);
      IF v_n > 0 THEN
        v_avisos := v_avisos || format('Atualiza o nome da fonte %s no cadastro de fontes.', v_codigo);
        IF NOT p_simular THEN
          UPDATE public.fin_fontes_recurso SET nome = left(v_nome, 255), updated_at = now()
           WHERE regexp_replace(codigo, '\D', '', 'g') = v_digitos
             AND nome IS DISTINCT FROM left(v_nome, 255);
        END IF;
      END IF;
    ELSIF p_tipo = 'programa' THEN
      SELECT count(*) INTO v_n FROM public.fin_programas_orcamentarios
       WHERE exercicio = p_exercicio AND ltrim(codigo, '0') = ltrim(v_codigo, '0')
         AND nome IS DISTINCT FROM left(v_nome, 255);
      IF v_n > 0 THEN
        v_avisos := v_avisos || format('Atualiza o nome do programa %s no orçamento.', v_codigo);
        IF NOT p_simular THEN
          UPDATE public.fin_programas_orcamentarios SET nome = left(v_nome, 255), updated_at = now()
           WHERE exercicio = p_exercicio AND ltrim(codigo, '0') = ltrim(v_codigo, '0')
             AND nome IS DISTINCT FROM left(v_nome, 255);
        END IF;
      END IF;
    ELSIF p_tipo IN ('elemento', 'subelemento') THEN
      SELECT count(*) INTO v_n FROM public.fin_naturezas_despesa
       WHERE nome LIKE c_provisorio
         AND CASE WHEN p_tipo = 'elemento'
                  THEN substr(regexp_replace(codigo, '\D', '', 'g'), 5, 2) = v_digitos
                       AND COALESCE(NULLIF(substr(regexp_replace(codigo, '\D', '', 'g'), 7, 2), ''), '00') = '00'
                  ELSE substr(regexp_replace(codigo, '\D', '', 'g'), 5, 4) = v_digitos
             END;
      IF v_n > 0 THEN
        v_avisos := v_avisos || format('Dá nome a %s natureza(s) de despesa importada(s) do QDD.', v_n);
        IF NOT p_simular THEN
          UPDATE public.fin_naturezas_despesa SET nome = left(v_nome, 255), updated_at = now()
           WHERE nome LIKE c_provisorio
             AND CASE WHEN p_tipo = 'elemento'
                      THEN substr(regexp_replace(codigo, '\D', '', 'g'), 5, 2) = v_digitos
                           AND COALESCE(NULLIF(substr(regexp_replace(codigo, '\D', '', 'g'), 7, 2), ''), '00') = '00'
                      ELSE substr(regexp_replace(codigo, '\D', '', 'g'), 5, 4) = v_digitos
                 END;
        END IF;
      END IF;
    END IF;

    v_lateral := v_n > 0;

    IF NOT v_achou THEN
      v_ins := v_ins + 1;
      v_resultado := v_resultado || jsonb_strip_nulls(jsonb_build_object('indice', v_idx, 'acao', 'inserir',
                       'avisos', CASE WHEN cardinality(v_avisos) > 0 THEN to_jsonb(v_avisos) END));
      IF NOT p_simular THEN
        INSERT INTO public.fin_classificadores_fiplan
          (tipo, exercicio, codigo, nome, nome_resumido, ativo, atributos, importacao_id)
        VALUES (p_tipo, p_exercicio, v_codigo, v_nome, v_resumido, v_ativo, v_atrib, v_import_id);
      END IF;
    ELSE
      SELECT COALESCE(jsonb_object_agg(k, jsonb_build_array(antes, depois)), '{}'::jsonb) INTO v_mudancas
        FROM (VALUES
               ('nome', to_jsonb(v_existente.nome), to_jsonb(v_nome)),
               ('nome_resumido', to_jsonb(v_existente.nome_resumido), to_jsonb(v_resumido)),
               ('ativo', to_jsonb(v_existente.ativo), to_jsonb(v_ativo))
             ) AS m(k, antes, depois)
       WHERE antes IS DISTINCT FROM depois;
      -- Outras colunas mudaram: entra na lista sem despejar o conteúdo
      IF v_existente.atributos IS DISTINCT FROM v_atrib THEN
        v_mudancas := v_mudancas || jsonb_build_object('atributos', jsonb_build_array('…', 'atualizadas'));
      END IF;
      -- Classificador igual mas cadastro a corrigir (ex.: natureza criada por um QDD depois): conta como atualização
      IF v_lateral THEN
        v_mudancas := v_mudancas || jsonb_build_object('cadastros', jsonb_build_array('nome provisório ou antigo', 'nome do FIPLAN'));
      END IF;

      IF v_mudancas = '{}'::jsonb THEN
        v_igual := v_igual + 1;
        v_resultado := v_resultado || jsonb_strip_nulls(jsonb_build_object('indice', v_idx, 'acao', 'sem_alteracao',
                         'avisos', CASE WHEN cardinality(v_avisos) > 0 THEN to_jsonb(v_avisos) END));
      ELSE
        v_upd := v_upd + 1;
        v_resultado := v_resultado || jsonb_strip_nulls(jsonb_build_object('indice', v_idx, 'acao', 'atualizar',
                         'mudancas', v_mudancas,
                         'avisos', CASE WHEN cardinality(v_avisos) > 0 THEN to_jsonb(v_avisos) END));
        IF NOT p_simular THEN
          UPDATE public.fin_classificadores_fiplan SET
            nome = v_nome, nome_resumido = v_resumido, ativo = v_ativo, atributos = v_atrib,
            importacao_id = v_import_id, updated_at = now()
          WHERE id = v_existente.id;
        END IF;
      END IF;
    END IF;
  END LOOP;

  -- Com qualquer erro, nada fica gravado (inclusive o log).
  IF jsonb_array_length(v_erros) > 0 AND NOT p_simular THEN
    RAISE EXCEPTION 'A planilha tem % linha(s) com erro; nada foi gravado.', jsonb_array_length(v_erros)
      USING ERRCODE = '22023';
  END IF;

  -- Códigos do exercício que não vieram no arquivo: só avisados, nunca apagados.
  SELECT array_agg(codigo ORDER BY codigo) INTO v_ausentes
    FROM public.fin_classificadores_fiplan
   WHERE tipo = p_tipo AND exercicio = p_exercicio AND NOT (codigo = ANY (v_codigos));

  v_resumo := jsonb_build_object(
    'tabela', p_tipo,
    'totais', jsonb_build_object('inserir', v_ins, 'atualizar', v_upd, 'sem_alteracao', v_igual),
    'ausentes', to_jsonb(COALESCE(v_ausentes, '{}'::text[]))
  );

  IF NOT p_simular THEN
    UPDATE public.importacoes SET resumo = v_resumo, detalhes = v_resultado WHERE id = v_import_id;
  END IF;

  RETURN v_resumo || jsonb_build_object(
    'simulacao', p_simular,
    'importacao_id', v_import_id,
    'linhas', v_resultado,
    'erros', v_erros
  );
END;
$$;

COMMENT ON FUNCTION public.importar_classificadores_fiplan(text, integer, jsonb, jsonb, boolean) IS
  'Importa uma tabela de classificação do FIPLAN (planilha "Consultar ...") para fin_classificadores_fiplan e corrige nomes de fontes, programas e naturezas provisórias (p_simular = true só calcula as mudanças). Exige orcamento.importar.';

REVOKE ALL ON FUNCTION public.importar_classificadores_fiplan(text, integer, jsonb, jsonb, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.importar_classificadores_fiplan(text, integer, jsonb, jsonb, boolean) TO authenticated;
