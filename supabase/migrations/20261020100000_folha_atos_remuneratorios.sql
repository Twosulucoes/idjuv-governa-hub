-- ============================================================================
-- Folha: atos remuneratórios (reajustes de vencimento, subsídio, rubrica e parâmetro com o ato que os fundamenta)
-- ============================================================================
-- Antes: reajuste era editar cargos.vencimento_base, rubricas.formula_valor ou parametros_folha à mão. O valor antigo
-- sumia, a folha de um mês passado reprocessada saía com o valor novo e nada ligava a mudança à lei ou ao decreto.
--
-- Agora:
--   1. atos_remuneratorios: o ato (lei, decreto, instrução normativa...) com número, datas, vigência, ementa e o
--      processo SEI. Nasce em rascunho; aplicado, não muda nem sai.
--   2. atos_remuneratorios_itens: o que o ato muda, um item por alvo: vencimento ou subsídio de um cargo, valor de uma
--      rubrica ou um parâmetro da folha, com o valor novo (o anterior é gravado ao aplicar). Só com o ato em rascunho.
--   3. cargo_vencimentos: histórico do vencimento de cada cargo por vigência (trilha imutável). A folha passa a ler o
--      vencimento vigente no último dia da competência (vencimento_cargo_em); sem histórico, vale cargos.vencimento_base
--      como antes. Mudar cargos.vencimento_base de um cargo que já tem histórico grava uma linha nova, vigente de hoje.
--   4. aplicar_ato_remuneratorio(ato): exige o módulo rh e financeiro.folha.configurar; tudo ou nada. Cargo: grava a
--      vigência no histórico (a primeira vez, guarda antes o valor do cadastro como ponto de partida) e atualiza
--      cargos.vencimento_base com o valor vigente hoje. Rubrica: troca formula_valor. Parâmetro: fecha a vigência
--      anterior na véspera e cria a nova.
--   5. folha_montar_ficha e processar_folha_pagamento: vencimento pela vigência; ficha com
--      vencimento_alterado_na_competencia quando a vigência começa depois do dia 1 (a competência sai com o valor novo
--      inteiro; a conferência decide a proporção).
-- Fora: diferenças de meses já fechados (lançamento na folha seguinte) e proporção automática dentro do mês.
-- Idempotente.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Atos
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atos_remuneratorios (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  tipo_ato varchar(30) NOT NULL,
  numero text NOT NULL,
  data_ato date NOT NULL,
  data_publicacao date,
  vigencia_inicio date NOT NULL,
  ementa text NOT NULL,
  percentual numeric(9,4),
  processo_sei text,
  link_publicacao text,
  observacoes text,
  status varchar(20) DEFAULT 'rascunho' NOT NULL,
  aplicado_em timestamp with time zone,
  aplicado_por uuid,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  created_by_servidor_id uuid,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid,
  updated_by_servidor_id uuid,
  CONSTRAINT atos_remuneratorios_tipo_check CHECK (tipo_ato IN ('lei', 'lei_complementar', 'decreto', 'portaria',
    'resolucao', 'instrucao_normativa', 'outro')),
  CONSTRAINT atos_remuneratorios_status_check CHECK (status IN ('rascunho', 'aplicado')),
  CONSTRAINT atos_remuneratorios_numero_check CHECK (btrim(numero) <> ''),
  CONSTRAINT atos_remuneratorios_ementa_check CHECK (btrim(ementa) <> ''),
  CONSTRAINT atos_remuneratorios_percentual_check CHECK (percentual IS NULL OR percentual BETWEEN -100 AND 1000),
  CONSTRAINT atos_remuneratorios_aplicado_check CHECK ((status = 'aplicado') = (aplicado_em IS NOT NULL))
);
COMMENT ON TABLE public.atos_remuneratorios IS 'Atos que mudam valores da folha (reajuste de vencimento, subsídio, rubrica ou parâmetro). Rascunho até aplicar_ato_remuneratorio; aplicado, não muda nem sai. Migração 20261020100000.';
COMMENT ON COLUMN public.atos_remuneratorios.percentual IS 'Percentual do reajuste geral, quando houver (registro; os valores aplicados são os dos itens)';
CREATE INDEX IF NOT EXISTS idx_atos_remuneratorios_vigencia ON public.atos_remuneratorios (vigencia_inicio DESC);

CREATE TABLE IF NOT EXISTS public.atos_remuneratorios_itens (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  ato_id uuid NOT NULL REFERENCES public.atos_remuneratorios(id) ON DELETE CASCADE,
  alvo varchar(20) NOT NULL,
  cargo_id uuid REFERENCES public.cargos(id) ON DELETE RESTRICT,
  rubrica_id uuid REFERENCES public.rubricas(id) ON DELETE RESTRICT,
  tipo_parametro varchar(50),
  valor_anterior numeric(18,6),
  valor_novo numeric(18,6) NOT NULL,
  observacao text,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  created_by_servidor_id uuid,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid,
  updated_by_servidor_id uuid,
  CONSTRAINT atos_remuneratorios_itens_alvo_check CHECK (
    (alvo = 'cargo' AND cargo_id IS NOT NULL AND rubrica_id IS NULL AND tipo_parametro IS NULL)
    OR (alvo = 'rubrica' AND rubrica_id IS NOT NULL AND cargo_id IS NULL AND tipo_parametro IS NULL)
    OR (alvo = 'parametro' AND btrim(coalesce(tipo_parametro, '')) <> '' AND cargo_id IS NULL AND rubrica_id IS NULL)),
  CONSTRAINT atos_remuneratorios_itens_valor_check CHECK (valor_novo >= 0)
);
COMMENT ON TABLE public.atos_remuneratorios_itens IS 'O que cada ato remuneratório muda: vencimento/subsídio do cargo, valor da rubrica ou parâmetro da folha. valor_anterior é gravado por aplicar_ato_remuneratorio. Migração 20261020100000.';
CREATE INDEX IF NOT EXISTS idx_atos_remuneratorios_itens_ato ON public.atos_remuneratorios_itens (ato_id);
CREATE UNIQUE INDEX IF NOT EXISTS atos_remuneratorios_itens_alvo_uidx ON public.atos_remuneratorios_itens
  (ato_id, alvo, coalesce(cargo_id, rubrica_id), coalesce(tipo_parametro, ''));

-- ---------------------------------------------------------------------------
-- 2. Histórico do vencimento do cargo
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cargo_vencimentos (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  cargo_id uuid NOT NULL REFERENCES public.cargos(id) ON DELETE CASCADE,
  valor numeric(12,2) NOT NULL,
  vigencia_inicio date NOT NULL,
  ato_id uuid REFERENCES public.atos_remuneratorios(id) ON DELETE RESTRICT,
  origem varchar(20) NOT NULL,
  registrado_por uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT cargo_vencimentos_valor_check CHECK (valor >= 0),
  CONSTRAINT cargo_vencimentos_origem_check CHECK (origem IN ('inicial', 'ato', 'cadastro')),
  CONSTRAINT cargo_vencimentos_ato_check CHECK ((origem = 'ato') = (ato_id IS NOT NULL))
);
COMMENT ON TABLE public.cargo_vencimentos IS 'Vencimento ou subsídio de cada cargo por vigência: vale do início até a vigência seguinte. inicial = valor do cadastro antes do primeiro ato; ato = aplicar_ato_remuneratorio; cadastro = mudança de cargos.vencimento_base. Imutável. Migração 20261020100000.';
CREATE INDEX IF NOT EXISTS idx_cargo_vencimentos_cargo ON public.cargo_vencimentos (cargo_id, vigencia_inicio DESC, created_at DESC);

ALTER TABLE public.atos_remuneratorios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atos_remuneratorios FORCE ROW LEVEL SECURITY;
ALTER TABLE public.atos_remuneratorios_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atos_remuneratorios_itens FORCE ROW LEVEL SECURITY;
ALTER TABLE public.cargo_vencimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cargo_vencimentos FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.atos_remuneratorios, public.atos_remuneratorios_itens, public.cargo_vencimentos FROM anon;
-- sem policy de escrita em cargo_vencimentos: só aplicar_ato_remuneratorio e o trigger de cargos gravam
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.atos_remuneratorios, public.atos_remuneratorios_itens,
  public.cargo_vencimentos FROM authenticated;

-- policies geradas por scripts/db/gerar-rls.mjs (mapa.csv: atos_remuneratorios e atos_remuneratorios_itens, permissao,
-- rh, escrita=financeiro.folha.configurar; cargo_vencimentos, trilha, rh)
DROP POLICY IF EXISTS "rls_select" ON public.atos_remuneratorios;
CREATE POLICY "rls_select" ON public.atos_remuneratorios FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.atos_remuneratorios;
CREATE POLICY "rls_insert" ON public.atos_remuneratorios FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'));
DROP POLICY IF EXISTS "rls_update" ON public.atos_remuneratorios;
CREATE POLICY "rls_update" ON public.atos_remuneratorios FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'));
DROP POLICY IF EXISTS "rls_delete" ON public.atos_remuneratorios;
CREATE POLICY "rls_delete" ON public.atos_remuneratorios FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'));
DROP POLICY IF EXISTS "rls_select" ON public.atos_remuneratorios_itens;
CREATE POLICY "rls_select" ON public.atos_remuneratorios_itens FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.atos_remuneratorios_itens;
CREATE POLICY "rls_insert" ON public.atos_remuneratorios_itens FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'));
DROP POLICY IF EXISTS "rls_update" ON public.atos_remuneratorios_itens;
CREATE POLICY "rls_update" ON public.atos_remuneratorios_itens FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'));
DROP POLICY IF EXISTS "rls_delete" ON public.atos_remuneratorios_itens;
CREATE POLICY "rls_delete" ON public.atos_remuneratorios_itens FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'financeiro.folha.configurar'));
DROP POLICY IF EXISTS "rls_select" ON public.cargo_vencimentos;
CREATE POLICY "rls_select" ON public.cargo_vencimentos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));

-- ---------------------------------------------------------------------------
-- 3. Integridade: rascunho muda, aplicado não; aplicar só pela RPC
-- ---------------------------------------------------------------------------
-- aplicar_ato_remuneratorio liga a variável local ato.aplicar com o id do ato (a API não define variáveis)
CREATE OR REPLACE FUNCTION public.ato_remuneratorio_integridade()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_aplicando boolean;
  v_carimbo text[] := ARRAY['updated_at', 'updated_by', 'updated_by_servidor_id'];
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status <> 'rascunho' OR NEW.aplicado_em IS NOT NULL OR NEW.aplicado_por IS NOT NULL THEN
      RAISE EXCEPTION 'Ato remuneratório nasce em rascunho: aplique com aplicar_ato_remuneratorio' USING ERRCODE = 'RHE02';
    END IF;
    RETURN NEW;
  END IF;
  v_aplicando := coalesce(current_setting('ato.aplicar', true), '') = OLD.id::text;
  IF OLD.status = 'aplicado' THEN
    IF TG_OP = 'DELETE' OR (to_jsonb(NEW) - v_carimbo) IS DISTINCT FROM (to_jsonb(OLD) - v_carimbo) THEN
      RAISE EXCEPTION 'O ato % % já foi aplicado e não muda nem sai: registre outro ato para corrigir',
        OLD.tipo_ato, OLD.numero USING ERRCODE = 'RHE02';
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND NOT v_aplicando
     AND (NEW.status <> 'rascunho' OR NEW.aplicado_em IS NOT NULL OR NEW.aplicado_por IS NOT NULL) THEN
    RAISE EXCEPTION 'Aplicar o ato só pela RPC aplicar_ato_remuneratorio' USING ERRCODE = 'RHE02';
  END IF;
  RETURN CASE TG_OP WHEN 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

DROP TRIGGER IF EXISTS trg_ato_remuneratorio_integridade ON public.atos_remuneratorios;
CREATE TRIGGER trg_ato_remuneratorio_integridade BEFORE INSERT OR UPDATE OR DELETE ON public.atos_remuneratorios
  FOR EACH ROW EXECUTE FUNCTION public.ato_remuneratorio_integridade();

CREATE OR REPLACE FUNCTION public.ato_remuneratorio_item_integridade()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_ato record;
  v_id uuid := CASE TG_OP WHEN 'DELETE' THEN OLD.ato_id ELSE NEW.ato_id END;
BEGIN
  SELECT id, status, tipo_ato, numero INTO v_ato FROM public.atos_remuneratorios WHERE id = v_id;
  -- ato apagado (cascata de rascunho): o item sai junto
  IF NOT FOUND AND TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.ato_id IS DISTINCT FROM OLD.ato_id THEN
    RAISE EXCEPTION 'O item não muda de ato' USING ERRCODE = 'RHE02';
  END IF;
  IF v_ato.status <> 'rascunho' THEN
    RAISE EXCEPTION 'O ato % % já foi aplicado: os itens não mudam', v_ato.tipo_ato, v_ato.numero USING ERRCODE = 'RHE02';
  END IF;
  -- valor anterior é do banco: gravado ao aplicar
  IF TG_OP <> 'DELETE' AND coalesce(current_setting('ato.aplicar', true), '') <> NEW.ato_id::text THEN
    NEW.valor_anterior := NULL;
  END IF;
  RETURN CASE TG_OP WHEN 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

DROP TRIGGER IF EXISTS trg_ato_remuneratorio_item_integridade ON public.atos_remuneratorios_itens;
CREATE TRIGGER trg_ato_remuneratorio_item_integridade BEFORE INSERT OR UPDATE OR DELETE ON public.atos_remuneratorios_itens
  FOR EACH ROW EXECUTE FUNCTION public.ato_remuneratorio_item_integridade();

-- histórico imutável (classe trilha do mapa): só some na cascata do cargo
DROP TRIGGER IF EXISTS trilha_imutavel ON public.cargo_vencimentos;
CREATE TRIGGER trilha_imutavel BEFORE DELETE OR UPDATE ON public.cargo_vencimentos
  FOR EACH ROW EXECUTE FUNCTION public.trilha_imutavel('cargo_id', 'cargos');
ALTER TABLE public.cargo_vencimentos ENABLE ALWAYS TRIGGER trilha_imutavel;
DROP TRIGGER IF EXISTS trilha_imutavel_truncate ON public.cargo_vencimentos;
CREATE TRIGGER trilha_imutavel_truncate BEFORE TRUNCATE ON public.cargo_vencimentos
  FOR EACH STATEMENT EXECUTE FUNCTION public.trilha_imutavel();
ALTER TABLE public.cargo_vencimentos ENABLE ALWAYS TRIGGER trilha_imutavel_truncate;

-- autoria, trilha e regra de setor, como em toda tabela do RH (scripts/check-autoria-rh.mjs)
DROP TRIGGER IF EXISTS zz_fixar_autoria ON public.atos_remuneratorios;
CREATE TRIGGER zz_fixar_autoria BEFORE INSERT OR UPDATE ON public.atos_remuneratorios
  FOR EACH ROW EXECUTE FUNCTION public.fixar_autoria();
DROP TRIGGER IF EXISTS audit_atos_remuneratorios ON public.atos_remuneratorios;
CREATE TRIGGER audit_atos_remuneratorios AFTER INSERT OR UPDATE OR DELETE ON public.atos_remuneratorios
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger('rh');
DROP TRIGGER IF EXISTS zz_fixar_autoria ON public.atos_remuneratorios_itens;
CREATE TRIGGER zz_fixar_autoria BEFORE INSERT OR UPDATE ON public.atos_remuneratorios_itens
  FOR EACH ROW EXECUTE FUNCTION public.fixar_autoria();
DROP TRIGGER IF EXISTS audit_atos_remuneratorios_itens ON public.atos_remuneratorios_itens;
CREATE TRIGGER audit_atos_remuneratorios_itens AFTER INSERT OR UPDATE OR DELETE ON public.atos_remuneratorios_itens
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger('rh');

-- ---------------------------------------------------------------------------
-- 4. Vencimento vigente e mudança pelo cadastro do cargo
-- ---------------------------------------------------------------------------
-- Vencimento do cargo numa data: a vigência mais recente até a data; sem histórico, cargos.vencimento_base.
CREATE OR REPLACE FUNCTION public.vencimento_cargo_em(p_cargo_id uuid, p_data date)
RETURNS numeric LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT coalesce(
    (SELECT v.valor FROM public.cargo_vencimentos v
      WHERE v.cargo_id = p_cargo_id AND v.vigencia_inicio <= p_data
      ORDER BY v.vigencia_inicio DESC, v.created_at DESC, v.id DESC LIMIT 1),
    (SELECT c.vencimento_base FROM public.cargos c WHERE c.id = p_cargo_id),
    0);
$$;
COMMENT ON FUNCTION public.vencimento_cargo_em(uuid, date) IS 'Vencimento ou subsídio do cargo vigente na data (cargo_vencimentos; sem histórico, cargos.vencimento_base). Migração 20261020100000.';

-- Cargo com histórico: mudar vencimento_base no cadastro vale de hoje em diante (a folha lê o histórico)
CREATE OR REPLACE FUNCTION public.cargo_vencimento_pelo_cadastro()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF coalesce(current_setting('ato.aplicar', true), '') <> '' THEN
    RETURN NEW;
  END IF;
  IF NEW.vencimento_base IS DISTINCT FROM OLD.vencimento_base
     AND EXISTS (SELECT 1 FROM public.cargo_vencimentos WHERE cargo_id = NEW.id) THEN
    INSERT INTO public.cargo_vencimentos (cargo_id, valor, vigencia_inicio, origem, registrado_por)
    VALUES (NEW.id, coalesce(NEW.vencimento_base, 0), public.data_local(), 'cadastro', auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cargo_vencimento_pelo_cadastro ON public.cargos;
CREATE TRIGGER trg_cargo_vencimento_pelo_cadastro AFTER UPDATE OF vencimento_base ON public.cargos
  FOR EACH ROW EXECUTE FUNCTION public.cargo_vencimento_pelo_cadastro();

-- ---------------------------------------------------------------------------
-- 5. Aplicar o ato (tudo ou nada)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.aplicar_ato_remuneratorio(p_ato_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_ato record;
  v_item record;
  v_vig date;
  v_ant numeric;
  v_hoje date := public.data_local();
  v_ident text;
  v_cargos int := 0; v_rubricas int := 0; v_parametros int := 0;
BEGIN
  IF v_uid IS NULL OR NOT coalesce(public.can_access_module(v_uid, 'rh')
                                   AND public.has_permission_code(v_uid, 'financeiro.folha.configurar'), false) THEN
    RAISE EXCEPTION 'Aplicar ato remuneratório exige o módulo rh e a permissão financeiro.folha.configurar'
      USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_ato FROM public.atos_remuneratorios WHERE id = p_ato_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ato remuneratório não encontrado' USING ERRCODE = 'P0002';
  END IF;
  IF v_ato.status <> 'rascunho' THEN
    RAISE EXCEPTION 'O ato % % já foi aplicado', v_ato.tipo_ato, v_ato.numero USING ERRCODE = 'RHE02';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.atos_remuneratorios_itens WHERE ato_id = p_ato_id) THEN
    RAISE EXCEPTION 'O ato não tem itens: informe o que ele muda (cargo, rubrica ou parâmetro)' USING ERRCODE = '22023';
  END IF;
  v_vig := v_ato.vigencia_inicio;
  v_ident := initcap(replace(v_ato.tipo_ato, '_', ' ')) || ' ' || v_ato.numero;
  PERFORM set_config('ato.aplicar', p_ato_id::text, true);

  FOR v_item IN SELECT * FROM public.atos_remuneratorios_itens WHERE ato_id = p_ato_id ORDER BY alvo, created_at, id
                FOR UPDATE LOOP
    IF v_item.alvo = 'cargo' THEN
      PERFORM 1 FROM public.cargos WHERE id = v_item.cargo_id FOR UPDATE;
      v_ant := public.vencimento_cargo_em(v_item.cargo_id, v_vig - 1);
      -- primeira vez: o valor do cadastro vira o ponto de partida do histórico
      IF NOT EXISTS (SELECT 1 FROM public.cargo_vencimentos WHERE cargo_id = v_item.cargo_id) THEN
        INSERT INTO public.cargo_vencimentos (cargo_id, valor, vigencia_inicio, origem, registrado_por)
        SELECT c.id, coalesce(c.vencimento_base, 0), '1900-01-01'::date, 'inicial', v_uid
          FROM public.cargos c WHERE c.id = v_item.cargo_id;
      END IF;
      INSERT INTO public.cargo_vencimentos (cargo_id, valor, vigencia_inicio, ato_id, origem, registrado_por)
      VALUES (v_item.cargo_id, round(v_item.valor_novo, 2), v_vig, p_ato_id, 'ato', v_uid);
      UPDATE public.cargos SET vencimento_base = public.vencimento_cargo_em(id, v_hoje)
       WHERE id = v_item.cargo_id AND vencimento_base IS DISTINCT FROM public.vencimento_cargo_em(id, v_hoje);
      v_cargos := v_cargos + 1;
    ELSIF v_item.alvo = 'rubrica' THEN
      SELECT formula_valor INTO v_ant FROM public.rubricas WHERE id = v_item.rubrica_id FOR UPDATE;
      UPDATE public.rubricas SET formula_valor = v_item.valor_novo WHERE id = v_item.rubrica_id;
      v_rubricas := v_rubricas + 1;
    ELSE
      IF EXISTS (SELECT 1 FROM public.parametros_folha
                  WHERE tipo_parametro = lower(btrim(v_item.tipo_parametro)) AND coalesce(ativo, true)
                    AND vigencia_inicio >= v_vig) THEN
        RAISE EXCEPTION 'O parâmetro % já tem valor com vigência a partir de %: confira antes de aplicar o ato',
          v_item.tipo_parametro, to_char(v_vig, 'DD/MM/YYYY') USING ERRCODE = '22023';
      END IF;
      v_ant := nullif(public.get_parametro_vigente(v_item.tipo_parametro::text, v_vig - 1), 0);
      UPDATE public.parametros_folha SET vigencia_fim = v_vig - 1
       WHERE tipo_parametro = lower(btrim(v_item.tipo_parametro)) AND coalesce(ativo, true)
         AND vigencia_inicio < v_vig AND (vigencia_fim IS NULL OR vigencia_fim >= v_vig);
      INSERT INTO public.parametros_folha (tipo_parametro, valor, vigencia_inicio, descricao, observacoes, ativo)
      SELECT v_item.tipo_parametro, v_item.valor_novo, v_vig,
             coalesce((SELECT p.descricao FROM public.parametros_folha p
                        WHERE p.tipo_parametro = lower(btrim(v_item.tipo_parametro)) AND p.descricao IS NOT NULL
                        ORDER BY p.vigencia_inicio DESC LIMIT 1), v_item.tipo_parametro),
             v_ident, true;
      v_parametros := v_parametros + 1;
    END IF;
    UPDATE public.atos_remuneratorios_itens SET valor_anterior = v_ant WHERE id = v_item.id;
  END LOOP;

  UPDATE public.atos_remuneratorios SET status = 'aplicado', aplicado_em = now(), aplicado_por = v_uid WHERE id = p_ato_id;
  PERFORM set_config('ato.aplicar', '', true);
  RETURN jsonb_build_object('ato_id', p_ato_id, 'cargos', v_cargos, 'rubricas', v_rubricas, 'parametros', v_parametros,
                            'vigencia_inicio', v_vig);
END;
$$;
COMMENT ON FUNCTION public.aplicar_ato_remuneratorio(uuid) IS 'Aplica o ato remuneratório em rascunho, tudo ou nada: vencimento do cargo no histórico por vigência, valor da rubrica, nova vigência do parâmetro; grava o valor anterior de cada item. Exige o módulo rh e financeiro.folha.configurar. Migração 20261020100000.';

-- regra de setor: os atos entram em lancamento_modulos_tabela (módulos rh e financeiro, como parametros_folha)
CREATE OR REPLACE FUNCTION public.lancamento_modulos_tabela(p_tabela text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN CASE
    WHEN p_tabela IN ('consignacoes', 'dependentes_irrf', 'eventos_esocial', 'fichas_financeiras', 'folhas_pagamento',
                      'itens_ficha_financeira', 'itens_retorno_bancario', 'lancamentos_folha', 'parametros_folha',
                      'pensoes_alimenticias', 'remessas_bancarias', 'rubricas', 'tabela_inss', 'tabela_irrf',
                      'retornos_bancarios', 'exportacoes_folha', 'viagens_diarias', 'contas_autarquia', 'config_autarquia',
                      'config_institucional', 'atos_remuneratorios', 'atos_remuneratorios_itens')
      THEN ARRAY['rh', 'financeiro']
    WHEN p_tabela = 'documentos' THEN ARRAY['rh', 'workflow', 'gabinete', 'governanca', 'admin']
    WHEN p_tabela IN ('historico_funcional', 'pre_cadastros', 'provimentos') THEN ARRAY['rh', 'gabinete']
    WHEN p_tabela IN ('composicao_cargos', 'vagas_cargo') THEN ARRAY['rh', 'governanca']
    WHEN p_tabela = 'nomeacoes_chefe_unidade' THEN ARRAY['rh', 'patrimonio']
    WHEN p_tabela IN ('adicionais_tempo_servico', 'agrupamento_unidade_vinculo', 'banco_horas', 'bancos_cnab',
                      'cargo_unidade_compatibilidade', 'cargos', 'cessoes', 'comissoes', 'comissoes_membros',
                      'config_agrupamento_unidades', 'config_assinatura_frequencia', 'config_compensacao',
                      'config_fechamento_folha', 'config_fechamento_frequencia', 'config_incidencias',
                      'config_jornada_padrao', 'config_motivos_desligamento', 'config_regras_calculo', 'config_rubricas',
                      'config_situacoes_funcionais', 'config_tipos_ato', 'config_tipos_onus', 'config_tipos_rubrica',
                      'config_tipos_servidor', 'configuracao_jornada', 'designacoes', 'dias_nao_uteis',
                      'documentos_requerimento_servidor', 'feriados', 'ferias_servidor', 'frequencia_arquivos',
                      'frequencia_fechamento', 'frequencia_mensal', 'frequencia_pacotes', 'horarios_jornada',
                      'justificativas_ponto', 'lancamentos_banco_horas', 'licencas_afastamentos', 'lotacoes',
                      'memorandos_lotacao', 'ocorrencias_servidor', 'portarias_servidor', 'regimes_trabalho',
                      'registros_ponto', 'servidor_regime', 'servidor_tag_vinculos', 'servidor_tags', 'servidores',
                      'solicitacoes_abono', 'solicitacoes_ajuste_ponto', 'tipos_abono', 'vinculos_funcionais',
                      'vinculos_servidor')
      THEN ARRAY['rh']
  END;
END;
$$;

DROP TRIGGER IF EXISTS zz_exigir_setor ON public.atos_remuneratorios;
CREATE TRIGGER zz_exigir_setor BEFORE INSERT OR UPDATE OR DELETE ON public.atos_remuneratorios
  FOR EACH ROW EXECUTE FUNCTION public.exigir_setor();
DROP TRIGGER IF EXISTS zz_exigir_setor_fim ON public.atos_remuneratorios;
CREATE TRIGGER zz_exigir_setor_fim AFTER INSERT OR UPDATE OR DELETE ON public.atos_remuneratorios
  FOR EACH STATEMENT EXECUTE FUNCTION public.exigir_setor_fim();
DROP TRIGGER IF EXISTS zz_exigir_setor ON public.atos_remuneratorios_itens;
CREATE TRIGGER zz_exigir_setor BEFORE INSERT OR UPDATE OR DELETE ON public.atos_remuneratorios_itens
  FOR EACH ROW EXECUTE FUNCTION public.exigir_setor();
DROP TRIGGER IF EXISTS zz_exigir_setor_fim ON public.atos_remuneratorios_itens;
CREATE TRIGGER zz_exigir_setor_fim AFTER INSERT OR UPDATE OR DELETE ON public.atos_remuneratorios_itens
  FOR EACH STATEMENT EXECUTE FUNCTION public.exigir_setor_fim();

-- ---------------------------------------------------------------------------
-- 6. Folha: vencimento pela vigência (o resto igual à migração 20261019200000)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.folha_montar_ficha(p_servidor_id uuid, p_provimento_id uuid, p_tipo text, p_d1 date, p_d2 date, p_manuais jsonb, p_tabelas jsonb) RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_srv record;
  v_prv record;
  v_venc numeric;
  v_itens jsonb := '[]'::jsonb;
  v_inc jsonb := '[]'::jsonb;
  v_ano int := EXTRACT(YEAR FROM p_d2)::int;
  v_ini date; v_fim date; v_dias int; v_ini_pago date; v_fim_pago date; v_venc_prop numeric := 0;
  v_faltas int := 0; v_dias_lic int := 0; v_dias_ces int := 0; v_rest int;
  v_d_falta numeric := 0; v_d_lic numeric := 0; v_d_ces numeric := 0; v_terco numeric := 0; v_abono numeric := 0;
  v_nferias int := 0;
  v_man jsonb; v_man_val numeric; v_man_inss boolean; v_man_irrf boolean;
  v_man_prov_inss numeric := 0; v_man_prov_irrf numeric := 0; v_man_prov numeric := 0; v_man_desc numeric := 0;
  v_liq_dias numeric := 0;
  v_base_inss numeric := 0; v_inss numeric := 0; v_qdep int := 0; v_ded_unit numeric; v_ded numeric := 0;
  v_base_irrf numeric := 0; v_irrf numeric := 0;
  v_consig numeric := 0; v_pensao numeric := 0; v_c record; v_p record; v_base_pensao numeric; v_val numeric;
  v_prov numeric := 0; v_desc numeric := 0; v_liq numeric;
  v_teto numeric;
  v_avos int; v_v13 numeric; v_adiant numeric := 0;
  v_adm date; v_pa_ini date; v_meses int; v_resto int; v_avos_fer int; v_dias_prop numeric; v_dias_goz numeric; v_dias_ind numeric;
  v_val_fer numeric; v_pa_completos int; v_dias_reg numeric;
  v_tem_inss boolean := coalesce((p_tabelas ->> 'inss')::boolean, false);
  v_tem_irrf boolean := coalesce((p_tabelas ->> 'irrf')::boolean, false);
  v_ded_cfg numeric := nullif(p_tabelas ->> 'ded_dep', '')::numeric;
  v_rpps boolean := false;
  v_rend_irrf numeric := 0; v_irrf_r jsonb; v_irrf_ant numeric; v_iter int := 0; v_pens_itens jsonb := '[]'::jsonb;
  v_ref_irrf text;
BEGIN
  SELECT s.data_admissao, s.banco_codigo, s.banco_conta, s.possui_vinculo_externo, s.contribui_rpps_origem, s.rpps_origem_inicio
    INTO v_srv FROM public.servidores s WHERE s.id = p_servidor_id;
  -- opção pelo regime próprio do órgão de origem (efetivo de outro ente em cargo em comissão): sem INSS aqui
  v_rpps := coalesce(v_srv.contribui_rpps_origem, false) AND coalesce(v_srv.rpps_origem_inicio <= p_d2, true);
  SELECT p.*, coalesce(p.data_exercicio, p.data_nomeacao) AS inicio, public.vencimento_cargo_em(c.id, p_d2) AS venc
    INTO v_prv
    FROM public.provimentos p JOIN public.cargos c ON c.id = p.cargo_id
   WHERE p.id = p_provimento_id;
  v_venc := v_prv.venc;
  -- reajuste com vigência no meio da competência: o mês sai com o valor novo inteiro; a conferência decide a proporção
  IF EXISTS (SELECT 1 FROM public.cargo_vencimentos cv
              WHERE cv.cargo_id = v_prv.cargo_id AND cv.vigencia_inicio > p_d1 AND cv.vigencia_inicio <= p_d2) THEN
    v_inc := v_inc || jsonb_build_array('vencimento_alterado_na_competencia');
  END IF;
  v_ini := v_prv.inicio;
  v_fim := coalesce(v_prv.data_encerramento, p_d2);

  IF v_srv.banco_codigo IS NULL OR v_srv.banco_conta IS NULL THEN
    v_inc := v_inc || jsonb_build_array('sem_dados_bancarios');
  END IF;
  IF NOT v_tem_inss AND NOT v_rpps THEN v_inc := v_inc || jsonb_build_array('tabela_inss_ausente'); END IF;
  IF coalesce(v_srv.possui_vinculo_externo, false) AND NOT v_rpps THEN
    v_inc := v_inc || jsonb_build_array('regime_previdenciario_a_confirmar');
  END IF;
  IF NOT v_tem_irrf THEN v_inc := v_inc || jsonb_build_array('tabela_irrf_ausente'); END IF;

  -- lançamentos manuais do servidor (guardados antes de refazer as fichas)
  FOR v_man IN SELECT e FROM jsonb_array_elements(coalesce(p_manuais, '[]'::jsonb)) e
                WHERE (e ->> 'servidor_id')::uuid = p_servidor_id LOOP
    v_man_val := coalesce((v_man ->> 'valor')::numeric, 0);
    v_man_inss := true; v_man_irrf := true;
    IF (v_man ->> 'rubrica_id') IS NOT NULL THEN
      SELECT coalesce(r.incide_inss, true), coalesce(r.incide_irrf, true) INTO v_man_inss, v_man_irrf
        FROM public.rubricas r WHERE r.id = (v_man ->> 'rubrica_id')::uuid;
    END IF;
    v_itens := v_itens || jsonb_build_array(public.folha_item(v_man ->> 'descricao', v_man ->> 'tipo', v_man_val,
                  v_man ->> 'referencia', nullif(v_man ->> 'base_calculo', '')::numeric,
                  nullif(v_man ->> 'percentual', '')::numeric, 'manual', nullif(v_man ->> 'rubrica_id', '')::uuid));
    IF v_man ->> 'tipo' = 'provento' THEN
      v_man_prov := v_man_prov + v_man_val;
      IF v_man_inss THEN v_man_prov_inss := v_man_prov_inss + v_man_val; END IF;
      IF v_man_irrf THEN v_man_prov_irrf := v_man_prov_irrf + v_man_val; END IF;
    ELSE
      v_man_desc := v_man_desc + v_man_val;
    END IF;
  END LOOP;

  -- ===================================================================== MENSAL
  IF p_tipo = 'mensal' THEN
    v_dias := public.folha_dias_comerciais(v_ini, v_fim, p_d1, p_d2);
    v_venc_prop := round(v_venc / 30 * v_dias, 2);
    v_ini_pago := greatest(v_ini, p_d1);
    v_fim_pago := least(v_fim, p_d2);
    v_itens := jsonb_build_array(public.folha_item('Vencimento', 'provento', v_venc_prop, v_dias || '/30 dias', v_venc)) || v_itens;

    SELECT fm.dias_falta INTO v_faltas FROM public.frequencia_mensal fm
     WHERE fm.servidor_id = p_servidor_id AND fm.ano = v_ano AND fm.mes = EXTRACT(MONTH FROM p_d2)::int;
    IF NOT FOUND THEN v_inc := v_inc || jsonb_build_array('sem_frequencia_do_mes'); END IF;
    v_faltas := coalesce(v_faltas, 0);

    SELECT coalesce(sum(greatest(0, least(coalesce(l.data_fim, v_fim_pago), v_fim_pago)
                                    - greatest(l.data_inicio, v_ini_pago) + 1)), 0)::int
      INTO v_dias_lic
      FROM public.licencas_afastamentos l
     WHERE l.servidor_id = p_servidor_id AND l.status IN ('ativa', 'prorrogada', 'encerrada')
       AND NOT public.afastamento_remunerado(l.tipo_afastamento::text, l.tipo_licenca::text, p_d2);

    SELECT coalesce(sum(greatest(0, least(coalesce(c.data_retorno, c.data_fim, v_fim_pago), v_fim_pago)
                                    - greatest(c.data_inicio, v_ini_pago) + 1)), 0)::int
      INTO v_dias_ces
      FROM public.cessoes c
     WHERE c.servidor_id = p_servidor_id AND c.tipo = 'saida' AND c.onus = 'destino'
       AND c.data_inicio <= v_fim_pago AND coalesce(c.data_retorno, c.data_fim, v_fim_pago) >= v_ini_pago;
    IF EXISTS (SELECT 1 FROM public.cessoes c WHERE c.servidor_id = p_servidor_id AND c.tipo = 'saida' AND c.onus IS NULL
                  AND c.data_inicio <= v_fim_pago AND coalesce(c.data_retorno, c.data_fim, v_fim_pago) >= v_ini_pago) THEN
      v_inc := v_inc || jsonb_build_array('onus_da_cessao_nao_informado');
    END IF;

    -- os dias descontados nunca passam dos dias pagos
    v_rest := v_dias;
    v_faltas := least(v_faltas, v_rest); v_rest := v_rest - v_faltas;
    v_dias_lic := least(v_dias_lic, v_rest); v_rest := v_rest - v_dias_lic;
    v_dias_ces := least(v_dias_ces, v_rest);
    v_d_falta := round(v_venc / 30 * v_faltas, 2);
    v_d_lic := round(v_venc / 30 * v_dias_lic, 2);
    v_d_ces := round(v_venc / 30 * v_dias_ces, 2);
    IF v_faltas > 0 THEN
      v_itens := v_itens || jsonb_build_array(public.folha_item('Desconto de faltas', 'desconto', v_d_falta, v_faltas || ' dia(s)', v_venc));
    END IF;
    IF v_dias_lic > 0 THEN
      v_itens := v_itens || jsonb_build_array(public.folha_item('Desconto de licença/afastamento sem remuneração', 'desconto', v_d_lic, v_dias_lic || ' dia(s)', v_venc));
    END IF;
    IF v_dias_ces > 0 THEN
      v_itens := v_itens || jsonb_build_array(public.folha_item('Desconto de cessão com ônus no destino', 'desconto', v_d_ces, v_dias_ces || ' dia(s)', v_venc));
    END IF;

    -- férias iniciadas no mês: 1/3 constitucional (tributável só no IRRF) e abono pecuniário (indenizatório)
    SELECT coalesce(sum(round(v_venc / 30 * f.dias_gozados / 3.0, 2)), 0),
           coalesce(sum(round(v_venc / 30 * coalesce(f.dias_abono, 0) * 4.0 / 3.0, 2)), 0), count(*)
      INTO v_terco, v_abono, v_nferias
      FROM public.ferias_servidor f
     WHERE f.servidor_id = p_servidor_id AND f.data_inicio BETWEEN p_d1 AND p_d2
       AND f.status IN ('programada', 'em_gozo', 'concluida');
    IF v_terco > 0 THEN
      v_itens := v_itens || jsonb_build_array(public.folha_item('Adicional de 1/3 de férias', 'provento', v_terco, NULL, v_venc));
    END IF;
    IF v_abono > 0 THEN
      v_itens := v_itens || jsonb_build_array(public.folha_item('Abono pecuniário de férias (com 1/3)', 'provento', v_abono, NULL, v_venc));
    END IF;

    v_liq_dias := v_venc_prop - v_d_falta - v_d_lic - v_d_ces;
    v_base_inss := greatest(v_liq_dias + v_man_prov_inss, 0);
    IF v_tem_inss AND NOT v_rpps THEN v_inss := public.calcular_inss_servidor(v_base_inss, p_d2); END IF;

    v_qdep := public.count_dependentes_irrf(p_servidor_id, p_d2);
    IF v_qdep > 0 AND v_ded_cfg IS NULL THEN
      v_inc := v_inc || jsonb_build_array('deducao_dependente_nao_configurada');
    END IF;
    v_ded := v_qdep * coalesce(v_ded_cfg, 0);
    v_rend_irrf := greatest(v_liq_dias + v_terco + v_man_prov_irrf, 0);

    -- pensão alimentícia (percentual é número "30" = 30%; base líquida = proventos do mês − faltas − INSS − IRRF).
    -- A pensão judicial é dedutível do IRRF (Lei 9.250/1995, art. 4º, II) e, sobre o líquido, depende do IRRF:
    -- calcula pensão e IRRF de novo até o IRRF parar de mudar
    LOOP
      v_pensao := 0; v_pens_itens := '[]'::jsonb;
      FOR v_p IN SELECT * FROM public.pensoes_alimenticias pa
                  WHERE pa.servidor_id = p_servidor_id AND coalesce(pa.ativo, true) AND pa.data_inicio <= p_d2
                    AND (pa.data_fim IS NULL OR pa.data_fim >= p_d1) ORDER BY pa.prioridade NULLS LAST LOOP
        IF lower(v_p.tipo_calculo) LIKE 'perc%' THEN
          v_base_pensao := CASE WHEN lower(coalesce(v_p.base_calculo, '')) = 'bruto'
                                THEN v_liq_dias + v_terco + v_man_prov
                                ELSE greatest(v_liq_dias + v_terco + v_man_prov - v_inss - v_irrf, 0) END;
          v_val := round(v_base_pensao * coalesce(v_p.percentual, 0) / 100, 2);
        ELSE
          v_base_pensao := NULL;
          v_val := coalesce(v_p.valor_fixo, 0);
        END IF;
        v_pensao := v_pensao + v_val;
        v_pens_itens := v_pens_itens || jsonb_build_array(public.folha_item('Pensão alimentícia — ' || v_p.beneficiario_nome, 'desconto', v_val,
          NULL, v_base_pensao, CASE WHEN lower(v_p.tipo_calculo) LIKE 'perc%' THEN v_p.percentual END));
      END LOOP;

      v_irrf_ant := v_irrf;
      IF v_tem_irrf THEN
        v_irrf_r := public.calcular_irrf_mensal(v_rend_irrf, v_inss + v_ded + v_pensao, p_d2);
        v_irrf := (v_irrf_r ->> 'irrf')::numeric;
      END IF;
      v_iter := v_iter + 1;
      EXIT WHEN v_irrf = v_irrf_ant OR v_iter >= 20;
    END LOOP;

    IF v_tem_irrf THEN
      v_base_irrf := (v_irrf_r ->> 'base')::numeric;
      IF NOT (v_irrf_r ->> 'simplificado_configurado')::boolean THEN
        v_inc := v_inc || jsonb_build_array('desconto_simplificado_irrf_nao_configurado');
      END IF;
      IF NOT (v_irrf_r ->> 'reducao_configurada')::boolean THEN
        v_inc := v_inc || jsonb_build_array('reducao_irrf_nao_configurada');
      END IF;
    ELSE
      v_base_irrf := greatest(v_rend_irrf - v_inss - v_ded - v_pensao, 0);
    END IF;

    IF v_inss > 0 THEN
      v_itens := v_itens || jsonb_build_array(public.folha_item('INSS / previdência do servidor', 'desconto', v_inss, NULL, v_base_inss));
    END IF;
    IF v_irrf > 0 THEN
      v_ref_irrf := v_qdep || ' dependente(s)'
        || CASE WHEN (v_irrf_r ->> 'simplificado')::boolean THEN '; desconto simplificado' ELSE '' END
        || CASE WHEN (v_irrf_r ->> 'reducao')::numeric > 0 THEN '; redução Lei 15.270: ' || (v_irrf_r ->> 'reducao') ELSE '' END;
      v_itens := v_itens || jsonb_build_array(public.folha_item('IRRF', 'desconto', v_irrf, v_ref_irrf, v_base_irrf));
    END IF;

    -- consignações ativas na competência
    FOR v_c IN SELECT * FROM public.consignacoes c
                WHERE c.servidor_id = p_servidor_id AND coalesce(c.ativo, true) AND NOT coalesce(c.suspenso, false)
                  AND NOT coalesce(c.quitado, false) AND c.data_inicio <= p_d2 AND (c.data_fim IS NULL OR c.data_fim >= p_d1)
                  AND coalesce(c.parcelas_pagas, 0) < c.total_parcelas LOOP
      v_consig := v_consig + v_c.valor_parcela;
      v_itens := v_itens || jsonb_build_array(public.folha_item(
        'Consignação — ' || v_c.consignataria_nome, 'desconto', v_c.valor_parcela,
        (coalesce(v_c.parcelas_pagas, 0) + 1) || '/' || v_c.total_parcelas));
    END LOOP;

    v_itens := v_itens || v_pens_itens;

    v_prov := v_venc_prop + v_terco + v_abono + v_man_prov;
    v_desc := v_d_falta + v_d_lic + v_d_ces + v_inss + v_irrf + v_consig + v_pensao + v_man_desc;

  -- ================================================================== 13º SALÁRIO
  ELSIF p_tipo IN ('13_1a_parcela', '13_2a_parcela') THEN
    v_avos := public.folha_avos_13(v_ini, least(coalesce(v_prv.data_encerramento, make_date(v_ano, 12, 31)), make_date(v_ano, 12, 31)), v_ano);
    v_v13 := round(v_venc / 12 * v_avos, 2);
    IF p_tipo = '13_1a_parcela' THEN
      v_prov := round(v_v13 * 0.5, 2);
      v_itens := v_itens || jsonb_build_array(public.folha_item('13º salário — 1ª parcela (adiantamento)', 'provento', v_prov, v_avos || '/12 avos', v_venc));
      v_base_inss := 0; v_base_irrf := 0;
    ELSE
      v_prov := v_v13;
      v_itens := v_itens || jsonb_build_array(public.folha_item('13º salário', 'provento', v_v13, v_avos || '/12 avos', v_venc));
      SELECT coalesce(sum(i.valor), 0) INTO v_adiant
        FROM public.fichas_financeiras f JOIN public.itens_ficha_financeira i ON i.ficha_id = f.id
       WHERE f.servidor_id = p_servidor_id AND f.competencia_ano = v_ano AND f.tipo_folha = '13_1a_parcela'
         AND i.tipo = 'provento';
      IF v_adiant = 0 AND v_avos > 0 THEN v_inc := v_inc || jsonb_build_array('primeira_parcela_do_13_nao_localizada'); END IF;
      v_base_inss := v_v13;
      IF v_tem_inss AND NOT v_rpps THEN v_inss := public.calcular_inss_servidor(v_base_inss, p_d2); END IF;
      v_qdep := public.count_dependentes_irrf(p_servidor_id, p_d2);
      IF v_qdep > 0 AND v_ded_cfg IS NULL THEN v_inc := v_inc || jsonb_build_array('deducao_dependente_nao_configurada'); END IF;
      v_ded := v_qdep * coalesce(v_ded_cfg, 0);
      v_base_irrf := greatest(v_v13 - v_inss - v_ded, 0);
      IF v_tem_irrf THEN v_irrf := public.calcular_irrf(v_base_irrf, p_d2); END IF;
      IF v_adiant > 0 THEN
        v_itens := v_itens || jsonb_build_array(public.folha_item('Adiantamento do 13º (1ª parcela)', 'desconto', v_adiant));
      END IF;
      IF v_inss > 0 THEN
        v_itens := v_itens || jsonb_build_array(public.folha_item('INSS sobre o 13º', 'desconto', v_inss, NULL, v_base_inss));
      END IF;
      IF v_irrf > 0 THEN
        v_itens := v_itens || jsonb_build_array(public.folha_item('IRRF sobre o 13º (tributação exclusiva)', 'desconto', v_irrf, v_qdep || ' dependente(s)', v_base_irrf));
      END IF;
    END IF;
    v_prov := v_prov + v_man_prov;
    v_desc := v_adiant + v_inss + v_irrf + v_man_desc;
    v_liq_dias := v_prov;

  -- ===================================================================== RESCISÃO
  ELSE
    v_fim := v_prv.data_encerramento;
    v_avos := public.folha_avos_13(v_ini, v_fim, v_ano);
    v_v13 := round(v_venc / 12 * v_avos, 2);

    -- férias proporcionais: do último aniversário de admissão até o desligamento
    v_adm := coalesce(v_srv.data_admissao, v_ini);
    v_pa_ini := (v_adm + ((EXTRACT(YEAR FROM v_fim) - EXTRACT(YEAR FROM v_adm))::int * interval '1 year'))::date;
    IF v_pa_ini > v_fim THEN v_pa_ini := (v_pa_ini - interval '1 year')::date; END IF;
    v_meses := (EXTRACT(YEAR FROM age(v_fim + 1, v_pa_ini)) * 12 + EXTRACT(MONTH FROM age(v_fim + 1, v_pa_ini)))::int;
    v_resto := EXTRACT(DAY FROM age(v_fim + 1, v_pa_ini))::int;
    v_avos_fer := least(v_meses + CASE WHEN v_resto >= 15 THEN 1 ELSE 0 END, 12);
    v_dias_prop := 30 * v_avos_fer / 12.0;
    SELECT coalesce(sum(f.dias_gozados + coalesce(f.dias_abono, 0)), 0) INTO v_dias_goz
      FROM public.ferias_servidor f
     WHERE f.servidor_id = p_servidor_id AND f.status <> 'cancelada'
       AND f.periodo_aquisitivo_inicio BETWEEN v_pa_ini - 15 AND v_pa_ini + 15;
    v_dias_ind := greatest(v_dias_prop - v_dias_goz, 0);
    v_val_fer := round(v_venc / 30 * v_dias_ind, 2);

    -- períodos aquisitivos completos anteriores sem férias registradas: apurar à parte (não paga sozinho)
    v_pa_completos := greatest((EXTRACT(YEAR FROM age(v_pa_ini, v_adm)))::int, 0);
    SELECT coalesce(sum(f.dias_gozados + coalesce(f.dias_abono, 0)), 0) INTO v_dias_reg
      FROM public.ferias_servidor f
     WHERE f.servidor_id = p_servidor_id AND f.status <> 'cancelada' AND f.periodo_aquisitivo_inicio < v_pa_ini - 15;
    IF v_pa_completos * 30 > v_dias_reg THEN v_inc := v_inc || jsonb_build_array('ferias_vencidas_a_apurar'); END IF;
    v_inc := v_inc || jsonb_build_array('rescisao_conferir_calculo');

    IF v_val_fer > 0 THEN
      v_itens := v_itens || jsonb_build_array(
        public.folha_item('Férias proporcionais (indenizadas)', 'provento', v_val_fer, round(v_dias_ind, 2) || ' dia(s)', v_venc),
        public.folha_item('Adicional de 1/3 sobre férias proporcionais', 'provento', round(v_val_fer / 3.0, 2)));
    END IF;
    IF v_v13 > 0 THEN
      v_itens := v_itens || jsonb_build_array(public.folha_item('13º salário proporcional', 'provento', v_v13, v_avos || '/12 avos', v_venc));
    END IF;
    SELECT coalesce(sum(i.valor), 0) INTO v_adiant
      FROM public.fichas_financeiras f JOIN public.itens_ficha_financeira i ON i.ficha_id = f.id
     WHERE f.servidor_id = p_servidor_id AND f.competencia_ano = v_ano AND f.tipo_folha = '13_1a_parcela' AND i.tipo = 'provento';
    v_base_inss := v_v13;
    IF v_tem_inss AND NOT v_rpps THEN v_inss := public.calcular_inss_servidor(v_base_inss, p_d2); END IF;
    v_qdep := public.count_dependentes_irrf(p_servidor_id, p_d2);
    IF v_qdep > 0 AND v_ded_cfg IS NULL THEN v_inc := v_inc || jsonb_build_array('deducao_dependente_nao_configurada'); END IF;
    v_ded := v_qdep * coalesce(v_ded_cfg, 0);
    v_base_irrf := greatest(v_v13 - v_inss - v_ded, 0);
    IF v_tem_irrf THEN v_irrf := public.calcular_irrf(v_base_irrf, p_d2); END IF;
    IF v_adiant > 0 THEN
      v_itens := v_itens || jsonb_build_array(public.folha_item('Adiantamento do 13º (1ª parcela)', 'desconto', v_adiant));
    END IF;
    IF v_inss > 0 THEN v_itens := v_itens || jsonb_build_array(public.folha_item('INSS sobre o 13º', 'desconto', v_inss, NULL, v_base_inss)); END IF;
    IF v_irrf > 0 THEN v_itens := v_itens || jsonb_build_array(public.folha_item('IRRF sobre o 13º (tributação exclusiva)', 'desconto', v_irrf, NULL, v_base_irrf)); END IF;
    v_prov := v_val_fer + round(v_val_fer / 3.0, 2) + v_v13 + v_man_prov;
    v_desc := v_adiant + v_inss + v_irrf + v_man_desc;
  END IF;

  v_liq := v_prov - v_desc;
  IF v_liq < 0 THEN v_inc := v_inc || jsonb_build_array('liquido_negativo'); END IF;
  SELECT valor INTO v_teto FROM public.parametros_folha
   WHERE tipo_parametro = 'teto_remuneratorio' AND vigencia_inicio <= p_d2 AND (vigencia_fim IS NULL OR vigencia_fim >= p_d2)
   ORDER BY vigencia_inicio DESC LIMIT 1;
  IF v_teto IS NOT NULL AND v_prov > v_teto THEN v_inc := v_inc || jsonb_build_array('acima_do_teto_remuneratorio'); END IF;

  RETURN jsonb_build_object(
    'itens', v_itens, 'inconsistencias', v_inc, 'vencimento_base', v_venc,
    'total_proventos', round(v_prov, 2), 'total_descontos', round(v_desc, 2), 'valor_liquido', round(v_liq, 2),
    'base_inss', round(v_base_inss, 2), 'valor_inss', round(v_inss, 2),
    'base_irrf', round(v_base_irrf, 2), 'valor_irrf', round(v_irrf, 2),
    'quantidade_dependentes', v_qdep, 'valor_deducao_dependentes', round(v_ded, 2));
END;
$$;


CREATE OR REPLACE FUNCTION public.processar_folha_pagamento(p_folha_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_folha record;
  v_tipo text;
  v_d1 date;
  v_d2 date;
  v_ano int;
  v_srv record;
  v_r jsonb;
  v_item jsonb;
  v_ficha_id uuid;
  v_ordem int;
  v_manuais jsonb;
  v_manuais_total int;
  v_manuais_gravados int := 0;
  v_count int := 0;
  v_elegiveis int := 0;
  v_sem_venc int := 0;
  v_errors jsonb := '[]'::jsonb;
  v_avisos jsonb := '[]'::jsonb;
  v_tabelas jsonb;
  v_tem_inss boolean;
  v_tem_irrf boolean;
  v_ded_dep numeric;
  v_protocolo text;
  v_cedidos int;
  v_inicio timestamptz := clock_timestamp();
BEGIN
  IF NOT public.has_permission_code(auth.uid(), 'financeiro.folha.processar') THEN
    RAISE EXCEPTION 'Sem permissão para processar a folha' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_folha FROM public.folhas_pagamento WHERE id = p_folha_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('sucesso', false, 'erro', 'Folha não encontrada', 'servidores_processados', 0);
  END IF;
  IF v_folha.status NOT IN ('aberta', 'processando', 'reaberta', 'previa') THEN
    RETURN jsonb_build_object('sucesso', false, 'erro', 'Folha não está em status que permita processamento. Status atual: ' || v_folha.status, 'servidores_processados', 0);
  END IF;

  v_tipo := v_folha.tipo_folha::text;
  IF v_tipo NOT IN ('mensal', '13_1a_parcela', '13_2a_parcela', 'rescisao') THEN
    RETURN jsonb_build_object('sucesso', false, 'servidores_processados', 0,
      'erro', 'Folha do tipo ' || v_tipo || ' não tem cálculo automático: lance os valores manualmente nas fichas');
  END IF;

  v_ano := v_folha.competencia_ano;
  v_d1 := make_date(v_folha.competencia_ano, v_folha.competencia_mes, 1);
  v_d2 := (v_d1 + interval '1 month - 1 day')::date;

  v_protocolo := public.rh_protocolo_atual('folha',
    format('Processamento da folha %s/%s (%s)', v_folha.competencia_mes, v_folha.competencia_ano, v_tipo),
    NULL, jsonb_build_object('folha_id', p_folha_id, 'tipo_folha', v_tipo));

  UPDATE public.folhas_pagamento SET status = 'processando', updated_at = now() WHERE id = p_folha_id;

  -- tabelas e parâmetros necessários: existência na data de referência
  v_tem_inss := EXISTS (SELECT 1 FROM public.tabela_inss t WHERE t.vigencia_inicio <= v_d2 AND (t.vigencia_fim IS NULL OR t.vigencia_fim >= v_d2));
  v_tem_irrf := EXISTS (SELECT 1 FROM public.tabela_irrf t WHERE t.vigencia_inicio <= v_d2 AND (t.vigencia_fim IS NULL OR t.vigencia_fim >= v_d2));
  SELECT valor INTO v_ded_dep FROM public.parametros_folha
   WHERE tipo_parametro = 'deducao_dependente_irrf' AND vigencia_inicio <= v_d2 AND (vigencia_fim IS NULL OR vigencia_fim >= v_d2)
   ORDER BY vigencia_inicio DESC LIMIT 1;
  v_tabelas := jsonb_build_object('inss', v_tem_inss, 'irrf', v_tem_irrf, 'ded_dep', v_ded_dep);
  IF NOT v_tem_inss THEN v_avisos := v_avisos || jsonb_build_array('Tabela de INSS/previdência sem vigência em ' || v_d2 || ': o desconto saiu zero'); END IF;
  IF NOT v_tem_irrf THEN v_avisos := v_avisos || jsonb_build_array('Tabela de IRRF sem vigência em ' || v_d2 || ': o desconto saiu zero'); END IF;
  IF v_ded_dep IS NULL THEN v_avisos := v_avisos || jsonb_build_array('Parâmetro deducao_dependente_irrf não configurado: dependentes não foram deduzidos'); END IF;

  -- lançamentos manuais das fichas atuais: guardados e devolvidos às fichas novas
  SELECT coalesce(jsonb_agg(jsonb_build_object(
           'servidor_id', f.servidor_id, 'descricao', i.descricao, 'tipo', i.tipo, 'valor', i.valor,
           'rubrica_id', i.rubrica_id, 'referencia', i.referencia, 'base_calculo', i.base_calculo,
           'percentual', i.percentual)), '[]'::jsonb)
    INTO v_manuais
    FROM public.fichas_financeiras f JOIN public.itens_ficha_financeira i ON i.ficha_id = f.id
   WHERE f.folha_id = p_folha_id AND i.origem = 'manual';
  v_manuais_total := jsonb_array_length(v_manuais);

  DELETE FROM public.fichas_financeiras WHERE folha_id = p_folha_id;

  FOR v_srv IN
    SELECT s.id, s.nome_completo, s.banco_codigo, s.banco_nome, s.banco_agencia, s.banco_conta, s.banco_tipo_conta,
           pv.id AS provimento_id, pv.cargo_id, pv.unidade_id, c.nome AS cargo_nome,
           public.vencimento_cargo_em(c.id, v_d2) AS vencimento_base, eo.nome AS unidade_nome, eo.sigla AS unidade_sigla
      FROM public.servidores s
      JOIN LATERAL (
        SELECT p.* FROM public.provimentos p
         WHERE p.servidor_id = s.id AND p.status IN ('ativo', 'suspenso', 'encerrado')
           AND CASE v_tipo
                 WHEN 'mensal' THEN coalesce(p.data_exercicio, p.data_nomeacao) <= v_d2
                                    AND (p.data_encerramento IS NULL OR p.data_encerramento >= v_d1)
                 WHEN 'rescisao' THEN p.status = 'encerrado' AND p.data_encerramento BETWEEN v_d1 AND v_d2
                                    AND p.motivo_encerramento IN ('exoneracao', 'exoneracao_pedido', 'exoneracao_oficio',
                                        'termino_mandato', 'demissao', 'aposentadoria', 'vacancia', 'falecimento')
                 ELSE coalesce(p.data_exercicio, p.data_nomeacao) <= make_date(v_ano, 12, 31)
                      AND (p.data_encerramento IS NULL OR p.data_encerramento >= make_date(v_ano, 1, 1))
               END
         ORDER BY coalesce(p.data_exercicio, p.data_nomeacao) DESC LIMIT 1) pv ON true
      JOIN public.cargos c ON c.id = pv.cargo_id
      LEFT JOIN public.estrutura_organizacional eo ON eo.id = pv.unidade_id
     ORDER BY s.nome_completo
  LOOP
    v_elegiveis := v_elegiveis + 1;
    BEGIN
      IF v_srv.vencimento_base <= 0 THEN
        v_sem_venc := v_sem_venc + 1;
        v_errors := v_errors || jsonb_build_object('servidor_id', v_srv.id, 'nome', v_srv.nome_completo,
                                                   'cargo', v_srv.cargo_nome, 'erro', 'Cargo sem vencimento base definido');
        CONTINUE;
      END IF;

      v_r := public.folha_montar_ficha(v_srv.id, v_srv.provimento_id, v_tipo, v_d1, v_d2, v_manuais, v_tabelas);
      IF NOT public.portaria_nomeacao_publicada(v_srv.id, v_srv.provimento_id, v_srv.cargo_id) THEN
        v_r := jsonb_set(v_r, '{inconsistencias}', (v_r -> 'inconsistencias') || jsonb_build_array('portaria_de_nomeacao_nao_publicada'));
      END IF;

      -- 13º sem avos (ingresso depois do ano) ou ficha sem nenhum valor: não gera ficha vazia
      IF (v_r ->> 'total_proventos')::numeric = 0 AND (v_r ->> 'total_descontos')::numeric = 0 THEN
        CONTINUE;
      END IF;

      INSERT INTO public.fichas_financeiras (
        folha_id, servidor_id, competencia_ano, competencia_mes, tipo_folha, cargo_id, cargo_nome, cargo_vencimento,
        unidade_id, unidade_nome, total_proventos, total_descontos, valor_liquido, base_inss, valor_inss, base_irrf,
        valor_irrf, quantidade_dependentes, valor_deducao_dependentes, banco_codigo, banco_nome, banco_agencia,
        banco_conta, banco_tipo_conta, processado, data_processamento, tem_inconsistencia, inconsistencias)
      VALUES (
        p_folha_id, v_srv.id, v_folha.competencia_ano, v_folha.competencia_mes, v_tipo, v_srv.cargo_id, v_srv.cargo_nome,
        v_srv.vencimento_base, v_srv.unidade_id, COALESCE(v_srv.unidade_sigla, '') || ' - ' || COALESCE(v_srv.unidade_nome, ''),
        (v_r ->> 'total_proventos')::numeric, (v_r ->> 'total_descontos')::numeric, (v_r ->> 'valor_liquido')::numeric,
        (v_r ->> 'base_inss')::numeric, (v_r ->> 'valor_inss')::numeric, (v_r ->> 'base_irrf')::numeric,
        (v_r ->> 'valor_irrf')::numeric, (v_r ->> 'quantidade_dependentes')::int, (v_r ->> 'valor_deducao_dependentes')::numeric,
        v_srv.banco_codigo, v_srv.banco_nome, v_srv.banco_agencia, v_srv.banco_conta, v_srv.banco_tipo_conta,
        true, now(), jsonb_array_length(v_r -> 'inconsistencias') > 0, v_r -> 'inconsistencias')
      RETURNING id INTO v_ficha_id;

      v_ordem := 0;
      FOR v_item IN SELECT e FROM jsonb_array_elements(v_r -> 'itens') e LOOP
        v_ordem := v_ordem + 1;
        INSERT INTO public.itens_ficha_financeira (ficha_id, rubrica_id, descricao, tipo, valor, referencia, base_calculo,
                                                   percentual, ordem, origem)
        VALUES (v_ficha_id, nullif(v_item ->> 'rubrica_id', '')::uuid, v_item ->> 'descricao', v_item ->> 'tipo',
                (v_item ->> 'valor')::numeric, v_item ->> 'referencia', nullif(v_item ->> 'base', '')::numeric,
                nullif(v_item ->> 'percentual', '')::numeric, v_ordem, v_item ->> 'origem');
        IF v_item ->> 'origem' = 'manual' THEN v_manuais_gravados := v_manuais_gravados + 1; END IF;
      END LOOP;

      v_count := v_count + 1;
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors || jsonb_build_object('servidor_id', v_srv.id, 'nome', v_srv.nome_completo, 'erro', SQLERRM);
    END;
  END LOOP;

  IF v_manuais_gravados < v_manuais_total THEN
    v_avisos := v_avisos || jsonb_build_array(
      (v_manuais_total - v_manuais_gravados) || ' lançamento(s) manual(is) não voltaram porque o servidor não entra mais nesta folha');
  END IF;
  IF v_tipo = 'mensal' THEN
    SELECT count(DISTINCT c.servidor_id) INTO v_cedidos FROM public.cessoes c
     WHERE c.tipo = 'entrada' AND c.ativa AND NOT EXISTS (
       SELECT 1 FROM public.provimentos p WHERE p.servidor_id = c.servidor_id AND p.status IN ('ativo', 'suspenso'));
    IF v_cedidos > 0 THEN
      v_avisos := v_avisos || jsonb_build_array(v_cedidos || ' cedido(s) de outro órgão não entram na folha (ônus da origem)');
    END IF;
  END IF;

  PERFORM set_config('trilha.renovar_decisao', 'folhas_pagamento.processado_por', true);
  UPDATE public.folhas_pagamento
     SET total_bruto = COALESCE((SELECT SUM(total_proventos) FROM public.fichas_financeiras WHERE folha_id = p_folha_id), 0),
         total_descontos = COALESCE((SELECT SUM(total_descontos) FROM public.fichas_financeiras WHERE folha_id = p_folha_id), 0),
         total_liquido = COALESCE((SELECT SUM(valor_liquido) FROM public.fichas_financeiras WHERE folha_id = p_folha_id), 0),
         total_inss_servidor = COALESCE((SELECT SUM(valor_inss) FROM public.fichas_financeiras WHERE folha_id = p_folha_id), 0),
         total_irrf = COALESCE((SELECT SUM(valor_irrf) FROM public.fichas_financeiras WHERE folha_id = p_folha_id), 0),
         quantidade_servidores = v_count,
         status = 'aberta',
         data_processamento = now(),
         processado_por = auth.uid(),
         tempo_processamento_ms = (EXTRACT(EPOCH FROM clock_timestamp() - v_inicio) * 1000)::int,
         updated_at = now()
   WHERE id = p_folha_id;
  PERFORM set_config('trilha.renovar_decisao', '', true);

  RETURN jsonb_build_object(
    'sucesso', true,
    'protocolo', v_protocolo,
    'servidores_processados', v_count,
    'total_servidores_ativos', v_elegiveis,
    'total_com_provimento', v_elegiveis,
    'total_sem_vencimento', v_sem_venc,
    'erros', v_errors,
    'avisos', v_avisos);

EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE;
  WHEN OTHERS THEN
    PERFORM set_config('trilha.renovar_decisao', '', true);
    UPDATE public.folhas_pagamento SET status = 'aberta', updated_at = now() WHERE id = p_folha_id;
    RETURN jsonb_build_object('sucesso', false, 'erro', SQLERRM, 'servidores_processados', v_count);
END;
$$;


-- ---------------------------------------------------------------------------
-- 7. Privilégios (o mesmo texto vai ao overlay/40 do baseline)
-- ---------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.ato_remuneratorio_integridade() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ato_remuneratorio_item_integridade() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cargo_vencimento_pelo_cadastro() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.aplicar_ato_remuneratorio(uuid) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.aplicar_ato_remuneratorio(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.vencimento_cargo_em(uuid, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vencimento_cargo_em(uuid, date) TO authenticated;

NOTIFY pgrst, 'reload schema';
