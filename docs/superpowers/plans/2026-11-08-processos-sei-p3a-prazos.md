# Processos SEI, P3: prazos, avisos e pop-up de vencidos

Data: 08/11/2026. Pedido do dono: documento "Sistema de Compras: requisitos de melhoria" (06/11/2026), Prioridade 2
(prazos por processo, avisos escalonados, pop-up de vencidos e alerta de parado). Desenho publicado no planejamento
de 07/11; o dono disse "vamos" em 08/11. Decisão do pop-up: pode ser fechado e volta a cada entrada (a recomendação do
desenho; o cartão de decisão não foi respondido).

## Regra

- Cada processo tem prazos. O da **próxima ação** nasce da movimentação que vale (P2) e acompanha as correções dela;
  os outros (resposta de órgão externo, assinatura do contrato, vigência da ata e do contrato, empenho, liquidação,
  pagamento e prestação de contas) são lançados à mão por quem edita processos.
- Todo prazo tem responsável (servidor ou setor) e avisos em dias antes. Cada tipo tem avisos padrão ("Prazos e
  avisos"); o aviso de 1 dia antes sempre fica.
- Remarcar pede motivo e data não passada, e vai para o histórico. Cancelar pede motivo. Prazo cumprido ou cancelado
  não muda mais. Remarcar a próxima ação é corrigir o prazo da movimentação (P1), e o motivo da correção vai para o
  histórico.
- "Vencido" é calculado: prazo em aberto com a data passada. "Parado": processo sem movimentação além do limite da
  etapa (`compras_etapa_parametros.dias_limite_parado`).
- Pop-up ao entrar: vencidos, vencem em até 3 dias e parados, com os botões Registrar movimentação e Remarcar. Fecha e
  volta na próxima entrada. O responsável vê os seus; quem tem `compras.processos.editar` vê todos.

## Banco (migração `20261128090000_compras_processos_prazos.sql`)

1. `compras_prazo_tipos` (semente com os 9 tipos) e `compras_normalizar_avisos`.
2. `processo_prazos` com o gatilho `processo_prazo_preparar` (INVOKER, para saber se é a API) e
   `processo_prazo_responsavel_nome` (DEFINER, copia o nome do servidor).
3. `processo_prazo_remarcacoes` (trilha imutável), gravada por `processo_prazo_registrar_remarcacao`.
4. `processo_recalcular_estado`: cria, atualiza, cumpre ou cancela o prazo da próxima ação.
5. Carga: a próxima ação que já valia vira prazo aberto.
6. `compras_meus_prazos()` (DEFINER) para o pop-up e o sino.

Verificação: replay das migrações, baseline (só os trechos desta migração), `validar-baseline.sh` com `PG_REPLAY` e o
bloco "Compras: processos, P3" de `scripts/db/testar-rls.sql`.

## Telas

1. Ficha: aba Prazos (`ProcessoPrazosTab`, `PrazoDialog`), com Novo prazo, Cumprido, Remarcar, Cancelar e Avisos; os
   encerrados e as remarcações ficam recolhidos. `?aba=` abre a aba; `?nova=1` abre o registro de movimentação.
2. Pop-up `PrazosVencidosDialog` no cabeçalho dos módulos (uma vez por entrada, pela chave com o último acesso).
3. Sino: seção "Prazos de processos"; vencidos e os que vencem em até 3 dias contam no número.
4. Lista: o próximo prazo é o mais próximo em aberto de qualquer tipo, selo "Parado", filtro Atenção (vencidos e
   parados primeiro) e "Prazos e avisos" com os avisos por tipo.
5. `src/lib/compras/prazos.ts` (com teste): tipos, avisos, situação e textos.

## Fora da P3a

- P3b: e-mail diário dos prazos (rotina agendada fora do banco, que não tem pg_cron, e a função `enviar-notificacao`).
- "Meu setor" como responsável: depende das unidades do SEI (P4).
