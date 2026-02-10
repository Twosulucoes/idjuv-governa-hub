-- Tabela de tags/etiquetas personalizadas para servidores
CREATE TABLE public.servidor_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cor TEXT NOT NULL DEFAULT 'blue',
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Tabela de vínculo servidor <-> tag (muitos para muitos)
CREATE TABLE public.servidor_tag_vinculos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  servidor_id UUID NOT NULL REFERENCES public.servidores(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.servidor_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(servidor_id, tag_id)
);

-- Enable RLS
ALTER TABLE public.servidor_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servidor_tag_vinculos ENABLE ROW LEVEL SECURITY;

-- Policies para servidor_tags
CREATE POLICY "Authenticated users can view tags"
  ON public.servidor_tags FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin/Manager can manage tags"
  ON public.servidor_tags FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'manager'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- Policies para servidor_tag_vinculos
CREATE POLICY "Authenticated users can view tag links"
  ON public.servidor_tag_vinculos FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin/Manager can manage tag links"
  ON public.servidor_tag_vinculos FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'manager'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- Indexes
CREATE INDEX idx_servidor_tag_vinculos_servidor ON public.servidor_tag_vinculos(servidor_id);
CREATE INDEX idx_servidor_tag_vinculos_tag ON public.servidor_tag_vinculos(tag_id);