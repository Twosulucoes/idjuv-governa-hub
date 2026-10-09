# Plano — avisos e datas importantes

Spec: [`../specs/2026-10-09-avisos-e-datas-importantes-design.md`](../specs/2026-10-09-avisos-e-datas-importantes-design.md).
Execução em linha (uma sessão), com revisão por `revisor-codigo-idjuv` e `revisor-seguranca-idjuv` no fim.

| # | Tarefa | Arquivos | Verificação |
|---|---|---|---|
| 1 | Migração com RLS, RPC de aniversariantes e permissão | `supabase/migrations/20261009120000_avisos_e_datas_importantes.sql` | Aplica em Postgres puro com stubs das funções de acesso; guard de migrações |
| 2 | Baseline: declarar tabelas novas no mapa de RLS | `supabase/baseline/rls/mapa.csv` (classe `preservar`) | `node scripts/db/gerar-rls.mjs --check` |
| 3 | Tipos | `src/types/avisos.ts` | typecheck |
| 4 | Hooks | `src/hooks/useAvisos.ts`, `src/hooks/useDatasImportantes.ts` | typecheck + lint |
| 5 | Componentes | `src/components/avisos/*` | typecheck + lint |
| 6 | Página, rota, menu, sino e destaque no layout | `src/pages/avisos/AvisosPage.tsx`, `src/App.tsx`, `src/types/auth.ts`, `src/config/module-menus.config.ts`, `src/config/menu.config.ts`, `src/components/layout/ModuleHeader.tsx`, `src/components/layout/ModuleLayout.tsx` | build + tela rodando (mobile 390px e desktop) |
| 7 | Docs da matriz | `docs/MODULOS.md`, `docs/BANCO_DE_DADOS.md`, `docs/RBAC_PERMISSOES.md`, `docs/planejamento/ROADMAP.md` | guard de links |
| 8 | Gate e PR rascunho | — | `bash scripts/gate.sh` verde |
