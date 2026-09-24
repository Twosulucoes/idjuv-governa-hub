#!/usr/bin/env bash
#
# Guard de integridade das migrations do Supabase.
#
# Por que existe: o Supabase indexa a tabela `supabase_migrations.schema_migrations`
# pela VERSÃO (o prefixo numérico do arquivo, ex.: 20260719120000). Se dois
# arquivos de migração compartilham o mesmo prefixo — o que acontece quando dois
# branches paralelos criam uma migração com o mesmo timestamp e ambos são
# mergeados — o `supabase db push` quebra ao aplicar a segunda:
#
#   duplicate key value violates unique constraint "schema_migrations_pkey"
#   Key (version)=(20260719120000) already exists.
#
# O conserto usual (renomear um dos arquivos para uma versão nova) resolve a
# colisão local, MAS se a versão antiga já tiver sido gravada no banco remoto, o
# push seguinte passa a acusar divergência:
#
#   Remote migration versions not found in local migrations directory.
#
# ou seja: um único timestamp duplicado envenena o pipeline de deploy do banco.
# Este guard falha ANTES do merge, quando o conserto ainda é trivial (renomear
# o arquivo em vez de reparar o histórico remoto).
#
# Verificações:
#   1. Nenhum prefixo de versão duplicado entre os arquivos de migração.
#   2. Todo arquivo segue o padrão <14 dígitos>_<slug>.sql.
#
# As ~248 migrações deste repositório (geradas pelo Lovable) já seguem esse
# padrão hoje (checado em 2026-09-24: nenhuma duplicata de versão, nenhum nome
# fora do padrão) — o slug depois do timestamp é um UUID com hífens em boa
# parte delas, e isso é aceito de propósito (ver comentário no passo 2).
#
# Uso: bash scripts/check-migrations.sh   (exit 0 = ok, exit 1 = problema)

set -euo pipefail

MIGRATIONS_DIR="${1:-supabase/migrations}"

if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "::error::Diretório de migrations não encontrado: $MIGRATIONS_DIR"
  exit 1
fi

fail=0

# --- 1. Versões duplicadas -------------------------------------------------
# Extrai o prefixo numérico de cada arquivo e procura repetições.
dupes=$(
  find "$MIGRATIONS_DIR" -maxdepth 1 -name '*.sql' -type f \
    | sed 's#.*/##' \
    | grep -oE '^[0-9]+' \
    | sort \
    | uniq -d || true
)

if [ -n "$dupes" ]; then
  fail=1
  echo "::error::Versões de migração DUPLICADAS (o Supabase usa a versão como PK — o db push vai quebrar):"
  while IFS= read -r v; do
    [ -z "$v" ] && continue
    echo "  versão $v é usada por:"
    find "$MIGRATIONS_DIR" -maxdepth 1 -name "${v}_*.sql" -type f | sed 's#.*/#    - #'
  done <<< "$dupes"
  echo "  Conserte renomeando UM dos arquivos para um timestamp posterior e único"
  echo "  (ex.: incremente os minutos/segundos), preservando a ordem relativa."
fi

# --- 2. Padrão de nome ------------------------------------------------------
# Exige apenas o prefixo de 14 dígitos + separador — o suficiente para que a
# versão seja extraível (e a checagem de duplicidade acima seja confiável). O
# slug em si é livre: as migrations deste repo (geradas pelo Lovable) usam
# majoritariamente UUID com hífens como slug, e isso é legítimo.
while IFS= read -r f; do
  base=$(basename "$f")
  if ! printf '%s' "$base" | grep -qE '^[0-9]{14}_.+\.sql$'; then
    fail=1
    echo "::error::Migração sem prefixo de versão <14 dígitos>_ : $base"
  fi
done < <(find "$MIGRATIONS_DIR" -maxdepth 1 -name '*.sql' -type f)

if [ "$fail" -eq 0 ]; then
  count=$(find "$MIGRATIONS_DIR" -maxdepth 1 -name '*.sql' -type f | wc -l | tr -d ' ')
  echo "✅ Migrations OK: $count arquivos, nenhuma versão duplicada."
fi

exit "$fail"
