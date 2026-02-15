-- Adicionar data de nascimento do representante/responsável na tabela de instituições
ALTER TABLE public.instituicoes
ADD COLUMN responsavel_data_nascimento DATE;

COMMENT ON COLUMN public.instituicoes.responsavel_data_nascimento IS 'Data de nascimento do representante/responsável da instituição';
