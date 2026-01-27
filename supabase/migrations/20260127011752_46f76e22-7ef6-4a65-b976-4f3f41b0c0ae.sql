-- =========================================
-- SISTEMA DE DADOS OFICIAIS E RASCUNHOS
-- =========================================

-- Enum para tipos de conteúdo institucional
DO $$ BEGIN
  CREATE TYPE public.tipo_conteudo_institucional AS ENUM (
    'missao',
    'visao',
    'valores',
    'objetivos_estrategicos',
    'descricao_programa',
    'slogan',
    'narrativa_institucional',
    'identidade_visual'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Enum para status do conteúdo
DO $$ BEGIN
  CREATE TYPE public.status_conteudo AS ENUM (
    'rascunho',
    'em_revisao',
    'aprovado',
    'publicado',
    'arquivado'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =========================================
-- TABELA: DADOS OFICIAIS (READ-ONLY BY DEFAULT)
-- =========================================

CREATE TABLE IF NOT EXISTS public.dados_oficiais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave TEXT NOT NULL UNIQUE,
  valor TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT DEFAULT 'geral',
  lei_referencia TEXT,
  documento_url TEXT,
  bloqueado BOOLEAN DEFAULT true,
  ultima_alteracao_por UUID REFERENCES auth.users(id),
  ultima_alteracao_em TIMESTAMPTZ DEFAULT now(),
  motivo_alteracao TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dados_oficiais_chave ON public.dados_oficiais(chave);
CREATE INDEX IF NOT EXISTS idx_dados_oficiais_categoria ON public.dados_oficiais(categoria);

ALTER TABLE public.dados_oficiais ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Dados oficiais são públicos para leitura" ON public.dados_oficiais;
CREATE POLICY "Dados oficiais são públicos para leitura"
  ON public.dados_oficiais FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Apenas super_admin pode inserir dados oficiais" ON public.dados_oficiais;
CREATE POLICY "Apenas super_admin pode inserir dados oficiais"
  ON public.dados_oficiais FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.usuario_perfis up
      JOIN public.perfis p ON up.perfil_id = p.id
      WHERE up.user_id = auth.uid() AND p.codigo = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "Apenas super_admin pode atualizar dados oficiais" ON public.dados_oficiais;
CREATE POLICY "Apenas super_admin pode atualizar dados oficiais"
  ON public.dados_oficiais FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.usuario_perfis up
      JOIN public.perfis p ON up.perfil_id = p.id
      WHERE up.user_id = auth.uid() AND p.codigo = 'super_admin'
    )
  );

-- =========================================
-- TABELA: CONTEUDO RASCUNHO
-- =========================================

CREATE TABLE IF NOT EXISTS public.conteudo_rascunho (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo public.tipo_conteudo_institucional NOT NULL,
  identificador TEXT,
  titulo TEXT,
  conteudo TEXT NOT NULL,
  conteudo_estruturado JSONB,
  status public.status_conteudo DEFAULT 'rascunho',
  criado_por UUID REFERENCES auth.users(id),
  atualizado_por UUID REFERENCES auth.users(id),
  aprovado_por UUID REFERENCES auth.users(id),
  aprovado_em TIMESTAMPTZ,
  motivo_rejeicao TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conteudo_rascunho_tipo ON public.conteudo_rascunho(tipo);
CREATE INDEX IF NOT EXISTS idx_conteudo_rascunho_status ON public.conteudo_rascunho(status);
CREATE INDEX IF NOT EXISTS idx_conteudo_rascunho_identificador ON public.conteudo_rascunho(identificador);

ALTER TABLE public.conteudo_rascunho ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Apenas admins podem ver rascunhos" ON public.conteudo_rascunho;
CREATE POLICY "Apenas admins podem ver rascunhos"
  ON public.conteudo_rascunho FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.usuario_perfis up
      JOIN public.perfis p ON up.perfil_id = p.id
      WHERE up.user_id = auth.uid() 
      AND p.codigo IN ('super_admin', 'admin', 'gestor_conteudo')
    )
  );

DROP POLICY IF EXISTS "Gestores de conteúdo podem criar rascunhos" ON public.conteudo_rascunho;
CREATE POLICY "Gestores de conteúdo podem criar rascunhos"
  ON public.conteudo_rascunho FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.usuario_perfis up
      JOIN public.perfis p ON up.perfil_id = p.id
      WHERE up.user_id = auth.uid() 
      AND p.codigo IN ('super_admin', 'admin', 'gestor_conteudo')
    )
  );

DROP POLICY IF EXISTS "Gestores de conteúdo podem atualizar rascunhos" ON public.conteudo_rascunho;
CREATE POLICY "Gestores de conteúdo podem atualizar rascunhos"
  ON public.conteudo_rascunho FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.usuario_perfis up
      JOIN public.perfis p ON up.perfil_id = p.id
      WHERE up.user_id = auth.uid() 
      AND p.codigo IN ('super_admin', 'admin', 'gestor_conteudo')
    )
  );

DROP POLICY IF EXISTS "Apenas super_admin pode excluir rascunhos" ON public.conteudo_rascunho;
CREATE POLICY "Apenas super_admin pode excluir rascunhos"
  ON public.conteudo_rascunho FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.usuario_perfis up
      JOIN public.perfis p ON up.perfil_id = p.id
      WHERE up.user_id = auth.uid() AND p.codigo = 'super_admin'
    )
  );

-- =========================================
-- TABELA: HISTÓRICO DE CONTEÚDO OFICIAL
-- =========================================

CREATE TABLE IF NOT EXISTS public.historico_conteudo_oficial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo public.tipo_conteudo_institucional NOT NULL,
  identificador TEXT,
  titulo TEXT,
  conteudo TEXT NOT NULL,
  conteudo_estruturado JSONB,
  versao INTEGER NOT NULL DEFAULT 1,
  promovido_por UUID REFERENCES auth.users(id),
  promovido_em TIMESTAMPTZ DEFAULT now(),
  justificativa TEXT,
  documento_aprovacao_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_historico_conteudo_tipo ON public.historico_conteudo_oficial(tipo);
CREATE INDEX IF NOT EXISTS idx_historico_conteudo_versao ON public.historico_conteudo_oficial(tipo, versao DESC);

ALTER TABLE public.historico_conteudo_oficial ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Histórico oficial é público" ON public.historico_conteudo_oficial;
CREATE POLICY "Histórico oficial é público"
  ON public.historico_conteudo_oficial FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Apenas super_admin pode inserir histórico" ON public.historico_conteudo_oficial;
CREATE POLICY "Apenas super_admin pode inserir histórico"
  ON public.historico_conteudo_oficial FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.usuario_perfis up
      JOIN public.perfis p ON up.perfil_id = p.id
      WHERE up.user_id = auth.uid() AND p.codigo = 'super_admin'
    )
  );

-- =========================================
-- ADICIONAR COLUNAS À ESTRUTURA ORGANIZACIONAL
-- =========================================

ALTER TABLE public.estrutura_organizacional 
ADD COLUMN IF NOT EXISTS base_legal BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ordem_exibicao INTEGER DEFAULT 0;

-- =========================================
-- FUNÇÃO: OBTER DADO OFICIAL
-- =========================================

CREATE OR REPLACE FUNCTION public.obter_dado_oficial(p_chave TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT valor FROM public.dados_oficiais WHERE chave = p_chave LIMIT 1;
$$;

-- =========================================
-- FUNÇÃO: PROMOVER RASCUNHO PARA OFICIAL
-- =========================================

CREATE OR REPLACE FUNCTION public.promover_rascunho(
  p_rascunho_id UUID,
  p_justificativa TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rascunho RECORD;
  v_proxima_versao INTEGER;
BEGIN
  -- Verificar se usuário é super_admin
  IF NOT EXISTS (
    SELECT 1 FROM public.usuario_perfis up
    JOIN public.perfis p ON up.perfil_id = p.id
    WHERE up.user_id = auth.uid() AND p.codigo = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Apenas Super Admin pode promover conteúdo';
  END IF;

  SELECT * INTO v_rascunho FROM public.conteudo_rascunho WHERE id = p_rascunho_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Rascunho não encontrado';
  END IF;
  
  SELECT COALESCE(MAX(versao), 0) + 1 INTO v_proxima_versao
  FROM public.historico_conteudo_oficial
  WHERE tipo = v_rascunho.tipo AND identificador IS NOT DISTINCT FROM v_rascunho.identificador;
  
  INSERT INTO public.historico_conteudo_oficial (
    tipo, identificador, titulo, conteudo, conteudo_estruturado,
    versao, promovido_por, justificativa
  ) VALUES (
    v_rascunho.tipo, v_rascunho.identificador, v_rascunho.titulo,
    v_rascunho.conteudo, v_rascunho.conteudo_estruturado,
    v_proxima_versao, auth.uid(), p_justificativa
  );
  
  UPDATE public.conteudo_rascunho
  SET status = 'publicado',
      aprovado_por = auth.uid(),
      aprovado_em = now(),
      updated_at = now()
  WHERE id = p_rascunho_id;
  
  RETURN true;
END;
$$;

-- =========================================
-- TRIGGERS
-- =========================================

CREATE OR REPLACE FUNCTION public.update_dados_oficiais_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.ultima_alteracao_em = now();
  NEW.ultima_alteracao_por = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trigger_dados_oficiais_updated_at ON public.dados_oficiais;
CREATE TRIGGER trigger_dados_oficiais_updated_at
  BEFORE UPDATE ON public.dados_oficiais
  FOR EACH ROW
  EXECUTE FUNCTION public.update_dados_oficiais_updated_at();

CREATE OR REPLACE FUNCTION public.update_conteudo_rascunho_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.atualizado_por = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trigger_conteudo_rascunho_updated_at ON public.conteudo_rascunho;
CREATE TRIGGER trigger_conteudo_rascunho_updated_at
  BEFORE UPDATE ON public.conteudo_rascunho
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conteudo_rascunho_updated_at();

-- Permissões
GRANT EXECUTE ON FUNCTION public.obter_dado_oficial(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.promover_rascunho(UUID, TEXT) TO authenticated;