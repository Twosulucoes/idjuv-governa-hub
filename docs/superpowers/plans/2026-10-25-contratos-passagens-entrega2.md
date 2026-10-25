# Passagens aéreas, entrega 2 (prestação de contas, anexos privados e pendências): plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** depois da viagem, o setor registra a prestação de contas de cada pedido conforme o modo escolhido
(individual, único do evento ou dispensado), guarda o cartão de embarque e o relatório como anexos privados, e vê numa
lista quem voltou e ainda não entregou, com os dias de atraso. O pedido só vai para "concluído" com a prestação em dia.

**Architecture:** uma migração que acrescenta colunas de prestação em `passagem_pedidos` e `passagem_passageiros`,
cria `passagem_anexos` (RLS pelo `mapa.csv`) e o bucket privado `passagens` (policies no overlay de storage), e passa
a devolver a situação do relatório de viagem do RH em `passagem_viagens_servidor`. No front, aba "Prestação de contas"
na ficha, tela "Pendências" e as regras de prazo em `src/lib/passagens/prestacao.ts` (vitest).

**Tech Stack:** Postgres/Supabase (RLS, Storage, gatilhos), React 18 + shadcn/ui, React Query, vitest.

**Spec:** [`docs/superpowers/specs/2026-10-24-contratos-passagens-aereas-design.md`](../specs/2026-10-24-contratos-passagens-aereas-design.md)
§4, §6 (anexos) e §7 itens 2 (aba Prestação de contas) e 5 (Pendências). Faturas, saldo × empenho e relatórios em
PDF/planilha ficam para a entrega 3.

**Depende de:** entrega 1 (PR #176). A entrega 2 sai numa PR nova a partir da `main` depois do merge da #176.

## Premissas (assumidas; ajustáveis)

1. **Prazo:** 5 dias corridos depois da data do último voo do passageiro (o retorno). O número fica em
   `module_settings` do módulo `contratos` (`settings.passagens_prazo_prestacao_dias`) e o administrador muda na
   própria tela de Pendências.
2. **Individual:** cada passageiro entrega cartão de embarque e relatório. Para servidor com viagem do RH ligada, o
   relatório já apresentado no RH (`viagens_diarias.relatorio_apresentado`) conta como entregue.
3. **Único do evento:** cada passageiro entrega o cartão de embarque; o relatório é um só, entregue pelo responsável da
   delegação (um dos passageiros, indicado no pedido).
4. **Dispensado:** nenhum relatório; o motivo é obrigatório. O cartão de embarque continua pedido.
5. O passageiro pode ser dispensado sozinho (ex.: não viajou), com motivo.
6. O relatório é um documento do SEI: registra-se a data de entrega e, se houver, o nº do documento SEI. O anexo
   é opcional.

## Global Constraints

- As mesmas da entrega 1: português; RLS na mesma migração, policies de `node scripts/db/gerar-rls.mjs`; função nova
  com `search_path` fixo e EXECUTE só para quem precisa; nada de ato do SEI; `types.ts` só por
  `bash scripts/db/gerar-tipos.sh`; gate verde; docs da matriz e ROADMAP.
- Bucket `passagens` **privado** (nada em `public/`, nada de URL pública); download por URL assinada de curta duração.
- Cartão de embarque e relatório têm dado pessoal: só quem tem a permissão de passagens lê; só `editar` grava e apaga.

## Review Focus

1. Quem não tem a permissão de passagens não lê nem baixa anexo (tabela **e** bucket).
2. `visualizar` baixa o anexo, mas não envia nem apaga.
3. Pedido "dispensado" sem motivo e passageiro dispensado sem motivo: o banco recusa.
4. A pendência some quando o item é entregue ou dispensado, e o atraso conta a partir do retorno + prazo.
5. Um pedido com pendência não vai para "concluído".

---

### Task 1: Migração, RLS, storage, baseline e tipos (agente `dev-banco-supabase`)

**Files:** `supabase/migrations/20261101090000_contratos_passagens_prestacao.sql` (novo); `supabase/baseline/rls/mapa.csv`,
`rls/35_policies_geradas.sql` (gerado), `overlay/40_privilegios.sql`, `overlay/50_storage.sql`, `schema/*` (regenerados),
`supabase/baseline/README.md`, `scripts/db/testar-rls.sql`, `src/integrations/supabase/types.ts` (gerado).

**Colunas novas:**

- `passagem_pedidos`:
  - `prestacao_dispensa_motivo text` (CHECK: `prestacao_contas = 'dispensado'` ⇒ motivo preenchido; antes da CHECK, o
    pedido dispensado sem motivo recebe "Não informado (registro anterior)");
  - `responsavel_passageiro_id uuid` FK `passagem_passageiros` ON DELETE SET NULL (responsável da delegação, no modo
    evento);
  - `relatorio_evento_entregue_em date` e `relatorio_evento_documento_sei text` (relatório único do evento).
- `passagem_passageiros`:
  - `embarque_entregue_em date` (cartão de embarque entregue);
  - `relatorio_entregue_em date` e `relatorio_documento_sei text` (modo individual);
  - `prestacao_dispensada boolean NOT NULL DEFAULT false` e `prestacao_dispensa_motivo text` (CHECK: dispensado ⇒ motivo).

**Tabela nova `passagem_anexos`:** `id, pedido_id FK (CASCADE), passageiro_id FK NULL (CASCADE), tipo CHECK IN
('cartao_embarque','bilhete','relatorio','outro'), caminho text UNIQUE (no bucket), nome_arquivo, tamanho_bytes,
mime_type, carimbos`. CHECK: o caminho começa por `<pedido_id>/`. Mapa: classe `permissao`, `escrita=contratos.passagens.editar`,
`excluir=contratos.passagens.editar`, `leitura=contratos.passagens.visualizar|contratos.passagens.editar`.

**Bucket `passagens`:** privado, 10 MB, PDF/JPEG/PNG/WEBP. Policies em `storage.objects`: SELECT com o módulo
`contratos` e `visualizar` ou `editar`; INSERT e DELETE com o módulo e `editar`; sem UPDATE (troca = apagar e enviar).

**Funções:**
- `passagem_viagens_servidor` passa a devolver também `relatorio_apresentado` e `relatorio_data` (DROP e CREATE, mesma
  checagem de `editar`); `passagem_relatorio_rh(_passageiro_ids uuid[])` devolve, para quem lê passagens, só
  `passageiro_id, relatorio_apresentado, relatorio_data` das viagens ligadas (SECURITY DEFINER, sem outros dados do RH).
- Trilha: o gatilho de histórico grava `prestacao` quando muda a entrega ou a dispensa de um passageiro ou do pedido.

- [ ] Escrever a migração, rodar `gerar-rls.mjs`, policies do bucket no overlay 50, casos em `testar-rls.sql` (sem
  permissão não lê anexo nem objeto; `visualizar` não envia; CHECKs de dispensa; relatório do RH só com a permissão)
- [ ] `validar-migracoes.sh`, `gerar-baseline.sh` (restaurar `02_dados_catalogo.sql`), `validar-baseline.sh`, `gerar-tipos.sh`

### Task 2: Regras puras (TDD, `src/lib/passagens/prestacao.ts`)

- `retornoDoPassageiro(trechos)`: data do último voo não cancelado (ou `null`).
- `pendenciasDoPassageiro(pedido, passageiro, relatorioRh, prazoDias, hoje)` → lista de `{ tipo: 'embarque' | 'relatorio',
  vencimento, diasAtraso }` conforme o modo (individual, evento, dispensado) e a dispensa do passageiro.
- `pendenciasDoPedido(...)` e `podeConcluir(...)`; `pendenciasParaSituacao` (entrega 1) passa a exigir prestação em dia
  para "concluído".

### Task 3: Hook (`src/hooks/usePassagens.ts`)

Mutations da prestação (passageiro e pedido), anexos (enviar para `passagens/<pedido>/<passageiro|pedido>/<uuid>-<nome>`,
gravar a linha; apagar linha e objeto; URL assinada de 60 s para baixar), prazo do módulo (`module_settings`), relatório
do RH (`passagem_relatorio_rh`) e a lista de pendências (pedidos em `emitido` com passageiros e trechos).

### Task 4: Telas

- **Ficha → aba "Prestação de contas":** modo do pedido (com motivo, se dispensado, e responsável, se evento); por
  passageiro: retorno, vencimento, cartão de embarque (data + anexo), relatório (data, nº SEI, anexo; para servidor,
  a situação do RH), dispensa com motivo. Relatório único do evento no topo, quando o modo é "evento".
- **Pendências** (`/contratos/passagens/pendencias`): passageiro, pedido (nº SEI e evento), o que falta, vencimento e
  dias de atraso, ordenado pelo atraso; filtro "só atrasados"; o administrador ajusta o prazo em dias.
- Menu de Contratos: "Pendências de passagens". Celular (390px) e desktop.

### Task 5: Rotas e menu

`src/App.tsx` (rota `/contratos/passagens/pendencias` com a mesma proteção das outras), `module-menus.config.ts` e
`menu.config.ts`.

### Task 6: Docs

`docs/BANCO_DE_DADOS.md`, `RBAC_PERMISSOES.md`, `GUIA_FRONTEND.md`, `ARQUITETURA.md`, `MODULOS.md`, `NOVO_BANCO.md`,
`supabase/baseline/README.md`, `ROADMAP.md`, `npm run estado`; `node scripts/check-docs-matriz.mjs --base origin/main`.

### Task 7: Revisão e verificação

- [ ] `revisor-codigo-idjuv` e `revisor-seguranca-idjuv` sem bloqueantes
- [ ] `bash scripts/gate.sh` verde (saída lida)
- [ ] Telas no navegador (390px e desktop) com prints em `/mnt/project-files/passagens/entrega2/` e guia passo a passo
