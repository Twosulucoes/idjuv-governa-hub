-- ============================================================================
-- Onda E3 do RH — integridade da remessa CNAB e dos eventos do eSocial
-- ============================================================================
-- Spec: docs/superpowers/specs/2026-10-11-rh-vazamentos-arquivos-design.md (itens 3 e 4 de "O que muda")
-- Levantamento: docs/planejamento/REVISAO_RH.md (seções 4 e 5)
-- Depende da E1 (20261011000000_rh_autoria_trilha.sql): zz_fixar_autoria e audit_<tabela> já estão ligados em
-- remessas_bancarias e eventos_esocial (quem gera, altera e cancela fica na trilha).
--
-- Vale nos DOIS estados do banco: (a) construído do baseline (supabase/baseline/) e (b) produzido só pelas migrações.
-- Idempotente: ADD COLUMN IF NOT EXISTS, CREATE OR REPLACE, DROP ... IF EXISTS, índice e CHECK criados só se faltarem,
-- bucket com ON CONFLICT. Linhas antigas não são apagadas nem renumeradas (bloco 4). Não mexe em RLS de tabela existente: o fim do DELETE pela API em remessas_bancarias e
-- eventos_esocial e a leitura dos contracheques ficam na migração seguinte, 20261011010100_rh_contracheques_leitura.sql
-- (pode ser segurada sem segurar esta).
--
-- Blocos:
--   1. colunas novas: remessas_bancarias.arquivo_path/arquivo_sha256 (arquivo guardado no bucket) e
--      cancelada_em/cancelada_por/motivo_cancelamento; eventos_esocial.rascunho (gerada: sem recibo = não transmitido)
--   2. exigir_folha_fechada(): remessa e evento do eSocial só de folha com status 'fechada' (SQLSTATE RHE01); a folha
--      é lida com FOR SHARE (reabrir_folha espera a geração terminar, e vice-versa)
--   3. remessa_integridade(): número da remessa dado pelo banco (trava por conta; o do cliente é ignorado); valor
--      total e quantidade de registros calculados das fichas da folha (o do cliente é ignorado); folha, conta, número,
--      valor e quantidade fixos depois do INSERT; arquivo (caminho e sha256) gravado uma vez só, por quem gerou a
--      remessa, tem financeiro.folha.processar e enviou o objeto ao bucket; status 'cancelada' só pela RPC
--      cancelar_remessa; remessa cancelada não muda mais (RHE02/RHE03)
--   4. legado e índices únicos (criados sempre, sem apagar linha): remessa (conta, número); uma remessa ativa por
--      folha e conta; evento do eSocial (folha, evento, servidor), fora 'erro'/'rejeitado'
--   5. eSocial: 'enviado' e 'aceito' exigem recibo; S-1200/S-1210/S-1299 exigem folha (e servidor, nos dois
--      primeiros) (CHECKs); a coluna rascunho marca o que não foi transmitido
--   6. cancelar_remessa(p_remessa_id, p_motivo): cancela com motivo, autor e data (financeiro.folha.processar)
--   7. get_proximo_numero_remessa: prévia do número com a mesma regra do trigger, só para o módulo rh
--   8. reabrir_folha: recusa folha com remessa ativa; eventos do eSocial rascunho da folha saem da vigência ('erro')
--      (mesmo texto do supabase/baseline/overlay/18_funcoes_rpc.sql)
--   9. bucket privado remessas-cnab (<remessa_id>.rem): ler com o módulo rh E financeiro.folha.processar; enviar,
--      também só quem gerou a remessa, com ela 'gerada' há menos de 1 hora; sem UPDATE nem DELETE (mesmo texto do
--      supabase/baseline/overlay/50_storage.sql); outra policy de storage.objects que valha para o bucket aborta
--  10. privilégios das funções novas (mesmas linhas no supabase/baseline/overlay/40_privilegios.sql)
--
-- Códigos de erro (SQLSTATE) que o front trata:
--   RHE01  folha não fechada (remessa ou evento do eSocial recusado)
--   RHE02  campo fixo da remessa alterado (folha, conta, número, valor, quantidade, arquivo já gravado) ou remessa
--          cancelada alterada
--   RHE03  cancelamento fora de cancelar_remessa, ou remessa que não pode ser cancelada (já cancelada, processada)
--   42501  sem permissão (arquivo ou cancelamento sem financeiro.folha.processar; arquivo de remessa gerada por outro;
--          prévia do número sem o módulo rh)
--   22023  valor inválido (caminho, sha256, motivo)
--   P0002  arquivo_path sem o objeto no bucket remessas-cnab enviado pelo próprio usuário; remessa inexistente
--   23505  evento do eSocial repetido, número repetido ou segunda remessa ativa da mesma folha e conta
--   23514  evento 'enviado'/'aceito' sem recibo; S-1200/S-1210/S-1299 sem folha ou sem servidor
-- reabrir_folha devolve {success: false, error: ...} (padrão dela) quando há remessa ativa.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Colunas novas
-- ----------------------------------------------------------------------------
-- remessas_bancarias.arquivo_url e hash_arquivo (antigas) nunca foram preenchidas pelo front e ficam como estão; o
-- arquivo guardado passa a ser arquivo_path (objeto no bucket remessas-cnab) e arquivo_sha256 (hex minúsculo).
ALTER TABLE public.remessas_bancarias
  ADD COLUMN IF NOT EXISTS arquivo_path text,
  ADD COLUMN IF NOT EXISTS arquivo_sha256 text,
  ADD COLUMN IF NOT EXISTS cancelada_em timestamptz,
  ADD COLUMN IF NOT EXISTS cancelada_por uuid,
  ADD COLUMN IF NOT EXISTS motivo_cancelamento text;
COMMENT ON COLUMN public.remessas_bancarias.arquivo_path IS
  'Objeto do arquivo CNAB no bucket privado remessas-cnab (<id>.rem). Gravado uma vez, por quem processa a folha';
COMMENT ON COLUMN public.remessas_bancarias.arquivo_sha256 IS
  'SHA-256 (hex minúsculo) do arquivo guardado em arquivo_path. Gravado junto com o caminho, uma vez';
COMMENT ON COLUMN public.remessas_bancarias.cancelada_em IS 'Quando a remessa foi cancelada (só pela RPC cancelar_remessa)';
COMMENT ON COLUMN public.remessas_bancarias.cancelada_por IS
  'Usuário que cancelou (auth.uid() na RPC cancelar_remessa; sem FK, como as colunas de autoria da E1)';
COMMENT ON COLUMN public.remessas_bancarias.motivo_cancelamento IS 'Motivo informado no cancelamento (obrigatório)';
COMMENT ON COLUMN public.remessas_bancarias.numero_remessa IS
  'Número sequencial do arquivo (NSA) por conta, dado pelo banco no INSERT (o valor do cliente é ignorado)';
COMMENT ON COLUMN public.remessas_bancarias.valor_total IS
  'Soma do líquido das fichas da folha com valor > 0 e banco, agência e conta; calculada pelo banco no INSERT';
COMMENT ON COLUMN public.remessas_bancarias.quantidade_registros IS
  'Fichas da folha com valor líquido > 0 e banco, agência e conta (favorecidos do arquivo); calculada no INSERT';

-- Rascunho = sem recibo do eSocial (nada foi transmitido). Coluna gerada: o cliente não a escolhe. O CHECK do bloco 5
-- garante que 'enviado' e 'aceito' têm recibo, então rascunho = false só depois da transmissão (onda G).
ALTER TABLE public.eventos_esocial
  ADD COLUMN IF NOT EXISTS rascunho boolean GENERATED ALWAYS AS (recibo IS NULL) STORED;
COMMENT ON COLUMN public.eventos_esocial.rascunho IS
  'true enquanto o evento não foi transmitido (sem recibo do eSocial). Gerada a partir de recibo';

-- ----------------------------------------------------------------------------
-- 2. Folha fechada
-- ----------------------------------------------------------------------------
-- Remessa e evento do eSocial gerados de folha aberta saem com valores que ainda podem mudar. Vale para todos
-- (inclusive admin e service role). Evento sem folha_id (eventos não periódicos) não passa por aqui. Folha que não
-- existe fica para a FK. SECURITY DEFINER: lê a folha mesmo que a RLS de folhas_pagamento mude. FOR SHARE: a linha da
-- folha fica travada até o fim da transação; reabrir_folha (FOR UPDATE na mesma linha) espera a remessa ou o evento
-- ser gravado e então os enxerga, e uma geração que começa durante a reabertura espera e lê a folha já reaberta.
CREATE OR REPLACE FUNCTION public.exigir_folha_fechada()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_status text;
  v_ano int;
  v_mes int;
BEGIN
  IF NEW.folha_id IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT f.status::text, f.competencia_ano, f.competencia_mes INTO v_status, v_ano, v_mes
    FROM public.folhas_pagamento f WHERE f.id = NEW.folha_id
    FOR SHARE OF f;
  IF FOUND AND v_status IS DISTINCT FROM 'fechada' THEN
    RAISE EXCEPTION 'Folha %/% não está fechada (status: %): % só sai de folha fechada',
      lpad(v_mes::text, 2, '0'), v_ano, coalesce(v_status, 'sem status'),
      CASE TG_TABLE_NAME WHEN 'remessas_bancarias' THEN 'a remessa bancária' ELSE 'o evento do eSocial' END
      USING ERRCODE = 'RHE01',
            HINT = 'Feche a folha antes de gerar o arquivo (migração 20261011010000).';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_exigir_folha_fechada ON public.remessas_bancarias;
CREATE TRIGGER trg_exigir_folha_fechada
  BEFORE INSERT ON public.remessas_bancarias
  FOR EACH ROW EXECUTE FUNCTION public.exigir_folha_fechada();
DROP TRIGGER IF EXISTS trg_exigir_folha_fechada ON public.eventos_esocial;
CREATE TRIGGER trg_exigir_folha_fechada
  BEFORE INSERT OR UPDATE OF folha_id ON public.eventos_esocial
  FOR EACH ROW EXECUTE FUNCTION public.exigir_folha_fechada();

-- ----------------------------------------------------------------------------
-- 3. Remessa: número, campos fixos, arquivo e cancelamento
-- ----------------------------------------------------------------------------
-- Número: MAX(numero_remessa) + 1 da conta, sob pg_advisory_xact_lock por conta (duas gerações ao mesmo tempo na
-- mesma conta esperam uma pela outra; a trava sai no fim da transação). Em READ COMMITTED (PostgREST) a consulta
-- dentro do trigger já enxerga a remessa gravada por quem segurava a trava; o índice único do bloco 4 é a segunda
-- barreira. O número não reinicia no ano nem é reaproveitado (remessa cancelada conta).
-- Valor total e quantidade de registros: os do cliente são ignorados; o banco soma as fichas da folha (fechada, logo
-- imutável) com valor líquido > 0 e banco, agência e conta preenchidos, a mesma regra dos favorecidos do arquivo no
-- front (fichaTemBanco em src/hooks/useArquivosFolha.ts). O conteúdo do arquivo não é conferido no servidor.
-- Arquivo: quem grava arquivo_path/arquivo_sha256 tem o módulo rh e financeiro.folha.processar, é quem gerou a
-- remessa (gerado_por, fixado pela E1) e já enviou o objeto <id>.rem ao bucket remessas-cnab (o dono do objeto é o
-- próprio usuário: owner_id, ou owner nas versões antigas do Storage). A origem `sistema` (sem auth.uid(), fora dos
-- papéis da API: service role, Edge Function) dispensa essas três checagens; as de formato valem para todos.
-- O nome começa com "trg_r": roda depois de trg_exigir_folha_fechada e antes de update_*_updated_at e zz_fixar_autoria.
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
    SELECT coalesce(max(r.numero_remessa), 0) + 1 INTO NEW.numero_remessa
      FROM public.remessas_bancarias r WHERE r.conta_autarquia_id = NEW.conta_autarquia_id;
    SELECT count(*)::integer, coalesce(round(sum(f.valor_liquido), 2), 0)
      INTO NEW.quantidade_registros, NEW.valor_total
      FROM public.fichas_financeiras f
     WHERE f.folha_id = NEW.folha_id AND f.valor_liquido > 0
       AND coalesce(f.banco_codigo, '') <> '' AND coalesce(f.banco_agencia, '') <> '' AND coalesce(f.banco_conta, '') <> '';
  ELSE
    -- campos que identificam o arquivo gerado
    IF NEW.folha_id IS DISTINCT FROM OLD.folha_id OR NEW.conta_autarquia_id IS DISTINCT FROM OLD.conta_autarquia_id
       OR NEW.numero_remessa IS DISTINCT FROM OLD.numero_remessa OR NEW.valor_total IS DISTINCT FROM OLD.valor_total
       OR NEW.quantidade_registros IS DISTINCT FROM OLD.quantidade_registros THEN
      RAISE EXCEPTION 'Remessa %: folha, conta, número, valor e quantidade não mudam depois de gerada', OLD.numero_remessa
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

DROP TRIGGER IF EXISTS trg_remessa_integridade ON public.remessas_bancarias;
CREATE TRIGGER trg_remessa_integridade
  BEFORE INSERT OR UPDATE ON public.remessas_bancarias
  FOR EACH ROW EXECUTE FUNCTION public.remessa_integridade();

-- ----------------------------------------------------------------------------
-- 4. Legado e índices únicos
-- ----------------------------------------------------------------------------
-- Os três índices existem SEMPRE depois desta migração (o CI confere, .github/workflows/migracoes-banco.yml). Nada é
-- apagado nem renumerado:
--   * eSocial — evento rascunho (sem recibo) gerado antes da E3 que fura a regra nova vira status 'erro', com o motivo
--     em mensagem_retorno: S-1200/S-1210 sem servidor_id (o diálogo antigo não gravava o servidor, então todos da
--     folha caíam na mesma chave) e S-1200/S-1210/S-1299 sem folha_id ("sem servidor ou folha antes da E3"); dos
--     repetidos na mesma folha, evento e servidor (o S-1299 duplicava a cada clique), fica o mais recente e os outros
--     viram 'erro' ("duplicado antes da E3"); se o grupo tem evento transmitido (com recibo), fica o transmitido mais
--     recente. 'erro' é o caminho normal de evento a gerar de novo (fora do índice). O servidor_id não é preenchido pelo
--     CPF do payload: o formato do payload antigo não é fixo e um CPF errado ligaria o evento a outra pessoa.
--     Sobrando repetição só entre eventos transmitidos (não existe transmissão antes da onda G), os mais antigos ficam
--     fora do índice pelo id (predicado do índice parcial) e a migração avisa.
--   * remessas — número repetido na mesma conta (numeração antiga MAX+1 sem trava) e mais de uma remessa ativa da
--     mesma folha e conta: o número já foi para o banco (NSA) e a remessa pode já ter sido paga, então nada é renumerado
--     nem cancelado; as linhas antigas repetidas, menos a mais recente de cada grupo, ficam fora do índice pelo id. Isso
--     é seguro: número novo é sempre maior que o maior da conta (trigger), e uma remessa nova da folha só entra depois
--     de cancelar a ativa que ficou no índice. A lista de ids aparece no WARNING.
DO $$
DECLARE
  n bigint;
  v_fora uuid[];
  v_pred text;
BEGIN
  -- eSocial, legado: eventos periódicos rascunho sem folha, ou por servidor sem servidor
  UPDATE public.eventos_esocial e
     SET status = 'erro',
         mensagem_retorno = 'Sem servidor ou folha antes da E3: gere de novo pela folha'
   WHERE e.recibo IS NULL AND e.status NOT IN ('erro', 'rejeitado')
     AND e.tipo_evento IN ('S-1200', 'S-1210', 'S-1299')
     AND (e.folha_id IS NULL OR (e.tipo_evento IN ('S-1200', 'S-1210') AND e.servidor_id IS NULL));
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n > 0 THEN
    RAISE NOTICE 'eventos_esocial: % evento(s) rascunho sem servidor ou folha marcados como erro', n;
  END IF;

  -- eSocial, legado: repetidos na chave do índice; fica o transmitido mais recente ou, sem transmitido, o mais recente
  WITH ordem AS (
    SELECT e.id, e.recibo,
           row_number() OVER (PARTITION BY e.folha_id, e.tipo_evento,
                                           coalesce(e.servidor_id, '00000000-0000-0000-0000-000000000000'::uuid)
                              ORDER BY (e.recibo IS NOT NULL) DESC, e.created_at DESC, e.id DESC) AS pos
      FROM public.eventos_esocial e
     WHERE e.folha_id IS NOT NULL AND e.status NOT IN ('erro', 'rejeitado'))
  UPDATE public.eventos_esocial e
     SET status = 'erro', mensagem_retorno = 'Duplicado antes da E3 (fica o mais recente da folha)'
    FROM ordem o
   WHERE o.id = e.id AND o.pos > 1 AND o.recibo IS NULL;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n > 0 THEN
    RAISE NOTICE 'eventos_esocial: % evento(s) repetido(s) antes da E3 marcados como erro', n;
  END IF;

  IF to_regclass('public.eventos_esocial_folha_evento_servidor_uidx') IS NULL THEN
    -- só sobra repetição entre transmitidos: os mais antigos ficam fora do índice
    SELECT array_agg(o.id ORDER BY o.id) INTO v_fora FROM (
      SELECT e.id, row_number() OVER (PARTITION BY e.folha_id, e.tipo_evento,
                                                   coalesce(e.servidor_id, '00000000-0000-0000-0000-000000000000'::uuid)
                                      ORDER BY e.created_at DESC, e.id DESC) AS pos
        FROM public.eventos_esocial e
       WHERE e.folha_id IS NOT NULL AND e.status NOT IN ('erro', 'rejeitado')) o
     WHERE o.pos > 1;
    v_pred := 'folha_id IS NOT NULL AND status NOT IN (''erro'', ''rejeitado'')';
    IF v_fora IS NOT NULL THEN
      v_pred := v_pred || format(' AND id <> ALL (%L::uuid[])', v_fora);
      RAISE WARNING 'eventos_esocial: % evento(s) transmitido(s) repetido(s) ficaram fora do índice único (%); a retificação é da onda G, numa migração de correção', cardinality(v_fora), v_fora;
    END IF;
    EXECUTE 'CREATE UNIQUE INDEX eventos_esocial_folha_evento_servidor_uidx ON public.eventos_esocial USING btree '
         || '(folha_id, tipo_evento, coalesce(servidor_id, ''00000000-0000-0000-0000-000000000000''::uuid)) WHERE ' || v_pred;
  END IF;

  -- remessas: (conta, número), fora as antigas repetidas menos a mais recente de cada par
  IF to_regclass('public.remessas_bancarias_conta_numero_uidx') IS NULL THEN
    SELECT array_agg(o.id ORDER BY o.id) INTO v_fora FROM (
      SELECT r.id, row_number() OVER (PARTITION BY r.conta_autarquia_id, r.numero_remessa
                                      ORDER BY r.created_at DESC, r.id DESC) AS pos
        FROM public.remessas_bancarias r) o
     WHERE o.pos > 1;
    v_pred := '';
    IF v_fora IS NOT NULL THEN
      v_pred := format(' WHERE id <> ALL (%L::uuid[])', v_fora);
      RAISE WARNING 'remessas_bancarias: % remessa(s) antiga(s) com número repetido na conta ficaram fora do índice único (%); nada foi renumerado', cardinality(v_fora), v_fora;
    END IF;
    EXECUTE 'CREATE UNIQUE INDEX remessas_bancarias_conta_numero_uidx ON public.remessas_bancarias USING btree '
         || '(conta_autarquia_id, numero_remessa)' || v_pred;
  END IF;

  -- remessas: uma ativa (não cancelada) por folha e conta, fora as antigas repetidas menos a mais recente
  IF to_regclass('public.remessas_bancarias_folha_conta_ativa_uidx') IS NULL THEN
    SELECT array_agg(o.id ORDER BY o.id) INTO v_fora FROM (
      SELECT r.id, row_number() OVER (PARTITION BY r.folha_id, r.conta_autarquia_id
                                      ORDER BY r.created_at DESC, r.id DESC) AS pos
        FROM public.remessas_bancarias r WHERE r.status <> 'cancelada') o
     WHERE o.pos > 1;
    v_pred := 'status <> ''cancelada''';
    IF v_fora IS NOT NULL THEN
      v_pred := v_pred || format(' AND id <> ALL (%L::uuid[])', v_fora);
      RAISE WARNING 'remessas_bancarias: % remessa(s) antiga(s) ativa(s) da mesma folha e conta ficaram fora do índice único (%); cancele as que não valem', cardinality(v_fora), v_fora;
    END IF;
    EXECUTE 'CREATE UNIQUE INDEX remessas_bancarias_folha_conta_ativa_uidx ON public.remessas_bancarias USING btree '
         || '(folha_id, conta_autarquia_id) WHERE ' || v_pred;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 5. eSocial: transmitido só com recibo; evento periódico com folha e servidor
-- ----------------------------------------------------------------------------
-- NOT VALID primeiro (vale para linha nova e alterada); VALIDATE só se nenhuma linha antiga viola (o bloco 4 já tirou
-- da vigência os rascunhos antigos que violariam; sobrando linha transmitida, o CHECK fica NOT VALID e avisa).
-- Periódico: S-1200 (remuneração) e S-1210 (pagamentos) são por servidor e por folha; S-1299 (fechamento) é por
-- folha. Eventos em 'erro'/'rejeitado' ficam fora (são os que se geram de novo, inclusive os antigos marcados acima).
DO $$
DECLARE
  c record;
  v_viola boolean;
BEGIN
  FOR c IN SELECT * FROM (VALUES
      ('eventos_esocial_transmitido_com_recibo_check',
       'CHECK (status NOT IN (''enviado'', ''aceito'') OR recibo IS NOT NULL)',
       'status IN (''enviado'', ''aceito'') AND recibo IS NULL'),
      ('eventos_esocial_periodico_com_folha_check',
       -- tipo_evento é varchar: a lista vai como text[] explícito para o pg_dump devolver a mesma expressão
       'CHECK (status IN (''erro'', ''rejeitado'') OR tipo_evento::text <> ALL (ARRAY[''S-1200'', ''S-1210'', ''S-1299'']::text[]) OR '
         || '(folha_id IS NOT NULL AND (tipo_evento::text = ''S-1299'' OR servidor_id IS NOT NULL)))',
       'status NOT IN (''erro'', ''rejeitado'') AND tipo_evento IN (''S-1200'', ''S-1210'', ''S-1299'') AND '
         || '(folha_id IS NULL OR (tipo_evento <> ''S-1299'' AND servidor_id IS NULL))')
    ) AS v(nome, def, viola)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.eventos_esocial'::regclass AND conname = c.nome) THEN
      EXECUTE format('ALTER TABLE public.eventos_esocial ADD CONSTRAINT %I %s NOT VALID', c.nome, c.def);
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.eventos_esocial'::regclass
                  AND conname = c.nome AND NOT convalidated) THEN
      EXECUTE 'SELECT EXISTS (SELECT 1 FROM public.eventos_esocial WHERE ' || c.viola || ')' INTO STRICT v_viola;
      IF v_viola THEN
        RAISE WARNING 'eventos_esocial: há evento transmitido que viola %; o CHECK fica NOT VALID (vale para linha nova e alterada) até uma migração de correção', c.nome;
      ELSE
        EXECUTE format('ALTER TABLE public.eventos_esocial VALIDATE CONSTRAINT %I', c.nome);
      END IF;
    END IF;
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 6. cancelar_remessa
-- ----------------------------------------------------------------------------
-- A remessa não é apagada pela API (migração 20261011010100): vira 'cancelada', com quem, quando e por quê. A trilha
-- (audit_remessas_bancarias, E1) grava o UPDATE com o servidor responsável. Remessa 'processada' (o banco já pagou)
-- não se cancela. Devolve uma linha: id, número, status, cancelada_em, cancelada_por e motivo.
CREATE OR REPLACE FUNCTION public.cancelar_remessa(p_remessa_id uuid, p_motivo text)
RETURNS TABLE (id uuid, numero_remessa integer, status text, cancelada_em timestamptz, cancelada_por uuid,
               motivo_cancelamento text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_motivo text := btrim(coalesce(p_motivo, ''));
  v_status text;
BEGIN
  IF v_uid IS NULL OR NOT coalesce(public.can_access_module(v_uid, 'rh')
                                    AND public.has_permission_code(v_uid, 'financeiro.folha.processar'), false) THEN
    RAISE EXCEPTION 'cancelar_remessa: exige o módulo rh e a permissão financeiro.folha.processar' USING ERRCODE = '42501';
  END IF;
  IF length(v_motivo) < 5 OR length(v_motivo) > 1000 THEN
    RAISE EXCEPTION 'cancelar_remessa: motivo obrigatório (de 5 a 1000 caracteres)' USING ERRCODE = '22023';
  END IF;
  SELECT x.status INTO v_status FROM public.remessas_bancarias x WHERE x.id = p_remessa_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'cancelar_remessa: remessa não encontrada' USING ERRCODE = 'P0002';
  END IF;
  IF v_status = 'cancelada' THEN
    RAISE EXCEPTION 'cancelar_remessa: a remessa já está cancelada' USING ERRCODE = 'RHE03';
  END IF;
  IF v_status = 'processada' THEN
    RAISE EXCEPTION 'cancelar_remessa: remessa processada pelo banco não se cancela' USING ERRCODE = 'RHE03';
  END IF;
  PERFORM set_config('remessa.cancelar', p_remessa_id::text, true);
  UPDATE public.remessas_bancarias AS x
     SET status = 'cancelada', cancelada_em = now(), cancelada_por = v_uid, motivo_cancelamento = v_motivo
   WHERE x.id = p_remessa_id;
  PERFORM set_config('remessa.cancelar', '', true);
  RETURN QUERY
    SELECT x.id, x.numero_remessa, x.status::text, x.cancelada_em, x.cancelada_por, x.motivo_cancelamento
      FROM public.remessas_bancarias x WHERE x.id = p_remessa_id;
END;
$$;
COMMENT ON FUNCTION public.cancelar_remessa(uuid, text) IS
  'Cancela a remessa CNAB (status cancelada, cancelada_em/por, motivo). Exige módulo rh e financeiro.folha.processar';

-- ----------------------------------------------------------------------------
-- 7. Prévia do número (mesma regra do trigger)
-- ----------------------------------------------------------------------------
-- Antes contava por conta E ano (data_geracao); o número de verdade agora vem do trigger, por conta, sem reiniciar.
-- p_ano fica na assinatura só por compatibilidade (nenhuma tela chama mais a função) e é ignorado. É só prévia: quem
-- vale é o número devolvido pelo INSERT. Exige o módulo rh (antes qualquer logado consultava a numeração de qualquer
-- conta); o EXECUTE continua como estava. A origem `sistema` passa, como no trigger.
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
  SELECT COALESCE(MAX(numero_remessa), 0) + 1 INTO v_numero
  FROM remessas_bancarias
  WHERE conta_autarquia_id = p_conta_id;

  RETURN v_numero;
END;
$$;

-- ----------------------------------------------------------------------------
-- 8. reabrir_folha (mesmo texto de supabase/baseline/overlay/18_funcoes_rpc.sql; antes: 20261011000300)
-- ----------------------------------------------------------------------------
-- A folha é travada (FOR UPDATE) antes das checagens: uma remessa ou evento sendo gerado (FOR SHARE em
-- exigir_folha_fechada) termina antes, e o que começar depois espera e encontra a folha reaberta (RHE01).
--   * remessa ativa (não cancelada) da folha: recusa; o pagamento já pode ter ido ao banco. Cancele antes.
--   * eventos do eSocial rascunho (sem recibo) da folha: saem da vigência (status 'erro', "folha reaberta"), senão
--     ficariam no índice único e a folha refechada não geraria os eventos de novo. Transmitido (com recibo) fica: a
--     retificação é da onda G.
CREATE OR REPLACE FUNCTION public.reabrir_folha(p_folha_id uuid, p_justificativa text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_folha RECORD;
  v_user_id UUID;
  v_remessas text;
BEGIN
  v_user_id := auth.uid();
  
  -- Verificar autenticação
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário não autenticado');
  END IF;
  
  -- Justificativa obrigatória
  IF p_justificativa IS NULL OR trim(p_justificativa) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Justificativa obrigatória para reabrir folha');
  END IF;
  
  -- Verificar permissão (apenas super_admin)
  IF NOT public.usuario_pode_reabrir_folha(v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Apenas super administradores podem reabrir folhas');
  END IF;
  
  -- Buscar folha (travada até o fim: geração de remessa/eSocial em curso termina antes; a que vier depois espera)
  SELECT * INTO v_folha FROM public.folhas_pagamento WHERE id = p_folha_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Folha não encontrada');
  END IF;
  
  -- Verificar status atual
  IF v_folha.status != 'fechada' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Apenas folhas fechadas podem ser reabertas');
  END IF;

  -- Remessa bancária ativa: cancelar antes (E3)
  SELECT string_agg(r.numero_remessa::text, ', ' ORDER BY r.numero_remessa) INTO v_remessas
    FROM public.remessas_bancarias r
   WHERE r.folha_id = p_folha_id AND r.status <> 'cancelada';
  IF v_remessas IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error',
      format('A folha tem remessa bancária ativa (nº %s). Cancele a remessa antes de reabrir a folha.', v_remessas));
  END IF;
  
  -- Atualizar para reaberta
  UPDATE public.folhas_pagamento
  SET 
    status = 'reaberta',
    reaberto_por = v_user_id,
    reaberto_em = now(),
    justificativa_reabertura = p_justificativa
  WHERE id = p_folha_id;

  -- Eventos do eSocial rascunho da folha saem da vigência (E3)
  UPDATE public.eventos_esocial
     SET status = 'erro', mensagem_retorno = 'Folha reaberta: gere o evento de novo depois de fechar'
   WHERE folha_id = p_folha_id AND recibo IS NULL AND status NOT IN ('erro', 'rejeitado');
  
  -- Registrar no audit_log
  INSERT INTO public.audit_logs (
    action, entity_type, entity_id, module_name, description, user_id
  ) VALUES (
    'update', 'folhas_pagamento', p_folha_id, 'rh',
    format('Folha %s/%s REABERTA por super_admin. Justificativa: %s', v_folha.competencia_mes, v_folha.competencia_ano, p_justificativa),
    v_user_id
  );
  
  RETURN jsonb_build_object('success', true, 'message', 'Folha reaberta com sucesso');
END;
$function$;

-- ----------------------------------------------------------------------------
-- 9. Bucket privado remessas-cnab (mesmo texto de supabase/baseline/overlay/50_storage.sql)
-- ----------------------------------------------------------------------------
-- Um objeto por remessa, <remessa_id>.rem, enviado logo depois do INSERT e antes de gravar arquivo_path/arquivo_sha256
-- na remessa. Ler: módulo rh E financeiro.folha.processar. Enviar: o mesmo, e só para remessa que existe, foi gerada
-- pelo próprio usuário (gerado_por, fixado pela E1), está 'gerada' (não cancelada, não enviada), ainda não tem arquivo
-- e foi gerada há menos de 1 hora (data_geracao, fixada pela E1). Sem policy de UPDATE e DELETE: o arquivo guardado
-- não é trocado nem apagado pela API (baixar de novo serve o mesmo arquivo; o sha256 está na remessa). Sem leitura
-- pública (bucket privado, URL assinada). Objeto enviado sem a remessa ter recebido arquivo_path (falha no meio) fica
-- órfão: a limpeza é da service role (consulta em docs/BANCO_DE_DADOS.md).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('remessas-cnab', 'remessas-cnab', false, 10485760, ARRAY['text/plain', 'application/octet-stream'])
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "st_remessas-cnab_select" ON storage.objects;
CREATE POLICY "st_remessas-cnab_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'remessas-cnab' AND (public.can_access_module(auth.uid(), 'rh') AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar')));
DROP POLICY IF EXISTS "st_remessas-cnab_insert" ON storage.objects;
CREATE POLICY "st_remessas-cnab_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'remessas-cnab' AND (public.can_access_module(auth.uid(), 'rh') AND public.has_permission_code(auth.uid(), 'financeiro.folha.processar'))
              AND name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.rem$'
              AND EXISTS (SELECT 1 FROM public.remessas_bancarias r
                           WHERE r.id::text = left(objects.name, 36) AND r.arquivo_path IS NULL AND r.status = 'gerada'
                             AND r.gerado_por = auth.uid() AND r.data_geracao > now() - interval '1 hour'));
DROP POLICY IF EXISTS "st_remessas-cnab_update" ON storage.objects;
DROP POLICY IF EXISTS "st_remessas-cnab_delete" ON storage.objects;

-- Erro (aborta a migração): policy de storage.objects fora das st_remessas-cnab_* que valha para este bucket — cita o
-- bucket, não filtra bucket_id, ou o filtra por exclusão (bucket_id <> outro, NOT IN sem este). Policies permissivas são
-- OR: uma assim, criada fora das migrações, anularia a regra acima. Revise a policy e rode o deploy de novo.
DO $$
DECLARE v_lista text;
BEGIN
  SELECT string_agg(format('%I', policyname), ', ' ORDER BY policyname) INTO v_lista
    FROM pg_policies
   WHERE schemaname = 'storage' AND tablename = 'objects'
     AND policyname !~ '^st_remessas-cnab_(select|insert)$'
     AND (coalesce(qual, '') || ' ' || coalesce(with_check, ''))
         ~ ('bucket_id = ''remessas-cnab''|ANY \(ARRAY\[[^]]*''remessas-cnab''|^((?!bucket_id).)*$'
            || '|bucket_id <> ''(?!remessas-cnab'')|bucket_id <> ALL \(ARRAY\[((?!remessas-cnab)[^]])*\]'
            || '|NOT \(bucket_id = ''(?!remessas-cnab'')');
  IF v_lista IS NOT NULL THEN
    RAISE EXCEPTION 'storage.objects: policy(ies) % também vale(m) para o bucket remessas-cnab (OR com as st_remessas-cnab_*)', v_lista
      USING ERRCODE = '42501',
            HINT = 'Restrinja a policy a outros buckets (bucket_id = ''<bucket>'') e aplique de novo (migração 20261011010000).';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 10. Privilégios (o dump do baseline não leva GRANT/REVOKE: o overlay/40 repete estas linhas)
-- ----------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.exigir_folha_fechada() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.remessa_integridade() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cancelar_remessa(uuid, text) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.cancelar_remessa(uuid, text) TO authenticated;
