-- ============================================================================
-- Portal da Transparência: RPCs públicas de execução orçamentária, licitações e patrimônio
-- ============================================================================
-- As páginas /transparencia/execucao-orcamentaria, /transparencia/licitacoes e
-- /transparencia/patrimonio liam direto dotacoes_orcamentarias, processos_licitatorios e
-- bens_patrimoniais. Essas tabelas só têm SELECT para `authenticated` com o módulo
-- (fin_module_select, comp_module_select, pat_module_select) e `anon` não tem GRANT nelas:
-- o visitante do portal via tudo vazio.
--
-- Decisão do responsável pelo projeto ("Liberar com funções"): as tabelas continuam FECHADAS
-- (nenhuma policy nem GRANT de tabela muda aqui). Três funções SECURITY DEFINER, executáveis por
-- `anon`, devolvem só os campos que as telas já mostram, com o filtro de LGPD feito no servidor:
--   * execução orçamentária: só totais por exercício (nenhuma linha individual de dotação);
--   * licitações: todo processo aparece; razão social e CNPJ mascarado só de vencedor pessoa
--     jurídica (vencedor pessoa física sai NULL); nada de servidor responsável, pregoeiro nem dado de proposta;
--   * patrimônio: sem responsável, cargo/setor do responsável, termo, fotos, nota fiscal ou
--     CPF/CNPJ de fornecedor.
-- Exceção pública intencional (Lei 12.527/2011, transparência ativa). Mesma cópia em
-- supabase/baseline/overlay/18_funcoes_rpc.sql (definição) e 40_privilegios.sql (GRANT).

-- 1) Execução orçamentária: totais por exercício
CREATE OR REPLACE FUNCTION public.transparencia_execucao_orcamentaria()
RETURNS TABLE (
  exercicio integer,
  valor_inicial numeric,
  valor_atual numeric,
  valor_empenhado numeric,
  valor_liquidado numeric,
  valor_pago numeric,
  quantidade_dotacoes bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT d.exercicio,
         coalesce(sum(d.valor_inicial), 0),
         coalesce(sum(d.valor_atual), 0),
         coalesce(sum(d.valor_empenhado), 0),
         coalesce(sum(d.valor_liquidado), 0),
         coalesce(sum(d.valor_pago), 0),
         count(*)
  FROM public.dotacoes_orcamentarias d
  GROUP BY d.exercicio
  ORDER BY d.exercicio DESC;
$$;

-- 2) Licitações. O vencedor vem das propostas vencedoras (não desclassificadas) e de
--    itens_licitacao.vencedor_id: processos_licitatorios não tem fornecedor próprio nem coluna de
--    data de homologação (data_homologacao sai NULL até a tabela ganhar o campo).
CREATE OR REPLACE FUNCTION public.transparencia_licitacoes(
  p_ano integer DEFAULT NULL,
  p_modalidade text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  numero_processo text,
  ano integer,
  modalidade text,
  objeto text,
  fase_atual text,
  valor_estimado numeric,
  data_abertura date,
  data_homologacao date,
  unidade_requisitante text,
  vencedor_razao_social text,
  vencedor_cnpj_parcial text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH vencedores AS (
    SELECT pr.processo_id, pr.fornecedor_id
    FROM public.propostas_licitacao pr
    WHERE pr.vencedora AND NOT coalesce(pr.desclassificada, false)
    UNION
    SELECT il.processo_id, il.vencedor_id
    FROM public.itens_licitacao il
    WHERE il.vencedor_id IS NOT NULL
  )
  SELECT p.id,
         p.numero_processo::text,
         p.ano,
         p.modalidade::text,
         p.objeto,
         p.fase_atual::text,
         p.valor_estimado,
         p.data_abertura,
         NULL::date,
         eo.nome,
         v.razao_social::text,
         -- CNPJ mascarado como a tela fazia: 8 primeiros dígitos, ****, 2 últimos (nunca CPF)
         CASE WHEN length(v.doc) = 14 THEN left(v.doc, 8) || '****' || substr(v.doc, 13) END
  FROM public.processos_licitatorios p
  LEFT JOIN public.estrutura_organizacional eo ON eo.id = p.unidade_requisitante_id
  -- LGPD: só vencedor pessoa jurídica; se o único vencedor é pessoa física, nome e documento saem NULL
  LEFT JOIN LATERAL (
    SELECT f.razao_social, regexp_replace(f.cpf_cnpj, '\D', '', 'g') AS doc
    FROM vencedores vc
    JOIN public.fornecedores f ON f.id = vc.fornecedor_id
    WHERE vc.processo_id = p.id AND f.tipo_pessoa = 'PJ'
    ORDER BY f.razao_social
    LIMIT 1
  ) v ON true
  WHERE (p_ano IS NULL OR p.ano = p_ano)
    AND (p_modalidade IS NULL OR p.modalidade::text = p_modalidade)
  ORDER BY p.ano DESC, p.numero_processo DESC;
$$;

-- 3) Patrimônio: só dados do bem e da unidade (nunca responsável nem dado pessoal)
CREATE OR REPLACE FUNCTION public.transparencia_patrimonio()
RETURNS TABLE (
  id uuid,
  numero_patrimonio text,
  descricao text,
  marca text,
  modelo text,
  situacao text,
  estado_conservacao text,
  valor_aquisicao numeric,
  data_aquisicao date,
  unidade_local_nome text,
  unidade_local_municipio text,
  unidade_organizacional_nome text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT b.id,
         b.numero_patrimonio::text,
         b.descricao::text,
         b.marca::text,
         b.modelo::text,
         b.situacao::text,
         b.estado_conservacao::text,
         b.valor_aquisicao,
         b.data_aquisicao,
         ul.nome_unidade,
         ul.municipio,
         eo.nome
  FROM public.bens_patrimoniais b
  LEFT JOIN public.unidades_locais ul ON ul.id = b.unidade_local_id
  LEFT JOIN public.estrutura_organizacional eo ON eo.id = b.unidade_id
  ORDER BY b.numero_patrimonio;
$$;

REVOKE ALL ON FUNCTION public.transparencia_execucao_orcamentaria() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.transparencia_licitacoes(integer, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.transparencia_patrimonio() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transparencia_execucao_orcamentaria() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.transparencia_licitacoes(integer, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.transparencia_patrimonio() TO anon, authenticated;

COMMENT ON FUNCTION public.transparencia_execucao_orcamentaria() IS
  'Exceção pública intencional (LAI, transparência ativa): executável por anon. Expõe só totais de dotacoes_orcamentarias por exercício (valor_inicial, valor_atual, valor_empenhado, valor_liquidado, valor_pago, quantidade de dotações).';
COMMENT ON FUNCTION public.transparencia_licitacoes(integer, text) IS
  'Exceção pública intencional (LAI, transparência ativa): executável por anon. Expõe de processos_licitatorios id, numero_processo, ano, modalidade, objeto, fase_atual, valor_estimado, data_abertura, data_homologacao (NULL: a tabela não tem a coluna), nome da unidade requisitante e, do vencedor pessoa jurídica, razão social e CNPJ mascarado (8 dígitos + **** + 2). O processo sempre aparece (LAI); vencedor pessoa física nunca é exposto: sem vencedor PJ, razão social e CNPJ saem NULL.';
COMMENT ON FUNCTION public.transparencia_patrimonio() IS
  'Exceção pública intencional (LAI, transparência ativa): executável por anon. Expõe de bens_patrimoniais id, numero_patrimonio, descricao, marca, modelo, situacao, estado_conservacao, valor_aquisicao, data_aquisicao, nome e município da unidade local e nome da unidade organizacional. Nunca responsável nem dado pessoal.';
