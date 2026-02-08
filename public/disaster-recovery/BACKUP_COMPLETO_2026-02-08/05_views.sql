-- ============================================================
-- IDJUV - BACKUP COMPLETO - VIEWS
-- Gerado em: 2026-02-08
-- Total: 12 views
-- ============================================================

-- IMPORTANTE: Todas as views usam security_invoker = on
-- para respeitar as políticas RLS das tabelas subjacentes

-- ============================================
-- VIEW: v_cedencias_a_vencer
-- ============================================
CREATE OR REPLACE VIEW public.v_cedencias_a_vencer
WITH (security_invoker = on)
AS
SELECT 
  a.id AS agenda_id,
  a.numero_protocolo,
  a.titulo,
  a.solicitante_nome,
  a.data_inicio,
  a.data_fim,
  a.status,
  u.id AS unidade_id,
  u.nome AS nome_unidade,
  u.cidade AS municipio,
  (EXTRACT(day FROM (a.data_fim::timestamp - CURRENT_TIMESTAMP)))::integer AS dias_para_vencer
FROM agenda_unidade a
JOIN unidades_locais u ON u.id = a.unidade_local_id
WHERE a.status = 'aprovado'::status_agenda 
  AND a.data_fim > CURRENT_TIMESTAMP 
  AND EXTRACT(day FROM (a.data_fim::timestamp - CURRENT_TIMESTAMP)) <= 30
ORDER BY a.data_fim;

-- ============================================
-- VIEW: v_historico_bem_completo
-- ============================================
CREATE OR REPLACE VIEW public.v_historico_bem_completo
WITH (security_invoker = on)
AS
SELECT 
  hp.id,
  hp.bem_id,
  hp.tipo_evento,
  hp.data_evento,
  hp.justificativa,
  hp.documento_url,
  hp.dados_anteriores,
  hp.dados_novos,
  bp.numero_patrimonio,
  bp.descricao AS bem_descricao,
  ul.id AS unidade_local_id,
  ul.nome AS nome_unidade,
  ul.codigo_unidade,
  s.id AS responsavel_id,
  s.nome_completo AS responsavel_nome
FROM historico_patrimonio hp
JOIN bens_patrimoniais bp ON bp.id = hp.bem_id
LEFT JOIN unidades_locais ul ON ul.id = hp.unidade_local_id
LEFT JOIN servidores s ON s.id = hp.responsavel_id
ORDER BY hp.data_evento DESC;

-- ============================================
-- VIEW: v_instituicoes_resumo
-- ============================================
CREATE OR REPLACE VIEW public.v_instituicoes_resumo
WITH (security_invoker = on)
AS
SELECT 
  i.id,
  i.codigo_instituicao,
  i.tipo_instituicao,
  i.nome_razao_social,
  i.nome_fantasia,
  i.cnpj,
  i.esfera_governo,
  i.orgao_vinculado,
  i.endereco_cidade,
  i.endereco_uf,
  i.telefone,
  i.email,
  i.responsavel_nome,
  i.responsavel_cargo,
  i.status,
  i.ativo,
  i.created_at,
  (SELECT count(*) FROM agenda_unidade a WHERE a.instituicao_id = i.id) AS total_solicitacoes,
  (SELECT count(*) FROM agenda_unidade a WHERE a.instituicao_id = i.id AND a.status = 'aprovado'::status_agenda) AS solicitacoes_aprovadas
FROM instituicoes i;

-- ============================================
-- VIEW: v_movimentacoes_completas
-- ============================================
CREATE OR REPLACE VIEW public.v_movimentacoes_completas
WITH (security_invoker = on)
AS
SELECT 
  m.id,
  m.tipo,
  m.data_movimentacao,
  m.status,
  m.motivo,
  m.observacoes,
  m.termo_transferencia_url,
  m.documento_url,
  m.aceite_responsavel,
  m.data_aceite,
  m.created_at,
  bp.id AS bem_id,
  bp.numero_patrimonio,
  bp.descricao AS bem_descricao,
  bp.categoria_bem,
  bp.valor_aquisicao AS bem_valor,
  uo.id AS origem_unidade_id,
  uo.nome AS origem_nome,
  uo.codigo_unidade AS origem_codigo,
  so.nome_completo AS origem_responsavel_nome,
  ud.id AS destino_unidade_id,
  ud.nome AS destino_nome,
  ud.codigo_unidade AS destino_codigo,
  sd.nome_completo AS destino_responsavel_nome,
  sol.nome_completo AS solicitante_nome,
  apr.nome_completo AS aprovador_nome,
  m.data_aprovacao
FROM movimentacoes_patrimonio m
JOIN bens_patrimoniais bp ON bp.id = m.bem_id
LEFT JOIN unidades_locais uo ON uo.id = m.unidade_local_origem_id
LEFT JOIN unidades_locais ud ON ud.id = m.unidade_local_destino_id
LEFT JOIN servidores so ON so.id = m.responsavel_origem_id
LEFT JOIN servidores sd ON sd.id = m.responsavel_destino_id
LEFT JOIN servidores sol ON sol.id = m.solicitado_por
LEFT JOIN servidores apr ON apr.id = m.aprovado_por;

-- ============================================
-- VIEW: v_patrimonio_por_unidade
-- ============================================
CREATE OR REPLACE VIEW public.v_patrimonio_por_unidade
WITH (security_invoker = on)
AS
SELECT 
  ul.id AS unidade_id,
  ul.codigo_unidade,
  ul.nome AS nome_unidade,
  ul.cidade AS municipio,
  ul.tipo_unidade,
  ul.status AS status_unidade,
  count(bp.id) AS total_bens,
  COALESCE(sum(bp.valor_aquisicao), 0) AS valor_total,
  sum(CASE WHEN bp.situacao = 'alocado' THEN 1 ELSE 0 END) AS bens_alocados,
  sum(CASE WHEN bp.situacao = 'em_manutencao' THEN 1 ELSE 0 END) AS bens_manutencao,
  sum(CASE WHEN bp.situacao = 'baixado' THEN 1 ELSE 0 END) AS bens_baixados,
  count(DISTINCT bp.responsavel_id) AS total_responsaveis
FROM unidades_locais ul
LEFT JOIN bens_patrimoniais bp ON bp.unidade_local_id = ul.id
GROUP BY ul.id, ul.codigo_unidade, ul.nome, ul.cidade, ul.tipo_unidade, ul.status;

-- ============================================
-- VIEW: v_processos_resumo
-- ============================================
CREATE OR REPLACE VIEW public.v_processos_resumo
WITH (security_invoker = on)
AS
SELECT 
  p.id,
  p.numero_processo,
  p.numero_sei,
  p.tipo_processo,
  p.assunto,
  p.interessado,
  p.data_abertura,
  p.prazo_resposta,
  p.status,
  p.prioridade,
  p.nivel_sigilo,
  u.nome AS unidade_origem_nome,
  s.nome_completo AS responsavel_nome,
  (p.prazo_resposta - CURRENT_DATE) AS dias_restantes,
  CASE 
    WHEN p.prazo_resposta < CURRENT_DATE THEN 'vencido'
    WHEN p.prazo_resposta <= CURRENT_DATE + 5 THEN 'urgente'
    ELSE 'normal'
  END AS situacao_prazo
FROM processos_administrativos p
LEFT JOIN estrutura_organizacional u ON u.id = p.unidade_origem_id
LEFT JOIN servidores s ON s.id = p.responsavel_atual_id;

-- ============================================
-- VIEW: v_relatorio_patrimonio
-- ============================================
CREATE OR REPLACE VIEW public.v_relatorio_patrimonio
WITH (security_invoker = on)
AS
SELECT 
  bp.id,
  bp.numero_patrimonio,
  bp.descricao,
  bp.categoria_bem,
  bp.marca,
  bp.modelo,
  bp.data_aquisicao,
  bp.valor_aquisicao,
  bp.valor_liquido,
  bp.situacao,
  bp.estado_conservacao,
  ul.id AS unidade_id,
  ul.nome AS unidade_nome,
  ul.codigo_unidade,
  s.nome_completo AS responsavel_nome,
  s.matricula AS responsavel_matricula
FROM bens_patrimoniais bp
LEFT JOIN unidades_locais ul ON ul.id = bp.unidade_local_id
LEFT JOIN servidores s ON s.id = bp.responsavel_id;

-- ============================================
-- VIEW: v_relatorio_unidades_locais
-- ============================================
CREATE OR REPLACE VIEW public.v_relatorio_unidades_locais
WITH (security_invoker = on)
AS
SELECT 
  ul.id,
  ul.nome,
  ul.codigo_unidade,
  ul.tipo_unidade,
  ul.status,
  ul.cidade AS municipio,
  ul.capacidade_pessoas,
  (SELECT count(*) FROM bens_patrimoniais bp WHERE bp.unidade_local_id = ul.id) AS total_bens,
  (SELECT COALESCE(sum(valor_aquisicao), 0) FROM bens_patrimoniais bp WHERE bp.unidade_local_id = ul.id) AS valor_patrimonio,
  (SELECT count(*) FROM agenda_unidade a WHERE a.unidade_local_id = ul.id AND a.status = 'aprovado') AS cedencias_ativas
FROM unidades_locais ul;

-- ============================================
-- VIEW: v_relatorio_uso_unidades
-- ============================================
CREATE OR REPLACE VIEW public.v_relatorio_uso_unidades
WITH (security_invoker = on)
AS
SELECT 
  ul.id AS unidade_id,
  ul.nome AS unidade_nome,
  ul.tipo_unidade,
  count(a.id) AS total_solicitacoes,
  sum(CASE WHEN a.status = 'aprovado' THEN 1 ELSE 0 END) AS aprovadas,
  sum(CASE WHEN a.status = 'rejeitado' THEN 1 ELSE 0 END) AS rejeitadas,
  sum(CASE WHEN a.status = 'cancelado' THEN 1 ELSE 0 END) AS canceladas,
  sum(CASE WHEN a.status = 'concluido' THEN 1 ELSE 0 END) AS concluidas,
  EXTRACT(YEAR FROM a.data_inicio)::INTEGER AS ano
FROM unidades_locais ul
LEFT JOIN agenda_unidade a ON a.unidade_local_id = ul.id
GROUP BY ul.id, ul.nome, ul.tipo_unidade, EXTRACT(YEAR FROM a.data_inicio);

-- ============================================
-- VIEW: v_resumo_patrimonio
-- ============================================
CREATE OR REPLACE VIEW public.v_resumo_patrimonio
WITH (security_invoker = on)
AS
SELECT
  count(*) AS total_bens,
  sum(valor_aquisicao) AS valor_total,
  sum(CASE WHEN situacao = 'ativo' THEN 1 ELSE 0 END) AS bens_ativos,
  sum(CASE WHEN situacao = 'baixado' THEN 1 ELSE 0 END) AS bens_baixados,
  sum(CASE WHEN categoria_bem = 'informatica' THEN 1 ELSE 0 END) AS bens_informatica,
  sum(CASE WHEN categoria_bem = 'mobiliario' THEN 1 ELSE 0 END) AS bens_mobiliario,
  sum(CASE WHEN categoria_bem = 'equipamento_esportivo' THEN 1 ELSE 0 END) AS bens_esportivos
FROM bens_patrimoniais;

-- ============================================
-- VIEW: v_servidores_situacao
-- ============================================
CREATE OR REPLACE VIEW public.v_servidores_situacao
WITH (security_invoker = on)
AS
SELECT 
  s.id,
  s.matricula,
  s.nome_completo,
  s.cpf,
  s.email,
  s.situacao,
  s.vinculo,
  c.nome AS cargo_nome,
  c.categoria AS cargo_categoria,
  eo.nome AS unidade_nome,
  eo.sigla AS unidade_sigla,
  s.data_admissao,
  s.ativo
FROM servidores s
LEFT JOIN cargos c ON c.id = s.cargo_id
LEFT JOIN estrutura_organizacional eo ON eo.id = s.unidade_id;

-- ============================================
-- VIEW: v_sic_consulta_publica
-- ============================================
CREATE OR REPLACE VIEW public.v_sic_consulta_publica
WITH (security_invoker = on)
AS
SELECT 
  s.protocolo,
  s.tipo_solicitacao,
  s.assunto_categoria,
  s.status,
  s.prazo_resposta,
  s.created_at AS data_solicitacao,
  s.respondido_em AS data_resposta,
  CASE 
    WHEN s.prazo_resposta < CURRENT_DATE AND s.status != 'respondida' THEN 'vencido'
    WHEN s.prazo_resposta <= CURRENT_DATE + 5 AND s.status != 'respondida' THEN 'urgente'
    ELSE 'normal'
  END AS situacao_prazo
FROM solicitacoes_sic s
WHERE s.status != 'cancelada';

-- ============================================================
-- FIM: 05_views.sql
-- Próximo: 06_rls_enable.sql
-- ============================================================
