# Arquitetura

## Visão de alto nível

```
┌──────────────────────────────────────────────────────────────┐
│                        NAVEGADOR / PWA                         │
│   React 18 (SPA) + shadcn/ui + Tailwind  ·  Vite build         │
│   react-router-dom (rotas)  ·  React Query (cache de dados)    │
└───────────────┬──────────────────────────────┬───────────────┘
                │ supabase-js (HTTPS/JWT)        │ Edge Functions (HTTPS)
                ▼                                ▼
┌──────────────────────────────────────────────────────────────┐
│                          SUPABASE                              │
│  Postgres (231 tabelas, 15 views, 47 RPC)                      │
│  Auth (JWT)  ·  Storage  ·  Row Level Security                 │
│  Edge Functions (Deno) — operações privilegiadas/admin         │
└──────────────────────────────────────────────────────────────┘

Hospedagem do front: Vercel (SPA, rewrite p/ index.html) / Lovable.
```

O front é uma **SPA** que fala diretamente com o Supabase via `supabase-js`
(consultas, mutações, RPC, auth, storage). Operações que exigem privilégios
elevados (service role) — criar/excluir usuários, resetar senha, backup,
schema — são feitas por **Edge Functions**.

## Camadas do front-end

```
Páginas (src/pages)        →  Composição de UI por rota. Sem lógica de dados pesada.
   │
Componentes (src/components)→  UI reutilizável (shadcn/ui em ui/, domínio em <dominio>/)
   │
Hooks (src/hooks)          →  CAMADA DE DADOS. React Query + supabase. use<Dominio>.
   │
Integração (src/integrations/supabase)  →  client.ts (gerado) + types.ts (gerado)
   │
Lib (src/lib)              →  Lógica pura: cálculos (folha/frequência), geradores
                              (PDF/Word/CNAB/eSocial), formatters, utils.
```

**Regra de ouro:** componentes de página não chamam `supabase` direto — usam um
hook do domínio. A lógica de negócio reutilizável vive em `src/lib`.

## Roteamento

- **Tudo em `src/App.tsx`** — um único `<Routes>` (~1240 linhas) com blocos
  comentados por módulo. Para adicionar página: importar no topo + registrar a
  `<Route>` no bloco do módulo.
- Três tipos de rota:
  - **Públicas** — `<PublicPageGuard rota="...">`: checa status de manutenção/
    publicação da rota (configurável em `config_paginas_publicas`).
  - **Protegidas** — `<ProtectedRoute>`: exige autenticação. Aceita props
    `requiredModule`/`requiredPermissions` (ver observação no RBAC).
  - **Mobile/PWA** — `/patrimonio-mobile`, `/instalar`.

## Autenticação

- `src/contexts/AuthContext.tsx` é a **fonte única de verdade**. Estratégia:
  `supabase.auth.onAuthStateChange` é o único disparador de estado; `signIn`/
  `signOut` apenas acionam a ação e o listener processa — sem race conditions.
- Após login, o contexto deriva o acesso de duas tabelas: `user_roles` (papel
  `admin` → `isSuperAdmin`) e `user_modules` (permissões em **nível de módulo**),
  com cache em memória (TTL ~60s). Expõe `hasPermission`, `hasAnyPermission`,
  `hasAllPermissions`, `isSuperAdmin`, `refreshPermissions`, etc. As permissões
  são hierárquicas: ter o módulo `rh` concede `rh.*`. (A RPC
  `listar_permissoes_usuario` e o RBAC granular **não** alimentam o contexto em
  runtime — ver [RBAC_PERMISSOES.md](./RBAC_PERMISSOES.md) e
  [AUDITORIA_USUARIOS.md](./AUDITORIA_USUARIOS.md).)
- Tokens persistidos em `localStorage`; refresh automático.
- Detalhes do modelo de acesso em [RBAC_PERMISSOES.md](./RBAC_PERMISSOES.md).

## Estado e dados (React Query)

`QueryClient` configurado em `src/App.tsx`:

```ts
staleTime: 60s · gcTime: 5min · retry: 1 · refetchOnWindowFocus: false
```

Cada domínio tem hooks `use<Coisa>` que encapsulam queries/mutations e invalidam
caches relevantes. Estatísticas de dashboard ficam em `use<Modulo>DashboardStats`.

## Backend (Supabase)

- **Postgres**: 231 tabelas, 15 views (prefixo `v_`, usadas em transparência e
  relatórios), 47 funções/RPC (cálculos de folha, INSS/IRRF, SLA de processos,
  controle de acesso, fechamento de folha, etc.). Ver [BANCO_DE_DADOS.md](./BANCO_DE_DADOS.md).
- **RLS (Row Level Security)**: políticas no banco controlam acesso por linha;
  funções como `has_permission`, `has_role`, `user_has_unit_access`,
  `usuario_tem_acesso_modulo` apoiam essas políticas.
- **Migrações**: `supabase/migrations/*.sql` (~240), nomeadas
  `YYYYMMDDHHMMSS_<uuid>.sql`, geradas tipicamente pelo Lovable.
- **Storage**: anexos (documentos, demandas ASCOM, galerias, frequência).
- **Edge Functions**: ver [EDGE_FUNCTIONS.md](./EDGE_FUNCTIONS.md).

## Geração de documentos (offline, no client)

Toda a emissão de PDFs/planilhas/Word acontece **no navegador** (sem servidor de
relatórios), em `src/lib`:

- **PDF**: `jspdf` + `pdf-lib` — ~40 geradores (`pdf*.ts`), com base em
  `pdfTemplate.ts`/`pdfLogos.ts`.
- **Word**: `docx` — `wordPortarias.ts`.
- **Planilhas**: `xlsx` — `src/export/`, `src/lib/exportar*.ts`.
- **Fiscais/folha**: `cnabGenerator.ts` (remessa bancária CNAB),
  `esocialGenerator.ts`/`esocialXmlGenerator.ts` (eSocial).

## Build, PWA e deploy

- **Vite 5** + `@vitejs/plugin-react-swc`. Alias `@` → `src/`.
- **PWA** via `vite-plugin-pwa` (registrado em `src/main.tsx`); ícones/manifest
  em `public/` — habilita o app mobile de patrimônio.
- **Deploy**: Vercel (`vercel.json` reescreve todas as rotas para `/index.html`,
  padrão SPA). Backend e Edge Functions no Supabase.

## Variáveis de ambiente

`.env` (prefixo `VITE_`, expostas ao client):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` (chave anônima — segura no client; o acesso é
  controlado por RLS)
- `VITE_SUPABASE_PROJECT_ID`
