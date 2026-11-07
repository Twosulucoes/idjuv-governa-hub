# Processos SEI, P2: próxima etapa, responsável e prazo

Data: 07/11/2026. Pedido do dono: documento "Sistema de Compras: requisitos de melhoria" (06/11/2026), Prioridade 1
("toda movimentação deve dizer a próxima etapa, quem é o responsável e o prazo"). Desenho publicado no planejamento de
07/11; o dono pediu para seguir em 07/11.

## Regra

- Toda movimentação **nova** gravada pela tela exige próxima etapa, responsável (servidor ou setor) e prazo, e o prazo
  não pode ser antes da data da movimentação. Encerrado e Cancelado não pedem e limpam a próxima ação.
- As movimentações antigas e a carga da planilha (`importar_processos_planilha`, DEFINER) não são cobradas. Na correção,
  só se cobra se a movimentação já tinha próxima ação ou se a pessoa informa alguma.
- O sistema sugere a etapa seguinte (ordem do processo; depois da execução, o encerramento) e o prazo pelos dias da
  próxima etapa (`compras_etapa_parametros`, ajustável em "Prazos por etapa" por quem edita processos).
- O processo guarda a próxima ação da movimentação que vale (a mesma regra da P1).

## Banco (migração `20261121090000_compras_processos_proxima_acao.sql`)

1. Colunas da próxima ação em `processo_andamentos` e `processos_licitatorios`.
2. `processo_proxima_acao_falta` (IMMUTABLE): a regra, com as mesmas mensagens da tela. `processo_andamento_carimbar`
   aplica no INSERT só quando `current_user` é `authenticated` ou `anon` (a carga roda como dona da função).
3. `processo_andamento_responsavel_nome` (DEFINER): copia o nome do servidor (quem vê processos não lê `servidores`).
4. `processo_andamento_alterar` e `processo_andamento_registrar_alteracao` cobrem os campos novos;
   `processo_recalcular_estado` copia a próxima ação para o processo.
5. `compras_etapa_parametros` (RLS `permissao`, ninguém apaga) com a semente dos dias.
6. `processo_buscar_servidores` (DEFINER): busca estreita, só com `compras.processos.editar`.

Verificação: replay das migrações, baseline (só os trechos desta migração), `validar-baseline.sh` com `PG_REPLAY` e o
bloco "Compras: processos, P2" de `scripts/db/testar-rls.sql`.

## Telas

1. `NovaMovimentacaoDialog`: seção "Depois desta movimentação" (próxima etapa, prazo com a sugestão, responsável
   servidor ou setor). `src/lib/compras/proximaAcao.ts` tem a regra e as sugestões (com teste).
2. Linha do tempo: "Próximo: etapa · responsável · até data", com o selo do prazo só na movimentação que vale.
3. Ficha, aba Dados: próxima etapa, responsável e prazo. Lista: coluna "Próximo prazo" (vencido, vence hoje, faltam
   até 3 dias, em dia). Botão "Prazos por etapa" para quem edita.

## Fora da P2

Avisos escalonados, pop-up de vencidos e alerta de parado (P3); unidades do SEI e "meu setor" (P4).
