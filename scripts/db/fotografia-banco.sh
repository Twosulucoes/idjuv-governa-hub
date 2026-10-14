#!/usr/bin/env bash
# Fotografia da ESTRUTURA do banco: reconstrói num PostgreSQL local o banco das migrações (replay) e o do
# baseline, tira a fotografia de cada um (scripts/db/fotografia-schema.sql) e, se FOTO_PROD_URL estiver
# definida, também a da produção, em modo só leitura. Depois compara e escreve o relatório.
#
# Responde à pergunta "a produção é o que as migrações produzem?" e mostra, para cada diferença, se a
# produção bate com o baseline (correção que só existe no baseline) ou com nenhum dos dois (ajuste à mão).
# Nenhum dado de tabela é lido: só o catálogo do Postgres e a lista de versões de schema_migrations.
#
# Pré-requisitos: os de scripts/db/validar-migracoes.sh (PostgreSQL local, superusuário que NÃO se chama
# `postgres`), node e psql.
# Variáveis: PGHOST (127.0.0.1) PGPORT (54329) PG_SUPERUSER (supabase_admin)
#            FOTO_SAIDA (/tmp/fotografia-banco)  FOTO_PROD_URL (opcional; URL da produção, sem senha)
#            FOTO_PROD_SENHA (opcional; senha da produção, passada só por PGPASSWORD)
# Apaga e recria os bancos locais idjuv_foto_replay e idjuv_foto_baseline.
#
# Uso: bash scripts/db/fotografia-banco.sh      -> relatório em $FOTO_SAIDA/relatorio.md
set -euo pipefail
cd "$(dirname "$0")/../.."

export PGHOST="${PGHOST:-127.0.0.1}" PGPORT="${PGPORT:-54329}"
SUPER="${PG_SUPERUSER:-supabase_admin}"
SAIDA="${FOTO_SAIDA:-/tmp/fotografia-banco}"
REPLAY=idjuv_foto_replay
BASE=idjuv_foto_baseline
[[ "$SAIDA" == *fotografia* ]] || { echo "recusado: FOTO_SAIDA=$SAIDA (precisa conter 'fotografia'; o script apaga o diretório)" >&2; exit 2; }
rm -rf "$SAIDA"; mkdir -p "$SAIDA"

# Cada leitura é UMA transação (-1) aberta em só leitura e com tempo limite: vale também atrás de pooler
# em modo transação, e um comando de escrita é recusado pelo Postgres.
SO_LEITURA="set transaction read only; set local statement_timeout = '120s'; set local lock_timeout = '5s'"
foto() {  # foto <conexão...> <arquivo>: fotografia num arquivo tsv
  local destino="${*: -1}"
  psql "${@:1:$#-1}" -X -q -At -F $'\t' -v ON_ERROR_STOP=1 -1 -c "$SO_LEITURA" -f scripts/db/fotografia-schema.sql > "$destino"
}

echo "▸ replay das migrações"
# Migração que falha no replay não derruba a fotografia: é justamente quando ela mais ajuda.
replay_status=0
PG_DB=$REPLAY SAIDA="$SAIDA/validar-migracoes" bash scripts/db/validar-migracoes.sh > "$SAIDA/replay.txt" 2>&1 || replay_status=$?
tail -3 "$SAIDA/replay.txt"
(( replay_status <= 1 )) || { echo "replay não montou o banco (código $replay_status)" >&2; exit 1; }
[[ -f "$SAIDA/validar-migracoes/resumo.tsv" ]] && cp "$SAIDA/validar-migracoes/resumo.tsv" "$SAIDA/replay-resumo.tsv"

echo "▸ baseline"
psql -U "$SUPER" -d postgres -q -v ON_ERROR_STOP=1 \
  -c "drop database if exists $BASE with (force);" -c "create database $BASE;" 2>&1 | grep -v NOTICE || true
out=$(psql -U "$SUPER" -d $BASE -q -v ON_ERROR_STOP=1 -f scripts/db/shim-supabase.sql 2>&1) \
  || { echo "$out" | grep -v -E "NOTICE|wal_level|HINT"; echo "falha ao instalar o shim no baseline" >&2; exit 1; }
psql -U "$SUPER" -d $BASE -q -v ON_ERROR_STOP=1 \
  -c "alter database $BASE owner to postgres; alter schema public owner to postgres; grant all on schema public to postgres;"
PGUSER=postgres PGDATABASE=$BASE bash supabase/baseline/aplicar.sh > "$SAIDA/baseline-aplicar.txt" 2>&1 \
  || { tail -20 "$SAIDA/baseline-aplicar.txt"; echo "aplicar.sh do baseline falhou" >&2; exit 1; }

echo "▸ fotografias"
foto -U "$SUPER" -d $REPLAY "$SAIDA/migracoes.tsv"
foto -U "$SUPER" -d $BASE "$SAIDA/baseline.tsv"
extra=()
if [[ -n "${FOTO_PROD_URL:-}" ]]; then
  export PGPASSWORD="${FOTO_PROD_SENHA:-}"
  foto "$FOTO_PROD_URL" "$SAIDA/producao.tsv"
  psql "$FOTO_PROD_URL" -X -q -At -v ON_ERROR_STOP=1 -1 -c "$SO_LEITURA" \
    -c "select version from supabase_migrations.schema_migrations order by 1" > "$SAIDA/historico-producao.txt"
  unset PGPASSWORD
  extra=(--producao "$SAIDA/producao.tsv" --historico "$SAIDA/historico-producao.txt")
fi

if (( replay_status == 1 )); then
  extra+=(--aviso "O replay das migrações teve falhas (ver replay-resumo.tsv): a coluna migrações está incompleta.")
fi
node scripts/db/comparar-fotografias.mjs --replay "$SAIDA/migracoes.tsv" --baseline "$SAIDA/baseline.tsv" \
  "${extra[@]}" --contagens "$SAIDA/contagens.md" > "$SAIDA/relatorio.md"
echo "relatório: $SAIDA/relatorio.md"
