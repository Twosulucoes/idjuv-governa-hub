# Importação de empenhos pelo FIP 614 do FIPLAN — desenho

- **Data:** 2026-10-22 · **Classificação:** architectural (colunas e tabela novas, triggers existentes alterados, RPC nova, tela de detalhe)
- **Pedido (Fabiano):** "acho que é bom fazer o importador de empenho, pelo relatório do FIPLAN". Exemplo anexado:
  FIP 614 – Situação de Empenho, exercício 2026, data de referência até 30/09/2026, UO 17302 (fica só no anexo:
  tem nome de credores).
- **Decisão (cartão, 22/10/2026):** "FIPLAN é a fonte". O empenho é emitido no FIPLAN; o sistema espelha. Os
  empenhos importados aparecem em Financeiro → Empenhos, com LIQ, NOB e estornos como histórico.

## Premissas

1. O FIPLAN é a fonte da verdade da execução, como já decidido para o QDD em 2026-10-09
   (`2026-10-09-importacao-dados-qdd-fiplan-design.md`). A dotação continua vindo do QDD: importar empenhos **não
   mexe em `fin_dotacoes`**.
2. Os empenhos do FIPLAN não geram `fin_liquidacoes` nem `fin_pagamentos`. Essas tabelas pedem nota fiscal e conta
   bancária, e `fin_pagamentos` alimenta a remessa OBN600. LIQ, NOB, EST e GCV ficam numa tabela de histórico.
3. O relatório não traz CPF/CNPJ. O credor entra com o código e o nome do FIPLAN e é ligado ao Favorecido
   (`fornecedores`) só quando já existe um com o mesmo código do FIPLAN. Ligar pelo CPF/CNPJ (ex.: lista de
   credores do FIPLAN) fica para depois.
4. Reimportar um FIP 614 mais recente atualiza o mesmo empenho (chave: número + exercício) e troca o histórico
   dele. Nada é apagado: empenho do FIPLAN que existe no banco e não veio no arquivo só aparece como aviso.
5. Permissão: a mesma do QDD, `orcamento.importar` (quem importa o QDD importa a execução). Ver a lista continua
   como hoje (`orcamento.criar` na rota de Empenhos).
6. A migração vai pelo CI no merge (`migracoes-banco.yml`); nada é aplicado à mão.

## O relatório (FIP 614)

Formatos: PDF ou o "Excel" do FIPLAN (um `.xls` que é uma tabela HTML em ISO-8859-1). O Excel é o recomendado: traz a
dotação inteira, com o IDU, o nome do credor e o histórico da liquidação sem cortes, e o tipo do estorno escrito
(`EST EMP`, `EST LIQ`, `EST NOB`; o documento estornado vem como `LIQ EST`, `NOB EST`). Não traz o título, o exercício
nem a data de referência: o exercício sai do número dos empenhos. Conferido com o Excel até setembro: os mesmos 170
empenhos do PDF, soma igual ao TOTAL UG.

Cada bloco começa em `Nº PROCESSO: 00000112/26-14` e tem:

| Linha | O que traz |
|---|---|
| `PED` | nº do PED, data, dotação (`UO.UG.função.subfunção.programa.PAOE.regional.natureza.fonte.acomp.IDU.x`, IDU em número; o PDF corta depois do `acomp`), credor `código - nome` (o nome pode quebrar na linha de baixo) |
| `EMP` | nº, data, valor (coluna EMP/EST) |
| `LIQ` | nº, data, valor (coluna LIQ/EST) + uma linha "Histórico da Liquidação: …" (truncada) |
| `NOB` | nº, `P`/`C`, data, valor (coluna NOB/EST) |
| `GCV` | nº, data, valor (coluna GCV/EST) |
| `EST` | nº, data, valor; estorna o documento da coluna onde o valor cai (EMP, LIQ, NOB ou GCV) |
| `TOTAL` | 6 valores: EMP, LIQ, NOB, GCV, saldo a liquidar + em liquidação, a pagar |

No fim: `TOTAL UG` e `TOTAL DE EXECUÇÃO SEM DESTAQUE`. Cabeçalho e rodapé ("Página: N de M") se repetem em cada
página e um bloco pode atravessar a página.

Conferido no exemplo: 170 blocos, um EMP por bloco, 65 processos; a soma dos `TOTAL` dos blocos é igual ao
`TOTAL UG` em todas as colunas (R$ 25.812.040,50 empenhado; R$ 19.988.382,94 pago).

## Leitura (navegador, função pura com teste)

`src/lib/importacao/importadores/empenhosFip614Parser.ts`, sobre as linhas posicionadas de `pdfTexto.ts`:

- Valores vão para a coluna pela posição (borda direita × título da coluna), como no QDD.
- Uma linha por empenho: processo (convertido para o padrão SEI `17302.000112/2026.14`), PED (nº, data), EMP
  (nº, data, valor), dotação, credor (código, nome) e a lista de documentos (tipo, nº, data, P/C, coluna, valor,
  histórico).
- Conferências: no bloco, EMP − estornos de EMP = TOTAL EMP, e o mesmo para LIQ, NOB e GCV (erro); soma dos
  blocos = `TOTAL UG` (erro); exercício e UO do cabeçalho (erro se faltarem); bloco sem EMP (aviso, ignorado).

## Banco (uma migração)

`fin_empenhos` ganha:

- `origem text NOT NULL DEFAULT 'sistema'` com CHECK (`sistema` | `fiplan`);
- `credor_codigo_fiplan`, `credor_nome`, `ped_numero`, `ped_data`, `dotacao_fiplan`;
- `numero` passa de `varchar(20)` para `varchar(30)` (o número do FIPLAN tem 21 caracteres);
- `processo_fiplan`, `data_referencia_fiplan` e `importacao_id` (a importação que gravou por último);
- `fornecedor_id` e `dotacao_id` deixam de ser obrigatórios, com CHECK (`origem = 'fiplan' OR` os dois preenchidos):
  o empenho feito no sistema continua exigindo favorecido e dotação; `origem` não muda depois de gravada.

`fornecedores` ganha `codigo_credor_fiplan` (único quando preenchido), editável na tela de Favorecidos.

Tabela nova `fin_empenho_documentos_fiplan` (empenho, ordem, tipo, número, data, P/C, coluna, valor, histórico),
com RLS do módulo financeiro igual à de `fin_empenhos` (linha nova em `rls/mapa.csv`, policies geradas).

Triggers de `fin_empenhos` que somam na dotação ou conferem saldo (`fn_atualizar_saldo_dotacao_empenho`,
`fn_validar_saldo_empenho`, `fn_verificar_saldo_dotacao`) passam a **ignorar `origem = 'fiplan'`**. Para o
empenho feito no sistema nada muda.

RPC `importar_empenhos_fip614(p_exercicio, p_linhas, p_arquivo, p_simular)`, no padrão das outras importações
(`SECURITY DEFINER`, `search_path` fixo, perfil ativo + módulo financeiro + `orcamento.importar`, lock por
exercício, log em `importacoes`, diff por linha):

- Dotação: casa pelos dígitos de `função…fonte` como prefixo do `codigo_dotacao` do QDD. Um candidato só → liga.
  Vários (mesma natureza com IDUs diferentes): o IDU em número da dotação do FIP 614 (1 Não, 4 ECNI, 5 ECI, 6 EII)
  escolhe pela sigla do QDD. O Excel traz o IDU; o PDF corta a dotação antes dele (só a do primeiro bloco sai
  inteira), e aí a linha fica sem dotação, com aviso, para escolher no detalhe do empenho; a reimportação mantém a
  escolha enquanto ela continuar entre os candidatos. No exemplo em PDF, 18 dos 170 empenhos ficavam para escolher.
- Valores: `valor_empenhado` = EMP; `valor_anulado` = estornos de EMP; `valor_liquidado` = TOTAL LIQ;
  `valor_pago` = TOTAL NOB. Situação calculada (anulado, emitido, parcialmente liquidado, liquidado,
  parcialmente pago, pago).
- `objeto`: o relatório não traz o histórico do empenho; usa o da 1ª liquidação, senão "Empenho do FIPLAN –
  processo …".
- Número já usado por empenho feito no sistema → erro na linha (não sobrescreve).

## Tela

- Central de Importações: importador novo "Empenhos do FIPLAN (FIP 614)", com pré-visualização (processo, EMP,
  credor, empenhado, liquidado, pago, saldo).
- Financeiro → Empenhos: coluna Favorecido mostra o nome do credor do FIPLAN quando não há favorecido ligado;
  selo "FIPLAN" no número.
- Detalhe do empenho (`/financeiro/empenhos/:id`, hoje um marcador de lugar): cabeçalho com processo, PED,
  dotação, credor e totais, a escolha da dotação quando há mais de uma candidata, e a tabela do histórico (LIQ, NOB,
  estornos).
- Favorecidos: campo "Código do credor no FIPLAN". O empenho já importado liga ao favorecido na próxima importação.

## Fora desta entrega

- Ligar credor a favorecido pelo CPF/CNPJ.
- PEDs sem empenho (não aparecem no FIP 614; vêm do Fiplan.xls).
- Gerar liquidação/pagamento do sistema a partir do FIPLAN e casar NOB com a conciliação bancária.
