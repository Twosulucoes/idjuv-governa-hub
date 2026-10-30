-- Dados FICTÍCIOS de demonstração — Compras, licitações, contratos e processos administrativos (workflow).
-- Só para o banco de TESTE, depois de dados-teste.sql. Guia: docs/NOVO_BANCO.md §9.
--
-- O que entra (ids com prefixo d4):
--   d41… fornecedores novos            d42… processos licitatórios novos (uma fase de cada)
--   d421 itens_licitacao  d422 itens_processo_licitatorio  d423 propostas  d424 docs preparatórios
--   d425 publicações legais            d43… contratos novos  d431 aditivos  d432 itens  d433 medições
--   d44… atas de registro de preço  d441 itens da ata     d45… processos administrativos (SEI)
--   d451 despachos  d452 documentos  d453 encaminhamentos  d454 prazos  d455 pareceres  d456 decisões
--   d46… comissões  d461 membros       d47… instituições   d48… pedidos de aprovação
-- O sistema não redige ato formal (é do SEI): aqui só se registra o ciclo (número SEI, DOE, PNCP).
-- Nomes, CNPJs, CPFs e e-mails são inventados. Datas absolutas de 2026 (referência: 23/10/2026).
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
  IF EXISTS (SELECT 1 FROM public.processos_administrativos) THEN
    RAISE EXCEPTION 'recusado: os dados de demonstração deste módulo já foram carregados';
  END IF;
END $$;
-- quem "faz" as ações (auth.uid() nos triggers de autoria): o login de teste ligado ao servidor fictício
SELECT set_config('request.jwt.claim.sub', coalesce((SELECT id::text FROM public.profiles
  WHERE servidor_id = 'c0000000-0000-4000-8000-000000000001'), ''), true) AS _ \gset
SELECT set_config('request.jwt.claim.role', 'authenticated', true) AS _ \gset

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

-- CNPJ inventado com dígitos verificadores válidos, formatado (12 dígitos de base)
CREATE FUNCTION pg_temp.cnpj(base text) RETURNS text LANGUAGE plpgsql AS $f$
DECLARE p1 int[] := ARRAY[5,4,3,2,9,8,7,6,5,4,3,2]; p2 int[] := ARRAY[6,5,4,3,2,9,8,7,6,5,4,3,2];
        s int; d1 int; d2 int; i int; n text;
BEGIN
  s := 0; FOR i IN 1..12 LOOP s := s + substr(base, i, 1)::int * p1[i]; END LOOP;
  d1 := CASE WHEN s % 11 < 2 THEN 0 ELSE 11 - s % 11 END;
  n := base || d1;
  s := 0; FOR i IN 1..13 LOOP s := s + substr(n, i, 1)::int * p2[i]; END LOOP;
  d2 := CASE WHEN s % 11 < 2 THEN 0 ELSE 11 - s % 11 END;
  n := n || d2;
  RETURN substr(n,1,2) || '.' || substr(n,3,3) || '.' || substr(n,6,3) || '/' || substr(n,9,4) || '-' || substr(n,13,2);
END $f$;

-- ===================================================================== fornecedores novos
INSERT INTO public.fornecedores (id, tipo_pessoa, cpf_cnpj, razao_social, nome_fantasia, inscricao_estadual,
  endereco_logradouro, endereco_numero, endereco_bairro, endereco_cidade, endereco_uf, endereco_cep, telefone, email,
  representante_nome, representante_cpf, representante_telefone, banco_codigo, banco_nome, agencia, conta, tipo_conta, ativo, data_cadastro) VALUES
  ('d4100000-0000-4000-8000-000000000001', 'PJ', pg_temp.cnpj('418273650001'), 'Norte Sabor Refeições Coletivas Ltda', 'Norte Sabor', '24.031.187-4',
   'Av. Ville Roy', '4120', 'Caçari', 'Boa Vista', 'RR', '69307-725', '(95) 3224-5810', 'licitacoes@nortesabor.exemplo.test',
   'Raimunda Cardoso Bezerra', pg_temp.cpf('418273651'), '(95) 99141-2207', '001', 'Banco do Brasil', '2617', '48213-0', 'corrente', true, '2026-02-03'),
  ('d4100000-0000-4000-8000-000000000002', 'PJ', pg_temp.cnpj('352918470001'), 'Hospedagem Rio Branco Hotelaria Ltda', 'Hotel Rio Branco', '24.018.552-1',
   'Rua Coronel Pinto', '388', 'Centro', 'Boa Vista', 'RR', '69301-150', '(95) 3623-1144', 'reservas@hotelriobranco.exemplo.test',
   'Augusto Lacerda Pimentel', pg_temp.cpf('352918471'), '(95) 99172-0388', '104', 'Caixa Econômica Federal', '0581', '00031874-2', 'corrente', true, '2026-02-10'),
  ('d4100000-0000-4000-8000-000000000003', 'PJ', pg_temp.cnpj('290446130001'), 'Construtora Paricarana Engenharia e Serviços Ltda', 'Paricarana Engenharia', '24.009.861-7',
   'Rua Pedro Rodrigues', '1475', 'Paraviana', 'Boa Vista', 'RR', '69307-160', '(95) 3626-7702', 'contato@paricarana.exemplo.test',
   'Eng. Wellington Souza Farias', pg_temp.cpf('290446131'), '(95) 99115-6620', '237', 'Bradesco', '3391', '0127745-9', 'corrente', true, '2026-03-18'),
  ('d4100000-0000-4000-8000-000000000004', 'PJ', pg_temp.cnpj('507731290001'), 'Arena Sports Distribuidora de Artigos Esportivos Ltda', 'Arena Sports', '24.044.903-2',
   'Av. Ataíde Teive', '2980', 'Asa Branca', 'Boa Vista', 'RR', '69312-000', '(95) 3627-3390', 'vendas@arenasports.exemplo.test',
   'Kleber Andrade Noronha', pg_temp.cpf('507731291'), '(95) 99104-7781', '001', 'Banco do Brasil', '4418', '30982-7', 'corrente', true, '2026-04-02'),
  ('d4100000-0000-4000-8000-000000000005', 'PJ', pg_temp.cnpj('613408820001'), 'Placar Digital Sistemas Esportivos Ltda', 'Placar Digital', NULL,
   'Rua Vergueiro', '1855', 'Vila Mariana', 'São Paulo', 'SP', '04101-000', '(11) 3045-9120', 'comercial@placardigital.exemplo.test',
   'Fabiana Teixeira Morato', pg_temp.cpf('613408821'), '(11) 98820-4415', '341', 'Itaú Unibanco', '0742', '55120-3', 'corrente', true, '2026-04-15'),
  ('d4100000-0000-4000-8000-000000000006', 'PJ', pg_temp.cnpj('476150390001'), 'Uniformes Lavrado Confecções Ltda', 'Lavrado Uniformes', '24.052.338-0',
   'Rua Professor Agnelo Bitencourt', '640', 'São Francisco', 'Boa Vista', 'RR', '69305-170', '(95) 3224-8817', 'vendas@lavradouniformes.exemplo.test',
   'Silvana Matos Guerreiro', pg_temp.cpf('476150391'), '(95) 99133-5402', '001', 'Banco do Brasil', '2617', '51907-6', 'corrente', true, '2026-05-06'),
  ('d4100000-0000-4000-8000-000000000007', 'PJ', pg_temp.cnpj('384926170001'), 'Estrutura Forte Locações para Eventos Ltda', 'Estrutura Forte', '24.036.640-9',
   'Av. das Guianas', '3315', 'Jardim Floresta', 'Boa Vista', 'RR', '69312-145', '(95) 3628-4410', 'comercial@estruturaforte.exemplo.test',
   'Rogério Feitosa Campelo', pg_temp.cpf('384926171'), '(95) 99178-3306', '104', 'Caixa Econômica Federal', '3524', '00072115-0', 'corrente', true, '2026-05-20'),
  ('d4100000-0000-4000-8000-000000000008', 'PJ', pg_temp.cnpj('225870640001'), 'Rota Norte Transportes e Turismo Ltda', 'Rota Norte', '24.011.209-5',
   'BR-174, Km 8', 's/n', 'Distrito Industrial', 'Boa Vista', 'RR', '69315-000', '(95) 3626-1290', 'frota@rotanorte.exemplo.test',
   'Márcio Holanda Ribeiro', pg_temp.cpf('225870641'), '(95) 99160-8812', '237', 'Bradesco', '3391', '0119021-4', 'corrente', true, '2025-02-12'),
  ('d4100000-0000-4000-8000-000000000009', 'PJ', pg_temp.cnpj('561239080001'), 'Vale do Branco Transportes Rodoviários Ltda', 'Vale do Branco', '24.047.115-3',
   'Rua Cecília Brasil', '912', 'Centro', 'Boa Vista', 'RR', '69301-380', '(95) 3623-9025', 'contratos@valedobranco.exemplo.test',
   'Antônio Carlos Siqueira', pg_temp.cpf('561239081'), '(95) 99187-2240', '001', 'Banco do Brasil', '0250', '77412-1', 'corrente', true, '2026-08-25');

-- ===================================================================== processos licitatórios novos (uma fase de cada)
-- fases: planejamento, elaboracao, publicacao (edital publicado), habilitacao (em disputa), homologacao, fracassado,
-- deserto, contratacao (concorrência e inexigibilidade). O PE 002/2026 do dados-teste (julgamento) ganha itens e propostas.
INSERT INTO public.processos_licitatorios (id, numero_processo, ano, modalidade, tipo_licitacao, objeto, objeto_resumido, valor_estimado,
  data_abertura, data_publicacao_edital, data_limite_propostas, data_sessao, fase_atual, historico_fases, unidade_requisitante_id,
  servidor_responsavel_id, pregoeiro_id, dotacao_orcamentaria, fonte_recurso, programa_trabalho, elemento_despesa, fundamentacao_legal, observacoes, created_by) VALUES
  ('d4200000-0000-4000-8000-000000000001', 'PE 014/2026', 2026, 'pregao_eletronico', 'menor_preco',
   'Contratação de empresa especializada no fornecimento de alimentação (café da manhã, almoço, jantar e lanches) aos atletas, técnicos e staff dos Jogos Escolares de Roraima – JERs 2027, nas etapas municipais e estadual.',
   'Alimentação para os JERs 2027', 1250000.00, '2026-10-06', NULL, NULL, NULL, 'planejamento', '[]'::jsonb,
   'a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000008', NULL, '0202.2050.339039.100', '100', '27.812.0202.2050', '3.3.90.39',
   'Lei nº 14.133/2021, art. 28, I; registro de preços (art. 82)', 'Demanda formalizada pela Diretoria de Esporte; aguardando ETP e pesquisa de preços.', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4200000-0000-4000-8000-000000000002', 'PE 015/2026', 2026, 'pregao_eletronico', 'menor_preco_item',
   'Aquisição de kits de material esportivo (bolas oficiais de futsal, voleibol, handebol e basquetebol, redes, coletes e cones) para os núcleos do Programa Escolinhas Esportivas na capital e no interior.',
   'Kits esportivos para as Escolinhas Esportivas', 186400.00, '2026-09-14', NULL, NULL, NULL, 'elaboracao',
   '[{"fase_anterior": "planejamento", "fase_nova": "elaboracao", "data": "2026-10-01T10:12:00-04:00"}]'::jsonb,
   'a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000008', NULL, '0202.2050.339030.100', '100', '27.812.0202.2050', '3.3.90.30',
   'Lei nº 14.133/2021, art. 28, I', 'Termo de referência em revisão pela Divisão de Patrimônio e Compras.', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4200000-0000-4000-8000-000000000003', 'PE 011/2026', 2026, 'pregao_eletronico', 'menor_preco_lote',
   'Aquisição de uniformes esportivos de competição e de passeio (agasalhos, camisetas, bermudas e meiões) para as delegações de Roraima nos Jogos da Juventude e nos Jogos Escolares Brasileiros de 2027.',
   'Uniformes para as delegações estaduais', 342000.00, '2026-07-22', '2026-10-15', '2026-11-04 09:00-04', '2026-11-04 10:00-04', 'publicacao',
   '[{"fase_anterior": "planejamento", "fase_nova": "elaboracao", "data": "2026-08-05T09:00:00-04:00"}, {"fase_anterior": "elaboracao", "fase_nova": "edital", "data": "2026-09-23T15:40:00-04:00"}, {"fase_anterior": "edital", "fase_nova": "publicacao", "data": "2026-10-15T08:30:00-04:00"}]'::jsonb,
   'a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000008', 'c0000000-0000-4000-8000-000000000011', '0202.2050.339030.100', '100', '27.812.0202.2050', '3.3.90.30',
   'Lei nº 14.133/2021, art. 28, I, e art. 6º, XLI', 'Sessão pública marcada para 04/11/2026, 10h (horário de Brasília), no Compras.gov.br.', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4200000-0000-4000-8000-000000000004', 'PE 009/2026', 2026, 'pregao_eletronico', 'menor_preco',
   'Contratação de serviço de transporte rodoviário intermunicipal de passageiros, com ônibus executivo e motorista, para deslocamento de delegações esportivas aos municípios do interior do Estado.',
   'Transporte rodoviário de delegações', 410000.00, '2026-06-02', '2026-09-28', '2026-10-14 09:00-04', '2026-10-14 10:00-04', 'habilitacao',
   '[{"fase_anterior": "planejamento", "fase_nova": "elaboracao", "data": "2026-06-20T10:00:00-04:00"}, {"fase_anterior": "elaboracao", "fase_nova": "edital", "data": "2026-09-10T11:00:00-04:00"}, {"fase_anterior": "edital", "fase_nova": "publicacao", "data": "2026-09-28T08:00:00-04:00"}, {"fase_anterior": "publicacao", "fase_nova": "propostas", "data": "2026-10-14T10:00:00-04:00"}, {"fase_anterior": "propostas", "fase_nova": "habilitacao", "data": "2026-10-16T14:20:00-04:00"}]'::jsonb,
   'a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000008', 'c0000000-0000-4000-8000-000000000011', '0202.2050.339033.100', '100', '27.812.0202.2050', '3.3.90.33',
   'Lei nº 14.133/2021, art. 28, I', 'Lance vencedor provisório da Vale do Branco Transportes; documentos de habilitação em análise.', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4200000-0000-4000-8000-000000000005', 'PE 006/2026', 2026, 'pregao_eletronico', 'menor_preco_lote',
   'Registro de preços para eventual contratação de serviços de hospedagem e de alimentação para atletas, técnicos e comissões de arbitragem em competições estaduais promovidas pelo Instituto.',
   'SRP hospedagem e alimentação de delegações', 980000.00, '2026-03-02', '2026-04-27', '2026-05-12 09:00-04', '2026-05-12 10:00-04', 'homologacao',
   '[{"fase_anterior": "publicacao", "fase_nova": "propostas", "data": "2026-05-12T10:00:00-04:00"}, {"fase_anterior": "propostas", "fase_nova": "habilitacao", "data": "2026-05-14T09:30:00-04:00"}, {"fase_anterior": "habilitacao", "fase_nova": "julgamento", "data": "2026-05-20T16:00:00-04:00"}, {"fase_anterior": "julgamento", "fase_nova": "homologacao", "data": "2026-06-03T11:15:00-04:00"}]'::jsonb,
   'a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000008', 'c0000000-0000-4000-8000-000000000011', '0202.2050.339039.100', '100', '27.812.0202.2050', '3.3.90.39',
   'Lei nº 14.133/2021, arts. 82 a 86 (Sistema de Registro de Preços)', 'Homologado em 03/06/2026. Atas nº 004/2026 (lote 1) e 005/2026 (lote 2).', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4200000-0000-4000-8000-000000000006', 'PE 007/2026', 2026, 'pregao_eletronico', 'menor_preco_lote',
   'Locação de estruturas temporárias (tendas, arquibancadas modulares, palco, gradis e sonorização) para a realização de eventos esportivos e de juventude no Estado de Roraima.',
   'Locação de estruturas para eventos', 265000.00, '2026-04-06', '2026-06-08', '2026-06-23 09:00-04', '2026-06-23 10:00-04', 'fracassado',
   '[{"fase_anterior": "publicacao", "fase_nova": "propostas", "data": "2026-06-23T10:00:00-04:00"}, {"fase_anterior": "propostas", "fase_nova": "julgamento", "data": "2026-06-23T15:00:00-04:00"}, {"fase_anterior": "julgamento", "fase_nova": "fracassado", "data": "2026-07-02T10:40:00-04:00"}]'::jsonb,
   'a0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000008', 'c0000000-0000-4000-8000-000000000011', '0202.2050.339039.100', '100', '27.812.0202.2050', '3.3.90.39',
   'Lei nº 14.133/2021, art. 28, I', 'Todas as propostas desclassificadas (preço acima do estimado e atestados incompatíveis). Nova licitação em estudo.', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4200000-0000-4000-8000-000000000007', 'DE 018/2026', 2026, 'dispensa', 'menor_preco',
   'Aquisição de troféus e medalhas (ouro, prata e bronze) para premiação dos Jogos Abertos de Roraima 2026, por dispensa eletrônica de licitação.',
   'Troféus e medalhas – Jogos Abertos', 38500.00, '2026-08-17', '2026-09-08', '2026-09-11 14:00-04', '2026-09-11 14:00-04', 'deserto',
   '[{"fase_anterior": "publicacao", "fase_nova": "deserto", "data": "2026-09-11T14:05:00-04:00"}]'::jsonb,
   'a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000008', NULL, '0202.2050.339031.100', '100', '27.812.0202.2050', '3.3.90.31',
   'Lei nº 14.133/2021, art. 75, II, e § 3º (dispensa eletrônica)', 'Aviso de dispensa sem interessados no prazo. Republicação prevista.', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4200000-0000-4000-8000-000000000008', 'CC 001/2026', 2026, 'concorrencia', 'menor_preco_global',
   'Contratação de empresa de engenharia para reforma e cobertura metálica da Quadra Poliesportiva de Rorainópolis, incluindo piso esportivo, iluminação em LED, alambrado e acabamentos.',
   'Reforma e cobertura da quadra de Rorainópolis', 1480000.00, '2026-02-09', '2026-04-06', '2026-05-07 09:00-04', '2026-05-07 09:00-04', 'contratacao',
   '[{"fase_anterior": "publicacao", "fase_nova": "propostas", "data": "2026-05-07T09:00:00-04:00"}, {"fase_anterior": "propostas", "fase_nova": "habilitacao", "data": "2026-05-12T10:00:00-04:00"}, {"fase_anterior": "habilitacao", "fase_nova": "julgamento", "data": "2026-05-19T15:00:00-04:00"}, {"fase_anterior": "julgamento", "fase_nova": "homologacao", "data": "2026-06-01T09:00:00-04:00"}, {"fase_anterior": "homologacao", "fase_nova": "contratacao", "data": "2026-06-15T11:00:00-04:00"}]'::jsonb,
   'a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000008', NULL, '0202.2050.449051.100', '100', '27.812.0202.2050', '4.4.90.51',
   'Lei nº 14.133/2021, art. 28, II, e art. 6º, XXI (obra comum de engenharia)', 'Contrato nº 021/2026 assinado em 15/06/2026. Obra em execução.', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4200000-0000-4000-8000-000000000009', 'IN 003/2026', 2026, 'inexigibilidade', NULL,
   'Contratação de licença de uso de sistema de gestão de competições esportivas (inscrições on-line, súmulas eletrônicas, chaveamento e divulgação de resultados), com implantação, treinamento e suporte técnico, junto a fornecedor exclusivo.',
   'Sistema de gestão de competições esportivas', 96000.00, '2026-03-23', NULL, NULL, NULL, 'contratacao',
   '[{"fase_anterior": "planejamento", "fase_nova": "contratacao", "data": "2026-05-04T10:00:00-04:00"}]'::jsonb,
   'a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000008', NULL, '0202.2050.339040.100', '100', '27.812.0202.2050', '3.3.90.40',
   'Lei nº 14.133/2021, art. 74, I (fornecedor exclusivo, atestado de exclusividade juntado)', 'Contrato nº 017/2026.', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid);

-- ===================================================================== itens do planejamento (itens_processo_licitatorio)
INSERT INTO public.itens_processo_licitatorio (id, processo_id, numero_item, descricao, unidade_medida, quantidade, valor_estimado_unitario, especificacao_tecnica, marca_referencia, catmat_catser, situacao) VALUES
  ('d4220000-0000-4000-8000-000000000001', 'd4200000-0000-4000-8000-000000000001', 1, 'Refeição tipo almoço/jantar (marmitex 750 g com proteína, guarnição e salada)', 'refeição', 42000, 24.50, 'Cardápio aprovado por nutricionista; entrega nos alojamentos em embalagem térmica.', NULL, '3816', 'pendente'),
  ('d4220000-0000-4000-8000-000000000002', 'd4200000-0000-4000-8000-000000000001', 2, 'Café da manhã (kit individual com pão, fruta, bebida láctea e suco)', 'kit', 18000, 13.20, 'Kit individual embalado, servido até 7h nos alojamentos.', NULL, '3816', 'pendente'),
  ('d4220000-0000-4000-8000-000000000003', 'd4200000-0000-4000-8000-000000000001', 3, 'Lanche (sanduíche natural, fruta e suco 300 ml)', 'kit', 20000, 10.40, 'Entregue nos locais de competição.', NULL, '3816', 'pendente'),
  ('d4220000-0000-4000-8000-000000000004', 'd4200000-0000-4000-8000-000000000002', 1, 'Bola oficial de futsal, matrizada, peso 410–440 g, categoria sub-13', 'unidade', 320, 189.00, 'Câmara de butil, 32 gomos, aprovada pela confederação.', NULL, '217473', 'pendente'),
  ('d4220000-0000-4000-8000-000000000005', 'd4200000-0000-4000-8000-000000000002', 2, 'Bola oficial de voleibol, microfibra, tamanho 5', 'unidade', 240, 215.00, 'Peso 260–280 g, 18 gomos.', NULL, '217474', 'pendente'),
  ('d4220000-0000-4000-8000-000000000006', 'd4200000-0000-4000-8000-000000000002', 3, 'Colete de treino dupla face em poliéster, tamanhos P/M/G', 'unidade', 600, 22.00, 'Cores contrastantes, numeração serigrafada.', NULL, '150120', 'pendente'),
  ('d4220000-0000-4000-8000-000000000007', 'd4200000-0000-4000-8000-000000000003', 1, 'Agasalho de passeio (jaqueta e calça) em helanca, com brasão do Estado', 'conjunto', 900, 198.00, 'Lote 1. Grade de tamanhos conforme anexo do TR.', NULL, '150300', 'em_licitacao'),
  ('d4220000-0000-4000-8000-000000000008', 'd4200000-0000-4000-8000-000000000003', 2, 'Uniforme de competição (camisa e bermuda) em dry-fit sublimado', 'conjunto', 1200, 118.00, 'Lote 2. Arte fornecida pela ASCOM.', NULL, '150300', 'em_licitacao'),
  ('d4220000-0000-4000-8000-000000000009', 'd4200000-0000-4000-8000-000000000003', 3, 'Par de meiões esportivos em poliamida', 'par', 1200, 15.50, 'Lote 2.', NULL, '150301', 'em_licitacao'),
  ('d4220000-0000-4000-8000-000000000010', 'd4200000-0000-4000-8000-000000000004', 1, 'Fretamento de ônibus executivo (46 lugares) com motorista, por quilômetro rodado', 'km', 82000, 5.00, 'Veículo com até 5 anos de fabricação, ar-condicionado e banheiro.', NULL, '25070', 'em_licitacao'),
  ('d4220000-0000-4000-8000-000000000011', 'd4200000-0000-4000-8000-000000000005', 1, 'Refeição tipo almoço/jantar', 'refeição', 12000, 24.50, 'Lote 1 – alimentação.', NULL, '3816', 'adjudicado'),
  ('d4220000-0000-4000-8000-000000000012', 'd4200000-0000-4000-8000-000000000005', 2, 'Lanche individual', 'kit', 8000, 10.00, 'Lote 1 – alimentação.', NULL, '3816', 'adjudicado'),
  ('d4220000-0000-4000-8000-000000000013', 'd4200000-0000-4000-8000-000000000005', 3, 'Café da manhã', 'kit', 6000, 13.00, 'Lote 1 – alimentação.', NULL, '3816', 'adjudicado'),
  ('d4220000-0000-4000-8000-000000000014', 'd4200000-0000-4000-8000-000000000005', 4, 'Diária de hospedagem em apartamento duplo, com café da manhã', 'diária', 1800, 172.00, 'Lote 2 – hospedagem.', NULL, '3700', 'adjudicado'),
  ('d4220000-0000-4000-8000-000000000015', 'd4200000-0000-4000-8000-000000000005', 5, 'Diária de hospedagem em apartamento triplo, com café da manhã', 'diária', 900, 218.00, 'Lote 2 – hospedagem.', NULL, '3700', 'adjudicado'),
  ('d4220000-0000-4000-8000-000000000016', 'd4200000-0000-4000-8000-000000000005', 6, 'Diária de hospedagem em apartamento individual, com café da manhã', 'diária', 300, 148.00, 'Lote 2 – hospedagem.', NULL, '3700', 'adjudicado'),
  ('d4220000-0000-4000-8000-000000000017', 'd4200000-0000-4000-8000-000000000006', 1, 'Locação de tenda piramidal 10 x 10 m, com montagem', 'diária', 240, 520.00, 'Lote único.', NULL, '17345', 'fracassado'),
  ('d4220000-0000-4000-8000-000000000018', 'd4200000-0000-4000-8000-000000000006', 2, 'Locação de arquibancada modular (módulo de 100 lugares)', 'diária', 120, 980.00, 'Lote único. ART de montagem obrigatória.', NULL, '17345', 'fracassado'),
  ('d4220000-0000-4000-8000-000000000019', 'd4200000-0000-4000-8000-000000000007', 1, 'Medalha em liga metálica 60 mm com fita personalizada (ouro, prata e bronze)', 'unidade', 3600, 8.50, 'Banho conforme a colocação.', NULL, '232090', 'deserto'),
  ('d4220000-0000-4000-8000-000000000020', 'd4200000-0000-4000-8000-000000000007', 2, 'Troféu em acrílico e metal, 45 cm, com gravação', 'unidade', 120, 65.00, NULL, NULL, '232091', 'deserto'),
  ('d4220000-0000-4000-8000-000000000021', 'd4200000-0000-4000-8000-000000000008', 1, 'Reforma e cobertura da quadra poliesportiva (preço global, conforme planilha orçamentária)', 'serviço', 1, 1480000.00, 'Projeto básico, planilha SINAPI 03/2026 e cronograma físico-financeiro anexos.', NULL, '1503', 'adjudicado');

-- ===================================================================== itens da licitação (com vencedor e preço final)
INSERT INTO public.itens_licitacao (id, processo_id, numero_item, descricao, unidade_medida, quantidade, valor_unitario_estimado, valor_total_estimado, vencedor_id, valor_unitario_final, valor_total_final, situacao, observacoes) VALUES
  -- PE 001/2026 (dados-teste, encerrado): mobiliário
  ('d4210000-0000-4000-8000-000000000001', 'f4000000-0000-4000-8000-000000000001', 1, 'Mesa de trabalho em L 1,40 x 1,40 m, tampo em MDP 25 mm', 'unidade', 40, 1290.00, 51600.00, 'f1000000-0000-4000-8000-000000000001', 1150.00, 46000.00, 'adjudicado', NULL),
  ('d4210000-0000-4000-8000-000000000002', 'f4000000-0000-4000-8000-000000000001', 2, 'Cadeira giratória ergonômica com braços reguláveis (NR-17)', 'unidade', 60, 760.00, 45600.00, 'f1000000-0000-4000-8000-000000000001', 690.00, 41400.00, 'adjudicado', NULL),
  ('d4210000-0000-4000-8000-000000000003', 'f4000000-0000-4000-8000-000000000001', 3, 'Armário alto em aço com 2 portas e 4 prateleiras', 'unidade', 20, 1140.00, 22800.00, 'f1000000-0000-4000-8000-000000000001', 1230.00, 24600.00, 'adjudicado', 'Preço final acima do estimado, aceito após diligência (variação de insumos).'),
  -- PE 002/2026 (dados-teste, em julgamento): material esportivo
  ('d4210000-0000-4000-8000-000000000004', 'f4000000-0000-4000-8000-000000000002', 1, 'Bola oficial de basquetebol, tamanho 7, em couro sintético', 'unidade', 150, 260.00, 39000.00, NULL, NULL, NULL, 'em_julgamento', NULL),
  ('d4210000-0000-4000-8000-000000000005', 'f4000000-0000-4000-8000-000000000002', 2, 'Rede oficial de voleibol com antenas', 'unidade', 40, 420.00, 16800.00, NULL, NULL, NULL, 'em_julgamento', NULL),
  ('d4210000-0000-4000-8000-000000000006', 'f4000000-0000-4000-8000-000000000002', 3, 'Kit de cones e chapéus chineses para treinamento (50 peças)', 'kit', 200, 146.00, 29200.00, NULL, NULL, NULL, 'em_julgamento', NULL),
  -- PE 009/2026 (habilitação)
  ('d4210000-0000-4000-8000-000000000007', 'd4200000-0000-4000-8000-000000000004', 1, 'Fretamento de ônibus executivo com motorista, por km rodado', 'km', 82000, 5.00, 410000.00, NULL, 4.62, 378840.00, 'em_habilitacao', 'Arrematante provisória: Vale do Branco Transportes.'),
  -- PE 006/2026 (homologado, SRP)
  ('d4210000-0000-4000-8000-000000000008', 'd4200000-0000-4000-8000-000000000005', 1, 'Lote 1 – Alimentação (refeição, lanche e café da manhã)', 'lote', 1, 448000.00, 448000.00, 'd4100000-0000-4000-8000-000000000001', 439600.00, 439600.00, 'homologado', 'Ata de Registro de Preços nº 004/2026.'),
  ('d4210000-0000-4000-8000-000000000009', 'd4200000-0000-4000-8000-000000000005', 2, 'Lote 2 – Hospedagem (apartamentos individual, duplo e triplo)', 'lote', 1, 549000.00, 549000.00, 'd4100000-0000-4000-8000-000000000002', 528000.00, 528000.00, 'homologado', 'Ata de Registro de Preços nº 005/2026.'),
  -- PE 007/2026 (fracassado)
  ('d4210000-0000-4000-8000-000000000010', 'd4200000-0000-4000-8000-000000000006', 1, 'Lote único – Locação de estruturas temporárias para eventos', 'lote', 1, 265000.00, 265000.00, NULL, NULL, NULL, 'fracassado', 'Todas as propostas desclassificadas.'),
  -- DE 018/2026 (deserto)
  ('d4210000-0000-4000-8000-000000000011', 'd4200000-0000-4000-8000-000000000007', 1, 'Medalhas e troféus – Jogos Abertos de Roraima 2026', 'lote', 1, 38400.00, 38400.00, NULL, NULL, NULL, 'deserto', 'Nenhum fornecedor apresentou proposta.'),
  -- CC 001/2026 (contratação)
  ('d4210000-0000-4000-8000-000000000012', 'd4200000-0000-4000-8000-000000000008', 1, 'Reforma e cobertura da quadra poliesportiva de Rorainópolis (global)', 'serviço', 1, 1480000.00, 1480000.00, 'd4100000-0000-4000-8000-000000000003', 1392750.00, 1392750.00, 'homologado', 'Desconto global de 5,9% sobre o orçamento de referência.'),
  -- IN 003/2026 (contratação)
  ('d4210000-0000-4000-8000-000000000013', 'd4200000-0000-4000-8000-000000000009', 1, 'Licença anual, implantação e suporte do sistema de gestão de competições', 'serviço', 1, 96000.00, 96000.00, 'd4100000-0000-4000-8000-000000000005', 96000.00, 96000.00, 'homologado', 'Contratação direta por inexigibilidade.');

-- ===================================================================== propostas
INSERT INTO public.propostas_licitacao (id, processo_id, item_id, fornecedor_id, valor_unitario, valor_total, marca, modelo, classificacao, vencedora, desclassificada, motivo_desclassificacao, data_proposta, observacoes) VALUES
  -- PE 001/2026 (encerrado)
  ('d4230000-0000-4000-8000-000000000001', 'f4000000-0000-4000-8000-000000000001', 'd4210000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001', 1150.00, 46000.00, 'Linha Office', 'L140', 1, true, false, NULL, '2026-02-25 09:00-04', NULL),
  ('d4230000-0000-4000-8000-000000000002', 'f4000000-0000-4000-8000-000000000001', 'd4210000-0000-4000-8000-000000000001', 'd4100000-0000-4000-8000-000000000004', 1238.00, 49520.00, 'Movel Pro', 'ML-14', 2, false, false, NULL, '2026-02-25 09:00-04', NULL),
  -- PE 002/2026 (julgamento)
  ('d4230000-0000-4000-8000-000000000003', 'f4000000-0000-4000-8000-000000000002', 'd4210000-0000-4000-8000-000000000004', 'd4100000-0000-4000-8000-000000000004', 231.90, 34785.00, 'Penalty', 'Crossover 7', 1, false, false, NULL, '2026-10-08 09:00-04', 'Amostra solicitada em 15/10/2026.'),
  ('d4230000-0000-4000-8000-000000000004', 'f4000000-0000-4000-8000-000000000002', 'd4210000-0000-4000-8000-000000000004', 'f1000000-0000-4000-8000-000000000003', 244.00, 36600.00, 'Molten', 'BG3800', 2, false, false, NULL, '2026-10-08 09:00-04', NULL),
  ('d4230000-0000-4000-8000-000000000005', 'f4000000-0000-4000-8000-000000000002', 'd4210000-0000-4000-8000-000000000005', 'f1000000-0000-4000-8000-000000000003', 398.00, 15920.00, 'Pentagol', 'Oficial 4 lonas', 1, false, false, NULL, '2026-10-08 09:00-04', NULL),
  ('d4230000-0000-4000-8000-000000000006', 'f4000000-0000-4000-8000-000000000002', 'd4210000-0000-4000-8000-000000000006', 'd4100000-0000-4000-8000-000000000004', 139.50, 27900.00, 'Kallango', 'KT-50', 1, false, false, NULL, '2026-10-08 09:00-04', NULL),
  -- PE 009/2026 (habilitação)
  ('d4230000-0000-4000-8000-000000000007', 'd4200000-0000-4000-8000-000000000004', 'd4210000-0000-4000-8000-000000000007', 'd4100000-0000-4000-8000-000000000009', 4.62, 378840.00, NULL, 'Ônibus executivo 46 lugares', 1, false, false, NULL, '2026-10-14 09:00-04', 'Arrematante; habilitação em análise.'),
  ('d4230000-0000-4000-8000-000000000008', 'd4200000-0000-4000-8000-000000000004', 'd4210000-0000-4000-8000-000000000007', 'd4100000-0000-4000-8000-000000000008', 4.79, 392780.00, NULL, 'Ônibus executivo 44 lugares', 2, false, false, NULL, '2026-10-14 09:00-04', NULL),
  -- PE 006/2026 (homologado)
  ('d4230000-0000-4000-8000-000000000009', 'd4200000-0000-4000-8000-000000000005', 'd4210000-0000-4000-8000-000000000008', 'd4100000-0000-4000-8000-000000000001', 439600.00, 439600.00, NULL, NULL, 1, true, false, NULL, '2026-05-12 09:00-04', NULL),
  ('d4230000-0000-4000-8000-000000000010', 'd4200000-0000-4000-8000-000000000005', 'd4210000-0000-4000-8000-000000000009', 'd4100000-0000-4000-8000-000000000002', 528000.00, 528000.00, NULL, NULL, 1, true, false, NULL, '2026-05-12 09:00-04', NULL),
  -- PE 007/2026 (fracassado)
  ('d4230000-0000-4000-8000-000000000011', 'd4200000-0000-4000-8000-000000000006', 'd4210000-0000-4000-8000-000000000010', 'd4100000-0000-4000-8000-000000000007', 318500.00, 318500.00, NULL, NULL, NULL, false, true, 'Preço final 20,2% acima do valor estimado; licitante não aceitou reduzir na negociação (art. 61 da Lei nº 14.133/2021).', '2026-06-23 09:00-04', NULL),
  ('d4230000-0000-4000-8000-000000000012', 'd4200000-0000-4000-8000-000000000006', 'd4210000-0000-4000-8000-000000000010', 'f1000000-0000-4000-8000-000000000003', 249000.00, 249000.00, NULL, NULL, NULL, false, true, 'Atestado de capacidade técnica não comprova montagem de arquibancadas nem apresenta ART.', '2026-06-23 09:00-04', NULL),
  -- CC 001/2026
  ('d4230000-0000-4000-8000-000000000013', 'd4200000-0000-4000-8000-000000000008', 'd4210000-0000-4000-8000-000000000012', 'd4100000-0000-4000-8000-000000000003', 1392750.00, 1392750.00, NULL, NULL, 1, true, false, NULL, '2026-05-07 09:00-04', NULL),
  -- IN 003/2026
  ('d4230000-0000-4000-8000-000000000014', 'd4200000-0000-4000-8000-000000000009', 'd4210000-0000-4000-8000-000000000013', 'd4100000-0000-4000-8000-000000000005', 96000.00, 96000.00, 'Placar Digital', 'Gestão de Competições 4.0', 1, true, false, NULL, '2026-04-10 10:00-04', 'Proposta única (fornecedor exclusivo).');

-- ===================================================================== documentos preparatórios (o arquivo fica no SEI; aqui só o registro)
INSERT INTO public.documentos_preparatorios_licitacao (id, processo_licitatorio_id, tipo, titulo, descricao, numero_documento, data_documento, responsavel_id, aprovado, aprovado_por, aprovado_em, observacoes, versao) VALUES
  ('d4240000-0000-4000-8000-000000000001', 'd4200000-0000-4000-8000-000000000001', 'etp', 'Estudo Técnico Preliminar – alimentação JERs 2027', 'Levantamento de demanda por etapa e modalidade, com base no consumo dos JERs 2026.', 'SEI 2148736', '2026-10-16', 'c0000000-0000-4000-8000-000000000013', false, NULL, NULL, 'Em elaboração pela Diretoria de Esporte.', 1),
  ('d4240000-0000-4000-8000-000000000002', 'd4200000-0000-4000-8000-000000000001', 'pesquisa_precos', 'Pesquisa de preços – refeições e kits', 'Painel de Preços, contratações similares de outros entes e três cotações locais.', NULL, NULL, 'c0000000-0000-4000-8000-000000000011', false, NULL, NULL, 'Aguardando retorno de cotações.', 1),
  ('d4240000-0000-4000-8000-000000000003', 'd4200000-0000-4000-8000-000000000002', 'etp', 'Estudo Técnico Preliminar – kits esportivos', NULL, 'SEI 2051190', '2026-09-22', 'c0000000-0000-4000-8000-000000000013', true, 'c0000000-0000-4000-8000-000000000004', '2026-09-25 16:20-04', NULL, 1),
  ('d4240000-0000-4000-8000-000000000004', 'd4200000-0000-4000-8000-000000000002', 'termo_referencia', 'Termo de Referência – kits esportivos', 'Versão 2 com ajuste das especificações das bolas de voleibol.', 'SEI 2119044', '2026-10-09', 'c0000000-0000-4000-8000-000000000011', false, NULL, NULL, 'Em revisão.', 2),
  ('d4240000-0000-4000-8000-000000000005', 'd4200000-0000-4000-8000-000000000003', 'termo_referencia', 'Termo de Referência – uniformes das delegações', NULL, 'SEI 1903377', '2026-08-28', 'c0000000-0000-4000-8000-000000000011', true, 'c0000000-0000-4000-8000-000000000003', '2026-09-02 10:00-04', NULL, 1),
  ('d4240000-0000-4000-8000-000000000006', 'd4200000-0000-4000-8000-000000000003', 'parecer_juridico', 'Parecer jurídico sobre a minuta do edital', NULL, 'Parecer nº 141/2026/ASJUR', '2026-09-18', 'c0000000-0000-4000-8000-000000000017', true, 'c0000000-0000-4000-8000-000000000003', '2026-09-21 09:00-04', 'Favorável com recomendações atendidas.', 1),
  ('d4240000-0000-4000-8000-000000000007', 'd4200000-0000-4000-8000-000000000003', 'minuta_edital', 'Edital do Pregão Eletrônico nº 011/2026', NULL, 'SEI 2088410', '2026-10-14', 'c0000000-0000-4000-8000-000000000011', true, 'c0000000-0000-4000-8000-000000000002', '2026-10-14 17:30-04', NULL, 1),
  ('d4240000-0000-4000-8000-000000000008', 'd4200000-0000-4000-8000-000000000004', 'dotacao_orcamentaria', 'Declaração de disponibilidade orçamentária', NULL, 'SEI 1785502', '2026-08-31', 'c0000000-0000-4000-8000-000000000007', true, 'c0000000-0000-4000-8000-000000000003', '2026-09-01 11:00-04', NULL, 1),
  ('d4240000-0000-4000-8000-000000000009', 'd4200000-0000-4000-8000-000000000004', 'mapa_riscos', 'Mapa de riscos da contratação', 'Riscos de indisponibilidade de frota e de atraso nos deslocamentos.', 'SEI 1785519', '2026-08-31', 'c0000000-0000-4000-8000-000000000011', true, 'c0000000-0000-4000-8000-000000000003', '2026-09-01 11:00-04', NULL, 1),
  ('d4240000-0000-4000-8000-000000000010', 'd4200000-0000-4000-8000-000000000005', 'autorizacao', 'Autorização da Presidência para abertura do certame', NULL, 'SEI 1210933', '2026-04-15', 'c0000000-0000-4000-8000-000000000002', true, 'c0000000-0000-4000-8000-000000000002', '2026-04-15 15:00-04', NULL, 1),
  ('d4240000-0000-4000-8000-000000000011', 'd4200000-0000-4000-8000-000000000008', 'projeto_basico', 'Projeto básico e planilha orçamentária (SINAPI 03/2026)', NULL, 'SEI 0988215', '2026-03-10', 'c0000000-0000-4000-8000-000000000013', true, 'c0000000-0000-4000-8000-000000000003', '2026-03-16 10:30-04', 'ART nº 1820260031455 (projetista).', 1),
  ('d4240000-0000-4000-8000-000000000012', 'd4200000-0000-4000-8000-000000000008', 'minuta_contrato', 'Minuta do contrato de obra', NULL, 'SEI 1015530', '2026-03-24', 'c0000000-0000-4000-8000-000000000017', true, 'c0000000-0000-4000-8000-000000000003', '2026-03-27 09:00-04', NULL, 1),
  ('d4240000-0000-4000-8000-000000000013', 'd4200000-0000-4000-8000-000000000009', 'outro', 'Atestado de exclusividade do fornecedor', 'Emitido por entidade representativa do setor de software.', 'SEI 1120874', '2026-04-03', 'c0000000-0000-4000-8000-000000000011', true, 'c0000000-0000-4000-8000-000000000003', '2026-04-08 14:00-04', NULL, 1);

-- ===================================================================== contratos novos
INSERT INTO public.contratos (id, numero_contrato, ano, processo_licitatorio_id, fornecedor_id, objeto, objeto_resumido, valor_inicial, valor_atual, valor_executado, saldo_contrato,
  data_assinatura, data_inicio, data_fim, data_fim_atual, status, gestor_id, fiscal_id, garantia_tipo, garantia_valor, garantia_vencimento, dotacao_orcamentaria, fonte_recurso,
  data_publicacao_doe, numero_doe, observacoes, created_by) VALUES
  ('d4300000-0000-4000-8000-000000000001', '019/2026', 2026, 'd4200000-0000-4000-8000-000000000005', 'd4100000-0000-4000-8000-000000000001',
   'Fornecimento de alimentação (refeições, lanches e café da manhã) para atletas e comissões técnicas das competições estaduais de 2026, conforme Ata de Registro de Preços nº 004/2026.',
   'Alimentação de delegações (ARP 004/2026)', 312200.00, 312200.00, 0, 312200.00, '2026-06-30', '2026-07-01', '2027-06-30', '2027-06-30', 'vigente',
   'c0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000013', NULL, NULL, NULL, '0202.2050.339039.100', '100', '2026-07-07', '4.973', NULL, NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4300000-0000-4000-8000-000000000002', '021/2026', 2026, 'd4200000-0000-4000-8000-000000000008', 'd4100000-0000-4000-8000-000000000003',
   'Execução de obra de reforma e cobertura metálica da Quadra Poliesportiva de Rorainópolis, com piso esportivo, iluminação em LED, alambrado e acabamentos, sob regime de empreitada por preço global.',
   'Reforma e cobertura da quadra de Rorainópolis', 1392750.00, 1392750.00, 0, 1392750.00, '2026-06-15', '2026-06-22', '2026-12-18', '2027-03-18', 'vigente',
   'c0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000013', 'seguro_garantia', 69637.50, '2027-06-18', '0202.2050.449051.100', '100', '2026-06-17', '4.959',
   'Ordem de serviço emitida em 22/06/2026. Prazo prorrogado pelo 1º Termo Aditivo.', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4300000-0000-4000-8000-000000000003', '017/2026', 2026, 'd4200000-0000-4000-8000-000000000009', 'd4100000-0000-4000-8000-000000000005',
   'Licença de uso, implantação, treinamento e suporte técnico de sistema de gestão de competições esportivas, por 12 meses.',
   'Sistema de gestão de competições', 96000.00, 120000.00, 0, 120000.00, '2026-05-04', '2026-05-04', '2027-05-03', '2027-05-03', 'vigente',
   'c0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000014', NULL, NULL, NULL, '0202.2050.339040.100', '100', '2026-05-08', '4.935',
   'Valor acrescido em 25% pelo 1º Termo Aditivo (inclusão de 20 competições).', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4300000-0000-4000-8000-000000000004', '009/2025', 2025, NULL, 'd4100000-0000-4000-8000-000000000008',
   'Prestação de serviço de transporte rodoviário de delegações esportivas, com ônibus executivo e motorista, para competições no interior do Estado.',
   'Transporte de delegações (rescindido)', 240000.00, 240000.00, 0, 240000.00, '2025-04-10', '2025-04-10', '2026-04-09', '2026-02-15', 'vigente',
   'c0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000013', 'caucao', 12000.00, '2026-07-09', '0202.2050.339033.100', '100', '2025-04-14', '4.702',
   'Rescindido unilateralmente em 15/02/2026 por inexecução parcial (art. 137, I, da Lei nº 14.133/2021). Garantia executada.', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4300000-0000-4000-8000-000000000005', '022/2026', 2026, 'd4200000-0000-4000-8000-000000000005', 'd4100000-0000-4000-8000-000000000002',
   'Prestação de serviços de hospedagem para atletas e comissões de arbitragem dos Jogos Abertos de Roraima, conforme Ata de Registro de Preços nº 005/2026.',
   'Hospedagem – Jogos Abertos (ARP 005/2026)', 141000.00, 141000.00, 0, 141000.00, '2026-11-03', '2026-11-05', '2027-02-05', '2027-02-05', 'rascunho',
   'c0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000013', NULL, NULL, NULL, '0202.2050.339039.100', '100', NULL, NULL,
   'Minuta em conferência; assinatura prevista após a emissão do empenho.', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid);

-- ===================================================================== publicações legais (DOE / PNCP)
INSERT INTO public.publicacoes_legais (id, processo_licitatorio_id, contrato_id, veiculo, tipo_publicacao, numero_publicacao, data_publicacao, pagina, secao, url_publicacao, conteudo_resumido, pncp_id, pncp_sequencial, pncp_sincronizado, pncp_sincronizado_em) VALUES
  ('d4250000-0000-4000-8000-000000000001', 'd4200000-0000-4000-8000-000000000003', NULL, 'doe', 'aviso_licitacao', 'DOE nº 5.034', '2026-10-15', '42', 'Atos do Poder Executivo', NULL, 'Aviso do Pregão Eletrônico nº 011/2026 – uniformes esportivos. Sessão em 04/11/2026.', NULL, NULL, false, NULL),
  ('d4250000-0000-4000-8000-000000000002', 'd4200000-0000-4000-8000-000000000003', NULL, 'pncp', 'edital', NULL, '2026-10-15', NULL, NULL, NULL, 'Edital do Pregão Eletrônico nº 011/2026.', '64689510000109-1-000011/2026', 11, true, '2026-10-15 09:12-04'),
  ('d4250000-0000-4000-8000-000000000003', 'd4200000-0000-4000-8000-000000000004', NULL, 'doe', 'aviso_licitacao', 'DOE nº 5.019', '2026-09-28', '37', 'Atos do Poder Executivo', NULL, 'Aviso do Pregão Eletrônico nº 009/2026 – transporte rodoviário de delegações.', NULL, NULL, false, NULL),
  ('d4250000-0000-4000-8000-000000000004', 'd4200000-0000-4000-8000-000000000005', NULL, 'doe', 'homologacao', 'DOE nº 4.951', '2026-06-05', '29', 'Atos do Poder Executivo', NULL, 'Homologação e adjudicação do Pregão Eletrônico nº 006/2026 (SRP).', NULL, NULL, false, NULL),
  ('d4250000-0000-4000-8000-000000000005', 'd4200000-0000-4000-8000-000000000005', NULL, 'pncp', 'ata_registro_preco', NULL, '2026-06-12', NULL, NULL, NULL, 'Atas de Registro de Preços nº 004/2026 e 005/2026.', '64689510000109-1-000006/2026', 6, true, '2026-06-12 10:40-04'),
  ('d4250000-0000-4000-8000-000000000006', 'd4200000-0000-4000-8000-000000000006', NULL, 'doe', 'resultado', 'DOE nº 4.972', '2026-07-06', '18', 'Atos do Poder Executivo', NULL, 'Pregão Eletrônico nº 007/2026 declarado fracassado.', NULL, NULL, false, NULL),
  ('d4250000-0000-4000-8000-000000000007', 'd4200000-0000-4000-8000-000000000007', NULL, 'site', 'resultado', NULL, '2026-09-11', NULL, NULL, NULL, 'Dispensa Eletrônica nº 018/2026 deserta (sem propostas).', NULL, NULL, false, NULL),
  ('d4250000-0000-4000-8000-000000000008', 'd4200000-0000-4000-8000-000000000008', 'd4300000-0000-4000-8000-000000000002', 'doe', 'extrato_contrato', 'DOE nº 4.959', '2026-06-17', '33', 'Atos do Poder Executivo', NULL, 'Extrato do Contrato nº 021/2026 – Construtora Paricarana Engenharia e Serviços Ltda – R$ 1.392.750,00.', NULL, NULL, false, NULL),
  ('d4250000-0000-4000-8000-000000000009', NULL, 'd4300000-0000-4000-8000-000000000002', 'pncp', 'extrato_contrato', NULL, '2026-06-17', NULL, NULL, NULL, 'Contrato nº 021/2026.', '64689510000109-2-000021/2026', 21, true, '2026-06-17 11:05-04'),
  ('d4250000-0000-4000-8000-000000000010', NULL, 'd4300000-0000-4000-8000-000000000002', 'doe', 'extrato_aditivo', 'DOE nº 5.026', '2026-10-06', '25', 'Atos do Poder Executivo', NULL, '1º Termo Aditivo ao Contrato nº 021/2026 – prorrogação de prazo por 90 dias.', NULL, NULL, false, NULL),
  ('d4250000-0000-4000-8000-000000000011', 'd4200000-0000-4000-8000-000000000009', 'd4300000-0000-4000-8000-000000000003', 'doe', 'extrato_contrato', 'DOE nº 4.935', '2026-05-08', '21', 'Atos do Poder Executivo', NULL, 'Extrato do Contrato nº 017/2026 (inexigibilidade, art. 74, I) – Placar Digital Sistemas Esportivos Ltda.', NULL, NULL, false, NULL),
  ('d4250000-0000-4000-8000-000000000012', 'd4200000-0000-4000-8000-000000000005', 'd4300000-0000-4000-8000-000000000001', 'doe', 'extrato_contrato', 'DOE nº 4.973', '2026-07-07', '30', 'Atos do Poder Executivo', NULL, 'Extrato do Contrato nº 019/2026 – Norte Sabor Refeições Coletivas Ltda (adesão à ARP 004/2026).', NULL, NULL, false, NULL);

-- ===================================================================== atas de registro de preço (PE 006/2026)
INSERT INTO public.atas_registro_preco (id, processo_id, numero_ata, ano, fornecedor_id, data_assinatura, data_publicacao_doe, numero_doe, data_vigencia_inicio, data_vigencia_fim,
  valor_total_registrado, saldo_disponivel, objeto, fundamentacao_legal, situacao, orgao_gerenciador, observacoes, created_by) VALUES
  ('d4400000-0000-4000-8000-000000000001', 'd4200000-0000-4000-8000-000000000005', '004/2026', 2026, 'd4100000-0000-4000-8000-000000000001', '2026-06-10', '2026-06-12', '4.956',
   '2026-06-12', '2027-06-11', 439600.00, 127400.00, 'Registro de preços de alimentação (refeições, lanches e café da manhã) para delegações em competições estaduais – Lote 1.',
   'Lei nº 14.133/2021, art. 82 e seguintes', 'vigente', 'Instituto de Desporto, Juventude e Lazer do Estado de Roraima – IDJuv', 'Contrato nº 019/2026 firmado com base nesta ata.', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4400000-0000-4000-8000-000000000002', 'd4200000-0000-4000-8000-000000000005', '005/2026', 2026, 'd4100000-0000-4000-8000-000000000002', '2026-06-10', '2026-06-12', '4.956',
   '2026-06-12', '2027-06-11', 528000.00, 528000.00, 'Registro de preços de hospedagem em apartamentos individual, duplo e triplo, com café da manhã – Lote 2.',
   'Lei nº 14.133/2021, art. 82 e seguintes', 'vigente', 'Instituto de Desporto, Juventude e Lazer do Estado de Roraima – IDJuv', 'Contrato nº 022/2026 em elaboração.', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid);

INSERT INTO public.itens_ata_registro_preco (id, ata_id, item_licitatorio_id, numero_item, descricao, unidade_medida, quantidade_registrada, quantidade_consumida, valor_unitario, marca, modelo, situacao) VALUES
  ('d4410000-0000-4000-8000-000000000001', 'd4400000-0000-4000-8000-000000000001', 'd4220000-0000-4000-8000-000000000011', 1, 'Refeição tipo almoço/jantar (marmitex 750 g)', 'refeição', 12000, 8000, 23.90, NULL, NULL, 'disponivel'),
  ('d4410000-0000-4000-8000-000000000002', 'd4400000-0000-4000-8000-000000000001', 'd4220000-0000-4000-8000-000000000012', 2, 'Lanche individual (sanduíche, fruta e suco)', 'kit', 8000, 6000, 9.50, NULL, NULL, 'disponivel'),
  ('d4410000-0000-4000-8000-000000000003', 'd4400000-0000-4000-8000-000000000001', 'd4220000-0000-4000-8000-000000000013', 3, 'Café da manhã (kit individual)', 'kit', 6000, 5000, 12.80, NULL, NULL, 'disponivel'),
  ('d4410000-0000-4000-8000-000000000004', 'd4400000-0000-4000-8000-000000000002', 'd4220000-0000-4000-8000-000000000014', 1, 'Diária em apartamento duplo, com café da manhã', 'diária', 1800, 0, 165.00, NULL, NULL, 'disponivel'),
  ('d4410000-0000-4000-8000-000000000005', 'd4400000-0000-4000-8000-000000000002', 'd4220000-0000-4000-8000-000000000015', 2, 'Diária em apartamento triplo, com café da manhã', 'diária', 900, 0, 210.00, NULL, NULL, 'disponivel'),
  ('d4410000-0000-4000-8000-000000000006', 'd4400000-0000-4000-8000-000000000002', 'd4220000-0000-4000-8000-000000000016', 3, 'Diária em apartamento individual, com café da manhã', 'diária', 300, 0, 140.00, NULL, NULL, 'disponivel');

-- ===================================================================== itens dos contratos
INSERT INTO public.itens_contrato (id, contrato_id, item_ata_id, numero_item, descricao, unidade_medida, quantidade, quantidade_entregue, valor_unitario, situacao) VALUES
  -- 019/2026 (alimentação, da ARP 004/2026)
  ('d4320000-0000-4000-8000-000000000001', 'd4300000-0000-4000-8000-000000000001', 'd4410000-0000-4000-8000-000000000001', 1, 'Refeição tipo almoço/jantar (marmitex 750 g)', 'refeição', 8000, 4630, 23.90, 'parcial'),
  ('d4320000-0000-4000-8000-000000000002', 'd4300000-0000-4000-8000-000000000001', 'd4410000-0000-4000-8000-000000000002', 2, 'Lanche individual (sanduíche, fruta e suco)', 'kit', 6000, 2900, 9.50, 'parcial'),
  ('d4320000-0000-4000-8000-000000000003', 'd4300000-0000-4000-8000-000000000001', 'd4410000-0000-4000-8000-000000000003', 3, 'Café da manhã (kit individual)', 'kit', 5000, 2580, 12.80, 'parcial'),
  -- 021/2026 (obra)
  ('d4320000-0000-4000-8000-000000000004', 'd4300000-0000-4000-8000-000000000002', NULL, 1, 'Serviços preliminares, canteiro e demolições', 'vb', 1, 1, 86450.00, 'entregue'),
  ('d4320000-0000-4000-8000-000000000005', 'd4300000-0000-4000-8000-000000000002', NULL, 2, 'Estrutura metálica e cobertura em telha termoacústica', 'm²', 1250, 860, 612.00, 'parcial'),
  ('d4320000-0000-4000-8000-000000000006', 'd4300000-0000-4000-8000-000000000002', NULL, 3, 'Piso esportivo em concreto polido com pintura demarcatória', 'm²', 980, 0, 238.50, 'pendente'),
  ('d4320000-0000-4000-8000-000000000007', 'd4300000-0000-4000-8000-000000000002', NULL, 4, 'Instalações elétricas e iluminação em LED', 'vb', 1, 0, 187320.00, 'pendente'),
  ('d4320000-0000-4000-8000-000000000008', 'd4300000-0000-4000-8000-000000000002', NULL, 5, 'Alambrado, pintura geral e acabamentos', 'vb', 1, 0, 120250.00, 'pendente'),
  -- 017/2026 (software)
  ('d4320000-0000-4000-8000-000000000009', 'd4300000-0000-4000-8000-000000000003', NULL, 1, 'Licença anual de uso do sistema (até 40 competições)', 'licença', 1, 1, 72000.00, 'entregue'),
  ('d4320000-0000-4000-8000-000000000010', 'd4300000-0000-4000-8000-000000000003', NULL, 2, 'Implantação, migração de dados e treinamento de 30 usuários', 'serviço', 1, 1, 12000.00, 'entregue'),
  ('d4320000-0000-4000-8000-000000000011', 'd4300000-0000-4000-8000-000000000003', NULL, 3, 'Suporte técnico e manutenção evolutiva', 'mês', 12, 5, 1000.00, 'parcial'),
  ('d4320000-0000-4000-8000-000000000012', 'd4300000-0000-4000-8000-000000000003', NULL, 4, 'Ampliação da licença em 20 competições (1º Termo Aditivo)', 'licença', 1, 0, 24000.00, 'pendente'),
  -- 022/2026 (hospedagem, rascunho)
  ('d4320000-0000-4000-8000-000000000013', 'd4300000-0000-4000-8000-000000000005', 'd4410000-0000-4000-8000-000000000004', 1, 'Diária em apartamento duplo, com café da manhã', 'diária', 600, 0, 165.00, 'pendente'),
  ('d4320000-0000-4000-8000-000000000014', 'd4300000-0000-4000-8000-000000000005', 'd4410000-0000-4000-8000-000000000005', 2, 'Diária em apartamento triplo, com café da manhã', 'diária', 200, 0, 210.00, 'pendente'),
  -- 001/2026 (dados-teste, mobiliário)
  ('d4320000-0000-4000-8000-000000000015', 'f5000000-0000-4000-8000-000000000001', NULL, 1, 'Mesa de trabalho em L 1,40 x 1,40 m', 'unidade', 40, 20, 1150.00, 'parcial'),
  ('d4320000-0000-4000-8000-000000000016', 'f5000000-0000-4000-8000-000000000001', NULL, 2, 'Cadeira giratória ergonômica com braços reguláveis', 'unidade', 60, 30, 690.00, 'parcial'),
  ('d4320000-0000-4000-8000-000000000017', 'f5000000-0000-4000-8000-000000000001', NULL, 3, 'Armário alto em aço com 2 portas', 'unidade', 20, 10, 1230.00, 'parcial'),
  -- 002/2026 (dados-teste, limpeza)
  ('d4320000-0000-4000-8000-000000000018', 'f5000000-0000-4000-8000-000000000002', NULL, 1, 'Serviço de limpeza e conservação do ginásio (2 postos, 44 h semanais)', 'mês', 8, 6, 6000.00, 'parcial'),
  -- 015/2025 (dados-teste, encerrado)
  ('d4320000-0000-4000-8000-000000000019', 'f5000000-0000-4000-8000-000000000003', NULL, 1, 'Manutenção preventiva e corretiva de microcomputadores e impressoras', 'mês', 12, 12, 2500.00, 'entregue');

-- ===================================================================== alterações (aditivos, apostilamento, rescisão)
-- valor atual e fim atual saem daqui (contratos_preparar recalcula a cada alteração)
INSERT INTO public.contrato_alteracoes (id, contrato_id, especie, numero, altera_prazo, altera_valor, altera_objeto, motivo, valor_acrescimo, valor_supressao,
  valor_variacao, percentual, indice, nova_data_fim, data_inicio, descricao, justificativa, fundamento_legal, documento_sei, data_assinatura, data_publicacao_doe, numero_doe, created_by) VALUES
  ('d4310000-0000-4000-8000-000000000001', 'd4300000-0000-4000-8000-000000000002', 'aditivo', 1, true, false, false, NULL, 0, 0, 0, NULL, NULL, '2027-03-18', NULL,
   'Prorrogação do prazo de execução da obra por 90 dias.',
   'Chuvas acima da média em agosto e setembro impediram a montagem da cobertura (relatório do fiscal e diário de obra).', 'Lei nº 14.133/2021, art. 107 e art. 124, I', '1523301', '2026-10-01', '2026-10-06', '5.026', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4310000-0000-4000-8000-000000000002', 'd4300000-0000-4000-8000-000000000003', 'aditivo', 1, false, true, false, NULL, 24000.00, 0, 0, NULL, NULL, NULL, NULL,
   'Acréscimo quantitativo de 25% para ampliação da licença em 20 competições.',
   'Inclusão das etapas municipais dos JERs no sistema, não previstas no dimensionamento inicial.', 'Lei nº 14.133/2021, art. 125', '1388412', '2026-08-20', '2026-08-25', '4.990', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4310000-0000-4000-8000-000000000003', 'f5000000-0000-4000-8000-000000000002', 'aditivo', 1, true, true, false, NULL, 36000.00, 0, 0, NULL, NULL, '2027-05-31', NULL,
   'Prorrogação da vigência por 6 meses, com acréscimo do valor correspondente.',
   'Serviço contínuo com execução satisfatória; pesquisa de preços demonstra vantajosidade da prorrogação.', 'Lei nº 14.133/2021, art. 107', '1560077', '2026-10-20', NULL, NULL, NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4310000-0000-4000-8000-000000000004', 'f5000000-0000-4000-8000-000000000001', 'aditivo', 1, false, true, false, NULL, 0, 5600.00, 0, NULL, NULL, NULL, NULL,
   'Supressão de 5% do valor contratado (redução de cadeiras do lote do auditório).',
   'Readequação do layout do auditório, que dispensou parte das cadeiras.', 'Lei nº 14.133/2021, art. 125', '1290154', '2026-07-14', '2026-07-17', '4.980', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4310000-0000-4000-8000-000000000005', 'd4300000-0000-4000-8000-000000000001', 'apostilamento', 1, false, false, false, 'dotacao', 0, 0, 0, NULL, NULL, NULL, NULL,
   'Inclusão da dotação 0202.2050.339039.101 (fonte 101) para as despesas de 2027.',
   NULL, 'Lei nº 14.133/2021, art. 136, IV', '1571203', '2026-10-15', NULL, NULL, NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4310000-0000-4000-8000-000000000006', 'd4300000-0000-4000-8000-000000000004', 'rescisao', NULL, false, false, false, 'unilateral', 0, 0, 0, NULL, NULL, NULL, '2026-02-15',
   'Rescisão unilateral por inexecução parcial.',
   'Três viagens não realizadas e frota abaixo do exigido, após notificação e prazo de defesa.', 'Lei nº 14.133/2021, art. 137, I, e art. 138, I', '0876540', '2026-02-13', '2026-02-18', '4.887', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid);

-- ===================================================================== medições
-- o trigger atualizar_saldo_contrato recalcula valor_executado/saldo a cada medição (ver ajuste no fim)
INSERT INTO public.medicoes_contrato (id, contrato_id, numero_medicao, periodo_inicio, periodo_fim, valor_medido, valor_aprovado, status, data_envio, data_aprovacao, aprovado_por,
  data_pagamento, nota_fiscal_numero, nota_fiscal_data, nota_fiscal_valor, observacoes, motivo_rejeicao, created_by) VALUES
  -- 021/2026 obra
  ('d4330000-0000-4000-8000-000000000001', 'd4300000-0000-4000-8000-000000000002', 1, '2026-06-22', '2026-07-31', 208912.50, 208912.50, 'paga', '2026-08-03 10:00-04', '2026-08-07 15:30-04', 'c0000000-0000-4000-8000-000000000013', '2026-08-20', '1187', '2026-08-04', 208912.50, 'Canteiro, demolições e fundações da cobertura.', NULL, NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4330000-0000-4000-8000-000000000002', 'd4300000-0000-4000-8000-000000000002', 2, '2026-08-01', '2026-08-31', 278550.00, 278550.00, 'paga', '2026-09-02 09:20-04', '2026-09-08 11:00-04', 'c0000000-0000-4000-8000-000000000013', '2026-09-22', '1204', '2026-09-03', 278550.00, 'Montagem de 40% da estrutura metálica.', NULL, NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4330000-0000-4000-8000-000000000003', 'd4300000-0000-4000-8000-000000000002', 3, '2026-09-01', '2026-09-30', 341900.00, 334260.00, 'aprovada', '2026-10-02 08:45-04', '2026-10-09 16:10-04', 'c0000000-0000-4000-8000-000000000013', NULL, '1221', '2026-10-05', 334260.00, 'Glosa de R$ 7.640,00: telhas sem fixação definitiva no eixo C.', NULL, NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4330000-0000-4000-8000-000000000004', 'd4300000-0000-4000-8000-000000000002', 4, '2026-10-01', '2026-10-20', 195000.00, NULL, 'enviada', '2026-10-21 14:00-04', NULL, NULL, NULL, NULL, NULL, NULL, 'Aguardando vistoria do fiscal.', NULL, NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  -- 019/2026 alimentação
  ('d4330000-0000-4000-8000-000000000005', 'd4300000-0000-4000-8000-000000000001', 1, '2026-07-01', '2026-07-31', 96400.00, 96400.00, 'paga', '2026-08-04 09:00-04', '2026-08-06 10:00-04', 'c0000000-0000-4000-8000-000000000013', '2026-08-18', '000.512', '2026-08-04', 96400.00, 'JERs 2026 – etapa estadual.', NULL, NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4330000-0000-4000-8000-000000000006', 'd4300000-0000-4000-8000-000000000001', 2, '2026-08-01', '2026-08-31', 61250.00, 61250.00, 'aprovada', '2026-09-03 09:00-04', '2026-09-10 17:00-04', 'c0000000-0000-4000-8000-000000000013', NULL, '000.538', '2026-09-03', 61250.00, 'Copa Roraima de Futsal Sub-15.', NULL, NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4330000-0000-4000-8000-000000000007', 'd4300000-0000-4000-8000-000000000001', 3, '2026-09-01', '2026-09-30', 38900.00, NULL, 'enviada', '2026-10-05 11:00-04', NULL, NULL, NULL, '000.561', '2026-10-05', 38900.00, 'Jogos Abertos – fase regional.', NULL, NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  -- 017/2026 software
  ('d4330000-0000-4000-8000-000000000008', 'd4300000-0000-4000-8000-000000000003', 1, '2026-05-04', '2026-06-30', 84000.00, 84000.00, 'paga', '2026-07-01 10:00-04', '2026-07-03 09:30-04', 'c0000000-0000-4000-8000-000000000014', '2026-07-15', 'NFS-e 2026/3318', '2026-07-01', 84000.00, 'Licença anual e implantação concluída.', NULL, NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4330000-0000-4000-8000-000000000009', 'd4300000-0000-4000-8000-000000000003', 2, '2026-07-01', '2026-09-30', 3000.00, 3000.00, 'aprovada', '2026-10-01 10:00-04', '2026-10-06 15:00-04', 'c0000000-0000-4000-8000-000000000014', NULL, 'NFS-e 2026/4102', '2026-10-01', 3000.00, 'Suporte técnico do 3º trimestre.', NULL, NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  -- 009/2025 transporte (rescindido)
  ('d4330000-0000-4000-8000-000000000010', 'd4300000-0000-4000-8000-000000000004', 1, '2025-04-10', '2025-08-31', 61000.00, 61000.00, 'paga', '2025-09-03 10:00-04', '2025-09-05 10:00-04', 'c0000000-0000-4000-8000-000000000013', '2025-09-19', '3390', '2025-09-03', 61000.00, NULL, NULL, NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4330000-0000-4000-8000-000000000011', 'd4300000-0000-4000-8000-000000000004', 2, '2025-09-01', '2025-12-31', 41500.00, 37000.00, 'paga', '2026-01-06 10:00-04', '2026-01-12 10:00-04', 'c0000000-0000-4000-8000-000000000013', '2026-01-28', '3455', '2026-01-06', 37000.00, 'Glosa por três viagens não realizadas.', NULL, NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  -- 001/2026 mobiliário (dados-teste)
  ('d4330000-0000-4000-8000-000000000012', 'f5000000-0000-4000-8000-000000000001', 1, '2026-03-20', '2026-05-20', 56000.00, 56000.00, 'paga', '2026-05-22 10:00-04', '2026-05-27 10:00-04', 'c0000000-0000-4000-8000-000000000011', '2026-06-05', '4471', '2026-05-22', 56000.00, '1ª entrega: 20 mesas, 30 cadeiras e 10 armários.', NULL, NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4330000-0000-4000-8000-000000000013', 'f5000000-0000-4000-8000-000000000001', 2, '2026-08-01', '2026-09-15', 50400.00, NULL, 'rejeitada', '2026-09-16 10:00-04', NULL, NULL, NULL, '4590', '2026-09-16', 50400.00, '2ª entrega.', 'Cadeiras entregues sem regulagem de altura dos braços, em desacordo com o termo de referência. Substituição solicitada.', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  -- 002/2026 limpeza (dados-teste): abril a outubro
  ('d4330000-0000-4000-8000-000000000014', 'f5000000-0000-4000-8000-000000000002', 1, '2026-04-01', '2026-04-30', 6000.00, 6000.00, 'paga', '2026-05-04 09:00-04', '2026-05-06 09:00-04', 'c0000000-0000-4000-8000-000000000012', '2026-05-15', '0841', '2026-05-04', 6000.00, NULL, NULL, NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4330000-0000-4000-8000-000000000015', 'f5000000-0000-4000-8000-000000000002', 2, '2026-05-01', '2026-05-31', 6000.00, 6000.00, 'paga', '2026-06-02 09:00-04', '2026-06-04 09:00-04', 'c0000000-0000-4000-8000-000000000012', '2026-06-15', '0866', '2026-06-02', 6000.00, NULL, NULL, NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4330000-0000-4000-8000-000000000016', 'f5000000-0000-4000-8000-000000000002', 3, '2026-06-01', '2026-06-30', 6000.00, 6000.00, 'paga', '2026-07-02 09:00-04', '2026-07-06 09:00-04', 'c0000000-0000-4000-8000-000000000012', '2026-07-15', '0890', '2026-07-02', 6000.00, NULL, NULL, NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4330000-0000-4000-8000-000000000017', 'f5000000-0000-4000-8000-000000000002', 4, '2026-07-01', '2026-07-31', 6000.00, 6000.00, 'paga', '2026-08-03 09:00-04', '2026-08-05 09:00-04', 'c0000000-0000-4000-8000-000000000012', '2026-08-14', '0915', '2026-08-03', 6000.00, NULL, NULL, NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4330000-0000-4000-8000-000000000018', 'f5000000-0000-4000-8000-000000000002', 5, '2026-08-01', '2026-08-31', 6000.00, 6000.00, 'paga', '2026-09-02 09:00-04', '2026-09-04 09:00-04', 'c0000000-0000-4000-8000-000000000012', '2026-09-15', '0942', '2026-09-02', 6000.00, NULL, NULL, NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4330000-0000-4000-8000-000000000019', 'f5000000-0000-4000-8000-000000000002', 6, '2026-09-01', '2026-09-30', 6000.00, 6000.00, 'aprovada', '2026-10-02 09:00-04', '2026-10-06 09:00-04', 'c0000000-0000-4000-8000-000000000012', NULL, '0968', '2026-10-02', 6000.00, NULL, NULL, NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4330000-0000-4000-8000-000000000020', 'f5000000-0000-4000-8000-000000000002', 7, '2026-10-01', '2026-10-31', 6000.00, NULL, 'rascunho', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Em preenchimento pelo fiscal.', NULL, NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid);

-- Executado e saldo pelas medições. O valor atual e o fim atual já saíram das alterações (contratos_preparar).
UPDATE public.contratos c SET
  valor_executado = coalesce((SELECT sum(m.valor_aprovado) FROM public.medicoes_contrato m WHERE m.contrato_id = c.id AND m.status IN ('aprovada', 'paga')), 0),
  saldo_contrato = c.valor_atual - coalesce((SELECT sum(m.valor_aprovado) FROM public.medicoes_contrato m WHERE m.contrato_id = c.id AND m.status IN ('aprovada', 'paga')), 0)
WHERE EXISTS (SELECT 1 FROM public.medicoes_contrato m WHERE m.contrato_id = c.id) OR c.id::text LIKE 'd43%';

-- ===================================================================== comissões (licitação e fiscalização)
INSERT INTO public.comissoes (id, nome, tipo, modulo, objeto_tipo, objeto_id, ato_tipo, ato_numero, ato_data, ato_doe_numero, ato_doe_data, data_inicio, data_fim, motivo, status, observacao) VALUES
  ('d4600000-0000-4000-8000-000000000001', 'Comissão de Contratação – Concorrência nº 001/2026', 'licitacao', 'compras', 'processo_licitatorio', 'd4200000-0000-4000-8000-000000000008',
   'portaria', '112/2026', '2026-02-27', '4.812', '2026-03-02', '2026-03-02', NULL, 'Conduzir a concorrência para a reforma e cobertura da quadra poliesportiva de Rorainópolis (art. 8º, § 2º, da Lei nº 14.133/2021).', 'ativa', NULL),
  ('d4600000-0000-4000-8000-000000000002', 'Comissão de Fiscalização do Contrato nº 021/2026', 'fiscalizacao_contrato', 'contratos', 'contrato', 'd4300000-0000-4000-8000-000000000002',
   'portaria', '205/2026', '2026-06-18', '4.961', '2026-06-19', '2026-06-22', NULL, 'Acompanhar e fiscalizar a execução da obra da quadra de Rorainópolis (art. 117 da Lei nº 14.133/2021).', 'ativa', 'Medições mensais com relatório fotográfico.'),
  ('d4600000-0000-4000-8000-000000000003', 'Comissão de Recebimento do Mobiliário – Contrato nº 001/2026', 'fiscalizacao_contrato', 'contratos', 'contrato', 'f5000000-0000-4000-8000-000000000001',
   'portaria', '098/2026', '2026-03-19', '4.840', '2026-03-23', '2026-03-23', '2026-09-30', 'Receber provisória e definitivamente o mobiliário adquirido para a sede.', 'encerrada', 'Encerrada após a 1ª entrega; nova comissão será designada para a reposição.');

INSERT INTO public.comissoes_membros (id, comissao_id, servidor_id, papel, data_inicio, data_fim, observacao) VALUES
  ('d4610000-0000-4000-8000-000000000001', 'd4600000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000011', 'presidente', '2026-03-02', NULL, 'Agente de contratação'),
  ('d4610000-0000-4000-8000-000000000002', 'd4600000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000009', 'membro', '2026-03-02', NULL, NULL),
  ('d4610000-0000-4000-8000-000000000003', 'd4600000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000012', 'secretario', '2026-03-02', NULL, NULL),
  ('d4610000-0000-4000-8000-000000000004', 'd4600000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000013', 'presidente', '2026-06-22', NULL, 'Fiscal técnico'),
  ('d4610000-0000-4000-8000-000000000005', 'd4600000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000014', 'membro', '2026-06-22', NULL, 'Fiscal administrativa'),
  ('d4610000-0000-4000-8000-000000000006', 'd4600000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000010', 'membro', '2026-06-22', NULL, NULL),
  ('d4610000-0000-4000-8000-000000000007', 'd4600000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000008', 'presidente', '2026-03-23', '2026-09-30', NULL),
  ('d4610000-0000-4000-8000-000000000008', 'd4600000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000018', 'membro', '2026-03-23', '2026-09-30', NULL);

-- ===================================================================== processos administrativos (acompanhamento do SEI)
-- Linhas no formato das RPCs wf_* (etapa atual, unidade da etapa, prazo em dias úteis, checklist, movimentações),
-- com datas retroativas para o semáforo do prazo mostrar em dia, vence logo, vencido e sem prazo.
CREATE TEMP TABLE _pa (n int, modelo text, etapa int, abertura date, inicio_etapa date, status text, sigilo text, origem int,
  sei text, assunto text, descricao text, int_tipo text, int_nome text, int_doc text, encerramento date, fim_mov text, fim_obs text,
  marcar_atual boolean) ON COMMIT DROP;
INSERT INTO _pa VALUES
  ( 1, 'compras',   1, '2026-10-22', '2026-10-22', 'aberto',        'publico', 3, '18101.004318/2026-71',
    'Aquisição de kits esportivos para os núcleos do Programa Escolinhas Esportivas',
    'Demanda da Diretoria de Esporte para reposição de material esportivo em 24 núcleos (capital e interior).', 'interno', 'Diretoria de Esporte', NULL, NULL, NULL, NULL, false),
  ( 2, 'compras',   2, '2026-09-28', '2026-10-21', 'em_tramitacao', 'publico', 4, '18101.003977/2026-02',
    'Contratação de empresa para organização do Festival Juventude em Movimento 2026',
    'Estrutura, sonorização, oficinas e premiação do festival, previsto para 12/12/2026 na Praça das Águas.', 'interno', 'Diretoria de Juventude', NULL, NULL, NULL, NULL, false),
  ( 3, 'compras',   3, '2026-06-02', '2026-10-05', 'em_tramitacao', 'publico', 3, '18101.002254/2026-36',
    'Contratação de transporte rodoviário para deslocamento de delegações ao interior (PE nº 009/2026)',
    'Fretamento de ônibus executivo com motorista para as competições estaduais de 2026/2027.', 'interno', 'Diretoria de Esporte', NULL, NULL, NULL, NULL, false),
  ( 4, 'compras',   7, '2026-02-09', '2026-06-22', 'em_tramitacao', 'publico', 3, '18101.000731/2026-90',
    'Reforma e cobertura da Quadra Poliesportiva de Rorainópolis (Concorrência nº 001/2026)',
    'Obra contratada pelo Contrato nº 021/2026; processo em fase de fiscalização.', 'interno', 'Diretoria de Esporte', NULL, NULL, NULL, NULL, true),
  ( 5, 'diarias',   4, '2026-10-14', '2026-10-20', 'em_tramitacao', 'publico', 3, '18101.004102/2026-55',
    'Diárias para a delegação de Roraima no Campeonato Brasileiro Escolar de Atletismo – Manaus/AM',
    'Concessão de diárias a 2 técnicos e 1 chefe de delegação, de 18 a 22/11/2026.', 'interno', 'Thiago Barreto Cunha', NULL, NULL, NULL, NULL, false),
  ( 6, 'diarias',   8, '2026-07-20', '2026-08-24', 'concluido',     'publico', 3, '18101.002870/2026-14',
    'Diárias para reunião técnica no Ministério do Esporte – Brasília/DF',
    'Participação da Diretora de Esporte em reunião sobre o calendário nacional de competições escolares.', 'interno', 'Patrícia Nogueira Sales', NULL, '2026-08-28', 'Processo concluído.', 'Prestação de contas aprovada; relatório de viagem juntado.', true),
  ( 7, 'convenios', 2, '2026-09-01', '2026-09-22', 'em_tramitacao', 'publico', 3, '18101.003310/2026-48',
    'Termo de Fomento com a Associação Desportiva Juventude do Lavrado – Campeonato Estadual de Basquete Sub-17',
    'Plano de trabalho de R$ 85.000,00 para arbitragem, transporte e premiação do campeonato.', 'externo', 'Associação Desportiva Juventude do Lavrado', pg_temp.cnpj('193847260001'), NULL, NULL, NULL, false),
  ( 8, 'convenios', 4, '2026-07-06', '2026-09-24', 'suspenso',      'publico', 4, '18101.002611/2026-83',
    'Termo de Colaboração com o Instituto Social Novo Horizonte – Projeto Jovem Atleta Cidadão',
    'Atendimento de 300 jovens em contraturno escolar nos bairros Senador Hélio Campos e Cidade Satélite.', 'externo', 'Instituto Social Novo Horizonte', pg_temp.cnpj('274615830001'), NULL, 'Processo suspenso.', 'Certidão negativa de débitos trabalhistas vencida; aguardando regularização pela entidade.', false),
  ( 9, 'pagamentos', 4, '2026-10-06', '2026-10-16', 'em_tramitacao', 'publico', 2, '18101.003894/2026-20',
    'Pagamento da 3ª medição do Contrato nº 021/2026 – Construtora Paricarana Engenharia e Serviços Ltda',
    'Medição de setembro/2026 no valor de R$ 334.260,00, após glosa do fiscal.', 'externo', 'Construtora Paricarana Engenharia e Serviços Ltda', pg_temp.cnpj('290446130001'), NULL, NULL, NULL, false),
  (10, 'pagamentos', 6, '2026-08-07', '2026-08-18', 'concluido',     'publico', 2, '18101.002998/2026-61',
    'Pagamento da 1ª medição do Contrato nº 021/2026 – Construtora Paricarana Engenharia e Serviços Ltda',
    'Medição de 22/06 a 31/07/2026 no valor de R$ 208.912,50.', 'externo', 'Construtora Paricarana Engenharia e Serviços Ltda', pg_temp.cnpj('290446130001'), '2026-08-20', 'Processo concluído.', 'Ordem bancária emitida em 20/08/2026.', true),
  (11, 'almoxarifado', 2, '2026-10-22', '2026-10-22', 'em_tramitacao', 'publico', 5, '18101.004355/2026-07',
    'Requisição de material de expediente para a Divisão de Recursos Humanos',
    '10 resmas de papel A4, 2 toners e 50 canetas para o fechamento da folha e o recadastramento anual.', 'interno', 'Divisão de Recursos Humanos', NULL, NULL, NULL, NULL, false),
  (12, 'patrimonio_tombamento', 2, '2026-09-29', '2026-10-08', 'em_tramitacao', 'publico', 7, '18101.003722/2026-39',
    'Tombamento do mobiliário recebido pelo Contrato nº 001/2026 (1ª entrega)',
    '20 mesas, 30 cadeiras e 10 armários recebidos definitivamente em 27/05/2026.', 'interno', 'Divisão de Patrimônio e Compras', NULL, NULL, NULL, NULL, false),
  (13, 'patrimonio_baixa', 2, '2026-04-13', '2026-05-04', 'arquivado',   'publico', 7, '18101.001388/2026-75',
    'Baixa patrimonial de 12 microcomputadores inservíveis',
    'Equipamentos de 2014 sem condições de reparo, conforme laudo da equipe de TI.', 'interno', 'Divisão de Patrimônio e Compras', NULL, '2026-06-10', 'Processo arquivado.', 'Bens incluídos no processo de desfazimento conjunto da Secretaria de Educação; este processo foi arquivado.', true);

INSERT INTO public.processos_administrativos (id, numero_processo, ano, tipo_processo, assunto, descricao, interessado_tipo, interessado_nome, interessado_documento,
  unidade_origem_id, status, sigilo, data_abertura, data_encerramento, created_at, updated_at, created_by, numero_sei, modelo_id, etapa_atual_ordem, unidade_atual_id,
  etapa_iniciada_em, etapa_prazo_limite, suspenso_desde, observacoes)
SELECT ('d4500000-0000-4000-8000-0000000000' || lpad(p.n::text, 2, '0'))::uuid, lpad(p.n::text, 5, '0'), 2026, m.tipo_processo, p.assunto, p.descricao, p.int_tipo,
       p.int_nome, p.int_doc, ('a0000000-0000-4000-8000-00000000000' || p.origem)::uuid, p.status::public.status_processo_administrativo, p.sigilo::public.nivel_sigilo_processo,
       p.abertura, p.encerramento, p.abertura + time '09:00', coalesce(p.encerramento, p.inicio_etapa) + time '16:00',
       NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid, p.sei, m.id, p.etapa,
       public.wf_resolver_unidade(e.unidade_sigla, ('a0000000-0000-4000-8000-00000000000' || p.origem)::uuid),
       p.inicio_etapa + time '10:30',
       CASE WHEN e.prazo_dias_uteis IS NOT NULL THEN public.fn_somar_dias_uteis(p.inicio_etapa, e.prazo_dias_uteis) END,
       CASE WHEN p.status = 'suspenso' THEN date '2026-10-02' END, NULL
FROM _pa p
JOIN public.processo_modelos m ON m.codigo = p.modelo
JOIN public.processo_modelo_etapas e ON e.modelo_id = m.id AND e.ordem = p.etapa;

-- dois processos sem modelo: um sigiloso (credencial para o login de teste) e um restrito
INSERT INTO public.processos_administrativos (id, numero_processo, ano, tipo_processo, assunto, descricao, interessado_tipo, interessado_nome, interessado_documento,
  unidade_origem_id, status, sigilo, data_abertura, created_at, updated_at, created_by, numero_sei, unidade_atual_id, observacoes) VALUES
  ('d4500000-0000-4000-8000-000000000014', '00014', 2026, 'governanca', 'Apuração preliminar de irregularidades na prestação de contas de termo de fomento',
   'Indícios de notas fiscais com datas incompatíveis com o período de execução do Termo de Fomento nº 007/2025.', 'externo', 'Associação Esportiva Vila Jardim', pg_temp.cnpj('318470560001'),
   'a0000000-0000-4000-8000-000000000001', 'em_tramitacao', 'sigiloso', '2026-09-15', '2026-09-15 11:00-04', '2026-10-13 15:00-04', NULL, '18101.003501/2026-12',
   'a0000000-0000-4000-8000-000000000009', 'Acesso restrito à Presidência, à Assessoria Jurídica e aos credenciados.'),
  ('d4500000-0000-4000-8000-000000000015', '00015', 2026, 'rh', 'Requerimento de licença para tratar de interesses particulares',
   'Pedido de licença não remunerada por 24 meses, a partir de 01/02/2027.', 'interno', 'Larissa Monteiro Paiva', NULL,
   'a0000000-0000-4000-8000-000000000002', 'aberto', 'restrito', '2026-10-19', '2026-10-19 08:40-04', '2026-10-19 08:40-04',
   NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid, '18101.004260/2026-44', 'a0000000-0000-4000-8000-000000000005', NULL);

INSERT INTO public.acesso_processo_sigiloso (processo_id, usuario_id, nivel_acesso, motivo, concedido_por, created_at)
SELECT 'd4500000-0000-4000-8000-000000000014', p.id, 'tramitacao', 'Designado para instruir a apuração preliminar (Portaria nº 301/2026).', p.id, timestamptz '2026-09-15 14:00-04'
FROM public.profiles p WHERE p.servidor_id = 'c0000000-0000-4000-8000-000000000001';

-- checklist e movimentações das etapas já percorridas
DO $$
DECLARE
  r record; et record; k int; seq int; d date; v_uid uuid := NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid;
  v_origem uuid; v_u1 uuid; v_u2 uuid; v_prox record;
BEGIN
  FOR r IN SELECT p.*, m.id AS modelo_id FROM _pa p JOIN public.processo_modelos m ON m.codigo = p.modelo ORDER BY p.n LOOP
    v_origem := ('a0000000-0000-4000-8000-00000000000' || r.origem)::uuid;
    seq := 0;
    -- checklist: tudo das etapas anteriores; da etapa atual só quando marcar_atual (os demais ficam como pendência)
    INSERT INTO public.processo_checklist_respostas (processo_id, item_id, marcado, marcado_por, marcado_em, observacao, created_at, updated_at)
    SELECT ('d4500000-0000-4000-8000-0000000000' || lpad(r.n::text, 2, '0'))::uuid, c.id, true, v_uid,
           (r.abertura + c.etapa_ordem - 1) + time '11:00', NULL, (r.abertura + c.etapa_ordem - 1) + time '11:00', (r.abertura + c.etapa_ordem - 1) + time '11:00'
    FROM public.processo_modelo_checklist c
    WHERE c.modelo_id = r.modelo_id AND (c.etapa_ordem < r.etapa OR (c.etapa_ordem = r.etapa AND r.marcar_atual));
    -- transições 1 -> 2 -> ... -> etapa atual, com datas espalhadas entre a abertura e o início da etapa atual
    FOR k IN 1 .. r.etapa - 1 LOOP
      SELECT * INTO et FROM public.processo_modelo_etapas WHERE modelo_id = r.modelo_id AND ordem = k;
      SELECT * INTO v_prox FROM public.processo_modelo_etapas WHERE modelo_id = r.modelo_id AND ordem = k + 1;
      d := CASE WHEN k = r.etapa - 1 THEN r.inicio_etapa
                ELSE r.abertura + ((r.inicio_etapa - r.abertura) * k / (r.etapa - 1)) END;
      v_u1 := public.wf_resolver_unidade(et.unidade_sigla, v_origem);
      v_u2 := public.wf_resolver_unidade(v_prox.unidade_sigla, v_origem);
      seq := seq + 1;
      INSERT INTO public.movimentacoes_processo (id, processo_id, numero_sequencial, tipo_movimentacao, descricao, observacoes, unidade_origem_id, unidade_destino_id,
        servidor_origem_id, etapa_origem_ordem, etapa_destino_ordem, prazo_dias, prazo_limite, status, data_recebimento, created_at, updated_at, created_by)
      VALUES (gen_random_uuid(), ('d4500000-0000-4000-8000-0000000000' || lpad(r.n::text, 2, '0'))::uuid, seq, 'encaminhamento',
        format('Avançou da etapa %s (%s) para a etapa %s (%s).', et.ordem, et.nome, v_prox.ordem, v_prox.nome),
        CASE k WHEN 1 THEN 'Documentos da etapa conferidos e número SEI informado.' END,
        v_u1, v_u2, 'c0000000-0000-4000-8000-000000000001', k, k + 1, v_prox.prazo_dias_uteis,
        CASE WHEN v_prox.prazo_dias_uteis IS NOT NULL THEN public.fn_somar_dias_uteis(d, v_prox.prazo_dias_uteis) END,
        'recebido', d + time '10:30', d + time '10:30', d + time '10:30', v_uid);
    END LOOP;
    IF r.fim_mov IS NOT NULL THEN
      seq := seq + 1;
      SELECT * INTO et FROM public.processo_modelo_etapas WHERE modelo_id = r.modelo_id AND ordem = r.etapa;
      v_u1 := public.wf_resolver_unidade(et.unidade_sigla, v_origem);
      d := coalesce(r.encerramento, date '2026-10-02');
      INSERT INTO public.movimentacoes_processo (id, processo_id, numero_sequencial, tipo_movimentacao, descricao, observacoes, unidade_origem_id, unidade_destino_id,
        servidor_origem_id, etapa_origem_ordem, etapa_destino_ordem, status, data_recebimento, created_at, updated_at, created_by)
      VALUES (gen_random_uuid(), ('d4500000-0000-4000-8000-0000000000' || lpad(r.n::text, 2, '0'))::uuid, seq,
        CASE WHEN r.status = 'suspenso' THEN 'informacao' ELSE 'decisao' END::public.tipo_movimentacao_processo, r.fim_mov, r.fim_obs,
        v_u1, CASE WHEN r.status = 'suspenso' THEN v_u1 END, 'c0000000-0000-4000-8000-000000000001', r.etapa,
        CASE WHEN r.status = 'suspenso' THEN r.etapa END, 'recebido', d + time '15:00', d + time '15:00', d + time '15:00', v_uid);
    END IF;
  END LOOP;
END $$;

-- movimentações manuais dos processos sem modelo (sigiloso e restrito)
INSERT INTO public.movimentacoes_processo (processo_id, numero_sequencial, tipo_movimentacao, descricao, observacoes, unidade_origem_id, unidade_destino_id,
  servidor_origem_id, servidor_destino_id, prazo_dias, prazo_limite, status, data_recebimento, data_resposta, created_at, updated_at, created_by) VALUES
  ('d4500000-0000-4000-8000-000000000014', 1, 'encaminhamento', 'Encaminhado à Assessoria Jurídica para análise preliminar dos documentos.', NULL,
   'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000009', 'c0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000017',
   10, '2026-09-29', 'respondido', '2026-09-16 09:00-04', '2026-09-28 17:00-04', '2026-09-15 16:00-04', '2026-09-28 17:00-04', NULL),
  ('d4500000-0000-4000-8000-000000000014', 2, 'juntada', 'Juntada de manifestação da Assessoria Jurídica e de diligência à entidade.', NULL,
   'a0000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000009', 'c0000000-0000-4000-8000-000000000017', NULL,
   NULL, NULL, 'recebido', '2026-09-28 17:10-04', NULL, '2026-09-28 17:10-04', '2026-09-28 17:10-04', NULL),
  ('d4500000-0000-4000-8000-000000000014', 3, 'despacho', 'Aguardando resposta da entidade à diligência (prazo de 10 dias úteis).', NULL,
   'a0000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000009', 'c0000000-0000-4000-8000-000000000017', NULL,
   10, '2026-10-13', 'vencido', '2026-09-29 09:00-04', NULL, '2026-09-29 09:00-04', '2026-10-14 08:00-04', NULL),
  ('d4500000-0000-4000-8000-000000000015', 1, 'encaminhamento', 'Encaminhado à Divisão de Recursos Humanos para instrução (tempo de serviço e situação funcional).', NULL,
   'a0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000006',
   5, '2026-10-26', 'pendente', NULL, NULL, '2026-10-19 10:00-04', '2026-10-19 10:00-04', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid);

-- ===================================================================== despachos
INSERT INTO public.despachos (id, processo_id, movimentacao_id, numero_despacho, texto_despacho, tipo_despacho, fundamentacao_legal, decisao, autoridade_id, data_despacho, created_at, created_by)
SELECT d.id::uuid, d.proc::uuid,
       (SELECT mv.id FROM public.movimentacoes_processo mv WHERE mv.processo_id = d.proc::uuid AND mv.numero_sequencial = d.mov),
       d.num, d.texto, d.tipo::public.tipo_despacho, d.fund, d.dec::public.decisao_despacho, d.aut::uuid, d.dt::date, d.dt::date + time '14:00',
       NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid
FROM (VALUES
  ('d4510000-0000-4000-8000-000000000001', 'd4500000-0000-4000-8000-000000000002', 1, 1,
   'À Diretoria Administrativa e Financeira, para manifestação sobre a disponibilidade orçamentária na ação 2050 e indicação da dotação a onerar.',
   'simples', NULL, 'encaminhar', 'c0000000-0000-4000-8000-000000000005', '2026-10-21'),
  ('d4510000-0000-4000-8000-000000000002', 'd4500000-0000-4000-8000-000000000003', 2, 1,
   'Atestada a disponibilidade orçamentária (dotação 0202.2050.339033.100). Ao Controle Interno para parecer prévio, nos termos do art. 53, § 4º, da Lei nº 14.133/2021.',
   'simples', 'Lei nº 14.133/2021, art. 53', 'encaminhar', 'c0000000-0000-4000-8000-000000000003', '2026-10-05'),
  ('d4510000-0000-4000-8000-000000000003', 'd4500000-0000-4000-8000-000000000004', 3, 1,
   'Considerando o parecer favorável do Controle Interno e a disponibilidade orçamentária, AUTORIZO a abertura de licitação na modalidade concorrência, com critério de menor preço global.',
   'decisorio', 'Lei nº 14.133/2021, arts. 28, II, e 72', 'deferido', 'c0000000-0000-4000-8000-000000000002', '2026-03-30'),
  ('d4510000-0000-4000-8000-000000000004', 'd4500000-0000-4000-8000-000000000004', 6, 2,
   'Designo os servidores Thiago Barreto Cunha e Aline Castro Vieira como fiscais técnico e administrativo do Contrato nº 021/2026. Encaminhe-se à unidade demandante para acompanhamento da execução.',
   'simples', 'Lei nº 14.133/2021, art. 117', 'encaminhar', 'c0000000-0000-4000-8000-000000000003', '2026-06-22'),
  ('d4510000-0000-4000-8000-000000000005', 'd4500000-0000-4000-8000-000000000005', 3, 1,
   'Ordem de missão emitida. À Presidência para autorização das diárias, no valor total de R$ 3.360,00.',
   'simples', NULL, 'encaminhar', 'c0000000-0000-4000-8000-000000000003', '2026-10-20'),
  ('d4510000-0000-4000-8000-000000000006', 'd4500000-0000-4000-8000-000000000006', 3, 1,
   'AUTORIZO a concessão de 3,5 (três e meia) diárias à servidora Patrícia Nogueira Sales, para deslocamento a Brasília/DF no período de 10 a 13/08/2026.',
   'decisorio', 'Lei estadual de diárias e regulamento interno', 'deferido', 'c0000000-0000-4000-8000-000000000002', '2026-07-31'),
  ('d4510000-0000-4000-8000-000000000007', 'd4500000-0000-4000-8000-000000000006', 8, 2,
   'Prestação de contas regular, com relatório de viagem e comprovantes de embarque. Arquive-se após o registro no sistema.',
   'conclusivo', NULL, 'arquivar', 'c0000000-0000-4000-8000-000000000003', '2026-08-28'),
  ('d4510000-0000-4000-8000-000000000008', 'd4500000-0000-4000-8000-000000000007', 1, 1,
   'Plano de trabalho recebido. À Assessoria Jurídica para análise da minuta do termo de fomento e da regularidade da entidade (Lei nº 13.019/2014).',
   'simples', 'Lei nº 13.019/2014, art. 35', 'encaminhar', 'c0000000-0000-4000-8000-000000000004', '2026-09-22'),
  ('d4510000-0000-4000-8000-000000000009', 'd4500000-0000-4000-8000-000000000008', 4, 1,
   'Suspendo a tramitação até a apresentação, pela entidade, de certidão negativa de débitos trabalhistas válida. Notifique-se a proponente.',
   'decisorio', 'Lei nº 13.019/2014, art. 34, II', 'suspender', 'c0000000-0000-4000-8000-000000000002', '2026-10-02'),
  ('d4510000-0000-4000-8000-000000000010', 'd4500000-0000-4000-8000-000000000009', 3, 1,
   'Atesto a execução dos serviços da 3ª medição, com glosa de R$ 7.640,00 registrada no relatório do fiscal. Liquide-se no valor de R$ 334.260,00.',
   'simples', 'Lei nº 4.320/1964, art. 63', 'informar', 'c0000000-0000-4000-8000-000000000003', '2026-10-16'),
  ('d4510000-0000-4000-8000-000000000011', 'd4500000-0000-4000-8000-000000000013', 2, 1,
   'Tendo em vista a inclusão dos bens no desfazimento conjunto conduzido pela Secretaria de Educação, arquive-se este processo, com remissão ao processo principal.',
   'conclusivo', NULL, 'arquivar', 'c0000000-0000-4000-8000-000000000003', '2026-06-10'),
  ('d4510000-0000-4000-8000-000000000012', 'd4500000-0000-4000-8000-000000000014', 1, 1,
   'Encaminhe-se à Assessoria Jurídica, em caráter sigiloso, para análise preliminar dos documentos e indicação das providências cabíveis.',
   'simples', 'Lei nº 12.527/2011, art. 7º, § 3º', 'encaminhar', 'c0000000-0000-4000-8000-000000000002', '2026-09-15'),
  ('d4510000-0000-4000-8000-000000000013', 'd4500000-0000-4000-8000-000000000015', 1, 1,
   'À Divisão de Recursos Humanos para informar o tempo de serviço, a situação funcional e eventuais pendências da requerente.',
   'simples', NULL, 'encaminhar', 'c0000000-0000-4000-8000-000000000003', '2026-10-19')
) AS d(id, proc, mov, num, texto, tipo, fund, dec, aut, dt);

-- ===================================================================== documentos do processo (o arquivo está no SEI)
INSERT INTO public.documentos_processo (id, processo_id, tipo_documento, numero_documento, titulo, conteudo_textual, sigilo, ordem, created_at, created_by) VALUES
  ('d4520000-0000-4000-8000-000000000001', 'd4500000-0000-4000-8000-000000000001', 'requerimento', 'SEI 2160021', 'Termo de Demanda nº 41/2026 – DIESP', NULL, 'publico', 1, '2026-10-22 09:30-04', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4520000-0000-4000-8000-000000000002', 'd4500000-0000-4000-8000-000000000001', 'anexo', 'SEI 2160044', 'Relação de núcleos e quantitativos por modalidade', NULL, 'publico', 2, '2026-10-22 09:45-04', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4520000-0000-4000-8000-000000000003', 'd4500000-0000-4000-8000-000000000003', 'nota_tecnica', 'SEI 1902231', 'Nota Técnica nº 12/2026/DIESP – dimensionamento da quilometragem', NULL, 'publico', 1, '2026-06-05 10:00-04', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4520000-0000-4000-8000-000000000004', 'd4500000-0000-4000-8000-000000000003', 'declaracao', 'SEI 1785502', 'Declaração de disponibilidade orçamentária', NULL, 'publico', 2, '2026-08-31 15:00-04', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4520000-0000-4000-8000-000000000005', 'd4500000-0000-4000-8000-000000000004', 'parecer', 'Parecer nº 044/2026/CI', 'Parecer do Controle Interno sobre a fase preparatória', NULL, 'publico', 1, '2026-03-26 11:00-04', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4520000-0000-4000-8000-000000000006', 'd4500000-0000-4000-8000-000000000004', 'anexo', 'SEI 1755870', 'Relatório fotográfico da 2ª medição', NULL, 'publico', 2, '2026-09-02 10:00-04', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4520000-0000-4000-8000-000000000007', 'd4500000-0000-4000-8000-000000000006', 'oficio', 'Ofício nº 233/2026/PRES', 'Ofício de convite do Ministério do Esporte', NULL, 'publico', 1, '2026-07-20 09:00-04', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4520000-0000-4000-8000-000000000008', 'd4500000-0000-4000-8000-000000000006', 'anexo', 'SEI 1688102', 'Relatório de viagem e cartões de embarque', NULL, 'publico', 2, '2026-08-17 14:00-04', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4520000-0000-4000-8000-000000000009', 'd4500000-0000-4000-8000-000000000007', 'requerimento', 'SEI 1977415', 'Plano de trabalho e proposta da entidade', NULL, 'publico', 1, '2026-09-01 10:00-04', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4520000-0000-4000-8000-000000000010', 'd4500000-0000-4000-8000-000000000008', 'certidao', 'SEI 2003318', 'Certidão Negativa de Débitos Trabalhistas (vencida em 28/09/2026)', NULL, 'publico', 1, '2026-09-24 10:00-04', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4520000-0000-4000-8000-000000000011', 'd4500000-0000-4000-8000-000000000009', 'anexo', 'NF-e 1221', 'Nota fiscal da 3ª medição com atesto do fiscal', NULL, 'publico', 1, '2026-10-06 09:00-04', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4520000-0000-4000-8000-000000000012', 'd4500000-0000-4000-8000-000000000014', 'parecer', 'Manifestação nº 019/2026/ASJUR', 'Manifestação jurídica preliminar', 'Recomenda diligência à entidade para esclarecimento das datas das notas fiscais nº 118 a 124.', 'sigiloso', 1, '2026-09-28 17:00-04', NULL),
  ('d4520000-0000-4000-8000-000000000013', 'd4500000-0000-4000-8000-000000000015', 'requerimento', 'SEI 2149990', 'Requerimento da servidora', NULL, 'restrito', 1, '2026-10-19 08:40-04', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid);

-- ===================================================================== encaminhamentos entre unidades
INSERT INTO public.encaminhamentos (id, tipo_origem, origem_id, numero_sequencial, unidade_destino_id, servidor_destino_id, assunto, despacho, prazo_resposta, urgente,
  data_encaminhamento, data_recebimento, recebido_por, status, created_at, created_by) VALUES
  ('d4530000-0000-4000-8000-000000000001', 'processo_administrativo', 'd4500000-0000-4000-8000-000000000002', 1, 'a0000000-0000-4000-8000-000000000006', 'c0000000-0000-4000-8000-000000000007',
   'Disponibilidade orçamentária – Festival Juventude em Movimento 2026', 'Solicito informar o saldo da dotação 0202.2050.339039.100 e a viabilidade de empenho ainda neste exercício.', '2026-10-28', false,
   '2026-10-21 15:00-04', '2026-10-22 08:30-04', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid, 'recebido', '2026-10-21 15:00-04', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4530000-0000-4000-8000-000000000002', 'processo_administrativo', 'd4500000-0000-4000-8000-000000000007', 1, 'a0000000-0000-4000-8000-000000000009', 'c0000000-0000-4000-8000-000000000017',
   'Análise jurídica – Termo de Fomento (Basquete Sub-17)', 'Encaminho para análise da minuta e da documentação de habilitação da entidade.', '2026-09-29', false,
   '2026-09-22 10:00-04', '2026-09-22 14:00-04', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid, 'recebido', '2026-09-22 10:00-04', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4530000-0000-4000-8000-000000000003', 'processo_administrativo', 'd4500000-0000-4000-8000-000000000005', 1, 'a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000002',
   'Autorização de diárias – Brasileiro Escolar de Atletismo', 'Para autorização, considerando a proximidade da competição (18/11/2026).', '2026-10-27', true,
   '2026-10-20 11:00-04', NULL, NULL, 'pendente', '2026-10-20 11:00-04', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4530000-0000-4000-8000-000000000004', 'processo_administrativo', 'd4500000-0000-4000-8000-000000000009', 1, 'a0000000-0000-4000-8000-000000000006', 'c0000000-0000-4000-8000-000000000010',
   'Liquidação da 3ª medição – Contrato nº 021/2026', 'Proceder à liquidação e à retenção do ISS e do INSS sobre a mão de obra.', '2026-10-23', false,
   '2026-10-16 16:00-04', '2026-10-19 08:10-04', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid, 'respondido', '2026-10-16 16:00-04', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4530000-0000-4000-8000-000000000005', 'processo_administrativo', 'd4500000-0000-4000-8000-000000000012', 1, 'a0000000-0000-4000-8000-000000000007', 'c0000000-0000-4000-8000-000000000011',
   'Tombamento do mobiliário – Contrato nº 001/2026', 'Providenciar plaquetas e registro fotográfico dos bens recebidos.', '2026-10-15', false,
   '2026-10-08 09:00-04', NULL, NULL, 'pendente', '2026-10-08 09:00-04', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4530000-0000-4000-8000-000000000006', 'processo_licitatorio', 'd4200000-0000-4000-8000-000000000004', 1, 'a0000000-0000-4000-8000-000000000009', 'c0000000-0000-4000-8000-000000000017',
   'Habilitação – PE nº 009/2026', 'Solicito manifestação sobre a validade da certidão de regularidade fiscal apresentada pela arrematante.', '2026-10-26', true,
   '2026-10-19 10:00-04', '2026-10-19 15:30-04', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid, 'recebido', '2026-10-19 10:00-04', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid);

-- ===================================================================== prazos (alguns vencidos)
INSERT INTO public.prazos_processo (id, processo_id, referencia, descricao, base_legal, prazo_dias, data_inicio, data_limite, cumprido, data_cumprimento, responsavel_id, observacoes, created_at, created_by) VALUES
  ('d4540000-0000-4000-8000-000000000001', 'd4500000-0000-4000-8000-000000000003', 'interno', 'Parecer prévio do Controle Interno', 'Portaria interna de prazos', 5, '2026-10-05', '2026-10-12', false, NULL, 'c0000000-0000-4000-8000-000000000003', 'Cobrado por e-mail em 15/10/2026.', '2026-10-05 10:30-04', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4540000-0000-4000-8000-000000000002', 'd4500000-0000-4000-8000-000000000007', 'legal', 'Manifestação jurídica sobre a minuta do termo de fomento', 'Lei nº 13.019/2014, art. 35, VI', 5, '2026-09-22', '2026-09-29', false, NULL, 'c0000000-0000-4000-8000-000000000017', NULL, '2026-09-22 10:00-04', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4540000-0000-4000-8000-000000000003', 'd4500000-0000-4000-8000-000000000008', 'regulamentar', 'Apresentação de CNDT válida pela entidade', 'Lei nº 13.019/2014, art. 34, II', 15, '2026-10-02', '2026-10-17', false, NULL, 'c0000000-0000-4000-8000-000000000005', 'Entidade notificada em 02/10/2026.', '2026-10-02 15:00-04', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4540000-0000-4000-8000-000000000004', 'd4500000-0000-4000-8000-000000000009', 'legal', 'Pagamento da medição após o atesto', 'Lei nº 14.133/2021, art. 141, e regulamento estadual', 10, '2026-10-16', '2026-10-30', false, NULL, 'c0000000-0000-4000-8000-000000000007', NULL, '2026-10-16 16:00-04', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4540000-0000-4000-8000-000000000005', 'd4500000-0000-4000-8000-000000000004', 'contratual', 'Entrega da cobertura metálica (marco 2 do cronograma)', 'Contrato nº 021/2026, cláusula sexta', 60, '2026-08-01', '2026-09-30', false, NULL, 'c0000000-0000-4000-8000-000000000013', 'Reprogramado pelo 1º Termo Aditivo.', '2026-08-01 09:00-04', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4540000-0000-4000-8000-000000000006', 'd4500000-0000-4000-8000-000000000006', 'regulamentar', 'Prestação de contas da viagem', 'Regulamento de diárias, prazo de 5 dias úteis', 5, '2026-08-14', '2026-08-21', true, '2026-08-17', 'c0000000-0000-4000-8000-000000000004', NULL, '2026-08-14 09:00-04', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4540000-0000-4000-8000-000000000007', 'd4500000-0000-4000-8000-000000000014', 'legal', 'Resposta da entidade à diligência', 'Lei nº 9.784/1999, art. 44 (aplicação subsidiária)', 10, '2026-09-29', '2026-10-13', false, NULL, 'c0000000-0000-4000-8000-000000000017', NULL, '2026-09-29 09:00-04', NULL),
  ('d4540000-0000-4000-8000-000000000008', 'd4500000-0000-4000-8000-000000000015', 'interno', 'Instrução pela Divisão de Recursos Humanos', NULL, 5, '2026-10-19', '2026-10-26', false, NULL, 'c0000000-0000-4000-8000-000000000006', NULL, '2026-10-19 10:00-04', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid);

-- ===================================================================== decisões administrativas (registro do ciclo; o ato é do SEI)
INSERT INTO public.decisoes_administrativas (id, numero_decisao, ano, tipo, ementa, fundamentacao, dispositivo, data_decisao, autoridade_id, unidade_origem_id, processo_sei,
  modulo_origem, entidade_origem_tipo, entidade_origem_id, publicado, data_publicacao, veiculo_publicacao, created_at, created_by) VALUES
  ('d4560000-0000-4000-8000-000000000001', '031/2026', 2026, 'despacho', 'Homologação do Pregão Eletrônico nº 006/2026 (SRP – hospedagem e alimentação).',
   'Regularidade do procedimento atestada pelo agente de contratação e pela Assessoria Jurídica.', 'Homologo o resultado e adjudico os lotes 1 e 2 às licitantes vencedoras; autorizo a assinatura das atas de registro de preços.',
   '2026-06-03', 'c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', '18101.000944/2026-05', 'compras', 'processo_licitatorio', 'd4200000-0000-4000-8000-000000000005',
   true, '2026-06-05', 'DOE nº 4.951', '2026-06-03 11:15-04', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4560000-0000-4000-8000-000000000002', '038/2026', 2026, 'deliberacao', 'Declaração de fracasso do Pregão Eletrônico nº 007/2026 (estruturas para eventos).',
   'Todas as propostas desclassificadas, conforme ata da sessão e Parecer Técnico nº 022/2026/DIJUV.', 'Declaro fracassado o certame e determino à Divisão de Patrimônio e Compras a revisão do termo de referência e da pesquisa de preços.',
   '2026-07-02', 'c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', '18101.001302/2026-66', 'compras', 'processo_licitatorio', 'd4200000-0000-4000-8000-000000000006',
   true, '2026-07-06', 'DOE nº 4.972', '2026-07-02 10:40-04', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4560000-0000-4000-8000-000000000003', '044/2026', 2026, 'determinacao', 'Prorrogação do prazo de execução do Contrato nº 021/2026.',
   'Justificativa técnica do fiscal (chuvas acima da média) e manifestação jurídica favorável.', 'Autorizo a celebração do 1º Termo Aditivo, prorrogando o prazo de execução por 90 dias.',
   '2026-09-29', 'c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', '18101.000731/2026-90', 'contratos', 'contrato', 'd4300000-0000-4000-8000-000000000002',
   true, '2026-10-06', 'DOE nº 5.026', '2026-09-29 16:00-04', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4560000-0000-4000-8000-000000000004', '047/2026', 2026, 'determinacao', 'Abertura da fase preparatória da contratação de alimentação para os JERs 2027.',
   'Termo de demanda da Diretoria de Esporte e calendário dos Jogos Escolares de Roraima 2027.', 'Determino à Divisão de Patrimônio e Compras a elaboração do ETP, do termo de referência e da pesquisa de preços, com conclusão até 30/11/2026.',
   '2026-10-06', 'c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', '18101.003805/2026-19', 'compras', 'processo_licitatorio', 'd4200000-0000-4000-8000-000000000001',
   false, NULL, NULL, '2026-10-06 15:00-04', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4560000-0000-4000-8000-000000000005', '050/2026', 2026, 'recomendacao', 'Recomendação à fiscalização do Contrato nº 021/2026 quanto ao registro de glosas.',
   'Achado do Controle Interno na análise da 3ª medição.', 'Recomendo que toda glosa seja acompanhada de memória de cálculo e registro fotográfico juntados ao processo de pagamento.',
   '2026-10-14', 'c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000002', '18101.003894/2026-20', 'workflow', 'processo_administrativo', 'd4500000-0000-4000-8000-000000000009',
   false, NULL, NULL, '2026-10-14 10:00-04', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid);

-- ===================================================================== pareceres técnicos e jurídicos
INSERT INTO public.pareceres_tecnicos (id, numero_parecer, ano, tipo, assunto, analise, fundamentacao, conclusao, recomendacoes, data_parecer, autor_id, unidade_origem_id, processo_sei,
  modulo_origem, entidade_origem_tipo, entidade_origem_id, decisao_vinculada_id, created_at, created_by) VALUES
  ('d4550000-0000-4000-8000-000000000001', '141/2026', 2026, 'juridico', 'Análise da minuta do edital do Pregão Eletrônico nº 011/2026 (uniformes).',
   'A minuta observa o modelo padronizado, contém critérios de aceitabilidade de preços e exigências de habilitação proporcionais ao objeto. A amostra está prevista apenas para o arrematante.',
   'Lei nº 14.133/2021, arts. 18, 25 e 53.', 'Favorável à publicação do edital, condicionada ao atendimento das recomendações.',
   'Ajustar o prazo de entrega para 30 dias corridos e incluir a grade de tamanhos como anexo do termo de referência.',
   '2026-09-18', 'c0000000-0000-4000-8000-000000000017', 'a0000000-0000-4000-8000-000000000009', '18101.002540/2026-31', 'compras', 'processo_licitatorio', 'd4200000-0000-4000-8000-000000000003', NULL,
   '2026-09-18 16:00-04', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4550000-0000-4000-8000-000000000002', '022/2026', 2026, 'tecnico', 'Análise técnica das propostas do Pregão Eletrônico nº 007/2026.',
   'A proposta da primeira colocada ficou 20,2% acima do estimado e a licitante recusou a negociação. A segunda colocada apresentou atestado sem comprovação de montagem de arquibancadas e sem ART.',
   'Termo de referência, itens 8.3 e 9.1.', 'Pela desclassificação de ambas as propostas e pelo fracasso do certame.', 'Revisar a pesquisa de preços com cotações de fornecedores de outros estados.',
   '2026-06-30', 'c0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000004', '18101.001302/2026-66', 'compras', 'processo_licitatorio', 'd4200000-0000-4000-8000-000000000006',
   'd4560000-0000-4000-8000-000000000002', '2026-06-30 17:00-04', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4550000-0000-4000-8000-000000000003', '044/2026', 2026, 'controle_interno', 'Fase preparatória da Concorrência nº 001/2026 (quadra de Rorainópolis).',
   'Constam projeto básico, ART, planilha SINAPI, cronograma físico-financeiro, declaração orçamentária e minutas aprovadas pela Assessoria Jurídica.',
   'Lei nº 14.133/2021, arts. 18 e 53, § 4º.', 'Regular a fase preparatória; nada a opor ao prosseguimento.', NULL,
   '2026-03-26', 'c0000000-0000-4000-8000-000000000010', 'a0000000-0000-4000-8000-000000000002', '18101.000731/2026-90', 'workflow', 'processo_administrativo', 'd4500000-0000-4000-8000-000000000004', NULL,
   '2026-03-26 11:00-04', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4550000-0000-4000-8000-000000000004', '063/2026', 2026, 'juridico', 'Prorrogação do prazo de execução do Contrato nº 021/2026.',
   'O pedido está instruído com relatório do fiscal, diário de obra e dados pluviométricos do período. Não há alteração de valor.',
   'Lei nº 14.133/2021, arts. 107 e 124, I.', 'Favorável à celebração do 1º Termo Aditivo de prazo.', 'Atualizar a garantia contratual para cobrir o novo prazo.',
   '2026-09-25', 'c0000000-0000-4000-8000-000000000017', 'a0000000-0000-4000-8000-000000000009', '18101.000731/2026-90', 'contratos', 'contrato', 'd4300000-0000-4000-8000-000000000002',
   'd4560000-0000-4000-8000-000000000003', '2026-09-25 15:00-04', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4550000-0000-4000-8000-000000000005', '017/2026', 2026, 'contabil', 'Liquidação da 3ª medição do Contrato nº 021/2026.',
   'Nota fiscal compatível com a medição atestada; retenções de ISS (5%) e INSS (11% sobre a mão de obra) calculadas.',
   'Lei nº 4.320/1964, art. 63.', 'Apta à liquidação no valor líquido apurado.', NULL,
   '2026-10-19', 'c0000000-0000-4000-8000-000000000010', 'a0000000-0000-4000-8000-000000000006', '18101.003894/2026-20', 'workflow', 'processo_administrativo', 'd4500000-0000-4000-8000-000000000009', NULL,
   '2026-10-19 16:00-04', NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid);

-- ===================================================================== instituições parceiras
INSERT INTO public.instituicoes (id, codigo_instituicao, tipo_instituicao, nome_razao_social, nome_fantasia, cnpj, esfera_governo, orgao_vinculado,
  endereco_logradouro, endereco_numero, endereco_bairro, endereco_cidade, endereco_uf, endereco_cep, telefone, email,
  responsavel_nome, responsavel_cpf, responsavel_cargo, responsavel_telefone, responsavel_email, ato_constituicao, data_fundacao, area_atuacao, observacoes, status, ativo, created_by) VALUES
  ('d4700000-0000-4000-8000-000000000001', 'INS-0001', 'formal', 'Associação Desportiva Juventude do Lavrado', 'ADJL', pg_temp.cnpj('193847260001'), NULL, NULL,
   'Rua Uraricoera', '455', 'Pintolândia', 'Boa Vista', 'RR', '69317-230', '(95) 99120-4471', 'contato@adjl.exemplo.test',
   'Rosângela Pereira Damasceno', pg_temp.cpf('193847261'), 'Presidente', '(95) 99120-4471', 'presidencia@adjl.exemplo.test', 'Estatuto registrado no 1º Ofício de Registro Civil de Boa Vista', '2011-05-14', ARRAY['basquete', 'futsal', 'esporte educacional'], NULL, 'ativo', true, NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4700000-0000-4000-8000-000000000002', 'INS-0002', 'formal', 'Instituto Social Novo Horizonte', 'ISNH', pg_temp.cnpj('274615830001'), NULL, NULL,
   'Av. Venezuela', '2210', 'Mecejana', 'Boa Vista', 'RR', '69304-600', '(95) 99135-8820', 'secretaria@novohorizonte.exemplo.test',
   'Edson Barbosa Leitão', pg_temp.cpf('274615831'), 'Diretor-Presidente', '(95) 99135-8820', 'edson@novohorizonte.exemplo.test', 'Estatuto social e ata de eleição da diretoria', '2015-09-02', ARRAY['juventude', 'contraturno escolar', 'atletismo'], 'Pendente de CNDT válida (ver processo 00008/2026).', 'ativo', true, NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4700000-0000-4000-8000-000000000003', 'INS-0003', 'orgao_publico', 'Prefeitura Municipal de Rorainópolis', 'Prefeitura de Rorainópolis', pg_temp.cnpj('048372190001'), 'municipal', 'Secretaria Municipal de Esporte e Lazer',
   'Av. Senador Hélio Campos', 's/n', 'Centro', 'Rorainópolis', 'RR', '69373-000', '(95) 3238-1100', 'esporte@rorainopolis.exemplo.test',
   'Valdir Nascimento Prestes', pg_temp.cpf('048372191'), 'Secretário Municipal de Esporte e Lazer', '(95) 99171-0042', 'secretario.esporte@rorainopolis.exemplo.test', NULL, NULL, ARRAY['gestão de equipamentos esportivos'], 'Parceira na gestão da quadra poliesportiva reformada.', 'ativo', true, NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4700000-0000-4000-8000-000000000004', 'INS-0004', 'informal', 'Coletivo Skate Lavrado', NULL, NULL, NULL, NULL,
   'Praça das Águas', 's/n', 'Centro', 'Boa Vista', 'RR', '69301-000', '(95) 99102-7735', 'skatelavrado@exemplo.test',
   'Igor Menezes Sampaio', pg_temp.cpf('391027731'), 'Articulador', '(95) 99102-7735', 'igor.skate@exemplo.test', NULL, NULL, ARRAY['skate', 'cultura urbana'], 'Grupo sem CNPJ; participa do Festival Juventude em Movimento.', 'pendente_validacao', true, NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d4700000-0000-4000-8000-000000000005', 'INS-0005', 'formal', 'Associação Esportiva Vila Jardim', 'AEVJ', pg_temp.cnpj('318470560001'), NULL, NULL,
   'Rua Jacamim', '120', 'Jardim Caranã', 'Boa Vista', 'RR', '69313-410', '(95) 99158-3360', 'aevj@exemplo.test',
   'Sebastião Rocha Albuquerque', pg_temp.cpf('318470561'), 'Presidente', '(95) 99158-3360', 'sebastiao.aevj@exemplo.test', 'Estatuto social', '2008-03-21', ARRAY['futebol', 'futsal'], 'Novas parcerias suspensas até a conclusão da apuração em curso.', 'inativo', false, NULLIF(current_setting('request.jwt.claim.sub'), '')::uuid);

-- ===================================================================== pedidos de aprovação (Central de Aprovações)
-- só há um login no banco de teste: ele é o solicitante e, nos decididos, o aprovador. Delegação (approval_delegations)
-- exige dois logins distintos e fica sem exemplo.
INSERT INTO public.approval_requests (id, entity_type, entity_id, module_name, status, requester_id, requester_org_unit_id, submitted_at, justification, attachments,
  approver_id, approved_at, approver_decision, priority, due_date, created_at, updated_at, status_history)
SELECT a.id::uuid, a.etype, a.eid::uuid, a.modulo, a.st::public.approval_status, u.id, 'a0000000-0000-4000-8000-000000000005', a.sub::timestamptz, a.just, '[]'::jsonb,
       CASE WHEN a.st IN ('approved', 'rejected') THEN u.id END, CASE WHEN a.st IN ('approved', 'rejected') THEN a.dec_em::timestamptz END, a.dec,
       a.prio, a.prazo::timestamptz, coalesce(a.sub::timestamptz, timestamptz '2026-10-22 09:00-04'), coalesce(a.dec_em::timestamptz, a.sub::timestamptz, timestamptz '2026-10-22 09:00-04'),
       CASE WHEN a.sub IS NULL THEN '[]'::jsonb
            ELSE jsonb_build_array(jsonb_build_object('from', 'draft', 'to', 'submitted', 'changed_at', a.sub, 'changed_by', u.id))
                 || CASE WHEN a.st IN ('in_review', 'approved', 'rejected') THEN jsonb_build_array(jsonb_build_object('from', 'submitted', 'to', 'in_review', 'changed_at', a.sub, 'changed_by', u.id)) ELSE '[]'::jsonb END
                 || CASE WHEN a.st IN ('approved', 'rejected') THEN jsonb_build_array(jsonb_build_object('from', 'in_review', 'to', a.st, 'changed_at', a.dec_em, 'changed_by', u.id)) ELSE '[]'::jsonb END
       END
FROM (VALUES
  ('d4800000-0000-4000-8000-000000000001', 'fin_solicitacoes', 'f6300000-0000-4000-8000-000000000002', 'financeiro', 'submitted', '2026-10-01 10:00-04',
   'Medalhas para os Jogos Escolares: solicitação de despesa aguardando análise.', NULL, NULL, 'high', '2026-10-30 18:00-04'),
  ('d4800000-0000-4000-8000-000000000002', 'medicoes_contrato', 'd4330000-0000-4000-8000-000000000004', 'contratos', 'in_review', '2026-10-21 14:00-04',
   '4ª medição do Contrato nº 021/2026 (R$ 195.000,00), aguardando vistoria do fiscal.', NULL, NULL, 'normal', '2026-10-31 18:00-04'),
  ('d4800000-0000-4000-8000-000000000003', 'contrato_alteracoes', 'd4310000-0000-4000-8000-000000000003', 'contratos', 'approved', '2026-10-14 09:00-04',
   'Prorrogação do contrato de limpeza do ginásio por 6 meses.', '2026-10-17 16:30-04', 'Aprovado. Providenciar publicação do extrato no DOE.', 'normal', '2026-10-20 18:00-04'),
  ('d4800000-0000-4000-8000-000000000004', 'processos_licitatorios', 'd4200000-0000-4000-8000-000000000006', 'compras', 'rejected', '2026-06-24 10:00-04',
   'Pedido de adjudicação do lote único do PE nº 007/2026 à primeira colocada.', '2026-06-30 17:30-04', 'Rejeitado: proposta acima do estimado e sem aceite de negociação.', 'high', '2026-07-01 18:00-04'),
  ('d4800000-0000-4000-8000-000000000005', 'contratos', 'd4300000-0000-4000-8000-000000000005', 'contratos', 'draft', NULL,
   'Minuta do Contrato nº 022/2026 (hospedagem – Jogos Abertos) para assinatura.', NULL, NULL, 'normal', '2026-11-03 18:00-04')
) AS a(id, etype, eid, modulo, st, sub, just, dec_em, dec, prio, prazo)
CROSS JOIN (SELECT id FROM public.profiles WHERE servidor_id = 'c0000000-0000-4000-8000-000000000001') u;

-- ===================================================================== conferência
SELECT 'processos_licitatorios (novos)' AS tabela, count(*) FROM public.processos_licitatorios WHERE id::text LIKE 'd42%'
UNION ALL SELECT 'itens_licitacao', count(*) FROM public.itens_licitacao
UNION ALL SELECT 'itens_processo_licitatorio', count(*) FROM public.itens_processo_licitatorio
UNION ALL SELECT 'propostas_licitacao', count(*) FROM public.propostas_licitacao
UNION ALL SELECT 'documentos_preparatorios_licitacao', count(*) FROM public.documentos_preparatorios_licitacao
UNION ALL SELECT 'publicacoes_legais', count(*) FROM public.publicacoes_legais
UNION ALL SELECT 'contratos (novos)', count(*) FROM public.contratos WHERE id::text LIKE 'd43%'
UNION ALL SELECT 'itens_contrato', count(*) FROM public.itens_contrato
UNION ALL SELECT 'contrato_alteracoes', count(*) FROM public.contrato_alteracoes
UNION ALL SELECT 'medicoes_contrato', count(*) FROM public.medicoes_contrato
UNION ALL SELECT 'atas_registro_preco', count(*) FROM public.atas_registro_preco
UNION ALL SELECT 'itens_ata_registro_preco', count(*) FROM public.itens_ata_registro_preco
UNION ALL SELECT 'comissoes', count(*) FROM public.comissoes
UNION ALL SELECT 'comissoes_membros', count(*) FROM public.comissoes_membros
UNION ALL SELECT 'processos_administrativos', count(*) FROM public.processos_administrativos
UNION ALL SELECT 'movimentacoes_processo', count(*) FROM public.movimentacoes_processo
UNION ALL SELECT 'processo_checklist_respostas', count(*) FROM public.processo_checklist_respostas
UNION ALL SELECT 'despachos', count(*) FROM public.despachos
UNION ALL SELECT 'documentos_processo', count(*) FROM public.documentos_processo
UNION ALL SELECT 'encaminhamentos', count(*) FROM public.encaminhamentos
UNION ALL SELECT 'prazos_processo', count(*) FROM public.prazos_processo
UNION ALL SELECT 'pareceres_tecnicos', count(*) FROM public.pareceres_tecnicos
UNION ALL SELECT 'decisoes_administrativas', count(*) FROM public.decisoes_administrativas
UNION ALL SELECT 'acesso_processo_sigiloso', count(*) FROM public.acesso_processo_sigiloso
UNION ALL SELECT 'instituicoes', count(*) FROM public.instituicoes
UNION ALL SELECT 'approval_requests', count(*) FROM public.approval_requests;

COMMIT;
