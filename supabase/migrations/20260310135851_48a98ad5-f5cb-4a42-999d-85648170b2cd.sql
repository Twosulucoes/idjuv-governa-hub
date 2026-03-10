-- Fix: Security Definer View - usar security_invoker
DROP VIEW IF EXISTS public.v_servidor_tipo_derivado;

CREATE VIEW public.v_servidor_tipo_derivado 
WITH (security_invoker = true) AS
SELECT 
  s.id AS servidor_id,
  s.nome_completo,
  s.matricula,
  CASE
    WHEN EXISTS (SELECT 1 FROM public.vinculos_servidor v WHERE v.servidor_id = s.id AND v.ativo AND v.tipo = 'efetivo')
      AND EXISTS (SELECT 1 FROM public.vinculos_servidor v WHERE v.servidor_id = s.id AND v.ativo AND v.tipo = 'comissionado')
    THEN 'efetivo_comissionado'
    WHEN EXISTS (SELECT 1 FROM public.vinculos_servidor v WHERE v.servidor_id = s.id AND v.ativo AND v.tipo = 'efetivo')
    THEN 'efetivo'
    WHEN EXISTS (SELECT 1 FROM public.vinculos_servidor v WHERE v.servidor_id = s.id AND v.ativo AND v.tipo = 'cedido_entrada')
      AND EXISTS (SELECT 1 FROM public.vinculos_servidor v WHERE v.servidor_id = s.id AND v.ativo AND v.tipo = 'comissionado')
    THEN 'cedido_comissionado'
    WHEN EXISTS (SELECT 1 FROM public.vinculos_servidor v WHERE v.servidor_id = s.id AND v.ativo AND v.tipo = 'cedido_entrada')
    THEN 'cedido_entrada'
    WHEN EXISTS (SELECT 1 FROM public.vinculos_servidor v WHERE v.servidor_id = s.id AND v.ativo AND v.tipo = 'federal')
      AND EXISTS (SELECT 1 FROM public.vinculos_servidor v WHERE v.servidor_id = s.id AND v.ativo AND v.tipo = 'comissionado')
    THEN 'federal_comissionado'
    WHEN EXISTS (SELECT 1 FROM public.vinculos_servidor v WHERE v.servidor_id = s.id AND v.ativo AND v.tipo = 'federal')
    THEN 'federal'
    WHEN EXISTS (SELECT 1 FROM public.vinculos_servidor v WHERE v.servidor_id = s.id AND v.ativo AND v.tipo = 'comissionado')
    THEN 'comissionado'
    WHEN EXISTS (SELECT 1 FROM public.vinculos_servidor v WHERE v.servidor_id = s.id AND v.ativo AND v.tipo = 'requisitado')
    THEN 'requisitado'
    ELSE 'nao_classificado'
  END AS tipo_derivado,
  (SELECT COUNT(*) FROM public.vinculos_servidor v WHERE v.servidor_id = s.id AND v.ativo) AS total_vinculos_ativos,
  (SELECT array_agg(DISTINCT v.tipo::text ORDER BY v.tipo::text) FROM public.vinculos_servidor v WHERE v.servidor_id = s.id AND v.ativo) AS tipos_ativos
FROM public.servidores s;