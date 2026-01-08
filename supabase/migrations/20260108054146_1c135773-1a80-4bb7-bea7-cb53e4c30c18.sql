-- Corrigir view v_servidores_situacao para buscar lotações corretamente
-- O servidor pode ter lotações via user_id (profiles) OU diretamente via servidores.id

DROP VIEW IF EXISTS v_servidores_situacao;

CREATE VIEW v_servidores_situacao WITH (security_invoker = true) AS
SELECT 
  s.id,
  s.nome_completo,
  s.cpf,
  s.matricula,
  s.foto_url,
  s.email_institucional,
  s.telefone_celular,
  s.situacao,
  s.tipo_servidor,
  s.data_posse,
  -- Vínculo funcional vigente (busca por servidor.id OU servidor.user_id)
  vf.id as vinculo_id,
  vf.tipo_vinculo,
  vf.data_inicio as vinculo_inicio,
  vf.orgao_origem as vinculo_orgao_origem,
  vf.orgao_destino as vinculo_orgao_destino,
  -- Provimento vigente
  p.id as provimento_id,
  p.status as provimento_status,
  p.data_nomeacao,
  -- Cargo via provimento ou direto do servidor
  COALESCE(cp.id, s.cargo_atual_id) as cargo_id,
  COALESCE(cp.nome, c_atual.nome) as cargo_nome,
  COALESCE(cp.sigla, c_atual.sigla) as cargo_sigla,
  COALESCE(cp.natureza, c_atual.natureza) as cargo_natureza,
  -- Lotação vigente (busca por servidor.id OU servidor.user_id)
  l.id as lotacao_id,
  l.tipo_lotacao,
  l.data_inicio as lotacao_inicio,
  l.funcao_exercida as lotacao_funcao,
  -- Unidade via lotação ou direto do servidor
  COALESCE(ul.id, s.unidade_atual_id) as unidade_id,
  COALESCE(ul.nome, u_atual.nome) as unidade_nome,
  COALESCE(ul.sigla, u_atual.sigla) as unidade_sigla,
  -- Cessão vigente
  ces.id as cessao_id,
  ces.tipo as cessao_tipo,
  ces.data_inicio as cessao_inicio,
  ces.orgao_origem as cessao_orgao_origem,
  ces.orgao_destino as cessao_orgao_destino,
  ces.onus as cessao_onus
FROM servidores s
-- Vínculo - busca por s.id ou s.user_id
LEFT JOIN LATERAL (
  SELECT * FROM vinculos_funcionais vf_inner
  WHERE (vf_inner.servidor_id = s.id OR vf_inner.servidor_id = s.user_id)
    AND vf_inner.ativo = true
  ORDER BY vf_inner.data_inicio DESC
  LIMIT 1
) vf ON true
-- Provimento - busca por s.id ou s.user_id
LEFT JOIN LATERAL (
  SELECT * FROM provimentos p_inner
  WHERE (p_inner.servidor_id = s.id OR p_inner.servidor_id = s.user_id)
    AND p_inner.status = 'ativo'
  ORDER BY p_inner.data_nomeacao DESC
  LIMIT 1
) p ON true
-- Cargo do provimento
LEFT JOIN cargos cp ON p.cargo_id = cp.id
-- Cargo atual do servidor (fallback)
LEFT JOIN cargos c_atual ON s.cargo_atual_id = c_atual.id
-- Lotação vigente - busca por s.id ou s.user_id
LEFT JOIN LATERAL (
  SELECT * FROM lotacoes l_inner
  WHERE (l_inner.servidor_id = s.id OR l_inner.servidor_id = s.user_id)
    AND l_inner.ativo = true
  ORDER BY l_inner.data_inicio DESC
  LIMIT 1
) l ON true
-- Unidade da lotação
LEFT JOIN estrutura_organizacional ul ON l.unidade_id = ul.id
-- Unidade atual do servidor (fallback)
LEFT JOIN estrutura_organizacional u_atual ON s.unidade_atual_id = u_atual.id
-- Cessão vigente - busca por s.id ou s.user_id
LEFT JOIN LATERAL (
  SELECT * FROM cessoes ces_inner
  WHERE (ces_inner.servidor_id = s.id OR ces_inner.servidor_id = s.user_id)
    AND ces_inner.ativa = true
  ORDER BY ces_inner.data_inicio DESC
  LIMIT 1
) ces ON true;

-- Grant acesso
GRANT SELECT ON v_servidores_situacao TO authenticated;