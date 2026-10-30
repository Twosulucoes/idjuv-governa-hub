-- ============================================================================
-- Diárias pagas no FIPLAN (FIP 002 – Demonstrativo de Diárias)
-- ============================================================================
-- O FIPLAN sabe quais diárias foram empenhadas, liquidadas e pagas e se o servidor prestou contas; o sistema não.
--
--   fin_diarias_fiplan       espelho do FIP 002: uma linha por diária (chave: exercício + nº do empenho), ligada ao
--                            servidor (pelo nome) e à viagem cadastrada pelo RH em viagens_diarias (servidor + saída).
--   importar_diarias_fiplan  RPC do importador (simula ou aplica, tudo ou nada; nada é apagado). Exige o módulo
--                            financeiro e financeiro.execucao.importar, como os empenhos (FIP 614) e os PEDs.
--
-- Leitura: Financeiro (financeiro.diarias.visualizar ou financeiro.execucao.importar), RH (rh.viagens.visualizar) e
-- o próprio servidor. Ninguém grava pela API.
-- Spec: docs/superpowers/specs/2026-10-30-diarias-fiplan-design.md
-- ============================================================================

-- 1. fin_diarias_fiplan ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fin_diarias_fiplan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exercicio integer NOT NULL CHECK (exercicio BETWEEN 2000 AND 2100),
  empenho_numero text NOT NULL CHECK (empenho_numero ~ '^\d{17}$'),
  credor_codigo text CHECK (char_length(credor_codigo) <= 20),
  credor_nome text NOT NULL CHECK (char_length(btrim(credor_nome)) BETWEEN 1 AND 300),
  servidor_id uuid REFERENCES public.servidores(id) ON DELETE SET NULL,
  viagem_id uuid REFERENCES public.viagens_diarias(id) ON DELETE SET NULL,
  quantidade numeric(5,1) NOT NULL CHECK (quantidade >= 0),
  processo_fiplan text CHECK (char_length(processo_fiplan) <= 30),
  data_empenho date,
  valor_empenhado numeric(12,2) NOT NULL CHECK (valor_empenhado >= 0),
  liquidacao_numero text CHECK (liquidacao_numero ~ '^\d{17}$'),
  valor_liquidado numeric(12,2) CHECK (valor_liquidado >= 0),
  nob_numero text CHECK (nob_numero ~ '^\d{17}$'),
  data_pagamento date,
  data_saida date,
  data_retorno date,
  ordem_servico text CHECK (char_length(ordem_servico) <= 30),
  prestou_contas boolean NOT NULL DEFAULT false,
  importacao_id uuid REFERENCES public.importacoes(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fin_diarias_fiplan_chave UNIQUE (exercicio, empenho_numero),
  CONSTRAINT fin_diarias_fiplan_periodo CHECK (data_retorno IS NULL OR data_saida IS NULL OR data_retorno >= data_saida)
);
ALTER TABLE public.fin_diarias_fiplan ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.fin_diarias_fiplan IS
  'Diárias do FIPLAN (FIP 002 – Demonstrativo de Diárias): empenho, liquidação, NOB, período da viagem e prestação de contas. Escrita só pela RPC importar_diarias_fiplan.';
COMMENT ON COLUMN public.fin_diarias_fiplan.prestou_contas IS 'Coluna PC do FIP 002 ("Sim"/"Não").';
COMMENT ON COLUMN public.fin_diarias_fiplan.viagem_id IS 'Viagem do RH (viagens_diarias) do mesmo servidor com a mesma data de saída, quando há uma só.';

CREATE INDEX IF NOT EXISTS idx_fin_diarias_fiplan_servidor ON public.fin_diarias_fiplan (servidor_id);
CREATE INDEX IF NOT EXISTS idx_fin_diarias_fiplan_viagem ON public.fin_diarias_fiplan (viagem_id);

-- Leitura: Financeiro, RH e o próprio servidor. Sem policy de escrita: ninguém grava pela API.
DROP POLICY IF EXISTS fin_diarias_fiplan_select ON public.fin_diarias_fiplan;
CREATE POLICY fin_diarias_fiplan_select ON public.fin_diarias_fiplan
  FOR SELECT TO authenticated
  USING (
    (SELECT public.perfil_ativo_atual())
    AND (
      ((SELECT public.can_access_module(auth.uid(), 'financeiro'))
        AND ((SELECT public.has_permission_code(auth.uid(), 'financeiro.diarias.visualizar'))
             OR (SELECT public.has_permission_code(auth.uid(), 'financeiro.execucao.importar'))))
      OR ((SELECT public.can_access_module(auth.uid(), 'rh'))
          AND (SELECT public.has_permission_code(auth.uid(), 'rh.viagens.visualizar')))
      OR servidor_id = (SELECT public.meu_servidor_id())
    )
  );

REVOKE ALL ON public.fin_diarias_fiplan FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.fin_diarias_fiplan FROM authenticated;


-- 2. Nome comparável: sem acento, sem caixa, sem espaço sobrando --------------
CREATE OR REPLACE FUNCTION public.fin_nome_comparavel(p_nome text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT regexp_replace(
    translate(lower(btrim(COALESCE(p_nome, ''))), 'áàâãäéèêëíìîïóòôõöúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn'),
    '\s+', ' ', 'g');
$$;

COMMENT ON FUNCTION public.fin_nome_comparavel(text) IS
  'Nome sem acento, em minúsculas e com um espaço entre as palavras, para ligar o credor do FIPLAN ao servidor.';

REVOKE ALL ON FUNCTION public.fin_nome_comparavel(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fin_nome_comparavel(text) TO authenticated;


-- 3. importar_diarias_fiplan ----------------------------------------------------
CREATE OR REPLACE FUNCTION public.importar_diarias_fiplan(
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
  c_doc constant text := '^\d{17}$';
  c_campos constant text[] := ARRAY['credor_codigo', 'credor_nome', 'servidor_id', 'viagem_id', 'quantidade',
    'processo_fiplan', 'data_empenho', 'valor_empenhado', 'liquidacao_numero', 'valor_liquidado', 'nob_numero',
    'data_pagamento', 'data_saida', 'data_retorno', 'ordem_servico', 'prestou_contas'];
  c_numericos constant text[] := ARRAY['quantidade', 'valor_empenhado', 'valor_liquidado'];
  v_uid uuid := auth.uid();
  v_linha jsonb;
  v_ind integer;
  v_empenho text;
  v_chaves text[] := '{}';
  v_novo jsonb;
  v_antigo jsonb;
  v_mudancas jsonb;
  v_avisos text[];
  v_campo text;
  v_existente public.fin_diarias_fiplan%ROWTYPE;
  v_servidores uuid[];
  v_viagens uuid[];
  v_servidor uuid;
  v_viagem uuid;
  v_acao text;
  v_linhas_res jsonb := '[]'::jsonb;
  v_erros jsonb := '[]'::jsonb;
  v_ins integer := 0; v_atu integer := 0; v_igual integer := 0;
  v_ausentes text[];
  v_totais jsonb;
  v_import_id uuid;
BEGIN
  p_simular := COALESCE(p_simular, true);

  -- COALESCE: um NULL em qualquer checagem nega (NOT NULL não dispararia o RAISE).
  IF v_uid IS NULL
     OR NOT COALESCE(public.perfil_ativo_atual()
                     AND public.can_access_module(v_uid, 'financeiro')
                     AND public.has_permission_code(v_uid, 'financeiro.execucao.importar'), false) THEN
    RAISE EXCEPTION 'Sem permissão para importar a execução do FIPLAN (financeiro.execucao.importar).' USING ERRCODE = '42501';
  END IF;
  IF p_exercicio IS NULL OR p_exercicio NOT BETWEEN 2000 AND 2100 THEN
    RAISE EXCEPTION 'Exercício inválido: %', p_exercicio USING ERRCODE = '22023';
  END IF;
  IF jsonb_typeof(p_linhas) IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_linhas) NOT BETWEEN 1 AND 10000 THEN
    RAISE EXCEPTION 'Envie de 1 a 10000 diárias.' USING ERRCODE = '22023';
  END IF;
  IF NOT p_simular AND (
       char_length(COALESCE(p_arquivo->>'nome', '')) NOT BETWEEN 1 AND 255
       OR COALESCE(p_arquivo->>'sha256', '') !~ '^[0-9a-f]{64}$'
       OR COALESCE(p_arquivo->>'tamanho', '') !~ '^\d{1,15}$') THEN
    RAISE EXCEPTION 'Dados do arquivo inválidos.' USING ERRCODE = '22023';
  END IF;

  -- Uma importação de diárias por exercício de cada vez
  PERFORM pg_advisory_xact_lock(hashtext('importar_diarias_fiplan'), p_exercicio);

  BEGIN
    IF NOT p_simular THEN
      INSERT INTO public.importacoes (tipo, modulo, arquivo_nome, arquivo_sha256, arquivo_tamanho, exercicio, created_by)
      VALUES ('diarias_fiplan', 'financeiro', p_arquivo->>'nome', p_arquivo->>'sha256',
              (p_arquivo->>'tamanho')::bigint, p_exercicio, v_uid)
      RETURNING id INTO v_import_id;
    END IF;

    FOR v_linha IN SELECT value FROM jsonb_array_elements(p_linhas) LOOP
      v_ind := COALESCE((v_linha->>'indice')::integer, -1);
      BEGIN
        v_empenho := btrim(COALESCE(v_linha->>'empenho_numero', ''));
        -- 17302 0001 26 001077: UO, UG, ano com dois dígitos, sequencial
        IF v_empenho !~ c_doc OR substr(v_empenho, 10, 2) <> right(p_exercicio::text, 2) THEN
          RAISE EXCEPTION 'Empenho "%" fora do padrão ou de outro exercício.', left(v_empenho, 30) USING ERRCODE = '22023';
        END IF;
        IF v_empenho = ANY (v_chaves) THEN
          RAISE EXCEPTION 'Empenho % repetido no arquivo.', v_empenho USING ERRCODE = '22023';
        END IF;
        v_chaves := v_chaves || v_empenho;
        IF NULLIF(btrim(v_linha->>'credor_nome'), '') IS NULL THEN
          RAISE EXCEPTION 'Empenho %: sem nome do credor.', v_empenho USING ERRCODE = '22023';
        END IF;
        IF (v_linha->>'valor_empenhado') IS NULL OR (v_linha->>'valor_empenhado')::numeric < 0 THEN
          RAISE EXCEPTION 'Empenho %: valor inválido.', v_empenho USING ERRCODE = '22023';
        END IF;

        v_avisos := '{}';

        -- Servidor: o único com o mesmo nome comparável
        SELECT array_agg(s.id) INTO v_servidores
          FROM public.servidores s
         WHERE public.fin_nome_comparavel(s.nome_completo) = public.fin_nome_comparavel(v_linha->>'credor_nome');
        v_servidor := CASE WHEN cardinality(v_servidores) = 1 THEN v_servidores[1] END;
        IF v_servidor IS NULL THEN
          v_avisos := v_avisos || CASE WHEN cardinality(v_servidores) > 1
            THEN 'Mais de um servidor com este nome: a diária fica sem servidor.'
            ELSE 'Nenhum servidor com este nome no cadastro: a diária fica sem servidor.' END;
        END IF;

        -- Viagem do RH: a única do servidor com a mesma saída (sem as canceladas)
        v_viagem := NULL;
        IF v_servidor IS NOT NULL AND (v_linha->>'data_saida') IS NOT NULL THEN
          SELECT array_agg(v.id) INTO v_viagens
            FROM public.viagens_diarias v
           WHERE v.servidor_id = v_servidor
             AND v.data_saida = (v_linha->>'data_saida')::date
             AND v.status IS DISTINCT FROM 'cancelada';
          v_viagem := CASE WHEN cardinality(v_viagens) = 1 THEN v_viagens[1] END;
        END IF;

        v_novo := jsonb_build_object(
          'credor_codigo',     NULLIF(btrim(v_linha->>'credor_codigo'), ''),
          'credor_nome',       left(btrim(v_linha->>'credor_nome'), 300),
          'servidor_id',       v_servidor,
          'viagem_id',         v_viagem,
          'quantidade',        round(COALESCE((v_linha->>'quantidade')::numeric, 0), 1),
          'processo_fiplan',   NULLIF(btrim(v_linha->>'processo_fiplan'), ''),
          'data_empenho',      (v_linha->>'data_empenho')::date,
          'valor_empenhado',   round((v_linha->>'valor_empenhado')::numeric, 2),
          'liquidacao_numero', NULLIF(btrim(v_linha->>'liquidacao_numero'), ''),
          'valor_liquidado',   round((v_linha->>'valor_liquidado')::numeric, 2),
          'nob_numero',        NULLIF(btrim(v_linha->>'nob_numero'), ''),
          'data_pagamento',    (v_linha->>'data_pagamento')::date,
          'data_saida',        (v_linha->>'data_saida')::date,
          'data_retorno',      (v_linha->>'data_retorno')::date,
          'ordem_servico',     NULLIF(btrim(v_linha->>'ordem_servico'), ''),
          'prestou_contas',    COALESCE((v_linha->>'prestou_contas')::boolean, false));

        SELECT * INTO v_existente FROM public.fin_diarias_fiplan
         WHERE exercicio = p_exercicio AND empenho_numero = v_empenho
         FOR UPDATE;
        IF NOT FOUND THEN
          INSERT INTO public.fin_diarias_fiplan
            (exercicio, empenho_numero, credor_codigo, credor_nome, servidor_id, viagem_id, quantidade, processo_fiplan,
             data_empenho, valor_empenhado, liquidacao_numero, valor_liquidado, nob_numero, data_pagamento, data_saida,
             data_retorno, ordem_servico, prestou_contas, importacao_id)
          VALUES
            (p_exercicio, v_empenho, v_novo->>'credor_codigo', v_novo->>'credor_nome', (v_novo->>'servidor_id')::uuid,
             (v_novo->>'viagem_id')::uuid, (v_novo->>'quantidade')::numeric, v_novo->>'processo_fiplan',
             (v_novo->>'data_empenho')::date, (v_novo->>'valor_empenhado')::numeric, v_novo->>'liquidacao_numero',
             (v_novo->>'valor_liquidado')::numeric, v_novo->>'nob_numero', (v_novo->>'data_pagamento')::date,
             (v_novo->>'data_saida')::date, (v_novo->>'data_retorno')::date, v_novo->>'ordem_servico',
             (v_novo->>'prestou_contas')::boolean, v_import_id);
          v_acao := 'inserir';
          v_mudancas := NULL;
          v_ins := v_ins + 1;
        ELSE
          v_antigo := to_jsonb(v_existente);
          v_mudancas := '{}'::jsonb;
          FOREACH v_campo IN ARRAY c_campos LOOP
            -- valores numéricos comparam como número (300 = 300.00)
            IF (CASE WHEN v_campo = ANY (c_numericos)
                     THEN (v_antigo->>v_campo)::numeric IS DISTINCT FROM (v_novo->>v_campo)::numeric
                     ELSE v_antigo->v_campo IS DISTINCT FROM v_novo->v_campo END) THEN
              v_mudancas := v_mudancas || jsonb_build_object(v_campo, jsonb_build_array(v_antigo->v_campo, v_novo->v_campo));
            END IF;
          END LOOP;
          IF v_mudancas = '{}'::jsonb THEN
            v_acao := 'sem_alteracao';
            v_mudancas := NULL;
            v_igual := v_igual + 1;
          ELSE
            UPDATE public.fin_diarias_fiplan
               SET credor_codigo = v_novo->>'credor_codigo', credor_nome = v_novo->>'credor_nome',
                   servidor_id = (v_novo->>'servidor_id')::uuid, viagem_id = (v_novo->>'viagem_id')::uuid,
                   quantidade = (v_novo->>'quantidade')::numeric, processo_fiplan = v_novo->>'processo_fiplan',
                   data_empenho = (v_novo->>'data_empenho')::date,
                   valor_empenhado = (v_novo->>'valor_empenhado')::numeric,
                   liquidacao_numero = v_novo->>'liquidacao_numero',
                   valor_liquidado = (v_novo->>'valor_liquidado')::numeric, nob_numero = v_novo->>'nob_numero',
                   data_pagamento = (v_novo->>'data_pagamento')::date, data_saida = (v_novo->>'data_saida')::date,
                   data_retorno = (v_novo->>'data_retorno')::date, ordem_servico = v_novo->>'ordem_servico',
                   prestou_contas = (v_novo->>'prestou_contas')::boolean,
                   importacao_id = COALESCE(v_import_id, importacao_id), updated_at = now()
             WHERE id = v_existente.id;
            v_acao := 'atualizar';
            v_atu := v_atu + 1;
          END IF;
        END IF;

        v_linhas_res := v_linhas_res || jsonb_build_object('indice', v_ind, 'acao', v_acao, 'mudancas', v_mudancas,
          'avisos', CASE WHEN cardinality(v_avisos) > 0 THEN to_jsonb(v_avisos) END);
      EXCEPTION
        WHEN OTHERS THEN
          v_erros := v_erros || jsonb_build_object('indice', v_ind, 'mensagem',
            CASE WHEN left(SQLSTATE, 2) IN ('22', '23') OR SQLSTATE IN ('P0001', '42501') THEN SQLERRM
                 ELSE format('Erro inesperado ao gravar a linha (código %s).', SQLSTATE) END);
      END;
    END LOOP;

    IF p_simular OR jsonb_array_length(v_erros) > 0 THEN
      RAISE EXCEPTION 'importação desfeita' USING ERRCODE = 'DIA01';
    END IF;
  EXCEPTION
    WHEN SQLSTATE 'DIA01' THEN v_import_id := NULL;  -- desfaz tudo, inclusive o log; as variáveis continuam valendo
  END;

  -- Diárias do exercício que não vieram no arquivo: só avisadas, nunca apagadas.
  SELECT array_agg(empenho_numero ORDER BY empenho_numero) INTO v_ausentes
    FROM public.fin_diarias_fiplan
   WHERE exercicio = p_exercicio
     AND NOT (empenho_numero = ANY (v_chaves));

  v_totais := jsonb_build_object('inserir', v_ins, 'atualizar', v_atu, 'sem_alteracao', v_igual);

  IF v_import_id IS NOT NULL THEN
    UPDATE public.importacoes
       SET resumo = jsonb_build_object('totais', v_totais, 'ausentes', to_jsonb(COALESCE(v_ausentes, '{}'::text[])))
     WHERE id = v_import_id;
  END IF;

  RETURN jsonb_build_object(
    'simulacao', p_simular,
    'importacao_id', v_import_id,
    'totais', v_totais,
    'ausentes', to_jsonb(COALESCE(v_ausentes, '{}'::text[])),
    'linhas', v_linhas_res,
    'erros', v_erros
  );
END;
$$;

COMMENT ON FUNCTION public.importar_diarias_fiplan(integer, jsonb, jsonb, boolean) IS
  'Importa o FIP 002 (Demonstrativo de Diárias) do FIPLAN para fin_diarias_fiplan, ligando servidor e viagem do RH (p_simular = true só calcula; aplicação é tudo ou nada). Exige o módulo financeiro e financeiro.execucao.importar.';

REVOKE ALL ON FUNCTION public.importar_diarias_fiplan(integer, jsonb, jsonb, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.importar_diarias_fiplan(integer, jsonb, jsonb, boolean) TO authenticated;


-- 4. Rótulo da permissão de importar a execução --------------------------------
UPDATE public.module_permissions_catalog
   SET label = 'Importar a execução do FIPLAN (empenhos FIP 614, PEDs e diárias FIP 002)'
 WHERE permission_code = 'financeiro.execucao.importar';
