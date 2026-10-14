# Governança de Documentação — IDJUV Governa Hub

> **Regra única**: trabalho que muda comportamento real do sistema sem atualizar
> a documentação exigida pela matriz abaixo é **trabalho incompleto**. Desde
> 14/10/2026 isso é cobrado em CI, em toda PR, pelo job `docs-guard` — ver §6
> para o estado real de cada mecanismo.
>
> Este documento é a **fonte normativa** do processo documental. O `AGENTS.md`
> e o `CONTRIBUTING.md` apontam para cá.

---

## 1. Por que existe

- Documentação que diverge do código é pior do que documentação ausente:
  induz decisão errada com confiança.
- Este repositório tem centenas de migrações e páginas e 17 módulos — sem um
  dono claro por assunto e um gatilho por tipo de mudança, a doc apodrece em
  silêncio (é exatamente o que `docs/AUDITORIA_USUARIOS.md` e
  `docs/INVENTARIO_HARDCODE.md` registram como achados de uma auditoria
  pontual, não como processo contínuo).
- A solução não é "escrever mais doc" — é ter **um dono por assunto** (mapa
  canônico), **um gatilho por tipo de mudança** (matriz) e **um cobrador
  automático** (CI).

## 2. Mapa canônico — quem responde pelo quê

Índice completo: [`docs/README.md`](./README.md).

| Documento | Responde por |
|---|---|
| [`DOCUMENTACAO_TECNICA.md`](../DOCUMENTACAO_TECNICA.md) | Documento-mestre: arquitetura, stack, fluxos principais, mapa do acoplamento à marca do cliente, diretrizes White Label |
| [`docs/ARQUITETURA.md`](./ARQUITETURA.md) | Stack, camadas, fluxo de dados, autenticação, deploy |
| [`docs/MODULOS.md`](./MODULOS.md) | Detalhamento funcional de cada módulo e suas páginas |
| [`docs/BANCO_DE_DADOS.md`](./BANCO_DE_DADOS.md) | Tabelas, views e funções (RPC) do Postgres/Supabase, política de migrações |
| [`docs/NOVO_BANCO.md`](./NOVO_BANCO.md) | Criar banco novo e vazio a partir de `supabase/baseline/` (Supabase self-hosted, validação em Postgres), primeiro administrador, conferência |
| [`docs/RBAC_PERMISSOES.md`](./RBAC_PERMISSOES.md) | Modelo de permissões, perfis, rotas protegidas |
| [`docs/GUIA_FRONTEND.md`](./GUIA_FRONTEND.md) | Estrutura do front, hooks, libs, padrões de código |
| [`docs/EDGE_FUNCTIONS.md`](./EDGE_FUNCTIONS.md) | Funções serverless (Deno) do Supabase |
| [`docs/EMAILS_AUTH.md`](./EMAILS_AUTH.md) | E-mails do Supabase Auth: gerador, templates por tenant, aplicação na VPS |
| [`docs/DESENVOLVIMENTO.md`](./DESENVOLVIMENTO.md) | Setup, comandos, fluxo Git, deploy, como adicionar features |
| [`docs/WHITE_LABEL.md`](./WHITE_LABEL.md) | Arquitetura-alvo, roadmap e critérios de aceite do modelo White Label |
| [`docs/VISAO_GERAL.md`](./VISAO_GERAL.md) | O que é o sistema, público, objetivos, mapa de módulos |
| [`docs/planejamento/ROADMAP.md`](./planejamento/ROADMAP.md) | Backlog e andamento do planejamento (vivo) |
| [`docs/planejamento/FINALIZACAO.md`](./planejamento/FINALIZACAO.md) | Estado de cada módulo rumo à finalização (página → estado → o que falta) |
| [`prompts/README.md`](../prompts/README.md) | Gerador de prompts: comandos, tipos de tarefa, como estender |
| [`CLAUDE.md`](../CLAUDE.md) | Guia de contexto para o Claude Code: stack, estrutura, convenções, fluxo de features; importa `AGENTS.md` |
| [`AGENTS.md`](../AGENTS.md) | Instruções persistentes para agentes: invariantes de segurança/arquitetura, fluxo de trabalho (skill `superpowers`), documentação obrigatória |
| [`CONTRIBUTING.md`](../CONTRIBUTING.md) | Gate local de qualidade, checklist de PR |
| [`.claude/skills/SUPERPOWERS-VENDOR.md`](../.claude/skills/SUPERPOWERS-VENDOR.md) | Inventário dos skills de processo vendorizados |
| [`.claude/skills/UI-UX-PRO-MAX-VENDOR.md`](../.claude/skills/UI-UX-PRO-MAX-VENDOR.md) | Origem, revisão de segurança e uso do skill de UI/UX vendorizado |
| [`docs/PADRAO_DOCUMENTOS.md`](./PADRAO_DOCUMENTOS.md) | Padrão único de impressão: famílias, tokens, como criar documento novo, inventário dos geradores de PDF |

`docs/AUDITORIA_USUARIOS.md` e `docs/INVENTARIO_HARDCODE.md` **não estão**
nesta lista: são registros datados de auditorias pontuais, não docs vivas —
ver §7. O mesmo vale para specs e planos em `docs/superpowers/`: são registro
datado de uma decisão, não fonte canônica.

## 3. Matriz obrigatória — tipo de mudança → documento

Ao abrir uma PR, localize **cada** linha aplicável. A doc da coluna
"Obrigatória" deve mudar **na mesma PR**. Desde 14/10/2026 o `docs-guard` cobra
a coluna "Obrigatória" em toda PR (ver §6), pelos caminhos definidos em
`scripts/check-docs-matriz.mjs` (quando há dois documentos com "+", os dois);
"Conferir também" fica para a revisão. Mudança no gate (`scripts/gate.sh`, `scripts/check-*`,
`vitest.config.ts`, `.githooks/`) cobra `CONTRIBUTING.md`;
toda mudança em `src/**` ou `supabase/**` cobra também `docs/planejamento/ROADMAP.md`.
Linhas sem caminho de arquivo que as identifique (ex.: "regra para agentes" fora de
`.claude/agents/`) continuam valendo, cobradas em revisão.

| Sua mudança envolve… | Doc obrigatória | Conferir também |
|---|---|---|
| Rota, página ou item de menu novo | `docs/ARQUITETURA.md` | `docs/MODULOS.md` (se a página pertence a um módulo existente) |
| Módulo novo (registrado em `MODULOS`) | `docs/MODULOS.md` + `src/shared/config/modules.config.ts` mencionado | `docs/ARQUITETURA.md`; skill `novo-modulo-idjuv` |
| Migração, tabela, coluna, RPC, RLS | `docs/BANCO_DE_DADOS.md` | Skill `migracao-segura-idjuv` |
| Backup da VPS (`scripts/backup/`, `.github/workflows/backup-restore-test.yml`) | `docs/BACKUP.md` | — |
| Baseline do banco (`supabase/baseline/`), `rls/mapa.csv`, overlay, scripts `scripts/db/` | `docs/NOVO_BANCO.md` + `supabase/baseline/README.md` | `docs/BANCO_DE_DADOS.md`; rode `scripts/db/validar-baseline.sh` |
| Edge Function nova ou alterada | `docs/EDGE_FUNCTIONS.md` | Checagem de auth (`AGENTS.md`) |
| E-mails do Supabase Auth (`scripts/emails/`, `tenants/<slug>/emails/`) | `docs/EMAILS_AUTH.md` | Regere com `bun scripts/emails/gerar-templates-email.ts` |
| Permissão, papel, RBAC | `docs/RBAC_PERMISSOES.md` | `src/types/auth.ts` (`ROUTE_PERMISSIONS`) |
| Hook de dados, lib, padrão de front | `docs/GUIA_FRONTEND.md` | — |
| White Label / tenant / branding | `docs/WHITE_LABEL.md` | `src/core/tenant/README.md`, `tenants/README.md` |
| Deploy, build, comandos, fluxo Git | `docs/DESENVOLVIMENTO.md` | `CLAUDE.md` §3/§8; `CONTRIBUTING.md` se mudar o gate |
| Regra para agentes, skill ou subagente novo/alterado | `AGENTS.md` | `CLAUDE.md` §10.1 |
| Template de prompt, comando em `.claude/commands/` ou `scripts/prompt.mjs` | `prompts/README.md` | `CLAUDE.md` §10.1 |
| Decisão ou andamento de planejamento | `docs/planejamento/ROADMAP.md` | Spec/plano datado em `docs/superpowers/` |
| Skill vendorizada nova/alterada (`.claude/skills/`) | `.claude/skills/SUPERPOWERS-VENDOR.md` (gerado por `scripts/sync-superpowers-skills.sh` — não editar à mão); `ui-ux-pro-max` → `.claude/skills/UI-UX-PRO-MAX-VENDOR.md` | Skill de domínio nova é autodocumentada (frontmatter + corpo) — não precisa de entrada aqui |
| **Criação de doc canônica nova** | `LIVING_DOCS` em `scripts/check-doc-links.mjs` + linha em `docs/README.md` + linha nesta matriz | — |
| Documento/PDF novo ou alterado (`src/lib/documentos/`, `src/lib/pdf*.ts`) | `docs/PADRAO_DOCUMENTOS.md` | Skill `novo-documento-idjuv` |

**Regra de leitura da matriz**: na dúvida entre "documentar em A ou B",
documente no dono do assunto (tabela do §2) e **aponte** de B para A. Nunca
duplique conteúdo — cópia é a forma mais rápida de criar drift.

## 4. Definição de trabalho completo (DoD documental)

Uma mudança está completa quando:

1. O código passa em `bash scripts/gate.sh` (`npm run gate`): guards de
   migrações e de links de docs, typecheck e lint sem piora vs. a baseline, e
   build, e os testes vitest de `src/` e `scripts/`.
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

- O `docs-guard` (ver §6) detecta a linha e libera a PR; editar a descrição
  da PR redispara o check.
- O motivo fica **auditável para sempre** no histórico da PR.
- Motivo genérico ("não precisa") em PR que muda comportamento é razão para
  **reprovar em review** — o escape existe para exceções verdadeiras, não
  para pressa.

## 6. Como o enforcement funciona (estado real, não aspiracional)

Estado de cada mecanismo hoje (o `docs-guard` passou a rodar em toda PR em
14/10/2026):

| Mecanismo | O que cobra | Onde | Estado |
|---|---|---|---|
| **`check:docs`** | Referência a arquivo inexistente/vazio nas docs vivas (`LIVING_DOCS`) | `scripts/check-doc-links.mjs` | Existe e roda local (`npm run check:docs`) e em CI via `quality.yml` |
| **`check:migrations`** | Versão de migração duplicada / nome fora do padrão `<14 dígitos>_slug.sql` | `scripts/check-migrations.sh` | Existe e roda local e em CI via `quality.yml` |
| **`check:rls`** | `supabase/baseline/rls/35_policies_geradas.sql` defasado em relação a `rls/mapa.csv` | `scripts/db/gerar-rls.mjs --check` | Existe e roda local e em CI (dentro do gate). **Não** executa o teste de RLS: ele exige um Postgres (`scripts/db/validar-baseline.sh`, manual) |
| **`check:autoria-rh`** | Tabela do RH (linha com `rh` em `supabase/baseline/rls/mapa.csv`) sem os triggers da onda E1 no schema do baseline: `zz_fixar_autoria` (`BEFORE INSERT OR UPDATE`, `fixar_autoria`) e `audit_<tabela>` (`AFTER INSERT OR UPDATE OR DELETE`, `fn_audit_trigger('rh')`), e o `zz_exigir_setor` da regra de setor (`BEFORE INSERT OR UPDATE OR DELETE`, `exigir_setor()`, migração `20261011020000`) com o `zz_exigir_setor_fim` (`AFTER INSERT OR UPDATE OR DELETE` por comando, `exigir_setor_fim()`), sem `WHEN` e sem `DISABLE TRIGGER`; na classe `trilha`, `trilha_imutavel` e `trilha_imutavel_truncate` com `ENABLE ALWAYS`. Exceção só com motivo em `scripts/autoria-rh-excecoes.txt` (hoje nenhuma) | `scripts/check-autoria-rh.mjs` | Existe e roda local e em CI (dentro do gate) |
| **`npm run gate`** | Os guards acima + `typecheck` + `lint` + `build`. Typecheck e lint comparam com `scripts/gate-baseline.json` e falham **só se a dívida piorar** (o repo tem erros históricos); os guards falham em qualquer ocorrência | `scripts/gate.sh` | Existe; roda automaticamente no `pre-push` (`.githooks/pre-push`, ativado por `npm install` via o script `prepare`) — pulável com `git push --no-verify`. Ao reduzir a dívida: `bash scripts/gate.sh --update-baseline` |
| **`quality.yml`** (CI) | Guard de `.env` rastreado + `scripts/gate.sh` (os mesmos checks do gate local) em toda PR | `.github/workflows/quality.yml` | **Ativo** (gatilho `pull_request`) — primeira vez que este repositório tem CI |
| **`docs-guard`** (CI) | PR que muda código sem a doc dona do assunto (matriz do §3, por caminho) e, em `src/**`/`supabase/**`, sem `docs/planejamento/ROADMAP.md`, e sem escape declarado → falha | `.github/workflows/docs-guard.yml` + `scripts/check-docs-matriz.mjs` (testes em `scripts/check-docs-matriz.test.mjs`, no gate) | **Ativo em toda PR** desde 14/10/2026 (decisão do dono). O script roda da `main`, não da branch da PR. Para **bloquear o merge**, o check `docs-guard` precisa estar marcado como obrigatório na proteção da `main` (GitHub → Settings → Branches); sem isso ele só fica vermelho. Local: `node scripts/check-docs-matriz.mjs --base origin/main` |
| **E-mails do Auth em dia** | `tenants/<slug>/emails/` defasado em relação ao gerador, aos tokens ou ao perfil do tenant | `bun scripts/emails/gerar-templates-email.ts --check` | **Só convenção:** roda local; fora do gate e do CI porque depende de bun |
| **Template de PR** | Checklist da matriz na abertura de toda PR | `.github/pull_request_template.md` | Ativo (todo PR usa o template por padrão) |

**O `docs-guard` roda em toda PR**, mas só **impede o merge** se o check estiver
nos required status checks da proteção da `main`. Não afirme que ele bloqueia
merge sem conferir essa configuração no GitHub.

## 7. O que NUNCA fazer

- **Não reescrever registros históricos** (`docs/AUDITORIA_USUARIOS.md`,
  `docs/INVENTARIO_HARDCODE.md`, planos datados em `docs/historico/`). Eles
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
realidade deste repositório; unificado em 2026-10-06 com a versão curta que já
estava no `main`. Doc canônica viva — alterações neste processo devem ser feitas
aqui e refletidas em `AGENTS.md`/`CONTRIBUTING.md` (que apenas apontam para cá).*
