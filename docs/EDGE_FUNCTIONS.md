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
| `enviar-convite-reuniao` | Envia convites de reunião (e-mail) aos participantes. |
| `download-frequencia` | Gera/serve arquivos de frequência para download. |
| `database-schema` | Inspeciona o schema do banco (apoia a tela `DatabaseSchemaPage`). |
| `backup-offsite` | Executa/orquestra backup off-site (apoia `BackupOffsitePage`). |
| `cpsi-ai-assistant` | Assistente de IA para o formulário CPSI (`CPSIPage`). |

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
`crypto.getRandomValues`. `delete-user` continua protegendo o UUID fixo do super admin do cliente antigo
(`PROTECTED_SUPER_ADMIN_ID`), que não existe num banco novo: o último administrador de um banco novo só é protegido
por não poder excluir a si mesmo.

`backup-offsite`: só o token **igual** à `SUPABASE_SERVICE_ROLE_KEY` vale como chamada de cron (antes decodificava o
JWT sem validar a assinatura) e o usuário com papel precisa ter o perfil ativo.

## Boas práticas ao mexer

- **Segredos** (service role key, chaves de e-mail/IA) ficam nas variáveis de
  ambiente da função no Supabase — **nunca** no código do client nem no `.env`
  do front.
- Valide a autorização do chamador dentro da função (verifique o JWT/role) antes
  de executar ações privilegiadas.
- Deploy é feito no Supabase (via CLI `supabase functions deploy <nome>` ou pelo
  fluxo do Lovable). Em ambiente web/remoto sem CLI, use as ferramentas MCP do
  Supabase quando disponíveis.
- Mantenha o contrato (formato de `body`/resposta) em sincronia com o hook que a
  consome no front.
