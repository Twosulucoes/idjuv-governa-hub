
-- Campos de Estrangeiros (Página 2 da SEGAD)
ALTER TABLE public.pre_cadastros ADD COLUMN IF NOT EXISTS estrangeiro_data_chegada DATE;
ALTER TABLE public.pre_cadastros ADD COLUMN IF NOT EXISTS estrangeiro_data_limite_permanencia DATE;
ALTER TABLE public.pre_cadastros ADD COLUMN IF NOT EXISTS estrangeiro_registro_nacional TEXT;
ALTER TABLE public.pre_cadastros ADD COLUMN IF NOT EXISTS estrangeiro_ano_chegada INTEGER;

-- Moléstia Grave (Página 1 da SEGAD)
ALTER TABLE public.pre_cadastros ADD COLUMN IF NOT EXISTS molestia_grave BOOLEAN DEFAULT false;

-- Dados Funcionais - Primeiro Emprego (Página 1 da SEGAD)
ALTER TABLE public.pre_cadastros ADD COLUMN IF NOT EXISTS ano_inicio_primeiro_emprego INTEGER;
ALTER TABLE public.pre_cadastros ADD COLUMN IF NOT EXISTS ano_fim_primeiro_emprego INTEGER;
