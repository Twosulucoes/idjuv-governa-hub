# Rotina de atualização do Financeiro ("Atualizar o Financeiro") — desenho

- **Data:** 23/10/2026
- **Pedido:** Fabiano, na conversa "Painel com relatórios do FIPLAN": "quais os relatórios tenho que exportar e me faz
  um painel de instrução para atualizar". O desenho resumido foi aprovado na conversa ("pode fazer"), em 23/10/2026.
- **Classificação:** bounded (tela nova só de leitura, sem mudança de banco nem de permissão).

## 1. Objetivo

O sistema não entra no FIPLAN: quem baixa os relatórios é uma pessoa. A tela nova diz **o que baixar, quando, de onde e
o que está atrasado**, e leva ao importador certo com um clique.

**Critério de sucesso:** abrindo `/financeiro/atualizar`, a pessoa sabe, sem perguntar a ninguém, qual arquivo falta
importar nesta semana e como tirá-lo do FIPLAN.

## 2. A rotina (lista fixa no código)

A rotina fica em `src/lib/financeiro/rotinaAtualizacao.ts`, uma lista de itens. Cada item tem título, para que serve,
frequência, passos no FIPLAN, onde importar e de onde vem a data da última vez.

| Item | Frequência | De onde vem a última data | Importa em |
|---|---|---|---|
| QDD do FIPLAN (PDF) | semanal | `importacoes`, tipo `qdd_fiplan`, exercício da tela | Central de Importações → QDD |
| FIP 614, Situação de Empenho (Excel) | semanal | `importacoes`, tipo `empenhos_fip614`, exercício da tela | Central de Importações → FIP 614 |
| Retorno do banco (OBN600 / CNAB 240) | depois de cada remessa | `importacoes`, tipo `arquivo_bancario` | Central de Importações → Arquivo do banco |
| Conciliação do mês: FIP 630, FIP 103, OFX e extrato do fundo | mensal | `fin_conciliacoes_mensais`, competência mais recente com `situacao` fechada | Financeiro → Conciliação |
| Tabelas do FIPLAN | anual | `importacoes`, tipo `classificadores_fiplan`, exercício da tela | Central de Importações → Tabelas |

Os passos de cada item vêm do que foi testado no FIPLAN em 23/10/2026: o nome do relatório, o exercício, a UG
17302.0001 e o formato (Excel sempre que o importador aceita). Fabiano confere o texto na primeira revisão da tela. O
texto fica no código, e não no banco: corrigir um passo é uma PR pequena.

## 3. Situação de cada item (função pura)

`situacaoDoItem(item, ultima, hoje, { encerrado })` devolve uma de quatro situações:

- **em dia:** semanal com até 7 dias; mensal com o mês anterior fechado; anual importado no exercício.
- **atrasado:** passou do prazo acima. Na conciliação, o mês anterior conta como atrasado só a partir do dia 10.
- **nunca importado:** não há registro.
- **sob demanda:** o retorno do banco não tem prazo. Mostra só a última data, sem selo de atraso.

Num exercício encerrado (anterior ao ano atual), nada fica atrasado: os itens com registro aparecem "em dia".

Testes em `src/lib/financeiro/rotinaAtualizacao.test.ts` cobrem cada regra, a virada do mês, o dia 10 e o exercício
encerrado.

## 4. Tela

`src/pages/financeiro/AtualizarFinanceiroPage.tsx`, rota `/financeiro/atualizar` em `src/App.tsx`, com
`ProtectedRoute requiredModule="financeiro"` (mesmo guard do painel; a página só lê).

- **Topo:** `PageHeader` "Atualizar o Financeiro", com o seletor de exercício e um resumo do tipo "3 de 5 em dia".
- **Um cartão por item**, com: título, para que serve, frequência, selo (verde "em dia", amarelo "atrasado", vermelho
  "nunca importado", cinza "sob demanda"), a data da última vez, os passos numerados no FIPLAN e o botão "Importar
  agora".
- **"Importar agora"** abre `/admin/importacoes?importador=<id>`. A Central passa a ler esse parâmetro e abre o
  assistente do importador, só se o usuário tiver a permissão dele (sem permissão, a Central abre normalmente). Na
  conciliação, o botão vai para `/financeiro/conciliacao`.
- O painel do Financeiro (`FaixaAtualizacao`) troca o link "Atualizar na Central de Importações" por "Ver o que
  atualizar", que leva a esta tela. O menu do Financeiro ganha o item "Atualizar dados".

Os dados vêm de um hook novo, `useRotinaAtualizacao(exercicio)` em `src/hooks/useFinanceiro.ts`: uma consulta por tipo
em `importacoes` (como o painel já faz) e uma em `fin_conciliacoes_mensais`. Se a RLS não deixar ver uma das tabelas,
o item aparece como "nunca importado" com a observação "sem acesso para conferir"; o erro de consulta aparece como erro,
e não como "nunca".

## 5. Fora deste desenho

- Baixar do FIPLAN sozinho (não há acesso de fora ao FIPLAN).
- Aviso por e-mail ou notificação quando atrasar.
- Relatórios que ainda não têm importador (FIP 624 liquidações, créditos adicionais, emendas por ofício).
- Banco, RLS e permissões: nada muda.
