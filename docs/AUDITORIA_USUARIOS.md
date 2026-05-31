# Auditoria — Sistema de Usuários

> Auditoria de autenticação, autorização (RBAC), gestão de usuários e Edge
> Functions privilegiadas. Este documento registra os achados e o que foi
> tratado no hardening associado (branch `claude/hardening-sistema-usuarios`).

## Resumo

O modelo de segurança real do sistema repousa quase inteiramente sobre o **RLS
do Postgres**, porque as camadas do front estavam "abertas": o `ProtectedRoute`
liberava tudo e a gestão de usuários grava direto nas tabelas pelo client. Havia
uma Edge Function sem autorização (crítico) e autorização inconsistente entre as
funções. Há ainda uma duplicidade de modelos de permissão (o RBAC granular
documentado está, na prática, colapsado para nível de módulo).

## Achados e status

| # | Severidade | Achado | Status |
|---|---|---|---|
| C1 | 🔴 Crítico | `create-test-user` criava admins sem autorização (service role, `role` default `admin`) | ✅ Removida |
| C2 | 🔴 Crítico | Gestão de usuários grava direto em `user_modules`/`user_roles`/`profiles` pelo client — segurança depende só do RLS | ⚠️ Requer verificação de RLS (acesso ao banco) |
| A1 | 🟠 Alto | `ProtectedRoute` em modo "acesso total" | ✅ RBAC reativado |
| A2 | 🟠 Alto | Autorização inconsistente entre Edge Functions (3 critérios + 1 sem checagem) | ✅ Padronizada na RPC `usuario_tem_permissao('admin.usuarios')` |
| M1 | 🟡 Médio | Dois modelos de permissão divergentes (granular documentado x módulo real) | ✅ Documentação corrigida |
| M2 | 🟡 Médio | `requires_password_change` não era forçado no roteamento | ✅ Guard adicionado no `ProtectedRoute` |
| M3 | 🟡 Médio | CORS `*` em todas as funções | ✅ Allowlist por env (`ALLOWED_ORIGINS`), fallback `*` |
| M4 | 🟡 Médio | `signUp` latente; signups do Supabase podem estar habilitados | ⚠️ Verificar no painel Supabase (Auth → Providers) |
| B1 | 🟢 Baixo | UUID/e-mail do super admin hardcoded no bundle | Mantido (decisão de produto) |
| B2 | 🟢 Baixo | `console.log` de e-mail/permissões no `AuthContext` | ✅ Removidos |
| B3 | 🟢 Baixo | Mínimo de senha inconsistente (login 6 / nova 8) | Não alterado (mudar o login bloquearia senhas atuais de 6–7 chars) |
| B4 | 🟢 Baixo | `delete-user` usa `.single()` (quebra com 0/n linhas) | ✅ Trocado por `.maybeSingle()` |

## Detalhamento dos itens corrigidos

### C1 — `create-test-user` removida
Função sem qualquer validação de chamador que criava usuários com a service role
e papel `admin` por padrão. Removida do repositório.
**Ação operacional necessária:** excluir também a função **publicada** no
Supabase (o `git rm` não a remove do projeto remoto).

### A1 — RBAC de rota reativado
`src/components/auth/ProtectedRoute.tsx` voltou a aplicar, nesta ordem: loader
enquanto carrega → redireciona para `/auth` se não autenticado → força troca de
senha (M2) → bypass de super admin → checa `requiredModule`/`requiredPermissions`
via `AuthContext` (permissões hierárquicas; redireciona a `/acesso-negado`).
**Atenção:** valide com perfis reais antes do merge — usuários com módulos
incompletos no banco podem perder acesso a rotas que antes abriam.

### A2 — Autorização padronizada nas Edge Functions
`admin-create-user` e `delete-user` passaram a usar a mesma RPC
`usuario_tem_permissao(_user_id, 'admin.usuarios')` já adotada por
`admin-reset-password`. Antes usavam, respectivamente, presença de módulo
`admin` e `user_roles.role='admin'`.

### M2 — Troca de senha obrigatória
O `ProtectedRoute` agora redireciona para `/trocar-senha-obrigatoria` quando
`user.requiresPasswordChange` é verdadeiro (exceto na própria rota).

### M3 — CORS com allowlist
As funções de usuário leem `ALLOWED_ORIGINS` (lista separada por vírgula) das
variáveis de ambiente e refletem a origem quando permitida. Sem a variável,
mantêm `*` para não quebrar ambientes existentes.
**Recomendado:** definir `ALLOWED_ORIGINS` com a(s) origem(ns) de produção.

## Itens que dependem de acesso ao banco/painel

### C2 — RLS das tabelas de usuário (pendente)
A gestão de módulos (`useAdminRBAC`/`useAdminUsuarios`) escreve direto em
`user_modules` (e atualiza `profiles`) pelo client. **A única barreira é o RLS.**
É necessário garantir que as políticas de **escrita** (`INSERT`/`UPDATE`/`DELETE`)
em `user_modules`, `user_roles` e `profiles` estejam restritas a administradores
(ex.: via `usuario_eh_super_admin(auth.uid())` ou `has_role(auth.uid(),'admin')`),
mantendo `SELECT` para o necessário. Não foi possível inspecionar/ajustar as
políticas nesta sessão (ferramentas MCP do Supabase sem permissão). Recomenda-se
também rodar **Database → Advisors** (security) no painel.

> Defesa em profundidade recomendada: rotear a alteração de módulos por uma Edge
> Function privilegiada (como criação/exclusão) em vez de escrita direta do
> client, deixando o RLS como segunda barreira.

### M4 — Signups públicos (verificar)
`AuthContext.signUp` existe mas não é exposto na UI. Confirmar que **"Enable
signups"** está **desativado** no Supabase (Auth → Providers → Email), caso
contrário é possível autorregistro via API.

## Pontos positivos

- `AuthContext` com `onAuthStateChange` como única fonte de verdade, sem deadlock
  e com timeout de segurança.
- `AuthPage` com rate-limiting/lockout, validação `zod` e sem cadastro público.
- `admin-create-user`/`admin-reset-password` validam o chamador e normalizam
  e-mail; reset gera senha temporária e marca troca obrigatória.
- `delete-user` registra `audit_logs`, impede auto-exclusão e protege o super
  admin.

## Nota sobre o modelo de permissões (M1)

O `AuthContext` deriva o acesso de `user_roles` (→ `isSuperAdmin` quando há role
`admin`) e `user_modules` (→ lista de permissões em nível de módulo). A RPC
`listar_permissoes_usuario` e as estruturas granulares (`ROUTE_PERMISSIONS`,
`MODULE_PERMISSIONS`, `permissoesDetalhadas`) **não** alimentam o contexto em
runtime; `permissoesDetalhadas` é sintetizada a partir dos módulos. Como
`hasPermission` faz match hierárquico no "pai", ter o módulo `rh` concede `rh.*`.
