# Guia de Migração para Supabase Próprio

## 📋 Visão Geral

Este documento descreve como migrar o sistema IDJuv do Lovable Cloud para um Supabase próprio, garantindo independência total sobre banco de dados, autenticação e permissões.

---

## 🏗️ Estrutura Atual do Banco de Dados

### Estatísticas
- **Total de tabelas**: 88 tabelas
- **Migrations aplicadas**: 62 arquivos
- **Project ID atual**: `tewgloptmijuaychoxnq`

### Módulos Principais

| Módulo | Tabelas | Descrição |
|--------|---------|-----------|
| **RH/Servidores** | `servidores`, `cargos`, `lotacoes`, `vinculos_funcionais`, `provimentos`, `designacoes` | Gestão de recursos humanos |
| **Estrutura** | `estrutura_organizacional`, `composicao_cargos`, `unidades_locais` | Organograma e unidades |
| **Financeiro** | `folhas_pagamento`, `fichas_financeiras`, `rubricas`, `consignacoes`, `bancos_cnab` | Folha de pagamento |
| **Documentos** | `documentos`, `portarias_servidor`, `memorandos_lotacao` | Gestão documental |
| **Permissões** | `perfis`, `funcoes_sistema`, `perfil_funcoes`, `usuario_perfis` | Controle de acesso |
| **Autenticação** | `profiles`, `user_roles`, `user_permissions` | Usuários e sessões |
| **Auditoria** | `audit_logs`, `backup_config`, `backup_history` | Logs e backups |

---

## 📊 Tabelas Críticas (Detalhamento)

### 1. Sistema de Permissões

```sql
-- Perfis de acesso
CREATE TABLE public.perfis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL UNIQUE,
  codigo VARCHAR(50) NOT NULL UNIQUE,
  descricao TEXT,
  nivel_hierarquia INTEGER NOT NULL DEFAULT 0,
  perfil_pai_id UUID REFERENCES public.perfis(id),
  ativo BOOLEAN NOT NULL DEFAULT true,
  sistema BOOLEAN NOT NULL DEFAULT false,
  cor VARCHAR(20),
  icone VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Funções/Permissões do sistema
CREATE TABLE public.funcoes_sistema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(100) NOT NULL UNIQUE,
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  modulo VARCHAR(100) NOT NULL,
  submodulo VARCHAR(100),
  tipo_acao VARCHAR(50) NOT NULL DEFAULT 'visualizar',
  funcao_pai_id UUID REFERENCES public.funcoes_sistema(id),
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  rota VARCHAR(255),
  icone VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Associação Perfil <-> Funções
CREATE TABLE public.perfil_funcoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
  funcao_id UUID NOT NULL REFERENCES public.funcoes_sistema(id) ON DELETE CASCADE,
  concedido BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE(perfil_id, funcao_id)
);

-- Associação Usuário <-> Perfis
CREATE TABLE public.usuario_perfis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  perfil_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fim DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE(user_id, perfil_id)
);
```

### 2. Profiles (Extensão de auth.users)

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  cpf TEXT UNIQUE,
  tipo_usuario tipo_usuario DEFAULT 'servidor',
  servidor_id UUID REFERENCES public.servidores(id),
  is_active BOOLEAN DEFAULT true,
  blocked_at TIMESTAMPTZ,
  blocked_reason TEXT,
  requires_password_change BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 3. Servidores

```sql
CREATE TABLE public.servidores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo TEXT NOT NULL,
  cpf VARCHAR(14) NOT NULL UNIQUE,
  matricula TEXT UNIQUE,
  email TEXT,
  telefone TEXT,
  data_nascimento DATE,
  situacao situacao_servidor NOT NULL DEFAULT 'ativo',
  tipo tipo_servidor,
  vinculo vinculo_servidor,
  cargo_atual_id UUID REFERENCES public.cargos(id),
  unidade_atual_id UUID REFERENCES public.estrutura_organizacional(id),
  data_admissao DATE,
  -- ... muitos outros campos
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🔐 Políticas RLS (Row Level Security)

### Padrão de Segurança Atual

```sql
-- Todos autenticados podem ler
CREATE POLICY "Authenticated users can read"
  ON public.tabela FOR SELECT
  TO authenticated
  USING (true);

-- Apenas admins podem modificar
CREATE POLICY "Only admins can modify"
  ON public.tabela FOR ALL
  TO authenticated
  USING (public.usuario_eh_admin(auth.uid()))
  WITH CHECK (public.usuario_eh_admin(auth.uid()));
```

### Funções de Verificação

```sql
-- Verifica se usuário é admin
CREATE OR REPLACE FUNCTION public.usuario_eh_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuario_perfis up
    JOIN public.perfis p ON up.perfil_id = p.id
    WHERE up.user_id = check_user_id
      AND up.ativo = true
      AND p.codigo IN ('super_admin', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verifica permissão específica
CREATE OR REPLACE FUNCTION public.usuario_tem_permissao(
  check_user_id UUID, 
  codigo_funcao VARCHAR
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuario_perfis up
    JOIN public.perfil_funcoes pf ON up.perfil_id = pf.perfil_id
    JOIN public.funcoes_sistema f ON pf.funcao_id = f.id
    WHERE up.user_id = check_user_id
      AND up.ativo = true
      AND pf.concedido = true
      AND f.codigo = codigo_funcao
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🚀 Plano de Migração em 5 Etapas

### Etapa 1: Preparação (Agora)
- [x] Documentar estrutura atual
- [ ] Criar conta no [supabase.com](https://supabase.com)
- [ ] Criar novo projeto Supabase

### Etapa 2: Exportar Schema
```bash
# No terminal do seu Supabase próprio, execute:
# 1. Crie o projeto
# 2. Acesse SQL Editor
# 3. Execute o schema abaixo
```

### Etapa 3: Configurar Variáveis
```env
# .env.local (para desenvolvimento)
VITE_SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua_anon_key
VITE_SUPABASE_PROJECT_ID=SEU_PROJECT_ID
```

### Etapa 4: Migrar Dados
```sql
-- Exportar dados do Lovable Cloud
-- (Execute no SQL Editor do Lovable Cloud - quando disponível)
-- Ou use as ferramentas de export do Supabase Dashboard
```

### Etapa 5: Atualizar Código
```typescript
// src/integrations/supabase/client.ts
// Este arquivo será atualizado automaticamente quando você
// conectar seu próprio Supabase via Settings > Connectors
```

---

## 📁 Arquivos Importantes para Migração

| Arquivo | Descrição |
|---------|-----------|
| `public/disaster-recovery/schema-completo.sql` | Schema SQL completo |
| `supabase/migrations/*.sql` | Histórico de migrações |
| `src/integrations/supabase/types.ts` | Tipos TypeScript gerados |
| `src/types/perfis.ts` | Tipos do sistema de permissões |
| `src/contexts/AuthContext.tsx` | Contexto de autenticação |

---

## ⚠️ Limitações Importantes

1. **Lovable Cloud não pode ser desconectado** após habilitado
2. **Migração requer**: novo projeto + exportação manual de dados
3. **Autenticação**: usuários precisarão criar novas senhas no novo sistema

---

## 🔄 Estratégia Híbrida (Recomendada)

Para transição gradual:

1. **Fase 1**: Mantenha Lovable Cloud para desenvolvimento
2. **Fase 2**: Configure Supabase próprio em paralelo
3. **Fase 3**: Implemente feature flags para alternar entre ambos
4. **Fase 4**: Migre gradualmente funcionalidades críticas
5. **Fase 5**: Desative Lovable Cloud (requer novo deploy fora do Lovable)

---

## 📞 Próximos Passos

1. Crie seu projeto no [supabase.com](https://supabase.com)
2. Exporte o schema usando o arquivo `schema-completo.sql`
3. Me avise quando estiver pronto para configurar a conexão

---

*Documento gerado em: 25/01/2026*
*Versão: 1.0*
