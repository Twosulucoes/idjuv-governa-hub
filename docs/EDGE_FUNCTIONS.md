# Edge Functions (Supabase / Deno)

As Edge Functions ficam em `supabase/functions/<nome>/index.ts` e rodam no
runtime **Deno** do Supabase. Servem para operações que **não podem ser feitas
com a chave anônima no client** — tipicamente porque exigem a *service role*
(privilégios de admin) ou integram serviços externos/segredos.

São invocadas do front via `supabase.functions.invoke('<nome>', { body })`.

## Funções existentes

| Função | Propósito |
|---|---|
| `admin-create-user` | Cria usuário no Auth + perfil/permissões (requer service role). |
| `admin-reset-password` | Reseta/redefine senha de um usuário pela administração. |
| `create-test-user` | Cria usuário de teste (provisionamento/QA). |
| `delete-user` | Exclui usuário do Auth e dados associados. |
| `enviar-convite-reuniao` | Envia convites de reunião aos participantes por e-mail ou WhatsApp (pelo núcleo `_shared/envio`). |
| `enviar-notificacao` | Disparos pela configuração de envio da instância. Hoje só a ação `teste` (exige `admin.envios.configurar`). |
| `download-frequencia` | Devolve URL assinada (1 h) do arquivo de um pacote de frequência do bucket privado `frequencias`, ou só os dados do pacote (`action=info`). Exige o módulo `rh` e `rh.frequencia.visualizar` (ver abaixo). |
| `database-schema` | Inspeciona o schema do banco (apoia a tela `DatabaseSchemaPage`). |
| `backup-offsite` | Executa/orquestra backup off-site (apoia `BackupOffsitePage`). |
| `ia-gateway` | Porta única de IA do sistema: recurso `cpsi` (assistente do formulário CPSI, `CPSIPage`) e `testar` (tela `/admin/ia`). Substitui a antiga `cpsi-ai-assistant` (ver abaixo). |
| `bb-api` | APIs de leitura do Banco do Brasil: `status` da conexão, `extrato` (API Extratos v2, grava em `fin_extrato_lancamentos`) e `validar-conta` (API Validação de Contas v1). Exige o módulo `financeiro` e `pagamento.conciliar` (ver abaixo). |

### Envio de e-mail e WhatsApp (`_shared/envio`)

O núcleo `supabase/functions/_shared/envio/` lê a configuração da instância (`config_envio`, preenchida
pelo cliente em `/admin/envios`) e a credencial do Vault pela RPC `config_envio_servidor`, que só a
service role executa. Funções: `enviarEmail` (SMTP via denomailer ou Resend), `enviarWhatsAppTemplate`
(Meta Cloud API, só templates aprovados), `carregarIdentidade` + `montarEmailInstitucional` (cabeçalho e
rodapé com a marca do cliente) e o registro em `envios_log` (sem corpo da mensagem).

Quem chama autentica o usuário, checa a permissão da própria ação e monta o conteúdo no servidor; o
núcleo não deve virar relay de texto livre. Sem configuração ativa, e-mail cai em `RESEND_API_KEY`/
`RESEND_FROM` e o convite por WhatsApp volta ao link `wa.me`. Um novo uso (ex.: avisos) entra como ação
nova em `enviar-notificacao`, recebendo o id do registro e checando a permissão do domínio.

### Autorização do `backup-offsite`

A função lê todas as tabelas com a service role, então só responde a quem prova
uma das três coisas abaixo (medido no código em 2026-10-06):

- **Usuário autenticado com papel** `ti_admin`, `presidencia` ou `admin` em
  `user_roles`. Vale para todas as ações, inclusive `external-export` com
  `localExport: true` (usado por `useBackupOffsite.ts`) e `list-tables`. Sem esses
  papéis, `external-export` responde `403`; nas demais ações o erro sai pelo
  tratamento geral da função (`500` com a mensagem "Sem permissão para executar backup").
- **Service role** (chamada do cron), nas ações autenticadas (`list-tables`,
  `test-connection`, `execute-backup` etc.). Não vale para `external-export`.
- **`apiKey` igual a `BACKUP_EXTERNAL_API_KEY`**, somente para `external-export`
  e `list-tables` (contingência externa, sem JWT; ver `docs/BACKUP_CONTINGENCIA.md`).

`list-tables` era público (sem nenhuma autenticação) até a correção de 2026-10-06;
quem o chamava sem `apiKey` nem papel passa a receber erro.

### Gestão de usuários (`admin-create-user`, `admin-reset-password`, `delete-user`)

As três exigem o **papel** `admin` (`is_admin_user`, que também exige perfil ativo), não só a permissão
`admin.usuarios`: o papel `user` recebe essa permissão quando tem o módulo `admin`, e com ela
`admin-create-user` devolvia o UUID de qualquer e-mail (e reativava o perfil), `admin-reset-password` devolvia uma
senha temporária e `delete-user` apagava a conta de qualquer não-administrador. A senha temporária sai de
`crypto.getRandomValues`. Desde a Onda 2 da revisão de permissões (10/10/2026), um administrador não redefine a
senha de **outro** administrador (só a recuperação por e-mail, que chega ao dono) nem exclui um administrador
(`delete-user` recusa qualquer alvo com o papel `admin`; para excluir, tira-se o papel antes, o que fica na
trilha de `user_roles`). Todo reset de senha grava `audit_logs` (`password_reset`, quem fez e para quem, nunca a senha).
`database-schema` também passou a exigir o papel `admin` (antes bastava `admin.usuarios`).

### IA da instituição (`ia-gateway`)

Fase 1 da IA de compras ([spec](./superpowers/specs/2026-10-11-ia-compras-design.md)). Substitui a
`cpsi-ai-assistant`, que usava uma chave fixa do Gemini (`GEMINI_API_KEY`/`GEMINI_MODEL`): esses segredos
deixam de ser lidos. Provedor, modelo, URL base, limites e chave vêm do banco da instância (`ia_config`,
preenchida em `/admin/ia`, chave no Vault) pela RPC `ia_config_servidor()`, que só a service role executa
([BANCO_DE_DADOS.md](./BANCO_DE_DADOS.md)). Do ambiente, a função lê só `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY` e `ALLOWED_ORIGINS` (CORS por allowlist, como `admin-create-user`).

- **Ordem do handler:** sessão → permissão com o cliente da própria pessoa (`pode_usar_ia()` no `cpsi`,
  `pode_configurar_ia()` no `testar`) → validação do corpo → `ia_config_servidor()` → IA desligada (`409`) →
  teto mensal de tokens (`429`) → `consumir_cota_uso` (tipo `ia`, módulo `compras`, limite
  `ia_config.limite_chamadas_hora`) → provedor → linha em `ia_uso` (também em erro e cortado; no stream, ao
  terminar, com os tokens contados até ali).
- **Recursos** (`POST`, body `{recurso, ...}`):
  - `cpsi` `{action, documentType, context?, fieldName?, fieldLabel?, currentValue?, formData?}`: mesmas entradas,
    prompts e respostas da antiga função (`{fields}` no `fill_all`, `{content}` no `fill_field`, stream SSE no
    `review`, no formato `data: {"choices":[{"delta":{"content":...}}]}` que `useAICPSI.ts` lê). Limites: 10.000
    caracteres por campo, 60.000 no pedido, 60 entradas em `formData`, 16.384 tokens de resposta.
  - `testar`: chamada mínima (16 tokens) para conferir provedor, modelo e chave; funciona com a IA desligada e
    devolve `{ok, provedor, modelo}`.
- **Erros:** sempre JSON `{error, codigo}`:

  | HTTP | `codigo` | Quando |
  |---|---|---|
  | 401 | `sem_sessao` | sem `Authorization` ou sessão inválida |
  | 403 | `sem_permissao` | sem `ia.usar` + módulo `compras` (`cpsi`) ou sem `ia.configurar` (`testar`) |
  | 400 | `pedido_invalido` | recurso desconhecido ou corpo fora dos limites |
  | 409 | `ia_desligada` / `sem_chave` | IA desligada ou incompleta (`cpsi`) / sem chave, provedor ou modelo (`testar`) |
  | 429 | `cota_hora` / `teto_mes` | limite por pessoa por hora / teto mensal de tokens da instituição |
  | 422 | `cortado` / `resposta_invalida` | resposta passou do tamanho máximo / JSON do `fill_all` ilegível |
  | 502 / 504 | `provedor` | provedor recusou, falhou, redirecionou ou demorou (504 = tempo esgotado) |
  | 500 | `erro_interno` | falha ao checar permissão, ler a configuração, verificar a cota ou erro inesperado |

- **Adaptadores** em `supabase/functions/_shared/ia/`: `provedores.ts` (`gerarTexto`/`gerarStream` para
  `openai`, `anthropic`, `gemini` e `compativel_openai`; chave só no header, nunca na URL; `redirect: "manual"`;
  timeout de 120 s; erro do provedor sem o corpo da resposta; tokens estimados por caracteres/4 quando o provedor
  não informa), `url.ts` (`validarUrlBase` do provedor compatível: só `https`, sem usuário/senha, query ou
  fragmento, sem `localhost`/`.local`/`.internal`, IPv6 literal, IPv4 privado ou reservado, nem nome sem ponto;
  `verificarDestino` ainda resolve o nome via `Deno.resolveDns` e recusa se algum endereço for privado ou for o
  host de `SUPABASE_URL`. Resta o risco de DNS rebinding entre a checagem e a conexão: a proteção definitiva é
  um firewall de saída na VPS bloqueando faixas privadas para o container das Edge Functions)
  e `recursos/cpsi.ts` (prompts, campos, validação e parse movidos da função antiga). Testes `deno test` em
  `*.test.ts` na mesma pasta.
- **LGPD:** nem a chave, nem o texto do pedido, nem o da resposta vão para log ou para `ia_uso`; o log leva só
  mensagens genéricas e o status HTTP do provedor. O campo `ia_config.enviar_dados_pessoais` é gravado pela tela,
  mas o gateway ainda não o usa.
- **Deploy (pós-merge):** `supabase functions deploy ia-gateway` e `supabase functions delete cpsi-ai-assistant`;
  em `/admin/ia`, escolher o provedor, gravar a chave, testar e ligar; conceder `ia.usar` a quem é de compras.
  Depois de conferir, apagar os segredos `GEMINI_API_KEY` e `GEMINI_MODEL`.

### Convite de reunião (`enviar-convite-reuniao`)

Só o criador da reunião ou um administrador envia. Limites contra uso como disparador de mensagens com a marca
do órgão: 50 participantes por chamada, 200 convites por usuário por hora (reenvios contam), mensagem livre de
até 2.000 caracteres e nenhum link (com esquema, `www.` ou domínio nu) no texto final de cada destinatário,
no local, na pauta ou na assinatura além do link da própria reunião. CORS por `ALLOWED_ORIGINS`, como as
demais. Pendente (modelo novo): o módulo `gabinete` ainda pode trocar o `created_by` de uma reunião pela API,
e o link da reunião é livre (uma lista de domínios por instância fecharia isso).

### Cota de uso (`consumir_cota_uso`)

As duas funções acima usam a RPC `consumir_cota_uso(usuario, tipo, quantidade, limite, modulo, descricao)`
(migração `supabase/migrations/20261010233100_onda2_cota_uso.sql`): conta o uso da última hora e registra em `audit_logs`
(`entity_type` = tipo, `metadata.quantidade`) na mesma transação, sob lock por usuário, então pedidos em
paralelo não furam o limite. Só a service role executa.

Trilha (onda E1, [`BANCO_DE_DADOS.md`](./BANCO_DE_DADOS.md#trilha-de-auditoria-e-servidor-responsável-do-rh--onda-e1)):
as gravações dessas funções rodam pela service role e entram em `audit_logs` com origem `sistema`, sem autor. Por
isso `admin-create-user` grava uma linha complementar (módulo `admin`, `entity_type = 'user'`, ação `create`, ou
`update` quando só garante o perfil de um usuário que já existia) com o administrador que pediu, e `delete-user`
grava outra (`update`, etapa `remover_acessos`) antes de remover módulos, papéis e o vínculo com o servidor, além da
linha `delete` que já gravava depois da exclusão. As linhas novas não levam e-mail nem outro dado pessoal (a linha
`delete` antiga ainda leva o e-mail e o nome em `description`/`before_data`). `delete-user` não é atômica: se a
exclusão no Auth falhar, o usuário fica sem módulos, papéis e vínculo.

`backup-offsite`: só o token **igual** à `SUPABASE_SERVICE_ROLE_KEY` vale como chamada de cron (antes decodificava o
JWT sem validar a assinatura) e o usuário com papel precisa ter o perfil ativo.

### Autorização do `download-frequencia` (Onda B / B3)

A função lê `frequencia_pacotes` e assina URLs com a service role, então, desde a migração
`supabase/migrations/20261010210000_onda_b_rh_storage.sql` (**em PR rascunho**):

- exige `Authorization: Bearer` com token válido (`401` sem ele);
- antes de qualquer leitura com a service role, confere no banco, com o id do usuário do token,
  `can_access_module(rh)` e `has_permission_code(rh.frequencia.visualizar)` (o mesmo código da rota
  `/rh/frequencia/pacotes`). As duas funções já exigem perfil ativo. Sem uma delas, ou com erro na checagem,
  responde `403` genérico (falha fechada);
- só assina caminho relativo seguro (sem `/` inicial, segmento `.` ou `..`, `%`, `\`, `?` ou `#`), a mesma regra do
  CHECK de `arquivo_path` ([BANCO_DE_DADOS.md](./BANCO_DE_DADOS.md)); caminho inseguro responde `404` genérico;
- o log identifica o usuário só pelo `user.id` (antes gravava o e-mail) e não leva token, link nem caminho;
- **trilha obrigatória (onda E2)**: antes de devolver a URL, grava em `audit_logs` `action = 'download'`,
  `module_name = 'rh'`, `entity_type = 'frequencia_pacotes'`, `entity_id` = id do pacote, `user_id` de quem pediu e
  metadados só com `periodo`, `tipo` e `fonte = 'download-frequencia'` (sem nome de arquivo; o banco completa
  servidor, origem e contexto). Se a gravação falhar, a URL não sai: `500` genérico ("Erro ao gerar link de
  download") e o `console.error` só com o código do erro. Antes gravava sem módulo (a linha não aparecia na trilha
  do RH), com `entity_type = 'frequencia_pacote'` e o nome do arquivo, e ignorava a falha.

O CORS continua `Access-Control-Allow-Origin: *`: a função só aceita o token no cabeçalho `Authorization`, sem
cookie. Restringir o CORS à origem do tenant é pendência. O ZIP do pacote nunca é gravado hoje, então o download
fica sem arquivo até isso existir. Regras de acesso completas em
[RBAC_PERMISSOES.md](./RBAC_PERMISSOES.md#arquivos-do-rh-e-download-de-frequência-onda-b--b3).

### Banco do Brasil (`bb-api`)

Spec: [`2026-10-11-financeiro-fiplan-banco-design.md`](./superpowers/specs/2026-10-11-financeiro-fiplan-banco-design.md)
(Etapa 4). Só leitura: pagamento pela API (Pagamentos em Lote/PagBB) está fora.

- **Autorização**: `Authorization: Bearer` obrigatório (`401`); a RPC `pode_conciliar_pagamentos()` roda como o
  próprio usuário (perfil ativo, módulo `financeiro` e `pagamento.conciliar`) antes de criar o cliente com a service
  role. Sem permissão, `403`; erro na checagem, `500` (falha fechada).
- **Ações** (`POST`, body `{acao, ...}`):
  - `status` → `{ambiente, configurado: {BB_*: boolean}, mtls_pronto, token: {extrato, validacao}}`: diz quais
    segredos existem (nunca o valor) e tenta obter o token OAuth de cada escopo.
  - `extrato` `{conta_bancaria_id, data_inicio, data_fim}` (`YYYY-MM-DD`, até 31 dias): lê agência e conta em
    `fin_contas_bancarias` (só banco `001`), chama `GET /conta-corrente/agencia/{agencia}/conta/{conta}` da API
    Extratos v2 com mTLS, paginando (200 por página, no máximo 50 páginas: acima disso responde `422` sem gravar nada e
    pede um período menor) até `numeroPaginaProximo = 0`, descarta as linhas de saldo e grava
    pela RPC `registrar_extrato_bb` (só service role; idempotente). Devolve `periodo`, `paginas`,
    `recebidos_do_banco`, `recebidos`, `inseridos`, `existentes` e `conciliados` (débitos casados com
    `fin_pagamentos`). A API não traz id do lançamento: `identificador_bb` junta data, lote, documento, histórico,
    valor, sinal e a ordem entre lançamentos idênticos do dia.
  - `validar-conta` `{movimento_id, banco?, agencia, conta}` → `{contaAtiva, titularConta}` (API Validação de Contas
    v1, `GET /contas/{agencia}-{conta}/situacao?cpfCnpj=`; sem mTLS). O CPF/CNPJ é lido no servidor do
    `favorecido_documento` do movimento (`fin_movimentos_bancarios`); o corpo com `cpf_cnpj`/`documento` é recusado
    (`400`), assim como `banco` diferente de `001` e movimento sem CPF/CNPJ (`404` se o movimento não existe). Cada
    consulta (ok ou falha do BB) entra em `audit_logs` pela service role: `action = 'view'`, `module_name =
    'financeiro'`, `entity_type = 'fin_movimentos_bancarios'`, `entity_id` = movimento, `user_id` = quem consultou e
    `metadata` `{fonte, acao, ambiente, resultado, conta_ativa, titular_conta}` (ou `etapa`/`status_bb`/`codigo` na
    falha) — sem documento, agência ou conta. Se a trilha não grava, o resultado não é devolvido (`500`).
- **Segredos** (por instância, `supabase secrets set`; nada no banco nem no front): `BB_AMBIENTE`
  (`homologacao`|`producao`, padrão `homologacao`), `BB_CLIENT_ID`, `BB_CLIENT_SECRET`, `BB_APP_KEY`, `BB_CERT_PEM` e
  `BB_KEY_PEM` (certificado e chave do cliente em PEM para o mTLS da API de Extratos; `\n` literal é aceito no lugar
  da quebra de linha). Token: OAuth2 `client_credentials` com Basic auth (`oauth.hm.bb.com.br` /
  `oauth.bb.com.br`), escopos `extrato-info` e `validacao-contas.info`, guardado em memória até expirar. A chave da
  aplicação vai na query como `gw-dev-app-key` em homologação e `gw-app-key` em produção (conferir no portal do BB na
  homologação).
- **Erros**: falha do BB responde `502` com `etapa` (`token`, `extrato`, `validacao`) e `status_bb`, sem o corpo da
  resposta; certificado ausente/inválido, runtime sem `Deno.createHttpClient`, tempo esgotado ou falha de rede
  responde `503` (`codigo` `certificado_ausente`, `certificado_invalido`, `runtime_sem_mtls`, `timeout`,
  `falha_de_rede`). Toda chamada ao BB (token, extrato, validação) tem limite de 20 s (`AbortSignal.timeout`).
- **LGPD**: o log leva só a ação, a etapa e o código HTTP; nunca token, CPF/CNPJ, agência ou conta.
- **Não verificado** contra o BB: a primeira versão passou em `deno check` e nas funções puras (datas, normalização
  do extrato); a revisão (validar-conta pelo movimento, trilha, tempo limite e limite de páginas) foi conferida com
  `esbuild` e `tsc --strict` com tipos mínimos do Deno (sem `deno` no ambiente). Nada foi chamado na homologação do BB
  (exige credenciais e certificado do cliente).

#### Configurar as credenciais do BB numa instância

Cada cliente roda numa instância própria do Supabase ([NOVO_BANCO.md](./NOVO_BANCO.md)), com as próprias
credenciais do BB. Nada disso vai para o repositório, para `tenants/<slug>/`, para o `.env` do front ou para o
banco: a tela não recebe nem guarda segredo.

1. No portal do desenvolvedor do BB, o cliente cria a aplicação, libera as APIs Extratos e Validação de Contas
   e obtém `client_id`, `client_secret`, a chave da aplicação e o certificado do cliente para o mTLS (certificado
   e chave privada em PEM). Comece em homologação.
2. Grave os seis segredos no ambiente das Edge Functions da instância:

   | Segredo | Valor |
   |---|---|
   | `BB_AMBIENTE` | `homologacao` ou `producao` (ausente = `homologacao`; outro valor é tratado como inválido) |
   | `BB_CLIENT_ID` | `client_id` da aplicação no BB |
   | `BB_CLIENT_SECRET` | `client_secret` da aplicação |
   | `BB_APP_KEY` | chave da aplicação (vai como `gw-dev-app-key` ou `gw-app-key`) |
   | `BB_CERT_PEM` | certificado do cliente em PEM (pode ser uma linha só, com `\n` literal no lugar das quebras) |
   | `BB_KEY_PEM` | chave privada do certificado em PEM (mesmo formato) |

   Com a CLI do Supabase: `supabase secrets set BB_AMBIENTE=homologacao BB_CLIENT_ID=... (etc.)`. No Supabase
   self-hosted da VPS, as Edge Functions leem as variáveis de ambiente do serviço de funções do Docker: inclua as
   seis no ambiente desse serviço e reinicie-o. Defina também `ALLOWED_ORIGINS` com a URL do front.
3. Publique a função `bb-api` na instância.
4. Em `/financeiro/conciliacao`, aba "Banco do Brasil (API)", use "Testar conexão": a ação `status` mostra o
   ambiente, quais segredos faltam (sem mostrar valores) e se o token de cada API saiu. Só depois importe um
   extrato curto para conferir.
5. Para ir para produção, troque `BB_AMBIENTE` para `producao` e as credenciais/certificado pelos de produção.
   Confira no portal do BB o nome do parâmetro da chave da aplicação (ver "Segredos" acima).

## Boas práticas ao mexer

- **Segredos** (service role key, chaves de e-mail/IA) ficam nas variáveis de
  ambiente da função no Supabase — **nunca** no código do client nem no `.env`
  do front.
- Valide a autorização do chamador dentro da função (verifique o JWT/role) antes
  de executar ações privilegiadas.
- Deploy é feito no Supabase (via CLI `supabase functions deploy <nome>`). Em ambiente web/remoto sem CLI, use as ferramentas MCP do
  Supabase quando disponíveis.
- Mantenha o contrato (formato de `body`/resposta) em sincronia com o hook que a
  consome no front.
