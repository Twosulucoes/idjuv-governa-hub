-- ============================================================================
-- Remessa da folha: pensão alimentícia, número inicial por conta
-- ============================================================================
-- Para o Gerenciador Financeiro do BB receber do sistema o que hoje recebe do SIGRH (três arquivos: servidores no BB,
-- pensão no BB e pensão em outros bancos; o gerador do BB põe BB e outros bancos em lotes do mesmo arquivo):
--   * remessas_bancarias.tipo_credito ('servidores' | 'pensao'): a remessa de pensão paga os beneficiários das pensões
--     descontadas na folha. O banco soma os créditos pelo desconto de pensão da ficha cujo beneficiário tem banco,
--     agência e conta (o item é "Pensão alimentícia — <beneficiário>" e a pensão é do servidor da ficha).
--     Uma remessa ativa por folha, conta e tipo (índice remessas_bancarias_folha_conta_ativa_uidx, mesmo nome).
--   * contas_autarquia.nsa_inicial: o primeiro número (NSA) da conta, para continuar a sequência do sistema anterior.
--     O número continua MAX + 1 da conta, nunca abaixo do inicial; get_proximo_numero_remessa mostra o mesmo.
-- Idempotente.
-- ============================================================================

ALTER TABLE public.contas_autarquia ADD COLUMN IF NOT EXISTS nsa_inicial integer;
COMMENT ON COLUMN public.contas_autarquia.nsa_inicial IS
  'Primeiro número de remessa (NSA) desta conta; continua a sequência do sistema anterior. Vazio = 1';
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contas_autarquia_nsa_inicial_check') THEN
    ALTER TABLE public.contas_autarquia ADD CONSTRAINT contas_autarquia_nsa_inicial_check
      CHECK (nsa_inicial IS NULL OR nsa_inicial BETWEEN 1 AND 999999);
  END IF;
END $$;

ALTER TABLE public.remessas_bancarias ADD COLUMN IF NOT EXISTS tipo_credito varchar(20) DEFAULT 'servidores' NOT NULL;
COMMENT ON COLUMN public.remessas_bancarias.tipo_credito IS 'servidores (líquido das fichas) ou pensao (beneficiários de pensão alimentícia)';
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'remessas_bancarias_tipo_credito_check') THEN
    ALTER TABLE public.remessas_bancarias ADD CONSTRAINT remessas_bancarias_tipo_credito_check
      CHECK (tipo_credito IN ('servidores', 'pensao'));
  END IF;
END $$;

-- uma remessa ativa por folha, conta e tipo (as antigas fora do índice continuam fora, pelo mesmo predicado)
DO $$
DECLARE
  v_def text := pg_get_indexdef(to_regclass('public.remessas_bancarias_folha_conta_ativa_uidx'));
  v_pred text;
BEGIN
  IF v_def IS NULL THEN
    v_pred := '(status)::text <> ''cancelada''::text';
  ELSIF v_def LIKE '%tipo_credito%' THEN
    RETURN;
  ELSE
    v_pred := substring(v_def FROM ' WHERE (.*)$');
  END IF;
  DROP INDEX IF EXISTS public.remessas_bancarias_folha_conta_ativa_uidx;
  EXECUTE 'CREATE UNIQUE INDEX remessas_bancarias_folha_conta_ativa_uidx ON public.remessas_bancarias USING btree '
       || '(folha_id, conta_autarquia_id, tipo_credito) WHERE ' || v_pred;
END $$;

-- ----------------------------------------------------------------------------
-- número inicial e total por tipo (o resto igual à migração 20261011010000)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.remessa_integridade()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_sistema boolean := auth.uid() IS NULL
    AND coalesce(current_setting('role', true), 'none') NOT IN ('anon', 'authenticated');
  v_cancelando boolean;
  v_carimbo text[] := ARRAY['updated_at', 'updated_by', 'updated_by_servidor_id'];
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'cancelada' THEN
      RAISE EXCEPTION 'Remessa não nasce cancelada: use cancelar_remessa depois de gerada'
        USING ERRCODE = 'RHE03';
    END IF;
    NEW.cancelada_em := NULL;
    NEW.cancelada_por := NULL;
    NEW.motivo_cancelamento := NULL;
    PERFORM pg_advisory_xact_lock(hashtextextended('remessas_bancarias.numero_remessa:' || NEW.conta_autarquia_id::text, 0));
    -- o primeiro número pode continuar a sequência do sistema anterior (contas_autarquia.nsa_inicial)
    SELECT greatest(coalesce(max(r.numero_remessa), 0) + 1,
                    coalesce((SELECT c.nsa_inicial FROM public.contas_autarquia c WHERE c.id = NEW.conta_autarquia_id), 1))
      INTO NEW.numero_remessa
      FROM public.remessas_bancarias r WHERE r.conta_autarquia_id = NEW.conta_autarquia_id;
    IF coalesce(NEW.tipo_credito, 'servidores') = 'pensao' THEN
      -- pensão alimentícia: um crédito por desconto de pensão da folha cujo beneficiário tem banco, agência e conta
      -- (a mesma regra de favorecidosPensao em src/hooks/useArquivosFolha.ts)
      SELECT count(*)::integer, coalesce(round(sum(i.valor), 2), 0)
        INTO NEW.quantidade_registros, NEW.valor_total
        FROM public.fichas_financeiras f
        JOIN public.itens_ficha_financeira i ON i.ficha_id = f.id AND i.tipo = 'desconto' AND i.valor > 0
        JOIN public.pensoes_alimenticias pa ON pa.servidor_id = f.servidor_id
                                           AND i.descricao = 'Pensão alimentícia — ' || pa.beneficiario_nome
       WHERE f.folha_id = NEW.folha_id
         AND coalesce(pa.banco_codigo, '') <> '' AND coalesce(pa.banco_agencia, '') <> '' AND coalesce(pa.banco_conta, '') <> '';
    ELSE
      SELECT count(*)::integer, coalesce(round(sum(f.valor_liquido), 2), 0)
        INTO NEW.quantidade_registros, NEW.valor_total
        FROM public.fichas_financeiras f
       WHERE f.folha_id = NEW.folha_id AND f.valor_liquido > 0
         AND coalesce(f.banco_codigo, '') <> '' AND coalesce(f.banco_agencia, '') <> '' AND coalesce(f.banco_conta, '') <> '';
    END IF;
  ELSE
    -- campos que identificam o arquivo gerado
    IF NEW.folha_id IS DISTINCT FROM OLD.folha_id OR NEW.conta_autarquia_id IS DISTINCT FROM OLD.conta_autarquia_id
       OR NEW.numero_remessa IS DISTINCT FROM OLD.numero_remessa OR NEW.valor_total IS DISTINCT FROM OLD.valor_total
       OR NEW.quantidade_registros IS DISTINCT FROM OLD.quantidade_registros
       OR NEW.tipo_credito IS DISTINCT FROM OLD.tipo_credito THEN
      RAISE EXCEPTION 'Remessa %: folha, conta, tipo, número, valor e quantidade não mudam depois de gerada', OLD.numero_remessa
        USING ERRCODE = 'RHE02';
    END IF;
    -- arquivo já gravado não muda nem some
    IF OLD.arquivo_path IS NOT NULL OR OLD.arquivo_sha256 IS NOT NULL THEN
      IF NEW.arquivo_path IS DISTINCT FROM OLD.arquivo_path OR NEW.arquivo_sha256 IS DISTINCT FROM OLD.arquivo_sha256 THEN
        RAISE EXCEPTION 'Remessa %: o arquivo já foi guardado (caminho e sha256 não mudam)', OLD.numero_remessa
          USING ERRCODE = 'RHE02';
      END IF;
    END IF;
    -- remessa cancelada não muda mais (só o carimbo de atualização, que os triggers seguintes regravam)
    IF OLD.status = 'cancelada' THEN
      IF (to_jsonb(NEW) - v_carimbo) IS DISTINCT FROM (to_jsonb(OLD) - v_carimbo) THEN
        RAISE EXCEPTION 'Remessa % está cancelada e não muda mais', OLD.numero_remessa
          USING ERRCODE = 'RHE02';
      END IF;
      RETURN NEW;
    END IF;
    -- cancelar só pela RPC (ela liga a variável local remessa.cancelar com o id; a API não define variáveis)
    v_cancelando := coalesce(current_setting('remessa.cancelar', true), '') = OLD.id::text;
    IF NOT v_cancelando
       AND (NEW.status = 'cancelada' OR NEW.cancelada_em IS DISTINCT FROM OLD.cancelada_em
            OR NEW.cancelada_por IS DISTINCT FROM OLD.cancelada_por
            OR NEW.motivo_cancelamento IS DISTINCT FROM OLD.motivo_cancelamento) THEN
      RAISE EXCEPTION 'Remessa %: cancelamento só pela RPC cancelar_remessa (com motivo)', OLD.numero_remessa
        USING ERRCODE = 'RHE03';
    END IF;
  END IF;

  -- arquivo: de nulo para valor, uma vez, caminho e hash juntos, por quem gerou a remessa e processa a folha
  IF (NEW.arquivo_path IS NOT NULL OR NEW.arquivo_sha256 IS NOT NULL)
     AND (TG_OP = 'INSERT' OR (OLD.arquivo_path IS NULL AND OLD.arquivo_sha256 IS NULL)) THEN
    IF NOT v_sistema AND NOT coalesce(v_uid IS NOT NULL AND public.can_access_module(v_uid, 'rh')
                                      AND public.has_permission_code(v_uid, 'financeiro.folha.processar'), false) THEN
      RAISE EXCEPTION 'Guardar o arquivo da remessa exige o módulo rh e a permissão financeiro.folha.processar'
        USING ERRCODE = '42501';
    END IF;
    IF NOT v_sistema AND (TG_OP = 'INSERT' OR OLD.gerado_por IS DISTINCT FROM v_uid) THEN
      RAISE EXCEPTION 'Só quem gerou a remessa guarda o arquivo dela (depois do INSERT)'
        USING ERRCODE = '42501';
    END IF;
    IF NEW.arquivo_path IS NULL OR NEW.arquivo_sha256 IS NULL THEN
      RAISE EXCEPTION 'Informe arquivo_path e arquivo_sha256 juntos' USING ERRCODE = '22023';
    END IF;
    IF NEW.arquivo_path <> NEW.id::text || '.rem' THEN
      RAISE EXCEPTION 'arquivo_path deve ser <id da remessa>.rem (bucket remessas-cnab)' USING ERRCODE = '22023';
    END IF;
    IF NEW.arquivo_sha256 !~ '^[0-9a-f]{64}$' THEN
      RAISE EXCEPTION 'arquivo_sha256 deve ter 64 dígitos hexadecimais minúsculos' USING ERRCODE = '22023';
    END IF;
    IF NOT v_sistema AND NOT EXISTS (
         SELECT 1 FROM storage.objects o
          WHERE o.bucket_id = 'remessas-cnab' AND o.name = NEW.arquivo_path
            AND coalesce(to_jsonb(o) ->> 'owner_id', to_jsonb(o) ->> 'owner') = v_uid::text) THEN
      RAISE EXCEPTION 'O arquivo % não foi enviado ao bucket remessas-cnab por este usuário', NEW.arquivo_path
        USING ERRCODE = 'P0002';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


CREATE OR REPLACE FUNCTION public.get_proximo_numero_remessa(p_conta_id uuid, p_ano integer) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_numero INTEGER;
BEGIN
  IF NOT coalesce((auth.uid() IS NULL AND coalesce(current_setting('role', true), 'none') NOT IN ('anon', 'authenticated'))
                  OR (auth.uid() IS NOT NULL AND public.can_access_module(auth.uid(), 'rh')), false) THEN
    RAISE EXCEPTION 'get_proximo_numero_remessa: exige o módulo rh' USING ERRCODE = '42501';
  END IF;
  SELECT greatest(COALESCE(MAX(numero_remessa), 0) + 1,
                  coalesce((SELECT c.nsa_inicial FROM contas_autarquia c WHERE c.id = p_conta_id), 1)) INTO v_numero
  FROM remessas_bancarias
  WHERE conta_autarquia_id = p_conta_id;

  RETURN v_numero;
END;
$$;

NOTIFY pgrst, 'reload schema';
