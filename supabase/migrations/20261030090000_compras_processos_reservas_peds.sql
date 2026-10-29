-- ============================================================================
-- COMPRAS — processos de contratação, entrega 2: reservas por natureza, PEDs do FIPLAN e fase financeira
-- ============================================================================
-- Spec: docs/superpowers/specs/2026-10-23-compras-processos-reserva-natureza-design.md (§10, revisão de 24/10/2026)
-- Plano: docs/superpowers/plans/2026-10-24-compras-processos-entrega2.md
--
--   processo_chave_fiplan      reduz o nº SEI (17302.000885/2026.92), o do FIPLAN (000885/26-92) e o do FIP 614
--                              (00000885/26-92) à mesma chave (885/26-92). Liga PEDs e empenhos ao processo.
--   fin_peds                   espelho do relatório "Consultar Pedido de Empenho da Despesa (PED)" do FIPLAN.
--                              Lida pelo módulo financeiro; escrita só pela RPC importar_peds_fiplan.
--   processo_reservas          reserva gerencial do processo por exercício × ação × fonte × natureza. Escrita só
--                              pelas RPCs processo_reserva_salvar e processo_reserva_cancelar.
--   saldo livre                disponível do QDD (atual − bloqueado − PED; no QDD a coluna PED já inclui o empenhado e
--                              a reserva) − pendente das outras reservas;
--                              pendente = reservado − (PED autorizado + empenhado líquido do processo na combinação).
--   leituras                   processo_reservas_detalhe, processo_peds, processos_financeiro e
--                              programacao_por_natureza (SECURITY DEFINER: quem vê processos não lê fin_peds nem
--                              fin_empenhos direto, cuja RLS não muda).
--   processo_empenhos          passa a ligar o empenho pela chave, no lugar do nº SEI exato.
--
-- Ler: (módulo compras E compras.processos.visualizar|editar) OU módulo financeiro. Gravar reserva:
-- compras.processos.editar. Importar PED: módulo financeiro E orcamento.importar. Ninguém apaga pela API.
-- Nenhuma policy existente muda; nenhuma permissão nova.
-- Idempotente (IF NOT EXISTS, CREATE OR REPLACE, DROP/CREATE de policies).
-- ============================================================================

SET lock_timeout = '10s';

-- ----------------------------------------------------------------------------
-- 1. Chave do processo
-- ----------------------------------------------------------------------------
-- Número sem zeros à esquerda, ano com dois dígitos e dígito verificador. A UO fica de fora (o FIPLAN não a escreve
-- no número). NULL quando o texto não termina no padrão número/ano-dígito.
CREATE OR REPLACE FUNCTION public.processo_chave_fiplan(p text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = public
AS $$
  SELECT CASE WHEN m IS NULL THEN NULL
              ELSE COALESCE(NULLIF(ltrim(m[1], '0'), ''), '0') || '/' || right(m[2], 2) || '-' || m[3] END
    FROM (SELECT regexp_match(btrim(p), '(\d+)/(\d{4}|\d{2})[.-](\d{2})$') AS m) x;
$$;
COMMENT ON FUNCTION public.processo_chave_fiplan(text) IS
  'Chave comum do processo no SEI e no FIPLAN: 17302.000885/2026.92, 000885/26-92 e 00000885/26-92 dão 885/26-92.';
REVOKE ALL ON FUNCTION public.processo_chave_fiplan(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.processo_chave_fiplan(text) TO authenticated;

-- ----------------------------------------------------------------------------
-- 2. fin_peds
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fin_peds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exercicio integer NOT NULL CHECK (exercicio BETWEEN 2000 AND 2100),
  numero text NOT NULL CHECK (numero ~ '^\d{5}\.\d{4}\.\d{2}\.\d{5}-\d$'),
  numero_estorno text CHECK (numero_estorno ~ '^\d{5}\.\d{4}\.\d{2}\.\d{5}-\d$'),
  empenho_numero text CHECK (empenho_numero ~ '^\d{5}\.\d{4}\.\d{2}\.\d{5}-\d$'),
  processo_fiplan text CHECK (char_length(processo_fiplan) <= 30),
  processo_sei text CHECK (char_length(processo_sei) <= 50),
  processo_chave text GENERATED ALWAYS AS (public.processo_chave_fiplan(COALESCE(processo_sei, processo_fiplan))) STORED,
  valor numeric(15,2) NOT NULL CHECK (valor >= 0),
  situacao text NOT NULL CHECK (char_length(btrim(situacao)) BETWEEN 1 AND 120),
  estorno boolean NOT NULL DEFAULT false,
  data_solicitacao date,
  data_criacao date,
  data_autorizacao date,
  tipo_empenho text CHECK (char_length(tipo_empenho) <= 40),
  dotacao_fiplan text CHECK (char_length(dotacao_fiplan) <= 80),
  dotacao_id uuid REFERENCES public.fin_dotacoes(id) ON DELETE SET NULL,
  licitacao text CHECK (char_length(licitacao) <= 80),
  historico text CHECK (char_length(historico) <= 4000),
  credor_codigo text CHECK (char_length(credor_codigo) <= 20),
  credor_nome text CHECK (char_length(credor_nome) <= 300),
  importacao_id uuid REFERENCES public.importacoes(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fin_peds_chave UNIQUE NULLS NOT DISTINCT (exercicio, numero, numero_estorno)
);
ALTER TABLE public.fin_peds ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.fin_peds IS
  'PEDs (pedidos de empenho) do FIPLAN, do relatório "Consultar Pedido de Empenho da Despesa (PED)". Uma linha por PED ou documento de estorno (o mesmo PED aparece uma vez por estorno). Escrita só pela RPC importar_peds_fiplan.';

CREATE INDEX IF NOT EXISTS idx_fin_peds_processo ON public.fin_peds (exercicio, processo_chave);
CREATE INDEX IF NOT EXISTS idx_fin_peds_dotacao ON public.fin_peds (dotacao_id);

-- Leitura: quem acessa o módulo financeiro. Sem policy de escrita: ninguém grava pela API.
DROP POLICY IF EXISTS fin_peds_select ON public.fin_peds;
CREATE POLICY fin_peds_select ON public.fin_peds
  FOR SELECT TO authenticated
  USING (
    (SELECT public.perfil_ativo_atual())
    AND (SELECT public.can_access_module(auth.uid(), 'financeiro'))
  );

REVOKE ALL ON public.fin_peds FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.fin_peds FROM authenticated;

-- ----------------------------------------------------------------------------
-- 3. Dotação do QDD a partir da dotação escrita pelo FIPLAN (mesma regra do FIP 614)
-- ----------------------------------------------------------------------------
-- Dígitos de função…fonte contra o código do QDD; com várias candidatas, o IDU em número (11º segmento: 1 Não,
-- 4 ECNI, 5 ECI, 6 EII) escolhe pela sigla. NULL quando não há uma só.
CREATE OR REPLACE FUNCTION public.fin_dotacao_do_fiplan(p_exercicio integer, p_dotacao text)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_digitos text;
  v_candidatas uuid[];
  v_por_idu uuid[];
  v_idu text;
BEGIN
  IF p_dotacao IS NULL OR cardinality(string_to_array(p_dotacao, '.')) < 9 THEN
    RETURN NULL;
  END IF;
  v_digitos := regexp_replace(array_to_string((string_to_array(p_dotacao, '.'))[3:9], ''), '\D', '', 'g');
  SELECT array_agg(id ORDER BY codigo_dotacao) INTO v_candidatas
    FROM public.fin_dotacoes
   WHERE exercicio = p_exercicio
     AND regexp_replace(codigo_dotacao, '\D', '', 'g') LIKE v_digitos || '%';
  IF cardinality(v_candidatas) > 1 THEN
    v_idu := CASE (string_to_array(p_dotacao, '.'))[11]
               WHEN '1' THEN 'NAO' WHEN '4' THEN 'ECNI' WHEN '5' THEN 'ECI' WHEN '6' THEN 'EII' END;
    SELECT array_agg(id) INTO v_por_idu
      FROM public.fin_dotacoes
     WHERE id = ANY (v_candidatas)
       AND translate(upper(split_part(codigo_dotacao, '.', 10)), 'ÃÁ', 'AA') = v_idu;
    IF cardinality(v_por_idu) = 1 THEN
      v_candidatas := v_por_idu;
    END IF;
  END IF;
  RETURN CASE WHEN cardinality(v_candidatas) = 1 THEN v_candidatas[1] END;
END;
$$;
REVOKE ALL ON FUNCTION public.fin_dotacao_do_fiplan(integer, text) FROM PUBLIC, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 4. importar_peds_fiplan
-- ----------------------------------------------------------------------------
-- p_linhas: array de {indice, numero, numero_estorno, empenho_numero, processo_fiplan, processo_sei, valor, situacao,
--   estorno, data_solicitacao, data_criacao, data_autorizacao (AAAA-MM-DD ou null), tipo_empenho, dotacao, licitacao,
--   historico, credor_codigo, credor_nome} já normalizado pelo front.
-- Insere ou atualiza pela chave (exercício, PED, PED de estorno). Nada é apagado: PED do exercício que não veio no
-- arquivo volta em "ausentes". Cada linha num savepoint; simulação ou qualquer erro desfaz tudo (SQLSTATE 'PED01');
-- só a aplicação sem erro vai para importacoes.
CREATE OR REPLACE FUNCTION public.importar_peds_fiplan(
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
  c_numero constant text := '^\d{5}\.\d{4}\.\d{2}\.\d{5}-\d$';
  c_campos constant text[] := ARRAY['empenho_numero', 'processo_fiplan', 'processo_sei', 'valor', 'situacao',
    'estorno', 'data_solicitacao', 'data_criacao', 'data_autorizacao', 'tipo_empenho', 'dotacao_fiplan', 'dotacao_id',
    'licitacao', 'historico', 'credor_codigo', 'credor_nome'];
  v_uid uuid := auth.uid();
  v_linha jsonb;
  v_ind integer;
  v_numero text;
  v_estorno_num text;
  v_chaves text[] := '{}';
  v_chave text;
  v_novo jsonb;
  v_antigo jsonb;
  v_mudancas jsonb;
  v_avisos text[];
  v_campo text;
  v_existente public.fin_peds%ROWTYPE;
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
                     AND public.has_permission_code(v_uid, 'orcamento.importar'), false) THEN
    RAISE EXCEPTION 'Sem permissão para importar dados do FIPLAN (orcamento.importar).' USING ERRCODE = '42501';
  END IF;
  IF p_exercicio IS NULL OR p_exercicio NOT BETWEEN 2000 AND 2100 THEN
    RAISE EXCEPTION 'Exercício inválido: %', p_exercicio USING ERRCODE = '22023';
  END IF;
  IF jsonb_typeof(p_linhas) IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_linhas) NOT BETWEEN 1 AND 10000 THEN
    RAISE EXCEPTION 'Envie de 1 a 10000 PEDs.' USING ERRCODE = '22023';
  END IF;
  IF NOT p_simular AND (
       char_length(COALESCE(p_arquivo->>'nome', '')) NOT BETWEEN 1 AND 255
       OR COALESCE(p_arquivo->>'sha256', '') !~ '^[0-9a-f]{64}$'
       OR COALESCE(p_arquivo->>'tamanho', '') !~ '^\d{1,15}$') THEN
    RAISE EXCEPTION 'Dados do arquivo inválidos.' USING ERRCODE = '22023';
  END IF;

  -- Uma importação de PEDs por exercício de cada vez
  PERFORM pg_advisory_xact_lock(hashtext('importar_peds_fiplan'), p_exercicio);

  BEGIN
    IF NOT p_simular THEN
      INSERT INTO public.importacoes (tipo, modulo, arquivo_nome, arquivo_sha256, arquivo_tamanho, exercicio, created_by)
      VALUES ('peds_fiplan', 'financeiro', p_arquivo->>'nome', p_arquivo->>'sha256',
              (p_arquivo->>'tamanho')::bigint, p_exercicio, v_uid)
      RETURNING id INTO v_import_id;
    END IF;

    FOR v_linha IN SELECT value FROM jsonb_array_elements(p_linhas) LOOP
      v_ind := COALESCE((v_linha->>'indice')::integer, -1);
      BEGIN
        v_numero := btrim(COALESCE(v_linha->>'numero', ''));
        v_estorno_num := NULLIF(btrim(COALESCE(v_linha->>'numero_estorno', '')), '');
        IF v_numero !~ c_numero OR split_part(v_numero, '.', 3) <> right(p_exercicio::text, 2) THEN
          RAISE EXCEPTION 'PED "%" fora do padrão ou de outro exercício.', left(v_numero, 30) USING ERRCODE = '22023';
        END IF;
        IF v_estorno_num IS NOT NULL AND v_estorno_num !~ c_numero THEN
          RAISE EXCEPTION 'PED %: número do estorno fora do padrão.', v_numero USING ERRCODE = '22023';
        END IF;
        v_chave := v_numero || '|' || COALESCE(v_estorno_num, '');
        IF v_chave = ANY (v_chaves) THEN
          RAISE EXCEPTION 'PED % repetido no arquivo.', v_numero USING ERRCODE = '22023';
        END IF;
        v_chaves := v_chaves || v_chave;
        IF (v_linha->>'valor') IS NULL OR (v_linha->>'valor')::numeric < 0 THEN
          RAISE EXCEPTION 'PED %: valor inválido.', v_numero USING ERRCODE = '22023';
        END IF;
        IF NULLIF(btrim(v_linha->>'situacao'), '') IS NULL THEN
          RAISE EXCEPTION 'PED %: sem situação.', v_numero USING ERRCODE = '22023';
        END IF;

        v_avisos := '{}';
        v_novo := jsonb_build_object(
          'empenho_numero',   NULLIF(btrim(v_linha->>'empenho_numero'), ''),
          'processo_fiplan',  NULLIF(btrim(v_linha->>'processo_fiplan'), ''),
          'processo_sei',     NULLIF(btrim(v_linha->>'processo_sei'), ''),
          'valor',            round((v_linha->>'valor')::numeric, 2),
          'situacao',         btrim(v_linha->>'situacao'),
          'estorno',          COALESCE((v_linha->>'estorno')::boolean, false),
          'data_solicitacao', (v_linha->>'data_solicitacao')::date,
          'data_criacao',     (v_linha->>'data_criacao')::date,
          'data_autorizacao', (v_linha->>'data_autorizacao')::date,
          'tipo_empenho',     NULLIF(btrim(v_linha->>'tipo_empenho'), ''),
          'dotacao_fiplan',   NULLIF(btrim(v_linha->>'dotacao'), ''),
          'dotacao_id',       public.fin_dotacao_do_fiplan(p_exercicio, NULLIF(btrim(v_linha->>'dotacao'), '')),
          'licitacao',        NULLIF(btrim(v_linha->>'licitacao'), ''),
          'historico',        left(NULLIF(btrim(v_linha->>'historico'), ''), 4000),
          'credor_codigo',    NULLIF(btrim(v_linha->>'credor_codigo'), ''),
          'credor_nome',      left(NULLIF(btrim(v_linha->>'credor_nome'), ''), 300));
        IF v_novo->>'dotacao_id' IS NULL AND v_novo->>'dotacao_fiplan' IS NOT NULL THEN
          v_avisos := v_avisos || 'Dotação sem correspondente único no QDD do exercício: importe o QDD e importe de novo.'::text;
        END IF;

        SELECT * INTO v_existente FROM public.fin_peds
         WHERE exercicio = p_exercicio AND numero = v_numero AND numero_estorno IS NOT DISTINCT FROM v_estorno_num
         FOR UPDATE;
        IF NOT FOUND THEN
          INSERT INTO public.fin_peds
            (exercicio, numero, numero_estorno, empenho_numero, processo_fiplan, processo_sei, valor, situacao, estorno,
             data_solicitacao, data_criacao, data_autorizacao, tipo_empenho, dotacao_fiplan, dotacao_id, licitacao,
             historico, credor_codigo, credor_nome, importacao_id)
          VALUES
            (p_exercicio, v_numero, v_estorno_num, v_novo->>'empenho_numero', v_novo->>'processo_fiplan',
             v_novo->>'processo_sei', (v_novo->>'valor')::numeric, v_novo->>'situacao', (v_novo->>'estorno')::boolean,
             (v_novo->>'data_solicitacao')::date, (v_novo->>'data_criacao')::date, (v_novo->>'data_autorizacao')::date,
             v_novo->>'tipo_empenho', v_novo->>'dotacao_fiplan', (v_novo->>'dotacao_id')::uuid, v_novo->>'licitacao',
             v_novo->>'historico', v_novo->>'credor_codigo', v_novo->>'credor_nome', v_import_id);
          v_acao := 'inserir';
          v_mudancas := NULL;
          v_ins := v_ins + 1;
        ELSE
          v_antigo := to_jsonb(v_existente);
          v_mudancas := '{}'::jsonb;
          FOREACH v_campo IN ARRAY c_campos LOOP
            -- valor numérico compara como número (15000 = 15000.00)
            IF (CASE WHEN v_campo = 'valor' THEN (v_antigo->>v_campo)::numeric IS DISTINCT FROM (v_novo->>v_campo)::numeric
                     ELSE v_antigo->v_campo IS DISTINCT FROM v_novo->v_campo END) THEN
              v_mudancas := v_mudancas || jsonb_build_object(v_campo, jsonb_build_array(v_antigo->v_campo, v_novo->v_campo));
            END IF;
          END LOOP;
          IF v_mudancas = '{}'::jsonb THEN
            v_acao := 'sem_alteracao';
            v_mudancas := NULL;
            v_igual := v_igual + 1;
          ELSE
            UPDATE public.fin_peds
               SET empenho_numero = v_novo->>'empenho_numero', processo_fiplan = v_novo->>'processo_fiplan',
                   processo_sei = v_novo->>'processo_sei', valor = (v_novo->>'valor')::numeric,
                   situacao = v_novo->>'situacao', estorno = (v_novo->>'estorno')::boolean,
                   data_solicitacao = (v_novo->>'data_solicitacao')::date, data_criacao = (v_novo->>'data_criacao')::date,
                   data_autorizacao = (v_novo->>'data_autorizacao')::date, tipo_empenho = v_novo->>'tipo_empenho',
                   dotacao_fiplan = v_novo->>'dotacao_fiplan', dotacao_id = (v_novo->>'dotacao_id')::uuid,
                   licitacao = v_novo->>'licitacao', historico = v_novo->>'historico',
                   credor_codigo = v_novo->>'credor_codigo', credor_nome = v_novo->>'credor_nome',
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
      RAISE EXCEPTION 'importação desfeita' USING ERRCODE = 'PED01';
    END IF;
  EXCEPTION
    WHEN SQLSTATE 'PED01' THEN v_import_id := NULL;  -- desfaz tudo, inclusive o log; as variáveis continuam valendo
  END;

  -- PEDs do exercício que não vieram no arquivo: só avisados, nunca apagados.
  SELECT array_agg(DISTINCT numero ORDER BY numero) INTO v_ausentes
    FROM public.fin_peds
   WHERE exercicio = p_exercicio
     AND NOT ((numero || '|' || COALESCE(numero_estorno, '')) = ANY (v_chaves));

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

COMMENT ON FUNCTION public.importar_peds_fiplan(integer, jsonb, jsonb, boolean) IS
  'Importa o relatório "Consultar Pedido de Empenho da Despesa (PED)" do FIPLAN para fin_peds (p_simular = true só calcula; aplicação é tudo ou nada). Exige o módulo financeiro e orcamento.importar.';

REVOKE ALL ON FUNCTION public.importar_peds_fiplan(integer, jsonb, jsonb, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.importar_peds_fiplan(integer, jsonb, jsonb, boolean) TO authenticated;

-- ----------------------------------------------------------------------------
-- 5. processo_reservas
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.processo_reservas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id uuid NOT NULL REFERENCES public.processos_licitatorios(id) ON DELETE CASCADE,
  exercicio integer NOT NULL CHECK (exercicio BETWEEN 2000 AND 2100),
  acao_id uuid NOT NULL REFERENCES public.fin_acoes_orcamentarias(id),
  fonte_recurso_id uuid NOT NULL REFERENCES public.fin_fontes_recurso(id),
  natureza_despesa_id uuid NOT NULL REFERENCES public.fin_naturezas_despesa(id),
  pca_item_id uuid REFERENCES public.pca_itens(id) ON DELETE SET NULL,
  valor numeric(15,2) NOT NULL CHECK (valor > 0),
  situacao text NOT NULL DEFAULT 'reservada' CHECK (situacao = ANY (ARRAY['reservada', 'cancelada'])),
  justificativa_saldo text CHECK (char_length(justificativa_saldo) <= 2000),
  saldo_livre_no_momento numeric(15,2),
  motivo_cancelamento text CHECK (char_length(motivo_cancelamento) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  CONSTRAINT processo_reservas_cancelada_check CHECK (situacao = 'reservada' OR motivo_cancelamento IS NOT NULL)
);
ALTER TABLE public.processo_reservas ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.processo_reservas IS
  'Reserva gerencial do processo de contratação por exercício × ação × fonte × natureza (não cria reserva nem PED no FIPLAN). Escrita só pelas RPCs processo_reserva_salvar e processo_reserva_cancelar.';

CREATE UNIQUE INDEX IF NOT EXISTS uq_processo_reservas_combinacao ON public.processo_reservas
  (processo_id, exercicio, acao_id, fonte_recurso_id, natureza_despesa_id) WHERE situacao = 'reservada';
CREATE INDEX IF NOT EXISTS idx_processo_reservas_combinacao ON public.processo_reservas
  (exercicio, acao_id, fonte_recurso_id, natureza_despesa_id) WHERE situacao = 'reservada';

-- Leitura: quem vê processos em Compras ou quem acessa o Financeiro (programação e painel). Sem policy de escrita.
DROP POLICY IF EXISTS processo_reservas_select ON public.processo_reservas;
CREATE POLICY processo_reservas_select ON public.processo_reservas
  FOR SELECT TO authenticated
  USING (
    (SELECT public.perfil_ativo_atual())
    AND (
      ((SELECT public.can_access_module(auth.uid(), 'compras'))
        AND ((SELECT public.has_permission_code(auth.uid(), 'compras.processos.visualizar'))
             OR (SELECT public.has_permission_code(auth.uid(), 'compras.processos.editar'))))
      OR (SELECT public.can_access_module(auth.uid(), 'financeiro'))
    )
  );

REVOKE ALL ON public.processo_reservas FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.processo_reservas FROM authenticated;

-- ----------------------------------------------------------------------------
-- 6. Contas (internas: sem EXECUTE para a API; as funções DEFINER abaixo as chamam)
-- ----------------------------------------------------------------------------
-- Disponível da dotação como o FIPLAN calcula no QDD: atual − bloqueado − PED, em que a coluna PED já soma o
-- empenhado e a reserva (QDD 2026: PED 32.347.253,42 = empenhado 26.670.834,42 + reserva 5.676.419,00). O maior dos
-- dois protege dotação lançada sem o PED.
CREATE OR REPLACE FUNCTION public.fin_dotacao_disponivel(
  p_atual numeric, p_bloqueado numeric, p_empenhado numeric, p_reserva numeric, p_ped numeric
)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = public
AS $$
  SELECT COALESCE(p_atual, 0) - COALESCE(p_bloqueado, 0)
         - GREATEST(COALESCE(p_ped, 0), COALESCE(p_empenhado, 0) + COALESCE(p_reserva, 0));
$$;
REVOKE ALL ON FUNCTION public.fin_dotacao_disponivel(numeric, numeric, numeric, numeric, numeric) FROM PUBLIC, anon, authenticated;

-- Mesma regra da policy de processo_reservas.
CREATE OR REPLACE FUNCTION public.processos_leitura_permitida()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(auth.uid() IS NOT NULL
    AND public.perfil_ativo_atual()
    AND ((public.can_access_module(auth.uid(), 'compras')
          AND (public.has_permission_code(auth.uid(), 'compras.processos.visualizar')
               OR public.has_permission_code(auth.uid(), 'compras.processos.editar')))
         OR public.can_access_module(auth.uid(), 'financeiro')), false);
$$;
REVOKE ALL ON FUNCTION public.processos_leitura_permitida() FROM PUBLIC, anon, authenticated;

-- Execução do processo no FIPLAN por exercício × ação × fonte × natureza: PED autorizado (uma vez por PED, sem os
-- documentos de estorno) e empenhado líquido, liquidado e pago dos empenhos. _exercicio NULL: todos.
CREATE OR REPLACE FUNCTION public.processos_execucao(_exercicio integer DEFAULT NULL)
RETURNS TABLE (
  processo_id uuid,
  exercicio integer,
  acao_id uuid,
  fonte_recurso_id uuid,
  natureza_despesa_id uuid,
  ped_autorizado numeric,
  empenhado numeric,
  liquidado numeric,
  pago numeric
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH proc AS (
    SELECT p.id, public.processo_chave_fiplan(p.numero_processo) AS chave
      FROM public.processos_licitatorios p
     WHERE public.processo_chave_fiplan(p.numero_processo) IS NOT NULL
  ),
  peds AS (
    SELECT DISTINCT ON (f.exercicio, f.numero)
           f.exercicio, f.processo_chave AS chave, d.acao_id, d.fonte_recurso_id AS fonte,
           d.natureza_despesa_id AS natureza, f.valor
      FROM public.fin_peds f
      LEFT JOIN public.fin_dotacoes d ON d.id = f.dotacao_id
     WHERE NOT f.estorno AND f.situacao = 'Pedido (PED) autorizado'
       AND (_exercicio IS NULL OR f.exercicio = _exercicio)
     ORDER BY f.exercicio, f.numero
  ),
  emps AS (
    SELECT e.exercicio, public.processo_chave_fiplan(COALESCE(e.processo_sei, e.processo_fiplan)) AS chave,
           d.acao_id, COALESCE(e.fonte_recurso_id, d.fonte_recurso_id) AS fonte,
           COALESCE(e.natureza_despesa_id, d.natureza_despesa_id) AS natureza,
           e.valor_empenhado - COALESCE(e.valor_anulado, 0) AS emp,
           COALESCE(e.valor_liquidado, 0) AS liq, COALESCE(e.valor_pago, 0) AS pago
      FROM public.fin_empenhos e
      LEFT JOIN public.fin_dotacoes d ON d.id = e.dotacao_id
     WHERE _exercicio IS NULL OR e.exercicio = _exercicio
  ),
  tudo AS (
    SELECT exercicio, chave, acao_id, fonte, natureza, valor AS ped, 0::numeric AS emp, 0::numeric AS liq, 0::numeric AS pago FROM peds
    UNION ALL
    SELECT exercicio, chave, acao_id, fonte, natureza, 0, emp, liq, pago FROM emps
  )
  SELECT pr.id, t.exercicio, t.acao_id, t.fonte, t.natureza, sum(t.ped), sum(t.emp), sum(t.liq), sum(t.pago)
    FROM tudo t
    JOIN proc pr ON pr.chave = t.chave
   GROUP BY pr.id, t.exercicio, t.acao_id, t.fonte, t.natureza;
$$;
REVOKE ALL ON FUNCTION public.processos_execucao(integer) FROM PUBLIC, anon, authenticated;

-- Reservas na situação "reservada" com o que já chegou ao FIPLAN e o pendente. _exercicio NULL: todos.
CREATE OR REPLACE FUNCTION public.processo_reservas_pendentes(_exercicio integer DEFAULT NULL)
RETURNS TABLE (
  reserva_id uuid,
  processo_id uuid,
  exercicio integer,
  acao_id uuid,
  fonte_recurso_id uuid,
  natureza_despesa_id uuid,
  valor numeric,
  materializado numeric,
  pendente numeric
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT r.id, r.processo_id, r.exercicio, r.acao_id, r.fonte_recurso_id, r.natureza_despesa_id, r.valor,
         COALESCE(x.ped_autorizado, 0) + COALESCE(x.empenhado, 0),
         GREATEST(0, r.valor - COALESCE(x.ped_autorizado, 0) - COALESCE(x.empenhado, 0))
    FROM public.processo_reservas r
    LEFT JOIN public.processos_execucao(_exercicio) x
      ON x.processo_id = r.processo_id AND x.exercicio = r.exercicio AND x.acao_id = r.acao_id
     AND x.fonte_recurso_id = r.fonte_recurso_id AND x.natureza_despesa_id = r.natureza_despesa_id
   WHERE r.situacao = 'reservada' AND (_exercicio IS NULL OR r.exercicio = _exercicio);
$$;
REVOKE ALL ON FUNCTION public.processo_reservas_pendentes(integer) FROM PUBLIC, anon, authenticated;

-- Saldo livre da combinação: QDD menos o pendente das reservas (menos a ignorada). NULL: sem dotação no QDD.
CREATE OR REPLACE FUNCTION public.processo_saldo_livre_calc(
  p_exercicio integer, p_acao uuid, p_fonte uuid, p_natureza uuid, p_ignorar_reserva uuid DEFAULT NULL
)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_qdd numeric;
  v_n integer;
  v_pendente numeric;
BEGIN
  SELECT sum(public.fin_dotacao_disponivel(valor_atual, valor_bloqueado, valor_empenhado, valor_reserva, valor_ped)), count(*)
    INTO v_qdd, v_n
    FROM public.fin_dotacoes
   WHERE exercicio = p_exercicio AND acao_id = p_acao AND fonte_recurso_id = p_fonte
     AND natureza_despesa_id = p_natureza AND ativo IS NOT FALSE;
  IF v_n = 0 THEN
    RETURN NULL;
  END IF;
  SELECT COALESCE(sum(pendente), 0) INTO v_pendente
    FROM public.processo_reservas_pendentes(p_exercicio)
   WHERE acao_id = p_acao AND fonte_recurso_id = p_fonte AND natureza_despesa_id = p_natureza
     AND reserva_id IS DISTINCT FROM p_ignorar_reserva;
  RETURN round(v_qdd - v_pendente, 2);
END;
$$;
REVOKE ALL ON FUNCTION public.processo_saldo_livre_calc(integer, uuid, uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 7. Gravação das reservas
-- ----------------------------------------------------------------------------
-- Saldo livre para a tela (formulário da reserva). p_ignorar_reserva: a linha em edição.
CREATE OR REPLACE FUNCTION public.processo_saldo_livre(
  p_exercicio integer, p_acao uuid, p_fonte uuid, p_natureza uuid, p_ignorar_reserva uuid DEFAULT NULL
)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.processos_leitura_permitida() THEN
    RAISE EXCEPTION 'Requer a permissão de ver processos de contratação.' USING ERRCODE = '42501';
  END IF;
  RETURN public.processo_saldo_livre_calc(p_exercicio, p_acao, p_fonte, p_natureza, p_ignorar_reserva);
END;
$$;
REVOKE ALL ON FUNCTION public.processo_saldo_livre(integer, uuid, uuid, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.processo_saldo_livre(integer, uuid, uuid, uuid, uuid) TO authenticated;

-- Cria (p_id NULL) ou altera uma reserva. Faltando saldo livre (ou sem dotação no QDD), exige justificativa de pelo
-- menos 10 caracteres e a grava com o saldo do momento. Uma linha reservada por combinação em cada processo.
CREATE OR REPLACE FUNCTION public.processo_reserva_salvar(
  p_id uuid,
  p_processo_id uuid,
  p_exercicio integer,
  p_acao uuid,
  p_fonte uuid,
  p_natureza uuid,
  p_valor numeric,
  p_pca_item_id uuid DEFAULT NULL,
  p_justificativa text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_etapa text;
  v_atual public.processo_reservas%ROWTYPE;
  v_saldo numeric;
  v_faltou boolean;
  v_just text := NULLIF(btrim(p_justificativa), '');
  v_id uuid;
BEGIN
  IF v_uid IS NULL
     OR NOT COALESCE(public.perfil_ativo_atual()
                     AND public.can_access_module(v_uid, 'compras')
                     AND public.has_permission_code(v_uid, 'compras.processos.editar'), false) THEN
    RAISE EXCEPTION 'Requer a permissão de editar processos de contratação.' USING ERRCODE = '42501';
  END IF;
  IF p_exercicio IS NULL OR p_exercicio NOT BETWEEN 2000 AND 2100 THEN
    RAISE EXCEPTION 'Exercício inválido.' USING ERRCODE = '22023';
  END IF;
  IF p_acao IS NULL OR p_fonte IS NULL OR p_natureza IS NULL THEN
    RAISE EXCEPTION 'Informe ação, fonte e natureza.' USING ERRCODE = '22023';
  END IF;
  IF p_valor IS NULL OR p_valor <= 0 THEN
    RAISE EXCEPTION 'O valor da reserva deve ser maior que zero.' USING ERRCODE = '22023';
  END IF;

  SELECT etapa INTO v_etapa FROM public.processos_licitatorios WHERE id = p_processo_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Processo não encontrado.' USING ERRCODE = '22023';
  END IF;
  IF v_etapa = 'cancelado' THEN
    RAISE EXCEPTION 'Processo cancelado não recebe reserva.' USING ERRCODE = '22023';
  END IF;
  IF p_id IS NOT NULL THEN
    SELECT * INTO v_atual FROM public.processo_reservas WHERE id = p_id FOR UPDATE;
    IF NOT FOUND OR v_atual.processo_id <> p_processo_id THEN
      RAISE EXCEPTION 'Reserva não encontrada neste processo.' USING ERRCODE = '22023';
    END IF;
    IF v_atual.situacao <> 'reservada' THEN
      RAISE EXCEPTION 'Reserva cancelada não pode ser alterada.' USING ERRCODE = '22023';
    END IF;
  END IF;
  IF p_pca_item_id IS NOT NULL AND NOT EXISTS (
       SELECT 1 FROM public.pca_itens WHERE id = p_pca_item_id AND situacao = 'ativo') THEN
    RAISE EXCEPTION 'Item do PCA não encontrado.' USING ERRCODE = '22023';
  END IF;

  -- Uma gravação por combinação de cada vez, para duas reservas não usarem o mesmo saldo.
  PERFORM pg_advisory_xact_lock(hashtext('processo_reserva'), hashtext(concat_ws('|', p_exercicio, p_acao, p_fonte, p_natureza)));

  v_saldo := public.processo_saldo_livre_calc(p_exercicio, p_acao, p_fonte, p_natureza, p_id);
  v_faltou := v_saldo IS NULL OR round(p_valor, 2) > v_saldo;
  IF v_faltou AND char_length(COALESCE(v_just, '')) < 10 THEN
    IF v_saldo IS NULL THEN
      RAISE EXCEPTION 'Não há dotação no QDD de % para esta ação, fonte e natureza: escreva a justificativa.', p_exercicio
        USING ERRCODE = 'P0001';
    END IF;
    RAISE EXCEPTION 'Saldo livre de R$ % não cobre a reserva (faltam R$ %): escreva a justificativa.',
      to_char(v_saldo, 'FM999G999G999G990D00'), to_char(round(p_valor, 2) - v_saldo, 'FM999G999G999G990D00')
      USING ERRCODE = 'P0001';
  END IF;

  BEGIN
    IF p_id IS NULL THEN
      INSERT INTO public.processo_reservas
        (processo_id, exercicio, acao_id, fonte_recurso_id, natureza_despesa_id, pca_item_id, valor,
         justificativa_saldo, saldo_livre_no_momento, created_by, updated_by)
      VALUES
        (p_processo_id, p_exercicio, p_acao, p_fonte, p_natureza, p_pca_item_id, round(p_valor, 2),
         CASE WHEN v_faltou THEN left(v_just, 2000) END, v_saldo, v_uid, v_uid)
      RETURNING id INTO v_id;
    ELSE
      UPDATE public.processo_reservas
         SET exercicio = p_exercicio, acao_id = p_acao, fonte_recurso_id = p_fonte, natureza_despesa_id = p_natureza,
             pca_item_id = p_pca_item_id, valor = round(p_valor, 2),
             justificativa_saldo = CASE WHEN v_faltou THEN left(v_just, 2000) END,
             saldo_livre_no_momento = v_saldo, updated_at = now(), updated_by = v_uid
       WHERE id = p_id
      RETURNING id INTO v_id;
    END IF;
  EXCEPTION
    WHEN unique_violation THEN
      RAISE EXCEPTION 'Este processo já tem uma reserva nesta ação, fonte e natureza: altere a linha existente.'
        USING ERRCODE = '23505';
  END;

  RETURN jsonb_build_object('id', v_id, 'saldo_livre', v_saldo, 'faltou', v_faltou);
END;
$$;
COMMENT ON FUNCTION public.processo_reserva_salvar(uuid, uuid, integer, uuid, uuid, uuid, numeric, uuid, text) IS
  'Cria ou altera a reserva do processo; faltando saldo livre, exige justificativa. Exige o módulo compras e compras.processos.editar.';
REVOKE ALL ON FUNCTION public.processo_reserva_salvar(uuid, uuid, integer, uuid, uuid, uuid, numeric, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.processo_reserva_salvar(uuid, uuid, integer, uuid, uuid, uuid, numeric, uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.processo_reserva_cancelar(p_id uuid, p_motivo text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL
     OR NOT COALESCE(public.perfil_ativo_atual()
                     AND public.can_access_module(v_uid, 'compras')
                     AND public.has_permission_code(v_uid, 'compras.processos.editar'), false) THEN
    RAISE EXCEPTION 'Requer a permissão de editar processos de contratação.' USING ERRCODE = '42501';
  END IF;
  IF char_length(COALESCE(btrim(p_motivo), '')) < 5 THEN
    RAISE EXCEPTION 'Escreva o motivo do cancelamento.' USING ERRCODE = '22023';
  END IF;
  UPDATE public.processo_reservas
     SET situacao = 'cancelada', motivo_cancelamento = left(btrim(p_motivo), 1000), updated_at = now(), updated_by = v_uid
   WHERE id = p_id AND situacao = 'reservada';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reserva não encontrada ou já cancelada.' USING ERRCODE = '22023';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.processo_reserva_cancelar(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.processo_reserva_cancelar(uuid, text) TO authenticated;

-- ----------------------------------------------------------------------------
-- 8. Leituras para as telas (sem credor: PED e reserva não expõem dado pessoal a Compras)
-- ----------------------------------------------------------------------------
-- Reservas do processo (reservadas e canceladas) com o que já chegou ao FIPLAN, o pendente e o saldo livre atual.
CREATE OR REPLACE FUNCTION public.processo_reservas_detalhe(_processo_id uuid)
RETURNS TABLE (
  id uuid,
  exercicio integer,
  acao_id uuid,
  acao_codigo text,
  acao_nome text,
  fonte_recurso_id uuid,
  fonte_codigo text,
  natureza_despesa_id uuid,
  natureza_codigo text,
  natureza_nome text,
  pca_item_id uuid,
  valor numeric,
  situacao text,
  justificativa_saldo text,
  saldo_livre_no_momento numeric,
  motivo_cancelamento text,
  materializado numeric,
  pendente numeric,
  saldo_livre numeric,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.processos_leitura_permitida() THEN
    RAISE EXCEPTION 'Requer a permissão de ver processos de contratação.' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT r.id, r.exercicio, r.acao_id, a.codigo::text, a.nome::text, r.fonte_recurso_id, f.codigo::text,
         r.natureza_despesa_id, n.codigo::text, n.nome::text, r.pca_item_id, r.valor, r.situacao,
         r.justificativa_saldo, r.saldo_livre_no_momento, r.motivo_cancelamento,
         COALESCE(p.materializado, 0), COALESCE(p.pendente, 0),
         CASE WHEN r.situacao = 'reservada'
              THEN public.processo_saldo_livre_calc(r.exercicio, r.acao_id, r.fonte_recurso_id, r.natureza_despesa_id) END,
         r.created_at
    FROM public.processo_reservas r
    JOIN public.fin_acoes_orcamentarias a ON a.id = r.acao_id
    JOIN public.fin_fontes_recurso f ON f.id = r.fonte_recurso_id
    JOIN public.fin_naturezas_despesa n ON n.id = r.natureza_despesa_id
    LEFT JOIN public.processo_reservas_pendentes(NULL) p ON p.reserva_id = r.id
   WHERE r.processo_id = _processo_id
   ORDER BY (r.situacao = 'cancelada'), r.exercicio DESC, n.codigo, a.codigo, f.codigo;
END;
$$;
REVOKE ALL ON FUNCTION public.processo_reservas_detalhe(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.processo_reservas_detalhe(uuid) TO authenticated;

-- PEDs do FIPLAN ligados ao processo (pela chave), sem os documentos de estorno.
CREATE OR REPLACE FUNCTION public.processo_peds(_processo_id uuid)
RETURNS TABLE (
  ped_id uuid,
  exercicio integer,
  numero text,
  empenho_numero text,
  valor numeric,
  situacao text,
  data_solicitacao date,
  data_autorizacao date,
  natureza text,
  fonte text,
  licitacao text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.processos_leitura_permitida() THEN
    RAISE EXCEPTION 'Requer a permissão de ver processos de contratação.' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT DISTINCT ON (f.exercicio, f.numero)
         f.id, f.exercicio, f.numero, f.empenho_numero, f.valor, f.situacao, f.data_solicitacao, f.data_autorizacao,
         nd.codigo::text, fr.codigo::text, f.licitacao
    FROM public.processos_licitatorios p
    JOIN public.fin_peds f ON f.processo_chave = public.processo_chave_fiplan(p.numero_processo)
    LEFT JOIN public.fin_dotacoes d ON d.id = f.dotacao_id
    LEFT JOIN public.fin_naturezas_despesa nd ON nd.id = d.natureza_despesa_id
    LEFT JOIN public.fin_fontes_recurso fr ON fr.id = d.fonte_recurso_id
   WHERE p.id = _processo_id AND NOT f.estorno
   ORDER BY f.exercicio DESC, f.numero DESC;
END;
$$;
REVOKE ALL ON FUNCTION public.processo_peds(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.processo_peds(uuid) TO authenticated;

-- Totais financeiros por processo (lista e ficha). _exercicio NULL: todos os exercícios.
CREATE OR REPLACE FUNCTION public.processos_financeiro(_exercicio integer DEFAULT NULL)
RETURNS TABLE (
  processo_id uuid,
  reservado numeric,
  pendente numeric,
  ped_autorizado numeric,
  empenhado numeric,
  liquidado numeric,
  pago numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.processos_leitura_permitida() THEN
    RAISE EXCEPTION 'Requer a permissão de ver processos de contratação.' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  WITH r AS (
    SELECT q.processo_id, sum(q.valor) AS reservado, sum(q.pendente) AS pendente
      FROM public.processo_reservas_pendentes(_exercicio) q GROUP BY q.processo_id
  ), x AS (
    SELECT e.processo_id, sum(e.ped_autorizado) AS ped, sum(e.empenhado) AS emp, sum(e.liquidado) AS liq, sum(e.pago) AS pago
      FROM public.processos_execucao(_exercicio) e GROUP BY e.processo_id
  )
  SELECT COALESCE(r.processo_id, x.processo_id), COALESCE(r.reservado, 0), COALESCE(r.pendente, 0),
         COALESCE(x.ped, 0), COALESCE(x.emp, 0), COALESCE(x.liq, 0), COALESCE(x.pago, 0)
    FROM r FULL JOIN x ON x.processo_id = r.processo_id;
END;
$$;
REVOKE ALL ON FUNCTION public.processos_financeiro(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.processos_financeiro(integer) TO authenticated;

-- Programação por natureza: cada ação × fonte × natureza do QDD (ou com reserva sem QDD) com a conta do saldo livre e
-- os processos que reservaram.
CREATE OR REPLACE FUNCTION public.programacao_por_natureza(_exercicio integer)
RETURNS TABLE (
  acao_id uuid,
  acao_codigo text,
  fonte_recurso_id uuid,
  fonte_codigo text,
  natureza_despesa_id uuid,
  natureza_codigo text,
  natureza_nome text,
  tem_qdd boolean,
  dotacao_atual numeric,
  empenhado numeric,
  bloqueado numeric,
  reserva_fiplan numeric,
  saldo_fiplan numeric,
  pendente_processos numeric,
  saldo_livre numeric,
  processos jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.processos_leitura_permitida() THEN
    RAISE EXCEPTION 'Requer a permissão de ver processos de contratação.' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  WITH qdd AS (
    SELECT d.acao_id, d.fonte_recurso_id AS fonte, d.natureza_despesa_id AS natureza,
           sum(d.valor_atual) AS atual, sum(COALESCE(d.valor_empenhado, 0)) AS emp,
           sum(COALESCE(d.valor_bloqueado, 0)) AS bloq,
           sum(COALESCE(d.valor_reserva, 0)) AS res,
           sum(public.fin_dotacao_disponivel(d.valor_atual, d.valor_bloqueado, d.valor_empenhado, d.valor_reserva, d.valor_ped)) AS disp
      FROM public.fin_dotacoes d
     WHERE d.exercicio = _exercicio AND d.ativo IS NOT FALSE
       AND d.acao_id IS NOT NULL AND d.fonte_recurso_id IS NOT NULL AND d.natureza_despesa_id IS NOT NULL
     GROUP BY 1, 2, 3
  ), pend AS (
    SELECT q.acao_id, q.fonte_recurso_id AS fonte, q.natureza_despesa_id AS natureza, sum(q.pendente) AS pendente,
           jsonb_agg(jsonb_build_object('id', p.id, 'numero_processo', p.numero_processo,
                       'objeto', COALESCE(p.objeto_resumido, left(p.objeto, 200)), 'reservado', q.valor, 'pendente', q.pendente)
                     ORDER BY p.numero_processo) AS processos
      FROM public.processo_reservas_pendentes(_exercicio) q
      JOIN public.processos_licitatorios p ON p.id = q.processo_id
     GROUP BY 1, 2, 3
  ), k AS (
    SELECT qdd.acao_id, qdd.fonte, qdd.natureza FROM qdd
    UNION
    SELECT pend.acao_id, pend.fonte, pend.natureza FROM pend
  )
  SELECT k.acao_id, a.codigo::text, k.fonte, f.codigo::text, k.natureza, n.codigo::text, n.nome::text,
         qdd.acao_id IS NOT NULL,
         COALESCE(qdd.atual, 0), COALESCE(qdd.emp, 0), COALESCE(qdd.bloq, 0), COALESCE(qdd.res, 0),
         COALESCE(qdd.disp, 0),
         COALESCE(pend.pendente, 0),
         COALESCE(qdd.disp, 0) - COALESCE(pend.pendente, 0),
         COALESCE(pend.processos, '[]'::jsonb)
    FROM k
    LEFT JOIN qdd ON qdd.acao_id = k.acao_id AND qdd.fonte = k.fonte AND qdd.natureza = k.natureza
    LEFT JOIN pend ON pend.acao_id = k.acao_id AND pend.fonte = k.fonte AND pend.natureza = k.natureza
    JOIN public.fin_acoes_orcamentarias a ON a.id = k.acao_id
    JOIN public.fin_fontes_recurso f ON f.id = k.fonte
    JOIN public.fin_naturezas_despesa n ON n.id = k.natureza
   ORDER BY n.codigo, a.codigo, f.codigo;
END;
$$;
REVOKE ALL ON FUNCTION public.programacao_por_natureza(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.programacao_por_natureza(integer) TO authenticated;

-- ----------------------------------------------------------------------------
-- 9. processo_empenhos: liga pela chave (mesma assinatura e mesma checagem de permissão da entrega 1)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.processo_empenhos(_processo_id uuid DEFAULT NULL)
RETURNS TABLE (
  processo_id uuid,
  empenho_id uuid,
  numero text,
  exercicio integer,
  data_empenho date,
  natureza text,
  fonte text,
  credor text,
  valor_empenhado numeric,
  valor_anulado numeric,
  valor_liquidado numeric,
  valor_pago numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT COALESCE(public.can_access_module(auth.uid(), 'compras')
                  AND (public.has_permission_code(auth.uid(), 'compras.processos.visualizar')
                       OR public.has_permission_code(auth.uid(), 'compras.processos.editar')), false) THEN
    RAISE EXCEPTION 'Requer a permissão de ver processos de contratação.' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT p.id, e.id, e.numero::text, e.exercicio, e.data_empenho,
         nd.codigo::text, fr.codigo::text, e.credor_nome,
         e.valor_empenhado, COALESCE(e.valor_anulado, 0), COALESCE(e.valor_liquidado, 0), COALESCE(e.valor_pago, 0)
    FROM public.processos_licitatorios p
    JOIN public.fin_empenhos e
      ON public.processo_chave_fiplan(COALESCE(e.processo_sei, e.processo_fiplan)) = public.processo_chave_fiplan(p.numero_processo)
    LEFT JOIN public.fin_naturezas_despesa nd ON nd.id = e.natureza_despesa_id
    LEFT JOIN public.fin_fontes_recurso fr ON fr.id = e.fonte_recurso_id
   WHERE _processo_id IS NULL OR p.id = _processo_id
   ORDER BY e.data_empenho DESC, e.numero;
END;
$$;
REVOKE ALL ON FUNCTION public.processo_empenhos(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.processo_empenhos(uuid) TO authenticated;
