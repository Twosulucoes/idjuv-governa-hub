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

### Identidade no banco só de migrações

Num banco montado só por `supabase/migrations/` (sem o baseline), `profiles`, `user_roles` e
`user_modules` tinham as policies `acesso_total_*` (`auth.uid() IS NOT NULL`), que somadas por OR
anulavam as de administrador: qualquer logado se dava o papel `admin`, ganhava módulos, trocava o
próprio `servidor_id`/`is_active` e lia todos os perfis. A migração
`supabase/migrations/20261010080000_s0_identidade_policies.sql` deixa as três tabelas como no baseline
(`supabase/baseline/overlay/12_protecao_profiles.sql` e classe `proprio_user` do mapa de RLS):

- `profiles`: cada um lê e edita a própria linha (só `full_name`, `avatar_url`,
  `requires_password_change`); identidade, vínculo e bloqueio só o papel admin muda (trigger
  `profiles_proteger_colunas`); INSERT e DELETE só admin; admin lê todos.
- `user_roles` e `user_modules`: usuário ativo lê as próprias linhas; só o papel admin escreve.

Consequência no front para quem não tem o **papel** admin: nomes de outros usuários vindos de
`profiles` (autor de importação, aprovador, responsável no organograma, nomes na auditoria) chegam
vazios, e telas de gestão de usuários/permissões abertas por permissão `admin.*` concedida via módulo
não listam nem gravam papéis e módulos de terceiros.

A migração `supabase/migrations/20261010170000_onda0_permissoes_urgente.sql` (Onda 0 da revisão de
permissões de 10/10/2026) fecha o restante do mesmo tipo de furo nesse banco:

- `module_permissions_catalog` e `module_settings`: usuário ativo lê; só o papel admin escreve. Antes
  qualquer logado renomeava um código do catálogo e, pelo `ON UPDATE CASCADE` de `role_permissions`,
  dava ao próprio papel a permissão que quisesse. `module_access_scopes` só admin; `user_org_units`
  como `user_roles`.
- `fn_gerar_numero_financeiro` aceita só a lista fechada de tipos (havia injeção de SQL executável sem
  login).
- `usuario_eh_super_admin`, `is_active_user()`, `has_role`, `has_module`, `can_access_module(app_module)`,
  `usuario_tem_permissao` e `usuario_tem_permissao_financeira` deixam de responder "sim" a qualquer
  logado e seguem papel/módulo/`has_permission_code`. `is_admin_user` e `has_permission_code` ainda
  **não** exigem perfil ativo nesse banco (o baseline exige).
- `gestores_escolares`, `escolas_jer` (escrita), `cadastro_arbitros` e `cadastro_arbitros_modalidades`:
  gestão só com o módulo dono; o público só insere (gestores com status `aguardando`, pelas RPCs
  `registrar_gestor_publico` e `consultar_gestor_por_cpf`). `gestores_escolares_historico` vira trilha:
  o módulo lê, ninguém escreve por API.
- `anon` executa só as RPCs dos formulários públicos (`registrar_denuncia_publica`, `obter_dado_oficial`,
  `arbitro_cpf_cadastrado`, `obter_protocolo_arbitro`, `consultar_gestor_por_cpf`,
  `registrar_gestor_publico`, `gerar_codigo_pre_cadastro`); `authenticated` mantém o que tinha. Função
  nova criada pelo `postgres` nasce sem EXECUTE para `anon`.

As demais ~190 tabelas com `acesso_total_*` nesse banco continuam abertas a qualquer logado (Onda 1).

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
- **No banco**, a separação por etapa e a trava de autoaprovação vêm da B2 (mesclada na PR #69; ver
  [a subseção da B2](#férias-licenças-viagens-e-frequência-rls-por-permissão-onda-b--b2)). Ficam de fora:
  chefia **sem** o módulo `rh` (vê a tela, o banco recusa), `permite_reabertura` e restringir
  `rh.aprovar` à própria equipe.
- `/rh/minha-frequencia` (`MinhaFrequenciaPage`) só exige login, como `/rh/meus-dados`. As queries
  usam o servidor do perfil (`user.servidorId` do `AuthContext`, vindo de `profiles.servidor_id`), a
  mesma chave da RLS (`meu_servidor_id()`). Antes usavam `servidores.user_id`, coluna que nada preenche.
  A leitura da própria linha em `servidores`, `vinculos_servidor` e `lotacoes` vem da B2.

### Folha: RLS por permissão (Onda B / B1)

Migração `supabase/migrations/20261010070000_onda_b_folha_rls_permissao.sql` (spec
`docs/superpowers/specs/2026-10-10-onda-b-folha-seguranca-design.md`; mesclada na PR #63). A folha pertence ao módulo `rh`: **ler** exige o módulo; **escrever** exige o módulo **e** a
permissão granular que o front já usava como gate, conferida no banco por `can_access_module` +
`has_permission_code` (o papel admin passa pelos dois; o perfil precisa estar ativo; uma permissão avulsa em
`user_permissions` sem o módulo `rh` não escreve). As policies `acesso_total_*` dessas dez tabelas são
removidas na mesma transação, e a migração também tira de `anon` todo privilégio nas dez tabelas e de
`authenticated` o TRUNCATE/TRIGGER/REFERENCES (no banco só de migrações a API tinha tudo).

| Tabela | Leitura (SELECT) | Escrita (INSERT/UPDATE/DELETE) |
|---|---|---|
| `folhas_pagamento` | módulo `rh` **ou** o servidor que tem ficha nela (contracheque: `/rh/meu-contracheque` lê `folhas_pagamento!inner`) | módulo `rh` + `financeiro.folha.processar` |
| `lancamentos_folha`, `consignacoes`, `dependentes_irrf` | módulo `rh` | módulo `rh` + `financeiro.folha.processar` |
| `fichas_financeiras` | módulo `rh` **ou** o próprio servidor (`servidor_id = meu_servidor_id()`) | módulo `rh` + `financeiro.folha.processar` |
| `itens_ficha_financeira` | módulo `rh` **ou** itens da própria ficha | módulo `rh` + `financeiro.folha.processar` |
| `parametros_folha`, `rubricas`, `tabela_inss`, `tabela_irrf` | módulo `rh` | módulo `rh` + `financeiro.folha.configurar` |

- **RPC `processar_folha_pagamento`**: exige `financeiro.folha.processar` no início do corpo (erro `42501`,
  que o handler de erros da função não engole) e volta a ser executável por `authenticated` — no baseline
  estava sem EXECUTE e o botão Processar falhava; `anon` não executa. Fechar/reabrir folha não mudou:
  `usuario_pode_fechar_folha` exige `rh.admin`, código que não existe no catálogo, logo só o papel admin
  fecha e reabre (decisão de negócio pendente).
- **Folha fechada** barra também o INSERT em `fichas_financeiras` e `itens_ficha_financeira`, o DELETE da
  própria folha (trigger `trg_folhas_proteger_exclusao`; antes, quem tinha `processar` apagava a folha fechada
  com fichas e itens em cascata) e a saída de ficha/item de uma folha fechada para outra (os triggers de
  UPDATE passam a olhar a origem, não só o destino). Admin passa; erro `42501` em todos.
- **Catálogo**: `financeiro.folha.visualizar|processar|configurar` passam a `module_code = 'rh'` em
  `module_permissions_catalog` (e de `MODULE_PERMISSIONS.financeiro` para `.rh` em `src/types/auth.ts`)
  **sem mudar de código** — gates do front, `role_permissions` e `user_permissions` continuam iguais. Como a
  permissão de papel só vale para quem tem o módulo dela, `manager` com o módulo `rh` passa a ter
  `processar` e `configurar` por papel; quem só tem o módulo `financeiro` deixa de recebê-las por papel.
  `user` (só `visualizar`) perde escrita na folha.
- **Rotas** (`ProtectedRoute` e `ROUTE_PERMISSIONS`): `/folha`, `/folha/fichas`, `/folha/gestao` e
  `/folha/:id` exigem o módulo `rh` e `financeiro.folha.visualizar`; `/folha/rubricas` e
  `/folha/configuracao`, o módulo `rh` e `financeiro.folha.configurar`. `ProtectedRoute` e `AuthContext`
  não mudaram.
- **Auditoria** (`fn_audit_trigger('rh')`) em `folhas_pagamento`, `itens_ficha_financeira` e `consignacoes`.
  `fichas_financeiras` (dados bancários, PIS) e `dependentes_irrf` (CPF) ficam **sem** o trigger genérico,
  que copia a linha inteira para `audit_logs`. Sem CPF nem dado bancário na trilha, mas `consignacoes` e
  `itens_ficha_financeira` ainda são dado financeiro de pessoa identificável (`servidor_id`, valores); só o
  papel admin lê `audit_logs`, e a auditoria com mascaramento é pendência.
- Quem perde acesso: usuário com o módulo `rh` que escrevia na folha **sem** a permissão, direto na API; e
  quem tinha a permissão avulsa sem o módulo `rh`. No banco só de migrações, quem não tem o módulo `rh` deixa
  de ler `folhas_pagamento` inteira (lia tudo pelas `acesso_total_*`); o servidor continua lendo a folha das
  suas fichas.

Conferência pós-merge, pelo administrador, no banco real:

```sql
SELECT count(*) FROM pg_policies
 WHERE policyname ILIKE 'acesso_total%'
   AND tablename IN ('folhas_pagamento','fichas_financeiras','itens_ficha_financeira','consignacoes',
                     'dependentes_irrf','lancamentos_folha','parametros_folha','rubricas','tabela_inss','tabela_irrf');
-- esperado: 0
SELECT has_function_privilege('authenticated', 'public.processar_folha_pagamento(uuid)', 'EXECUTE'),  -- true
       has_function_privilege('anon',          'public.processar_folha_pagamento(uuid)', 'EXECUTE');  -- false
SELECT permission_code, module_code FROM module_permissions_catalog
 WHERE permission_code LIKE 'financeiro.folha.%';  -- module_code = rh nas três linhas
```

Fora desta entrega, com spec própria: férias, licenças, viagens e frequência por permissão,
leitura da própria linha em `servidores` e autoatendimento (B2, subseção abaixo); storage
`frequencias`/`documentos-requerimento`/`documentos` e a Edge Function `download-frequencia` (B3).
Também pendentes: RPC de recálculo atômico da ficha e preservação dos itens manuais no reprocessamento
(dependem da PR #56), quem fecha a folha, auditoria mascarada das tabelas com dado pessoal e a remoção de
`src/hooks/useMotorFolha.ts` (motor de folha no cliente, sem uso por página).

### Férias, licenças, viagens e frequência: RLS por permissão (Onda B / B2)

Migração `supabase/migrations/20261010090000_onda_b_rh_permissoes.sql` (spec
`docs/superpowers/specs/2026-10-10-onda-b-rh-permissoes-design.md`; mesclada na PR #69 em 2026-10-10), mais
a correção de contornos `supabase/migrations/20261010100000_onda_b_rh_contornos.sql` (**em PR rascunho**;
achados da segunda revisão de segurança). Depende da S0
(`supabase/migrations/20261010080000_s0_identidade_policies.sql`, PR #67) e da B1 (PR #63). Sem a S0, no
banco só de migrações, qualquer logado trocaria o próprio `profiles.servidor_id` e a leitura da "própria
linha" exporia qualquer servidor. O que muda com a migração de contornos está marcado como "(contornos)".

Regra geral: nas 12 tabelas de férias, licenças, viagens, ponto e frequência, **gravar** exige o módulo
`rh` **e** um código do catálogo (nenhum código novo); `tipos_abono` também, desde os contornos.
`servidores`, `vinculos_servidor`, `lotacoes` e `cargos` seguem gravados pelo módulo, com as exceções da
tabela. O papel admin passa em tudo. As `acesso_total_*` (e as `rh_module_*`/`vinculos_*` que sobravam) são
removidas; `anon` perde todo privilégio nessas tabelas e `authenticated` perde TRUNCATE/TRIGGER/REFERENCES. A migração também tira de PUBLIC, `anon` e `authenticated` o EXECUTE de
`fn_atualizar_situacao_servidor` (só os triggers a chamam), como o overlay 40.

Posse ("próprio") e a trava "nunca a própria":

- **Leitura própria**: `servidor_id = meu_servidor_id()`. Em `banco_horas`, `lancamentos_banco_horas` (pelo
  banco de horas pai) e `solicitacoes_ajuste_ponto` a coluna `servidor_id` aponta para `profiles`, então a
  posse é do **usuário**: `servidor_id = auth.uid()`.
- **Nunca a própria** (sufixo `;sem_autoaprovacao`): quem grava pelo caminho da permissão não grava a linha
  que é sua. A conferência usa `eh_meu_servidor(<servidor>)`: verdadeira se o servidor é o do perfil
  (`meu_servidor_id()`) ou, se o perfil não tem vínculo, se os dígitos do CPF do perfil batem com os do
  servidor, completados com zeros à esquerda até 11 (contornos; CPF vazio nunca casa). Na posse por
  usuário, compara com `auth.uid()`. O papel admin passa.

| Tabela | Leitura | Gravação (INSERT/UPDATE) | Exclusão |
|---|---|---|---|
| `ferias_servidor` | `rh` ou o próprio | `rh` + `rh.ferias.criar\|editar\|gerenciar`, nunca a própria | só o papel admin |
| `licencas_afastamentos` | `rh` ou o próprio | `rh` + `rh.licencas.criar\|editar\|gerenciar`, nunca a própria | `rh` + `rh.licencas.gerenciar`, nunca a própria |
| `viagens_diarias` | `rh` ou `financeiro`, ou o próprio | `rh` ou `financeiro` + `rh.viagens.criar\|editar\|gerenciar` ou `financeiro.diarias.gerenciar`, nunca a própria | só o papel admin |
| `registros_ponto`, `frequencia_mensal` | `rh` ou o próprio | `rh` + `rh.frequencia.lancar\|criar\|editar`, nunca a própria | igual à gravação |
| `banco_horas` | `rh` ou o próprio usuário | `rh` + `rh.frequencia.lancar`, nunca o próprio saldo | igual à gravação |
| `lancamentos_banco_horas` | `rh` ou os do próprio banco de horas (usuário) | `rh` + `rh.frequencia.lancar`, nunca no próprio banco | igual à gravação |
| `solicitacoes_abono` | `rh` ou o próprio | o servidor insere o próprio pedido (status e decisão forçados por `forcar_campos_iniciais`); quem decide: `rh` + `rh.aprovar` ou `rh.frequencia.lancar`, nunca a própria; etapas pelo trigger | `rh` + `rh.frequencia.lancar`, nunca a própria |
| `solicitacoes_ajuste_ponto` | `rh` ou o próprio usuário | o usuário insere o próprio pedido (campos forçados); quem decide: `rh` + `rh.aprovar` ou `rh.frequencia.lancar`, nunca o próprio; etapas pelo trigger (contornos) | `rh` + `rh.frequencia.lancar`, nunca o próprio (contornos; antes, um dos dois códigos) |
| `justificativas_ponto` | `rh` ou as do próprio ponto (posse por `registros_ponto`) | o servidor insere para o próprio ponto; quem decide: `rh` + `rh.aprovar` ou `rh.frequencia.lancar`, nunca sobre o próprio ponto; etapas pelo trigger (contornos) | `rh` + `rh.frequencia.lancar`, nunca sobre o próprio ponto |
| `frequencia_fechamento` | `rh` ou o próprio | `rh` + `rh.aprovar` ou `rh.frequencia.lancar`, nunca a própria; etapas pelo trigger | `rh` + `rh.frequencia.lancar`, nunca a própria |
| `config_fechamento_frequencia` | `rh` | `rh` + `rh.frequencia.configurar` | idem |
| `servidores` | `rh` ou a própria linha (`id = meu_servidor_id()`) | módulo `rh`, nunca a própria ficha (contornos) | `rh` + `rh.servidores.excluir`, nunca a própria (contornos) |
| `vinculos_servidor`, `lotacoes` | `rh` ou os próprios | módulo `rh` | módulo `rh` |
| `cargos` | qualquer usuário ativo (catálogo, sem dado pessoal) | módulo `rh` | módulo `rh` |
| `tipos_abono` (contornos) | qualquer usuário ativo (catálogo) | `rh` + `rh.frequencia.configurar` | idem |

`tipos_abono` entrou na lista porque `exige_aprovacao_rh` decide se a chefia encerra o fluxo do abono:
antes, quem tinha o módulo trocava o tipo, encerrava o fluxo e desfazia. Em `servidores`, sem a trava o RH
sem vínculo trocava o CPF da própria ficha para escapar de `eh_meu_servidor`.

O trigger `validar_etapa_frequencia` (BEFORE INSERT, UPDATE e DELETE) separa as etapas em
`solicitacoes_abono` e `frequencia_fechamento` e, desde a migração de contornos, também em
`justificativas_ponto` e `solicitacoes_ajuste_ponto`. O papel admin, a service role e funções internas
passam; a recusa é erro `42501` com a etapa na mensagem. "Chefia" abaixo é quem tem `rh.aprovar` sem
`rh.frequencia.lancar`.

Abono:

- `created_by` é sempre quem insere (`auth.uid()`, também para quem tem a permissão) e não muda depois
  (contornos).
- A chefia nunca muda `servidor_id`, `tipo_abono_id`, datas, horas, justificativa nem `documento_url`,
  nem com o pedido em `pendente` (contornos: a chefia decide, não edita). `motivo_rejeicao` ela só grava ao
  rejeitar um pendente; `aprovado_chefia_*`, só junto com a decisão sobre um pendente.
- A chefia só decide a partir de `pendente`, para `aprovado_chefia`, `rejeitado` ou `aprovado`. O
  `aprovado` vale só com a aprovação da chefia no mesmo comando e quando o tipo de abono da linha (o de
  antes do comando) dispensa o RH (`tipos_abono.exige_aprovacao_rh = false`), como `chefiaEncerraFluxo` no
  front.
- `aprovado_chefia_*` e o status `aprovado_chefia` exigem `rh.aprovar`, também para o RH.
- `aprovado_rh_*` e qualquer outra mudança de status (rebaixar o aprovado, reabrir o rejeitado, cancelar)
  exigem `rh.frequencia.lancar`.

Fechamento:

- `servidor_id`, `ano` e `mes` não mudam depois de criados (só o papel admin corrige).
- `assinado_servidor`/`assinado_servidor_em` só o dono da linha muda.
- Linha já consolidada (`consolidado_rh`): nada muda sem `rh.frequencia.lancar`.
- Validar (`validado_chefia*`) exige `rh.aprovar`. Desfazer a validação, `consolidado_rh*`, `reaberto*` e
  `justificativa_reabertura` exigem `rh.frequencia.lancar`.

Justificativa e ajuste de ponto (contornos):

- Sem `rh.frequencia.lancar`, o texto do pedido não muda (justificativa: ponto, tipo, descrição, arquivo;
  ajuste: servidor, ponto, data, tipo, campo, horários, motivo, comprovante).
- A chefia só decide com `rh.aprovar`, de `pendente` para `aprovada` ou `rejeitada`; `aprovador_id`,
  `data_aprovacao` e `observacao_aprovador` ela só grava junto com essa decisão. Outras mudanças de status
  exigem `rh.frequencia.lancar`.

Nas quatro tabelas:

- Excluir exige `rh.frequencia.lancar` (na policy e no trigger).
- **Autoria pelo banco**: a etapa que acontece no comando grava o seu par (`<etapa>_por`/`<etapa>_em`, ou
  `aprovador_id`/`data_aprovacao`) com `auth.uid()` e `now()`, mesmo que o cliente não o envie; o valor
  enviado é ignorado. Enquanto a etapa vale (status ou flag ativos), o par não pode ser apagado
  (contornos). No abono, ir para `aprovado` grava o par da chefia quando é ela quem encerra o fluxo, e o do
  RH nos demais casos; a rejeição do abono não tem coluna de autoria.
- No INSERT a comparação é com a linha vazia: o upsert do front não cria linha já consolidada por quem só
  valida.
- **Não bloqueado**: o RH (`rh.frequencia.lancar`) aprovar um pendente que exige chefia, pulando a chefia.
- **Pedido nasce pendente** (contornos): sem `rh.frequencia.lancar`, o INSERT de abono, justificativa ou
  ajuste com status já decidido dá `42501`, e os campos de decisão nascem vazios. A chefia ainda registra um
  pedido pendente em nome de outro servidor; o `created_by` fica sendo ela.
- Status nulo é recusado, e o status legado `aprovado_rh` do abono só o admin grava (contornos).
- Fora da etapa ativa, os pares de autoria ficam vazios; o par de uma etapa que já aconteceu fica como
  estava, sem aceitar valor novo (contornos).

`forcar_campos_iniciais` nos pedidos do RH (abono, ajuste, justificativa) isenta só quem tem o módulo
**e** `rh.aprovar` ou `rh.frequencia.lancar`, e nunca na própria linha (`eh_meu_servidor`; no ajuste, posse
por usuário): quem pede para si sempre grava `status = pendente` e campos de decisão vazios. Formato em
[BANCO_DE_DADOS.md](./BANCO_DE_DADOS.md).

Front:

- `GestaoLicencasPage`: criar com `rh.licencas.criar|gerenciar`, editar com `rh.licencas.editar|gerenciar`,
  excluir com `rh.licencas.gerenciar`; alterar e excluir pedem `.select('id')` e não mostram sucesso
  quando a RLS não alterou nenhuma linha. `GestaoFrequenciaPage`: lançar falta ou ocorrência
  (`LancarFaltaDialog`) com `rh.frequencia.lancar|criar|editar`. Super admin passa.
- Validação da frequência: "Rejeitar" um abono já aprovado pela chefia só aparece para o RH
  (`rh.frequencia.lancar`).
- Autoatendimento: `useMeuServidor` (`src/hooks/useMeusDados.ts`), `useMeusContracheques` e
  `useServidorLogado` (`src/hooks/useContracheque.ts`) buscam pelo `user.servidorId` do perfil (antes,
  por `servidores.user_id`, que nada preenche). Atalhos para Meus Dados, Minha Frequência e Meu
  Contracheque em `/meu-perfil` (a seção RH do menu não aparece para quem não tem o módulo).
- Menu: `/rh/frequencia/configuracao` pede `rh.frequencia.configurar`, como a rota.
- `MODULE_PERMISSIONS.rh` (`src/types/auth.ts`) traz os códigos do catálogo do RH que faltavam.

**Quem perde acesso** (padrão adotado: "só com permissão"; decisão ainda pendente com o usuário):

- o papel `user` (só `visualizar`) e quem tem o módulo `rh` sem o código deixam de gravar licenças e de
  lançar frequência, ponto e banco de horas;
- quem tem o módulo sem o código deixa de gravar férias, viagens, abono, ajuste, justificativa e fechamento;
- ninguém (exceto o papel admin) decide sobre o próprio pedido ou o próprio fechamento;
- **ninguém grava a própria linha** pelo caminho da permissão: RH ou gestor que também é servidor não
  lança o próprio ponto, frequência, férias, licença, viagem ou banco de horas; outro colega lança;
- a chefia (sem `rh.frequencia.lancar`) só decide: não edita os dados de abono, justificativa ou ajuste
  (nem pendentes, desde os contornos) e não mexe em fechamento já consolidado;
- quem tem o módulo `rh` não edita nem exclui a própria ficha em `servidores` (contornos): servidor do RH
  não altera os próprios dados em `ServidorFormPage`, e as mutações de vínculo que atualizam `servidores`
  (ativação, situação, cargo e unidade atuais) falham na própria ficha; outro colega altera;
- só quem tem `rh.frequencia.configurar` grava `tipos_abono` (contornos);
- só o admin muda o número do CPF em `servidores` (trigger `trg_servidores_proteger_cpf`, compara só os
  dígitos; regravar o mesmo CPF com ou sem pontuação continua livre), porque `eh_meu_servidor` casa pelo CPF
  (contornos). Ainda depende de cadastro: perfil sem vínculo **e** sem CPF não tem proteção contra
  autoaprovação; o admin deve vincular quem tem `rh.aprovar` ou `rh.frequencia.lancar`;
- excluir férias e viagens passa a ser só do papel admin; excluir abono, fechamento, justificativa e ajuste
  exige `rh.frequencia.lancar`; excluir servidor exige `rh.servidores.excluir`.

Leitura não diminui: o servidor passa a ler a própria linha em `servidores`, `vinculos_servidor` e
`lotacoes`, e qualquer usuário ativo lê `cargos`.

Fora da B2: chefia sem o módulo `rh` validando a equipe; pedido de férias ou de viagem pelo servidor;
subunidades na chefia; storage e `download-frequencia` (B3); `pensoes_alimenticias`,
`historico_funcional`, `portarias_servidor`, `designacoes`, `provimentos` e `cessoes` (seguem por módulo);
máscara de CID em licenças. **Assinatura do servidor no fechamento**: o trigger já restringe
`assinado_servidor*` ao dono, mas o servidor ainda não assina pela API, porque não há policy de UPDATE para
o dono da linha (e a assinatura não tem tela).

Pendente, anterior à B2: quem tem o módulo `rh` muda `servidores.situacao` de outro servidor, e isso
bloqueia o perfil vinculado (sincronização por situação do servidor).

#### Dimensionamento de quem perde acesso

Para saber quem perde acesso, o administrador pode rodar no banco de produção, numa conexão de
administrador do banco (`postgres`, que não é barrado pela RLS de `audit_logs`). Só leitura. As consultas
olham os 90 dias anteriores; não cobrem `tipos_abono` nem a trava da própria ficha em `servidores`
(contornos).

A primeira consulta usa `audit_logs`. Das 16 tabelas, 8 têm o trigger de auditoria
(`fn_audit_trigger('rh')`, migração `20260214235823`); a consulta olha 7: `ferias_servidor`,
`licencas_afastamentos`, `viagens_diarias`, `registros_ponto`, `frequencia_mensal`, `banco_horas` e
`servidores` (`lotacoes` fica de fora porque a regra de gravação dela não muda). Em `servidores` só a
exclusão muda. Linhas com `user_id` nulo (service role) ficam de fora. A coluna `linha_propria` marca quem
gravou a própria linha (pelo `profiles.servidor_id`; em `banco_horas`, pelo id do usuário); o caso sem
vínculo, conferido por CPF em `eh_meu_servidor`, não entra.

```sql
-- Escritas dos últimos 90 dias por tabela, usuário e ação, e se o usuário continua gravando depois da B2.
WITH regra(tabela, modulos, codigos, excluir) AS (
  VALUES
    ('ferias_servidor',       '{rh}'::text[],    '{rh.ferias.criar,rh.ferias.editar,rh.ferias.gerenciar}'::text[], 'admin'),
    ('licencas_afastamentos', '{rh}',            '{rh.licencas.criar,rh.licencas.editar,rh.licencas.gerenciar}', 'rh.licencas.gerenciar'),
    ('viagens_diarias',       '{rh,financeiro}', '{rh.viagens.criar,rh.viagens.editar,rh.viagens.gerenciar,financeiro.diarias.gerenciar}', 'admin'),
    ('registros_ponto',       '{rh}',            '{rh.frequencia.lancar,rh.frequencia.criar,rh.frequencia.editar}', NULL),
    ('frequencia_mensal',     '{rh}',            '{rh.frequencia.lancar,rh.frequencia.criar,rh.frequencia.editar}', NULL),
    ('banco_horas',           '{rh}',            '{rh.frequencia.lancar}', NULL),
    ('servidores',            '{rh}',            NULL,                     'rh.servidores.excluir')
),
escritas AS (
  SELECT a.entity_type::text AS tabela, a.user_id, a.action::text AS acao,
         CASE a.entity_type::text
           WHEN 'servidores'  THEN false                                    -- sem trava de linha própria
           WHEN 'banco_horas' THEN coalesce(coalesce(a.after_data, a.before_data) ->> 'servidor_id'
                                            = a.user_id::text, false)       -- posse por usuário
           ELSE coalesce(coalesce(a.after_data, a.before_data) ->> 'servidor_id' = pa.servidor_id::text, false)
         END AS linha_propria,
         count(*) AS qtd
    FROM public.audit_logs a
    JOIN regra r ON r.tabela = a.entity_type::text
    LEFT JOIN public.profiles pa ON pa.id = a.user_id
   WHERE a."timestamp" >= now() - interval '90 days'
     AND a.action IN ('create', 'update', 'delete')
     AND a.user_id IS NOT NULL
     AND (r.codigos IS NOT NULL OR a.action = 'delete')   -- servidores: só o DELETE mudou
   GROUP BY 1, 2, 3, 4
)
SELECT e.tabela, e.acao, e.user_id, p.full_name, p.email, e.linha_propria, e.qtd,
       CASE
         WHEN public.is_admin_user(e.user_id) THEN true
         WHEN e.linha_propria THEN false                   -- nunca a própria linha pelo caminho da permissão
         WHEN e.acao = 'delete' AND r.excluir = 'admin' THEN false
         WHEN e.acao = 'delete' AND r.excluir IS NOT NULL THEN
              EXISTS (SELECT 1 FROM unnest(r.modulos) m WHERE public.can_access_module(e.user_id, m))
              AND public.has_permission_code(e.user_id, r.excluir)
         ELSE EXISTS (SELECT 1 FROM unnest(r.modulos) m WHERE public.can_access_module(e.user_id, m))
              AND EXISTS (SELECT 1 FROM unnest(r.codigos) c WHERE public.has_permission_code(e.user_id, c))
       END AS continua_gravando
  FROM escritas e
  JOIN regra r ON r.tabela = e.tabela
  LEFT JOIN public.profiles p ON p.id = e.user_id
 ORDER BY continua_gravando, e.tabela, e.qtd DESC;
```

Abono e fechamento não têm auditoria. As colunas de autoria guardam o `user.id` de quem decidiu: antes da
B2 é o que o front envia; depois, o trigger grava `auth.uid()`. A segunda consulta conta as decisões dos
últimos 90 dias, marca quem decidiu o próprio pedido (pelo `profiles.servidor_id`) e confere a permissão de
cada etapa:

```sql
WITH decisoes AS (
  SELECT 'solicitacoes_abono' AS tabela, s.servidor_id AS dono, x.uid, x.codigo
    FROM public.solicitacoes_abono s
   CROSS JOIN LATERAL (VALUES
     (s.aprovado_chefia_por, s.aprovado_chefia_em, 'rh.aprovar'),
     (s.aprovado_rh_por,     s.aprovado_rh_em,     'rh.frequencia.lancar')) AS x(uid, em, codigo)
   WHERE x.uid IS NOT NULL AND x.em >= now() - interval '90 days'
  UNION ALL
  SELECT 'frequencia_fechamento', f.servidor_id, x.uid, x.codigo
    FROM public.frequencia_fechamento f
   CROSS JOIN LATERAL (VALUES
     (f.validado_chefia_por, f.validado_chefia_em, 'rh.aprovar'),
     (f.consolidado_rh_por,  f.consolidado_rh_em,  'rh.frequencia.lancar'),
     (f.reaberto_por,        f.reaberto_em,        'rh.frequencia.lancar')) AS x(uid, em, codigo)
   WHERE x.uid IS NOT NULL AND x.em >= now() - interval '90 days'
),
marcadas AS (
  SELECT d.tabela, d.codigo, d.uid, coalesce(d.dono = p.servidor_id, false) AS pedido_proprio
    FROM decisoes d
    LEFT JOIN public.profiles p ON p.id = d.uid
)
SELECT m.tabela, m.codigo AS etapa_exige, m.uid AS user_id, p.full_name, m.pedido_proprio, count(*) AS qtd,
       public.is_admin_user(m.uid)
       OR (NOT m.pedido_proprio
           AND public.can_access_module(m.uid, 'rh')
           AND public.has_permission_code(m.uid, m.codigo)) AS continua_decidindo
  FROM marcadas m
  LEFT JOIN public.profiles p ON p.id = m.uid
 GROUP BY m.tabela, m.codigo, m.uid, p.full_name, m.pedido_proprio
 ORDER BY continua_decidindo, m.tabela, qtd DESC;
```

As linhas com `continua_gravando`/`continua_decidindo` = `false` são de quem perde acesso. As consultas não
cobrem `config_fechamento_frequencia`, `solicitacoes_ajuste_ponto`, `justificativas_ponto` e
`lancamentos_banco_horas` (sem auditoria nem coluna de autoria confiável), nem as mudanças que a chefia
fazia em abono fora de `pendente`.

Conferência pós-merge:

```sql
SELECT tablename, policyname FROM pg_policies
 WHERE (policyname ILIKE 'acesso_total%' OR policyname ILIKE 'rh_module%' OR policyname ILIKE 'vinculos_%')
   AND tablename IN ('ferias_servidor','licencas_afastamentos','viagens_diarias','registros_ponto',
                     'frequencia_mensal','solicitacoes_abono','frequencia_fechamento','config_fechamento_frequencia',
                     'solicitacoes_ajuste_ponto','justificativas_ponto','banco_horas','lancamentos_banco_horas',
                     'servidores','vinculos_servidor','lotacoes','cargos');
-- esperado: nenhuma linha
SELECT tgrelid::regclass, tgname FROM pg_trigger WHERE tgname = 'trg_validar_etapa_frequencia';
-- esperado: solicitacoes_abono e frequencia_fechamento; com os contornos, também justificativas_ponto e
-- solicitacoes_ajuste_ponto
SELECT policyname FROM pg_policies WHERE tablename = 'tipos_abono' AND policyname ILIKE 'acesso_total%';
-- esperado (com os contornos): nenhuma linha
SELECT has_function_privilege('authenticated', 'public.eh_meu_servidor(uuid)', 'EXECUTE'),  -- true
       has_function_privilege('anon',          'public.eh_meu_servidor(uuid)', 'EXECUTE');  -- false
```

### Folha: edição da ficha

- No detalhe da folha (`/folha/:id` → `FichaFinanceiraDialog`), incluir/editar/excluir itens da
  ficha, cadastrar/suspender/quitar/lançar consignações e manter dependentes IRRF exige
  `financeiro.folha.processar` (desde a B1, catalogada no módulo `rh`; super admin passa por cima) **e** folha em
  `previa`, `aberta` ou `reaberta` (`podeEditarFicha`, `src/lib/folhaFichaRegras.ts`). Sem isso os
  botões não aparecem e o diálogo marca "Somente leitura". A rota `/folha/:id` exige o módulo `rh` e
  `financeiro.folha.visualizar` (B1).
- No banco, a mesma regra vale desde a B1 (seção acima): escrita exige o módulo `rh` e
  `financeiro.folha.processar`, e a folha fechada barra também o INSERT de fichas e itens. Continuam
  pendentes o recálculo atômico de totais (hoje feito pelo cliente em quatro comandos) e a
  preservação dos itens manuais no reprocessamento — ver
  `superpowers/specs/2026-10-09-folha-detalhe-edicao-design.md`.
- Erros do banco (RLS 42501, trigger P0001, CHECK 23514, duplicidade 23505, obrigatório 23502,
  "0 linhas" PGRST116) chegam ao usuário em toast legível via `descreverErroBanco`. Só o texto do
  `RAISE` dos triggers (P0001) é repassado; os demais viram mensagem fixa com o código, sem nome de
  tabela/constraint nem o `DETAIL` do Postgres (que em CHECK traz a linha inteira, com dados pessoais).

### Viagens: edição, cancelamento e exclusão

- `/rh/viagens` (`GestaoViagensPage`) exige `rh.viagens.visualizar` na rota e no item de menu.
  Dentro da página, criar exige `rh.viagens.criar` ou `rh.viagens.gerenciar`; editar, mudar
  status e cancelar exigem `rh.viagens.editar` ou `rh.viagens.gerenciar`; o workflow DIRAF,
  `rh.viagens.gerenciar` ou `financeiro.diarias.gerenciar`; excluir fisicamente só super admin,
  e só viagem `solicitada` sem nº de SEI e sem portaria (`podeExcluir`,
  `src/lib/diariasRegras.ts`). As quatro permissões `rh.viagens.*` existem no catálogo
  (`admin` e `manager` têm todas; `user` só `visualizar`).
- **No banco, desde a B2 (PR #69):** gravar em `viagens_diarias` exige o módulo `rh` ou
  `financeiro` **e** `rh.viagens.criar|editar|gerenciar` ou `financeiro.diarias.gerenciar`, nunca na
  própria viagem; DELETE só o papel admin (ver
  [a subseção da B2](#férias-licenças-viagens-e-frequência-rls-por-permissão-onda-b--b2)). O banco
  ainda não separa criar de editar nem confere status e campos: quem tem um dos códigos consegue,
  pela API, alterar valor/quantidade de viagem concluída, voltar `concluida` para `solicitada` e
  inserir direto em `concluida`; o admin exclui viagem com SEI e portaria (o front só deixa excluir
  `solicitada` sem SEI e sem portaria). Não há trigger de bloqueio por status nem CHECK em
  `tipo_onus`, `data_retorno >= data_saida`, `valor_total` ou valores negativos, e o motivo de
  cancelamento continua em `observacoes`. Pendência: trigger `BEFORE UPDATE` com as transições de
  `statusPermitidos` e o bloqueio de valores com DIRAF concluído, os CHECKs acima e a coluna
  `motivo_cancelamento` — ver `superpowers/specs/2026-10-10-viagens-diarias-design.md`.
- Usuário com módulo `financeiro` sem `rh` escreve em `viagens_diarias` mas não lê
  `servidores`/`cargos`. A trilha fica em `audit_logs` (`audit_viagens_diarias`, before/after
  completos, `user_id = auth.uid()`), legível apenas por admin.
- A tabela de valores de diária fica no perfil do tenant (`rh.diarias`, ver `WHITE_LABEL.md`),
  portanto vai no bundle do front; são valores públicos (ato normativo de diárias), sem dado
  pessoal.

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
4. **Módulo não contratado** pela instituição (`requiredModule` fora de
   `moduloHabilitado`) → 404, antes do bypass, valendo também para o super admin.
5. **Super admin** → bypass total.
6. **`requiredModule`** → o usuário precisa ter o módulo (`hasPermission(<módulo>)`).
7. **`requiredPermissions`** → basta um dos códigos (`hasAnyPermission`). O código
   granular vem das três fontes acima; ter o módulo `rh` **não** concede `rh.*`.
   Sem acesso, redireciona para `/acesso-negado`.

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
