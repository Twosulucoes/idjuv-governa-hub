-- ============================================================================
-- COMPRAS — pesquisa de preços, entrega 2: item ligado ao PCA e preço da ata ou do contrato para comparar
-- ============================================================================
-- Spec: docs/superpowers/specs/2026-10-30-compras-pesquisa-precos-entrega2-design.md
--
--   pesquisas_precos_itens.pca_item_id      item do PCA de onde o item da pesquisa veio (a estimativa preliminar do
--                                           DFD); a tela mostra os dois valores e pode levar o estimado ao PCA, com a
--                                           RLS do próprio PCA (compras.pca.editar).
--   pesquisas_precos_itens.preco_comparado  preço registrado na ata (adesão, Lei 14.133, art. 86, § 2º, II) ou do
--                                           contrato vigente (prorrogação, art. 107), comparado na tela com o valor
--                                           estimado; a diferença não é gravada.
--
-- Mesma RLS da entrega 1 (classe permissao do rls/mapa.csv) e o mesmo gatilho pesquisa_precos_conferir, que trava os
-- itens de pesquisa concluída. A coluna pesquisas_precos.pca_item_id da entrega 1 continua sem uso. Idempotente.
-- ============================================================================

SET lock_timeout = '10s';

ALTER TABLE public.pesquisas_precos_itens
  ADD COLUMN IF NOT EXISTS pca_item_id uuid REFERENCES public.pca_itens(id),
  ADD COLUMN IF NOT EXISTS preco_comparado numeric(15,4) CHECK (preco_comparado > 0);

CREATE INDEX IF NOT EXISTS idx_pesquisas_precos_itens_pca
  ON public.pesquisas_precos_itens (pca_item_id) WHERE pca_item_id IS NOT NULL;

COMMENT ON COLUMN public.pesquisas_precos_itens.pca_item_id IS
  'Item do PCA (estimativa preliminar do DFD) de onde o item da pesquisa veio.';
COMMENT ON COLUMN public.pesquisas_precos_itens.preco_comparado IS
  'Preço registrado na ata (adesão, Lei 14.133, art. 86, § 2º, II) ou do contrato vigente (prorrogação, art. 107), comparado com o valor estimado.';
