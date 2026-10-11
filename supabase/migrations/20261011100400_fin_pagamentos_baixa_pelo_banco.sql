-- ============================================================================
-- FINANCEIRO — baixa do pagamento só pelo banco ("trancar tudo")
-- ============================================================================
-- Spec: docs/superpowers/specs/2026-10-11-financeiro-fiplan-banco-design.md (Etapa 2). Muda regras de tabelas que já
-- existiam (fin_pagamentos e fin_alteracoes_orcamentarias): decisão "Trancar tudo" do usuário na thread do financeiro.
--
--   1. fin_pagamentos: pela API (anon/authenticated, admin inclusive) ninguém marca `pago`, nem insere já `pago`, nem
--      grava/muda data_efetivacao (42501). Quem baixa é o servidor: fin_marcar_pagamento_pago, chamada pelas RPCs
--      SECURITY DEFINER importar_arquivo_bancario e conciliar_movimento_bancario (rodam como o dono, não como
--      authenticated). As demais transições de status (programado, autorizado, cancelado...) seguem como antes.
--   2. fn_atualizar_empenho_pagamento (trigger trg_atualizar_empenho_pagamento, AFTER INSERT OR UPDATE OF status) só
--      agia no INSERT já `pago`; agora também na passagem para `pago` por UPDATE (OLD.status <> 'pago'), com o mesmo
--      efeito: valor pago e status do empenho, valor pago da dotação e saldo da conta de fin_contas_bancarias. Só na
--      transição (reimportar o retorno não soma de novo). Saída de `pago` não estorna nada (a função nunca estornou;
--      o estorno contábil segue fora desta regra). O QDD do FIPLAN (importar_qdd_fiplan) continua sobrescrevendo os
--      valores da dotação por atribuição: o efeito do trigger é provisório até a próxima importação.
--   3. fin_alteracoes_orcamentarias: alteração com situacao_fiplan = 'confirmada' não é apagada pela API (42501), admin
--      inclusive (a policy de DELETE da classe `modulo` não muda; quem barra é o trigger).
--
-- Triggers de guarda são SECURITY INVOKER de propósito: current_user é o papel de quem executa (anon/authenticated
-- pela API; o dono dentro das RPCs SECURITY DEFINER; service_role e postgres passam).
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. fin_pagamentos: baixa (pago / data_efetivacao) só pelo servidor
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fin_pagamentos_proteger_baixa()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.status::text = 'pago' OR NEW.data_efetivacao IS NOT NULL THEN
        RAISE EXCEPTION 'Pagamento não nasce pago: a baixa vem do retorno do banco ou da conciliação bancária.'
          USING ERRCODE = '42501';
      END IF;
    ELSIF (NEW.status::text = 'pago' AND OLD.status IS DISTINCT FROM NEW.status)
       OR NEW.data_efetivacao IS DISTINCT FROM OLD.data_efetivacao THEN
      RAISE EXCEPTION 'O pagamento % só é baixado (pago/data de efetivação) pelo retorno do banco ou pela conciliação bancária.', OLD.numero
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.fin_pagamentos_proteger_baixa() IS
  'Trigger: pela API (anon/authenticated) fin_pagamentos não passa a pago, não nasce pago e não muda data_efetivacao; a baixa é de fin_marcar_pagamento_pago (RPCs de conciliação bancária).';

REVOKE EXECUTE ON FUNCTION public.fin_pagamentos_proteger_baixa() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_fin_pagamentos_proteger_baixa ON public.fin_pagamentos;
CREATE TRIGGER trg_fin_pagamentos_proteger_baixa
  BEFORE INSERT OR UPDATE ON public.fin_pagamentos
  FOR EACH ROW EXECUTE FUNCTION public.fin_pagamentos_proteger_baixa();


-- ----------------------------------------------------------------------------
-- 2. Empenho, dotação e saldo também na passagem para pago por UPDATE
-- ----------------------------------------------------------------------------
-- Mesmo corpo de antes para o INSERT; o UPDATE só conta na transição para pago. Correção junto: o CASE do status do
-- empenho devolvia text e fin_empenhos.status é status_empenho (42804), então a baixa com empenho real sempre falhava,
-- inclusive no INSERT já pago; agora tem o cast. data_ultimo_saldo passa a usar a data de efetivação quando houver.
-- O trigger existente
-- (AFTER INSERT OR UPDATE OF status) já chama a função nos dois casos.
CREATE OR REPLACE FUNCTION public.fn_atualizar_empenho_pagamento()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'pago'
     AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM 'pago')) THEN
    -- Atualizar empenho
    UPDATE fin_empenhos
    SET valor_pago = valor_pago + NEW.valor_bruto,
        status = (CASE
          WHEN valor_pago + NEW.valor_bruto >= valor_liquidado THEN 'pago'
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

COMMENT ON FUNCTION public.fn_atualizar_empenho_pagamento() IS
  'Trigger de fin_pagamentos: na passagem para pago (INSERT já pago ou UPDATE de outro status para pago) soma o valor pago no empenho e na dotação e baixa o saldo da conta bancária. Não estorna ao sair de pago. O QDD do FIPLAN sobrescreve a dotação.';


-- ----------------------------------------------------------------------------
-- 3. Alteração orçamentária confirmada no FIPLAN não é apagada pela API
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fin_alteracoes_bloquear_exclusao_confirmada()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') AND OLD.situacao_fiplan = 'confirmada' THEN
    RAISE EXCEPTION 'Alteração % já confirmada no FIPLAN: não pode ser excluída.', OLD.numero USING ERRCODE = '42501';
  END IF;
  RETURN OLD;
END;
$$;

COMMENT ON FUNCTION public.fin_alteracoes_bloquear_exclusao_confirmada() IS
  'Trigger: alteração orçamentária confirmada no FIPLAN não é excluída pela API (anon/authenticated, admin inclusive).';

REVOKE EXECUTE ON FUNCTION public.fin_alteracoes_bloquear_exclusao_confirmada() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_fin_alteracoes_bloquear_exclusao_confirmada ON public.fin_alteracoes_orcamentarias;
CREATE TRIGGER trg_fin_alteracoes_bloquear_exclusao_confirmada
  BEFORE DELETE ON public.fin_alteracoes_orcamentarias
  FOR EACH ROW EXECUTE FUNCTION public.fin_alteracoes_bloquear_exclusao_confirmada();
