-- Tabela para exibição da diretoria no portal público
CREATE TABLE public.portal_diretoria (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cargo TEXT NOT NULL,
  unidade TEXT, -- Ex: "Diretoria de Esporte", "Presidência"
  foto_url TEXT,
  email TEXT,
  telefone TEXT,
  bio TEXT, -- Breve descrição/currículo
  linkedin_url TEXT,
  decreto_nomeacao TEXT,
  data_posse DATE,
  ordem_exibicao INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.portal_diretoria ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública (portal)
CREATE POLICY "portal_diretoria_select_public"
ON public.portal_diretoria FOR SELECT
USING (ativo = true);

-- Política de escrita para autenticados (admin)
CREATE POLICY "portal_diretoria_insert_authenticated"
ON public.portal_diretoria FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "portal_diretoria_update_authenticated"
ON public.portal_diretoria FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "portal_diretoria_delete_authenticated"
ON public.portal_diretoria FOR DELETE
USING (auth.role() = 'authenticated');

-- Trigger para atualizar updated_at
CREATE TRIGGER update_portal_diretoria_updated_at
BEFORE UPDATE ON public.portal_diretoria
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir dados iniciais do presidente (dados oficiais)
INSERT INTO public.portal_diretoria (nome, cargo, unidade, decreto_nomeacao, ordem_exibicao)
VALUES 
  ('Marcelo de Magalhães Nunes', 'Presidente', 'Presidência', 'Decreto nº 86-P, de 12 de janeiro de 2026', 1);

-- Índices
CREATE INDEX idx_portal_diretoria_ordem ON public.portal_diretoria (ordem_exibicao);
CREATE INDEX idx_portal_diretoria_ativo ON public.portal_diretoria (ativo) WHERE ativo = true;

-- Comentário
COMMENT ON TABLE public.portal_diretoria IS 'Diretoria do IDJuv para exibição no portal público';