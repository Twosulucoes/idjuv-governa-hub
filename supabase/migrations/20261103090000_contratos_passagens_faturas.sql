-- ============================================================================
-- CONTRATOS — Passagens aéreas, entrega 3: faturas da agência, bilhetes pagos e saldo do contrato × empenho
-- ============================================================================
-- Spec: docs/superpowers/specs/2026-10-24-contratos-passagens-aereas-design.md (§5 e §7, itens 4 e 6)
-- Plano: docs/superpowers/plans/2026-10-25-contratos-passagens-entrega3.md
--
--   passagem_faturas            nota fiscal da agência: nº, emissão, valor, processo SEI do pagamento e a situação
--                               recebida → atestada → liquidada → paga (com a OB) ou cancelada. O FIPLAN é o oficial;
--                               aqui fica o que a nota cobre.
--   passagem_fatura_itens       bilhetes (trechos emitidos) cobertos pela nota; cada trecho entra numa nota só.
--   passagem_contrato_empenhos  empenhos ligados ao contrato da agência (o FIP 614 não traz o contrato).
--   passagem_empenhos_contrato / passagem_empenhos_candidatos
--                               leitura estreita do Financeiro: só nº, exercício e totais dos empenhos ligados (ou
--                               candidatos, para quem tem o financeiro das passagens). fin_empenhos continua fechado.
--
-- Leitura: módulo contratos E contratos.passagens.visualizar, editar ou financeiro; escrita: contratos.passagens.financeiro.
-- Situação só anda pelo fluxo (um passo à frente ou atrás; cancela antes de paga). Fatura paga não muda de nº, data,
-- valor, OB nem bilhetes; só fatura recebida se apaga; fatura cancelada solta os bilhetes (ficam na trilha).
-- passagem_salvar_fatura grava a nota e os bilhetes numa transação (SECURITY INVOKER: vale a RLS de quem chama).
-- Permissão nova concedida a quem já tem contratos.criar.
-- Idempotente (IF NOT EXISTS, ON CONFLICT, CREATE OR REPLACE, DROP/CREATE de policies e gatilhos).
-- ============================================================================

SET lock_timeout = '10s';

-- ----------------------------------------------------------------------------
-- 1. Tabelas
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.passagem_faturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id uuid NOT NULL REFERENCES public.contratos(id),
  numero text NOT NULL CHECK (char_length(btrim(numero)) BETWEEN 1 AND 40),
  data_emissao date NOT NULL,
  valor numeric(12,2) NOT NULL CHECK (valor > 0),
  processo_sei_pagamento text CHECK (char_length(processo_sei_pagamento) <= 60),
  situacao text NOT NULL DEFAULT 'recebida' CHECK (situacao IN ('recebida', 'atestada', 'liquidada', 'paga', 'cancelada')),
  atesto_data date,
  atesto_documento_sei text CHECK (char_length(atesto_documento_sei) <= 60),
  liquidacao_data date,
  pagamento_data date,
  ob_numero text CHECK (char_length(ob_numero) <= 40),
  cancelamento_motivo text CHECK (char_length(cancelamento_motivo) <= 1000),
  observacoes text CHECK (char_length(observacoes) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  CONSTRAINT passagem_faturas_numero_key UNIQUE (contrato_id, numero),
  CONSTRAINT passagem_faturas_atesto_check CHECK (
    situacao NOT IN ('atestada', 'liquidada', 'paga')
    OR (atesto_data IS NOT NULL AND char_length(btrim(coalesce(atesto_documento_sei, ''))) >= 1)
  ),
  CONSTRAINT passagem_faturas_liquidacao_check CHECK (situacao NOT IN ('liquidada', 'paga') OR liquidacao_data IS NOT NULL),
  CONSTRAINT passagem_faturas_pagamento_check CHECK (
    situacao <> 'paga' OR (pagamento_data IS NOT NULL AND char_length(btrim(coalesce(ob_numero, ''))) >= 1)
  ),
  CONSTRAINT passagem_faturas_cancelamento_check CHECK (
    situacao <> 'cancelada' OR char_length(btrim(coalesce(cancelamento_motivo, ''))) >= 3
  )
);
CREATE INDEX IF NOT EXISTS idx_passagem_faturas_contrato ON public.passagem_faturas (contrato_id, data_emissao DESC);
COMMENT ON TABLE public.passagem_faturas IS
  'Notas fiscais da agência de passagens e a situação até paga (com a OB). O FIPLAN é o oficial; aqui fica quais bilhetes cada nota cobre. Paga não se apaga; cancelada solta os bilhetes.';

CREATE TABLE IF NOT EXISTS public.passagem_fatura_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fatura_id uuid NOT NULL REFERENCES public.passagem_faturas(id) ON DELETE CASCADE,
  trecho_id uuid NOT NULL REFERENCES public.passagem_trechos(id),
  valor numeric(12,2) NOT NULL CHECK (valor >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  CONSTRAINT passagem_fatura_itens_trecho_key UNIQUE (trecho_id)
);
CREATE INDEX IF NOT EXISTS idx_passagem_fatura_itens_fatura ON public.passagem_fatura_itens (fatura_id);
COMMENT ON TABLE public.passagem_fatura_itens IS
  'Bilhetes (trechos com localizador) cobertos por cada nota da agência; cada trecho entra numa nota só. O valor vem do bilhete e pode ser ajustado.';

CREATE TABLE IF NOT EXISTS public.passagem_contrato_empenhos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id uuid NOT NULL REFERENCES public.contratos(id),
  empenho_id uuid NOT NULL REFERENCES public.fin_empenhos(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  CONSTRAINT passagem_contrato_empenhos_key UNIQUE (contrato_id, empenho_id)
);
CREATE INDEX IF NOT EXISTS idx_passagem_contrato_empenhos_empenho ON public.passagem_contrato_empenhos (empenho_id);
COMMENT ON TABLE public.passagem_contrato_empenhos IS
  'Empenhos ligados ao contrato da agência de passagens (o FIP 614 não traz o contrato). O saldo chega por passagem_empenhos_contrato.';

ALTER TABLE public.passagem_faturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passagem_fatura_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passagem_contrato_empenhos ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 2. Regras: contrato da agência, bilhete emitido do mesmo contrato, fatura paga travada
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_passagem_faturas_carimbar ON public.passagem_faturas;
CREATE TRIGGER trg_passagem_faturas_carimbar BEFORE INSERT OR UPDATE ON public.passagem_faturas
  FOR EACH ROW EXECUTE FUNCTION public.passagem_carimbar();
DROP TRIGGER IF EXISTS trg_passagem_fatura_itens_carimbar ON public.passagem_fatura_itens;
CREATE TRIGGER trg_passagem_fatura_itens_carimbar BEFORE INSERT OR UPDATE ON public.passagem_fatura_itens
  FOR EACH ROW EXECUTE FUNCTION public.passagem_carimbar();
DROP TRIGGER IF EXISTS trg_passagem_contrato_empenhos_carimbar ON public.passagem_contrato_empenhos;
CREATE TRIGGER trg_passagem_contrato_empenhos_carimbar BEFORE INSERT OR UPDATE ON public.passagem_contrato_empenhos
  FOR EACH ROW EXECUTE FUNCTION public.passagem_carimbar();

-- Fatura e ligação de empenho só em contrato da agência; o contrato da fatura não muda; paga e cancelada travadas.
-- SECURITY DEFINER: quem tem o financeiro das passagens pode não ler contratos.
CREATE OR REPLACE FUNCTION public.passagem_conferir_fatura()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.situacao <> 'recebida' THEN
      RAISE EXCEPTION 'Só fatura recebida pode ser apagada: depois do atesto, cancele com o motivo.' USING ERRCODE = '42501';
    END IF;
    -- tira os bilhetes antes, para a trilha (passagem_registrar_fatura_item) ainda achar o nº da nota
    DELETE FROM public.passagem_fatura_itens WHERE fatura_id = OLD.id;
    RETURN OLD;
  END IF;

  IF TG_OP = 'INSERT' OR NEW.contrato_id IS DISTINCT FROM OLD.contrato_id THEN
    IF TG_OP = 'UPDATE' THEN
      RAISE EXCEPTION 'O contrato da fatura não muda: cancele e lance de novo.' USING ERRCODE = '22023';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.contratos c WHERE c.id = NEW.contrato_id AND c.controla_passagens) THEN
      RAISE EXCEPTION 'O contrato não é de passagens aéreas.' USING ERRCODE = '22023';
    END IF;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.situacao <> 'recebida' THEN
      RAISE EXCEPTION 'A fatura nasce recebida.' USING ERRCODE = '22023';
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.situacao = 'cancelada' THEN
    RAISE EXCEPTION 'Fatura cancelada não muda: lance uma nova.' USING ERRCODE = '22023';
  END IF;
  -- fluxo: um passo à frente ou atrás; cancela antes de paga (mesmo FLUXO de src/lib/passagens/faturas.ts)
  IF NEW.situacao IS DISTINCT FROM OLD.situacao AND NOT (OLD.situacao, NEW.situacao) IN (
       ('recebida', 'atestada'), ('recebida', 'cancelada'),
       ('atestada', 'liquidada'), ('atestada', 'recebida'), ('atestada', 'cancelada'),
       ('liquidada', 'paga'), ('liquidada', 'atestada'), ('liquidada', 'cancelada'),
       ('paga', 'liquidada')) THEN
    RAISE EXCEPTION 'A fatura não vai de % para % (anda um passo por vez; paga só volta para liquidada).', OLD.situacao, NEW.situacao
      USING ERRCODE = '22023';
  END IF;
  -- paga: nº, data e valor não mudam nem no estorno; a OB e a data do pagamento só mudam voltando para liquidada
  IF OLD.situacao = 'paga'
     AND ((NEW.numero, NEW.data_emissao, NEW.valor) IS DISTINCT FROM (OLD.numero, OLD.data_emissao, OLD.valor)
          OR (NEW.situacao = 'paga' AND (NEW.ob_numero, NEW.pagamento_data) IS DISTINCT FROM (OLD.ob_numero, OLD.pagamento_data))) THEN
    RAISE EXCEPTION 'Fatura paga não muda de nº, data, valor nem OB: volte para liquidada antes.' USING ERRCODE = '22023';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.passagem_conferir_fatura() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_passagem_faturas_conferir ON public.passagem_faturas;
CREATE TRIGGER trg_passagem_faturas_conferir BEFORE INSERT OR UPDATE OR DELETE ON public.passagem_faturas
  FOR EACH ROW EXECUTE FUNCTION public.passagem_conferir_fatura();

-- Empenho que pode ser ligado ao contrato da agência: elemento 33 (passagens e locomoção) ou já apontando para o
-- contrato. Mesma regra da lista de candidatos (passagem_empenhos_candidatos).
CREATE OR REPLACE FUNCTION public.passagem_empenho_candidato(_contrato_id uuid, _empenho_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.fin_empenhos e
      LEFT JOIN public.fin_naturezas_despesa nd ON nd.id = e.natureza_despesa_id
     WHERE e.id = _empenho_id
       AND (e.contrato_id = _contrato_id
            OR nd.elemento = '33'
            OR substr(regexp_replace(COALESCE(nd.codigo, ''), '[^0-9]', '', 'g'), 5, 2) = '33'));
$$;
REVOKE EXECUTE ON FUNCTION public.passagem_empenho_candidato(uuid, uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.passagem_conferir_ligacao_empenho()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.contratos c WHERE c.id = NEW.contrato_id AND c.controla_passagens) THEN
    RAISE EXCEPTION 'O contrato não é de passagens aéreas.' USING ERRCODE = '22023';
  END IF;
  IF NOT public.passagem_empenho_candidato(NEW.contrato_id, NEW.empenho_id) THEN
    RAISE EXCEPTION 'Só se liga empenho de passagens (elemento 33) ou que já aponta para este contrato.' USING ERRCODE = '22023';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.passagem_conferir_ligacao_empenho() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_passagem_contrato_empenhos_conferir ON public.passagem_contrato_empenhos;
CREATE TRIGGER trg_passagem_contrato_empenhos_conferir BEFORE INSERT OR UPDATE OF contrato_id ON public.passagem_contrato_empenhos
  FOR EACH ROW EXECUTE FUNCTION public.passagem_conferir_ligacao_empenho();

-- Item: só bilhete emitido (com localizador) de pedido do mesmo contrato; fatura paga ou cancelada não recebe nem muda
-- item; de fatura paga não sai item.
CREATE OR REPLACE FUNCTION public.passagem_conferir_fatura_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_situacao text;
  v_contrato uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT f.situacao INTO v_situacao FROM public.passagem_faturas f WHERE f.id = OLD.fatura_id;
    IF v_situacao = 'paga' THEN
      RAISE EXCEPTION 'Fatura paga não muda de bilhetes.' USING ERRCODE = '22023';
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.fatura_id IS DISTINCT FROM OLD.fatura_id THEN
    RAISE EXCEPTION 'O bilhete não muda de fatura: tire de uma e ponha na outra.' USING ERRCODE = '22023';
  END IF;

  SELECT f.situacao, f.contrato_id INTO v_situacao, v_contrato FROM public.passagem_faturas f WHERE f.id = NEW.fatura_id;
  IF v_situacao IN ('paga', 'cancelada') THEN
    RAISE EXCEPTION 'Fatura % não muda de bilhetes.', CASE v_situacao WHEN 'paga' THEN 'paga' ELSE 'cancelada' END
      USING ERRCODE = '22023';
  END IF;

  IF TG_OP = 'INSERT' OR NEW.trecho_id IS DISTINCT FROM OLD.trecho_id THEN
    IF NOT EXISTS (
      SELECT 1
        FROM public.passagem_trechos t
        JOIN public.passagem_passageiros pa ON pa.id = t.passageiro_id
        JOIN public.passagem_pedidos pe ON pe.id = pa.pedido_id
       WHERE t.id = NEW.trecho_id AND t.localizador IS NOT NULL AND pe.contrato_id = v_contrato) THEN
      RAISE EXCEPTION 'Só entra na fatura bilhete emitido (com localizador) de pedido deste contrato.' USING ERRCODE = '22023';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.passagem_conferir_fatura_item() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_passagem_fatura_itens_conferir ON public.passagem_fatura_itens;
CREATE TRIGGER trg_passagem_fatura_itens_conferir BEFORE INSERT OR UPDATE OR DELETE ON public.passagem_fatura_itens
  FOR EACH ROW EXECUTE FUNCTION public.passagem_conferir_fatura_item();

-- ----------------------------------------------------------------------------
-- 3. Trilha: a fatura entra no histórico de cada pedido que ela cobre
-- ----------------------------------------------------------------------------
ALTER TABLE public.passagem_historico DROP CONSTRAINT IF EXISTS passagem_historico_acao_check;
ALTER TABLE public.passagem_historico ADD CONSTRAINT passagem_historico_acao_check
  CHECK (acao IN ('pedido_criado', 'pedido_situacao', 'trecho_situacao', 'prestacao_pedido', 'prestacao_passageiro',
                  'anexo_incluido', 'anexo_removido', 'fatura_situacao', 'fatura_item'));

-- Bilhete que entra ou sai de uma fatura: um registro no pedido dele.
CREATE OR REPLACE FUNCTION public.passagem_registrar_fatura_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item public.passagem_fatura_itens;
  v_pedido uuid;
  v_fatura text;
BEGIN
  v_item := CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  IF TG_OP = 'UPDATE' AND NEW.valor IS NOT DISTINCT FROM OLD.valor THEN
    RETURN NEW;
  END IF;
  SELECT pa.pedido_id INTO v_pedido
    FROM public.passagem_trechos t JOIN public.passagem_passageiros pa ON pa.id = t.passageiro_id
   WHERE t.id = v_item.trecho_id;
  SELECT f.numero INTO v_fatura FROM public.passagem_faturas f WHERE f.id = v_item.fatura_id;
  IF v_pedido IS NOT NULL THEN
    INSERT INTO public.passagem_historico (pedido_id, trecho_id, acao, antes, depois, feito_por)
    VALUES (v_pedido, v_item.trecho_id, 'fatura_item',
            CASE WHEN TG_OP <> 'INSERT' THEN jsonb_build_object('fatura', v_fatura, 'valor', OLD.valor) END,
            CASE WHEN TG_OP <> 'DELETE' THEN jsonb_build_object('fatura', v_fatura, 'valor', NEW.valor) END,
            auth.uid());
  END IF;
  RETURN v_item;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.passagem_registrar_fatura_item() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_passagem_fatura_itens_historico ON public.passagem_fatura_itens;
CREATE TRIGGER trg_passagem_fatura_itens_historico AFTER INSERT OR UPDATE OR DELETE ON public.passagem_fatura_itens
  FOR EACH ROW EXECUTE FUNCTION public.passagem_registrar_fatura_item();

-- Mudança de situação da fatura: um registro em cada pedido coberto. Cancelada: solta os bilhetes depois de registrar.
CREATE OR REPLACE FUNCTION public.passagem_registrar_fatura()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.situacao IS NOT DISTINCT FROM OLD.situacao THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.passagem_historico (pedido_id, acao, antes, depois, feito_por)
  SELECT DISTINCT pa.pedido_id, 'fatura_situacao',
         jsonb_build_object('fatura', OLD.numero, 'situacao', OLD.situacao),
         jsonb_build_object('fatura', NEW.numero, 'situacao', NEW.situacao, 'atesto_data', NEW.atesto_data,
                            'atesto_documento_sei', NEW.atesto_documento_sei, 'liquidacao_data', NEW.liquidacao_data,
                            'pagamento_data', NEW.pagamento_data, 'ob_numero', NEW.ob_numero,
                            'cancelamento_motivo', NEW.cancelamento_motivo),
         auth.uid()
    FROM public.passagem_fatura_itens i
    JOIN public.passagem_trechos t ON t.id = i.trecho_id
    JOIN public.passagem_passageiros pa ON pa.id = t.passageiro_id
   WHERE i.fatura_id = NEW.id;
  IF NEW.situacao = 'cancelada' THEN
    DELETE FROM public.passagem_fatura_itens WHERE fatura_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.passagem_registrar_fatura() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_passagem_faturas_historico ON public.passagem_faturas;
CREATE TRIGGER trg_passagem_faturas_historico AFTER UPDATE ON public.passagem_faturas
  FOR EACH ROW EXECUTE FUNCTION public.passagem_registrar_fatura();

-- ----------------------------------------------------------------------------
-- 4. Permissão contratos.passagens.financeiro e concessão a quem tem contratos.criar
-- ----------------------------------------------------------------------------
INSERT INTO public.module_permissions_catalog (module_code, permission_code, label, category, action_type, sort_order)
VALUES ('contratos', 'contratos.passagens.financeiro', 'Faturas e empenhos das passagens aéreas', 'Passagens', 'gerenciar', 703)
ON CONFLICT (permission_code) DO NOTHING;

INSERT INTO public.role_permissions (role, permission)
SELECT DISTINCT rp.role, 'contratos.passagens.financeiro'
  FROM public.role_permissions rp
 WHERE rp.permission = 'contratos.criar'
ON CONFLICT (role, permission) DO NOTHING;

INSERT INTO public.user_permissions (user_id, permission, created_by)
SELECT up.user_id, 'contratos.passagens.financeiro', up.created_by
  FROM public.user_permissions up
 WHERE up.permission = 'contratos.criar'
ON CONFLICT (user_id, permission) DO NOTHING;

UPDATE public.user_modules
   SET permissions = permissions || ARRAY['contratos.passagens.financeiro']
 WHERE 'contratos.criar' = ANY (permissions)
   AND NOT ('contratos.passagens.financeiro' = ANY (permissions));

-- ----------------------------------------------------------------------------
-- 5. Leitura estreita do Financeiro (fin_empenhos continua só do módulo financeiro)
-- ----------------------------------------------------------------------------
-- Empenhos ligados ao contrato da agência: nº, exercício, natureza, credor e totais. Para quem lê passagens.
CREATE OR REPLACE FUNCTION public.passagem_empenhos_contrato(_contrato_id uuid)
RETURNS TABLE (
  empenho_id uuid,
  numero text,
  exercicio integer,
  data_empenho date,
  natureza text,
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
  IF NOT COALESCE(public.can_access_module(auth.uid(), 'contratos')
                  AND (public.has_permission_code(auth.uid(), 'contratos.passagens.visualizar')
                       OR public.has_permission_code(auth.uid(), 'contratos.passagens.editar')
                       OR public.has_permission_code(auth.uid(), 'contratos.passagens.financeiro')), false) THEN
    RAISE EXCEPTION 'Requer a permissão de ver passagens.' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.contratos c WHERE c.id = _contrato_id AND c.controla_passagens) THEN
    RAISE EXCEPTION 'O contrato não é de passagens aéreas.' USING ERRCODE = '22023';
  END IF;
  RETURN QUERY
  SELECT e.id, e.numero::text, e.exercicio, e.data_empenho, nd.codigo::text, e.credor_nome,
         e.valor_empenhado, COALESCE(e.valor_anulado, 0), COALESCE(e.valor_liquidado, 0), COALESCE(e.valor_pago, 0)
    FROM public.passagem_contrato_empenhos l
    JOIN public.fin_empenhos e ON e.id = l.empenho_id
    LEFT JOIN public.fin_naturezas_despesa nd ON nd.id = e.natureza_despesa_id
   WHERE l.contrato_id = _contrato_id
   ORDER BY e.exercicio DESC, e.data_empenho DESC, e.numero;
END;
$$;
REVOKE ALL ON FUNCTION public.passagem_empenhos_contrato(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.passagem_empenhos_contrato(uuid) TO authenticated;

-- Candidatos a ligar: empenhos do elemento 33 (passagens e locomoção), os que já apontam para o contrato e os já
-- ligados, do exercício pedido (sem exercício, o do ano corrente). Só para quem tem o financeiro das passagens e só
-- para contrato da agência.
CREATE OR REPLACE FUNCTION public.passagem_empenhos_candidatos(_contrato_id uuid, _exercicio integer DEFAULT NULL)
RETURNS TABLE (
  empenho_id uuid,
  numero text,
  exercicio integer,
  data_empenho date,
  natureza text,
  credor text,
  processo_sei text,
  valor_empenhado numeric,
  valor_anulado numeric,
  ligado boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT COALESCE(public.can_access_module(auth.uid(), 'contratos')
                  AND public.has_permission_code(auth.uid(), 'contratos.passagens.financeiro'), false) THEN
    RAISE EXCEPTION 'Requer a permissão de faturas e empenhos das passagens.' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.contratos c WHERE c.id = _contrato_id AND c.controla_passagens) THEN
    RAISE EXCEPTION 'O contrato não é de passagens aéreas.' USING ERRCODE = '22023';
  END IF;
  RETURN QUERY
  SELECT e.id, e.numero::text, e.exercicio, e.data_empenho, nd.codigo::text, e.credor_nome, e.processo_sei::text,
         e.valor_empenhado, COALESCE(e.valor_anulado, 0), (l.empenho_id IS NOT NULL)
    FROM public.fin_empenhos e
    LEFT JOIN public.fin_naturezas_despesa nd ON nd.id = e.natureza_despesa_id
    LEFT JOIN public.passagem_contrato_empenhos l ON l.empenho_id = e.id AND l.contrato_id = _contrato_id
   WHERE (e.exercicio = COALESCE(_exercicio, extract(year FROM current_date)::integer) OR l.empenho_id IS NOT NULL)
     AND (l.empenho_id IS NOT NULL OR public.passagem_empenho_candidato(_contrato_id, e.id))
   ORDER BY (l.empenho_id IS NOT NULL) DESC, e.exercicio DESC, e.data_empenho DESC, e.numero
   LIMIT 300;
END;
$$;
REVOKE ALL ON FUNCTION public.passagem_empenhos_candidatos(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.passagem_empenhos_candidatos(uuid, integer) TO authenticated;

-- ----------------------------------------------------------------------------
-- 6. Gravar a fatura e os bilhetes numa transação
-- ----------------------------------------------------------------------------
-- _fatura: {id (null = nova), contrato_id, numero, data_emissao, valor, processo_sei_pagamento, observacoes};
-- _itens: [{trecho_id, valor}]. Inclui os bilhetes novos, corrige o valor dos que ficaram e tira os que saíram; erro
-- em qualquer passo desfaz tudo. SECURITY INVOKER: a RLS (contratos.passagens.financeiro) e os gatilhos valem.
CREATE OR REPLACE FUNCTION public.passagem_salvar_fatura(_fatura jsonb, _itens jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_id uuid := NULLIF(_fatura->>'id', '')::uuid;
  v_trechos uuid[];
  n int;
BEGIN
  IF jsonb_typeof(_itens) IS DISTINCT FROM 'array' OR jsonb_array_length(_itens) = 0 THEN
    RAISE EXCEPTION 'Marque os bilhetes que a nota cobre.' USING ERRCODE = '22023';
  END IF;
  SELECT array_agg((i->>'trecho_id')::uuid) INTO v_trechos FROM jsonb_array_elements(_itens) i;

  IF v_id IS NULL THEN
    INSERT INTO public.passagem_faturas (contrato_id, numero, data_emissao, valor, processo_sei_pagamento, observacoes)
    VALUES ((_fatura->>'contrato_id')::uuid, btrim(_fatura->>'numero'), (_fatura->>'data_emissao')::date,
            (_fatura->>'valor')::numeric, NULLIF(btrim(_fatura->>'processo_sei_pagamento'), ''),
            NULLIF(btrim(_fatura->>'observacoes'), ''))
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.passagem_faturas
       SET numero = btrim(_fatura->>'numero'),
           data_emissao = (_fatura->>'data_emissao')::date,
           valor = (_fatura->>'valor')::numeric,
           processo_sei_pagamento = NULLIF(btrim(_fatura->>'processo_sei_pagamento'), ''),
           observacoes = NULLIF(btrim(_fatura->>'observacoes'), '')
     WHERE id = v_id;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n = 0 THEN
      RAISE EXCEPTION 'Fatura não encontrada ou sem permissão para alterar.' USING ERRCODE = '42501';
    END IF;
    DELETE FROM public.passagem_fatura_itens WHERE fatura_id = v_id AND NOT (trecho_id = ANY (v_trechos));
  END IF;

  UPDATE public.passagem_fatura_itens f
     SET valor = (i->>'valor')::numeric
    FROM jsonb_array_elements(_itens) i
   WHERE f.fatura_id = v_id AND f.trecho_id = (i->>'trecho_id')::uuid AND f.valor IS DISTINCT FROM (i->>'valor')::numeric;
  INSERT INTO public.passagem_fatura_itens (fatura_id, trecho_id, valor)
  SELECT v_id, (i->>'trecho_id')::uuid, (i->>'valor')::numeric
    FROM jsonb_array_elements(_itens) i
   WHERE NOT EXISTS (SELECT 1 FROM public.passagem_fatura_itens f WHERE f.fatura_id = v_id AND f.trecho_id = (i->>'trecho_id')::uuid);
  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.passagem_salvar_fatura(jsonb, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.passagem_salvar_fatura(jsonb, jsonb) TO authenticated;

-- ----------------------------------------------------------------------------
-- 7. RLS (gerado de supabase/baseline/rls/mapa.csv por scripts/db/gerar-rls.mjs)
-- ----------------------------------------------------------------------------
-- passagem_contrato_empenhos  [permissao: contratos]
DROP POLICY IF EXISTS "rls_select" ON public.passagem_contrato_empenhos;
CREATE POLICY "rls_select" ON public.passagem_contrato_empenhos FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'contratos')) AND (public.has_permission_code(auth.uid(), 'contratos.passagens.visualizar') OR public.has_permission_code(auth.uid(), 'contratos.passagens.editar') OR public.has_permission_code(auth.uid(), 'contratos.passagens.financeiro'))));
DROP POLICY IF EXISTS "rls_insert" ON public.passagem_contrato_empenhos;
CREATE POLICY "rls_insert" ON public.passagem_contrato_empenhos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.financeiro'));
DROP POLICY IF EXISTS "rls_update" ON public.passagem_contrato_empenhos;
CREATE POLICY "rls_update" ON public.passagem_contrato_empenhos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.financeiro'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.financeiro'));
DROP POLICY IF EXISTS "rls_delete" ON public.passagem_contrato_empenhos;
CREATE POLICY "rls_delete" ON public.passagem_contrato_empenhos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.financeiro'));

-- passagem_fatura_itens  [permissao: contratos]
DROP POLICY IF EXISTS "rls_select" ON public.passagem_fatura_itens;
CREATE POLICY "rls_select" ON public.passagem_fatura_itens FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'contratos')) AND (public.has_permission_code(auth.uid(), 'contratos.passagens.visualizar') OR public.has_permission_code(auth.uid(), 'contratos.passagens.editar') OR public.has_permission_code(auth.uid(), 'contratos.passagens.financeiro'))));
DROP POLICY IF EXISTS "rls_insert" ON public.passagem_fatura_itens;
CREATE POLICY "rls_insert" ON public.passagem_fatura_itens FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.financeiro'));
DROP POLICY IF EXISTS "rls_update" ON public.passagem_fatura_itens;
CREATE POLICY "rls_update" ON public.passagem_fatura_itens FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.financeiro'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.financeiro'));
DROP POLICY IF EXISTS "rls_delete" ON public.passagem_fatura_itens;
CREATE POLICY "rls_delete" ON public.passagem_fatura_itens FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.financeiro'));

-- passagem_faturas  [permissao: contratos]
DROP POLICY IF EXISTS "rls_select" ON public.passagem_faturas;
CREATE POLICY "rls_select" ON public.passagem_faturas FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'contratos')) AND (public.has_permission_code(auth.uid(), 'contratos.passagens.visualizar') OR public.has_permission_code(auth.uid(), 'contratos.passagens.editar') OR public.has_permission_code(auth.uid(), 'contratos.passagens.financeiro'))));
DROP POLICY IF EXISTS "rls_insert" ON public.passagem_faturas;
CREATE POLICY "rls_insert" ON public.passagem_faturas FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.financeiro'));
DROP POLICY IF EXISTS "rls_update" ON public.passagem_faturas;
CREATE POLICY "rls_update" ON public.passagem_faturas FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.financeiro'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.financeiro'));
DROP POLICY IF EXISTS "rls_delete" ON public.passagem_faturas;
CREATE POLICY "rls_delete" ON public.passagem_faturas FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.financeiro'));
