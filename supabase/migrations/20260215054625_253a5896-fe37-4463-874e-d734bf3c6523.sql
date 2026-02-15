
-- Corrigir view TCE para usar SECURITY INVOKER (padrão seguro)
CREATE OR REPLACE VIEW public.v_relatorio_tce_pessoal
WITH (security_invoker = true)
AS
SELECT
  s.id,
  s.nome_completo,
  s.cpf,
  s.matricula,
  s.tipo_servidor,
  s.situacao,
  s.data_admissao,
  s.data_posse,
  s.regime_juridico,
  s.carga_horaria,
  s.remuneracao_bruta,
  s.gratificacoes,
  s.descontos,
  COALESCE(s.remuneracao_bruta, 0) + COALESCE(s.gratificacoes, 0) - COALESCE(s.descontos, 0) AS remuneracao_liquida,
  eo.nome AS unidade_nome,
  eo.sigla AS unidade_sigla,
  c.nome AS cargo_nome,
  s.escolaridade,
  s.raca_cor,
  s.pcd,
  s.pcd_tipo,
  s.sexo,
  s.data_nascimento,
  EXTRACT(YEAR FROM AGE(CURRENT_DATE, s.data_nascimento))::INTEGER AS idade,
  EXTRACT(YEAR FROM AGE(CURRENT_DATE, s.data_admissao))::INTEGER AS anos_servico
FROM servidores s
LEFT JOIN estrutura_organizacional eo ON eo.id = s.unidade_atual_id
LEFT JOIN cargos c ON c.id = s.cargo_atual_id
WHERE s.ativo = true
ORDER BY s.nome_completo;
