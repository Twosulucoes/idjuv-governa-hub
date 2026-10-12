-- Fechamento da folha só com nomeação publicada.
-- Antes: a ficha apenas era sinalizada (portaria_de_nomeacao_nao_publicada). Agora fechar_folha RECUSA enquanto
-- algum servidor com ficha nesta folha tiver provimento ativo sem portaria de nomeação publicada/vigente
-- (mesma regra de rh_pendencias_nomeacao()). Sem exceção por perfil: regularizar a portaria ou tirar o servidor da folha.
CREATE OR REPLACE FUNCTION public.fechar_folha(p_folha_id uuid, p_justificativa text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_folha RECORD;
  v_user_id UUID;
  v_qtd integer;
  v_lista text;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário não autenticado');
  END IF;

  IF NOT public.usuario_pode_fechar_folha(v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão para fechar folha');
  END IF;

  SELECT * INTO v_folha FROM public.folhas_pagamento WHERE id = p_folha_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Folha não encontrada');
  END IF;

  IF v_folha.status = 'fechada' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Folha já está fechada');
  END IF;

  IF v_folha.status NOT IN ('processando', 'aberta') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Folha deve estar em conferência ou aberta para ser fechada');
  END IF;

  -- Nomeação publicada: quem está na folha precisa ter portaria de nomeação publicada/vigente.
  SELECT count(*), string_agg(x.nome || ' (' || coalesce(x.matricula, 's/ matrícula') || ')', ', ' ORDER BY x.nome)
    INTO v_qtd, v_lista
    FROM (SELECT DISTINCT pn.servidor_id, pn.nome, pn.matricula
            FROM public.rh_pendencias_nomeacao() pn
            JOIN public.fichas_financeiras ff ON ff.servidor_id = pn.servidor_id AND ff.folha_id = p_folha_id) x;

  IF v_qtd > 0 THEN
    RETURN jsonb_build_object('success', false,
      'error', format('Não é possível fechar: %s servidor(es) sem portaria de nomeação publicada: %s. Publique a portaria (ou retire o servidor da folha) e tente de novo.',
                      v_qtd, left(v_lista, 400) || CASE WHEN length(v_lista) > 400 THEN '…' ELSE '' END),
      'pendencias_nomeacao', v_qtd);
  END IF;

  PERFORM public.rh_protocolo_atual('folha', format('Fechamento da folha %s/%s', v_folha.competencia_mes, v_folha.competencia_ano), NULL, jsonb_build_object('folha_id', p_folha_id, 'justificativa', p_justificativa));

  UPDATE public.folhas_pagamento
  SET
    status = 'fechada',
    fechado_por = v_user_id,
    fechado_em = now(),
    justificativa_fechamento = p_justificativa,
    data_fechamento = now()
  WHERE id = p_folha_id;

  INSERT INTO public.audit_logs (
    action, entity_type, entity_id, module_name, description, user_id
  ) VALUES (
    'update', 'folhas_pagamento', p_folha_id, 'rh',
    format('Folha %s/%s fechada. Justificativa: %s', v_folha.competencia_mes, v_folha.competencia_ano, COALESCE(p_justificativa, 'Sem justificativa')),
    v_user_id
  );

  RETURN jsonb_build_object('success', true, 'message', 'Folha fechada com sucesso');
END;
$function$;
