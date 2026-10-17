#!/usr/bin/env bash
# Pede ao Coolify o deploy de um app e espera terminar. Uso: deploy-coolify.sh <uuid-do-app> [minutos=20]
# Requer COOLIFY_URL (ex.: https://coolify.twosolucoes.online) e COOLIFY_TOKEN (token de API com permissão
# de deploy). O Coolify baixa a main do GitHub e builda com o Dockerfile da raiz (ver docs/DESENVOLVIMENTO.md).
set -euo pipefail
uuid="${1:?uuid do app}"
limite=$(( ${2:-20} * 60 ))
api="${COOLIFY_URL%/}/api/v1"
auth=(-H "Authorization: Bearer ${COOLIFY_TOKEN:?COOLIFY_TOKEN}" -H "Accept: application/json")

resp=$(curl -fsS -X POST "${auth[@]}" "$api/deploy?uuid=$uuid&force=false")
dep=$(printf '%s' "$resp" | jq -r '.deployments[0].deployment_uuid // empty')
[ -n "$dep" ] || { echo "::error::Coolify não aceitou o deploy de $uuid: $resp"; exit 1; }
echo "Deploy $dep do app $uuid pedido ao Coolify."

inicio=$SECONDS
while (( SECONDS - inicio < limite )); do
  status=$(curl -fsS "${auth[@]}" "$api/deployments/$dep" | jq -r '.status')
  case "$status" in
    finished) echo "Deploy $dep terminou."; exit 0 ;;
    failed|cancelled*) echo "::error::Deploy $dep do app $uuid terminou como $status (log no painel do Coolify)."; exit 1 ;;
  esac
  sleep 15
done
echo "::error::Deploy $dep do app $uuid passou de $(( limite / 60 )) minutos (status: $status)."
exit 1
