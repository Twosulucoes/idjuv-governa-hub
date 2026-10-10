# Plano — Onda B / B1: segurança da folha no banco

Spec: [`2026-10-10-onda-b-folha-seguranca-design.md`](../specs/2026-10-10-onda-b-folha-seguranca-design.md).
Migração: `supabase/migrations/20261010070000_onda_b_folha_rls_permissao.sql`.

| # | Tarefa | Agente | Verificação |
|---|---|---|---|
| 1 | Classe `permissao` em `scripts/db/gerar-rls.mjs` (extra `escrita=<código>[;proprio|;pai=<t>.<fk>]`); `mapa.csv` das 10 tabelas da folha; regenerar `35_policies_geradas.sql` | dev-banco-supabase | `node scripts/db/gerar-rls.mjs --check` verde; diff do SQL só nas 10 tabelas |
| 2 | `scripts/db/testar-rls.sql`: persona "módulo rh + permissão" e asserções da classe `permissao`; `processar_folha_pagamento` passa a ser "executável com guarda" | dev-banco-supabase | `PG_DB=idjuv_baseline bash scripts/db/testar-rls.sh` aprovado (após aplicar a migração na cópia) |
| 3 | Migração: funções-base (overlays 10/18), policies das 10 tabelas (DROP dos dois estados + CREATE geradas), `processar_folha_pagamento` com guarda + GRANT, triggers BEFORE INSERT, índice condicional, auditoria, catálogo → `rh` | dev-banco-supabase | `psql -f` na cópia do baseline sem erro, duas vezes (idempotente); replay `scripts/db/validar-migracoes.sh` |
| 4 | Front: `requiredModule`/`requiredPermissions` nas 6 rotas `/folha*`; códigos de folha de `MODULE_PERMISSIONS.financeiro` → `.rh` | dev-frontend-idjuv | `npx tsc -p tsconfig.app.json`, `npm run lint` sem erro novo |
| 5 | Revisão: `revisor-seguranca-idjuv` (migração + testes) e `revisor-codigo-idjuv` | — | sem bloqueantes |
| 6 | Docs: `RBAC_PERMISSOES.md` (folha: o que a RLS exige, consulta pós-merge), `BANCO_DE_DADOS.md` (classe `permissao`), `supabase/baseline/README.md` (classe), `FINALIZACAO.md` (itens 8/9 parciais), `ROADMAP.md` | documentador-idjuv | `node scripts/check-doc-links.mjs` |
| 7 | `bash scripts/gate.sh`; commit; PR rascunho | — | gate verde lido |
