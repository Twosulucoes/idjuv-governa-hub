
-- ==============================================
-- FINALIZAÇÃO SEGURANÇA - PARTE 2 (FINAL CORRIGIDA)
-- Views restantes e policies permissivas
-- ==============================================

-- 1. RECRIAR VIEWS RESTANTES COM SECURITY INVOKER
-- ==============================================

-- 1.1 v_relatorio_unidades_locais
DROP VIEW IF EXISTS public.v_relatorio_unidades_locais CASCADE;
CREATE VIEW public.v_relatorio_unidades_locais
WITH (security_invoker = true)
AS
SELECT 
  ul.id,
  ul.codigo_unidade,
  ul.nome_unidade,
  ul.tipo_unidade,
  ul.municipio,
  ul.endereco_completo,
  ul.status,
  ul.natureza_uso,
  ul.diretoria_vinculada,
  ul.unidade_administrativa,
  ul.autoridade_autorizadora,
  ul.capacidade,
  ul.horario_funcionamento,
  ul.estrutura_disponivel,
  ul.areas_disponiveis,
  ul.regras_de_uso,
  ul.observacoes,
  ul.fotos,
  ul.documentos,
  ul.created_at,
  ul.updated_at,
  ncu.servidor_id AS chefe_atual_id,
  s.nome_completo AS chefe_atual_nome,
  ncu.cargo AS chefe_atual_cargo,
  ncu.ato_numero AS chefe_ato_numero,
  ncu.data_inicio AS chefe_data_inicio,
  COALESCE(pat.total_itens, 0) AS total_patrimonio,
  COALESCE(pat.valor_total, 0) AS patrimonio_valor_total,
  COALESCE(pat.itens_bom_estado, 0) AS patrimonio_bom_estado,
  COALESCE(pat.itens_manutencao, 0) AS patrimonio_manutencao,
  COALESCE(ag.total_agendamentos, 0) AS total_agendamentos,
  COALESCE(ag.agendamentos_aprovados, 0) AS agendamentos_aprovados,
  COALESCE(ag.agendamentos_solicitados, 0) AS agendamentos_pendentes,
  COALESCE(tc.total_termos, 0) AS total_termos_cessao,
  COALESCE(tc.termos_vigentes, 0) AS termos_vigentes
FROM unidades_locais ul
LEFT JOIN LATERAL (
  SELECT servidor_id, cargo, ato_numero, data_inicio
  FROM nomeacoes_chefe_unidade
  WHERE unidade_local_id = ul.id AND status = 'ativo'
  ORDER BY data_inicio DESC LIMIT 1
) ncu ON true
LEFT JOIN servidores s ON s.id = ncu.servidor_id
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*) AS total_itens,
    SUM(valor_estimado * COALESCE(quantidade, 1)) AS valor_total,
    COUNT(*) FILTER (WHERE estado_conservacao = 'bom') AS itens_bom_estado,
    COUNT(*) FILTER (WHERE estado_conservacao IN ('regular', 'ruim')) AS itens_manutencao
  FROM patrimonio_unidade WHERE unidade_local_id = ul.id
) pat ON true
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*) AS total_agendamentos,
    COUNT(*) FILTER (WHERE status = 'aprovado') AS agendamentos_aprovados,
    COUNT(*) FILTER (WHERE status = 'solicitado') AS agendamentos_solicitados
  FROM agenda_unidade WHERE unidade_local_id = ul.id
) ag ON true
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*) AS total_termos,
    COUNT(*) FILTER (WHERE periodo_fim >= CURRENT_DATE) AS termos_vigentes
  FROM termos_cessao WHERE unidade_local_id = ul.id
) tc ON true;

-- 1.2 v_relatorio_uso_unidades
DROP VIEW IF EXISTS public.v_relatorio_uso_unidades CASCADE;
CREATE VIEW public.v_relatorio_uso_unidades
WITH (security_invoker = true)
AS
SELECT 
  ul.id AS unidade_id,
  ul.nome_unidade,
  ul.tipo_unidade,
  ul.municipio,
  a.id AS agenda_id,
  a.titulo,
  a.tipo_uso,
  a.solicitante_nome,
  a.data_inicio,
  a.data_fim,
  a.status AS status_agenda,
  a.publico_estimado,
  EXTRACT(DAY FROM (a.data_fim - a.data_inicio)) + 1 AS dias_uso
FROM unidades_locais ul
JOIN agenda_unidade a ON a.unidade_local_id = ul.id
WHERE a.status IN ('aprovado', 'concluido');

-- 1.3 v_servidores_situacao (sem coluna codigo que não existe)
DROP VIEW IF EXISTS public.v_servidores_situacao CASCADE;
CREATE VIEW public.v_servidores_situacao
WITH (security_invoker = true)
AS
SELECT 
  s.id,
  s.nome_completo,
  s.cpf,
  s.matricula,
  s.situacao,
  s.tipo_servidor,
  s.vinculo,
  s.ativo,
  c.nome AS cargo_nome,
  c.sigla AS cargo_sigla,
  eo.nome AS unidade_nome,
  eo.sigla AS unidade_sigla,
  p.data_nomeacao,
  p.data_posse,
  p.data_exercicio
FROM servidores s
LEFT JOIN cargos c ON c.id = s.cargo_atual_id
LEFT JOIN estrutura_organizacional eo ON eo.id = s.unidade_atual_id
LEFT JOIN LATERAL (
  SELECT data_nomeacao, data_posse, data_exercicio
  FROM provimentos
  WHERE servidor_id = s.id AND status = 'ativo'
  ORDER BY data_nomeacao DESC LIMIT 1
) p ON true;

-- 1.4 v_sic_consulta_publica
DROP VIEW IF EXISTS public.v_sic_consulta_publica CASCADE;
CREATE VIEW public.v_sic_consulta_publica
WITH (security_invoker = true)
AS
SELECT 
  protocolo,
  status,
  prazo_resposta,
  respondido_em,
  CASE WHEN respondido_em IS NOT NULL THEN resposta ELSE NULL END AS resposta,
  (prazo_resposta - CURRENT_DATE) AS dias_restantes
FROM solicitacoes_sic;

-- 1.5 v_usuarios_sistema
DROP VIEW IF EXISTS public.v_usuarios_sistema CASCADE;
CREATE VIEW public.v_usuarios_sistema
WITH (security_invoker = true)
AS
SELECT 
  p.id,
  p.full_name,
  p.avatar_url,
  p.created_at,
  p.updated_at,
  COALESCE(
    (SELECT array_agg(pf.nome) 
     FROM usuario_perfis up 
     JOIN perfis pf ON pf.id = up.perfil_id 
     WHERE up.user_id = p.id AND up.ativo = true),
    ARRAY[]::TEXT[]
  ) AS perfis
FROM profiles p;

-- 2. CORRIGIR POLICIES PERMISSIVAS CRÍTICAS
-- ==============================================

-- 2.1 federacoes_esportivas
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar federações" ON public.federacoes_esportivas;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir federações" ON public.federacoes_esportivas;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'federacoes_esportivas' AND policyname = 'federacoes_update_admin') THEN
    CREATE POLICY federacoes_update_admin ON public.federacoes_esportivas
    FOR UPDATE USING (
      public.usuario_tem_permissao(auth.uid(), 'federacoes.editar')
      OR public.usuario_eh_admin(auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'federacoes_esportivas' AND policyname = 'federacoes_delete_admin') THEN
    CREATE POLICY federacoes_delete_admin ON public.federacoes_esportivas
    FOR DELETE USING (
      public.usuario_tem_permissao(auth.uid(), 'federacoes.excluir')
      OR public.usuario_eh_admin(auth.uid())
    );
  END IF;
END $$;

-- 2.2 frequencia_pacotes
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar pacotes" ON public.frequencia_pacotes;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'frequencia_pacotes' AND policyname = 'frequencia_pacotes_update_rh') THEN
    CREATE POLICY frequencia_pacotes_update_rh ON public.frequencia_pacotes
    FOR UPDATE USING (
      public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.editar')
      OR public.usuario_eh_admin(auth.uid())
    );
  END IF;
END $$;

-- 2.3 itens_ficha_financeira
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar itens de ficha" ON public.itens_ficha_financeira;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar itens de ficha" ON public.itens_ficha_financeira;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'itens_ficha_financeira' AND policyname = 'itens_ficha_update_folha') THEN
    CREATE POLICY itens_ficha_update_folha ON public.itens_ficha_financeira
    FOR UPDATE USING (
      public.usuario_tem_permissao(auth.uid(), 'folha.editar')
      OR public.usuario_eh_admin(auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'itens_ficha_financeira' AND policyname = 'itens_ficha_delete_folha') THEN
    CREATE POLICY itens_ficha_delete_folha ON public.itens_ficha_financeira
    FOR DELETE USING (
      public.usuario_tem_permissao(auth.uid(), 'folha.editar')
      OR public.usuario_eh_admin(auth.uid())
    );
  END IF;
END $$;

-- 2.4 pre_cadastros
DROP POLICY IF EXISTS "Pre-cadastro pode ser atualizado" ON public.pre_cadastros;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pre_cadastros' AND policyname = 'pre_cadastros_update_rh') THEN
    CREATE POLICY pre_cadastros_update_rh ON public.pre_cadastros
    FOR UPDATE USING (
      public.usuario_tem_permissao(auth.uid(), 'rh.precadastro.editar')
      OR public.usuario_eh_admin(auth.uid())
    );
  END IF;
END $$;

-- 2.5 remessas_bancarias
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar remessas" ON public.remessas_bancarias;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'remessas_bancarias' AND policyname = 'remessas_update_folha') THEN
    CREATE POLICY remessas_update_folha ON public.remessas_bancarias
    FOR UPDATE USING (
      public.usuario_tem_permissao(auth.uid(), 'folha.editar')
      OR public.usuario_eh_admin(auth.uid())
    );
  END IF;
END $$;

-- 2.6 retornos_bancarios
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar retornos" ON public.retornos_bancarios;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'retornos_bancarios' AND policyname = 'retornos_update_folha') THEN
    CREATE POLICY retornos_update_folha ON public.retornos_bancarios
    FOR UPDATE USING (
      public.usuario_tem_permissao(auth.uid(), 'folha.editar')
      OR public.usuario_eh_admin(auth.uid())
    );
  END IF;
END $$;
