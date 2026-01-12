
-- =====================================================
-- ETAPA 1: INFRAESTRUTURA - FOLHA DE PAGAMENTO IDJUV
-- PARTE D: Funções de Cálculo e Triggers
-- =====================================================

-- Função para calcular INSS progressivo
CREATE OR REPLACE FUNCTION calcular_inss_servidor(
  p_base_inss DECIMAL,
  p_vigencia DATE DEFAULT CURRENT_DATE
) RETURNS DECIMAL AS $$
DECLARE
  v_inss_total DECIMAL := 0;
  v_base_restante DECIMAL;
  v_teto_inss DECIMAL;
  v_faixa_anterior DECIMAL := 0;
  v_valor_faixa DECIMAL;
  r RECORD;
BEGIN
  SELECT valor INTO v_teto_inss
  FROM parametros_folha
  WHERE tipo_parametro = 'teto_inss'
    AND vigencia_inicio <= p_vigencia
    AND (vigencia_fim IS NULL OR vigencia_fim >= p_vigencia)
  ORDER BY vigencia_inicio DESC LIMIT 1;
  
  v_base_restante := CASE 
    WHEN v_teto_inss IS NOT NULL THEN LEAST(p_base_inss, v_teto_inss)
    ELSE p_base_inss
  END;
  
  IF v_base_restante <= 0 THEN
    RETURN 0;
  END IF;
  
  FOR r IN (
    SELECT * FROM tabela_inss
    WHERE vigencia_inicio <= p_vigencia
      AND (vigencia_fim IS NULL OR vigencia_fim >= p_vigencia)
    ORDER BY faixa_ordem
  ) LOOP
    IF v_base_restante > r.valor_minimo THEN
      IF r.valor_maximo IS NULL OR v_base_restante <= r.valor_maximo THEN
        v_valor_faixa := v_base_restante - GREATEST(r.valor_minimo, v_faixa_anterior);
      ELSE
        v_valor_faixa := r.valor_maximo - GREATEST(r.valor_minimo, v_faixa_anterior);
      END IF;
      
      IF v_valor_faixa > 0 THEN
        v_inss_total := v_inss_total + (v_valor_faixa * r.aliquota);
      END IF;
      
      v_faixa_anterior := COALESCE(r.valor_maximo, v_base_restante);
    END IF;
  END LOOP;
  
  RETURN ROUND(v_inss_total, 2);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Função para calcular IRRF
CREATE OR REPLACE FUNCTION calcular_irrf(
  p_base_irrf DECIMAL,
  p_vigencia DATE DEFAULT CURRENT_DATE
) RETURNS DECIMAL AS $$
DECLARE
  v_irrf DECIMAL := 0;
  r RECORD;
BEGIN
  IF p_base_irrf <= 0 THEN
    RETURN 0;
  END IF;
  
  SELECT * INTO r
  FROM tabela_irrf
  WHERE vigencia_inicio <= p_vigencia
    AND (vigencia_fim IS NULL OR vigencia_fim >= p_vigencia)
    AND p_base_irrf > valor_minimo
    AND (valor_maximo IS NULL OR p_base_irrf <= valor_maximo)
  ORDER BY faixa_ordem DESC LIMIT 1;
  
  IF FOUND THEN
    v_irrf := (p_base_irrf * r.aliquota) - r.parcela_deduzir;
  END IF;
  
  RETURN GREATEST(ROUND(v_irrf, 2), 0);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Função para buscar parâmetro vigente
CREATE OR REPLACE FUNCTION get_parametro_vigente(
  p_tipo VARCHAR,
  p_vigencia DATE DEFAULT CURRENT_DATE
) RETURNS DECIMAL AS $$
DECLARE
  v_valor DECIMAL;
BEGIN
  SELECT valor INTO v_valor
  FROM parametros_folha
  WHERE tipo_parametro = p_tipo
    AND vigencia_inicio <= p_vigencia
    AND (vigencia_fim IS NULL OR vigencia_fim >= p_vigencia)
    AND ativo = TRUE
  ORDER BY vigencia_inicio DESC LIMIT 1;
  
  RETURN v_valor;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Função para contar dependentes IRRF válidos
CREATE OR REPLACE FUNCTION count_dependentes_irrf(
  p_servidor_id UUID,
  p_data_referencia DATE DEFAULT CURRENT_DATE
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM dependentes_irrf
  WHERE servidor_id = p_servidor_id
    AND ativo = TRUE
    AND deduz_irrf = TRUE
    AND data_inicio_deducao <= p_data_referencia
    AND (data_fim_deducao IS NULL OR data_fim_deducao >= p_data_referencia);
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Triggers de updated_at para novas tabelas
DROP TRIGGER IF EXISTS update_config_autarquia_updated_at ON config_autarquia;
CREATE TRIGGER update_config_autarquia_updated_at
  BEFORE UPDATE ON config_autarquia
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_parametros_folha_updated_at ON parametros_folha;
CREATE TRIGGER update_parametros_folha_updated_at
  BEFORE UPDATE ON parametros_folha
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bancos_cnab_updated_at ON bancos_cnab;
CREATE TRIGGER update_bancos_cnab_updated_at
  BEFORE UPDATE ON bancos_cnab
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contas_autarquia_updated_at ON contas_autarquia;
CREATE TRIGGER update_contas_autarquia_updated_at
  BEFORE UPDATE ON contas_autarquia
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_centros_custo_updated_at ON centros_custo;
CREATE TRIGGER update_centros_custo_updated_at
  BEFORE UPDATE ON centros_custo
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rubricas_updated_at ON rubricas;
CREATE TRIGGER update_rubricas_updated_at
  BEFORE UPDATE ON rubricas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_folhas_pagamento_updated_at ON folhas_pagamento;
CREATE TRIGGER update_folhas_pagamento_updated_at
  BEFORE UPDATE ON folhas_pagamento
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fichas_financeiras_updated_at ON fichas_financeiras;
CREATE TRIGGER update_fichas_financeiras_updated_at
  BEFORE UPDATE ON fichas_financeiras
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_consignacoes_updated_at ON consignacoes;
CREATE TRIGGER update_consignacoes_updated_at
  BEFORE UPDATE ON consignacoes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pensoes_alimenticias_updated_at ON pensoes_alimenticias;
CREATE TRIGGER update_pensoes_alimenticias_updated_at
  BEFORE UPDATE ON pensoes_alimenticias
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_dependentes_irrf_updated_at ON dependentes_irrf;
CREATE TRIGGER update_dependentes_irrf_updated_at
  BEFORE UPDATE ON dependentes_irrf
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_eventos_esocial_updated_at ON eventos_esocial;
CREATE TRIGGER update_eventos_esocial_updated_at
  BEFORE UPDATE ON eventos_esocial
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
