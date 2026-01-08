-- ================================================================
-- REFATORAÇÃO COMPLETA: GESTÃO DE SERVIDORES POR TIPO
-- Baseado na legislação administrativa e estrutura do IDJuv
-- ================================================================

-- 1) CRIAR ENUM PARA TIPO DE SERVIDOR (princípio estruturante)
CREATE TYPE public.tipo_servidor AS ENUM (
  'efetivo_idjuv',           -- Efetivo do IDJuv
  'comissionado_idjuv',      -- Comissionado do IDJuv
  'cedido_entrada',          -- Cedido de outro órgão (entrada)
  'cedido_saida'             -- Efetivo do IDJuv cedido para outro órgão (saída)
);

-- 2) CRIAR ENUM PARA TIPO DE VÍNCULO FUNCIONAL (tipado)
CREATE TYPE public.tipo_vinculo_funcional AS ENUM (
  'efetivo_idjuv',           -- Efetivo do IDJuv
  'comissionado_idjuv',      -- Comissionado do IDJuv
  'cedido_entrada',          -- Cedido de outro órgão (entrada)
  'cedido_saida'             -- Cedido (saída - efetivo do IDJuv)
);

-- 3) CRIAR ENUM PARA TIPO DE LOTAÇÃO
CREATE TYPE public.tipo_lotacao AS ENUM (
  'lotacao_interna',         -- Lotação interna padrão
  'designacao',              -- Designação temporária
  'cessao_interna',          -- Cessão dentro do IDJuv
  'lotacao_externa'          -- Cessão de saída (lotação em outro órgão)
);

-- 4) CRIAR ENUM PARA STATUS DO PROVIMENTO
CREATE TYPE public.status_provimento AS ENUM (
  'ativo',                   -- Provimento ativo
  'suspenso',                -- Suspenso (apenas para efetivo em cessão)
  'encerrado',               -- Encerrado (exoneração, término)
  'vacante'                  -- Vaga disponível
);

-- 5) CRIAR ENUM PARA NATUREZA DO CARGO
CREATE TYPE public.natureza_cargo AS ENUM (
  'efetivo',                 -- Cargo efetivo (permanente)
  'comissionado'             -- Cargo comissionado (temporário)
);

-- 6) ADICIONAR COLUNA tipo_servidor NA TABELA servidores
ALTER TABLE public.servidores 
ADD COLUMN IF NOT EXISTS tipo_servidor public.tipo_servidor;

-- 7) ADICIONAR CAMPO função_exercida PARA CEDIDOS DE ENTRADA
ALTER TABLE public.servidores
ADD COLUMN IF NOT EXISTS funcao_exercida TEXT;

-- 8) ADICIONAR CAMPO órgão_origem PARA CEDIDOS DE ENTRADA
ALTER TABLE public.servidores
ADD COLUMN IF NOT EXISTS orgao_origem TEXT;

-- 9) ADICIONAR CAMPO órgão_destino PARA CEDIDOS DE SAÍDA
ALTER TABLE public.servidores
ADD COLUMN IF NOT EXISTS orgao_destino_cessao TEXT;

-- ================================================================
-- TABELA: VÍNCULOS FUNCIONAIS (histórico completo)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.vinculos_funcionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL REFERENCES public.servidores(id) ON DELETE CASCADE,
  tipo_vinculo public.tipo_vinculo_funcional NOT NULL,
  
  -- Datas
  data_inicio DATE NOT NULL,
  data_fim DATE,
  ativo BOOLEAN DEFAULT true,
  
  -- Ato de nomeação/designação
  ato_tipo TEXT, -- 'portaria', 'decreto', 'lei'
  ato_numero TEXT,
  ato_data DATE,
  ato_doe_numero TEXT,
  ato_doe_data DATE,
  ato_url TEXT,
  
  -- Para cessão de entrada
  orgao_origem TEXT,
  onus_origem BOOLEAN DEFAULT true,
  
  -- Para cessão de saída
  orgao_destino TEXT,
  
  -- Fundamentação
  fundamentacao_legal TEXT,
  observacoes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID
);

-- ================================================================
-- TABELA: PROVIMENTOS / NOMEAÇÕES (apenas efetivos e comissionados)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.provimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL REFERENCES public.servidores(id) ON DELETE CASCADE,
  cargo_id UUID NOT NULL REFERENCES public.cargos(id),
  unidade_id UUID REFERENCES public.estrutura_organizacional(id),
  
  -- Status do provimento
  status public.status_provimento DEFAULT 'ativo',
  
  -- Datas
  data_nomeacao DATE NOT NULL,
  data_posse DATE,
  data_exercicio DATE,
  data_encerramento DATE,
  
  -- Ato de nomeação
  ato_nomeacao_tipo TEXT, -- 'portaria', 'decreto'
  ato_nomeacao_numero TEXT,
  ato_nomeacao_data DATE,
  ato_nomeacao_doe_numero TEXT,
  ato_nomeacao_doe_data DATE,
  ato_nomeacao_url TEXT,
  
  -- Ato de encerramento (exoneração)
  ato_encerramento_tipo TEXT,
  ato_encerramento_numero TEXT,
  ato_encerramento_data DATE,
  motivo_encerramento TEXT, -- 'exoneracao', 'termino_mandato', 'cessao_comissionado'
  
  -- Observações
  observacoes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID
);

-- ================================================================
-- REFATORAR TABELA: LOTAÇÕES (histórico completo)
-- ================================================================
-- Adicionar novos campos à tabela existente
ALTER TABLE public.lotacoes
ADD COLUMN IF NOT EXISTS tipo_lotacao public.tipo_lotacao DEFAULT 'lotacao_interna';

ALTER TABLE public.lotacoes
ADD COLUMN IF NOT EXISTS funcao_exercida TEXT;

ALTER TABLE public.lotacoes
ADD COLUMN IF NOT EXISTS orgao_externo TEXT;

ALTER TABLE public.lotacoes
ADD COLUMN IF NOT EXISTS ato_numero TEXT;

ALTER TABLE public.lotacoes
ADD COLUMN IF NOT EXISTS ato_data DATE;

ALTER TABLE public.lotacoes
ADD COLUMN IF NOT EXISTS ato_url TEXT;

-- ================================================================
-- TABELA: CESSÕES (controle específico de cessões)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.cessoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL REFERENCES public.servidores(id) ON DELETE CASCADE,
  
  -- Tipo de cessão
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  
  -- Para ENTRADA: de onde vem
  orgao_origem TEXT,
  cargo_origem TEXT,
  vinculo_origem TEXT, -- tipo de vínculo no órgão de origem
  
  -- Para SAÍDA: para onde vai
  orgao_destino TEXT,
  cargo_destino TEXT,
  
  -- Ônus
  onus TEXT CHECK (onus IN ('origem', 'destino', 'compartilhado')),
  
  -- Função exercida no IDJuv (para cedidos de entrada)
  funcao_exercida_idjuv TEXT,
  unidade_idjuv_id UUID REFERENCES public.estrutura_organizacional(id),
  
  -- Datas
  data_inicio DATE NOT NULL,
  data_fim DATE,
  data_retorno DATE,
  ativa BOOLEAN DEFAULT true,
  
  -- Ato de cessão
  ato_tipo TEXT,
  ato_numero TEXT,
  ato_data DATE,
  ato_doe_numero TEXT,
  ato_doe_data DATE,
  ato_url TEXT,
  
  -- Ato de retorno (quando aplicável)
  ato_retorno_numero TEXT,
  ato_retorno_data DATE,
  
  -- Observações
  observacoes TEXT,
  fundamentacao_legal TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID
);

-- ================================================================
-- ADICIONAR natureza_cargo À TABELA cargos
-- ================================================================
ALTER TABLE public.cargos
ADD COLUMN IF NOT EXISTS natureza public.natureza_cargo;

-- Atualizar cargos existentes baseado na categoria
UPDATE public.cargos 
SET natureza = 'efetivo' 
WHERE categoria = 'efetivo' AND natureza IS NULL;

UPDATE public.cargos 
SET natureza = 'comissionado' 
WHERE categoria IN ('comissionado', 'funcao_gratificada') AND natureza IS NULL;

-- ================================================================
-- ÍNDICES PARA PERFORMANCE
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_vinculos_servidor ON public.vinculos_funcionais(servidor_id);
CREATE INDEX IF NOT EXISTS idx_vinculos_ativo ON public.vinculos_funcionais(ativo) WHERE ativo = true;
CREATE INDEX IF NOT EXISTS idx_provimentos_servidor ON public.provimentos(servidor_id);
CREATE INDEX IF NOT EXISTS idx_provimentos_status ON public.provimentos(status) WHERE status = 'ativo';
CREATE INDEX IF NOT EXISTS idx_provimentos_cargo ON public.provimentos(cargo_id);
CREATE INDEX IF NOT EXISTS idx_cessoes_servidor ON public.cessoes(servidor_id);
CREATE INDEX IF NOT EXISTS idx_cessoes_ativa ON public.cessoes(ativa) WHERE ativa = true;
CREATE INDEX IF NOT EXISTS idx_servidores_tipo ON public.servidores(tipo_servidor);
CREATE INDEX IF NOT EXISTS idx_lotacoes_tipo ON public.lotacoes(tipo_lotacao);

-- ================================================================
-- RLS POLICIES
-- ================================================================
ALTER TABLE public.vinculos_funcionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cessoes ENABLE ROW LEVEL SECURITY;

-- Vínculos Funcionais
CREATE POLICY "Admins podem gerenciar vínculos" ON public.vinculos_funcionais
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers podem visualizar vínculos" ON public.vinculos_funcionais
  FOR SELECT USING (has_role(auth.uid(), 'manager'));

CREATE POLICY "Usuários podem ver próprios vínculos" ON public.vinculos_funcionais
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM servidores s
      WHERE s.id = vinculos_funcionais.servidor_id
      AND s.user_id = auth.uid()
    )
  );

-- Provimentos
CREATE POLICY "Admins podem gerenciar provimentos" ON public.provimentos
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers podem visualizar provimentos" ON public.provimentos
  FOR SELECT USING (has_role(auth.uid(), 'manager'));

CREATE POLICY "Todos podem visualizar provimentos" ON public.provimentos
  FOR SELECT USING (true);

-- Cessões
CREATE POLICY "Admins podem gerenciar cessões" ON public.cessoes
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers podem visualizar cessões" ON public.cessoes
  FOR SELECT USING (has_role(auth.uid(), 'manager'));

CREATE POLICY "Todos podem visualizar cessões" ON public.cessoes
  FOR SELECT USING (true);

-- ================================================================
-- FUNÇÃO: Validar provimento (não exceder quantitativo)
-- ================================================================
CREATE OR REPLACE FUNCTION public.validar_provimento()
RETURNS TRIGGER AS $$
DECLARE
  qtd_atual INTEGER;
  qtd_max INTEGER;
BEGIN
  -- Contar provimentos ativos para o cargo
  SELECT COUNT(*) INTO qtd_atual
  FROM public.provimentos
  WHERE cargo_id = NEW.cargo_id
    AND status = 'ativo'
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
  
  -- Obter quantidade máxima de vagas
  SELECT quantidade_vagas INTO qtd_max
  FROM public.cargos
  WHERE id = NEW.cargo_id;
  
  -- Validar se não excede
  IF NEW.status = 'ativo' AND qtd_atual >= COALESCE(qtd_max, 0) THEN
    RAISE EXCEPTION 'Quantidade máxima de provimentos para este cargo foi atingida (% de %)', qtd_atual, qtd_max;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_validar_provimento
  BEFORE INSERT OR UPDATE ON public.provimentos
  FOR EACH ROW EXECUTE FUNCTION public.validar_provimento();

-- ================================================================
-- FUNÇÃO: Atualizar tipo_servidor automaticamente
-- ================================================================
CREATE OR REPLACE FUNCTION public.atualizar_tipo_servidor()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar o tipo_servidor no registro do servidor baseado no vínculo
  UPDATE public.servidores
  SET tipo_servidor = NEW.tipo_vinculo::text::tipo_servidor
  WHERE id = NEW.servidor_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_atualizar_tipo_servidor
  AFTER INSERT ON public.vinculos_funcionais
  FOR EACH ROW
  WHEN (NEW.ativo = true)
  EXECUTE FUNCTION public.atualizar_tipo_servidor();

-- ================================================================
-- FUNÇÃO: Garantir apenas 1 vínculo ativo por servidor
-- ================================================================
CREATE OR REPLACE FUNCTION public.validar_vinculo_unico()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ativo = true THEN
    -- Desativar vínculos anteriores
    UPDATE public.vinculos_funcionais
    SET ativo = false, data_fim = COALESCE(NEW.data_inicio - INTERVAL '1 day', CURRENT_DATE)
    WHERE servidor_id = NEW.servidor_id
      AND ativo = true
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_validar_vinculo_unico
  BEFORE INSERT OR UPDATE ON public.vinculos_funcionais
  FOR EACH ROW EXECUTE FUNCTION public.validar_vinculo_unico();

-- ================================================================
-- FUNÇÃO: Garantir apenas 1 lotação ativa por servidor
-- ================================================================
CREATE OR REPLACE FUNCTION public.validar_lotacao_unica()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ativo = true THEN
    -- Desativar lotações anteriores
    UPDATE public.lotacoes
    SET ativo = false, data_fim = COALESCE(NEW.data_inicio - INTERVAL '1 day', CURRENT_DATE)
    WHERE servidor_id = NEW.servidor_id
      AND ativo = true
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_validar_lotacao_unica
  BEFORE INSERT OR UPDATE ON public.lotacoes
  FOR EACH ROW EXECUTE FUNCTION public.validar_lotacao_unica();

-- ================================================================
-- VIEW: Situação atual completa do servidor
-- ================================================================
CREATE OR REPLACE VIEW public.v_servidores_situacao AS
SELECT 
  s.id,
  s.nome_completo,
  s.cpf,
  s.matricula,
  s.tipo_servidor,
  s.situacao,
  s.foto_url,
  s.email_institucional,
  s.telefone_celular,
  
  -- Vínculo vigente
  vf.id AS vinculo_id,
  vf.tipo_vinculo,
  vf.data_inicio AS vinculo_inicio,
  vf.orgao_origem AS vinculo_orgao_origem,
  vf.orgao_destino AS vinculo_orgao_destino,
  
  -- Provimento vigente (se aplicável)
  p.id AS provimento_id,
  p.cargo_id,
  c.nome AS cargo_nome,
  c.sigla AS cargo_sigla,
  c.natureza AS cargo_natureza,
  p.data_nomeacao,
  p.data_posse,
  p.status AS provimento_status,
  
  -- Lotação vigente
  l.id AS lotacao_id,
  l.unidade_id,
  u.nome AS unidade_nome,
  u.sigla AS unidade_sigla,
  l.tipo_lotacao,
  l.data_inicio AS lotacao_inicio,
  l.funcao_exercida AS lotacao_funcao,
  
  -- Cessão ativa (se houver)
  ces.id AS cessao_id,
  ces.tipo AS cessao_tipo,
  ces.orgao_origem AS cessao_orgao_origem,
  ces.orgao_destino AS cessao_orgao_destino,
  ces.data_inicio AS cessao_inicio,
  ces.onus AS cessao_onus

FROM public.servidores s
LEFT JOIN public.vinculos_funcionais vf ON vf.servidor_id = s.id AND vf.ativo = true
LEFT JOIN public.provimentos p ON p.servidor_id = s.id AND p.status = 'ativo'
LEFT JOIN public.cargos c ON c.id = p.cargo_id
LEFT JOIN public.lotacoes l ON l.servidor_id = s.id AND l.ativo = true
LEFT JOIN public.estrutura_organizacional u ON u.id = l.unidade_id
LEFT JOIN public.cessoes ces ON ces.servidor_id = s.id AND ces.ativa = true
WHERE s.ativo = true;

-- Grant access to the view
GRANT SELECT ON public.v_servidores_situacao TO authenticated;