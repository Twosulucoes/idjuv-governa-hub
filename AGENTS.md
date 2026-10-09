# AGENTS.md

Instruções persistentes para agentes de IA (Claude Code, Codex, Cursor…) neste repositório. O `CLAUDE.md`
importa este arquivo (`@AGENTS.md`). Contexto completo: [`CLAUDE.md`](./CLAUDE.md) e [`docs/`](./docs/README.md).

## Resumo

- **Projeto:** IDJUV Governa Hub — ERP/governança para órgão público (React 18 + Vite + TypeScript + Supabase).
- **Idioma:** português (domínio, comentários, UI). Não traduza nomes existentes.
- **Verificação:** não há testes. Use `bash scripts/gate.sh` (`npm run gate`): guards de migrações, de links de docs, de RLS do baseline e de contraste AA dos tokens + typecheck + lint + cor crua em `.tsx` + build; typecheck, lint e cor crua falham só se piorarem vs. `scripts/gate-baseline.json`. Roda no `pre-push` (`.githooks/`, ativado por `npm install`) e no CI (`.github/workflows/quality.yml`). Detalhes em [`CONTRIBUTING.md`](./CONTRIBUTING.md).
- **Alias:** `@` → `src/`. Todas as rotas em `src/App.tsx`.
- **Instalar deps:** `bun install` ou `npm install --no-package-lock` (o `package-lock.json` está fora de sincronia; `npm ci` falha).

## Invariantes (não quebrar com nenhuma mudança)

1. **RLS é a fronteira real de segurança.** Toda tabela nova nasce com RLS + políticas na mesma migração (skill `migracao-segura-idjuv`). Função nova: `search_path` fixo e `EXECUTE` só para quem precisa.
2. **RBAC no banco e na rota.** Permissão exigida no `ProtectedRoute`/`ROUTE_PERMISSIONS` **e** na policy/RPC; esconder botão não é controle de acesso. Mudar `ProtectedRoute`/`AuthContext`/RLS existente exige confirmação do usuário.
3. **Arquivos gerados:** não edite `src/integrations/supabase/client.ts` nem `types.ts`.
4. **Tenant-agnóstico:** nunca importe `tenants/<slug>` em `src/` nem escreva nome de cliente no código (`docs/WHITE_LABEL.md`).
5. **Segredos só no servidor** (Edge Functions/`supabase secrets`); nada em `src/`, `.env` do front ou docs. Nunca logar token ou dado pessoal (LGPD).
6. **Nada de dados de cliente em `public/`** (servido sem autenticação).
7. **Diffs focados:** o Lovable sincroniza este repo; evite reformatação em massa e mudanças em `App.tsx` além do necessário.
8. **Não crie PR** sem pedido explícito. Nunca merge automático. **Migração vai para produção pelo CI, não à mão:**
   o workflow `.github/workflows/migracoes-banco.yml` simula no PR e aplica no merge na `main`
   (banco: Supabase self-hosted da VPS, acessado por túnel SSH; o Postgres não fica exposto). Agente não aplica migração direto
   em banco remoto; toda migração do PR deve ser segura para rodar sozinha no merge.

## Fluxo de trabalho: prompt curto → execução estruturada

Todo pedido de criar ou mudar algo entra no workflow `.agents/skills/agent-workflow/SKILL.md` (portátil). No
Claude Code, o adaptador é o skill **`superpowers`** (`/superpowers`), que encadeia os skills do Superpowers
vendorizados em `.claude/skills/` com os subagentes do projeto:

```
brainstorming → [gate de aprovação] → writing-plans → subagent-driven-development
   → requesting-code-review → verification-before-completion → docs → PR rascunho
```

- Classificação: **spike**, **bounded**, **architectural** (na dúvida, o mais pesado).
- Interativo: pare para o "sim" explícito após desenho/spec/plano. Autônomo: registre premissas e siga; pare só por risco.
- Bug isolado: `systematic-debugging`. Specs em `docs/superpowers/specs/`, planos em `docs/superpowers/plans/`.
- **Ler não é verificar:** rode o comando antes de afirmar. Sem evidência fresca, sem "pronto".
- Documentação: matriz em [`docs/GOVERNANCA_DOCUMENTACAO.md`](./docs/GOVERNANCA_DOCUMENTACAO.md) (§6 diz o que é cobrado automaticamente hoje e o que é só convenção).
- Commits: descritivos, em português. O repo **não** adota Conventional Commits obrigatório nem versionamento automático (SemVer/Release Please).
- Roadmap vivo: [`docs/planejamento/ROADMAP.md`](./docs/planejamento/ROADMAP.md).

## Skills (`.claude/skills/`)

| Skill | Origem | Quando usar |
|---|---|---|
| `superpowers` | IDJUV | **Qualquer pedido de criar/mudar algo** — orquestra o fluxo |
| `brainstorming`, `writing-plans`, `executing-plans`, `subagent-driven-development`, `dispatching-parallel-agents`, `requesting-code-review`, `receiving-code-review`, `verification-before-completion`, `test-driven-development`, `finishing-a-development-branch`, `using-git-worktrees`, `systematic-debugging` | Superpowers (vendorizado, MIT) | Passos do fluxo; atualizar com `scripts/sync-superpowers-skills.sh` — não editar à mão |
| `novo-modulo-idjuv` | IDJUV | Feature/CRUD/página nova |
| `migracao-segura-idjuv` | IDJUV | Mudança de schema com RLS |
| `auditoria-seguranca-idjuv` | IDJUV | Antes de release / PR grande |
| `onboarding-cliente-idjuv` | IDJUV | Nova instância white-label |
| `supabase`, `supabase-postgres-best-practices` | supabase/agent-skills (MIT) | Qualquer trabalho com Supabase/Postgres |
| `ui-ux-pro-max` | nextlevelbuilder/ui-ux-pro-max-skill (MIT, ver `.claude/skills/UI-UX-PRO-MAX-VENDOR.md`) | Qualquer mudança visual: tela, componente, cor, tipografia, acessibilidade, gráfico. Design system: `docs/superpowers/specs/2026-10-09-design-system-design.md` |

## Subagentes (`.claude/agents/`) e quem executa o quê

| Agente | Papel | Escreve? |
|---|---|---|
| `arquiteto-idjuv` | Levantamento, specs, planos | não |
| `dev-banco-supabase` | Migrações, RLS, RPC, Edge Functions | sim |
| `dev-frontend-idjuv` | Hook, componente, página, rota, menu | sim |
| `revisor-codigo-idjuv` | Revisão de diff | não |
| `revisor-seguranca-idjuv` | RLS, RBAC, secrets, XSS, LGPD | não |
| `documentador-idjuv` | Docs da matriz e roadmap | sim (só docs) |

Brief de subagente deve conter tarefa, seções aplicáveis do `CLAUDE.md`/`AGENTS.md`, arquivos de referência e
invariantes — subagente não herda o contexto da sessão. Nunca finja delegação que não ocorreu.

## Checklist antes de concluir

1. RLS/policies na migração? RBAC na rota e no banco?
2. `bash scripts/gate.sh` verde (resultado lido, não presumido)?
3. Docs da matriz atualizadas (ou `docs: não se aplica — <motivo>`)?
4. Nada não implementado foi documentado como existente?
5. Revisores (`revisor-codigo-idjuv`, e `revisor-seguranca-idjuv` se tocou segurança) sem bloqueantes?
