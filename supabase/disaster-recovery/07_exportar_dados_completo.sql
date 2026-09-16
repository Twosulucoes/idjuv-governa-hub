-- ============================================
-- IDJuv - Script COMPLETO de Exportação de Dados
-- ============================================
-- Execute este script no SQL Editor do Lovable Cloud
-- (Settings → Connectors → Lovable Cloud → View Backend)
-- para gerar os INSERTs de TODAS as tabelas
-- ============================================

-- ============================================
-- PARTE 1: TABELAS DE CONFIGURAÇÃO BASE
-- ============================================

-- 1.1 PERFIS DE ACESSO
SELECT '-- PERFIS' AS info;
SELECT 'INSERT INTO public.perfis (id, codigo, nome, descricao, nivel_hierarquia, perfil_pai_id, sistema, cor, icone, ativo, created_at) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || codigo || ''', ' ||
  '''' || REPLACE(nome, '''', '''''') || ''', ' ||
  COALESCE('''' || REPLACE(descricao, '''', '''''') || '''', 'NULL') || ', ' ||
  nivel_hierarquia || ', ' ||
  COALESCE('''' || perfil_pai_id || '''', 'NULL') || ', ' ||
  sistema || ', ' ||
  COALESCE('''' || cor || '''', 'NULL') || ', ' ||
  COALESCE('''' || icone || '''', 'NULL') || ', ' ||
  ativo || ', ' ||
  '''' || created_at || '''' ||
  ') ON CONFLICT (id) DO NOTHING;' AS insert_statement
FROM public.perfis
ORDER BY nivel_hierarquia DESC, nome;

-- 1.2 FUNÇÕES DO SISTEMA
SELECT '-- FUNCOES_SISTEMA' AS info;
SELECT 'INSERT INTO public.funcoes_sistema (id, codigo, nome, descricao, modulo, submodulo, tipo_acao, funcao_pai_id, ordem, ativo, rota, icone) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || codigo || ''', ' ||
  '''' || REPLACE(nome, '''', '''''') || ''', ' ||
  COALESCE('''' || REPLACE(descricao, '''', '''''') || '''', 'NULL') || ', ' ||
  '''' || modulo || ''', ' ||
  COALESCE('''' || submodulo || '''', 'NULL') || ', ' ||
  '''' || tipo_acao || ''', ' ||
  COALESCE('''' || funcao_pai_id || '''', 'NULL') || ', ' ||
  ordem || ', ' ||
  ativo || ', ' ||
  COALESCE('''' || rota || '''', 'NULL') || ', ' ||
  COALESCE('''' || icone || '''', 'NULL') ||
  ') ON CONFLICT (id) DO NOTHING;' AS insert_statement
FROM public.funcoes_sistema
ORDER BY modulo, ordem;

-- 1.3 PERFIL_FUNCOES (Associação)
SELECT '-- PERFIL_FUNCOES' AS info;
SELECT 'INSERT INTO public.perfil_funcoes (id, perfil_id, funcao_id, concedido, created_at, created_by) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || perfil_id || ''', ' ||
  '''' || funcao_id || ''', ' ||
  concedido || ', ' ||
  '''' || created_at || ''', ' ||
  COALESCE('''' || created_by || '''', 'NULL') ||
  ') ON CONFLICT (id) DO NOTHING;' AS insert_statement
FROM public.perfil_funcoes;

-- ============================================
-- PARTE 2: ESTRUTURA ORGANIZACIONAL
-- ============================================

-- 2.1 ESTRUTURA ORGANIZACIONAL
SELECT '-- ESTRUTURA_ORGANIZACIONAL' AS info;
SELECT 'INSERT INTO public.estrutura_organizacional (id, nome, sigla, tipo, nivel, superior_id, email, telefone, ativo, ordem, created_at) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || REPLACE(nome, '''', '''''') || ''', ' ||
  COALESCE('''' || sigla || '''', 'NULL') || ', ' ||
  '''' || tipo || '''::tipo_unidade, ' ||
  nivel || ', ' ||
  COALESCE('''' || superior_id || '''', 'NULL') || ', ' ||
  COALESCE('''' || REPLACE(email, '''', '''''') || '''', 'NULL') || ', ' ||
  COALESCE('''' || telefone || '''', 'NULL') || ', ' ||
  ativo || ', ' ||
  COALESCE(ordem::TEXT, '0') || ', ' ||
  '''' || created_at || '''' ||
  ') ON CONFLICT (id) DO NOTHING;' AS insert_statement
FROM public.estrutura_organizacional
ORDER BY nivel, ordem;

-- 2.2 UNIDADES LOCAIS
SELECT '-- UNIDADES_LOCAIS' AS info;
SELECT 'INSERT INTO public.unidades_locais (id, nome, codigo_unidade, tipo_unidade, status, endereco_logradouro, endereco_numero, endereco_bairro, endereco_cidade, endereco_uf, endereco_cep, capacidade_publico, ativo, created_at) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || REPLACE(nome, '''', '''''') || ''', ' ||
  COALESCE('''' || codigo_unidade || '''', 'NULL') || ', ' ||
  '''' || tipo_unidade || '''::tipo_unidade_local, ' ||
  '''' || status || '''::status_unidade_local, ' ||
  COALESCE('''' || REPLACE(endereco_logradouro, '''', '''''') || '''', 'NULL') || ', ' ||
  COALESCE('''' || endereco_numero || '''', 'NULL') || ', ' ||
  COALESCE('''' || REPLACE(endereco_bairro, '''', '''''') || '''', 'NULL') || ', ' ||
  COALESCE('''' || endereco_cidade || '''', '''Goiânia''') || ', ' ||
  COALESCE('''' || endereco_uf || '''', '''GO''') || ', ' ||
  COALESCE('''' || endereco_cep || '''', 'NULL') || ', ' ||
  COALESCE(capacidade_publico::TEXT, 'NULL') || ', ' ||
  'true, ' ||
  '''' || created_at || '''' ||
  ') ON CONFLICT (id) DO NOTHING;' AS insert_statement
FROM public.unidades_locais
ORDER BY nome;

-- ============================================
-- PARTE 3: RECURSOS HUMANOS
-- ============================================

-- 3.1 CARGOS
SELECT '-- CARGOS' AS info;
SELECT 'INSERT INTO public.cargos (id, nome, sigla, categoria, natureza, nivel, simbolo, valor_base, carga_horaria_semanal, ativo, created_at) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || REPLACE(nome, '''', '''''') || ''', ' ||
  COALESCE('''' || sigla || '''', 'NULL') || ', ' ||
  '''' || categoria || '''::categoria_cargo, ' ||
  COALESCE('''' || natureza || '''::natureza_cargo', 'NULL') || ', ' ||
  COALESCE(nivel::TEXT, '1') || ', ' ||
  COALESCE('''' || simbolo || '''', 'NULL') || ', ' ||
  COALESCE(valor_base::TEXT, 'NULL') || ', ' ||
  COALESCE(carga_horaria_semanal::TEXT, '40') || ', ' ||
  ativo || ', ' ||
  '''' || created_at || '''' ||
  ') ON CONFLICT (id) DO NOTHING;' AS insert_statement
FROM public.cargos
ORDER BY categoria, nome;

-- 3.2 SERVIDORES
SELECT '-- SERVIDORES' AS info;
SELECT 'INSERT INTO public.servidores (id, nome_completo, cpf, matricula, email, telefone, situacao, tipo_servidor, cargo_atual_id, unidade_atual_id, data_admissao, data_nascimento, sexo, estado_civil, created_at) VALUES (' ||
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
  COALESCE('''' || data_admissao || '''', 'NULL') || ', ' ||
  COALESCE('''' || data_nascimento || '''', 'NULL') || ', ' ||
  COALESCE('''' || sexo || '''', 'NULL') || ', ' ||
  COALESCE('''' || estado_civil || '''', 'NULL') || ', ' ||
  '''' || created_at || '''' ||
  ') ON CONFLICT (id) DO NOTHING;' AS insert_statement
FROM public.servidores
ORDER BY nome_completo;

-- 3.3 LOTAÇÕES
SELECT '-- LOTACOES' AS info;
SELECT 'INSERT INTO public.lotacoes (id, servidor_id, unidade_id, cargo_id, data_inicio, data_fim, ativo, portaria_numero, created_at) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || servidor_id || ''', ' ||
  '''' || unidade_id || ''', ' ||
  COALESCE('''' || cargo_id || '''', 'NULL') || ', ' ||
  '''' || data_inicio || ''', ' ||
  COALESCE('''' || data_fim || '''', 'NULL') || ', ' ||
  ativo || ', ' ||
  COALESCE('''' || portaria_numero || '''', 'NULL') || ', ' ||
  '''' || created_at || '''' ||
  ') ON CONFLICT (id) DO NOTHING;' AS insert_statement
FROM public.lotacoes
ORDER BY data_inicio DESC;

-- 3.4 VÍNCULOS FUNCIONAIS
SELECT '-- VINCULOS_FUNCIONAIS' AS info;
SELECT 'INSERT INTO public.vinculos_funcionais (id, servidor_id, tipo_vinculo, regime_juridico, data_inicio, data_fim, ativo, numero_contrato, created_at) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || servidor_id || ''', ' ||
  '''' || tipo_vinculo || ''', ' ||
  COALESCE('''' || regime_juridico || '''', 'NULL') || ', ' ||
  '''' || data_inicio || ''', ' ||
  COALESCE('''' || data_fim || '''', 'NULL') || ', ' ||
  ativo || ', ' ||
  COALESCE('''' || numero_contrato || '''', 'NULL') || ', ' ||
  '''' || created_at || '''' ||
  ') ON CONFLICT (id) DO NOTHING;' AS insert_statement
FROM public.vinculos_funcionais
ORDER BY data_inicio DESC;

-- 3.5 PROVIMENTOS
SELECT '-- PROVIMENTOS' AS info;
SELECT 'INSERT INTO public.provimentos (id, servidor_id, cargo_id, tipo_provimento, data_inicio, data_fim, ato_numero, ato_data, observacao, created_at) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || servidor_id || ''', ' ||
  '''' || cargo_id || ''', ' ||
  '''' || tipo_provimento || ''', ' ||
  '''' || data_inicio || ''', ' ||
  COALESCE('''' || data_fim || '''', 'NULL') || ', ' ||
  COALESCE('''' || ato_numero || '''', 'NULL') || ', ' ||
  COALESCE('''' || ato_data || '''', 'NULL') || ', ' ||
  COALESCE('''' || REPLACE(observacao, '''', '''''') || '''', 'NULL') || ', ' ||
  '''' || created_at || '''' ||
  ') ON CONFLICT (id) DO NOTHING;' AS insert_statement
FROM public.provimentos
ORDER BY data_inicio DESC;

-- 3.6 DESIGNAÇÕES
SELECT '-- DESIGNACOES' AS info;
SELECT 'INSERT INTO public.designacoes (id, servidor_id, cargo_id, unidade_id, tipo_designacao, data_inicio, data_fim, portaria_numero, portaria_data, ativo, created_at) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || servidor_id || ''', ' ||
  '''' || cargo_id || ''', ' ||
  COALESCE('''' || unidade_id || '''', 'NULL') || ', ' ||
  '''' || tipo_designacao || ''', ' ||
  '''' || data_inicio || ''', ' ||
  COALESCE('''' || data_fim || '''', 'NULL') || ', ' ||
  COALESCE('''' || portaria_numero || '''', 'NULL') || ', ' ||
  COALESCE('''' || portaria_data || '''', 'NULL') || ', ' ||
  ativo || ', ' ||
  '''' || created_at || '''' ||
  ') ON CONFLICT (id) DO NOTHING;' AS insert_statement
FROM public.designacoes
ORDER BY data_inicio DESC;

-- 3.7 FÉRIAS
SELECT '-- FERIAS_SERVIDOR' AS info;
SELECT 'INSERT INTO public.ferias_servidor (id, servidor_id, exercicio, periodo_aquisitivo_inicio, periodo_aquisitivo_fim, data_inicio, data_fim, dias, tipo, status, created_at) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || servidor_id || ''', ' ||
  exercicio || ', ' ||
  '''' || periodo_aquisitivo_inicio || ''', ' ||
  '''' || periodo_aquisitivo_fim || ''', ' ||
  '''' || data_inicio || ''', ' ||
  '''' || data_fim || ''', ' ||
  dias || ', ' ||
  '''' || tipo || ''', ' ||
  '''' || status || ''', ' ||
  '''' || created_at || '''' ||
  ') ON CONFLICT (id) DO NOTHING;' AS insert_statement
FROM public.ferias_servidor
ORDER BY exercicio DESC, data_inicio DESC;

-- ============================================
-- PARTE 4: FINANCEIRO / FOLHA
-- ============================================

-- 4.1 RUBRICAS
SELECT '-- RUBRICAS' AS info;
SELECT 'INSERT INTO public.rubricas (id, codigo, nome, tipo, natureza, incide_inss, incide_irrf, ativo, created_at) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || codigo || ''', ' ||
  '''' || REPLACE(nome, '''', '''''') || ''', ' ||
  '''' || tipo || '''::tipo_rubrica, ' ||
  '''' || natureza || '''::natureza_rubrica, ' ||
  incide_inss || ', ' ||
  incide_irrf || ', ' ||
  ativo || ', ' ||
  '''' || created_at || '''' ||
  ') ON CONFLICT (id) DO NOTHING;' AS insert_statement
FROM public.rubricas
ORDER BY codigo;

-- 4.2 FOLHAS DE PAGAMENTO
SELECT '-- FOLHAS_PAGAMENTO' AS info;
SELECT 'INSERT INTO public.folhas_pagamento (id, competencia_ano, competencia_mes, tipo, status, data_abertura, data_fechamento, total_bruto, total_descontos, total_liquido, created_at) VALUES (' ||
  '''' || id || ''', ' ||
  competencia_ano || ', ' ||
  competencia_mes || ', ' ||
  '''' || tipo || '''::tipo_folha, ' ||
  '''' || status || '''::status_folha, ' ||
  '''' || data_abertura || ''', ' ||
  COALESCE('''' || data_fechamento || '''', 'NULL') || ', ' ||
  COALESCE(total_bruto::TEXT, '0') || ', ' ||
  COALESCE(total_descontos::TEXT, '0') || ', ' ||
  COALESCE(total_liquido::TEXT, '0') || ', ' ||
  '''' || created_at || '''' ||
  ') ON CONFLICT (id) DO NOTHING;' AS insert_statement
FROM public.folhas_pagamento
ORDER BY competencia_ano DESC, competencia_mes DESC;

-- 4.3 FICHAS FINANCEIRAS
SELECT '-- FICHAS_FINANCEIRAS' AS info;
SELECT 'INSERT INTO public.fichas_financeiras (id, servidor_id, folha_id, rubrica_id, valor, quantidade, referencia, created_at) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || servidor_id || ''', ' ||
  '''' || folha_id || ''', ' ||
  '''' || rubrica_id || ''', ' ||
  valor || ', ' ||
  COALESCE(quantidade::TEXT, '1') || ', ' ||
  COALESCE('''' || referencia || '''', 'NULL') || ', ' ||
  '''' || created_at || '''' ||
  ') ON CONFLICT (id) DO NOTHING;' AS insert_statement
FROM public.fichas_financeiras;

-- 4.4 BANCOS CNAB
SELECT '-- BANCOS_CNAB' AS info;
SELECT 'INSERT INTO public.bancos_cnab (id, codigo_banco, nome, nome_reduzido, layout_cnab240, layout_cnab400, ativo, created_at) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || codigo_banco || ''', ' ||
  '''' || REPLACE(nome, '''', '''''') || ''', ' ||
  COALESCE('''' || nome_reduzido || '''', 'NULL') || ', ' ||
  COALESCE(layout_cnab240::TEXT, 'false') || ', ' ||
  COALESCE(layout_cnab400::TEXT, 'false') || ', ' ||
  ativo || ', ' ||
  '''' || created_at || '''' ||
  ') ON CONFLICT (id) DO NOTHING;' AS insert_statement
FROM public.bancos_cnab
ORDER BY codigo_banco;

-- ============================================
-- PARTE 5: USUÁRIOS E PERMISSÕES
-- ============================================

-- 5.1 PROFILES (Usuários)
SELECT '-- PROFILES' AS info;
SELECT 'INSERT INTO public.profiles (id, full_name, email, cpf, tipo_usuario, servidor_id, is_active, created_at) VALUES (' ||
  '''' || id || ''', ' ||
  COALESCE('''' || REPLACE(full_name, '''', '''''') || '''', 'NULL') || ', ' ||
  COALESCE('''' || email || '''', 'NULL') || ', ' ||
  COALESCE('''' || cpf || '''', 'NULL') || ', ' ||
  COALESCE('''' || tipo_usuario || '''::tipo_usuario', '''servidor''::tipo_usuario') || ', ' ||
  COALESCE('''' || servidor_id || '''', 'NULL') || ', ' ||
  COALESCE(is_active::TEXT, 'true') || ', ' ||
  '''' || created_at || '''' ||
  ') ON CONFLICT (id) DO NOTHING;' AS insert_statement
FROM public.profiles
ORDER BY full_name;

-- 5.2 USUARIO_PERFIS (Associação usuário-perfil)
SELECT '-- USUARIO_PERFIS' AS info;
SELECT 'INSERT INTO public.usuario_perfis (id, user_id, perfil_id, ativo, data_inicio, data_fim, created_at) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || user_id || ''', ' ||
  '''' || perfil_id || ''', ' ||
  ativo || ', ' ||
  '''' || data_inicio || ''', ' ||
  COALESCE('''' || data_fim || '''', 'NULL') || ', ' ||
  '''' || created_at || '''' ||
  ') ON CONFLICT (id) DO NOTHING;' AS insert_statement
FROM public.usuario_perfis;

-- ============================================
-- PARTE 6: FORNECEDORES E CONTRATOS
-- ============================================

-- 6.1 FORNECEDORES
SELECT '-- FORNECEDORES' AS info;
SELECT 'INSERT INTO public.fornecedores (id, razao_social, nome_fantasia, cnpj_cpf, tipo_pessoa, email, telefone, ativo, created_at) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || REPLACE(razao_social, '''', '''''') || ''', ' ||
  COALESCE('''' || REPLACE(nome_fantasia, '''', '''''') || '''', 'NULL') || ', ' ||
  '''' || cnpj_cpf || ''', ' ||
  '''' || tipo_pessoa || ''', ' ||
  COALESCE('''' || email || '''', 'NULL') || ', ' ||
  COALESCE('''' || telefone || '''', 'NULL') || ', ' ||
  ativo || ', ' ||
  '''' || created_at || '''' ||
  ') ON CONFLICT (id) DO NOTHING;' AS insert_statement
FROM public.fornecedores
ORDER BY razao_social;

-- 6.2 CONTRATOS
SELECT '-- CONTRATOS' AS info;
SELECT 'INSERT INTO public.contratos (id, numero_contrato, ano, objeto, fornecedor_id, valor_total, data_assinatura, data_vigencia_inicio, data_vigencia_fim, situacao, created_at) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || numero_contrato || ''', ' ||
  ano || ', ' ||
  '''' || REPLACE(objeto, '''', '''''') || ''', ' ||
  '''' || fornecedor_id || ''', ' ||
  COALESCE(valor_total::TEXT, '0') || ', ' ||
  '''' || data_assinatura || ''', ' ||
  '''' || data_vigencia_inicio || ''', ' ||
  '''' || data_vigencia_fim || ''', ' ||
  '''' || situacao || ''', ' ||
  '''' || created_at || '''' ||
  ') ON CONFLICT (id) DO NOTHING;' AS insert_statement
FROM public.contratos
ORDER BY ano DESC, numero_contrato;

-- ============================================
-- PARTE 7: PATRIMÔNIO
-- ============================================

-- 7.1 BENS PATRIMONIAIS
SELECT '-- BENS_PATRIMONIAIS' AS info;
SELECT 'INSERT INTO public.bens_patrimoniais (id, numero_patrimonio, descricao, marca, modelo, numero_serie, data_aquisicao, valor_aquisicao, situacao, unidade_id, unidade_local_id, responsavel_id, created_at) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || numero_patrimonio || ''', ' ||
  '''' || REPLACE(descricao, '''', '''''') || ''', ' ||
  COALESCE('''' || REPLACE(marca, '''', '''''') || '''', 'NULL') || ', ' ||
  COALESCE('''' || REPLACE(modelo, '''', '''''') || '''', 'NULL') || ', ' ||
  COALESCE('''' || numero_serie || '''', 'NULL') || ', ' ||
  '''' || data_aquisicao || ''', ' ||
  valor_aquisicao || ', ' ||
  COALESCE('''' || situacao || '''', '''ativo''') || ', ' ||
  COALESCE('''' || unidade_id || '''', 'NULL') || ', ' ||
  COALESCE('''' || unidade_local_id || '''', 'NULL') || ', ' ||
  COALESCE('''' || responsavel_id || '''', 'NULL') || ', ' ||
  '''' || created_at || '''' ||
  ') ON CONFLICT (id) DO NOTHING;' AS insert_statement
FROM public.bens_patrimoniais
ORDER BY numero_patrimonio;

-- ============================================
-- PARTE 8: FEDERAÇÕES E INSTITUIÇÕES
-- ============================================

-- 8.1 FEDERAÇÕES ESPORTIVAS
SELECT '-- FEDERACOES_ESPORTIVAS' AS info;
SELECT 'INSERT INTO public.federacoes_esportivas (id, nome, sigla, cnpj, modalidade, email, telefone, situacao, created_at) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || REPLACE(nome, '''', '''''') || ''', ' ||
  COALESCE('''' || sigla || '''', 'NULL') || ', ' ||
  COALESCE('''' || cnpj || '''', 'NULL') || ', ' ||
  COALESCE('''' || modalidade || '''', 'NULL') || ', ' ||
  COALESCE('''' || email || '''', 'NULL') || ', ' ||
  COALESCE('''' || telefone || '''', 'NULL') || ', ' ||
  '''' || situacao || ''', ' ||
  '''' || created_at || '''' ||
  ') ON CONFLICT (id) DO NOTHING;' AS insert_statement
FROM public.federacoes_esportivas
ORDER BY nome;

-- 8.2 INSTITUIÇÕES
SELECT '-- INSTITUICOES' AS info;
SELECT 'INSERT INTO public.instituicoes (id, nome, tipo, cnpj, email, telefone, situacao, created_at) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || REPLACE(nome, '''', '''''') || ''', ' ||
  '''' || tipo || ''', ' ||
  COALESCE('''' || cnpj || '''', 'NULL') || ', ' ||
  COALESCE('''' || email || '''', 'NULL') || ', ' ||
  COALESCE('''' || telefone || '''', 'NULL') || ', ' ||
  '''' || situacao || ''', ' ||
  '''' || created_at || '''' ||
  ') ON CONFLICT (id) DO NOTHING;' AS insert_statement
FROM public.instituicoes
ORDER BY nome;

-- ============================================
-- PARTE 9: AGENDA E EVENTOS
-- ============================================

-- 9.1 AGENDA UNIDADE
SELECT '-- AGENDA_UNIDADE' AS info;
SELECT 'INSERT INTO public.agenda_unidade (id, titulo, unidade_local_id, data_inicio, data_fim, tipo_uso, status, solicitante_nome, created_at) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || REPLACE(titulo, '''', '''''') || ''', ' ||
  '''' || unidade_local_id || ''', ' ||
  '''' || data_inicio || ''', ' ||
  '''' || data_fim || ''', ' ||
  '''' || tipo_uso || ''', ' ||
  '''' || status || '''::status_agenda, ' ||
  '''' || REPLACE(solicitante_nome, '''', '''''') || ''', ' ||
  '''' || created_at || '''' ||
  ') ON CONFLICT (id) DO NOTHING;' AS insert_statement
FROM public.agenda_unidade
ORDER BY data_inicio DESC;

-- ============================================
-- PARTE 10: DOCUMENTOS
-- ============================================

-- 10.1 DOCUMENTOS
SELECT '-- DOCUMENTOS' AS info;
SELECT 'INSERT INTO public.documentos (id, titulo, tipo, numero, ano, data_documento, emitente_id, assunto, status, created_at) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || REPLACE(titulo, '''', '''''') || ''', ' ||
  '''' || tipo || ''', ' ||
  COALESCE('''' || numero || '''', 'NULL') || ', ' ||
  COALESCE(ano::TEXT, 'NULL') || ', ' ||
  COALESCE('''' || data_documento || '''', 'NULL') || ', ' ||
  COALESCE('''' || emitente_id || '''', 'NULL') || ', ' ||
  COALESCE('''' || REPLACE(assunto, '''', '''''') || '''', 'NULL') || ', ' ||
  '''' || status || ''', ' ||
  '''' || created_at || '''' ||
  ') ON CONFLICT (id) DO NOTHING;' AS insert_statement
FROM public.documentos
ORDER BY ano DESC, numero;

-- ============================================
-- PARTE 11: AUDITORIA (Últimos 1000 registros)
-- ============================================

SELECT '-- AUDIT_LOGS (últimos 1000)' AS info;
SELECT 'INSERT INTO public.audit_logs (id, user_id, action, entity_type, entity_id, description, module_name, timestamp) VALUES (' ||
  '''' || id || ''', ' ||
  COALESCE('''' || user_id || '''', 'NULL') || ', ' ||
  '''' || action || '''::audit_action, ' ||
  COALESCE('''' || entity_type || '''', 'NULL') || ', ' ||
  COALESCE('''' || entity_id || '''', 'NULL') || ', ' ||
  COALESCE('''' || REPLACE(description, '''', '''''') || '''', 'NULL') || ', ' ||
  COALESCE('''' || module_name || '''', 'NULL') || ', ' ||
  '''' || timestamp || '''' ||
  ') ON CONFLICT (id) DO NOTHING;' AS insert_statement
FROM public.audit_logs
ORDER BY timestamp DESC
LIMIT 1000;

-- ============================================
-- FIM DO SCRIPT DE EXPORTAÇÃO COMPLETO
-- ============================================
-- IMPORTANTE: Execute este script no SQL Editor
-- e copie os resultados (statements INSERT) para
-- executar no seu novo projeto Supabase.
-- ============================================
