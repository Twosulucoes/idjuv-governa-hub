# Passagens aéreas, entrega 3 (faturas, passagens pagas, saldo × empenho e relatórios): plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** registrar as notas fiscais da agência e os bilhetes que cada uma cobre, acompanhar a nota até paga (com a
OB), mostrar o saldo do contrato (emitido, faturado, pago) e quanto o empenho do exercício ainda cobre, listar os
bilhetes "a faturar" e tirar os relatórios (planilha e PDF).

**Architecture:**
- Uma migração cria `passagem_faturas` e `passagem_fatura_itens`, com RLS pelo `mapa.csv`.
- A mesma migração cria a ligação contrato × empenhos (`passagem_contrato_empenhos`) e a permissão nova
  `contratos.passagens.financeiro`.
- O Financeiro (`fin_empenhos`) continua fora do alcance de quem tem passagens. O saldo do empenho chega por uma RPC
  estreita (SECURITY DEFINER) que devolve só os totais dos empenhos ligados ao contrato.
- Regras de conferência e saldo ficam em `src/lib/passagens/faturas.ts` (vitest).
- PDFs pelo motor `src/lib/documentos/`; planilhas por `src/export/`.

**Tech Stack:** Postgres/Supabase (RLS, gatilhos, RPC), React 18 + shadcn/ui, React Query, vitest, motor de documentos.

**Spec:** [`docs/superpowers/specs/2026-10-24-contratos-passagens-aereas-design.md`](../specs/2026-10-24-contratos-passagens-aereas-design.md),
§5 (financeiro do contrato) e §7, itens 4 (contrato e faturas) e 6 (relatórios).

## Premissas (assumidas; ajustáveis)

1. **Nova permissão `contratos.passagens.financeiro`.** Serve para lançar e andar com as faturas, ligar empenhos e
   marcar paga. Ela é dada pela migração a quem já tem `contratos.criar`, como foi na entrega 1. Quem tem só
   `visualizar` vê as faturas e o saldo, mas não altera.
2. **Fatura = nota fiscal da agência.**
   - Campos: nº, data de emissão, valor, nº do processo SEI de pagamento e observação.
   - Cobre um ou mais bilhetes (trechos emitidos). Cada trecho entra em uma fatura só.
   - O valor de cada item vem do bilhete (emissão + multa − reembolso) e pode ser ajustado.
   - Se a soma dos itens não bater com o valor da nota, o sistema mostra a diferença, mas aceita gravar.
3. **Situação da fatura:** recebida → atestada (data e nº SEI do atesto do fiscal) → liquidada (data) → paga (data e
   nº da OB). Também pode ser cancelada, com motivo. O FIPLAN continua sendo o oficial; a fatura só registra o que
   cobre. Bilhete numa fatura paga aparece como **pago** na ficha do pedido.
4. **A faturar:** bilhete emitido e não cancelado sem fatura. Depois de 30 dias da emissão, ganha o destaque
   "atrasado".
5. **Empenhos do contrato.** O importador do FIP 614 não sabe qual empenho é da agência, então o financeiro liga os
   empenhos ao contrato numa lista. Os candidatos são os empenhos do elemento 33 (passagens e locomoção), mais os que
   já têm o `contrato_id`. O saldo por exercício é: empenhado − anulado, comparado com o emitido no exercício (pela
   data de emissão), com o liquidado e pago do FIPLAN ao lado.
6. **Relatórios:**
   - Planilhas: passagens por período (com passageiro, pedido, evento, instituição, trecho, valores e fatura) e faturas.
   - PDFs pelo motor: **ficha do pedido**, para juntar no SEI quando quiser, e **saldo do contrato**.
   - "Por beneficiário" e "por instituição" saem da mesma planilha, com filtro.

## Global Constraints

- As mesmas das entregas 1 e 2: português; RLS e policies na mesma migração (`gerar-rls.mjs`); função nova com
  `search_path` fixo e EXECUTE só para quem precisa; `types.ts` só por `gerar-tipos.sh`; gate verde; docs da matriz e
  ROADMAP; nada de ato do SEI.
- Permissão nova: catálogo (`02_dados_catalogo.sql`) e concessões copiadas da regeneração; módulo `contratos`.
- Quem tem passagens não lê `fin_empenhos`. A RPC devolve só número, exercício e totais dos empenhos **ligados** (ou
  candidatos, para quem tem `financeiro`).

## Review Focus

1. Só `contratos.passagens.financeiro` grava fatura, item, situação e ligação de empenho. `visualizar` lê;
   `editar` (sem `financeiro`) não grava fatura.
2. Um trecho em duas faturas, ou trecho não emitido numa fatura: o banco recusa.
3. Fatura paga não muda de itens nem de valor. Só volta atrás quem tem `financeiro`, e fica na trilha.
4. A RPC de empenhos não abre o Financeiro: só totais dos empenhos do contrato, e só para quem tem a permissão.
5. O saldo bate: emitido (entrega 1) = faturado + a faturar; pago ≤ faturado.

---

### Task 1: Migração, RLS, catálogo, baseline e tipos (agente `dev-banco-supabase`)

**Files:**
- `supabase/migrations/20261102090000_contratos_passagens_faturas.sql` (novo).
- `supabase/baseline/rls/mapa.csv` e `rls/35_policies_geradas.sql` (gerado).
- `overlay/40_privilegios.sql`.
- `schema/*`, regenerados; em `02_dados_catalogo.sql` só as linhas da permissão e das concessões.
- `supabase/baseline/README.md` e `scripts/db/testar-rls.sql`.
- `src/integrations/supabase/types.ts` (gerado).

**Tabelas:**
- `passagem_faturas`:
  - Colunas: `id`, `contrato_id` (FK contratos), `numero` (único por contrato), `data_emissao`, `valor > 0`,
    `processo_sei_pagamento`, `situacao` (recebida, atestada, liquidada, paga, cancelada).
  - Datas e documentos de cada passo: `atesto_data`, `atesto_documento_sei`, `liquidacao_data`, `pagamento_data` e
    `ob_numero`; mais `cancelamento_motivo`, `observacoes` e os carimbos.
  - CHECKs por situação: atestada pede o atesto; paga pede data e OB; cancelada pede motivo.
- `passagem_fatura_itens`: `id`, `fatura_id` (FK CASCADE), `trecho_id` (FK, **UNIQUE**), `valor >= 0`. Um gatilho
  recusa trecho sem localizador e mudança de item em fatura paga.
- `passagem_contrato_empenhos`: `contrato_id` e `empenho_id` (PK composta) e os carimbos.
- Trilha: `passagem_historico` ganha `fatura_situacao`, gravado num pedido para cada pedido coberto pela fatura.
- Mapa: as três tabelas na classe `permissao`, com `escrita=contratos.passagens.financeiro`,
  `excluir=contratos.passagens.financeiro` e `leitura=visualizar|editar|financeiro`. Fatura paga não se apaga
  (gatilho).

**Funções:**
- `passagem_empenhos_contrato(_contrato_id)`: devolve, por empenho ligado, nº, exercício, empenhado, anulado,
  liquidado e pago. É SECURITY DEFINER e exige o módulo e uma das permissões de passagens.
- `passagem_empenhos_candidatos(_contrato_id, _exercicio)`: devolve os empenhos do elemento 33 ou já ligados, com nº,
  credor, valor e se está ligado. Só para quem tem `financeiro`.

- [ ] Migração, `gerar-rls.mjs`, catálogo, casos em `testar-rls.sql` (cada permissão, trecho repetido, fatura paga
  travada, RPCs).
- [ ] `validar-migracoes.sh`, `gerar-baseline.sh`, `validar-baseline.sh` e `gerar-tipos.sh`.

### Task 2: Regras puras (TDD, `src/lib/passagens/faturas.ts`)

- `conferirFatura(valorNota, itens)`: devolve a soma e a diferença.
- `aFaturar(trechos, faturados, hoje)`: devolve a lista e marca o que passa de 30 dias.
- `saldoContratoCompleto(...)`: valor, emitido, faturado, pago, a faturar e saldo.
- `saldoEmpenhoPorExercicio(empenhos, trechos)`: empenhado líquido × emitido no exercício.
- `proximasSituacoesFatura`.

### Task 3: Hooks (`src/hooks/usePassagensFaturas.ts`)

- Faturas do contrato, com itens e o pedido e o passageiro de cada trecho.
- Salvar fatura com itens, mudar situação, cancelar.
- Empenhos ligados e candidatos; ligar e desligar empenho.
- Dados das planilhas.

### Task 4: Telas

- **Contratos → Passagens: faturas e saldo** (`/contratos/passagens/faturas`):
  - Cartões: contrato, emitido, faturado, pago, a faturar e saldo.
  - Quadro por exercício: empenhado × emitido × liquidado × pago.
  - Abas:
    - **Faturas:** lista e ficha com os bilhetes.
    - **A faturar.**
    - **Empenhos:** ligar e desligar, só com `financeiro`.
  - **Nova fatura:** escolhe os bilhetes a faturar e mostra a conferência com a nota.
- **Ficha do pedido:** coluna "Fatura / pago" em cada trecho emitido.
- **Lista de pedidos:** os cartões do alto passam a mostrar também faturado e pago.
- **Relatórios:** botões "Planilha de passagens" (período e filtros) e "Planilha de faturas"; PDFs "Ficha do pedido"
  (na ficha) e "Saldo do contrato" (na tela de faturas).
- Telas para celular (390px) e desktop.

### Task 5: Rotas e menu

- `src/App.tsx`: rota `/contratos/passagens/faturas`, com a mesma proteção das outras rotas de passagens.
- Menu "Faturas de passagens" em `module-menus.config.ts` e `menu.config.ts`.

### Task 6: Docs

- `BANCO_DE_DADOS`, `RBAC_PERMISSOES`, `GUIA_FRONTEND`, `ARQUITETURA`, `MODULOS`, `NOVO_BANCO` e `PADRAO_DOCUMENTOS` (os
  dois modelos novos).
- `supabase/baseline/README.md` e `ROADMAP`.
- `npm run estado` e `check-docs-matriz`.

### Task 7: Revisão e verificação

- [ ] `revisor-codigo-idjuv` e `revisor-seguranca-idjuv` sem bloqueantes.
- [ ] `bash scripts/gate.sh` verde.
- [ ] Prints (390px, desktop e escuro) e amostras dos PDFs e planilhas em `/mnt/project-files/passagens/entrega3/`, com
  o passo a passo.
