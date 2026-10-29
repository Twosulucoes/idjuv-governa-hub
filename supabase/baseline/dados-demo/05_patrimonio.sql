-- Dados FICTÍCIOS de demonstração — patrimônio, almoxarifado, inventário (e PWA de coleta) e unidades locais.
-- Só para o banco de TESTE, depois de dados-teste.sql.
-- Guia: docs/NOVO_BANCO.md §9.
--
-- Usa os 40 bens, as 4 unidades locais, o Almoxarifado Central, os 3 itens de material e o estoque do
-- dados-teste.sql. Os bens são escolhidos pela posição (row_number por numero_patrimonio), não pelo número,
-- para continuar valendo se o número de tombamento for trocado antes deste arquivo.
-- Ordem cronológica: inventário anual 2025 → regularizações (transferências, manutenções, ocorrências e
-- baixas) → inventário rotativo 1º sem/2026 → movimentos de 2026 → inventário anual 2026 (em andamento).
-- Os triggers do sistema gravam historico_patrimonio, mudam a situação do bem e atualizam o estoque;
-- no fim, as datas do histórico gerado aqui são acertadas para a data de cada fato.
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
  IF EXISTS (SELECT 1 FROM public.campanhas_inventario) THEN
    RAISE EXCEPTION 'recusado: os dados de demonstração deste módulo já foram carregados';
  END IF;
  IF (SELECT count(*) FROM public.bens_patrimoniais) < 40 THEN
    RAISE EXCEPTION 'recusado: esperava os 40 bens do dados-teste.sql';
  END IF;
END $$;
-- quem "faz" as ações (auth.uid() nos triggers de autoria): o login de teste ligado ao servidor fictício
SELECT set_config('request.jwt.claim.sub', coalesce((SELECT id::text FROM public.profiles
  WHERE servidor_id = 'c0000000-0000-4000-8000-000000000001'), ''), true) AS _ \gset
SELECT set_config('request.jwt.claim.role', 'authenticated', true) AS _ \gset

-- ===================================================================== atalhos
-- bem pela posição (1..40) na ordem do número de tombamento do dados-teste
CREATE TEMP TABLE _bem ON COMMIT DROP AS
  SELECT row_number() OVER (ORDER BY numero_patrimonio)::int AS n, id
    FROM public.bens_patrimoniais
   ORDER BY numero_patrimonio LIMIT 40;
CREATE FUNCTION pg_temp.b(n int) RETURNS uuid LANGUAGE sql STABLE AS $f$ SELECT id FROM _bem WHERE _bem.n = $1 $f$;
CREATE FUNCTION pg_temp.s(n int) RETURNS uuid LANGUAGE sql IMMUTABLE AS $f$ SELECT ('c0000000-0000-4000-8000-0000000000' || lpad($1::text, 2, '0'))::uuid $f$;
CREATE FUNCTION pg_temp.u(n int) RETURNS uuid LANGUAGE sql IMMUTABLE AS $f$ SELECT ('a0000000-0000-4000-8000-00000000000' || $1)::uuid $f$;
CREATE FUNCTION pg_temp.ul(n int) RETURNS uuid LANGUAGE sql IMMUTABLE AS $f$ SELECT ('e0000000-0000-4000-8000-00000000000' || $1)::uuid $f$;
-- id fixo do grupo: d5000000-0000-4000-8000-<bloco 4 dígitos><seq 8 dígitos>
CREATE FUNCTION pg_temp.id(bloco int, seq int) RETURNS uuid LANGUAGE sql IMMUTABLE AS $f$
  SELECT ('d5000000-0000-4000-8000-' || lpad($1::text, 4, '0') || lpad($2::text, 8, '0'))::uuid $f$;
CREATE FUNCTION pg_temp.cpf(base text) RETURNS text LANGUAGE plpgsql AS $f$
DECLARE s int; d1 int; d2 int; i int;
BEGIN
  s := 0; FOR i IN 1..9 LOOP s := s + substr(base, i, 1)::int * (11 - i); END LOOP;
  d1 := 11 - s % 11; IF d1 >= 10 THEN d1 := 0; END IF;
  s := 0; FOR i IN 1..9 LOOP s := s + substr(base, i, 1)::int * (12 - i); END LOOP;
  s := s + d1 * 2; d2 := 11 - s % 11; IF d2 >= 10 THEN d2 := 0; END IF;
  RETURN base || d1 || d2;
END $f$;
CREATE FUNCTION pg_temp.sigla(u uuid) RETURNS text LANGUAGE sql STABLE AS $f$
  SELECT sigla || ' — ' || nome FROM public.estrutura_organizacional WHERE id = $1 $f$;

-- ===================================================================== campanhas de inventário
-- Blocos de id: 0001 campanhas · 0002 movimentações · 0003 manutenções · 0004 ocorrências · 0005 baixas
-- 0006 coletas · 0007 conciliações · 0008 fotos · 0009 unidades da campanha · 0010 agenda
-- 0011 patrimônio das unidades · 0012 requisições · 0013 itens da requisição · 0014 mov. de estoque · 0015 mov. do bem
INSERT INTO public.campanhas_inventario (id, nome, ano, tipo, data_inicio, data_fim, unidades_abrangidas, responsavel_geral_id, equipe_coleta, status, observacoes, created_by, created_at) VALUES
  (pg_temp.id(1, 1), 'Inventário Anual de Bens Móveis — Exercício 2025', 2025, 'geral', '2025-11-17', '2025-12-12',
   ARRAY[pg_temp.ul(1), pg_temp.ul(2), pg_temp.ul(3), pg_temp.ul(4)], pg_temp.s(8), ARRAY[pg_temp.s(8), pg_temp.s(11), pg_temp.s(12)],
   'em_andamento', 'Comissão designada pela Portaria nº 412/2025/PRES. Inventário de encerramento do exercício para o balanço patrimonial (processo SEI 18101.006214/2025-17).',
   auth.uid(), '2025-11-10 09:00-04'),
  (pg_temp.id(1, 2), 'Inventário Rotativo — Equipamentos Esportivos (1º semestre/2026)', 2026, 'rotativo', '2026-04-13', '2026-04-30',
   ARRAY[pg_temp.ul(1), pg_temp.ul(2), pg_temp.ul(3), pg_temp.ul(4)], pg_temp.s(11), ARRAY[pg_temp.s(11), pg_temp.s(13)],
   'em_andamento', 'Conferência dos equipamentos esportivos cedidos às praças de esporte, antes da temporada dos Jogos Escolares.',
   auth.uid(), '2026-04-06 10:30-04'),
  (pg_temp.id(1, 3), 'Inventário Anual de Bens Móveis — Exercício 2026', 2026, 'geral', '2026-10-05', '2026-12-11',
   ARRAY[pg_temp.ul(1), pg_temp.ul(2), pg_temp.ul(3), pg_temp.ul(4)], pg_temp.s(8), ARRAY[pg_temp.s(8), pg_temp.s(11), pg_temp.s(12), pg_temp.s(18)],
   'em_andamento', 'Comissão designada pela Portaria nº 388/2026/PRES (processo SEI 18101.005873/2026-02). Prazo de entrega do relatório final: 18/12/2026.',
   auth.uid(), '2026-09-29 08:45-04'),
  (pg_temp.id(1, 4), 'Inventário Setorial — Almoxarifado Central e Divisão de Patrimônio', 2026, 'setorial', '2026-11-16', '2026-11-27',
   '{}', pg_temp.s(11), ARRAY[pg_temp.s(11), pg_temp.s(10)],
   'planejada', 'Conferência física do Almoxarifado Central e dos bens em depósito aguardando baixa.',
   auth.uid(), '2026-10-20 15:10-04');

INSERT INTO public.campanhas_inventario_unidades (id, campanha_id, unidade_local_id, situacao, equipe, data_prevista, iniciada_em, concluida_em, observacao) VALUES
  (pg_temp.id(9, 1), pg_temp.id(1, 1), pg_temp.ul(1), 'concluida', 'Juliana Freitas Barros, Diego Sampaio Furtado', '2025-11-24', '2025-11-24 08:10-04', '2025-11-24 16:40-04', NULL),
  (pg_temp.id(9, 2), pg_temp.id(1, 1), pg_temp.ul(2), 'concluida', 'Diego Sampaio Furtado, Larissa Monteiro Paiva', '2025-11-26', '2025-11-26 08:00-04', '2025-11-26 12:30-04', 'Uma bola oficial de futsal não localizada; comunicado à Divisão de Patrimônio.'),
  (pg_temp.id(9, 3), pg_temp.id(1, 1), pg_temp.ul(3), 'concluida', 'Diego Sampaio Furtado', '2025-12-02', '2025-12-02 09:00-04', '2025-12-02 15:20-04', 'Deslocamento a Rorainópolis em veículo oficial (placa NAQ-2F17).'),
  (pg_temp.id(9, 4), pg_temp.id(1, 1), pg_temp.ul(4), 'concluida', 'Larissa Monteiro Paiva', '2025-12-04', '2025-12-04 08:30-04', '2025-12-04 11:00-04', NULL),
  (pg_temp.id(9, 5), pg_temp.id(1, 2), pg_temp.ul(1), 'concluida', 'Diego Sampaio Furtado, Thiago Barreto Cunha', '2026-04-14', '2026-04-14 08:00-04', '2026-04-14 10:15-04', NULL),
  (pg_temp.id(9, 6), pg_temp.id(1, 2), pg_temp.ul(2), 'concluida', 'Diego Sampaio Furtado, Thiago Barreto Cunha', '2026-04-15', '2026-04-15 08:20-04', '2026-04-15 11:40-04', NULL),
  (pg_temp.id(9, 7), pg_temp.id(1, 2), pg_temp.ul(3), 'com_pendencia', 'Thiago Barreto Cunha', '2026-04-22', '2026-04-22 09:00-04', '2026-04-22 14:00-04', 'Rede de vôlei rasgada por vandalismo; boletim de ocorrência registrado e reparo solicitado.'),
  (pg_temp.id(9, 8), pg_temp.id(1, 2), pg_temp.ul(4), 'excluida', NULL, NULL, NULL, NULL, 'Parque aquático sem equipamentos esportivos tombados no escopo do rotativo.'),
  (pg_temp.id(9, 9), pg_temp.id(1, 3), pg_temp.ul(1), 'concluida', 'Juliana Freitas Barros, Sofia Ramalho Torres', '2026-10-08', '2026-10-08 08:05-04', '2026-10-08 15:50-04', NULL),
  (pg_temp.id(9, 10), pg_temp.id(1, 3), pg_temp.ul(2), 'em_vistoria', 'Diego Sampaio Furtado, Larissa Monteiro Paiva', '2026-10-21', '2026-10-21 08:15-04', NULL, 'Vistoria das arquibancadas prevista para 26/10.'),
  (pg_temp.id(9, 11), pg_temp.id(1, 3), pg_temp.ul(3), 'a_visitar', 'Diego Sampaio Furtado', '2026-11-10', NULL, NULL, 'Aguardando conclusão da reforma da quadra para a vistoria.'),
  (pg_temp.id(9, 12), pg_temp.id(1, 3), pg_temp.ul(4), 'com_pendencia', 'Sofia Ramalho Torres', '2026-10-14', '2026-10-14 08:30-04', '2026-10-14 12:10-04', 'Bomba do filtro sem plaqueta de tombamento; pedido de reetiquetagem aberto.');

-- ===================================================================== inventário anual 2025 (concluído): coletas dos 40 bens
-- Sobrescritas: o que a comissão encontrou diferente do cadastro.
CREATE TEMP TABLE _c1 (n int, st public.status_coleta_inventario, setor int, resp int, ul int, sala text, obs text) ON COMMIT DROP;
INSERT INTO _c1 VALUES
  (10, 'divergente', 5, 9, NULL, 'Sala 6', 'Notebook em uso na Divisão de Recursos Humanos, cadastrado na DIRAF. Sem termo de transferência.'),
  (24, 'divergente', 3, 13, NULL, 'Sala 3', 'Mesa encontrada na Diretoria de Esporte; cadastro aponta Divisão de Patrimônio e Compras.'),
  (6, 'divergente', NULL, 14, 1, 'Depósito de materiais', 'Rede encontrada no Ginásio; cadastro aponta a quadra de Rorainópolis (interditada para reforma).'),
  (18, 'divergente', NULL, 15, NULL, 'Sala 7', 'Notebook em uso pela ASCOM na cobertura dos Jogos; empréstimo verbal, sem cautela assinada.'),
  (21, 'nao_localizado', NULL, NULL, NULL, NULL, 'Bola não localizada no depósito do estádio nem nas demais unidades.'),
  (35, 'avariado', NULL, NULL, NULL, NULL, 'Monitor com tela trincada no canto inferior direito.'),
  (31, 'avariado', NULL, NULL, NULL, NULL, 'Armário com porta empenada e fechadura quebrada; ferrugem na base.'),
  (30, 'em_manutencao', NULL, NULL, NULL, NULL, 'Rede recolhida para reparo.'),
  (33, 'sem_etiqueta', NULL, NULL, NULL, NULL, 'Plaqueta de tombamento descolada; bem identificado pelo número de série.');

INSERT INTO public.coletas_inventario (id, campanha_id, bem_id, status_coleta, localizacao_encontrada_unidade_id, localizacao_encontrada_sala,
  localizacao_encontrada_detalhe, responsavel_encontrado_id, observacoes, data_coleta, usuario_coletor_id, dispositivo_info, created_at)
SELECT pg_temp.id(6, k.n), pg_temp.id(1, 1), bp.id, coalesce(c.st, 'conferido'),
       coalesce(pg_temp.ul(c.ul), bp.unidade_local_id), coalesce(c.sala, bp.sala),
       coalesce(pg_temp.sigla(pg_temp.u(c.setor)), pg_temp.sigla(bp.unidade_id)),
       CASE WHEN c.st = 'nao_localizado' THEN NULL ELSE coalesce(pg_temp.s(c.resp), bp.responsavel_id) END,
       c.obs, ts, auth.uid(), '{"origem": "pwa", "app": "patrimonio-mobile", "plataforma": "Android 14"}'::jsonb, ts
  FROM _bem k
  JOIN public.bens_patrimoniais bp ON bp.id = k.id
  LEFT JOIN _c1 c ON c.n = k.n
  CROSS JOIN LATERAL (SELECT CASE
           WHEN bp.unidade_local_id = pg_temp.ul(2) THEN timestamptz '2025-11-26 09:00-04'
           WHEN bp.unidade_local_id = pg_temp.ul(3) THEN timestamptz '2025-12-02 10:00-04'
           ELSE timestamptz '2025-11-17 08:30-04' + ((k.n - 1) / 4) * interval '1 day' + ((k.n - 1) % 4) * interval '47 minutes' END
           + (k.n % 7) * interval '3 minutes' AS ts) t;

INSERT INTO public.conciliacoes_inventario (id, coleta_id, campanha_id, bem_id, tipo_divergencia, descricao_divergencia, ajuste_proposto, necessita_aprovacao, aprovador_id, data_aprovacao, status, observacoes, created_by, created_at) VALUES
  (pg_temp.id(7, 1), pg_temp.id(6, 10), pg_temp.id(1, 1), pg_temp.b(10), 'localizacao', 'Notebook encontrado na DRH (Sala 6) sob guarda de André Luiz Medeiros; cadastro aponta DIRAF.', 'Regularizar por transferência interna DIRAF → DRH com termo de responsabilidade.', true, auth.uid(), '2025-12-18 10:00-04', 'aplicado', 'Regularizado pela movimentação de 20/01/2026.', auth.uid(), '2025-12-15 14:00-04'),
  (pg_temp.id(7, 2), pg_temp.id(6, 24), pg_temp.id(1, 1), pg_temp.b(24), 'localizacao', 'Mesa de escritório em uso na DIESP; cadastro aponta DPC.', 'Transferir para a DIESP sob responsabilidade de Thiago Barreto Cunha.', true, auth.uid(), '2025-12-18 10:05-04', 'aplicado', 'Regularizado pela movimentação de 03/02/2026.', auth.uid(), '2025-12-15 14:05-04'),
  (pg_temp.id(7, 3), pg_temp.id(6, 6), pg_temp.id(1, 1), pg_temp.b(6), 'localizacao', 'Rede de vôlei guardada no Ginásio; cadastro aponta a quadra de Rorainópolis.', 'Transferir a carga para o Ginásio enquanto durar a reforma da quadra.', true, auth.uid(), '2025-12-18 10:10-04', 'aplicado', NULL, auth.uid(), '2025-12-15 14:10-04'),
  (pg_temp.id(7, 4), pg_temp.id(6, 18), pg_temp.id(1, 1), pg_temp.b(18), 'responsavel', 'Notebook com a ASCOM; responsável cadastrado é outro servidor.', 'Trocar o responsável para Gustavo Pereira Lago.', true, auth.uid(), '2025-12-18 10:15-04', 'rejeitado', 'Uso temporário durante evento; bem devolvido em 19/12/2025. Mantido o responsável cadastrado; orientada a emissão de cautela nos próximos empréstimos.', auth.uid(), '2025-12-15 14:15-04'),
  (pg_temp.id(7, 5), pg_temp.id(6, 21), pg_temp.id(1, 1), pg_temp.b(21), 'situacao', 'Bola oficial de futsal não localizada.', 'Registrar ocorrência de extravio e instruir processo de baixa por perda.', true, auth.uid(), '2025-12-18 10:20-04', 'aplicado', 'Baixa concluída em 2026 (processo SEI 18101.000318/2026-44).', auth.uid(), '2025-12-15 14:20-04'),
  (pg_temp.id(7, 6), pg_temp.id(6, 35), pg_temp.id(1, 1), pg_temp.b(35), 'situacao', 'Monitor com tela trincada.', 'Encaminhar para manutenção corretiva.', true, auth.uid(), '2025-12-18 10:25-04', 'aprovado', NULL, auth.uid(), '2025-12-15 14:25-04'),
  (pg_temp.id(7, 7), pg_temp.id(6, 31), pg_temp.id(1, 1), pg_temp.b(31), 'situacao', 'Armário de aço avariado, sem conserto viável.', 'Avaliar custo de reparo; se antieconômico, baixa por inservibilidade.', true, auth.uid(), '2025-12-18 10:30-04', 'aplicado', NULL, auth.uid(), '2025-12-15 14:30-04'),
  (pg_temp.id(7, 8), pg_temp.id(6, 33), pg_temp.id(1, 1), pg_temp.b(33), 'outro', 'Bem sem plaqueta de tombamento.', 'Emitir nova etiqueta com QR Code e afixar.', false, NULL, NULL, 'aplicado', 'Etiqueta reimpressa em 08/01/2026.', auth.uid(), '2025-12-15 14:35-04');

UPDATE public.campanhas_inventario SET status = 'concluida', updated_at = '2025-12-19 17:00-04' WHERE id = pg_temp.id(1, 1);

-- ===================================================================== regularizações do início de 2026
-- Movimentações nascem aprovadas (o trigger grava o histórico e muda carga/local do bem); a de 20/01 já foi concluída.
INSERT INTO public.movimentacoes_patrimonio (id, bem_id, tipo, data_movimentacao, unidade_origem_id, setor_origem, sala_origem, responsavel_origem_id,
  unidade_destino_id, setor_destino, sala_destino, responsavel_destino_id, unidade_local_origem_id, unidade_local_destino_id,
  motivo, observacoes, solicitado_por, data_solicitacao, aprovado_por, data_aprovacao, status, created_by, created_at)
SELECT v.id, bp.id, v.tipo::public.tipo_movimentacao_patrimonio, v.dt, bp.unidade_id, pg_temp.sigla(bp.unidade_id), bp.sala, bp.responsavel_id,
       pg_temp.u(v.u_dest), coalesce(v.setor_dest, pg_temp.sigla(coalesce(pg_temp.u(v.u_dest), bp.unidade_id))), v.sala_dest, pg_temp.s(v.resp_dest),
       bp.unidade_local_id, pg_temp.ul(v.ul_dest),
       v.motivo, v.obs, auth.uid(), v.dt - 3 + time '09:00', auth.uid(), v.dt + time '15:30', 'aprovado', auth.uid(), v.dt - 3 + time '09:00'
  FROM (VALUES
    (pg_temp.id(2, 1), 10, 'transferencia_interna', date '2026-01-20', 5, NULL::int, NULL::text, 'Sala 6', 9,
     'Regularização apontada no Inventário Anual 2025: notebook em uso na DRH.', 'Termo de transferência e responsabilidade nº 001/2026-DPC assinado pelo novo responsável.'),
    (pg_temp.id(2, 2), 24, 'transferencia_interna', date '2026-02-03', 3, NULL, NULL, 'Sala 3', 13,
     'Regularização apontada no Inventário Anual 2025: mesa em uso na Diretoria de Esporte.', 'Termo de transferência nº 002/2026-DPC.'),
    (pg_temp.id(2, 3), 6, 'transferencia_interna', date '2026-02-10', NULL, 1, NULL, 'Depósito de materiais', 14,
     'Quadra Poliesportiva de Rorainópolis interditada para reforma; rede passa à carga do Ginásio.', 'Processo SEI 18101.000742/2026-11.'),
    (pg_temp.id(2, 10), 16, 'transferencia_interna', date '2026-05-04', 9, NULL, NULL, 'Sala 2', 17,
     'Reestruturação da Assessoria Jurídica: mesa para a sala de atendimento.', 'Termo de transferência nº 007/2026-DPC.')
  ) AS v(id, n, tipo, dt, u_dest, ul_dest, setor_dest, sala_dest, resp_dest, motivo, obs)
  JOIN public.bens_patrimoniais bp ON bp.id = pg_temp.b(v.n);

UPDATE public.movimentacoes_patrimonio SET status = 'concluido', aceite_responsavel = true, data_aceite = data_movimentacao + time '16:10'
 WHERE id IN (pg_temp.id(2, 1), pg_temp.id(2, 10));

-- Manutenções do início do ano: o trigger põe o bem "em manutenção" e o devolve a "ativo" ao concluir/cancelar.
INSERT INTO public.manutencoes_patrimonio (id, bem_id, tipo, data_abertura, descricao_problema, fornecedor_id, fornecedor_externo, custo_estimado, data_inicio, status, observacoes, created_by, created_at) VALUES
  (pg_temp.id(3, 5), pg_temp.b(35), 'corretiva', '2026-01-14', 'Tela trincada no canto inferior direito após queda durante a mudança de layout da sala. Imagem com faixas verticais.',
   NULL, 'Infocenter Comércio e Assistência Técnica em Informática Ltda — CNPJ 14.582.337/0001-06', 600, '2026-01-19', 'em_andamento', 'Orçamento nº 0127/2026 aprovado pela DPC.', auth.uid(), '2026-01-14 10:20-04'),
  (pg_temp.id(3, 7), pg_temp.b(31), 'corretiva', '2026-01-12', 'Porta empenada, fechadura quebrada e corrosão na base. Avaliação de viabilidade de reparo.',
   NULL, 'Serralheria Monte Roraima Ltda — CNPJ 08.731.554/0001-90', 900, NULL, 'aberta', NULL, auth.uid(), '2026-01-12 09:00-04');
UPDATE public.manutencoes_patrimonio SET status = 'concluida', data_conclusao = '2026-02-05', custo_final = 520.00,
       observacoes = 'Painel substituído; garantia do serviço de 90 dias. NF-e nº 4.581.'
 WHERE id = pg_temp.id(3, 5);
UPDATE public.manutencoes_patrimonio SET status = 'cancelada',
       observacoes = 'Reparo orçado em R$ 900,00, acima do valor de mercado de um armário novo. Encaminhado para baixa por inservibilidade.'
 WHERE id = pg_temp.id(3, 7);

-- Ocorrências do início do ano
INSERT INTO public.ocorrencias_patrimonio (id, bem_id, tipo, data_fato, relato_detalhado, responsavel_relato_id, providencias_adotadas, encaminhamento, created_by, created_at) VALUES
  (pg_temp.id(4, 1), pg_temp.b(21), 'extravio', '2025-11-26',
   'Durante o Inventário Anual 2025, a bola oficial de futsal sob carga do Estádio não foi localizada no depósito de materiais esportivos. O último uso registrado foi no Festival de Futsal de Base, em 08/11/2025. Buscas no Ginásio e na sede sem resultado.',
   pg_temp.s(11), 'Busca nas unidades locais; consulta às equipes que usaram o material no festival; comunicação à chefia imediata.',
   'Processo SEI 18101.000318/2026-44 — instrução de baixa por perda, sem indício de dolo.', auth.uid(), '2026-01-08 11:00-04'),
  (pg_temp.id(4, 2), pg_temp.b(35), 'dano', '2026-01-08',
   'Monitor caiu da bancada durante a mudança de layout da sala, com trinca na tela. Servidores presentes confirmaram o acidente.',
   pg_temp.s(18), 'Bem recolhido à Divisão de Patrimônio e orçamento de reparo solicitado.', 'Manutenção corretiva aberta em 14/01/2026.', auth.uid(), '2026-01-09 08:40-04');

-- Baixas: nascem "solicitada" (trigger grava baixa_solicitada); a decisão repete o que faz a RPC patrimonio_decidir_baixa.
INSERT INTO public.baixas_patrimonio (id, bem_id, motivo, data_solicitacao, justificativa, valor_residual, comissao_responsavel, status, created_by, created_at) VALUES
  (pg_temp.id(5, 1), pg_temp.b(31), 'inservivel', '2026-01-30',
   'Armário de aço com corrosão, porta empenada e fechadura quebrada. Reparo orçado acima do valor de mercado (manutenção cancelada em 12/01/2026). Laudo da comissão de avaliação nº 03/2026.',
   50.00, 'Comissão de Avaliação e Desfazimento de Bens — Portaria nº 041/2026/PRES (Juliana Freitas Barros, Diego Sampaio Furtado, Larissa Monteiro Paiva)', 'solicitada', auth.uid(), '2026-01-30 10:00-04'),
  (pg_temp.id(5, 2), pg_temp.b(21), 'perda', '2026-01-15',
   'Bem não localizado no Inventário Anual 2025. Ocorrência de extravio registrada; apuração concluiu pela ausência de dolo ou culpa (processo SEI 18101.000318/2026-44).',
   0, 'Comissão de Avaliação e Desfazimento de Bens — Portaria nº 041/2026/PRES', 'solicitada', auth.uid(), '2026-01-15 09:30-04');

CREATE FUNCTION pg_temp.decidir_baixa(p_id uuid, p_aprovar boolean, p_quando timestamptz, p_motivo text DEFAULT NULL) RETURNS void LANGUAGE plpgsql AS $f$
DECLARE v public.baixas_patrimonio%ROWTYPE;
BEGIN
  SELECT * INTO v FROM public.baixas_patrimonio WHERE id = p_id;
  IF p_aprovar THEN
    UPDATE public.baixas_patrimonio SET status = 'aprovada', aprovado_por = auth.uid(), data_aprovacao = p_quando,
           dados_bem_snapshot = (SELECT to_jsonb(b) FROM public.bens_patrimoniais b WHERE b.id = v.bem_id)
     WHERE id = p_id;
    PERFORM set_config('patrimonio.evento_registrado', 'on', true);
    UPDATE public.bens_patrimoniais SET situacao = 'baixado', situacao_inventario = 'baixado', updated_at = p_quando WHERE id = v.bem_id;
    PERFORM set_config('patrimonio.evento_registrado', 'off', true);
  ELSE
    UPDATE public.baixas_patrimonio SET status = 'rejeitada', aprovado_por = auth.uid(), data_aprovacao = p_quando, motivo_rejeicao = p_motivo
     WHERE id = p_id;
  END IF;
  INSERT INTO public.historico_patrimonio (bem_id, tipo_evento, data_evento, justificativa, dados_novos, usuario_id, baixa_id)
  VALUES (v.bem_id, CASE WHEN p_aprovar THEN 'baixa_aprovada' ELSE 'baixa_rejeitada' END, p_quando,
          CASE WHEN p_aprovar THEN v.justificativa ELSE p_motivo END,
          jsonb_build_object('baixa_id', p_id, 'motivo', v.motivo), auth.uid(), p_id);
END $f$;

DO $$ BEGIN
  PERFORM pg_temp.decidir_baixa(pg_temp.id(5, 1), true, '2026-02-20 11:00-04');
  PERFORM pg_temp.decidir_baixa(pg_temp.id(5, 2), true, '2026-02-27 10:00-04');
END $$;
UPDATE public.baixas_patrimonio SET status = 'concluida' WHERE id = pg_temp.id(5, 2);

-- ===================================================================== inventário rotativo 1º sem/2026 (concluído)
CREATE TEMP TABLE _c2 (n int, st public.status_coleta_inventario, obs text, dia date) ON COMMIT DROP;
INSERT INTO _c2 VALUES
  (6, 'conferido', NULL, '2026-04-14'), (5, 'conferido', NULL, '2026-04-15'), (13, 'conferido', NULL, '2026-04-15'),
  (29, 'conferido', NULL, '2026-04-15'), (37, 'conferido', 'Desgaste natural de uso.', '2026-04-15'),
  (14, 'avariado', 'Rede rasgada em dois pontos e antena quebrada; sinais de vandalismo.', '2026-04-22'),
  (22, 'conferido', NULL, '2026-04-22'), (30, 'em_manutencao', 'Ainda no reparo.', '2026-04-22'), (38, 'conferido', NULL, '2026-04-22');
INSERT INTO public.coletas_inventario (id, campanha_id, bem_id, status_coleta, localizacao_encontrada_unidade_id, localizacao_encontrada_sala,
  localizacao_encontrada_detalhe, responsavel_encontrado_id, observacoes, data_coleta, usuario_coletor_id, dispositivo_info, created_at)
SELECT pg_temp.id(6, 100 + c.n), pg_temp.id(1, 2), bp.id, c.st, bp.unidade_local_id, bp.sala, 'Depósito de materiais esportivos',
       bp.responsavel_id, c.obs, c.dia + time '09:00' + c.n * interval '4 minutes', auth.uid(),
       '{"origem": "pwa", "app": "patrimonio-mobile", "plataforma": "Android 13"}'::jsonb, c.dia + time '09:00' + c.n * interval '4 minutes'
  FROM _c2 c JOIN public.bens_patrimoniais bp ON bp.id = pg_temp.b(c.n);
INSERT INTO public.conciliacoes_inventario (id, coleta_id, campanha_id, bem_id, tipo_divergencia, descricao_divergencia, ajuste_proposto, necessita_aprovacao, aprovador_id, data_aprovacao, status, observacoes, created_by, created_at) VALUES
  (pg_temp.id(7, 9), pg_temp.id(6, 114), pg_temp.id(1, 2), pg_temp.b(14), 'situacao', 'Rede de vôlei avariada por vandalismo na quadra de Rorainópolis.', 'Registrar ocorrência de dano e avaliar reparo.', true, auth.uid(), '2026-04-28 10:00-04', 'aprovado', 'Ocorrência registrada com boletim de ocorrência.', auth.uid(), '2026-04-23 09:00-04');
INSERT INTO public.ocorrencias_patrimonio (id, bem_id, tipo, data_fato, relato_detalhado, responsavel_relato_id, providencias_adotadas, encaminhamento, anexos_urls, created_by, created_at) VALUES
  (pg_temp.id(4, 3), pg_temp.b(14), 'dano', '2026-04-19',
   'O zelador da Quadra Poliesportiva de Rorainópolis encontrou, na manhã de segunda-feira (20/04), o alambrado lateral arrombado e a rede de vôlei rasgada em dois pontos, com a antena quebrada. A quadra estava fechada no fim de semana.',
   pg_temp.s(13), 'Boletim de Ocorrência nº 00412/2026 lavrado na Delegacia de Polícia de Rorainópolis em 20/04/2026; reforço do cadeado do portão; comunicação à Prefeitura para ronda.',
   'Rede recolhida à sede; reparo a ser avaliado pela DPC.', '[]'::jsonb, auth.uid(), '2026-04-20 11:30-04');
-- O trigger calcula o esperado sobre todos os bens ativos; o rotativo abrange só os 9 equipamentos esportivos.
UPDATE public.campanhas_inventario SET status = 'concluida', total_bens_esperados = 9, total_conferidos = 9, total_divergencias = 1,
       percentual_conclusao = 100, updated_at = '2026-04-30 17:00-04'
 WHERE id = pg_temp.id(1, 2);

-- ===================================================================== movimentos do 2º semestre de 2026
INSERT INTO public.movimentacoes_patrimonio (id, bem_id, tipo, data_movimentacao, unidade_origem_id, setor_origem, sala_origem, responsavel_origem_id,
  unidade_destino_id, setor_destino, sala_destino, responsavel_destino_id, unidade_local_origem_id, unidade_local_destino_id,
  motivo, observacoes, solicitado_por, data_solicitacao, aprovado_por, data_aprovacao, status, motivo_rejeicao, created_by, created_at)
SELECT v.id, bp.id, v.tipo::public.tipo_movimentacao_patrimonio, v.dt, bp.unidade_id, pg_temp.sigla(bp.unidade_id), bp.sala, bp.responsavel_id,
       pg_temp.u(v.u_dest), coalesce(v.setor_dest, pg_temp.sigla(coalesce(pg_temp.u(v.u_dest), bp.unidade_id))), v.sala_dest, pg_temp.s(v.resp_dest),
       bp.unidade_local_id, pg_temp.ul(v.ul_dest), v.motivo, v.obs, auth.uid(), v.dt - 2 + time '10:00',
       CASE WHEN v.st <> 'pendente' THEN auth.uid() END, CASE WHEN v.st <> 'pendente' THEN v.dt + time '14:00' END,
       v.st::public.status_movimentacao_patrimonio, v.rejeicao, auth.uid(), v.dt - 2 + time '10:00'
  FROM (VALUES
    (pg_temp.id(2, 4), 29, 'emprestimo', date '2026-10-05', NULL::int, 1, NULL::text, 'Depósito de materiais', 13, 'aprovado',
     'Cautela para uso nos Jogos Escolares de Roraima 2026 — fase estadual de futsal no Ginásio.', 'Devolução prevista para 30/11/2026. Cautela nº 014/2026-DPC assinada pelo responsável.', NULL::text),
    (pg_temp.id(2, 5), 18, 'emprestimo', date '2026-10-22', 8, NULL, NULL, 'Sala 1', 15, 'pendente',
     'Cautela de notebook para a cobertura jornalística dos Jogos Escolares (edição e envio de fotos em campo).', 'Devolução prevista para 05/12/2026.', NULL),
    (pg_temp.id(2, 6), 38, 'cessao', date '2026-10-21', NULL, NULL, 'Federação Roraimense de Voleibol — cessão de uso', 'Ginásio da Federação', 4, 'pendente',
     'Cessão de uso por 90 dias para o Campeonato Estadual de Vôlei de Quadra Sub-17, conforme Termo de Cessão a ser firmado.', 'Processo SEI 18101.005930/2026-77.', NULL),
    (pg_temp.id(2, 7), 39, 'recolhimento', date '2026-09-15', 7, NULL, NULL, 'Depósito da DPC', 8, 'aprovado',
     'Recolhimento ao depósito da Divisão de Patrimônio: armário sem condições de uso, para avaliação de baixa.', NULL, NULL),
    (pg_temp.id(2, 8), 27, 'transferencia_interna', date '2026-08-12', 8, NULL, NULL, 'Sala 4', 15, 'rejeitado',
     'Monitor adicional para a ilha de edição da ASCOM.', NULL, 'A Presidência ainda usa o monitor; a ASCOM receberá equipamento do pregão de informática previsto para 2027.'),
    (pg_temp.id(2, 9), 36, 'transferencia_interna', date '2026-10-22', 6, NULL, NULL, 'Sala 2', 7, 'pendente',
     'Impressora da Presidência substituída por equipamento locado; remanejamento para a Divisão de Finanças.', NULL, NULL)
  ) AS v(id, n, tipo, dt, u_dest, ul_dest, setor_dest, sala_dest, resp_dest, st, motivo, obs, rejeicao)
  JOIN public.bens_patrimoniais bp ON bp.id = pg_temp.b(v.n);

INSERT INTO public.manutencoes_patrimonio (id, bem_id, tipo, data_abertura, descricao_problema, fornecedor_id, fornecedor_externo, custo_estimado, data_inicio, status, observacoes, created_by, created_at) VALUES
  (pg_temp.id(3, 1), pg_temp.b(30), 'corretiva', '2026-09-28', 'Faixa superior descosturada e cabo de aço rompido.',
   NULL, 'Malharia Esportiva Caçari Ltda — CNPJ 27.418.553/0001-60', 280.00, '2026-10-02', 'em_andamento', 'Previsão de entrega: 30/10/2026.', auth.uid(), '2026-09-28 09:15-04'),
  (pg_temp.id(3, 2), pg_temp.b(4), 'corretiva', '2026-10-13', 'Atolamento recorrente de papel e manchas na impressão; possível desgaste do fusor.',
   NULL, 'Copiadora e Assistência Técnica Macuxi Ltda — CNPJ 31.205.774/0001-08', 750.00, '2026-10-16', 'em_andamento', 'Equipamento retirado pela empresa (OS nº 2026/1184).', auth.uid(), '2026-10-13 14:00-04'),
  (pg_temp.id(3, 3), pg_temp.b(12), 'preventiva', '2026-10-19', 'Limpeza interna, troca de rolos de tração e calibração (manutenção semestral).',
   NULL, 'Copiadora e Assistência Técnica Macuxi Ltda — CNPJ 31.205.774/0001-08', 320.00, NULL, 'aberta', NULL, auth.uid(), '2026-10-19 10:40-04'),
  (pg_temp.id(3, 4), pg_temp.b(2), 'corretiva', '2026-03-09', 'Notebook não liga; carregador e bateria testados sem sucesso.',
   NULL, 'Infocenter Comércio e Assistência Técnica em Informática Ltda — CNPJ 14.582.337/0001-06', 700.00, '2026-03-11', 'aberta', NULL, auth.uid(), '2026-03-09 08:50-04'),
  (pg_temp.id(3, 6), pg_temp.b(20), 'preventiva', '2026-06-08', 'Manutenção preventiva semestral: limpeza, lubrificação e troca do kit de rolos.',
   NULL, 'Copiadora e Assistência Técnica Macuxi Ltda — CNPJ 31.205.774/0001-08', 300.00, '2026-06-10', 'aberta', NULL, auth.uid(), '2026-06-08 09:00-04'),
  (pg_temp.id(3, 8), pg_temp.b(8), 'corretiva', '2026-10-07', 'Tampo da mesa solto e corrediça da gaveta quebrada.',
   'f1000000-0000-4000-8000-000000000001', NULL, 180.00, '2026-10-15', 'em_andamento', 'Atendimento em garantia estendida do contrato 001/2026.', auth.uid(), '2026-10-07 11:20-04');
UPDATE public.manutencoes_patrimonio SET status = 'concluida', data_conclusao = '2026-03-27', custo_final = 650.00,
       observacoes = 'Placa-mãe reparada (circuito de alimentação). NF-e nº 4.902. Garantia de 90 dias.'
 WHERE id = pg_temp.id(3, 4);
UPDATE public.manutencoes_patrimonio SET status = 'concluida', data_conclusao = '2026-06-12', custo_final = 285.00,
       observacoes = 'Serviço executado conforme OS nº 2026/0611.'
 WHERE id = pg_temp.id(3, 6);

INSERT INTO public.ocorrencias_patrimonio (id, bem_id, tipo, data_fato, relato_detalhado, responsavel_relato_id, providencias_adotadas, encaminhamento, created_by, created_at) VALUES
  (pg_temp.id(4, 4), pg_temp.b(26), 'sinistro', '2026-09-02',
   'Furto do notebook do interior do veículo oficial estacionado na Av. Ville Roy, Centro, Boa Vista, entre 12h10 e 13h20, durante diligência da Assessoria Jurídica. O vidro traseiro esquerdo foi quebrado.',
   pg_temp.s(17), 'Boletim de Ocorrência nº 2026.0154821 registrado no 1º Distrito Policial de Boa Vista em 02/09/2026; comunicação à Controladoria; senhas de rede do usuário redefinidas.',
   'Processo SEI 18101.004512/2026-31 — sindicância para apuração de responsabilidade e baixa por perda.', auth.uid(), '2026-09-02 16:00-04'),
  (pg_temp.id(4, 5), pg_temp.b(19), 'dano', '2026-10-14',
   'Monitor deixou de ligar após queda de energia com oscilação na rede elétrica do prédio sede, por volta das 15h. Outros dois equipamentos da sala foram afetados e voltaram a funcionar.',
   pg_temp.s(12), 'Equipamento desligado da tomada; solicitada vistoria da rede elétrica à empresa de manutenção predial.',
   'Aguardando laudo técnico para decidir entre reparo e baixa.', auth.uid(), '2026-10-15 08:30-04');

INSERT INTO public.baixas_patrimonio (id, bem_id, motivo, data_solicitacao, justificativa, valor_residual, comissao_responsavel, status, created_by, created_at) VALUES
  (pg_temp.id(5, 3), pg_temp.b(26), 'perda', '2026-09-10',
   'Notebook furtado do veículo oficial em 02/09/2026 (BO nº 2026.0154821 — 1º DP). Baixa condicionada à conclusão da sindicância (processo SEI 18101.004512/2026-31).',
   NULL, 'Comissão de Avaliação e Desfazimento de Bens — Portaria nº 041/2026/PRES', 'em_analise', auth.uid(), '2026-09-10 10:00-04'),
  (pg_temp.id(5, 4), pg_temp.b(3), 'obsoleto', '2026-10-16',
   'Monitor de tecnologia defasada, sem entrada HDMI, incompatível com os computadores adquiridos em 2026. Substituído na sala.',
   80.00, NULL, 'solicitada', auth.uid(), '2026-10-16 15:20-04'),
  (pg_temp.id(5, 5), pg_temp.b(7), 'doacao', '2026-07-06',
   'Proposta de doação do armário à Escola Estadual Monteiro Lobato, que solicitou mobiliário para a sala de educação física.',
   400.00, 'Comissão de Avaliação e Desfazimento de Bens — Portaria nº 041/2026/PRES', 'solicitada', auth.uid(), '2026-07-06 09:40-04'),
  (pg_temp.id(5, 6), pg_temp.b(39), 'inservivel', '2026-10-01',
   'Armário recolhido ao depósito da DPC em 15/09/2026, com estrutura comprometida por cupim na base de MDF e portas desalinhadas. Laudo nº 11/2026.',
   30.00, 'Comissão de Avaliação e Desfazimento de Bens — Portaria nº 041/2026/PRES', 'solicitada', auth.uid(), '2026-10-01 11:00-04');
DO $$ BEGIN
  PERFORM pg_temp.decidir_baixa(pg_temp.id(5, 5), false, '2026-07-24 16:00-04',
    'Bem ainda em condições de uso e necessário à Diretoria de Juventude; doação depende de declaração de ociosidade pelo setor detentor.');
END $$;

-- ===================================================================== inventário anual 2026 (em andamento)
CREATE TEMP TABLE _c3 (n int, st public.status_coleta_inventario, resp int, obs text, dia timestamptz) ON COMMIT DROP;
INSERT INTO _c3 VALUES
  (6, 'conferido', NULL, NULL, '2026-10-08 08:40-04'),
  (29, 'conferido', NULL, 'Em cautela para os Jogos Escolares (cautela nº 014/2026-DPC).', '2026-10-08 09:05-04'),
  (1, 'conferido', NULL, NULL, '2026-10-09 08:20-04'),
  (9, 'conferido', NULL, NULL, '2026-10-09 08:35-04'),
  (10, 'conferido', NULL, NULL, '2026-10-09 09:10-04'),
  (17, 'conferido', NULL, NULL, '2026-10-09 09:40-04'),
  (24, 'conferido', NULL, NULL, '2026-10-09 10:15-04'),
  (40, 'sem_etiqueta', NULL, 'Plaqueta ilegível; identificado pelo número de série e pela nota fiscal.', '2026-10-09 10:50-04'),
  (18, 'divergente', 15, 'Notebook em uso pela ASCOM; cautela ainda pendente de aprovação.', '2026-10-13 09:00-04'),
  (26, 'nao_localizado', NULL, 'Bem furtado em 02/09/2026 (BO nº 2026.0154821); baixa em análise.', '2026-10-13 09:30-04'),
  (2, 'conferido', NULL, NULL, '2026-10-13 10:00-04'),
  (4, 'em_manutencao', NULL, 'Retirada pela assistência técnica (OS nº 2026/1184).', '2026-10-16 10:30-04'),
  (5, 'conferido', NULL, NULL, '2026-10-21 08:40-04'),
  (13, 'avariado', NULL, 'Bola com costura aberta e câmara murcha.', '2026-10-21 09:00-04'),
  (37, 'conferido', NULL, NULL, '2026-10-21 09:20-04'),
  (33, 'conferido', NULL, 'Etiqueta reimpressa em 08/01/2026 conferida.', '2026-10-22 14:00-04');
INSERT INTO public.coletas_inventario (id, campanha_id, bem_id, status_coleta, localizacao_encontrada_unidade_id, localizacao_encontrada_sala,
  localizacao_encontrada_detalhe, responsavel_encontrado_id, observacoes, data_coleta, usuario_coletor_id, dispositivo_info, coordenadas_gps, created_at)
SELECT pg_temp.id(6, 200 + c.n), pg_temp.id(1, 3), bp.id, c.st,
       CASE WHEN c.st <> 'nao_localizado' THEN bp.unidade_local_id END,
       CASE WHEN c.st <> 'nao_localizado' THEN bp.sala END,
       CASE WHEN c.st <> 'nao_localizado' THEN pg_temp.sigla(bp.unidade_id) END,
       CASE WHEN c.st = 'nao_localizado' THEN NULL ELSE coalesce(pg_temp.s(c.resp), bp.responsavel_id) END,
       c.obs, c.dia, auth.uid(), '{"origem": "pwa", "app": "patrimonio-mobile", "plataforma": "Android 14", "offline": false}'::jsonb,
       CASE WHEN ul.id IS NOT NULL THEN jsonb_build_object('lat', ul.latitude, 'lng', ul.longitude, 'precisao', 8) END, c.dia
  FROM _c3 c JOIN public.bens_patrimoniais bp ON bp.id = pg_temp.b(c.n)
  LEFT JOIN public.unidades_locais ul ON ul.id = bp.unidade_local_id;
INSERT INTO public.conciliacoes_inventario (id, coleta_id, campanha_id, bem_id, tipo_divergencia, descricao_divergencia, ajuste_proposto, necessita_aprovacao, status, created_by, created_at) VALUES
  (pg_temp.id(7, 10), pg_temp.id(6, 218), pg_temp.id(1, 3), pg_temp.b(18), 'responsavel', 'Notebook com Gustavo Pereira Lago (ASCOM) antes da aprovação da cautela.', 'Aprovar a cautela pendente ou recolher o bem ao responsável cadastrado.', true, 'pendente', auth.uid(), '2026-10-13 11:00-04'),
  (pg_temp.id(7, 11), pg_temp.id(6, 226), pg_temp.id(1, 3), pg_temp.b(26), 'situacao', 'Bem furtado, não localizado.', 'Aguardar a sindicância e concluir a baixa por perda.', true, 'pendente', auth.uid(), '2026-10-13 11:05-04'),
  (pg_temp.id(7, 12), pg_temp.id(6, 213), pg_temp.id(1, 3), pg_temp.b(13), 'situacao', 'Bola avariada (costura aberta).', 'Avaliar reparo; se antieconômico, baixa por inservibilidade.', true, 'pendente', auth.uid(), '2026-10-21 10:00-04'),
  (pg_temp.id(7, 13), pg_temp.id(6, 240), pg_temp.id(1, 3), pg_temp.b(40), 'outro', 'Plaqueta de tombamento ilegível.', 'Reimprimir etiqueta com QR Code.', false, 'pendente', auth.uid(), '2026-10-09 11:30-04');

-- Fotos de vistoria: só o registro. O arquivo não existe no Storage (bucket inventario-evidencias),
-- então a tela mostra "Imagem indisponível" no lugar da miniatura. usuario_id é obrigatório: sem login ligado, ficam de fora.
INSERT INTO public.fotos_vistoria_inventario (id, campanha_id, unidade_local_id, bem_id, codigo_objeto, legenda, storage_path, hash_sha256,
  latitude, longitude, precisao_m, capturada_em, enviada_em, mime_type, tamanho_bytes, tem_pessoa, dispositivo_info, usuario_id)
SELECT f.id, f.camp, pg_temp.ul(f.ul), pg_temp.b(f.n),
       (SELECT numero_patrimonio FROM public.bens_patrimoniais WHERE id = pg_temp.b(f.n)), f.legenda,
       f.camp || '/' || pg_temp.ul(f.ul) || '/' || f.id || '.jpg',
       encode(sha256(convert_to(f.id::text, 'UTF8')), 'hex'),
       ul.latitude + f.dl, ul.longitude - f.dl, f.prec, f.quando, f.quando + interval '6 minutes', 'image/jpeg', f.tam, f.pessoa,
       '{"plataforma": "Android 14", "app": "patrimonio-mobile"}'::jsonb, auth.uid()
  FROM (VALUES
    (pg_temp.id(8, 1), pg_temp.id(1, 1), 1, 6, 'Rede de vôlei guardada no depósito do Ginásio', 6.0, timestamptz '2025-11-24 10:12-04', 1843221, false, 0.00011),
    (pg_temp.id(8, 2), pg_temp.id(1, 1), 2, 37, 'Depósito de materiais esportivos do Estádio', 9.5, '2025-11-26 09:40-04', 2210457, false, 0.00020),
    (pg_temp.id(8, 3), pg_temp.id(1, 3), 1, 6, 'Rede de vôlei — conferida', 5.0, '2026-10-08 08:41-04', 1675302, false, 0.00009),
    (pg_temp.id(8, 4), pg_temp.id(1, 3), 1, 29, 'Bola em cautela, conferida com o responsável', 7.2, '2026-10-08 09:06-04', 1502996, true, 0.00012),
    (pg_temp.id(8, 5), pg_temp.id(1, 3), 1, NULL, 'Vista geral da quadra principal e arquibancada leste', 12.0, '2026-10-08 15:30-04', 3120554, false, 0.00031),
    (pg_temp.id(8, 6), pg_temp.id(1, 3), 2, 13, 'Bola com costura aberta', 4.8, '2026-10-21 09:01-04', 1398740, false, 0.00015),
    (pg_temp.id(8, 7), pg_temp.id(1, 3), 2, 37, 'Etiqueta QR da bola conferida', 4.1, '2026-10-21 09:21-04', 987412, false, 0.00016),
    (pg_temp.id(8, 8), pg_temp.id(1, 3), 4, NULL, 'Casa de máquinas: bomba do filtro sem plaqueta', 8.3, '2026-10-14 10:05-04', 2045118, false, 0.00007)
  ) AS f(id, camp, ul, n, legenda, prec, quando, tam, pessoa, dl)
  JOIN public.unidades_locais ul ON ul.id = pg_temp.ul(f.ul)
 WHERE auth.uid() IS NOT NULL;

-- ===================================================================== histórico legado do bem (movimentacoes_bem)
INSERT INTO public.movimentacoes_bem (id, bem_id, tipo, unidade_origem_id, unidade_destino_id, responsavel_origem_id, responsavel_destino_id,
  data_movimentacao, data_previsao_retorno, data_retorno, valor_anterior, valor_novo, numero_termo, motivo, observacao, created_by, created_at) VALUES
  (pg_temp.id(15, 1), pg_temp.b(10), 'transferencia', pg_temp.u(2), pg_temp.u(5), pg_temp.s(11), pg_temp.s(9), '2026-01-20', NULL, NULL, NULL, NULL, 'TTR-001/2026', 'Regularização do Inventário Anual 2025.', NULL, auth.uid(), '2026-01-20 16:00-04'),
  (pg_temp.id(15, 2), pg_temp.b(24), 'transferencia', pg_temp.u(7), pg_temp.u(3), pg_temp.s(7), pg_temp.s(13), '2026-02-03', NULL, NULL, NULL, NULL, 'TTR-002/2026', 'Regularização do Inventário Anual 2025.', NULL, auth.uid(), '2026-02-03 16:00-04'),
  (pg_temp.id(15, 3), pg_temp.b(29), 'cessao', pg_temp.u(3), pg_temp.u(3), pg_temp.s(12), pg_temp.s(13), '2026-10-05', '2026-11-30', NULL, NULL, NULL, 'CAU-014/2026', 'Cautela para os Jogos Escolares de Roraima 2026.', NULL, auth.uid(), '2026-10-05 14:00-04'),
  (pg_temp.id(15, 4), pg_temp.b(2), 'manutencao', pg_temp.u(3), pg_temp.u(3), pg_temp.s(3), pg_temp.s(3), '2026-03-11', '2026-03-31', '2026-03-27', NULL, NULL, NULL, 'Reparo de placa-mãe.', 'NF-e nº 4.902.', auth.uid(), '2026-03-11 09:00-04'),
  (pg_temp.id(15, 5), pg_temp.b(31), 'baixa', pg_temp.u(5), NULL, pg_temp.s(14), NULL, '2026-02-20', NULL, NULL, 1300.00, 50.00, 'TBX-003/2026', 'Baixa por inservibilidade.', 'Laudo da comissão nº 03/2026.', auth.uid(), '2026-02-20 11:00-04'),
  (pg_temp.id(15, 6), pg_temp.b(4), 'reavaliacao', pg_temp.u(5), pg_temp.u(5), pg_temp.s(5), pg_temp.s(5), '2026-06-30', NULL, NULL, 2300.00, 1610.00, NULL, 'Reavaliação semestral (NBC TSP 07).', NULL, auth.uid(), '2026-06-30 17:00-04'),
  (pg_temp.id(15, 7), pg_temp.b(33), 'inventario', pg_temp.u(7), pg_temp.u(7), pg_temp.s(16), pg_temp.s(16), '2026-01-08', NULL, NULL, NULL, NULL, NULL, 'Reetiquetagem apontada no Inventário Anual 2025.', NULL, auth.uid(), '2026-01-08 10:00-04');

-- ===================================================================== patrimônio das unidades locais (alimenta os relatórios de unidades)
-- numero_tombo vazio: o trigger gera PAT-<tipo>-<ano>-<seq>.
INSERT INTO public.patrimonio_unidade (id, unidade_local_id, item, categoria, quantidade, estado_conservacao, situacao, descricao, valor_estimado, data_aquisicao, observacoes, created_by) VALUES
  (pg_temp.id(11, 1), pg_temp.ul(1), 'Placar eletrônico multiesportivo', 'Equipamento esportivo', 1, 'bom', 'em_uso', 'Placar LED 3,0 x 1,5 m com cronômetro de 24 s.', 38500.00, '2022-05-18', NULL, auth.uid()),
  (pg_temp.id(11, 2), pg_temp.ul(1), 'Tabela de basquete retrátil', 'Equipamento esportivo', 2, 'regular', 'em_uso', 'Tabela em acrílico com aro retrátil, estrutura móvel.', 21000.00, '2019-08-02', 'Pintura da estrutura descascando.', auth.uid()),
  (pg_temp.id(11, 3), pg_temp.ul(1), 'Cadeira plástica empilhável', 'Mobiliário', 180, 'bom', 'em_uso', 'Cadeiras para eventos e cerimônias.', 65.00, '2023-03-10', NULL, auth.uid()),
  (pg_temp.id(11, 4), pg_temp.ul(1), 'Bebedouro industrial inox', 'Eletrodoméstico', 3, 'otimo', 'em_uso', 'Bebedouro de 100 L com 3 torneiras.', 2900.00, '2025-02-14', NULL, auth.uid()),
  (pg_temp.id(11, 5), pg_temp.ul(2), 'Par de traves oficiais de futebol', 'Equipamento esportivo', 1, 'bom', 'em_uso', 'Traves em alumínio com redes de nylon 4 mm.', 14800.00, '2021-11-03', NULL, auth.uid()),
  (pg_temp.id(11, 6), pg_temp.ul(2), 'Refletor LED 400 W', 'Iluminação', 24, 'regular', 'em_uso', 'Iluminação das torres do campo.', 1850.00, '2020-07-21', 'Quatro refletores apagados aguardando troca.', auth.uid()),
  (pg_temp.id(11, 7), pg_temp.ul(2), 'Cortador de grama a gasolina', 'Equipamento de manutenção', 2, 'ruim', 'em_manutencao', 'Cortador autopropelido 21".', 3200.00, '2018-04-11', NULL, auth.uid()),
  (pg_temp.id(11, 8), pg_temp.ul(2), 'Banco de reservas coberto', 'Mobiliário', 2, 'bom', 'em_uso', 'Banco de 12 lugares com cobertura em policarbonato.', 6900.00, '2022-01-19', NULL, auth.uid()),
  (pg_temp.id(11, 9), pg_temp.ul(3), 'Tabela de basquete fixa', 'Equipamento esportivo', 2, 'ruim', 'em_manutencao', 'Tabela em compensado naval.', 4200.00, '2016-09-30', 'Substituição prevista na reforma.', auth.uid()),
  (pg_temp.id(11, 10), pg_temp.ul(3), 'Poste de vôlei com catraca', 'Equipamento esportivo', 1, 'regular', 'em_estoque', 'Par de postes removíveis.', 2600.00, '2019-02-12', 'Guardado durante a reforma.', auth.uid()),
  (pg_temp.id(11, 11), pg_temp.ul(4), 'Raia flutuante antiturbulência 25 m', 'Equipamento esportivo', 6, 'bom', 'em_uso', 'Raias para piscina semiolímpica.', 1950.00, '2023-10-05', NULL, auth.uid()),
  (pg_temp.id(11, 12), pg_temp.ul(4), 'Cadeira de salva-vidas', 'Mobiliário', 2, 'otimo', 'em_uso', 'Cadeira alta em alumínio.', 3400.00, '2024-06-20', NULL, auth.uid()),
  (pg_temp.id(11, 13), pg_temp.ul(4), 'Conjunto motobomba e filtro 3 cv', 'Equipamento hidráulico', 1, 'regular', 'em_uso', 'Sistema de filtragem da piscina.', 12500.00, '2017-03-28', 'Sem plaqueta de tombamento (pendência do inventário 2026).', auth.uid()),
  (pg_temp.id(11, 14), pg_temp.ul(4), 'Cadeira de rodas anfíbia', 'Acessibilidade', 1, 'bom', 'cedido', 'Cadeira para acesso à piscina.', 7800.00, '2024-11-12', 'Cedida temporariamente à Associação de Paradesporto de Roraima.', auth.uid());

-- ===================================================================== agenda das unidades locais (reservas)
INSERT INTO public.agenda_unidade (id, unidade_local_id, titulo, descricao, tipo_uso, tipo_solicitante, solicitante_nome, solicitante_documento,
  solicitante_telefone, solicitante_email, solicitante_razao_social, solicitante_cnpj, responsavel_legal, responsavel_legal_documento,
  data_inicio, data_fim, horario_diario, area_utilizada, espaco_especifico, publico_estimado, status, aprovador_id, data_aprovacao, motivo_rejeicao,
  observacoes, numero_protocolo, numero_processo_sei, federacao_id, modalidades_esportivas, finalidade_detalhada, historico_status, ano_vigencia, created_by, created_at)
SELECT pg_temp.id(10, a.k), pg_temp.ul(a.ul), a.titulo, a.descr, a.tipo, a.tsol, a.sol, a.doc, a.tel, a.email, a.razao, a.cnpj, a.resp_legal, a.resp_doc,
       a.ini, a.fim, a.horario, a.area, a.espaco, a.publico, a.st::public.status_agenda,
       CASE WHEN a.st IN ('aprovado', 'concluido', 'rejeitado') THEN pg_temp.s(3) END,
       CASE WHEN a.st IN ('aprovado', 'concluido', 'rejeitado') THEN a.criado + interval '3 days' END,
       a.rejeicao, a.obs, 'AGD-2026-' || lpad(a.k::text, 4, '0'), a.sei,
       CASE WHEN a.fed IS NOT NULL THEN (SELECT id FROM public.federacoes_esportivas WHERE sigla = ANY (CASE a.fed WHEN 'FEF' THEN ARRAY['FEF', 'FRFS'] ELSE ARRAY['FEV', 'FRV'] END) LIMIT 1) END,
       a.modal, a.finalidade,
       CASE WHEN a.st = 'solicitado' THEN '[]'::jsonb
            ELSE jsonb_build_array(jsonb_build_object('status_anterior', 'solicitado', 'status_novo',
                   CASE WHEN a.st = 'concluido' THEN 'aprovado' ELSE a.st END, 'data', a.criado + interval '3 days', 'usuario_id', auth.uid()))
                 || CASE WHEN a.st = 'concluido' THEN jsonb_build_array(jsonb_build_object('status_anterior', 'aprovado', 'status_novo', 'concluido',
                   'data', a.fim + interval '1 day', 'usuario_id', auth.uid())) ELSE '[]'::jsonb END END,
       2026, auth.uid(), a.criado
  FROM (VALUES
    (1, 1, 'Jogos Escolares de Roraima 2026 — Fase Estadual de Futsal', 'Fase estadual das categorias 12-14 e 15-17 anos, masculino e feminino.', 'competicao_esportiva', 'pessoa_juridica',
     'Patrícia Nogueira Sales', NULL, '(95) 98112-4307', 'diesp@exemplo.test', 'Diretoria de Esporte', NULL, NULL, NULL,
     timestamptz '2026-11-09 07:00-04', timestamptz '2026-11-14 22:00-04', '07h às 22h', 'Quadra principal, vestiários e arquibancadas', 'Quadra principal', 1800, 'aprovado', NULL::text,
     'Montagem de estrutura de arbitragem no dia 08/11.', '18101.005402/2026-63', NULL::text, ARRAY['Futsal'], 'Competição oficial do calendário estadual escolar, com 32 equipes de 9 municípios.', timestamptz '2026-09-15 10:00-04'),
    (2, 1, 'Campeonato Estadual de Futsal Adulto — Final', 'Partidas finais masculino e feminino.', 'competicao_esportiva', 'pessoa_juridica',
     'Antônio Carlos Bezerra', pg_temp.cpf('482915036'), '(95) 99134-2268', 'antonio.bezerra@exemplo.test', 'Federação Roraimense de Futsal', '52.871.436/0001-50', 'Antônio Carlos Bezerra', pg_temp.cpf('482915036'),
     '2026-09-19 17:00-04', '2026-09-20 22:00-04', '17h às 22h', 'Quadra principal e arquibancadas', 'Quadra principal', 2500, 'concluido', NULL,
     'Evento realizado sem ocorrências. Público estimado pela PM: 2.300 pessoas.', '18101.004701/2026-28', 'FEF', ARRAY['Futsal'], 'Final do campeonato estadual com transmissão por emissora local.', '2026-08-03 09:00-04'),
    (3, 1, 'Treinos da seleção roraimense de vôlei sub-17', 'Preparação para os Jogos da Juventude.', 'treinamento', 'pessoa_juridica',
     'Maria do Socorro Lima', pg_temp.cpf('731508264'), '(95) 99177-0532', 'socorro.lima@exemplo.test', 'Federação Roraimense de Voleibol', '63.204.915/0001-39', 'Maria do Socorro Lima', pg_temp.cpf('731508264'),
     '2026-10-19 18:00-04', '2026-11-27 20:30-04', 'Seg, qua e sex, 18h às 20h30', 'Quadra auxiliar', 'Quadra auxiliar', 40, 'aprovado', NULL,
     NULL, '18101.005118/2026-90', 'FEV', ARRAY['Vôlei'], 'Treinos regulares da seleção estadual.', '2026-09-28 14:30-04'),
    (4, 1, 'Formatura do Programa Jovem em Ação 2026', 'Cerimônia de certificação dos participantes.', 'cerimonia', 'pessoa_juridica',
     'Bruno Cavalcante Reis', NULL, '(95) 98140-6619', 'dijuv@exemplo.test', 'Diretoria de Juventude', NULL, NULL, NULL,
     '2026-12-12 18:00-04', '2026-12-12 22:00-04', '18h às 22h', 'Quadra principal com palco', 'Quadra principal', 1200, 'solicitado', NULL,
     NULL, NULL, NULL, '{}', 'Entrega de certificados a 420 jovens concluintes.', '2026-10-20 11:15-04'),
    (5, 2, 'Copa Roraima de Futebol Sub-20 — Rodadas finais', 'Semifinais e final.', 'competicao_esportiva', 'pessoa_juridica',
     'Edvaldo Pereira Sampaio', pg_temp.cpf('615284903'), '(95) 99105-8841', 'liga.boavistense@exemplo.test', 'Liga Boa-Vistense de Futebol', '05.618.932/0001-47', 'Edvaldo Pereira Sampaio', pg_temp.cpf('615284903'),
     '2026-08-22 15:00-04', '2026-08-30 18:00-04', 'Sábados e domingos, 15h às 18h', 'Campo, vestiários e arquibancada central', 'Campo principal', 3500, 'concluido', NULL,
     'Gramado recuperado após o evento pela Liga, conforme termo.', '18101.003980/2026-12', NULL, ARRAY['Futebol'], 'Competição de base com 8 clubes.', '2026-07-10 10:00-04'),
    (6, 2, 'Show de aniversário de Boa Vista', 'Evento musical com palco no gramado.', 'show_apresentacao', 'pessoa_juridica',
     'Marcelo Augusto Lira', pg_temp.cpf('904736152'), '(95) 99188-3015', 'producao.lirashows@exemplo.test', 'Lira Produções e Eventos Ltda', '42.117.590/0001-26', 'Marcelo Augusto Lira', pg_temp.cpf('904736152'),
     '2026-07-09 18:00-04', '2026-07-09 23:59-04', '18h às 24h', 'Gramado e arquibancadas', 'Campo principal', 7000, 'rejeitado',
     'Uso do gramado para show com palco é vedado pelo regimento da unidade (risco ao gramado em época de competições).',
     NULL, NULL, NULL, '{}', 'Show comemorativo com venda de ingressos.', '2026-06-12 16:20-04'),
    (7, 2, 'Seletiva estadual de atletismo escolar', 'Provas de pista e campo.', 'seletiva', 'pessoa_juridica',
     'Thiago Barreto Cunha', NULL, '(95) 98123-7740', 'diesp@exemplo.test', 'Diretoria de Esporte', NULL, NULL, NULL,
     '2026-11-21 07:00-04', '2026-11-21 12:00-04', '07h às 12h', 'Pista e área de saltos', 'Pista de atletismo', 600, 'solicitado', NULL,
     NULL, NULL, NULL, ARRAY['Atletismo'], 'Seleção dos atletas para os Jogos Escolares Brasileiros.', '2026-10-17 09:30-04'),
    (8, 3, 'Escolinha municipal de vôlei — Rorainópolis', 'Aulas para crianças de 8 a 14 anos.', 'aula_escolinha', 'pessoa_juridica',
     'Francisca das Chagas Lopes', pg_temp.cpf('258147036'), '(95) 99162-4418', 'esporte.rorainopolis@exemplo.test', 'Secretaria Municipal de Esporte de Rorainópolis', '04.056.217/0001-90', 'Francisca das Chagas Lopes', pg_temp.cpf('258147036'),
     '2026-03-02 08:00-04', '2026-06-30 11:00-04', 'Ter e qui, 8h às 11h', 'Quadra coberta', 'Quadra', 60, 'cancelado', NULL,
     'Cancelado por interdição da quadra para reforma (processo SEI 18101.000742/2026-11).', '18101.000233/2026-58', NULL, ARRAY['Vôlei'], 'Projeto social em parceria com o município.', '2026-01-20 10:00-04'),
    (9, 4, 'Festival de Natação Infantil', 'Provas de 25 m nos quatro estilos.', 'festival_esportivo', 'pessoa_juridica',
     'Rosângela Matos Viana', pg_temp.cpf('369258147'), '(95) 99140-2296', 'contato.aquaticarr@exemplo.test', 'Associação Roraimense de Desportos Aquáticos', '19.664.803/0001-52', 'Rosângela Matos Viana', pg_temp.cpf('369258147'),
     '2026-10-10 08:00-04', '2026-10-10 12:00-04', '08h às 12h', 'Piscina semiolímpica e arquibancada', 'Piscina principal', 350, 'concluido', NULL,
     NULL, '18101.005004/2026-37', NULL, ARRAY['Natação'], 'Festival de iniciação com 140 crianças.', '2026-09-01 15:00-04'),
    (10, 4, 'Treinos de natação paralímpica', 'Treinos da equipe de paranatação.', 'treinamento', 'pessoa_juridica',
     'Rosângela Matos Viana', pg_temp.cpf('369258147'), '(95) 99140-2296', 'contato.aquaticarr@exemplo.test', 'Associação Roraimense de Desportos Aquáticos', '19.664.803/0001-52', 'Rosângela Matos Viana', pg_temp.cpf('369258147'),
     '2026-11-03 06:00-04', '2026-12-18 08:00-04', 'Seg a sex, 6h às 8h', 'Raias 1 e 2', 'Piscina principal', 15, 'solicitado', NULL,
     NULL, NULL, NULL, ARRAY['Natação'], 'Preparação para o Circuito Loterias Caixa Regional Norte.', '2026-10-21 08:10-04'),
    (11, 1, 'Seminário Estadual de Políticas para a Juventude', 'Palestras e oficinas.', 'palestra_workshop', 'pessoa_juridica',
     'Renata Duarte Fontes', NULL, '(95) 98156-0311', 'dijuv@exemplo.test', 'Diretoria de Juventude', NULL, NULL, NULL,
     '2026-10-28 08:00-04', '2026-10-29 18:00-04', '08h às 18h', 'Sala multiuso e quadra auxiliar', 'Sala multiuso', 400, 'aprovado', NULL,
     NULL, '18101.005561/2026-04', NULL, '{}', 'Seminário com conselhos municipais de juventude.', '2026-10-01 13:00-04'),
    (12, 2, 'Amistoso beneficente veteranos', 'Partida beneficente com arrecadação de alimentos.', 'amistoso', 'pessoa_fisica',
     'José Ribamar Costa', pg_temp.cpf('147852369'), '(95) 99172-5583', 'ribamar.costa@exemplo.test', NULL, NULL, NULL, NULL,
     '2026-09-05 16:00-04', '2026-09-05 18:30-04', '16h às 18h30', 'Campo principal', 'Campo principal', 800, 'cancelado', NULL,
     'Cancelado a pedido do solicitante.', NULL, NULL, ARRAY['Futebol'], 'Arrecadação de 1 kg de alimento por pessoa.', '2026-08-18 10:00-04')
  ) AS a(k, ul, titulo, descr, tipo, tsol, sol, doc, tel, email, razao, cnpj, resp_legal, resp_doc, ini, fim, horario, area, espaco, publico, st, rejeicao,
         obs, sei, fed, modal, finalidade, criado);

-- ===================================================================== almoxarifado: requisições e movimentação de estoque
-- numero vazio: o trigger gera REQ-<ano>-<seq> pela sequência (não fixar à mão, para não colidir com as próximas da tela).
INSERT INTO public.requisicoes_material (id, numero, almoxarifado_id, solicitante_id, setor_solicitante_id, data_solicitacao, finalidade, status,
  responsavel_entrega_id, data_entrega, assinatura_eletronica_aceite, observacoes, created_by, created_at) VALUES
  (pg_temp.id(12, 6), NULL, 'f3000000-0000-4000-8000-000000000001', pg_temp.s(17), pg_temp.u(9), '2026-07-14', 'Reposição de expediente da ASJUR.', 'rejeitada',
   pg_temp.s(11), NULL, NULL, 'Rejeitada: a ASJUR recebeu reposição em 30/06 e a cota trimestral do setor foi atingida.', auth.uid(), '2026-07-14 08:50-04'),
  (pg_temp.id(12, 1), NULL, 'f3000000-0000-4000-8000-000000000001', pg_temp.s(6), pg_temp.u(5), '2026-08-04', 'Reposição mensal de expediente da DRH (agosto).', 'atendida',
   pg_temp.s(11), '2026-08-05', 'Recebido por Fernanda Albuquerque Lins em 05/08/2026 10:42 (aceite eletrônico)', NULL, auth.uid(), '2026-08-04 09:12-04'),
  (pg_temp.id(12, 7), NULL, 'f3000000-0000-4000-8000-000000000001', pg_temp.s(5), pg_temp.u(4), '2026-08-26', 'Material para evento da Diretoria de Juventude.', 'cancelada',
   NULL, NULL, NULL, 'Cancelada pelo solicitante: o evento foi adiado.', auth.uid(), '2026-08-26 13:00-04'),
  (pg_temp.id(12, 2), NULL, 'f3000000-0000-4000-8000-000000000001', pg_temp.s(7), pg_temp.u(6), '2026-09-02', 'Material para o fechamento da prestação de contas do 2º quadrimestre.', 'atendida',
   pg_temp.s(11), '2026-09-03', 'Recebido por Marcos Vinícius Teles em 03/09/2026 08:55 (aceite eletrônico)', NULL, auth.uid(), '2026-09-02 14:30-04'),
  (pg_temp.id(12, 3), NULL, 'f3000000-0000-4000-8000-000000000001', pg_temp.s(15), pg_temp.u(8), '2026-09-21', 'Impressão de material de divulgação dos Jogos Escolares.', 'parcialmente_atendida',
   pg_temp.s(11), '2026-09-22', 'Recebido por Gustavo Pereira Lago em 22/09/2026 15:10 (aceite eletrônico)', 'Toner atendido parcialmente: saldo insuficiente. Restante aguardando a entrada do empenho em andamento.', auth.uid(), '2026-09-21 11:05-04'),
  (pg_temp.id(12, 4), NULL, 'f3000000-0000-4000-8000-000000000001', pg_temp.s(13), pg_temp.u(3), '2026-10-20', 'Inscrições e súmulas dos Jogos Escolares (fase estadual).', 'pendente',
   NULL, NULL, NULL, NULL, auth.uid(), '2026-10-20 16:40-04'),
  (pg_temp.id(12, 5), NULL, 'f3000000-0000-4000-8000-000000000001', pg_temp.s(16), pg_temp.u(4), '2026-10-22', 'Oficinas do programa Jovem em Ação.', 'pendente',
   NULL, NULL, NULL, NULL, auth.uid(), '2026-10-22 10:25-04');

INSERT INTO public.requisicao_itens (id, requisicao_id, item_id, quantidade_solicitada, quantidade_atendida, observacoes, created_at) VALUES
  (pg_temp.id(13, 1), pg_temp.id(12, 1), 'f2000000-0000-4000-8000-000000000001', 10, 10, NULL, '2026-08-04 09:12-04'),
  (pg_temp.id(13, 2), pg_temp.id(12, 1), 'f2000000-0000-4000-8000-000000000002', 50, 50, NULL, '2026-08-04 09:12-04'),
  (pg_temp.id(13, 3), pg_temp.id(12, 2), 'f2000000-0000-4000-8000-000000000001', 8, 8, NULL, '2026-09-02 14:30-04'),
  (pg_temp.id(13, 4), pg_temp.id(12, 2), 'f2000000-0000-4000-8000-000000000003', 1, 1, NULL, '2026-09-02 14:30-04'),
  (pg_temp.id(13, 5), pg_temp.id(12, 3), 'f2000000-0000-4000-8000-000000000001', 15, 15, NULL, '2026-09-21 11:05-04'),
  (pg_temp.id(13, 6), pg_temp.id(12, 3), 'f2000000-0000-4000-8000-000000000003', 4, 2, 'Saldo insuficiente no dia; 2 unidades pendentes.', '2026-09-21 11:05-04'),
  (pg_temp.id(13, 7), pg_temp.id(12, 4), 'f2000000-0000-4000-8000-000000000001', 20, 0, NULL, '2026-10-20 16:40-04'),
  (pg_temp.id(13, 8), pg_temp.id(12, 4), 'f2000000-0000-4000-8000-000000000002', 100, 0, NULL, '2026-10-20 16:40-04'),
  (pg_temp.id(13, 9), pg_temp.id(12, 5), 'f2000000-0000-4000-8000-000000000002', 60, 0, NULL, '2026-10-22 10:25-04'),
  (pg_temp.id(13, 10), pg_temp.id(12, 5), 'f2000000-0000-4000-8000-000000000001', 5, 0, NULL, '2026-10-22 10:25-04'),
  (pg_temp.id(13, 11), pg_temp.id(12, 6), 'f2000000-0000-4000-8000-000000000001', 6, 0, NULL, '2026-07-14 08:50-04'),
  (pg_temp.id(13, 12), pg_temp.id(12, 7), 'f2000000-0000-4000-8000-000000000002', 40, 0, NULL, '2026-08-26 13:00-04');

-- O trigger fn_atualizar_estoque soma/subtrai cada movimento no saldo (estoque). Saldo inicial do dados-teste:
-- papel 45, caneta 300, toner 3. Entradas + saídas das requisições atendidas + um ajuste de inventário.
INSERT INTO public.movimentacoes_estoque (id, item_id, almoxarifado_id, tipo, subtipo, quantidade, valor_unitario, valor_total, nota_fiscal, requisicao_id,
  servidor_responsavel_id, setor_destino_id, observacao, created_by, created_at) VALUES
  (pg_temp.id(14, 1), 'f2000000-0000-4000-8000-000000000001', 'f3000000-0000-4000-8000-000000000001', 'entrada', 'compra', 100, 28.50, 2850.00, 'NF-e 000.018.734', NULL, pg_temp.s(11), NULL, 'Entrada da Ata de Registro de Preços nº 012/2026 — papel A4.', auth.uid(), '2026-07-28 10:00-04'),
  (pg_temp.id(14, 2), 'f2000000-0000-4000-8000-000000000002', 'f3000000-0000-4000-8000-000000000001', 'entrada', 'compra', 200, 1.20, 240.00, 'NF-e 000.018.734', NULL, pg_temp.s(11), NULL, 'Entrada da Ata de Registro de Preços nº 012/2026 — canetas.', auth.uid(), '2026-07-28 10:05-04'),
  (pg_temp.id(14, 3), 'f2000000-0000-4000-8000-000000000003', 'f3000000-0000-4000-8000-000000000001', 'entrada', 'compra', 2, 320.00, 640.00, 'NF-e 000.004.291', NULL, pg_temp.s(11), NULL, 'Entrada de toner (dispensa eletrônica nº 031/2026).', auth.uid(), '2026-08-19 14:20-04'),
  (pg_temp.id(14, 4), 'f2000000-0000-4000-8000-000000000001', 'f3000000-0000-4000-8000-000000000001', 'saida', 'requisicao', 10, 28.50, 285.00, NULL, pg_temp.id(12, 1), pg_temp.s(11), pg_temp.u(5), NULL, auth.uid(), '2026-08-05 10:40-04'),
  (pg_temp.id(14, 5), 'f2000000-0000-4000-8000-000000000002', 'f3000000-0000-4000-8000-000000000001', 'saida', 'requisicao', 50, 1.20, 60.00, NULL, pg_temp.id(12, 1), pg_temp.s(11), pg_temp.u(5), NULL, auth.uid(), '2026-08-05 10:40-04'),
  (pg_temp.id(14, 6), 'f2000000-0000-4000-8000-000000000001', 'f3000000-0000-4000-8000-000000000001', 'saida', 'requisicao', 8, 28.50, 228.00, NULL, pg_temp.id(12, 2), pg_temp.s(11), pg_temp.u(6), NULL, auth.uid(), '2026-09-03 08:50-04'),
  (pg_temp.id(14, 7), 'f2000000-0000-4000-8000-000000000003', 'f3000000-0000-4000-8000-000000000001', 'saida', 'requisicao', 1, 320.00, 320.00, NULL, pg_temp.id(12, 2), pg_temp.s(11), pg_temp.u(6), NULL, auth.uid(), '2026-09-03 08:50-04'),
  (pg_temp.id(14, 8), 'f2000000-0000-4000-8000-000000000001', 'f3000000-0000-4000-8000-000000000001', 'saida', 'requisicao', 15, 28.50, 427.50, NULL, pg_temp.id(12, 3), pg_temp.s(11), pg_temp.u(8), NULL, auth.uid(), '2026-09-22 15:05-04'),
  (pg_temp.id(14, 9), 'f2000000-0000-4000-8000-000000000003', 'f3000000-0000-4000-8000-000000000001', 'saida', 'requisicao', 2, 320.00, 640.00, NULL, pg_temp.id(12, 3), pg_temp.s(11), pg_temp.u(8), 'Atendimento parcial (2 de 4).', auth.uid(), '2026-09-22 15:05-04'),
  (pg_temp.id(14, 10), 'f2000000-0000-4000-8000-000000000002', 'f3000000-0000-4000-8000-000000000001', 'ajuste', 'inventario', -12, 1.20, 14.40, NULL, NULL, pg_temp.s(11), NULL, 'Ajuste da contagem física de 30/09/2026: 12 canetas ressecadas descartadas.', auth.uid(), '2026-09-30 17:00-04');

-- ===================================================================== acerto das datas do histórico gerado pelos triggers
-- (os triggers gravam data_evento = now(); aqui ela passa a ser a data do fato)
UPDATE public.historico_patrimonio h SET data_evento = m.data_aprovacao
  FROM public.movimentacoes_patrimonio m WHERE h.movimentacao_id = m.id AND m.id::text LIKE 'd5000000-%' AND m.data_aprovacao IS NOT NULL;
UPDATE public.historico_patrimonio h SET data_evento = CASE WHEN h.tipo_evento = 'manutencao_inicio' THEN m.created_at
                                                            ELSE coalesce(m.data_conclusao::timestamptz + time '17:00', m.created_at + interval '1 day') END
  FROM public.manutencoes_patrimonio m WHERE h.manutencao_id = m.id AND m.id::text LIKE 'd5000000-%';
UPDATE public.historico_patrimonio h SET data_evento = b.created_at, baixa_id = b.id
  FROM public.baixas_patrimonio b
 WHERE h.tipo_evento = 'baixa_solicitada' AND h.bem_id = b.bem_id AND h.baixa_id IS NULL AND (h.dados_novos ->> 'baixa_id') = b.id::text;

-- conferência rápida
SELECT 'campanhas_inventario' AS tabela, count(*) FROM public.campanhas_inventario
UNION ALL SELECT 'coletas_inventario', count(*) FROM public.coletas_inventario
UNION ALL SELECT 'movimentacoes_patrimonio', count(*) FROM public.movimentacoes_patrimonio
UNION ALL SELECT 'manutencoes_patrimonio', count(*) FROM public.manutencoes_patrimonio
UNION ALL SELECT 'baixas_patrimonio', count(*) FROM public.baixas_patrimonio
UNION ALL SELECT 'agenda_unidade', count(*) FROM public.agenda_unidade
UNION ALL SELECT 'requisicoes_material', count(*) FROM public.requisicoes_material;

COMMIT;
