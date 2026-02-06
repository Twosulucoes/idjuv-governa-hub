
# Plano: Reset Total e Sistema Simplificado de 3 Perfis

## Resumo

Vamos eliminar toda a complexidade atual e criar um sistema com apenas **3 tipos de usuário**:

| Perfil | Acesso | Descrição |
|--------|--------|-----------|
| **Super Admin** | Tudo | Você - controle total |
| **Gestor** | Módulos selecionados + Aprovações | Pode aprovar processos + acessar módulos escolhidos |
| **Servidor** | Módulos selecionados | Apenas visualiza/opera nos módulos liberados |

---

## O Que Será Feito

### 1. Arquivar Tabelas Antigas (Backup)

Renomear todas as tabelas de RBAC para backup interno:

- `perfis` → `_backup_perfis`
- `perfil_funcoes` → `_backup_perfil_funcoes`
- `perfil_permissoes` → `_backup_perfil_permissoes`
- `funcoes_sistema` → `_backup_funcoes_sistema`
- `permissoes` → `_backup_permissoes`
- `usuario_perfis` → `_backup_usuario_perfis`

### 2. Criar Estrutura Nova e Simples

**Novo esquema:**

```text
profiles (usuários)
    |
usuario_perfis (1 perfil por usuário)
    |
perfis (apenas 3: super_admin, gestor, servidor)
    |
usuario_modulos (quais módulos cada usuário pode acessar)
```

**Tabela `perfis` (apenas 3 registros):**

| nome | codigo | pode_aprovar |
|------|--------|--------------|
| Super Administrador | super_admin | true |
| Gestor | gestor | true |
| Servidor | servidor | false |

**Nova tabela `usuario_modulos`:**

```sql
CREATE TABLE usuario_modulos (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  modulo TEXT NOT NULL, -- 'rh', 'financeiro', 'processos', etc.
  UNIQUE(user_id, modulo)
);
```

### 3. Desativar Todos os Usuários Exceto Você

- `UPDATE profiles SET is_active = false WHERE id != 'b53e0eea-bf59-4de9-b71e-5d36d3c69bb8'`
- Limpar todas as associações de perfis anteriores

### 4. Associar Você ao Super Admin

- Criar perfil Super Admin
- Associar seu usuário a ele
- Super Admin não precisa de módulos - tem acesso a tudo

### 5. Bloquear Novos Cadastros

- Trigger para novos usuários entrarem com `is_active = false`
- Tela de login mostra "Aguardando aprovação"

### 6. Simplificar Tela de Usuários

A tela de detalhes do usuário ficará com apenas 2 abas:

- **Perfil**: Escolher entre Gestor ou Servidor
- **Módulos**: Marcar quais módulos o usuário pode acessar (checkboxes simples)

---

## Interface Simplificada

### Tela de Gerenciamento de Usuário

```text
+--------------------------------------------------+
| João Silva (joao@email.com)          [Ativo ✓]   |
+--------------------------------------------------+
| Tipo: [Servidor ▼]  ou  [Gestor ▼]               |
+--------------------------------------------------+
| Módulos Liberados:                               |
|                                                  |
| [✓] Recursos Humanos (RH)                        |
| [✓] Processos / Workflow                         |
| [ ] Financeiro / Orçamento                       |
| [ ] Governança                                   |
| [ ] Contratos                                    |
| [ ] Patrimônio                                   |
| [ ] Compras                                      |
| [ ] Transparência                                |
| [ ] Administração                                |
+--------------------------------------------------+
```

---

## Seção Técnica

### Migrações SQL

**Migração 1 - Backup e Reset:**

```sql
-- Arquivar tabelas antigas
ALTER TABLE IF EXISTS perfis RENAME TO _backup_perfis;
ALTER TABLE IF EXISTS perfil_funcoes RENAME TO _backup_perfil_funcoes;
ALTER TABLE IF EXISTS perfil_permissoes RENAME TO _backup_perfil_permissoes;
ALTER TABLE IF EXISTS funcoes_sistema RENAME TO _backup_funcoes_sistema;
ALTER TABLE IF EXISTS permissoes RENAME TO _backup_permissoes;
ALTER TABLE IF EXISTS usuario_perfis RENAME TO _backup_usuario_perfis;

-- Criar novos perfis (apenas 3)
CREATE TABLE perfis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  codigo TEXT UNIQUE NOT NULL,
  pode_aprovar BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO perfis (nome, codigo, pode_aprovar) VALUES
  ('Super Administrador', 'super_admin', true),
  ('Gestor', 'gestor', true),
  ('Servidor', 'servidor', false);

-- Associação usuário-perfil (1:1)
CREATE TABLE usuario_perfis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  perfil_id UUID REFERENCES perfis(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Módulos por usuário
CREATE TABLE usuario_modulos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  modulo TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, modulo)
);

-- RLS
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_modulos ENABLE ROW LEVEL SECURITY;
```

**Migração 2 - Configurar Seu Usuário:**

```sql
-- Desativar todos exceto você
UPDATE profiles SET is_active = false WHERE id != 'b53e0eea-bf59-4de9-b71e-5d36d3c69bb8';

-- Associar você ao Super Admin
INSERT INTO usuario_perfis (user_id, perfil_id)
SELECT 
  'b53e0eea-bf59-4de9-b71e-5d36d3c69bb8',
  id
FROM perfis WHERE codigo = 'super_admin';
```

**Migração 3 - Bloquear Novos Cadastros:**

```sql
CREATE OR REPLACE FUNCTION bloquear_novo_usuario()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_active := false;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_bloquear_novo_usuario
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION bloquear_novo_usuario();
```

### Funções SQL Simplificadas

```sql
-- Verificar se é super admin
CREATE OR REPLACE FUNCTION usuario_eh_super_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM usuario_perfis up
    JOIN perfis p ON p.id = up.perfil_id
    WHERE up.user_id = check_user_id AND p.codigo = 'super_admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Verificar se pode acessar módulo
CREATE OR REPLACE FUNCTION usuario_pode_acessar_modulo(check_user_id UUID, check_modulo TEXT)
RETURNS BOOLEAN AS $$
  SELECT 
    usuario_eh_super_admin(check_user_id) 
    OR EXISTS (
      SELECT 1 FROM usuario_modulos 
      WHERE user_id = check_user_id AND modulo = check_modulo
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Verificar se pode aprovar
CREATE OR REPLACE FUNCTION usuario_pode_aprovar(check_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM usuario_perfis up
    JOIN perfis p ON p.id = up.perfil_id
    WHERE up.user_id = check_user_id AND p.pode_aprovar = true
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

### Arquivos Frontend a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/admin/UsuarioDetalhePage.tsx` | Simplificar para 2 abas: Perfil + Módulos (editáveis) |
| `src/contexts/AuthContext.tsx` | Simplificar verificação de permissões |
| `src/hooks/useAdminUsuarios.ts` | Adicionar funções para gerenciar módulos |
| `src/components/admin/UsuarioModulosTab.tsx` | Trocar para checkboxes editáveis |

### Arquivos a Remover/Ignorar

- `src/components/admin/UsuarioFuncoesTab.tsx` (não será mais necessário)
- `src/hooks/useAdminPerfis.ts` (simplificar drasticamente)
- `src/hooks/useAdminPermissoes.ts` (não será mais necessário)
- Páginas de gestão de perfis complexas

### Lista de Módulos

| Código | Nome |
|--------|------|
| `rh` | Recursos Humanos |
| `workflow` | Processos |
| `financeiro` | Financeiro |
| `orcamento` | Orçamento |
| `governanca` | Governança |
| `contratos` | Contratos |
| `patrimonio` | Patrimônio |
| `compras` | Compras |
| `transparencia` | Transparência |
| `admin` | Administração |

### Verificação de Acesso no Frontend

```typescript
// Novo hook simplificado
function useModulos() {
  const { user } = useAuth();
  
  // Super admin acessa tudo
  const isSuperAdmin = user?.perfil === 'super_admin';
  
  // Verificar módulo
  const podeAcessar = (modulo: string) => {
    if (isSuperAdmin) return true;
    return user?.modulos?.includes(modulo);
  };
  
  // Verificar se pode aprovar
  const podeAprovar = user?.perfil === 'super_admin' || user?.perfil === 'gestor';
  
  return { podeAcessar, podeAprovar, isSuperAdmin };
}
```
