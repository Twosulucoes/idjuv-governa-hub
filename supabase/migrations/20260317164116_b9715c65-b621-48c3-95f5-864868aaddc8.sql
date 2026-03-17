
-- Criar tabela filha para modalidades de árbitros
CREATE TABLE public.cadastro_arbitros_modalidades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  arbitro_id UUID NOT NULL REFERENCES public.cadastro_arbitros(id) ON DELETE CASCADE,
  modalidade TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'estadual',
  status TEXT NOT NULL DEFAULT 'pendente',
  documentos_urls JSONB DEFAULT '[]'::jsonb,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(arbitro_id, modalidade)
);

-- Enable RLS
ALTER TABLE public.cadastro_arbitros_modalidades ENABLE ROW LEVEL SECURITY;

-- Policies: mesmas do cadastro_arbitros (público para inserção, leitura via protocolo/admin)
CREATE POLICY "Público pode inserir modalidades"
ON public.cadastro_arbitros_modalidades
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Público pode ler próprias modalidades"
ON public.cadastro_arbitros_modalidades
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admin pode atualizar modalidades"
ON public.cadastro_arbitros_modalidades
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Admin pode deletar modalidades"
ON public.cadastro_arbitros_modalidades
FOR DELETE
TO authenticated
USING (true);

-- Migrar dados existentes: mover modalidade/categoria/status para tabela filha
INSERT INTO public.cadastro_arbitros_modalidades (arbitro_id, modalidade, categoria, status)
SELECT id, modalidade, categoria, status
FROM public.cadastro_arbitros
WHERE modalidade IS NOT NULL AND modalidade != '';

-- Tornar modalidade e categoria nullable na tabela pai (manter para backward compat)
ALTER TABLE public.cadastro_arbitros ALTER COLUMN modalidade DROP NOT NULL;
ALTER TABLE public.cadastro_arbitros ALTER COLUMN categoria DROP NOT NULL;

-- Index para performance
CREATE INDEX idx_arbitros_modalidades_arbitro ON public.cadastro_arbitros_modalidades(arbitro_id);
CREATE INDEX idx_arbitros_modalidades_modalidade ON public.cadastro_arbitros_modalidades(modalidade);
