# Desenvolvimento

## Pré-requisitos

- **Node.js** (LTS) ou **Bun**. O repo tem `bun.lockb`/`bun.lock` e
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
bun run build        # build de produção (faz checagem de tipos do TS)
bun run build:dev    # build em modo development
bun run lint         # ESLint
bun run preview      # serve o build localmente
```

> **Não há testes automatizados** no momento. A verificação padrão é
> `bun run lint` + `bun run build`. Quando possível, rode `bun run dev` e valide
> o fluxo no navegador com diferentes perfis.

## Banco de dados

- Migrações em `supabase/migrations/*.sql`. Para mudanças de schema, **crie uma
  migração nova** (ou use o fluxo do Lovable) — não edite migrações antigas.
- Após mudar o schema, **regenere** `src/integrations/supabase/types.ts`
  (via CLI do Supabase `supabase gen types typescript` ou pelo fluxo do Lovable).
  Esse arquivo é **gerado** — não editar à mão.
- Edge Functions: ver [EDGE_FUNCTIONS.md](./EDGE_FUNCTIONS.md).

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

## Atenção: sincronização com Lovable

O projeto está conectado ao **Lovable**, que commita automaticamente. Para
reduzir conflitos:

- Mantenha alterações **focadas**; evite reformatações massivas sem necessidade.
- Lembre que o Lovable também pode alterar arquivos — faça `git pull` antes de
  começar e antes de dar push.

## Deploy

- **Front**: Vercel (deploy automático por push/PR; `vercel.json` faz rewrite SPA).
  Também publicável via Lovable (Share → Publish).
- **Backend / Edge Functions**: Supabase.
