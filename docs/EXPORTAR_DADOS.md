# 📤 Guia de Exportação de Dados - IDJuv

## 📊 Resumo dos Dados

O banco atual contém **42 tabelas com dados**:

| Tabela | Registros | Descrição |
|--------|-----------|-----------|
| `servidores` | 82 | Dados completos dos servidores |
| `pre_cadastros` | 87 | Pré-cadastros de candidatos |
| `lotacoes` | 83 | Histórico de lotações |
| `provimentos` | 82 | Provimentos e nomeações |
| `historico_funcional` | 83 | Histórico funcional completo |
| `fichas_financeiras` | 82 | Fichas financeiras |
| `estrutura_organizacional` | 43 | Organograma institucional |
| `unidades_locais` | 32 | Ginásios, estádios, parques |
| `composicao_cargos` | 50 | Relação cargo-unidade |
| `cargos` | 16 | Cargos comissionados |
| `perfis` | 5 | Perfis de acesso |
| `funcoes_sistema` | 21 | Funções do sistema |
| `perfil_funcoes` | 21 | Permissões dos perfis |
| `profiles` | 5 | Usuários do sistema |
| `folhas_pagamento` | 4 | Folhas processadas |
| `rubricas` | 14 | Rubricas de folha |
| `bancos_cnab` | 10 | Bancos homologados |
| `parametros_folha` | 7 | Parâmetros de cálculo |
| `tabela_inss` | 4 | Faixas INSS 2025 |
| `tabela_irrf` | 5 | Faixas IRRF 2025 |
| `config_autarquia` | 1 | Configuração do órgão |
| `federacoes_esportivas` | 2 | Federações cadastradas |
| E mais 20+ tabelas... | - | - |

---

## 🚀 Passo a Passo para Migração

### 1️⃣ Execute o Schema Primeiro

Antes de importar dados, execute o schema completo no seu Supabase:

1. Acesse seu Supabase Dashboard → SQL Editor
2. Execute o conteúdo de `public/disaster-recovery/schema-completo.sql`
3. Depois execute `docs/CORRECOES_BANCO.sql`

### 2️⃣ Exportar Dados do Lovable Cloud

O Lovable não permite acesso direto ao Supabase Dashboard. Para exportar os dados, use os comandos SQL abaixo no seu novo Supabase (após criar as tabelas):

### 3️⃣ Scripts de Importação de Dados

Execute estes scripts **NA ORDEM** no SQL Editor do seu Supabase próprio:

---

## 📋 PARTE 1: Dados de Configuração (Sem Dependências)

```sql
-- ============================================================
-- BANCOS CNAB (Bancos homologados para CNAB)
-- ============================================================
INSERT INTO public.bancos_cnab (id, codigo_banco, nome, nome_reduzido, layout_cnab240, layout_cnab400, ativo) VALUES
('e84a3fc0-05e2-481a-8b15-b3e2aa023707', '001', 'Banco do Brasil S.A.', 'BCO DO BRASIL', true, true, true),
('f706b66b-3b98-44cf-8f10-3791d1dfdab3', '033', 'Banco Santander Brasil S.A.', 'SANTANDER', true, true, true),
('a07fca48-3113-4713-9d87-adcce8820f4f', '104', 'Caixa Econômica Federal', 'CEF', true, true, true),
('5ebb55ce-674f-4be1-be51-4c927810a09d', '237', 'Banco Bradesco S.A.', 'BRADESCO', true, true, true),
('bb2d6113-f951-48c8-b036-b9e19a225b0a', '341', 'Banco Itaú Unibanco S.A.', 'ITAU', true, true, true),
('d7630483-07de-4282-9af9-475685f24d6f', '422', 'Banco Safra S.A.', 'SAFRA', true, false, true),
('c3f51292-d819-4a74-bc38-c7e08a364640', '756', 'Banco Cooperativo do Brasil S.A.', 'BANCOOB', true, false, true),
('7ae37b13-5c79-42b1-931b-5480c944a9a4', '748', 'Banco Cooperativo Sicredi S.A.', 'SICREDI', true, false, true),
('be679c5d-e063-4874-be1d-f3cb41b41ad5', '077', 'Banco Inter S.A.', 'INTER', true, false, true),
('0fe96abe-6f50-4e66-b626-7cb819780c1c', '260', 'Nu Pagamentos S.A.', 'NUBANK', true, false, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PARÂMETROS DA FOLHA
-- ============================================================
INSERT INTO public.parametros_folha (id, tipo_parametro, valor, descricao, vigencia_inicio, ativo) VALUES
('8f30b52f-bdcc-4daf-a45a-5015a0de4f3a', 'salario_minimo', 1518.0000, 'Salário mínimo nacional 2025', '2025-01-01', true),
('fb5dc32c-224f-4fe9-a8e4-2a8f69c67033', 'teto_inss', 8157.4100, 'Teto do INSS 2025', '2025-01-01', true),
('6b8ef740-4129-441c-a46c-fcd091594d52', 'deducao_dependente_irrf', 189.5900, 'Dedução por dependente IRRF 2025', '2025-01-01', true),
('f7b00c74-39be-4815-bbdf-4a4193cd0ef0', 'margem_consignavel', 0.3500, 'Margem consignável 35%', '2025-01-01', true),
('33d5f404-7fdd-4613-a5e3-1fe9e4be8b67', 'inss_patronal_aliquota', 0.2000, 'Alíquota patronal INSS 20%', '2025-01-01', true),
('ab4b293c-287e-44a4-b34b-151157710c82', 'rat_aliquota', 0.0200, 'RAT padrão 2%', '2025-01-01', true),
('450dc0c2-5499-4827-b951-a8c0ab49f1b3', 'outras_entidades_aliquota', 0.0580, 'Outras entidades 5.8%', '2025-01-01', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- TABELA INSS 2025
-- ============================================================
INSERT INTO public.tabela_inss (id, faixa_ordem, valor_minimo, valor_maximo, aliquota, descricao, vigencia_inicio) VALUES
('2b537c7f-590c-4d1d-b24e-e1438e54246a', 1, 0.00, 1518.00, 0.0750, 'Faixa 1 - até 1 SM', '2025-01-01'),
('9d74c72e-b6f3-4aff-b493-2ba71ef58f0c', 2, 1518.01, 2793.88, 0.0900, 'Faixa 2', '2025-01-01'),
('641dc990-9ca3-4926-a751-ccf3d6a7aa29', 3, 2793.89, 4190.83, 0.1200, 'Faixa 3', '2025-01-01'),
('f58e0e82-7877-4fce-a383-c3ec55f23aec', 4, 4190.84, 8157.41, 0.1400, 'Faixa 4 - até teto', '2025-01-01')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- TABELA IRRF 2025
-- ============================================================
INSERT INTO public.tabela_irrf (id, faixa_ordem, valor_minimo, valor_maximo, aliquota, parcela_deduzir, descricao, vigencia_inicio) VALUES
('0470a7bb-f281-47d8-85f4-b699b7640e3b', 1, 0.00, 2259.20, 0.0000, 0.00, 'Isento', '2025-01-01'),
('9bbc6122-f4c8-4552-a8bb-53149456af7a', 2, 2259.21, 2826.65, 0.0750, 169.44, '7.5%', '2025-01-01'),
('385903ee-5666-44b1-9d0e-b7a380a5ca69', 3, 2826.66, 3751.05, 0.1500, 381.44, '15%', '2025-01-01'),
('871310e5-1c2d-4aae-af4a-0ead8269b9cb', 4, 3751.06, 4664.68, 0.2250, 662.77, '22.5%', '2025-01-01'),
('eb3ee103-dd81-4f3f-8b6a-256faf81d14a', 5, 4664.69, NULL, 0.2750, 896.00, '27.5%', '2025-01-01')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- CONFIGURAÇÃO DA AUTARQUIA
-- ============================================================
INSERT INTO public.config_autarquia (id, cnpj, razao_social, nome_fantasia, natureza_juridica, regime_tributario, ativo) VALUES
('c2ccaa9e-c760-48bf-9b4e-aff572c9a8c0', '01123456000101', 'Instituto de Desposto, Juventude e Lazer do Estado de Roraima', 'IDJuv', '1104 - Autarquia Estadual', 'Imune', true)
ON CONFLICT (id) DO NOTHING;
```

---

## 📋 PARTE 2: Perfis e Permissões

```sql
-- ============================================================
-- PERFIS DE ACESSO
-- ============================================================
INSERT INTO public.perfis (id, nome, descricao, nivel, nivel_hierarquia, is_sistema, ativo, cor, icone, perfil_pai_id) VALUES
('5d9d6ec5-26e1-4141-94fa-2e2aae1c554d', 'Super Administrador', 'Acesso total ao sistema', 'sistema', 100, true, true, '#dc2626', 'ShieldCheck', NULL),
('33ac041d-88a2-44da-8e63-7bd0d7ff06c7', 'Administrador', 'Administração geral do sistema', 'sistema', 90, true, true, '#ea580c', 'Shield', '5d9d6ec5-26e1-4141-94fa-2e2aae1c554d'),
('f16216ff-fc0c-4826-a9da-223188c39e47', 'Gerente', 'Gestão de módulos específicos', 'organizacional', 50, true, true, '#0891b2', 'Users', '33ac041d-88a2-44da-8e63-7bd0d7ff06c7'),
('9681f45a-a017-403b-882d-870ed18b8bc5', 'Operador', 'Operações do dia a dia', 'operacional', 20, true, true, '#16a34a', 'UserCheck', 'f16216ff-fc0c-4826-a9da-223188c39e47'),
('2b85f24f-bc74-4802-af01-461fd33f3ce0', 'Consulta', 'Apenas visualização', 'operacional', 10, true, true, '#6b7280', 'Eye', NULL)
ON CONFLICT (id) DO NOTHING;

-- Adicionar coluna codigo se não existir
ALTER TABLE public.perfis ADD COLUMN IF NOT EXISTS codigo VARCHAR(50);

-- Atualizar códigos
UPDATE public.perfis SET codigo = 'super_admin' WHERE nome = 'Super Administrador';
UPDATE public.perfis SET codigo = 'admin' WHERE nome = 'Administrador';
UPDATE public.perfis SET codigo = 'gerente' WHERE nome = 'Gerente';
UPDATE public.perfis SET codigo = 'operador' WHERE nome = 'Operador';
UPDATE public.perfis SET codigo = 'consulta' WHERE nome = 'Consulta';

-- ============================================================
-- FUNÇÕES DO SISTEMA
-- ============================================================
INSERT INTO public.funcoes_sistema (id, codigo, nome, modulo, submodulo, tipo_acao, ordem, ativo, funcao_pai_id) VALUES
('5b27402d-404c-4b3d-985a-6e2ecce54349', 'rh', 'Recursos Humanos', 'rh', NULL, 'visualizar', 1, true, NULL),
('0bea3cec-4bb9-42ce-b1b6-eb4b15c36185', 'rh.servidores', 'Servidores', 'rh', 'servidores', 'visualizar', 10, true, '5b27402d-404c-4b3d-985a-6e2ecce54349'),
('25f05cd2-522a-4782-8e97-27749098e5f9', 'rh.servidores.visualizar', 'Visualizar Servidores', 'rh', 'servidores', 'visualizar', 11, true, '0bea3cec-4bb9-42ce-b1b6-eb4b15c36185'),
('20c69304-743d-4900-9032-6644aa2c9d1e', 'rh.servidores.criar', 'Criar Servidor', 'rh', 'servidores', 'criar', 12, true, '0bea3cec-4bb9-42ce-b1b6-eb4b15c36185'),
('41647213-40ea-4ccd-a556-c7b65b0a74fc', 'rh.servidores.editar', 'Editar Servidor', 'rh', 'servidores', 'editar', 13, true, '0bea3cec-4bb9-42ce-b1b6-eb4b15c36185'),
('3cf42a6f-8b8b-4813-a66a-1df930895a9b', 'rh.servidores.excluir', 'Excluir Servidor', 'rh', 'servidores', 'excluir', 14, true, '0bea3cec-4bb9-42ce-b1b6-eb4b15c36185'),
('be29009c-54c9-4c19-95dd-15eb58f107d2', 'governanca', 'Governança', 'governanca', NULL, 'visualizar', 2, true, NULL),
('ed32dc10-0597-4e6e-86ab-f3091388336d', 'governanca.estrutura', 'Estrutura Organizacional', 'governanca', 'estrutura', 'visualizar', 30, true, 'be29009c-54c9-4c19-95dd-15eb58f107d2'),
('8cfe0306-a6ba-4d70-adcf-fa20c004f34b', 'governanca.organograma', 'Organograma', 'governanca', 'organograma', 'visualizar', 31, true, 'be29009c-54c9-4c19-95dd-15eb58f107d2'),
('ac7854f3-5047-457a-88a3-68ca3123dd27', 'admin', 'Administração', 'admin', NULL, 'visualizar', 3, true, NULL),
('2ff8cc3b-bd93-4ef5-9430-2d650a4e1d5c', 'admin.usuarios', 'Usuários', 'admin', 'usuarios', 'visualizar', 40, true, 'ac7854f3-5047-457a-88a3-68ca3123dd27'),
('127d96f5-a538-4389-af25-d42c7f4919d7', 'admin.usuarios.gerenciar', 'Gerenciar Usuários', 'admin', 'usuarios', 'editar', 41, true, '2ff8cc3b-bd93-4ef5-9430-2d650a4e1d5c'),
('7884ac63-5e41-4449-8e56-11f3aad71d33', 'admin.perfis', 'Perfis e Permissões', 'admin', 'perfis', 'visualizar', 50, true, 'ac7854f3-5047-457a-88a3-68ca3123dd27'),
('ff8cfa71-8aa3-4ff3-94bc-61ceb577a79d', 'admin.perfis.gerenciar', 'Gerenciar Perfis', 'admin', 'perfis', 'editar', 51, true, '7884ac63-5e41-4449-8e56-11f3aad71d33'),
('0c312835-da21-4945-912d-55c56eff068d', 'admin.auditoria', 'Auditoria', 'admin', 'auditoria', 'visualizar', 60, true, 'ac7854f3-5047-457a-88a3-68ca3123dd27'),
('6f3a5f0f-38bb-444f-b712-6a5e29e635a2', 'relatorios', 'Relatórios', 'relatorios', NULL, 'visualizar', 4, true, NULL),
('fa930132-0cc6-41a6-8c80-fb4bde552d5e', 'relatorios.exportar', 'Exportar Relatórios', 'relatorios', NULL, 'exportar', 70, true, NULL),
('792fa137-e88c-4f5d-aee5-757f4c0559bb', 'rh.lotacoes', 'Lotações', 'rh', 'lotacoes', 'visualizar', 15, true, '5b27402d-404c-4b3d-985a-6e2ecce54349'),
('12155c5d-d758-4349-b33f-fa217c9e3327', 'rh.lotacoes.gerenciar', 'Gerenciar Lotações', 'rh', 'lotacoes', 'editar', 16, true, '792fa137-e88c-4f5d-aee5-757f4c0559bb'),
('a6fc5dc8-7793-4f2a-9d9f-4e9ec8a8dae7', 'rh.portarias', 'Portarias', 'rh', 'portarias', 'visualizar', 17, true, '5b27402d-404c-4b3d-985a-6e2ecce54349'),
('a6221402-29dc-4094-af3a-7cafd26d6ad6', 'rh.portarias.gerenciar', 'Gerenciar Portarias', 'rh', 'portarias', 'editar', 18, true, 'a6fc5dc8-7793-4f2a-9d9f-4e9ec8a8dae7')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PERFIL_FUNCOES (Super Admin tem todas as permissões)
-- ============================================================
INSERT INTO public.perfil_funcoes (perfil_id, funcao_id, concedido)
SELECT 
  '5d9d6ec5-26e1-4141-94fa-2e2aae1c554d'::uuid,
  id,
  true
FROM public.funcoes_sistema
ON CONFLICT DO NOTHING;
```

---

## 📋 PARTE 3: Rubricas de Folha

```sql
-- ============================================================
-- RUBRICAS
-- ============================================================
INSERT INTO public.rubricas (id, codigo, descricao, tipo, natureza, formula_tipo, ordem_calculo, incide_inss, incide_irrf, incide_13, incide_ferias, incide_fgts, incide_base_consignavel, compoe_liquido, codigo_esocial, ativo, vigencia_inicio) VALUES
('bce68188-462e-4714-a756-72d76fb6a632', 'RUB001', 'VENCIMENTO CARGO COMISSIONADO', 'provento', 'remuneratorio', 'referencia_cargo', 1, true, true, true, true, false, true, true, '1000', true, '2025-01-01'),
('9fbfd6a9-a133-4e1b-aa2d-d9a3068e8363', 'RUB901', 'AUXÍLIO ALIMENTAÇÃO', 'provento', 'indenizatorio', 'valor_fixo', 10, false, false, false, false, false, false, true, '1806', true, '2025-01-01'),
('ca92546b-6576-458b-bcab-fdef370d2b3c', 'RUB902', 'AUXÍLIO TRANSPORTE', 'provento', 'indenizatorio', 'valor_fixo', 11, false, false, false, false, false, false, true, '1810', true, '2025-01-01'),
('dc3a88b6-fb8e-4bdc-a968-18f6e21de3cb', 'RUB903', 'GRATIFICAÇÃO ESPECIAL', 'provento', 'remuneratorio', 'valor_fixo', 20, true, true, true, true, false, true, true, '1002', true, '2025-01-01'),
('7cb4dfe3-d44a-46c3-af52-04b2420b1b0f', 'RUB904', 'DIFERENÇA DE VENCIMENTO (RETROATIVO)', 'provento', 'remuneratorio', 'valor_fixo', 5, true, true, false, false, false, false, true, '1000', true, '2025-01-01'),
('836b7aec-72aa-4b07-9e0e-48dac5b9d8f0', 'RUB905', '13º SALÁRIO - 1ª PARCELA', 'provento', 'remuneratorio', 'percentual_base', 100, false, false, false, false, false, false, true, '5001', true, '2025-01-01'),
('e6453fa5-1c07-48ac-83d3-cca1ea48286f', 'RUB906', '13º SALÁRIO - 2ª PARCELA', 'provento', 'remuneratorio', 'percentual_base', 101, true, true, false, false, false, false, true, '5001', true, '2025-01-01'),
('5721f7ac-7dc9-4f48-9cb9-58e26d9a9e9c', 'RUB101', 'INSS SERVIDOR (RGPS)', 'desconto', 'tributario', 'calculo_especial', 200, false, false, false, false, false, false, true, '9201', true, '2025-01-01'),
('8e3d71b7-c15e-41f7-907a-fb81f5dc5c27', 'RUB102', 'IRRF', 'desconto', 'tributario', 'calculo_especial', 201, false, false, false, false, false, false, true, '9901', true, '2025-01-01'),
('c8a0c7c9-0d3d-4f16-8c77-2e4f3e3e9a5a', 'RUB201', 'PENSÃO ALIMENTÍCIA', 'desconto', 'judicial', 'percentual_base', 300, false, false, false, false, false, false, true, '9230', true, '2025-01-01'),
('4e4d71b7-c15e-41f7-907a-fb81f5dc5c28', 'RUB301', 'CONSIGNAÇÃO EMPRÉSTIMO', 'desconto', 'consignacao', 'valor_fixo', 400, false, false, false, false, false, false, true, '9299', true, '2025-01-01'),
('5e3d71b7-c15e-41f7-907a-fb81f5dc5c29', 'RUB302', 'CONSIGNAÇÃO PLANO SAÚDE', 'desconto', 'consignacao', 'valor_fixo', 401, false, false, false, false, false, false, true, '9299', true, '2025-01-01'),
('6e4d71b7-c15e-41f7-907a-fb81f5dc5c30', 'RUB303', 'CONSIGNAÇÃO SINDICATO', 'desconto', 'consignacao', 'valor_fixo', 402, false, false, false, false, false, false, true, '9299', true, '2025-01-01'),
('7e5d71b7-c15e-41f7-907a-fb81f5dc5c31', 'RUB304', 'CONSIGNAÇÃO ASSOCIAÇÃO', 'desconto', 'consignacao', 'valor_fixo', 403, false, false, false, false, false, false, true, '9299', true, '2025-01-01')
ON CONFLICT (id) DO NOTHING;
```

---

## 📋 PARTE 4: Cargos

```sql
-- ============================================================
-- CARGOS COMISSIONADOS (Lei 2.301/2025)
-- ============================================================
INSERT INTO public.cargos (id, nome, sigla, categoria, natureza, vencimento_base, quantidade_vagas, nivel_hierarquico, lei_criacao_numero, lei_criacao_data, lei_criacao_artigo, ativo) VALUES
('fd5c4a47-d89e-41b0-9e3a-0c979651bb93', 'Presidente', 'SUBSÍDIO', 'comissionado', 'comissionado', 29211.00, 1, 1, '2.301', '2025-12-29', 'Art. 8º e Anexo I', true),
('4f34aae3-8838-4252-96b2-954b6f12817b', 'Diretor', 'SUBSÍDIO', 'comissionado', 'comissionado', 24829.00, 3, 1, '2.301', '2025-12-29', 'Art. 8º e Anexo I', true),
('528c6b92-f1f3-4e36-9c87-ed703717cac6', 'Assessor Jurídico', 'CNETS-I', 'comissionado', 'comissionado', 8987.17, 1, 1, '2.301', '2025-12-29', 'Art. 8º e Anexo I', true),
('f248ab98-1485-49f2-97d0-7c167b82a169', 'Assessor Especial', 'CNETS-I', 'comissionado', 'comissionado', 8987.17, 2, 1, '2.301', '2025-12-29', 'Art. 8º e Anexo I', true),
('3c353a0d-be46-40fd-ba04-f2b314c6b5ca', 'Chefe de Controle Interno', 'CNES-II', 'comissionado', 'comissionado', 6719.37, 1, 1, '2.301', '2025-12-29', 'Art. 8º e Anexo I', true),
('3f6ff4e0-8d4e-49c2-81d1-cae7bac8654c', 'Assessor de Comunicação', 'CNES-II', 'comissionado', 'comissionado', 6719.37, 1, 1, '2.301', '2025-12-29', 'Art. 8º e Anexo I', true),
('fdee7935-7f76-4fab-8894-6ba0dc42fd9f', 'Agente de Contratação', 'CNES-II', 'comissionado', 'comissionado', 6719.37, 1, 1, '2.301', '2025-12-29', 'Art. 8º e Anexo I', true),
('65ffb472-8464-4507-b256-2cc3537af38d', 'Chefe de Gabinete', 'CNES-III', 'comissionado', 'comissionado', 5392.29, 1, 1, '2.301', '2025-12-29', 'Art. 8º e Anexo I', true),
('aea34c7e-f6a5-4909-9659-d1f4c681ffb8', 'Chefe de Divisão', 'CNES-III', 'comissionado', 'comissionado', 5392.29, 10, 1, '2.301', '2025-12-29', 'Art. 8º e Anexo I', true),
('eb20899f-8d49-46d5-bad5-f558c0a59541', 'Pregoeiro', 'CNES-III', 'comissionado', 'comissionado', 5392.29, 1, 1, '2.301', '2025-12-29', 'Art. 8º e Anexo I', true),
('a6b20899-8d49-46d5-bad5-f558c0a59541', 'Assistente Técnico', 'CNES-III', 'comissionado', 'comissionado', 5392.29, 6, 1, '2.301', '2025-12-29', 'Art. 8º e Anexo I', true),
('22521b93-7e5d-4c50-bc92-7ea064c4fd11', 'Membro da Comissão de Contratação', 'CNES-IV', 'comissionado', 'comissionado', 4199.61, 3, 1, '2.301', '2025-12-29', 'Art. 8º e Anexo I', true),
('9a22a727-eb7e-4a02-993e-0f6534d21b3d', 'Secretária da Presidência', 'CDS-I', 'comissionado', 'comissionado', 3359.69, 2, 1, '2.301', '2025-12-29', 'Art. 8º e Anexo I', true),
('96663c38-67ee-47d3-a3bd-ca00bf7a01b4', 'Chefe de Núcleo', 'CDS-I', 'comissionado', 'comissionado', 3359.69, 22, 1, '2.301', '2025-12-29', 'Art. 8º e Anexo I', true),
('98881a89-12b7-4a75-9790-bf41ff8e5e93', 'Secretária de Diretoria', 'CDS-II', 'comissionado', 'comissionado', 2696.16, 3, 1, '2.301', '2025-12-29', 'Art. 8º e Anexo I', true),
('324541ed-e2a1-4dea-8467-0eb074707367', 'Chefe de Unidade Local', 'CDS-II', 'comissionado', 'comissionado', 2696.16, 40, 1, '2.301', '2025-12-29', 'Art. 8º e Anexo I', true)
ON CONFLICT (id) DO NOTHING;
```

---

## ⚠️ DADOS VOLUMOSOS

Para tabelas com muitos registros (servidores, lotacoes, provimentos, fichas_financeiras, etc.), você precisará solicitar ao Lovable que gere os INSERTs específicos ou use a API do frontend para exportar.

### Contagens atuais:
- `servidores`: 82 registros
- `lotacoes`: 83 registros
- `provimentos`: 82 registros
- `historico_funcional`: 83 registros
- `fichas_financeiras`: 82 registros
- `pre_cadastros`: 87 registros
- `estrutura_organizacional`: 43 registros
- `unidades_locais`: 32 registros

**Para exportar essas tabelas, solicite:**
> "Gere os INSERTs SQL para a tabela `servidores`"

---

## 🔐 Configurar Usuário Admin

Após migrar os dados, crie seu usuário admin:

```sql
-- Associar usuário existente ao perfil Super Admin
INSERT INTO public.usuario_perfis (user_id, perfil_id, ativo, data_inicio)
SELECT 
  p.id,
  (SELECT id FROM public.perfis WHERE codigo = 'super_admin'),
  true,
  CURRENT_DATE
FROM public.profiles p
WHERE p.email = 'SEU_EMAIL_AQUI@gmail.com'
ON CONFLICT DO NOTHING;
```

---

## ✅ Verificação Final

Execute estas queries para verificar a migração:

```sql
-- Verificar contagem de registros
SELECT 'perfis' as tabela, COUNT(*) as total FROM public.perfis
UNION ALL SELECT 'funcoes_sistema', COUNT(*) FROM public.funcoes_sistema
UNION ALL SELECT 'perfil_funcoes', COUNT(*) FROM public.perfil_funcoes
UNION ALL SELECT 'bancos_cnab', COUNT(*) FROM public.bancos_cnab
UNION ALL SELECT 'rubricas', COUNT(*) FROM public.rubricas
UNION ALL SELECT 'cargos', COUNT(*) FROM public.cargos
ORDER BY tabela;
```

---

## 📊 Ordem de Migração (Importante!)

Devido às foreign keys, migre nesta ordem:

1. **Tabelas Base** (sem FK)
   - `cargos`
   - `perfis`
   - `funcoes_sistema`
   - `bancos_cnab`
   - `rubricas`
   - `parametros_folha`
   - `tabela_inss`
   - `tabela_irrf`

2. **Tabelas com FK simples**
   - `estrutura_organizacional`
   - `perfil_funcoes`
   - `unidades_locais`

3. **Tabelas de Usuários**
   - `auth.users` (via Supabase Auth)
   - `profiles`
   - `usuario_perfis`

4. **Tabelas de RH**
   - `servidores`
   - `lotacoes`
   - `designacoes`
   - `provimentos`
   - `historico_funcional`

5. **Tabelas Financeiras**
   - `folhas_pagamento`
   - `fichas_financeiras`

---

*Documento atualizado em: 26/01/2026*
*Sistema: IDJuv - Instituto de Desporto e Juventude de Roraima*
