-- ============================================================================
-- FINANCEIRO — remessa OBN600 (ordens bancárias de crédito em conta) gerada a partir dos pagamentos
-- ============================================================================
-- Spec: docs/superpowers/specs/2026-10-21-financeiro-remessa-obn600-design.md
--
--   contas_autarquia                + obn_codigo_cliente, obn_unidade_gestora, obn_gestao (dados do header e de
--                                   cada OB; ficam no banco, nunca no código)
--   fin_remessas_bancarias          layout passa a aceitar 'obn600'; + pagamentos (ids, na ordem das OBs) e
--                                   parametros ({unidade_gestora, gestao}); creditos guarda o RETRATO das OBs.
--   fin_pagamentos                  + remessa_bancaria_id (reserva ou remessa OBN em que o pagamento saiu)
--   fin_remessa_bancaria_json       (substitui) devolve também layout, parametros e pagamentos.
--   registrar_remessa_obn600(...)   o SERVIDOR monta as OBs a partir dos pagamentos (favorecido do fornecedor,
--                                   conta do pagamento ou do fornecedor), numera relação e OB, reserva o nº da
--                                   remessa e os pagamentos e devolve o que o navegador precisa para o arquivo.
--   confirmar_remessa_bancaria      (substitui) na OBN600 confere a reserva dos pagamentos e grava o nº da OB em
--                                   fin_pagamentos.identificador_transacao: é por ele que o retorno do banco
--                                   (importar_arquivo_bancario) casa a OB com o pagamento e dá a baixa.
--   cancelar_remessa_bancaria       (substitui) também libera os pagamentos reservados.
--
-- Numeração (conferir no manual do OBN600 / com o banco):
--   * nº da remessa (5 dígitos): continua a sequência por conta; p_sequencial_minimo só vale na primeira OBN600
--     da conta (de onde a numeração continua); depois, max + 1;
--   * nº da OB (11 dígitos) = exercício + sequência do pagamento: OP-000123 de 2026 → 02026000123;
--   * nº da relação (11 dígitos) = exercício + nº da remessa + tipo de OB (31 outro banco, 32 BB).
--
-- Regras do pagamento na remessa: programado ou autorizado, não estornado, com fornecedor (CPF/CNPJ e nome),
-- banco/agência/conta válidos (do pagamento ou, se vazios, do fornecedor) e fora de outra remessa OBN600
-- (confirmada, ou reservada por outra pessoa). Fatura/guia (código de barras) fica fora.
--
-- Quem gera, confirma, obtém e cancela: módulo financeiro e `pagamento.conciliar` (a mesma do reenvio).
-- Sem tabela nova: as policies de fin_remessas_bancarias (SELECT pelo módulo, escrita só pelas RPCs) seguem.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. contas_autarquia: identificação no OBN600
-- ----------------------------------------------------------------------------
ALTER TABLE public.contas_autarquia
  ADD COLUMN IF NOT EXISTS obn_codigo_cliente varchar(9),
  ADD COLUMN IF NOT EXISTS obn_unidade_gestora varchar(6),
  ADD COLUMN IF NOT EXISTS obn_gestao varchar(5);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                  WHERE conname = 'contas_autarquia_obn_check'
                    AND conrelid = 'public.contas_autarquia'::regclass) THEN
    ALTER TABLE public.contas_autarquia
      ADD CONSTRAINT contas_autarquia_obn_check CHECK (
        (obn_codigo_cliente IS NULL OR obn_codigo_cliente ~ '^\d{1,9}$')
        AND (obn_unidade_gestora IS NULL OR obn_unidade_gestora ~ '^\d{1,6}$')
        AND (obn_gestao IS NULL OR obn_gestao ~ '^\d{1,5}$'));
  END IF;
END $$;

COMMENT ON COLUMN public.contas_autarquia.obn_codigo_cliente IS
  'Código do cliente no BB usado no header da remessa OBN600 (posições 059-067). Vazio = a conta não gera OBN600.';
COMMENT ON COLUMN public.contas_autarquia.obn_unidade_gestora IS
  'Unidade gestora emitente das ordens bancárias (OBN600, posições 007-012).';
COMMENT ON COLUMN public.contas_autarquia.obn_gestao IS
  'Gestão das ordens bancárias (OBN600, posições 013-017).';


-- ----------------------------------------------------------------------------
-- 2. fin_remessas_bancarias: layout OBN600
-- ----------------------------------------------------------------------------
ALTER TABLE public.fin_remessas_bancarias
  ADD COLUMN IF NOT EXISTS pagamentos uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS parametros jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.fin_remessas_bancarias DROP CONSTRAINT IF EXISTS fin_remessas_bancarias_layout_check;
ALTER TABLE public.fin_remessas_bancarias
  ADD CONSTRAINT fin_remessas_bancarias_layout_check CHECK (layout IN ('gestao_max_cnab240', 'obn600'));

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                  WHERE conname = 'fin_remessas_bancarias_parametros_check'
                    AND conrelid = 'public.fin_remessas_bancarias'::regclass) THEN
    ALTER TABLE public.fin_remessas_bancarias
      ADD CONSTRAINT fin_remessas_bancarias_parametros_check CHECK (jsonb_typeof(parametros) = 'object');
  END IF;
END $$;

COMMENT ON TABLE public.fin_remessas_bancarias IS
  'Arquivos de remessa gerados pelo sistema: reenvio de recusados (CNAB240 do BB Gestão MAX) e ordens bancárias dos pagamentos (OBN600). Retrato montado pelas RPCs registrar_remessa_bancaria/registrar_remessa_obn600, hash gravado por confirmar_remessa_bancaria. arquivo_sha256 nulo = reserva não confirmada (cancelável). Escrita só pelas RPCs.';
COMMENT ON COLUMN public.fin_remessas_bancarias.pagamentos IS
  'OBN600: fin_pagamentos da remessa (mesma ordem de creditos).';
COMMENT ON COLUMN public.fin_remessas_bancarias.parametros IS
  'OBN600: {unidade_gestora, gestao} copiados da conta pagadora no momento da remessa.';
COMMENT ON COLUMN public.fin_remessas_bancarias.creditos IS
  'Retrato do arquivo. Gestão MAX: [{movimento_id, pagamento_id, nome, documento, banco, agencia, agencia_dv, conta, conta_dv, valor, seu_numero}]. OBN600: [{pagamento_id, pagamento_numero, relacao, numero_ob, nome, documento, banco, agencia, agencia_dv, conta, conta_dv, valor, endereco, municipio, cep, uf}]. Montado pelo servidor.';
COMMENT ON COLUMN public.fin_remessas_bancarias.convenio IS
  'Gestão MAX: convênio de pagamento. OBN600: código do cliente no BB. Cópia de contas_autarquia no momento da remessa.';


-- ----------------------------------------------------------------------------
-- 3. fin_pagamentos: remessa OBN600
-- ----------------------------------------------------------------------------
ALTER TABLE public.fin_pagamentos ADD COLUMN IF NOT EXISTS remessa_bancaria_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                  WHERE conname = 'fin_pagamentos_remessa_bancaria_id_fkey'
                    AND conrelid = 'public.fin_pagamentos'::regclass) THEN
    ALTER TABLE public.fin_pagamentos
      ADD CONSTRAINT fin_pagamentos_remessa_bancaria_id_fkey
      FOREIGN KEY (remessa_bancaria_id) REFERENCES public.fin_remessas_bancarias(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_fin_pagamentos_remessa_bancaria ON public.fin_pagamentos (remessa_bancaria_id);

COMMENT ON COLUMN public.fin_pagamentos.remessa_bancaria_id IS
  'Remessa OBN600 (fin_remessas_bancarias) em que o pagamento saiu ou está reservado (reserva = remessa sem arquivo_sha256). Gravado só pelas RPCs de remessa.';


-- ----------------------------------------------------------------------------
-- 4. fin_remessa_bancaria_json (versão final: layout, parametros e pagamentos)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fin_remessa_bancaria_json(p_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', r.id, 'layout', r.layout, 'nsa', r.nsa, 'convenio', r.convenio,
    'agencia', r.agencia, 'agencia_digito', r.agencia_digito, 'conta', r.conta, 'conta_digito', r.conta_digito,
    'data_geracao', r.data_geracao, 'data_pagamento', r.data_pagamento, 'tipo_servico', r.tipo_servico,
    'parametros', r.parametros, 'creditos', r.creditos,
    'arquivo_sha256', r.arquivo_sha256)
    FROM public.fin_remessas_bancarias r
   WHERE r.id = p_id;
$$;

COMMENT ON FUNCTION public.fin_remessa_bancaria_json(uuid) IS
  'Uso interno das RPCs de remessa (reenvio Gestão MAX e OBN600): remessa no formato devolvido à tela. Fora da API.';

REVOKE ALL ON FUNCTION public.fin_remessa_bancaria_json(uuid) FROM PUBLIC, anon, authenticated;


-- ----------------------------------------------------------------------------
-- 5. registrar_remessa_obn600
-- ----------------------------------------------------------------------------
-- p_pagamentos: ids dos pagamentos (1 a 999, sem repetição). As OBs saem ordenadas por tipo (31, depois 32) e
-- pela ordem pedida.
-- p_data_pagamento: data das OBs (de ontem a 60 dias à frente; ontem tolera o fuso do servidor).
-- Devolve o formato de fin_remessa_bancaria_json sem o hash.
CREATE OR REPLACE FUNCTION public.registrar_remessa_obn600(
  p_conta_autarquia_id uuid,
  p_pagamentos uuid[],
  p_data_pagamento date,
  p_sequencial_minimo integer DEFAULT NULL
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
  v_reuso uuid;
  v_outras boolean;
  v_pags uuid[] := COALESCE(p_pagamentos, '{}');
  v_seq integer;
  v_id uuid;
  v_ordens jsonb := '[]'::jsonb;
  v_ordem_pags uuid[] := '{}';
  v_total numeric(15,2) := 0;
  r record;
  v_banco text; v_ag text; v_ag_dv text; v_ct text; v_ct_dv text;
  v_partes text[];
  v_doc text;
  v_num text;
  v_tipo text;
  v_endereco text;
BEGIN
  IF v_uid IS NULL
     OR NOT COALESCE(public.perfil_ativo_atual()
                     AND public.can_access_module(v_uid, 'financeiro')
                     AND public.has_permission_code(v_uid, 'pagamento.conciliar'), false) THEN
    RAISE EXCEPTION 'Sem permissão para gerar remessa bancária (pagamento.conciliar).' USING ERRCODE = '42501';
  END IF;

  IF p_data_pagamento IS NULL OR p_data_pagamento < CURRENT_DATE - 1 OR p_data_pagamento > CURRENT_DATE + 60 THEN
    RAISE EXCEPTION 'Data do pagamento inválida (de hoje a 60 dias à frente).' USING ERRCODE = '22023';
  END IF;
  IF p_sequencial_minimo IS NOT NULL AND p_sequencial_minimo NOT BETWEEN 1 AND 99999 THEN
    RAISE EXCEPTION 'Nº inicial da remessa inválido (1 a 99999).' USING ERRCODE = '22023';
  END IF;
  IF cardinality(v_pags) NOT BETWEEN 1 AND 999
     OR array_position(v_pags, NULL) IS NOT NULL
     OR cardinality(v_pags) <> (SELECT count(DISTINCT p) FROM unnest(v_pags) p) THEN
    RAISE EXCEPTION 'Informe de 1 a 999 pagamentos, sem repetição.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_conta FROM public.contas_autarquia WHERE id = p_conta_autarquia_id AND COALESCE(ativo, true);
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conta pagadora não encontrada ou inativa.' USING ERRCODE = 'P0002';
  END IF;
  IF COALESCE(v_conta.obn_codigo_cliente, '') !~ '^\d{1,9}$'
     OR COALESCE(v_conta.obn_unidade_gestora, '') !~ '^\d{1,6}$'
     OR COALESCE(v_conta.obn_gestao, '') !~ '^\d{1,5}$' THEN
    RAISE EXCEPTION 'A conta pagadora não tem código do cliente, UG e gestão do OBN600 cadastrados.' USING ERRCODE = '22023';
  END IF;
  IF COALESCE(btrim(v_conta.agencia), '') !~ '^\d{1,4}$' OR COALESCE(btrim(v_conta.conta), '') !~ '^\d{1,9}$' THEN
    RAISE EXCEPTION 'A conta pagadora precisa de agência (até 4 dígitos) e conta (até 9 dígitos).' USING ERRCODE = '22023';
  END IF;

  -- Um número de remessa por vez para a mesma conta.
  PERFORM pg_advisory_xact_lock(hashtext('registrar_remessa_bancaria'), hashtext(p_conta_autarquia_id::text || '|obn600'));

  SELECT * INTO v_ultima FROM public.fin_remessas_bancarias
   WHERE conta_autarquia_id = p_conta_autarquia_id AND layout = 'obn600'
   ORDER BY nsa DESC LIMIT 1;
  IF FOUND AND v_ultima.arquivo_sha256 IS NULL AND v_ultima.created_by = v_uid THEN
    -- Nova tentativa do mesmo usuário: reaproveita a reserva não confirmada (número e linha).
    v_reuso := v_ultima.id;
  END IF;
  v_outras := EXISTS (SELECT 1 FROM public.fin_remessas_bancarias
                       WHERE conta_autarquia_id = p_conta_autarquia_id AND layout = 'obn600'
                         AND id IS DISTINCT FROM v_reuso);

  IF NOT v_outras AND p_sequencial_minimo IS NOT NULL THEN
    v_seq := p_sequencial_minimo;
  ELSIF v_reuso IS NOT NULL THEN
    v_seq := v_ultima.nsa;
  ELSE
    v_seq := COALESCE(v_ultima.nsa, 0) + 1;
  END IF;
  IF v_seq > 99999 THEN
    RAISE EXCEPTION 'Numeração de remessa OBN600 esgotada para esta conta.' USING ERRCODE = '22023';
  END IF;

  -- Trava os pagamentos (ordem fixa evita deadlock).
  PERFORM 1 FROM public.fin_pagamentos WHERE id = ANY (v_pags) ORDER BY id FOR UPDATE;

  FOR r IN
    SELECT x.ord, p.*, f.cpf_cnpj AS f_doc, f.razao_social AS f_nome, f.banco_codigo AS f_banco,
           f.agencia AS f_agencia, f.conta AS f_conta, f.endereco_logradouro, f.endereco_numero,
           f.endereco_bairro, f.endereco_cidade, f.endereco_uf, f.endereco_cep,
           rem.arquivo_sha256 AS rem_sha, rem.created_by AS rem_autor, rem.nsa AS rem_nsa
      FROM unnest(v_pags) WITH ORDINALITY AS x(id, ord)
      LEFT JOIN public.fin_pagamentos p ON p.id = x.id
      LEFT JOIN public.fornecedores f ON f.id = p.fornecedor_id
      LEFT JOIN public.fin_remessas_bancarias rem ON rem.id = p.remessa_bancaria_id
     ORDER BY x.ord
  LOOP
    IF r.numero IS NULL THEN
      RAISE EXCEPTION 'Pagamento % não encontrado.', r.ord USING ERRCODE = 'P0002';
    END IF;
    IF COALESCE(r.status::text, '') NOT IN ('programado', 'autorizado') OR COALESCE(r.estornado, false) THEN
      RAISE EXCEPTION 'Pagamento % não está programado nem autorizado.', r.numero USING ERRCODE = '22023';
    END IF;
    IF r.remessa_bancaria_id IS NOT NULL AND r.remessa_bancaria_id IS DISTINCT FROM v_reuso THEN
      IF r.rem_sha IS NOT NULL THEN
        RAISE EXCEPTION 'Pagamento % já saiu na remessa OBN600 nº %.', r.numero, r.rem_nsa USING ERRCODE = '22023';
      END IF;
      RAISE EXCEPTION 'Pagamento % está reservado em outra remessa ainda não confirmada (nº %).', r.numero, r.rem_nsa
        USING ERRCODE = '22023';
    END IF;
    IF r.valor_liquido IS NULL OR r.valor_liquido <= 0 THEN
      RAISE EXCEPTION 'Pagamento % sem valor líquido.', r.numero USING ERRCODE = '22023';
    END IF;
    IF r.numero !~ '^OP-\d{1,7}$' OR r.exercicio NOT BETWEEN 2000 AND 2999 THEN
      RAISE EXCEPTION 'Pagamento % fora da numeração OP-nnnnnn: não dá para montar o nº da OB.', r.numero USING ERRCODE = '22023';
    END IF;

    v_doc := regexp_replace(COALESCE(r.f_doc, ''), '\D', '', 'g');
    IF length(v_doc) NOT IN (11, 14) OR NULLIF(btrim(COALESCE(r.f_nome, '')), '') IS NULL THEN
      RAISE EXCEPTION 'Pagamento % sem favorecido com CPF/CNPJ e nome.', r.numero USING ERRCODE = '22023';
    END IF;

    -- Conta do pagamento; vazia, a do cadastro do fornecedor. Agência "1234" ou "1234-5"; conta "1111" ou "1111-X".
    IF NULLIF(btrim(COALESCE(r.conta_favorecido, '')), '') IS NOT NULL THEN
      v_banco := r.banco_favorecido; v_ag := r.agencia_favorecido; v_ct := r.conta_favorecido;
    ELSE
      v_banco := r.f_banco; v_ag := r.f_agencia; v_ct := r.f_conta;
    END IF;
    v_banco := lpad(regexp_replace(COALESCE(v_banco, ''), '\D', '', 'g'), 3, '0');
    v_partes := regexp_match(regexp_replace(COALESCE(v_ag, ''), '[\s.]', '', 'g'), '^(\d{1,4})(?:-([0-9Xx]))?$');
    v_ag := v_partes[1]; v_ag_dv := upper(COALESCE(v_partes[2], ''));
    v_partes := regexp_match(regexp_replace(COALESCE(v_ct, ''), '[\s.]', '', 'g'), '^(\d{1,9})(?:-([0-9Xx]))?$');
    v_ct := v_partes[1]; v_ct_dv := upper(COALESCE(v_partes[2], ''));
    IF v_banco !~ '^\d{3}$' OR v_banco = '000' OR v_ag IS NULL OR v_ct IS NULL OR v_ct ~ '^0+$' THEN
      RAISE EXCEPTION 'Pagamento % sem banco, agência (até 4 dígitos) e conta (até 9 dígitos, DV depois do hífen) válidos.', r.numero
        USING ERRCODE = '22023';
    END IF;

    v_tipo := CASE WHEN v_banco = '001' THEN '32' ELSE '31' END;
    v_num := lpad(r.exercicio::text || lpad(substring(r.numero FROM 4), 6, '0'), 11, '0');
    v_endereco := concat_ws(' - ',
      NULLIF(concat_ws(', ', NULLIF(btrim(COALESCE(r.endereco_logradouro, '')), ''),
                             NULLIF(btrim(COALESCE(r.endereco_numero, '')), '')), ''),
      NULLIF(btrim(COALESCE(r.endereco_bairro, '')), ''));

    v_ordens := v_ordens || jsonb_build_array(jsonb_build_object(
      'tipo', v_tipo, 'ord', r.ord,
      'pagamento_id', r.id, 'pagamento_numero', r.numero,
      'relacao', lpad(r.exercicio::text || lpad(v_seq::text, 5, '0') || v_tipo, 11, '0'),
      'numero_ob', v_num,
      'nome', btrim(r.f_nome), 'documento', v_doc,
      'banco', v_banco, 'agencia', v_ag, 'agencia_dv', v_ag_dv, 'conta', v_ct, 'conta_dv', v_ct_dv,
      'valor', r.valor_liquido,
      'endereco', COALESCE(v_endereco, ''), 'municipio', btrim(COALESCE(r.endereco_cidade, '')),
      'cep', regexp_replace(COALESCE(r.endereco_cep, ''), '\D', '', 'g'),
      'uf', upper(btrim(COALESCE(r.endereco_uf, '')))));
    v_total := v_total + r.valor_liquido;
  END LOOP;

  IF v_total >= 1e13 THEN
    RAISE EXCEPTION 'Valor total inválido.' USING ERRCODE = '22023';
  END IF;

  -- Ordem do arquivo: por tipo de OB (uma relação por tipo) e, dentro dele, a ordem pedida.
  SELECT jsonb_agg(o - 'tipo' - 'ord' ORDER BY o->>'tipo', (o->>'ord')::int),
         array_agg((o->>'pagamento_id')::uuid ORDER BY o->>'tipo', (o->>'ord')::int)
    INTO v_ordens, v_ordem_pags
    FROM jsonb_array_elements(v_ordens) AS e(o);

  IF v_reuso IS NOT NULL THEN
    UPDATE public.fin_pagamentos
       SET remessa_bancaria_id = NULL, updated_at = now()
     WHERE remessa_bancaria_id = v_reuso AND NOT (id = ANY (v_pags));
    UPDATE public.fin_remessas_bancarias
       SET nsa = v_seq, convenio = v_conta.obn_codigo_cliente,
           agencia = btrim(v_conta.agencia), agencia_digito = NULLIF(btrim(COALESCE(v_conta.agencia_digito, '')), ''),
           conta = btrim(v_conta.conta), conta_digito = NULLIF(btrim(COALESCE(v_conta.conta_digito, '')), ''),
           data_geracao = now(), data_pagamento = p_data_pagamento,
           quantidade = cardinality(v_pags), valor_total = v_total, creditos = v_ordens, pagamentos = v_ordem_pags,
           parametros = jsonb_build_object('unidade_gestora', v_conta.obn_unidade_gestora, 'gestao', v_conta.obn_gestao)
     WHERE id = v_reuso
     RETURNING id INTO v_id;
  ELSE
    INSERT INTO public.fin_remessas_bancarias
      (layout, conta_autarquia_id, convenio, agencia, agencia_digito, conta, conta_digito, nsa,
       data_pagamento, quantidade, valor_total, creditos, pagamentos, parametros, created_by)
    VALUES
      ('obn600', p_conta_autarquia_id, v_conta.obn_codigo_cliente,
       btrim(v_conta.agencia), NULLIF(btrim(COALESCE(v_conta.agencia_digito, '')), ''),
       btrim(v_conta.conta), NULLIF(btrim(COALESCE(v_conta.conta_digito, '')), ''), v_seq,
       p_data_pagamento, cardinality(v_pags), v_total, v_ordens, v_ordem_pags,
       jsonb_build_object('unidade_gestora', v_conta.obn_unidade_gestora, 'gestao', v_conta.obn_gestao), v_uid)
    RETURNING id INTO v_id;
  END IF;

  -- Reserva: os pagamentos passam a apontar para esta remessa (o nº da OB só é gravado na confirmação).
  UPDATE public.fin_pagamentos
     SET remessa_bancaria_id = v_id, updated_at = now()
   WHERE id = ANY (v_pags) AND remessa_bancaria_id IS DISTINCT FROM v_id;

  RETURN public.fin_remessa_bancaria_json(v_id) - 'arquivo_sha256';
END;
$$;

COMMENT ON FUNCTION public.registrar_remessa_obn600(uuid, uuid[], date, integer) IS
  'Monta no servidor as ordens bancárias (OBN600) dos pagamentos escolhidos, numera relação e OB, reserva o nº da remessa e os pagamentos e devolve conta pagadora e OBs. Exige pagamento.conciliar.';

REVOKE ALL ON FUNCTION public.registrar_remessa_obn600(uuid, uuid[], date, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_remessa_obn600(uuid, uuid[], date, integer) TO authenticated;


-- ----------------------------------------------------------------------------
-- 6. confirmar_remessa_bancaria (versão final: também OBN600)
-- ----------------------------------------------------------------------------
-- Só o autor da reserva confirma. Idempotente com o mesmo hash; hash diferente numa remessa já confirmada é
-- recusado. Gestão MAX: falha se algum movimento saiu da reserva (ou deixou de estar recusado) e marca os
-- movimentos como reenviados. OBN600: falha se algum pagamento saiu da reserva (ou deixou de estar programado/
-- autorizado) e grava o nº da OB em identificador_transacao.
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
      RAISE EXCEPTION 'A remessa nº % já foi confirmada com outro arquivo.', v_rem.nsa USING ERRCODE = '22023';
    END IF;
    RETURN jsonb_build_object('id', v_rem.id, 'nsa', v_rem.nsa, 'arquivo_sha256', v_rem.arquivo_sha256,
                              'movimentos_marcados', 0, 'pagamentos_marcados', 0, 'ja_confirmada', true);
  END IF;
  IF v_rem.created_by IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'Só quem gerou a remessa nº % confirma o arquivo.', v_rem.nsa USING ERRCODE = '42501';
  END IF;

  IF v_rem.layout = 'obn600' THEN
    PERFORM 1 FROM public.fin_pagamentos WHERE id = ANY (v_rem.pagamentos) ORDER BY id FOR UPDATE;
    SELECT count(*) INTO v_ok
      FROM public.fin_pagamentos
     WHERE id = ANY (v_rem.pagamentos) AND remessa_bancaria_id = p_id
       AND COALESCE(status::text, '') IN ('programado', 'autorizado') AND NOT COALESCE(estornado, false);
    IF v_ok <> cardinality(v_rem.pagamentos) THEN
      RAISE EXCEPTION '% pagamento(s) da remessa nº % não estão mais reservados para ela (ou mudaram de situação): gere de novo.',
        cardinality(v_rem.pagamentos) - v_ok, v_rem.nsa USING ERRCODE = '22023';
    END IF;

    UPDATE public.fin_remessas_bancarias SET arquivo_sha256 = p_sha256 WHERE id = p_id;

    -- O nº da OB é o que volta no retorno: importar_arquivo_bancario casa a OB com o pagamento por ele.
    UPDATE public.fin_pagamentos p
       SET identificador_transacao = o.ob->>'numero_ob', updated_at = now()
      FROM jsonb_array_elements(v_rem.creditos) AS o(ob)
     WHERE p.id = (o.ob->>'pagamento_id')::uuid AND p.remessa_bancaria_id = p_id;
    GET DIAGNOSTICS v_marcados = ROW_COUNT;

    RETURN jsonb_build_object('id', v_rem.id, 'nsa', v_rem.nsa, 'arquivo_sha256', p_sha256,
                              'movimentos_marcados', 0, 'pagamentos_marcados', v_marcados, 'ja_confirmada', false);
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
                            'movimentos_marcados', v_marcados, 'pagamentos_marcados', 0, 'ja_confirmada', false);
END;
$$;

COMMENT ON FUNCTION public.confirmar_remessa_bancaria(uuid, text) IS
  'Grava o SHA-256 do arquivo gerado. Reenvio Gestão MAX: marca os movimentos reservados como reenviados. OBN600: grava o nº da OB nos pagamentos reservados. Falha se algum saiu da reserva. Só o autor da reserva. Exige pagamento.conciliar.';

REVOKE ALL ON FUNCTION public.confirmar_remessa_bancaria(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirmar_remessa_bancaria(uuid, text) TO authenticated;


-- ----------------------------------------------------------------------------
-- 7. cancelar_remessa_bancaria (versão final: também libera pagamentos da OBN600)
-- ----------------------------------------------------------------------------
-- Só reserva NÃO confirmada (nenhum arquivo saiu do sistema), pelo autor ou por um administrador. Apaga a
-- reserva (a trilha fin_audit_log guarda a linha) e libera os movimentos e os pagamentos. Se era a última
-- remessa da conta, o número volta a ficar livre; se não, fica pulado.
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
  v_pags_liberados integer := 0;
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
    RAISE EXCEPTION 'A remessa nº % já foi confirmada (arquivo gerado): não pode ser cancelada.', v_rem.nsa
      USING ERRCODE = '22023';
  END IF;
  IF v_rem.created_by IS DISTINCT FROM v_uid AND NOT COALESCE(public.is_admin_user(v_uid), false) THEN
    RAISE EXCEPTION 'Só quem reservou a remessa nº % (ou um administrador) cancela.', v_rem.nsa USING ERRCODE = '42501';
  END IF;

  UPDATE public.fin_movimentos_bancarios
     SET remessa_id = NULL, updated_at = now()
   WHERE remessa_id = p_id AND reenviado_em IS NULL;
  GET DIAGNOSTICS v_liberados = ROW_COUNT;

  UPDATE public.fin_pagamentos
     SET remessa_bancaria_id = NULL, updated_at = now()
   WHERE remessa_bancaria_id = p_id;
  GET DIAGNOSTICS v_pags_liberados = ROW_COUNT;

  DELETE FROM public.fin_remessas_bancarias WHERE id = p_id;

  RETURN jsonb_build_object('id', p_id, 'nsa', v_rem.nsa, 'movimentos_liberados', v_liberados,
                            'pagamentos_liberados', v_pags_liberados);
END;
$$;

COMMENT ON FUNCTION public.cancelar_remessa_bancaria(uuid) IS
  'Cancela (apaga) uma reserva de remessa não confirmada (reenvio Gestão MAX ou OBN600) e libera os movimentos e pagamentos. Autor da reserva ou administrador; exige pagamento.conciliar.';

REVOKE ALL ON FUNCTION public.cancelar_remessa_bancaria(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancelar_remessa_bancaria(uuid) TO authenticated;
