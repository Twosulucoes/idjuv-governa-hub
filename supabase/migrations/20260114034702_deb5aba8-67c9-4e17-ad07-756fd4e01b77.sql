-- Criar tabela de designações
CREATE TABLE public.designacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    servidor_id UUID NOT NULL REFERENCES servidores(id) ON DELETE CASCADE,
    lotacao_id UUID REFERENCES lotacoes(id),
    
    -- Onde está lotado vs onde vai trabalhar
    unidade_origem_id UUID NOT NULL REFERENCES estrutura_organizacional(id),
    unidade_destino_id UUID NOT NULL REFERENCES estrutura_organizacional(id),
    
    -- Período
    data_inicio DATE NOT NULL,
    data_fim DATE,
    
    -- Aprovação
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'rejeitada', 'encerrada')),
    aprovado_por UUID REFERENCES profiles(id),
    data_aprovacao TIMESTAMP WITH TIME ZONE,
    motivo_rejeicao TEXT,
    
    -- Ato administrativo
    ato_tipo TEXT,
    ato_numero TEXT,
    ato_data DATE,
    ato_doe_numero TEXT,
    ato_doe_data DATE,
    
    -- Metadados
    justificativa TEXT,
    observacao TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_designacoes_servidor_id ON public.designacoes(servidor_id);
CREATE INDEX idx_designacoes_status ON public.designacoes(status);
CREATE INDEX idx_designacoes_unidade_destino ON public.designacoes(unidade_destino_id);
CREATE INDEX idx_designacoes_ativo ON public.designacoes(ativo) WHERE ativo = true;

-- Trigger para updated_at
CREATE TRIGGER update_designacoes_updated_at
    BEFORE UPDATE ON public.designacoes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.designacoes ENABLE ROW LEVEL SECURITY;

-- Política de leitura para usuários autenticados
CREATE POLICY "Usuários autenticados podem ler designacoes"
ON public.designacoes FOR SELECT TO authenticated USING (true);

-- Política de inserção para usuários autenticados
CREATE POLICY "Usuários autenticados podem criar designacoes"
ON public.designacoes FOR INSERT TO authenticated
WITH CHECK (true);

-- Política de atualização para admins e RH
CREATE POLICY "Admins podem atualizar designacoes"
ON public.designacoes FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'ti_admin', 'presidencia', 'rh')
  )
);

-- Política de exclusão para admins
CREATE POLICY "Admins podem deletar designacoes"
ON public.designacoes FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'ti_admin')
  )
);

-- Comentários
COMMENT ON TABLE public.designacoes IS 'Designações temporárias de servidores para trabalhar em outras unidades';
COMMENT ON COLUMN public.designacoes.unidade_origem_id IS 'Unidade onde o servidor está lotado oficialmente';
COMMENT ON COLUMN public.designacoes.unidade_destino_id IS 'Unidade onde o servidor vai trabalhar temporariamente';