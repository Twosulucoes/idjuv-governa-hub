-- =============================================
-- ADICIONAR MÓDULO ORGANIZAÇÕES
-- =============================================

-- Adicionar 'organizacoes' ao enum app_module
ALTER TYPE public.app_module ADD VALUE IF NOT EXISTS 'organizacoes';

-- Comentário documentando o módulo
COMMENT ON TYPE public.app_module IS 'Módulos funcionais do sistema: admin, rh, workflow, compras, contratos, financeiro, patrimonio, governanca, integridade, transparencia, comunicacao, programas, gestores_escolares, organizacoes';