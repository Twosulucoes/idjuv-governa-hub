-- ============================================
-- IDJuv - Schema de Migração
-- Arquivo 06: Dados Iniciais
-- ============================================
-- Execute APÓS 05_rls_policies.sql
-- ============================================

-- ============================================
-- PERFIS DE ACESSO DO SISTEMA
-- ============================================

INSERT INTO public.perfis (codigo, nome, descricao, nivel_hierarquia, sistema, cor, icone) VALUES
('super_admin', 'Super Administrador', 'Acesso total ao sistema', 100, true, '#dc2626', 'Shield'),
('admin', 'Administrador', 'Administração geral do sistema', 90, true, '#ea580c', 'Settings'),
('gestor_rh', 'Gestor de RH', 'Gestão de recursos humanos', 70, true, '#0284c7', 'Users'),
('gestor_financeiro', 'Gestor Financeiro', 'Gestão financeira e folha de pagamento', 70, true, '#16a34a', 'DollarSign'),
('gestor_patrimonio', 'Gestor de Patrimônio', 'Gestão patrimonial e bens', 70, true, '#7c3aed', 'Package'),
('gestor_unidades', 'Gestor de Unidades Locais', 'Gestão de ginásios, estádios e espaços', 70, true, '#0891b2', 'Building'),
('servidor', 'Servidor', 'Acesso básico de servidor', 30, true, '#6b7280', 'User'),
('visualizador', 'Visualizador', 'Acesso apenas leitura', 10, true, '#9ca3af', 'Eye')
ON CONFLICT (codigo) DO NOTHING;

-- ============================================
-- FUNÇÕES DO SISTEMA (PERMISSÕES)
-- ============================================

-- Módulo RH
INSERT INTO public.funcoes_sistema (codigo, nome, modulo, submodulo, tipo_acao, ordem) VALUES
('rh.servidores.visualizar', 'Visualizar Servidores', 'rh', 'servidores', 'visualizar', 1),
('rh.servidores.criar', 'Criar Servidores', 'rh', 'servidores', 'criar', 2),
('rh.servidores.editar', 'Editar Servidores', 'rh', 'servidores', 'editar', 3),
('rh.servidores.excluir', 'Excluir Servidores', 'rh', 'servidores', 'excluir', 4),
('rh.lotacoes.visualizar', 'Visualizar Lotações', 'rh', 'lotacoes', 'visualizar', 5),
('rh.lotacoes.gerenciar', 'Gerenciar Lotações', 'rh', 'lotacoes', 'gerenciar', 6),
('rh.provimentos.visualizar', 'Visualizar Provimentos', 'rh', 'provimentos', 'visualizar', 7),
('rh.provimentos.gerenciar', 'Gerenciar Provimentos', 'rh', 'provimentos', 'gerenciar', 8),
('rh.ferias.visualizar', 'Visualizar Férias', 'rh', 'ferias', 'visualizar', 9),
('rh.ferias.gerenciar', 'Gerenciar Férias', 'rh', 'ferias', 'gerenciar', 10)
ON CONFLICT (codigo) DO NOTHING;

-- Módulo Financeiro
INSERT INTO public.funcoes_sistema (codigo, nome, modulo, submodulo, tipo_acao, ordem) VALUES
('financeiro.folha.visualizar', 'Visualizar Folha', 'financeiro', 'folha', 'visualizar', 1),
('financeiro.folha.processar', 'Processar Folha', 'financeiro', 'folha', 'processar', 2),
('financeiro.folha.fechar', 'Fechar Folha', 'financeiro', 'folha', 'fechar', 3),
('financeiro.fichas.visualizar', 'Visualizar Fichas', 'financeiro', 'fichas', 'visualizar', 4),
('financeiro.fichas.editar', 'Editar Fichas', 'financeiro', 'fichas', 'editar', 5),
('financeiro.rubricas.visualizar', 'Visualizar Rubricas', 'financeiro', 'rubricas', 'visualizar', 6),
('financeiro.rubricas.gerenciar', 'Gerenciar Rubricas', 'financeiro', 'rubricas', 'gerenciar', 7),
('financeiro.relatorios.gerar', 'Gerar Relatórios Financeiros', 'financeiro', 'relatorios', 'gerar', 8)
ON CONFLICT (codigo) DO NOTHING;

-- Módulo Admin
INSERT INTO public.funcoes_sistema (codigo, nome, modulo, submodulo, tipo_acao, ordem) VALUES
('admin.usuarios.visualizar', 'Visualizar Usuários', 'admin', 'usuarios', 'visualizar', 1),
('admin.usuarios.criar', 'Criar Usuários', 'admin', 'usuarios', 'criar', 2),
('admin.usuarios.editar', 'Editar Usuários', 'admin', 'usuarios', 'editar', 3),
('admin.usuarios.excluir', 'Excluir Usuários', 'admin', 'usuarios', 'excluir', 4),
('admin.perfis.visualizar', 'Visualizar Perfis', 'admin', 'perfis', 'visualizar', 5),
('admin.perfis.gerenciar', 'Gerenciar Perfis', 'admin', 'perfis', 'gerenciar', 6),
('admin.permissoes.visualizar', 'Visualizar Permissões', 'admin', 'permissoes', 'visualizar', 7),
('admin.permissoes.gerenciar', 'Gerenciar Permissões', 'admin', 'permissoes', 'gerenciar', 8),
('admin.auditoria.visualizar', 'Visualizar Auditoria', 'admin', 'auditoria', 'visualizar', 9),
('admin.backup.gerenciar', 'Gerenciar Backups', 'admin', 'backup', 'gerenciar', 10)
ON CONFLICT (codigo) DO NOTHING;

-- Módulo Patrimônio
INSERT INTO public.funcoes_sistema (codigo, nome, modulo, submodulo, tipo_acao, ordem) VALUES
('patrimonio.bens.visualizar', 'Visualizar Bens', 'patrimonio', 'bens', 'visualizar', 1),
('patrimonio.bens.criar', 'Criar Bens', 'patrimonio', 'bens', 'criar', 2),
('patrimonio.bens.editar', 'Editar Bens', 'patrimonio', 'bens', 'editar', 3),
('patrimonio.bens.baixar', 'Baixar Bens', 'patrimonio', 'bens', 'baixar', 4),
('patrimonio.inventario.gerenciar', 'Gerenciar Inventário', 'patrimonio', 'inventario', 'gerenciar', 5)
ON CONFLICT (codigo) DO NOTHING;

-- Módulo Unidades Locais
INSERT INTO public.funcoes_sistema (codigo, nome, modulo, submodulo, tipo_acao, ordem) VALUES
('unidades.locais.visualizar', 'Visualizar Unidades', 'unidades_locais', 'unidades', 'visualizar', 1),
('unidades.locais.gerenciar', 'Gerenciar Unidades', 'unidades_locais', 'unidades', 'gerenciar', 2),
('unidades.agenda.visualizar', 'Visualizar Agenda', 'unidades_locais', 'agenda', 'visualizar', 3),
('unidades.agenda.gerenciar', 'Gerenciar Agenda', 'unidades_locais', 'agenda', 'gerenciar', 4)
ON CONFLICT (codigo) DO NOTHING;

-- ============================================
-- ASSOCIAR PERMISSÕES AOS PERFIS
-- ============================================

-- Super Admin recebe TODAS as funções
INSERT INTO public.perfil_funcoes (perfil_id, funcao_id, concedido)
SELECT 
  p.id,
  f.id,
  true
FROM public.perfis p
CROSS JOIN public.funcoes_sistema f
WHERE p.codigo = 'super_admin'
ON CONFLICT (perfil_id, funcao_id) DO NOTHING;

-- Admin recebe TODAS as funções (exceto backup)
INSERT INTO public.perfil_funcoes (perfil_id, funcao_id, concedido)
SELECT 
  p.id,
  f.id,
  true
FROM public.perfis p
CROSS JOIN public.funcoes_sistema f
WHERE p.codigo = 'admin'
  AND f.codigo != 'admin.backup.gerenciar'
ON CONFLICT (perfil_id, funcao_id) DO NOTHING;

-- Gestor RH recebe funções de RH
INSERT INTO public.perfil_funcoes (perfil_id, funcao_id, concedido)
SELECT 
  p.id,
  f.id,
  true
FROM public.perfis p
CROSS JOIN public.funcoes_sistema f
WHERE p.codigo = 'gestor_rh'
  AND f.modulo = 'rh'
ON CONFLICT (perfil_id, funcao_id) DO NOTHING;

-- Gestor Financeiro recebe funções financeiras
INSERT INTO public.perfil_funcoes (perfil_id, funcao_id, concedido)
SELECT 
  p.id,
  f.id,
  true
FROM public.perfis p
CROSS JOIN public.funcoes_sistema f
WHERE p.codigo = 'gestor_financeiro'
  AND f.modulo = 'financeiro'
ON CONFLICT (perfil_id, funcao_id) DO NOTHING;

-- Gestor Patrimônio recebe funções de patrimônio
INSERT INTO public.perfil_funcoes (perfil_id, funcao_id, concedido)
SELECT 
  p.id,
  f.id,
  true
FROM public.perfis p
CROSS JOIN public.funcoes_sistema f
WHERE p.codigo = 'gestor_patrimonio'
  AND f.modulo = 'patrimonio'
ON CONFLICT (perfil_id, funcao_id) DO NOTHING;

-- Gestor Unidades recebe funções de unidades
INSERT INTO public.perfil_funcoes (perfil_id, funcao_id, concedido)
SELECT 
  p.id,
  f.id,
  true
FROM public.perfis p
CROSS JOIN public.funcoes_sistema f
WHERE p.codigo = 'gestor_unidades'
  AND f.modulo = 'unidades_locais'
ON CONFLICT (perfil_id, funcao_id) DO NOTHING;

-- Servidor recebe apenas visualização
INSERT INTO public.perfil_funcoes (perfil_id, funcao_id, concedido)
SELECT 
  p.id,
  f.id,
  true
FROM public.perfis p
CROSS JOIN public.funcoes_sistema f
WHERE p.codigo = 'servidor'
  AND f.tipo_acao = 'visualizar'
ON CONFLICT (perfil_id, funcao_id) DO NOTHING;

-- Visualizador recebe apenas visualização básica
INSERT INTO public.perfil_funcoes (perfil_id, funcao_id, concedido)
SELECT 
  p.id,
  f.id,
  true
FROM public.perfis p
CROSS JOIN public.funcoes_sistema f
WHERE p.codigo = 'visualizador'
  AND f.tipo_acao = 'visualizar'
  AND f.modulo NOT IN ('admin', 'financeiro')
ON CONFLICT (perfil_id, funcao_id) DO NOTHING;

-- ============================================
-- BANCOS CNAB (PRINCIPAIS)
-- ============================================

INSERT INTO public.bancos_cnab (codigo_banco, nome, nome_reduzido, layout_cnab240, layout_cnab400) VALUES
('001', 'Banco do Brasil S.A.', 'BB', true, true),
('033', 'Banco Santander Brasil S.A.', 'SANTANDER', true, true),
('104', 'Caixa Econômica Federal', 'CEF', true, true),
('237', 'Banco Bradesco S.A.', 'BRADESCO', true, true),
('341', 'Itaú Unibanco S.A.', 'ITAU', true, true),
('422', 'Banco Safra S.A.', 'SAFRA', true, true),
('748', 'Banco Cooperativo Sicredi S.A.', 'SICREDI', true, false),
('756', 'Banco Cooperativo do Brasil S.A.', 'SICOOB', true, true),
('077', 'Banco Inter S.A.', 'INTER', true, false),
('260', 'Nu Pagamentos S.A.', 'NUBANK', true, false)
ON CONFLICT (codigo_banco) DO NOTHING;

-- ============================================
-- ESTRUTURA ORGANIZACIONAL BÁSICA
-- ============================================

INSERT INTO public.estrutura_organizacional (id, nome, sigla, tipo, nivel, ativo, ordem) VALUES
('00000000-0000-0000-0000-000000000001', 'Instituto de Desportos e Juventude', 'IDJUV', 'presidencia', 0, true, 0)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- FIM DO ARQUIVO 06_dados_iniciais.sql
-- Migração base concluída!
-- ============================================
