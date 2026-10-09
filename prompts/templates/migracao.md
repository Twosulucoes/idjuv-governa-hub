---
descricao: Mudança de banco (tabela, coluna, view, RPC) com RLS desde a migração
---
Use os skills `migracao-segura-idjuv` e `supabase-postgres-best-practices` (agente `dev-banco-supabase`).

## Pedido
{{descricao}}

## Módulo
{{modulo}}

## Contexto atual do módulo (gerado do código em {{data}})
{{contexto_modulo}}

## Como executar
- Inspecione antes: `docs/BANCO_DE_DADOS.md`, migrações relacionadas em `supabase/migrations/` e, se houver acesso, `list_tables`.
- Arquivo novo `supabase/migrations/<14 dígitos>_<slug>.sql`; nunca edite migração antiga.
- RLS + políticas na mesma migração; funções com `search_path` fixo e `GRANT EXECUTE` mínimo.
- Se o baseline (`supabase/baseline/`) precisar acompanhar, atualize `rls/mapa.csv` e rode `npm run check:rls`.
- **Não aplique em projeto remoto** sem "sim" explícito do usuário.

## Pronto quando
- `bash scripts/gate.sh` verde (inclui `check:migrations`); `docs/BANCO_DE_DADOS.md` atualizado; revisão `revisor-seguranca-idjuv` sem bloqueantes; PR rascunho.
