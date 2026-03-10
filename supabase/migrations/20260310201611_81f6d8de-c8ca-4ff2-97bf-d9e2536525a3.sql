
-- Fix: Encerrar vínculos de servidores já exonerados (lotação inativa) mas com vínculo ainda ativo
UPDATE vinculos_servidor 
SET ativo = false, 
    data_fim = l.data_fim,
    motivo_encerramento = 'Exoneração (correção retroativa)'
FROM (
  SELECT DISTINCT ON (lo.servidor_id) lo.servidor_id, lo.data_fim
  FROM lotacoes lo
  WHERE lo.ativo = false AND lo.data_fim IS NOT NULL
    AND lo.observacao ILIKE '%exonera%'
  ORDER BY lo.servidor_id, lo.data_fim DESC
) l
WHERE vinculos_servidor.servidor_id = l.servidor_id
  AND vinculos_servidor.ativo = true;
