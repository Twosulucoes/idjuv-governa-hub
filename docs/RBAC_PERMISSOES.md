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

### Módulo ≠ permissão

São dois eixos distintos, e a distinção é o coração do modelo:

- **Módulo** (`user_modules.module`) responde **ONDE** o usuário atua — se o
  módulo RH aparece para ele. Fica em `AuthUser.modules`.
- **Permissão granular** (`modulo.recurso.acao`) responde **O QUE** ele pode
  fazer lá dentro. Fica em `AuthUser.permissions`.

Ter o módulo `rh` **não** concede `rh.*`. Cada ação — em especial `excluir` —
exige o código granular correspondente, concedido por uma das três fontes
abaixo. (Até a migração `20260916120000_permissoes_granulares.sql` era o
contrário: o módulo concedia tudo dentro dele por herança de prefixo.)

## Tabelas envolvidas

`profiles`, `user_roles`, `user_modules`, `user_org_units`,
`module_access_scopes`, `module_permissions_catalog`, `module_settings`,
`role_permissions`, `user_permissions`.
Ver [BANCO_DE_DADOS.md](./BANCO_DE_DADOS.md).

### As três fontes de permissão

O conjunto efetivo do usuário é a **união** de:

| Fonte | Tabela | Para quê |
|---|---|---|
| Papel | `role_permissions` (via `user_roles`) | Padrão por papel: `admin` tudo, `manager` tudo menos `excluir`, `user` só `visualizar`. **Recortado pelos módulos do usuário** — o papel define o quê, o módulo define onde. |
| Módulo | `user_modules.permissions[]` | Ajuste fino dentro de um módulo. É o que o Painel de Permissões (`/admin/permissoes`) edita. |
| Avulsa | `user_permissions` | Concessão pontual a um usuário, fora do que papel e módulo dão. |

Todo código concedido precisa existir em `module_permissions_catalog` — é o
catálogo que dá rótulo, categoria e `action_type` a cada permissão, e as duas
tabelas acima têm FK para ele.

> ⚠️ Hoje só a fonte **Módulo** tem UI. `role_permissions` vem semeada pela
> migração e `user_permissions` é concedida via SQL — uma tela para ambas é
> trabalho em aberto.

## Fluxo em tempo de execução

1. Login via Supabase Auth → `onAuthStateChange` no `AuthContext`.
2. `AuthContext` lê `user_roles`, `user_modules`, `user_permissions`,
   `role_permissions` e o catálogo, e faz a união das três fontes.
   (O RPC **`listar_permissoes_usuario`** e a função
   **`get_user_permission_codes`** resolvem a mesma união no banco, para uso
   em RLS e em consultas fora do front.)
3. `AuthUser.permissions` recebe os códigos granulares e `AuthUser.modules` os
   módulos (cache em memória, TTL ~60s).
4. UI consulta `hasPermission(codigo)`, `hasAnyPermission([...])`,
   `hasAllPermissions([...])`, `hasModule(modulo)`, `isSuperAdmin` para
   mostrar/ocultar e proteger.

### Como `hasPermission` resolve um código

1. Super admin → `true`.
2. Código presente em `AuthUser.permissions` → `true`.
3. Código **sem ponto** (`rh`, `admin`) é um módulo → checa `AuthUser.modules`.
4. Prefixo granular concedido (ter `rh.servidores` concede
   `rh.servidores.editar`). O módulo **não** entra aqui — era exatamente essa
   herança que fazia `rh` conceder `rh.servidores.excluir`.

Funções de banco que apoiam o RLS e a checagem: `get_user_permission_codes`,
`has_permission_code`, `has_permission`, `has_role`,
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

## Enforcement de rota (`ProtectedRoute`)

O componente `src/components/auth/ProtectedRoute.tsx` aplica o controle de acesso
nesta ordem:

1. **Loader** enquanto a sessão carrega (`isLoading`).
2. **Não autenticado** → redireciona para `/auth` (guardando a origem).
3. **Troca de senha obrigatória** (`requiresPasswordChange`) → força
   `/trocar-senha-obrigatoria`.
4. **Super admin** → bypass total.
5. **`requiredModule` / `requiredPermissions`** → valida via `AuthContext`
   (permissões hierárquicas: ter o módulo `rh` concede `rh.*`); sem acesso,
   redireciona para `/acesso-negado`.

> **Nota histórica:** até o hardening de usuários, o `ProtectedRoute` estava em
> modo "acesso total" (liberava qualquer autenticado). Ver
> [AUDITORIA_USUARIOS.md](./AUDITORIA_USUARIOS.md).

Camadas complementares:

- O **RLS no Postgres** é a fronteira de segurança real dos dados (independe do
  front). Ver item C2 da auditoria sobre o reforço pendente das tabelas de usuário.
- O **menu** (`menu.config.ts`) é filtrado por permissão — controla o que aparece.

## Rotas públicas

Rotas sob `<PublicPageGuard rota="...">` não exigem login; verificam apenas o
status de publicação/manutenção da rota (tabela `config_paginas_publicas`). Ex.:
`/`, `/transparencia/*`, `/curriculo`, `/cadastrogestores`, `/cadastro-arbitros`,
`/ascom/solicitar`, notícias e galerias públicas.
