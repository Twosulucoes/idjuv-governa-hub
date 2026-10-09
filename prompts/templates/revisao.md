---
descricao: Revisão de qualidade e segurança de um módulo ou da branch atual (sem mudar código)
descricao_padrao: O módulo inteiro (ou a branch atual, se nenhum módulo for informado).
---
Revise sem alterar código. Agentes: `revisor-codigo-idjuv` e `revisor-seguranca-idjuv`; skill `auditoria-seguranca-idjuv`.

## Escopo
{{descricao}}

## Módulo
{{modulo}}

## Contexto atual do módulo (gerado do código em {{data}})
{{contexto_modulo}}

## Como executar
- Cada achado com `arquivo:linha`, evidência, severidade (bloqueante / importante / menor) e correção sugerida.
- Separe o que é risco real (RLS aberta, rota sem permissão, secret, XSS, dado pessoal exposto) de estilo.
- Termine com a lista priorizada, cada item já como `npm run prompt -- <tipo> --modulo <codigo> "<descrição>"`.
