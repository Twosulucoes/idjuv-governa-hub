# Financeiro: convênios federais pelo Transferegov (T1)

- **Data:** 2026-10-29
- **Classificação:** architectural (tabelas novas, permissão nova, Edge Function nova, rotina no CI, telas novas no
  módulo `financeiro`)
- **Pedido:** thread "Integrações externas e Transferegov". Registrar o Transferegov como fonte e usá-lo para
  acompanhar os convênios e as emendas federais da instituição sem digitar o que já está publicado.
- **Decidido em conversa (27 e 29/10):**
  1. **Só leitura.** O sistema não envia nada ao Transferegov; proposta e prestação de contas continuam lá.
  2. A tela fica no **Financeiro** (dinheiro a receber; o QDD já separa as emendas).
  3. Permissão nova `financeiro.convenios.visualizar`, dada de início a quem já vê o orçamento
     (`orcamento.visualizar`).
  4. Sem botão "Atualizar agora" na T1: a rotina roda todo dia e, à mão, pelo Actions (Run workflow).
- Fonte, formato dos arquivos e o que existe da instituição lá: [`docs/INTEGRACOES_EXTERNAS.md`](../../INTEGRACOES_EXTERNAS.md) §4.

## 1. Onde está o dado

Convênio, proposta e emenda das transferências discricionárias só saem nos **CSV diários** do Transferegov (antigo
Siconv). As APIs do site cobrem emenda Pix, parcerias, fundo a fundo e TED, e nelas não há nada da instituição hoje.
O `siconv_proposta` tem cerca de 200 MB compactado: não cabe numa Edge Function (limite de tempo por chamada).

## 2. Como o dado chega

```
GitHub Actions (todo dia 09:00 Boa Vista, ou Run workflow)
  └─ scripts/transferegov/sincronizar.mjs
       ├─ POST transferegov {acao:"cnpj"}            → CNPJ da Configuração do cliente (dados_oficiais)
       ├─ baixa os zips, lê em fluxo (unzip -p), filtra: proposta do CNPJ → emendas → convênio → empenhos/desembolsos
       └─ POST transferegov {acao:"carregar", ...}   → RPC fin_tg_carregar (service role), uma transação
```

- A rotina **não tem acesso ao banco**: fala com a Edge Function `transferegov`, que confere o segredo
  `TRANSFEREGOV_TOKEN` (≥ 32 caracteres, comparação em tempo constante) e usa a service role só para a RPC. O
  ambiente `producao` do GitHub pede aprovação manual e não serve a uma rotina diária; por isso o ambiente próprio
  `transferegov`, com só esse segredo.
- O CNPJ não está no código (tenant-agnóstico): vem de `dados_oficiais`. A RPC confere de novo.
- O log do Actions é público: só saem contagens.
- Se o leiaute de um CSV mudar (coluna sumida), a rotina para com erro e o espelho fica como estava.

## 3. Banco (migração `20261105090000_fin_convenios_transferegov.sql`)

| Tabela | Chave | O que tem |
|---|---|---|
| `fin_tg_propostas` | `id_proposta` | Número, ano, data, órgão superior e concedente, modalidade, objeto, situação, vigência, valores (global, repasse, contrapartida), banco/agência/conta |
| `fin_tg_emendas` | `id_proposta` + `numero_emenda` | Programa, parlamentar ou comissão, tipo, qualificação, impositiva, beneficiário, valores |
| `fin_tg_convenios` | `numero` | Proposta, situação e subsituação, publicação, ativo, assinado, processo, vigência (atual e original), prazo e dias da prestação de contas, aditivos, prorrogações, valores (global, repasse, contrapartida, empenhado, desembolsado, saldo em conta, rendimentos, remanescentes) |
| `fin_tg_movimentos` | `tipo` + `id_origem` | Empenho ou desembolso do convênio: número, data, valor, situação, descrição, indicação, natureza, UG |
| `fin_tg_sincronizacoes` | `id` | Quando rodou, data da carga do Transferegov, CNPJ e contagens |

- RLS classe `trilha` com `leitura=financeiro.convenios.visualizar`; `anon` sem acesso; `authenticated` só `SELECT`.
- `fin_tg_carregar(p_cnpj, p_data_carga, p_dados, p_forcar)`: `SECURITY DEFINER`, `search_path` fixo, `EXECUTE` só
  para `service_role`. Troca o espelho inteiro (apaga as propostas, filhos em cascata, e insere a carga). Recusa com
  `22023`: CNPJ inválido ou diferente do da Configuração do cliente, proposta de outro proponente, formato errado e
  carga vazia com espelho cheio (salvo `p_forcar`, que a função não usa).
- Testes: bloco "Financeiro: convênios federais do Transferegov" de `scripts/db/testar-rls.sql` (leitura com e sem a
  permissão, escrita recusada, RPC só para a service role, recusas da RPC).

## 4. Telas

- **`/financeiro/convenios`** (`ConveniosFederaisPage`): aviso se a rotina nunca rodou ou parou há mais de 3 dias;
  cartões (propostas, valor global, recebido da União com o empenhado, quantas pedem atenção); tabela com objeto e
  órgão, proposta e convênio, situação, valor global, recebido, fim da vigência e alertas; busca por objeto, número,
  emenda e parlamentar. Rodapé com a data da carga.
- **`/financeiro/convenios/:id`** (`ConvenioFederalPage`, `:id` = `id_proposta`): dados da proposta e do convênio
  (assinatura, publicação, vigência e prestação de contas com dias que faltam, aditivos, processo), valores e parte do
  repasse já recebida, emendas (autor e valor) e empenhos e desembolsos da União.
- **Alertas** (`src/lib/financeiro/conveniosFederais.ts`, com testes): instrumento não assinado; vigência ou prestação
  de contas a 60 dias ou menos (pendente) ou vencida (erro).
- Menu: Financeiro → "Convênios federais", com a permissão nova.

## 5. Fora da T1

- **T2:** ligar convênio e empenho federal ao FIPLAN (fonte de recurso e conta do convênio) e ao processo SEI.
- **T3:** nome do parlamentar e número da emenda federal no painel de emendas do Financeiro.
- **T4:** APIs de emenda Pix e parcerias, se a instituição ou o Estado passarem a aparecer nelas.
- Emendas estaduais (ALE) não estão no Transferegov.
