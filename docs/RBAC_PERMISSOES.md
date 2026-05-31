# Controle de Acesso (RBAC) e Permissões

## Modelo

O sistema usa **RBAC baseado em permissões dinâmicas vindas do banco** — papéis
(perfis) não são hardcoded no código; são derivados das tabelas do Postgres.

- Formato da permissão: **`{dominio}.{recurso}.{acao}`** ou `{dominio}.{capacidade}`.
  - Exemplos: `rh.servidores.criar`, `governanca.portarias.visualizar`,
    `workflow.tramitar`, `orcamento.aprovar`, `admin.usuarios`.
- Ações comuns: `visualizar`, `criar`, `editar`, `excluir`, `tramitar`, `aprovar`,
  `gerenciar`, `configurar`. Capacidades de workflow: `despachar`, `arquivar`.
- **Super admin** (`isSuperAdmin`) faz *bypass* de todas as permissões.

## Tabelas envolvidas

`profiles`, `user_roles`, `user_modules`, `user_org_units`,
`module_access_scopes`, `module_permissions_catalog`, `module_settings`.
Ver [BANCO_DE_DADOS.md](./BANCO_DE_DADOS.md).

## Fluxo em tempo de execução

1. Login via Supabase Auth → `onAuthStateChange` no `AuthContext`.
2. `AuthContext` chama o RPC **`listar_permissoes_usuario`**, que retorna a lista
   de permissões + metadados (`PermissaoUsuario`: módulo, submódulo, rota, ícone…).
3. As permissões ficam em `AuthUser.permissions` (cache em memória, TTL ~60s).
4. UI consulta `hasPermission(codigo)`, `hasAnyPermission([...])`,
   `hasAllPermissions([...])`, `isSuperAdmin` para mostrar/ocultar e proteger.

Funções de banco que apoiam o RLS e a checagem: `has_permission`, `has_role`,
`usuario_tem_permissao`, `usuario_tem_acesso_modulo`, `usuario_tem_acesso_rota`,
`usuario_eh_super_admin`, `user_has_unit_access`, `can_approve`.

## Escopo de acesso (`AccessScope`)

Definido em `src/types/auth.ts` (`module_access_scopes` no banco):

| Escopo | Significado |
|---|---|
| `all` | Tudo |
| `org_unit` | Apenas o setor do usuário |
| `local_unit` | Apenas a unidade local |
| `own` | Apenas os próprios registros |
| `readonly` | Somente leitura |

## Onde isso aparece no código

- **`src/types/auth.ts`** — tipos (`PermissionCode`, `AuthUser`, `AccessScope`),
  o mapa **`ROUTE_PERMISSIONS`** (rota → permissão exigida) e
  **`MODULE_PERMISSIONS`** (catálogo de permissões agrupadas por módulo).
- **`src/config/menu.config.ts`** — cada item de menu declara a `permission`
  necessária (tipo `PermissaoInstitucional`); o menu é filtrado por permissão.
- **`src/contexts/AuthContext.tsx`** — busca, cache e API de checagem.
- **`src/components/auth/ProtectedRoute.tsx`** — guarda de rota.
- **`src/shared/config/protected-users.config.ts`** — usuários protegidos.
- Hooks: `useRBAC`, `usePermissions`, `usePermissoesUsuario`, `useModulosUsuario`.

## ⚠️ Estado atual importante

O componente **`ProtectedRoute` está em modo "ACESSO TOTAL"**: ele renderiza os
filhos para **qualquer usuário autenticado**, ignorando `requiredModule` e
`requiredPermissions` declarados nas rotas em `src/App.tsx`.

```tsx
// src/components/auth/ProtectedRoute.tsx (resumo do estado atual)
export const ProtectedRoute = ({ children }) => <>{children}</>;
```

Implicações:

- As props `requiredModule`/`requiredPermissions` nas rotas e as `permission`
  no menu **documentam a intenção** de acesso, mas o gate de rota **não está
  aplicando** essas regras no momento.
- O **RLS no Postgres** continua sendo a fronteira de segurança real dos dados.
- O **menu** ainda é filtrado por permissão (controla o que aparece), mas não
  impede o acesso direto pela URL enquanto o `ProtectedRoute` estiver assim.

**Para reativar o RBAC de rota:** reintroduzir a lógica em `ProtectedRoute`
(checar `isSuperAdmin` → senão validar `requiredModule`/`requiredPermissions`
via `AuthContext`, redirecionando para `/acesso-negado`). Como isso afeta a
segurança de todo o sistema, **confirme com o responsável antes de alterar** e
teste com diferentes perfis.

## Rotas públicas

Rotas sob `<PublicPageGuard rota="...">` não exigem login; verificam apenas o
status de publicação/manutenção da rota (tabela `config_paginas_publicas`). Ex.:
`/`, `/transparencia/*`, `/curriculo`, `/cadastrogestores`, `/cadastro-arbitros`,
`/ascom/solicitar`, notícias e galerias públicas.
</content>
