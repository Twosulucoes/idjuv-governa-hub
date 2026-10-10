-- ============================================================================
-- Portal da Transparência: RPC pública do quadro de cargos comissionados
-- ============================================================================
-- A página /transparencia/cargos lia public/data/cargos.json (e oferecia public/data/cargos.csv),
-- arquivos estáticos servidos sem autenticação que publicavam, além do quadro, o campo `indicacao`
-- (quem indicou o ocupante; em servidores.indicacao é de acesso restrito a administradores). Os
-- arquivos saem do repositório nesta mesma PR e a página passa a ler esta função.
--
-- Mesmo desenho das RPCs da migração 20261010200100: as tabelas continuam FECHADAS (nenhuma policy
-- nem GRANT de tabela muda aqui); a função é SECURITY DEFINER, executável por `anon`, e devolve só o
-- que a LAI torna público: cargo, símbolo, categoria/natureza, nível, vencimento do cargo, lei de
-- criação, unidade, vagas previstas/ocupadas e o NOME do ocupante (nome e cargo de agente público são
-- públicos). Nunca CPF, matrícula, indicação, contato, endereço, dado bancário nem remuneração individual.
--
-- Uma linha por VAGA (como o arquivo antigo): para cada cargo em comissão / função gratificada ativo,
--   * as vagas por unidade vêm de composicao_cargos (unidade ativa);
--   * cargo sem composição: as vagas de cargos.quantidade_vagas ficam sem unidade;
--   * ocupante = vínculo ativo em vinculos_servidor com aquele cargo (a fonte única de ocupação do RH,
--     ver VinculosServidorPanel/useRelatorios); ocupante numa unidade sem vaga prevista ganha a própria linha;
--   * nome exibido = nome social quando houver (Decreto 8.727/2016), senão o nome completo.
-- Diretoria = a unidade de tipo 'diretoria' mais próxima subindo por superior_id (ou a raiz, ex.: presidência).
-- Exceção pública intencional (Lei 12.527/2011, transparência ativa). Mesma cópia em
-- supabase/baseline/overlay/18_funcoes_rpc.sql (definição) e 40_privilegios.sql (GRANT).

CREATE OR REPLACE FUNCTION public.transparencia_cargos_publicos()
RETURNS TABLE (
  cargo_id uuid,
  cargo text,
  simbolo text,
  categoria text,
  natureza text,
  nivel_hierarquico integer,
  vencimento numeric,
  lei_criacao_numero text,
  lei_criacao_data date,
  unidade_id uuid,
  unidade text,
  unidade_sigla text,
  unidade_superior text,
  diretoria text,
  diretoria_tipo text,
  vaga integer,
  vagas_previstas integer,
  vagas_ocupadas integer,
  ocupante text,
  atualizado_em timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH RECURSIVE
  cargos_pub AS (
    SELECT c.*
    FROM public.cargos c
    WHERE coalesce(c.ativo, true)
      AND (c.categoria IN ('comissionado', 'funcao_gratificada') OR c.natureza = 'comissionado')
  ),
  -- só o nome do ocupante sai daqui (nunca CPF, matrícula, indicação ou contato)
  ocupantes AS (
    SELECT vs.cargo_id, vs.unidade_id,
           coalesce(nullif(btrim(s.nome_social), ''), s.nome_completo) AS nome
    FROM public.vinculos_servidor vs
    JOIN cargos_pub c ON c.id = vs.cargo_id
    JOIN public.servidores s ON s.id = vs.servidor_id
    WHERE vs.ativo
  ),
  composicao AS (
    SELECT cc.cargo_id, cc.unidade_id, coalesce(cc.quantidade_vagas, 0) AS vagas
    FROM public.composicao_cargos cc
    JOIN cargos_pub c ON c.id = cc.cargo_id
    JOIN public.estrutura_organizacional eo ON eo.id = cc.unidade_id
    WHERE coalesce(eo.ativo, true)
  ),
  grupos AS (
    SELECT g.cargo_id, g.unidade_id, sum(g.vagas)::integer AS vagas
    FROM (
      -- vagas previstas por unidade
      SELECT cp.cargo_id, cp.unidade_id, cp.vagas FROM composicao cp
      UNION ALL
      -- cargo sem composição: vagas do cargo sem unidade (descontados os ocupantes já lotados numa unidade)
      SELECT c.id, NULL::uuid,
             greatest(coalesce(c.quantidade_vagas, 0)
                      - (SELECT count(*) FROM ocupantes o WHERE o.cargo_id = c.id AND o.unidade_id IS NOT NULL), 0)::integer
      FROM cargos_pub c
      WHERE NOT EXISTS (SELECT 1 FROM composicao cp WHERE cp.cargo_id = c.id)
      UNION ALL
      -- ocupante numa unidade sem vaga prevista: ganha a própria linha
      SELECT DISTINCT o.cargo_id, o.unidade_id, 0
      FROM ocupantes o
      WHERE NOT EXISTS (SELECT 1 FROM composicao cp
                        WHERE cp.cargo_id = o.cargo_id AND cp.unidade_id IS NOT DISTINCT FROM o.unidade_id)
    ) g
    GROUP BY g.cargo_id, g.unidade_id
  ),
  ocupantes_num AS (
    SELECT o.cargo_id, o.unidade_id, o.nome,
           row_number() OVER (PARTITION BY o.cargo_id, o.unidade_id ORDER BY o.nome)::integer AS posicao,
           count(*) OVER (PARTITION BY o.cargo_id, o.unidade_id)::integer AS quantidade
    FROM ocupantes o
  ),
  -- sobe a hierarquia até a primeira diretoria (ou até a raiz); profundidade limita ciclo acidental
  subida AS (
    SELECT eo.id AS unidade_id, eo.id AS atual_id, eo.superior_id, eo.tipo, 0 AS profundidade
    FROM public.estrutura_organizacional eo
    WHERE eo.id IN (SELECT g.unidade_id FROM grupos g WHERE g.unidade_id IS NOT NULL)
    UNION ALL
    SELECT s.unidade_id, p.id, p.superior_id, p.tipo, s.profundidade + 1
    FROM subida s
    JOIN public.estrutura_organizacional p ON p.id = s.superior_id
    WHERE s.tipo <> 'diretoria' AND s.profundidade < 20
  ),
  diretorias AS (
    SELECT DISTINCT ON (s.unidade_id) s.unidade_id, s.atual_id AS diretoria_id
    FROM subida s
    ORDER BY s.unidade_id, s.profundidade DESC
  )
  SELECT c.id,
         c.nome,
         c.sigla,
         c.categoria::text,
         c.natureza::text,
         c.nivel_hierarquico,
         c.vencimento_base,
         c.lei_criacao_numero,
         c.lei_criacao_data,
         u.id,
         u.nome,
         u.sigla,
         coalesce(nullif(sup.sigla, ''), sup.nome),
         coalesce(nullif(d.sigla, ''), d.nome),
         d.tipo::text,
         v.n,
         g.vagas,
         coalesce(oq.quantidade, 0),
         o.nome,
         c.updated_at
  FROM grupos g
  JOIN cargos_pub c ON c.id = g.cargo_id
  LEFT JOIN public.estrutura_organizacional u ON u.id = g.unidade_id
  LEFT JOIN public.estrutura_organizacional sup ON sup.id = u.superior_id
  LEFT JOIN diretorias dr ON dr.unidade_id = g.unidade_id
  LEFT JOIN public.estrutura_organizacional d ON d.id = dr.diretoria_id
  LEFT JOIN LATERAL (
    SELECT max(onum.quantidade) AS quantidade FROM ocupantes_num onum
    WHERE onum.cargo_id = g.cargo_id AND onum.unidade_id IS NOT DISTINCT FROM g.unidade_id
  ) oq ON true
  CROSS JOIN LATERAL generate_series(1, greatest(g.vagas, coalesce(oq.quantidade, 0))) AS v(n)
  LEFT JOIN ocupantes_num o
         ON o.cargo_id = g.cargo_id AND o.unidade_id IS NOT DISTINCT FROM g.unidade_id AND o.posicao = v.n
  ORDER BY c.vencimento_base DESC NULLS LAST, c.nome, u.nome NULLS LAST, v.n;
$$;

REVOKE ALL ON FUNCTION public.transparencia_cargos_publicos() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transparencia_cargos_publicos() TO anon, authenticated;

COMMENT ON FUNCTION public.transparencia_cargos_publicos() IS
  'Exceção pública intencional (LAI, transparência ativa): executável por anon. Quadro de cargos em comissão e funções gratificadas ativos, uma linha por vaga: de cargos id, nome, sigla (símbolo), categoria, natureza, nível hierárquico, vencimento_base, número e data da lei de criação e updated_at; nome, sigla, unidade superior e diretoria da unidade (composicao_cargos/estrutura_organizacional); vagas previstas e ocupadas; e o nome do ocupante (vínculo ativo em vinculos_servidor; nome social quando houver). Nunca CPF, matrícula, indicação, contato, endereço, dado bancário nem remuneração individual.';
