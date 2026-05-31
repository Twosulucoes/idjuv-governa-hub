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
</content>
