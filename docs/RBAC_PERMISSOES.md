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
- **No banco**, a separação por etapa e a trava de autoaprovação chegam com a B2 (em PR; ver
  [a subseção da B2](#férias-licenças-viagens-e-frequência-rls-por-permissão-onda-b--b2)). Enquanto ela não
  for aplicada, a RLS de `solicitacoes_abono`, `frequencia_fechamento` e `config_fechamento_frequencia`
  libera a escrita a qualquer usuário com o módulo `rh`, e quem tem o módulo aprova o próprio abono pela
  API. Mesmo com a B2, ficam de fora: chefia **sem** o módulo `rh` (vê a tela, o banco recusa),
  `permite_reabertura` e restringir `rh.aprovar` à própria equipe.
- `/rh/minha-frequencia` (`MinhaFrequenciaPage`) só exige login, como `/rh/meus-dados`. As queries
  usam o servidor do perfil (`user.servidorId` do `AuthContext`, vindo de `profiles.servidor_id`), a
  mesma chave da RLS (`meu_servidor_id()`). Antes usavam `servidores.user_id`, coluna que nada preenche.
  A leitura da própria linha em `servidores`, `vinculos_servidor` e `lotacoes` entra com a B2; sem ela
  aplicada, só quem tem o módulo `rh` lê `servidores`.

### Folha: RLS por permissão (Onda B / B1)

Migração `supabase/migrations/20261010070000_onda_b_folha_rls_permissao.sql` (spec
`docs/superpowers/specs/2026-10-10-onda-b-folha-seguranca-design.md`; em PR, **ainda não aplicada em
remoto**). A folha pertence ao módulo `rh`: **ler** exige o módulo; **escrever** exige o módulo **e** a
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
`docs/superpowers/specs/2026-10-10-onda-b-rh-permissoes-design.md`; na PR da B2, **ainda não aplicada em
remoto**). Depende da S0 (`supabase/migrations/20261010080000_s0_identidade_policies.sql`) e da B1: ordem de
merge S0 → B1 → B2. Sem a S0, no banco só de migrações, qualquer logado troca o próprio
`profiles.servidor_id` e a leitura da "própria linha" exporia qualquer servidor.

Regra geral: **gravar** nas 16 tabelas abaixo exige o módulo `rh` **e** um código do catálogo (nenhum
código novo). O papel admin passa em tudo. As `acesso_total_*` (e as `rh_module_*`/`vinculos_*` que
sobravam) são removidas; `anon` perde todo privilégio nas 16 tabelas e `authenticated` perde
TRUNCATE/TRIGGER/REFERENCES. "Próprio" é `servidor_id = meu_servidor_id()`. "Nunca a própria" vale para
quem tem servidor vinculado; usuário sem vínculo não tem linha própria.

| Tabela | Leitura | Gravação (INSERT/UPDATE) | Exclusão |
|---|---|---|---|
| `ferias_servidor` | `rh` ou o próprio | `rh` + `rh.ferias.criar\|editar\|gerenciar` | só o papel admin |
| `licencas_afastamentos` | `rh` ou o próprio | `rh` + `rh.licencas.criar\|editar\|gerenciar` | `rh` + `rh.licencas.gerenciar` |
| `viagens_diarias` | `rh` ou `financeiro`, ou o próprio | `rh` ou `financeiro` + `rh.viagens.criar\|editar\|gerenciar` ou `financeiro.diarias.gerenciar` | só o papel admin |
| `registros_ponto`, `frequencia_mensal` | `rh` ou o próprio | `rh` + `rh.frequencia.lancar\|criar\|editar` | igual à gravação |
| `banco_horas` | `rh` ou o próprio | `rh` + `rh.frequencia.lancar` | igual à gravação |
| `lancamentos_banco_horas` | `rh` ou os do próprio banco de horas | `rh` + `rh.frequencia.lancar` | igual à gravação |
| `solicitacoes_abono`, `solicitacoes_ajuste_ponto` | `rh` ou o próprio | o servidor insere o próprio pedido (status e decisão forçados por `forcar_campos_iniciais`); quem decide: `rh` + `rh.aprovar` ou `rh.frequencia.lancar`, nunca na própria linha | `rh` + um dos dois códigos, nunca a própria |
| `justificativas_ponto` | `rh` ou as do próprio ponto (posse por `registros_ponto`) | o servidor insere para o próprio ponto; quem decide: `rh` + `rh.aprovar` ou `rh.frequencia.lancar`, nunca sobre o próprio ponto | `rh` + um dos dois códigos, nunca sobre o próprio ponto |
| `frequencia_fechamento` | `rh` ou o próprio | `rh` + `rh.aprovar` ou `rh.frequencia.lancar`, nunca a própria | idem |
| `config_fechamento_frequencia` | `rh` | `rh` + `rh.frequencia.configurar` | idem |
| `servidores` | `rh` ou a própria linha (`id = meu_servidor_id()`) | módulo `rh` (sem mudança) | `rh` + `rh.servidores.excluir` |
| `vinculos_servidor`, `lotacoes` | `rh` ou os próprios | módulo `rh` | módulo `rh` |
| `cargos` | qualquer usuário ativo (catálogo, sem dado pessoal) | módulo `rh` | módulo `rh` |

Em `solicitacoes_abono` e `frequencia_fechamento` o trigger `validar_etapa_frequencia` (BEFORE INSERT,
UPDATE e DELETE) separa as etapas; o papel admin passa, e a recusa é erro `42501` com a etapa na mensagem:

- **Chefia** (`rh.aprovar`): registrar a aprovação da chefia (`aprovado_chefia_*`, status
  `aprovado_chefia`); validar o fechamento (`validado_chefia*`).
- **RH** (`rh.frequencia.lancar`): `aprovado_rh_*`; status `aprovado`; rejeitar o que a chefia já aprovou;
  cancelar ou voltar a pendente; desfazer a validação; `consolidado_rh*`, `reaberto*`,
  `justificativa_reabertura`; excluir a linha.
- **Qualquer das duas**: rejeitar um abono pendente.
- **Exceção**: a chefia encerra o fluxo (status `aprovado`) quando aprova no mesmo comando um pendente cujo
  tipo dispensa o RH (`tipos_abono.exige_aprovacao_rh = false`), como `chefiaEncerraFluxo` no front.
- No INSERT a comparação é com a linha vazia: o upsert do front não cria linha já consolidada por quem só
  valida.
- **Não bloqueado**: o RH (`rh.frequencia.lancar`) aprovar um pendente que exige chefia, pulando a chefia.

`forcar_campos_iniciais` nos pedidos do RH (abono, ajuste, justificativa) isenta só quem tem o módulo
**e** `rh.aprovar` ou `rh.frequencia.lancar`, e nunca na linha do próprio servidor: quem pede para si
sempre grava `status = pendente` e campos de decisão vazios. Formato em
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
- excluir férias e viagens passa a ser só do papel admin; excluir servidor exige `rh.servidores.excluir`.

Leitura não diminui: o servidor passa a ler a própria linha em `servidores`, `vinculos_servidor` e
`lotacoes`, e qualquer usuário ativo lê `cargos`.

Fora da B2: chefia sem o módulo `rh` validando a equipe; pedido de férias ou de viagem pelo servidor;
subunidades na chefia; assinatura do servidor no fechamento; storage e `download-frequencia` (B3);
`pensoes_alimenticias`, `historico_funcional`, `portarias_servidor`, `designacoes`, `provimentos` e
`cessoes` (seguem por módulo); máscara de CID em licenças.

#### Dimensionamento antes do merge

Para saber quem perde acesso, o administrador pode rodar no banco de produção, numa conexão de
administrador do banco (`postgres`, que não é barrado pela RLS de `audit_logs`). Só leitura.

A primeira consulta usa `audit_logs`. Das 16 tabelas, 8 têm o trigger de auditoria
(`fn_audit_trigger('rh')`, migração `20260214235823`); a consulta olha 7: `ferias_servidor`,
`licencas_afastamentos`, `viagens_diarias`, `registros_ponto`, `frequencia_mensal`, `banco_horas` e
`servidores` (`lotacoes` fica de fora porque a regra de gravação dela não muda). Em `servidores` só a
exclusão muda. Linhas com `user_id` nulo (service role) ficam de fora.

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
  SELECT a.entity_type::text AS tabela, a.user_id, a.action::text AS acao, count(*) AS qtd
    FROM public.audit_logs a
    JOIN regra r ON r.tabela = a.entity_type::text
   WHERE a."timestamp" >= now() - interval '90 days'
     AND a.action IN ('create', 'update', 'delete')
     AND a.user_id IS NOT NULL
     AND (r.codigos IS NOT NULL OR a.action = 'delete')   -- servidores: só o DELETE mudou
   GROUP BY 1, 2, 3
)
SELECT e.tabela, e.acao, e.user_id, p.full_name, p.email, e.qtd,
       CASE
         WHEN e.acao = 'delete' AND r.excluir = 'admin' THEN public.is_admin_user(e.user_id)
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

Abono e fechamento não têm auditoria; as colunas de autoria guardam o `user.id` de quem decidiu (é o que o
front grava). A segunda consulta conta as decisões dos últimos 90 dias e confere a permissão de cada etapa:

```sql
WITH decisoes AS (
  SELECT 'solicitacoes_abono' AS tabela, x.uid, x.codigo
    FROM public.solicitacoes_abono s
   CROSS JOIN LATERAL (VALUES
     (s.aprovado_chefia_por, s.aprovado_chefia_em, 'rh.aprovar'),
     (s.aprovado_rh_por,     s.aprovado_rh_em,     'rh.frequencia.lancar')) AS x(uid, em, codigo)
   WHERE x.uid IS NOT NULL AND x.em >= now() - interval '90 days'
  UNION ALL
  SELECT 'frequencia_fechamento', x.uid, x.codigo
    FROM public.frequencia_fechamento f
   CROSS JOIN LATERAL (VALUES
     (f.validado_chefia_por, f.validado_chefia_em, 'rh.aprovar'),
     (f.consolidado_rh_por,  f.consolidado_rh_em,  'rh.frequencia.lancar'),
     (f.reaberto_por,        f.reaberto_em,        'rh.frequencia.lancar')) AS x(uid, em, codigo)
   WHERE x.uid IS NOT NULL AND x.em >= now() - interval '90 days'
)
SELECT d.tabela, d.codigo AS etapa_exige, d.uid AS user_id, p.full_name, count(*) AS qtd,
       public.can_access_module(d.uid, 'rh') AND public.has_permission_code(d.uid, d.codigo) AS continua_decidindo
  FROM decisoes d
  LEFT JOIN public.profiles p ON p.id = d.uid
 GROUP BY 1, 2, 3, 4
 ORDER BY continua_decidindo, 1, qtd DESC;
```

As linhas com `continua_gravando`/`continua_decidindo` = `false` são de quem perde acesso. As consultas não
cobrem `config_fechamento_frequencia`, `solicitacoes_ajuste_ponto`, `justificativas_ponto` e
`lancamentos_banco_horas` (sem auditoria nem coluna de autoria confiável) nem quem decidiu o próprio
pedido.

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
-- esperado: solicitacoes_abono e frequencia_fechamento
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
