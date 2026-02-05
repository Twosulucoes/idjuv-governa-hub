
# Plano: Correção do Sistema de Troca de Senha

## Problema Identificado

O sistema está em **loop infinito** porque:

1. **Coluna com DEFAULT errado**: A coluna `requires_password_change` foi criada com `DEFAULT true`
2. **Todos os 14 usuários afetados**: Todos os perfis no banco estão com a flag ativa
3. **Mesmo após trocar a senha, o problema persiste** porque o ProtectedRoute verifica a flag antes de permitir qualquer navegação

## Causa Raiz

Quando a coluna `requires_password_change` foi adicionada à tabela `profiles`, foi definido o default como `true` em vez de `false`. Isso ativou a flag para todos os usuários existentes automaticamente.

## Solução

### Etapa 1: Migração SQL (Correção Urgente)

Alterar o default da coluna e corrigir os dados existentes:

```sql
-- 1. Corrigir o DEFAULT da coluna para FALSE
ALTER TABLE profiles 
ALTER COLUMN requires_password_change SET DEFAULT false;

-- 2. Corrigir todos os usuários que estão com flag incorretamente ativa
-- (apenas os que NÃO foram resetados pelo admin)
UPDATE profiles 
SET requires_password_change = false 
WHERE requires_password_change = true;
```

### Etapa 2: Verificar a Página TrocaSenhaObrigatoriaPage

A página atual está correta:
- Chama `supabase.auth.updateUser({ password: novaSenha })`
- Depois atualiza o profile: `requires_password_change = false`
- Por fim, chama `refreshUser()` e navega para `/sistema`

**Porém**, há um problema de timing: o `ProtectedRoute` pode redirecionar de volta antes que o `refreshUser()` termine de atualizar o estado.

### Etapa 3: Ajustar Lógica no ProtectedRoute

O ProtectedRoute verifica a flag ANTES de renderizar a página de troca. Se a rota atual for `/trocar-senha-obrigatoria`, deve permitir o acesso normalmente e não redirecionar.

Verificar linha 139 de `ProtectedRoute.tsx`:
```typescript
if (user?.requiresPasswordChange && location.pathname !== '/trocar-senha-obrigatoria') {
  return <Navigate to="/trocar-senha-obrigatoria" replace />;
}
```

Esta lógica está correta, mas o problema é que após a troca, o `refreshUser()` atualiza o contexto com novos dados do banco. Se o banco ainda tiver `requires_password_change = true` (por não ter sido atualizado corretamente), o loop continua.

### Etapa 4: Melhorar TrocaSenhaObrigatoriaPage

Garantir que a atualização do profile seja bem-sucedida antes de navegar:

```typescript
const handleTrocarSenha = async () => {
  // ... validação ...
  
  // 1. Atualizar senha no Auth
  const { error: updateError } = await supabase.auth.updateUser({
    password: novaSenha
  });
  
  if (updateError) {
    // tratamento de erro
    return;
  }
  
  // 2. Atualizar profile - AGUARDAR resultado
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ 
      requires_password_change: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id);
  
  if (profileError) {
    console.error('Erro ao atualizar profile:', profileError);
    toast.error('Erro ao finalizar troca de senha');
    return;
  }
  
  // 3. Atualizar contexto e redirecionar
  await refreshUser();
  navigate('/sistema', { replace: true });
};
```

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| Nova migração SQL | Corrigir DEFAULT e dados existentes |
| `src/pages/TrocaSenhaObrigatoriaPage.tsx` | Melhorar tratamento de erro do update no profile |

## Ordem de Execução

1. **URGENTE**: Executar migração SQL para corrigir os dados
2. Ajustar a página TrocaSenhaObrigatoriaPage para melhor tratamento de erros
3. Testar o fluxo completo

## Observação Importante

A migração irá definir `requires_password_change = false` para **todos** os usuários. Se algum usuário DEVERIA estar com a flag ativa (porque um admin resetou a senha dele recentemente), o admin precisará resetar novamente.
