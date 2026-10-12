# RH — correções da auditoria dos fluxos, protocolo e folha completa (12/10/2026)

Origem: auditoria do ciclo de vida do servidor (cadastro → arquivamento) e decisões do dono em 12/10/2026:
**tudo no RH passa por protocolo, com registro completo de quem fez; a folha é calculada no sistema; sem segundo
aprovador; `provimentos` + `lotacoes` mandam e `vinculos_servidor` é registro complementar; medida disciplinar fica
para depois.**

Migrations (ordem): `20261012090000_rh_protocolo.sql`, `20261012100000_rh_correcoes_auditoria.sql`,
`20261012110000_rh_folha_calculo_completo.sql`, `20261012120000_rh_transferencia_e_diarias.sql`, `20261012130000_rh_portaria_sequencia.sql`,
`20261012140000_rh_pre_cadastro_publico.sql`. Sem mudança de RLS nem de tabela nova (tabela do RH exigiria regenerar o
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

## 3d. Portaria: sequência obrigatória e nomeação amparada (migration `…130000`)

Decisão do dono: a portaria condiciona a posse e o exercício.
- Trigger em `documentos` (tipo portaria): o status só anda `minuta → aguardando assinatura → assinada → aguardando publicação →
  publicada → vigente → revogada`, com retorno para ajuste e revogação em qualquer etapa. Assinar exige quem assinou e a data;
  publicar exige nº e data do DOE; vigente exige a data de início. Portaria assinada ou publicada não se apaga (revoga-se).
  A criação segue livre (ato antigo já publicado entra e segue o ciclo).
- `rh_pendencias_nomeacao()`: servidores com provimento ativo sem portaria de nomeação **publicada ou vigente**. A folha marca a
  ficha (`portaria_de_nomeacao_nao_publicada`) em vez de bloquear, porque a publicação pode vir depois com efeito retroativo.
  **Decisão em aberto:** se o dono quiser bloquear o fechamento da folha com essa pendência, é uma linha em `fechar_folha`.

## 3e. Pré-cadastro público por token (migration `…140000`)

Implementa `2026-10-12-pre-cadastro-publico-design.md` com um desvio: **funções no banco em vez de Edge Function** (mesmas
garantias, testáveis em SQL, sem infraestrutura nova) e limite de criação por IP guardado na própria linha (sem tabela nova).
- `anon` continua **sem** acesso à tabela; só executa `pre_cadastro_publico_criar/obter/salvar/enviar`.
- Token de 122 bits (UUID aleatório) no link `/curriculo/<token>`, válido 30 dias sem uso; o código `PC-AAAA-nnnn` passa a ser só
  protocolo para falar com o RH e **não abre nada**. Salvar ignora `status`, `servidor_id`, `observacoes`, código e token.
- Não revela se o CPF já existe; a verificação de CPF do formulário público (que lia `servidores`/`pre_cadastros` e devolvia nome,
  matrícula e código) foi **removida** junto com `VerificarCpfDialog`/`useVerificarCpf`. O RH resolve duplicidade na conversão.
- 20 criações/hora por IP; honeypot e captcha não incluídos (decisão do dono: só se houver abuso). RH ganhou "Copiar link do
  candidato" para reenviar o link de quem perdeu.
- Padrões adotados nas quatro decisões abertas do desenho: limite na própria linha, sem captcha, validade 30 dias, o candidato
  cria o próprio rascunho (sem confirmação de e-mail). Mudar qualquer uma é pequeno.

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
`designacoes`, `cessoes`; cálculo de aposentadoria e de acerto financeiro além da rescisão descrita.

## 6. Parâmetros da folha: grafia do nome e data de vigência (migration `20261012150000`)

Achados ao conferir se o RH conseguiria configurar tudo pelas telas:
- **Nome em maiúsculas × minúsculas.** A tela de Parâmetros gravava `TETO_INSS`, `DEDUCAO_DEPENDENTE_IRRF`; o cálculo da folha e todo o resto procuram em minúsculas. O valor digitado na tela era ignorado (a ficha saía marcada "dedução de dependente não configurada"). Corrigido em três camadas: o banco normaliza o nome em todo INSERT/UPDATE (minúsculas, sem acento, `_`) e as linhas já gravadas; `get_parametro_vigente` compara sem diferença de caixa; a tela usa um catálogo único (`src/lib/parametrosFolha.ts`) e grava normalizado.
- **Licenças pagas ou não pela tela.** O catálogo traz `licenca_remunerada_<tipo>` (11 tipos) e `afastamento_remunerado_<tipo>` (6), com descrição e validação de 1 ou 0; a lista mostra "Sim (remunerado)" / "Não (sem remuneração)".
- **Data um dia antes.** `new Date("2026-01-01")` lê como UTC; em Roraima (UTC-4) a vigência aparecia como 31/12/2025 e a faixa de INSS/IRRF de 01/2026 como "dez/2025". Passou a ler como data local (`parseISO`).
- Verificado em SQL (linha em maiúsculas gravada **antes** da migration; migration aplicada 2x; folha usando a dedução digitada em maiúsculas; licença marcada como remunerada pela tela sem desconto) e no navegador (desktop e 390 px).
- As **premissas fixas do cálculo** (mês de 30 dias, 1/3 de férias etc.) continuam no código, sem tela: só mudam com programação.

