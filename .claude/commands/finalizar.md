---
description: Levanta o que falta para um módulo ficar pronto e grava o plano em docs/planejamento/FINALIZACAO.md
argument-hint: <codigo-do-modulo> [observações]
---
O primeiro argumento de `$ARGUMENTS` é o código do módulo; o resto são observações.

Rode `node scripts/prompt.mjs finalizar-modulo --modulo <codigo> <observações>` na raiz do repositório e siga a saída como sua tarefa. Se não houver módulo, rode `node scripts/prompt.mjs` e pergunte qual dos módulos listados finalizar primeiro.
