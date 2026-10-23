# Plano: importação de empenhos do FIPLAN (FIP 614)

Spec: [`2026-10-22-importacao-empenhos-fip614-design.md`](../specs/2026-10-22-importacao-empenhos-fip614-design.md).
Uma PR, na ordem abaixo. Testes com dados fictícios; o PDF real fica fora do repositório (tem nomes de credores).

1. **Leitura** — `src/lib/importacao/importadores/empenhosFip614Parser.ts` + teste vitest com relatório fictício
   (credor quebrado, histórico da liquidação, GCV, estorno, bloco que atravessa a página, TOTAL do bloco e TOTAL UG).
   Conferido à parte com o PDF real: soma dos blocos igual ao TOTAL UG, sem problemas de leitura.
2. **Banco** — migração `20261027090000_fin_empenhos_fip614.sql`: colunas de origem FIPLAN em `fin_empenhos`,
   `codigo_credor_fiplan` em `fornecedores`, tabela `fin_empenho_documentos_fiplan` (RLS só leitura pelo módulo
   financeiro), triggers de saldo ignorando `origem = 'fiplan'` e RPC `importar_empenhos_fip614`. Baseline
   regenerado, mapa de RLS, overlay 40 e bloco "Financeiro: empenhos do FIPLAN (FIP 614)" em `testar-rls.sql`.
3. **Tela** — importador na Central (`empenhosFip614.ts`, `registro.ts`); selo FIPLAN e credor na lista de
   Empenhos; `EmpenhoDetalhePage` com escolha da dotação e histórico; código do credor no cadastro de Favorecidos.
4. **Verificação** — `validar-migracoes.sh`, `validar-baseline.sh`, `testar-rls.sh`, `bash scripts/gate.sh`.
5. **Docs** — BANCO_DE_DADOS, ARQUITETURA, NOVO_BANCO, baseline/README e ROADMAP.
