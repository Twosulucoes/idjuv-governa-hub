# 🚀 Backup Completo do Banco de Dados - IDJuv

**Data de Geração:** 2026-02-08  
**Versão do Sistema:** IDJuv 2.0

---

## 📊 Estatísticas do Backup

| Componente | Quantidade |
|------------|------------|
| **Tabelas** | 160+ |
| **ENUMs (Tipos)** | 60+ |
| **Funções** | 100+ |
| **Views** | 12 |
| **Políticas RLS** | 288+ |

---

## 📁 Arquivos Incluídos

Execute **NA ORDEM** para restaurar o banco:

| # | Arquivo | Descrição |
|---|---------|-----------|
| 1 | `01_extensoes.sql` | Extensões do PostgreSQL |
| 2 | `02_enums.sql` | Todos os tipos ENUM |
| 3 | `03_tabelas.sql` | Estrutura de todas as tabelas |
| 4 | `04_funcoes.sql` | Funções PL/pgSQL do sistema |
| 5 | `05_views.sql` | Views do sistema |
| 6 | `06_rls_enable.sql` | Habilitar RLS em todas tabelas |
| 7 | `07_rls_policies.sql` | Todas as políticas de segurança |
| 8 | `08_triggers.sql` | Triggers automáticos |
| 9 | `09_dados_iniciais.sql` | Dados de configuração base |
| 10 | `10_script_exportar_dados.sql` | Script para exportar dados existentes |

---

## 🔧 Passo a Passo

### Etapa 1: Criar Projeto Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Anote a **Project URL** e **Service Role Key**

### Etapa 2: Executar Scripts

No **SQL Editor** do novo projeto, execute cada arquivo na ordem numérica.

```bash
# Via psql (alternativa)
psql -h db.PROJETO.supabase.co -U postgres -d postgres -f 01_extensoes.sql
psql -h db.PROJETO.supabase.co -U postgres -d postgres -f 02_enums.sql
# ... continuar na ordem
```

### Etapa 3: Exportar Dados do Lovable Cloud

Execute o script `10_script_exportar_dados.sql` no SQL Editor do Lovable Cloud para gerar os INSERTs.

### Etapa 4: Importar Dados

Copie os INSERTs gerados e execute no novo Supabase.

---

## ⚠️ Notas Importantes

### Autenticação
- Usuários precisarão criar novas senhas
- Dados de `profiles` são migrados, mas `auth.users` é gerenciado pelo Supabase

### Edge Functions
- Copie `supabase/functions/` para o novo projeto
- Execute `supabase functions deploy`

### Storage
- Buckets devem ser recriados manualmente
- Transfira arquivos separadamente

---

## 📞 Suporte

Para dúvidas sobre migração:
- [Documentação Supabase](https://supabase.com/docs)
- [Guia de Migração](https://supabase.com/docs/guides/platform/migrating-to-supabase)

---

*Backup gerado automaticamente pelo sistema IDJuv*
