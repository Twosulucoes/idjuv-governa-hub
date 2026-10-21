-- Dados FICTÍCIOS para o ambiente de TESTE (nunca a produção).
--
-- Enche um banco montado pelo baseline (supabase/baseline/aplicar.sh) com uma instituição inventada,
-- para testar as telas de todos os módulos: estrutura, cargos, servidores (com provimento, lotação e
-- portaria de nomeação publicada, prontos para a folha), tabelas de INSS/IRRF, rubricas, férias,
-- licenças, viagens, patrimônio, compras, contratos, financeiro, governança, LAI, ASCOM, portal,
-- programas, federações, árbitros, gestores escolares e reuniões.
--
-- Nomes, CPFs (válidos no dígito, mas inventados), CNPJs, e-mails (@exemplo.test) e valores são
-- todos fictícios. Guia: docs/NOVO_BANCO.md §9 (ambiente de teste).
--
-- Uso (como `postgres`, depois do baseline e do bootstrap-admin.sql):
--   psql "$URL" -v confirmo=banco_de_teste -v email='teste@exemplo.test' -f supabase/baseline/dados-teste.sql
--
-- Travas: exige `-v confirmo=banco_de_teste`; recusa banco que já tenha servidor, fornecedor ou bem
-- (a produção tem). `email` (opcional) liga o login de teste ao servidor fictício "Usuário de Teste".
-- Uma transação só: se algo falhar, nada fica gravado.
\set ON_ERROR_STOP on
\if :{?confirmo}
\else
  \set confirmo ''
\endif
\if :{?email}
\else
  \set email ''
\endif

BEGIN;
SELECT set_config('teste.confirmo', :'confirmo', true) AS _ \gset
SELECT set_config('teste.email', :'email', true) AS _ \gset

DO $$
BEGIN
  IF current_setting('teste.confirmo') IS DISTINCT FROM 'banco_de_teste' THEN
    RAISE EXCEPTION 'recusado: rode com -v confirmo=banco_de_teste (e só num banco de TESTE)';
  END IF;
  IF EXISTS (SELECT 1 FROM public.servidores) OR EXISTS (SELECT 1 FROM public.fornecedores)
     OR EXISTS (SELECT 1 FROM public.bens_patrimoniais) THEN
    RAISE EXCEPTION 'recusado: o banco já tem servidores, fornecedores ou bens. Os dados de teste só entram num banco vazio do baseline.';
  END IF;
END $$;

-- CPF com dígitos verificadores válidos a partir de 9 dígitos (só para os dados fictícios)
CREATE FUNCTION pg_temp.cpf(base text) RETURNS text LANGUAGE plpgsql AS $f$
DECLARE s int; d1 int; d2 int; i int;
BEGIN
  s := 0; FOR i IN 1..9 LOOP s := s + substr(base, i, 1)::int * (11 - i); END LOOP;
  d1 := 11 - s % 11; IF d1 >= 10 THEN d1 := 0; END IF;
  s := 0; FOR i IN 1..9 LOOP s := s + substr(base, i, 1)::int * (12 - i); END LOOP;
  s := s + d1 * 2; d2 := 11 - s % 11; IF d2 >= 10 THEN d2 := 0; END IF;
  RETURN base || d1 || d2;
END $f$;

-- ===================================================================== estrutura organizacional
INSERT INTO public.estrutura_organizacional (id, nome, sigla, tipo, nivel, superior_id, ordem, ativo, email) VALUES
  ('a0000000-0000-4000-8000-000000000001', 'Presidência', 'PRES', 'presidencia', 1, NULL, 1, true, 'presidencia@exemplo.test'),
  ('a0000000-0000-4000-8000-000000000002', 'Diretoria Administrativa e Financeira', 'DIRAF', 'diretoria', 2, 'a0000000-0000-4000-8000-000000000001', 2, true, 'diraf@exemplo.test'),
  ('a0000000-0000-4000-8000-000000000003', 'Diretoria de Esporte', 'DIESP', 'diretoria', 2, 'a0000000-0000-4000-8000-000000000001', 3, true, 'diesp@exemplo.test'),
  ('a0000000-0000-4000-8000-000000000004', 'Diretoria de Juventude', 'DIJUV', 'diretoria', 2, 'a0000000-0000-4000-8000-000000000001', 4, true, 'dijuv@exemplo.test'),
  ('a0000000-0000-4000-8000-000000000005', 'Divisão de Recursos Humanos', 'DRH', 'divisao', 3, 'a0000000-0000-4000-8000-000000000002', 5, true, 'rh@exemplo.test'),
  ('a0000000-0000-4000-8000-000000000006', 'Divisão de Finanças', 'DFIN', 'divisao', 3, 'a0000000-0000-4000-8000-000000000002', 6, true, 'financas@exemplo.test'),
  ('a0000000-0000-4000-8000-000000000007', 'Divisão de Patrimônio e Compras', 'DPC', 'divisao', 3, 'a0000000-0000-4000-8000-000000000002', 7, true, 'patrimonio@exemplo.test'),
  ('a0000000-0000-4000-8000-000000000008', 'Assessoria de Comunicação', 'ASCOM', 'assessoria', 2, 'a0000000-0000-4000-8000-000000000001', 8, true, 'ascom@exemplo.test'),
  ('a0000000-0000-4000-8000-000000000009', 'Assessoria Jurídica', 'ASJUR', 'assessoria', 2, 'a0000000-0000-4000-8000-000000000001', 9, true, 'juridico@exemplo.test');

-- ===================================================================== cargos (vencimento vira cargo_vencimentos pelo trigger)
INSERT INTO public.cargos (id, nome, sigla, categoria, natureza, nivel_hierarquico, escolaridade, vencimento_base, quantidade_vagas, ativo) VALUES
  ('b0000000-0000-4000-8000-000000000001', 'Presidente', 'PRES', 'comissionado', 'comissionado', 1, 'Superior', 18000, 1, true),
  ('b0000000-0000-4000-8000-000000000002', 'Diretor', 'DIR', 'comissionado', 'comissionado', 2, 'Superior', 12000, 3, true),
  ('b0000000-0000-4000-8000-000000000003', 'Chefe de Divisão', 'CDIV', 'comissionado', 'comissionado', 3, 'Superior', 7500, 4, true),
  ('b0000000-0000-4000-8000-000000000004', 'Assessor Técnico', 'AST', 'comissionado', 'comissionado', 4, 'Superior', 5200, 6, true),
  ('b0000000-0000-4000-8000-000000000005', 'Analista Administrativo', 'ANA', 'efetivo', 'efetivo', 5, 'Superior', 4800, 8, true),
  ('b0000000-0000-4000-8000-000000000006', 'Assistente Administrativo', 'ASA', 'efetivo', 'efetivo', 6, 'Médio', 2900, 10, true),
  ('b0000000-0000-4000-8000-000000000007', 'Professor de Educação Física', 'PEF', 'efetivo', 'efetivo', 5, 'Superior', 5100, 6, true);

-- ===================================================================== tabelas da folha (valores de exemplo para 2026)
INSERT INTO public.tabela_inss (vigencia_inicio, faixa_ordem, valor_minimo, valor_maximo, aliquota, descricao) VALUES
  ('2026-01-01', 1, 0.00, 1621.00, 0.075, 'Faixa 1 (exemplo)'),
  ('2026-01-01', 2, 1621.01, 2902.84, 0.09, 'Faixa 2 (exemplo)'),
  ('2026-01-01', 3, 2902.85, 4354.27, 0.12, 'Faixa 3 (exemplo)'),
  ('2026-01-01', 4, 4354.28, 8475.55, 0.14, 'Faixa 4 (exemplo)');
INSERT INTO public.tabela_irrf (vigencia_inicio, faixa_ordem, valor_minimo, valor_maximo, aliquota, parcela_deduzir, descricao) VALUES
  ('2026-01-01', 1, 0.00, 2428.80, 0, 0, 'Isento (exemplo)'),
  ('2026-01-01', 2, 2428.81, 2826.65, 0.075, 182.16, 'Faixa 2 (exemplo)'),
  ('2026-01-01', 3, 2826.66, 3751.05, 0.15, 394.16, 'Faixa 3 (exemplo)'),
  ('2026-01-01', 4, 3751.06, 4664.68, 0.225, 675.49, 'Faixa 4 (exemplo)'),
  ('2026-01-01', 5, 4664.69, NULL, 0.275, 908.73, 'Faixa 5 (exemplo)');

INSERT INTO public.parametros_folha (tipo_parametro, valor, vigencia_inicio, descricao) VALUES
  ('deducao_dependente_irrf', 189.59, '2026-01-01', 'Dedução por dependente (exemplo)'),
  ('desconto_simplificado_irrf', 607.20, '2026-01-01', 'Desconto simplificado mensal (exemplo)'),
  ('inss_patronal_aliquota', 0.20, '2026-01-01', 'INSS patronal (exemplo)'),
  ('rat_fap_aliquota', 0.01, '2026-01-01', 'RAT x FAP (exemplo)'),
  ('irrf_reducao_limite_isencao', 5000.00, '2026-01-01', 'Redução do IRRF: isenção até (exemplo)'),
  ('irrf_reducao_maxima', 312.89, '2026-01-01', 'Redução do IRRF: valor máximo (exemplo)'),
  ('irrf_reducao_limite', 7350.00, '2026-01-01', 'Redução do IRRF: limite da faixa (exemplo)'),
  ('irrf_reducao_constante', 978.62, '2026-01-01', 'Redução do IRRF: constante (exemplo)'),
  ('irrf_reducao_coeficiente', 0.133145, '2026-01-01', 'Redução do IRRF: coeficiente (exemplo)');

INSERT INTO public.rubricas (codigo, descricao, tipo, natureza, incide_inss, incide_irrf, formula_tipo, formula_valor, ordem_calculo, vigencia_inicio, ativo) VALUES
  ('T001', 'Gratificação de Representação (teste)', 'provento', 'remuneratorio', true, true, 'percentual_base', 20, 10, '2026-01-01', true),
  ('T002', 'Auxílio Alimentação (teste)', 'provento', 'indenizatorio', false, false, 'valor_fixo', 600, 20, '2026-01-01', true),
  ('T101', 'Consignado Banco Exemplo (teste)', 'desconto', 'informativo', false, false, 'valor_fixo', 350, 110, '2026-01-01', true),
  ('T102', 'Contribuição Sindical (teste)', 'desconto', 'informativo', false, false, 'valor_fixo', 45, 120, '2026-01-01', true);

-- ===================================================================== servidores
CREATE TEMP TABLE _srv (n int, nome text, sexo text, nasc date, cargo int, unidade int, adm date, vinc text, tipo text) ON COMMIT DROP;
INSERT INTO _srv VALUES
  ( 1, 'Usuário de Teste',               'O', '1990-01-15', 4, 5, '2025-02-01', 'comissionado', 'comissionado_idjuv'),
  ( 2, 'Helena Prado Moura',             'F', '1975-03-02', 1, 1, '2023-01-02', 'comissionado', 'comissionado_idjuv'),
  ( 3, 'Ricardo Lemos Bastos',           'M', '1980-07-19', 2, 2, '2023-02-01', 'comissionado', 'comissionado_idjuv'),
  ( 4, 'Patrícia Nogueira Sales',        'F', '1983-11-08', 2, 3, '2023-02-01', 'comissionado', 'comissionado_idjuv'),
  ( 5, 'Bruno Cavalcante Reis',          'M', '1987-05-23', 2, 4, '2024-03-01', 'comissionado', 'comissionado_idjuv'),
  ( 6, 'Fernanda Albuquerque Lins',      'F', '1985-09-14', 3, 5, '2023-04-03', 'comissionado', 'comissionado_idjuv'),
  ( 7, 'Marcos Vinícius Teles',          'M', '1979-12-01', 3, 6, '2023-04-03', 'comissionado', 'comissionado_idjuv'),
  ( 8, 'Juliana Freitas Barros',         'F', '1991-02-27', 3, 7, '2024-01-08', 'comissionado', 'comissionado_idjuv'),
  ( 9, 'André Luiz Medeiros',            'M', '1988-06-30', 5, 5, '2020-03-02', 'efetivo',      'efetivo_idjuv'),
  (10, 'Camila Rocha Antunes',           'F', '1993-10-10', 5, 6, '2021-05-03', 'efetivo',      'efetivo_idjuv'),
  (11, 'Diego Sampaio Furtado',          'M', '1995-04-12', 6, 7, '2022-08-01', 'efetivo',      'efetivo_idjuv'),
  (12, 'Larissa Monteiro Paiva',         'F', '1998-01-05', 6, 2, '2022-08-01', 'efetivo',      'efetivo_idjuv'),
  (13, 'Thiago Barreto Cunha',           'M', '1990-08-21', 7, 3, '2019-02-04', 'efetivo',      'efetivo_idjuv'),
  (14, 'Aline Castro Vieira',            'F', '1992-12-17', 7, 3, '2019-02-04', 'efetivo',      'efetivo_idjuv'),
  (15, 'Gustavo Pereira Lago',           'M', '1986-03-29', 4, 8, '2024-06-03', 'comissionado', 'comissionado_idjuv'),
  (16, 'Renata Duarte Fontes',           'F', '1989-07-07', 4, 4, '2024-06-03', 'comissionado', 'comissionado_idjuv'),
  (17, 'Eduardo Matos Quintela',         'M', '1984-02-11', 4, 9, '2025-01-06', 'comissionado', 'comissionado_idjuv'),
  (18, 'Sofia Ramalho Torres',           'F', '1996-05-19', 6, 5, '2023-09-01', 'efetivo',      'efetivo_idjuv');

INSERT INTO public.servidores (
  id, nome_completo, cpf, rg, rg_orgao_expedidor, rg_uf, data_nascimento, sexo, estado_civil, nacionalidade,
  naturalidade_cidade, naturalidade_uf, nome_mae, email_pessoal, email_institucional, telefone_celular,
  endereco_logradouro, endereco_numero, endereco_bairro, endereco_cidade, endereco_uf, endereco_cep,
  banco_codigo, banco_nome, banco_agencia, banco_conta, banco_tipo_conta,
  vinculo, situacao, tipo_servidor, cargo_atual_id, unidade_atual_id, data_admissao, data_posse, data_exercicio,
  carga_horaria, regime_juridico, escolaridade, ativo, observacoes)
SELECT
  ('c0000000-0000-4000-8000-0000000000' || lpad(n::text, 2, '0'))::uuid,
  nome, pg_temp.cpf(lpad((100000000 + n * 7919)::text, 9, '0')), (900000 + n)::text, 'SSP', 'RR', nasc, sexo,
  CASE WHEN n % 2 = 0 THEN 'casado' ELSE 'solteiro' END, 'Brasileira', 'Boa Vista', 'RR', 'Mãe Fictícia ' || n,
  'servidor' || n || '@exemplo.test', 'servidor' || n || '@inst.exemplo.test', '(95) 90000-' || lpad(n::text, 4, '0'),
  'Rua Fictícia', (100 + n)::text, 'Centro', 'Boa Vista', 'RR', '69300-000',
  '001', 'Banco do Brasil', '1234', (10000 + n)::text || '-' || (n % 10)::text, 'corrente',
  vinc::public.vinculo_funcional, 'ativo', tipo::public.tipo_servidor,
  ('b0000000-0000-4000-8000-00000000000' || cargo)::uuid, ('a0000000-0000-4000-8000-00000000000' || unidade)::uuid,
  adm, adm, adm, 40, CASE WHEN vinc = 'efetivo' THEN 'estatutario' ELSE 'comissionado' END,
  'Superior completo', true, 'Servidor fictício (ambiente de teste)'
FROM _srv;

INSERT INTO public.provimentos (id, servidor_id, cargo_id, unidade_id, status, data_nomeacao, data_posse, data_exercicio)
SELECT ('d0000000-0000-4000-8000-0000000000' || lpad(n::text, 2, '0'))::uuid,
       ('c0000000-0000-4000-8000-0000000000' || lpad(n::text, 2, '0'))::uuid,
       ('b0000000-0000-4000-8000-00000000000' || cargo)::uuid, ('a0000000-0000-4000-8000-00000000000' || unidade)::uuid,
       'ativo', adm, adm, adm
FROM _srv ORDER BY n;

INSERT INTO public.lotacoes (servidor_id, unidade_id, cargo_id, data_inicio, tipo_movimentacao, tipo_lotacao, ativo, ato_tipo, ato_numero, ato_data)
SELECT ('c0000000-0000-4000-8000-0000000000' || lpad(n::text, 2, '0'))::uuid,
       ('a0000000-0000-4000-8000-00000000000' || unidade)::uuid, ('b0000000-0000-4000-8000-00000000000' || cargo)::uuid,
       adm, 'nomeacao', 'lotacao_interna', true, 'portaria', n || '/' || extract(year FROM adm), adm
FROM _srv ORDER BY n;

INSERT INTO public.vinculos_servidor (servidor_id, tipo, origem, cargo_id, unidade_id, data_inicio, ativo, ato_tipo, ato_numero, ato_data, data_posse, data_exercicio)
SELECT ('c0000000-0000-4000-8000-0000000000' || lpad(n::text, 2, '0'))::uuid,
       vinc::public.tipo_vinculo_servidor, 'idjuv', ('b0000000-0000-4000-8000-00000000000' || cargo)::uuid,
       ('a0000000-0000-4000-8000-00000000000' || unidade)::uuid, adm, true, 'portaria', n || '/' || extract(year FROM adm), adm, adm, adm
FROM _srv ORDER BY n;

-- portaria de nomeação publicada: sem ela a folha marca a ficha como inconsistente
INSERT INTO public.documentos (numero, titulo, tipo, status, categoria, data_documento, data_publicacao, servidores_ids, provimento_id, cargo_id, unidade_id, doe_numero, doe_data, processo_sei)
SELECT n || '/' || extract(year FROM adm), 'Nomeação de ' || nome, 'portaria', 'publicado', 'nomeacao', adm, adm,
       ARRAY[('c0000000-0000-4000-8000-0000000000' || lpad(n::text, 2, '0'))::uuid],
       ('d0000000-0000-4000-8000-0000000000' || lpad(n::text, 2, '0'))::uuid,
       ('b0000000-0000-4000-8000-00000000000' || cargo)::uuid, ('a0000000-0000-4000-8000-00000000000' || unidade)::uuid,
       (3000 + n)::text, adm, '00000.000' || lpad(n::text, 3, '0') || '/2026-00'
FROM _srv ORDER BY n;

INSERT INTO public.historico_funcional (servidor_id, tipo, data_evento, cargo_novo_id, unidade_nova_id, portaria_numero, portaria_data, descricao)
SELECT ('c0000000-0000-4000-8000-0000000000' || lpad(n::text, 2, '0'))::uuid, 'nomeacao', adm,
       ('b0000000-0000-4000-8000-00000000000' || cargo)::uuid, ('a0000000-0000-4000-8000-00000000000' || unidade)::uuid,
       n || '/' || extract(year FROM adm), adm, 'Nomeação (dado fictício)'
FROM _srv ORDER BY n;

-- frequência de setembro fechada (outubro fica aberta para testar o lançamento)
INSERT INTO public.frequencia_mensal (servidor_id, mes, ano, dias_trabalhados, dias_falta, horas_trabalhadas, percentual_presenca, fechado, data_fechamento)
SELECT ('c0000000-0000-4000-8000-0000000000' || lpad(n::text, 2, '0'))::uuid, 9, 2026,
       CASE WHEN n = 14 THEN 17 ELSE 22 END, 0, CASE WHEN n = 14 THEN 136 ELSE 176 END, 100, true, timestamptz '2026-10-02 10:00-04'
FROM _srv ORDER BY n;

-- ===================================================================== RH: férias, licenças, viagens
INSERT INTO public.ferias_servidor (servidor_id, periodo_aquisitivo_inicio, periodo_aquisitivo_fim, data_inicio, data_fim, dias_gozados, status, parcela, total_parcelas) VALUES
  ('c0000000-0000-4000-8000-000000000009', '2024-03-02', '2025-03-01', '2026-01-05', '2026-01-24', 20, 'concluida', 1, 2),
  ('c0000000-0000-4000-8000-000000000009', '2024-03-02', '2025-03-01', '2026-07-06', '2026-07-15', 10, 'concluida', 2, 2),
  ('c0000000-0000-4000-8000-000000000010', '2025-05-03', '2026-05-02', '2026-11-03', '2026-12-02', 30, 'programada', 1, 1),
  ('c0000000-0000-4000-8000-000000000013', '2025-02-04', '2026-02-03', '2026-12-14', '2027-01-12', 30, 'programada', 1, 1),
  ('c0000000-0000-4000-8000-000000000011', '2025-08-01', '2026-07-31', '2026-10-13', '2026-10-27', 15, 'em_gozo', 1, 2);

INSERT INTO public.licencas_afastamentos (servidor_id, tipo_afastamento, tipo_licenca, data_inicio, data_fim, dias_afastamento, status, observacoes) VALUES
  ('c0000000-0000-4000-8000-000000000014', 'licenca', 'medica', '2026-09-08', '2026-09-12', 5, 'encerrada', 'Atestado fictício'),
  ('c0000000-0000-4000-8000-000000000012', 'licenca', 'capacitacao', '2026-11-03', '2026-12-02', 30, 'ativa', 'Curso fictício');

INSERT INTO public.viagens_diarias (servidor_id, data_saida, data_retorno, destino_cidade, destino_uf, finalidade, quantidade_diarias, valor_diaria, valor_total, meio_transporte, status, relatorio_apresentado, relatorio_data) VALUES
  ('c0000000-0000-4000-8000-000000000004', '2026-08-10', '2026-08-13', 'Brasília', 'DF', 'Reunião no Ministério do Esporte (fictícia)', 3.5, 380, 1330, 'aéreo', 'concluida', true, '2026-08-17'),
  ('c0000000-0000-4000-8000-000000000013', '2026-11-18', '2026-11-20', 'Manaus', 'AM', 'Jogos regionais (fictício)', 2.5, 320, 800, 'aéreo', 'solicitada', false, NULL);

-- ===================================================================== patrimônio
INSERT INTO public.unidades_locais (id, municipio, tipo_unidade, nome_unidade, endereco_completo, status, capacidade, codigo_unidade, latitude, longitude) VALUES
  ('e0000000-0000-4000-8000-000000000001', 'Boa Vista', 'ginasio', 'Ginásio Exemplo Central', 'Av. Fictícia, 1000, Centro', 'ativa', 3000, 'UL-001', 2.8235, -60.6758),
  ('e0000000-0000-4000-8000-000000000002', 'Boa Vista', 'estadio', 'Estádio Exemplo Municipal', 'Rua do Teste, 50', 'ativa', 8000, 'UL-002', 2.8300, -60.6900),
  ('e0000000-0000-4000-8000-000000000003', 'Rorainópolis', 'quadra', 'Quadra Poliesportiva Exemplo', 'Rua das Quadras, s/n', 'manutencao', 500, 'UL-003', 0.9450, -60.4200),
  ('e0000000-0000-4000-8000-000000000004', 'Boa Vista', 'parque_aquatico', 'Parque Aquático Exemplo', 'Av. das Águas, 200', 'ativa', 400, 'UL-004', 2.8100, -60.7000);

INSERT INTO public.categorias_material (id, codigo, nome, tipo, depreciavel, vida_util_meses, taxa_depreciacao_anual, ativo) VALUES
  ('f0000000-0000-4000-8000-000000000001', 'MOB', 'Mobiliário', 'permanente', true, 120, 10, true),
  ('f0000000-0000-4000-8000-000000000002', 'INF', 'Informática', 'permanente', true, 60, 20, true),
  ('f0000000-0000-4000-8000-000000000003', 'ESP', 'Material Esportivo', 'permanente', true, 60, 20, true),
  ('f0000000-0000-4000-8000-000000000004', 'EXP', 'Material de Expediente', 'consumo', false, NULL, NULL, true);

INSERT INTO public.fornecedores (id, tipo_pessoa, cpf_cnpj, razao_social, nome_fantasia, endereco_cidade, endereco_uf, telefone, email, representante_nome, banco_codigo, agencia, conta, ativo) VALUES
  ('f1000000-0000-4000-8000-000000000001', 'PJ', '11.111.111/0001-91', 'Móveis Exemplo Ltda', 'Móveis Exemplo', 'Boa Vista', 'RR', '(95) 3000-0001', 'contato@moveis.exemplo.test', 'Carlos Fictício', '001', '1111', '11111-1', true),
  ('f1000000-0000-4000-8000-000000000002', 'PJ', '22.222.222/0001-91', 'Tecno Exemplo Informática S.A.', 'Tecno Exemplo', 'Manaus', 'AM', '(92) 3000-0002', 'vendas@tecno.exemplo.test', 'Marina Fictícia', '237', '2222', '22222-2', true),
  ('f1000000-0000-4000-8000-000000000003', 'PJ', '33.333.333/0001-91', 'Esporte Total Exemplo ME', 'Esporte Total', 'Boa Vista', 'RR', '(95) 3000-0003', 'loja@esporte.exemplo.test', 'Paulo Fictício', '104', '3333', '33333-3', true),
  ('f1000000-0000-4000-8000-000000000004', 'PJ', '44.444.444/0001-91', 'Limpa Bem Serviços Exemplo Ltda', 'Limpa Bem', 'Boa Vista', 'RR', '(95) 3000-0004', 'adm@limpabem.exemplo.test', 'Joana Fictícia', '001', '4444', '44444-4', true),
  ('f1000000-0000-4000-8000-000000000005', 'PF', pg_temp.cpf('555555551'), 'José Consultor Fictício', NULL, 'Boa Vista', 'RR', '(95) 99999-0005', 'jose@exemplo.test', NULL, '001', '5555', '55555-5', true);

INSERT INTO public.bens_patrimoniais (numero_patrimonio, descricao, marca, modelo, data_aquisicao, valor_aquisicao, nota_fiscal, fornecedor_id,
  unidade_id, unidade_local_id, responsavel_id, estado_conservacao, situacao, categoria_bem, forma_aquisicao, estado_conservacao_inventario, vida_util_anos, sala)
SELECT 'TESTE-' || lpad(g::text, 4, '0'),
       (ARRAY['Mesa de escritório', 'Cadeira giratória', 'Notebook', 'Monitor 24"', 'Impressora multifuncional', 'Bola oficial de futsal', 'Rede de vôlei', 'Armário de aço'])[1 + g % 8],
       (ARRAY['Marca A', 'Marca B', 'Marca C'])[1 + g % 3], 'Modelo ' || g, date '2024-01-10' + (g * 9),
       (ARRAY[850, 620, 4500, 1100, 2300, 180, 400, 1300])[1 + g % 8], 'NF ' || (5000 + g),
       (ARRAY['f1000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000002', 'f1000000-0000-4000-8000-000000000003'])[1 + g % 3]::uuid,
       ('a0000000-0000-4000-8000-00000000000' || (1 + g % 9))::uuid,
       CASE WHEN g % 8 IN (5, 6) THEN ('e0000000-0000-4000-8000-00000000000' || (1 + g % 4))::uuid END,
       ('c0000000-0000-4000-8000-0000000000' || lpad((1 + g % 18)::text, 2, '0'))::uuid,
       (ARRAY['otimo', 'bom', 'regular', 'ruim'])[1 + g % 4], CASE WHEN g = 30 THEN 'em_manutencao' ELSE 'ativo' END,
       (ARRAY['mobiliario', 'mobiliario', 'informatica', 'informatica', 'informatica', 'equipamento_esportivo', 'equipamento_esportivo', 'mobiliario'])[1 + g % 8]::public.categoria_bem,
       'compra', (ARRAY['novo', 'bom', 'regular', 'ruim'])[1 + g % 4]::public.estado_conservacao_inventario, 10, 'Sala ' || (1 + g % 12)
FROM generate_series(1, 40) g;

INSERT INTO public.itens_material (id, categoria_id, codigo, descricao, unidade_medida, estoque_minimo, valor_unitario_medio, ativo) VALUES
  ('f2000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000004', 'EXP-001', 'Papel A4 (resma)', 'resma', 20, 28.50, true),
  ('f2000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000004', 'EXP-002', 'Caneta esferográfica azul', 'unidade', 100, 1.20, true),
  ('f2000000-0000-4000-8000-000000000003', 'f0000000-0000-4000-8000-000000000004', 'EXP-003', 'Toner para impressora', 'unidade', 5, 320.00, true);
INSERT INTO public.almoxarifados (id, codigo, nome, unidade_id, ativo) VALUES
  ('f3000000-0000-4000-8000-000000000001', 'ALM-01', 'Almoxarifado Central', 'a0000000-0000-4000-8000-000000000007', true);
INSERT INTO public.estoque (item_id, almoxarifado_id, quantidade, valor_total) VALUES
  ('f2000000-0000-4000-8000-000000000001', 'f3000000-0000-4000-8000-000000000001', 45, 1282.50),
  ('f2000000-0000-4000-8000-000000000002', 'f3000000-0000-4000-8000-000000000001', 300, 360.00),
  ('f2000000-0000-4000-8000-000000000003', 'f3000000-0000-4000-8000-000000000001', 3, 960.00);

-- ===================================================================== compras e contratos
INSERT INTO public.processos_licitatorios (id, numero_processo, ano, modalidade, objeto, objeto_resumido, valor_estimado, data_abertura, fase_atual, unidade_requisitante_id, servidor_responsavel_id, fonte_recurso) VALUES
  ('f4000000-0000-4000-8000-000000000001', 'PE 001/2026', 2026, 'pregao_eletronico', 'Aquisição de mobiliário para a sede (fictício)', 'Mobiliário', 120000, '2026-02-10', 'encerrado', 'a0000000-0000-4000-8000-000000000007', 'c0000000-0000-4000-8000-000000000008', '100'),
  ('f4000000-0000-4000-8000-000000000002', 'PE 002/2026', 2026, 'pregao_eletronico', 'Aquisição de material esportivo (fictício)', 'Material esportivo', 85000, '2026-06-01', 'julgamento', 'a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000008', '100'),
  ('f4000000-0000-4000-8000-000000000003', 'DL 010/2026', 2026, 'dispensa', 'Serviço de limpeza do ginásio (fictício)', 'Limpeza', 48000, '2026-03-05', 'contratacao', 'a0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000008', '100');

INSERT INTO public.contratos (id, numero_contrato, ano, processo_licitatorio_id, fornecedor_id, objeto, objeto_resumido, valor_inicial, valor_atual, valor_executado, saldo_contrato, data_assinatura, data_inicio, data_fim, status, gestor_id, fiscal_id, fonte_recurso) VALUES
  ('f5000000-0000-4000-8000-000000000001', '001/2026', 2026, 'f4000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001', 'Fornecimento de mobiliário (fictício)', 'Mobiliário', 112000, 112000, 56000, 56000, '2026-03-20', '2026-03-20', '2027-03-19', 'vigente', 'c0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000011', '100'),
  ('f5000000-0000-4000-8000-000000000002', '002/2026', 2026, 'f4000000-0000-4000-8000-000000000003', 'f1000000-0000-4000-8000-000000000004', 'Limpeza e conservação do ginásio (fictício)', 'Limpeza', 48000, 48000, 28000, 20000, '2026-04-01', '2026-04-01', '2026-11-30', 'vigente', 'c0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000012', '100'),
  ('f5000000-0000-4000-8000-000000000003', '015/2025', 2025, NULL, 'f1000000-0000-4000-8000-000000000002', 'Manutenção de computadores (fictício)', 'Manutenção TI', 30000, 30000, 30000, 0, '2025-05-02', '2025-05-02', '2026-05-01', 'encerrado', 'c0000000-0000-4000-8000-000000000007', 'c0000000-0000-4000-8000-000000000010', '100');

-- ===================================================================== financeiro (orçamento e despesa)
INSERT INTO public.fin_programas_orcamentarios (id, codigo, nome, objetivo, exercicio, ativo) VALUES
  ('f6000000-0000-4000-8000-000000000001', '0101', 'Gestão Administrativa (exemplo)', 'Manter a instituição', 2026, true),
  ('f6000000-0000-4000-8000-000000000002', '0202', 'Esporte para Todos (exemplo)', 'Fomentar o esporte', 2026, true);
INSERT INTO public.fin_acoes_orcamentarias (id, programa_id, codigo, nome, tipo, ativo) VALUES
  ('f6100000-0000-4000-8000-000000000001', 'f6000000-0000-4000-8000-000000000001', '2001', 'Manutenção da sede (exemplo)', 'atividade', true),
  ('f6100000-0000-4000-8000-000000000002', 'f6000000-0000-4000-8000-000000000002', '2050', 'Jogos escolares (exemplo)', 'atividade', true);

INSERT INTO public.fin_dotacoes (id, exercicio, unidade_orcamentaria_id, programa_id, acao_id, natureza_despesa_id, fonte_recurso_id, codigo_dotacao, valor_inicial, ativo)
SELECT d.id::uuid, 2026, 'a0000000-0000-4000-8000-000000000002', d.prog::uuid, d.acao::uuid,
       (SELECT id FROM public.fin_naturezas_despesa WHERE codigo = d.nat), (SELECT id FROM public.fin_fontes_recurso WHERE codigo = '100'),
       d.cod, d.valor, true
FROM (VALUES
  ('f6200000-0000-4000-8000-000000000001', 'f6000000-0000-4000-8000-000000000001', 'f6100000-0000-4000-8000-000000000001', '3.3.90.30', '0101.2001.339030.100', 150000),
  ('f6200000-0000-4000-8000-000000000002', 'f6000000-0000-4000-8000-000000000001', 'f6100000-0000-4000-8000-000000000001', '3.3.90.39', '0101.2001.339039.100', 300000),
  ('f6200000-0000-4000-8000-000000000003', 'f6000000-0000-4000-8000-000000000002', 'f6100000-0000-4000-8000-000000000002', '4.4.90.52', '0202.2050.449052.100', 250000),
  ('f6200000-0000-4000-8000-000000000004', 'f6000000-0000-4000-8000-000000000002', 'f6100000-0000-4000-8000-000000000002', '3.3.90.14', '0202.2050.339014.100', 60000)
) AS d(id, prog, acao, nat, cod, valor);

INSERT INTO public.fin_solicitacoes (id, numero, exercicio, data_solicitacao, unidade_solicitante_id, servidor_solicitante_id, tipo_despesa, objeto, justificativa, valor_estimado, dotacao_sugerida_id, fornecedor_id, contrato_id, status, prioridade) VALUES
  ('f6300000-0000-4000-8000-000000000001', 'SOL-0001/2026', 2026, '2026-03-21', 'a0000000-0000-4000-8000-000000000007', 'c0000000-0000-4000-8000-000000000008', 'contrato', 'Mobiliário - 1ª parcela (fictício)', 'Execução do contrato 001/2026', 56000, 'f6200000-0000-4000-8000-000000000003', 'f1000000-0000-4000-8000-000000000001', 'f5000000-0000-4000-8000-000000000001', 'executado', 'normal'),
  ('f6300000-0000-4000-8000-000000000002', 'SOL-0002/2026', 2026, '2026-10-01', 'a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000004', 'compra_direta', 'Medalhas para os jogos escolares (fictício)', 'Premiação dos jogos', 9500, 'f6200000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000003', NULL, 'pendente_analise', 'alta'),
  ('f6300000-0000-4000-8000-000000000003', 'SOL-0003/2026', 2026, '2026-10-15', 'a0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000003', 'contrato', 'Limpeza - outubro (fictício)', 'Execução do contrato 002/2026', 6000, 'f6200000-0000-4000-8000-000000000002', 'f1000000-0000-4000-8000-000000000004', 'f5000000-0000-4000-8000-000000000002', 'rascunho', 'normal');

INSERT INTO public.fin_empenhos (numero, exercicio, data_empenho, solicitacao_id, dotacao_id, fornecedor_id, contrato_id, tipo, natureza_despesa_id, fonte_recurso_id, valor_empenhado, objeto, processo_sei, status)
SELECT '2026NE00001', 2026, date '2026-03-25',  'f6300000-0000-4000-8000-000000000001'::uuid, 'f6200000-0000-4000-8000-000000000003'::uuid,
       'f1000000-0000-4000-8000-000000000001'::uuid, 'f5000000-0000-4000-8000-000000000001'::uuid, 'ordinario'::public.tipo_empenho,
       (SELECT id FROM public.fin_naturezas_despesa WHERE codigo = '4.4.90.52'), (SELECT id FROM public.fin_fontes_recurso WHERE codigo = '100'),
       56000::numeric, 'Mobiliário - 1ª parcela (fictício)', '00000.000101/2026-00', 'emitido'::public.status_empenho
UNION ALL
SELECT '2026NE00002', 2026, date '2026-04-02', NULL::uuid, 'f6200000-0000-4000-8000-000000000002',
       'f1000000-0000-4000-8000-000000000004', 'f5000000-0000-4000-8000-000000000002', 'estimativo',
       (SELECT id FROM public.fin_naturezas_despesa WHERE codigo = '3.3.90.39'), (SELECT id FROM public.fin_fontes_recurso WHERE codigo = '100'),
       48000, 'Limpeza do ginásio 2026 (fictício)', '00000.000102/2026-00', 'emitido';

-- ===================================================================== governança e comunicação
INSERT INTO public.riscos_institucionais (codigo, titulo, descricao, causa, consequencia, modulo_afetado, probabilidade_inerente, impacto_inerente, nivel_risco_inerente, responsavel_id, unidade_responsavel_id, status, data_identificacao) VALUES
  ('R-001', 'Atraso no pagamento da folha', 'Folha não fechada no prazo (exemplo)', 'Lançamentos tardios', 'Servidores sem salário', 'rh', 'medio', 'muito_alto', 'alto', 'c0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000005', 'em_tratamento', '2026-02-01'),
  ('R-002', 'Extravio de bens', 'Bens sem localização no inventário (exemplo)', 'Falta de controle', 'Prejuízo ao erário', 'patrimonio', 'alto', 'medio', 'alto', 'c0000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000007', 'identificado', '2026-05-10'),
  ('R-003', 'Contrato vencido sem renovação', 'Serviço contínuo interrompido (exemplo)', 'Falta de acompanhamento', 'Paralisação do serviço', 'contratos', 'baixo', 'alto', 'medio', 'c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000002', 'monitorado', '2026-06-15');

-- solicitacoes_sic fica sem exemplo: o trigger registrar_historico_lai lê NEW.responsavel_id, coluna que a
-- tabela não tem, e recusa todo INSERT (pendência no ROADMAP, backlog)

INSERT INTO public.demandas_ascom (numero_demanda, ano, unidade_solicitante_id, servidor_solicitante_id, nome_responsavel, categoria, tipo, titulo, descricao_detalhada, prazo_entrega, status, prioridade) VALUES
  ('ASCOM-001/2026', 2026, 'a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000004', 'Patrícia Nogueira Sales', 'cobertura_institucional', 'cobertura_fotografica', 'Abertura dos Jogos Escolares (fictício)', 'Cobertura fotográfica da cerimônia', current_date + 10, 'aprovada', 'alta'),
  ('ASCOM-002/2026', 2026, 'a0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000005', 'Bruno Cavalcante Reis', 'criacao_artes', 'arte_redes_sociais', 'Arte do programa Juventude Ativa (fictício)', 'Card para Instagram', current_date + 5, 'enviada', 'normal');

INSERT INTO public.cms_conteudos (titulo, slug, resumo, conteudo, tipo, destino, status, destaque, data_publicacao, autor_nome) VALUES
  ('Jogos Escolares começam na próxima semana', 'teste-jogos-escolares-comecam', 'Notícia fictícia do ambiente de teste.', 'Texto fictício da notícia.', 'noticia', 'portal_noticias', 'publicado', true, now() - interval '2 days', 'ASCOM (teste)'),
  ('Inscrições abertas para escolinhas esportivas', 'teste-inscricoes-escolinhas', 'Notícia fictícia do ambiente de teste.', 'Texto fictício da notícia.', 'noticia', 'portal_noticias', 'publicado', false, now() - interval '6 days', 'ASCOM (teste)'),
  ('Rascunho de comunicado interno', 'teste-rascunho-comunicado', 'Rascunho fictício.', 'Texto em revisão.', 'comunicado', 'institucional', 'rascunho', false, NULL, 'ASCOM (teste)');

-- ===================================================================== programas, federações, árbitros, escolas, reuniões
INSERT INTO public.programas (codigo, nome, descricao, objetivo, publico_alvo, ano_inicio, situacao, unidade_responsavel_id, servidor_responsavel_id, meta_fisica_total, unidade_medida) VALUES
  ('PRG-01', 'Juventude Ativa (exemplo)', 'Programa fictício', 'Ocupar o contraturno com esporte', 'Jovens de 15 a 29 anos', 2026, 'ativo', 'a0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000005', 1200, 'jovens'),
  ('PRG-02', 'Escolinhas Esportivas (exemplo)', 'Programa fictício', 'Iniciação esportiva', 'Crianças de 7 a 14 anos', 2025, 'ativo', 'a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000004', 800, 'alunos');

INSERT INTO public.federacoes_esportivas (nome, sigla, data_criacao, endereco, telefone, email, mandato_inicio, mandato_fim, presidente_nome, presidente_nascimento, presidente_telefone, presidente_email, vice_presidente_nome, vice_presidente_telefone, status, cnpj) VALUES
  ('Federação Exemplo de Futsal', 'FEF', '2001-04-10', 'Rua Fictícia, 10', '(95) 3100-0001', 'futsal@exemplo.test', '2025-01-01', '2028-12-31', 'Presidente Fictício Um', '1970-01-01', '(95) 98100-0001', 'pres.futsal@exemplo.test', 'Vice Fictício Um', '(95) 98100-1001', 'ativo', '55.555.555/0001-91'),
  ('Federação Exemplo de Vôlei', 'FEV', '1998-09-22', 'Rua Fictícia, 20', '(95) 3100-0002', 'volei@exemplo.test', '2024-01-01', '2027-12-31', 'Presidente Fictícia Dois', '1972-02-02', '(95) 98100-0002', 'pres.volei@exemplo.test', 'Vice Fictício Dois', '(95) 98100-1002', 'em_analise', '66.666.666/0001-91');

INSERT INTO public.cadastro_arbitros (nome, sexo, data_nascimento, cpf, email, celular, modalidade, categoria, cidade, uf, status, protocolo) VALUES
  ('Árbitro Fictício Um', 'M', '1985-05-05', pg_temp.cpf('777777771'), 'arbitro1@exemplo.test', '(95) 98200-0001', 'Futsal', 'Estadual', 'Boa Vista', 'RR', 'pendente', 'ARB-TESTE-0001'),
  ('Árbitra Fictícia Dois', 'F', '1990-06-06', pg_temp.cpf('777777772'), 'arbitro2@exemplo.test', '(95) 98200-0002', 'Vôlei', 'Regional', 'Boa Vista', 'RR', 'aprovado', 'ARB-TESTE-0002');

INSERT INTO public.escolas_jer (id, nome, municipio, inep) VALUES
  ('f7000000-0000-4000-8000-000000000001', 'Escola Estadual Exemplo A', 'Boa Vista', '99000001'),
  ('f7000000-0000-4000-8000-000000000002', 'Escola Estadual Exemplo B', 'Caracaraí', '99000002');
INSERT INTO public.gestores_escolares (escola_id, nome, cpf, email, celular, status) VALUES
  ('f7000000-0000-4000-8000-000000000001', 'Gestora Fictícia A', pg_temp.cpf('888888881'), 'gestora.a@exemplo.test', '(95) 98300-0001', 'aguardando'),
  ('f7000000-0000-4000-8000-000000000002', 'Gestor Fictício B', pg_temp.cpf('888888882'), 'gestor.b@exemplo.test', '(95) 98300-0002', 'confirmado');

INSERT INTO public.reunioes (titulo, tipo, status, data_reuniao, hora_inicio, hora_fim, local, pauta, unidade_responsavel_id, organizador_id) VALUES
  ('Reunião de planejamento dos Jogos Escolares (fictícia)', 'reuniao_trabalho', 'agendada', current_date + 7, '09:00', '11:00', 'Sala de reuniões da sede', 'Calendário; logística; comunicação', 'a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000004'),
  ('Reunião de diretoria (fictícia)', 'ordinaria', 'realizada', current_date - 14, '14:00', '16:00', 'Gabinete', 'Balanço do trimestre', 'a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000002');

-- ===================================================================== login de teste ↔ servidor fictício
DO $$
DECLARE
  v_email text := lower(btrim(current_setting('teste.email')));
  v_uid uuid;
BEGIN
  IF v_email = '' THEN
    RAISE NOTICE 'sem -v email: o login de teste não foi ligado ao servidor "Usuário de Teste"';
    RETURN;
  END IF;
  SELECT id INTO v_uid FROM auth.users WHERE lower(email) = v_email;
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'não achei % no Auth: crie o usuário (e rode o bootstrap-admin.sql) antes', v_email;
  END IF;
  UPDATE public.profiles SET servidor_id = 'c0000000-0000-4000-8000-000000000001', full_name = 'Usuário de Teste'
   WHERE id = v_uid;
  UPDATE public.servidores SET user_id = v_uid, email_institucional = v_email
   WHERE id = 'c0000000-0000-4000-8000-000000000001';
END $$;

SELECT 'servidores' AS tabela, count(*) FROM public.servidores
UNION ALL SELECT 'bens_patrimoniais', count(*) FROM public.bens_patrimoniais
UNION ALL SELECT 'contratos', count(*) FROM public.contratos
UNION ALL SELECT 'fin_empenhos', count(*) FROM public.fin_empenhos;

COMMIT;
