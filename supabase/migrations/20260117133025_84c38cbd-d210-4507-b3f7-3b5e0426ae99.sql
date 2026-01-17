-- =====================================================
-- MÓDULO DE REUNIÕES - MIGRAÇÃO COMPLETA
-- =====================================================

-- 1. CRIAR ENUMS SE NÃO EXISTIREM
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_reuniao') THEN
    CREATE TYPE public.tipo_reuniao AS ENUM (
      'ordinaria',
      'extraordinaria',
      'audiencia',
      'sessao_solene',
      'reuniao_trabalho'
    );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_reuniao') THEN
    CREATE TYPE public.status_reuniao AS ENUM (
      'agendada',
      'confirmada',
      'em_andamento',
      'realizada',
      'cancelada',
      'adiada'
    );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_participante') THEN
    CREATE TYPE public.status_participante AS ENUM (
      'pendente',
      'confirmado',
      'recusado',
      'ausente',
      'presente'
    );
  END IF;
END $$;

-- 2. DROPAR TABELAS EXISTENTES (SE HOUVER) PARA RECRIAÇÃO LIMPA
DROP TABLE IF EXISTS public.historico_convites_reuniao CASCADE;
DROP TABLE IF EXISTS public.config_assinatura_reuniao CASCADE;
DROP TABLE IF EXISTS public.modelos_mensagem_reuniao CASCADE;
DROP TABLE IF EXISTS public.participantes_reuniao CASCADE;
DROP TABLE IF EXISTS public.reunioes CASCADE;

-- 3. CRIAR TABELA PRINCIPAL DE REUNIÕES
CREATE TABLE public.reunioes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  tipo public.tipo_reuniao NOT NULL DEFAULT 'ordinaria',
  status public.status_reuniao NOT NULL DEFAULT 'agendada',
  data_reuniao DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim TIME,
  local TEXT,
  endereco_completo TEXT,
  link_virtual TEXT,
  pauta TEXT,
  observacoes TEXT,
  ata_conteudo TEXT,
  ata_aprovada BOOLEAN DEFAULT false,
  unidade_responsavel_id UUID REFERENCES public.estrutura_organizacional(id),
  organizador_id UUID REFERENCES public.servidores(id),
  numero_protocolo TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- 4. CRIAR TABELA DE PARTICIPANTES
CREATE TABLE public.participantes_reuniao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reuniao_id UUID NOT NULL REFERENCES public.reunioes(id) ON DELETE CASCADE,
  servidor_id UUID REFERENCES public.servidores(id),
  nome_externo TEXT,
  email_externo TEXT,
  telefone_externo TEXT,
  instituicao_externa TEXT,
  cargo_funcao TEXT,
  tipo_participante TEXT DEFAULT 'membro',
  status public.status_participante DEFAULT 'pendente',
  obrigatorio BOOLEAN DEFAULT false,
  data_confirmacao TIMESTAMPTZ,
  justificativa_ausencia TEXT,
  assinatura_presenca BOOLEAN DEFAULT false,
  data_assinatura TIMESTAMPTZ,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT chk_participante CHECK (servidor_id IS NOT NULL OR nome_externo IS NOT NULL)
);

-- 5. CRIAR TABELA DE MODELOS DE MENSAGEM
CREATE TABLE public.modelos_mensagem_reuniao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'convite',
  assunto TEXT NOT NULL,
  conteudo_html TEXT NOT NULL,
  variaveis_disponiveis TEXT[],
  ativo BOOLEAN DEFAULT true,
  padrao BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. CRIAR TABELA DE HISTÓRICO DE CONVITES
CREATE TABLE public.historico_convites_reuniao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reuniao_id UUID NOT NULL REFERENCES public.reunioes(id) ON DELETE CASCADE,
  participante_id UUID NOT NULL REFERENCES public.participantes_reuniao(id) ON DELETE CASCADE,
  tipo_envio TEXT NOT NULL DEFAULT 'email',
  destinatario TEXT NOT NULL,
  assunto TEXT,
  conteudo TEXT,
  status_envio TEXT DEFAULT 'pendente',
  data_envio TIMESTAMPTZ,
  erro_envio TEXT,
  modelo_id UUID REFERENCES public.modelos_mensagem_reuniao(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- 7. CRIAR TABELA DE CONFIGURAÇÃO DE ASSINATURAS
CREATE TABLE public.config_assinatura_reuniao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_configuracao TEXT NOT NULL,
  cargo_assinante_1 TEXT,
  nome_assinante_1 TEXT,
  cargo_assinante_2 TEXT,
  nome_assinante_2 TEXT,
  texto_cabecalho TEXT,
  texto_rodape TEXT,
  padrao BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. HABILITAR RLS
ALTER TABLE public.reunioes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participantes_reuniao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modelos_mensagem_reuniao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_convites_reuniao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_assinatura_reuniao ENABLE ROW LEVEL SECURITY;

-- 9. CRIAR POLÍTICAS RLS PERMISSIVAS (PARA USUÁRIOS AUTENTICADOS)
CREATE POLICY "Usuários autenticados podem ver reuniões"
  ON public.reunioes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar reuniões"
  ON public.reunioes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar reuniões"
  ON public.reunioes FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem deletar reuniões"
  ON public.reunioes FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem ver participantes"
  ON public.participantes_reuniao FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem gerenciar participantes"
  ON public.participantes_reuniao FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem ver modelos"
  ON public.modelos_mensagem_reuniao FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem gerenciar modelos"
  ON public.modelos_mensagem_reuniao FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem ver histórico"
  ON public.historico_convites_reuniao FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem gerenciar histórico"
  ON public.historico_convites_reuniao FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem ver configurações"
  ON public.config_assinatura_reuniao FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem gerenciar configurações"
  ON public.config_assinatura_reuniao FOR ALL
  TO authenticated
  USING (true);

-- 10. CRIAR ÍNDICES
CREATE INDEX idx_reunioes_data ON public.reunioes(data_reuniao);
CREATE INDEX idx_reunioes_status ON public.reunioes(status);
CREATE INDEX idx_reunioes_tipo ON public.reunioes(tipo);
CREATE INDEX idx_participantes_reuniao_id ON public.participantes_reuniao(reuniao_id);
CREATE INDEX idx_participantes_servidor_id ON public.participantes_reuniao(servidor_id);
CREATE INDEX idx_historico_reuniao_id ON public.historico_convites_reuniao(reuniao_id);

-- 11. CRIAR TRIGGER PARA UPDATED_AT
CREATE TRIGGER update_reunioes_updated_at
  BEFORE UPDATE ON public.reunioes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_participantes_reuniao_updated_at
  BEFORE UPDATE ON public.participantes_reuniao
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_modelos_mensagem_reuniao_updated_at
  BEFORE UPDATE ON public.modelos_mensagem_reuniao
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_config_assinatura_reuniao_updated_at
  BEFORE UPDATE ON public.config_assinatura_reuniao
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 12. INSERIR MODELOS DE MENSAGEM PADRÃO
INSERT INTO public.modelos_mensagem_reuniao (nome, tipo, assunto, conteudo_html, variaveis_disponiveis, padrao) VALUES
(
  'Convite Padrão para Reunião',
  'convite',
  'Convite: {{titulo_reuniao}} - {{data_reuniao}}',
  '<p>Prezado(a) <strong>{{nome_participante}}</strong>,</p>
<p>Vimos, por meio deste, convidá-lo(a) para participar da reunião abaixo especificada:</p>
<p><strong>Reunião:</strong> {{titulo_reuniao}}<br>
<strong>Data:</strong> {{data_reuniao}}<br>
<strong>Horário:</strong> {{hora_inicio}} às {{hora_fim}}<br>
<strong>Local:</strong> {{local}}</p>
<p><strong>Pauta:</strong></p>
<p>{{pauta}}</p>
<p>Solicitamos a gentileza de confirmar sua presença.</p>
<p>Atenciosamente,<br>
<strong>{{organizador}}</strong><br>
{{unidade_responsavel}}</p>',
  ARRAY['titulo_reuniao', 'data_reuniao', 'hora_inicio', 'hora_fim', 'local', 'pauta', 'nome_participante', 'organizador', 'unidade_responsavel'],
  true
),
(
  'Lembrete de Reunião',
  'lembrete',
  'Lembrete: {{titulo_reuniao}} - Amanhã',
  '<p>Prezado(a) <strong>{{nome_participante}}</strong>,</p>
<p>Este é um lembrete de que a reunião <strong>{{titulo_reuniao}}</strong> está agendada para amanhã.</p>
<p><strong>Data:</strong> {{data_reuniao}}<br>
<strong>Horário:</strong> {{hora_inicio}}<br>
<strong>Local:</strong> {{local}}</p>
<p>Contamos com sua presença.</p>
<p>Atenciosamente,<br>
{{organizador}}</p>',
  ARRAY['titulo_reuniao', 'data_reuniao', 'hora_inicio', 'local', 'nome_participante', 'organizador'],
  false
),
(
  'Cancelamento de Reunião',
  'cancelamento',
  'CANCELADA: {{titulo_reuniao}} - {{data_reuniao}}',
  '<p>Prezado(a) <strong>{{nome_participante}}</strong>,</p>
<p>Informamos que a reunião <strong>{{titulo_reuniao}}</strong>, anteriormente agendada para {{data_reuniao}}, foi <strong>CANCELADA</strong>.</p>
<p>{{observacoes}}</p>
<p>Pedimos desculpas por eventuais transtornos.</p>
<p>Atenciosamente,<br>
{{organizador}}</p>',
  ARRAY['titulo_reuniao', 'data_reuniao', 'nome_participante', 'observacoes', 'organizador'],
  false
);