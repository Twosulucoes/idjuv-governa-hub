-- Adicionar campo doe_link para armazenar link do Diário Oficial
ALTER TABLE public.documentos 
ADD COLUMN IF NOT EXISTS doe_link TEXT;