-- ============================================================================
-- RH — transferência de unidade e regras de diárias (itens 3 e 4 do que faltava na auditoria)
-- ============================================================================
-- 1. rh_transferir_servidor: mudar de unidade sem exonerar e lotar de novo (antes não existia: a única saída era
--    exonerar + nova nomeação, que apagava o sentido da carreira no histórico). Numa transação, com protocolo:
--    encerra a lotação atual, abre a nova, move provimento e vínculos, grava o
--    histórico (transferência ou remoção) e a minuta de portaria.
-- 2. viagens_diarias (trigger no banco, vale para qualquer tela/API):
--      * não há viagem que cruze férias, licença/afastamento do servidor nem outra viagem dele;
--      * não abre viagem nova para quem tem prestação de contas pendente (viagem em andamento já retornada);
--      * viagem só passa a "concluída" com o relatório apresentado e a data do relatório (prestação de contas).
-- Idempotente.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. transferência
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rh_transferir_servidor(
  p_servidor_id uuid,
  p_unidade_id uuid,
  p_data date,
  p_motivo text DEFAULT 'transferencia',
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
  v_servidor record;
  v_lot record;
  v_unid_ant text;
  v_unid_nova text;
  v_cargo_id uuid;
  v_cargo_nome text;
  v_nova_lotacao uuid;
  v_hist tipo_movimentacao_funcional;
  v_minuta_numero text;
  v_protocolo text;
  v_avisos text[] := '{}';
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_permission_code(auth.uid(), 'rh.lotacoes.editar') THEN
    RAISE EXCEPTION 'Sem permissão para transferir servidor' USING ERRCODE = '42501';
  END IF;
  IF p_motivo NOT IN ('transferencia', 'remocao') THEN
    RAISE EXCEPTION 'Motivo inválido: % (use transferencia ou remocao)', p_motivo;
  END IF;
  IF p_data IS NULL THEN RAISE EXCEPTION 'Informe a data da transferência'; END IF;

  SELECT id, nome_completo, situacao INTO v_servidor FROM public.servidores WHERE id = p_servidor_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Servidor não encontrado'; END IF;
  IF v_servidor.situacao IN ('exonerado', 'aposentado', 'falecido', 'inativo') THEN
    RAISE EXCEPTION 'Servidor % não pode ser transferido (situação %)', v_servidor.nome_completo, v_servidor.situacao;
  END IF;

  SELECT l.* INTO v_lot FROM public.lotacoes l
   WHERE l.servidor_id = p_servidor_id AND l.ativo ORDER BY l.data_inicio DESC LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Servidor sem lotação ativa: use a lotação/admissão, não a transferência';
  END IF;
  IF p_data < v_lot.data_inicio THEN
    RAISE EXCEPTION 'A data da transferência (%) é anterior ao início da lotação atual (%)', p_data, v_lot.data_inicio;
  END IF;
  IF v_lot.unidade_id = p_unidade_id THEN
    RAISE EXCEPTION 'O servidor já está lotado nessa unidade';
  END IF;

  SELECT nome INTO v_unid_nova FROM public.estrutura_organizacional WHERE id = p_unidade_id AND ativo;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unidade de destino não encontrada ou inativa'; END IF;
  SELECT nome INTO v_unid_ant FROM public.estrutura_organizacional WHERE id = v_lot.unidade_id;

  v_cargo_id := coalesce(v_lot.cargo_id,
                         (SELECT p.cargo_id FROM public.provimentos p
                           WHERE p.servidor_id = p_servidor_id AND p.status IN ('ativo', 'suspenso')
                           ORDER BY p.data_nomeacao DESC LIMIT 1));
  IF v_cargo_id IS NOT NULL THEN
    SELECT coalesce(sigla || ' - ', '') || nome INTO v_cargo_nome FROM public.cargos WHERE id = v_cargo_id;
    -- o cargo só pode ser lotado onde a composição do cargo permite (quando ela existe)
    IF EXISTS (SELECT 1 FROM public.composicao_cargos cc WHERE cc.cargo_id = v_cargo_id)
       AND NOT EXISTS (SELECT 1 FROM public.composicao_cargos cc WHERE cc.cargo_id = v_cargo_id AND cc.unidade_id = p_unidade_id) THEN
      RAISE EXCEPTION 'O cargo % não está previsto para a unidade % (composição do cargo)', v_cargo_nome, v_unid_nova;
    END IF;
  END IF;

  v_protocolo := public.rh_protocolo_atual('movimentacao',
    CASE p_motivo WHEN 'remocao' THEN 'Remoção' ELSE 'Transferência' END || ' de ' || v_servidor.nome_completo
      || ' de ' || coalesce(v_unid_ant, '?') || ' para ' || v_unid_nova || ' em ' || to_char(p_data, 'DD/MM/YYYY')
      || coalesce(' — ' || nullif(btrim(p_observacao), ''), ''),
    p_servidor_id, jsonb_build_object('motivo', p_motivo, 'unidade_anterior_id', v_lot.unidade_id,
                                      'unidade_nova_id', p_unidade_id, 'ato_numero', p_ato_numero));

  UPDATE public.lotacoes SET ativo = false, data_fim = p_data - 1,
         observacao = coalesce(p_observacao, 'Transferido em ' || p_data)
   WHERE id = v_lot.id;

  INSERT INTO public.lotacoes (servidor_id, unidade_id, cargo_id, tipo_lotacao, tipo_movimentacao, data_inicio, ativo,
                               funcao_exercida, observacao, ato_tipo, ato_numero, ato_data, ato_doe_numero, ato_doe_data)
  VALUES (p_servidor_id, p_unidade_id, v_cargo_id, coalesce(v_lot.tipo_lotacao, 'lotacao_interna'), p_motivo, p_data, true,
          v_lot.funcao_exercida, p_observacao, p_ato_tipo, p_ato_numero, p_ato_data, p_ato_doe_numero, p_ato_doe_data)
  RETURNING id INTO v_nova_lotacao;

  UPDATE public.provimentos SET unidade_id = p_unidade_id
   WHERE servidor_id = p_servidor_id AND status IN ('ativo', 'suspenso');
  UPDATE public.vinculos_servidor SET unidade_id = p_unidade_id
   WHERE servidor_id = p_servidor_id AND ativo;

  -- chefia de unidade local (nomeacoes_chefe_unidade) é de outra estrutura (unidades locais): não muda aqui
  IF EXISTS (SELECT 1 FROM public.nomeacoes_chefe_unidade WHERE servidor_id = p_servidor_id AND status = 'ativo') THEN
    v_avisos := array_append(v_avisos, 'O servidor tem chefia de unidade local ativa: confira se continua válida após a transferência');
  END IF;

  v_hist := CASE p_motivo WHEN 'remocao' THEN 'remocao' ELSE 'transferencia' END;
  INSERT INTO public.historico_funcional (servidor_id, tipo, data_evento, data_vigencia_inicio, cargo_anterior_id,
                                          cargo_novo_id, unidade_anterior_id, unidade_nova_id, portaria_numero,
                                          portaria_data, diario_oficial_numero, diario_oficial_data, descricao)
  VALUES (p_servidor_id, v_hist, p_data, p_data, v_cargo_id, v_cargo_id, v_lot.unidade_id, p_unidade_id, p_ato_numero,
          p_ato_data, p_ato_doe_numero, p_ato_doe_data,
          CASE p_motivo WHEN 'remocao' THEN 'Remoção' ELSE 'Transferência' END || ' de ' || coalesce(v_unid_ant, '?')
            || ' para ' || v_unid_nova || coalesce('. ' || p_observacao, ''));

  IF p_gerar_minuta THEN
    v_minuta_numero := public.gerar_numero_portaria(EXTRACT(YEAR FROM p_data)::int);
    INSERT INTO public.documentos (tipo, categoria, status, titulo, ementa, numero, data_documento, servidores_ids,
                                   cargo_id, unidade_id)
    VALUES ('portaria', 'pessoal', 'minuta',
            CASE p_motivo WHEN 'remocao' THEN 'Remoção - ' ELSE 'Transferência - ' END || v_servidor.nome_completo,
            CASE p_motivo WHEN 'remocao' THEN 'Remove ' ELSE 'Transfere ' END || v_servidor.nome_completo
              || coalesce(' (' || v_cargo_nome || ')', '') || ' da ' || coalesce(v_unid_ant, '?') || ' para a ' || v_unid_nova || '.',
            v_minuta_numero, p_data, ARRAY[p_servidor_id], v_cargo_id, p_unidade_id);
  END IF;

  -- UPDATE barrado pela RLS não dá erro: confere que a mudança valeu por inteiro (senão desfaz tudo)
  IF EXISTS (SELECT 1 FROM public.lotacoes WHERE id = v_lot.id AND ativo)
     OR EXISTS (SELECT 1 FROM public.provimentos WHERE servidor_id = p_servidor_id AND status IN ('ativo', 'suspenso')
                  AND unidade_id IS DISTINCT FROM p_unidade_id)
     OR EXISTS (SELECT 1 FROM public.vinculos_servidor WHERE servidor_id = p_servidor_id AND ativo
                  AND unidade_id IS DISTINCT FROM p_unidade_id) THEN
    RAISE EXCEPTION 'Sem permissão para atualizar todos os registros da transferência; nada foi gravado'
      USING ERRCODE = '42501';
  END IF;

  RETURN jsonb_build_object('protocolo', v_protocolo, 'lotacao_id', v_nova_lotacao, 'minuta_numero', v_minuta_numero,
                            'unidade_anterior_id', v_lot.unidade_id, 'avisos', to_jsonb(v_avisos));
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.rh_transferir_servidor(uuid, uuid, date, text, text, text, text, date, text, date, boolean) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.rh_transferir_servidor(uuid, uuid, date, text, text, text, text, date, text, date, boolean) TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. viagens e diárias
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.viagens_diarias_validar()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_hoje date := public.data_local();
  v_conf text;
BEGIN
  IF NEW.status = 'cancelada' THEN
    RETURN NEW;
  END IF;
  IF NEW.data_retorno < NEW.data_saida THEN
    RAISE EXCEPTION 'Viagem: a data de retorno (%) é anterior à saída (%)', NEW.data_retorno, NEW.data_saida
      USING ERRCODE = '23514';
  END IF;

  -- conflitos: só quando a viagem nasce ou muda de período/servidor/situação
  IF TG_OP = 'INSERT'
     OR NEW.servidor_id IS DISTINCT FROM OLD.servidor_id
     OR NEW.data_saida IS DISTINCT FROM OLD.data_saida
     OR NEW.data_retorno IS DISTINCT FROM OLD.data_retorno
     OR OLD.status = 'cancelada' THEN

    SELECT 'férias de ' || to_char(f.data_inicio, 'DD/MM/YYYY') || ' a ' || to_char(f.data_fim, 'DD/MM/YYYY') INTO v_conf
      FROM public.ferias_servidor f
     WHERE f.servidor_id = NEW.servidor_id AND f.status IN ('programada', 'em_gozo', 'concluida')
       AND f.data_inicio <= NEW.data_retorno AND f.data_fim >= NEW.data_saida
     LIMIT 1;
    IF v_conf IS NOT NULL THEN
      RAISE EXCEPTION 'Viagem de % a % conflita com %', to_char(NEW.data_saida, 'DD/MM/YYYY'),
        to_char(NEW.data_retorno, 'DD/MM/YYYY'), v_conf USING ERRCODE = '23P01';
    END IF;

    -- missão e serviço externo são deslocamentos a serviço, não impedem a viagem
    SELECT 'licença/afastamento de ' || to_char(l.data_inicio, 'DD/MM/YYYY') || coalesce(' a ' || to_char(l.data_fim, 'DD/MM/YYYY'), ' (sem data final)') INTO v_conf
      FROM public.licencas_afastamentos l
     WHERE l.servidor_id = NEW.servidor_id AND l.status IN ('ativa', 'prorrogada', 'encerrada')
       AND l.tipo_afastamento NOT IN ('missao', 'servico_externo')
       AND l.data_inicio <= NEW.data_retorno AND coalesce(l.data_fim, 'infinity'::date) >= NEW.data_saida
     LIMIT 1;
    IF v_conf IS NOT NULL THEN
      RAISE EXCEPTION 'Viagem de % a % conflita com %', to_char(NEW.data_saida, 'DD/MM/YYYY'),
        to_char(NEW.data_retorno, 'DD/MM/YYYY'), v_conf USING ERRCODE = '23P01';
    END IF;

    SELECT 'outra viagem de ' || to_char(v.data_saida, 'DD/MM/YYYY') || ' a ' || to_char(v.data_retorno, 'DD/MM/YYYY') INTO v_conf
      FROM public.viagens_diarias v
     WHERE v.servidor_id = NEW.servidor_id AND v.id <> NEW.id AND v.status <> 'cancelada'
       AND v.data_saida <= NEW.data_retorno AND v.data_retorno >= NEW.data_saida
     LIMIT 1;
    IF v_conf IS NOT NULL THEN
      RAISE EXCEPTION 'Viagem de % a % conflita com %', to_char(NEW.data_saida, 'DD/MM/YYYY'),
        to_char(NEW.data_retorno, 'DD/MM/YYYY'), v_conf USING ERRCODE = '23P01';
    END IF;
  END IF;

  -- prestação de contas pendente impede viagem nova
  IF TG_OP = 'INSERT' AND EXISTS (
       SELECT 1 FROM public.viagens_diarias v
        WHERE v.servidor_id = NEW.servidor_id AND v.status IN ('em_andamento', 'autorizada')
          AND v.data_retorno < v_hoje AND NOT coalesce(v.relatorio_apresentado, false)) THEN
    RAISE EXCEPTION 'Viagem: o servidor tem prestação de contas pendente (viagem já retornada sem relatório); regularize antes de abrir outra'
      USING ERRCODE = '23514';
  END IF;

  -- concluir exige o relatório
  IF NEW.status = 'concluida' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'concluida')
     AND (NOT coalesce(NEW.relatorio_apresentado, false) OR NEW.relatorio_data IS NULL) THEN
    RAISE EXCEPTION 'Prestação de contas: registre o relatório da viagem (apresentado e data) antes de concluir'
      USING ERRCODE = '23514';
  END IF;
  IF coalesce(NEW.relatorio_apresentado, false) AND NEW.relatorio_data IS NOT NULL AND NEW.relatorio_data < NEW.data_retorno THEN
    RAISE EXCEPTION 'Prestação de contas: a data do relatório (%) é anterior ao retorno (%)', NEW.relatorio_data, NEW.data_retorno
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_viagens_diarias_validar ON public.viagens_diarias;
CREATE TRIGGER trg_viagens_diarias_validar
  BEFORE INSERT OR UPDATE ON public.viagens_diarias
  FOR EACH ROW EXECUTE FUNCTION public.viagens_diarias_validar();

REVOKE EXECUTE ON FUNCTION public.viagens_diarias_validar() FROM PUBLIC, anon, authenticated;

NOTIFY pgrst, 'reload schema';
