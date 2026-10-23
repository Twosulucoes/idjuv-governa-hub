-- ============================================================================
-- FINANCEIRO — conciliação bancária mensal (quadro da SEFAZ)
-- ============================================================================
-- Spec: docs/superpowers/specs/2026-10-21-financeiro-conciliacao-mensal-design.md
--
--   fin_conciliacoes_mensais       um mês de uma conta: saldo do razão (FIP630), saldo da conta corrente e do
--                                  fundo no último dia, rendimento do fundo, situação (rascunho | fechada).
--   fin_conciliacao_itens          os lançamentos do razão e do extrato do mês, e as pendências trazidas do mês
--                                  anterior ou lançadas na implantação, com o casamento (grupo, regra) ou
--                                  pendentes (as quatro listas do quadro). Sem nome de credor: o histórico é o
--                                  do razão e do extrato.
--   salvar_conciliacao_mensal      grava o rascunho do mês e troca os itens de uma vez (SECURITY INVOKER: a RLS
--                                  decide quem pode).
--   fechar_conciliacao_mensal      confere no servidor que o saldo ajustado bate com o extrato e tranca o mês.
--   reabrir_conciliacao_mensal     só o papel admin, com motivo.
--   fin_conciliacao_proteger       gatilho: mês fechado não muda nem recebe item.
--
-- Leitura pelo módulo financeiro; gravar exige `pagamento.conciliar` (a mesma da Conciliação bancária).
-- ============================================================================

SET lock_timeout = '10s';

-- ----------------------------------------------------------------------------
-- 1. Tabelas
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fin_conciliacoes_mensais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_bancaria_id uuid NOT NULL REFERENCES public.fin_contas_bancarias(id),
  competencia date NOT NULL CHECK (extract(day FROM competencia) = 1),
  saldo_razao numeric(15,2) NOT NULL,
  saldo_conta numeric(15,2) NOT NULL DEFAULT 0,
  saldo_fundo numeric(15,2) NOT NULL DEFAULT 0,
  rendimento_fundo numeric(15,2) NOT NULL DEFAULT 0 CHECK (rendimento_fundo >= 0),
  situacao text NOT NULL DEFAULT 'rascunho' CHECK (situacao IN ('rascunho', 'fechada')),
  arquivos jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(arquivos) = 'array'),
  observacoes text CHECK (char_length(observacoes) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  fechada_em timestamptz,
  fechada_por uuid,
  CONSTRAINT fin_conciliacoes_mensais_conta_competencia_key UNIQUE (conta_bancaria_id, competencia)
);

COMMENT ON TABLE public.fin_conciliacoes_mensais IS
  'Conciliação bancária mensal de uma conta (quadro da SEFAZ). Saldo do extrato = saldo_conta + saldo_fundo no último dia do mês. Gravada por salvar_conciliacao_mensal; fechada por fechar_conciliacao_mensal.';

CREATE TABLE IF NOT EXISTS public.fin_conciliacao_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conciliacao_id uuid NOT NULL REFERENCES public.fin_conciliacoes_mensais(id) ON DELETE CASCADE,
  lado text NOT NULL CHECK (lado IN ('contabil', 'bancario')),
  natureza text NOT NULL CHECK (natureza IN ('debito', 'credito')),
  data date NOT NULL,
  documento text NOT NULL DEFAULT '' CHECK (char_length(documento) <= 60),
  tipo text NOT NULL DEFAULT '' CHECK (char_length(tipo) <= 10),
  historico text NOT NULL DEFAULT '' CHECK (char_length(historico) <= 300),
  valor numeric(15,2) NOT NULL CHECK (valor > 0),
  re text CHECK (re ~ '^\d{2}\.\d{5}-\d$'),
  nob text CHECK (nob ~ '^\d{2}\.\d{5}-\d$'),
  origem text NOT NULL DEFAULT 'mes' CHECK (origem IN ('mes', 'anterior', 'abertura')),
  item_origem_id uuid REFERENCES public.fin_conciliacao_itens(id) ON DELETE SET NULL,
  situacao text NOT NULL CHECK (situacao IN ('casado', 'pendente')),
  grupo integer,
  regra text CHECK (regra IN ('interno', 're', 'ob_cancelada', 'repasse', 'valor_data', 'estorno', 'manual')),
  justificativa text CHECK (char_length(justificativa) <= 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fin_conciliacao_itens_casado_check CHECK (
    (situacao = 'casado' AND grupo IS NOT NULL AND regra IS NOT NULL)
    OR (situacao = 'pendente' AND grupo IS NULL AND regra IS NULL)
  ),
  CONSTRAINT fin_conciliacao_itens_manual_check CHECK (regra IS DISTINCT FROM 'manual' OR char_length(btrim(justificativa)) > 0),
  CONSTRAINT fin_conciliacao_itens_anterior_check CHECK ((origem = 'anterior') = (item_origem_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_fin_conciliacao_itens_conciliacao ON public.fin_conciliacao_itens (conciliacao_id, situacao);
CREATE INDEX IF NOT EXISTS idx_fin_conciliacao_itens_origem ON public.fin_conciliacao_itens (item_origem_id);

COMMENT ON TABLE public.fin_conciliacao_itens IS
  'Itens da conciliação mensal: lançamentos do razão (contabil) e do extrato (bancario), casados em grupos ou pendentes (as quatro listas do quadro). origem anterior = pendência do mês anterior (item_origem_id); abertura = lançada na implantação.';

ALTER TABLE public.fin_conciliacoes_mensais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_conciliacao_itens ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 2. Mês fechado não muda (só reabrir_conciliacao_mensal, do admin, destranca)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fin_conciliacao_proteger()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF TG_TABLE_NAME = 'fin_conciliacoes_mensais' THEN
    IF TG_OP = 'INSERT' THEN
      -- nasce rascunho: fechar é só pela fechar_conciliacao_mensal, que confere o quadro
      NEW.situacao := 'rascunho';
      NEW.fechada_em := NULL;
      NEW.fechada_por := NULL;
      RETURN NEW;
    END IF;
    IF TG_OP = 'UPDATE' THEN
      NEW.updated_at := now();
      NEW.updated_by := auth.uid();
      IF (NEW.situacao, NEW.fechada_em, NEW.fechada_por) IS DISTINCT FROM (OLD.situacao, OLD.fechada_em, OLD.fechada_por)
         AND OLD.situacao = 'rascunho'
         AND COALESCE(current_setting('idjuv.fechando_conciliacao', true), '') <> OLD.id::text THEN
        RAISE EXCEPTION 'Use "Fechar o mês" para fechar a conciliação.' USING ERRCODE = '42501';
      END IF;
    END IF;
    IF TG_OP IN ('UPDATE', 'DELETE') AND OLD.situacao = 'fechada'
       AND NOT (COALESCE(current_setting('idjuv.reabrindo_conciliacao', true), '') = OLD.id::text
                AND public.is_admin_user(auth.uid())) THEN
      RAISE EXCEPTION 'Conciliação de % fechada: peça ao administrador para reabrir.', to_char(OLD.competencia, 'MM/YYYY')
        USING ERRCODE = '42501';
    END IF;
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;

  v_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.conciliacao_id ELSE NEW.conciliacao_id END;
  IF EXISTS (SELECT 1 FROM public.fin_conciliacoes_mensais c WHERE c.id = v_id AND c.situacao = 'fechada') THEN
    RAISE EXCEPTION 'Conciliação fechada: os itens não mudam.' USING ERRCODE = '42501';
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.conciliacao_id IS DISTINCT FROM NEW.conciliacao_id
     AND EXISTS (SELECT 1 FROM public.fin_conciliacoes_mensais c WHERE c.id = OLD.conciliacao_id AND c.situacao = 'fechada') THEN
    RAISE EXCEPTION 'Conciliação fechada: os itens não mudam.' USING ERRCODE = '42501';
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.fin_conciliacao_proteger() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_fin_conciliacoes_mensais_proteger ON public.fin_conciliacoes_mensais;
CREATE TRIGGER trg_fin_conciliacoes_mensais_proteger
  BEFORE INSERT OR UPDATE OR DELETE ON public.fin_conciliacoes_mensais
  FOR EACH ROW EXECUTE FUNCTION public.fin_conciliacao_proteger();

DROP TRIGGER IF EXISTS trg_fin_conciliacao_itens_proteger ON public.fin_conciliacao_itens;
CREATE TRIGGER trg_fin_conciliacao_itens_proteger
  BEFORE INSERT OR UPDATE OR DELETE ON public.fin_conciliacao_itens
  FOR EACH ROW EXECUTE FUNCTION public.fin_conciliacao_proteger();

-- Pendência trazida do mês anterior: só de uma pendência do mês imediatamente anterior, fechado, da mesma conta, e
-- trazida uma vez só. Conferida ao salvar e de novo ao fechar (os itens também podem ser gravados direto pela API).
CREATE OR REPLACE FUNCTION public.fin_conciliacao_conferir_anteriores(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM public.fin_conciliacao_itens n
      JOIN public.fin_conciliacoes_mensais m ON m.id = n.conciliacao_id
      LEFT JOIN public.fin_conciliacao_itens o ON o.id = n.item_origem_id
      LEFT JOIN public.fin_conciliacoes_mensais c ON c.id = o.conciliacao_id
     WHERE n.conciliacao_id = p_id AND n.origem = 'anterior'
       AND (o.id IS NULL OR o.situacao <> 'pendente' OR c.situacao <> 'fechada'
            OR c.conta_bancaria_id <> m.conta_bancaria_id
            OR c.competencia <> (m.competencia - interval '1 month')::date)
  ) OR EXISTS (
    SELECT 1 FROM public.fin_conciliacao_itens n
     WHERE n.conciliacao_id = p_id AND n.item_origem_id IS NOT NULL
     GROUP BY n.item_origem_id HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Pendência anterior que não está em aberto no mês anterior fechado desta conta (ou repetida).'
      USING ERRCODE = '22023';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.fin_conciliacao_conferir_anteriores(uuid) FROM PUBLIC, anon;
-- chamada pelas RPCs SECURITY INVOKER: só confere e lê o que a RLS já deixa ler
GRANT EXECUTE ON FUNCTION public.fin_conciliacao_conferir_anteriores(uuid) TO authenticated;

-- ----------------------------------------------------------------------------
-- 3. Gravar o rascunho do mês (cabeçalho + troca dos itens)
-- ----------------------------------------------------------------------------
-- p_dados: {saldo_razao, saldo_conta, saldo_fundo, rendimento_fundo, arquivos, observacoes}
-- p_itens: [{ref, lado, natureza, data, documento, tipo, historico, valor, re, nob, origem, item_origem_id,
--            situacao, grupo, regra, justificativa}] (ref é só do navegador e não é gravado)
CREATE OR REPLACE FUNCTION public.salvar_conciliacao_mensal(
  p_conta_bancaria_id uuid,
  p_competencia date,
  p_dados jsonb,
  p_itens jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_situacao text;
BEGIN
  IF p_competencia IS NULL OR extract(day FROM p_competencia) <> 1 THEN
    RAISE EXCEPTION 'Competência deve ser o primeiro dia do mês.' USING ERRCODE = '22023';
  END IF;
  IF jsonb_typeof(p_itens) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Itens da conciliação ausentes.' USING ERRCODE = '22023';
  END IF;

  SELECT id, situacao INTO v_id, v_situacao
    FROM public.fin_conciliacoes_mensais
   WHERE conta_bancaria_id = p_conta_bancaria_id AND competencia = p_competencia
   FOR UPDATE;
  IF v_situacao = 'fechada' THEN
    RAISE EXCEPTION 'Conciliação de % fechada: peça ao administrador para reabrir.', to_char(p_competencia, 'MM/YYYY')
      USING ERRCODE = '42501';
  END IF;

  IF v_id IS NULL THEN
    INSERT INTO public.fin_conciliacoes_mensais
      (conta_bancaria_id, competencia, saldo_razao, saldo_conta, saldo_fundo, rendimento_fundo, arquivos, observacoes)
    VALUES (
      p_conta_bancaria_id, p_competencia,
      (p_dados->>'saldo_razao')::numeric,
      COALESCE((p_dados->>'saldo_conta')::numeric, 0),
      COALESCE((p_dados->>'saldo_fundo')::numeric, 0),
      COALESCE((p_dados->>'rendimento_fundo')::numeric, 0),
      COALESCE(p_dados->'arquivos', '[]'::jsonb),
      NULLIF(btrim(COALESCE(p_dados->>'observacoes', '')), '')
    )
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.fin_conciliacoes_mensais
       SET saldo_razao = (p_dados->>'saldo_razao')::numeric,
           saldo_conta = COALESCE((p_dados->>'saldo_conta')::numeric, 0),
           saldo_fundo = COALESCE((p_dados->>'saldo_fundo')::numeric, 0),
           rendimento_fundo = COALESCE((p_dados->>'rendimento_fundo')::numeric, 0),
           arquivos = COALESCE(p_dados->'arquivos', '[]'::jsonb),
           observacoes = NULLIF(btrim(COALESCE(p_dados->>'observacoes', '')), '')
     WHERE id = v_id;
    DELETE FROM public.fin_conciliacao_itens WHERE conciliacao_id = v_id;
  END IF;

  INSERT INTO public.fin_conciliacao_itens
    (conciliacao_id, lado, natureza, data, documento, tipo, historico, valor, re, nob, origem, item_origem_id,
     situacao, grupo, regra, justificativa)
  SELECT v_id, i.lado, i.natureza, i.data, COALESCE(i.documento, ''), COALESCE(i.tipo, ''), COALESCE(i.historico, ''),
         i.valor, NULLIF(i.re, ''), NULLIF(i.nob, ''), COALESCE(i.origem, 'mes'), i.item_origem_id,
         i.situacao, i.grupo, NULLIF(i.regra, ''), NULLIF(btrim(COALESCE(i.justificativa, '')), '')
    FROM jsonb_to_recordset(p_itens) AS i(
      lado text, natureza text, data date, documento text, tipo text, historico text, valor numeric, re text, nob text,
      origem text, item_origem_id uuid, situacao text, grupo integer, regra text, justificativa text
    );

  PERFORM public.fin_conciliacao_conferir_anteriores(v_id);
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.salvar_conciliacao_mensal(uuid, date, jsonb, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.salvar_conciliacao_mensal(uuid, date, jsonb, jsonb) TO authenticated;

-- ----------------------------------------------------------------------------
-- 4. Fechar (confere o quadro no servidor) e reabrir (só o admin)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fechar_conciliacao_mensal(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_c public.fin_conciliacoes_mensais%ROWTYPE;
  v_ajustado numeric(15,2);
BEGIN
  SELECT * INTO v_c FROM public.fin_conciliacoes_mensais WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conciliação não encontrada.' USING ERRCODE = 'P0002';
  END IF;
  IF v_c.situacao = 'fechada' THEN
    RAISE EXCEPTION 'Conciliação já fechada.' USING ERRCODE = '22023';
  END IF;

  SELECT v_c.saldo_razao
         - COALESCE(sum(valor) FILTER (WHERE lado = 'contabil' AND natureza = 'debito'), 0)
         + COALESCE(sum(valor) FILTER (WHERE lado = 'contabil' AND natureza = 'credito'), 0)
         - COALESCE(sum(valor) FILTER (WHERE lado = 'bancario' AND natureza = 'debito'), 0)
         + COALESCE(sum(valor) FILTER (WHERE lado = 'bancario' AND natureza = 'credito'), 0)
    INTO v_ajustado
    FROM public.fin_conciliacao_itens
   WHERE conciliacao_id = p_id AND situacao = 'pendente';

  PERFORM public.fin_conciliacao_conferir_anteriores(p_id);
  IF v_ajustado <> v_c.saldo_conta + v_c.saldo_fundo THEN
    RAISE EXCEPTION 'O saldo ajustado (%) não bate com o extrato (%): confira as pendências antes de fechar.',
      v_ajustado, v_c.saldo_conta + v_c.saldo_fundo USING ERRCODE = '22023';
  END IF;

  PERFORM set_config('idjuv.fechando_conciliacao', p_id::text, true);
  UPDATE public.fin_conciliacoes_mensais
     SET situacao = 'fechada', fechada_em = now(), fechada_por = auth.uid()
   WHERE id = p_id;
  PERFORM set_config('idjuv.fechando_conciliacao', '', true);
END;
$$;

REVOKE ALL ON FUNCTION public.fechar_conciliacao_mensal(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fechar_conciliacao_mensal(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.reabrir_conciliacao_mensal(p_id uuid, p_motivo text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_c public.fin_conciliacoes_mensais%ROWTYPE;
BEGIN
  IF NOT public.is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Só o administrador reabre uma conciliação fechada.' USING ERRCODE = '42501';
  END IF;
  IF char_length(btrim(COALESCE(p_motivo, ''))) < 5 THEN
    RAISE EXCEPTION 'Informe o motivo da reabertura.' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_c FROM public.fin_conciliacoes_mensais WHERE id = p_id FOR UPDATE;
  IF NOT FOUND OR v_c.situacao <> 'fechada' THEN
    RAISE EXCEPTION 'Conciliação não está fechada.' USING ERRCODE = '22023';
  END IF;
  -- O mês seguinte fechado já carregou as pendências deste: reabrir quebraria a corrente
  IF EXISTS (
    SELECT 1 FROM public.fin_conciliacoes_mensais s
     WHERE s.conta_bancaria_id = v_c.conta_bancaria_id AND s.competencia > v_c.competencia AND s.situacao = 'fechada'
  ) THEN
    RAISE EXCEPTION 'Há mês posterior fechado: reabra primeiro o mais recente.' USING ERRCODE = '22023';
  END IF;

  PERFORM set_config('idjuv.reabrindo_conciliacao', p_id::text, true);
  UPDATE public.fin_conciliacoes_mensais
     SET situacao = 'rascunho', fechada_em = NULL, fechada_por = NULL,
         observacoes = left(concat_ws(E'\n', observacoes,
           'Reaberta em ' || to_char(now() AT TIME ZONE 'America/Boa_Vista', 'DD/MM/YYYY HH24:MI') || ': ' || btrim(p_motivo)), 2000)
   WHERE id = p_id;
  PERFORM set_config('idjuv.reabrindo_conciliacao', '', true);
END;
$$;

REVOKE ALL ON FUNCTION public.reabrir_conciliacao_mensal(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reabrir_conciliacao_mensal(uuid, text) TO authenticated;

-- ----------------------------------------------------------------------------
-- 5. RLS (gerado de supabase/baseline/rls/mapa.csv por scripts/db/gerar-rls.mjs)
-- ----------------------------------------------------------------------------
-- fin_conciliacao_itens  [permissao: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_conciliacao_itens;
CREATE POLICY "rls_select" ON public.fin_conciliacao_itens FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_conciliacao_itens;
CREATE POLICY "rls_insert" ON public.fin_conciliacao_itens FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')) AND public.has_permission_code(auth.uid(), 'pagamento.conciliar'));
DROP POLICY IF EXISTS "rls_update" ON public.fin_conciliacao_itens;
CREATE POLICY "rls_update" ON public.fin_conciliacao_itens FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')) AND public.has_permission_code(auth.uid(), 'pagamento.conciliar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')) AND public.has_permission_code(auth.uid(), 'pagamento.conciliar'));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_conciliacao_itens;
CREATE POLICY "rls_delete" ON public.fin_conciliacao_itens FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')) AND public.has_permission_code(auth.uid(), 'pagamento.conciliar'));

-- fin_conciliacoes_mensais  [permissao: financeiro]
DROP POLICY IF EXISTS "rls_select" ON public.fin_conciliacoes_mensais;
CREATE POLICY "rls_select" ON public.fin_conciliacoes_mensais FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')));
DROP POLICY IF EXISTS "rls_insert" ON public.fin_conciliacoes_mensais;
CREATE POLICY "rls_insert" ON public.fin_conciliacoes_mensais FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')) AND public.has_permission_code(auth.uid(), 'pagamento.conciliar'));
DROP POLICY IF EXISTS "rls_update" ON public.fin_conciliacoes_mensais;
CREATE POLICY "rls_update" ON public.fin_conciliacoes_mensais FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'financeiro')) AND public.has_permission_code(auth.uid(), 'pagamento.conciliar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'financeiro')) AND public.has_permission_code(auth.uid(), 'pagamento.conciliar'));
DROP POLICY IF EXISTS "rls_delete" ON public.fin_conciliacoes_mensais;
