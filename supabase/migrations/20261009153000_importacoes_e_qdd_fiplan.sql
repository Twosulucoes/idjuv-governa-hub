-- ============================================================================
-- IMPORTAÇÃO DE DADOS — log genérico de importações + importador do QDD (FIPLAN)
-- ============================================================================
-- Spec: docs/superpowers/specs/2026-10-09-importacao-dados-qdd-fiplan-design.md
--
--   importacoes                 log de toda importação aplicada (quem, quando, arquivo,
--                               hash, resumo e o que mudou). Só leitura pela API: as linhas
--                               nascem dentro das RPCs de importação (SECURITY DEFINER).
--   importar_qdd_fiplan(...)    recebe as dotações lidas do PDF do QDD do FIPLAN e, numa
--                               transação, cria/atualiza fin_dotacoes (e os cadastros de
--                               programa, ação/PAOE, natureza e fonte que faltarem).
--                               Com p_simular = true só calcula o que mudaria.
--
-- Quem importa: permissão `orcamento.importar` (catálogo do módulo financeiro) e acesso ao
-- módulo financeiro; o papel admin já passa por cima em has_permission_code.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Permissão
-- ----------------------------------------------------------------------------
INSERT INTO public.module_permissions_catalog
  (module_code, permission_code, label, category, action_type, sort_order)
VALUES
  ('financeiro', 'orcamento.importar', 'Importar QDD do FIPLAN', 'Orçamento', 'importar', 507)
ON CONFLICT (permission_code) DO NOTHING;


-- ----------------------------------------------------------------------------
-- 2. importacoes (log)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.importacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL CHECK (tipo ~ '^[a-z0-9_]{3,50}$'),
  modulo public.app_module NOT NULL,
  arquivo_nome text NOT NULL CHECK (char_length(arquivo_nome) BETWEEN 1 AND 255),
  arquivo_sha256 text NOT NULL CHECK (arquivo_sha256 ~ '^[0-9a-f]{64}$'),
  arquivo_tamanho bigint NOT NULL CHECK (arquivo_tamanho >= 0),
  exercicio integer,
  resumo jsonb NOT NULL DEFAULT '{}'::jsonb,
  detalhes jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.importacoes IS
  'Log das importações de dados aplicadas (tipo do importador, arquivo, hash, resumo e mudanças). Escrita só pelas RPCs de importação.';

CREATE INDEX IF NOT EXISTS idx_importacoes_tipo_data ON public.importacoes (tipo, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_importacoes_hash ON public.importacoes (arquivo_sha256);

ALTER TABLE public.importacoes ENABLE ROW LEVEL SECURITY;

-- Leitura: quem acessa o módulo dono dos dados. Sem policy de escrita: ninguém grava pela API.
CREATE POLICY importacoes_select ON public.importacoes
  FOR SELECT TO authenticated
  USING (
    (SELECT public.perfil_ativo_atual())
    AND public.can_access_module(auth.uid(), modulo::text)
  );

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.importacoes FROM anon, authenticated;


-- ----------------------------------------------------------------------------
-- 3. importar_qdd_fiplan
-- ----------------------------------------------------------------------------
-- Chave da dotação (fin_dotacoes.codigo_dotacao, única por exercício):
--   função.subfunção.programa.PAOE.regional.natureza.fonte.cod_acomp.IDU
--   ex.: 27.812.030.2544.9900.33903900.1.500.0000.Não
-- Dotações gravadas pelo importador antigo de planilha (codigo = natureza.fonte.IDU, com o
-- PAOE na coluna paoe) são reconhecidas e passam a usar a chave nova.
--
-- p_linhas: array de objetos com funcao, subfuncao, programa_codigo, programa_nome,
--   paoe_codigo, paoe_nome, regional, natureza (8 dígitos), fonte (ex.: 1.500), cod_acomp,
--   idu, tro e valores {inicial, suplementado, anulado, bloqueado, reserva, ped, empenhado,
--   liquidado, em_liquidacao, pago, restos}. Atual e Disponível são calculados pela tabela.
-- p_arquivo: {nome, sha256, tamanho}.
CREATE OR REPLACE FUNCTION public.importar_qdd_fiplan(
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
  v_uid uuid := auth.uid();
  v_linha jsonb;
  v_val jsonb;
  v_idx integer := -1;
  v_nat text; v_fonte text; v_prog text; v_paoe text; v_paoe_desc text;
  v_codigo text;
  v_codigos text[] := '{}';
  v_prog_id uuid; v_acao_id uuid; v_nat_id uuid; v_fonte_id uuid;
  v_existente public.fin_dotacoes%ROWTYPE;
  v_achou boolean;
  v_novo jsonb;
  v_mudancas jsonb;
  v_dotacao_id uuid;
  v_ids uuid[] := '{}';
  v_paoes text[] := '{}';
  v_resultado jsonb := '[]'::jsonb;
  v_ins integer := 0; v_upd integer := 0; v_igual integer := 0;
  v_cri_prog text[] := '{}'; v_cri_acao text[] := '{}';
  v_cri_nat text[] := '{}'; v_cri_fonte text[] := '{}';
  v_ausentes text[];
  v_resumo jsonb;
  v_import_id uuid;
BEGIN
  IF v_uid IS NULL
     OR NOT public.perfil_ativo_atual()
     OR NOT public.can_access_module(v_uid, 'financeiro')
     OR NOT public.has_permission_code(v_uid, 'orcamento.importar') THEN
    RAISE EXCEPTION 'Sem permissão para importar o QDD (orcamento.importar).' USING ERRCODE = '42501';
  END IF;

  IF p_exercicio IS NULL OR p_exercicio NOT BETWEEN 2000 AND 2100 THEN
    RAISE EXCEPTION 'Exercício inválido: %', p_exercicio USING ERRCODE = '22023';
  END IF;
  IF jsonb_typeof(p_linhas) IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_linhas) NOT BETWEEN 1 AND 5000 THEN
    RAISE EXCEPTION 'Envie de 1 a 5000 dotações.' USING ERRCODE = '22023';
  END IF;
  IF NOT p_simular AND (
       char_length(COALESCE(p_arquivo->>'nome', '')) NOT BETWEEN 1 AND 255
       OR COALESCE(p_arquivo->>'sha256', '') !~ '^[0-9a-f]{64}$'
       OR COALESCE(p_arquivo->>'tamanho', '') !~ '^\d{1,15}$') THEN
    RAISE EXCEPTION 'Dados do arquivo inválidos.' USING ERRCODE = '22023';
  END IF;

  -- Uma importação de QDD por exercício de cada vez.
  PERFORM pg_advisory_xact_lock(hashtext('importar_qdd_fiplan'), p_exercicio);

  FOR v_linha IN SELECT value FROM jsonb_array_elements(p_linhas) LOOP
    v_idx := v_idx + 1;
    v_val := COALESCE(v_linha->'valores', '{}'::jsonb);
    v_nat := v_linha->>'natureza';
    v_fonte := v_linha->>'fonte';
    v_prog := v_linha->>'programa_codigo';
    v_paoe := v_linha->>'paoe_codigo';

    IF COALESCE(v_nat, '') !~ '^\d{8}$'
       OR COALESCE(v_fonte, '') !~ '^\d\.\d{3}$'
       OR COALESCE(v_linha->>'cod_acomp', '') !~ '^\d{4}$'
       OR COALESCE(v_linha->>'funcao', '') !~ '^\d{1,2}$'
       OR COALESCE(v_linha->>'subfuncao', '') !~ '^\d{1,3}$'
       OR COALESCE(v_prog, '') !~ '^\d{1,4}$'
       OR COALESCE(v_paoe, '') !~ '^\d{1,4}$'
       OR COALESCE(v_linha->>'regional', '') !~ '^\d{1,4}$'
       OR char_length(COALESCE(v_linha->>'idu', '')) NOT BETWEEN 1 AND 6
       OR char_length(COALESCE(v_linha->>'tro', '')) > 10
       OR char_length(COALESCE(v_linha->>'programa_nome', '')) > 255
       OR char_length(COALESCE(v_linha->>'paoe_nome', '')) > 255 THEN
      RAISE EXCEPTION 'Linha %: classificação fora do padrão do QDD.', v_idx + 1 USING ERRCODE = '22023';
    END IF;
    IF EXISTS (
      SELECT 1 FROM jsonb_each(v_val) e
      WHERE jsonb_typeof(e.value) <> 'number' OR abs((e.value)::text::numeric) >= 1e13
    ) THEN
      RAISE EXCEPTION 'Linha %: valor inválido.', v_idx + 1 USING ERRCODE = '22023';
    END IF;

    v_codigo := concat_ws('.', v_linha->>'funcao', v_linha->>'subfuncao', v_prog, v_paoe,
                          v_linha->>'regional', v_nat, v_fonte, v_linha->>'cod_acomp', v_linha->>'idu');
    IF v_codigo = ANY (v_codigos) THEN
      RAISE EXCEPTION 'Linha %: dotação % repetida no arquivo.', v_idx + 1, v_codigo USING ERRCODE = '22023';
    END IF;
    v_codigos := v_codigos || v_codigo;
    v_paoe_desc := v_paoe || ' - ' || COALESCE(NULLIF(v_linha->>'paoe_nome', ''), 'PAOE ' || v_paoe);
    IF NOT v_paoe = ANY (v_paoes) THEN v_paoes := v_paoes || v_paoe; END IF;

    -- Programa
    SELECT id INTO v_prog_id FROM public.fin_programas_orcamentarios
     WHERE codigo = v_prog AND exercicio = p_exercicio;
    IF v_prog_id IS NULL THEN
      IF NOT v_prog = ANY (v_cri_prog) THEN v_cri_prog := v_cri_prog || v_prog; END IF;
      IF NOT p_simular THEN
        INSERT INTO public.fin_programas_orcamentarios (codigo, nome, exercicio)
        VALUES (v_prog, COALESCE(NULLIF(v_linha->>'programa_nome', ''), 'Programa ' || v_prog), p_exercicio)
        RETURNING id INTO v_prog_id;
      END IF;
    END IF;

    -- Ação (PAOE)
    v_acao_id := NULL;
    IF v_prog_id IS NOT NULL THEN
      SELECT id INTO v_acao_id FROM public.fin_acoes_orcamentarias
       WHERE programa_id = v_prog_id AND codigo = v_paoe
       ORDER BY ativo DESC NULLS LAST, created_at LIMIT 1;
    END IF;
    IF v_acao_id IS NULL THEN
      IF NOT v_paoe_desc = ANY (v_cri_acao) THEN v_cri_acao := v_cri_acao || v_paoe_desc; END IF;
      IF NOT p_simular THEN
        INSERT INTO public.fin_acoes_orcamentarias (programa_id, codigo, nome)
        VALUES (v_prog_id, v_paoe, COALESCE(NULLIF(v_linha->>'paoe_nome', ''), 'PAOE ' || v_paoe))
        RETURNING id INTO v_acao_id;
      END IF;
    END IF;

    -- Natureza: 8 dígitos do FIPLAN ou o elemento (6 dígitos) quando o subelemento é 00
    SELECT id INTO v_nat_id FROM public.fin_naturezas_despesa
     WHERE regexp_replace(codigo, '\D', '', 'g') = v_nat
        OR (substr(v_nat, 7, 2) = '00' AND regexp_replace(codigo, '\D', '', 'g') = substr(v_nat, 1, 6))
     ORDER BY (regexp_replace(codigo, '\D', '', 'g') = v_nat) DESC, ativo DESC NULLS LAST
     LIMIT 1;
    IF v_nat_id IS NULL THEN
      DECLARE
        v_nat_cod text := concat_ws('.', substr(v_nat, 1, 1), substr(v_nat, 2, 1), substr(v_nat, 3, 2),
                                    substr(v_nat, 5, 2), NULLIF(substr(v_nat, 7, 2), '00'));
      BEGIN
        IF NOT v_nat_cod = ANY (v_cri_nat) THEN v_cri_nat := v_cri_nat || v_nat_cod; END IF;
        IF NOT p_simular THEN
          INSERT INTO public.fin_naturezas_despesa
            (codigo, nome, categoria_economica, grupo_natureza, modalidade_aplicacao, elemento, subelemento)
          VALUES (v_nat_cod, 'Natureza ' || v_nat_cod || ' (importada do QDD, revisar descrição)',
                  substr(v_nat, 1, 1), substr(v_nat, 2, 1), substr(v_nat, 3, 2), substr(v_nat, 5, 2), substr(v_nat, 7, 2))
          RETURNING id INTO v_nat_id;
        END IF;
      END;
    END IF;

    -- Fonte: compara só os dígitos (1.500 = 1500)
    SELECT id INTO v_fonte_id FROM public.fin_fontes_recurso
     WHERE regexp_replace(codigo, '\D', '', 'g') = replace(v_fonte, '.', '')
     ORDER BY ativo DESC NULLS LAST LIMIT 1;
    IF v_fonte_id IS NULL THEN
      IF NOT v_fonte = ANY (v_cri_fonte) THEN v_cri_fonte := v_cri_fonte || v_fonte; END IF;
      IF NOT p_simular THEN
        INSERT INTO public.fin_fontes_recurso (codigo, nome)
        VALUES (v_fonte, 'Fonte ' || v_fonte || ' (importada do QDD, revisar descrição)')
        RETURNING id INTO v_fonte_id;
      END IF;
    END IF;

    -- Dotação existente: chave nova; senão, a do importador antigo de planilha
    SELECT * INTO v_existente FROM public.fin_dotacoes
     WHERE exercicio = p_exercicio AND codigo_dotacao = v_codigo;
    v_achou := FOUND;
    IF NOT v_achou THEN
      SELECT * INTO v_existente FROM public.fin_dotacoes
       WHERE exercicio = p_exercicio
         AND codigo_dotacao IN (v_nat || '.' || v_fonte || '.' || (v_linha->>'idu'),
                                v_nat || '.' || replace(v_fonte, '.', '') || '.' || (v_linha->>'idu'))
         AND split_part(COALESCE(paoe, ''), ' ', 1) = v_paoe
         AND NOT (id = ANY (v_ids))
       LIMIT 1;
      v_achou := FOUND;
    END IF;

    v_novo := jsonb_build_object(
      'valor_inicial',       COALESCE((v_val->>'inicial')::numeric, 0),
      'valor_suplementado',  COALESCE((v_val->>'suplementado')::numeric, 0),
      'valor_reduzido',      COALESCE((v_val->>'anulado')::numeric, 0),
      'valor_bloqueado',     COALESCE((v_val->>'bloqueado')::numeric, 0),
      'valor_reserva',       COALESCE((v_val->>'reserva')::numeric, 0),
      'valor_ped',           COALESCE((v_val->>'ped')::numeric, 0),
      'valor_empenhado',     COALESCE((v_val->>'empenhado')::numeric, 0),
      'valor_liquidado',     COALESCE((v_val->>'liquidado')::numeric, 0),
      'valor_em_liquidacao', COALESCE((v_val->>'em_liquidacao')::numeric, 0),
      'valor_pago',          COALESCE((v_val->>'pago')::numeric, 0),
      'valor_restos_pagar',  COALESCE((v_val->>'restos')::numeric, 0),
      'tro',                 v_linha->>'tro',
      'ativo',               true
    );

    IF NOT v_achou THEN
      v_ins := v_ins + 1;
      v_dotacao_id := NULL;
      IF NOT p_simular THEN
        INSERT INTO public.fin_dotacoes (
          exercicio, codigo_dotacao, programa_id, acao_id, natureza_despesa_id, fonte_recurso_id,
          paoe, regional, cod_acompanhamento, idu, tro,
          valor_inicial, valor_suplementado, valor_reduzido, valor_bloqueado, valor_reserva, valor_ped,
          valor_empenhado, valor_liquidado, valor_em_liquidacao, valor_pago, valor_restos_pagar,
          ativo, created_by
        ) VALUES (
          p_exercicio, v_codigo, v_prog_id, v_acao_id, v_nat_id, v_fonte_id,
          v_paoe_desc, v_linha->>'regional', v_linha->>'cod_acomp', v_linha->>'idu', v_linha->>'tro',
          (v_novo->>'valor_inicial')::numeric, (v_novo->>'valor_suplementado')::numeric,
          (v_novo->>'valor_reduzido')::numeric, (v_novo->>'valor_bloqueado')::numeric,
          (v_novo->>'valor_reserva')::numeric, (v_novo->>'valor_ped')::numeric,
          (v_novo->>'valor_empenhado')::numeric, (v_novo->>'valor_liquidado')::numeric,
          (v_novo->>'valor_em_liquidacao')::numeric, (v_novo->>'valor_pago')::numeric,
          (v_novo->>'valor_restos_pagar')::numeric,
          true, v_uid
        ) RETURNING id INTO v_dotacao_id;
        v_ids := v_ids || v_dotacao_id;
      END IF;
      v_resultado := v_resultado || jsonb_build_object('indice', v_idx, 'acao', 'inserir');
    ELSE
      v_ids := v_ids || v_existente.id;
      SELECT COALESCE(jsonb_object_agg(k, jsonb_build_array(to_jsonb(v_existente) -> k, v_novo -> k)), '{}'::jsonb)
        INTO v_mudancas
        FROM jsonb_object_keys(v_novo) AS k
       WHERE (to_jsonb(v_existente) -> k) IS DISTINCT FROM (v_novo -> k);
      IF v_existente.codigo_dotacao <> v_codigo THEN
        v_mudancas := v_mudancas || jsonb_build_object('codigo_dotacao',
                        jsonb_build_array(v_existente.codigo_dotacao, v_codigo));
      END IF;

      IF v_mudancas = '{}'::jsonb THEN
        v_igual := v_igual + 1;
        v_resultado := v_resultado || jsonb_build_object('indice', v_idx, 'acao', 'sem_alteracao');
      ELSE
        v_upd := v_upd + 1;
        v_resultado := v_resultado || jsonb_build_object('indice', v_idx, 'acao', 'atualizar', 'mudancas', v_mudancas);
      END IF;

      IF NOT p_simular THEN
        UPDATE public.fin_dotacoes SET
          codigo_dotacao      = v_codigo,
          programa_id         = COALESCE(v_prog_id, programa_id),
          acao_id             = COALESCE(v_acao_id, acao_id),
          natureza_despesa_id = COALESCE(v_nat_id, natureza_despesa_id),
          fonte_recurso_id    = COALESCE(v_fonte_id, fonte_recurso_id),
          paoe                = v_paoe_desc,
          regional            = v_linha->>'regional',
          cod_acompanhamento  = v_linha->>'cod_acomp',
          idu                 = v_linha->>'idu',
          tro                 = v_linha->>'tro',
          valor_inicial       = (v_novo->>'valor_inicial')::numeric,
          valor_suplementado  = (v_novo->>'valor_suplementado')::numeric,
          valor_reduzido      = (v_novo->>'valor_reduzido')::numeric,
          valor_bloqueado     = (v_novo->>'valor_bloqueado')::numeric,
          valor_reserva       = (v_novo->>'valor_reserva')::numeric,
          valor_ped           = (v_novo->>'valor_ped')::numeric,
          valor_empenhado     = (v_novo->>'valor_empenhado')::numeric,
          valor_liquidado     = (v_novo->>'valor_liquidado')::numeric,
          valor_em_liquidacao = (v_novo->>'valor_em_liquidacao')::numeric,
          valor_pago          = (v_novo->>'valor_pago')::numeric,
          valor_restos_pagar  = (v_novo->>'valor_restos_pagar')::numeric,
          ativo               = true,
          updated_at          = now()
        WHERE id = v_existente.id;
      END IF;
    END IF;
  END LOOP;

  -- Dotações ativas dos mesmos PAOEs que não vieram no arquivo: só avisadas, nunca apagadas.
  SELECT array_agg(d.codigo_dotacao ORDER BY d.codigo_dotacao) INTO v_ausentes
    FROM public.fin_dotacoes d
   WHERE d.exercicio = p_exercicio
     AND d.ativo
     AND split_part(COALESCE(d.paoe, ''), ' ', 1) = ANY (v_paoes)
     AND NOT (d.id = ANY (v_ids));

  v_resumo := jsonb_build_object(
    'totais', jsonb_build_object('inserir', v_ins, 'atualizar', v_upd, 'sem_alteracao', v_igual),
    'criados', jsonb_strip_nulls(jsonb_build_object(
      'Programas', CASE WHEN cardinality(v_cri_prog) > 0 THEN to_jsonb(v_cri_prog) END,
      'Ações (PAOE)', CASE WHEN cardinality(v_cri_acao) > 0 THEN to_jsonb(v_cri_acao) END,
      'Naturezas de despesa', CASE WHEN cardinality(v_cri_nat) > 0 THEN to_jsonb(v_cri_nat) END,
      'Fontes de recurso', CASE WHEN cardinality(v_cri_fonte) > 0 THEN to_jsonb(v_cri_fonte) END)),
    'ausentes', to_jsonb(COALESCE(v_ausentes, '{}'::text[]))
  );

  IF NOT p_simular THEN
    INSERT INTO public.importacoes
      (tipo, modulo, arquivo_nome, arquivo_sha256, arquivo_tamanho, exercicio, resumo, detalhes, created_by)
    VALUES
      ('qdd_fiplan', 'financeiro', p_arquivo->>'nome', p_arquivo->>'sha256', (p_arquivo->>'tamanho')::bigint,
       p_exercicio, v_resumo, v_resultado, v_uid)
    RETURNING id INTO v_import_id;
  END IF;

  RETURN v_resumo || jsonb_build_object(
    'simulacao', p_simular,
    'importacao_id', v_import_id,
    'linhas', v_resultado
  );
END;
$$;

COMMENT ON FUNCTION public.importar_qdd_fiplan(integer, jsonb, jsonb, boolean) IS
  'Importa o QDD exportado do FIPLAN para fin_dotacoes (p_simular = true só calcula as mudanças). Exige orcamento.importar.';

REVOKE ALL ON FUNCTION public.importar_qdd_fiplan(integer, jsonb, jsonb, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.importar_qdd_fiplan(integer, jsonb, jsonb, boolean) TO authenticated;
