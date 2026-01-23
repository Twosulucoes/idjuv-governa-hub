-- Criar tabela para Federações Esportivas
CREATE TABLE public.federacoes_esportivas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Dados da Federação
  nome TEXT NOT NULL,
  sigla TEXT NOT NULL,
  data_criacao DATE NOT NULL,
  endereco TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT NOT NULL,
  instagram TEXT,
  
  -- Mandato da Diretoria
  mandato_inicio DATE NOT NULL,
  mandato_fim DATE NOT NULL,
  
  -- Presidente
  presidente_nome TEXT NOT NULL,
  presidente_nascimento DATE NOT NULL,
  presidente_telefone TEXT NOT NULL,
  presidente_email TEXT NOT NULL,
  presidente_endereco TEXT,
  presidente_instagram TEXT,
  
  -- Outros Dirigentes
  vice_presidente_nome TEXT NOT NULL,
  vice_presidente_telefone TEXT NOT NULL,
  diretor_tecnico_nome TEXT NOT NULL,
  diretor_tecnico_telefone TEXT NOT NULL,
  
  -- Controle
  status TEXT NOT NULL DEFAULT 'em_analise' CHECK (status IN ('em_analise', 'ativo', 'inativo', 'rejeitado')),
  observacoes_internas TEXT,
  analisado_por UUID REFERENCES auth.users(id),
  data_analise TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.federacoes_esportivas ENABLE ROW LEVEL SECURITY;

-- Política para permitir INSERT público (formulário sem login)
CREATE POLICY "Permitir cadastro público de federações"
ON public.federacoes_esportivas
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Política para leitura apenas por usuários autenticados
CREATE POLICY "Usuários autenticados podem visualizar federações"
ON public.federacoes_esportivas
FOR SELECT
TO authenticated
USING (true);

-- Política para atualização apenas por usuários autenticados
CREATE POLICY "Usuários autenticados podem atualizar federações"
ON public.federacoes_esportivas
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_federacoes_esportivas_updated_at
BEFORE UPDATE ON public.federacoes_esportivas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para busca
CREATE INDEX idx_federacoes_status ON public.federacoes_esportivas(status);
CREATE INDEX idx_federacoes_sigla ON public.federacoes_esportivas(sigla);

-- Comentários
COMMENT ON TABLE public.federacoes_esportivas IS 'Cadastro de Federações Esportivas vinculadas ao IDJuv';
COMMENT ON COLUMN public.federacoes_esportivas.status IS 'Status: em_analise, ativo, inativo, rejeitado';