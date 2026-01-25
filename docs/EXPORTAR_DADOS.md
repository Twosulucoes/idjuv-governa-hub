# Guia de Exportação de Dados

## 📋 Visão Geral

Este guia explica como exportar os dados do Lovable Cloud para migrar para seu Supabase próprio.

---

## 🔄 Opção 1: Exportação via SQL (Recomendado)

### Passo 1: Acessar o Backend

```
<presentation-actions>
  <presentation-open-backend>Abrir Backend</presentation-open-backend>
</presentation-actions>
```

### Passo 2: Executar Queries de Exportação

Para cada tabela, execute:

```sql
-- Exportar Perfis
SELECT * FROM public.perfis;

-- Exportar Funções do Sistema
SELECT * FROM public.funcoes_sistema;

-- Exportar Perfil-Funções
SELECT * FROM public.perfil_funcoes;

-- Exportar Servidores (dados mais importantes)
SELECT * FROM public.servidores;

-- Exportar Cargos
SELECT * FROM public.cargos;

-- Exportar Estrutura Organizacional
SELECT * FROM public.estrutura_organizacional;
```

### Passo 3: Copiar Resultados

Os resultados podem ser copiados como CSV ou JSON para importação posterior.

---

## 🔄 Opção 2: Usando a Edge Function de Schema

O sistema possui uma edge function que lista toda a estrutura:

```bash
# Chamar a edge function
curl -X GET \
  'https://tewgloptmijuaychoxnq.supabase.co/functions/v1/database-schema' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

---

## 🔄 Opção 3: Script de Migração (Automatizado)

Quando você tiver seu Supabase próprio configurado, podemos criar um script que:

1. Conecta aos dois bancos
2. Exporta tabela por tabela
3. Importa no destino
4. Valida integridade

---

## 📊 Ordem de Migração (Importante!)

Devido às foreign keys, migre nesta ordem:

1. **Tabelas Base** (sem FK)
   - `cargos`
   - `perfis`
   - `funcoes_sistema`

2. **Tabelas com FK simples**
   - `estrutura_organizacional`
   - `perfil_funcoes`

3. **Tabelas de Usuários**
   - `auth.users` (via Supabase Auth)
   - `profiles`
   - `usuario_perfis`

4. **Tabelas de RH**
   - `servidores`
   - `lotacoes`
   - `designacoes`
   - `provimentos`

5. **Tabelas Financeiras**
   - `rubricas`
   - `folhas_pagamento`
   - `fichas_financeiras`

6. **Tabelas de Documentos**
   - `documentos`
   - `portarias_servidor`

7. **Tabelas de Auditoria**
   - `audit_logs`
   - `backup_history`

---

## ⚠️ Considerações Importantes

### Usuários e Autenticação

Os usuários do `auth.users` **não podem ser exportados diretamente** com senhas.
Opções:
1. Pedir que usuários redefinam senhas no novo sistema
2. Usar Magic Links para primeiro acesso
3. Implementar migração via API do Supabase Auth

### UUIDs

Os IDs (UUID) serão preservados, mantendo a integridade referencial.

### Timestamps

Os campos `created_at` e `updated_at` serão preservados com seus valores originais.

---

## 📞 Próximos Passos

1. Crie seu projeto no [supabase.com](https://supabase.com)
2. Execute o schema de `docs/SCHEMA_SUPABASE_PROPRIO.sql`
3. Me avise para criarmos o script de migração automatizado

---

*Documento gerado em: 25/01/2026*
