-- Adicionar novos valores ao enum tipo_unidade
ALTER TYPE tipo_unidade ADD VALUE IF NOT EXISTS 'assessoria';
ALTER TYPE tipo_unidade ADD VALUE IF NOT EXISTS 'nucleo';