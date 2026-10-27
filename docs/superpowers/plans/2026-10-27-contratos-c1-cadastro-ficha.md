# Contratos, entrega C1 (cadastro, lista, ficha e responsáveis): plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Situação:** aguardando o "sim" do dono (27/10/2026). Nada é construído antes.

**Goal:** o NuAC cadastra (ou importa por planilha) cada contrato do IDJUV com o processo SEI, o contratado, o
objeto, os valores, a vigência, o setor que pediu e os responsáveis designados (gestor e fiscais, com a portaria do
SEI); todos que têm o módulo veem a lista com o selo de vencimento e a ficha completa do contrato, com itens e
histórico. O contrato da agência de passagens continua funcionando igual e ganha a ficha.

**Architecture:** uma migração que completa a tabela `contratos` (colunas novas, número único por ano), cria
`contrato_responsaveis`, aperta a RLS de `contratos` e `itens_contrato` (permissão em vez de só módulo), cria a função
de importação com simulação e põe o contrato no localizador do SEI. Front em `/contratos/lista` e `/contratos/:id`, com
hook React Query `useContratos` e regras puras de vigência em `src/lib/contratos/`.

**Tech Stack:** Postgres/Supabase (RLS gerada do `mapa.csv`, gatilhos), React 18 + shadcn/ui + react-hook-form/zod,
React Query, vitest, motor de documentos.

**Spec:** [`docs/superpowers/specs/2026-10-27-contratos-gestao-completa-design.md`](../specs/2026-10-27-contratos-gestao-completa-design.md) §4, C1.

## Decisões para o dono antes de começar

1. **(Obrigatória: muda RLS existente.)** Hoje qualquer pessoa com o módulo Compras **ou** Contratos pode criar,
   editar e **apagar** qualquer contrato pela API. Proposta: ler continua com o módulo (Compras e Contratos); criar
   exige `contratos.criar`; editar exige `contratos.editar`; ninguém apaga pela API (o contrato sai por situação
   "rescindido" ou "encerrado"; o rascunho errado pode ser apagado só pela pessoa com `contratos.editar` enquanto
   estiver em rascunho). As mesmas regras valem para os itens do contrato.
2. O número do contrato passa a ser único **por ano** (hoje é único para sempre, o que impediria o 01/2027 depois do
   01/2026).

## Global Constraints

- Português em nomes, comentários e rótulos; páginas `*Page.tsx`; hooks `use<Dominio>`; imports `@/`.
- RLS de toda tabela nova na mesma migração; policies geradas por `node scripts/db/gerar-rls.mjs` a partir de
  `supabase/baseline/rls/mapa.csv`. Função nova com `SET search_path = public`, `REVOKE ... FROM PUBLIC, anon` e `GRANT`
  só para `authenticated` quando a tela chama.
- O SEI não é tocado: o sistema guarda nº do processo, nº e data do documento, DOE e PNCP. Nada de redigir contrato.
- Sem permissão nova nesta entrega: usa `contratos.visualizar`, `contratos.criar` e `contratos.editar`, que já existem.
  `contratos.fiscalizar` e `contratos.financeiro` entram na C3/C4.
- CPF do representante do contratado nunca aparece na lista; só na ficha do fornecedor, com o módulo.
- Não editar `src/integrations/supabase/client.ts`; `types.ts` sai de `bash scripts/db/gerar-tipos.sh`.
- `bash scripts/gate.sh` verde; docs da matriz + `docs/planejamento/ROADMAP.md` na mesma PR.

## Review Focus

1. Usuário só com `contratos.visualizar`: vê lista e ficha, não vê botões de gravar, e a RLS recusa gravar e apagar.
2. Passagens: o cadastro rápido do contrato da agência (`ContratoCadastroDialog`) continua funcionando para quem tem
   `contratos.criar`; a lista de pedidos e as faturas não mudam.
3. Responsáveis: um gestor ativo por contrato; fiscal pode ter mais de um; encerrar a designação guarda a data e o
   motivo; `contratos.gestor_id`/`fiscal_id` continuam espelhando o gestor e o primeiro fiscal técnico ativos.
4. Importação: simula sem gravar; nunca sobrescreve contrato existente (só completa campo vazio); erro por linha em
   português.
5. Vigência: a regra de faixa (vencido, 30, 60, 90, 120 dias, vigente) tem teste e usa a data de fim atual.

---

### Task 1: Migração, RLS, baseline e tipos (agente `dev-banco-supabase`)

**Files:** `supabase/migrations/20261104090000_contratos_c1_cadastro.sql` (novo); `supabase/baseline/rls/mapa.csv`,
`rls/35_policies_geradas.sql` (gerado), `overlay/40_privilegios.sql`, `schema/01_pre_data.sql` e `03_post_data.sql`
(regenerados), `scripts/db/testar-rls.sql`, `src/integrations/supabase/types.ts` (gerado).

**`contratos`, colunas novas:**
- `processo_sei text` (normalizado por `sei_normalizar` no gatilho), `numero_pncp text`, `fundamento_legal text`
  (ex.: "Pregão eletrônico 05/2025, Lei 14.133/2021").
- `tipo_contrato text CHECK IN ('servico_continuo','servico_escopo','fornecimento','obra','locacao','outro')`.
- `prorrogavel boolean DEFAULT false`, `prazo_maximo_meses integer CHECK > 0`.
- `unidade_demandante_id uuid FK estrutura_organizacional NULL`, `natureza_despesa text` (ex.: 3.3.90.39).
- `data_fim_atual` passa a ser preenchida com `data_fim` quando vier vazia (gatilho); a C2 a recalcula pelas alterações.
- Troca `UNIQUE (numero_contrato)` por `UNIQUE (numero_contrato, ano)`.

**Tabela nova `contrato_responsaveis`:** `id, contrato_id FK contratos, servidor_id FK servidores, nome (cópia pelo
gatilho), papel CHECK IN ('gestor','gestor_substituto','fiscal_tecnico','fiscal_administrativo','fiscal_substituto'),
portaria_numero, portaria_documento_sei, portaria_data date, data_inicio date NOT NULL, data_fim date NULL,
motivo_saida text, carimbos`. CHECK `data_fim >= data_inicio`; `data_fim` ⇒ `motivo_saida`. Índice único parcial: um
`gestor` ativo por contrato; `(contrato, papel, servidor)` ativo único.

**Gatilhos:** `contrato_resp_copiar_nome` (`SECURITY DEFINER`, só o nome do servidor);
`contrato_resp_espelhar` (mantém `contratos.gestor_id` e `fiscal_id`); auditoria `fn_audit_log_licitacoes` também em
`contrato_responsaveis` (a aba Histórico lê `audit_log_licitacoes`). Carga inicial: `gestor_id`/`fiscal_id` que já
existem viram responsáveis com início na data de início do contrato.

**RLS (`mapa.csv`):** `contratos`, `itens_contrato` e `contrato_responsaveis` na classe `permissao`: ler com o módulo
(Compras ou Contratos); inserir com `contratos.criar`; atualizar com `contratos.editar`; apagar só `contratos` em
`rascunho` e com `contratos.editar` (função `contrato_pode_apagar`); itens e responsáveis apagam com `editar`.

**Funções:**
- `contratos_importar_planilha(p_linhas jsonb, p_gravar boolean DEFAULT false) RETURNS jsonb`, `SECURITY INVOKER`,
  exige `contratos.criar`. Por linha: nº/ano, processo SEI, CNPJ/CPF e razão social do contratado (cria o fornecedor
  se não existir), objeto, tipo, valor inicial e atual, assinatura, início e fim, setor (sigla da estrutura), gestor e
  fiscais (matrícula), portaria. Simula com `p_gravar = false` (exceção de rollback, como `rh_importar_quadro_vagas`).
  Contrato existente (nº + ano) só ganha o que está vazio; nunca sobrescreve.
- `localizar_processos_sei`: o contrato entra como mais uma fonte (nº SEI, objeto, contratado, link para a ficha).

**Verificação:** `scripts/db/validar-baseline.sh` com `PG_REPLAY`; `testar-rls.sql` com as personas visualizar,
criar, editar e sem módulo (recusa apagar contrato vigente; aceita apagar rascunho com editar).

### Task 2: Regras puras de vigência (agente `dev-frontend-idjuv`, TDD)

**Files:** `src/lib/contratos/vigencia.ts`, `src/lib/contratos/vigencia.test.ts`.

`situacaoVigencia(contrato, hoje)` → `{ faixa: 'vencido' | 'ate30' | 'ate60' | 'ate90' | 'ate120' | 'vigente' |
'encerrado' | 'rascunho', dias }`, usando `data_fim_atual ?? data_fim` e a situação. `rotuloFaixa`, `variantFaixa`
(tokens do design system, sem cor crua). Testes cobrem a virada de cada faixa, contrato encerrado e rescindido.

### Task 3: Hook de dados (agente `dev-frontend-idjuv`)

**Files:** `src/hooks/useContratos.ts`.

`useContratosLista(filtros)` (colunas explícitas, filtro no banco, paginação de 1000 com aviso), `useContrato(id)`,
`useSalvarContrato`, `useItensContrato`, `useSalvarItem`/`useExcluirItem`, `useResponsaveisContrato`,
`useDesignarResponsavel`/`useEncerrarDesignacao`, `useHistoricoContrato` (`audit_log_licitacoes`),
`useImportarContratos` (RPC). Erros do banco traduzidos para português.

### Task 4: Telas (agente `dev-frontend-idjuv`, skill `ui-ux-pro-max`)

**Files:** `src/pages/contratos/ContratosListaPage.tsx`, `src/pages/contratos/ContratoFichaPage.tsx`,
`src/components/contratos/ContratoFormDialog.tsx`, `ResponsaveisContratoTab.tsx`, `ItensContratoTab.tsx`,
`HistoricoContratoTab.tsx`, `ImportarContratosDialog.tsx`, `SeloVigencia.tsx`.

- **Lista** `/contratos/lista`: nº/ano, objeto resumido, contratado, setor, gestor, valor atual, vigência com selo;
  busca (nº, objeto, contratado, nº SEI) e filtros (situação, faixa de vencimento, setor, gestor); botões "Novo
  contrato" e "Importar planilha" (com `contratos.criar`); exportar planilha.
- **Ficha** `/contratos/:id`: cabeçalho (nº/ano, contratado, situação, selo, valor atual, "Copiar nº SEI"); abas
  **Dados** (editar com `contratos.editar`), **Itens**, **Responsáveis** (designar e encerrar, com a portaria),
  **Histórico**; quando `controla_passagens`, um cartão leva aos pedidos e às faturas de passagens.
- **Formulário** (zod): contratado por busca de fornecedor com cadastro rápido; setor pela estrutura organizacional;
  valores ≥ 0; fim ≥ início.
- Celular (390px) e escuro conferidos com Playwright.

### Task 5: Rotas, menu, painel e PDF (agente `dev-frontend-idjuv`, skill `novo-documento-idjuv`)

**Files:** `src/App.tsx`, `src/config/module-menus.config.ts`, `src/config/menu.config.ts`,
`src/pages/modulos/ContratosDashboardPage.tsx`, `src/hooks/dashboard/useContratosDashboardStats.ts`,
`src/lib/documentos/modelos/contrato-ficha.ts` (novo), `src/lib/importacao/importadores/` (registro na Central de
Importações).

- Rotas com `ProtectedRoute requiredModule="contratos" requiredPermissions="contratos.visualizar"`; `/contratos/lista`
  antes de `/contratos/:id` e das rotas de passagens.
- Menu de Contratos: "Contratos" primeiro, depois os itens de passagens.
- Painel: cartões de vigentes, vencendo em 90 dias, sem gestor ou fiscal designado e valor vigente; atalho para a lista.
- PDF "Ficha do contrato" pelo motor.
- Importador "Contratos (planilha)" na Central de Importações, com modelo para baixar.

### Task 6: Revisão, verificação e docs

- `revisor-codigo-idjuv` e `revisor-seguranca-idjuv` (mexe em RLS).
- `bash scripts/gate.sh`; prints (claro, escuro, celular) em `/mnt/project-files/contratos/c1/`.
- Docs: `MODULOS.md` (Contratos), `BANCO_DE_DADOS.md`, `RBAC_PERMISSOES.md`, `ROADMAP.md` (P21), guia passo a passo
  para o dono (onde clicar para cadastrar, importar e designar).
- Depois do merge: aprovar a migração no ambiente `producao`.
