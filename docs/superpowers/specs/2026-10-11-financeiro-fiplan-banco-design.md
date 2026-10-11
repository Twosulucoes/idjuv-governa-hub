# Financeiro: FIPLAN como fonte da verdade, arquivos bancários e APIs do Banco do Brasil

- **Data:** 2026-10-11
- **Classificação:** architectural (tabelas novas, importadores novos, Edge Function nova)
- **Pedido:** thread "menu Financeiro" do projeto. O usuário respondeu "bora fazer tudo" depois da análise
  do menu, dos arquivos do BB (CNAB240 SEGAD, OBN600 FIPLAN, Gestão MAX) e das specs das APIs do BB.
- **Análise de origem:** `menu-financeiro-explicado.md` e `arquivos-banco-brasil.md` (pasta do projeto,
  fora do repositório porque citam valores reais).

## Premissas (sessão autônoma)

1. **O FIPLAN manda.** A importação do QDD continua sobrescrevendo empenhado/liquidado/pago das dotações.
   Os gatilhos locais (empenho e pagamento lançados no sistema) seguem existindo como efeito provisório até
   a próxima importação. A tela passa a dizer quando foi a última importação.
2. **Orçamento deixa de ser item de menu.** O resumo (cartões) vai para o topo da tela do QDD;
   `/financeiro/orcamento` redireciona para `/financeiro/qdd`. "Nova dotação" sai: dotação vem do FIPLAN.
3. **Exercício único no módulo.** Um seletor de exercício compartilhado (URL `?exercicio=` com fallback no
   navegador) vale para todas as telas do financeiro. Faixa: 2024 até o ano seguinte ao atual.
4. **Alteração orçamentária nasce no sistema e é confirmada no FIPLAN.** Ganha número do processo SEI e a
   situação no FIPLAN (pendente/confirmada, com data). Confirmar é ação manual.
5. **Arquivo bancário só é lido, nunca gerado, quando quem gera é o FIPLAN ou a SEGAD.** O sistema gera
   apenas o arquivo de **reenvio** no formato do BB Gestão MAX (convênio do próprio cliente).
6. **Credenciais do BB por instância.** Cada cliente roda numa instância própria do Supabase
   (`docs/NOVO_BANCO.md`), então as credenciais ficam nos segredos das Edge Functions dessa instância. A tela
   mostra se a conexão está configurada e testa; não recebe nem guarda segredo no banco.
7. **Pagamento por API (Pagamentos em Lote / PagBB) fica fora desta entrega**: movimenta dinheiro e precisa
   do contrato e da homologação com o BB. Extratos e Validação de Contas (só leitura) entram.
8. Nenhum dado de cliente (convênio, conta, CNPJ) vai para `src/`: convênio e conta pagadora ficam em
   `contas_autarquia` (já existe, com `convenio_pagamento`).

## Etapa 1 — telas do financeiro

| Item | Mudança |
|---|---|
| Exercício | Hook `useExercicioFinanceiro` + componente `SeletorExercicio`; Painel, Alterações, Solicitações, Empenhos, Liquidações, Pagamentos, Sub-Empenhos, Adiantamentos e QDD usam o mesmo ano. Liquidações e Adiantamentos passam a filtrar por exercício. |
| QDD + Orçamento | Cartões de resumo no topo do QDD; aviso "Atualizado pelo FIPLAN em <data> (<arquivo>)" a partir de `importacoes`; menu sem "Orçamento"; rota antiga redireciona. |
| Solicitações | "Nova solicitação" abre formulário (react-hook-form + zod) usando `useCriarSolicitacao`. |
| Alterações | Campos processo SEI e situação no FIPLAN; ação "Confirmar no FIPLAN". |
| Botões sem ação | Removidos (Nova dotação) ou ligados a algo real. Os que dependem de fluxo ainda inexistente saem da tela em vez de ficarem mortos. |
| Detalhe do pagamento | Página real com os dados do pagamento e o histórico bancário (remessa, retorno, extrato). |

## Etapa 2 — leitura de arquivos bancários e conciliação

Tabela `fin_movimentos_bancarios`: um registro por pagamento visto num arquivo do banco.

| Coluna | Uso |
|---|---|
| `origem` | `obn600` (FIPLAN) ou `cnab240` (SEGAD / Gestão MAX) |
| `sentido` | `remessa` ou `retorno` |
| `importacao_id` | log em `importacoes` |
| `data_arquivo`, `sequencial_arquivo` | do header |
| `tipo_lancamento` | crédito BB, crédito outro banco, fatura/guia (código de barras), salário… |
| `identificador` | nº da OB (OBN) ou "seu número" (CNAB); com origem+valor forma a chave única |
| `favorecido_nome`, `favorecido_documento` | CPF/CNPJ (dado pessoal: só o módulo financeiro lê) |
| `banco`, `agencia`, `conta` | do favorecido |
| `valor`, `data_pagamento` | |
| `codigo_barras`, `autenticacao` | guias e faturas |
| `situacao` | `enviado`, `pago`, `recusado` |
| `motivo_recusa`, `codigo_retorno` | do retorno |
| `pagamento_id` | `fin_pagamentos` conciliado (opcional) |

RPC `importar_arquivo_bancario(p_linhas, p_arquivo, p_parametros, p_simular)`, no padrão dos importadores
(`src/lib/importacao`): idempotente pela chave, um retorno atualiza a situação do registro da remessa
correspondente, e o registro casa com `fin_pagamentos` por documento do favorecido + valor (+ data). Pago
marca o pagamento como `pago` com `data_efetivacao`; recusado registra o motivo.

Parsers puros em TypeScript: `obn600` (350 posições: header 0, registro 2 = OB, 4 = detalhe de fatura,
9 = trailer, código de retorno no fim do registro) e `cnab240` (header/lote/segmentos A e B/trailers, com
layouts SEGAD 030/020 e Gestão MAX 050/031). Os significados deduzidos estão marcados no código como
"conferir no manual".

Permissão nova `pagamento.conciliar` (catálogo do financeiro). RLS: leitura por quem acessa o financeiro;
escrita só pela RPC.

## Etapa 3 — reenvio de recusados (Gestão MAX)

Na tela de conciliação, o usuário seleciona recusados, corrige banco/agência/conta e gera um CNAB240 no
layout Gestão MAX (header 050, lote 031, convênio + produto 0126 de `contas_autarquia`), um lote por forma
(crédito BB, DOC/TED outro banco). O NSA continua a numeração do cliente: RPC `registrar_remessa_bancaria`
reserva o próximo número (tabela `fin_remessas_bancarias`) e grava o resumo. O arquivo é baixado e enviado
pelo usuário no Gestão MAX; o retorno volta pela Etapa 2.

## Etapa 4 — APIs do BB (leitura)

Edge Function `bb-api` (verify_jwt, confere papel/permissão): ações `status`, `extrato` (agência, conta,
período ≤ 31 dias, paginado) e `validar-conta` (agência, conta, CPF/CNPJ). OAuth2 client credentials + mTLS
(`Deno.createHttpClient`). Segredos: `BB_AMBIENTE` (homologacao|producao), `BB_CLIENT_ID`,
`BB_CLIENT_SECRET`, `BB_APP_KEY`, `BB_CERT_PEM`, `BB_KEY_PEM`. Lançamentos do extrato vão para
`fin_extrato_lancamentos` (chave única pelo identificador do BB) e casam com pagamentos pelo CPF/CNPJ da
contrapartida + valor + data. Tela "Banco do Brasil" em Contas Bancárias: situação da conexão, botão testar,
importar extrato do período, e validação de conta no formulário de pagamento.

## Fora desta entrega

- Pagamentos em Lote / PagBB (envio de dinheiro pela API).
- Conciliação da folha (retorno do CNAB da folha): mesma tabela, entra quando houver um `.RET` de exemplo.
- Manual oficial do OBN600: os códigos de tipo (31/32/38) e de retorno (01/09) foram deduzidos dos arquivos.
- Configuração da instituição no banco (nome do sistema etc.): thread própria.

## Segurança

RLS em todas as tabelas novas desde a migração; RPCs `SECURITY DEFINER` com `search_path` fixo, conferindo
`perfil_ativo_atual()`, `can_access_module(…, 'financeiro')` e a permissão. CPF/CNPJ e conta dos favorecidos
nunca vão para log da Edge Function. Segredos do BB só no servidor.
