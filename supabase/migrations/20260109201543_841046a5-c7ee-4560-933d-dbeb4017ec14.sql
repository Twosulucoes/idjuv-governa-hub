-- Criar/melhorar trigger para atualizar situação do servidor automaticamente
-- baseado em provimentos, cessões, férias e licenças

-- Função para calcular e atualizar a situação do servidor
CREATE OR REPLACE FUNCTION public.fn_atualizar_situacao_servidor(p_servidor_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_nova_situacao situacao_funcional;
  v_tipo_servidor tipo_servidor;
BEGIN
  -- Prioridade de situação:
  -- 1. Falecido (permanente)
  -- 2. Exonerado/Desligado (se último provimento encerrado por exoneração)
  -- 3. Férias em gozo
  -- 4. Licença/Afastamento ativo
  -- 5. Cedido (saída ativa)
  -- 6. Ativo (se tem provimento ativo ou cessão de entrada ativa)
  -- 7. Inativo (nenhuma das anteriores)
  
  -- Verificar se já está marcado como falecido
  SELECT situacao INTO v_nova_situacao
  FROM servidores WHERE id = p_servidor_id;
  
  IF v_nova_situacao = 'falecido' THEN
    RETURN; -- Não alterar
  END IF;
  
  -- Verificar se tem provimento encerrado por exoneração/falecimento
  IF EXISTS (
    SELECT 1 FROM provimentos 
    WHERE servidor_id = p_servidor_id 
    AND status = 'encerrado'
    AND motivo_encerramento IN ('exoneracao_pedido', 'exoneracao_oficio', 'falecimento')
    AND NOT EXISTS (
      SELECT 1 FROM provimentos p2 
      WHERE p2.servidor_id = p_servidor_id 
      AND p2.status = 'ativo'
      AND p2.data_inicio > provimentos.data_encerramento
    )
  ) THEN
    SELECT CASE motivo_encerramento
      WHEN 'falecimento' THEN 'falecido'::situacao_funcional
      ELSE 'exonerado'::situacao_funcional
    END INTO v_nova_situacao
    FROM provimentos
    WHERE servidor_id = p_servidor_id
    AND status = 'encerrado'
    ORDER BY data_encerramento DESC
    LIMIT 1;
    
    UPDATE servidores SET situacao = v_nova_situacao, updated_at = now() WHERE id = p_servidor_id;
    RETURN;
  END IF;
  
  -- Verificar férias em gozo
  IF EXISTS (
    SELECT 1 FROM ferias_servidor
    WHERE servidor_id = p_servidor_id
    AND status = 'em_gozo'
    AND data_inicio <= CURRENT_DATE
    AND data_fim >= CURRENT_DATE
  ) THEN
    v_nova_situacao := 'ferias';
    UPDATE servidores SET situacao = v_nova_situacao, updated_at = now() WHERE id = p_servidor_id;
    RETURN;
  END IF;
  
  -- Verificar licença/afastamento ativo
  IF EXISTS (
    SELECT 1 FROM licencas_afastamentos
    WHERE servidor_id = p_servidor_id
    AND status = 'ativa'
    AND data_inicio <= CURRENT_DATE
    AND (data_fim IS NULL OR data_fim >= CURRENT_DATE)
  ) THEN
    SELECT CASE tipo_afastamento
      WHEN 'licenca' THEN 'licenca'::situacao_funcional
      ELSE 'afastado'::situacao_funcional
    END INTO v_nova_situacao
    FROM licencas_afastamentos
    WHERE servidor_id = p_servidor_id AND status = 'ativa'
    ORDER BY data_inicio DESC
    LIMIT 1;
    
    UPDATE servidores SET situacao = v_nova_situacao, updated_at = now() WHERE id = p_servidor_id;
    RETURN;
  END IF;
  
  -- Verificar cessão de saída ativa (servidor cedido para outro órgão)
  IF EXISTS (
    SELECT 1 FROM cessoes
    WHERE servidor_id = p_servidor_id
    AND tipo = 'saida'
    AND ativa = true
  ) THEN
    v_nova_situacao := 'cedido';
    UPDATE servidores SET situacao = v_nova_situacao, updated_at = now() WHERE id = p_servidor_id;
    RETURN;
  END IF;
  
  -- Verificar se tem provimento ativo
  IF EXISTS (
    SELECT 1 FROM provimentos
    WHERE servidor_id = p_servidor_id
    AND status = 'ativo'
  ) THEN
    v_nova_situacao := 'ativo';
    
    -- Atualizar tipo_servidor baseado no provimento
    SELECT CASE c.categoria
      WHEN 'comissao' THEN 'comissionado_idjuv'::tipo_servidor
      WHEN 'efetivo' THEN 'efetivo_idjuv'::tipo_servidor
      ELSE 'comissionado_idjuv'::tipo_servidor
    END INTO v_tipo_servidor
    FROM provimentos p
    JOIN cargos c ON c.id = p.cargo_id
    WHERE p.servidor_id = p_servidor_id AND p.status = 'ativo'
    ORDER BY p.data_inicio DESC
    LIMIT 1;
    
    UPDATE servidores 
    SET situacao = v_nova_situacao, 
        tipo_servidor = COALESCE(v_tipo_servidor, tipo_servidor),
        updated_at = now() 
    WHERE id = p_servidor_id;
    RETURN;
  END IF;
  
  -- Verificar cessão de entrada ativa (servidor de outro órgão cedido ao IDJuv)
  IF EXISTS (
    SELECT 1 FROM cessoes
    WHERE servidor_id = p_servidor_id
    AND tipo = 'entrada'
    AND ativa = true
  ) THEN
    v_nova_situacao := 'ativo';
    v_tipo_servidor := 'cedido_entrada';
    
    UPDATE servidores 
    SET situacao = v_nova_situacao, 
        tipo_servidor = v_tipo_servidor,
        updated_at = now() 
    WHERE id = p_servidor_id;
    RETURN;
  END IF;
  
  -- Nenhuma condição acima: inativo ou aguardando nomeação
  v_nova_situacao := 'inativo';
  UPDATE servidores SET situacao = v_nova_situacao, updated_at = now() WHERE id = p_servidor_id;
END;
$$;

-- Trigger para provimentos
CREATE OR REPLACE FUNCTION public.trigger_provimento_atualiza_situacao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM fn_atualizar_situacao_servidor(NEW.servidor_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_provimento_atualiza_situacao ON provimentos;
CREATE TRIGGER trg_provimento_atualiza_situacao
AFTER INSERT OR UPDATE ON provimentos
FOR EACH ROW
EXECUTE FUNCTION trigger_provimento_atualiza_situacao();

-- Trigger para cessões
CREATE OR REPLACE FUNCTION public.trigger_cessao_atualiza_situacao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM fn_atualizar_situacao_servidor(NEW.servidor_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cessao_atualiza_situacao ON cessoes;
CREATE TRIGGER trg_cessao_atualiza_situacao
AFTER INSERT OR UPDATE ON cessoes
FOR EACH ROW
EXECUTE FUNCTION trigger_cessao_atualiza_situacao();

-- Trigger para férias
CREATE OR REPLACE FUNCTION public.trigger_ferias_atualiza_situacao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM fn_atualizar_situacao_servidor(NEW.servidor_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ferias_atualiza_situacao ON ferias_servidor;
CREATE TRIGGER trg_ferias_atualiza_situacao
AFTER INSERT OR UPDATE ON ferias_servidor
FOR EACH ROW
EXECUTE FUNCTION trigger_ferias_atualiza_situacao();

-- Trigger para licenças/afastamentos
CREATE OR REPLACE FUNCTION public.trigger_licenca_atualiza_situacao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM fn_atualizar_situacao_servidor(NEW.servidor_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_licenca_atualiza_situacao ON licencas_afastamentos;
CREATE TRIGGER trg_licenca_atualiza_situacao
AFTER INSERT OR UPDATE ON licencas_afastamentos
FOR EACH ROW
EXECUTE FUNCTION trigger_licenca_atualiza_situacao();