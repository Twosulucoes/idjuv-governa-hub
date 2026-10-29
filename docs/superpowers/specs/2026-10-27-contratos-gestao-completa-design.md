# Contratos: gestão completa do contrato (do cadastro ao encerramento)

- **Data:** 2026-10-27
- **Classificação:** architectural (tabelas e colunas novas, permissões novas, telas novas no módulo `contratos`)
- **Situação:** planejamento. Nada começa sem o "sim" do dono, entrega por entrega.
- **Pedido:** thread "Levantar a estrutura completa do IDJUV" (27/10/2026). O módulo Contratos "ficou restrito a
  passagens". O dono quer o módulo inteiro, com urgência, antes das outras sugestões.
- **Quem usa (Lei 2.301/2025 e Decreto 39.840-E/2026, art. 4º, II e III):** o Núcleo Administrativo de Contratos e
  Convênios (NuAC, na DiAGP) cadastra e acompanha; a DiAGP fiscaliza os serviços de apoio (vigilância, limpeza,
  alínea n); a DiCOF acompanha o financeiro e arquiva os contratos (alíneas o a s); gestor e fiscais designados por
  portaria acompanham a execução; o Controle Interno e a Assessoria Jurídica consultam.

## 1. Regras que não mudam

1. **O ato é do SEI.** Contrato, aditivo, apostilamento, designação de fiscal, notificação, penalidade e termo de
   recebimento são redigidos, assinados e publicados no SEI. O sistema registra o nº do processo e do documento,
   as datas e a publicação (DOE/PNCP), como já faz com portarias, termos de cessão e passagens.
2. **O dinheiro é do FIPLAN.** Empenho, liquidação e pagamento vêm do FIP 614 e dos PEDs. O contrato só se liga a eles.
3. O sistema é **controle**: quem é o responsável, quanto falta, o que vence, o que está pendente, o que aconteceu.
4. O controle de passagens aéreas (entregas 1 a 3) continua igual. Vira um **controle especial** do contrato da
   agência (`contratos.controla_passagens`), visível na ficha do contrato.

## 2. O que já existe

| Já existe | Situação | Uso aqui |
|---|---|---|
| `contratos` (nº, ano, processo de contratação, fornecedor, objeto, valores, vigência, gestor, fiscal, garantia, DOE) | tabela sem tela de cadastro | Base da ficha. Ganha colunas (§4) |
| `aditivos_contrato` (tipo prazo/valor/prazo_valor, acréscimo, supressão, nova data) | tabela sem tela | Base das alterações |
| `medicoes_contrato` (período, valor medido/aprovado, NF) | tabela sem tela | Base das medições de serviço e obra |
| `itens_contrato` (quantidade, entregue, saldo, valor unitário) | tabela sem tela | Itens e saldo por item |
| `atas_registro_preco`, `itens_ata_registro_preco` | tabelas sem tela | Entrega 6 |
| `fornecedores` (com código de credor do FIPLAN) | usado pelo Financeiro | Contratado |
| `fin_empenhos` (FIP 614, já com `contrato_id`) e as funções `passagem_empenhos_*` | em uso nas passagens | Saldo empenhado × pago de qualquer contrato |
| `passagem_faturas` (recebida → atestada → liquidada → paga) | em uso nas passagens | Modelo para as notas fiscais de todos os contratos |
| `processos_licitatorios` (processos de contratação) | em uso em Compras | O contrato aponta para o processo que o originou |
| Permissões `contratos.visualizar`, `criar`, `editar`, `tramitar`, `passagens.*` | existem | Reaproveitadas; novas em §5 |
| Avisos e datas (sino), envio de e-mail e WhatsApp | em uso | Alertas de vencimento |
| Motor de documentos (`src/lib/documentos/`) | em uso | Ficha do contrato e relatórios |

## 3. O fluxo que o módulo cobre

```
processo de contratação (Compras) ──► contrato assinado no SEI ──► cadastro no sistema
      ▼
gestor e fiscais (portaria SEI) ──► execução: notas, atesto, medições, ocorrências
      ▼                                   ▼
alterações (aditivo, apostila)      empenho/liquidação/pagamento (FIPLAN, só ligado)
      ▼
alertas: vigência, garantia, certidões, nota parada ──► prorrogar (novo processo SEI) ou encerrar
      ▼
sanções (se houver) ──► recebimento definitivo ──► encerramento
```

## 4. Entregas propostas

Cada entrega é uma PR, com migração, RLS, telas, documentação e o "sim" antes de começar.

### C1. Cadastro, lista e ficha do contrato
- **Lista** `/contratos/lista`: nº/ano, objeto resumido, contratado, setor demandante, gestor, valor atual, vigência
  atual com selo (vigente, vence em 120/90/60/30 dias, vencido, encerrado), busca e filtros. Exporta planilha.
- **Ficha** `/contratos/:id` com abas: **Dados** (processo SEI, processo de contratação, modalidade e fundamento,
  tipo de contrato, valores, vigência, publicação DOE e PNCP, dotação), **Itens**, **Responsáveis**, **Histórico**.
- **Responsáveis**: tabela nova `contrato_responsaveis` (papel: gestor, fiscal técnico, fiscal administrativo,
  suplente; servidor; portaria SEI; início e fim). Substitui os campos únicos `gestor_id`/`fiscal_id`, que viram
  leitura do responsável vigente.
- **Colunas novas em `contratos`**: `processo_sei`, `numero_pncp`, `tipo_contrato` (serviço contínuo, serviço por
  escopo, fornecimento, obra, locação, outro), `prorrogavel`, `prazo_maximo_meses`, `unidade_demandante_id`
  (estrutura organizacional), `natureza_despesa`.
- **Importar planilha** dos contratos vigentes (modelo para baixar, simula antes, como o quadro de vagas).
- PDF: ficha do contrato.

### C2. Alterações e prazos
- Aba **Alterações**: aditivo (prazo, valor, qualitativo), apostilamento (reajuste, repactuação, troca de dotação),
  suspensão, rescisão. Cada uma com nº do documento SEI, data e DOE. O valor atual e a vigência atual passam a ser
  calculados pelas alterações (no banco), não digitados.
- **Limite de acréscimo**: aviso quando a soma dos acréscimos passar de 25% do valor inicial (50% em reforma),
  Lei 14.133/2021, art. 125.
- **Painel de vencimentos** `/contratos/vencimentos`: o que vence em 120, 90, 60 e 30 dias, com a ação esperada
  (abrir processo de prorrogação no SEI, nova contratação ou encerrar) e a garantia vencendo.
- **Alerta** no sino de avisos e por e-mail ao gestor e ao fiscal. Os prazos de aviso ficam na configuração do módulo.

### C3. Execução financeira
- Aba **Notas fiscais** generaliza as faturas das passagens: recebida → atestada (pelo fiscal, com o nº do atesto no
  SEI) → liquidada → paga (ligada à OB/NOB do FIPLAN). Nota sem atesto há mais de X dias ganha destaque.
- Aba **Empenhos**: liga os empenhos do FIP 614 ao contrato (as funções das passagens viram gerais) e mostra
  empenhado, liquidado e pago por exercício.
- **Medições** para serviço por medição e obra (tabela já existe).
- **Saldo do contrato**: valor atual − executado; saldo empenhado − pago; por item quando houver itens.

### C4. Fiscalização
- Aba **Ocorrências** (livro de ocorrências): data, fato, providência, prazo, notificação no SEI, resolvida ou não.
- **Relatório mensal do fiscal** com checklist pelo tipo de contrato (ex.: vigilância e limpeza: postos cobertos,
  uniformes, materiais, frequência dos terceirizados). Feito no celular, com foto.
- **Garantia contratual** (tipo, valor, vencimento) e **certidões do contratado** (federal, FGTS, trabalhista,
  estadual, municipal) com validade e alerta.
- Avaliação do fornecedor ao fim de cada período.

### C5. Sanções, encerramento e transparência
- **Sanções**: advertência, multa, impedimento e inidoneidade, com processo SEI, defesa, decisão e publicação.
  Ficam no cadastro do fornecedor (consulta antes de contratar de novo).
- **Encerramento**: recebimento provisório e definitivo (documento SEI), liberação da garantia, saldo de empenho a
  anular, relatório final.
- **Transparência**: lista pública de contratos vigentes (sem dado pessoal) na página de Transparência.

### C6. Atas de registro de preço
- Ata, itens, fornecedores, vigência, saldo por item, adesões (carona) e os contratos e empenhos que consomem a ata.
  Depende de o IDJUV usar atas próprias ou só aderir às do Estado (pergunta P4).

### Depois: convênios e termos de fomento
O NuAC também cuida de convênios. Eles têm o mesmo esqueleto (instrumento, partes, vigência, valor, responsáveis,
alterações), mas a prestação de contas é outra. Fica para a frente "Convênios e apoio a eventos" do roadmap,
reaproveitando as tabelas deste módulo com um campo `tipo_instrumento`.

## 5. Permissões

| Permissão | Quem | O que libera |
|---|---|---|
| `contratos.visualizar` (existe) | quem acompanha | ler lista e fichas |
| `contratos.criar` / `contratos.editar` (existem) | NuAC | cadastrar, alterar, importar |
| `contratos.fiscalizar` (nova) | gestor e fiscais | ocorrências, relatório do fiscal e atesto **só dos contratos em que são responsáveis** (conferido no banco) |
| `contratos.financeiro` (nova, generaliza `contratos.passagens.financeiro`) | DiCOF | notas, liquidação, pagamento, empenhos |

RLS em toda tabela nova na mesma migração (skill `migracao-segura-idjuv`); a regra do fiscal fica numa função do
banco, não só na tela.

## 6. Menu de Contratos depois das entregas

Painel · Contratos · Vencimentos · Passagens aéreas (Pedidos, Beneficiários, Pendências, Faturas) · Atas (C6).

## 7. Perguntas ao dono (não travam a C1)

- **P1.** Existe uma planilha dos contratos vigentes hoje (nº, contratado, objeto, valor, vigência, gestor, fiscal)?
  Ela vira a primeira carga.
- **P2.** Os fiscais vão lançar ocorrências e relatório no sistema, ou só o NuAC lança por eles?
- **P3.** Com quantos dias de antecedência a renovação precisa começar? (proposta: aviso em 120, 90, 60 e 30 dias)
- **P4.** O IDJUV tem atas de registro de preço próprias ou só adere às do Estado?

## 8. Fora deste plano

- Redigir contrato, aditivo, notificação ou termo (é do SEI).
- Lançar empenho ou pagamento (é do FIPLAN; a contingência continua no Financeiro).
- Tramitar o processo (é do SEI; o localizador já mostra onde ele está).
