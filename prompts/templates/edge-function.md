---
descricao: Edge Function (Deno) nova ou alterada no Supabase
---
Use o skill `supabase` (agente `dev-banco-supabase`).

## Pedido
{{descricao}}

## Módulo
{{modulo}}

## Como executar
- Leia `docs/EDGE_FUNCTIONS.md` e uma função vizinha em `supabase/functions/` como modelo.
- Valide o JWT do chamador e o papel/permissão no banco antes de agir; service role só no servidor.
- Segredos via `supabase secrets` — nada em `src/`, `.env` do front ou docs. Não logue token nem dado pessoal.
- **Não faça deploy** sem "sim" explícito do usuário.

## Pronto quando
- `docs/EDGE_FUNCTIONS.md` atualizado; revisão `revisor-seguranca-idjuv` sem bloqueantes; `bash scripts/gate.sh` verde; PR rascunho.
