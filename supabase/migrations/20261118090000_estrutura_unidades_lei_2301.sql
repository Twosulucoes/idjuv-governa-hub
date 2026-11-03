-- ============================================================================
-- Estrutura organizacional: as 42 unidades da Lei nº 2.301/2025 (art. 4º)
-- ============================================================================
-- Antes: o banco novo (baseline, docs/NOVO_BANCO.md) nasceu sem nenhuma unidade em estrutura_organizacional. Sem elas
-- o quadro de vagas não liga a vaga à unidade, a importação de cargo e lotação não acha a lotação e o organograma
-- fica vazio.
--
-- Agora: carga das unidades criadas pela Lei nº 2.301, de 29/12/2025, art. 4º, com a hierarquia do Decreto
-- nº 39.840-E/2026: Presidência; 6 unidades de assessoramento; 3 diretorias; 10 divisões; 22 núcleos (o Centro de
-- Referência da Juventude entra como núcleo da DiPP). As 40 Unidades Locais do quadro de cargos ficam de fora: não
-- há documento com o nome de cada uma.
--
-- Só dados: nenhuma tabela, coluna, policy ou grant muda. Idempotente: a unidade que já existe com a mesma sigla ou
-- o mesmo nome (sem diferença de maiúscula) não é inserida de novo nem alterada, e o superior é achado pela sigla.
-- ============================================================================

DO $$
DECLARE
  u record;
  v_superior uuid;
BEGIN
  FOR u IN
    SELECT * FROM (VALUES
      -- ordem, sigla, nome, tipo, nível, sigla do superior
      ( 1, 'PRES',   'Presidência',                                   'presidencia', 1, NULL),
      ( 2, 'GAB',    'Chefia de Gabinete',                            'assessoria',  2, 'PRES'),
      ( 3, 'ASJUR',  'Assessoria Jurídica',                           'assessoria',  2, 'PRES'),
      ( 4, 'ASESP',  'Assessoria Especial',                           'assessoria',  2, 'PRES'),
      ( 5, 'CI',     'Controle Interno',                              'assessoria',  2, 'PRES'),
      ( 6, 'CPL',    'Comissão de Contratação',                       'assessoria',  2, 'PRES'),
      ( 7, 'ASCOM',  'Assessoria de Comunicação',                     'assessoria',  2, 'PRES'),
      ( 8, 'DIRAF',  'Diretoria Administrativa e Financeira',         'diretoria',   2, 'PRES'),
      ( 9, 'DIESP',  'Diretoria de Esporte',                          'diretoria',   2, 'PRES'),
      (10, 'DIJUV',  'Diretoria da Juventude',                        'diretoria',   2, 'PRES'),
      -- DIRAF
      (11, 'DiCOF',  'Divisão de Contabilidade, Orçamento e Finanças', 'divisao',    3, 'DIRAF'),
      (12, 'NuPrO',  'Núcleo de Programação Orçamentária',            'nucleo',      4, 'DiCOF'),
      (13, 'NuFi',   'Núcleo de Finanças',                            'nucleo',      4, 'DiCOF'),
      (14, 'NuCont', 'Núcleo de Contabilidade',                       'nucleo',      4, 'DiCOF'),
      (15, 'DiAGP',  'Divisão Administrativa e Gestão Patrimonial',   'divisao',     3, 'DIRAF'),
      (16, 'NuDoc',  'Núcleo de Documentação, Protocolo e Arquivo',   'nucleo',      4, 'DiAGP'),
      (17, 'NuPat',  'Núcleo de Patrimônio e Logística',              'nucleo',      4, 'DiAGP'),
      (18, 'NuAC',   'Núcleo Administrativo de Contratos e Convênios', 'nucleo',     4, 'DiAGP'),
      (19, 'DRH',    'Divisão de Recursos Humanos',                   'divisao',     3, 'DIRAF'),
      (20, 'NuP',    'Núcleo de Pessoal',                             'nucleo',      4, 'DRH'),
      (21, 'NuF',    'Núcleo de Folha de Pagamento',                  'nucleo',      4, 'DRH'),
      (22, 'DiTI',   'Divisão de Tecnologia da Informação',           'divisao',     3, 'DIRAF'),
      (23, 'NuST',   'Núcleo de Suporte Técnico',                     'nucleo',      4, 'DiTI'),
      (24, 'NuProg', 'Núcleo de Programação',                         'nucleo',      4, 'DiTI'),
      -- DIESP
      (25, 'DiGEL',  'Divisão de Gestão de Esporte e Lazer',          'divisao',     3, 'DIESP'),
      (26, 'NuDeC',  'Núcleo de Desporto Comunitário',                'nucleo',      4, 'DiGEL'),
      (27, 'NuPAF',  'Núcleo de Promoção de Atividade Física e Lazer', 'nucleo',     4, 'DiGEL'),
      (28, 'DiRE',   'Divisão de Esporte de Alto Rendimento',         'divisao',     3, 'DIESP'),
      (29, 'NuRE',   'Núcleo de Esporte de Alto Rendimento',          'nucleo',      4, 'DiRE'),
      (30, 'NuGAO',  'Núcleo de Gestão e Apoio às Organizações Esportivas', 'nucleo', 4, 'DiRE'),
      (31, 'DiEDE',  'Divisão de Educação e Desporto Estudantil',     'divisao',     3, 'DIESP'),
      (32, 'NuED',   'Núcleo de Esporte Educacional',                 'nucleo',      4, 'DiEDE'),
      (33, 'NuBase', 'Núcleo de Esporte de Base',                     'nucleo',      4, 'DiEDE'),
      (34, 'DiGI',   'Divisão de Gestão Inclusiva e Qualidade de Vida', 'divisao',   3, 'DIESP'),
      (35, 'NuInc',  'Núcleo de Esporte, Inclusão Social e Saúde',    'nucleo',      4, 'DiGI'),
      (36, 'NuPar',  'Núcleo de Paradesporto',                        'nucleo',      4, 'DiGI'),
      -- DIJUV
      (37, 'DiPP',   'Divisão de Programas e Projetos',               'divisao',     3, 'DIJUV'),
      (38, 'NAT',    'Núcleo de Ações Temáticas de Políticas da Juventude', 'nucleo', 4, 'DiPP'),
      (39, 'CRJuv',  'Centro de Referência da Juventude',             'nucleo',      4, 'DiPP'),
      (40, 'DAPT',   'Divisão de Articulação de Políticas Transversais', 'divisao',  3, 'DIJUV'),
      (41, 'NuREL',  'Núcleo de Relações Institucionais e Articulação Regional de Políticas de Juventude', 'nucleo', 4, 'DAPT'),
      (42, 'NuPol',  'Núcleo de Políticas de Direitos da Juventude',  'nucleo',      4, 'DAPT')
    ) AS t(ordem, sigla, nome, tipo, nivel, superior)
    ORDER BY ordem
  LOOP
    CONTINUE WHEN EXISTS (
      SELECT 1 FROM public.estrutura_organizacional e
       WHERE lower(btrim(e.sigla)) = lower(u.sigla) OR lower(btrim(e.nome)) = lower(u.nome));

    v_superior := NULL;
    IF u.superior IS NOT NULL THEN
      SELECT e.id INTO v_superior FROM public.estrutura_organizacional e
       WHERE lower(btrim(e.sigla)) = lower(u.superior)
       ORDER BY e.ativo DESC NULLS LAST, e.created_at
       LIMIT 1;
    END IF;

    INSERT INTO public.estrutura_organizacional
      (nome, sigla, tipo, nivel, superior_id, ordem, ordem_exibicao, ativo, base_legal,
       lei_criacao_numero, lei_criacao_data, lei_criacao_artigo)
    VALUES
      (u.nome, u.sigla, u.tipo::public.tipo_unidade, u.nivel, v_superior, u.ordem, u.ordem, true, true,
       '2.301/2025', DATE '2025-12-29', 'art. 4º');
  END LOOP;
END;
$$;
