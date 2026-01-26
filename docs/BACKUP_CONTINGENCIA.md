# Sistema de Backup e Contingência Externa - IDJUV

## Visão Geral

O sistema de backup foi projetado para garantir **redundância total** dos dados do IDJUV, permitindo operação e leitura dos dados fora da plataforma Lovable em caso de indisponibilidade.

---

## Tabelas Incluídas (83 tabelas)

### Usuários e Permissões (11 tabelas)
- `profiles`, `user_roles`, `user_permissions`, `user_org_units`, `user_security_settings`
- `role_permissions`, `module_access_scopes`, `perfis`, `funcoes_sistema`, `perfil_funcoes`, `usuario_perfis`

### Estrutura Organizacional (5 tabelas)
- `estrutura_organizacional`, `cargos`, `composicao_cargos`, `cargo_unidade_compatibilidade`, `centros_custo`

### Servidores e RH (15 tabelas)
- `servidores`, `lotacoes`, `memorandos_lotacao`, `historico_funcional`, `portarias_servidor`
- `ocorrencias_servidor`, `ferias_servidor`, `licencas_afastamentos`, `cessoes`, `designacoes`
- `provimentos`, `vinculos_funcionais`, `dependentes_irrf`, `pensoes_alimenticias`, `consignacoes`

### Pré-Cadastros (1 tabela)
- `pre_cadastros`

### Ponto e Frequência (10 tabelas)
- `configuracao_jornada`, `horarios_jornada`, `registros_ponto`, `justificativas_ponto`
- `solicitacoes_ajuste_ponto`, `banco_horas`, `lancamentos_banco_horas`, `frequencia_mensal`, `feriados`, `viagens_diarias`

### Folha de Pagamento (17 tabelas)
- `folhas_pagamento`, `lancamentos_folha`, `fichas_financeiras`, `itens_ficha_financeira`
- `rubricas`, `rubricas_historico`, `parametros_folha`, `tabela_inss`, `tabela_irrf`
- `eventos_esocial`, `exportacoes_folha`, `bancos_cnab`, `contas_autarquia`
- `remessas_bancarias`, `retornos_bancarios`, `itens_retorno_bancario`, `config_autarquia`

### Unidades Locais (6 tabelas)
- `unidades_locais`, `agenda_unidade`, `documentos_cedencia`, `termos_cessao`
- `patrimonio_unidade`, `nomeacoes_chefe_unidade`

### Federações Esportivas (2 tabelas)
- `federacoes_esportivas`, `calendario_federacao`

### Documentos e Aprovações (3 tabelas)
- `documentos`, `approval_requests`, `approval_delegations`

### Reuniões (5 tabelas)
- `reunioes`, `participantes_reuniao`, `config_assinatura_reuniao`
- `modelos_mensagem_reuniao`, `historico_convites_reuniao`

### Demandas ASCOM (4 tabelas)
- `demandas_ascom`, `demandas_ascom_anexos`, `demandas_ascom_comentarios`, `demandas_ascom_entregaveis`

### Auditoria e Backup (4 tabelas)
- `audit_logs`, `backup_config`, `backup_history`, `backup_integrity_checks`

---

## Verificação de Backup 100%

Após cada backup, o sistema gera um **manifest** com detalhes completos:

### Como verificar se o backup está completo:

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
   - Confira `tables.exported === 83`
   - Confira `tables.list` para ver todas as tabelas

4. **Via API:**
   ```bash
   # Listar tabelas disponíveis
   curl -X POST https://tewgloptmijuaychoxnq.supabase.co/functions/v1/backup-offsite \
     -d '{"action": "list-tables"}'
   ```

---

## Formatos de Exportação

### 1. JSON (padrão)
```json
{
  "exported_at": "2026-01-26T12:00:00.000Z",
  "system_version": "2.0.0",
  "tables_count": 83,
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
  "tables": {
    "servidores": "id,nome_completo,cpf\n\"uuid-1\",\"NOME\",\"123.456.789-00\"",
    "documentos": "id,numero,tipo\n\"uuid-2\",\"001/2026\",\"portaria\""
  }
}
```

### 3. SQL PostgreSQL
```sql
-- ============================================
-- BACKUP COMPLETO IDJUV
-- Gerado em: 2026-01-26T12:00:00.000Z
-- Tabelas: 83
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
  -d '{"action": "list-tables"}'
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
