-- ================================================================
-- CORREÇÃO DE SEGURANÇA: VIEWS E POLICIES
-- ================================================================

-- 1) Recriar a view com SECURITY INVOKER (padrão seguro)
DROP VIEW IF EXISTS public.v_servidores_situacao;

CREATE VIEW public.v_servidores_situacao 
WITH (security_invoker = true) AS
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
  
  -- Vínculo vigente
  vf.id AS vinculo_id,
  vf.tipo_vinculo,
  vf.data_inicio AS vinculo_inicio,
  vf.orgao_origem AS vinculo_orgao_origem,
  vf.orgao_destino AS vinculo_orgao_destino,
  
  -- Provimento vigente (se aplicável)
  p.id AS provimento_id,
  p.cargo_id,
  c.nome AS cargo_nome,
  c.sigla AS cargo_sigla,
  c.natureza AS cargo_natureza,
  p.data_nomeacao,
  p.data_posse,
  p.status AS provimento_status,
  
  -- Lotação vigente
  l.id AS lotacao_id,
  l.unidade_id,
  u.nome AS unidade_nome,
  u.sigla AS unidade_sigla,
  l.tipo_lotacao,
  l.data_inicio AS lotacao_inicio,
  l.funcao_exercida AS lotacao_funcao,
  
  -- Cessão ativa (se houver)
  ces.id AS cessao_id,
  ces.tipo AS cessao_tipo,
  ces.orgao_origem AS cessao_orgao_origem,
  ces.orgao_destino AS cessao_orgao_destino,
  ces.data_inicio AS cessao_inicio,
  ces.onus AS cessao_onus

FROM public.servidores s
LEFT JOIN public.vinculos_funcionais vf ON vf.servidor_id = s.id AND vf.ativo = true
LEFT JOIN public.provimentos p ON p.servidor_id = s.id AND p.status = 'ativo'
LEFT JOIN public.cargos c ON c.id = p.cargo_id
LEFT JOIN public.lotacoes l ON l.servidor_id = s.id AND l.ativo = true
LEFT JOIN public.estrutura_organizacional u ON u.id = l.unidade_id
LEFT JOIN public.cessoes ces ON ces.servidor_id = s.id AND ces.ativa = true
WHERE s.ativo = true;

GRANT SELECT ON public.v_servidores_situacao TO authenticated;

-- 2) Corrigir policies com USING (true) - restringir para autenticados
DROP POLICY IF EXISTS "Todos podem visualizar provimentos" ON public.provimentos;
CREATE POLICY "Autenticados podem visualizar provimentos" ON public.provimentos
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Todos podem visualizar cessões" ON public.cessoes;
CREATE POLICY "Autenticados podem visualizar cessões" ON public.cessoes
  FOR SELECT USING (auth.uid() IS NOT NULL);