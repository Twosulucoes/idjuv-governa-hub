# Passagens aéreas, entrega 1 (beneficiários, pedidos, passageiros, trechos, cotação e emissão): plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** o setor cadastra cada pedido de passagem pelo nº do processo SEI, com os passageiros (servidor do RH ou
beneficiário de fora) e os trechos, registra as cotações da agência, a aprovação do Presidente (data e nº do documento
SEI) e a emissão (localizador, bilhete e valores), e vê na lista quanto já foi emitido no contrato da agência.

**Architecture:** migração única com as tabelas `passagem_*` (RLS gerada de `rls/mapa.csv`), permissões novas no
catálogo e funções `SECURITY DEFINER` estreitas para ler o nome do servidor e as viagens do RH sem abrir a RLS do RH;
front em `/contratos/passagens` com hook React Query e regras puras em `src/lib/passagens/`.

**Tech Stack:** Postgres/Supabase (RLS, gatilhos), React 18 + shadcn/ui + react-hook-form/zod, React Query, vitest.

**Spec:** [`docs/superpowers/specs/2026-10-24-contratos-passagens-aereas-design.md`](../specs/2026-10-24-contratos-passagens-aereas-design.md)
(§3, §6 e §7 itens 1 a 4; prestação de contas, anexos e pendências são da entrega 2; faturas, saldo e relatórios, da 3).

## Global Constraints

- Português em nomes, comentários e rótulos; páginas `*Page.tsx`; hooks `use<Dominio>`; imports `@/`.
- Toda tabela nova com RLS na mesma migração; policies geradas por `node scripts/db/gerar-rls.mjs` a partir de
  `supabase/baseline/rls/mapa.csv`. Função nova: `SET search_path = public`, `REVOKE ... FROM PUBLIC, anon` e `GRANT`
  só para quem precisa.
- Permissões novas (módulo `contratos`, categoria `Passagens`): `contratos.passagens.visualizar` (ler) e
  `contratos.passagens.editar` (gravar), concedidas a quem já tem `contratos.criar`. `contratos.passagens.financeiro`
  fica para a entrega 3. Rotas com `ProtectedRoute requiredModule="contratos" requiredPermissions="contratos.passagens.visualizar"`.
- Pedido e beneficiário não se apagam pela API (pedido sai por `situacao = 'cancelado'`; beneficiário por `ativo = false`).
  Passageiro, trecho e cotação apagam com `editar`, mas um gatilho recusa apagar trecho já emitido.
- O SEI não é tocado: nada de tramitar, assinar ou redigir ato. Aprovação = data + nº do documento SEI.
- CPF e documento do beneficiário só com a permissão do módulo; nunca em log nem em tela pública.
- Não editar `src/integrations/supabase/client.ts`; `types.ts` sai de `bash scripts/db/gerar-tipos.sh`.
- `bash scripts/gate.sh` verde; docs da matriz + `docs/planejamento/ROADMAP.md` na mesma PR.

## Review Focus

1. Usuário só com `visualizar`: vê tudo, sem botões de gravar, e a RLS recusa a escrita.
2. Passageiro servidor: o nome aparece para quem não tem o RH (cópia gravada pelo gatilho), sem expor outros dados do servidor.
3. Pedido "aprovado" sem nº do documento SEI ou trecho "emitido" sem localizador/tarifa: o banco recusa (CHECK).
4. Trecho emitido não some: apagar é recusado; o caminho é "cancelado" ou "reembolsado".
5. Nº SEI repetido: erro em português ("já existe pedido com este processo SEI").

---

### Task 1: Migração, RLS, baseline e tipos (agente `dev-banco-supabase`)

**Files:** `supabase/migrations/20261030090000_contratos_passagens.sql` (novo); `supabase/baseline/rls/mapa.csv`,
`rls/35_policies_geradas.sql` (gerado), `overlay/40_privilegios.sql`, `schema/01_pre_data.sql` e `03_post_data.sql`
(regenerados), `supabase/baseline/README.md`, `scripts/db/testar-rls.sql`, `src/integrations/supabase/types.ts` (gerado).

**Tabelas:**

- `passagem_beneficiarios(id, nome, cpf text UNIQUE CHECK 11 dígitos, data_nascimento, documento_tipo, documento_numero,
  documento_orgao, telefone, email, instituicao_id FK instituicoes NULL, instituicao_nome, observacoes, ativo bool,
  created_at/by, updated_at/by)`.
- `passagem_pedidos(id, numero_sei text UNIQUE, data_pedido date, origem CHECK IN ('sei','email','oficio','outro'),
  solicitante_tipo CHECK IN ('servidor','beneficiario','instituicao'), solicitante_servidor_id, solicitante_beneficiario_id,
  solicitante_instituicao_id, solicitante_nome (cópia), contrato_id FK contratos NULL, finalidade, evento,
  destino_cidade, destino_uf, data_inicio, data_fim, prestacao_contas CHECK IN ('individual','evento','dispensado')
  DEFAULT 'individual', situacao CHECK IN ('recebido','cotacao_solicitada','cotacao_recebida','aprovado','emitido',
  'concluido','cancelado') DEFAULT 'recebido', aprovacao_documento_sei, aprovacao_data, cancelamento_motivo,
  observacoes, carimbos)`. CHECK: `aprovado/emitido/concluido` ⇒ documento e data da aprovação; `cancelado` ⇒ motivo.
- `passagem_passageiros(id, pedido_id FK, servidor_id FK servidores NULL, beneficiario_id FK NULL, nome (cópia pelo
  gatilho), viagem_id FK viagens_diarias NULL, observacoes, carimbos)`. CHECK: exatamente um de servidor/beneficiário;
  UNIQUE (pedido, servidor) e (pedido, beneficiário).
- `passagem_trechos(id, passageiro_id FK, ordem, origem, destino, data_voo, situacao CHECK IN ('a_cotar','cotado',
  'emitido','remarcado','cancelado','reembolsado') DEFAULT 'a_cotar', companhia, voo, partida timestamptz, chegada,
  localizador, numero_bilhete, data_emissao, valor_tarifa, valor_taxa_embarque, valor_taxa_servico, valor_desconto
  (todos ≥ 0, DEFAULT 0), valor_multa, valor_reembolso, observacoes, carimbos)`. CHECK: emitido/remarcado/reembolsado ⇒
  localizador e data de emissão.
- `passagem_cotacoes(id, trecho_id FK, companhia, voo, partida, chegada, valor numeric ≥ 0, escolhida bool, observacoes,
  carimbos)`, com índice único parcial (uma escolhida por trecho).
- `passagem_historico(id, pedido_id, tabela, registro_id, acao, antes jsonb, depois jsonb, feito_por, feito_em)`:
  trilha das mudanças de situação do pedido e do trecho (gatilho `SECURITY DEFINER`, sem EXECUTE pela API).

**Funções:**
- `passagem_carimbar()` (autoria), `passagem_copiar_nome()` (grava `nome` do passageiro e `solicitante_nome` a partir de
  `servidores`/`passagem_beneficiarios`/`instituicoes`; `SECURITY DEFINER`), `passagem_proteger_emitido()` (recusa
  DELETE de trecho com localizador).
- `passagem_buscar_servidores(_termo text)` → id, nome, matrícula, cargo dos servidores ativos (só com a permissão).
- `passagem_viagens_servidor(_servidor_id uuid)` → id, destino, datas, situação das viagens do RH (só com a permissão).

**RLS (mapa.csv, classe `permissao`, módulo `contratos`):** leitura `contratos.passagens.visualizar|editar`; escrita
`contratos.passagens.editar`; `excluir=ninguem` em pedidos e beneficiários; histórico só leitura.

- [ ] Escrever a migração, rodar `gerar-rls.mjs`, `validar-baseline.sh` com `PG_REPLAY` e casos em `testar-rls.sql`
  (sem permissão não lê; `visualizar` não grava; apagar trecho emitido falha; CHECKs de aprovação e emissão)
- [ ] Regenerar o baseline e os tipos

### Task 2: Tipos e regras puras (agente `dev-frontend-idjuv`, TDD)

**Files:** `src/types/passagens.ts`, `src/lib/passagens/regras.ts`, `src/lib/passagens/regras.test.ts`.

- `valorTrecho(trecho)`: emitido/remarcado = tarifa + embarque + serviço − desconto + multa; reembolsado = isso −
  reembolso; cancelado sem emissão = 0; a_cotar/cotado = 0.
- `valorPedido(trechos)`, `resumoPedido` (passageiros, trechos emitidos/pendentes).
- `proximasSituacoes(situacao)` e `podeIrPara(pedido, nova)` (aprovado exige documento; emitido exige ao menos um trecho
  emitido; concluído exige todos os trechos fechados).
- `cpfValido` (reaproveitar o validador que já existe em `src/lib`, se houver).

### Task 3: Hook de dados (agente `dev-frontend-idjuv`)

**Files:** `src/hooks/usePassagens.ts` — listagem com filtros (situação, período, texto), ficha do pedido com
passageiros/trechos/cotações, mutations (pedido, passageiro, trecho, cotação, emissão, situação), beneficiários (busca,
criar, editar), `passagem_buscar_servidores`, `passagem_viagens_servidor`, contratos do módulo com fornecedor.
Erro de RLS → `SemPermissaoError`; duplicidade do nº SEI/CPF → mensagem em português.

### Task 4: Telas (agente `dev-frontend-idjuv`, skill `ui-ux-pro-max`)

**Files:** `src/pages/contratos/PassagensPedidosPage.tsx`, `PassagemPedidoDetalhePage.tsx`,
`PassagensBeneficiariosPage.tsx`; componentes em `src/components/contratos/passagens/` (formulário do pedido,
passageiro, trecho, cotação, emissão, mudança de situação, beneficiário, escolha do contrato com cadastro mínimo).

- Lista: nº SEI, solicitante, evento, nº de passageiros, situação (badge), valor emitido; filtros; "Novo pedido";
  topo com o contrato escolhido: valor, emitido no sistema e saldo (só o emitido; faturado e pago na entrega 3).
- Ficha: abas Dados · Passageiros e trechos · Histórico (a aba Prestação de contas vem na entrega 2).
- Beneficiários: busca por nome/CPF (CPF mascarado na lista), cadastro, viagens de cada um.
- Celular (390px) e desktop; tokens do design system, sem cor crua.

### Task 5: Rotas, menu e módulo (agente `dev-frontend-idjuv`)

**Files:** `src/App.tsx` (3 rotas no bloco de Contratos), `src/config/module-menus.config.ts` (item "Passagens aéreas"),
`src/shared/config/modules.config.ts` se a rota precisar.

### Task 6: Docs (agente `documentador-idjuv`)

`docs/MODULOS.md`, `docs/BANCO_DE_DADOS.md`, `docs/RBAC_PERMISSOES.md`, `docs/GUIA_FRONTEND.md`,
`docs/planejamento/ROADMAP.md`, `npm run estado`; conferir com `node scripts/check-docs-matriz.mjs --base origin/main`.

### Task 7: Revisão e verificação

- [ ] `revisor-codigo-idjuv` e `revisor-seguranca-idjuv` sem bloqueantes
- [ ] `bash scripts/gate.sh` verde (saída lida)
- [ ] Telas vistas no navegador em 390px e desktop, com prints em `/mnt/project-files/passagens/entrega1/`
