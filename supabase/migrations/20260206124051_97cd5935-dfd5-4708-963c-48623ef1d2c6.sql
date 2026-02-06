-- =====================================================
-- CMS: Notícias e Galeria das Seletivas Estudantis
-- =====================================================

-- Tabela de Notícias das Seletivas/Eventos Esportivos
CREATE TABLE public.noticias_eventos_esportivos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  subtitulo TEXT,
  conteudo TEXT NOT NULL,
  resumo TEXT,
  imagem_destaque_url TEXT,
  imagem_destaque_alt TEXT,
  categoria TEXT NOT NULL DEFAULT 'geral',
  tags TEXT[] DEFAULT '{}',
  evento_relacionado TEXT,
  autor_id UUID REFERENCES auth.users(id),
  autor_nome TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'publicado', 'arquivado')),
  destaque BOOLEAN DEFAULT false,
  data_publicacao TIMESTAMP WITH TIME ZONE,
  visualizacoes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_noticias_eventos_status ON public.noticias_eventos_esportivos(status);
CREATE INDEX idx_noticias_eventos_categoria ON public.noticias_eventos_esportivos(categoria);
CREATE INDEX idx_noticias_eventos_evento ON public.noticias_eventos_esportivos(evento_relacionado);
CREATE INDEX idx_noticias_eventos_data ON public.noticias_eventos_esportivos(data_publicacao DESC);
CREATE INDEX idx_noticias_eventos_destaque ON public.noticias_eventos_esportivos(destaque) WHERE destaque = true;

-- Tabela de Galeria de Fotos
CREATE TABLE public.galeria_eventos_esportivos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  foto_url TEXT NOT NULL,
  foto_thumbnail_url TEXT,
  modalidade TEXT,
  naipe TEXT,
  evento TEXT NOT NULL DEFAULT 'seletivas_2026',
  data_evento DATE,
  fotografo TEXT,
  ordem INTEGER DEFAULT 0,
  destaque BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'publicado' CHECK (status IN ('rascunho', 'publicado', 'arquivado')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_galeria_eventos_evento ON public.galeria_eventos_esportivos(evento);
CREATE INDEX idx_galeria_eventos_modalidade ON public.galeria_eventos_esportivos(modalidade);
CREATE INDEX idx_galeria_eventos_status ON public.galeria_eventos_esportivos(status);
CREATE INDEX idx_galeria_eventos_destaque ON public.galeria_eventos_esportivos(destaque) WHERE destaque = true;

-- Tabela de Categorias de Notícias
CREATE TABLE public.categorias_noticias_eventos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  descricao TEXT,
  cor TEXT,
  icone TEXT,
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

INSERT INTO public.categorias_noticias_eventos (nome, slug, descricao, cor, icone, ordem) VALUES
  ('Geral', 'geral', 'Notícias gerais sobre eventos esportivos', '#6B7280', 'newspaper', 1),
  ('Jogos da Juventude', 'jogos-juventude', 'Notícias sobre os Jogos da Juventude', '#10B981', 'trophy', 2),
  ('Jogos Escolares', 'jogos-escolares', 'Notícias sobre os Jogos Escolares', '#3B82F6', 'graduation-cap', 3),
  ('Seletivas', 'seletivas', 'Notícias sobre as seletivas estaduais', '#F59E0B', 'users', 4),
  ('Resultados', 'resultados', 'Resultados de competições', '#8B5CF6', 'medal', 5),
  ('Convocações', 'convocacoes', 'Listas de convocados e comunicados oficiais', '#EF4444', 'megaphone', 6);

-- Tabela de Informações de Contato/Links Oficiais
CREATE TABLE public.contatos_eventos_esportivos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  subtitulo TEXT,
  valor TEXT NOT NULL,
  icone TEXT,
  evento TEXT NOT NULL DEFAULT 'seletivas_2026',
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

INSERT INTO public.contatos_eventos_esportivos (tipo, titulo, subtitulo, valor, icone, evento, ordem) VALUES
  ('site_oficial', 'Jogos da Juventude', 'Site Oficial do COB', 'https://www.cob.org.br/pt/jogos-da-juventude', 'globe', 'seletivas_2026', 1),
  ('site_oficial', 'Jogos Escolares', 'Site Oficial da CBDE', 'https://cbde.org.br/', 'graduation-cap', 'seletivas_2026', 2),
  ('coordenador', 'Coordenação das Seleções', 'IDJuv - Diretoria de Esportes', 'esportes@idjuv.rr.gov.br', 'mail', 'seletivas_2026', 3),
  ('telefone', 'Telefone de Contato', 'Atendimento das 8h às 14h', '(95) 3621-XXXX', 'phone', 'seletivas_2026', 4);

-- Enable RLS
ALTER TABLE public.noticias_eventos_esportivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.galeria_eventos_esportivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_noticias_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contatos_eventos_esportivos ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública
CREATE POLICY "Notícias publicadas são públicas" ON public.noticias_eventos_esportivos FOR SELECT USING (status = 'publicado');
CREATE POLICY "Galeria publicada é pública" ON public.galeria_eventos_esportivos FOR SELECT USING (status = 'publicado');
CREATE POLICY "Categorias são públicas" ON public.categorias_noticias_eventos FOR SELECT USING (ativo = true);
CREATE POLICY "Contatos ativos são públicos" ON public.contatos_eventos_esportivos FOR SELECT USING (ativo = true);

-- Políticas de gerenciamento para admins (usando app_role correto)
CREATE POLICY "Admins podem gerenciar notícias" ON public.noticias_eventos_esportivos FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE POLICY "Admins podem gerenciar galeria" ON public.galeria_eventos_esportivos FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE POLICY "Admins podem gerenciar categorias" ON public.categorias_noticias_eventos FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE POLICY "Admins podem gerenciar contatos" ON public.contatos_eventos_esportivos FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

-- Triggers para updated_at
CREATE TRIGGER update_noticias_eventos_updated_at BEFORE UPDATE ON public.noticias_eventos_esportivos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_galeria_eventos_updated_at BEFORE UPDATE ON public.galeria_eventos_esportivos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contatos_eventos_updated_at BEFORE UPDATE ON public.contatos_eventos_esportivos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();