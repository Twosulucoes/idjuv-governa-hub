# Painel do Financeiro com os dados do FIPLAN — desenho

- **Data:** 23/10/2026
- **Pedido:** Fabiano, na conversa "Painel com relatórios do FIPLAN": "quais relatórios você me sugere pra fazer
  um painel super profissional". O desenho resumido foi aprovado na conversa ("PODE"), também em 23/10/2026.
- **Classificação:** arquitetural (tela inteira nova e regra de alerta), sem mudança de banco.

## 1. Objetivo

A tela inicial do Financeiro (`/financeiro`, `src/pages/modulos/FinanceiroDashboardPage.tsx`) passa a ser um
painel gerencial da execução orçamentária do exercício. Ele deve responder em poucos segundos:

1. Quanto do orçamento já foi empenhado e pago?
2. Quanto ainda dá para empenhar, e onde o saldo está acabando?
3. O que já foi liquidado e ainda não foi pago, e a quem?

**Critério de sucesso:** com o QDD e o FIP 614 importados, os números do painel batem com os do FIPLAN.
Conferência de 23/10/2026 (FIP 613 acumulado até outubro e FIP 608 do IDJUV):

- crédito autorizado de R$ 43.831.750,82;
- empenhado de R$ 26.670.834,42;
- pago de R$ 20.189.920,86;
- saldo para empenhar de R$ 11.414.497,40;
- PED de R$ 5.676.419,00;
- bloqueado de R$ 70.000,00;
- R$ 2.203.447,51 liquidados a pagar e R$ 4.277.466,05 a liquidar (FIP 683).

## 2. De onde vêm os dados (nada novo no banco)

Os relatórios do FIPLAN foram testados um a um em 23/10/2026. O resultado:

| Relatório | Resultado | Uso |
|---|---|---|
| QDD (PDF), importador `qdd_fiplan` | Já existe | Dotações com inicial, suplementado, anulado, bloqueado, reserva, PED, empenhado, liquidado e pago (`fin_dotacoes`) |
| FIP 614 (Excel), importador de empenhos | Já existe | Empenho a empenho, com credor, data, liquidado e pago (`fin_empenhos`) |
| FIP 613 acumulado (Excel) | Traz os mesmos valores do QDD, mas **sem o IDU**, que faz parte da chave da dotação | Não entra no sistema: serve só para conferir |
| FIP 608 | O FIPLAN esconde a dotação (`*** *** ***`) em xls e em pdf | Conferência do total |
| FIP 683 | Igual à soma de `saldo_liquidar` e `saldo_pagar` dos empenhos | Conferência |
| FIP 226 (a partir de 2014) | "Não houve movimentação": o IDJUV não tem restos a pagar em 2026 | — |
| FIP 502 | O xls sai com os rótulos quebrados, e o caixa próprio pesa pouco porque o Tesouro libera na hora do pagamento | Fica para depois |
| FIP 076 | Vazio: o IDJUV não cadastra contratos no FIPLAN | Contratos virão do módulo Contratos |

**Mudança em relação ao resumo aprovado na conversa:** a ideia era ensinar o importador do QDD a ler o FIP 613 em
Excel. Ao conferir a regra de importação, vi que o FIP 613 não traz o IDU, que faz parte da chave da dotação
(`importar_qdd_fiplan`). Com isso, a importação criaria dotações repetidas. O QDD em PDF já traz tudo o que o
painel precisa, inclusive bloqueado e PED. Por isso esta entrega **não mexe em importação nem no banco**: basta
importar o QDD e o FIP 614 toda semana.

A **data de referência** do painel é a da última importação do QDD do exercício: a linha mais recente de
`importacoes` com `tipo = 'qdd_fiplan'` e o exercício escolhido. Se o exercício já terminou, vale dezembro.

## 3. O painel, de cima para baixo

O seletor de exercício e o cabeçalho continuam como estão. Abaixo do cabeçalho:

### 3.1 Faixa de atualização

Mostra "Dados do FIPLAN de 23/10/2026 (QDD) · empenhos de 22/10/2026 (FIP 614)", com um link para a Central de
Importações. O aviso fica amarelo quando a última importação do QDD tiver mais de 7 dias. Se nunca houve
importação no exercício, aparece um estado vazio que explica o que importar e onde.

### 3.2 Números principais (6 cartões)

| Cartão | Conta | Destino do clique |
|---|---|---|
| Autorizado | Soma de `valor_atual` | `/financeiro/qdd` |
| Empenhado | Soma de `valor_empenhado`, com % do autorizado | `/financeiro/empenhos` |
| Liquidado | Soma de `valor_liquidado`, com % do autorizado | `/financeiro/liquidacoes` |
| Pago | Soma de `valor_pago`, com % do autorizado | `/financeiro/pagamentos` |
| Saldo para empenhar | autorizado − bloqueado − PED (o PED do QDD já soma empenhado e reserva; corrigido em 24/10/2026, PR #175) | `/financeiro/qdd` |
| Reservado (PED) | Soma de `valor_ped` + `valor_reserva`, com o bloqueado em texto menor | `/financeiro/qdd` |

A coluna `saldo_disponivel` do banco **não** desconta bloqueado nem PED. O painel usa a conta do FIPLAN, que dá os
R$ 11.414.497,40 do FIP 608. Só entram dotações com `ativo = true`.

### 3.3 Execução por grupo de despesa

Um gráfico de barras horizontais (recharts), com uma barra por grupo que tenha dotação. O grupo é o 2º dígito
da natureza:

- 1 Pessoal;
- 2 Juros;
- 3 Custeio;
- 4 Investimento;
- 5 Inversões;
- 6 Amortização.

Cada barra mostra autorizado, empenhado e pago. Ao lado vai uma tabela simples com os mesmos números e o saldo
para empenhar, por acessibilidade e para quem imprime.

### 3.4 Alertas de saldo

A lista mostra as dotações (natureza + fonte + PAOE) cujo saldo não cobre o resto do ano no ritmo atual:

- **meses decorridos** (`m`): mês da data de referência, de 1 a 12;
- **ritmo mensal:** `valor_liquidado / m`;
- **meses que faltam:** `12 − m`, mais 1 para o 13º salário nas naturezas de pessoal (grupo 1) com elemento
  11 (vencimentos) ou 13 (obrigações patronais);
- **cobertura:** saldo para empenhar + empenhado ainda não liquidado (`empenhado − liquidado`);
- **necessidade:** ritmo mensal × meses que faltam;
- **alerta** quando a cobertura é menor que a necessidade e o ritmo mensal é maior que zero. As dotações sem nada
  liquidado (gasto pontual, como um convênio) não geram alerta.

Cada alerta mostra a natureza com o nome, a fonte, a cobertura, a necessidade e quanto falta (necessidade −
cobertura). A lista é ordenada por quanto falta. Abaixo dela vai sempre o aviso "estimativa pelo ritmo do ano;
não considera gastos que ainda vão começar".

Com os dados de 23/10/2026, a natureza 3.1.90.11 (vencimentos, fonte 1.500) gera alerta:

- ritmo de cerca de R$ 404 mil por mês;
- 3 meses que faltam (novembro, dezembro e 13º);
- necessidade de cerca de R$ 1,21 mi;
- cobertura de R$ 209.541,54 (R$ 20.329,08 de saldo + R$ 189.212,46 a liquidar).

### 3.5 Fila de pagamento

Lista os empenhos do exercício (`fin_empenhos`) com `saldo_liquidar > 0` ou `saldo_pagar > 0`, agrupados por credor:

- **credor:** `credor_nome`, ou a razão social do favorecido nos empenhos do sistema;
- **a liquidar:** soma de `saldo_liquidar`;
- **liquidado a pagar:** soma de `saldo_pagar`;
- **empenhos:** quantidade;
- **mais antigo:** dias desde o menor `data_empenho`.

A lista é ordenada por liquidado a pagar e depois por a liquidar, mostra os 10 primeiros e tem o link "ver todos"
para `/financeiro/empenhos`. O total da fila aparece no título do quadro. Os empenhos com status `anulado` ficam
de fora.

### 3.6 Maiores despesas

Mostra as 5 naturezas (elemento, ou seja, os 6 primeiros dígitos) com maior valor liquidado no exercício. Cada uma
tem o nome, o valor e a % do total liquidado.

### 3.7 Acesso rápido

Os atalhos atuais (Solicitações, Empenhos, Liquidações, Pagamentos) continuam no fim da página.

## 4. Como fica o código

- **Regras puras em `src/lib/financeiro/painelExecucao.ts`:** funções sem React nem Supabase que recebem as
  linhas e devolvem os números:
  - `resumirExecucao(dotacoes)`: os cartões;
  - `execucaoPorGrupo(dotacoes)`;
  - `alertasDeSaldo(dotacoes, mesReferencia)`;
  - `filaDePagamento(empenhos, hoje)`;
  - `maioresDespesas(dotacoes)`.

  Os testes ficam em `painelExecucao.test.ts`, com números fictícios e um caso que reproduz os totais da seção 1.
  Nenhum dado de credor vai para o repositório.
- **Dados no hook `src/hooks/useFinanceiro.ts`:** um `usePainelFinanceiro(exercicio)` com três consultas:
  - dotações ativas com a natureza (código e nome) e a fonte (código);
  - empenhos do exercício com saldo;
  - última importação de QDD e de FIP 614 do exercício.

  O `useDashboardFinanceiro` atual deixa de ser usado pelo painel. Se não sobrar ninguém usando ele, sai junto
  (regra do código alcançável).
- **Componentes em `src/components/financeiro/painel/`:** `FaixaAtualizacao`, `CartoesExecucao`,
  `ExecucaoPorGrupo`, `AlertasSaldo`, `FilaPagamento` e `MaioresDespesas`, todos com shadcn/ui, os tokens de cor
  do design system e o `KpiCard` que já existe.
- **Página:** `FinanceiroDashboardPage.tsx` só monta os quadros.
- **Sem mudança em** rota, permissão, RLS, banco ou importadores. A rota `/financeiro` continua exigindo o módulo
  `financeiro`, e quem lê as tabelas já lê hoje pelas políticas atuais.

## 5. Erros e estados vazios

- Cada quadro tem o próprio carregamento e o próprio erro, com "Tentar novamente". O erro de um quadro não
  derruba os outros.
- Sem QDD importado no exercício: os números mostram "—", e a faixa explica que é preciso importar o QDD em
  `/admin/importacoes`.
- Sem FIP 614: a fila mostra "Importe o FIP 614 para ver a fila de pagamento".
- Valor sem dado aparece como "—", nunca como zero.

## 6. Verificação

- Testes de `painelExecucao.ts` no vitest (gate).
- `bash scripts/gate.sh` verde.
- Conferência na tela com o banco local de dados fictícios (script do PR #152) e capturas claro, escuro e celular
  em `/mnt/project-files/financeiro/painel/`.
- Em produção, a conferência final é do Fabiano: importar o QDD e o FIP 614 e comparar com os números da seção 1.

## 7. Fora desta entrega

- Gráfico mês a mês: precisa guardar uma foto dos valores a cada importação (tabela nova).
- Contratos vencendo: vêm do módulo Contratos, porque o IDJUV não cadastra contratos no FIPLAN.
- Caixa por fonte (FIP 502).
- Restos a pagar: o IDJUV não tem em 2026, e o quadro entra quando houver.
- Importar o FIP 613: precisaria do IDU.
