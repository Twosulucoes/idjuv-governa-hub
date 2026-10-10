#!/usr/bin/env bash
# Prova que supabase/baseline/ constrói, num PostgreSQL VAZIO (com o shim do Supabase), um banco
# equivalente ao replay das migrações + overlays e que passa no teste de RLS por módulo.
#
#   0. rls/35_policies_geradas.sql em dia com rls/mapa.csv
#   1. recria PG_DB, instala o shim e roda supabase/baseline/aplicar.sh como `postgres`
#   2. confirma que uma segunda aplicação é recusada (guarda "só banco vazio")
#   3. confirma que não há dado pessoal/operacional (servidores, perfis, auditoria vazios)
#   4. roda scripts/db/testar-rls.sh (RLS, UPDATE/DELETE, storage, identidade, RPCs, triggers)
#   5. (opcional) compara o schema com o replay das migrações + overlays: informe PG_REPLAY, o banco
#      que scripts/db/validar-migracoes.sh deixou pronto. O script copia esse banco, aplica nele os
#      overlays e a RLS (os mesmos arquivos do aplicar.sh) e compara schema, privilégios e storage.
#
# Mesmos pré-requisitos de validar-migracoes.sh (superusuário que NÃO se chama `postgres`).
# Variáveis: PGHOST (127.0.0.1) PGPORT (54329) PG_SUPERUSER (supabase_admin)
#            PG_DB (idjuv_baseline — SERÁ APAGADO E RECRIADO)  PG_REPLAY (opcional)
#            PERMITIR_REMOTO=1 para aceitar um PGHOST que não seja loopback (o script APAGA bancos)
#            EXIGIR_REPLAY=1 para reprovar quando PG_REPLAY não for informado (padrão: o passo 5 é pulado)
# Apaga e recria PG_DB, ${PG_DB}_ref (passo 5) e ${PG_DB}_teste (copia criada por testar-rls.sh). Precisa de
# bash 4+, node (gerar-rls.mjs) e perl (normalização do dump) no PATH, e de pg_dump na versão do servidor ou mais nova.
set -uo pipefail
cd "$(dirname "$0")/../.."

export PGHOST="${PGHOST:-127.0.0.1}" PGPORT="${PGPORT:-54329}"
SUPER="${PG_SUPERUSER:-supabase_admin}"
DB="${PG_DB:-idjuv_baseline}"
REPLAY="${PG_REPLAY:-}"
REF="${DB}_ref"
if [[ "$DB" == "postgres" || "$DB" == "template0" || "$DB" == "template1" || "$DB" == "$REPLAY" ]]; then
  echo "recusado: PG_DB=$DB (o script APAGA o banco informado)" >&2; exit 2
fi
case "$PGHOST" in
  127.0.0.1|localhost|::1|/*) ;;
  *) [[ "${PERMITIR_REMOTO:-}" == "1" ]] || { echo "recusado: PGHOST=$PGHOST não é local (o script apaga e recria bancos). Use PERMITIR_REMOTO=1 só num servidor de validação." >&2; exit 2; } ;;
esac
for ferramenta in node perl pg_dump psql; do
  command -v "$ferramenta" >/dev/null || { echo "faltando no PATH: $ferramenta" >&2; exit 2; }
done
(( BASH_VERSINFO[0] >= 4 )) || { echo "precisa de bash 4+ (mapfile)" >&2; exit 2; }
if [[ -n "$REPLAY" && ( "$REPLAY" == "$REF" || "$REPLAY" == "${DB}_teste" ) ]]; then
  echo "recusado: PG_REPLAY=$REPLAY coincide com um banco que o script apaga" >&2; exit 2
fi
TMP="$(mktemp -d)"
limpar() { psql -U "$SUPER" -X -q -d postgres -c "drop database if exists \"$REF\" with (force);" -c "drop database if exists \"${DB}_teste\" with (force);" >/dev/null 2>&1; rm -rf "$TMP"; }
trap limpar EXIT
falhas=0
ok()   { echo "  ok    $*"; }
erro() { echo "  FALHA $*"; falhas=$((falhas+1)); }
psql_s() { psql -U "$SUPER" -X -q -v ON_ERROR_STOP=1 "$@"; }

preparar() {  # preparar <banco>: shim + dono postgres (como o Supabase)
  local out
  out="$(psql_s -d "$1" -f scripts/db/shim-supabase.sql 2>&1)" || { echo "$out"; return 1; }
  psql_s -d "$1" -c "alter database \"$1\" owner to postgres; alter schema public owner to postgres; grant all on schema public to postgres;" || return 1
}

echo "== 0. mapa de RLS em dia"
if node scripts/db/gerar-rls.mjs --check; then :; else erro "35_policies_geradas.sql defasado em relação a rls/mapa.csv"; fi

echo "== 1. aplicar o baseline em banco vazio ($DB)"
psql_s -d postgres -c "drop database if exists \"$DB\" with (force);" -c "create database \"$DB\";" >/dev/null 2>&1 || { echo "não consegui recriar $DB" >&2; exit 2; }
preparar "$DB" >/dev/null || { echo "falha ao instalar o shim em $DB" >&2; exit 2; }
if PGUSER=postgres PGDATABASE="$DB" bash supabase/baseline/aplicar.sh >"$TMP/aplicar.txt" 2>&1; then
  ok "$(tail -1 "$TMP/aplicar.txt" | cut -c1-90)"
else
  cat "$TMP/aplicar.txt"; erro "aplicar.sh falhou"; echo "baseline REPROVADO: $falhas falha(s)"; exit 1
fi

echo "== 2. segunda aplicação é recusada (e não altera nada)"
PGUSER=postgres PGDATABASE="$DB" bash supabase/baseline/aplicar.sh >"$TMP/seg.txt" 2>&1; rc=$?
if [[ $rc -eq 2 ]] && grep -q "recusado" "$TMP/seg.txt"; then ok "recusada (rc=2)"; else erro "esperava recusa com rc=2; veio rc=$rc: $(head -c 200 "$TMP/seg.txt")"; fi

echo "== 3. sem dado pessoal nem operacional"
for t in servidores vinculos_servidor profiles user_roles user_modules audit_logs portal_diretoria cadastro_arbitros; do
  n=$(psql_s -d "$DB" -At -c "select count(*) from public.$t")
  [[ "$n" == "0" ]] && ok "$t vazia" || erro "$t tem $n linha(s)"
done
n=$(psql_s -d "$DB" -At -c "select count(*) from storage.objects")
[[ "$n" == "0" ]] && ok "storage.objects vazio" || erro "storage.objects tem $n linha(s)"
# só as tabelas semeadas (schema/02_dados_catalogo.sql) podem ter linhas (o `;` no fim de cada SELECT é necessário:
# sem ele o arquivo virava um comando só, o psql dava erro de sintaxe e a checagem passava sem contar nada)
mapfile -t semeadas < <(grep -oE '^INSERT INTO public\.[a-z_0-9]+' supabase/baseline/schema/02_dados_catalogo.sql | sed 's/INSERT INTO public\.//' | sort -u)
psql_s -d "$DB" -At -c "select format('select %L, count(*) from public.%I;', relname, relname) from pg_class where relnamespace = 'public'::regnamespace and relkind in ('r','p') order by relname" > "$TMP/contagens.sql" || erro "não consegui listar as tabelas"
fora=0
while IFS='|' read -r tabela linhas; do
  [[ "$linhas" == "0" ]] && continue
  if ! printf '%s\n' "${semeadas[@]}" | grep -qx "$tabela"; then erro "$tabela tem $linhas linha(s) e não é tabela de catálogo"; fora=1; fi
done < <(psql_s -d "$DB" -At -F'|' -f "$TMP/contagens.sql")
(( fora == 0 )) && ok "só as ${#semeadas[@]} tabelas de catálogo têm linhas"
n=$(psql_s -d "$DB" -At -c "select count(*) from public.role_permissions")
[[ "$n" -gt 0 ]] && ok "catálogo semeado (role_permissions: $n)" || erro "catálogo não foi semeado"

echo "== 4. teste de RLS (personas, UPDATE/DELETE, storage, identidade, RPCs, triggers)"
PG_DB="$DB" bash scripts/db/testar-rls.sh >"$TMP/rls.txt" 2>&1; rc=$?
grep -E "^ (FALHA|nota) " "$TMP/rls.txt" | grep -E "FALHA|UPDATE/DELETE|storage:|tabelas verificadas" | sed 's/^/  /'
if [[ $rc -eq 0 ]] && grep -q "RLS: 0 falha" "$TMP/rls.txt"; then ok "RLS: 0 falha(s)"
else erro "teste de RLS reprovou (rc=$rc; saída completa abaixo)"; tail -25 "$TMP/rls.txt"; fi

echo "== 5. schema igual ao do replay + overlays"
if [[ -z "$REPLAY" ]]; then
  if [[ "${EXIGIR_REPLAY:-}" == "1" ]]; then erro "PG_REPLAY não informado (EXIGIR_REPLAY=1)"
  else echo "  PULADO: defina PG_REPLAY=<banco deixado por validar-migracoes.sh> para comparar com o replay"; fi
# Marca do replay: a tabela morta _backup_usuario_modulos_old (criada pelas migrações; o overlay/30 a apaga). Antes era
# "tem policy acesso_total_*", mas desde a onda 1 (20261010200000) e a B3 (20261010210000) o replay não tem mais nenhuma.
elif [[ "$(psql_s -d postgres -At -c "select 1 from pg_database where datname = '$REPLAY'" 2>/dev/null)" == "1" && "$(psql_s -d "$REPLAY" -At -c "select to_regclass('public._backup_usuario_modulos_old') is not null" 2>/dev/null)" != "t" ]]; then
  erro "PG_REPLAY=$REPLAY não parece o replay das migrações (não tem a tabela _backup_usuario_modulos_old; já recebeu o baseline ou o overlay/30?)"
elif ! psql_s -d postgres -At -c "select 1 from pg_database where datname = '$REPLAY'" | grep -q 1; then
  erro "PG_REPLAY=$REPLAY não existe"
else
  psql_s -d postgres -c "drop database if exists \"$REF\" with (force);" -c "create database \"$REF\" template \"$REPLAY\";" >/dev/null 2>&1 \
    || { erro "não consegui copiar $REPLAY (há conexões abertas nele?)"; REF=""; }
  if [[ -n "$REF" ]]; then
    # mesmos arquivos de overlay e RLS do aplicar.sh (fonte única da ordem), sem os do schema/
    mapfile -t extras < <(sed -n '/^ARQUIVOS=(/,/^)/p' supabase/baseline/aplicar.sh | grep -oE '^[[:space:]]*(overlay|rls)/[^[:space:]]+\.sql' | tr -d ' ')
    args=(); for f in "${extras[@]}"; do args+=(-f "supabase/baseline/$f"); done
    if PGUSER=postgres PGDATABASE="$REF" psql -X -q -v ON_ERROR_STOP=1 --single-transaction "${args[@]}" >"$TMP/ref.txt" 2>&1; then
      # O replay guarda os CHECKs como foram digitados; dump->restore os reescreve para uma forma equivalente
      # (`ANY ((ARRAY[..])::text[])` vira `ANY (ARRAY[(..)::text, ..])`): as linhas de CHECK são reduzidas
      # à forma sem parênteses nem casts antes de comparar.
      dump() {  # dump <banco> <arquivo>
        pg_dump -U "$SUPER" -d "$1" --schema=public --schema-only --no-owner --no-tablespaces -f "$TMP/bruto.sql" 2>"$TMP/dump.err" \
          && [[ -s "$TMP/bruto.sql" ]] || return 1
        grep -v -E '^(\\restrict|\\unrestrict|-- Dumped)' "$TMP/bruto.sql" \
          | perl -pe 'if (/CONSTRAINT \S+ CHECK/) { s/[()]//g; s/::character varying//g; s/::text\[\]//g; s/::text//g; s/\s+/ /g }' >"$2"
      }
      if dump "$REF" "$TMP/ref.sql" && dump "$DB" "$TMP/novo.sql"; then
        if diff "$TMP/ref.sql" "$TMP/novo.sql" >"$TMP/schema.diff"; then ok "schema public e privilégios de tabela/função idênticos ($(wc -l <"$TMP/novo.sql") linhas)"
        else erro "schema difere do replay + overlays ($(grep -cE '^[<>]' "$TMP/schema.diff") linhas); primeiras:"; grep -E '^[<>]' "$TMP/schema.diff" | head -8 | cut -c1-160 | sed 's/^/        /'; fi
      else
        erro "pg_dump falhou ($(head -c 200 "$TMP/dump.err")); o pg_dump precisa ser da versão do servidor ou mais novo"
      fi
      q="select policyname||'|'||cmd||'|'||coalesce(roles::text,'')||'|'||coalesce(qual,'')||'|'||coalesce(with_check,'') from pg_policies where schemaname='storage' and tablename='objects' order by 1"
      b="select id||'|'||public||'|'||coalesce(file_size_limit::text,'')||'|'||coalesce(allowed_mime_types::text,'') from storage.buckets order by 1"
      p="select p.oid::regprocedure||'|'||array_to_string(coalesce(p.proacl,'{}'),',') from pg_proc p where pronamespace='public'::regnamespace order by 1"
      comparar_consulta() {  # comparar_consulta <rótulo> <sql>: roda nos dois bancos, exige saída não vazia e igual
        if psql_s -d "$REF" -At -c "$2" >"$TMP/c_ref.txt" 2>/dev/null && psql_s -d "$DB" -At -c "$2" >"$TMP/c_novo.txt" 2>/dev/null && [[ -s "$TMP/c_ref.txt" ]]; then
          if diff -q "$TMP/c_ref.txt" "$TMP/c_novo.txt" >/dev/null; then ok "$1 idênticos"; else erro "$1 diferem do replay + overlays"; fi
        else erro "$1: a consulta falhou ou veio vazia"; fi
      }
      comparar_consulta "policies de storage" "$q"
      comparar_consulta "buckets" "$b"
      comparar_consulta "ACL de funções" "$p"
    else
      cat "$TMP/ref.txt"; erro "não consegui aplicar overlays/RLS sobre a cópia do replay"
    fi
    psql_s -d postgres -c "drop database if exists \"$REF\" with (force);" >/dev/null 2>&1
  fi
fi

echo
if (( falhas > 0 )); then echo "baseline REPROVADO: $falhas falha(s)"; exit 1; fi
echo "baseline APROVADO$([[ -z "$REPLAY" ]] && echo ' (sem comparação com o replay: defina PG_REPLAY)')"
