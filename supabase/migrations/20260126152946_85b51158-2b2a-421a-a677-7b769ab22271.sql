-- Adicionar campos faltantes para Ficha Cadastro SEGAD
-- Tabela servidores
ALTER TABLE public.servidores
ADD COLUMN IF NOT EXISTS raca_cor TEXT,
ADD COLUMN IF NOT EXISTS pcd BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pcd_tipo TEXT,
ADD COLUMN IF NOT EXISTS nome_mae TEXT,
ADD COLUMN IF NOT EXISTS nome_pai TEXT,
ADD COLUMN IF NOT EXISTS ctps_data_emissao DATE,
ADD COLUMN IF NOT EXISTS titulo_cidade_votacao TEXT,
ADD COLUMN IF NOT EXISTS titulo_uf_votacao VARCHAR(2),
ADD COLUMN IF NOT EXISTS titulo_data_emissao DATE,
ADD COLUMN IF NOT EXISTS reservista_orgao TEXT,
ADD COLUMN IF NOT EXISTS reservista_data_emissao DATE;

-- Tabela pre_cadastros (para compatibilidade)
ALTER TABLE public.pre_cadastros
ADD COLUMN IF NOT EXISTS raca_cor TEXT,
ADD COLUMN IF NOT EXISTS pcd BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pcd_tipo TEXT,
ADD COLUMN IF NOT EXISTS nome_mae TEXT,
ADD COLUMN IF NOT EXISTS nome_pai TEXT,
ADD COLUMN IF NOT EXISTS ctps_numero TEXT,
ADD COLUMN IF NOT EXISTS ctps_serie TEXT,
ADD COLUMN IF NOT EXISTS ctps_uf VARCHAR(2),
ADD COLUMN IF NOT EXISTS ctps_data_emissao DATE,
ADD COLUMN IF NOT EXISTS titulo_cidade_votacao TEXT,
ADD COLUMN IF NOT EXISTS titulo_uf_votacao VARCHAR(2),
ADD COLUMN IF NOT EXISTS titulo_data_emissao DATE,
ADD COLUMN IF NOT EXISTS reservista_orgao TEXT,
ADD COLUMN IF NOT EXISTS reservista_data_emissao DATE;

-- Comentários para documentação
COMMENT ON COLUMN public.servidores.raca_cor IS 'Raça/Cor autodeclarada conforme IBGE';
COMMENT ON COLUMN public.servidores.pcd IS 'Pessoa com Deficiência';
COMMENT ON COLUMN public.servidores.pcd_tipo IS 'Tipo de deficiência quando PCD=true';
COMMENT ON COLUMN public.servidores.nome_mae IS 'Nome completo da mãe';
COMMENT ON COLUMN public.servidores.nome_pai IS 'Nome completo do pai';