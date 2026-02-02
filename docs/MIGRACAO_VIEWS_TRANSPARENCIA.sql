-- ============================================================
-- MIGRAÇÃO 4.2 - TRANSPARÊNCIA PÚBLICA LGPD-SAFE (CORRIGIDA)
-- ============================================================
-- Execute este script manualmente no SQL Editor do Supabase
-- Data: Fevereiro/2026
-- Fase: 4.2 - Transparência e LAI
-- 
-- ESCOPO: Apenas views públicas com dados institucionais
-- EXCLUÍDO: Qualquer dado pessoal identificável (CPF, nome de 
--           servidor, matrícula, e-mail, telefone, etc.)
-- 
-- Base Legal: LGPD Art. 6º, III (princípio da minimização)
-- ============================================================

-- ============================================================
-- PARTE 1: VIEWS PÚBLICAS DE TRANSPARÊNCIA (LGPD-Safe)
-- ============================================================

-- 1.1 View pública de licitações (sem dados pessoais)
DROP VIEW IF EXISTS public.v_transparencia_licitacoes CASCADE;

CREATE VIEW public.v_transparencia_licitacoes WITH (security_invoker = true) AS
SELECT 
  pl.id,
  pl.numero_processo,
  pl.ano,
  pl.modalidade::text as modalidade,
  pl.objeto,
  pl.fase_atual::text as situacao,
  pl.valor_estimado,
  pl.data_abertura,
  pl.data_homologacao,
  pl.fundamentacao_legal,
  -- Unidade requisitante (dado institucional, não pessoal)
  eo.nome as unidade_requisitante,
  -- Fornecedor vencedor - APENAS pessoa jurídica com CNPJ mascarado
  CASE 
    WHEN f.tipo_pessoa = 'juridica' THEN f.razao_social
    ELSE NULL -- Não exibe nome de pessoa física
  END as vencedor_razao_social,
  CASE 
    WHEN f.tipo_pessoa = 'juridica' AND f.cnpj IS NOT NULL 
    THEN CONCAT(SUBSTRING(f.cnpj, 1, 8), '****', SUBSTRING(f.cnpj, 13, 4))
    ELSE NULL -- Não exibe CPF
  END as vencedor_cnpj_parcial,
  pl.created_at as data_cadastro
FROM public.processos_licitatorios pl
LEFT JOIN public.estrutura_organizacional eo ON pl.unidade_requisitante_id = eo.id
LEFT JOIN public.fornecedores f ON pl.fornecedor_id = f.id
WHERE f.tipo_pessoa IS NULL OR f.tipo_pessoa = 'juridica'; -- Exclui fornecedores pessoa física

COMMENT ON VIEW public.v_transparencia_licitacoes IS 
  'View pública de licitações - LGPD Safe. Exclui fornecedores pessoa física.';


-- 1.2 View pública de contratos (sem dados pessoais)
DROP VIEW IF EXISTS public.v_transparencia_contratos CASCADE;

CREATE VIEW public.v_transparencia_contratos WITH (security_invoker = true) AS
SELECT 
  c.id,
  c.numero_contrato,
  c.ano,
  c.objeto,
  c.tipo::text as tipo,
  c.valor_global,
  c.data_assinatura,
  c.data_vigencia_inicio,
  c.data_vigencia_fim,
  c.fundamentacao_legal,
  c.situacao::text as situacao,
  -- Contratado - APENAS pessoa jurídica com CNPJ mascarado
  CASE 
    WHEN f.tipo_pessoa = 'juridica' THEN f.razao_social
    ELSE NULL -- Não exibe nome de pessoa física
  END as contratado_razao_social,
  CASE 
    WHEN f.tipo_pessoa = 'juridica' AND f.cnpj IS NOT NULL 
    THEN CONCAT(SUBSTRING(f.cnpj, 1, 8), '****', SUBSTRING(f.cnpj, 13, 4))
    ELSE NULL -- Não exibe CPF
  END as contratado_cnpj_parcial,
  -- Aditivos agregados (dados financeiros, não pessoais)
  (SELECT COUNT(*) FROM public.aditivos_contrato ac WHERE ac.contrato_id = c.id) as total_aditivos,
  (SELECT COALESCE(SUM(ac.valor_acrescimo), 0) - COALESCE(SUM(ac.valor_supressao), 0) 
   FROM public.aditivos_contrato ac WHERE ac.contrato_id = c.id) as valor_total_aditivos,
  c.created_at as data_cadastro
FROM public.contratos c
LEFT JOIN public.fornecedores f ON c.fornecedor_id = f.id
WHERE f.tipo_pessoa IS NULL OR f.tipo_pessoa = 'juridica'; -- Exclui contratos com pessoa física

COMMENT ON VIEW public.v_transparencia_contratos IS 
  'View pública de contratos - LGPD Safe. Exclui contratos com pessoa física.';


-- 1.3 View pública de execução orçamentária (dados agregados)
DROP VIEW IF EXISTS public.v_transparencia_execucao CASCADE;

CREATE VIEW public.v_transparencia_execucao WITH (security_invoker = true) AS
SELECT 
  d.exercicio as ano,
  uo.nome as unidade_orcamentaria,
  d.programa,
  d.acao,
  d.elemento_despesa,
  d.fonte_recurso,
  SUM(d.valor_inicial) as valor_inicial,
  SUM(d.valor_atualizado) as valor_atualizado,
  SUM(d.valor_empenhado) as valor_empenhado,
  SUM(d.valor_liquidado) as valor_liquidado,
  SUM(d.valor_pago) as valor_pago,
  CASE 
    WHEN SUM(d.valor_atualizado) > 0 
    THEN ROUND((SUM(d.valor_empenhado) / SUM(d.valor_atualizado)) * 100, 2)
    ELSE 0 
  END as percentual_execucao
FROM public.dotacoes_orcamentarias d
LEFT JOIN public.unidades_orcamentarias uo ON d.unidade_orcamentaria_id = uo.id
GROUP BY d.exercicio, uo.nome, d.programa, d.acao, d.elemento_despesa, d.fonte_recurso
ORDER BY d.exercicio DESC, uo.nome;

COMMENT ON VIEW public.v_transparencia_execucao IS 
  'View pública de execução orçamentária - Dados agregados por programa/ação.';


-- 1.4 View pública de patrimônio (SEM RESPONSÁVEL PESSOAL)
DROP VIEW IF EXISTS public.v_transparencia_patrimonio CASCADE;

CREATE VIEW public.v_transparencia_patrimonio WITH (security_invoker = true) AS
SELECT 
  bp.id,
  bp.numero_patrimonio,
  bp.descricao,
  bp.marca,
  bp.modelo,
  -- Omitido: numero_serie (pode identificar aquisição específica)
  bp.situacao,
  bp.estado_conservacao,
  bp.valor_aquisicao,
  -- Omitido: valor_liquido, depreciacao (dados internos)
  bp.data_aquisicao,
  -- Omitido: nota_fiscal (dado interno)
  -- Localização institucional apenas
  ul.nome as unidade_local_nome,
  ul.municipio as unidade_local_municipio,
  eo.nome as unidade_administrativa
  -- Omitido: responsavel_id, responsavel_nome, responsavel_matricula
FROM public.bens_patrimoniais bp
LEFT JOIN public.unidades_locais ul ON bp.unidade_local_id = ul.id
LEFT JOIN public.estrutura_organizacional eo ON bp.unidade_id = eo.id;

COMMENT ON VIEW public.v_transparencia_patrimonio IS 
  'View pública de patrimônio - LGPD Safe. SEM dados de responsável.';


-- 1.5 View pública de estatísticas LAI (completamente anonimizada)
DROP VIEW IF EXISTS public.v_transparencia_lai_estatisticas CASCADE;

CREATE VIEW public.v_transparencia_lai_estatisticas WITH (security_invoker = true) AS
SELECT 
  EXTRACT(YEAR FROM created_at)::integer as ano,
  EXTRACT(MONTH FROM created_at)::integer as mes,
  -- Contagens agregadas (sem identificação)
  COUNT(*) as total_solicitacoes,
  COUNT(*) FILTER (WHERE status = 'respondido') as respondidas,
  COUNT(*) FILTER (WHERE status = 'em_analise') as em_analise,
  COUNT(*) FILTER (WHERE status = 'indeferido') as indeferidas,
  COUNT(*) FILTER (WHERE status = 'recurso') as em_recurso,
  COUNT(*) FILTER (WHERE status = 'pendente') as pendentes,
  -- Métricas de desempenho (sem dados pessoais)
  ROUND(AVG(
    CASE 
      WHEN respondido_em IS NOT NULL AND created_at IS NOT NULL 
      THEN EXTRACT(DAY FROM (respondido_em - created_at))
      ELSE NULL 
    END
  ), 1) as tempo_medio_resposta_dias,
  -- Contagem de atrasadas (prazo legal 30 dias)
  COUNT(*) FILTER (
    WHERE prazo_resposta < CURRENT_DATE 
    AND status NOT IN ('respondido', 'indeferido', 'cancelado')
  ) as atrasadas
FROM public.solicitacoes_sic
GROUP BY EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)
ORDER BY ano DESC, mes DESC;

COMMENT ON VIEW public.v_transparencia_lai_estatisticas IS 
  'Estatísticas anonimizadas de solicitações LAI/e-SIC. Sem dados de solicitante.';


-- ============================================================
-- PARTE 2: PERMISSÕES DE ACESSO PÚBLICO
-- ============================================================

-- Conceder SELECT apenas para usuários anônimos e autenticados
GRANT SELECT ON public.v_transparencia_licitacoes TO anon, authenticated;
GRANT SELECT ON public.v_transparencia_contratos TO anon, authenticated;
GRANT SELECT ON public.v_transparencia_execucao TO anon, authenticated;
GRANT SELECT ON public.v_transparencia_patrimonio TO anon, authenticated;
GRANT SELECT ON public.v_transparencia_lai_estatisticas TO anon, authenticated;


-- ============================================================
-- PARTE 3: RLS PARA TABELAS LAI (FASE 4.1)
-- ============================================================

-- 3.1 Políticas para prazos_lai (configuração administrativa)
ALTER TABLE public.prazos_lai ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prazos_lai FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins podem gerenciar prazos LAI" ON public.prazos_lai;
CREATE POLICY "Admins podem gerenciar prazos LAI"
  ON public.prazos_lai
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "Usuários autenticados podem visualizar prazos LAI" ON public.prazos_lai;
CREATE POLICY "Usuários autenticados podem visualizar prazos LAI"
  ON public.prazos_lai
  FOR SELECT
  USING (auth.role() = 'authenticated');


-- 3.2 Políticas para historico_lai (auditoria)
ALTER TABLE public.historico_lai ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_lai FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios LAI podem visualizar historico" ON public.historico_lai;
CREATE POLICY "Usuarios LAI podem visualizar historico"
  ON public.historico_lai
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    OR public.usuario_tem_permissao(auth.uid(), 'lai.responder')
    OR public.usuario_tem_permissao(auth.uid(), 'lai.recurso')
  );

DROP POLICY IF EXISTS "Usuarios LAI podem criar historico" ON public.historico_lai;
CREATE POLICY "Usuarios LAI podem criar historico"
  ON public.historico_lai
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    OR public.usuario_tem_permissao(auth.uid(), 'lai.responder')
  );


-- 3.3 Políticas para recursos_lai (gestão de recursos)
ALTER TABLE public.recursos_lai ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recursos_lai FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios LAI podem gerenciar recursos" ON public.recursos_lai;
CREATE POLICY "Usuarios LAI podem gerenciar recursos"
  ON public.recursos_lai
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    OR public.usuario_tem_permissao(auth.uid(), 'lai.recurso')
  );

DROP POLICY IF EXISTS "Usuarios LAI podem visualizar recursos" ON public.recursos_lai;
CREATE POLICY "Usuarios LAI podem visualizar recursos"
  ON public.recursos_lai
  FOR SELECT
  USING (
    public.usuario_tem_permissao(auth.uid(), 'lai.responder')
  );


-- 3.4 Políticas para debitos_tecnicos (gestão interna)
ALTER TABLE public.debitos_tecnicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debitos_tecnicos FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins podem gerenciar debitos tecnicos" ON public.debitos_tecnicos;
CREATE POLICY "Admins podem gerenciar debitos tecnicos"
  ON public.debitos_tecnicos
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "Usuarios autenticados podem visualizar debitos" ON public.debitos_tecnicos;
CREATE POLICY "Usuarios autenticados podem visualizar debitos"
  ON public.debitos_tecnicos
  FOR SELECT
  USING (auth.role() = 'authenticated');


-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================

-- Verificar views criadas:
-- SELECT table_name FROM information_schema.views 
-- WHERE table_schema = 'public' AND table_name LIKE 'v_transparencia%';

-- Verificar que NÃO há exposição de dados pessoais:
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_schema = 'public' 
--   AND table_name LIKE 'v_transparencia%'
--   AND column_name IN ('cpf', 'email', 'telefone', 'nome', 'matricula', 'responsavel_nome');
-- (Deve retornar 0 linhas)


-- ============================================================
-- NOTA: VIEWS DE RH INTERNO (FASE FUTURA)
-- ============================================================
-- As seguintes views NÃO fazem parte da FASE 4.2 e devem ser
-- tratadas em fase dedicada ao RH Interno:
--
-- - v_servidores_situacao (contém CPF, nome, matrícula)
-- - v_relatorio_patrimonio (com responsável pessoal)
-- - v_relatorio_unidades_locais (com responsável pessoal)
--
-- Essas views são de uso interno administrativo e não devem
-- ser expostas no Portal de Transparência.
-- ============================================================

-- FIM DA MIGRAÇÃO 4.2 - TRANSPARÊNCIA LGPD-SAFE
