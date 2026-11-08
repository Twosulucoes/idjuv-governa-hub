-- ============================================================================
-- COMPRAS — processos SEI, P3a: prazos por processo, avisos por tipo, remarcar com motivo e pop-up de vencidos
-- ============================================================================
-- Plano: docs/superpowers/plans/2026-11-08-processos-sei-p3a-prazos.md (desenho do planejamento de 07/11; o dono
-- disse "vamos" em 08/11; o pop-up pode ser fechado e volta a cada entrada, a recomendação do desenho).
--
--   compras_prazo_tipos          tipos de prazo e os avisos padrão (dias antes); sempre tem o aviso de 1 dia.
--   processo_prazos              prazos de cada processo (tipo, data, responsável, avisos, situação). O tipo
--                                "proxima_acao" é o espelho da próxima ação da movimentação que vale (P2): nasce,
--                                muda e é cumprido pelo processo_recalcular_estado; os outros tipos são lançados à
--                                mão. Situação: aberto, remarcado, cumprido ou cancelado ("vencido" é calculado).
--   processo_prazo_remarcacoes   trilha das remarcações (data antes e depois, motivo, quem, quando); imutável.
--   compras_meus_prazos()        lista do pop-up e do sino: vencidos, vencem em até 3 dias, dia de aviso e parados
--                                (sem movimentação além do limite da etapa). Cada um vê os prazos de que é o
--                                responsável (pelo servidor do perfil); quem tem compras.processos.editar vê todos.
--
-- Nenhuma policy existente muda. Idempotente.
-- ============================================================================

SET lock_timeout = '10s';

-- ----------------------------------------------------------------------------
-- 1. Tipos de prazo
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.compras_prazo_tipos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL UNIQUE CHECK (tipo = ANY (ARRAY[
    'proxima_acao', 'resposta_orgao_externo', 'assinatura_contrato', 'vigencia_ata', 'vigencia_contrato', 'empenho',
    'liquidacao', 'pagamento', 'prestacao_contas'])),
  rotulo text NOT NULL CHECK (char_length(btrim(rotulo)) BETWEEN 3 AND 80),
  avisos_padrao integer[] NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid DEFAULT auth.uid()
);
ALTER TABLE public.compras_prazo_tipos ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.compras_prazo_tipos IS
  'Processos de contratação, P3: tipos de prazo e os avisos padrão (dias antes do vencimento). O aviso de 1 dia antes sempre fica.';

-- Avisos: dias entre 1 e 365, sem repetir, do maior para o menor, sempre com o 1 (o aviso de véspera não se desliga).
CREATE OR REPLACE FUNCTION public.compras_normalizar_avisos(p_avisos integer[])
RETURNS integer[]
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT array_agg(d ORDER BY d DESC)
    FROM (SELECT DISTINCT d FROM unnest(coalesce(p_avisos, '{}') || 1) AS d WHERE d BETWEEN 1 AND 365) x
$$;
REVOKE EXECUTE ON FUNCTION public.compras_normalizar_avisos(integer[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.compras_normalizar_avisos(integer[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.compras_prazo_tipos_preparar()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM unnest(NEW.avisos_padrao) d WHERE d IS NULL OR d NOT BETWEEN 1 AND 365) THEN
    RAISE EXCEPTION 'Os avisos são dias antes do prazo, de 1 a 365.' USING ERRCODE = '22023';
  END IF;
  NEW.avisos_padrao := public.compras_normalizar_avisos(NEW.avisos_padrao);
  NEW.rotulo := btrim(NEW.rotulo);
  IF TG_OP = 'UPDATE' THEN
    NEW.tipo := OLD.tipo;
  END IF;
  NEW.updated_at := now();
  NEW.updated_by := COALESCE(auth.uid(), NEW.updated_by);
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.compras_prazo_tipos_preparar() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_compras_prazo_tipos_preparar ON public.compras_prazo_tipos;
CREATE TRIGGER trg_compras_prazo_tipos_preparar BEFORE INSERT OR UPDATE ON public.compras_prazo_tipos
  FOR EACH ROW EXECUTE FUNCTION public.compras_prazo_tipos_preparar();

INSERT INTO public.compras_prazo_tipos (tipo, rotulo, avisos_padrao) VALUES
  ('proxima_acao', 'Próxima ação', '{3,1}'),
  ('resposta_orgao_externo', 'Resposta de órgão externo', '{5,2,1}'),
  ('assinatura_contrato', 'Assinatura do contrato', '{5,2,1}'),
  ('vigencia_ata', 'Vigência da ata', '{30,15,7,1}'),
  ('vigencia_contrato', 'Vigência do contrato', '{60,30,15,7,1}'),
  ('empenho', 'Empenho', '{5,2,1}'),
  ('liquidacao', 'Liquidação', '{5,2,1}'),
  ('pagamento', 'Pagamento', '{5,2,1}'),
  ('prestacao_contas', 'Prestação de contas', '{15,7,3,1}')
ON CONFLICT (tipo) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. Prazos do processo
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.processo_prazos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id uuid NOT NULL REFERENCES public.processos_licitatorios(id) ON DELETE CASCADE,
  tipo text NOT NULL REFERENCES public.compras_prazo_tipos(tipo),
  descricao text CHECK (descricao IS NULL OR char_length(descricao) <= 300),
  data_limite date NOT NULL,
  responsavel_servidor_id uuid REFERENCES public.servidores(id) ON DELETE SET NULL,
  responsavel_nome text,
  responsavel_setor text CHECK (responsavel_setor IS NULL OR char_length(responsavel_setor) <= 200),
  avisos_dias integer[] NOT NULL DEFAULT '{1}',
  situacao text NOT NULL DEFAULT 'aberto' CHECK (situacao = ANY (ARRAY['aberto', 'remarcado', 'cumprido', 'cancelado'])),
  andamento_id uuid UNIQUE REFERENCES public.processo_andamentos(id) ON DELETE SET NULL,
  remarcacao_motivo text CHECK (remarcacao_motivo IS NULL OR char_length(btrim(remarcacao_motivo)) BETWEEN 3 AND 500),
  concluido_em timestamptz,
  concluido_por uuid,
  conclusao_motivo text CHECK (conclusao_motivo IS NULL OR char_length(btrim(conclusao_motivo)) BETWEEN 3 AND 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.processo_prazos ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.processo_prazos IS
  'Prazos do processo de contratação (P3). O tipo proxima_acao espelha a próxima ação da movimentação que vale (processo_recalcular_estado); os outros são lançados à mão. "Vencido" é calculado (aberto ou remarcado com a data passada).';
COMMENT ON COLUMN public.processo_prazos.avisos_dias IS 'Dias antes do prazo em que o responsável é avisado; sempre inclui o 1.';
COMMENT ON COLUMN public.processo_prazos.andamento_id IS 'Movimentação de onde nasceu o prazo da próxima ação (só no tipo proxima_acao).';

CREATE INDEX IF NOT EXISTS idx_processo_prazos_processo ON public.processo_prazos (processo_id, data_limite);
CREATE INDEX IF NOT EXISTS idx_processo_prazos_abertos ON public.processo_prazos (data_limite)
  WHERE situacao IN ('aberto', 'remarcado');
CREATE INDEX IF NOT EXISTS idx_processo_prazos_responsavel ON public.processo_prazos (responsavel_servidor_id)
  WHERE situacao IN ('aberto', 'remarcado');

-- Antes de gravar (SECURITY INVOKER, para saber se quem grava é a API; o nome do servidor vem do gatilho seguinte).
-- Pela API (papel authenticated):
--   * o prazo da próxima ação não se lança nem se muda aqui (vem da movimentação; remarcar é corrigir o prazo dela);
--   * prazo novo nasce aberto, com responsável (servidor ou setor);
--   * prazo encerrado (cumprido ou cancelado) não muda mais;
--   * mudar a data é remarcar: exige motivo novo e a data não pode ficar no passado;
--   * cancelar exige motivo; cumprir carimba quem e quando.
CREATE OR REPLACE FUNCTION public.processo_prazo_preparar()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_api boolean := current_user IN ('authenticated', 'anon');
  v_hoje date := (now() AT TIME ZONE 'America/Boa_Vista')::date;
BEGIN
  IF EXISTS (SELECT 1 FROM unnest(NEW.avisos_dias) d WHERE d IS NULL OR d NOT BETWEEN 1 AND 365) THEN
    RAISE EXCEPTION 'Os avisos são dias antes do prazo, de 1 a 365.' USING ERRCODE = '22023';
  END IF;
  NEW.descricao := NULLIF(btrim(NEW.descricao), '');
  NEW.responsavel_setor := NULLIF(btrim(NEW.responsavel_setor), '');
  NEW.remarcacao_motivo := NULLIF(btrim(NEW.remarcacao_motivo), '');
  NEW.conclusao_motivo := NULLIF(btrim(NEW.conclusao_motivo), '');

  IF TG_OP = 'INSERT' THEN
    IF v_api AND (NEW.tipo = 'proxima_acao' OR NEW.andamento_id IS NOT NULL) THEN
      RAISE EXCEPTION 'O prazo da próxima ação nasce da movimentação (registre uma movimentação).' USING ERRCODE = '22023';
    END IF;
    IF NEW.responsavel_servidor_id IS NULL AND NEW.responsavel_setor IS NULL THEN
      RAISE EXCEPTION 'Informe o responsável pelo prazo (servidor ou setor).' USING ERRCODE = '22023';
    END IF;
    IF NEW.avisos_dias IS NULL OR cardinality(NEW.avisos_dias) = 0 OR NEW.avisos_dias = '{1}' THEN
      NEW.avisos_dias := coalesce((SELECT t.avisos_padrao FROM public.compras_prazo_tipos t WHERE t.tipo = NEW.tipo), '{1}');
    END IF;
    IF v_api THEN
      NEW.situacao := 'aberto';
      NEW.concluido_em := NULL;
      NEW.concluido_por := NULL;
      NEW.conclusao_motivo := NULL;
      NEW.remarcacao_motivo := NULL;
    END IF;
    NEW.created_by := COALESCE(auth.uid(), NEW.created_by);
    NEW.created_at := now();
  ELSE
    -- o que nunca muda
    NEW.processo_id := OLD.processo_id;
    NEW.tipo := OLD.tipo;
    NEW.andamento_id := CASE WHEN v_api THEN OLD.andamento_id ELSE NEW.andamento_id END;
    NEW.created_at := OLD.created_at;
    NEW.created_by := OLD.created_by;

    IF v_api THEN
      IF OLD.situacao IN ('cumprido', 'cancelado') THEN
        RAISE EXCEPTION 'Este prazo já foi encerrado e não pode mais mudar.' USING ERRCODE = '22023';
      END IF;
      IF OLD.tipo = 'proxima_acao' AND (
           NEW.data_limite IS DISTINCT FROM OLD.data_limite
           OR NEW.responsavel_servidor_id IS DISTINCT FROM OLD.responsavel_servidor_id
           OR NEW.responsavel_setor IS DISTINCT FROM OLD.responsavel_setor
           OR NEW.descricao IS DISTINCT FROM OLD.descricao
           OR NEW.situacao IS DISTINCT FROM OLD.situacao) THEN
        RAISE EXCEPTION 'A próxima ação muda pela movimentação: corrija o prazo dela na aba Andamento.' USING ERRCODE = '22023';
      END IF;
      IF NEW.situacao = 'remarcado' AND NEW.data_limite IS NOT DISTINCT FROM OLD.data_limite THEN
        NEW.situacao := OLD.situacao;
      END IF;
      IF NEW.data_limite IS DISTINCT FROM OLD.data_limite THEN
        IF NEW.remarcacao_motivo IS NULL OR NEW.remarcacao_motivo IS NOT DISTINCT FROM OLD.remarcacao_motivo THEN
          RAISE EXCEPTION 'Informe o motivo da remarcação (de 3 a 500 caracteres).' USING ERRCODE = '22023';
        END IF;
        IF NEW.data_limite < v_hoje THEN
          RAISE EXCEPTION 'A nova data do prazo não pode ficar no passado.' USING ERRCODE = '22023';
        END IF;
        IF NEW.situacao IN ('aberto', 'remarcado') THEN
          NEW.situacao := 'remarcado';
        END IF;
      ELSE
        NEW.remarcacao_motivo := OLD.remarcacao_motivo;
      END IF;
      IF NEW.situacao IS DISTINCT FROM OLD.situacao AND NEW.situacao IN ('cumprido', 'cancelado') THEN
        IF NEW.situacao = 'cancelado' AND (NEW.conclusao_motivo IS NULL OR NEW.conclusao_motivo IS NOT DISTINCT FROM OLD.conclusao_motivo) THEN
          RAISE EXCEPTION 'Informe o motivo do cancelamento (de 3 a 500 caracteres).' USING ERRCODE = '22023';
        END IF;
        NEW.concluido_em := now();
        NEW.concluido_por := auth.uid();
      ELSIF NEW.situacao IS NOT DISTINCT FROM OLD.situacao THEN
        NEW.concluido_em := OLD.concluido_em;
        NEW.concluido_por := OLD.concluido_por;
        NEW.conclusao_motivo := OLD.conclusao_motivo;
      ELSIF NEW.situacao = 'aberto' AND OLD.situacao = 'remarcado' THEN
        NEW.situacao := 'remarcado';
      END IF;
      IF NEW.responsavel_servidor_id IS NULL AND NEW.responsavel_setor IS NULL THEN
        RAISE EXCEPTION 'Informe o responsável pelo prazo (servidor ou setor).' USING ERRCODE = '22023';
      END IF;
    END IF;
    NEW.updated_at := now();
  END IF;

  NEW.avisos_dias := public.compras_normalizar_avisos(NEW.avisos_dias);
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.processo_prazo_preparar() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_processo_prazos_preparar ON public.processo_prazos;
CREATE TRIGGER trg_processo_prazos_preparar BEFORE INSERT OR UPDATE ON public.processo_prazos
  FOR EACH ROW EXECUTE FUNCTION public.processo_prazo_preparar();

-- O nome do responsável vem sempre do servidor (não se escreve à mão). SECURITY DEFINER porque quem vê processos não
-- lê servidores. Roda depois do preparar (gatilhos BEFORE vão em ordem alfabética: "preparar" < "responsavel").
CREATE OR REPLACE FUNCTION public.processo_prazo_responsavel_nome()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.responsavel_servidor_id IS NULL THEN
    NEW.responsavel_nome := NULL;
  ELSE
    SELECT s.nome_completo INTO NEW.responsavel_nome FROM public.servidores s WHERE s.id = NEW.responsavel_servidor_id;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.processo_prazo_responsavel_nome() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_processo_prazos_responsavel_nome ON public.processo_prazos;
CREATE TRIGGER trg_processo_prazos_responsavel_nome BEFORE INSERT OR UPDATE ON public.processo_prazos
  FOR EACH ROW EXECUTE FUNCTION public.processo_prazo_responsavel_nome();

-- ----------------------------------------------------------------------------
-- 3. Trilha das remarcações
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.processo_prazo_remarcacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prazo_id uuid NOT NULL REFERENCES public.processo_prazos(id) ON DELETE CASCADE,
  processo_id uuid NOT NULL REFERENCES public.processos_licitatorios(id) ON DELETE CASCADE,
  data_anterior date NOT NULL,
  data_nova date NOT NULL,
  motivo text NOT NULL CHECK (char_length(btrim(motivo)) BETWEEN 3 AND 500),
  feito_em timestamptz NOT NULL DEFAULT now(),
  feito_por uuid
);
ALTER TABLE public.processo_prazo_remarcacoes ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.processo_prazo_remarcacoes IS
  'Trilha das remarcações dos prazos dos processos de contratação (gatilho processo_prazo_registrar_remarcacao); imutável.';

CREATE INDEX IF NOT EXISTS idx_processo_prazo_remarcacoes_processo
  ON public.processo_prazo_remarcacoes (processo_id, feito_em DESC);
CREATE INDEX IF NOT EXISTS idx_processo_prazo_remarcacoes_prazo ON public.processo_prazo_remarcacoes (prazo_id);

DROP TRIGGER IF EXISTS trilha_imutavel ON public.processo_prazo_remarcacoes;
CREATE TRIGGER trilha_imutavel BEFORE DELETE OR UPDATE ON public.processo_prazo_remarcacoes
  FOR EACH ROW EXECUTE FUNCTION public.trilha_imutavel('prazo_id', 'processo_prazos');

CREATE OR REPLACE FUNCTION public.processo_prazo_registrar_remarcacao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.data_limite IS DISTINCT FROM OLD.data_limite THEN
    INSERT INTO public.processo_prazo_remarcacoes (prazo_id, processo_id, data_anterior, data_nova, motivo, feito_por)
    VALUES (NEW.id, NEW.processo_id, OLD.data_limite, NEW.data_limite,
            coalesce(NEW.remarcacao_motivo, 'Prazo da movimentação corrigido'), auth.uid());
  END IF;
  RETURN NULL;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.processo_prazo_registrar_remarcacao() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_processo_prazos_remarcacao ON public.processo_prazos;
CREATE TRIGGER trg_processo_prazos_remarcacao AFTER UPDATE ON public.processo_prazos
  FOR EACH ROW EXECUTE FUNCTION public.processo_prazo_registrar_remarcacao();

-- ----------------------------------------------------------------------------
-- 4. Próxima ação → prazo (no recálculo do processo)
-- ----------------------------------------------------------------------------
-- Além do que a P2 fazia: a próxima ação da movimentação que vale vira (ou atualiza) o prazo "proxima_acao" dela; o
-- das outras movimentações abertas é cumprido ("nova movimentação registrada"), e o da movimentação excluída é
-- cancelado. Se a correção do prazo da movimentação muda a data, a remarcação vai para a trilha com o motivo da
-- correção.
CREATE OR REPLACE FUNCTION public.processo_recalcular_estado(p_processo_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ult public.processo_andamentos%ROWTYPE;
  v_setor text;
  v_data date;
BEGIN
  -- prazos de movimentações excluídas
  UPDATE public.processo_prazos pz
     SET situacao = 'cancelado', concluido_em = now(), concluido_por = auth.uid(),
         conclusao_motivo = 'Movimentação excluída'
    FROM public.processo_andamentos a
   WHERE pz.processo_id = p_processo_id AND pz.andamento_id = a.id AND a.excluido_em IS NOT NULL
     AND pz.situacao IN ('aberto', 'remarcado');

  SELECT * INTO v_ult
    FROM public.processo_andamentos a
   WHERE a.processo_id = p_processo_id AND a.excluido_em IS NULL
   ORDER BY a.data_informada DESC, a.data DESC, a.created_at DESC
   LIMIT 1;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT a.setor INTO v_setor
    FROM public.processo_andamentos a
   WHERE a.processo_id = p_processo_id AND a.excluido_em IS NULL AND a.setor IS NOT NULL
   ORDER BY a.data_informada DESC, a.data DESC, a.created_at DESC
   LIMIT 1;

  SELECT max(a.data) INTO v_data
    FROM public.processo_andamentos a
   WHERE a.processo_id = p_processo_id AND a.excluido_em IS NULL AND a.data_informada;

  UPDATE public.processos_licitatorios
     SET etapa = v_ult.etapa,
         setor_atual = COALESCE(v_setor, setor_atual),
         situacao_atual = v_ult.situacao,
         atualizado_em = COALESCE(v_data, atualizado_em),
         proxima_etapa = v_ult.proxima_etapa,
         proximo_responsavel_servidor_id = v_ult.responsavel_servidor_id,
         proximo_responsavel_nome = v_ult.responsavel_nome,
         proximo_responsavel_setor = v_ult.responsavel_setor,
         prazo_proxima_acao = v_ult.prazo_proxima,
         updated_at = now()
   WHERE id = p_processo_id;

  -- a próxima ação das outras movimentações já foi feita
  UPDATE public.processo_prazos pz
     SET situacao = 'cumprido', concluido_em = now(), concluido_por = auth.uid(),
         conclusao_motivo = 'Nova movimentação registrada'
   WHERE pz.processo_id = p_processo_id AND pz.tipo = 'proxima_acao' AND pz.situacao IN ('aberto', 'remarcado')
     AND pz.andamento_id IS DISTINCT FROM v_ult.id;

  IF v_ult.prazo_proxima IS NOT NULL THEN
    INSERT INTO public.processo_prazos AS pz
      (processo_id, tipo, descricao, data_limite, responsavel_servidor_id, responsavel_nome, responsavel_setor,
       andamento_id, avisos_dias, created_by)
    VALUES
      (p_processo_id, 'proxima_acao', left(coalesce(v_ult.proxima_etapa, ''), 300), v_ult.prazo_proxima,
       v_ult.responsavel_servidor_id, v_ult.responsavel_nome, v_ult.responsavel_setor, v_ult.id,
       coalesce((SELECT t.avisos_padrao FROM public.compras_prazo_tipos t WHERE t.tipo = 'proxima_acao'), '{1}'),
       coalesce(auth.uid(), v_ult.created_by))
    ON CONFLICT (andamento_id) DO UPDATE
       SET descricao = EXCLUDED.descricao,
           data_limite = EXCLUDED.data_limite,
           responsavel_servidor_id = EXCLUDED.responsavel_servidor_id,
           responsavel_nome = EXCLUDED.responsavel_nome,
           responsavel_setor = EXCLUDED.responsavel_setor,
           remarcacao_motivo = CASE WHEN pz.data_limite IS DISTINCT FROM EXCLUDED.data_limite
                                    THEN coalesce(v_ult.alteracao_motivo, 'Prazo da movimentação corrigido')
                                    ELSE pz.remarcacao_motivo END,
           situacao = CASE WHEN pz.situacao IN ('cumprido', 'cancelado') THEN 'aberto'
                           WHEN pz.data_limite IS DISTINCT FROM EXCLUDED.data_limite THEN 'remarcado'
                           ELSE pz.situacao END,
           concluido_em = CASE WHEN pz.situacao IN ('cumprido', 'cancelado') THEN NULL ELSE pz.concluido_em END,
           concluido_por = CASE WHEN pz.situacao IN ('cumprido', 'cancelado') THEN NULL ELSE pz.concluido_por END,
           conclusao_motivo = CASE WHEN pz.situacao IN ('cumprido', 'cancelado') THEN NULL ELSE pz.conclusao_motivo END;
  ELSE
    -- a movimentação que vale não tem próxima ação (encerrado, cancelado ou antiga): o prazo dela, se havia, sai
    UPDATE public.processo_prazos pz
       SET situacao = 'cumprido', concluido_em = now(), concluido_por = auth.uid(),
           conclusao_motivo = 'Movimentação sem próxima ação'
     WHERE pz.andamento_id = v_ult.id AND pz.situacao IN ('aberto', 'remarcado');
  END IF;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.processo_recalcular_estado(uuid) FROM PUBLIC, anon, authenticated;

-- Carga: a próxima ação que já vale hoje (P2) vira prazo aberto. Nenhum processo muda.
INSERT INTO public.processo_prazos
  (processo_id, tipo, descricao, data_limite, responsavel_servidor_id, responsavel_nome, responsavel_setor,
   andamento_id, avisos_dias, created_by)
SELECT v.processo_id, 'proxima_acao', v.proxima_etapa, v.prazo_proxima, v.responsavel_servidor_id, v.responsavel_nome,
       v.responsavel_setor, v.id, (SELECT t.avisos_padrao FROM public.compras_prazo_tipos t WHERE t.tipo = 'proxima_acao'),
       v.created_by
  FROM (SELECT DISTINCT ON (a.processo_id) a.*
          FROM public.processo_andamentos a
         WHERE a.excluido_em IS NULL
         ORDER BY a.processo_id, a.data_informada DESC, a.data DESC, a.created_at DESC) v
 WHERE v.prazo_proxima IS NOT NULL
ON CONFLICT (andamento_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 5. Pop-up e sino: meus prazos
-- ----------------------------------------------------------------------------
-- categoria: vencido (data passou), proximo (vence em até 3 dias), aviso (hoje é um dos dias de aviso, mais de 3
-- dias antes) e parado (processo sem movimentação além do limite da etapa; só quando ele não tem prazo vencido).
-- Quem tem o módulo Compras e compras.processos.editar vê todos; os demais, os prazos de que são responsáveis (e os
-- processos parados cuja próxima ação é sua), pelo servidor do perfil. Só nº, objeto resumido e o prazo.
CREATE OR REPLACE FUNCTION public.compras_meus_prazos()
RETURNS TABLE (
  categoria text,
  processo_id uuid,
  numero_processo text,
  objeto text,
  etapa text,
  prazo_id uuid,
  tipo text,
  descricao text,
  data_limite date,
  dias integer,
  responsavel text,
  andamento_id uuid,
  pode_editar boolean,
  pode_ver boolean
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
           coalesce(public.can_access_module(eu.uid, 'compras')
                    AND public.has_permission_code(eu.uid, 'compras.processos.editar'), false) AS todos,
           coalesce(public.can_access_module(eu.uid, 'compras')
                    AND (public.has_permission_code(eu.uid, 'compras.processos.visualizar')
                         OR public.has_permission_code(eu.uid, 'compras.processos.editar')), false) AS ver
      FROM eu
  ), prazos AS (
    SELECT CASE WHEN pz.data_limite < a.hoje THEN 'vencido'
                WHEN pz.data_limite - a.hoje <= 3 THEN 'proximo'
                ELSE 'aviso' END AS categoria,
           p.id AS processo_id, p.numero_processo, left(coalesce(p.objeto_resumido, p.objeto), 200) AS objeto, p.etapa,
           pz.id AS prazo_id, pz.tipo, pz.descricao, pz.data_limite, (pz.data_limite - a.hoje)::integer AS dias,
           coalesce(pz.responsavel_nome, pz.responsavel_setor) AS responsavel, pz.andamento_id,
           a.todos AS pode_editar, a.ver AS pode_ver
      FROM public.processo_prazos pz
      JOIN public.processos_licitatorios p ON p.id = pz.processo_id
      CROSS JOIN acesso a
     WHERE a.uid IS NOT NULL AND a.ativo
       AND pz.situacao IN ('aberto', 'remarcado')
       AND p.etapa NOT IN ('encerrado', 'cancelado')
       AND (pz.data_limite - a.hoje <= 3 OR (pz.data_limite - a.hoje) = ANY (pz.avisos_dias))
       AND (a.todos OR (a.servidor_id IS NOT NULL AND pz.responsavel_servidor_id = a.servidor_id))
  ), parados AS (
    SELECT 'parado'::text, p.id, p.numero_processo, left(coalesce(p.objeto_resumido, p.objeto), 200), p.etapa,
           NULL::uuid, NULL::text, NULL::text, coalesce(p.atualizado_em, p.created_at::date),
           (a.hoje - coalesce(p.atualizado_em, p.created_at::date))::integer,
           coalesce(p.proximo_responsavel_nome, p.proximo_responsavel_setor, p.setor_atual), NULL::uuid,
           a.todos, a.ver
      FROM public.processos_licitatorios p
      CROSS JOIN acesso a
     WHERE a.uid IS NOT NULL AND a.ativo
       AND p.etapa NOT IN ('encerrado', 'cancelado')
       AND a.hoje - coalesce(p.atualizado_em, p.created_at::date)
           > coalesce((SELECT c.dias_limite_parado FROM public.compras_etapa_parametros c WHERE c.etapa = p.etapa), 15)
       AND (a.todos OR (a.servidor_id IS NOT NULL AND p.proximo_responsavel_servidor_id = a.servidor_id))
       AND NOT EXISTS (SELECT 1 FROM prazos v WHERE v.processo_id = p.id AND v.categoria = 'vencido')
  )
  SELECT * FROM (
    SELECT * FROM prazos
    UNION ALL
    SELECT * FROM parados
  ) x
  ORDER BY CASE x.categoria WHEN 'vencido' THEN 0 WHEN 'proximo' THEN 1 WHEN 'parado' THEN 2 ELSE 3 END,
           CASE WHEN x.categoria = 'parado' THEN -x.dias ELSE x.dias END, x.numero_processo
  LIMIT 300
$$;
COMMENT ON FUNCTION public.compras_meus_prazos() IS
  'Pop-up e sino dos processos de contratação (P3): prazos vencidos, que vencem em até 3 dias ou em dia de aviso, e processos parados além do limite da etapa. Com compras.processos.editar, todos; senão, os do servidor do perfil. Migração 20261128090000.';
REVOKE ALL ON FUNCTION public.compras_meus_prazos() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.compras_meus_prazos() TO authenticated;

-- ----------------------------------------------------------------------------
-- 6. RLS (gerada de supabase/baseline/rls/mapa.csv por scripts/db/gerar-rls.mjs)
-- ----------------------------------------------------------------------------
-- compras_prazo_tipos  [permissao: compras]
DROP POLICY IF EXISTS "rls_select" ON public.compras_prazo_tipos;
CREATE POLICY "rls_select" ON public.compras_prazo_tipos FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'compras')) AND (public.has_permission_code(auth.uid(), 'compras.processos.visualizar') OR public.has_permission_code(auth.uid(), 'compras.processos.editar'))));
DROP POLICY IF EXISTS "rls_insert" ON public.compras_prazo_tipos;
CREATE POLICY "rls_insert" ON public.compras_prazo_tipos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras')) AND public.has_permission_code(auth.uid(), 'compras.processos.editar'));
DROP POLICY IF EXISTS "rls_update" ON public.compras_prazo_tipos;
CREATE POLICY "rls_update" ON public.compras_prazo_tipos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras')) AND public.has_permission_code(auth.uid(), 'compras.processos.editar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras')) AND public.has_permission_code(auth.uid(), 'compras.processos.editar'));
DROP POLICY IF EXISTS "rls_delete" ON public.compras_prazo_tipos;

-- processo_prazo_remarcacoes  [trilha: compras]
DROP POLICY IF EXISTS "rls_select" ON public.processo_prazo_remarcacoes;
CREATE POLICY "rls_select" ON public.processo_prazo_remarcacoes FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras')) AND (public.has_permission_code(auth.uid(), 'compras.processos.visualizar') OR public.has_permission_code(auth.uid(), 'compras.processos.editar')));

-- processo_prazos  [permissao: compras]
DROP POLICY IF EXISTS "rls_select" ON public.processo_prazos;
CREATE POLICY "rls_select" ON public.processo_prazos FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'compras')) AND (public.has_permission_code(auth.uid(), 'compras.processos.visualizar') OR public.has_permission_code(auth.uid(), 'compras.processos.editar'))));
DROP POLICY IF EXISTS "rls_insert" ON public.processo_prazos;
CREATE POLICY "rls_insert" ON public.processo_prazos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras')) AND public.has_permission_code(auth.uid(), 'compras.processos.editar'));
DROP POLICY IF EXISTS "rls_update" ON public.processo_prazos;
CREATE POLICY "rls_update" ON public.processo_prazos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras')) AND public.has_permission_code(auth.uid(), 'compras.processos.editar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras')) AND public.has_permission_code(auth.uid(), 'compras.processos.editar'));
DROP POLICY IF EXISTS "rls_delete" ON public.processo_prazos;

