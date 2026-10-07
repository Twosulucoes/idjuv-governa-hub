# Sistema de Backup e Contingência Externa - IDJUV

## Visão Geral

O sistema de backup foi projetado para garantir **redundância total** dos dados do IDJUV, permitindo operação e leitura dos dados fora da plataforma Lovable em caso de indisponibilidade.

### 🚀 Descoberta Automática de Tabelas

O sistema utiliza **descoberta dinâmica** via catálogo PostgreSQL (`information_schema.tables`), garantindo que:

- ✅ **Novas tabelas são incluídas automaticamente** no backup sem necessidade de atualização de código
- ✅ **Visualização de banco de dados** sempre mostra 100% das tabelas existentes
- ✅ **Zero manutenção** - não é necessário adicionar tabelas manualmente

A descoberta é feita através da função SQL `public.list_public_tables()`.

---

## Tabelas Incluídas (Descoberta Automática)

O sistema descobre automaticamente todas as tabelas do schema `public`, excluindo apenas tabelas de sistema:

- `_realtime_subscription`
- `schema_migrations`
- `supabase_functions_migrations`
- `supabase_functions_hooks`

### Categorização Automática

As tabelas são categorizadas automaticamente por padrões de nomenclatura:

| Categoria | Padrões |
|-----------|---------|
| **Usuários e Permissões** | profile*, user_*, role_*, perfis, funcoes_*, usuario_* |
| **Estrutura Organizacional** | estrutura_*, cargo*, composicao_*, centros_custo |
| **Servidores e RH** | servidor*, lotacao*, ferias*, licenca*, cessao*, designacao* |
| **Ponto e Frequência** | jornada*, ponto*, banco_hora*, feriado* |
| **Folha de Pagamento** | folha*, rubrica*, inss*, irrf*, remessa*, banco* |
| **Unidades Locais** | unidades_locais*, agenda_unidade*, patrimonio_unidade* |
| **Federações** | federac*, calendario_federacao* |
| **Documentos** | documento*, portaria*, memorando*, termo* |
| **Reuniões** | reunio*, participantes_reuniao*, config_assinatura* |
| **ASCOM** | demandas_ascom* |
| **Sistema** | audit*, backup*, config*, approval* |

---

## Verificação de Backup 100%

Após cada backup, o sistema gera um **manifest** com detalhes completos:

### Como verificar se o backup está completo:

1. **Via Interface Admin:**
   - Acesse: Admin > Backup Offsite > Histórico
   - O campo "Tabelas" mostra o número descoberto automaticamente
   - Badge "Descoberta Automática" indica que o sistema está usando detecção dinâmica

2. **Via Resposta do Backup:**
   ```json
   {
     "success": true,
     "tablesExported": 85,
     "totalRecords": 15000,
     "format": "json",
     "discoveryMode": "automatic"
   }
   ```

1. **Via Interface Admin:**
   - Acesse: Admin > Backup Offsite > Histórico
   - Verifique a coluna "Tabelas" (deve mostrar 83)

2. **Via Resposta do Backup:**
   ```json
   {
     "success": true,
     "tablesExported": 83,
     "totalRecords": 15000,
     "format": "json"
   }
   ```

3. **Via Manifest:**
   - Baixe o manifest do backup
   - Confira `discovery.mode === 'automatic'`
   - Confira `tables.list` para ver todas as tabelas descobertas

4. **Via API (list-tables):** exige a `apiKey` de contingência externa
   (`BACKUP_EXTERNAL_API_KEY`) ou o JWT de um usuário com papel de backup;
   sem isso a função responde erro.
   ```bash
   curl -X POST https://tewgloptmijuaychoxnq.supabase.co/functions/v1/backup-offsite \
     -H "Content-Type: application/json" \
     -d '{"action": "list-tables", "apiKey": "SUA_API_KEY"}'
   ```

   Resposta:
   ```json
   {
     "success": true,
     "discovery_mode": "automatic",
     "discovered_at": "2026-01-26T20:00:00.000Z",
     "tables": ["audit_logs", "cargos", "servidores", ...],
     "total": 85,
     "categories": {...}
   }
   ```

---

## Formatos de Exportação

### 1. JSON (padrão)
```json
{
  "exported_at": "2026-01-26T12:00:00.000Z",
  "system_version": "2.0.0",
  "discovery_mode": "automatic",
  "tables_count": 85,
  "total_records": 15000,
  "table_stats": {
    "servidores": 500,
    "documentos": 2000
  },
  "data": {
    "servidores": [{ "id": "...", "nome_completo": "..." }],
    "documentos": [{ "id": "...", "numero": "..." }]
  }
}
```

### 2. CSV (JSON com CSVs internos)
```json
{
  "format": "csv",
  "exported_at": "2026-01-26T12:00:00.000Z",
  "discovery_mode": "automatic",
  "tables": {
    "servidores": "id,nome_completo,cpf\n\"uuid-1\",\"NOME\",\"123.456.789-00\"",
    "documentos": "id,numero,tipo\n\"uuid-2\",\"001/2026\",\"portaria\""
  }
}
```

### 3. SQL PostgreSQL
```sql
-- ============================================
-- BACKUP COMPLETO IDJUV (Descoberta Automática)
-- Gerado em: 2026-01-26T12:00:00.000Z
-- Tabelas: 85
-- Total de registros: 15000
-- ============================================

BEGIN;

-- Tabela: servidores (500 registros)
DELETE FROM servidores;
INSERT INTO servidores (id, nome_completo, cpf) VALUES ('uuid-1', 'NOME', '123.456.789-00');
-- ...

COMMIT;
```

---

## Acesso Externo via API

### Endpoint Público
```
POST https://tewgloptmijuaychoxnq.supabase.co/functions/v1/backup-offsite
```

### Parâmetros
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `action` | string | `external-export` para exportação externa |
| `apiKey` | string | Chave de API configurada em `BACKUP_EXTERNAL_API_KEY` |
| `format` | string | `json`, `csv` ou `sql` (padrão: json) |
| `tables` | array | Lista de tabelas específicas (opcional) |
| `since` | string | Data ISO para backup incremental (opcional) |

### Exemplo: Backup Completo
```bash
curl -X POST https://tewgloptmijuaychoxnq.supabase.co/functions/v1/backup-offsite \
  -H "Content-Type: application/json" \
  -d '{
    "action": "external-export",
    "apiKey": "SUA_API_KEY",
    "format": "json"
  }'
```

### Exemplo: Backup Incremental (últimas 24h)
```bash
curl -X POST https://tewgloptmijuaychoxnq.supabase.co/functions/v1/backup-offsite \
  -H "Content-Type: application/json" \
  -d '{
    "action": "external-export",
    "apiKey": "SUA_API_KEY",
    "format": "sql",
    "since": "2026-01-25T00:00:00.000Z"
  }'
```

### Exemplo: Tabelas Específicas
```bash
curl -X POST https://tewgloptmijuaychoxnq.supabase.co/functions/v1/backup-offsite \
  -H "Content-Type: application/json" \
  -d '{
    "action": "external-export",
    "apiKey": "SUA_API_KEY",
    "tables": ["servidores", "documentos", "lotacoes"]
  }'
```

### Listar Tabelas Disponíveis
```bash
curl -X POST https://tewgloptmijuaychoxnq.supabase.co/functions/v1/backup-offsite \
  -H "Content-Type: application/json" \
  -d '{"action": "list-tables", "apiKey": "SUA_API_KEY"}'
```

---

## Configuração de Segredos

| Segredo | Descrição |
|---------|-----------|
| `BACKUP_DEST_SUPABASE_URL` | URL do projeto Supabase de destino |
| `BACKUP_DEST_SERVICE_ROLE_KEY` | Service role key do projeto de destino |
| `BACKUP_ENCRYPTION_KEY` | Chave AES-256 para criptografia (opcional) |
| `BACKUP_EXTERNAL_API_KEY` | API key para acesso externo |

---

## Backup Incremental

O sistema suporta backup incremental usando os campos `updated_at` ou `created_at` das tabelas.

**Funcionamento:**
1. Passar o parâmetro `since` com a data de referência
2. Sistema filtra registros com `updated_at >= since OR created_at >= since`
3. Retorna apenas os registros modificados após a data

**Periodicidade sugerida:**
- **Diário (completo)**: 1x ao dia às 03:00
- **Incremental**: A cada 4 horas
- **Semanal**: Domingo às 02:00 (arquivo separado)
- **Mensal**: Primeiro domingo do mês às 01:00

---

## Restauração

### JSON
```javascript
const backup = JSON.parse(fs.readFileSync('backup.json'));
for (const [table, rows] of Object.entries(backup.data)) {
  await supabase.from(table).upsert(rows);
}
```

### SQL
```bash
psql -h db.xxxxx.supabase.co -U postgres -d postgres -f backup.sql
```

### CSV
Importar cada CSV individualmente usando ferramentas como `\copy` do psql ou ferramentas de ETL.

---

## Verificação de Integridade

Cada backup gera um manifest com checksums SHA-256:

```json
{
  "files": {
    "db": {
      "path": "db/idjuv_prod_2026-01-26T12-00-00.json",
      "checksum": "sha256...",
      "encrypted": false
    }
  }
}
```

Use a ação `verify-integrity` para validar backups existentes.

---

## Agendamento Automático (Cron)

Para agendar backups automáticos, configure o pg_cron:

```sql
SELECT cron.schedule(
  'backup-diario',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url:='https://tewgloptmijuaychoxnq.supabase.co/functions/v1/backup-offsite',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer TOKEN"}'::jsonb,
    body:='{"action": "execute-backup", "backupType": "daily", "format": "json"}'::jsonb
  );
  $$
);
```

---

## Retenção

| Tipo | Retenção Padrão |
|------|-----------------|
| Diário | 7 dias |
| Semanal | 4 semanas |
| Mensal | 12 meses |

Use `cleanup-old-backups` para aplicar a política de retenção.

---

## Suporte

Em caso de dúvidas sobre o sistema de backup, contate a equipe de TI do IDJUV.
