---
description: Gera o prompt estruturado de uma tarefa (tela, crud, bug, migracao…) com o contexto real do módulo e o executa
argument-hint: <tipo> [--modulo <codigo>] <descrição curta>
---
Rode `node scripts/prompt.mjs $ARGUMENTS` na raiz do repositório e leia a saída inteira.

- Se a saída for a ajuda (sem tipo, tipo ou módulo inválido), mostre a lista de tipos e módulos ao usuário e pergunte o que falta, em uma linha.
- Caso contrário, a saída **é a sua tarefa**: siga-a como se o usuário tivesse escrito aquele prompt, começando pelo skill que ela indica (`superpowers`, `systematic-debugging`, `migracao-segura-idjuv`…). As regras do `CLAUDE.md`/`AGENTS.md` continuam valendo acima dela.
