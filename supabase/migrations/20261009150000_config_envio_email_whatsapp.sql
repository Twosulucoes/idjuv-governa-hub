-- ============================================================================
-- ENVIO DE E-MAIL E WHATSAPP CONFIGURADO PELO PRÓPRIO CLIENTE
-- ============================================================================
-- Spec: docs/superpowers/specs/2026-10-09-envio-email-whatsapp-design.md
--
--   config_envio   uma linha por canal ('email' | 'whatsapp'): provedor, remetente, SMTP,
--                  identidade visual do e-mail, número/templates do WhatsApp (Meta Cloud API).
--                  NÃO guarda senha nem token: só o id do segredo no Supabase Vault.
--   envios_log     trilha de cada disparo (sem o corpo da mensagem — LGPD: minimização).
--
--   salvar_segredo_envio(canal, segredo)   grava/troca a credencial no Vault. Só escrita: não
--                  existe RPC que devolva o segredo ao front.
--   config_envio_servidor(canal)           config + segredo decifrado, EXECUTE só para
--                  service_role (Edge Functions).
--
-- Permissões (catálogo do módulo admin; o papel admin passa por cima em has_permission_code):
--   admin.envios            ver a tela e o histórico de envios
--   admin.envios.configurar editar a configuração, gravar credenciais e enviar teste
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Permissões
-- ----------------------------------------------------------------------------
INSERT INTO public.module_permissions_catalog
  (module_code, permission_code, label, category, action_type, sort_order)
VALUES
  ('admin', 'admin.envios', 'Visualizar Envio de E-mail e WhatsApp', 'Envios', 'visualizar', 512),
  ('admin', 'admin.envios.configurar', 'Configurar Envio de E-mail e WhatsApp', 'Envios', 'configurar', 513)
ON CONFLICT (permission_code) DO NOTHING;

-- Perfil ativo + permissão (usado pelas policies e pela RPC). perfil_ativo_atual() vem da
-- migração de avisos (20261009120000).
CREATE OR REPLACE FUNCTION public.pode_configurar_envios()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.perfil_ativo_atual()
     AND public.has_permission_code(auth.uid(), 'admin.envios.configurar');
$$;

REVOKE ALL ON FUNCTION public.pode_configurar_envios() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pode_configurar_envios() TO authenticated;

CREATE OR REPLACE FUNCTION public.pode_ver_envios()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.perfil_ativo_atual()
     AND (public.has_permission_code(auth.uid(), 'admin.envios')
          OR public.has_permission_code(auth.uid(), 'admin.envios.configurar'));
$$;

REVOKE ALL ON FUNCTION public.pode_ver_envios() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pode_ver_envios() TO authenticated;


-- ----------------------------------------------------------------------------
-- 2. config_envio
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.config_envio (
  canal text PRIMARY KEY CHECK (canal IN ('email', 'whatsapp')),
  ativo boolean NOT NULL DEFAULT false,
  provedor text CHECK (provedor IN ('smtp', 'resend', 'meta_cloud')),

  -- e-mail: remetente
  remetente_nome text CHECK (remetente_nome IS NULL OR char_length(remetente_nome) <= 120),
  remetente_email text CHECK (remetente_email IS NULL OR remetente_email ~* '^[^@[:space:]<>]+@[^@[:space:]<>]+\.[^@[:space:]<>]+$'),
  responder_para text CHECK (responder_para IS NULL OR responder_para ~* '^[^@[:space:]<>]+@[^@[:space:]<>]+\.[^@[:space:]<>]+$'),
  -- e-mail: SMTP (a senha fica no Vault)
  smtp_host text CHECK (smtp_host IS NULL OR smtp_host ~ '^[A-Za-z0-9.-]{1,253}$'),
  smtp_porta integer CHECK (smtp_porta IS NULL OR smtp_porta IN (25, 465, 587, 2525)),
  smtp_seguranca text CHECK (smtp_seguranca IS NULL OR smtp_seguranca IN ('ssl', 'starttls')),
  smtp_usuario text CHECK (smtp_usuario IS NULL OR char_length(smtp_usuario) <= 255),
  -- e-mail: identidade visual (cabeçalho/rodapé do HTML)
  marca_nome text CHECK (marca_nome IS NULL OR char_length(marca_nome) <= 200),
  marca_logo_url text CHECK (marca_logo_url IS NULL OR (char_length(marca_logo_url) <= 500 AND marca_logo_url ~ '^https://[^[:space:]"''<>]+$')),
  marca_cor text CHECK (marca_cor IS NULL OR marca_cor ~ '^#[0-9A-Fa-f]{6}$'),
  rodape text CHECK (rodape IS NULL OR char_length(rodape) <= 500),

  -- WhatsApp (Meta Cloud API; o token fica no Vault)
  wa_phone_number_id text CHECK (wa_phone_number_id IS NULL OR wa_phone_number_id ~ '^[0-9]{5,30}$'),
  wa_business_account_id text CHECK (wa_business_account_id IS NULL OR wa_business_account_id ~ '^[0-9]{5,30}$'),
  -- templates aprovados na Meta por uso: {"convite_reuniao": {"nome": "...", "idioma": "pt_BR"}}
  wa_templates jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(wa_templates) = 'object'),

  -- credencial (senha SMTP, API key do Resend ou token da Meta) no Vault
  segredo_id uuid,
  segredo_atualizado_em timestamptz,

  updated_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT config_envio_provedor_ck CHECK (
    provedor IS NULL
    OR (canal = 'email' AND provedor IN ('smtp', 'resend'))
    OR (canal = 'whatsapp' AND provedor = 'meta_cloud')
  )
);

COMMENT ON TABLE public.config_envio IS
  'Configuração de envio por canal (e-mail/WhatsApp) da instância. Credenciais ficam no Vault (segredo_id).';

ALTER TABLE public.config_envio ENABLE ROW LEVEL SECURITY;

CREATE POLICY config_envio_select ON public.config_envio
  FOR SELECT TO authenticated
  USING ((SELECT public.pode_ver_envios()));

CREATE POLICY config_envio_insert ON public.config_envio
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.pode_configurar_envios()));

CREATE POLICY config_envio_update ON public.config_envio
  FOR UPDATE TO authenticated
  USING ((SELECT public.pode_configurar_envios()))
  WITH CHECK ((SELECT public.pode_configurar_envios()));

-- Sem DELETE: desligar um canal é `ativo = false`.
-- segredo_id/segredo_atualizado_em não são graváveis pela API (só pela RPC abaixo) e
-- segredo_id nem é legível: o front só sabe SE e QUANDO a credencial foi gravada.
REVOKE ALL ON public.config_envio FROM anon, authenticated;
GRANT SELECT (
  canal, ativo, provedor, remetente_nome, remetente_email, responder_para,
  smtp_host, smtp_porta, smtp_seguranca, smtp_usuario,
  marca_nome, marca_logo_url, marca_cor, rodape,
  wa_phone_number_id, wa_business_account_id, wa_templates,
  segredo_atualizado_em, updated_by, created_at, updated_at
) ON public.config_envio TO authenticated;
GRANT INSERT (
  canal, ativo, provedor, remetente_nome, remetente_email, responder_para,
  smtp_host, smtp_porta, smtp_seguranca, smtp_usuario,
  marca_nome, marca_logo_url, marca_cor, rodape,
  wa_phone_number_id, wa_business_account_id, wa_templates
) ON public.config_envio TO authenticated;
GRANT UPDATE (
  ativo, provedor, remetente_nome, remetente_email, responder_para,
  smtp_host, smtp_porta, smtp_seguranca, smtp_usuario,
  marca_nome, marca_logo_url, marca_cor, rodape,
  wa_phone_number_id, wa_business_account_id, wa_templates
) ON public.config_envio TO authenticated;

-- Autoria e datas não são escolhidas pelo cliente. Trocar provedor ou destino SMTP apaga o
-- vínculo com a credencial: sem isso, quem pode editar apontaria smtp_host para um servidor
-- próprio e receberia a senha gravada no AUTH do teste (a credencial deixaria de ser só escrita).
CREATE OR REPLACE FUNCTION public.fixar_autoria_config_envio()
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
       OR NEW.smtp_host IS DISTINCT FROM OLD.smtp_host
       OR NEW.smtp_porta IS DISTINCT FROM OLD.smtp_porta
       OR NEW.smtp_seguranca IS DISTINCT FROM OLD.smtp_seguranca
       OR NEW.smtp_usuario IS DISTINCT FROM OLD.smtp_usuario THEN
      NEW.segredo_id := NULL;
      NEW.segredo_atualizado_em := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.fixar_autoria_config_envio() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_config_envio_autoria
  BEFORE INSERT OR UPDATE ON public.config_envio
  FOR EACH ROW EXECUTE FUNCTION public.fixar_autoria_config_envio();


-- ----------------------------------------------------------------------------
-- 3. Credencial no Vault
-- ----------------------------------------------------------------------------
-- plpgsql (e não sql) de propósito: o corpo só é resolvido na execução, então a migração
-- não depende do schema vault existir no momento em que roda.
CREATE OR REPLACE FUNCTION public.salvar_segredo_envio(p_canal text, p_segredo text)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_nome text;
  v_agora timestamptz := now();
BEGIN
  IF NOT public.pode_configurar_envios() THEN
    RAISE EXCEPTION 'Sem permissão para configurar envios' USING ERRCODE = '42501';
  END IF;
  IF p_canal NOT IN ('email', 'whatsapp') THEN
    RAISE EXCEPTION 'Canal inválido' USING ERRCODE = '22023';
  END IF;
  IF p_segredo IS NULL OR char_length(btrim(p_segredo)) = 0 OR char_length(p_segredo) > 4096 THEN
    RAISE EXCEPTION 'Credencial vazia ou longa demais' USING ERRCODE = '22023';
  END IF;

  -- Exige a configuração salva antes: trocar o provedor depois apagaria a credencial (trigger acima).
  SELECT segredo_id INTO v_id FROM public.config_envio
   WHERE canal = p_canal AND provedor IS NOT NULL
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Salve a configuração do canal antes de gravar a credencial' USING ERRCODE = '22023';
  END IF;
  v_nome := 'config_envio_' || p_canal;

  -- linha recriada mas segredo antigo ainda no Vault: reaproveita pelo nome (que é único)
  IF v_id IS NULL THEN
    SELECT s.id INTO v_id FROM vault.secrets s WHERE s.name = v_nome;
  END IF;

  IF v_id IS NULL THEN
    v_id := vault.create_secret(p_segredo, v_nome, 'Credencial de envio (' || p_canal || ')');
  ELSE
    PERFORM vault.update_secret(v_id, p_segredo);
  END IF;

  UPDATE public.config_envio
     SET segredo_id = v_id, segredo_atualizado_em = v_agora
   WHERE canal = p_canal;

  RETURN v_agora;
END;
$$;

REVOKE ALL ON FUNCTION public.salvar_segredo_envio(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.salvar_segredo_envio(text, text) TO authenticated;

-- Config + credencial decifrada para as Edge Functions. Nunca exposta a anon/authenticated.
CREATE OR REPLACE FUNCTION public.config_envio_servidor(p_canal text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cfg public.config_envio%ROWTYPE;
  v_segredo text;
BEGIN
  SELECT * INTO v_cfg FROM public.config_envio WHERE canal = p_canal;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  IF v_cfg.segredo_id IS NOT NULL THEN
    SELECT d.decrypted_secret INTO v_segredo FROM vault.decrypted_secrets d WHERE d.id = v_cfg.segredo_id;
  END IF;
  RETURN (to_jsonb(v_cfg) - 'segredo_id') || jsonb_build_object('segredo', v_segredo);
END;
$$;

REVOKE ALL ON FUNCTION public.config_envio_servidor(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.config_envio_servidor(text) TO service_role;


-- ----------------------------------------------------------------------------
-- 4. envios_log
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.envios_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  criado_em timestamptz NOT NULL DEFAULT now(),
  canal text NOT NULL CHECK (canal IN ('email', 'whatsapp')),
  provedor text NOT NULL,
  destinatario text NOT NULL,
  assunto text,                  -- e-mail: assunto; WhatsApp: nome do template
  origem_modulo text NOT NULL,   -- 'reunioes', 'avisos', 'teste', ...
  origem_id uuid,
  status text NOT NULL CHECK (status IN ('enviado', 'falhou')),
  erro text,
  id_externo text,               -- id devolvido pelo provedor
  disparado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.envios_log IS
  'Trilha de disparos de e-mail/WhatsApp (sem corpo da mensagem). Gravada só pelas Edge Functions (service role).';

CREATE INDEX IF NOT EXISTS idx_envios_log_criado_em ON public.envios_log (criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_envios_log_origem ON public.envios_log (origem_modulo, origem_id);

ALTER TABLE public.envios_log ENABLE ROW LEVEL SECURITY;

-- Trilha só de acréscimo: quem tem a permissão lê; ninguém escreve pela API.
CREATE POLICY envios_log_select ON public.envios_log
  FOR SELECT TO authenticated
  USING ((SELECT public.pode_ver_envios()));

REVOKE ALL ON public.envios_log FROM anon, authenticated;
GRANT SELECT ON public.envios_log TO authenticated;
GRANT SELECT, INSERT ON public.envios_log TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.config_envio TO service_role;
