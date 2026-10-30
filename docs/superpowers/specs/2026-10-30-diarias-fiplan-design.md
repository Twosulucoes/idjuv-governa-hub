# Diárias pagas no FIPLAN (FIP 002) — desenho

Data: 30/10/2026 · Status: **aprovado em 30/10 (respostas Q1–Q3 abaixo)** · Classificação: bounded (tabela nova com RLS, importador, tela)

## 1. Problema

O FIPLAN sabe quais diárias foram empenhadas, liquidadas e pagas e se o servidor prestou contas, mas o sistema não.
A amostra de 30/10 (FIP 002, exercício 2026) traz 131 diárias de 49 servidores, R$ 158.904,00, com 49 marcadas
"PC = Não" (sem prestação de contas). Hoje ninguém vê essa lista fora do FIPLAN.

O RH já cadastra a viagem em `viagens_diarias` (/rh/viagens), mas esse cadastro não sabe se a diária foi paga.

## 2. Objetivo

1. Importar o FIP 002 em Excel, com a instrução na tela (relatório, caminho e filtros).
2. Mostrar no Financeiro as diárias pagas, com destaque para as **sem prestação de contas** e há quantos dias o
   servidor voltou.
3. Ligar cada diária ao servidor e, quando houver, à viagem cadastrada pelo RH.

Fora desta entrega: cobrar o servidor por e-mail; gerar documento; FIP 002A/002B.

## 3. O arquivo

FIPLAN → Relatórios → Financeiro/Contábil → Operacionais → Despesa – Diárias/SDF → **FIP 002 – Demonstrativo de
Diárias**. Sai em xls que é tabela HTML (ISO-8859-1), como o FIP 614. Uma linha por diária, 16 colunas:

| Coluna | Exemplo | Campo |
|---|---|---|
| Credor código | 2008015124 | `credor_codigo` |
| Credor nome | (nome do servidor) | `credor_nome` |
| QTD | 4.5 | `quantidade` |
| PROC | 000296 | `processo_fiplan` |
| Documento tipo | EMP | (só EMP na amostra) |
| Documento data | 26/06/2026 | `data_empenho` |
| Documento número | 17302000126000585 | `empenho_numero` (**chave**, único na amostra) |
| Documento valor | 540,00 | `valor_empenhado` |
| LIQ | 17302000126000786 | `liquidacao_numero` |
| LIQ valor | 540,00 | `valor_liquidado` |
| NOB | 17302000126000851 | `nob_numero` |
| DT NOB | 02/07/2026 | `data_pagamento` |
| Saída / Retorno | 30/04/2026 / 04/05/2026 | `data_saida`, `data_retorno` |
| Nº OS | 17302000126000351 | `ordem_servico` |
| PC | Sim / Não | `prestou_contas` |

Fim do arquivo: linha "TOTAL UO:17302 - R$" com o total, que o leitor confere contra a soma das linhas.

**Filtros** (print do Fabiano, 30/10): `*Exercício Igual a 2026` e `*Código da Unidade Orçamentária Igual a
17302.0001`; classificação padrão (Nome Credor + Data do Empenho + Nº do documento + Quantidade de diárias); Tipo de
Relatório xls. O arquivo não traz título nem critérios: o leitor reconhece o FIP 002 pelo cabeçalho e tira o exercício
do nº do empenho.

## 4. Banco (migração nova, RLS na mesma migração)

Tabela `fin_diarias_fiplan` (espelho, só o importador grava):

- `id`, `exercicio`, colunas da §3, `servidor_id` (nulo se não achou), `viagem_id` (nulo se não achou),
  `importacao_id`, `created_at`, `updated_at`.
- Único: `(exercicio, empenho_numero)`. Nada é apagado: diária que sumiu do arquivo aparece em "ausentes" na simulação.

RLS (mesmo público de `viagens_diarias`):

- **Ler:** módulo financeiro com `financeiro.diarias.visualizar` ou `financeiro.execucao.importar`; módulo rh com
  `rh.viagens.visualizar`; o servidor lê as próprias (via `servidor_id`).
- **Escrever:** ninguém direto. Só a RPC `importar_diarias_fiplan(p_exercicio, p_linhas, p_arquivo, p_simular)`,
  `SECURITY DEFINER`, `search_path` fixo, que confere módulo `financeiro` + `financeiro.execucao.importar`, grava numa
  transação e registra em `importacoes` (tipo `diarias_fiplan`). `EXECUTE` só para `authenticated`.

Ligações feitas pela RPC:

- **Servidor:** nome do credor comparado ao `servidores.nome_completo` sem acento, sem caixa e sem espaço duplo. Mais
  de um servidor com o mesmo nome, ou nenhum: fica nulo e a simulação avisa ("sem servidor").
- **Viagem do RH:** mesma pessoa e `data_saida` igual. Sem par: fica nula (a tela mostra "sem cadastro no RH").

## 5. Tela

**/financeiro/diarias — "Diárias pagas"**, `requiredPermissions` = `financeiro.diarias.visualizar` ou
`rh.viagens.visualizar` (Q3). Menu Financeiro, item "Diárias" depois de "Empenhos"; no RH, "Diárias pagas (FIPLAN)"
depois de "Viagens".

- Números do topo: total pago, nº de diárias, servidores, **sem prestação de contas** (quantidade e valor).
- Filtros: situação da prestação (todas / sem prestação / com prestação), servidor, mês do pagamento.
- Tabela: servidor, período da viagem, diárias, valor, data do pagamento, prestou contas, **dias desde o retorno**
  (só para as sem prestação, em vermelho com mais de 10 dias), "sem cadastro no RH" quando não ligou.
- Exportar a lista filtrada em Excel.
- Faixa no topo com a data da última importação e o link "Atualizar" para o importador.

No RH, a ficha da viagem (/rh/viagens) ganha o selo "Paga no FIPLAN em dd/mm" quando houver diária ligada, e a aba
Viagens da ficha funcional do servidor lista as diárias dele no FIPLAN com o selo da prestação de contas (pedido do
Fabiano em 30/10).

## 6. Instrução para quem importa (pedido do Fabiano)

O importador e o cartão novo em **Financeiro → Atualizar dados** trazem:

- Relatório: **FIP 002 – Demonstrativo de Diárias**.
- Caminho: Relatórios → Financeiro/Contábil → Operacionais → Despesa – Diárias/SDF (ou digite "FIP 002" na caixa
  Pesquise menu).
- Filtros: Exercício igual a o ano e Código da Unidade Orçamentária igual a 17302.0001.
- Formato: Excel (xls), importar sem abrir nem renomear.
- Frequência: toda semana (cartão com selo em dia/atrasado, como os outros).

## 7. Testes

- Parser com a amostra anonimizada (nomes trocados): 131 linhas, soma = total do rodapé, "Sim/Não" → booleano,
  "4.5" → 4,5, datas dd/mm/aaaa.
- Arquivo de outro relatório → erro claro ("isto não é o FIP 002").
- Regras de "dias desde o retorno" e do prazo em função pura com teste.
- Gate completo (`bash scripts/gate.sh`).

## 8. Perguntas para o Fabiano (respondidas em 30/10)

- **Q1.** Quais filtros você usou no FIP 002? **Resposta:** os do print (§3).
- **Q2.** Qual é o prazo para prestar contas da diária depois do retorno? **Resposta:** 10 dias.
- **Q3.** O RH também vê? **Resposta:** sim, só leitura: a rota aceita `rh.viagens.visualizar`, o menu do RH
  ganha o item e a viagem em `/rh/viagens` mostra o selo.
