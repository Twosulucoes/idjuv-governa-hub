# Compras: processos de contratação com reserva por natureza de despesa

- **Data:** 2026-10-23
- **Classificação:** architectural (tabelas e colunas novas, RPC, telas novas no módulo `compras`, leitura no Financeiro)
- **Pedido:** thread "Reserva por natureza nos processos". O usuário pediu, nos processos de contratação, uma
  estrutura que ligue cada processo às naturezas de despesa, "uma espécie de reserva", para saber se já existe
  programação para aquela natureza antes de abrir outro processo ou empenhar.
- **Decidido em conversa (23/10):**
  1. O processo nasce num cadastro de processos em Compras (nº SEI, objeto, forma de contratação), que pode puxar
     itens do PCA; cada linha reserva um valor por natureza × ação × fonte.
  2. Se a reserva passar do saldo livre, o sistema avisa e pede justificativa escrita (não trava).
  3. ~~Digitar o nº do PED na linha~~ (revisto em 24/10, ver §10): o sistema importa o relatório do FIPLAN
     "Consultar Pedido de Empenho da Despesa (PED)" e liga cada PED ao processo pelo número; a parte da reserva que
     já virou PED ou empenho sai da conta (o QDD já a desconta).
  4. A planilha de acompanhamento dos processos de 2026 (11 processos) entra como primeira carga, com histórico de
     andamento (data, fase, setor, situação).

## 1. O que já existe

| Já existe | Uso aqui |
|---|---|
| `processos_licitatorios` (nº único, objeto, modalidade, valor estimado, fase) — sem tela; contada no painel de Compras; referenciada por `contratos`, `atas_registro_preco`, `fin_solicitacoes`, `empenhos` | **É o processo.** Ganha colunas; não se cria tabela paralela |
| `pca_itens` (ação, fonte, natureza, nº SEI do DFD, valor) | Origem das linhas de reserva ("puxar do PCA") |
| `fin_dotacoes` (QDD do FIPLAN: atual, empenhado, bloqueado, reserva, PED) | Saldo da dotação por ação × fonte × natureza |
| `fin_empenhos` (FIP 614: `processo_sei`, `ped_numero`, natureza, fonte) | Empenhado do processo e fechamento da reserva |
| Painel do Financeiro (`src/lib/financeiro/painelExecucao.ts`) | Saldo = atual − empenhado − bloqueado − reserva − PED; passa a mostrar o reservado em processos |
| Importação genérica (`src/lib/importacao/`) | Carga da planilha dos processos |

## 2. Premissas

1. O ato é do SEI: o sistema não redige DFD, ETP, TR nem parecer; só registra o andamento que acontece lá.
2. A reserva é **gerencial** (do sistema). Não cria reserva nem PED no FIPLAN.
3. A reserva é por exercício. Processo de vários anos (ex.: o de agenciamento de viagens, R$ 34 mi em 5 anos)
   reserva no ano só a parte do ano; o valor estimado do processo continua o total.
4. Só a natureza que tem dotação no QDD do exercício pode ser escolhida (sem dotação não há saldo para comparar).
   Se o QDD ainda não foi importado, a reserva salva com o aviso "sem QDD para comparar" e justificativa.

## 3. Saldo livre

Para um exercício e uma combinação ação × fonte × natureza:

```
saldo livre = Σ dotações do QDD (atual − empenhado − bloqueado − reserva − PED)
            − Σ reservas do sistema na situação "reservada" (de todos os processos)
```

Linhas com PED digitado ou já empenhadas não entram na segunda soma: o FIPLAN já as desconta. Ao salvar uma linha,
o sistema compara o valor com o saldo livre **sem a própria linha**; se faltar, mostra quanto falta e exige a
justificativa, que fica gravada com o saldo do momento.

## 4. Dados (uma migração, com RLS e políticas nela)

**`processos_licitatorios` (colunas novas):**
- `etapa` (texto, lista fixa): `abertura`, `dfd`, `etp`, `tr`, `cotacao`, `levantamento_tecnico`,
  `instrucao_adesao`, `analise_juridica`, `selecao` (edital/sessão), `contrato`, `execucao`, `encerrado`,
  `cancelado`. Tirada da planilha do Instituto; `fase_atual` antiga fica e o painel de Compras passa a contar por
  `etapa`.
- `setor_atual` (texto, como no SEI: "IDJUV/PRESI/DIRAF/EPC").
- `situacao_atual` (texto livre) e `atualizado_em` (data da última movimentação).
- `valor_estimado_obs` (texto: "não informado", "estimativa preliminar"...).
- `modalidade` passa a aceitar vazio ("a definir") e o tipo ganha `adesao_ata`.

**`processo_reservas` (nova):** processo, exercício, ação, fonte, natureza, item do PCA (opcional), valor (> 0),
situação (`reservada`, `ped`, `cancelada`), nº e data do PED, justificativa de saldo insuficiente, saldo livre no
momento, motivo do cancelamento, quem e quando. "Empenhada" não é gravada: é calculada (abaixo).

**`processo_andamentos` (nova):** processo, data, etapa, setor, situação (texto), quem e quando. Um gatilho copia a
movimentação mais recente para `etapa`, `setor_atual`, `situacao_atual` e `atualizado_em` do processo.

**Funções:**
- `processo_saldo_livre(exercicio, acao, fonte, natureza, ignorar_reserva)` — conta da seção 3.
- `processo_reserva_salvar(...)` — confere permissão, calcula o saldo livre, exige justificativa se faltar e grava.
  A tela grava só por ela (insert/update direto na tabela fica fechado).
- Visão `vw_processo_reservas`: cada linha com o empenhado ligado (empenhos do FIP 614 com o mesmo `ped_numero`
  ou, sem PED, com o mesmo nº SEI e a mesma natureza e fonte) e a situação efetiva (`empenhada` quando o empenhado
  cobre o valor). `security_invoker`, para valer a RLS das tabelas.

**RBAC:** permissões novas `compras.processos.visualizar` e `compras.processos.editar` (dadas a quem já tem
`compras.criar`, como no PCA). Leitura das reservas também para quem vê o Financeiro (o painel precisa). Escrita
só com `compras.processos.editar` no módulo `compras`. As políticas atuais de `processos_licitatorios` ficam.

## 5. Telas (módulo Compras)

1. **`/compras/processos` — lista:** nº SEI, objeto resumido, forma, etapa, setor, dias parado, valor estimado,
   reservado no ano, empenhado. Filtros por etapa, setor, ano e "sem saldo". Botão "Importar planilha".
2. **`/compras/processos/:id` — ficha**, em abas:
   - **Dados:** nº SEI, objeto, forma, valor estimado e observação, unidade requisitante.
   - **Reservas:** linhas por natureza × ação × fonte, com o saldo livre ao lado; "Puxar do PCA" lista os itens do
     PCA do mesmo nº SEI (ou à escolha) agrupados por natureza; botão "Informar PED"; aviso vermelho e campo de
     justificativa quando falta saldo.
   - **Andamento:** linha do tempo das movimentações; "Nova movimentação" (data, etapa, setor, situação).
   - **Empenhos:** empenhos do FIP 614 ligados ao processo.
3. **`/compras/processos/programacao` — programação por natureza:** para o exercício, cada natureza × ação × fonte
   com dotação, PED/reserva do FIPLAN, reservado em processos, saldo livre e os processos que reservaram.
   É a resposta direta à pergunta "já tem programação para essa natureza?".
4. **Painel do Financeiro:** cartão "Reservado em processos" e o alerta de saldo passa a considerar o saldo livre.

Menu de Compras ganha "Processos" e "Programação por natureza".

## 6. Carga da planilha

Importador de planilha (padrão dos importadores de `src/lib/importacao/importadores/`) que lê a planilha organizada
(abas "Processos" e "Andamento"): cria ou atualiza o processo pelo nº SEI (sem espaços), traduz a fase e a forma
para as listas do sistema, grava o valor estimado só quando é número, e cria uma movimentação por linha da aba
"Andamento" (sem data, usa a data da carga e marca "data não informada"). A planilha não traz natureza, ação nem
fonte: as reservas dos 11 processos são lançadas depois, na ficha. A planilha não entra no repositório.

## 7. Fora do escopo

- Reserva ou PED automático no FIPLAN; integração com a API do SEI.
- Redigir documentos do processo (é do SEI).
- Itens, propostas e sessão da licitação (as tabelas antigas continuam sem tela).
- Contrato e medição (módulo Contratos).

## 8. Testes e verificação

- Vitest: cálculo do saldo livre (com e sem a própria linha, PED, empenhada, sem QDD); ligação empenho × reserva;
  leitura da planilha com os casos reais (nº SEI com espaço, valor em texto, sem data, processo de 2025).
- Banco: RLS das tabelas novas e as funções no teste do baseline (`scripts/db/validar-baseline.sh`).
- `bash scripts/gate.sh` verde; telas vistas no navegador em 390px e desktop; docs da matriz e `ROADMAP.md`.

## 9. Entregas

| # | Entrega | Migração |
|---|---|---|
| 1 | Colunas do processo, andamento, telas lista/ficha (Dados, Andamento, Empenhos) e carga da planilha | sim (pede o "sim") |
| 2 | Reservas, saldo livre, importação dos PEDs, fase financeira, "Puxar do PCA", programação por natureza e cartão no painel do Financeiro (§10) | sim (pede o "sim") |

## 10. Revisão de 24/10/2026: PEDs do FIPLAN e fase financeira (vale para a entrega 2)

Em 24/10 o usuário mandou o relatório do FIPLAN **"Consultar Pedido de Empenho da Despesa (PED)"** (Excel, exercício
2026 até 20/10: 236 PEDs de 80 processos; 28 autorizados sem empenho somam R$ 5.676.419,00, o mesmo PED do FIP 608) e
aprovou ("sim") trocar a digitação do PED pela importação desse relatório e mostrar a fase financeira de cada processo.
Esta seção substitui o que for diferente nas seções 3 a 5.

**O relatório:** uma linha por PED ou estorno, com nº do PED, PED de estorno/estornado, nº do empenho que saiu dele,
nº do processo, valor, situação ("Pedido (PED) autorizado", "Pedido (PED) empenhado", "Pedido (PED) estornado (...)",
"Documento de Estorno"), datas de solicitação, criação e autorização, tipo de empenho, dotação completa (com o IDU em
número, como o FIP 614), licitação, histórico e credor. É um .xls de verdade (BIFF), que o SheetJS lê direito.

**Ligação ao processo:** o "Nº Processo" do FIPLAN é o nº SEI abreviado (`000885/26-92` = `17302.000885/2026-92`; o
FIP 614 escreve `00000112/26-14`). A função `processo_chave_fiplan(text)` reduz os três formatos à mesma chave
(`885/26-92`: número sem zeros à esquerda, ano com dois dígitos, dígito). Ela também passa a ligar os empenhos do
FIP 614 ao processo, no lugar do `btrim` exato. A chave ignora a UO; processo de outra UO com o mesmo número, ano e
dígito é improvável e, se acontecer, aparece nos dois processos (premissa aceita).

**Dados (no lugar do nº e da data do PED em `processo_reservas`):**
- `fin_peds` (nova, do Financeiro): espelho do relatório, chave exercício + nº do PED + PED de estorno; dotação ligada
  ao QDD pela mesma regra do FIP 614 (dígitos + IDU). Lida pelo módulo Financeiro; escrita só pela RPC
  `importar_peds_fiplan` (permissão `orcamento.importar`, como o FIP 614). Reimportar atualiza; nada se apaga: PED que
  some do relatório aparece como aviso.
- `processo_reservas`: uma linha **reservada** por processo × exercício × ação × fonte × natureza; situação só
  `reservada` ou `cancelada`.

**Saldo livre (troca a seção 3):**

```
materializado(linha) = PEDs autorizados do processo na mesma ação × fonte × natureza
                     + empenhado líquido (empenhado − anulado) dos empenhos do processo na mesma combinação
pendente(linha)      = max(0, valor reservado − materializado)
saldo livre          = Σ disponível do QDD − Σ pendente das outras linhas reservadas
disponível do QDD    = atual − bloqueado − max(PED, empenhado + reserva)
```

No QDD do FIPLAN a coluna "PED" já soma o empenhado e a reserva (Cont./Reserva = PEDs autorizados ainda sem empenho):
no QDD 2026 enviado em 24/10, PED 32.347.253,42 = empenhado 26.670.834,42 + reserva 5.676.419,00, e o "Disponível"
11.484.497,40 = atual − bloqueado − PED. Descontar empenhado, reserva e PED juntos contaria duas vezes.

**Fase financeira do processo:** calculada, não gravada, a partir dos valores PED autorizado, empenhado líquido,
liquidado e pago (`fin_peds` + `fin_empenhos`): Pago (pago ≥ empenhado > 0), Pago em parte, Liquidado, Empenhado,
PED autorizado, Reservado (só reserva do sistema), Sem movimento financeiro. Aparece na lista (coluna e filtro) e na
ficha.

**Telas (troca a seção 5 onde diferir):** a aba Empenhos da ficha vira **Financeiro**: a fase, os quatro valores e as
listas de PEDs e de empenhos. A aba **Reservas** não tem "Informar PED": cada linha mostra reservado, já no FIPLAN e
pendente. A Central de Importações ganha o importador "PEDs do FIPLAN". O resto da seção 5 (programação por
natureza, cartão no painel do Financeiro, "Puxar do PCA") fica como estava.
