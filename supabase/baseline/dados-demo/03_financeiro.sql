-- Dados FICTÍCIOS de demonstração — Financeiro/orçamento (QDD, despesa, banco, conciliação), PCA e catálogo
-- CATMAT/CATSER. Só para o banco de TESTE, depois de dados-teste.sql.
-- Guia: docs/NOVO_BANCO.md §9.
--
-- O que monta (exercício 2026, hoje 23/10/2026):
--   * classificação do QDD do FIPLAN (programas 030/031/032, PAOEs, fontes 1.500/1.501/1.700) e 13 dotações;
--   * credores, contas do BB e a conta pagadora do OBN600;
--   * ciclo da despesa: solicitação → empenho (com reforço e anulação) → liquidação → pagamento → remessa OBN600
--     (pelas RPCs registrar_remessa_obn600/confirmar_remessa_bancaria) → retorno do banco (importar_arquivo_bancario,
--     que dá baixa nos pagamentos) → extrato do BB → quadro da SEFAZ (salvar/fechar_conciliacao_mensal);
--   * empenhos importados do FIP 614 e o QDD importado (importar_empenhos_fip614 / importar_qdd_fiplan), para o
--     painel do Financeiro; tabelas do FIPLAN (importar_classificadores_fiplan);
--   * restos a pagar de 2025 (fn_inscrever_restos_pagar), alterações orçamentárias, suprimento de fundos, receitas,
--     fechamentos mensais e lançamentos contábeis;
--   * PCA 2026 (publicado, tetos do QDD) e PCA 2027 (enviado ao SEI) com itens do catálogo CATMAT/CATSER;
--   * tabelas antigas ainda lidas: dotacoes_orcamentarias (transparência), creditos_adicionais, centros_custo e
--     acoes (painel de Programas). As antigas empenhos/liquidacoes/pagamentos ficam vazias (nenhuma tela lê).
-- Nomes de pessoas, CPFs, CNPJs, contas e números de documentos são inventados.
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
  IF EXISTS (SELECT 1 FROM public.fin_liquidacoes) THEN
    RAISE EXCEPTION 'recusado: os dados de demonstração deste módulo já foram carregados';
  END IF;
END $$;
-- quem "faz" as ações (auth.uid() nos triggers de autoria): o login de teste ligado ao servidor fictício
SELECT set_config('request.jwt.claim.sub', coalesce((SELECT id::text FROM public.profiles
  WHERE servidor_id = 'c0000000-0000-4000-8000-000000000001'), ''), true) AS _ \gset
SELECT set_config('request.jwt.claim.role', 'authenticated', true) AS _ \gset

DO $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'recusado: o login de teste não está ligado ao servidor "Usuário de Teste" (rode o dados-teste.sql com -v email=...): as RPCs do FIPLAN e do banco exigem usuário';
  END IF;
END $$;

-- CPF/CNPJ com dígitos verificadores válidos (só para os dados fictícios)
CREATE FUNCTION pg_temp.cpf(base text) RETURNS text LANGUAGE plpgsql AS $f$
DECLARE s int; d1 int; d2 int; i int;
BEGIN
  s := 0; FOR i IN 1..9 LOOP s := s + substr(base, i, 1)::int * (11 - i); END LOOP;
  d1 := 11 - s % 11; IF d1 >= 10 THEN d1 := 0; END IF;
  s := 0; FOR i IN 1..9 LOOP s := s + substr(base, i, 1)::int * (12 - i); END LOOP;
  s := s + d1 * 2; d2 := 11 - s % 11; IF d2 >= 10 THEN d2 := 0; END IF;
  RETURN base || d1 || d2;
END $f$;
CREATE FUNCTION pg_temp.cnpj(base text) RETURNS text LANGUAGE plpgsql AS $f$
DECLARE p1 int[] := '{5,4,3,2,9,8,7,6,5,4,3,2}'; p2 int[] := '{6,5,4,3,2,9,8,7,6,5,4,3,2}';
        s int; d1 int; d2 int; i int; n text;
BEGIN
  s := 0; FOR i IN 1..12 LOOP s := s + substr(base, i, 1)::int * p1[i]; END LOOP;
  d1 := CASE WHEN s % 11 < 2 THEN 0 ELSE 11 - s % 11 END;
  n := base || d1;
  s := 0; FOR i IN 1..13 LOOP s := s + substr(n, i, 1)::int * p2[i]; END LOOP;
  d2 := CASE WHEN s % 11 < 2 THEN 0 ELSE 11 - s % 11 END;
  n := n || d2;
  RETURN substr(n, 1, 2) || '.' || substr(n, 3, 3) || '.' || substr(n, 6, 3) || '/' || substr(n, 9, 4) || '-' || substr(n, 13, 2);
END $f$;
-- hash de "arquivo" para os logs de importação (o arquivo não existe; o log só guarda o SHA-256)
CREATE FUNCTION pg_temp.sha(t text) RETURNS text LANGUAGE sql AS $f$ SELECT encode(sha256(convert_to(t, 'UTF8')), 'hex') $f$;

-- ===================================================================== classificação orçamentária (QDD 2026)
INSERT INTO public.fin_fontes_recurso (id, codigo, nome, origem, detalhamento_fonte, ativo) VALUES
  ('d3010000-0000-4000-8000-000000000001', '1.500', 'Recursos não Vinculados de Impostos', 'Tesouro Estadual', '1.500', true),
  ('d3010000-0000-4000-8000-000000000002', '1.501', 'Outros Recursos não Vinculados', 'Tesouro Estadual', '1.501', true),
  ('d3010000-0000-4000-8000-000000000003', '1.700', 'Outras Transferências de Convênios ou Instrumentos Congêneres da União', 'Convênios federais', '1.700', true);

INSERT INTO public.fin_naturezas_despesa (id, codigo, nome, categoria_economica, grupo_natureza, modalidade_aplicacao, elemento, subelemento, ativo) VALUES
  ('d3020000-0000-4000-8000-000000000001', '3.3.90.31', 'Premiações Culturais, Artísticas, Científicas, Desportivas e Outras', '3', '3', '90', '31', NULL, true),
  ('d3020000-0000-4000-8000-000000000002', '3.3.50.41', 'Contribuições', '3', '3', '50', '41', NULL, true);

INSERT INTO public.fin_programas_orcamentarios (id, codigo, nome, objetivo, exercicio, ativo) VALUES
  ('d3030000-0000-4000-8000-000000000001', '030', 'Gestão Administrativa do Desporto e da Juventude', 'Manter a estrutura administrativa e a política estadual de esporte, juventude e lazer', 2026, true),
  ('d3030000-0000-4000-8000-000000000002', '031', 'Roraima Mais Esporte', 'Ampliar o acesso ao esporte educacional, de participação e de rendimento', 2026, true),
  ('d3030000-0000-4000-8000-000000000003', '032', 'Juventude Protagonista', 'Promover a participação e o protagonismo da juventude roraimense', 2026, true),
  ('d3030000-0000-4000-8000-000000000004', '030', 'Gestão Administrativa do Desporto e da Juventude', 'Manter a estrutura administrativa e a política estadual de esporte, juventude e lazer', 2025, true);

INSERT INTO public.fin_acoes_orcamentarias (id, programa_id, codigo, nome, tipo, produto, unidade_medida, meta_fisica, ativo) VALUES
  ('d3040000-0000-4000-8000-000000000001', 'd3030000-0000-4000-8000-000000000001', '2544', 'Gestão da Política para a Juventude e Desporto', 'atividade', 'Unidade mantida', 'unidade', 1, true),
  ('d3040000-0000-4000-8000-000000000002', 'd3030000-0000-4000-8000-000000000002', '2545', 'Promoção de Jogos e Competições Esportivas', 'atividade', 'Evento realizado', 'evento', 12, true),
  ('d3040000-0000-4000-8000-000000000003', 'd3030000-0000-4000-8000-000000000002', '2546', 'Fomento ao Esporte de Rendimento', 'atividade', 'Entidade apoiada', 'entidade', 8, true),
  ('d3040000-0000-4000-8000-000000000004', 'd3030000-0000-4000-8000-000000000002', '1083', 'Equipamento de Espaços Esportivos', 'projeto', 'Espaço equipado', 'unidade', 6, true),
  ('d3040000-0000-4000-8000-000000000005', 'd3030000-0000-4000-8000-000000000003', '2547', 'Ações de Protagonismo Juvenil', 'atividade', 'Jovem atendido', 'pessoa', 3500, true),
  ('d3040000-0000-4000-8000-000000000006', 'd3030000-0000-4000-8000-000000000004', '2544', 'Gestão da Política para a Juventude e Desporto', 'atividade', 'Unidade mantida', 'unidade', 1, true);

-- Dotações no formato do QDD do FIPLAN: função.subfunção.programa.PAOE.regional.natureza.fonte.acompanhamento.IDU.
-- Os valores de execução começam zerados: os empenhos do sistema os somam pelos gatilhos e, no fim, o QDD importado
-- (importar_qdd_fiplan) traz a posição do FIPLAN, com os empenhos do FIP 614.
CREATE TEMP TABLE _dot (n int, id uuid, exercicio int, func text, subf text, prog text, paoe text, paoe_nome text,
  nat text, fonte text, acao uuid, programa uuid, inicial numeric, supl numeric, red numeric,
  bloq numeric, reserva numeric, ped numeric) ON COMMIT DROP;
INSERT INTO _dot VALUES
  ( 1, 'd3050000-0000-4000-8000-000000000001', 2026, '27', '122', '030', '2544', 'Gestão da Política para a Juventude e Desporto', '33903000', '1.500', 'd3040000-0000-4000-8000-000000000001', 'd3030000-0000-4000-8000-000000000001', 185000.00, 0, 40000.00, 0, 0, 0),
  ( 2, 'd3050000-0000-4000-8000-000000000002', 2026, '27', '122', '030', '2544', 'Gestão da Política para a Juventude e Desporto', '33903900', '1.500', 'd3040000-0000-4000-8000-000000000001', 'd3030000-0000-4000-8000-000000000001', 642300.00, 0, 0, 30000.00, 0, 0),
  ( 3, 'd3050000-0000-4000-8000-000000000003', 2026, '27', '122', '030', '2544', 'Gestão da Política para a Juventude e Desporto', '33904000', '1.500', 'd3040000-0000-4000-8000-000000000001', 'd3030000-0000-4000-8000-000000000001', 238000.00, 0, 0, 0, 0, 0),
  ( 4, 'd3050000-0000-4000-8000-000000000004', 2026, '27', '122', '030', '2544', 'Gestão da Política para a Juventude e Desporto', '33901400', '1.500', 'd3040000-0000-4000-8000-000000000001', 'd3030000-0000-4000-8000-000000000001', 96500.00, 15000.00, 0, 0, 0, 0),
  ( 5, 'd3050000-0000-4000-8000-000000000005', 2026, '27', '122', '030', '2544', 'Gestão da Política para a Juventude e Desporto', '33903300', '1.500', 'd3040000-0000-4000-8000-000000000001', 'd3030000-0000-4000-8000-000000000001', 118000.00, 0, 15000.00, 0, 0, 0),
  ( 6, 'd3050000-0000-4000-8000-000000000006', 2026, '27', '812', '031', '2545', 'Promoção de Jogos e Competições Esportivas', '33903000', '1.500', 'd3040000-0000-4000-8000-000000000002', 'd3030000-0000-4000-8000-000000000002', 362000.00, 40000.00, 0, 0, 0, 12800.00),
  ( 7, 'd3050000-0000-4000-8000-000000000007', 2026, '27', '812', '031', '2545', 'Promoção de Jogos e Competições Esportivas', '33903900', '1.500', 'd3040000-0000-4000-8000-000000000002', 'd3030000-0000-4000-8000-000000000002', 915000.00, 120000.00, 0, 0, 45000.00, 0),
  ( 8, 'd3050000-0000-4000-8000-000000000008', 2026, '27', '812', '031', '2545', 'Promoção de Jogos e Competições Esportivas', '33903100', '1.500', 'd3040000-0000-4000-8000-000000000002', 'd3030000-0000-4000-8000-000000000002', 150000.00, 0, 0, 0, 0, 0),
  ( 9, 'd3050000-0000-4000-8000-000000000009', 2026, '27', '811', '031', '2546', 'Fomento ao Esporte de Rendimento', '33504100', '1.500', 'd3040000-0000-4000-8000-000000000003', 'd3030000-0000-4000-8000-000000000002', 520000.00, 0, 0, 0, 0, 0),
  (10, 'd3050000-0000-4000-8000-000000000010', 2026, '27', '812', '031', '1083', 'Equipamento de Espaços Esportivos', '44905200', '1.500', 'd3040000-0000-4000-8000-000000000004', 'd3030000-0000-4000-8000-000000000002', 455000.00, 0, 0, 50000.00, 0, 0),
  (11, 'd3050000-0000-4000-8000-000000000011', 2026, '27', '812', '031', '1083', 'Equipamento de Espaços Esportivos', '44905200', '1.700', 'd3040000-0000-4000-8000-000000000004', 'd3030000-0000-4000-8000-000000000002', 812400.00, 0, 0, 0, 0, 0),
  (12, 'd3050000-0000-4000-8000-000000000012', 2026, '27', '813', '032', '2547', 'Ações de Protagonismo Juvenil', '33903900', '1.501', 'd3040000-0000-4000-8000-000000000005', 'd3030000-0000-4000-8000-000000000003', 264000.00, 0, 0, 0, 0, 0),
  (13, 'd3050000-0000-4000-8000-000000000013', 2026, '27', '813', '032', '2547', 'Ações de Protagonismo Juvenil', '33903600', '1.500', 'd3040000-0000-4000-8000-000000000005', 'd3030000-0000-4000-8000-000000000003', 78000.00, 0, 0, 0, 0, 0),
  (21, 'd3050000-0000-4000-8000-000000000021', 2025, '27', '122', '030', '2544', 'Gestão da Política para a Juventude e Desporto', '33904000', '1.500', 'd3040000-0000-4000-8000-000000000006', 'd3030000-0000-4000-8000-000000000004', 60000.00, 0, 0, 0, 0, 0),
  (22, 'd3050000-0000-4000-8000-000000000022', 2025, '27', '122', '030', '2544', 'Gestão da Política para a Juventude e Desporto', '33903900', '1.500', 'd3040000-0000-4000-8000-000000000006', 'd3030000-0000-4000-8000-000000000004', 90000.00, 0, 0, 0, 0, 0);

INSERT INTO public.fin_dotacoes (id, exercicio, unidade_orcamentaria_id, programa_id, acao_id, natureza_despesa_id, fonte_recurso_id,
  codigo_dotacao, valor_inicial, valor_suplementado, valor_reduzido, valor_bloqueado, valor_reserva, valor_ped,
  paoe, regional, cod_acompanhamento, idu, tro, ativo, created_by)
SELECT d.id, d.exercicio, 'a0000000-0000-4000-8000-000000000002', d.programa, d.acao,
       (SELECT n.id FROM public.fin_naturezas_despesa n WHERE regexp_replace(n.codigo, '\D', '', 'g') = left(d.nat, 6)),
       (SELECT f.id FROM public.fin_fontes_recurso f WHERE f.codigo = d.fonte),
       concat_ws('.', d.func, d.subf, d.prog, d.paoe, '9900', d.nat, d.fonte, '0000', 'Não'),
       d.inicial, d.supl, d.red, d.bloq, d.reserva, d.ped,
       d.paoe || ' - ' || d.paoe_nome, '9900', '0000', 'Não', 'No', true, auth.uid()
FROM _dot d;

-- ===================================================================== credores (fornecedores com código do FIPLAN)
INSERT INTO public.fornecedores (id, tipo_pessoa, cpf_cnpj, razao_social, nome_fantasia, inscricao_estadual,
  endereco_logradouro, endereco_numero, endereco_bairro, endereco_cidade, endereco_uf, endereco_cep,
  telefone, email, representante_nome, banco_codigo, banco_nome, agencia, conta, tipo_conta, codigo_credor_fiplan, ativo) VALUES
  ('d3060000-0000-4000-8000-000000000001', 'PJ', pg_temp.cnpj('418265730001'), 'Norte Sports Comércio de Artigos Esportivos Ltda', 'Norte Sports', '24.017.552-3',
   'Av. Ville Roy', '1874', 'Centro', 'Boa Vista', 'RR', '69301-000', '(95) 98112-4570', 'licitacao@nortesports.exemplo.test', 'Gilmar Souza Pinheiro', '001', 'Banco do Brasil S.A.', '2617-6', '31452-0', 'corrente', '2001.00412-7', true),
  ('d3060000-0000-4000-8000-000000000002', 'PJ', pg_temp.cnpj('372904150001'), 'Pódio Troféus e Medalhas Ltda', 'Pódio Troféus', '24.011.873-0',
   'Rua Cecília Brasil', '512', 'São Francisco', 'Boa Vista', 'RR', '69305-090', '(95) 99135-2208', 'vendas@podiotrofeus.exemplo.test', 'Valdirene Matos Arruda', '001', 'Banco do Brasil S.A.', '3170-6', '20871-2', 'corrente', '2001.00415-1', true),
  ('d3060000-0000-4000-8000-000000000003', 'PJ', pg_temp.cnpj('290837610001'), 'Caburaí Eventos e Estruturas Ltda', 'Caburaí Eventos', '24.009.114-8',
   'Rua Pedro Rodrigues', '2290', 'Mecejana', 'Boa Vista', 'RR', '69304-350', '(95) 98404-7731', 'comercial@caburaieventos.exemplo.test', 'Ednaldo Ferreira Lustosa', '104', 'Caixa Econômica Federal', '0587', '1043-8', 'corrente', '2001.00398-0', true),
  ('d3060000-0000-4000-8000-000000000004', 'PJ', pg_temp.cnpj('155209480001'), 'Monte Roraima Transportes e Turismo Ltda', 'Monte Roraima Turismo', '24.003.442-1',
   'Av. Venezuela', '3051', 'Pricumã', 'Boa Vista', 'RR', '69309-695', '(95) 99128-0456', 'frota@monteroraimatur.exemplo.test', 'Josias Almeida Brandão', '001', 'Banco do Brasil S.A.', '2617-6', '28013-5', 'corrente', '2001.00377-8', true),
  ('d3060000-0000-4000-8000-000000000005', 'PJ', pg_temp.cnpj('331748020001'), 'Tepequém Tecnologia e Serviços de Informática Ltda', 'Tepequém Tecnologia', '24.012.660-5',
   'Rua Professor Diomedes Souto Maior', '87', 'Caçari', 'Boa Vista', 'RR', '69307-275', '(95) 98117-3390', 'contratos@tepequemtec.exemplo.test', 'Hudson Carvalho Neri', '001', 'Banco do Brasil S.A.', '4130-2', '13385-6', 'corrente', '2001.00290-3', true),
  ('d3060000-0000-4000-8000-000000000006', 'PJ', pg_temp.cnpj('402116590001'), 'Lavrado Refeições Coletivas Ltda', 'Lavrado Refeições', '24.016.201-7',
   'Rua Uraricoera', '1440', 'São Vicente', 'Boa Vista', 'RR', '69303-470', '(95) 99172-6045', 'financeiro@lavradorefeicoes.exemplo.test', 'Marlene Siqueira Bento', '237', 'Banco Bradesco S.A.', '3401-2', '0088271-4', 'corrente', '2001.00421-6', true),
  ('d3060000-0000-4000-8000-000000000007', 'PJ', pg_temp.cnpj('053611270001'), 'Federação Roraimense de Atletismo', 'FRA', NULL,
   'Av. Brigadeiro Eduardo Gomes', '2615', 'Aeroporto', 'Boa Vista', 'RR', '69310-005', '(95) 98126-1180', 'secretaria@fra.exemplo.test', 'Osmar Pacheco Lima', '001', 'Banco do Brasil S.A.', '2617-6', '17208-1', 'corrente', '2001.00133-9', true),
  ('d3060000-0000-4000-8000-000000000008', 'PJ', pg_temp.cnpj('214508830001'), 'Associação Desportiva Juventude do Cauamé', 'ADJC', NULL,
   'Rua Raimundo Penafort', '330', 'Cauamé', 'Boa Vista', 'RR', '69314-160', '(95) 99141-8892', 'contato@adjc.exemplo.test', 'Francisca das Chagas Prado', '001', 'Banco do Brasil S.A.', '3170-6', '35590-1', 'corrente', '2001.00502-4', true),
  ('d3060000-0000-4000-8000-000000000009', 'PJ', pg_temp.cnpj('276330140001'), 'Uraricoera Serviços Gráficos Ltda', 'Gráfica Uraricoera', '24.008.391-9',
   'Av. Glaycon de Paiva', '965', 'Mecejana', 'Boa Vista', 'RR', '69304-525', '(95) 98113-5017', 'orcamento@graficauraricoera.exemplo.test', 'Wanderley Paiva Rocha', '001', 'Banco do Brasil S.A.', '4130-2', '9817-X', 'corrente', '2001.00266-2', true),
  ('d3060000-0000-4000-8000-000000000010', 'PF', pg_temp.cpf('468201937'), 'Raimundo Nonato Brito Cavalcante', NULL, NULL,
   'Rua Pará', '418', 'Liberdade', 'Boa Vista', 'RR', '69309-310', '(95) 99153-2714', 'raimundo.arbitro@exemplo.test', NULL, '001', 'Banco do Brasil S.A.', '2617-6', '40112-3', 'corrente', '2001.00618-5', true),
  ('d3060000-0000-4000-8000-000000000011', 'PJ', pg_temp.cnpj('446720910001'), 'Amazônia Equipamentos Esportivos Ltda', 'Amazônia Equipamentos', '04.288.017-6',
   'Av. Torquato Tapajós', '7120', 'Flores', 'Manaus', 'AM', '69058-830', '(92) 98245-1163', 'governo@amazoniaequip.exemplo.test', 'Cleberson Tavares Lima', '001', 'Banco do Brasil S.A.', '3563-9', '108452-7', 'corrente', '2001.00433-1', true),
  ('d3060000-0000-4000-8000-000000000012', 'PJ', pg_temp.cnpj('389615040001'), 'Vida Remoções e Atendimento Pré-Hospitalar Ltda', 'Vida Remoções', '24.014.075-2',
   'Rua Coronel Pinto', '1009', 'Centro', 'Boa Vista', 'RR', '69301-150', '(95) 98408-6621', 'adm@vidaremocoes.exemplo.test', 'Dra. Simone Arantes Queiroz', '001', 'Banco do Brasil S.A.', '2617-6', '33017-7', 'corrente', '2001.00459-8', true),
  ('d3060000-0000-4000-8000-000000000013', 'PJ', pg_temp.cnpj('198847260001'), 'Rota Norte Agência de Viagens e Turismo Ltda', 'Rota Norte Viagens', '24.005.716-4',
   'Av. Jaime Brasil', '640', 'Centro', 'Boa Vista', 'RR', '69301-350', '(95) 99105-3348', 'corporativo@rotanorte.exemplo.test', 'Lidiane Coutinho Barros', '001', 'Banco do Brasil S.A.', '2617-6', '25560-2', 'corrente', '2001.00347-6', true);

-- ===================================================================== contas bancárias da autarquia (Banco do Brasil)
INSERT INTO public.fin_contas_bancarias (id, banco_codigo, banco_nome, agencia, agencia_digito, conta, conta_digito, tipo,
  nome_conta, finalidade, fonte_recurso_id, saldo_atual, data_ultimo_saldo, responsavel_id, ativo, created_by) VALUES
  ('d3070000-0000-4000-8000-000000000001', '001', 'Banco do Brasil S.A.', '2617', '6', '11870', '3', 'corrente',
   'Conta Movimento – Recursos do Tesouro', 'Pagamento de fornecedores e prestadores (fontes 1.500 e 1.501), com aplicação automática no BB RF CP Automático',
   'd3010000-0000-4000-8000-000000000001', 1385420.37, '2026-06-30', 'c0000000-0000-4000-8000-000000000007', true, auth.uid()),
  ('d3070000-0000-4000-8000-000000000002', '001', 'Banco do Brasil S.A.', '2617', '6', '12045', '7', 'vinculada',
   'Conta Específica – Convênio nº 912345/2025 (Ministério do Esporte)', 'Movimentação exclusiva dos recursos do convênio federal (fonte 1.700)',
   'd3010000-0000-4000-8000-000000000003', 0, '2026-06-30', 'c0000000-0000-4000-8000-000000000007', true, auth.uid()),
  ('d3070000-0000-4000-8000-000000000003', '001', 'Banco do Brasil S.A.', '2617', '6', '12391', 'X', 'corrente',
   'Conta Suprimento de Fundos', 'Crédito dos suprimentos de fundos concedidos a servidores (cartão e saque)',
   'd3010000-0000-4000-8000-000000000001', 4312.80, '2026-09-30', 'c0000000-0000-4000-8000-000000000010', true, auth.uid()),
  ('d3070000-0000-4000-8000-000000000004', '001', 'Banco do Brasil S.A.', '2617', '6', '12406', '1', 'aplicacao',
   'BB RF CP Automático – Conta Movimento', 'Aplicação automática do saldo da conta movimento',
   'd3010000-0000-4000-8000-000000000001', 1110556.10, '2026-08-31', 'c0000000-0000-4000-8000-000000000007', true, auth.uid());

-- conta pagadora do OBN600 (usada pelas RPCs da remessa)
INSERT INTO public.contas_autarquia (id, banco_id, descricao, agencia, agencia_digito, conta, conta_digito, tipo_conta,
  uso_principal, ativo, nsa_inicial, obn_codigo_cliente, obn_unidade_gestora, obn_gestao)
SELECT 'd3080000-0000-4000-8000-000000000001', b.id, 'BB 2617-6 / 11870-3 – Conta Movimento (pagamento de fornecedores)',
       '2617', '6', '11870', '3', 'corrente', 'fornecedores', true, 37, '173020001', '173020', '00001'
FROM public.bancos_cnab b WHERE b.codigo_banco = '001';

-- ===================================================================== alterações orçamentárias
INSERT INTO public.fin_alteracoes_orcamentarias (id, numero, exercicio, tipo, data_alteracao, dotacao_origem_id, dotacao_destino_id,
  valor, justificativa, fundamentacao_legal, status, aprovado_por, aprovado_em, observacoes, processo_sei, created_by) VALUES
  ('d3170000-0000-4000-8000-000000000001', 'ALT-000001', 2026, 'remanejamento', '2026-04-14', 'd3050000-0000-4000-8000-000000000001', 'd3050000-0000-4000-8000-000000000006',
   40000.00, 'Remanejamento de material de consumo da manutenção da sede para a aquisição de material esportivo e premiação dos Jogos Escolares de Roraima – JER 2026.',
   'Lei Orçamentária Anual 2026, art. 8º, inciso II', 'aprovado', auth.uid(), '2026-04-16 10:20-04', NULL, '18101.000092/2026-31', auth.uid()),
  ('d3170000-0000-4000-8000-000000000002', 'ALT-000002', 2026, 'suplementacao', '2026-05-22', NULL, 'd3050000-0000-4000-8000-000000000007',
   120000.00, 'Suplementação por superávit financeiro do exercício anterior para cobrir a locação de estruturas e o transporte das delegações da fase estadual do JER 2026.',
   'Lei nº 4.320/1964, art. 43, § 1º, inciso I; Decreto de abertura de crédito suplementar', 'aprovado', auth.uid(), '2026-05-26 15:02-04', NULL, '18101.000171/2026-09', auth.uid()),
  ('d3170000-0000-4000-8000-000000000003', 'ALT-000003', 2026, 'transposicao', '2026-07-09', 'd3050000-0000-4000-8000-000000000005', 'd3050000-0000-4000-8000-000000000004',
   15000.00, 'Transposição de passagens para diárias: deslocamentos ao interior passaram a ser feitos por via terrestre com veículos do órgão.',
   'Lei Orçamentária Anual 2026, art. 8º, inciso III', 'aprovado', auth.uid(), '2026-07-10 09:41-04', NULL, '18101.000254/2026-77', auth.uid()),
  ('d3170000-0000-4000-8000-000000000004', 'ALT-000004', 2026, 'reducao', '2026-10-13', 'd3050000-0000-4000-8000-000000000013', NULL,
   10000.00, 'Redução de saldo sem previsão de uso em serviços de pessoa física até o fim do exercício, para recompor a cota financeira.',
   'Decreto de programação financeira 2026', 'pendente_analise', NULL, NULL, 'Aguardando parecer da Diretoria Administrativa e Financeira.', '18101.000356/2026-12', auth.uid()),
  ('d3170000-0000-4000-8000-000000000005', 'ALT-000005', 2026, 'suplementacao', '2026-10-20', NULL, 'd3050000-0000-4000-8000-000000000010',
   60000.00, 'Suplementação para aquisição de equipamentos dos ginásios estaduais por excesso de arrecadação de recursos próprios.',
   'Lei nº 4.320/1964, art. 43, § 1º, inciso II', 'rascunho', NULL, NULL, NULL, NULL, auth.uid()),
  ('d3170000-0000-4000-8000-000000000006', 'ALT-000006', 2026, 'remanejamento', '2026-08-18', 'd3050000-0000-4000-8000-000000000003', 'd3050000-0000-4000-8000-000000000002',
   25000.00, 'Remanejamento de serviços de tecnologia da informação para serviços de terceiros pessoa jurídica.',
   'Lei Orçamentária Anual 2026, art. 8º, inciso II', 'rejeitado', NULL, NULL, 'Rejeitado: o saldo de TI está comprometido com a renovação do contrato de suporte.', '18101.000297/2026-40', auth.uid()),
  ('d3170000-0000-4000-8000-000000000007', 'ALT-000007', 2026, 'credito_especial', '2026-06-02', NULL, 'd3050000-0000-4000-8000-000000000008',
   35000.00, 'Abertura de crédito para premiação em dinheiro de atletas destaque do JER 2026.',
   'Lei nº 4.320/1964, art. 41, inciso II', 'cancelado', NULL, NULL, 'Cancelado: a premiação será feita com troféus e medalhas, sem pagamento em dinheiro.', '18101.000203/2026-58', auth.uid());
-- três delas já confirmadas no FIPLAN (a ação "Confirmar no FIPLAN" da tela)
SELECT count(public.confirmar_alteracao_fiplan(id)) AS _n FROM public.fin_alteracoes_orcamentarias
 WHERE id IN ('d3170000-0000-4000-8000-000000000001', 'd3170000-0000-4000-8000-000000000002', 'd3170000-0000-4000-8000-000000000003') \gset
UPDATE public.fin_alteracoes_orcamentarias SET confirmado_fiplan_em = aprovado_em + interval '1 day'
 WHERE situacao_fiplan = 'confirmada' AND id::text LIKE 'd317%';

-- ===================================================================== solicitações de despesa (com itens e checklist do controle interno)
INSERT INTO public.fin_solicitacoes (id, numero, exercicio, data_solicitacao, unidade_solicitante_id, servidor_solicitante_id, tipo_despesa,
  objeto, justificativa, valor_estimado, dotacao_sugerida_id, fornecedor_id, status, prioridade, prazo_execucao,
  parecer_ci, ci_aprovado_por, ci_aprovado_em, autorizado_por, autorizado_em, motivo_rejeicao, observacoes, created_by) VALUES
  ('d3090000-0000-4000-8000-000000000001', 'SOL-0004/2026', 2026, '2026-04-22', 'a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000013', 'material',
   'Aquisição de troféus e medalhas para os Jogos Escolares de Roraima – JER 2026', 'Premiação das modalidades coletivas e individuais das etapas municipais e da fase estadual do JER 2026, conforme regulamento geral.',
   48750.00, 'd3050000-0000-4000-8000-000000000006', 'd3060000-0000-4000-8000-000000000002', 'executado', 'alta', '2026-07-31',
   'Processo instruído com três orçamentos e pesquisa no Painel de Preços. Sem ressalvas.', auth.uid(), '2026-05-05 11:10-04', auth.uid(), '2026-05-08 16:45-04', NULL, NULL, auth.uid()),
  ('d3090000-0000-4000-8000-000000000002', 'SOL-0005/2026', 2026, '2026-05-18', 'a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000004', 'evento',
   'Locação de estrutura de tendas, palco, sonorização e iluminação para as etapas do JER 2026', 'Estrutura para cerimônias de abertura e áreas de competição ao ar livre das etapas de Boa Vista, Rorainópolis e Pacaraima.',
   186420.00, 'd3050000-0000-4000-8000-000000000007', 'd3060000-0000-4000-8000-000000000003', 'executado', 'alta', '2026-11-30',
   'Contratação por adesão à Ata de Registro de Preços nº 011/2025. Sem ressalvas.', auth.uid(), '2026-05-28 09:30-04', auth.uid(), '2026-06-01 14:12-04', NULL, NULL, auth.uid()),
  ('d3090000-0000-4000-8000-000000000003', 'SOL-0007/2026', 2026, '2026-06-08', 'a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000014', 'material',
   'Aquisição de material esportivo para os Núcleos de Esporte Educacional', 'Reposição de bolas, redes, coletes e uniformes dos 14 núcleos em funcionamento na capital e no interior.',
   127365.90, 'd3050000-0000-4000-8000-000000000006', 'd3060000-0000-4000-8000-000000000001', 'executado', 'normal', '2026-09-30',
   'Pregão Eletrônico nº 014/2026 homologado. Sem ressalvas.', auth.uid(), '2026-06-24 10:05-04', auth.uid(), '2026-06-29 17:20-04', NULL, NULL, auth.uid()),
  ('d3090000-0000-4000-8000-000000000004', 'SOL-0009/2026', 2026, '2026-08-19', 'a0000000-0000-4000-8000-000000000007', 'c0000000-0000-4000-8000-000000000008', 'equipamento',
   'Aquisição de placares eletrônicos, tabelas de basquete e traves de futsal para os ginásios estaduais', 'Equipar os ginásios que receberão os jogos da fase estadual e as competições federadas de 2027.',
   238900.00, 'd3050000-0000-4000-8000-000000000010', 'd3060000-0000-4000-8000-000000000011', 'executado', 'normal', '2026-12-15',
   'Adesão à Ata de Registro de Preços nº 007/2026. Recomenda-se conferir a garantia mínima de 12 meses na entrega.', auth.uid(), '2026-09-01 08:50-04', auth.uid(), '2026-09-10 15:33-04', NULL, NULL, auth.uid()),
  ('d3090000-0000-4000-8000-000000000005', 'SOL-0011/2026', 2026, '2026-09-22', 'a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000013', 'material',
   'Aquisição de tatames e colchonetes para as modalidades de lutas', 'Atender aos núcleos de judô e caratê e às seletivas estaduais de lutas previstas para novembro.',
   36400.00, 'd3050000-0000-4000-8000-000000000006', NULL, 'aprovado', 'normal', '2026-11-20',
   'Instrução completa. Aguarda emissão do empenho.', auth.uid(), '2026-10-06 10:00-04', auth.uid(), '2026-10-09 11:25-04', NULL, NULL, auth.uid()),
  ('d3090000-0000-4000-8000-000000000006', 'SOL-0012/2026', 2026, '2026-10-02', 'a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000004', 'servico',
   'Contratação de serviço de cronometragem eletrônica para o Campeonato Estadual de Atletismo', 'Exigência da confederação para homologação de índices técnicos das provas de pista.',
   28000.00, 'd3050000-0000-4000-8000-000000000007', NULL, 'em_analise', 'alta', '2026-11-28',
   NULL, NULL, NULL, NULL, NULL, NULL, 'Em análise no controle interno: falta a pesquisa de preços.', auth.uid()),
  ('d3090000-0000-4000-8000-000000000007', 'SOL-0013/2026', 2026, '2026-10-14', 'a0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000016', 'material',
   'Aquisição de kits de primeiros socorros para os núcleos e eventos da juventude', 'Reposição dos kits utilizados no primeiro semestre.',
   6850.00, 'd3050000-0000-4000-8000-000000000001', NULL, 'pendente_analise', 'normal', '2026-11-30',
   NULL, NULL, NULL, NULL, NULL, NULL, NULL, auth.uid()),
  ('d3090000-0000-4000-8000-000000000008', 'SOL-0014/2026', 2026, '2026-10-21', 'a0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000005', 'servico',
   'Locação de banheiros químicos para o Festival Juventude em Movimento', 'Evento ao ar livre na Praça das Águas com público estimado de 3 mil pessoas.',
   14200.00, 'd3050000-0000-4000-8000-000000000012', NULL, 'rascunho', 'normal', '2026-12-05',
   NULL, NULL, NULL, NULL, NULL, NULL, NULL, auth.uid()),
  ('d3090000-0000-4000-8000-000000000009', 'SOL-0008/2026', 2026, '2026-07-15', 'a0000000-0000-4000-8000-000000000008', 'c0000000-0000-4000-8000-000000000015', 'material',
   'Aquisição de camisetas promocionais para campanha institucional', 'Divulgação das ações do instituto em eventos.',
   22300.00, 'd3050000-0000-4000-8000-000000000001', NULL, 'rejeitado', 'baixa', NULL,
   'Despesa de caráter promocional sem previsão no plano de comunicação aprovado.', NULL, NULL, NULL, NULL,
   'Despesa promocional não prevista no plano de comunicação; reapresentar vinculada a evento específico.', NULL, auth.uid()),
  ('d3090000-0000-4000-8000-000000000010', 'SOL-0010/2026', 2026, '2026-09-03', 'a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000013', 'servico',
   'Locação de ônibus para a seletiva de futebol de areia em Caracaraí', 'Transporte de atletas para a seletiva estadual.',
   9800.00, 'd3050000-0000-4000-8000-000000000007', NULL, 'cancelado', 'normal', NULL,
   NULL, NULL, NULL, NULL, NULL, NULL, 'Cancelada: a seletiva foi transferida para Boa Vista.', auth.uid());

INSERT INTO public.fin_solicitacao_itens (solicitacao_id, item_numero, descricao, unidade, quantidade, valor_unitario_estimado, observacoes) VALUES
  ('d3090000-0000-4000-8000-000000000001', 1, 'Medalha em metal fundido 60 mm, banho ouro, com fita personalizada', 'UN', 1500, 9.85, NULL),
  ('d3090000-0000-4000-8000-000000000001', 2, 'Medalha em metal fundido 60 mm, banho prata, com fita personalizada', 'UN', 1500, 9.85, NULL),
  ('d3090000-0000-4000-8000-000000000001', 3, 'Medalha em metal fundido 60 mm, banho bronze, com fita personalizada', 'UN', 1500, 9.85, NULL),
  ('d3090000-0000-4000-8000-000000000001', 4, 'Troféu em resina e metal, 45 cm, com placa gravada', 'UN', 120, 156.875, NULL),
  ('d3090000-0000-4000-8000-000000000005', 1, 'Tatame EVA 1 x 1 m, 40 mm, encaixe tipo quebra-cabeça, dupla face', 'UN', 320, 92.50, 'Cores azul e amarelo'),
  ('d3090000-0000-4000-8000-000000000005', 2, 'Colchonete de ginástica 100 x 60 x 5 cm, courvin', 'UN', 80, 85.00, NULL),
  ('d3090000-0000-4000-8000-000000000006', 1, 'Serviço de cronometragem eletrônica com photo finish, por dia de competição', 'DIA', 4, 7000.00, NULL),
  ('d3090000-0000-4000-8000-000000000007', 1, 'Kit de primeiros socorros em maleta rígida, com 30 itens', 'UN', 50, 137.00, NULL),
  ('d3090000-0000-4000-8000-000000000008', 1, 'Locação de banheiro químico individual, com higienização diária', 'UN/DIA', 40, 355.00, NULL);

INSERT INTO public.fin_checklist_ci (solicitacao_id, item_verificacao, obrigatorio, conforme, observacao, verificado_por, verificado_em)
SELECT s.id, c.item, true, c.conf, c.obs, CASE WHEN c.conf IS NOT NULL THEN auth.uid() END,
       CASE WHEN c.conf IS NOT NULL THEN s.data_solicitacao + 8 + time '10:00' END
FROM (VALUES
  ('d3090000-0000-4000-8000-000000000005'::uuid, 'Documento de formalização da demanda (DFD) juntado ao processo SEI', true, NULL::text),
  ('d3090000-0000-4000-8000-000000000005', 'Pesquisa de preços com no mínimo três fontes', true, 'Painel de Preços e duas cotações'),
  ('d3090000-0000-4000-8000-000000000005', 'Disponibilidade orçamentária na dotação indicada', true, NULL),
  ('d3090000-0000-4000-8000-000000000005', 'Item previsto no Plano de Contratações Anual', true, NULL),
  ('d3090000-0000-4000-8000-000000000006', 'Documento de formalização da demanda (DFD) juntado ao processo SEI', true, NULL),
  ('d3090000-0000-4000-8000-000000000006', 'Pesquisa de preços com no mínimo três fontes', false, 'Só uma cotação no processo'),
  ('d3090000-0000-4000-8000-000000000006', 'Disponibilidade orçamentária na dotação indicada', true, NULL),
  ('d3090000-0000-4000-8000-000000000006', 'Item previsto no Plano de Contratações Anual', NULL, NULL)
) AS c(sol, item, conf, obs)
JOIN public.fin_solicitacoes s ON s.id = c.sol;

-- ===================================================================== empenhos lançados no sistema (número do FIPLAN)
-- O gatilho confere o saldo da dotação e soma o empenhado nela.
CREATE TEMP TABLE _emp (id uuid, numero text, exercicio int, data date, sol uuid, dot uuid, forn uuid, contrato uuid,
  tipo public.tipo_empenho, valor numeric, objeto text, sei text) ON COMMIT DROP;
INSERT INTO _emp VALUES
  ('d3100000-0000-4000-8000-000000000001', '17302.0001.26.00018-4', 2026, '2026-05-12', 'd3090000-0000-4000-8000-000000000001', 'd3050000-0000-4000-8000-000000000006', 'd3060000-0000-4000-8000-000000000002', NULL, 'ordinario', 48750.00,
   'Despesa com aquisição de troféus e medalhas para premiação das etapas municipais e da fase estadual dos Jogos Escolares de Roraima – JER 2026, conforme processo SEI 18101.000245/2026-11', '18101.000245/2026-11'),
  ('d3100000-0000-4000-8000-000000000002', '17302.0001.26.00031-2', 2026, '2026-06-03', 'd3090000-0000-4000-8000-000000000002', 'd3050000-0000-4000-8000-000000000007', 'd3060000-0000-4000-8000-000000000003', NULL, 'estimativo', 186420.00,
   'Despesa com locação de estrutura de tendas, palco, sonorização e iluminação para as etapas dos Jogos Escolares de Roraima – JER 2026, conforme Ata de Registro de Preços nº 011/2025 e processo SEI 18101.000198/2026-40', '18101.000198/2026-40'),
  ('d3100000-0000-4000-8000-000000000003', '17302.0001.26.00027-5', 2026, '2026-05-20', NULL, 'd3050000-0000-4000-8000-000000000007', 'd3060000-0000-4000-8000-000000000004', NULL, 'estimativo', 92300.00,
   'Despesa com locação de ônibus com motorista para transporte das delegações municipais aos Jogos Escolares de Roraima – JER 2026, conforme processo SEI 18101.000187/2026-02', '18101.000187/2026-02'),
  ('d3100000-0000-4000-8000-000000000004', '17302.0001.26.00009-1', 2026, '2026-02-10', NULL, 'd3050000-0000-4000-8000-000000000003', 'd3060000-0000-4000-8000-000000000005', NULL, 'global', 74880.00,
   'Despesa com prestação de serviços continuados de suporte técnico, manutenção de rede lógica e estações de trabalho da sede, período de janeiro a dezembro de 2026, conforme Contrato nº 004/2026 e processo SEI 18101.000041/2026-77', '18101.000041/2026-77'),
  ('d3100000-0000-4000-8000-000000000005', '17302.0001.26.00036-3', 2026, '2026-06-15', NULL, 'd3050000-0000-4000-8000-000000000007', 'd3060000-0000-4000-8000-000000000006', NULL, 'estimativo', 63540.00,
   'Despesa com fornecimento de refeições (almoço e jantar) para atletas e equipes de arbitragem alojados durante os Jogos Escolares de Roraima – JER 2026, conforme processo SEI 18101.000212/2026-19', '18101.000212/2026-19'),
  ('d3100000-0000-4000-8000-000000000006', '17302.0001.26.00044-8', 2026, '2026-07-02', 'd3090000-0000-4000-8000-000000000003', 'd3050000-0000-4000-8000-000000000006', 'd3060000-0000-4000-8000-000000000001', NULL, 'ordinario', 127365.90,
   'Despesa com aquisição de material esportivo (bolas oficiais, redes, coletes e uniformes) para os Núcleos de Esporte Educacional, conforme Pregão Eletrônico nº 014/2026 e processo SEI 18101.000233/2026-58', '18101.000233/2026-58'),
  ('d3100000-0000-4000-8000-000000000007', '17302.0001.26.00052-6', 2026, '2026-08-11', NULL, 'd3050000-0000-4000-8000-000000000002', 'd3060000-0000-4000-8000-000000000009', NULL, 'ordinario', 18640.00,
   'Despesa com serviços gráficos de impressão de banners, faixas e certificados para os eventos esportivos do segundo semestre, conforme processo SEI 18101.000301/2026-21', '18101.000301/2026-21'),
  ('d3100000-0000-4000-8000-000000000008', '17302.0001.26.00058-0', 2026, '2026-09-14', 'd3090000-0000-4000-8000-000000000004', 'd3050000-0000-4000-8000-000000000010', 'd3060000-0000-4000-8000-000000000011', NULL, 'ordinario', 238900.00,
   'Despesa com aquisição de placares eletrônicos, tabelas de basquete e traves de futsal para os ginásios estaduais, conforme Ata de Registro de Preços nº 007/2026 e processo SEI 18101.000344/2026-90', '18101.000344/2026-90'),
  ('d3100000-0000-4000-8000-000000000009', '17302.0001.26.00023-9', 2026, '2026-04-28', NULL, 'd3050000-0000-4000-8000-000000000009', 'd3060000-0000-4000-8000-000000000007', NULL, 'ordinario', 133000.00,
   'Despesa com repasse de recursos à Federação Roraimense de Atletismo para realização do Campeonato Estadual de Atletismo 2026, conforme Termo de Fomento nº 003/2026 e processo SEI 18101.000156/2026-63', '18101.000156/2026-63'),
  ('d3100000-0000-4000-8000-000000000010', '17302.0001.26.00040-7', 2026, '2026-06-25', NULL, 'd3050000-0000-4000-8000-000000000007', 'd3060000-0000-4000-8000-000000000012', NULL, 'ordinario', 27600.00,
   'Despesa com serviço de ambulância com equipe de atendimento pré-hospitalar para os locais de competição dos Jogos Escolares de Roraima – JER 2026, conforme processo SEI 18101.000221/2026-05', '18101.000221/2026-05'),
  ('d3100000-0000-4000-8000-000000000011', '17302.0001.26.00047-2', 2026, '2026-07-21', NULL, 'd3050000-0000-4000-8000-000000000013', 'd3060000-0000-4000-8000-000000000010', NULL, 'ordinario', 4800.00,
   'Despesa com prestação de serviços de arbitragem nas finais do Campeonato Estadual de Futsal Sub-17, conforme processo SEI 18101.000268/2026-34', '18101.000268/2026-34'),
  ('d3100000-0000-4000-8000-000000000012', '17302.0001.26.00049-9', 2026, '2026-07-29', NULL, 'd3050000-0000-4000-8000-000000000007', 'd3060000-0000-4000-8000-000000000003', NULL, 'ordinario', 21300.00,
   'Despesa com locação de sonorização e iluminação para o Festival Juventude em Movimento, conforme processo SEI 18101.000279/2026-85', '18101.000279/2026-85'),
  ('d3100000-0000-4000-8000-000000000013', '17302.0001.26.00055-3', 2026, '2026-09-03', NULL, 'd3050000-0000-4000-8000-000000000011', 'd3060000-0000-4000-8000-000000000011', NULL, 'ordinario', 412700.00,
   'Despesa com aquisição de equipamentos esportivos para implantação do Núcleo de Esporte Educacional, objeto do Convênio nº 912345/2025 celebrado com o Ministério do Esporte, conforme processo SEI 18101.000322/2026-14', '18101.000322/2026-14'),
  ('d3100000-0000-4000-8000-000000000014', '17302.0001.26.00061-0', 2026, '2026-10-05', NULL, 'd3050000-0000-4000-8000-000000000012', 'd3060000-0000-4000-8000-000000000008', NULL, 'ordinario', 48000.00,
   'Despesa com contratação de oficinas de protagonismo juvenil (dança urbana, grafite e audiovisual) nos bairros da zona oeste de Boa Vista, conforme processo SEI 18101.000338/2026-46', '18101.000338/2026-46'),
  -- exercício 2025 (viram restos a pagar em 2026)
  ('d3100000-0000-4000-8000-000000000021', '17302.0001.25.00004-6', 2025, '2025-12-29', NULL, 'd3050000-0000-4000-8000-000000000021', 'd3060000-0000-4000-8000-000000000005', NULL, 'ordinario', 18300.00,
   'Despesa com aquisição de licenças de software de escritório e antivírus para as estações de trabalho da sede, conforme processo SEI 18101.000012/2025-30', '18101.000012/2025-30'),
  ('d3100000-0000-4000-8000-000000000022', '17302.0001.25.00006-2', 2025, '2025-12-30', NULL, 'd3050000-0000-4000-8000-000000000022', 'd3060000-0000-4000-8000-000000000003', NULL, 'ordinario', 42000.00,
   'Despesa com locação de estrutura para a cerimônia de lançamento do calendário esportivo 2026, conforme processo SEI 18101.000019/2025-71', '18101.000019/2025-71'),
  ('d3100000-0000-4000-8000-000000000023', '17302.0001.25.00005-4', 2025, '2025-12-29', NULL, 'd3050000-0000-4000-8000-000000000022', 'd3060000-0000-4000-8000-000000000004', NULL, 'ordinario', 9600.00,
   'Despesa com locação de veículo tipo van com motorista para apoio à instalação do instituto, conforme processo SEI 18101.000015/2025-93', '18101.000015/2025-93'),
  ('d3100000-0000-4000-8000-000000000024', '17302.0001.25.00007-0', 2025, '2025-12-30', NULL, 'd3050000-0000-4000-8000-000000000022', 'd3060000-0000-4000-8000-000000000009', NULL, 'ordinario', 7450.00,
   'Despesa com confecção de placas de identificação e sinalização visual da sede, conforme processo SEI 18101.000021/2025-48', '18101.000021/2025-48');

INSERT INTO public.fin_empenhos (id, numero, exercicio, data_empenho, solicitacao_id, dotacao_id, fornecedor_id, contrato_id, tipo,
  natureza_despesa_id, fonte_recurso_id, valor_empenhado, objeto, processo_sei, status, emitido_por, created_by)
SELECT e.id, e.numero, e.exercicio, e.data, e.sol, e.dot, e.forn, e.contrato, e.tipo, d.natureza_despesa_id, d.fonte_recurso_id,
       e.valor, e.objeto, e.sei, 'emitido', auth.uid(), auth.uid()
FROM _emp e JOIN public.fin_dotacoes d ON d.id = e.dot
ORDER BY e.data;

-- ===================================================================== reforço e anulação de empenho
-- BUG do sistema: fn_atualizar_saldo_sub_empenho (gatilho trg_sub_empenho_saldo) faz UPDATE de fin_empenhos.saldo_liquidar,
-- coluna gerada, e todo INSERT em fin_sub_empenhos falha ("column saldo_liquidar can only be updated to DEFAULT").
-- O gatilho fica desligado só aqui e o efeito dele é aplicado à mão (reforço: soma no empenhado, e o gatilho do empenho
-- leva à dotação; anulação: soma no anulado e devolve o saldo à dotação).
ALTER TABLE public.fin_sub_empenhos DISABLE TRIGGER trg_sub_empenho_saldo;
INSERT INTO public.fin_sub_empenhos (id, empenho_id, numero, tipo, valor, data_registro, justificativa, documento_referencia, status, observacoes, created_by) VALUES
  ('d3110000-0000-4000-8000-000000000001', 'd3100000-0000-4000-8000-000000000005', '17302.0001.26.00036-3-R01', 'reforco', 15000.00, '2026-08-20',
   'Reforço para atender ao aumento de delegações inscritas na fase estadual do JER 2026 (de 18 para 23 municípios participantes).', 'Despacho DIESP de 19/08/2026', 'ativo', NULL, auth.uid()),
  ('d3110000-0000-4000-8000-000000000002', 'd3100000-0000-4000-8000-000000000003', '17302.0001.26.00027-5-A01', 'anulacao', 12000.00, '2026-09-30',
   'Anulação parcial: a etapa de Pacaraima foi atendida com transporte cedido pela prefeitura, sem uso dos ônibus contratados.', 'EST 17302.0001.26.00089-1', 'ativo', NULL, auth.uid()),
  ('d3110000-0000-4000-8000-000000000003', 'd3100000-0000-4000-8000-000000000012', '17302.0001.26.00049-9-A01', 'anulacao', 21300.00, '2026-08-26',
   'Anulação total: Festival Juventude em Movimento cancelado por decisão da Diretoria de Juventude, sem prestação do serviço.', 'EST 17302.0001.26.00071-9', 'ativo', NULL, auth.uid()),
  ('d3110000-0000-4000-8000-000000000004', 'd3100000-0000-4000-8000-000000000004', '17302.0001.26.00009-1-R01', 'reforco', 6240.00, '2026-09-15',
   'Reforço para cobrir a 13ª parcela do contrato de suporte técnico (prorrogação até janeiro/2027).', NULL, 'cancelado',
   'Lançado por engano: a prorrogação será empenhada no exercício de 2027.', auth.uid());
ALTER TABLE public.fin_sub_empenhos ENABLE TRIGGER trg_sub_empenho_saldo;
UPDATE public.fin_empenhos e SET valor_empenhado = e.valor_empenhado + s.valor, updated_at = now()
  FROM public.fin_sub_empenhos s WHERE s.empenho_id = e.id AND s.tipo = 'reforco' AND s.status = 'ativo' AND s.id::text LIKE 'd311%';
UPDATE public.fin_empenhos e SET valor_anulado = COALESCE(e.valor_anulado, 0) + s.valor, updated_at = now()
  FROM public.fin_sub_empenhos s WHERE s.empenho_id = e.id AND s.tipo = 'anulacao' AND s.status = 'ativo' AND s.id::text LIKE 'd311%';
UPDATE public.fin_dotacoes d SET valor_empenhado = d.valor_empenhado - a.total, updated_at = now()
  FROM (SELECT e.dotacao_id, sum(s.valor) AS total
          FROM public.fin_sub_empenhos s JOIN public.fin_empenhos e ON e.id = s.empenho_id
         WHERE s.tipo = 'anulacao' AND s.status = 'ativo' AND s.id::text LIKE 'd311%'
         GROUP BY e.dotacao_id) a
 WHERE d.id = a.dotacao_id;
UPDATE public.fin_empenhos SET status = 'anulado' WHERE id = 'd3100000-0000-4000-8000-000000000012';
-- registro de anulação (fin_empenho_anulacoes: nenhuma tela lê hoje; espelha as anulações acima)
INSERT INTO public.fin_empenho_anulacoes (empenho_id, numero, data_anulacao, valor, motivo, anulado_por) VALUES
  ('d3100000-0000-4000-8000-000000000003', '26.00089-1', '2026-09-30', 12000.00, 'Etapa de Pacaraima atendida com transporte cedido pela prefeitura.', auth.uid()),
  ('d3100000-0000-4000-8000-000000000012', '26.00071-9', '2026-08-26', 21300.00, 'Festival Juventude em Movimento cancelado.', auth.uid());

-- ===================================================================== liquidações (a aprovada soma no empenho e na dotação pelo gatilho)
CREATE TEMP TABLE _liq (id uuid, numero text, exercicio int, data date, emp uuid, tipo text, doc text, serie text, data_doc date,
  chave text, valor numeric, inss numeric, irrf numeric, iss numeric, status public.status_liquidacao, obs text) ON COMMIT DROP;
INSERT INTO _liq VALUES
  ('d3130000-0000-4000-8000-000000000001', '26.00058-1', 2026, '2026-07-28', 'd3100000-0000-4000-8000-000000000001', 'nota_fiscal', '1832', '1', '2026-07-24', '14260741826573000155550010000018321904417726', 48750.00, 0, 585.00, 0, 'aprovada', 'Material entregue e conferido pela comissão de recebimento em 27/07/2026.'),
  ('d3130000-0000-4000-8000-000000000002', '26.00079-4', 2026, '2026-08-29', 'd3100000-0000-4000-8000-000000000002', 'nota_fiscal', '457', 'NFS-e', '2026-08-26', NULL, 82360.00, 0, 3953.28, 4118.00, 'aprovada', 'Etapas de Boa Vista e Rorainópolis (agosto/2026).'),
  ('d3130000-0000-4000-8000-000000000003', '26.00118-9', 2026, '2026-10-08', 'd3100000-0000-4000-8000-000000000002', 'nota_fiscal', '611', 'NFS-e', '2026-10-05', NULL, 61940.00, 0, 2973.12, 3097.00, 'aprovada', 'Fase estadual do JER 2026 (setembro/2026).'),
  ('d3130000-0000-4000-8000-000000000004', '26.00064-6', 2026, '2026-08-05', 'd3100000-0000-4000-8000-000000000003', 'nota_fiscal', '1124', 'NFS-e', '2026-08-03', NULL, 38915.40, 0, 0, 1945.77, 'aprovada', 'Transporte das delegações – etapas municipais de julho/2026.'),
  ('d3130000-0000-4000-8000-000000000005', '26.00049-2', 2026, '2026-07-06', 'd3100000-0000-4000-8000-000000000004', 'nota_fiscal', '3301', 'NFS-e', '2026-07-02', NULL, 6240.00, 0, 299.52, 312.00, 'aprovada', 'Parcela de junho/2026.'),
  ('d3130000-0000-4000-8000-000000000006', '26.00066-2', 2026, '2026-08-06', 'd3100000-0000-4000-8000-000000000004', 'nota_fiscal', '3378', 'NFS-e', '2026-08-03', NULL, 6240.00, 0, 299.52, 312.00, 'aprovada', 'Parcela de julho/2026.'),
  ('d3130000-0000-4000-8000-000000000007', '26.00091-3', 2026, '2026-09-04', 'd3100000-0000-4000-8000-000000000004', 'nota_fiscal', '3442', 'NFS-e', '2026-09-02', NULL, 6240.00, 0, 299.52, 312.00, 'aprovada', 'Parcela de agosto/2026.'),
  ('d3130000-0000-4000-8000-000000000008', '26.00114-6', 2026, '2026-10-06', 'd3100000-0000-4000-8000-000000000004', 'nota_fiscal', '3519', 'NFS-e', '2026-10-02', NULL, 6240.00, 0, 299.52, 312.00, 'atestada', 'Parcela de setembro/2026; atestada pelo fiscal, aguarda aprovação.'),
  ('d3130000-0000-4000-8000-000000000009', '26.00095-6', 2026, '2026-09-10', 'd3100000-0000-4000-8000-000000000005', 'nota_fiscal', '9087', '1', '2026-09-08', '14260940211659000172550010000090871503928841', 41280.00, 0, 495.36, 0, 'aprovada', '3.440 refeições servidas na fase estadual (atestado de execução anexo ao SEI).'),
  ('d3130000-0000-4000-8000-000000000010', '26.00104-9', 2026, '2026-09-25', 'd3100000-0000-4000-8000-000000000006', 'nota_fiscal', '21774', '1', '2026-09-22', '14260941826573000155550010000217741671036250', 127365.90, 0, 1528.39, 0, 'aprovada', 'Entrega integral conferida pelo almoxarifado.'),
  ('d3130000-0000-4000-8000-000000000011', '26.00121-9', 2026, '2026-10-19', 'd3100000-0000-4000-8000-000000000007', 'nota_fiscal', '4410', '1', '2026-10-16', '14261027633014000183550010000044101288310457', 18640.00, 0, 223.68, 0, 'pendente', 'Aguardando atesto do fiscal (Diretoria de Esporte).'),
  ('d3130000-0000-4000-8000-000000000012', '26.00051-4', 2026, '2026-07-08', 'd3100000-0000-4000-8000-000000000009', 'recibo', '012/2026', NULL, '2026-07-07', NULL, 66500.00, 0, 0, 0, 'aprovada', '1ª parcela do Termo de Fomento nº 003/2026.'),
  ('d3130000-0000-4000-8000-000000000013', '26.00087-5', 2026, '2026-09-02', 'd3100000-0000-4000-8000-000000000010', 'nota_fiscal', '789', 'NFS-e', '2026-08-31', NULL, 27600.00, 0, 1324.80, 1380.00, 'aprovada', 'Atendimento em 12 dias de competição.'),
  ('d3130000-0000-4000-8000-000000000014', '26.00062-0', 2026, '2026-08-03', 'd3100000-0000-4000-8000-000000000011', 'recibo', 'RPA 027/2026', NULL, '2026-07-31', NULL, 4800.00, 528.00, 0, 240.00, 'aprovada', 'Arbitragem de 6 partidas (semifinais e finais).'),
  ('d3130000-0000-4000-8000-000000000015', '26.00110-3', 2026, '2026-10-02', 'd3100000-0000-4000-8000-000000000007', 'nota_fiscal', '4387', '1', '2026-09-30', NULL, 18640.00, 0, 223.68, 0, 'rejeitada', NULL),
  ('d3130000-0000-4000-8000-000000000016', '26.00083-2', 2026, '2026-08-25', 'd3100000-0000-4000-8000-000000000005', 'nota_fiscal', '9031', '1', '2026-08-22', NULL, 12840.00, 0, 154.08, 0, 'cancelada', 'Lançada em duplicidade com a NF 9087.'),
  ('d3130000-0000-4000-8000-000000000021', '25.00211-3', 2025, '2025-12-30', 'd3100000-0000-4000-8000-000000000021', 'nota_fiscal', '2981', 'NFS-e', '2025-12-30', NULL, 18300.00, 0, 878.40, 915.00, 'aprovada', 'Licenças instaladas e ativadas em 30/12/2025.'),
  ('d3130000-0000-4000-8000-000000000022', '25.00214-8', 2025, '2025-12-30', 'd3100000-0000-4000-8000-000000000024', 'nota_fiscal', '612', '1', '2025-12-30', NULL, 7450.00, 0, 89.40, 0, 'aprovada', 'Placas instaladas na sede.');

-- BUG do sistema: fn_atualizar_empenho_liquidacao (gatilho trg_atualizar_empenho_liquidacao) monta o novo status do
-- empenho com CASE de texto sem cast para status_empenho, e todo INSERT de liquidação já 'aprovada' falha ("column status
-- is of type status_empenho but expression is of type text"). Além disso, o corpo só trata INSERT: aprovar depois (UPDATE)
-- não soma nada no empenho. O gatilho fica desligado aqui e o efeito (empenho e dotação) é aplicado à mão logo abaixo.
ALTER TABLE public.fin_liquidacoes DISABLE TRIGGER trg_atualizar_empenho_liquidacao;
INSERT INTO public.fin_liquidacoes (id, numero, exercicio, data_liquidacao, empenho_id, tipo_documento, numero_documento, serie_documento,
  data_documento, chave_nfe, valor_documento, valor_liquidado, valor_retencoes, retencao_inss, retencao_irrf, retencao_iss, outras_retencoes,
  atestado_por, atestado_em, cargo_atestante, status, aprovado_por, aprovado_em, motivo_rejeicao, observacoes, created_by)
SELECT l.id, l.numero, l.exercicio, l.data, l.emp, l.tipo, l.doc, l.serie, l.data_doc, l.chave, l.valor, l.valor,
       l.inss + l.irrf + l.iss, l.inss, l.irrf, l.iss, 0,
       CASE WHEN l.status <> 'pendente' THEN auth.uid() END,
       CASE WHEN l.status <> 'pendente' THEN l.data - 1 + time '15:30' END,
       CASE WHEN l.status <> 'pendente' THEN 'Fiscal do contrato' END,
       l.status,
       CASE WHEN l.status = 'aprovada' THEN auth.uid() END,
       CASE WHEN l.status = 'aprovada' THEN l.data + time '11:00' END,
       CASE WHEN l.status = 'rejeitada' THEN 'Nota fiscal emitida com CNPJ de filial diferente do credor do empenho; solicitada carta de correção.' END,
       l.obs, auth.uid()
FROM _liq l ORDER BY l.data;
ALTER TABLE public.fin_liquidacoes ENABLE TRIGGER trg_atualizar_empenho_liquidacao;
UPDATE public.fin_empenhos e
   SET valor_liquidado = e.valor_liquidado + a.total,
       status = (CASE WHEN e.valor_liquidado + a.total >= e.valor_empenhado - COALESCE(e.valor_anulado, 0)
                      THEN 'liquidado' ELSE 'parcialmente_liquidado' END)::public.status_empenho,
       updated_at = now()
  FROM (SELECT empenho_id, sum(valor_liquidado) AS total FROM public.fin_liquidacoes
         WHERE status = 'aprovada' AND id::text LIKE 'd313%' GROUP BY empenho_id) a
 WHERE e.id = a.empenho_id;
UPDATE public.fin_dotacoes d SET valor_liquidado = d.valor_liquidado + a.total, updated_at = now()
  FROM (SELECT e.dotacao_id, sum(l.valor_liquidado) AS total
          FROM public.fin_liquidacoes l JOIN public.fin_empenhos e ON e.id = l.empenho_id
         WHERE l.status = 'aprovada' AND l.id::text LIKE 'd313%' GROUP BY e.dotacao_id) a
 WHERE d.id = a.dotacao_id;

-- ===================================================================== pagamentos (nascem programados; a baixa vem do retorno do banco)
CREATE TEMP TABLE _pag (id uuid, numero text, data date, liq uuid, status public.status_pagamento, obs text) ON COMMIT DROP;
INSERT INTO _pag VALUES
  ('d3140000-0000-4000-8000-000000000001', 'OP-000001', '2026-07-14', 'd3130000-0000-4000-8000-000000000005', 'programado', 'NOB 17302.0001.26.00071-2 – RE 17302.0001.26.00015-1'),
  ('d3140000-0000-4000-8000-000000000002', 'OP-000002', '2026-07-14', 'd3130000-0000-4000-8000-000000000012', 'programado', 'NOB 17302.0001.26.00072-0 – RE 17302.0001.26.00015-1'),
  ('d3140000-0000-4000-8000-000000000003', 'OP-000003', '2026-08-12', 'd3130000-0000-4000-8000-000000000001', 'programado', 'NOB 17302.0001.26.00109-4 – RE 17302.0001.26.00019-4'),
  ('d3140000-0000-4000-8000-000000000004', 'OP-000004', '2026-08-12', 'd3130000-0000-4000-8000-000000000004', 'programado', 'NOB 17302.0001.26.00110-8 – RE 17302.0001.26.00019-4'),
  ('d3140000-0000-4000-8000-000000000005', 'OP-000005', '2026-08-12', 'd3130000-0000-4000-8000-000000000006', 'programado', 'NOB 17302.0001.26.00111-6 – RE 17302.0001.26.00019-4'),
  ('d3140000-0000-4000-8000-000000000006', 'OP-000006', '2026-08-12', 'd3130000-0000-4000-8000-000000000014', 'programado', 'NOB 17302.0001.26.00112-4 – RE 17302.0001.26.00019-4'),
  ('d3140000-0000-4000-8000-000000000007', 'OP-000007', '2026-09-16', 'd3130000-0000-4000-8000-000000000002', 'programado', 'NOB 17302.0001.26.00150-7 – RE 17302.0001.26.00024-0'),
  ('d3140000-0000-4000-8000-000000000008', 'OP-000008', '2026-09-16', 'd3130000-0000-4000-8000-000000000007', 'programado', 'NOB 17302.0001.26.00151-5 – RE 17302.0001.26.00024-0'),
  ('d3140000-0000-4000-8000-000000000009', 'OP-000009', '2026-09-16', 'd3130000-0000-4000-8000-000000000009', 'programado', 'NOB 17302.0001.26.00152-3 – RE 17302.0001.26.00024-0'),
  ('d3140000-0000-4000-8000-000000000010', 'OP-000010', '2026-09-16', 'd3130000-0000-4000-8000-000000000013', 'programado', 'NOB 17302.0001.26.00153-9 – RE 17302.0001.26.00024-0. OB devolvida pelo banco: conta do credor encerrada; aguardando nova conta para reenvio.'),
  ('d3140000-0000-4000-8000-000000000011', 'OP-000011', current_date, 'd3130000-0000-4000-8000-000000000010', 'autorizado', 'NOB 17302.0001.26.00187-3 – RE 17302.0001.26.00031-7'),
  ('d3140000-0000-4000-8000-000000000012', 'OP-000012', current_date, 'd3130000-0000-4000-8000-000000000003', 'autorizado', 'NOB 17302.0001.26.00188-1 – RE 17302.0001.26.00031-7'),
  ('d3140000-0000-4000-8000-000000000013', 'OP-000013', current_date + 3, 'd3130000-0000-4000-8000-000000000021', 'programado', 'Restos a pagar processados de 2025 – aguardando cota financeira.'),
  ('d3140000-0000-4000-8000-000000000014', 'OP-000014', '2026-09-16', 'd3130000-0000-4000-8000-000000000009', 'cancelado', 'Programado em duplicidade com a OP-000009; cancelado antes da remessa.');

INSERT INTO public.fin_pagamentos (id, numero, exercicio, data_pagamento, liquidacao_id, empenho_id, conta_bancaria_id, fornecedor_id,
  banco_favorecido, agencia_favorecido, conta_favorecido, tipo_conta_favorecido, valor_bruto, valor_retencoes, forma_pagamento,
  status, autorizado_por, autorizado_em, observacoes, created_by)
SELECT p.id, p.numero, 2026, p.data, p.liq, l.empenho_id, 'd3070000-0000-4000-8000-000000000001', e.fornecedor_id,
       f.banco_codigo, f.agencia, f.conta, 'corrente', l.valor_liquidado, l.valor_retencoes, 'ob',
       p.status, CASE WHEN p.status <> 'cancelado' THEN auth.uid() END, CASE WHEN p.status <> 'cancelado' THEN p.data - 1 + time '16:00' END,
       p.obs, auth.uid()
FROM _pag p JOIN public.fin_liquidacoes l ON l.id = p.liq JOIN public.fin_empenhos e ON e.id = l.empenho_id
JOIN public.fornecedores f ON f.id = e.fornecedor_id;

-- ===================================================================== remessas OBN600 (pelas RPCs da tela) e retornos do banco
-- registrar_remessa_obn600 só aceita data de hoje em diante: as três remessas antigas são geradas com a data de hoje e
-- depois recebem a data real (julho, agosto e setembro); a de hoje fica aguardando o retorno do banco.
DO $$
DECLARE
  v_lotes jsonb := '[
    {"data": "2026-07-14", "pags": ["OP-000001", "OP-000002"], "ret": "2026-07-15"},
    {"data": "2026-08-12", "pags": ["OP-000003", "OP-000004", "OP-000005", "OP-000006"], "ret": "2026-08-13"},
    {"data": "2026-09-16", "pags": ["OP-000007", "OP-000008", "OP-000009", "OP-000010"], "ret": "2026-09-17"},
    {"data": null, "pags": ["OP-000011", "OP-000012"], "ret": null}
  ]';
  v_lote jsonb;
  v_ids uuid[];
  v_rem jsonb;
  v_id uuid;
  v_data date;
  v_n int := 0;
  v_linhas jsonb;
  v_res jsonb;
BEGIN
  FOR v_lote IN SELECT value FROM jsonb_array_elements(v_lotes) LOOP
    v_n := v_n + 1;
    SELECT array_agg(p.id ORDER BY p.numero) INTO v_ids
      FROM public.fin_pagamentos p WHERE p.exercicio = 2026 AND p.numero IN (SELECT jsonb_array_elements_text(v_lote->'pags'));
    v_rem := public.registrar_remessa_obn600('d3080000-0000-4000-8000-000000000001', v_ids, current_date,
                                             CASE WHEN v_n = 1 THEN 37 END);
    v_id := (v_rem->>'id')::uuid;
    PERFORM public.confirmar_remessa_bancaria(v_id, pg_temp.sha('OBN600 remessa ' || (v_rem->>'nsa')));
    v_data := (v_lote->>'data')::date;
    IF v_data IS NULL THEN
      CONTINUE;
    END IF;
    UPDATE public.fin_remessas_bancarias
       SET data_pagamento = v_data, data_geracao = v_data - 1 + time '17:42', created_at = v_data - 1 + time '17:42'
     WHERE id = v_id;

    -- retorno do banco (OBN600): pago, ou devolvido para a OB do credor com conta encerrada
    SELECT jsonb_agg(jsonb_build_object(
             'identificador', p.identificador_transacao,
             'favorecido_documento', regexp_replace(f.cpf_cnpj, '\D', '', 'g'),
             'favorecido_nome', upper(f.razao_social),
             'banco', f.banco_codigo, 'agencia', f.agencia, 'conta', f.conta,
             'valor', p.valor_liquido,
             'data_pagamento', v_data::text,
             'data_efetivacao', CASE WHEN p.numero = 'OP-000010' THEN NULL ELSE (v_lote->>'ret') END,
             'situacao', CASE WHEN p.numero = 'OP-000010' THEN 'recusado' ELSE 'pago' END,
             'codigo_retorno', CASE WHEN p.numero = 'OP-000010' THEN '0037' ELSE '0000' END,
             'motivo_recusa', CASE WHEN p.numero = 'OP-000010' THEN 'Conta do favorecido encerrada' END,
             'autenticacao', CASE WHEN p.numero = 'OP-000010' THEN NULL
                                  ELSE upper(substr(pg_temp.sha(p.numero || 'aut'), 1, 16)) END,
             'tipo_lancamento', 'OB ' || CASE WHEN f.banco_codigo = '001' THEN '32' ELSE '31' END
           ) ORDER BY p.numero)
      INTO v_linhas
      FROM public.fin_pagamentos p JOIN public.fornecedores f ON f.id = p.fornecedor_id
     WHERE p.id = ANY (v_ids);
    v_res := public.importar_arquivo_bancario(
      v_linhas,
      jsonb_build_object('nome', format('RET_OBN600_%s_%s.ret', to_char((v_lote->>'ret')::date, 'YYYYMMDD'), lpad((36 + v_n)::text, 6, '0')),
                         'sha256', pg_temp.sha('retorno ' || v_n), 'tamanho', (600 * (jsonb_array_length(v_linhas) + 4))::text),
      jsonb_build_object('origem', 'obn600', 'sentido', 'retorno', 'data_arquivo', v_lote->>'ret',
                         'sequencial_arquivo', (36 + v_n)::text, 'convenio', '173020001'),
      false);
    UPDATE public.importacoes SET created_at = (v_lote->>'ret')::date + time '09:15' WHERE id = (v_res->>'importacao_id')::uuid;
    UPDATE public.fin_movimentos_bancarios SET created_at = (v_lote->>'ret')::date + time '09:15',
           conciliado_em = CASE WHEN conciliado_em IS NOT NULL THEN (v_lote->>'ret')::date + time '09:15' END
     WHERE importacao_id = (v_res->>'importacao_id')::uuid;
  END LOOP;
END $$;

-- ===================================================================== extrato da conta movimento (como o da bb-api grava)
INSERT INTO public.fin_extrato_lancamentos (conta_bancaria_id, data_lancamento, data_movimento, valor, sinal, codigo_historico, descricao,
  informacao_complementar, contrapartida_documento, contrapartida_tipo, contrapartida_banco, contrapartida_agencia, contrapartida_conta,
  numero_documento, identificador_bb, chave_unica, pagamento_id, created_at)
SELECT 'd3070000-0000-4000-8000-000000000001', p.data_efetivacao, p.data_pagamento, p.valor_liquido, 'D', 627, 'Pagamento OB Fornecedor',
       'OB ' || p.identificador_transacao || ' ' || upper(f.razao_social), regexp_replace(f.cpf_cnpj, '\D', '', 'g'),
       CASE WHEN f.tipo_pessoa = 'PF' THEN 'F' ELSE 'J' END, f.banco_codigo::int,
       regexp_replace(split_part(f.agencia, '-', 1), '\D', '', 'g')::int, f.conta,
       p.identificador_transacao, 'BB-' || to_char(p.data_efetivacao, 'YYYYMMDD') || '-' || p.identificador_transacao,
       'd3070000-0000-4000-8000-000000000001|' || p.identificador_transacao || '|D', p.id, p.data_efetivacao + time '20:00'
FROM public.fin_pagamentos p JOIN public.fornecedores f ON f.id = p.fornecedor_id
WHERE p.status = 'pago' AND p.id::text LIKE 'd314%';

INSERT INTO public.fin_extrato_lancamentos (conta_bancaria_id, data_lancamento, data_movimento, valor, sinal, codigo_historico, descricao,
  informacao_complementar, contrapartida_documento, contrapartida_tipo, numero_documento, identificador_bb, chave_unica, created_at)
SELECT 'd3070000-0000-4000-8000-000000000001', x.dt, x.dt, x.valor, x.sinal, x.cod, x.descr, x.compl, x.doc, x.tipo, x.numdoc,
       'BB-' || to_char(x.dt, 'YYYYMMDD') || '-' || x.numdoc, 'd3070000-0000-4000-8000-000000000001|' || x.numdoc || '|' || x.sinal,
       x.dt + time '20:00'
FROM (VALUES
  (date '2026-07-01', 'C', 1972, 'Resgate Automático BB RF CP Automático', NULL::text, 150000.00, NULL::text, NULL::text, '1972070101'),
  (date '2026-07-10', 'C', 609, 'Ordem Bancária – Estado de Roraima', 'Cota financeira de julho/2026', 380000.00, '84012012000126', 'J', '2026OB071044'),
  (date '2026-07-15', 'D', 1972, 'BB-Aplic C.Prz-Apl.Aut', NULL, 300000.00, NULL, NULL, '1972071501'),
  (date '2026-07-21', 'C', 632, 'Ordem Banc Cancelada', 'Devolução da NOB 26.00088-6', 4312.50, NULL, NULL, '4260008860000'),
  (date '2026-07-22', 'C', 1972, 'Resgate Automático BB RF CP Automático', NULL, 300000.00, NULL, NULL, '1972072201'),
  (date '2026-07-31', 'D', 108, 'Tarifa Pacote de Serviços', 'Ref. 07/2026', 214.90, NULL, NULL, '1080731'),
  (date '2026-08-03', 'C', 609, 'Ordem Bancária – Estado de Roraima', 'Complemento da cota de julho/2026', 150000.00, '84012012000126', 'J', '2026OB080311'),
  (date '2026-08-10', 'C', 609, 'Ordem Bancária – Estado de Roraima', 'Cota financeira de agosto/2026', 420000.00, '84012012000126', 'J', '2026OB081052'),
  (date '2026-08-11', 'D', 1972, 'BB-Aplic C.Prz-Apl.Aut', NULL, 250000.00, NULL, NULL, '1972081101'),
  (date '2026-08-24', 'C', 1972, 'Resgate Automático BB RF CP Automático', NULL, 250000.00, NULL, NULL, '1972082401'),
  (date '2026-08-31', 'D', 108, 'Tarifa Pacote de Serviços', 'Ref. 08/2026', 214.90, NULL, NULL, '1080831'),
  (date '2026-09-10', 'C', 609, 'Ordem Bancária – Estado de Roraima', 'Cota financeira de setembro/2026', 400000.00, '84012012000126', 'J', '2026OB091037'),
  (date '2026-09-18', 'C', 632, 'Ordem Banc Cancelada', 'Devolução da NOB 26.00153-9 – conta do favorecido encerrada', 24895.20, NULL, NULL, '4260015390000'),
  (date '2026-09-30', 'D', 108, 'Tarifa Pacote de Serviços', 'Ref. 09/2026', 214.90, NULL, NULL, '1080930'),
  (date '2026-10-09', 'C', 609, 'Ordem Bancária – Estado de Roraima', 'Cota financeira de outubro/2026', 410000.00, '84012012000126', 'J', '2026OB100948'),
  (date '2026-10-13', 'D', 1972, 'BB-Aplic C.Prz-Apl.Aut', NULL, 380000.00, NULL, NULL, '1972101301')
) AS x(dt, sinal, cod, descr, compl, valor, doc, tipo, numdoc);

-- ===================================================================== empenhos do FIPLAN (relatório FIP 614 importado pela RPC da tela)
-- Despesas que o instituto acompanha só pelo FIPLAN (passagens, fomento, diárias, licenças): entram com origem 'fiplan',
-- credor e documentos (EMP, EST, LIQ, NOB, GCV) do relatório. A dotação é achada pelo código do QDD.
SELECT public.importar_empenhos_fip614(2026, $j$[
 {"numero": "17302.0001.26.00011-8", "data_empenho": "2026-02-23", "credor_codigo": "2001.00347-6",
  "credor_nome": "ROTA NORTE AGENCIA DE VIAGENS E TURISMO LTDA", "ped_numero": "17302.0001.26.00010-3", "ped_data": "2026-02-20",
  "dotacao": "17302.0001.27.122.030.2544.9900.33903300.1500.0000.1.1", "processo": "26.000214", "processo_sei": "18101.000067/2026-48",
  "valor_empenhado": 60000.00, "valor_anulado": 0,
  "totais": {"emp": 60000.00, "liq": 41236.58, "nob": 41236.58, "gcv": 0, "saldo_liquidar": 18763.42, "a_pagar": 0},
  "documentos": [
   {"tipo": "EMP", "numero": "17302.0001.26.00011-8", "data": "2026-02-23", "pc": "P", "valores": {"emp": 60000.00}},
   {"tipo": "LIQ", "numero": "17302.0001.26.00033-9", "data": "2026-04-15", "pc": "P", "valores": {"liq": 18742.30},
    "historico": "Despesa com emissão de passagens aéreas para a delegação de Roraima nos Jogos da Juventude – etapa regional norte, conforme processo SEI 18101.000067/2026-48"},
   {"tipo": "NOB", "numero": "17302.0001.26.00041-1", "data": "2026-04-22", "pc": "P", "valores": {"nob": 18742.30}},
   {"tipo": "LIQ", "numero": "17302.0001.26.00068-5", "data": "2026-07-17", "pc": "P", "valores": {"liq": 22494.28},
    "historico": "Despesa com emissão de passagens aéreas para técnicos e atletas classificados para os Jogos Escolares Brasileiros 2026, conforme processo SEI 18101.000067/2026-48"},
   {"tipo": "NOB", "numero": "17302.0001.26.00079-0", "data": "2026-07-24", "pc": "P", "valores": {"nob": 22494.28}}]},
 {"numero": "17302.0001.26.00014-2", "data_empenho": "2026-03-09", "credor_codigo": "2001.00502-4",
  "credor_nome": "ASSOCIACAO DESPORTIVA JUVENTUDE DO CAUAME", "ped_numero": "17302.0001.26.00013-7", "ped_data": "2026-03-06",
  "dotacao": "17302.0001.27.811.031.2546.9900.33504100.1500.0000.1.1", "processo": "26.000288", "processo_sei": "18101.000088/2026-17",
  "convenio": "Termo de Fomento nº 002/2026",
  "valor_empenhado": 180000.00, "valor_anulado": 0,
  "totais": {"emp": 180000.00, "liq": 90000.00, "nob": 90000.00, "gcv": 0, "saldo_liquidar": 90000.00, "a_pagar": 0},
  "documentos": [
   {"tipo": "EMP", "numero": "17302.0001.26.00014-2", "data": "2026-03-09", "pc": "P", "valores": {"emp": 180000.00}},
   {"tipo": "LIQ", "numero": "17302.0001.26.00029-4", "data": "2026-04-02", "pc": "P", "valores": {"liq": 90000.00},
    "historico": "Despesa com repasse da 1ª parcela do Termo de Fomento nº 002/2026 à Associação Desportiva Juventude do Cauamé para execução do projeto Escolinhas do Cauamé, conforme processo SEI 18101.000088/2026-17"},
   {"tipo": "NOB", "numero": "17302.0001.26.00035-6", "data": "2026-04-09", "pc": "P", "valores": {"nob": 90000.00}}]},
 {"numero": "17302.0001.26.00038-0", "data_empenho": "2026-06-18", "credor_codigo": "2001.00412-7",
  "credor_nome": "NORTE SPORTS COMERCIO DE ARTIGOS ESPORTIVOS LTDA", "ped_numero": "17302.0001.26.00037-1", "ped_data": "2026-06-16",
  "dotacao": "17302.0001.27.812.031.2545.9900.33903000.1500.0000.1.1", "processo": "26.000731", "processo_sei": "18101.000205/2026-66",
  "valor_empenhado": 35870.00, "valor_anulado": 3870.00,
  "totais": {"emp": 32000.00, "liq": 32000.00, "nob": 0, "gcv": 0, "saldo_liquidar": 0, "a_pagar": 32000.00},
  "documentos": [
   {"tipo": "EMP", "numero": "17302.0001.26.00038-0", "data": "2026-06-18", "pc": "P", "valores": {"emp": 35870.00}},
   {"tipo": "EST", "numero": "17302.0001.26.00043-8", "data": "2026-07-01", "pc": "P", "valores": {"emp": -3870.00},
    "historico": "Estorno parcial do empenho: item 4 (bolas de handebol) fracassado no pregão"},
   {"tipo": "LIQ", "numero": "17302.0001.26.00102-2", "data": "2026-08-21", "pc": "P", "valores": {"liq": 32000.00},
    "historico": "Despesa com aquisição de bolas oficiais de futsal e voleibol para os Jogos Escolares de Roraima – JER 2026, conforme processo SEI 18101.000205/2026-66"}]},
 {"numero": "17302.0001.26.00063-7", "data_empenho": "2026-10-07", "credor_codigo": "2001.00421-6",
  "credor_nome": "LAVRADO REFEICOES COLETIVAS LTDA", "ped_numero": "17302.0001.26.00062-9", "ped_data": "2026-10-05",
  "dotacao": "17302.0001.27.812.031.2545.9900.33903900.1500.0000.1.1", "processo": "26.001344", "processo_sei": "18101.000351/2026-27",
  "valor_empenhado": 22450.00, "valor_anulado": 0,
  "totais": {"emp": 22450.00, "liq": 0, "nob": 0, "gcv": 0, "saldo_liquidar": 22450.00, "a_pagar": 0},
  "documentos": [
   {"tipo": "EMP", "numero": "17302.0001.26.00063-7", "data": "2026-10-07", "pc": "P", "valores": {"emp": 22450.00}}]},
 {"numero": "17302.0001.26.00045-9", "data_empenho": "2026-08-06", "credor_codigo": "2002.01845-3",
  "credor_nome": "PATRICIA NOGUEIRA SALES", "ped_numero": "17302.0001.26.00044-2", "ped_data": "2026-08-05",
  "dotacao": "17302.0001.27.122.030.2544.9900.33901400.1500.0000.1.1", "processo": "26.000955", "processo_sei": "18101.000289/2026-51",
  "valor_empenhado": 1330.00, "valor_anulado": 0,
  "totais": {"emp": 1330.00, "liq": 1330.00, "nob": 1330.00, "gcv": 0, "saldo_liquidar": 0, "a_pagar": 0},
  "documentos": [
   {"tipo": "EMP", "numero": "17302.0001.26.00045-9", "data": "2026-08-06", "pc": "P", "valores": {"emp": 1330.00}},
   {"tipo": "LIQ", "numero": "17302.0001.26.00071-5", "data": "2026-08-07", "pc": "P", "valores": {"liq": 1330.00},
    "historico": "Despesa com concessão de 3,5 diárias à servidora para participar de reunião técnica no Ministério do Esporte, em Brasília/DF, de 10 a 13/08/2026, conforme processo SEI 18101.000289/2026-51"},
   {"tipo": "NOB", "numero": "17302.0001.26.00098-6", "data": "2026-08-07", "pc": "P", "valores": {"nob": 1330.00}}]},
 {"numero": "17302.0001.26.00029-1", "data_empenho": "2026-05-25", "credor_codigo": "2001.00290-3",
  "credor_nome": "TEPEQUEM TECNOLOGIA E SERVICOS DE INFORMATICA LTDA", "ped_numero": "17302.0001.26.00028-5", "ped_data": "2026-05-22",
  "dotacao": "17302.0001.27.122.030.2544.9900.33904000.1500.0000.1.1", "processo": "26.000602", "processo_sei": "18101.000176/2026-80",
  "valor_empenhado": 12960.00, "valor_anulado": 0,
  "totais": {"emp": 12960.00, "liq": 12960.00, "nob": 12960.00, "gcv": 621.12, "saldo_liquidar": 0, "a_pagar": 0},
  "documentos": [
   {"tipo": "EMP", "numero": "17302.0001.26.00029-1", "data": "2026-05-25", "pc": "P", "valores": {"emp": 12960.00}},
   {"tipo": "LIQ", "numero": "17302.0001.26.00047-0", "data": "2026-06-15", "pc": "P", "valores": {"liq": 12960.00},
    "historico": "Despesa com renovação anual das licenças do sistema de backup em nuvem das estações e servidores da sede, conforme processo SEI 18101.000176/2026-80"},
   {"tipo": "NOB", "numero": "17302.0001.26.00056-8", "data": "2026-06-22", "pc": "P", "valores": {"nob": 12960.00}},
   {"tipo": "GCV", "numero": "17302.0001.26.00011-3", "data": "2026-06-22", "pc": "P", "valores": {"gcv": 621.12},
    "historico": "Recolhimento de ISS (5%) e IRRF (4,8%) retidos na NFS-e 3157"}]}
]$j$::jsonb,
  jsonb_build_object('nome', 'FIP614_IDJUV_20261022.pdf', 'sha256', pg_temp.sha('FIP614 2026-10-22'), 'tamanho', '184332'),
  date '2026-10-22', false) -> 'totais' AS fip614 \gset
UPDATE public.importacoes SET created_at = '2026-10-22 08:47-04' WHERE tipo = 'empenhos_fip614' AND exercicio = 2026;

-- ===================================================================== QDD 2026 importado do FIPLAN (posição de 21/10/2026)
-- O arquivo traz a execução do FIPLAN: a do sistema (já nas dotações) mais a dos empenhos do FIP 614.
SELECT public.importar_qdd_fiplan(2026, (
  SELECT jsonb_agg(jsonb_build_object(
           'funcao', x.func, 'subfuncao', x.subf, 'programa_codigo', x.prog, 'programa_nome', p.nome,
           'paoe_codigo', x.paoe, 'paoe_nome', x.paoe_nome, 'regional', '9900', 'natureza', x.nat, 'fonte', x.fonte,
           'cod_acomp', '0000', 'idu', 'Não', 'tro', 'No',
           'valores', jsonb_build_object(
             'inicial', d.valor_inicial, 'suplementado', d.valor_suplementado, 'anulado', d.valor_reduzido,
             'bloqueado', d.valor_bloqueado, 'reserva', d.valor_reserva, 'ped', d.valor_ped,
             'empenhado', d.valor_empenhado + COALESCE(f.emp, 0),
             'liquidado', d.valor_liquidado + COALESCE(f.liq, 0),
             'em_liquidacao', COALESCE(el.valor, 0),
             'pago', d.valor_pago + COALESCE(f.pago, 0),
             'restos', 0)) ORDER BY x.n)
    FROM _dot x
    JOIN public.fin_dotacoes d ON d.id = x.id
    JOIN public.fin_programas_orcamentarios p ON p.id = x.programa
    LEFT JOIN (SELECT dotacao_id, sum(valor_empenhado - valor_anulado) AS emp, sum(valor_liquidado) AS liq, sum(valor_pago) AS pago
                 FROM public.fin_empenhos WHERE origem = 'fiplan' GROUP BY dotacao_id) f ON f.dotacao_id = d.id
    LEFT JOIN (SELECT e.dotacao_id, sum(l.valor_liquidado) AS valor
                 FROM public.fin_liquidacoes l JOIN public.fin_empenhos e ON e.id = l.empenho_id
                WHERE l.status IN ('pendente', 'atestada') GROUP BY e.dotacao_id) el ON el.dotacao_id = d.id
   WHERE x.exercicio = 2026),
  jsonb_build_object('nome', 'QDD_FIP608_IDJUV_2026-10-21.xlsx', 'sha256', pg_temp.sha('QDD 2026-10-21'), 'tamanho', '96514'),
  false) -> 'totais' AS qdd \gset
UPDATE public.importacoes SET created_at = '2026-10-21 17:05-04' WHERE tipo = 'qdd_fiplan' AND exercicio = 2026;

-- ===================================================================== tabelas do FIPLAN (classificadores) de 2026
SELECT count(public.importar_classificadores_fiplan(t.tipo, 2026, t.linhas,
         jsonb_build_object('nome', 'FIPLAN_tabela_' || t.tipo || '_2026.xlsx', 'sha256', pg_temp.sha('classif ' || t.tipo), 'tamanho', '18240'),
         false)) AS _n
FROM (VALUES
  ('funcao', $j$[{"codigo": "04", "nome": "Administração"}, {"codigo": "08", "nome": "Assistência Social"},
                 {"codigo": "12", "nome": "Educação"}, {"codigo": "27", "nome": "Desporto e Lazer"}]$j$::jsonb),
  ('programa', $j$[{"codigo": "030", "nome": "Gestão Administrativa do Desporto e da Juventude"},
                   {"codigo": "031", "nome": "Roraima Mais Esporte"},
                   {"codigo": "032", "nome": "Juventude Protagonista"}]$j$::jsonb),
  ('elemento', $j$[{"codigo": "14", "nome": "Diárias - Civil"}, {"codigo": "30", "nome": "Material de Consumo"},
                   {"codigo": "31", "nome": "Premiações Culturais, Artísticas, Científicas, Desportivas e Outras"},
                   {"codigo": "33", "nome": "Passagens e Despesas com Locomoção"},
                   {"codigo": "36", "nome": "Outros Serviços de Terceiros - Pessoa Física"},
                   {"codigo": "39", "nome": "Outros Serviços de Terceiros - Pessoa Jurídica"},
                   {"codigo": "40", "nome": "Serviços de Tecnologia da Informação e Comunicação - Pessoa Jurídica"},
                   {"codigo": "41", "nome": "Contribuições"}, {"codigo": "52", "nome": "Equipamentos e Material Permanente"}]$j$::jsonb),
  ('subelemento', $j$[{"codigo": "30.14", "nome": "Material Educativo e Esportivo"}, {"codigo": "30.22", "nome": "Material de Limpeza e Produtos de Higienização"},
                      {"codigo": "39.23", "nome": "Festividades e Homenagens"}, {"codigo": "39.63", "nome": "Serviços Gráficos e Editoriais"},
                      {"codigo": "52.42", "nome": "Mobiliário em Geral"}, {"codigo": "52.30", "nome": "Máquinas e Equipamentos Energéticos"}]$j$::jsonb),
  ('fonte', $j$[{"codigo": "1.500", "nome": "Recursos não Vinculados de Impostos"},
                {"codigo": "1.501", "nome": "Outros Recursos não Vinculados"},
                {"codigo": "1.700", "nome": "Outras Transferências de Convênios ou Instrumentos Congêneres da União"}]$j$::jsonb),
  ('finalidade_pagamento', $j$[{"codigo": "1", "nome": "Pagamento a fornecedores"}, {"codigo": "2", "nome": "Pagamento de diárias"},
                               {"codigo": "5", "nome": "Repasse a entidades sem fins lucrativos"}, {"codigo": "11", "nome": "Suprimento de fundos"}]$j$::jsonb)
) AS t(tipo, linhas) \gset
UPDATE public.importacoes SET created_at = '2026-02-02 10:12-04' WHERE tipo = 'classificadores_fiplan' AND exercicio = 2026;

-- ===================================================================== restos a pagar de 2025 (inscrição pela função da tela)
SELECT public.fn_inscrever_restos_pagar(2025, 2026) AS _n \gset
UPDATE public.fin_restos_pagar SET data_inscricao = '2026-01-05' WHERE exercicio_inscricao = 2026;
UPDATE public.fin_empenhos SET data_inscricao_rp = '2026-01-05', tipo_rp = CASE WHEN valor_liquidado > 0 THEN 'processado' ELSE 'nao_processado' END
 WHERE exercicio = 2025 AND inscrito_rp;
-- processado pago em fevereiro
UPDATE public.fin_restos_pagar SET status = 'pago', valor_liquidado = valor_inscrito, valor_pago = valor_inscrito,
       observacoes = 'Pago pela NOB 17302.0001.26.00008-2 de 12/02/2026.'
 WHERE empenho_id = 'd3100000-0000-4000-8000-000000000024';
UPDATE public.fin_empenhos SET valor_pago = valor_liquidado, status = 'pago' WHERE id = 'd3100000-0000-4000-8000-000000000024';
-- não processado cancelado (serviço não prestado)
UPDATE public.fin_restos_pagar SET status = 'cancelado', valor_cancelado = valor_inscrito, data_cancelamento = '2026-06-30',
       motivo_cancelamento = 'Serviço não prestado: a van não foi utilizada porque a instalação da sede ocorreu com veículos cedidos pela SEED.'
 WHERE empenho_id = 'd3100000-0000-4000-8000-000000000023';
-- não processado em liquidação (nota fiscal recebida, aguarda atesto)
UPDATE public.fin_restos_pagar SET status = 'em_liquidacao', observacoes = 'NFS-e 3022 recebida em 14/10/2026; aguarda atesto da comissão.'
 WHERE empenho_id = 'd3100000-0000-4000-8000-000000000022';
UPDATE public.fin_restos_pagar SET observacoes = 'Pagamento programado na OP-000013, aguardando cota financeira.'
 WHERE empenho_id = 'd3100000-0000-4000-8000-000000000021';

-- ===================================================================== suprimento de fundos (adiantamentos) e prestação de contas
INSERT INTO public.fin_adiantamentos (id, numero, exercicio, data_solicitacao, servidor_suprido_id, unidade_id, valor_solicitado, valor_aprovado,
  valor_utilizado, valor_devolvido, finalidade, periodo_utilizacao_inicio, periodo_utilizacao_fim, prazo_prestacao_contas, dotacao_id,
  conta_bancaria_id, conta_suprido_banco, conta_suprido_agencia, conta_suprido_numero, status, autorizado_por, autorizado_em,
  liberado_por, liberado_em, data_liberacao, data_prestacao, prestacao_aprovada_por, prestacao_aprovada_em, parecer_prestacao,
  bloqueado, data_bloqueio, motivo_bloqueio, observacoes, created_by) VALUES
  ('d3160000-0000-4000-8000-000000000001', 'ADI-000001', 2026, '2026-05-04', 'c0000000-0000-4000-8000-000000000013', 'a0000000-0000-4000-8000-000000000003', 4000.00, 4000.00,
   3612.40, 387.60, 'Despesas miúdas de pronto pagamento nas etapas do JER 2026 em Rorainópolis e Caracaraí (água mineral, gelo, pilhas, material de primeiros socorros e pequenos reparos).',
   '2026-05-11', '2026-06-10', '2026-07-10', 'd3050000-0000-4000-8000-000000000006', 'd3070000-0000-4000-8000-000000000003', '001', '2617-6', '51208-3',
   'aprovado', auth.uid(), '2026-05-06 10:00-04', auth.uid(), '2026-05-08 14:20-04', '2026-05-08', '2026-07-03', auth.uid(), '2026-07-15 09:45-04',
   'Comprovantes regulares e dentro do período de aplicação. Saldo de R$ 387,60 devolvido por GRU em 06/07/2026.', false, NULL, NULL, NULL, auth.uid()),
  ('d3160000-0000-4000-8000-000000000002', 'ADI-000002', 2026, '2026-09-24', 'c0000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000003', 3000.00, 3000.00,
   0, 0, 'Despesas de pequeno vulto dos Núcleos de Esporte Educacional durante as seletivas de outubro e novembro.',
   '2026-10-01', '2026-11-30', '2026-12-30', 'd3050000-0000-4000-8000-000000000006', 'd3070000-0000-4000-8000-000000000003', '001', '2617-6', '48830-1',
   'liberado', auth.uid(), '2026-09-28 11:12-04', auth.uid(), '2026-10-01 15:05-04', '2026-10-01', NULL, NULL, NULL, NULL, false, NULL, NULL, NULL, auth.uid()),
  ('d3160000-0000-4000-8000-000000000003', 'ADI-000003', 2026, '2026-08-17', 'c0000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000002', 2500.00, 2500.00,
   2318.75, 0, 'Pequenas despesas de manutenção da sede (chaveiro, reparos hidráulicos e elétricos de pronto atendimento).',
   '2026-08-24', '2026-09-30', '2026-10-30', 'd3050000-0000-4000-8000-000000000002', 'd3070000-0000-4000-8000-000000000003', '001', '2617-6', '39114-0',
   'prestacao_pendente', auth.uid(), '2026-08-19 09:30-04', auth.uid(), '2026-08-24 13:00-04', '2026-08-24', NULL, NULL, NULL, NULL, false, NULL, NULL,
   'Período de aplicação encerrado; prestação de contas a entregar até 30/10/2026.', auth.uid()),
  ('d3160000-0000-4000-8000-000000000004', 'ADI-000004', 2026, '2026-10-20', 'c0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000007', 1800.00, NULL,
   0, 0, 'Aquisição de material de pronto uso para o almoxarifado durante o inventário anual.',
   '2026-11-03', '2026-12-04', NULL, 'd3050000-0000-4000-8000-000000000001', NULL, '001', '2617-6', '44071-9',
   'solicitado', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL, auth.uid()),
  ('d3160000-0000-4000-8000-000000000005', 'ADI-000005', 2026, '2026-06-22', 'c0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000006', 2000.00, 2000.00,
   1240.00, 0, 'Despesas com reprografia e autenticação de documentos para a prestação de contas do convênio federal.',
   '2026-07-01', '2026-07-31', '2026-08-31', 'd3050000-0000-4000-8000-000000000002', 'd3070000-0000-4000-8000-000000000003', '001', '2617-6', '30562-7',
   'bloqueado', auth.uid(), '2026-06-24 10:40-04', auth.uid(), '2026-07-01 08:55-04', '2026-07-01', NULL, NULL, NULL, NULL,
   true, '2026-09-01', 'Prazo de prestação de contas expirado em 2026-08-31', 'Servidor notificado em 02/09/2026; novo suprimento vedado até a regularização.', auth.uid()),
  ('d3160000-0000-4000-8000-000000000006', 'ADI-000006', 2026, '2026-08-26', 'c0000000-0000-4000-8000-000000000010', 'a0000000-0000-4000-8000-000000000006', 1500.00, 1500.00,
   1462.30, 37.70, 'Despesas miúdas da Divisão de Finanças (correios, cartório e material de expediente de pronto uso).',
   '2026-09-01', '2026-09-30', '2026-10-30', 'd3050000-0000-4000-8000-000000000001', 'd3070000-0000-4000-8000-000000000003', '001', '2617-6', '27795-4',
   'prestado', auth.uid(), '2026-08-28 10:00-04', auth.uid(), '2026-09-01 09:10-04', '2026-09-01', '2026-10-15', NULL, NULL, NULL, false, NULL, NULL,
   'Prestação entregue; em análise no controle interno.', auth.uid()),
  ('d3160000-0000-4000-8000-000000000007', 'ADI-000007', 2026, '2026-07-07', 'c0000000-0000-4000-8000-000000000016', 'a0000000-0000-4000-8000-000000000004', 3500.00, NULL,
   0, 0, 'Aquisição de lanches para as oficinas do programa Juventude Ativa no segundo semestre.',
   NULL, NULL, NULL, 'd3050000-0000-4000-8000-000000000012', NULL, '001', '3170-6', '22018-5',
   'rejeitado', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL,
   'Indeferido: despesa programável e contínua, deve ser contratada por processo regular, não por suprimento de fundos.', auth.uid()),
  ('d3160000-0000-4000-8000-000000000008', 'ADI-000008', 2026, '2026-10-16', 'c0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000004', 2800.00, 2800.00,
   0, 0, 'Despesas de pronto pagamento do Festival de Grafite Jovem (tintas spray, máscaras e lonas).',
   '2026-11-04', '2026-11-30', '2026-12-30', 'd3050000-0000-4000-8000-000000000001', 'd3070000-0000-4000-8000-000000000003', '001', '2617-6', '36207-2',
   'autorizado', auth.uid(), '2026-10-21 16:30-04', NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, 'Aguardando liberação financeira.', auth.uid()),
  ('d3160000-0000-4000-8000-000000000009', 'ADI-000009', 2026, '2026-09-29', 'c0000000-0000-4000-8000-000000000015', 'a0000000-0000-4000-8000-000000000008', 1200.00, 1200.00,
   415.90, 0, 'Pequenas despesas da ASCOM na cobertura dos eventos de outubro (pilhas, cartões de memória e impressões).',
   '2026-10-05', '2026-11-04', '2026-12-04', 'd3050000-0000-4000-8000-000000000001', 'd3070000-0000-4000-8000-000000000003', '001', '2617-6', '41950-8',
   'em_uso', auth.uid(), '2026-10-01 10:05-04', auth.uid(), '2026-10-05 08:40-04', '2026-10-05', NULL, NULL, NULL, NULL, false, NULL, NULL, NULL, auth.uid());

INSERT INTO public.fin_adiantamento_itens (adiantamento_id, item_numero, tipo_documento, numero_documento, data_documento, cnpj_cpf_fornecedor,
  nome_fornecedor, descricao, valor, valido, motivo_invalido, validado_por, validado_em)
SELECT a.id, i.n, i.tipo, i.num, i.dt, pg_temp.cnpj(i.base), i.nome, i.descr, i.valor, i.valido, i.motivo,
       CASE WHEN i.valido IS NOT NULL THEN auth.uid() END, CASE WHEN i.valido IS NOT NULL THEN timestamptz '2026-07-14 15:00-04' END
FROM (VALUES
  ('ADI-000001', 1, 'nota_fiscal', '000.412', date '2026-05-13', '508812340001', 'Supermercado Rorainópolis Ltda', 'Água mineral 500 ml (40 fardos) e gelo em cubos', 1128.40, true, NULL::text),
  ('ADI-000001', 2, 'nota_fiscal', '18.774', date '2026-05-14', '193560770001', 'Farmácia Popular do Sul Ltda', 'Material de primeiros socorros (gaze, esparadrapo, gelo instantâneo)', 742.90, true, NULL),
  ('ADI-000001', 3, 'cupom_fiscal', '55.031', date '2026-05-21', '264470180001', 'Comercial Elétrica Caracaraí Ltda', 'Pilhas, extensões e lâmpadas para o placar provisório', 518.60, true, NULL),
  ('ADI-000001', 4, 'nota_fiscal', '2.087', date '2026-06-02', '331905260001', 'Serralheria Bom Intento Ltda', 'Reparo emergencial de trave de futsal da quadra municipal', 980.00, true, NULL),
  ('ADI-000001', 5, 'recibo', '017', date '2026-06-05', '402277510001', 'Copiadora Centro Sul Ltda', 'Impressão de súmulas e boletins de jogo', 242.50, true, NULL),
  ('ADI-000006', 1, 'nota_fiscal', '4.410', date '2026-09-03', '155390840001', 'Papelaria Caçari Ltda', 'Material de expediente de pronto uso', 618.30, NULL, NULL),
  ('ADI-000006', 2, 'recibo', 'AR 2208', date '2026-09-10', '271840330001', 'Agência de Correios Franqueada Centro Ltda', 'Postagem de notificações com aviso de recebimento', 412.00, NULL, NULL),
  ('ADI-000006', 3, 'nota_fiscal', '9.902', date '2026-09-18', '361027940001', '2º Ofício de Notas e Registros Ltda', 'Autenticação de cópias e reconhecimento de firmas', 432.00, NULL, NULL)
) AS i(num_adi, n, tipo, num, dt, base, nome, descr, valor, valido, motivo)
JOIN public.fin_adiantamentos a ON a.numero = i.num_adi;

-- ===================================================================== receitas (repasses do Tesouro, convênio, rendimentos e outras)
INSERT INTO public.fin_receitas (id, numero, exercicio, data_receita, tipo, fonte_recurso_id, conta_bancaria_id, origem_descricao, documento_origem,
  entidade_pagadora, cnpj_cpf_pagador, valor, conciliado, observacoes, created_by)
SELECT ('d3150000-0000-4000-8000-0000000000' || lpad(r.n::text, 2, '0'))::uuid, 'REC-' || lpad(r.n::text, 6, '0'), 2026, r.dt, r.tipo::public.tipo_receita,
       r.fonte, r.conta, r.origem, r.doc, r.pagador, r.cnpj, r.valor, r.dt < date '2026-10-01', r.obs, auth.uid()
FROM (VALUES
  ( 1, date '2026-01-12', 'repasse_tesouro', 'd3010000-0000-4000-8000-000000000001'::uuid, 'd3070000-0000-4000-8000-000000000001'::uuid, 'Cota financeira do Tesouro Estadual – janeiro/2026', 'ARR 17302.0001.26.00002-6', 'Secretaria de Estado da Fazenda', '84.012.012/0001-26', 260000.00, NULL::text),
  ( 2, date '2026-02-10', 'repasse_tesouro', 'd3010000-0000-4000-8000-000000000001', 'd3070000-0000-4000-8000-000000000001', 'Cota financeira do Tesouro Estadual – fevereiro/2026', 'ARR 17302.0001.26.00006-9', 'Secretaria de Estado da Fazenda', '84.012.012/0001-26', 330000.00, NULL),
  ( 3, date '2026-03-10', 'repasse_tesouro', 'd3010000-0000-4000-8000-000000000001', 'd3070000-0000-4000-8000-000000000001', 'Cota financeira do Tesouro Estadual – março/2026', 'ARR 17302.0001.26.00011-5', 'Secretaria de Estado da Fazenda', '84.012.012/0001-26', 350000.00, NULL),
  ( 4, date '2026-04-09', 'repasse_tesouro', 'd3010000-0000-4000-8000-000000000001', 'd3070000-0000-4000-8000-000000000001', 'Cota financeira do Tesouro Estadual – abril/2026', 'ARR 17302.0001.26.00017-4', 'Secretaria de Estado da Fazenda', '84.012.012/0001-26', 390000.00, NULL),
  ( 5, date '2026-05-11', 'repasse_tesouro', 'd3010000-0000-4000-8000-000000000001', 'd3070000-0000-4000-8000-000000000001', 'Cota financeira do Tesouro Estadual – maio/2026', 'ARR 17302.0001.26.00024-7', 'Secretaria de Estado da Fazenda', '84.012.012/0001-26', 405000.00, NULL),
  ( 6, date '2026-06-10', 'repasse_tesouro', 'd3010000-0000-4000-8000-000000000001', 'd3070000-0000-4000-8000-000000000001', 'Cota financeira do Tesouro Estadual – junho/2026', 'ARR 17302.0001.26.00033-6', 'Secretaria de Estado da Fazenda', '84.012.012/0001-26', 410000.00, NULL),
  ( 7, date '2026-07-10', 'repasse_tesouro', 'd3010000-0000-4000-8000-000000000001', 'd3070000-0000-4000-8000-000000000001', 'Cota financeira do Tesouro Estadual – julho/2026', 'ARR 17302.0001.26.00041-3', 'Secretaria de Estado da Fazenda', '84.012.012/0001-26', 380000.00, NULL),
  ( 8, date '2026-07-31', 'repasse_tesouro', 'd3010000-0000-4000-8000-000000000001', 'd3070000-0000-4000-8000-000000000001', 'Complemento da cota financeira de julho/2026', 'ARR 17302.0001.26.00049-7', 'Secretaria de Estado da Fazenda', '84.012.012/0001-26', 150000.00, 'Creditado no banco em 03/08/2026.'),
  ( 9, date '2026-07-31', 'rendimento_aplicacao', 'd3010000-0000-4000-8000-000000000001', 'd3070000-0000-4000-8000-000000000004', 'Rendimento do BB RF CP Automático – julho/2026', 'Extrato do fundo 07/2026', 'Banco do Brasil S.A.', NULL, 6874.12, NULL),
  (10, date '2026-08-10', 'repasse_tesouro', 'd3010000-0000-4000-8000-000000000001', 'd3070000-0000-4000-8000-000000000001', 'Cota financeira do Tesouro Estadual – agosto/2026', 'ARR 17302.0001.26.00058-2', 'Secretaria de Estado da Fazenda', '84.012.012/0001-26', 420000.00, NULL),
  (11, date '2026-08-20', 'convenio', 'd3010000-0000-4000-8000-000000000003', 'd3070000-0000-4000-8000-000000000002', 'Convênio nº 912345/2025 – 1ª parcela (Núcleo de Esporte Educacional)', 'OB 2026OB804455', 'Ministério do Esporte', '02.961.362/0001-74', 650000.00, 'Contrapartida estadual de R$ 162.400,00 prevista no plano de trabalho.'),
  (12, date '2026-08-31', 'rendimento_aplicacao', 'd3010000-0000-4000-8000-000000000001', 'd3070000-0000-4000-8000-000000000004', 'Rendimento do BB RF CP Automático – agosto/2026', 'Extrato do fundo 08/2026', 'Banco do Brasil S.A.', NULL, 7102.55, NULL),
  (13, date '2026-07-06', 'restituicao', 'd3010000-0000-4000-8000-000000000001', 'd3070000-0000-4000-8000-000000000003', 'Devolução de saldo não utilizado do suprimento de fundos ADI-000001', 'GRU 0745/2026', 'Thiago Barreto Cunha', NULL, 387.60, NULL),
  (14, date '2026-09-10', 'repasse_tesouro', 'd3010000-0000-4000-8000-000000000001', 'd3070000-0000-4000-8000-000000000001', 'Cota financeira do Tesouro Estadual – setembro/2026', 'ARR 17302.0001.26.00066-1', 'Secretaria de Estado da Fazenda', '84.012.012/0001-26', 400000.00, NULL),
  (15, date '2026-09-22', 'taxa_servico', 'd3010000-0000-4000-8000-000000000002', 'd3070000-0000-4000-8000-000000000001', 'Taxa de cessão de uso do Ginásio Hélio Campos para evento particular', 'DAE 2026/004812', 'Liga Boavistense de Basquete Master', '27.904.611/0001-35', 3250.00, NULL),
  (16, date '2026-09-25', 'multa', 'd3010000-0000-4000-8000-000000000002', 'd3070000-0000-4000-8000-000000000001', 'Multa contratual por atraso na entrega de material gráfico', 'DAE 2026/004907', 'Uraricoera Serviços Gráficos Ltda', NULL, 1274.58, 'Aplicada no processo SEI 18101.000301/2026-21.'),
  (17, date '2026-09-30', 'rendimento_aplicacao', 'd3010000-0000-4000-8000-000000000001', 'd3070000-0000-4000-8000-000000000004', 'Rendimento do BB RF CP Automático – setembro/2026', 'Extrato do fundo 09/2026', 'Banco do Brasil S.A.', NULL, 6581.33, NULL),
  (18, date '2026-10-09', 'repasse_tesouro', 'd3010000-0000-4000-8000-000000000001', 'd3070000-0000-4000-8000-000000000001', 'Cota financeira do Tesouro Estadual – outubro/2026', 'ARR 17302.0001.26.00074-2', 'Secretaria de Estado da Fazenda', '84.012.012/0001-26', 410000.00, NULL)
) AS r(n, dt, tipo, fonte, conta, origem, doc, pagador, cnpj, valor, obs);
UPDATE public.fin_receitas r SET cnpj_cpf_pagador = f.cpf_cnpj FROM public.fornecedores f
 WHERE r.numero = 'REC-000016' AND f.id = 'd3060000-0000-4000-8000-000000000009';

-- ===================================================================== conciliação mensal (quadro da SEFAZ) da Conta Movimento
-- Julho (implantação, com pendências de abertura) e agosto fechados; setembro em rascunho. Gravados pelas RPCs da tela
-- (salvar_conciliacao_mensal / fechar_conciliacao_mensal); o saldo do fundo é o que fecha o quadro. Pendências de um
-- mês entram no seguinte como origem 'anterior' (item_origem_id).
CREATE TEMP TABLE _ci (n serial, m int, k text, ok text, lado text, nat text, data date, doc text, tipo text, hist text,
  valor numeric(15,2), re text, nob text, origem text, sit text, grupo int, regra text, just text, sid uuid) ON COMMIT DROP;
INSERT INTO _ci (m, k, ok, lado, nat, data, doc, tipo, hist, valor, re, nob, origem, sit, grupo, regra, just) VALUES
  -- julho/2026
  (7, 'j_ab1', NULL, 'bancario', 'debito',  '2026-03-31', '', '', 'TARIFA PACOTE DE SERVIÇOS', 186.40, NULL, NULL, 'abertura', 'pendente', NULL, NULL, NULL),
  (7, 'j_ab2', NULL, 'bancario', 'debito',  '2026-06-18', '', '', 'TARIFA TED', 37.80, NULL, NULL, 'abertura', 'pendente', NULL, NULL, NULL),
  (7, 'j_n1', NULL, 'contabil', 'credito', '2026-07-14', '17302.0001.26.00071-2', 'NOB', 'PAGAMENTO DA NL 26.00049-2 REF. PARCELA DE JUNHO/2026', 5628.48, '26.00015-1', NULL, 'mes', 'casado', 1, 're', NULL),
  (7, 'j_n2', NULL, 'contabil', 'credito', '2026-07-14', '17302.0001.26.00072-0', 'NOB', 'PAGAMENTO DA NL 26.00051-4 REF. 1ª PARCELA DO TERMO DE FOMENTO 003/2026', 66500.00, '26.00015-1', NULL, 'mes', 'casado', 1, 're', NULL),
  (7, 'j_b1', NULL, 'bancario', 'debito',  '2026-07-15', '426000151', '', 'EMISSAO ORDEM BANCARIA', 72128.48, '26.00015-1', NULL, 'mes', 'casado', 1, 're', NULL),
  (7, 'j_a1', NULL, 'contabil', 'debito',  '2026-07-10', '17302.0001.26.00041-3', 'ARR', 'COTA FINANCEIRA DO TESOURO ESTADUAL – JULHO/2026', 380000.00, NULL, NULL, 'mes', 'casado', 2, 'repasse', NULL),
  (7, 'j_b2', NULL, 'bancario', 'credito', '2026-07-10', '2026OB071044', '', 'ORDEM BANCARIA', 380000.00, NULL, NULL, 'mes', 'casado', 2, 'repasse', NULL),
  (7, 'j_i1', NULL, 'contabil', 'debito',  '2026-07-20', '17302.0001.26.00044-0', 'NLA', 'AJUSTE DE FONTE DE RECURSO 1.500 PARA 1.501', 12500.00, NULL, NULL, 'mes', 'casado', 3, 'interno', NULL),
  (7, 'j_i2', NULL, 'contabil', 'credito', '2026-07-20', '17302.0001.26.00044-0', 'NLA', 'AJUSTE DE FONTE DE RECURSO 1.500 PARA 1.501', 12500.00, NULL, NULL, 'mes', 'casado', 3, 'interno', NULL),
  (7, 'j_p1', NULL, 'contabil', 'debito',  '2026-07-31', '17302.0001.26.00049-7', 'ARR', 'COMPLEMENTO DA COTA FINANCEIRA DE JULHO/2026', 150000.00, NULL, NULL, 'mes', 'pendente', NULL, NULL, NULL),
  (7, 'j_p2', NULL, 'contabil', 'credito', '2026-07-30', '17302.0001.26.00102-3', 'NOB', 'PAGAMENTO DA NL 26.00057-3 REF. DIÁRIAS DE JULHO/2026', 9870.00, '26.00017-8', NULL, 'mes', 'pendente', NULL, NULL, NULL),
  (7, 'j_p3', NULL, 'bancario', 'credito', '2026-07-21', '4260008860000', '', 'ORDEM BANC CANCELADA', 4312.50, NULL, '26.00088-6', 'mes', 'pendente', NULL, NULL, NULL),
  (7, 'j_p4', NULL, 'bancario', 'debito',  '2026-07-31', '', '', 'TARIFA PACOTE DE SERVIÇOS', 214.90, NULL, NULL, 'mes', 'pendente', NULL, NULL, NULL),
  (7, 'j_p5', NULL, 'bancario', 'credito', '2026-07-31', '', '', 'RENDIMENTOS APLICAÇÃO FINANCEIRA', 6874.12, NULL, NULL, 'mes', 'pendente', NULL, NULL, NULL),
  -- agosto/2026
  (8, 'a_p1', 'j_p1', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'anterior', 'casado', 1, 'repasse', NULL),
  (8, 'a_b1', NULL, 'bancario', 'credito', '2026-08-03', '2026OB080311', '', 'ORDEM BANCARIA', 150000.00, NULL, NULL, 'mes', 'casado', 1, 'repasse', NULL),
  (8, 'a_p2', 'j_p2', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'anterior', 'casado', 2, 'valor_data', NULL),
  (8, 'a_b2', NULL, 'bancario', 'debito',  '2026-08-03', '426000178', '', 'EMISSAO ORDEM BANCARIA', 9870.00, '26.00017-8', NULL, 'mes', 'casado', 2, 'valor_data', NULL),
  (8, 'a_p4', 'j_p4', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'anterior', 'casado', 3, 'manual', 'Tarifa de julho/2026 regularizada no razão pela NLA 26.00118-2.'),
  (8, 'a_c1', NULL, 'contabil', 'credito', '2026-08-14', '17302.0001.26.00118-2', 'NLA', 'REGULARIZAÇÃO DE TARIFA BANCÁRIA DE JULHO/2026', 214.90, NULL, NULL, 'mes', 'casado', 3, 'manual', 'Tarifa de julho/2026 regularizada no razão pela NLA 26.00118-2.'),
  (8, 'a_p5', 'j_p5', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'anterior', 'casado', 4, 'valor_data', NULL),
  (8, 'a_c2', NULL, 'contabil', 'debito',  '2026-08-05', '17302.0001.26.00053-0', 'ARR', 'RENDIMENTOS DE APLICAÇÃO FINANCEIRA – JULHO/2026', 6874.12, NULL, NULL, 'mes', 'casado', 4, 'valor_data', NULL),
  (8, 'a_ab1', 'j_ab1', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'anterior', 'pendente', NULL, NULL, NULL),
  (8, 'a_ab2', 'j_ab2', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'anterior', 'pendente', NULL, NULL, NULL),
  (8, 'a_p3', 'j_p3', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'anterior', 'pendente', NULL, NULL, NULL),
  (8, 'a_n1', NULL, 'contabil', 'credito', '2026-08-12', '17302.0001.26.00109-4', 'NOB', 'PAGAMENTO DA NL 26.00058-1 REF. NF 1832', 48165.00, '26.00019-4', NULL, 'mes', 'casado', 5, 're', NULL),
  (8, 'a_n2', NULL, 'contabil', 'credito', '2026-08-12', '17302.0001.26.00110-8', 'NOB', 'PAGAMENTO DA NL 26.00064-6 REF. NFS-E 1124', 36969.63, '26.00019-4', NULL, 'mes', 'casado', 5, 're', NULL),
  (8, 'a_n3', NULL, 'contabil', 'credito', '2026-08-12', '17302.0001.26.00111-6', 'NOB', 'PAGAMENTO DA NL 26.00066-2 REF. PARCELA DE JULHO/2026', 5628.48, '26.00019-4', NULL, 'mes', 'casado', 5, 're', NULL),
  (8, 'a_n4', NULL, 'contabil', 'credito', '2026-08-12', '17302.0001.26.00112-4', 'NOB', 'PAGAMENTO DA NL 26.00062-0 REF. RPA 027/2026', 4032.00, '26.00019-4', NULL, 'mes', 'casado', 5, 're', NULL),
  (8, 'a_b3', NULL, 'bancario', 'debito',  '2026-08-13', '426000194', '', 'EMISSAO ORDEM BANCARIA', 94795.11, '26.00019-4', NULL, 'mes', 'casado', 5, 're', NULL),
  (8, 'a_a1', NULL, 'contabil', 'debito',  '2026-08-10', '17302.0001.26.00058-2', 'ARR', 'COTA FINANCEIRA DO TESOURO ESTADUAL – AGOSTO/2026', 420000.00, NULL, NULL, 'mes', 'casado', 6, 'repasse', NULL),
  (8, 'a_b4', NULL, 'bancario', 'credito', '2026-08-10', '2026OB081052', '', 'ORDEM BANCARIA', 420000.00, NULL, NULL, 'mes', 'casado', 6, 'repasse', NULL),
  (8, 'a_q1', NULL, 'bancario', 'debito',  '2026-08-31', '', '', 'TARIFA PACOTE DE SERVIÇOS', 214.90, NULL, NULL, 'mes', 'pendente', NULL, NULL, NULL),
  (8, 'a_q2', NULL, 'bancario', 'credito', '2026-08-31', '', '', 'RENDIMENTOS APLICAÇÃO FINANCEIRA', 7102.55, NULL, NULL, 'mes', 'pendente', NULL, NULL, NULL),
  (8, 'a_q3', NULL, 'contabil', 'credito', '2026-08-28', '17302.0001.26.00131-8', 'NOB', 'PAGAMENTO DA NL 26.00076-0 REF. DIÁRIAS DE AGOSTO/2026', 3240.00, '26.00022-3', NULL, 'mes', 'pendente', NULL, NULL, NULL),
  -- setembro/2026 (rascunho)
  (9, 's_p3', 'a_p3', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'anterior', 'casado', 1, 'ob_cancelada', NULL),
  (9, 's_c1', NULL, 'contabil', 'debito',  '2026-09-04', '17302.0001.26.00141-5', 'NLA', 'ESTORNO DA NOB 26.00088-6 – ORDEM BANCÁRIA CANCELADA', 4312.50, NULL, NULL, 'mes', 'casado', 1, 'ob_cancelada', NULL),
  (9, 's_q2', 'a_q2', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'anterior', 'casado', 2, 'valor_data', NULL),
  (9, 's_c2', NULL, 'contabil', 'debito',  '2026-09-03', '17302.0001.26.00062-9', 'ARR', 'RENDIMENTOS DE APLICAÇÃO FINANCEIRA – AGOSTO/2026', 7102.55, NULL, NULL, 'mes', 'casado', 2, 'valor_data', NULL),
  (9, 's_q3', 'a_q3', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'anterior', 'casado', 3, 'valor_data', NULL),
  (9, 's_b1', NULL, 'bancario', 'debito',  '2026-09-01', '426000223', '', 'EMISSAO ORDEM BANCARIA', 3240.00, '26.00022-3', NULL, 'mes', 'casado', 3, 'valor_data', NULL),
  (9, 's_ab1', 'a_ab1', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'anterior', 'pendente', NULL, NULL, NULL),
  (9, 's_ab2', 'a_ab2', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'anterior', 'pendente', NULL, NULL, NULL),
  (9, 's_q1', 'a_q1', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'anterior', 'pendente', NULL, NULL, NULL),
  (9, 's_n1', NULL, 'contabil', 'credito', '2026-09-16', '17302.0001.26.00150-7', 'NOB', 'PAGAMENTO DA NL 26.00079-4 REF. NFS-E 457', 74288.72, '26.00024-0', NULL, 'mes', 'casado', 4, 're', NULL),
  (9, 's_n2', NULL, 'contabil', 'credito', '2026-09-16', '17302.0001.26.00151-5', 'NOB', 'PAGAMENTO DA NL 26.00091-3 REF. PARCELA DE AGOSTO/2026', 5628.48, '26.00024-0', NULL, 'mes', 'casado', 4, 're', NULL),
  (9, 's_n3', NULL, 'contabil', 'credito', '2026-09-16', '17302.0001.26.00152-3', 'NOB', 'PAGAMENTO DA NL 26.00095-6 REF. NF 9087', 40784.64, '26.00024-0', NULL, 'mes', 'casado', 4, 're', NULL),
  (9, 's_n4', NULL, 'contabil', 'credito', '2026-09-16', '17302.0001.26.00153-9', 'NOB', 'PAGAMENTO DA NL 26.00087-5 REF. NFS-E 789', 24895.20, '26.00024-0', NULL, 'mes', 'casado', 4, 're', NULL),
  (9, 's_b2', NULL, 'bancario', 'debito',  '2026-09-17', '426000240', '', 'EMISSAO ORDEM BANCARIA', 145597.04, '26.00024-0', NULL, 'mes', 'casado', 4, 're', NULL),
  (9, 's_a1', NULL, 'contabil', 'debito',  '2026-09-10', '17302.0001.26.00066-1', 'ARR', 'COTA FINANCEIRA DO TESOURO ESTADUAL – SETEMBRO/2026', 400000.00, NULL, NULL, 'mes', 'casado', 5, 'repasse', NULL),
  (9, 's_b3', NULL, 'bancario', 'credito', '2026-09-10', '2026OB091037', '', 'ORDEM BANCARIA', 400000.00, NULL, NULL, 'mes', 'casado', 5, 'repasse', NULL),
  (9, 's_q4', NULL, 'bancario', 'credito', '2026-09-18', '4260015390000', '', 'ORDEM BANC CANCELADA', 24895.20, NULL, '26.00153-9', 'mes', 'pendente', NULL, NULL, NULL),
  (9, 's_q5', NULL, 'bancario', 'debito',  '2026-09-30', '', '', 'TARIFA PACOTE DE SERVIÇOS', 214.90, NULL, NULL, 'mes', 'pendente', NULL, NULL, NULL),
  (9, 's_q6', NULL, 'bancario', 'credito', '2026-09-30', '', '', 'RENDIMENTOS APLICAÇÃO FINANCEIRA', 6581.33, NULL, NULL, 'mes', 'pendente', NULL, NULL, NULL);

DO $$
DECLARE
  v_conta constant uuid := 'd3070000-0000-4000-8000-000000000001';
  v_m int;
  v_id uuid;
  v_itens jsonb;
  v_razao numeric;
  v_rend numeric;
  v_aj numeric;
  v_comp date;
  v_mm text;
BEGIN
  FOREACH v_m IN ARRAY ARRAY[7, 8, 9] LOOP
    v_comp := make_date(2026, v_m, 1);
    v_mm := lpad(v_m::text, 2, '0');
    -- pendência trazida: copia o lançamento original e aponta para o item gravado no mês anterior
    UPDATE _ci a SET lado = o.lado, nat = o.nat, data = o.data, doc = o.doc, tipo = o.tipo, hist = o.hist, valor = o.valor,
           re = o.re, nob = o.nob
      FROM _ci o WHERE o.k = a.ok AND a.m = v_m;
    SELECT jsonb_agg(jsonb_build_object('lado', c.lado, 'natureza', c.nat, 'data', c.data, 'documento', c.doc, 'tipo', c.tipo,
             'historico', c.hist, 'valor', c.valor, 're', c.re, 'nob', c.nob, 'origem', c.origem,
             'item_origem_id', (SELECT o.sid FROM _ci o WHERE o.k = c.ok), 'situacao', c.sit, 'grupo', c.grupo,
             'regra', c.regra, 'justificativa', c.just) ORDER BY c.n)
      INTO v_itens FROM _ci c WHERE c.m = v_m;
    v_razao := CASE v_m WHEN 7 THEN 1243871.36 WHEN 8 THEN 1096340.15 ELSE 1002914.77 END;
    v_rend := CASE v_m WHEN 7 THEN 6874.12 WHEN 8 THEN 7102.55 ELSE 6581.33 END;
    v_id := public.salvar_conciliacao_mensal(v_conta, v_comp, jsonb_build_object(
      'saldo_razao', v_razao, 'saldo_conta', 0, 'saldo_fundo', 0, 'rendimento_fundo', v_rend,
      'arquivos', jsonb_build_array(
        jsonb_build_object('tipo', 'fip630', 'nome', 'FIP630_17302_0001_' || v_mm || '2026.pdf'),
        jsonb_build_object('tipo', 'fip103', 'nome', 'FIP103_RE_17302_0001_' || v_mm || '2026.pdf'),
        jsonb_build_object('tipo', 'ofx', 'nome', 'extrato_2617-6_11870-3_' || v_mm || '2026.ofx',
          'aplicacoes', CASE v_m WHEN 7 THEN 300000 WHEN 8 THEN 250000 ELSE 0 END,
          'resgates', CASE v_m WHEN 7 THEN 450000 WHEN 8 THEN 250000 ELSE 0 END),
        jsonb_build_object('tipo', 'extrato_fundo', 'nome', 'BB_RF_CP_Automatico_' || v_mm || '2026.pdf')),
      'observacoes', CASE v_m WHEN 7 THEN 'Mês de implantação: tarifas de março e junho/2026 lançadas como pendências de abertura.'
                              WHEN 9 THEN 'Aguardando o FIP630 definitivo de setembro para fechar.' END), v_itens);
    UPDATE _ci c SET sid = i.id FROM public.fin_conciliacao_itens i
     WHERE c.m = v_m AND i.conciliacao_id = v_id AND i.lado = c.lado AND i.natureza = c.nat AND i.data = c.data
       AND i.documento = c.doc AND i.valor = c.valor AND i.historico = c.hist AND i.origem = c.origem;
    IF EXISTS (SELECT 1 FROM _ci WHERE m = v_m AND sid IS NULL) THEN
      RAISE EXCEPTION 'conciliação %: item sem correspondência', v_comp;
    END IF;
    -- saldo do extrato no último dia: a conta movimento zera na aplicação automática; o fundo guarda o saldo
    SELECT v_razao
           - COALESCE(sum(valor) FILTER (WHERE lado = 'contabil' AND natureza = 'debito'), 0)
           + COALESCE(sum(valor) FILTER (WHERE lado = 'contabil' AND natureza = 'credito'), 0)
           - COALESCE(sum(valor) FILTER (WHERE lado = 'bancario' AND natureza = 'debito'), 0)
           + COALESCE(sum(valor) FILTER (WHERE lado = 'bancario' AND natureza = 'credito'), 0)
      INTO v_aj FROM public.fin_conciliacao_itens WHERE conciliacao_id = v_id AND situacao = 'pendente';
    UPDATE public.fin_conciliacoes_mensais SET saldo_fundo = v_aj,
           created_at = (v_comp + interval '1 month 4 days' + time '09:10')::timestamptz
     WHERE id = v_id;
    IF v_m < 9 THEN
      PERFORM public.fechar_conciliacao_mensal(v_id);
      -- data real do fechamento (o mês fechado só muda pela via de reabertura do admin)
      PERFORM set_config('idjuv.reabrindo_conciliacao', v_id::text, true);
      UPDATE public.fin_conciliacoes_mensais
         SET fechada_em = (v_comp + interval '1 month 10 days' + time '16:25')::timestamptz
       WHERE id = v_id;
      PERFORM set_config('idjuv.reabrindo_conciliacao', '', true);
    END IF;
  END LOOP;
END $$;

-- ===================================================================== fechamentos mensais e lançamentos contábeis
-- Nenhum gatilho gera fin_lancamentos_contabeis: os lançamentos saem aqui das liquidações aprovadas (VPD × fornecedores),
-- dos pagamentos pagos (fornecedores × bancos) e das receitas (bancos × transferências recebidas).
INSERT INTO public.fin_fechamentos (id, exercicio, mes, data_fechamento, total_receitas, total_despesas, resultado_mes, status,
  fechado_por, fechado_em, reaberto_por, reaberto_em, motivo_reabertura, observacoes, created_at)
SELECT ('d3180000-0000-4000-8000-0000000000' || lpad(m::text, 2, '0'))::uuid, 2026, m,
       CASE WHEN m < 10 THEN make_date(2026, m, 1) + interval '1 month 6 days' + time '18:00' END,
       rec, desp, rec - desp, CASE WHEN m < 10 THEN 'fechado' ELSE 'aberto' END,
       CASE WHEN m < 10 THEN auth.uid() END,
       CASE WHEN m < 10 THEN make_date(2026, m, 1) + interval '1 month 6 days' + time '18:00' END,
       CASE WHEN m = 8 THEN auth.uid() END,
       CASE WHEN m = 8 THEN timestamptz '2026-09-15 10:12-04' END,
       CASE WHEN m = 8 THEN 'Inclusão do rendimento de julho/2026 arrecadado em agosto (ARR 26.00053-0), que ficou fora do primeiro fechamento.' END,
       CASE WHEN m = 10 THEN 'Mês corrente: aguarda o fim da competência.' WHEN m = 8 THEN 'Refechado em 15/09/2026 após a reabertura.' END,
       make_date(2026, m, 1) + interval '1 month 6 days'
FROM (SELECT m,
             (SELECT coalesce(sum(valor), 0) FROM public.fin_receitas r WHERE r.exercicio = 2026 AND extract(month FROM r.data_receita) = m) AS rec,
             (SELECT coalesce(sum(valor_bruto), 0) FROM public.fin_pagamentos p WHERE p.exercicio = 2026 AND p.status = 'pago'
                 AND extract(month FROM p.data_pagamento) = m) AS desp
        FROM generate_series(1, 10) AS m) t;

WITH pc AS (SELECT codigo, id FROM public.fin_plano_contas),
lanc AS (
  SELECT l.data_liquidacao AS dt, 'liquidacao' AS tipo, l.id AS origem,
         (SELECT id FROM pc WHERE codigo = '4.1.2') AS deb,
         (SELECT id FROM pc WHERE codigo = '2.1.1.1') AS cred, l.valor_liquidado AS valor,
         'Apropriação da despesa – NL ' || l.numero || ' – ' || e.numero AS hist,
         initcap(replace(l.tipo_documento, '_', ' ')) || ' nº ' || l.numero_documento AS compl
    FROM public.fin_liquidacoes l JOIN public.fin_empenhos e ON e.id = l.empenho_id
   WHERE l.exercicio = 2026 AND l.status = 'aprovada'
  UNION ALL
  SELECT p.data_pagamento, 'pagamento', p.id, (SELECT id FROM pc WHERE codigo = '2.1.1.1'), (SELECT id FROM pc WHERE codigo = '1.1.1.2'),
         p.valor_bruto, 'Baixa da obrigação – ' || p.numero || ' – OB ' || coalesce(p.identificador_transacao, ''), p.observacoes
    FROM public.fin_pagamentos p WHERE p.exercicio = 2026 AND p.status = 'pago'
  UNION ALL
  SELECT r.data_receita, 'receita', r.id,
         (SELECT id FROM pc WHERE codigo = CASE WHEN r.tipo = 'rendimento_aplicacao' THEN '1.1.1.3' ELSE '1.1.1.2' END),
         (SELECT id FROM pc WHERE codigo = '5.1.1'), r.valor, r.origem_descricao, r.documento_origem
    FROM public.fin_receitas r WHERE r.exercicio = 2026
)
INSERT INTO public.fin_lancamentos_contabeis (numero, data_lancamento, data_competencia, conta_debito_id, conta_credito_id, valor,
  tipo_origem, origem_id, historico, complemento, exercicio, mes_referencia, fechamento_id, created_at, created_by)
SELECT 'LC-2026-' || lpad(row_number() OVER (ORDER BY dt, tipo, origem)::text, 5, '0'), dt, date_trunc('month', dt)::date, deb, cred, valor,
       tipo, origem, hist, compl, 2026, extract(month FROM dt)::int,
       ('d3180000-0000-4000-8000-0000000000' || lpad(extract(month FROM dt)::text, 2, '0'))::uuid, dt + time '17:30', auth.uid()
  FROM lanc;

-- ===================================================================== tabelas antigas (sem prefixo fin_) que ainda têm leitor
-- dotacoes_orcamentarias: lida pela RPC pública transparencia_execucao_orcamentaria (página de transparência);
-- espelha o QDD do FIPLAN acima. centros_custo: só a Edge Function database-schema lista. acoes: painel de Programas
-- (soma de meta_fisica das ações em execução). As antigas empenhos/liquidacoes/pagamentos ficam vazias: nenhuma tela lê.
INSERT INTO public.centros_custo (id, codigo, descricao, unidade_id, elemento_despesa, natureza_despesa, fonte_recurso, programa_trabalho, ativo) VALUES
  ('d3240000-0000-4000-8000-000000000001', 'CC-0101', 'Administração geral e manutenção da sede', 'a0000000-0000-4000-8000-000000000002', '30', '3.3.90.30', '1.500', '27.122.030.2544', true),
  ('d3240000-0000-4000-8000-000000000002', 'CC-0102', 'Gestão financeira e contábil', 'a0000000-0000-4000-8000-000000000006', '39', '3.3.90.39', '1.500', '27.122.030.2544', true),
  ('d3240000-0000-4000-8000-000000000003', 'CC-0201', 'Jogos e competições esportivas', 'a0000000-0000-4000-8000-000000000003', '39', '3.3.90.39', '1.500', '27.812.031.2545', true),
  ('d3240000-0000-4000-8000-000000000004', 'CC-0202', 'Infraestrutura esportiva', 'a0000000-0000-4000-8000-000000000003', '52', '4.4.90.52', '1.700', '27.812.031.1083', true),
  ('d3240000-0000-4000-8000-000000000005', 'CC-0301', 'Protagonismo juvenil', 'a0000000-0000-4000-8000-000000000004', '39', '3.3.90.39', '1.501', '27.813.032.2547', true),
  ('d3240000-0000-4000-8000-000000000006', 'CC-0901', 'Eventos comemorativos (desativado em 2025)', 'a0000000-0000-4000-8000-000000000008', '39', '3.3.90.39', '1.500', '27.122.030.2544', false);

INSERT INTO public.dotacoes_orcamentarias (id, exercicio, unidade_orcamentaria, funcao, subfuncao, programa, acao_orcamentaria,
  categoria_economica, grupo_despesa, modalidade_aplicacao, elemento_despesa, fonte_recurso, descricao_fonte,
  valor_inicial, valor_suplementado, valor_anulado, valor_empenhado, valor_liquidado, valor_pago, centro_custo_id, created_by)
SELECT ('d3230000' || substr(d.id::text, 9))::uuid, d.exercicio, '17302', split_part(d.codigo_dotacao, '.', 1), split_part(d.codigo_dotacao, '.', 2),
       '0' || split_part(d.codigo_dotacao, '.', 3), split_part(d.codigo_dotacao, '.', 4),
       substr(split_part(d.codigo_dotacao, '.', 6), 1, 1), substr(split_part(d.codigo_dotacao, '.', 6), 2, 1),
       substr(split_part(d.codigo_dotacao, '.', 6), 3, 2), substr(split_part(d.codigo_dotacao, '.', 6), 5, 2),
       split_part(d.codigo_dotacao, '.', 7) || split_part(d.codigo_dotacao, '.', 8), f.nome,
       d.valor_inicial, d.valor_suplementado, d.valor_reduzido, d.valor_empenhado, d.valor_liquidado, d.valor_pago,
       CASE split_part(d.codigo_dotacao, '.', 4) WHEN '2544' THEN 'd3240000-0000-4000-8000-000000000001'::uuid
            WHEN '2545' THEN 'd3240000-0000-4000-8000-000000000003'::uuid WHEN '2546' THEN 'd3240000-0000-4000-8000-000000000003'::uuid
            WHEN '1083' THEN 'd3240000-0000-4000-8000-000000000004'::uuid ELSE 'd3240000-0000-4000-8000-000000000005'::uuid END,
       auth.uid()
  FROM public.fin_dotacoes d JOIN public.fin_fontes_recurso f ON f.id = d.fonte_recurso_id
 WHERE d.id::text LIKE 'd3050000-%';

INSERT INTO public.creditos_adicionais (id, dotacao_id, tipo, numero_decreto, data_decreto, valor, origem, dotacao_origem_id, justificativa, created_by) VALUES
  ('d3260000-0000-4000-8000-000000000001', 'd3230000-0000-4000-8000-000000000006', 'suplementar', '35.418-E', '2026-04-15', 40000.00, 'anulacao',
   'd3230000-0000-4000-8000-000000000001', 'Crédito suplementar por anulação parcial da dotação de material de consumo da sede (ALT-000001), para material esportivo e premiação do JER 2026.', auth.uid()),
  ('d3260000-0000-4000-8000-000000000002', 'd3230000-0000-4000-8000-000000000007', 'suplementar', '35.602-E', '2026-05-25', 120000.00, 'superavit',
   NULL, 'Crédito suplementar por superávit financeiro de 2025 (ALT-000002), para locação de estruturas e transporte das delegações da fase estadual do JER 2026.', auth.uid()),
  ('d3260000-0000-4000-8000-000000000003', 'd3230000-0000-4000-8000-000000000004', 'suplementar', '35.511-E', '2026-05-06', 15000.00, 'anulacao',
   'd3230000-0000-4000-8000-000000000005', 'Crédito suplementar por anulação de passagens e locomoção para reforço de diárias de servidores em deslocamento ao interior (ALT-000003).', auth.uid());

INSERT INTO public.acoes (id, programa_id, codigo, nome, descricao, tipo, meta_fisica, meta_financeira, unidade_medida, data_inicio, data_fim, situacao, created_by)
SELECT a.id::uuid, p.id, a.codigo, a.nome, a.descr, a.tipo, a.meta_f, a.meta_fin, a.un, a.ini::date, a.fim::date, a.sit, auth.uid()
FROM (VALUES
  ('d3250000-0000-4000-8000-000000000001', 'PRG-01', '2547.01', 'Rodas de conversa Juventude Protagonista', 'Encontros mensais nas escolas estaduais da capital e do interior sobre participação juvenil e projeto de vida.', 'atividade', 1850, 96000.00, 'jovem atendido', '2026-03-02', '2026-11-30', 'em_execucao'),
  ('d3250000-0000-4000-8000-000000000002', 'PRG-01', '2547.02', 'Festival Juventude em Movimento', 'Festival de cultura urbana e esporte de rua na Praça das Águas.', 'projeto', 3000, 21300.00, 'participante', '2026-08-22', '2026-08-23', 'cancelada'),
  ('d3250000-0000-4000-8000-000000000003', 'PRG-01', '2547.03', 'Conferência Estadual de Juventude 2026', 'Etapas regionais e etapa estadual da conferência.', 'projeto', 420, 48000.00, 'delegado', '2026-11-05', '2026-11-07', 'planejada'),
  ('d3250000-0000-4000-8000-000000000004', 'PRG-02', '2545.01', 'Núcleos de iniciação esportiva nos municípios', 'Turmas de futsal, vôlei, atletismo e judô para crianças e adolescentes de 7 a 17 anos.', 'atividade', 2640, 180000.00, 'aluno matriculado', '2026-02-09', '2026-12-11', 'em_execucao'),
  ('d3250000-0000-4000-8000-000000000005', 'PRG-02', '2545.02', 'Jogos Escolares de Roraima – JER 2026', 'Etapas municipais e fase estadual dos jogos escolares.', 'projeto', 4120, 412000.00, 'atleta inscrito', '2026-05-04', '2026-09-26', 'concluida'),
  ('d3250000-0000-4000-8000-000000000006', 'PRG-02', '2545.03', 'Formação de professores de educação física', 'Curso de 40 horas sobre iniciação esportiva e inclusão.', 'atividade', 160, 24000.00, 'professor capacitado', '2026-07-13', '2026-12-04', 'suspensa')
) AS a(id, prog, codigo, nome, descr, tipo, meta_f, meta_fin, un, ini, fim, sit)
JOIN public.programas p ON p.codigo = a.prog;

-- ===================================================================== catálogo CATMAT/CATSER (recorte usado pelo PCA)
INSERT INTO public.cat_material_pdms (id, codigo_pdm, nome_pdm, codigo_classe, nome_classe, codigo_grupo, nome_grupo, ativo, atualizado_em)
SELECT ('d3270000-0000-4000-8000-0000000000' || lpad(row_number() OVER ()::text, 2, '0'))::uuid, p.*, timestamptz '2026-10-05 03:12-04'
FROM (VALUES
  (4325, 'BOLA ESPORTIVA', 7810, 'ARTIGOS PARA ESPORTES ATLÉTICOS', 78, 'EQUIPAMENTOS PARA ESPORTES E RECREAÇÃO', true),
  (5124, 'REDE ESPORTIVA', 7810, 'ARTIGOS PARA ESPORTES ATLÉTICOS', 78, 'EQUIPAMENTOS PARA ESPORTES E RECREAÇÃO', true),
  (12043, 'CONE DE SINALIZAÇÃO ESPORTIVA', 7810, 'ARTIGOS PARA ESPORTES ATLÉTICOS', 78, 'EQUIPAMENTOS PARA ESPORTES E RECREAÇÃO', true),
  (7781, 'TATAME', 7810, 'ARTIGOS PARA ESPORTES ATLÉTICOS', 78, 'EQUIPAMENTOS PARA ESPORTES E RECREAÇÃO', true),
  (8936, 'COLCHONETE GINÁSTICA', 7830, 'EQUIPAMENTOS DE RECREAÇÃO E GINÁSTICA', 78, 'EQUIPAMENTOS PARA ESPORTES E RECREAÇÃO', true),
  (9437, 'TRAVE ESPORTIVA', 7830, 'EQUIPAMENTOS DE RECREAÇÃO E GINÁSTICA', 78, 'EQUIPAMENTOS PARA ESPORTES E RECREAÇÃO', true),
  (13210, 'TABELA DE BASQUETEBOL', 7830, 'EQUIPAMENTOS DE RECREAÇÃO E GINÁSTICA', 78, 'EQUIPAMENTOS PARA ESPORTES E RECREAÇÃO', true),
  (6150, 'MEDALHA', 8455, 'INSÍGNIAS, CONDECORAÇÕES E PRÊMIOS', 84, 'VESTUÁRIO, EQUIPAMENTOS INDIVIDUAIS E INSÍGNIAS', true),
  (6153, 'TROFÉU', 8455, 'INSÍGNIAS, CONDECORAÇÕES E PRÊMIOS', 84, 'VESTUÁRIO, EQUIPAMENTOS INDIVIDUAIS E INSÍGNIAS', true),
  (11502, 'UNIFORME ESPORTIVO', 8415, 'VESTUÁRIO ESPECIAL', 84, 'VESTUÁRIO, EQUIPAMENTOS INDIVIDUAIS E INSÍGNIAS', true),
  (2894, 'ÁGUA MINERAL NATURAL', 8960, 'BEBIDAS NÃO ALCOÓLICAS', 89, 'SUBSISTÊNCIA', true),
  (3990, 'KIT PRIMEIROS SOCORROS', 6545, 'CONJUNTOS, ESTOJOS E JOGOS MÉDICOS', 65, 'EQUIPAMENTOS E ARTIGOS PARA USO MÉDICO, DENTÁRIO E VETERINÁRIO', true),
  (5512, 'CRONÔMETRO', 6645, 'INSTRUMENTOS DE MEDIÇÃO DE TEMPO', 66, 'INSTRUMENTOS E EQUIPAMENTOS DE LABORATÓRIO', true),
  (4467, 'PAPEL A4', 7530, 'ARTIGOS DE PAPELARIA E FORMULÁRIOS', 75, 'UTENSÍLIOS DE ESCRITÓRIO E MATERIAL DE EXPEDIENTE', true),
  (2178, 'CANETA ESFEROGRÁFICA', 7510, 'ARTIGOS DE EXPEDIENTE', 75, 'UTENSÍLIOS DE ESCRITÓRIO E MATERIAL DE EXPEDIENTE', true),
  (14862, 'MICROCOMPUTADOR', 7010, 'EQUIPAMENTOS DE TIC – CONFIGURAÇÕES', 70, 'EQUIPAMENTOS DE TECNOLOGIA DA INFORMAÇÃO E COMUNICAÇÃO', true),
  (3305, 'BOLA DE BORRACHA RECREATIVA', 7810, 'ARTIGOS PARA ESPORTES ATLÉTICOS', 78, 'EQUIPAMENTOS PARA ESPORTES E RECREAÇÃO', false)
) AS p(codigo_pdm, nome_pdm, codigo_classe, nome_classe, codigo_grupo, nome_grupo, ativo);

INSERT INTO public.cat_material_itens (id, codigo_item, codigo_pdm, descricao, sustentavel, ativo, atualizado_em)
SELECT ('d3280000-0000-4000-8000-0000000000' || lpad(row_number() OVER ()::text, 2, '0'))::uuid, i.*, timestamptz '2026-10-05 03:12-04'
FROM (VALUES
  (447120, 4325, 'BOLA FUTSAL, MATERIAL: POLIURETANO, CIRCUNFERÊNCIA: 61 A 64 CM, PESO: 410 A 440 G, TIPO: OFICIAL, CÂMARA: BUTIL', false, true),
  (447133, 4325, 'BOLA VOLEIBOL, MATERIAL: MICROFIBRA, CIRCUNFERÊNCIA: 65 A 67 CM, PESO: 260 A 280 G, TIPO: OFICIAL', false, true),
  (452871, 4325, 'BOLA BASQUETEBOL, MATERIAL: BORRACHA, TAMANHO: 7, TIPO: TREINAMENTO', false, true),
  (452902, 4325, 'BOLA HANDEBOL, MATERIAL: POLIURETANO, TAMANHO: H2L, TIPO: OFICIAL', false, true),
  (461544, 5124, 'REDE VOLEIBOL, MATERIAL: NYLON 4 MM, COMPRIMENTO: 9,50 M, FAIXA: LONA, TIPO: OFICIAL', false, true),
  (461560, 5124, 'REDE FUTSAL, MATERIAL: POLIETILENO 4 MM, MALHA: 12 CM, PAR', false, true),
  (488219, 12043, 'CONE TREINAMENTO, MATERIAL: PVC FLEXÍVEL, ALTURA: 23 CM, CORES SORTIDAS', false, true),
  (403318, 7781, 'TATAME, MATERIAL: EVA, ESPESSURA: 40 MM, DIMENSÕES: 1 X 1 M, ENCAIXE: QUEBRA-CABEÇA', true, true),
  (412906, 8936, 'COLCHONETE GINÁSTICA, MATERIAL: ESPUMA D33, REVESTIMENTO: CORVIM, DIMENSÕES: 100 X 60 X 5 CM', false, true),
  (472215, 9437, 'TRAVE FUTSAL, MATERIAL: AÇO GALVANIZADO, DIMENSÕES: 3 X 2 M, PAR, COM REDE', false, true),
  (478804, 13210, 'TABELA BASQUETEBOL, MATERIAL: ACRÍLICO 10 MM, DIMENSÕES: 1,80 X 1,05 M, COM ARO RETRÁTIL', false, true),
  (430051, 6150, 'MEDALHA, MATERIAL: ZAMAC, DIÂMETRO: 60 MM, ACABAMENTO: OURO/PRATA/BRONZE, COM FITA PERSONALIZADA', false, true),
  (430078, 6153, 'TROFÉU, MATERIAL: METAL E BASE EM MADEIRA, ALTURA: 45 CM, COM PLAQUETA GRAVADA', false, true),
  (455402, 11502, 'UNIFORME ESPORTIVO, COMPOSIÇÃO: CAMISA E CALÇÃO, TECIDO: POLIÉSTER DRY FIT, SUBLIMADO', true, true),
  (409915, 2894, 'ÁGUA MINERAL NATURAL, SEM GÁS, EMBALAGEM: GARRAFA PET 500 ML, FARDO COM 12 UNIDADES', false, true),
  (420374, 3990, 'KIT PRIMEIROS SOCORROS, MALETA COM GAZE, ATADURA, ESPARADRAPO, SORO, LUVAS E BOLSA TÉRMICA', false, true),
  (436720, 5512, 'CRONÔMETRO DIGITAL, MEMÓRIA: 100 VOLTAS, PRECISÃO: 1/100 S, RESISTENTE À ÁGUA', false, true),
  (461093, 4467, 'PAPEL A4, GRAMATURA: 75 G/M², BRANCO, RESMA COM 500 FOLHAS, FIBRA DE EUCALIPTO CERTIFICADA', true, true),
  (461218, 2178, 'CANETA ESFEROGRÁFICA, TINTA AZUL, PONTA MÉDIA 1,0 MM, CORPO TRANSPARENTE', false, true),
  (489502, 14862, 'MICROCOMPUTADOR, PROCESSADOR 8 NÚCLEOS, MEMÓRIA 16 GB, SSD 512 GB, MONITOR 23,8 POL', true, true),
  (398210, 3305, 'BOLA DE BORRACHA RECREATIVA Nº 8, CORES SORTIDAS', false, false)
) AS i(codigo_item, codigo_pdm, descricao, sustentavel, ativo);

INSERT INTO public.cat_servicos (id, codigo_servico, nome_servico, codigo_classe, nome_classe, codigo_grupo, nome_grupo, codigo_divisao, nome_divisao,
  codigo_secao, nome_secao, ativo, atualizado_em)
SELECT ('d3290000-0000-4000-8000-0000000000' || lpad(row_number() OVER ()::text, 2, '0'))::uuid, s.*, timestamptz '2026-10-05 03:20-04'
FROM (VALUES
  (22594, 'LOCAÇÃO DE VEÍCULO TIPO ÔNIBUS COM MOTORISTA', 6411, 'TRANSPORTE RODOVIÁRIO DE PASSAGEIROS', 641, 'TRANSPORTE TERRESTRE DE PASSAGEIROS', 64, 'SERVIÇOS DE TRANSPORTE TERRESTRE', 6, 'SERVIÇOS DE DISTRIBUIÇÃO, HOSPEDAGEM, ALIMENTAÇÃO E TRANSPORTE', true),
  (14974, 'FORNECIMENTO DE REFEIÇÕES PRONTAS (MARMITEX E LANCHES)', 6331, 'SERVIÇOS DE FORNECIMENTO DE REFEIÇÕES', 633, 'SERVIÇOS DE ALIMENTAÇÃO', 63, 'SERVIÇOS DE HOSPEDAGEM E ALIMENTAÇÃO', 6, 'SERVIÇOS DE DISTRIBUIÇÃO, HOSPEDAGEM, ALIMENTAÇÃO E TRANSPORTE', true),
  (13161, 'HOSPEDAGEM EM HOTEL COM CAFÉ DA MANHÃ', 6311, 'SERVIÇOS DE HOSPEDAGEM', 631, 'SERVIÇOS DE HOSPEDAGEM', 63, 'SERVIÇOS DE HOSPEDAGEM E ALIMENTAÇÃO', 6, 'SERVIÇOS DE DISTRIBUIÇÃO, HOSPEDAGEM, ALIMENTAÇÃO E TRANSPORTE', true),
  (17663, 'ORGANIZAÇÃO E EXECUÇÃO DE EVENTOS ESPORTIVOS', 8596, 'SERVIÇOS DE ORGANIZAÇÃO DE EVENTOS', 859, 'OUTROS SERVIÇOS DE APOIO', 85, 'SERVIÇOS DE APOIO', 8, 'SERVIÇOS PRESTADOS ÀS EMPRESAS E À ADMINISTRAÇÃO PÚBLICA', true),
  (3794, 'LOCAÇÃO DE ESTRUTURAS PARA EVENTOS (TENDAS, PALCO, ARQUIBANCADA E GRADIL)', 7322, 'LOCAÇÃO DE BENS MÓVEIS', 732, 'ARRENDAMENTO E LOCAÇÃO SEM OPERADOR', 73, 'SERVIÇOS DE ARRENDAMENTO E LOCAÇÃO', 7, 'SERVIÇOS FINANCEIROS, IMOBILIÁRIOS E DE LOCAÇÃO', true),
  (18651, 'REMOÇÃO EM AMBULÂNCIA COM EQUIPE DE SUPORTE BÁSICO', 9312, 'SERVIÇOS DE ATENÇÃO À SAÚDE', 931, 'SERVIÇOS DE SAÚDE HUMANA', 93, 'SERVIÇOS DE SAÚDE E ASSISTÊNCIA SOCIAL', 9, 'SERVIÇOS COMUNITÁRIOS, SOCIAIS E PESSOAIS', true),
  (5355, 'SERVIÇOS GRÁFICOS – IMPRESSÃO OFFSET E DIGITAL', 8912, 'SERVIÇOS DE IMPRESSÃO', 891, 'SERVIÇOS DE EDIÇÃO E IMPRESSÃO', 89, 'OUTROS SERVIÇOS DE FABRICAÇÃO', 8, 'SERVIÇOS PRESTADOS ÀS EMPRESAS E À ADMINISTRAÇÃO PÚBLICA', true),
  (3727, 'AGENCIAMENTO DE VIAGENS – PASSAGENS AÉREAS NACIONAIS', 6781, 'SERVIÇOS DE AGÊNCIA DE VIAGENS', 678, 'SERVIÇOS DE APOIO AO TRANSPORTE', 67, 'SERVIÇOS DE APOIO AO TRANSPORTE', 6, 'SERVIÇOS DE DISTRIBUIÇÃO, HOSPEDAGEM, ALIMENTAÇÃO E TRANSPORTE', true),
  (16837, 'MANUTENÇÃO PREVENTIVA E CORRETIVA PREDIAL', 5421, 'SERVIÇOS DE MANUTENÇÃO DE EDIFICAÇÕES', 542, 'SERVIÇOS DE CONSTRUÇÃO', 54, 'SERVIÇOS DE CONSTRUÇÃO', 5, 'SERVIÇOS DE CONSTRUÇÃO', true),
  (26972, 'SUPORTE TÉCNICO E MANUTENÇÃO DE EQUIPAMENTOS DE INFORMÁTICA', 8715, 'SERVIÇOS DE MANUTENÇÃO DE COMPUTADORES', 871, 'SERVIÇOS DE MANUTENÇÃO E REPARO', 87, 'SERVIÇOS DE MANUTENÇÃO, REPARO E INSTALAÇÃO', 8, 'SERVIÇOS PRESTADOS ÀS EMPRESAS E À ADMINISTRAÇÃO PÚBLICA', true),
  (24619, 'ARBITRAGEM DESPORTIVA', 9662, 'SERVIÇOS DE APOIO AO ESPORTE', 966, 'SERVIÇOS ESPORTIVOS', 96, 'SERVIÇOS RECREATIVOS, CULTURAIS E ESPORTIVOS', 9, 'SERVIÇOS COMUNITÁRIOS, SOCIAIS E PESSOAIS', true),
  (8605, 'SEGURANÇA PATRIMONIAL EM EVENTOS', 8525, 'SERVIÇOS DE SEGURANÇA', 852, 'SERVIÇOS DE INVESTIGAÇÃO E SEGURANÇA', 85, 'SERVIÇOS DE APOIO', 8, 'SERVIÇOS PRESTADOS ÀS EMPRESAS E À ADMINISTRAÇÃO PÚBLICA', true),
  (2135, 'LOCAÇÃO DE SONORIZAÇÃO SIMPLES', 7322, 'LOCAÇÃO DE BENS MÓVEIS', 732, 'ARRENDAMENTO E LOCAÇÃO SEM OPERADOR', 73, 'SERVIÇOS DE ARRENDAMENTO E LOCAÇÃO', 7, 'SERVIÇOS FINANCEIROS, IMOBILIÁRIOS E DE LOCAÇÃO', false)
) AS s(codigo_servico, nome_servico, codigo_classe, nome_classe, codigo_grupo, nome_grupo, codigo_divisao, nome_divisao, codigo_secao, nome_secao, ativo);

INSERT INTO public.cat_sincronizacoes (id, tipo, total, atualizado_em, atualizado_por) VALUES
  ('d32a0000-0000-4000-8000-000000000001', 'pdm', (SELECT count(*) FROM public.cat_material_pdms), timestamptz '2026-10-05 03:12-04', auth.uid()),
  ('d32a0000-0000-4000-8000-000000000002', 'servico', (SELECT count(*) FROM public.cat_servicos), timestamptz '2026-10-05 03:20-04', auth.uid());

-- ===================================================================== PCA: 2026 publicado (tetos do QDD) e 2027 em elaboração (tetos da PLOA)
-- O gatilho pca_carimbar faz todo plano nascer rascunho; a situação avança por UPDATE, como na tela, e o
-- pca_registrar_historico grava o histórico (datas acertadas no fim).
INSERT INTO public.pca_planos (id, exercicio, observacoes, created_at) VALUES
  ('d3200000-0000-4000-8000-000000000001', 2026, 'PCA 2026 consolidado a partir dos DFDs das diretorias; tetos conferidos com o QDD de 2026.', timestamptz '2025-09-15 09:00-04'),
  ('d3200000-0000-4000-8000-000000000002', 2027, 'Elaborado sobre os tetos da PLOA 2027 encaminhada à SEPLAN. Ajustar pelo QDD quando a LOA for publicada.', timestamptz '2026-08-03 08:40-04');

SELECT public.pca_usar_qdd('d3200000-0000-4000-8000-000000000001') AS _n \gset

INSERT INTO public.pca_tetos (plano_id, acao_id, fonte_recurso_id, valor_previsto, origem, created_at) VALUES
  ('d3200000-0000-4000-8000-000000000002', 'd3040000-0000-4000-8000-000000000001', 'd3010000-0000-4000-8000-000000000001', 1420000.00, 'ploa', timestamptz '2026-08-05 10:00-04'),
  ('d3200000-0000-4000-8000-000000000002', 'd3040000-0000-4000-8000-000000000002', 'd3010000-0000-4000-8000-000000000001', 1680000.00, 'ploa', timestamptz '2026-08-05 10:00-04'),
  ('d3200000-0000-4000-8000-000000000002', 'd3040000-0000-4000-8000-000000000003', 'd3010000-0000-4000-8000-000000000001', 560000.00, 'ploa', timestamptz '2026-08-05 10:00-04'),
  ('d3200000-0000-4000-8000-000000000002', 'd3040000-0000-4000-8000-000000000004', 'd3010000-0000-4000-8000-000000000001', 380000.00, 'ploa', timestamptz '2026-08-05 10:00-04'),
  ('d3200000-0000-4000-8000-000000000002', 'd3040000-0000-4000-8000-000000000004', 'd3010000-0000-4000-8000-000000000003', 900000.00, 'ploa', timestamptz '2026-08-05 10:00-04'),
  ('d3200000-0000-4000-8000-000000000002', 'd3040000-0000-4000-8000-000000000005', 'd3010000-0000-4000-8000-000000000002', 290000.00, 'ploa', timestamptz '2026-08-05 10:00-04');

INSERT INTO public.pca_itens (id, plano_id, numero_sei, setor_id, tipo, codigo_pdm, codigo_servico, codigo_item, descricao, unidade_fornecimento,
  quantidade, valor_unitario, mes_desejado, prioridade, acao_id, fonte_recurso_id, natureza_despesa_id, justificativa, origem, created_at)
SELECT i.id::uuid, i.plano::uuid, i.sei, i.setor::uuid, i.tipo, i.pdm, i.serv, i.item, i.descr, i.un, i.qtd, i.vu, i.mes, i.prio,
       i.acao::uuid, i.fonte::uuid, (SELECT n.id FROM public.fin_naturezas_despesa n WHERE n.codigo = i.nat), i.just, i.orig, i.criado::timestamptz
FROM (VALUES
  -- PCA 2026
  ('d3210000-0000-4000-8000-000000000001', 'd3200000-0000-4000-8000-000000000001', '18101.000214/2025-61', 'a0000000-0000-4000-8000-000000000003', 'material', 6150, NULL::int, 430051, 'Medalhas para os Jogos Escolares de Roraima 2026 (ouro, prata e bronze)', 'unidade', 3600, 8.90, 4, 'alta', 'd3040000-0000-4000-8000-000000000002', 'd3010000-0000-4000-8000-000000000001', '3.3.90.31', 'Premiação de todas as modalidades do JER 2026.', 'dfd', '2025-09-22 10:00-04'),
  ('d3210000-0000-4000-8000-000000000002', 'd3200000-0000-4000-8000-000000000001', '18101.000214/2025-61', 'a0000000-0000-4000-8000-000000000003', 'material', 6153, NULL, 430078, 'Troféus para as equipes campeãs do JER 2026', 'unidade', 210, 96.50, 4, 'alta', 'd3040000-0000-4000-8000-000000000002', 'd3010000-0000-4000-8000-000000000001', '3.3.90.31', NULL, 'dfd', '2025-09-22 10:05-04'),
  ('d3210000-0000-4000-8000-000000000003', 'd3200000-0000-4000-8000-000000000001', '18101.000219/2025-02', 'a0000000-0000-4000-8000-000000000003', 'servico', NULL, 22594, NULL, 'Locação de ônibus com motorista para transporte das delegações municipais', 'diária', 160, 1980.00, 5, 'alta', 'd3040000-0000-4000-8000-000000000002', 'd3010000-0000-4000-8000-000000000001', '3.3.90.39', 'Deslocamento das delegações dos 15 municípios para a fase estadual.', 'dfd', '2025-09-24 14:30-04'),
  ('d3210000-0000-4000-8000-000000000004', 'd3200000-0000-4000-8000-000000000001', '18101.000223/2025-48', 'a0000000-0000-4000-8000-000000000003', 'servico', NULL, 14974, NULL, 'Fornecimento de refeições prontas para atletas e comissões técnicas', 'refeição', 6800, 12.00, 8, 'media', 'd3040000-0000-4000-8000-000000000002', 'd3010000-0000-4000-8000-000000000001', '3.3.90.39', NULL, 'dfd', '2025-09-25 09:10-04'),
  ('d3210000-0000-4000-8000-000000000005', 'd3200000-0000-4000-8000-000000000001', '18101.000231/2025-77', 'a0000000-0000-4000-8000-000000000002', 'material', 4467, NULL, 461093, 'Papel A4 para a sede', 'resma', 900, 27.40, 2, 'baixa', 'd3040000-0000-4000-8000-000000000001', 'd3010000-0000-4000-8000-000000000001', '3.3.90.30', NULL, 'dfd', '2025-09-30 11:00-04'),
  ('d3210000-0000-4000-8000-000000000006', 'd3200000-0000-4000-8000-000000000001', '18101.000236/2025-15', 'a0000000-0000-4000-8000-000000000003', 'material', 9437, NULL, 472215, 'Traves de futsal para os ginásios do interior', 'par', 24, 3150.00, 6, 'media', 'd3040000-0000-4000-8000-000000000004', 'd3010000-0000-4000-8000-000000000003', '4.4.90.52', 'Reposição de traves em ginásios de 8 municípios (convênio federal).', 'dfd', '2025-10-02 16:20-04'),
  -- PCA 2027
  ('d3210000-0000-4000-8000-000000000011', 'd3200000-0000-4000-8000-000000000002', '18101.000412/2026-33', 'a0000000-0000-4000-8000-000000000003', 'material', 6150, NULL, 430051, 'Medalhas para os Jogos Escolares de Roraima 2027', 'unidade', 3800, 9.35, 4, 'alta', 'd3040000-0000-4000-8000-000000000002', 'd3010000-0000-4000-8000-000000000001', '3.3.90.31', 'Premiação das 16 modalidades do JER 2027 nas categorias 12 a 14 e 15 a 17 anos.', 'dfd', '2026-08-10 09:00-04'),
  ('d3210000-0000-4000-8000-000000000012', 'd3200000-0000-4000-8000-000000000002', '18101.000412/2026-33', 'a0000000-0000-4000-8000-000000000003', 'material', 6153, NULL, 430078, 'Troféus para as equipes campeãs do JER 2027', 'unidade', 220, 101.80, 4, 'alta', 'd3040000-0000-4000-8000-000000000002', 'd3010000-0000-4000-8000-000000000001', '3.3.90.31', NULL, 'dfd', '2026-08-10 09:05-04'),
  ('d3210000-0000-4000-8000-000000000013', 'd3200000-0000-4000-8000-000000000002', '18101.000418/2026-90', 'a0000000-0000-4000-8000-000000000003', 'material', 4325, NULL, 447120, 'Bolas oficiais de futsal para os núcleos de iniciação esportiva', 'unidade', 480, 139.90, 3, 'media', 'd3040000-0000-4000-8000-000000000002', 'd3010000-0000-4000-8000-000000000001', '3.3.90.30', NULL, 'dfd', '2026-08-12 10:30-04'),
  ('d3210000-0000-4000-8000-000000000014', 'd3200000-0000-4000-8000-000000000002', '18101.000418/2026-90', 'a0000000-0000-4000-8000-000000000003', 'material', 4325, NULL, 447133, 'Bolas oficiais de voleibol para os núcleos de iniciação esportiva', 'unidade', 360, 164.50, 3, 'media', 'd3040000-0000-4000-8000-000000000002', 'd3010000-0000-4000-8000-000000000001', '3.3.90.30', NULL, 'dfd', '2026-08-12 10:35-04'),
  ('d3210000-0000-4000-8000-000000000015', 'd3200000-0000-4000-8000-000000000002', '18101.000418/2026-90', 'a0000000-0000-4000-8000-000000000003', 'material', 5124, NULL, 461544, 'Redes oficiais de voleibol', 'unidade', 40, 412.00, 3, 'baixa', 'd3040000-0000-4000-8000-000000000002', 'd3010000-0000-4000-8000-000000000001', '3.3.90.30', NULL, 'dfd', '2026-08-12 10:40-04'),
  ('d3210000-0000-4000-8000-000000000016', 'd3200000-0000-4000-8000-000000000002', '18101.000418/2026-90', 'a0000000-0000-4000-8000-000000000003', 'material', 7781, NULL, 403318, 'Tatames de EVA para as turmas de judô', 'unidade', 300, 118.70, 2, 'media', 'd3040000-0000-4000-8000-000000000003', 'd3010000-0000-4000-8000-000000000001', '3.3.90.30', NULL, 'dfd', '2026-08-12 10:50-04'),
  ('d3210000-0000-4000-8000-000000000017', 'd3200000-0000-4000-8000-000000000002', '18101.000418/2026-90', 'a0000000-0000-4000-8000-000000000003', 'material', 11502, NULL, 455402, 'Uniformes das seleções roraimenses para os Jogos Escolares Brasileiros', 'conjunto', 420, 96.00, 6, 'alta', 'd3040000-0000-4000-8000-000000000003', 'd3010000-0000-4000-8000-000000000001', '3.3.90.30', NULL, 'dfd', '2026-08-13 15:00-04'),
  ('d3210000-0000-4000-8000-000000000018', 'd3200000-0000-4000-8000-000000000002', '18101.000425/2026-12', 'a0000000-0000-4000-8000-000000000003', 'material', 13210, NULL, 478804, 'Tabelas de basquetebol para ginásios estaduais', 'par', 6, 9870.00, 7, 'media', 'd3040000-0000-4000-8000-000000000004', 'd3010000-0000-4000-8000-000000000003', '4.4.90.52', 'Recuperação dos ginásios Hélio Campos e Vicente Feola com recursos do convênio federal.', 'dfd', '2026-08-14 09:20-04'),
  ('d3210000-0000-4000-8000-000000000019', 'd3200000-0000-4000-8000-000000000002', '18101.000425/2026-12', 'a0000000-0000-4000-8000-000000000002', 'material', 14862, NULL, 489502, 'Microcomputadores para a Divisão de Finanças e a Divisão de Compras', 'unidade', 12, 5490.00, 5, 'media', 'd3040000-0000-4000-8000-000000000004', 'd3010000-0000-4000-8000-000000000001', '4.4.90.52', NULL, 'dfd', '2026-08-14 09:40-04'),
  ('d3210000-0000-4000-8000-000000000020', 'd3200000-0000-4000-8000-000000000002', '18101.000431/2026-58', 'a0000000-0000-4000-8000-000000000003', 'servico', NULL, 22594, NULL, 'Locação de ônibus com motorista para as delegações do JER 2027', 'diária', 170, 2050.00, 5, 'alta', 'd3040000-0000-4000-8000-000000000002', 'd3010000-0000-4000-8000-000000000001', '3.3.90.39', NULL, 'dfd', '2026-08-17 11:00-04'),
  ('d3210000-0000-4000-8000-000000000021', 'd3200000-0000-4000-8000-000000000002', '18101.000431/2026-58', 'a0000000-0000-4000-8000-000000000003', 'servico', NULL, 3794, NULL, 'Locação de tendas, palco e arquibancadas para a abertura e as finais do JER 2027', 'evento', 4, 46500.00, 5, 'alta', 'd3040000-0000-4000-8000-000000000002', 'd3010000-0000-4000-8000-000000000001', '3.3.90.39', NULL, 'dfd', '2026-08-17 11:10-04'),
  ('d3210000-0000-4000-8000-000000000022', 'd3200000-0000-4000-8000-000000000002', '18101.000431/2026-58', 'a0000000-0000-4000-8000-000000000003', 'servico', NULL, 18651, NULL, 'Ambulância de suporte básico para os eventos esportivos', 'diária', 60, 1150.00, 5, 'alta', 'd3040000-0000-4000-8000-000000000002', 'd3010000-0000-4000-8000-000000000001', '3.3.90.39', NULL, 'dfd', '2026-08-17 11:20-04'),
  ('d3210000-0000-4000-8000-000000000023', 'd3200000-0000-4000-8000-000000000002', '18101.000437/2026-07', 'a0000000-0000-4000-8000-000000000004', 'servico', NULL, 17663, NULL, 'Organização da Conferência Estadual de Juventude 2027', 'serviço', 1, 128000.00, 9, 'media', 'd3040000-0000-4000-8000-000000000005', 'd3010000-0000-4000-8000-000000000002', '3.3.90.39', NULL, 'dfd', '2026-08-19 14:00-04'),
  ('d3210000-0000-4000-8000-000000000024', 'd3200000-0000-4000-8000-000000000002', '18101.000440/2026-21', 'a0000000-0000-4000-8000-000000000002', 'servico', NULL, 26972, NULL, 'Suporte técnico e manutenção do parque de informática da sede', 'mês', 12, 4380.00, 1, 'baixa', 'd3040000-0000-4000-8000-000000000001', 'd3010000-0000-4000-8000-000000000001', '3.3.90.40', NULL, 'dfd', '2026-08-20 08:50-04'),
  ('d3210000-0000-4000-8000-000000000025', 'd3200000-0000-4000-8000-000000000002', '18101.000441/2026-75', 'a0000000-0000-4000-8000-000000000003', 'servico', NULL, 24619, NULL, 'Serviços de arbitragem para as competições do calendário estadual', 'partida', 380, 210.00, 4, 'media', 'd3040000-0000-4000-8000-000000000003', 'd3010000-0000-4000-8000-000000000001', '3.3.90.39', 'Sugestão da Federação Roraimense de Atletismo acolhida pela Diretoria de Esporte.', 'sugestao_aceita', '2026-08-24 16:00-04'),
  ('d3210000-0000-4000-8000-000000000026', 'd3200000-0000-4000-8000-000000000002', '18101.000443/2026-38', 'a0000000-0000-4000-8000-000000000002', 'material', 2894, NULL, 409915, 'Água mineral para eventos e para a sede', 'fardo', 1500, 14.80, 3, 'baixa', 'd3040000-0000-4000-8000-000000000001', 'd3010000-0000-4000-8000-000000000001', '3.3.90.30', NULL, 'dfd', '2026-08-25 10:00-04')
) AS i(id, plano, sei, setor, tipo, pdm, serv, item, descr, un, qtd, vu, mes, prio, acao, fonte, nat, just, orig, criado);

-- 2027: um item revisto (quantidade) e um retirado, como a tela faz
UPDATE public.pca_itens SET quantidade = 4100, justificativa = 'Premiação das 16 modalidades do JER 2027; quantidade revista após a inclusão do parajudô e da bocha.'
 WHERE id = 'd3210000-0000-4000-8000-000000000011';
UPDATE public.pca_itens SET situacao = 'excluido' WHERE id = 'd3210000-0000-4000-8000-000000000019';

-- situação: 2026 enviado ao SEI → aprovado → publicado no PNCP; 2027 enviado ao SEI
UPDATE public.pca_planos SET situacao = 'enviado_sei', processo_sei = '18101.000241/2025-19' WHERE id = 'd3200000-0000-4000-8000-000000000001';
UPDATE public.pca_planos SET situacao = 'aprovado', data_aprovacao = '2025-11-27' WHERE id = 'd3200000-0000-4000-8000-000000000001';
UPDATE public.pca_planos SET situacao = 'publicado', data_publicacao_pncp = '2025-12-05' WHERE id = 'd3200000-0000-4000-8000-000000000001';
UPDATE public.pca_planos SET situacao = 'enviado_sei', processo_sei = '18101.000452/2026-84' WHERE id = 'd3200000-0000-4000-8000-000000000002';

-- datas do histórico (gravado com now() pelos gatilhos)
UPDATE public.pca_historico h SET feito_em = CASE
    WHEN h.acao = 'plano_criado' THEN (SELECT p.created_at FROM public.pca_planos p WHERE p.id = h.plano_id)
    WHEN h.acao = 'item_incluido' THEN (SELECT i.created_at FROM public.pca_itens i WHERE i.id = h.item_id)
    WHEN h.acao = 'tetos_qdd' THEN timestamptz '2026-01-21 10:15-04'
    WHEN h.acao = 'item_alterado' THEN timestamptz '2026-09-02 15:40-04'
    WHEN h.acao = 'item_excluido' THEN timestamptz '2026-09-03 09:05-04'
    WHEN h.depois->>'situacao' = 'enviado_sei' AND h.plano_id = 'd3200000-0000-4000-8000-000000000001' THEN timestamptz '2025-11-10 17:00-04'
    WHEN h.depois->>'situacao' = 'aprovado' THEN timestamptz '2025-11-27 12:30-04'
    WHEN h.depois->>'situacao' = 'publicado' THEN timestamptz '2025-12-05 09:45-04'
    WHEN h.depois->>'situacao' = 'enviado_sei' THEN timestamptz '2026-09-15 16:10-04'
    ELSE h.feito_em END,
  motivo = CASE WHEN h.acao = 'item_excluido' THEN 'Aquisição antecipada para 2026 com saldo da ação 1083 (processo SEI 18101.000402/2026-17).'
                WHEN h.acao = 'item_alterado' THEN 'Inclusão do parajudô e da bocha no JER 2027.' ELSE h.motivo END
 WHERE h.plano_id IN ('d3200000-0000-4000-8000-000000000001', 'd3200000-0000-4000-8000-000000000002');

-- ===================================================================== resumo
SELECT t.tabela, t.linhas FROM (VALUES
  ('fin_dotacoes', (SELECT count(*) FROM public.fin_dotacoes)),
  ('fin_empenhos', (SELECT count(*) FROM public.fin_empenhos)),
  ('fin_liquidacoes', (SELECT count(*) FROM public.fin_liquidacoes)),
  ('fin_pagamentos', (SELECT count(*) FROM public.fin_pagamentos)),
  ('fin_remessas_bancarias', (SELECT count(*) FROM public.fin_remessas_bancarias)),
  ('fin_extrato_lancamentos', (SELECT count(*) FROM public.fin_extrato_lancamentos)),
  ('fin_conciliacoes_mensais', (SELECT count(*) FROM public.fin_conciliacoes_mensais)),
  ('fin_conciliacao_itens', (SELECT count(*) FROM public.fin_conciliacao_itens)),
  ('fin_receitas', (SELECT count(*) FROM public.fin_receitas)),
  ('fin_lancamentos_contabeis', (SELECT count(*) FROM public.fin_lancamentos_contabeis)),
  ('pca_itens', (SELECT count(*) FROM public.pca_itens)),
  ('cat_material_itens', (SELECT count(*) FROM public.cat_material_itens))
) AS t(tabela, linhas);

COMMIT;
