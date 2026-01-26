-- Adicionar coluna site na tabela federacoes_esportivas
ALTER TABLE public.federacoes_esportivas 
ADD COLUMN IF NOT EXISTS site VARCHAR(255) DEFAULT NULL;