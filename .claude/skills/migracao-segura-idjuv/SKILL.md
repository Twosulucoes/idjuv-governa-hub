---
name: migracao-segura-idjuv
description: Cria uma migração SQL nova para o Supabase do IDJUV Governa Hub (tabela, coluna, função, view) com RLS obrigatório desde o início e checklist de segurança. Use sempre que o usuário pedir para "criar uma tabela", "adicionar uma coluna", "criar uma migração", "criar uma função no banco/RPC", ou qualquer alteração de schema.
---

# Migração de banco segura — IDJUV Governa Hub

Este projeto já teve gap de RLS identificado em auditoria
(`docs/AUDITORIA_USUARIOS.md`, item C2 — proposta em
`docs/RLS_USUARIOS_PROPOSTA.sql`). O objetivo deste skill é **nunca mais
criar uma tabela sem RLS pensada desde o commit inicial**, em vez de corrigir
depois.

## Antes de escrever SQL

1. Rode (via MCP do Supabase, se disponível nesta sessão) `list_tables` para
   confirmar que a tabela/coluna não existe e entender FKs relacionadas.
2. Confirme o nome do arquivo: `supabase/migrations/YYYYMMDDHHMMSS_<uuid>.sql`
   (o timestamp deve ser maior que o da última migração em
   `supabase/migrations/`; gere um uuid v4 qualquer para o sufixo).
3. Decida a que módulo (`MODULOS` em `src/shared/config/modules.config.ts`) a
   tabela pertence — o nome/prefixo deve deixar isso óbvio para quem ler o
   schema depois.

## Checklist obrigatório por tabela nova

Toda `CREATE TABLE` nesta migração **precisa**, no mesmo arquivo:

```sql
ALTER TABLE public.<tabela> ENABLE ROW LEVEL SECURITY;

-- Leitura: normalmente autenticados, ou escopo mais restrito se o dado for
-- sensível (RH/financeiro) — não copie "USING (true)" sem pensar se o dado
-- deveria ser filtrado por unidade/organização/dono do registro.
CREATE POLICY "<tabela>_select" ON public.<tabela>
  FOR SELECT TO authenticated
  USING ( ... );

-- Escrita: normalmente restrita por permissão/role, nunca "true" solto.
CREATE POLICY "<tabela>_insert" ON public.<tabela>
  FOR INSERT TO authenticated
  WITH CHECK ( public.usuario_tem_permissao(auth.uid(), '<dominio>.<recurso>.criar') );

CREATE POLICY "<tabela>_update" ON public.<tabela>
  FOR UPDATE TO authenticated
  USING ( public.usuario_tem_permissao(auth.uid(), '<dominio>.<recurso>.editar') )
  WITH CHECK ( public.usuario_tem_permissao(auth.uid(), '<dominio>.<recurso>.editar') );
```

Use as funções de checagem já existentes (`usuario_tem_permissao`,
`usuario_eh_admin`/`usuario_eh_super_admin`, `usuario_tem_acesso_modulo`,
`user_has_unit_access`) descritas em `docs/RBAC_PERMISSOES.md` e
`docs/MIGRACAO_SUPABASE_PROPRIO.md` — não invente uma função de checagem nova
sem necessidade.

Se genuinamente a tabela precisa ser pública (ex. transparência/portal), a
política deve ser explícita para `anon`/público e comentada explicando por
quê — não deixe "sem RLS" como forma de simular "é pública".

## Depois de aplicar

1. Aplique a migração (via MCP `apply_migration` se disponível, senão
   documente para o usuário aplicar).
2. Rode `get_advisors` (MCP Supabase) e resolva qualquer alerta de "RLS
   disabled" ou "policy missing" antes de considerar a migração pronta.
3. Regenere os tipos TypeScript (`generate_typescript_types` via MCP, ou
   `supabase gen types typescript` localmente) — nunca edite
   `src/integrations/supabase/types.ts` na mão.
4. Se a tabela alimenta uma nova permissão, adicione a linha correspondente em
   `funcoes_sistema` (ver padrão em `docs/MIGRACAO_SUPABASE_PROPRIO.md`) na
   mesma migração, não em uma separada solta.

## Se a mudança é numa Edge Function em vez de SQL

Toda Edge Function que faz uma ação privilegiada (ex. usa
`SUPABASE_SERVICE_ROLE_KEY`, cria/deleta usuário, expõe schema/dados
agregados) **precisa** checar identidade e permissão antes de agir — siga o
padrão já correto em `supabase/functions/admin-create-user/index.ts`:

```ts
const authHeader = req.headers.get("Authorization");
if (!authHeader) return new Response(..., { status: 401 });

const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { headers: { Authorization: authHeader } },
});
const { data: { user } } = await supabaseUser.auth.getUser();
if (!user) return new Response(..., { status: 401 });
// então checar role/permissão via RPC antes de usar o client admin (service role)
```

Não copie o padrão de `database-schema` ou `cpsi-ai-assistant` — essas duas
funções **não** fazem essa checagem hoje e são uma dívida de segurança
conhecida, não um exemplo a seguir.

## Não faça

- Não crie tabela com `USING (true)` para escrita sem justificar.
- Não desabilite RLS "temporariamente para testar" numa migração commitada.
- Não misture uma mudança de schema não relacionada na mesma migração de outra
  feature — dificulta rollback e revisão.
