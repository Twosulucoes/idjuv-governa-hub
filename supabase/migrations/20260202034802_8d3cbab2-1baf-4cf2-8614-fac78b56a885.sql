
-- Corrigir view v_servidores_situacao para incluir todas colunas esperadas
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
  s.foto_url,
  s.cargo_atual_id AS cargo_id,
  s.unidade_atual_id AS unidade_id,
  c.nome AS cargo_nome,
  c.sigla AS cargo_sigla,
  eo.nome AS unidade_nome,
  eo.sigla AS unidade_sigla,
  p.id AS provimento_id,
  p.data_nomeacao,
  p.data_posse,
  p.data_exercicio
FROM servidores s
LEFT JOIN cargos c ON c.id = s.cargo_atual_id
LEFT JOIN estrutura_organizacional eo ON eo.id = s.unidade_atual_id
LEFT JOIN LATERAL (
  SELECT id, data_nomeacao, data_posse, data_exercicio
  FROM provimentos
  WHERE servidor_id = s.id AND status = 'ativo'
  ORDER BY data_nomeacao DESC LIMIT 1
) p ON true;
