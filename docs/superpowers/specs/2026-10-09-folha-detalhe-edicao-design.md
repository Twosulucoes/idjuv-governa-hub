# Detalhe da folha: editar itens da ficha, consignações e dependentes IRRF — desenho

**Item 13 da Onda C do RH** (`docs/planejamento/FINALIZACAO.md`). Classificação: **architectural**, dividido em
**13a (front, esta entrega)** e **13b (migração, Onda B)**. Levantamento feito pelo `arquiteto-idjuv` em
2026-10-09; evidências em arquivo:linha abaixo referem-se à `main` dessa data.

## Premissas (sessão autônoma)

1. **Sem migração nesta entrega.** Hooks de escrita já existem (`useSaveItemFicha`, `useDeleteItemFicha`,
   `useSaveConsignacao`, `useSaveDependenteIRRF` em `src/hooks/useFolhaPagamento.ts`) e as tabelas
   `itens_ficha_financeira`, `consignacoes`, `dependentes_irrf` têm RLS por módulo (`can_access_module('rh')`).
2. **Permissão de edição no front: `financeiro.folha.processar`** (existe no catálogo; `rh.folha.*` não existe).
   Botões aparecem só com essa permissão (ou super admin). A rota `/folha/:id` continua `<ProtectedRoute>` sem
   permissão: mudar guard de rota exige confirmação do usuário (fica como pergunta aberta).
3. **Edição só com a folha em `previa`, `aberta` ou `reaberta`** (`ficha.folha.status`). `fechada` e
   `processando` são somente leitura. No banco, os triggers `trg_bloquear_*_ficha_fechada` barram UPDATE/DELETE
   em folha fechada, mas **não INSERT** — o front é a única barreira para inserir item em folha fechada (13b/M2).
4. **Totais recalculados no front** após incluir/editar/excluir item. A RPC atual **não cria item nenhum**: grava
   `total_proventos = cargo_vencimento` e `total_descontos = valor_inss + valor_irrf` direto na ficha. Por isso o
   recálculo (`calcularTotaisFicha`) é `total_proventos = cargo_vencimento + Σ itens provento`,
   `total_descontos = valor_inss + valor_irrf + Σ itens desconto`, `valor_liquido = proventos − descontos` →
   `folhas_pagamento` (somas das fichas). Itens herdados da RPC antiga (migração 20260112175202: "Vencimento
   Base"/"INSS"/"IRRF" com `ordem` 1/100/101) são ignorados para não somar duas vezes (`itemAutomaticoLegado`).
   `base_consignavel` não é tocado (a RPC também não preenche). Não é atômico (se o recálculo falhar após um
   INSERT, o front tenta excluir o item recém-criado) e **não recalcula INSS/IRRF** (só o reprocessamento faz
   isso); a tela avisa. Antes de INSERIR item, o status da folha é relido no banco (o trigger não barra INSERT).
5. **Reprocessar apaga itens manuais** (`processar_folha_pagamento` faz `DELETE` das fichas, cascata nos itens;
   não há coluna `origem`). `ProcessarFolhaDialog` passa a contar e avisar. Preservar itens exige 13b/M3.
6. **Consignações e dependentes IRRF ficam na ficha** (abas do `FichaFinanceiraDialog`, por `servidor_id`),
   porque o item fala do detalhe da folha; o cadastro do servidor pode ganhar atalho depois.
7. **Margem consignável no front**: `calcularMargemConsignavel(base, margem%)` (`src/lib/folhaCalculos.ts`,
   `useParametrosFolha`), com `base = ficha.valor_liquido + Σ descontos da ficha cuja referência é o contrato de
   uma consignação do servidor` (`baseMargemConsignavel`): o líquido já desconta as parcelas lançadas, e elas
   contam em "usada" — sem devolvê-las à base, "Disponível" cairia duas vezes. Exceder a margem exige confirmação
   explícita (não bloqueia: a RPC `fn_validar_margem_consignavel` usa outra base, `servidores.remuneracao_bruta`).
   Sem parâmetro `margem_consignavel` vigente, a margem não é avaliada e nada é exigido.
8. **A RPC real não lança consignações nem itens** (regressão desde 2026-01-12). Por isso a aba de consignações
   tem "Lançar na ficha", que cria um item `desconto` na ficha aberta. A duplicidade é checada ler-depois-inserir
   (sem índice único no banco): duas abas/usuários podem lançar o mesmo contrato duas vezes — índice em 13b. Dependente editado só reflete no IRRF ao
   reprocessar; a aba compara `ficha.quantidade_dependentes` com os vigentes e avisa.

## O que já existe (evidência)

- Rotas `/folha*` em `src/App.tsx:920-925`, todas `<ProtectedRoute>` sem permissão. `ROUTE_PERMISSIONS`
  (`src/types/auth.ts:158-160`) é documental — ninguém o consome.
- `FolhaDetalhePage` (`src/pages/folha/FolhaDetalhePage.tsx`): fichas com abrir/servidor/contracheque; sem edição.
- `FichaFinanceiraDialog` (`src/components/folha/FichaFinanceiraDialog.tsx`): só leitura; abas Resumo/Rubricas/
  Tributos; filtra `tipo` `informativo|encargo` que o CHECK (`provento|desconto`) não permite (`:124`).
- `useItensFichaFinanceira` (`useFolhaPagamento.ts:352-367`) e `useContrachequeDetalhe` (`useContracheque.ts:177-182`)
  ordenam por `rubrica_codigo`, coluna inexistente → a aba Rubricas e o contracheque não listam itens (42703).
- `ItemFichaFinanceira` em `src/types/folha.ts:161-173` desalinhado com a tabela (`rubrica_codigo`,
  `rubrica_descricao`, `origem` não existem; `referencia` é `text`).
- `useDependentesIRRF` filtra `deduz_irrf = true` (esconde dependentes cadastrados sem dedução).
- Padrões: `src/components/rh/ferias/FeriasFormDialog.tsx` (zod + campos editáveis por status), `RubricaForm.tsx`,
  `usePermissoesFolha`/`useFolhaBloqueada` (`useFechamentoFolha.ts`), `useRubricas(true)`, `useParametrosFolha`.

## Desenho (13a)

### Etapa 0 — correções prévias
- Ordenar itens por `ordem` (e `descricao`) nos dois hooks acima; alinhar `ItemFichaFinanceira` com a tabela;
  remover o filtro `informativo|encargo`.

### Etapa 1 — itens da ficha
- `src/components/folha/ItemFichaFormDialog.tsx`: react-hook-form + zod — `descricao` (min 3), `tipo`
  (`provento|desconto`), `rubrica_id` opcional (`useRubricas(true)`; ao escolher, preenche descrição/tipo),
  `valor` > 0, `referencia` opcional, `ordem` (default 900 para manuais).
- Na aba Rubricas do `FichaFinanceiraDialog`: botões Adicionar / Editar / Excluir (confirmação) visíveis só se
  `podeEditar = statusEditavel && hasPermission('financeiro.folha.processar')`; aviso fixo "INSS/IRRF só são
  recalculados no processamento".
- `useFolhaPagamento.ts`: `useSaveItemFicha`/`useDeleteItemFicha` ganham `recalcularTotaisFicha(fichaId)` e
  invalidam `['itens-ficha-financeira']`, `['ficha-financeira-detalhe']`, `['fichas-financeiras']`,
  `['folha-detalhe']`, `['folhas-pagamento']`. Erro de RLS/trigger vira toast (sem `PGRST116` engolido).
- `ProcessarFolhaDialog`: conta itens da folha e avisa que serão apagados.

### Etapa 2 — consignações (aba nova na ficha)
- Lista por servidor com filtro ativas / suspensas / quitadas (`useConsignacoesAtivas` ganha `incluirInativas`).
- `ConsignacaoFormDialog` (zod: consignatária, CNPJ opcional, contrato, `tipo_consignacao`, `valor_parcela` > 0,
  `total_parcelas` ≥ 1, `parcelas_pagas` ≤ total, datas/competências coerentes, `rubrica_id` opcional).
- Ações suspender / retomar / quitar (`useSaveConsignacao`).
- Margem: usada = soma das parcelas ativas não suspensas não quitadas; disponível = margem − usada; exceder pede
  confirmação.
- "Lançar na ficha": cria item `desconto` (`rubrica_id` da consignação, `referencia = numero_contrato`,
  `valor = valor_parcela`) se a folha estiver editável e ainda não houver item com a mesma referência.

### Etapa 3 — dependentes IRRF (aba nova na ficha)
- Lista por servidor (todos os `ativo`), badge vigente/não vigente na competência da folha.
- `DependenteIRRFFormDialog` (zod: nome min 3, CPF opcional válido via `isValidCPF`, `data_nascimento` passada,
  `tipo_dependente`, `deduz_irrf`, `data_inicio_deducao`, `data_fim_deducao` ≥ início).
- Inativar = `ativo=false` (sem DELETE). Aviso "a ficha tem N dependentes; há M vigentes — reprocesse para aplicar".

### Etapa 4 — docs
- `docs/MODULOS.md` (folha), `docs/RBAC_PERMISSOES.md` (nova subseção "Folha: edição da ficha" dizendo o que é
  só front e o que falta na RLS), riscar item 13 em `FINALIZACAO.md` registrando 13b.

## Fora de escopo (13b — migração, Onda B)

- **M1** reabrir `EXECUTE` de `processar_folha_pagamento` para `authenticated` com guarda de permissão no corpo
  (hoje revogado em `supabase/baseline/overlay/40_privilegios.sql:61-77`: em banco construído do baseline o botão
  Processar falha para todos — confirmar em produção).
- **M2** trigger BEFORE INSERT em `itens_ficha_financeira` e RPC `recalcular_ficha_financeira` atômica.
- **M3** coluna `origem` + `created_by` em itens; RPC gera itens automáticos, lança consignações e preserva manuais.
- **M4** policies por permissão (`financeiro.folha.processar`, `rh.servidores.editar`) — Onda B item 8.
- **M5** auditoria — Onda B item 9.
- Guard de rota em `/folha/:id` (`requiredPermissions="financeiro.folha.visualizar"`) — aguarda confirmação.

## Verificação
`bash scripts/gate.sh` verde; regras puras (recálculo de totais, margem, vigência de dependente) exercitadas em
script; revisão `revisor-codigo-idjuv` + `revisor-seguranca-idjuv`. Cenários: folha fechada sem botões; usuário
sem `financeiro.folha.processar` sem botões; totais da ficha e da folha batem após incluir/excluir item.
