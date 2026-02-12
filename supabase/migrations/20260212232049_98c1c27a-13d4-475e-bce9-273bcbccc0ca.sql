
-- Adicionar campos do QDD que faltam na tabela fin_dotacoes
ALTER TABLE public.fin_dotacoes
  ADD COLUMN IF NOT EXISTS regional text,
  ADD COLUMN IF NOT EXISTS cod_acompanhamento text DEFAULT '0000',
  ADD COLUMN IF NOT EXISTS idu text DEFAULT 'Não',
  ADD COLUMN IF NOT EXISTS tro text DEFAULT 'No',
  ADD COLUMN IF NOT EXISTS valor_bloqueado numeric(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_reserva numeric(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_ped numeric(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_em_liquidacao numeric(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_restos_pagar numeric(15,2) DEFAULT 0;

-- Adicionar coluna PAOE (Programa/Ação Orçamentária - código composto) para referência rápida
ALTER TABLE public.fin_dotacoes
  ADD COLUMN IF NOT EXISTS paoe text;

-- Comentários para documentação
COMMENT ON COLUMN public.fin_dotacoes.regional IS 'Regional orçamentária (ex: 9900 - Estado)';
COMMENT ON COLUMN public.fin_dotacoes.cod_acompanhamento IS 'Código de acompanhamento orçamentário';
COMMENT ON COLUMN public.fin_dotacoes.idu IS 'Identificador de Uso (Não, EII, ECNI, ECI)';
COMMENT ON COLUMN public.fin_dotacoes.tro IS 'Tipo de Recurso Orçamentário';
COMMENT ON COLUMN public.fin_dotacoes.valor_bloqueado IS 'Valor bloqueado/contingenciado';
COMMENT ON COLUMN public.fin_dotacoes.valor_reserva IS 'Valor em contingenciamento/reserva';
COMMENT ON COLUMN public.fin_dotacoes.valor_ped IS 'Valor de pedido em andamento';
COMMENT ON COLUMN public.fin_dotacoes.valor_em_liquidacao IS 'Valor em processo de liquidação';
COMMENT ON COLUMN public.fin_dotacoes.valor_restos_pagar IS 'Valor inscrito em restos a pagar';
COMMENT ON COLUMN public.fin_dotacoes.paoe IS 'Código PAOE - Programa/Ação Orçamentária';
