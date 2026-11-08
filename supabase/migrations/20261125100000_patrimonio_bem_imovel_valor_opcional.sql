-- ============================================================================
-- PATRIMÔNIO — bem imóvel e bem antigo sem valor (teste do Inventário de 07/11/2026, I1 e I2)
-- ============================================================================
-- Decisões do dono em 2026-11-08: criar a categoria "Imóvel" no cadastro de bens, com RIP, matrícula e área; e o bem
-- antigo pode ficar sem valor e sem data de aquisição (valor desconhecido), em vez de um valor inventado.
--
--   categoria_bem              ganha 'imovel'.
--   bens_patrimoniais          rip (Registro Imobiliário Patrimonial), matricula_imovel (matrícula no cartório de
--                              imóveis), cartorio_imovel e area_m2. valor_aquisicao e data_aquisicao deixam de ser
--                              obrigatórios: sem valor, o bem fica fora da soma em reais (as somas já ignoram nulo) e
--                              valor_liquido (coluna gerada) fica nulo.
--
-- A trava de fn_bens_proteger_colunas continua: só o admin muda valor e data de um bem já cadastrado pela API.
-- Nenhum dado muda. Nenhuma policy muda. Idempotente.
-- ============================================================================

SET lock_timeout = '10s';

-- ADD VALUE dentro da transação é aceito (PG 12+) desde que o valor novo não seja usado nela; esta migração não o usa.
ALTER TYPE public.categoria_bem ADD VALUE IF NOT EXISTS 'imovel';

ALTER TABLE public.bens_patrimoniais
  ALTER COLUMN valor_aquisicao DROP NOT NULL,
  ALTER COLUMN data_aquisicao DROP NOT NULL;

ALTER TABLE public.bens_patrimoniais
  ADD COLUMN IF NOT EXISTS rip text,
  ADD COLUMN IF NOT EXISTS matricula_imovel text,
  ADD COLUMN IF NOT EXISTS cartorio_imovel text,
  ADD COLUMN IF NOT EXISTS area_m2 numeric(14,2);

ALTER TABLE public.bens_patrimoniais DROP CONSTRAINT IF EXISTS bens_patrimoniais_area_m2_check;
ALTER TABLE public.bens_patrimoniais ADD CONSTRAINT bens_patrimoniais_area_m2_check CHECK (area_m2 IS NULL OR area_m2 > 0);
ALTER TABLE public.bens_patrimoniais DROP CONSTRAINT IF EXISTS bens_patrimoniais_valor_aquisicao_check;
ALTER TABLE public.bens_patrimoniais ADD CONSTRAINT bens_patrimoniais_valor_aquisicao_check
  CHECK (valor_aquisicao IS NULL OR valor_aquisicao >= 0) NOT VALID;

COMMENT ON COLUMN public.bens_patrimoniais.valor_aquisicao IS
  'Valor de aquisição. Nulo = valor desconhecido (bem antigo): fica fora da soma em reais.';
COMMENT ON COLUMN public.bens_patrimoniais.data_aquisicao IS
  'Data de aquisição. Nula = desconhecida (bem antigo).';
COMMENT ON COLUMN public.bens_patrimoniais.rip IS
  'Bem imóvel: RIP (Registro Imobiliário Patrimonial).';
COMMENT ON COLUMN public.bens_patrimoniais.matricula_imovel IS
  'Bem imóvel: número da matrícula no cartório de registro de imóveis.';
COMMENT ON COLUMN public.bens_patrimoniais.cartorio_imovel IS
  'Bem imóvel: cartório de registro de imóveis da matrícula.';
COMMENT ON COLUMN public.bens_patrimoniais.area_m2 IS
  'Bem imóvel: área em metros quadrados.';
