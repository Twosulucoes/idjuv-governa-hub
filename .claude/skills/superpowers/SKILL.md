---
name: superpowers
description: Use ANTES de qualquer resposta quando o usuário pedir para criar ou mudar algo no IDJUV Governa Hub — feature, tela, relatório, fluxo, migração, RPC, Edge Function, integração — mesmo num prompt de uma linha como "faz a tela X" ou "cria o módulo Y", ou quando digitar /superpowers. Transforma um pedido curto no fluxo estruturado brainstorming → plano → gate de aprovação → execução com subagentes → revisão → verificação → docs → PR rascunho. Não use para bug isolado (use systematic-debugging) nem para pergunta que não muda código.
---

# /superpowers — fluxo estruturado do IDJUV Governa Hub

Um prompt curto não é uma tarefa curta. Este skill **encadeia** os skills vendorizados do Superpowers
(`.claude/skills/`, ver `SUPERPOWERS-VENDOR.md`), os skills de domínio do IDJUV e os subagentes de
`.claude/agents/`. Regras do repositório: `CLAUDE.md` e `AGENTS.md`.

**Regra de ouro:** invoque este skill antes de responder, inclusive antes de perguntar ou abrir arquivos.
Anuncie "Usando superpowers para <objetivo>" e crie uma tarefa (TaskCreate) por passo.

## Passo 1 — Classificar e desenhar (`brainstorming`, agente `arquiteto-idjuv`)

Classifique em voz alta:

- **Spike** — pergunta de viabilidade → recomendação, não código.
- **Bounded** — mudança pequena num fluxo que já existe (campo, filtro, ajuste de tela). Desenho curto no chat.
- **Architectural** — módulo/tela/fluxo novo, tabela nova, mudança de RBAC, interface de que outros dependem. Spec em `docs/superpowers/specs/AAAA-MM-DD-<tema>.md`.

Na dúvida, o caminho mais pesado. Para explorar o código sem poluir o contexto, delegue o levantamento ao
`arquiteto-idjuv` (somente leitura) ou ao agente `Explore`.

Eixos que o desenho precisa cobrir (levante no código/docs antes de perguntar):

| Eixo | Onde olhar | O que decidir |
|---|---|---|
| Módulo | `src/shared/config/modules.config.ts`, `docs/MODULOS.md` | A que módulo pertence; módulo novo? |
| Banco e RLS | `docs/BANCO_DE_DADOS.md`, skill `migracao-segura-idjuv` | Tabelas/colunas, RLS e políticas desde a migração, RPCs |
| RBAC | `docs/RBAC_PERMISSOES.md`, `ROUTE_PERMISSIONS` em `src/types/auth.ts` | Quem vê/edita; permissão exigida na rota **e** no banco |
| Rota e menu | `src/App.tsx`, `src/config/menu.config.ts` | Guard (Public/Protected), bloco do módulo, item de menu |
| Dados | `src/hooks/use<Dominio>.ts` | Reusar/estender hook; React Query |
| UI | `docs/GUIA_FRONTEND.md`, shadcn/ui | Componentes existentes, formulário zod |
| White label | `docs/WHITE_LABEL.md` | Nada de nome de cliente em `src/`; textos via tenant |
| Edge Function | `docs/EDGE_FUNCTIONS.md` | Auth, checagem de papel, secrets |
| Documentação | `docs/GOVERNANCA_DOCUMENTACAO.md` §3 | Quais docs mudam na mesma entrega |

## Passo 2 — Gate de aprovação

- **Sessão interativa:** apresente o desenho (bounded) ou a spec (architectural) e **pare até o "sim"
  explícito**. Aprovar a ideia não aprova a spec; aprovar a spec não aprova o plano. Nada de código antes.
  Mudança em `ProtectedRoute`/`AuthContext`/RLS existente sempre exige confirmação explícita.
- **Sessão autônoma** (sem ninguém respondendo): registre as **premissas** no topo da spec/plano e no corpo
  da PR e siga. Pare só se uma premissa tornar o trabalho inseguro ou inútil (policy aberta, migração
  destrutiva, secret no front).

## Passo 3 — Plano (`writing-plans`, só architectural)

Plano em `docs/superpowers/plans/AAAA-MM-DD-<tema>.md`, tarefas pequenas com: arquivos, código, critério de
verificação e doc da matriz. Ordem típica: migração+RLS → tipos → hook → componentes → página → rota/menu →
docs. Cada tarefa indica **qual agente** a executa (tabela do Passo 4).

## Passo 4 — Execução (`subagent-driven-development`)

Um subagente por tarefa, revisão por tarefa e revisão final. Use os agentes do projeto como implementadores
e revisores (o brief deve conter a tarefa, as seções do `CLAUDE.md`/`AGENTS.md` aplicáveis, os arquivos de
referência a ler e os invariantes — subagente não herda contexto):

| Tarefa | Agente |
|---|---|
| Migração, RLS, RPC, Edge Function | `dev-banco-supabase` |
| Hook, componente, página, rota, menu | `dev-frontend-idjuv` |
| Docs da matriz | `documentador-idjuv` |
| Revisão de qualidade do diff | `revisor-codigo-idjuv` |
| Revisão de segurança (qualquer tarefa que toque banco, auth, RBAC, Edge Function, upload, HTML dinâmico) | `revisor-seguranca-idjuv` |

Frentes independentes (banco × front × docs) → `dispatching-parallel-agents`, **depois** que o contrato
(tipos/RPC) estiver fixado. Sem ferramenta `Agent` → `executing-plans` em linha; nunca finja delegação.
Bug no caminho → `systematic-debugging`. Mudanças de lógica pura (cálculos de folha, frequência) pedem
`test-driven-development` se houver (ou se você adicionar) harness de teste; o repo hoje não tem suíte.

## Passo 5 — Revisão e verificação

1. `requesting-code-review` com `revisor-codigo-idjuv`; se tocou superfície de segurança, também
   `revisor-seguranca-idjuv`. Trate achados com `receiving-code-review` (verifique antes de aplicar).
2. `verification-before-completion`: rode e leia a saída — `bash scripts/gate.sh` (lint, typecheck, build).
   Tela nova se vê rodando (`bun run dev` + Playwright/Chromium do ambiente), em mobile (390px) e desktop.
   Migração: `mcp__Supabase__get_advisors` (segurança) após aplicar. Não afirme sucesso sem evidência.

## Passo 6 — Entrega

- Docs da matriz atualizadas na mesma branch; se nenhuma se aplica, diga isso na PR com o motivo.
- Commits descritivos; spec e plano ficam versionados em `docs/superpowers/` (registro datado).
- `finishing-a-development-branch` → PR **rascunho** (só quando o usuário pedir PR) com: o que muda,
  premissas, o que ficou de fora, resultado real do gate. Nunca merge por conta própria, nunca migração em
  projeto remoto sem confirmação.
- Atualize `docs/planejamento/ROADMAP.md` (`documentador-idjuv`).
