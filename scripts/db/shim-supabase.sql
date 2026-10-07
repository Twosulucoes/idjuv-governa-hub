-- Emula o MÍNIMO da plataforma Supabase para validar migrações/baseline em PostgreSQL puro.
--
-- SÓ PARA VALIDAÇÃO LOCAL (scripts/db/validar-baseline.sh). NUNCA aplique em um Supabase
-- real: a plataforma já provê tudo isto, e este arquivo cria schemas/papéis que conflitam.
--
-- Executar como superusuário, conectado ao banco de validação (vazio).
-- Fidelidade: o papel `postgres` criado aqui NÃO é superusuário e tem BYPASSRLS, como no
-- Supabase; assim FORCE ROW LEVEL SECURITY e funções SECURITY DEFINER se comportam igual.
-- Fora do escopo do shim: pg_cron, pg_net, supabase_vault, pg_graphql, Realtime, GoTrue.

-- ---------- papéis ----------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'postgres') THEN
    CREATE ROLE postgres LOGIN CREATEDB CREATEROLE BYPASSRLS;
  END IF;
END $$;

-- No Supabase o postgres pode assumir os papéis da API (necessário para SET ROLE nos testes).
GRANT anon, authenticated, service_role TO postgres;

-- ---------- extensões disponíveis em Postgres puro ----------
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role, postgres;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
-- No Supabase já vem instalada; criar exige superusuário, então fica aqui no shim.
CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;

-- ---------- auth ----------
CREATE SCHEMA IF NOT EXISTS auth AUTHORIZATION postgres;

CREATE TABLE IF NOT EXISTS auth.users (
  instance_id        uuid,
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aud                varchar(255),
  role               varchar(255),
  email              varchar(255),
  encrypted_password varchar(255),
  email_confirmed_at timestamptz,
  invited_at         timestamptz,
  confirmation_token varchar(255),
  recovery_token     varchar(255),
  last_sign_in_at    timestamptz,
  raw_app_meta_data  jsonb,
  raw_user_meta_data jsonb,
  is_super_admin     boolean,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now(),
  phone              text,
  banned_until       timestamptz,
  deleted_at         timestamptz,
  is_anonymous       boolean NOT NULL DEFAULT false
);
ALTER TABLE auth.users OWNER TO postgres;

-- Mesma semântica do Supabase: os claims vêm de request.jwt.claim(s), definidos pelo PostgREST.
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT nullif(
    coalesce(
      current_setting('request.jwt.claim.sub', true),
      (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
    ), ''
  )::uuid
$$;

CREATE OR REPLACE FUNCTION auth.role() RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;

CREATE OR REPLACE FUNCTION auth.email() RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;

CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb
LANGUAGE sql STABLE AS $$
  SELECT coalesce(
    nullif(current_setting('request.jwt.claim', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')
  )::jsonb
$$;

GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role, postgres;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO anon, authenticated, service_role, postgres;
-- Como no Supabase, apenas a service_role lê/escreve auth.users diretamente.
GRANT ALL ON auth.users TO service_role, postgres;

-- ---------- storage ----------
CREATE SCHEMA IF NOT EXISTS storage AUTHORIZATION postgres;

CREATE TABLE IF NOT EXISTS storage.buckets (
  id                 text PRIMARY KEY,
  name               text NOT NULL,
  owner              uuid,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now(),
  public             boolean DEFAULT false,
  avif_autodetection boolean DEFAULT false,
  file_size_limit    bigint,
  allowed_mime_types text[],
  owner_id           text
);

CREATE TABLE IF NOT EXISTS storage.objects (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id        text REFERENCES storage.buckets (id),
  name             text,
  owner            uuid,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now(),
  last_accessed_at timestamptz DEFAULT now(),
  metadata         jsonb,
  path_tokens      text[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED,
  version          text,
  owner_id         text,
  user_metadata    jsonb
);
ALTER TABLE storage.buckets OWNER TO postgres;
ALTER TABLE storage.objects OWNER TO postgres;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION storage.foldername(name text) RETURNS text[]
LANGUAGE sql IMMUTABLE AS $$
  SELECT (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1]
$$;
CREATE OR REPLACE FUNCTION storage.filename(name text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT (string_to_array(name, '/'))[array_length(string_to_array(name, '/'), 1)]
$$;
CREATE OR REPLACE FUNCTION storage.extension(name text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN position('.' IN name) > 0
              THEN (string_to_array(name, '.'))[array_length(string_to_array(name, '.'), 1)]
              ELSE '' END
$$;

GRANT USAGE ON SCHEMA storage TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL TABLES IN SCHEMA storage TO service_role, postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects, storage.buckets TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA storage TO anon, authenticated, service_role, postgres;

-- ---------- realtime ----------
-- A publicação já existe no Supabase; as migrações só fazem ALTER PUBLICATION ... ADD TABLE.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;
-- No Supabase o dono é o postgres (as migrações fazem ALTER PUBLICATION ... ADD TABLE).
ALTER PUBLICATION supabase_realtime OWNER TO postgres;

-- ---------- public: privilégios padrão do Supabase ----------
-- A plataforma concede ALL às três roles da API em tudo que o postgres cria em public.
-- As migrações dependem disso (e os REVOKE delas só fazem sentido sobre esse padrão).
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- search_path do Supabase (uuid_generate_v4, crypt, gen_salt vivem em `extensions`).
DO $$
BEGIN
  EXECUTE format('ALTER DATABASE %I SET search_path = "$user", public, extensions', current_database());
END $$;
