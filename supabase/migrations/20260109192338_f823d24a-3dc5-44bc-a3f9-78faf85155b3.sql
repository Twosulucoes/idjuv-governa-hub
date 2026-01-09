-- Adicionar campos de DOE (Diário Oficial do Estado) à tabela lotacoes
ALTER TABLE public.lotacoes 
  ADD COLUMN IF NOT EXISTS ato_tipo text,
  ADD COLUMN IF NOT EXISTS ato_doe_numero text,
  ADD COLUMN IF NOT EXISTS ato_doe_data date;