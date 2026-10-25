-- ============================================================================
-- Localizador de processos do SEI (E1): uma busca pelo nº SEI ou por palavras em todos os registros que guardam o nº
-- ============================================================================
-- Spec (aprovada pelo dono em 2026-10-25): docs/superpowers/specs/2026-10-25-localizador-processos-sei-design.md
--
-- Só funções: nenhuma tabela, coluna, policy ou permissão nova; nenhuma RLS existente muda. As duas funções de busca
-- são SECURITY INVOKER: cada fonte é lida com a RLS dela, então a pessoa só acha o que já veria no módulo (processo
-- sigiloso do workflow continua escondido por wf_pode_ver_processo; registro de módulo que ela não tem não aparece).
-- Vale nos DOIS estados do banco (do baseline e só pelas migrações). Idempotente: CREATE OR REPLACE.
--
-- Blocos:
--   1. sei_normalizar(text): chave NNNNNN/AA-DV do nº SEI, completo (17302.000885/2026.92) ou abreviado do FIPLAN
--      (000885/26-92); NULL quando o texto não parece um nº SEI
--   2. texto_busca(text): minúsculas e sem acento (translate; o baseline não instala a extensão unaccent)
--   3. localizar_processos_sei(termo, limite): as oito fontes (workflow, contratação, passagem, PCA, empenho,
--      documento, termo de cessão, diária)
--   4. processos_parados(dias): contratação e processo do workflow em andamento sem movimentação há mais de N dias
--   5. privilégios (mesmas linhas no supabase/baseline/overlay/40_privilegios.sql)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Chave do nº SEI
-- ----------------------------------------------------------------------------
-- Completo: órgão (5 dígitos), sequencial (6), ano (4) e dígito verificador (2), com até 3 separadores entre eles.
-- Abreviado: sequencial (6), ano (2) e dígito (2), sozinho no texto. A chave usa o ano com 2 dígitos para os dois
-- formatos se encontrarem.
CREATE OR REPLACE FUNCTION public.sei_normalizar(p_texto text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = pg_catalog, pg_temp
AS $$
  SELECT CASE
           WHEN x.completo IS NOT NULL THEN x.completo[2] || '/' || right(x.completo[3], 2) || '-' || x.completo[4]
           WHEN x.abreviado IS NOT NULL THEN x.abreviado[1] || '/' || x.abreviado[2] || '-' || x.abreviado[3]
         END
    FROM (SELECT regexp_match(coalesce(p_texto, ''), '(\d{5})\D{0,3}(\d{6})\D{0,3}(\d{4})\D{0,3}(\d{2})') AS completo,
                 regexp_match(coalesce(p_texto, ''), '^\D*(\d{6})\D{0,3}(\d{2})\D{0,3}(\d{2})\D*$') AS abreviado) x
$$;
COMMENT ON FUNCTION public.sei_normalizar(text) IS
  'Chave NNNNNN/AA-DV do nº SEI (completo ou abreviado do FIPLAN); NULL se o texto não parece um nº SEI.';

-- ----------------------------------------------------------------------------
-- 2. Texto para busca
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.texto_busca(p_texto text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = pg_catalog, pg_temp
AS $$
  SELECT lower(translate(coalesce(p_texto, ''),
    'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñ',
    'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn'))
$$;
COMMENT ON FUNCTION public.texto_busca(text) IS 'Minúsculas e sem acento, para comparar na busca.';

-- ----------------------------------------------------------------------------
-- 3. Busca
-- ----------------------------------------------------------------------------
-- Termo com nº SEI (sei_normalizar não nulo): compara a chave. Termo só de dígitos e separadores (4+ dígitos): procura
-- os dígitos dentro do número. Outro termo: palavras do título, do interessado, do setor etc., sem acento. Termo com
-- menos de 3 caracteres não devolve nada. ref leva o que a tela precisa para o link além do id (PCA: o exercício).
CREATE OR REPLACE FUNCTION public.localizar_processos_sei(p_termo text, p_limite integer DEFAULT 50)
RETURNS TABLE (
  chave text,
  numero_sei text,
  origem text,
  registro_id uuid,
  ref text,
  titulo text,
  situacao text,
  onde text,
  atualizado_em date,
  valor numeric
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  WITH termo AS (
    SELECT btrim(coalesce(p_termo, '')) AS t
  ), busca AS (
    SELECT t,
           public.sei_normalizar(t) AS chave,
           regexp_replace(t, '\D', '', 'g') AS digitos,
           t ~ '^[0-9\s./-]+$' AS so_numero,
           '%' || replace(replace(replace(public.texto_busca(t), '\', '\\'), '%', '\%'), '_', '\_') || '%' AS padrao
      FROM termo
     WHERE char_length(t) >= 3
  ), fontes AS (
    SELECT p.numero_sei, 'workflow'::text AS origem, p.id, NULL::text AS ref, p.assunto AS titulo, p.status::text AS situacao,
           u.sigla AS onde, coalesce(p.etapa_iniciada_em, p.updated_at)::date AS atualizado_em, NULL::numeric AS valor,
           concat_ws(' ', p.numero_processo, p.assunto, p.interessado_nome, u.sigla, u.nome) AS texto
      FROM public.processos_administrativos p
      LEFT JOIN public.estrutura_organizacional u ON u.id = p.unidade_atual_id
    UNION ALL
    SELECT l.numero_processo, 'contratacao', l.id, NULL, coalesce(l.objeto_resumido, l.objeto), l.etapa, l.setor_atual,
           l.atualizado_em, l.valor_estimado,
           concat_ws(' ', l.objeto, l.objeto_resumido, l.setor_atual, l.situacao_atual)
      FROM public.processos_licitatorios l
    UNION ALL
    SELECT pp.numero_sei, 'passagem', pp.id, NULL, coalesce(pp.evento, pp.finalidade), pp.situacao,
           concat_ws('/', pp.destino_cidade, pp.destino_uf), pp.updated_at::date, NULL,
           concat_ws(' ', pp.finalidade, pp.evento, pp.solicitante_nome, pp.destino_cidade)
      FROM public.passagem_pedidos pp
    UNION ALL
    SELECT i.numero_sei, 'pca', i.id, pl.exercicio::text, i.descricao, i.situacao, 'PCA ' || pl.exercicio,
           i.updated_at::date, i.valor_total, i.descricao
      FROM public.pca_itens i
      JOIN public.pca_planos pl ON pl.id = i.plano_id
     WHERE i.situacao <> 'excluido'
    UNION ALL
    SELECT e.processo_sei, 'empenho', e.id, NULL, concat_ws(' · ', 'Empenho ' || e.numero, e.credor_nome), e.status::text,
           NULL, e.data_empenho, e.valor_empenhado,
           concat_ws(' ', e.numero, e.objeto, e.credor_nome, e.ped_numero)
      FROM public.fin_empenhos e
     WHERE nullif(btrim(e.processo_sei), '') IS NOT NULL
    UNION ALL
    SELECT d.processo_sei, 'documento', d.id, NULL, concat_ws(' · ', d.numero, d.titulo), d.status::text, NULL,
           coalesce(d.data_documento, d.created_at::date), NULL,
           concat_ws(' ', d.numero, d.titulo, d.ementa)
      FROM public.documentos d
     WHERE nullif(btrim(d.processo_sei), '') IS NOT NULL
    UNION ALL
    SELECT c.processo_sei, 'termo_cessao', c.id, NULL, concat_ws(' · ', 'Termo ' || c.numero_termo, c.cessionario_nome),
           c.status::text, NULL, coalesce(c.data_emissao::date, c.created_at::date), NULL,
           concat_ws(' ', c.numero_termo, c.cessionario_nome, c.finalidade)
      FROM public.termos_cessao c
     WHERE nullif(btrim(c.processo_sei), '') IS NOT NULL
    UNION ALL
    SELECT v.numero_sei_diarias, 'diaria', v.id, NULL, concat_ws(' · ', 'Diária', v.destino_cidade, v.finalidade), v.status,
           concat_ws('/', v.destino_cidade, v.destino_uf), v.data_saida, v.valor_total,
           concat_ws(' ', v.destino_cidade, v.finalidade, v.portaria_numero)
      FROM public.viagens_diarias v
     WHERE nullif(btrim(v.numero_sei_diarias), '') IS NOT NULL
  )
  SELECT public.sei_normalizar(f.numero_sei), f.numero_sei, f.origem, f.id, f.ref, f.titulo, f.situacao, f.onde,
         f.atualizado_em, f.valor
    FROM fontes f, busca b
   WHERE (b.chave IS NOT NULL AND public.sei_normalizar(f.numero_sei) = b.chave)
      OR (b.chave IS NULL AND b.so_numero AND char_length(b.digitos) >= 4
          AND regexp_replace(coalesce(f.numero_sei, ''), '\D', '', 'g') LIKE '%' || b.digitos || '%')
      OR (b.chave IS NULL AND NOT b.so_numero
          AND public.texto_busca(concat_ws(' ', f.numero_sei, f.texto)) LIKE b.padrao ESCAPE '\')
   ORDER BY f.atualizado_em DESC NULLS LAST, f.origem, f.id
   LIMIT least(greatest(coalesce(p_limite, 50), 1), 200)
$$;
COMMENT ON FUNCTION public.localizar_processos_sei(text, integer) IS
  'Localizador de processos do SEI: busca pelo nº (qualquer formato) ou por palavras em oito fontes; INVOKER (cada fonte com a RLS dela).';

-- ----------------------------------------------------------------------------
-- 4. Parados
-- ----------------------------------------------------------------------------
-- Dias contados pela data do servidor (current_date): data_local() não é executável por authenticated e esta função
-- é INVOKER.
CREATE OR REPLACE FUNCTION public.processos_parados(p_dias integer DEFAULT 15)
RETURNS TABLE (
  chave text,
  numero_sei text,
  origem text,
  registro_id uuid,
  titulo text,
  situacao text,
  onde text,
  atualizado_em date,
  dias integer
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  WITH parados AS (
    SELECT l.numero_processo AS numero_sei, 'contratacao'::text AS origem, l.id, coalesce(l.objeto_resumido, l.objeto) AS titulo,
           l.etapa AS situacao, l.setor_atual AS onde, l.atualizado_em
      FROM public.processos_licitatorios l
     WHERE l.etapa NOT IN ('encerrado', 'cancelado') AND l.atualizado_em IS NOT NULL
    UNION ALL
    SELECT p.numero_sei, 'workflow', p.id, p.assunto, p.status::text, u.sigla, coalesce(p.etapa_iniciada_em, p.updated_at)::date
      FROM public.processos_administrativos p
      LEFT JOIN public.estrutura_organizacional u ON u.id = p.unidade_atual_id
     WHERE p.status IN ('aberto', 'em_tramitacao')
  )
  SELECT public.sei_normalizar(x.numero_sei), x.numero_sei, x.origem, x.id, x.titulo, x.situacao, x.onde, x.atualizado_em,
         (current_date - x.atualizado_em)::integer
    FROM parados x
   WHERE current_date - x.atualizado_em > greatest(coalesce(p_dias, 15), 1)
   ORDER BY current_date - x.atualizado_em DESC, x.origem, x.id
   LIMIT 200
$$;
COMMENT ON FUNCTION public.processos_parados(integer) IS
  'Contratação e processo do workflow em andamento sem movimentação há mais de N dias; INVOKER (RLS de cada fonte).';

-- ----------------------------------------------------------------------------
-- 5. Privilégios
-- ----------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.sei_normalizar(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sei_normalizar(text) TO authenticated;
REVOKE ALL ON FUNCTION public.texto_busca(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.texto_busca(text) TO authenticated;
REVOKE ALL ON FUNCTION public.localizar_processos_sei(text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.localizar_processos_sei(text, integer) TO authenticated;
REVOKE ALL ON FUNCTION public.processos_parados(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.processos_parados(integer) TO authenticated;
