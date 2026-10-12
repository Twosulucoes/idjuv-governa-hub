-- ============================================================================
-- Pré-cadastro público — acesso por token secreto, sem abrir a tabela ao anônimo (item 2 da auditoria)
-- ============================================================================
-- Problema: /curriculo roda como anon e anon não tem grant em pre_cadastros (o formulário não gravava); o código de
-- acesso é sequencial (PC-AAAA-nnnn, adivinhável); a verificação de CPF lia servidores/pre_cadastros direto (devolvia nome,
-- matrícula e código de quem tivesse o CPF).
-- Desenho (docs/superpowers/specs/2026-10-12-pre-cadastro-publico-design.md): o candidato recebe um TOKEN de 122 bits (UUID aleatório) e
-- só enxerga e grava o próprio rascunho, por quatro funções SECURITY DEFINER (anon só executa estas). A tabela, a RLS e
-- os privilégios de anon NÃO mudam. Deviation do desenho: funções no banco em vez de Edge Function (mesmas garantias,
-- testáveis em SQL, sem infraestrutura nova); limite de criação por IP guardado na própria linha (sem tabela nova).
--   * pre_cadastro_publico_criar(dados)     cria o rascunho; devolve token e código. Não revela se o CPF já existe
--   * pre_cadastro_publico_obter(token)     devolve o próprio rascunho
--   * pre_cadastro_publico_salvar(token, dados)  só campos permitidos e só enquanto for rascunho
--   * pre_cadastro_publico_enviar(token)    rascunho -> enviado (exige os campos obrigatórios)
-- Erros HTTP limpos pelo PostgREST: PT404 link inválido/expirado, PT409 já enviado, PT429 limite de uso.
-- Token vale 30 dias sem uso (renovado a cada gravação). Limite: 20 criações por hora por IP.
-- Aprovação, rejeição, conversão e observações são do RH (RLS atual). Gravações entram na trilha (origem anonimo) com protocolo.
-- Idempotente.
-- ============================================================================

ALTER TABLE public.pre_cadastros
  ADD COLUMN IF NOT EXISTS token_acesso text,
  ADD COLUMN IF NOT EXISTS token_expira_em timestamptz,
  ADD COLUMN IF NOT EXISTS criado_ip_hash text;
CREATE UNIQUE INDEX IF NOT EXISTS pre_cadastros_token_acesso_uk ON public.pre_cadastros (token_acesso) WHERE token_acesso IS NOT NULL;
CREATE INDEX IF NOT EXISTS pre_cadastros_ip_hash_idx ON public.pre_cadastros (criado_ip_hash, created_at) WHERE criado_ip_hash IS NOT NULL;

-- todo pré-cadastro nasce com token (inclusive os criados pelo RH)
CREATE OR REPLACE FUNCTION public.pre_cadastros_gerar_token()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.token_acesso IS NULL THEN
    -- gen_random_uuid() é nativo (sem extensão) e vem do gerador criptográfico do servidor: 122 bits de entropia
    NEW.token_acesso := replace(gen_random_uuid()::text, '-', '');
  END IF;
  IF NEW.token_expira_em IS NULL THEN
    NEW.token_expira_em := now() + interval '30 days';
  END IF;
  RETURN NEW;
END;
$function$;
DROP TRIGGER IF EXISTS trg_pre_cadastros_gerar_token ON public.pre_cadastros;
CREATE TRIGGER trg_pre_cadastros_gerar_token
  BEFORE INSERT ON public.pre_cadastros
  FOR EACH ROW EXECUTE FUNCTION public.pre_cadastros_gerar_token();

-- colunas que o candidato pode preencher: todas, menos as do RH, as de controle e as de autoria
CREATE OR REPLACE FUNCTION public.pre_cadastro_publico_colunas()
 RETURNS text[]
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT coalesce(array_agg(column_name::text ORDER BY ordinal_position), '{}')
    FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'pre_cadastros'
     AND column_name <> ALL (ARRAY['id', 'codigo_acesso', 'status', 'observacoes', 'ip_envio', 'data_envio', 'servidor_id',
                                   'convertido_em', 'convertido_por', 'created_at', 'updated_at', 'created_by',
                                   'created_by_servidor_id', 'updated_by', 'updated_by_servidor_id', 'token_acesso',
                                   'token_expira_em', 'criado_ip_hash']);
$function$;

CREATE OR REPLACE FUNCTION public.pre_cadastro_publico_filtrar(p_dados jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_cols text[] := public.pre_cadastro_publico_colunas();
BEGIN
  IF p_dados IS NULL OR jsonb_typeof(p_dados) <> 'object' THEN
    RAISE EXCEPTION 'Dados inválidos' USING ERRCODE = '22023';
  END IF;
  IF length(p_dados::text) > 60000 THEN
    RAISE EXCEPTION 'Dados grandes demais' USING ERRCODE = '22023';
  END IF;
  RETURN coalesce((SELECT jsonb_object_agg(k, v) FROM jsonb_each(p_dados) AS e(k, v) WHERE k = ANY (v_cols)), '{}'::jsonb);
END;
$function$;

-- localiza o rascunho do token (token errado e expirado respondem igual)
CREATE OR REPLACE FUNCTION public.pre_cadastro_publico_buscar(p_token text, p_bloquear boolean DEFAULT false)
 RETURNS public.pre_cadastros
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_row public.pre_cadastros;
BEGIN
  IF p_token IS NULL OR p_token !~ '^[0-9a-f]{32}$' THEN
    RAISE EXCEPTION 'Link inválido ou expirado' USING ERRCODE = 'PT404';
  END IF;
  IF p_bloquear THEN
    SELECT * INTO v_row FROM public.pre_cadastros WHERE token_acesso = p_token AND token_expira_em > now() FOR UPDATE;
  ELSE
    SELECT * INTO v_row FROM public.pre_cadastros WHERE token_acesso = p_token AND token_expira_em > now();
  END IF;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Link inválido ou expirado' USING ERRCODE = 'PT404';
  END IF;
  RETURN v_row;
END;
$function$;

CREATE OR REPLACE FUNCTION public.pre_cadastro_publico_criar(p_dados jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_dados jsonb := public.pre_cadastro_publico_filtrar(p_dados);
  v_ip text := (SELECT ip::text FROM public.trilha_contexto_requisicao());
  v_hash text := md5('pc|' || coalesce(v_ip, 'sem-ip'));
  v_cols text;
  v_codigo text;
  v_token text;
  v_tentativa int := 0;
BEGIN
  IF coalesce(btrim(v_dados ->> 'nome_completo'), '') = '' OR coalesce(btrim(v_dados ->> 'email'), '') NOT LIKE '%_@_%'
     OR length(regexp_replace(coalesce(v_dados ->> 'cpf', ''), '\D', '', 'g')) <> 11 THEN
    RAISE EXCEPTION 'Informe nome, CPF (11 dígitos) e e-mail válidos' USING ERRCODE = '22023';
  END IF;
  IF (SELECT count(*) FROM public.pre_cadastros WHERE criado_ip_hash = v_hash AND created_at > now() - interval '1 hour') >= 20 THEN
    RAISE EXCEPTION 'Muitas solicitações deste endereço. Tente novamente mais tarde.' USING ERRCODE = 'PT429';
  END IF;

  SELECT string_agg(format('%I', k), ', ') INTO v_cols FROM jsonb_object_keys(v_dados) k;
  LOOP
    v_codigo := public.gerar_codigo_pre_cadastro();
    BEGIN
      EXECUTE format(
        'INSERT INTO public.pre_cadastros (%s, codigo_acesso, status, criado_ip_hash)
           SELECT %s, $2, ''rascunho'', $3 FROM jsonb_populate_record(NULL::public.pre_cadastros, $1)
         RETURNING token_acesso', v_cols, v_cols)
        INTO v_token USING v_dados, v_codigo, v_hash;
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      -- código sequencial disputado por dois candidatos ao mesmo tempo: tenta o próximo
      v_tentativa := v_tentativa + 1;
      IF v_tentativa >= 5 THEN RAISE; END IF;
    END;
  END LOOP;
  RETURN jsonb_build_object('token', v_token, 'codigo', v_codigo);
END;
$function$;

CREATE OR REPLACE FUNCTION public.pre_cadastro_publico_obter(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_row public.pre_cadastros := public.pre_cadastro_publico_buscar(p_token);
BEGIN
  -- sem id, IP, autoria, servidor, token nem a anotação do RH (esta só aparece quando o pré-cadastro foi rejeitado)
  RETURN to_jsonb(v_row)
         - ARRAY['id', 'ip_envio', 'servidor_id', 'convertido_em', 'convertido_por', 'created_by',
                 'created_by_servidor_id', 'updated_by', 'updated_by_servidor_id', 'token_acesso', 'criado_ip_hash',
                 'observacoes']
         || CASE WHEN v_row.status = 'rejeitado' THEN jsonb_build_object('motivo_rejeicao', v_row.observacoes) ELSE '{}'::jsonb END;
END;
$function$;

CREATE OR REPLACE FUNCTION public.pre_cadastro_publico_salvar(p_token text, p_dados jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_row public.pre_cadastros := public.pre_cadastro_publico_buscar(p_token, true);
  v_dados jsonb := public.pre_cadastro_publico_filtrar(p_dados);
  v_set text;
BEGIN
  IF v_row.status <> 'rascunho' THEN
    RAISE EXCEPTION 'Este pré-cadastro já foi enviado e não pode mais ser alterado' USING ERRCODE = 'PT409';
  END IF;
  IF v_dados ? 'cpf' AND length(regexp_replace(coalesce(v_dados ->> 'cpf', ''), '\D', '', 'g')) <> 11 THEN
    RAISE EXCEPTION 'CPF deve ter 11 dígitos' USING ERRCODE = '22023';
  END IF;
  SELECT string_agg(format('%I = r.%I', k, k), ', ') INTO v_set FROM jsonb_object_keys(v_dados) k;
  IF v_set IS NOT NULL THEN
    EXECUTE format(
      'UPDATE public.pre_cadastros p SET %s, token_expira_em = now() + interval ''30 days'', updated_at = now()
         FROM jsonb_populate_record(NULL::public.pre_cadastros, $1) r WHERE p.id = $2', v_set)
      USING v_dados, v_row.id;
  END IF;
  RETURN jsonb_build_object('ok', true);
END;
$function$;

CREATE OR REPLACE FUNCTION public.pre_cadastro_publico_enviar(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_row public.pre_cadastros := public.pre_cadastro_publico_buscar(p_token, true);
  v_ip text := (SELECT ip::text FROM public.trilha_contexto_requisicao());
BEGIN
  IF v_row.status <> 'rascunho' THEN
    RAISE EXCEPTION 'Este pré-cadastro já foi enviado' USING ERRCODE = 'PT409';
  END IF;
  IF coalesce(btrim(v_row.nome_completo), '') = '' OR coalesce(btrim(v_row.email), '') = ''
     OR length(regexp_replace(coalesce(v_row.cpf, ''), '\D', '', 'g')) <> 11
     OR v_row.data_nascimento IS NULL OR coalesce(btrim(v_row.telefone_celular), '') = '' THEN
    RAISE EXCEPTION 'Preencha nome, CPF, e-mail, data de nascimento e celular antes de enviar' USING ERRCODE = '22023';
  END IF;
  UPDATE public.pre_cadastros SET status = 'enviado', data_envio = now(), ip_envio = v_ip, updated_at = now()
   WHERE id = v_row.id;
  RETURN jsonb_build_object('ok', true, 'codigo', v_row.codigo_acesso);
END;
$function$;

-- ---------------------------------------------------------------------------
-- privilégios: o anônimo só executa as quatro funções de uso público; o apoio fica interno
-- ---------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.pre_cadastros_gerar_token() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.pre_cadastro_publico_colunas() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.pre_cadastro_publico_filtrar(jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.pre_cadastro_publico_buscar(text, boolean) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.pre_cadastro_publico_criar(jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.pre_cadastro_publico_obter(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.pre_cadastro_publico_salvar(text, jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.pre_cadastro_publico_enviar(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.pre_cadastro_publico_criar(jsonb) TO anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.pre_cadastro_publico_obter(text) TO anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.pre_cadastro_publico_salvar(text, jsonb) TO anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.pre_cadastro_publico_enviar(text) TO anon, authenticated;
-- a geração do código fica só para dentro das funções (antes o anônimo podia chamá-la)
REVOKE EXECUTE ON FUNCTION public.gerar_codigo_pre_cadastro() FROM anon;

NOTIFY pgrst, 'reload schema';
