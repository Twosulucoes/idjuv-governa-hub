# Design System do Governa Hub — spec de reformulação

- **Data:** 2026-10-09
- **Classificação:** architectural (interface visual de que todas as 241 páginas dependem)
- **Pedido:** "vamos fazer uma reformulação no design. instale e planeje um design system com
  ui-ux-pro-max-skill" — Fabiano
- **Fonte de conhecimento:** skill `ui-ux-pro-max` v2.13.0 (vendorizado em
  `.claude/skills/ui-ux-pro-max/`, ver `.claude/skills/UI-UX-PRO-MAX-VENDOR.md`)
- **Plano de execução:** [`../plans/2026-10-09-design-system.md`](../plans/2026-10-09-design-system.md)

## Premissas

1. Esta entrega **planeja**; nenhuma tela é reescrita aqui. Outras frentes abertas (RH — PR #35,
   avisos, backup) mexem em telas, então a migração visual entra por fases e por módulo.
2. O sistema continua **white label**: a marca (cores institucionais, logos) vem do perfil do
   tenant (`tenants/<slug>/tenant.config.ts` → `src/core/tenant/tema.ts`). O design system define
   a **estrutura** (neutros, semânticos, escala, componentes); o tenant só preenche a marca.
3. Stack fica como está: Tailwind 3 + tokens HSL + shadcn/ui (Radix). A recomendação do skill de
   migrar para Tailwind v4/OKLCH fica fora deste escopo.
4. Público principal: servidores públicos usando o ERP o dia inteiro em desktop (densidade alta);
   secundário: cidadão no portal público e equipe de campo no PWA de inventário (mobile).

## 1. Diagnóstico do estado atual (medido em 2026-10-09)

| Achado | Evidência | Impacto |
|---|---|---|
| Tokens semânticos já existem e são a maioria | 6.193 usos de `bg/text/border-{primary,muted,…}` em `.tsx` | Base boa: reformular tokens propaga para quase tudo |
| Cor crua do Tailwind ainda espalhada | 1.937 classes `bg-blue-500`, `text-green-700`… em 153 arquivos; 47 hex em `.tsx`; `MODULO_COR_CLASSES` usa paleta crua | Dark mode e white label quebram nesses pontos |
| Fontes carregadas sem uso | `src/index.css` importa 8 `@import` do Google Fonts (Source Sans 3, Merriweather ×2, Inter ×2, Lora, Space Mono, DM Sans, Crimson Pro); só **Inter** é usada (o comentário do arquivo diz Merriweather + Source Sans) | Peso de carregamento e documentação contraditória |
| Contraste abaixo de WCAG AA em tokens de marca | `accent`/`info` (`200 85% 50%`) com texto branco = **2,79:1**; `secondary`/`success` (`120 50% 38%`) com branco = **4,01:1**; `border`/`input` sobre o fundo = **1,25:1** (campo precisa de 3:1); `destructive` dark com branco = **4,40:1** | Botões, badges e bordas de input ilegíveis para parte dos usuários |
| Tokens de gráfico sem relação com a marca | `--chart-1..5` são tons cinza-bege genéricos; só 4 usos de `--chart-*` e há `fill="#…"` fixo em gráficos | Gráficos inconsistentes entre módulos |
| Microtipografia | 987 `text-xs` (12px) e 58 `text-[Npx]` arbitrários | Texto pequeno demais em tabelas e badges |
| Layout | 143 páginas em `ModuleLayout`, 31 em `MainLayout`; sem `PageHeader`, `EmptyState` ou `DataTable` padronizados em `src/components/` | Cada página reinventa cabeçalho, vazio e tabela |

Contrastes calculados com a fórmula WCAG 2.x a partir dos HSL de `src/index.css`.

## 2. Direção visual (recomendação do skill)

Consulta: `"government public administration ERP dashboard accessible" --design-system`
com `--density 8 --variance 3 --motion 2`.

- **Estilo:** *Minimalism & Swiss Style* — limpo, funcional, alto contraste, grid, sans-serif.
  Indicado para "enterprise apps, dashboards, professional tools"; risco de acessibilidade baixo
  (exige contraste 4,5:1, teclado, foco visível, `prefers-reduced-motion`).
- **Dials:** variância 3 (centrado/sóbrio), movimento 2 (sutil), densidade 8 (dashboard denso).
- **Paleta de referência "Government/Public Service":** neutros slate (`#0F172A`, `#334155`,
  `#475569`, `#E2E8F0`, `#F8FAFC`), acento azul `#0369A1`, destrutivo `#DC2626`.
  Usamos a **estrutura de neutros**; a cor de marca continua a do tenant (IDJuv: azul `#164069`).
- **Evitar:** ornamentos, baixo contraste, efeitos de movimento, gradientes roxo/rosa "de IA",
  emoji como ícone (o repo já usa lucide-react — manter).

## 3. Tokens

### 3.1 Cor — camadas

```
camada 1  neutros do sistema (fixos no núcleo)      background, foreground, card, muted, border, input
camada 2  semânticos de estado (fixos no núcleo)    success, warning, info, destructive (+ -foreground, -subtle)
camada 3  marca (vem do tenant)                      primary, secondary, accent, highlight, sidebar-*
camada 4  módulos e gráficos (derivados)             module-*, chart-1..8
```

Regras:

- Componente **só** usa token (`bg-primary`, `text-muted-foreground`, `border-input`). Cor crua
  (`bg-blue-500`, `#1e40af`) proibida em `src/` fora de `src/index.css` — vira guard ratchet no gate.
- Todo token com `-foreground` precisa de **≥ 4,5:1** contra o fundo (texto normal) e a borda de
  campo (`--input`) **≥ 3:1** contra `--background` (WCAG 1.4.11). Vale para claro **e** escuro, e
  para a paleta de cada tenant — validado por script (plano, Fase 1).
- Estados ganham variante suave para fundos de badge/alerta: `--success-subtle`,
  `--warning-subtle`, `--info-subtle`, `--destructive-subtle` (fundo claro + texto escuro do
  mesmo matiz), substituindo os `bg-green-100 text-green-800` espalhados.
- Status nunca só por cor: badge sempre com texto e, quando couber, ícone.

### 3.2 Correções de contraste propostas (tenant IDJuv, modo claro)

| Token | Hoje | Proposto | Contraste com branco/fundo |
|---|---|---|---|
| `accent`, `info` (fundo com texto branco) | `200 85% 50%` (2,79) | `200 85% 38%` | 4,59 |
| `secondary`, `success` | `120 50% 38%` (4,01) | `120 50% 35%` | 4,62 |
| `input` (borda de campo) | `200 15% 88%` (1,25) | `210 15% 57%` | 3,08 |
| `border` (divisória decorativa) | `200 15% 88%` | mantém | — (não é componente interativo) |
| `destructive` (escuro) | `0 70% 55%` (4,40) | `0 70% 54%` ou texto escuro | ≥ 4,5 |

O azul claro atual (`50%`) continua disponível como `--accent-subtle`/ilustração, não como fundo de
texto. Valores finais são conferidos pelo script de contraste antes do merge da Fase 1.

### 3.3 Tipografia

- **Uma família de UI** para o sistema interno, com números tabulares (tabelas financeiras e de
  folha): `font-variant-numeric: tabular-nums` em tabelas e valores.
- Candidatas (decisão do usuário):
  - **IBM Plex Sans** — skill: "Financial Trust", sério, excelente para dados. Recomendação.
  - **Atkinson Hyperlegible** — skill: indicada a governo e acessibilidade (legibilidade
    máxima, mas larga em tabelas densas). Boa para o **portal público**.
  - **Inter** — a atual; mantê-la é a opção de menor mudança.
- Serif (Merriweather) só no portal público/títulos institucionais, se o tenant quiser — vira
  opção do perfil do tenant, não fonte global.
- Carregar só as fontes usadas (de 8 `@import` para 1–2), com `display=swap`.
- Escala (base 16px, razão ~1,2, densidade de ERP):

| Token | Tamanho/altura | Uso |
|---|---|---|
| `text-display` | 30/36 | Título do portal |
| `text-h1` | 24/32 | Título de página |
| `text-h2` | 20/28 | Seção |
| `text-h3` | 16/24 semibold | Card, grupo de formulário |
| `text-body` | 14/20 | Corpo do ERP (densidade alta) |
| `text-body-lg` | 16/24 | Portal público, textos longos |
| `text-caption` | 12/16 | Metadado, legenda — **nunca** para conteúdo principal |

  Mínimo de 12px; conteúdo de tabela em 14px. `text-[Npx]` arbitrário proibido.

### 3.4 Espaço, forma, elevação, movimento

- **Espaço (densidade 8 do skill):** escala de 4px — `1 (4) · 2 (8) · 3 (12) · 4 (16) · 6 (24) · 8 (32)`.
  Página: gutter 24px desktop / 16px mobile; entre cards 16px; dentro do card 16–24px.
- **Densidade de tabela:** `confortável` (linha 48px) e `compacta` (linha 36px), escolhida por
  usuário e lembrada localmente.
- **Raio:** `--radius: 0.5rem` mantido (Swiss = cantos discretos); badge `full`, input/botão `md`.
- **Elevação:** só `shadow-xs` (card) e `shadow-md` (popover/menu); modal usa overlay, não
  sombra pesada. Remover `--shadow-2xl` que hoje é igual a `--shadow`.
- **Movimento:** 150–200ms `ease-out` para hover/abrir; saída mais rápida que entrada;
  `prefers-reduced-motion: reduce` zera animações não essenciais. Sem GSAP (o skill sugere, mas
  com movimento 2/10 não vale a dependência).
- **Toque:** alvos ≥ 44×44px no PWA e no portal; ≥ 32px de altura no ERP desktop com área clicável
  ampliada.

### 3.5 Módulos e gráficos

- `MODULO_COR_CLASSES` passa a usar tokens `--module-<cor>` / `--module-<cor>-foreground`
  definidos em `index.css` (claro e escuro), em vez de `bg-blue-100 text-blue-800`.
- Gráficos: 8 tokens `--chart-1..8` derivados da marca + neutros, distinguíveis para daltonismo;
  Recharts sempre via `ChartContainer`/`chartConfig` do shadcn (nada de `fill="#…"`).
  Todo gráfico com tabela de dados alternativa ou rótulos diretos (skill: "do not rely on color alone").

## 4. Componentes (camada sobre o shadcn/ui)

`src/components/ui/*` continua sendo o shadcn. Os componentes de padrão do sistema ficam em
`src/components/design-system/` (nome a confirmar no plano):

| Componente | Função | Regras do skill aplicadas |
|---|---|---|
| `PageHeader` | Título, breadcrumb, descrição curta, ações primárias à direita | Hierarquia clara; 1 ação primária por tela |
| `DataTable` | Tabela padrão: cabeçalho fixo, ordenação, filtro, seleção + ações em lote, paginação, densidade, vazio/carregando/erro, rolagem horizontal ou cartões no mobile | "Table handling", "Bulk actions", números tabulares |
| `StatusBadge` | Mapa status de domínio → token semântico (ativo, pendente, cancelado…) | Texto + cor, nunca só cor |
| `EmptyState` | Ícone, mensagem, ação para sair do vazio | Feedback e próximo passo |
| `FormSection` / `ErrorSummary` | Agrupamento de formulário e resumo de erros focável no topo, ligado aos campos | "Focusable error summary", erro perto do campo, `role="alert"` |
| `KpiCard` | Indicador com rótulo, valor, variação e período | Valor tabular, variação com ícone e sinal |
| `ChartCard` | Gráfico + legenda + alternativa em tabela | Acessibilidade de gráficos |
| `ConfirmDialog` | Confirmação de ação destrutiva com nome do objeto | Destrutivo sempre confirmado |

Variantes do `Button`: `default` (marca), `secondary`, `outline`, `ghost`, `destructive`, `link`;
tamanhos `sm` (32px), `default` (40px), `lg` (44px); estado `loading` com spinner e `aria-busy`.

## 5. Padrões de tela

| Padrão | Uso | Estrutura |
|---|---|---|
| **Lista (CRUD)** | Servidores, contratos, bens, processos | `PageHeader` + filtros + `DataTable` + ações em lote |
| **Detalhe** | Ficha do servidor, contrato, processo | `PageHeader` com status + abas + painel lateral de metadados |
| **Formulário** | Cadastro/edição | `FormSection`s em 1 coluna (2 em telas largas), `ErrorSummary`, barra de ações fixa no rodapé |
| **Painel (dashboard)** | Home de módulo | Linha de `KpiCard` + `ChartCard`s + "pendências" em tabela curta |
| **Relatório/Documento** | PDFs, exportações | Filtros → pré-visualização → exportar (PDF/XLSX) |
| **Portal público** | Notícias, transparência, formulários de cadastro | Corpo 16px, alvos 44px, linguagem simples, skip-link; segue LAI e eMAG |
| **PWA de campo** | Inventário | Mobile-first, botões grandes, offline visível, leitura de código |

Shell (`ModuleLayout`/`ModuleSidebar`/`Header`): skip-link "Ir para o conteúdo", landmarks
(`header`, `nav`, `main`), breadcrumb, foco visível (`ring-2 ring-ring ring-offset-2`), sidebar
recolhível com rótulos acessíveis nos ícones.

## 6. Acessibilidade (critério de aceite de toda tela migrada)

Meta: **WCAG 2.2 AA** (e eMAG, por ser órgão público).

- Contraste 4,5:1 texto, 3:1 componentes e foco; claro e escuro.
- Navegável só por teclado, foco visível e nunca escondido sob cabeçalho fixo.
- Ícone sem texto tem `aria-label`; ícone decorativo `aria-hidden`.
- Erros anunciados (`role="alert"`/`aria-live`) e ligados ao campo (`aria-describedby`).
- Responsivo em 375, 768, 1024 e 1440px sem rolagem horizontal da página.
- `prefers-reduced-motion` respeitado.

## 7. Fora do escopo

- Reescrever telas nesta entrega (vem nas fases 3–5 do plano, por módulo).
- PDFs e documentos oficiais (Fase 4 do White Label, já planejada em `docs/WHITE_LABEL.md`).
- Migração para Tailwind v4/OKLCH.
- Mudança em `ProtectedRoute`, `AuthContext`, RLS — nada disso é tocado.

## 8. Decisões pendentes do usuário

1. **Fonte de UI:** IBM Plex Sans (recomendada) · Atkinson Hyperlegible · manter Inter.
2. **Módulo piloto** da Fase 3 (recomendado: um módulo sem frente aberta, ex.: Patrimônio ou
   Governança — RH tem PR aberto).
