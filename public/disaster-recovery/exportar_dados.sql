-- ============================================
-- IDJuv - Script de Exportação de Dados
-- ============================================
-- Execute este script no SQL Editor do Lovable Cloud
-- para gerar os INSERTs dos dados existentes
-- ============================================

-- ============================================
-- EXPORTAR ESTRUTURA ORGANIZACIONAL
-- ============================================

SELECT 'INSERT INTO public.estrutura_organizacional (id, nome, sigla, tipo, nivel, superior_id, email, telefone, ativo, ordem) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || REPLACE(nome, '''', '''''') || ''', ' ||
  COALESCE('''' || sigla || '''', 'NULL') || ', ' ||
  '''' || tipo || '''::tipo_unidade, ' ||
  nivel || ', ' ||
  COALESCE('''' || superior_id || '''', 'NULL') || ', ' ||
  COALESCE('''' || REPLACE(email, '''', '''''') || '''', 'NULL') || ', ' ||
  COALESCE('''' || telefone || '''', 'NULL') || ', ' ||
  ativo || ', ' ||
  COALESCE(ordem::TEXT, '0') ||
  ');' AS insert_statement
FROM public.estrutura_organizacional
ORDER BY nivel, ordem;

-- ============================================
-- EXPORTAR CARGOS
-- ============================================

SELECT 'INSERT INTO public.cargos (id, nome, sigla, categoria, natureza, nivel, simbolo, valor_base, carga_horaria_semanal, ativo) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || REPLACE(nome, '''', '''''') || ''', ' ||
  COALESCE('''' || sigla || '''', 'NULL') || ', ' ||
  '''' || categoria || '''::categoria_cargo, ' ||
  COALESCE('''' || natureza || '''::natureza_cargo', 'NULL') || ', ' ||
  COALESCE(nivel::TEXT, '1') || ', ' ||
  COALESCE('''' || simbolo || '''', 'NULL') || ', ' ||
  COALESCE(valor_base::TEXT, 'NULL') || ', ' ||
  COALESCE(carga_horaria_semanal::TEXT, '40') || ', ' ||
  ativo ||
  ');' AS insert_statement
FROM public.cargos
ORDER BY categoria, nome;

-- ============================================
-- EXPORTAR SERVIDORES
-- ============================================

SELECT 'INSERT INTO public.servidores (id, nome_completo, cpf, matricula, email, telefone, situacao, tipo_servidor, cargo_atual_id, unidade_atual_id, data_admissao) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || REPLACE(nome_completo, '''', '''''') || ''', ' ||
  '''' || cpf || ''', ' ||
  COALESCE('''' || matricula || '''', 'NULL') || ', ' ||
  COALESCE('''' || REPLACE(email, '''', '''''') || '''', 'NULL') || ', ' ||
  COALESCE('''' || telefone || '''', 'NULL') || ', ' ||
  '''' || situacao || '''::situacao_servidor, ' ||
  COALESCE('''' || tipo_servidor || '''::tipo_servidor', 'NULL') || ', ' ||
  COALESCE('''' || cargo_atual_id || '''', 'NULL') || ', ' ||
  COALESCE('''' || unidade_atual_id || '''', 'NULL') || ', ' ||
  COALESCE('''' || data_admissao || '''', 'NULL') ||
  ');' AS insert_statement
FROM public.servidores
ORDER BY nome_completo;

-- ============================================
-- EXPORTAR UNIDADES LOCAIS
-- ============================================

SELECT 'INSERT INTO public.unidades_locais (id, nome, codigo_unidade, tipo_unidade, status, endereco_logradouro, endereco_bairro, endereco_cidade, capacidade_publico, ativo) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || REPLACE(nome, '''', '''''') || ''', ' ||
  COALESCE('''' || codigo_unidade || '''', 'NULL') || ', ' ||
  '''' || tipo_unidade || '''::tipo_unidade_local, ' ||
  '''' || status || '''::status_unidade_local, ' ||
  COALESCE('''' || REPLACE(endereco_logradouro, '''', '''''') || '''', 'NULL') || ', ' ||
  COALESCE('''' || REPLACE(endereco_bairro, '''', '''''') || '''', 'NULL') || ', ' ||
  COALESCE('''' || endereco_cidade || '''', '''Goiânia''') || ', ' ||
  COALESCE(capacidade_publico::TEXT, 'NULL') || ', ' ||
  'true' ||
  ');' AS insert_statement
FROM public.unidades_locais
ORDER BY nome;

-- ============================================
-- EXPORTAR LOTAÇÕES ATIVAS
-- ============================================

SELECT 'INSERT INTO public.lotacoes (id, servidor_id, unidade_id, cargo_id, data_inicio, ativo) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || servidor_id || ''', ' ||
  '''' || unidade_id || ''', ' ||
  COALESCE('''' || cargo_id || '''', 'NULL') || ', ' ||
  '''' || data_inicio || ''', ' ||
  ativo ||
  ');' AS insert_statement
FROM public.lotacoes
WHERE ativo = true
ORDER BY data_inicio DESC;

-- ============================================
-- EXPORTAR RUBRICAS
-- ============================================

SELECT 'INSERT INTO public.rubricas (id, codigo, nome, tipo, natureza, incide_inss, incide_irrf, ativo) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || codigo || ''', ' ||
  '''' || REPLACE(nome, '''', '''''') || ''', ' ||
  '''' || tipo || '''::tipo_rubrica, ' ||
  '''' || natureza || '''::natureza_rubrica, ' ||
  incide_inss || ', ' ||
  incide_irrf || ', ' ||
  ativo ||
  ');' AS insert_statement
FROM public.rubricas
ORDER BY codigo;

-- ============================================
-- EXPORTAR PERFIS CUSTOMIZADOS
-- ============================================

SELECT 'INSERT INTO public.perfis (id, codigo, nome, descricao, nivel_hierarquia, sistema, cor, icone, ativo) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || codigo || ''', ' ||
  '''' || REPLACE(nome, '''', '''''') || ''', ' ||
  COALESCE('''' || REPLACE(descricao, '''', '''''') || '''', 'NULL') || ', ' ||
  nivel_hierarquia || ', ' ||
  sistema || ', ' ||
  COALESCE('''' || cor || '''', 'NULL') || ', ' ||
  COALESCE('''' || icone || '''', 'NULL') || ', ' ||
  ativo ||
  ') ON CONFLICT (codigo) DO NOTHING;' AS insert_statement
FROM public.perfis
WHERE sistema = false
ORDER BY nivel_hierarquia DESC;

-- ============================================
-- EXPORTAR FUNÇÕES DO SISTEMA CUSTOMIZADAS
-- ============================================

SELECT 'INSERT INTO public.funcoes_sistema (id, codigo, nome, modulo, submodulo, tipo_acao, ordem, ativo) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || codigo || ''', ' ||
  '''' || REPLACE(nome, '''', '''''') || ''', ' ||
  '''' || modulo || ''', ' ||
  COALESCE('''' || submodulo || '''', 'NULL') || ', ' ||
  '''' || tipo_acao || ''', ' ||
  ordem || ', ' ||
  ativo ||
  ') ON CONFLICT (codigo) DO NOTHING;' AS insert_statement
FROM public.funcoes_sistema
ORDER BY modulo, ordem;

-- ============================================
-- NOTA: Para tabelas maiores como folhas_pagamento,
-- fichas_financeiras, audit_logs, etc., recomenda-se
-- usar o pg_dump do Supabase ou exportação via CSV
-- ============================================

-- ============================================
-- FIM DO SCRIPT DE EXPORTAÇÃO
-- ============================================
