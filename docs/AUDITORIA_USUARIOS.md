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
| C2 | 🔴 Crítico | Gestão de usuários grava direto em `user_modules`/`user_roles`/`profiles` pelo client — segurança depende só do RLS | ⚠️ Migração criada (ver abaixo) — falta validar ausência de policy legada permissiva |
| A1 | 🟠 Alto | `ProtectedRoute` em modo "acesso total" | ✅ RBAC reativado |
| A2 | 🟠 Alto | Autorização inconsistente entre Edge Functions (3 critérios + 1 sem checagem) | ✅ Padronizada na RPC `usuario_tem_permissao('admin.usuarios')` |
| C3 | 🔴 Crítico | `database-schema` (expõe schema completo via service role) e `cpsi-ai-assistant` (chama IA paga) sem qualquer checagem de identidade | ✅ Corrigido — mesmo padrão de `admin-create-user` |
| M1 | 🟡 Médio | Dois modelos de permissão divergentes (granular documentado x módulo real) | ✅ Documentação corrigida |
| M2 | 🟡 Médio | `requires_password_change` não era forçado no roteamento | ✅ Guard adicionado no `ProtectedRoute` |
| M3 | 🟡 Médio | CORS `*` em todas as funções | ✅ Allowlist por env (`ALLOWED_ORIGINS`); desde o P12 sem fallback `*` (falha fechado) |
| M4 | 🟡 Médio | `signUp` latente; signups do Supabase podem estar habilitados | ⚠️ Verificar no painel Supabase (Auth → Providers) |
| B1 | 🟢 Baixo | UUID/e-mail do super admin hardcoded no bundle | Mantido (decisão de produto) |
| B2 | 🟢 Baixo | `console.log` de e-mail/permissões no `AuthContext` | ✅ Removidos |
| B3 | 🟢 Baixo | Mínimo de senha inconsistente (login 6 / nova 8) | ✅ P12: mínimo 8 ao criar e trocar (perfil, troca obrigatória, redefinição); no login a senha só é obrigatória (não bloqueia senhas atuais curtas). Falta o GoTrue exigir o mínimo no servidor (dono) |
| B4 | 🟢 Baixo | `delete-user` usa `.single()` (quebra com 0/n linhas) | ✅ Trocado por `.maybeSingle()` |
| D1 | 🟠 Alto | `xlsx@0.18.5` (CVE de ReDoS/prototype pollution) sem correção no npm registry; `ImportarEscolasPage.tsx` faz parsing de arquivo enviado pelo usuário | ✅ P12: `xlsx` 0.20.3 instalado do CDN oficial da SheetJS (ver abaixo) |

## Auditoria de segurança P12 (17/10/2026)

Auditoria do projeto inteiro (banco, Edge Functions, front e servidor) no passo P12 do plano de finalização.
Resultado: **nenhum achado crítico ou alto**. Os achados abaixo foram corrigidos na mesma entrega ou ficaram
registrados como pendência.

**Corrigidos** (detalhes em [BANCO_DE_DADOS.md](./BANCO_DE_DADOS.md), [EDGE_FUNCTIONS.md](./EDGE_FUNCTIONS.md),
[RBAC_PERMISSOES.md](./RBAC_PERMISSOES.md), [GUIA_FRONTEND.md](./GUIA_FRONTEND.md) e
[DESENVOLVIMENTO.md](./DESENVOLVIMENTO.md)):

- **Formulários públicos** (migração `20261017090000`): limite por IP (hash md5, janela de 1 hora, `PT429`) nas RPCs
  de gestores escolares, árbitros e denúncia e no INSERT de árbitros, modalidades e federações; gestores escolares
  só pela RPC, com duplicidade em mensagem neutra; `consultar_gestor_por_cpf` sem nome da pessoa e sem ids; INSERT
  público de federações e árbitros só com a situação inicial e sem campos internos.
- **Funções de permissão:** `get_user_permission_codes`, `listar_permissoes_usuario`,
  `get_permissions_from_servidor` e `get_user_permissions` não respondem pela API sobre outro usuário (só o próprio
  ou o admin); `get_chefe_unidade_atual` só para quem lê `nomeacoes_chefe_unidade`.
- **Edge Functions:** CORS falha fechado (`_shared/cors.ts`, `ALLOWED_ORIGINS` obrigatória), inclusive em
  `download-frequencia`; convite de reunião exige o módulo `gabinete` ou `admin`, só gera `wa.me` para participante externo,
  não revela contato do servidor e confere título e nomes no filtro de link; erros genéricos ao cliente em
  `admin-reset-password`, `admin-create-user`, `delete-user` e `database-schema`; trilha do reset sem e-mail; log
  do `cpsi-ai-assistant` só com status e tamanho; cotas em `bb-api` (validar conta, 60/hora) e no envio de teste
  de `enviar-notificacao` (20/hora).
- **Front:** links vindos do banco por `urlSegura` e formulários de link só com `http(s)`; senha mínima de 8 ao
  criar e trocar (B3); login com "E-mail ou senha inválidos" para qualquer erro de credencial; PWA sem cache das
  respostas da API (o cache antigo é apagado nos aparelhos); `react-router-dom` 6.30.6 e `xlsx` 0.20.3 (D1);
  cabeçalhos de segurança versionados em `deploy/nginx/cabecalhos-seguranca.conf` e impressão de etiquetas sem
  script inline.

**Pendências que continuam:**

- `delete-user` ainda grava o e-mail na trilha (linha `delete`) e devolve o e-mail ao admin, e não é atômica.
- Convite de reunião: o link da reunião (`link_virtual`) é livre e o `created_by` da reunião pode ser trocado pela API.
- ASCOM e documentos usam `getPublicUrl` em buckets privados (o link não abre).
- As telas públicas da ASCOM só funcionam com login.
- `requires_password_change` só é aplicado pela tela (`ProtectedRoute`), não no servidor.
- Nome do cliente em `public/data/resumo.json` e na rota `/portal-preview-idjuv-2026`.
- `has_permission_code`, `can_access_module` e `is_admin_user` ainda aceitam o uuid de outro usuário.

**Do dono, no servidor:**

- Incluir `deploy/nginx/cabecalhos-seguranca.conf` no `server { }` do nginx/Traefik da VPS (o CI não faz).
- Definir `ALLOWED_ORIGINS` no serviço de Edge Functions (sem ela, o navegador bloqueia as funções).
- Configurar o GoTrue para exigir a senha atual na troca e o mínimo de 8 caracteres.
- Conferir que o proxy entrega o IP real em `x-real-ip`; se entregar IP interno, todos os visitantes caem na mesma
  cota do limite por IP.

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
mantinham `*` para não quebrar ambientes existentes. Desde o P12 todas usam
`supabase/functions/_shared/cors.ts`: sem a variável, a resposta sai sem
`Access-Control-Allow-Origin` (falha fechado), e `ALLOWED_ORIGINS` passou a ser
**obrigatória** em toda instância (ver `docs/EDGE_FUNCTIONS.md`).

## Itens que dependem de acesso ao banco/painel

### C2 — RLS das tabelas de usuário (migração aplicada, validação pendente)
A gestão de módulos (`useAdminRBAC`/`useAdminUsuarios`) escreve direto em
`user_modules` (e atualiza `profiles`) pelo client. **A única barreira é o RLS.**
A proposta em [RLS_USUARIOS_PROPOSTA.sql](./RLS_USUARIOS_PROPOSTA.sql) foi
materializada como migração real em
`supabase/migrations/20260824010000_rls_user_modules_user_roles_profiles.sql`
(helper `is_admin_atual()` + políticas de leitura/escrita restringindo INSERT/
UPDATE/DELETE a administradores).

**Isto ainda não fecha o item C2 sozinho.** Esta sessão não teve acesso ao
projeto Supabase real do IDJUV (só a outros projetos não relacionados na
mesma conta), então não foi possível rodar a introspecção (SEÇÃO 0 da
proposta) nem `Database → Advisors`. As políticas novas são aditivas — se já
existir uma política antiga permissiva (`USING (true)`) para escrita nessas
tabelas, ela continua valendo (RLS combina políticas do mesmo comando com OR).
**Próximo passo obrigatório:** com acesso ao projeto real, rodar a
introspecção, remover qualquer política legada permissiva encontrada, rodar
Advisors (security) e validar login + `/admin/usuarios` antes de considerar
C2 fechado.

> Defesa em profundidade recomendada: rotear a alteração de módulos por uma Edge
> Function privilegiada (como criação/exclusão) em vez de escrita direta do
> client, deixando o RLS como segunda barreira.

### D1 — `xlsx` sem correção no npm registry (resolvido no P12)

**Situação atual (P12, 17/10/2026):** `xlsx` 0.20.3 instalado do CDN oficial da
SheetJS (`https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz` no `package.json`),
que corrige a falha da 0.18.5. O texto abaixo é o registro de quando o item foi
aberto.

A SheetJS parou de publicar correções de segurança do pacote `xlsx` no npm
registry a partir da 0.18.5 (2022) — confirmado consultando
`npm view xlsx versions`, não há versão mais nova lá. A correção oficial só
está disponível via CDN próprio (`cdn.sheetjs.com`), que **esta sessão não
conseguiu instalar**: o proxy de rede do ambiente bloqueia esse domínio por
política (403 na tentativa de `bun add`/`curl`, confirmado em
`/root/.ccr/__agentproxy/status`) — não é algo para contornar, é uma decisão
de política de rede da organização.

Verificação de superfície real: das 8 telas que usam `xlsx`, só
`src/pages/cadastrogestores/ImportarEscolasPage.tsx` faz `XLSX.read` sobre um
arquivo enviado pelo usuário (as demais só exportam/geram planilha, não
processam arquivo externo) — e essa rota exige a permissão
`gestores_escolares.admin` (não é pública). O código também só lê campos
nomeados específicos do resultado do parse (não espalha `row` inteiro), o que
limita — mas não elimina — o efeito prático do CVE de prototype pollution.

**Mitigação aplicada nesta sessão:** limite de 5 MB no upload em
`ImportarEscolasPage.tsx` (reduz a superfície de um arquivo malicioso
volumoso; não elimina o risco de ReDoS/pollution de um arquivo pequeno e
malicioso).

**Pendente na época (a opção 1 foi feita no P12):**
1. Instalar `xlsx` a partir do CDN oficial da SheetJS a partir de uma máquina/CI
   sem essa restrição de rede (`npm install https://cdn.sheetjs.com/...`); ou
2. Substituir `xlsx` por uma lib mantida (ex. `exceljs`) pelo menos no caminho
   de importação de arquivo — o de maior superfície de ataque.

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
- `delete-user` registra `audit_logs`, impede auto-exclusão e recusa excluir
  qualquer administrador; `admin-reset-password` recusa outro administrador e
  grava `audit_logs` (Onda 2, ver `docs/EDGE_FUNCTIONS.md`).

## Nota sobre o modelo de permissões (M1)

O `AuthContext` deriva o acesso de `user_roles` (→ `isSuperAdmin` quando há role
`admin`) e `user_modules` (→ lista de permissões em nível de módulo). A RPC
`listar_permissoes_usuario` e as estruturas granulares (`ROUTE_PERMISSIONS`, removido no P08,
`MODULE_PERMISSIONS`, `permissoesDetalhadas`) **não** alimentam o contexto em
runtime; `permissoesDetalhadas` é sintetizada a partir dos módulos. Como
`hasPermission` faz match hierárquico no "pai", ter o módulo `rh` concede `rh.*`.
