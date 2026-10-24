-- Dados de demonstração — 00: dá cara de real ao que o dados-teste.sql criou. Só para o banco de TESTE.
--
-- O dados-teste.sql marca tudo como "(fictício)"/"(exemplo)" para quem lê o SQL; numa demonstração isso
-- atrapalha. Este arquivo reescreve só TEXTOS (nomes, objetos, endereços, descrições, números de documento),
-- pelos mesmos ids, sem criar nem apagar linha. Continua tudo inventado: pessoas, CPFs, CNPJs, e-mails
-- (@exemplo.test) e telefones não são de ninguém. Guia: docs/NOVO_BANCO.md §9.
-- Pode rodar mais de uma vez (cada UPDATE grava o mesmo valor).
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
END $$;
SELECT set_config('request.jwt.claim.sub', coalesce((SELECT id::text FROM public.profiles
  WHERE servidor_id = 'c0000000-0000-4000-8000-000000000001'), ''), true) AS _ \gset

-- ===================================================================== unidades que os modelos de processo citam
-- (processo_modelo_etapas usa as siglas CI, CPL, NuAlm e NuPat; sem a unidade, a etapa fica sem setor)
INSERT INTO public.estrutura_organizacional (id, nome, sigla, tipo, nivel, superior_id, ordem, ativo, email) VALUES
  ('a0000000-0000-4000-8000-000000000010', 'Controle Interno', 'CI', 'assessoria', 2, 'a0000000-0000-4000-8000-000000000001', 10, true, 'controleinterno@idjuv.exemplo.test'),
  ('a0000000-0000-4000-8000-000000000011', 'Comissão Permanente de Licitação', 'CPL', 'coordenacao', 3, 'a0000000-0000-4000-8000-000000000002', 11, true, 'cpl@idjuv.exemplo.test'),
  ('a0000000-0000-4000-8000-000000000012', 'Núcleo de Almoxarifado', 'NuAlm', 'nucleo', 4, 'a0000000-0000-4000-8000-000000000007', 12, true, 'almoxarifado@idjuv.exemplo.test'),
  ('a0000000-0000-4000-8000-000000000013', 'Núcleo de Patrimônio', 'NuPat', 'nucleo', 4, 'a0000000-0000-4000-8000-000000000007', 13, true, 'patrimonio.nucleo@idjuv.exemplo.test')
ON CONFLICT (id) DO NOTHING;

-- ===================================================================== tabelas e parâmetros da folha
UPDATE public.tabela_inss SET descricao = 'Faixa ' || faixa_ordem WHERE vigencia_inicio = '2026-01-01';
UPDATE public.tabela_irrf SET descricao = replace(descricao, ' (exemplo)', '') WHERE vigencia_inicio = '2026-01-01';
UPDATE public.parametros_folha SET descricao = replace(descricao, ' (exemplo)', '') WHERE descricao LIKE '% (exemplo)';
UPDATE public.rubricas r SET descricao = v.d
FROM (VALUES ('T001', 'Gratificação de Representação'), ('T002', 'Auxílio-Alimentação'),
             ('T101', 'Empréstimo Consignado'), ('T102', 'Contribuição Sindical')) AS v(c, d)
WHERE r.codigo = v.c;

-- ===================================================================== servidores
CREATE TEMP TABLE _p (n int, nome text, mae text, email text, rua text, bairro text, cep text) ON COMMIT DROP;
INSERT INTO _p VALUES
  ( 1, 'Rafael Henrique Andrade',   'Marlene Andrade da Silva',      'rafael.andrade',      'Rua Cecília Brasil',              'Centro',           '69301-380'),
  ( 2, 'Helena Prado Moura',        'Ivone Prado Moura',             'helena.moura',        'Av. Ville Roy',                   'Caçari',           '69307-725'),
  ( 3, 'Ricardo Lemos Bastos',      'Zuleide Lemos Bastos',          'ricardo.bastos',      'Rua Coronel Pinto',               'Centro',           '69301-150'),
  ( 4, 'Patrícia Nogueira Sales',   'Raimunda Nogueira Sales',       'patricia.sales',      'Av. Ataíde Teive',                'Liberdade',        '69309-100'),
  ( 5, 'Bruno Cavalcante Reis',     'Socorro Cavalcante Reis',       'bruno.reis',          'Av. Capitão Ene Garcez',          'São Francisco',    '69305-135'),
  ( 6, 'Fernanda Albuquerque Lins', 'Teresinha Albuquerque Lins',    'fernanda.lins',       'Rua Professor Agnelo Bitencourt', 'Centro',           '69301-430'),
  ( 7, 'Marcos Vinícius Teles',     'Lúcia Helena Teles',            'marcos.teles',        'Av. Glaycon de Paiva',            'Mecejana',         '69304-045'),
  ( 8, 'Juliana Freitas Barros',    'Antônia Freitas Barros',        'juliana.barros',      'Rua Pedro Rodrigues',             'Aparecida',        '69306-280'),
  ( 9, 'André Luiz Medeiros',       'Francisca Luiz Medeiros',       'andre.medeiros',      'Av. Major Williams',              'São Vicente',      '69303-035'),
  (10, 'Camila Rocha Antunes',      'Rosângela Rocha Antunes',       'camila.antunes',      'Rua Araújo Filho',                'Paraviana',        '69307-470'),
  (11, 'Diego Sampaio Furtado',     'Edileuza Sampaio Furtado',      'diego.furtado',       'Rua Alfredo Cruz',                'Pricumã',          '69309-380'),
  (12, 'Larissa Monteiro Paiva',    'Sandra Monteiro Paiva',         'larissa.paiva',       'Av. das Guianas',                 '31 de Março',      '69306-510'),
  (13, 'Thiago Barreto Cunha',      'Marilene Barreto Cunha',        'thiago.cunha',        'Rua Benjamin Constant',           'Centro',           '69301-020'),
  (14, 'Aline Castro Vieira',       'Josefa Castro Vieira',          'aline.vieira',        'Av. Mário Homem de Melo',         'Buritis',          '69309-200'),
  (15, 'Gustavo Pereira Lago',      'Neide Pereira Lago',            'gustavo.lago',        'Rua Floriano Peixoto',            'Canarinho',        '69306-090'),
  (16, 'Renata Duarte Fontes',      'Célia Duarte Fontes',           'renata.fontes',       'Av. Santos Dumont',               'Jardim Floresta',  '69312-345'),
  (17, 'Eduardo Matos Quintela',    'Graça Matos Quintela',          'eduardo.quintela',    'Rua Jaime Brasil',                'Cauamé',           '69314-150'),
  (18, 'Sofia Ramalho Torres',      'Vera Lúcia Ramalho Torres',     'sofia.torres',        'Av. Venezuela',                   'Asa Branca',       '69312-610');

UPDATE public.servidores s SET
  nome_completo = p.nome, nome_mae = p.mae,
  email_pessoal = p.email || '@exemplo.test',
  email_institucional = CASE WHEN s.user_id IS NULL THEN p.email || '@idjuv.exemplo.test' ELSE s.email_institucional END,
  telefone_celular = '(95) 9' || (8100 + p.n * 37)::text || '-' || lpad(((p.n * 7919) % 10000)::text, 4, '0'),
  endereco_logradouro = p.rua, endereco_numero = (120 + p.n * 53)::text, endereco_bairro = p.bairro, endereco_cep = p.cep,
  banco_agencia = (ARRAY['2617-6', '3797-6', '4421-2'])[1 + p.n % 3],
  observacoes = NULL,
  -- PIS/PASEP inventado com dígito válido (o eSocial S-1200 e o contracheque usam)
  pis_pasep = (SELECT b || CASE WHEN 11 - sm % 11 >= 10 THEN 0 ELSE 11 - sm % 11 END
               FROM (SELECT b, (SELECT sum(substr(b, i, 1)::int * (ARRAY[3,2,9,8,7,6,5,4,3,2])[i]) FROM generate_series(1, 10) i) AS sm
                     FROM (SELECT '1' || lpad((204718390 + p.n * 104729)::text, 9, '0') AS b) x) y)
FROM _p p
WHERE s.id = ('c0000000-0000-4000-8000-0000000000' || lpad(p.n::text, 2, '0'))::uuid;
UPDATE public.profiles SET full_name = 'Rafael Henrique Andrade' WHERE servidor_id = 'c0000000-0000-4000-8000-000000000001';

UPDATE public.documentos d SET
  titulo = 'Nomeação de ' || p.nome,
  processo_sei = '18101.000' || lpad((300 + p.n * 7)::text, 3, '0') || '/' || extract(year FROM d.data_documento) || '-' || lpad(((p.n * 37) % 100)::text, 2, '0')
FROM _p p
WHERE d.tipo = 'portaria' AND d.categoria = 'nomeacao'
  AND d.servidores_ids = ARRAY[('c0000000-0000-4000-8000-0000000000' || lpad(p.n::text, 2, '0'))::uuid];
UPDATE public.historico_funcional SET descricao = 'Nomeação publicada no Diário Oficial do Estado'
WHERE descricao = 'Nomeação (dado fictício)';

UPDATE public.licencas_afastamentos SET observacoes = 'Atestado médico de 5 dias apresentado à DRH'
WHERE observacoes = 'Atestado fictício';
UPDATE public.licencas_afastamentos SET observacoes = 'Licença para capacitação: especialização em Gestão Pública'
WHERE observacoes = 'Curso fictício';
UPDATE public.viagens_diarias SET finalidade = 'Reunião técnica na Secretaria Nacional de Esporte Educacional, Lazer e Inclusão Social'
WHERE finalidade = 'Reunião no Ministério do Esporte (fictícia)';
UPDATE public.viagens_diarias SET finalidade = 'Acompanhar a delegação estadual nos Jogos Escolares da Região Norte'
WHERE finalidade = 'Jogos regionais (fictício)';

-- ===================================================================== unidades locais, fornecedores, bens
UPDATE public.unidades_locais u SET nome_unidade = v.nome, endereco_completo = v.ender
FROM (VALUES
  ('e0000000-0000-4000-8000-000000000001', 'Ginásio Poliesportivo Hélio da Costa Campos', 'Av. Brigadeiro Eduardo Gomes, 3060, Aeroporto'),
  ('e0000000-0000-4000-8000-000000000002', 'Estádio Flamarion Vasconcelos (Canarinho)',  'Av. Brasil, s/n, Canarinho'),
  ('e0000000-0000-4000-8000-000000000003', 'Quadra Poliesportiva do Bairro Nova Esperança', 'Rua Manaus, s/n, Nova Esperança'),
  ('e0000000-0000-4000-8000-000000000004', 'Parque Aquático da Vila Olímpica Roberto Marinho', 'Av. Brigadeiro Eduardo Gomes, s/n, Aeroporto')
) AS v(id, nome, ender)
WHERE u.id = v.id::uuid;

UPDATE public.fornecedores f SET cpf_cnpj = v.doc, razao_social = v.razao, nome_fantasia = v.fantasia,
  email = v.email, representante_nome = v.rep, telefone = v.fone
FROM (VALUES
  ('f1000000-0000-4000-8000-000000000001', '27.348.156/0001-14', 'Norte Móveis Corporativos Ltda',          'Norte Móveis',      'comercial@nortemoveis.exemplo.test',   'Carlos Eduardo Pacheco',  '(95) 3224-1187'),
  ('f1000000-0000-4000-8000-000000000002', '18.492.733/0001-56', 'Amazontec Soluções em Informática Ltda',  'Amazontec',         'vendas@amazontec.exemplo.test',        'Marina Queiroz Lopes',    '(92) 3633-4520'),
  ('f1000000-0000-4000-8000-000000000003', '35.910.287/0001-71', 'Macuxi Artigos Esportivos Eireli',        'Macuxi Esportes',   'loja@macuxiesportes.exemplo.test',     'Paulo Roberto Brito',     '(95) 3623-0954'),
  ('f1000000-0000-4000-8000-000000000004', '41.183.629/0001-00', 'Serviços Gerais Monte Roraima Ltda',      'Monte Roraima',     'adm@monteroraima.exemplo.test',        'Joana D''Arc Pinheiro',   '(95) 3626-3318'),
  ('f1000000-0000-4000-8000-000000000005', '38491270604',                 'José Ribamar Coutinho',                   NULL,                'jose.coutinho@exemplo.test',           NULL,                      '(95) 99144-2871')
) AS v(id, doc, razao, fantasia, email, rep, fone)
WHERE f.id = v.id::uuid;

UPDATE public.bens_patrimoniais b SET
  numero_patrimonio = 'IDJ.' || extract(year FROM b.data_aquisicao) || '.' || lpad(substr(b.numero_patrimonio, 7)::text, 6, '0'),
  marca = (ARRAY['Pandin', 'Flexform', 'Dell', 'LG', 'Epson', 'Penalty', 'Pangué', 'Pandin'])[1 + substr(b.numero_patrimonio, 7)::int % 8],
  modelo = (ARRAY['Mesa reta 1,40 m com gaveteiro', 'Cadeira giratória espaldar alto', 'Latitude 3440', '24MR400', 'EcoTank L6270',
                  'Bola de futsal Max 1000', 'Rede oficial de voleibol', 'Armário alto 2 portas'])[1 + substr(b.numero_patrimonio, 7)::int % 8],
  nota_fiscal = 'NF-e ' || (21400 + substr(b.numero_patrimonio, 7)::int * 13)
WHERE b.numero_patrimonio LIKE 'TESTE-%';
UPDATE public.bens_patrimoniais SET patrimonio_anterior = NULL WHERE patrimonio_anterior LIKE 'TESTE-%';

-- ===================================================================== compras, contratos e financeiro
UPDATE public.processos_licitatorios p SET objeto = v.obj
FROM (VALUES
  ('f4000000-0000-4000-8000-000000000001', 'Aquisição de mobiliário corporativo para a sede administrativa, conforme Termo de Referência'),
  ('f4000000-0000-4000-8000-000000000002', 'Aquisição de material esportivo para os Jogos Escolares de Roraima 2026'),
  ('f4000000-0000-4000-8000-000000000003', 'Contratação de serviço de limpeza e conservação do Ginásio Poliesportivo Hélio da Costa Campos')
) AS v(id, obj)
WHERE p.id = v.id::uuid;

UPDATE public.contratos c SET objeto = v.obj
FROM (VALUES
  ('f5000000-0000-4000-8000-000000000001', 'Fornecimento de mobiliário corporativo (mesas, cadeiras e armários) para a sede administrativa'),
  ('f5000000-0000-4000-8000-000000000002', 'Prestação de serviços contínuos de limpeza e conservação do Ginásio Poliesportivo Hélio da Costa Campos'),
  ('f5000000-0000-4000-8000-000000000003', 'Manutenção preventiva e corretiva de computadores e impressoras')
) AS v(id, obj)
WHERE c.id = v.id::uuid;

UPDATE public.fin_programas_orcamentarios SET nome = 'Gestão Administrativa', objetivo = 'Manter e modernizar a estrutura administrativa da autarquia'
WHERE id = 'f6000000-0000-4000-8000-000000000001';
UPDATE public.fin_programas_orcamentarios SET nome = 'Roraima no Esporte', objetivo = 'Ampliar o acesso da população ao esporte educacional, de participação e de rendimento'
WHERE id = 'f6000000-0000-4000-8000-000000000002';
UPDATE public.fin_acoes_orcamentarias SET nome = 'Administração da Unidade' WHERE id = 'f6100000-0000-4000-8000-000000000001';
UPDATE public.fin_acoes_orcamentarias SET nome = 'Realização dos Jogos Escolares de Roraima' WHERE id = 'f6100000-0000-4000-8000-000000000002';

UPDATE public.fin_solicitacoes s SET objeto = v.obj
FROM (VALUES
  ('f6300000-0000-4000-8000-000000000001', 'Pagamento da 1ª parcela do Contrato nº 001/2026 – mobiliário corporativo'),
  ('f6300000-0000-4000-8000-000000000002', 'Aquisição de troféus e medalhas para a premiação dos Jogos Escolares de Roraima 2026'),
  ('f6300000-0000-4000-8000-000000000003', 'Serviço de limpeza do Ginásio Hélio Campos – competência outubro/2026')
) AS v(id, obj)
WHERE s.id = v.id::uuid;

UPDATE public.fin_empenhos SET
  objeto = 'Despesa com aquisição de mobiliário corporativo para a sede, 1ª parcela do Contrato nº 001/2026',
  processo_sei = '18101.000214/2026-37'
WHERE numero = '2026NE00001';
UPDATE public.fin_empenhos SET
  objeto = 'Despesa estimativa com serviço de limpeza e conservação do Ginásio Hélio Campos, exercício 2026',
  processo_sei = '18101.000231/2026-08'
WHERE numero = '2026NE00002';

-- ===================================================================== governança, comunicação e portal
UPDATE public.riscos_institucionais SET descricao = replace(descricao, ' (exemplo)', '') WHERE descricao LIKE '% (exemplo)';

-- ASCOM, CMS, programas, federações, árbitros, escolas e reuniões do dados-teste ganham textos reais no
-- 07_comunicacao_portal.sql (que também renumera as demandas no formato do trigger).

COMMIT;
