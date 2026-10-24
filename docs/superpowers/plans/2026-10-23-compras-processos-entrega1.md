# Processos de contratação, entrega 1 (processo, andamento e carga): plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compras vê e mantém, em `/compras/processos`, cada processo de contratação com etapa, setor, situação e
linha do tempo do andamento no SEI, vê os empenhos do FIP 614 ligados pelo nº SEI, e carrega os 11 processos de 2026
da planilha organizada pela Central de Importações.

**Architecture:** reaproveita `processos_licitatorios` (já referenciada por contratos, atas e solicitações) com
colunas novas; tabela nova `processo_andamentos` com gatilho que copia a última movimentação para o processo; RPC
`importar_processos_planilha` no padrão de `importar_portarias_planilha`; front com hook React Query e leitura pura da
planilha em `src/lib/importacao/importadores/`.

**Tech Stack:** Postgres/Supabase (RLS, gatilhos, RPC), React 18 + shadcn/ui + react-hook-form/zod, React Query,
SheetJS (já no projeto), vitest.

**Spec:** [`docs/superpowers/specs/2026-10-23-compras-processos-reserva-natureza-design.md`](../specs/2026-10-23-compras-processos-reserva-natureza-design.md)
(§4 colunas do processo e `processo_andamentos`, §5 telas 1 e 2 sem a aba Reservas, §6 carga). Reservas, saldo livre,
PED, "Puxar do PCA", programação por natureza e painel do Financeiro ficam para a entrega 2.

## Global Constraints

- Português em nomes, comentários e rótulos; páginas `*Page.tsx`; hooks `use<Dominio>`; imports `@/`.
- Tabela nova com RLS na mesma migração; policies geradas por `node scripts/db/gerar-rls.mjs` a partir de
  `supabase/baseline/rls/mapa.csv`. Função nova: `SET search_path = public`, `REVOKE ... FROM PUBLIC, anon`,
  `GRANT` só para `authenticated` quando a API chama.
- Permissões novas: `compras.processos.visualizar` e `compras.processos.editar` (módulo `compras`), concedidas a quem
  já tem `compras.criar` (papéis, `user_permissions`, `user_modules.permissions`), como na migração do PCA.
- As policies atuais de `processos_licitatorios` (`comp_module_*`) **não mudam** nesta entrega; a escrita das colunas
  novas pela tela passa por elas. (Apertar para `compras.processos.editar` é mudança de RLS existente: só com "sim"
  separado, fora deste plano.)
- Nada apaga pela API: processo sai por `etapa = 'cancelado'`; movimentação errada se corrige com outra.
- Nº SEI sem espaços nas pontas (`btrim`) antes de gravar e de comparar com `fin_empenhos.processo_sei`.
- Migração `supabase/migrations/20261029090000_compras_processos_andamento.sql` (conferir antes da PR que nenhuma
  outra thread usou o mesmo prefixo). Idempotente, `SET lock_timeout = '10s'`, segura para rodar sozinha no merge.
- Não editar `src/integrations/supabase/client.ts`; `types.ts` sai de `bash scripts/db/gerar-tipos.sh`.
- A planilha real não entra no repositório nem nos testes (testes usam dados fictícios no mesmo formato).
- `bash scripts/gate.sh` verde; docs da matriz + `docs/planejamento/ROADMAP.md` na mesma PR.

## Review Focus

1. Processo com movimentação sem data: a carga usa a data da importação e marca "data não informada"; a lista mostra
   "dias parado" vazio, não zero.
2. Reimportar a mesma planilha não duplica processo (chave nº SEI) nem movimentação (chave nº SEI + data + etapa +
   setor + situação).
3. `modalidade` vazia ("a definir") não quebra o painel de Compras nem a lista.
4. Empenhos ligados: `processo_sei` do FIP 614 com espaço ou sem o dígito final ainda casa? (só `btrim`; casamento
   exato depois disso — sem adivinhação).
5. Usuário só com `compras.processos.visualizar`: vê tudo, sem botões de gravar; a RPC de importação recusa.

---

### Task 1: Migração, RLS, baseline e tipos (agente `dev-banco-supabase`)

**Files:**
- Create: `supabase/migrations/20261029090000_compras_processos_andamento.sql`
- Modify: `supabase/baseline/rls/mapa.csv`, `supabase/baseline/rls/35_policies_geradas.sql` (gerado),
  `supabase/baseline/overlay/40_privilegios.sql`, `supabase/baseline/schema/*.sql` (regenerados),
  `scripts/db/testar-rls.sql`, `src/integrations/supabase/types.ts` (gerado)

**Interfaces (produz):**
- `ALTER TYPE modalidade_licitacao ADD VALUE IF NOT EXISTS 'adesao_ata'`; `processos_licitatorios.modalidade DROP NOT NULL`.
- Colunas novas em `processos_licitatorios`: `etapa text NOT NULL DEFAULT 'abertura' CHECK IN ('abertura','dfd','etp',
  'tr','cotacao','levantamento_tecnico','instrucao_adesao','analise_juridica','selecao','contrato','execucao',
  'encerrado','cancelado')`, `setor_atual text`, `situacao_atual text`, `atualizado_em date`, `valor_estimado_obs text`.
  Gatilho `BEFORE INSERT OR UPDATE` faz `numero_processo := btrim(numero_processo)`.
- `processo_andamentos(id uuid PK, processo_id uuid FK processos_licitatorios ON DELETE CASCADE NOT NULL, data date
  NOT NULL, data_informada boolean NOT NULL DEFAULT true, etapa text NOT NULL (mesmo CHECK), setor text, situacao text
  NOT NULL, created_at, created_by DEFAULT auth.uid())`, índice `(processo_id, data DESC, created_at DESC)`, `UNIQUE
  NULLS NOT DISTINCT (processo_id, data, etapa, setor, situacao)`.
- Gatilho `processo_andamento_atualizar_processo()` (SECURITY DEFINER, search_path fixo, sem EXECUTE para a API),
  `AFTER INSERT` em `processo_andamentos`: se a movimentação é a mais recente do processo, copia etapa, setor,
  situação e data (esta só se `data_informada`) para o processo.
- Visão `vw_processos_empenhos` (`security_invoker = true`): `processo_id`, `empenho_id`, número, data, natureza,
  fonte, valor empenhado, anulado, liquidado, pago — junção `btrim(fin_empenhos.processo_sei) = processos_licitatorios.numero_processo`.
- RPC `importar_processos_planilha(p_linhas jsonb, p_arquivo jsonb, p_simular boolean DEFAULT true) RETURNS jsonb`:
  confere `can_access_module(auth.uid(),'compras')` e `compras.processos.editar`; para cada processo insere ou
  atualiza (só preenche campo vazio, nunca apaga) e insere as movimentações que faltam (`ON CONFLICT DO NOTHING`);
  devolve `{ linhas: [{ indice, acao, mudancas }], erros, simulacao }` como a de portarias; com `p_simular` não grava;
  aplicação é tudo ou nada e registra em `importacoes` (tipo `processos_planilha`).
- Permissões no `module_permissions_catalog` (`compras`, categoria `Processos`) e concessão a quem tem `compras.criar`.
- `mapa.csv`: `processo_andamentos,compras,permissao,alta,"...",escrita=compras.processos.editar;excluir=ninguem;leitura=compras.processos.visualizar|compras.processos.editar,,`

- [ ] **Step 1:** testes no bloco novo "Compras: processos" de `scripts/db/testar-rls.sql`: sem as permissões não lê
  `processo_andamentos`; com `visualizar` lê e não insere; com `editar` insere; ninguém apaga; inserir movimentação
  mais nova muda `etapa`/`setor_atual` do processo e uma mais antiga não; `numero_processo` com espaço é gravado sem;
  RPC sem `editar` falha com `42501`; RPC simulada não grava nada.
- [ ] **Step 2:** `bash scripts/db/validar-baseline.sh` — esperado: FALHA.
- [ ] **Step 3:** escrever a migração, editar `mapa.csv`, gerar RLS e copiar o bloco para a migração.
- [ ] **Step 4:** `bash scripts/db/validar-migracoes.sh`, `PG_DB=idjuv_validacao bash scripts/db/gerar-baseline.sh`,
  overlay 40, `PG_REPLAY=idjuv_validacao bash scripts/db/validar-baseline.sh` — esperado: APROVADO, RLS sem falhas.
- [ ] **Step 5:** `bash scripts/db/gerar-tipos.sh`; conferir que só entrou o que é desta migração.
- [ ] **Step 6:** commit "Compras: processos de contratação com andamento (migração e RLS)".

### Task 2: Leitura da planilha e importador (agente `dev-frontend-idjuv`)

**Files:**
- Create: `src/lib/importacao/importadores/processosPlanilhaParser.ts`, `processosPlanilhaParser.test.ts`,
  `processosPlanilha.ts`
- Modify: `src/lib/importacao/planilha.ts` (exporta `lerAbas(arquivo): Promise<Record<string, unknown[][]>>`),
  `src/lib/importacao/registro.ts`

**Interfaces (produz):**
- `interpretarProcessosPlanilha(abas: Record<string, unknown[][]>): ResultadoLeitura<LinhaProcessoPlanilha>`; acha o
  cabeçalho procurando a linha com "Nº do processo SEI" (não fixa a linha 4); aba "Andamento" opcional.
- `LinhaProcessoPlanilha = { numero_processo, ano, objeto, objeto_resumido, modalidade | null, etapa, setor_atual,
  situacao_atual, atualizado_em | null, valor_estimado | null, valor_estimado_obs, andamentos: { data | null, etapa,
  setor, situacao }[] }`.
- Tradução de fase (rótulos da aba "Listas" → `etapa`) e de forma ("Adesão à ata..." → `adesao_ata`,
  "Inexigibilidade" e "Contratação direta (fornecedor exclusivo)" → `inexigibilidade`, "A definir..." e "Contratado
  (...)" → `null` com aviso). Rótulo desconhecido → erro da linha, não chute.
- `importadorProcessosPlanilha: Importador<LinhaProcessoPlanilha>` (id `processos_planilha`, módulo `compras`,
  permissão `compras.processos.editar`, aceita `.xlsx,.xls`, modelo baixável com as abas "Processos" e "Andamento").

- [ ] **Step 1:** testes com planilha fictícia no formato da organizada: nº SEI com espaço → sem espaço; valor
  "34000000" → 34000000 e vazio → null; data vazia → null e aviso; processo de 2025 aceito; fase desconhecida → erro;
  andamentos agrupados no processo certo; linha "Total" ignorada.
- [ ] **Step 2:** `npx vitest run src/lib/importacao` — FALHA.
- [ ] **Step 3:** implementar parser, `lerAbas` e importador (envia à RPC da Task 1).
- [ ] **Step 4:** vitest PASSA. Commit "Compras: importador da planilha de processos".

### Task 3: Hook e telas (agente `dev-frontend-idjuv`)

**Files:**
- Create: `src/hooks/useProcessosContratacao.ts`, `src/types/processos.ts` (rótulos de etapa e modalidade),
  `src/pages/compras/ProcessosListaPage.tsx`, `src/pages/compras/ProcessoFichaPage.tsx`,
  `src/components/compras/processos/ProcessoFormDialog.tsx`, `ProcessoAndamentoTab.tsx`,
  `NovaMovimentacaoDialog.tsx`, `ProcessoEmpenhosTab.tsx`
- Modify: `src/App.tsx` (rotas no bloco de Compras), `src/config/menu.config.ts` ("Licitações" e "Nova Licitação"
  viram "Processos de contratação" → `/compras/processos` e "Novo processo" → `/compras/processos?novo=1`, permissões
  `compras.processos.*`; tipo da permissão), `src/hooks/dashboard/useComprasDashboardStats.ts` (conta por `etapa`; a
  coluna `fase` que ele filtra hoje não existe)

**Interfaces (produz):**
- `useProcessos({ ano, etapa, setor })`, `useProcesso(id)`, `useSalvarProcesso()`, `useAndamentos(processoId)`,
  `useNovaMovimentacao()`, `useEmpenhosDoProcesso(processoId)`.
- Rotas: `/compras/processos` → `ProcessosListaPage`; `/compras/processos/:id` → `ProcessoFichaPage`, ambas com
  `ProtectedRoute requiredModule="compras" requiredPermissions={["compras.processos.visualizar","compras.processos.editar"]}`.

- [ ] **Step 1:** lista: nº SEI, objeto resumido, forma, etapa, setor, dias parado (hoje − `atualizado_em`),
  valor estimado, empenhado (soma da visão); filtros ano, etapa e setor; "Novo processo" e "Importar planilha"
  (abre a Central de Importações com o importador escolhido) só com `editar`; celular em cartões.
- [ ] **Step 2:** ficha com abas Dados (form zod: nº SEI obrigatório no formato `00000.000000/0000.00` ou `-00`,
  objeto obrigatório, valor ≥ 0 ou vazio com observação), Andamento (linha do tempo, "Nova movimentação") e Empenhos.
- [ ] **Step 3:** rotas e menu; `npx vitest run src/shared/config src/codigo-alcancavel.test.ts` — PASSA.
- [ ] **Step 4:** `bun run dev` com dados fictícios: criar processo, lançar duas movimentações, importar a planilha
  fictícia duas vezes (a segunda sem mudanças); capturas larga, celular e escuro em `/mnt/project-files/processos/entrega1/`.
- [ ] **Step 5:** commit "Compras: telas de processos de contratação".

### Task 4: Docs, revisão e entrega

**Files:** `docs/BANCO_DE_DADOS.md`, `docs/RBAC_PERMISSOES.md`, `docs/GUIA_FRONTEND.md` ou a doc do módulo Compras
que a matriz indicar, `docs/NOVO_BANCO.md` se pedir, `docs/planejamento/ROADMAP.md`, `docs/ESTADO_DO_SISTEMA.md`
(`bun run estado`).

- [ ] **Step 1:** `node scripts/check-docs-matriz.mjs --base origin/main` — sem pendência.
- [ ] **Step 2:** `bash scripts/gate.sh` — verde (saída lida).
- [ ] **Step 3:** revisão com `revisor-codigo-idjuv` e `revisor-seguranca-idjuv` (RPC, gatilho SECURITY DEFINER,
  visão); corrigir bloqueantes.
- [ ] **Step 4:** mesclar `origin/main`, conferir conflito e prefixo da migração, push e PR rascunho.
- [ ] **Step 5:** depois do merge e da aprovação da migração em `producao`: importar
  `/mnt/project-files/processos/processos-2026-organizada.xlsx` pela Central de Importações (simular, conferir, aplicar).
