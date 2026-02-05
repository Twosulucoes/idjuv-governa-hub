
# Plano: Sistema de Gerenciamento de Senhas

## Resumo

Implementar funcionalidades para:
1. **Admin pode resetar senha de qualquer usuário** (via edge function existente)
2. **Usuário pode alterar sua própria senha** (nova página "Meu Perfil")
3. **Forçar troca de senha no primeiro acesso** (após reset pelo admin)

---

## Fluxos de Uso

```text
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO 1: ADMIN RESETA SENHA                  │
├─────────────────────────────────────────────────────────────────┤
│  Admin → Usuários → Seleciona Usuário → Resetar Senha           │
│                            ↓                                     │
│          Sistema gera senha temporária (12 caracteres)          │
│                            ↓                                     │
│           Modal exibe senha para admin copiar/anotar            │
│                            ↓                                     │
│       Marca "requires_password_change = true" no profile        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              FLUXO 2: USUÁRIO ALTERA PRÓPRIA SENHA              │
├─────────────────────────────────────────────────────────────────┤
│  Usuário → Menu → Meu Perfil → Segurança → Alterar Senha        │
│                            ↓                                     │
│        Digita: Senha Atual + Nova Senha + Confirmação           │
│                            ↓                                     │
│              Sistema valida e atualiza via Supabase              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│         FLUXO 3: TROCA OBRIGATÓRIA (APÓS RESET DO ADMIN)        │
├─────────────────────────────────────────────────────────────────┤
│  Usuário faz login com senha temporária                         │
│                            ↓                                     │
│   Sistema detecta "requires_password_change = true"             │
│                            ↓                                     │
│  Redireciona para tela de troca obrigatória (não pode pular)    │
│                            ↓                                     │
│   Usuário define nova senha → Remove flag → Acessa sistema      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementação

### 1. Atualizar Edge Function (Correção)

A edge function `admin-reset-password` verifica permissões via `user_roles`, mas o sistema usa `usuario_perfis` + `perfil_permissoes`. Será necessário ajustar para usar a RPC `usuario_tem_permissao`.

**Arquivo**: `supabase/functions/admin-reset-password/index.ts`

```typescript
// Substituir verificação por:
const { data: temPermissao } = await admin.rpc('usuario_tem_permissao', {
  check_user_id: requesterId,
  codigo_permissao: 'admin.usuarios'
});

if (!temPermissao) {
  return new Response(JSON.stringify({ error: "Sem permissão" }), { status: 403 });
}
```

### 2. Botão "Resetar Senha" no Admin de Usuários

**Arquivo**: `src/pages/admin/UsuariosAdminPage.tsx`

Adicionar no Sheet de detalhes do usuário:
- Botão "Resetar Senha" (ícone KeyRound)
- Ao clicar, chama edge function
- Modal exibe senha temporária gerada
- Instrução para admin informar ao usuário

```typescript
// Novo estado
const [resetDialogOpen, setResetDialogOpen] = useState(false);
const [tempPassword, setTempPassword] = useState<string | null>(null);
const [resetting, setResetting] = useState(false);

// Função de reset
const handleResetPassword = async () => {
  setResetting(true);
  const { data, error } = await supabase.functions.invoke('admin-reset-password', {
    body: { userId: currentSelectedUser.id }
  });
  
  if (error || data?.error) {
    toast.error(data?.error || 'Erro ao resetar senha');
  } else {
    setTempPassword(data.senhaTemporaria);
    setResetDialogOpen(true);
  }
  setResetting(false);
};
```

### 3. Criar Página "Meu Perfil"

**Arquivo**: `src/pages/MeuPerfilPage.tsx`

Nova página com tabs:
- **Dados Pessoais**: Visualização (nome, email, avatar)
- **Segurança**: Formulário de alteração de senha

```typescript
// Formulário de alteração de senha
const handleChangePassword = async () => {
  // Validar senha atual (re-autenticando)
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: senhaAtual
  });
  
  if (signInError) {
    setError('Senha atual incorreta');
    return;
  }
  
  // Atualizar para nova senha
  const { error: updateError } = await supabase.auth.updateUser({
    password: novaSenha
  });
  
  if (!updateError) {
    toast.success('Senha alterada com sucesso!');
  }
};
```

### 4. Atualizar UserMenu com Navegação

**Arquivo**: `src/components/auth/UserMenu.tsx`

Adicionar navegação funcional:

```typescript
<DropdownMenuItem onClick={() => navigate('/meu-perfil')}>
  <User className="h-4 w-4 mr-2" />
  Meu Perfil
</DropdownMenuItem>
```

### 5. Interceptar Login para Troca Obrigatória

**Arquivo**: `src/contexts/AuthContext.tsx`

Após login bem-sucedido, verificar flag:

```typescript
// No fetchUserData, incluir requires_password_change
const userData = {
  ...
  requiresPasswordChange: profile?.requires_password_change || false,
};

// Exportar no contexto
const requiresPasswordChange = user?.requiresPasswordChange || false;
```

**Arquivo**: `src/App.tsx`

Redirecionar se flag ativa:

```typescript
// No ProtectedRoute ou em useEffect global
if (isAuthenticated && user?.requiresPasswordChange) {
  navigate('/trocar-senha-obrigatoria');
}
```

### 6. Página de Troca Obrigatória

**Arquivo**: `src/pages/TrocaSenhaObrigatoriaPage.tsx`

Tela simples sem menu ou navegação:
- Não permite sair sem trocar
- Após troca, atualiza profile e redireciona

```typescript
const handleForceChange = async () => {
  const { error } = await supabase.auth.updateUser({ password: novaSenha });
  
  if (!error) {
    // Remover flag
    await supabase
      .from('profiles')
      .update({ requires_password_change: false })
      .eq('id', user.id);
    
    // Atualizar contexto e redirecionar
    await refreshUser();
    navigate('/sistema');
  }
};
```

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `supabase/functions/admin-reset-password/index.ts` | Modificar | Ajustar verificação de permissão para usar RPC |
| `src/pages/admin/UsuariosAdminPage.tsx` | Modificar | Adicionar botão e modal de reset de senha |
| `src/pages/MeuPerfilPage.tsx` | **Criar** | Nova página com dados pessoais e alteração de senha |
| `src/pages/TrocaSenhaObrigatoriaPage.tsx` | **Criar** | Tela de troca forçada após reset do admin |
| `src/components/auth/UserMenu.tsx` | Modificar | Adicionar navegação para Meu Perfil |
| `src/contexts/AuthContext.tsx` | Modificar | Incluir flag requiresPasswordChange |
| `src/types/auth.ts` | Modificar | Adicionar campo requiresPasswordChange ao AuthUser |
| `src/App.tsx` | Modificar | Adicionar rotas e lógica de redirecionamento |

---

## Rotas

| Rota | Página | Acesso |
|------|--------|--------|
| `/meu-perfil` | MeuPerfilPage | Autenticado |
| `/trocar-senha-obrigatoria` | TrocaSenhaObrigatoriaPage | Autenticado (flag ativa) |

---

## Componentes Visuais

### Modal de Senha Temporária (Admin)

```text
┌─────────────────────────────────────────────┐
│           Senha Resetada com Sucesso        │
├─────────────────────────────────────────────┤
│                                             │
│  A nova senha temporária do usuário é:      │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  Ab3$kLm9#pQr   [Copiar]            │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ⚠️ Informe esta senha ao usuário.          │
│  Ele será obrigado a alterá-la no primeiro  │
│  acesso.                                    │
│                                             │
│                         [Entendi]           │
└─────────────────────────────────────────────┘
```

### Página Meu Perfil - Tab Segurança

```text
┌─────────────────────────────────────────────┐
│  Meu Perfil                                 │
├─────────────────────────────────────────────┤
│  [Dados Pessoais]  [Segurança]              │
├─────────────────────────────────────────────┤
│                                             │
│  Alterar Senha                              │
│                                             │
│  Senha Atual *                              │
│  ┌─────────────────────────────────────┐    │
│  │ ••••••••                            │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  Nova Senha *                               │
│  ┌─────────────────────────────────────┐    │
│  │ ••••••••                            │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  Confirmar Nova Senha *                     │
│  ┌─────────────────────────────────────┐    │
│  │ ••••••••                            │    │
│  └─────────────────────────────────────┘    │
│                                             │
│             [Alterar Senha]                 │
└─────────────────────────────────────────────┘
```

---

## Segurança

- Verificação de senha atual antes de permitir troca
- Validação Zod para nova senha (mínimo 6 caracteres)
- Flag `requires_password_change` só pode ser removida após troca efetiva
- Edge function usa service role key para bypass de RLS
- Verificação de permissão `admin.usuarios` via RPC segura

---

## Ordem de Implementação

1. Atualizar edge function com verificação correta de permissão
2. Criar tipo `requiresPasswordChange` no AuthUser
3. Atualizar AuthContext para carregar a flag
4. Criar página TrocaSenhaObrigatoriaPage
5. Criar página MeuPerfilPage
6. Adicionar botão de reset no UsuariosAdminPage
7. Atualizar UserMenu com navegação
8. Adicionar rotas no App.tsx
9. Testar fluxo completo
