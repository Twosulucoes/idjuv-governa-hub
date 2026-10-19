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
│  Postgres (tabelas, views, funções/RPC)                        │
│  Auth (JWT)  ·  Storage  ·  Row Level Security                 │
│  Edge Functions (Deno) — operações privilegiadas/admin         │
└──────────────────────────────────────────────────────────────┘

Hospedagem do front: VPS (nginx com fallback p/ index.html), dois builds:
sistema em app.idjuv.online e site institucional em idjuv.online.
```

Contagens (rotas, páginas, tabelas, views, funções, migrações): [ESTADO_DO_SISTEMA.md](./ESTADO_DO_SISTEMA.md).

O front é uma **SPA** que fala diretamente com o Supabase via `supabase-js`
(consultas, mutações, RPC, auth, storage). Operações que exigem privilégios
elevados (service role) — criar/excluir usuários, resetar senha,
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

- **Dois arquivos de rotas:** o sistema em `src/App.tsx` (entrada `src/main.tsx`), um único `<Routes>` com
  blocos comentados por módulo; o site institucional em `src/AppSite.tsx` (entrada `src/main-site.tsx`, build
  `npm run build:site`), só com as rotas de `ROTAS_DO_SITE` (abaixo). Para adicionar página: importar no topo +
  registrar a `<Route>` no bloco do módulo do arquivo certo.
- Três tipos de rota:
  - **Públicas** — `<PublicPageGuard rota="...">`: checa status de manutenção/
    publicação da rota (configurável em `config_paginas_publicas`).
  - **Protegidas** — `<ProtectedRoute>`: exige autenticação. Aceita props
    `requiredModule`/`requiredPermissions` (ver observação no RBAC).
    Rotas de **autoatendimento** (`/rh/meu-contracheque`, `/rh/meus-dados`) usam
    `<ProtectedRoute>` sem permissão: a página filtra pelo servidor vinculado ao
    usuário logado (`servidores.user_id`) e só mostra os dados dele.
  - **Mobile/PWA** — `/patrimonio-mobile`, `/instalar`. O `/patrimonio-mobile`
    inclui o modo "Vistoria de Unidade" do inventário de campo (fotos com fila
    offline; ver [MODULOS.md](./MODULOS.md)).
- Dois menus: o geral (`src/config/menu.config.ts`) e a barra lateral de cada módulo
  (`src/config/module-menus.config.ts`, usada pelo `ModuleSidebar`). Todo item dos dois precisa de `<Route>` no
  `App.tsx`; `src/config/menu.config.test.ts` reprova item que leve ao 404 (P09). Tela não construída fica fora do menu.
- **Portal público x sistema interno (17/10/2026):** rota pública usa o `MainLayout` (cabeçalho e rodapé do
  site); tela que exige login usa o `ModuleLayout`, inclusive as transversais (manuais, processos, formulários,
  notícias internas, apresentação, organograma), que sem `module` pegam o módulo da rota ou o primeiro do usuário.
  O menu do site fica em `src/config/menu-publico.config.ts` e só pode ter rota pública
  (`src/config/menu-publico.config.test.ts` reprova). O build `site` (`src/AppSite.tsx`) serve as rotas de `ROTAS_DO_SITE`
  (`src/core/modo-app.ts`): home, editais, base legal, notícias, galerias, transparência, denúncias, links úteis e
  os formulários públicos (`/curriculo`, `/cadastrogestores`, `/cadastro-arbitros`, `/federacoes/cadastro`,
  `/ascom/solicitar`, `/ascom/consultar`, `/programas/selecoes`). Telas internas embaixo dessas rotas
  (ex.: `/transparencia/admin`) ficam em `ROTAS_DO_SISTEMA_SOB_O_SITE`; `src/core/modo-app.test.ts` reprova rota
  protegida do `App.tsx` que caia no site. Endereço que o site não serve vai para o mesmo caminho no sistema
  (`destinoForaDoSite`, com query e hash), em vez de 404. Separação dos endereços (site em `idjuv.online`, sistema em
  `app.idjuv.online`): `docs/DESENVOLVIMENTO.md` (Deploy do front).
- Telas de módulo usam `ModuleLayout` (`src/components/layout/`), que inclui o sino de avisos
  (`AvisosSino`, no cabeçalho) e a faixa de avisos em destaque (`AvisosDestaque`, no topo do
  conteúdo); o mural completo fica em `/avisos` (protegida, qualquer usuário logado).
- **Configuração do cliente** em `/admin/configuracao-cliente` (`ConfiguracaoClientePage`,
  `requiredPermissions="admin.configuracao_cliente"`): grava a identidade da instituição em
  `dados_oficiais`, que o `TenantProvider` aplica por cima do perfil do tenant. Ver
  [CONFIGURACAO_CLIENTE.md](./CONFIGURACAO_CLIENTE.md).
- **Central de Importações** em `/admin/importacoes` (`ImportacoesPage`): a rota exige a permissão de
  algum importador (`PERMISSOES_IMPORTACAO`, de `src/lib/importacao/registro.ts`); o mesmo assistente
  também abre de dentro da tela do módulo (ex.: "Importar QDD (FIPLAN)" em `/financeiro/qdd`). Ver
  `docs/GUIA_FRONTEND.md` (Importação de dados). A rota usa a própria `PERMISSOES_IMPORTACAO` e o item de menu repete a mesma lista
  (`orcamento.importar`, `pagamento.conciliar`, `gabinete.portarias.importar`); `src/lib/importacao/registro.test.ts`
  reprova se ela se desencontrar de `PERMISSOES_IMPORTACAO`. A Central de Portarias tem o atalho "Importar planilha".
- Financeiro: `/financeiro/conciliacao` (`ProtectedRoute requiredModule="financeiro"
  requiredPermissions="pagamento.conciliar"`); `/financeiro/pagamentos/:id` abre o detalhe real do pagamento
  (`orcamento.aprovar`); `/financeiro/orcamento` só redireciona para `/financeiro/qdd`. O ano das telas do
  módulo vai na query `?exercicio=` (ver [MODULOS.md](./MODULOS.md)). `/financeiro` é declarada uma vez só
  (painel do módulo, `FinanceiroDashboardPage`, `requiredModule="financeiro"`).
- Quadro de vagas: `/cargos/vagas` (`QuadroVagasPage`, `ProtectedRoute requiredPermissions="governanca.cargos.visualizar"`;
  a página exige ainda o módulo `governanca`), com link em `/cargos` e item "Quadro de
  Vagas" no menu de governança. Importar a planilha exige `governanca.cargos.gerenciar` (ver
  [BANCO_DE_DADOS.md](./BANCO_DE_DADOS.md#quadro-de-vagas)).
- Inventário de campo: `/inventario/campanhas/:id/painel` (painel com mapa,
  `ProtectedRoute requiredPermissions="patrimonio.visualizar"`), com link na
  página de detalhe da campanha.
- Detalhes do patrimônio: `/inventario/movimentacoes/:id`, `/inventario/manutencoes/:id` e
  `/inventario/baixas/:id` (`MovimentacaoDetalhePage`, `ManutencaoDetalhePage`, `BaixaDetalhePage`), abertas
  pelo "olho" das listas, com as mesmas ações de aprovar/rejeitar/concluir (`patrimonio.tramitar`). As outras
  rotas de detalhe/edição do inventário ainda usam `PlaceholderDetalhePage`.

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
- Links dos e-mails do Auth (senha, convite, confirmação) abrem `/auth?token_hash=…&type=…`;
  `src/pages/AuthPage.tsx` valida com `verifyOtp` e mostra criar/redefinir senha ou o erro de
  link expirado — ver [EMAILS_AUTH.md](./EMAILS_AUTH.md).
- Detalhes do modelo de acesso em [RBAC_PERMISSOES.md](./RBAC_PERMISSOES.md).

## Estado e dados (React Query)

`QueryClient` configurado em `src/App.tsx`:

```ts
staleTime: 60s · gcTime: 5min · retry: 1 · refetchOnWindowFocus: false
```

Cada domínio tem hooks `use<Coisa>` que encapsulam queries/mutations e invalidam
caches relevantes. Estatísticas de dashboard ficam em `use<Modulo>DashboardStats`.

## Backend (Supabase)

- **Postgres**: tabelas, views (prefixo `v_`, usadas em transparência e
  relatórios) e funções/RPC (cálculos de folha, INSS/IRRF, SLA de processos,
  controle de acesso, fechamento de folha, etc.). Contagens em
  [ESTADO_DO_SISTEMA.md](./ESTADO_DO_SISTEMA.md); detalhes em [BANCO_DE_DADOS.md](./BANCO_DE_DADOS.md).
- **RLS (Row Level Security)**: políticas no banco controlam acesso por linha;
  funções como `has_permission`, `has_role` e `user_has_unit_access` apoiam essas políticas.
- **Migrações**: `supabase/migrations/*.sql`, nomeadas
  `YYYYMMDDHHMMSS_<uuid>.sql` (ou `_<slug>.sql`), aplicadas na produção só pelo CI.
- **Storage**: anexos (documentos, demandas ASCOM, galerias, frequência) e
  evidências do inventário de campo (bucket privado `inventario-evidencias`,
  lido por URL assinada).
- **Serviços externos no navegador**: o mapa do painel de campo carrega tiles
  de Esri World Imagery e OpenStreetMap direto do navegador (Leaflet), com
  atribuição visível. Os termos de uso da Esri para uso institucional ainda
  precisam ser confirmados.
- **Edge Functions**: ver [EDGE_FUNCTIONS.md](./EDGE_FUNCTIONS.md).

## Geração de documentos (offline, no client)

Toda a emissão de PDFs/planilhas/Word acontece **no navegador** (sem servidor de
relatórios), em `src/lib`:

- **PDF**: `jspdf` + `pdf-lib` — ~40 geradores (`pdf*.ts`), com base em
  `pdfTemplate.ts`/`pdfLogos.ts`.
- **Planilhas**: `xlsx` — `src/export/`, `src/lib/exportar*.ts`.
- **Fiscais/folha**: `cnabGenerator.ts` (remessa bancária CNAB),
  `esocialGenerator.ts`/`esocialXmlGenerator.ts` (eSocial).

## Build, PWA e deploy

- **Vite 5** + `@vitejs/plugin-react-swc`. Alias `@` → `src/`.
- **PWA** via `vite-plugin-pwa` (registrado em `src/main.tsx`); ícones/manifest
  em `public/` — habilita o app mobile de patrimônio.
- **Deploy**: publicado pelo CI a cada merge na `main` (`.github/workflows/deploy-front.yml`), depois do gate
  e das migrações do mesmo commit. Com a variável `COOLIFY_APP_UUID`, o job `deploy-coolify` pede o deploy ao
  Coolify, que builda o `Dockerfile` da raiz em dois apps: sistema (`MODO=sistema`, `app.idjuv.online`) e site
  (`MODO=site`, `idjuv.online`). Sem a variável, o job `deploy` copia o build por `rsync` para o nginx da VPS.
  Nos dois casos o nginx faz `try_files ... /index.html` (padrão SPA). Backend e Edge Functions no Supabase
  self-hosted da mesma VPS. Ver [DESENVOLVIMENTO.md](./DESENVOLVIMENTO.md#deploy).

## Variáveis de ambiente

`.env` (prefixo `VITE_`, expostas ao client):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` (chave anônima — segura no client; o acesso é
  controlado por RLS)
- `VITE_SUPABASE_PROJECT_ID`
