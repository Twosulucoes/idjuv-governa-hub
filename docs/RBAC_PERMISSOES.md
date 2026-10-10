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

### Avisos e datas importantes

`avisos.gerenciar` (catálogo do módulo `comunicacao`, concedida em `user_modules.permissions` ou
`user_permissions`; admin passa por cima) libera publicar avisos e cadastrar datas. A mesma permissão
é exigida pela RLS de `avisos` e `datas_importantes` e mostra a aba Gerenciar em `/avisos`. Ler avisos
não exige permissão: a RLS filtra pelo público-alvo (`can_access_module` dos módulos do aviso).

### Frequência: validação e autoatendimento

- `/rh/frequencia/validacao` (`ValidacaoFrequenciaPage`) abre para quem tem `rh.aprovar` **ou**
  `rh.frequencia.lancar` (rota, `ROUTE_PERMISSIONS` e item de menu com `permissions`). Dentro da
  página, a etapa da chefia (aprovar abono, validar fechamento) aparece só com `rh.aprovar`; as
  etapas do RH (aprovar como RH, consolidar, reabrir) só com `rh.frequencia.lancar`; fechar a
  competência só com `rh.frequencia.configurar` (mesma permissão de `/rh/frequencia/configuracao`).
  Ninguém decide sobre a própria solicitação nem sobre o próprio fechamento (comparação com o
  servidor vinculado ao usuário, `useMeuServidor`). Não há permissão fina
  `rh.frequencia.validar/consolidar` no catálogo.
- **Essa separação por papel e a trava de auto-aprovação existem só no front.** A RLS de
  `solicitacoes_abono`, `frequencia_fechamento` e `config_fechamento_frequencia` libera UPDATE/INSERT
  para qualquer usuário com o módulo `rh` (`can_access_module`), sem checar etapa, chefia, própria
  linha nem `permite_reabertura`. Quem tem o módulo consegue, pela API, aprovar o próprio abono,
  pular a chefia ou fechar a competência. A chefia **sem** o módulo vê a tela, mas o banco recusa
  a ação. Pendência registrada para a migração de RLS: `is_chefia_de(servidor_id)`,
  `servidor_id <> meu_servidor_id()` e `usuario_tem_permissao('rh.frequencia.configurar')` em
  `config_fechamento_frequencia` (ver spec `docs/superpowers/specs/2026-10-09-fluxo-frequencia-design.md`).
- `/rh/minha-frequencia` (`MinhaFrequenciaPage`) só exige login, como `/rh/meus-dados`. As
  queries são filtradas pelo `servidores.user_id = auth.uid()` e a RLS de `solicitacoes_abono`,
  `frequencia_fechamento` e `frequencia_mensal` tem a cláusula própria (`meu_servidor_id()`).
  Porém a leitura de `servidores` hoje só é liberada a quem tem o módulo `rh`, então na prática
  o autoatendimento funciona só para esse perfil — e para ele a cláusula própria não é barreira.
  Mesma dívida de `/rh/meus-dados`: policy de leitura da própria linha em `servidores` e
  alinhamento `profiles.servidor_id` ↔ `servidores.user_id` (migração de RLS).

### Folha: edição da ficha

- No detalhe da folha (`/folha/:id` → `FichaFinanceiraDialog`), incluir/editar/excluir itens da
  ficha, cadastrar/suspender/quitar/lançar consignações e manter dependentes IRRF exige
  `financeiro.folha.processar` (catálogo do módulo `financeiro`; concedida a `admin` e `manager` em
  `role_permissions`, e super admin passa por cima) **e** folha em
  `previa`, `aberta` ou `reaberta` (`podeEditarFicha`, `src/lib/folhaFichaRegras.ts`). Sem isso os
  botões não aparecem e o diálogo marca "Somente leitura". A rota `/folha/:id` continua
  `<ProtectedRoute>` sem permissão (mudar guard de rota aguarda confirmação).
- **Essa barreira existe só no front.** A RLS de `itens_ficha_financeira`, `fichas_financeiras`,
  `folhas_pagamento`, `consignacoes` e `dependentes_irrf` libera escrita a qualquer usuário com o
  módulo `rh` (`can_access_module('rh')`), sem checar `financeiro.folha.processar`. No banco, os
  triggers `trg_bloquear_alteracao_item_ficha_fechada`/`trg_bloquear_alteracao_ficha_fechada` barram
  UPDATE/DELETE com a folha `fechada` (com exceção para admin), mas **não INSERT** em
  `itens_ficha_financeira` nem em `fichas_financeiras`; o front relê o status da folha antes de
  inserir, mas quem tem o módulo `rh` consegue, pela API, inserir item em folha fechada ou mudar o
  próprio `folhas_pagamento.status` por UPDATE direto (e aí os triggers deixam de valer). O recálculo
  de totais (ficha → folha) é feito pelo cliente em quatro comandos, não atômico (após um INSERT, se
  o recálculo falhar o front tenta excluir o item). A duplicidade de "Lançar na ficha" é checada só
  no cliente (sem índice único). Pendências para a migração 13b (Onda B): trigger BEFORE INSERT e RPC
  `recalcular_ficha_financeira` (M2), índice único parcial `(ficha_id, lower(referencia))` para
  descontos com referência, policies por permissão (M4), auditoria (M5) — ver
  `superpowers/specs/2026-10-09-folha-detalhe-edicao-design.md`.
- Erros do banco (RLS 42501, trigger P0001, CHECK 23514, duplicidade 23505, obrigatório 23502,
  "0 linhas" PGRST116) chegam ao usuário em toast legível via `descreverErroBanco`. Só o texto do
  `RAISE` dos triggers (P0001) é repassado; os demais viram mensagem fixa com o código, sem nome de
  tabela/constraint nem o `DETAIL` do Postgres (que em CHECK traz a linha inteira, com dados pessoais).

### Importação de dados

Cada importador declara a sua permissão (`src/lib/importacao/registro.ts`) e a RPC dele confere a
mesma no banco. Hoje: `orcamento.importar` (catálogo do módulo `financeiro`) para o QDD do FIPLAN —
exigida pela RPC `importar_qdd_fiplan` (junto com acesso ao módulo financeiro), pela rota
`/admin/importacoes` e pelo botão "Importar QDD (FIPLAN)" em `/financeiro/qdd`. Quem só tem
`orcamento.visualizar` vê o QDD mas não importa. Atenção: a RLS atual de `fin_dotacoes` e dos
catálogos orçamentários libera escrita a quem acessa o módulo financeiro, então `orcamento.importar`
controla a tela e a RPC (e garante o registro em `importacoes`), não a escrita direta nessas tabelas.
Restringir isso é mudança de RLS existente (pendente, exige decisão). O histórico (`importacoes`) é lido por quem acessa o
módulo da importação.

### Envio de e-mail e WhatsApp

`admin.envios` (ver a tela `/admin/envios` e o histórico) e `admin.envios.configurar` (editar a
configuração, gravar credenciais e enviar teste), no catálogo do módulo `admin`; admin passa por cima.
Nenhuma das duas vem por padrão de papel: conceda em `user_permissions` a quem administra o envio (as duas juntas: o item de menu filtra por `admin.envios`). A
rota aceita qualquer das duas; a RLS de `config_envio`/`envios_log`, a RPC `salvar_segredo_envio` e a
Edge Function `enviar-notificacao` exigem a mesma permissão.

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

### Exemplo: inventário de campo (fase 1)

- Rota `/inventario/campanhas/:id/painel`: `patrimonio.visualizar` no
  `ProtectedRoute`. O modo "Vistoria de Unidade" fica dentro de
  `/patrimonio-mobile`.
- No banco (migração `20261009160000`): ler e gravar a situação das unidades e
  enviar fotos exige o módulo `patrimonio` ou `patrimonio_mobile`. A permissão
  granular `patrimonio.tramitar` (`has_permission_code`) é exigida para apagar
  foto de evidência, para alterar foto de outro autor e para sobrescrever ou
  apagar arquivo no bucket `inventario-evidencias`. Detalhes em
  [BANCO_DE_DADOS.md](./BANCO_DE_DADOS.md).

## Rotas públicas

Rotas sob `<PublicPageGuard rota="...">` não exigem login; verificam apenas o
status de publicação/manutenção da rota (tabela `config_paginas_publicas`). Ex.:
`/`, `/transparencia/*`, `/curriculo`, `/cadastrogestores`, `/cadastro-arbitros`,
`/ascom/solicitar`, notícias e galerias públicas.
