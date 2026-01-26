
# Plano: Descoberta Automática de Tabelas para Visualização e Backup

## Problema Atual

Ambos os sistemas (visualização e backup) usam listas **estáticas hardcoded** de tabelas:
- `database-schema`: `KNOWN_TABLES` com 83 tabelas
- `backup-offsite`: `ALL_TABLES` com 83 tabelas

Quando uma nova tabela é criada, ela **não aparece** automaticamente nesses sistemas até que o código seja manualmente atualizado.

---

## Solução Proposta

Substituir as listas estáticas por **consulta dinâmica ao catálogo PostgreSQL** (`information_schema.tables`), descobrindo automaticamente todas as tabelas do schema `public`.

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                      FLUXO ATUAL (Manual)                               │
├─────────────────────────────────────────────────────────────────────────┤
│  Nova Tabela → [NADA ACONTECE] → Atualização Manual → Redeploy          │
└─────────────────────────────────────────────────────────────────────────┘

                              ↓ TRANSFORMA EM ↓

┌─────────────────────────────────────────────────────────────────────────┐
│                      FLUXO NOVO (Automático)                            │
├─────────────────────────────────────────────────────────────────────────┤
│  Nova Tabela → Catálogo PostgreSQL → Descoberta Automática              │
│                                           ↓                             │
│                        ┌─────────────────────────────────┐              │
│                        │  Visualização    │   Backup     │              │
│                        │  (database-      │   (backup-   │              │
│                        │   schema)        │    offsite)  │              │
│                        └─────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Etapa 1: Criar Função SQL para Listar Tabelas

Criar uma função no banco de dados que retorna todas as tabelas do schema public, excluindo tabelas de sistema e views.

**Migração SQL:**

```sql
CREATE OR REPLACE FUNCTION public.list_public_tables()
RETURNS TABLE(table_name text, row_count bigint) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_name::text,
    (xpath('/row/count/text()', 
      query_to_xml(format('SELECT COUNT(*) FROM %I.%I', t.table_schema, t.table_name), false, true, '')
    ))[1]::text::bigint AS row_count
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND t.table_name NOT LIKE 'pg_%'
    AND t.table_name NOT LIKE '_realtime_%'
  ORDER BY t.table_name;
END;
$$;

-- Permissão para service role
GRANT EXECUTE ON FUNCTION public.list_public_tables() TO service_role;
```

---

## Etapa 2: Atualizar Edge Function database-schema

Modificar para usar a função `list_public_tables()` em vez da lista hardcoded.

**Mudanças principais:**

1. Remover array `KNOWN_TABLES`
2. Adicionar função `discoverTables()` que chama `supabase.rpc('list_public_tables')`
3. Manter função `categorizeTable()` para classificar dinamicamente
4. Adicionar cache de descoberta (5 minutos) para performance

**Pseudocódigo:**

```text
async function discoverTables(supabase):
  resultado = await supabase.rpc('list_public_tables')
  
  return resultado.data.map(t => ({
    name: t.table_name,
    rowCount: t.row_count
  }))

// No handler principal:
const tables = await discoverTables(supabase)

// Processar cada tabela descoberta
for (const table of tables):
  const info = await processTable(supabase, table.name)
  // categorizar, buscar colunas, etc.
```

---

## Etapa 3: Atualizar Edge Function backup-offsite

Modificar para usar a mesma função de descoberta automática.

**Mudanças principais:**

1. Remover array `ALL_TABLES`
2. Adicionar função `discoverAllTables()` que chama `list_public_tables()`
3. Usar lista dinâmica em todos os endpoints (execute, external-export, list-tables)
4. Atualizar manifesto para mostrar tabelas descobertas vs processadas

**Resultado no endpoint list-tables:**

```json
{
  "success": true,
  "discovery_mode": "automatic",
  "discovered_at": "2026-01-26T20:00:00Z",
  "tables": ["audit_logs", "cargos", "servidores", ...],
  "total": 85,
  "categories": {
    "Pessoas": ["servidores", "profiles", ...],
    "RH": ["ferias_servidor", "licencas_afastamentos", ...],
    ...
  }
}
```

---

## Etapa 4: Adicionar Lista de Exclusão (Opcional)

Para evitar backup de tabelas temporárias ou de sistema, manter uma lista pequena de exclusões:

```typescript
const EXCLUDED_TABLES = [
  '_realtime_subscription',
  'schema_migrations',
  'supabase_functions_hooks',
  // Outras tabelas de sistema que podem aparecer
];
```

---

## Etapa 5: Atualizar Interface de Visualização

Adicionar indicador visual de "modo de descoberta automática" na página de banco de dados.

**Modificações em `DatabaseSchemaPage.tsx`:**

1. Mostrar badge "Auto-Discovery" 
2. Exibir timestamp da última descoberta
3. Botão "Atualizar Descoberta" para forçar refresh

---

## Etapa 6: Atualizar Documentação

Atualizar `docs/BACKUP_CONTINGENCIA.md` para refletir o novo comportamento automático.

---

## Resumo de Arquivos

| Ação | Arquivo |
|------|---------|
| Migração SQL | Criar função `list_public_tables()` |
| Modificar | `supabase/functions/database-schema/index.ts` |
| Modificar | `supabase/functions/backup-offsite/index.ts` |
| Modificar | `src/pages/admin/DatabaseSchemaPage.tsx` |
| Modificar | `docs/BACKUP_CONTINGENCIA.md` |

---

## Detalhes Técnicos

### Query ao information_schema

A função SQL usa `information_schema.tables` com filtros para obter apenas tabelas reais do schema public:

```sql
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'  -- Exclui views
  AND table_name NOT LIKE 'pg_%' -- Exclui tabelas do PostgreSQL
```

### Contagem de Registros Eficiente

A função usa `query_to_xml` com `xpath` para obter contagens de forma dinâmica sem precisar de SQL dinâmico explícito, mantendo a segurança.

### Categorização Dinâmica

A função `categorizeTable()` já existente será mantida e aplicada às tabelas descobertas. Ela usa padrões de nomenclatura para classificar:

- `servidor*` → Pessoas
- `cargo*`, `estrutura*` → Estrutura
- `folha*`, `rubrica*` → Financeiro
- etc.

### Cache de Performance

Para evitar consultas repetitivas ao catálogo, as Edge Functions podem implementar cache em memória de 5 minutos para a lista de tabelas.

---

## Benefícios

1. **Zero Manutenção** - Novas tabelas aparecem automaticamente
2. **100% Cobertura** - Garantia de que todas as tabelas são incluídas
3. **Consistência** - Mesma fonte de verdade para visualização e backup
4. **Transparência** - Interface mostra exatamente quantas tabelas existem
5. **Segurança** - Função SQL com `SECURITY DEFINER` e permissões controladas

---

## Verificação Pós-Implementação

Após implementar, o sistema poderá ser verificado:

1. Criar uma nova tabela de teste via SQL
2. Acessar `/admin/database` - tabela deve aparecer automaticamente
3. Executar backup - nova tabela deve ser incluída
4. Verificar manifesto do backup - deve listar a nova tabela
