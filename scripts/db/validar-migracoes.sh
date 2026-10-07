#!/usr/bin/env bash
# Reaplica TODAS as migrações (mais supabase/baseline/lacunas/) num PostgreSQL vazio com o
# "shim" do Supabase e diz quais arquivos falham. Prova que o histórico versionado reconstrói
# o schema do zero, o que o repositório não garantia (ver supabase/baseline/lacunas/).
#
# Pré-requisito: um servidor PostgreSQL acessível em que você é SUPERUSUÁRIO e cujo
# superusuário NÃO se chama `postgres` (o shim cria um `postgres` sem superuso e com BYPASSRLS,
# como o do Supabase). Ex.: docker run -p 127.0.0.1:54329:5432 -e POSTGRES_USER=supabase_admin \
#        -e POSTGRES_HOST_AUTH_METHOD=trust postgres:17   (trust: o shim cria o `postgres` sem senha)
#
# Variáveis (com padrão): PGHOST=127.0.0.1  PGPORT=54329  PG_SUPERUSER=supabase_admin
#                         PG_DB=idjuv_validacao  (SERÁ APAGADO E RECRIADO)
#                         SAIDA=/tmp/validar-migracoes  (um .err por arquivo + resumo.tsv)
# Se o servidor exigir senha, exporte PGPASSWORD. PGHOST precisa ser local (ou PERMITIR_REMOTO=1).
#
# Uso:  bash scripts/db/validar-migracoes.sh
# Saída: 0 se todos os arquivos aplicaram; 1 se algum falhou.
set -uo pipefail
cd "$(dirname "$0")/../.."

export PGHOST="${PGHOST:-127.0.0.1}" PGPORT="${PGPORT:-54329}"
SUPER="${PG_SUPERUSER:-supabase_admin}"
DB="${PG_DB:-idjuv_validacao}"
SAIDA="${SAIDA:-/tmp/validar-migracoes}"

if [[ "$DB" == "postgres" || "$DB" == "template1" || "$DB" == "template0" ]]; then
  echo "recusado: PG_DB=$DB (o script APAGA o banco informado)" >&2; exit 2
fi

case "$PGHOST" in
  127.0.0.1|localhost|::1|/*) ;;
  *) [[ "${PERMITIR_REMOTO:-}" == "1" ]] || { echo "recusado: PGHOST=$PGHOST não é local (o script apaga e recria bancos). Use PERMITIR_REMOTO=1 só num servidor de validação." >&2; exit 2; } ;;
esac
[[ -n "$SAIDA" && "$SAIDA" != "/" && "$SAIDA" == *validar* ]] || { echo "recusado: SAIDA=$SAIDA (precisa conter 'validar'; o script apaga o diretório)" >&2; exit 2; }
rm -rf "$SAIDA"; mkdir -p "$SAIDA"; : > "$SAIDA/resumo.tsv"

psql -U "$SUPER" -d postgres -q -v ON_ERROR_STOP=1 \
  -c "drop database if exists \"$DB\" with (force);" \
  -c "create database \"$DB\";" || { echo "não consegui recriar o banco" >&2; exit 2; }
out="$(psql -U "$SUPER" -d "$DB" -q -v ON_ERROR_STOP=1 -f scripts/db/shim-supabase.sql 2>&1)" \
  || { echo "$out" | grep -v -E "NOTICE|wal_level|HINT"; echo "falha ao instalar o shim" >&2; exit 2; }
psql -U "$SUPER" -d "$DB" -q -v ON_ERROR_STOP=1 \
  -c "alter database \"$DB\" owner to postgres; alter schema public owner to postgres; grant all on schema public to postgres;" \
  || exit 2

# Extensões que só existem na plataforma Supabase e `SET`s de versões novas do pg_dump são
# removidos do texto; nada além disso é alterado.
FILTRO=(-e '/^[[:space:]]*CREATE EXTENSION.*(pg_graphql|pg_cron|pg_net|supabase_vault)/d' -e '/^SET transaction_timeout/d')

ok=0; falhou=0
# Ordem: pelo nome (timestamp). As lacunas entram intercaladas.
while IFS= read -r f; do
  b="$(basename "$f")"
  modo=(--single-transaction -v ON_ERROR_STOP=1)
  if grep -qx "$b" supabase/baseline/lacunas/tolerar-erro.txt; then modo=(-v ON_ERROR_STOP=0); fi
  if sed -E "${FILTRO[@]}" "$f" | timeout 180 psql -U postgres -d "$DB" -q "${modo[@]}" -f - \
       >"$SAIDA/$b.out" 2>"$SAIDA/$b.err"; then
    ok=$((ok+1)); printf 'OK\t%s\n' "$b" >> "$SAIDA/resumo.tsv"
  else
    falhou=$((falhou+1))
    printf 'FALHOU\t%s\t%s\n' "$b" "$(grep -m1 -E 'ERROR|FATAL' "$SAIDA/$b.err" | sed -E 's/^psql:[^ ]+ //' | cut -c1-200)" >> "$SAIDA/resumo.tsv"
  fi
done < <(ls supabase/migrations/*.sql supabase/baseline/lacunas/*.sql \
          | awk -F/ '{print $NF" "$0}' | sort | cut -d' ' -f2)

echo "aplicados: $ok   falharam: $falhou   (detalhes em $SAIDA)"
if (( falhou > 0 )); then grep '^FALHOU' "$SAIDA/resumo.tsv" | cut -f2,3 | head -20; exit 1; fi
