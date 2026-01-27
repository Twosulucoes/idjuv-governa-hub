-- ============================================================
-- PERMISSÕES COMPLETAS PARA GESTÃO DE FEDERAÇÕES
-- ============================================================

-- Criar funções de sistema para todas as operações de federações
INSERT INTO funcoes_sistema (codigo, nome, descricao, modulo, submodulo, tipo_acao, ordem, ativo)
VALUES 
  ('programas.federacoes.criar', 'Criar Federações', 'Permite cadastrar novas federações esportivas', 'programas', 'federacoes', 'criar', 111, true),
  ('programas.federacoes.editar', 'Editar Federações', 'Permite editar dados das federações esportivas', 'programas', 'federacoes', 'editar', 112, true),
  ('programas.federacoes.excluir', 'Excluir Federações', 'Permite excluir federações esportivas', 'programas', 'federacoes', 'excluir', 113, true),
  ('programas.federacoes.calendario', 'Gerenciar Calendário', 'Permite gerenciar eventos e competições das federações', 'programas', 'federacoes', 'editar', 114, true),
  ('programas.federacoes.relatorios', 'Relatórios de Federações', 'Permite gerar e exportar relatórios de federações', 'programas', 'federacoes', 'exportar', 115, true)
ON CONFLICT (codigo) DO NOTHING;

-- Associar TODAS as permissões de federações ao perfil "Gestor de Federações"
INSERT INTO perfil_funcoes (perfil_id, funcao_id, concedido, created_by)
SELECT 
  p.id as perfil_id,
  fs.id as funcao_id,
  true as concedido,
  NULL as created_by
FROM perfis p
CROSS JOIN funcoes_sistema fs
WHERE p.codigo = 'gestor_federacoes'
  AND fs.codigo LIKE 'programas.federacoes.%'
ON CONFLICT (perfil_id, funcao_id) DO UPDATE SET concedido = true;

-- Também garantir que o Super Administrador tenha todas as novas permissões
INSERT INTO perfil_funcoes (perfil_id, funcao_id, concedido, created_by)
SELECT 
  p.id as perfil_id,
  fs.id as funcao_id,
  true as concedido,
  NULL as created_by
FROM perfis p
CROSS JOIN funcoes_sistema fs
WHERE p.codigo = 'super_admin'
  AND fs.codigo LIKE 'programas.federacoes.%'
ON CONFLICT (perfil_id, funcao_id) DO UPDATE SET concedido = true;

-- Garantir acesso ao dashboard para gestores de federações
UPDATE perfil_funcoes 
SET concedido = true 
WHERE perfil_id = (SELECT id FROM perfis WHERE codigo = 'gestor_federacoes')
  AND funcao_id = (SELECT id FROM funcoes_sistema WHERE codigo = 'admin.dashboard.visualizar');

SELECT 'Permissões de federações configuradas com sucesso!' as resultado;