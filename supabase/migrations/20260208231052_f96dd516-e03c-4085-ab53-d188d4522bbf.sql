-- =============================================
-- ADICIONAR MÓDULO FEDERAÇÕES
-- =============================================

-- 1. Adicionar 'federacoes' ao enum app_module
ALTER TYPE public.app_module ADD VALUE IF NOT EXISTS 'federacoes';

-- 2. Comentário documentando o módulo
COMMENT ON TYPE public.app_module IS 'Módulos funcionais do sistema: admin, rh, workflow, compras, contratos, financeiro, patrimonio, governanca, integridade, transparencia, comunicacao, programas, gestores_escolares, federacoes';