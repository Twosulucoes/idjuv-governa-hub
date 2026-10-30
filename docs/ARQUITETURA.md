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
- **PCA (Compras)** em `/compras/pca` e `/compras/pca/:exercicio` (`PcaListaPage`, `PcaPlanoPage`,
  `requiredModule="compras"` e `compras.pca.visualizar` ou `compras.pca.editar`): itens lançados dos DFDs do SEI e
  orçamento por ação × fonte; menu em Compras → "Plano de Contratações (PCA)". O catálogo CATMAT/CATSER vem do portal
  de dados abertos do Compras.gov.br pela Edge Function `catalogo-compras` (o navegador não chama o portal: CORS e CSP).
- **Pesquisa de preços (Compras)** em `/compras/pesquisa-precos` e `/compras/pesquisa-precos/:id`
  (`PesquisasPrecosListaPage`, `PesquisaPrecosPage`, `requiredModule="compras"` e `compras.pesquisa_precos.visualizar`
  ou `compras.pesquisa_precos.editar`): pesquisa por processo SEI, itens do CATMAT/CATSER, preços com a fonte de cada
  um, saneamento e CV do Decreto 39.050-E/2025 e relatório PDF, planilha e texto de apoio da nota técnica; menu em
  Compras → "Pesquisa de preços". Os preços do Compras.gov.br e do PNCP vêm pela Edge Function `pesquisa-precos` (só
  leitura; o navegador não chama os portais).
- **Processos de contratação (Compras)** em `/compras/processos` e `/compras/processos/:id` (`ProcessosListaPage`,
  `ProcessoFichaPage`, `requiredModule="compras"` e `compras.processos.visualizar` ou `compras.processos.editar`): lista
  com etapa e setor, dias parado, valor estimado, empenhado e fase financeira (com filtro); ficha com Dados, Reservas
  (natureza × ação × fonte do QDD, saldo livre ao vivo e justificativa quando falta saldo, "Puxar do PCA"), Andamento
  (linha do tempo do SEI) e Financeiro (fase, PEDs do "Consultar PED" e empenhos do FIP 614 pelo nº do processo). Menu
  em Compras → "Processos de contratação" (o antigo "Licitações"; "Novo processo" abre `/compras/processos?novo=1`) e
  "Programação por natureza" (`/compras/programacao`, `ProgramacaoNaturezaPage`, mesma exigência de rota: disponível
  no FIPLAN, reservado em processos e saldo livre por natureza); a página-guia `/processos/compras` continua como
  "Como funciona uma compra", o último item de Compras, que segue o ciclo: PCA, programação por natureza, processos de
  contratação e o manual. O painel do Financeiro (`/financeiro`) ganha o cartão "Reservado em processos".
- **Emendas parlamentares (Financeiro)** em `/financeiro/emendas` (`EmendasPage`, `orcamento.visualizar`; cadastrar e
  editar pedem `orcamento.criar`): autor, objeto, beneficiário e saldo (valor, reservado, empenhado, livre) de cada
  emenda, mais a conferência com as dotações de emenda do QDD. Menu em Financeiro → "Emendas Parlamentares"; o QDD
  (`/financeiro/qdd`) separa a dotação comum das emendas e liga para esta tela.
- **Importação por setor** (desde 29/10/2026): cada setor importa no próprio menu e o assistente abre na tela dele
  (`ImportacaoDialog` + `useImportadorDaUrl`, `?importador=<id>`, só com a permissão do importador). O campo `local` de
  cada importador (`src/lib/importacao/importadores/`) diz a tela: Financeiro → Atualizar dados (`/financeiro/atualizar`:
  QDD, tabelas do FIPLAN, FIP 614, PEDs, diárias do FIP 002 e retorno do banco), RH → Folha (`/folha`, item de menu "Importar do SIGRH"),
  Gabinete → Central de Portarias (`/gabinete/portarias`), Compras → Processos (`/compras/processos`) e Contratos →
  Contratos (`/contratos/lista`). QDD e conciliação também abrem o assistente nas próprias telas. `/admin/importacoes`
  (`ImportacoesPage`) virou "Histórico de importações": só consulta e a lista de onde cada arquivo entra, com
  `ProtectedRoute requiredPermissions="admin.auditoria"` e o mesmo código no item de menu; `src/lib/importacao/registro.test.ts`
  confere a rota, o menu e que cada `local` é uma rota do `App.tsx` com o próprio id. Ver `docs/GUIA_FRONTEND.md`
  (Importação de dados).
- **Localizar processo** em `/processos/localizar` (`LocalizarProcessoPage`, `ProtectedRoute` só com login: rota
  transversal, listada em `TRANSVERSAIS` de `src/shared/config/modules.config.test.ts`; quem pode ver cada registro é a
  RLS da fonte, pelas funções INVOKER `localizar_processos_sei` e `processos_parados`). Menu: "Localizar processo" e
  "Parados" (`/processos/localizar?aba=parados`) como os únicos itens de Processos SEI, nos dois arquivos de menu (a
  tramitação é no SEI: a lista `/workflow/processos` e o "Novo processo" saíram do menu e abrem pelo painel `/workflow`). Spec:
  `docs/superpowers/specs/2026-10-25-localizador-processos-sei-design.md`.
- **Convênios federais (Financeiro)** em `/financeiro/convenios` e `/financeiro/convenios/:id`
  (`ConveniosFederaisPage`, `ConvenioFederalPage`, `requiredPermissions="financeiro.convenios.visualizar"`; o `:id` é o
  `id_proposta` do Transferegov): lista e ficha das propostas, emendas, convênios, empenhos e desembolsos da União, só
  leitura. Os dados chegam pela rotina diária `.github/workflows/transferegov.yml` → Edge Function `transferegov` →
  RPC `fin_tg_carregar`. Menu em Financeiro → "Convênios federais". Spec: `docs/superpowers/specs/2026-10-29-convenios-federais-transferegov-design.md`.
- **Contratos (entrega C1)** em `/contratos/lista` e `/contratos/:id` (`ContratosListaPage`, `ContratoFichaPage`,
  `requiredModule="contratos"` e `contratos.visualizar`, `contratos.criar` ou `contratos.editar`): lista com filtros de
  situação e de prazo (`?prazo=em_vigor|30|60|90|120|vencidos|sem_responsavel`, usados pelos cartões do painel
  `/contratos`), cadastro (`?novo=1`) e ficha com as abas Dados, Itens, Gestor e fiscais e Histórico (`?aba=` abre direto
  numa delas) e a ficha em PDF. `/contratos/:id` fica depois do redirecionamento `/contratos/passagens/*` no `App.tsx` (o
  react-router prefere o caminho fixo de qualquer jeito). Menu: "Contratos" e "Novo contrato" (`/contratos/lista?novo=1`) no menu geral e
  "Contratos" no menu do módulo. A carga inicial é pela planilha, importada na própria lista
  (`/contratos/lista?importador=contratos_planilha`). Spec:
  `docs/superpowers/specs/2026-10-27-contratos-gestao-completa-design.md`.
- **Passagens aéreas (Gabinete da Presidência)** em `/gabinete/passagens`, `/gabinete/passagens/:id`,
  `/gabinete/passagens/beneficiarios`, `/gabinete/passagens/pendencias` e `/gabinete/passagens/faturas`
  (`src/pages/gabinete/`: `PassagensPedidosPage`, `PassagemPedidoPage`, `PassagensBeneficiariosPage`,
  `PassagensPendenciasPage`, `PassagensFaturasPage`; `requiredModule="gabinete"` e `contratos.passagens.visualizar` ou
  `contratos.passagens.editar`, e nas faturas também `contratos.passagens.financeiro`). O Gabinete recebe os pedidos (SEI,
  e-mail) e as faturas da agência; o contrato da agência continua no setor de Contratos (lista e ficha do contrato). Um
  pedido por processo SEI, com passageiros (servidor ou beneficiário de fora), trechos, cotações e emissão; prestação de
  contas na aba da ficha (`?aba=prestacao`); faturas, a faturar, empenhos do contrato, planilhas e o PDF do saldo. Menu
  em Gabinete → "Passagens aéreas" (Pedidos, Novo pedido, Beneficiários, Pendências e Faturas) e atalhos no painel do
  Gabinete, filtrados pela permissão. Os endereços antigos `/contratos/passagens*` redirecionam para o mesmo caminho em
  `/gabinete/passagens` (`RedirecionarPrefixo`, links salvos e do localizador SEI). Até a migração `20261110120000` as
  telas ficavam em Contratos. Spec: `docs/superpowers/specs/2026-10-24-contratos-passagens-aereas-design.md`.
- Financeiro: `/financeiro/empenhos/:id` (`EmpenhoDetalhePage`, `requiredPermissions="orcamento.criar"`): dados,
  valores, histórico do FIPLAN e escolha da dotação do empenho importado do FIP 614.
- Financeiro: `/financeiro/conciliacao` (`ProtectedRoute requiredModule="financeiro"
  requiredPermissions="pagamento.conciliar"`; `?aba=contas` abre direto as contas pagadoras);
  `/financeiro/favorecidos` (`FavorecidosPage`, `requiredModule="financeiro"`, `requiredPermissions="orcamento.criar"`,
  a mesma dos empenhos; item "Favorecidos" no menu do Financeiro); `/financeiro/pagamentos/:id` abre o detalhe real do pagamento
  (`orcamento.aprovar`); `/financeiro/orcamento` só redireciona para `/financeiro/qdd`. O ano das telas do
  módulo vai na query `?exercicio=` (ver [MODULOS.md](./MODULOS.md)). `/financeiro` é declarada uma vez só
  (painel do módulo, `FinanceiroDashboardPage`, `requiredModule="financeiro"`). `/financeiro/atualizar`
  (`AtualizarFinanceiroPage`, `requiredModule="financeiro"`, item "Atualizar dados" no menu): rotina de importações
  do FIPLAN, só leitura; cada botão leva ao importador, que confere a própria permissão. Menu do Financeiro (26/10/2026): Liquidações e
  Pagamentos ficam no submenu "Contingência (regularizar no FIPLAN)"; `/financeiro/solicitacoes`, `/sub-empenhos`,
  `/restos-a-pagar`, `/alteracoes-orcamentarias` e `/adiantamentos` saíram dos menus, mas as rotas
  continuam registradas (ver [MODULOS.md](./MODULOS.md)). `/financeiro/relatorios` (`RelatoriosFinanceiroPage`,
  `requiredPermissions="orcamento.visualizar"`) voltou ao menu como "Relatórios": é o Gerador de relatórios (catálogo de
  fontes em `src/config/relatoriosDinamicos/`, lógica pura em `src/lib/relatoriosDinamicos/`, modelos em
  `relatorios_modelos`); fonte com `permissao` some para quem não a tem.
- Quadro de vagas: `/cargos/vagas` (`QuadroVagasPage`, `ProtectedRoute requiredPermissions="governanca.cargos.visualizar"`;
  a página exige ainda o módulo `governanca`), com link em `/cargos` e item "Quadro de
  Vagas" no menu de governança. Importar a planilha exige `governanca.cargos.gerenciar` (ver
  [BANCO_DE_DADOS.md](./BANCO_DE_DADOS.md#quadro-de-vagas)).
- Inventário de campo: `/inventario/campanhas/:id/painel` (painel com mapa,
  `ProtectedRoute requiredPermissions="patrimonio.visualizar"`), com link na
  página de detalhe da campanha.
- Detalhes do patrimônio: `/inventario/movimentacoes/:id`, `/inventario/manutencoes/:id` e
  `/inventario/baixas/:id` (`MovimentacaoDetalhePage`, `ManutencaoDetalhePage`, `BaixaDetalhePage`), abertas
  pelo "olho" das listas, com as mesmas ações de aprovar/rejeitar/concluir (`patrimonio.tramitar`). Listas e
  detalhes de baixas e movimentações exigem só `patrimonio.visualizar`; criar baixa pede `patrimonio.criar` e
  criar movimentação `patrimonio.tramitar` (botões).
- Edição do bem: `/inventario/bens/:id/editar` (`BemEditarPage`, `patrimonio.editar`). Número de patrimônio,
  QR e dados de aquisição (valor, data, forma) só o admin altera; a ficha do bem (`BemDetalhePage`) tem abas de
  manutenções e ocorrências. Item do almoxarifado: `/inventario/almoxarifado/:id` (`ItemMaterialDetalhePage`, `patrimonio.visualizar`) e
  `/inventario/almoxarifado/:id/editar` (`ItemMaterialEditarPage`, `patrimonio.editar`); o saldo real ainda não
  existe, e a ficha mostra só os limites de estoque. A rota de detalhe da requisição ainda usa `PlaceholderDetalhePage`.
- Unidades: `/unidades`, `/unidades/gestao` e `/unidades/:id` exigem `unidades.visualizar`; `/unidades/relatorios` e
  `/unidades/central-relatorios`, `unidades.relatorios.visualizar`; `/unidades/cedencia`, `unidades.cedencias.visualizar`
  (além do módulo `patrimonio`). Criar/editar unidade e importar KML pedem `unidades.gerenciar`; agenda e termo de
  cessão, `unidades.cedencias.gerenciar`.
- Formulários: a rota `/formularios/cpsi` (tela CPSI, que gerava DFD/ETP/TR) saiu na onda 5 do P23; esses atos são
  feitos no SEI e o sistema só registra o ciclo.

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

- **PDF**: motor único em `src/lib/documentos/` (`jspdf` só em `core/`); os `pdf*.ts` restantes só chamam o motor
  ([PADRAO_DOCUMENTOS.md](./PADRAO_DOCUMENTOS.md)). A base antiga (pdfTemplate, pdfLogos) foi apagada na onda 5 da P23.
- **Planilhas**: `xlsx` — `src/export/`, `src/lib/exportar*.ts`.
- **Fiscais/folha**: `cnabGenerator.ts` (remessa bancária CNAB; com conta pagadora no BB usa `bancario/folhaBbCnab240.ts`, o leiaute que o banco já aceita da folha),
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
