# Desenvolvimento

## Pré-requisitos

- **Node.js** (LTS) ou **Bun**. O repo tem `bun.lock` e
  `package-lock.json` — prefira **bun** se disponível; senão `npm`.
- Acesso ao projeto **Supabase** (URL + chave anônima) configurado no `.env`.

## Setup

```bash
bun install           # ou: npm install
cp .env .env.local    # se precisar de overrides locais (Vite lê ambos)
bun run dev           # http://localhost:8080 (Vite, ver vite.config.ts)
```

Variáveis necessárias (`.env`):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...   # chave anônima
VITE_SUPABASE_PROJECT_ID=...
```

## Comandos

```bash
bun run dev          # servidor de desenvolvimento
bun run build        # build de produção (não checa tipos; o typecheck está no gate)
bun run build:dev    # build em modo development
bun run lint         # ESLint
bun run preview      # serve o build localmente
```

> **Verificação:** `bash scripts/gate.sh` (guards, testes vitest de `src/` e
> `scripts/`, typecheck, lint e build). Antes da PR, confira a documentação que a
> matriz exige com `node scripts/check-docs-matriz.mjs --base origin/main` (é o
> que o `docs-guard` cobra em toda PR, ver `CONTRIBUTING.md`). Quando possível,
> rode `bun run dev` e valide o fluxo no navegador com diferentes perfis.

## Banco de dados

- Migrações em `supabase/migrations/*.sql`. Para mudanças de schema, **crie uma
  migração nova** — não edite migrações antigas.
- Após mudar o schema, **regenere** `src/integrations/supabase/types.ts`
  (via CLI do Supabase `supabase gen types typescript` ou pelo MCP do Supabase).
  Esse arquivo é **gerado** — não editar à mão.
- Edge Functions: ver [EDGE_FUNCTIONS.md](./EDGE_FUNCTIONS.md).

### Aplicação automática das migrações (CI)

O workflow `.github/workflows/migracoes-banco.yml` leva `supabase/migrations/` ao banco de produção
(Supabase self-hosted da VPS) sem passo manual:

| Quando | O que faz |
|---|---|
| PR que muda `supabase/migrations/` | `supabase db push --dry-run`: lista no resumo do job o que vai rodar; o banco não muda |
| Merge na `main` | `supabase db push`: aplica as pendentes |
| Manual (`workflow_dispatch` na `main`) | aplica as pendentes (útil depois de configurar o segredo) |

- **O Postgres da VPS não é exposto na internet.** O job abre um túnel SSH até a VPS e fala com o banco
  por ele (mesma premissa do backup). Segredos em Settings → Secrets and variables → Actions:

  | Segredo | Conteúdo |
  |---|---|
  | `VPS_SSH_HOST` | endereço da VPS |
  | `VPS_SSH_USER` | usuário só para isto (sem sudo; basta poder abrir túnel) |
  | `VPS_SSH_KEY` | chave privada desse usuário (gere uma só para o CI) |
  | `VPS_SSH_KNOWN_HOSTS` | saída de `ssh-keyscan <host>`: fixa a identidade da VPS |
  | `SUPABASE_DB_SENHA` | senha do papel `postgres` |

  Variável opcional `DB_DESTINO_NA_VPS` (padrão `127.0.0.1:5432`): onde o Postgres escuta, visto de
  dentro da VPS. Sem os segredos o job só avisa (não falha) e nada é aplicado.
- **Trava:** se houver mais pendentes que `LIMITE_MIGRACOES` (variável do repositório, padrão 10), o job
  falha sem aplicar nada. Isso pega o caso de o banco não reconhecer o histórico (tabela
  `supabase_migrations.schema_migrations` vazia ou divergente), em que o push tentaria rodar centenas de
  migrações antigas. Conserto: marcar como aplicadas as que já estão no banco com
  `supabase migration repair --db-url <url pelo túnel> --status applied <versão>...` (de dentro da VPS ou com o mesmo túnel SSH) e rodar de novo.
- Por isso toda migração precisa ser segura para rodar sozinha no merge: idempotente quando possível
  (`IF NOT EXISTS`), sem depender de passo manual, com RLS na própria migração.
- **Conferências depois de aplicar** (só no merge): o job falha, com o banco já alterado, se faltar o que uma
  migração só consegue avisar — os 3 triggers `trilha_rh_storage_*` em `storage.objects` (E2) e, desde a E3, os 3
  índices únicos da remessa CNAB e do eSocial e o `BYPASSRLS` do dono de `remessa_integridade()` (detalhes em
  [BANCO_DE_DADOS.md](./BANCO_DE_DADOS.md#integridade-da-remessa-cnab-e-do-esocial--onda-e3-banco)).
- Depois do merge, regenere `src/integrations/supabase/types.ts` contra o banco de produção.

## Como adicionar uma feature (receita)

1. **Tipos** — `src/types/<dominio>.ts`.
2. **Dados** — hook em `src/hooks/use<Dominio>.ts` (React Query + `supabase`).
   Se precisar de schema novo: migração + regenerar tipos.
3. **UI** — componentes em `src/components/<dominio>/` (shadcn/ui + Tailwind).
4. **Página** — `src/pages/<dominio>/<Nome>Page.tsx`.
5. **Rota** — importar a page e registrar a `<Route>` no bloco do módulo em
   `src/App.tsx`, com o guard apropriado (`PublicPageGuard` ou `ProtectedRoute`).
6. **Menu/módulo** — item em `src/config/menu.config.ts`; módulo novo em
   `src/shared/config/modules.config.ts`.
7. **Permissões** — se aplicável, registrar em `ROUTE_PERMISSIONS`/
   `MODULE_PERMISSIONS` (`src/types/auth.ts`) e na permissão do item de menu.
8. **Verificar** — `bun run lint` && `bun run build`.

## Ambiente de desenvolvimento em nuvem (Claude Code na web)

Sessões do Claude Code na nuvem clonam o repo num container novo. O hook
`.claude/hooks/session-start.sh` (registrado em `.claude/settings.json`) prepara o
ambiente sozinho:

1. instala as dependências (`npm install --no-package-lock`) — lint, typecheck,
   build e `npm run gate` funcionam sem configuração nenhuma;
2. se o ambiente de nuvem tiver `VITE_SUPABASE_URL` e
   `VITE_SUPABASE_PUBLISHABLE_KEY` (e opcionalmente `VITE_SUPABASE_PROJECT_ID`,
   `VITE_TENANT_SLUG`), grava o `.env` (gitignored) para `npm run dev` conectar
   no Supabase;
3. imprime um resumo do ambiente para o Claude.

Para o app rodar de verdade na nuvem, cadastre essas variáveis nas
**configurações do ambiente** do Claude Code na web (variáveis de ambiente do
environment). Só valores públicos: a publishable key é a chave anônima
protegida por RLS. **Nunca** coloque a service role key ali nem no `.env` do
front. Use um Supabase de **desenvolvimento**, não o de produção. Com instância
**self-hosted** (caso do IDJUV, na VPS do cliente), `VITE_SUPABASE_URL` é a URL
dessa instância, a publishable key é a `anon key` dela e `VITE_SUPABASE_PROJECT_ID`
pode ficar vazio; branches do Supabase só existem na nuvem oficial, então o
ambiente de dev é uma segunda instância ou um `supabase start` local.

Gerador de prompts para o dia a dia: [`prompts/README.md`](../prompts/README.md)
(`/prompt`, `/pendencias`, `/finalizar`).

## Convenções

- Idioma do domínio: **português** (nomes, comentários, labels).
- Imports com alias `@/...`. Páginas `*Page.tsx`; hooks `use<Dominio>`.
- Combine com o estilo do arquivo vizinho. Veja [GUIA_FRONTEND.md](./GUIA_FRONTEND.md).

## Fluxo Git

- **Não** faça commit direto na `main`. Trabalhe em uma branch
  (`claude/<descricao>` ou `feature/<descricao>`).
- Commits descritivos. Push: `git push -u origin <branch>`.
- Abra **Pull Request** (draft) para revisão antes do merge.
- Repositório: `twosulucoes/idjuv-governa-hub`.

## Diffs focados

- Mantenha alterações **focadas**; evite reformatações massivas sem necessidade.
- Faça `git pull` antes de começar e antes de dar push.

## Deploy

A **VPS é a única produção** (`idjuv.online`): nginx servindo o front e Supabase self-hosted
(`bd.idjuv.online`). A Vercel foi desligada em 2026-10-09 para não existir um segundo site com outra
versão ou outro banco. Não há prévia por PR: teste local com `bun run dev`.

### Deploy do front (CI)

O workflow `.github/workflows/deploy-front.yml` roda a cada merge na `main` (e manualmente por
`workflow_dispatch`):

1. Se o commit traz migração, espera o workflow de migrações do mesmo commit terminar com sucesso
   (o front novo nunca chega antes do schema). Se as migrações falham, o front não é publicado.
2. Faz o build com as variáveis do repositório e confere que o bundle aponta para `VITE_SUPABASE_URL`.
3. Copia por `rsync` para a pasta do nginx: primeiro os arquivos com hash (`assets/`), depois
   os pontos de entrada (index, service worker do PWA e manifest). Quem está com o sistema aberto
   não quebra; assets antigos são apagados depois de `DIAS_ASSETS_ANTIGOS` dias (padrão 14).
   O `rsync` não apaga nada no destino: arquivo retirado de `public/` continua no ar até alguém
   apagá-lo. Por isso o workflow apaga explicitamente os retirados por vazamento
   (data/cargos.json e data/cargos.csv, que publicavam a indicação dos ocupantes); ao retirar outro
   arquivo sensível de `public/`, acrescente-o a essa lista.
4. Se `VPS_APP_DIR` existir, copia o mesmo build para a pasta do `app.idjuv.online` (sistema interno; por ora cópia completa do site, com `noindex` no nginx). Sem a variável o passo é ignorado.
5. Se `VPS_SITE_DIR` existir, faz também o **build `site`** (`npm run build:site` → `dist-site/`: só as páginas do site institucional, sem PWA e sem o sistema interno; `scripts/check-bundle-site.mjs` reprova vazamento) e publica na pasta do site. Endereços do sistema e do site vêm de `VITE_APP_URL` e `VITE_SITE_URL`, nunca do código.
6. Confere que `FRONT_URL` serve o build novo e que data/cargos.json não está mais no ar.

Configuração em Settings → Secrets and variables → Actions:

| Tipo | Nome | Conteúdo |
|---|---|---|
| Segredo | `VPS_SSH_HOST`, `VPS_SSH_KNOWN_HOSTS` | os mesmos das migrações |
| Segredo | `VPS_DEPLOY_USER` | usuário só para o deploy, dono apenas da pasta do site (sem sudo) |
| Segredo | `VPS_DEPLOY_KEY` | chave privada desse usuário (gere uma só para o CI) |
| Variável | `VPS_FRONT_DIR` | pasta que o nginx serve (ex.: `/var/www/idjuv`) |
| Variável | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`, `VITE_TENANT_SLUG` | os mesmos do `.env` de produção (valores públicos; a chave é a anon) |
| Variável (opcional) | `VPS_SITE_DIR`, `VITE_APP_URL`, `VITE_SITE_URL` | pasta do build `site` (`/var/www/idjuv-site`) e os endereços do sistema (`https://app.idjuv.online`) e do site (`https://idjuv.online`). `VITE_APP_URL` também vale no build do sistema: aberto por esse host, `/` vai direto para `/sistema` (logado) ou `/auth`, em vez da home pública; sem a variável nada redireciona |
| Variável (opcional) | `VPS_APP_DIR` | pasta que o nginx do `app.idjuv.online` serve (`/var/www/idjuv-app`, dono do usuário de deploy) |
| Variável (opcional) | `FRONT_URL`, `DIAS_ASSETS_ANTIGOS` | padrão `https://idjuv.online` e `14` |

Sem a configuração o job só avisa e não publica. O nginx precisa do fallback de SPA
(`try_files $uri $uri/ /index.html;`); recomenda-se `Cache-Control: no-cache` no index e no
service worker e cache longo em `/assets/`.

- **Backend / Edge Functions**: Supabase self-hosted da VPS; migrações pelo CI (seção acima).
