-- Dropar funções existentes para recriar com parâmetros corretos
DROP FUNCTION IF EXISTS count_dependentes_irrf(UUID, DATE);
DROP FUNCTION IF EXISTS get_parametro_vigente(TEXT, DATE);
DROP FUNCTION IF EXISTS processar_folha_pagamento(UUID);

-- Função auxiliar para contar dependentes de IRRF
CREATE OR REPLACE FUNCTION count_dependentes_irrf(p_servidor_id UUID, p_data DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER AS $$
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
$$ LANGUAGE plpgsql STABLE;

-- Função auxiliar para obter parâmetro vigente
CREATE OR REPLACE FUNCTION get_parametro_vigente(p_tipo TEXT, p_data DATE DEFAULT CURRENT_DATE)
RETURNS NUMERIC AS $$
BEGIN
  RETURN COALESCE((
    SELECT valor
    FROM parametros_folha
    WHERE tipo_parametro = p_tipo
      AND ativo = true
      AND vigencia_inicio <= p_data
      AND (vigencia_fim IS NULL OR vigencia_fim >= p_data)
    ORDER BY vigencia_inicio DESC
    LIMIT 1
  ), 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- Recriar a função processar_folha_pagamento com os nomes corretos
CREATE OR REPLACE FUNCTION processar_folha_pagamento(p_folha_id UUID)
RETURNS JSON AS $$
DECLARE
  v_folha RECORD;
  v_servidor RECORD;
  v_count INTEGER := 0;
  v_errors JSON[] := ARRAY[]::JSON[];
  v_base_inss NUMERIC;
  v_valor_inss NUMERIC;
  v_base_irrf NUMERIC;
  v_valor_irrf NUMERIC;
  v_qtd_dependentes INTEGER;
  v_deducao_dependentes NUMERIC;
  v_total_descontos NUMERIC;
  v_valor_liquido NUMERIC;
  v_vencimento NUMERIC;
  v_data_referencia DATE;
BEGIN
  -- Buscar folha
  SELECT * INTO v_folha FROM folhas_pagamento WHERE id = p_folha_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Folha não encontrada');
  END IF;
  
  -- Verificar status - permitir previa, aberta, reaberta ou processando
  IF v_folha.status NOT IN ('aberta', 'processando', 'reaberta', 'previa') THEN
    RETURN json_build_object('success', false, 'error', 'Folha não está em status que permita processamento. Status atual: ' || v_folha.status);
  END IF;
  
  -- Data de referência para cálculos (último dia do mês da competência)
  v_data_referencia := (make_date(v_folha.competencia_ano, v_folha.competencia_mes, 1) + interval '1 month - 1 day')::date;
  
  -- Atualizar status para processando
  UPDATE folhas_pagamento SET status = 'processando', updated_at = now() WHERE id = p_folha_id;
  
  -- Limpar fichas existentes desta folha (para reprocessamento)
  DELETE FROM fichas_financeiras WHERE folha_id = p_folha_id;
  
  -- Buscar servidores ativos com provimento ativo
  FOR v_servidor IN
    SELECT 
      s.id,
      s.nome_completo,
      s.cpf,
      s.matricula,
      s.pis_pasep,
      s.banco_codigo,
      s.banco_nome,
      s.banco_agencia,
      s.banco_conta,
      s.banco_tipo_conta,
      p.cargo_id,
      c.nome AS cargo_nome,
      COALESCE(c.vencimento_base, 0) AS vencimento_base
    FROM servidores s
    INNER JOIN provimentos p ON p.servidor_id = s.id AND p.ativo = true
    INNER JOIN cargos c ON c.id = p.cargo_id
    WHERE s.situacao_funcional = 'ativo'
      AND s.ativo = true
  LOOP
    BEGIN
      -- Vencimento base do cargo
      v_vencimento := COALESCE(v_servidor.vencimento_base, 0);
      
      -- Se não tem vencimento, registrar erro e pular
      IF v_vencimento <= 0 THEN
        v_errors := array_append(v_errors, json_build_object(
          'servidor_id', v_servidor.id,
          'nome', v_servidor.nome_completo,
          'erro', 'Cargo sem vencimento base definido'
        ));
        CONTINUE;
      END IF;
      
      -- Calcular INSS
      v_base_inss := v_vencimento;
      v_valor_inss := calcular_inss_servidor(v_base_inss, v_data_referencia);
      
      -- Contar dependentes e calcular dedução
      v_qtd_dependentes := count_dependentes_irrf(v_servidor.id, v_data_referencia);
      v_deducao_dependentes := v_qtd_dependentes * get_parametro_vigente('deducao_dependente_irrf', v_data_referencia);
      
      -- Calcular IRRF
      v_base_irrf := v_vencimento - v_valor_inss - v_deducao_dependentes;
      IF v_base_irrf < 0 THEN v_base_irrf := 0; END IF;
      v_valor_irrf := calcular_irrf(v_base_irrf, v_data_referencia);
      
      -- Total de descontos
      v_total_descontos := v_valor_inss + v_valor_irrf;
      
      -- Valor líquido
      v_valor_liquido := v_vencimento - v_total_descontos;
      
      -- Inserir ficha financeira
      INSERT INTO fichas_financeiras (
        folha_id,
        servidor_id,
        cargo_id,
        cargo_nome,
        cargo_vencimento,
        total_proventos,
        total_descontos,
        valor_liquido,
        base_inss,
        valor_inss,
        base_irrf,
        valor_irrf,
        quantidade_dependentes,
        valor_deducao_dependentes,
        banco_codigo,
        banco_nome,
        banco_agencia,
        banco_conta,
        banco_tipo_conta,
        processado,
        data_processamento,
        created_at
      ) VALUES (
        p_folha_id,
        v_servidor.id,
        v_servidor.cargo_id,
        v_servidor.cargo_nome,
        v_vencimento,
        v_vencimento,
        v_total_descontos,
        v_valor_liquido,
        v_base_inss,
        v_valor_inss,
        v_base_irrf,
        v_valor_irrf,
        v_qtd_dependentes,
        v_deducao_dependentes,
        v_servidor.banco_codigo,
        v_servidor.banco_nome,
        v_servidor.banco_agencia,
        v_servidor.banco_conta,
        v_servidor.banco_tipo_conta,
        true,
        now(),
        now()
      );
      
      v_count := v_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      v_errors := array_append(v_errors, json_build_object(
        'servidor_id', v_servidor.id,
        'nome', v_servidor.nome_completo,
        'erro', SQLERRM
      ));
    END;
  END LOOP;
  
  -- Atualizar totais da folha
  UPDATE folhas_pagamento SET
    status = 'processando',
    data_processamento = now(),
    quantidade_fichas = v_count,
    total_bruto = (SELECT COALESCE(SUM(total_proventos), 0) FROM fichas_financeiras WHERE folha_id = p_folha_id),
    total_descontos = (SELECT COALESCE(SUM(total_descontos), 0) FROM fichas_financeiras WHERE folha_id = p_folha_id),
    total_liquido = (SELECT COALESCE(SUM(valor_liquido), 0) FROM fichas_financeiras WHERE folha_id = p_folha_id),
    updated_at = now()
  WHERE id = p_folha_id;
  
  RETURN json_build_object(
    'success', true,
    'processados', v_count,
    'erros', v_errors
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;