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
-- bucket com ON CONFLICT. Não mexe em RLS de tabela existente: o fim do DELETE pela API em remessas_bancarias e
-- eventos_esocial e a leitura dos contracheques ficam na migração seguinte, 20261011010100_rh_contracheques_leitura.sql
-- (pode ser segurada sem segurar esta).
--
-- Blocos:
--   1. colunas novas: remessas_bancarias.arquivo_path/arquivo_sha256 (arquivo guardado no bucket) e
--      cancelada_em/cancelada_por/motivo_cancelamento; eventos_esocial.rascunho (gerada: sem recibo = não transmitido)
--   2. exigir_folha_fechada(): remessa e evento do eSocial só de folha com status 'fechada' (SQLSTATE RHE01)
--   3. remessa_integridade(): número da remessa dado pelo banco (trava por conta; o do cliente é ignorado); folha,
--      conta e número fixos depois do INSERT; arquivo (caminho e sha256) gravado uma vez só, por quem processa a folha;
--      status 'cancelada' só pela RPC cancelar_remessa; remessa cancelada não muda mais (RHE02/RHE03)
--   4. índices únicos: remessa (conta, número); evento do eSocial (folha, evento, servidor), fora 'erro'/'rejeitado'
--   5. eSocial: 'enviado' e 'aceito' exigem recibo (CHECK); a coluna rascunho marca o que não foi transmitido
--   6. cancelar_remessa(p_remessa_id, p_motivo): cancela com motivo, autor e data (financeiro.folha.processar)
--   7. get_proximo_numero_remessa: prévia do número com a mesma regra do trigger (por conta, sem reiniciar no ano)
--   8. bucket privado remessas-cnab (<remessa_id>.rem): ler e enviar com o módulo rh E financeiro.folha.processar;
--      sem UPDATE nem DELETE (mesmo texto do supabase/baseline/overlay/50_storage.sql)
--   9. privilégios das funções novas (mesmas linhas no supabase/baseline/overlay/40_privilegios.sql)
--
-- Códigos de erro (SQLSTATE) que o front trata:
--   RHE01  folha não fechada (remessa ou evento do eSocial recusado)
--   RHE02  campo fixo da remessa alterado (folha, conta, número, arquivo já gravado) ou remessa cancelada alterada
--   RHE03  cancelamento fora de cancelar_remessa, ou remessa que não pode ser cancelada (já cancelada, processada)
--   42501  sem permissão (arquivo ou cancelamento sem financeiro.folha.processar)
--   22023  valor inválido (caminho, sha256, motivo)
--   23505  evento do eSocial repetido (índice eventos_esocial_folha_evento_servidor_uidx) ou número repetido
--   23514  evento 'enviado'/'aceito' sem recibo (CHECK eventos_esocial_transmitido_com_recibo_check)
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
-- existe fica para a FK. SECURITY DEFINER: lê a folha mesmo que a RLS de folhas_pagamento mude.
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
    FROM public.folhas_pagamento f WHERE f.id = NEW.folha_id;
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
-- Origem `sistema` (sem auth.uid(), fora dos papéis da API: service role, Edge Function) dispensa só a checagem de
-- permissão do arquivo; as outras regras valem para todos.
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
  ELSE
    -- campos que identificam o arquivo gerado
    IF NEW.folha_id IS DISTINCT FROM OLD.folha_id OR NEW.conta_autarquia_id IS DISTINCT FROM OLD.conta_autarquia_id
       OR NEW.numero_remessa IS DISTINCT FROM OLD.numero_remessa THEN
      RAISE EXCEPTION 'Remessa %: folha, conta e número não mudam depois de gerada', OLD.numero_remessa
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

  -- arquivo: de nulo para valor, uma vez, caminho e hash juntos, por quem processa a folha
  IF (NEW.arquivo_path IS NOT NULL OR NEW.arquivo_sha256 IS NOT NULL)
     AND (TG_OP = 'INSERT' OR (OLD.arquivo_path IS NULL AND OLD.arquivo_sha256 IS NULL)) THEN
    IF NOT v_sistema AND NOT (v_uid IS NOT NULL AND public.can_access_module(v_uid, 'rh')
                              AND public.has_permission_code(v_uid, 'financeiro.folha.processar')) THEN
      RAISE EXCEPTION 'Guardar o arquivo da remessa exige o módulo rh e a permissão financeiro.folha.processar'
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
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_remessa_integridade ON public.remessas_bancarias;
CREATE TRIGGER trg_remessa_integridade
  BEFORE INSERT OR UPDATE ON public.remessas_bancarias
  FOR EACH ROW EXECUTE FUNCTION public.remessa_integridade();

-- ----------------------------------------------------------------------------
-- 4. Índices únicos
-- ----------------------------------------------------------------------------
-- Criados só se ainda não existem e se o banco não tem repetição: com repetição (numeração antiga MAX+1 sem trava, ou
-- eventos gerados duas vezes), a migração não apaga nem renumera nada; avisa (WARNING) e segue. Os triggers já impedem
-- número novo repetido (sempre acima do maior); a repetição antiga precisa ser revista à mão e a migração reaplicada.
DO $$
DECLARE
  n bigint;
BEGIN
  IF to_regclass('public.remessas_bancarias_conta_numero_uidx') IS NULL THEN
    SELECT count(*) INTO n FROM (
      SELECT 1 FROM public.remessas_bancarias
       GROUP BY conta_autarquia_id, numero_remessa HAVING count(*) > 1) d;
    IF n > 0 THEN
      RAISE WARNING 'remessas_bancarias: % par(es) (conta, número) repetido(s); índice único NÃO criado. Revise e reaplique 20261011010000', n;
    ELSE
      CREATE UNIQUE INDEX IF NOT EXISTS remessas_bancarias_conta_numero_uidx
        ON public.remessas_bancarias USING btree (conta_autarquia_id, numero_remessa);
    END IF;
  END IF;

  -- Mesmo evento da mesma folha para o mesmo servidor (servidor nulo conta como um só: S-1299 e afins). Eventos com
  -- 'erro' (não validados) e 'rejeitado' (recusados pelo eSocial) ficam fora: gerar de novo é o caminho deles.
  IF to_regclass('public.eventos_esocial_folha_evento_servidor_uidx') IS NULL THEN
    SELECT count(*) INTO n FROM (
      SELECT 1 FROM public.eventos_esocial
       WHERE folha_id IS NOT NULL AND status NOT IN ('erro', 'rejeitado')
       GROUP BY folha_id, tipo_evento, coalesce(servidor_id, '00000000-0000-0000-0000-000000000000'::uuid)
      HAVING count(*) > 1) d;
    IF n > 0 THEN
      RAISE WARNING 'eventos_esocial: % evento(s) repetido(s) na mesma folha e servidor; índice único NÃO criado. Revise e reaplique 20261011010000', n;
    ELSE
      CREATE UNIQUE INDEX IF NOT EXISTS eventos_esocial_folha_evento_servidor_uidx
        ON public.eventos_esocial USING btree
           (folha_id, tipo_evento, coalesce(servidor_id, '00000000-0000-0000-0000-000000000000'::uuid))
        WHERE folha_id IS NOT NULL AND status NOT IN ('erro', 'rejeitado');
    END IF;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 5. eSocial: transmitido só com recibo
-- ----------------------------------------------------------------------------
-- NOT VALID primeiro (vale para linha nova e alterada); VALIDATE só se nenhuma linha antiga viola (senão WARNING:
-- a linha antiga fica como está e o CHECK continua valendo para o que mudar).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.eventos_esocial'::regclass
                    AND conname = 'eventos_esocial_transmitido_com_recibo_check') THEN
    ALTER TABLE public.eventos_esocial ADD CONSTRAINT eventos_esocial_transmitido_com_recibo_check
      CHECK (status NOT IN ('enviado', 'aceito') OR recibo IS NOT NULL) NOT VALID;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.eventos_esocial'::regclass
                AND conname = 'eventos_esocial_transmitido_com_recibo_check' AND NOT convalidated) THEN
    IF EXISTS (SELECT 1 FROM public.eventos_esocial WHERE status IN ('enviado', 'aceito') AND recibo IS NULL) THEN
      RAISE WARNING 'eventos_esocial: há evento enviado/aceito sem recibo; CHECK eventos_esocial_transmitido_com_recibo_check fica NOT VALID';
    ELSE
      ALTER TABLE public.eventos_esocial VALIDATE CONSTRAINT eventos_esocial_transmitido_com_recibo_check;
    END IF;
  END IF;
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
  IF v_uid IS NULL OR NOT (public.can_access_module(v_uid, 'rh')
                           AND public.has_permission_code(v_uid, 'financeiro.folha.processar')) THEN
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
-- p_ano fica na assinatura (o front ainda a chama) e é ignorado. É só prévia: quem vale é o número devolvido pelo INSERT.
CREATE OR REPLACE FUNCTION public.get_proximo_numero_remessa(p_conta_id uuid, p_ano integer) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_numero INTEGER;
BEGIN
  SELECT COALESCE(MAX(numero_remessa), 0) + 1 INTO v_numero
  FROM remessas_bancarias
  WHERE conta_autarquia_id = p_conta_id;

  RETURN v_numero;
END;
$$;

-- ----------------------------------------------------------------------------
-- 8. Bucket privado remessas-cnab (mesmo texto de supabase/baseline/overlay/50_storage.sql)
-- ----------------------------------------------------------------------------
-- Um objeto por remessa, <remessa_id>.rem, enviado antes de gravar arquivo_path/arquivo_sha256 na remessa. Ler e
-- enviar: módulo rh E financeiro.folha.processar; enviar só para remessa que existe, não cancelada e ainda sem
-- arquivo. Sem policy de UPDATE e DELETE: o arquivo guardado não é trocado nem apagado pela API (baixar de novo serve
-- o mesmo arquivo; o sha256 está na remessa). Sem leitura pública (bucket privado, URL assinada).
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
                           WHERE r.id::text = left(objects.name, 36) AND r.arquivo_path IS NULL AND r.status <> 'cancelada'));
DROP POLICY IF EXISTS "st_remessas-cnab_update" ON storage.objects;
DROP POLICY IF EXISTS "st_remessas-cnab_delete" ON storage.objects;

-- Aviso (não erro): policy de storage.objects fora das st_remessas-cnab_* que valha para este bucket (cita o bucket ou
-- não filtra bucket_id). Policies permissivas são OR: uma assim, criada fora das migrações, anularia a regra acima.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
     WHERE schemaname = 'storage' AND tablename = 'objects'
       AND policyname !~ '^st_remessas-cnab_(select|insert)$'
       AND (coalesce(qual, '') || ' ' || coalesce(with_check, ''))
           ~ ('bucket_id = ''remessas-cnab''|ANY \(ARRAY\[[^]]*''remessas-cnab''|^((?!bucket_id).)*$')
  LOOP
    RAISE WARNING 'storage.objects: a policy "%" também vale para remessas-cnab; revise (OR com as st_remessas-cnab_*)', r.policyname;
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 9. Privilégios (o dump do baseline não leva GRANT/REVOKE: o overlay/40 repete estas linhas)
-- ----------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.exigir_folha_fechada() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.remessa_integridade() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cancelar_remessa(uuid, text) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.cancelar_remessa(uuid, text) TO authenticated;
