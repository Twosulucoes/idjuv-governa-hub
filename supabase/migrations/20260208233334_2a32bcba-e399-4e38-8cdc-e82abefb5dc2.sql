-- Adicionar módulo 'gabinete' ao enum app_module
ALTER TYPE public.app_module ADD VALUE IF NOT EXISTS 'gabinete';

-- Atualizar comentário do enum
COMMENT ON TYPE public.app_module IS 'Lista de módulos funcionais do sistema: rh, financeiro, compras, patrimonio, contratos, workflow, governanca, transparencia, comunicacao, programas, gestores_escolares, integridade, admin, organizacoes, gabinete';