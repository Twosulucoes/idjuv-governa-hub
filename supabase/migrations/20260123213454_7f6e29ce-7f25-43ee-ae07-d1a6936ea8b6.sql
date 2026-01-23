-- Adicionar campos de Instagram para Vice-Presidente e Diretor Técnico
ALTER TABLE public.federacoes_esportivas
ADD COLUMN vice_presidente_instagram TEXT,
ADD COLUMN diretor_tecnico_instagram TEXT;