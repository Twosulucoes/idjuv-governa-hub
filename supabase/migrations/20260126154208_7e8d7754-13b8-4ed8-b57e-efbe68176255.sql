-- Adicionar campos faltantes para Ficha Cadastro SEGAD

-- Campos na tabela servidores
ALTER TABLE public.servidores
ADD COLUMN IF NOT EXISTS tipo_sanguineo TEXT,
ADD COLUMN IF NOT EXISTS reservista_categoria TEXT,
ADD COLUMN IF NOT EXISTS reservista_ano INTEGER,
ADD COLUMN IF NOT EXISTS cnh_data_expedicao DATE,
ADD COLUMN IF NOT EXISTS cnh_primeira_habilitacao DATE,
ADD COLUMN IF NOT EXISTS cnh_uf TEXT;

-- Campos na tabela pre_cadastros
ALTER TABLE public.pre_cadastros
ADD COLUMN IF NOT EXISTS tipo_sanguineo TEXT,
ADD COLUMN IF NOT EXISTS reservista_categoria TEXT,
ADD COLUMN IF NOT EXISTS reservista_ano INTEGER,
ADD COLUMN IF NOT EXISTS cnh_data_expedicao DATE,
ADD COLUMN IF NOT EXISTS cnh_primeira_habilitacao DATE,
ADD COLUMN IF NOT EXISTS cnh_uf TEXT;

-- Comentários explicativos
COMMENT ON COLUMN public.servidores.tipo_sanguineo IS 'Tipo sanguíneo do servidor (A+, A-, B+, B-, AB+, AB-, O+, O-)';
COMMENT ON COLUMN public.servidores.reservista_categoria IS 'Categoria da reserva militar';
COMMENT ON COLUMN public.servidores.reservista_ano IS 'Ano de entrada na reserva';
COMMENT ON COLUMN public.servidores.cnh_data_expedicao IS 'Data de expedição da CNH';
COMMENT ON COLUMN public.servidores.cnh_primeira_habilitacao IS 'Data da primeira habilitação';
COMMENT ON COLUMN public.servidores.cnh_uf IS 'UF de expedição da CNH';