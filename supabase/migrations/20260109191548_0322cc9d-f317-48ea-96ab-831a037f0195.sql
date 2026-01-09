-- ================================================================
-- MIGRAÇÃO: RECRIAR VIEWS COMPLETAMENTE
-- ================================================================

-- Dropar views para recriar
DROP VIEW IF EXISTS public.v_servidores_situacao CASCADE;
DROP VIEW IF EXISTS public.v_usuarios_sistema CASCADE;

-- Recriar view v_servidores_situacao
CREATE VIEW public.v_servidores_situacao AS
SELECT 
  s.id,
  s.nome_completo,
  s.cpf,
  s.matricula,
  s.tipo_servidor,
  s.situacao,
  s.foto_url,
  s.email_institucional,
  s.telefone_celular,
  
  -- Provimento ativo
  p.id AS provimento_id,
  p.cargo_id,
  c.nome AS cargo_nome,
  c.sigla AS cargo_sigla,
  c.natureza AS cargo_natureza,
  p.data_nomeacao,
  p.data_posse,
  p.status AS provimento_status,
  
  -- Lotação ativa
  l.id AS lotacao_id,
  l.unidade_id,
  u.nome AS unidade_nome,
  u.sigla AS unidade_sigla,
  l.tipo_lotacao,
  l.data_inicio AS lotacao_inicio,
  l.funcao_exercida AS lotacao_funcao,
  
  -- Cessão ativa
  cs.id AS cessao_id,
  cs.tipo AS cessao_tipo,
  cs.orgao_origem AS cessao_orgao_origem,
  cs.orgao_destino AS cessao_orgao_destino,
  cs.data_inicio AS cessao_inicio,
  cs.onus AS cessao_onus
  
FROM public.servidores s
LEFT JOIN public.provimentos p ON p.servidor_id = s.id AND p.status = 'ativo'
LEFT JOIN public.cargos c ON c.id = p.cargo_id
LEFT JOIN public.lotacoes l ON l.servidor_id = s.id AND l.ativo = true
LEFT JOIN public.estrutura_organizacional u ON u.id = l.unidade_id
LEFT JOIN public.cessoes cs ON cs.servidor_id = s.id AND cs.ativa = true
WHERE s.situacao NOT IN ('exonerado'::situacao_funcional, 'falecido'::situacao_funcional)
ORDER BY s.nome_completo;

-- Recriar view v_usuarios_sistema
CREATE VIEW public.v_usuarios_sistema AS
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.avatar_url,
  p.tipo_usuario,
  p.is_active,
  p.blocked_at,
  p.blocked_reason,
  p.cpf,
  p.created_at,
  p.servidor_id,
  s.nome_completo AS servidor_nome,
  s.matricula AS servidor_matricula,
  s.situacao AS servidor_situacao,
  s.tipo_servidor AS servidor_tipo,
  -- Cargo via provimento ativo
  c.nome AS cargo_nome,
  -- Unidade via lotação ativa
  eo.nome AS unidade_nome,
  ur.role AS user_role
FROM public.profiles p
LEFT JOIN public.servidores s ON s.id = p.servidor_id
LEFT JOIN public.provimentos prov ON prov.servidor_id = s.id AND prov.status = 'ativo'
LEFT JOIN public.cargos c ON c.id = prov.cargo_id
LEFT JOIN public.lotacoes lot ON lot.servidor_id = s.id AND lot.ativo = true
LEFT JOIN public.estrutura_organizacional eo ON eo.id = lot.unidade_id
LEFT JOIN public.user_roles ur ON ur.user_id = p.id;