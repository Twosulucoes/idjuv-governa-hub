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
--   4. log_audit e registrar_evento: o cliente não forja linha de arquivo (entity_type storage.*) nem o servidor dono
--      do arquivo (metadados.servidor_alvo_id); mesmo texto do overlay/18 (log_audit)
--
-- CREATE INDEX comum, e não CONCURRENTLY: o CI aplica com `supabase db push`, que roda cada migração numa transação,
-- e CREATE INDEX CONCURRENTLY não roda dentro de transação (o arquivo falharia). Travas em audit_logs até o COMMIT da
-- migração: o CREATE INDEX pega SHARE (toda gravação na trilha, ou seja, todo lançamento auditado, espera) e o DROP
-- INDEX dos índices antigos pega ACCESS EXCLUSIVE (a partir dele, também as LEITURAS da trilha esperam). Hoje a tabela
-- é pequena (banco novo da VPS) e a espera é de segundos. Se ela crescer antes do merge, crie os índices à mão ANTES,
-- com CREATE INDEX CONCURRENTLY e as mesmas colunas (fora de transação), e apague os antigos com DROP INDEX
-- CONCURRENTLY; esta migração reconhece o equivalente, não cria outro e só apaga o que ainda existir.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Índices de audit_logs
-- ----------------------------------------------------------------------------
-- Consultas da tela (E2), todas na ordem `sequencia DESC` (paginação por cursor: sequencia < último visto): histórico
-- de um registro (entity_type + entity_id), o que um servidor lançou (servidor_id), a trilha de um módulo
-- (/rh/auditoria) e a de um usuário. O período ("timestamp") fica como filtro: sequencia acompanha o tempo de
-- gravação, então a leitura para logo depois de sair do período pedido.
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
    ('idx_audit_logs_modulo_seq',    'module_name, sequencia DESC'),
    ('idx_audit_logs_usuario_seq',   'user_id, sequencia DESC')
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
-- audit_logs.user_id -> auth.users; idx_audit_logs_usuario_seq começa por user_id e continua cobrindo.
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
-- tabela, e o período quando a primeira pasta é AAAA-MM. Extensão só de LISTA FECHADA (os tipos que os buckets do RH
-- recebem e os de escritório: pdf, png, jpg/jpeg, webp, zip, doc/docx, odt, xls/xlsx, csv; sem diferença de caixa): um
-- sufixo livre (`<uuid>.MariaSouza`) não sai em claro nem como extensão (só o sha256). Nunca devolve erro; nome nulo
-- vira caminho nulo.
CREATE OR REPLACE FUNCTION public.trilha_storage_chave(p_bucket text, p_nome text)
RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE
  u constant text := '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';
  ext constant text := '(pdf|png|jpe?g|webp|zip|docx?|odt|xlsx?|csv)';
  v jsonb;
BEGIN
  v := jsonb_build_object('bucket', p_bucket);
  IF p_nome IS NULL THEN
    RETURN v || jsonb_build_object('caminho', NULL);
  END IF;
  v := v || jsonb_build_object(
    'caminho', CASE WHEN p_nome ~* ('^((' || u || '|[0-9]{4}-[0-9]{2})/)*' || u || '(\.' || ext || ')?$')
                    THEN p_nome END,
    'caminho_sha256', encode(sha256(convert_to(p_nome, 'UTF8')), 'hex'));
  IF p_nome ~ '^[0-9]{4}-[0-9]{2}/' THEN
    v := v || jsonb_build_object('periodo', left(p_nome, 7));
  END IF;
  IF p_nome ~* ('\.' || ext || '$') THEN
    v := v || jsonb_build_object('extensao', lower(substring(p_nome FROM ('(?i)\.' || ext || '$'))));
  END IF;
  RETURN v;
END;
$$;
COMMENT ON FUNCTION public.trilha_storage_chave(text, text) IS
  'Chave de um objeto do Storage para a trilha: bucket, caminho só quando é feito de uuid/AAAA-MM com extensão da lista fechada, sha256 do caminho, período e extensão';

-- Trigger de storage.objects: gravação (action 'upload'), troca ou movimentação ('update') e exclusão ('delete') de
-- um objeto viram uma linha em audit_logs, no módulo do argumento (fn: trilha_storage('rh')), com entity_type
-- 'storage.<bucket>' e entity_id = storage.objects.id. Quem agiu vem de trilha_contexto() (E1): usuário do JWT que a
-- Storage API repassa ao banco, servidor vinculado (retrato), origem (`sistema` para a service role), papel, unidade,
-- IP e user agent de request.headers. Sem conteúdo do arquivo e sem antes/depois: em metadata vão a chave
-- (trilha_storage_chave), o tamanho e o tipo informados pela Storage API (metadata.size/mimetype; o tipo vem do
-- Content-Type do cliente e só entra no formato tipo/subtipo, sem parâmetros nem texto livre), a operação da
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
      'tipo_conteudo', CASE WHEN lower(v_obj -> 'metadata' ->> 'mimetype') ~ '^[a-z0-9.+-]{1,50}/[a-z0-9.+-]{1,50}$'
                            THEN lower(v_obj -> 'metadata' ->> 'mimetype') END,
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

-- ----------------------------------------------------------------------------
-- 4. log_audit e registrar_evento: o cliente não forja linha de arquivo nem o servidor dono do arquivo
-- ----------------------------------------------------------------------------
-- A trilha do Storage (bloco 2) grava metadata.fonte = 'storage' e metadata.servidor_alvo_id (o servidor dono do
-- arquivo), que a aba de histórico usa para pôr a linha na ficha do servidor. As duas RPCs que recebem metadados do
-- cliente já tiram `fonte` (e gravam a própria); agora tiram também `servidor_alvo_id`, e log_audit recusa entity_type
-- storage.* (22023). registrar_evento já tem lista fechada de entidade (sem storage.*). Fora isso, o texto é o da E1
-- (20261011000000), com a mesma assinatura e os mesmos privilégios; log_audit é o mesmo texto do overlay/18.
CREATE OR REPLACE FUNCTION public.registrar_evento(
  p_acao text,
  p_entidade text,
  p_entidade_id uuid DEFAULT NULL,
  p_descricao text DEFAULT NULL,
  p_metadados jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_id uuid;
BEGIN
  IF v_uid IS NULL OR NOT public.is_active_user() THEN
    RAISE EXCEPTION 'registrar_evento: usuário não autenticado ou inativo' USING ERRCODE = '42501';
  END IF;
  IF p_acao IS NULL OR p_acao NOT IN ('view', 'export', 'download') THEN
    RAISE EXCEPTION 'registrar_evento: ação fora da lista (view, export, download; imprimir = download): %',
      left(coalesce(p_acao, '(nula)'), 40) USING ERRCODE = '22023';
  END IF;
  IF p_entidade IS NULL OR p_entidade <> ALL (ARRAY[
      -- tabelas do RH (as mesmas do bloco 8 e as duas de trilha)
      'adicionais_tempo_servico', 'agrupamento_unidade_vinculo', 'banco_horas', 'bancos_cnab',
      'cargo_unidade_compatibilidade', 'cargos', 'cessoes', 'composicao_cargos', 'config_agrupamento_unidades',
      'config_assinatura_frequencia', 'config_autarquia', 'config_compensacao', 'config_fechamento_folha',
      'config_fechamento_frequencia', 'config_incidencias', 'config_institucional', 'config_jornada_padrao',
      'config_motivos_desligamento', 'config_regras_calculo', 'config_rubricas', 'config_situacoes_funcionais',
      'config_tipos_ato', 'config_tipos_onus', 'config_tipos_rubrica', 'config_tipos_servidor', 'configuracao_jornada',
      'consignacoes', 'contas_autarquia', 'dependentes_irrf', 'designacoes', 'dias_nao_uteis', 'documentos',
      'documentos_requerimento_servidor', 'eventos_esocial', 'exportacoes_folha', 'feriados', 'ferias_servidor',
      'fichas_financeiras', 'folha_historico_status', 'folhas_pagamento', 'frequencia_arquivos',
      'frequencia_fechamento', 'frequencia_mensal', 'frequencia_pacotes', 'historico_funcional', 'horarios_jornada',
      'itens_ficha_financeira', 'itens_retorno_bancario', 'justificativas_ponto', 'lancamentos_banco_horas',
      'lancamentos_folha', 'licencas_afastamentos', 'lotacoes', 'memorandos_lotacao', 'nomeacoes_chefe_unidade',
      'ocorrencias_servidor', 'parametros_folha', 'pensoes_alimenticias', 'portarias_servidor', 'pre_cadastros',
      'provimentos', 'regimes_trabalho', 'registros_ponto', 'remessas_bancarias', 'retornos_bancarios', 'rubricas',
      'rubricas_historico', 'servidor_regime', 'servidor_tag_vinculos', 'servidor_tags', 'servidores',
      'solicitacoes_abono', 'solicitacoes_ajuste_ponto', 'tabela_inss', 'tabela_irrf', 'tipos_abono',
      'viagens_diarias', 'vinculos_funcionais', 'vinculos_servidor',
      -- documentos e consultas que não são uma tabela
      'contracheque', 'relatorio_rh', 'exportacao_rh', 'arquivo_esocial', 'arquivo_cnab', 'trilha_auditoria'
    ]) THEN
    RAISE EXCEPTION 'registrar_evento: entidade fora da lista: %', left(coalesce(p_entidade, '(nula)'), 60)
      USING ERRCODE = '22023';
  END IF;
  IF p_metadados IS NOT NULL AND (jsonb_typeof(p_metadados) <> 'object' OR length(p_metadados::text) > 4000) THEN
    RAISE EXCEPTION 'registrar_evento: metadados devem ser um objeto JSON de até 4000 caracteres' USING ERRCODE = '22023';
  END IF;
  IF NOT public.can_access_module(v_uid, 'rh') THEN
    IF p_entidade <> 'contracheque' OR p_entidade_id IS NULL
       OR NOT EXISTS (SELECT 1 FROM public.fichas_financeiras f
                       WHERE f.id = p_entidade_id AND public.eh_meu_servidor(f.servidor_id)) THEN
      RAISE EXCEPTION 'registrar_evento: sem o módulo rh, só o próprio contracheque' USING ERRCODE = '42501';
    END IF;
  END IF;

  INSERT INTO public.audit_logs (action, entity_type, entity_id, module_name, user_id, description, metadata)
  VALUES (p_acao::public.audit_action, p_entidade, p_entidade_id, 'rh', v_uid, left(p_descricao, 500),
          (coalesce(p_metadados, '{}'::jsonb) - ARRAY['trigger', 'operation', 'table', 'fonte', 'servidor_alvo_id'])
            || jsonb_build_object('registrar_evento', true, 'fonte', 'registrar_evento'))
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
COMMENT ON FUNCTION public.registrar_evento(text, text, uuid, text, jsonb) IS
  'Registra na trilha do RH uma ação sem gravação (view, export, download; imprimir = download) sobre entidade de lista fechada';

CREATE OR REPLACE FUNCTION public.log_audit(_action audit_action, _entity_type character varying DEFAULT NULL::character varying, _entity_id uuid DEFAULT NULL::uuid, _module_name character varying DEFAULT NULL::character varying, _before_data jsonb DEFAULT NULL::jsonb, _after_data jsonb DEFAULT NULL::jsonb, _description text DEFAULT NULL::text, _metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _log_id UUID;
  _user_role app_role;
  _user_org_unit UUID;
  _meta jsonb;
BEGIN
  -- perfil bloqueado/inexistente não grava (a sessão do Auth dele pode continuar válida). Sem usuário
  -- (service role, ou registrar_denuncia_publica chamada por anon) segue como antes.
  IF auth.uid() IS NOT NULL AND NOT public.is_active_user() THEN
    RAISE EXCEPTION 'Usuário inativo' USING ERRCODE = '42501';
  END IF;
  IF lower(btrim(coalesce(_module_name, ''))) = 'rh' THEN
    IF _action::text NOT IN ('view', 'export', 'download') THEN
      RAISE EXCEPTION 'log_audit: no módulo rh só view, export e download (lançamentos entram pela trilha do banco)'
        USING ERRCODE = '22023';
    END IF;
    IF _before_data IS NOT NULL OR _after_data IS NOT NULL THEN
      RAISE EXCEPTION 'log_audit: no módulo rh a linha não leva antes/depois' USING ERRCODE = '22023';
    END IF;
  END IF;
  -- linha de arquivo do Storage (entity_type storage.<bucket>) só vem do trigger trilha_storage (E2)
  IF lower(btrim(coalesce(_entity_type, ''))) LIKE 'storage.%' THEN
    RAISE EXCEPTION 'log_audit: entity_type storage.* é gravado só pelo banco (trilha do Storage)' USING ERRCODE = '22023';
  END IF;
  IF length(coalesce(_before_data::text, '')) > 32768 OR length(coalesce(_after_data::text, '')) > 32768
     OR length(coalesce(_metadata::text, '')) > 32768 THEN
    RAISE EXCEPTION 'log_audit: antes, depois e metadados têm limite de 32 KB cada' USING ERRCODE = '22023';
  END IF;
  _meta := CASE WHEN _metadata IS NULL THEN '{}'::jsonb
                WHEN jsonb_typeof(_metadata) = 'object' THEN _metadata
                ELSE jsonb_build_object('valor', _metadata) END;
  _meta := (_meta - ARRAY['trigger', 'operation', 'table', 'registrar_evento', 'fonte', 'servidor_alvo_id'])
           || jsonb_build_object('fonte', 'log_audit');

  SELECT role INTO _user_role 
  FROM public.user_roles 
  WHERE user_id = auth.uid() 
  LIMIT 1;
  
  SELECT unidade_id INTO _user_org_unit
  FROM public.user_org_units
  WHERE user_id = auth.uid() AND is_primary = true
  LIMIT 1;
  
  INSERT INTO public.audit_logs (
    user_id, action, entity_type, entity_id, module_name,
    before_data, after_data, description, metadata,
    role_at_time, org_unit_id
  )
  VALUES (
    auth.uid(), _action, _entity_type, _entity_id, _module_name,
    _before_data, _after_data, _description, _meta,
    _user_role, _user_org_unit
  )
  RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.registrar_evento(text, text, uuid, text, jsonb) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.registrar_evento(text, text, uuid, text, jsonb) TO authenticated;
