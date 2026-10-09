---
descricao: Correção de bug (reproduzir, causa raiz, correção mínima)
---
Use o skill `systematic-debugging`.

## Sintoma relatado
{{descricao}}

## Módulo
{{modulo}}

## Contexto atual do módulo (gerado do código em {{data}})
{{contexto_modulo}}

## Como executar
1. Reproduza (rode o app, a query ou o trecho isolado) e registre a evidência.
2. Ache a causa raiz antes de mexer; se for RLS/permissão, confira policy **e** `ROUTE_PERMISSIONS`.
3. Correção mínima no lugar certo (hook/RPC, não remendo na tela). Mudança em `ProtectedRoute`/`AuthContext`/RLS existente exige confirmação do usuário.
4. Mostre o mesmo cenário funcionando depois da correção.

## Pronto quando
- Causa explicada em uma frase; `bash scripts/gate.sh` verde; PR rascunho com antes/depois.
