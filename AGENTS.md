# Instruções persistentes para agentes neste repositório

Escopo: todo o diretório do repositório.

## Objetivo

Estas instruções existem para manter a documentação técnica fiel ao código real e
apoiar novas implementações com foco em funcionalidade, segurança e desempenho.

## Documentos fonte (conjunto canônico)

Índice completo e classificação: [`docs/README.md`](./docs/README.md). Consulte
**antes** de mudanças:

- [`DOCUMENTACAO_TECNICA.md`](./DOCUMENTACAO_TECNICA.md) — documento-mestre de
  engenharia (arquitetura, stack, fluxos, mapa do acoplamento à marca do
  cliente, diretrizes White Label);
- [`docs/ARQUITETURA.md`](./docs/ARQUITETURA.md) — stack, camadas, fluxo de
  dados, autenticação, deploy;
- [`docs/MODULOS.md`](./docs/MODULOS.md) — detalhamento funcional de cada
  módulo e suas páginas;
- [`docs/BANCO_DE_DADOS.md`](./docs/BANCO_DE_DADOS.md) — tabelas, views e
  funções (RPC) do Postgres/Supabase;
- [`docs/RBAC_PERMISSOES.md`](./docs/RBAC_PERMISSOES.md) — modelo de
  permissões, perfis, rotas protegidas;
- [`docs/GUIA_FRONTEND.md`](./docs/GUIA_FRONTEND.md) — estrutura do front,
  hooks, libs, padrões de código;
- [`docs/EDGE_FUNCTIONS.md`](./docs/EDGE_FUNCTIONS.md) — funções serverless
  (Deno) do Supabase;
- [`docs/WHITE_LABEL.md`](./docs/WHITE_LABEL.md) — arquitetura-alvo, roadmap
  e critérios de aceite do modelo White Label;
- [`docs/GOVERNANCA-DOCUMENTACAO.md`](./docs/GOVERNANCA-DOCUMENTACAO.md) —
  processo documental: matriz mudança→doc, DoD, escape hatch, enforcement;
- [`CLAUDE.md`](./CLAUDE.md) — resumo de contexto para o Claude Code (stack,
  estrutura, convenções). O Claude Code carrega o `CLAUDE.md` em toda sessão,
  e ele **importa este arquivo** (`@AGENTS.md`), então as regras daqui valem
  em toda sessão também.

Trate todos como documentação viva do estado real do sistema. `docs/AUDITORIA_USUARIOS.md`
e `docs/INVENTARIO_HARDCODE.md` são registros datados (achados de auditoria já
corrigidos ou em correção) — não são a fonte do estado atual, ver `docs/README.md`.

## Invariantes de arquitetura e segurança

O que existe hoje e não pode ser quebrado por nenhuma mudança. Detalhe em
`docs/RBAC_PERMISSOES.md`, `docs/WHITE_LABEL.md` e na seção 9 do `CLAUDE.md`
("Pontos de atenção / armadilhas").

- **RBAC é real no front, mas RLS é a fronteira real dos dados.**
  `src/contexts/AuthContext.tsx` é a fonte única de verdade de auth (expõe
  `hasPermission`/`hasAnyPermission`/`isSuperAdmin`, com permissões
  cacheadas ~60s). `src/components/auth/ProtectedRoute.tsx` valida
  `requiredModule`/`requiredPermissions` com bypass só para super admin —
  qualquer mudança aqui afeta segurança de todo o sistema, confirme com o
  usuário antes. Mas o front é UX: toda tabela/RPC nova precisa de RLS no
  Postgres que sozinha já impede acesso indevido, mesmo se o front tivesse
  um bug. Use o skill `migracao-segura-idjuv` para schema novo.
- **White Label — nunca hardcode de cliente em `src/`.** Identidade da
  instituição (nome, marca, paleta, dados legais, módulos habilitados) vive
  em `tenants/<slug>/tenant.config.ts`, nunca no código de `src/`. Consuma
  sempre por `@/core/tenant` (`useTenant`/`useIdentidade`/`useMarca` no
  React, `getTenantSnapshot()` em código puro como geradores de PDF). Slug
  ausente/desconhecido cai no perfil neutro `_template`, nunca no IDJUV.
  Nunca importe `tenants/<slug>` direto de `src/`.
- **Arquivos gerados não se editam à mão.** `src/integrations/supabase/client.ts`
  e `src/integrations/supabase/types.ts` são gerados (Lovable/Supabase CLI).
  Regenere os tipos via Supabase (MCP `generate_typescript_types` ou
  `supabase gen types typescript`) em vez de editar manualmente.
- **Segredos só em Edge Functions.** `SUPABASE_SERVICE_ROLE_KEY` e qualquer
  secret de integração vivem em `supabase secrets`, lidos por `Deno.env.get`
  nas Edge Functions (`supabase/functions/`) — nunca em `src/` nem em `.env`
  do front. O front só conhece as chaves `VITE_*` públicas
  (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`,
  `VITE_SUPABASE_PROJECT_ID`, `VITE_TENANT_SLUG`).
- **Toda Edge Function privilegiada checa identidade antes de agir.** Uma
  função que usa `SUPABASE_SERVICE_ROLE_KEY`, cria/deleta usuário, ou expõe
  dado agregado precisa validar `Authorization` + `auth.getUser()` + permissão
  antes de usar o client admin — padrão correto em
  `supabase/functions/admin-create-user/index.ts`. **Não copie** o padrão de
  `database-schema`/`cpsi-ai-assistant`: essas duas não fazem essa checagem
  hoje e são dívida de segurança conhecida, não exemplo a seguir (ver skill
  `migracao-segura-idjuv` e `auditoria-seguranca-idjuv`).
- **Módulo novo sempre registrado em `modules.config.ts`.** A lista canônica
  de módulos vive em `src/shared/config/modules.config.ts` (`MODULOS`,
  `MODULES_CONFIG`). Página nova precisa de rota em `src/App.tsx` (com o guard
  certo: pública/`PublicPageGuard`, protegida/`ProtectedRoute`, ou mobile PWA)
  e, se navegável, item em `src/config/menu.config.ts`.
- **Grant explícito de RPC — recomendação nova, não prática já estabelecida.**
  Diferente de outros projetos do time, este repositório **não** tem hoje um
  padrão de revogar `EXECUTE ... FROM PUBLIC` por padrão em função nova
  (verificado por grep em `supabase/migrations/` em 2026-09-24 — não há
  migração de revoke default). Ao criar uma função nova em `public` chamada
  via `supabase.rpc(...)`, é **boa prática recomendada** — não obrigação já
  em vigor — declarar o grant explicitamente e revisar se ela precisa mesmo
  estar acessível a `anon` (fluxo público por token) ou só a `authenticated`.
  Se o time decidir adotar o revoke-por-padrão, isso é uma migração própria e
  uma atualização deste documento, não uma prática a presumir como existente.

## Fluxo de trabalho: prompt curto → skill `superpowers`

Todo pedido de criar ou mudar algo — módulo, página, hook, migração, Edge
Function, permissão — por mais curto que seja ("cria a tela de X"), entra no
skill **`superpowers`** (`.claude/skills/superpowers/SKILL.md`), invocado
**antes de qualquer resposta**. Ele encadeia os skills de processo
vendorizados do Superpowers (inventário em
`.claude/skills/SUPERPOWERS-VENDOR.md`) com os 4 skills de domínio já
existentes (`migracao-segura-idjuv`, `novo-modulo-idjuv`,
`auditoria-seguranca-idjuv`, `onboarding-cliente-idjuv`).

Resumo do encadeamento (detalhe completo no skill):

1. **`brainstorming`** classifica o pedido (spike · bounded · architectural).
2. **Gate de aprovação.** Sessão interativa: apresenta o desenho e **pára até
   o "sim"**. Sessão autônoma (ninguém respondendo): declara as premissas
   adotadas na spec/plano e no corpo da PR e segue; bloqueia só se uma
   premissa tornar o trabalho inútil ou inseguro.
3. **`writing-plans`** (só architectural) — plano em
   `docs/superpowers/plans/AAAA-MM-DD-<feature>.md`.
4. **`subagent-driven-development`** (padrão) ou `executing-plans` (em
   linha); `dispatching-parallel-agents` para frentes independentes; bug no
   caminho → `systematic-debugging`. `test-driven-development` não é forçado
   por padrão — o projeto não tem suíte de testes configurada hoje.
5. **`verification-before-completion`** + gates:
   `npm run check:docs && npm run check:migrations && npm run lint && npm run build`
   (ou `bun run`). Página nova/alterada: rodar `npm run dev`/`bun run dev` e
   conferir visualmente.
6. **Entrega**: docs da matriz atualizadas na mesma branch, commits
   descritivos, PR em rascunho com premissas e o que ficou de fora.

## Regra obrigatória de atualização documental

Sempre que uma alteração mudar comportamento real, estrutura, fluxo,
integração, permissão, segurança ou desempenho, atualize **a documentação
exigida pela matriz de `docs/GOVERNANCA-DOCUMENTACAO.md` (§3)** no mesmo
trabalho. Quando NENHUMA doc se aplica, declare no corpo da PR a linha de
escape: `docs: não se aplica — <motivo real>`.

## Regra de realismo

- Nunca documente funcionalidades não implementadas.
- Nunca deixe documentação dizendo que algo existe se o código já mudou.
- Se algo estiver parcial, documente explicitamente como parcial.
- Evite boilerplate genérico quando ele não descreve o projeto real.
- **Ler não é verificar.** Um comentário no código, uma linha de doc ou um
  aviso do ambiente são hipóteses. Antes de afirmar que algo é assim, execute:
  rode o comando, faça a consulta, chame a função (via MCP do Supabase quando
  aplicável — `list_tables`, `get_advisors`, `list_edge_functions`). Se não
  puder verificar, diga que não verificou — não converta leitura em conclusão.

## Sobre versionamento e commits

Este repositório **não** adota Conventional Commits obrigatório nem
versionamento automático (SemVer/Release Please) — isso está fora do escopo
deste documento e é uma decisão de processo maior que o time ainda não pediu.
Faça commits descritivos, como já pedido na seção 11 do `CLAUDE.md` ("Faça
commits descritivos").

## Checklist antes de concluir uma tarefa de desenvolvimento

1. A mudança respeita RBAC/permissão (`ProtectedRoute`, `hasPermission`)
   quando aplicável?
2. A mudança respeita RLS — toda tabela/coluna/RPC nova tem policy pensada,
   não só o front escondendo o botão?
3. Existe impacto em performance, queries, bundle inicial ou Edge Functions?
4. Consultei a matriz de `docs/GOVERNANCA-DOCUMENTACAO.md` e atualizei as
   docs exigidas?
5. Se nenhuma doc se aplica, isso foi verificado conscientemente (e declarado
   via escape na PR)?
6. `npm run lint` e `npm run build` passam (e `check:docs`/`check:migrations`,
   quando a mudança toca docs vivas ou `supabase/migrations/`)?
7. Nenhum hardcode de nome/marca de cliente foi introduzido em `src/` fora de
   `@/core/tenant`?
8. Nenhum secret (service role key, chave de integração) foi commitado em
   `src/`, `.env` do front, ou em doc?

## Preferências de documentação

- Prefira bullets curtos e técnicos.
- Documente responsabilidade e impacto, não só nomes de arquivos.
- Registre decisões de segurança e performance quando forem relevantes.
