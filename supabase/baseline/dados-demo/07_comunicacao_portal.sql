-- Dados FICTÍCIOS de demonstração — Comunicação (ASCOM, CMS e portal público), programas, federações,
-- árbitros, gestores escolares, gabinete/reuniões e avisos. Só para o banco de TESTE, depois de dados-teste.sql.
-- Guia: docs/NOVO_BANCO.md §9.
--
-- Pessoas, CPFs (válidos no dígito, inventados), CNPJs, e-mails (@exemplo.test) e telefones são inventados.
-- Imagens: URLs públicas e estáveis do picsum.photos (a CSP do app libera img-src https:), porque o Storage
-- do teste está vazio. Os textos das linhas do dados-teste.sql deste grupo são reescritos (UPDATE) para a
-- demonstração não exibir "(fictício)"/"exemplo".
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
  IF EXISTS (SELECT 1 FROM public.cms_galerias) THEN
    RAISE EXCEPTION 'recusado: os dados de demonstração deste módulo já foram carregados';
  END IF;
END $$;
-- quem "faz" as ações (auth.uid() nos triggers de autoria): o login de teste ligado ao servidor fictício
SELECT set_config('request.jwt.claim.sub', coalesce((SELECT id::text FROM public.profiles
  WHERE servidor_id = 'c0000000-0000-4000-8000-000000000001'), ''), true) AS _ \gset
SELECT set_config('request.jwt.claim.role', 'authenticated', true) AS _ \gset

-- CPF com dígitos verificadores válidos a partir de 9 dígitos (igual ao dados-teste.sql)
CREATE FUNCTION pg_temp.cpf(base text) RETURNS text LANGUAGE plpgsql AS $f$
DECLARE s int; d1 int; d2 int; i int;
BEGIN
  s := 0; FOR i IN 1..9 LOOP s := s + substr(base, i, 1)::int * (11 - i); END LOOP;
  d1 := 11 - s % 11; IF d1 >= 10 THEN d1 := 0; END IF;
  s := 0; FOR i IN 1..9 LOOP s := s + substr(base, i, 1)::int * (12 - i); END LOOP;
  s := s + d1 * 2; d2 := 11 - s % 11; IF d2 >= 10 THEN d2 := 0; END IF;
  RETURN base || d1 || d2;
END $f$;

-- CNPJ formatado com dígitos válidos a partir de 12 dígitos (inventado)
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

-- imagem pública estável (mesma semente → mesma foto)
CREATE FUNCTION pg_temp.img(semente text, w int DEFAULT 1200, h int DEFAULT 675) RETURNS text LANGUAGE sql AS
$f$ SELECT 'https://picsum.photos/seed/' || semente || '/' || w || '/' || h $f$;

-- ===================================================================== linhas do dados-teste.sql deste grupo: textos realistas
UPDATE public.cms_conteudos SET
  titulo = 'Jogos Escolares de Roraima 2026 começam na próxima semana em Boa Vista',
  slug = 'jogos-escolares-de-roraima-2026-comecam-na-proxima-semana',
  resumo = 'Mais de 3 mil estudantes-atletas de 15 municípios disputam 12 modalidades até o fim de novembro.',
  conteudo = 'A abertura oficial dos **Jogos Escolares de Roraima 2026** acontece no Ginásio Central, em Boa Vista, com desfile das delegações e acendimento da pira.

## Modalidades

- Atletismo, natação, judô e xadrez
- Futsal, handebol, basquete e vôlei
- Vôlei de praia, tênis de mesa, badminton e ginástica rítmica

As equipes campeãs representam o estado nos Jogos Escolares Brasileiros. A programação completa e os boletins diários são publicados no portal.',
  categoria = 'jogos-escolares', imagem_destaque_url = pg_temp.img('jers-abertura'), imagem_destaque_alt = 'Delegações no desfile de abertura',
  autor_nome = 'Assessoria de Comunicação', tags = ARRAY['jogos escolares','JERs','Boa Vista']
WHERE slug = 'teste-jogos-escolares-comecam';
UPDATE public.cms_conteudos SET
  titulo = 'Abertas as inscrições para as escolinhas esportivas do segundo semestre',
  slug = 'abertas-inscricoes-escolinhas-esportivas-segundo-semestre',
  resumo = 'São 1.200 vagas gratuitas em 9 modalidades para crianças e adolescentes de 7 a 17 anos.',
  conteudo = 'As inscrições para as **escolinhas esportivas** seguem abertas até 31 de outubro, de forma presencial na sede do instituto ou pelo portal.

Os responsáveis devem apresentar documento de identidade da criança, comprovante de residência e declaração de matrícula escolar. As aulas acontecem no contraturno, nos ginásios e quadras da rede estadual.',
  categoria = 'programas', imagem_destaque_url = pg_temp.img('escolinhas-inscricao'), imagem_destaque_alt = 'Crianças em aula de iniciação esportiva',
  autor_nome = 'Assessoria de Comunicação', tags = ARRAY['escolinhas','inscrições']
WHERE slug = 'teste-inscricoes-escolinhas';
UPDATE public.cms_conteudos SET
  titulo = 'Comunicado: horário de atendimento durante o feriado de Finados',
  slug = 'comunicado-horario-atendimento-finados',
  resumo = 'Expediente interno no dia 2 de novembro.',
  conteudo = 'Informamos que não haverá expediente no dia 2 de novembro (Finados). O atendimento ao público retorna normalmente no dia 3.',
  autor_nome = 'Assessoria de Comunicação'
WHERE slug = 'teste-rascunho-comunicado';

UPDATE public.demandas_ascom SET numero_demanda = '0001/2026-ASCOM',
  titulo = 'Cobertura da abertura dos Jogos Escolares de Roraima',
  descricao_detalhada = 'Cobertura fotográfica completa da cerimônia de abertura: desfile das delegações, autoridades, acendimento da pira e primeiros jogos. Entregar seleção de 40 fotos tratadas.',
  objetivo_institucional = 'Divulgar a principal competição escolar do estado', publico_alvo = 'Comunidade escolar e imprensa',
  data_evento = DATE '2026-11-03', hora_evento = '18:00', local_evento = 'Ginásio Central, Boa Vista',
  responsavel_ascom_id = 'c0000000-0000-4000-8000-000000000015', cargo_funcao = 'Diretora de Esporte',
  contato_email = 'diesp@exemplo.test', contato_telefone = '(95) 98100-2004'
WHERE numero_demanda = 'ASCOM-001/2026';
UPDATE public.demandas_ascom SET numero_demanda = '0002/2026-ASCOM',
  titulo = 'Arte de divulgação do programa Juventude Ativa',
  descricao_detalhada = 'Card para Instagram e stories anunciando as novas turmas do programa Juventude Ativa nos bairros Senador Hélio Campos e Pintolândia.',
  objetivo_institucional = 'Ampliar as inscrições do programa', publico_alvo = 'Jovens de 15 a 29 anos', cargo_funcao = 'Diretor de Juventude',
  contato_email = 'dijuv@exemplo.test', contato_telefone = '(95) 98100-2005'
WHERE numero_demanda = 'ASCOM-002/2026';

UPDATE public.programas SET nome = 'Juventude Ativa', descricao = 'Atividades esportivas, culturais e de cidadania no contraturno para jovens em bairros de maior vulnerabilidade social.'
WHERE codigo = 'PRG-01';
UPDATE public.programas SET nome = 'Escolinhas Esportivas', descricao = 'Iniciação esportiva gratuita em ginásios e quadras do estado, com professores de educação física do instituto.'
WHERE codigo = 'PRG-02';

UPDATE public.federacoes_esportivas SET nome = 'Federação Roraimense de Futsal', sigla = 'FRFS', cnpj = pg_temp.cnpj('074310450001'),
  endereco = 'Rua Coronel Pinto, 412, Centro, Boa Vista/RR', endereco_logradouro = 'Rua Coronel Pinto', endereco_numero = '412', endereco_bairro = 'Centro',
  email = 'contato@frfs.exemplo.test', instagram = '@frfs.rr',
  presidente_nome = 'Raimundo Nonato Bezerra Filho', presidente_email = 'presidencia@frfs.exemplo.test', presidente_nascimento = DATE '1968-04-17',
  vice_presidente_nome = 'Josiane Carvalho Pantoja', diretor_tecnico_nome = 'Wellington Sousa Macedo', diretor_tecnico_telefone = '(95) 98123-4410'
WHERE sigla = 'FEF';
UPDATE public.federacoes_esportivas SET nome = 'Federação Roraimense de Voleibol', sigla = 'FRV', cnpj = pg_temp.cnpj('083226710001'),
  endereco = 'Av. Ville Roy, 1880, São Pedro, Boa Vista/RR', endereco_logradouro = 'Av. Ville Roy', endereco_numero = '1880', endereco_bairro = 'São Pedro',
  email = 'contato@frv.exemplo.test', instagram = '@voleiroraima',
  presidente_nome = 'Luciana Mota Albuquerque', presidente_email = 'presidencia@frv.exemplo.test', presidente_nascimento = DATE '1974-09-02',
  vice_presidente_nome = 'Francisco das Chagas Rocha'
WHERE sigla = 'FEV';

UPDATE public.cadastro_arbitros SET nome = 'Cleiton Barbosa Amorim', email = 'cleiton.amorim@exemplo.test', protocolo = 'ARB-2026-00001',
  nacionalidade = 'brasileira', tipo_sanguineo = 'O', fator_rh = '+', rg = '387114', cep = '69312-000', endereco = 'Rua das Acácias, 233',
  bairro = 'Buritis', local_trabalho = 'Secretaria Municipal de Educação', funcao = 'Professor', esfera = 'municipal', categoria = 'estadual'
WHERE protocolo = 'ARB-TESTE-0001';
UPDATE public.cadastro_arbitros SET nome = 'Marta Regina Coutinho Lima', email = 'marta.coutinho@exemplo.test', protocolo = 'ARB-2026-00002',
  nacionalidade = 'brasileira', tipo_sanguineo = 'A', fator_rh = '+', rg = '402558', cep = '69305-120', endereco = 'Av. Glaycon de Paiva, 1450',
  bairro = 'Mecejana', local_trabalho = 'Escola Estadual Monteiro Lobato', funcao = 'Coordenadora pedagógica', esfera = 'estadual', categoria = 'nacional',
  modalidade = 'Vôlei'
WHERE protocolo = 'ARB-TESTE-0002';

UPDATE public.escolas_jer SET nome = 'Escola Estadual Professora Maria das Dores Brasil', inep = '14012471' WHERE id = 'f7000000-0000-4000-8000-000000000001';
UPDATE public.escolas_jer SET nome = 'Escola Estadual Ayrton Senna da Silva', inep = '14020539' WHERE id = 'f7000000-0000-4000-8000-000000000002';
UPDATE public.gestores_escolares SET nome = 'Rosângela Ferreira Matos', email = 'rosangela.matos@exemplo.test' WHERE escola_id = 'f7000000-0000-4000-8000-000000000001';
UPDATE public.gestores_escolares SET nome = 'Edmilson Pereira Cordeiro', email = 'edmilson.cordeiro@exemplo.test' WHERE escola_id = 'f7000000-0000-4000-8000-000000000002';

UPDATE public.reunioes SET titulo = 'Planejamento operacional dos Jogos Escolares de Roraima 2026',
  pauta = '1. Calendário das competições por modalidade
2. Logística de transporte e alojamento das delegações do interior
3. Plano de comunicação e credenciamento de imprensa
4. Equipe de arbitragem e atendimento médico',
  numero_protocolo = 'REU-2026-0011', observacoes = 'Trazer a planilha de delegações confirmadas.'
WHERE titulo = 'Reunião de planejamento dos Jogos Escolares (fictícia)';
UPDATE public.reunioes SET titulo = 'Reunião ordinária da Diretoria — balanço do 3º trimestre',
  pauta = '1. Execução orçamentária até setembro
2. Situação dos contratos de manutenção dos ginásios
3. Andamento dos programas Juventude Ativa e Escolinhas Esportivas
4. Informes gerais',
  numero_protocolo = 'REU-2026-0009', ata_aprovada = true,
  ata_conteudo = 'Aos dias da reunião, no Gabinete da Presidência, reuniram-se os diretores do instituto sob a presidência de Helena Prado Moura.

1. A DIRAF apresentou a execução orçamentária: 61% da dotação empenhada até setembro. Deliberou-se priorizar os empenhos dos Jogos Escolares.
2. O contrato de limpeza do Ginásio Central vence em 30/11; a DIRAF abrirá o processo de prorrogação.
3. A DIESP e a DIJUV relataram 1.180 inscritos no Juventude Ativa e 760 alunos nas escolinhas.

Nada mais havendo, a reunião foi encerrada e lavrada a presente ata.'
WHERE titulo = 'Reunião de diretoria (fictícia)';

-- ===================================================================== CMS: notícias e conteúdos do portal
INSERT INTO public.cms_conteudos (id, titulo, slug, subtitulo, resumo, conteudo, tipo, destino, categoria, tags, imagem_destaque_url, imagem_destaque_alt,
  status, destaque, data_publicacao, autor_id, autor_nome, visualizacoes) VALUES
  ('d7000000-0000-4000-8000-000000000001', 'Roraima conquista 14 medalhas nos Jogos Escolares Brasileiros', 'roraima-conquista-14-medalhas-jogos-escolares-brasileiros',
   'Delegação estadual teve a melhor campanha da história na competição nacional', 'Atletismo e judô lideraram o quadro de medalhas da delegação roraimense em Brasília.',
   'A delegação de Roraima encerrou sua participação nos **Jogos Escolares Brasileiros** com 14 medalhas: 4 de ouro, 3 de prata e 7 de bronze.

## Destaques

- Atletismo: ouro nos 800 m e no salto em distância
- Judô: dois ouros no sub-17
- Natação: três bronzes no revezamento

A presidente do instituto recebeu os atletas no Aeroporto Internacional de Boa Vista e anunciou a ampliação do programa Bolsa Atleta para 2027.',
   'noticia', 'portal_noticias', 'resultados', ARRAY['JEBs','medalhas','atletismo','judô'], pg_temp.img('jebs-medalhas'), 'Atletas de Roraima no pódio',
   'publicado', true, timestamptz '2026-10-21 09:30-04', NULL, 'Assessoria de Comunicação', 842),
  ('d7000000-0000-4000-8000-000000000002', 'Jogos Abertos de Roraima reúnem 11 municípios em Rorainópolis', 'jogos-abertos-de-roraima-reunem-11-municipios-rorainopolis',
   NULL, 'Competição adulta teve 1.400 atletas em 10 modalidades durante quatro dias.',
   'Os **Jogos Abertos de Roraima** foram realizados em Rorainópolis, no sul do estado, com delegações de 11 municípios.

Boa Vista ficou com o título geral, seguida de Caracaraí e Mucajaí. O futsal masculino teve final decidida nos pênaltis, com o ginásio lotado.

> O interior mostrou a força do esporte roraimense.

A próxima edição já tem sede definida: Pacaraima.',
   'noticia', 'portal_noticias', 'eventos', ARRAY['Jogos Abertos','Rorainópolis','interior'], pg_temp.img('jogos-abertos-rr'), 'Final do futsal masculino nos Jogos Abertos',
   'publicado', true, timestamptz '2026-10-14 17:00-04', NULL, 'Assessoria de Comunicação', 615),
  ('d7000000-0000-4000-8000-000000000003', 'Programa Juventude Ativa abre novas turmas em três bairros de Boa Vista', 'juventude-ativa-abre-novas-turmas-tres-bairros',
   NULL, 'Senador Hélio Campos, Pintolândia e Cidade Satélite recebem oficinas de esporte, música e cidadania.',
   'O programa **Juventude Ativa** passa a atender mais 300 jovens com a abertura de turmas nos bairros Senador Hélio Campos, Pintolândia e Cidade Satélite.

As atividades acontecem de segunda a sexta, no contraturno escolar, e incluem futsal, vôlei, capoeira, oficinas de música e rodas de conversa sobre empregabilidade.',
   'noticia', 'portal_noticias', 'programas', ARRAY['Juventude Ativa','juventude'], pg_temp.img('juventude-ativa-turmas'), 'Jovens em oficina do programa',
   'publicado', false, timestamptz '2026-10-09 10:15-04', NULL, 'Assessoria de Comunicação', 377),
  ('d7000000-0000-4000-8000-000000000004', 'Instituto entrega reforma do Ginásio Central', 'instituto-entrega-reforma-ginasio-central',
   NULL, 'Obra incluiu novo piso, iluminação em LED e acessibilidade nas arquibancadas.',
   'Após seis meses de obras, o **Ginásio Central** foi reaberto com piso esportivo novo, iluminação em LED, vestiários reformados e rampas de acessibilidade.

O espaço recebe a abertura dos Jogos Escolares de Roraima e volta a sediar as competições das federações estaduais.',
   'noticia', 'portal_noticias', 'institucional', ARRAY['infraestrutura','Ginásio Central'], pg_temp.img('ginasio-reforma'), 'Ginásio Central reformado',
   'publicado', false, timestamptz '2026-09-30 11:00-04', NULL, 'Assessoria de Comunicação', 529),
  ('d7000000-0000-4000-8000-000000000005', 'Bolsa Atleta 2026: confira a lista de contemplados', 'bolsa-atleta-2026-lista-de-contemplados',
   NULL, 'Foram contemplados 86 atletas e paratletas de 19 modalidades.',
   'O instituto divulgou o resultado final do **Bolsa Atleta 2026**. Os 86 contemplados recebem o benefício por 12 meses, nas categorias estudantil, estadual, nacional e paralímpica.

A lista completa está disponível no Portal da Transparência. Recursos podem ser apresentados em até cinco dias úteis.',
   'noticia', 'portal_noticias', 'programas', ARRAY['Bolsa Atleta','resultado'], pg_temp.img('bolsa-atleta-2026'), 'Atletas contemplados pelo Bolsa Atleta',
   'publicado', false, timestamptz '2026-09-18 15:40-04', NULL, 'Assessoria de Comunicação', 1290),
  ('d7000000-0000-4000-8000-000000000006', 'Caracaraí recebe etapa regional dos Jogos Escolares', 'caracarai-recebe-etapa-regional-jogos-escolares',
   NULL, 'Escolas de Caracaraí, Iracema e Mucajaí disputam vagas para a fase estadual.',
   'A etapa regional centro dos **Jogos Escolares de Roraima** acontece em Caracaraí, com 42 equipes de 18 escolas.

As campeãs de cada modalidade garantem vaga na fase estadual, em Boa Vista.',
   'noticia', 'portal_noticias', 'jogos-escolares', ARRAY['JERs','Caracaraí'], pg_temp.img('caracarai-regional'), 'Equipes escolares em quadra',
   'publicado', false, timestamptz '2026-09-05 08:20-04', NULL, 'Assessoria de Comunicação', 288),
  ('d7000000-0000-4000-8000-000000000007', 'Corrida da Juventude reúne 2 mil participantes na orla Taumanan', 'corrida-da-juventude-reune-2-mil-participantes',
   NULL, 'Prova de 5 km e caminhada de 3 km marcaram o Dia Nacional da Juventude.',
   'A **Corrida da Juventude** reuniu cerca de 2 mil pessoas na orla Taumanan. Os três primeiros de cada categoria receberam troféus e os participantes, medalha de conclusão.',
   'noticia', 'portal_noticias', 'eventos', ARRAY['corrida','juventude'], pg_temp.img('corrida-juventude'), 'Largada da Corrida da Juventude',
   'publicado', false, timestamptz '2026-08-12 19:00-04', NULL, 'Assessoria de Comunicação', 701),
  ('d7000000-0000-4000-8000-000000000008', 'Seletivas para os Jogos da Juventude têm inscrições prorrogadas', 'seletivas-jogos-da-juventude-inscricoes-prorrogadas',
   NULL, 'Atletas nascidos entre 2009 e 2012 podem se inscrever até 7 de novembro.',
   'As **seletivas estaduais** que formam a delegação de Roraima nos Jogos da Juventude tiveram as inscrições prorrogadas até 7 de novembro.

As avaliações ocorrem no Ginásio Central e no Parque Aquático, conforme o cronograma de cada modalidade.',
   'noticia', 'selecoes_estudantis', 'jogos-juventude', ARRAY['seletivas','Jogos da Juventude'], pg_temp.img('seletivas-juventude'), 'Atletas em avaliação técnica',
   'publicado', true, timestamptz '2026-10-20 12:00-04', NULL, 'Assessoria de Comunicação', 455),
  ('d7000000-0000-4000-8000-000000000009', 'Seletiva de natação define equipe para os Jogos da Juventude', 'seletiva-natacao-define-equipe-jogos-juventude',
   NULL, 'Doze nadadores garantiram vaga na delegação estadual.',
   'A seletiva de natação, no **Parque Aquático**, definiu os 12 atletas que representam Roraima nos Jogos da Juventude.',
   'noticia', 'selecoes_estudantis', 'jogos-juventude', ARRAY['seletivas','natação'], pg_temp.img('seletiva-natacao'), 'Nadadores na seletiva',
   'publicado', false, timestamptz '2026-10-06 18:30-04', NULL, 'Assessoria de Comunicação', 214),
  ('d7000000-0000-4000-8000-000000000010', 'Festival de eSports Roraima Conecta tem final presencial', 'festival-esports-roraima-conecta-final-presencial',
   NULL, 'Final dos torneios de futebol virtual e MOBA acontece no auditório do instituto.',
   'O **Roraima Conecta** encerra a temporada com final presencial. As equipes classificadas jogam diante do público, com transmissão pelas redes do instituto.',
   'noticia', 'esports', 'esports', ARRAY['eSports'], pg_temp.img('esports-final'), 'Jogadores na final do festival',
   'publicado', false, timestamptz '2026-10-02 14:00-04', NULL, 'Assessoria de Comunicação', 163),
  ('d7000000-0000-4000-8000-000000000011', 'Instituto lança edital de apoio a eventos esportivos municipais', 'edital-apoio-eventos-esportivos-municipais',
   NULL, 'Prefeituras e federações podem solicitar apoio com material esportivo e arbitragem.', 'Texto em revisão pela Assessoria Jurídica.',
   'noticia', 'portal_noticias', 'institucional', ARRAY['edital'], NULL, NULL,
   'revisao', false, NULL, NULL, 'Assessoria de Comunicação', 0),
  ('d7000000-0000-4000-8000-000000000012', 'Abertura dos Jogos Escolares terá show e desfile das delegações', 'abertura-jogos-escolares-show-desfile',
   NULL, 'Cerimônia será no dia 3 de novembro, às 18h, no Ginásio Central.', 'Programação da cerimônia de abertura, aprovada pela Diretoria de Esporte.',
   'evento', 'portal_eventos', 'eventos', ARRAY['JERs','abertura'], pg_temp.img('jers-cerimonia'), 'Cerimônia de abertura',
   'aprovado', false, NULL, NULL, 'Assessoria de Comunicação', 0),
  ('d7000000-0000-4000-8000-000000000013', 'Resultado das inscrições das escolinhas 2025', 'resultado-inscricoes-escolinhas-2025',
   NULL, 'Lista de alunos matriculados nas escolinhas em 2025.', 'Conteúdo do ano anterior, mantido só para consulta interna.',
   'noticia', 'portal_noticias', 'programas', ARRAY['escolinhas'], NULL, NULL,
   'arquivado', false, timestamptz '2025-03-10 09:00-04', NULL, 'Assessoria de Comunicação', 980),
  ('d7000000-0000-4000-8000-000000000014', 'Nota: ponto facultativo no Dia do Servidor Público', 'nota-ponto-facultativo-dia-do-servidor',
   NULL, 'Expediente suspenso em 28 de outubro.', 'Conforme decreto estadual, o dia 28 de outubro é ponto facultativo nas repartições do instituto.',
   'comunicado', 'institucional', 'institucional', ARRAY['comunicado'], NULL, NULL,
   'publicado', false, timestamptz '2026-10-22 16:00-04', NULL, 'Assessoria de Comunicação', 96);
UPDATE public.cms_conteudos SET autor_id = current_setting('request.jwt.claim.sub')::uuid
 WHERE id::text LIKE 'd7000000-%' AND current_setting('request.jwt.claim.sub') <> '';

-- ===================================================================== CMS: banners, galerias, biblioteca de mídia
INSERT INTO public.cms_banners (id, titulo, subtitulo, imagem_url, imagem_mobile_url, link_url, link_texto, link_externo, destino, posicao, ativo, ordem, data_inicio, data_fim) VALUES
  ('d7010000-0000-4000-8000-000000000001', 'Jogos Escolares de Roraima 2026', 'De 3 a 28 de novembro, em Boa Vista', pg_temp.img('banner-jers', 1920, 600), pg_temp.img('banner-jers-m', 800, 800), '/noticias/jogos-escolares-de-roraima-2026-comecam-na-proxima-semana', 'Saiba mais', false, 'portal_home', 'hero', true, 1, timestamptz '2026-10-15 00:00-04', timestamptz '2026-11-30 23:59-04'),
  ('d7010000-0000-4000-8000-000000000002', 'Bolsa Atleta 2026', 'Confira a lista de contemplados', pg_temp.img('banner-bolsa', 1920, 600), NULL, '/noticias/bolsa-atleta-2026-lista-de-contemplados', 'Ver resultado', false, 'portal_home', 'hero', true, 2, timestamptz '2026-09-18 00:00-04', NULL),
  ('d7010000-0000-4000-8000-000000000003', 'Seletivas para os Jogos da Juventude', 'Inscrições até 7 de novembro', pg_temp.img('banner-seletivas', 1920, 600), NULL, '/seletivas', 'Inscreva-se', false, 'selecoes_estudantis', 'hero', true, 1, timestamptz '2026-10-01 00:00-04', timestamptz '2026-11-07 23:59-04'),
  ('d7010000-0000-4000-8000-000000000004', 'Ouvidoria e Acesso à Informação', 'Fale com o instituto', pg_temp.img('banner-ouvidoria', 600, 300), NULL, '/transparencia', 'Acessar', false, 'portal_home', 'sidebar', true, 3, NULL, NULL),
  ('d7010000-0000-4000-8000-000000000005', 'Corrida da Juventude 2026', 'Inscrições encerradas', pg_temp.img('banner-corrida', 1920, 600), NULL, NULL, NULL, false, 'portal_home', 'hero', false, 9, timestamptz '2026-07-01 00:00-04', timestamptz '2026-08-12 23:59-04');

INSERT INTO public.cms_galerias (id, titulo, slug, descricao, destino, categoria, status, imagem_capa_url, autor_nome, data_publicacao, visualizacoes, created_at) VALUES
  ('d7020000-0000-4000-8000-000000000001', 'Jogos Abertos de Roraima 2026 — Rorainópolis', 'jogos-abertos-de-roraima-2026-rorainopolis', 'Os quatro dias de competição em Rorainópolis, da abertura às finais.', 'portal_noticias', 'eventos', 'publicado', pg_temp.img('gal-abertos-capa'), 'Gustavo Pereira Lago', timestamptz '2026-10-15 10:00-04', 402, timestamptz '2026-10-15 09:00-04'),
  ('d7020000-0000-4000-8000-000000000002', 'Corrida da Juventude 2026', 'corrida-da-juventude-2026', 'Largada, percurso e premiação na orla Taumanan.', 'portal_noticias', 'eventos', 'publicado', pg_temp.img('gal-corrida-capa'), 'Gustavo Pereira Lago', timestamptz '2026-08-13 09:00-04', 655, timestamptz '2026-08-13 08:00-04'),
  ('d7020000-0000-4000-8000-000000000003', 'Reinauguração do Ginásio Central', 'reinauguracao-do-ginasio-central', 'A entrega da reforma do Ginásio Central.', 'portal_noticias', 'institucional', 'publicado', pg_temp.img('gal-ginasio-capa'), 'Gustavo Pereira Lago', timestamptz '2026-09-30 12:00-04', 188, timestamptz '2026-09-30 11:30-04'),
  ('d7020000-0000-4000-8000-000000000004', 'Escolinhas Esportivas — aulas de setembro', 'escolinhas-esportivas-aulas-de-setembro', 'Turmas de iniciação esportiva em Boa Vista.', 'portal_programas', 'programas', 'publicado', pg_temp.img('gal-escolinhas-capa'), 'Gustavo Pereira Lago', timestamptz '2026-09-25 15:00-04', 97, timestamptz '2026-09-25 14:00-04'),
  ('d7020000-0000-4000-8000-000000000005', 'Jogos Escolares 2026 — abertura', 'jogos-escolares-2026-abertura', 'Galeria em preparação para a cerimônia de abertura.', 'jogos_escolares', 'jogos-escolares', 'rascunho', NULL, 'Gustavo Pereira Lago', NULL, 0, timestamptz '2026-10-22 10:00-04');
UPDATE public.cms_galerias SET autor_id = current_setting('request.jwt.claim.sub')::uuid
 WHERE current_setting('request.jwt.claim.sub') <> '';

INSERT INTO public.cms_galeria_fotos (id, galeria_id, url, thumbnail_url, titulo, legenda, ordem)
SELECT ('d7030000-0000-4000-8000-' || lpad((g.n * 10 + f)::text, 12, '0'))::uuid,
       ('d7020000-0000-4000-8000-00000000000' || g.n)::uuid,
       pg_temp.img(g.semente || '-' || f), pg_temp.img(g.semente || '-' || f, 400, 300),
       g.titulo || ' — foto ' || f, (g.legendas)[f], f
FROM (VALUES
  (1, 'gal-abertos', 'Jogos Abertos', ARRAY['Desfile das delegações na abertura','Final do futsal masculino','Prova dos 100 m rasos','Vôlei de praia feminino','Premiação do judô','Delegação campeã geral de Boa Vista']),
  (2, 'gal-corrida', 'Corrida da Juventude', ARRAY['Largada da prova de 5 km','Atletas no percurso da orla','Caminhada de 3 km','Chegada do primeiro colocado','Pódio feminino','Pódio masculino']),
  (3, 'gal-ginasio', 'Ginásio Central', ARRAY['Fachada reformada','Novo piso esportivo','Arquibancada com rampas de acessibilidade','Vestiário reformado','Iluminação em LED','Descerramento da placa']),
  (4, 'gal-escolinhas', 'Escolinhas', ARRAY['Aula de iniciação ao vôlei','Turma de futsal sub-11','Aquecimento coletivo','Treino de handebol','Aula de ginástica rítmica','Encerramento do mês'])
) AS g(n, semente, titulo, legendas)
CROSS JOIN generate_series(1, 6) f;

INSERT INTO public.cms_media (id, url, filename, alt_text, tipo, tamanho_bytes, created_at) VALUES
  ('d7040000-0000-4000-8000-000000000001', pg_temp.img('jers-abertura'), 'jers-2026-abertura.jpg', 'Desfile de abertura dos Jogos Escolares', 'imagem', 482113, timestamptz '2026-10-16 10:00-04'),
  ('d7040000-0000-4000-8000-000000000002', pg_temp.img('jebs-medalhas'), 'jebs-2026-podio.jpg', 'Atletas de Roraima no pódio dos JEBs', 'imagem', 530442, timestamptz '2026-10-21 09:00-04'),
  ('d7040000-0000-4000-8000-000000000003', pg_temp.img('jogos-abertos-rr'), 'jogos-abertos-final-futsal.jpg', 'Final do futsal nos Jogos Abertos', 'imagem', 611208, timestamptz '2026-10-14 16:00-04'),
  ('d7040000-0000-4000-8000-000000000004', pg_temp.img('ginasio-reforma'), 'ginasio-central-reformado.jpg', 'Ginásio Central após a reforma', 'imagem', 398870, timestamptz '2026-09-30 10:00-04'),
  ('d7040000-0000-4000-8000-000000000005', pg_temp.img('bolsa-atleta-2026'), 'bolsa-atleta-2026.jpg', 'Atletas contemplados pelo Bolsa Atleta', 'imagem', 420001, timestamptz '2026-09-18 15:00-04'),
  ('d7040000-0000-4000-8000-000000000006', pg_temp.img('juventude-ativa-turmas'), 'juventude-ativa-turmas.jpg', 'Oficina do programa Juventude Ativa', 'imagem', 377512, timestamptz '2026-10-09 09:00-04'),
  ('d7040000-0000-4000-8000-000000000007', pg_temp.img('corrida-juventude'), 'corrida-juventude-largada.jpg', 'Largada da Corrida da Juventude', 'imagem', 455990, timestamptz '2026-08-12 20:00-04'),
  ('d7040000-0000-4000-8000-000000000008', pg_temp.img('esports-final'), 'roraima-conecta-final.jpg', 'Final do festival de eSports', 'imagem', 299004, timestamptz '2026-10-02 13:00-04');
UPDATE public.cms_media SET created_by = current_setting('request.jwt.claim.sub')::uuid
 WHERE current_setting('request.jwt.claim.sub') <> '';

-- ===================================================================== conteúdo institucional (rascunho e versões oficiais)
INSERT INTO public.historico_conteudo_oficial (id, tipo, identificador, titulo, conteudo, versao, promovido_por, promovido_em, justificativa) VALUES
  ('d7050000-0000-4000-8000-000000000001', 'missao', 'missao', 'Missão', 'Promover o esporte, o lazer e as políticas públicas de juventude em Roraima, garantindo acesso, inclusão e desenvolvimento humano.', 1, nullif(current_setting('request.jwt.claim.sub'), '')::uuid, timestamptz '2026-02-10 10:00-04', 'Aprovada no planejamento estratégico 2026–2029'),
  ('d7050000-0000-4000-8000-000000000002', 'visao', 'visao', 'Visão', 'Ser referência na Região Norte em gestão de políticas de esporte e juventude até 2029.', 1, nullif(current_setting('request.jwt.claim.sub'), '')::uuid, timestamptz '2026-02-10 10:00-04', 'Aprovada no planejamento estratégico 2026–2029'),
  ('d7050000-0000-4000-8000-000000000003', 'valores', 'valores', 'Valores', 'Ética, transparência, inclusão, respeito à diversidade e compromisso com o interesse público.', 1, nullif(current_setting('request.jwt.claim.sub'), '')::uuid, timestamptz '2026-02-10 10:00-04', 'Aprovada no planejamento estratégico 2026–2029');
INSERT INTO public.conteudo_rascunho (id, tipo, identificador, titulo, conteudo, status, criado_por, atualizado_por, motivo_rejeicao) VALUES
  ('d7060000-0000-4000-8000-000000000001', 'visao', 'visao', 'Visão', 'Ser referência nacional em gestão de políticas de esporte e juventude até 2030.', 'em_revisao', nullif(current_setting('request.jwt.claim.sub'), '')::uuid, nullif(current_setting('request.jwt.claim.sub'), '')::uuid, NULL),
  ('d7060000-0000-4000-8000-000000000002', 'slogan', 'slogan', 'Slogan', 'Roraima em movimento: esporte e juventude para todos.', 'rascunho', nullif(current_setting('request.jwt.claim.sub'), '')::uuid, NULL, NULL),
  ('d7060000-0000-4000-8000-000000000003', 'descricao_programa', 'juventude-ativa', 'Juventude Ativa', 'Programa de ocupação do contraturno com esporte, cultura e cidadania.', 'aprovado', nullif(current_setting('request.jwt.claim.sub'), '')::uuid, NULL, NULL);

-- ===================================================================== ASCOM: demandas (vários status) e o que pendura nelas
INSERT INTO public.demandas_ascom (id, numero_demanda, ano, unidade_solicitante_id, servidor_solicitante_id, nome_responsavel, cargo_funcao, contato_telefone, contato_email,
  categoria, tipo, titulo, descricao_detalhada, objetivo_institucional, publico_alvo, data_evento, hora_evento, local_evento, prazo_entrega, status, prioridade,
  responsavel_ascom_id, data_inicio_execucao, data_conclusao, observacoes_internas_ascom, aprovado_por_id, data_aprovacao,
  autorizado_presidencia_por_id, data_autorizacao_presidencia, justificativa_indeferimento, created_at, historico_status) VALUES
  ('d7070000-0000-4000-8000-000000000001', '0003/2026-ASCOM', 2026, 'a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000013', 'Thiago Barreto Cunha', 'Professor de Educação Física', '(95) 90000-0013', 'servidor13@exemplo.test',
   'cobertura_institucional', 'cobertura_audiovisual', 'Vídeo de encerramento dos Jogos Abertos', 'Vídeo de 2 minutos com os melhores momentos dos Jogos Abertos em Rorainópolis, para redes sociais e telão.', 'Prestar contas do evento à população', 'Público geral',
   DATE '2026-10-11', '08:00', 'Rorainópolis', DATE '2026-10-18', 'concluida', 'alta',
   'c0000000-0000-4000-8000-000000000015', timestamptz '2026-10-11 08:00-04', timestamptz '2026-10-17 17:30-04', 'Material bruto no drive da ASCOM.', 'c0000000-0000-4000-8000-000000000015', timestamptz '2026-10-02 10:00-04',
   NULL, NULL, NULL, timestamptz '2026-10-01 09:12-04',
   '[{"status_anterior":"enviada","status_novo":"aprovada","data":"2026-10-02T10:00:00-04:00"},{"status_anterior":"aprovada","status_novo":"em_execucao","data":"2026-10-11T08:00:00-04:00"},{"status_anterior":"em_execucao","status_novo":"concluida","data":"2026-10-17T17:30:00-04:00"}]'),
  ('d7070000-0000-4000-8000-000000000002', '0004/2026-ASCOM', 2026, 'a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000004', 'Patrícia Nogueira Sales', 'Diretora de Esporte', '(95) 90000-0004', 'servidor4@exemplo.test',
   'conteudo_institucional', 'conteudo_noticia_site', 'Matéria sobre as medalhas nos Jogos Escolares Brasileiros', 'Notícia para o portal com o resultado da delegação nos JEBs, com fotos enviadas pela comissão técnica.', 'Valorizar os atletas estudantis', 'Comunidade escolar',
   NULL, NULL, NULL, DATE '2026-10-21', 'concluida', 'normal',
   'c0000000-0000-4000-8000-000000000015', timestamptz '2026-10-20 09:00-04', timestamptz '2026-10-21 09:30-04', NULL, 'c0000000-0000-4000-8000-000000000015', timestamptz '2026-10-20 08:30-04',
   NULL, NULL, NULL, timestamptz '2026-10-19 18:00-04', '[]'),
  ('d7070000-0000-4000-8000-000000000003', '0005/2026-ASCOM', 2026, 'a0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000016', 'Renata Duarte Fontes', 'Assessora Técnica', '(95) 90000-0016', 'servidor16@exemplo.test',
   'gestao_redes_sociais', 'redes_campanha', 'Campanha Outubro Jovem nas redes sociais', 'Série de 8 posts e 4 reels sobre empregabilidade, saúde mental e esporte para jovens, durante o mês de outubro.', 'Engajar jovens nas ações do instituto', 'Jovens de 15 a 29 anos',
   NULL, NULL, NULL, DATE '2026-10-31', 'em_execucao', 'normal',
   'c0000000-0000-4000-8000-000000000015', timestamptz '2026-10-05 09:00-04', NULL, 'Posts 1 a 5 publicados; faltam os reels.', 'c0000000-0000-4000-8000-000000000015', timestamptz '2026-10-03 11:00-04',
   'c0000000-0000-4000-8000-000000000002', timestamptz '2026-10-04 15:00-04', NULL, timestamptz '2026-10-01 14:20-04', '[]'),
  ('d7070000-0000-4000-8000-000000000004', '0006/2026-ASCOM', 2026, 'a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000002', 'Helena Prado Moura', 'Presidente', '(95) 90000-0002', 'servidor2@exemplo.test',
   'imprensa_relacoes', 'conteudo_nota_oficial', 'Nota oficial sobre a interdição temporária do Estádio', 'Nota à imprensa explicando a interdição do estádio para vistoria do Corpo de Bombeiros e o remanejamento dos jogos.', 'Esclarecer a população', 'Imprensa e torcedores',
   NULL, NULL, NULL, DATE '2026-10-24', 'aguardando_autorizacao', 'urgente',
   'c0000000-0000-4000-8000-000000000015', NULL, NULL, 'Minuta pronta, aguardando aval da Presidência.', NULL, NULL,
   NULL, NULL, NULL, timestamptz '2026-10-22 17:45-04', '[]'),
  ('d7070000-0000-4000-8000-000000000005', '0007/2026-ASCOM', 2026, 'a0000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-000000000006', 'Fernanda Albuquerque Lins', 'Chefe da Divisão de Recursos Humanos', '(95) 90000-0006', 'servidor6@exemplo.test',
   'criacao_artes', 'arte_certificado', 'Certificados do curso de atendimento ao público', 'Modelo de certificado para 45 servidores concluintes do curso de atendimento ao público.', 'Capacitação de servidores', 'Servidores',
   NULL, NULL, NULL, DATE '2026-11-05', 'em_analise', 'baixa',
   'c0000000-0000-4000-8000-000000000015', NULL, NULL, NULL, NULL, NULL,
   NULL, NULL, NULL, timestamptz '2026-10-21 10:05-04', '[]'),
  ('d7070000-0000-4000-8000-000000000006', '0008/2026-ASCOM', 2026, 'a0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000003', 'Ricardo Lemos Bastos', 'Diretor Administrativo e Financeiro', '(95) 90000-0003', 'servidor3@exemplo.test',
   'criacao_artes', 'arte_banner', 'Banner para a sala de licitações', 'Banner em lona 2x1 m com as regras de acesso à sala de licitações.', NULL, 'Fornecedores',
   NULL, NULL, NULL, DATE '2026-09-15', 'indeferida', 'baixa',
   NULL, NULL, NULL, NULL, NULL, NULL,
   NULL, NULL, 'Peça de sinalização interna: encaminhar à Divisão de Patrimônio, que tem contrato de comunicação visual.', timestamptz '2026-09-02 11:00-04', '[]'),
  ('d7070000-0000-4000-8000-000000000007', '0009/2026-ASCOM', 2026, 'a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000014', 'Aline Castro Vieira', 'Professora de Educação Física', '(95) 90000-0014', 'servidor14@exemplo.test',
   'cobertura_institucional', 'cobertura_redes_sociais', 'Cobertura do festival de ginástica rítmica', 'Stories e fotos do festival de ginástica rítmica das escolinhas.', NULL, 'Famílias dos alunos',
   DATE '2026-09-20', '15:00', 'Ginásio Central', DATE '2026-09-20', 'cancelada', 'normal',
   NULL, NULL, NULL, 'Festival adiado pela organização; nova data a definir.', NULL, NULL,
   NULL, NULL, NULL, timestamptz '2026-09-08 09:30-04', '[]'),
  ('d7070000-0000-4000-8000-000000000008', '0010/2026-ASCOM', 2026, 'a0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000005', 'Bruno Cavalcante Reis', 'Diretor de Juventude', '(95) 90000-0005', 'servidor5@exemplo.test',
   'imprensa_relacoes', 'imprensa_agendamento_entrevista', 'Entrevista na rádio sobre a Conferência Estadual de Juventude', 'Agendar entrevista ao vivo em rádio local para divulgar a Conferência Estadual de Juventude.', 'Mobilizar participantes', 'Jovens e conselhos municipais',
   DATE '2026-11-12', '07:30', 'Estúdio da rádio', DATE '2026-11-10', 'rascunho', 'normal',
   NULL, NULL, NULL, NULL, NULL, NULL,
   NULL, NULL, NULL, timestamptz '2026-10-23 08:40-04', '[]'),
  ('d7070000-0000-4000-8000-000000000009', '0011/2026-ASCOM', 2026, 'a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000004', 'Patrícia Nogueira Sales', 'Diretora de Esporte', '(95) 90000-0004', 'servidor4@exemplo.test',
   'cobertura_institucional', 'cobertura_transmissao_ao_vivo', 'Transmissão ao vivo das finais dos Jogos Escolares', 'Transmissão pelo canal do instituto das finais de futsal, vôlei e basquete.', 'Ampliar o alcance da competição', 'Público geral',
   DATE '2026-11-27', '14:00', 'Ginásio Central', DATE '2026-11-27', 'enviada', 'alta',
   NULL, NULL, NULL, NULL, NULL, NULL,
   NULL, NULL, NULL, timestamptz '2026-10-22 15:10-04', '[]');
UPDATE public.demandas_ascom SET created_by = current_setting('request.jwt.claim.sub')::uuid
 WHERE id::text LIKE 'd7070000-%' AND current_setting('request.jwt.claim.sub') <> '';

INSERT INTO public.demandas_ascom_comentarios (id, demanda_id, tipo, conteudo, visivel_solicitante, created_at, created_by)
SELECT c.id::uuid, c.dem::uuid, c.tipo, c.txt, c.vis, c.em::timestamptz, nullif(current_setting('request.jwt.claim.sub'), '')::uuid
FROM (VALUES
  ('d7080000-0000-4000-8000-000000000001', 'd7070000-0000-4000-8000-000000000001', 'status', 'Demanda aprovada e incluída na escala de cobertura.', true, '2026-10-02 10:00-04'),
  ('d7080000-0000-4000-8000-000000000002', 'd7070000-0000-4000-8000-000000000001', 'comentario', 'Equipe segue para Rorainópolis no dia 10, à noite.', true, '2026-10-08 16:20-04'),
  ('d7080000-0000-4000-8000-000000000003', 'd7070000-0000-4000-8000-000000000001', 'interno', 'Reservar o drone com a DPC.', false, '2026-10-08 16:25-04'),
  ('d7080000-0000-4000-8000-000000000004', 'd7070000-0000-4000-8000-000000000001', 'status', 'Vídeo entregue e publicado nas redes.', true, '2026-10-17 17:30-04'),
  ('d7080000-0000-4000-8000-000000000005', 'd7070000-0000-4000-8000-000000000003', 'comentario', 'Cronograma de posts enviado para validação.', true, '2026-10-05 09:30-04'),
  ('d7080000-0000-4000-8000-000000000006', 'd7070000-0000-4000-8000-000000000003', 'interno', 'Reel 2 depende da gravação com a psicóloga convidada.', false, '2026-10-15 11:00-04'),
  ('d7080000-0000-4000-8000-000000000007', 'd7070000-0000-4000-8000-000000000004', 'interno', 'Minuta revisada pela Assessoria Jurídica.', false, '2026-10-23 08:15-04'),
  ('d7080000-0000-4000-8000-000000000008', 'd7070000-0000-4000-8000-000000000006', 'status', 'Indeferida: peça de sinalização interna fica com a Divisão de Patrimônio.', true, '2026-09-03 09:00-04'),
  ('d7080000-0000-4000-8000-000000000009', 'd7070000-0000-4000-8000-000000000005', 'comentario', 'Favor enviar a lista de concluintes em planilha.', true, '2026-10-22 10:00-04')
) AS c(id, dem, tipo, txt, vis, em);

INSERT INTO public.demandas_ascom_anexos (id, demanda_id, tipo_anexo, nome_arquivo, descricao, url_arquivo, tipo_mime, tamanho_bytes, created_at, created_by)
SELECT a.id::uuid, a.dem::uuid, a.tipo, a.nome, a.descr, pg_temp.img(a.semente), 'image/jpeg', a.tam, a.em::timestamptz, nullif(current_setting('request.jwt.claim.sub'), '')::uuid
FROM (VALUES
  ('d7090000-0000-4000-8000-000000000001', 'd7070000-0000-4000-8000-000000000001', 'solicitacao', 'roteiro-abertura-jogos-abertos.jpg', 'Roteiro da cerimônia', 'anexo-roteiro', 210334, '2026-10-01 09:12-04'),
  ('d7090000-0000-4000-8000-000000000002', 'd7070000-0000-4000-8000-000000000002', 'solicitacao', 'fotos-comissao-tecnica-jebs.jpg', 'Fotos enviadas pela comissão técnica', 'jebs-medalhas', 530442, '2026-10-19 18:00-04'),
  ('d7090000-0000-4000-8000-000000000003', 'd7070000-0000-4000-8000-000000000003', 'solicitacao', 'identidade-outubro-jovem.jpg', 'Referência visual da campanha', 'anexo-outubro-jovem', 188004, '2026-10-01 14:20-04'),
  ('d7090000-0000-4000-8000-000000000004', 'd7070000-0000-4000-8000-000000000004', 'interno', 'minuta-nota-oficial.jpg', 'Minuta da nota (imagem)', 'anexo-minuta', 95330, '2026-10-22 18:00-04'),
  ('d7090000-0000-4000-8000-000000000005', 'd7070000-0000-4000-8000-000000000001', 'solicitacao', 'mapa-locais-provas.jpg', 'Mapa dos locais de prova em Rorainópolis', 'anexo-mapa', 302118, '2026-10-01 09:13-04')
) AS a(id, dem, tipo, nome, descr, semente, tam, em);

INSERT INTO public.demandas_ascom_entregaveis (id, demanda_id, tipo_entregavel, descricao, url_arquivo, link_publicacao, link_drive, data_entrega, relatorio_cobertura, metricas, created_at, created_by)
SELECT e.id::uuid, e.dem::uuid, e.tipo, e.descr, pg_temp.img(e.semente), e.link_pub, NULL, e.em::timestamptz, e.rel, e.met::jsonb, e.em::timestamptz, nullif(current_setting('request.jwt.claim.sub'), '')::uuid
FROM (VALUES
  ('d70a0000-0000-4000-8000-000000000001', 'd7070000-0000-4000-8000-000000000001', 'Vídeo', 'Vídeo de 2 min com os melhores momentos', 'jogos-abertos-rr', NULL, '2026-10-17 17:30-04', 'Cobertura dos 4 dias, com 1.100 fotos brutas e 6 horas de vídeo.', '{"alcance": 48210, "visualizacoes": 21950, "curtidas": 3120, "compartilhamentos": 410}'),
  ('d70a0000-0000-4000-8000-000000000002', 'd7070000-0000-4000-8000-000000000001', 'Fotos', 'Seleção de 60 fotos tratadas', 'gal-abertos-capa', '/galerias/jogos-abertos-de-roraima-2026-rorainopolis', '2026-10-15 10:00-04', NULL, '{"fotos": 60}'),
  ('d70a0000-0000-4000-8000-000000000003', 'd7070000-0000-4000-8000-000000000002', 'Matéria', 'Notícia publicada no portal', 'jebs-medalhas', '/noticias/roraima-conquista-14-medalhas-jogos-escolares-brasileiros', '2026-10-21 09:30-04', NULL, '{"visualizacoes": 842}'),
  ('d70a0000-0000-4000-8000-000000000004', 'd7070000-0000-4000-8000-000000000003', 'Post', 'Posts 1 a 5 da campanha Outubro Jovem', 'outubro-jovem-posts', NULL, '2026-10-16 18:00-04', NULL, '{"alcance": 15300, "curtidas": 1870}')
) AS e(id, dem, tipo, descr, semente, link_pub, em, rel, met);

-- ===================================================================== eventos esportivos (seletivas): contatos, galeria, notícias
INSERT INTO public.contatos_eventos_esportivos (id, tipo, titulo, subtitulo, valor, icone, evento, ordem, ativo) VALUES
  ('d70b0000-0000-4000-8000-000000000001', 'coordenador', 'Coordenação das Seletivas', 'Diretoria de Esporte', 'seletivas@exemplo.test', 'mail', 'seletivas_2026', 1, true),
  ('d70b0000-0000-4000-8000-000000000002', 'telefone', 'Atendimento às escolas', 'Segunda a sexta, 8h às 14h', '(95) 98140-2026', 'phone', 'seletivas_2026', 2, true),
  ('d70b0000-0000-4000-8000-000000000003', 'telefone', 'WhatsApp das Seletivas', 'Dúvidas sobre inscrição', '(95) 98140-2027', 'phone', 'seletivas_2026', 3, true),
  ('d70b0000-0000-4000-8000-000000000004', 'site_oficial', 'Governo de Roraima', 'Portal oficial', 'https://www.rr.gov.br', 'globe', 'seletivas_2026', 4, true);

INSERT INTO public.galeria_eventos_esportivos (id, titulo, descricao, foto_url, foto_thumbnail_url, modalidade, naipe, evento, data_evento, fotografo, ordem, destaque, status, created_by)
SELECT ('d70c0000-0000-4000-8000-00000000000' || g.n)::uuid, g.titulo, g.descr, pg_temp.img(g.semente), pg_temp.img(g.semente, 400, 300), g.modal, g.naipe, 'seletivas_2026',
       g.dt::date, 'Gustavo Pereira Lago', g.n, g.dest, g.st, nullif(current_setting('request.jwt.claim.sub'), '')::uuid
FROM (VALUES
  (1, 'Seletiva de natação', 'Bateria dos 100 m livre', 'sel-natacao-1', 'Natação', 'masculino', '2026-10-04', true, 'publicado'),
  (2, 'Seletiva de natação', 'Bateria dos 50 m costas', 'sel-natacao-2', 'Natação', 'feminino', '2026-10-04', false, 'publicado'),
  (3, 'Seletiva de vôlei', 'Avaliação técnica no Ginásio Central', 'sel-volei-1', 'Vôlei', 'feminino', '2026-10-11', true, 'publicado'),
  (4, 'Seletiva de basquete', 'Treino coletivo dos convocados', 'sel-basquete-1', 'Basquete', 'masculino', '2026-10-18', false, 'publicado'),
  (5, 'Seletiva de judô', 'Combates de avaliação', 'sel-judo-1', 'Judô', 'misto', '2026-10-18', false, 'rascunho')
) AS g(n, titulo, descr, semente, modal, naipe, dt, dest, st);

INSERT INTO public.noticias_eventos_esportivos (id, titulo, slug, subtitulo, conteudo, resumo, imagem_destaque_url, imagem_destaque_alt, categoria, tags, evento_relacionado,
  autor_id, autor_nome, status, destaque, data_publicacao, visualizacoes) VALUES
  ('d70d0000-0000-4000-8000-000000000001', 'Seletivas definem atletas de natação e vôlei', 'seletivas-definem-atletas-natacao-volei', NULL,
   'As seletivas de natação e vôlei definiram os primeiros convocados da delegação de Roraima para os Jogos da Juventude. A lista completa está na página de resultados.',
   'Primeiros convocados da delegação já foram definidos.', pg_temp.img('sel-volei-1'), 'Atletas na seletiva de vôlei', 'jogos-juventude', ARRAY['seletivas','vôlei','natação'], 'seletivas_2026',
   nullif(current_setting('request.jwt.claim.sub'), '')::uuid, 'Assessoria de Comunicação', 'publicado', true, timestamptz '2026-10-12 10:00-04', 233),
  ('d70d0000-0000-4000-8000-000000000002', 'Cronograma das seletivas de novembro', 'cronograma-seletivas-novembro', NULL,
   'Basquete, judô e atletismo realizam as últimas seletivas em novembro. Os atletas devem chegar com 30 minutos de antecedência, com documento de identidade e declaração escolar.',
   'Últimas modalidades fazem avaliações em novembro.', pg_temp.img('sel-cronograma'), 'Calendário das seletivas', 'jogos-juventude', ARRAY['seletivas','cronograma'], 'seletivas_2026',
   nullif(current_setting('request.jwt.claim.sub'), '')::uuid, 'Assessoria de Comunicação', 'publicado', false, timestamptz '2026-10-19 09:00-04', 118),
  ('d70d0000-0000-4000-8000-000000000003', 'Delegação de Roraima para os Jogos da Juventude', 'delegacao-roraima-jogos-juventude', NULL,
   'Texto em produção com a lista final de convocados.', NULL, NULL, NULL, 'jogos-juventude', ARRAY['delegação'], 'seletivas_2026',
   nullif(current_setting('request.jwt.claim.sub'), '')::uuid, 'Assessoria de Comunicação', 'rascunho', false, NULL, 0);

-- ===================================================================== portal: diretoria, links úteis
INSERT INTO public.portal_diretoria (id, nome, cargo, unidade, foto_url, email, telefone, bio, decreto_nomeacao, data_posse, ordem_exibicao, ativo) VALUES
  ('d70e0000-0000-4000-8000-000000000001', 'Helena Prado Moura', 'Presidente', 'Presidência', pg_temp.img('dir-presidente', 400, 400), 'presidencia@exemplo.test', '(95) 3621-0001', 'Gestora pública com 20 anos de atuação em políticas de esporte e educação no estado.', 'Decreto nº 12-P, de 2 de janeiro de 2023', DATE '2023-01-02', 1, true),
  ('d70e0000-0000-4000-8000-000000000002', 'Ricardo Lemos Bastos', 'Diretor Administrativo e Financeiro', 'Diretoria Administrativa e Financeira', pg_temp.img('dir-diraf', 400, 400), 'diraf@exemplo.test', '(95) 3621-0002', 'Contador, especialista em gestão pública e orçamento.', 'Decreto nº 31-P, de 1º de fevereiro de 2023', DATE '2023-02-01', 2, true),
  ('d70e0000-0000-4000-8000-000000000003', 'Patrícia Nogueira Sales', 'Diretora de Esporte', 'Diretoria de Esporte', pg_temp.img('dir-diesp', 400, 400), 'diesp@exemplo.test', '(95) 3621-0003', 'Professora de educação física e ex-atleta de handebol.', 'Decreto nº 32-P, de 1º de fevereiro de 2023', DATE '2023-02-01', 3, true),
  ('d70e0000-0000-4000-8000-000000000004', 'Bruno Cavalcante Reis', 'Diretor de Juventude', 'Diretoria de Juventude', pg_temp.img('dir-dijuv', 400, 400), 'dijuv@exemplo.test', '(95) 3621-0004', 'Assistente social, com atuação em conselhos de juventude.', 'Decreto nº 58-P, de 1º de março de 2024', DATE '2024-03-01', 4, true),
  ('d70e0000-0000-4000-8000-000000000005', 'Gustavo Pereira Lago', 'Assessor de Comunicação', 'Assessoria de Comunicação', NULL, 'ascom@exemplo.test', '(95) 3621-0008', 'Jornalista.', NULL, DATE '2024-06-03', 5, true);

INSERT INTO public.links_uteis (id, titulo, url, descricao, ordem, ativo, alterado_por) VALUES
  ('d70f0000-0000-4000-8000-000000000001', 'Governo de Roraima', 'https://www.rr.gov.br', 'Portal oficial do Governo do Estado', 1, true, nullif(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d70f0000-0000-4000-8000-000000000002', 'Ministério do Esporte', 'https://www.gov.br/esporte', 'Programas e editais federais de esporte', 2, true, nullif(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d70f0000-0000-4000-8000-000000000003', 'Confederação Brasileira do Desporto Escolar', 'https://www.cbde.org.br', 'Jogos Escolares Brasileiros', 3, true, nullif(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d70f0000-0000-4000-8000-000000000004', 'Comitê Olímpico do Brasil', 'https://www.cob.org.br', 'Jogos da Juventude', 4, true, nullif(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d70f0000-0000-4000-8000-000000000005', 'Acesso à Informação', 'https://www.gov.br/acessoainformacao', 'Lei de Acesso à Informação', 5, true, nullif(current_setting('request.jwt.claim.sub'), '')::uuid),
  ('d70f0000-0000-4000-8000-000000000006', 'Secretaria Nacional da Juventude', 'https://www.gov.br/juventude', 'Link antigo, desativado', 9, false, nullif(current_setting('request.jwt.claim.sub'), '')::uuid);

-- ===================================================================== avisos internos e datas importantes (autoria = auth.uid() pelo trigger)
INSERT INTO public.avisos (id, titulo, conteudo, prioridade, destaque, publico, modulos_alvo, inicio_em, expira_em, link, ativo) VALUES
  ('d7100000-0000-4000-8000-000000000001', 'Ponto facultativo no Dia do Servidor', 'Em 28 de outubro não haverá expediente. Os serviços essenciais dos ginásios funcionam em escala.', 'alta', true, 'todos', '{}', timestamptz '2026-10-20 08:00-04', now() + interval '60 days', NULL, true),
  ('d7100000-0000-4000-8000-000000000002', 'Prazo da frequência de outubro', 'As chefias devem fechar a frequência de outubro até o dia 3 de novembro.', 'urgente', false, 'modulos', '{rh}', timestamptz '2026-10-21 08:00-04', now() + interval '45 days', '/rh/frequencia', true),
  ('d7100000-0000-4000-8000-000000000003', 'Credenciamento de imprensa para os Jogos Escolares', 'O credenciamento de imprensa está aberto até 31/10. Encaminhe pedidos de cobertura pela ASCOM.', 'normal', false, 'modulos', '{comunicacao,programas}', timestamptz '2026-10-15 08:00-04', now() + interval '40 days', '/ascom/demandas', true),
  ('d7100000-0000-4000-8000-000000000004', 'Atualização do sistema', 'Nova versão com relatórios de federações e lista de presença de reuniões.', 'baixa', false, 'todos', '{}', timestamptz '2026-10-10 08:00-04', NULL, NULL, true),
  ('d7100000-0000-4000-8000-000000000005', 'Inventário anual de bens', 'O inventário anual começa em 3 de novembro. Mantenha os bens identificados.', 'normal', false, 'modulos', '{patrimonio}', timestamptz '2026-10-18 08:00-04', now() + interval '50 days', NULL, true),
  ('d7100000-0000-4000-8000-000000000006', 'Manutenção da rede elétrica', 'Aviso encerrado: manutenção concluída em setembro.', 'normal', false, 'todos', '{}', timestamptz '2026-09-01 08:00-04', timestamptz '2026-09-15 18:00-04', NULL, false);

INSERT INTO public.avisos_leituras (aviso_id, user_id, lido_em)
SELECT a.id, p.id, timestamptz '2026-10-21 09:00-04'
FROM public.avisos a CROSS JOIN public.profiles p
WHERE p.servidor_id = 'c0000000-0000-4000-8000-000000000001'
  AND a.id IN ('d7100000-0000-4000-8000-000000000004', 'd7100000-0000-4000-8000-000000000006');

INSERT INTO public.datas_importantes (id, titulo, descricao, data, data_fim, tipo, recorrente_anual, modulos_alvo, ativo) VALUES
  ('d7110000-0000-4000-8000-000000000001', 'Jogos Escolares de Roraima', 'Fase estadual em Boa Vista', DATE '2026-11-03', DATE '2026-11-28', 'evento', false, '{programas,comunicacao}', true),
  ('d7110000-0000-4000-8000-000000000002', 'Fechamento da folha de novembro', 'Último dia para lançamentos na folha', DATE '2026-11-20', NULL, 'prazo', false, '{rh}', true),
  ('d7110000-0000-4000-8000-000000000003', 'Dia do Servidor Público', NULL, DATE '2026-10-28', NULL, 'comemorativa', true, '{}', true),
  ('d7110000-0000-4000-8000-000000000004', 'Dia Nacional da Juventude', NULL, DATE '2026-08-12', NULL, 'comemorativa', true, '{}', true),
  ('d7110000-0000-4000-8000-000000000005', 'Reunião ordinária da Diretoria', 'Balanço do 4º trimestre', DATE '2026-12-10', NULL, 'reuniao', false, '{gabinete}', true),
  ('d7110000-0000-4000-8000-000000000006', 'Conferência Estadual de Juventude', 'Auditório do instituto', DATE '2026-11-13', DATE '2026-11-14', 'evento', false, '{programas}', true),
  ('d7110000-0000-4000-8000-000000000007', 'Prestação de contas dos convênios', 'Prazo para enviar a prestação de contas ao TCE', DATE '2026-12-15', NULL, 'prazo', false, '{financeiro,contratos}', true);

-- ===================================================================== programas
INSERT INTO public.programas (id, codigo, nome, descricao, objetivo, publico_alvo, ano_inicio, ano_fim, situacao, unidade_responsavel_id, servidor_responsavel_id, meta_fisica_total, unidade_medida) VALUES
  ('d7120000-0000-4000-8000-000000000001', 'PRG-03', 'Bolsa Atleta Roraima', 'Auxílio financeiro mensal a atletas e paratletas de alto rendimento.', 'Manter atletas em treinamento e competição', 'Atletas e paratletas federados', 2019, NULL, 'ativo', 'a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000004', 90, 'atletas'),
  ('d7120000-0000-4000-8000-000000000002', 'PRG-04', 'Jogos Escolares de Roraima', 'Competição escolar estadual, com etapas regionais e fase estadual.', 'Revelar talentos e formar a delegação dos JEBs', 'Estudantes de 12 a 17 anos', 2015, NULL, 'ativo', 'a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000013', 3200, 'estudantes-atletas'),
  ('d7120000-0000-4000-8000-000000000003', 'PRG-05', 'Esporte na Comunidade', 'Núcleos de esporte e lazer em praças e quadras dos bairros e municípios.', 'Promover atividade física e convivência comunitária', 'Toda a população', 2022, NULL, 'ativo', 'a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000014', 2500, 'participantes'),
  ('d7120000-0000-4000-8000-000000000004', 'PRG-06', 'Jovem Empreendedor', 'Formação em empreendedorismo e acesso a microcrédito para jovens.', 'Gerar renda e autonomia para jovens', 'Jovens de 18 a 29 anos', 2027, NULL, 'planejamento', 'a0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000016', 400, 'jovens'),
  ('d7120000-0000-4000-8000-000000000005', 'PRG-07', 'Juventude Cidadã', 'Oficinas de cidadania, voluntariado e participação social.', 'Fortalecer a participação dos jovens nos conselhos', 'Jovens de 15 a 29 anos', 2023, NULL, 'suspenso', 'a0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000005', 600, 'jovens'),
  ('d7120000-0000-4000-8000-000000000006', 'PRG-08', 'Férias Ativas', 'Colônia de férias esportiva nos ginásios do estado.', 'Ocupar o período de férias com esporte e lazer', 'Crianças de 6 a 14 anos', 2024, 2025, 'encerrado', 'a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000013', 900, 'crianças');

-- ===================================================================== federações esportivas e o que pendura nelas
INSERT INTO public.federacoes_esportivas (id, nome, sigla, cnpj, data_criacao, endereco, endereco_logradouro, endereco_numero, endereco_bairro, telefone, email, instagram, site,
  mandato_inicio, mandato_fim, presidente_nome, presidente_nascimento, presidente_telefone, presidente_email, vice_presidente_nome, vice_presidente_telefone,
  diretor_tecnico_nome, diretor_tecnico_telefone, status, observacoes_internas, data_analise) VALUES
  ('d7130000-0000-4000-8000-000000000001', 'Federação Roraimense de Atletismo', 'FRA', pg_temp.cnpj('041188230001'), DATE '1992-06-15', 'Rua Araújo Filho, 980, Centro, Boa Vista/RR', 'Rua Araújo Filho', '980', 'Centro', '(95) 3224-1180', 'contato@fra.exemplo.test', '@atletismorr', 'https://fra.exemplo.test',
   DATE '2025-01-01', DATE '2028-12-31', 'Sebastião Alves Peixoto', DATE '1965-11-03', '(95) 98111-2031', 'presidencia@fra.exemplo.test', 'Kátia Regina Moraes', '(95) 98111-2032',
   'Anderson Luís Pinheiro', '(95) 98111-2033', 'ativo', 'Documentação completa; certidões válidas até 03/2027.', timestamptz '2025-02-10 10:00-04'),
  ('d7130000-0000-4000-8000-000000000002', 'Federação Roraimense de Judô', 'FRJ', pg_temp.cnpj('052249870001'), DATE '1988-03-21', 'Av. Capitão Ene Garcez, 2300, São Francisco, Boa Vista/RR', 'Av. Capitão Ene Garcez', '2300', 'São Francisco', '(95) 3224-2250', 'contato@frj.exemplo.test', '@judororaima', NULL,
   DATE '2024-01-01', DATE '2027-12-31', 'Hiroshi Tavares Nakamura', DATE '1970-08-29', '(95) 98111-3041', 'presidencia@frj.exemplo.test', 'Denise Araújo Falcão', '(95) 98111-3042',
   'Marcelo Viana Brito', '(95) 98111-3043', 'ativo', NULL, timestamptz '2024-02-05 10:00-04'),
  ('d7130000-0000-4000-8000-000000000003', 'Federação Roraimense de Handebol', 'FRHB', pg_temp.cnpj('063371190001'), DATE '1996-10-02', 'Rua Inácio Magalhães, 145, Mecejana, Boa Vista/RR', 'Rua Inácio Magalhães', '145', 'Mecejana', '(95) 3224-3310', 'contato@frhb.exemplo.test', '@handebolrr', NULL,
   DATE '2025-03-01', DATE '2029-02-28', 'Valéria Cristina Bentes', DATE '1978-01-12', '(95) 98111-4051', 'presidencia@frhb.exemplo.test', 'Paulo Henrique Sarmento', '(95) 98111-4052',
   NULL, NULL, 'ativo', NULL, timestamptz '2025-03-20 10:00-04'),
  ('d7130000-0000-4000-8000-000000000004', 'Federação Roraimense de Basketball', 'FRB', pg_temp.cnpj('074482350001'), DATE '1990-05-30', 'Rua Professor Diomedes, 77, Caçari, Boa Vista/RR', 'Rua Professor Diomedes', '77', 'Caçari', '(95) 3224-4470', 'contato@frb.exemplo.test', NULL, NULL,
   DATE '2021-01-01', DATE '2024-12-31', 'Jorge Augusto Lobato', DATE '1962-07-07', '(95) 98111-5061', 'presidencia@frb.exemplo.test', 'Simone Batista Correia', '(95) 98111-5062',
   NULL, NULL, 'inativo', 'Mandato vencido em 12/2024 sem ata de eleição registrada.', timestamptz '2025-01-15 10:00-04'),
  ('d7130000-0000-4000-8000-000000000005', 'Federação Roraimense de Desportos Aquáticos', 'FRDA', pg_temp.cnpj('085513620001'), DATE '2003-02-14', 'Av. das Guianas, 3100, Aparecida, Boa Vista/RR', 'Av. das Guianas', '3100', 'Aparecida', '(95) 3224-5530', 'contato@frda.exemplo.test', '@aquaticosrr', NULL,
   DATE '2026-01-01', DATE '2029-12-31', 'Cristiane Oliveira Damasceno', DATE '1981-04-25', '(95) 98111-6071', 'presidencia@frda.exemplo.test', 'Ronaldo Matias Queiroz', '(95) 98111-6072',
   NULL, NULL, 'em_analise', NULL, NULL),
  ('d7130000-0000-4000-8000-000000000006', 'Federação Roraimense de Tênis de Mesa', 'FRTM', pg_temp.cnpj('096624780001'), DATE '2010-09-09', 'Rua João Pereira de Melo, 52, Centro, Boa Vista/RR', 'Rua João Pereira de Melo', '52', 'Centro', '(95) 3224-6640', 'contato@frtm.exemplo.test', NULL, NULL,
   DATE '2025-06-01', DATE '2029-05-31', 'Eduardo Kenji Watanabe', DATE '1975-12-18', '(95) 98111-7081', 'presidencia@frtm.exemplo.test', 'Lúcia Helena Prado', '(95) 98111-7082',
   NULL, NULL, 'rejeitado', 'Estatuto sem registro em cartório; reenviar após a regularização.', timestamptz '2025-07-02 10:00-04');

-- referência às federações do dados-teste (reescritas acima) pela sigla
CREATE TEMP TABLE _fed ON COMMIT DROP AS
SELECT sigla, id FROM public.federacoes_esportivas WHERE sigla IN ('FRFS', 'FRV', 'FRA', 'FRJ', 'FRHB', 'FRB', 'FRDA', 'FRTM');

INSERT INTO public.calendario_federacao (id, federacao_id, titulo, descricao, tipo, data_inicio, data_fim, local, cidade, publico_estimado, categorias, observacoes, status, created_by)
SELECT c.id::uuid, (SELECT id FROM _fed WHERE sigla = c.sig), c.titulo, c.descr, c.tipo, c.di::date, c.df::date, c.local, c.cidade, c.pub, c.cat, NULL, c.st,
       nullif(current_setting('request.jwt.claim.sub'), '')::uuid
FROM (VALUES
  ('d7140000-0000-4000-8000-000000000001', 'FRFS', 'Campeonato Roraimense de Futsal Adulto', 'Fase final com 8 equipes', 'Campeonato Estadual', '2026-08-01', '2026-09-20', 'Ginásio Central', 'Boa Vista', 1500, 'Adulto masculino e feminino', 'concluido'),
  ('d7140000-0000-4000-8000-000000000002', 'FRFS', 'Copa Boa Vista de Futsal Sub-17', NULL, 'Copa', '2026-10-17', '2026-11-08', 'Ginásio Central', 'Boa Vista', 600, 'Sub-17', 'em_andamento'),
  ('d7140000-0000-4000-8000-000000000003', 'FRV', 'Estadual de Vôlei de Praia', NULL, 'Campeonato Estadual', '2026-11-21', '2026-11-23', 'Orla Taumanan', 'Boa Vista', 800, 'Adulto', 'confirmado'),
  ('d7140000-0000-4000-8000-000000000004', 'FRA', 'Troféu Roraima de Atletismo', 'Etapa de pista e campo', 'Torneio', '2026-11-14', '2026-11-15', 'Estádio Municipal', 'Boa Vista', 400, 'Sub-16, Sub-18 e Adulto', 'confirmado'),
  ('d7140000-0000-4000-8000-000000000005', 'FRA', 'Corrida Rústica de Caracaraí', NULL, 'Festival', '2026-12-06', NULL, 'Centro', 'Caracaraí', 700, 'Geral', 'planejado'),
  ('d7140000-0000-4000-8000-000000000006', 'FRJ', 'Campeonato Roraimense de Judô', NULL, 'Campeonato Estadual', '2026-09-26', '2026-09-27', 'Ginásio do Pintolândia', 'Boa Vista', 350, 'Sub-13 a Sênior', 'concluido'),
  ('d7140000-0000-4000-8000-000000000007', 'FRJ', 'Seletiva Norte de Judô', 'Classificatória para o Brasileiro Regional', 'Seletiva', '2026-12-12', '2026-12-13', 'Ginásio Central', 'Boa Vista', 250, 'Sub-18 e Sub-21', 'planejado'),
  ('d7140000-0000-4000-8000-000000000008', 'FRHB', 'Copa Rorainópolis de Handebol', NULL, 'Copa', '2026-10-10', '2026-10-12', 'Quadra Poliesportiva', 'Rorainópolis', 300, 'Sub-15 e Sub-17', 'cancelado'),
  ('d7140000-0000-4000-8000-000000000009', 'FRHB', 'Campeonato Roraimense de Handebol', NULL, 'Campeonato Estadual', '2026-11-28', '2026-12-13', 'Ginásio Central', 'Boa Vista', 500, 'Adulto', 'planejado'),
  ('d7140000-0000-4000-8000-000000000010', 'FRV', 'Amistoso Roraima x Amazonas', 'Seleções adultas femininas', 'Amistoso', '2026-12-19', NULL, 'Ginásio Central', 'Boa Vista', 900, 'Adulto feminino', 'planejado')
) AS c(id, sig, titulo, descr, tipo, di, df, local, cidade, pub, cat, st);

INSERT INTO public.federacao_parcerias (id, federacao_id, titulo, descricao, tipo, data_inicio, data_fim, status, processo_sei, numero_termo, numero_portaria, observacoes, created_by)
SELECT p.id::uuid, (SELECT id FROM _fed WHERE sigla = p.sig), p.titulo, p.descr, p.tipo, p.di::date, p.df::date, p.st, p.sei, p.termo, p.port, NULL,
       nullif(current_setting('request.jwt.claim.sub'), '')::uuid
FROM (VALUES
  ('d7150000-0000-4000-8000-000000000001', 'FRFS', 'Apoio ao Campeonato Roraimense de Futsal', 'Cessão de arbitragem e material esportivo', 'parceria', '2026-07-01', '2026-12-31', 'vigente', '18101.004512/2026-31', 'TP 004/2026', 'Portaria nº 211/2026'),
  ('d7150000-0000-4000-8000-000000000002', 'FRA', 'Projeto Atletismo nas Escolas', 'Núcleos de iniciação em 6 escolas estaduais', 'projeto', '2026-03-01', '2026-12-15', 'vigente', '18101.002230/2026-08', 'TC 002/2026', NULL),
  ('d7150000-0000-4000-8000-000000000003', 'FRJ', 'Convênio de passagens para o Brasileiro de Judô', NULL, 'convenio', '2025-05-01', '2025-11-30', 'encerrada', '18101.001875/2025-44', 'CV 007/2025', 'Portaria nº 145/2025'),
  ('d7150000-0000-4000-8000-000000000004', 'FRV', 'Patrocínio de uniformes para a seleção estadual', NULL, 'patrocinio', '2026-11-01', '2027-03-31', 'em_analise', '18101.005104/2026-12', NULL, NULL),
  ('d7150000-0000-4000-8000-000000000005', 'FRHB', 'Parceria para o Festival de Handebol Escolar', NULL, 'parceria', '2026-04-01', '2026-10-31', 'suspensa', '18101.002877/2026-70', 'TP 006/2026', NULL)
) AS p(id, sig, titulo, descr, tipo, di, df, st, sei, termo, port);

INSERT INTO public.federacao_espacos_cedidos (id, federacao_id, unidade_local_id, nome_espaco, descricao_espaco, data_inicio, data_fim, dias_semana, horario_inicio, horario_fim, processo_sei, numero_termo_cessao, numero_portaria, status, observacoes, created_by)
SELECT e.id::uuid, (SELECT id FROM _fed WHERE sigla = e.sig), e.ul::uuid, e.nome, e.descr, e.di::date, e.df::date, e.dias, e.hi::time, e.hf::time, e.sei, e.termo, e.port, e.st, NULL,
       nullif(current_setting('request.jwt.claim.sub'), '')::uuid
FROM (VALUES
  ('d7160000-0000-4000-8000-000000000001', 'FRFS', 'e0000000-0000-4000-8000-000000000001', 'Ginásio Central — quadra principal', 'Treinos das seleções de futsal', '2026-02-01', '2026-12-20', ARRAY['segunda','quarta','sexta'], '18:00', '21:00', '18101.000980/2026-15', 'TC-ESP 003/2026', 'Portaria nº 034/2026', 'ativo'),
  ('d7160000-0000-4000-8000-000000000002', 'FRA', 'e0000000-0000-4000-8000-000000000002', 'Estádio Municipal — pista de atletismo', 'Treinos de pista e campo', '2026-01-15', '2026-12-31', ARRAY['terca','quinta','sabado'], '06:00', '09:00', '18101.000431/2026-02', 'TC-ESP 001/2026', 'Portaria nº 012/2026', 'ativo'),
  ('d7160000-0000-4000-8000-000000000003', 'FRDA', 'e0000000-0000-4000-8000-000000000004', 'Parque Aquático — piscina olímpica', 'Treinos de natação', '2026-11-01', '2027-06-30', ARRAY['segunda','terca','quarta','quinta','sexta'], '05:30', '07:30', '18101.005330/2026-61', NULL, NULL, 'solicitado'),
  ('d7160000-0000-4000-8000-000000000004', 'FRHB', 'e0000000-0000-4000-8000-000000000003', 'Quadra Poliesportiva de Rorainópolis', 'Copa Rorainópolis (cancelada)', '2026-10-10', '2026-10-12', ARRAY['sabado','domingo'], '08:00', '18:00', '18101.004020/2026-27', NULL, NULL, 'cancelado'),
  ('d7160000-0000-4000-8000-000000000005', 'FRJ', 'e0000000-0000-4000-8000-000000000001', 'Ginásio Central — sala de lutas', 'Treinos da seleção de judô', '2025-03-01', '2025-12-15', ARRAY['terca','quinta'], '19:00', '21:00', '18101.000702/2025-90', 'TC-ESP 005/2025', 'Portaria nº 051/2025', 'encerrado')
) AS e(id, sig, ul, nome, descr, di, df, dias, hi, hf, sei, termo, port, st);

INSERT INTO public.federacao_arbitros (id, federacao_id, nome, telefone, email, modalidades, disponibilidade, ativo, observacoes, created_by)
SELECT a.id::uuid, (SELECT id FROM _fed WHERE sigla = a.sig), a.nome, a.tel, a.email, a.mods, a.disp, a.ativo, a.obs, nullif(current_setting('request.jwt.claim.sub'), '')::uuid
FROM (VALUES
  ('d7170000-0000-4000-8000-000000000001', 'FRFS', 'Cleiton Barbosa Amorim', '(95) 98200-0001', 'cleiton.amorim@exemplo.test', ARRAY['Futsal'], 'Noites e fins de semana', true, 'Quadro estadual'),
  ('d7170000-0000-4000-8000-000000000002', 'FRFS', 'Adriano Souza Brandão', '(95) 98211-0102', 'adriano.brandao@exemplo.test', ARRAY['Futsal','Futebol'], 'Fins de semana', true, NULL),
  ('d7170000-0000-4000-8000-000000000003', 'FRV', 'Marta Regina Coutinho Lima', '(95) 98200-0002', 'marta.coutinho@exemplo.test', ARRAY['Vôlei','Vôlei de Praia'], 'Sábados', true, 'Quadro nacional'),
  ('d7170000-0000-4000-8000-000000000004', 'FRA', 'Jéssica Moura Tavares', '(95) 98211-0304', 'jessica.tavares@exemplo.test', ARRAY['Atletismo'], 'Manhãs', true, NULL),
  ('d7170000-0000-4000-8000-000000000005', 'FRJ', 'Fábio Hideki Sato', '(95) 98211-0405', 'fabio.sato@exemplo.test', ARRAY['Judô'], 'Fins de semana', true, NULL),
  ('d7170000-0000-4000-8000-000000000006', 'FRHB', 'Mauro Sérgio Pacheco', '(95) 98211-0506', 'mauro.pacheco@exemplo.test', ARRAY['Handebol'], NULL, false, 'Afastado por lesão')
) AS a(id, sig, nome, tel, email, mods, disp, ativo, obs);

-- ===================================================================== árbitros (cadastro público) e modalidades
INSERT INTO public.cadastro_arbitros (id, status, nome, nacionalidade, sexo, data_nascimento, categoria, tipo_sanguineo, fator_rh, cpf, rg, pis_pasep, cep, endereco, complemento, bairro, cidade, uf,
  email, ddd, celular, modalidade, local_trabalho, funcao, esfera, banco, agencia, conta_corrente, protocolo, created_at) VALUES
  ('d7180000-0000-4000-8000-000000000001', 'aprovado', 'Adriano Souza Brandão', 'brasileira', 'M', DATE '1983-02-14', 'estadual', 'B', '+', pg_temp.cpf('418273650'), '298441', '12045678901', '69309-060', 'Rua Pedro Aldemar Bantim, 501', NULL, 'Asa Branca', 'Boa Vista', 'RR',
   'adriano.brandao@exemplo.test', '95', '(95) 98211-0102', 'Futsal, Futebol', 'Polícia Militar de Roraima', 'Sargento', 'estadual', '001', '2617', '45120-3', 'ARB-2026-00003', timestamptz '2026-03-04 10:12-04'),
  ('d7180000-0000-4000-8000-000000000002', 'aprovado', 'Jéssica Moura Tavares', 'brasileira', 'F', DATE '1994-07-30', 'nacional', 'O', '-', pg_temp.cpf('527381946'), '455102', NULL, '69304-350', 'Rua Cecília Brasil, 88', 'Apto 12', 'São Vicente', 'Boa Vista', 'RR',
   'jessica.tavares@exemplo.test', '95', '(95) 98211-0304', 'Atletismo', 'Universidade estadual', 'Técnica de laboratório', 'estadual', '104', '0558', '20077-1', 'ARB-2026-00004', timestamptz '2026-03-11 15:40-04'),
  ('d7180000-0000-4000-8000-000000000003', 'enviado', 'Fábio Hideki Sato', 'brasileira', 'M', DATE '1979-10-05', 'estadual', 'A', '-', pg_temp.cpf('639201847'), '310874', NULL, '69317-410', 'Rua dos Pioneiros, 1290', NULL, 'Cauamé', 'Boa Vista', 'RR',
   'fabio.sato@exemplo.test', '95', '(95) 98211-0405', 'Judô', 'Academia própria', 'Professor de judô', 'municipal', '237', '1802', '88412-9', 'ARB-2026-00005', timestamptz '2026-10-18 20:05-04'),
  ('d7180000-0000-4000-8000-000000000004', 'pendente', 'Lorena Vasconcelos Rufino', 'brasileira', 'F', DATE '2000-01-22', 'estadual', 'AB', '+', pg_temp.cpf('740312958'), '512903', NULL, '69380-000', 'Av. Juscelino Kubitschek, 66', NULL, 'Centro', 'Caracaraí', 'RR',
   'lorena.rufino@exemplo.test', '95', '(95) 98211-0607', 'Handebol, Basquete', 'Prefeitura de Caracaraí', 'Agente administrativa', 'municipal', '001', '3324', '10223-0', 'ARB-2026-00006', timestamptz '2026-10-22 11:30-04'),
  ('d7180000-0000-4000-8000-000000000005', 'rejeitado', 'Wanderson Lima Carvalho', 'brasileira', 'M', DATE '1998-05-09', 'estadual', 'O', '+', pg_temp.cpf('851423069'), '488012', NULL, '69375-000', 'Rua Tancredo Neves, 230', NULL, 'Centro', 'Mucajaí', 'RR',
   'wanderson.carvalho@exemplo.test', '95', '(95) 98211-0708', 'Futebol', NULL, NULL, NULL, '341', '0901', '55210-6', 'ARB-2026-00007', timestamptz '2026-06-02 09:00-04'),
  ('d7180000-0000-4000-8000-000000000006', 'aprovado', 'Yolanda Ramírez Pérez', 'estrangeira', 'F', DATE '1988-12-01', 'estadual', 'A', '+', pg_temp.cpf('962534170'), NULL, NULL, '69306-530', 'Rua Mário Homem de Melo, 1430', NULL, 'Mecejana', 'Boa Vista', 'RR',
   'yolanda.ramirez@exemplo.test', '95', '(95) 98211-0809', 'Vôlei', 'Escola particular', 'Professora de espanhol', 'municipal', '001', '2617', '78101-2', 'ARB-2026-00008', timestamptz '2026-04-19 14:15-04'),
  ('d7180000-0000-4000-8000-000000000007', 'enviado', 'Raimundo Costa Neto', 'brasileira', 'M', DATE '1975-03-17', 'nacional', 'B', '-', pg_temp.cpf('173645281'), '201557', '12098765432', '69343-000', 'Rua Principal, 15', NULL, 'Centro', 'Rorainópolis', 'RR',
   'raimundo.costa@exemplo.test', '95', '(95) 98211-0910', 'Futsal', 'Secretaria de Saúde', 'Técnico de enfermagem', 'estadual', '104', '4410', '31009-8', 'ARB-2026-00009', timestamptz '2026-10-20 08:45-04');
UPDATE public.cadastro_arbitros SET rne = 'V123456-K', validade_rne = DATE '2031-12-01' WHERE id = 'd7180000-0000-4000-8000-000000000006';

INSERT INTO public.cadastro_arbitros_modalidades (id, arbitro_id, modalidade, categoria, status, observacoes)
SELECT m.id::uuid, coalesce(m.arb::uuid, (SELECT id FROM public.cadastro_arbitros WHERE protocolo = m.prot)), m.modal, m.cat, m.st, m.obs
FROM (VALUES
  ('d7190000-0000-4000-8000-000000000001', NULL, 'ARB-2026-00001', 'Futsal', 'estadual', 'pendente', NULL),
  ('d7190000-0000-4000-8000-000000000002', NULL, 'ARB-2026-00002', 'Vôlei', 'nacional', 'aprovado', 'Credenciada pela confederação'),
  ('d7190000-0000-4000-8000-000000000003', NULL, 'ARB-2026-00002', 'Vôlei de Praia', 'estadual', 'aprovado', NULL),
  ('d7190000-0000-4000-8000-000000000004', 'd7180000-0000-4000-8000-000000000001', NULL, 'Futsal', 'estadual', 'aprovado', NULL),
  ('d7190000-0000-4000-8000-000000000005', 'd7180000-0000-4000-8000-000000000001', NULL, 'Futebol', 'estadual', 'aprovado', NULL),
  ('d7190000-0000-4000-8000-000000000006', 'd7180000-0000-4000-8000-000000000002', NULL, 'Atletismo', 'nacional', 'aprovado', NULL),
  ('d7190000-0000-4000-8000-000000000007', 'd7180000-0000-4000-8000-000000000003', NULL, 'Judô', 'estadual', 'enviado', NULL),
  ('d7190000-0000-4000-8000-000000000008', 'd7180000-0000-4000-8000-000000000004', NULL, 'Handebol', 'estadual', 'pendente', NULL),
  ('d7190000-0000-4000-8000-000000000009', 'd7180000-0000-4000-8000-000000000004', NULL, 'Basquete', 'estadual', 'pendente', NULL),
  ('d7190000-0000-4000-8000-000000000010', 'd7180000-0000-4000-8000-000000000005', NULL, 'Futebol', 'estadual', 'rejeitado', 'Sem curso de formação de arbitragem'),
  ('d7190000-0000-4000-8000-000000000011', 'd7180000-0000-4000-8000-000000000006', NULL, 'Vôlei', 'estadual', 'aprovado', NULL),
  ('d7190000-0000-4000-8000-000000000012', 'd7180000-0000-4000-8000-000000000007', NULL, 'Futsal', 'nacional', 'enviado', NULL)
) AS m(id, arb, prot, modal, cat, st, obs);

-- ===================================================================== escolas e gestores escolares (um gestor por escola)
INSERT INTO public.escolas_jer (id, nome, municipio, inep) VALUES
  ('d71a0000-0000-4000-8000-000000000001', 'Escola Estadual Professor Severino Gonçalves Cavalcante', 'Boa Vista', '14013117'),
  ('d71a0000-0000-4000-8000-000000000002', 'Escola Estadual Dom Aldo Mongiano', 'Boa Vista', '14013540'),
  ('d71a0000-0000-4000-8000-000000000003', 'Escola Estadual Maria Nilce Macedo Brandão', 'Boa Vista', '14014288'),
  ('d71a0000-0000-4000-8000-000000000004', 'Escola Estadual Vidal da Penha Ferreira', 'Rorainópolis', '14025301'),
  ('d71a0000-0000-4000-8000-000000000005', 'Escola Estadual Padre Calleri', 'Mucajaí', '14026112'),
  ('d71a0000-0000-4000-8000-000000000006', 'Escola Estadual Indígena Tuxaua Antônio Horácio', 'Pacaraima', '14029007'),
  ('d71a0000-0000-4000-8000-000000000007', 'Escola Estadual Professora Ana Libória', 'Alto Alegre', '14027460'),
  ('d71a0000-0000-4000-8000-000000000008', 'Escola Estadual São José', 'São João da Baliza', '14028355'),
  ('d71a0000-0000-4000-8000-000000000009', 'Escola Estadual Princesa Isabel', 'Bonfim', '14030184');

INSERT INTO public.gestores_escolares (id, escola_id, nome, cpf, rg, data_nascimento, email, celular, endereco, status, responsavel_id, responsavel_nome, observacoes,
  contato_realizado, acesso_testado, data_cadastro_cbde, data_contato, data_confirmacao, created_at)
SELECT g.id::uuid, g.esc::uuid, g.nome, pg_temp.cpf(g.cpfb), g.rg, g.nasc::date, g.email, g.cel, g.ender, g.st,
       CASE WHEN g.st <> 'aguardando' THEN nullif(current_setting('request.jwt.claim.sub'), '')::uuid END,
       CASE WHEN g.st <> 'aguardando' THEN 'Usuário de Teste' END, g.obs,
       g.st IN ('contato_realizado', 'confirmado'), g.st = 'confirmado',
       CASE WHEN g.st IN ('cadastrado_cbde', 'contato_realizado', 'confirmado') THEN timestamptz '2026-09-10 10:00-04' END,
       CASE WHEN g.st IN ('contato_realizado', 'confirmado') THEN timestamptz '2026-09-15 15:00-04' END,
       CASE WHEN g.st = 'confirmado' THEN timestamptz '2026-09-20 09:00-04' END,
       g.criado::timestamptz
FROM (VALUES
  ('d71b0000-0000-4000-8000-000000000001', 'd71a0000-0000-4000-8000-000000000001', 'Luzia Fernandes de Almeida', '310457829', '214778', '1972-05-12', 'luzia.almeida@exemplo.test', '(95) 98310-1001', 'Rua Uraricoera, 300, Boa Vista/RR', 'confirmado', NULL, '2026-08-25 09:00-04'),
  ('d71b0000-0000-4000-8000-000000000002', 'd71a0000-0000-4000-8000-000000000002', 'Antônio Carlos Ribeiro Neto', '421568930', '198330', '1969-11-30', 'antonio.ribeiro@exemplo.test', '(95) 98310-1002', 'Av. São Sebastião, 1150, Boa Vista/RR', 'contato_realizado', 'Aguardando o gestor testar o acesso à plataforma da CBDE.', '2026-08-26 10:30-04'),
  ('d71b0000-0000-4000-8000-000000000003', 'd71a0000-0000-4000-8000-000000000003', 'Francisca Helena Barroso', '532679041', '305667', '1980-02-08', 'francisca.barroso@exemplo.test', '(95) 98310-1003', 'Rua Rio Negro, 45, Boa Vista/RR', 'cadastrado_cbde', NULL, '2026-08-28 14:00-04'),
  ('d71b0000-0000-4000-8000-000000000004', 'd71a0000-0000-4000-8000-000000000004', 'José Ribamar Lopes Sobrinho', '643780152', '276019', '1975-09-19', 'jose.ribamar@exemplo.test', '(95) 98310-1004', 'Rua Getúlio Vargas, 210, Rorainópolis/RR', 'em_processamento', NULL, '2026-09-02 08:15-04'),
  ('d71b0000-0000-4000-8000-000000000005', 'd71a0000-0000-4000-8000-000000000005', 'Sandra Maria Guimarães', '754891263', '330412', '1983-04-03', 'sandra.guimaraes@exemplo.test', '(95) 98310-1005', 'Av. Nossa Senhora de Fátima, 77, Mucajaí/RR', 'problema', 'E-mail informado volta com erro; pedir outro contato à escola.', '2026-09-05 11:00-04'),
  ('d71b0000-0000-4000-8000-000000000006', 'd71a0000-0000-4000-8000-000000000006', 'Marcos Wapichana da Silva', '865902374', '412233', '1986-06-21', 'marcos.wapichana@exemplo.test', '(95) 98310-1006', 'Comunidade Sorocaima, Pacaraima/RR', 'aguardando', NULL, '2026-10-20 16:40-04'),
  ('d71b0000-0000-4000-8000-000000000007', 'd71a0000-0000-4000-8000-000000000007', 'Gisele Rocha Batista', '976013485', '367855', '1990-10-14', 'gisele.batista@exemplo.test', '(95) 98310-1007', 'Rua Mário Andreazza, 18, Alto Alegre/RR', 'aguardando', NULL, '2026-10-21 09:20-04')
) AS g(id, esc, nome, cpfb, rg, nasc, email, cel, ender, st, obs, criado);
-- d71a...08 e ...09 ficam sem gestor de propósito (escolas ainda não cadastradas)

-- ===================================================================== reuniões, participantes, convites e assinatura
INSERT INTO public.config_assinatura_reuniao (id, nome_configuracao, cargo_assinante_1, nome_assinante_1, cargo_assinante_2, nome_assinante_2, texto_cabecalho, texto_rodape, padrao, ativo) VALUES
  ('d71c0000-0000-4000-8000-000000000001', 'Presidência', 'Presidente', 'Helena Prado Moura', NULL, NULL, 'Instituto de Desporto, Juventude e Lazer do Estado de Roraima', 'Gabinete da Presidência — Boa Vista/RR', true, true),
  ('d71c0000-0000-4000-8000-000000000002', 'Diretoria de Esporte', 'Diretora de Esporte', 'Patrícia Nogueira Sales', 'Presidente', 'Helena Prado Moura', 'Instituto de Desporto, Juventude e Lazer do Estado de Roraima', 'Diretoria de Esporte — Boa Vista/RR', false, true),
  ('d71c0000-0000-4000-8000-000000000003', 'Diretoria Administrativa (antiga)', 'Diretor Administrativo e Financeiro', 'Ricardo Lemos Bastos', NULL, NULL, NULL, NULL, false, false);

INSERT INTO public.reunioes (id, titulo, tipo, status, data_reuniao, hora_inicio, hora_fim, local, endereco_completo, link_virtual, pauta, observacoes, ata_conteudo, ata_aprovada,
  unidade_responsavel_id, organizador_id, numero_protocolo, mensagem_convite) VALUES
  ('d71d0000-0000-4000-8000-000000000001', 'Reunião com as federações sobre o calendário esportivo de 2027', 'reuniao_trabalho', 'confirmada', DATE '2026-11-05', '15:00', '17:30',
   'Auditório da sede', 'Av. Brigadeiro Eduardo Gomes, Boa Vista/RR', NULL,
   '1. Apresentação do calendário preliminar de 2027
2. Pedidos de cessão de espaços esportivos
3. Regras para apoio com arbitragem e transporte
4. Prestação de contas das parcerias de 2026', 'Cada federação deve trazer o seu calendário em planilha.', NULL, false,
   'a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000004', 'REU-2026-0012', 'Convidamos Vossa Senhoria para reunião sobre o calendário esportivo de 2027.'),
  ('d71d0000-0000-4000-8000-000000000002', 'Comitê organizador dos Jogos Escolares — 2ª reunião', 'reuniao_trabalho', 'realizada', DATE '2026-10-08', '09:00', '11:30',
   'Sala de reuniões da Diretoria de Esporte', NULL, NULL,
   '1. Confirmação das sedes por modalidade
2. Escala de arbitragem
3. Credenciamento de imprensa', NULL,
   'Aberta a reunião às 9h pela Diretora de Esporte, Patrícia Nogueira Sales.

1. Sedes confirmadas: Ginásio Central (futsal, vôlei, basquete e handebol), Estádio Municipal (atletismo) e Parque Aquático (natação).
2. A Federação Roraimense de Futsal indicará 12 árbitros; as demais modalidades usarão o quadro do cadastro estadual.
3. A ASCOM abrirá o credenciamento de imprensa em 15/10.

Encerrada às 11h20.', true,
   'a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000004', 'REU-2026-0010', NULL),
  ('d71d0000-0000-4000-8000-000000000003', 'Sessão solene de entrega do Bolsa Atleta 2026', 'sessao_solene', 'realizada', DATE '2026-09-25', '19:00', '21:00',
   'Teatro Municipal', 'Boa Vista/RR', NULL,
   '1. Composição da mesa
2. Pronunciamentos
3. Entrega simbólica dos termos aos atletas', NULL,
   'Sessão realizada com a presença de 86 atletas contemplados, familiares e dirigentes de federações. Foram entregues simbolicamente os termos de concessão a 10 atletas.', true,
   'a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000002', 'REU-2026-0008', NULL),
  ('d71d0000-0000-4000-8000-000000000004', 'Audiência com a Associação de Moradores do Pintolândia', 'audiencia', 'adiada', DATE '2026-10-29', '18:30', '20:00',
   'Centro comunitário do Pintolândia', 'Rua 15, Pintolândia, Boa Vista/RR', NULL,
   '1. Reforma da quadra do bairro
2. Ampliação do Juventude Ativa', 'Adiada a pedido da associação; nova data a combinar.', NULL, false,
   'a0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000005', 'REU-2026-0013', NULL),
  ('d71d0000-0000-4000-8000-000000000005', 'Reunião extraordinária sobre a interdição do Estádio', 'extraordinaria', 'cancelada', DATE '2026-10-22', '10:00', '11:00',
   'Gabinete da Presidência', NULL, NULL, '1. Laudo do Corpo de Bombeiros
2. Remanejamento dos jogos', 'Cancelada: o assunto foi resolvido em despacho da Presidência.', NULL, false,
   'a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000002', 'REU-2026-0014', NULL),
  ('d71d0000-0000-4000-8000-000000000006', 'Alinhamento semanal da ASCOM', 'reuniao_trabalho', 'agendada', DATE '2026-10-26', '08:30', '09:30',
   NULL, NULL, 'https://meet.exemplo.test/ascom-semanal', '1. Pauta da semana
2. Demandas em atraso
3. Cobertura dos Jogos Escolares', NULL, NULL, false,
   'a0000000-0000-4000-8000-000000000008', 'c0000000-0000-4000-8000-000000000015', 'REU-2026-0015', NULL);

-- participantes: servidores do dados-teste e convidados externos
CREATE TEMP TABLE _reu ON COMMIT DROP AS
SELECT 'r1'::text AS k, id FROM public.reunioes WHERE numero_protocolo = 'REU-2026-0011'   -- planejamento JERs (agendada, dados-teste)
UNION ALL SELECT 'r2', id FROM public.reunioes WHERE numero_protocolo = 'REU-2026-0009'      -- diretoria (realizada, dados-teste)
UNION ALL SELECT 'n1', 'd71d0000-0000-4000-8000-000000000001'::uuid
UNION ALL SELECT 'n2', 'd71d0000-0000-4000-8000-000000000002'::uuid
UNION ALL SELECT 'n3', 'd71d0000-0000-4000-8000-000000000003'::uuid
UNION ALL SELECT 'n4', 'd71d0000-0000-4000-8000-000000000004'::uuid
UNION ALL SELECT 'n5', 'd71d0000-0000-4000-8000-000000000005'::uuid
UNION ALL SELECT 'n6', 'd71d0000-0000-4000-8000-000000000006'::uuid;

INSERT INTO public.participantes_reuniao (id, reuniao_id, servidor_id, nome_externo, email_externo, telefone_externo, instituicao_externa, cargo_funcao, tipo_participante, status, obrigatorio,
  data_confirmacao, justificativa_ausencia, assinatura_presenca, data_assinatura, convite_enviado, convite_enviado_em, convite_enviado_por, convite_canal)
SELECT ('d71e0000-0000-4000-8000-' || lpad(p.n::text, 12, '0'))::uuid, (SELECT id FROM _reu WHERE k = p.reu),
       CASE WHEN p.srv IS NOT NULL THEN ('c0000000-0000-4000-8000-0000000000' || lpad(p.srv::text, 2, '0'))::uuid END,
       p.nome, p.email, p.tel, p.inst, p.cargo, p.tipo, p.st::public.status_participante, p.obrig,
       CASE WHEN p.st IN ('confirmado', 'presente', 'recusado') THEN timestamptz '2026-10-01 12:00-04' END,
       p.just, p.st = 'presente', CASE WHEN p.st = 'presente' THEN timestamptz '2026-10-01 12:00-04' END,
       p.conv, CASE WHEN p.conv THEN timestamptz '2026-09-28 10:00-04' END,
       CASE WHEN p.conv THEN nullif(current_setting('request.jwt.claim.sub'), '')::uuid END,
       CASE WHEN p.conv THEN coalesce(p.canal, 'email') END
FROM (VALUES
  -- r1: planejamento dos JERs (agendada)
  ( 1, 'r1',  4, NULL, NULL, NULL, NULL, 'Diretora de Esporte', 'organizador', 'confirmado', true, NULL, true, 'email'),
  ( 2, 'r1', 13, NULL, NULL, NULL, NULL, 'Coordenador dos Jogos Escolares', 'membro', 'confirmado', true, NULL, true, 'email'),
  ( 3, 'r1', 15, NULL, NULL, NULL, NULL, 'Assessor de Comunicação', 'membro', 'pendente', false, NULL, true, 'whatsapp'),
  ( 4, 'r1',  8, NULL, NULL, NULL, NULL, 'Chefe da Divisão de Patrimônio e Compras', 'membro', 'pendente', false, NULL, false, NULL),
  ( 5, 'r1', NULL, 'Cláudia Regina Portela', 'claudia.portela@exemplo.test', '(95) 98400-1101', 'Secretaria de Estado da Educação', 'Coordenadora de Desporto Escolar', 'convidado', 'confirmado', false, NULL, true, 'email'),
  -- r2: diretoria (realizada)
  ( 6, 'r2',  2, NULL, NULL, NULL, NULL, 'Presidente', 'organizador', 'presente', true, NULL, true, 'email'),
  ( 7, 'r2',  3, NULL, NULL, NULL, NULL, 'Diretor Administrativo e Financeiro', 'membro', 'presente', true, NULL, true, 'email'),
  ( 8, 'r2',  4, NULL, NULL, NULL, NULL, 'Diretora de Esporte', 'membro', 'presente', true, NULL, true, 'email'),
  ( 9, 'r2',  5, NULL, NULL, NULL, NULL, 'Diretor de Juventude', 'membro', 'presente', true, NULL, true, 'email'),
  (10, 'r2', 17, NULL, NULL, NULL, NULL, 'Assessor Jurídico', 'membro', 'ausente', false, 'Audiência no Tribunal de Justiça no mesmo horário.', true, 'email'),
  -- n1: federações (confirmada)
  (11, 'n1',  4, NULL, NULL, NULL, NULL, 'Diretora de Esporte', 'organizador', 'confirmado', true, NULL, true, 'email'),
  (12, 'n1', NULL, 'Raimundo Nonato Bezerra Filho', 'presidencia@frfs.exemplo.test', '(95) 98100-0001', 'Federação Roraimense de Futsal', 'Presidente', 'convidado', 'confirmado', false, NULL, true, 'email'),
  (13, 'n1', NULL, 'Luciana Mota Albuquerque', 'presidencia@frv.exemplo.test', '(95) 98100-0002', 'Federação Roraimense de Voleibol', 'Presidente', 'convidado', 'pendente', false, NULL, true, 'whatsapp'),
  (14, 'n1', NULL, 'Sebastião Alves Peixoto', 'presidencia@fra.exemplo.test', '(95) 98111-2031', 'Federação Roraimense de Atletismo', 'Presidente', 'convidado', 'confirmado', false, NULL, true, 'email'),
  (15, 'n1', NULL, 'Hiroshi Tavares Nakamura', 'presidencia@frj.exemplo.test', '(95) 98111-3041', 'Federação Roraimense de Judô', 'Presidente', 'convidado', 'recusado', false, 'Viagem para competição nacional.', true, 'email'),
  (16, 'n1', NULL, 'Valéria Cristina Bentes', 'presidencia@frhb.exemplo.test', '(95) 98111-4051', 'Federação Roraimense de Handebol', 'Presidente', 'convidado', 'pendente', false, NULL, false, NULL),
  -- n2: comitê dos JERs (realizada)
  (17, 'n2',  4, NULL, NULL, NULL, NULL, 'Diretora de Esporte', 'organizador', 'presente', true, NULL, true, 'email'),
  (18, 'n2', 13, NULL, NULL, NULL, NULL, 'Coordenador dos Jogos Escolares', 'membro', 'presente', true, NULL, true, 'email'),
  (19, 'n2', 14, NULL, NULL, NULL, NULL, 'Professora de Educação Física', 'membro', 'presente', false, NULL, true, 'email'),
  (20, 'n2', 15, NULL, NULL, NULL, NULL, 'Assessor de Comunicação', 'membro', 'presente', false, NULL, true, 'whatsapp'),
  (21, 'n2', NULL, 'Raimundo Nonato Bezerra Filho', 'presidencia@frfs.exemplo.test', '(95) 98100-0001', 'Federação Roraimense de Futsal', 'Presidente', 'convidado', 'presente', false, NULL, true, 'email'),
  (22, 'n2', NULL, 'Cláudia Regina Portela', 'claudia.portela@exemplo.test', '(95) 98400-1101', 'Secretaria de Estado da Educação', 'Coordenadora de Desporto Escolar', 'convidado', 'ausente', false, 'Compromisso na Secretaria.', true, 'email'),
  -- n3: sessão solene Bolsa Atleta (realizada)
  (23, 'n3',  2, NULL, NULL, NULL, NULL, 'Presidente', 'organizador', 'presente', true, NULL, true, 'email'),
  (24, 'n3',  4, NULL, NULL, NULL, NULL, 'Diretora de Esporte', 'membro', 'presente', true, NULL, true, 'email'),
  (25, 'n3',  3, NULL, NULL, NULL, NULL, 'Diretor Administrativo e Financeiro', 'membro', 'presente', false, NULL, true, 'email'),
  (26, 'n3', NULL, 'Deputado Estadual Fernando Saraiva Couto', 'gabinete.couto@exemplo.test', '(95) 98400-2201', 'Assembleia Legislativa', 'Presidente da Comissão de Esporte', 'convidado', 'presente', false, NULL, true, 'email'),
  (27, 'n3', NULL, 'Sebastião Alves Peixoto', 'presidencia@fra.exemplo.test', '(95) 98111-2031', 'Federação Roraimense de Atletismo', 'Presidente', 'convidado', 'presente', false, NULL, true, 'email'),
  -- n4: audiência (adiada)
  (28, 'n4',  5, NULL, NULL, NULL, NULL, 'Diretor de Juventude', 'organizador', 'confirmado', true, NULL, true, 'email'),
  (29, 'n4', 16, NULL, NULL, NULL, NULL, 'Assessora Técnica', 'membro', 'confirmado', false, NULL, true, 'email'),
  (30, 'n4', NULL, 'Maria do Socorro Lima Paiva', 'socorro.paiva@exemplo.test', '(95) 98400-3301', 'Associação de Moradores do Pintolândia', 'Presidente', 'convidado', 'pendente', false, NULL, true, 'whatsapp'),
  -- n5: extraordinária (cancelada)
  (31, 'n5',  2, NULL, NULL, NULL, NULL, 'Presidente', 'organizador', 'pendente', true, NULL, false, NULL),
  (32, 'n5',  3, NULL, NULL, NULL, NULL, 'Diretor Administrativo e Financeiro', 'membro', 'pendente', true, NULL, false, NULL),
  -- n6: ASCOM semanal (agendada)
  (33, 'n6', 15, NULL, NULL, NULL, NULL, 'Assessor de Comunicação', 'organizador', 'confirmado', true, NULL, true, 'email'),
  (34, 'n6',  1, NULL, NULL, NULL, NULL, 'Assessor Técnico', 'membro', 'pendente', false, NULL, true, 'email')
) AS p(n, reu, srv, nome, email, tel, inst, cargo, tipo, st, obrig, just, conv, canal);

INSERT INTO public.historico_convites_reuniao (id, reuniao_id, participante_id, tipo_envio, destinatario, assunto, conteudo, status_envio, data_envio, erro_envio, created_by)
SELECT ('d71f0000-0000-4000-8000-' || lpad(row_number() OVER (ORDER BY p.id)::text, 12, '0'))::uuid,
       p.reuniao_id, p.id, p.convite_canal,
       CASE WHEN p.convite_canal = 'whatsapp' THEN coalesce(p.telefone_externo, s.telefone_celular)
            ELSE coalesce(p.email_externo, s.email_institucional) END,
       'Convite: ' || r.titulo,
       'Convidamos Vossa Senhoria para a reunião "' || r.titulo || '", em ' || to_char(r.data_reuniao, 'DD/MM/YYYY') || ', às ' || to_char(r.hora_inicio, 'HH24:MI') || '.',
       CASE WHEN p.id = 'd71e0000-0000-4000-8000-000000000003' THEN 'erro' ELSE 'enviado' END,
       p.convite_enviado_em,
       CASE WHEN p.id = 'd71e0000-0000-4000-8000-000000000003' THEN 'Número sem WhatsApp' END,
       nullif(current_setting('request.jwt.claim.sub'), '')::uuid
FROM public.participantes_reuniao p
JOIN public.reunioes r ON r.id = p.reuniao_id
LEFT JOIN public.servidores s ON s.id = p.servidor_id
WHERE p.id::text LIKE 'd71e0000-%' AND p.convite_enviado;

-- ===================================================================== conferência
SELECT 'cms_conteudos' AS tabela, count(*) FROM public.cms_conteudos
UNION ALL SELECT 'cms_galerias', count(*) FROM public.cms_galerias
UNION ALL SELECT 'cms_galeria_fotos', count(*) FROM public.cms_galeria_fotos
UNION ALL SELECT 'demandas_ascom', count(*) FROM public.demandas_ascom
UNION ALL SELECT 'federacoes_esportivas', count(*) FROM public.federacoes_esportivas
UNION ALL SELECT 'cadastro_arbitros', count(*) FROM public.cadastro_arbitros
UNION ALL SELECT 'gestores_escolares', count(*) FROM public.gestores_escolares
UNION ALL SELECT 'reunioes', count(*) FROM public.reunioes
UNION ALL SELECT 'participantes_reuniao', count(*) FROM public.participantes_reuniao;

COMMIT;
