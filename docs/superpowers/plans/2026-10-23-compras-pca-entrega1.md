# PCA, entrega 1 (catálogo, plano, tetos e itens): plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compras cria o PCA do exercício, digita o teto PLOA por ação × fonte e lança cada DFD do SEI com item do
catálogo CATMAT/CATSER, vendo na hora quanto sobra ou falta em cada fonte.

**Architecture:** migração única com as tabelas `cat_*` e `pca_*` (RLS gerada de `rls/mapa.csv`), permissões novas no
catálogo; Edge Function `catalogo-compras` faz a ponte com `dadosabertos.compras.gov.br` (o portal recusa CORS e a CSP
do app só libera `bd.idjuv.online`); front em `/compras/pca` com hook React Query e cálculo puro em `src/lib/pca/`.

**Tech Stack:** Postgres/Supabase (RLS, gatilhos), Deno Edge Function, React 18 + shadcn/ui + react-hook-form/zod,
React Query, vitest.

**Spec:** [`docs/superpowers/specs/2026-10-23-compras-gerador-pca-design.md`](../specs/2026-10-23-compras-gerador-pca-design.md)
(§3, §4, §5 abas Itens e Orçamento; as abas Sugestões, Documentos e Situação ficam para as entregas 2 a 4).

## Global Constraints

- Português em nomes, comentários e rótulos; páginas `*Page.tsx`; hooks `use<Dominio>`; imports `@/`.
- Toda tabela nova com RLS na mesma migração; policies geradas por `node scripts/db/gerar-rls.mjs` a partir de
  `supabase/baseline/rls/mapa.csv`, copiadas sem mudança para a migração. Função nova: `SET search_path = public`,
  `REVOKE ... FROM PUBLIC, anon` e `GRANT` só para quem precisa.
- Permissões novas: `compras.pca.visualizar` (ler) e `compras.pca.editar` (gravar), módulo `compras`. Rotas com
  `ProtectedRoute requiredModule="compras" requiredPermissions="compras.pca.visualizar"`.
- Nada apaga pela API: item sai do PCA por `situacao = 'excluido'`; plano não se apaga.
- Um PCA por exercício (`UNIQUE (exercicio)`).
- Situações do plano já criadas na entrega 1: `rascunho`, `enviado_sei`, `aprovado`, `publicado` (só `rascunho` é usado
  agora; as transições são da entrega 4).
- Edge Function: `verify_jwt = true` em `supabase/config.toml`; só chama `https://dadosabertos.compras.gov.br`; confere
  módulo `compras` + permissão `compras.pca.editar` (sincronizar e gravar item) ou `compras.pca.visualizar` (buscar).
- Não editar `src/integrations/supabase/client.ts`; `types.ts` sai de `bash scripts/db/gerar-tipos.sh`.
- Migração `supabase/migrations/20261027090000_compras_pca.sql` só vai para a PR depois do "sim" do usuário às tabelas.
- `bash scripts/gate.sh` verde; docs da matriz + `docs/planejamento/ROADMAP.md` na mesma PR.

## Review Focus

1. Portal fora do ar ou lento: a busca local por PDM continua, a tela avisa e deixa lançar só com o PDM.
2. Exercício já com PCA: "Novo PCA" do mesmo ano mostra o erro de duplicidade em português, sem tela quebrada.
3. Teto zerado ou ação × fonte sem teto mas com itens: a linha aparece com teto 0 e "falta" igual ao planejado.
4. Item excluído (`situacao = 'excluido'`) não soma no orçamento nem aparece na lista padrão.
5. Usuário só com `compras.pca.visualizar`: vê tudo, sem botões de gravar, e a RLS recusa a escrita.

---

### Task 1: Migração, RLS, baseline e tipos

**Files:**
- Create: `supabase/migrations/20261027090000_compras_pca.sql`
- Modify: `supabase/baseline/rls/mapa.csv`, `supabase/baseline/rls/35_policies_geradas.sql` (gerado),
  `supabase/baseline/overlay/40_privilegios.sql`, `supabase/baseline/schema/01_pre_data.sql` e `03_post_data.sql`
  (regenerados), `supabase/baseline/README.md`, `scripts/db/testar-rls.sql`, `src/integrations/supabase/types.ts`
  (gerado)

**Interfaces:**
- Produces (tabelas):
  - `cat_material_pdms(codigo_pdm int PK, nome_pdm text, codigo_classe int, nome_classe text, codigo_grupo int,
    nome_grupo text, ativo bool, atualizado_em timestamptz)` com índice GIN `to_tsvector('portuguese', nome_pdm || ' ' || nome_classe)`
  - `cat_servicos(codigo_servico int PK, nome_servico text, codigo_classe int, nome_classe text, codigo_grupo int,
    nome_grupo text, codigo_divisao int, nome_divisao text, codigo_secao int, nome_secao text, ativo bool,
    atualizado_em timestamptz)` com o mesmo tipo de índice
  - `cat_material_itens(codigo_item int PK, codigo_pdm int FK, descricao text, sustentavel bool, ativo bool, atualizado_em)`
  - `cat_sincronizacoes(tipo text PK CHECK IN ('pdm','servico'), total int, atualizado_em timestamptz, atualizado_por uuid)`
  - `pca_planos(id uuid PK, exercicio int UNIQUE CHECK 2020..2100, situacao text CHECK IN
    ('rascunho','enviado_sei','aprovado','publicado') DEFAULT 'rascunho', processo_sei text, data_aprovacao date,
    data_publicacao_pncp date, observacoes text, created_at, created_by, updated_at, updated_by)`
  - `pca_tetos(id uuid PK, plano_id FK, acao_id FK fin_acoes_orcamentarias, fonte_recurso_id FK fin_fontes_recurso,
    valor_previsto numeric(15,2) >= 0, origem text CHECK IN ('ploa','qdd') DEFAULT 'ploa', UNIQUE(plano_id, acao_id, fonte_recurso_id))`
  - `pca_itens(id uuid PK, plano_id FK, numero_sei text NOT NULL, setor_id FK estrutura_organizacional, tipo text CHECK
    IN ('material','servico'), codigo_pdm int FK NULL, codigo_servico int FK NULL, codigo_item int FK NULL, descricao
    text NOT NULL, unidade_fornecimento text NOT NULL, quantidade numeric(15,3) > 0, valor_unitario numeric(15,2) >= 0,
    valor_total numeric(15,2) GENERATED ALWAYS AS (round(quantidade * valor_unitario, 2)) STORED, mes_desejado int CHECK
    1..12, prioridade text CHECK IN ('alta','media','baixa'), acao_id FK, fonte_recurso_id FK, natureza_despesa_id FK
    NULL, justificativa text, origem text CHECK IN ('dfd','sugestao_aceita') DEFAULT 'dfd', situacao text CHECK IN
    ('ativo','excluido') DEFAULT 'ativo', created_at, created_by, updated_at, updated_by)`;
    CHECK: `tipo='material'` ⇒ `codigo_pdm` não nulo e `codigo_servico` nulo; `tipo='servico'` ⇒ o contrário
  - `pca_historico(id uuid PK, plano_id, item_id NULL, acao text, antes jsonb, depois jsonb, motivo text, feito_por uuid, feito_em)`
  - gatilho `pca_registrar_historico()` (SECURITY DEFINER, search_path fixo, sem EXECUTE para a API) em INSERT/UPDATE
    de `pca_itens` e UPDATE de `situacao` em `pca_planos`
  - permissões no `module_permissions_catalog` (`compras`, categoria `PCA`) e concedidas a quem já tem `compras.criar`
    (papéis, `user_permissions`, `user_modules.permissions`), como em `20261023100000_patrimonio_permissoes_entrega4.sql`
- Linhas do `mapa.csv`:
  - `cat_material_pdms`, `cat_servicos`, `cat_material_itens`, `cat_sincronizacoes`: `compras,permissao`, extra
    `escrita=compras.pca.editar;excluir=ninguem`
  - `pca_planos`, `pca_tetos`, `pca_itens`: `compras,permissao`, extra
    `escrita=compras.pca.editar;excluir=ninguem;leitura=compras.pca.visualizar|compras.pca.editar`
  - `pca_historico`: `compras,trilha` (só lê; grava o gatilho)

- [ ] **Step 1:** escrever os testes de RLS no bloco novo "Compras: PCA" de `scripts/db/testar-rls.sql`: usuário com
  módulo `compras` sem as permissões não lê `pca_itens`; com `visualizar` lê e não insere; com `editar` insere; ninguém
  apaga `pca_itens`; ninguém insere em `pca_historico`; `pca_itens.valor_total` de 3 × 10,50 = 31,50; segundo
  `pca_planos` com o mesmo exercício falha com `23505`.
- [ ] **Step 2:** rodar `bash scripts/db/validar-baseline.sh` — esperado: FALHA (tabelas inexistentes).
- [ ] **Step 3:** escrever a migração (cabeçalho no padrão de `20261026090000_fin_conciliacao_mensal.sql`, `SET
  lock_timeout = '10s'`, idempotente), editar `mapa.csv`, rodar `node scripts/db/gerar-rls.mjs` e copiar o bloco das
  oito tabelas para o fim da migração.
- [ ] **Step 4:** `bash scripts/db/validar-migracoes.sh`, `PG_DB=idjuv_validacao bash scripts/db/gerar-baseline.sh`
  (depois `git checkout supabase/baseline/schema/02_dados_catalogo.sql` se só mudaram UUIDs), privilégios no overlay 40,
  `PG_REPLAY=idjuv_validacao bash scripts/db/validar-baseline.sh` — esperado: APROVADO, RLS com 0 falhas.
- [ ] **Step 5:** `bash scripts/db/gerar-tipos.sh` e conferir que só entraram as tabelas novas em `types.ts`.
- [ ] **Step 6:** commit "Compras: tabelas do PCA e do catálogo com RLS".

### Task 2: Edge Function `catalogo-compras`

**Files:**
- Create: `supabase/functions/catalogo-compras/index.ts`, `supabase/functions/catalogo-compras/portal.ts`,
  `supabase/functions/catalogo-compras/portal.test.ts`
- Modify: `supabase/config.toml` (bloco `[functions.catalogo-compras]`, `verify_jwt = true`), `vitest.config.ts`
  (incluir `supabase/functions/**/*.test.ts`), `docs/EDGE_FUNCTIONS.md`

**Interfaces:**
- Consumes: tabelas `cat_*` da Task 1.
- Produces: `supabase.functions.invoke('catalogo-compras', { body })` com
  - `{ acao: 'sincronizar', tipo: 'pdm' | 'servico', pagina: number }` → `{ pagina, totalPaginas, gravados }`
    (exige `compras.pca.editar`; grava 500 por página com service role; na última página atualiza `cat_sincronizacoes`)
  - `{ acao: 'itens_pdm', codigoPdm: number }` → `{ itens: { codigoItem, descricao, sustentavel }[] }`
    (exige `compras.pca.visualizar` ou `editar`; só itens ativos; até 500)
  - `{ acao: 'gravar_item', codigoItem: number }` → `{ ok: true }` (exige `editar`; busca o item no portal e grava em
    `cat_material_itens`, para o FK de `pca_itens`)
  - erro do portal → HTTP 502 `{ error: 'Portal de compras indisponível. Tente mais tarde.' }`; timeout de 20 s por chamada
- `portal.ts` (puro, sem import Deno): `urlPortal(acao, params): string`, `mapearPdm(json): LinhaPdm`,
  `mapearServico(json): LinhaServico`, `mapearItemMaterial(json): LinhaItem`

- [ ] **Step 1:** testes em `portal.test.ts`: `urlPortal('pdm', { pagina: 2 })` termina em
  `/modulo-material/3_consultarPdmMaterial?pagina=2&tamanhoPagina=500`; `urlPortal('itens_pdm', { codigoPdm: 11 })`
  contém `codigoPdm=11&statusItem=true`; `mapearPdm` do JSON real de 2026-10-23 (`codigoPdm: 281`, `nomePdm: 'CARTUCHO
  CANETA TINTEIRO'`, classe 7520, grupo 75) dá a linha esperada; `mapearServico` do exemplo `codigoServico: 7250`
  preenche seção 9, divisão 93, grupo 931, classe 9311; `urlPortal` nunca gera host diferente de
  `dadosabertos.compras.gov.br`.
- [ ] **Step 2:** `npx vitest run supabase/functions/catalogo-compras` — esperado: FALHA.
- [ ] **Step 3:** implementar `portal.ts` e `index.ts` no padrão de `conciliacao-ia-sugestoes/index.ts` (`montarCors`,
  `respostaJson`, `can_access_module` + `has_permission_code` com o token do usuário, escrita com service role).
- [ ] **Step 4:** vitest PASSA; chamada manual de uma página real ao portal com `curl` confere o formato.
- [ ] **Step 5:** commit "Compras: Edge Function do catálogo CATMAT/CATSER".

### Task 3: Cálculo do orçamento

**Files:**
- Create: `src/lib/pca/orcamento.ts`, `src/lib/pca/orcamento.test.ts`, `src/types/pca.ts`

**Interfaces:**
- Produces: tipos `PcaPlano`, `PcaTeto`, `PcaItem` (de `types.ts`) e
  `calcularOrcamento(tetos: PcaTeto[], itens: PcaItem[]): LinhaOrcamento[]`, com
  `LinhaOrcamento = { acaoId, fonteRecursoId, teto, planejado, diferenca, estourado }` (diferenca = teto − planejado;
  estourado = diferenca < 0), ordenado por estourado primeiro e depois pela maior diferença negativa; e
  `totaisOrcamento(linhas): { teto, planejado, diferenca }`.

- [ ] **Step 1:** testes: teto 100.000 e itens 30.000 + 20.000 na mesma ação × fonte → diferenca 50.000, não estourado;
  item excluído não soma; ação × fonte sem teto com item de 5.000 → teto 0, diferenca −5.000, estourado; soma em
  centavos sem erro de ponto flutuante (0,1 + 0,2 = 0,30).
- [ ] **Step 2:** `npx vitest run src/lib/pca` — FALHA.
- [ ] **Step 3:** implementar (somas em centavos inteiros).
- [ ] **Step 4:** vitest PASSA. Commit "Compras: cálculo do orçamento do PCA".

### Task 4: Hook e telas

**Files:**
- Create: `src/hooks/usePca.ts`, `src/pages/compras/PcaListaPage.tsx`, `src/pages/compras/PcaPlanoPage.tsx`,
  `src/components/compras/pca/PcaItensTab.tsx`, `src/components/compras/pca/PcaItemDialog.tsx`,
  `src/components/compras/pca/CatalogoBusca.tsx`, `src/components/compras/pca/PcaOrcamentoTab.tsx`,
  `src/components/compras/pca/AtualizarCatalogoDialog.tsx`
- Modify: `src/App.tsx` (rotas no bloco de Compras), `src/config/menu.config.ts` (item "Plano de Contratações (PCA)"
  no submenu de compras, permissão `compras.pca.visualizar`), `src/types/rbac.ts` ou onde `'compras.visualizar'` está
  tipado (`src/config/menu.config.ts:87`)

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces (`usePca.ts`): `usePcaPlanos()`, `usePcaPlano(exercicio)`, `useCriarPcaPlano()`, `usePcaTetos(planoId)`,
  `useSalvarPcaTeto()`, `usePcaItens(planoId)`, `useSalvarPcaItem()`, `useExcluirPcaItem()` (muda `situacao`),
  `useBuscarCatalogo(termo, tipo)` (busca local `cat_material_pdms`/`cat_servicos` por `textSearch` em português, até
  30), `useItensDoPdm(codigoPdm)` e `useSincronizarCatalogo()` (laço de páginas com progresso) pela Edge Function.
- Rotas: `/compras/pca` → `PcaListaPage`; `/compras/pca/:exercicio` → `PcaPlanoPage` (abas Itens e Orçamento).

- [ ] **Step 1:** `PcaListaPage`: cartões por exercício com situação, nº de itens e total; botão "Novo PCA" (exercício
  padrão = ano atual + 1); duplicidade (`23505`) vira toast "Já existe PCA para este exercício".
- [ ] **Step 2:** `PcaItensTab`: tabela com filtros setor, fonte, mês, prioridade e grupo; "Lançar DFD" abre
  `PcaItemDialog` (react-hook-form + zod: `numero_sei` obrigatório, quantidade > 0, valor ≥ 0, mês 1–12, ação e fonte
  obrigatórias); `CatalogoBusca` escolhe PDM/serviço e, para material, o item do PDM; se `useItensDoPdm` falhar,
  aviso "Não foi possível carregar os itens do portal; dá para salvar só com o tipo de item" e segue com
  `codigo_item = null`. Escolher item chama `gravar_item` antes de salvar.
- [ ] **Step 3:** `PcaOrcamentoTab`: tabela ação × fonte com teto editável (só com `compras.pca.editar`), planejado,
  diferença (sobra em texto de sucesso, falta em texto de perigo, tokens do design system) e linha de totais; aviso
  quando houver QDD do exercício em `fin_dotacoes`, com o botão "Usar o QDD", que grava os tetos com `origem = 'qdd'`
  somando `valor_atual` por ação × fonte do exercício (com confirmação: substitui os tetos digitados).
- [ ] **Step 4:** botões de gravar escondidos sem `compras.pca.editar` (`hasPermission`); "Atualizar catálogo" mostra
  data da última sincronização e progresso por página.
- [ ] **Step 5:** registrar rotas em `App.tsx` e menu; rodar `npx vitest run src/shared/config src/codigo-alcancavel.test.ts`
  — PASSA (rota cai no módulo `compras`; arquivos alcançáveis).
- [ ] **Step 6:** `bun run dev` com dados fictícios: criar PCA 2027, digitar teto, lançar um material e um serviço,
  conferir orçamento; captura das telas (larga e celular) em `/mnt/project-files/pca/entrega1/`.
- [ ] **Step 7:** commit "Compras: telas do PCA (itens e orçamento)".

### Task 5: Docs e verificação final

**Files:**
- Modify: `docs/BANCO_DE_DADOS.md`, `docs/GUIA_FRONTEND.md`, `docs/NOVO_BANCO.md`, `docs/RBAC_PERMISSOES.md` (permissões
  novas), `docs/planejamento/ROADMAP.md`, `docs/ESTADO_DO_SISTEMA.md` (`bun run estado`), módulo de compras em `docs/`
  se a matriz pedir.

- [ ] **Step 1:** `node scripts/check-docs-matriz.mjs --base origin/main` — sem pendência.
- [ ] **Step 2:** `bash scripts/gate.sh` — verde (resultado lido).
- [ ] **Step 3:** revisão com `revisor-codigo-idjuv` e `revisor-seguranca-idjuv` (RLS, Edge Function); corrigir
  bloqueantes.
- [ ] **Step 4:** mesclar `origin/main`, conferir conflito, push e PR rascunho.
