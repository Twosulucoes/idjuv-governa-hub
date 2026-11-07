# Processos SEI, P1: andamento confiável

Data: 07/11/2026. Pedido do dono (9 sugestões para `/compras/processos` e o documento "Sistema de Compras: requisitos
de melhoria" de 06/11/2026). Aprovação: "pode fazer" em 07/11/2026, sobre o plano das entregas P1 a P7. A P1 é a
primeira da ordem do documento.

## Problema

- Movimentação gravada não se corrige nem se apaga; para corrigir, registra-se outra por cima (caso 000819).
- Na carga da planilha, a movimentação sem data recebeu a data do dia da carga (`data_informada = false`). O gatilho
  só copiava o estado para o processo quando a movimentação nova era a mais recente pela data, então a movimentação
  lançada com a data real do SEI (anterior à carga) não mudava setor, situação nem dias parado (casos 000139, 000339,
  000665 e 000810, que aparecem com "sem data" e setor "—").
- O selo "Sem movimento" do cabeçalho da ficha é da fase financeira (sem reserva nem empenho) e foi lido como
  "sem andamento".

## Decisões (recomendações aceitas pelo dono)

- Corrige e exclui quem tem `compras.processos.editar`, qualquer movimentação, sempre com motivo.
- Excluir é exclusão lógica: a linha fica guardada, sai da linha do tempo e das contas.
- A migração não recalcula os processos existentes; o recálculo acontece quando a movimentação é incluída, editada
  ou excluída (assim nenhum processo muda de situação sem alguém mexer nele).

## Banco (migração `20261120090000_compras_processos_andamento_edicao.sql`)

1. Colunas `excluido_em/por/motivo` e `alterado_em/por`, `alteracao_motivo` em `processo_andamentos`.
2. Gatilho BEFORE UPDATE `processo_andamento_alterar`: exclusão exige motivo e carimba quem e quando; edição exige
   motivo novo e recusa data futura; informar data marca `data_informada`; excluída não muda; processo e autoria
   nunca mudam. A policy de UPDATE que já existia (`compras.processos.editar`) não muda; DELETE continua sem policy.
3. Trilha `processo_andamento_alteracoes` (gatilho AFTER UPDATE, DEFINER; `trilha_imutavel`; RLS classe `trilha`).
4. `processo_recalcular_estado(uuid)`: a movimentação que vale é a não excluída, com data antes da sem data, depois a
   mais recente. O gatilho de INSERT passa a chamá-la.

Verificação: replay das migrações, baseline regenerado (só os trechos desta migração), `validar-baseline.sh` com
`PG_REPLAY` e o bloco "Compras: processos, P1" de `scripts/db/testar-rls.sql`.

## Telas

1. `ProcessoAndamentoTab`: movimentações com data primeiro; as sem data numa lista "para preencher" com aviso e
   "Excluir as N sem data"; lápis (corrigir ou informar a data) e lixeira (excluir com motivo) para quem edita;
   "Registrada no sistema em" e "corrigida em" em cada linha; "Correções e exclusões" com a trilha.
2. `NovaMovimentacaoDialog` também corrige (pede o motivo).
3. Hook: `useCorrigirMovimentacao`, `useExcluirMovimentacoes`, `useAlteracoesDoAndamento`; a lista ignora as excluídas.
4. `faseFinanceira`: "Sem movimento" vira "Sem reserva nem empenho".

## Fora da P1

Próxima etapa, responsável e prazo (P2); prazos, avisos e pop-up (P3); unidades do SEI e vários setores (P4); etapas,
vínculos e ata (P5); contrato (P6); histórico do SEI (P7).
