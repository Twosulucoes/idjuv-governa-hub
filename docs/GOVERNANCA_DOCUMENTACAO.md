# Governança de documentação — IDJUV Governa Hub

**Regra única:** mudança que altera comportamento real sem atualizar a doc da matriz abaixo é trabalho
incompleto. Documentação que diverge do código é pior que nenhuma.

## 1. Mapa canônico — quem responde pelo quê

| Documento | Responde por |
|---|---|
| [`DOCUMENTACAO_TECNICA.md`](../DOCUMENTACAO_TECNICA.md) | Visão consolidada, acoplamento à marca do cliente, diretrizes White Label |
| [`ARQUITETURA.md`](./ARQUITETURA.md) | Stack, camadas, fluxo de dados, auth, deploy |
| [`MODULOS.md`](./MODULOS.md) | Módulos e páginas (funcional) |
| [`BANCO_DE_DADOS.md`](./BANCO_DE_DADOS.md) | Tabelas, views, RPCs, RLS |
| [`RBAC_PERMISSOES.md`](./RBAC_PERMISSOES.md) | Perfis, permissões, rotas protegidas |
| [`GUIA_FRONTEND.md`](./GUIA_FRONTEND.md) | Estrutura do front, hooks, padrões |
| [`EDGE_FUNCTIONS.md`](./EDGE_FUNCTIONS.md) | Edge Functions (Deno) |
| [`WHITE_LABEL.md`](./WHITE_LABEL.md) | Modelo tenant-agnóstico |
| [`planejamento/ROADMAP.md`](./planejamento/ROADMAP.md) | Backlog e andamento |
| `CLAUDE.md` / `AGENTS.md` | Contexto e regras para agentes |

## 2. Matriz — tipo de mudança → doc obrigatória (na mesma entrega)

| Sua mudança envolve… | Doc obrigatória | Conferir também |
|---|---|---|
| Nova rota, página, item de menu, módulo | `MODULOS.md` | `ARQUITETURA.md`; `src/shared/config/modules.config.ts` |
| Migração, tabela, view, RPC, trigger, policy RLS | `BANCO_DE_DADOS.md` | `RBAC_PERMISSOES.md` se mudar acesso |
| Papéis, permissões, `ROUTE_PERMISSIONS`, `ProtectedRoute` | `RBAC_PERMISSOES.md` | `AUDITORIA_USUARIOS.md` |
| Edge Function nova/alterada, auth, secrets | `EDGE_FUNCTIONS.md` | `ARQUITETURA.md` |
| Hook, padrão de front, biblioteca nova | `GUIA_FRONTEND.md` | — |
| Marca/tenant/textos de cliente | `WHITE_LABEL.md` | `INVENTARIO_HARDCODE.md` |
| Deploy, build, comandos, fluxo Git | `DESENVOLVIMENTO.md` | `CLAUDE.md` §3/§8 |
| Regra para agentes, skill, agente | `AGENTS.md` | `CLAUDE.md` §10.1 |
| Decisão/andamento de planejamento | `planejamento/ROADMAP.md` | spec/plano em `docs/superpowers/` |

Na dúvida entre A e B: documente no dono do assunto (tabela §1) e **aponte** de B para A. Nunca duplique.

## 3. Definição de pronto documental

- A doc da matriz mudou no mesmo commit/PR, descrevendo só o que existe no código (parcial = dito como parcial).
- Se nenhuma doc se aplica, a PR diz `docs: não se aplica — <motivo real>`.
- Specs e planos em `docs/superpowers/` são registro datado, não fonte canônica.
