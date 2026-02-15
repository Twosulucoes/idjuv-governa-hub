
-- ============================================================
-- FASE 3C: Adicionais por tempo de serviço + validação margem
-- FASE 3D: Funções eSocial e TCE
-- ============================================================

-- ==================== FASE 3C ====================

-- Tabela de adicionais por tempo de serviço
CREATE TABLE IF NOT EXISTS public.adicionais_tempo_servico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  servidor_id UUID NOT NULL REFERENCES public.servidores(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL, -- 'anuenio', 'quinquenio', 'trienio'
  percentual NUMERIC(5,2) NOT NULL, -- ex: 1.00 para 1%
  quantidade INTEGER NOT NULL DEFAULT 1, -- número de períodos completados
  data_base DATE NOT NULL, -- data base para contagem
  data_concessao DATE NOT NULL,
  data_proximo DATE, -- próxima concessão automática
  valor_referencia NUMERIC(12,2), -- base de cálculo
  valor_adicional NUMERIC(12,2), -- valor calculado
  ato_numero VARCHAR(50),
  ato_data DATE,
  fundamentacao_legal TEXT,
  observacoes TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

ALTER TABLE public.adicionais_tempo_servico ENABLE ROW LEVEL SECURITY;

-- RLS: self-access + admin/rh
CREATE POLICY "ats_select" ON public.adicionais_tempo_servico FOR SELECT TO authenticated
USING (has_role('admin'::app_role) OR has_module('rh'::app_module) OR
  EXISTS (SELECT 1 FROM servidores s WHERE s.id = adicionais_tempo_servico.servidor_id AND s.user_id = auth.uid()));

CREATE POLICY "ats_insert" ON public.adicionais_tempo_servico FOR INSERT TO authenticated
WITH CHECK (has_role('admin'::app_role) OR has_module('rh'::app_module));

CREATE POLICY "ats_update" ON public.adicionais_tempo_servico FOR UPDATE TO authenticated
USING (has_role('admin'::app_role) OR has_module('rh'::app_module))
WITH CHECK (has_role('admin'::app_role) OR has_module('rh'::app_module));

CREATE POLICY "ats_delete" ON public.adicionais_tempo_servico FOR DELETE TO authenticated
USING (has_role('admin'::app_role));

-- Índices
CREATE INDEX IF NOT EXISTS idx_ats_servidor ON public.adicionais_tempo_servico(servidor_id);
CREATE INDEX IF NOT EXISTS idx_ats_tipo ON public.adicionais_tempo_servico(tipo);

-- Função: validar margem consignável (30% ordinário + 5% cartão)
CREATE OR REPLACE FUNCTION public.fn_validar_margem_consignavel(
  p_servidor_id UUID
)
RETURNS TABLE(
  salario_liquido NUMERIC,
  margem_total_percentual NUMERIC,
  margem_total_valor NUMERIC,
  margem_utilizada NUMERIC,
  margem_disponivel NUMERIC,
  percentual_utilizado NUMERIC,
  dentro_limite BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_liquido NUMERIC;
  v_margem_pct NUMERIC;
  v_utilizada NUMERIC;
BEGIN
  -- Buscar remuneração líquida do servidor
  SELECT COALESCE(s.remuneracao_bruta, 0) - COALESCE(s.descontos, 0)
  INTO v_liquido
  FROM servidores s WHERE s.id = p_servidor_id;

  -- Buscar percentual da margem
  SELECT COALESCE(valor * 100, 35)
  INTO v_margem_pct
  FROM parametros_folha
  WHERE tipo_parametro = 'margem_consignavel' AND ativo = true
  ORDER BY vigencia_inicio DESC LIMIT 1;

  -- Somar consignações ativas
  SELECT COALESCE(SUM(valor_parcela), 0)
  INTO v_utilizada
  FROM consignacoes
  WHERE servidor_id = p_servidor_id AND ativo = true AND suspenso = false AND quitado = false;

  RETURN QUERY SELECT
    v_liquido,
    v_margem_pct,
    ROUND(v_liquido * v_margem_pct / 100, 2),
    v_utilizada,
    ROUND(v_liquido * v_margem_pct / 100 - v_utilizada, 2),
    CASE WHEN v_liquido > 0 THEN ROUND(v_utilizada / (v_liquido * v_margem_pct / 100) * 100, 2) ELSE 0 END,
    v_utilizada <= ROUND(v_liquido * v_margem_pct / 100, 2);
END;
$$;

-- ==================== FASE 3D ====================

-- Função para gerar payload eSocial S-2200 (Admissão)
CREATE OR REPLACE FUNCTION public.fn_gerar_esocial_s2200(
  p_servidor_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_servidor RECORD;
  v_payload JSONB;
BEGIN
  SELECT * INTO v_servidor FROM servidores WHERE id = p_servidor_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Servidor não encontrado: %', p_servidor_id;
  END IF;

  v_payload := jsonb_build_object(
    'evento', 'S-2200',
    'tipo', 'evtAdmissao',
    'ideEvento', jsonb_build_object(
      'indRetif', 1,
      'tpAmb', 2, -- 1=Produção, 2=Homologação
      'procEmi', 1,
      'verProc', '1.0.0'
    ),
    'trabalhador', jsonb_build_object(
      'cpfTrab', v_servidor.cpf,
      'nmTrab', v_servidor.nome_completo,
      'nmSoc', v_servidor.nome_social,
      'sexo', CASE v_servidor.sexo WHEN 'masculino' THEN 'M' WHEN 'feminino' THEN 'F' ELSE NULL END,
      'racaCor', v_servidor.raca_cor,
      'estCiv', v_servidor.estado_civil,
      'dtNascto', v_servidor.data_nascimento,
      'paisNac', 105, -- Brasil
      'nmMae', v_servidor.nome_mae,
      'nmPai', v_servidor.nome_pai
    ),
    'documentos', jsonb_build_object(
      'CTPS', jsonb_build_object('nrCtps', v_servidor.ctps_numero, 'serieCtps', v_servidor.ctps_serie),
      'RG', jsonb_build_object('nrRg', v_servidor.rg, 'orgaoEmissor', v_servidor.rg_orgao_expedidor),
      'RIC', NULL,
      'NIS', jsonb_build_object('nrNis', v_servidor.pis_pasep)
    ),
    'endereco', jsonb_build_object(
      'tpLograd', v_servidor.endereco_logradouro,
      'nrLograd', v_servidor.endereco_numero,
      'complemento', v_servidor.endereco_complemento,
      'bairro', v_servidor.endereco_bairro,
      'cep', v_servidor.endereco_cep,
      'codMunic', NULL,
      'uf', v_servidor.endereco_uf
    ),
    'vinculo', jsonb_build_object(
      'matricula', v_servidor.matricula,
      'tpRegTrab', 2, -- Estatutário
      'tpRegPrev', 2, -- RPPS
      'dtAdm', v_servidor.data_admissao,
      'cadIni', 'S'
    ),
    'deficiencia', CASE WHEN v_servidor.pcd THEN jsonb_build_object(
      'defFisica', v_servidor.pcd_tipo,
      'infoCota', 'S'
    ) ELSE NULL END,
    'geradoEm', now(),
    'status', 'pendente'
  );

  RETURN v_payload;
END;
$$;

-- Função para gerar payload eSocial S-1200 (Remuneração)
CREATE OR REPLACE FUNCTION public.fn_gerar_esocial_s1200(
  p_servidor_id UUID,
  p_competencia_ano INTEGER,
  p_competencia_mes INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_servidor RECORD;
  v_lancamentos JSONB;
  v_payload JSONB;
BEGIN
  SELECT * INTO v_servidor FROM servidores WHERE id = p_servidor_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Servidor não encontrado'; END IF;

  -- Buscar lançamentos da folha
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'rubrica_id', l.rubrica_id,
    'tipo', l.tipo,
    'valor', l.valor,
    'referencia', l.referencia
  )), '[]'::jsonb)
  INTO v_lancamentos
  FROM lancamentos_folha l
  JOIN folhas_pagamento f ON f.id = l.folha_id
  WHERE l.servidor_id = p_servidor_id
    AND f.ano = p_competencia_ano AND f.mes = p_competencia_mes;

  v_payload := jsonb_build_object(
    'evento', 'S-1200',
    'tipo', 'evtRemun',
    'ideEvento', jsonb_build_object(
      'indRetif', 1,
      'perApur', LPAD(p_competencia_mes::TEXT, 2, '0') || '-' || p_competencia_ano,
      'tpAmb', 2,
      'procEmi', 1
    ),
    'trabalhador', jsonb_build_object(
      'cpfTrab', v_servidor.cpf,
      'nmTrab', v_servidor.nome_completo,
      'matricula', v_servidor.matricula
    ),
    'dmDev', v_lancamentos,
    'geradoEm', now(),
    'status', 'pendente'
  );

  RETURN v_payload;
END;
$$;

-- View resumida para relatório TCE (quadro de pessoal)
CREATE OR REPLACE VIEW public.v_relatorio_tce_pessoal AS
SELECT
  s.id,
  s.nome_completo,
  s.cpf,
  s.matricula,
  s.tipo_servidor,
  s.situacao,
  s.data_admissao,
  s.data_posse,
  s.regime_juridico,
  s.carga_horaria,
  s.remuneracao_bruta,
  s.gratificacoes,
  s.descontos,
  COALESCE(s.remuneracao_bruta, 0) + COALESCE(s.gratificacoes, 0) - COALESCE(s.descontos, 0) AS remuneracao_liquida,
  eo.nome AS unidade_nome,
  eo.sigla AS unidade_sigla,
  c.nome AS cargo_nome,
  s.escolaridade,
  s.raca_cor,
  s.pcd,
  s.pcd_tipo,
  s.sexo,
  s.data_nascimento,
  EXTRACT(YEAR FROM AGE(CURRENT_DATE, s.data_nascimento))::INTEGER AS idade,
  EXTRACT(YEAR FROM AGE(CURRENT_DATE, s.data_admissao))::INTEGER AS anos_servico
FROM servidores s
LEFT JOIN estrutura_organizacional eo ON eo.id = s.unidade_atual_id
LEFT JOIN cargos c ON c.id = s.cargo_atual_id
WHERE s.ativo = true
ORDER BY s.nome_completo;
