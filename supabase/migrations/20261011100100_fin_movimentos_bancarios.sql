-- ============================================================================
-- FINANCEIRO — leitura de arquivos bancários (OBN600 do FIPLAN, CNAB240) e conciliação
-- ============================================================================
-- Spec: docs/superpowers/specs/2026-10-11-financeiro-fiplan-banco-design.md (Etapa 2)
--
--   fin_movimentos_bancarios           um registro por pagamento visto num arquivo do banco
--                                      (remessa ou retorno). Só leitura pela API.
--   importar_arquivo_bancario(...)     recebe as linhas lidas pelo parser do navegador e, numa
--                                      transação, cria/atualiza os movimentos, casa com
--                                      fin_pagamentos e marca como pago o que o banco pagou.
--                                      Com p_simular = true só calcula (padrão ResultadoBanco
--                                      de src/lib/importacao/types.ts).
--   conciliar_movimento_bancario(...)  vínculo manual movimento -> pagamento (ou desfaz com NULL).
--   pode_conciliar_pagamentos()        a tela e a Edge Function bb-api perguntam se o usuário pode.
--
-- Quem importa/concilia: permissão nova `pagamento.conciliar` (catálogo do financeiro) e acesso ao
-- módulo financeiro; o papel admin passa por cima em has_permission_code.
--
-- Chave do movimento (chave_unica, calculada aqui, nunca pelo cliente):
--   origem|identificador|valor (2 casas)|data_pagamento|tipo_lancamento
-- Reimportar o mesmo arquivo dá sem_alteracao; o retorno do banco atualiza situação, código de
-- retorno, motivo e autenticação do registro da remessa com a mesma chave.
--
-- CPF/CNPJ e conta do favorecido são dado pessoal: só quem acessa o módulo financeiro lê.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Permissão
-- ----------------------------------------------------------------------------
INSERT INTO public.module_permissions_catalog
  (module_code, permission_code, label, category, action_type, sort_order)
VALUES
  ('financeiro', 'pagamento.conciliar', 'Conciliar pagamentos com arquivos e extratos do banco', 'Pagamentos', 'conciliar', 508)
ON CONFLICT (permission_code) DO NOTHING;

-- Mesmos papéis que já autorizam pagamento (financeiro.pagamentos.autorizar); vale só com o módulo financeiro.
INSERT INTO public.role_permissions (role, permission)
VALUES ('admin', 'pagamento.conciliar'), ('manager', 'pagamento.conciliar')
ON CONFLICT (role, permission) DO NOTHING;


-- ----------------------------------------------------------------------------
-- 2. pode_conciliar_pagamentos
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.pode_conciliar_pagamentos()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(auth.uid() IS NOT NULL
                  AND public.perfil_ativo_atual()
                  AND public.can_access_module(auth.uid(), 'financeiro')
                  AND public.has_permission_code(auth.uid(), 'pagamento.conciliar'), false);
$$;

COMMENT ON FUNCTION public.pode_conciliar_pagamentos() IS
  'Verdadeiro se o usuário logado tem perfil ativo, o módulo financeiro e pagamento.conciliar.';

REVOKE ALL ON FUNCTION public.pode_conciliar_pagamentos() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pode_conciliar_pagamentos() TO authenticated;


-- ----------------------------------------------------------------------------
-- 3. fin_movimentos_bancarios
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fin_movimentos_bancarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origem text NOT NULL CHECK (origem IN ('obn600', 'cnab240')),
  sentido text NOT NULL CHECK (sentido IN ('remessa', 'retorno')),
  importacao_id uuid REFERENCES public.importacoes(id) ON DELETE SET NULL,
  data_arquivo date,
  sequencial_arquivo text CHECK (char_length(sequencial_arquivo) <= 20),
  tipo_lancamento text NOT NULL DEFAULT '' CHECK (char_length(tipo_lancamento) <= 50),
  identificador text NOT NULL CHECK (char_length(btrim(identificador)) BETWEEN 1 AND 60),
  favorecido_nome text CHECK (char_length(favorecido_nome) <= 255),
  favorecido_documento text CHECK (favorecido_documento ~ '^(\d{11}|\d{14})$'),
  banco text CHECK (char_length(banco) <= 10),
  agencia text CHECK (char_length(agencia) <= 20),
  conta text CHECK (char_length(conta) <= 30),
  valor numeric(15,2) NOT NULL CHECK (valor >= 0),
  data_pagamento date,
  codigo_barras text CHECK (char_length(codigo_barras) <= 60),
  autenticacao text CHECK (char_length(autenticacao) <= 100),
  situacao text NOT NULL CHECK (situacao IN ('enviado', 'pago', 'recusado')),
  motivo_recusa text CHECK (char_length(motivo_recusa) <= 500),
  codigo_retorno text CHECK (char_length(codigo_retorno) <= 50),
  pagamento_id uuid REFERENCES public.fin_pagamentos(id) ON DELETE SET NULL,
  conciliado_em timestamptz,
  conciliado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  importacao_retorno_id uuid REFERENCES public.importacoes(id) ON DELETE SET NULL,
  chave_unica text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.fin_movimentos_bancarios IS
  'Pagamentos vistos nos arquivos do banco (OBN600 do FIPLAN, CNAB240 da SEGAD e do Gestão MAX). Escrita só pelas RPCs importar_arquivo_bancario e conciliar_movimento_bancario. CPF/CNPJ e conta do favorecido: só o módulo financeiro lê.';
COMMENT ON COLUMN public.fin_movimentos_bancarios.chave_unica IS
  'origem|identificador|valor|data_pagamento|tipo_lancamento, calculada pela RPC de importação.';
COMMENT ON COLUMN public.fin_movimentos_bancarios.importacao_id IS
  'Importação que criou o registro (remessa ou, sem remessa prévia, o retorno).';
COMMENT ON COLUMN public.fin_movimentos_bancarios.importacao_retorno_id IS
  'Última importação de retorno que atualizou a situação do registro.';

CREATE INDEX IF NOT EXISTS idx_fin_mov_bancarios_pagamento ON public.fin_movimentos_bancarios (pagamento_id);
CREATE INDEX IF NOT EXISTS idx_fin_mov_bancarios_situacao ON public.fin_movimentos_bancarios (situacao);
CREATE INDEX IF NOT EXISTS idx_fin_mov_bancarios_documento ON public.fin_movimentos_bancarios (favorecido_documento);
CREATE INDEX IF NOT EXISTS idx_fin_mov_bancarios_importacao ON public.fin_movimentos_bancarios (importacao_id);
CREATE INDEX IF NOT EXISTS idx_fin_mov_bancarios_importacao_retorno ON public.fin_movimentos_bancarios (importacao_retorno_id);

ALTER TABLE public.fin_movimentos_bancarios ENABLE ROW LEVEL SECURITY;

-- Leitura: quem acessa o módulo financeiro. Sem policy de escrita: ninguém grava pela API.
DROP POLICY IF EXISTS fin_movimentos_bancarios_select ON public.fin_movimentos_bancarios;
CREATE POLICY fin_movimentos_bancarios_select ON public.fin_movimentos_bancarios
  FOR SELECT TO authenticated
  USING (
    (SELECT public.perfil_ativo_atual())
    AND public.can_access_module(auth.uid(), 'financeiro')
  );

REVOKE ALL ON public.fin_movimentos_bancarios FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.fin_movimentos_bancarios FROM authenticated;


-- ----------------------------------------------------------------------------
-- 4. Casamento movimento -> pagamento (uso interno das RPCs)
-- ----------------------------------------------------------------------------
-- As duas funções abaixo são SECURITY INVOKER e sem EXECUTE para a API: só rodam dentro das RPCs
-- SECURITY DEFINER (como o dono), que já conferiram a permissão.
-- Candidatos: mesmo identificador_transacao; ou mesmo exercício da data do pagamento, valor
-- líquido igual e CPF/CNPJ do fornecedor igual ao do favorecido. Pagamentos cancelados/estornados
-- não entram. Só devolve um id quando o melhor candidato é único (empate = não casa).
CREATE OR REPLACE FUNCTION public.fin_casar_movimento_pagamento(
  p_identificador text,
  p_documento text,
  p_valor numeric,
  p_data date
)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_doc text := NULLIF(ltrim(COALESCE(p_documento, ''), '0'), '');
  v_ids uuid[];
  v_pontos integer[];
BEGIN
  SELECT array_agg(c.id ORDER BY c.pontos DESC, c.id), array_agg(c.pontos ORDER BY c.pontos DESC, c.id)
    INTO v_ids, v_pontos
    FROM (
      SELECT p.id,
             (CASE WHEN p.identificador_transacao IS NOT NULL
                        AND btrim(p.identificador_transacao) = btrim(p_identificador) THEN 100 ELSE 0 END)
           + (CASE WHEN p.data_pagamento = p_data THEN 10 ELSE 0 END)
           + (CASE WHEN NOT EXISTS (SELECT 1 FROM public.fin_movimentos_bancarios m
                                     WHERE m.pagamento_id = p.id) THEN 1 ELSE 0 END) AS pontos
        FROM public.fin_pagamentos p
        LEFT JOIN public.fornecedores f ON f.id = p.fornecedor_id
       WHERE COALESCE(p.status::text, '') NOT IN ('cancelado', 'estornado')
         AND NOT COALESCE(p.estornado, false)
         AND (
           (p.identificador_transacao IS NOT NULL AND p_identificador IS NOT NULL
            AND btrim(p.identificador_transacao) = btrim(p_identificador))
           OR (v_doc IS NOT NULL AND p_data IS NOT NULL
               AND p.exercicio = extract(year FROM p_data)::integer
               AND p.valor_liquido = p_valor
               AND ltrim(regexp_replace(COALESCE(f.cpf_cnpj, ''), '\D', '', 'g'), '0') = v_doc)
         )
    ) c;

  IF v_ids IS NULL THEN
    RETURN NULL;
  END IF;
  IF cardinality(v_ids) > 1 AND v_pontos[1] = v_pontos[2] THEN
    RETURN NULL;  -- empate: deixa para a conciliação manual
  END IF;
  RETURN v_ids[1];
END;
$$;

COMMENT ON FUNCTION public.fin_casar_movimento_pagamento(text, text, numeric, date) IS
  'Uso interno das RPCs de conciliação bancária: devolve o pagamento que casa com o movimento (ou NULL se nenhum/empate). Fora da API.';

REVOKE ALL ON FUNCTION public.fin_casar_movimento_pagamento(text, text, numeric, date) FROM PUBLIC, anon, authenticated;


-- Marca o pagamento como pago quando o banco confirmou. Não mexe em pagamento já pago,
-- estornado, cancelado ou devolvido. Devolve o número do pagamento quando mudou.
CREATE OR REPLACE FUNCTION public.fin_marcar_pagamento_pago(p_pagamento_id uuid, p_data date)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_numero text;
BEGIN
  UPDATE public.fin_pagamentos
     SET status = 'pago',
         data_efetivacao = COALESCE(p_data, data_efetivacao, CURRENT_DATE),
         updated_at = now()
   WHERE id = p_pagamento_id
     AND COALESCE(status::text, '') NOT IN ('pago', 'estornado', 'cancelado', 'devolvido')
     AND NOT COALESCE(estornado, false)
  RETURNING numero INTO v_numero;
  RETURN v_numero;
END;
$$;

COMMENT ON FUNCTION public.fin_marcar_pagamento_pago(uuid, date) IS
  'Uso interno das RPCs de conciliação bancária: marca o pagamento como pago (status e data_efetivacao). Fora da API.';

REVOKE ALL ON FUNCTION public.fin_marcar_pagamento_pago(uuid, date) FROM PUBLIC, anon, authenticated;


-- ----------------------------------------------------------------------------
-- 5. importar_arquivo_bancario
-- ----------------------------------------------------------------------------
-- p_linhas: array de {origem, sentido, tipo_lancamento, identificador, favorecido_nome,
--   favorecido_documento (só dígitos), banco, agencia, conta, valor, data_pagamento (YYYY-MM-DD),
--   codigo_barras, autenticacao, situacao (enviado|pago|recusado), codigo_retorno, motivo_recusa}.
--   origem/sentido da linha, quando vierem, precisam bater com os de p_parametros.
-- p_arquivo: {nome, sha256, tamanho}.
-- p_parametros: {origem, sentido, data_arquivo (YYYY-MM-DD), sequencial_arquivo, convenio}.
CREATE OR REPLACE FUNCTION public.importar_arquivo_bancario(
  p_linhas jsonb,
  p_arquivo jsonb,
  p_parametros jsonb,
  p_simular boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_origem text := p_parametros->>'origem';
  v_sentido text := p_parametros->>'sentido';
  v_data_arquivo date;
  v_seq text := NULLIF(btrim(COALESCE(p_parametros->>'sequencial_arquivo', '')), '');
  v_linha jsonb;
  v_idx integer := -1;
  v_ident text; v_doc text; v_tipo text; v_sit text; v_valor numeric(15,2); v_data date;
  v_chave text;
  v_chaves text[] := '{}';
  v_existente public.fin_movimentos_bancarios%ROWTYPE;
  v_achou boolean;
  v_novo jsonb;
  v_mudancas jsonb;
  v_pag_id uuid;
  v_pag_status text;
  v_pago_numero text;
  v_mov_id uuid;
  v_resultado jsonb := '[]'::jsonb;
  v_ins integer := 0; v_upd integer := 0; v_igual integer := 0;
  v_vinculados text[] := '{}';
  v_pagos text[] := '{}';
  v_resumo jsonb;
  v_import_id uuid;
BEGIN
  p_simular := COALESCE(p_simular, true);

  -- COALESCE: um NULL em qualquer checagem nega (NOT NULL não dispararia o RAISE).
  IF v_uid IS NULL
     OR NOT COALESCE(public.perfil_ativo_atual()
                     AND public.can_access_module(v_uid, 'financeiro')
                     AND public.has_permission_code(v_uid, 'pagamento.conciliar'), false) THEN
    RAISE EXCEPTION 'Sem permissão para importar arquivo bancário (pagamento.conciliar).' USING ERRCODE = '42501';
  END IF;

  IF jsonb_typeof(p_parametros) IS DISTINCT FROM 'object'
     OR COALESCE(v_origem, '') NOT IN ('obn600', 'cnab240')
     OR COALESCE(v_sentido, '') NOT IN ('remessa', 'retorno') THEN
    RAISE EXCEPTION 'Parâmetros do arquivo inválidos (origem obn600|cnab240, sentido remessa|retorno).' USING ERRCODE = '22023';
  END IF;
  IF char_length(COALESCE(v_seq, '')) > 20
     OR char_length(COALESCE(p_parametros->>'convenio', '')) > 20 THEN
    RAISE EXCEPTION 'Sequencial ou convênio do arquivo inválido.' USING ERRCODE = '22023';
  END IF;
  IF NULLIF(p_parametros->>'data_arquivo', '') IS NOT NULL THEN
    IF (p_parametros->>'data_arquivo') !~ '^\d{4}-\d{2}-\d{2}$' THEN
      RAISE EXCEPTION 'Data do arquivo inválida.' USING ERRCODE = '22023';
    END IF;
    BEGIN
      v_data_arquivo := (p_parametros->>'data_arquivo')::date;
    EXCEPTION WHEN others THEN
      RAISE EXCEPTION 'Data do arquivo inválida.' USING ERRCODE = '22023';
    END;
  END IF;
  IF jsonb_typeof(p_linhas) IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_linhas) NOT BETWEEN 1 AND 20000 THEN
    RAISE EXCEPTION 'Envie de 1 a 20000 pagamentos.' USING ERRCODE = '22023';
  END IF;
  IF NOT p_simular AND (
       char_length(COALESCE(p_arquivo->>'nome', '')) NOT BETWEEN 1 AND 255
       OR COALESCE(p_arquivo->>'sha256', '') !~ '^[0-9a-f]{64}$'
       OR COALESCE(p_arquivo->>'tamanho', '') !~ '^\d{1,15}$') THEN
    RAISE EXCEPTION 'Dados do arquivo inválidos.' USING ERRCODE = '22023';
  END IF;

  -- Uma importação de arquivo bancário de cada vez (a chave é global).
  PERFORM pg_advisory_xact_lock(hashtext('importar_arquivo_bancario'));

  IF NOT p_simular THEN
    -- O log nasce antes para os movimentos apontarem para ele; resumo e detalhes vêm no fim.
    INSERT INTO public.importacoes
      (tipo, modulo, arquivo_nome, arquivo_sha256, arquivo_tamanho, exercicio, created_by)
    VALUES
      ('arquivo_bancario', 'financeiro', p_arquivo->>'nome', p_arquivo->>'sha256',
       (p_arquivo->>'tamanho')::bigint, extract(year FROM v_data_arquivo)::integer, v_uid)
    RETURNING id INTO v_import_id;
  END IF;

  FOR v_linha IN SELECT value FROM jsonb_array_elements(p_linhas) LOOP
    v_idx := v_idx + 1;

    IF jsonb_typeof(v_linha) IS DISTINCT FROM 'object' THEN
      RAISE EXCEPTION 'Linha %: formato inválido.', v_idx + 1 USING ERRCODE = '22023';
    END IF;
    v_ident := btrim(COALESCE(v_linha->>'identificador', ''));
    v_doc := NULLIF(v_linha->>'favorecido_documento', '');
    v_tipo := btrim(COALESCE(v_linha->>'tipo_lancamento', ''));
    v_sit := v_linha->>'situacao';

    IF COALESCE(v_linha->>'origem', v_origem) <> v_origem
       OR COALESCE(v_linha->>'sentido', v_sentido) <> v_sentido THEN
      RAISE EXCEPTION 'Linha %: origem/sentido diferente do arquivo.', v_idx + 1 USING ERRCODE = '22023';
    END IF;
    IF char_length(v_ident) NOT BETWEEN 1 AND 60
       OR char_length(v_tipo) > 50
       OR COALESCE(v_sit, '') NOT IN ('enviado', 'pago', 'recusado')
       OR (v_doc IS NOT NULL AND v_doc !~ '^(\d{11}|\d{14})$')
       OR char_length(COALESCE(v_linha->>'favorecido_nome', '')) > 255
       OR char_length(COALESCE(v_linha->>'banco', '')) > 10
       OR char_length(COALESCE(v_linha->>'agencia', '')) > 20
       OR char_length(COALESCE(v_linha->>'conta', '')) > 30
       OR char_length(COALESCE(v_linha->>'codigo_barras', '')) > 60
       OR char_length(COALESCE(v_linha->>'autenticacao', '')) > 100
       OR char_length(COALESCE(v_linha->>'codigo_retorno', '')) > 50
       OR char_length(COALESCE(v_linha->>'motivo_recusa', '')) > 500 THEN
      RAISE EXCEPTION 'Linha %: campos fora do padrão do arquivo bancário.', v_idx + 1 USING ERRCODE = '22023';
    END IF;
    IF jsonb_typeof(v_linha->'valor') IS DISTINCT FROM 'number'
       OR (v_linha->>'valor')::numeric < 0
       OR (v_linha->>'valor')::numeric >= 1e13 THEN
      RAISE EXCEPTION 'Linha %: valor inválido.', v_idx + 1 USING ERRCODE = '22023';
    END IF;
    v_valor := round((v_linha->>'valor')::numeric, 2);
    v_data := NULL;
    IF NULLIF(v_linha->>'data_pagamento', '') IS NOT NULL THEN
      IF (v_linha->>'data_pagamento') !~ '^\d{4}-\d{2}-\d{2}$' THEN
        RAISE EXCEPTION 'Linha %: data de pagamento inválida.', v_idx + 1 USING ERRCODE = '22023';
      END IF;
      BEGIN
        v_data := (v_linha->>'data_pagamento')::date;
      EXCEPTION WHEN others THEN
        RAISE EXCEPTION 'Linha %: data de pagamento inválida.', v_idx + 1 USING ERRCODE = '22023';
      END;
    END IF;

    v_chave := concat_ws('|', v_origem, v_ident, v_valor::text, COALESCE(v_data::text, ''), v_tipo);
    IF v_chave = ANY (v_chaves) THEN
      RAISE EXCEPTION 'Linha %: pagamento repetido no arquivo (identificador %).', v_idx + 1, v_ident USING ERRCODE = '22023';
    END IF;
    v_chaves := v_chaves || v_chave;

    SELECT * INTO v_existente FROM public.fin_movimentos_bancarios WHERE chave_unica = v_chave FOR UPDATE;
    v_achou := FOUND;

    -- Casamento com fin_pagamentos (só quando ainda não há vínculo)
    v_pag_id := CASE WHEN v_achou THEN v_existente.pagamento_id END;
    IF v_pag_id IS NULL THEN
      v_pag_id := public.fin_casar_movimento_pagamento(v_ident, v_doc, v_valor, v_data);
    END IF;

    IF NOT v_achou THEN
      v_ins := v_ins + 1;
      IF NOT p_simular THEN
        INSERT INTO public.fin_movimentos_bancarios (
          origem, sentido, importacao_id, data_arquivo, sequencial_arquivo, tipo_lancamento, identificador,
          favorecido_nome, favorecido_documento, banco, agencia, conta, valor, data_pagamento,
          codigo_barras, autenticacao, situacao, motivo_recusa, codigo_retorno,
          pagamento_id, conciliado_em, importacao_retorno_id, chave_unica
        ) VALUES (
          v_origem, v_sentido, v_import_id, v_data_arquivo, v_seq, v_tipo, v_ident,
          NULLIF(btrim(COALESCE(v_linha->>'favorecido_nome', '')), ''), v_doc,
          NULLIF(v_linha->>'banco', ''), NULLIF(v_linha->>'agencia', ''), NULLIF(v_linha->>'conta', ''),
          v_valor, v_data,
          NULLIF(v_linha->>'codigo_barras', ''), NULLIF(v_linha->>'autenticacao', ''), v_sit,
          NULLIF(v_linha->>'motivo_recusa', ''), NULLIF(v_linha->>'codigo_retorno', ''),
          v_pag_id, CASE WHEN v_pag_id IS NOT NULL THEN now() END,
          CASE WHEN v_sentido = 'retorno' THEN v_import_id END, v_chave
        );
      END IF;
      v_resultado := v_resultado || jsonb_strip_nulls(jsonb_build_object(
        'indice', v_idx, 'acao', 'inserir',
        'mudancas', CASE WHEN v_pag_id IS NOT NULL
                         THEN jsonb_build_object('pagamento_id', jsonb_build_array(NULL, v_pag_id)) END));
      v_mov_id := NULL;
    ELSE
      v_mov_id := v_existente.id;
      -- A remessa nunca rebaixa o que o retorno já disse: reimportar remessa só pode vincular.
      IF v_sentido = 'retorno' THEN
        v_novo := jsonb_build_object(
          -- Retorno que só diz "agendado/enviado" não desfaz um pago.
          'situacao', CASE WHEN v_existente.situacao = 'pago' AND v_sit = 'enviado' THEN 'pago' ELSE v_sit END,
          'codigo_retorno', NULLIF(v_linha->>'codigo_retorno', ''),
          'motivo_recusa', NULLIF(v_linha->>'motivo_recusa', ''),
          'autenticacao', COALESCE(NULLIF(v_linha->>'autenticacao', ''), v_existente.autenticacao)
        );
      ELSE
        v_novo := '{}'::jsonb;
      END IF;
      v_novo := v_novo || jsonb_strip_nulls(jsonb_build_object('pagamento_id', v_pag_id));

      SELECT COALESCE(jsonb_object_agg(k, jsonb_build_array(to_jsonb(v_existente) -> k, v_novo -> k)), '{}'::jsonb)
        INTO v_mudancas
        FROM jsonb_object_keys(v_novo) AS k
       WHERE (to_jsonb(v_existente) -> k) IS DISTINCT FROM (v_novo -> k);

      IF v_mudancas = '{}'::jsonb THEN
        v_igual := v_igual + 1;
        v_resultado := v_resultado || jsonb_build_object('indice', v_idx, 'acao', 'sem_alteracao');
      ELSE
        v_upd := v_upd + 1;
        v_resultado := v_resultado || jsonb_build_object('indice', v_idx, 'acao', 'atualizar', 'mudancas', v_mudancas);
        IF NOT p_simular THEN
          UPDATE public.fin_movimentos_bancarios SET
            situacao       = COALESCE(v_novo->>'situacao', situacao),
            codigo_retorno = CASE WHEN v_novo ? 'situacao' THEN v_novo->>'codigo_retorno' ELSE codigo_retorno END,
            motivo_recusa  = CASE WHEN v_novo ? 'situacao' THEN v_novo->>'motivo_recusa' ELSE motivo_recusa END,
            autenticacao   = CASE WHEN v_novo ? 'situacao' THEN v_novo->>'autenticacao' ELSE autenticacao END,
            importacao_retorno_id = CASE WHEN v_novo ? 'situacao' THEN v_import_id ELSE importacao_retorno_id END,
            pagamento_id   = COALESCE(v_pag_id, pagamento_id),
            conciliado_em  = CASE WHEN pagamento_id IS NULL AND v_pag_id IS NOT NULL THEN now() ELSE conciliado_em END,
            updated_at     = now()
          WHERE id = v_existente.id;
        END IF;
      END IF;
      v_sit := COALESCE(v_novo->>'situacao', v_existente.situacao);
    END IF;

    -- Pagamento vinculado e pago pelo banco: marca no fin_pagamentos.
    IF v_pag_id IS NOT NULL THEN
      SELECT p.numero, p.status::text INTO v_pago_numero, v_pag_status FROM public.fin_pagamentos p WHERE p.id = v_pag_id;
      IF NOT (v_pago_numero = ANY (v_vinculados)) THEN v_vinculados := v_vinculados || v_pago_numero; END IF;
      IF v_sit = 'pago' AND COALESCE(v_pag_status, '') NOT IN ('pago', 'estornado', 'cancelado', 'devolvido') THEN
        IF p_simular THEN
          IF NOT (v_pago_numero = ANY (v_pagos)) THEN v_pagos := v_pagos || v_pago_numero; END IF;
        ELSE
          v_pago_numero := public.fin_marcar_pagamento_pago(v_pag_id, v_data);
          IF v_pago_numero IS NOT NULL AND NOT (v_pago_numero = ANY (v_pagos)) THEN
            v_pagos := v_pagos || v_pago_numero;
          END IF;
        END IF;
      END IF;
    END IF;
  END LOOP;

  v_resumo := jsonb_build_object(
    'totais', jsonb_build_object('inserir', v_ins, 'atualizar', v_upd, 'sem_alteracao', v_igual),
    'criados', jsonb_strip_nulls(jsonb_build_object(
      'Pagamentos vinculados', CASE WHEN cardinality(v_vinculados) > 0 THEN to_jsonb(v_vinculados) END,
      'Pagamentos marcados como pagos', CASE WHEN cardinality(v_pagos) > 0 THEN to_jsonb(v_pagos) END)),
    'ausentes', '[]'::jsonb,
    'parametros', jsonb_strip_nulls(jsonb_build_object(
      'origem', v_origem, 'sentido', v_sentido, 'data_arquivo', v_data_arquivo,
      'sequencial_arquivo', v_seq, 'convenio', NULLIF(p_parametros->>'convenio', '')))
  );

  IF NOT p_simular THEN
    UPDATE public.importacoes SET resumo = v_resumo, detalhes = v_resultado WHERE id = v_import_id;
  END IF;

  RETURN v_resumo || jsonb_build_object(
    'simulacao', p_simular,
    'importacao_id', v_import_id,
    'linhas', v_resultado
  );
END;
$$;

COMMENT ON FUNCTION public.importar_arquivo_bancario(jsonb, jsonb, jsonb, boolean) IS
  'Importa as linhas de um arquivo bancário (OBN600/CNAB240) para fin_movimentos_bancarios, casa com fin_pagamentos e marca os pagos (p_simular = true só calcula). Exige pagamento.conciliar.';

REVOKE ALL ON FUNCTION public.importar_arquivo_bancario(jsonb, jsonb, jsonb, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.importar_arquivo_bancario(jsonb, jsonb, jsonb, boolean) TO authenticated;


-- ----------------------------------------------------------------------------
-- 6. conciliar_movimento_bancario (manual)
-- ----------------------------------------------------------------------------
-- p_pagamento_id NULL desfaz o vínculo (não desfaz o status do pagamento). Com movimento pago,
-- vincular marca o pagamento como pago, pela mesma regra da importação.
CREATE OR REPLACE FUNCTION public.conciliar_movimento_bancario(p_movimento_id uuid, p_pagamento_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_mov public.fin_movimentos_bancarios%ROWTYPE;
  v_pag public.fin_pagamentos%ROWTYPE;
  v_marcado text;
BEGIN
  IF v_uid IS NULL
     OR NOT COALESCE(public.perfil_ativo_atual()
                     AND public.can_access_module(v_uid, 'financeiro')
                     AND public.has_permission_code(v_uid, 'pagamento.conciliar'), false) THEN
    RAISE EXCEPTION 'Sem permissão para conciliar pagamentos (pagamento.conciliar).' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_mov FROM public.fin_movimentos_bancarios WHERE id = p_movimento_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Movimento bancário não encontrado.' USING ERRCODE = 'P0002';
  END IF;

  IF p_pagamento_id IS NULL THEN
    UPDATE public.fin_movimentos_bancarios
       SET pagamento_id = NULL, conciliado_em = NULL, conciliado_por = NULL, updated_at = now()
     WHERE id = p_movimento_id;
    RETURN jsonb_build_object('movimento_id', p_movimento_id, 'pagamento_id', NULL);
  END IF;

  SELECT * INTO v_pag FROM public.fin_pagamentos WHERE id = p_pagamento_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pagamento não encontrado.' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.fin_movimentos_bancarios
     SET pagamento_id = p_pagamento_id, conciliado_em = now(), conciliado_por = v_uid, updated_at = now()
   WHERE id = p_movimento_id;

  IF v_mov.situacao = 'pago' THEN
    v_marcado := public.fin_marcar_pagamento_pago(p_pagamento_id, v_mov.data_pagamento);
  END IF;

  RETURN jsonb_build_object(
    'movimento_id', p_movimento_id,
    'pagamento_id', p_pagamento_id,
    'pagamento_numero', v_pag.numero,
    'pagamento_marcado_pago', v_marcado IS NOT NULL,
    'valor_confere', v_pag.valor_liquido = v_mov.valor
  );
END;
$$;

COMMENT ON FUNCTION public.conciliar_movimento_bancario(uuid, uuid) IS
  'Vincula manualmente um movimento bancário a um pagamento (NULL desfaz). Movimento pago marca o pagamento como pago. Exige pagamento.conciliar.';

REVOKE ALL ON FUNCTION public.conciliar_movimento_bancario(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.conciliar_movimento_bancario(uuid, uuid) TO authenticated;
