# Diárias pagas no FIPLAN (FIP 002) — plano

Spec: [2026-10-30-diarias-fiplan-design.md](../specs/2026-10-30-diarias-fiplan-design.md) (aprovada em 30/10/2026).
Execução inline, uma tarefa depois da outra, com verificação a cada passo.

1. **Banco** (`supabase/migrations/20261113090000_fin_diarias_fiplan.sql`): tabela `fin_diarias_fiplan` com RLS na
   mesma migração, `fin_nome_comparavel`, RPC `importar_diarias_fiplan` (modelo da `importar_peds_fiplan`) e rótulo da
   permissão. Verificar: `scripts/db/validar-migracoes.sh` sem falha.
2. **Baseline e testes de acesso**: schema regenerado (`gerar-baseline.sh`; catálogo só com o rótulo), linha no
   `rls/mapa.csv` (classe `preservar`), `overlay/40_privilegios.sql`, bloco no `scripts/db/testar-rls.sql` e semente em
   `seed_ov`; tipos regenerados (`gerar-tipos.sh`). Verificar: `validar-baseline.sh` APROVADO, bloco com 0 falha.
3. **Leitor** (`diariasFiplanParser.ts` + testes) e **importador** (`diariasFiplan.ts`, com relatório, caminho e
   filtros nas instruções) no registro. Verificar: vitest e leitura da amostra real (131 diárias, total do rodapé).
4. **Rotina**: cartão "FIP 002 – Demonstrativo de Diárias" (semanal) em Financeiro → Atualizar dados.
5. **Regras e dados**: `src/lib/financeiro/diariasFiplan.ts` (prazo de 10 dias, totais, testes) e
   `src/hooks/useDiariasFiplan.ts`.
6. **Tela** `/financeiro/diarias` (rota com `financeiro.diarias.visualizar` ou `rh.viagens.visualizar`, menu no
   Financeiro e no RH) e selo "Paga no FIPLAN" em `/rh/viagens`.
7. **Docs** da matriz, ROADMAP e `npm run estado`; `bash scripts/gate.sh` verde; PR rascunho.
