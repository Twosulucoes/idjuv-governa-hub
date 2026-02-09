-- Função para gerar número de tombamento automático no formato IDJ-XX-XXXX
-- XX = código da unidade local (2 dígitos), XXXX = sequencial

CREATE OR REPLACE FUNCTION public.gerar_numero_tombamento(
  p_unidade_local_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_codigo_unidade TEXT;
  v_prefixo TEXT;
  v_ultimo_seq INTEGER;
  v_novo_seq INTEGER;
  v_numero_patrimonio TEXT;
BEGIN
  -- Buscar código da unidade local
  SELECT codigo_unidade INTO v_codigo_unidade
  FROM unidades_locais
  WHERE id = p_unidade_local_id;

  -- Se não encontrou, usar código genérico
  IF v_codigo_unidade IS NULL THEN
    v_prefixo := 'IDJ-00';
  ELSE
    -- Extrair prefixo de 2 caracteres do tipo (GIN, EST, etc) ou usar primeiros 2 do código
    v_prefixo := 'IDJ-' || LPAD(SUBSTRING(v_codigo_unidade FROM 1 FOR 2), 2, '0');
  END IF;

  -- Buscar último sequencial para este prefixo
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(numero_patrimonio FROM '[0-9]+$') AS INTEGER)
  ), 0) INTO v_ultimo_seq
  FROM bens_patrimoniais
  WHERE numero_patrimonio LIKE v_prefixo || '-%';

  -- Incrementar
  v_novo_seq := v_ultimo_seq + 1;

  -- Formatar: IDJ-XX-0001
  v_numero_patrimonio := v_prefixo || '-' || LPAD(v_novo_seq::TEXT, 4, '0');

  RETURN v_numero_patrimonio;
END;
$$;

-- Comentário
COMMENT ON FUNCTION public.gerar_numero_tombamento IS 'Gera número de tombamento automático no formato IDJ-XX-XXXX para bens patrimoniais';

-- Permitir execução por usuários autenticados
GRANT EXECUTE ON FUNCTION public.gerar_numero_tombamento TO authenticated;