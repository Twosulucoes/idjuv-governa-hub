
-- Adicionar colunas que existem no type PreCadastro mas NÃO na tabela pre_cadastros
-- (dados pessoais que o formulário coleta mas perde ao salvar)
ALTER TABLE public.pre_cadastros ADD COLUMN IF NOT EXISTS raca_cor text;
ALTER TABLE public.pre_cadastros ADD COLUMN IF NOT EXISTS pcd boolean DEFAULT false;
ALTER TABLE public.pre_cadastros ADD COLUMN IF NOT EXISTS pcd_tipo text;
ALTER TABLE public.pre_cadastros ADD COLUMN IF NOT EXISTS nome_mae text;
ALTER TABLE public.pre_cadastros ADD COLUMN IF NOT EXISTS nome_pai text;
ALTER TABLE public.pre_cadastros ADD COLUMN IF NOT EXISTS tipo_sanguineo text;

-- Título de eleitor - campos complementares
ALTER TABLE public.pre_cadastros ADD COLUMN IF NOT EXISTS titulo_cidade_votacao text;
ALTER TABLE public.pre_cadastros ADD COLUMN IF NOT EXISTS titulo_uf_votacao text;
ALTER TABLE public.pre_cadastros ADD COLUMN IF NOT EXISTS titulo_data_emissao date;

-- Certificado de Reservista - campos complementares
ALTER TABLE public.pre_cadastros ADD COLUMN IF NOT EXISTS reservista_orgao text;
ALTER TABLE public.pre_cadastros ADD COLUMN IF NOT EXISTS reservista_data_emissao date;
ALTER TABLE public.pre_cadastros ADD COLUMN IF NOT EXISTS reservista_categoria text;
ALTER TABLE public.pre_cadastros ADD COLUMN IF NOT EXISTS reservista_ano integer;

-- CTPS - campo complementar
ALTER TABLE public.pre_cadastros ADD COLUMN IF NOT EXISTS ctps_data_emissao date;

-- CNH - campos complementares
ALTER TABLE public.pre_cadastros ADD COLUMN IF NOT EXISTS cnh_data_expedicao date;
ALTER TABLE public.pre_cadastros ADD COLUMN IF NOT EXISTS cnh_primeira_habilitacao date;
ALTER TABLE public.pre_cadastros ADD COLUMN IF NOT EXISTS cnh_uf text;

-- Campos que existem no servidor e fazem sentido no pré-cadastro
ALTER TABLE public.pre_cadastros ADD COLUMN IF NOT EXISTS acumula_cargo boolean DEFAULT false;
ALTER TABLE public.pre_cadastros ADD COLUMN IF NOT EXISTS acumulo_descricao text;
ALTER TABLE public.pre_cadastros ADD COLUMN IF NOT EXISTS indicacao text;

-- Contato de emergência (existe no servidor)
ALTER TABLE public.pre_cadastros ADD COLUMN IF NOT EXISTS telefone_emergencia text;
ALTER TABLE public.pre_cadastros ADD COLUMN IF NOT EXISTS contato_emergencia_nome text;
ALTER TABLE public.pre_cadastros ADD COLUMN IF NOT EXISTS contato_emergencia_parentesco text;
