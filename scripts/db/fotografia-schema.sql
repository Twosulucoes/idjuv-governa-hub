-- Fotografia da ESTRUTURA do banco (sem nenhum dado de tabela), uma linha por objeto:
--     categoria <TAB> chave <TAB> valor
-- Serve para comparar bancos de origens diferentes (produção da VPS, replay das migrações, baseline)
-- sem o ruído de um pg_dump: donos, ordem, comentários e objetos internos do Supabase ficam de fora.
-- Corpo de função e definição de view entram como md5 do texto (o texto vem das migrações).
--
-- Uso: psql "$URL" -X -At -F $'\t' -v ON_ERROR_STOP=1 -f scripts/db/fotografia-schema.sql > fotografia.tsv
-- Só lê o catálogo; pode rodar com default_transaction_read_only=on.
-- Escopo: schema public inteiro + policies, triggers e buckets do storage.

-- Assinaturas, tipos e expressões só vêm qualificadas com schema quando o objeto não está no search_path:
-- fixá-lo deixa a saída igual entre bancos com search_path diferente.
set search_path = public, extensions, pg_catalog;

with
tabelas as (
  select c.oid, c.relname, c.relkind, c.relrowsecurity, c.relforcerowsecurity
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm')
),
linhas as (
  -- tabelas, views e RLS
  -- chave como text: se ficasse do tipo name (o de relname), o union cortaria toda chave em 63 bytes
  select 'tabela' as categoria, relname::text as chave,
         case relkind when 'r' then 'tabela' when 'p' then 'tabela particionada' when 'v' then 'view' else 'view materializada' end
         || case when relkind in ('r', 'p') then ' rls=' || relrowsecurity || ' force=' || relforcerowsecurity else '' end as valor
  from tabelas
  union all
  -- colunas
  select 'coluna', t.relname || '.' || a.attname,
         format_type(a.atttypid, a.atttypmod) || case when a.attnotnull then ' not null' else '' end
         || coalesce(' default ' || pg_get_expr(d.adbin, d.adrelid), '')
  from tabelas t
  join pg_attribute a on a.attrelid = t.oid and a.attnum > 0 and not a.attisdropped
  left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
  where t.relkind in ('r', 'p')
  union all
  -- constraints (PK, FK, unique, check)
  select 'constraint', t.relname || '.' || co.conname, pg_get_constraintdef(co.oid)
  from tabelas t join pg_constraint co on co.conrelid = t.oid
  union all
  -- índices
  select 'indice', i.relname, pg_get_indexdef(i.oid)
  from pg_index x join pg_class i on i.oid = x.indexrelid join tabelas t on t.oid = x.indrelid
  union all
  -- views: definição como md5
  select 'view', relname, md5(pg_get_viewdef(oid))
  from tabelas where relkind in ('v', 'm')
  union all
  -- funções: assinatura -> segurança, search_path, md5 do corpo
  select 'funcao', p.oid::regprocedure::text,
         case when p.prosecdef then 'definer' else 'invoker' end
         || ' config=' || coalesce(array_to_string(p.proconfig, ','), '-')
         || ' corpo=' || md5(coalesce(p.prosrc, ''))
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prokind in ('f', 'p')
    and not exists (select 1 from pg_depend dep where dep.objid = p.oid and dep.deptype = 'e')
  union all
  -- quem executa cada função (só os papéis do app)
  select 'execucao', p.oid::regprocedure::text || ' ' || r.rolname, 'execute'
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  cross join (values ('anon'), ('authenticated')) r(rolname)
  where n.nspname = 'public' and p.prokind in ('f', 'p')
    and not exists (select 1 from pg_depend dep where dep.objid = p.oid and dep.deptype = 'e')
    and exists (select 1 from pg_roles x where x.rolname = r.rolname)
    and has_function_privilege(r.rolname, p.oid, 'EXECUTE')
  union all
  -- privilégios de tabela dos papéis do app
  select 'privilegio', t.relname || ' ' || r.rolname,
         concat_ws(',',
           case when has_table_privilege(r.rolname, t.oid, 'SELECT') then 'select' end,
           case when has_table_privilege(r.rolname, t.oid, 'INSERT') then 'insert' end,
           case when has_table_privilege(r.rolname, t.oid, 'UPDATE') then 'update' end,
           case when has_table_privilege(r.rolname, t.oid, 'DELETE') then 'delete' end)
  from tabelas t cross join (values ('anon'), ('authenticated')) r(rolname)
  where exists (select 1 from pg_roles x where x.rolname = r.rolname)
  union all
  -- triggers (public e storage.objects)
  select 'trigger', n.nspname || '.' || c.relname || '.' || tg.tgname, pg_get_triggerdef(tg.oid) || ' enabled=' || tg.tgenabled::text
  from pg_trigger tg join pg_class c on c.oid = tg.tgrelid join pg_namespace n on n.oid = c.relnamespace
  where not tg.tgisinternal and (n.nspname = 'public' or (n.nspname = 'storage' and c.relname = 'objects'))
  union all
  -- policies (public e storage)
  select 'policy', pol.schemaname || '.' || pol.tablename || '.' || pol.policyname,
         pol.cmd || ' ' || pol.permissive || ' to=' || array_to_string(array(select unnest(pol.roles) order by 1), ',')
         || ' using=' || coalesce(pol.qual, '-') || ' check=' || coalesce(pol.with_check, '-')
  from pg_policies pol
  where pol.schemaname in ('public', 'storage')
  union all
  -- enums
  select 'enum', t.typname, string_agg(e.enumlabel, ',' order by e.enumsortorder)
  from pg_type t join pg_enum e on e.enumtypid = t.oid join pg_namespace n on n.oid = t.typnamespace
  where n.nspname = 'public'
  group by t.typname
  union all
  -- extensões (menos as da plataforma Supabase, que o replay não instala: viraria ruído em toda execução)
  select 'extensao', e.extname, e.extnamespace::regnamespace::text || ' ' || e.extversion
  from pg_extension e
  where e.extname not in ('plpgsql', 'pg_graphql', 'pg_cron', 'pg_net', 'supabase_vault', 'pgsodium', 'pgjwt',
                          'pg_stat_statements', 'pg_stat_monitor', 'pgaudit', 'pg_hashids', 'pg_jsonschema',
                          'wrappers', 'hypopg', 'index_advisor', 'plpgsql_check')
)
select categoria, chave, regexp_replace(valor, '\s+', ' ', 'g') from linhas
union all
-- buckets do storage
select 'bucket', id, 'public=' || public from storage.buckets
order by 1, 2;
