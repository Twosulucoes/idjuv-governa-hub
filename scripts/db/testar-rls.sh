#!/usr/bin/env bash
# Roda scripts/db/testar-rls.sql numa CÓPIA descartável de um banco que já tem schema + overlay + rls
# aplicados (o teste semeia dados e não deve rodar no banco original).
#
# Uso:  PG_DB=idjuv_rls bash scripts/db/testar-rls.sh
# Variáveis: PGHOST (127.0.0.1) PGPORT (54329) PG_SUPERUSER (supabase_admin) PG_DB (obrigatória:
# banco-fonte) PG_COPIA (padrão: <PG_DB>_teste, apagado antes e depois)
set -uo pipefail
cd "$(dirname "$0")/../.."
export PGHOST="${PGHOST:-127.0.0.1}" PGPORT="${PGPORT:-54329}"
SUPER="${PG_SUPERUSER:-supabase_admin}"
FONTE="${PG_DB:?informe PG_DB (banco com schema+overlay+rls aplicados)}"
COPIA="${PG_COPIA:-${FONTE}_teste}"
[[ "$COPIA" == "postgres" || "$COPIA" == "$FONTE" ]] && { echo "recusado: PG_COPIA=$COPIA" >&2; exit 2; }

psql -U "$SUPER" -d postgres -q -v ON_ERROR_STOP=1 \
  -c "drop database if exists \"$COPIA\" with (force);" \
  -c "create database \"$COPIA\" template \"$FONTE\";" || exit 2
psql -U "$SUPER" -d "$COPIA" -v ON_ERROR_STOP=1 -f scripts/db/testar-rls.sql
status=$?
psql -U "$SUPER" -d postgres -q -c "drop database if exists \"$COPIA\" with (force);" >/dev/null
exit $status
