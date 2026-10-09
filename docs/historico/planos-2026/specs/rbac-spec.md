# 📋 Especificação Técnica: Autenticação e RBAC (Role-Based Access Control)

## Decisão de Arquitetura
**Abordagem:** Real-Time Lookup (Direct Tables Lookup) com Cache de Contexto  
**Motivo:** Garantir revogação de acesso instantânea, evitar complexidade de sincronização JWT, e otimizar performance.

---

## 1. Modelagem de Dados

### Enums
```sql
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'user');
CREATE TYPE public.app_module AS ENUM ('rh', 'financeiro', 'compras', 'patrimonio', 'contratos', 'workflow', 'governanca', 'transparencia', 'comunicacao', 'programas', 'gestores_escolares', 'integridade', 'admin');
```

### Tabelas Principais

#### profiles
```sql
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  avatar_url text,
  is_active boolean DEFAULT true, -- Master Switch de acesso
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### user_roles (1 role por usuário)
```sql
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id),
  CONSTRAINT unique_user_role UNIQUE (user_id) -- 1 role por usuário
);
```

#### user_modules (N módulos por usuário)
```sql
CREATE TABLE public.user_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  module app_module NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id),
  CONSTRAINT unique_user_module UNIQUE (user_id, module)
);
```

---

## 2. Índices de Performance (CRÍTICO)

```sql
-- Partial index para usuários ativos
CREATE INDEX idx_profiles_active ON public.profiles(id) WHERE is_active = true;

-- Composite index para lookup de roles
CREATE INDEX idx_user_roles_lookup ON public.user_roles(user_id, role);

-- Composite index para lookup de módulos
CREATE INDEX idx_user_modules_lookup ON public.user_modules(user_id, module);
```

---

## 3. Funções de Segurança (SECURITY DEFINER)

### 3.1 Cache de Contexto (1 query por request)
```sql
CREATE OR REPLACE FUNCTION public.user_context()
RETURNS TABLE(is_active boolean, roles app_role[], modules app_module[])
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT 
    COALESCE(p.is_active, false),
    COALESCE(array_agg(DISTINCT ur.role) FILTER (WHERE ur.role IS NOT NULL), '{}'::app_role[]),
    COALESCE(array_agg(DISTINCT um.module) FILTER (WHERE um.module IS NOT NULL), '{}'::app_module[])
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON ur.user_id = p.id
  LEFT JOIN public.user_modules um ON um.user_id = p.id
  WHERE p.id = auth.uid()
  GROUP BY p.is_active;
$$;
```

### 3.2 Helpers Otimizados
```sql
-- Verificar se usuário está ativo
CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE((SELECT is_active FROM public.user_context()), false);
$$;

-- Verificar role
CREATE OR REPLACE FUNCTION public.has_role(_role public.app_role)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT _role = ANY(COALESCE((SELECT roles FROM public.user_context()), '{}'::app_role[]));
$$;

-- Verificar módulo
CREATE OR REPLACE FUNCTION public.has_module(_module public.app_module)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT _module = ANY(COALESCE((SELECT modules FROM public.user_context()), '{}'::app_module[]));
$$;

-- Helper combinado para RLS
CREATE OR REPLACE FUNCTION public.can_access_module(_module public.app_module)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT public.is_active_user() 
    AND (public.has_role('admin') OR public.has_module(_module));
$$;
```

---

## 4. Padrão de RLS (Políticas Granulares)

### Padrão para TODAS as tabelas:
```sql
ALTER TABLE nome_tabela ENABLE ROW LEVEL SECURITY;
ALTER TABLE nome_tabela FORCE ROW LEVEL SECURITY;

-- SELECT (Leitura)
CREATE POLICY "select_nome_tabela" ON nome_tabela
FOR SELECT
USING (
  is_active_user() 
  AND (has_role('admin') OR has_module('modulo_relevante'))
);

-- INSERT (Criação)
CREATE POLICY "insert_nome_tabela" ON nome_tabela
FOR INSERT
WITH CHECK (
  is_active_user()
  AND has_module('modulo_relevante')
);

-- UPDATE (Edição)
CREATE POLICY "update_nome_tabela" ON nome_tabela
FOR UPDATE
USING (
  is_active_user() 
  AND (has_role('admin') OR has_module('modulo_relevante'))
)
WITH CHECK (
  is_active_user() 
  AND (has_role('admin') OR has_module('modulo_relevante'))
);

-- DELETE (Remoção - apenas admin)
CREATE POLICY "delete_nome_tabela" ON nome_tabela
FOR DELETE
USING (
  is_active_user() 
  AND has_role('admin')
);
```

---

## 5. RLS para Tabelas de Permissão

### profiles
```sql
-- Qualquer autenticado pode ver perfis
CREATE POLICY "select_profiles" ON public.profiles
FOR SELECT TO authenticated
USING (true);

-- Apenas o próprio usuário ou admin pode editar
CREATE POLICY "update_profiles" ON public.profiles
FOR UPDATE TO authenticated
USING (id = auth.uid() OR has_role('admin'))
WITH CHECK (id = auth.uid() OR has_role('admin'));

-- Apenas admin pode inserir/deletar
CREATE POLICY "insert_profiles" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (has_role('admin') OR id = auth.uid());

CREATE POLICY "delete_profiles" ON public.profiles
FOR DELETE TO authenticated
USING (has_role('admin'));
```

### user_roles e user_modules
```sql
-- Apenas admin pode gerenciar roles e módulos
CREATE POLICY "admin_manage_roles" ON public.user_roles
FOR ALL TO authenticated
USING (has_role('admin'))
WITH CHECK (has_role('admin'));

CREATE POLICY "admin_manage_modules" ON public.user_modules
FOR ALL TO authenticated
USING (has_role('admin'))
WITH CHECK (has_role('admin'));

-- Usuários podem ver suas próprias permissões
CREATE POLICY "view_own_roles" ON public.user_roles
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "view_own_modules" ON public.user_modules
FOR SELECT TO authenticated
USING (user_id = auth.uid());
```

---

## 6. Trigger de Onboarding

```sql
-- Criar profile automaticamente no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    true
  );
  
  -- Inserir role padrão 'user'
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

---

## 7. Auditoria (Integrar com audit_logs existente)

```sql
-- Trigger para auditar mudanças em permissões
CREATE OR REPLACE FUNCTION public.audit_permission_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    action,
    entity_type,
    entity_id,
    before_data,
    after_data,
    user_id,
    description
  )
  VALUES (
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'create'
      WHEN TG_OP = 'UPDATE' THEN 'update'
      WHEN TG_OP = 'DELETE' THEN 'delete'
    END::audit_action,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id)::text,
    CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) END,
    auth.uid(),
    'Alteração em ' || TG_TABLE_NAME
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Aplicar triggers
CREATE TRIGGER audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_permission_changes();

CREATE TRIGGER audit_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_permission_changes();

CREATE TRIGGER audit_user_modules
  AFTER INSERT OR UPDATE OR DELETE ON public.user_modules
  FOR EACH ROW EXECUTE FUNCTION public.audit_permission_changes();
```

---

## 8. Testes Obrigatórios

```sql
-- Teste 1: Performance (deve executar em < 50ms)
EXPLAIN ANALYZE SELECT * FROM user_context();

-- Teste 2: Revogação instantânea
UPDATE profiles SET is_active = false WHERE id = 'test-user';
-- Tentar acessar imediatamente (deve falhar SEM relogin)

-- Teste 3: Verificar cache
SELECT is_active_user(), has_role('admin'), has_module('rh');

-- Teste 4: Auditoria
SELECT * FROM audit_logs 
WHERE entity_type IN ('profiles', 'user_roles', 'user_modules')
ORDER BY timestamp DESC LIMIT 10;
```

---

## 9. Checklist de Implementação

- [ ] Criar Enums `app_role` e `app_module`
- [ ] Criar tabelas `profiles`, `user_roles`, `user_modules`
- [ ] Criar índices de performance
- [ ] Criar função `user_context()` e helpers
- [ ] Habilitar RLS com FORCE em todas as tabelas
- [ ] Criar policies granulares (SELECT/INSERT/UPDATE/DELETE)
- [ ] Criar trigger `handle_new_user()` para onboarding
- [ ] Criar triggers de auditoria
- [ ] Testar performance com EXPLAIN ANALYZE
- [ ] Testar revogação instantânea
- [ ] Testar que usuário comum não consegue escalar privilégios
