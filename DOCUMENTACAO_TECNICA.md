# Documentação Técnica — Governa Hub

Documento-mestre de engenharia do **IDJUV Governa Hub**: arquitetura, stack,
fluxos principais, mapa do acoplamento à marca do cliente e as diretrizes para
transformar o sistema em produto **White Label**.

| | |
|---|---|
| **Repositório** | `twosulucoes/idjuv-governa-hub` |
| **Instância atual** | IDJUV — Instituto de Desporto, Juventude e Lazer do Estado de Roraima |
| **Última auditoria deste documento** | 2026-09-16 |

> **Como navegar:** este arquivo é a visão consolidada. Os aprofundamentos estão
> em [`docs/`](./docs/README.md) — em especial
> [`docs/ARQUITETURA.md`](./docs/ARQUITETURA.md),
> [`docs/INVENTARIO_HARDCODE.md`](./docs/INVENTARIO_HARDCODE.md) e
> [`docs/WHITE_LABEL.md`](./docs/WHITE_LABEL.md).
> Para o contexto operacional de quem vai codar, veja [`CLAUDE.md`](./CLAUDE.md).

---

# Sumário

- [Parte 1 — Arquitetura, stack e fluxos](#parte-1--arquitetura-stack-e-fluxos)
- [Parte 2 — Onde a marca do cliente está no código](#parte-2--onde-a-marca-do-cliente-está-no-código)
- [Parte 3 — Diretrizes para o modelo White Label](#parte-3--diretrizes-para-o-modelo-white-label)

---

# Parte 1 — Arquitetura, stack e fluxos

## 1.1 O que é o sistema

Plataforma web de gestão e governança para órgão público estadual. Reúne, num
único app, os módulos de uma autarquia: RH, folha de pagamento, financeiro/
orçamento, patrimônio, compras, contratos, governança, integridade,
transparência (LAI), comunicação (ASCOM), programas e processos administrativos
(estilo SEI).

Acompanham o sistema um **portal público** (notícias, galerias, transparência,
formulários de cadastro) e um **PWA mobile** para inventário de patrimônio em campo.

O projeto nasceu no **Lovable** (`lovable.dev`), que commita automaticamente no
repositório, e está conectado ao **Supabase**.

## 1.2 Stack

| Camada | Tecnologia |
|---|---|
| Build / dev | Vite 5 + `@vitejs/plugin-react-swc`, `lovable-tagger` (dev) |
| Linguagem | TypeScript 5.8 |
| UI | React 18, shadcn/ui (Radix), Tailwind CSS 3, `framer-motion` |
| Roteamento | react-router-dom 6 |
| Estado de servidor | @tanstack/react-query 5 |
| Backend | Supabase — Postgres + Auth + Storage + Edge Functions (Deno) |
| Formulários | react-hook-form + zod |
| Gráficos / diagramas | recharts, reactflow |
| Documentos | jspdf, pdf-lib, docx, xlsx, file-saver |
| PWA | vite-plugin-pwa |
| Tema | next-themes (light/dark) + tokens CSS |
| Hospedagem | Vercel (SPA, rewrite para `/index.html`) · backend no Supabase |

Gerenciador de pacotes: **bun** preferencialmente (`bun.lockb`); `package-lock.json`
também presente.

```bash
bun install && bun run dev      # desenvolvimento
bun run lint && bun run build   # verificação (não há suíte de testes)
```

## 1.3 Dimensões do código

| Métrica | Valor |
|---|---:|
| Arquivos `.ts`/`.tsx` em `src/` | 736 |
| Páginas (`src/pages/**/*.tsx`) | 241 |
| Componentes (`src/components/**/*.tsx`) | 265 |
| Hooks de dados (`src/hooks/*.ts`) | 61 |
| Geradores de PDF (`src/lib/pdf*.ts`) | 38 |
| Rotas declaradas em `src/App.tsx` | 239 (em 1.281 linhas) |
| Migrações SQL | 246 |
| Edge Functions | 8 |
| Tabelas / views / RPC no Postgres | 231 / 15 / 47 |
| Módulos funcionais | 17 |

## 1.4 Visão de alto nível

```
┌───────────────────────────────────────────────────────────────┐
│                       NAVEGADOR / PWA                          │
│  React 18 (SPA) · shadcn/ui · Tailwind · React Query           │
│  react-router-dom — 239 rotas, todas em src/App.tsx            │
│  Geração de PDF/Word/XLSX acontece AQUI (client-side)          │
└──────────────┬────────────────────────────┬───────────────────┘
               │ supabase-js (HTTPS/JWT)     │ Edge Functions
               ▼                             ▼
┌───────────────────────────────────────────────────────────────┐
│                          SUPABASE                              │
│  Postgres — 231 tabelas · 15 views (v_*) · 47 RPC              │
│  Row Level Security = fronteira real de segurança              │
│  Auth (JWT) · Storage · Edge Functions (Deno, service role)    │
└───────────────────────────────────────────────────────────────┘
```

Não há servidor de aplicação próprio. O front fala direto com o Postgres via
PostgREST/`supabase-js`; o que exige privilégio elevado (criar/excluir usuário,
resetar senha, backup off-site, leitura de schema) passa por Edge Function.

## 1.5 Camadas do front-end

```
src/pages/          →  Composição de UI por rota. Sem lógica de dados pesada.
   ↓
src/components/     →  UI reutilizável — ui/ (shadcn) + <dominio>/
   ↓
src/hooks/          →  CAMADA DE DADOS — React Query + supabase (use<Dominio>)
   ↓
src/integrations/supabase/  →  client.ts e types.ts (AMBOS GERADOS — não editar)
   ↓
src/lib/            →  Lógica pura: cálculos (folha, frequência, INSS/IRRF),
                       geradores (PDF/Word/CNAB/eSocial), formatters
```

**Regra de ouro:** página não chama `supabase` diretamente — usa um hook do
domínio. Lógica de negócio reutilizável vive em `src/lib`.

Configuração transversal:

| Diretório | Papel |
|---|---|
| `src/shared/config/modules.config.ts` | **Fonte da verdade dos 17 módulos** (`MODULOS`, `MODULES_CONFIG`) |
| `src/config/menu.config.ts`, `module-menus.config.ts` | Menu lateral e menus por módulo |
| `src/modules/` | Re-exporta config + dashboards de módulo |
| `src/contexts/` | `AuthContext` (auth + permissões), `MenuContext` |
| `src/types/` | Tipos de domínio — e, hoje, **também textos jurídicos** (ver Parte 2) |

## 1.6 Fluxos principais

### Autenticação e RBAC

`src/contexts/AuthContext.tsx` é a fonte única de verdade.

```
supabase.auth.onAuthStateChange  ← único disparador de estado
        │  (signIn/signOut apenas acionam; o listener processa — sem race condition)
        ▼
   sessão + user
        ▼
   user_roles   → papel 'admin' ⇒ isSuperAdmin
   user_modules → permissões em NÍVEL DE MÓDULO (hierárquicas: 'rh' concede 'rh.*')
        ▼
   cache em memória (TTL ~60s)
        ▼
   hasPermission / hasAnyPermission / hasAllPermissions / isSuperAdmin
```

Três categorias de rota em `App.tsx`:

| Guard | Uso |
|---|---|
| `<PublicPageGuard rota="...">` | Páginas públicas — checa status de manutenção/publicação em `config_paginas_publicas` |
| `<ProtectedRoute requiredModule requiredPermissions>` | Exige autenticação + RBAC via `AuthContext`, com bypass para super admin |
| Rotas mobile/PWA | `/patrimonio-mobile`, `/instalar` |

`ROUTE_PERMISSIONS` em `src/types/auth.ts` mapeia rota → permissão.

> ⚠️ **RLS é a fronteira real de segurança dos dados**, não o front. Funções de
> apoio no banco: `has_permission`, `has_role`, `user_has_unit_access`,
> `usuario_tem_acesso_modulo`. Detalhes em
> [`docs/RBAC_PERMISSOES.md`](./docs/RBAC_PERMISSOES.md) e
> [`docs/AUDITORIA_USUARIOS.md`](./docs/AUDITORIA_USUARIOS.md).

### Leitura e escrita de dados

```
Componente → hook use<Dominio>() → React Query → supabase-js → PostgREST → RLS → Postgres
                                        ↑
                          QueryClient (App.tsx): staleTime 60s · gcTime 5min
                                       retry 1 · sem refetch no foco
```

Mutações invalidam as query keys do domínio. Estatísticas de painel ficam em
`use<Modulo>DashboardStats`.

### Geração de documentos (100% no cliente)

```
Página → hook/lib de geração → jsPDF | pdf-lib | docx | xlsx → download no navegador
                                   ↑
                    pdfTemplate.ts (cores, cabeçalho, rodapé, cache de logos)
                    pdfLogos.ts    (proporções e dimensionamento das logos)
```

Não há servidor de relatórios: 38 geradores `pdf*.ts`, `wordPortarias.ts` (docx),
`src/export/` e `exportar*.ts` (xlsx). Geradores fiscais: `cnabGenerator.ts`
(remessa bancária) e `esocialGenerator.ts` / `esocialXmlGenerator.ts`.

### Operações privilegiadas (Edge Functions)

| Função | Papel |
|---|---|
| `admin-create-user`, `delete-user`, `admin-reset-password` | Gestão de usuários com service role |
| `backup-offsite` | Backup para projeto Supabase secundário |
| `database-schema` | Introspecção de schema para a UI de admin |
| `download-frequencia` | Pacotes de frequência |
| `enviar-convite-reuniao` | E-mail transacional (Resend) |
| `cpsi-ai-assistant` | Assistente de IA |

### Banco e migrações

`supabase/migrations/YYYYMMDDHHMMSS_<uuid>.sql` (246 arquivos), tipicamente
geradas pelo Lovable. **RLS é obrigatório desde a migração** — use o skill
`migracao-segura-idjuv`. Detalhes em [`docs/BANCO_DE_DADOS.md`](./docs/BANCO_DE_DADOS.md).

## 1.7 Armadilhas conhecidas

1. **Arquivos gerados** — `src/integrations/supabase/client.ts` e `types.ts`
   (~23 mil linhas) nunca são editados à mão; regenere pelo Supabase.
2. **`App.tsx` é único e grande** — toda mudança de rota passa por lá; alto risco
   de conflito de merge com os commits automáticos do Lovable.
3. **Sem testes automatizados** — a verificação é `bun run lint` + `bun run build`
   (o build faz a checagem de tipos) e, quando possível, rodar o app.
4. **Wrappers de Supabase duplicados** — `src/lib/supabase.ts`,
   `src/lib/supabaseClient.ts` e `src/integrations/supabase/client.ts` coexistem;
   siga o padrão do arquivo em que estiver trabalhando.
5. **Três paletas de cor divergentes** para a mesma marca (ver Parte 2).

---

# Parte 2 — Onde a marca do cliente está no código

Diagnóstico resumido. O mapa completo, arquivo por arquivo, está em
**[`docs/INVENTARIO_HARDCODE.md`](./docs/INVENTARIO_HARDCODE.md)**.

## 2.1 Volume

**~1.070 ocorrências de "IDJUV" em 224 arquivos** do repositório, sendo **853 em
`src/`**. Além disso, **238 ocorrências de "Roraima"** (co-branding do Governo do
Estado) e a Lei nº 2.301/2025 citada em 17 arquivos.

| Área | Ocorrências | Arquivos |
|---|---:|---:|
| `src/lib/` (geradores de documento) | 364 | 41 |
| `src/pages/` | 227 | 72 |
| `src/components/` | 121 | 27 |
| `src/types/` | 73 | 12 |
| `src/hooks/` | 43 | 11 |
| `supabase/migrations/` | 147 | 26 |
| `supabase/functions/` | 28 | 3 |
| `public/` | 39 | 26 |
| `src/shared/config/`, `src/config/` | **0** | 0 |

## 2.2 Oito naturezas distintas de acoplamento

Tratar tudo como "trocar a logo" é o erro a evitar: cada nível exige um mecanismo
diferente, e os níveis mais caros não são os mais visíveis.

| Nível | O quê | Exemplos concretos |
|---|---|---|
| **N1 — Marca visual** | Logos, favicon, ícones PWA, cores, título da aba | `src/assets/logo-idjuv-*.png`, `LogoIdjuv.tsx` (23 ocorrências), `useLogoIdjuv.ts`, `index.html` (6), bloco `manifest` do `vite.config.ts`, tokens `--primary/--secondary/--accent` em `src/index.css` comentados como "da logo IDJUV" |
| **N2 — Identidade institucional** | CNPJ, endereço, telefone, e-mail, lei de criação, dirigente | `useDadosOficiais.ts` → `FALLBACK_DATA` com **22 chaves** de dados reais no bundle (CNPJ 64.689.510/0001-09, telefone, nome do presidente); e-mails `@idjuv.rr.gov.br` espalhados em 6 páginas |
| **N3 — Textos de UI** | Header, Footer, Sidebar, portal público | `MenuSidebar.tsx` ("IDJUV — Sistema Administrativo"), `Footer.tsx` ("Acesso exclusivo para servidores do IDJUV"), `PortalFooter.tsx` (redes sociais `idjuv_rr`) |
| **N4 — Documentos gerados** | Cabeçalho/rodapé de todo PDF e Word | Padrão repetido em 41 arquivos: `doc.text('GOVERNO DO ESTADO DE RORAIMA')` + `doc.text('INSTITUTO DE DESPORTO, JUVENTUDE E LAZER - IDJUV')` + "Documento gerado pelo Sistema de Governança Digital IDJUV" |
| **N5 — Regras jurídicas** | Textos normativos como constantes TS | `src/types/portaria.ts` e `portariaUnificada.ts`: **11 modelos de ato** citando "Lei nº 2.301, de 29 de dezembro de 2025" e "art. 7º, §3º"; páginas `governanca/DecretoPage.tsx`, `LeiCriacaoPage.tsx`, `RegimentoInternoPage.tsx` com a norma dentro do JSX |
| **N6 — Vertical de negócio** | O ramo (esporte/juventude), não a marca | Módulos `organizacoes` (federações), `arbitros`, `gestores_escolares` (CBDE), páginas `eventos/` (Seletiva Estudantil); enum `tipo_unidade_local` = ginásio, estádio, piscina… |
| **N7 — Infra e operação** | Nomes fixos em serviços | Bucket `idjuv-backups` na Edge Function `backup-offsite` (23 ocorrências, incl. `createBucket`); `RESEND_FROM ?? "IDJUV <...>"`; `protected-users.config.ts` com UUID e e-mail pessoal |
| **N8 — Co-branding** | Entidade superior | Logo e texto "Governo do Estado de Roraima" no Header, Footer, ReportHeader e em todos os PDFs — para outro cliente vira "Prefeitura de X" |

## 2.3 Dois achados que mudam o plano

### ✅ A infraestrutura de branding por banco já existe — e está ociosa

Três tabelas já modelam identidade institucional:

| Tabela | Destaque |
|---|---|
| `config_institucional` | Tem **`cores` (jsonb)**, **`logo_url`**, **`brasao_url`**, `endereco`, `contato`, `expediente` |
| `config_autarquia` | Dados fiscais/contábeis (CNPJ, eSocial, CRC, regime tributário) |
| `dados_oficiais` | Key-value **auditável** com `lei_referencia`, `documento_url`, `bloqueado` |

**Nenhum componente de UI lê `cores`, `logo_url` ou `brasao_url`.** E
`tailwind.config.ts` já consome 100% das cores via `hsl(var(--token))`, sem um
único literal. O caminho para tema trocável em runtime está pavimentado — falta
apenas conectá-lo.

### ⚠️ O nome do cliente está no schema, não só nos textos

Enums do Postgres carregam a sigla do cliente:

- `tipo_servidor` e `tipo_vinculo_funcional`: `efetivo_idjuv`, `comissionado_idjuv`
- `origem_vinculo`: `idjuv`
- Colunas `cessoes.unidade_idjuv_id`, `cessoes.funcao_exercida_idjuv` (+ FK)

Este é o item de maior custo e risco: é migração de banco em produção, não
substituição de string. Ver [WHITE_LABEL §9](./docs/WHITE_LABEL.md#9-enums-do-banco-com-o-nome-do-cliente).

### Bônus: três paletas para a mesma marca

| Fonte | Cor primária |
|---|---|
| `src/index.css` (`--primary`) | `hsl(210 65% 25%)` — azul escuro |
| `src/lib/pdfTemplate.ts` (`CORES.primaria`) | `#004444` — verde-petróleo |
| `index.html` (`theme-color`) | `#1e40af` — azul |

Antes de parametrizar, é preciso decidir qual é a cor institucional real.

---

# Parte 3 — Diretrizes para o modelo White Label

Resumo executivo. O plano completo — contratos de tipo, migrações SQL, roadmap
por fase e critérios de aceite — está em
**[`docs/WHITE_LABEL.md`](./docs/WHITE_LABEL.md)**.

## 3.1 Princípio

> O repositório contém **apenas o núcleo genérico**. Tudo que identifica uma
> instituição — nome, marca, cores, dados legais, módulos contratados, modelos de
> ato — é **dado de configuração**, nunca código.

Meta: provisionar um cliente novo em **menos de um dia**, por checklist, sem abrir
nenhum `.tsx`.

## 3.2 Modelo de tenancy: uma instância por instituição

Mantém-se o modelo já adotado: projeto Supabase próprio + deploy próprio por
cliente, **não** banco multi-tenant compartilhado.

Razão: dados de RH e folha de órgãos distintos não devem dividir banco, e o RLS
atual isola por unidade dentro de **um** órgão. Multi-tenant real exigiria
`tenant_id` em 231 tabelas e a reescrita de todas as políticas — custo
desproporcional ao ganho.

**Consequência boa:** o código não precisa resolver "qual tenant é este request?".
Basta ser **tenant-agnóstico** — ler a própria identidade de configuração. Isso
reduz muito o escopo do trabalho.

## 3.3 Três camadas de configuração

```
CAMADA 0 — .env (build-time)
  Qual Supabase, qual slug de tenant, nome do app, cor-semente.
  Consumida por vite.config.ts e index.html (placeholders %VITE_*%).

CAMADA 1 — tenants/<slug>/tenant.config.ts + assets/   (versionado, tipado)
  Marca, paleta padrão, módulos habilitados, feature flags, vertical.

CAMADA 2 — Banco (runtime, o cliente edita sozinho)
  config_institucional · dados_oficiais · modelos_atos
```

**Precedência:** `Banco → Perfil do tenant → .env → fallback genérico do core`.

O fallback do core **nunca** é o IDJUV: quem clonar o repo sem configurar nada
deve obter um sistema neutro, sem marca.

## 3.4 Ponto único de consumo

```ts
const { identidade, marca, entidadeSuperior, features, modulos } = useTenant();  // React
const tenant = getTenantSnapshot();                                             // libs puras
```

O `getTenantSnapshot()` síncrono é indispensável: os 38 geradores de PDF são
funções puras e não podem usar hooks.

Substituições diretas:

| Hoje | Alvo |
|---|---|
| `LogoIdjuv` / `useLogoIdjuv` | `<Logo slot="header\|footer\|pdf">` / `useMarca()` |
| `LOGO_ASPECTOS = { governo, idjuv }` | `{ entidadeSuperior, orgao }` do perfil |
| `FALLBACK_DATA` do IDJUV | fallback vindo do tenant |
| `obterInstituicao(codigo = 'IDJUV')` | `obterInstituicao(codigo = tenant.slug)` |
| Cabeçalho repetido em 41 arquivos | `cabecalhoOficial(doc)` / `rodapeOficial(doc)` |

## 3.5 Roadmap

| Fase | Escopo | Risco |
|---|---|---|
| **0. Fundação** | `src/core/tenant/` (tipos, provider, snapshot, `aplicarTema`), `tenants/_template/` e `tenants/idjuv/` | Baixo |
| **1. Build** | `.env` estendido, `vite.config.ts` e `index.html` sem literais, ícones por tenant | Baixo |
| **2. Marca na UI** | `<Logo>` genérico, layout/menu/portal via `useTenant()`, tema injetado do banco | Baixo |
| **3. Identidade** | Consolidar as 3 tabelas de config, eliminar `FALLBACK_DATA`, contatos e URLs para config | Médio |
| **4. Documentos** | Helpers de cabeçalho/rodapé nos 38 geradores + docx + relatórios HTML; unificar as paletas | Médio (volume) |
| **5. Modelos de ato** | Tabela `modelos_atos` com placeholders; normas via CMS; seeds do IDJUV | **Alto** (jurídico) |
| **6. Módulos e verticais** | `modulosHabilitados()`, guard `<ModuloHabilitado>`, extração da vertical esporte | Médio |
| **7. Enums e schema** | `ALTER TYPE ... RENAME VALUE`, renomear colunas, regenerar types | **Alto** (produção) |
| **8. Infra e guarda** | Edge Functions por env, super admin por env, guarda de CI | Baixo |

**As fases 0–2 já entregam a demo comercial** (sistema rodando com outra marca).
As fases 5 e 7 exigem validação jurídica e janela de manutenção do banco.

## 3.6 Núcleo genérico × vertical de negócio

| Camada | Módulos | Vendável para |
|---|---|---|
| **Core ERP público** | `admin`, `rh`, `workflow`, `compras`, `contratos`, `financeiro`, `patrimonio`, `patrimonio_mobile`, `governanca`, `integridade`, `transparencia`, `comunicacao`, `gabinete` | Qualquer órgão |
| **Vertical Esporte/Juventude** | `organizacoes`, `arbitros`, `gestores_escolares`, `programas`, páginas `eventos/` | Institutos de esporte |

Separar as duas é o que permite vender o mesmo repositório para uma secretaria de
cultura, saúde ou educação.

## 3.7 Critérios de aceite

1. `grep -ril "idjuv\|roraima" src/ supabase/functions/ index.html vite.config.ts | grep -v '^tenants/' | wc -l` → **0**
2. `cp -r tenants/_template tenants/novocliente` + ajuste do `.env` + `bun run build` → sobe sem marca do IDJUV
3. `bun run lint && bun run build` limpos; instância do IDJUV sem regressão
4. Alterar `cores`/`logo_url` em `config_institucional` reflete na UI **e** nos PDFs sem redeploy
5. Remover módulo de `tenant.modulos` tira o item do menu **e** devolve 404 na rota
6. Guarda de CI que falha o build ao reintroduzir marca de cliente fora de `tenants/`

## 3.8 Riscos principais

| Risco | Mitigação |
|---|---|
| Lovable commita automaticamente e pode reintroduzir hardcode | Fases curtas mergeadas rápido + guarda de CI |
| `App.tsx` com 239 rotas — conflito de merge | Guard de módulo como wrapper; não reorganizar o arquivo na mesma fase |
| Templates jurídicos errados invalidam atos administrativos | Fase 5 com validação do jurídico do cliente |
| Migração de enum em banco de produção | Aplicar antes em branch do Supabase; verificar RPC, views e políticas de RLS |
| **Dados do cliente versionados no repo** — `public/documentos/*.pdf` e `public/disaster-recovery/*.sql` | Mover para Storage **antes** de entregar o repositório a outro cliente |

---

## Documentos relacionados

| Documento | Conteúdo |
|---|---|
| [`docs/INVENTARIO_HARDCODE.md`](./docs/INVENTARIO_HARDCODE.md) | Mapa completo do hardcode, arquivo por arquivo, com comandos de reauditoria |
| [`docs/WHITE_LABEL.md`](./docs/WHITE_LABEL.md) | Arquitetura-alvo, contratos de tipo, migrações, roadmap e critérios de aceite |
| [`docs/ARQUITETURA.md`](./docs/ARQUITETURA.md) | Arquitetura em detalhe |
| [`docs/MODULOS.md`](./docs/MODULOS.md) | Detalhamento funcional dos 17 módulos |
| [`docs/BANCO_DE_DADOS.md`](./docs/BANCO_DE_DADOS.md) | Tabelas, views e RPC |
| [`docs/RBAC_PERMISSOES.md`](./docs/RBAC_PERMISSOES.md) | Modelo de permissões |
| [`docs/GUIA_FRONTEND.md`](./docs/GUIA_FRONTEND.md) | Padrões de front-end |
| [`docs/EDGE_FUNCTIONS.md`](./docs/EDGE_FUNCTIONS.md) | Funções serverless |
| [`docs/MIGRACAO_SUPABASE_PROPRIO.md`](./docs/MIGRACAO_SUPABASE_PROPRIO.md) | Provisionar instância própria |
| [`CLAUDE.md`](./CLAUDE.md) | Guia de contexto para desenvolvimento |
