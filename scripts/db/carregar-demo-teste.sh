#!/usr/bin/env bash
# Carrega os dados de DEMONSTRAÇÃO (supabase/baseline/dados-demo/*.sql) no banco do AMBIENTE DE TESTE,
# rodando o psql dentro do container do Postgres de teste. O banco precisa já ter o baseline e o
# dados-teste.sql (o montar-ambiente-teste.sh faz isso e chama este script no fim).
#
#   bash scripts/db/carregar-demo-teste.sh <container-do-db-de-teste>
#   ex.: bash scripts/db/carregar-demo-teste.sh supabase-db-gxdtyi29hkfxjclgnfbtg58l
#
# Recusa o container `supabase-db` (o da produção). Cada arquivo é uma transação e tem trava própria:
# recusa banco sem o dados-teste e recusa carregar o mesmo módulo duas vezes (aqui, o módulo já
# carregado é pulado, então dá para rodar de novo depois de uma falha). Guia: docs/NOVO_BANCO.md §9.
set -euo pipefail
cd "$(dirname "$0")/../../supabase/baseline/dados-demo"

CT="${1:-}"
[[ -n "$CT" ]] || { echo "uso: $0 <container-do-db-de-teste>" >&2; exit 2; }
[[ "$CT" != "supabase-db" ]] || { echo "recusado: supabase-db é o banco da produção" >&2; exit 2; }
docker inspect "$CT" >/dev/null 2>&1 || { echo "container $CT não encontrado (docker ps)" >&2; exit 2; }

for f in [0-9][0-9]_*.sql; do
  echo "== $f"
  # módulo já carregado (a trava do arquivo recusa): segue para o próximo, para dar para retomar
  if ! saida=$(docker exec -i -e PGOPTIONS='-c client_min_messages=warning' "$CT" \
      psql -U postgres -d postgres -X -q -v ON_ERROR_STOP=1 -v confirmo=banco_de_teste < "$f" 2>&1 >/dev/null); then
    if grep -q "já foram carregados" <<<"$saida"; then echo "   já carregado, pulando"; continue; fi
    echo "$saida" >&2; exit 1
  fi
done
echo
echo "Pronto: dados de demonstração carregados em $CT."
