# Banco novo e vazio (Supabase próprio / validação em PostgreSQL)

Como criar um banco **novo** do sistema a partir do baseline de `supabase/baseline/`
([conteúdo e manutenção](../supabase/baseline/README.md)). Escopo: banco **vazio** — nenhum dado de
servidor, usuário ou documento é levado do banco antigo. Para exportar dados, veja
[EXPORTAR_DADOS.md](./EXPORTAR_DADOS.md); migrar dados não está coberto aqui.

> Este guia substitui [MIGRACAO_SUPABASE_PROPRIO.md](./MIGRACAO_SUPABASE_PROPRIO.md) e
> [SCHEMA_SUPABASE_PROPRIO.sql](./SCHEMA_SUPABASE_PROPRIO.sql), que descrevem um banco de 88 tabelas
> e 62 migrações e não reconstroem o sistema atual.

## 1. Onde rodar

| Destino | Serve para | Observação |
|---|---|---|
| **Supabase self-hosted** na VPS (Docker) | **Produção** | O front usa `supabase-js`: Auth (GoTrue), PostgREST, Storage, Realtime e Edge Functions. Só o Postgres não basta. |
| PostgreSQL puro (16/17) | **Validar** o baseline e o teste de RLS | Usa `scripts/db/shim-supabase.sql` para simular `auth`, `storage` e os papéis. **Nunca** para produção. |
| Supabase na nuvem | Alternativa | Projetos Free têm limite de projetos/recursos; o baseline é o mesmo. |

## 2. Validar localmente (antes de tocar na VPS)

Precisa de um Postgres em que você seja superusuário **e que não se chame `postgres`** (o shim cria
um `postgres` sem superuso e com `BYPASSRLS`, como o do Supabase). Exemplo:

```bash
docker run -d --name pg-validacao -p 54329:5432 \
  -e POSTGRES_USER=supabase_admin -e POSTGRES_PASSWORD=validacao postgres:17
export PGHOST=127.0.0.1 PGPORT=54329 PGPASSWORD=validacao
bash scripts/db/validar-baseline.sh      # sem PG_REFERENCIA pula só a comparação com o replay
```

Saída esperada: `baseline APROVADO` (aplicação, banco vazio de dados pessoais, RLS por módulo,
storage e `handle_new_user`). O script apaga e recria o banco `idjuv_baseline`.

## 3. Subir o Supabase self-hosted

Siga o guia oficial de self-hosting com Docker da Supabase. Antes de expor à internet:

1. **Troque todos os segredos de exemplo** do `.env`: `POSTGRES_PASSWORD`, `JWT_SECRET`, `ANON_KEY`,
   `SERVICE_ROLE_KEY` (gerados a partir do novo `JWT_SECRET`), `DASHBOARD_USERNAME/PASSWORD`.
2. **Desative o cadastro público** (`DISABLE_SIGNUP=true`): o front não tem tela de autocadastro e
   usuários são criados por administrador (Edge Function `admin-create-user`, que usa a API admin e
   não depende de cadastro público). Todo usuário criado nasce **inativo** (`handle_new_user`).
3. Configure `SITE_URL`, `ADDITIONAL_REDIRECT_URLS` e o SMTP (recuperação de senha, convites).
4. Coloque o Kong/API atrás de HTTPS e **não publique a porta do Postgres**.

Os nomes das variáveis mudam entre versões: confira o `.env.example` da versão que você baixou.

## 4. Aplicar o baseline

Conecte **direto ao Postgres** (túnel SSH ou rede do Docker), como o papel `postgres`, em sessão —
não pelo pooler em modo transação:

```bash
bash supabase/baseline/aplicar.sh "postgresql://postgres:SENHA@127.0.0.1:5432/postgres"
```

O script recusa um banco cujo `public` já tenha tabelas. Cada arquivo roda numa transação; qualquer
erro interrompe. Não rode o shim nem `validar-*.sh` no Supabase real.

## 5. Primeiro administrador

Num banco vazio não há quem ative usuários. Crie o usuário no Studio (Authentication → Add user) e
promova:

```bash
psql "postgresql://postgres:SENHA@127.0.0.1:5432/postgres" \
  -v email='pessoa@orgao.gov.br' -f supabase/baseline/bootstrap-admin.sql
```

Os demais usuários entram pelo app (Admin → Usuários). Guarde as credenciais fora do repositório.

## 6. Front e Edge Functions

- `.env` do front: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (a `ANON_KEY` nova),
  `VITE_SUPABASE_PROJECT_ID` e `VITE_TENANT_SLUG`. Nada de `SERVICE_ROLE_KEY` no front.
- Edge Functions (detalhes em [EDGE_FUNCTIONS.md](./EDGE_FUNCTIONS.md)): `admin-create-user`,
  `admin-reset-password`, `delete-user`, `download-frequencia`, `backup-offsite`,
  `enviar-convite-reuniao`, `cpsi-ai-assistant`, `database-schema`. Segredos lidos pelo código:
  `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ALLOWED_ORIGINS` (use a URL do
  front), `RESEND_API_KEY`/`RESEND_FROM` (e-mail), `GEMINI_API_KEY`/`GEMINI_MODEL` (assistente),
  `BACKUP_ENCRYPTION_KEY`, `BACKUP_EXTERNAL_API_KEY`, `BACKUP_DEST_SUPABASE_URL`,
  `BACKUP_DEST_SERVICE_ROLE_KEY` (backup externo). Defina só os das funções que for ligar.
- O baseline **não** cria agendamento (`pg_cron`): `backup_config.schedule_cron` é só configuração.
  Agende o `backup-offsite` por fora (cron do sistema chamando a função) — ver
  [BACKUP_CONTINGENCIA.md](./BACKUP_CONTINGENCIA.md).

## 7. Conferência depois de aplicar

Rode estas consultas como `postgres` no banco novo:

```sql
-- 0 policies "acesso total"
SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND policyname ILIKE 'acesso_total%';
-- anon executa exatamente 4 funções (registrar_denuncia_publica, obter_dado_oficial,
-- arbitro_cpf_cadastrado, obter_protocolo_arbitro)
SELECT p.oid::regprocedure FROM pg_proc p
 WHERE p.pronamespace = 'public'::regnamespace AND has_function_privilege('anon', p.oid, 'EXECUTE');
-- toda tabela com RLS ligado (esperado: nenhuma linha)
SELECT relname FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relkind IN ('r','p') AND NOT relrowsecurity;
```

Depois, entre no app com o administrador criado, crie um usuário comum, atribua um módulo e confirme
que ele só vê o módulo concedido. **Não** rode `scripts/db/testar-rls.sh` contra o banco real: ele
semeia dados de teste (use uma cópia).

## 8. Limites e pendências

- O baseline foi validado em **PostgreSQL 15.18, 16.15 e 17.10 com shim**, não num Supabase real.
  Faça a conferência do item 7 no destino.
- Revise as linhas `confianca != alta` de [`rls/mapa.csv`](../supabase/baseline/rls/mapa.csv) com as
  áreas donas dos dados (RH, financeiro, patrimônio…) antes de abrir para usuários reais.
- Buckets públicos ainda entregam o arquivo a quem tem a URL; fechar exige bucket privado + URL
  assinada no front.
- A migração `20260110184920` e o histórico git contêm nomes e CPF de 74 servidores; o baseline não os
  leva, mas o repositório os mantém até uma decisão sobre limpeza de histórico.
