

## Correção Definitiva: Race Condition no `userRef` 

### Problema Identificado

Existe um `useEffect` nas **linhas 176-178** do `AuthContext.tsx`:

```typescript
useEffect(() => {
  userRef.current = user;
}, [user]);
```

Este `useEffect` causa a seguinte sequência destrutiva durante o `signIn`:

```text
1. signIn() chama setUser(null)           --> agenda useEffect com user=null
2. signIn() faz await fetchUserData(...)   --> (async, leva tempo)
3. signIn() define userRef.current = userData  (correto, sincrono)
4. signIn() chama setUser(userData)        --> agenda useEffect com user=userData
5. React renderiza:
   - useEffect do passo 1 executa --> userRef.current = null  (SOBRESCREVE!)
   - Listener vê userRef.current === null, faz fetch duplicado SEM super_admin
   - useEffect do passo 4 executa --> userRef.current = userData (tarde demais)
```

O `useEffect` é **assíncrono** (executa após o render), enquanto `userRef.current = userData` na linha 347 é **síncrono**. O efeito do `setUser(null)` anterior sobrescreve o valor correto com `null`, abrindo uma janela para o listener refazer o fetch.

### Solucao

Remover o `useEffect` redundante (linhas 176-178). Ja estamos atualizando `userRef.current` sincronamente antes de cada `setUser` em todos os pontos do codigo (signIn, initializeAuth, listener). O `useEffect` so adiciona risco.

### Alteracoes

**Arquivo: `src/contexts/AuthContext.tsx`**

1. Remover o bloco `useEffect` das linhas 173-178:
   ```typescript
   // REMOVER ESTE BLOCO INTEIRO:
   useEffect(() => {
     userRef.current = user;
   }, [user]);
   ```

2. Garantir que `userRef.current = null` seja definido antes de `setUser(null)` na funcao `signIn` (linha 316):
   ```typescript
   userRef.current = null;
   setUser(null);
   ```

3. Garantir que `userRef.current = null` seja definido antes de `setUser(null)` na funcao `signOut` (linhas 416-417):
   ```typescript
   userRef.current = null;
   setUser(null);
   ```

4. Garantir que `userRef.current = null` seja definido no bloco catch do `signOut` (linhas 425-426):
   ```typescript
   userRef.current = null;
   setUser(null);
   ```

5. Na funcao `refreshUser` (linha 434), adicionar sync do ref:
   ```typescript
   const refreshUser = async () => {
     if (session?.user) {
       const userData = await fetchUserData(session.user);
       userRef.current = userData;
       setUser(userData);
     }
   };
   ```

6. Na funcao `refreshPermissions` (linhas 440-448), adicionar sync do ref no callback do `setUser`:
   ```typescript
   const refreshPermissions = async () => {
     if (user && session?.user) {
       const { permissions, permissoesDetalhadas, isSuperAdmin } = await fetchPermissoes(session.user.id);
       const updated = user ? { ...user, permissions, permissoesDetalhadas, isSuperAdmin } : null;
       userRef.current = updated;
       setUser(updated);
     }
   };
   ```

Essas alteracoes eliminam a unica fonte remanescente de dessincronizacao entre `userRef` e o estado `user`.
