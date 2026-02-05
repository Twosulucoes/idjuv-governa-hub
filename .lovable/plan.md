
# Plano: Simplificar Sistema de Acesso por Modulos

## ✅ STATUS: IMPLEMENTADO

Data de implementação: 2026-02-05

---

## Resumo das Alterações

### 1. ProtectedRoute Simplificado
- Removida a dependência do hook `useModulosUsuario`
- Removida a verificação `rotaAutorizada()` e `restringirModulos`
- O controle de acesso agora é feito **exclusivamente via RBAC** (perfis/permissões)

### 2. UsuarioModulosTab Refatorado
- Agora mostra **domínios acessíveis** baseados nos perfis do usuário
- Busca permissões via `perfil_permissoes` e agrupa por domínio
- Interface clara indicando que perfis controlam os acessos

### 3. Fluxo Simplificado

```text
+------------------+
| Administrador    |
+------------------+
        |
        v
  Associa perfil ao usuário
  (ex: "Operador RH")
        |
        v
+------------------+
| Perfil contém    |
| permissões:      |
| - rh.visualizar  |
| - rh.criar       |
+------------------+
        |
        v
  Menu RH aparece
  Rotas RH acessíveis
```

---

## Arquivos Modificados

| Arquivo | Alteração |
|---------|-----------|
| `src/components/auth/ProtectedRoute.tsx` | Removida verificação de módulos, apenas RBAC |
| `src/components/admin/UsuarioModulosTab.tsx` | Refatorado para mostrar domínios via perfis |
| `src/pages/admin/UsuarioDetalhePage.tsx` | Atualizado título/descrição da aba |

---

## Próximos Passos (Opcional)

### Para o Usuário Rangel
1. Acesse `/admin/usuarios` 
2. Clique no usuário Rangel
3. Na aba "Perfis", associe um perfil que tenha permissões de RH (ex: criar "Operador RH")

### Perfis Sugeridos para Criar

| Perfil | Permissões |
|--------|------------|
| Operador RH | rh.visualizar, rh.criar, rh.self |
| Gestor RH | rh.visualizar, rh.criar, rh.tramitar, rh.aprovar, rh.self |
| Operador Compras | compras.visualizar, compras.criar |
| Gestor Compras | compras.visualizar, compras.criar, compras.tramitar, compras.aprovar |

### Limpeza de Dados (Opcional)

Se quiser remover completamente a flag `restringir_modulos`:
```sql
UPDATE profiles SET restringir_modulos = false;
```

---

## Hooks e Arquivos Obsoletos (Podem Ser Removidos)

Os seguintes arquivos não são mais necessários para o controle de acesso:
- `src/hooks/useModulosUsuario.ts` (ainda usado em outros lugares?)
- `src/hooks/useAdminModulos.ts`
- `src/types/modulos.ts`

**Nota**: Verifique se estes arquivos são usados em outros lugares antes de remover.


