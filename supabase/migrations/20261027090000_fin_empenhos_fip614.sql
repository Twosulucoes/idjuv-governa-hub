-- ============================================================================
-- FINANCEIRO — empenhos importados do FIPLAN (FIP 614 – Situação de Empenho)
-- ============================================================================
-- Spec: docs/superpowers/specs/2026-10-22-importacao-empenhos-fip614-design.md
--
-- Pedido do dono do produto (2026-10-22, cartão "FIPLAN é a fonte" e "APROVADO" no desenho): o empenho é
-- emitido no FIPLAN e o sistema espelha. O que muda:
--   1. fin_empenhos ganha a origem (sistema | fiplan) e os dados que o FIP 614 traz (credor do FIPLAN, PED,
--      dotação como o FIPLAN escreve). Para o empenho do FIPLAN, favorecido e dotação deixam de ser
--      obrigatórios: o relatório não traz CPF/CNPJ e corta a dotação antes do IDU, então a dotação só é
--      ligada quando o QDD tem uma única candidata. O empenho feito no sistema continua exigindo os dois.
--   2. Os triggers que somam o empenho na dotação e conferem o saldo ignoram o empenho do FIPLAN: os valores
--      da dotação já vêm do QDD (importar_qdd_fiplan). Para o empenho do sistema nada muda.
--   3. fornecedores ganha o código do credor no FIPLAN, para ligar o empenho importado ao favorecido.
--   4. fin_empenho_documentos_fiplan: LIQ, NOB, GCV e estornos de cada empenho importado (histórico).
--      Leitura pelo módulo financeiro; escrita só pela RPC.
--   5. importar_empenhos_fip614(): recebe os empenhos lidos do PDF e, numa transação, cria ou atualiza.
--      Nada é apagado. Com p_simular = true só calcula o que mudaria. Permissão: orcamento.importar.
-- ============================================================================

SET lock_timeout = '10s';

-- ----------------------------------------------------------------------------
-- 1. fin_empenhos
-- ----------------------------------------------------------------------------
ALTER TABLE public.fin_empenhos
  ADD COLUMN IF NOT EXISTS origem text NOT NULL DEFAULT 'sistema',
  ADD COLUMN IF NOT EXISTS credor_codigo_fiplan text,
  ADD COLUMN IF NOT EXISTS credor_nome text,
  ADD COLUMN IF NOT EXISTS ped_numero text,
  ADD COLUMN IF NOT EXISTS ped_data date,
  ADD COLUMN IF NOT EXISTS dotacao_fiplan text,
  ADD COLUMN IF NOT EXISTS processo_fiplan text,
  ADD COLUMN IF NOT EXISTS data_referencia_fiplan date,
  ADD COLUMN IF NOT EXISTS importacao_id uuid REFERENCES public.importacoes(id) ON DELETE SET NULL;

-- O número do FIPLAN (17302.0001.26.00051-8) tem 21 caracteres
ALTER TABLE public.fin_empenhos ALTER COLUMN numero TYPE varchar(30);
ALTER TABLE public.fin_empenhos ALTER COLUMN fornecedor_id DROP NOT NULL;
ALTER TABLE public.fin_empenhos ALTER COLUMN dotacao_id DROP NOT NULL;

ALTER TABLE public.fin_empenhos DROP CONSTRAINT IF EXISTS fin_empenhos_origem_check;
ALTER TABLE public.fin_empenhos ADD CONSTRAINT fin_empenhos_origem_check
  CHECK (origem IN ('sistema', 'fiplan'));
ALTER TABLE public.fin_empenhos DROP CONSTRAINT IF EXISTS fin_empenhos_sistema_vinculos_check;
ALTER TABLE public.fin_empenhos ADD CONSTRAINT fin_empenhos_sistema_vinculos_check
  CHECK (origem = 'fiplan' OR (fornecedor_id IS NOT NULL AND dotacao_id IS NOT NULL));
ALTER TABLE public.fin_empenhos DROP CONSTRAINT IF EXISTS fin_empenhos_fiplan_credor_check;
ALTER TABLE public.fin_empenhos ADD CONSTRAINT fin_empenhos_fiplan_credor_check
  CHECK (origem = 'sistema' OR (credor_codigo_fiplan ~ '^\d{4}\.\d{5}-\d$' AND char_length(credor_nome) BETWEEN 1 AND 300));

COMMENT ON COLUMN public.fin_empenhos.origem IS
  'sistema = emitido pela tela de Empenhos; fiplan = importado do FIP 614 (não soma na dotação: os valores dela vêm do QDD).';
COMMENT ON COLUMN public.fin_empenhos.credor_codigo_fiplan IS 'Código do credor no FIPLAN (ex.: 2001.00715-5), do FIP 614.';
COMMENT ON COLUMN public.fin_empenhos.dotacao_fiplan IS 'Dotação como o FIP 614 escreve (pode vir cortada antes do IDU).';
COMMENT ON COLUMN public.fin_empenhos.processo_fiplan IS 'Processo como o FIPLAN mostra (ex.: 00000112/26-14); processo_sei traz o número no padrão do SEI.';

CREATE INDEX IF NOT EXISTS idx_fin_empenhos_importacao ON public.fin_empenhos (importacao_id);
CREATE INDEX IF NOT EXISTS idx_fin_empenhos_credor_fiplan ON public.fin_empenhos (credor_codigo_fiplan);

-- ----------------------------------------------------------------------------
-- 2. Triggers: o empenho do FIPLAN não mexe na dotação nem confere saldo
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_atualizar_saldo_dotacao_empenho()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- A origem não muda depois de gravada (a dotação ficaria somada ou descontada errado)
  IF TG_OP = 'UPDATE' AND OLD.origem IS DISTINCT FROM NEW.origem THEN
    RAISE EXCEPTION 'A origem do empenho (sistema/FIPLAN) não pode ser alterada.' USING ERRCODE = '22023';
  END IF;
  -- Empenho do FIPLAN: os valores da dotação vêm do QDD
  IF (CASE WHEN TG_OP = 'DELETE' THEN OLD.origem ELSE NEW.origem END) = 'fiplan' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'INSERT' THEN
    UPDATE fin_dotacoes
    SET valor_empenhado = valor_empenhado + NEW.valor_empenhado,
        updated_at = now()
    WHERE id = NEW.dotacao_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.valor_empenhado != NEW.valor_empenhado THEN
    UPDATE fin_dotacoes
    SET valor_empenhado = valor_empenhado - OLD.valor_empenhado + NEW.valor_empenhado,
        updated_at = now()
    WHERE id = NEW.dotacao_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE fin_dotacoes
    SET valor_empenhado = valor_empenhado - OLD.valor_empenhado,
        updated_at = now()
    WHERE id = OLD.dotacao_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- O trigger só disparava em UPDATE OF valor_empenhado; passa a olhar a origem também
DROP TRIGGER IF EXISTS trg_atualizar_saldo_empenho ON public.fin_empenhos;
CREATE TRIGGER trg_atualizar_saldo_empenho
  AFTER INSERT OR DELETE OR UPDATE OF valor_empenhado, origem ON public.fin_empenhos
  FOR EACH ROW EXECUTE FUNCTION public.fn_atualizar_saldo_dotacao_empenho();

CREATE OR REPLACE FUNCTION public.fn_validar_saldo_empenho()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $_$
DECLARE
  v_saldo NUMERIC;
BEGIN
  IF NEW.origem = 'fiplan' THEN
    RETURN NEW;
  END IF;

  SELECT saldo_disponivel INTO v_saldo
  FROM public.fin_dotacoes
  WHERE id = NEW.dotacao_id;

  IF v_saldo IS NULL THEN
    RAISE EXCEPTION 'Dotação não encontrada (id: %)', NEW.dotacao_id;
  END IF;

  IF NEW.valor_empenhado > v_saldo THEN
    RAISE EXCEPTION 'Valor do empenho (R$ %) excede o saldo disponível da dotação (R$ %)',
      NEW.valor_empenhado, v_saldo;
  END IF;

  RETURN NEW;
END;
$_$;

CREATE OR REPLACE FUNCTION public.fn_verificar_saldo_dotacao()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_saldo NUMERIC;
BEGIN
  IF NEW.origem = 'fiplan' THEN
    RETURN NEW;
  END IF;

  SELECT saldo_disponivel INTO v_saldo
  FROM fin_dotacoes
  WHERE id = NEW.dotacao_id;

  IF v_saldo < NEW.valor_empenhado THEN
    RAISE EXCEPTION 'Saldo insuficiente na dotação. Disponível: %, Solicitado: %', v_saldo, NEW.valor_empenhado;
  END IF;

  RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. fornecedores: código do credor no FIPLAN
-- ----------------------------------------------------------------------------
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS codigo_credor_fiplan text;
ALTER TABLE public.fornecedores DROP CONSTRAINT IF EXISTS fornecedores_codigo_credor_fiplan_check;
ALTER TABLE public.fornecedores ADD CONSTRAINT fornecedores_codigo_credor_fiplan_check
  CHECK (codigo_credor_fiplan IS NULL OR codigo_credor_fiplan ~ '^\d{4}\.\d{5}-\d$');
CREATE UNIQUE INDEX IF NOT EXISTS fornecedores_codigo_credor_fiplan_key
  ON public.fornecedores (codigo_credor_fiplan) WHERE codigo_credor_fiplan IS NOT NULL;
COMMENT ON COLUMN public.fornecedores.codigo_credor_fiplan IS
  'Código do credor no FIPLAN (ex.: 2001.00715-5). Liga os empenhos importados do FIP 614 ao favorecido.';

-- ----------------------------------------------------------------------------
-- 4. fin_empenho_documentos_fiplan
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fin_empenho_documentos_fiplan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empenho_id uuid NOT NULL REFERENCES public.fin_empenhos(id) ON DELETE CASCADE,
  ordem integer NOT NULL CHECK (ordem >= 0),
  tipo text NOT NULL CHECK (tipo IN ('EMP', 'EST', 'LIQ', 'NOB', 'GCV')),
  numero text NOT NULL CHECK (numero ~ '^\d{5}\.\d{4}\.\d{2}\.\d{5}-\d$'),
  data date NOT NULL,
  pc text CHECK (pc IN ('P', 'C')),
  -- Valores nas colunas do relatório; o estorno (EST) tira o valor da coluna onde ele cai
  valor_emp numeric(15,2),
  valor_liq numeric(15,2),
  valor_nob numeric(15,2),
  valor_gcv numeric(15,2),
  historico text CHECK (char_length(historico) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fin_empenho_documentos_fiplan_ordem UNIQUE (empenho_id, ordem)
);

COMMENT ON TABLE public.fin_empenho_documentos_fiplan IS
  'Documentos de execução do FIPLAN (FIP 614) de cada empenho importado: EMP, LIQ, NOB, GCV e estornos. Escrita só pela RPC importar_empenhos_fip614.';

ALTER TABLE public.fin_empenho_documentos_fiplan ENABLE ROW LEVEL SECURITY;

-- Leitura: quem acessa o módulo financeiro. Sem policy de escrita: ninguém grava pela API.
DROP POLICY IF EXISTS fin_empenho_documentos_fiplan_select ON public.fin_empenho_documentos_fiplan;
CREATE POLICY fin_empenho_documentos_fiplan_select ON public.fin_empenho_documentos_fiplan
  FOR SELECT TO authenticated
  USING (
    (SELECT public.perfil_ativo_atual())
    AND (SELECT public.can_access_module(auth.uid(), 'financeiro'))
  );

REVOKE ALL ON public.fin_empenho_documentos_fiplan FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.fin_empenho_documentos_fiplan FROM authenticated;

-- ----------------------------------------------------------------------------
-- 5. importar_empenhos_fip614
-- ----------------------------------------------------------------------------
-- p_linhas: array de {numero, data_empenho, processo, processo_sei, convenio, ped_numero, ped_data, dotacao,
--           credor_codigo, credor_nome, valor_empenhado, valor_anulado,
--           totais {emp, liq, nob, gcv, saldo_liquidar, a_pagar},
--           documentos [{tipo, numero, data, pc, valores {emp, liq, nob, gcv}, historico}]}
-- p_arquivo: {nome, sha256, tamanho}; p_data_referencia: data de referência do relatório
CREATE OR REPLACE FUNCTION public.importar_empenhos_fip614(
  p_exercicio integer,
  p_linhas jsonb,
  p_arquivo jsonb,
  p_data_referencia date DEFAULT NULL,
  p_simular boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c_numero constant text := '^\d{5}\.\d{4}\.\d{2}\.\d{5}-\d$';
  v_uid uuid := auth.uid();
  v_linha jsonb;
  v_doc jsonb;
  v_idx integer := -1;
  v_ordem integer;
  v_numero text;
  v_numeros text[] := '{}';
  v_dot_digitos text;
  v_candidatas uuid[];
  v_dotacao public.fin_dotacoes%ROWTYPE;
  v_dotacao_id uuid;
  v_fornecedor_id uuid;
  v_existente public.fin_empenhos%ROWTYPE;
  v_achou boolean;
  v_emp numeric; v_anulado numeric; v_liq numeric; v_pago numeric; v_liquido numeric;
  v_status public.status_empenho;
  v_objeto text;
  v_novo jsonb;
  v_antigo jsonb;
  v_mudancas jsonb;
  v_avisos text[];
  v_docs_novos jsonb;
  v_docs_antigos jsonb;
  v_empenho_id uuid;
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
    RAISE EXCEPTION 'Sem permissão para importar dados do FIPLAN (orcamento.importar).' USING ERRCODE = '42501';
  END IF;
  IF p_exercicio IS NULL OR p_exercicio NOT BETWEEN 2000 AND 2100 THEN
    RAISE EXCEPTION 'Exercício inválido: %', p_exercicio USING ERRCODE = '22023';
  END IF;
  IF jsonb_typeof(p_linhas) IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_linhas) NOT BETWEEN 1 AND 5000 THEN
    RAISE EXCEPTION 'Envie de 1 a 5000 empenhos.' USING ERRCODE = '22023';
  END IF;
  IF NOT p_simular AND (
       char_length(COALESCE(p_arquivo->>'nome', '')) NOT BETWEEN 1 AND 255
       OR COALESCE(p_arquivo->>'sha256', '') !~ '^[0-9a-f]{64}$'
       OR COALESCE(p_arquivo->>'tamanho', '') !~ '^\d{1,15}$') THEN
    RAISE EXCEPTION 'Dados do arquivo inválidos.' USING ERRCODE = '22023';
  END IF;

  -- Uma importação de empenhos por exercício de cada vez
  PERFORM pg_advisory_xact_lock(hashtext('importar_empenhos_fip614'), p_exercicio);

  IF NOT p_simular THEN
    INSERT INTO public.importacoes
      (tipo, modulo, arquivo_nome, arquivo_sha256, arquivo_tamanho, exercicio, created_by)
    VALUES
      ('empenhos_fip614', 'financeiro', p_arquivo->>'nome', p_arquivo->>'sha256',
       (p_arquivo->>'tamanho')::bigint, p_exercicio, v_uid)
    RETURNING id INTO v_import_id;
  END IF;

  FOR v_linha IN SELECT value FROM jsonb_array_elements(p_linhas) LOOP
    v_idx := v_idx + 1;
    v_avisos := '{}';
    v_numero := btrim(COALESCE(v_linha->>'numero', ''));

    -- Validação da linha
    BEGIN
      IF v_numero !~ c_numero OR split_part(v_numero, '.', 3) <> right(p_exercicio::text, 2) THEN
        RAISE EXCEPTION 'número do empenho "%" fora do padrão ou de outro exercício', left(v_numero, 30);
      END IF;
      IF v_numero = ANY (v_numeros) THEN
        RAISE EXCEPTION 'empenho repetido no arquivo';
      END IF;
      IF COALESCE(v_linha->>'credor_codigo', '') !~ '^\d{4}\.\d{5}-\d$'
         OR char_length(btrim(COALESCE(v_linha->>'credor_nome', ''))) NOT BETWEEN 1 AND 300 THEN
        RAISE EXCEPTION 'credor fora do padrão';
      END IF;
      IF COALESCE(v_linha->>'ped_numero', '') !~ c_numero
         OR COALESCE(v_linha->>'dotacao', '') !~ '^\d{5}\.\d{4}(\.\d+){7}'
         OR char_length(v_linha->>'dotacao') > 80
         OR char_length(COALESCE(v_linha->>'processo', '')) NOT BETWEEN 1 AND 30
         OR char_length(COALESCE(v_linha->>'processo_sei', '')) > 50
         OR char_length(COALESCE(v_linha->>'convenio', '')) > 200 THEN
        RAISE EXCEPTION 'PED, dotação ou processo fora do padrão';
      END IF;
      v_emp := (v_linha->>'valor_empenhado')::numeric;
      v_anulado := (v_linha->>'valor_anulado')::numeric;
      v_liq := (v_linha#>>'{totais,liq}')::numeric;
      v_pago := (v_linha#>>'{totais,nob}')::numeric;
      v_liquido := (v_linha#>>'{totais,emp}')::numeric;
      IF v_emp IS NULL OR v_anulado IS NULL OR v_liq IS NULL OR v_pago IS NULL OR v_liquido IS NULL
         OR v_emp < 0 OR v_emp >= 1e13 OR v_anulado < 0 OR v_anulado > v_emp
         OR v_emp - v_anulado <> v_liquido OR v_liq < 0 OR v_pago < 0 OR v_liq > v_liquido OR v_pago > v_liq THEN
        RAISE EXCEPTION 'valores do empenho incoerentes (empenhado, estornado, liquidado e pago)';
      END IF;
      IF jsonb_typeof(v_linha->'documentos') IS DISTINCT FROM 'array'
         OR jsonb_array_length(v_linha->'documentos') NOT BETWEEN 1 AND 500 THEN
        RAISE EXCEPTION 'lista de documentos inválida';
      END IF;
      FOR v_doc IN SELECT value FROM jsonb_array_elements(v_linha->'documentos') LOOP
        IF COALESCE(v_doc->>'tipo', '') NOT IN ('EMP', 'EST', 'LIQ', 'NOB', 'GCV')
           OR COALESCE(v_doc->>'numero', '') !~ c_numero
           OR (v_doc->>'data')::date IS NULL
           OR COALESCE(v_doc->>'pc', 'P') NOT IN ('P', 'C')
           OR char_length(COALESCE(v_doc->>'historico', '')) > 1000
           OR abs(COALESCE((v_doc#>>'{valores,emp}')::numeric, 0)) >= 1e13
           OR abs(COALESCE((v_doc#>>'{valores,liq}')::numeric, 0)) >= 1e13
           OR abs(COALESCE((v_doc#>>'{valores,nob}')::numeric, 0)) >= 1e13
           OR abs(COALESCE((v_doc#>>'{valores,gcv}')::numeric, 0)) >= 1e13 THEN
          RAISE EXCEPTION 'documento % fora do padrão', left(COALESCE(v_doc->>'numero', '?'), 30);
        END IF;
      END LOOP;
      IF (v_linha->>'data_empenho')::date IS NULL OR (v_linha->>'ped_data')::date IS NULL THEN
        RAISE EXCEPTION 'data do empenho ou do PED ausente';
      END IF;
    EXCEPTION WHEN raise_exception OR invalid_text_representation OR datetime_field_overflow
                    OR invalid_datetime_format OR numeric_value_out_of_range THEN
      v_erros := v_erros || jsonb_build_object('indice', v_idx,
                   'mensagem', format('EMP %s: %s.', left(v_numero, 30), SQLERRM));
      CONTINUE;
    END;
    v_numeros := v_numeros || v_numero;

    SELECT * INTO v_existente FROM public.fin_empenhos
     WHERE exercicio = p_exercicio AND numero = v_numero
     FOR UPDATE;
    v_achou := FOUND;
    IF v_achou AND v_existente.origem <> 'fiplan' THEN
      v_erros := v_erros || jsonb_build_object('indice', v_idx,
                   'mensagem', format('EMP %s: já existe um empenho do sistema com esse número; não é sobrescrito.', v_numero));
      CONTINUE;
    END IF;

    -- Dotação: dígitos de função…fonte (o FIP 614 corta a dotação antes do IDU) contra o código do QDD.
    -- Só liga com uma candidata; com várias, mantém a escolhida antes se ela ainda for candidata.
    v_dot_digitos := regexp_replace(array_to_string((string_to_array(v_linha->>'dotacao', '.'))[3:9], ''), '\D', '', 'g');
    SELECT array_agg(id ORDER BY codigo_dotacao) INTO v_candidatas
      FROM public.fin_dotacoes
     WHERE exercicio = p_exercicio
       AND regexp_replace(codigo_dotacao, '\D', '', 'g') LIKE v_dot_digitos || '%';
    v_dotacao_id := NULL;
    IF cardinality(v_candidatas) = 1 THEN
      v_dotacao_id := v_candidatas[1];
    ELSIF v_achou AND v_existente.dotacao_id = ANY (COALESCE(v_candidatas, '{}')) THEN
      v_dotacao_id := v_existente.dotacao_id;
    ELSIF COALESCE(cardinality(v_candidatas), 0) = 0 THEN
      v_avisos := v_avisos || 'Dotação não encontrada no QDD do exercício: importe o QDD e importe de novo.'::text;
    ELSE
      v_avisos := v_avisos || format('O relatório não traz o IDU e há %s dotações possíveis no QDD: escolha a dotação no detalhe do empenho.',
                                     cardinality(v_candidatas));
    END IF;
    IF v_dotacao_id IS NOT NULL THEN
      SELECT * INTO v_dotacao FROM public.fin_dotacoes WHERE id = v_dotacao_id;
    ELSE
      v_dotacao := NULL;
    END IF;

    SELECT id INTO v_fornecedor_id FROM public.fornecedores
     WHERE codigo_credor_fiplan = v_linha->>'credor_codigo';

    v_status := CASE
      WHEN v_liquido = 0 THEN 'anulado'
      WHEN v_pago >= v_liquido THEN 'pago'
      WHEN v_pago > 0 THEN 'parcialmente_pago'
      WHEN v_liq >= v_liquido THEN 'liquidado'
      WHEN v_liq > 0 THEN 'parcialmente_liquidado'
      ELSE 'emitido'
    END::public.status_empenho;

    -- O FIP 614 não traz o histórico do empenho: usa o da primeira liquidação
    SELECT d->>'historico' INTO v_objeto
      FROM jsonb_array_elements(v_linha->'documentos') AS d
     WHERE d->>'tipo' = 'LIQ' AND COALESCE(btrim(d->>'historico'), '') <> ''
     LIMIT 1;
    v_objeto := COALESCE(v_objeto, format('Empenho do FIPLAN – processo %s', v_linha->>'processo_sei'));

    v_novo := jsonb_build_object(
      'data_empenho',         v_linha->>'data_empenho',
      'dotacao_id',           v_dotacao_id,
      'fornecedor_id',        v_fornecedor_id,
      'natureza_despesa_id',  v_dotacao.natureza_despesa_id,
      'fonte_recurso_id',     v_dotacao.fonte_recurso_id,
      'valor_empenhado',      v_emp,
      'valor_anulado',        v_anulado,
      'valor_liquidado',      v_liq,
      'valor_pago',           v_pago,
      'status',               v_status,
      'objeto',               v_objeto,
      'processo_sei',         v_linha->>'processo_sei',
      'processo_fiplan',      v_linha->>'processo',
      'observacoes',          CASE WHEN COALESCE(v_linha->>'convenio', '') <> '' THEN 'Convênio: ' || (v_linha->>'convenio') END,
      'credor_codigo_fiplan', v_linha->>'credor_codigo',
      'credor_nome',          btrim(v_linha->>'credor_nome'),
      'ped_numero',           v_linha->>'ped_numero',
      'ped_data',             v_linha->>'ped_data',
      'dotacao_fiplan',       v_linha->>'dotacao'
    );

    -- Documentos como serão gravados (para comparar com os de antes)
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
             'tipo', d->>'tipo', 'numero', d->>'numero', 'data', d->>'data', 'pc', d->>'pc',
             'valor_emp', (d#>>'{valores,emp}')::numeric, 'valor_liq', (d#>>'{valores,liq}')::numeric,
             'valor_nob', (d#>>'{valores,nob}')::numeric, 'valor_gcv', (d#>>'{valores,gcv}')::numeric,
             'historico', NULLIF(btrim(COALESCE(d->>'historico', '')), '')) ORDER BY o), '[]'::jsonb)
      INTO v_docs_novos
      FROM jsonb_array_elements(v_linha->'documentos') WITH ORDINALITY AS x(d, o);

    IF NOT v_achou THEN
      v_ins := v_ins + 1;
      v_resultado := v_resultado || jsonb_strip_nulls(jsonb_build_object('indice', v_idx, 'acao', 'inserir',
                       'avisos', CASE WHEN cardinality(v_avisos) > 0 THEN to_jsonb(v_avisos) END));
      IF p_simular THEN CONTINUE; END IF;
      INSERT INTO public.fin_empenhos
        (numero, exercicio, data_empenho, dotacao_id, fornecedor_id, tipo, natureza_despesa_id, fonte_recurso_id,
         valor_empenhado, valor_anulado, valor_liquidado, valor_pago, objeto, processo_sei, status, observacoes,
         origem, credor_codigo_fiplan, credor_nome, ped_numero, ped_data, dotacao_fiplan, processo_fiplan,
         data_referencia_fiplan, importacao_id, created_by)
      VALUES
        (v_numero, p_exercicio, (v_novo->>'data_empenho')::date, v_dotacao_id, v_fornecedor_id, 'ordinario',
         v_dotacao.natureza_despesa_id, v_dotacao.fonte_recurso_id,
         v_emp, v_anulado, v_liq, v_pago, v_objeto, v_novo->>'processo_sei', v_status, v_novo->>'observacoes',
         'fiplan', v_novo->>'credor_codigo_fiplan', v_novo->>'credor_nome', v_novo->>'ped_numero',
         (v_novo->>'ped_data')::date, v_novo->>'dotacao_fiplan', v_novo->>'processo_fiplan',
         p_data_referencia, v_import_id, v_uid)
      RETURNING id INTO v_empenho_id;
    ELSE
      v_antigo := jsonb_build_object(
        'data_empenho',         v_existente.data_empenho,
        'dotacao_id',           v_existente.dotacao_id,
        'fornecedor_id',        v_existente.fornecedor_id,
        'natureza_despesa_id',  v_existente.natureza_despesa_id,
        'fonte_recurso_id',     v_existente.fonte_recurso_id,
        'valor_empenhado',      v_existente.valor_empenhado,
        'valor_anulado',        v_existente.valor_anulado,
        'valor_liquidado',      v_existente.valor_liquidado,
        'valor_pago',           v_existente.valor_pago,
        'status',               v_existente.status,
        'objeto',               v_existente.objeto,
        'processo_sei',         v_existente.processo_sei,
        'processo_fiplan',      v_existente.processo_fiplan,
        'observacoes',          v_existente.observacoes,
        'credor_codigo_fiplan', v_existente.credor_codigo_fiplan,
        'credor_nome',          v_existente.credor_nome,
        'ped_numero',           v_existente.ped_numero,
        'ped_data',             v_existente.ped_data,
        'dotacao_fiplan',       v_existente.dotacao_fiplan
      );
      SELECT COALESCE(jsonb_object_agg(k, jsonb_build_array(v_antigo->k, v_novo->k)), '{}'::jsonb) INTO v_mudancas
        FROM jsonb_object_keys(v_novo) AS k
       -- numeric e texto comparados pelo valor (12.5 = 12.50; datas e ids já vêm como texto)
       WHERE (v_antigo->>k) IS DISTINCT FROM (v_novo->>k)
         AND NOT (jsonb_typeof(v_novo->k) = 'number' AND jsonb_typeof(v_antigo->k) = 'number'
                  AND (v_antigo->>k)::numeric = (v_novo->>k)::numeric);

      SELECT COALESCE(jsonb_agg(jsonb_build_object(
               'tipo', tipo, 'numero', numero, 'data', data::text, 'pc', pc,
               'valor_emp', valor_emp, 'valor_liq', valor_liq, 'valor_nob', valor_nob, 'valor_gcv', valor_gcv,
               'historico', historico) ORDER BY ordem), '[]'::jsonb)
        INTO v_docs_antigos
        FROM public.fin_empenho_documentos_fiplan WHERE empenho_id = v_existente.id;
      IF v_docs_antigos IS DISTINCT FROM v_docs_novos THEN
        v_mudancas := v_mudancas || jsonb_build_object('documentos',
                        jsonb_build_array(jsonb_array_length(v_docs_antigos), jsonb_array_length(v_docs_novos)));
      END IF;

      IF v_mudancas = '{}'::jsonb THEN
        v_igual := v_igual + 1;
        v_resultado := v_resultado || jsonb_strip_nulls(jsonb_build_object('indice', v_idx, 'acao', 'sem_alteracao',
                         'avisos', CASE WHEN cardinality(v_avisos) > 0 THEN to_jsonb(v_avisos) END));
        CONTINUE;
      END IF;
      v_upd := v_upd + 1;
      v_resultado := v_resultado || jsonb_strip_nulls(jsonb_build_object('indice', v_idx, 'acao', 'atualizar',
                       'mudancas', v_mudancas,
                       'avisos', CASE WHEN cardinality(v_avisos) > 0 THEN to_jsonb(v_avisos) END));
      IF p_simular THEN CONTINUE; END IF;
      UPDATE public.fin_empenhos SET
        data_empenho = (v_novo->>'data_empenho')::date,
        dotacao_id = v_dotacao_id,
        fornecedor_id = v_fornecedor_id,
        natureza_despesa_id = v_dotacao.natureza_despesa_id,
        fonte_recurso_id = v_dotacao.fonte_recurso_id,
        valor_empenhado = v_emp,
        valor_anulado = v_anulado,
        valor_liquidado = v_liq,
        valor_pago = v_pago,
        status = v_status,
        objeto = v_objeto,
        processo_sei = v_novo->>'processo_sei',
        processo_fiplan = v_novo->>'processo_fiplan',
        observacoes = v_novo->>'observacoes',
        credor_codigo_fiplan = v_novo->>'credor_codigo_fiplan',
        credor_nome = v_novo->>'credor_nome',
        ped_numero = v_novo->>'ped_numero',
        ped_data = (v_novo->>'ped_data')::date,
        dotacao_fiplan = v_novo->>'dotacao_fiplan',
        data_referencia_fiplan = COALESCE(p_data_referencia, data_referencia_fiplan),
        importacao_id = v_import_id,
        updated_at = now()
      WHERE id = v_existente.id;
      v_empenho_id := v_existente.id;
      DELETE FROM public.fin_empenho_documentos_fiplan WHERE empenho_id = v_empenho_id;
    END IF;

    v_ordem := 0;
    FOR v_doc IN SELECT value FROM jsonb_array_elements(v_docs_novos) LOOP
      INSERT INTO public.fin_empenho_documentos_fiplan
        (empenho_id, ordem, tipo, numero, data, pc, valor_emp, valor_liq, valor_nob, valor_gcv, historico)
      VALUES
        (v_empenho_id, v_ordem, v_doc->>'tipo', v_doc->>'numero', (v_doc->>'data')::date, v_doc->>'pc',
         (v_doc->>'valor_emp')::numeric, (v_doc->>'valor_liq')::numeric, (v_doc->>'valor_nob')::numeric,
         (v_doc->>'valor_gcv')::numeric, v_doc->>'historico');
      v_ordem := v_ordem + 1;
    END LOOP;
  END LOOP;

  -- Com qualquer erro, nada fica gravado (inclusive o log).
  IF jsonb_array_length(v_erros) > 0 AND NOT p_simular THEN
    RAISE EXCEPTION 'O relatório tem % empenho(s) com erro; nada foi gravado.', jsonb_array_length(v_erros)
      USING ERRCODE = '22023';
  END IF;

  -- Empenhos do FIPLAN do exercício que não vieram no arquivo: só avisados, nunca apagados.
  SELECT array_agg(numero ORDER BY numero) INTO v_ausentes
    FROM public.fin_empenhos
   WHERE exercicio = p_exercicio AND origem = 'fiplan' AND NOT (numero = ANY (v_numeros));

  v_resumo := jsonb_build_object(
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

COMMENT ON FUNCTION public.importar_empenhos_fip614(integer, jsonb, jsonb, date, boolean) IS
  'Importa os empenhos do FIP 614 do FIPLAN para fin_empenhos (origem fiplan) e o histórico de LIQ/NOB/GCV/estornos (p_simular = true só calcula as mudanças). Exige orcamento.importar.';

REVOKE ALL ON FUNCTION public.importar_empenhos_fip614(integer, jsonb, jsonb, date, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.importar_empenhos_fip614(integer, jsonb, jsonb, date, boolean) TO authenticated;

UPDATE public.module_permissions_catalog
   SET label = 'Importar dados do FIPLAN (QDD, tabelas e empenhos)'
 WHERE permission_code = 'orcamento.importar';
