-- Adicionar coluna CNPJ à tabela federacoes_esportivas
ALTER TABLE public.federacoes_esportivas 
ADD COLUMN IF NOT EXISTS cnpj TEXT;

-- Atualizar para NOT NULL depois que dados forem corrigidos (opcional)
-- Por ora mantemos nullable para dados existentes
COMMENT ON COLUMN public.federacoes_esportivas.cnpj IS 'CNPJ da federação - obrigatório para novos cadastros';