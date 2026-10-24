# Plano: tela "Atualizar o Financeiro"

Spec: [`docs/superpowers/specs/2026-10-23-rotina-atualizacao-financeiro-design.md`](../specs/2026-10-23-rotina-atualizacao-financeiro-design.md).
Spec e plano aprovados por Fabiano na conversa ("pode", 24/10/2026). Sem banco, sem RLS, sem mudança de permissão.

## Tarefas

1. **Regras (TDD).** `src/lib/financeiro/rotinaAtualizacao.test.ts` primeiro, depois `rotinaAtualizacao.ts`:
   `ROTINA_FINANCEIRO` (5 itens, com passos no FIPLAN), `situacaoDoItem(frequencia, ultima, hoje, { encerrado })` e
   `resumirRotina(situacoes)`. Casos: semanal com 7 e 8 dias; mensal antes e depois do dia 10, virada de ano; anual;
   sob demanda; nunca; exercício encerrado.
2. **Hook.** `useRotinaAtualizacao(exercicio)` em `src/hooks/useFinanceiro.ts`: a última `importacoes.created_at` por
   tipo no exercício e a competência fechada mais recente de `fin_conciliacoes_mensais`.
3. **Tela.** `src/pages/financeiro/AtualizarFinanceiroPage.tsx` e o cartão
   `src/components/financeiro/atualizacao/CartaoRotina.tsx`; rota `/financeiro/atualizar` em `src/App.tsx`
   (`requiredModule="financeiro"`); item "Atualizar dados" nos dois menus do Financeiro.
4. **Central de Importações.** `ImportacoesPage` abre o assistente de `?importador=<id>` quando o usuário tem a
   permissão desse importador.
5. **Painel.** `FaixaAtualizacao` passa a levar a `/financeiro/atualizar` ("Ver o que atualizar").
6. **Docs e verificação.** `docs/MODULOS.md`, `docs/planejamento/ROADMAP.md`, `npm run estado`; `bash scripts/gate.sh`,
   `node scripts/check-docs-matriz.mjs --base origin/main`; capturas da tela clara, escura e no celular.
