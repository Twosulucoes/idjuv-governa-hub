# Tabelas de classificação do FIPLAN (importação por planilha)

Data: 19/10/2026. Classificação: **architectural** (tabela nova, RPC nova). Pedido do Fabiano na thread "Análise das
planilhas do FIPLAN": analisar as planilhas exportadas do FIPLAN e usar no sistema. A análise
(`/mnt/project-files/financeiro/planilhas-fiplan-analise.md`, pasta do projeto) propôs cinco etapas; ele aprovou a
etapa 1, que é esta.

## Problema

O FIPLAN exporta cada consulta ("Consultar Fonte de Recurso", "Consultar Subelemento da Despesa"…) como `.xls`, todas
no mesmo formato: linhas em branco, título, critérios ("*Exercício igual a 2026"), cabeçalho e dados. O sistema não
tem essas tabelas: as fontes do catálogo inicial (`100` a `104`) não batem com o FIPLAN, e o importador do QDD cria
fontes e naturezas com nome provisório ("… (importada do QDD, revisar descrição)"). O subelemento não existe em
lugar nenhum.

## Desenho

- **Tabela** `fin_classificadores_fiplan` (tipo, exercício, código, nome, nome resumido, ativo, `atributos` jsonb com
  as demais colunas). Tipos: `funcao`, `programa`, `elemento`, `subelemento`, `fonte`, `finalidade_pagamento`. Chave
  `(tipo, exercicio, codigo)`; o código fica como o FIPLAN mostra (`27`, `030`, `39`, `39.01`, `1.500`, `0`).
- **RLS**: `SELECT` para quem tem o módulo financeiro (e perfil ativo); sem policy nem privilégio de escrita para
  `authenticated`. Classe `preservar` no `rls/mapa.csv`, como `importacoes`.
- **RPC** `importar_classificadores_fiplan(p_tipo, p_exercicio, p_linhas, p_arquivo, p_simular)`, `SECURITY DEFINER`,
  mesma permissão do QDD (`orcamento.importar`, rótulo passa a "Importar dados do FIPLAN (QDD e tabelas)") e módulo
  financeiro. Simula (nada gravado) ou aplica numa transação; registra em `importacoes` (tipo `classificadores_fiplan`).
  Código fora do padrão ou repetido vira erro da linha e a aplicação não grava nada. Nada é apagado: códigos do
  exercício que não vieram no arquivo aparecem como "ausentes".
- **Efeito nos cadastros existentes** (só nome, nunca cria nem apaga): fonte → `fin_fontes_recurso` com os mesmos
  dígitos (só o nome: a situação não passa, para um exercício antigo não desativar fonte em uso); programa → `fin_programas_orcamentarios` do exercício com o mesmo número; elemento e
  subelemento → naturezas de `fin_naturezas_despesa` que ainda têm o nome provisório do QDD. Cada linha afetada leva
  um aviso na pré-visualização.
- **Front**: importador `classificadores_fiplan` na Central de Importações (`src/lib/importacao/importadores/`). O
  parser reconhece a tabela pelo título, acha o cabeçalho, pula cabeçalho repetido, título de outra aba e o aviso
  "Continua na próxima planilha", e exige um exercício só. Colunas que podem ser dado pessoal (responsável, CPF,
  e-mail, telefone, matrícula) não são guardadas; a RPC aplica o mesmo filtro e só aceita texto em `atributos`.

## Premissas

- Os nomes das fontes do FIPLAN substituem os do sistema (o FIPLAN é a fonte da verdade do orçamento, decisão do QDD).
- Programas e fontes que não existem no sistema **não** são criados nos cadastros: ficam só na tabela de classificadores,
  para não encher as listas com os 63 programas e 145 fontes do Estado.
- As fontes inventadas do catálogo inicial não são desativadas aqui (podem estar em dotações).
- Finalidade de pagamento não tem coluna de exercício: vale o do filtro da consulta ou, sem ele, o ano corrente (com aviso).

## Fora desta etapa

Credores (`fornecedores` com código do FIPLAN), NPD (programação financeira), UO/UG na configuração do cliente e
rubricas: etapas 2 a 5 da análise.

## Verificação

- `classificadoresFiplanParser.test.ts` (vitest).
- As seis planilhas reais lidas e importadas num Postgres local (63 programas, 29 funções, 78 elementos, 1.252
  subelementos, 145 fontes, 52 finalidades); reaplicar deu só "sem alteração".
- Bloco "Financeiro: tabelas do FIPLAN" de `scripts/db/testar-rls.sql`; `validar-baseline.sh` com `PG_REPLAY`.
