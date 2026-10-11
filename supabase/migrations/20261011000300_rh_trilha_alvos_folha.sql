-- ============================================================================
-- Onda E2 do RH — recorte da aba "Histórico de alterações" (coluna alvos) e folha no módulo rh
-- ============================================================================
-- Spec: docs/superpowers/specs/2026-10-10-rh-trilha-tela-design.md. Depende da E1 (20261011000000) e da
-- 20261011000200 (trilha do Storage grava metadata.servidor_alvo_id). Vale nos dois estados do banco e é idempotente
-- (ADD COLUMN IF NOT EXISTS, CREATE INDEX IF NOT EXISTS, CREATE OR REPLACE FUNCTION).
--
-- 1. audit_logs.alvos: a aba de histórico da ficha do servidor e do detalhe da folha filtrava por um OR de cinco
--    expressões em jsonb (after_data/before_data/metadata ->> servidor_id, metadata ->> servidor_alvo_id, folha_id)
--    sem índice: varria a trilha de trás para frente (com 300 mil linhas: 56–470 ms por página; servidor sem linha,
--    ~400 ms, crescendo com a tabela). Medido (Postgres 16, 300 mil linhas, 5 rodadas de 100 mil INSERTs):
--      * 7 índices btree parciais por expressão: o planner seguiu varrendo pelo índice de sequencia (mesmos tempos),
--        e cada INSERT na trilha ficou ~24% mais caro (mediana 4862 ms x 3914 ms);
--      * coluna gerada alvos + GIN (esta): 0,5–1,5 ms por página do servidor, 0,05 ms sem linha, 10–27 ms na página 11
--        de uma folha com 3000 linhas; INSERT ~5,5% mais caro (4131 ms).
--    A RPC SECURITY INVOKER ficou de fora: precisaria repetir todos os filtros da tela (período, ação, origem,
--    responsável, exportação CSV) e ainda dependeria de índice. Com a coluna, a consulta segue pelo PostgREST e pela
--    RLS de sempre: alvos=cs.{s:<servidor_id>} ou alvos=cs.{f:<folha_id>}.
--    Conteúdo (mesmo recorte que o front fazia): 's:' || servidor de servidores.id (entity_type servidores), de
--    after_data/before_data.servidor_id, de metadata.servidor_id e de metadata.servidor_alvo_id só nas linhas da trilha
--    do Storage (metadata.fonte = 'storage', que o cliente não grava: log_audit e registrar_evento tiram as duas
--    chaves); 'f:' || folha de
--    folhas_pagamento.id, de after_data/before_data.folha_id e de metadata.folha_id. Os ids vêm como texto, como
--    gravados (minúsculos). STORED: o ADD COLUMN reescreve audit_logs uma vez, com trava ACCESS EXCLUSIVE até o COMMIT
--    (leituras e gravações da trilha esperam; segundos com a tabela de hoje). A reescrita não é UPDATE: os triggers da
--    trilha imutável não disparam e nenhuma linha muda de conteúdo.
-- 2. fechar_folha e reabrir_folha gravavam module_name 'folha': a folha é do módulo rh e quem tem
--    rh.auditoria.visualizar não via essas linhas. Passam a gravar 'rh' (corpo idêntico ao de 20261010070000 e do
--    overlay/18, mesmos privilégios). As linhas antigas com 'folha' ficam como estão (trilha imutável): só o admin as lê.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. audit_logs.alvos (+ GIN)
-- ----------------------------------------------------------------------------
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS alvos text[] GENERATED ALWAYS AS (
  array_remove(ARRAY[
    CASE WHEN entity_type = 'servidores' THEN 's:' || entity_id::text END,
    's:' || (after_data ->> 'servidor_id'), 's:' || (before_data ->> 'servidor_id'),
    's:' || (metadata ->> 'servidor_id'),
    CASE WHEN metadata ->> 'fonte' = 'storage' THEN 's:' || (metadata ->> 'servidor_alvo_id') END,
    CASE WHEN entity_type = 'folhas_pagamento' THEN 'f:' || entity_id::text END,
    'f:' || (after_data ->> 'folha_id'), 'f:' || (before_data ->> 'folha_id'), 'f:' || (metadata ->> 'folha_id')
  ], NULL)) STORED;
COMMENT ON COLUMN public.audit_logs.alvos IS
  'Recorte da aba de histórico (gerada): s:<servidor_id> e f:<folha_id> citados pela linha; filtro alvos @> ARRAY[''s:<id>'']';
-- GIN sem WHERE: um índice parcial (alvos <> '{}') não serve ao filtro @> (o planner não prova o predicado).
CREATE INDEX IF NOT EXISTS idx_audit_logs_alvos ON public.audit_logs USING gin (alvos);

-- ----------------------------------------------------------------------------
-- 2. fechar_folha / reabrir_folha no módulo rh (mesmo texto do overlay/18)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fechar_folha(p_folha_id uuid, p_justificativa text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_folha RECORD;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- Verificar autenticação
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário não autenticado');
  END IF;
  
  -- Verificar permissão
  IF NOT public.usuario_pode_fechar_folha(v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão para fechar folha');
  END IF;
  
  -- Buscar folha
  SELECT * INTO v_folha FROM public.folhas_pagamento WHERE id = p_folha_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Folha não encontrada');
  END IF;
  
  -- Verificar status atual
  IF v_folha.status = 'fechada' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Folha já está fechada');
  END IF;
  
  IF v_folha.status NOT IN ('processando', 'aberta') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Folha deve estar em conferência ou aberta para ser fechada');
  END IF;
  
  -- Atualizar para fechada
  UPDATE public.folhas_pagamento
  SET 
    status = 'fechada',
    fechado_por = v_user_id,
    fechado_em = now(),
    justificativa_fechamento = p_justificativa,
    data_fechamento = now()
  WHERE id = p_folha_id;
  
  -- Registrar no audit_log
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

CREATE OR REPLACE FUNCTION public.reabrir_folha(p_folha_id uuid, p_justificativa text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_folha RECORD;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- Verificar autenticação
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário não autenticado');
  END IF;
  
  -- Justificativa obrigatória
  IF p_justificativa IS NULL OR trim(p_justificativa) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Justificativa obrigatória para reabrir folha');
  END IF;
  
  -- Verificar permissão (apenas super_admin)
  IF NOT public.usuario_pode_reabrir_folha(v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Apenas super administradores podem reabrir folhas');
  END IF;
  
  -- Buscar folha
  SELECT * INTO v_folha FROM public.folhas_pagamento WHERE id = p_folha_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Folha não encontrada');
  END IF;
  
  -- Verificar status atual
  IF v_folha.status != 'fechada' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Apenas folhas fechadas podem ser reabertas');
  END IF;
  
  -- Atualizar para reaberta
  UPDATE public.folhas_pagamento
  SET 
    status = 'reaberta',
    reaberto_por = v_user_id,
    reaberto_em = now(),
    justificativa_reabertura = p_justificativa
  WHERE id = p_folha_id;
  
  -- Registrar no audit_log
  INSERT INTO public.audit_logs (
    action, entity_type, entity_id, module_name, description, user_id
  ) VALUES (
    'update', 'folhas_pagamento', p_folha_id, 'rh',
    format('Folha %s/%s REABERTA por super_admin. Justificativa: %s', v_folha.competencia_mes, v_folha.competencia_ano, p_justificativa),
    v_user_id
  );
  
  RETURN jsonb_build_object('success', true, 'message', 'Folha reaberta com sucesso');
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.fechar_folha(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fechar_folha(uuid, text) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.reabrir_folha(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reabrir_folha(uuid, text) TO authenticated, service_role;
