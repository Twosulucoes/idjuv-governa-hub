#!/bin/bash
# Em sessões remotas (web), prepara o ambiente de desenvolvimento:
#  1. instala dependências para lint/build/gate funcionarem;
#  2. gera o .env a partir das variáveis VITE_* do ambiente de nuvem (se definidas),
#     para `npm run dev` conectar no Supabase de desenvolvimento;
#  3. imprime um resumo curto do ambiente (vira contexto da sessão).
set -euo pipefail
[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0
cd "$CLAUDE_PROJECT_DIR"
[ -d node_modules ] || npm install --no-package-lock --no-audit --no-fund >/dev/null 2>&1 || echo "AVISO: npm install falhou"

if [ ! -f .env ] && [ -n "${VITE_SUPABASE_URL:-}" ] && [ -n "${VITE_SUPABASE_PUBLISHABLE_KEY:-}" ]; then
  {
    echo "# Gerado por .claude/hooks/session-start.sh a partir do ambiente de nuvem — não versionar."
    echo "VITE_SUPABASE_URL=${VITE_SUPABASE_URL}"
    echo "VITE_SUPABASE_PUBLISHABLE_KEY=${VITE_SUPABASE_PUBLISHABLE_KEY}"
    echo "VITE_SUPABASE_PROJECT_ID=${VITE_SUPABASE_PROJECT_ID:-}"
    echo "VITE_TENANT_SLUG=${VITE_TENANT_SLUG:-idjuv}"
  } > .env
fi

echo "Ambiente IDJUV (sessão em nuvem):"
if [ -f .env ]; then
  echo "- .env presente: o app roda com 'npm run dev' (Vite em http://localhost:8080)."
else
  echo "- Sem .env: o app não conecta no Supabase. Defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY nas variáveis do ambiente de nuvem (ver docs/DESENVOLVIMENTO.md, seção 'Ambiente de desenvolvimento em nuvem'). Lint, typecheck e build funcionam mesmo assim."
fi
echo "- Gerador de prompts: /prompt <tipo> --modulo <codigo> <descrição>, /pendencias, /finalizar <codigo> (ver prompts/README.md)."
