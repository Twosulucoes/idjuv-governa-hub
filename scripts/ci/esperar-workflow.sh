#!/usr/bin/env bash
# Espera o workflow <arquivo> terminar com SUCESSO no commit <sha> (uso nos workflows de produção: o deploy do front
# espera o gate, a aplicação das migrações espera o teste do banco). Sai 0 com sucesso, 1 com falha, cancelamento ou
# tempo esgotado.
#
# Uso:  GH_TOKEN=... bash scripts/ci/esperar-workflow.sh <arquivo.yml> <sha> <minutos> [--ultimo-da-main]
#   --ultimo-da-main: se o workflow não rodou neste commit (ex.: commit que não mexeu no banco), vale a execução
#   mais recente na main que seja de um commit ANCESTRAL deste, esperando-a se ainda estiver rodando (precisa do
#   histórico: checkout com fetch-depth: 0). Sem a opção, a falta de execução é falha.
# Só contam execuções de push/workflow_dispatch na branch main: uma execução de pull_request (que roda o YAML do
# próprio PR, inclusive de um fork com branch chamada "main") nunca vale.
# Precisa do gh (já vem no runner) e de `permissions: actions: read`.
set -uo pipefail
arquivo="${1:?workflow}"; sha="${2:?sha}"; minutos="${3:?minutos}"; ultimo="${4:-}"
repo="${GITHUB_REPOSITORY:?}"
fim=$(( $(date +%s) + minutos * 60 ))

DA_MAIN='[.[] | select(.headBranch == "main" and (.event == "push" or .event == "workflow_dispatch"))]'
estado() {  # "<status> <conclusion>" da execução mais recente do workflow neste commit (vazio se não houver)
  gh run list --repo "$repo" --workflow "$arquivo" --commit "$sha" --limit 20 \
    --json status,conclusion,event,headBranch \
    --jq "$DA_MAIN"' | .[0] | select(.) | "\(.status) \(.conclusion)"' 2>/dev/null || true
}

# Dá alguns segundos para o GitHub registrar a execução disparada pelo mesmo push.
for _ in 1 2 3 4 5 6; do [[ -n "$(estado)" ]] && break; sleep 10; done
if [[ -z "$(estado)" ]]; then
  [[ "$ultimo" == "--ultimo-da-main" ]] || { echo "::error::$arquivo não rodou no commit ${sha::7}."; exit 1; }
  # Vale a execução mais recente na main, terminada ou não (uma que espera aprovação é esperada aqui).
  outro=$(gh run list --repo "$repo" --workflow "$arquivo" --branch main --limit 20 \
            --json headSha,event,headBranch --jq "$DA_MAIN"' | .[0].headSha // empty' 2>/dev/null || true)
  [[ -n "$outro" ]] || { echo "::error::$arquivo não rodou em ${sha::7} nem tem execução na main."; exit 1; }
  git merge-base --is-ancestor "$outro" "$sha" 2>/dev/null \
    || { echo "::error::a execução mais recente de $arquivo na main (${outro::7}) não é de um commit anterior a ${sha::7}."; exit 1; }
  echo "$arquivo não rodou em ${sha::7}; vale a execução mais recente na main (${outro::7})."
  sha="$outro"
fi

while :; do
  e="$(estado)"
  case "$e" in
    "completed success") echo "$arquivo passou em ${sha::7}."; exit 0 ;;
    completed*) echo "::error::$arquivo terminou sem sucesso em ${sha::7} ($e)."; exit 1 ;;
  esac
  (( $(date +%s) >= fim )) && { echo "::error::$arquivo não terminou em $minutos minutos (estado: $e)."; exit 1; }
  sleep 30
done
