---
description: Relatório do que falta no sistema (ou num módulo) — menu sem rota, rota sem guard, páginas placeholder/TODO
argument-hint: [--modulo <codigo>]
---
Rode `node scripts/prompt.mjs pendencias $ARGUMENTS` na raiz do repositório.

Mostre o relatório ao usuário resumido por módulo (só o que tem pendência) e, para cada pendência, confirme no código se é real antes de afirmar. Termine sugerindo os próximos passos já no formato `/prompt <tipo> --modulo <codigo> <descrição>` ou `/finalizar <codigo>`. Não altere código.
