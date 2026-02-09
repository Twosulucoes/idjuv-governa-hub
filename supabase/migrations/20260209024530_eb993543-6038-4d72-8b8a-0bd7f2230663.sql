-- Tabela para biblioteca de mídia do CMS
CREATE TABLE public.cms_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  filename TEXT NOT NULL,
  alt_text TEXT,
  tipo TEXT NOT NULL DEFAULT 'imagem' CHECK (tipo IN ('imagem', 'video', 'documento')),
  tamanho_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cms_media ENABLE ROW LEVEL SECURITY;

-- Índices
CREATE INDEX idx_cms_media_tipo ON public.cms_media(tipo);
CREATE INDEX idx_cms_media_created_at ON public.cms_media(created_at DESC);

-- Políticas RLS
-- Leitura pública
CREATE POLICY "cms_media_select_all"
ON public.cms_media
FOR SELECT
USING (true);

-- Insert/Update/Delete para usuários com permissão de comunicação ou admin
CREATE POLICY "cms_media_insert_auth"
ON public.cms_media
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role('admin'::app_role) OR 
  public.has_module('comunicacao'::app_module)
);

CREATE POLICY "cms_media_update_auth"
ON public.cms_media
FOR UPDATE
TO authenticated
USING (
  public.has_role('admin'::app_role) OR 
  public.has_module('comunicacao'::app_module)
)
WITH CHECK (
  public.has_role('admin'::app_role) OR 
  public.has_module('comunicacao'::app_module)
);

CREATE POLICY "cms_media_delete_auth"
ON public.cms_media
FOR DELETE
TO authenticated
USING (
  public.has_role('admin'::app_role) OR 
  public.has_module('comunicacao'::app_module)
);

-- Trigger para updated_at
CREATE TRIGGER update_cms_media_updated_at
BEFORE UPDATE ON public.cms_media
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela para galerias de fotos
CREATE TABLE public.cms_galerias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descricao TEXT,
  destino TEXT NOT NULL DEFAULT 'portal_noticias',
  categoria TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'publicado', 'arquivado')),
  imagem_capa_url TEXT,
  autor_id UUID REFERENCES auth.users(id),
  autor_nome TEXT,
  data_publicacao TIMESTAMPTZ,
  visualizacoes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cms_galerias ENABLE ROW LEVEL SECURITY;

-- Índices
CREATE INDEX idx_cms_galerias_slug ON public.cms_galerias(slug);
CREATE INDEX idx_cms_galerias_status ON public.cms_galerias(status);
CREATE INDEX idx_cms_galerias_destino ON public.cms_galerias(destino);

-- RLS Policies para galerias
CREATE POLICY "cms_galerias_select_public"
ON public.cms_galerias
FOR SELECT
USING (status = 'publicado' OR 
  public.has_role('admin'::app_role) OR 
  public.has_module('comunicacao'::app_module));

CREATE POLICY "cms_galerias_insert_auth"
ON public.cms_galerias
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role('admin'::app_role) OR 
  public.has_module('comunicacao'::app_module)
);

CREATE POLICY "cms_galerias_update_auth"
ON public.cms_galerias
FOR UPDATE
TO authenticated
USING (
  public.has_role('admin'::app_role) OR 
  public.has_module('comunicacao'::app_module)
)
WITH CHECK (
  public.has_role('admin'::app_role) OR 
  public.has_module('comunicacao'::app_module)
);

CREATE POLICY "cms_galerias_delete_auth"
ON public.cms_galerias
FOR DELETE
TO authenticated
USING (
  public.has_role('admin'::app_role) OR 
  public.has_module('comunicacao'::app_module)
);

-- Trigger
CREATE TRIGGER update_cms_galerias_updated_at
BEFORE UPDATE ON public.cms_galerias
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de fotos das galerias
CREATE TABLE public.cms_galeria_fotos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  galeria_id UUID NOT NULL REFERENCES public.cms_galerias(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  titulo TEXT,
  legenda TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cms_galeria_fotos ENABLE ROW LEVEL SECURITY;

-- Índice
CREATE INDEX idx_cms_galeria_fotos_galeria ON public.cms_galeria_fotos(galeria_id);
CREATE INDEX idx_cms_galeria_fotos_ordem ON public.cms_galeria_fotos(galeria_id, ordem);

-- RLS - segue a galeria pai
CREATE POLICY "cms_galeria_fotos_select"
ON public.cms_galeria_fotos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.cms_galerias g 
    WHERE g.id = galeria_id 
    AND (g.status = 'publicado' OR 
      public.has_role('admin'::app_role) OR 
      public.has_module('comunicacao'::app_module))
  )
);

CREATE POLICY "cms_galeria_fotos_insert"
ON public.cms_galeria_fotos
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role('admin'::app_role) OR 
  public.has_module('comunicacao'::app_module)
);

CREATE POLICY "cms_galeria_fotos_update"
ON public.cms_galeria_fotos
FOR UPDATE
TO authenticated
USING (
  public.has_role('admin'::app_role) OR 
  public.has_module('comunicacao'::app_module)
)
WITH CHECK (
  public.has_role('admin'::app_role) OR 
  public.has_module('comunicacao'::app_module)
);

CREATE POLICY "cms_galeria_fotos_delete"
ON public.cms_galeria_fotos
FOR DELETE
TO authenticated
USING (
  public.has_role('admin'::app_role) OR 
  public.has_module('comunicacao'::app_module)
);