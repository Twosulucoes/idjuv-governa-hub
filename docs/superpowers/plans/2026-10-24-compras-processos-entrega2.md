# Processos de contratação, entrega 2 (reservas, PEDs do FIPLAN e fase financeira): plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compras reserva, em cada processo, um valor por ação × fonte × natureza e vê o saldo livre na hora; o
Financeiro importa o relatório de PEDs do FIPLAN; o sistema liga cada PED e cada empenho ao processo pelo número e
mostra a fase financeira (PED autorizado, empenhado, liquidado, pago) na lista e na ficha; a tela "Programação por
natureza" responde "já tem programação para esta natureza?"; o painel do Financeiro mostra o reservado em processos.

**Architecture:** tabela `fin_peds` (espelho do relatório, escrita só por RPC) e tabela `processo_reservas` (escrita só
por RPC); função `processo_chave_fiplan` que reduz o nº SEI, o nº do FIPLAN e o do FIP 614 à mesma chave; funções de
leitura DEFINER que devolvem aos usuários de Compras só os números que a tela usa (as tabelas do Financeiro e a RLS
delas não mudam); a regra da fase financeira e do saldo fica em funções puras de `src/lib/compras/` com vitest.

**Tech Stack:** Postgres/Supabase (RLS, RPC), React 18 + shadcn/ui + react-hook-form/zod, React Query, SheetJS, vitest.

**Spec:** [`docs/superpowers/specs/2026-10-23-compras-processos-reserva-natureza-design.md`](../specs/2026-10-23-compras-processos-reserva-natureza-design.md)
(§3 a §5 com a revisão do §10, de 24/10/2026). A entrega 1 (PR #173) já criou o processo, o andamento e a carga.

## Global Constraints

- Português em nomes, comentários e rótulos; páginas `*Page.tsx`; hooks `use<Dominio>`; imports `@/`.
- Tabela nova com RLS na mesma migração. `fin_peds` e `processo_reservas` entram no `mapa.csv` como `preservar`, com
  policy de SELECT própria na migração e **nenhuma** policy de escrita (grava só a RPC DEFINER), como
  `fin_empenho_documentos_fiplan`. Função nova: `SET search_path = public`, `REVOKE ALL ... FROM PUBLIC, anon`,
  `GRANT EXECUTE ... TO authenticated` só nas que a tela chama.
- **Nenhuma RLS existente muda** (nem `fin_empenhos`, nem `fin_dotacoes`, nem `processos_licitatorios`). Sem
  permissão nova: importar PED exige `orcamento.importar` no módulo `financeiro` (como o FIP 614); gravar reserva
  exige `compras.processos.editar` no módulo `compras`; ler exige `compras.processos.visualizar|editar` no módulo
  `compras` **ou** acesso ao módulo `financeiro`.
- Nada apaga pela API: reserva sai por `situacao = 'cancelada'` com motivo; PED que some do relatório só gera aviso.
- `processo_chave_fiplan(text)`: `IMMUTABLE`, `NULL` quando não reconhece o formato; casamento só pela chave, sem
  adivinhação.
- Migração `supabase/migrations/20261030090000_compras_processos_reservas_peds.sql` (conferir antes da PR que nenhuma
  outra thread usou o prefixo). Idempotente, `SET lock_timeout = '10s'`, segura para rodar sozinha no merge.
- Não editar `src/integrations/supabase/client.ts`; `types.ts` sai de `bash scripts/db/gerar-tipos.sh`.
- O relatório real (tem nomes de credores e de servidores nas diárias) não entra no repositório nem nos testes.
- `bash scripts/gate.sh` verde; docs da matriz + `docs/planejamento/ROADMAP.md` na mesma PR.

## Review Focus

1. Chave: `17302.000885/2026.92`, `17302.000885/2026-92`, `000885/26-92` e `00000885/26-92` dão `885/26-92`;
   `17101.011845/2025.51` dá `11845/25-51`; texto fora do padrão dá `NULL` (não liga nada).
2. PED com estorno parcial aparece em duas linhas com o mesmo nº de PED e estornos diferentes: a chave de `fin_peds`
   inclui o PED de estorno; o "PED autorizado" só soma a situação "Pedido (PED) autorizado", uma vez por PED.
3. Saldo livre não conta duas vezes (o "PED" do QDD já inclui empenhado e reserva; `fin_dotacao_disponivel`): a parte da reserva que já virou PED autorizado ou empenho sai do pendente (o QDD
   já a desconta); a própria linha fica fora ao salvar.
4. Saldo insuficiente: a RPC recusa sem justificativa (≥ 10 caracteres) e grava a justificativa e o saldo do momento.
5. Usuário só de Compras (sem Financeiro) vê a fase e os valores do processo, mas não lê `fin_peds` nem `fin_empenhos`
   direto; usuário só de Financeiro vê a programação por natureza e o cartão do painel, sem gravar reserva.

---

### Task 1: Migração, RLS, baseline e tipos (agente `dev-banco-supabase`)

**Files:**
- Create: `supabase/migrations/20261030090000_compras_processos_reservas_peds.sql`
- Modify: `supabase/baseline/rls/mapa.csv`, `supabase/baseline/overlay/40_privilegios.sql`,
  `supabase/baseline/schema/*.sql` (regenerados), `scripts/db/testar-rls.sql`, `src/integrations/supabase/types.ts` (gerado)

**Interfaces (produz):**
- `processo_chave_fiplan(p text) RETURNS text IMMUTABLE`: casa `(\d+)/(\d{2}|\d{4})[.-](\d{2})\s*$`, devolve
  `ltrim(numero,'0') || '/' || right(ano,2) || '-' || digito`.
- `fin_peds(id, exercicio int NOT NULL, numero text NOT NULL CHECK formato do PED, numero_estorno text, empenho_numero
  text, processo_fiplan text, processo_chave text GENERATED (processo_chave_fiplan(processo_fiplan)) STORED, valor
  numeric(15,2) NOT NULL, situacao text NOT NULL, estorno boolean NOT NULL, data_solicitacao date, data_criacao date,
  data_autorizacao date, tipo_empenho text, dotacao_fiplan text, dotacao_id uuid FK fin_dotacoes, licitacao text,
  historico text, credor_codigo text, credor_nome text, importacao_id uuid FK importacoes, created_at, updated_at)`;
  `UNIQUE NULLS NOT DISTINCT (exercicio, numero, numero_estorno)`; índices em `(exercicio, processo_chave)` e
  `dotacao_id`. Policy SELECT: `perfil_ativo_atual() AND can_access_module(auth.uid(),'financeiro')`.
- `fin_dotacao_do_fiplan(p_exercicio int, p_dotacao text) RETURNS uuid`: mesma regra do FIP 614 (dígitos de função a
  fonte contra `codigo_dotacao`, desempate pelo IDU); `NULL` se nenhuma ou mais de uma. Interna (sem EXECUTE para a API).
- `importar_peds_fiplan(p_exercicio int, p_linhas jsonb, p_arquivo jsonb, p_simular boolean DEFAULT true) RETURNS
  jsonb`: confere `financeiro` + `orcamento.importar`; trava por exercício; insere ou atualiza pela chave; devolve
  `{ linhas: [{indice, acao, mudancas, avisos}], erros, ausentes, simulacao }`; simulação levanta SQLSTATE próprio
  (`PED01`) para desfazer; aplicação registra em `importacoes` (tipo `peds_fiplan`, módulo `financeiro`).
- `processo_reservas(id, processo_id FK processos_licitatorios NOT NULL, exercicio int NOT NULL, acao_id FK
  fin_acoes_orcamentarias NOT NULL, fonte_recurso_id FK fin_fontes_recurso NOT NULL, natureza_despesa_id FK
  fin_naturezas_despesa NOT NULL, pca_item_id FK pca_itens, valor numeric(15,2) NOT NULL CHECK > 0, situacao text
  NOT NULL DEFAULT 'reservada' CHECK IN ('reservada','cancelada'), justificativa_saldo text, saldo_livre_no_momento
  numeric(15,2), motivo_cancelamento text, created_at, created_by, updated_at, updated_by)`; índice único parcial
  `(processo_id, exercicio, acao_id, fonte_recurso_id, natureza_despesa_id) WHERE situacao = 'reservada'`. Policy
  SELECT: (`compras` E `compras.processos.visualizar|editar`) OU `financeiro`.
- `processo_saldo_livre(p_exercicio, p_acao, p_fonte, p_natureza, p_ignorar_reserva uuid DEFAULT NULL) RETURNS
  numeric` (fórmula do §10; `NULL` quando não há dotação no QDD).
- `processo_reserva_salvar(p_id uuid, p_processo_id, p_exercicio, p_acao, p_fonte, p_natureza, p_valor,
  p_pca_item_id, p_justificativa) RETURNS jsonb` e `processo_reserva_cancelar(p_id uuid, p_motivo text)`: DEFINER,
  `compras` + `compras.processos.editar`; salvar recusa natureza sem dotação no QDD salvo com justificativa ("sem QDD
  para comparar"), recusa saldo insuficiente sem justificativa, devolve `{id, saldo_livre, faltou}`.
- Leitura (DEFINER, ler = regra da policy de `processo_reservas`):
  - `processo_reservas_detalhe(_processo_id uuid)`: cada linha com códigos/nomes de ação, fonte e natureza, valor,
    materializado, pendente, saldo livre.
  - `processo_peds(_processo_id uuid)`: PEDs do processo (nº, empenho, valor, situação, datas, natureza, fonte; sem credor).
  - `processos_financeiro(_exercicio int DEFAULT NULL)`: por processo, `reservado`, `pendente`, `ped_autorizado`,
    `empenhado`, `liquidado`, `pago`.
  - `programacao_por_natureza(_exercicio int)`: por ação × fonte × natureza do QDD, dotação atual, empenhado, PED +
    reserva do FIPLAN, pendente em processos, saldo livre e `processos jsonb` (`id`, nº SEI, objeto resumido, pendente).
- `processo_empenhos` passa a casar por `processo_chave_fiplan(processo_sei)` (ou `processo_fiplan`) =
  `processo_chave_fiplan(numero_processo)`, no lugar do `btrim` exato. Mesma assinatura.

- [ ] **Step 1:** escrever a migração (seções numeradas e comentadas, como a da entrega 1).
- [ ] **Step 2:** `mapa.csv` (duas linhas `preservar` com nota), privilégios no overlay, `testar-rls.sql` com bloco
  "Compras: reservas e PEDs" (usuário só Compras não lê `fin_peds`; não grava reserva direto na tabela; RPC recusa
  sem permissão e sem justificativa; saldo livre com PED autorizado e com empenho; chave nos quatro formatos).
- [ ] **Step 3:** validar no Postgres local: `validar-migracoes.sh`, `gerar-baseline.sh`, `validar-baseline.sh`,
  `testar-rls.sh` (0 falhas); `gerar-tipos.sh`.
- [ ] **Step 4:** commit.

### Task 2: Importador "PEDs do FIPLAN" (agente `dev-frontend-idjuv`)

**Files:**
- Create: `src/lib/importacao/importadores/pedsFiplanParser.ts`, `pedsFiplanParser.test.ts`, `pedsFiplan.ts`
- Modify: `src/lib/importacao/registro.ts`

- [ ] **Step 1 (teste primeiro):** `interpretarPedsFiplan(linhas: unknown[][])` acha o cabeçalho pela célula
  "Nº PED", lê o exercício dos critérios ("Exercício igual a 2026"), converte valor "4.251.000,00" e datas
  "dd/mm/aaaa", marca `estorno` quando a situação é "Documento de Estorno", acusa linha sem nº de PED ou com valor
  inválido. Casos fictícios: PED autorizado, empenhado, estorno total, estorno parcial (mesmo PED em duas linhas),
  diária.
- [ ] **Step 2:** importador `peds_fiplan` (módulo `financeiro`, permissão `orcamento.importar`, aceita `.xls,.xlsx`),
  instruções de como gerar o relatório no FIPLAN, colunas da prévia (PED, processo, situação, valor), chama a RPC.
- [ ] **Step 3:** registrar; vitest de `src/lib/importacao` verde; commit.

### Task 3: Regras puras de fase e saldo (agente `dev-frontend-idjuv`)

**Files:** Create `src/lib/compras/faseFinanceira.ts`, `src/lib/compras/faseFinanceira.test.ts`

- [ ] **Step 1 (teste primeiro):** `faseFinanceira({reservado, pendente, ped_autorizado, empenhado, liquidado, pago})`
  devolve `{ codigo, rotulo, tom }` na ordem do §10 (Pago, Pago em parte, Liquidado, Empenhado, PED autorizado,
  Reservado, Sem movimento financeiro); `faltaNoSaldo(valor, saldoLivre)`.
- [ ] **Step 2:** implementar; commit.

### Task 4: Telas de Compras (agente `dev-frontend-idjuv`)

**Files:**
- Modify: `src/hooks/useProcessosContratacao.ts` (hooks `useReservasDoProcesso`, `useSalvarReserva`,
  `useCancelarReserva`, `useSaldoLivre`, `usePedsDoProcesso`, `useFinanceiroDosProcessos`, `useProgramacaoPorNatureza`),
  `src/pages/compras/ProcessosListaPage.tsx` (colunas "Fase financeira" e "Reservado", filtro de fase),
  `src/pages/compras/ProcessoFichaPage.tsx` (abas Reservas e Financeiro), `src/App.tsx` (rota
  `/compras/processos/programacao`, `requiredModule="compras"`, permissões de visualizar/editar),
  `src/config/menu.config.ts`, `src/config/module-menus.config.ts` ("Programação por natureza")
- Create: `src/components/compras/processos/ProcessoReservasTab.tsx`, `ReservaFormDialog.tsx` (ação, fonte e
  natureza só das dotações do QDD do exercício; saldo livre ao vivo; aviso e justificativa quando falta; "Puxar do
  PCA" lista os itens do PCA do mesmo nº SEI agrupados por natureza), `ProcessoFinanceiroTab.tsx` (fase, quatro
  valores, PEDs e empenhos; substitui `ProcessoEmpenhosTab`), `src/pages/compras/ProgramacaoNaturezaPage.tsx`

- [ ] **Step 1:** hooks (React Query, chaves novas invalidadas ao salvar/cancelar reserva).
- [ ] **Step 2:** aba Reservas e diálogo; aba Financeiro; lista.
- [ ] **Step 3:** página Programação por natureza (filtro de exercício, busca por natureza, linha expande com os
  processos que reservaram; destaque para saldo livre negativo).
- [ ] **Step 4:** rota e menus; `codigo-alcancavel` e teste de módulos verdes; commit.

### Task 5: Painel do Financeiro (agente `dev-frontend-idjuv`)

**Files:** Modify `src/pages/modulos/FinanceiroDashboardPage.tsx`, `src/hooks/` do painel, `src/lib/financeiro/painelExecucao.ts` (+ teste)

- [ ] **Step 1:** cartão "Reservado em processos" (soma do pendente do exercício, link para a programação).
- [ ] **Step 2:** `alertasDeSaldo` aceita o pendente por natureza × fonte e desconta da cobertura (teste novo).
- [ ] **Step 3:** commit.

### Task 6: Verificação, revisão e docs

- [ ] **Step 1:** telas no navegador com dados simulados (desktop, 390px, escuro); prints em
  `/mnt/project-files/processos/entrega2/`.
- [ ] **Step 2:** revisão `revisor-codigo-idjuv` e `revisor-seguranca-idjuv` (funções DEFINER, credor fora das
  leituras de Compras); corrigir bloqueantes.
- [ ] **Step 3:** docs da matriz (`BANCO_DE_DADOS.md`, `RBAC_PERMISSOES.md`, `GUIA_FRONTEND.md`, `ARQUITETURA.md`,
  `NOVO_BANCO.md`, `supabase/baseline/README.md`), `ROADMAP.md`, `npm run estado`; `check-docs-matriz` OK.
- [ ] **Step 4:** `bash scripts/gate.sh` verde; merge da `main`; push; PR rascunho.

## Depois do merge (usuário)

1. Aprovar a migração no ambiente `producao`.
2. Importar, nesta ordem: QDD do exercício, FIP 614 (Excel), "Consultar PED" (Excel).
3. Lançar as reservas dos processos abertos (ou puxar do PCA) e conferir a Programação por natureza.
