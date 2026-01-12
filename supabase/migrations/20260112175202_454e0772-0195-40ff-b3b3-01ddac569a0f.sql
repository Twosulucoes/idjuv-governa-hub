
-- Tabela para itens detalhados da ficha financeira
CREATE TABLE IF NOT EXISTS public.itens_ficha_financeira (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ficha_id UUID NOT NULL REFERENCES public.fichas_financeiras(id) ON DELETE CASCADE,
  rubrica_id UUID REFERENCES public.rubricas(id),
  descricao TEXT NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('provento', 'desconto')),
  valor NUMERIC(15,2) NOT NULL DEFAULT 0,
  referencia TEXT,
  base_calculo NUMERIC(15,2),
  percentual NUMERIC(8,4),
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela para remessas bancárias (CNAB)
CREATE TABLE IF NOT EXISTS public.remessas_bancarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folha_id UUID NOT NULL REFERENCES public.folhas_pagamento(id),
  conta_autarquia_id UUID NOT NULL REFERENCES public.contas_autarquia(id),
  numero_remessa INTEGER NOT NULL,
  data_geracao TIMESTAMPTZ DEFAULT now(),
  nome_arquivo TEXT NOT NULL,
  layout VARCHAR(20) NOT NULL DEFAULT 'CNAB240',
  quantidade_registros INTEGER DEFAULT 0,
  valor_total NUMERIC(15,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'gerada' CHECK (status IN ('gerada', 'enviada', 'processada', 'erro', 'cancelada')),
  arquivo_url TEXT,
  hash_arquivo TEXT,
  observacoes TEXT,
  gerado_por UUID REFERENCES public.profiles(id),
  enviado_em TIMESTAMPTZ,
  enviado_por UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela para retornos bancários
CREATE TABLE IF NOT EXISTS public.retornos_bancarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  remessa_id UUID REFERENCES public.remessas_bancarias(id),
  data_processamento DATE,
  arquivo_nome TEXT,
  arquivo_url TEXT,
  quantidade_pagos INTEGER DEFAULT 0,
  quantidade_rejeitados INTEGER DEFAULT 0,
  valor_pago NUMERIC(15,2) DEFAULT 0,
  valor_rejeitado NUMERIC(15,2) DEFAULT 0,
  detalhes JSONB DEFAULT '[]'::jsonb,
  processado_por UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela para itens de retorno (detalhe de cada pagamento)
CREATE TABLE IF NOT EXISTS public.itens_retorno_bancario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retorno_id UUID NOT NULL REFERENCES public.retornos_bancarios(id) ON DELETE CASCADE,
  ficha_id UUID REFERENCES public.fichas_financeiras(id),
  servidor_id UUID REFERENCES public.servidores(id),
  valor NUMERIC(15,2),
  status VARCHAR(20) CHECK (status IN ('pago', 'rejeitado', 'devolvido')),
  codigo_ocorrencia VARCHAR(10),
  descricao_ocorrencia TEXT,
  data_pagamento DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_itens_ficha_ficha_id ON public.itens_ficha_financeira(ficha_id);
CREATE INDEX IF NOT EXISTS idx_remessas_folha_id ON public.remessas_bancarias(folha_id);
CREATE INDEX IF NOT EXISTS idx_remessas_status ON public.remessas_bancarias(status);
CREATE INDEX IF NOT EXISTS idx_retornos_remessa_id ON public.retornos_bancarios(remessa_id);

-- RLS Policies
ALTER TABLE public.itens_ficha_financeira ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remessas_bancarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retornos_bancarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_retorno_bancario ENABLE ROW LEVEL SECURITY;

-- Políticas para itens_ficha_financeira
CREATE POLICY "Usuários autenticados podem ver itens de ficha"
  ON public.itens_ficha_financeira FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem inserir itens de ficha"
  ON public.itens_ficha_financeira FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar itens de ficha"
  ON public.itens_ficha_financeira FOR UPDATE
  TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem deletar itens de ficha"
  ON public.itens_ficha_financeira FOR DELETE
  TO authenticated USING (true);

-- Políticas para remessas_bancarias
CREATE POLICY "Usuários autenticados podem ver remessas"
  ON public.remessas_bancarias FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem inserir remessas"
  ON public.remessas_bancarias FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar remessas"
  ON public.remessas_bancarias FOR UPDATE
  TO authenticated USING (true);

-- Políticas para retornos_bancarios
CREATE POLICY "Usuários autenticados podem ver retornos"
  ON public.retornos_bancarios FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem inserir retornos"
  ON public.retornos_bancarios FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar retornos"
  ON public.retornos_bancarios FOR UPDATE
  TO authenticated USING (true);

-- Políticas para itens_retorno_bancario
CREATE POLICY "Usuários autenticados podem ver itens de retorno"
  ON public.itens_retorno_bancario FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem inserir itens de retorno"
  ON public.itens_retorno_bancario FOR INSERT
  TO authenticated WITH CHECK (true);

-- Função para processar folha de pagamento
CREATE OR REPLACE FUNCTION public.processar_folha_pagamento(p_folha_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_folha RECORD;
  v_servidor RECORD;
  v_ficha_id UUID;
  v_vencimento_base NUMERIC;
  v_inss NUMERIC;
  v_irrf NUMERIC;
  v_base_irrf NUMERIC;
  v_total_proventos NUMERIC;
  v_total_descontos NUMERIC;
  v_liquido NUMERIC;
  v_consignacao RECORD;
  v_data_referencia DATE;
  v_qtd_dependentes INTEGER;
  v_deducao_dependentes NUMERIC;
  v_servidores_processados INTEGER := 0;
  v_erros JSONB := '[]'::jsonb;
BEGIN
  -- Buscar folha
  SELECT * INTO v_folha FROM folhas_pagamento WHERE id = p_folha_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('sucesso', false, 'erro', 'Folha não encontrada');
  END IF;
  
  -- Verificar status
  IF v_folha.status NOT IN ('aberta', 'processando') THEN
    RETURN jsonb_build_object('sucesso', false, 'erro', 'Folha deve estar aberta para processamento');
  END IF;
  
  -- Atualizar status para processando
  UPDATE folhas_pagamento SET status = 'processando', updated_at = now() WHERE id = p_folha_id;
  
  -- Data de referência para cálculos
  v_data_referencia := make_date(v_folha.ano, v_folha.mes, 1);
  
  -- Buscar valor de dedução por dependente
  v_deducao_dependentes := COALESCE(get_parametro_vigente('deducao_dependente', v_data_referencia), 189.59);
  
  -- Limpar fichas anteriores desta folha
  DELETE FROM fichas_financeiras WHERE folha_id = p_folha_id;
  
  -- Processar cada servidor ativo com provimento
  FOR v_servidor IN (
    SELECT 
      s.id,
      s.nome_completo,
      s.cpf,
      s.pis_pasep,
      s.banco,
      s.agencia,
      s.conta,
      p.cargo_id,
      c.vencimento_base,
      c.nome as cargo_nome
    FROM servidores s
    INNER JOIN provimentos p ON p.servidor_id = s.id AND p.status = 'ativo'
    INNER JOIN cargos c ON c.id = p.cargo_id
    WHERE s.situacao = 'ativo'
    ORDER BY s.nome_completo
  ) LOOP
    BEGIN
      v_vencimento_base := COALESCE(v_servidor.vencimento_base, 0);
      v_total_proventos := v_vencimento_base;
      v_total_descontos := 0;
      
      -- Calcular INSS
      v_inss := calcular_inss_servidor(v_vencimento_base, v_data_referencia);
      v_total_descontos := v_total_descontos + v_inss;
      
      -- Base do IRRF = Salário Bruto - INSS - Dedução por dependentes
      v_qtd_dependentes := count_dependentes_irrf(v_servidor.id, v_data_referencia);
      v_base_irrf := v_vencimento_base - v_inss - (v_qtd_dependentes * v_deducao_dependentes);
      
      -- Calcular IRRF
      v_irrf := calcular_irrf(GREATEST(v_base_irrf, 0), v_data_referencia);
      v_total_descontos := v_total_descontos + v_irrf;
      
      -- Buscar consignações ativas
      FOR v_consignacao IN (
        SELECT * FROM consignacoes
        WHERE servidor_id = v_servidor.id
        AND ativo = true
        AND suspenso = false
        AND quitado = false
        AND data_inicio <= v_data_referencia
        AND (data_fim IS NULL OR data_fim >= v_data_referencia)
      ) LOOP
        v_total_descontos := v_total_descontos + v_consignacao.valor_parcela;
      END LOOP;
      
      -- Calcular líquido
      v_liquido := v_total_proventos - v_total_descontos;
      
      -- Criar ficha financeira
      INSERT INTO fichas_financeiras (
        folha_id,
        servidor_id,
        competencia,
        salario_bruto,
        inss_servidor,
        irrf,
        outros_descontos,
        total_proventos,
        total_descontos,
        salario_liquido,
        base_inss,
        base_irrf,
        quantidade_dependentes_irrf,
        status,
        created_at
      ) VALUES (
        p_folha_id,
        v_servidor.id,
        to_char(v_data_referencia, 'YYYY-MM'),
        v_vencimento_base,
        v_inss,
        v_irrf,
        v_total_descontos - v_inss - v_irrf,
        v_total_proventos,
        v_total_descontos,
        v_liquido,
        v_vencimento_base,
        v_base_irrf,
        v_qtd_dependentes,
        'calculada',
        now()
      ) RETURNING id INTO v_ficha_id;
      
      -- Inserir itens da ficha (vencimento)
      INSERT INTO itens_ficha_financeira (ficha_id, descricao, tipo, valor, ordem)
      VALUES (v_ficha_id, 'Vencimento Base - ' || v_servidor.cargo_nome, 'provento', v_vencimento_base, 1);
      
      -- Inserir INSS
      IF v_inss > 0 THEN
        INSERT INTO itens_ficha_financeira (ficha_id, descricao, tipo, valor, base_calculo, ordem)
        VALUES (v_ficha_id, 'INSS', 'desconto', v_inss, v_vencimento_base, 100);
      END IF;
      
      -- Inserir IRRF
      IF v_irrf > 0 THEN
        INSERT INTO itens_ficha_financeira (ficha_id, descricao, tipo, valor, base_calculo, ordem)
        VALUES (v_ficha_id, 'IRRF', 'desconto', v_irrf, v_base_irrf, 101);
      END IF;
      
      -- Inserir consignações
      FOR v_consignacao IN (
        SELECT c.*, r.nome as rubrica_nome FROM consignacoes c
        LEFT JOIN rubricas r ON r.id = c.rubrica_id
        WHERE c.servidor_id = v_servidor.id
        AND c.ativo = true AND c.suspenso = false AND c.quitado = false
        AND c.data_inicio <= v_data_referencia
        AND (c.data_fim IS NULL OR c.data_fim >= v_data_referencia)
      ) LOOP
        INSERT INTO itens_ficha_financeira (ficha_id, rubrica_id, descricao, tipo, valor, referencia, ordem)
        VALUES (
          v_ficha_id, 
          v_consignacao.rubrica_id, 
          COALESCE(v_consignacao.rubrica_nome, v_consignacao.consignataria_nome), 
          'desconto', 
          v_consignacao.valor_parcela,
          v_consignacao.numero_contrato,
          200
        );
      END LOOP;
      
      v_servidores_processados := v_servidores_processados + 1;
      
    EXCEPTION WHEN OTHERS THEN
      v_erros := v_erros || jsonb_build_object(
        'servidor_id', v_servidor.id,
        'nome', v_servidor.nome_completo,
        'erro', SQLERRM
      );
    END;
  END LOOP;
  
  -- Atualizar totalizadores da folha
  UPDATE folhas_pagamento SET
    quantidade_servidores = v_servidores_processados,
    total_bruto = (SELECT COALESCE(SUM(salario_bruto), 0) FROM fichas_financeiras WHERE folha_id = p_folha_id),
    total_descontos = (SELECT COALESCE(SUM(total_descontos), 0) FROM fichas_financeiras WHERE folha_id = p_folha_id),
    total_liquido = (SELECT COALESCE(SUM(salario_liquido), 0) FROM fichas_financeiras WHERE folha_id = p_folha_id),
    inss_patronal = (SELECT COALESCE(SUM(salario_bruto), 0) * 0.20 FROM fichas_financeiras WHERE folha_id = p_folha_id),
    total_inss_servidor = (SELECT COALESCE(SUM(inss_servidor), 0) FROM fichas_financeiras WHERE folha_id = p_folha_id),
    total_irrf = (SELECT COALESCE(SUM(irrf), 0) FROM fichas_financeiras WHERE folha_id = p_folha_id),
    status = CASE WHEN jsonb_array_length(v_erros) > 0 THEN 'aberta' ELSE 'processada' END,
    updated_at = now()
  WHERE id = p_folha_id;
  
  RETURN jsonb_build_object(
    'sucesso', true,
    'servidores_processados', v_servidores_processados,
    'erros', v_erros
  );
END;
$$;

-- Função para obter próximo número de remessa
CREATE OR REPLACE FUNCTION public.get_proximo_numero_remessa(p_conta_id UUID, p_ano INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_numero INTEGER;
BEGIN
  SELECT COALESCE(MAX(numero_remessa), 0) + 1 INTO v_numero
  FROM remessas_bancarias
  WHERE conta_autarquia_id = p_conta_id
  AND EXTRACT(YEAR FROM data_geracao) = p_ano;
  
  RETURN v_numero;
END;
$$;

-- Trigger para atualizar updated_at
CREATE OR REPLACE TRIGGER update_remessas_bancarias_updated_at
  BEFORE UPDATE ON public.remessas_bancarias
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
