# Banco novo e vazio (Supabase próprio / validação em PostgreSQL)

Como criar um banco **novo** do sistema a partir do baseline de `supabase/baseline/`
([conteúdo e manutenção](../supabase/baseline/README.md)). Escopo: banco **vazio** — nenhum dado de
servidor, usuário ou documento é levado do banco antigo. Para exportar dados, veja
[EXPORTAR_DADOS.md](./EXPORTAR_DADOS.md); migrar dados não está coberto aqui.

> Este guia substitui [MIGRACAO_SUPABASE_PROPRIO.md](./MIGRACAO_SUPABASE_PROPRIO.md) (descreve 88
> tabelas e 62 migrações) e [SCHEMA_SUPABASE_PROPRIO.sql](./SCHEMA_SUPABASE_PROPRIO.sql) (10
> `CREATE TABLE`): nenhum dos dois reconstrói o sistema atual.

## 1. Onde rodar

| Destino | Serve para | Observação |
|---|---|---|
| **Supabase self-hosted** na VPS (Docker) | **Produção** | O front usa `supabase-js`: Auth (GoTrue), PostgREST, Storage, Realtime e Edge Functions. Só o Postgres não basta. |
| PostgreSQL puro (15, 16 ou 17) | **Validar** o baseline e o teste de RLS | Usa `scripts/db/shim-supabase.sql` para simular `auth`, `storage` e os papéis. **Nunca** para produção. |
| Supabase na nuvem | Alternativa | Projetos Free têm limite de projetos/recursos; o baseline é o mesmo. |

## 2. Validar localmente (antes de tocar na VPS)

Precisa de um Postgres em que você seja superusuário **e que não se chame `postgres`** (o shim cria
um `postgres` sem superuso e com `BYPASSRLS`, como o do Supabase). Exemplo:

```bash
# `trust` porque o shim cria o papel `postgres` sem senha; a porta fica só no loopback.
docker run -d --name pg-validacao -p 127.0.0.1:54329:5432 \
  -e POSTGRES_USER=supabase_admin -e POSTGRES_HOST_AUTH_METHOD=trust postgres:17
export PGHOST=127.0.0.1 PGPORT=54329
bash scripts/db/validar-baseline.sh
```

Saída esperada: `baseline APROVADO` (aplicação, banco vazio de dados pessoais, RLS por módulo com
UPDATE/DELETE, storage, identidade, RPCs e triggers). O script **apaga e recria** os bancos `idjuv_baseline`,
`idjuv_baseline_ref` e `idjuv_baseline_teste`, e recusa um `PGHOST` que não seja local (exceto com
`PERMITIR_REMOTO=1`). Precisa de `bash` 4+, `node`, `perl`, `psql` e `pg_dump` (da versão do servidor ou mais
nova) no PATH. Para comparar também com o replay das migrações, rode antes `scripts/db/validar-migracoes.sh` e
informe `PG_REPLAY=<banco do replay>` (`EXIGIR_REPLAY=1` reprova se ele faltar).

## 3. Subir o Supabase self-hosted

Siga o guia oficial de self-hosting com Docker da Supabase. Antes de expor à internet:

1. **Troque todos os segredos de exemplo** do `.env`: `POSTGRES_PASSWORD`, `JWT_SECRET`, `ANON_KEY`,
   `SERVICE_ROLE_KEY` (gerados a partir do novo `JWT_SECRET`), `DASHBOARD_USERNAME/PASSWORD`.
2. **Desative o cadastro público e o login anônimo** (`DISABLE_SIGNUP=true`; confirme também que o
   login anônimo do GoTrue está desligado): o front não tem tela de autocadastro e usuários são criados
   por administrador (Edge Function `admin-create-user`, que usa a API admin e não depende de cadastro
   público). Um usuário criado direto no Auth/Studio nasce **inativo** (`handle_new_user`); o criado pela
   Edge Function `admin-create-user` nasce **ativo** (ela grava `is_active: true`).
3. Configure `SITE_URL`, `ADDITIONAL_REDIRECT_URLS` e o SMTP (recuperação de senha, convites).
4. Coloque o Kong/API atrás de HTTPS e **não publique a porta do Postgres**.
5. Os formulários públicos (árbitros, federações, gestores escolares, denúncia) e o upload anônimo em
   `arbitros-docs` não têm limite de taxa no banco: aplique rate limit no proxy (Kong/nginx) e CAPTCHA
   no formulário.

Os nomes das variáveis mudam entre versões: confira o `.env.example` da versão que você baixou.

## 4. Aplicar o baseline

Conecte **direto ao Postgres** (túnel SSH ou rede do Docker), como o papel `postgres`, em sessão —
não pelo pooler em modo transação:

```bash
# a senha vai em PGPASSWORD (a URL com senha apareceria em `ps` e no histórico do shell)
PGPASSWORD='...' bash supabase/baseline/aplicar.sh "postgresql://postgres@127.0.0.1:5432/postgres"
```

O script recusa um banco cujo `public` já tenha tabelas e aplica tudo numa **única transação**: se
qualquer arquivo falhar, nada fica aplicado e o comando pode ser repetido. Não rode o shim nem
`validar-*.sh` no Supabase real. O `aplicar.sh` não toca em `auth.users` existentes: num projeto com
usuários já criados, o trigger `on_auth_user_created` passa a valer só para os próximos.

## 5. Primeiro administrador

Num banco vazio não há quem ative usuários. Crie o usuário no Studio (Authentication → Add user, marcando
**Auto Confirm User**) e promova (precisa de `psql` 13+; o e-mail é procurado em `auth.users` e precisa estar
confirmado; o script **recusa** se já houver um administrador ativo, a menos que se passe `-v forcar=1`):

```bash
PGPASSWORD='...' psql "postgresql://postgres@127.0.0.1:5432/postgres" \
  -v email='pessoa@orgao.gov.br' -f supabase/baseline/bootstrap-admin.sql
```

Os demais usuários entram pelo app (Admin → Usuários). Guarde as credenciais fora do repositório.

## 6. Front e Edge Functions

- `.env` do front: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (a `ANON_KEY` nova),
  `VITE_SUPABASE_PROJECT_ID` e `VITE_TENANT_SLUG`. Nada de `SERVICE_ROLE_KEY` no front.
- Edge Functions (detalhes em [EDGE_FUNCTIONS.md](./EDGE_FUNCTIONS.md)): `admin-create-user`,
  `admin-reset-password`, `delete-user`, `download-frequencia`, `backup-offsite`,
  `enviar-convite-reuniao`, `enviar-notificacao`, `cpsi-ai-assistant`, `database-schema`. Segredos lidos pelo código:
  `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ALLOWED_ORIGINS` (use a URL do
  front), `RESEND_API_KEY`/`RESEND_FROM` (e-mail, só como reserva: o cliente configura o envio em
  `/admin/envios`, com credencial no Vault), `GEMINI_API_KEY`/`GEMINI_MODEL` (assistente),
  `BACKUP_ENCRYPTION_KEY`, `BACKUP_EXTERNAL_API_KEY`, `BACKUP_DEST_SUPABASE_URL`,
  `BACKUP_DEST_SERVICE_ROLE_KEY` (backup externo). Defina só os das funções que for ligar.
- **Defina `FUNCTIONS_VERIFY_JWT=true`** no `.env` das Edge Functions (no self-hosted o exemplo costuma vir
  `false`; confirme na sua versão). `backup-offsite` só aceita como "cron" a própria service role key, mas as
  demais funções confiam no gateway para validar o JWT.
- O baseline **não** cria agendamento (`pg_cron`): `backup_config.schedule_cron` é só configuração.
  Agende o `backup-offsite` por fora (cron do sistema chamando a função) — ver
  [BACKUP_CONTINGENCIA.md](./BACKUP_CONTINGENCIA.md).

## 7. Conferência depois de aplicar

Rode estas consultas como `postgres` no banco novo:

```sql
-- 0 policies "acesso total"
SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND policyname ILIKE 'acesso_total%';
-- anon executa exatamente 6 funções (registrar_denuncia_publica, obter_dado_oficial, arbitro_cpf_cadastrado,
-- obter_protocolo_arbitro, consultar_gestor_por_cpf, registrar_gestor_publico)
SELECT p.oid::regprocedure FROM pg_proc p
 WHERE p.pronamespace = 'public'::regnamespace AND has_function_privilege('anon', p.oid, 'EXECUTE');
-- toda tabela com RLS ligado (esperado: nenhuma linha)
SELECT relname FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relkind IN ('r','p') AND NOT relrowsecurity;
-- ninguém de fora tem TRUNCATE/TRIGGER, e audit_logs não é gravável por API (esperado: nenhuma linha)
SELECT relname FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relkind IN ('r','p')
   AND (has_table_privilege('anon', oid, 'TRUNCATE') OR has_table_privilege('authenticated', oid, 'TRUNCATE')
        OR has_table_privilege('authenticated', 'public.audit_logs', 'INSERT'));
```

Depois, entre no app com o administrador criado, crie um usuário comum, atribua um módulo e confirme
que ele só vê o módulo concedido, e que **não consegue se ativar nem trocar o próprio `servidor_id`**
(o `UPDATE` em `profiles` deve falhar com `42501`). **Não** rode `scripts/db/testar-rls.sh` contra o
banco real: ele cria uma cópia (`CREATE DATABASE ... TEMPLATE`), semeia dados de teste nela e a apaga;
exige superusuário e que ninguém esteja conectado ao banco de origem.

## 8. Limites e pendências

- O baseline foi validado em **PostgreSQL 15.18, 16.15 e 17.10 com shim**, não num Supabase real.
  Faça a conferência do item 7 no destino.
- Revise as linhas `confianca != alta` de [`rls/mapa.csv`](../supabase/baseline/rls/mapa.csv) com as
  áreas donas dos dados (RH, financeiro, patrimônio…) antes de abrir para usuários reais.
- Decisões em aberto (sigilo de processos, granularidade do módulo `rh`, permissões `admin.*` do papel
  `user`, oráculos de permissão, limite de taxa): [`supabase/baseline/README.md`](../supabase/baseline/README.md),
  seção “Pendências e decisões em aberto”.
- O baseline cria **10 buckets** (`overlay/50_storage.sql`, apurado em 2026-10-09). Buckets públicos
  ainda entregam o arquivo a quem tem a URL; fechar exige bucket privado + URL assinada no front. O
  `inventario-evidencias` (fotos da vistoria de inventário) já nasce privado e o front lê por URL assinada.
  Os buckets do RH `frequencias` e `documentos-requerimento` e o `documentos` também são privados; desde a B3
  (migração `supabase/migrations/20261010180000_onda_b_rh_storage.sql`, em PR rascunho) o documento assinado do
  servidor abre por URL assinada, mas portarias, atos e cedência ainda gravam link público (`getPublicUrl`) do
  bucket `documentos`, que num bucket privado não abre (pendência; ver [RBAC_PERMISSOES.md](./RBAC_PERMISSOES.md#arquivos-do-rh-e-download-de-frequência-onda-b--b3)).
- `fotos_vistoria_inventario` é da classe `preservar` do mapa de RLS: as policies vêm da migração
  `20261009160000` pelo replay, não do gerador ([detalhe](../supabase/baseline/README.md)).
- A migração `20260110184920` e o histórico git contêm 74 nomes de servidores (CPF placeholder); o baseline não
  os leva, mas o repositório os mantém até uma decisão sobre limpeza de histórico.
