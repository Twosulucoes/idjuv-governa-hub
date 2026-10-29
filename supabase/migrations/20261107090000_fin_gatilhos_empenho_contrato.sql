-- ============================================================================
-- FINANCEIRO e CONTRATOS — gatilhos de saldo do empenho e do contrato
-- ============================================================================
-- Defeitos achados ao montar a demonstração (24/10/2026, docs/planejamento/ROADMAP.md), todos reproduzidos no
-- banco do baseline:
--
--   fn_atualizar_saldo_sub_empenho    gravava a coluna gerada fin_empenhos.saldo_liquidar: todo reforço e toda
--                                     anulação falhavam ("can only be updated to DEFAULT"). E o reforço somava na
--                                     dotação duas vezes (aqui e em trg_atualizar_saldo_empenho, que já segue
--                                     valor_empenhado). Agora o reforço só muda valor_empenhado (a dotação segue
--                                     pelo gatilho do empenho, que pula o empenho do FIPLAN) e a anulação devolve à
--                                     dotação só o empenho do sistema; anulação do saldo inteiro deixa o empenho
--                                     "anulado".
--   fn_atualizar_empenho_liquidacao   o CASE devolvia texto sem cast para status_empenho (liquidação aprovada no
--                                     INSERT falhava) e a aprovação por UPDATE era ignorada. Agora conta a
--                                     liquidação quando ela entra em "aprovada" (INSERT ou UPDATE) e devolve quando
--                                     sai; o status do empenho só muda enquanto não há pagamento.
--   fn_atualizar_empenho_pagamento    marcava o empenho "pago" quando o pago alcançava o liquidado, mesmo com parte
--                                     do empenho por liquidar. Agora "pago" só com o empenho inteiro pago
--                                     (empenhado − anulado); antes disso, "parcialmente_pago".
--   atualizar_saldo_contrato          o executado só contava medição "aprovada": a medição que passava a "paga"
--                                     saía do executado e o saldo do contrato voltava. Agora conta aprovada e paga.
--
-- Dados: o empenho do sistema marcado "pago" sem estar inteiro pago volta a "parcialmente_pago"; o executado e o
-- saldo do contrato com medição paga são recalculados. Sub-empenho nunca gravou, então não há o que corrigir.
-- Idempotente (CREATE OR REPLACE e UPDATE que só toca o que está errado).
-- ============================================================================

SET lock_timeout = '10s';

CREATE OR REPLACE FUNCTION public.fn_atualizar_saldo_sub_empenho() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  -- saldo_liquidar é coluna gerada; a dotação do reforço segue pelo gatilho trg_atualizar_saldo_empenho
  IF NEW.tipo = 'reforco' THEN
    UPDATE public.fin_empenhos
    SET valor_empenhado = valor_empenhado + NEW.valor,
        updated_at = now()
    WHERE id = NEW.empenho_id;

  ELSIF NEW.tipo = 'anulacao' THEN
    UPDATE public.fin_empenhos
    SET valor_anulado = COALESCE(valor_anulado, 0) + NEW.valor,
        status = (CASE
          WHEN valor_empenhado - COALESCE(valor_anulado, 0) - NEW.valor <= 0
               AND COALESCE(valor_liquidado, 0) = 0 AND COALESCE(valor_pago, 0) = 0 THEN 'anulado'
          ELSE status::text
        END)::public.status_empenho,
        updated_at = now()
    WHERE id = NEW.empenho_id;

    -- Devolver saldo à dotação (empenho do FIPLAN: a dotação vem do QDD)
    UPDATE public.fin_dotacoes
    SET valor_empenhado = COALESCE(valor_empenhado, 0) - NEW.valor,
        updated_at = now()
    WHERE id = (SELECT dotacao_id FROM public.fin_empenhos WHERE id = NEW.empenho_id AND origem = 'sistema');
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_atualizar_empenho_liquidacao() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_delta numeric := 0;
BEGIN
  -- conta quando entra em "aprovada" (no INSERT ou na aprovação) e devolve quando sai
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'aprovada' THEN
      v_delta := NEW.valor_liquidado;
    END IF;
  ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'aprovada' THEN
      v_delta := NEW.valor_liquidado;
    ELSIF OLD.status = 'aprovada' THEN
      v_delta := -OLD.valor_liquidado;
    END IF;
  END IF;

  IF v_delta = 0 THEN
    RETURN NEW;
  END IF;

  -- com pagamento, o status é do gatilho do pagamento
  UPDATE fin_empenhos
  SET valor_liquidado = COALESCE(valor_liquidado, 0) + v_delta,
      status = (CASE
        WHEN status = 'anulado' OR COALESCE(valor_pago, 0) > 0 THEN status::text
        WHEN COALESCE(valor_liquidado, 0) + v_delta <= 0 THEN 'emitido'
        WHEN COALESCE(valor_liquidado, 0) + v_delta >= valor_empenhado - COALESCE(valor_anulado, 0) THEN 'liquidado'
        ELSE 'parcialmente_liquidado'
      END)::public.status_empenho,
      updated_at = now()
  WHERE id = NEW.empenho_id;

  -- Atualizar dotação
  UPDATE fin_dotacoes
  SET valor_liquidado = COALESCE(valor_liquidado, 0) + v_delta,
      updated_at = now()
  WHERE id = (SELECT dotacao_id FROM fin_empenhos WHERE id = NEW.empenho_id);

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_atualizar_empenho_pagamento() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.status = 'pago'
     AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM 'pago')) THEN
    -- Atualizar empenho: "pago" só com o empenho inteiro pago (empenhado − anulado)
    UPDATE fin_empenhos
    SET valor_pago = valor_pago + NEW.valor_bruto,
        status = (CASE
          WHEN valor_pago + NEW.valor_bruto >= valor_empenhado - COALESCE(valor_anulado, 0) THEN 'pago'
          ELSE 'parcialmente_pago'
        END)::public.status_empenho,
        updated_at = now()
    WHERE id = NEW.empenho_id;

    -- Atualizar dotação
    UPDATE fin_dotacoes
    SET valor_pago = valor_pago + NEW.valor_bruto,
        updated_at = now()
    WHERE id = (SELECT dotacao_id FROM fin_empenhos WHERE id = NEW.empenho_id);

    -- Atualizar saldo da conta bancária
    UPDATE fin_contas_bancarias
    SET saldo_atual = saldo_atual - NEW.valor_liquido,
        data_ultimo_saldo = COALESCE(NEW.data_efetivacao, NEW.data_pagamento),
        updated_at = now()
    WHERE id = NEW.conta_bancaria_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.atualizar_saldo_contrato() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- executado = medições aprovadas e pagas (a paga continua executada)
  UPDATE public.contratos SET
    valor_executado = (SELECT COALESCE(SUM(valor_aprovado), 0) FROM public.medicoes_contrato
      WHERE contrato_id = COALESCE(NEW.contrato_id, OLD.contrato_id) AND status IN ('aprovada', 'paga')),
    saldo_contrato = valor_atual - (SELECT COALESCE(SUM(valor_aprovado), 0) FROM public.medicoes_contrato
      WHERE contrato_id = COALESCE(NEW.contrato_id, OLD.contrato_id) AND status IN ('aprovada', 'paga'))
  WHERE id = COALESCE(NEW.contrato_id, OLD.contrato_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Dados gravados com as regras antigas
UPDATE public.fin_empenhos
   SET status = 'parcialmente_pago', updated_at = now()
 WHERE origem = 'sistema' AND status = 'pago'
   AND COALESCE(valor_pago, 0) < valor_empenhado - COALESCE(valor_anulado, 0);

WITH exec AS (
  SELECT contrato_id, SUM(COALESCE(valor_aprovado, 0)) AS executado
    FROM public.medicoes_contrato
   WHERE status IN ('aprovada', 'paga')
   GROUP BY contrato_id
)
UPDATE public.contratos c
   SET valor_executado = e.executado,
       saldo_contrato = c.valor_atual - e.executado
  FROM exec e
 WHERE e.contrato_id = c.id
   AND EXISTS (SELECT 1 FROM public.medicoes_contrato m WHERE m.contrato_id = c.id AND m.status = 'paga')
   AND c.valor_executado IS DISTINCT FROM e.executado;
