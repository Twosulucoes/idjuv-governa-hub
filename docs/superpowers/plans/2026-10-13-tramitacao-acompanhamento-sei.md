# Workflow: acompanhamento de processos do SEI — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O módulo `workflow` passa a acompanhar processos do SEI por etapas de um modelo (unidade, prazo em dias
úteis, checklist), com sigilo aplicado na RLS e as telas de `/processos/*` criando processos reais.

**Architecture:** Três migrações (modelos + carga; processo/sigilo/RLS/limpeza; RPCs + view) reaproveitando
`processos_administrativos` e `movimentacoes_processo`. Toda escrita no processo passa por RPCs `SECURITY DEFINER`
que checam `has_permission_code` e `wf_pode_ver_processo`. O front lê `v_processos_acompanhamento` e chama as RPCs por
hooks novos em `src/hooks/useAcompanhamentoProcessos.ts`.

**Tech Stack:** Postgres/Supabase (plpgsql, RLS), React 18 + TypeScript + React Query + shadcn/ui, vitest.

**Spec:** `docs/superpowers/specs/2026-10-13-tramitacao-acompanhamento-sei-design.md` (aprovada por Fabiano em
13/10/2026; etapas marcadas "(proposta)" seguem como default).

## Global Constraints

- Invariantes do `AGENTS.md` valem em todas as tarefas: RLS na mesma migração; RPC com `search_path` fixo e `EXECUTE`
  só para `authenticated`; não editar `src/integrations/supabase/{client,types}.ts`; nada de nome de cliente em `src/`.
- Migrações novas: `supabase/migrations/20261013100000_wf_modelos_fluxo.sql`, `20261013100100_wf_processo_sigilo.sql`,
  `20261013100200_wf_rpcs.sql`. Cada uma idempotente o bastante para o replay (`IF NOT EXISTS`, `DROP ... IF EXISTS`)
  e segura para rodar sozinha no merge.
- Permissões usadas (já existem em `funcoes_sistema`): `workflow.visualizar`, `workflow.criar`, `workflow.tramitar`,
  `workflow.concluir`, `workflow.arquivar`, `workflow.admin`.
- Semáforo: `em_dia`, `vence_logo` (vence em até **2 dias úteis**), `vencido`, `sem_prazo`.
- Siglas especiais da etapa: `@ORIGEM`, `@CHEFIA`.
- Códigos de modelo: `compras`, `diarias`, `convenios`, `almoxarifado`, `pagamentos`, `patrimonio_tombamento`,
  `patrimonio_baixa`.
- Mensagens de erro das RPCs em português, `RAISE EXCEPTION ... USING ERRCODE` `42501` (permissão), `22023`
  (regra de negócio), `40001` (processo mudou).
- Tabelas novas sem `supabase as any` evitável: até regenerar os tipos, os hooks usam `supabase as any` só nas
  chamadas às tabelas/RPCs novas, com tipos de `src/types/workflow.ts`.
- Banco local para testes: Postgres 16 em `/usr/lib/postgresql/16/bin`, superusuário `supabase_admin`, porta 54329
  (ver Task 0).

## Review Focus

- **Usuário sem lotação ativa abre processo** → abre com `unidade_origem_id` nulo; etapas `@ORIGEM`/`@CHEFIA` ficam só
  com a sigla; nada quebra. Teste em Task 3 (`wf_abrir_processo` sem lotação).
- **Feriado e fim de semana no prazo** → `fn_somar_dias_uteis('2026-12-24', 2)` com 25/12 feriado = `2026-12-29`.
  Teste em Task 1.
- **Duas abas avançam o mesmo processo** → a segunda recebe `40001` "o processo mudou, recarregue". Teste em Task 3.
- **Usuário com módulo `workflow` sem credencial tenta ler processo sigiloso pela API direta** (`select`, view ou
  `movimentacoes_processo` do processo) → zero linhas. Teste em Task 2 (tabela) e Task 3 (view).
- **Processo antigo sem modelo** aparece na lista e no detalhe sem trilha nem checklist e pode ser concluído e
  arquivado. Teste em Task 3 (`wf_concluir` sem modelo) e verificação manual em Task 6.

---

### Task 0: Banco local de validação

**Files:** nenhum (ambiente).

- [ ] **Step 1:** Subir o cluster: `initdb -D $SCRATCH/pg -U supabase_admin --auth=trust` e
  `pg_ctl -D $SCRATCH/pg -o "-p 54329 -k $SCRATCH" -l $SCRATCH/pg.log start` (binários em `/usr/lib/postgresql/16/bin`).
- [ ] **Step 2:** `PGHOST=127.0.0.1 bash scripts/db/validar-migracoes.sh` → esperado: saída 0 na `main` atual (linha de
  base). Se falhar antes das nossas migrações, registrar e seguir com `validar-baseline.sh` como prova.

### Task 1: Modelos de fluxo, carga inicial e dias úteis

**Files:**
- Create: `supabase/migrations/20261013100000_wf_modelos_fluxo.sql`
- Modify: `supabase/baseline/rls/mapa.csv` (3 linhas novas), `supabase/baseline/rls/35_policies_geradas.sql` (gerado),
  `supabase/baseline/overlay/40_privilegios.sql`
- Test: `scripts/db/testar-rls.sql` (bloco novo "Workflow: acompanhamento do SEI")

**Interfaces:**
- Produces: tabelas `processo_modelos(id uuid, codigo text unique, nome text, tipo_processo tipo_processo_administrativo,
  base_legal text, ativo bool)`, `processo_modelo_etapas(id, modelo_id, ordem int, nome, unidade_sigla text,
  responsavel_rotulo text, prazo_dias_uteis int null, unique(modelo_id, ordem))`,
  `processo_modelo_checklist(id, modelo_id, etapa_ordem int, codigo text, descricao text, obrigatorio bool,
  unique(modelo_id, codigo))`; função `fn_somar_dias_uteis(p_inicio date, p_dias int) RETURNS date` (STABLE, pula
  sáb/dom e `feriados.data`).

- [ ] **Step 1: Testes que falham** no bloco novo de `testar-rls.sql`:
  - `fn_somar_dias_uteis('2026-10-16', 1) = '2026-10-19'` (sexta → segunda);
  - com `feriados` contendo `2026-12-25`: `fn_somar_dias_uteis('2026-12-24', 2) = '2026-12-29'`;
  - `select count(*) from processo_modelos = 7`; `compras` tem 8 etapas e 8 itens, `patrimonio_baixa` 4 etapas;
  - etapa 2 de `diarias` tem `unidade_sigla = '@CHEFIA'`;
  - classe `permissao` com `escrita=workflow.admin` coberta pelo teste genérico (linhas no mapa).
- [ ] **Step 2:** rodar `validar-baseline.sh` (após Task 4 regenerar) — por ora aplicar a migração num replay e rodar o
  bloco: esperado FALHA (tabelas não existem).
- [ ] **Step 3: Migração** com as três tabelas, RLS ligada e o bloco de policies gerado para
  `workflow,permissao,alta,...,escrita=workflow.admin` (copiado de `35_policies_geradas.sql` depois de
  `node scripts/db/gerar-rls.mjs`), `fn_somar_dias_uteis` e a carga da tabela "Carga inicial dos modelos" da spec
  (etapas, unidade, rótulo, checklist→etapa). Prazos (proposta): 5 dias úteis por etapa, exceto Fiscalização/Execução/
  Viagem sem prazo e Relatório de viagem 5. Siglas pela Lei 2.301/2025 (`01_ESTRUTURA_INSTITUCIONAL.md`); comentar na
  migração onde a página usava outra sigla.
- [ ] **Step 4:** `REVOKE ALL ... FROM anon` nas três tabelas e `fn_somar_dias_uteis` só para `authenticated` no overlay 40.
- [ ] **Step 5:** testes do Step 1 passam; `node scripts/db/gerar-rls.mjs --check` passa.
- [ ] **Step 6: Commit** `banco: modelos de fluxo do workflow e carga inicial`.

### Task 2: Processo do SEI, sigilo na RLS e limpeza

**Files:**
- Create: `supabase/migrations/20261013100100_wf_processo_sigilo.sql`
- Modify: `supabase/baseline/rls/mapa.csv` (classe `preservar` para `processos_administrativos`,
  `movimentacoes_processo`, `despachos`, `documentos_processo`, `prazos_processo`, `processo_checklist_respostas`, nota
  "sigilo por wf_pode_ver_processo; escrita só por RPC (migração 20261013100100)"), `overlay/40_privilegios.sql`
- Test: `scripts/db/testar-rls.sql` (mesmo bloco)

**Interfaces:**
- Consumes: `processo_modelos`, `processo_modelo_checklist` (Task 1).
- Produces: colunas `processos_administrativos.numero_sei text` (único parcial, sem espaços), `modelo_id uuid`,
  `etapa_atual_ordem int`, `unidade_atual_id uuid`, `etapa_iniciada_em timestamptz`, `etapa_prazo_limite date`;
  `movimentacoes_processo.etapa_origem_ordem int`, `etapa_destino_ordem int`; tabela
  `processo_checklist_respostas(processo_id, item_id, marcado bool, marcado_por uuid, marcado_em timestamptz,
  observacao text, unique(processo_id,item_id))`; função `wf_pode_ver_processo(p_processo_id uuid) RETURNS boolean`
  (DEFINER, STABLE).

- [ ] **Step 1: Testes que falham** (personas do arquivo: módulo `workflow` com `workflow.visualizar`; sem credencial;
  com credencial em `acesso_processo_sigiloso`; `workflow.admin`; papel admin):
  - processo `publico`: persona visualizar lê; persona sem módulo não lê;
  - processo `sigiloso`: visualizar sem credencial → 0 linhas em `processos_administrativos`,
    `movimentacoes_processo`, `despachos`, `processo_checklist_respostas`; com credencial → lê; criador → lê;
    `workflow.admin` → lê;
  - INSERT/UPDATE direto em `processos_administrativos` e `movimentacoes_processo` pela persona com
    `workflow.tramitar` → negado; DELETE só `workflow.admin`;
  - só um trigger de auditoria por tabela (`processos_administrativos`, `movimentacoes_processo`, `despachos`) e nenhum
    `tr_verificar_arquivamento`/`tr_validar_arquivamento`; `fn_proximo_numero_processo` não existe;
  - `numero_sei` repetido → `unique_violation`.
- [ ] **Step 2:** rodar o bloco → FALHA.
- [ ] **Step 3: Migração**: colunas e tabela acima; `wf_pode_ver_processo` (regra da spec, seção Sigilo);
  `DROP POLICY` de todas as policies atuais das seis tabelas (FASE 6, `proc_*`, `rls_*`) e criação de
  `wf_select` (`USING wf_pode_ver_processo(processo_id)` ou `(id)`) e `wf_delete` (`has_permission_code(auth.uid(),
  'workflow.admin')`), sem INSERT/UPDATE para `authenticated`; drop de `tr_audit_processos`, `tr_audit_movimentacoes`,
  `tr_audit_despachos` (ficam os `audit_*`), do `updated_at` duplicado que existir além de `handle_updated_at`, dos
  dois triggers de arquivamento e de `fn_proximo_numero_processo`; `gerar_numero_processo()` passa a usar
  `pg_advisory_xact_lock(hashtext('processo_numero_' || NEW.ano))` antes do MAX+1 (5 dígitos).
- [ ] **Step 4:** overlay 40: `wf_pode_ver_processo` com EXECUTE para `authenticated` (usada nas policies); tabela de
  respostas sem privilégio para `anon`.
- [ ] **Step 5:** testes passam. **Commit** `banco: sigilo do workflow na RLS e limpeza de triggers`.

### Task 3: RPCs do acompanhamento e view

**Files:**
- Create: `supabase/migrations/20261013100200_wf_rpcs.sql`
- Modify: `overlay/40_privilegios.sql`
- Test: `scripts/db/testar-rls.sql` (mesmo bloco)

**Interfaces:**
- Consumes: Tasks 1–2.
- Produces (todas `SECURITY DEFINER`, `SET search_path = public`, EXECUTE só `authenticated`):
  - `wf_abrir_processo(p_modelo_codigo text, p_assunto text, p_descricao text, p_interessado_tipo text,
    p_interessado_nome text, p_interessado_documento text, p_sigilo nivel_sigilo_processo, p_numero_sei text)
    RETURNS uuid` — `workflow.criar`; etapa 1, `unidade_origem_id` = lotação ativa (`lotacao_vigente` do servidor do
    login, nulo se não houver), unidade e prazo da etapa 1.
  - `wf_marcar_item(p_processo_id uuid, p_item_codigo text, p_marcado boolean, p_observacao text) RETURNS void` —
    `workflow.tramitar`; só item com `etapa_ordem <= etapa_atual_ordem`.
  - `wf_avancar_etapa(p_processo_id uuid, p_etapa_esperada int, p_observacao text) RETURNS void`
  - `wf_devolver_etapa(p_processo_id uuid, p_etapa_esperada int, p_para_ordem int, p_motivo text) RETURNS void`
  - `wf_suspender(p_processo_id uuid, p_motivo text)`, `wf_reativar(p_processo_id uuid, p_motivo text)` —
    `workflow.concluir`; reativar recalcula `etapa_prazo_limite` somando os dias úteis que faltavam.
  - `wf_concluir(p_processo_id uuid, p_motivo text)` (`workflow.concluir`), `wf_arquivar(p_processo_id uuid,
    p_motivo text)` (`workflow.arquivar`).
  - `wf_atualizar_numero_sei(p_processo_id uuid, p_numero_sei text)` — `workflow.tramitar`, só na etapa 1.
  - `wf_conceder_acesso(p_processo_id uuid, p_usuario_id uuid, p_nivel text, p_motivo text)`,
    `wf_revogar_acesso(p_processo_id uuid, p_usuario_id uuid)` — `workflow.admin`.
  - `fn_situacao_prazo(p_limite date) RETURNS text` (STABLE) e view `v_processos_acompanhamento`
    (`security_invoker = true`) com: colunas do processo, `numero_formatado`, `modelo_codigo`, `modelo_nome`,
    `etapa_nome`, `etapa_total`, `unidade_sigla`, `unidade_nome`, `situacao_prazo`, `pendencias_obrigatorias int`.

Resolução de unidade (função interna `wf_resolver_unidade(p_sigla text, p_unidade_origem uuid) RETURNS uuid`, sem
EXECUTE pela API): `@ORIGEM` → origem; `@CHEFIA` → `estrutura_organizacional.superior_id` da origem; outra sigla →
`estrutura_organizacional` ativa com `sigla` igual (case-insensitive); não achou → NULL.

- [ ] **Step 1: Testes que falham**:
  - sem `workflow.criar` → `wf_abrir_processo` `42501`; com → processo na etapa 1, `numero_processo` gerado;
  - sem lotação ativa → abre com `unidade_origem_id` nulo;
  - avançar com item obrigatório da etapa pendente → `22023` listando os códigos; marcados → etapa 2, movimentação com
    `etapa_origem_ordem=1`, `etapa_destino_ordem=2`, `etapa_prazo_limite = fn_somar_dias_uteis(hoje, prazo)`;
  - sair da etapa 1 sem `numero_sei` → `22023`;
  - `p_etapa_esperada` diferente da atual → `40001`;
  - devolver sem motivo → `22023`; devolver para ordem ≥ atual → `22023`;
  - última etapa: avançar → `22023` "conclua o processo"; `wf_concluir` fora da última etapa → `22023`; processo sem
    modelo → `wf_concluir` aceita;
  - suspenso: `wf_avancar_etapa` e `wf_marcar_item` → `22023`; reativar recalcula o prazo;
  - persona sem credencial em processo sigiloso: todas as RPCs → `42501`; `v_processos_acompanhamento` não mostra;
  - `fn_situacao_prazo`: NULL → `sem_prazo`; ontem → `vencido`; hoje+1 dia útil → `vence_logo`; +5 → `em_dia`.
- [ ] **Step 2:** rodar → FALHA.
- [ ] **Step 3:** implementar as funções. Todas fazem `SELECT ... FOR UPDATE` do processo e checam
  `wf_pode_ver_processo` antes da permissão de ação; nenhuma aceita processo `concluido` ou `arquivado` (`22023`).
- [ ] **Step 4:** overlay 40 com os GRANT/REVOKE; testes passam.
- [ ] **Step 5: Commit** `banco: RPCs e view do acompanhamento de processos do SEI`.

### Task 4: Baseline regenerado e validação completa do banco

**Files:** `supabase/baseline/schema/*.sql` (gerados), `supabase/baseline/README.md` (contagem da classe `preservar` e
`permissao`, linha do overlay 40).

- [ ] **Step 1:** `bash scripts/db/validar-migracoes.sh` → 0 (as três migrações aplicam no replay).
- [ ] **Step 2:** `bash scripts/db/gerar-baseline.sh` (regenera `schema/`), `node scripts/db/gerar-rls.mjs`.
- [ ] **Step 3:** `PG_REPLAY=idjuv_validacao bash scripts/db/validar-baseline.sh` → 0, sem "FALHA" no bloco novo.
- [ ] **Step 4: Commit** `banco: baseline com o acompanhamento do SEI`.

### Task 5: Tipos, hooks e semáforo no front

**Files:**
- Modify: `src/types/workflow.ts` (tipos novos)
- Create: `src/hooks/useAcompanhamentoProcessos.ts`, `src/lib/workflow/semaforoPrazo.ts`,
  `src/lib/workflow/semaforoPrazo.test.ts`

**Interfaces:**
- Produces:
  - tipos `ModeloProcesso`, `EtapaModelo`, `ItemChecklistModelo`, `RespostaChecklist`, `ProcessoAcompanhamento`
    (linha da view), `SituacaoPrazo = 'em_dia' | 'vence_logo' | 'vencido' | 'sem_prazo'`;
  - `rotuloSituacaoPrazo(s: SituacaoPrazo): { texto: string; tom: 'sucesso' | 'alerta' | 'perigo' | 'neutro' }` em
    `semaforoPrazo.ts` (textos: "Em dia", "Vence em breve", "Vencido", "Sem prazo");
  - hooks: `useModelosProcesso()`, `useModeloProcesso(codigo: string)`, `useProcessosAcompanhamento(filtros:
    { escopo: 'minha_unidade' | 'todos'; modeloCodigo?: string; etapa?: number; unidadeId?: string;
    situacaoPrazo?: SituacaoPrazo; busca?: string })`, `useProcessoAcompanhamento(id: string)`,
    `useChecklistProcesso(id: string)`, mutações `useAbrirProcesso`, `useMarcarItem`, `useAvancarEtapa`,
    `useDevolverEtapa`, `useSuspenderProcesso`, `useReativarProcesso`, `useConcluirProcesso`, `useArquivarProcesso`,
    `useAtualizarNumeroSei`, `useConcederAcesso`, `useRevogarAcesso`. Todas invalidam `['wf-acompanhamento']`.
  - "minha unidade": `unidade_atual_id` igual à da lotação vigente do usuário (consulta a `lotacoes` ativa pelo
    `profiles.servidor_id`); sem lotação → lista vazia com aviso.
  - busca: filtro `.or()` montado com o termo escapado (vírgula, parênteses e `%` removidos).
- [ ] **Step 1:** teste vitest `rotuloSituacaoPrazo` para os 4 valores (texto e tom).
- [ ] **Step 2:** `npx vitest run src/lib/workflow` → FALHA. **Step 3:** implementar. **Step 4:** PASSA.
- [ ] **Step 5:** `npx tsc -p tsconfig.app.json --noEmit` sem erro novo. **Commit** `front: hooks do acompanhamento de processos`.

### Task 6: Detalhe do processo

**Files:**
- Modify: `src/pages/workflow/ProcessoDetalhePage.tsx`
- Create: `src/components/workflow/TrilhaEtapas.tsx`, `ChecklistEtapa.tsx`, `AcoesProcesso.tsx`
  (diálogos de avançar/devolver/suspender/concluir/arquivar com observação/motivo), `CredenciaisSigiloTab.tsx`

**Interfaces:** Consumes hooks da Task 5.

- [ ] **Step 1:** Cabeçalho com Nº SEI (editável via `useAtualizarNumeroSei` só na etapa 1 com `workflow.tramitar`),
  etapa atual "n de N", unidade, selo do semáforo.
- [ ] **Step 2:** `TrilhaEtapas`: feito / atual / a fazer com unidade e prazo; processo sem modelo mostra "Processo
  sem modelo de fluxo".
- [ ] **Step 3:** `ChecklistEtapa`: itens até a etapa atual, obrigatórios marcados com selo; marcação chama
  `useMarcarItem`; desabilitado sem `workflow.tramitar`.
- [ ] **Step 4:** `AcoesProcesso`: botões por permissão e situação; erro `22023` mostra a mensagem do banco; `40001`
  mostra "O processo mudou. Recarregue." e refaz a consulta.
- [ ] **Step 5:** abas: Linha do tempo (movimentações com etapa de/para), Despachos e Documentos só leitura (sem botão
  "Despachar"), Credenciais (só `workflow.admin`).
- [ ] **Step 6:** `bun run build` ok; conferência manual com `bun run dev` se houver `.env` (senão registrar que não
  houve). **Commit** `front: detalhe do processo com etapas e checklist`.

### Task 7: Lista, abertura e painel do workflow

**Files:**
- Modify: `src/pages/workflow/GestaoProcessosPage.tsx`, `src/components/workflow/NovoProcessoDialog.tsx`,
  `src/hooks/dashboard/useWorkflowDashboardStats.ts`, `src/pages/modulos/WorkflowDashboardPage.tsx`
- Delete: `src/components/workflow/NovoDespachoDialog.tsx`, `NovaMovimentacaoDialog.tsx` (sem uso após Task 6); remover
  hooks mortos de `useWorkflow.ts` só se nada mais os importar (`grep`).

- [ ] **Step 1:** `GestaoProcessosPage`: abas "Na minha unidade" / "Todos"; colunas Nº interno, Nº SEI, Tipo,
  Assunto, Etapa, Unidade, Prazo (selo); filtros tipo, etapa, unidade, prazo; lê `?meus=true` (abre na aba minha
  unidade) e `?acao=novo` (abre o diálogo).
- [ ] **Step 2:** `NovoProcessoDialog`: campo Modelo (obrigatório, de `useModelosProcesso`; prop opcional
  `modeloCodigo` fixa o modelo), Nº SEI opcional, demais campos atuais; envia por `useAbrirProcesso` e navega para o
  detalhe.
- [ ] **Step 3:** painel: "Na minha unidade", "Vencidos", "Por tipo" e "Por etapa" contados em
  `v_processos_acompanhamento`; remover consultas a `encaminhamentos`; links para a lista com filtros.
- [ ] **Step 4:** build, lint sem piora. **Commit** `front: lista e painel do acompanhamento`.

### Task 8: Telas de `/processos/*`

**Files:**
- Create: `src/components/processos/GuiaProcessoModelo.tsx` (etapas + checklist lidos do modelo, botão "Iniciar
  processo" que abre `NovoProcessoDialog` com `modeloCodigo`, aba "Processos" com `useProcessosAcompanhamento({ escopo:
  'todos', modeloCodigo })`)
- Modify: `src/pages/processos/{Compras,Diarias,Convenios,Almoxarifado,Pagamentos,Patrimonio}ProcessoPage.tsx`,
  `VeiculosProcessoPage.tsx`, `src/pages/ProcessosPage.tsx` (texto do catálogo sem promessa não cumprida)

- [ ] **Step 1:** cada página mantém base legal e textos de orientação e troca as constantes de etapa/checklist pelo
  `GuiaProcessoModelo` com o código do modelo (Patrimônio: abas Tombamento e Baixa com seus códigos; Distribuição e
  Inventário saem).
- [ ] **Step 2:** remover dados fictícios (Convênios, Pagamentos, Veículos) e botões sem ação ("Baixar modelos",
  "Gerar"). Veículos: estado vazio "Controle de frota ainda não implantado".
- [ ] **Step 3:** "Iniciar processo" só aparece com `workflow.criar`; sem a permissão, texto "Peça acesso ao módulo
  Processos para iniciar".
- [ ] **Step 4:** `grep -rn "2024\|2023" src/pages/processos` sem dados fictícios restantes; build ok.
  **Commit** `front: guias de processo ligados aos modelos`.

### Task 9: Documentação, gate e revisão

**Files:** `docs/BANCO_DE_DADOS.md` (seção "Acompanhamento de processos do SEI"), `docs/RBAC_PERMISSOES.md` (uso das
seis permissões `workflow.*` no banco), `docs/MODULOS.md` (Processos/Workflow), `docs/planejamento/ROADMAP.md` (Em
andamento: item com link para spec e plano; dependência do cadastro de unidades no Backlog).

- [ ] **Step 1:** atualizar as docs (nada documentado como existente que não foi feito).
- [ ] **Step 2:** `bash scripts/gate.sh` → verde; colar o resumo na PR.
- [ ] **Step 3:** revisão do branch inteiro por `revisor-codigo-idjuv` e `revisor-seguranca-idjuv`; corrigir
  bloqueantes.
- [ ] **Step 4:** atualizar a descrição da PR #102 (checklist do template marcado com evidência) e o push.
