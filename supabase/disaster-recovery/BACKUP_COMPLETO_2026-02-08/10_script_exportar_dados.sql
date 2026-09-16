-- ============================================================
-- IDJUV - SCRIPT PARA EXPORTAR DADOS EXISTENTES
-- ============================================================
-- 
-- INSTRUÇÕES:
-- 1. Acesse o Lovable Cloud Backend (Settings → Connectors → View Backend)
-- 2. Execute este script no SQL Editor
-- 3. Copie os resultados (INSERTs gerados)
-- 4. Execute os INSERTs no novo Supabase
--
-- ============================================================

-- ============================================
-- HELPER: Gerar INSERT genérico
-- ============================================

-- Este script gera INSERTs usando pg_catalog para extrair dados
-- Execute cada seção separadamente para evitar timeout

-- ============================================
-- PARTE 1: ESTRUTURA ORGANIZACIONAL
-- ============================================

SELECT 
  'INSERT INTO public.estrutura_organizacional (id, nome, sigla, tipo, nivel, ordem, superior_id, email, telefone, ativo, created_at) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || REPLACE(nome, '''', '''''') || ''', ' ||
  COALESCE('''' || sigla || '''', 'NULL') || ', ' ||
  '''' || tipo || '''::tipo_unidade, ' ||
  nivel || ', ' ||
  COALESCE(ordem::TEXT, '0') || ', ' ||
  COALESCE('''' || superior_id || '''', 'NULL') || ', ' ||
  COALESCE('''' || REPLACE(email, '''', '''''') || '''', 'NULL') || ', ' ||
  COALESCE('''' || telefone || '''', 'NULL') || ', ' ||
  ativo || ', ' ||
  '''' || created_at || '''' ||
  ') ON CONFLICT (id) DO NOTHING;' AS sql
FROM public.estrutura_organizacional
ORDER BY nivel, ordem;

-- ============================================
-- PARTE 2: CARGOS
-- ============================================

SELECT 
  'INSERT INTO public.cargos (id, nome, sigla, categoria, ativo, created_at) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || REPLACE(nome, '''', '''''') || ''', ' ||
  COALESCE('''' || sigla || '''', 'NULL') || ', ' ||
  '''' || categoria || '''::categoria_cargo, ' ||
  ativo || ', ' ||
  '''' || created_at || '''' ||
  ') ON CONFLICT (id) DO NOTHING;' AS sql
FROM public.cargos
ORDER BY categoria, nome;

-- ============================================
-- PARTE 3: SERVIDORES
-- ============================================

SELECT 
  'INSERT INTO public.servidores (id, nome_completo, cpf, matricula, email, situacao, vinculo, cargo_id, unidade_id, data_admissao, ativo, created_at) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || REPLACE(nome_completo, '''', '''''') || ''', ' ||
  COALESCE('''' || cpf || '''', 'NULL') || ', ' ||
  COALESCE('''' || matricula || '''', 'NULL') || ', ' ||
  COALESCE('''' || email || '''', 'NULL') || ', ' ||
  '''' || situacao || '''::situacao_funcional, ' ||
  '''' || vinculo || '''::vinculo_funcional, ' ||
  COALESCE('''' || cargo_id || '''', 'NULL') || ', ' ||
  COALESCE('''' || unidade_id || '''', 'NULL') || ', ' ||
  COALESCE('''' || data_admissao || '''', 'NULL') || ', ' ||
  ativo || ', ' ||
  '''' || created_at || '''' ||
  ') ON CONFLICT (id) DO NOTHING;' AS sql
FROM public.servidores
ORDER BY nome_completo;

-- ============================================
-- PARTE 4: UNIDADES LOCAIS
-- ============================================

SELECT 
  'INSERT INTO public.unidades_locais (id, nome, codigo_unidade, tipo_unidade, status, cidade, ativo, created_at) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || REPLACE(nome, '''', '''''') || ''', ' ||
  COALESCE('''' || codigo_unidade || '''', 'NULL') || ', ' ||
  '''' || tipo_unidade || '''::tipo_unidade_local, ' ||
  '''' || status || '''::status_unidade_local, ' ||
  COALESCE('''' || cidade || '''', '''Goiânia''') || ', ' ||
  COALESCE(ativo::TEXT, 'true') || ', ' ||
  '''' || created_at || '''' ||
  ') ON CONFLICT (id) DO NOTHING;' AS sql
FROM public.unidades_locais
ORDER BY nome;

-- ============================================
-- PARTE 5: FORNECEDORES
-- ============================================

SELECT 
  'INSERT INTO public.fornecedores (id, razao_social, nome_fantasia, cnpj_cpf, tipo_pessoa, email, telefone, ativo, created_at) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || REPLACE(razao_social, '''', '''''') || ''', ' ||
  COALESCE('''' || REPLACE(nome_fantasia, '''', '''''') || '''', 'NULL') || ', ' ||
  '''' || cnpj_cpf || ''', ' ||
  COALESCE('''' || tipo_pessoa || '''', '''PJ''') || ', ' ||
  COALESCE('''' || email || '''', 'NULL') || ', ' ||
  COALESCE('''' || telefone || '''', 'NULL') || ', ' ||
  ativo || ', ' ||
  '''' || created_at || '''' ||
  ') ON CONFLICT (id) DO NOTHING;' AS sql
FROM public.fornecedores
ORDER BY razao_social;

-- ============================================
-- PARTE 6: BENS PATRIMONIAIS
-- ============================================

SELECT 
  'INSERT INTO public.bens_patrimoniais (id, numero_patrimonio, descricao, categoria_bem, marca, modelo, data_aquisicao, valor_aquisicao, situacao, unidade_local_id, responsavel_id, created_at) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || numero_patrimonio || ''', ' ||
  '''' || REPLACE(descricao, '''', '''''') || ''', ' ||
  COALESCE('''' || categoria_bem || '''::categoria_bem', 'NULL') || ', ' ||
  COALESCE('''' || REPLACE(marca, '''', '''''') || '''', 'NULL') || ', ' ||
  COALESCE('''' || REPLACE(modelo, '''', '''''') || '''', 'NULL') || ', ' ||
  '''' || data_aquisicao || ''', ' ||
  valor_aquisicao || ', ' ||
  COALESCE('''' || situacao || '''', '''ativo''') || ', ' ||
  COALESCE('''' || unidade_local_id || '''', 'NULL') || ', ' ||
  COALESCE('''' || responsavel_id || '''', 'NULL') || ', ' ||
  '''' || created_at || '''' ||
  ') ON CONFLICT (id) DO NOTHING;' AS sql
FROM public.bens_patrimoniais
ORDER BY numero_patrimonio;

-- ============================================
-- PARTE 7: CONTRATOS
-- ============================================

SELECT 
  'INSERT INTO public.contratos (id, numero_contrato, ano, objeto, fornecedor_id, valor_total, data_assinatura, data_vigencia_inicio, data_vigencia_fim, situacao, created_at) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || numero_contrato || ''', ' ||
  ano || ', ' ||
  '''' || REPLACE(objeto, '''', '''''') || ''', ' ||
  COALESCE('''' || fornecedor_id || '''', 'NULL') || ', ' ||
  COALESCE(valor_total::TEXT, '0') || ', ' ||
  '''' || data_assinatura || ''', ' ||
  '''' || data_vigencia_inicio || ''', ' ||
  '''' || data_vigencia_fim || ''', ' ||
  COALESCE('''' || situacao || '''', '''vigente''') || ', ' ||
  '''' || created_at || '''' ||
  ') ON CONFLICT (id) DO NOTHING;' AS sql
FROM public.contratos
ORDER BY ano DESC, numero_contrato;

-- ============================================
-- PARTE 8: FEDERAÇÕES
-- ============================================

SELECT 
  'INSERT INTO public.federacoes_esportivas (id, nome, sigla, cnpj, modalidade, email, telefone, situacao, ativo, created_at) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || REPLACE(nome, '''', '''''') || ''', ' ||
  COALESCE('''' || sigla || '''', 'NULL') || ', ' ||
  COALESCE('''' || cnpj || '''', 'NULL') || ', ' ||
  COALESCE('''' || modalidade || '''', 'NULL') || ', ' ||
  COALESCE('''' || email || '''', 'NULL') || ', ' ||
  COALESCE('''' || telefone || '''', 'NULL') || ', ' ||
  COALESCE('''' || situacao || '''', '''ativa''') || ', ' ||
  COALESCE(ativo::TEXT, 'true') || ', ' ||
  '''' || created_at || '''' ||
  ') ON CONFLICT (id) DO NOTHING;' AS sql
FROM public.federacoes_esportivas
ORDER BY nome;

-- ============================================
-- PARTE 9: PROFILES (Usuários)
-- ============================================

SELECT 
  'INSERT INTO public.profiles (id, full_name, email, cpf, tipo_usuario, servidor_id, is_active, created_at) VALUES (' ||
  '''' || id || ''', ' ||
  COALESCE('''' || REPLACE(full_name, '''', '''''') || '''', 'NULL') || ', ' ||
  COALESCE('''' || email || '''', 'NULL') || ', ' ||
  COALESCE('''' || cpf || '''', 'NULL') || ', ' ||
  COALESCE('''' || tipo_usuario || '''', '''servidor''') || ', ' ||
  COALESCE('''' || servidor_id || '''', 'NULL') || ', ' ||
  COALESCE(is_active::TEXT, 'true') || ', ' ||
  '''' || created_at || '''' ||
  ') ON CONFLICT (id) DO NOTHING;' AS sql
FROM public.profiles
ORDER BY full_name;

-- ============================================
-- PARTE 10: USER_ROLES
-- ============================================

SELECT 
  'INSERT INTO public.user_roles (id, user_id, role, created_at) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || user_id || ''', ' ||
  '''' || role || '''::app_role, ' ||
  '''' || created_at || '''' ||
  ') ON CONFLICT (user_id, role) DO NOTHING;' AS sql
FROM public.user_roles;

-- ============================================================
-- NOTA: Para tabelas adicionais, use o mesmo padrão de
-- SELECT com concatenação de strings para gerar INSERTs.
-- ============================================================

-- ============================================================
-- FIM: 10_script_exportar_dados.sql
-- ============================================================
