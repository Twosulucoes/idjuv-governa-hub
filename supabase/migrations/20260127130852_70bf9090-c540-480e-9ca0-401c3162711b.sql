-- Corrigir tipo dos núcleos de 'setor' para 'nucleo'
UPDATE estrutura_organizacional 
SET tipo = 'nucleo' 
WHERE tipo = 'setor' AND nome LIKE 'Núcleo%';

-- Corrigir siglas das diretorias para padrão oficial (maiúsculas)
UPDATE estrutura_organizacional 
SET sigla = 'DIESP' 
WHERE sigla = 'DiEsp';

UPDATE estrutura_organizacional 
SET sigla = 'DIJUV' 
WHERE sigla = 'DiJuv';