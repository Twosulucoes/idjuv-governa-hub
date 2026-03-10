-- Corrigir servidores inconsistentes: situacao=inativo mas ativo=true
UPDATE servidores SET ativo = false WHERE situacao = 'inativo' AND ativo = true;