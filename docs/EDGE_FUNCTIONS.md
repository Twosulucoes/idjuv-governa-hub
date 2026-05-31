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
