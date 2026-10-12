-- ============================================================================
-- RH — correções da auditoria dos fluxos (docs/projects/idjuv-rh-auditoria-fluxos.md, 12/10/2026)
-- ============================================================================
-- Não muda RLS nem tabelas. Troca funções/triggers e acrescenta duas RPCs atômicas (SECURITY INVOKER: a RLS e as
-- permissões do chamador continuam valendo) e uma rotina de sistema.
--
--   A4  remove os triggers duplicados de situação em férias/licenças (o antigo rodava por último e devolvia 'ativo')
--   A4  fn_atualizar_situacao_servidor: reconhece licença 'prorrogada', aposentadoria, vínculo ativo sem provimento,
--       preserva exonerado/aposentado e mantém servidores.ativo coerente com a situação
--   A7  cessão de saída/retorno passam a ler vinculos_servidor (a tabela legada vinculos_funcionais nunca é escrita)
--   A6  registros_ponto: competência consolidada / fechamento do servidor travado passa a ser regra do banco
--   A10 matrícula gerada no banco (numérica, com trava); codigo_interno com trava; número de portaria único
--   A2/A9/A13  rh_admitir_servidor: vínculo + lotação + provimento + histórico + minuta em uma transação
--   A3/A9      rh_desligar_servidor: desligamento completo em uma transação
--   A8  rh_avancar_status_por_data: férias/licenças/viagens avançam por data (a ser agendada fora do banco)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. A4 — triggers duplicados de situação
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_atualizar_situacao_ferias ON public.ferias_servidor;
DROP TRIGGER IF EXISTS trigger_atualizar_situacao_licenca ON public.licencas_afastamentos;
-- a função antiga só era usada por esses dois triggers (conferido em pg_trigger antes de remover)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t JOIN pg_proc p ON p.oid = t.tgfoid
     WHERE NOT t.tgisinternal AND p.proname = 'atualizar_situacao_servidor' AND p.pronamespace = 'public'::regnamespace
  ) THEN
    DROP FUNCTION IF EXISTS public.atualizar_situacao_servidor();
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. A4/A13 — situação do servidor
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_atualizar_situacao_servidor(p_servidor_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_atual situacao_funcional;
  v_nova situacao_funcional;
  v_tipo_servidor tipo_servidor;
  v_cargo_id uuid;
  v_unidade_id uuid;
  v_vinculo vinculo_funcional;
  v_lotacao RECORD;
  v_hoje date := public.data_local();
BEGIN
  -- Prioridade: falecido (permanente) > exonerado/aposentado/falecido por provimento encerrado > férias em gozo >
  -- licença/afastamento ativo ou prorrogado > cessão de saída > provimento ativo > cessão de entrada >
  -- vínculo ativo sem provimento > desligado preservado > inativo.
  SELECT situacao INTO v_atual FROM public.servidores WHERE id = p_servidor_id;
  IF NOT FOUND OR v_atual = 'falecido' THEN
    RETURN;
  END IF;

  -- Provimento encerrado por desligamento, sem nomeação posterior
  IF EXISTS (
    SELECT 1 FROM public.provimentos pe
     WHERE pe.servidor_id = p_servidor_id
       AND pe.status = 'encerrado'
       AND pe.motivo_encerramento IN ('exoneracao', 'exoneracao_pedido', 'exoneracao_oficio', 'termino_mandato',
                                      'demissao', 'aposentadoria', 'vacancia', 'falecimento')
       AND NOT EXISTS (
         SELECT 1 FROM public.provimentos p2
          WHERE p2.servidor_id = p_servidor_id AND p2.status IN ('ativo', 'suspenso')
            AND p2.data_nomeacao > pe.data_encerramento)
  ) THEN
    SELECT CASE motivo_encerramento
             WHEN 'falecimento' THEN 'falecido'::situacao_funcional
             WHEN 'aposentadoria' THEN 'aposentado'::situacao_funcional
             ELSE 'exonerado'::situacao_funcional
           END
      INTO v_nova
      FROM public.provimentos
     WHERE servidor_id = p_servidor_id AND status = 'encerrado'
       AND motivo_encerramento IN ('exoneracao', 'exoneracao_pedido', 'exoneracao_oficio', 'termino_mandato',
                                   'demissao', 'aposentadoria', 'vacancia', 'falecimento')
     ORDER BY data_encerramento DESC NULLS LAST
     LIMIT 1;

    UPDATE public.servidores
       SET situacao = v_nova, ativo = false, cargo_atual_id = NULL, unidade_atual_id = NULL, updated_at = now()
     WHERE id = p_servidor_id;
    RETURN;
  END IF;

  -- Férias em gozo
  IF EXISTS (
    SELECT 1 FROM public.ferias_servidor
     WHERE servidor_id = p_servidor_id AND status = 'em_gozo'
       AND data_inicio <= v_hoje AND data_fim >= v_hoje
  ) THEN
    UPDATE public.servidores SET situacao = 'ferias', ativo = true, updated_at = now() WHERE id = p_servidor_id;
    RETURN;
  END IF;

  -- Licença/afastamento vigente (ativa ou prorrogada)
  IF EXISTS (
    SELECT 1 FROM public.licencas_afastamentos
     WHERE servidor_id = p_servidor_id AND status IN ('ativa', 'prorrogada')
       AND data_inicio <= v_hoje AND (data_fim IS NULL OR data_fim >= v_hoje)
  ) THEN
    SELECT CASE tipo_afastamento WHEN 'licenca' THEN 'licenca'::situacao_funcional ELSE 'afastado'::situacao_funcional END
      INTO v_nova
      FROM public.licencas_afastamentos
     WHERE servidor_id = p_servidor_id AND status IN ('ativa', 'prorrogada')
       AND data_inicio <= v_hoje AND (data_fim IS NULL OR data_fim >= v_hoje)
     ORDER BY data_inicio DESC
     LIMIT 1;
    UPDATE public.servidores SET situacao = v_nova, ativo = true, updated_at = now() WHERE id = p_servidor_id;
    RETURN;
  END IF;

  -- Cessão de saída ativa
  IF EXISTS (SELECT 1 FROM public.cessoes WHERE servidor_id = p_servidor_id AND tipo = 'saida' AND ativa = true) THEN
    UPDATE public.servidores SET situacao = 'cedido', ativo = true, updated_at = now() WHERE id = p_servidor_id;
    RETURN;
  END IF;

  -- Provimento ativo
  IF EXISTS (SELECT 1 FROM public.provimentos WHERE servidor_id = p_servidor_id AND status = 'ativo') THEN
    SELECT p.cargo_id, p.unidade_id,
           CASE c.categoria WHEN 'efetivo' THEN 'efetivo'::vinculo_funcional ELSE 'comissionado'::vinculo_funcional END,
           CASE c.categoria WHEN 'efetivo' THEN 'efetivo_idjuv'::tipo_servidor ELSE 'comissionado_idjuv'::tipo_servidor END
      INTO v_cargo_id, v_unidade_id, v_vinculo, v_tipo_servidor
      FROM public.provimentos p
      JOIN public.cargos c ON c.id = p.cargo_id
     WHERE p.servidor_id = p_servidor_id AND p.status = 'ativo'
     ORDER BY p.data_nomeacao DESC
     LIMIT 1;

    -- a lotação ativa tem prioridade para a unidade; o cargo vem do provimento
    SELECT * INTO v_lotacao FROM public.lotacoes
     WHERE servidor_id = p_servidor_id AND ativo = true
     ORDER BY data_inicio DESC LIMIT 1;
    IF v_lotacao.id IS NOT NULL THEN
      v_unidade_id := v_lotacao.unidade_id;
    END IF;

    UPDATE public.servidores
       SET situacao = 'ativo', ativo = true,
           tipo_servidor = COALESCE(v_tipo_servidor, tipo_servidor),
           cargo_atual_id = v_cargo_id, unidade_atual_id = v_unidade_id,
           vinculo = v_vinculo, data_desligamento = NULL, updated_at = now()
     WHERE id = p_servidor_id;
    RETURN;
  END IF;

  -- Cessão de entrada ativa
  IF EXISTS (SELECT 1 FROM public.cessoes WHERE servidor_id = p_servidor_id AND tipo = 'entrada' AND ativa = true) THEN
    SELECT unidade_idjuv_id INTO v_unidade_id
      FROM public.cessoes
     WHERE servidor_id = p_servidor_id AND tipo = 'entrada' AND ativa = true
     ORDER BY data_inicio DESC LIMIT 1;
    UPDATE public.servidores
       SET situacao = 'ativo', ativo = true, tipo_servidor = 'cedido_entrada', unidade_atual_id = v_unidade_id,
           vinculo = 'cedido', data_desligamento = NULL, updated_at = now()
     WHERE id = p_servidor_id;
    RETURN;
  END IF;

  -- Vínculo ativo sem provimento (temporário, estagiário, requisitado, federal…): continua ativo
  IF EXISTS (SELECT 1 FROM public.vinculos_servidor WHERE servidor_id = p_servidor_id AND ativo = true) THEN
    SELECT cargo_id, unidade_id INTO v_cargo_id, v_unidade_id
      FROM public.vinculos_servidor
     WHERE servidor_id = p_servidor_id AND ativo = true
     ORDER BY data_inicio DESC LIMIT 1;
    UPDATE public.servidores
       SET situacao = 'ativo', ativo = true, cargo_atual_id = v_cargo_id, unidade_atual_id = v_unidade_id,
           data_desligamento = NULL, updated_at = now()
     WHERE id = p_servidor_id;
    RETURN;
  END IF;

  -- Já desligado (exonerado/aposentado) e sem nada ativo: preserva a situação
  IF v_atual IN ('exonerado', 'aposentado') THEN
    UPDATE public.servidores SET ativo = false, cargo_atual_id = NULL, unidade_atual_id = NULL WHERE id = p_servidor_id;
    RETURN;
  END IF;

  UPDATE public.servidores
     SET situacao = 'inativo', ativo = false, cargo_atual_id = NULL, unidade_atual_id = NULL, updated_at = now()
   WHERE id = p_servidor_id;
END;
$function$;

-- ---------------------------------------------------------------------------
-- 3. A7 — cessão de saída/retorno lendo vinculos_servidor
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_encerrar_provimento_comissionado_cessao()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.tipo = 'saida' AND NEW.ativa = true THEN
    IF EXISTS (SELECT 1 FROM public.vinculos_servidor
                WHERE servidor_id = NEW.servidor_id AND ativo = true AND tipo = 'comissionado') THEN
      UPDATE public.provimentos
         SET status = 'encerrado', data_encerramento = NEW.data_inicio, motivo_encerramento = 'cessao_comissionado'
       WHERE servidor_id = NEW.servidor_id AND status = 'ativo';
    ELSIF EXISTS (SELECT 1 FROM public.vinculos_servidor
                   WHERE servidor_id = NEW.servidor_id AND ativo = true AND tipo = 'efetivo') THEN
      UPDATE public.provimentos SET status = 'suspenso'
       WHERE servidor_id = NEW.servidor_id AND status = 'ativo';
    END IF;

    UPDATE public.lotacoes SET ativo = false, data_fim = NEW.data_inicio
     WHERE servidor_id = NEW.servidor_id AND ativo = true;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.fn_reativar_provimento_retorno_cessao()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.ativa = true AND NEW.ativa = false AND NEW.data_retorno IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.vinculos_servidor
                WHERE servidor_id = NEW.servidor_id AND ativo = true AND tipo = 'efetivo') THEN
      UPDATE public.provimentos SET status = 'ativo'
       WHERE servidor_id = NEW.servidor_id AND status = 'suspenso';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- ---------------------------------------------------------------------------
-- 4. A6 — competência de frequência travada no banco
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.frequencia_competencia_travada(p_servidor_id uuid, p_data date)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  -- mesma regra de lancamentoBloqueado() (src/lib/frequenciaFluxo.ts): competência consolidada, ou fechamento do
  -- servidor consolidado pelo RH e não reaberto
  SELECT EXISTS (
           SELECT 1 FROM public.config_fechamento_frequencia c
            WHERE c.ano = EXTRACT(YEAR FROM p_data)::int AND c.mes = EXTRACT(MONTH FROM p_data)::int
              AND c.status = 'consolidado')
      OR EXISTS (
           SELECT 1 FROM public.frequencia_fechamento f
            WHERE f.servidor_id = p_servidor_id
              AND f.ano = EXTRACT(YEAR FROM p_data)::int AND f.mes = EXTRACT(MONTH FROM p_data)::int
              AND coalesce(f.consolidado_rh, false) AND NOT coalesce(f.reaberto, false));
$function$;

CREATE OR REPLACE FUNCTION public.registros_ponto_travar_competencia()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- só a API (anon/authenticated); job, Edge Function e service role seguem livres
  IF coalesce(current_setting('role', true), 'none') NOT IN ('anon', 'authenticated') THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;
  IF TG_OP IN ('UPDATE', 'DELETE') AND public.frequencia_competencia_travada(OLD.servidor_id, OLD.data) THEN
    RAISE EXCEPTION 'Frequência: a competência %/% de este servidor está consolidada; reabra a frequência para alterar o ponto',
      to_char(OLD.data, 'MM'), to_char(OLD.data, 'YYYY') USING ERRCODE = '42501';
  END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') AND public.frequencia_competencia_travada(NEW.servidor_id, NEW.data) THEN
    RAISE EXCEPTION 'Frequência: a competência %/% de este servidor está consolidada; reabra a frequência para alterar o ponto',
      to_char(NEW.data, 'MM'), to_char(NEW.data, 'YYYY') USING ERRCODE = '42501';
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$function$;

DROP TRIGGER IF EXISTS trg_registros_ponto_travar_competencia ON public.registros_ponto;
CREATE TRIGGER trg_registros_ponto_travar_competencia
  BEFORE INSERT OR UPDATE OR DELETE ON public.registros_ponto
  FOR EACH ROW EXECUTE FUNCTION public.registros_ponto_travar_competencia();

-- ---------------------------------------------------------------------------
-- 5. A10 — matrícula, código interno e número de portaria
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.gerar_matricula_servidor()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_max numeric;
BEGIN
  IF NEW.matricula IS NULL OR btrim(NEW.matricula) = '' THEN
    PERFORM pg_advisory_xact_lock(hashtext('servidores.matricula'));
    -- numérico: '9999' < '10000' (a ordenação por texto errava na virada)
    SELECT coalesce(max(nullif(regexp_replace(matricula, '\D', '', 'g'), '')::numeric), 0) INTO v_max
      FROM public.servidores;
    -- lpad() TRUNCA texto maior que o tamanho; só completa com zeros quando faltam dígitos
    NEW.matricula := CASE WHEN length((v_max + 1)::text) >= 4 THEN (v_max + 1)::text ELSE lpad((v_max + 1)::text, 4, '0') END;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_gerar_matricula_servidor ON public.servidores;
CREATE TRIGGER trigger_gerar_matricula_servidor
  BEFORE INSERT ON public.servidores
  FOR EACH ROW EXECUTE FUNCTION public.gerar_matricula_servidor();

CREATE OR REPLACE FUNCTION public.gerar_codigo_interno_servidor()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_max numeric;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('servidores.codigo_interno'));
  SELECT coalesce(max(nullif(regexp_replace(codigo_interno, '\D', '', 'g'), '')::numeric), 0) INTO v_max
    FROM public.servidores WHERE codigo_interno IS NOT NULL;
  NEW.codigo_interno := 'SRV-' || CASE WHEN length((v_max + 1)::text) >= 5 THEN (v_max + 1)::text
                                       ELSE lpad((v_max + 1)::text, 5, '0') END;
  RETURN NEW;
END;
$function$;

-- duas portarias com o mesmo número viram erro, não duplicata (PENDENTE/AAAA é provisório e pode repetir)
CREATE UNIQUE INDEX IF NOT EXISTS documentos_portaria_numero_uk
  ON public.documentos (numero)
  WHERE tipo = 'portaria' AND numero !~ '^PENDENTE';

-- ---------------------------------------------------------------------------
-- 6. A2/A9/A13 — admissão atômica
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rh_admitir_servidor(
  p_servidor_id uuid,
  p_tipo public.tipo_vinculo_servidor,
  p_cargo_id uuid,
  p_unidade_id uuid,
  p_data_inicio date,
  p_orgao_origem text DEFAULT NULL,
  p_ato_tipo text DEFAULT NULL,
  p_ato_numero text DEFAULT NULL,
  p_ato_data date DEFAULT NULL,
  p_ato_doe_numero text DEFAULT NULL,
  p_ato_doe_data date DEFAULT NULL,
  p_gerar_minuta boolean DEFAULT true,
  p_funcao_exercida text DEFAULT NULL,
  p_observacao text DEFAULT NULL
) RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_servidor RECORD;
  v_cargo_nome text;
  v_unidade_nome text;
  v_vinculo_id uuid;
  v_lotacao_id uuid;
  v_provimento_id uuid;
  v_minuta_id uuid;
  v_minuta_numero text;
  v_exige_cargo boolean := p_tipo IN ('efetivo', 'comissionado');
  v_descricao text;
BEGIN
  IF auth.uid() IS NULL OR NOT (public.has_permission_code(auth.uid(), 'rh.servidores.criar')
                                OR public.has_permission_code(auth.uid(), 'rh.lotacoes.criar')) THEN
    RAISE EXCEPTION 'Sem permissão para admitir/lotar servidor' USING ERRCODE = '42501';
  END IF;
  IF p_data_inicio IS NULL THEN RAISE EXCEPTION 'Informe a data de início'; END IF;

  SELECT id, nome_completo, situacao INTO v_servidor FROM public.servidores WHERE id = p_servidor_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Servidor não encontrado'; END IF;
  IF v_servidor.situacao = 'falecido' THEN RAISE EXCEPTION 'Servidor falecido não pode ser admitido'; END IF;

  SELECT nome INTO v_unidade_nome FROM public.estrutura_organizacional WHERE id = p_unidade_id AND ativo;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unidade não encontrada ou inativa'; END IF;

  IF v_exige_cargo THEN
    IF p_cargo_id IS NULL THEN RAISE EXCEPTION 'Selecione o cargo'; END IF;
  END IF;
  IF p_cargo_id IS NOT NULL THEN
    SELECT coalesce(sigla || ' - ', '') || nome INTO v_cargo_nome FROM public.cargos WHERE id = p_cargo_id AND ativo;
    IF NOT FOUND THEN RAISE EXCEPTION 'Cargo não encontrado ou inativo'; END IF;
  END IF;
  IF p_tipo = 'cedido_entrada' AND coalesce(btrim(p_orgao_origem), '') = '' THEN
    RAISE EXCEPTION 'Informe o órgão de origem do servidor cedido';
  END IF;

  -- uma admissão por vez: quem já tem vínculo, lotação ou provimento ativo usa os fluxos de movimentação
  IF EXISTS (SELECT 1 FROM public.lotacoes WHERE servidor_id = p_servidor_id AND ativo)
     OR EXISTS (SELECT 1 FROM public.provimentos WHERE servidor_id = p_servidor_id AND status IN ('ativo', 'suspenso'))
     OR EXISTS (SELECT 1 FROM public.vinculos_servidor WHERE servidor_id = p_servidor_id AND ativo) THEN
    RAISE EXCEPTION 'Servidor já possui vínculo, lotação ou provimento ativo; encerre o atual antes de admitir de novo';
  END IF;

  INSERT INTO public.vinculos_servidor (servidor_id, tipo, origem, orgao_nome, cargo_id, unidade_id, data_inicio,
                                        data_posse, data_exercicio, ativo,
                                        ato_tipo, ato_numero, ato_data, ato_doe_numero, ato_doe_data)
  VALUES (p_servidor_id, p_tipo,
          CASE WHEN p_tipo = 'cedido_entrada' THEN 'outro_orgao'::origem_vinculo ELSE 'idjuv'::origem_vinculo END,
          CASE WHEN p_tipo = 'cedido_entrada' THEN p_orgao_origem END,
          p_cargo_id, p_unidade_id, p_data_inicio, p_data_inicio, p_data_inicio, true,
          p_ato_tipo, p_ato_numero, p_ato_data, p_ato_doe_numero, p_ato_doe_data)
  RETURNING id INTO v_vinculo_id;

  INSERT INTO public.lotacoes (servidor_id, unidade_id, cargo_id, tipo_lotacao, tipo_movimentacao, data_inicio, ativo,
                               funcao_exercida, observacao,
                               ato_tipo, ato_numero, ato_data, ato_doe_numero, ato_doe_data)
  VALUES (p_servidor_id, p_unidade_id, p_cargo_id, 'lotacao_interna', 'lotacao_inicial', p_data_inicio, true,
          p_funcao_exercida, p_observacao,
          p_ato_tipo, p_ato_numero, p_ato_data, p_ato_doe_numero, p_ato_doe_data)
  RETURNING id INTO v_lotacao_id;

  IF p_tipo = 'cedido_entrada' THEN
    INSERT INTO public.cessoes (servidor_id, tipo, orgao_origem, unidade_idjuv_id, data_inicio, ativa,
                                ato_tipo, ato_numero, ato_data, ato_doe_numero, ato_doe_data)
    VALUES (p_servidor_id, 'entrada', p_orgao_origem, p_unidade_id, p_data_inicio, true,
            p_ato_tipo, p_ato_numero, p_ato_data, p_ato_doe_numero, p_ato_doe_data);
  ELSIF v_exige_cargo THEN
    INSERT INTO public.provimentos (servidor_id, cargo_id, unidade_id, status, data_nomeacao, data_posse, data_exercicio)
    VALUES (p_servidor_id, p_cargo_id, p_unidade_id, 'ativo', p_data_inicio, p_data_inicio, p_data_inicio)
    RETURNING id INTO v_provimento_id;
  END IF;

  v_descricao := CASE WHEN p_tipo = 'cedido_entrada'
                      THEN 'Cessão de entrada de ' || p_orgao_origem || ' para ' || v_unidade_nome
                      ELSE 'Nomeação' || coalesce(' para ' || v_cargo_nome, '') || ' - ' || v_unidade_nome END;

  INSERT INTO public.historico_funcional (servidor_id, tipo, data_evento, data_vigencia_inicio, cargo_novo_id,
                                          unidade_nova_id, portaria_numero, portaria_data,
                                          diario_oficial_numero, diario_oficial_data, descricao)
  VALUES (p_servidor_id, CASE WHEN p_tipo = 'cedido_entrada' THEN 'cessao'::tipo_movimentacao_funcional
                              ELSE 'nomeacao'::tipo_movimentacao_funcional END,
          p_data_inicio, p_data_inicio, p_cargo_id, p_unidade_id, p_ato_numero, p_ato_data,
          p_ato_doe_numero, p_ato_doe_data, v_descricao);

  IF p_gerar_minuta AND p_cargo_id IS NOT NULL AND v_exige_cargo THEN
    v_minuta_numero := public.gerar_numero_portaria(EXTRACT(YEAR FROM p_data_inicio)::int);
    INSERT INTO public.documentos (tipo, categoria, status, titulo, ementa, numero, data_documento, servidores_ids,
                                   cargo_id, unidade_id, provimento_id)
    VALUES ('portaria', 'nomeacao', 'minuta', 'Portaria de Nomeação - ' || v_servidor.nome_completo,
            'Nomeia ' || v_servidor.nome_completo || ' para o cargo de ' || v_cargo_nome || ' na ' || v_unidade_nome || '.',
            v_minuta_numero, p_data_inicio, ARRAY[p_servidor_id], p_cargo_id, p_unidade_id, v_provimento_id)
    RETURNING id INTO v_minuta_id;
  END IF;

  -- situação explícita: vale para vínculo sem provimento (temporário, estagiário…) e para reingresso; com provimento
  -- ou cessão, os triggers refinam cargo/unidade logo em seguida
  UPDATE public.servidores
     SET data_admissao = coalesce(data_admissao, p_data_inicio),
         data_posse = coalesce(data_posse, p_data_inicio),
         data_exercicio = coalesce(data_exercicio, p_data_inicio),
         data_desligamento = NULL,
         ativo = true,
         situacao = CASE WHEN situacao IN ('exonerado', 'aposentado', 'inativo') THEN 'ativo'::situacao_funcional
                         ELSE situacao END,
         cargo_atual_id = p_cargo_id,
         unidade_atual_id = p_unidade_id
   WHERE id = p_servidor_id;

  RETURN jsonb_build_object('vinculo_id', v_vinculo_id, 'lotacao_id', v_lotacao_id, 'provimento_id', v_provimento_id,
                            'minuta_id', v_minuta_id, 'minuta_numero', v_minuta_numero);
END;
$function$;

-- ---------------------------------------------------------------------------
-- 7. A3/A9 — desligamento atômico (exoneração, aposentadoria, falecimento, vacância…)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rh_desligar_servidor(
  p_servidor_id uuid,
  p_data date,
  p_motivo text,
  p_observacao text DEFAULT NULL,
  p_ato_tipo text DEFAULT NULL,
  p_ato_numero text DEFAULT NULL,
  p_ato_data date DEFAULT NULL,
  p_ato_doe_numero text DEFAULT NULL,
  p_ato_doe_data date DEFAULT NULL,
  p_gerar_minuta boolean DEFAULT true
) RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_servidor RECORD;
  v_prov RECORD;
  v_unidade_id uuid;
  v_cargo_id uuid;
  v_cargo_nome text;
  v_nova situacao_funcional;
  v_hist tipo_movimentacao_funcional;
  v_n_lot int; v_n_vinc int; v_n_prov int; v_n_cess int; v_n_desig int; v_n_fer int; v_n_lic int;
  v_n_viag int; v_n_chefe int; v_n_com int; v_viag_andamento int;
  v_minuta_numero text;
  v_avisos text[] := '{}';
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_permission_code(auth.uid(), 'rh.servidores.editar') THEN
    RAISE EXCEPTION 'Sem permissão para desligar servidor' USING ERRCODE = '42501';
  END IF;
  IF p_motivo NOT IN ('exoneracao', 'exoneracao_pedido', 'exoneracao_oficio', 'termino_mandato', 'demissao',
                      'aposentadoria', 'falecimento', 'vacancia') THEN
    RAISE EXCEPTION 'Motivo de desligamento inválido: %', p_motivo;
  END IF;
  IF p_data IS NULL THEN RAISE EXCEPTION 'Informe a data do desligamento'; END IF;

  SELECT id, nome_completo, situacao INTO v_servidor FROM public.servidores WHERE id = p_servidor_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Servidor não encontrado'; END IF;
  IF v_servidor.situacao IN ('exonerado', 'aposentado', 'falecido') THEN
    RAISE EXCEPTION 'Servidor já desligado (%)', v_servidor.situacao;
  END IF;

  v_nova := CASE p_motivo WHEN 'falecimento' THEN 'falecido' WHEN 'aposentadoria' THEN 'aposentado' ELSE 'exonerado' END;
  v_hist := CASE WHEN p_motivo = 'aposentadoria' THEN 'aposentadoria'
                 WHEN p_motivo IN ('falecimento', 'vacancia') THEN 'vacancia'
                 ELSE 'exoneracao' END;

  -- o que ele ocupava, para o histórico e a portaria
  SELECT p.cargo_id, p.unidade_id INTO v_prov FROM public.provimentos p
   WHERE p.servidor_id = p_servidor_id AND p.status IN ('ativo', 'suspenso')
   ORDER BY p.data_nomeacao DESC LIMIT 1;
  v_cargo_id := v_prov.cargo_id;
  v_unidade_id := coalesce(v_prov.unidade_id,
                           (SELECT unidade_id FROM public.lotacoes WHERE servidor_id = p_servidor_id AND ativo
                             ORDER BY data_inicio DESC LIMIT 1));
  IF v_cargo_id IS NOT NULL THEN
    SELECT coalesce(sigla || ' - ', '') || nome INTO v_cargo_nome FROM public.cargos WHERE id = v_cargo_id;
  END IF;

  UPDATE public.lotacoes SET ativo = false, data_fim = p_data,
         observacao = coalesce(p_observacao, 'Desligamento: ' || p_motivo)
   WHERE servidor_id = p_servidor_id AND ativo;
  GET DIAGNOSTICS v_n_lot = ROW_COUNT;

  UPDATE public.vinculos_servidor SET ativo = false, data_fim = p_data, motivo_encerramento = p_motivo
   WHERE servidor_id = p_servidor_id AND ativo;
  GET DIAGNOSTICS v_n_vinc = ROW_COUNT;

  UPDATE public.provimentos SET status = 'encerrado', data_encerramento = p_data, motivo_encerramento = p_motivo,
         ato_encerramento_tipo = p_ato_tipo, ato_encerramento_numero = p_ato_numero, ato_encerramento_data = p_ato_data
   WHERE servidor_id = p_servidor_id AND status IN ('ativo', 'suspenso');
  GET DIAGNOSTICS v_n_prov = ROW_COUNT;

  UPDATE public.cessoes SET ativa = false, data_fim = coalesce(least(data_fim, p_data), p_data)
   WHERE servidor_id = p_servidor_id AND ativa;
  GET DIAGNOSTICS v_n_cess = ROW_COUNT;

  UPDATE public.designacoes
     SET status = CASE WHEN status = 'pendente' THEN 'rejeitada' ELSE 'encerrada' END,
         motivo_rejeicao = CASE WHEN status = 'pendente' THEN 'Servidor desligado em ' || p_data END,
         data_fim = CASE WHEN status = 'aprovada' THEN coalesce(least(data_fim, p_data), p_data) ELSE data_fim END,
         ativo = false
   WHERE servidor_id = p_servidor_id AND status IN ('pendente', 'aprovada');
  GET DIAGNOSTICS v_n_desig = ROW_COUNT;

  UPDATE public.ferias_servidor
     SET status = CASE WHEN status = 'em_gozo' THEN 'interrompida' ELSE 'cancelada' END,
         observacoes = trim(both E'\n' from coalesce(observacoes, '') || E'\nDesligamento em ' || p_data)
   WHERE servidor_id = p_servidor_id AND status IN ('programada', 'em_gozo');
  GET DIAGNOSTICS v_n_fer = ROW_COUNT;

  UPDATE public.licencas_afastamentos
     SET status = 'encerrada', data_fim = coalesce(least(data_fim, p_data), p_data)
   WHERE servidor_id = p_servidor_id AND status IN ('ativa', 'prorrogada');
  GET DIAGNOSTICS v_n_lic = ROW_COUNT;

  UPDATE public.viagens_diarias
     SET status = 'cancelada',
         observacoes = trim(both E'\n' from coalesce(observacoes, '') || E'\nCancelada: desligamento em ' || p_data)
   WHERE servidor_id = p_servidor_id AND status IN ('solicitada', 'autorizada');
  GET DIAGNOSTICS v_n_viag = ROW_COUNT;
  SELECT count(*) INTO v_viag_andamento FROM public.viagens_diarias
   WHERE servidor_id = p_servidor_id AND status = 'em_andamento';

  UPDATE public.nomeacoes_chefe_unidade SET status = 'encerrado', data_fim = p_data
   WHERE servidor_id = p_servidor_id AND status = 'ativo';
  GET DIAGNOSTICS v_n_chefe = ROW_COUNT;

  UPDATE public.comissoes_membros SET data_fim = p_data
   WHERE servidor_id = p_servidor_id AND (data_fim IS NULL OR data_fim > p_data);
  GET DIAGNOSTICS v_n_com = ROW_COUNT;

  INSERT INTO public.historico_funcional (servidor_id, tipo, data_evento, data_vigencia_inicio, cargo_anterior_id,
                                          unidade_anterior_id, portaria_numero, portaria_data,
                                          diario_oficial_numero, diario_oficial_data, descricao)
  VALUES (p_servidor_id, v_hist, p_data, p_data, v_cargo_id, v_unidade_id, p_ato_numero, p_ato_data,
          p_ato_doe_numero, p_ato_doe_data,
          'Desligamento (' || p_motivo || ')' || coalesce(' do cargo ' || v_cargo_nome, '')
            || coalesce('. ' || p_observacao, ''));

  IF p_gerar_minuta AND v_cargo_id IS NOT NULL AND p_motivo <> 'falecimento' THEN
    v_minuta_numero := public.gerar_numero_portaria(EXTRACT(YEAR FROM p_data)::int);
    INSERT INTO public.documentos (tipo, categoria, status, titulo, ementa, numero, data_documento, servidores_ids,
                                   cargo_id, unidade_id)
    VALUES ('portaria', CASE WHEN p_motivo IN ('aposentadoria', 'vacancia') THEN 'pessoal'::categoria_portaria
                             ELSE 'exoneracao'::categoria_portaria END,
            'minuta',
            CASE WHEN p_motivo = 'aposentadoria' THEN 'Aposentadoria - ' ELSE 'Exoneração - ' END || v_servidor.nome_completo,
            CASE WHEN p_motivo = 'aposentadoria' THEN 'Concede aposentadoria a ' ELSE 'Exonera ' END
              || v_servidor.nome_completo || ' do cargo de ' || v_cargo_nome || '.',
            v_minuta_numero, p_data, ARRAY[p_servidor_id], v_cargo_id, v_unidade_id);
  END IF;

  -- UPDATE barrado pela RLS não dá erro, só afeta 0 linhas. Se sobrou algo aberto, quem chamou não tem permissão
  -- sobre alguma das tabelas: desfaz tudo (nada fica pela metade).
  IF EXISTS (SELECT 1 FROM public.lotacoes WHERE servidor_id = p_servidor_id AND ativo)
     OR EXISTS (SELECT 1 FROM public.vinculos_servidor WHERE servidor_id = p_servidor_id AND ativo)
     OR EXISTS (SELECT 1 FROM public.provimentos WHERE servidor_id = p_servidor_id AND status IN ('ativo', 'suspenso'))
     OR EXISTS (SELECT 1 FROM public.cessoes WHERE servidor_id = p_servidor_id AND ativa)
     OR EXISTS (SELECT 1 FROM public.designacoes WHERE servidor_id = p_servidor_id AND status IN ('pendente', 'aprovada'))
     OR EXISTS (SELECT 1 FROM public.ferias_servidor WHERE servidor_id = p_servidor_id AND status IN ('programada', 'em_gozo'))
     OR EXISTS (SELECT 1 FROM public.licencas_afastamentos WHERE servidor_id = p_servidor_id AND status IN ('ativa', 'prorrogada'))
     OR EXISTS (SELECT 1 FROM public.viagens_diarias WHERE servidor_id = p_servidor_id AND status IN ('solicitada', 'autorizada'))
     OR EXISTS (SELECT 1 FROM public.nomeacoes_chefe_unidade WHERE servidor_id = p_servidor_id AND status = 'ativo') THEN
    RAISE EXCEPTION 'Sem permissão para encerrar todos os registros do servidor (férias, licenças, viagens, designações…); nada foi gravado'
      USING ERRCODE = '42501';
  END IF;

  -- por último: a situação explícita (vale também para vínculo sem provimento) e a data de desligamento
  UPDATE public.servidores
     SET situacao = v_nova, ativo = false, cargo_atual_id = NULL, unidade_atual_id = NULL, data_desligamento = p_data
   WHERE id = p_servidor_id;

  IF v_viag_andamento > 0 THEN
    v_avisos := array_append(v_avisos, v_viag_andamento || ' viagem(ns) em andamento: concluir ou cancelar manualmente');
  END IF;
  v_avisos := array_append(v_avisos, 'Acerto financeiro (férias proporcionais, 13º, rescisão) não é calculado pelo sistema');
  v_avisos := array_append(v_avisos, 'Conferir bens patrimoniais em carga do servidor e revogar acessos fora do RH');

  RETURN jsonb_build_object('situacao', v_nova, 'minuta_numero', v_minuta_numero, 'avisos', to_jsonb(v_avisos),
                            'encerrados', jsonb_build_object('lotacoes', v_n_lot, 'vinculos', v_n_vinc,
                              'provimentos', v_n_prov, 'cessoes', v_n_cess, 'designacoes', v_n_desig,
                              'ferias', v_n_fer, 'licencas', v_n_lic, 'viagens', v_n_viag,
                              'chefias_de_unidade', v_n_chefe, 'comissoes', v_n_com));
END;
$function$;

-- ---------------------------------------------------------------------------
-- 8. A8 — avanço de status por data (rotina de sistema; agendar fora do banco: não há pg_cron)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rh_avancar_status_por_data()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_hoje date := public.data_local();
  v_ids uuid[];
  v_fer_ini int; v_fer_fim int; v_lic int; v_viag int;
BEGIN
  WITH a AS (
    UPDATE public.ferias_servidor SET status = 'em_gozo'
     WHERE status = 'programada' AND data_inicio <= v_hoje AND data_fim >= v_hoje RETURNING servidor_id)
  SELECT array_agg(DISTINCT servidor_id), count(*) INTO v_ids, v_fer_ini FROM a;

  WITH a AS (
    UPDATE public.ferias_servidor SET status = 'concluida'
     WHERE status = 'em_gozo' AND data_fim < v_hoje RETURNING servidor_id)
  SELECT coalesce(v_ids, '{}') || coalesce(array_agg(DISTINCT servidor_id), '{}'), count(*) INTO v_ids, v_fer_fim FROM a;

  WITH a AS (
    UPDATE public.licencas_afastamentos SET status = 'encerrada'
     WHERE status IN ('ativa', 'prorrogada') AND data_fim IS NOT NULL AND data_fim < v_hoje RETURNING servidor_id)
  SELECT coalesce(v_ids, '{}') || coalesce(array_agg(DISTINCT servidor_id), '{}'), count(*) INTO v_ids, v_lic FROM a;

  WITH a AS (
    UPDATE public.viagens_diarias SET status = 'em_andamento'
     WHERE status = 'autorizada' AND data_saida <= v_hoje AND data_retorno >= v_hoje RETURNING id)
  SELECT count(*) INTO v_viag FROM a;

  -- licença com início futuro não muda a situação hoje (a função confere as datas); recalcula quem mudou
  PERFORM public.fn_atualizar_situacao_servidor(s) FROM unnest(coalesce(v_ids, '{}')) AS s;

  RETURN jsonb_build_object('data', v_hoje, 'ferias_iniciadas', v_fer_ini, 'ferias_concluidas', v_fer_fim,
                            'licencas_encerradas', v_lic, 'viagens_em_andamento', v_viag);
END;
$function$;

-- ---------------------------------------------------------------------------
-- 9. Privilégios
-- ---------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.rh_admitir_servidor(uuid, public.tipo_vinculo_servidor, uuid, uuid, date, text, text, text, date, text, date, boolean, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.rh_admitir_servidor(uuid, public.tipo_vinculo_servidor, uuid, uuid, date, text, text, text, date, text, date, boolean, text, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.rh_desligar_servidor(uuid, date, text, text, text, text, date, text, date, boolean) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.rh_desligar_servidor(uuid, date, text, text, text, text, date, text, date, boolean) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.rh_avancar_status_por_data() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.frequencia_competencia_travada(uuid, date) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.frequencia_competencia_travada(uuid, date) TO authenticated;

NOTIFY pgrst, 'reload schema';
