-- ============================================================================
-- FINANCEIRO — lançamentos do extrato do Banco do Brasil (API Extratos v2)
-- ============================================================================
-- Spec: docs/superpowers/specs/2026-10-11-financeiro-fiplan-banco-design.md (Etapa 4)
--
--   fin_extrato_lancamentos        um registro por lançamento do extrato de uma conta
--                                  (fin_contas_bancarias). Só leitura pela API.
--   registrar_extrato_bb(...)      grava os lançamentos que a Edge Function `bb-api` buscou no BB
--                                  (idempotente pela chave_unica) e casa os débitos com
--                                  fin_pagamentos. Só a service role executa.
--
-- A Edge Function confere usuário, módulo financeiro e `pagamento.conciliar` antes de chamar
-- (docs/EDGE_FUNCTIONS.md). Lançamento casado só ganha o vínculo (pagamento_id): o status do
-- pagamento muda pela importação do retorno bancário (Etapa 2) ou pela conciliação manual.
--
-- Contrapartida (CPF/CNPJ e conta de terceiros) é dado pessoal: só o módulo financeiro lê.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. fin_extrato_lancamentos
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fin_extrato_lancamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_bancaria_id uuid NOT NULL REFERENCES public.fin_contas_bancarias(id),
  data_lancamento date NOT NULL,
  data_movimento date,
  valor numeric(15,2) NOT NULL CHECK (valor >= 0),
  sinal char(1) NOT NULL CHECK (sinal IN ('C', 'D')),
  codigo_historico integer,
  descricao text CHECK (char_length(descricao) <= 255),
  informacao_complementar text CHECK (char_length(informacao_complementar) <= 500),
  contrapartida_documento text CHECK (contrapartida_documento ~ '^\d{1,14}$'),
  contrapartida_tipo char(1) CHECK (contrapartida_tipo IN ('F', 'J')),
  contrapartida_banco integer,
  contrapartida_agencia integer,
  contrapartida_conta text CHECK (char_length(contrapartida_conta) <= 30),
  numero_documento text CHECK (char_length(numero_documento) <= 50),
  identificador_bb text NOT NULL CHECK (char_length(identificador_bb) BETWEEN 1 AND 200),
  chave_unica text NOT NULL UNIQUE,
  pagamento_id uuid REFERENCES public.fin_pagamentos(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.fin_extrato_lancamentos IS
  'Lançamentos do extrato do Banco do Brasil (API Extratos v2), gravados pela Edge Function bb-api via registrar_extrato_bb. chave_unica = conta_bancaria_id|identificador_bb. Contrapartida (CPF/CNPJ e conta): só o módulo financeiro lê.';
COMMENT ON COLUMN public.fin_extrato_lancamentos.identificador_bb IS
  'Identificação do lançamento montada pela Edge Function a partir dos campos do BB (data, lote, documento, histórico, valor, sinal e ordem dos repetidos no dia).';

CREATE INDEX IF NOT EXISTS idx_fin_extrato_lanc_conta_data ON public.fin_extrato_lancamentos (conta_bancaria_id, data_lancamento);
CREATE INDEX IF NOT EXISTS idx_fin_extrato_lanc_pagamento ON public.fin_extrato_lancamentos (pagamento_id);
CREATE INDEX IF NOT EXISTS idx_fin_extrato_lanc_documento ON public.fin_extrato_lancamentos (contrapartida_documento);

ALTER TABLE public.fin_extrato_lancamentos ENABLE ROW LEVEL SECURITY;

-- Leitura: quem acessa o módulo financeiro. Sem policy de escrita: só a service role grava.
DROP POLICY IF EXISTS fin_extrato_lancamentos_select ON public.fin_extrato_lancamentos;
CREATE POLICY fin_extrato_lancamentos_select ON public.fin_extrato_lancamentos
  FOR SELECT TO authenticated
  USING (
    (SELECT public.perfil_ativo_atual())
    AND public.can_access_module(auth.uid(), 'financeiro')
  );

REVOKE ALL ON public.fin_extrato_lancamentos FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.fin_extrato_lancamentos FROM authenticated;


-- ----------------------------------------------------------------------------
-- 2. registrar_extrato_bb (só service role)
-- ----------------------------------------------------------------------------
-- p_lancamentos: array de {identificador_bb, data_lancamento (YYYY-MM-DD), data_movimento,
--   valor (>= 0), sinal (C|D), codigo_historico, descricao, informacao_complementar,
--   contrapartida_documento (só dígitos), contrapartida_tipo (F|J), contrapartida_banco,
--   contrapartida_agencia, contrapartida_conta, numero_documento}.
-- Casa débitos sem vínculo com fin_pagamentos: valor líquido igual, data de efetivação (ou do
-- pagamento) igual à do lançamento e CPF/CNPJ do fornecedor igual ao da contrapartida; só quando o
-- candidato é único e não está vinculado a outro lançamento.
CREATE OR REPLACE FUNCTION public.registrar_extrato_bb(p_conta_bancaria_id uuid, p_lancamentos jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_l jsonb;
  v_idx integer := 0;
  v_chave text;
  v_id uuid;
  v_ins integer := 0; v_exist integer := 0; v_casados integer := 0;
  v_lanc record;
  v_pag uuid[];
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.fin_contas_bancarias WHERE id = p_conta_bancaria_id) THEN
    RAISE EXCEPTION 'Conta bancária não encontrada.' USING ERRCODE = 'P0002';
  END IF;
  IF jsonb_typeof(p_lancamentos) IS DISTINCT FROM 'array' OR jsonb_array_length(p_lancamentos) > 50000 THEN
    RAISE EXCEPTION 'Lançamentos inválidos.' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('registrar_extrato_bb'), hashtext(p_conta_bancaria_id::text));

  FOR v_l IN SELECT value FROM jsonb_array_elements(p_lancamentos) LOOP
    v_idx := v_idx + 1;
    IF jsonb_typeof(v_l) IS DISTINCT FROM 'object'
       OR char_length(COALESCE(v_l->>'identificador_bb', '')) NOT BETWEEN 1 AND 200
       OR COALESCE(v_l->>'data_lancamento', '') !~ '^\d{4}-\d{2}-\d{2}$'
       OR (NULLIF(v_l->>'data_movimento', '') IS NOT NULL AND (v_l->>'data_movimento') !~ '^\d{4}-\d{2}-\d{2}$')
       OR jsonb_typeof(v_l->'valor') IS DISTINCT FROM 'number'
       OR (v_l->>'valor')::numeric < 0 OR (v_l->>'valor')::numeric >= 1e13
       OR COALESCE(v_l->>'sinal', '') NOT IN ('C', 'D') THEN
      RAISE EXCEPTION 'Lançamento %: formato inválido.', v_idx USING ERRCODE = '22023';
    END IF;

    v_chave := p_conta_bancaria_id::text || '|' || (v_l->>'identificador_bb');
    INSERT INTO public.fin_extrato_lancamentos (
      conta_bancaria_id, data_lancamento, data_movimento, valor, sinal, codigo_historico, descricao,
      informacao_complementar, contrapartida_documento, contrapartida_tipo, contrapartida_banco,
      contrapartida_agencia, contrapartida_conta, numero_documento, identificador_bb, chave_unica
    ) VALUES (
      p_conta_bancaria_id, (v_l->>'data_lancamento')::date, NULLIF(v_l->>'data_movimento', '')::date,
      round((v_l->>'valor')::numeric, 2), v_l->>'sinal', NULLIF(v_l->>'codigo_historico', '')::integer,
      left(NULLIF(btrim(COALESCE(v_l->>'descricao', '')), ''), 255),
      left(NULLIF(btrim(COALESCE(v_l->>'informacao_complementar', '')), ''), 500),
      NULLIF(v_l->>'contrapartida_documento', ''), NULLIF(v_l->>'contrapartida_tipo', ''),
      NULLIF(v_l->>'contrapartida_banco', '')::integer, NULLIF(v_l->>'contrapartida_agencia', '')::integer,
      NULLIF(v_l->>'contrapartida_conta', ''), NULLIF(v_l->>'numero_documento', ''),
      v_l->>'identificador_bb', v_chave
    )
    ON CONFLICT (chave_unica) DO NOTHING
    RETURNING id INTO v_id;
    IF v_id IS NULL THEN v_exist := v_exist + 1; ELSE v_ins := v_ins + 1; END IF;
    v_id := NULL;
  END LOOP;

  -- Casamento dos débitos ainda sem vínculo desta conta (inclui os de importações anteriores).
  FOR v_lanc IN
    SELECT e.id, e.valor, e.data_lancamento, ltrim(e.contrapartida_documento, '0') AS doc
      FROM public.fin_extrato_lancamentos e
     WHERE e.conta_bancaria_id = p_conta_bancaria_id
       AND e.sinal = 'D' AND e.pagamento_id IS NULL
       AND NULLIF(ltrim(COALESCE(e.contrapartida_documento, ''), '0'), '') IS NOT NULL
  LOOP
    SELECT array_agg(p.id) INTO v_pag
      FROM public.fin_pagamentos p
      JOIN public.fornecedores f ON f.id = p.fornecedor_id
     WHERE COALESCE(p.status::text, '') NOT IN ('cancelado', 'estornado')
       AND NOT COALESCE(p.estornado, false)
       AND p.valor_liquido = v_lanc.valor
       AND COALESCE(p.data_efetivacao, p.data_pagamento) = v_lanc.data_lancamento
       AND ltrim(regexp_replace(COALESCE(f.cpf_cnpj, ''), '\D', '', 'g'), '0') = v_lanc.doc
       AND NOT EXISTS (SELECT 1 FROM public.fin_extrato_lancamentos o WHERE o.pagamento_id = p.id);
    IF cardinality(v_pag) = 1 THEN
      UPDATE public.fin_extrato_lancamentos SET pagamento_id = v_pag[1] WHERE id = v_lanc.id;
      v_casados := v_casados + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'recebidos', v_idx,
    'inseridos', v_ins,
    'existentes', v_exist,
    'conciliados', v_casados
  );
END;
$$;

COMMENT ON FUNCTION public.registrar_extrato_bb(uuid, jsonb) IS
  'Grava lançamentos do extrato do BB (idempotente pela chave_unica) e casa débitos com fin_pagamentos. Só a service role executa (Edge Function bb-api, que confere usuário e pagamento.conciliar).';

REVOKE ALL ON FUNCTION public.registrar_extrato_bb(uuid, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_extrato_bb(uuid, jsonb) TO service_role;
