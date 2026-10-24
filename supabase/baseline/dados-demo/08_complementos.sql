-- Dados de demonstração — 08: o que depende de mais de um módulo. Só para o banco de TESTE,
-- depois de dados-teste.sql e dos arquivos 00 a 07 (precisa da agenda das unidades locais, do 05,
-- e da configuração institucional, do 06). Pessoas e documentos inventados. Guia: docs/NOVO_BANCO.md §9.
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
  IF NOT EXISTS (SELECT 1 FROM public.agenda_unidade WHERE id = 'd5000000-0000-4000-8000-001000000002')
     OR NOT EXISTS (SELECT 1 FROM public.config_institucional) THEN
    RAISE EXCEPTION 'recusado: rode antes os arquivos 05_patrimonio.sql e 06_governanca_admin.sql';
  END IF;
  IF EXISTS (SELECT 1 FROM public.termos_cessao) THEN
    RAISE EXCEPTION 'recusado: os dados de demonstração deste módulo já foram carregados';
  END IF;
END $$;
SELECT set_config('request.jwt.claim.sub', coalesce((SELECT id::text FROM public.profiles
  WHERE servidor_id = 'c0000000-0000-4000-8000-000000000001'), ''), true) AS _ \gset

-- ===================================================================== termos de cessão das unidades locais
INSERT INTO public.termos_cessao (agenda_id, unidade_local_id, numero_termo, ano, cessionario_nome, cessionario_documento,
  cessionario_endereco, cessionario_telefone, cessionario_email, cessionario_tipo, finalidade, periodo_inicio, periodo_fim,
  condicoes_uso, responsabilidades, chefe_responsavel_id, status, data_emissao, data_assinatura, tipo_termo,
  autoridade_concedente, autoridade_cargo, termo_responsabilidade_aceito, data_aceite_responsabilidade, processo_sei, doe_numero, doe_data)
SELECT a.id, a.unidade_local_id, v.numero, 2026, a.solicitante_nome, a.solicitante_documento,
       v.endereco, v.fone, v.email, v.tipo_cessionario, a.titulo, a.data_inicio, a.data_fim,
       'Uso restrito ao evento e ao horário autorizados; vedada a cobrança de ingresso sem autorização prévia; limpeza e entrega do espaço ao final de cada dia.',
       'O cessionário responde pela segurança dos participantes, pela guarda dos equipamentos e por qualquer dano ao patrimônio, que deverá ser ressarcido.',
       (SELECT n.id FROM public.nomeacoes_chefe_unidade n WHERE n.unidade_local_id = a.unidade_local_id AND n.status = 'ativo' LIMIT 1),
       v.status::public.status_termo_cessao, v.emissao, v.assinatura, 'autorizacao',
       'Helena Prado Moura', 'Presidente', v.status = 'assinado', CASE WHEN v.status = 'assinado' THEN v.assinatura::timestamptz END,
       v.sei, v.doe, v.doe_data
FROM (VALUES
  ('d5000000-0000-4000-8000-001000000002', 'TC-014/2026', 'Rua Uraricoera, 845, São Vicente, Boa Vista/RR', '(95) 98112-4570', 'antonio.bezerra@exemplo.test', 'pessoa_juridica',
   'assinado', timestamptz '2026-09-08 10:00-04', date '2026-09-10', '18101.000512/2026-63', '4987', date '2026-09-12'),
  ('d5000000-0000-4000-8000-001000000005', 'TC-011/2026', 'Av. Brasil, 2210, Pricumã, Boa Vista/RR', '(95) 99171-3308', 'edvaldo.sampaio@exemplo.test', 'pessoa_juridica',
   'assinado', timestamptz '2026-08-12 09:30-04', date '2026-08-14', '18101.000471/2026-20', '4968', date '2026-08-17'),
  ('d5000000-0000-4000-8000-001000000009', 'TC-016/2026', 'Rua Alfredo Cruz, 312, Pricumã, Boa Vista/RR', '(95) 99124-8851', 'rosangela.viana@exemplo.test', 'pessoa_fisica',
   'assinado', timestamptz '2026-10-01 11:00-04', date '2026-10-03', '18101.000588/2026-04', NULL, NULL),
  ('d5000000-0000-4000-8000-001000000003', 'TC-018/2026', 'Av. São Sebastião, 1210, Tancredo Neves, Boa Vista/RR', '(95) 98130-2295', 'socorro.lima@exemplo.test', 'pessoa_juridica',
   'emitido', timestamptz '2026-10-15 15:00-04', NULL, '18101.000603/2026-51', NULL, NULL),
  ('d5000000-0000-4000-8000-001000000012', 'TC-015/2026', 'Rua Coronel Mota, 77, Centro, Boa Vista/RR', '(95) 99102-6643', 'jose.costa@exemplo.test', 'pessoa_fisica',
   'cancelado', timestamptz '2026-08-28 10:00-04', NULL, '18101.000540/2026-18', NULL, NULL),
  ('d5000000-0000-4000-8000-001000000010', NULL, 'Rua Alfredo Cruz, 312, Pricumã, Boa Vista/RR', '(95) 99124-8851', 'rosangela.viana@exemplo.test', 'pessoa_fisica',
   'pendente', NULL, NULL, '18101.000627/2026-90', NULL, NULL)
) AS v(agenda, numero, endereco, fone, email, tipo_cessionario, status, emissao, assinatura, sei, doe, doe_data)
JOIN public.agenda_unidade a ON a.id = v.agenda::uuid;

-- documentos anexados aos pedidos de cessão (o caminho é do Storage; o arquivo não existe no banco de teste)
INSERT INTO public.documentos_cedencia (agenda_id, tipo_documento, nome_arquivo, url_arquivo, tamanho_bytes, mime_type, documento_principal, observacoes, uploaded_at)
VALUES
  ('d5000000-0000-4000-8000-001000000002', 'oficio_solicitacao', 'Oficio_087-2026_FRFS.pdf', 'cedencias/d5000000-0000-4000-8000-001000000002/oficio.pdf', 184320, 'application/pdf', true, 'Ofício da federação pedindo o ginásio para a final', timestamptz '2026-08-25 09:12-04'),
  ('d5000000-0000-4000-8000-001000000002', 'termo_assinado', 'TC-014-2026_assinado.pdf', 'cedencias/d5000000-0000-4000-8000-001000000002/termo.pdf', 256011, 'application/pdf', false, NULL, timestamptz '2026-09-10 16:40-04'),
  ('d5000000-0000-4000-8000-001000000005', 'oficio_solicitacao', 'Oficio_Liga_Sub20.pdf', 'cedencias/d5000000-0000-4000-8000-001000000005/oficio.pdf', 131072, 'application/pdf', true, NULL, timestamptz '2026-07-30 14:03-04'),
  ('d5000000-0000-4000-8000-001000000005', 'plano_seguranca', 'Plano_de_seguranca_Copa_Sub20.pdf', 'cedencias/d5000000-0000-4000-8000-001000000005/seguranca.pdf', 402115, 'application/pdf', false, 'Aprovado pela PM', timestamptz '2026-08-05 10:21-04'),
  ('d5000000-0000-4000-8000-001000000003', 'oficio_solicitacao', 'Oficio_FRV_treinos_sub17.pdf', 'cedencias/d5000000-0000-4000-8000-001000000003/oficio.pdf', 98304, 'application/pdf', true, NULL, timestamptz '2026-10-06 08:47-04');

-- ===================================================================== cadastros de RH por instituição
-- (dependem de config_institucional, criada no 06)
INSERT INTO public.config_tipos_servidor (instituicao_id, codigo, nome, descricao, permite_lotacao_externa, requer_provimento, requer_orgao_origem, requer_orgao_destino, ordem, vigencia_inicio)
SELECT i.id, v.cod, v.nome, v.descr, v.ext, v.prov, v.orig, v.dest, v.ord, date '2023-01-01'
FROM (SELECT id FROM public.config_institucional ORDER BY created_at LIMIT 1) i,
(VALUES
  ('efetivo_idjuv',      'Efetivo do quadro',            'Servidor ocupante de cargo efetivo do quadro próprio', false, true,  false, false, 1),
  ('comissionado_idjuv', 'Comissionado',                  'Ocupante exclusivamente de cargo em comissão',          false, true,  false, false, 2),
  ('cedido_entrada',     'Cedido de outro órgão',         'Servidor de outro órgão à disposição da autarquia',     false, false, true,  false, 3),
  ('cedido_saida',       'Cedido a outro órgão',          'Servidor do quadro à disposição de outro órgão',        true,  false, false, true,  4)
) AS v(cod, nome, descr, ext, prov, orig, dest, ord);

INSERT INTO public.config_situacoes_funcionais (instituicao_id, codigo, nome, descricao, permite_trabalho, permite_remuneracao, exige_documento, situacao_final, ordem)
SELECT i.id, v.* FROM (SELECT id FROM public.config_institucional ORDER BY created_at LIMIT 1) i,
(VALUES
  ('ativo',      'Ativo',                  'Em exercício na autarquia',                      true,  true,  false, false, 1),
  ('ferias',     'Em férias',              'Afastado por férias regulamentares',             false, true,  false, false, 2),
  ('licenca',    'Em licença',             'Afastado por licença prevista em lei',           false, true,  true,  false, 3),
  ('cedido',     'Cedido',                 'À disposição de outro órgão',                    false, false, true,  false, 4),
  ('exonerado',  'Exonerado',              'Vínculo encerrado por exoneração',               false, false, true,  true,  5),
  ('aposentado', 'Aposentado',             'Vínculo encerrado por aposentadoria',            false, false, true,  true,  6)
) AS v(cod, nome, descr, trab, rem, doc, fim, ord);

INSERT INTO public.config_tipos_ato (instituicao_id, codigo, nome, sigla, descricao, requer_doe, requer_assinatura, ordem)
SELECT i.id, v.* FROM (SELECT id FROM public.config_institucional ORDER BY created_at LIMIT 1) i,
(VALUES
  ('portaria',  'Portaria',          'PORT', 'Ato do Presidente publicado no Diário Oficial do Estado', true,  true, 1),
  ('decreto',   'Decreto',           'DEC',  'Ato do Governador (nomeação de dirigentes)',             true,  true, 2),
  ('resolucao', 'Resolução',         'RES',  'Ato do Conselho Diretor',                                true,  true, 3),
  ('despacho',  'Despacho',          'DESP', 'Decisão em processo SEI, sem publicação',                false, true, 4),
  ('termo',     'Termo',             'TERM', 'Termo de posse, de cessão ou de compromisso',            false, true, 5)
) AS v(cod, nome, sigla, descr, doe, ass, ord);

INSERT INTO public.config_tipos_onus (instituicao_id, codigo, nome, descricao, ordem)
SELECT i.id, v.* FROM (SELECT id FROM public.config_institucional ORDER BY created_at LIMIT 1) i,
(VALUES
  ('origem',  'Com ônus para a origem',  'A remuneração continua paga pelo órgão de origem', 1),
  ('destino', 'Com ônus para o destino', 'A remuneração passa a ser paga pelo órgão de destino', 2),
  ('sem_onus','Sem ônus',                'Cessão sem remuneração (ex.: mandato classista)', 3)
) AS v(cod, nome, descr, ord);

INSERT INTO public.config_motivos_desligamento (instituicao_id, codigo, nome, descricao, aplica_efetivo, aplica_comissionado, aplica_cedido, gera_vacancia, requer_portaria, requer_doe, ordem)
SELECT i.id, v.* FROM (SELECT id FROM public.config_institucional ORDER BY created_at LIMIT 1) i,
(VALUES
  ('exoneracao_pedido',  'Exoneração a pedido',     'Pedido do próprio servidor',                 true,  true,  false, true,  true,  true,  1),
  ('exoneracao_oficio',  'Exoneração de ofício',    'Ato da administração (cargo em comissão)',   false, true,  false, true,  true,  true,  2),
  ('aposentadoria',      'Aposentadoria',           'Concedida pelo regime próprio',              true,  false, false, true,  true,  true,  3),
  ('falecimento',        'Falecimento',             'Vacância por óbito',                         true,  true,  true,  true,  true,  true,  4),
  ('fim_cessao',         'Fim da cessão',           'Retorno do servidor ao órgão de origem',     false, false, true,  false, true,  false, 5)
) AS v(cod, nome, descr, ef, com, ced, vac, port, doe, ord);

-- ===================================================================== nome do login de teste nos registros
-- triggers de autoria copiam o nome do Auth ("Usuário de Teste", gravado pelo montar-ambiente-teste.sh);
-- na demonstração ele aparece como o servidor ligado ao login (a trilha de auditoria é imutável e fica como está)
UPDATE public.gestores_escolares SET responsavel_nome = 'Rafael Henrique Andrade' WHERE responsavel_nome = 'Usuário de Teste';

SELECT 'termos_cessao' AS tabela, count(*) FROM public.termos_cessao
UNION ALL SELECT 'documentos_cedencia', count(*) FROM public.documentos_cedencia
UNION ALL SELECT 'config_tipos_servidor', count(*) FROM public.config_tipos_servidor;

COMMIT;
