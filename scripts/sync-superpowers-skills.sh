#!/usr/bin/env bash
# Vendoriza os skills do plugin Superpowers (obra/superpowers, MIT) em
# .claude/skills/, para que o fluxo estruturado (brainstorming → plano →
# aprovação → execução por subagentes → verificação) exista em TODA sessão do
# Claude Code neste repositório — inclusive nas sessões web/remotas, onde um
# plugin declarado em configuração não é instalado automaticamente.
#
# Por que copiar em vez de depender do plugin: skill de projeto (.claude/skills)
# carrega em qualquer ambiente; plugin depende da máquina. O custo é manter a
# cópia em dia — este script é o único jeito de atualizar (nunca edite as
# cópias à mão; a mudança some na próxima sincronização).
#
# Uso:
#   npm run sync:superpowers            # usa a versão mais nova do cache local
#   bun run sync:superpowers
#   SUPERPOWERS_VERSION=6.4.1 npm run sync:superpowers
#
# Pré-requisito (uma vez por máquina):
#   claude plugin marketplace add obra/superpowers-marketplace
#   claude plugin install superpowers@superpowers-marketplace
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="$ROOT/.claude/skills"
CACHE="${SUPERPOWERS_CACHE:-$HOME/.claude/plugins/cache/superpowers-marketplace/superpowers}"

# Skills de processo que o orquestrador `.claude/skills/superpowers/SKILL.md`
# encadeia. `using-superpowers`, `writing-skills` e `diagnosing-superpowers`
# ficam de fora: o gatilho "invoque antes de responder" mora no CLAUDE.md.
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

if [ ! -d "$CACHE" ]; then
  echo "Cache do plugin não encontrado em $CACHE" >&2
  echo "Instale antes:  claude plugin marketplace add obra/superpowers-marketplace && claude plugin install superpowers@superpowers-marketplace" >&2
  exit 1
fi

VERSION="${SUPERPOWERS_VERSION:-$(ls "$CACHE" | sort -V | tail -1)}"
SRC="$CACHE/$VERSION/skills"
[ -d "$SRC" ] || { echo "Versão $VERSION não existe em $CACHE" >&2; exit 1; }

for s in "${SKILLS[@]}"; do
  [ -d "$SRC/$s" ] || { echo "Skill $s não existe na versão $VERSION" >&2; exit 1; }
  rm -rf "${DEST:?}/${s:?}"
  cp -R "$SRC/$s" "$DEST/$s"
  # No plugin os skills se chamam `superpowers:<nome>`; como skill de projeto
  # o nome é só `<nome>`. Reescreve as referências cruzadas.
  find "$DEST/$s" -type f -name '*.md' -print0 \
    | xargs -0 sed -i -E 's/superpowers:([a-z-]+)/\1/g'
done

cat > "$DEST/SUPERPOWERS-VENDOR.md" <<EOF
# Skills vendorizados do Superpowers

Origem: https://github.com/obra/superpowers (MIT, © Jesse Vincent)
Versão: $VERSION · sincronizado em $(date -u +%Y-%m-%d) por \`scripts/sync-superpowers-skills.sh\`

Cópias fiéis, com uma única alteração mecânica: referências \`superpowers:<skill>\`
viram \`<skill>\` (skill de projeto não tem namespace). **Não edite estas pastas**;
rode \`npm run sync:superpowers\` (ou \`bun run sync:superpowers\`) para atualizar.

$(for s in "${SKILLS[@]}"; do echo "- \`$s\`"; done)

Skills próprios do IDJUV Governa Hub (não vêm do plugin): \`superpowers\`
(orquestrador do fluxo, em português), \`auditoria-seguranca-idjuv\`,
\`migracao-segura-idjuv\`, \`novo-modulo-idjuv\`, \`onboarding-cliente-idjuv\`.
EOF

echo "Sincronizado: ${#SKILLS[@]} skills da versão $VERSION em $DEST"
