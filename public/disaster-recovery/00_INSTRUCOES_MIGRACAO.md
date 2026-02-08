# 🚀 Guia Completo de Migração para Supabase Próprio

## Visão Geral

Este pacote contém todos os arquivos necessários para migrar o sistema IDJuv do Lovable Cloud para um projeto Supabase próprio.

---

## 📋 Pré-requisitos

1. **Conta no Supabase**: [supabase.com](https://supabase.com)
2. **Novo projeto criado** no Supabase Dashboard
3. **Acesso ao SQL Editor** do seu novo projeto
4. **Hospedagem externa** (Vercel, Netlify, ou servidor próprio)

---

## 📁 Arquivos Inclusos

| Arquivo | Descrição |
|---------|-----------|
| `01_enums.sql` | Tipos ENUM do PostgreSQL |
| `02_tabelas.sql` | Criação de todas as tabelas |
| `03_funcoes.sql` | Funções PL/pgSQL |
| `04_triggers.sql` | Triggers automáticos |
| `05_rls_policies.sql` | Políticas de Row Level Security |
| `06_dados_iniciais.sql` | Dados essenciais (perfis, funções) |
| `exportar_dados.sql` | Script para exportar dados existentes |

---

## 🔧 Passo a Passo da Migração

### Etapa 1: Criar Projeto Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Clique em "New Project"
3. Escolha um nome e região (recomendado: São Paulo)
4. Guarde a **senha do banco** e **Project URL**

### Etapa 2: Executar Scripts SQL

No **SQL Editor** do seu novo projeto, execute **na ordem**:

```bash
# 1. Primeiro os tipos ENUM
01_enums.sql

# 2. Depois as tabelas
02_tabelas.sql

# 3. Funções do sistema
03_funcoes.sql

# 4. Triggers automáticos
04_triggers.sql

# 5. Políticas de segurança
05_rls_policies.sql

# 6. Dados iniciais
06_dados_iniciais.sql
```

### Etapa 3: Exportar Dados do Lovable Cloud

Acesse o backend do Lovable Cloud (**Settings → Connectors → View Backend**) e execute o script `exportar_dados.sql` para gerar os INSERTs dos dados existentes.

### Etapa 4: Importar Dados

Execute os INSERTs gerados no SQL Editor do seu novo Supabase.

### Etapa 5: Configurar Ambiente

Crie um arquivo `.env.production` no seu projeto:

```env
VITE_SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua_anon_key_aqui
VITE_SUPABASE_PROJECT_ID=SEU_PROJECT_ID
```

### Etapa 6: Deploy Externo

```bash
# Build do projeto
npm run build

# Deploy para Vercel
npx vercel deploy --prod

# OU para Netlify
npx netlify deploy --prod --dir=dist
```

---

## ⚠️ Considerações Importantes

### Autenticação de Usuários

- Usuários precisarão **criar novas senhas** no novo sistema
- Os dados de `profiles` serão migrados, mas a autenticação em `auth.users` é gerenciada pelo Supabase

### Edge Functions

- Copie os arquivos de `supabase/functions/` para o novo projeto
- Execute `supabase functions deploy` para cada função

### Storage

- Buckets de storage precisam ser recriados manualmente
- Arquivos devem ser transferidos separadamente

---

## 📊 Estatísticas do Banco

- **Total de tabelas**: 140+
- **Total de ENUMs**: 50+
- **Total de funções**: 100+
- **Total de políticas RLS**: 200+

---

## 🔐 Segurança

- Todas as tabelas possuem RLS habilitado
- Funções críticas usam `SECURITY DEFINER`
- Políticas seguem o princípio do menor privilégio

---

## 📞 Suporte

Para dúvidas sobre a migração, consulte:
- [Documentação Supabase](https://supabase.com/docs)
- [Guia de Migração Supabase](https://supabase.com/docs/guides/platform/migrating-to-supabase)

---

*Gerado em: 08/02/2026*
*Versão do Sistema: IDJuv 2.0*
