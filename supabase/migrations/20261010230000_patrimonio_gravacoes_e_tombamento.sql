-- ============================================================================
-- Patrimônio: gravações que o banco recusava + número de tombamento único e consistente
-- ============================================================================
-- Auditoria do módulo (thread "Auditoria do Patrimônio", 10/10/2026), ondas 1 e 2.
--
-- Onda 1 — fazer o que existe funcionar
--   1. registrar_historico_movimentacao comparava o enum com 'aprovada' (o valor é 'aprovado'):
--      TODO INSERT em movimentacoes_patrimonio falhava. Também gravava tipo_evento =
--      'transferencia_interna', fora do CHECK do histórico. Agora mapeia o tipo, move também a
--      unidade organizacional e não duplica o evento que o trigger do bem gravaria.
--   2. registrar_historico_manutencao gravava situacao = 'alocado' (fora do CHECK) ao concluir.
--   3. Baixa: histórico "baixa_solicitada" ao abrir; decisão por RPC (patrimonio_decidir_baixa),
--      que exige patrimonio.tramitar e muda o bem para "baixado" quando aprovada.
--   4. Movimentação: decisão por RPC (patrimonio_decidir_movimentacao), mesma permissão.
--      Guarda (trigger) em movimentacoes_patrimonio e baixas_patrimonio: sem patrimonio.tramitar,
--      o pedido só nasce pendente e não muda status/aprovador (a RLS é por módulo e deixaria
--      o coletor do celular aprovar direto pela API). Manutenção não abre para bem baixado.
--   5. campanhas_inventario aceita 'pausada' (a tela já oferece "Pausar").
--   6. coletas_inventario: status 'sem_etiqueta' (bem achado sem plaqueta) e a FK da unidade
--      encontrada passa a apontar para unidades_locais, que é o que as telas gravam. NOT VALID:
--      linhas antigas (se houver) não são reescritas nem revalidadas.
--
-- Onda 2 — número de tombamento
--   7. Um único gerador: sequence seq_tombamento_patrimonio, formato PAT-AAAA-NNNNNN, sem
--      reaproveitamento e sem corrida. A RPC gerar_numero_tombamento (antes MAX()+1, formato
--      IDJ-XX-NNNN) passa a usar o mesmo gerador e perde o EXECUTE do app (o número nasce no INSERT).
--   8. Número normalizado (sem espaços nas pontas, maiúsculas) e imutável depois de criado
--      (só admin corrige; o número antigo vai para patrimonio_anterior). codigo_qr = número, e
--      também só admin o altera.
--   9. Índice único sobre o número normalizado, criado só se os dados atuais permitirem
--      (senão avisa por NOTICE e segue: a UNIQUE exata continua valendo).
--  10. RPC patrimonio_buscar_bem_por_codigo: busca no servidor por número, QR ou número anterior
--      (o app buscava na lista inteira no navegador, limitada pelo servidor).
--
-- Nenhuma tabela nova: as policies existentes (classe `modulo`) cobrem tudo. As RPCs novas
-- SECURITY DEFINER checam a permissão de quem chama; nenhuma é executável por anon.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Movimentação: histórico e efeito no bem
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.registrar_historico_movimentacao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'aprovado' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'aprovado') THEN
    INSERT INTO historico_patrimonio (
      bem_id, tipo_evento, unidade_local_id, responsavel_id,
      movimentacao_id, justificativa, documento_url,
      dados_anteriores, dados_novos, usuario_id
    ) VALUES (
      NEW.bem_id,
      CASE NEW.tipo WHEN 'transferencia_interna' THEN 'transferencia' ELSE NEW.tipo::text END,
      COALESCE(NEW.unidade_local_destino_id, NEW.unidade_local_origem_id),
      NEW.responsavel_destino_id,
      NEW.id,
      NEW.motivo,
      NEW.termo_transferencia_url,
      jsonb_build_object('unidade_local_id', NEW.unidade_local_origem_id,
                         'unidade_id', NEW.unidade_origem_id,
                         'responsavel_id', NEW.responsavel_origem_id),
      jsonb_build_object('unidade_local_id', NEW.unidade_local_destino_id,
                         'unidade_id', NEW.unidade_destino_id,
                         'responsavel_id', NEW.responsavel_destino_id),
      auth.uid()
    );

    -- O evento acima já registra a mudança; o trigger do bem não grava outro.
    PERFORM set_config('patrimonio.evento_registrado', 'on', true);
    UPDATE bens_patrimoniais
       SET unidade_local_id = COALESCE(NEW.unidade_local_destino_id, unidade_local_id),
           unidade_id       = COALESCE(NEW.unidade_destino_id, unidade_id),
           responsavel_id   = COALESCE(NEW.responsavel_destino_id, responsavel_id),
           updated_at       = now()
     WHERE id = NEW.bem_id;
    PERFORM set_config('patrimonio.evento_registrado', 'off', true);
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.registrar_historico_patrimonio()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO historico_patrimonio (
      bem_id, tipo_evento, unidade_local_id, responsavel_id,
      localizacao_especifica, estado_conservacao, valor_aquisicao,
      dados_novos, usuario_id
    ) VALUES (
      NEW.id, 'cadastro', NEW.unidade_local_id, NEW.responsavel_id,
      NEW.localizacao_especifica, NEW.estado_conservacao, NEW.valor_aquisicao,
      to_jsonb(NEW), auth.uid()
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Movimentação aprovada e baixa decidida já gravaram o próprio evento.
    IF current_setting('patrimonio.evento_registrado', true) = 'on' THEN
      RETURN NEW;
    END IF;

    IF OLD.unidade_local_id IS DISTINCT FROM NEW.unidade_local_id THEN
      INSERT INTO historico_patrimonio (
        bem_id, tipo_evento, unidade_local_id, responsavel_id,
        localizacao_especifica, estado_conservacao, valor_aquisicao,
        dados_anteriores, dados_novos, justificativa, usuario_id
      ) VALUES (
        NEW.id, 'transferencia', NEW.unidade_local_id, NEW.responsavel_id,
        NEW.localizacao_especifica, NEW.estado_conservacao, NEW.valor_aquisicao,
        jsonb_build_object('unidade_local_id', OLD.unidade_local_id),
        jsonb_build_object('unidade_local_id', NEW.unidade_local_id),
        'Transferência automática', auth.uid()
      );
    END IF;

    IF OLD.responsavel_id IS DISTINCT FROM NEW.responsavel_id THEN
      INSERT INTO historico_patrimonio (
        bem_id, tipo_evento, unidade_local_id, responsavel_id,
        dados_anteriores, dados_novos, justificativa, usuario_id
      ) VALUES (
        NEW.id, 'troca_responsavel', NEW.unidade_local_id, NEW.responsavel_id,
        jsonb_build_object('responsavel_id', OLD.responsavel_id),
        jsonb_build_object('responsavel_id', NEW.responsavel_id),
        'Troca de responsável', auth.uid()
      );
    END IF;

    IF OLD.situacao IS DISTINCT FROM NEW.situacao
       OR OLD.numero_patrimonio IS DISTINCT FROM NEW.numero_patrimonio THEN
      INSERT INTO historico_patrimonio (
        bem_id, tipo_evento, unidade_local_id, responsavel_id,
        dados_anteriores, dados_novos, usuario_id
      ) VALUES (
        NEW.id, 'atualizacao_dados', NEW.unidade_local_id, NEW.responsavel_id,
        jsonb_build_object('situacao', OLD.situacao, 'numero_patrimonio', OLD.numero_patrimonio),
        jsonb_build_object('situacao', NEW.situacao, 'numero_patrimonio', NEW.numero_patrimonio),
        auth.uid()
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. Manutenção concluída devolve o bem para "ativo"
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.registrar_historico_manutencao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF EXISTS (SELECT 1 FROM bens_patrimoniais
                WHERE id = NEW.bem_id AND situacao IN ('baixado', 'extraviado')) THEN
      RAISE EXCEPTION 'Bem baixado ou extraviado não entra em manutenção' USING ERRCODE = '22023';
    END IF;
    INSERT INTO historico_patrimonio (bem_id, tipo_evento, manutencao_id, justificativa, usuario_id)
    VALUES (NEW.bem_id, 'manutencao_inicio', NEW.id, NEW.descricao_problema, auth.uid());

    UPDATE bens_patrimoniais SET situacao = 'em_manutencao', updated_at = now() WHERE id = NEW.bem_id;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status IN ('concluida', 'cancelada')
     AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO historico_patrimonio (bem_id, tipo_evento, manutencao_id, justificativa, usuario_id, dados_novos)
    VALUES (NEW.bem_id, 'manutencao_fim', NEW.id, NEW.observacoes, auth.uid(),
            jsonb_build_object('status', NEW.status, 'custo_final', NEW.custo_final,
                               'data_conclusao', NEW.data_conclusao));

    UPDATE bens_patrimoniais SET situacao = 'ativo', updated_at = now()
     WHERE id = NEW.bem_id AND situacao = 'em_manutencao';
  END IF;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. Baixa: histórico na abertura e decisão por RPC
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.registrar_historico_baixa()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO historico_patrimonio (bem_id, tipo_evento, justificativa, dados_novos, usuario_id)
  VALUES (NEW.bem_id, 'baixa_solicitada', NEW.justificativa,
          jsonb_build_object('baixa_id', NEW.id, 'motivo', NEW.motivo), auth.uid());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_historico_baixa ON public.baixas_patrimonio;
CREATE TRIGGER tr_historico_baixa AFTER INSERT ON public.baixas_patrimonio
  FOR EACH ROW EXECUTE FUNCTION public.registrar_historico_baixa();

CREATE OR REPLACE FUNCTION public.patrimonio_decidir_baixa(
  p_baixa_id uuid, p_aprovar boolean, p_motivo_rejeicao text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_baixa baixas_patrimonio%ROWTYPE;
BEGIN
  IF NOT (public.has_permission_code(auth.uid(), 'patrimonio.tramitar')
          OR public.is_admin_user(auth.uid())) THEN
    RAISE EXCEPTION 'Sem permissão para decidir baixas de patrimônio' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_baixa FROM baixas_patrimonio WHERE id = p_baixa_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Baixa não encontrada' USING ERRCODE = 'P0002';
  END IF;
  IF v_baixa.status NOT IN ('solicitada', 'em_analise') THEN
    RAISE EXCEPTION 'Esta baixa já foi decidida (%)', v_baixa.status USING ERRCODE = '22023';
  END IF;

  IF p_aprovar THEN
    UPDATE baixas_patrimonio
       SET status = 'aprovada', aprovado_por = auth.uid(), data_aprovacao = now(),
           dados_bem_snapshot = COALESCE(dados_bem_snapshot,
             (SELECT to_jsonb(b) FROM bens_patrimoniais b WHERE b.id = v_baixa.bem_id))
     WHERE id = p_baixa_id;

    PERFORM set_config('patrimonio.evento_registrado', 'on', true);
    UPDATE bens_patrimoniais SET situacao = 'baixado', updated_at = now() WHERE id = v_baixa.bem_id;
    PERFORM set_config('patrimonio.evento_registrado', 'off', true);
  ELSE
    IF btrim(COALESCE(p_motivo_rejeicao, '')) = '' THEN
      RAISE EXCEPTION 'Informe o motivo da rejeição' USING ERRCODE = '22023';
    END IF;
    UPDATE baixas_patrimonio
       SET status = 'rejeitada', aprovado_por = auth.uid(), data_aprovacao = now(),
           motivo_rejeicao = btrim(p_motivo_rejeicao)
     WHERE id = p_baixa_id;
  END IF;

  INSERT INTO historico_patrimonio (bem_id, tipo_evento, justificativa, dados_novos, usuario_id)
  VALUES (v_baixa.bem_id,
          CASE WHEN p_aprovar THEN 'baixa_aprovada' ELSE 'baixa_rejeitada' END,
          CASE WHEN p_aprovar THEN v_baixa.justificativa ELSE btrim(p_motivo_rejeicao) END,
          jsonb_build_object('baixa_id', p_baixa_id, 'motivo', v_baixa.motivo),
          auth.uid());
END;
$$;
REVOKE EXECUTE ON FUNCTION public.patrimonio_decidir_baixa(uuid, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.patrimonio_decidir_baixa(uuid, boolean, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. Movimentação: decisão por RPC (o trigger do item 1 aplica o efeito no bem)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.patrimonio_decidir_movimentacao(
  p_movimentacao_id uuid, p_aprovar boolean, p_motivo_rejeicao text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_status status_movimentacao_patrimonio;
BEGIN
  IF NOT (public.has_permission_code(auth.uid(), 'patrimonio.tramitar')
          OR public.is_admin_user(auth.uid())) THEN
    RAISE EXCEPTION 'Sem permissão para decidir movimentações de patrimônio' USING ERRCODE = '42501';
  END IF;

  SELECT status INTO v_status FROM movimentacoes_patrimonio WHERE id = p_movimentacao_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Movimentação não encontrada' USING ERRCODE = 'P0002';
  END IF;
  IF v_status IS DISTINCT FROM 'pendente' THEN
    RAISE EXCEPTION 'Esta movimentação já foi decidida (%)', v_status USING ERRCODE = '22023';
  END IF;

  IF p_aprovar THEN
    UPDATE movimentacoes_patrimonio
       SET status = 'aprovado', aprovado_por = auth.uid(), data_aprovacao = now()
     WHERE id = p_movimentacao_id;
  ELSE
    IF btrim(COALESCE(p_motivo_rejeicao, '')) = '' THEN
      RAISE EXCEPTION 'Informe o motivo da rejeição' USING ERRCODE = '22023';
    END IF;
    UPDATE movimentacoes_patrimonio
       SET status = 'rejeitado', aprovado_por = auth.uid(), data_aprovacao = now(),
           motivo_rejeicao = btrim(p_motivo_rejeicao)
     WHERE id = p_movimentacao_id;
  END IF;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.patrimonio_decidir_movimentacao(uuid, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.patrimonio_decidir_movimentacao(uuid, boolean, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4b. Decisão só por quem pode decidir
-- ---------------------------------------------------------------------------
-- A RLS dessas tabelas é por módulo (patrimonio OU patrimonio_mobile). Sem esta guarda, quem só
-- coleta no celular gravaria status 'aprovado' direto pela API e o trigger do item 1 moveria o bem,
-- com aprovado_por forjado. Quem tem patrimonio.tramitar (as RPCs acima) ou é admin passa.
CREATE OR REPLACE FUNCTION public.fn_guardar_decisao_patrimonio()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_iniciais text[] := CASE TG_TABLE_NAME
                         WHEN 'baixas_patrimonio' THEN ARRAY['solicitada', 'em_analise']
                         ELSE ARRAY['pendente'] END;
BEGIN
  IF auth.uid() IS NULL
     OR public.has_permission_code(auth.uid(), 'patrimonio.tramitar')
     OR public.is_admin_user(auth.uid()) THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF COALESCE(NEW.status::text, v_iniciais[1]) <> ALL (v_iniciais)
       OR NEW.aprovado_por IS NOT NULL OR NEW.data_aprovacao IS NOT NULL THEN
      RAISE EXCEPTION 'Pedido de patrimônio nasce pendente; a decisão exige patrimonio.tramitar'
        USING ERRCODE = '42501';
    END IF;
  ELSIF NEW.status::text IS DISTINCT FROM OLD.status::text
          AND NOT (OLD.status::text = ANY (v_iniciais) AND NEW.status::text = ANY (v_iniciais))
        OR NEW.aprovado_por IS DISTINCT FROM OLD.aprovado_por
        OR NEW.data_aprovacao IS DISTINCT FROM OLD.data_aprovacao
        OR NEW.motivo_rejeicao IS DISTINCT FROM OLD.motivo_rejeicao THEN
    RAISE EXCEPTION 'Aprovar ou rejeitar exige a permissão patrimonio.tramitar'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

-- Quem pede fica registrado mesmo que a tela não mande (o desktop não mandava).
ALTER TABLE public.movimentacoes_patrimonio ALTER COLUMN solicitado_por SET DEFAULT auth.uid();

DROP TRIGGER IF EXISTS trg_guardar_decisao ON public.movimentacoes_patrimonio;
CREATE TRIGGER trg_guardar_decisao BEFORE INSERT OR UPDATE ON public.movimentacoes_patrimonio
  FOR EACH ROW EXECUTE FUNCTION public.fn_guardar_decisao_patrimonio();
DROP TRIGGER IF EXISTS trg_guardar_decisao ON public.baixas_patrimonio;
CREATE TRIGGER trg_guardar_decisao BEFORE INSERT OR UPDATE ON public.baixas_patrimonio
  FOR EACH ROW EXECUTE FUNCTION public.fn_guardar_decisao_patrimonio();

-- ---------------------------------------------------------------------------
-- 5. Campanha pode ser pausada
-- ---------------------------------------------------------------------------
ALTER TABLE public.campanhas_inventario DROP CONSTRAINT IF EXISTS campanhas_inventario_status_check;
ALTER TABLE public.campanhas_inventario ADD CONSTRAINT campanhas_inventario_status_check
  CHECK (status = ANY (ARRAY['planejada'::text, 'em_andamento'::text, 'pausada'::text,
                             'concluida'::text, 'cancelada'::text]));

-- ---------------------------------------------------------------------------
-- 6. Coleta: bem sem etiqueta e unidade encontrada = unidade local
-- ---------------------------------------------------------------------------
ALTER TYPE public.status_coleta_inventario ADD VALUE IF NOT EXISTS 'sem_etiqueta';

ALTER TABLE public.coletas_inventario
  DROP CONSTRAINT IF EXISTS coletas_inventario_localizacao_encontrada_unidade_id_fkey;
ALTER TABLE public.coletas_inventario
  ADD CONSTRAINT coletas_inventario_localizacao_encontrada_unidade_id_fkey
  FOREIGN KEY (localizacao_encontrada_unidade_id) REFERENCES public.unidades_locais(id) NOT VALID;

-- ---------------------------------------------------------------------------
-- 7. Gerador único do número de tombamento
-- ---------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.seq_tombamento_patrimonio;

CREATE OR REPLACE FUNCTION public.fn_proximo_numero_tombamento()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_numero text;
BEGIN
  -- Só quem tem o módulo consome a sequence (evita lacunas abertas por outros usuários).
  IF auth.uid() IS NOT NULL
     AND NOT (public.can_access_module(auth.uid(), 'patrimonio')
              OR public.can_access_module(auth.uid(), 'patrimonio_mobile')) THEN
    RAISE EXCEPTION 'Sem acesso ao módulo de patrimônio' USING ERRCODE = '42501';
  END IF;
  -- Sequence: sem corrida e sem reaproveitamento. O laço só pula um número que alguém
  -- já tenha digitado à mão no mesmo formato.
  LOOP
    v_numero := 'PAT-' || to_char(CURRENT_DATE, 'YYYY') || '-'
             || lpad(nextval('public.seq_tombamento_patrimonio')::text, 6, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM bens_patrimoniais WHERE upper(btrim(numero_patrimonio)) = v_numero);
  END LOOP;
  RETURN v_numero;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.fn_proximo_numero_tombamento() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_proximo_numero_tombamento() TO authenticated;

-- Mantida por compatibilidade (o parâmetro não é mais usado), mas sem EXECUTE para o app:
-- o número nasce no INSERT do bem.
CREATE OR REPLACE FUNCTION public.gerar_numero_tombamento(p_unidade_local_id uuid)
RETURNS text
LANGUAGE sql
SET search_path TO 'public'
AS $$ SELECT public.fn_proximo_numero_tombamento() $$;
REVOKE EXECUTE ON FUNCTION public.gerar_numero_tombamento(uuid) FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 8. Normalização e imutabilidade
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_gerar_numero_tombamento()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.numero_patrimonio   := NULLIF(upper(btrim(NEW.numero_patrimonio)), '');
  NEW.patrimonio_anterior := NULLIF(upper(btrim(NEW.patrimonio_anterior)), '');
  NEW.codigo_qr           := NULLIF(upper(btrim(NEW.codigo_qr)), '');

  IF TG_OP = 'INSERT' THEN
    IF NEW.numero_patrimonio IS NULL THEN
      NEW.numero_patrimonio := public.fn_proximo_numero_tombamento();
    END IF;
    NEW.codigo_qr := COALESCE(NEW.codigo_qr, NEW.numero_patrimonio);
    RETURN NEW;
  END IF;

  -- UPDATE
  -- Vazio ou igual ao atual (a menos de maiúsculas/espaços): mantém o valor gravado.
  IF NEW.numero_patrimonio IS NULL OR NEW.numero_patrimonio = upper(btrim(OLD.numero_patrimonio)) THEN
    NEW.numero_patrimonio := OLD.numero_patrimonio;
  END IF;
  IF NEW.numero_patrimonio IS DISTINCT FROM OLD.numero_patrimonio THEN
    -- auth.uid() nulo = manutenção feita no servidor (service role / SQL), não pela API do app.
    IF auth.uid() IS NOT NULL AND NOT public.is_admin_user(auth.uid()) THEN
      RAISE EXCEPTION 'O número de tombamento não pode ser alterado depois de criado'
        USING ERRCODE = '42501';
    END IF;
    NEW.patrimonio_anterior := COALESCE(NEW.patrimonio_anterior, OLD.numero_patrimonio);
    IF NEW.codigo_qr IS NOT DISTINCT FROM upper(btrim(OLD.codigo_qr)) THEN
      NEW.codigo_qr := NEW.numero_patrimonio;
    END IF;
  ELSIF NEW.codigo_qr IS NULL OR NEW.codigo_qr = upper(btrim(OLD.codigo_qr)) THEN
    NEW.codigo_qr := OLD.codigo_qr;
  ELSIF auth.uid() IS NOT NULL AND NOT public.is_admin_user(auth.uid()) THEN
    -- O QR é o que a plaqueta carrega: trocá-lo desvia a leitura para outro bem.
    RAISE EXCEPTION 'O código QR do bem não pode ser alterado' USING ERRCODE = '42501';
  END IF;
  NEW.codigo_qr := COALESCE(NEW.codigo_qr, NEW.numero_patrimonio);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_gerar_numero_tombamento ON public.bens_patrimoniais;
CREATE TRIGGER trg_gerar_numero_tombamento
  BEFORE INSERT OR UPDATE OF numero_patrimonio, codigo_qr, patrimonio_anterior
  ON public.bens_patrimoniais
  FOR EACH ROW EXECUTE FUNCTION public.fn_gerar_numero_tombamento();

-- ---------------------------------------------------------------------------
-- 9. Índices de busca e unicidade do número normalizado
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_bens_patrimoniais_codigo_qr_norm
  ON public.bens_patrimoniais (upper(btrim(codigo_qr)));
CREATE INDEX IF NOT EXISTS idx_bens_patrimoniais_patrimonio_anterior_norm
  ON public.bens_patrimoniais (upper(btrim(patrimonio_anterior)));

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.bens_patrimoniais
     GROUP BY upper(btrim(numero_patrimonio)) HAVING count(*) > 1
  ) THEN
    RAISE NOTICE 'bens_patrimoniais: há números que só diferem por maiúsculas/espaços; '
                 'índice único normalizado NÃO criado (corrigir os dados e criar depois).';
  ELSE
    CREATE UNIQUE INDEX IF NOT EXISTS uq_bens_patrimoniais_numero_norm
      ON public.bens_patrimoniais (upper(btrim(numero_patrimonio)));
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- 10. Busca de bem por código (número, QR ou número anterior), no servidor
-- ---------------------------------------------------------------------------
-- SECURITY INVOKER: a RLS de bens_patrimoniais decide o que quem chama pode ver.
CREATE OR REPLACE FUNCTION public.patrimonio_buscar_bem_por_codigo(p_codigo text)
RETURNS SETOF public.bens_patrimoniais
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  WITH c AS (SELECT NULLIF(upper(btrim(p_codigo)), '') AS v)
  SELECT b.*
    FROM bens_patrimoniais b, c
   WHERE c.v IS NOT NULL
     AND (upper(btrim(b.numero_patrimonio)) = c.v
          OR upper(btrim(b.codigo_qr)) = c.v
          OR upper(btrim(b.patrimonio_anterior)) = c.v)
   ORDER BY (upper(btrim(b.numero_patrimonio)) = c.v) DESC,
            (upper(btrim(b.codigo_qr)) = c.v) DESC,
            b.created_at
   LIMIT 5
$$;
REVOKE EXECUTE ON FUNCTION public.patrimonio_buscar_bem_por_codigo(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.patrimonio_buscar_bem_por_codigo(text) TO authenticated;
