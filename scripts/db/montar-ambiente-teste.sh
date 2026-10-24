#!/usr/bin/env bash
# Monta o banco do AMBIENTE DE TESTE (Supabase próprio, nunca a produção) a partir deste repositório,
# rodando o psql dentro do container do Postgres de teste (sem expor porta):
#   1. baseline (supabase/baseline/aplicar.sh, mesma ordem e uma transação só)
#   2. login de teste no Auth, já confirmado, com senha aleatória mostrada só neste terminal
#   3. bootstrap-admin.sql (o login vira administrador ativo)
#   4. dados-teste.sql (dados fictícios, ligados ao login)
#
#   bash scripts/db/montar-ambiente-teste.sh <container-do-db-de-teste> <email-do-login>
#   ex.: bash scripts/db/montar-ambiente-teste.sh supabase-db-gxdtyi29hkfxjclgnfbtg58l teste@exemplo.test
#
# Recusa o container `supabase-db` (o da produção, sem sufixo) e qualquer banco que já tenha tabela em
# `public` (o aplicar.sh e o dados-teste.sql também recusam). Guia: docs/NOVO_BANCO.md §9.
set -euo pipefail
cd "$(dirname "$0")/../../supabase/baseline"

CT="${1:-}"; EMAIL="${2:-}"
[[ -n "$CT" && -n "$EMAIL" ]] || { echo "uso: $0 <container-do-db-de-teste> <email-do-login>" >&2; exit 2; }
[[ "$CT" != "supabase-db" ]] || { echo "recusado: supabase-db é o banco da produção" >&2; exit 2; }
docker inspect "$CT" >/dev/null 2>&1 || { echo "container $CT não encontrado (docker ps)" >&2; exit 2; }

# PAPEL=postgres (dono de public, como o aplicar.sh); o Auth é gravado como supabase_admin (dono do schema auth)
psql_() { docker exec -i -e PGOPTIONS='-c client_min_messages=warning' "$CT" psql -U "${PAPEL:-postgres}" -d postgres -X -q -v ON_ERROR_STOP=1 "$@"; }

n=$(psql_ -At -c "select count(*) from pg_tables where schemaname = 'public'")
[[ "$n" == "0" ]] || { echo "recusado: o public de $CT já tem $n tabela(s); o teste só se monta em banco vazio" >&2; exit 2; }

echo "== 1. baseline"
ARQUIVOS=(schema/01_pre_data.sql schema/02_dados_catalogo.sql schema/03_post_data.sql
  overlay/10_funcoes_acesso.sql overlay/12_protecao_profiles.sql overlay/15_novo_usuario.sql
  overlay/18_funcoes_rpc.sql overlay/20_campos_iniciais.sql overlay/30_remover_acesso_total.sql
  rls/35_policies_geradas.sql overlay/40_privilegios.sql overlay/50_storage.sql)
# mesma lista e o mesmo RESET ALL do aplicar.sh, enviados por stdin numa transação só
{
  for f in "${ARQUIVOS[@]}"; do
    cat "$f"; echo
    if [[ "$f" == schema/03_post_data.sql ]]; then echo "RESET ALL;"; fi
  done
} | psql_ --single-transaction >/dev/null
echo "   baseline aplicado"

echo "== 2. login de teste no Auth"
SENHA="$(head -c 18 /dev/urandom | base64 | tr -d '/+=' | head -c 16)"
PAPEL=supabase_admin psql_ -v email="$EMAIL" -v senha="$SENHA" <<'SQL'
SELECT set_config('teste.email', lower(btrim(:'email')), false) AS _, set_config('teste.senha', :'senha', false) AS __ \gset
DO $$
DECLARE v_id uuid := gen_random_uuid(); v_email text := current_setting('teste.email');
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = v_email) THEN
    RAISE EXCEPTION 'já existe usuário % no Auth deste banco', v_email;
  END IF;
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                          confirmation_token, recovery_token, email_change_token_new, email_change)
  VALUES ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
          extensions.crypt(current_setting('teste.senha'), extensions.gen_salt('bf')), now(),
          '{"provider":"email","providers":["email"]}', '{"full_name":"Usuário de Teste"}', now(), now(), '', '', '', '');
  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
  VALUES (gen_random_uuid(), v_id, v_id::text, jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true),
          'email', now(), now(), now());
END $$;
SQL

echo "== 3. administrador"
psql_ -v email="$EMAIL" < bootstrap-admin.sql >/dev/null

echo "== 4. dados fictícios"
psql_ -v confirmo=banco_de_teste -v email="$EMAIL" < dados-teste.sql

echo
echo "Pronto. Login do ambiente de teste: $EMAIL"
echo "Senha (anote agora; ela não fica gravada em lugar nenhum): $SENHA"
