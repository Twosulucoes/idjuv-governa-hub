-- ============================================================
-- IDJUV - BACKUP COMPLETO - DADOS INICIAIS
-- Gerado em: 2026-02-08
-- ============================================================

-- ============================================
-- PERFIS DE ACESSO
-- ============================================

INSERT INTO public.perfis (codigo, nome, descricao, nivel_hierarquia, sistema, ativo)
VALUES 
  ('ADMIN', 'Administrador', 'Acesso total ao sistema', 1, true, true),
  ('GESTOR', 'Gestor', 'Acesso gerencial', 2, true, true),
  ('OPERADOR', 'Operador', 'Acesso operacional', 3, true, true),
  ('CONSULTA', 'Consulta', 'Apenas visualização', 4, true, true)
ON CONFLICT (codigo) DO NOTHING;

-- ============================================
-- FUNÇÕES DO SISTEMA (módulos)
-- ============================================

INSERT INTO public.funcoes_sistema (codigo, nome, modulo, tipo_acao, ordem, ativo)
VALUES 
  -- RH
  ('RH_VIEW', 'Visualizar RH', 'rh', 'view', 1, true),
  ('RH_CREATE', 'Criar em RH', 'rh', 'create', 2, true),
  ('RH_EDIT', 'Editar RH', 'rh', 'edit', 3, true),
  ('RH_DELETE', 'Excluir em RH', 'rh', 'delete', 4, true),
  
  -- Financeiro
  ('FIN_VIEW', 'Visualizar Financeiro', 'financeiro', 'view', 1, true),
  ('FIN_CREATE', 'Criar em Financeiro', 'financeiro', 'create', 2, true),
  ('FIN_EDIT', 'Editar Financeiro', 'financeiro', 'edit', 3, true),
  ('FIN_DELETE', 'Excluir em Financeiro', 'financeiro', 'delete', 4, true),
  
  -- Patrimônio
  ('PAT_VIEW', 'Visualizar Patrimônio', 'patrimonio', 'view', 1, true),
  ('PAT_CREATE', 'Criar em Patrimônio', 'patrimonio', 'create', 2, true),
  ('PAT_EDIT', 'Editar Patrimônio', 'patrimonio', 'edit', 3, true),
  ('PAT_DELETE', 'Excluir em Patrimônio', 'patrimonio', 'delete', 4, true),
  
  -- Contratos
  ('CONTR_VIEW', 'Visualizar Contratos', 'contratos', 'view', 1, true),
  ('CONTR_CREATE', 'Criar Contratos', 'contratos', 'create', 2, true),
  ('CONTR_EDIT', 'Editar Contratos', 'contratos', 'edit', 3, true),
  
  -- Admin
  ('ADMIN_VIEW', 'Visualizar Admin', 'admin', 'view', 1, true),
  ('ADMIN_MANAGE', 'Gerenciar Sistema', 'admin', 'manage', 2, true)
ON CONFLICT (codigo) DO NOTHING;

-- ============================================
-- BANCOS CNAB
-- ============================================

INSERT INTO public.bancos_cnab (codigo_banco, nome, nome_reduzido, layout_cnab240, layout_cnab400, ativo)
VALUES 
  ('001', 'Banco do Brasil S.A.', 'BB', true, true, true),
  ('033', 'Banco Santander (Brasil) S.A.', 'SANTANDER', true, true, true),
  ('104', 'Caixa Econômica Federal', 'CEF', true, true, true),
  ('237', 'Banco Bradesco S.A.', 'BRADESCO', true, true, true),
  ('341', 'Itaú Unibanco S.A.', 'ITAU', true, true, true),
  ('422', 'Banco Safra S.A.', 'SAFRA', true, false, true),
  ('756', 'Banco Cooperativo do Brasil S.A. - Sicoob', 'SICOOB', true, false, true)
ON CONFLICT (codigo_banco) DO NOTHING;

-- ============================================
-- FERIADOS NACIONAIS (recorrentes)
-- ============================================

INSERT INTO public.feriados (nome, data, tipo, recorrente, ativo)
VALUES 
  ('Confraternização Universal', '2026-01-01', 'nacional', true, true),
  ('Tiradentes', '2026-04-21', 'nacional', true, true),
  ('Dia do Trabalho', '2026-05-01', 'nacional', true, true),
  ('Independência do Brasil', '2026-09-07', 'nacional', true, true),
  ('Nossa Senhora Aparecida', '2026-10-12', 'nacional', true, true),
  ('Finados', '2026-11-02', 'nacional', true, true),
  ('Proclamação da República', '2026-11-15', 'nacional', true, true),
  ('Natal', '2026-12-25', 'nacional', true, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- CONFIGURAÇÃO DE BACKUP
-- ============================================

INSERT INTO public.backup_config (
  enabled, 
  schedule_cron, 
  weekly_day, 
  retention_daily, 
  retention_weekly, 
  retention_monthly, 
  encryption_enabled
)
VALUES (true, '0 3 * * *', 0, 7, 4, 12, true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- FIM: 09_dados_iniciais.sql
-- Próximo: 10_script_exportar_dados.sql
-- ============================================================
