-- Adicionar campos de endereço separados para a Federação
ALTER TABLE public.federacoes_esportivas
ADD COLUMN IF NOT EXISTS endereco_logradouro TEXT,
ADD COLUMN IF NOT EXISTS endereco_numero TEXT,
ADD COLUMN IF NOT EXISTS endereco_bairro TEXT;

-- Adicionar campos de endereço separados para o Presidente
ALTER TABLE public.federacoes_esportivas
ADD COLUMN IF NOT EXISTS presidente_endereco_logradouro TEXT,
ADD COLUMN IF NOT EXISTS presidente_endereco_numero TEXT,
ADD COLUMN IF NOT EXISTS presidente_endereco_bairro TEXT;

-- Adicionar campos de Facebook
ALTER TABLE public.federacoes_esportivas
ADD COLUMN IF NOT EXISTS facebook TEXT,
ADD COLUMN IF NOT EXISTS presidente_facebook TEXT,
ADD COLUMN IF NOT EXISTS vice_presidente_facebook TEXT,
ADD COLUMN IF NOT EXISTS diretor_tecnico_facebook TEXT;

-- Adicionar datas de nascimento do Vice-Presidente e Diretor Técnico
ALTER TABLE public.federacoes_esportivas
ADD COLUMN IF NOT EXISTS vice_presidente_data_nascimento DATE,
ADD COLUMN IF NOT EXISTS diretor_tecnico_data_nascimento DATE;

-- Tornar campos do Diretor Técnico opcionais (já são nullable, apenas garantindo)
ALTER TABLE public.federacoes_esportivas
ALTER COLUMN diretor_tecnico_nome DROP NOT NULL,
ALTER COLUMN diretor_tecnico_telefone DROP NOT NULL;