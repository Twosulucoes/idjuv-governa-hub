#!/usr/bin/env bash
# Gate de qualidade local do IDJUV Governa Hub: typecheck, lint e build.
# O repo tem dívida histórica (erros de tipo/lint), então typecheck e lint comparam
# com scripts/gate-baseline.json: falham só se o número de erros AUMENTAR.
# Quando reduzir a dívida, rode: bash scripts/gate.sh --update-baseline
# Antes disso rodam três guards baratos (migrações sem versão duplicada, docs sem
# referência quebrada, RLS do baseline em dia com o mapa), que falham em qualquer
# ocorrência — não têm baseline.
# Roda no pre-push (.githooks/pre-push) e no CI (.github/workflows/quality.yml).
# Não há suíte de testes. Uso: bash scripts/gate.sh  (ou: npm run gate)
set -uo pipefail
cd "$(dirname "$0")/.."

VERDE='\033[0;32m'; VERMELHO='\033[0;31m'; AMARELO='\033[0;33m'; SEM='\033[0m'
BASE=scripts/gate-baseline.json
falhas=(); inicio=$(date +%s)

[ -d node_modules ] || { echo "node_modules ausente: rode 'bun install' ou 'npm install --no-package-lock'" >&2; exit 2; }

ts_erros()   { npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep -c "error TS" || true; }
lint_erros() { npx eslint . -f json 2>/dev/null | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(JSON.parse(s).reduce((a,f)=>a+f.errorCount,0))}catch{console.log(-1)}})'; }
lido()       { node -e "console.log(require('./$BASE').$1)"; }

if [ "${1:-}" = "--update-baseline" ]; then
  printf '{\n  "typecheck": %s,\n  "lint": %s\n}\n' "$(ts_erros)" "$(lint_erros)" > "$BASE"
  echo "Baseline atualizada:"; cat "$BASE"; exit 0
fi

comparar() { # nome, atual, chave-da-baseline
  local nome="$1" atual="$2" max; max=$(lido "$3")
  printf "\n${AMARELO}▸ %s${SEM}: %s erros (baseline %s)\n" "$nome" "$atual" "$max"
  if [ "$atual" -lt 0 ]; then printf "${VERMELHO}  ✘ %s não executou${SEM}\n" "$nome"; falhas+=("$nome")
  elif [ "$atual" -le "$max" ]; then printf "${VERDE}  ✔ %s${SEM}\n" "$nome"
  else printf "${VERMELHO}  ✘ %s piorou (+%s)${SEM}\n" "$nome" "$((atual-max))"; falhas+=("$nome"); fi
}

guard() { # nome, comando...
  local nome="$1"; shift
  printf "\n${AMARELO}▸ %s${SEM}\n" "$nome"
  if "$@"; then printf "${VERDE}  ✔ %s${SEM}\n" "$nome"
  else printf "${VERMELHO}  ✘ %s${SEM}\n" "$nome"; falhas+=("$nome"); fi
}

guard "migrações sem versão duplicada" bash scripts/check-migrations.sh
guard "docs sem referência quebrada" node scripts/check-doc-links.mjs
guard "RLS do baseline em dia com o mapa" node scripts/db/gerar-rls.mjs --check

comparar "typecheck" "$(ts_erros)" typecheck
comparar "lint" "$(lint_erros)" lint

printf "\n${AMARELO}▸ build${SEM}\n"
if npx vite build >/tmp/gate-build.log 2>&1; then printf "${VERDE}  ✔ build${SEM}\n"
else tail -30 /tmp/gate-build.log; printf "${VERMELHO}  ✘ build${SEM}\n"; falhas+=("build"); fi

printf "\n────────────────────────────────────────\n"
duracao=$(( $(date +%s) - inicio ))
if [ ${#falhas[@]} -eq 0 ]; then printf "${VERDE}Gate verde em %ss.${SEM}\n" "$duracao"; exit 0; fi
printf "${VERMELHO}Gate vermelho em %ss:${SEM}\n" "$duracao"
for f in "${falhas[@]}"; do printf "  ${VERMELHO}• %s${SEM}\n" "$f"; done
exit 1
