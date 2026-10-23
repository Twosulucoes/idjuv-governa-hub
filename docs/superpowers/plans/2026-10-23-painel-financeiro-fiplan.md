# Painel do Financeiro (dados do FIPLAN) — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** trocar a tela `/financeiro` por um painel gerencial da execução orçamentária, calculado a partir de
`fin_dotacoes` (QDD) e `fin_empenhos` (FIP 614).

**Architecture:** as contas ficam em funções puras e testadas (`src/lib/financeiro/painelExecucao.ts`). Um hook
(`usePainelFinanceiro`) busca as linhas no Supabase e devolve os números prontos. A página só monta seis quadros
em `src/components/financeiro/painel/`. Não há mudança de banco, rota, permissão ou importador.

**Tech Stack:** React 18, TypeScript, @tanstack/react-query 5, Supabase JS, shadcn/ui + design system
(`KpiCard`, `ChartCard`, `EmptyState`), recharts, vitest.

**Spec:** `docs/superpowers/specs/2026-10-23-painel-financeiro-fiplan-design.md`

## Global Constraints

- Português em nomes, comentários e rótulos. Combine com o estilo do arquivo vizinho.
- Nenhuma mudança em `supabase/`, `src/App.tsx`, `ProtectedRoute`, `AuthContext` ou importadores.
- Saldo para empenhar = `valor_atual − valor_empenhado − valor_bloqueado − valor_reserva − valor_ped`. Não use a
  coluna `saldo_disponivel`.
- Só entram dotações com `ativo = true`. Empenhos com `status = 'anulado'` ficam fora da fila.
- Valor sem dado aparece como "—", nunca como zero. Moeda pelo `formatCurrency` de `@/lib/formatters`.
- Cor só pelos tokens do design system (`hsl(var(--chart-N))`, classes semânticas). O gate reprova cor crua.
- Nenhum dado real de credor em teste ou em doc: os testes usam nomes fictícios.
- Arquivo novo precisa ser alcançado a partir de `main.tsx` (`src/codigo-alcancavel.test.ts`).

## Review Focus

1. **Natureza com pontos ou com 6 dígitos** (`3.1.90.11` ou `319011`): o grupo e o elemento saem só dos dígitos.
   Natureza nula vai para o grupo "Sem natureza" e fica fora dos alertas. É testado na Task 1.
2. **Mês de referência em janeiro, ou exercício passado** (m = 1, ou m = 12 com 0 meses restantes): sem divisão
   por zero e sem alerta falso. É testado na Task 1.
3. **Valores nulos vindos do banco** (`valor_ped`, `valor_reserva` e outros como `null`): contam como 0. É
   testado na Task 1.
4. **Empenho sem credor** (empenho do sistema sem favorecido carregado): agrupado como "Credor não informado". É
   testado na Task 1.
5. **Exercício sem nenhuma importação de QDD**: o painel mostra o estado vazio, sem cartões com zeros. É
   verificado na Task 3.

---

### Task 1: Regras do painel (funções puras)

**Files:**
- Create: `src/lib/financeiro/painelExecucao.ts`
- Test: `src/lib/financeiro/painelExecucao.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface DotacaoPainel {
    natureza: string | null;       // código como vier (com ou sem pontos)
    natureza_nome: string | null;
    fonte: string | null;           // ex.: "1.500"
    paoe: string | null;            // ex.: "2544 - Gestão…"
    valor_atual: number | null; valor_empenhado: number | null; valor_liquidado: number | null;
    valor_pago: number | null; valor_bloqueado: number | null; valor_reserva: number | null; valor_ped: number | null;
  }
  export interface EmpenhoPainel {
    credor: string | null; data_empenho: string; // "AAAA-MM-DD"
    saldo_liquidar: number | null; saldo_pagar: number | null; status: string | null;
  }
  export interface ResumoExecucao { autorizado: number; empenhado: number; liquidado: number; pago: number;
    bloqueado: number; reservado: number; saldoEmpenhar: number;
    pctEmpenhado: number; pctLiquidado: number; pctPago: number } // % de 0 a 100; 0 quando autorizado = 0
  export interface GrupoExecucao { grupo: string; rotulo: string; autorizado: number; empenhado: number;
    pago: number; saldoEmpenhar: number }
  export interface AlertaSaldo { natureza: string; natureza_nome: string | null; fonte: string | null;
    paoe: string | null; ritmoMensal: number; mesesRestantes: number; cobertura: number;
    necessidade: number; falta: number }
  export interface CredorFila { credor: string; aLiquidar: number; aPagar: number; empenhos: number;
    diasMaisAntigo: number }
  export interface DespesaElemento { elemento: string; nome: string | null; liquidado: number; pct: number }

  export function resumirExecucao(d: DotacaoPainel[]): ResumoExecucao
  export function execucaoPorGrupo(d: DotacaoPainel[]): GrupoExecucao[]          // ordem 1..6, depois "Sem natureza"
  export function alertasDeSaldo(d: DotacaoPainel[], mesReferencia: number): AlertaSaldo[] // ordem: falta desc
  export function filaDePagamento(e: EmpenhoPainel[], hoje: Date): CredorFila[]   // todos; ordem: aPagar desc, aLiquidar desc
  export function maioresDespesas(d: DotacaoPainel[], limite?: number): DespesaElemento[] // padrão 5
  ```

- [ ] **Step 1: Write the failing tests** em `painelExecucao.test.ts`. Use uma fixture fictícia de 4 dotações
  que reproduz os totais da conferência (seção 1 da spec) e casos pequenos para cada regra:
  - `resumirExecucao` com a fixture: `autorizado` 43831750.82, `empenhado` 26670834.42, `pago` 20189920.86,
    `bloqueado` 70000, `reservado` 5676419, `saldoEmpenhar` 11414497.40 (`toBeCloseTo(…, 2)`) e `pctPago` ≈ 46.06.
  - `resumirExecucao([])`: tudo 0, sem `NaN`.
  - `resumirExecucao` com campos `null`: contam como 0.
  - `execucaoPorGrupo`: `"3.1.90.11"` e `"31901300"` caem no grupo `"1"` com rótulo `"Pessoal"`. Os rótulos são
    1 Pessoal, 2 Juros, 3 Custeio, 4 Investimento, 5 Inversões e 6 Amortização. Natureza `null` cai no grupo
    `"sem"` com rótulo `"Sem natureza"`, que fica por último.
  - `alertasDeSaldo` com o caso dos vencimentos e `mesReferencia = 10`: natureza `"31901100"`, atual 4251000,
    empenhado 4230670.92, liquidado 4041458.46 e o resto 0. Esperado: `ritmoMensal` ≈ 404145.85,
    `mesesRestantes` 3 (inclui o 13º), `cobertura` ≈ 209541.54, `necessidade` ≈ 1212437.54 e `falta` ≈ 1002896.00.
  - `alertasDeSaldo`: natureza de custeio `"33903900"` com liquidado 0 não gera alerta, e com saldo de sobra
    também não. Elemento 13 de pessoal soma o 13º. Elemento 39 de custeio não soma.
  - `alertasDeSaldo(…, 12)`: `mesesRestantes` 0 no custeio e nenhum alerta de custeio. `mesReferencia = 1` funciona
    sem erro.
  - `filaDePagamento`: dois empenhos do mesmo credor fictício são somados. `diasMaisAntigo` usa a menor
    `data_empenho` (`hoje = new Date("2026-10-23T12:00:00")`, `data_empenho "2026-10-13"` → 10). `status "anulado"`
    fica de fora. Saldos 0/0 ficam de fora. `credor null` → `"Credor não informado"`. A ordem é por `aPagar` desc.
  - `maioresDespesas`: agrupa pelos 6 primeiros dígitos (`"33903901"` e `"339039"` juntos), devolve no máximo 5,
    `pct` sobre o total liquidado e ignora elemento com liquidado 0.

- [ ] **Step 2: Run** `npx vitest run src/lib/financeiro/painelExecucao.test.ts`. Esperado: FAIL (módulo não existe).

- [ ] **Step 3: Implement** as funções de *Interfaces* em `painelExecucao.ts`. Regras que o teste não fixa
  sozinho:
  - dígitos da natureza: `natureza.replace(/\D/g, "")`; grupo = 2º dígito; elemento = dígitos 5 e 6;
    chave do elemento = 6 primeiros dígitos;
  - `m = min(12, max(1, mesReferencia))` e `mesesRestantes = 12 − m`, mais 1 se o grupo for "1" e o elemento for
    "11" ou "13";
  - o alerta exige `ritmoMensal > 0` e `cobertura < necessidade`;
  - `diasMaisAntigo` = dias inteiros entre `data_empenho` (meia-noite local) e `hoje`, mínimo 0.

- [ ] **Step 4: Run** o mesmo comando. Esperado: PASS.

- [ ] **Step 5: Commit** — `git add src/lib/financeiro/ && git commit -m "Regras do painel do Financeiro (execução, alertas de saldo e fila de pagamento)"`

### Task 2: Hook de dados

**Files:**
- Modify: `src/hooks/useFinanceiro.ts` (novo `usePainelFinanceiro`, perto de `useDashboardFinanceiro`)

**Interfaces:**
- Consumes: os tipos e funções da Task 1.
- Produces:
  ```ts
  export function usePainelFinanceiro(exercicio: number): {
    dotacoes: UseQueryResult<DotacaoPainel[]>;
    empenhos: UseQueryResult<EmpenhoPainel[]>;
    atualizacao: UseQueryResult<{ qdd: string | null; fip614: string | null }>; // created_at ISO da última importação
  }
  ```

- [ ] **Step 1: Implement** as três consultas, cada uma com `queryKey` própria (`['fin_painel_dotacoes', ano]`,
  `['fin_painel_empenhos', ano]`, `['fin_painel_atualizacao', ano]`):
  - **dotações:** `fin_dotacoes`, filtrando `exercicio = ano` e `ativo = true`. Selecione os 7 valores, `paoe`,
    `natureza_despesa:fin_naturezas_despesa(codigo, nome)` e `fonte_recurso:fin_fontes_recurso(codigo)`, e
    achate para `DotacaoPainel`;
  - **empenhos:** `fin_empenhos`, filtrando `exercicio = ano` e
    `.or('saldo_liquidar.gt.0,saldo_pagar.gt.0')`. Selecione `credor_nome`, `data_empenho`, `saldo_liquidar`,
    `saldo_pagar`, `status` e `fornecedor:fornecedores(razao_social)`. O credor é `credor_nome ?? fornecedor?.razao_social ?? null`;
  - **atualização:** `importacoes`, com `exercicio = ano` e `tipo in ('qdd_fiplan', <id do importador do FIP 614>)`,
    ordenado por `created_at desc` e limitado a 20. Pegue o mais recente de cada tipo. O id do importador do FIP 614
    está em `src/lib/importacao/importadores/empenhosFip614.ts` (`id:`).

  Os nomes de coluna de `fornecedores` vêm de `src/integrations/supabase/types.ts` (não chute).

- [ ] **Step 2: Run** `npx tsc -p tsconfig.app.json --noEmit 2>&1 | grep useFinanceiro`. Esperado: nada novo.

- [ ] **Step 3: Commit** — `git commit -am "Hook de dados do painel do Financeiro"`

### Task 3: Quadros e página

**Files:**
- Create in `src/components/financeiro/painel/`:
  - `FaixaAtualizacao.tsx`
  - `CartoesExecucao.tsx`
  - `ExecucaoPorGrupo.tsx`
  - `AlertasSaldo.tsx`
  - `FilaPagamento.tsx`
  - `MaioresDespesas.tsx`
- Modify: `src/pages/modulos/FinanceiroDashboardPage.tsx`
- Modify, se `useDashboardFinanceiro` ficar sem uso: `src/hooks/useFinanceiro.ts` (remover a função)

**Interfaces:**
- Consumes: `usePainelFinanceiro` (Task 2) e as funções da Task 1.
- Cada quadro recebe os dados já calculados e as flags `carregando` e `erro` com `onTentarNovamente`. Os quadros não
  chamam o Supabase.

- [ ] **Step 1: Implement** os quadros conforme a spec, seções 3.1 a 3.6:
  - **`FaixaAtualizacao`:** mostra o texto da spec. O aviso fica amarelo (token de alerta) quando o QDD tem mais de
    7 dias. Link para `/admin/importacoes`. O mês de referência sai de `atualizacao.qdd`; se o exercício já terminou,
    vale 12;
  - **`CartoesExecucao`:** 6 `KpiCard`, com os destinos da tabela 3.2 e `comExercicio(href)`;
  - **`ExecucaoPorGrupo`:** `ChartCard` com `BarChart` horizontal (autorizado, empenhado e pago com
    `--chart-1..3`) e a prop `tabela` com os mesmos números mais o saldo;
  - **`AlertasSaldo`:** lista com a natureza (código e nome), a fonte, a cobertura, a necessidade e quanto falta. O
    aviso "estimativa pelo ritmo do ano; não considera gastos que ainda vão começar" aparece sempre. Sem alertas,
    mostra "Nenhuma dotação com saldo abaixo do ritmo do ano.";
  - **`FilaPagamento`:** os 10 primeiros, com o total no título e o link "ver todos" para `/financeiro/empenhos`.
    Vazio: "Importe o FIP 614 para ver a fila de pagamento.";
  - **`MaioresDespesas`:** os 5 elementos com barra de % (div com largura, sem gráfico).

  Na página, mantenha `PageHeader`, `SeletorExercicio` e os atalhos rápidos. Sem dotações e sem importação de QDD
  no exercício, mostre só a faixa e um `EmptyState` ("Importe o QDD do FIPLAN para ver o painel", com ação para
  `/admin/importacoes`), sem os cartões.

- [ ] **Step 2: Run** `npx vitest run src/codigo-alcancavel.test.ts` e `npx tsc -p tsconfig.app.json --noEmit`.
  Esperado: PASS e nenhum erro novo nos arquivos tocados.

- [ ] **Step 3: Verificar na tela:** `bun run dev` com dados fictícios. Tire capturas claro, escuro e celular
  (390 px) e salve em `/mnt/project-files/financeiro/painel/`. Confira o estado vazio num exercício sem dados
  (por exemplo, 2030).

- [ ] **Step 4: Commit** — `git add src/components/financeiro/painel src/pages/modulos/FinanceiroDashboardPage.tsx src/hooks/useFinanceiro.ts && git commit -m "Painel do Financeiro com execução, alertas de saldo e fila de pagamento"`

### Task 4: Documentação, gate e PR

**Files:**
- Modify: a doc dona do assunto, apontada por `node scripts/check-docs-matriz.mjs --base origin/main`
- Modify: `docs/planejamento/ROADMAP.md`
- Modify: `docs/ESTADO_DO_SISTEMA.md` (só via `npm run estado`)

- [ ] **Step 1:** atualize a doc da matriz (o que o painel mostra, de onde vem e como se atualiza: QDD e FIP 614
  toda semana) e o ROADMAP. Rode `npm run estado`.
- [ ] **Step 2: Run** `node scripts/check-docs-matriz.mjs --base origin/main`. Esperado: sem pendência.
- [ ] **Step 3: Run** `bash scripts/gate.sh`. Esperado: verde (resultado lido, não presumido).
- [ ] **Step 4:** faça o merge da `origin/main` mais recente, confira os conflitos, dê push em
  `claude/project-thread-621pzz` e abra a PR em rascunho com as capturas.
