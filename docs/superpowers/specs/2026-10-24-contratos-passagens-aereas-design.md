# Contratos: controle de passagens aéreas

- **Data:** 2026-10-24
- **Classificação:** architectural (tabelas novas, permissões novas, telas novas no módulo `contratos`)
- **Pedido:** thread "Controle de passagens aéreas". O usuário tem dificuldade de controlar as passagens: o pedido que
  chega (de servidor ou de fora), a aprovação, o cadastro de quem viaja quando não é servidor, o pedido à agência, a
  cotação, a emissão, o relatório, o que juntar no SEI e o financeiro do contrato até o pagamento.
- **Decidido em conversa (23 e 24/10):**
  1. **O SEI continua fazendo o papel dele.** O sistema é controle e cadastro: não tramita, não assina, não redige ato.
     Cada aprovação é registrada com a data e o nº do documento SEI.
  2. O pedido pode chegar pelo SEI, por e-mail, de pessoa física ou de instituição (ex.: federação), mas **sempre vira
     um processo SEI**. No sistema, um pedido = um processo SEI.
  3. Um pedido pode ter **vários passageiros**, e cada passageiro seus trechos.
  4. Quem aprova a viagem e a cotação é o **Presidente** (no SEI).
  5. O financeiro marca as passagens **pagas**, ligando cada uma à nota fiscal da agência.
  6. Relatório de viagem: a norma para atletas e alunos não está definida. O sistema não crava regra: cada pedido diz
     como presta contas (individual, único do evento ou dispensado com motivo).

## 1. O que já existe

| Já existe | Uso aqui |
|---|---|
| `viagens_diarias` (RH → Viagens): viagem de **servidor**, diárias, portaria, relatório de viagem; passagem é só um sim/não | O passageiro servidor pode apontar para a viagem do RH; o relatório dele é o de lá |
| `servidores` | Passageiro servidor vem daqui (não se recadastra) |
| `contratos` (sem tela de cadastro; só o painel de Contratos) | O contrato da agência (01/2026) é cadastrado aqui |
| `fornecedores` | A agência (credor do contrato) |
| `fin_empenhos` (importados do FIP 614, com `contrato_id`, `processo_sei`, natureza) | Empenhos que cobrem o contrato; dão o saldo empenhado |
| `processos_licitatorios` (spec de reserva por natureza) | O processo de contratação da agência; o contrato aponta para ele. Os pedidos de passagem **não** entram lá: são processos de execução do contrato |
| `instituicoes`, `federacoes_esportivas` | Instituição que pediu, quando houver |
| Motor de documentos (`src/lib/documentos/`) | Relatórios impressos |

## 2. Premissas

1. O sistema não gera ato (requisição, autorização, termo). Só relatórios e fichas de controle para juntar no SEI
   quando o setor quiser.
2. O valor que conta no contrato é o da **emissão** (tarifa + taxa de embarque + taxa de serviço − desconto), digitado
   a partir do bilhete/fatura da agência. Cotação não consome saldo.
3. Um contrato por vez costuma estar vigente, mas o pedido escolhe o contrato (preparado para o próximo).
4. Dados pessoais (CPF, nascimento, documento) só para quem tem a permissão do módulo; nada em tela pública (LGPD).

## 3. Fluxo e situações do pedido

```
recebido → cotação solicitada → cotação recebida → aprovado (Presidente, nº doc SEI)
         → emitido → concluído (todos voltaram e prestaram contas)
qualquer situação → cancelado (motivo)
```

- **Recebido:** nº do processo SEI, data, origem (SEI, e-mail, ofício), solicitante (servidor, pessoa ou instituição),
  finalidade/evento, cidade e datas do evento, contrato.
- **Cotação:** por passageiro e trecho, as opções que a agência mandou (cia, voo, horário, valor). Uma é marcada como
  escolhida.
- **Aprovado:** data e nº do documento SEI da autorização do Presidente.
- **Emitido:** por passageiro e trecho: localizador, nº do bilhete, cia, voo, data/hora, tarifa, taxa de embarque,
  taxa de serviço, desconto e total. Bilhete em PDF opcional (anexo privado).
- **Remarcação, cancelamento e reembolso** de um bilhete ficam registrados no próprio trecho (multa, diferença,
  crédito), e entram na conta do contrato.

## 4. Prestação de contas (relatório)

No pedido, escolhe-se o modo:

- **Individual:** cada passageiro entrega o seu. Para servidor, é o relatório de viagem do RH (`viagens_diarias`).
- **Único do evento:** um relatório para o grupo, feito pelo responsável da delegação (indicado no pedido).
- **Dispensado:** com o motivo escrito.

Cada passageiro guarda o **cartão de embarque** (anexo privado) e a data de entrega do relatório. A lista
"Pendências" mostra quem voltou e ainda não entregou cartão de embarque ou relatório, com dias de atraso. O prazo
(dias após o retorno) é uma configuração do módulo, com 5 dias de início, até a norma ser confirmada.

## 5. Financeiro do contrato

- **Faturas da agência:** nº da nota fiscal, data, valor, nº do processo SEI de pagamento, e quais bilhetes emitidos
  ela cobre. A soma dos bilhetes tem de bater com o valor da nota (o sistema avisa a diferença).
- Situação da fatura: **recebida → atestada (fiscal) → liquidada → paga**, com data e nº da OB quando paga. Não
  duplica o Financeiro: o liquidado e o pago oficiais continuam vindo do FIPLAN; a fatura só registra o que ela cobre.
- **Saldo do contrato:** valor do contrato, emitido, faturado, pago e saldo; e, por exercício, empenhado (FIP 614 com
  o contrato) × emitido, para saber quanto o empenho ainda cobre.
- Bilhete emitido sem fatura há mais de 30 dias aparece em "a faturar".

## 6. Dados (uma migração, com RLS e políticas nela)

- **`passagem_beneficiarios`:** pessoa de fora (nome, CPF único, nascimento, documento e órgão emissor, telefone,
  e-mail, instituição opcional). Servidor não entra aqui: o passageiro aponta para `servidores`.
- **`passagem_pedidos`:** contrato, nº SEI (único), data, origem, solicitante (servidor, beneficiário ou instituição),
  finalidade, evento, destino, datas, modo de prestação de contas, responsável do grupo, situação, nº e data do
  documento de aprovação, motivo do cancelamento, quem e quando.
- **`passagem_passageiros`:** pedido + servidor **ou** beneficiário (um dos dois), viagem do RH opcional, cartão de
  embarque entregue, relatório entregue (data), dispensa.
- **`passagem_trechos`:** passageiro, origem, destino, data, cotação escolhida, e os dados da emissão (localizador,
  bilhete, valores, situação: emitido, remarcado, cancelado, reembolsado).
- **`passagem_cotacoes`:** opções da agência por trecho.
- **`passagem_faturas`** e **`passagem_fatura_itens`:** nota fiscal da agência e os trechos que ela cobre (um trecho
  só numa fatura).
- Anexos (bilhete, cartão de embarque) num bucket **privado**, com política pela mesma permissão.
- Visão `vw_passagem_saldo_contrato` (`security_invoker`) para o saldo.

**RBAC:** permissões novas `contratos.passagens.visualizar`, `contratos.passagens.editar` e
`contratos.passagens.financeiro` (faturas e pagamento). Rota exige a permissão no `ProtectedRoute` e as políticas
exigem a mesma no banco. Ninguém de fora do módulo vê CPF.

## 7. Telas (módulo Contratos, `/contratos/passagens`)

1. **Pedidos:** lista com nº SEI, solicitante, evento, nº de passageiros, situação, valor emitido; filtros por
   situação, período, instituição. Botão "Novo pedido".
2. **Ficha do pedido**, em abas: Dados · Passageiros e trechos (cotação e emissão) · Prestação de contas · Histórico.
3. **Beneficiários:** cadastro e busca por nome/CPF, com as viagens de cada um.
4. **Contrato e faturas:** escolha do contrato, saldo, faturas e "a faturar".
5. **Pendências:** relatórios e cartões de embarque em atraso.
6. **Relatórios (PDF e planilha):** passagens por período, por beneficiário, por instituição/evento, saldo do contrato
   e ficha do pedido (para juntar no SEI quando quiser).

Menu de Contratos ganha "Passagens aéreas". Cadastro mínimo do contrato (número, agência, valor, vigência, processo)
dentro da tela de contrato, até o módulo Contratos ganhar a sua.

## 8. Fora do escopo

- Tramitar, assinar ou redigir no SEI; integração com a API do SEI ou da agência.
- Diárias (continuam em RH → Viagens).
- Cadastro geral de contratos, aditivos e medições de outros contratos.

## 9. Testes e verificação

- Vitest: cálculo do total do bilhete, saldo do contrato (emitido, remarcado, cancelado, reembolso), conferência da
  fatura × bilhetes, pendências (prazo e modo de prestação de contas).
- Banco: RLS das tabelas e do bucket no teste do baseline (`scripts/db/validar-baseline.sh`).
- `bash scripts/gate.sh` verde; telas vistas no navegador em 390px e desktop; docs da matriz e `ROADMAP.md`.

## 10. Entregas

| # | Entrega | Migração |
|---|---|---|
| 1 | Beneficiários, pedidos, passageiros, trechos, cotação e emissão; contrato mínimo; lista e ficha | sim (pede o "sim") |
| 2 | Prestação de contas, anexos privados e pendências | sim (pede o "sim") |
| 3 | Faturas, pagas, saldo do contrato × empenho e relatórios | sim (pede o "sim") |
