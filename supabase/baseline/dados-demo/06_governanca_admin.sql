-- Dados FICTÍCIOS de demonstração — Governança, integridade, transparência/LAI e administração do sistema.
-- Só para o banco de TESTE, depois de dados-teste.sql.
-- Guia: docs/NOVO_BANCO.md §9.
--
-- Pessoas, CPFs (válidos no dígito, mas inventados), e-mails (@exemplo.test), telefones, protocolos, números de
-- processo SEI e valores são inventados. A identidade da instituição (nome oficial, sigla, CNPJ, endereço,
-- vinculação, base legal) é a do perfil tenants/idjuv; dirigente e contatos são os do servidor fictício.
--
-- Uso: psql "$URL" -v confirmo=banco_de_teste -f supabase/baseline/dados-demo/06_governanca_admin.sql
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
  IF EXISTS (SELECT 1 FROM public.controles_internos) THEN
    RAISE EXCEPTION 'recusado: os dados de demonstração deste módulo já foram carregados';
  END IF;
END $$;
-- quem "faz" as ações (auth.uid() nos triggers de autoria): o login de teste ligado ao servidor fictício
SELECT set_config('request.jwt.claim.sub', coalesce((SELECT id::text FROM public.profiles
  WHERE servidor_id = 'c0000000-0000-4000-8000-000000000001'), ''), true) AS _ \gset
SELECT set_config('request.jwt.claim.role', 'authenticated', true) AS _ \gset

-- id do login de teste (aleatório em cada banco; NULL se o dados-teste rodou sem -v email)
\set uid '(SELECT id FROM public.profiles WHERE servidor_id = ''c0000000-0000-4000-8000-000000000001'')'

-- CPF com dígitos verificadores válidos a partir de 9 dígitos (cópia da função do dados-teste.sql)
CREATE FUNCTION pg_temp.cpf(base text) RETURNS text LANGUAGE plpgsql AS $f$
DECLARE s int; d1 int; d2 int; i int;
BEGIN
  s := 0; FOR i IN 1..9 LOOP s := s + substr(base, i, 1)::int * (11 - i); END LOOP;
  d1 := 11 - s % 11; IF d1 >= 10 THEN d1 := 0; END IF;
  s := 0; FOR i IN 1..9 LOOP s := s + substr(base, i, 1)::int * (12 - i); END LOOP;
  s := s + d1 * 2; d2 := 11 - s % 11; IF d2 >= 10 THEN d2 := 0; END IF;
  RETURN base || d1 || d2;
END $f$;

-- ids fixos do grupo: d6<tabela, 2 hex>0000-0000-4000-8000-<n>
CREATE FUNCTION pg_temp.id(t text, n int) RETURNS uuid LANGUAGE sql IMMUTABLE AS
  $f$ SELECT ('d6' || t || '0000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid $f$;
-- servidor n do dados-teste.sql
CREATE FUNCTION pg_temp.srv(n int) RETURNS uuid LANGUAGE sql IMMUTABLE AS
  $f$ SELECT ('c0000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid $f$;
-- unidade n do dados-teste.sql (1 PRES, 2 DIRAF, 3 DIESP, 4 DIJUV, 5 DRH, 6 DFIN, 7 DPC, 8 ASCOM, 9 ASJUR)
CREATE FUNCTION pg_temp.un(n int) RETURNS uuid LANGUAGE sql IMMUTABLE AS
  $f$ SELECT ('a0000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid $f$;
-- riscos do dados-teste.sql (sem id fixo: pela chave natural)
CREATE FUNCTION pg_temp.risco(c text) RETURNS uuid LANGUAGE sql STABLE AS
  $f$ SELECT id FROM public.riscos_institucionais WHERE codigo = c $f$;

-- ===================================================================== identidade da instituição (dados_oficiais)
-- Lida por TODO PDF (cabeçalho/rodapé) e pela tela /admin/configuracao-cliente (chaves de CAMPOS_CLIENTE,
-- src/core/tenant/dadosOficiais.ts). Dirigente = a presidente fictícia do dados-teste (servidor 2).
INSERT INTO public.dados_oficiais (id, chave, valor, categoria, descricao, motivo_alteracao) VALUES
  (pg_temp.id('10', 1),  'sistema_nome', 'Governa Hub', 'sistema', 'Nome do sistema', 'Cadastro inicial'),
  (pg_temp.id('10', 2),  'nome_oficial', 'Instituto de Desporto, Juventude e Lazer do Estado de Roraima – IDJuv', 'identificacao', 'Nome oficial da instituição', 'Cadastro inicial'),
  (pg_temp.id('10', 3),  'nome_curto', 'IDJuv', 'identificacao', 'Nome curto', 'Cadastro inicial'),
  (pg_temp.id('10', 4),  'sigla', 'IDJUV', 'identificacao', 'Sigla', 'Cadastro inicial'),
  (pg_temp.id('10', 5),  'natureza_juridica', 'Autarquia Estadual', 'identificacao', 'Natureza jurídica', 'Cadastro inicial'),
  (pg_temp.id('10', 6),  'nome_para_documentos', 'INSTITUTO DE DESPORTO, JUVENTUDE E LAZER - IDJUV', 'identificacao', 'Nome no cabeçalho dos documentos', 'Cadastro inicial'),
  (pg_temp.id('10', 7),  'tratamento_dirigente', 'A PRESIDENTE DO INSTITUTO DE DESPORTO, JUVENTUDE E LAZER DO ESTADO DE RORAIMA – IDJuv', 'identificacao', 'Abertura dos atos', 'Cadastro inicial'),
  (pg_temp.id('10', 8),  'vinculacao', 'Secretaria de Estado da Educação e Desporto – SEED', 'vinculacao', 'Vinculação', 'Cadastro inicial'),
  (pg_temp.id('10', 9),  'entidade_superior_nome', 'Governo do Estado de Roraima', 'vinculacao', 'Entidade superior', 'Cadastro inicial'),
  (pg_temp.id('10', 10), 'cnpj', '64.689.510/0001-09', 'legal', 'CNPJ', 'Cadastro inicial'),
  (pg_temp.id('10', 11), 'data_criacao', '29/12/2025', 'legal', 'Data de criação', 'Cadastro inicial'),
  (pg_temp.id('10', 12), 'atividade_principal', '84.11-6-00 - Administração pública em geral', 'legal', 'Atividade principal (CNAE)', 'Cadastro inicial'),
  (pg_temp.id('10', 13), 'lei_criacao', 'Lei nº 2.301, de 29 de dezembro de 2025', 'legal', 'Lei de criação', 'Cadastro inicial'),
  (pg_temp.id('10', 14), 'decreto_regulamentacao', 'Decreto nº 39.840-E, de 23 de janeiro de 2026', 'legal', 'Decreto de regulamentação', 'Cadastro inicial'),
  (pg_temp.id('10', 15), 'presidente_nome', 'Helena Prado Moura', 'dirigente', 'Nome do dirigente', 'Cadastro inicial'),
  (pg_temp.id('10', 16), 'presidente_cargo', 'Presidente', 'dirigente', 'Cargo do dirigente', 'Cadastro inicial'),
  (pg_temp.id('10', 17), 'presidente_decreto_nomeacao', 'Decreto nº 112-P, de 2 de janeiro de 2026', 'dirigente', 'Ato de nomeação', 'Cadastro inicial'),
  (pg_temp.id('10', 18), 'endereco_logradouro', 'Av. Brigadeiro Eduardo Gomes', 'endereco', 'Logradouro', 'Cadastro inicial'),
  (pg_temp.id('10', 19), 'endereco_numero', '3232', 'endereco', 'Número', 'Cadastro inicial'),
  (pg_temp.id('10', 20), 'endereco_complemento', 'Anexo IDJuv', 'endereco', 'Complemento', 'Cadastro inicial'),
  (pg_temp.id('10', 21), 'endereco_bairro', 'Estados', 'endereco', 'Bairro', 'Cadastro inicial'),
  (pg_temp.id('10', 22), 'endereco_cep', '69.305-455', 'endereco', 'CEP', 'Cadastro inicial'),
  (pg_temp.id('10', 23), 'endereco_cidade', 'Boa Vista', 'endereco', 'Cidade', 'Cadastro inicial'),
  (pg_temp.id('10', 24), 'endereco_uf', 'RR', 'endereco', 'UF', 'Cadastro inicial'),
  (pg_temp.id('10', 25), 'endereco_pais', 'Brasil', 'endereco', 'País', 'Cadastro inicial'),
  (pg_temp.id('10', 26), 'email_institucional', 'gabinete@exemplo.test', 'contato', 'E-mail institucional', 'Cadastro inicial'),
  (pg_temp.id('10', 27), 'telefone', '(95) 90000-0100', 'contato', 'Telefone', 'Cadastro inicial'),
  (pg_temp.id('10', 28), 'email_suporte', 'suporte.ti@exemplo.test', 'contato', 'E-mail do suporte técnico', 'Cadastro inicial'),
  (pg_temp.id('10', 29), 'instagram', 'idjuvroraima', 'contato', 'Instagram', 'Cadastro inicial'),
  (pg_temp.id('10', 30), 'facebook', 'idjuvrr', 'contato', 'Facebook', 'Cadastro inicial'),
  (pg_temp.id('10', 31), 'youtube', '@idjuv_rr', 'contato', 'YouTube', 'Cadastro inicial'),
  (pg_temp.id('10', 32), 'twitter', 'idjuv_rr', 'contato', 'X (Twitter)', 'Cadastro inicial'),
  (pg_temp.id('10', 33), 'diario_oficial_url', 'https://diario.rr.gov.br', 'integracoes', 'Endereço do Diário Oficial', 'Cadastro inicial'),
  (pg_temp.id('10', 34), 'portal_transparencia_url', 'https://transparencia.rr.gov.br', 'integracoes', 'Endereço do Portal da Transparência', 'Cadastro inicial'),
  (pg_temp.id('10', 35), 'impressao_cor_destaque', '#164069', 'impressao', 'Cor de destaque', 'Padronização dos documentos'),
  (pg_temp.id('10', 36), 'impressao_logo_orgao', 'sim', 'impressao', 'Mostrar o logo da instituição', 'Padronização dos documentos'),
  (pg_temp.id('10', 37), 'impressao_logo_entidade', 'sim', 'impressao', 'Mostrar o logo da entidade superior', 'Padronização dos documentos'),
  (pg_temp.id('10', 38), 'impressao_linha_cabecalho', 'Vinculado à Secretaria de Estado da Educação e Desporto – SEED', 'impressao', 'Linha extra no cabeçalho', 'Padronização dos documentos'),
  (pg_temp.id('10', 39), 'impressao_texto_rodape', 'Av. Brigadeiro Eduardo Gomes, 3232 – Estados – Boa Vista/RR – CEP 69.305-455', 'impressao', 'Texto do rodapé', 'Padronização dos documentos'),
  (pg_temp.id('10', 40), 'impressao_mostrar_emissor', 'sim', 'impressao', 'Mostrar quem emitiu', 'Padronização dos documentos'),
  (pg_temp.id('10', 41), 'impressao_tamanho_letra', 'normal', 'impressao', 'Tamanho da letra', 'Padronização dos documentos'),
  (pg_temp.id('10', 42), 'impressao_tabela_listrada', 'sim', 'impressao', 'Tabelas listradas', 'Padronização dos documentos'),
  (pg_temp.id('10', 43), 'impressao_orientacao', 'automatica', 'impressao', 'Orientação da página', 'Padronização dos documentos');

-- config_institucional: nenhuma tela lê hoje (só o banco); uma linha coerente com dados_oficiais
INSERT INTO public.config_institucional (id, codigo, nome, nome_fantasia, cnpj, natureza_juridica, endereco, contato,
  responsavel_legal, cpf_responsavel, cargo_responsavel, cores, politicas, ativo)
SELECT pg_temp.id('11', 1), 'IDJUV', 'Instituto de Desporto, Juventude e Lazer do Estado de Roraima', 'IDJuv',
       '64.689.510/0001-09', 'Autarquia Estadual',
       jsonb_build_object('logradouro', 'Av. Brigadeiro Eduardo Gomes', 'numero', '3232', 'complemento', 'Anexo IDJuv',
                          'bairro', 'Estados', 'cep', '69.305-455', 'cidade', 'Boa Vista', 'uf', 'RR'),
       jsonb_build_object('email', 'gabinete@exemplo.test', 'telefone', '(95) 90000-0100'),
       s.nome_completo, s.cpf, 'Presidente', jsonb_build_object('primaria', '#164069'),
       jsonb_build_object('lgpd_encarregado', 'Eduardo Matos Quintela', 'lgpd_email', 'encarregado.lgpd@exemplo.test'), true
FROM public.servidores s WHERE s.id = pg_temp.srv(2);

-- ===================================================================== matriz RACI (/governanca/matriz-raci)
INSERT INTO public.matriz_raci_papeis (id, codigo, nome, descricao, unidade_id, cargo_id) VALUES
  (pg_temp.id('08', 1), 'PRES',  'Presidência',                         'Aprova atos e decisões finais do Instituto', pg_temp.un(1), 'b0000000-0000-4000-8000-000000000001'),
  (pg_temp.id('08', 2), 'DIRAF', 'Diretoria Administrativa e Financeira', 'Coordena RH, finanças, patrimônio e compras', pg_temp.un(2), 'b0000000-0000-4000-8000-000000000002'),
  (pg_temp.id('08', 3), 'DRH',   'Divisão de Recursos Humanos',          'Folha, frequência, férias e cadastro funcional', pg_temp.un(5), 'b0000000-0000-4000-8000-000000000003'),
  (pg_temp.id('08', 4), 'DFIN',  'Divisão de Finanças',                  'Empenho, liquidação, pagamento e conciliação', pg_temp.un(6), 'b0000000-0000-4000-8000-000000000003'),
  (pg_temp.id('08', 5), 'DPC',   'Divisão de Patrimônio e Compras',      'Tombamento, inventário, almoxarifado e licitações', pg_temp.un(7), 'b0000000-0000-4000-8000-000000000003'),
  (pg_temp.id('08', 6), 'ASJUR', 'Assessoria Jurídica',                  'Pareceres jurídicos e análise de minutas', pg_temp.un(9), 'b0000000-0000-4000-8000-000000000004'),
  (pg_temp.id('08', 7), 'FISC',  'Fiscal de contrato',                   'Servidor designado por portaria para fiscalizar a execução', NULL, NULL),
  (pg_temp.id('08', 8), 'SIC',   'Serviço de Informação ao Cidadão',     'Recebe, encaminha e responde os pedidos de acesso à informação', pg_temp.un(9), NULL);

INSERT INTO public.matriz_raci_processos (id, codigo, nome, descricao, modulo_sistema) VALUES
  (pg_temp.id('09', 1), 'RH-01',  'Processamento da folha mensal',          'Do fechamento da frequência ao envio do arquivo ao banco', 'rh'),
  (pg_temp.id('09', 2), 'RH-02',  'Concessão de férias',                    'Programação, aprovação e registro do gozo', 'rh'),
  (pg_temp.id('09', 3), 'FIN-01', 'Execução da despesa',                    'Empenho, liquidação e pagamento', 'financeiro'),
  (pg_temp.id('09', 4), 'CMP-01', 'Contratação por pregão eletrônico',      'Da demanda do setor à homologação', 'compras'),
  (pg_temp.id('09', 5), 'CTR-01', 'Gestão e fiscalização de contratos',     'Acompanhamento, medição, aditivos e encerramento', 'contratos'),
  (pg_temp.id('09', 6), 'PAT-01', 'Inventário anual de bens móveis',        'Levantamento físico, conciliação e relatório à comissão', 'patrimonio'),
  (pg_temp.id('09', 7), 'TRA-01', 'Atendimento a pedido de acesso à informação', 'Do registro no SIC à resposta e eventual recurso', 'transparencia');

INSERT INTO public.matriz_raci_atribuicoes (processo_id, papel_id, tipo_papel, etapa_processo)
SELECT pg_temp.id('09', p), pg_temp.id('08', r), t::public.tipo_papel_raci, e
FROM (VALUES
  (1, 3, 'responsavel', 'Fechamento da frequência'), (1, 2, 'informado', 'Fechamento da frequência'),
  (1, 3, 'responsavel', 'Cálculo e conferência da folha'), (1, 4, 'consultado', 'Cálculo e conferência da folha'),
  (1, 2, 'aprovador', 'Homologação da folha'), (1, 1, 'informado', 'Homologação da folha'),
  (1, 4, 'responsavel', 'Pagamento e remessa bancária'), (1, 2, 'aprovador', 'Pagamento e remessa bancária'),
  (2, 3, 'responsavel', 'Programação anual'), (2, 2, 'aprovador', 'Programação anual'),
  (2, 3, 'responsavel', 'Registro do gozo'),
  (3, 4, 'responsavel', 'Empenho'), (3, 2, 'aprovador', 'Empenho'),
  (3, 7, 'responsavel', 'Atesto da nota fiscal'), (3, 4, 'responsavel', 'Liquidação'),
  (3, 4, 'responsavel', 'Pagamento'), (3, 1, 'aprovador', 'Pagamento'),
  (4, 5, 'responsavel', 'Termo de referência'), (4, 6, 'consultado', 'Termo de referência'),
  (4, 6, 'responsavel', 'Parecer jurídico'), (4, 5, 'responsavel', 'Sessão pública'),
  (4, 1, 'aprovador', 'Homologação'), (4, 2, 'informado', 'Homologação'),
  (5, 7, 'responsavel', 'Fiscalização mensal'), (5, 2, 'informado', 'Fiscalização mensal'),
  (5, 2, 'responsavel', 'Aditivo ou prorrogação'), (5, 6, 'consultado', 'Aditivo ou prorrogação'), (5, 1, 'aprovador', 'Aditivo ou prorrogação'),
  (6, 5, 'responsavel', 'Levantamento físico'), (6, 2, 'aprovador', 'Relatório de inventário'), (6, 1, 'informado', 'Relatório de inventário'),
  (7, 8, 'responsavel', 'Registro e triagem'), (7, 2, 'consultado', 'Busca da informação'),
  (7, 8, 'responsavel', 'Resposta ao requerente'), (7, 1, 'aprovador', 'Decisão de recurso'), (7, 6, 'consultado', 'Decisão de recurso')
) AS a(p, r, t, e);

-- ===================================================================== controles internos (tabela-sentinela)
INSERT INTO public.controles_internos (id, codigo, nome, descricao, objetivo, tipo, periodicidade, modulo_sistema,
  processo_raci_id, risco_id, responsavel_id, unidade_responsavel_id, procedimento, indicador_efetividade, meta_indicador, ativo) VALUES
  (pg_temp.id('00', 1), 'CI-001', 'Conferência prévia da folha mensal',
   'Conferência por amostragem dos lançamentos variáveis antes da homologação da folha', 'Evitar pagamento indevido ou atraso no fechamento',
   'preventivo', 'mensal', 'rh', pg_temp.id('09', 1), pg_temp.risco('R-001'), pg_temp.srv(6), pg_temp.un(5),
   'Comparar a prévia com a folha anterior e conferir toda variação acima de 10% por servidor', 'Folhas homologadas até o dia 25', '100%', true),
  (pg_temp.id('00', 2), 'CI-002', 'Fechamento da frequência até o 2º dia útil',
   'Cobrança das chefias para fechamento da frequência mensal no prazo', 'Garantir a base da folha no prazo',
   'preventivo', 'mensal', 'rh', pg_temp.id('09', 1), pg_temp.risco('R-001'), pg_temp.srv(9), pg_temp.un(5),
   'Relatório de setores sem frequência fechada enviado às diretorias no 1º dia útil', 'Setores com frequência fechada no prazo', '95%', true),
  (pg_temp.id('00', 3), 'CI-003', 'Inventário rotativo por setor',
   'Conferência física trimestral de uma amostra de bens de cada setor', 'Detectar bens sem localização antes do inventário anual',
   'detectivo', 'trimestral', 'patrimonio', pg_temp.id('09', 6), pg_temp.risco('R-002'), pg_temp.srv(8), pg_temp.un(7),
   'Sortear 20% dos bens de cada setor e conferir plaqueta, local e responsável', 'Bens localizados na amostra', '98%', true),
  (pg_temp.id('00', 4), 'CI-004', 'Termo de responsabilidade na entrega do bem',
   'Todo bem entregue a setor ou servidor sai com termo de responsabilidade assinado', 'Garantir responsável identificado para cada bem',
   'preventivo', 'eventual', 'patrimonio', pg_temp.id('09', 6), pg_temp.risco('R-002'), pg_temp.srv(11), pg_temp.un(7),
   'Emitir o termo no sistema e arquivar a via assinada no processo SEI do setor', 'Bens com termo assinado', '100%', true),
  (pg_temp.id('00', 5), 'CI-005', 'Alerta de vencimento de contratos',
   'Aviso à diretoria e ao gestor com 120, 90 e 60 dias do fim da vigência', 'Evitar contrato contínuo vencido sem renovação',
   'preventivo', 'mensal', 'contratos', pg_temp.id('09', 5), pg_temp.risco('R-003'), pg_temp.srv(3), pg_temp.un(2),
   'Consultar o painel de vigências no 1º dia útil e abrir processo de prorrogação quando cabível', 'Contratos renovados antes do vencimento', '100%', true),
  (pg_temp.id('00', 6), 'CI-006', 'Relatório mensal do fiscal de contrato',
   'O fiscal registra a execução do mês antes do atesto da nota fiscal', 'Assegurar que só se paga serviço prestado',
   'detectivo', 'mensal', 'contratos', pg_temp.id('09', 5), pg_temp.risco('R-003'), pg_temp.srv(12), pg_temp.un(2),
   'Relatório com medição, ocorrências e fotos juntado ao processo antes da liquidação', 'Notas atestadas com relatório do fiscal', '100%', true),
  (pg_temp.id('00', 7), 'CI-007', 'Conciliação bancária mensal',
   'Conciliação das contas do Instituto com os extratos até o dia 10 do mês seguinte', 'Detectar lançamentos sem respaldo',
   'detectivo', 'mensal', 'financeiro', pg_temp.id('09', 3), NULL, pg_temp.srv(7), pg_temp.un(6),
   'Comparar extrato e razão contábil e justificar toda pendência acima de 30 dias', 'Contas conciliadas no prazo', '100%', true),
  (pg_temp.id('00', 8), 'CI-008', 'Controle de prazos dos pedidos de acesso à informação',
   'Acompanhamento semanal dos pedidos do SIC próximos do vencimento', 'Cumprir os prazos da Lei nº 12.527/2011',
   'preventivo', 'semanal', 'transparencia', pg_temp.id('09', 7), NULL, pg_temp.srv(17), pg_temp.un(9),
   'Listar pedidos com menos de 5 dias de prazo e cobrar a unidade responsável', 'Pedidos respondidos no prazo', '100%', true),
  (pg_temp.id('00', 9), 'CI-009', 'Reposição ao erário de pagamento indevido',
   'Abertura de processo de reposição quando a conferência identifica pagamento a maior', 'Recompor o erário e corrigir a causa',
   'corretivo', 'eventual', 'rh', pg_temp.id('09', 1), pg_temp.risco('R-001'), pg_temp.srv(6), pg_temp.un(5),
   'Notificar o servidor, calcular o valor e lançar o desconto parcelado na folha', 'Casos com reposição iniciada em até 30 dias', '100%', true),
  (pg_temp.id('00', 10), 'CI-010', 'Dupla assinatura em transferências bancárias',
   'Toda transferência exige a autorização do ordenador e do chefe de finanças', 'Segregação de funções no pagamento',
   'preventivo', 'diario', 'financeiro', pg_temp.id('09', 3), NULL, pg_temp.srv(7), pg_temp.un(6),
   'Configuração de dupla alçada no banco revisada a cada troca de ordenador', 'Transferências com dupla autorização', '100%', false);

INSERT INTO public.avaliacoes_controle (id, controle_id, data_avaliacao, avaliador_id, periodo_referencia, status_execucao,
  efetividade, valor_indicador, conformidade_procedimento, pontos_atencao, recomendacoes, created_by)
SELECT pg_temp.id('01', n), pg_temp.id('00', c), d::date, pg_temp.srv(av), per, st, ef, ind, conf, pa, rec, :uid
FROM (VALUES
  ( 1, 1, '2026-04-08', 17, '1º trimestre/2026', 'executado', 'efetivo', '100%', true, NULL, 'Manter a rotina'),
  ( 2, 1, '2026-07-07', 17, '2º trimestre/2026', 'executado', 'parcialmente_efetivo', '67%', true, 'Folha de maio homologada no dia 27 por atraso de duas frequências', 'Antecipar a cobrança das chefias'),
  ( 3, 2, '2026-07-07', 17, '2º trimestre/2026', 'parcialmente_executado', 'parcialmente_efetivo', '88%', false, 'Duas diretorias fecharam a frequência no 4º dia útil', 'Comunicar o atraso à Presidência'),
  ( 4, 2, '2026-10-06', 17, '3º trimestre/2026', 'executado', 'efetivo', '97%', true, NULL, NULL),
  ( 5, 3, '2026-06-30', 6, '2º trimestre/2026', 'executado', 'inefetivo', '91%', true, 'Onze bens não localizados no Ginásio Central', 'Abrir apuração e reforçar o termo de responsabilidade'),
  ( 6, 3, '2026-09-30', 6, '3º trimestre/2026', 'executado', 'parcialmente_efetivo', '96%', true, 'Quatro bens sem plaqueta legível', 'Concluir a substituição das plaquetas'),
  ( 7, 4, '2026-08-14', 6, 'Agosto/2026', 'parcialmente_executado', 'parcialmente_efetivo', '82%', false, 'Entregas de material esportivo sem termo assinado', 'Bloquear a saída do bem sem termo'),
  ( 8, 5, '2026-05-05', 17, 'Abril/2026', 'executado', 'efetivo', '100%', true, NULL, NULL),
  ( 9, 5, '2026-10-02', 17, 'Setembro/2026', 'executado', 'efetivo', '100%', true, 'Contrato de limpeza vence em 30/11/2026: processo de prorrogação aberto', NULL),
  (10, 6, '2026-09-10', 3, 'Agosto/2026', 'executado', 'efetivo', '100%', true, NULL, NULL),
  (11, 7, '2026-03-12', 3, 'Fevereiro/2026', 'executado', 'efetivo', '100%', true, NULL, NULL),
  (12, 7, '2026-08-11', 3, 'Julho/2026', 'nao_executado', 'inefetivo', '0%', false, 'Conciliação de julho não feita por férias do responsável', 'Designar substituto para o período de férias'),
  (13, 8, '2026-10-19', 2, 'Outubro/2026', 'executado', 'efetivo', '100%', true, 'Dois pedidos vencem na próxima semana', NULL)
) AS a(n, c, d, av, per, st, ef, ind, conf, pa, rec);

INSERT INTO public.evidencias_controle (id, controle_id, titulo, descricao, tipo_evidencia, data_evidencia, arquivo_nome, link_externo, created_by)
SELECT pg_temp.id('02', n), pg_temp.id('00', c), t, d, tp, dt::date, arq, NULL, :uid
FROM (VALUES
  (1, 1, 'Relatório de conferência da folha de setembro/2026', 'Planilha de variações conferidas, assinada pela chefia da DRH', 'relatorio', '2026-09-24', 'conferencia_folha_2026_09.pdf'),
  (2, 2, 'Cobrança de frequência às diretorias — outubro/2026', 'Memorando circular enviado no 1º dia útil (SEI 18101.000731/2026-12)', 'documento', '2026-10-01', 'memorando_circular_frequencia_10_2026.pdf'),
  (3, 3, 'Planilha do inventário rotativo — 3º trimestre', 'Amostra sorteada por setor com o resultado da conferência', 'relatorio', '2026-09-30', 'inventario_rotativo_3tri_2026.xlsx'),
  (4, 5, 'Painel de vigência de contratos — setembro/2026', 'Captura do painel com os contratos a vencer em 120 dias', 'print_sistema', '2026-10-01', 'painel_vigencias_2026_10.png'),
  (5, 6, 'Relatório do fiscal — contrato 002/2026, setembro', 'Medição do serviço de limpeza do Ginásio, com registro fotográfico', 'relatorio', '2026-10-05', 'relatorio_fiscal_002_2026_09.pdf'),
  (6, 7, 'Conciliação bancária — agosto/2026', 'Conciliação da conta movimento com o razão contábil', 'documento', '2026-09-09', 'conciliacao_2026_08.pdf'),
  (7, 8, 'Relatório semanal de prazos do SIC', 'Pedidos com prazo a vencer na semana de 19/10/2026', 'relatorio', '2026-10-19', 'prazos_sic_semana_42.pdf')
) AS e(n, c, t, d, tp, dt, arq);

INSERT INTO public.avaliacoes_risco (id, risco_id, data_avaliacao, avaliador_id, probabilidade_avaliada, impacto_avaliado,
  nivel_risco_avaliado, efetividade_controles, observacoes, recomendacoes, created_by)
SELECT pg_temp.id('03', n), pg_temp.risco(r), d::date, pg_temp.srv(av), p::public.nivel_risco, i::public.nivel_risco,
       nv::public.nivel_risco, ef, obs, rec, :uid
FROM (VALUES
  (1, 'R-001', '2026-04-10', 17, 'medio', 'muito_alto', 'alto', 'efetivo', 'Folhas do 1º trimestre pagas em dia', 'Manter a conferência prévia'),
  (2, 'R-001', '2026-07-10', 17, 'alto', 'muito_alto', 'muito_alto', 'parcialmente_efetivo', 'Atraso na homologação de maio', 'Cronograma com corte de lançamentos no dia 20'),
  (3, 'R-002', '2026-07-02', 6, 'alto', 'medio', 'alto', 'inefetivo', 'Bens não localizados no Ginásio Central', 'Inventário geral antecipado para agosto'),
  (4, 'R-003', '2026-10-02', 17, 'baixo', 'alto', 'medio', 'efetivo', 'Alertas de vigência funcionando; prorrogação da limpeza em curso', NULL)
) AS a(n, r, d, av, p, i, nv, ef, obs, rec);

INSERT INTO public.planos_tratamento_risco (id, risco_id, codigo, titulo, descricao, tipo_resposta, acao_proposta,
  recursos_necessarios, responsavel_id, prazo_inicio, prazo_conclusao, status, percentual_execucao, resultado_obtido)
SELECT pg_temp.id('04', n), pg_temp.risco(r), c, t, d, tr, ac, rn, pg_temp.srv(rs), pi::date, pc::date, st, pe, res
FROM (VALUES
  (1, 'R-001', 'PT-01', 'Cronograma de fechamento da folha com corte no dia 20', 'Calendário anual da folha com datas de corte por tipo de lançamento', 'mitigar',
      'Publicar o calendário e bloquear lançamentos variáveis após o dia 20', 'Nenhum recurso adicional', 6, '2026-03-02', '2026-12-15', 'em_andamento', 60, NULL),
  (2, 'R-001', 'PT-02', 'Capacitação da equipe de RH no sistema de folha', 'Treinamento prático de cálculo, conferência e eventos do eSocial', 'mitigar',
      'Turma de 16 horas para a DRH e substitutos', 'Sala de treinamento e instrutor interno', 6, '2026-02-02', '2026-05-29', 'concluido', 100, 'Seis servidores capacitados; tempo de conferência caiu de 3 para 2 dias'),
  (3, 'R-002', 'PT-03', 'Inventário geral de bens móveis 2026', 'Levantamento físico de todos os bens, com comissão designada por portaria', 'mitigar',
      'Conferir todos os bens, conciliar com o sistema e apurar os não localizados', 'Comissão de três servidores e coletores do aplicativo de inventário', 8, '2026-08-03', '2026-12-18', 'em_andamento', 45, NULL),
  (4, 'R-002', 'PT-04', 'Substituição de plaquetas ilegíveis', 'Reemplaquetamento dos bens com identificação danificada', 'mitigar',
      'Adquirir plaquetas e refazer a identificação dos bens apontados no inventário rotativo', 'Plaquetas de alumínio (estimativa de 400 unidades)', 11, '2026-06-01', '2026-09-30', 'atrasado', 30, NULL),
  (5, 'R-002', 'PT-05', 'Seguro patrimonial dos ginásios', 'Contratação de seguro para os bens das unidades esportivas', 'transferir',
      'Cotar e contratar apólice para os bens das unidades locais', 'Dotação de serviços de terceiros', 8, '2026-04-01', '2026-07-31', 'cancelado', 0, 'Cancelado: custo da apólice superior ao valor médio das perdas; prioridade dada ao inventário (PT-03)'),
  (6, 'R-003', 'PT-06', 'Painel de vigência de contratos', 'Painel com alertas automáticos de vencimento', 'mitigar',
      'Configurar o painel e os avisos de 120, 90 e 60 dias', 'Equipe de TI', 3, '2026-03-02', '2026-05-15', 'concluido', 100, 'Painel em uso desde maio; nenhum contrato vencido desde então'),
  (7, 'R-003', 'PT-07', 'Prorrogação do contrato de limpeza do Ginásio', 'Contrato 002/2026 vence em 30/11/2026', 'evitar',
      'Instruir a prorrogação com pesquisa de preços e manifestação do fiscal', 'Nenhum recurso adicional', 3, '2026-10-20', '2026-11-25', 'planejado', 0, NULL)
) AS p(n, r, c, t, d, tr, ac, rn, rs, pi, pc, st, pe, res);

-- ===================================================================== checklists de conformidade (exercício 2026)
INSERT INTO public.checklists_conformidade (id, codigo, nome, descricao, orgao_fiscalizador, exercicio, base_legal, versao,
  data_vigencia_inicio, data_vigencia_fim, ativo, created_by) VALUES
  (pg_temp.id('05', 1), 'CHK-TCE-2026', 'Prestação de contas anual — exercício 2026',
   'Peças exigidas na prestação de contas anual do Instituto ao Tribunal de Contas', 'TCE-RR', 2026,
   'Lei Orgânica e instruções normativas do Tribunal de Contas do Estado de Roraima', 1, '2026-01-01', '2026-12-31', true, :uid),
  (pg_temp.id('05', 2), 'CHK-LAI-2026', 'Transparência ativa — Lei de Acesso à Informação',
   'Informações de publicação obrigatória no portal, independentemente de pedido', 'CGE-RR', 2026,
   'Lei nº 12.527/2011, art. 8º; Lei Complementar nº 131/2009', 1, '2026-01-01', '2026-12-31', true, :uid),
  (pg_temp.id('05', 3), 'CHK-LGPD-2026', 'Adequação à Lei Geral de Proteção de Dados',
   'Medidas mínimas de proteção de dados pessoais nos sistemas do Instituto', 'CGE-RR', 2026,
   'Lei nº 13.709/2018', 1, '2026-03-01', NULL, true, :uid);

INSERT INTO public.itens_checklist (id, checklist_id, numero_item, descricao, fundamentacao_legal, categoria, peso, obrigatorio, ordem, created_by)
SELECT pg_temp.id('06', n), pg_temp.id('05', c), ni, d, f, cat, pe, true, o, :uid
FROM (VALUES
  ( 1, 1, '1.1', 'Rol de responsáveis atualizado, com períodos de gestão', 'Instrução normativa do TCE-RR', 'Peças gerais', 1, 1),
  ( 2, 1, '1.2', 'Relatório de gestão do exercício', 'Instrução normativa do TCE-RR', 'Peças gerais', 2, 2),
  ( 3, 1, '1.3', 'Demonstrações contábeis (balanços orçamentário, financeiro e patrimonial)', 'Lei nº 4.320/1964, arts. 101 a 105', 'Contábil', 3, 3),
  ( 4, 1, '1.4', 'Relatório do inventário anual de bens móveis', 'Lei nº 4.320/1964, art. 96', 'Patrimônio', 2, 4),
  ( 5, 1, '1.5', 'Conciliações bancárias de todas as contas em 31/12', 'Instrução normativa do TCE-RR', 'Financeiro', 2, 5),
  ( 6, 1, '1.6', 'Relação de contratos vigentes, aditivos e apostilamentos', 'Lei nº 14.133/2021, art. 94', 'Contratos', 1, 6),
  ( 7, 1, '1.7', 'Parecer do controle interno sobre as contas', 'Constituição Federal, art. 74', 'Controle interno', 3, 7),
  ( 8, 1, '1.8', 'Folha de pagamento e comprovantes de recolhimento dos encargos', 'Lei nº 8.212/1991', 'Pessoal', 2, 8),
  ( 9, 2, '2.1', 'Estrutura organizacional, competências e base legal', 'Lei nº 12.527/2011, art. 8º, §1º, I', 'Institucional', 1, 1),
  (10, 2, '2.2', 'Endereços, telefones e horários de atendimento das unidades', 'Lei nº 12.527/2011, art. 8º, §1º, I', 'Institucional', 1, 2),
  (11, 2, '2.3', 'Remuneração individualizada de servidores e dirigentes', 'Lei nº 12.527/2011, art. 8º, §1º, III', 'Pessoal', 2, 3),
  (12, 2, '2.4', 'Licitações, editais, resultados e contratos celebrados', 'Lei nº 12.527/2011, art. 8º, §1º, IV', 'Contratações', 2, 4),
  (13, 2, '2.5', 'Diárias e passagens concedidas, com destino e motivo', 'Lei nº 12.527/2011, art. 8º, §1º, III', 'Despesa', 2, 5),
  (14, 2, '2.6', 'Formulário eletrônico do Serviço de Informação ao Cidadão', 'Lei nº 12.527/2011, art. 10, §2º', 'Acesso à informação', 2, 6),
  (15, 2, '2.7', 'Relatório estatístico anual de pedidos de informação', 'Lei nº 12.527/2011, art. 30, III', 'Acesso à informação', 1, 7),
  (16, 3, '3.1', 'Encarregado de dados designado e divulgado no portal', 'Lei nº 13.709/2018, art. 41', 'Governança', 2, 1),
  (17, 3, '3.2', 'Controle de acesso por perfil nos sistemas com dados pessoais', 'Lei nº 13.709/2018, art. 46', 'Segurança', 3, 2),
  (18, 3, '3.3', 'Registro das operações de tratamento de dados pessoais', 'Lei nº 13.709/2018, art. 37', 'Governança', 2, 3),
  (19, 3, '3.4', 'Política de privacidade publicada no portal', 'Lei nº 13.709/2018, art. 9º', 'Transparência', 1, 4)
) AS i(n, c, ni, d, f, cat, pe, o);

-- itens 2, 7 e 18 ficam sem resposta: aparecem como pendentes na tela e no relatório
INSERT INTO public.respostas_checklist (id, item_id, exercicio, status, justificativa, evidencia_descricao, responsavel_id,
  data_resposta, plano_acao, prazo_regularizacao, observacoes, created_by)
SELECT pg_temp.id('07', n), pg_temp.id('06', i), 2026, st::public.status_conformidade, j, ev, pg_temp.srv(r), dr::date,
       pa, pr::date, obs, :uid
FROM (VALUES
  ( 1,  1, 'conforme', 'Rol atualizado após a nomeação das diretorias', 'Portarias de nomeação publicadas no DOE', 12, '2026-03-16', NULL, NULL, NULL),
  ( 2,  3, 'parcialmente_conforme', 'Balancetes mensais em dia; balanço patrimonial depende do inventário', 'Balancetes de janeiro a setembro', 7, '2026-10-09', 'Fechar o balanço patrimonial após o inventário geral', '2027-01-31', NULL),
  ( 3,  4, 'nao_conforme', 'Inventário de 2026 em andamento; há bens não localizados', 'Relatório parcial da comissão de inventário', 8, '2026-10-01', 'Concluir o inventário geral (PT-03) e apurar os não localizados', '2026-12-18', 'Ligado ao risco R-002'),
  ( 4,  5, 'conforme', 'Contas conciliadas até setembro', 'Conciliações mensais arquivadas no SEI', 7, '2026-10-10', NULL, NULL, 'Julho conciliado com atraso'),
  ( 5,  6, 'conforme', 'Relação extraída do módulo de contratos', 'Relatório de contratos vigentes', 3, '2026-10-05', NULL, NULL, NULL),
  ( 6,  8, 'conforme', 'Folhas e encargos recolhidos no prazo', 'Guias de recolhimento quitadas', 6, '2026-10-07', NULL, NULL, NULL),
  ( 7,  9, 'conforme', 'Organograma e competências publicados', 'Página Institucional do portal', 17, '2026-04-20', NULL, NULL, NULL),
  ( 8, 10, 'conforme', 'Contatos das unidades publicados', 'Página Fale Conosco', 15, '2026-04-20', NULL, NULL, NULL),
  ( 9, 11, 'parcialmente_conforme', 'Publicada a tabela de cargos; falta a remuneração individualizada', 'Página Cargos e Remuneração', 6, '2026-06-15', 'Publicar a remuneração mensal por servidor', '2026-11-30', NULL),
  (10, 12, 'conforme', 'Editais e contratos publicados no portal', 'Páginas Licitações e Editais', 8, '2026-06-15', NULL, NULL, NULL),
  (11, 13, 'nao_conforme', 'Diárias pagas ainda não estão no portal', NULL, 7, '2026-06-15', 'Publicar mensalmente a relação de diárias e passagens', '2026-11-15', NULL),
  (12, 14, 'conforme', 'Formulário do SIC disponível no portal', 'Página Acesso à Informação', 17, '2026-05-04', NULL, NULL, NULL),
  (13, 15, 'nao_aplicavel', 'Instituto criado em dezembro de 2025: o primeiro relatório anual sai em 2027', NULL, 17, '2026-05-04', NULL, NULL, NULL),
  (14, 16, 'conforme', 'Encarregado designado por portaria e divulgado no portal', 'Portaria de designação do encarregado', 17, '2026-04-02', NULL, NULL, NULL),
  (15, 17, 'parcialmente_conforme', 'Perfis de acesso implantados no sistema de gestão; planilhas locais ainda sem controle', NULL, 1, '2026-09-18', 'Migrar as planilhas de RH para o sistema e apagar as cópias locais', '2026-12-31', NULL),
  (16, 19, 'nao_conforme', 'Política de privacidade em elaboração pela Assessoria Jurídica', NULL, 17, '2026-09-18', 'Aprovar e publicar a política de privacidade', '2026-11-28', NULL)
) AS r(n, i, st, j, ev, r, dr, pa, pr, obs);

-- ===================================================================== canal de denúncias (/integridade/gestao-denuncias)
INSERT INTO public.denuncias (id, protocolo, tipo, anonima, nome_denunciante, email_denunciante, telefone_denunciante, cargo_denunciante,
  envolvidos, data_ocorrencia, local_ocorrencia, descricao, evidencias, status, parecer, responsavel, atualizado_por, created_at, updated_at)
SELECT pg_temp.id('0b', n), 'DEN-2026-' || lpad(n::text, 4, '0'), t, an, nm, em, tel, cg, env, dto, loc, d, ev, st, par, resp,
       CASE WHEN st <> 'pendente' THEN :uid END, cr::timestamptz, coalesce(up, cr)::timestamptz
FROM (VALUES
  (1, 'irregularidade', true, NULL, NULL, NULL, NULL, 'Motorista lotado na Diretoria Administrativa e Financeira',
   '07/02/2026', 'Estacionamento do Ginásio Central', 'Veículo oficial estacionado em frente a residência particular em dia de folga, das 18h às 22h.',
   'Duas fotos com data e hora', 'concluida', 'Procedente em parte. O veículo estava em deslocamento autorizado para evento noturno, mas sem registro no controle de tráfego. Recomendado o registro obrigatório de saída e retorno.', 'Eduardo Matos Quintela',
   '2026-02-12 09:14-04', '2026-03-20 15:30-04'),
  (2, 'assedio', false, 'Mariana Teixeira Lobo', 'mariana.lobo@exemplo.test', '(95) 90000-0201', 'Estagiária',
   'Chefia imediata do setor (nome informado no relato)', 'Março e abril de 2026', 'Sede do Instituto',
   'Relata cobranças em tom ofensivo na frente dos colegas e ameaças de desligamento do estágio.',
   'Mensagens de aplicativo encaminhadas ao canal', 'em_investigacao', 'Instaurada sindicância investigativa (SEI 18101.000318/2026-07). Medida cautelar de mudança de supervisão aplicada.', 'Eduardo Matos Quintela',
   '2026-04-03 10:40-04', '2026-04-15 11:00-04'),
  (3, 'favorecimento', true, NULL, NULL, NULL, NULL, 'Comissão de seleção do edital de projetos esportivos',
   'Junho de 2026', 'Diretoria de Esporte', 'Suspeita de que projeto de associação ligada a servidor teria sido favorecido na pontuação.',
   NULL, 'arquivada', 'Improcedente. A pontuação foi refeita por outra comissão e o resultado se manteve; não há vínculo entre o servidor e a associação.', 'Eduardo Matos Quintela',
   '2026-03-10 16:05-04', '2026-05-02 09:00-04'),
  (4, 'conflito', false, 'Roberto Siqueira Antunes', 'roberto.antunes@exemplo.test', '(95) 90000-0204', 'Técnico desportivo',
   'Servidor da Divisão de Patrimônio e Compras', 'Julho de 2026', 'Divisão de Patrimônio e Compras',
   'Servidor que participa da pesquisa de preços seria sócio de empresa fornecedora de material esportivo.',
   'Consulta pública ao quadro societário', 'em_analise', NULL, 'Eduardo Matos Quintela',
   '2026-07-22 14:20-04', '2026-07-24 08:30-04'),
  (5, 'corrupcao', true, NULL, NULL, NULL, NULL, 'Professor de escolinha esportiva no interior',
   'Agosto de 2026', 'Quadra Poliesportiva de Rorainópolis', 'Pais relatam cobrança de "taxa de uniforme" para matrícula em escolinha que é gratuita.',
   'Áudio de mensagem de voz', 'em_investigacao', 'Ouvidos três responsáveis; caso encaminhado à Corregedoria.', 'Eduardo Matos Quintela',
   '2026-08-30 19:02-04', '2026-09-18 10:10-04'),
  (6, 'irregularidade', true, NULL, NULL, NULL, NULL, 'Fornecedor de material esportivo e recebedor do almoxarifado',
   '09/10/2026', 'Almoxarifado Central', 'Entrega de bolas de futsal em quantidade menor que a da nota fiscal, recebida sem conferência.',
   NULL, 'pendente', NULL, NULL,
   '2026-10-14 08:47-04', NULL),
  (7, 'outro', false, 'Cláudia Ferreira Bentes', 'claudia.bentes@exemplo.test', '(95) 90000-0207', NULL,
   'Administração do Ginásio Central', '18/10/2026', 'Ginásio Central', 'Ginásio fechado no sábado à tarde, no horário divulgado para uso livre da comunidade.',
   NULL, 'pendente', NULL, NULL,
   '2026-10-20 17:35-04', NULL),
  (8, 'irregularidade', true, NULL, NULL, NULL, NULL, 'Servidor do setor administrativo',
   'Abril de 2026', 'Sede do Instituto', 'Registro de ponto feito por colega em nome de servidor ausente.',
   NULL, 'concluida', 'Procedente. Desconto das ausências e advertência aplicados; frequência passou a ser validada pela chefia diariamente.', 'Eduardo Matos Quintela',
   '2026-05-18 11:25-04', '2026-06-30 16:00-04')
) AS d(n, t, an, nm, em, tel, cg, env, dto, loc, d, ev, st, par, resp, cr, up);
-- a próxima denúncia pelo portal continua a numeração (registrar_denuncia_publica usa esta sequência)
SELECT setval('public.denuncias_protocolo_seq', 8) AS _ \gset

-- ===================================================================== SIC / LAI
-- BUG do sistema (ROADMAP, P16): o trigger tr_historico_lai (função registrar_historico_lai,
-- supabase/baseline/schema/01_pre_data.sql:11922) lê NEW.responsavel_id / OLD.responsavel_id (linhas 11941, 11965
-- e 11966), mas solicitacoes_sic não tem a coluna responsavel_id. O PL/pgSQL só resolve o campo ao executar a
-- instrução, então TODO INSERT (e todo UPDATE com mudança de status ou prazo) em solicitacoes_sic falha com
-- 'record "old" has no field "responsavel_id"' (no INSERT o CASE da linha 11965 já cita OLD). Contorno só aqui: desliga esse trigger durante os INSERTs e
-- grava o historico_lai à mão logo abaixo; religa antes do fim da transação.
ALTER TABLE public.solicitacoes_sic DISABLE TRIGGER tr_historico_lai;

INSERT INTO public.solicitacoes_sic (id, protocolo, solicitante_nome, solicitante_documento, solicitante_email, solicitante_telefone,
  descricao_pedido, categoria, forma_recebimento, status, prazo_resposta, respondido_em, respondido_por, resposta,
  recurso_texto, recurso_data, recurso_resposta, recurso_respondido_em, recurso_respondido_por, created_at, updated_at)
SELECT pg_temp.id('0c', n), 'SIC-2026-' || lpad(n::text, 4, '0'), nm, pg_temp.cpf(cpfb), em, tel, d, cat, fr, st,
       public.calcular_prazo_lai(cr::date, 'resposta_inicial'), resp_em::timestamptz, pg_temp.srv(resp_por), resp,
       rec, rec_em::timestamptz, rec_resp, rec_resp_em::timestamptz, pg_temp.srv(rec_por), cr::timestamptz,
       coalesce(rec_resp_em, rec_em, resp_em, cr)::timestamptz
FROM (VALUES
  (1, 'Paulo Henrique Dantas', '402118731', 'paulo.dantas@exemplo.test', '(95) 90000-0301',
   'Solicito o calendário e o regulamento dos Jogos Escolares de Roraima 2026, com as modalidades e as categorias por idade.',
   'Esporte', 'email', 'encerrada', '2026-01-19 09:12-04', '2026-02-04 15:20-04', 4,
   'Encaminhamos o regulamento geral e o calendário aprovados (anexos). As inscrições das escolas ocorrem de 2 a 27 de março pelo portal do Instituto.',
   NULL, NULL, NULL, NULL, NULL),
  (2, 'Lúcia Maria Carvalho Pimentel', '511320946', 'lucia.pimentel@exemplo.test', '(95) 90000-0302',
   'Peço a relação nominal dos cargos em comissão ocupados no Instituto, com a remuneração bruta de cada um em fevereiro de 2026.',
   'Pessoal', 'email', 'respondida', '2026-03-03 11:40-04', '2026-03-24 10:05-04', 6,
   'Segue a relação dos cargos em comissão com a remuneração bruta de fevereiro/2026, conforme a tabela de cargos publicada no portal.',
   'A resposta trouxe a remuneração por cargo, não por servidor. Peço a relação nominal, que é informação de transparência ativa.',
   '2026-03-30 08:55-04', 'Recurso provido em parte: enviada a relação nominal com a remuneração bruta; descontos pessoais não são divulgados (art. 31 da Lei nº 12.527/2011).',
   '2026-04-08 16:40-04', 2),
  (3, 'Associação Desportiva Vila Nova', '633401257', 'contato.vilanova@exemplo.test', '(95) 90000-0303',
   'Quais foram os valores repassados às federações esportivas em 2025 e por qual instrumento?',
   'Repasses', 'email', 'encerrada', '2026-05-12 14:00-04', '2026-06-01 09:30-04', 7,
   'O Instituto foi criado em 29/12/2025 e não fez repasses em 2025. Os repasses daquele exercício eram da Secretaria de Estado da Educação e Desporto, para onde o pedido foi encaminhado.',
   NULL, NULL, NULL, NULL, NULL),
  (4, 'Fernando Augusto Rabelo', '724512368', 'fernando.rabelo@exemplo.test', '(95) 90000-0304',
   'Solicito cópia integral do processo do Pregão Eletrônico nº 001/2026 (aquisição de mobiliário), incluindo as propostas dos licitantes.',
   'Licitações e contratos', 'email', 'respondida', '2026-07-07 10:18-04', '2026-07-28 17:00-04', 8,
   'Disponibilizamos o acesso externo ao processo SEI 18101.000127/2026-44. As planilhas de custos das propostas têm informações protegidas por sigilo comercial e foram tarjadas.',
   'Peço a íntegra das propostas: a planilha de preços do vencedor é pública depois da homologação.',
   '2026-10-19 09:30-04', NULL, NULL, NULL),
  (5, 'Raimunda Sousa Brito', '835623479', NULL, '(95) 90000-0305',
   'Quais os horários e quantas vagas existem nas escolinhas esportivas de Rorainópolis para crianças de 8 a 12 anos?',
   'Programas', 'presencial', 'encerrada', '2026-08-25 08:30-04', '2026-09-02 11:15-04', 13,
   'Há 60 vagas de futsal e 40 de vôlei, de segunda a quinta, das 14h às 16h, na Quadra Poliesportiva de Rorainópolis. Inscrições na própria quadra com documento do responsável.',
   NULL, NULL, NULL, NULL, NULL),
  (6, 'Gabriel Moura Nascimento', '946734580', 'gabriel.nascimento@exemplo.test', '(95) 90000-0306',
   'Quantas bolsas atleta foram pagas em 2026, por modalidade e categoria, e qual o valor mensal de cada categoria?',
   'Programas', 'email', 'em_analise', '2026-09-29 16:45-04', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  (7, 'Jornal Folha do Lavrado', '357845691', 'redacao.lavrado@exemplo.test', '(95) 90000-0307',
   'Peço a relação dos bens patrimoniais do Ginásio Central e o resultado do último inventário.',
   'Patrimônio', 'email', 'em_analise', '2026-10-13 13:10-04', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  (8, 'Tatiane Lopes Farias', '468956702', 'tatiane.farias@exemplo.test', '(95) 90000-0308',
   'Como agendar o Estádio para um torneio comunitário em dezembro e quais documentos são exigidos?',
   'Unidades esportivas', 'email', 'pendente', '2026-10-21 10:02-04', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  (9, 'Instituto Juventude em Rede', '579067813', 'contato.juventudeemrede@exemplo.test', '(95) 90000-0309',
   'Solicito os relatórios de execução física e financeira do programa Juventude Ativa no 1º semestre de 2026.',
   'Programas', 'email', 'pendente', '2026-10-22 15:48-04', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)
) AS s(n, nm, cpfb, em, tel, d, cat, fr, st, cr, resp_em, resp_por, resp, rec, rec_em, rec_resp, rec_resp_em, rec_por);

ALTER TABLE public.solicitacoes_sic ENABLE TRIGGER tr_historico_lai;

INSERT INTO public.recursos_lai (id, solicitacao_id, instancia, numero_recurso, data_interposicao, prazo_resposta, fundamentacao,
  status, responsavel_analise_id, data_analise, decisao, fundamentacao_decisao, created_by, created_at)
SELECT pg_temp.id('0d', n), pg_temp.id('0c', s), i::public.instancia_recurso, num, di::timestamptz, pr::date, f,
       st::public.status_recurso_lai, ra, da::timestamptz, dec, fd, :uid, di::timestamptz
FROM (VALUES
  (1, 2, 'primeira', 'REC-2026-0001', '2026-03-30 08:55-04', '2026-04-06',
   'A resposta trouxe a remuneração por cargo, não por servidor. Peço a relação nominal, que é informação de transparência ativa.',
   'deferido_parcial', pg_temp.srv(2), '2026-04-08 16:40-04', 'Provido em parte',
   'Remuneração bruta individualizada é pública; descontos de natureza pessoal são protegidos (art. 31 da Lei nº 12.527/2011).'),
  (2, 4, 'primeira', 'REC-2026-0002', '2026-10-19 09:30-04', '2026-10-26',
   'Peço a íntegra das propostas: a planilha de preços do vencedor é pública depois da homologação.',
   'em_analise', pg_temp.srv(2), NULL, NULL, NULL)
) AS r(n, s, i, num, di, pr, f, st, ra, da, dec, fd);

-- histórico gravado à mão (o trigger está quebrado, ver acima): abertura, classificação, resposta, recurso, encerramento
INSERT INTO public.historico_lai (solicitacao_id, tipo_evento, status_anterior, status_novo, prazo_novo, observacao, created_by, created_at)
SELECT pg_temp.id('0c', s), ev::public.tipo_evento_lai, sa, sn, (SELECT prazo_resposta FROM public.solicitacoes_sic WHERE id = pg_temp.id('0c', s)),
       obs, :uid, quando::timestamptz
FROM (VALUES
  (1, 'abertura', NULL, 'pendente', 'Pedido registrado pelo formulário do SIC', '2026-01-19 09:12-04'),
  (1, 'encaminhamento', 'pendente', 'em_analise', 'Encaminhado à Diretoria de Esporte', '2026-01-20 10:00-04'),
  (1, 'resposta_final', 'em_analise', 'respondida', 'Resposta enviada por e-mail', '2026-02-04 15:20-04'),
  (1, 'encerramento', 'respondida', 'encerrada', 'Prazo de recurso decorrido', '2026-02-16 08:00-04'),
  (2, 'abertura', NULL, 'pendente', 'Pedido registrado pelo formulário do SIC', '2026-03-03 11:40-04'),
  (2, 'encaminhamento', 'pendente', 'em_analise', 'Encaminhado à Divisão de Recursos Humanos', '2026-03-04 09:10-04'),
  (2, 'resposta_final', 'em_analise', 'respondida', 'Resposta enviada por e-mail', '2026-03-24 10:05-04'),
  (2, 'recurso_interposto', 'respondida', 'respondida', 'Recurso de 1ª instância REC-2026-0001', '2026-03-30 08:55-04'),
  (2, 'recurso_respondido', 'respondida', 'respondida', 'Recurso provido em parte pela Presidência', '2026-04-08 16:40-04'),
  (3, 'abertura', NULL, 'pendente', 'Pedido registrado pelo formulário do SIC', '2026-05-12 14:00-04'),
  (3, 'classificacao', 'pendente', 'em_analise', 'Classificado como repasses', '2026-05-13 09:00-04'),
  (3, 'resposta_final', 'em_analise', 'respondida', 'Pedido encaminhado à SEED e requerente informado', '2026-06-01 09:30-04'),
  (3, 'encerramento', 'respondida', 'encerrada', 'Prazo de recurso decorrido', '2026-06-12 08:00-04'),
  (4, 'abertura', NULL, 'pendente', 'Pedido registrado pelo formulário do SIC', '2026-07-07 10:18-04'),
  (4, 'encaminhamento', 'pendente', 'em_analise', 'Encaminhado à Divisão de Patrimônio e Compras', '2026-07-08 08:40-04'),
  (4, 'resposta_final', 'em_analise', 'respondida', 'Acesso externo ao processo SEI concedido', '2026-07-28 17:00-04'),
  (4, 'recurso_interposto', 'respondida', 'respondida', 'Recurso de 1ª instância REC-2026-0002', '2026-10-19 09:30-04'),
  (5, 'abertura', NULL, 'pendente', 'Pedido presencial registrado pelo atendente', '2026-08-25 08:30-04'),
  (5, 'resposta_final', 'pendente', 'respondida', 'Resposta entregue por telefone e registrada', '2026-09-02 11:15-04'),
  (5, 'encerramento', 'respondida', 'encerrada', 'Requerente satisfeito', '2026-09-02 11:20-04'),
  (6, 'abertura', NULL, 'pendente', 'Pedido registrado pelo formulário do SIC', '2026-09-29 16:45-04'),
  (6, 'encaminhamento', 'pendente', 'em_analise', 'Encaminhado à Diretoria de Esporte', '2026-09-30 09:20-04'),
  (7, 'abertura', NULL, 'pendente', 'Pedido registrado pelo formulário do SIC', '2026-10-13 13:10-04'),
  (7, 'encaminhamento', 'pendente', 'em_analise', 'Encaminhado à Divisão de Patrimônio e Compras', '2026-10-14 08:15-04'),
  (8, 'abertura', NULL, 'pendente', 'Pedido registrado pelo formulário do SIC', '2026-10-21 10:02-04'),
  (9, 'abertura', NULL, 'pendente', 'Pedido registrado pelo formulário do SIC', '2026-10-22 15:48-04')
) AS h(s, ev, sa, sn, obs, quando);

-- publicações oficiais (/transparencia/editais e /editais no portal; arquivo sem upload: sem arquivo_url)
INSERT INTO public.publicacoes_lai (id, categoria, subcategoria, titulo, descricao, contrato_id, unidade_id, periodo_referencia,
  ano_referencia, mes_referencia, publicado, data_publicacao, publicado_por, ordem_exibicao, destaque, created_by, created_at)
SELECT pg_temp.id('0f', n), cat, sub, t, d, ct, un, per, ano, mes, pub, dp::timestamptz, CASE WHEN pub THEN :uid END, o, dest, :uid,
       coalesce(dp, '2026-10-20 10:00-04')::timestamptz
FROM (VALUES
  (1, 'Edital', 'Chamamento público', 'Edital nº 001/2026 — Seleção de projetos esportivos comunitários',
   'Seleção de até 20 projetos de iniciação esportiva em bairros e comunidades, com apoio de até R$ 30.000,00 cada.', NULL::uuid, pg_temp.un(3), NULL, 2026, NULL, true, '2026-03-02 09:00-04', 1, true),
  (2, 'Edital', 'Resultado', 'Resultado final do Edital nº 001/2026',
   'Relação dos projetos selecionados após a fase de recursos.', NULL, pg_temp.un(3), NULL, 2026, NULL, true, '2026-05-08 09:00-04', 2, false),
  (3, 'Edital', 'Credenciamento', 'Edital nº 002/2026 — Credenciamento de árbitros para os Jogos Escolares',
   'Credenciamento de árbitros de futsal, vôlei, handebol e basquete para as etapas municipais e estadual.', NULL, pg_temp.un(3), NULL, 2026, NULL, true, '2026-02-10 09:00-04', 3, false),
  (4, 'Edital', 'Chamamento público', 'Edital nº 003/2026 — Bolsa Atleta Roraima',
   'Concessão de bolsas a atletas de rendimento com resultados em competições estaduais e nacionais.', NULL, pg_temp.un(3), NULL, 2026, NULL, true, '2026-06-15 09:00-04', 4, true),
  (5, 'Edital', 'Chamamento público', 'Edital nº 004/2026 — Uso do Parque Aquático por escolas e projetos sociais',
   'Cessão de horários do Parque Aquático para escolas públicas e entidades sem fins lucrativos.', NULL, pg_temp.un(3), NULL, 2026, NULL, false, NULL, 5, false),
  (6, 'Relatório de Gestão', NULL, 'Relatório de Gestão — 1º semestre de 2026',
   'Resultados dos programas, execução orçamentária e indicadores do semestre.', NULL, pg_temp.un(1), '1º semestre/2026', 2026, 6, true, '2026-08-05 10:00-04', 1, false),
  (7, 'Diárias e Passagens', NULL, 'Diárias e passagens concedidas — setembro de 2026',
   'Relação de diárias pagas no mês, com servidor, destino e motivo da viagem.', NULL, pg_temp.un(6), 'Setembro/2026', 2026, 9, false, NULL, 1, false),
  (8, 'Contratos', 'Extrato', 'Extrato do Contrato nº 001/2026 — Fornecimento de mobiliário',
   'Extrato publicado no Diário Oficial do Estado.', 'f5000000-0000-4000-8000-000000000001'::uuid, pg_temp.un(7), NULL, 2026, 3, true, '2026-03-24 09:00-04', 1, false),
  (9, 'Contratos', 'Extrato', 'Extrato do Contrato nº 002/2026 — Limpeza e conservação do Ginásio Central',
   'Extrato publicado no Diário Oficial do Estado.', 'f5000000-0000-4000-8000-000000000002'::uuid, pg_temp.un(7), NULL, 2026, 4, true, '2026-04-03 09:00-04', 2, false)
) AS p(n, cat, sub, t, d, ct, un, per, ano, mes, pub, dp, o, dest);

-- ===================================================================== administração: envios, páginas públicas, setores
-- config_envio: configuração visível na tela /admin/config-envios, mas DESLIGADA (sem credencial gravada,
-- um disparo de verdade falharia). segredo_id fica nulo.
INSERT INTO public.config_envio (canal, ativo, provedor, remetente_nome, remetente_email, responder_para, smtp_host, smtp_porta,
  smtp_seguranca, smtp_usuario, marca_nome, marca_cor, rodape, wa_phone_number_id, wa_business_account_id, wa_templates) VALUES
  ('email', false, 'smtp', 'IDJuv — Comunicação', 'nao-responda@exemplo.test', 'gabinete@exemplo.test', 'smtp.exemplo.test', 587,
   'starttls', 'nao-responda@exemplo.test', 'IDJuv', '#164069',
   'Instituto de Desporto, Juventude e Lazer do Estado de Roraima — Av. Brigadeiro Eduardo Gomes, 3232, Estados, Boa Vista/RR',
   NULL, NULL, '{}'::jsonb),
  ('whatsapp', false, 'meta_cloud', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'IDJuv', '#164069', NULL,
   '100200300400500', '900800700600500', '{"convite_reuniao": {"nome": "convite_reuniao_idjuv", "idioma": "pt_BR"}}'::jsonb);

INSERT INTO public.envios_log (id, criado_em, canal, provedor, destinatario, assunto, origem_modulo, status, erro, id_externo, disparado_por)
SELECT pg_temp.id('12', n), q::timestamptz, c, p, d, a, o, st, er, ie, :uid
FROM (VALUES
  (1, '2026-09-15 09:02-04', 'email', 'smtp', 'servidor2@inst.exemplo.test', 'Teste de configuração do e-mail', 'teste', 'enviado', NULL, '<a1f3c9@smtp.exemplo.test>'),
  (2, '2026-09-15 09:05-04', 'whatsapp', 'meta_cloud', '+5595900000003', NULL, 'teste', 'falhou', 'Template convite_reuniao_idjuv ainda em análise pela Meta', NULL),
  (3, '2026-10-08 14:30-04', 'email', 'smtp', 'servidor2@inst.exemplo.test', 'Convite: Reunião de diretoria', 'reunioes', 'enviado', NULL, '<b7d2e0@smtp.exemplo.test>'),
  (4, '2026-10-08 14:30-04', 'email', 'smtp', 'servidor3@inst.exemplo.test', 'Convite: Reunião de diretoria', 'reunioes', 'enviado', NULL, '<b7d2e1@smtp.exemplo.test>'),
  (5, '2026-10-08 14:31-04', 'email', 'smtp', 'servidor4@inst.exemplo.test', 'Convite: Reunião de diretoria', 'reunioes', 'falhou', 'Caixa postal do destinatário cheia (552)', NULL),
  (6, '2026-10-16 10:12-04', 'email', 'smtp', 'servidor4@inst.exemplo.test', 'Convite: Reunião de planejamento dos Jogos Escolares', 'reunioes', 'enviado', NULL, '<c19a44@smtp.exemplo.test>'),
  (7, '2026-10-16 10:12-04', 'whatsapp', 'meta_cloud', '+5595900000013', NULL, 'reunioes', 'enviado', NULL, 'wamid.HBgMNTU5NTkwMDAwMDEzFQIAERgS'),
  (8, '2026-10-21 08:00-04', 'email', 'smtp', 'servidor6@inst.exemplo.test', 'Aviso: prazo de fechamento da frequência de outubro', 'avisos', 'enviado', NULL, '<d55e10@smtp.exemplo.test>')
) AS e(n, q, c, p, d, a, o, st, er, ie);

-- histórico das páginas públicas (páginas do baseline, pelo código): manutenção ligada e desligada
INSERT INTO public.config_paginas_historico (id, pagina_id, acao, dados_anteriores, dados_novos, usuario_id, created_at)
SELECT pg_temp.id('13', n), p.id, a, jsonb_build_object('codigo', p.codigo, 'em_manutencao', ant),
       jsonb_build_object('codigo', p.codigo, 'em_manutencao', nov), :uid, q::timestamptz
FROM (VALUES
  (1, 'transparencia_lai', 'manutencao_on', false, true, '2026-09-02 18:00-04'),
  (2, 'transparencia_lai', 'manutencao_off', true, false, '2026-09-03 08:30-04'),
  (3, 'cadastro_arbitros', 'atualizar', false, false, '2026-02-10 09:05-04'),
  (4, 'editais_publico', 'manutencao_on', false, true, '2026-06-14 20:00-04'),
  (5, 'editais_publico', 'manutencao_off', true, false, '2026-06-15 08:50-04')
) AS h(n, cod, a, ant, nov, q)
JOIN public.config_paginas_publicas p ON p.codigo = h.cod;

-- setores dos módulos (/admin/setores-modulos). Hoje só o RH tem regra no banco, e em modo 'registrar'
-- (não bloqueia lançamento): estas linhas só dizem qual unidade é o setor de cada módulo.
INSERT INTO public.setores_modulo (id, modulo, unidade_id, inclui_subordinadas, ativo, observacao)
SELECT pg_temp.id('14', n), m::public.app_module, pg_temp.un(u), sub, true, obs
FROM (VALUES
  ( 1, 'rh', 5, false, 'Divisão de Recursos Humanos'),
  ( 2, 'financeiro', 6, false, NULL),
  ( 3, 'compras', 7, false, NULL),
  ( 4, 'patrimonio', 7, false, NULL),
  ( 5, 'contratos', 2, true, 'Gestores de contrato ficam nas divisões da DIRAF'),
  ( 6, 'comunicacao', 8, false, NULL),
  ( 7, 'programas', 3, false, 'Programas esportivos'),
  ( 8, 'programas', 4, false, 'Programas de juventude'),
  ( 9, 'governanca', 1, false, NULL),
  (10, 'integridade', 9, false, 'Canal de denúncias com a Assessoria Jurídica'),
  (11, 'transparencia', 9, false, 'Serviço de Informação ao Cidadão'),
  (12, 'gabinete', 1, false, NULL),
  (13, 'workflow', 2, true, NULL)
) AS s(n, m, u, sub, obs);

-- débitos técnicos (nenhuma tela lê hoje; registro do próprio sistema)
INSERT INTO public.debitos_tecnicos (id, codigo, titulo, descricao, modulo, fase_origem, fase_destino, prioridade, status, impacto,
  solucao_proposta, estimativa_esforco, responsavel_id, data_identificacao, data_prevista, data_resolucao, created_by)
SELECT pg_temp.id('15', n), c, t, d, m, fo, fd, p::public.prioridade_debito, st::public.status_debito, imp, sol, est,
       pg_temp.srv(1), di::date, dp::date, dr::date, :uid
FROM (VALUES
  (1, 'DT-001', 'Histórico do SIC grava coluna inexistente', 'Trigger registrar_historico_lai lê responsavel_id, que solicitacoes_sic não tem', 'transparencia', 'Fase 2', 'Fase 3', 'critica', 'pendente',
   'Nenhum pedido de informação pode ser registrado ou respondido', 'Migração que remova responsavel_id do trigger', '2 horas', '2026-10-13', '2026-11-06', NULL),
  (2, 'DT-002', 'Painel de transparência conta colunas inexistentes', 'Contagem de publicações e pedidos LAI usa colunas que as tabelas não têm', 'transparencia', 'Fase 2', 'Fase 3', 'alta', 'pendente',
   'Indicadores do painel sempre zerados', 'Contar publicacoes_lai.publicado e solicitacoes_sic.status', '4 horas', '2026-10-15', '2026-11-13', NULL),
  (3, 'DT-003', 'Remuneração individualizada no portal', 'Página de cargos mostra só a tabela, sem a remuneração por servidor', 'transparencia', 'Fase 2', 'Fase 4', 'media', 'em_andamento',
   'Item 2.3 da transparência ativa parcialmente conforme', 'Função pública com a remuneração bruta mensal por servidor', '3 dias', '2026-06-15', '2026-11-30', NULL),
  (4, 'DT-004', 'Relação de diárias no portal', 'Diárias pagas não são publicadas automaticamente', 'transparencia', 'Fase 2', 'Fase 4', 'media', 'adiado',
   'Item 2.5 da transparência ativa não conforme', 'Publicação mensal a partir de viagens_diarias', '2 dias', '2026-06-15', '2027-01-29', NULL),
  (5, 'DT-005', 'Painel de vigência de contratos', 'Alertas de vencimento de contratos', 'contratos', 'Fase 1', 'Fase 2', 'alta', 'resolvido',
   'Contratos contínuos venciam sem aviso', 'Painel com alertas de 120, 90 e 60 dias', '5 dias', '2026-03-02', '2026-05-15', '2026-05-12')
) AS x(n, c, t, d, m, fo, fd, p, st, imp, sol, est, di, dp, dr);

-- ===================================================================== acesso do login de teste
-- O app ainda lê user_modules (AuthContext.tsx:95, has_module nas policies), user_permissions (AuthContext.tsx:96)
-- e user_org_units (useApprovalRequests.ts:95). O login de teste já é admin (dados-teste/bootstrap), mas recebe
-- também todos os módulos, todas as permissões do catálogo e todas as unidades (primária: DRH, a da lotação).
-- Sem login ligado ao servidor fictício (dados-teste rodado sem -v email), nada entra aqui.
INSERT INTO public.user_modules (user_id, module, created_by, permissions)
SELECT u.id, m, u.id, '{}'::text[]
FROM public.profiles u CROSS JOIN unnest(enum_range(NULL::public.app_module)) AS m
WHERE u.servidor_id = 'c0000000-0000-4000-8000-000000000001'
ON CONFLICT (user_id, module) DO NOTHING;

INSERT INTO public.user_permissions (user_id, permission, created_by)
SELECT u.id, c.permission_code, u.id
FROM public.profiles u CROSS JOIN public.module_permissions_catalog c
WHERE u.servidor_id = 'c0000000-0000-4000-8000-000000000001'
ON CONFLICT (user_id, permission) DO NOTHING;

INSERT INTO public.user_org_units (user_id, unidade_id, is_primary, access_scope, created_by)
SELECT u.id, e.id, e.id = pg_temp.un(5), 'all'::public.access_scope, u.id
FROM public.profiles u CROSS JOIN public.estrutura_organizacional e
WHERE u.servidor_id = 'c0000000-0000-4000-8000-000000000001' AND e.ativo
ON CONFLICT (user_id, unidade_id) DO NOTHING;

-- limite_requisicoes_publicas fica vazia de propósito: é o contador do limite de envio dos formulários públicos.

SELECT 'controles_internos' AS tabela, count(*) FROM public.controles_internos
UNION ALL SELECT 'avaliacoes_controle', count(*) FROM public.avaliacoes_controle
UNION ALL SELECT 'planos_tratamento_risco', count(*) FROM public.planos_tratamento_risco
UNION ALL SELECT 'itens_checklist', count(*) FROM public.itens_checklist
UNION ALL SELECT 'matriz_raci_atribuicoes', count(*) FROM public.matriz_raci_atribuicoes
UNION ALL SELECT 'denuncias', count(*) FROM public.denuncias
UNION ALL SELECT 'solicitacoes_sic', count(*) FROM public.solicitacoes_sic
UNION ALL SELECT 'historico_lai', count(*) FROM public.historico_lai
UNION ALL SELECT 'publicacoes_lai', count(*) FROM public.publicacoes_lai
UNION ALL SELECT 'dados_oficiais', count(*) FROM public.dados_oficiais
UNION ALL SELECT 'user_modules', count(*) FROM public.user_modules;

COMMIT;
