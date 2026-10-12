-- ============================================================================
-- IA DA INSTITUIÇÃO (FASE 1): CONFIGURAÇÃO, CHAVE NO VAULT E REGISTRO DE USO
-- ============================================================================
-- Spec: docs/superpowers/specs/2026-10-11-ia-compras-design.md
-- Plano: docs/superpowers/plans/2026-10-11-ia-compras-fase1.md (Task 1)
--
-- Mesmo desenho de config_envio (migração 20261009150000):
--   ia_config   uma linha só (id = true): liga/desliga, provedor, URL base (só "compatível com OpenAI"),
--               modelo, limite por pessoa por hora, teto mensal de tokens, envio de dados pessoais.
--               NÃO guarda a chave: só o id do segredo no Supabase Vault e os 4 últimos caracteres.
--   ia_uso      uma linha por chamada ao provedor (quem, recurso, tokens, status), SEM o conteúdo do
--               pedido nem da resposta (LGPD: minimização). Gravada só pela Edge Function ia-gateway.
--
--   pode_configurar_ia() / pode_usar_ia() / ia_disponivel()   checagens para policies, RPCs e o front
--   salvar_chave_ia(chave)        grava/troca a chave no Vault. Só escrita: nenhuma RPC devolve a chave ao front.
--   resumo_uso_ia_mes()           chamadas e tokens do mês corrente (tela /admin/ia)
--   ia_config_servidor()          config + chave decifrada + tokens do mês, EXECUTE só para service_role
--
-- Permissões (o papel admin passa por cima em has_permission_code):
--   ia.usar        (módulo compras) usar o assistente de IA; exige também o módulo compras
--   ia.configurar  (módulo admin)   configurar a IA, gravar a chave e ver o uso
--
-- A IA nasce desligada (ativo = false) e só pode ser ligada com provedor, modelo e chave.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Permissões
-- ----------------------------------------------------------------------------
INSERT INTO public.module_permissions_catalog
  (module_code, permission_code, label, category, action_type, sort_order)
VALUES
  ('compras', 'ia.usar', 'Usar assistente de IA', 'IA', 'usar', 603),
  ('admin', 'ia.configurar', 'Configurar IA da instituição', 'IA', 'configurar', 514)
ON CONFLICT (permission_code) DO NOTHING;

-- Perfil ativo + permissão (usado pelas policies, pelas RPCs e pela Edge Function com o cliente da pessoa).
CREATE OR REPLACE FUNCTION public.pode_configurar_ia()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.perfil_ativo_atual()
     AND public.has_permission_code(auth.uid(), 'ia.configurar');
$$;

REVOKE ALL ON FUNCTION public.pode_configurar_ia() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pode_configurar_ia() TO authenticated;

-- Usar a IA exige o módulo compras E a permissão ia.usar (a permissão avulsa sem o módulo não basta).
CREATE OR REPLACE FUNCTION public.pode_usar_ia()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.perfil_ativo_atual()
     AND public.can_access_module(auth.uid(), 'compras')
     AND public.has_permission_code(auth.uid(), 'ia.usar');
$$;

REVOKE ALL ON FUNCTION public.pode_usar_ia() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pode_usar_ia() TO authenticated;


-- ----------------------------------------------------------------------------
-- 2. ia_config (linha única)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ia_config (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  ativo boolean NOT NULL DEFAULT false,
  provedor text CHECK (provedor IN ('openai', 'anthropic', 'gemini', 'compativel_openai')),
  -- só para o provedor compatível com OpenAI: https, host sem credencial, sem query nem fragmento
  -- e host com ponto (sem isso https://kong:8000 alcançaria serviços Docker internos da VPS: SSRF)
  -- (a Edge Function ainda recusa IP privado, localhost e afins antes de chamar)
  url_base text CHECK (url_base IS NULL OR (
    char_length(url_base) <= 300
    AND url_base ~ '^https://[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+(:[0-9]{2,5})?(/[A-Za-z0-9._~/-]*)?$'
  )),
  -- digitado pelo administrador (nenhum modelo fixo no código)
  modelo text CHECK (modelo IS NULL OR modelo ~ '^[A-Za-z0-9._:/@-]{1,120}$'),
  limite_chamadas_hora integer NOT NULL DEFAULT 30 CHECK (limite_chamadas_hora BETWEEN 1 AND 1000),
  teto_tokens_mes bigint CHECK (teto_tokens_mes IS NULL OR teto_tokens_mes > 0),   -- nulo = sem teto
  enviar_dados_pessoais boolean NOT NULL DEFAULT false,

  -- chave de API no Vault; o front só sabe SE, QUANDO e os 4 últimos caracteres
  segredo_id uuid,
  segredo_final text CHECK (segredo_final IS NULL OR char_length(segredo_final) = 4),
  segredo_atualizado_em timestamptz,

  updated_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- URL base obrigatória se, e só se, o provedor é o compatível com OpenAI
  CONSTRAINT ia_config_url_base_ck CHECK ((url_base IS NOT NULL) = (provedor IS NOT DISTINCT FROM 'compativel_openai')),
  -- ligar exige provedor, modelo e chave
  CONSTRAINT ia_config_ativo_ck CHECK (NOT ativo OR (provedor IS NOT NULL AND modelo IS NOT NULL AND segredo_id IS NOT NULL))
);

COMMENT ON TABLE public.ia_config IS
  'Configuração da IA da instância (linha única). A chave de API fica no Vault (segredo_id), nunca legível pela API.';

ALTER TABLE public.ia_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY ia_config_select ON public.ia_config
  FOR SELECT TO authenticated
  USING ((SELECT public.pode_configurar_ia()));

CREATE POLICY ia_config_insert ON public.ia_config
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.pode_configurar_ia()));

CREATE POLICY ia_config_update ON public.ia_config
  FOR UPDATE TO authenticated
  USING ((SELECT public.pode_configurar_ia()))
  WITH CHECK ((SELECT public.pode_configurar_ia()));

-- Sem DELETE: desligar a IA é `ativo = false`.
-- segredo_* não são graváveis pela API (só por salvar_chave_ia) e segredo_id nem é legível.
REVOKE ALL ON public.ia_config FROM anon, authenticated;
GRANT SELECT (
  id, ativo, provedor, url_base, modelo, limite_chamadas_hora, teto_tokens_mes, enviar_dados_pessoais,
  segredo_final, segredo_atualizado_em, updated_by, created_at, updated_at
) ON public.ia_config TO authenticated;
GRANT INSERT (
  id, ativo, provedor, url_base, modelo, limite_chamadas_hora, teto_tokens_mes, enviar_dados_pessoais
) ON public.ia_config TO authenticated;
GRANT UPDATE (
  ativo, provedor, url_base, modelo, limite_chamadas_hora, teto_tokens_mes, enviar_dados_pessoais
) ON public.ia_config TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.ia_config TO service_role;

-- Autoria e datas não são escolhidas pelo cliente. Trocar o provedor ou a URL base apaga o vínculo com a
-- chave e desliga a IA: sem isso, quem pode editar apontaria a URL para um servidor próprio e receberia a
-- chave gravada no cabeçalho da próxima chamada (a chave deixaria de ser só escrita).
CREATE OR REPLACE FUNCTION public.fixar_autoria_ia_config()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_by := auth.uid();
  NEW.updated_at := now();
  IF TG_OP = 'INSERT' THEN
    NEW.created_at := now();
  ELSE
    NEW.created_at := OLD.created_at;
    IF NEW.provedor IS DISTINCT FROM OLD.provedor
       OR NEW.url_base IS DISTINCT FROM OLD.url_base THEN
      NEW.segredo_id := NULL;
      NEW.segredo_final := NULL;
      NEW.segredo_atualizado_em := NULL;
      NEW.ativo := false;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.fixar_autoria_ia_config() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_ia_config_autoria
  BEFORE INSERT OR UPDATE ON public.ia_config
  FOR EACH ROW EXECUTE FUNCTION public.fixar_autoria_ia_config();


-- ----------------------------------------------------------------------------
-- 3. ia_uso (registro de cada chamada, sem conteúdo)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ia_uso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  recurso text NOT NULL CHECK (recurso ~ '^[a-z0-9_]{2,40}$'),   -- 'cpsi', 'testar', ...
  provedor text NOT NULL,
  modelo text NOT NULL,
  tokens_entrada integer NOT NULL DEFAULT 0 CHECK (tokens_entrada >= 0),
  tokens_saida integer NOT NULL DEFAULT 0 CHECK (tokens_saida >= 0),
  tokens_estimados boolean NOT NULL DEFAULT false,   -- o provedor não informou: contado por caracteres/4
  status text NOT NULL CHECK (status IN ('ok', 'erro', 'cortado')),
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.ia_uso IS
  'Uma linha por chamada de IA (sem prompt nem resposta). Gravada só pela Edge Function ia-gateway (service role).';

CREATE INDEX IF NOT EXISTS idx_ia_uso_created_at ON public.ia_uso (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ia_uso_user_id ON public.ia_uso (user_id);

ALTER TABLE public.ia_uso ENABLE ROW LEVEL SECURITY;

-- Trilha só de acréscimo: quem configura a IA lê; ninguém escreve pela API.
CREATE POLICY ia_uso_select ON public.ia_uso
  FOR SELECT TO authenticated
  USING ((SELECT public.pode_configurar_ia()));

REVOKE ALL ON public.ia_uso FROM anon, authenticated;
GRANT SELECT ON public.ia_uso TO authenticated;
GRANT SELECT, INSERT ON public.ia_uso TO service_role;


-- ----------------------------------------------------------------------------
-- 4. Funções
-- ----------------------------------------------------------------------------
-- IA ligada E a pessoa pode usar: o front esconde os botões de IA quando false.
CREATE OR REPLACE FUNCTION public.ia_disponivel()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.pode_usar_ia()
     AND coalesce((SELECT c.ativo FROM public.ia_config c WHERE c.id), false);
$$;

REVOKE ALL ON FUNCTION public.ia_disponivel() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ia_disponivel() TO authenticated;

-- Grava/troca a chave no Vault. plpgsql (e não sql) de propósito: o corpo só é resolvido na execução,
-- então a migração não depende do schema vault existir no momento em que roda.
CREATE OR REPLACE FUNCTION public.salvar_chave_ia(p_chave text)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_nome constant text := 'ia_chave_api';
  v_agora timestamptz := now();
BEGIN
  IF NOT public.pode_configurar_ia() THEN
    RAISE EXCEPTION 'Sem permissão para configurar a IA' USING ERRCODE = '42501';
  END IF;
  IF p_chave IS NULL OR char_length(p_chave) < 8 OR char_length(p_chave) > 4096
     OR p_chave ~ '^[[:space:]]' OR p_chave ~ '[[:space:]]$' THEN
    RAISE EXCEPTION 'Chave inválida: de 8 a 4096 caracteres, sem espaço no começo ou no fim' USING ERRCODE = '22023';
  END IF;

  -- Exige a configuração salva antes: trocar o provedor depois apagaria a chave (trigger acima).
  SELECT segredo_id INTO v_id FROM public.ia_config
   WHERE id AND provedor IS NOT NULL
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Salve o provedor da IA antes de gravar a chave' USING ERRCODE = '22023';
  END IF;

  -- vínculo apagado (troca de provedor/URL) mas segredo ainda no Vault: reaproveita pelo nome (que é único)
  IF v_id IS NULL THEN
    SELECT s.id INTO v_id FROM vault.secrets s WHERE s.name = v_nome;
  END IF;

  IF v_id IS NULL THEN
    v_id := vault.create_secret(p_chave, v_nome, 'Chave de API do provedor de IA');
  ELSE
    PERFORM vault.update_secret(v_id, p_chave);
  END IF;

  UPDATE public.ia_config
     SET segredo_id = v_id, segredo_final = right(p_chave, 4), segredo_atualizado_em = v_agora
   WHERE id;

  RETURN v_agora;
END;
$$;

REVOKE ALL ON FUNCTION public.salvar_chave_ia(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.salvar_chave_ia(text) TO authenticated;

-- Uso do mês corrente para a tela de configuração. O mês é contado em UTC
-- (date_trunc('month', now(), 'UTC')), o mesmo corte que ia_config_servidor() usa para o teto mensal.
CREATE OR REPLACE FUNCTION public.resumo_uso_ia_mes()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v jsonb;
BEGIN
  IF NOT public.pode_configurar_ia() THEN
    RAISE EXCEPTION 'Sem permissão para ver o uso da IA' USING ERRCODE = '42501';
  END IF;
  SELECT jsonb_build_object(
           'chamadas', count(*),
           'tokens_entrada', coalesce(sum(u.tokens_entrada), 0),
           'tokens_saida', coalesce(sum(u.tokens_saida), 0),
           'teto_tokens_mes', (SELECT c.teto_tokens_mes FROM public.ia_config c WHERE c.id))
    INTO v
    FROM public.ia_uso u
   WHERE u.created_at >= date_trunc('month', now(), 'UTC');
  RETURN v;
END;
$$;

REVOKE ALL ON FUNCTION public.resumo_uso_ia_mes() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resumo_uso_ia_mes() TO authenticated;

-- Config + chave decifrada + tokens do mês (UTC) para a Edge Function ia-gateway. Nunca exposta a
-- anon/authenticated. NULL quando a IA nunca foi configurada.
CREATE OR REPLACE FUNCTION public.ia_config_servidor()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cfg public.ia_config%ROWTYPE;
  v_chave text;
  v_tokens bigint;
BEGIN
  SELECT * INTO v_cfg FROM public.ia_config WHERE id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  IF v_cfg.segredo_id IS NOT NULL THEN
    SELECT d.decrypted_secret INTO v_chave FROM vault.decrypted_secrets d WHERE d.id = v_cfg.segredo_id;
  END IF;
  SELECT coalesce(sum(u.tokens_entrada::bigint + u.tokens_saida), 0) INTO v_tokens
    FROM public.ia_uso u
   WHERE u.created_at >= date_trunc('month', now(), 'UTC');
  RETURN (to_jsonb(v_cfg) - 'segredo_id') || jsonb_build_object('chave', v_chave, 'tokens_mes', v_tokens);
END;
$$;

REVOKE ALL ON FUNCTION public.ia_config_servidor() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ia_config_servidor() TO service_role;
