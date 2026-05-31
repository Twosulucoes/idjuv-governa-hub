# CLAUDE.md

Guia de contexto para o Claude Code trabalhar neste repositório. Leia antes de
fazer alterações. Escrito em português porque é o idioma do time e do domínio.

---

## 1. O que é o projeto

**IDJUV Governa Hub** — plataforma web de gestão e governança para o **IDJUV**
(Instituto de Desenvolvimento da Juventude / órgão público estadual). É um
sistema ERP/administrativo de grande porte que reúne, num único app, vários
módulos de uma autarquia pública: RH, folha de pagamento, financeiro/orçamento,
patrimônio, compras, contratos, governança, transparência (LAI), comunicação
(ASCOM), programas sociais/esportivos e processos administrativos (estilo SEI).

Há também um **portal público** (notícias, galerias, transparência, formulários
de cadastro como gestores escolares, árbitros, federações e mini-currículo) e um
**PWA mobile** para coleta de inventário de patrimônio em campo.

O projeto nasceu no **Lovable** (`lovable.dev`) e está conectado ao **Supabase**.
Alterações via Lovable são commitadas automaticamente no repo, e vice-versa.

---

## 2. Stack técnica

| Camada | Tecnologia |
|---|---|
| Build/dev | **Vite 5** + `@vitejs/plugin-react-swc` |
| Linguagem | **TypeScript 5.8** (strict via tsconfig) |
| UI | **React 18**, **shadcn/ui** (Radix UI), **Tailwind CSS 3** |
| Roteamento | **react-router-dom 6** |
| Estado servidor | **@tanstack/react-query 5** |
| Backend | **Supabase** (Postgres + Auth + Storage + Edge Functions) |
| Formulários | **react-hook-form** + **zod** (`@hookform/resolvers`) |
| Ícones | **lucide-react** |
| Gráficos | **recharts** |
| Diagramas/fluxo | **reactflow** (organograma, workflow) |
| Documentos | **jspdf**, **pdf-lib**, **docx**, **xlsx**, **file-saver** |
| PWA | **vite-plugin-pwa** |
| Notificações | **sonner** + toaster do shadcn |
| Tema | **next-themes** (light/dark) |

Gerenciador de pacotes: o repo tem **`bun.lockb`/`bun.lock`** e
`package-lock.json`. Prefira **bun** se disponível; senão `npm`.

---

## 3. Comandos

```bash
bun install          # ou: npm install
bun run dev          # servidor de desenvolvimento (Vite)
bun run build        # build de produção
bun run build:dev    # build em modo development
bun run lint         # ESLint
bun run preview      # preview do build
```

> Não há suíte de testes configurada no momento. A verificação principal é
> `bun run lint` + `bun run build` (checagem de tipos do TS roda no build).

---

## 4. Variáveis de ambiente

Definidas em `.env` (prefixo `VITE_`, expostas ao client):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

O cliente Supabase é criado em `src/integrations/supabase/client.ts` (arquivo
**gerado** — não editar manualmente) e há um wrapper em `src/lib/supabase.ts`
(`isSupabaseConfigured`, etc.) que é o ponto de import preferido na app:
`import { supabase } from "@/lib/supabase"`.

---

## 5. Estrutura de diretórios

Alias de import: **`@` → `src/`** (configurado em `vite.config.ts` e tsconfig).

```
src/
├── App.tsx                # Raiz: providers + TODAS as rotas (react-router)
├── main.tsx               # Bootstrap React + registro do PWA
├── pages/                 # ~241 páginas, organizadas por domínio (rh/, financeiro/,
│                          #   admin/, inventario/, transparencia/, programas/, ...)
├── components/            # ~282 componentes, agrupados por domínio + ui/ (shadcn)
│   ├── ui/                # Componentes shadcn/ui (base — evite editar à toa)
│   ├── auth/              # ProtectedRoute, guards
│   ├── layout/, menu/, navigation/
│   └── <dominio>/         # rh/, financeiro/, inventario/, folha/, cms/, ...
├── modules/               # Configuração modular (re-exporta shared/config + dashboards)
├── shared/config/         # modules.config.ts (FONTE DA VERDADE dos módulos), protected-users
├── config/                # menu.config.ts, module-menus.config.ts, segadFieldsConfig.ts
├── contexts/              # AuthContext (auth + permissões), MenuContext
├── hooks/                 # ~65 hooks (use<Dominio>.ts) — camada de dados via React Query
├── types/                 # Tipos de domínio (auth, rh, folha, financeiro, rbac, ...)
├── lib/                   # Lógica/utilitários: geradores de PDF (pdf*.ts), cálculos de
│                          #   folha/frequência, CNAB, eSocial, formatters, utils
├── export/                # exportCSV.ts, exportExcel.ts
├── integrations/supabase/ # client.ts (gerado) + types.ts (gerado, ~23k linhas)
├── services/              # serviços específicos
└── assets/                # imagens/estáticos

supabase/
├── migrations/            # ~240 migrações SQL (timestamp_uuid.sql) — geradas pelo Lovable
├── functions/             # Edge Functions (Deno): admin-create-user, delete-user,
│                          #   backup-offsite, cpsi-ai-assistant, download-frequencia, ...
└── config.toml

docs/        # Documentação de operação (migração Supabase, backup, SQL de correção)
.lovable/    # Relatórios/planos gerados pelo Lovable (auditorias, refatorações, fases)
```

---

## 6. Arquitetura e convenções

### Roteamento
- **Todas as rotas vivem em `src/App.tsx`** (um único `<Routes>` grande, ~1240
  linhas, organizado por blocos de comentários por módulo). Ao adicionar uma
  página, registre a rota aqui e importe a page no topo.
- Três categorias de rota:
  - **Públicas** — envolvidas por `<PublicPageGuard rota="...">` (verifica status
    de manutenção/publicação da rota). Ex.: `/`, `/transparencia/*`, `/curriculo`,
    `/cadastrogestores`, portal de notícias.
  - **Protegidas** — envolvidas por `<ProtectedRoute>` (exige autenticação).
  - **Mobile PWA** — `/patrimonio-mobile`, `/instalar`.

### Autenticação e permissões (RBAC)
- `src/contexts/AuthContext.tsx` é a **fonte única de verdade** de auth.
  Estratégia: `onAuthStateChange` do Supabase é o único disparador; `signIn`/
  `signOut` apenas acionam. Expõe `hasPermission`, `hasAnyPermission`,
  `isSuperAdmin`, etc. Permissões são cacheadas (TTL ~60s).
- Mapeamento de permissões por rota: `ROUTE_PERMISSIONS` em `src/types/auth.ts`.
- **ATENÇÃO (estado atual):** `src/components/auth/ProtectedRoute.tsx` está em
  modo **"ACESSO TOTAL"** — libera qualquer usuário autenticado, ignorando
  `requiredModule`/`requiredPermissions` declarados nas rotas. Os props ainda
  existem nas rotas (e documentam a intenção de acesso), mas **não são
  aplicados** no momento. Se for reintroduzir RBAC real, é aqui que se mexe — e
  confirme com o usuário antes, pois afeta segurança de todo o sistema.

### Módulos
- A lista canônica de módulos está em `src/shared/config/modules.config.ts`
  (`MODULOS`, `MODULES_CONFIG`). Cada módulo tem código, nome, ícone, cor, rotas
  e seções de menu. Módulos atuais: `admin, rh, workflow, compras, contratos,
  financeiro, patrimonio, governanca, integridade, transparencia, comunicacao,
  programas, gestores_escolares, organizacoes, gabinete, patrimonio_mobile,
  arbitros`.
- Menu lateral: `src/config/menu.config.ts` e `module-menus.config.ts`.

### Dados (React Query + Supabase)
- A camada de acesso a dados fica em **hooks** (`src/hooks/use<Coisa>.ts`), que
  usam `supabase` + React Query. Padrão: reutilize/estenda o hook existente do
  domínio em vez de chamar `supabase` direto dentro de componentes de página.
- `QueryClient` config em `App.tsx`: `staleTime` 1min, `gcTime` 5min,
  `retry: 1`, sem refetch no foco da janela.
- Tipos do banco: `src/integrations/supabase/types.ts` (**gerado**, não editar).

### Geração de documentos
- Tudo em `src/lib/pdf*.ts` (jsPDF/pdf-lib) e `src/lib/word*.ts` (docx). Há um
  `pdfTemplate.ts`/`pdfLogos.ts` base. Exportações de planilha em `src/export/`
  e `src/lib/exportar*.ts` (xlsx). Geradores fiscais: `cnabGenerator.ts`,
  `esocialGenerator.ts`, `esocialXmlGenerator.ts`.

### Banco de dados (Supabase)
- Migrações em `supabase/migrations/` (nome `YYYYMMDDHHMMSS_<uuid>.sql`,
  tipicamente geradas pelo Lovable). Edge Functions em `supabase/functions/`
  (Deno/TypeScript).
- Há ferramentas MCP do Supabase disponíveis nesta sessão (listar tabelas,
  aplicar migração, logs, advisors). Antes de mudar schema, use `list_tables`
  para entender a estrutura; prefira inspecionar antes de aplicar.

---

## 7. Convenções de código

- **Idioma:** nomes de domínio, comentários e rótulos de UI em **português**
  (ex.: `GestaoServidoresPage`, `useFrequencia`, `pdfPortarias`). Mantenha esse
  padrão; não traduza nomes existentes.
- **Componentes:** PascalCase; páginas terminam em `Page` (`*Page.tsx`).
- **Hooks:** `use<Dominio>` em camelCase.
- **Imports:** use o alias `@/...` em vez de caminhos relativos longos.
- **UI:** componha com shadcn/ui (`@/components/ui/*`) + Tailwind. Use os tokens/
  classes de cor já definidos (ex.: `MODULO_COR_CLASSES`). Evite CSS solto.
- **Formulários:** react-hook-form + zod (`zodResolver`).
- **Toasts:** `useToast` (`@/hooks/use-toast`) ou `sonner`.
- Combine com o estilo do arquivo vizinho (densidade de comentários, nomes,
  idioma) ao editar.

---

## 8. Deploy

- **Vercel** (`vercel.json` faz rewrite SPA de tudo para `/index.html`). Também
  publicável via Lovable (Share → Publish).
- Backend hospedado no Supabase. Edge Functions são deployadas no Supabase.

---

## 9. Pontos de atenção / armadilhas

1. **Arquivos gerados — não editar à mão:** `src/integrations/supabase/client.ts`
   e `src/integrations/supabase/types.ts`. Regenere os tipos via Supabase.
2. **`ProtectedRoute` não aplica RBAC** hoje (modo acesso total) — ver §6.
3. **Sincronização com Lovable:** o Lovable commita automaticamente. Evite
   reformatações massivas/sem necessidade que gerem conflito; mantenha
   alterações focadas.
4. **`App.tsx` é grande:** mudanças de rota ficam todas lá. Cuidado com merges.
5. **Sem testes automatizados:** valide com `lint` + `build` e, quando possível,
   rode o app (`bun run dev`) para conferir o comportamento.
6. **Há duplicação histórica de wrappers Supabase** (`src/lib/supabase.ts`,
   `src/lib/supabaseClient.ts`, `src/integrations/supabase/client.ts`). Prefira
   `@/lib/supabase` ou `@/integrations/supabase/client` conforme o padrão do
   arquivo onde está trabalhando.

---

## 10. Como adicionar uma feature (receita rápida)

1. **Tipos:** defina/atualize em `src/types/<dominio>.ts`.
2. **Dados:** crie/estenda um hook em `src/hooks/use<Dominio>.ts` (React Query +
   `supabase`). Se precisar de schema novo, crie migração em
   `supabase/migrations/` (ou via MCP) e regenere os tipos.
3. **UI:** crie componentes em `src/components/<dominio>/` usando shadcn/ui.
4. **Página:** crie `src/pages/<dominio>/<Nome>Page.tsx`.
5. **Rota:** importe a page e registre a `<Route>` no bloco do módulo em
   `src/App.tsx` (com o guard apropriado).
6. **Menu/módulo:** se for um item navegável, adicione em
   `src/config/menu.config.ts` e, se for módulo novo, em
   `src/shared/config/modules.config.ts`.
7. **Verifique:** `bun run lint` e `bun run build`.

---

## 11. Fluxo de trabalho Git nesta sessão

- Branch de desenvolvimento: **`claude/ooda-project-structure-eID3T`**.
- Faça commits descritivos e dê push para essa branch (`git push -u origin
  <branch>`). Após o push, abra um Pull Request **draft** se ainda não existir.
- Repositório GitHub: `twosulucoes/idjuv-governa-hub`.
</content>
</invoke>
