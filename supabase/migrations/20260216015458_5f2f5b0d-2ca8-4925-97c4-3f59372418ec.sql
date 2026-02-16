
-- Migrar portarias antigas da tabela documentos para portarias_servidor
-- Cada servidor no array servidores_ids gera uma linha em portarias_servidor

INSERT INTO portarias_servidor (
  servidor_id,
  numero,
  ano,
  data_publicacao,
  tipo,
  assunto,
  ementa,
  conteudo,
  data_vigencia_inicio,
  data_vigencia_fim,
  documento_url,
  diario_oficial_numero,
  diario_oficial_data,
  status,
  observacoes,
  created_at,
  created_by
)
SELECT
  unnest(d.servidores_ids) AS servidor_id,
  d.numero,
  EXTRACT(YEAR FROM d.data_documento)::integer AS ano,
  COALESCE(d.data_publicacao, d.data_documento) AS data_publicacao,
  -- Mapear categoria do documento para tipo_portaria_rh
  CASE 
    WHEN d.categoria::text = 'nomeacao' THEN 'nomeacao'::tipo_portaria_rh
    WHEN d.categoria::text = 'exoneracao' THEN 'exoneracao'::tipo_portaria_rh
    WHEN d.categoria::text = 'designacao' THEN 'designacao'::tipo_portaria_rh
    WHEN d.categoria::text = 'dispensa' THEN 'dispensa'::tipo_portaria_rh
    WHEN d.categoria::text = 'cessao' THEN 'cessao'::tipo_portaria_rh
    WHEN d.categoria::text = 'ferias' THEN 'ferias'::tipo_portaria_rh
    WHEN d.categoria::text = 'pessoal' THEN 'outro'::tipo_portaria_rh
    ELSE 'outro'::tipo_portaria_rh
  END AS tipo,
  d.titulo AS assunto,
  d.ementa,
  d.conteudo_html AS conteudo,
  d.data_vigencia_inicio,
  d.data_vigencia_fim,
  COALESCE(d.arquivo_assinado_url, d.arquivo_url) AS documento_url,
  d.doe_numero AS diario_oficial_numero,
  d.doe_data AS diario_oficial_data,
  CASE 
    WHEN d.status::text = 'vigente' THEN 'vigente'
    WHEN d.status::text = 'publicado' THEN 'vigente'
    WHEN d.status::text = 'revogado' THEN 'revogada'
    ELSE 'vigente'
  END AS status,
  'Migrado automaticamente da tabela documentos (ID: ' || d.id::text || ')' AS observacoes,
  d.created_at,
  d.created_by
FROM documentos d
WHERE d.tipo = 'portaria'
  AND d.servidores_ids IS NOT NULL
  AND array_length(d.servidores_ids, 1) > 0
  -- Evitar duplicatas caso a migração seja executada novamente
  AND NOT EXISTS (
    SELECT 1 FROM portarias_servidor ps 
    WHERE ps.observacoes LIKE '%' || d.id::text || '%'
  );
