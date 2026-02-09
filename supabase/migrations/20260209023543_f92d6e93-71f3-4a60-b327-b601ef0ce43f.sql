-- ===========================================
-- CMS COMUNICAÇÃO - ESTRUTURA CENTRALIZADA
-- Permite à ASCOM gerenciar conteúdo do portal e projetos
-- ===========================================

-- Enum para áreas/destinos do conteúdo
CREATE TYPE public.cms_destino AS ENUM (
  'portal_home',
  'portal_noticias',
  'portal_eventos',
  'portal_programas',
  'selecoes_estudantis',
  'jogos_escolares',
  'esports',
  'institucional',
  'transparencia',
  'redes_sociais'
);

-- Enum para tipos de conteúdo
CREATE TYPE public.cms_tipo_conteudo AS ENUM (
  'noticia',
  'comunicado',
  'banner',
  'destaque',
  'evento',
  'galeria',
  'video',
  'documento'
);

-- ===========================================
-- TABELA PRINCIPAL: CMS CONTEÚDOS
-- ===========================================
CREATE TABLE public.cms_conteudos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  titulo TEXT NOT NULL,
  slug TEXT NOT NULL,
  subtitulo TEXT,
  resumo TEXT,
  
  -- Conteúdo
  conteudo TEXT,
  conteudo_html TEXT,
  
  -- Classificação
  tipo cms_tipo_conteudo NOT NULL DEFAULT 'noticia',
  destino cms_destino NOT NULL DEFAULT 'portal_noticias',
  categoria TEXT,
  tags TEXT[] DEFAULT '{}',
  
  -- Mídia
  imagem_destaque_url TEXT,
  imagem_destaque_alt TEXT,
  video_url TEXT,
  
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  
  -- Controle de publicação
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'revisao', 'aprovado', 'publicado', 'arquivado')),
  destaque BOOLEAN DEFAULT false,
  ordem INTEGER DEFAULT 0,
  
  -- Datas
  data_publicacao TIMESTAMPTZ,
  data_expiracao TIMESTAMPTZ,
  
  -- Auditoria
  autor_id UUID REFERENCES auth.users(id),
  autor_nome TEXT,
  revisor_id UUID REFERENCES auth.users(id),
  revisor_nome TEXT,
  aprovador_id UUID REFERENCES auth.users(id),
  data_aprovacao TIMESTAMPTZ,
  
  -- Métricas
  visualizacoes INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT cms_conteudos_slug_destino_unique UNIQUE (slug, destino)
);

-- Índices para performance
CREATE INDEX idx_cms_conteudos_destino ON public.cms_conteudos(destino);
CREATE INDEX idx_cms_conteudos_status ON public.cms_conteudos(status);
CREATE INDEX idx_cms_conteudos_tipo ON public.cms_conteudos(tipo);
CREATE INDEX idx_cms_conteudos_data_publicacao ON public.cms_conteudos(data_publicacao);
CREATE INDEX idx_cms_conteudos_destaque ON public.cms_conteudos(destaque) WHERE destaque = true;

-- ===========================================
-- TABELA: BANNERS E DESTAQUES
-- ===========================================
CREATE TABLE public.cms_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  titulo TEXT NOT NULL,
  subtitulo TEXT,
  imagem_url TEXT NOT NULL,
  imagem_mobile_url TEXT,
  link_url TEXT,
  link_texto TEXT,
  link_externo BOOLEAN DEFAULT false,
  
  destino cms_destino NOT NULL DEFAULT 'portal_home',
  posicao TEXT DEFAULT 'hero', -- hero, sidebar, footer, popup
  
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  
  data_inicio TIMESTAMPTZ,
  data_fim TIMESTAMPTZ,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cms_banners_destino ON public.cms_banners(destino);
CREATE INDEX idx_cms_banners_ativo ON public.cms_banners(ativo) WHERE ativo = true;

-- ===========================================
-- TABELA: CATEGORIAS CMS
-- ===========================================
CREATE TABLE public.cms_categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descricao TEXT,
  cor TEXT,
  icone TEXT,
  
  destino cms_destino,
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inserir categorias padrão
INSERT INTO public.cms_categorias (nome, slug, cor, destino) VALUES
  ('Jogos da Juventude', 'jogos-juventude', '#2563eb', 'selecoes_estudantis'),
  ('Jogos Escolares', 'jogos-escolares', '#16a34a', 'jogos_escolares'),
  ('Resultados', 'resultados', '#f59e0b', 'portal_noticias'),
  ('Eventos', 'eventos', '#8b5cf6', 'portal_eventos'),
  ('Institucional', 'institucional', '#64748b', 'institucional'),
  ('Programas', 'programas', '#ec4899', 'portal_programas'),
  ('eSports', 'esports', '#06b6d4', 'esports');

-- ===========================================
-- RLS POLICIES
-- ===========================================

-- Habilitar RLS
ALTER TABLE public.cms_conteudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_categorias ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para verificar acesso ao módulo comunicação
CREATE OR REPLACE FUNCTION public.can_manage_cms()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM public.user_modules WHERE user_id = auth.uid() AND module = 'comunicacao'
  )
$$;

-- CMS Conteúdos: Leitura pública para publicados, gestão para Comunicação
CREATE POLICY "Conteúdos publicados são públicos"
  ON public.cms_conteudos FOR SELECT
  USING (status = 'publicado' AND (data_expiracao IS NULL OR data_expiracao > now()));

CREATE POLICY "Comunicação pode gerenciar todos os conteúdos"
  ON public.cms_conteudos FOR ALL
  TO authenticated
  USING (public.can_manage_cms())
  WITH CHECK (public.can_manage_cms());

-- Banners: Leitura pública para ativos, gestão para Comunicação
CREATE POLICY "Banners ativos são públicos"
  ON public.cms_banners FOR SELECT
  USING (ativo = true AND (data_fim IS NULL OR data_fim > now()));

CREATE POLICY "Comunicação pode gerenciar banners"
  ON public.cms_banners FOR ALL
  TO authenticated
  USING (public.can_manage_cms())
  WITH CHECK (public.can_manage_cms());

-- Categorias: Leitura pública, gestão para Comunicação
CREATE POLICY "Categorias são públicas"
  ON public.cms_categorias FOR SELECT
  USING (true);

CREATE POLICY "Comunicação pode gerenciar categorias"
  ON public.cms_categorias FOR ALL
  TO authenticated
  USING (public.can_manage_cms())
  WITH CHECK (public.can_manage_cms());

-- ===========================================
-- TRIGGER PARA UPDATED_AT
-- ===========================================
CREATE TRIGGER update_cms_conteudos_updated_at
  BEFORE UPDATE ON public.cms_conteudos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cms_banners_updated_at
  BEFORE UPDATE ON public.cms_banners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();