-- ============================================================================
-- Termo de cessão e designação de chefia de unidade local: registro do ciclo do SEI
-- ============================================================================
-- Regra "ato formal é do SEI" (P23, onda 5): o sistema não gera mais o PDF do termo de cessão nem o
-- memorando de designação. Ele só registra e acompanha o ciclo: processo SEI, número do ato no SEI,
-- assinatura e publicação no DOE. Mesmo padrão de nomes de documentos (processo_sei, doe_numero,
-- doe_data, data_assinatura) e de nomeacoes_chefe_unidade/lotacoes (ato_numero, ato_doe_*).
--
--   termos_cessao
--     processo_sei (novo)       processo SEI onde o termo foi formalizado
--     numero_termo              passa a aceitar nulo: é o número que o termo recebe no SEI; o termo
--                               nasce "pendente" (aguardando SEI) sem número. As linhas antigas
--                               mantêm o número interno que o sistema gerava (nada é reescrito).
--     data_assinatura           já existia
--     doe_numero, doe_data      (novos) publicação do extrato no DOE, quando houver
--     status                    o default já é 'pendente'; a tela deixa de gravar 'emitido' sem documento
--   nomeacoes_chefe_unidade
--     processo_sei (novo), ato_data_assinatura (novo)
--     ato_numero, ato_data_publicacao passam a aceitar nulo: a designação pode ser registrada quando o
--     processo é aberto no SEI e completada depois (número, assinatura e DOE já tinham colunas).
--
-- Só ADD COLUMN nulo (sem default, sem reescrita da tabela) e DROP NOT NULL: nenhuma linha antiga muda.
-- RLS: as policies rls_* das duas tabelas são por linha (módulo patrimonio; rh | patrimonio) e valem
-- para as colunas novas; os privilégios são por tabela. Nada de RLS muda aqui. Idempotente.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- termos_cessao
-- ---------------------------------------------------------------------------
ALTER TABLE public.termos_cessao ADD COLUMN IF NOT EXISTS processo_sei text;
ALTER TABLE public.termos_cessao ADD COLUMN IF NOT EXISTS doe_numero text;
ALTER TABLE public.termos_cessao ADD COLUMN IF NOT EXISTS doe_data date;
ALTER TABLE public.termos_cessao ALTER COLUMN numero_termo DROP NOT NULL;
ALTER TABLE public.termos_cessao ALTER COLUMN status SET DEFAULT 'pendente'::public.status_termo_cessao;

COMMENT ON COLUMN public.termos_cessao.processo_sei IS 'Número do processo SEI onde o termo de cessão foi formalizado';
COMMENT ON COLUMN public.termos_cessao.numero_termo IS
  'Número do termo no SEI; nulo enquanto aguarda o SEI (linhas registradas antes desta migração guardam o número interno gerado pelo sistema)';
COMMENT ON COLUMN public.termos_cessao.data_assinatura IS 'Data da assinatura do termo no SEI';
COMMENT ON COLUMN public.termos_cessao.doe_numero IS 'Número do DOE em que o extrato do termo foi publicado';
COMMENT ON COLUMN public.termos_cessao.doe_data IS 'Data do DOE em que o extrato do termo foi publicado';
COMMENT ON COLUMN public.termos_cessao.status IS
  'pendente = aguardando SEI; emitido = numerado no SEI, aguardando assinatura; assinado; cancelado';

-- ---------------------------------------------------------------------------
-- nomeacoes_chefe_unidade
-- ---------------------------------------------------------------------------
ALTER TABLE public.nomeacoes_chefe_unidade ADD COLUMN IF NOT EXISTS processo_sei text;
ALTER TABLE public.nomeacoes_chefe_unidade ADD COLUMN IF NOT EXISTS ato_data_assinatura date;
ALTER TABLE public.nomeacoes_chefe_unidade ALTER COLUMN ato_numero DROP NOT NULL;
ALTER TABLE public.nomeacoes_chefe_unidade ALTER COLUMN ato_data_publicacao DROP NOT NULL;

COMMENT ON COLUMN public.nomeacoes_chefe_unidade.processo_sei IS 'Número do processo SEI onde o ato de designação foi formalizado';
COMMENT ON COLUMN public.nomeacoes_chefe_unidade.ato_numero IS 'Número do ato no SEI; nulo enquanto aguarda o SEI';
COMMENT ON COLUMN public.nomeacoes_chefe_unidade.ato_data_assinatura IS 'Data da assinatura do ato de designação no SEI';
COMMENT ON COLUMN public.nomeacoes_chefe_unidade.ato_data_publicacao IS 'Data de publicação do ato; nula enquanto não publicado';
