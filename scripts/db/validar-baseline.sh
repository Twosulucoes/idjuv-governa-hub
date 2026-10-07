#!/usr/bin/env bash
# Prova que supabase/baseline/ constrói, num PostgreSQL VAZIO (com o shim do Supabase), um banco
# equivalente ao replay das migrações + overlays e que passa no teste de RLS por módulo.
#
#   1. recria PG_DB, instala o shim e roda supabase/baseline/aplicar.sh como `postgres`
#   2. confirma que uma segunda aplicação é recusada (guarda "só banco vazio")
#   3. confirma que não há dado pessoal/operacional (servidores, perfis, auditoria vazios)
#   4. roda scripts/db/testar-rls.sh (RLS, storage, handle_new_user)
#   5. (opcional) compara o schema com PG_REFERENCIA (banco já construído pelo replay das migrações
#      + overlays); sem referência, pula este passo
#
# Mesmos pré-requisitos de validar-migracoes.sh (superusuário que NÃO se chama `postgres`).
# Variáveis: PGHOST (127.0.0.1) PGPORT (54329) PG_SUPERUSER (supabase_admin)
#            PG_DB (idjuv_baseline — SERÁ APAGADO E RECRIADO)  PG_REFERENCIA (opcional)
set -uo pipefail
cd "$(dirname "$0")/../.."

export PGHOST="${PGHOST:-127.0.0.1}" PGPORT="${PGPORT:-54329}"
SUPER="${PG_SUPERUSER:-supabase_admin}"
DB="${PG_DB:-idjuv_baseline}"
REF="${PG_REFERENCIA:-}"
if [[ "$DB" == "postgres" || "$DB" == "template0" || "$DB" == "template1" || "$DB" == "$REF" ]]; then
  echo "recusado: PG_DB=$DB (o script APAGA o banco informado)" >&2; exit 2
fi
falhas=0
ok()   { echo "  ok   $*"; }
erro() { echo "  FALHA $*"; falhas=$((falhas+1)); }

echo "== 0. mapa de RLS em dia"
node scripts/db/gerar-rls.mjs --check || erro "35_policies_geradas.sql defasado"

echo "== 1. aplicar o baseline em banco vazio ($DB)"
psql -U "$SUPER" -d postgres -q -v ON_ERROR_STOP=1 \
  -c "drop database if exists \"$DB\" with (force);" -c "create database \"$DB\";" || exit 2
psql -U "$SUPER" -d "$DB" -q -v ON_ERROR_STOP=1 -f scripts/db/shim-supabase.sql 2>&1 | grep -v -E "NOTICE|wal_level|HINT"
psql -U "$SUPER" -d "$DB" -q -v ON_ERROR_STOP=1 \
  -c "alter database \"$DB\" owner to postgres; alter schema public owner to postgres; grant all on schema public to postgres;" || exit 2
if PGUSER=postgres PGDATABASE="$DB" bash supabase/baseline/aplicar.sh 2>&1 | sed 's/^/  /'; [[ ${PIPESTATUS[0]} -eq 0 ]]; then
  ok "aplicado sem erro"
else
  erro "aplicar.sh falhou"; echo "$falhas falha(s)"; exit 1
fi

echo "== 2. segunda aplicação é recusada"
if PGUSER=postgres PGDATABASE="$DB" bash supabase/baseline/aplicar.sh >/dev/null 2>&1; then
  erro "aplicar.sh aceitou um banco que já tinha tabelas"
else ok "recusada"; fi

echo "== 3. sem dado pessoal nem operacional"
for t in servidores vinculos_servidor profiles user_roles user_modules audit_logs portal_diretoria cadastro_arbitros; do
  n=$(psql -U "$SUPER" -d "$DB" -At -c "select count(*) from public.$t")
  [[ "$n" == "0" ]] && ok "$t vazia" || erro "$t tem $n linha(s)"
done
n=$(psql -U "$SUPER" -d "$DB" -At -c "select count(*) from storage.objects")
[[ "$n" == "0" ]] && ok "storage.objects vazio" || erro "storage.objects tem $n linha(s)"
n=$(psql -U "$SUPER" -d "$DB" -At -c "select count(*) from public.role_permissions") 
[[ "$n" -gt 0 ]] && ok "catálogo semeado (role_permissions: $n)" || erro "catálogo não foi semeado"

echo "== 4. teste de RLS (personas, storage, novo usuário)"
if PG_DB="$DB" bash scripts/db/testar-rls.sh 2>&1 | grep -E "FALHA|RLS:" | sed 's/^/  /' | tee /tmp/validar-baseline-rls.txt | grep -q "RLS: 0 falha"; then
  ok "RLS: 0 falha(s)"
else
  erro "teste de RLS reprovou (ver acima)"
fi

echo "== 5. schema igual ao do replay + overlays"
if [[ -n "$REF" ]] && psql -U "$SUPER" -d postgres -At -c "select 1 from pg_database where datname='$REF'" | grep -q 1; then
  # O replay guarda os CHECKs como foram digitados; o dump->restore os reescreve para uma forma
  # equivalente (`ANY ((ARRAY[..])::text[])` vira `ANY (ARRAY[(..)::text, ..])`). Para comparar,
  # as linhas de CHECK são reduzidas à forma sem parênteses nem casts.
  dump() { pg_dump -U "$SUPER" -d "$1" --schema=public --schema-only --no-owner --no-privileges --no-tablespaces \
             | grep -v -E '^(\\restrict|\\unrestrict|-- Dumped)' \
             | perl -pe 'if (/CONSTRAINT \S+ CHECK/) { s/[()]//g; s/::character varying//g; s/::text\[\]//g; s/::text//g; s/\s+/ /g }' ; }
  if diff <(dump "$REF") <(dump "$DB") >/tmp/validar-baseline-diff.txt; then ok "schema public idêntico a $REF"
  else erro "schema difere de $REF ($(wc -l </tmp/validar-baseline-diff.txt) linhas em /tmp/validar-baseline-diff.txt)"; fi
  q="select policyname||'|'||cmd||'|'||coalesce(roles::text,'')||'|'||coalesce(qual,'')||'|'||coalesce(with_check,'') from pg_policies where schemaname='storage' and tablename='objects' order by 1"
  if diff <(psql -U "$SUPER" -d "$REF" -At -c "$q") <(psql -U "$SUPER" -d "$DB" -At -c "$q") >/dev/null; then ok "policies de storage idênticas"
  else erro "policies de storage diferem de $REF"; fi
  p="select p.oid::regprocedure||'|'||array_to_string(coalesce(p.proacl,'{}'),',') from pg_proc p where pronamespace='public'::regnamespace order by 1"
  if diff <(psql -U "$SUPER" -d "$REF" -At -c "$p") <(psql -U "$SUPER" -d "$DB" -At -c "$p") >/dev/null; then ok "privilégios de função idênticos"
  else erro "privilégios de função diferem de $REF"; fi
else
  echo "  (pulado: defina PG_REFERENCIA=<banco do replay + overlays>)"
fi

echo
if (( falhas > 0 )); then echo "baseline REPROVADO: $falhas falha(s)"; exit 1; fi
echo "baseline APROVADO"
