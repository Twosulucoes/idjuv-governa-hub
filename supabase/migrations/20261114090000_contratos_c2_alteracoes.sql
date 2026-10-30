-- ============================================================================
-- CONTRATOS — entrega C2: alterações (aditivo, apostilamento, suspensão, rescisão) e vencimentos
-- ============================================================================
-- Spec: docs/superpowers/specs/2026-10-27-contratos-gestao-completa-design.md (§4, C2)
-- Plano: docs/superpowers/plans/2026-10-30-contratos-c2-alteracoes-vencimentos.md
--
--   contrato_alteracoes       termo aditivo, apostilamento, suspensão, rescisão e a "situação anterior ao sistema"
--                             (partida), cada um com o processo e o documento do SEI, a data e o DOE. O ato é do SEI;
--                             aqui só se registra. Substitui aditivos_contrato (sem tela), copiada antes de sair.
--   contratos_preparar        passa a calcular valor_atual, data_fim_atual e a situação pelas alterações (SECURITY
--                             DEFINER: o cálculo não pode depender da RLS de quem grava, ex.: quem só marca o contrato
--                             da agência em Passagens). Mudou o fim para depois, a providência de renovação é limpa.
--   contratos (colunas)       reforma (limite de acréscimo de 50%) e a providência de renovação (prorrogar, nova
--                             contratação ou encerrar, com o processo SEI) que a tela Vencimentos mostra.
--   contratos_meus_vencimentos   o sino: contratos que vencem em até 120 dias, do gestor e dos fiscais (pelo
--                             servidor do perfil) e, para quem tem contratos.editar, todos.
--   contratos_importar_planilha  contrato novo com "Valor atual" diferente do inicial ganha a partida com a diferença.
--   localizar_processos_sei   o processo SEI de uma alteração e o da renovação também levam ao contrato.
--
-- RLS (decidido pelo dono em 30/10/2026): ler alterações com o módulo Compras ou Contratos; registrar, corrigir e
-- apagar só com contratos.editar. Os números já gravados não mudam: o contrato cujo valor atual ou fim atual difere
-- do calculado ganha a partida com a diferença.
-- Idempotente (IF NOT EXISTS, CREATE OR REPLACE, DROP/CREATE de policies, gatilhos e constraints).
-- ============================================================================

SET lock_timeout = '10s';

-- ----------------------------------------------------------------------------
-- 1. contratos: reforma e providência de renovação
-- ----------------------------------------------------------------------------
ALTER TABLE public.contratos
  ADD COLUMN IF NOT EXISTS reforma boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS renovacao_providencia text,
  ADD COLUMN IF NOT EXISTS renovacao_processo_sei text,
  ADD COLUMN IF NOT EXISTS renovacao_observacao text,
  ADD COLUMN IF NOT EXISTS renovacao_atualizada_em timestamptz;

ALTER TABLE public.contratos DROP CONSTRAINT IF EXISTS contratos_renovacao_providencia_check;
ALTER TABLE public.contratos ADD CONSTRAINT contratos_renovacao_providencia_check
  CHECK (renovacao_providencia IS NULL OR renovacao_providencia IN ('prorrogar', 'nova_contratacao', 'encerrar'));
ALTER TABLE public.contratos DROP CONSTRAINT IF EXISTS contratos_renovacao_processo_sei_check;
ALTER TABLE public.contratos ADD CONSTRAINT contratos_renovacao_processo_sei_check
  CHECK (renovacao_processo_sei IS NULL OR char_length(btrim(renovacao_processo_sei)) BETWEEN 1 AND 60);
ALTER TABLE public.contratos DROP CONSTRAINT IF EXISTS contratos_renovacao_observacao_check;
ALTER TABLE public.contratos ADD CONSTRAINT contratos_renovacao_observacao_check
  CHECK (renovacao_observacao IS NULL OR char_length(renovacao_observacao) <= 1000);

COMMENT ON COLUMN public.contratos.valor_atual IS
  'Valor inicial + acréscimos − supressões ± variações (apostilamentos e situação anterior), calculado pelo banco a partir de contrato_alteracoes (C2).';
COMMENT ON COLUMN public.contratos.data_fim_atual IS
  'Fim da vigência depois das alterações, calculado pelo banco: data da rescisão, ou a nova data da última alteração (a situação anterior conta como a mais antiga), ou data_fim (C2).';
COMMENT ON COLUMN public.contratos.reforma IS
  'Reforma de edifício ou de equipamento: o limite de acréscimo é 50% do valor inicial atualizado (Lei 14.133/2021, art. 125), não 25%.';
COMMENT ON COLUMN public.contratos.renovacao_providencia IS
  'O que o NuAC decidiu para o vencimento (prorrogar, nova_contratacao, encerrar), com o processo SEI em renovacao_processo_sei. Limpa quando o fim atual passa para depois.';

-- ----------------------------------------------------------------------------
-- 2. contrato_alteracoes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contrato_alteracoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id uuid NOT NULL REFERENCES public.contratos(id) ON DELETE CASCADE,
  especie text NOT NULL,
  numero integer,
  altera_prazo boolean NOT NULL DEFAULT false,
  altera_valor boolean NOT NULL DEFAULT false,
  altera_objeto boolean NOT NULL DEFAULT false,
  motivo text,
  valor_acrescimo numeric(15,2) NOT NULL DEFAULT 0,
  valor_supressao numeric(15,2) NOT NULL DEFAULT 0,
  valor_variacao numeric(15,2) NOT NULL DEFAULT 0,
  percentual numeric(9,4),
  indice text,
  nova_data_fim date,
  data_inicio date,
  data_retomada date,
  descricao text NOT NULL,
  justificativa text,
  fundamento_legal text,
  processo_sei text,
  documento_sei text,
  documento_retomada_sei text,
  data_assinatura date,
  data_publicacao_doe date,
  numero_doe character varying(20),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  CONSTRAINT contrato_alteracoes_especie_check
    CHECK (especie IN ('aditivo', 'apostilamento', 'suspensao', 'rescisao', 'partida')),
  CONSTRAINT contrato_alteracoes_numero_check
    CHECK ((especie IN ('aditivo', 'apostilamento')) = (numero IS NOT NULL) AND (numero IS NULL OR numero BETWEEN 1 AND 999)),
  CONSTRAINT contrato_alteracoes_valores_check
    CHECK (valor_acrescimo >= 0 AND valor_supressao >= 0
           AND (especie IN ('apostilamento', 'partida') OR valor_variacao = 0)
           AND (especie = 'aditivo' OR (valor_acrescimo = 0 AND valor_supressao = 0))),
  CONSTRAINT contrato_alteracoes_flags_check
    CHECK (especie = 'aditivo' OR NOT (altera_prazo OR altera_valor OR altera_objeto)),
  -- aditivo: muda prazo, valor e/ou objeto; prazo pede a nova data e valor pede acréscimo ou supressão
  CONSTRAINT contrato_alteracoes_aditivo_check
    CHECK (especie <> 'aditivo' OR (
      (altera_prazo OR altera_valor OR altera_objeto)
      AND altera_prazo = (nova_data_fim IS NOT NULL)
      AND altera_valor = (valor_acrescimo > 0 OR valor_supressao > 0)
      AND data_assinatura IS NOT NULL AND motivo IS NULL AND data_inicio IS NULL AND data_retomada IS NULL)),
  -- apostilamento: reajuste, repactuação, dotação, prorrogação pela suspensão (art. 115, §5º) ou outro
  CONSTRAINT contrato_alteracoes_apostilamento_check
    CHECK (especie <> 'apostilamento' OR (
      motivo IN ('reajuste', 'repactuacao', 'dotacao', 'prorrogacao_suspensao', 'outro')
      AND (nova_data_fim IS NULL OR motivo = 'prorrogacao_suspensao')
      AND (valor_variacao = 0 OR motivo IN ('reajuste', 'repactuacao', 'outro'))
      AND data_assinatura IS NOT NULL AND data_inicio IS NULL AND data_retomada IS NULL)),
  CONSTRAINT contrato_alteracoes_suspensao_check
    CHECK (especie <> 'suspensao' OR (
      data_inicio IS NOT NULL AND (data_retomada IS NULL OR data_retomada >= data_inicio)
      AND motivo IS NULL AND nova_data_fim IS NULL)),
  CONSTRAINT contrato_alteracoes_retomada_check
    CHECK (especie = 'suspensao' OR (data_retomada IS NULL AND documento_retomada_sei IS NULL)),
  -- rescisão: data em que o contrato terminou (data_inicio) e a forma (art. 138)
  CONSTRAINT contrato_alteracoes_rescisao_check
    CHECK (especie <> 'rescisao' OR (
      data_inicio IS NOT NULL AND motivo IN ('unilateral', 'consensual', 'judicial') AND nova_data_fim IS NULL)),
  -- situação anterior ao sistema: a diferença de valor e/ou o fim que já vinham alterados
  CONSTRAINT contrato_alteracoes_partida_check
    CHECK (especie <> 'partida' OR (
      (valor_variacao <> 0 OR nova_data_fim IS NOT NULL) AND motivo IS NULL AND data_inicio IS NULL)),
  CONSTRAINT contrato_alteracoes_percentual_check
    CHECK (percentual IS NULL OR (especie = 'apostilamento' AND motivo IN ('reajuste', 'repactuacao')
                                  AND percentual BETWEEN -100 AND 1000)),
  CONSTRAINT contrato_alteracoes_textos_check
    CHECK (char_length(btrim(descricao)) BETWEEN 1 AND 2000
           AND (justificativa IS NULL OR char_length(justificativa) <= 2000)
           AND (fundamento_legal IS NULL OR char_length(fundamento_legal) <= 500)
           AND (indice IS NULL OR char_length(indice) <= 60)
           AND (processo_sei IS NULL OR char_length(processo_sei) <= 60)
           AND (documento_sei IS NULL OR char_length(documento_sei) <= 60)
           AND (documento_retomada_sei IS NULL OR char_length(documento_retomada_sei) <= 60))
);
CREATE INDEX IF NOT EXISTS idx_contrato_alteracoes_contrato ON public.contrato_alteracoes (contrato_id);
-- 1º, 2º... por espécie; uma rescisão, uma situação anterior e uma suspensão em aberto por contrato
CREATE UNIQUE INDEX IF NOT EXISTS uq_contrato_alteracoes_numero
  ON public.contrato_alteracoes (contrato_id, especie, numero) WHERE numero IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_contrato_alteracoes_rescisao
  ON public.contrato_alteracoes (contrato_id) WHERE especie = 'rescisao';
CREATE UNIQUE INDEX IF NOT EXISTS uq_contrato_alteracoes_partida
  ON public.contrato_alteracoes (contrato_id) WHERE especie = 'partida';
CREATE UNIQUE INDEX IF NOT EXISTS uq_contrato_alteracoes_suspensao_aberta
  ON public.contrato_alteracoes (contrato_id) WHERE especie = 'suspensao' AND data_retomada IS NULL;
COMMENT ON TABLE public.contrato_alteracoes IS
  'Alterações do contrato registradas a partir do SEI (aditivo, apostilamento, suspensão, rescisão) e a situação anterior ao sistema (partida). O valor atual, o fim atual e a situação do contrato saem daqui (contratos_preparar).';

ALTER TABLE public.contrato_alteracoes ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 3. Gatilhos
-- ----------------------------------------------------------------------------
-- Autoria pelo banco; o contrato e a espécie não mudam (errou a espécie: apague e registre de novo); o contrato precisa
-- estar assinado; depois da rescisão só ela se corrige; datas não antes do início do contrato; processo SEI vazio herda
-- o do contrato.
CREATE OR REPLACE FUNCTION public.contrato_alteracoes_preparar()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_ct record;
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := coalesce(auth.uid(), NEW.created_by);
    NEW.created_at := now();
  ELSE
    IF NEW.contrato_id IS DISTINCT FROM OLD.contrato_id THEN
      RAISE EXCEPTION 'A alteração não muda de contrato.' USING ERRCODE = '22023';
    END IF;
    IF NEW.especie IS DISTINCT FROM OLD.especie THEN
      RAISE EXCEPTION 'A espécie da alteração não muda: apague e registre de novo.' USING ERRCODE = '22023';
    END IF;
    NEW.created_by := OLD.created_by;
    NEW.created_at := OLD.created_at;
    NEW.updated_by := coalesce(auth.uid(), NEW.updated_by);
  END IF;
  NEW.updated_at := now();

  NEW.descricao := btrim(NEW.descricao);
  NEW.justificativa := nullif(btrim(NEW.justificativa), '');
  NEW.fundamento_legal := nullif(btrim(NEW.fundamento_legal), '');
  NEW.indice := nullif(btrim(NEW.indice), '');
  NEW.processo_sei := nullif(btrim(NEW.processo_sei), '');
  NEW.documento_sei := nullif(btrim(NEW.documento_sei), '');
  NEW.documento_retomada_sei := nullif(btrim(NEW.documento_retomada_sei), '');
  NEW.numero_doe := nullif(btrim(NEW.numero_doe), '');

  SELECT c.status, c.data_inicio, c.processo_sei INTO v_ct FROM public.contratos c WHERE c.id = NEW.contrato_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contrato não encontrado.' USING ERRCODE = '22023';
  END IF;
  IF v_ct.status = 'rascunho' THEN
    RAISE EXCEPTION 'Contrato em rascunho ainda não foi assinado: mude a situação para vigente antes de registrar alteração.'
      USING ERRCODE = '22023';
  END IF;
  IF NEW.especie <> 'rescisao' AND EXISTS (
       SELECT 1 FROM public.contrato_alteracoes a
        WHERE a.contrato_id = NEW.contrato_id AND a.especie = 'rescisao' AND a.id <> NEW.id) THEN
    RAISE EXCEPTION 'Contrato rescindido não recebe alteração: corrija ou apague a rescisão antes.' USING ERRCODE = '22023';
  END IF;
  IF NEW.especie = 'suspensao' AND NEW.data_retomada IS NULL AND EXISTS (
       SELECT 1 FROM public.contrato_alteracoes a
        WHERE a.contrato_id = NEW.contrato_id AND a.especie = 'suspensao' AND a.data_retomada IS NULL AND a.id <> NEW.id) THEN
    RAISE EXCEPTION 'Já há uma suspensão em aberto: registre a retomada dela antes.' USING ERRCODE = '22023';
  END IF;
  IF NEW.nova_data_fim < v_ct.data_inicio OR NEW.data_inicio < v_ct.data_inicio THEN
    RAISE EXCEPTION 'A data vem antes do início do contrato (%).', to_char(v_ct.data_inicio, 'DD/MM/YYYY')
      USING ERRCODE = '22023';
  END IF;
  IF NEW.processo_sei IS NULL AND NEW.especie <> 'partida' THEN
    NEW.processo_sei := v_ct.processo_sei;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.contrato_alteracoes_preparar() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_contrato_alteracoes_preparar ON public.contrato_alteracoes;
CREATE TRIGGER trg_contrato_alteracoes_preparar BEFORE INSERT OR UPDATE ON public.contrato_alteracoes
  FOR EACH ROW EXECUTE FUNCTION public.contrato_alteracoes_preparar();

-- Toca o contrato para o recálculo (contratos_preparar). Saiu a rescisão ou terminou a suspensão: a situação volta a
-- vigente. SECURITY DEFINER: quem registra já passou pela RLS da alteração (contratos.editar).
CREATE OR REPLACE FUNCTION public.contrato_alteracoes_aplicar()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_volta boolean := false;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_volta := OLD.especie = 'rescisao' OR (OLD.especie = 'suspensao' AND OLD.data_retomada IS NULL);
  ELSIF TG_OP = 'UPDATE' THEN
    v_volta := OLD.especie = 'suspensao' AND OLD.data_retomada IS NULL AND NEW.data_retomada IS NOT NULL;
  END IF;
  UPDATE public.contratos c
     SET status = CASE WHEN v_volta AND c.status IN ('rescindido', 'suspenso') THEN 'vigente'::public.status_contrato
                       ELSE c.status END,
         updated_at = now()
   WHERE c.id = coalesce(NEW.contrato_id, OLD.contrato_id);
  RETURN NULL;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.contrato_alteracoes_aplicar() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_contrato_alteracoes_aplicar ON public.contrato_alteracoes;
CREATE TRIGGER trg_contrato_alteracoes_aplicar AFTER INSERT OR UPDATE OR DELETE ON public.contrato_alteracoes
  FOR EACH ROW EXECUTE FUNCTION public.contrato_alteracoes_aplicar();

DROP TRIGGER IF EXISTS trg_audit_contrato_alteracoes ON public.contrato_alteracoes;
CREATE TRIGGER trg_audit_contrato_alteracoes AFTER INSERT OR DELETE OR UPDATE ON public.contrato_alteracoes
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();

-- Autoria fixada pelo banco (quem cadastrou não muda; quem alterou é o usuário da sessão). Valor atual, fim atual e
-- situação saem das alterações (C2): rescisão → rescindido e fim na data dela; suspensão em aberto → suspenso; sem
-- elas, ninguém põe o contrato em suspenso ou rescindido (o que já estava assim fica). A providência do vencimento não
-- nasce com o cadastro (é alteração do contrato: contratos.editar) e a data dela é sempre a do banco.
-- SECURITY DEFINER para ler todas as alterações, qualquer que seja a RLS de quem grava o contrato.
CREATE OR REPLACE FUNCTION public.contratos_preparar()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_delta numeric;
  v_fim date;
  v_rescisao date;
  v_suspenso boolean;
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := coalesce(auth.uid(), NEW.created_by);
  ELSE
    NEW.created_by := OLD.created_by;
    NEW.updated_by := coalesce(auth.uid(), NEW.updated_by);
  END IF;
  NEW.processo_sei := nullif(btrim(NEW.processo_sei), '');
  NEW.numero_pncp := nullif(btrim(NEW.numero_pncp), '');
  NEW.renovacao_processo_sei := nullif(btrim(NEW.renovacao_processo_sei), '');
  NEW.renovacao_observacao := nullif(btrim(NEW.renovacao_observacao), '');

  SELECT coalesce(sum(a.valor_acrescimo - a.valor_supressao + a.valor_variacao), 0)
    INTO v_delta FROM public.contrato_alteracoes a WHERE a.contrato_id = NEW.id;
  SELECT a.data_inicio INTO v_rescisao
    FROM public.contrato_alteracoes a WHERE a.contrato_id = NEW.id AND a.especie = 'rescisao';
  SELECT a.nova_data_fim INTO v_fim
    FROM public.contrato_alteracoes a
   WHERE a.contrato_id = NEW.id AND a.nova_data_fim IS NOT NULL
   ORDER BY (a.especie = 'partida'), a.data_assinatura DESC NULLS LAST, a.created_at DESC, a.nova_data_fim DESC
   LIMIT 1;
  v_suspenso := EXISTS (SELECT 1 FROM public.contrato_alteracoes a
                         WHERE a.contrato_id = NEW.id AND a.especie = 'suspensao' AND a.data_retomada IS NULL);

  NEW.valor_atual := NEW.valor_inicial + v_delta;
  NEW.data_fim_atual := coalesce(v_rescisao, v_fim, NEW.data_fim);
  IF v_rescisao IS NOT NULL THEN
    NEW.status := 'rescindido';
  ELSIF v_suspenso AND NEW.status IN ('vigente', 'aditado', 'suspenso') THEN
    NEW.status := 'suspenso';
  ELSIF NEW.status IN ('suspenso', 'rescindido') AND (TG_OP = 'INSERT' OR NEW.status IS DISTINCT FROM OLD.status) THEN
    RAISE EXCEPTION 'Suspensão e rescisão se registram na aba Alterações do contrato, com o documento do SEI.'
      USING ERRCODE = '22023';
  END IF;

  IF TG_OP = 'INSERT' OR NEW.valor_atual IS DISTINCT FROM OLD.valor_atual THEN
    NEW.saldo_contrato := NEW.valor_atual - coalesce(NEW.valor_executado, 0);
  END IF;
  -- cadastro novo não traz providência; prorrogou (o fim foi para depois): a providência do vencimento antigo acabou
  IF TG_OP = 'INSERT' OR NEW.data_fim_atual > OLD.data_fim_atual THEN
    NEW.renovacao_providencia := NULL;
    NEW.renovacao_processo_sei := NULL;
    NEW.renovacao_observacao := NULL;
    NEW.renovacao_atualizada_em := NULL;
  ELSIF (NEW.renovacao_providencia, NEW.renovacao_processo_sei, NEW.renovacao_observacao)
        IS DISTINCT FROM (OLD.renovacao_providencia, OLD.renovacao_processo_sei, OLD.renovacao_observacao) THEN
    NEW.renovacao_atualizada_em := CASE WHEN NEW.renovacao_providencia IS NULL THEN NULL ELSE now() END;
  ELSE
    NEW.renovacao_atualizada_em := OLD.renovacao_atualizada_em;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.contratos_preparar() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_contratos_preparar ON public.contratos;
CREATE TRIGGER trg_contratos_preparar BEFORE INSERT OR UPDATE ON public.contratos
  FOR EACH ROW EXECUTE FUNCTION public.contratos_preparar();

-- ----------------------------------------------------------------------------
-- 4. Carga: aditivos_contrato → contrato_alteracoes e a situação anterior ao sistema
-- ----------------------------------------------------------------------------
-- Sem os gatilhos da tabela nova (é carga, não alteração de alguém): o contrato não é regravado, então nenhum número
-- muda e nenhuma linha antiga passa pelas regras de hoje. A partida absorve a diferença entre o que está gravado e o
-- que as alterações copiadas dão.
DO $$
DECLARE
  v_divergem integer;
BEGIN
  ALTER TABLE public.contrato_alteracoes DISABLE TRIGGER trg_contrato_alteracoes_preparar;
  ALTER TABLE public.contrato_alteracoes DISABLE TRIGGER trg_contrato_alteracoes_aplicar;
  ALTER TABLE public.contrato_alteracoes DISABLE TRIGGER trg_audit_contrato_alteracoes;

  IF to_regclass('public.aditivos_contrato') IS NOT NULL THEN
    -- Numeração refeita por contrato e espécie (1º, 2º... na ordem do nº antigo), para caber no 1 a 999 e não repetir.
    -- Se a nova data do aditivo mais recente não bate com o fim atual gravado, as datas antigas vão só para o texto e o
    -- fim gravado fica na situação anterior (senão a alteração copiada mudaria o fim quando o contrato fosse regravado).
    INSERT INTO public.contrato_alteracoes (
      id, contrato_id, especie, numero, altera_prazo, altera_valor, altera_objeto, motivo,
      valor_acrescimo, valor_supressao, nova_data_fim, descricao, justificativa, fundamento_legal,
      data_assinatura, data_publicacao_doe, numero_doe, created_at, created_by, updated_at)
    SELECT a.id, a.contrato_id, a.esp,
           row_number() OVER (PARTITION BY a.contrato_id, a.esp ORDER BY a.numero_aditivo, a.data_assinatura, a.criado, a.id)::integer,
           a.fim IS NOT NULL,
           a.esp = 'aditivo' AND (a.acrescimo > 0 OR a.supressao > 0),
           a.esp = 'aditivo' AND (a.tipo::text IN ('objeto', 'reequilibrio') OR NOT (a.fim IS NOT NULL OR a.acrescimo > 0 OR a.supressao > 0)),
           CASE WHEN a.esp = 'apostilamento' THEN 'outro' END,
           CASE WHEN a.esp = 'apostilamento' THEN 0 ELSE a.acrescimo END,
           CASE WHEN a.esp = 'apostilamento' THEN 0 ELSE a.supressao END,
           a.fim,
           left(concat_ws(' ', coalesce(nullif(btrim(a.objeto), ''), 'Registro copiado da tabela antiga de aditivos.'),
                CASE WHEN coalesce(a.prazo_adicional_dias, 0) <> 0 THEN format('(prazo adicional: %s dias)', a.prazo_adicional_dias) END,
                CASE WHEN (a.esp = 'apostilamento' AND (a.nova_data_fim IS NOT NULL OR coalesce(a.valor_acrescimo, 0) <> 0
                                                        OR coalesce(a.valor_supressao, 0) <> 0))
                          OR (a.esp = 'aditivo' AND a.nova_data_fim IS NOT NULL AND a.fim IS NULL)
                     THEN format('(registro antigo: nova data %s, acréscimo %s, supressão %s)',
                                 coalesce(to_char(a.nova_data_fim, 'DD/MM/YYYY'), '-'), coalesce(a.valor_acrescimo, 0), coalesce(a.valor_supressao, 0)) END),
                2000),
           left(a.justificativa, 2000), left(a.fundamentacao_legal, 500),
           a.data_assinatura, a.data_publicacao_doe, a.numero_doe,
           a.criado, a.created_by, a.criado
      FROM (
        SELECT x.*, CASE WHEN x.esp = 'aditivo' AND x.fim_confere THEN x.nova_data_fim END AS fim
          FROM (
            SELECT ad.*, coalesce(ad.created_at, now()) AS criado,
                   greatest(coalesce(ad.valor_acrescimo, 0), 0) AS acrescimo,
                   greatest(coalesce(ad.valor_supressao, 0), 0) AS supressao,
                   CASE WHEN ad.tipo::text = 'apostilamento' THEN 'apostilamento' ELSE 'aditivo' END AS esp,
                   -- a nova data do aditivo mais recente (a mesma ordem de contratos_preparar) é o fim atual gravado?
                   first_value(CASE WHEN ad.tipo::text <> 'apostilamento' THEN ad.nova_data_fim END) OVER (
                     PARTITION BY ad.contrato_id
                     ORDER BY (ad.tipo::text = 'apostilamento' OR ad.nova_data_fim IS NULL), ad.data_assinatura DESC NULLS LAST,
                              coalesce(ad.created_at, now()) DESC, ad.nova_data_fim DESC)
                     IS NOT DISTINCT FROM ct.data_fim_atual
                   OR NOT bool_or(ad.tipo::text <> 'apostilamento' AND ad.nova_data_fim IS NOT NULL) OVER (PARTITION BY ad.contrato_id)
                     AS fim_confere
              FROM public.aditivos_contrato ad
              JOIN public.contratos ct ON ct.id = ad.contrato_id
          ) x
      ) a
     WHERE NOT EXISTS (SELECT 1 FROM public.contrato_alteracoes y WHERE y.id = a.id);
  END IF;

  -- situação anterior: o que está gravado menos o que as alterações dão
  INSERT INTO public.contrato_alteracoes (contrato_id, especie, valor_variacao, nova_data_fim, descricao)
  SELECT c.id, 'partida',
         c.valor_atual - c.valor_inicial - coalesce(s.delta, 0),
         CASE WHEN c.data_fim_atual <> coalesce(s.fim, c.data_fim) THEN c.data_fim_atual END,
         'Situação anterior ao sistema: valor e prazo que já vinham alterados quando o contrato foi cadastrado.'
    FROM public.contratos c
    LEFT JOIN LATERAL (
      SELECT sum(a.valor_acrescimo - a.valor_supressao + a.valor_variacao) AS delta,
             (SELECT a2.nova_data_fim FROM public.contrato_alteracoes a2
               WHERE a2.contrato_id = c.id AND a2.nova_data_fim IS NOT NULL
               ORDER BY a2.data_assinatura DESC NULLS LAST, a2.created_at DESC, a2.nova_data_fim DESC LIMIT 1) AS fim
        FROM public.contrato_alteracoes a WHERE a.contrato_id = c.id
    ) s ON true
   WHERE c.valor_atual IS NOT NULL AND c.valor_inicial IS NOT NULL
     AND (c.valor_atual - c.valor_inicial - coalesce(s.delta, 0) <> 0
          OR c.data_fim_atual <> coalesce(s.fim, c.data_fim))
     AND NOT EXISTS (SELECT 1 FROM public.contrato_alteracoes p WHERE p.contrato_id = c.id AND p.especie = 'partida');

  ALTER TABLE public.contrato_alteracoes ENABLE TRIGGER trg_contrato_alteracoes_preparar;
  ALTER TABLE public.contrato_alteracoes ENABLE TRIGGER trg_contrato_alteracoes_aplicar;
  ALTER TABLE public.contrato_alteracoes ENABLE TRIGGER trg_audit_contrato_alteracoes;

  -- conferência: quantos contratos teriam o valor ou o fim mudado ao serem regravados (o esperado é nenhum)
  SELECT count(*) INTO v_divergem
    FROM public.contratos c
    LEFT JOIN LATERAL (
      SELECT coalesce(sum(a.valor_acrescimo - a.valor_supressao + a.valor_variacao), 0) AS delta,
             (SELECT a2.nova_data_fim FROM public.contrato_alteracoes a2
               WHERE a2.contrato_id = c.id AND a2.nova_data_fim IS NOT NULL
               ORDER BY (a2.especie = 'partida'), a2.data_assinatura DESC NULLS LAST, a2.created_at DESC, a2.nova_data_fim DESC
               LIMIT 1) AS fim,
             (SELECT a3.data_inicio FROM public.contrato_alteracoes a3
               WHERE a3.contrato_id = c.id AND a3.especie = 'rescisao') AS rescisao
        FROM public.contrato_alteracoes a WHERE a.contrato_id = c.id
    ) s ON true
   WHERE c.valor_atual IS DISTINCT FROM c.valor_inicial + s.delta
      OR c.data_fim_atual IS DISTINCT FROM coalesce(s.rescisao, s.fim, c.data_fim);
  RAISE NOTICE 'Contratos C2: % contrato(s) com valor ou fim diferente do calculado pelas alterações.', v_divergem;
END $$;

DROP TABLE IF EXISTS public.aditivos_contrato;
DROP TYPE IF EXISTS public.tipo_aditivo;

-- ----------------------------------------------------------------------------
-- 5. O sino: contratos que vencem
-- ----------------------------------------------------------------------------
-- Vigentes ou suspensos que vencem em até 120 dias (ou já venceram): os do gestor e dos fiscais em exercício (pelo
-- servidor do perfil) e, para quem tem contratos.editar com o módulo, todos. Só o que o aviso precisa (nº, objeto
-- resumido, fim, papel); `abre_ficha` diz se a pessoa tem a rota da ficha (o servidor designado pode não ter o módulo).
CREATE OR REPLACE FUNCTION public.contratos_meus_vencimentos()
RETURNS TABLE (
  contrato_id uuid,
  numero text,
  objeto text,
  data_fim_atual date,
  dias integer,
  papeis text[],
  abre_ficha boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH eu AS (
    SELECT auth.uid() AS uid,
           (SELECT p.servidor_id FROM public.profiles p WHERE p.id = auth.uid()) AS servidor_id,
           (now() AT TIME ZONE 'America/Boa_Vista')::date AS hoje
  ), acesso AS (
    SELECT eu.*,
           public.perfil_ativo_atual() AS ativo,
           (public.can_access_module(eu.uid, 'compras') OR public.can_access_module(eu.uid, 'contratos'))
             AND public.has_permission_code(eu.uid, 'contratos.editar') AS todos,
           public.can_access_module(eu.uid, 'contratos')
             AND (public.has_permission_code(eu.uid, 'contratos.visualizar')
                  OR public.has_permission_code(eu.uid, 'contratos.criar')
                  OR public.has_permission_code(eu.uid, 'contratos.editar')) AS abre
      FROM eu
  )
  SELECT c.id, c.numero_contrato || '/' || c.ano, left(coalesce(c.objeto_resumido, c.objeto), 200),
         c.data_fim_atual, (c.data_fim_atual - a.hoje)::integer,
         coalesce((SELECT array_agg(DISTINCT r.papel ORDER BY r.papel) FROM public.contrato_responsaveis r
                    WHERE r.contrato_id = c.id AND r.data_fim IS NULL AND r.servidor_id = a.servidor_id), '{}'),
         a.abre
    FROM public.contratos c, acesso a
   WHERE a.uid IS NOT NULL AND a.ativo
     AND c.status IN ('vigente', 'aditado', 'suspenso')
     AND c.data_fim_atual <= a.hoje + 120
     AND (a.todos OR EXISTS (SELECT 1 FROM public.contrato_responsaveis r
                              WHERE r.contrato_id = c.id AND r.data_fim IS NULL AND r.servidor_id = a.servidor_id))
   -- primeiro o que ainda vai vencer (o mais próximo antes), depois os vencidos (o mais recente antes): vencido antigo
   -- esquecido como vigente não esconde o que vence nesta semana
   ORDER BY c.data_fim_atual < a.hoje, CASE WHEN c.data_fim_atual >= a.hoje THEN c.data_fim_atual END, c.data_fim_atual DESC,
            c.ano, c.numero_contrato
   LIMIT 50
$$;
COMMENT ON FUNCTION public.contratos_meus_vencimentos() IS
  'Sino de avisos: contratos vigentes ou suspensos que vencem em até 120 dias (ou venceram), do gestor e dos fiscais em exercício (pelo servidor do perfil) e, com contratos.editar, todos. Migração 20261114090000.';
REVOKE ALL ON FUNCTION public.contratos_meus_vencimentos() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.contratos_meus_vencimentos() TO authenticated;

-- ----------------------------------------------------------------------------
-- 6. Importação por planilha (Central de Importações; p_simular = true só calcula)
-- ----------------------------------------------------------------------------
-- Mesmo contrato das outras RPCs de importação (src/lib/importacao/types.ts): devolve simulacao, importacao_id,
-- totais, linhas (indice, acao, mudancas, avisos), erros e criados; aplicação é tudo ou nada e fica em importacoes.
-- Cada linha (chaves já tratadas pela tela: datas AAAA-MM-DD, números sem máscara, prorrogavel true/false):
--   indice, numero, ano, processo_sei, numero_pncp, documento, razao_social, objeto, objeto_resumido, tipo_contrato,
--   fundamento_legal, valor_inicial, valor_atual, data_assinatura, data_inicio, data_fim, situacao, setor_sigla,
--   natureza_despesa, prorrogavel, prazo_maximo_meses, gestor_matricula, fiscal_tecnico_matricula,
--   fiscal_administrativo_matricula, portaria_numero, portaria_data, data_publicacao_doe, numero_doe.
-- Contrato que já existe (número + ano) só ganha o que está vazio; nunca é sobrescrito nem apagado. SECURITY DEFINER
-- como as outras importações (lê o RH para achar a matrícula e grava o log), mas os gatilhos de contratos continuam
-- valendo: cadastrar exige contratos.criar e completar campo vazio de contrato existente exige contratos.editar (erro
-- na linha). Designar gestor e fiscais pela matrícula basta contratos.criar, como na ficha.
CREATE OR REPLACE FUNCTION public.contratos_importar_planilha(
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
  l jsonb;
  v_ind integer;
  v_numero text;
  v_ano integer;
  v_chave text;
  v_chaves text[] := '{}';
  v_doc text;
  v_digitos text;
  v_razao text;
  v_fornecedor uuid;
  v_unidade uuid;
  v_ct public.contratos%ROWTYPE;
  v_id uuid;
  v_acao text;
  v_mudancas jsonb;
  v_avisos jsonb;
  v_mat text;
  v_servidor uuid;
  v_nome text;
  v_papel text;
  v_rotulo text;
  v_difere text[];
  v_inicio_resp date;
  v_valor_atual numeric;
  v_campo text;
  v_valor text;
  v_linhas_res jsonb := '[]'::jsonb;
  v_erros jsonb := '[]'::jsonb;
  v_detalhes jsonb := '[]'::jsonb;
  v_contratados text[] := '{}';
  v_designacoes text[] := '{}';
  v_ins integer := 0; v_atu integer := 0; v_igual integer := 0;
  v_totais jsonb;
  v_import_id uuid;
BEGIN
  p_simular := coalesce(p_simular, true);

  IF v_uid IS NULL
     OR NOT coalesce(public.perfil_ativo_atual()
                     AND (public.can_access_module(v_uid, 'contratos') OR public.can_access_module(v_uid, 'compras'))
                     AND public.has_permission_code(v_uid, 'contratos.criar'), false) THEN
    RAISE EXCEPTION 'Importar contratos exige a permissão "Criar contratos".' USING ERRCODE = '42501';
  END IF;
  IF jsonb_typeof(p_linhas) IS DISTINCT FROM 'array' OR jsonb_array_length(p_linhas) NOT BETWEEN 1 AND 1000 THEN
    RAISE EXCEPTION 'Envie de 1 a 1000 contratos.' USING ERRCODE = '22023';
  END IF;
  IF NOT p_simular AND (
       char_length(coalesce(p_arquivo->>'nome', '')) NOT BETWEEN 1 AND 255
       OR coalesce(p_arquivo->>'sha256', '') !~ '^[0-9a-f]{64}$'
       OR coalesce(p_arquivo->>'tamanho', '') !~ '^\d{1,15}$') THEN
    RAISE EXCEPTION 'Dados do arquivo inválidos.' USING ERRCODE = '22023';
  END IF;

  BEGIN
    FOR l IN SELECT value FROM jsonb_array_elements(p_linhas) LOOP
      v_ind := coalesce((l->>'indice')::integer, -1);
      BEGIN
        IF jsonb_typeof(l) <> 'object' THEN
          RAISE EXCEPTION 'Linha em formato inválido.' USING ERRCODE = '22023';
        END IF;
        v_numero := nullif(btrim(l->>'numero'), '');
        v_ano := nullif(btrim(l->>'ano'), '')::integer;
        IF v_numero IS NULL OR v_ano IS NULL THEN
          RAISE EXCEPTION 'Falta o número ou o ano do contrato.' USING ERRCODE = '22023';
        END IF;
        IF v_ano NOT BETWEEN 1990 AND 2100 THEN
          RAISE EXCEPTION 'Ano % fora do intervalo.', v_ano USING ERRCODE = '22023';
        END IF;
        -- "1" e "01" são o mesmo contrato (zeros à esquerda não contam)
        v_chave := ltrim(lower(v_numero), '0') || '/' || v_ano;
        IF v_chave = ANY (v_chaves) THEN
          RAISE EXCEPTION 'O contrato %/% aparece duas vezes na planilha.', v_numero, v_ano USING ERRCODE = '22023';
        END IF;
        v_chaves := v_chaves || v_chave;
        v_mudancas := '{}'::jsonb;
        v_avisos := '[]'::jsonb;

        -- setor que pediu (sigla da estrutura)
        v_unidade := NULL;
        IF nullif(btrim(l->>'setor_sigla'), '') IS NOT NULL THEN
          SELECT u.id INTO v_unidade FROM public.estrutura_organizacional u
           WHERE lower(u.sigla) = lower(btrim(l->>'setor_sigla')) AND u.ativo IS NOT FALSE
           ORDER BY u.nivel LIMIT 1;
          IF v_unidade IS NULL THEN
            v_avisos := v_avisos || to_jsonb(format('Setor "%s" não encontrado na estrutura: fica em branco.', btrim(l->>'setor_sigla')));
          END IF;
        END IF;

        SELECT * INTO v_ct FROM public.contratos c
         WHERE ltrim(lower(c.numero_contrato), '0') = ltrim(lower(v_numero), '0') AND c.ano = v_ano
         ORDER BY (lower(c.numero_contrato) = lower(v_numero)) DESC
         LIMIT 1
         FOR UPDATE;
        IF NOT FOUND THEN
          -- contratado: pelo documento (só dígitos); cadastra se não existir
          v_doc := nullif(btrim(l->>'documento'), '');
          v_digitos := regexp_replace(coalesce(v_doc, ''), '\D', '', 'g');
          IF char_length(v_digitos) NOT IN (11, 14) THEN
            RAISE EXCEPTION 'CPF ou CNPJ do contratado ausente ou inválido.' USING ERRCODE = '22023';
          END IF;
          SELECT f.id INTO v_fornecedor FROM public.fornecedores f
           WHERE regexp_replace(f.cpf_cnpj, '\D', '', 'g') = v_digitos
           ORDER BY f.ativo DESC NULLS LAST LIMIT 1;
          IF v_fornecedor IS NULL THEN
            v_razao := nullif(btrim(l->>'razao_social'), '');
            IF v_razao IS NULL THEN
              RAISE EXCEPTION 'Contratado % não cadastrado e sem razão social na planilha.', v_doc USING ERRCODE = '22023';
            END IF;
            INSERT INTO public.fornecedores (tipo_pessoa, cpf_cnpj, razao_social, created_by)
            VALUES (CASE WHEN char_length(v_digitos) = 14 THEN 'PJ' ELSE 'PF' END, v_doc, v_razao, v_uid)
            RETURNING id INTO v_fornecedor;
            v_contratados := v_contratados || v_razao;
          END IF;
          IF nullif(btrim(l->>'objeto'), '') IS NULL THEN
            RAISE EXCEPTION 'Falta o objeto.' USING ERRCODE = '22023';
          END IF;
          IF nullif(l->>'valor_inicial', '') IS NULL OR nullif(l->>'data_assinatura', '') IS NULL
             OR nullif(l->>'data_inicio', '') IS NULL OR nullif(l->>'data_fim', '') IS NULL THEN
            RAISE EXCEPTION 'Faltam valor inicial, assinatura, início ou fim da vigência.' USING ERRCODE = '22023';
          END IF;

          INSERT INTO public.contratos (
            numero_contrato, ano, processo_sei, numero_pncp, fornecedor_id, objeto, objeto_resumido, tipo_contrato,
            fundamento_legal, valor_inicial, valor_atual, data_assinatura, data_inicio, data_fim, status,
            unidade_demandante_id, natureza_despesa, prorrogavel, prazo_maximo_meses, data_publicacao_doe, numero_doe,
            created_by)
          VALUES (
            v_numero, v_ano, nullif(btrim(l->>'processo_sei'), ''), nullif(btrim(l->>'numero_pncp'), ''), v_fornecedor,
            btrim(l->>'objeto'), nullif(btrim(l->>'objeto_resumido'), ''), nullif(btrim(l->>'tipo_contrato'), ''),
            nullif(btrim(l->>'fundamento_legal'), ''), (l->>'valor_inicial')::numeric,
            (l->>'valor_inicial')::numeric,  -- o valor atual sai das alterações (contratos_preparar)
            (l->>'data_assinatura')::date, (l->>'data_inicio')::date, (l->>'data_fim')::date,
            coalesce(nullif(btrim(l->>'situacao'), ''), 'vigente')::public.status_contrato,
            v_unidade, nullif(btrim(l->>'natureza_despesa'), ''), coalesce(nullif(l->>'prorrogavel', '')::boolean, false),
            nullif(l->>'prazo_maximo_meses', '')::integer, nullif(l->>'data_publicacao_doe', '')::date,
            nullif(btrim(l->>'numero_doe'), ''), v_uid)
          RETURNING id INTO v_id;
          v_acao := 'inserir';
          -- valor atual diferente do inicial: o que já vinha alterado vira a situação anterior ao sistema
          v_valor_atual := nullif(l->>'valor_atual', '')::numeric;
          IF v_valor_atual IS NOT NULL AND v_valor_atual <> (l->>'valor_inicial')::numeric THEN
            IF coalesce(nullif(btrim(l->>'situacao'), ''), 'vigente') = 'rascunho' THEN
              v_avisos := v_avisos || to_jsonb('Contrato em rascunho: o valor atual da planilha ficou de fora (vale o inicial).'::text);
            ELSE
              INSERT INTO public.contrato_alteracoes (contrato_id, especie, valor_variacao, descricao)
              VALUES (v_id, 'partida', v_valor_atual - (l->>'valor_inicial')::numeric,
                      'Situação anterior ao sistema: valor atual informado na planilha de importação.');
              v_avisos := v_avisos || to_jsonb(
                'Valor atual diferente do inicial: a diferença fica como "situação anterior ao sistema" na aba Alterações.'::text);
            END IF;
          END IF;
        ELSE
          v_id := v_ct.id;
          -- o que a planilha traz diferente do cadastro não muda (valor e prazo mudam pela aba Alterações): só avisa
          v_difere := array_remove(ARRAY[
            CASE WHEN nullif(l->>'valor_inicial', '')::numeric IS DISTINCT FROM v_ct.valor_inicial
                  AND nullif(l->>'valor_inicial', '') IS NOT NULL THEN 'valor inicial' END,
            CASE WHEN nullif(l->>'valor_atual', '')::numeric IS DISTINCT FROM v_ct.valor_atual
                  AND nullif(l->>'valor_atual', '') IS NOT NULL THEN 'valor atual' END,
            CASE WHEN nullif(l->>'data_fim', '') IS NOT NULL
                  AND (l->>'data_fim')::date IS DISTINCT FROM v_ct.data_fim
                  AND (l->>'data_fim')::date IS DISTINCT FROM v_ct.data_fim_atual THEN 'fim da vigência' END,
            CASE WHEN nullif(regexp_replace(coalesce(l->>'documento', ''), '\D', '', 'g'), '') IS DISTINCT FROM
                      (SELECT regexp_replace(f.cpf_cnpj, '\D', '', 'g') FROM public.fornecedores f WHERE f.id = v_ct.fornecedor_id)
                  AND nullif(btrim(l->>'documento'), '') IS NOT NULL THEN 'CNPJ ou CPF do contratado' END
          ], NULL);
          IF cardinality(v_difere) > 0 THEN
            v_avisos := v_avisos || to_jsonb(format('A planilha difere do cadastro em %s: ficou o que está no sistema (valor e prazo mudam pela aba Alterações da ficha).',
                                                   array_to_string(v_difere, ', ')));
          END IF;
          -- só completa o que está vazio (campo → [antes, depois])
          FOR v_campo, v_valor IN
            SELECT k, v FROM (VALUES
              ('processo_sei', CASE WHEN v_ct.processo_sei IS NULL THEN nullif(btrim(l->>'processo_sei'), '') END),
              ('numero_pncp', CASE WHEN v_ct.numero_pncp IS NULL THEN nullif(btrim(l->>'numero_pncp'), '') END),
              ('objeto_resumido', CASE WHEN v_ct.objeto_resumido IS NULL THEN nullif(btrim(l->>'objeto_resumido'), '') END),
              ('tipo_contrato', CASE WHEN v_ct.tipo_contrato IS NULL THEN nullif(btrim(l->>'tipo_contrato'), '') END),
              ('fundamento_legal', CASE WHEN v_ct.fundamento_legal IS NULL THEN nullif(btrim(l->>'fundamento_legal'), '') END),
              ('natureza_despesa', CASE WHEN v_ct.natureza_despesa IS NULL THEN nullif(btrim(l->>'natureza_despesa'), '') END),
              ('prazo_maximo_meses', CASE WHEN v_ct.prazo_maximo_meses IS NULL THEN nullif(l->>'prazo_maximo_meses', '') END),
              ('data_publicacao_doe', CASE WHEN v_ct.data_publicacao_doe IS NULL THEN nullif(l->>'data_publicacao_doe', '') END),
              ('numero_doe', CASE WHEN v_ct.numero_doe IS NULL THEN nullif(btrim(l->>'numero_doe'), '') END),
              ('unidade_demandante_id', CASE WHEN v_ct.unidade_demandante_id IS NULL AND v_unidade IS NOT NULL
                                             THEN btrim(l->>'setor_sigla') END)
            ) AS x(k, v) WHERE v IS NOT NULL
          LOOP
            v_mudancas := v_mudancas || jsonb_build_object(v_campo, jsonb_build_array(NULL, v_valor));
          END LOOP;
          IF v_mudancas <> '{}'::jsonb THEN
            UPDATE public.contratos c SET
              processo_sei = coalesce(c.processo_sei, nullif(btrim(l->>'processo_sei'), '')),
              numero_pncp = coalesce(c.numero_pncp, nullif(btrim(l->>'numero_pncp'), '')),
              objeto_resumido = coalesce(c.objeto_resumido, nullif(btrim(l->>'objeto_resumido'), '')),
              tipo_contrato = coalesce(c.tipo_contrato, nullif(btrim(l->>'tipo_contrato'), '')),
              fundamento_legal = coalesce(c.fundamento_legal, nullif(btrim(l->>'fundamento_legal'), '')),
              natureza_despesa = coalesce(c.natureza_despesa, nullif(btrim(l->>'natureza_despesa'), '')),
              prazo_maximo_meses = coalesce(c.prazo_maximo_meses, nullif(l->>'prazo_maximo_meses', '')::integer),
              data_publicacao_doe = coalesce(c.data_publicacao_doe, nullif(l->>'data_publicacao_doe', '')::date),
              numero_doe = coalesce(c.numero_doe, nullif(btrim(l->>'numero_doe'), '')),
              unidade_demandante_id = coalesce(c.unidade_demandante_id, v_unidade)
             WHERE c.id = v_id;
          END IF;
          v_acao := 'sem_alteracao';
        END IF;

        -- responsáveis (matrícula); a portaria da linha vale para os três
        FOREACH v_papel IN ARRAY ARRAY['gestor', 'fiscal_tecnico', 'fiscal_administrativo'] LOOP
          v_mat := nullif(btrim(l->>(v_papel || '_matricula')), '');
          CONTINUE WHEN v_mat IS NULL;
          v_rotulo := CASE v_papel WHEN 'gestor' THEN 'gestor' WHEN 'fiscal_tecnico' THEN 'fiscal técnico'
                        ELSE 'fiscal administrativo' END;
          SELECT s.id, s.nome_completo INTO v_servidor, v_nome FROM public.servidores s
           WHERE s.matricula = v_mat AND s.ativo IS NOT FALSE
           LIMIT 1;
          IF v_servidor IS NULL THEN
            v_avisos := v_avisos || to_jsonb(format('Matrícula %s (%s) não encontrada entre os servidores ativos.',
              v_mat, v_rotulo));
            CONTINUE;
          END IF;
          -- já designado neste papel: nada a fazer
          CONTINUE WHEN EXISTS (SELECT 1 FROM public.contrato_responsaveis r
                                 WHERE r.contrato_id = v_id AND r.data_fim IS NULL
                                   AND r.servidor_id = v_servidor AND r.papel = v_papel);
          -- só um gestor em exercício: a troca é na ficha (encerra a designação antiga e designa o novo)
          IF v_papel = 'gestor' AND EXISTS (SELECT 1 FROM public.contrato_responsaveis r
                                             WHERE r.contrato_id = v_id AND r.data_fim IS NULL AND r.papel = 'gestor') THEN
            v_avisos := v_avisos || to_jsonb(format(
              'O contrato já tem gestor em exercício: a matrícula %s não foi designada (troque na ficha do contrato).', v_mat));
            CONTINUE;
          END IF;
          v_inicio_resp := coalesce(nullif(l->>'portaria_data', '')::date, nullif(l->>'data_inicio', '')::date,
                                    (SELECT c.data_inicio FROM public.contratos c WHERE c.id = v_id));
          INSERT INTO public.contrato_responsaveis (contrato_id, servidor_id, papel, portaria_numero, portaria_data, data_inicio)
          VALUES (v_id, v_servidor, v_papel, nullif(btrim(l->>'portaria_numero'), ''),
                  nullif(l->>'portaria_data', '')::date, v_inicio_resp);
          v_designacoes := v_designacoes || format('%s/%s: %s (%s)', v_numero, v_ano, v_nome, v_rotulo);
          IF v_acao <> 'inserir' THEN
            v_mudancas := v_mudancas || jsonb_build_object(v_papel, jsonb_build_array(NULL, v_nome));
          END IF;
        END LOOP;
        IF v_acao <> 'inserir' AND v_mudancas <> '{}'::jsonb THEN
          v_acao := 'atualizar';
        END IF;

        CASE v_acao WHEN 'inserir' THEN v_ins := v_ins + 1; WHEN 'atualizar' THEN v_atu := v_atu + 1; ELSE v_igual := v_igual + 1; END CASE;
        v_linhas_res := v_linhas_res || jsonb_build_object('indice', v_ind, 'acao', v_acao,
          'mudancas', CASE WHEN v_mudancas <> '{}'::jsonb THEN v_mudancas END,
          'avisos', CASE WHEN jsonb_array_length(v_avisos) > 0 THEN v_avisos END);
        v_detalhes := v_detalhes || jsonb_build_object('indice', v_ind, 'contrato', v_numero || '/' || v_ano,
          'acao', v_acao, 'contrato_id', v_id);
      EXCEPTION
        WHEN OTHERS THEN
          v_erros := v_erros || jsonb_build_object('indice', v_ind, 'mensagem',
            CASE WHEN left(SQLSTATE, 2) IN ('22', '23') OR SQLSTATE IN ('P0001', '42501') THEN SQLERRM
                 ELSE format('Erro inesperado ao gravar a linha (código %s).', SQLSTATE) END);
      END;
    END LOOP;

    IF p_simular OR jsonb_array_length(v_erros) > 0 THEN
      RAISE EXCEPTION 'importação desfeita' USING ERRCODE = 'PRI01';
    END IF;
  EXCEPTION
    WHEN SQLSTATE 'PRI01' THEN NULL;  -- desfaz tudo o que as linhas gravaram; as variáveis continuam valendo
  END;

  v_totais := jsonb_build_object('inserir', v_ins, 'atualizar', v_atu, 'sem_alteracao', v_igual);

  IF NOT p_simular AND jsonb_array_length(v_erros) = 0 THEN
    INSERT INTO public.importacoes
      (tipo, modulo, arquivo_nome, arquivo_sha256, arquivo_tamanho, exercicio, resumo, detalhes, created_by)
    VALUES
      ('contratos_planilha', 'contratos', p_arquivo->>'nome', p_arquivo->>'sha256', (p_arquivo->>'tamanho')::bigint,
       NULL, jsonb_build_object('totais', v_totais), v_detalhes, v_uid)
    RETURNING id INTO v_import_id;
  END IF;

  RETURN jsonb_build_object(
    'simulacao', p_simular,
    'importacao_id', v_import_id,
    'totais', v_totais,
    'linhas', v_linhas_res,
    'erros', v_erros,
    'criados', jsonb_strip_nulls(jsonb_build_object(
      'Contratados', CASE WHEN cardinality(v_contratados) > 0 THEN to_jsonb(v_contratados) END,
      'Designações', CASE WHEN cardinality(v_designacoes) > 0 THEN to_jsonb(v_designacoes) END)));
END;
$$;
COMMENT ON FUNCTION public.contratos_importar_planilha(jsonb, jsonb, boolean) IS
  'Importa a planilha de contratos vigentes (p_simular = true só calcula; aplicação é tudo ou nada, com log em importacoes). Nunca apaga nem sobrescreve: contrato existente só ganha o que está vazio. Exige contratos.criar (completar campo vazio de contrato existente exige também contratos.editar; designar pela matrícula basta criar). Contrato novo com valor atual diferente do inicial ganha a situação anterior ao sistema (partida). Migrações 20261104090000 e 20261114090000.';
REVOKE ALL ON FUNCTION public.contratos_importar_planilha(jsonb, jsonb, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.contratos_importar_planilha(jsonb, jsonb, boolean) TO authenticated;

-- ----------------------------------------------------------------------------
-- 7. Localizador do SEI: o processo da alteração e o da renovação também levam ao contrato
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.localizar_processos_sei(p_termo text, p_limite integer DEFAULT 50)
RETURNS TABLE (
  chave text,
  numero_sei text,
  origem text,
  registro_id uuid,
  ref text,
  titulo text,
  situacao text,
  onde text,
  atualizado_em date,
  valor numeric
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  WITH termo AS (
    SELECT btrim(coalesce(p_termo, '')) AS t
  ), busca AS (
    SELECT t,
           public.sei_normalizar(t) AS chave,
           regexp_replace(t, '\D', '', 'g') AS digitos,
           t ~ '^[0-9\s./-]+$' AS so_numero,
           '%' || replace(replace(replace(public.texto_busca(t), '\', '\\'), '%', '\%'), '_', '\_') || '%' AS padrao
      FROM termo
     WHERE char_length(t) >= 3
  ), fontes AS (
    SELECT p.numero_sei, 'workflow'::text AS origem, p.id, NULL::text AS ref, p.assunto AS titulo, p.status::text AS situacao,
           u.sigla AS onde, coalesce(p.etapa_iniciada_em, p.updated_at)::date AS atualizado_em, NULL::numeric AS valor,
           concat_ws(' ', p.numero_processo, p.assunto, p.interessado_nome, u.sigla, u.nome) AS texto
      FROM public.processos_administrativos p
      LEFT JOIN public.estrutura_organizacional u ON u.id = p.unidade_atual_id
    UNION ALL
    SELECT l.numero_processo, 'contratacao', l.id, NULL, coalesce(l.objeto_resumido, l.objeto), l.etapa, l.setor_atual,
           l.atualizado_em, l.valor_estimado,
           concat_ws(' ', l.objeto, l.objeto_resumido, l.setor_atual, l.situacao_atual)
      FROM public.processos_licitatorios l
    UNION ALL
    SELECT ct.processo_sei, 'contrato', ct.id, ct.numero_contrato || '/' || ct.ano,
           concat_ws(' · ', 'Contrato ' || ct.numero_contrato || '/' || ct.ano, coalesce(ct.objeto_resumido, ct.objeto)),
           ct.status::text, f.razao_social, coalesce(ct.updated_at, ct.created_at)::date, ct.valor_atual,
           concat_ws(' ', ct.numero_contrato, ct.objeto, ct.objeto_resumido, f.razao_social, f.nome_fantasia)
      FROM public.contratos ct
      LEFT JOIN public.fornecedores f ON f.id = ct.fornecedor_id
     WHERE nullif(btrim(ct.processo_sei), '') IS NOT NULL
    UNION ALL
    -- alteração com processo próprio (ex.: a prorrogação), um por contrato e processo (a mais recente)
    (SELECT DISTINCT ON (public.sei_normalizar(a.processo_sei), a.contrato_id)
           a.processo_sei, 'contrato', a.contrato_id, ct.numero_contrato || '/' || ct.ano,
           concat_ws(' · ', 'Contrato ' || ct.numero_contrato || '/' || ct.ano,
                     CASE a.especie WHEN 'aditivo' THEN a.numero || 'º termo aditivo'
                                    WHEN 'apostilamento' THEN a.numero || 'º apostilamento'
                                    WHEN 'suspensao' THEN 'suspensão' WHEN 'rescisao' THEN 'rescisão'
                                    ELSE 'situação anterior' END,
                     coalesce(ct.objeto_resumido, ct.objeto)),
           ct.status::text, f.razao_social, coalesce(a.updated_at, a.created_at)::date, ct.valor_atual,
           concat_ws(' ', ct.numero_contrato, a.descricao, ct.objeto_resumido, f.razao_social)
      FROM public.contrato_alteracoes a
      JOIN public.contratos ct ON ct.id = a.contrato_id
      LEFT JOIN public.fornecedores f ON f.id = ct.fornecedor_id
     WHERE nullif(btrim(a.processo_sei), '') IS NOT NULL
       AND public.sei_normalizar(a.processo_sei) IS DISTINCT FROM public.sei_normalizar(ct.processo_sei)
     ORDER BY public.sei_normalizar(a.processo_sei), a.contrato_id, coalesce(a.data_assinatura, a.data_inicio) DESC NULLS LAST,
              a.created_at DESC)
    UNION ALL
    -- processo aberto para a renovação (providência do vencimento), se ainda não é o de uma alteração
    SELECT ct.renovacao_processo_sei, 'contrato', ct.id, ct.numero_contrato || '/' || ct.ano,
           concat_ws(' · ', 'Contrato ' || ct.numero_contrato || '/' || ct.ano,
                     CASE ct.renovacao_providencia WHEN 'prorrogar' THEN 'prorrogação'
                                                   WHEN 'nova_contratacao' THEN 'nova contratação'
                                                   WHEN 'encerrar' THEN 'encerramento' ELSE 'renovação' END,
                     coalesce(ct.objeto_resumido, ct.objeto)),
           ct.status::text, f.razao_social, coalesce(ct.renovacao_atualizada_em, ct.updated_at)::date, ct.valor_atual,
           concat_ws(' ', ct.numero_contrato, ct.renovacao_observacao, ct.objeto_resumido, f.razao_social)
      FROM public.contratos ct
      LEFT JOIN public.fornecedores f ON f.id = ct.fornecedor_id
     WHERE nullif(btrim(ct.renovacao_processo_sei), '') IS NOT NULL
       AND public.sei_normalizar(ct.renovacao_processo_sei) IS DISTINCT FROM public.sei_normalizar(ct.processo_sei)
       AND NOT EXISTS (SELECT 1 FROM public.contrato_alteracoes a
                        WHERE a.contrato_id = ct.id
                          AND public.sei_normalizar(a.processo_sei) = public.sei_normalizar(ct.renovacao_processo_sei))
    UNION ALL
    SELECT pp.numero_sei, 'passagem', pp.id, NULL, coalesce(pp.evento, pp.finalidade), pp.situacao,
           concat_ws('/', pp.destino_cidade, pp.destino_uf), pp.updated_at::date, NULL,
           concat_ws(' ', pp.finalidade, pp.evento, pp.solicitante_nome, pp.destino_cidade)
      FROM public.passagem_pedidos pp
    UNION ALL
    SELECT i.numero_sei, 'pca', i.id, pl.exercicio::text, i.descricao, i.situacao, 'PCA ' || pl.exercicio,
           i.updated_at::date, i.valor_total, i.descricao
      FROM public.pca_itens i
      JOIN public.pca_planos pl ON pl.id = i.plano_id
     WHERE i.situacao <> 'excluido'
    UNION ALL
    SELECT e.processo_sei, 'empenho', e.id, NULL, concat_ws(' · ', 'Empenho ' || e.numero, e.credor_nome), e.status::text,
           NULL, e.data_empenho, e.valor_empenhado,
           concat_ws(' ', e.numero, e.objeto, e.credor_nome, e.ped_numero)
      FROM public.fin_empenhos e
     WHERE nullif(btrim(e.processo_sei), '') IS NOT NULL
    UNION ALL
    SELECT d.processo_sei, 'documento', d.id, d.tipo::text, concat_ws(' · ', d.numero, d.titulo), d.status::text, NULL,
           coalesce(d.data_documento, d.created_at::date), NULL,
           concat_ws(' ', d.numero, d.titulo, d.ementa)
      FROM public.documentos d
     WHERE nullif(btrim(d.processo_sei), '') IS NOT NULL
    UNION ALL
    SELECT c.processo_sei, 'termo_cessao', c.id, c.unidade_local_id::text, concat_ws(' · ', 'Termo ' || c.numero_termo, c.cessionario_nome),
           c.status::text, NULL, coalesce(c.data_emissao::date, c.created_at::date), NULL,
           concat_ws(' ', c.numero_termo, c.cessionario_nome, c.finalidade)
      FROM public.termos_cessao c
     WHERE nullif(btrim(c.processo_sei), '') IS NOT NULL
    UNION ALL
    SELECT v.numero_sei_diarias, 'diaria', v.id, NULL, concat_ws(' · ', 'Diária', v.destino_cidade, v.finalidade), v.status,
           concat_ws('/', v.destino_cidade, v.destino_uf), v.data_saida, v.valor_total,
           concat_ws(' ', v.destino_cidade, v.finalidade, v.portaria_numero)
      FROM public.viagens_diarias v
     WHERE nullif(btrim(v.numero_sei_diarias), '') IS NOT NULL
  )
  SELECT public.sei_normalizar(f.numero_sei), f.numero_sei, f.origem, f.id, f.ref, f.titulo, f.situacao, f.onde,
         f.atualizado_em, f.valor
    FROM fontes f, busca b
   WHERE (b.chave IS NOT NULL AND public.sei_normalizar(f.numero_sei) = b.chave)
      OR (b.chave IS NULL AND b.so_numero AND char_length(b.digitos) >= 4
          AND regexp_replace(coalesce(f.numero_sei, ''), '\D', '', 'g') LIKE '%' || b.digitos || '%')
      OR (b.chave IS NULL AND NOT b.so_numero
          AND public.texto_busca(concat_ws(' ', f.numero_sei, f.texto)) LIKE b.padrao ESCAPE '\')
   ORDER BY f.atualizado_em DESC NULLS LAST, f.origem, f.id
   LIMIT least(greatest(coalesce(p_limite, 50), 1), 200)
$$;
COMMENT ON FUNCTION public.localizar_processos_sei(text, integer) IS
  'Localizador de processos do SEI: busca pelo nº (qualquer formato) ou por palavras em nove fontes (o contrato desde a migração 20261104090000; o processo da alteração e o da renovação do contrato desde a 20261114090000); INVOKER (cada fonte com a RLS dela).';
REVOKE ALL ON FUNCTION public.localizar_processos_sei(text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.localizar_processos_sei(text, integer) TO authenticated;

-- ----------------------------------------------------------------------------
-- 8. RLS (gerado de supabase/baseline/rls/mapa.csv por scripts/db/gerar-rls.mjs)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "rls_select" ON public.contrato_alteracoes;
CREATE POLICY "rls_select" ON public.contrato_alteracoes FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_insert" ON public.contrato_alteracoes;
CREATE POLICY "rls_insert" ON public.contrato_alteracoes FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.editar'));
DROP POLICY IF EXISTS "rls_update" ON public.contrato_alteracoes;
CREATE POLICY "rls_update" ON public.contrato_alteracoes FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.editar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.editar'));
DROP POLICY IF EXISTS "rls_delete" ON public.contrato_alteracoes;
CREATE POLICY "rls_delete" ON public.contrato_alteracoes FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.editar'));
