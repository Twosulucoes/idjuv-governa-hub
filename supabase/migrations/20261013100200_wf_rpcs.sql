-- ============================================================================
-- Workflow: RPCs do acompanhamento de processos do SEI e view da lista
-- ============================================================================
-- Spec (aprovada pelo dono em 2026-10-13): docs/superpowers/specs/2026-10-13-tramitacao-acompanhamento-sei-design.md,
-- seções "Banco", "Sigilo e RLS" e "Erros e casos de borda". Terceira migração do acompanhamento do SEI: depois dos
-- modelos (20261013100000) e do sigilo (20261013100100), que deixou as seis tabelas do processo SEM policy de
-- INSERT/UPDATE. Estas RPCs são o ÚNICO caminho de escrita: SECURITY DEFINER (dono postgres, com BYPASSRLS),
-- search_path fixo e EXECUTE só para authenticated.
--
-- Vale nos DOIS estados do banco (do baseline e só pelas migrações). Idempotente: ADD COLUMN IF NOT EXISTS,
-- CREATE OR REPLACE.
--
-- Regras comuns a todas as RPCs que recebem um processo (função interna wf_travar_processo):
--   * primeiro o sigilo (wf_pode_ver_processo), depois a trava da linha (SELECT ... FOR UPDATE) e só então a
--     permissão da ação. Quem não vê o processo recebe 42501 com a MESMA mensagem de processo inexistente (não
--     revela se o id existe);
--   * a trava serializa as movimentações do mesmo processo: os triggers numerar_movimentacao/numerar_despacho fazem
--     MAX+1 sem trava própria, e toda RPC que grava movimentação já segura a linha do processo antes do INSERT;
--   * em processo restrito/sigiloso, quem só tem credencial de LEITURA (acesso_processo_sigiloso.nivel_acesso =
--     'leitura') não altera nada; 'tramitacao' e 'total' alteram (a permissão da ação continua valendo);
--   * códigos de erro: 42501 (permissão/sigilo), 22023 (regra de negócio), 40001 (a etapa mudou: recarregue).
--
-- Blocos:
--   1. coluna suspenso_desde (data em que o relógio do prazo parou)
--   2. funções internas (sem EXECUTE pela API): wf_resolver_unidade, wf_travar_processo, wf_exigir_em_andamento,
--      wf_pendencias, wf_preparar_numero_sei, wf_registrar_movimentacao
--   3. RPCs: wf_abrir_processo, wf_marcar_item, wf_avancar_etapa, wf_devolver_etapa, wf_suspender, wf_reativar,
--      wf_concluir, wf_arquivar, wf_atualizar_numero_sei, wf_conceder_acesso, wf_revogar_acesso
--   4. fn_situacao_prazo e a view v_processos_acompanhamento (security_invoker)
--   5. privilégios (mesmas linhas no supabase/baseline/overlay/40_privilegios.sql)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Suspensão
-- ----------------------------------------------------------------------------
-- A suspensão para o relógio do prazo: wf_reativar soma, a partir de hoje, os dias úteis que faltavam entre esta
-- data e etapa_prazo_limite. Nulo fora da suspensão.
ALTER TABLE public.processos_administrativos ADD COLUMN IF NOT EXISTS suspenso_desde date;

-- ----------------------------------------------------------------------------
-- 2. Funções internas (EXECUTE revogado de PUBLIC, anon, authenticated e service_role; só as RPCs, como postgres,
--    as chamam)
-- ----------------------------------------------------------------------------

-- Unidade de uma etapa: @ORIGEM -> unidade de origem do processo; @CHEFIA -> unidade superior à de origem; outra
-- sigla -> unidade ativa (e não extinta) com a mesma sigla, sem diferenciar maiúsculas. Não achou -> NULL (a etapa
-- avança assim mesmo e a tela mostra a sigla).
CREATE OR REPLACE FUNCTION public.wf_resolver_unidade(p_sigla text, p_unidade_origem uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT CASE
    WHEN nullif(btrim(p_sigla), '') IS NULL THEN NULL
    WHEN upper(btrim(p_sigla)) = '@ORIGEM' THEN p_unidade_origem
    WHEN upper(btrim(p_sigla)) = '@CHEFIA' THEN
      (SELECT e.superior_id FROM public.estrutura_organizacional e WHERE e.id = p_unidade_origem)
    ELSE
      (SELECT e.id FROM public.estrutura_organizacional e
        WHERE lower(e.sigla) = lower(btrim(p_sigla))
          AND e.ativo IS NOT FALSE
          AND (e.data_extincao IS NULL OR e.data_extincao > public.data_local())
        ORDER BY e.nivel, e.ordem, e.created_at, e.id
        LIMIT 1)
  END;
$$;

-- Sigilo + trava + nível da credencial. Devolve a linha do processo já travada (FOR UPDATE).
CREATE OR REPLACE FUNCTION public.wf_travar_processo(p_processo_id uuid, p_escrita boolean)
RETURNS public.processos_administrativos
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  p public.processos_administrativos;
BEGIN
  -- mesma mensagem para "não existe" e "não pode ver"
  IF p_processo_id IS NULL OR NOT coalesce(public.wf_pode_ver_processo(p_processo_id), false) THEN
    RAISE EXCEPTION 'Processo não encontrado ou você não tem acesso a ele.' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO p FROM public.processos_administrativos WHERE id = p_processo_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Processo não encontrado ou você não tem acesso a ele.' USING ERRCODE = '42501';
  END IF;
  -- processo restrito/sigiloso visto só por credencial de leitura: não altera
  IF p_escrita AND p.sigilo <> 'publico'
     AND p.created_by IS DISTINCT FROM auth.uid()
     AND NOT public.has_permission_code(auth.uid(), 'workflow.admin')
     AND NOT EXISTS (SELECT 1 FROM public.acesso_processo_sigiloso a
                      WHERE a.processo_id = p.id AND a.usuario_id = auth.uid()
                        AND a.nivel_acesso IN ('tramitacao', 'total')) THEN
    RAISE EXCEPTION 'Sua credencial neste processo é só de leitura.' USING ERRCODE = '42501';
  END IF;
  RETURN p;
END;
$$;

-- Processo suspenso, concluído ou arquivado não aceita RPC de etapa nem de checklist.
CREATE OR REPLACE FUNCTION public.wf_exigir_em_andamento(p_status public.status_processo_administrativo)
RETURNS void
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_status = 'suspenso' THEN
    RAISE EXCEPTION 'O processo está suspenso. Reative-o antes de continuar.' USING ERRCODE = '22023';
  ELSIF p_status = 'concluido' THEN
    RAISE EXCEPTION 'O processo está concluído e não aceita mais alterações.' USING ERRCODE = '22023';
  ELSIF p_status = 'arquivado' THEN
    RAISE EXCEPTION 'O processo está arquivado e não aceita mais alterações.' USING ERRCODE = '22023';
  END IF;
END;
$$;

-- Códigos dos itens obrigatórios ainda não marcados nas etapas p_de..p_ate do modelo do processo.
CREATE OR REPLACE FUNCTION public.wf_pendencias(p_processo_id uuid, p_modelo_id uuid, p_de integer, p_ate integer)
RETURNS text[]
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT coalesce(array_agg(c.codigo ORDER BY c.etapa_ordem, c.codigo), ARRAY[]::text[])
  FROM public.processo_modelo_checklist c
  WHERE c.modelo_id = p_modelo_id
    AND c.obrigatorio
    AND c.etapa_ordem BETWEEN p_de AND p_ate
    AND NOT EXISTS (SELECT 1 FROM public.processo_checklist_respostas r
                     WHERE r.processo_id = p_processo_id AND r.item_id = c.id AND r.marcado);
$$;

-- Número SEI: tira os espaços; vazio -> NULL; exige algum dígito; recusa número já usado em outro processo
-- (mostra o número interno desse processo só a quem pode vê-lo).
CREATE OR REPLACE FUNCTION public.wf_preparar_numero_sei(p_numero_sei text, p_processo_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_numero text := nullif(regexp_replace(coalesce(p_numero_sei, ''), '\s', '', 'g'), '');
  v_outro record;
BEGIN
  IF v_numero IS NULL THEN
    RETURN NULL;
  END IF;
  IF v_numero !~ '[0-9]' THEN
    RAISE EXCEPTION 'Número SEI inválido: informe o número com os dígitos.' USING ERRCODE = '22023';
  END IF;
  SELECT o.id, o.numero_processo, o.ano INTO v_outro
    FROM public.processos_administrativos o
   WHERE o.numero_sei = v_numero AND o.id IS DISTINCT FROM p_processo_id;
  IF FOUND THEN
    IF coalesce(public.wf_pode_ver_processo(v_outro.id), false) THEN
      RAISE EXCEPTION 'O número SEI % já está no processo %/%.', v_numero, v_outro.numero_processo, v_outro.ano
        USING ERRCODE = '22023';
    END IF;
    RAISE EXCEPTION 'O número SEI % já está em outro processo.', v_numero USING ERRCODE = '22023';
  END IF;
  RETURN v_numero;
END;
$$;

-- Uma linha de movimentacoes_processo, já recebida, com quem fez. numero_sequencial = 0 faz o trigger
-- numerar_movimentacao numerar (o padrão da coluna é 1, e com 1 o trigger não dispara). Quem chama já travou o
-- processo (wf_travar_processo), o que serializa o MAX+1 do trigger.
CREATE OR REPLACE FUNCTION public.wf_registrar_movimentacao(
  p_processo_id uuid, p_tipo public.tipo_movimentacao_processo, p_descricao text, p_observacoes text,
  p_unidade_origem uuid, p_unidade_destino uuid, p_etapa_origem integer, p_etapa_destino integer,
  p_prazo_dias integer, p_prazo_limite date)
RETURNS void
LANGUAGE sql
SET search_path = public, pg_temp
AS $$
  INSERT INTO public.movimentacoes_processo
    (processo_id, numero_sequencial, tipo_movimentacao, descricao, observacoes, unidade_origem_id, unidade_destino_id,
     servidor_origem_id, etapa_origem_ordem, etapa_destino_ordem, prazo_dias, prazo_limite, status, data_recebimento,
     created_by)
  VALUES
    (p_processo_id, 0, p_tipo, p_descricao, nullif(btrim(p_observacoes), ''), p_unidade_origem, p_unidade_destino,
     (SELECT pr.servidor_id FROM public.profiles pr WHERE pr.id = auth.uid()), p_etapa_origem, p_etapa_destino,
     p_prazo_dias, p_prazo_limite, 'recebido', now(), auth.uid());
$$;

-- ----------------------------------------------------------------------------
-- 3. RPCs
-- ----------------------------------------------------------------------------

-- Abre um processo acompanhado na etapa 1 do modelo. Unidade de origem = lotação vigente do servidor do login
-- (nula se não houver: as etapas @ORIGEM/@CHEFIA ficam só com a sigla). Número interno pelo trigger.
CREATE OR REPLACE FUNCTION public.wf_abrir_processo(
  p_modelo_codigo text, p_assunto text, p_descricao text, p_interessado_tipo text, p_interessado_nome text,
  p_interessado_documento text DEFAULT NULL, p_sigilo public.nivel_sigilo_processo DEFAULT 'publico',
  p_numero_sei text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_modelo public.processo_modelos;
  v_etapa public.processo_modelo_etapas;
  v_tipo text := coalesce(nullif(btrim(p_interessado_tipo), ''), 'interno');
  v_servidor uuid;
  v_origem uuid;
  v_numero_sei text;
  v_id uuid;
BEGIN
  IF NOT public.has_permission_code(auth.uid(), 'workflow.criar') THEN
    RAISE EXCEPTION 'Você não tem permissão para abrir processos.' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_modelo FROM public.processo_modelos WHERE codigo = btrim(p_modelo_codigo) AND ativo;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Modelo de processo "%" não encontrado ou inativo.', coalesce(p_modelo_codigo, '') USING ERRCODE = '22023';
  END IF;
  IF nullif(btrim(p_assunto), '') IS NULL THEN
    RAISE EXCEPTION 'Informe o assunto do processo.' USING ERRCODE = '22023';
  END IF;
  IF nullif(btrim(p_interessado_nome), '') IS NULL THEN
    RAISE EXCEPTION 'Informe o interessado do processo.' USING ERRCODE = '22023';
  END IF;
  IF v_tipo NOT IN ('interno', 'externo') THEN
    RAISE EXCEPTION 'Tipo de interessado inválido: use interno ou externo.' USING ERRCODE = '22023';
  END IF;
  v_numero_sei := public.wf_preparar_numero_sei(p_numero_sei, NULL);

  -- lotação vigente do servidor do login (lotação antes de cessão, a mais recente primeiro)
  SELECT pr.servidor_id INTO v_servidor FROM public.profiles pr WHERE pr.id = auth.uid();
  IF v_servidor IS NOT NULL THEN
    SELECT l.unidade_id INTO v_origem FROM public.lotacao_vigente(v_servidor) l LIMIT 1;
  END IF;

  SELECT * INTO v_etapa FROM public.processo_modelo_etapas
   WHERE modelo_id = v_modelo.id ORDER BY ordem LIMIT 1;

  BEGIN
    INSERT INTO public.processos_administrativos
      (tipo_processo, assunto, descricao, interessado_tipo, interessado_nome, interessado_documento, unidade_origem_id,
       status, sigilo, created_by, numero_sei, modelo_id, etapa_atual_ordem, unidade_atual_id, etapa_iniciada_em,
       etapa_prazo_limite)
    VALUES
      (v_modelo.tipo_processo, btrim(p_assunto), nullif(btrim(p_descricao), ''), v_tipo, btrim(p_interessado_nome),
       nullif(btrim(p_interessado_documento), ''), v_origem, 'aberto', coalesce(p_sigilo, 'publico'), auth.uid(),
       v_numero_sei, v_modelo.id, v_etapa.ordem,
       CASE WHEN v_etapa.id IS NOT NULL THEN public.wf_resolver_unidade(v_etapa.unidade_sigla, v_origem) END,
       now(),
       CASE WHEN v_etapa.prazo_dias_uteis IS NOT NULL
            THEN public.fn_somar_dias_uteis(public.data_local(), v_etapa.prazo_dias_uteis) END)
    RETURNING id INTO v_id;
  EXCEPTION WHEN unique_violation THEN
    -- corrida com outra abertura usando o mesmo número SEI
    RAISE EXCEPTION 'O número SEI % já está em outro processo.', v_numero_sei USING ERRCODE = '22023';
  END;
  RETURN v_id;
END;
$$;

-- Marca/desmarca um item do checklist. Só itens da etapa atual ou de etapas anteriores.
CREATE OR REPLACE FUNCTION public.wf_marcar_item(
  p_processo_id uuid, p_item_codigo text, p_marcado boolean, p_observacao text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  p public.processos_administrativos;
  v_item public.processo_modelo_checklist;
BEGIN
  p := public.wf_travar_processo(p_processo_id, true);
  IF NOT public.has_permission_code(auth.uid(), 'workflow.tramitar') THEN
    RAISE EXCEPTION 'Você não tem permissão para tramitar processos.' USING ERRCODE = '42501';
  END IF;
  PERFORM public.wf_exigir_em_andamento(p.status);
  IF p.modelo_id IS NULL THEN
    RAISE EXCEPTION 'Este processo não tem checklist (foi aberto sem modelo).' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_item FROM public.processo_modelo_checklist
   WHERE modelo_id = p.modelo_id AND codigo = btrim(p_item_codigo);
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item "%" não existe no checklist deste processo.', coalesce(p_item_codigo, '') USING ERRCODE = '22023';
  END IF;
  IF v_item.etapa_ordem > coalesce(p.etapa_atual_ordem, 0) THEN
    RAISE EXCEPTION 'O item "%" é da etapa %, que o processo ainda não alcançou.', v_item.codigo, v_item.etapa_ordem
      USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.processo_checklist_respostas (processo_id, item_id, marcado, marcado_por, marcado_em, observacao)
  VALUES (p.id, v_item.id, coalesce(p_marcado, false), auth.uid(), now(), nullif(btrim(p_observacao), ''))
  ON CONFLICT (processo_id, item_id) DO UPDATE
    SET marcado = EXCLUDED.marcado, marcado_por = EXCLUDED.marcado_por, marcado_em = EXCLUDED.marcado_em,
        observacao = EXCLUDED.observacao;
END;
$$;

-- Avança para a próxima etapa do modelo. Recusa: etapa mudou (40001); última etapa (conclua); sem número SEI ao sair
-- da etapa 1; item obrigatório da etapa atual pendente (lista os códigos).
CREATE OR REPLACE FUNCTION public.wf_avancar_etapa(p_processo_id uuid, p_etapa_esperada integer, p_observacao text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  p public.processos_administrativos;
  v_atual public.processo_modelo_etapas;
  v_prox public.processo_modelo_etapas;
  v_pend text[];
  v_unidade uuid;
  v_limite date;
BEGIN
  p := public.wf_travar_processo(p_processo_id, true);
  IF NOT public.has_permission_code(auth.uid(), 'workflow.tramitar') THEN
    RAISE EXCEPTION 'Você não tem permissão para tramitar processos.' USING ERRCODE = '42501';
  END IF;
  PERFORM public.wf_exigir_em_andamento(p.status);
  IF p.modelo_id IS NULL OR p.etapa_atual_ordem IS NULL THEN
    RAISE EXCEPTION 'Este processo não tem etapas (foi aberto sem modelo). Use concluir ou arquivar.' USING ERRCODE = '22023';
  END IF;
  IF p_etapa_esperada IS DISTINCT FROM p.etapa_atual_ordem THEN
    RAISE EXCEPTION 'O processo mudou desde a última leitura (outra pessoa o movimentou). Recarregue a página e tente de novo.'
      USING ERRCODE = '40001';
  END IF;
  SELECT * INTO v_atual FROM public.processo_modelo_etapas WHERE modelo_id = p.modelo_id AND ordem = p.etapa_atual_ordem;
  SELECT * INTO v_prox FROM public.processo_modelo_etapas
   WHERE modelo_id = p.modelo_id AND ordem > p.etapa_atual_ordem ORDER BY ordem LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Esta é a última etapa do processo: conclua o processo em vez de avançar.' USING ERRCODE = '22023';
  END IF;
  v_pend := public.wf_pendencias(p.id, p.modelo_id, p.etapa_atual_ordem, p.etapa_atual_ordem);
  IF cardinality(v_pend) > 0 THEN
    RAISE EXCEPTION 'Itens obrigatórios pendentes nesta etapa: %.', array_to_string(v_pend, ', ') USING ERRCODE = '22023';
  END IF;
  IF p.etapa_atual_ordem = 1 AND p.numero_sei IS NULL THEN
    RAISE EXCEPTION 'Informe o número SEI do processo antes de sair da etapa 1.' USING ERRCODE = '22023';
  END IF;

  v_unidade := public.wf_resolver_unidade(v_prox.unidade_sigla, p.unidade_origem_id);
  v_limite := CASE WHEN v_prox.prazo_dias_uteis IS NOT NULL
                   THEN public.fn_somar_dias_uteis(public.data_local(), v_prox.prazo_dias_uteis) END;
  PERFORM public.wf_registrar_movimentacao(p.id, 'encaminhamento',
    format('Avançou da etapa %s (%s) para a etapa %s (%s).', v_atual.ordem, v_atual.nome, v_prox.ordem, v_prox.nome),
    p_observacao, p.unidade_atual_id, v_unidade, p.etapa_atual_ordem, v_prox.ordem, v_prox.prazo_dias_uteis, v_limite);
  UPDATE public.processos_administrativos
     SET etapa_atual_ordem = v_prox.ordem, unidade_atual_id = v_unidade, etapa_iniciada_em = now(),
         etapa_prazo_limite = v_limite, status = 'em_tramitacao'
   WHERE id = p.id;
END;
$$;

-- Devolve para uma etapa anterior (ex.: o Controle Interno devolve). Motivo obrigatório.
CREATE OR REPLACE FUNCTION public.wf_devolver_etapa(p_processo_id uuid, p_etapa_esperada integer, p_para_ordem integer, p_motivo text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  p public.processos_administrativos;
  v_atual public.processo_modelo_etapas;
  v_dest public.processo_modelo_etapas;
  v_unidade uuid;
  v_limite date;
BEGIN
  p := public.wf_travar_processo(p_processo_id, true);
  IF NOT public.has_permission_code(auth.uid(), 'workflow.tramitar') THEN
    RAISE EXCEPTION 'Você não tem permissão para tramitar processos.' USING ERRCODE = '42501';
  END IF;
  PERFORM public.wf_exigir_em_andamento(p.status);
  IF p.modelo_id IS NULL OR p.etapa_atual_ordem IS NULL THEN
    RAISE EXCEPTION 'Este processo não tem etapas (foi aberto sem modelo).' USING ERRCODE = '22023';
  END IF;
  IF p_etapa_esperada IS DISTINCT FROM p.etapa_atual_ordem THEN
    RAISE EXCEPTION 'O processo mudou desde a última leitura (outra pessoa o movimentou). Recarregue a página e tente de novo.'
      USING ERRCODE = '40001';
  END IF;
  IF nullif(btrim(p_motivo), '') IS NULL THEN
    RAISE EXCEPTION 'Informe o motivo da devolução.' USING ERRCODE = '22023';
  END IF;
  IF p_para_ordem IS NULL OR p_para_ordem >= p.etapa_atual_ordem THEN
    RAISE EXCEPTION 'A devolução precisa ir para uma etapa anterior à atual (%).', p.etapa_atual_ordem USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_dest FROM public.processo_modelo_etapas WHERE modelo_id = p.modelo_id AND ordem = p_para_ordem;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'A etapa % não existe no modelo deste processo.', p_para_ordem USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_atual FROM public.processo_modelo_etapas WHERE modelo_id = p.modelo_id AND ordem = p.etapa_atual_ordem;

  v_unidade := public.wf_resolver_unidade(v_dest.unidade_sigla, p.unidade_origem_id);
  v_limite := CASE WHEN v_dest.prazo_dias_uteis IS NOT NULL
                   THEN public.fn_somar_dias_uteis(public.data_local(), v_dest.prazo_dias_uteis) END;
  PERFORM public.wf_registrar_movimentacao(p.id, 'devolucao',
    format('Devolveu da etapa %s (%s) para a etapa %s (%s).', p.etapa_atual_ordem, coalesce(v_atual.nome, '?'), v_dest.ordem, v_dest.nome),
    p_motivo, p.unidade_atual_id, v_unidade, p.etapa_atual_ordem, v_dest.ordem, v_dest.prazo_dias_uteis, v_limite);
  UPDATE public.processos_administrativos
     SET etapa_atual_ordem = v_dest.ordem, unidade_atual_id = v_unidade, etapa_iniciada_em = now(),
         etapa_prazo_limite = v_limite, status = 'em_tramitacao'
   WHERE id = p.id;
END;
$$;

-- Suspende: o relógio do prazo para (suspenso_desde). Motivo obrigatório.
CREATE OR REPLACE FUNCTION public.wf_suspender(p_processo_id uuid, p_motivo text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  p public.processos_administrativos;
BEGIN
  p := public.wf_travar_processo(p_processo_id, true);
  IF NOT public.has_permission_code(auth.uid(), 'workflow.concluir') THEN
    RAISE EXCEPTION 'Você não tem permissão para suspender processos.' USING ERRCODE = '42501';
  END IF;
  PERFORM public.wf_exigir_em_andamento(p.status);
  IF nullif(btrim(p_motivo), '') IS NULL THEN
    RAISE EXCEPTION 'Informe o motivo da suspensão.' USING ERRCODE = '22023';
  END IF;
  PERFORM public.wf_registrar_movimentacao(p.id, 'informacao', 'Processo suspenso.', p_motivo,
    p.unidade_atual_id, p.unidade_atual_id, p.etapa_atual_ordem, p.etapa_atual_ordem, NULL, NULL);
  UPDATE public.processos_administrativos
     SET status = 'suspenso', suspenso_desde = public.data_local()
   WHERE id = p.id;
END;
$$;

-- Reativa: o prazo da etapa volta a correr com os dias úteis que faltavam na suspensão. Se já estava vencido ao
-- suspender, continua vencido pelos mesmos dias corridos. Motivo obrigatório.
CREATE OR REPLACE FUNCTION public.wf_reativar(p_processo_id uuid, p_motivo text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  p public.processos_administrativos;
  v_hoje date := public.data_local();
  v_restantes integer := 0;
  v_limite date;
BEGIN
  p := public.wf_travar_processo(p_processo_id, true);
  IF NOT public.has_permission_code(auth.uid(), 'workflow.concluir') THEN
    RAISE EXCEPTION 'Você não tem permissão para reativar processos.' USING ERRCODE = '42501';
  END IF;
  IF p.status IN ('concluido', 'arquivado') THEN
    PERFORM public.wf_exigir_em_andamento(p.status);
  END IF;
  IF p.status <> 'suspenso' THEN
    RAISE EXCEPTION 'O processo não está suspenso.' USING ERRCODE = '22023';
  END IF;
  IF nullif(btrim(p_motivo), '') IS NULL THEN
    RAISE EXCEPTION 'Informe o motivo da reativação.' USING ERRCODE = '22023';
  END IF;

  v_limite := p.etapa_prazo_limite;
  IF p.etapa_prazo_limite IS NOT NULL AND p.suspenso_desde IS NOT NULL THEN
    IF p.etapa_prazo_limite >= p.suspenso_desde THEN
      -- dias úteis entre a suspensão (exclusive) e o limite (inclusive)
      WHILE public.fn_somar_dias_uteis(p.suspenso_desde, v_restantes + 1) <= p.etapa_prazo_limite LOOP
        v_restantes := v_restantes + 1;
      END LOOP;
      v_limite := public.fn_somar_dias_uteis(v_hoje, v_restantes);
    ELSE
      v_limite := v_hoje - (p.suspenso_desde - p.etapa_prazo_limite);
    END IF;
  END IF;

  PERFORM public.wf_registrar_movimentacao(p.id, 'informacao', 'Processo reativado.', p_motivo,
    p.unidade_atual_id, p.unidade_atual_id, p.etapa_atual_ordem, p.etapa_atual_ordem, NULL, v_limite);
  UPDATE public.processos_administrativos
     SET status = CASE WHEN EXISTS (SELECT 1 FROM public.movimentacoes_processo m
                                     WHERE m.processo_id = p.id AND m.tipo_movimentacao IN ('encaminhamento', 'devolucao'))
                       THEN 'em_tramitacao' ELSE 'aberto' END::public.status_processo_administrativo,
         suspenso_desde = NULL,
         etapa_prazo_limite = v_limite
   WHERE id = p.id;
END;
$$;

-- Conclui. Com modelo: só na última etapa e com todos os itens obrigatórios marcados. Sem modelo (processo antigo):
-- conclui direto.
CREATE OR REPLACE FUNCTION public.wf_concluir(p_processo_id uuid, p_motivo text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  p public.processos_administrativos;
  v_ultima integer;
  v_pend text[];
BEGIN
  p := public.wf_travar_processo(p_processo_id, true);
  IF NOT public.has_permission_code(auth.uid(), 'workflow.concluir') THEN
    RAISE EXCEPTION 'Você não tem permissão para concluir processos.' USING ERRCODE = '42501';
  END IF;
  PERFORM public.wf_exigir_em_andamento(p.status);
  IF p.modelo_id IS NOT NULL THEN
    SELECT max(ordem) INTO v_ultima FROM public.processo_modelo_etapas WHERE modelo_id = p.modelo_id;
    IF v_ultima IS NOT NULL AND p.etapa_atual_ordem IS DISTINCT FROM v_ultima THEN
      RAISE EXCEPTION 'O processo só pode ser concluído na última etapa (%); está na etapa %.', v_ultima, coalesce(p.etapa_atual_ordem::text, '-')
        USING ERRCODE = '22023';
    END IF;
    v_pend := public.wf_pendencias(p.id, p.modelo_id, 1, coalesce(v_ultima, 0));
    IF cardinality(v_pend) > 0 THEN
      RAISE EXCEPTION 'Itens obrigatórios pendentes no checklist: %.', array_to_string(v_pend, ', ') USING ERRCODE = '22023';
    END IF;
  END IF;
  PERFORM public.wf_registrar_movimentacao(p.id, 'decisao', 'Processo concluído.', p_motivo,
    p.unidade_atual_id, NULL, p.etapa_atual_ordem, NULL, NULL, NULL);
  UPDATE public.processos_administrativos
     SET status = 'concluido', data_encerramento = public.data_local()
   WHERE id = p.id;
END;
$$;

-- Arquiva. Aceita processo em andamento, suspenso ou concluído; recusa o já arquivado.
CREATE OR REPLACE FUNCTION public.wf_arquivar(p_processo_id uuid, p_motivo text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  p public.processos_administrativos;
BEGIN
  p := public.wf_travar_processo(p_processo_id, true);
  IF NOT public.has_permission_code(auth.uid(), 'workflow.arquivar') THEN
    RAISE EXCEPTION 'Você não tem permissão para arquivar processos.' USING ERRCODE = '42501';
  END IF;
  IF p.status = 'arquivado' THEN
    PERFORM public.wf_exigir_em_andamento(p.status);
  END IF;
  PERFORM public.wf_registrar_movimentacao(p.id, 'decisao', 'Processo arquivado.', p_motivo,
    p.unidade_atual_id, NULL, p.etapa_atual_ordem, NULL, NULL, NULL);
  UPDATE public.processos_administrativos
     SET status = 'arquivado', suspenso_desde = NULL, data_encerramento = coalesce(data_encerramento, public.data_local())
   WHERE id = p.id;
END;
$$;

-- Corrige o número SEI enquanto o processo está na etapa 1 (ou não tem modelo). Vazio apaga o número.
CREATE OR REPLACE FUNCTION public.wf_atualizar_numero_sei(p_processo_id uuid, p_numero_sei text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  p public.processos_administrativos;
  v_numero text;
BEGIN
  p := public.wf_travar_processo(p_processo_id, true);
  IF NOT public.has_permission_code(auth.uid(), 'workflow.tramitar') THEN
    RAISE EXCEPTION 'Você não tem permissão para tramitar processos.' USING ERRCODE = '42501';
  END IF;
  PERFORM public.wf_exigir_em_andamento(p.status);
  IF p.etapa_atual_ordem IS NOT NULL AND p.etapa_atual_ordem <> 1 THEN
    RAISE EXCEPTION 'O número SEI só pode ser alterado na etapa 1.' USING ERRCODE = '22023';
  END IF;
  v_numero := public.wf_preparar_numero_sei(p_numero_sei, p.id);
  BEGIN
    UPDATE public.processos_administrativos SET numero_sei = v_numero WHERE id = p.id;
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'O número SEI % já está em outro processo.', v_numero USING ERRCODE = '22023';
  END;
END;
$$;

-- Credencial de sigilo: concede (ou troca o nível de) acesso de um usuário ao processo. Só workflow.admin.
CREATE OR REPLACE FUNCTION public.wf_conceder_acesso(p_processo_id uuid, p_usuario_id uuid, p_nivel text, p_motivo text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  p public.processos_administrativos;
  v_nivel text := lower(btrim(coalesce(p_nivel, '')));
BEGIN
  p := public.wf_travar_processo(p_processo_id, false);
  IF NOT public.has_permission_code(auth.uid(), 'workflow.admin') THEN
    RAISE EXCEPTION 'Você não tem permissão para gerenciar credenciais de sigilo.' USING ERRCODE = '42501';
  END IF;
  IF v_nivel NOT IN ('leitura', 'tramitacao', 'total') THEN
    RAISE EXCEPTION 'Nível de acesso inválido: use leitura, tramitacao ou total.' USING ERRCODE = '22023';
  END IF;
  -- só perfil ativo (mesma coluna de is_active_user); inexistente e bloqueado têm a mesma mensagem
  IF p_usuario_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = p_usuario_id AND pr.is_active IS TRUE) THEN
    RAISE EXCEPTION 'Usuário não encontrado ou inativo.' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.acesso_processo_sigiloso (processo_id, usuario_id, nivel_acesso, motivo, concedido_por)
  VALUES (p.id, p_usuario_id, v_nivel, nullif(btrim(p_motivo), ''), auth.uid())
  ON CONFLICT (processo_id, usuario_id) DO UPDATE
    SET nivel_acesso = EXCLUDED.nivel_acesso, motivo = EXCLUDED.motivo, concedido_por = EXCLUDED.concedido_por;
END;
$$;

-- Retira a credencial (sem erro se o usuário não tinha). Só workflow.admin.
CREATE OR REPLACE FUNCTION public.wf_revogar_acesso(p_processo_id uuid, p_usuario_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  p public.processos_administrativos;
BEGIN
  p := public.wf_travar_processo(p_processo_id, false);
  IF NOT public.has_permission_code(auth.uid(), 'workflow.admin') THEN
    RAISE EXCEPTION 'Você não tem permissão para gerenciar credenciais de sigilo.' USING ERRCODE = '42501';
  END IF;
  DELETE FROM public.acesso_processo_sigiloso WHERE processo_id = p.id AND usuario_id = p_usuario_id;
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. Semáforo do prazo e view da lista
-- ----------------------------------------------------------------------------
-- em_dia | vence_logo (vence em até 2 dias úteis, inclusive hoje) | vencido | sem_prazo. "Hoje" no fuso do órgão, com
-- a mesma regra de data_local() (que não é executável por authenticated, e esta função roda como quem chama).
CREATE OR REPLACE FUNCTION public.fn_situacao_prazo(p_limite date)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_fuso text := nullif(btrim(current_setting('app.fuso_horario', true)), '');
  v_hoje date;
BEGIN
  -- ATENÇÃO: a regra do fuso abaixo espelha public.data_local() (app.fuso_horario, padrão America/Sao_Paulo,
  -- fuso inválido cai no padrão). Mudou uma, mude a outra junto.
  IF p_limite IS NULL THEN
    RETURN 'sem_prazo';
  END IF;
  IF v_fuso IS NOT NULL THEN
    BEGIN
      v_hoje := (now() AT TIME ZONE v_fuso)::date;
    EXCEPTION WHEN invalid_parameter_value THEN
      v_hoje := NULL;
    END;
  END IF;
  v_hoje := coalesce(v_hoje, (now() AT TIME ZONE 'America/Sao_Paulo')::date);
  IF p_limite < v_hoje THEN
    RETURN 'vencido';
  ELSIF p_limite <= public.fn_somar_dias_uteis(v_hoje, 2) THEN
    RETURN 'vence_logo';
  END IF;
  RETURN 'em_dia';
END;
$$;

-- Lista do acompanhamento. security_invoker: a RLS das tabelas de origem vale (o sigilo de processos_administrativos
-- esconde o processo inteiro). Semáforo só para processo em andamento (suspenso, concluído e arquivado: sem_prazo).
-- unidade_sigla: a da unidade resolvida ou, sem ela, a sigla da etapa (ex.: @ORIGEM sem lotação, sigla fora do
-- cadastro). pendencias_obrigatorias: itens obrigatórios não marcados até a etapa atual.
-- DROP + CREATE (e não CREATE OR REPLACE): p.* é expandido na criação, e o REPLACE falharia ao reaplicar a definição
-- depois de uma coluna nova em processos_administrativos. Os privilégios são refeitos logo abaixo.
DROP VIEW IF EXISTS public.v_processos_acompanhamento;
CREATE VIEW public.v_processos_acompanhamento
WITH (security_invoker = true) AS
SELECT
  p.*,
  p.numero_processo || '/' || p.ano AS numero_formatado,
  m.codigo AS modelo_codigo,
  m.nome AS modelo_nome,
  e.nome AS etapa_nome,
  (SELECT count(*) FROM public.processo_modelo_etapas et WHERE et.modelo_id = p.modelo_id)::integer AS etapa_total,
  coalesce(u.sigla, e.unidade_sigla) AS unidade_sigla,
  u.nome AS unidade_nome,
  CASE WHEN p.status IN ('aberto', 'em_tramitacao') THEN public.fn_situacao_prazo(p.etapa_prazo_limite)
       ELSE 'sem_prazo' END AS situacao_prazo,
  (SELECT count(*) FROM public.processo_modelo_checklist c
    WHERE c.modelo_id = p.modelo_id AND c.obrigatorio AND c.etapa_ordem <= coalesce(p.etapa_atual_ordem, 0)
      AND NOT EXISTS (SELECT 1 FROM public.processo_checklist_respostas r
                       WHERE r.processo_id = p.id AND r.item_id = c.id AND r.marcado))::integer AS pendencias_obrigatorias
FROM public.processos_administrativos p
LEFT JOIN public.processo_modelos m ON m.id = p.modelo_id
LEFT JOIN public.processo_modelo_etapas e ON e.modelo_id = p.modelo_id AND e.ordem = p.etapa_atual_ordem
LEFT JOIN public.estrutura_organizacional u ON u.id = p.unidade_atual_id;

COMMENT ON VIEW public.v_processos_acompanhamento IS
  'Acompanhamento de processos do SEI: processo + modelo + etapa atual + unidade + semáforo do prazo + pendências do checklist. security_invoker (sigilo pela RLS).';
-- só leitura, só authenticated (o DROP levou os privilégios; refeitos aqui)
REVOKE ALL ON public.v_processos_acompanhamento FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.v_processos_acompanhamento TO authenticated;

-- ----------------------------------------------------------------------------
-- 5. Privilégios (mesmas linhas no supabase/baseline/overlay/40_privilegios.sql)
-- ----------------------------------------------------------------------------
-- internas: ninguém executa pela API
REVOKE EXECUTE ON FUNCTION public.wf_resolver_unidade(text, uuid) FROM PUBLIC, anon, authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.wf_travar_processo(uuid, boolean) FROM PUBLIC, anon, authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.wf_exigir_em_andamento(public.status_processo_administrativo) FROM PUBLIC, anon, authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.wf_pendencias(uuid, uuid, integer, integer) FROM PUBLIC, anon, authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.wf_preparar_numero_sei(text, uuid) FROM PUBLIC, anon, authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.wf_registrar_movimentacao(uuid, public.tipo_movimentacao_processo, text, text, uuid, uuid, integer, integer, integer, date) FROM PUBLIC, anon, authenticated, service_role;
-- RPCs e semáforo: só authenticated
DO $$
DECLARE f text;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'public.wf_abrir_processo(text, text, text, text, text, text, public.nivel_sigilo_processo, text)',
    'public.wf_marcar_item(uuid, text, boolean, text)',
    'public.wf_avancar_etapa(uuid, integer, text)',
    'public.wf_devolver_etapa(uuid, integer, integer, text)',
    'public.wf_suspender(uuid, text)',
    'public.wf_reativar(uuid, text)',
    'public.wf_concluir(uuid, text)',
    'public.wf_arquivar(uuid, text)',
    'public.wf_atualizar_numero_sei(uuid, text)',
    'public.wf_conceder_acesso(uuid, uuid, text, text)',
    'public.wf_revogar_acesso(uuid, uuid)',
    'public.fn_situacao_prazo(date)'] LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, service_role', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', f);
  END LOOP;
END $$;
-- view: privilégios logo depois do CREATE VIEW (bloco 4)
