-- ============================================================
-- ESTRUTURA PARA PARCERIAS E PROJETOS DE FEDERAÇÕES
-- ============================================================

-- Tabela de parcerias e projetos vinculados a federações
CREATE TABLE public.federacao_parcerias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  federacao_id UUID NOT NULL REFERENCES public.federacoes_esportivas(id) ON DELETE CASCADE,
  
  -- Dados da parceria
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL DEFAULT 'parceria', -- parceria, projeto, convenio, patrocinio
  
  -- Vigência
  data_inicio DATE NOT NULL,
  data_fim DATE,
  status TEXT NOT NULL DEFAULT 'vigente', -- vigente, encerrada, suspensa, em_analise
  
  -- Documentos e processos
  processo_sei TEXT,
  numero_termo TEXT,
  numero_portaria TEXT,
  
  -- Arquivos
  documento_url TEXT,
  
  -- Observações
  observacoes TEXT,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Índices
CREATE INDEX idx_federacao_parcerias_federacao ON public.federacao_parcerias(federacao_id);
CREATE INDEX idx_federacao_parcerias_status ON public.federacao_parcerias(status);
CREATE INDEX idx_federacao_parcerias_tipo ON public.federacao_parcerias(tipo);

-- RLS
ALTER TABLE public.federacao_parcerias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parcerias visíveis para usuários autenticados"
ON public.federacao_parcerias FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Parcerias gerenciáveis por admins"
ON public.federacao_parcerias FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'manager', 'presidencia', 'diraf')
  )
);

-- ============================================================
-- TABELA DE ESPAÇOS CEDIDOS A FEDERAÇÕES
-- ============================================================

CREATE TABLE public.federacao_espacos_cedidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  federacao_id UUID NOT NULL REFERENCES public.federacoes_esportivas(id) ON DELETE CASCADE,
  
  -- Espaço cedido
  unidade_local_id UUID REFERENCES public.unidades_locais(id),
  nome_espaco TEXT NOT NULL, -- Nome do espaço (ex: Estádio Canarinho)
  descricao_espaco TEXT,
  
  -- Período de cessão
  data_inicio DATE NOT NULL,
  data_fim DATE,
  
  -- Dias e horários de uso
  dias_semana TEXT[], -- ['segunda', 'terca', 'sabado']
  horario_inicio TIME,
  horario_fim TIME,
  
  -- Documentação
  processo_sei TEXT,
  numero_termo_cessao TEXT,
  numero_portaria TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'ativo', -- ativo, encerrado, suspenso
  
  -- Observações
  observacoes TEXT,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Índices
CREATE INDEX idx_federacao_espacos_federacao ON public.federacao_espacos_cedidos(federacao_id);
CREATE INDEX idx_federacao_espacos_unidade ON public.federacao_espacos_cedidos(unidade_local_id);
CREATE INDEX idx_federacao_espacos_status ON public.federacao_espacos_cedidos(status);

-- RLS
ALTER TABLE public.federacao_espacos_cedidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Espaços cedidos visíveis para usuários autenticados"
ON public.federacao_espacos_cedidos FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Espaços cedidos gerenciáveis por admins"
ON public.federacao_espacos_cedidos FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'manager', 'presidencia', 'diraf')
  )
);

-- ============================================================
-- TABELA DE ÁRBITROS VINCULADOS A FEDERAÇÕES
-- ============================================================

CREATE TABLE public.federacao_arbitros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  federacao_id UUID NOT NULL REFERENCES public.federacoes_esportivas(id) ON DELETE CASCADE,
  
  -- Dados do árbitro
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  
  -- Modalidades
  modalidades TEXT[], -- ['futebol', 'futsal', 'beach soccer']
  
  -- Disponibilidade
  disponibilidade TEXT, -- 'integral', 'fins_de_semana', 'noturno', etc.
  
  -- Status
  ativo BOOLEAN NOT NULL DEFAULT true,
  
  -- Observações
  observacoes TEXT,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Índices
CREATE INDEX idx_federacao_arbitros_federacao ON public.federacao_arbitros(federacao_id);
CREATE INDEX idx_federacao_arbitros_ativo ON public.federacao_arbitros(ativo);

-- RLS
ALTER TABLE public.federacao_arbitros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Árbitros visíveis para usuários autenticados"
ON public.federacao_arbitros FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Árbitros gerenciáveis por admins"
ON public.federacao_arbitros FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'manager', 'presidencia', 'diraf')
  )
);

-- ============================================================
-- TRIGGER PARA UPDATED_AT
-- ============================================================

CREATE TRIGGER update_federacao_parcerias_updated_at
  BEFORE UPDATE ON public.federacao_parcerias
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_federacao_espacos_cedidos_updated_at
  BEFORE UPDATE ON public.federacao_espacos_cedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_federacao_arbitros_updated_at
  BEFORE UPDATE ON public.federacao_arbitros
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();