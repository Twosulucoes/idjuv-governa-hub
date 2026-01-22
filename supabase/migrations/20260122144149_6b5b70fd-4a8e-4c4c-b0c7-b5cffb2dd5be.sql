
-- ============================================
-- MÓDULO DE DEMANDAS DA ASCOM - IDJuv
-- ============================================

-- Enum para tipos de demanda
CREATE TYPE public.tipo_demanda_ascom AS ENUM (
  'cobertura_fotografica',
  'cobertura_audiovisual',
  'cobertura_jornalistica',
  'cobertura_redes_sociais',
  'cobertura_transmissao_ao_vivo',
  'arte_redes_sociais',
  'arte_banner',
  'arte_cartaz',
  'arte_folder',
  'arte_convite',
  'arte_certificado',
  'arte_identidade_visual',
  'conteudo_noticia_site',
  'conteudo_texto_redes',
  'conteudo_nota_oficial',
  'conteudo_release',
  'conteudo_discurso',
  'redes_publicacao_programada',
  'redes_campanha',
  'redes_cobertura_tempo_real',
  'imprensa_atendimento',
  'imprensa_agendamento_entrevista',
  'imprensa_resposta_oficial',
  'imprensa_nota_esclarecimento',
  'emergencial_crise',
  'emergencial_nota_urgente',
  'emergencial_posicionamento'
);

-- Enum para categorias de demanda
CREATE TYPE public.categoria_demanda_ascom AS ENUM (
  'cobertura_institucional',
  'criacao_artes',
  'conteudo_institucional',
  'gestao_redes_sociais',
  'imprensa_relacoes',
  'demandas_emergenciais'
);

-- Enum para status de demanda
CREATE TYPE public.status_demanda_ascom AS ENUM (
  'rascunho',
  'enviada',
  'em_analise',
  'aguardando_autorizacao',
  'aprovada',
  'em_execucao',
  'concluida',
  'indeferida',
  'cancelada'
);

-- Enum para prioridade
CREATE TYPE public.prioridade_demanda_ascom AS ENUM (
  'baixa',
  'normal',
  'alta',
  'urgente'
);

-- Tabela principal de demandas
CREATE TABLE public.demandas_ascom (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação da demanda
  numero_demanda VARCHAR(20) UNIQUE,
  ano INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  
  -- Solicitante
  unidade_solicitante_id UUID REFERENCES public.estrutura_organizacional(id),
  servidor_solicitante_id UUID REFERENCES public.servidores(id),
  nome_responsavel VARCHAR(255) NOT NULL,
  cargo_funcao VARCHAR(255),
  contato_telefone VARCHAR(20),
  contato_email VARCHAR(255),
  
  -- Classificação
  categoria categoria_demanda_ascom NOT NULL,
  tipo tipo_demanda_ascom NOT NULL,
  
  -- Detalhamento
  titulo VARCHAR(255) NOT NULL,
  descricao_detalhada TEXT NOT NULL,
  objetivo_institucional TEXT,
  publico_alvo TEXT,
  
  -- Datas e Prazos
  data_evento DATE,
  hora_evento TIME,
  local_evento TEXT,
  prazo_entrega DATE NOT NULL,
  
  -- Status e Controle
  status status_demanda_ascom NOT NULL DEFAULT 'rascunho',
  prioridade prioridade_demanda_ascom NOT NULL DEFAULT 'normal',
  requer_autorizacao_presidencia BOOLEAN DEFAULT false,
  
  -- Execução ASCOM
  responsavel_ascom_id UUID REFERENCES public.servidores(id),
  data_inicio_execucao TIMESTAMP WITH TIME ZONE,
  data_conclusao TIMESTAMP WITH TIME ZONE,
  observacoes_internas_ascom TEXT,
  
  -- Aprovação/Indeferimento
  aprovado_por_id UUID REFERENCES public.servidores(id),
  data_aprovacao TIMESTAMP WITH TIME ZONE,
  autorizado_presidencia_por_id UUID REFERENCES public.servidores(id),
  data_autorizacao_presidencia TIMESTAMP WITH TIME ZONE,
  justificativa_indeferimento TEXT,
  
  -- Histórico
  historico_status JSONB DEFAULT '[]'::jsonb,
  
  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Tabela de anexos da demanda
CREATE TABLE public.demandas_ascom_anexos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demanda_id UUID NOT NULL REFERENCES public.demandas_ascom(id) ON DELETE CASCADE,
  
  tipo_anexo VARCHAR(50) NOT NULL, -- 'solicitacao', 'entregavel', 'referencia'
  nome_arquivo VARCHAR(255) NOT NULL,
  descricao TEXT,
  url_arquivo TEXT NOT NULL,
  tipo_mime VARCHAR(100),
  tamanho_bytes BIGINT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Tabela de entregáveis
CREATE TABLE public.demandas_ascom_entregaveis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demanda_id UUID NOT NULL REFERENCES public.demandas_ascom(id) ON DELETE CASCADE,
  
  tipo_entregavel VARCHAR(100) NOT NULL,
  descricao TEXT NOT NULL,
  url_arquivo TEXT,
  link_publicacao TEXT,
  data_entrega TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Relatório de cobertura
  relatorio_cobertura TEXT,
  metricas JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Tabela de comentários/histórico
CREATE TABLE public.demandas_ascom_comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demanda_id UUID NOT NULL REFERENCES public.demandas_ascom(id) ON DELETE CASCADE,
  
  tipo VARCHAR(50) NOT NULL DEFAULT 'comentario', -- 'comentario', 'status', 'interno'
  conteudo TEXT NOT NULL,
  visivel_solicitante BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Função para gerar número da demanda
CREATE OR REPLACE FUNCTION public.gerar_numero_demanda_ascom()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ano INTEGER;
  v_sequencial INTEGER;
BEGIN
  v_ano := EXTRACT(YEAR FROM CURRENT_DATE);
  
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(numero_demanda, '/', 1) AS INTEGER)
  ), 0) + 1
  INTO v_sequencial
  FROM public.demandas_ascom
  WHERE ano = v_ano;
  
  NEW.numero_demanda := LPAD(v_sequencial::TEXT, 4, '0') || '/' || v_ano || '-ASCOM';
  NEW.ano := v_ano;
  
  RETURN NEW;
END;
$$;

-- Trigger para gerar número automaticamente
CREATE TRIGGER tr_gerar_numero_demanda_ascom
  BEFORE INSERT ON public.demandas_ascom
  FOR EACH ROW
  WHEN (NEW.numero_demanda IS NULL)
  EXECUTE FUNCTION public.gerar_numero_demanda_ascom();

-- Função para verificar se demanda requer autorização da presidência
CREATE OR REPLACE FUNCTION public.verificar_autorizacao_presidencia_ascom()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Tipos que requerem autorização da presidência
  IF NEW.tipo IN (
    'conteudo_nota_oficial',
    'emergencial_crise',
    'imprensa_agendamento_entrevista',
    'emergencial_posicionamento',
    'redes_campanha'
  ) THEN
    NEW.requer_autorizacao_presidencia := true;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_verificar_autorizacao_presidencia
  BEFORE INSERT OR UPDATE ON public.demandas_ascom
  FOR EACH ROW
  EXECUTE FUNCTION public.verificar_autorizacao_presidencia_ascom();

-- Função para registrar histórico de status
CREATE OR REPLACE FUNCTION public.registrar_historico_demanda_ascom()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.historico_status := COALESCE(OLD.historico_status, '[]'::jsonb) || 
      jsonb_build_object(
        'status_anterior', OLD.status,
        'status_novo', NEW.status,
        'data', NOW(),
        'usuario_id', auth.uid()
      );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_historico_demanda_ascom
  BEFORE UPDATE ON public.demandas_ascom
  FOR EACH ROW
  EXECUTE FUNCTION public.registrar_historico_demanda_ascom();

-- Trigger updated_at
CREATE TRIGGER update_demandas_ascom_updated_at
  BEFORE UPDATE ON public.demandas_ascom
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.demandas_ascom ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demandas_ascom_anexos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demandas_ascom_entregaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demandas_ascom_comentarios ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para demandas_ascom
CREATE POLICY "Usuários autenticados podem visualizar demandas"
  ON public.demandas_ascom
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar demandas"
  ON public.demandas_ascom
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "ASCOM e Admin podem atualizar demandas"
  ON public.demandas_ascom
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = created_by 
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'ascom'::app_role)
    OR public.has_role(auth.uid(), 'presidencia'::app_role)
  );

-- Políticas RLS para anexos
CREATE POLICY "Usuários autenticados podem visualizar anexos"
  ON public.demandas_ascom_anexos
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar anexos"
  ON public.demandas_ascom_anexos
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Criador e ASCOM podem deletar anexos"
  ON public.demandas_ascom_anexos
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = created_by 
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'ascom'::app_role)
  );

-- Políticas RLS para entregáveis
CREATE POLICY "Usuários autenticados podem visualizar entregáveis"
  ON public.demandas_ascom_entregaveis
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "ASCOM pode gerenciar entregáveis"
  ON public.demandas_ascom_entregaveis
  FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'ascom'::app_role)
  );

-- Políticas RLS para comentários
CREATE POLICY "Usuários podem ver comentários visíveis"
  ON public.demandas_ascom_comentarios
  FOR SELECT
  TO authenticated
  USING (
    visivel_solicitante = true 
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'ascom'::app_role)
  );

CREATE POLICY "Usuários autenticados podem criar comentários"
  ON public.demandas_ascom_comentarios
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Adicionar role ASCOM se não existir
DO $$
BEGIN
  -- Verificar se o tipo já tem o valor 'ascom'
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'ascom' 
    AND enumtypid = 'public.app_role'::regtype
  ) THEN
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ascom';
  END IF;
END $$;

-- Criar bucket para arquivos da ASCOM
INSERT INTO storage.buckets (id, name, public)
VALUES ('ascom-demandas', 'ascom-demandas', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage
CREATE POLICY "Usuários autenticados podem fazer upload"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'ascom-demandas');

CREATE POLICY "Usuários autenticados podem visualizar arquivos ASCOM"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'ascom-demandas');

CREATE POLICY "ASCOM pode deletar arquivos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'ascom-demandas' 
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'ascom'::app_role)
    )
  );
