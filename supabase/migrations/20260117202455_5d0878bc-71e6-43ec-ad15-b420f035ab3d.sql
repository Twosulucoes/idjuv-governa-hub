-- Adicionar campo para mensagem de convite personalizada nas reuniões
ALTER TABLE public.reunioes ADD COLUMN IF NOT EXISTS mensagem_convite text;