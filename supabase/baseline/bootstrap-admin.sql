-- Promove UM usuário já criado no Auth a administrador ativo (primeiro acesso de um banco vazio).
--
-- Por que existe: handle_new_user cria todo usuário INATIVO e com papel `user`; só um
-- administrador ativa outros — e num banco novo ainda não há administrador.
--
-- Uso (como `postgres`, nunca pelo front; precisa de psql 13 ou mais novo):
--   1. crie o usuário no Auth (Studio > Authentication > Add user, com senha)
--   2. psql "$URL" -v email='pessoa@orgao.gov.br' -f supabase/baseline/bootstrap-admin.sql
--
-- O e-mail é procurado em auth.users (a conta de verdade), não em profiles.email. Idempotente. Recusa se já existir um administrador ativo, para
-- não virar atalho de escalada: nesse caso use o app (Admin > Usuários) ou, sabendo o que faz,
-- `-v forcar=1`. As alterações de papel e perfil entram em audit_logs pelos triggers de auditoria.
-- Não deixe este arquivo ser executado por rotina automática.
\set ON_ERROR_STOP on
\if :{?forcar}
\else
  \set forcar 0
\endif

BEGIN;
SELECT set_config('app.bootstrap_email', :'email', true) AS _ \gset
SELECT set_config('app.bootstrap_forcar', :'forcar', true) AS _ \gset

DO $$
DECLARE
  v_email  text := lower(btrim(current_setting('app.bootstrap_email')));
  v_forcar boolean := current_setting('app.bootstrap_forcar') = '1';
  v_ids    uuid[];
  v_admins integer;
BEGIN
  SELECT array_agg(id) INTO v_ids FROM auth.users WHERE lower(email) = v_email AND email_confirmed_at IS NOT NULL;
  IF v_ids IS NULL THEN
    RAISE EXCEPTION 'nenhum usuário com e-mail CONFIRMADO no Auth para %: crie-o (marcando "Auto Confirm User") antes', v_email;
  ELSIF array_length(v_ids, 1) > 1 THEN
    RAISE EXCEPTION 'mais de um usuário no Auth com o e-mail %', v_email;
  END IF;

  SELECT count(*) INTO v_admins
  FROM public.user_roles ur JOIN public.profiles p ON p.id = ur.user_id
  WHERE ur.role = 'admin' AND p.is_active AND ur.user_id <> v_ids[1];
  IF v_admins > 0 AND NOT v_forcar THEN
    RAISE EXCEPTION 'já existe administrador ativo; use o app para criar outros (ou -v forcar=1)';
  END IF;

  -- handle_new_user já cria o perfil; este INSERT cobre usuário criado antes do trigger existir
  INSERT INTO public.profiles (id, email, full_name, is_active, tipo_usuario)
  SELECT u.id, u.email, COALESCE(u.raw_user_meta_data->>'full_name', u.email), true, 'servidor'
  FROM auth.users u WHERE u.id = v_ids[1]
  ON CONFLICT (id) DO UPDATE SET is_active = true, blocked_at = NULL, blocked_reason = NULL;

  INSERT INTO public.user_roles (user_id, role) VALUES (v_ids[1], 'admin')
  ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

  RAISE NOTICE 'administrador ativo: % (%)', v_email, v_ids[1];
END $$;
COMMIT;
