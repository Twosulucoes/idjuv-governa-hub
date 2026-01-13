-- Corrigir níveis hierárquicos das Assessorias (devem estar no nível 2, subordinadas à Presidência)
UPDATE estrutura_organizacional 
SET nivel = 2 
WHERE tipo = 'coordenacao' 
AND superior_id IS NOT NULL
AND nivel = 1;

-- Garantir que Diretorias estejam no nível 2
UPDATE estrutura_organizacional 
SET nivel = 2 
WHERE tipo = 'diretoria' 
AND nivel != 2;

-- Garantir que Divisões estejam no nível 3
UPDATE estrutura_organizacional 
SET nivel = 3 
WHERE tipo = 'divisao' 
AND nivel != 3;

-- Garantir que Núcleos/Setores estejam no nível 4
UPDATE estrutura_organizacional 
SET nivel = 4 
WHERE tipo IN ('setor', 'secao') 
AND nivel != 4;