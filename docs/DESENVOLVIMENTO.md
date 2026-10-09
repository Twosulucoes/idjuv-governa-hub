# Desenvolvimento

## Pré-requisitos

- **Node.js** (LTS) ou **Bun**. O repo tem `bun.lock` e
  `package-lock.json` — prefira **bun** se disponível; senão `npm`.
- Acesso ao projeto **Supabase** (URL + chave anônima) configurado no `.env`.

## Setup

```bash
bun install           # ou: npm install
cp .env .env.local    # se precisar de overrides locais (Vite lê ambos)
bun run dev           # http://localhost:5173 (Vite)
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

- **Front**: Vercel (deploy automático por push/PR; `vercel.json` faz rewrite SPA).
- **Backend / Edge Functions**: Supabase.
