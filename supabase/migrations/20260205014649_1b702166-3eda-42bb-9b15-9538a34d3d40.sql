-- Criar enum para tipo de instituição
CREATE TYPE public.tipo_instituicao AS ENUM ('formal', 'informal', 'orgao_publico');

-- Criar enum para esfera de governo
CREATE TYPE public.esfera_governo AS ENUM ('municipal', 'estadual', 'federal');

-- Criar enum para status de instituição
CREATE TYPE public.status_instituicao AS ENUM ('ativo', 'inativo', 'pendente_validacao');

-- Criar tabela de instituições
CREATE TABLE public.instituicoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_instituicao TEXT UNIQUE,
  tipo_instituicao public.tipo_instituicao NOT NULL,
  nome_razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  cnpj TEXT,
  inscricao_estadual TEXT,
  esfera_governo public.esfera_governo,
  orgao_vinculado TEXT,
  endereco_logradouro TEXT,
  endereco_numero TEXT,
  endereco_complemento TEXT,
  endereco_bairro TEXT,
  endereco_cidade TEXT,
  endereco_uf TEXT,
  endereco_cep TEXT,
  telefone TEXT,
  email TEXT,
  site TEXT,
  responsavel_nome TEXT NOT NULL,
  responsavel_cpf TEXT,
  responsavel_cargo TEXT,
  responsavel_telefone TEXT,
  responsavel_email TEXT,
  ato_constituicao TEXT,
  ato_documento_url TEXT,
  data_fundacao DATE,
  area_atuacao TEXT[],
  observacoes TEXT,
  status public.status_instituicao NOT NULL DEFAULT 'ativo',
  validado_por UUID,
  data_validacao TIMESTAMPTZ,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

-- Criar função para gerar código sequencial de instituição
CREATE OR REPLACE FUNCTION public.generate_codigo_instituicao()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(codigo_instituicao FROM 5) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.instituicoes;
  
  NEW.codigo_instituicao := 'INS-' || LPAD(next_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger para auto-gerar código
CREATE TRIGGER trigger_generate_codigo_instituicao
  BEFORE INSERT ON public.instituicoes
  FOR EACH ROW
  WHEN (NEW.codigo_instituicao IS NULL)
  EXECUTE FUNCTION public.generate_codigo_instituicao();

-- Trigger para atualizar updated_at
CREATE TRIGGER update_instituicoes_updated_at
  BEFORE UPDATE ON public.instituicoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar coluna instituicao_id na agenda_unidade
ALTER TABLE public.agenda_unidade 
ADD COLUMN IF NOT EXISTS instituicao_id UUID REFERENCES public.instituicoes(id);

-- Adicionar coluna numero_processo_sei na agenda_unidade
ALTER TABLE public.agenda_unidade 
ADD COLUMN IF NOT EXISTS numero_processo_sei TEXT;

-- Criar função para validar processo SEI antes de aprovar
CREATE OR REPLACE FUNCTION public.validate_processo_sei_para_aprovacao()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'aprovado' AND OLD.status != 'aprovado' THEN
    IF NEW.numero_processo_sei IS NULL OR TRIM(NEW.numero_processo_sei) = '' THEN
      RAISE EXCEPTION 'É obrigatório informar o número do processo SEI para aprovar a solicitação';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger para validar processo SEI
CREATE TRIGGER trigger_validate_processo_sei
  BEFORE UPDATE ON public.agenda_unidade
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_processo_sei_para_aprovacao();

-- Criar view resumida de instituições
CREATE OR REPLACE VIEW public.v_instituicoes_resumo AS
SELECT 
  i.id,
  i.codigo_instituicao,
  i.tipo_instituicao,
  i.nome_razao_social,
  i.nome_fantasia,
  i.cnpj,
  i.esfera_governo,
  i.orgao_vinculado,
  i.endereco_cidade,
  i.endereco_uf,
  i.telefone,
  i.email,
  i.responsavel_nome,
  i.responsavel_cargo,
  i.status,
  i.ativo,
  i.created_at,
  (SELECT COUNT(*) FROM public.agenda_unidade a WHERE a.instituicao_id = i.id) as total_solicitacoes,
  (SELECT COUNT(*) FROM public.agenda_unidade a WHERE a.instituicao_id = i.id AND a.status = 'aprovado') as solicitacoes_aprovadas
FROM public.instituicoes i;

-- Habilitar RLS
ALTER TABLE public.instituicoes ENABLE ROW LEVEL SECURITY;

-- Política para visualização
CREATE POLICY "Usuarios autenticados podem visualizar instituicoes ativas"
ON public.instituicoes
FOR SELECT
USING (auth.uid() IS NOT NULL AND (ativo = true OR status = 'ativo'));

-- Política para inserção
CREATE POLICY "Usuarios autenticados podem criar instituicoes"
ON public.instituicoes
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Política para atualização
CREATE POLICY "Usuarios autenticados podem atualizar instituicoes"
ON public.instituicoes
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Política para exclusão
CREATE POLICY "Usuarios autenticados podem excluir instituicoes"
ON public.instituicoes
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Criar índices para performance
CREATE INDEX idx_instituicoes_tipo ON public.instituicoes(tipo_instituicao);
CREATE INDEX idx_instituicoes_status ON public.instituicoes(status);
CREATE INDEX idx_instituicoes_cnpj ON public.instituicoes(cnpj) WHERE cnpj IS NOT NULL;
CREATE INDEX idx_instituicoes_nome ON public.instituicoes(nome_razao_social);
CREATE INDEX idx_agenda_unidade_instituicao ON public.agenda_unidade(instituicao_id) WHERE instituicao_id IS NOT NULL;
CREATE INDEX idx_agenda_unidade_processo_sei ON public.agenda_unidade(numero_processo_sei) WHERE numero_processo_sei IS NOT NULL;