#!/usr/bin/env bash
# Gera src/integrations/supabase/types.ts a partir do banco que as MIGRAÇÕES constroem (replay num
# PostgreSQL local), não de um banco remoto. Desde o P02 a produção tem a mesma estrutura que o replay
# (ver docs/BANCO_DE_DADOS.md), então os tipos gerados aqui são os da produção.
#
# Usa o mesmo gerador da CLI do Supabase (`supabase gen types typescript`): o @supabase/postgres-meta,
# com versão fixa abaixo para o resultado não mudar sozinho. Instala numa pasta temporária, fora do
# package.json do app.
#
# Pré-requisitos: os de scripts/db/validar-migracoes.sh (PostgreSQL local com superusuário
# supabase_admin; ex.: docker run -p 127.0.0.1:54329:5432 -e POSTGRES_USER=supabase_admin
#   -e POSTGRES_HOST_AUTH_METHOD=trust postgres:17 -c max_locks_per_transaction=1024) e Node 22 (o postgres-meta pede >= 22.12).
#
# Uso:  bash scripts/db/gerar-tipos.sh            # regenera o types.ts
#       bash scripts/db/gerar-tipos.sh --checar   # só compara; sai 1 se o types.ts estiver defasado
# Variáveis: PGHOST/PGPORT/PG_SUPERUSER como no validar-migracoes.sh; PG_DB=idjuv_tipos (APAGADO E RECRIADO).
set -euo pipefail
cd "$(dirname "$0")/../.."

PG_META_VERSAO=0.100.0
POSTGREST_VERSAO=14.1
ALVO=src/integrations/supabase/types.ts

checar=0
case "${1:-}" in
  --checar) checar=1 ;;
  "") ;;
  *) echo "uso: $0 [--checar]" >&2; exit 2 ;;
esac

export PGHOST="${PGHOST:-127.0.0.1}" PGPORT="${PGPORT:-54329}"
SUPER="${PG_SUPERUSER:-supabase_admin}"
DB="${PG_DB:-idjuv_tipos}"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

echo "▸ replay das migrações em $DB"
if ! PG_DB="$DB" SAIDA="$tmp/validar-migracoes" bash scripts/db/validar-migracoes.sh > "$tmp/replay.txt" 2>&1; then
  tail -5 "$tmp/replay.txt" >&2
  echo "replay falhou: os tipos sairiam incompletos (detalhes por arquivo: rode scripts/db/validar-migracoes.sh)" >&2
  exit 1
fi
tail -1 "$tmp/replay.txt"

echo "▸ gerador de tipos (@supabase/postgres-meta@$PG_META_VERSAO)"
npm install --prefix "$tmp/pgmeta" --no-save --no-audit --no-fund --loglevel=error \
  "@supabase/postgres-meta@$PG_META_VERSAO" > /dev/null

PG_META_DB_URL="postgresql://$SUPER@$PGHOST:$PGPORT/$DB" \
PG_META_GENERATE_TYPES=typescript \
PG_META_GENERATE_TYPES_INCLUDED_SCHEMAS=public \
PG_META_GENERATE_TYPES_DETECT_ONE_TO_ONE_RELATIONSHIPS=true \
PG_META_POSTGREST_VERSION="$POSTGREST_VERSAO" \
  node "$tmp/pgmeta/node_modules/@supabase/postgres-meta/dist/server/server.js" \
  > "$tmp/types.ts" 2> "$tmp/gerador.err" \
  || { cat "$tmp/gerador.err" >&2; echo "o gerador de tipos falhou" >&2; exit 1; }
[[ -s "$tmp/types.ts" ]] || { echo "o gerador não produziu nada" >&2; exit 1; }

if (( checar )); then
  if diff -q "$ALVO" "$tmp/types.ts" > /dev/null; then
    echo "OK: $ALVO está igual ao banco das migrações."
  else
    diff -u "$ALVO" "$tmp/types.ts" | head -60 || true
    echo "::error::$ALVO está defasado em relação às migrações. Rode: bash scripts/db/gerar-tipos.sh (ver docs/BANCO_DE_DADOS.md) e commite o arquivo." >&2
    exit 1
  fi
else
  cp "$tmp/types.ts" "$ALVO"
  echo "OK: $ALVO regenerado ($(wc -l < "$ALVO") linhas)."
fi
