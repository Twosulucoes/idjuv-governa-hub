-- Promove UM usuário já criado no Auth a administrador ativo (primeiro acesso de um banco vazio).
--
-- Por que existe: handle_new_user cria todo usuário INATIVO e com papel `user`; só um
-- administrador ativa outros — e num banco novo ainda não há administrador.
--
-- Uso (como `postgres`, nunca pelo front):
--   1. crie o usuário no Auth (Studio > Authentication > Add user, com senha)
--   2. psql "$URL" -v email='pessoa@orgao.gov.br' -f supabase/baseline/bootstrap-admin.sql
--
-- Idempotente. Falha se o e-mail não existir em profiles ou se houver mais de um perfil com ele.
-- Depois do primeiro administrador, use o app (Admin > Usuários) ou a Edge Function
-- admin-create-user para os demais. Não deixe este arquivo ser executado por rotina automática.
\set ON_ERROR_STOP on

BEGIN;
SELECT set_config('app.bootstrap_email', :'email', true) AS _ \gset

DO $$
DECLARE
  v_email text := lower(btrim(current_setting('app.bootstrap_email')));
  v_ids   uuid[];
BEGIN
  SELECT array_agg(id) INTO v_ids FROM public.profiles WHERE lower(email) = v_email;
  IF v_ids IS NULL THEN
    RAISE EXCEPTION 'nenhum perfil com o e-mail %: crie o usuário no Auth antes', v_email;
  ELSIF array_length(v_ids, 1) > 1 THEN
    RAISE EXCEPTION 'mais de um perfil com o e-mail %', v_email;
  END IF;

  UPDATE public.profiles
     SET is_active = true, blocked_at = NULL, blocked_reason = NULL
   WHERE id = v_ids[1];

  INSERT INTO public.user_roles (user_id, role) VALUES (v_ids[1], 'admin')
  ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

  RAISE NOTICE 'administrador ativo: % (%)', v_email, v_ids[1];
END $$;
COMMIT;
