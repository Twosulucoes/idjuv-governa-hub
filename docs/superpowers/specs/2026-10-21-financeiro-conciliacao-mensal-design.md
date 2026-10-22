# Conciliação bancária mensal (quadro da SEFAZ) — desenho

Data: 21/10/2026. Classificação: **architectural** (tela nova, duas tabelas novas, leitores de arquivo novos).
Pedido do dono: "fazer as conciliações bancárias de forma automática", a partir do modelo de julho/2026 (FIP630,
FIP103, quadro da SEFAZ e extratos OFX do BB). Os arquivos de exemplo têm dados de credores e **não** entram no
repositório; os testes usam dados fictícios.

## Problema

Todo mês a contabilidade fecha, à mão, o quadro "Conciliação bancária" da SEFAZ para a conta BB 3797-4 / 10050-1
(conta corrente e aplicação):

| Linha do quadro | Origem |
|---|---|
| Saldo do razão | FIP630, "Total Geral Unidade Orçamentária" |
| (−) Débitos contábeis não correspondidos no banco | lançamento a débito no razão sem par no extrato |
| (+) Créditos contábeis não correspondidos no banco | NOB/RE paga no razão que não saiu no banco |
| (−) Débitos bancários não correspondidos no razão | tarifa, folha, OB que saiu no banco sem registro no razão |
| (+) Créditos bancários não correspondidos no razão | OB cancelada (recusada), rendimento da aplicação |
| Saldo do razão ajustado = saldo do extrato | conta corrente + fundo no último dia |

As pendências **ficam de um mês para o outro** até alguém regularizar: o quadro de julho ainda lista tarifas de
março. A OB recusada pelo banco é o caso que mais pesa: o FIPLAN a dá como paga, o extrato mostra a "Ordem banc.
cancelada", e a regularização (reenvio pelo Gestão MAX, cujo retorno o FIPLAN não lê) só aparece aqui.

## O que os arquivos trazem (conferido com julho/2026)

- **OFX do BB** (conta corrente): data, valor com sinal, `CHECKNUM`, `MEMO`.
  - "EMISSÃO ORDEM BANCÁRIA": `CHECKNUM` = `4` + ano (2) + nº da **RE** com DV. Ex.: `426000151` = RE
    `17302.0001.26.00015-1`, débito igual ao subtotal da RE no FIP103.
  - "ORDEM BANC CANCELADA": `CHECKNUM` = `4` + ano + nº da **NOB** com DV + `0000`. Ex.: `4260008860000` = NOB
    `26.00088-6`.
  - "BB-APLIC" / "RESGATE AUTOMÁTICO" (`CHECKNUM` 1972): ida e volta entre a conta e o fundo; dentro do quadro
    (conta + aplicação) não contam.
  - "ORDEM BANCÁRIA [– ESTADO DE RORAIMA]": entrada de repasse do Tesouro (casa com ARR do razão).
  - Tarifas ("TARIFA…", "TAR …"), "FOLHA DE PAGAMENTO", "PAGAMENTOS DIVERSOS": débitos.
  - O OFX **não** traz o saldo nem o rendimento do fundo (a conta corrente fica zerada; o saldo está no BB RF CP
    Automático).
- **FIP630** (PDF): lançamentos por UG e conta contábil (`1.1.1.1.1.19.04.01` conta especial e
  `1.1.1.1.1.50.02.00` fundos), com data, documento, tipo (NOB, ARR, NLA…), histórico, débito e crédito; saldo
  anterior e "Total Geral Unidade Orçamentária" (o saldo do razão do quadro).
- **FIP103** (PDF): NOBs do mês agrupadas por RE, com subtotal por RE. É o elo RE → NOBs. O nome do credor
  **não** é gravado.

## Desenho

### Fluxo na tela

Nova aba **Fechamento mensal** em Financeiro → Conciliação bancária (permissão `pagamento.conciliar`, a mesma da
página):

1. Escolhe a conta (`fin_contas_bancarias`) e o mês.
2. Envia o **FIP630**, o **FIP103** e o **OFX** do mês (lidos no navegador; só os lançamentos vão ao banco).
3. Digita o **saldo da conta corrente** no último dia e o **rendimento do mês** (decisão "Os dois": nesta entrega
   digita; a leitura do PDF do extrato vem numa segunda). O **saldo do fundo** é calculado: saldo do fundo no fim do
   mês anterior gravado + aplicações ("BB-APLIC") − resgates automáticos do OFX + rendimento. No primeiro mês no
   sistema o saldo do fundo no início do mês é digitado uma vez. O movimento do fundo fica gravado com o nome do OFX
   em `arquivos`, para refazer a conta ao reabrir a tela (mês gravado sem ele continua com o saldo digitado). O
   rendimento mudado depois da leitura troca o crédito bancário do quadro.
   O FIP630 e o OFX são conferidos contra a conta escolhida (filtro "Número da Conta Corrente contém" e contas
   correntes listadas no razão; `ACCTID` do OFX): arquivo de outra conta dá aviso.
4. O sistema traz as **pendências em aberto do mês anterior** e casa tudo (regras abaixo).
5. A tela mostra o quadro com as quatro listas e o que casou; o usuário casa ou descasa à mão o que sobrar, com
   justificativa.
6. **Fechar o mês**: grava o retrato e trava as linhas. O quadro sai em PDF pelo motor de documentos
   (`src/lib/documentos/`), no layout da SEFAZ, com "Feito por".

**Implantação:** no primeiro mês não há mês anterior no sistema. A tela deixa lançar as **pendências de
abertura** (data, histórico, valor e lista), copiadas do último quadro feito à mão.

### Regras de casamento (lógica pura, `src/lib/conciliacao/`)

Em ordem, cada item casa uma vez só:

1. **Internos** saem da conta: aplicação/resgate automático do OFX; no razão, NLA e o seu estorno, e o
   sub-repasse entre UGs (mesmo documento e valor, um a débito e outro a crédito).
2. **RE**: débito "Emissão Ordem Bancária" do OFX com o nº da RE casa com as NOBs dessa RE no razão (via FIP103)
   quando a soma bate.
3. **OB cancelada**: crédito do OFX com o nº da NOB casa com o lançamento do razão que a estorna ou regulariza
   (mesmo valor, referência à NOB); sem ele, fica como crédito bancário pendente.
4. **Repasse**: ARR a débito no razão com entrada "Ordem Bancária" do OFX, de mesmo valor, em até 3 dias úteis.
5. **Valor e data**: o que sobrar casa por valor igual e lado oposto, em até 3 dias úteis, só com candidato
   único.
6. **Pendência anterior**: as mesmas regras valem para as pendências em aberto do mês anterior. Exemplo: a RE de
   IRPJ/INSS paga em 24/07 e debitada no banco em agosto sai da lista em agosto.

O que não casa vai para a lista do lado e da natureza que tem. O teste de aceite é julho/2026: razão 121.650,52;
listas 0 / 165.166,35 / 128.760,03 / 1.817,51; ajustado = extrato = 159.874,35. O teste roda localmente, com os
arquivos reais fora do repositório. No repositório entra um caso fictício com a mesma forma.

### Banco (migração nova, RLS na mesma migração)

- `fin_conciliacoes_mensais`: `conta_bancaria_id`, `competencia` (1º dia do mês), `saldo_razao`, `saldo_conta`,
  `saldo_fundo`, `rendimento_fundo`, `situacao` (`rascunho` | `fechada`), hashes dos arquivos, `fechada_em/por`;
  UNIQUE (conta, competência).
- `fin_conciliacao_itens`: `conciliacao_id`, `lado` (`contabil` | `bancario`), `natureza` (`debito` | `credito`),
  `data`, `documento` (RE, NOB, ARR ou `CHECKNUM`), `historico`, `valor`, `situacao` (`casado` | `pendente`),
  `grupo` (itens casados juntos), `regra`, `justificativa` (casamento manual), `item_origem_id` (pendência trazida
  do mês anterior), `abertura` (lançada na implantação).
- RLS: classe `modulo`, financeiro; DELETE só do rascunho. Um gatilho recusa mudar linhas de mês `fechada` (só o
  admin reabre, por RPC com motivo). Sem dado pessoal: o histórico é o do razão e do extrato, nunca o nome do
  credor.

### Extrato mensal do fundo em PDF (entrega seguinte)

Quarto arquivo, opcional: o extrato mensal do fundo do BB ("Consultas - Investimentos Fundos - Mensal", em
Investimentos → Fundos). `src/lib/conciliacao/extratoFundoBB.ts` lê a conta, o mês de referência e o "Resumo do mês"
de cada fundo (saldo anterior, aplicações, resgates, rendimento líquido, saldo atual; recusa resumo que não fecha) e
soma os fundos. O rendimento líquido preenche o rendimento do mês; na implantação, o saldo anterior preenche o saldo
do fundo no início do mês. Avisos: extrato de outra conta ou de outro mês, saldo anterior diferente do mês anterior
gravado, aplicações e resgates diferentes dos do OFX. Sem o PDF, o rendimento continua digitado.

### Sugestão de casamentos pela IA (entrega seguinte)

Botão "Sugerir casamentos (IA)" na tela do mês: as pendências que sobraram vão para a Edge Function
`conciliacao-ia-sugestoes` (Gemini), com id curto e CPF/CNPJ do histórico apagados. Volta uma lista de grupos com o
motivo; só ficam os que fecham (débitos = créditos), conferidos na função e de novo no navegador. Nada casa sozinho:
cada sugestão aparece num cartão e o usuário aceita (vira casamento manual com "Sugestão da IA aceita: <motivo>" na
justificativa) ou recusa. Permissão `pagamento.conciliar`, cota de 20 pedidos por usuário por hora. Detalhes em
`docs/EDGE_FUNCTIONS.md`.

### Planilha Excel (entrega seguinte)

Botão "Excel da conciliação" ao lado do PDF do quadro, com o cálculo na tela (rascunho ou mês fechado).
`src/lib/conciliacao/planilha.ts` monta quatro abas: **Resumo** (conta, competência, situação, o quadro, o fundo no
mês e os casamentos por regra, com grupos, itens e valor), **Casamentos** (uma linha por lançamento, com o número do
grupo, a regra e a justificativa; razão antes do banco), **Pendências** (as quatro listas do quadro) e **Todos os
itens** (casado ou pendente, com o grupo). Dinheiro sai como número com duas casas, para somar e filtrar no Excel. O
PDF continua sendo o documento do quadro; a planilha é para conferir.

### Fora desta entrega

- Extrato pela `bb-api` (homologação no P15).
- Lançamento de regularização no FIPLAN: o sistema só mostra e documenta; o ato é do FIPLAN/SEFAZ.
- Outras contas: o desenho vale para qualquer conta, mas a conferência é só a 10050-1.

## Riscos

- O leiaute do PDF do FIPLAN muda → o leitor do FIP630/FIP103 recusa com mensagem clara, sem casar pela metade.
- Casamento errado por valor igual → só com candidato único, e todo casamento automático mostra a regra usada.
