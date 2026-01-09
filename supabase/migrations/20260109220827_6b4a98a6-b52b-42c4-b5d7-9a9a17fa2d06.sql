-- Adicionar valor 'inativo' ao enum situacao_funcional
ALTER TYPE situacao_funcional ADD VALUE IF NOT EXISTS 'inativo';