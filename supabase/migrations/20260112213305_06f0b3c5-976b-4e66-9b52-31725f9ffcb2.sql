-- Corrigir função processar_folha_pagamento:
-- 1. Status final válido (aberta -> processando durante, mantém aberta após processar para permitir ajustes)
-- 2. Retornar JSON com chaves em português para compatibilidade com frontend
-- 3. Adicionar diagnóstico detalhado no retorno
-- 4. Verificar provimento ativo corretamente

CREATE OR REPLACE FUNCTION public.processar_folha_pagamento(p_folha_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
  v_total_servidores_ativos INTEGER := 0;
  v_total_com_provimento INTEGER := 0;
  v_total_sem_vencimento INTEGER := 0;
BEGIN
  -- Buscar folha
  SELECT * INTO v_folha FROM folhas_pagamento WHERE id = p_folha_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('sucesso', false, 'erro', 'Folha não encontrada');
  END IF;
  
  -- Verificar status - permitir previa, aberta, reaberta ou processando
  IF v_folha.status NOT IN ('aberta', 'processando', 'reaberta', 'previa') THEN
    RETURN json_build_object('sucesso', false, 'erro', 'Folha não está em status que permita processamento. Status atual: ' || v_folha.status);
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
    INNER JOIN provimentos p ON p.servidor_id = s.id AND p.status = 'ativo'
    INNER JOIN cargos c ON c.id = p.cargo_id
    WHERE s.situacao = 'ativo'
      AND s.ativo = true
  LOOP
    BEGIN
      -- Vencimento base do cargo
      v_vencimento := COALESCE(v_servidor.vencimento_base, 0);
      
      -- Se não tem vencimento, registrar erro e pular
      IF v_vencimento <= 0 THEN
        v_total_sem_vencimento := v_total_sem_vencimento + 1;
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
      v_deducao_dependentes := v_qtd_dependentes * COALESCE(get_parametro_vigente('deducao_dependente_irrf', v_data_referencia), 0);
      
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
  
  -- Atualizar totais da folha - manter status "aberta" para permitir ajustes
  UPDATE folhas_pagamento
  SET 
    total_bruto = COALESCE((SELECT SUM(total_proventos) FROM fichas_financeiras WHERE folha_id = p_folha_id), 0),
    total_descontos = COALESCE((SELECT SUM(total_descontos) FROM fichas_financeiras WHERE folha_id = p_folha_id), 0),
    total_liquido = COALESCE((SELECT SUM(valor_liquido) FROM fichas_financeiras WHERE folha_id = p_folha_id), 0),
    quantidade_servidores = v_count,
    status = 'aberta',  -- Volta para "aberta" para permitir ajustes manuais antes de fechar
    data_processamento = now(),
    updated_at = now()
  WHERE id = p_folha_id;
  
  RETURN json_build_object(
    'sucesso', true,
    'servidores_processados', v_count,
    'total_servidores_ativos', v_total_servidores_ativos,
    'total_com_provimento', v_total_com_provimento,
    'total_sem_vencimento', v_total_sem_vencimento,
    'erros', v_errors
  );
END;
$function$;