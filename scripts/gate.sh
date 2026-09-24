#!/usr/bin/env bash
# ============================================================================
# Gate de qualidade LOCAL — os mesmos checks do .github/workflows/quality.yml.
#
# Este repositório nunca teve CI (primeira vez que os workflows em
# .github/workflows/ existem — ver docs/GOVERNANCA-DOCUMENTACAO.md §6).
# Enquanto isso, e mesmo depois, este script roda na sua máquina antes do
# push, via .githooks/pre-push (instalado automaticamente por `npm install`,
# através do script `prepare` do package.json).
#
# Não há suíte de testes automatizados configurada neste projeto — a
# checagem de tipos roda dentro do `build` (tsc via Vite), não como passo
# isolado.
#
# Ordem deliberada: o que falha em segundos vem antes do que leva mais tempo.
# `set -e`: para no primeiro erro (mais simples que colecionar falhas — o
# objetivo aqui é feedback rápido no pre-push, não um relatório completo).
#
# Uso:
#   npm run gate              # roda tudo
#   bun run gate
#   git push                  # roda via .githooks/pre-push
#   git push --no-verify      # pula (desaconselhado — ver CONTRIBUTING.md)
# ============================================================================

set -e
cd "$(dirname "$0")/.."

RUN="npm run --silent"
if command -v bun >/dev/null 2>&1 && [ -f bun.lockb -o -f bun.lock ]; then
  RUN="bun run"
fi

VERDE='\033[0;32m'; VERMELHO='\033[0;31m'; AMARELO='\033[0;33m'; SEM='\033[0m'
inicio=$(date +%s)

executar() {
  local nome="$1"; shift
  printf "\n${AMARELO}▸ %s${SEM}\n" "$nome"
  if "$@"; then
    printf "${VERDE}  ✔ %s${SEM}\n" "$nome"
  else
    printf "${VERMELHO}  ✘ %s${SEM}\n" "$nome"
    printf "\n${VERMELHO}Gate vermelho em \"%s\".${SEM} Corrija antes de enviar.\n" "$nome"
    printf "Para pular conscientemente: git push --no-verify\n"
    exit 1
  fi
}

executar "migrations sem versão duplicada" $RUN check:migrations
executar "docs sem referência quebrada"    $RUN check:docs
executar "lint"                            $RUN lint
executar "build"                           $RUN build

duracao=$(( $(date +%s) - inicio ))
printf "\n────────────────────────────────────────\n"
printf "${VERDE}Gate verde em %ss.${SEM}\n" "$duracao"
