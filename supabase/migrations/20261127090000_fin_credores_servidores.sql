-- ============================================================================
-- Diárias ligadas ao servidor pelo código do credor (achado F9 do teste do Financeiro de 06/11/2026)
-- ============================================================================
-- O FIP 002 traz o código do credor de cada servidor (ex.: 2026017934) e o nome. A ligação era só pelo nome, e 48
-- das 131 diárias ficavam sem servidor. O relatório "Consultar Credor" do FIPLAN traz o código e o CPF/CNPJ de cada
-- credor; o CPF liga ao cadastro do RH.
--
--   fin_credores_servidores           código do credor (10 dígitos) → servidor. Guarda só a ligação: nenhum CPF de
--                                     terceiro fica no banco (LGPD), e o cadastro do RH não é alterado.
--   fin_credores_cpfs_de_servidores   dos CPFs do relatório, devolve só os que são de servidor (a tela manda em lotes
--                                     e mostra na conferência só os servidores, não o cadastro estadual inteiro).
--   importar_credores_fiplan          RPC do importador (simula ou aplica, tudo ou nada; nada é apagado). Grava a
--                                     ligação e liga ao servidor as diárias que estavam sem ele.
--   importar_diarias_fiplan           passa a procurar o servidor pelo código do credor antes do nome.
--
-- Todas exigem o módulo financeiro e financeiro.execucao.importar, como os outros importadores do FIPLAN.
-- Leitura da tabela: como fin_diarias_fiplan (Financeiro e RH). Ninguém grava pela API.
-- ============================================================================

-- 1. fin_credores_servidores -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fin_credores_servidores (
  credor_codigo text PRIMARY KEY CHECK (credor_codigo ~ '^\d{10}$'),
  servidor_id uuid NOT NULL REFERENCES public.servidores(id) ON DELETE CASCADE,
  credor_nome text CHECK (char_length(credor_nome) <= 300),
  importacao_id uuid REFERENCES public.importacoes(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.fin_credores_servidores ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.fin_credores_servidores IS
  'Código do credor no FIPLAN (só dígitos) → servidor, pelo CPF do relatório "Consultar Credor". Escrita só pela RPC importar_credores_fiplan.';

CREATE INDEX IF NOT EXISTS idx_fin_credores_servidores_servidor ON public.fin_credores_servidores (servidor_id);

DROP POLICY IF EXISTS fin_credores_servidores_select ON public.fin_credores_servidores;
CREATE POLICY fin_credores_servidores_select ON public.fin_credores_servidores
  FOR SELECT TO authenticated
  USING (
    (SELECT public.perfil_ativo_atual())
    AND (
      ((SELECT public.can_access_module(auth.uid(), 'financeiro'))
        AND ((SELECT public.has_permission_code(auth.uid(), 'financeiro.diarias.visualizar'))
             OR (SELECT public.has_permission_code(auth.uid(), 'financeiro.execucao.importar'))))
      OR ((SELECT public.can_access_module(auth.uid(), 'rh'))
          AND (SELECT public.has_permission_code(auth.uid(), 'rh.viagens.visualizar')))
    )
  );

REVOKE ALL ON public.fin_credores_servidores FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.fin_credores_servidores FROM authenticated;


-- 2. fin_credores_cpfs_de_servidores ----------------------------------------------
CREATE OR REPLACE FUNCTION public.fin_credores_cpfs_de_servidores(p_cpfs text[])
RETURNS text[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_res text[];
BEGIN
  IF v_uid IS NULL
     OR NOT COALESCE(public.perfil_ativo_atual()
                     AND public.can_access_module(v_uid, 'financeiro')
                     AND public.has_permission_code(v_uid, 'financeiro.execucao.importar'), false) THEN
    RAISE EXCEPTION 'Sem permissão para importar a execução do FIPLAN (financeiro.execucao.importar).' USING ERRCODE = '42501';
  END IF;
  IF p_cpfs IS NULL OR cardinality(p_cpfs) NOT BETWEEN 1 AND 10000 THEN
    RAISE EXCEPTION 'Envie de 1 a 10000 CPFs por vez.' USING ERRCODE = '22023';
  END IF;

  -- Junta com os CPFs do cadastro uma vez só (o relatório chega a 5000 CPFs por lote)
  SELECT array_agg(DISTINCT c.cpf) INTO v_res
    FROM unnest(p_cpfs) AS c(cpf)
    JOIN (SELECT DISTINCT regexp_replace(s.cpf, '\D', '', 'g') AS cpf FROM public.servidores s) srv ON srv.cpf = c.cpf
   WHERE c.cpf ~ '^\d{11}$';
  RETURN COALESCE(v_res, '{}'::text[]);
END;
$$;

COMMENT ON FUNCTION public.fin_credores_cpfs_de_servidores(text[]) IS
  'Dos CPFs (só dígitos) do relatório "Consultar Credor", devolve os que são de servidor. Exige o módulo financeiro e financeiro.execucao.importar.';

REVOKE ALL ON FUNCTION public.fin_credores_cpfs_de_servidores(text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fin_credores_cpfs_de_servidores(text[]) TO authenticated;


-- 3. importar_credores_fiplan -----------------------------------------------------
-- Linha: {indice, credor_codigo (10 dígitos), credor_nome, cpf (11 dígitos)}
CREATE OR REPLACE FUNCTION public.importar_credores_fiplan(
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
  v_ind integer;
  v_codigo text;
  v_cpf text;
  v_nome text;
  v_chaves text[] := '{}';
  v_servidores uuid[];
  v_servidor uuid;
  v_existente public.fin_credores_servidores%ROWTYPE;
  v_acao text;
  v_mudancas jsonb;
  v_avisos text[];
  v_sem_servidor integer;
  v_ligadas integer := 0;
  v_linhas_res jsonb := '[]'::jsonb;
  v_erros jsonb := '[]'::jsonb;
  v_ins integer := 0; v_atu integer := 0; v_igual integer := 0;
  v_totais jsonb;
  v_import_id uuid;
BEGIN
  p_simular := COALESCE(p_simular, true);

  IF v_uid IS NULL
     OR NOT COALESCE(public.perfil_ativo_atual()
                     AND public.can_access_module(v_uid, 'financeiro')
                     AND public.has_permission_code(v_uid, 'financeiro.execucao.importar'), false) THEN
    RAISE EXCEPTION 'Sem permissão para importar a execução do FIPLAN (financeiro.execucao.importar).' USING ERRCODE = '42501';
  END IF;
  IF jsonb_typeof(p_linhas) IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_linhas) NOT BETWEEN 1 AND 10000 THEN
    RAISE EXCEPTION 'Envie de 1 a 10000 credores.' USING ERRCODE = '22023';
  END IF;
  IF jsonb_typeof(p_arquivo) IS DISTINCT FROM 'object'
     OR char_length(COALESCE(p_arquivo->>'nome', '')) NOT BETWEEN 1 AND 255
     OR COALESCE(p_arquivo->>'sha256', '') !~ '^[0-9a-f]{64}$'
     OR COALESCE(p_arquivo->>'tamanho', '') !~ '^\d{1,15}$' THEN
    RAISE EXCEPTION 'Dados do arquivo inválidos.' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('importar_credores_fiplan'));

  BEGIN
    IF NOT p_simular THEN
      INSERT INTO public.importacoes (tipo, modulo, arquivo_nome, arquivo_sha256, arquivo_tamanho, created_by)
      VALUES ('credores_fiplan', 'financeiro', p_arquivo->>'nome', p_arquivo->>'sha256',
              (p_arquivo->>'tamanho')::bigint, v_uid)
      RETURNING id INTO v_import_id;
    END IF;

    FOR v_linha IN SELECT value FROM jsonb_array_elements(p_linhas) LOOP
      v_ind := COALESCE((v_linha->>'indice')::integer, -1);
      BEGIN
        v_codigo := btrim(COALESCE(v_linha->>'credor_codigo', ''));
        v_cpf := btrim(COALESCE(v_linha->>'cpf', ''));
        v_nome := left(NULLIF(btrim(v_linha->>'credor_nome'), ''), 300);
        IF v_codigo !~ '^\d{10}$' THEN
          RAISE EXCEPTION 'Código do credor "%" fora do padrão (10 dígitos).', left(v_codigo, 20) USING ERRCODE = '22023';
        END IF;
        IF v_cpf !~ '^\d{11}$' THEN
          RAISE EXCEPTION 'Credor %: CPF fora do padrão.', v_codigo USING ERRCODE = '22023';
        END IF;
        IF v_codigo = ANY (v_chaves) THEN
          RAISE EXCEPTION 'Credor % repetido no arquivo.', v_codigo USING ERRCODE = '22023';
        END IF;
        v_chaves := v_chaves || v_codigo;
        v_avisos := '{}';

        SELECT array_agg(s.id) INTO v_servidores
          FROM public.servidores s
         WHERE regexp_replace(s.cpf, '\D', '', 'g') = v_cpf;
        IF cardinality(v_servidores) IS DISTINCT FROM 1 THEN
          RAISE EXCEPTION 'Credor %: %', v_codigo,
            CASE WHEN cardinality(v_servidores) > 1 THEN 'mais de um servidor com este CPF no cadastro.'
                 ELSE 'nenhum servidor com este CPF no cadastro.' END
            USING ERRCODE = '22023';
        END IF;
        v_servidor := v_servidores[1];

        SELECT * INTO v_existente FROM public.fin_credores_servidores WHERE credor_codigo = v_codigo FOR UPDATE;
        IF NOT FOUND THEN
          INSERT INTO public.fin_credores_servidores (credor_codigo, servidor_id, credor_nome, importacao_id)
          VALUES (v_codigo, v_servidor, v_nome, v_import_id);
          v_acao := 'inserir';
          v_mudancas := NULL;
          v_ins := v_ins + 1;
        ELSIF v_existente.servidor_id IS DISTINCT FROM v_servidor OR v_existente.credor_nome IS DISTINCT FROM v_nome THEN
          v_mudancas := '{}'::jsonb;
          IF v_existente.servidor_id IS DISTINCT FROM v_servidor THEN
            v_mudancas := v_mudancas || jsonb_build_object('servidor_id', jsonb_build_array(v_existente.servidor_id, v_servidor));
          END IF;
          IF v_existente.credor_nome IS DISTINCT FROM v_nome THEN
            v_mudancas := v_mudancas || jsonb_build_object('credor_nome', jsonb_build_array(v_existente.credor_nome, v_nome));
          END IF;
          UPDATE public.fin_credores_servidores
             SET servidor_id = v_servidor, credor_nome = v_nome,
                 importacao_id = COALESCE(v_import_id, importacao_id), updated_at = now()
           WHERE credor_codigo = v_codigo;
          v_acao := 'atualizar';
          v_atu := v_atu + 1;
        ELSE
          v_acao := 'sem_alteracao';
          v_mudancas := NULL;
          v_igual := v_igual + 1;
        END IF;

        -- Diárias deste credor que estavam sem servidor
        SELECT count(*) INTO v_sem_servidor
          FROM public.fin_diarias_fiplan d
         WHERE d.servidor_id IS NULL
           AND regexp_replace(COALESCE(d.credor_codigo, ''), '\D', '', 'g') = v_codigo;
        IF v_sem_servidor > 0 THEN
          v_avisos := v_avisos || format('%s diária(s) sem servidor passam a ficar ligadas a ele.', v_sem_servidor);
          v_ligadas := v_ligadas + v_sem_servidor;
          UPDATE public.fin_diarias_fiplan d
             SET servidor_id = v_servidor,
                 -- viagem do RH: a única do servidor com a mesma saída (sem as canceladas), como no FIP 002
                 viagem_id = (SELECT CASE WHEN count(*) = 1 THEN (array_agg(v.id))[1] END
                                FROM public.viagens_diarias v
                               WHERE v.servidor_id = v_servidor
                                 AND v.data_saida = d.data_saida
                                 AND v.status IS DISTINCT FROM 'cancelada'),
                 updated_at = now()
           WHERE d.servidor_id IS NULL
             AND regexp_replace(COALESCE(d.credor_codigo, ''), '\D', '', 'g') = v_codigo;
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
      RAISE EXCEPTION 'importação desfeita' USING ERRCODE = 'CRE01';
    END IF;
  EXCEPTION
    WHEN SQLSTATE 'CRE01' THEN v_import_id := NULL;  -- desfaz tudo, inclusive o log; as variáveis continuam valendo
  END;

  v_totais := jsonb_build_object('inserir', v_ins, 'atualizar', v_atu, 'sem_alteracao', v_igual);

  IF v_import_id IS NOT NULL THEN
    UPDATE public.importacoes
       SET resumo = jsonb_build_object('totais', v_totais, 'diarias_ligadas', v_ligadas)
     WHERE id = v_import_id;
  END IF;

  RETURN jsonb_build_object(
    'simulacao', p_simular,
    'importacao_id', v_import_id,
    'totais', v_totais,
    'linhas', v_linhas_res,
    'erros', v_erros
  );
END;
$$;

COMMENT ON FUNCTION public.importar_credores_fiplan(jsonb, jsonb, boolean) IS
  'Liga o código do credor do FIPLAN ao servidor pelo CPF (relatório "Consultar Credor") e liga ao servidor as diárias que estavam sem ele (p_simular = true só calcula; aplicação é tudo ou nada). Exige o módulo financeiro e financeiro.execucao.importar.';

REVOKE ALL ON FUNCTION public.importar_credores_fiplan(jsonb, jsonb, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.importar_credores_fiplan(jsonb, jsonb, boolean) TO authenticated;


-- 4. importar_diarias_fiplan: servidor pelo código do credor antes do nome --------
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

        -- Servidor: primeiro pelo código do credor (ligado ao CPF pelo "Consultar Credor" do FIPLAN); sem ele,
        -- o único com o mesmo nome comparável
        SELECT m.servidor_id INTO v_servidor
          FROM public.fin_credores_servidores m
         WHERE m.credor_codigo = regexp_replace(COALESCE(v_linha->>'credor_codigo', ''), '\D', '', 'g');
        IF v_servidor IS NULL THEN
          SELECT array_agg(s.id) INTO v_servidores
            FROM public.servidores s
           WHERE public.fin_nome_comparavel(s.nome_completo) = public.fin_nome_comparavel(v_linha->>'credor_nome');
          v_servidor := CASE WHEN cardinality(v_servidores) = 1 THEN v_servidores[1] END;
        END IF;
        IF v_servidor IS NULL THEN
          v_avisos := v_avisos || CASE WHEN cardinality(v_servidores) > 1
            THEN 'Mais de um servidor com este nome e o código do credor não está ligado a um CPF: a diária fica sem servidor.'
            ELSE 'Nenhum servidor com este código de credor nem com este nome: importe o "Consultar Credor" do FIPLAN para ligar pelo CPF.' END;
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
  'Importa o FIP 002 (Demonstrativo de Diárias) do FIPLAN para fin_diarias_fiplan, ligando servidor (pelo código do credor e, sem ele, pelo nome) e viagem do RH (p_simular = true só calcula; aplicação é tudo ou nada). Exige o módulo financeiro e financeiro.execucao.importar.';

REVOKE ALL ON FUNCTION public.importar_diarias_fiplan(integer, jsonb, jsonb, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.importar_diarias_fiplan(integer, jsonb, jsonb, boolean) TO authenticated;
