
# Plano: Sistema de Acesso Modular por Usuário

## Resumo Executivo

O usuário deseja um sistema onde possa **autorizar módulos específicos diretamente para cada usuário**, ao invés de depender exclusivamente de perfis. Isso cria um controle granular onde um usuário pode ter acesso apenas a "RH" e "Federações", por exemplo, independentemente dos perfis que possui.

---

## Análise da Arquitetura Atual

O sistema atual possui:
1. **Permissões Institucionais**: 47 permissões na tabela `permissoes` (formato: `dominio.capacidade`)
2. **Perfis**: Agrupam permissões e são associados a usuários
3. **Módulos do Sistema**: 9 domínios (admin, workflow, compras, contratos, rh, orcamento, patrimonio, governanca, transparencia)
4. **Tabela `module_access_scopes`**: Já existe mas associa módulos a roles, não a usuários

### Problema Identificado
Atualmente, o acesso é concedido exclusivamente via **Perfis**. Não há como dizer: "Bruno tem acesso apenas ao módulo RH e Federações".

---

## Solução Proposta: Acesso Modular por Usuário

### Conceito

Criar uma camada de **restrição por módulo** diretamente no usuário:
- Por padrão, usuário SEM restrições = acessa tudo que seus perfis permitem
- Usuário COM restrições = só acessa módulos explicitamente liberados

```
Acesso Final = Permissões do Perfil ∩ Módulos Autorizados do Usuário
```

### Módulos do Sistema

| ID | Código | Nome | Rotas Principais |
|----|--------|------|------------------|
| 1 | admin | Administração | /admin/* |
| 2 | workflow | Processos | /workflow/* |
| 3 | compras | Compras | /processos/compras/* |
| 4 | contratos | Contratos | /processos/convenios/*, contratos/* |
| 5 | rh | Recursos Humanos | /rh/* |
| 6 | orcamento | Orçamento/Financeiro | /financeiro/*, /folha/* |
| 7 | patrimonio | Patrimônio/Inventário | /inventario/* |
| 8 | governanca | Governança | /governanca/*, /cargos/*, /lotacoes/* |
| 9 | transparencia | Transparência | /transparencia/* |
| 10 | unidades | Unidades Locais | /unidades-locais/* |
| 11 | federacoes | Federações Esportivas | /federacoes/* |
| 12 | ascom | Comunicação | /admin/ascom/* |
| 13 | programas | Programas Sociais | /programas/* |

---

## Alterações no Banco de Dados

### 1. Tabela de Módulos do Sistema (Catálogo)

```sql
CREATE TABLE public.modulos_sistema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  descricao TEXT,
  icone TEXT,
  cor TEXT,
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  prefixos_rota TEXT[],  -- ['/rh', '/rh/*']
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 2. Tabela de Acesso por Usuário

```sql
CREATE TABLE public.usuario_modulos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  modulo_id UUID REFERENCES public.modulos_sistema(id) ON DELETE CASCADE NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, modulo_id)
);
```

### 3. Flag de Restrição no Profile

Adicionar na tabela `profiles`:
```sql
ALTER TABLE public.profiles 
ADD COLUMN restringir_modulos BOOLEAN DEFAULT false;
```

- `restringir_modulos = false`: Usuário acessa tudo que seus perfis permitem
- `restringir_modulos = true`: Usuário só acessa módulos explicitamente listados em `usuario_modulos`

---

## Fluxo de Verificação

```
┌────────────────────────────────────────────────────────────────┐
│                    VERIFICAÇÃO DE ACESSO                        │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Usuário é Super Admin?                                      │
│     └── SIM → ACESSO TOTAL                                      │
│     └── NÃO → Continua                                          │
│                                                                 │
│  2. Usuário tem restringir_modulos = true?                      │
│     └── NÃO → Usa permissões normais do perfil                  │
│     └── SIM → Continua                                          │
│                                                                 │
│  3. O módulo da rota está em usuario_modulos?                   │
│     └── NÃO → ACESSO NEGADO                                     │
│     └── SIM → Verifica permissão específica                     │
│                                                                 │
│  4. Usuário tem permissão para a ação específica?               │
│     └── NÃO → ACESSO NEGADO                                     │
│     └── SIM → ACESSO PERMITIDO                                  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Alterações no Frontend

### 1. Hook `useModulosUsuario`

Novo hook para verificar módulos autorizados:

```typescript
interface ModuloAcesso {
  modulo_id: string;
  codigo: string;
  nome: string;
  ativo: boolean;
}

function useModulosUsuario() {
  const [modulos, setModulos] = useState<ModuloAcesso[]>([]);
  const [restringirModulos, setRestringirModulos] = useState(false);
  
  // Verificar se módulo está autorizado
  const temAcessoModulo = (codigo: string) => boolean;
  
  // Verificar se rota está em módulo autorizado
  const rotaAutorizada = (pathname: string) => boolean;
}
```

### 2. Atualização do AuthContext

Integrar verificação de módulos nas funções existentes:

```typescript
// Modificar hasPermission para considerar módulos
const hasPermission = (codigo: string): boolean => {
  // ... lógica existente ...
  
  // Se restringir_modulos está ativo, verificar módulo
  if (user.restringirModulos) {
    const modulo = getModuloFromPermissao(codigo);
    if (!user.modulosAutorizados.includes(modulo)) {
      return false;
    }
  }
  
  return true;
};
```

### 3. UI de Administração - Módulos do Usuário

Adicionar nova aba na tela de detalhes do usuário:

```
┌──────────────────────────────────────────────┐
│  USUÁRIO: Bruno Silva                        │
│  ─────────────────────────────────────────── │
│                                              │
│  [●] Restringir acesso por módulos           │
│                                              │
│  MÓDULOS AUTORIZADOS:                        │
│  ┌─────────────────────────────────────────┐ │
│  │ [✓] RH (Recursos Humanos)               │ │
│  │ [ ] Workflow (Processos)                │ │
│  │ [✓] Federações (Federações Esportivas)  │ │
│  │ [ ] Financeiro (Orçamento)              │ │
│  │ [ ] Governança                          │ │
│  │ ...                                     │ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  ⚠️ Com restrição ativa, Bruno só terá      │
│     acesso aos módulos marcados acima,      │
│     mesmo que seus perfis concedam mais.    │
└──────────────────────────────────────────────┘
```

---

## Arquivos a Criar/Modificar

### Novos Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `src/hooks/useModulosUsuario.ts` | Hook para gerenciar módulos do usuário |
| `src/hooks/useAdminModulos.ts` | Hook para admin de módulos |
| `src/components/admin/UsuarioModulosTab.tsx` | Tab de módulos na administração de usuários |
| `src/types/modulos.ts` | Tipos TypeScript para módulos |
| `supabase/migrations/xxx_modulos_usuario.sql` | Migração do banco |

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/contexts/AuthContext.tsx` | Adicionar verificação de módulos |
| `src/pages/admin/UsuariosAdminPage.tsx` | Adicionar aba de módulos |
| `src/hooks/useAdminUsuarios.ts` | Adicionar funções de módulos |
| `src/components/auth/ProtectedRoute.tsx` | Verificar módulo autorizado |

---

## Segurança (RLS)

### Políticas para `modulos_sistema`
- SELECT: Todos autenticados podem ver (catálogo público)
- INSERT/UPDATE/DELETE: Apenas super_admin

### Políticas para `usuario_modulos`
- SELECT: Super admin ou o próprio usuário
- INSERT/UPDATE/DELETE: Apenas super_admin ou admin.usuarios

---

## Exemplo de Uso

### Cenário: Bruno deve acessar apenas RH e Federações

1. Admin acessa `/admin/usuarios`
2. Clica no usuário "Bruno"
3. Ativa toggle "Restringir acesso por módulos"
4. Marca apenas: RH, Federações
5. Salva

### Resultado:
- Bruno tenta acessar `/rh/servidores` → **Permitido** (se perfil concede)
- Bruno tenta acessar `/federacoes` → **Permitido** (se perfil concede)
- Bruno tenta acessar `/admin/dashboard` → **Bloqueado** (módulo não autorizado)
- Bruno tenta acessar `/financeiro` → **Bloqueado** (módulo não autorizado)

---

## Benefícios da Solução

1. **Flexibilidade**: Combina perfis genéricos com restrições específicas
2. **Simplicidade**: Sem mudança na estrutura de perfis existente
3. **Retrocompatível**: Usuários existentes continuam funcionando (sem restrição)
4. **Auditável**: Registro de quem autorizou cada módulo
5. **Escalável**: Novos módulos podem ser adicionados ao catálogo

---

## Próximos Passos

1. Aprovar este plano
2. Criar migração do banco de dados
3. Implementar hooks e componentes
4. Integrar no AuthContext
5. Testar fluxo completo
