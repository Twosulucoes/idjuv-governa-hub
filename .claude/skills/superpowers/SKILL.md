---
name: superpowers
description: Use ANTES de qualquer resposta quando o usuário pedir para criar ou mudar algo no IDJUV Governa Hub — um módulo, página, hook, migração, Edge Function, permissão/RBAC, item de menu — mesmo em pedido curto tipo "cria a tela de X" ou "adiciona um campo em Y", ou quando digitar `/superpowers`. Não é para bug isolado (use `systematic-debugging`) nem para pergunta que não muda código.
---

# /superpowers — fluxo estruturado do IDJUV Governa Hub

Um prompt curto não é uma tarefa curta. Este skill pega "cria a tela de X" e
transforma em: desenho aprovado → plano (quando necessário) → execução por
subagentes → verificação → documentação → PR em rascunho. Ele **encadeia** os
skills vendorizados do Superpowers (`.claude/skills/`, ver
`SUPERPOWERS-VENDOR.md`) com as regras deste repositório (`CLAUDE.md`,
`AGENTS.md`) e com os 4 skills de domínio já existentes:
`migracao-segura-idjuv`, `novo-modulo-idjuv`, `auditoria-seguranca-idjuv`,
`onboarding-cliente-idjuv`.

**Regra de ouro:** invoque este skill antes de qualquer resposta, inclusive
antes de perguntar ou de abrir arquivos. Anuncie "Usando superpowers para
<objetivo>".

## Passo 1 — Classificar e desenhar (`brainstorming`)

Invoque `brainstorming`. Ele classifica o pedido e diz em voz alta:

- **Spike** — pergunta de viabilidade; sai uma recomendação, não código.
- **Bounded** — mudança pequena num fluxo que **já existe** no repo (campo
  novo num formulário, filtro novo numa lista, ajuste numa página). Desenho
  curto no chat, sem spec.
- **Architectural** — módulo novo, página nova que precisa de rota+menu,
  tabela nova, mudança de contrato (hook, RPC, Edge Function) que outras
  telas dependem. Spec/plano em `docs/superpowers/plans/`.

Na dúvida, o caminho mais pesado. Descobriu complexidade no meio → sobe de
caminho e avisa.

**O que o desenho precisa cobrir neste produto** (levante antes de perguntar;
pergunte só o que o código e as docs não respondem):

| Eixo | Onde olhar | O que decidir |
|---|---|---|
| Schema e RLS | `docs/BANCO_DE_DADOS.md`, skill `migracao-segura-idjuv` | Se toca tabela/coluna/função nova, o skill `migracao-segura-idjuv` já cobre o passo a passo (nome de arquivo, RLS obrigatório, grant de RPC) — use-o em vez de reinventar |
| RBAC / permissão | `docs/RBAC_PERMISSOES.md`, `src/contexts/AuthContext.tsx`, `src/components/auth/ProtectedRoute.tsx` | Que `requiredModule`/`requiredPermissions` a rota exige; enforcement real é RLS no banco, o front é só UX |
| Rota e menu | `src/App.tsx` (bloco do módulo), `src/config/menu.config.ts`/`module-menus.config.ts` | Categoria da rota (pública com `PublicPageGuard`, protegida, mobile PWA); se for módulo novo, também `src/shared/config/modules.config.ts` (`MODULOS`) — nesse caso pare e confirme com o usuário antes de criar módulo, e considere o skill `novo-modulo-idjuv` |
| White Label / tenant | `src/core/tenant/README.md`, `docs/WHITE_LABEL.md` | Nunca hardcode de nome/marca do cliente em `src/`; consumir por `@/core/tenant` (`useTenant`/`useIdentidade`/`useMarca`/`getTenantSnapshot`) |
| Edge Function | `docs/EDGE_FUNCTIONS.md` | Checagem de auth/identidade antes de ação privilegiada (padrão em `supabase/functions/admin-create-user/index.ts` — não copiar `database-schema`/`cpsi-ai-assistant`, que são dívida conhecida) |
| Documentação | `docs/GOVERNANCA-DOCUMENTACAO.md` §3 | Quais docs mudam na mesma PR |
| Feature completa (tipo + hook + componente + página + rota + menu) | skill `novo-modulo-idjuv` | Segue a receita da seção 10 do `CLAUDE.md` — use o skill em vez de fazer manualmente |
| Nova instância para outro cliente | skill `onboarding-cliente-idjuv` | Fora do escopo deste fluxo — delegue direto |

Junte as dúvidas que importam. Em sessão interativa, faça-as como o skill
`brainstorming` manda (uma de cada vez, a que mais muda o desenho primeiro).

## Passo 2 — Gate de aprovação (depende de quem está na sessão)

- **Sessão interativa** (alguém responde no terminal ou na web): apresente o
  desenho (bounded) ou a spec (architectural) e **pare até o "sim" explícito**.
  Aprovar a ideia não aprova a spec; aprovar a spec não aprova o plano. Nada de
  código antes.
- **Sessão autônoma** (disparada por rotina, sem ninguém acompanhando): não há
  gate humano. Escreva as **premissas adotadas** no topo da spec/plano e no
  corpo da PR, e siga. Pare só se alguma premissa tornaria o trabalho inútil
  ou inseguro (RLS ausente em tabela nova, secret exposto no front, hardcode
  de cliente em `src/`).

## Passo 3 — Plano (`writing-plans`, só architectural)

Invoque `writing-plans`. Plano em
`docs/superpowers/plans/AAAA-MM-DD-<feature>.md`, em tarefas pequenas, cada
uma com arquivos, código e doc da matriz que ela toca. Toda tarefa que mexe em
schema começa pela migração (seguindo `migracao-segura-idjuv`) +
`docs/BANCO_DE_DADOS.md`; toda tarefa de tela cita a rota e o item de menu que
vai registrar. Bounded não gera plano: vai direto ao Passo 4 com o desenho
aprovado.

## Passo 4 — Execução

- Padrão: `subagent-driven-development` — um subagente implementador por
  tarefa, revisão por tarefa, revisão final da branch. Só cai para
  `executing-plans` (você mesmo, em linha) se a pessoa escolher ou se não
  houver ferramenta de subagente disponível.
- Frentes independentes (UI × migração/RPC × Edge Function) →
  `dispatching-parallel-agents`.
- **Brief de cada subagente** inclui: a tarefa do plano; as seções do
  `CLAUDE.md` e do `AGENTS.md` que valem para ela; os arquivos de
  **referência viva** que ele deve ler antes de escrever (o hook/página mais
  parecido já existente no domínio); os invariantes de RBAC/RLS/tenant.
  Subagente não herda o contexto da sessão — o que não estiver no brief não
  existe para ele.
- Sobre `test-driven-development`: seja honesto. O IDJUV Governa Hub **não
  tem suíte de testes configurada** hoje — só `lint` + `build` (checagem de
  tipos roda no build). Não force TDD por padrão. Se a tarefa envolver lógica
  pura de alto risco (cálculo de folha, CNAB, eSocial, frequência), pode
  propor introduzir um teste pontual como parte do plano — deixe explícito no
  plano/PR que seria a primeira vez que o repo ganha um teste automatizado, e
  confirme com o usuário antes de adicionar a dependência de test runner.
- Bug encontrado no caminho → `systematic-debugging`, não remendo.

## Passo 5 — Verificação (`verification-before-completion`)

Nada de "deve funcionar". Antes de dizer que terminou:

```bash
npm run check:docs && npm run check:migrations && npm run lint && npm run build
# ou, com bun:
bun run check:docs && bun run check:migrations && bun run lint && bun run build
```

(`check:docs` e `check:migrations` existem a partir da mesma leva de mudanças
que introduziu este skill — ver `scripts/check-doc-links.mjs` e
`scripts/check-migrations.sh`.)

Página nova ou fluxo alterado se vê rodando: `npm run dev`/`bun run dev` e
conferência visual (o repo não tem Playwright/Chromium configurado — não
prometa screenshot automatizado que o projeto não tem). Teste em mobile
(a app tem PWA mobile de patrimônio) e desktop quando a tela afetar os dois.

## Passo 6 — Entrega

- Docs da matriz atualizadas na mesma branch
  (`docs/GOVERNANCA-DOCUMENTACAO.md` §3); sem doc aplicável → linha de escape
  `docs: não se aplica — <motivo>` no corpo da PR.
- Commits descritivos (ver `AGENTS.md` — este repo não usa Conventional
  Commits obrigatório nem versionamento automático, mas mensagens claras
  ajudam quem revisa).
- `finishing-a-development-branch` → a saída é sempre **PR em rascunho** com:
  o que muda, premissas adotadas, o que ficou de fora e por quê, checklist do
  template (`.github/pull_request_template.md`). Nunca merge por conta
  própria.

## Exemplo — "adiciona um campo de telefone alternativo no cadastro de servidor"

1. `brainstorming`: architectural? Não — a página de cadastro de servidor e o
   hook `useServidores` já existem; é **bounded**. Contexto: formulário atual
   em `src/pages/rh/` (o mais próximo do domínio), tipo em `src/types/rh.ts`.
   Dúvida que importa: o campo vai para uma coluna nova (precisa de migração
   + `migracao-segura-idjuv`) ou é metadado dentro de um JSON já existente?
2. Desenho no chat: se for coluna nova, migração com RLS herdado da tabela
   (mesma policy de leitura/escrita de RH), tipo atualizado, campo no
   formulário react-hook-form + zod, doc: `docs/BANCO_DE_DADOS.md` (se coluna
   nova) + `docs/GUIA_FRONTEND.md` (se padrão de formulário mudar). **Para.**
3. Aprovado → `subagent-driven-development` com um brief apontando o hook e a
   página de referência → gates do Passo 5 → PR em rascunho.
