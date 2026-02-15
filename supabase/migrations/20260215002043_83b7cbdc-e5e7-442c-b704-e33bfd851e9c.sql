-- Trigger para validar saldo disponível antes de empenhar
CREATE OR REPLACE FUNCTION public.fn_validar_saldo_empenho()
RETURNS TRIGGER AS $$
DECLARE
  v_saldo NUMERIC;
BEGIN
  SELECT saldo_disponivel INTO v_saldo
  FROM public.fin_dotacoes
  WHERE id = NEW.dotacao_id;

  IF v_saldo IS NULL THEN
    RAISE EXCEPTION 'Dotação não encontrada (id: %)', NEW.dotacao_id;
  END IF;

  IF NEW.valor_empenhado > v_saldo THEN
    RAISE EXCEPTION 'Valor do empenho (R$ %) excede o saldo disponível da dotação (R$ %)', 
      NEW.valor_empenhado, v_saldo;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Criar trigger apenas para INSERT (emissão de novo empenho)
DROP TRIGGER IF EXISTS trg_validar_saldo_empenho ON public.fin_empenhos;
CREATE TRIGGER trg_validar_saldo_empenho
  BEFORE INSERT ON public.fin_empenhos
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_validar_saldo_empenho();