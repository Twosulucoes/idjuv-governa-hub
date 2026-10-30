# Contratos, entrega C2 (alterações e vencimentos): plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Situação:** aprovado pelo dono em 30/10/2026 ("Sim, pode fazer como está") e construído na mesma data (PR rascunho). O aviso por e-mail ficou para uma entrega curta depois.

## Em poucas palavras (para o Fabiano)

1. **Aba Alterações na ficha do contrato.** O NuAC registra cada termo aditivo, apostilamento, suspensão e rescisão
   com o nº do documento no SEI, a data e o DOE. O ato continua sendo feito no SEI; aqui só se registra.
2. **O valor atual e o fim da vigência deixam de ser digitados.** O sistema soma as alterações: valor inicial +
   acréscimos − supressões ± reajustes, e o fim atual é o da última prorrogação. Rescisão e suspensão mudam a
   situação do contrato sozinhas.
3. **Aviso dos limites da lei.** Quando os acréscimos passam de 25% do valor inicial (50% em reforma, art. 125 da Lei
   14.133) ou o prazo passa do máximo do contrato, aparece um aviso em vermelho. O sistema avisa, não trava.
4. **Tela Vencimentos** (menu Contratos → Vencimentos): o que vence em 30, 60, 90 e 120 dias e o que já venceu, com
   a ação esperada (prorrogar, nova contratação ou encerrar). O NuAC registra a providência e o nº do processo SEI da
   prorrogação, e o contrato some da lista de pendentes quando o aditivo de prazo é registrado.
5. **Aviso no sino.** O gestor e os fiscais veem no sino os contratos deles que estão vencendo. Quem tem "Editar
   contratos" vê todos. O que vence em até 30 dias conta no número vermelho do sino.
6. **Nada muda nos números de hoje.** Contrato que já está no sistema com valor atual ou fim diferente do original
   ganha uma linha "Situação anterior ao sistema" com a diferença. Depois, se quiser, o NuAC troca essa linha pelos
   aditivos de verdade.

**O aviso por e-mail ao gestor e aos fiscais fica para uma entrega curta depois** (recomendado), porque depende de o
envio de e-mail estar configurado em Administração e de uma rotina diária no GitHub com uma chave que você mesmo
cadastra. Se preferir já nesta entrega, é a opção 2 do cartão.

## Decisões para o dono antes de começar

1. **(Obrigatória: regra de acesso.)** Tabela nova de alterações: ler com o módulo Compras ou Contratos; registrar,
   corrigir e apagar só com **"Editar contratos"** (`contratos.editar`), porque a alteração muda o valor e o prazo do
   contrato. Quem só tem "Criar contratos" não registra aditivo.
2. **(Muda regra existente.)** `valor_atual` e `data_fim_atual` passam a ser calculados pelo banco; o formulário do
   contrato deixa de ter esses dois campos. Rescisão e suspensão passam a ser registradas na aba Alterações (com o
   documento do SEI) e mudam a situação sozinhas; o formulário deixa de oferecer "Suspenso" e "Rescindido" (contrato
   que já está assim continua assim).
3. A tabela antiga `aditivos_contrato` (sem tela, nunca usada pelo sistema) é trocada pela nova. Se tiver alguma
   linha em produção, ela é copiada antes, sem perder campo.
4. Prazos de aviso fixos em 120, 90, 60 e 30 dias (os mesmos dos filtros da C1). Se quiser outros, me diga.

## Goal

O NuAC registra toda alteração do contrato (aditivo, apostilamento, suspensão, rescisão) com o documento do SEI; o
valor atual, o fim da vigência e a situação passam a sair dessas alterações; quem acompanha vê o que vence e o que já
está sendo providenciado; gestor e fiscais são avisados no sino.

**Architecture:** uma migração cria `contrato_alteracoes` (RLS pela matriz), copia e remove `aditivos_contrato`,
recalcula valor/fim/situação no gatilho `contratos_preparar` (agora `SECURITY DEFINER`, para o recálculo não depender
da RLS de quem grava), cria a "situação anterior" dos contratos que já divergem, ganha colunas de providência de
renovação e de reforma, e a função do sino. Front: aba Alterações, página `/contratos/vencimentos`, sino, formulário,
painel, PDF e importação ajustados.

**Tech Stack:** Postgres/Supabase (RLS gerada do `mapa.csv`, gatilhos), React 18 + shadcn/ui + react-hook-form/zod,
React Query, vitest, motor de documentos.

**Spec:** [`docs/superpowers/specs/2026-10-27-contratos-gestao-completa-design.md`](../specs/2026-10-27-contratos-gestao-completa-design.md) §4, C2.

## Global Constraints

- Português em nomes, comentários e rótulos; páginas `*Page.tsx`; hooks `use<Dominio>`; imports `@/`.
- RLS de toda tabela nova na mesma migração; policies geradas por `node scripts/db/gerar-rls.mjs` a partir de
  `supabase/baseline/rls/mapa.csv`. Função nova com `SET search_path = public`, `REVOKE ... FROM PUBLIC, anon` e
  `GRANT` só para `authenticated` quando a tela chama.
- O ato é do SEI: nada de redigir aditivo, apostila, ordem de paralisação ou termo de rescisão.
- Sem permissão nova: `contratos.visualizar`, `contratos.criar`, `contratos.editar`. `contratos.fiscalizar` e
  `contratos.financeiro` continuam para a C3/C4.
- A migração não muda nenhum valor atual nem fim atual que já esteja gravado (a "situação anterior" absorve a
  diferença); a contagem dos contratos que mudariam sai em `RAISE NOTICE`.
- Não editar `src/integrations/supabase/client.ts`; `types.ts` sai de `bash scripts/db/gerar-tipos.sh`.
- `bash scripts/gate.sh` verde; docs da matriz + `docs/planejamento/ROADMAP.md` na mesma PR.

## Review Focus

1. Usuário com "Passagens" que marca o contrato da agência não zera o valor atual (o recálculo não pode depender da RLS
   de quem grava).
2. Só `contratos.editar` registra, corrige e apaga alteração; `criar` e `visualizar` recebem recusa do banco.
3. Valor e fim batem com as alterações em toda combinação: aditivo de prazo, de valor, de prazo e valor, supressão,
   apostila de reajuste (para cima e para baixo), situação anterior, rescisão, suspensão aberta e retomada; apagar a
   alteração desfaz o efeito.
4. Migração em banco com contratos da C1 (valor atual e fim já digitados) não muda nenhum número.
5. Vencimentos e sino: rascunho, encerrado e rescindido ficam de fora; o gestor vê só os dele; o servidor sem o
   módulo vê o aviso no sino, mas não abre a ficha.

---

### Task 1: Migração, RLS, baseline e tipos (agente `dev-banco-supabase`)

**Files:** `supabase/migrations/20261114090000_contratos_c2_alteracoes.sql` (novo); `supabase/baseline/rls/mapa.csv`,
`rls/35_policies_geradas.sql` (gerado), `schema/01_pre_data.sql` e `03_post_data.sql` (regenerados),
`supabase/baseline/dados-demo/04_compras_processos.sql` (aditivos de demonstração na tabela nova),
`scripts/db/testar-rls.sql`, `src/integrations/supabase/types.ts` (gerado).

**Tabela nova `contrato_alteracoes`:**
- `id`, `contrato_id` FK `contratos` ON DELETE CASCADE.
- `especie text CHECK IN ('aditivo','apostilamento','suspensao','rescisao','partida')` (partida = "situação anterior
  ao sistema").
- `numero integer` (1º, 2º… por espécie; obrigatório em aditivo e apostilamento), único por (contrato, espécie, nº).
- Aditivo: `altera_prazo`, `altera_valor`, `altera_objeto` (pelo menos um), `nova_data_fim` (se prazo),
  `valor_acrescimo` e `valor_supressao` (≥ 0; se valor, pelo menos um > 0).
- Apostilamento: `motivo IN ('reajuste','repactuacao','dotacao','prorrogacao_suspensao','outro')`,
  `valor_variacao` (com sinal), `percentual`, `indice`, `nova_data_fim` só em `prorrogacao_suspensao` (art. 115, §5º).
- Suspensão: `data_inicio` (paralisação), `data_retomada` (vazia enquanto parado), `documento_retomada_sei`; uma
  suspensão aberta por contrato.
- Rescisão: `data_inicio` (data da extinção), `motivo IN ('unilateral','consensual','judicial')`; uma por contrato.
- Partida: `valor_variacao` e/ou `nova_data_fim`; uma por contrato.
- Comuns: `descricao` (obrigatória, ≤ 2000), `justificativa` (≤ 2000), `fundamento_legal` (≤ 500), `processo_sei`,
  `documento_sei`, `data_assinatura` (obrigatória em aditivo, apostilamento e rescisão), `data_publicacao_doe`,
  `numero_doe`, carimbos (`created_*`, `updated_*`) fixados pelo gatilho.

**Gatilhos:**
- `contrato_alteracoes_preparar` (BEFORE): autoria; não troca de contrato; recusa alteração em contrato rascunho e
  alteração nova em contrato rescindido (exceto a própria rescisão); datas não antes do início do contrato;
  `processo_sei` vazio herda o do contrato.
- `contrato_alteracoes_aplicar` (AFTER INSERT/UPDATE/DELETE): toca o contrato (`UPDATE contratos SET updated_at`), o
  que dispara o recálculo.
- `contratos_preparar` passa a `SECURITY DEFINER` e recalcula a cada gravação:
  `valor_atual = valor_inicial + Σ(acréscimo − supressão + variação)`; `data_fim_atual = data da rescisão` ou a
  `nova_data_fim` da última alteração (por assinatura; a partida conta como a mais antiga) ou `data_fim`;
  situação `rescindido` com rescisão, `suspenso` com suspensão aberta, e volta a `vigente` quando a rescisão ou a
  suspensão sai; `saldo_contrato` acompanha o valor atual; mudou o fim atual, a providência de renovação é limpa.
- Auditoria `fn_audit_log_licitacoes` em `contrato_alteracoes` (a aba Histórico já lê a trilha).

**`contratos`, colunas novas:** `reforma boolean DEFAULT false` (limite de 50%); `renovacao_providencia text CHECK
IN ('prorrogar','nova_contratacao','encerrar')`, `renovacao_processo_sei`, `renovacao_observacao`,
`renovacao_atualizada_em`.

**Carga:** copia `aditivos_contrato` → `contrato_alteracoes` (prazo/valor/prazo_valor/objeto/supressão/reequilíbrio
viram aditivo; apostilamento vira apostilamento), cria a partida de cada contrato cujo valor atual ou fim atual
gravado difere do calculado, recalcula com auditoria desligada, confere que nada mudou e remove `aditivos_contrato`
e o tipo `tipo_aditivo`.

**RLS (`mapa.csv`):** `contrato_alteracoes` classe `permissao`: ler com o módulo Compras ou Contratos;
`escrita=contratos.editar;excluir=contratos.editar`. Linha de `aditivos_contrato` sai.

**Funções:**
- `contratos_meus_vencimentos()` (`SECURITY DEFINER`, para o sino): contratos vigentes ou suspensos que vencem em até
  120 dias ou já venceram, em que o usuário é responsável ativo (pelo `profiles.servidor_id`); com
  `contratos.editar`, todos. Devolve só id, nº/ano, objeto resumido, fim atual, papel e se o usuário abre a ficha.
- `contratos_importar_planilha`: contrato novo com "Valor atual" diferente do inicial ganha a partida com a diferença.
- `localizar_processos_sei`: o processo SEI de uma alteração e o da prorrogação (providência) também levam ao contrato.

**Verificação:** `scripts/db/validar-baseline.sh` com `PG_REPLAY`; `testar-rls.sql` com as personas (visualizar,
criar, editar, passagens, sem módulo) e os cálculos do Review Focus 3 e 4.

### Task 2: Regras puras (agente `dev-frontend-idjuv`, TDD)

**Files:** `src/lib/contratos/alteracoes.ts` + teste; `src/lib/contratos/vigencia.ts` + teste.

- `resumoAlteracoes(contrato, alteracoes)`: valor inicial, acréscimos, supressões, reajustes, valor atual; % de
  acréscimo sobre o inicial atualizado e limite (25% ou 50%); prazo total × prazo máximo; texto de cada linha
  ("2º termo aditivo: prorroga até 31/12/2027 e acrescenta R$ 12.000,00").
- `acaoEsperada(contrato, hoje)`: "Abrir prorrogação no SEI" (prorrogável e dentro do máximo), "Nova contratação ou
  encerrar" (não prorrogável ou no máximo), "Vencido: regularizar"; garantia vencendo antes do fim.
- `proximoNumero(alteracoes, especie)`.

### Task 3: Hook de dados (agente `dev-frontend-idjuv`)

**Files:** `src/hooks/useContratos.ts`, `src/hooks/useContratosVencimentos.ts`.

`useAlteracoesContrato(id)`, `useSalvarAlteracao`, `useExcluirAlteracao`, `useRegistrarRetomada`,
`useSalvarProvidencia`, `useVencimentos()` (vigentes e suspensos com fim até 120 dias ou vencidos, colunas
explícitas), `useMeusVencimentos()` (RPC do sino, cache de 5 min). Invalida contrato, lista, painel e vencimentos.

### Task 4: Telas (agente `dev-frontend-idjuv`, skill `ui-ux-pro-max`)

**Files:** `src/components/contratos/AlteracoesContratoTab.tsx`, `AlteracaoFormDialog.tsx`,
`ProvidenciaRenovacaoDialog.tsx`, `src/pages/contratos/ContratosVencimentosPage.tsx`, `ContratoFichaPage.tsx`,
`ContratoFormDialog.tsx`, `src/components/avisos/AvisosSino.tsx`.

- **Aba Alterações** (entre Dados e Gestor e fiscais): quadro "valor inicial → acréscimos → supressões → reajustes →
  valor atual" e "vigência original → atual", aviso do limite de 25%/50% e do prazo máximo; linha do tempo das
  alterações; botões "Registrar alteração" e, na suspensão aberta, "Registrar retomada" (com `contratos.editar`).
- **Formulário da alteração** (zod) muda os campos pela espécie; número sugerido; processo SEI do contrato já
  preenchido; mostra antes de gravar como ficam o valor e o fim, e o aviso do limite.
- **Formulário do contrato**: sem "Valor atual" e "Fim atual" (aparecem como leitura, "calculados pelas
  alterações"); situação sem "Suspenso" e "Rescindido" para quem não está assim; caixa "Reforma de edifício ou
  equipamento (limite de 50%)".
- **Vencimentos** `/contratos/vencimentos`: cartões (vencidos, 30, 60, 90, 120 dias, garantias vencendo), tabela com
  contrato, contratado, gestor, fim atual, selo, prorrogação (até quando pode), ação esperada e providência
  registrada; filtro por faixa e "só sem providência"; planilha; "Registrar providência" (com `contratos.editar`).
- **Sino**: seção "Contratos vencendo" (até 5, com link para a ficha ou para Vencimentos); vencidos e até 30 dias
  contam no número do sino.
- Celular (390px) e escuro conferidos com Playwright.

### Task 5: Rotas, menu, painel, PDF e importação (agente `dev-frontend-idjuv`, skill `novo-documento-idjuv`)

**Files:** `src/App.tsx`, `src/config/module-menus.config.ts`, `src/pages/modulos/ContratosDashboardPage.tsx`,
`src/lib/documentos/modelos/contratos/fichaContrato.ts`, `src/lib/importacao/importadores/contratosPlanilha.ts`,
`src/lib/contratos/historico.ts`.

- Rota `/contratos/vencimentos` com `ProtectedRoute requiredModule="contratos"` e as permissões da lista, antes de
  `/contratos/:id`. Menu: Contratos, Vencimentos.
- Painel: "Vencem em até 90 dias" leva a Vencimentos; cartão novo "Sem providência (até 120 dias)".
- PDF da ficha ganha a seção Alterações.
- Importação: texto do modelo explica a "situação anterior".
- Histórico: rótulos das alterações.

### Task 6: Revisão, verificação e docs

- `revisor-codigo-idjuv` e `revisor-seguranca-idjuv` (tabela nova, gatilho `SECURITY DEFINER`, função do sino).
- `bash scripts/gate.sh`; prints (claro, escuro, celular) e guia passo a passo em `/mnt/project-files/contratos/c2/`.
- Docs: `MODULOS.md`, `BANCO_DE_DADOS.md`, `RBAC_PERMISSOES.md`, `GUIA_FRONTEND.md`, `PADRAO_DOCUMENTOS.md`,
  `ROADMAP.md` (P21), `ESTADO_DO_SISTEMA.md` (`npm run estado`).
- Depois do merge: aprovar a migração no ambiente `producao`.

## Fora desta entrega

- E-mail diário ao gestor e aos fiscais (entrega curta depois, ou já aqui se o dono escolher a opção 2).
- Notas fiscais, empenhos, medições e saldo (C3); ocorrências, relatório do fiscal, garantia e certidões (C4);
  sanções e encerramento (C5); atas (C6).
