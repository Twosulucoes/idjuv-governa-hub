
-- ============================================================
-- FASE 3B: Teto remuneratório e validação
-- ============================================================

-- Adicionar parâmetro de teto remuneratório
INSERT INTO parametros_folha (tipo_parametro, valor, vigencia_inicio, descricao, ativo)
VALUES ('teto_remuneratorio', 44008.52, '2025-01-01', 'Teto remuneratório constitucional (STF) 2025', true)
ON CONFLICT DO NOTHING;

-- Adicionar parâmetro de limite LRF (54% da RCL para pessoal - Executivo)
INSERT INTO parametros_folha (tipo_parametro, valor, vigencia_inicio, descricao, ativo)
VALUES ('limite_lrf_percentual', 0.54, '2025-01-01', 'Limite LRF - despesa pessoal Executivo (54% RCL)', true)
ON CONFLICT DO NOTHING;

-- Função para validar teto remuneratório
CREATE OR REPLACE FUNCTION public.fn_validar_teto_remuneratorio(
  p_remuneracao_bruta NUMERIC
)
RETURNS TABLE(
  dentro_teto BOOLEAN,
  valor_teto NUMERIC,
  valor_excedente NUMERIC,
  percentual_teto NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_teto NUMERIC;
BEGIN
  SELECT valor INTO v_teto
  FROM parametros_folha
  WHERE tipo_parametro = 'teto_remuneratorio'
    AND ativo = true
    AND vigencia_inicio <= CURRENT_DATE
    AND (vigencia_fim IS NULL OR vigencia_fim >= CURRENT_DATE)
  ORDER BY vigencia_inicio DESC
  LIMIT 1;

  IF v_teto IS NULL THEN
    v_teto := 44008.52; -- Fallback para teto STF 2025
  END IF;

  RETURN QUERY SELECT
    p_remuneracao_bruta <= v_teto,
    v_teto,
    GREATEST(0, p_remuneracao_bruta - v_teto),
    CASE WHEN v_teto > 0 THEN ROUND((p_remuneracao_bruta / v_teto) * 100, 2) ELSE 0 END;
END;
$$;

-- Função para calcular 13º salário proporcional
CREATE OR REPLACE FUNCTION public.fn_calcular_13_proporcional(
  p_servidor_id UUID,
  p_ano INTEGER,
  p_remuneracao_base NUMERIC
)
RETURNS TABLE(
  meses_trabalhados INTEGER,
  valor_proporcional NUMERIC,
  valor_integral NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_data_admissao DATE;
  v_meses INTEGER;
BEGIN
  SELECT data_admissao INTO v_data_admissao
  FROM servidores
  WHERE id = p_servidor_id;

  IF v_data_admissao IS NULL OR EXTRACT(YEAR FROM v_data_admissao) < p_ano THEN
    v_meses := 12;
  ELSIF EXTRACT(YEAR FROM v_data_admissao) = p_ano THEN
    v_meses := 12 - EXTRACT(MONTH FROM v_data_admissao)::INTEGER + 1;
    -- Só conta mês se trabalhou 15+ dias
    IF EXTRACT(DAY FROM v_data_admissao) > 15 THEN
      v_meses := v_meses - 1;
    END IF;
  ELSE
    v_meses := 0;
  END IF;

  v_meses := GREATEST(0, LEAST(12, v_meses));

  RETURN QUERY SELECT
    v_meses,
    ROUND(p_remuneracao_base * v_meses / 12, 2),
    p_remuneracao_base;
END;
$$;

-- Função para calcular férias (1/3 constitucional)
CREATE OR REPLACE FUNCTION public.fn_calcular_ferias(
  p_remuneracao_base NUMERIC,
  p_dias_ferias INTEGER DEFAULT 30
)
RETURNS TABLE(
  valor_ferias NUMERIC,
  terco_constitucional NUMERIC,
  valor_total NUMERIC,
  dias INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ferias NUMERIC;
  v_terco NUMERIC;
BEGIN
  v_ferias := ROUND(p_remuneracao_base * p_dias_ferias / 30, 2);
  v_terco := ROUND(v_ferias / 3, 2);

  RETURN QUERY SELECT
    v_ferias,
    v_terco,
    v_ferias + v_terco,
    p_dias_ferias;
END;
$$;
