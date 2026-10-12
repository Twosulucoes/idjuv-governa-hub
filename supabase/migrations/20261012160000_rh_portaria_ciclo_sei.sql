-- ============================================================================
-- Portaria: o texto é do SEI, o sistema acompanha o ciclo e grava na ficha
-- ============================================================================
-- Decisão do dono (12/10/2026): o sistema não redige portaria nem outro ato formal; a formalização é no SEI. O sistema
-- registra o processo SEI, o número da portaria e a publicação no DOE, e leva isso para a ficha do servidor.
--   1. documentos.processo_sei e historico_funcional.processo_sei (colunas novas; nada é apagado, os textos antigos
--      de conteudo_html/conteudo_unificado/ementa ficam como histórico).
--   2. documentos_portaria_validar passa a valer também na criação: portaria que já nasce assinada, publicada ou
--      vigente exige o que define a etapa, e o número provisório (PENDENTE/AAAA) não passa de "aguardando assinatura".
--   3. trg_documentos_portaria_ficha: ao virar publicada (ou nascer publicada/vigente), grava processo SEI, número e
--      data da portaria e nº e data do DOE no lançamento do histórico funcional correspondente, sem sobrescrever o
--      que já tem DOE.
--   4. rh_admitir_servidor e rh_desligar_servidor: a pendência da portaria nasce com número provisório (PENDENTE/AAAA,
--      já fora do índice único) e sem ementa redigida, no lugar do número gerado pelo sistema.
-- Idempotente.
-- ============================================================================

ALTER TABLE public.documentos ADD COLUMN IF NOT EXISTS processo_sei text;
ALTER TABLE public.historico_funcional ADD COLUMN IF NOT EXISTS processo_sei text;
COMMENT ON COLUMN public.documentos.processo_sei IS 'Número do processo SEI onde o ato foi formalizado';
COMMENT ON COLUMN public.historico_funcional.processo_sei IS 'Número do processo SEI do ato que ampara o lançamento';

-- ---------------------------------------------------------------------------
-- 2. ordem do ciclo, agora também na criação
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.documentos_portaria_validar()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_de text;
  v_para text;
  v_ok boolean;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.tipo = 'portaria' AND OLD.status::text IN ('assinado', 'aguardando_publicacao', 'publicado', 'vigente', 'revogado') THEN
      RAISE EXCEPTION 'Portaria % (%) não pode ser excluída: ato assinado ou publicado se revoga, não se apaga',
        OLD.numero, OLD.status USING ERRCODE = '42501';
    END IF;
    RETURN OLD;
  END IF;

  IF NEW.tipo IS DISTINCT FROM 'portaria' THEN
    RETURN NEW;
  END IF;
  NEW.processo_sei := nullif(btrim(NEW.processo_sei), '');

  IF TG_OP = 'UPDATE' AND NEW.status IS NOT DISTINCT FROM OLD.status THEN
    -- número provisório não vale para ato já assinado ou publicado
    IF NEW.numero ~ '^PENDENTE' AND NEW.status::text IN ('assinado', 'aguardando_publicacao', 'publicado', 'vigente') THEN
      RAISE EXCEPTION 'Portaria: informe o número oficial do ato (o número provisório % não vale para ato assinado ou publicado)',
        NEW.numero USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
  END IF;

  v_para := NEW.status::text;
  IF TG_OP = 'UPDATE' THEN
    v_de := OLD.status::text;
    v_ok := CASE v_de
      WHEN 'rascunho' THEN v_para IN ('minuta', 'aguardando_assinatura', 'revogado')
      WHEN 'minuta' THEN v_para IN ('aguardando_assinatura', 'revogado')
      WHEN 'aguardando_assinatura' THEN v_para IN ('assinado', 'minuta', 'revogado')
      WHEN 'assinado' THEN v_para IN ('aguardando_publicacao', 'revogado')
      WHEN 'aguardando_publicacao' THEN v_para IN ('publicado', 'assinado', 'revogado')
      WHEN 'publicado' THEN v_para IN ('vigente', 'revogado')
      WHEN 'vigente' THEN v_para IN ('revogado')
      ELSE false
    END;
    IF NOT v_ok THEN
      RAISE EXCEPTION 'Portaria %: não passa de "%" para "%" (ordem: aguardando SEI, aguardando assinatura, assinada, aguardando publicação, publicada, vigente)',
        NEW.numero, v_de, v_para USING ERRCODE = '23514';
    END IF;
  ELSIF v_para = 'revogado' THEN
    RAISE EXCEPTION 'Portaria %: não se cadastra uma portaria já revogada', NEW.numero USING ERRCODE = '23514';
  END IF;

  IF NEW.numero ~ '^PENDENTE' AND v_para IN ('assinado', 'aguardando_publicacao', 'publicado', 'vigente') THEN
    RAISE EXCEPTION 'Portaria: informe o número oficial do ato (o número provisório % não vale para ato assinado ou publicado)',
      NEW.numero USING ERRCODE = '23514';
  END IF;
  -- na criação, quem assinou só é exigido na própria etapa "assinada": um ato que já chega publicado é registrado pelo DOE
  IF v_para = 'assinado' AND (NEW.assinado_por IS NULL OR btrim(NEW.assinado_por) = '' OR NEW.data_assinatura IS NULL) THEN
    RAISE EXCEPTION 'Portaria %: registre quem assinou e a data da assinatura', NEW.numero USING ERRCODE = '23514';
  END IF;
  IF v_para IN ('publicado', 'vigente') AND (TG_OP = 'INSERT' OR v_para = 'publicado')
     AND (NEW.doe_numero IS NULL OR btrim(NEW.doe_numero) = '' OR NEW.doe_data IS NULL) THEN
    RAISE EXCEPTION 'Portaria %: registre o número e a data do DOE', NEW.numero USING ERRCODE = '23514';
  END IF;
  IF v_para = 'vigente' AND NEW.data_vigencia_inicio IS NULL THEN
    RAISE EXCEPTION 'Portaria %: informe a data de início da vigência', NEW.numero USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_documentos_portaria_validar ON public.documentos;
CREATE TRIGGER trg_documentos_portaria_validar
  BEFORE INSERT OR UPDATE OR DELETE ON public.documentos
  FOR EACH ROW EXECUTE FUNCTION public.documentos_portaria_validar();
REVOKE EXECUTE ON FUNCTION public.documentos_portaria_validar() FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. publicação no DOE vai para a ficha (histórico funcional)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.documentos_portaria_ficha()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_tipos public.tipo_movimentacao_funcional[];
  v_serv uuid;
  v_hist uuid;
  v_ref date;
BEGIN
  IF NEW.tipo IS DISTINCT FROM 'portaria' OR NEW.status::text NOT IN ('publicado', 'vigente') THEN
    RETURN NULL;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status::text IN ('publicado', 'vigente')
     AND NEW.numero IS NOT DISTINCT FROM OLD.numero AND NEW.doe_numero IS NOT DISTINCT FROM OLD.doe_numero
     AND NEW.doe_data IS NOT DISTINCT FROM OLD.doe_data AND NEW.processo_sei IS NOT DISTINCT FROM OLD.processo_sei THEN
    RETURN NULL;
  END IF;

  v_tipos := CASE NEW.categoria::text
    WHEN 'nomeacao' THEN ARRAY['nomeacao']::public.tipo_movimentacao_funcional[]
    WHEN 'exoneracao' THEN ARRAY['exoneracao']::public.tipo_movimentacao_funcional[]
    WHEN 'pessoal' THEN ARRAY['aposentadoria', 'vacancia']::public.tipo_movimentacao_funcional[]
    WHEN 'designacao' THEN ARRAY['designacao']::public.tipo_movimentacao_funcional[]
    WHEN 'dispensa' THEN ARRAY['dispensa']::public.tipo_movimentacao_funcional[]
    WHEN 'cessao' THEN ARRAY['cessao', 'requisicao']::public.tipo_movimentacao_funcional[]
  END;
  IF v_tipos IS NULL THEN
    RETURN NULL;
  END IF;
  v_ref := coalesce(NEW.data_vigencia_inicio, NEW.data_documento);

  FOREACH v_serv IN ARRAY coalesce(NEW.servidores_ids, '{}'::uuid[]) LOOP
    -- o lançamento do mesmo tipo e cargo, ainda sem DOE, mais próximo da data do ato
    SELECT h.id INTO v_hist
      FROM public.historico_funcional h
     WHERE h.servidor_id = v_serv
       AND h.tipo = ANY (v_tipos)
       AND (NEW.cargo_id IS NULL OR NEW.cargo_id IN (h.cargo_novo_id, h.cargo_anterior_id))
       AND (h.diario_oficial_numero IS NULL OR h.diario_oficial_numero = NEW.doe_numero)
     ORDER BY abs(h.data_evento - v_ref), h.created_at DESC
     LIMIT 1;
    IF v_hist IS NOT NULL THEN
      UPDATE public.historico_funcional
         SET portaria_numero = NEW.numero,
             portaria_data = NEW.data_documento,
             diario_oficial_numero = NEW.doe_numero,
             diario_oficial_data = NEW.doe_data,
             processo_sei = coalesce(NEW.processo_sei, processo_sei)
       WHERE id = v_hist;
    END IF;
  END LOOP;
  RETURN NULL;
END;
$function$;

DROP TRIGGER IF EXISTS trg_documentos_portaria_ficha ON public.documentos;
CREATE TRIGGER trg_documentos_portaria_ficha
  AFTER INSERT OR UPDATE ON public.documentos
  FOR EACH ROW EXECUTE FUNCTION public.documentos_portaria_ficha();
REVOKE EXECUTE ON FUNCTION public.documentos_portaria_ficha() FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. admissão e desligamento: pendência da portaria sem número inventado e sem texto
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
  v_protocolo text;
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

  -- protocolo do ato (migração 20261012090000): todas as gravações abaixo e na trilha levam este número
  v_protocolo := public.rh_protocolo_atual('admissao',
    'Admissão de ' || v_servidor.nome_completo || ' (' || p_tipo::text || ') em ' || v_unidade_nome
      || ' a partir de ' || to_char(p_data_inicio, 'DD/MM/YYYY'),
    p_servidor_id, jsonb_build_object('tipo_vinculo', p_tipo, 'cargo_id', p_cargo_id, 'unidade_id', p_unidade_id));

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
    -- o número oficial vem do ato registrado no SEI; até lá a pendência fica com número provisório e sem texto
    v_minuta_numero := 'PENDENTE/' || EXTRACT(YEAR FROM p_data_inicio)::int;
    INSERT INTO public.documentos (tipo, categoria, status, titulo, ementa, numero, data_documento, servidores_ids,
                                   cargo_id, unidade_id, provimento_id)
    VALUES ('portaria', 'nomeacao', 'minuta', 'Portaria de Nomeação - ' || v_servidor.nome_completo,
            NULL,
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

  RETURN jsonb_build_object('protocolo', v_protocolo, 'vinculo_id', v_vinculo_id, 'lotacao_id', v_lotacao_id,
                            'provimento_id', v_provimento_id, 'minuta_id', v_minuta_id, 'minuta_numero', v_minuta_numero);
END;
$function$;

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
  v_protocolo text;
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

  v_protocolo := public.rh_protocolo_atual('desligamento',
    'Desligamento de ' || v_servidor.nome_completo || ' (' || p_motivo || ') em ' || to_char(p_data, 'DD/MM/YYYY')
      || coalesce(' — ' || nullif(btrim(p_observacao), ''), ''),
    p_servidor_id, jsonb_build_object('motivo', p_motivo, 'ato_numero', p_ato_numero, 'ato_doe_numero', p_ato_doe_numero));

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
    -- o número oficial vem do ato registrado no SEI; até lá a pendência fica com número provisório e sem texto
    v_minuta_numero := 'PENDENTE/' || EXTRACT(YEAR FROM p_data)::int;
    INSERT INTO public.documentos (tipo, categoria, status, titulo, ementa, numero, data_documento, servidores_ids,
                                   cargo_id, unidade_id)
    VALUES ('portaria', CASE WHEN p_motivo IN ('aposentadoria', 'vacancia') THEN 'pessoal'::categoria_portaria
                             ELSE 'exoneracao'::categoria_portaria END,
            'minuta',
            CASE WHEN p_motivo = 'aposentadoria' THEN 'Aposentadoria - ' ELSE 'Exoneração - ' END || v_servidor.nome_completo,
            NULL,
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

  RETURN jsonb_build_object('protocolo', v_protocolo, 'situacao', v_nova, 'minuta_numero', v_minuta_numero, 'avisos', to_jsonb(v_avisos),
                            'encerrados', jsonb_build_object('lotacoes', v_n_lot, 'vinculos', v_n_vinc,
                              'provimentos', v_n_prov, 'cessoes', v_n_cess, 'designacoes', v_n_desig,
                              'ferias', v_n_fer, 'licencas', v_n_lic, 'viagens', v_n_viag,
                              'chefias_de_unidade', v_n_chefe, 'comissoes', v_n_com));
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.rh_admitir_servidor(uuid, public.tipo_vinculo_servidor, uuid, uuid, date, text, text, text, date, text, date, boolean, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.rh_admitir_servidor(uuid, public.tipo_vinculo_servidor, uuid, uuid, date, text, text, text, date, text, date, boolean, text, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.rh_desligar_servidor(uuid, date, text, text, text, text, date, text, date, boolean) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.rh_desligar_servidor(uuid, date, text, text, text, text, date, text, date, boolean) TO authenticated;

NOTIFY pgrst, 'reload schema';
