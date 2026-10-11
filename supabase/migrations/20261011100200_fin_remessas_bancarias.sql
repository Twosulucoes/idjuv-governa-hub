-- ============================================================================
-- FINANCEIRO — remessa de reenvio dos pagamentos recusados (layout do BB Gestão MAX)
-- ============================================================================
-- Spec: docs/superpowers/specs/2026-10-11-financeiro-fiplan-banco-design.md (Etapa 3)
--
--   fin_movimentos_bancarios        + remessa_id (reserva/remessa do reenvio), reenviado_em (confirmado),
--                                   conta_corrigida/corrigido_por/corrigido_em (conta de destino do reenvio)
--   fin_remessas_bancarias          uma linha por arquivo de reenvio gerado pelo sistema: NSA, convênio e conta
--                                   pagadora, data do pagamento e o RETRATO dos créditos (creditos jsonb), que é
--                                   exatamente o que vai no arquivo; hash gravado na confirmação.
--   corrigir_conta_movimento(...)   registra banco/agência/conta corrigidos de um recusado, com justificativa.
--   registrar_remessa_bancaria(...) o SERVIDOR monta os créditos a partir dos movimentos (com a conta corrigida
--                                   quando houver), calcula quantidade e valor, reserva o NSA e os movimentos
--                                   (remessa_id) e devolve tudo o que o navegador precisa para gerar o arquivo.
--   confirmar_remessa_bancaria(...) grava o SHA-256 do arquivo e marca os movimentos reservados como reenviados.
--   obter_remessa_bancaria(id)      devolve a remessa (mesmo formato + hash) para baixar o arquivo de novo.
--   cancelar_remessa_bancaria(id)   apaga uma reserva não confirmada e libera os movimentos.
--   fin_casar_movimento_pagamento   (substitui a versão da 20261011100100) reconhece o retorno de um reenvio.
--
-- Regras do reenvio:
--   * só movimento recusado, que não seja fatura/guia (código de barras), com banco, agência, conta e CPF/CNPJ,
--     ainda não reenviado e sem reserva em outra remessa não confirmada;
--   * reserva não confirmada: a próxima chamada do MESMO usuário para a mesma conta/layout reaproveita o NSA
--     (se for a última remessa) e refaz os créditos; de outro usuário, os movimentos dela ficam presos até ela
--     ser confirmada ou cancelada (pelo autor ou por um administrador);
--   * p_nsa_minimo só vale na primeira remessa da conta/layout (define de onde a numeração do cliente continua);
--     depois é ignorado e o NSA segue max + 1;
--   * seu número de cada crédito = identificador original quando é numérico com até 20 dígitos (volta no retorno
--     e casa com o movimento original); senão nsa * 1000 + sequência (por isso no máximo 999 créditos por arquivo).
--
-- O arquivo é montado no navegador e enviado pelo usuário no Gestão MAX; o retorno volta pela importação de
-- arquivo bancário (migração 20261011100100). Convênio e conta pagadora ficam só em contas_autarquia (nada de
-- dado do cliente no código); a remessa guarda uma cópia deles para o arquivo baixado de novo sair igual.
--
-- Quem gera, corrige, confirma, obtém e cancela: módulo financeiro e `pagamento.conciliar`.
-- Auditoria: trg_audit_fin_remessas_bancarias (fn_audit_financeiro -> fin_audit_log).
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. fin_remessas_bancarias
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fin_remessas_bancarias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  layout text NOT NULL DEFAULT 'gestao_max_cnab240' CHECK (layout IN ('gestao_max_cnab240')),
  conta_autarquia_id uuid NOT NULL REFERENCES public.contas_autarquia(id),
  convenio text NOT NULL CHECK (char_length(convenio) BETWEEN 1 AND 20),
  agencia text NOT NULL CHECK (char_length(agencia) BETWEEN 1 AND 10),
  agencia_digito text CHECK (char_length(agencia_digito) <= 2),
  conta text NOT NULL CHECK (char_length(conta) BETWEEN 1 AND 20),
  conta_digito text CHECK (char_length(conta_digito) <= 2),
  nsa integer NOT NULL CHECK (nsa BETWEEN 1 AND 999999),
  data_geracao timestamptz NOT NULL DEFAULT now(),
  data_pagamento date NOT NULL,
  tipo_servico text NOT NULL DEFAULT '98' CHECK (tipo_servico IN ('98', '30')),
  quantidade integer NOT NULL CHECK (quantidade BETWEEN 1 AND 999),
  valor_total numeric(15,2) NOT NULL CHECK (valor_total > 0),
  creditos jsonb NOT NULL CHECK (jsonb_typeof(creditos) = 'array'),
  arquivo_sha256 text CHECK (arquivo_sha256 ~ '^[0-9a-f]{64}$'),
  movimentos uuid[] NOT NULL DEFAULT '{}',
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fin_remessas_bancarias_conta_layout_nsa_key UNIQUE (conta_autarquia_id, layout, nsa)
);

COMMENT ON TABLE public.fin_remessas_bancarias IS
  'Arquivos de reenvio (CNAB240 do BB Gestão MAX) gerados pelo sistema: NSA e créditos montados por registrar_remessa_bancaria, hash gravado por confirmar_remessa_bancaria. arquivo_sha256 nulo = reserva não confirmada (cancelável). Escrita só pelas RPCs.';
COMMENT ON COLUMN public.fin_remessas_bancarias.movimentos IS
  'fin_movimentos_bancarios recusados reenviados neste arquivo (mesma ordem de creditos).';
COMMENT ON COLUMN public.fin_remessas_bancarias.creditos IS
  'Retrato dos créditos do arquivo: [{movimento_id, pagamento_id, nome, documento, banco, agencia, agencia_dv, conta, conta_dv, valor, seu_numero}], montado pelo servidor.';
COMMENT ON COLUMN public.fin_remessas_bancarias.tipo_servico IS
  'Serviço dos créditos em conta BB no arquivo: 98 = pagamentos diversos (padrão), 30 = salários. Gravado para o arquivo baixado de novo sair igual.';
COMMENT ON COLUMN public.fin_remessas_bancarias.agencia IS
  'Cópia da agência da conta pagadora (contas_autarquia) no momento da remessa; idem agencia_digito, conta e conta_digito.';

ALTER TABLE public.fin_remessas_bancarias ENABLE ROW LEVEL SECURITY;

-- Leitura: quem acessa o módulo financeiro. Sem policy de escrita: ninguém grava pela API.
DROP POLICY IF EXISTS fin_remessas_bancarias_select ON public.fin_remessas_bancarias;
CREATE POLICY fin_remessas_bancarias_select ON public.fin_remessas_bancarias
  FOR SELECT TO authenticated
  USING (
    (SELECT public.perfil_ativo_atual())
    AND public.can_access_module(auth.uid(), 'financeiro')
  );

REVOKE ALL ON public.fin_remessas_bancarias FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.fin_remessas_bancarias FROM authenticated;

DROP TRIGGER IF EXISTS trg_audit_fin_remessas_bancarias ON public.fin_remessas_bancarias;
CREATE TRIGGER trg_audit_fin_remessas_bancarias
  AFTER INSERT OR UPDATE OR DELETE ON public.fin_remessas_bancarias
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_financeiro();


-- ----------------------------------------------------------------------------
-- 2. fin_movimentos_bancarios: reserva/reenvio e conta corrigida
-- ----------------------------------------------------------------------------
ALTER TABLE public.fin_movimentos_bancarios
  ADD COLUMN IF NOT EXISTS remessa_id uuid,
  ADD COLUMN IF NOT EXISTS reenviado_em timestamptz,
  ADD COLUMN IF NOT EXISTS conta_corrigida jsonb,
  ADD COLUMN IF NOT EXISTS corrigido_por uuid,
  ADD COLUMN IF NOT EXISTS corrigido_em timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                  WHERE conname = 'fin_movimentos_bancarios_remessa_id_fkey'
                    AND conrelid = 'public.fin_movimentos_bancarios'::regclass) THEN
    ALTER TABLE public.fin_movimentos_bancarios
      ADD CONSTRAINT fin_movimentos_bancarios_remessa_id_fkey
      FOREIGN KEY (remessa_id) REFERENCES public.fin_remessas_bancarias(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                  WHERE conname = 'fin_movimentos_bancarios_corrigido_por_fkey'
                    AND conrelid = 'public.fin_movimentos_bancarios'::regclass) THEN
    ALTER TABLE public.fin_movimentos_bancarios
      ADD CONSTRAINT fin_movimentos_bancarios_corrigido_por_fkey
      FOREIGN KEY (corrigido_por) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                  WHERE conname = 'fin_movimentos_bancarios_conta_corrigida_check'
                    AND conrelid = 'public.fin_movimentos_bancarios'::regclass) THEN
    ALTER TABLE public.fin_movimentos_bancarios
      ADD CONSTRAINT fin_movimentos_bancarios_conta_corrigida_check
      CHECK (conta_corrigida IS NULL OR jsonb_typeof(conta_corrigida) = 'object');
  END IF;
END $$;

COMMENT ON COLUMN public.fin_movimentos_bancarios.remessa_id IS
  'Remessa de reenvio (fin_remessas_bancarias) que reservou o recusado; com reenviado_em preenchido, a remessa confirmada em que ele foi reenviado.';
COMMENT ON COLUMN public.fin_movimentos_bancarios.reenviado_em IS
  'Quando a remessa de reenvio foi confirmada (arquivo gerado). Nulo com remessa_id preenchido = só reservado.';
COMMENT ON COLUMN public.fin_movimentos_bancarios.conta_corrigida IS
  'Conta de destino do reenvio, gravada por corrigir_conta_movimento: {banco, agencia, agencia_dv, conta, conta_dv, validado_bb, justificativa}. validado_bb é declarado pela tela depois da consulta à bb-api (que fica na trilha audit_logs).';

CREATE INDEX IF NOT EXISTS idx_fin_mov_bancarios_remessa ON public.fin_movimentos_bancarios (remessa_id);
CREATE INDEX IF NOT EXISTS idx_fin_mov_bancarios_identificador ON public.fin_movimentos_bancarios (identificador);


-- ----------------------------------------------------------------------------
-- 3. fin_casar_movimento_pagamento (versão final: reconhece o retorno do reenvio)
-- ----------------------------------------------------------------------------
-- Antes da busca normal (identificador_transacao, ou documento + valor + data a até 5 dias), procura o
-- movimento original de um reenvio confirmado:
--   a) crédito de remessa confirmada cujo seu número é o identificador do retorno, com o mesmo valor (e o
--      mesmo CPF/CNPJ, quando os dois existem) -> pagamento do movimento original;
--   b) movimento reenviado com o mesmo identificador e valor (e o mesmo CPF/CNPJ, quando os dois existem)
--      e já vinculado -> o mesmo pagamento.
-- Assim o reenvio pago em outro ano (ou fora da janela de 5 dias) casa com o pagamento original.
-- SECURITY INVOKER e sem EXECUTE para a API: só roda dentro das RPCs SECURITY DEFINER.
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
  v_ident text := NULLIF(btrim(COALESCE(p_identificador, '')), '');
  v_pag uuid;
  v_ids uuid[];
  v_pontos integer[];
BEGIN
  IF v_ident IS NOT NULL THEN
    -- a) seu número de um crédito de remessa de reenvio confirmada
    SELECT m.pagamento_id INTO v_pag
      FROM public.fin_remessas_bancarias r
      CROSS JOIN LATERAL jsonb_array_elements(r.creditos) AS c(cred)
      JOIN public.fin_movimentos_bancarios m ON m.id = (c.cred->>'movimento_id')::uuid
     WHERE r.arquivo_sha256 IS NOT NULL
       AND c.cred->>'seu_numero' = v_ident
       AND (c.cred->>'valor')::numeric = p_valor
       AND (v_doc IS NULL OR NULLIF(ltrim(COALESCE(c.cred->>'documento', ''), '0'), '') IS NULL
            OR ltrim(c.cred->>'documento', '0') = v_doc)
       AND m.pagamento_id IS NOT NULL
     ORDER BY r.data_geracao DESC
     LIMIT 1;
    IF v_pag IS NOT NULL THEN
      RETURN v_pag;
    END IF;

    -- b) movimento original reenviado com o mesmo identificador
    SELECT m.pagamento_id INTO v_pag
      FROM public.fin_movimentos_bancarios m
     WHERE m.reenviado_em IS NOT NULL
       AND m.remessa_id IS NOT NULL
       AND m.pagamento_id IS NOT NULL
       AND btrim(m.identificador) = v_ident
       AND m.valor = p_valor
       AND (v_doc IS NULL OR m.favorecido_documento IS NULL OR ltrim(m.favorecido_documento, '0') = v_doc)
     ORDER BY m.reenviado_em DESC
     LIMIT 1;
    IF v_pag IS NOT NULL THEN
      RETURN v_pag;
    END IF;
  END IF;

  SELECT array_agg(c.id ORDER BY c.pontos DESC, c.id), array_agg(c.pontos ORDER BY c.pontos DESC, c.id)
    INTO v_ids, v_pontos
    FROM (
      SELECT p.id,
             (CASE WHEN p.identificador_transacao IS NOT NULL
                        AND btrim(p.identificador_transacao) = v_ident THEN 100 ELSE 0 END)
           + (CASE WHEN p.data_pagamento = p_data THEN 10 ELSE 0 END)
           + (CASE WHEN NOT EXISTS (SELECT 1 FROM public.fin_movimentos_bancarios m
                                     WHERE m.pagamento_id = p.id) THEN 1 ELSE 0 END) AS pontos
        FROM public.fin_pagamentos p
        LEFT JOIN public.fornecedores f ON f.id = p.fornecedor_id
       WHERE COALESCE(p.status::text, '') NOT IN ('cancelado', 'estornado')
         AND NOT COALESCE(p.estornado, false)
         AND (
           (p.identificador_transacao IS NOT NULL AND v_ident IS NOT NULL
            AND btrim(p.identificador_transacao) = v_ident)
           OR (v_doc IS NOT NULL AND p_data IS NOT NULL AND p.data_pagamento IS NOT NULL
               AND abs(p.data_pagamento - p_data) <= 5
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
  'Uso interno das RPCs de conciliação bancária: devolve o pagamento que casa com o movimento (retorno de reenvio -> pagamento original; senão identificador, ou documento + valor + data a até 5 dias; NULL se nenhum/empate). Fora da API.';

REVOKE ALL ON FUNCTION public.fin_casar_movimento_pagamento(text, text, numeric, date) FROM PUBLIC, anon, authenticated;


-- ----------------------------------------------------------------------------
-- 4. corrigir_conta_movimento
-- ----------------------------------------------------------------------------
-- Só movimento recusado, não fatura, não reenviado e sem reserva (com reserva: cancele a reserva antes).
-- Justificativa obrigatória; para conta do BB (banco 001), ou a tela declara que validou na API do BB
-- (p_validado_bb) ou a justificativa tem ao menos 15 caracteres. Corrigir de novo sobrescreve (a trilha
-- fin_audit_log guarda as anteriores).
CREATE OR REPLACE FUNCTION public.corrigir_conta_movimento(
  p_movimento_id uuid,
  p_banco text,
  p_agencia text,
  p_agencia_dv text,
  p_conta text,
  p_conta_dv text,
  p_justificativa text,
  p_validado_bb boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_mov public.fin_movimentos_bancarios%ROWTYPE;
  v_banco text := btrim(COALESCE(p_banco, ''));
  v_agencia text := btrim(COALESCE(p_agencia, ''));
  v_agencia_dv text := upper(btrim(COALESCE(p_agencia_dv, '')));
  v_conta text := btrim(COALESCE(p_conta, ''));
  v_conta_dv text := upper(btrim(COALESCE(p_conta_dv, '')));
  v_just text := btrim(COALESCE(p_justificativa, ''));
  v_validado boolean := COALESCE(p_validado_bb, false);
  v_corrigida jsonb;
  v_agora timestamptz := now();
BEGIN
  IF v_uid IS NULL
     OR NOT COALESCE(public.perfil_ativo_atual()
                     AND public.can_access_module(v_uid, 'financeiro')
                     AND public.has_permission_code(v_uid, 'pagamento.conciliar'), false) THEN
    RAISE EXCEPTION 'Sem permissão para corrigir a conta do pagamento (pagamento.conciliar).' USING ERRCODE = '42501';
  END IF;

  IF v_banco !~ '^\d{3}$' OR v_agencia !~ '^\d{1,5}$' OR v_agencia_dv !~ '^[0-9X]?$'
     OR v_conta !~ '^\d{1,12}$' OR v_conta_dv !~ '^[0-9X]?$' THEN
    RAISE EXCEPTION 'Banco (3 dígitos), agência (até 5 dígitos), conta (até 12 dígitos) ou dígitos (1 posição) inválidos.'
      USING ERRCODE = '22023';
  END IF;
  IF v_just = '' OR char_length(v_just) > 500 THEN
    RAISE EXCEPTION 'Informe a justificativa da correção (até 500 caracteres).' USING ERRCODE = '22023';
  END IF;
  IF v_banco = '001' AND NOT v_validado AND char_length(v_just) < 15 THEN
    RAISE EXCEPTION 'Conta do Banco do Brasil não validada na API: detalhe a justificativa (mínimo de 15 caracteres).'
      USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_mov FROM public.fin_movimentos_bancarios WHERE id = p_movimento_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Movimento bancário não encontrado.' USING ERRCODE = 'P0002';
  END IF;
  IF v_mov.situacao <> 'recusado' THEN
    RAISE EXCEPTION 'Só pagamento recusado tem a conta corrigida para reenvio.' USING ERRCODE = '22023';
  END IF;
  IF v_mov.tipo_lancamento = 'fatura' OR v_mov.codigo_barras IS NOT NULL THEN
    RAISE EXCEPTION 'Fatura/guia (código de barras) não tem conta de destino.' USING ERRCODE = '22023';
  END IF;
  IF v_mov.reenviado_em IS NOT NULL THEN
    RAISE EXCEPTION 'O pagamento já foi reenviado: a conta não muda mais.' USING ERRCODE = '22023';
  END IF;
  IF v_mov.remessa_id IS NOT NULL THEN
    RAISE EXCEPTION 'O pagamento está reservado numa remessa de reenvio não confirmada: cancele a reserva antes de corrigir.'
      USING ERRCODE = '22023';
  END IF;

  v_corrigida := jsonb_build_object(
    'banco', v_banco, 'agencia', v_agencia, 'agencia_dv', v_agencia_dv,
    'conta', v_conta, 'conta_dv', v_conta_dv,
    'validado_bb', v_validado, 'justificativa', v_just);

  UPDATE public.fin_movimentos_bancarios
     SET conta_corrigida = v_corrigida, corrigido_por = v_uid, corrigido_em = v_agora, updated_at = v_agora
   WHERE id = p_movimento_id;

  RETURN jsonb_build_object('movimento_id', p_movimento_id, 'conta_corrigida', v_corrigida,
                            'corrigido_por', v_uid, 'corrigido_em', v_agora);
END;
$$;

COMMENT ON FUNCTION public.corrigir_conta_movimento(uuid, text, text, text, text, text, text, boolean) IS
  'Registra a conta de destino corrigida de um pagamento recusado (antes do reenvio), com justificativa. Exige pagamento.conciliar.';

REVOKE ALL ON FUNCTION public.corrigir_conta_movimento(uuid, text, text, text, text, text, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.corrigir_conta_movimento(uuid, text, text, text, text, text, text, boolean) TO authenticated;


-- ----------------------------------------------------------------------------
-- 5. fin_remessa_bancaria_json (uso interno: formato devolvido pelas RPCs)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fin_remessa_bancaria_json(p_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', r.id, 'nsa', r.nsa, 'convenio', r.convenio,
    'agencia', r.agencia, 'agencia_digito', r.agencia_digito, 'conta', r.conta, 'conta_digito', r.conta_digito,
    'data_geracao', r.data_geracao, 'data_pagamento', r.data_pagamento, 'tipo_servico', r.tipo_servico,
    'creditos', r.creditos,
    'arquivo_sha256', r.arquivo_sha256)
    FROM public.fin_remessas_bancarias r
   WHERE r.id = p_id;
$$;

COMMENT ON FUNCTION public.fin_remessa_bancaria_json(uuid) IS
  'Uso interno das RPCs de remessa de reenvio: remessa no formato devolvido à tela. Fora da API.';

REVOKE ALL ON FUNCTION public.fin_remessa_bancaria_json(uuid) FROM PUBLIC, anon, authenticated;


-- ----------------------------------------------------------------------------
-- 6. registrar_remessa_bancaria
-- ----------------------------------------------------------------------------
-- Versão anterior (antes da revisão, nunca aplicada em produção) recebia quantidade e valor do cliente.
DROP FUNCTION IF EXISTS public.registrar_remessa_bancaria(uuid, text, integer, numeric, uuid[], integer);

-- p_movimentos: ids dos recusados, na ordem do arquivo (1 a 999, sem repetição).
-- p_data_pagamento: data do crédito (de ontem a 60 dias à frente; ontem tolera o fuso do servidor).
-- p_tipo_servico: serviço dos créditos em conta BB ('98' pagamentos diversos, padrão; '30' salários).
-- Devolve {id, nsa, convenio, agencia, agencia_digito, conta, conta_digito, data_geracao, data_pagamento,
-- tipo_servico, creditos}; cada crédito: {movimento_id, pagamento_id, nome, documento, banco, agencia, agencia_dv, conta,
-- conta_dv, valor, seu_numero}.
CREATE OR REPLACE FUNCTION public.registrar_remessa_bancaria(
  p_conta_autarquia_id uuid,
  p_layout text,
  p_movimentos uuid[],
  p_data_pagamento date,
  p_nsa_minimo integer DEFAULT NULL,
  p_tipo_servico text DEFAULT '98'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_conta public.contas_autarquia%ROWTYPE;
  v_ultima public.fin_remessas_bancarias%ROWTYPE;
  v_tem_ultima boolean;
  v_reuso uuid;
  v_outras boolean;
  v_movs uuid[] := COALESCE(p_movimentos, '{}');
  v_mov public.fin_movimentos_bancarios%ROWTYPE;
  v_mov_id uuid;
  v_ord bigint;
  v_nsa integer;
  v_id uuid;
  v_creditos jsonb := '[]'::jsonb;
  v_total numeric(15,2) := 0;
  v_banco text; v_ag text; v_ag_dv text; v_ct text; v_ct_dv text;
  v_partes text[];
  v_seu text;
BEGIN
  IF v_uid IS NULL
     OR NOT COALESCE(public.perfil_ativo_atual()
                     AND public.can_access_module(v_uid, 'financeiro')
                     AND public.has_permission_code(v_uid, 'pagamento.conciliar'), false) THEN
    RAISE EXCEPTION 'Sem permissão para gerar remessa bancária (pagamento.conciliar).' USING ERRCODE = '42501';
  END IF;

  IF COALESCE(p_layout, '') NOT IN ('gestao_max_cnab240') THEN
    RAISE EXCEPTION 'Layout de remessa inválido: %', p_layout USING ERRCODE = '22023';
  END IF;
  IF p_data_pagamento IS NULL OR p_data_pagamento < CURRENT_DATE - 1 OR p_data_pagamento > CURRENT_DATE + 60 THEN
    RAISE EXCEPTION 'Data do pagamento inválida (de hoje a 60 dias à frente).' USING ERRCODE = '22023';
  END IF;
  IF p_nsa_minimo IS NOT NULL AND p_nsa_minimo NOT BETWEEN 1 AND 999999 THEN
    RAISE EXCEPTION 'NSA mínimo inválido.' USING ERRCODE = '22023';
  END IF;
  IF COALESCE(p_tipo_servico, '98') NOT IN ('98', '30') THEN
    RAISE EXCEPTION 'Tipo de serviço inválido (98 pagamentos diversos ou 30 salários).' USING ERRCODE = '22023';
  END IF;
  IF cardinality(v_movs) NOT BETWEEN 1 AND 999
     OR array_position(v_movs, NULL) IS NOT NULL
     OR cardinality(v_movs) <> (SELECT count(DISTINCT m) FROM unnest(v_movs) m) THEN
    RAISE EXCEPTION 'Informe de 1 a 999 movimentos, sem repetição.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_conta FROM public.contas_autarquia WHERE id = p_conta_autarquia_id AND COALESCE(ativo, true);
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conta pagadora não encontrada ou inativa.' USING ERRCODE = 'P0002';
  END IF;
  IF NULLIF(btrim(COALESCE(v_conta.convenio_pagamento, '')), '') IS NULL THEN
    RAISE EXCEPTION 'A conta pagadora não tem convênio de pagamento cadastrado.' USING ERRCODE = '22023';
  END IF;
  IF NULLIF(btrim(COALESCE(v_conta.agencia, '')), '') IS NULL OR NULLIF(btrim(COALESCE(v_conta.conta, '')), '') IS NULL THEN
    RAISE EXCEPTION 'A conta pagadora não tem agência/conta cadastradas.' USING ERRCODE = '22023';
  END IF;

  -- Um NSA por vez para a mesma conta e layout.
  PERFORM pg_advisory_xact_lock(hashtext('registrar_remessa_bancaria'), hashtext(p_conta_autarquia_id::text || '|' || p_layout));

  SELECT * INTO v_ultima FROM public.fin_remessas_bancarias
   WHERE conta_autarquia_id = p_conta_autarquia_id AND layout = p_layout
   ORDER BY nsa DESC LIMIT 1;
  v_tem_ultima := FOUND;
  IF v_tem_ultima AND v_ultima.arquivo_sha256 IS NULL AND v_ultima.created_by = v_uid THEN
    -- Nova tentativa do mesmo usuário: reaproveita a reserva não confirmada (NSA e linha).
    v_reuso := v_ultima.id;
  END IF;
  v_outras := EXISTS (SELECT 1 FROM public.fin_remessas_bancarias
                       WHERE conta_autarquia_id = p_conta_autarquia_id AND layout = p_layout
                         AND id IS DISTINCT FROM v_reuso);

  IF NOT v_outras AND p_nsa_minimo IS NOT NULL THEN
    v_nsa := p_nsa_minimo;              -- primeira remessa da conta/layout: define a numeração
  ELSIF v_reuso IS NOT NULL THEN
    v_nsa := v_ultima.nsa;
  ELSE
    v_nsa := COALESCE(v_ultima.nsa, 0) + 1;  -- p_nsa_minimo ignorado depois da primeira remessa
  END IF;
  IF v_nsa > 999999 THEN
    RAISE EXCEPTION 'NSA esgotado para esta conta.' USING ERRCODE = '22023';
  END IF;

  -- Trava os movimentos (ordem fixa evita deadlock) e monta os créditos na ordem pedida.
  PERFORM 1 FROM public.fin_movimentos_bancarios WHERE id = ANY (v_movs) ORDER BY id FOR UPDATE;

  FOR v_mov_id, v_ord IN SELECT x.id, x.ord FROM unnest(v_movs) WITH ORDINALITY AS x(id, ord) ORDER BY x.ord LOOP
    SELECT * INTO v_mov FROM public.fin_movimentos_bancarios WHERE id = v_mov_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Movimento % não encontrado.', v_ord USING ERRCODE = 'P0002';
    END IF;
    IF v_mov.situacao <> 'recusado' THEN
      RAISE EXCEPTION 'Movimento % (%) não está recusado.', v_ord, v_mov.identificador USING ERRCODE = '22023';
    END IF;
    IF v_mov.tipo_lancamento = 'fatura' OR v_mov.codigo_barras IS NOT NULL THEN
      RAISE EXCEPTION 'Movimento % (%) é fatura/guia: não se reenvia como crédito.', v_ord, v_mov.identificador USING ERRCODE = '22023';
    END IF;
    IF v_mov.reenviado_em IS NOT NULL THEN
      RAISE EXCEPTION 'Movimento % (%) já foi reenviado.', v_ord, v_mov.identificador USING ERRCODE = '22023';
    END IF;
    IF v_mov.remessa_id IS NOT NULL AND v_mov.remessa_id IS DISTINCT FROM v_reuso THEN
      RAISE EXCEPTION 'Movimento % (%) está reservado em outra remessa ainda não confirmada (NSA %).', v_ord, v_mov.identificador,
        (SELECT nsa FROM public.fin_remessas_bancarias WHERE id = v_mov.remessa_id) USING ERRCODE = '22023';
    END IF;
    IF v_mov.favorecido_documento IS NULL THEN
      RAISE EXCEPTION 'Movimento % (%) sem CPF/CNPJ do favorecido.', v_ord, v_mov.identificador USING ERRCODE = '22023';
    END IF;
    IF v_mov.valor <= 0 THEN
      RAISE EXCEPTION 'Movimento % (%) sem valor.', v_ord, v_mov.identificador USING ERRCODE = '22023';
    END IF;

    IF v_mov.conta_corrigida IS NOT NULL THEN
      v_banco := v_mov.conta_corrigida->>'banco';
      v_ag := v_mov.conta_corrigida->>'agencia';
      v_ag_dv := COALESCE(v_mov.conta_corrigida->>'agencia_dv', '');
      v_ct := v_mov.conta_corrigida->>'conta';
      v_ct_dv := COALESCE(v_mov.conta_corrigida->>'conta_dv', '');
    ELSE
      -- Formato gravado pelos parsers: agência "1234" ou "1234-5"; conta "1111" ou "1111-X".
      v_banco := btrim(COALESCE(v_mov.banco, ''));
      v_partes := regexp_match(btrim(COALESCE(v_mov.agencia, '')), '^(\d{1,5})(?:-([0-9Xx]))?$');
      v_ag := v_partes[1]; v_ag_dv := upper(COALESCE(v_partes[2], ''));
      v_partes := regexp_match(btrim(COALESCE(v_mov.conta, '')), '^(\d{1,12})(?:-([0-9Xx]))?$');
      v_ct := v_partes[1]; v_ct_dv := upper(COALESCE(v_partes[2], ''));
    END IF;
    IF COALESCE(v_banco, '') !~ '^\d{3}$' OR COALESCE(v_ag, '') !~ '^\d{1,5}$' OR COALESCE(v_ct, '') !~ '^\d{1,12}$'
       OR v_ct ~ '^0+$' THEN
      RAISE EXCEPTION 'Movimento % (%) sem banco/agência/conta válidos: corrija a conta antes do reenvio.', v_ord, v_mov.identificador
        USING ERRCODE = '22023';
    END IF;

    v_seu := CASE WHEN btrim(v_mov.identificador) ~ '^\d{1,20}$' THEN btrim(v_mov.identificador)
                  ELSE (v_nsa::bigint * 1000 + v_ord)::text END;
    v_creditos := v_creditos || jsonb_build_array(jsonb_build_object(
      'movimento_id', v_mov.id, 'pagamento_id', v_mov.pagamento_id,
      'nome', COALESCE(v_mov.favorecido_nome, ''), 'documento', v_mov.favorecido_documento,
      'banco', v_banco, 'agencia', v_ag, 'agencia_dv', v_ag_dv, 'conta', v_ct, 'conta_dv', v_ct_dv,
      'valor', v_mov.valor, 'seu_numero', v_seu));
    v_total := v_total + v_mov.valor;
  END LOOP;

  IF v_total >= 1e13 THEN
    RAISE EXCEPTION 'Valor total inválido.' USING ERRCODE = '22023';
  END IF;

  IF v_reuso IS NOT NULL THEN
    -- Libera o que a tentativa anterior reservou e não está na nova lista.
    UPDATE public.fin_movimentos_bancarios
       SET remessa_id = NULL, updated_at = now()
     WHERE remessa_id = v_reuso AND reenviado_em IS NULL AND NOT (id = ANY (v_movs));
    UPDATE public.fin_remessas_bancarias
       SET nsa = v_nsa, convenio = btrim(v_conta.convenio_pagamento),
           agencia = btrim(v_conta.agencia), agencia_digito = NULLIF(btrim(COALESCE(v_conta.agencia_digito, '')), ''),
           conta = btrim(v_conta.conta), conta_digito = NULLIF(btrim(COALESCE(v_conta.conta_digito, '')), ''),
           data_geracao = now(), data_pagamento = p_data_pagamento, tipo_servico = COALESCE(p_tipo_servico, '98'),
           quantidade = cardinality(v_movs), valor_total = v_total, creditos = v_creditos, movimentos = v_movs
     WHERE id = v_reuso
     RETURNING id INTO v_id;
  ELSE
    INSERT INTO public.fin_remessas_bancarias
      (layout, conta_autarquia_id, convenio, agencia, agencia_digito, conta, conta_digito, nsa,
       data_pagamento, tipo_servico, quantidade, valor_total, creditos, movimentos, created_by)
    VALUES
      (p_layout, p_conta_autarquia_id, btrim(v_conta.convenio_pagamento),
       btrim(v_conta.agencia), NULLIF(btrim(COALESCE(v_conta.agencia_digito, '')), ''),
       btrim(v_conta.conta), NULLIF(btrim(COALESCE(v_conta.conta_digito, '')), ''), v_nsa,
       p_data_pagamento, COALESCE(p_tipo_servico, '98'), cardinality(v_movs), v_total, v_creditos, v_movs, v_uid)
    RETURNING id INTO v_id;
  END IF;

  -- Reserva: os movimentos passam a apontar para esta remessa (reenviado_em só na confirmação).
  UPDATE public.fin_movimentos_bancarios
     SET remessa_id = v_id, updated_at = now()
   WHERE id = ANY (v_movs) AND remessa_id IS DISTINCT FROM v_id;

  RETURN public.fin_remessa_bancaria_json(v_id) - 'arquivo_sha256';
END;
$$;

COMMENT ON FUNCTION public.registrar_remessa_bancaria(uuid, text, uuid[], date, integer, text) IS
  'Monta no servidor os créditos de uma remessa de reenvio (Gestão MAX) a partir dos movimentos recusados (com a conta corrigida), reserva o NSA e os movimentos e devolve convênio, conta pagadora e créditos. Exige pagamento.conciliar.';

REVOKE ALL ON FUNCTION public.registrar_remessa_bancaria(uuid, text, uuid[], date, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_remessa_bancaria(uuid, text, uuid[], date, integer, text) TO authenticated;


-- ----------------------------------------------------------------------------
-- 7. confirmar_remessa_bancaria
-- ----------------------------------------------------------------------------
-- Só o autor da reserva confirma. Idempotente com o mesmo hash; hash diferente numa remessa já confirmada é
-- recusado. Falha se algum movimento não estiver mais reservado para esta remessa (ou deixou de estar recusado).
CREATE OR REPLACE FUNCTION public.confirmar_remessa_bancaria(p_id uuid, p_sha256 text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_rem public.fin_remessas_bancarias%ROWTYPE;
  v_ok integer;
  v_marcados integer := 0;
BEGIN
  IF v_uid IS NULL
     OR NOT COALESCE(public.perfil_ativo_atual()
                     AND public.can_access_module(v_uid, 'financeiro')
                     AND public.has_permission_code(v_uid, 'pagamento.conciliar'), false) THEN
    RAISE EXCEPTION 'Sem permissão para confirmar remessa bancária (pagamento.conciliar).' USING ERRCODE = '42501';
  END IF;
  IF COALESCE(p_sha256, '') !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'Hash do arquivo inválido.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_rem FROM public.fin_remessas_bancarias WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Remessa não encontrada.' USING ERRCODE = 'P0002';
  END IF;
  IF v_rem.arquivo_sha256 IS NOT NULL THEN
    IF v_rem.arquivo_sha256 <> p_sha256 THEN
      RAISE EXCEPTION 'A remessa NSA % já foi confirmada com outro arquivo.', v_rem.nsa USING ERRCODE = '22023';
    END IF;
    RETURN jsonb_build_object('id', v_rem.id, 'nsa', v_rem.nsa, 'arquivo_sha256', v_rem.arquivo_sha256,
                              'movimentos_marcados', 0, 'ja_confirmada', true);
  END IF;
  IF v_rem.created_by IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'Só quem gerou a remessa NSA % confirma o arquivo.', v_rem.nsa USING ERRCODE = '42501';
  END IF;

  PERFORM 1 FROM public.fin_movimentos_bancarios WHERE id = ANY (v_rem.movimentos) ORDER BY id FOR UPDATE;
  SELECT count(*) INTO v_ok
    FROM public.fin_movimentos_bancarios
   WHERE id = ANY (v_rem.movimentos) AND remessa_id = p_id AND reenviado_em IS NULL AND situacao = 'recusado';
  IF v_ok <> cardinality(v_rem.movimentos) THEN
    RAISE EXCEPTION '% movimento(s) da remessa NSA % não estão mais reservados para ela (ou deixaram de estar recusados): gere de novo.',
      cardinality(v_rem.movimentos) - v_ok, v_rem.nsa USING ERRCODE = '22023';
  END IF;

  UPDATE public.fin_remessas_bancarias SET arquivo_sha256 = p_sha256 WHERE id = p_id;

  UPDATE public.fin_movimentos_bancarios
     SET reenviado_em = now(), updated_at = now()
   WHERE id = ANY (v_rem.movimentos) AND remessa_id = p_id AND reenviado_em IS NULL;
  GET DIAGNOSTICS v_marcados = ROW_COUNT;

  RETURN jsonb_build_object('id', v_rem.id, 'nsa', v_rem.nsa, 'arquivo_sha256', p_sha256,
                            'movimentos_marcados', v_marcados, 'ja_confirmada', false);
END;
$$;

COMMENT ON FUNCTION public.confirmar_remessa_bancaria(uuid, text) IS
  'Grava o SHA-256 do arquivo de reenvio gerado e marca os movimentos reservados como reenviados (falha se algum saiu da reserva). Só o autor da reserva. Exige pagamento.conciliar.';

REVOKE ALL ON FUNCTION public.confirmar_remessa_bancaria(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirmar_remessa_bancaria(uuid, text) TO authenticated;


-- ----------------------------------------------------------------------------
-- 8. obter_remessa_bancaria
-- ----------------------------------------------------------------------------
-- Mesmo formato de registrar_remessa_bancaria + arquivo_sha256 (nulo = reserva não confirmada), para gerar
-- de novo o mesmo arquivo e conferir o hash.
CREATE OR REPLACE FUNCTION public.obter_remessa_bancaria(p_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_json jsonb;
BEGIN
  IF v_uid IS NULL
     OR NOT COALESCE(public.perfil_ativo_atual()
                     AND public.can_access_module(v_uid, 'financeiro')
                     AND public.has_permission_code(v_uid, 'pagamento.conciliar'), false) THEN
    RAISE EXCEPTION 'Sem permissão para obter remessa bancária (pagamento.conciliar).' USING ERRCODE = '42501';
  END IF;
  v_json := public.fin_remessa_bancaria_json(p_id);
  IF v_json IS NULL THEN
    RAISE EXCEPTION 'Remessa não encontrada.' USING ERRCODE = 'P0002';
  END IF;
  RETURN v_json;
END;
$$;

COMMENT ON FUNCTION public.obter_remessa_bancaria(uuid) IS
  'Devolve a remessa de reenvio (convênio, conta pagadora, data, créditos e hash) para baixar o arquivo de novo. Exige pagamento.conciliar.';

REVOKE ALL ON FUNCTION public.obter_remessa_bancaria(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obter_remessa_bancaria(uuid) TO authenticated;


-- ----------------------------------------------------------------------------
-- 9. cancelar_remessa_bancaria
-- ----------------------------------------------------------------------------
-- Só reserva NÃO confirmada (nenhum arquivo saiu do sistema), pelo autor ou por um administrador. Apaga a
-- reserva (a trilha fin_audit_log guarda a linha) e libera os movimentos. Se era a última remessa da conta,
-- o NSA volta a ficar livre; se não, o número fica pulado.
CREATE OR REPLACE FUNCTION public.cancelar_remessa_bancaria(p_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_rem public.fin_remessas_bancarias%ROWTYPE;
  v_liberados integer := 0;
BEGIN
  IF v_uid IS NULL
     OR NOT COALESCE(public.perfil_ativo_atual()
                     AND public.can_access_module(v_uid, 'financeiro')
                     AND public.has_permission_code(v_uid, 'pagamento.conciliar'), false) THEN
    RAISE EXCEPTION 'Sem permissão para cancelar remessa bancária (pagamento.conciliar).' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_rem FROM public.fin_remessas_bancarias WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Remessa não encontrada.' USING ERRCODE = 'P0002';
  END IF;
  IF v_rem.arquivo_sha256 IS NOT NULL THEN
    RAISE EXCEPTION 'A remessa NSA % já foi confirmada (arquivo gerado): não pode ser cancelada.', v_rem.nsa
      USING ERRCODE = '22023';
  END IF;
  IF v_rem.created_by IS DISTINCT FROM v_uid AND NOT COALESCE(public.is_admin_user(v_uid), false) THEN
    RAISE EXCEPTION 'Só quem reservou a remessa NSA % (ou um administrador) cancela.', v_rem.nsa USING ERRCODE = '42501';
  END IF;

  UPDATE public.fin_movimentos_bancarios
     SET remessa_id = NULL, updated_at = now()
   WHERE remessa_id = p_id AND reenviado_em IS NULL;
  GET DIAGNOSTICS v_liberados = ROW_COUNT;

  DELETE FROM public.fin_remessas_bancarias WHERE id = p_id;

  RETURN jsonb_build_object('id', p_id, 'nsa', v_rem.nsa, 'movimentos_liberados', v_liberados);
END;
$$;

COMMENT ON FUNCTION public.cancelar_remessa_bancaria(uuid) IS
  'Cancela (apaga) uma reserva de remessa de reenvio não confirmada e libera os movimentos. Autor da reserva ou administrador; exige pagamento.conciliar.';

REVOKE ALL ON FUNCTION public.cancelar_remessa_bancaria(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancelar_remessa_bancaria(uuid) TO authenticated;
