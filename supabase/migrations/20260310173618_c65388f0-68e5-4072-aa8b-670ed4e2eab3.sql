
-- Add missing columns to vinculos_servidor for consolidation with provimentos
ALTER TABLE public.vinculos_servidor 
  ADD COLUMN IF NOT EXISTS data_posse date,
  ADD COLUMN IF NOT EXISTS data_exercicio date,
  ADD COLUMN IF NOT EXISTS motivo_encerramento text;
