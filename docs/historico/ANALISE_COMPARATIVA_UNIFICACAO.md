# Análise comparativa e plano de unificação — `idjuv-governa-hub` × `idjuv-governo-flex`

> Documento de decisão. Compara os dois repositórios, define qual adotar, o que
> aproveitar do outro, como sair para banco próprio na VPS e qual arquitetura de
> política de usuários adotar.
>
> Levantamento feito em 02/09/2026 sobre `main` de cada repositório.

---

## 1. Veredito

**Adotar `idjuv-governa-hub` como base única. Aposentar `idjuv-governo-flex`.**

O `flex` não é um sistema paralelo: é **o ancestral** do `hub`. O `hub` é um fork
que seguiu evoluindo por mais 7 meses. A prova é direta:

- **41 das 44** entidades do banco do `flex` existem, com o mesmo nome, no `hub`.
- **Todas as 61 páginas** do `flex` têm equivalente no `hub` (algumas renomeadas).
- Nenhum módulo do `flex` está ausente no `hub`; o `hub` tem ~10 módulos a mais.

Há exatamente **duas coisas** no `flex` que valem ser trazidas para o `hub` — e
uma delas é justamente o ponto que você levantou: o **modelo de permissões
granular**. Detalhe na §6.

---

## 2. Situação de cada repositório

| | `idjuv-governa-hub` | `idjuv-governo-flex` |
|---|---|---|
| Dono | `twosulucoes` | `handfabiano` |
| Último commit | **24/08/2026** (humano, merge de PR) | **19/01/2026** (bot `gpt-engineer-app`) |
| Commits | 143 | 92 |
| Páginas | **241** | 61 |
| Componentes | **265** | 83 |
| Hooks de dados | **86** | 5 |
| Linhas em `src/` | **~224.700** | ~45.300 |
| Migrações SQL | **246** | 11 |
| Edge Functions | **8** | 0 |
| Entidades no `types.ts` | **311** | 44 |
| Políticas RLS vigentes | **1.068** | 73 |
| Documentação | `docs/` com 13 documentos + 4 skills do Claude | apenas `README.md` do Lovable |
| Estado | **Vivo, em manutenção ativa** | **Parado há ~7 meses** |

**Leitura:** o `flex` está congelado e nunca recebeu backend próprio (zero Edge
Functions, 11 migrações). O `hub` é o produto real — RH, folha de pagamento,
financeiro/orçamento, patrimônio, compras, contratos, governança, transparência,
ASCOM, programas, processos administrativos, portal público e PWA de inventário.

---

## 3. Banco de dados: qual cada um usa

Os dois usam **Supabase**, mas em **projetos diferentes e independentes**:

| Repo | Project ID | URL |
|---|---|---|
| `hub` | `qvbhejhcktcaftiamksd` | `https://qvbhejhcktcaftiamksd.supabase.co` |
| `flex` | `onvawvcdkqaraqedtbza` | `https://onvawvcdkqaraqedtbza.supabase.co` |

Não há qualquer compartilhamento de dados entre eles. Adotar o `hub` significa
adotar o banco `qvbhejhcktcaftiamksd` — que é o que já tem os dados reais.

### 3.1 Ponto de atenção sobre a titularidade dos projetos

Nenhum desses dois projetos aparece na conta Supabase acessível por esta sessão
(que lista apenas `Conectapol` e `JER Gestão`). Isso é coerente com projetos
**provisionados pelo Lovable Cloud** — criados dentro da organização do Lovable,
não na sua. Consequência prática:

- Você provavelmente **não tem o painel completo nem a senha do Postgres** desses
  projetos hoje.
- O `docs/MIGRACAO_SUPABASE_PROPRIO.md` já registra: *"Lovable Cloud não pode ser
  desconectado após habilitado"*.

**Antes de qualquer coisa, confirme no painel do Lovable/Supabase se você tem
acesso de owner e credenciais diretas do Postgres do projeto `qvbhejhcktcaftiamksd`.**
Sem isso, o `pg_dump` da migração não sai.

> Observação metodológica: a rede desta sessão bloqueia `*.supabase.co` (403 no
> proxy), então **não foi possível inspecionar os bancos ao vivo**. Tudo o que
> está neste documento sobre schema e RLS foi derivado do **replay do histórico
> de migrações** do repositório. É uma base sólida, mas o estado real precisa ser
> confirmado com `Database → Advisors` e introspecção quando houver acesso.

### 3.2 O `MIGRACAO_SUPABASE_PROPRIO.md` está desatualizado

O documento existente descreve um cenário que **não é mais o atual**:

| Documento diz | Realidade hoje |
|---|---|
| Project ID `tewgloptmijuaychoxnq` | `qvbhejhcktcaftiamksd` |
| 88 tabelas | ~250 tabelas + ~30 views |
| 62 migrações | 246 migrações |
| RBAC via `perfis` / `funcoes_sistema` / `perfil_funcoes` / `usuario_perfis` | **Essas tabelas não existem** no `types.ts` atual; o modelo real é `user_roles` + `user_modules` |

Esse doc precisa ser reescrito antes de servir de guia. É um plano para um banco
que o sistema já não tem.

---

## 4. Banco próprio na sua VPS

### 4.1 O que você precisa subir não é "um Postgres"

O sistema não usa só o banco. Ele depende de quatro serviços do Supabase:

1. **Postgres** — ~250 tabelas, ~1.068 políticas RLS, ~185 funções `SECURITY DEFINER`.
2. **GoTrue (Auth)** — login, recuperação de senha, JWT. `auth.users` é referenciado
   por FK em `profiles` e usado por `auth.uid()` dentro de **todas** as políticas RLS.
3. **Storage** — buckets `arbitros-docs`, `ascom-demandas`, `idjuv-backups`.
4. **Edge Functions (Deno)** — 8 funções, sendo 3 privilegiadas (`admin-create-user`,
   `admin-reset-password`, `delete-user`) que usam a *service role*.

Instalar só o Postgres na VPS **quebra o sistema inteiro**, porque toda a RLS
depende de `auth.uid()`. O caminho correto é **Supabase self-hosted** (o
`docker-compose` oficial), não Postgres puro.

### 4.2 Dimensionamento mínimo sugerido para a VPS

| Recurso | Mínimo | Recomendado |
|---|---|---|
| vCPU | 4 | 8 |
| RAM | 8 GB | 16 GB |
| Disco | 100 GB SSD | 200 GB SSD (NVMe) |
| SO | Ubuntu 22.04/24.04 LTS | idem |

Some a isso: certificado TLS (Let's Encrypt), um reverse proxy (Caddy ou Nginx),
backup automatizado **fora da VPS** (a `backup-offsite` já existe e serve para isso),
e SMTP próprio para os e-mails de recuperação de senha.

### 4.3 Roteiro de migração

1. **Confirmar acesso de owner** ao projeto `qvbhejhcktcaftiamksd` e obter a
   connection string do Postgres.
2. Subir Supabase self-hosted na VPS, com domínio e TLS.
3. `pg_dump` do projeto atual em três partes: `--schema-only`, `auth.users`, e
   `--data-only` do schema `public`. **A ordem importa**: `auth.users` antes de
   `public`, senão as FKs falham.
4. Restaurar na VPS e conferir: contagem de tabelas, de policies (`pg_policies`),
   de funções e de linhas por tabela crítica.
5. Migrar os buckets do Storage (cópia de objetos + recriação das policies).
6. Fazer deploy das 8 Edge Functions e configurar os segredos
   (`SUPABASE_SERVICE_ROLE_KEY`, `ALLOWED_ORIGINS`, `GEMINI_API_KEY`,
   `BACKUP_DEST_SERVICE_ROLE_KEY`).
7. Trocar as três variáveis `VITE_SUPABASE_*` e regerar
   `src/integrations/supabase/types.ts`.
8. Congelar o Lovable (ele commita sozinho no repo — ver §7.4) e validar em
   homologação antes do corte.

> **As senhas não migram.** Os hashes em `auth.users` são cifrados com o segredo
> do projeto de origem. Ou você migra o JWT secret junto, ou todo mundo passa por
> reset de senha no corte. Planeje isso — é o passo que costuma ser esquecido e
> derruba o dia da virada.

---

## 5. Sanidade de cada repositório

### 5.1 O que passa

| Verificação | `hub` | `flex` |
|---|---|---|
| `tsc --noEmit` | ✅ limpo | ✅ limpo |
| `vite build` | ✅ 37s | ✅ 16s |

Os dois compilam sem erro de tipo. Isso é melhor do que o normal para projeto
gerado por IA.

### 5.2 O que não passa

| Verificação | `hub` | `flex` |
|---|---|---|
| ESLint | ❌ **743 problemas** (699 erros) | ⚠️ 85 problemas (64 erros) |
| `npm audit` | ❌ **31 vulnerabilidades** (1 crítica, 22 altas) | ⚠️ menor |
| Bundle JS | ❌ **6,78 MB** em chunk único (1,81 MB gzip) | 2,59 MB (699 kB gzip) |
| Testes automatizados | ❌ nenhum | ❌ nenhum |
| `.env` versionado no git | ⚠️ sim | ⚠️ sim |

- A vulnerabilidade **crítica** é `jspdf` — e **tem correção disponível**.
- `xlsx@0.18.5` tem CVE de ReDoS/prototype pollution **sem correção no npm**
  (a SheetJS só publica no CDN próprio). Já mapeado em `docs/AUDITORIA_USUARIOS.md`.
- O bundle de 6,78 MB num único arquivo é ruim para órgão público com internet
  ruim. `React.lazy` nas rotas resolve — hoje `App.tsx` importa as 241 páginas
  estaticamente.
- `.env` está commitado e o `.gitignore` **não** exclui `.env` em nenhum dos dois.
  Hoje só há chave `anon` (que é pública por design), então o dano é zero — mas é
  uma armadilha esperando o dia em que alguém colar uma service role ali.

### 5.3 Achados de segurança no banco do `hub`

Derivados do replay das 246 migrações. Ordenados por gravidade:

#### 🔴 CRÍTICO — dados pessoais de árbitros abertos ao público

A migração `20260306220715` criou, e **nada depois removeu**:

```sql
CREATE POLICY "Consulta pública por protocolo"
ON public.cadastro_arbitros FOR SELECT
TO anon, authenticated
USING (true);
```

O nome diz "por protocolo", mas a condição é `true` — **não filtra nada**.
A tabela `cadastro_arbitros` contém: `cpf`, `rg`, `pis_pasep`, `data_nascimento`,
`banco`, `agencia`, `conta_corrente`, `endereco`, `celular`, `email`,
`tipo_sanguineo`, `foto_url`, `documentos_urls`.

A chave `anon` está no bundle JavaScript público (é assim que ela funciona).
Portanto **qualquer pessoa na internet** pode fazer
`GET /rest/v1/cadastro_arbitros?select=*` e baixar o cadastro inteiro.

Isso é incidente de dados pessoais sob a LGPD, em órgão público. O mesmo vale
para `cadastro_arbitros_modalidades`.

**Correção:** trocar por uma policy que exija o protocolo
(`USING (protocolo = current_setting('request.headers')::json->>'x-protocolo')`)
ou, melhor, mover a consulta pública para uma Edge Function / RPC `SECURITY DEFINER`
que receba o protocolo e devolva **apenas os campos não sensíveis** daquele registro.

#### 🟠 ALTO — 27 tabelas com escrita liberada a qualquer autenticado

Políticas `FOR INSERT/UPDATE/DELETE ... USING (true)` ainda vigentes, incluindo:

`itens_ficha_financeira`, `remessas_bancarias`, `retornos_bancarios`,
`itens_retorno_bancario`, `pre_cadastros`, `gestores_escolares`, `escolas_jer`,
`federacoes_esportivas`, `calendario_federacao`, `reunioes`,
`participantes_reuniao`, `modelos_mensagem_reuniao`, `historico_convites_reuniao`,
`config_assinatura_reuniao`, `documentos`, `frequencia_pacotes`,
`frequencia_arquivos`, `historico_patrimonio`, `config_paginas_historico`,
`demandas_ascom`, `demandas_ascom_anexos`, `gestores_escolares_historico`,
`fin_documentos`.

Em um sistema com folha de pagamento e remessa bancária CNAB, "qualquer usuário
logado pode alterar" não é aceitável.

#### 🟠 ALTO — logs de auditoria sem proteção contra adulteração

`audit_logs`, `fin_audit_log` e `audit_log_licitacoes` têm `INSERT` liberado a
qualquer autenticado. Log de auditoria que o auditado pode escrever livremente
não serve como evidência.

#### 🟡 MÉDIO — 104 tabelas com leitura liberada a qualquer autenticado

Inclui folha de pagamento, fichas financeiras e dados de servidores. Qualquer
usuário com login lê tudo, independentemente do módulo que ele tem. Isso anula na
prática o controle por módulo da interface.

#### 🟡 MÉDIO — desativar um usuário não o impede de entrar

`profiles.is_active` e `profiles.blocked_at` existem no banco, e a função
`usuario_tem_permissao` **checa** `is_active`. Mas o front — `AuthContext.tsx` e
`ProtectedRoute.tsx` — **nunca lê esses campos**. Resultado: um usuário
desativado pelo admin continua logando, navegando e lendo todas as 104 tabelas
com `SELECT USING(true)`. O bloqueio só surte efeito nas Edge Functions.

#### 🟡 MÉDIO — login não é auditado

`useAuditLog` tem um `logLogin()` pronto, com a ação `login` já no enum do banco,
e a tela `AuditoriaPage` já conta `login` e `login_failed`. Mas **`logLogin` não é
chamado em lugar nenhum**. O painel de auditoria mostra zero porque ninguém grava.

#### 🟡 MÉDIO — a documentação descreve um RBAC que o código não executa

`docs/RBAC_PERMISSOES.md` afirma que o `AuthContext` chama a RPC
`listar_permissoes_usuario`. **Não chama.** O código lê `user_roles` e
`user_modules` diretamente. Já registrado como achado M1 em
`docs/AUDITORIA_USUARIOS.md`, mas o `RBAC_PERMISSOES.md` continua dizendo o
contrário. Isso induz a erro quem for mexer.

### 5.4 Achado de segurança no `flex`

#### 🔴 CRÍTICO — cadastro público aberto

O `AuthPage.tsx` do `flex` expõe uma aba **"Cadastrar"** que chama `signUp()`
diretamente. Se os signups estiverem habilitados no projeto Supabase do `flex`,
**qualquer pessoa cria conta sozinha** e entra no sistema.

O `hub` já corrigiu isso: removeu a aba e a tela diz *"Acesso restrito a usuários
cadastrados pelo administrador"*. Mais um ponto a favor do `hub`.

---

## 6. O que o `flex` tem de melhor (e vale portar)

### 6.1 ⭐ O modelo de permissões granular — a peça principal

Esta é a resposta técnica direta ao seu pedido sobre política de usuários.

**No `hub`, a permissão é de nível de módulo.** O `AuthContext` faz:

```ts
supabase.from('user_modules').select('module').eq('user_id', userId)
```

Ou seja, `permissions` = a lista de módulos (`rh`, `financeiro`, `admin`…).
Como `hasPermission` sobe na hierarquia, quem tem o módulo `rh` ganha
automaticamente **`rh.*` inteiro** — inclusive `rh.servidores.excluir`.

E o `ROUTE_PERMISSIONS` do `hub` (438 linhas) mapeia rotas para permissões
granulares como `rh.servidores.criar`, `financeiro.folha.configurar`,
`governanca.portarias.visualizar` — que **nunca são concedidas individualmente**,
porque não existe onde concedê-las. O vocabulário fino existe; o mecanismo para
usá-lo, não.

**Na prática hoje o sistema só tem dois níveis: "super admin" e "tem o módulo".**
Não é possível dizer "o Fulano vê a folha mas não fecha a folha".

**O `flex` resolveu isso.** São exatamente as 3 entidades que ele tem e o `hub` não:

| Entidade | Para que serve |
|---|---|
| `role_permissions` | permissões concedidas a um **papel** (`admin`, `manager`, `user`, `guest`) |
| `user_permissions` | permissões concedidas **direto a um usuário** (exceções pontuais) |
| `get_user_role()` | RPC que devolve o papel do usuário |

E o `AuthContext` do `flex` faz a **união** das duas fontes:

```ts
const allPermissions = new Set<AppPermission>();
directPermissions?.forEach(p => allPermissions.add(p.permission));
rolePermissions?.forEach(p => allPermissions.add(p.permission));
```

É o modelo certo: **papel define o padrão, exceção por usuário ajusta o caso
particular.** O `flex` também traz um `ProtectedRoute` mais completo
(`permissionMode: 'any' | 'all'`, `allowedRoles`, `onAccessDenied`) e um
`PermissionGate` com `inverse` e atalhos `AdminOnly` / `ManagerOnly`.

O que **não** se aproveita do `flex` é o vocabulário: ele tem só 17 permissões
genéricas (`users.read`, `content.create`…). O vocabulário bom é o do `hub`, que
é do domínio real. **A receita é: mecanismo do `flex` + vocabulário do `hub`.**

### 6.2 Conteúdo institucional que o `hub` perdeu no caminho

Ao refatorar o layout (`MainLayout` → `ModuleLayout`), algumas páginas do `hub`
ficaram menores que as do `flex` — e a diferença **não é só layout, é conteúdo**:

| Página | `flex` | `hub` | O que falta no `hub` |
|---|---|---|---|
| `governanca/RegimentoInternoPage` | 431 | 252 | **Capítulos III e IV inteiros** (DIRAF, Diretorias Técnicas, Arts. 8º–12) |
| `governanca/EstruturaOrganizacionalPage` | 542 | 457 | mapa de nomes completos dos núcleos (NuDoc, NuPat, NuAC…) |
| `governanca/OrganogramaPage` | 436 | 359 | descrições institucionais de cada unidade |
| `TransparenciaPage` | 220 | 168 | cards de transparência (ex.: Cargos e Remuneração) |
| `governanca/MatrizRaciPage` | 312 | 279 | helpers de badge R/A/C/I |
| `governanca/RelatorioGovernancaPage` | 479 | 448 | seções do relatório |

São textos legais e institucionais já redigidos. Recuperá-los é copiar e colar —
barato, e evita reescrever regimento interno do zero.

### 6.3 O que **não** vale portar

Todo o resto. As 61 páginas do `flex` são versões anteriores das do `hub`, quase
sempre menores (ex.: `rh/RelatoriosRHPage` tem 509 linhas no `flex` contra 1.243
no `hub`; `rh/ServidorFormPage`, 1.127 contra 1.601).

---

## 7. Política de usuários profissional — arquitetura-alvo

Esta é a seção que responde ao seu requisito central. Ela é aditiva: nada do que
existe hoje precisa ser jogado fora.

### 7.1 Modelo de dados

```
auth.users ──1:1── profiles (is_active, blocked_at, requires_password_change, cpf, servidor_id)
                      │
                      ├── user_roles ──── roles ──── role_permissions ──┐
                      │                                                  ├──> permissões efetivas
                      ├── user_permissions (grant/deny individual) ──────┘
                      │
                      ├── user_org_units + module_access_scopes  → escopo (all/org_unit/local_unit/own)
                      └── user_security_settings                 → MFA, lockout, expiração de senha
```

Peças a criar:

1. **`permissions`** — catálogo único e versionado de permissões, populado a partir
   do `ROUTE_PERMISSIONS` e do `MODULE_PERMISSIONS` que já existem em
   `src/types/auth.ts`. Vira a fonte da verdade, com `codigo`, `nome`, `modulo`,
   `submodulo`, `tipo_acao`, `rota`, `sensivel` (bool).
2. **`roles` + `role_permissions`** — perfis nomeados e reutilizáveis
   (*Gestor de RH*, *Operador de Folha*, *Auditor*, *Leitor de Transparência*).
   Modelo vindo do `flex`.
3. **`user_permissions`** com coluna `efeito ('grant' | 'deny')` — exceções por
   usuário. O `deny` é o que permite *"tem o perfil de RH, mas não pode excluir
   servidor"* sem criar um perfil novo só para ele.
4. **`user_security_settings`** — a interface `UserSecuritySettings` **já está
   escrita** em `src/types/auth.ts` (MFA, `failedLoginAttempts`, `lockedUntil`,
   `lastLoginAt`). Falta só a tabela. Meio caminho andado.
5. **RPC `listar_permissoes_usuario`** reescrita para resolver, no banco:
   `is_active` → super admin → `role_permissions` → aplicar `grant` → subtrair
   `deny`. Uma chamada, uma resposta, RLS e front usando **a mesma** função.

### 7.2 Regra de precedência (a definir antes de codar)

```
super_admin        → tudo
deny explícito     → nega (vence tudo, menos super_admin)
grant explícito    → concede
role_permissions   → concede
herança de módulo  → concede apenas ações de LEITURA
nada disso         → nega
```

O último ponto é o mais importante: hoje ter o módulo `rh` concede
`rh.servidores.excluir`. Na arquitetura nova, **herdar módulo dá leitura; escrita,
aprovação e exclusão precisam de concessão explícita.** É o que separa RBAC de
verdade de um menu que esconde botão.

### 7.3 Login, senha e sessão — nível profissional

| Item | Hoje | Alvo |
|---|---|---|
| Rate limit | client-side, em memória (5 tentativas / 60s) — some ao dar F5 | **server-side**, em `user_security_settings.failed_login_attempts` + `locked_until`; backoff progressivo |
| Mínimo de senha | 6 no login, 8 na troca (inconsistente) | política única: ≥12 caracteres, verificação contra senhas vazadas (HIBP k-anonymity), bloqueio de CPF/nome/data de nascimento como senha |
| MFA | não existe (`input-otp` já está instalado) | TOTP via `supabase.auth.mfa`, **obrigatório** para super admin, folha e financeiro |
| Auditoria de login | `logLogin()` existe mas nunca é chamado | gravar `login`, `login_failed`, `logout`, `password_reset` em `audit_logs`, com IP e user-agent |
| Usuário desativado | front ignora `is_active` | `ProtectedRoute` checa `is_active`/`blocked_at` e desloga na hora; RLS idem |
| Sessão | sem expiração por inatividade | timeout de inatividade (30 min) com aviso; rotação de refresh token |
| Recuperação de senha | link por e-mail, funcional (PKCE + `exchangeCodeForSession`) — **é o ponto mais bem resolvido hoje** | manter, e acrescentar: expiração de 15 min, uso único, invalidação das demais sessões após a troca, notificação por e-mail de "sua senha foi alterada" |
| Primeiro acesso | `requires_password_change` já força a troca ✅ | manter; somar expiração periódica para perfis sensíveis |
| Sign-up | já removido da UI do `hub` ✅ | confirmar **"Enable signups" desativado** no painel (achado M4 em aberto) |
| E-mail | SMTP padrão do Supabase | SMTP próprio com domínio institucional (evita cair em spam — causa nº 1 de "não recebi o e-mail de recuperação") |

### 7.4 Tela de administração

O `hub` já tem `GestaoUsuariosPage`, `PainelPermissoesPage`, `UsuarioDetalhePage`,
`ModulePermissionsManager` e `CriarUsuarioDialog`. A base de UI existe. Falta:

- Matriz **perfil × permissão** com marcação em massa por módulo.
- Aba de exceções por usuário, mostrando **de onde vem cada permissão efetiva**
  (do perfil X, ou grant direto, ou negada) — isso elimina o suporte do tipo
  *"por que o Fulano vê essa tela?"*.
- **Simulador "ver como este usuário"**: escolhe um usuário e mostra o menu e as
  rotas que ele enxerga, sem precisar da senha dele.
- Trilha de auditoria de quem concedeu/revogou o quê e quando.

### 7.5 Defesa em profundidade (não negociável)

Toda concessão de permissão deve passar por **Edge Function privilegiada**, não
por escrita direta do client. Hoje `useAdminUsuarios` grava direto em
`user_modules` — a única barreira é a RLS. A migração
`20260824010000_rls_user_modules_user_roles_profiles.sql` já criou as políticas
restritivas, mas ela é **aditiva**: se sobrou uma policy antiga permissiva, ela
continua valendo (o Postgres combina policies do mesmo comando com **OR**).
Confirmar isso é pré-requisito para fechar o item C2 da auditoria.

---

## 8. Plano de execução

### Fase 0 — Parar o sangramento (dias, não semanas)

1. **Fechar a policy `anon` de `cadastro_arbitros`** (§5.3). Isso é hoje.
2. Rodar `Database → Advisors (security)` no projeto real e remover policies
   legadas permissivas.
3. Restringir escrita nas 27 tabelas da §5.3, priorizando as financeiras
   (`itens_ficha_financeira`, `remessas_bancarias`, `retornos_bancarios`).
4. Tornar `audit_logs` *append-only* e não escrevível pelo client.
5. `npm audit fix` (resolve a crítica do `jspdf` e 21 das 22 altas).
6. Adicionar `.env` ao `.gitignore` e commitar um `.env.example`.
7. Confirmar **"Enable signups" desativado** nos dois projetos Supabase.

### Fase 1 — Consolidar o `hub` como base única

8. Marcar o `flex` como arquivado no GitHub, com um aviso no `README` apontando
   para o `hub`.
9. Portar o conteúdo institucional da §6.2 (Regimento, Estrutura, Organograma,
   Transparência).
10. Reescrever `docs/MIGRACAO_SUPABASE_PROPRIO.md` para o schema real de hoje.
11. Corrigir `docs/RBAC_PERMISSOES.md` para descrever o que o código faz.

### Fase 2 — Política de usuários profissional (§7)

12. Migração: `permissions`, `roles`, `role_permissions`, `user_permissions`
    (com `efeito`), `user_security_settings` — **todas com RLS desde o primeiro
    dia** (usar o skill `migracao-segura-idjuv`).
13. Popular o catálogo de permissões a partir de `ROUTE_PERMISSIONS`.
14. Reescrever a RPC `listar_permissoes_usuario` com a precedência da §7.2.
15. Ligar o `AuthContext` na RPC (hoje ele lê as tabelas direto).
16. `ProtectedRoute`: checar `is_active`/`blocked_at`.
17. Lockout server-side, política de senha e auditoria de login.
18. MFA (TOTP) para perfis sensíveis.
19. Telas de administração da §7.4.
20. Rotear concessões por Edge Function.

> **Fase 2 é a que muda quem consegue entrar em quê.** Antes do merge, valide com
> perfis reais em homologação: usuários com módulos incompletos no banco vão
> perder acesso a rotas que hoje abrem. Esse aviso já consta na auditoria.

### Fase 3 — VPS

21. Executar o roteiro da §4.3, **depois** da Fase 2 — assim você migra um modelo
    de permissões já correto, em vez de carregar o atual para a casa nova.

### Fase 4 — Qualidade

22. `React.lazy` nas rotas (corta o bundle de 6,78 MB).
23. Zerar os 699 erros de ESLint.
24. Testes: pelo menos permissões, cálculo de folha e frequência.
25. Substituir `xlsx` por `exceljs` no caminho de importação de arquivo.

---

## 9. Resumo em cinco linhas

1. **`hub` é o sistema; `flex` é o ancestral congelado dele.** Adote o `hub`.
2. Os bancos são dois projetos Supabase distintos; o que importa é o do `hub`
   (`qvbhejhcktcaftiamksd`) — **confirme antes se você tem acesso de owner a ele.**
3. Para a VPS, suba **Supabase self-hosted**, não Postgres puro — a RLS inteira
   depende do `auth.uid()`.
4. Do `flex`, traga **duas coisas**: o mecanismo de permissões
   (`role_permissions` + `user_permissions`) e o conteúdo institucional perdido.
5. Existe **uma falha crítica aberta agora**: os dados pessoais dos árbitros
   (CPF, RG, conta bancária) estão legíveis por qualquer pessoa na internet.
   Corrija isso antes de qualquer outra coisa deste documento.
