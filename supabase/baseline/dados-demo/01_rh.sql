-- Dados FICTÍCIOS de demonstração — RH (pessoal, frequência/ponto, cessões, designações). Só para o banco de
-- TESTE, depois de dados-teste.sql.
-- Guia: docs/NOVO_BANCO.md §9.
--
-- Pessoas, CPFs (válidos no dígito, mas inventados), e-mails (@exemplo.test), telefones, números de ato, de DOE e
-- de processo SEI são inventados. Três servidores novos (dois cedidos ao instituto e uma cedida a outro órgão)
-- entram para que cessões e vínculos tenham exemplo vivo; os 18 do dados-teste.sql não são alterados, exceto pelo
-- que os gatilhos do próprio sistema fazem (vaga do quadro ligada ao provimento atual).
\set ON_ERROR_STOP on
\if :{?confirmo}
\else
  \set confirmo ''
\endif
BEGIN;
SELECT set_config('teste.confirmo', :'confirmo', true) AS _ \gset
DO $$
BEGIN
  IF current_setting('teste.confirmo') IS DISTINCT FROM 'banco_de_teste' THEN
    RAISE EXCEPTION 'recusado: rode com -v confirmo=banco_de_teste (e só num banco de TESTE)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.servidores WHERE id = 'c0000000-0000-4000-8000-000000000001') THEN
    RAISE EXCEPTION 'recusado: rode antes o supabase/baseline/dados-teste.sql';
  END IF;
  IF EXISTS (SELECT 1 FROM public.designacoes) THEN
    RAISE EXCEPTION 'recusado: os dados de demonstração deste módulo já foram carregados';
  END IF;
END $$;
-- quem "faz" as ações (auth.uid() nos triggers de autoria): o login de teste ligado ao servidor fictício
SELECT set_config('request.jwt.claim.sub', coalesce((SELECT id::text FROM public.profiles
  WHERE servidor_id = 'c0000000-0000-4000-8000-000000000001'), ''), true) AS _ \gset
SELECT set_config('request.jwt.claim.role', 'authenticated', true) AS _ \gset

-- login de teste (profiles/auth.users): várias tabelas de ponto guardam o id do login, não o do servidor
CREATE TEMP TABLE _ctx ON COMMIT DROP AS
  SELECT (SELECT id FROM public.profiles WHERE servidor_id = 'c0000000-0000-4000-8000-000000000001') AS uid;

-- id fixo do grupo RH: d1<tabela>0000-0000-4000-8000-<n>
CREATE FUNCTION pg_temp.id(tab text, n int) RETURNS uuid LANGUAGE sql IMMUTABLE AS
  $f$ SELECT ('d1' || tab || '0000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid $f$;
-- servidor do dados-teste.sql pelo número (1 a 18) e unidade/cargo pelo número
CREATE FUNCTION pg_temp.s(n int) RETURNS uuid LANGUAGE sql IMMUTABLE AS
  $f$ SELECT CASE WHEN n <= 18 THEN ('c0000000-0000-4000-8000-0000000000' || lpad(n::text, 2, '0'))::uuid
                  ELSE pg_temp.id('01', n) END $f$;
CREATE FUNCTION pg_temp.u(n int) RETURNS uuid LANGUAGE sql IMMUTABLE AS
  $f$ SELECT ('a0000000-0000-4000-8000-00000000000' || n)::uuid $f$;
CREATE FUNCTION pg_temp.c(n int) RETURNS uuid LANGUAGE sql IMMUTABLE AS
  $f$ SELECT ('b0000000-0000-4000-8000-00000000000' || n)::uuid $f$;
-- instante no fuso de Boa Vista
CREATE FUNCTION pg_temp.bv(d date, h time) RETURNS timestamptz LANGUAGE sql IMMUTABLE AS
  $f$ SELECT (d + h) AT TIME ZONE 'America/Boa_Vista' $f$;

-- CPF com dígitos verificadores válidos a partir de 9 dígitos (cópia do dados-teste.sql)
CREATE FUNCTION pg_temp.cpf(base text) RETURNS text LANGUAGE plpgsql AS $f$
DECLARE s int; d1 int; d2 int; i int;
BEGIN
  s := 0; FOR i IN 1..9 LOOP s := s + substr(base, i, 1)::int * (11 - i); END LOOP;
  d1 := 11 - s % 11; IF d1 >= 10 THEN d1 := 0; END IF;
  s := 0; FOR i IN 1..9 LOOP s := s + substr(base, i, 1)::int * (12 - i); END LOOP;
  s := s + d1 * 2; d2 := 11 - s % 11; IF d2 >= 10 THEN d2 := 0; END IF;
  RETURN base || d1 || d2;
END $f$;

-- ===================================================================== estrutura de cargos
-- vencimento inicial de cada cargo (mesmo valor do cadastro: a folha calcula igual)
INSERT INTO public.cargo_vencimentos (id, cargo_id, valor, vigencia_inicio, origem, registrado_por)
SELECT pg_temp.id('0b', n), pg_temp.c(n), c.vencimento_base, date '2023-01-01', 'inicial', (SELECT uid FROM _ctx)
  FROM generate_series(1, 7) n JOIN public.cargos c ON c.id = pg_temp.c(n);

INSERT INTO public.composicao_cargos (id, unidade_id, cargo_id, quantidade_vagas) VALUES
  (pg_temp.id('0c', 1),  pg_temp.u(1), pg_temp.c(1), 1),
  (pg_temp.id('0c', 2),  pg_temp.u(2), pg_temp.c(2), 1),
  (pg_temp.id('0c', 3),  pg_temp.u(3), pg_temp.c(2), 1),
  (pg_temp.id('0c', 4),  pg_temp.u(4), pg_temp.c(2), 1),
  (pg_temp.id('0c', 5),  pg_temp.u(5), pg_temp.c(3), 1),
  (pg_temp.id('0c', 6),  pg_temp.u(6), pg_temp.c(3), 1),
  (pg_temp.id('0c', 7),  pg_temp.u(7), pg_temp.c(3), 1),
  (pg_temp.id('0c', 8),  pg_temp.u(5), pg_temp.c(5), 3),
  (pg_temp.id('0c', 9),  pg_temp.u(6), pg_temp.c(5), 3),
  (pg_temp.id('0c', 10), pg_temp.u(5), pg_temp.c(6), 3),
  (pg_temp.id('0c', 11), pg_temp.u(7), pg_temp.c(6), 3),
  (pg_temp.id('0c', 12), pg_temp.u(2), pg_temp.c(6), 2),
  (pg_temp.id('0c', 13), pg_temp.u(3), pg_temp.c(7), 6),
  (pg_temp.id('0c', 14), pg_temp.u(8), pg_temp.c(4), 2),
  (pg_temp.id('0c', 15), pg_temp.u(9), pg_temp.c(4), 2),
  (pg_temp.id('0c', 16), pg_temp.u(4), pg_temp.c(4), 2);

INSERT INTO public.cargo_unidade_compatibilidade (id, cargo_id, tipo_unidade, unidade_especifica_id, quantidade_maxima, observacao) VALUES
  (pg_temp.id('0d', 1), pg_temp.c(1), 'presidencia', pg_temp.u(1), 1, 'Dirigente máximo da autarquia (Lei de criação, art. 8º)'),
  (pg_temp.id('0d', 2), pg_temp.c(2), 'diretoria', NULL, 1, 'Um diretor por diretoria'),
  (pg_temp.id('0d', 3), pg_temp.c(3), 'divisao', NULL, 1, 'Chefia de divisão subordinada a diretoria'),
  (pg_temp.id('0d', 4), pg_temp.c(4), 'assessoria', NULL, 3, 'Assessoramento técnico às unidades de assessoria'),
  (pg_temp.id('0d', 5), pg_temp.c(4), 'diretoria', NULL, 2, 'Assessoramento técnico às diretorias finalísticas'),
  (pg_temp.id('0d', 6), pg_temp.c(7), 'diretoria', pg_temp.u(3), 6, 'Professores lotados na Diretoria de Esporte');

INSERT INTO public.agrupamento_unidade_vinculo (id, agrupamento_id, unidade_id, ordem)
SELECT pg_temp.id('0e', row_number() OVER (ORDER BY g.ordem, x.ordem)::int), g.id, pg_temp.u(x.unidade), x.ordem
  FROM (VALUES (1, 1, 1), (1, 8, 2), (1, 9, 3), (2, 2, 1), (2, 5, 2), (2, 6, 3), (2, 7, 4), (3, 3, 1), (4, 4, 1))
       AS x(grupo, unidade, ordem)
  JOIN public.config_agrupamento_unidades g ON g.ordem = x.grupo;

-- quadro de vagas: uma vaga por posto criado em lei (cargos.quantidade_vagas); a extinta mostra o histórico
INSERT INTO public.vagas_cargo (id, codigo, cargo_id, unidade_id, data_criacao, ato_criacao, data_extincao, ato_extincao, observacoes)
SELECT pg_temp.id('0a', row_number() OVER (ORDER BY q.cargo, k)::int),
       q.sigla || '.' || lpad(k::text, 3, '0'), pg_temp.c(q.cargo),
       CASE q.cargo
         WHEN 1 THEN pg_temp.u(1)
         WHEN 2 THEN pg_temp.u(1 + k)                         -- DIRAF, DIESP, DIJUV
         WHEN 3 THEN CASE WHEN k <= 3 THEN pg_temp.u(4 + k) END -- DRH, DFIN, DPC; a 4ª sem unidade
         WHEN 7 THEN pg_temp.u(3)
       END,
       date '2018-12-27', 'Lei Estadual nº 1.297, de 27/12/2018 (anexo de cargos)',
       CASE WHEN q.cargo = 6 AND k = 11 THEN date '2025-06-30' END,
       CASE WHEN q.cargo = 6 AND k = 11 THEN 'Decreto nº 38.412-E, de 30/06/2025' END,
       CASE WHEN q.cargo = 6 AND k = 11 THEN 'Vaga extinta na reorganização do quadro de apoio' END
  FROM (VALUES (1, 'PRES', 1), (2, 'DIR', 3), (3, 'CDIV', 4), (4, 'AST', 6), (5, 'ANA', 8), (6, 'ASA', 11), (7, 'PEF', 6))
       AS q(cargo, sigla, qtd)
  CROSS JOIN LATERAL generate_series(1, q.qtd) k;

-- ocupantes atuais ligados às vagas, como a importação do quadro (rh_importar_quadro_vagas) faria
DO $$
DECLARE p record; v uuid;
BEGIN
  FOR p IN SELECT id, cargo_id, unidade_id, data_nomeacao FROM public.provimentos
            WHERE vaga_id IS NULL AND status IN ('ativo', 'suspenso') ORDER BY data_nomeacao, id LOOP
    SELECT vc.id INTO v FROM public.vagas_cargo vc
     WHERE vc.cargo_id = p.cargo_id AND vc.data_extincao IS NULL
       AND NOT EXISTS (SELECT 1 FROM public.provimentos o WHERE o.vaga_id = vc.id)
     ORDER BY (vc.unidade_id IS NOT DISTINCT FROM p.unidade_id) DESC, (vc.unidade_id IS NULL) DESC, vc.codigo
     LIMIT 1;
    IF v IS NOT NULL THEN
      UPDATE public.provimentos SET vaga_id = v WHERE id = p.id;
    END IF;
  END LOOP;
END $$;

-- ===================================================================== servidores novos (cessões)
INSERT INTO public.servidores (
  id, nome_completo, cpf, rg, rg_orgao_expedidor, rg_uf, data_nascimento, sexo, estado_civil, nacionalidade,
  naturalidade_cidade, naturalidade_uf, nome_mae, email_pessoal, email_institucional, telefone_celular,
  endereco_logradouro, endereco_numero, endereco_bairro, endereco_cidade, endereco_uf, endereco_cep,
  banco_codigo, banco_nome, banco_agencia, banco_conta, banco_tipo_conta,
  vinculo, situacao, tipo_servidor, cargo_atual_id, unidade_atual_id, data_admissao, data_posse, data_exercicio,
  carga_horaria, regime_juridico, escolaridade, formacao_academica, ativo, orgao_origem, funcao_exercida, observacoes)
VALUES
  (pg_temp.s(19), 'Joelma Cardoso Brito', pg_temp.cpf('624815307'), '214587', 'SESP', 'RR', '1984-08-12', 'F', 'casada', 'Brasileira',
   'Boa Vista', 'RR', 'Maria das Graças Cardoso', 'joelma.brito@exemplo.test', NULL, '(95) 99134-2287',
   'Rua Cecília Brasil', '1184', 'São Francisco', 'Boa Vista', 'RR', '69305-090',
   '001', 'Banco do Brasil', '2617', '48213-6', 'corrente',
   'cedido', 'ativo', 'cedido_entrada', NULL, pg_temp.u(3), '2025-03-10', NULL, '2025-03-10',
   40, 'estatutario', 'Superior completo', 'Licenciatura em Educação Física (UFRR)', true,
   'Secretaria de Estado da Educação e Desporto – SEED', 'Apoio técnico aos Jogos Escolares de Roraima', NULL),
  (pg_temp.s(20), 'Raimundo Nonato Sousa Filho', pg_temp.cpf('713590244'), '158902', 'SESP', 'RR', '1978-11-03', 'M', 'casado', 'Brasileira',
   'Caracaraí', 'RR', 'Francisca Sousa de Lima', 'raimundo.sousa@exemplo.test', NULL, '(95) 98117-4430',
   'Av. Glaycon de Paiva', '2350', 'Pricumã', 'Boa Vista', 'RR', '69309-010',
   '104', 'Caixa Econômica Federal', '0821', '00031544-2', 'corrente',
   'cedido', 'ativo', 'cedido_entrada', NULL, pg_temp.u(4), '2025-08-04', NULL, '2025-08-04',
   40, 'estatutario', 'Superior completo', 'Serviço Social (UFRR)', true,
   'Secretaria de Estado do Trabalho e Bem-Estar Social – SETRABES', 'Articulação dos programas de juventude nos municípios', NULL),
  (pg_temp.s(21), 'Mariana Teixeira Lobo', pg_temp.cpf('835207461'), '233019', 'SESP', 'RR', '1992-04-22', 'F', 'solteira', 'Brasileira',
   'Boa Vista', 'RR', 'Rosângela Teixeira Lobo', 'mariana.lobo@exemplo.test', 'mariana.lobo@inst.exemplo.test', '(95) 99172-6058',
   'Av. Ville Roy', '4410', 'Caçari', 'Boa Vista', 'RR', '69307-725',
   '001', 'Banco do Brasil', '3797', '27455-1', 'corrente',
   'efetivo', 'ativo', 'efetivo_idjuv', pg_temp.c(5), pg_temp.u(6), '2021-02-01', '2021-02-01', '2021-02-01',
   40, 'estatutario', 'Superior completo', 'Ciências Contábeis (UFRR)', true, NULL, NULL, NULL);

-- Mariana: efetiva desde 2021 (provimento pega a vaga livre do cargo pelo gatilho), cedida à Casa Civil em abril/2026
INSERT INTO public.provimentos (id, servidor_id, cargo_id, unidade_id, status, data_nomeacao, data_posse, data_exercicio)
VALUES (pg_temp.id('02', 21), pg_temp.s(21), pg_temp.c(5), pg_temp.u(6), 'ativo', '2021-02-01', '2021-02-01', '2021-02-01');
INSERT INTO public.lotacoes (id, servidor_id, unidade_id, cargo_id, data_inicio, tipo_movimentacao, tipo_lotacao, ativo, ato_tipo, ato_numero, ato_data)
VALUES (pg_temp.id('03', 21), pg_temp.s(21), pg_temp.u(6), pg_temp.c(5), '2021-02-01', 'nomeacao', 'lotacao_interna', true, 'portaria', '27/2021', '2021-01-28');
INSERT INTO public.vinculos_servidor (id, servidor_id, tipo, origem, orgao_nome, cargo_id, unidade_id, funcao_exercida, onus, data_inicio, ativo,
  ato_tipo, ato_numero, ato_data, ato_doe_numero, ato_doe_data, data_posse, data_exercicio) VALUES
  (pg_temp.id('04', 19), pg_temp.s(19), 'cedido_entrada', 'estado_rr', 'Secretaria de Estado da Educação e Desporto – SEED', NULL, pg_temp.u(3),
   'Apoio técnico aos Jogos Escolares de Roraima', 'origem', '2025-03-10', true, 'portaria', '1.204/2025-SEED', '2025-03-03', '4871', '2025-03-06', NULL, '2025-03-10'),
  (pg_temp.id('04', 20), pg_temp.s(20), 'cedido_entrada', 'estado_rr', 'Secretaria de Estado do Trabalho e Bem-Estar Social – SETRABES', NULL, pg_temp.u(4),
   'Articulação dos programas de juventude nos municípios', 'origem', '2025-08-04', true, 'portaria', '388/2025-SETRABES', '2025-07-29', '4973', '2025-07-31', NULL, '2025-08-04'),
  (pg_temp.id('04', 21), pg_temp.s(21), 'efetivo', 'idjuv', NULL, pg_temp.c(5), pg_temp.u(6),
   NULL, NULL, '2021-02-01', true, 'portaria', '27/2021', '2021-01-28', '3947', '2021-01-29', '2021-02-01', '2021-02-01');

-- ===================================================================== vínculos funcionais (histórico do tipo de vínculo)
-- histórico primeiro, vínculo atual por último: o gatilho atualizar_tipo_servidor copia o tipo do último inserido
INSERT INTO public.vinculos_funcionais (id, servidor_id, tipo_vinculo, data_inicio, data_fim, ativo, ato_tipo, ato_numero, ato_data,
  ato_doe_numero, ato_doe_data, orgao_origem, onus_origem, orgao_destino, fundamentacao_legal, observacoes) VALUES
  (pg_temp.id('09', 101), pg_temp.s(13), 'efetivo_idjuv', '2019-02-04', '2021-02-28', false, 'portaria', '13/2019', '2019-01-31', '3412', '2019-02-01',
   NULL, true, NULL, 'LC Estadual nº 053/2001', 'Nomeação após aprovação em concurso público (Edital nº 001/2018)'),
  (pg_temp.id('09', 102), pg_temp.s(13), 'cedido_saida', '2021-03-01', '2022-12-31', false, 'portaria', '41/2021', '2021-02-24', '3968', '2021-02-26',
   NULL, true, 'Secretaria Municipal de Esporte e Lazer de Boa Vista', 'LC Estadual nº 053/2001, art. 86', 'Cessão com ônus para o órgão de origem'),
  (pg_temp.id('09', 103), pg_temp.s(21), 'efetivo_idjuv', '2021-02-01', '2026-03-31', false, 'portaria', '27/2021', '2021-01-28', '3947', '2021-01-29',
   NULL, true, NULL, 'LC Estadual nº 053/2001', 'Nomeação após aprovação em concurso público (Edital nº 001/2018)');

INSERT INTO public.vinculos_funcionais (id, servidor_id, tipo_vinculo, data_inicio, ativo, ato_tipo, ato_numero, ato_data, ato_doe_numero, ato_doe_data, fundamentacao_legal)
SELECT pg_temp.id('09', n), pg_temp.s(n), s.tipo_servidor::text::public.tipo_vinculo_funcional,
       CASE WHEN n = 13 THEN date '2023-01-02' ELSE s.data_admissao END, true, 'portaria',
       CASE WHEN n = 13 THEN '2/2023' ELSE n || '/' || extract(year FROM s.data_admissao) END,
       CASE WHEN n = 13 THEN date '2022-12-28' ELSE s.data_admissao END,
       (3000 + n)::text, CASE WHEN n = 13 THEN date '2022-12-29' ELSE s.data_admissao END,
       CASE WHEN s.tipo_servidor = 'efetivo_idjuv' THEN 'LC Estadual nº 053/2001' ELSE 'Lei Estadual nº 1.297/2018 (cargos em comissão)' END
  FROM generate_series(1, 18) n JOIN public.servidores s ON s.id = pg_temp.s(n)
 ORDER BY n;

INSERT INTO public.vinculos_funcionais (id, servidor_id, tipo_vinculo, data_inicio, ativo, ato_tipo, ato_numero, ato_data, ato_doe_numero, ato_doe_data,
  orgao_origem, onus_origem, orgao_destino, fundamentacao_legal, observacoes) VALUES
  (pg_temp.id('09', 19), pg_temp.s(19), 'cedido_entrada', '2025-03-10', true, 'portaria', '1.204/2025-SEED', '2025-03-03', '4871', '2025-03-06',
   'Secretaria de Estado da Educação e Desporto – SEED', true, NULL, 'LC Estadual nº 053/2001, art. 86', 'Professora efetiva da rede estadual cedida até 31/12/2026'),
  (pg_temp.id('09', 20), pg_temp.s(20), 'cedido_entrada', '2025-08-04', true, 'portaria', '388/2025-SETRABES', '2025-07-29', '4973', '2025-07-31',
   'Secretaria de Estado do Trabalho e Bem-Estar Social – SETRABES', true, NULL, 'LC Estadual nº 053/2001, art. 86', 'Assistente social cedido sem prazo determinado'),
  (pg_temp.id('09', 21), pg_temp.s(21), 'cedido_saida', '2026-04-01', true, 'portaria', '96/2026', '2026-03-25', '5124', '2026-03-27',
   NULL, false, 'Casa Civil do Estado de Roraima', 'LC Estadual nº 053/2001, art. 86', 'Cessão com ônus para o órgão cessionário');

-- ===================================================================== cessões
-- histórica (já retornou) e as três vigentes; a saída de Mariana suspende o provimento e encerra a lotação (gatilhos)
INSERT INTO public.cessoes (id, servidor_id, tipo, orgao_origem, cargo_origem, vinculo_origem, orgao_destino, cargo_destino, onus,
  funcao_exercida_idjuv, unidade_idjuv_id, data_inicio, data_fim, data_retorno, ativa, ato_tipo, ato_numero, ato_data, ato_doe_numero, ato_doe_data,
  ato_retorno_numero, ato_retorno_data, observacoes, fundamentacao_legal) VALUES
  (pg_temp.id('07', 1), pg_temp.s(13), 'saida', 'Instituto de Desporto, Juventude e Lazer do Estado de Roraima – IDJuv', 'Professor de Educação Física', 'efetivo',
   'Secretaria Municipal de Esporte e Lazer de Boa Vista', 'Coordenador de Escolinhas Esportivas', 'origem',
   NULL, NULL, '2021-03-01', '2022-12-31', '2023-01-02', false, 'portaria', '41/2021', '2021-02-24', '3968', '2021-02-26',
   '2/2023', '2022-12-28', 'Retornou ao instituto ao fim do convênio com o município.', 'LC Estadual nº 053/2001, art. 86'),
  (pg_temp.id('07', 2), pg_temp.s(19), 'entrada', 'Secretaria de Estado da Educação e Desporto – SEED', 'Professora de Educação Física', 'efetivo',
   'Instituto de Desporto, Juventude e Lazer do Estado de Roraima – IDJuv', NULL, 'origem',
   'Apoio técnico aos Jogos Escolares de Roraima', pg_temp.u(3), '2025-03-10', '2026-12-31', NULL, true, 'portaria', '1.204/2025-SEED', '2025-03-03', '4871', '2025-03-06',
   NULL, NULL, 'Cessão a pedido do IDJuv (Ofício nº 112/2025/PRES/IDJUV) para a temporada dos JER.', 'LC Estadual nº 053/2001, art. 86'),
  (pg_temp.id('07', 3), pg_temp.s(20), 'entrada', 'Secretaria de Estado do Trabalho e Bem-Estar Social – SETRABES', 'Assistente Social', 'efetivo',
   'Instituto de Desporto, Juventude e Lazer do Estado de Roraima – IDJuv', NULL, 'origem',
   'Articulação dos programas de juventude nos municípios', pg_temp.u(4), '2025-08-04', NULL, NULL, true, 'portaria', '388/2025-SETRABES', '2025-07-29', '4973', '2025-07-31',
   NULL, NULL, 'Cessão por prazo indeterminado; renovação anual da manifestação de interesse.', 'LC Estadual nº 053/2001, art. 86'),
  (pg_temp.id('07', 4), pg_temp.s(21), 'saida', 'Instituto de Desporto, Juventude e Lazer do Estado de Roraima – IDJuv', 'Analista Administrativo', 'efetivo',
   'Casa Civil do Estado de Roraima', 'Assessora Técnica de Orçamento', 'destino',
   NULL, NULL, '2026-04-01', '2027-03-31', NULL, true, 'portaria', '96/2026', '2026-03-25', '5124', '2026-03-27',
   NULL, NULL, 'Requisição pelo Ofício nº 245/2026/CASA CIVIL; ônus para o cessionário.', 'LC Estadual nº 053/2001, art. 86');

-- ===================================================================== designações (sentinela do grupo)
INSERT INTO public.designacoes (id, servidor_id, lotacao_id, unidade_origem_id, unidade_destino_id, data_inicio, data_fim, status, aprovado_por,
  data_aprovacao, motivo_rejeicao, ato_tipo, ato_numero, ato_data, ato_doe_numero, ato_doe_data, justificativa, observacao, ativo)
SELECT pg_temp.id('08', d.k), pg_temp.s(d.n),
       (SELECT l.id FROM public.lotacoes l WHERE l.servidor_id = pg_temp.s(d.n) AND l.ativo ORDER BY l.data_inicio DESC LIMIT 1),
       pg_temp.u(d.origem), pg_temp.u(d.destino), d.ini, d.fim, d.status,
       CASE WHEN d.status IN ('aprovada', 'encerrada', 'rejeitada') THEN (SELECT uid FROM _ctx) END,
       d.decisao, d.motivo, CASE WHEN d.ato IS NOT NULL THEN 'portaria' END, d.ato, d.ato_data, d.doe, d.doe_data, d.just, d.obs, true
  FROM (VALUES
    (1, 10, 6, 5, date '2026-08-03', date '2026-12-31', 'aprovada', timestamptz '2026-07-29 10:12-04', NULL::text,
     '186/2026', date '2026-07-30', '5212', date '2026-07-31',
     'Reforço na conferência da folha durante a implantação do novo sistema de gestão de pessoas.', 'Mantém a lotação de origem na DFIN.'),
    (2, 12, 2, 7, date '2026-03-02', date '2026-06-30', 'encerrada', timestamptz '2026-02-25 15:40-04', NULL,
     '58/2026', date '2026-02-26', '5097', date '2026-02-27',
     'Apoio à Comissão de Inventário Patrimonial 2025/2026.', 'Encerrada ao fim do inventário anual (Relatório nº 03/2026/DPC).'),
    (3, 13, 3, 4, date '2026-09-14', NULL, 'aprovada', timestamptz '2026-09-09 09:05-04', NULL,
     '231/2026', date '2026-09-10', '5241', date '2026-09-11',
     'Coordenação das oficinas esportivas do programa Juventude Ativa nos bairros Senador Hélio Campos e Cidade Satélite.', NULL),
    (4, 16, 4, 3, date '2026-07-06', date '2026-08-31', 'rejeitada', timestamptz '2026-07-02 11:30-04',
     'A DIJUV não pode ceder a servidora durante a execução do Juventude Ativa; reapresentar após setembro.',
     NULL, NULL, NULL, NULL, 'Apoio à organização da etapa estadual dos Jogos Escolares de Roraima.', NULL),
    (5, 18, 5, 8, date '2026-11-03', date '2027-01-29', 'pendente', NULL, NULL,
     NULL, NULL, NULL, NULL, 'Cobertura da escala de atendimento da ASCOM durante as férias coletivas da equipe.', 'Aguardando manifestação da Presidência.'),
    (6, 17, 9, 1, date '2026-11-09', NULL, 'pendente', NULL, NULL,
     NULL, NULL, NULL, NULL, 'Assessoramento jurídico direto ao Gabinete na revisão dos regulamentos de fomento ao esporte.', NULL)
  ) AS d(k, n, origem, destino, ini, fim, status, decisao, motivo, ato, ato_data, doe, doe_data, just, obs);

-- ===================================================================== histórico funcional e portarias (novas linhas)
-- os lançamentos da ficha vêm antes das portarias: o gatilho documentos_portaria_ficha liga a portaria publicada ao lançamento
INSERT INTO public.historico_funcional (id, servidor_id, tipo, data_evento, data_vigencia_inicio, data_vigencia_fim, cargo_anterior_id, cargo_novo_id,
  unidade_anterior_id, unidade_nova_id, descricao, fundamentacao_legal, processo_sei) VALUES
  (pg_temp.id('06', 1), pg_temp.s(10), 'designacao', '2026-08-03', '2026-08-03', '2026-12-31', NULL, NULL, pg_temp.u(6), pg_temp.u(5),
   'Designação temporária de Camila Rocha Antunes para a DRH', 'LC Estadual nº 053/2001', '18101.003127/2026-41'),
  (pg_temp.id('06', 2), pg_temp.s(12), 'designacao', '2026-03-02', '2026-03-02', '2026-06-30', NULL, NULL, pg_temp.u(2), pg_temp.u(7),
   'Designação temporária de Larissa Monteiro Paiva para a DPC', 'LC Estadual nº 053/2001', '18101.000884/2026-12'),
  (pg_temp.id('06', 3), pg_temp.s(13), 'designacao', '2026-09-14', '2026-09-14', NULL, NULL, NULL, pg_temp.u(3), pg_temp.u(4),
   'Designação de Thiago Barreto Cunha para a DIJUV', 'LC Estadual nº 053/2001', '18101.003502/2026-77'),
  (pg_temp.id('06', 4), pg_temp.s(13), 'cessao', '2021-03-01', '2021-03-01', '2022-12-31', NULL, NULL, pg_temp.u(3), NULL,
   'Cessão à Secretaria Municipal de Esporte e Lazer de Boa Vista', 'LC Estadual nº 053/2001, art. 86', '18101.000412/2021-09'),
  (pg_temp.id('06', 5), pg_temp.s(13), 'retorno', '2023-01-02', '2023-01-02', NULL, NULL, pg_temp.c(7), NULL, pg_temp.u(3),
   'Retorno da cessão à Prefeitura de Boa Vista', 'LC Estadual nº 053/2001', '18101.000006/2023-50'),
  (pg_temp.id('06', 6), pg_temp.s(21), 'nomeacao', '2021-02-01', '2021-02-01', NULL, NULL, pg_temp.c(5), NULL, pg_temp.u(6),
   'Nomeação em caráter efetivo — Concurso Público Edital nº 001/2018', 'LC Estadual nº 053/2001', '18101.000097/2021-33'),
  (pg_temp.id('06', 7), pg_temp.s(21), 'cessao', '2026-04-01', '2026-04-01', '2027-03-31', NULL, NULL, pg_temp.u(6), NULL,
   'Cessão à Casa Civil do Estado de Roraima, com ônus para o cessionário', 'LC Estadual nº 053/2001, art. 86', '18101.001190/2026-28'),
  (pg_temp.id('06', 8), pg_temp.s(19), 'requisicao', '2025-03-10', '2025-03-10', '2026-12-31', NULL, NULL, NULL, pg_temp.u(3),
   'Início de exercício por cessão da SEED, com ônus para a origem', 'LC Estadual nº 053/2001, art. 86', '18101.000731/2025-64'),
  (pg_temp.id('06', 9), pg_temp.s(20), 'requisicao', '2025-08-04', '2025-08-04', NULL, NULL, NULL, NULL, pg_temp.u(4),
   'Início de exercício por cessão da SETRABES, com ônus para a origem', 'LC Estadual nº 053/2001, art. 86', '18101.002288/2025-15');
-- atos sem portaria do instituto nesta carga (antigos ou do órgão de origem): o número vai direto no lançamento
UPDATE public.historico_funcional h
   SET portaria_numero = x.num, portaria_data = x.dt, diario_oficial_numero = x.doe, diario_oficial_data = x.doe_dt
  FROM (VALUES (4, '41/2021', date '2021-02-24', '3968', date '2021-02-26'),
               (5, '2/2023', date '2022-12-28', '4311', date '2022-12-29'),
               (8, '1.204/2025-SEED', date '2025-03-03', '4871', date '2025-03-06'),
               (9, '388/2025-SETRABES', date '2025-07-29', '4973', date '2025-07-31')) AS x(k, num, dt, doe, doe_dt)
 WHERE h.id = pg_temp.id('06', x.k);

INSERT INTO public.documentos (id, numero, titulo, ementa, tipo, status, categoria, data_documento, data_publicacao, data_vigencia_inicio, data_vigencia_fim,
  servidores_ids, provimento_id, designacao_id, cargo_id, unidade_id, doe_numero, doe_data, processo_sei, assinado_por, data_assinatura) VALUES
  (pg_temp.id('05', 1), '27/2021', 'Nomeação de Mariana Teixeira Lobo', 'Nomeia, em caráter efetivo, Mariana Teixeira Lobo para o cargo de Analista Administrativo.',
   'portaria', 'publicado', 'nomeacao', '2021-01-28', '2021-01-29', '2021-02-01', NULL, ARRAY[pg_temp.s(21)], pg_temp.id('02', 21), NULL,
   pg_temp.c(5), pg_temp.u(6), '3947', '2021-01-29', '18101.000097/2021-33', 'Helena Prado Moura', '2021-01-28'),
  (pg_temp.id('05', 2), '96/2026', 'Cessão de Mariana Teixeira Lobo à Casa Civil', 'Cede a servidora Mariana Teixeira Lobo à Casa Civil do Estado de Roraima, com ônus para o cessionário, de 01/04/2026 a 31/03/2027.',
   'portaria', 'publicado', 'cessao', '2026-03-25', '2026-03-27', '2026-04-01', '2027-03-31', ARRAY[pg_temp.s(21)], NULL, NULL,
   NULL, pg_temp.u(6), '5124', '2026-03-27', '18101.001190/2026-28', 'Helena Prado Moura', '2026-03-25'),
  (pg_temp.id('05', 3), '186/2026', 'Designação de Camila Rocha Antunes', 'Designa Camila Rocha Antunes para exercício temporário na Divisão de Recursos Humanos.',
   'portaria', 'publicado', 'designacao', '2026-07-30', '2026-07-31', '2026-08-03', '2026-12-31', ARRAY[pg_temp.s(10)], NULL, pg_temp.id('08', 1),
   NULL, pg_temp.u(5), '5212', '2026-07-31', '18101.003127/2026-41', 'Helena Prado Moura', '2026-07-30'),
  (pg_temp.id('05', 4), '58/2026', 'Designação de Larissa Monteiro Paiva', 'Designa Larissa Monteiro Paiva para exercício temporário na Divisão de Patrimônio e Compras.',
   'portaria', 'publicado', 'designacao', '2026-02-26', '2026-02-27', '2026-03-02', '2026-06-30', ARRAY[pg_temp.s(12)], NULL, pg_temp.id('08', 2),
   NULL, pg_temp.u(7), '5097', '2026-02-27', '18101.000884/2026-12', 'Helena Prado Moura', '2026-02-26'),
  (pg_temp.id('05', 5), '231/2026', 'Designação de Thiago Barreto Cunha', 'Designa Thiago Barreto Cunha para exercício na Diretoria de Juventude.',
   'portaria', 'publicado', 'designacao', '2026-09-10', '2026-09-11', '2026-09-14', NULL, ARRAY[pg_temp.s(13)], NULL, pg_temp.id('08', 3),
   NULL, pg_temp.u(4), '5241', '2026-09-11', '18101.003502/2026-77', 'Helena Prado Moura', '2026-09-10');

-- portarias da ficha funcional antiga (tela Relatórios de RH › ficha funcional lê portarias_servidor)
INSERT INTO public.portarias_servidor (id, servidor_id, numero, ano, data_publicacao, tipo, assunto, ementa, data_vigencia_inicio, data_vigencia_fim,
  diario_oficial_numero, diario_oficial_data, status, observacoes)
SELECT pg_temp.id('25', n), pg_temp.s(n), n || '/' || extract(year FROM s.data_admissao), extract(year FROM s.data_admissao)::int, s.data_admissao,
       'nomeacao', 'Nomeação de ' || s.nome_completo,
       'Nomeia ' || s.nome_completo || ' para o cargo de ' || c.nome || ', lotado(a) na ' || u.nome || '.',
       s.data_admissao, NULL, (3000 + n)::text, s.data_admissao, 'vigente', NULL
  FROM generate_series(2, 18) n
  JOIN public.servidores s ON s.id = pg_temp.s(n)
  JOIN public.cargos c ON c.id = s.cargo_atual_id
  JOIN public.estrutura_organizacional u ON u.id = s.unidade_atual_id;

INSERT INTO public.portarias_servidor (id, servidor_id, numero, ano, data_publicacao, tipo, assunto, ementa, data_vigencia_inicio, data_vigencia_fim,
  diario_oficial_numero, diario_oficial_data, status, portaria_revogadora_id, observacoes) VALUES
  (pg_temp.id('25', 101), pg_temp.s(9), '312/2025', 2025, '2025-12-04', 'ferias', 'Férias 2026 (1ª parcela)', 'Concede 20 dias de férias a André Luiz Medeiros, de 05/01 a 24/01/2026.', '2026-01-05', '2026-01-24', '5031', '2025-12-04', 'vigente', NULL, NULL),
  (pg_temp.id('25', 102), pg_temp.s(9), '171/2026', 2026, '2026-06-16', 'ferias', 'Férias 2026 (2ª parcela)', 'Concede 10 dias de férias a André Luiz Medeiros, de 06/07 a 15/07/2026.', '2026-07-06', '2026-07-15', '5198', '2026-06-16', 'vigente', NULL, NULL),
  (pg_temp.id('25', 103), pg_temp.s(10), '186/2026', 2026, '2026-07-31', 'designacao', 'Designação para a DRH', 'Designa Camila Rocha Antunes para exercício temporário na Divisão de Recursos Humanos.', '2026-08-03', '2026-12-31', '5212', '2026-07-31', 'vigente', NULL, NULL),
  (pg_temp.id('25', 104), pg_temp.s(12), '58/2026', 2026, '2026-02-27', 'designacao', 'Designação para a DPC', 'Designa Larissa Monteiro Paiva para a Divisão de Patrimônio e Compras.', '2026-03-02', '2026-06-30', '5097', '2026-02-27', 'vigente', NULL, 'Encerrada em 30/06/2026'),
  (pg_temp.id('25', 105), pg_temp.s(13), '41/2021', 2021, '2021-02-26', 'cessao', 'Cessão à SEMEL Boa Vista', 'Cede Thiago Barreto Cunha à Secretaria Municipal de Esporte e Lazer de Boa Vista.', '2021-03-01', '2022-12-31', '3968', '2021-02-26', 'vigente', NULL, NULL),
  (pg_temp.id('25', 106), pg_temp.s(13), '231/2026', 2026, '2026-09-11', 'designacao', 'Designação para a DIJUV', 'Designa Thiago Barreto Cunha para exercício na Diretoria de Juventude.', '2026-09-14', NULL, '5241', '2026-09-11', 'vigente', NULL, NULL),
  (pg_temp.id('25', 107), pg_temp.s(4), '205/2026', 2026, '2026-08-05', 'viagem', 'Viagem a Brasília/DF', 'Autoriza o deslocamento de Patrícia Nogueira Sales a Brasília/DF, de 10 a 13/08/2026, com 3,5 diárias.', '2026-08-10', '2026-08-13', '5217', '2026-08-05', 'vigente', NULL, NULL),
  (pg_temp.id('25', 108), pg_temp.s(12), '262/2026', 2026, '2026-10-06', 'afastamento', 'Licença para capacitação', 'Concede licença para capacitação a Larissa Monteiro Paiva, de 03/11 a 02/12/2026.', '2026-11-03', '2026-12-02', '5259', '2026-10-06', 'vigente', NULL, NULL),
  (pg_temp.id('25', 109), pg_temp.s(15), '133/2026', 2026, '2026-05-12', 'ferias', 'Férias 2026', 'Concede 15 dias de férias a Gustavo Pereira Lago, de 03/08 a 17/08/2026.', '2026-08-03', '2026-08-17', '5171', '2026-05-12', 'vigente', NULL, NULL);
-- a portaria de férias de Gustavo foi tornada sem efeito: o ato revogador entra e a anterior passa a revogada
INSERT INTO public.portarias_servidor (id, servidor_id, numero, ano, data_publicacao, tipo, assunto, ementa, diario_oficial_numero, diario_oficial_data, status)
VALUES (pg_temp.id('25', 110), pg_temp.s(15), '197/2026', 2026, '2026-07-28', 'ferias', 'Torna sem efeito férias 2026',
        'Torna sem efeito a Portaria nº 133/2026, por necessidade do serviço (cobertura dos Jogos Escolares).', '5208', '2026-07-28', 'vigente');
UPDATE public.portarias_servidor SET status = 'revogada', portaria_revogadora_id = pg_temp.id('25', 110) WHERE id = pg_temp.id('25', 109);

-- ===================================================================== nomeação de chefes de unidade local
INSERT INTO public.nomeacoes_chefe_unidade (id, unidade_local_id, servidor_id, cargo, ato_nomeacao_tipo, ato_numero, ato_data_assinatura, ato_data_publicacao,
  ato_doe_numero, ato_doe_data, data_inicio, data_fim, status, observacoes, processo_sei) VALUES
  (pg_temp.id('23', 1), 'e0000000-0000-4000-8000-000000000003', pg_temp.s(16), 'Chefe de Unidade Local', 'portaria', '77/2024', '2024-03-11', '2024-03-13',
   '4602', '2024-03-13', '2024-03-15', '2025-02-28', 'encerrado', 'Encerrada a pedido para assumir funções na DIJUV.', '18101.000655/2024-02'),
  (pg_temp.id('23', 2), 'e0000000-0000-4000-8000-000000000001', pg_temp.s(14), 'Chefe de Unidade Local', 'portaria', '64/2025', '2025-03-03', '2025-03-05',
   '4870', '2025-03-05', '2025-03-05', NULL, 'ativo', NULL, '18101.000702/2025-31'),
  (pg_temp.id('23', 3), 'e0000000-0000-4000-8000-000000000002', pg_temp.s(13), 'Chefe de Unidade Local', 'portaria', '65/2025', '2025-03-03', '2025-03-05',
   '4870', '2025-03-05', '2025-03-05', NULL, 'ativo', NULL, '18101.000703/2025-84'),
  (pg_temp.id('23', 4), 'e0000000-0000-4000-8000-000000000003', pg_temp.s(11), 'Chefe de Unidade Local', 'portaria', '71/2025', '2025-03-10', '2025-03-12',
   '4874', '2025-03-12', '2025-03-12', NULL, 'ativo', 'Responde também pela manutenção da quadra durante a reforma.', '18101.000741/2025-60'),
  (pg_temp.id('23', 5), 'e0000000-0000-4000-8000-000000000004', pg_temp.s(19), 'Chefe de Unidade Local', 'portaria', '248/2026', '2026-09-28', NULL,
   NULL, NULL, '2026-10-01', NULL, 'ativo', 'Portaria assinada; aguardando publicação no DOE.', '18101.003688/2026-19');

-- ===================================================================== etiquetas, ocorrências, adicionais, requerimentos
INSERT INTO public.servidor_tags (id, nome, cor, descricao) VALUES
  (pg_temp.id('27', 1), 'Fiscal de contrato', 'blue', 'Designado por portaria para fiscalizar contrato administrativo'),
  (pg_temp.id('27', 2), 'Comissão de inventário', 'green', 'Membro da Comissão de Inventário Patrimonial 2026'),
  (pg_temp.id('27', 3), 'Agente de contratação', 'purple', 'Agente de contratação / pregoeiro (Lei nº 14.133/2021)'),
  (pg_temp.id('27', 4), 'Brigadista', 'red', 'Brigada de incêndio da sede'),
  (pg_temp.id('27', 5), 'Teletrabalho', 'cyan', 'Regime híbrido ou de teletrabalho autorizado'),
  (pg_temp.id('27', 6), 'Declaração de bens pendente', 'yellow', 'Não entregou a declaração anual de bens e valores');
INSERT INTO public.servidor_tag_vinculos (id, servidor_id, tag_id)
SELECT pg_temp.id('28', row_number() OVER ()::int), pg_temp.s(x.n), pg_temp.id('27', x.t)
  FROM (VALUES (11, 1), (12, 1), (10, 1), (11, 2), (8, 2), (18, 2), (8, 3), (7, 3), (9, 4), (13, 4), (15, 5), (16, 6), (17, 6), (20, 6)) AS x(n, t);

INSERT INTO public.ocorrencias_servidor (id, servidor_id, tipo, data_ocorrencia, descricao) VALUES
  (pg_temp.id('24', 1), pg_temp.s(13), 'elogio', '2026-09-30', 'Elogio da Presidência pela condução da etapa regional dos Jogos Escolares em Caracaraí (Memorando nº 88/2026/PRES).'),
  (pg_temp.id('24', 2), pg_temp.s(11), 'atualizacao_cadastral', '2026-06-15', 'Atualizou endereço e dados bancários no recadastramento anual.'),
  (pg_temp.id('24', 3), pg_temp.s(16), 'pendencia_documental', '2026-07-01', 'Não entregou a declaração anual de bens e valores no prazo do Ofício Circular nº 07/2026/DRH.'),
  (pg_temp.id('24', 4), pg_temp.s(15), 'advertencia_verbal', '2026-04-22', 'Orientado pela chefia sobre o registro do ponto no horário (três atrasos em abril).'),
  (pg_temp.id('24', 5), pg_temp.s(9), 'capacitacao', '2026-05-29', 'Concluiu o curso "Gestão de Pessoas no Setor Público" (40 h) na Escola de Governo de Roraima.'),
  (pg_temp.id('24', 6), pg_temp.s(19), 'apresentacao', '2025-03-10', 'Apresentou-se para exercício na DIESP com o Ofício nº 451/2025/SEED.'),
  (pg_temp.id('24', 7), pg_temp.s(21), 'cessao', '2026-04-01', 'Apresentou-se na Casa Civil; frequência passa a ser atestada pelo órgão cessionário.');

INSERT INTO public.adicionais_tempo_servico (id, servidor_id, tipo, percentual, quantidade, data_base, data_concessao, data_proximo, valor_referencia,
  valor_adicional, ato_numero, ato_data, fundamentacao_legal, observacoes) VALUES
  (pg_temp.id('2a', 1), pg_temp.s(13), 'quinquenio', 5.00, 1, '2019-02-04', '2024-02-04', '2029-02-04', 5100.00, 255.00, '48/2024', '2024-02-20', 'LC Estadual nº 053/2001, art. 66', NULL),
  (pg_temp.id('2a', 2), pg_temp.s(14), 'quinquenio', 5.00, 1, '2019-02-04', '2024-02-04', '2029-02-04', 5100.00, 255.00, '48/2024', '2024-02-20', 'LC Estadual nº 053/2001, art. 66', NULL),
  (pg_temp.id('2a', 3), pg_temp.s(9), 'quinquenio', 5.00, 1, '2020-03-02', '2025-03-02', '2030-03-02', 4800.00, 240.00, '79/2025', '2025-03-14', 'LC Estadual nº 053/2001, art. 66', NULL),
  (pg_temp.id('2a', 4), pg_temp.s(10), 'quinquenio', 5.00, 1, '2021-05-03', '2026-05-03', '2031-05-03', 4800.00, 240.00, '141/2026', '2026-05-19', 'LC Estadual nº 053/2001, art. 66', 'Concedido com efeitos financeiros a partir de 03/05/2026'),
  (pg_temp.id('2a', 5), pg_temp.s(21), 'quinquenio', 5.00, 1, '2021-02-01', '2026-02-01', '2031-02-01', 4800.00, 240.00, '39/2026', '2026-02-12', 'LC Estadual nº 053/2001, art. 66', 'Pago pelo cessionário durante a cessão');

INSERT INTO public.documentos_requerimento_servidor (id, servidor_id, tipo_documento, titulo, descricao, arquivo_assinado_url, data_solicitacao,
  data_upload_assinado, status, observacoes) VALUES
  (pg_temp.id('29', 1), pg_temp.s(10), 'requerimento_ferias', 'Requerimento de férias 2026', 'Férias de 03/11 a 02/12/2026 (período aquisitivo 2025/2026).',
   pg_temp.s(10) || '/' || pg_temp.id('29', 1) || '.pdf', '2026-09-15', timestamptz '2026-09-16 09:20-04', 'analisado', 'Deferido; portaria em elaboração no SEI.'),
  (pg_temp.id('29', 2), pg_temp.s(12), 'requerimento_licenca', 'Requerimento de licença para capacitação', 'Curso de Especialização em Gestão Pública (UERR), 30 dias.',
   pg_temp.s(12) || '/' || pg_temp.id('29', 2) || '.pdf', '2026-09-02', timestamptz '2026-09-03 14:05-04', 'arquivado', 'Licença concedida pela Portaria nº 262/2026.'),
  (pg_temp.id('29', 3), pg_temp.s(16), 'declaracao_bens', 'Declaração de Bens e Valores 2026', 'Entrega anual exigida pela Lei nº 8.429/1992.',
   NULL, '2026-06-02', NULL, 'pendente', 'Cobrada novamente em 01/07/2026.'),
  (pg_temp.id('29', 4), pg_temp.s(19), 'ficha_cadastral', 'Ficha cadastral de servidora cedida', 'Cadastro inicial no IDJuv.',
   pg_temp.s(19) || '/' || pg_temp.id('29', 4) || '.pdf', '2025-03-10', timestamptz '2025-03-11 10:40-04', 'recebido', NULL),
  (pg_temp.id('29', 5), pg_temp.s(20), 'declaracao_acumulacao', 'Declaração de não acumulação de cargos', NULL,
   pg_temp.s(20) || '/' || pg_temp.id('29', 5) || '.pdf', '2025-08-04', timestamptz '2025-08-04 16:12-04', 'recebido', NULL),
  (pg_temp.id('29', 6), pg_temp.s(1), 'requerimento_geral', 'Requerimento de horário especial de estudante', 'Matrícula no curso de Direito (noturno).',
   NULL, '2026-10-20', NULL, 'pendente', NULL);

-- ===================================================================== pré-cadastro de novos servidores
INSERT INTO public.pre_cadastros (id, codigo_acesso, status, nome_completo, data_nascimento, sexo, estado_civil, naturalidade_cidade, naturalidade_uf,
  cpf, rg, rg_orgao_expedidor, rg_uf, email, telefone_celular, endereco_logradouro, endereco_numero, endereco_bairro, endereco_cidade, endereco_uf,
  endereco_cep, escolaridade, formacao_academica, instituicao_ensino, ano_conclusao, nome_mae, raca_cor, banco_nome, banco_codigo, banco_agencia, banco_conta,
  banco_tipo_conta, doc_rg, doc_cpf, doc_comprovante_residencia, doc_titulo_eleitor, doc_diploma, doc_certidao_criminal_estadual, doc_certidao_criminal_federal,
  doc_quitacao_eleitoral, doc_declaracao_acumulacao, doc_declaracao_bens, indicacao, observacoes, data_envio, servidor_id, convertido_em, convertido_por) VALUES
  (pg_temp.id('26', 1), 'PC2026-7F3K9Q', 'rascunho', 'Lucas Gabriel Andrade Melo', '2000-06-18', 'M', 'solteiro', 'Boa Vista', 'RR',
   pg_temp.cpf('451209837'), '298114', 'SESP', 'RR', 'lucas.melo@exemplo.test', '(95) 99158-3302', 'Rua Pedro Rodrigues', '512', 'Liberdade', 'Boa Vista', 'RR',
   '69309-180', 'Superior completo', 'Educação Física', 'Universidade Estadual de Roraima', 2023, 'Cláudia Andrade Melo', 'parda', NULL, NULL, NULL, NULL,
   NULL, true, true, false, false, false, false, false, false, false, false, 'Diretoria de Esporte', NULL, NULL, NULL, NULL, NULL),
  (pg_temp.id('26', 2), 'PC2026-2M8T4W', 'enviado', 'Ana Beatriz Coelho Rabelo', '1995-02-09', 'F', 'casada', 'Mucajaí', 'RR',
   pg_temp.cpf('362074918'), '247719', 'SESP', 'RR', 'ana.rabelo@exemplo.test', '(95) 98140-5523', 'Av. Mário Homem de Melo', '3120', 'Mecejana', 'Boa Vista', 'RR',
   '69304-350', 'Superior completo', 'Administração', 'Universidade Federal de Roraima', 2018, 'Telma Coelho Rabelo', 'branca', 'Banco do Brasil', '001', '2617', '39021-4',
   'corrente', true, true, true, true, true, true, true, true, true, true, 'Divisão de Finanças', 'Indicada para Assessor Técnico da DFIN.', timestamptz '2026-10-14 18:22-04', NULL, NULL, NULL),
  (pg_temp.id('26', 3), 'PC2026-9H1D6R', 'enviado', 'José Wellington Farias Neto', '1989-12-01', 'M', 'casado', 'Boa Vista', 'RR',
   pg_temp.cpf('587316240'), '201556', 'SESP', 'RR', 'wellington.farias@exemplo.test', '(95) 99102-7781', 'Rua Coronel Pinto', '88', 'Centro', 'Boa Vista', 'RR',
   '69301-150', 'Superior completo', 'Jornalismo', 'Universidade Federal de Roraima', 2012, 'Antônia Farias Lima', 'parda', 'Caixa Econômica Federal', '104', '0821', '00045218-7',
   'corrente', true, true, true, true, true, false, false, true, true, false, 'Assessoria de Comunicação', 'Faltam as certidões criminais.', timestamptz '2026-10-19 09:47-04', NULL, NULL, NULL),
  (pg_temp.id('26', 4), 'PC2026-5Q7B2X', 'aprovado', 'Priscila Moraes Gadelha', '1991-08-27', 'F', 'solteira', 'Rorainópolis', 'RR',
   pg_temp.cpf('296481053'), '236602', 'SESP', 'RR', 'priscila.gadelha@exemplo.test', '(95) 99165-2049', 'Rua Jaime Brasil', '1450', 'Aparecida', 'Boa Vista', 'RR',
   '69306-020', 'Superior completo', 'Direito', 'Faculdade Cathedral', 2015, 'Rita Moraes Gadelha', 'parda', 'Banco do Brasil', '001', '3797', '51177-0',
   'corrente', true, true, true, true, true, true, true, true, true, true, 'Assessoria Jurídica', 'Documentação conferida pela DRH em 21/10/2026.', timestamptz '2026-10-08 11:05-04', NULL, NULL, NULL),
  (pg_temp.id('26', 5), 'PC2026-8N4V1L', 'rejeitado', 'Carlos Henrique Batista Rocha', '1986-03-15', 'M', 'divorciado', 'Boa Vista', 'RR',
   pg_temp.cpf('174930562'), '189903', 'SESP', 'RR', 'carlos.rocha@exemplo.test', '(95) 98123-6610', 'Rua São Sebastião', '730', 'Buritis', 'Boa Vista', 'RR',
   '69309-300', 'Médio completo', NULL, NULL, NULL, 'Lúcia Batista Rocha', 'preta', NULL, NULL, NULL, NULL,
   NULL, true, true, true, false, false, false, false, false, false, false, 'Divisão de Patrimônio e Compras', 'Rejeitado: cargo pretendido exige nível superior.', timestamptz '2026-09-22 15:30-04', NULL, NULL, NULL),
  (pg_temp.id('26', 6), 'PC2025-3J6C8M', 'convertido', 'Raimundo Nonato Sousa Filho', '1978-11-03', 'M', 'casado', 'Caracaraí', 'RR',
   pg_temp.cpf('713590244'), '158902', 'SESP', 'RR', 'raimundo.sousa@exemplo.test', '(95) 98117-4430', 'Av. Glaycon de Paiva', '2350', 'Pricumã', 'Boa Vista', 'RR',
   '69309-010', 'Superior completo', 'Serviço Social', 'Universidade Federal de Roraima', 2004, 'Francisca Sousa de Lima', 'pardo', 'Caixa Econômica Federal', '104', '0821', '00031544-2',
   'corrente', true, true, true, true, true, true, true, true, true, true, 'Diretoria de Juventude', 'Cessão da SETRABES.', timestamptz '2025-07-30 10:00-04', pg_temp.s(20),
   timestamptz '2025-08-04 08:30-04', (SELECT uid FROM _ctx));

-- ===================================================================== parâmetros da frequência
INSERT INTO public.regimes_trabalho (id, codigo, nome, descricao, tipo, padrao_escala, dias_trabalho, exige_registro_ponto, exige_assinatura_servidor,
  exige_validacao_chefia, permite_ponto_remoto, exige_localizacao, exige_foto, ativo) VALUES
  (pg_temp.id('10', 1), 'PRESENCIAL', 'Presencial', 'Expediente na sede, de segunda a sexta-feira', 'presencial', NULL, ARRAY[1,2,3,4,5], true, true, true, false, false, false, true),
  (pg_temp.id('10', 2), 'HIBRIDO', 'Híbrido', 'Três dias presenciais e dois em teletrabalho, com plano de trabalho aprovado', 'hibrido', NULL, ARRAY[1,2,3,4,5], true, true, true, true, false, false, true),
  (pg_temp.id('10', 3), 'TELETRABALHO', 'Teletrabalho integral', 'Teletrabalho com metas pactuadas (Decreto estadual de teletrabalho)', 'teletrabalho', NULL, ARRAY[1,2,3,4,5], false, true, true, true, false, false, true),
  (pg_temp.id('10', 4), 'ESCALA_12X36', 'Escala 12x36', 'Equipamentos esportivos com funcionamento noturno e em fins de semana', 'escala', '12x36', ARRAY[0,1,2,3,4,5,6], true, true, true, false, true, false, true),
  (pg_temp.id('10', 5), 'PLANTAO_EVENTOS', 'Plantão de eventos', 'Plantão em competições e eventos oficiais, com compensação em banco de horas', 'plantao', NULL, ARRAY[0,6], true, true, true, false, true, true, false);

INSERT INTO public.config_jornada_padrao (id, nome, descricao, carga_horaria_diaria, carga_horaria_semanal, entrada_manha, saida_manha, entrada_tarde, saida_tarde,
  intervalo_minimo, intervalo_maximo, tolerancia_atraso, tolerancia_saida_antecipada, escopo, unidade_id, cargo_id, servidor_id, ativo, padrao, vigencia_inicio,
  fundamentacao_legal) VALUES
  (pg_temp.id('0f', 1), 'Expediente padrão – 40 horas', 'Das 8h às 12h e das 14h às 18h', 8, 40, '08:00', '12:00', '14:00', '18:00', 60, 120, 10, 10,
   'orgao', NULL, NULL, NULL, true, true, '2026-01-01', 'LC Estadual nº 053/2001, art. 19; Decreto de expediente do Poder Executivo'),
  (pg_temp.id('0f', 2), 'Turno corrido – ASCOM', 'Das 7h30 às 13h30 e cobertura de eventos em escala', 6, 30, '07:30', '13:30', NULL, NULL, 0, 0, 10, 10,
   'unidade', pg_temp.u(8), NULL, NULL, true, false, '2026-01-01', 'Portaria nº 12/2026 (turno corrido da ASCOM)'),
  (pg_temp.id('0f', 3), 'Professores de Educação Física – 30 horas', 'Aulas e treinos nos equipamentos esportivos', 6, 30, '07:00', '11:00', '16:00', '18:00', 60, 300, 15, 10,
   'cargo', NULL, pg_temp.c(7), NULL, true, false, '2026-01-01', 'Lei Estadual nº 1.297/2018, anexo III'),
  (pg_temp.id('0f', 4), 'Horário especial de estudante', 'Saída às 17h para frequência a curso superior, com compensação', 8, 40, '07:00', '12:00', '14:00', '17:00', 60, 120, 10, 0,
   'servidor', NULL, NULL, pg_temp.s(18), true, false, '2026-03-01', 'LC Estadual nº 053/2001, art. 96 (horário especial)');

INSERT INTO public.servidor_regime (id, servidor_id, regime_id, jornada_id, data_inicio, carga_horaria_customizada, observacoes, ativo)
SELECT pg_temp.id('11', n), pg_temp.s(n),
       CASE WHEN n = 15 THEN pg_temp.id('10', 2) ELSE pg_temp.id('10', 1) END,
       CASE WHEN n = 15 THEN pg_temp.id('0f', 2) WHEN n IN (13, 14) THEN pg_temp.id('0f', 3) WHEN n = 18 THEN pg_temp.id('0f', 4)
            ELSE pg_temp.id('0f', 1) END,
       CASE WHEN n = 18 THEN date '2026-03-01' ELSE date '2026-01-01' END,
       CASE WHEN n IN (13, 14) THEN 30 END,
       CASE WHEN n = 15 THEN 'Plano de trabalho híbrido aprovado (Processo SEI 18101.000522/2026-90)' END, true
  FROM generate_series(1, 20) n;

INSERT INTO public.tipos_abono (id, codigo, nome, descricao, conta_como_presenca, exige_documento, exige_aprovacao_chefia, exige_aprovacao_rh, impacto_horas,
  max_horas_dia, max_ocorrencias_mes, tipos_documento_aceitos, ativo, ordem) VALUES
  (pg_temp.id('12', 1), 'ATESTADO', 'Atestado médico', 'Afastamento por até 3 dias com atestado; acima disso, perícia', true, true, true, true, 'neutro', NULL, NULL, ARRAY['atestado'], true, 1),
  (pg_temp.id('12', 2), 'DECLARACAO', 'Declaração de comparecimento', 'Consulta ou exame em horário de expediente', true, true, true, false, 'neutro', 4, 4, ARRAY['declaracao'], true, 2),
  (pg_temp.id('12', 3), 'DOACAO_SANGUE', 'Doação de sangue', 'Um dia por doação comprovada (HEMORAIMA)', true, true, true, false, 'neutro', 8, 1, ARRAY['declaracao'], true, 3),
  (pg_temp.id('12', 4), 'TRE', 'Serviço eleitoral', 'Folga compensatória por convocação da Justiça Eleitoral', true, true, true, true, 'neutro', 8, NULL, ARRAY['declaracao'], true, 4),
  (pg_temp.id('12', 5), 'SERVICO_EXTERNO', 'Serviço externo', 'Atividade fora da sede autorizada pela chefia', true, false, true, false, 'neutro', NULL, NULL, NULL, true, 5),
  (pg_temp.id('12', 6), 'CAPACITACAO', 'Curso ou capacitação', 'Participação em curso de interesse do órgão', true, true, true, false, 'neutro', NULL, NULL, ARRAY['certificado', 'declaracao'], true, 6),
  (pg_temp.id('12', 7), 'COMPENSACAO', 'Compensação de banco de horas', 'Folga com débito no banco de horas', true, false, true, false, 'compensa', 8, NULL, NULL, true, 7),
  (pg_temp.id('12', 8), 'DISPENSA_HORARIO', 'Dispensa de horário', 'Dispensa concedida pela chefia (ponto facultativo parcial)', true, false, true, false, 'neutro', 4, 2, NULL, true, 8),
  (pg_temp.id('12', 9), 'FERIAS', 'Férias', 'Lançado pelo RH a partir da portaria de férias', true, false, false, true, 'neutro', NULL, NULL, NULL, true, 9),
  (pg_temp.id('12', 10), 'LICENCA', 'Licença ou afastamento', 'Lançado pelo RH a partir do ato de licença', true, true, false, true, 'neutro', NULL, NULL, NULL, true, 10),
  (pg_temp.id('12', 11), 'LICENCA_MEDICA', 'Licença para tratamento de saúde', 'Acima de 3 dias, com laudo da perícia oficial', true, true, false, true, 'neutro', NULL, NULL, ARRAY['laudo'], true, 11),
  (pg_temp.id('12', 12), 'FOLGA', 'Folga de escala', 'Folga prevista em escala ou plantão', true, false, true, false, 'neutro', NULL, NULL, NULL, true, 12),
  (pg_temp.id('12', 13), 'ATRASO_JUSTIFICADO', 'Atraso justificado', 'Atraso por motivo alheio à vontade do servidor', true, false, true, false, 'reduz', 2, 3, NULL, false, 13);

INSERT INTO public.config_assinatura_frequencia (id, codigo, nome, assinatura_servidor_obrigatoria, assinatura_chefia_obrigatoria, assinatura_rh_obrigatoria,
  tipo_assinatura, ordem_assinaturas, quem_valida_final, ativo, padrao) VALUES
  (pg_temp.id('13', 1), 'PADRAO', 'Servidor e chefia imediata', true, true, false, 'digital', ARRAY['servidor', 'chefia'], 'chefia', true, true),
  (pg_temp.id('13', 2), 'COM_RH', 'Servidor, chefia e RH (cedidos e designados)', true, true, true, 'ambas', ARRAY['servidor', 'chefia', 'rh'], 'rh', true, false);

INSERT INTO public.config_compensacao (id, codigo, nome, permite_banco_horas, compensacao_automatica, compensacao_manual, prazo_compensar_dias,
  limite_acumulo_horas, limite_horas_extras_dia, limite_horas_extras_mes, quem_autoriza, exibe_na_frequencia, exibe_na_impressao, aplicar_a_todos, ativo, padrao)
VALUES (pg_temp.id('15', 1), 'PADRAO', 'Banco de horas – regra geral', true, false, true, 90, 40, 2, 40, 'chefia', true, true, true, true, true);

-- calendário de fechamento de 2026: até agosto consolidado, setembro na chefia, outubro aberto
INSERT INTO public.config_fechamento_frequencia (id, ano, mes, data_limite_servidor, data_limite_chefia, data_limite_rh, status, fechado_em, fechado_por,
  consolidado_em, consolidado_por)
SELECT pg_temp.id('14', m), 2026, m,
       (make_date(2026, m, 1) + interval '1 month' + interval '2 days')::date,
       (make_date(2026, m, 1) + interval '1 month' + interval '5 days')::date,
       (make_date(2026, m, 1) + interval '1 month' + interval '9 days')::date,
       CASE WHEN m <= 8 THEN 'consolidado' WHEN m = 9 THEN 'fechado_chefia' ELSE 'aberto' END,
       CASE WHEN m <= 9 THEN pg_temp.bv((make_date(2026, m, 1) + interval '1 month' + interval '5 days')::date, '17:00') END,
       CASE WHEN m <= 9 THEN (SELECT uid FROM _ctx) END,
       CASE WHEN m <= 8 THEN pg_temp.bv((make_date(2026, m, 1) + interval '1 month' + interval '9 days')::date, '16:30') END,
       CASE WHEN m <= 8 THEN (SELECT uid FROM _ctx) END
  FROM generate_series(1, 10) m;

INSERT INTO public.feriados (id, data, nome, tipo, recorrente, ativo) VALUES
  (pg_temp.id('16', 1),  '2026-01-01', 'Confraternização Universal', 'nacional', true, true),
  (pg_temp.id('16', 2),  '2026-02-16', 'Carnaval (ponto facultativo)', 'ponto_facultativo', false, true),
  (pg_temp.id('16', 3),  '2026-02-17', 'Carnaval (ponto facultativo)', 'ponto_facultativo', false, true),
  (pg_temp.id('16', 4),  '2026-04-03', 'Sexta-feira Santa', 'nacional', false, true),
  (pg_temp.id('16', 5),  '2026-04-21', 'Tiradentes', 'nacional', true, true),
  (pg_temp.id('16', 6),  '2026-05-01', 'Dia do Trabalho', 'nacional', true, true),
  (pg_temp.id('16', 7),  '2026-06-04', 'Corpus Christi', 'ponto_facultativo', false, true),
  (pg_temp.id('16', 8),  '2026-06-29', 'São Pedro – Padroeiro de Boa Vista', 'municipal', true, true),
  (pg_temp.id('16', 9),  '2026-07-09', 'Aniversário de Boa Vista', 'municipal', true, true),
  (pg_temp.id('16', 10), '2026-09-07', 'Independência do Brasil', 'nacional', true, true),
  (pg_temp.id('16', 11), '2026-10-05', 'Aniversário do Estado de Roraima', 'estadual', true, true),
  (pg_temp.id('16', 12), '2026-10-12', 'Nossa Senhora Aparecida', 'nacional', true, true),
  (pg_temp.id('16', 13), '2026-10-28', 'Dia do Servidor Público (ponto facultativo)', 'ponto_facultativo', false, true),
  (pg_temp.id('16', 14), '2026-11-02', 'Finados', 'nacional', true, true),
  (pg_temp.id('16', 15), '2026-11-15', 'Proclamação da República', 'nacional', true, true),
  (pg_temp.id('16', 16), '2026-11-20', 'Dia Nacional de Zumbi e da Consciência Negra', 'nacional', true, true),
  (pg_temp.id('16', 17), '2026-12-08', 'Nossa Senhora da Conceição', 'municipal', true, true),
  (pg_temp.id('16', 18), '2026-12-25', 'Natal', 'nacional', true, true);

-- ===================================================================== férias, licenças e viagens (novas linhas)
-- nenhuma cobre hoje (23/10/2026): a situação funcional dos servidores do dados-teste.sql continua a mesma
INSERT INTO public.ferias_servidor (id, servidor_id, periodo_aquisitivo_inicio, periodo_aquisitivo_fim, data_inicio, data_fim, dias_gozados, abono_pecuniario,
  dias_abono, parcela, total_parcelas, portaria_numero, portaria_data, status, observacoes) VALUES
  (pg_temp.id('2b', 1),  pg_temp.s(2),  '2025-01-02', '2026-01-01', '2026-01-12', '2026-01-31', 20, false, NULL, 1, 2, '318/2025', '2025-12-10', 'concluida', NULL),
  (pg_temp.id('2b', 2),  pg_temp.s(2),  '2025-01-02', '2026-01-01', '2026-12-14', '2026-12-23', 10, false, NULL, 2, 2, '255/2026', '2026-10-01', 'programada', NULL),
  (pg_temp.id('2b', 3),  pg_temp.s(3),  '2025-02-01', '2026-01-31', '2026-07-01', '2026-07-30', 30, false, NULL, 1, 1, '162/2026', '2026-06-05', 'concluida', NULL),
  (pg_temp.id('2b', 4),  pg_temp.s(4),  '2025-02-01', '2026-01-31', '2026-01-19', '2026-02-17', 30, false, NULL, 1, 1, '9/2026', '2026-01-08', 'concluida', NULL),
  (pg_temp.id('2b', 5),  pg_temp.s(5),  '2025-03-01', '2026-02-28', '2026-08-10', '2026-08-24', 15, false, NULL, 1, 2, '196/2026', '2026-07-24', 'concluida', NULL),
  (pg_temp.id('2b', 6),  pg_temp.s(5),  '2025-03-01', '2026-02-28', '2027-01-11', '2027-01-25', 15, false, NULL, 2, 2, NULL, NULL, 'programada', 'Aguardando portaria'),
  (pg_temp.id('2b', 7),  pg_temp.s(6),  '2025-04-03', '2026-04-02', '2026-06-01', '2026-06-30', 30, false, NULL, 1, 1, '147/2026', '2026-05-20', 'concluida', NULL),
  (pg_temp.id('2b', 8),  pg_temp.s(7),  '2025-04-03', '2026-04-02', '2026-04-06', '2026-04-25', 20, true, 10, 1, 1, '88/2026', '2026-03-24', 'concluida', 'Conversão de 1/3 em abono pecuniário'),
  (pg_temp.id('2b', 9),  pg_temp.s(8),  '2025-01-08', '2026-01-07', '2026-11-16', '2026-11-30', 15, false, NULL, 1, 2, '264/2026', '2026-10-09', 'programada', NULL),
  (pg_temp.id('2b', 10), pg_temp.s(12), '2025-08-01', '2026-07-31', '2026-05-04', '2026-05-18', 8, false, NULL, 1, 2, '121/2026', '2026-04-22', 'interrompida', 'Interrompida em 11/05/2026 por necessidade do serviço (Portaria nº 128/2026); saldo de 7 dias a reprogramar'),
  (pg_temp.id('2b', 11), pg_temp.s(14), '2025-02-04', '2026-02-03', '2026-01-05', '2026-02-03', 30, false, NULL, 1, 1, '5/2026', '2025-12-22', 'concluida', NULL),
  (pg_temp.id('2b', 12), pg_temp.s(15), '2025-06-03', '2026-06-02', '2026-08-03', '2026-08-17', 15, false, NULL, 1, 2, '133/2026', '2026-05-12', 'cancelada', 'Tornada sem efeito pela Portaria nº 197/2026 (cobertura dos Jogos Escolares)'),
  (pg_temp.id('2b', 13), pg_temp.s(16), '2025-06-03', '2026-06-02', '2026-02-09', '2026-02-23', 15, false, NULL, 1, 2, '31/2026', '2026-01-28', 'concluida', NULL),
  (pg_temp.id('2b', 14), pg_temp.s(17), '2025-01-06', '2026-01-05', '2026-12-01', '2026-12-30', 30, false, NULL, 1, 1, NULL, NULL, 'programada', 'Programação aprovada pela chefia; portaria a emitir'),
  (pg_temp.id('2b', 15), pg_temp.s(18), '2024-09-01', '2025-08-31', '2026-03-02', '2026-03-31', 30, false, NULL, 1, 1, '52/2026', '2026-02-18', 'concluida', NULL),
  (pg_temp.id('2b', 16), pg_temp.s(1),  '2025-02-01', '2026-01-31', '2026-12-28', '2027-01-06', 10, false, NULL, 1, 3, NULL, NULL, 'programada', NULL),
  (pg_temp.id('2b', 17), pg_temp.s(20), '2025-08-04', '2026-08-03', '2027-01-04', '2027-02-02', 30, false, NULL, 1, 1, NULL, NULL, 'programada', 'Férias de servidor cedido: comunicar ao órgão de origem');

INSERT INTO public.licencas_afastamentos (id, servidor_id, tipo_afastamento, tipo_licenca, data_inicio, data_fim, dias_afastamento, portaria_numero, portaria_data,
  cid, medico_nome, crm, orgao_destino, onus_origem, status, fundamentacao_legal, observacoes) VALUES
  (pg_temp.id('2c', 1), pg_temp.s(13), 'licenca', 'paternidade', '2026-02-02', '2026-02-21', 20, '35/2026', '2026-02-03', NULL, NULL, NULL, NULL, true, 'encerrada', 'LC Estadual nº 053/2001, art. 133', 'Nascimento do filho em 01/02/2026'),
  (pg_temp.id('2c', 2), pg_temp.s(7),  'licenca', 'luto', '2026-03-09', '2026-03-16', 8, '71/2026', '2026-03-10', NULL, NULL, NULL, NULL, true, 'encerrada', 'LC Estadual nº 053/2001, art. 128', 'Falecimento do pai'),
  (pg_temp.id('2c', 3), pg_temp.s(15), 'licenca', 'casamento', '2026-05-11', '2026-05-18', 8, '130/2026', '2026-05-08', NULL, NULL, NULL, NULL, true, 'encerrada', 'LC Estadual nº 053/2001, art. 128', NULL),
  (pg_temp.id('2c', 4), pg_temp.s(6),  'licenca', 'medica', '2026-08-17', '2026-08-19', 3, NULL, NULL, 'J11', 'Dra. Mônica Albuquerque Sena', 'CRM-RR 1187', NULL, true, 'encerrada', NULL, 'Atestado entregue à DRH'),
  (pg_temp.id('2c', 5), pg_temp.s(10), 'licenca', 'medica', '2026-10-26', '2026-10-30', 5, NULL, NULL, 'M54.5', 'Dr. Fábio Lucena Prado', 'CRM-RR 0954', NULL, true, 'ativa', NULL, 'Perícia agendada pela Junta Médica do Estado'),
  (pg_temp.id('2c', 6), pg_temp.s(9),  'licenca', 'premio', '2027-02-01', '2027-04-01', 60, '266/2026', '2026-10-16', NULL, NULL, NULL, NULL, true, 'ativa', 'LC Estadual nº 053/2001, art. 140', 'Primeiro quinquênio de efetivo exercício'),
  (pg_temp.id('2c', 7), pg_temp.s(17), 'licenca', 'interesse_particular', '2026-08-03', '2026-11-02', 92, NULL, NULL, NULL, NULL, NULL, NULL, true, 'cancelada', NULL, 'Pedido retirado pelo servidor em 28/07/2026'),
  (pg_temp.id('2c', 8), pg_temp.s(18), 'licenca', 'maternidade', '2025-04-01', '2025-09-27', 180, '84/2025', '2025-04-02', NULL, NULL, NULL, NULL, true, 'encerrada', 'LC Estadual nº 053/2001, art. 131 (prorrogação de 60 dias)', NULL),
  (pg_temp.id('2c', 9), pg_temp.s(4),  'missao', NULL, '2026-09-21', '2026-09-25', 5, '238/2026', '2026-09-17', NULL, NULL, NULL, 'Ministério do Esporte – Brasília/DF', true, 'encerrada', NULL, 'Missão oficial: Fórum Nacional de Gestores do Esporte'),
  (pg_temp.id('2c', 10), pg_temp.s(16), 'licenca', 'medica', '2026-10-14', '2026-10-14', 1, NULL, NULL, 'K52.9', 'Dra. Juliana Mota Ferraz', 'CRM-RR 1402', NULL, true, 'encerrada', NULL, 'Atestado de um dia');

INSERT INTO public.viagens_diarias (id, servidor_id, data_saida, data_retorno, destino_cidade, destino_uf, finalidade, justificativa, portaria_numero, portaria_data,
  quantidade_diarias, valor_diaria, valor_total, meio_transporte, veiculo_oficial, passagem_aerea, relatorio_apresentado, relatorio_data, status, observacoes,
  tipo_onus, numero_sei_diarias, workflow_diraf_status, workflow_diraf_solicitado_em, workflow_diraf_concluido_em) VALUES
  (pg_temp.id('2d', 1), pg_temp.s(2), '2026-05-18', '2026-05-21', 'Brasília', 'DF', 'Reunião do Fórum Nacional de Secretários e Gestores Estaduais de Esporte',
   'Pactuação de recursos da Lei de Incentivo ao Esporte para Roraima', '128/2026', '2026-05-12', 3.5, 520.00, 1820.00, 'aéreo', false, true, true, '2026-05-25',
   'concluida', NULL, 'com_onus', '18101.001702/2026-44', 'concluido', timestamptz '2026-05-12 10:00-04', timestamptz '2026-05-15 16:20-04'),
  (pg_temp.id('2d', 2), pg_temp.s(5), '2026-06-10', '2026-06-12', 'Pacaraima', 'RR', 'Abertura do Festival Juventude na Fronteira',
   'Acompanhamento das oficinas do programa Juventude Ativa', '158/2026', '2026-06-03', 2.5, 260.00, 650.00, 'terrestre', true, false, true, '2026-06-15',
   'concluida', 'Veículo oficial placa NAX-4E21', 'com_onus', '18101.001988/2026-05', 'concluido', timestamptz '2026-06-03 09:30-04', timestamptz '2026-06-05 11:10-04'),
  (pg_temp.id('2d', 3), pg_temp.s(13), '2026-09-02', '2026-09-04', 'Caracaraí', 'RR', 'Etapa regional dos Jogos Escolares de Roraima – JER 2026',
   'Coordenação técnica das modalidades coletivas', '214/2026', '2026-08-27', 2.5, 260.00, 650.00, 'terrestre', true, false, true, '2026-09-08',
   'concluida', NULL, 'com_onus', '18101.003040/2026-61', 'concluido', timestamptz '2026-08-27 14:00-04', timestamptz '2026-08-31 10:45-04'),
  (pg_temp.id('2d', 4), pg_temp.s(12), '2026-09-09', '2026-09-10', 'Alto Alegre', 'RR', 'Levantamento patrimonial da Quadra Poliesportiva Municipal cedida ao instituto',
   NULL, '225/2026', '2026-09-03', 1.5, 260.00, 390.00, 'terrestre', true, false, true, '2026-09-11',
   'concluida', NULL, 'com_onus', '18101.003155/2026-27', 'concluido', timestamptz '2026-09-03 08:40-04', timestamptz '2026-09-04 15:00-04'),
  (pg_temp.id('2d', 5), pg_temp.s(15), '2026-08-20', '2026-08-20', 'Mucajaí', 'RR', 'Cobertura fotográfica da entrega de kits esportivos às escolas',
   NULL, NULL, NULL, NULL, NULL, NULL, 'terrestre', true, false, true, '2026-08-21',
   'concluida', 'Ida e volta no mesmo dia, sem pernoite', 'sem_onus', NULL, NULL, NULL, NULL),
  (pg_temp.id('2d', 6), pg_temp.s(8), '2026-10-21', '2026-10-24', 'Manaus', 'AM', 'Visita técnica ao Centro de Treinamento de Alto Rendimento (CTAR) – benchmarking de gestão de equipamentos',
   'Subsidiar o termo de referência de manutenção dos ginásios', '251/2026', '2026-10-14', 3.5, 380.00, 1330.00, 'aéreo', false, true, false, NULL,
   'em_andamento', NULL, 'com_onus', '18101.003811/2026-02', 'concluido', timestamptz '2026-10-14 10:00-04', timestamptz '2026-10-16 17:30-04'),
  (pg_temp.id('2d', 7), pg_temp.s(14), '2026-10-26', '2026-10-30', 'Rorainópolis', 'RR', 'Avaliação da reforma da Quadra Poliesportiva e planejamento das escolinhas 2027',
   NULL, '258/2026', '2026-10-19', 4.5, 260.00, 1170.00, 'terrestre', true, false, false, NULL,
   'autorizada', NULL, 'com_onus', '18101.003870/2026-45', 'em_andamento', timestamptz '2026-10-19 11:20-04', NULL),
  (pg_temp.id('2d', 8), pg_temp.s(3), '2026-11-23', '2026-11-27', 'São Paulo', 'SP', 'Congresso Brasileiro de Gestão do Esporte',
   'Capacitação da diretoria administrativa em contratações no esporte', NULL, NULL, 4.5, 520.00, 2340.00, 'aéreo', false, true, false, NULL,
   'solicitada', NULL, 'com_onus', NULL, 'pendente', NULL, NULL),
  (pg_temp.id('2d', 9), pg_temp.s(16), '2026-07-14', '2026-07-15', 'Bonfim', 'RR', 'Reunião com lideranças juvenis da região do Tacutu',
   NULL, NULL, NULL, 1.5, 260.00, 390.00, 'terrestre', true, false, false, NULL,
   'cancelada', 'Cancelada: reunião transferida para formato on-line', 'com_onus', NULL, NULL, NULL, NULL),
  (pg_temp.id('2d', 10), pg_temp.s(17), '2026-09-15', '2026-09-18', 'Brasília', 'DF', 'Audiência no Ministério do Esporte sobre convênio de infraestrutura esportiva',
   NULL, '233/2026', '2026-09-10', 3.5, 520.00, 1820.00, 'aéreo', false, true, false, NULL,
   'em_andamento', 'Prestação de contas pendente: relatório de viagem não apresentado', 'com_onus', '18101.003466/2026-80', 'concluido', timestamptz '2026-09-10 09:00-04', timestamptz '2026-09-11 14:30-04'),
  (pg_temp.id('2d', 11), pg_temp.s(20), '2026-11-10', '2026-11-12', 'Cantá', 'RR', 'Mobilização para o programa Juventude Ativa nas vicinais do município',
   NULL, NULL, NULL, 2.5, 260.00, 650.00, 'terrestre', true, false, false, NULL,
   'solicitada', NULL, 'com_onus', NULL, 'solicitado', timestamptz '2026-10-21 15:00-04', NULL);

-- ===================================================================== ponto diário (setembro aprovado, outubro em lançamento)
CREATE TEMP TABLE _dias ON COMMIT DROP AS
  SELECT d::date AS dia FROM generate_series(date '2026-09-01', date '2026-10-22', interval '1 day') d
   WHERE extract(isodow FROM d) < 6
     AND NOT EXISTS (SELECT 1 FROM public.dias_nao_uteis x WHERE x.data = d::date AND x.ativo IS NOT FALSE);

CREATE TEMP TABLE _ponto ON COMMIT DROP AS
SELECT n, dia,
       CASE
         WHEN n = 14 AND dia BETWEEN '2026-09-08' AND '2026-09-12' THEN 'licenca'
         WHEN n = 11 AND dia BETWEEN '2026-10-13' AND '2026-10-27' THEN 'ferias'
         WHEN n = 16 AND dia = '2026-10-14' THEN 'atestado'
         WHEN (n = 12 AND dia = '2026-10-07') OR (n = 15 AND dia = '2026-10-09') THEN 'falta'
         ELSE 'normal' END AS tipo,
       ((n * 7 + extract(day FROM dia)::int * 3) % 9) AS jit,
       ((n + extract(day FROM dia)::int) % 11 = 0) AS atraso
  FROM generate_series(1, 20) n CROSS JOIN _dias;

INSERT INTO public.registros_ponto (id, servidor_id, data, entrada1, saida1, entrada2, saida2, tipo, status, horas_trabalhadas, horas_extras, atrasos,
  saidas_antecipadas, observacao, ip_address, dispositivo, aprovado, aprovador_id, data_aprovacao)
SELECT pg_temp.id('17', row_number() OVER (ORDER BY p.n, p.dia)::int), pg_temp.s(p.n), p.dia,
       CASE WHEN p.tipo = 'normal' THEN pg_temp.bv(p.dia, time '07:52' + make_interval(mins => p.jit + CASE WHEN p.atraso THEN 25 ELSE 0 END)) END,
       CASE WHEN p.tipo = 'normal' THEN pg_temp.bv(p.dia, time '12:00' + make_interval(mins => p.jit % 4)) END,
       CASE WHEN p.tipo = 'normal' THEN pg_temp.bv(p.dia, time '13:55' + make_interval(mins => p.jit % 6)) END,
       CASE WHEN p.tipo = 'normal' AND NOT (p.n = 7 AND p.dia = '2026-10-20') AND NOT (p.n = 1 AND p.dia = '2026-10-16')
            THEN pg_temp.bv(p.dia, time '18:00' + make_interval(mins => p.jit)) END,
       p.tipo::public.tipo_registro_ponto,
       (CASE
          WHEN p.dia < '2026-10-01' THEN 'aprovado'
          WHEN p.tipo = 'falta' THEN 'pendente_justificativa'
          WHEN p.tipo IN ('atestado', 'ferias') THEN 'justificado'
          WHEN (p.n = 7 AND p.dia = '2026-10-20') OR (p.n = 1 AND p.dia = '2026-10-16') THEN 'incompleto'
          ELSE 'completo' END)::public.status_ponto,
       CASE WHEN p.tipo <> 'normal' THEN 0
            WHEN (p.n = 7 AND p.dia = '2026-10-20') OR (p.n = 1 AND p.dia = '2026-10-16') THEN 4
            WHEN p.atraso THEN 7.6 ELSE 8 END,
       CASE WHEN p.tipo = 'normal' AND p.jit >= 7 AND NOT p.atraso THEN 0.25 ELSE 0 END,
       CASE WHEN p.tipo = 'normal' AND p.atraso THEN 25 ELSE 0 END,
       0,
       CASE p.tipo WHEN 'licenca' THEN 'Licença para tratamento de saúde' WHEN 'ferias' THEN 'Férias regulamentares'
                   WHEN 'atestado' THEN 'Atestado médico de 1 dia' WHEN 'falta' THEN 'Ausência sem registro' END,
       CASE WHEN p.tipo = 'normal' THEN '10.40.' || (p.n % 4) || '.' || (20 + p.n) END,
       CASE WHEN p.tipo = 'normal' THEN 'Relógio de ponto – recepção da sede' END,
       p.dia < '2026-10-01',
       CASE WHEN p.dia < '2026-10-01' THEN (SELECT uid FROM _ctx) END,
       CASE WHEN p.dia < '2026-10-01' THEN pg_temp.bv('2026-10-05', '10:00') END
  FROM _ponto p
 WHERE NOT (p.n = 11 AND p.dia > '2026-10-22');

INSERT INTO public.justificativas_ponto (id, registro_ponto_id, tipo, descricao, arquivo_url, status, aprovador_id, data_aprovacao, observacao_aprovador)
SELECT pg_temp.id('18', j.k), r.id, j.tipo::public.tipo_justificativa, j.descr, j.arq, j.st::public.status_solicitacao,
       CASE WHEN j.st IN ('aprovada', 'rejeitada') THEN (SELECT uid FROM _ctx) END,
       CASE WHEN j.st IN ('aprovada', 'rejeitada') THEN pg_temp.bv(j.dia + 2, '09:30') END, j.obs
  FROM (VALUES
    (1, 12, date '2026-10-07', 'outro', 'Acompanhei minha mãe em consulta no Hospital Geral de Roraima; apresento declaração de acompanhante.', NULL, 'pendente', NULL),
    (2, 16, date '2026-10-14', 'atestado', 'Atestado médico de 1 dia (CID K52.9).', 'justificativas/16/2026-10-14.pdf', 'aprovada', 'Atestado conferido.'),
    (3, 7,  date '2026-10-20', 'esquecimento', 'Esqueci de registrar a saída; permaneci até as 18h em reunião com a DPC.', NULL, 'pendente', NULL),
    (4, 15, date '2026-10-09', 'trabalho_externo', 'Cobertura de evento no Parque Anauá pela manhã.', NULL, 'rejeitada', 'Sem ordem de serviço ou autorização prévia da chefia para o serviço externo.'),
    (5, 1,  date '2026-10-16', 'problema_sistema', 'O relógio de ponto estava fora do ar no fim do expediente.', NULL, 'pendente', NULL)
  ) AS j(k, n, dia, tipo, descr, arq, st, obs)
  JOIN public.registros_ponto r ON r.servidor_id = pg_temp.s(j.n) AND r.data = j.dia;

INSERT INTO public.solicitacoes_abono (id, servidor_id, tipo_abono_id, data_inicio, data_fim, hora_inicio, hora_fim, justificativa, documento_url, status,
  aprovado_chefia_por, aprovado_chefia_em, aprovado_rh_por, aprovado_rh_em, motivo_rejeicao, created_by)
SELECT pg_temp.id('19', a.k), pg_temp.s(a.n), pg_temp.id('12', a.tipo), a.ini, a.fim, a.hi, a.hf, a.just, a.doc, a.st,
       CASE WHEN a.st IN ('aprovado_chefia', 'aprovado') THEN (SELECT uid FROM _ctx) END,
       CASE WHEN a.st IN ('aprovado_chefia', 'aprovado') THEN pg_temp.bv(a.fim + 1, '10:00') END,
       CASE WHEN a.st = 'aprovado' AND a.rh THEN (SELECT uid FROM _ctx) END,
       CASE WHEN a.st = 'aprovado' AND a.rh THEN pg_temp.bv(a.fim + 3, '15:00') END,
       a.motivo, (SELECT uid FROM _ctx)
  FROM (VALUES
    (1, 16, 1, date '2026-10-14', date '2026-10-14', NULL::time, NULL::time, 'Atestado médico de 1 dia.', 'abonos/16/atestado-2026-10-14.pdf', 'aprovado', true, NULL::text),
    (2, 9, 3, date '2026-09-18', date '2026-09-18', NULL, NULL, 'Doação de sangue no HEMORAIMA.', 'abonos/9/hemoraima-2026-09-18.pdf', 'aprovado', false, NULL),
    (3, 12, 2, date '2026-10-07', date '2026-10-07', '08:00', '12:00', 'Acompanhamento de familiar em consulta médica.', 'abonos/12/declaracao-2026-10-07.pdf', 'pendente', false, NULL),
    (4, 10, 6, date '2026-10-19', date '2026-10-21', NULL, NULL, 'Curso "Folha de pagamento no setor público" (Escola de Governo).', 'abonos/10/inscricao-curso.pdf', 'aprovado_chefia', false, NULL),
    (5, 15, 5, date '2026-10-09', date '2026-10-09', '08:00', '12:00', 'Cobertura de evento no Parque Anauá.', NULL, 'rejeitado', false, 'Serviço externo sem autorização prévia da chefia.'),
    (6, 18, 7, date '2026-10-30', date '2026-10-30', NULL, NULL, 'Compensação de 8 horas do banco de horas (plantão nos Jogos Escolares).', NULL, 'pendente', false, NULL),
    (7, 17, 4, date '2026-10-26', date '2026-10-27', NULL, NULL, 'Folga compensatória pelo trabalho como mesário nas eleições de 04/10/2026.', 'abonos/17/declaracao-tre.pdf', 'cancelado', false, NULL),
    (8, 1, 8, date '2026-10-22', date '2026-10-22', '16:00', '18:00', 'Dispensa para colação de grau de familiar.', NULL, 'pendente', false, NULL)
  ) AS a(k, n, tipo, ini, fim, hi, hf, just, doc, st, rh, motivo);

-- fechamento individual: julho e agosto consolidados; setembro em etapas diferentes (a grade de validação mostra todas)
INSERT INTO public.frequencia_fechamento (id, servidor_id, ano, mes, assinado_servidor, assinado_servidor_em, validado_chefia, validado_chefia_por,
  validado_chefia_em, consolidado_rh, consolidado_rh_por, consolidado_rh_em, reaberto, reaberto_por, reaberto_em, justificativa_reabertura, observacoes)
SELECT pg_temp.id('1b', m * 100 + n), pg_temp.s(n), 2026, m,
       true, pg_temp.bv(make_date(2026, m + 1, 2), '17:10'),
       NOT (m = 9 AND n IN (5, 10, 15)),
       CASE WHEN NOT (m = 9 AND n IN (5, 10, 15)) THEN (SELECT uid FROM _ctx) END,
       CASE WHEN NOT (m = 9 AND n IN (5, 10, 15)) THEN pg_temp.bv(make_date(2026, m + 1, 5), '11:00') END,
       NOT (m = 9 AND n IN (3, 5, 7, 10, 14, 15, 20)),
       CASE WHEN NOT (m = 9 AND n IN (3, 5, 7, 10, 14, 15, 20)) THEN (SELECT uid FROM _ctx) END,
       CASE WHEN NOT (m = 9 AND n IN (3, 5, 7, 10, 14, 15, 20)) THEN pg_temp.bv(make_date(2026, m + 1, 9), '16:00') END,
       (m = 9 AND n = 3),
       CASE WHEN m = 9 AND n = 3 THEN (SELECT uid FROM _ctx) END,
       CASE WHEN m = 9 AND n = 3 THEN pg_temp.bv('2026-10-08', '09:15') END,
       CASE WHEN m = 9 AND n = 3 THEN 'Inclusão de saída antecipada autorizada em 18/09 que não constava do espelho.' END,
       CASE WHEN m = 9 AND n = 14 THEN 'Conferir lançamento da licença médica de 08 a 12/09.' END
  FROM generate_series(7, 9) m CROSS JOIN generate_series(1, 20) n
 WHERE NOT (m = 9 AND n = 18);   -- Sofia ainda não assinou setembro

-- ===================================================================== frequência mensal (novos meses)
-- janeiro a agosto fechados, outubro em lançamento; setembro já vem do dados-teste.sql
CREATE TEMP TABLE _mes ON COMMIT DROP AS
  SELECT m, count(*) FILTER (WHERE extract(isodow FROM d) < 6
                               AND NOT EXISTS (SELECT 1 FROM public.dias_nao_uteis x WHERE x.data = d::date)) AS uteis
    FROM generate_series(1, 10) m
    CROSS JOIN LATERAL generate_series(make_date(2026, m, 1),
                                       CASE WHEN m = 10 THEN date '2026-10-22' ELSE (make_date(2026, m, 1) + interval '1 month - 1 day')::date END,
                                       interval '1 day') d
   WHERE m <> 9
   GROUP BY m;

INSERT INTO public.frequencia_mensal (id, servidor_id, mes, ano, dias_trabalhados, dias_falta, dias_atestado, dias_ferias, dias_licenca, horas_trabalhadas,
  horas_extras, horas_devidas, total_atrasos, percentual_presenca, fechado, data_fechamento)
SELECT pg_temp.id('1c', mes.m * 100 + n), pg_temp.s(n), mes.m, 2026,
       mes.uteis - f.ferias - l.licenca - x.falta - x.atestado,
       x.falta, x.atestado, f.ferias, l.licenca,
       (mes.uteis - f.ferias - l.licenca - x.falta - x.atestado) * 8,
       CASE WHEN (n + mes.m) % 5 = 0 THEN 2.5 ELSE 0 END,
       x.falta * 8, (n * mes.m) % 3,
       round(100.0 * (mes.uteis - x.falta) / mes.uteis, 2),
       mes.m <= 8, CASE WHEN mes.m <= 8 THEN pg_temp.bv(make_date(2026, mes.m + 1, 10), '16:30') END
  FROM _mes mes
  CROSS JOIN generate_series(1, 21) n
  CROSS JOIN LATERAL (
    SELECT count(*)::int AS ferias FROM public.ferias_servidor fs
      CROSS JOIN LATERAL generate_series(greatest(fs.data_inicio, make_date(2026, mes.m, 1)),
                                         least(fs.data_fim, (make_date(2026, mes.m, 1) + interval '1 month - 1 day')::date, date '2026-10-22'), interval '1 day') d
     WHERE fs.servidor_id = pg_temp.s(n) AND fs.status IN ('concluida', 'em_gozo')
       AND extract(isodow FROM d) < 6 AND NOT EXISTS (SELECT 1 FROM public.dias_nao_uteis x WHERE x.data = d::date)) f
  CROSS JOIN LATERAL (
    SELECT count(*)::int AS licenca FROM public.licencas_afastamentos la
      CROSS JOIN LATERAL generate_series(greatest(la.data_inicio, make_date(2026, mes.m, 1)),
                                         least(la.data_fim, (make_date(2026, mes.m, 1) + interval '1 month - 1 day')::date, date '2026-10-22'), interval '1 day') d
     WHERE la.servidor_id = pg_temp.s(n) AND la.status IN ('encerrada', 'ativa') AND la.tipo_afastamento = 'licenca'
       AND la.tipo_licenca IS DISTINCT FROM 'medica'
       AND extract(isodow FROM d) < 6 AND NOT EXISTS (SELECT 1 FROM public.dias_nao_uteis x WHERE x.data = d::date)) l
  CROSS JOIN LATERAL (
    SELECT CASE WHEN mes.m = 10 THEN (n IN (12, 15))::int WHEN (n * mes.m) % 13 = 0 THEN 1 ELSE 0 END AS falta,
           CASE WHEN mes.m = 10 THEN (n = 16)::int WHEN mes.m = 8 AND n = 6 THEN 3 ELSE 0 END AS atestado) x
 WHERE n <= 20 OR mes.m <= 3;                  -- Mariana (21) foi cedida em abril


-- ===================================================================== arquivos e pacotes de frequência
INSERT INTO public.frequencia_arquivos (id, periodo, ano, mes, servidor_id, servidor_nome, servidor_matricula, unidade_id, unidade_nome, unidade_sigla,
  tipo, arquivo_path, arquivo_nome, arquivo_tamanho, hash_conteudo, created_by)
SELECT pg_temp.id('1d', m * 100 + n), '2026-' || lpad(m::text, 2, '0'), 2026, m, s.id, s.nome_completo, s.matricula, u.id, u.nome, u.sigla,
       'individual',
       '2026-' || lpad(m::text, 2, '0') || '/' || u.sigla || '/' || s.matricula || '_' || upper(translate(split_part(s.nome_completo, ' ', 1), 'ÁÂÃÉÊÍÓÔÕÚÇáâãéêíóôõúç', 'AAAEEIOOOUCaaaeeiooouc')) || '_' || (20260900 + m * 100 + 10)::text || '.pdf',
       'Frequencia_' || s.matricula || '_' || lpad(m::text, 2, '0') || '-2026.pdf',
       180000 + n * 1373, md5('freq' || m || n), (SELECT uid FROM _ctx)
  FROM generate_series(8, 9) m CROSS JOIN generate_series(1, 18) n
  JOIN public.servidores s ON s.id = pg_temp.s(n)
  JOIN public.estrutura_organizacional u ON u.id = s.unidade_atual_id
 WHERE m = 8 OR n % 3 <> 0;

INSERT INTO public.frequencia_pacotes (id, periodo, ano, mes, unidade_id, unidade_nome, agrupamento_id, agrupamento_nome, tipo, status, arquivo_path, arquivo_nome,
  arquivo_tamanho, total_arquivos, link_download, link_expira_em, erro_mensagem, gerado_em, created_by)
SELECT pg_temp.id('1e', p.k), p.periodo, 2026, p.mes, NULL, NULL, g.id, g.nome, 'agrupamento', p.status,
       CASE WHEN p.status = 'gerado' THEN 'pacotes/' || p.periodo || '/agrupamento-' || g.ordem || '.zip' END,
       CASE WHEN p.status = 'gerado' THEN 'Frequencia_' || p.periodo || '_' || replace(split_part(g.nome, ' - ', 1), ' ', '_') || '.zip' END,
       CASE WHEN p.status = 'gerado' THEN 1200000 + g.ordem * 310000 END,
       p.total, CASE WHEN p.status = 'gerado' THEN 'FREQ-' || p.periodo || '-' || substr(md5('pac' || p.k), 1, 10) END,
       CASE WHEN p.status = 'gerado' THEN timestamptz '2026-11-30 23:59-04' END,
       CASE WHEN p.status = 'erro' THEN 'Falha ao compactar: 2 arquivos não encontrados no armazenamento.' END,
       CASE WHEN p.status = 'gerado' THEN pg_temp.bv(p.gerado, '17:45') END, (SELECT uid FROM _ctx)
  FROM (VALUES (1, '2026-08', 8, 1, 'gerado', 3, date '2026-09-10'), (2, '2026-08', 8, 2, 'gerado', 7, date '2026-09-10'),
               (3, '2026-08', 8, 3, 'gerado', 4, date '2026-09-10'), (4, '2026-08', 8, 4, 'gerado', 4, date '2026-09-10'),
               (5, '2026-09', 9, 1, 'gerado', 2, date '2026-10-09'), (6, '2026-09', 9, 2, 'erro', 5, NULL),
               (7, '2026-09', 9, 3, 'pendente', 0, NULL)) AS p(k, periodo, mes, grupo, status, total, gerado)
  JOIN public.config_agrupamento_unidades g ON g.ordem = p.grupo;
INSERT INTO public.frequencia_pacotes (id, periodo, ano, mes, unidade_id, unidade_nome, tipo, status, total_arquivos, created_by)
VALUES (pg_temp.id('1e', 8), '2026-09', 2026, 9, pg_temp.u(5), 'Divisão de Recursos Humanos', 'unidade', 'gerando', 3, (SELECT uid FROM _ctx));

-- ===================================================================== ponto do login de teste (tabelas que guardam o id do login)
INSERT INTO public.configuracao_jornada (id, servidor_id, carga_horaria_semanal, horas_por_dia, dias_trabalho, tolerancia_atraso, tolerancia_saida_antecipada,
  exige_localizacao, permite_ponto_remoto, exige_foto, permite_compensacao, limite_banco_horas)
SELECT pg_temp.id('20', 1), uid, 40, 8, ARRAY[1,2,3,4,5], 10, 10, false, false, false, true, 40 FROM _ctx WHERE uid IS NOT NULL;
INSERT INTO public.horarios_jornada (id, configuracao_id, dia_semana, entrada1, saida1, entrada2, saida2, created_at)
SELECT pg_temp.id('21', d), pg_temp.id('20', 1), d, '08:00', '12:00', '14:00', '18:00', now()
  FROM generate_series(1, 5) d WHERE EXISTS (SELECT 1 FROM _ctx WHERE uid IS NOT NULL);

INSERT INTO public.banco_horas (id, servidor_id, mes, ano, saldo_anterior, horas_extras, horas_compensadas, saldo_atual)
SELECT pg_temp.id('1f', b.m), uid, b.m, 2026, b.ant, b.ext, b.comp, b.ant + b.ext - b.comp
  FROM _ctx CROSS JOIN (VALUES (8, 3.5, 6.0, 0.0), (9, 9.5, 10.5, 4.0), (10, 16.0, 0.0, 3.0)) AS b(m, ant, ext, comp)
 WHERE uid IS NOT NULL;
INSERT INTO public.lancamentos_banco_horas (id, banco_horas_id, data, tipo, horas, motivo, registro_ponto_id)
SELECT pg_temp.id('22', l.k), pg_temp.id('1f', l.m), l.d, l.t::public.tipo_lancamento_horas, l.h, l.motivo,
       (SELECT r.id FROM public.registros_ponto r WHERE r.servidor_id = pg_temp.s(1) AND r.data = l.d)
  FROM (VALUES
    (1, 8, date '2026-08-15', 'credito', 6.0, 'Plantão na abertura dos Jogos Escolares (sábado)'),
    (2, 9, date '2026-09-12', 'credito', 8.0, 'Plantão na etapa regional dos JER (sábado)'),
    (3, 9, date '2026-09-23', 'credito', 2.5, 'Fechamento da folha de setembro'),
    (4, 9, date '2026-09-30', 'debito', 4.0, 'Compensação autorizada pela chefia'),
    (5, 10, date '2026-10-09', 'debito', 3.0, 'Saída antecipada compensada'),
    (6, 10, date '2026-10-15', 'ajuste', 0.0, 'Ajuste de arredondamento do saldo')
  ) AS l(k, m, d, t, h, motivo)
 WHERE EXISTS (SELECT 1 FROM _ctx WHERE uid IS NOT NULL);

INSERT INTO public.solicitacoes_ajuste_ponto (id, servidor_id, registro_ponto_id, data_ocorrido, tipo_ajuste, campo_ajuste, horario_atual, horario_correto, motivo,
  status, aprovador_id, data_aprovacao, observacao_aprovador)
SELECT pg_temp.id('1a', a.k), uid, (SELECT r.id FROM public.registros_ponto r WHERE r.servidor_id = pg_temp.s(1) AND r.data = a.d), a.d, a.tipo, a.campo,
       a.atual, a.correto, a.motivo, a.st::public.status_solicitacao,
       CASE WHEN a.st <> 'pendente' THEN uid END, CASE WHEN a.st <> 'pendente' THEN pg_temp.bv(a.d + 1, '10:00') END, a.obs
  FROM _ctx CROSS JOIN (VALUES
    (1, date '2026-10-16', 'inclusao', 'saida2', NULL::timestamptz, timestamptz '2026-10-16 18:02-04', 'Relógio de ponto fora do ar no fim do expediente.', 'pendente', NULL::text),
    (2, date '2026-09-23', 'correcao', 'entrada1', timestamptz '2026-09-23 08:31-04', timestamptz '2026-09-23 07:58-04', 'Registro com atraso do relógio (fila de leitura biométrica).', 'aprovada', 'Confirmado pela recepção.'),
    (3, date '2026-09-10', 'correcao', 'saida1', timestamptz '2026-09-10 12:00-04', timestamptz '2026-09-10 12:40-04', 'Reunião se estendeu.', 'rejeitada', 'Sem registro da reunião na agenda da unidade.')
  ) AS a(k, d, tipo, campo, atual, correto, motivo, st, obs)
 WHERE uid IS NOT NULL;

-- memorando de apresentação à unidade (a tabela guarda o login, não o servidor: só o servidor com login tem memorando)
INSERT INTO public.memorandos_lotacao (id, numero_protocolo, ano, lotacao_id, servidor_id, servidor_nome, servidor_matricula, unidade_destino_id, unidade_destino_nome,
  cargo_id, cargo_nome, tipo_movimentacao, data_inicio_exercicio, data_emissao, emitido_por, emitido_por_nome, entregue, data_entrega, recebido_por, status, observacoes)
SELECT pg_temp.id('2e', 1), '0001/2025-MEMO-LOT', 2025, l.id, x.uid, s.nome_completo, s.matricula, u.id, u.nome, c.id, c.nome, 'nomeacao',
       '2025-02-01', '2025-01-30', x.uid, 'Fernanda Albuquerque Lins', true, pg_temp.bv('2025-02-01', '08:20'), 'Fernanda Albuquerque Lins', 'entregue',
       'Apresentação à Divisão de Recursos Humanos'
  FROM _ctx x
  JOIN public.servidores s ON s.id = pg_temp.s(1)
  JOIN public.lotacoes l ON l.servidor_id = s.id AND l.ativo
  JOIN public.estrutura_organizacional u ON u.id = l.unidade_id
  JOIN public.cargos c ON c.id = l.cargo_id
 WHERE x.uid IS NOT NULL;

SELECT 'designacoes' AS tabela, count(*) FROM public.designacoes
UNION ALL SELECT 'cessoes', count(*) FROM public.cessoes
UNION ALL SELECT 'registros_ponto', count(*) FROM public.registros_ponto
UNION ALL SELECT 'frequencia_fechamento', count(*) FROM public.frequencia_fechamento
UNION ALL SELECT 'frequencia_mensal', count(*) FROM public.frequencia_mensal
UNION ALL SELECT 'vagas_cargo', count(*) FROM public.vagas_cargo;

COMMIT;
