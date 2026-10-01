# AGENTS.md

Instruções para agentes de IA (Claude Code, Codex, Cursor, etc.) neste repositório.
O contexto completo está em [`CLAUDE.md`](./CLAUDE.md) e em [`docs/`](./docs/README.md) — leia antes de alterar código.

## Resumo

- **Projeto:** IDJUV Governa Hub — ERP/governança para órgão público (React 18 + Vite + TypeScript + Supabase).
- **Idioma:** português (domínio, comentários, UI). Não traduza nomes existentes.
- **Verificação:** não há testes; use `bun run lint` e `bun run build` (ou `npm run`).
- **Alias:** `@` → `src/`. Rotas ficam todas em `src/App.tsx`.

## Regras inegociáveis

1. Toda tabela nova nasce com **RLS** e políticas (skill `migracao-segura-idjuv`).
2. Não edite `src/integrations/supabase/client.ts` nem `types.ts` (gerados).
3. Tenant-agnóstico: nunca importe `tenants/<slug>` em `src/` nem escreva nome de cliente no código.
4. Nada de dados de cliente em `public/`.
5. Mudanças em `ProtectedRoute`/RBAC/auth: confirme com o usuário antes.
6. Diffs focados: o Lovable sincroniza este repo; evite reformatação em massa.
7. Não crie PR nem aplique migração em projeto remoto sem pedido explícito.

## Fluxo de trabalho (Superpowers)

O plugin **Superpowers** (`obra/superpowers`) é habilitado em `.claude/settings.json`. Fluxo padrão para qualquer feature:

1. `brainstorming` → spec em `docs/superpowers/specs/`
2. `writing-plans` → plano em `docs/superpowers/plans/`
3. `using-git-worktrees` → isolar o trabalho
4. `subagent-driven-development` ou `executing-plans` (com `test-driven-development` quando houver testes)
5. `requesting-code-review` → `verification-before-completion` → `finishing-a-development-branch`

Bugs: `systematic-debugging`. Roadmap vivo: `docs/planejamento/ROADMAP.md`.

## Skills do projeto (`.claude/skills/`)

| Skill | Quando usar |
|---|---|
| `novo-modulo-idjuv` | Feature/CRUD/página nova (tipos → hook → UI → rota → menu) |
| `migracao-segura-idjuv` | Qualquer mudança de schema, com RLS |
| `auditoria-seguranca-idjuv` | Antes de release / PR grande |
| `onboarding-cliente-idjuv` | Nova instância white-label |
| `supabase`, `supabase-postgres-best-practices` | Vendorizados de `supabase/agent-skills` (MIT) |

## Subagentes (`.claude/agents/`)

| Agente | Papel |
|---|---|
| `arquiteto-idjuv` | Specs e planos (somente leitura) |
| `dev-frontend-idjuv` | Páginas, componentes, hooks |
| `dev-banco-supabase` | Migrações, RLS, Edge Functions |
| `revisor-codigo-idjuv` | Revisão de diff (somente leitura) |
| `revisor-seguranca-idjuv` | Auditoria de segurança (somente leitura) |
| `documentador-idjuv` | Docs e roadmap |
