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
| `cpsi-ai-assistant` | Assistente de IA para o formulário CPSI (`CPSIPage`). |

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

### Assistente de IA (`cpsi-ai-assistant`)

Exige sessão, o módulo `compras` e respeita limites: 4.000 caracteres por campo, 30.000 no pedido inteiro,
8.192 tokens de resposta e 30 chamadas por usuário por hora. Cada chamada grava uma linha em `audit_logs`
(`entity_type = 'cpsi_ia'`), que também é o contador do limite. Erros internos não vão para o navegador.

### Convite de reunião (`enviar-convite-reuniao`)

Só o criador da reunião ou um administrador envia. Limites contra uso como disparador de mensagens com a marca
do órgão: 50 participantes por chamada, 200 convites por usuário por hora, mensagem livre de até 2.000
caracteres e nenhum link no assunto, na mensagem ou na assinatura além do link da própria reunião. CORS por
`ALLOWED_ORIGINS`, como as demais. Pendente (modelo novo): o módulo `gabinete` ainda pode trocar o `created_by`
de uma reunião pela API, e o link da reunião é livre.

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
- o log identifica o usuário só pelo `user.id` (antes gravava o e-mail) e não leva token, link nem caminho.

O CORS continua `Access-Control-Allow-Origin: *`: a função só aceita o token no cabeçalho `Authorization`, sem
cookie. Restringir o CORS à origem do tenant é pendência. O ZIP do pacote nunca é gravado hoje, então o download
fica sem arquivo até isso existir. Regras de acesso completas em
[RBAC_PERMISSOES.md](./RBAC_PERMISSOES.md#arquivos-do-rh-e-download-de-frequência-onda-b--b3).

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
