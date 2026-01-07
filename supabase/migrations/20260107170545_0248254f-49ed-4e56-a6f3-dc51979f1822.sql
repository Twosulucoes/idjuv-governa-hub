
-- Criar tabela para memorandos de lotação com protocolo e registro de entrega
CREATE TABLE public.memorandos_lotacao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_protocolo VARCHAR(50) NOT NULL UNIQUE,
  ano INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  
  -- Referência à lotação
  lotacao_id UUID NOT NULL REFERENCES public.lotacoes(id) ON DELETE CASCADE,
  
  -- Dados do servidor
  servidor_id UUID NOT NULL REFERENCES public.profiles(id),
  servidor_nome TEXT NOT NULL,
  servidor_matricula TEXT,
  
  -- Dados da lotação
  unidade_destino_id UUID NOT NULL REFERENCES public.estrutura_organizacional(id),
  unidade_destino_nome TEXT NOT NULL,
  cargo_id UUID REFERENCES public.cargos(id),
  cargo_nome TEXT,
  tipo_movimentacao TEXT NOT NULL,
  data_inicio_exercicio DATE NOT NULL,
  
  -- Dados do documento
  data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
  emitido_por UUID REFERENCES public.profiles(id),
  emitido_por_nome TEXT,
  
  -- Registro de entrega
  entregue BOOLEAN DEFAULT false,
  data_entrega TIMESTAMP WITH TIME ZONE,
  recebido_por TEXT,
  assinatura_recebimento TEXT,
  observacoes_entrega TEXT,
  
  -- Documento PDF
  documento_url TEXT,
  
  -- Metadados
  observacoes TEXT,
  status VARCHAR(20) DEFAULT 'gerado' CHECK (status IN ('gerado', 'entregue', 'cancelado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX idx_memorandos_lotacao_servidor ON public.memorandos_lotacao(servidor_id);
CREATE INDEX idx_memorandos_lotacao_lotacao ON public.memorandos_lotacao(lotacao_id);
CREATE INDEX idx_memorandos_lotacao_protocolo ON public.memorandos_lotacao(numero_protocolo);
CREATE INDEX idx_memorandos_lotacao_ano ON public.memorandos_lotacao(ano);

-- Trigger para updated_at
CREATE TRIGGER update_memorandos_lotacao_updated_at
  BEFORE UPDATE ON public.memorandos_lotacao
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.memorandos_lotacao ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins podem gerenciar memorandos"
  ON public.memorandos_lotacao FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Managers podem visualizar e criar memorandos"
  ON public.memorandos_lotacao FOR SELECT
  USING (has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Managers podem inserir memorandos"
  ON public.memorandos_lotacao FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Servidores podem ver próprios memorandos"
  ON public.memorandos_lotacao FOR SELECT
  USING (servidor_id = auth.uid());

-- Função para gerar número de protocolo
CREATE OR REPLACE FUNCTION public.gerar_protocolo_memorando_lotacao()
RETURNS VARCHAR(50)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ano INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
  v_sequencial INTEGER;
  v_protocolo VARCHAR(50);
BEGIN
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(numero_protocolo, '/', 1) AS INTEGER)
  ), 0) + 1 INTO v_sequencial
  FROM public.memorandos_lotacao
  WHERE ano = v_ano;
  
  v_protocolo := LPAD(v_sequencial::TEXT, 4, '0') || '/' || v_ano || '-MEMO-LOT';
  
  RETURN v_protocolo;
END;
$$;
