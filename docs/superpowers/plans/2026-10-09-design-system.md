# Plano — reformulação do design (Design System do Governa Hub)

- **Data:** 2026-10-09
- **Spec:** [`../specs/2026-10-09-design-system-design.md`](../specs/2026-10-09-design-system-design.md)
- **Regra de convivência:** cada fase é uma PR própria e pequena. Fases 1–2 não tocam páginas; a
  partir da Fase 3 a migração é **um módulo por PR**, nunca um módulo com PR de feature aberta
  (hoje: RH — PR #35).

## Fase 0 — Skill e spec ✅ (esta PR)

- Vendorizar `ui-ux-pro-max` em `.claude/skills/` com nota de origem e revisão de segurança.
- Spec do design system + este plano.
- Registrar o skill em `AGENTS.md`, `CLAUDE.md` §10.1 e no skill `superpowers` (eixo UI).

## Fase 1 — Fundação de tokens (sem mudar telas) ✅ (mesma PR)

Feita em 2026-10-09 com IBM Plex Sans. Desvios do plano registrados na spec §9: tokens `--*-text`
no lugar de `*-subtle` e `--module-*` adiado para a tarefa 2.6. A vitrine (1.6) ficou com
`requiredModule="admin"` (página estática, sem dados), não só super admin.

| # | Tarefa | Arquivos | Verificação | Agente |
|---|---|---|---|---|
| 1.1 | Remover os `@import` de fontes não usadas e carregar só a fonte decidida (com `preconnect` no `index.html`) | `src/index.css`, `index.html`, `tailwind.config.ts` | `bun run build`; DevTools sem requisição a Lora/DM Sans/Crimson/Space Mono | `dev-frontend-idjuv` |
| 1.2 | Script de contraste: lê `:root`/`.dark` de `index.css` e a paleta de cada `tenants/*/tenant.config.ts`, falha se par texto/fundo < 4,5 ou `input`/`background` < 3 | `scripts/check-contraste.mjs`, `scripts/gate.sh` | Roda vermelho no estado atual (2,79 do accent) e verde após 1.3 | `dev-frontend-idjuv` |
| 1.3 | Aplicar as correções de contraste (spec §3.2) em `index.css` **e** no perfil `tenants/idjuv` (mesmos valores) e conferir `_template` | `src/index.css`, `tenants/idjuv/tenant.config.ts`, `tenants/_template/tenant.config.ts` | Script 1.2 verde; comparação visual antes/depois em 3 telas | `dev-frontend-idjuv` |
| 1.4 | Novos tokens: `*-subtle`, `--module-*`, `--chart-1..8`, escala tipográfica, movimento (`--duration-*`) e `prefers-reduced-motion` global | `src/index.css`, `tailwind.config.ts`, `src/core/tenant/types.ts` + `tema.ts` se a marca precisar derivar `chart-*` | Typecheck; página `/admin/design-system` (1.6) mostra todos | `dev-frontend-idjuv` |
| 1.5 | Guard ratchet de cor crua: conta classes `bg/text/border-<paleta>-<n>` e hex em `src/**/*.tsx`, compara com `scripts/gate-baseline.json` (campo novo `corCrua`, 2010 na criação) e falha se subir | `scripts/gate.sh`, `scripts/gate-baseline.json` | Gate verde; adicionar `bg-blue-500` num arquivo faz falhar | `dev-frontend-idjuv` |
| 1.6 | Página interna de referência ("vitrine") com tokens, tipografia e componentes, só para super admin | `src/pages/admin/DesignSystemPage.tsx`, rota em `src/App.tsx`, `ROUTE_PERMISSIONS` | Abre em 390px e 1440px, claro e escuro | `dev-frontend-idjuv` |
| 1.7 | Documentar | `docs/GUIA_FRONTEND.md` (seção Design System), `docs/WHITE_LABEL.md` (contrato de contraste do tenant) | `node scripts/check-doc-links.mjs` | `documentador-idjuv` |

Revisão: `revisor-codigo-idjuv`; `revisor-seguranca-idjuv` só para a rota nova (1.6).

## Fase 2 — Componentes de padrão (sem mudar telas) ✅

Feita em 2026-10-09, sem dependência nova: o `DataTable` é próprio, sobre `<table>` (cabeçalho fixo
exige que a rolagem seja da própria tabela, o `ui/table` envolve em outro contêiner). A tarefa 2.6
**não foi feita**: `MODULO_COR_CLASSES` já usa pares 100/800 e 800/200 com contraste AA nos dois
modos, cores de módulo são do produto (não variam por tenant) e ficam em `.ts`, fora do guard de cor
crua — trocar por 48 tokens não traria ganho visível. Fica para quando um tenant precisar mudá-las.

| # | Tarefa | Arquivos |
|---|---|---|
| 2.1 | `Button`: tamanhos sm/default/lg (32/40/44px) e estado `loading` | `src/components/ui/button.tsx` |
| 2.2 | `PageHeader`, `EmptyState`, `StatusBadge` (mapa status → token) | `src/components/design-system/` |
| 2.3 | `DataTable` (cabeçalho fixo, ordenação, filtro, seleção + lote, paginação, densidade, estados vazio/carregando/erro, cartões no mobile, `tabular-nums`) — avaliar `@tanstack/react-table` vs. componente próprio sobre `ui/table` | `src/components/design-system/DataTable/` |
| 2.4 | `FormSection` + `ErrorSummary` integrado ao `react-hook-form` | `src/components/design-system/form/` |
| 2.5 | `KpiCard`, `ChartCard` (sobre `ui/chart` + `chartConfig`) | `src/components/design-system/` |
| 2.6 | `MODULO_COR_CLASSES` → tokens `--module-*` | `src/shared/config/modules.config.ts` |
| 2.7 | Vitrine (1.6) exibe todos os componentes e estados | `src/pages/admin/DesignSystemPage.tsx` |

Verificação: gate verde; vitrine conferida com Playwright em 390/768/1440px, claro e escuro, e só
teclado. Agente: `dev-frontend-idjuv`; revisão `revisor-codigo-idjuv`.

## Fase 3 — Shell e módulo piloto

| # | Tarefa |
|---|---|
| 3.1 | `ModuleLayout`/`ModuleSidebar`/`Header`: skip-link, landmarks, breadcrumb, foco visível, sidebar recolhível acessível |
| 3.2 | Módulo piloto (decisão do usuário) migrado para os padrões de tela da spec §5: lista, detalhe, formulário e painel |
| 3.3 | Checklist de acessibilidade da spec §6 aplicado no piloto; ajustes de componente voltam para a Fase 2 |

## Fase 4 — Migração por módulo

Um módulo por PR, na ordem combinada com o usuário, evitando módulos com PR aberta. Cada PR:
troca cor crua por token (baixando o baseline `corCrua`), adota `PageHeader`/`DataTable`/
`FormSection`, passa no checklist §6. Ordem sugerida: Patrimônio → Governança → Compras →
Contratos → Financeiro → Folha → RH (depois do PR #35) → Admin → demais.

## Fase 5 — Portal público e PWA

- Portal: corpo 16px, alvos 44px, skip-link, linguagem simples, contraste AA; serif opcional por
  tenant.
- PWA de inventário: botões ≥ 44px, estado offline visível, leitura de código em tela cheia.

## Riscos

| Risco | Mitigação |
|---|---|
| Conflito com o Lovable e com PRs de feature | Fases 1–2 só em arquivos de base; Fase 4 um módulo por PR |
| Mudar `--accent`/`--secondary` muda o visual de telas inteiras | Comparação visual antes/depois em telas-chave na PR da Fase 1 |
| Cliente white label com paleta sem contraste | Script 1.2 roda sobre todos os `tenants/*` no gate |
| `vite build` não pega erro de tipo | Gate completo (`bash scripts/gate.sh`) em toda PR |
