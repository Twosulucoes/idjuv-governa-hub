-- Primeiro, remover a função antiga para poder alterar o tipo de retorno
DROP FUNCTION IF EXISTS public.processar_folha_pagamento(uuid);

-- Recriar função processar_folha_pagamento que copia dados bancários do servidor
CREATE OR REPLACE FUNCTION public.processar_folha_pagamento(p_folha_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_folha RECORD;
  v_servidor RECORD;
  v_count INTEGER := 0;
  v_errors JSONB := '[]'::jsonb;
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
  v_total_servidores_ativos INTEGER := 0;
  v_total_com_provimento INTEGER := 0;
  v_total_sem_vencimento INTEGER := 0;
BEGIN
  -- Buscar folha
  SELECT * INTO v_folha FROM folhas_pagamento WHERE id = p_folha_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('sucesso', false, 'erro', 'Folha não encontrada', 'servidores_processados', 0);
  END IF;
  
  -- Verificar status - permitir previa, aberta, reaberta ou processando
  IF v_folha.status NOT IN ('aberta', 'processando', 'reaberta', 'previa') THEN
    RETURN jsonb_build_object('sucesso', false, 'erro', 'Folha não está em status que permita processamento. Status atual: ' || v_folha.status, 'servidores_processados', 0);
  END IF;
  
  -- Data de referência para cálculos (último dia do mês da competência)
  v_data_referencia := (make_date(v_folha.competencia_ano, v_folha.competencia_mes, 1) + interval '1 month - 1 day')::date;
  
  -- Atualizar status para processando
  UPDATE folhas_pagamento SET status = 'processando', updated_at = now() WHERE id = p_folha_id;
  
  -- Limpar fichas existentes desta folha (para reprocessamento)
  DELETE FROM fichas_financeiras WHERE folha_id = p_folha_id;
  
  -- Contar total de servidores ativos
  SELECT COUNT(*) INTO v_total_servidores_ativos
  FROM servidores s
  WHERE s.situacao = 'ativo' AND s.ativo = true;
  
  -- Contar servidores com provimento ativo
  SELECT COUNT(DISTINCT s.id) INTO v_total_com_provimento
  FROM servidores s
  INNER JOIN provimentos p ON p.servidor_id = s.id AND p.status = 'ativo'
  WHERE s.situacao = 'ativo' AND s.ativo = true;
  
  -- Buscar servidores ativos com provimento ativo (incluindo dados bancários)
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
      p.unidade_id,
      c.nome AS cargo_nome,
      COALESCE(c.vencimento_base, 0) AS vencimento_base,
      eo.nome AS unidade_nome,
      eo.sigla AS unidade_sigla
    FROM servidores s
    INNER JOIN provimentos p ON p.servidor_id = s.id AND p.status = 'ativo'
    INNER JOIN cargos c ON c.id = p.cargo_id
    LEFT JOIN estrutura_organizacional eo ON eo.id = p.unidade_id
    WHERE s.situacao = 'ativo'
      AND s.ativo = true
  LOOP
    BEGIN
      -- Vencimento base do cargo
      v_vencimento := COALESCE(v_servidor.vencimento_base, 0);
      
      -- Se não tem vencimento, registrar erro e pular
      IF v_vencimento <= 0 THEN
        v_total_sem_vencimento := v_total_sem_vencimento + 1;
        v_errors := v_errors || jsonb_build_object(
          'servidor_id', v_servidor.id,
          'nome', v_servidor.nome_completo,
          'cargo', v_servidor.cargo_nome,
          'erro', 'Cargo sem vencimento base definido'
        );
        CONTINUE;
      END IF;
      
      -- Calcular INSS
      v_base_inss := v_vencimento;
      v_valor_inss := calcular_inss_servidor(v_base_inss, v_data_referencia);
      
      -- Contar dependentes e calcular dedução
      v_qtd_dependentes := count_dependentes_irrf(v_servidor.id, v_data_referencia);
      v_deducao_dependentes := v_qtd_dependentes * COALESCE(get_parametro_vigente('deducao_dependente_irrf', v_data_referencia), 189.59);
      
      -- Calcular IRRF
      v_base_irrf := v_vencimento - v_valor_inss - v_deducao_dependentes;
      IF v_base_irrf < 0 THEN v_base_irrf := 0; END IF;
      v_valor_irrf := calcular_irrf(v_base_irrf, v_data_referencia);
      
      -- Total de descontos
      v_total_descontos := v_valor_inss + v_valor_irrf;
      
      -- Valor líquido
      v_valor_liquido := v_vencimento - v_total_descontos;
      
      -- Inserir ficha financeira COM DADOS BANCÁRIOS
      INSERT INTO fichas_financeiras (
        folha_id,
        servidor_id,
        competencia_ano,
        competencia_mes,
        tipo_folha,
        cargo_id,
        cargo_nome,
        cargo_vencimento,
        unidade_id,
        unidade_nome,
        total_proventos,
        total_descontos,
        valor_liquido,
        base_inss,
        valor_inss,
        base_irrf,
        valor_irrf,
        quantidade_dependentes,
        valor_deducao_dependentes,
        -- DADOS BANCÁRIOS COPIADOS DO SERVIDOR
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
        v_folha.competencia_ano,
        v_folha.competencia_mes,
        v_folha.tipo_folha,
        v_servidor.cargo_id,
        v_servidor.cargo_nome,
        v_vencimento,
        v_servidor.unidade_id,
        COALESCE(v_servidor.unidade_sigla, '') || ' - ' || COALESCE(v_servidor.unidade_nome, ''),
        v_vencimento,
        v_total_descontos,
        v_valor_liquido,
        v_base_inss,
        v_valor_inss,
        v_base_irrf,
        v_valor_irrf,
        v_qtd_dependentes,
        v_deducao_dependentes,
        -- DADOS BANCÁRIOS
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
      v_errors := v_errors || jsonb_build_object(
        'servidor_id', v_servidor.id,
        'nome', v_servidor.nome_completo,
        'erro', SQLERRM
      );
    END;
  END LOOP;
  
  -- Atualizar totais da folha - manter status "aberta" para permitir ajustes
  UPDATE folhas_pagamento
  SET 
    total_bruto = COALESCE((SELECT SUM(total_proventos) FROM fichas_financeiras WHERE folha_id = p_folha_id), 0),
    total_descontos = COALESCE((SELECT SUM(total_descontos) FROM fichas_financeiras WHERE folha_id = p_folha_id), 0),
    total_liquido = COALESCE((SELECT SUM(valor_liquido) FROM fichas_financeiras WHERE folha_id = p_folha_id), 0),
    total_inss_servidor = COALESCE((SELECT SUM(valor_inss) FROM fichas_financeiras WHERE folha_id = p_folha_id), 0),
    total_irrf = COALESCE((SELECT SUM(valor_irrf) FROM fichas_financeiras WHERE folha_id = p_folha_id), 0),
    quantidade_servidores = v_count,
    status = 'aberta',
    data_processamento = now(),
    updated_at = now()
  WHERE id = p_folha_id;
  
  -- Retorno em formato JSONB
  RETURN jsonb_build_object(
    'sucesso', true,
    'servidores_processados', v_count,
    'total_servidores_ativos', v_total_servidores_ativos,
    'total_com_provimento', v_total_com_provimento,
    'total_sem_vencimento', v_total_sem_vencimento,
    'erros', v_errors
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Em caso de erro, reverter status
  UPDATE folhas_pagamento SET status = 'aberta', updated_at = now() WHERE id = p_folha_id;
  
  RETURN jsonb_build_object(
    'sucesso', false,
    'erro', SQLERRM,
    'servidores_processados', v_count
  );
END;
$$;