-- RH: quadro de vagas com código único, ocupação sem sobreposição e histórico por vaga.
--
-- Antes: o cargo tinha só um número (cargos.quantidade_vagas). Na nomeação, dois triggers contavam os provimentos
-- ativos do cargo e recusavam acima do número; a vaga não tinha identidade (não se sabia qual vaga cada pessoa
-- ocupava), duas nomeações simultâneas podiam passar da conta e não havia histórico por vaga.
--
-- Agora (spec docs/superpowers/specs/2026-10-12-rh-quadro-vagas-design.md):
--   1. vagas_cargo: cada vaga do cargo, com código único (ex.: CDS-1.001), unidade opcional, data e ato de criação e de
--      extinção. Catálogo sem dado pessoal (mapa.csv: catalogo, escrita com governanca.cargos.gerenciar).
--   2. provimentos.vaga_id: a ocupação da vaga é o provimento. O trigger trg_provimento_vaga
--      (a) escolhe sozinho uma vaga livre do cargo quando o provimento fica ativo sem vaga (mesma unidade primeiro);
--      (b) trava a vaga (FOR UPDATE) e recusa período sobreposto com outro ocupante da mesma vaga: só entra outra
--          pessoa depois da data de saída da anterior (o dia da saída já pode ser o dia da entrada do sucessor);
--      (c) recusa vaga de outro cargo ou ocupação além da extinção da vaga.
--      Índice único parcial: no máximo um provimento em aberto (sem data de encerramento) por vaga.
--      Cargo que ainda não tem vaga cadastrada segue a regra antiga (contagem por cargos.quantidade_vagas).
--   3. v_quadro_vagas (situação atual de cada vaga) e v_vagas_historico (criação, extinção, entradas e saídas de
--      todas as vagas, em ordem de data). Ambas security_invoker: o nome do ocupante segue a RLS de provimentos e
--      servidores (RH); a situação (livre, ocupada, extinta) vem de rh_vaga_situacao, que não expõe dado pessoal.
--   4. rh_importar_quadro_vagas(linhas, gravar): importa a planilha de cargos e vagas. Sem gravar, simula e devolve o
--      relatório; gravando, tudo ou nada. Nunca apaga nem sobrescreve: cargo existente (mesmo nome e símbolo) é reaproveitado,
--      código de vaga existente é pulado, e por quantidade só cria as vagas que faltam. Depois liga os ocupantes
--      atuais (provimentos ativos sem vaga) a vagas livres do cargo; quem sobra aparece como aviso de excesso.
-- A trilha (fn_audit_trigger) registra cada vaga criada, alterada ou extinta; autoria e regra de setor como no RH.

-- ---------------------------------------------------------------------------
-- 1. Tabela de vagas
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vagas_cargo (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  codigo text NOT NULL,
  cargo_id uuid NOT NULL REFERENCES public.cargos(id) ON DELETE RESTRICT,
  unidade_id uuid REFERENCES public.estrutura_organizacional(id) ON DELETE RESTRICT,
  data_criacao date NOT NULL,
  ato_criacao text,
  data_extincao date,
  ato_extincao text,
  observacoes text,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  created_by_servidor_id uuid,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid,
  updated_by_servidor_id uuid,
  CONSTRAINT vagas_cargo_codigo_check CHECK (codigo = upper(btrim(codigo)) AND codigo <> ''),
  CONSTRAINT vagas_cargo_extincao_check CHECK (data_extincao IS NULL OR data_extincao >= data_criacao)
);

COMMENT ON TABLE public.vagas_cargo IS 'Quadro de vagas: cada vaga de um cargo, com código único. Quem ocupa e quando: provimentos.vaga_id (sem sobreposição, trigger trg_provimento_vaga). Migração 20261012150000.';
COMMENT ON COLUMN public.vagas_cargo.codigo IS 'Código único da vaga (maiúsculo). Gerado como <símbolo>.<nnn> pela importação quando a planilha não traz.';

CREATE UNIQUE INDEX IF NOT EXISTS vagas_cargo_codigo_uidx ON public.vagas_cargo (codigo);
CREATE INDEX IF NOT EXISTS idx_vagas_cargo_cargo ON public.vagas_cargo (cargo_id);
CREATE INDEX IF NOT EXISTS idx_vagas_cargo_unidade ON public.vagas_cargo (unidade_id);

ALTER TABLE public.vagas_cargo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vagas_cargo FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.vagas_cargo FROM anon;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.vagas_cargo FROM anon, authenticated;

-- policies geradas por scripts/db/gerar-rls.mjs (mapa.csv: vagas_cargo, catalogo, rh|governanca,
-- escrita=governanca.cargos.gerenciar)
DROP POLICY IF EXISTS "rls_select" ON public.vagas_cargo;
CREATE POLICY "rls_select" ON public.vagas_cargo FOR SELECT TO authenticated
  USING (public.is_active_user());
DROP POLICY IF EXISTS "rls_insert" ON public.vagas_cargo;
CREATE POLICY "rls_insert" ON public.vagas_cargo FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'governanca')) AND public.has_permission_code(auth.uid(), 'governanca.cargos.gerenciar'));
DROP POLICY IF EXISTS "rls_update" ON public.vagas_cargo;
CREATE POLICY "rls_update" ON public.vagas_cargo FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'governanca')) AND public.has_permission_code(auth.uid(), 'governanca.cargos.gerenciar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'governanca')) AND public.has_permission_code(auth.uid(), 'governanca.cargos.gerenciar'));
DROP POLICY IF EXISTS "rls_delete" ON public.vagas_cargo;
CREATE POLICY "rls_delete" ON public.vagas_cargo FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh') OR public.can_access_module(auth.uid(), 'governanca')) AND public.has_permission_code(auth.uid(), 'governanca.cargos.gerenciar'));

-- ---------------------------------------------------------------------------
-- 2. Ocupação: provimentos.vaga_id
-- ---------------------------------------------------------------------------
ALTER TABLE public.provimentos ADD COLUMN IF NOT EXISTS vaga_id uuid REFERENCES public.vagas_cargo(id) ON DELETE RESTRICT;
COMMENT ON COLUMN public.provimentos.vaga_id IS 'Vaga ocupada (vagas_cargo). Período: data_nomeacao até data_encerramento (exclusiva); sem sobreposição na mesma vaga.';
CREATE INDEX IF NOT EXISTS idx_provimentos_vaga ON public.provimentos (vaga_id) WHERE vaga_id IS NOT NULL;
-- no máximo um ocupante em aberto por vaga (o trigger cobre também os períodos já encerrados)
CREATE UNIQUE INDEX IF NOT EXISTS provimentos_vaga_aberta_uidx ON public.provimentos (vaga_id)
  WHERE vaga_id IS NOT NULL AND data_encerramento IS NULL;

-- Escolhe vaga livre, trava a vaga e recusa sobreposição. Nome trg_provimento_vaga: roda antes de
-- trg_validar_provimento e trigger_validar_provimento (ordem alfabética), que pulam a contagem quando há vaga.
CREATE OR REPLACE FUNCTION public.rh_provimento_vaga()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_vaga record;
  v_conf record;
  v_cargo text;
  v_total int;
BEGIN
  -- encerrado sem data: a vaga fica livre a partir de hoje (senão o período ficaria aberto para sempre)
  IF NEW.vaga_id IS NOT NULL AND NEW.status IN ('encerrado', 'vacante') AND NEW.data_encerramento IS NULL THEN
    NEW.data_encerramento := public.data_local();
  END IF;

  -- provimento que passa a ocupar o cargo sem vaga informada: pega a primeira vaga livre do cargo
  IF NEW.vaga_id IS NULL AND NEW.status IN ('ativo', 'suspenso')
     AND (TG_OP = 'INSERT' OR OLD.status NOT IN ('ativo', 'suspenso') OR NEW.cargo_id IS DISTINCT FROM OLD.cargo_id)
     AND EXISTS (SELECT 1 FROM public.vagas_cargo WHERE cargo_id = NEW.cargo_id) THEN
    FOR v_vaga IN
      SELECT v.id FROM public.vagas_cargo v
       WHERE v.cargo_id = NEW.cargo_id
         AND v.data_extincao IS NULL
       ORDER BY (v.unidade_id IS NOT DISTINCT FROM NEW.unidade_id) DESC, (v.unidade_id IS NULL) DESC, v.codigo
    LOOP
      PERFORM 1 FROM public.vagas_cargo WHERE id = v_vaga.id FOR UPDATE;
      IF NOT EXISTS (SELECT 1 FROM public.provimentos p
                      WHERE p.vaga_id = v_vaga.id AND p.id <> NEW.id
                        AND daterange(p.data_nomeacao, p.data_encerramento, '[)')
                            && daterange(NEW.data_nomeacao, NEW.data_encerramento, '[)')) THEN
        NEW.vaga_id := v_vaga.id;
        EXIT;
      END IF;
    END LOOP;
    IF NEW.vaga_id IS NULL THEN
      SELECT coalesce(sigla || ' - ', '') || nome INTO v_cargo FROM public.cargos WHERE id = NEW.cargo_id;
      SELECT count(*) INTO v_total FROM public.vagas_cargo WHERE cargo_id = NEW.cargo_id AND data_extincao IS NULL;
      RAISE EXCEPTION 'Não há vaga livre no cargo % (% vaga(s), todas ocupadas em %)',
        v_cargo, v_total, to_char(NEW.data_nomeacao, 'DD/MM/YYYY')
        USING ERRCODE = '23P01',
              HINT = 'Registre a saída (exoneração) de quem ocupa a vaga, ou crie uma vaga nova por ato, antes de nomear.';
    END IF;
  END IF;

  IF NEW.vaga_id IS NOT NULL THEN
    SELECT * INTO v_vaga FROM public.vagas_cargo WHERE id = NEW.vaga_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Vaga não encontrada';
    END IF;
    IF v_vaga.cargo_id IS DISTINCT FROM NEW.cargo_id THEN
      RAISE EXCEPTION 'A vaga % é de outro cargo', v_vaga.codigo;
    END IF;
    IF NEW.data_encerramento IS NOT NULL AND NEW.data_encerramento < NEW.data_nomeacao THEN
      RAISE EXCEPTION 'Data de saída (%) anterior à de entrada (%)',
        to_char(NEW.data_encerramento, 'DD/MM/YYYY'), to_char(NEW.data_nomeacao, 'DD/MM/YYYY');
    END IF;
    IF v_vaga.data_extincao IS NOT NULL
       AND coalesce(NEW.data_encerramento, 'infinity'::date) > v_vaga.data_extincao THEN
      RAISE EXCEPTION 'A vaga % foi extinta em %: ocupação não pode passar dessa data',
        v_vaga.codigo, to_char(v_vaga.data_extincao, 'DD/MM/YYYY');
    END IF;
    SELECT p.data_nomeacao, p.data_encerramento, coalesce(s.nome_social, s.nome_completo) AS nome
      INTO v_conf
      FROM public.provimentos p
      LEFT JOIN public.servidores s ON s.id = p.servidor_id
     WHERE p.vaga_id = NEW.vaga_id AND p.id <> NEW.id
       AND daterange(p.data_nomeacao, p.data_encerramento, '[)')
           && daterange(NEW.data_nomeacao, NEW.data_encerramento, '[)')
     ORDER BY p.data_nomeacao DESC
     LIMIT 1;
    IF FOUND THEN
      RAISE EXCEPTION 'A vaga % já está ocupada por % de % até %', v_vaga.codigo, coalesce(v_conf.nome, 'outro servidor'),
        to_char(v_conf.data_nomeacao, 'DD/MM/YYYY'),
        coalesce(to_char(v_conf.data_encerramento, 'DD/MM/YYYY'), 'hoje (sem data de saída)')
        USING ERRCODE = '23P01',
              HINT = 'Uma vaga tem uma pessoa por vez: registre a saída do ocupante antes de nomear outra pessoa nela.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_provimento_vaga ON public.provimentos;
CREATE TRIGGER trg_provimento_vaga BEFORE INSERT OR UPDATE ON public.provimentos
  FOR EACH ROW EXECUTE FUNCTION public.rh_provimento_vaga();

-- As validações antigas contam provimentos ativos do cargo; com vaga, quem decide é trg_provimento_vaga.
CREATE OR REPLACE FUNCTION public.fn_validar_provimento()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_cargo RECORD;
  v_vinculo_ativo RECORD;
  v_provimento_ativo INTEGER;
  v_vagas_ocupadas INTEGER;
BEGIN
  SELECT * INTO v_cargo FROM public.cargos WHERE id = NEW.cargo_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Cargo não encontrado'; END IF;

  IF NEW.status = 'ativo' THEN
    SELECT COUNT(*) INTO v_provimento_ativo
    FROM public.provimentos
    WHERE servidor_id = NEW.servidor_id AND status = 'ativo'
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

    IF v_provimento_ativo > 0 THEN
      RAISE EXCEPTION 'Servidor já possui provimento ativo';
    END IF;
  END IF;

  -- cargo com quadro de vagas: a vaga (trg_provimento_vaga) já garante o limite
  IF NEW.vaga_id IS NULL THEN
    SELECT COUNT(*) INTO v_vagas_ocupadas
    FROM public.provimentos
    WHERE cargo_id = NEW.cargo_id AND status = 'ativo'
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

    IF v_vagas_ocupadas >= COALESCE(v_cargo.quantidade_vagas, 1) THEN
      RAISE EXCEPTION 'Não há vagas disponíveis para o cargo %', v_cargo.nome;
    END IF;
  END IF;

  SELECT * INTO v_vinculo_ativo
  FROM public.vinculos_funcionais
  WHERE servidor_id = NEW.servidor_id AND ativo = true
  ORDER BY data_inicio DESC LIMIT 1;

  IF v_vinculo_ativo.tipo_vinculo = 'cedido_entrada' THEN
    RAISE EXCEPTION 'Servidor cedido de outro órgão não pode ter nomeação no IDJuv';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validar_provimento()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  qtd_atual INTEGER;
  qtd_max INTEGER;
BEGIN
  -- cargo com quadro de vagas: a vaga (trg_provimento_vaga) já garante o limite
  IF NEW.vaga_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Contar provimentos ativos para o cargo
  SELECT COUNT(*) INTO qtd_atual
  FROM public.provimentos
  WHERE cargo_id = NEW.cargo_id
    AND status = 'ativo'
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

  -- Obter quantidade máxima de vagas
  SELECT quantidade_vagas INTO qtd_max
  FROM public.cargos
  WHERE id = NEW.cargo_id;

  -- Validar se não excede
  IF NEW.status = 'ativo' AND qtd_atual >= COALESCE(qtd_max, 0) THEN
    RAISE EXCEPTION 'Quantidade máxima de provimentos para este cargo foi atingida (% de %)', qtd_atual, qtd_max;
  END IF;

  RETURN NEW;
END;
$function$;

-- Vaga: código normalizado; não muda de cargo depois de ocupada; não é extinta com ocupante depois da data.
CREATE OR REPLACE FUNCTION public.rh_vagas_cargo_validar()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF EXISTS (SELECT 1 FROM public.provimentos WHERE vaga_id = OLD.id) THEN
      RAISE EXCEPTION 'A vaga % tem histórico de ocupação e não pode ser apagada; registre a extinção', OLD.codigo;
    END IF;
    RETURN OLD;
  END IF;
  NEW.codigo := upper(btrim(NEW.codigo));
  -- sem data de criação: hoje no fuso do órgão (data_local não é executável pela API, por isso aqui e não no DEFAULT)
  NEW.data_criacao := coalesce(NEW.data_criacao, public.data_local());
  IF TG_OP = 'UPDATE' THEN
    IF NEW.cargo_id IS DISTINCT FROM OLD.cargo_id
       AND EXISTS (SELECT 1 FROM public.provimentos WHERE vaga_id = NEW.id) THEN
      RAISE EXCEPTION 'A vaga % já teve ocupantes e não pode mudar de cargo', NEW.codigo;
    END IF;
    IF NEW.codigo IS DISTINCT FROM OLD.codigo
       AND EXISTS (SELECT 1 FROM public.provimentos WHERE vaga_id = NEW.id) THEN
      RAISE EXCEPTION 'A vaga % já teve ocupantes e o código não pode mudar', OLD.codigo;
    END IF;
  END IF;
  IF NEW.data_extincao IS NOT NULL AND EXISTS (
       SELECT 1 FROM public.provimentos p
        WHERE p.vaga_id = NEW.id AND coalesce(p.data_encerramento, 'infinity'::date) > NEW.data_extincao) THEN
    RAISE EXCEPTION 'A vaga % tem ocupante depois de %: registre a saída antes de extinguir',
      NEW.codigo, to_char(NEW.data_extincao, 'DD/MM/YYYY');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vagas_cargo_validar ON public.vagas_cargo;
CREATE TRIGGER trg_vagas_cargo_validar BEFORE INSERT OR UPDATE OR DELETE ON public.vagas_cargo
  FOR EACH ROW EXECUTE FUNCTION public.rh_vagas_cargo_validar();

-- autoria, trilha e regra de setor, como em toda tabela do RH (scripts/check-autoria-rh.mjs)
DROP TRIGGER IF EXISTS zz_fixar_autoria ON public.vagas_cargo;
CREATE TRIGGER zz_fixar_autoria BEFORE INSERT OR UPDATE ON public.vagas_cargo
  FOR EACH ROW EXECUTE FUNCTION public.fixar_autoria();
DROP TRIGGER IF EXISTS audit_vagas_cargo ON public.vagas_cargo;
CREATE TRIGGER audit_vagas_cargo AFTER INSERT OR UPDATE OR DELETE ON public.vagas_cargo
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger('rh');

-- regra de setor: vagas_cargo entra em lancamento_modulos_tabela (módulos rh e governanca, como composicao_cargos)
CREATE OR REPLACE FUNCTION public.lancamento_modulos_tabela(p_tabela text)
 RETURNS text[]
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN CASE
    WHEN p_tabela IN ('consignacoes', 'dependentes_irrf', 'eventos_esocial', 'fichas_financeiras', 'folhas_pagamento',
                      'itens_ficha_financeira', 'itens_retorno_bancario', 'lancamentos_folha', 'parametros_folha',
                      'pensoes_alimenticias', 'remessas_bancarias', 'rubricas', 'tabela_inss', 'tabela_irrf',
                      'retornos_bancarios', 'exportacoes_folha', 'viagens_diarias', 'contas_autarquia', 'config_autarquia',
                      'config_institucional')
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
$function$;

DROP TRIGGER IF EXISTS zz_exigir_setor ON public.vagas_cargo;
CREATE TRIGGER zz_exigir_setor BEFORE INSERT OR UPDATE OR DELETE ON public.vagas_cargo
  FOR EACH ROW EXECUTE FUNCTION public.exigir_setor();
DROP TRIGGER IF EXISTS zz_exigir_setor_fim ON public.vagas_cargo;
CREATE TRIGGER zz_exigir_setor_fim AFTER INSERT OR UPDATE OR DELETE ON public.vagas_cargo
  FOR EACH STATEMENT EXECUTE FUNCTION public.exigir_setor_fim();

-- ---------------------------------------------------------------------------
-- 3. Situação atual e histórico
-- ---------------------------------------------------------------------------
-- Situação e ocupante de hoje (data_local, no fuso do órgão). DEFINER para enxergar todos os provimentos, mas só
-- devolvem a situação e o id do provimento (sem dado pessoal): quem não lê provimentos (RLS) vê a vaga ocupada sem o nome.
CREATE OR REPLACE FUNCTION public.rh_vaga_ocupante_atual(p_vaga_id uuid)
RETURNS uuid LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT public.is_active_user() THEN
    RETURN NULL;
  END IF;
  SELECT p.id INTO v_id FROM public.provimentos p
   WHERE p.vaga_id = p_vaga_id
     AND (p.data_encerramento IS NULL OR p.data_encerramento > public.data_local())
   ORDER BY p.data_nomeacao DESC
   LIMIT 1;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.rh_vaga_situacao(p_vaga_id uuid)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_extincao date;
BEGIN
  IF NOT public.is_active_user() THEN
    RETURN NULL;
  END IF;
  SELECT data_extincao INTO v_extincao FROM public.vagas_cargo WHERE id = p_vaga_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  IF v_extincao IS NOT NULL AND v_extincao <= public.data_local() THEN
    RETURN 'extinta';
  END IF;
  RETURN CASE WHEN public.rh_vaga_ocupante_atual(p_vaga_id) IS NULL THEN 'livre' ELSE 'ocupada' END;
END;
$$;

CREATE OR REPLACE VIEW public.v_quadro_vagas WITH (security_invoker = true) AS
SELECT v.id,
       v.codigo,
       v.cargo_id,
       c.nome AS cargo_nome,
       c.sigla AS cargo_sigla,
       c.categoria AS cargo_categoria,
       v.unidade_id,
       u.nome AS unidade_nome,
       u.sigla AS unidade_sigla,
       v.data_criacao,
       v.ato_criacao,
       v.data_extincao,
       v.ato_extincao,
       v.observacoes,
       public.rh_vaga_situacao(v.id) AS situacao,
       o.id AS provimento_id,
       o.servidor_id AS ocupante_servidor_id,
       coalesce(s.nome_social, s.nome_completo) AS ocupante_nome,
       o.data_nomeacao AS ocupante_desde,
       o.status AS ocupante_status
  FROM public.vagas_cargo v
  JOIN public.cargos c ON c.id = v.cargo_id
  LEFT JOIN public.estrutura_organizacional u ON u.id = v.unidade_id
  LEFT JOIN public.provimentos o ON o.id = public.rh_vaga_ocupante_atual(v.id)
  LEFT JOIN public.servidores s ON s.id = o.servidor_id;

COMMENT ON VIEW public.v_quadro_vagas IS 'Situação atual de cada vaga (livre, ocupada, extinta) e o ocupante (nome visível a quem lê provimentos e servidores pela RLS). Migração 20261012150000.';

-- Linha do tempo: criação e extinção das vagas, entrada e saída de cada ocupante.
CREATE OR REPLACE VIEW public.v_vagas_historico WITH (security_invoker = true) AS
SELECT v.data_criacao AS data, 'vaga_criada'::text AS evento, v.id AS vaga_id, v.codigo, v.cargo_id,
       c.nome AS cargo_nome, c.sigla AS cargo_sigla, v.unidade_id, u.sigla AS unidade_sigla,
       NULL::uuid AS provimento_id, NULL::uuid AS servidor_id, NULL::text AS servidor_nome, v.ato_criacao AS detalhe,
       v.created_at AS registrado_em
  FROM public.vagas_cargo v
  JOIN public.cargos c ON c.id = v.cargo_id
  LEFT JOIN public.estrutura_organizacional u ON u.id = v.unidade_id
UNION ALL
SELECT v.data_extincao, 'vaga_extinta', v.id, v.codigo, v.cargo_id, c.nome, c.sigla, v.unidade_id, u.sigla,
       NULL, NULL, NULL, v.ato_extincao, v.updated_at
  FROM public.vagas_cargo v
  JOIN public.cargos c ON c.id = v.cargo_id
  LEFT JOIN public.estrutura_organizacional u ON u.id = v.unidade_id
 WHERE v.data_extincao IS NOT NULL
UNION ALL
SELECT p.data_nomeacao, 'entrada', v.id, v.codigo, v.cargo_id, c.nome, c.sigla, v.unidade_id, u.sigla,
       p.id, p.servidor_id, coalesce(s.nome_social, s.nome_completo), NULL, p.created_at
  FROM public.provimentos p
  JOIN public.vagas_cargo v ON v.id = p.vaga_id
  JOIN public.cargos c ON c.id = v.cargo_id
  LEFT JOIN public.estrutura_organizacional u ON u.id = v.unidade_id
  LEFT JOIN public.servidores s ON s.id = p.servidor_id
UNION ALL
SELECT p.data_encerramento, 'saida', v.id, v.codigo, v.cargo_id, c.nome, c.sigla, v.unidade_id, u.sigla,
       p.id, p.servidor_id, coalesce(s.nome_social, s.nome_completo),
       nullif(concat_ws(' ', p.motivo_encerramento, nullif(concat_ws(' ', p.ato_encerramento_tipo, p.ato_encerramento_numero), '')), ''),
       p.updated_at
  FROM public.provimentos p
  JOIN public.vagas_cargo v ON v.id = p.vaga_id
  JOIN public.cargos c ON c.id = v.cargo_id
  LEFT JOIN public.estrutura_organizacional u ON u.id = v.unidade_id
  LEFT JOIN public.servidores s ON s.id = p.servidor_id
 WHERE p.data_encerramento IS NOT NULL;

COMMENT ON VIEW public.v_vagas_historico IS 'Histórico do quadro de vagas: vaga criada/extinta (todos leem) e entrada/saída de ocupantes (RLS de provimentos). Migração 20261012150000.';

REVOKE ALL ON public.v_quadro_vagas, public.v_vagas_historico FROM anon;
GRANT SELECT ON public.v_quadro_vagas, public.v_vagas_historico TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. Importação da planilha
-- ---------------------------------------------------------------------------
-- p_linhas: array de objetos com as chaves (texto ou número):
--   cargo (obrigatório), sigla (símbolo), categoria (efetivo | comissionado | funcao_gratificada | temporario |
--   estagiario; obrigatória só para cargo novo), vencimento, unidade (sigla ou nome da unidade), quantidade (vagas;
--   padrão 1) OU codigo (uma linha = uma vaga com esse código), lei_numero, lei_data (AAAA-MM-DD ou DD/MM/AAAA).
-- p_gravar = false: simula (nada fica gravado) e devolve o relatório. true: grava tudo, ou nada se houver erro.
-- Roda como o usuário: RLS, autoria, trilha e regra de setor valem para cada gravação.
CREATE OR REPLACE FUNCTION public.rh_importar_quadro_vagas(p_linhas jsonb, p_gravar boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  c_simulacao constant text := 'rh_importar_quadro_vagas: simulação';
  l jsonb;
  i int := 0;
  k int;
  n int;
  v_erros jsonb := '[]'::jsonb;
  v_avisos jsonb := '[]'::jsonb;
  v_cargos_criados int := 0;
  v_cargos_existentes int := 0;
  v_vagas_criadas int := 0;
  v_vagas_existentes int := 0;
  v_ocupantes int := 0;
  v_cargos uuid[] := '{}';
  v_nome text;
  v_sigla text;
  v_txt text;
  v_cat public.categoria_cargo;
  v_venc numeric;
  v_lei_numero text;
  v_lei_data date;
  v_cargo_id uuid;
  v_unidade_id uuid;
  v_cod text;
  v_dono uuid;
  v_qtd int;
  v_existentes int;
  v_prefixo text;
  v_seq int;
  v_vaga uuid;
  v_gravado boolean := false;
  p record;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_permission_code(auth.uid(), 'governanca.cargos.gerenciar') THEN
    RAISE EXCEPTION 'Sem permissão para importar o quadro de vagas' USING ERRCODE = '42501';
  END IF;
  IF p_linhas IS NULL OR jsonb_typeof(p_linhas) <> 'array' THEN
    RAISE EXCEPTION 'Envie as linhas da planilha como uma lista';
  END IF;
  IF jsonb_array_length(p_linhas) > 2000 THEN
    RAISE EXCEPTION 'Planilha grande demais (% linhas; máximo 2000)', jsonb_array_length(p_linhas);
  END IF;

  BEGIN
    FOR l IN SELECT x FROM jsonb_array_elements(p_linhas) AS x LOOP
      i := i + 1;
      BEGIN
        IF jsonb_typeof(l) <> 'object' THEN
          RAISE EXCEPTION 'linha em formato inválido';
        END IF;
        v_nome := nullif(btrim(l ->> 'cargo'), '');
        IF v_nome IS NULL THEN
          RAISE EXCEPTION 'informe o nome do cargo';
        END IF;
        v_sigla := nullif(upper(btrim(l ->> 'sigla')), '');
        v_lei_numero := nullif(btrim(l ->> 'lei_numero'), '');

        v_txt := nullif(btrim(l ->> 'lei_data'), '');
        v_lei_data := NULL;
        IF v_txt ~ '^\d{1,2}/\d{1,2}/\d{4}$' THEN
          v_lei_data := to_date(v_txt, 'DD/MM/YYYY');
        ELSIF v_txt IS NOT NULL THEN
          v_lei_data := v_txt::date;
        END IF;

        v_txt := nullif(btrim(l ->> 'vencimento'), '');
        v_venc := NULL;
        IF v_txt IS NOT NULL THEN
          IF v_txt ~ ',' THEN
            v_txt := replace(replace(v_txt, '.', ''), ',', '.');
          END IF;
          v_venc := regexp_replace(v_txt, '[^0-9.\-]', '', 'g')::numeric;
        END IF;

        -- unidade: pela sigla, depois pelo nome (só unidades ativas)
        v_txt := nullif(btrim(l ->> 'unidade'), '');
        v_unidade_id := NULL;
        IF v_txt IS NOT NULL THEN
          SELECT id INTO v_unidade_id FROM public.estrutura_organizacional
           WHERE ativo AND upper(btrim(sigla)) = upper(v_txt) ORDER BY nome LIMIT 1;
          IF v_unidade_id IS NULL THEN
            SELECT id INTO v_unidade_id FROM public.estrutura_organizacional
             WHERE ativo AND lower(btrim(nome)) = lower(v_txt) ORDER BY nome LIMIT 1;
          END IF;
          IF v_unidade_id IS NULL THEN
            RAISE EXCEPTION 'unidade "%" não encontrada (use a sigla ou o nome cadastrado na estrutura)', v_txt;
          END IF;
        END IF;

        -- cargo: o existente com o mesmo nome e símbolo é reaproveitado (nada dele é alterado)
        SELECT id INTO v_cargo_id FROM public.cargos
         WHERE lower(btrim(nome)) = lower(v_nome) AND coalesce(upper(btrim(sigla)), '') = coalesce(v_sigla, '')
         ORDER BY ativo DESC NULLS LAST, created_at
         LIMIT 1;
        IF v_cargo_id IS NULL THEN
          v_txt := translate(lower(btrim(coalesce(l ->> 'categoria', ''))), 'áàâãéêíóôõúç ', 'aaaaeeiooouc_');
          v_txt := CASE v_txt WHEN 'fg' THEN 'funcao_gratificada' WHEN 'funcao' THEN 'funcao_gratificada'
                              WHEN 'cargo_em_comissao' THEN 'comissionado' WHEN 'comissao' THEN 'comissionado'
                              WHEN 'estagio' THEN 'estagiario' ELSE v_txt END;
          IF v_txt = '' THEN
            RAISE EXCEPTION 'cargo novo "%": informe a categoria (efetivo, comissionado, funcao_gratificada, temporario ou estagiario)', v_nome;
          END IF;
          BEGIN
            v_cat := v_txt::public.categoria_cargo;
          EXCEPTION WHEN invalid_text_representation THEN
            RAISE EXCEPTION 'categoria "%" inválida (use efetivo, comissionado, funcao_gratificada, temporario ou estagiario)', l ->> 'categoria';
          END;
          INSERT INTO public.cargos (nome, sigla, categoria, natureza, vencimento_base, lei_criacao_numero, lei_criacao_data,
                                     quantidade_vagas, ativo)
          VALUES (v_nome, v_sigla, v_cat,
                  CASE WHEN v_cat = 'efetivo' THEN 'efetivo'::public.natureza_cargo
                       WHEN v_cat IN ('comissionado', 'funcao_gratificada') THEN 'comissionado'::public.natureza_cargo END,
                  v_venc, v_lei_numero, v_lei_data, 0, true)
          RETURNING id INTO v_cargo_id;
          v_cargos_criados := v_cargos_criados + 1;
        ELSIF NOT (v_cargo_id = ANY (v_cargos)) THEN
          v_cargos_existentes := v_cargos_existentes + 1;
        END IF;
        IF NOT (v_cargo_id = ANY (v_cargos)) THEN
          v_cargos := v_cargos || v_cargo_id;
        END IF;

        v_cod := nullif(upper(btrim(l ->> 'codigo')), '');
        IF v_cod IS NOT NULL THEN
          SELECT cargo_id INTO v_dono FROM public.vagas_cargo WHERE codigo = v_cod;
          IF FOUND AND v_dono = v_cargo_id THEN
            v_vagas_existentes := v_vagas_existentes + 1;
          ELSIF FOUND THEN
            RAISE EXCEPTION 'o código de vaga % já pertence a outro cargo', v_cod;
          ELSE
            INSERT INTO public.vagas_cargo (codigo, cargo_id, unidade_id, data_criacao, ato_criacao)
            VALUES (v_cod, v_cargo_id, v_unidade_id, v_lei_data,
                    CASE WHEN v_lei_numero IS NOT NULL THEN 'Lei ' || v_lei_numero END);
            v_vagas_criadas := v_vagas_criadas + 1;
          END IF;
        ELSE
          v_txt := nullif(btrim(l ->> 'quantidade'), '');
          v_qtd := coalesce(v_txt::numeric::int, 1);
          IF v_qtd < 1 OR v_qtd > 500 THEN
            RAISE EXCEPTION 'quantidade de vagas inválida (%)', v_txt;
          END IF;
          SELECT count(*) INTO v_existentes FROM public.vagas_cargo
           WHERE cargo_id = v_cargo_id AND unidade_id IS NOT DISTINCT FROM v_unidade_id AND data_extincao IS NULL;
          IF v_existentes > v_qtd THEN
            v_avisos := v_avisos || jsonb_build_object('linha', i, 'aviso',
              format('%s já tem %s vaga(s) ativas e a planilha pede %s: nenhuma vaga foi extinta (extinção é por ato, na tela)',
                     v_nome, v_existentes, v_qtd));
          END IF;
          v_vagas_existentes := v_vagas_existentes + least(v_existentes, v_qtd);
          IF v_existentes < v_qtd THEN
            v_prefixo := coalesce(nullif(btrim(regexp_replace(coalesce(v_sigla, ''), '[^A-Z0-9-]+', '-', 'g'), '-'), ''), 'VAGA');
            SELECT coalesce(max(substr(codigo, length(v_prefixo) + 2)::int), 0) INTO v_seq
              FROM public.vagas_cargo WHERE codigo ~ ('^' || v_prefixo || '\.[0-9]+$');
            FOR k IN 1 .. (v_qtd - v_existentes) LOOP
              v_seq := v_seq + 1;
              INSERT INTO public.vagas_cargo (codigo, cargo_id, unidade_id, data_criacao, ato_criacao)
              VALUES (v_prefixo || '.' || lpad(v_seq::text, 3, '0'), v_cargo_id, v_unidade_id,
                      v_lei_data,
                      CASE WHEN v_lei_numero IS NOT NULL THEN 'Lei ' || v_lei_numero END);
              v_vagas_criadas := v_vagas_criadas + 1;
            END LOOP;
          END IF;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        v_erros := v_erros || jsonb_build_object('linha', i, 'erro', SQLERRM);
      END;
    END LOOP;

    IF jsonb_array_length(v_erros) = 0 THEN
      -- ocupantes atuais sem vaga: ligados a uma vaga livre do cargo (mesma unidade primeiro), por ordem de nomeação
      FOR p IN
        SELECT pr.id, pr.cargo_id, pr.unidade_id, pr.data_nomeacao, c.nome AS cargo_nome,
               coalesce(s.nome_social, s.nome_completo) AS nome
          FROM public.provimentos pr
          JOIN public.cargos c ON c.id = pr.cargo_id
          LEFT JOIN public.servidores s ON s.id = pr.servidor_id
         WHERE pr.cargo_id = ANY (v_cargos) AND pr.vaga_id IS NULL AND pr.status IN ('ativo', 'suspenso')
         ORDER BY pr.data_nomeacao, pr.id
      LOOP
        SELECT v.id INTO v_vaga FROM public.vagas_cargo v
         WHERE v.cargo_id = p.cargo_id AND v.data_extincao IS NULL
           AND NOT EXISTS (SELECT 1 FROM public.provimentos o
                            WHERE o.vaga_id = v.id
                              AND daterange(o.data_nomeacao, o.data_encerramento, '[)') && daterange(p.data_nomeacao, NULL, '[)'))
         ORDER BY (v.unidade_id IS NOT DISTINCT FROM p.unidade_id) DESC, (v.unidade_id IS NULL) DESC, v.codigo
         LIMIT 1;
        IF v_vaga IS NULL THEN
          v_avisos := v_avisos || jsonb_build_object('aviso',
            format('%s ocupa %s além do número de vagas: ficou sem vaga até alguém sair ou uma vaga ser criada',
                   coalesce(p.nome, 'um servidor'), p.cargo_nome));
          CONTINUE;
        END IF;
        BEGIN
          UPDATE public.provimentos SET vaga_id = v_vaga WHERE id = p.id;
          GET DIAGNOSTICS n = ROW_COUNT;
          v_ocupantes := v_ocupantes + n;
        EXCEPTION WHEN OTHERS THEN
          v_avisos := v_avisos || jsonb_build_object('aviso',
            format('não consegui ligar %s à vaga do cargo %s: %s', coalesce(p.nome, 'um servidor'), p.cargo_nome, SQLERRM));
        END;
      END LOOP;

      -- o número do cargo acompanha o quadro (telas antigas leem cargos.quantidade_vagas)
      BEGIN
        UPDATE public.cargos c
           SET quantidade_vagas = (SELECT count(*) FROM public.vagas_cargo v
                                    WHERE v.cargo_id = c.id AND v.data_extincao IS NULL)
         WHERE c.id = ANY (v_cargos)
           AND c.quantidade_vagas IS DISTINCT FROM (SELECT count(*) FROM public.vagas_cargo v
                                                     WHERE v.cargo_id = c.id AND v.data_extincao IS NULL);
      EXCEPTION WHEN OTHERS THEN
        v_avisos := v_avisos || jsonb_build_object('aviso',
          'o número de vagas no cadastro do cargo não foi atualizado: ' || SQLERRM);
      END;
    END IF;

    IF jsonb_array_length(v_erros) > 0 OR NOT p_gravar THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = c_simulacao;
    END IF;
    v_gravado := true;
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> c_simulacao THEN
      RAISE;
    END IF;
  END;

  RETURN jsonb_build_object(
    'gravado', v_gravado,
    'linhas', i,
    'cargos_criados', v_cargos_criados,
    'cargos_existentes', v_cargos_existentes,
    'vagas_criadas', v_vagas_criadas,
    'vagas_existentes', v_vagas_existentes,
    'ocupantes_vinculados', v_ocupantes,
    'erros', v_erros,
    'avisos', v_avisos);
END;
$$;

COMMENT ON FUNCTION public.rh_importar_quadro_vagas(jsonb, boolean) IS 'Importa a planilha de cargos e vagas (simula com gravar=false). Nunca apaga nem sobrescreve; liga os ocupantes atuais às vagas. Exige governanca.cargos.gerenciar. Migração 20261012150000.';

-- ---------------------------------------------------------------------------
-- 5. Privilégios
-- ---------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.rh_provimento_vaga() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rh_vagas_cargo_validar() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rh_vaga_ocupante_atual(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.rh_vaga_ocupante_atual(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.rh_vaga_situacao(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.rh_vaga_situacao(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.rh_importar_quadro_vagas(jsonb, boolean) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.rh_importar_quadro_vagas(jsonb, boolean) TO authenticated;
