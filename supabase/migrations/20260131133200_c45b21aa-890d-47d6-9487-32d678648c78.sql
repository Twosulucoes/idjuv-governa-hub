-- Tabela para configuração de agrupamentos de unidades para impressão em lote
CREATE TABLE public.config_agrupamento_unidades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  cor VARCHAR(20) DEFAULT '#3b82f6',
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT config_agrupamento_unidades_nome_unique UNIQUE (nome)
);

-- Tabela de vínculo entre agrupamentos e unidades
CREATE TABLE public.agrupamento_unidade_vinculo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agrupamento_id UUID NOT NULL REFERENCES public.config_agrupamento_unidades(id) ON DELETE CASCADE,
  unidade_id UUID NOT NULL REFERENCES public.estrutura_organizacional(id) ON DELETE CASCADE,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT agrupamento_unidade_vinculo_unique UNIQUE (agrupamento_id, unidade_id)
);

-- Comentários
COMMENT ON TABLE public.config_agrupamento_unidades IS 'Configuração de agrupamentos de unidades para impressão em lote de frequência';
COMMENT ON TABLE public.agrupamento_unidade_vinculo IS 'Vínculo entre agrupamentos e unidades administrativas';

-- Habilitar RLS
ALTER TABLE public.config_agrupamento_unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agrupamento_unidade_vinculo ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para config_agrupamento_unidades
CREATE POLICY "config_agrupamento_unidades_select" ON public.config_agrupamento_unidades
FOR SELECT USING (
  public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.visualizar')
);

CREATE POLICY "config_agrupamento_unidades_insert" ON public.config_agrupamento_unidades
FOR INSERT WITH CHECK (
  public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.gerenciar')
);

CREATE POLICY "config_agrupamento_unidades_update" ON public.config_agrupamento_unidades
FOR UPDATE USING (
  public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.gerenciar')
);

CREATE POLICY "config_agrupamento_unidades_delete" ON public.config_agrupamento_unidades
FOR DELETE USING (
  public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.gerenciar')
);

-- Políticas RLS para agrupamento_unidade_vinculo
CREATE POLICY "agrupamento_unidade_vinculo_select" ON public.agrupamento_unidade_vinculo
FOR SELECT USING (
  public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.visualizar')
);

CREATE POLICY "agrupamento_unidade_vinculo_insert" ON public.agrupamento_unidade_vinculo
FOR INSERT WITH CHECK (
  public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.gerenciar')
);

CREATE POLICY "agrupamento_unidade_vinculo_update" ON public.agrupamento_unidade_vinculo
FOR UPDATE USING (
  public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.gerenciar')
);

CREATE POLICY "agrupamento_unidade_vinculo_delete" ON public.agrupamento_unidade_vinculo
FOR DELETE USING (
  public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.gerenciar')
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_config_agrupamento_unidades_updated_at
BEFORE UPDATE ON public.config_agrupamento_unidades
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices
CREATE INDEX idx_agrupamento_vinculo_agrupamento ON public.agrupamento_unidade_vinculo(agrupamento_id);
CREATE INDEX idx_agrupamento_vinculo_unidade ON public.agrupamento_unidade_vinculo(unidade_id);

-- Inserir agrupamentos padrão baseados na estrutura organizacional
INSERT INTO public.config_agrupamento_unidades (nome, descricao, ordem) VALUES
  ('Presidência e Assessorias', 'Presidência, Gabinete e unidades de assessoramento direto', 1),
  ('DIRAF - Administrativa e Financeira', 'Diretoria Administrativa e Financeira e suas divisões', 2),
  ('DIESP - Esporte', 'Diretoria de Esporte e suas divisões', 3),
  ('DIJUV - Juventude', 'Diretoria da Juventude e suas divisões', 4);