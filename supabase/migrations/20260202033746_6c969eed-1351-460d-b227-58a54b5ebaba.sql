
-- ==============================================
-- FINALIZAÇÃO DO SISTEMA IDJUV - PRODUÇÃO
-- Patches de Segurança e Hardening
-- ==============================================

-- 1. POLICIES FALTANTES PARA TABELAS SEM POLICY
-- ==============================================

-- 1.1 debitos_tecnicos (tabela interna de controle)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'debitos_tecnicos' AND policyname = 'debitos_tecnicos_admin_all') THEN
    CREATE POLICY debitos_tecnicos_admin_all ON public.debitos_tecnicos
    FOR ALL USING (public.usuario_eh_admin(auth.uid()));
  END IF;
END $$;

-- 1.2 historico_lai (histórico de LAI - leitura para quem tem permissão)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'historico_lai' AND policyname = 'historico_lai_select') THEN
    CREATE POLICY historico_lai_select ON public.historico_lai
    FOR SELECT USING (
      public.usuario_tem_permissao(auth.uid(), 'transparencia.lai.visualizar')
      OR public.usuario_eh_admin(auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'historico_lai' AND policyname = 'historico_lai_insert') THEN
    CREATE POLICY historico_lai_insert ON public.historico_lai
    FOR INSERT WITH CHECK (
      public.usuario_tem_permissao(auth.uid(), 'transparencia.lai.responder')
      OR public.usuario_eh_admin(auth.uid())
    );
  END IF;
END $$;

-- 1.3 prazos_lai (configuração de prazos LAI)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prazos_lai' AND policyname = 'prazos_lai_select') THEN
    CREATE POLICY prazos_lai_select ON public.prazos_lai
    FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prazos_lai' AND policyname = 'prazos_lai_manage') THEN
    CREATE POLICY prazos_lai_manage ON public.prazos_lai
    FOR ALL USING (public.usuario_eh_admin(auth.uid()));
  END IF;
END $$;

-- 1.4 recursos_lai (recursos de LAI)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'recursos_lai' AND policyname = 'recursos_lai_select') THEN
    CREATE POLICY recursos_lai_select ON public.recursos_lai
    FOR SELECT USING (
      public.usuario_tem_permissao(auth.uid(), 'transparencia.lai.visualizar')
      OR public.usuario_eh_admin(auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'recursos_lai' AND policyname = 'recursos_lai_insert') THEN
    CREATE POLICY recursos_lai_insert ON public.recursos_lai
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'recursos_lai' AND policyname = 'recursos_lai_update') THEN
    CREATE POLICY recursos_lai_update ON public.recursos_lai
    FOR UPDATE USING (
      public.usuario_tem_permissao(auth.uid(), 'transparencia.lai.responder')
      OR public.usuario_eh_admin(auth.uid())
    );
  END IF;
END $$;

-- 2. RECRIAR VIEWS COM SECURITY INVOKER
-- ==============================================

-- 2.1 v_processos_resumo (view principal do workflow)
DROP VIEW IF EXISTS public.v_processos_resumo;
CREATE VIEW public.v_processos_resumo 
WITH (security_invoker = true)
AS
SELECT 
  p.id,
  p.numero_processo || '/' || p.ano AS numero_formatado,
  p.tipo_processo::TEXT,
  p.assunto,
  p.interessado_nome,
  p.status::TEXT,
  p.sigilo::TEXT,
  p.data_abertura,
  p.data_encerramento,
  uo.nome AS unidade_origem,
  (SELECT COUNT(*) FROM movimentacoes_processo m WHERE m.processo_id = p.id) AS total_movimentacoes,
  (SELECT COUNT(*) FROM despachos d WHERE d.processo_id = p.id) AS total_despachos,
  (SELECT COUNT(*) FROM documentos_processo doc WHERE doc.processo_id = p.id) AS total_documentos,
  (SELECT COUNT(*) FROM prazos_processo pr WHERE pr.processo_id = p.id AND NOT pr.cumprido AND pr.data_limite < CURRENT_DATE) AS prazos_vencidos,
  (SELECT MAX(m.created_at) FROM movimentacoes_processo m WHERE m.processo_id = p.id) AS ultima_movimentacao,
  p.created_at,
  p.created_by
FROM processos_administrativos p
LEFT JOIN estrutura_organizacional uo ON uo.id = p.unidade_origem_id;

-- 2.2 v_cedencias_a_vencer
DROP VIEW IF EXISTS public.v_cedencias_a_vencer;
CREATE VIEW public.v_cedencias_a_vencer
WITH (security_invoker = true)
AS
SELECT 
  a.id AS agenda_id,
  a.numero_protocolo,
  a.titulo,
  a.solicitante_nome,
  a.data_inicio,
  a.data_fim,
  a.status,
  u.id AS unidade_id,
  u.nome_unidade,
  u.municipio,
  EXTRACT(DAY FROM (a.data_fim::timestamp - CURRENT_TIMESTAMP))::INTEGER AS dias_para_vencer
FROM agenda_unidade a
JOIN unidades_locais u ON u.id = a.unidade_local_id
WHERE a.status = 'aprovado'
  AND a.data_fim > CURRENT_TIMESTAMP
  AND EXTRACT(DAY FROM (a.data_fim::timestamp - CURRENT_TIMESTAMP)) <= 30
ORDER BY a.data_fim;

-- 2.3 v_relatorio_patrimonio
DROP VIEW IF EXISTS public.v_relatorio_patrimonio;
CREATE VIEW public.v_relatorio_patrimonio
WITH (security_invoker = true)
AS
SELECT 
  pu.id,
  pu.numero_tombo,
  pu.item,
  pu.categoria,
  pu.descricao,
  pu.quantidade,
  pu.estado_conservacao,
  pu.situacao,
  pu.valor_estimado,
  pu.data_aquisicao,
  pu.observacoes,
  pu.anexos,
  pu.created_at,
  pu.updated_at,
  ul.id AS unidade_id,
  ul.codigo_unidade,
  ul.nome_unidade,
  ul.tipo_unidade,
  ul.municipio,
  ul.status AS unidade_status,
  pu.valor_estimado * COALESCE(pu.quantidade, 1) AS valor_total
FROM patrimonio_unidade pu
JOIN unidades_locais ul ON ul.id = pu.unidade_local_id;

-- 3. FUNÇÕES UTILITÁRIAS FALTANTES
-- ==============================================

-- 3.1 Função para verificar se processo pode ser arquivado
CREATE OR REPLACE FUNCTION public.fn_pode_arquivar_processo(p_processo_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM despachos
    WHERE processo_id = p_processo_id
      AND tipo_despacho = 'conclusivo'
      AND decisao = 'arquivar'
  );
END;
$$;

-- 3.2 Função para contar processos por status (dashboard)
CREATE OR REPLACE FUNCTION public.fn_contar_processos_por_status()
RETURNS TABLE(
  status TEXT,
  quantidade BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.status::TEXT,
    COUNT(*)::BIGINT
  FROM processos_administrativos p
  WHERE public.usuario_tem_permissao(auth.uid(), 'workflow.visualizar')
    OR public.usuario_eh_admin(auth.uid())
  GROUP BY p.status;
END;
$$;

-- 3.3 Função para obter próximo número de processo
CREATE OR REPLACE FUNCTION public.fn_proximo_numero_processo(p_ano INTEGER DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sequencial INTEGER;
BEGIN
  SELECT COALESCE(MAX(
    CASE WHEN numero_processo ~ '^\d+$' THEN numero_processo::INTEGER ELSE 0 END
  ), 0) + 1
  INTO v_sequencial
  FROM processos_administrativos
  WHERE ano = p_ano;
  
  RETURN LPAD(v_sequencial::TEXT, 4, '0');
END;
$$;

-- 3.4 Trigger para impedir arquivamento sem despacho conclusivo
CREATE OR REPLACE FUNCTION public.fn_validar_arquivamento_processo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'arquivado' AND OLD.status != 'arquivado' THEN
    IF NOT public.fn_pode_arquivar_processo(NEW.id) THEN
      RAISE EXCEPTION 'Processo não pode ser arquivado sem despacho conclusivo com decisão de arquivamento';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_validar_arquivamento ON public.processos_administrativos;
CREATE TRIGGER tr_validar_arquivamento
BEFORE UPDATE ON public.processos_administrativos
FOR EACH ROW
EXECUTE FUNCTION public.fn_validar_arquivamento_processo();

-- 3.5 Função para calcular SLA de processos
CREATE OR REPLACE FUNCTION public.fn_calcular_sla_processo(p_processo_id UUID)
RETURNS TABLE(
  dias_aberto INTEGER,
  dias_ultima_movimentacao INTEGER,
  status_sla TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_data_abertura DATE;
  v_ultima_mov TIMESTAMPTZ;
  v_dias_aberto INTEGER;
  v_dias_mov INTEGER;
BEGIN
  SELECT 
    p.data_abertura,
    (SELECT MAX(m.created_at) FROM movimentacoes_processo m WHERE m.processo_id = p.id)
  INTO v_data_abertura, v_ultima_mov
  FROM processos_administrativos p
  WHERE p.id = p_processo_id;
  
  v_dias_aberto := CURRENT_DATE - v_data_abertura;
  v_dias_mov := CASE WHEN v_ultima_mov IS NOT NULL 
    THEN (CURRENT_DATE - v_ultima_mov::DATE)
    ELSE v_dias_aberto
  END;
  
  RETURN QUERY SELECT 
    v_dias_aberto,
    v_dias_mov,
    CASE 
      WHEN v_dias_mov > 30 THEN 'critico'
      WHEN v_dias_mov > 15 THEN 'atencao'
      ELSE 'normal'
    END::TEXT;
END;
$$;

-- 4. CORRIGIR FUNÇÕES SEM search_path
-- ==============================================

CREATE OR REPLACE FUNCTION public.gerar_codigo_pre_cadastro()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  ano TEXT;
  sequencia INTEGER;
  codigo TEXT;
BEGIN
  ano := EXTRACT(YEAR FROM NOW())::TEXT;
  
  SELECT COALESCE(MAX(
    CASE 
      WHEN codigo_acesso LIKE 'PC-' || ano || '-%' 
      THEN NULLIF(SPLIT_PART(codigo_acesso, '-', 3), '')::INTEGER 
      ELSE 0 
    END
  ), 0) + 1
  INTO sequencia
  FROM public.pre_cadastros
  WHERE codigo_acesso LIKE 'PC-' || ano || '-%';
  
  codigo := 'PC-' || ano || '-' || LPAD(sequencia::TEXT, 4, '0');
  
  RETURN codigo;
END;
$$;

CREATE OR REPLACE FUNCTION public.gerar_link_frequencia()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  novo_link TEXT;
BEGIN
  novo_link := encode(gen_random_bytes(16), 'hex');
  RETURN novo_link;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.count_dependentes_irrf(p_servidor_id uuid, p_data date DEFAULT CURRENT_DATE)
RETURNS integer
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN COALESCE((
    SELECT COUNT(*)::INTEGER
    FROM dependentes_irrf
    WHERE servidor_id = p_servidor_id
      AND ativo = true
      AND deduz_irrf = true
      AND data_inicio_deducao <= p_data
      AND (data_fim_deducao IS NULL OR data_fim_deducao >= p_data)
  ), 0);
END;
$$;

-- 5. GARANTIR TRIGGERS DE AUDITORIA NO WORKFLOW
-- ==============================================

DROP TRIGGER IF EXISTS tr_audit_processos ON public.processos_administrativos;
CREATE TRIGGER tr_audit_processos
AFTER INSERT OR UPDATE OR DELETE ON public.processos_administrativos
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();

DROP TRIGGER IF EXISTS tr_audit_movimentacoes ON public.movimentacoes_processo;
CREATE TRIGGER tr_audit_movimentacoes
AFTER INSERT OR UPDATE OR DELETE ON public.movimentacoes_processo
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();

DROP TRIGGER IF EXISTS tr_audit_despachos ON public.despachos;
CREATE TRIGGER tr_audit_despachos
AFTER INSERT OR UPDATE OR DELETE ON public.despachos
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();

-- 6. TRIGGERS updated_at PARA WORKFLOW
-- ==============================================

DROP TRIGGER IF EXISTS tr_updated_at_processos ON public.processos_administrativos;
CREATE TRIGGER tr_updated_at_processos
BEFORE UPDATE ON public.processos_administrativos
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_updated_at_movimentacoes ON public.movimentacoes_processo;
CREATE TRIGGER tr_updated_at_movimentacoes
BEFORE UPDATE ON public.movimentacoes_processo
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_updated_at_despachos ON public.despachos;
CREATE TRIGGER tr_updated_at_despachos
BEFORE UPDATE ON public.despachos
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_updated_at_documentos_processo ON public.documentos_processo;
CREATE TRIGGER tr_updated_at_documentos_processo
BEFORE UPDATE ON public.documentos_processo
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_updated_at_prazos_processo ON public.prazos_processo;
CREATE TRIGGER tr_updated_at_prazos_processo
BEFORE UPDATE ON public.prazos_processo
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
