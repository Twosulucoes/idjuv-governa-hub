
-- Campos de Estrangeiros na tabela servidores (espelho da SEGAD)
ALTER TABLE public.servidores ADD COLUMN IF NOT EXISTS estrangeiro_data_chegada DATE;
ALTER TABLE public.servidores ADD COLUMN IF NOT EXISTS estrangeiro_data_limite_permanencia DATE;
ALTER TABLE public.servidores ADD COLUMN IF NOT EXISTS estrangeiro_registro_nacional TEXT;
ALTER TABLE public.servidores ADD COLUMN IF NOT EXISTS estrangeiro_ano_chegada INTEGER;

-- Moléstia Grave
ALTER TABLE public.servidores ADD COLUMN IF NOT EXISTS molestia_grave BOOLEAN DEFAULT false;

-- Primeiro Emprego
ALTER TABLE public.servidores ADD COLUMN IF NOT EXISTS ano_inicio_primeiro_emprego INTEGER;
ALTER TABLE public.servidores ADD COLUMN IF NOT EXISTS ano_fim_primeiro_emprego INTEGER;
