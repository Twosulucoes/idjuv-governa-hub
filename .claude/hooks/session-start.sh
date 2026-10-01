#!/bin/bash
# Em sessões remotas (web), instala dependências para lint/build funcionarem.
set -euo pipefail
[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0
cd "$CLAUDE_PROJECT_DIR"
[ -d node_modules ] || npm install --no-package-lock --no-audit --no-fund
