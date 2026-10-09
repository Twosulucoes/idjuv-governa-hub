# Guia do Front-end

## Estrutura de `src/`

```
src/
├── App.tsx                # Providers + todas as rotas
├── main.tsx               # Bootstrap + registro do PWA
├── pages/                 # ~241 páginas por domínio (rh/, financeiro/, admin/, ...)
├── components/            # ~282 componentes
│   ├── ui/                # shadcn/ui (base — evitar editar à toa)
│   ├── auth/, layout/, menu/, navigation/, public/
│   └── <dominio>/         # rh/, financeiro/, inventario/, folha/, cms/, ...
├── hooks/                 # ~80 hooks use<Dominio> (camada de dados)
├── contexts/              # AuthContext, MenuContext
├── config/                # menu.config.ts, module-menus.config.ts, segadFieldsConfig.ts
├── shared/config/         # modules.config.ts (fonte da verdade dos módulos)
├── modules/               # re-exports de config + dashboards de módulo
├── types/                 # tipos de domínio (auth, rh, folha, financeiro, ...)
├── lib/                   # cálculos + geradores (PDF/Word/CNAB/eSocial) + utils
├── export/                # exportCSV.ts, exportExcel.ts
├── integrations/supabase/ # client.ts (gerado), types.ts (gerado)
└── services/              # serviços específicos
```

Alias de import: **`@` → `src/`** (use `@/...`, não caminhos relativos longos).

## Hooks (camada de dados)

Toda leitura/escrita no Supabase passa por um hook `use<Coisa>` (React Query +
`supabase`). Categorias:

- **Dashboards**: `use<Modulo>DashboardStats` (Admin, RH, Financeiro, Patrimônio,
  Compras, Contratos, Comunicação, Governança, Integridade, Programas,
  Transparência, Workflow, Gestores Escolares).
- **RH / folha**: `useServidorCompleto`, `useServidoresPorUnidade`,
  `useVinculosServidor`, `useConfigVidaFuncional`, `useGestaoLotacao`,
  `useDesignacoes`, `useFrequencia`, `useFrequenciaPacotes`,
  `useParametrizacoesFrequencia`, `useGerarFrequenciaPDF`, `useFolhaPagamento`,
  `useFolhaCalculos`, `useMotorFolha`, `useFechamentoFolha`, `useContracheque`,
  `useRHIntegracoes`, `useRelatorios`, `usePortarias`, `usePreCadastro`.
- **Financeiro**: `useFinanceiro`, `useAlteracoesOrcamentarias`, `useSubEmpenhos`,
  `useRestosAPagar`.
- **Patrimônio**: `usePatrimonio`, `useCadastroLote`, `useCadastroBemSimplificado`,
  `useMovimentacaoLote`, `useAlmoxarifado`, `useColetaOffline`.
- **Comunicação/CMS**: `useCMSConteudos`, `useCMSBanners`, `useCMSGalerias`,
  `useCalendarioComunicacao`, `useDemandasAscom`.
- **Admin/segurança**: `useAdminUsuarios`, `useUsuarios`, `usePermissions`,
  `usePermissoesUsuario`, `useRBAC`, `useApprovalRequests`, `useAuditLog`,
  `useBackupOffsite`, `useDatabaseSchema`, `useModuleSettings`,
  `useConfigPaginasPublicas`, `useFormFieldConfig`.
- **Organização**: `useOrganograma`, `useInstituicoes`, `useAgrupamentoUnidades`,
  `usePortalDiretoria`, `useEscolasJer`, `useFederacoesRelatorio`,
  `useGestoresEscolares`.
- **UI/navegação**: `useSidebarCollapse`, `useModuleRouter`, `useModulosUsuario`,
  `use-toast`.

**Padrão:** ao precisar de dados de um domínio, estenda o hook existente em vez
de chamar `supabase` direto dentro da página.

## Lib (`src/lib`)

- **PDF** (`pdf*.ts`, ~40): base em `pdfTemplate.ts`/`pdfLogos.ts`/`pdfGenerator.ts`.
  Exemplos: `pdfContracheque`, `pdfFrequenciaMensalGenerator`, `pdfPortarias`,
  `pdfOrganograma`, `pdfRelatorioFederacoes`, `pdfRelatoriosRH`, blocos de unidade
  em `pdf/`.
- **Word**: `wordPortarias.ts` (docx).
- **Planilhas**: `exportarPlanilha.ts`, `exportarFederacoes.ts`, e `src/export/`.
- **Fiscal/folha**: `cnabGenerator.ts` (CNAB240), `esocialGenerator.ts` +
  `esocialXmlGenerator.ts`, `folhaCalculos.ts`/`folhaCalculoService.ts` (INSS,
  IRRF, consignações), `frequenciaCalculoService.ts`.
- **Utils**: `formatters.ts` (máscaras), `utils.ts` (`cn`, helpers),
  `matriculaUtils.ts`, `statusColors.ts`, `supabase.ts`/`supabaseClient.ts`.

## Padrões de UI

- **shadcn/ui** (Radix) em `@/components/ui/*` + **Tailwind**. Componha; evite CSS
  solto. Use os tokens de cor existentes (ex.: `MODULO_COR_CLASSES`,
  `statusColors.ts`) e suporte a dark mode (`next-themes`).
- **Design System** (direção em
  [`superpowers/specs/2026-10-09-design-system-design.md`](./superpowers/specs/2026-10-09-design-system-design.md),
  fases em [`superpowers/plans/2026-10-09-design-system.md`](./superpowers/plans/2026-10-09-design-system.md);
  vitrine viva em `/admin/design-system`, `src/pages/admin/DesignSystemPage.tsx`):
  - **Cor só por token** (`bg-primary`, `text-muted-foreground`, `border-input`). Cor crua
    (`bg-blue-500`, hex) é contada no gate e não pode aumentar.
  - **Texto de estado:** `text-success|warning|info|accent|secondary` já resolvem para a versão
    legível do matiz (`--*-text`, configurado em `textColor` no `tailwind.config.ts`); `bg-*`
    continua sendo o preenchimento. Badge suave: `bg-warning/15 text-warning`.
  - **Contraste AA:** texto ≥ 4,5:1, borda de campo (`--input`) e foco (`--ring`) ≥ 3:1, claro e
    escuro — `npm run check:contraste` (roda no gate). `--border` é só divisória decorativa.
  - **Tipografia:** IBM Plex Sans (`font-sans`) em tudo, inclusive `h1`–`h3`; Merriweather
    (`font-serif`) só quando pedido explicitamente. Escala: `text-display`, `text-h1`, `text-h2`,
    `text-h3`, `text-body` (14px, corpo do sistema), `text-body-lg`, `text-caption` (12px, mínimo).
    Tabelas usam números tabulares por padrão. As tags `h1`–`h3` ainda têm o tamanho antigo
    (base de `src/index.css`); telas novas ou migradas usam as classes da escala (`text-h1`…), e
    o tamanho base é alinhado quando o `PageHeader` da Fase 2 existir.
  - **Gráficos:** série `--chart-1` a `--chart-8` via `ChartContainer`/`chartConfig` de
    `@/components/ui/chart` — nada de `fill="#…"`.
  - **Movimento:** `--duration-fast` (150ms) / `--duration-base` (200ms); `prefers-reduced-motion`
    é respeitado globalmente em `src/index.css` (exceto `animate-spin`, que sinaliza carregamento).
  - **Componentes de padrão** em `@/components/design-system` (use-os em telas novas e migradas):
    - `PageHeader` — migalhas, `h1` na escala nova, situação, descrição e ações (uma primária);
      `midia` põe foto/ícone à esquerda do título (ex.: ficha do servidor).
    - `DataTable` — busca (`buscarPor`), ordenação (`ordenarPor`), seleção + `acoesEmLote`,
      `acoesLinha`, paginação no cliente, densidade lembrada no navegador, estados
      `carregando`/`erro`/`vazio` e cartões abaixo de `md` (`mobile: "titulo" | "oculta"` por coluna).
    - `StatusBadge` — cor + ícone + texto; o tom sai do texto (`tomDaSituacao`: ativo, pendente,
      em análise, cancelado…) ou de `tom` explícito.
    - `EmptyState`, `KpiCard` (variação com sinal e ícone; `subirEhBom={false}` para despesas/faltas),
      `ChartCard` (gráfico com alternância para tabela de dados).
    - `FormSection` (fieldset com legenda) e `ErrorSummary` (resumo focável dos erros do
      react-hook-form, com link para cada campo; use `shouldFocusError: false` no `useForm`).
    - `Button` aceita `loading` (spinner, `disabled` e `aria-busy`).
  - **Shell (`ModuleLayout`)** já entrega "Pular para o conteúdo", marcos (`header`, `nav`
    rotulados, `main` focável), `aria-current` no menu e menu do celular como diálogo. A página não
    repete isso: começa no `PageHeader` (um único `h1`). Referência migrada: RH (painel, lista e
    ficha do servidor); selo de situação funcional em `@/components/rh/SituacaoServidorBadge`.
  - Consulte o skill `ui-ux-pro-max` (`.claude/skills/UI-UX-PRO-MAX-VENDOR.md`) para decisões
    de UI/UX e acessibilidade.
- **Ícones**: `lucide-react`.
- **Formulários**: `react-hook-form` + `zod` (`zodResolver`).
- **Notificações**: `useToast` (`@/hooks/use-toast`) ou `sonner`.
- **Gráficos**: `recharts`. **Diagramas/fluxo**: `reactflow` (organograma, workflow).
- **Tabelas/listas**: padrões dos componentes de domínio existentes.

## Convenções de código

- Domínio, comentários e rótulos **em português** (não traduzir nomes existentes).
- **Páginas**: `*Page.tsx` (PascalCase). **Hooks**: `use<Dominio>` (camelCase).
  **Tipos**: `src/types/<dominio>.ts`.
- Combine com o estilo do arquivo vizinho (densidade de comentários, nomes).
- **Arquivos gerados — não editar**: `src/integrations/supabase/client.ts` e
  `src/integrations/supabase/types.ts`.

## Adicionando uma página (resumo)

1. Tipos em `src/types/<dominio>.ts`.
2. Hook de dados em `src/hooks/use<Dominio>.ts`.
3. Componentes em `src/components/<dominio>/`.
4. Página em `src/pages/<dominio>/<Nome>Page.tsx`.
5. Rota em `src/App.tsx` (bloco do módulo, com o guard apropriado).
6. Item de menu em `src/config/menu.config.ts` (se navegável).
7. `bun run lint` + `bun run build`.

Detalhes em [DESENVOLVIMENTO.md](./DESENVOLVIMENTO.md).
