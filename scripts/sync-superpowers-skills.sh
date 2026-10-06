#!/usr/bin/env bash
# Vendoriza os skills de processo do Superpowers (obra/superpowers, MIT) em
# .claude/skills/, para que o fluxo estruturado exista em TODA sessão do Claude
# Code neste repositório — inclusive em sessões web/remotas, onde plugins não
# são instalados automaticamente. Nunca edite as cópias à mão: rode este script.
#
# Uso:
#   bash scripts/sync-superpowers-skills.sh            # clona a branch principal
#   SUPERPOWERS_REF=v6.4.2 bash scripts/sync-superpowers-skills.sh
#   SUPERPOWERS_SRC=/caminho/local bash scripts/sync-superpowers-skills.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="$ROOT/.claude/skills"

# `using-superpowers`, `writing-skills` e `diagnosing-superpowers` ficam de fora:
# o gatilho "invoque antes de responder" mora no CLAUDE.md + skill `superpowers`.
SKILLS=(
  brainstorming
  writing-plans
  executing-plans
  subagent-driven-development
  dispatching-parallel-agents
  verification-before-completion
  test-driven-development
  requesting-code-review
  receiving-code-review
  finishing-a-development-branch
  using-git-worktrees
  systematic-debugging
)

if [ -n "${SUPERPOWERS_SRC:-}" ]; then
  CLONE="$SUPERPOWERS_SRC"
else
  CLONE="$(mktemp -d)"; trap 'rm -rf "$CLONE"' EXIT
  git clone --depth 1 ${SUPERPOWERS_REF:+--branch "$SUPERPOWERS_REF"} https://github.com/obra/superpowers.git "$CLONE" >/dev/null 2>&1
fi
SRC="$CLONE/skills"
VERSION="$(sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' "$CLONE/package.json" | head -1)"
[ -d "$SRC" ] || { echo "skills/ não encontrado em $CLONE" >&2; exit 1; }

for s in "${SKILLS[@]}"; do
  [ -d "$SRC/$s" ] || { echo "Skill $s não existe na versão $VERSION" >&2; exit 1; }
  rm -rf "${DEST:?}/$s"
  cp -R "$SRC/$s" "$DEST/$s"
  # No plugin os skills se chamam `superpowers:<nome>`; como skill de projeto, `<nome>`.
  find "$DEST/$s" -type f -name '*.md' -print0 | xargs -0 sed -i -E 's/superpowers:([a-z-]+)/\1/g'
done
cp "$CLONE/LICENSE" "$DEST/SUPERPOWERS-LICENSE"

cat > "$DEST/SUPERPOWERS-VENDOR.md" <<MD
# Skills vendorizados do Superpowers

Origem: https://github.com/obra/superpowers (MIT, © Jesse Vincent — ver \`SUPERPOWERS-LICENSE\`)
Versão: $VERSION · sincronizado em $(date -u +%Y-%m-%d) por \`scripts/sync-superpowers-skills.sh\`

Cópias fiéis, com uma única alteração mecânica: referências \`superpowers:<skill>\`
viram \`<skill>\`. **Não edite estas pastas**; rode o script para atualizar.

$(for s in "${SKILLS[@]}"; do echo "- \`$s\`"; done)

Skills próprios do IDJUV (não vêm do Superpowers): \`superpowers\` (orquestrador do
fluxo, em português), \`novo-modulo-idjuv\`, \`migracao-segura-idjuv\`,
\`auditoria-seguranca-idjuv\`, \`onboarding-cliente-idjuv\`.
MD
echo "Sincronizado: ${#SKILLS[@]} skills da versão $VERSION em $DEST"
