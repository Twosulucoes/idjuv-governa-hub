# Governança de Documentação — IDJUV Governa Hub

> **Regra única**: trabalho que muda comportamento real do sistema sem atualizar
> a documentação exigida pela matriz abaixo é **trabalho incompleto**. Isso é
> cobrado localmente pelo gate de pre-push (`npm run gate`) e, quando o time
> ativar o gatilho automático, também em CI (job `docs-guard`) — ver §6 para o
> estado real de cada mecanismo hoje.
>
> Este documento é a **fonte normativa** do processo documental. O `AGENTS.md`
> e o `CONTRIBUTING.md` apontam para cá.

---

## 1. Por que existe

- Documentação que diverge do código é pior do que documentação ausente:
  induz decisão errada com confiança.
- Este repositório tem ~248 migrações, ~241 páginas e 17 módulos — sem um
  dono claro por assunto e um gatilho por tipo de mudança, a doc apodrece em
  silêncio (é exatamente o que `docs/AUDITORIA_USUARIOS.md` e
  `docs/INVENTARIO_HARDCODE.md` registram como achados de uma auditoria
  pontual, não como processo contínuo).
- A solução não é "escrever mais doc" — é ter **um dono por assunto** (mapa
  canônico), **um gatilho por tipo de mudança** (matriz) e, quando ativado,
  **um cobrador automático** (CI).

## 2. Mapa canônico — quem responde pelo quê

Índice completo: [`docs/README.md`](./README.md).

| Documento | Responde por |
|---|---|
| [`DOCUMENTACAO_TECNICA.md`](../DOCUMENTACAO_TECNICA.md) | Documento-mestre: arquitetura, stack, fluxos principais, mapa do acoplamento à marca do cliente, diretrizes White Label |
| [`docs/ARQUITETURA.md`](./ARQUITETURA.md) | Stack, camadas, fluxo de dados, autenticação, deploy |
| [`docs/MODULOS.md`](./MODULOS.md) | Detalhamento funcional de cada módulo e suas páginas |
| [`docs/BANCO_DE_DADOS.md`](./BANCO_DE_DADOS.md) | Tabelas, views e funções (RPC) do Postgres/Supabase, política de migrações |
| [`docs/RBAC_PERMISSOES.md`](./RBAC_PERMISSOES.md) | Modelo de permissões, perfis, rotas protegidas |
| [`docs/GUIA_FRONTEND.md`](./GUIA_FRONTEND.md) | Estrutura do front, hooks, libs, padrões de código |
| [`docs/EDGE_FUNCTIONS.md`](./EDGE_FUNCTIONS.md) | Funções serverless (Deno) do Supabase |
| [`docs/DESENVOLVIMENTO.md`](./DESENVOLVIMENTO.md) | Setup, comandos, fluxo Git, deploy, como adicionar features |
| [`docs/WHITE_LABEL.md`](./WHITE_LABEL.md) | Arquitetura-alvo, roadmap e critérios de aceite do modelo White Label |
| [`docs/VISAO_GERAL.md`](./VISAO_GERAL.md) | O que é o sistema, público, objetivos, mapa de módulos |
| [`CLAUDE.md`](../CLAUDE.md) | Guia de contexto para o Claude Code: stack, estrutura, convenções, fluxo de features; importa `AGENTS.md` |
| [`AGENTS.md`](../AGENTS.md) | Instruções persistentes para agentes: invariantes de segurança/arquitetura, fluxo de trabalho (skill `superpowers`), documentação obrigatória |
| [`CONTRIBUTING.md`](../CONTRIBUTING.md) | Gate local de qualidade, checklist de PR |
| [`.claude/skills/SUPERPOWERS-VENDOR.md`](../.claude/skills/SUPERPOWERS-VENDOR.md) | Inventário dos skills de processo vendorizados |

`docs/AUDITORIA_USUARIOS.md` e `docs/INVENTARIO_HARDCODE.md` **não estão**
nesta lista: são registros datados de auditorias pontuais, não docs vivas —
ver §7.

## 3. Matriz obrigatória — tipo de mudança → documento

Ao abrir uma PR, localize **cada** linha aplicável. A doc da coluna
"Obrigatória" deve mudar **na mesma PR**.

| Sua mudança envolve… | Doc obrigatória | Conferir também |
|---|---|---|
| Rota, página ou item de menu novo | `docs/ARQUITETURA.md` | `docs/MODULOS.md` (se a página pertence a um módulo existente) |
| Módulo novo (registrado em `MODULOS`) | `docs/MODULOS.md` + `src/shared/config/modules.config.ts` mencionado | `docs/ARQUITETURA.md`; skill `novo-modulo-idjuv` |
| Migração, tabela, coluna, RPC, RLS | `docs/BANCO_DE_DADOS.md` | Skill `migracao-segura-idjuv` |
| Edge Function nova ou alterada | `docs/EDGE_FUNCTIONS.md` | Checagem de auth (`AGENTS.md`) |
| Permissão, papel, RBAC | `docs/RBAC_PERMISSOES.md` | `src/types/auth.ts` (`ROUTE_PERMISSIONS`) |
| Hook de dados, lib, padrão de front | `docs/GUIA_FRONTEND.md` | — |
| White Label / tenant / branding | `docs/WHITE_LABEL.md` | `src/core/tenant/README.md`, `tenants/README.md` |
| Skill vendorizada nova/alterada (`.claude/skills/`) | `.claude/skills/SUPERPOWERS-VENDOR.md` (se vier do plugin) | Skill de domínio nova é autodocumentada (frontmatter + corpo) — não precisa de entrada aqui |
| **Criação de doc canônica nova** | `LIVING_DOCS` em `scripts/check-doc-links.mjs` + linha em `docs/README.md` + linha nesta matriz | — |

**Regra de leitura da matriz**: na dúvida entre "documentar em A ou B",
documente no dono do assunto (tabela do §2) e **aponte** de B para A. Nunca
duplique conteúdo — cópia é a forma mais rápida de criar drift.

## 4. Definição de trabalho completo (DoD documental)

Uma mudança está completa quando:

1. O código passa nos gates disponíveis (`lint`, `build`, e `check:docs`/
   `check:migrations` quando a mudança toca docs vivas ou `supabase/migrations/`).
   Não há suíte de testes automatizados configurada neste projeto hoje.
2. **Toda linha aplicável da matriz do §3 foi atendida** na mesma PR.
3. O que foi escrito descreve o que **existe no código agora** — não intenção
   futura.
4. Se algo ficou parcial, a doc diz explicitamente que está parcial.
5. Se **nenhuma** linha da matriz se aplica, isso foi declarado via escape (§5).

## 5. Escape hatch — quando docs não se aplicam

Nem toda mudança de código altera comportamento documentável (ex.: refactor
puro, ajuste de tipo, correção de typo em string interna). Nesses casos,
declare no **corpo da Pull Request**, em linha própria e sem indentação:

```
docs: não se aplica — <motivo real e específico>
```

- Quando o gatilho automático do `docs-guard` estiver ativo (ver §6), ele
  detecta a linha e libera a PR; editar a descrição da PR redispara o check.
- O motivo fica **auditável para sempre** no histórico da PR.
- Motivo genérico ("não precisa") em PR que muda comportamento é razão para
  **reprovar em review** — o escape existe para exceções verdadeiras, não
  para pressa.

## 6. Como o enforcement funciona (estado real, não aspiracional)

Este repositório nunca teve CI. Ao introduzir o gate, fomos deliberadamente
conservadores — nem tudo está ativo por padrão ainda:

| Mecanismo | O que cobra | Onde | Estado |
|---|---|---|---|
| **`check:docs`** | Referência a arquivo inexistente/vazio nas docs vivas (`LIVING_DOCS`) | `scripts/check-doc-links.mjs` | Existe e roda local (`npm run check:docs`) e em CI via `quality.yml` |
| **`check:migrations`** | Versão de migração duplicada / nome fora do padrão `<14 dígitos>_slug.sql` | `scripts/check-migrations.sh` | Existe e roda local e em CI via `quality.yml` |
| **`npm run gate`** | Roda os dois acima + `lint` + `build` em sequência | `scripts/gate.sh` | Existe; roda automaticamente no `pre-push` (`.githooks/pre-push`, ativado por `npm install` via o script `prepare`) — pulável com `git push --no-verify` |
| **`quality.yml`** (CI) | `lint` + `build` (+ os dois guards acima) em toda PR | `.github/workflows/quality.yml` | **Ativo** (gatilho `pull_request`) — primeira vez que este repositório tem CI |
| **`docs-guard`** (CI) | PR que muda `src/**`/`supabase/**` sem tocar `docs/**`/`*.md` e sem escape declarado → falha | `.github/workflows/docs-guard.yml` | **Existe mas desativado por padrão** — só `workflow_dispatch`. O gatilho `pull_request`/`pull_request_target` está comentado no arquivo, com uma nota explicando como ativar. Decisão do time, não técnica: ativar exige que a matriz do §3 já esteja sendo seguida na prática antes de virar bloqueio automático |
| **Template de PR** | Checklist da matriz na abertura de toda PR | `.github/pull_request_template.md` | Ativo (todo PR usa o template por padrão) |

**Não afirme, em nenhuma doc ou PR, que "toda PR passa pelo docs-guard"** —
isso só será verdade depois que o time descomentar o gatilho em
`.github/workflows/docs-guard.yml` e (se quiser bloqueio de merge) adicionar
o check aos required status checks da branch protection de `main`.

## 7. O que NUNCA fazer

- **Não reescrever registros históricos** (`docs/AUDITORIA_USUARIOS.md`,
  `docs/INVENTARIO_HARDCODE.md`, planos datados em `.lovable/`). Eles
  registram o passado e continuam verdadeiros como registro, mesmo quando o
  código muda. Para "atualizar" um achado histórico, escreva doc nova ou
  atualize a canônica — nunca edite o registro para fingir que ele já
  descrevia o estado atual.
- **Não documentar o que não existe.** Funcionalidade planejada vive em
  plano/spec explicitamente marcado como tal (`docs/superpowers/plans/`),
  nunca nas docs canônicas do §2.
- **Não copiar conteúdo entre docs.** Aponte para o dono do assunto.
- **Não deixar contagens mortas.** Números ("N tabelas", "N páginas")
  apodrecem: toda contagem em doc canônica deve vir com **data de apuração**
  (como já faz `docs/README.md` em "Números do sistema (snapshot)"), para
  qualquer pessoa saber se está defasada.
- **Não remover as diretivas** `<!-- doc-links-absent: ... -->` /
  `<!-- doc-links-ignore: ... -->` de `docs/*.md` sem entender o que
  defendem (ver cabeçalho de `scripts/check-doc-links.mjs`).

---

*Criado em 2026-09-24, adaptando o processo equivalente do ConectaPol à
realidade deste repositório. Doc canônica viva — alterações neste processo
devem ser feitas aqui e refletidas em `AGENTS.md`/`CONTRIBUTING.md` (que
apenas apontam para cá).*
