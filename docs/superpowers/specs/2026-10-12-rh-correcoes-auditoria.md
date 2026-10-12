# RH — correções da auditoria dos fluxos, protocolo e folha completa (12/10/2026)

Origem: auditoria do ciclo de vida do servidor (cadastro → arquivamento) e decisões do dono em 12/10/2026:
**tudo no RH passa por protocolo, com registro completo de quem fez; a folha é calculada no sistema; sem segundo
aprovador; `provimentos` + `lotacoes` mandam e `vinculos_servidor` é registro complementar; medida disciplinar fica
para depois.**

Migrations (ordem): `20261012090000_rh_protocolo.sql`, `20261012100000_rh_correcoes_auditoria.sql`,
`20261012110000_rh_folha_calculo_completo.sql`, `20261012120000_rh_transferencia_e_diarias.sql`. Sem mudança de RLS nem de tabela nova (tabela do RH exigiria regenerar o
baseline). Colunas novas: `audit_logs.protocolo`, `itens_ficha_financeira.origem`. O baseline (`supabase/baseline/`)
**não foi regenerado**: as migrations são idempotentes e valem por cima dele.

## 1. Protocolo

Todo ato do módulo `rh` tem um número **RH-AAAA-NNNNNN**. Não há tabela nova: o protocolo vive na trilha imutável.

- `audit_logs.protocolo` agrupa todas as gravações da mesma transação; a linha de **abertura** (`entity_type = 'protocolo'`)
  guarda tipo, descrição, servidor-alvo e **quem abriu** (usuário, servidor, matrícula, papel, unidade, IP, agente).
- Atos com protocolo próprio: admissão, desligamento, processar/enviar/fechar/reabrir folha, rotina de status por data.
- **Qualquer outra gravação do RH** (edição direta de servidor, férias, licença, ponto…) recebe um protocolo
  automático (trigger `trilha_protocolo`), com tipo pela tabela. Nenhuma linha de RH fica sem protocolo.
- Consulta: filtro "Protocolo" e coluna na tela de trilha (`/rh/auditoria`); RPCs `rh_protocolo_consultar(numero)` e
  `rh_protocolos_listar(...)` (SECURITY INVOKER: valem `rh.auditoria.visualizar` e a máscara LGPD).
- Numeração por sequência anual (`rh_protocolo_seq_AAAA`), sem travar as gravações. Número sem uso = tentativa desfeita.
- Tentativa recusada ou revertida não deixa rastro: a trilha é gravada na mesma transação do ato.

## 2. Correções da auditoria

| Área | Antes | Agora |
|---|---|---|
| Admissão (cadastro manual, conversão de pré-cadastro, lotar) | Cada porta gravava um subconjunto; erros engolidos | `rh_admitir_servidor`: vínculo, lotação, provimento/cessão, histórico e minuta numa transação |
| Desligamento | Dois caminhos incompletos; ato/DOE descartados | `rh_desligar_servidor`: encerra lotação, vínculos, provimento, cessões, designações, férias, licenças, viagens, chefia e comissões; situação `exonerado/aposentado/falecido`; permissão parcial desfaz tudo |
| Situação | Triggers duplicados devolviam `ativo` a exonerado | Um só conjunto; preserva desligados; reconhece `prorrogada` |
| Cessão de saída/retorno | Lia tabela legada vazia | Lê `vinculos_servidor` |
| Ponto em mês consolidado | Bloqueio só no navegador | Trigger em `registros_ponto` |
| Matrícula / código / nº de portaria | Texto no cliente, MAX+1 sem trava | Trigger numérico com trava; índice único |
| Status por data | Só à mão | `rh_avancar_status_por_data()` — **agendar no cron do host** (não há `pg_cron`) |
| Senha temporária | `Math.random` | `crypto.getRandomValues` |

## 3. Folha calculada no sistema

`processar_folha_pagamento` (mesma assinatura) agora calcula, por tipo de folha:

- **mensal**: entra quem tem provimento no período (inclusive em férias e licença remunerada); vencimento proporcional
  (mês comercial de 30 dias; ingresso e saída no mês); desconto de faltas (`frequencia_mensal`), de licença/afastamento
  não remunerado e de cessão com ônus no destino; 1/3 e abono de férias no mês do início do gozo; lançamentos manuais
  **preservados** ao reprocessar; INSS, IRRF com dependentes, consignações, pensão alimentícia.
- **13º**: 1ª parcela = 50% sem imposto; 2ª = 13º integral com INSS/IRRF (tributação exclusiva) menos a 1ª.
- **rescisão**: férias proporcionais + 1/3 (indenizatórias) e 13º proporcional; o saldo de salário vem na folha mensal.
  Sempre marcada para conferência. Períodos aquisitivos vencidos sem registro são **apontados, não pagos**.
- `complementar` e `retroativos`: recusam com mensagem (sem cálculo automático).
- Cada ficha leva `inconsistencias` (tabela de INSS/IRRF ausente, dedução de dependente não configurada, sem frequência do
  mês, sem dados bancários, líquido negativo, acima do teto, ônus de cessão não informado…).

### O que o órgão precisa carregar (hoje está vazio em produção)

| Dado | Onde | Observação |
|---|---|---|
| Vencimento base de cada cargo | `cargos.vencimento_base` | sem ele o servidor é pulado com erro |
| Tabela de INSS / previdência (RPPS ou RGPS) | `tabela_inss` | sem ela o desconto sai zero e a ficha é marcada |
| Tabela de IRRF | `tabela_irrf` | idem |
| Dedução por dependente | `parametros_folha` `deducao_dependente_irrf` | antes havia um valor fixo de 2023 no código; foi removido |
| Remuneração por tipo de licença | `parametros_folha` `licenca_remunerada_<tipo>` / `afastamento_remunerado_<tipo>` (1/0) | padrão sem parâmetro: não remunerados `interesse_particular`, `mandato_eletivo`, `suspensao` |
| Percentual de pensão | `pensoes_alimenticias.percentual` | número "30" = 30% |

Nenhum valor legal está fixado no código. Premissas a validar com o RH: mês de 30 dias; 1/3 de férias sem INSS e com IRRF;
abono pecuniário e verbas indenizadas sem INSS/IRRF; avos de 13º com 15 dias ou mais no mês; saldo de salário na folha mensal.


## 3b. Transferência de unidade e diárias (migration `…120000`)

- **`rh_transferir_servidor`** (permissão `rh.lotacoes.editar`, com protocolo): muda de unidade **sem exonerar e lotar de
  novo** — encerra a lotação na véspera, abre a nova, move provimento e vínculos, mantém cargo e carreira, grava histórico
  (`transferencia` ou `remocao`) e a minuta de portaria. Respeita a composição do cargo por unidade; permissão parcial
  desfaz tudo. Botão **TRANSFERIR** em `/rh/gestao-lotacao`.
- **Diárias** (trigger no banco, vale para qualquer tela): a viagem não pode cruzar férias, licença/afastamento (missão e
  serviço externo não contam) nem outra viagem do servidor; viagem já retornada **sem relatório** impede abrir outra;
  **concluir exige o relatório apresentado e a data** (prestação de contas). Formulário de viagem ganhou a seção
  "Prestação de contas" (relatório, data, link) a partir de "em andamento".

## 3c. Defeito encontrado ao testar no navegador

O formulário de cargos grava só `cargos.categoria`; o formulário de vínculo e o painel de vínculos filtravam por
`cargos.natureza` (sempre nula nos cargos criados pela tela). Efeito: **no cadastro de servidor e na conversão de
pré-cadastro a lista de cargos ficava vazia**. Corrigido para `categoria`.

## 4. Verificação

Baterias SQL num banco descartável com o esquema de produção: admissão, férias, licença, desligamento, reingresso, cessão,
trava de ponto, portaria, permissões, **protocolo** (1 abertura por ato, mesma transação = mesmo número, nenhuma linha de RH
sem protocolo, imutável) e **folha** (valores conferidos à mão: mês cheio, faltas, ingresso no meio do mês, licença
remunerada e não remunerada, 1/3 de férias, lançamento manual preservado, 13º 1ª e 2ª parcela, rescisão, fechamento).
Migrations aplicadas duas vezes (idempotentes). `scripts/gate.sh` verde.

**No navegador** (front local contra banco de teste descartável, Chromium headless, desktop e 390 px, sem estouro
horizontal): cadastro de servidor, lotar, transferir, exonerar, conversão de pré-cadastro, processar folha, trilha com
filtro por protocolo e prestação de contas de viagem — cada fluxo conferido também no banco.

## 5. Fora do escopo

Medida disciplinar (aguarda decisão do órgão); granularidade de RLS em `lotacoes`, `provimentos`, `historico_funcional`,
`designacoes`, `cessoes`; sequência obrigatória do ciclo da portaria; formulário público de pré-cadastro (desenho para
aprovação em `2026-10-12-pre-cadastro-publico-design.md`); cálculo de aposentadoria e de acerto financeiro além da rescisão descrita.
