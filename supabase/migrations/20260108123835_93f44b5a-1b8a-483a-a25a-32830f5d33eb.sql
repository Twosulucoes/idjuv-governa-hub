-- =====================================================
-- SISTEMA DE CÓDIGOS AUTOMÁTICOS PARA ACERVOS
-- =====================================================

-- 1. Sequência para unidades locais por tipo
-- Formato: TIPO-ANO-SEQUENCIA (ex: GIN-2026-001 para ginásio)

-- Função para gerar código de unidade local
CREATE OR REPLACE FUNCTION public.gerar_codigo_unidade_local()
RETURNS TRIGGER AS $$
DECLARE
  v_prefixo TEXT;
  v_ano INTEGER;
  v_sequencia INTEGER;
  v_codigo TEXT;
BEGIN
  -- Definir prefixo baseado no tipo
  v_prefixo := CASE NEW.tipo_unidade
    WHEN 'ginasio' THEN 'GIN'
    WHEN 'estadio' THEN 'EST'
    WHEN 'parque_aquatico' THEN 'PAQ'
    WHEN 'piscina' THEN 'PIS'
    WHEN 'complexo' THEN 'CPX'
    WHEN 'quadra' THEN 'QUA'
    ELSE 'OUT'
  END;
  
  -- Ano atual
  v_ano := EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Buscar próxima sequência para o tipo/ano
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(codigo_unidade, '-', 3) AS INTEGER)
  ), 0) + 1
  INTO v_sequencia
  FROM public.unidades_locais
  WHERE tipo_unidade = NEW.tipo_unidade
    AND codigo_unidade LIKE v_prefixo || '-' || v_ano || '-%';
  
  -- Montar código final
  v_codigo := v_prefixo || '-' || v_ano || '-' || LPAD(v_sequencia::TEXT, 3, '0');
  
  NEW.codigo_unidade := v_codigo;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger para unidades locais
DROP TRIGGER IF EXISTS tr_gerar_codigo_unidade_local ON public.unidades_locais;
CREATE TRIGGER tr_gerar_codigo_unidade_local
  BEFORE INSERT ON public.unidades_locais
  FOR EACH ROW
  WHEN (NEW.codigo_unidade IS NULL OR NEW.codigo_unidade = '')
  EXECUTE FUNCTION public.gerar_codigo_unidade_local();

-- =====================================================
-- 2. Sistema de tombamento para patrimônio
-- Formato: PAT-TIPO_UNIDADE-ANO-SEQUENCIA (ex: PAT-GIN-2026-00001)

CREATE OR REPLACE FUNCTION public.gerar_numero_tombo_patrimonio()
RETURNS TRIGGER AS $$
DECLARE
  v_tipo_unidade TEXT;
  v_prefixo_unidade TEXT;
  v_ano INTEGER;
  v_sequencia INTEGER;
  v_tombo TEXT;
BEGIN
  -- Buscar tipo da unidade
  SELECT tipo_unidade INTO v_tipo_unidade
  FROM public.unidades_locais
  WHERE id = NEW.unidade_local_id;
  
  -- Definir prefixo baseado no tipo da unidade
  v_prefixo_unidade := CASE v_tipo_unidade
    WHEN 'ginasio' THEN 'GIN'
    WHEN 'estadio' THEN 'EST'
    WHEN 'parque_aquatico' THEN 'PAQ'
    WHEN 'piscina' THEN 'PIS'
    WHEN 'complexo' THEN 'CPX'
    WHEN 'quadra' THEN 'QUA'
    ELSE 'OUT'
  END;
  
  -- Ano atual
  v_ano := EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Buscar próxima sequência global do ano
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(numero_tombo, '-', 4) AS INTEGER)
  ), 0) + 1
  INTO v_sequencia
  FROM public.patrimonio_unidade
  WHERE numero_tombo LIKE 'PAT-%-' || v_ano || '-%';
  
  -- Montar número de tombo
  v_tombo := 'PAT-' || v_prefixo_unidade || '-' || v_ano || '-' || LPAD(v_sequencia::TEXT, 5, '0');
  
  NEW.numero_tombo := v_tombo;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger para patrimônio
DROP TRIGGER IF EXISTS tr_gerar_numero_tombo_patrimonio ON public.patrimonio_unidade;
CREATE TRIGGER tr_gerar_numero_tombo_patrimonio
  BEFORE INSERT ON public.patrimonio_unidade
  FOR EACH ROW
  WHEN (NEW.numero_tombo IS NULL OR NEW.numero_tombo = '')
  EXECUTE FUNCTION public.gerar_numero_tombo_patrimonio();

-- =====================================================
-- 3. Atualizar unidades existentes sem código
-- =====================================================

-- Função para atualizar códigos em massa
CREATE OR REPLACE FUNCTION public.atualizar_codigos_unidades_locais()
RETURNS void AS $$
DECLARE
  r RECORD;
  v_prefixo TEXT;
  v_ano INTEGER;
  v_sequencia INTEGER;
  v_codigo TEXT;
BEGIN
  v_ano := EXTRACT(YEAR FROM CURRENT_DATE);
  
  FOR r IN (
    SELECT id, tipo_unidade, created_at
    FROM public.unidades_locais
    WHERE codigo_unidade IS NULL OR codigo_unidade = ''
    ORDER BY created_at ASC
  ) LOOP
    v_prefixo := CASE r.tipo_unidade
      WHEN 'ginasio' THEN 'GIN'
      WHEN 'estadio' THEN 'EST'
      WHEN 'parque_aquatico' THEN 'PAQ'
      WHEN 'piscina' THEN 'PIS'
      WHEN 'complexo' THEN 'CPX'
      WHEN 'quadra' THEN 'QUA'
      ELSE 'OUT'
    END;
    
    SELECT COALESCE(MAX(
      CAST(SPLIT_PART(codigo_unidade, '-', 3) AS INTEGER)
    ), 0) + 1
    INTO v_sequencia
    FROM public.unidades_locais
    WHERE codigo_unidade LIKE v_prefixo || '-' || v_ano || '-%';
    
    v_codigo := v_prefixo || '-' || v_ano || '-' || LPAD(v_sequencia::TEXT, 3, '0');
    
    UPDATE public.unidades_locais
    SET codigo_unidade = v_codigo
    WHERE id = r.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Executar atualização para unidades existentes
SELECT public.atualizar_codigos_unidades_locais();

-- =====================================================
-- 4. View completa para relatórios de unidades locais
-- =====================================================

CREATE OR REPLACE VIEW public.v_relatorio_unidades_locais AS
SELECT 
  ul.id,
  ul.codigo_unidade,
  ul.nome_unidade,
  ul.tipo_unidade,
  ul.municipio,
  ul.endereco_completo,
  ul.status,
  ul.natureza_uso,
  ul.diretoria_vinculada,
  ul.unidade_administrativa,
  ul.autoridade_autorizadora,
  ul.capacidade,
  ul.horario_funcionamento,
  ul.estrutura_disponivel,
  ul.areas_disponiveis,
  ul.regras_de_uso,
  ul.observacoes,
  ul.fotos,
  ul.documentos,
  ul.created_at,
  ul.updated_at,
  
  -- Chefe atual
  ncu.servidor_id AS chefe_atual_id,
  s.nome_completo AS chefe_atual_nome,
  ncu.cargo AS chefe_atual_cargo,
  ncu.ato_numero AS chefe_ato_numero,
  ncu.data_inicio AS chefe_data_inicio,
  
  -- Estatísticas de patrimônio
  COALESCE(pat.total_itens, 0) AS total_patrimonio,
  COALESCE(pat.valor_total, 0) AS patrimonio_valor_total,
  COALESCE(pat.itens_bom_estado, 0) AS patrimonio_bom_estado,
  COALESCE(pat.itens_manutencao, 0) AS patrimonio_manutencao,
  
  -- Estatísticas de agenda
  COALESCE(ag.total_agendamentos, 0) AS total_agendamentos,
  COALESCE(ag.agendamentos_aprovados, 0) AS agendamentos_aprovados,
  COALESCE(ag.agendamentos_pendentes, 0) AS agendamentos_pendentes,
  
  -- Termos de cessão
  COALESCE(tc.total_termos, 0) AS total_termos_cessao,
  COALESCE(tc.termos_vigentes, 0) AS termos_vigentes

FROM public.unidades_locais ul

-- Chefe atual
LEFT JOIN LATERAL (
  SELECT servidor_id, cargo, ato_numero, data_inicio
  FROM public.nomeacoes_chefe_unidade
  WHERE unidade_local_id = ul.id
    AND status = 'ativo'
  ORDER BY data_inicio DESC
  LIMIT 1
) ncu ON true

LEFT JOIN public.servidores s ON s.id = ncu.servidor_id

-- Estatísticas de patrimônio
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*) AS total_itens,
    COALESCE(SUM(valor_estimado * COALESCE(quantidade, 1)), 0) AS valor_total,
    COUNT(*) FILTER (WHERE estado_conservacao IN ('otimo', 'bom')) AS itens_bom_estado,
    COUNT(*) FILTER (WHERE situacao = 'em_manutencao') AS itens_manutencao
  FROM public.patrimonio_unidade
  WHERE unidade_local_id = ul.id
) pat ON true

-- Estatísticas de agenda
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*) AS total_agendamentos,
    COUNT(*) FILTER (WHERE status = 'aprovado') AS agendamentos_aprovados,
    COUNT(*) FILTER (WHERE status = 'solicitado') AS agendamentos_pendentes
  FROM public.agenda_unidade
  WHERE unidade_local_id = ul.id
) ag ON true

-- Termos de cessão
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*) AS total_termos,
    COUNT(*) FILTER (WHERE status = 'assinado' AND periodo_fim >= CURRENT_DATE) AS termos_vigentes
  FROM public.termos_cessao
  WHERE unidade_local_id = ul.id
) tc ON true;

-- =====================================================
-- 5. View de patrimônio com detalhes
-- =====================================================

CREATE OR REPLACE VIEW public.v_relatorio_patrimonio AS
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
  
  -- Dados da unidade
  ul.id AS unidade_id,
  ul.codigo_unidade,
  ul.nome_unidade,
  ul.tipo_unidade,
  ul.municipio,
  ul.status AS unidade_status,
  
  -- Valor total do item
  (pu.valor_estimado * COALESCE(pu.quantidade, 1)) AS valor_total

FROM public.patrimonio_unidade pu
INNER JOIN public.unidades_locais ul ON ul.id = pu.unidade_local_id;