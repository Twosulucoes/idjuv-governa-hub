-- ============================================================================
-- Onda E2 do RH — consulta da trilha (índices) e trilha dos arquivos do RH no Storage
-- ============================================================================
-- Spec: docs/superpowers/specs/2026-10-10-rh-trilha-tela-design.md (item 1 de "O que muda")
-- Depende da E1 (20261011000000_rh_autoria_trilha.sql): colunas servidor_id/sequencia/origem/... de audit_logs,
-- trilha_contexto() e a imutabilidade da trilha.
--
-- Vale nos DOIS estados do banco: (a) construído do baseline (supabase/baseline/) e (b) produzido só pelas migrações.
-- Idempotente: índice criado só se não houver um equivalente, DROP INDEX IF EXISTS, CREATE OR REPLACE FUNCTION,
-- CREATE OR REPLACE TRIGGER.
--
-- Blocos:
--   1. índices de audit_logs para as consultas da tela (/admin/auditoria, /rh/auditoria, abas de histórico); os três
--      índices antigos que viram prefixo dos novos saem
--   2. trilha_storage_chave() e trilha_storage(): a chave do objeto sem dado pessoal e a função de trigger
--   3. triggers em storage.objects para os buckets frequencias e documentos-requerimento (mesmo texto do
--      supabase/baseline/overlay/50_storage.sql), só se o papel que aplica tiver privilégio; sem ele, WARNING e a
--      limitação fica registrada (docs/BANCO_DE_DADOS.md)
--
-- CREATE INDEX comum, e não CONCURRENTLY: o CI aplica com `supabase db push`, que roda cada migração numa transação,
-- e CREATE INDEX CONCURRENTLY não roda dentro de transação (o arquivo falharia). O índice comum segura uma trava SHARE
-- em audit_logs até o fim da migração: leituras seguem, mas toda gravação na trilha (ou seja, todo lançamento auditado)
-- espera. Hoje a tabela é pequena (banco novo da VPS) e a espera é de segundos. Se ela crescer antes do merge, crie os
-- índices à mão ANTES, com CREATE INDEX CONCURRENTLY e as mesmas colunas (fora de transação); esta migração reconhece
-- o equivalente e não cria outro.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Índices de audit_logs
-- ----------------------------------------------------------------------------
-- Consultas da tela (E2): histórico de um registro (entity_type + entity_id, na ordem da sequencia), o que um servidor
-- lançou (servidor_id, na ordem da sequencia), trilha de um módulo num período e de um usuário num período (ordem
-- "timestamp" DESC, sequencia DESC: o índice entrega a ordem sem sort; sequencia desempata dentro da transação).
-- "Equivalente" = índice btree válido, sem WHERE, com as mesmas colunas na mesma ordem (a direção não importa: o
-- btree é lido de trás para frente). Um índice criado à mão com outro nome conta.
DO $$
DECLARE
  r record;
  v_existe boolean;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('idx_audit_logs_entidade_seq',  'entity_type, entity_id, sequencia DESC'),
    ('idx_audit_logs_servidor_seq',  'servidor_id, sequencia DESC'),
    ('idx_audit_logs_modulo_tempo',  'module_name, "timestamp" DESC, sequencia DESC'),
    ('idx_audit_logs_usuario_tempo', 'user_id, "timestamp" DESC, sequencia DESC')
  ) AS v(nome, colunas) LOOP
    SELECT EXISTS (
      SELECT 1 FROM pg_index i JOIN pg_class ci ON ci.oid = i.indexrelid JOIN pg_am am ON am.oid = ci.relam
       WHERE i.indrelid = 'public.audit_logs'::regclass AND i.indisvalid AND i.indpred IS NULL AND am.amname = 'btree'
         AND replace(substring(pg_get_indexdef(i.indexrelid) FROM 'USING btree \((.*)\)$'), ' DESC', '')
             = replace(r.colunas, ' DESC', '')
    ) INTO v_existe;
    IF NOT v_existe THEN
      EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.audit_logs USING btree (%s)', r.nome, r.colunas);
    END IF;
  END LOOP;
END $$;

-- Os índices de uma coluna (ou duas) que viraram prefixo dos novos só custam gravação (toda linha da trilha atualiza
-- todos os índices): saem, mas só se o índice que os cobre existir (acima). idx_audit_logs_user cobria a FK
-- audit_logs.user_id -> auth.users; idx_audit_logs_usuario_tempo começa por user_id e continua cobrindo.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('idx_audit_logs_entity', 'entity_type, entity_id'),
    ('idx_audit_logs_module', 'module_name'),
    ('idx_audit_logs_user',   'user_id')
  ) AS v(nome, prefixo) LOOP
    IF to_regclass('public.' || r.nome) IS NOT NULL AND EXISTS (
         SELECT 1 FROM pg_index i JOIN pg_class ci ON ci.oid = i.indexrelid
          WHERE i.indrelid = 'public.audit_logs'::regclass AND i.indisvalid AND i.indpred IS NULL
            AND ci.relname <> r.nome
            AND replace(substring(pg_get_indexdef(i.indexrelid) FROM 'USING btree \((.*)\)$'), ' DESC', '')
                LIKE r.prefixo || ', %') THEN
      EXECUTE format('DROP INDEX IF EXISTS public.%I', r.nome);
    END IF;
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 2. Funções da trilha do Storage
-- ----------------------------------------------------------------------------
-- Chave de um objeto do Storage para a trilha, sem dado pessoal: o caminho do PDF de frequência leva matrícula e nome
-- do servidor (<período>/<unidade>/<matrícula>_<nome>_<carimbo>.pdf, useFrequenciaPacotes), então o caminho só vai em
-- claro quando cada pasta é um uuid ou um período (AAAA-MM) e o arquivo é <uuid>[.ext] (é o caso de
-- documentos-requerimento: <servidor_id>/<documento_id>.<ext>). Nos outros casos vai só o sha256 do caminho, que casa
-- com frequencia_arquivos.arquivo_path (encode(sha256(convert_to(arquivo_path, 'UTF8')), 'hex')) para quem pode ler a
-- tabela, e o período quando a primeira pasta é AAAA-MM. Nunca devolve erro; nome nulo vira caminho nulo.
CREATE OR REPLACE FUNCTION public.trilha_storage_chave(p_bucket text, p_nome text)
RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE
  u constant text := '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';
  v jsonb;
BEGIN
  v := jsonb_build_object('bucket', p_bucket);
  IF p_nome IS NULL THEN
    RETURN v || jsonb_build_object('caminho', NULL);
  END IF;
  v := v || jsonb_build_object(
    'caminho', CASE WHEN p_nome ~ ('^((' || u || '|[0-9]{4}-[0-9]{2})/)*' || u || '(\.[A-Za-z0-9]{1,10})?$')
                    THEN p_nome END,
    'caminho_sha256', encode(sha256(convert_to(p_nome, 'UTF8')), 'hex'));
  IF p_nome ~ '^[0-9]{4}-[0-9]{2}/' THEN
    v := v || jsonb_build_object('periodo', left(p_nome, 7));
  END IF;
  IF p_nome ~ '\.[A-Za-z0-9]{1,10}$' THEN
    v := v || jsonb_build_object('extensao', lower(substring(p_nome FROM '\.([A-Za-z0-9]{1,10})$')));
  END IF;
  RETURN v;
END;
$$;
COMMENT ON FUNCTION public.trilha_storage_chave(text, text) IS
  'Chave de um objeto do Storage para a trilha: bucket, caminho só quando é feito de uuid/AAAA-MM, sha256 do caminho, período e extensão';

-- Trigger de storage.objects: gravação (action 'upload'), troca ou movimentação ('update') e exclusão ('delete') de
-- um objeto viram uma linha em audit_logs, no módulo do argumento (fn: trilha_storage('rh')), com entity_type
-- 'storage.<bucket>' e entity_id = storage.objects.id. Quem agiu vem de trilha_contexto() (E1): usuário do JWT que a
-- Storage API repassa ao banco, servidor vinculado (retrato), origem (`sistema` para a service role), papel, unidade,
-- IP e user agent de request.headers. Sem conteúdo do arquivo e sem antes/depois: em metadata vão a chave
-- (trilha_storage_chave), o tamanho e o tipo informados pela Storage API (metadata.size/mimetype), a operação da
-- Storage API (GUC storage.operation, quando houver) e o servidor a que o arquivo pertence quando dá para saber sem
-- ler o arquivo (PDF de frequência com linha em frequencia_arquivos; pasta <servidor_id>/ de documentos-requerimento).
-- user_metadata (texto livre do cliente) não entra. UPDATE que só mexe em updated_at/last_accessed_at não grava; nem o
-- que só preenche metadata que estava nula (conclusão do upload). Os campos que mudaram vão em campos_alterados.
-- SECURITY DEFINER (dono postgres): grava em audit_logs, que a API não escreve.
CREATE OR REPLACE FUNCTION public.trilha_storage()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_novo jsonb;
  v_velho jsonb;
  v_obj jsonb;
  v_acao text;
  v_campos text[];
  v_bucket text;
  v_nome text;
  v_id uuid;
  v_alvo uuid;
  v_pasta text;
  v_tamanho text;
  v_meta jsonb;
  c jsonb;
BEGIN
  IF TG_OP <> 'DELETE' THEN v_novo := to_jsonb(NEW); END IF;
  IF TG_OP <> 'INSERT' THEN v_velho := to_jsonb(OLD); END IF;
  v_obj := coalesce(v_novo, v_velho);

  IF TG_OP = 'INSERT' THEN
    v_acao := 'upload';
  ELSIF TG_OP = 'UPDATE' THEN
    v_acao := 'update';
    SELECT array_agg(k ORDER BY k) INTO v_campos
      FROM unnest(ARRAY['bucket_id', 'name', 'owner', 'owner_id', 'version', 'metadata', 'user_metadata']) AS k
     WHERE (v_novo -> k) IS DISTINCT FROM (v_velho -> k);
    IF v_campos IS NULL THEN
      RETURN NULL;   -- só carimbos (updated_at, last_accessed_at)
    END IF;
    IF v_campos = ARRAY['metadata'] AND coalesce(jsonb_typeof(v_velho -> 'metadata'), 'null') = 'null' THEN
      RETURN NULL;   -- a Storage API completou os metadados do upload que acabou de gravar
    END IF;
  ELSE
    v_acao := 'delete';
  END IF;

  v_bucket := v_obj ->> 'bucket_id';
  v_nome := v_obj ->> 'name';
  IF (v_obj ->> 'id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    v_id := (v_obj ->> 'id')::uuid;
  END IF;

  -- servidor a que o arquivo pertence (não é quem agiu: esse vai em servidor_id)
  IF v_nome IS NOT NULL THEN
    IF v_bucket = 'frequencias' THEN
      SELECT fa.servidor_id INTO v_alvo FROM public.frequencia_arquivos fa
       WHERE fa.arquivo_path = v_nome AND fa.servidor_id IS NOT NULL LIMIT 1;
    ELSIF v_bucket = 'documentos-requerimento' THEN
      v_pasta := split_part(v_nome, '/', 1);
      IF v_pasta ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        SELECT s.id INTO v_alvo FROM public.servidores s WHERE s.id = v_pasta::uuid;
      END IF;
    END IF;
  END IF;

  v_tamanho := v_obj -> 'metadata' ->> 'size';
  v_meta := jsonb_build_object(
      'trigger', true, 'operation', TG_OP, 'table', 'storage.objects', 'fonte', 'storage',
      'chave', public.trilha_storage_chave(v_bucket, v_nome),
      'objeto_id', v_id)
    || jsonb_strip_nulls(jsonb_build_object(
      'tamanho', CASE WHEN v_tamanho ~ '^[0-9]{1,18}$' THEN v_tamanho::bigint END,
      'tipo_conteudo', left(v_obj -> 'metadata' ->> 'mimetype', 100),
      'operacao_storage', left(nullif(current_setting('storage.operation', true), ''), 60),
      'servidor_alvo_id', v_alvo));
  IF TG_OP = 'UPDATE' AND ('bucket_id' = ANY (v_campos) OR 'name' = ANY (v_campos)) THEN
    v_meta := v_meta || jsonb_build_object('anterior',
      public.trilha_storage_chave(v_velho ->> 'bucket_id', v_velho ->> 'name'));
  END IF;

  c := public.trilha_contexto();

  INSERT INTO public.audit_logs (
    action, entity_type, entity_id, module_name, user_id, description, metadata, campos_alterados, origem,
    servidor_id, servidor_nome, servidor_matricula, role_at_time, org_unit_id, ip_address, user_agent, transacao
  ) VALUES (
    v_acao::public.audit_action, 'storage.' || coalesce(v_bucket, '?'), v_id, coalesce(TG_ARGV[0], 'rh'),
    (c ->> 'user_id')::uuid,
    CASE v_acao WHEN 'upload' THEN 'Arquivo enviado ao bucket '
                WHEN 'update' THEN 'Arquivo substituído ou movido no bucket '
                ELSE 'Arquivo excluído do bucket ' END || coalesce(v_bucket, '?'),
    v_meta, v_campos, c ->> 'origem', (c ->> 'servidor_id')::uuid, c ->> 'servidor_nome', c ->> 'servidor_matricula',
    (c ->> 'papel')::public.app_role, (c ->> 'unidade_id')::uuid, (c ->> 'ip')::inet, c ->> 'agente', txid_current()
  );
  RETURN NULL;
END;
$$;
COMMENT ON FUNCTION public.trilha_storage() IS
  'Trigger de storage.objects: gravação, troca e exclusão de arquivo viram linha em audit_logs (módulo do argumento), sem conteúdo nem caminho com dado pessoal';

-- Nenhuma das duas é chamada pela API (o trigger roda como dono). No baseline, o mesmo REVOKE está no overlay/40.
REVOKE EXECUTE ON FUNCTION public.trilha_storage_chave(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trilha_storage() FROM PUBLIC, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 3. Triggers em storage.objects (mesmo texto de supabase/baseline/overlay/50_storage.sql)
-- ----------------------------------------------------------------------------
-- storage.objects é da plataforma (no Supabase, dono supabase_storage_admin; no shim de validação, postgres). Criar
-- trigger exige o privilégio TRIGGER na tabela (trocar um existente, ser dono): quem aplica as migrações (postgres)
-- já cria policies nela (overlay/50, B3). Se o banco de destino negar, a migração NÃO falha: emite WARNING, a trilha
-- dos arquivos fica desligada e vale a limitação registrada em docs/BANCO_DE_DADOS.md (registro pelo front). Um
-- WHEN por evento: os outros buckets não pagam nada. AFTER: só grava o que a RLS deixou passar.
DO $$
BEGIN
  IF to_regclass('storage.objects') IS NULL THEN
    RAISE WARNING 'trilha do Storage do RH: storage.objects não existe; triggers não criados';
    RETURN;
  END IF;
  BEGIN
    CREATE OR REPLACE TRIGGER trilha_rh_storage_insert AFTER INSERT ON storage.objects
      FOR EACH ROW WHEN (NEW.bucket_id IN ('frequencias', 'documentos-requerimento'))
      EXECUTE FUNCTION public.trilha_storage('rh');
    CREATE OR REPLACE TRIGGER trilha_rh_storage_update AFTER UPDATE ON storage.objects
      FOR EACH ROW WHEN (OLD.bucket_id IN ('frequencias', 'documentos-requerimento')
                         OR NEW.bucket_id IN ('frequencias', 'documentos-requerimento'))
      EXECUTE FUNCTION public.trilha_storage('rh');
    CREATE OR REPLACE TRIGGER trilha_rh_storage_delete AFTER DELETE ON storage.objects
      FOR EACH ROW WHEN (OLD.bucket_id IN ('frequencias', 'documentos-requerimento'))
      EXECUTE FUNCTION public.trilha_storage('rh');
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE WARNING 'trilha do Storage do RH NÃO ligada: % (%). Os arquivos de frequencias e documentos-requerimento ficam sem trilha no banco; ver docs/BANCO_DE_DADOS.md',
      SQLERRM, current_user;
  END;
END $$;
