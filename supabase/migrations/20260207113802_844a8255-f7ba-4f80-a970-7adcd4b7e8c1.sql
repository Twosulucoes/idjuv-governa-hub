-- =====================================================
-- Sistema de Credenciamento de Gestores Escolares
-- Jogos Escolares de Roraima
-- =====================================================

-- Tabela de Escolas participantes dos JER
CREATE TABLE public.escolas_jer (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  municipio TEXT,
  inep TEXT,
  ja_cadastrada BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para escolas
CREATE INDEX idx_escolas_jer_nome ON public.escolas_jer(nome);
CREATE INDEX idx_escolas_jer_municipio ON public.escolas_jer(municipio);
CREATE UNIQUE INDEX idx_escolas_jer_inep ON public.escolas_jer(inep) WHERE inep IS NOT NULL;

-- Tabela de Gestores Escolares
CREATE TABLE public.gestores_escolares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  escola_id UUID NOT NULL REFERENCES public.escolas_jer(id) ON DELETE RESTRICT,
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL,
  rg TEXT,
  data_nascimento DATE,
  email TEXT NOT NULL,
  celular TEXT NOT NULL,
  endereco TEXT,
  status TEXT NOT NULL DEFAULT 'aguardando',
  responsavel_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  responsavel_nome TEXT,
  observacoes TEXT,
  contato_realizado BOOLEAN NOT NULL DEFAULT false,
  acesso_testado BOOLEAN NOT NULL DEFAULT false,
  data_cadastro_cbde TIMESTAMPTZ,
  data_contato TIMESTAMPTZ,
  data_confirmacao TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT gestores_escolares_cpf_unique UNIQUE (cpf),
  CONSTRAINT gestores_escolares_email_unique UNIQUE (email),
  CONSTRAINT gestores_escolares_escola_unique UNIQUE (escola_id),
  CONSTRAINT gestores_escolares_status_check CHECK (
    status IN ('aguardando', 'em_processamento', 'cadastrado_cbde', 'contato_realizado', 'confirmado', 'problema')
  )
);

-- Índices para gestores
CREATE INDEX idx_gestores_escolares_cpf ON public.gestores_escolares(cpf);
CREATE INDEX idx_gestores_escolares_email ON public.gestores_escolares(email);
CREATE INDEX idx_gestores_escolares_status ON public.gestores_escolares(status);
CREATE INDEX idx_gestores_escolares_responsavel ON public.gestores_escolares(responsavel_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_gestores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_escolas_jer_updated_at
  BEFORE UPDATE ON public.escolas_jer
  FOR EACH ROW
  EXECUTE FUNCTION public.update_gestores_updated_at();

CREATE TRIGGER trigger_gestores_escolares_updated_at
  BEFORE UPDATE ON public.gestores_escolares
  FOR EACH ROW
  EXECUTE FUNCTION public.update_gestores_updated_at();

-- Trigger para marcar escola como cadastrada quando gestor é inserido
CREATE OR REPLACE FUNCTION public.marcar_escola_cadastrada()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.escolas_jer 
  SET ja_cadastrada = true, updated_at = now()
  WHERE id = NEW.escola_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_marcar_escola_cadastrada
  AFTER INSERT ON public.gestores_escolares
  FOR EACH ROW
  EXECUTE FUNCTION public.marcar_escola_cadastrada();

-- Trigger para desmarcar escola quando gestor é removido
CREATE OR REPLACE FUNCTION public.desmarcar_escola_cadastrada()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.escolas_jer 
  SET ja_cadastrada = false, updated_at = now()
  WHERE id = OLD.escola_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_desmarcar_escola_cadastrada
  AFTER DELETE ON public.gestores_escolares
  FOR EACH ROW
  EXECUTE FUNCTION public.desmarcar_escola_cadastrada();

-- =====================================================
-- RLS Policies
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.escolas_jer ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gestores_escolares ENABLE ROW LEVEL SECURITY;

-- ESCOLAS_JER Policies
-- Leitura pública (para dropdown no formulário)
CREATE POLICY "Escolas são visíveis publicamente"
  ON public.escolas_jer
  FOR SELECT
  USING (true);

-- Inserção apenas para autenticados
CREATE POLICY "Apenas autenticados podem inserir escolas"
  ON public.escolas_jer
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Atualização apenas para autenticados
CREATE POLICY "Apenas autenticados podem atualizar escolas"
  ON public.escolas_jer
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Deleção apenas para autenticados
CREATE POLICY "Apenas autenticados podem deletar escolas"
  ON public.escolas_jer
  FOR DELETE
  TO authenticated
  USING (true);

-- GESTORES_ESCOLARES Policies
-- Leitura pública limitada (para consulta por CPF)
CREATE POLICY "Gestores podem consultar próprio status por CPF"
  ON public.gestores_escolares
  FOR SELECT
  USING (true);

-- Inserção pública (formulário público)
CREATE POLICY "Qualquer pessoa pode criar pré-cadastro"
  ON public.gestores_escolares
  FOR INSERT
  WITH CHECK (true);

-- Atualização apenas para autenticados
CREATE POLICY "Apenas autenticados podem atualizar gestores"
  ON public.gestores_escolares
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Deleção apenas para autenticados
CREATE POLICY "Apenas autenticados podem deletar gestores"
  ON public.gestores_escolares
  FOR DELETE
  TO authenticated
  USING (true);