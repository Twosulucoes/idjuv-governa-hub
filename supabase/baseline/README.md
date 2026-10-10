# Baseline do banco (schema limpo + RLS por módulo)

Constrói um banco **novo e vazio** com o schema atual, a RLS corrigida e só o catálogo de
parâmetros — sem nenhum dado pessoal. Guia de uso para quem vai subir o banco:
[`docs/NOVO_BANCO.md`](../../docs/NOVO_BANCO.md). Este arquivo descreve o conteúdo e como mantê-lo.

## Por que existe

O histórico em `supabase/migrations/` não reconstrói o banco sozinho (tabelas e funções usadas
mas nunca criadas por migração) e termina num estado de segurança fraco: a migração de 20/02/2026
trocou todas as policies por `acesso_total_*` (`auth.uid() IS NOT NULL`) e só ~35 tabelas voltaram a
ter policy por módulo. Além disso, a revisão deste baseline encontrou, no estado das migrações: usuário
que se ativa sozinho e assume o `servidor_id` de outro (`profiles`), injeção de SQL em
`fn_gerar_numero_financeiro` (qualquer logado lia qualquer tabela), RPCs `SECURITY DEFINER` que devolviam
CPF a quem não tinha módulo, servidor que se autoaprovava, administrador bloqueado que seguia
administrador e `handle_new_user` quebrado. O baseline resolve isso sem reescrever o histórico.

> Provavelmente esses defeitos existem também no banco **atual**, se ele é o que as migrações produzem
> (não foi verificado: o banco ao vivo nunca foi inspecionado). Os overlays `10`, `12`, `18`, `20` e `40`
> são idempotentes e podem ser avaliados para aplicação nele; isso não foi feito nem testado aqui
> (invariante 8 do `AGENTS.md`).
>
> Exceção já levada ao histórico: `profiles`, `user_roles` e `user_modules`. No estado das migrações,
> as `acesso_total_*` dessas tabelas deixavam qualquer logado se dar o papel `admin` (provado num replay).
> A migração `20261010080000_s0_identidade_policies.sql` aplica nelas o mesmo desenho do baseline (overlay 12 e
> classe `proprio_user`), com os mesmos privilégios do overlay 40; num banco do baseline ela é no-op.
> A `20261010170000_onda0_permissoes_urgente.sql` faz o mesmo com o catálogo de permissões
> (`module_permissions_catalog`, `module_settings`, `module_access_scopes`, `user_org_units`), a injeção em
> `fn_gerar_numero_financeiro`, os stubs de acesso do overlay 10, `gestores_escolares`/`escolas_jer`,
> `cadastro_arbitros(+_modalidades)` e o EXECUTE de `anon` (lista de RPCs públicas do overlay 40).
> A `20261010200000_onda1_remover_acesso_total.sql` copia para 166 tabelas o bloco do
> `rls/35_policies_geradas.sql` (removendo as `acesso_total_*`); ao mudar a classe ou os módulos de uma
> dessas tabelas no `mapa.csv`, o histórico precisa de nova migração com o bloco regenerado.

## Conteúdo e ordem de aplicação (`aplicar.sh`, uma única transação)

| # | Arquivo | O que faz | Origem |
|---|---|---|---|
| 1 | `schema/01_pre_data.sql` | tipos, funções, tabelas, views | **gerado** (`scripts/db/gerar-baseline.sh`) |
| 2 | `schema/02_dados_catalogo.sql` | 20 tabelas de catálogo/parâmetros (832 linhas; `audit_colunas_sensiveis` entrou na E1) | **gerado** |
| 3 | `schema/03_post_data.sql` | constraints, índices, triggers, RLS ligado, policies do replay | **gerado** |
| 4 | `overlay/10_funcoes_acesso.sql` | `is_admin_user`, `is_admin_atual`, `has_permission_code`, `meu_servidor_id` exigem perfil **ativo**; fim dos stubs “acesso total”; alias `usuario_eh_admin`; `eh_meu_servidor(uuid)` (B2: "este servidor é o do usuário?", por vínculo ou, sem vínculo, por CPF); `eh_meu_arquivo_frequencia(text)` e `eh_minha_pasta_servidor(text)` (B3: o objeto do storage é do servidor do usuário?) | à mão |
| 5 | `overlay/12_protecao_profiles.sql` | trigger: quem não é admin não muda `is_active`, `servidor_id`, bloqueio, tipo, CPF, e-mail; policies de `profiles` sem duplicatas | à mão |
| 6 | `overlay/15_novo_usuario.sql` | `handle_new_user` (antes quebrava o cadastro) + trigger em `auth.users` | à mão |
| 7 | `overlay/18_funcoes_rpc.sql` | `fn_gerar_numero_financeiro` com lista fechada (injeção de SQL); RPCs de leitura com dado pessoal viram `SECURITY INVOKER`; `obter_parametro_*` não vazam valor individual; `sync_usuario_servidor_status` não reativa administrador; trigger de fechamento de folha; correção da auditoria de folha/parâmetros (`entity_id` uuid); `log_audit` recusa usuário inativo; `registrar_transicao_folha` grava `fechado_por`/`conferido_por` pelo banco (E1, mesmo texto da migração `20261011000000`) | à mão |
| 8 | `overlay/20_campos_iniciais.sql` | triggers: formulários públicos e pedidos do servidor não escolhem `status`, aprovação, autoria (nos pedidos do RH a isenção é por permissão, formato `perm:`, e nunca no próprio pedido); links do formulário de árbitros só do próprio bucket | à mão |
| 9 | `overlay/30_remover_acesso_total.sql` | apaga as policies `acesso_total_*` e a tabela morta `_backup_usuario_modulos_old` | à mão |
| 10 | `rls/35_policies_geradas.sql` | policies por módulo, **falha fechada** | **gerado** de `rls/mapa.csv` |
| 11 | `overlay/40_privilegios.sql` | `anon` só com as exceções públicas; sem EXECUTE para PUBLIC em função nova; sem TRUNCATE/TRIGGER; `audit_logs` só-acréscimo; RPCs que escrevem fechadas; funções da E1 (autoria e trilha) sem EXECUTE pela API, exceto `registrar_evento` para `authenticated` | à mão |
| 12 | `overlay/50_storage.sql` | buckets (com limite de tamanho/tipo no de árbitros, no privado `inventario-evidencias` e, desde a B3, no privado `documentos-requerimento`) e policies de storage por módulo; `frequencias` e `documentos-requerimento` (B3) gravam com módulo e código e o servidor lê o próprio arquivo | à mão |
| 13 | `overlay/60_realtime.sql` | publicação realtime (folha) | à mão |

`lacunas/` guarda a migração que cobre as tabelas usadas e nunca criadas; ela só serve ao replay
(`scripts/db/validar-migracoes.sh`) que alimenta os itens 1–3. O baseline não a aplica.
`bootstrap-admin.sql` cria o primeiro administrador (não faz parte do `aplicar.sh`).

Arquivos **gerados** não se editam à mão. Dados antes das constraints/triggers é proposital: o
INSERT não dispara auditoria e as FKs são validadas depois, contra os dados semeados.

## Modelo de RLS (`rls/mapa.csv`)

O mapa tabela → classe/módulo é a **fonte da verdade** e deve ser lido por quem conhece o negócio.
Classes (detalhe no cabeçalho de `scripts/db/gerar-rls.mjs`; contagens apuradas em 2026-10-10, 244 tabelas):

| Classe | Tabelas | Regra |
|---|---|---|
| `modulo` | 164 | módulo(s) do mapa leem e escrevem; admin (papel) também |
| `permissao` | 25 | módulo lê (com `;proprio`/`;pai=` o servidor lê o seu, como `proprio_leitura`/`proprio_filho`; com `;filho=<tabela>.<fk>` lê a linha que tem uma filha sua — a folha em que tem ficha); **escreve só quem tem o módulo E a permissão granular** do `extra` (via `can_access_module` + `has_permission_code`; admin passa). Hoje: as 10 tabelas da folha (B1, `financeiro.folha.processar\|configurar`; migração `20261010070000_onda_b_folha_rls_permissao.sql`) e 12 do RH (B2: férias, licenças, viagens, ponto, frequência, abono, ajuste, justificativa, fechamento, configuração do fechamento, banco de horas e lançamentos; migração `20261010090000_onda_b_rh_permissoes.sql`) e 3 do RH na B3 (`frequencia_pacotes`, `frequencia_arquivos` e `documentos_requerimento_servidor`; migração `20261010210000_onda_b_rh_storage.sql`). As migrações carregam o mesmo SQL gerado |
| `trilha` | 9 | módulo lê; **ninguém escreve por API** (auditoria e históricos gravados por trigger) |
| `proprio_leitura` / `proprio` / `proprio_filho` | 8 / 0 / 0 | módulo + o próprio servidor lê; em `proprio*` o servidor também cria o próprio pedido (status/aprovação forçados pelo overlay 20). Desde a B2, `servidores` (posse pela coluna `id`, DELETE com `rh.servidores.excluir`, e nos contornos `sem_autoaprovacao`: ninguém grava a própria ficha), `vinculos_servidor` e `lotacoes` estão aqui; as tabelas do RH que estavam em `proprio`/`proprio_filho` passaram a `permissao` (a última, `documentos_requerimento_servidor`, na B3). As classes `proprio` e `proprio_filho` continuam no gerador, sem tabela |
| `catalogo` | 7 | qualquer usuário ativo lê; escrita por módulo, ou com `escrita=<código>` também pelo código (`tipos_abono`: `rh.frequencia.configurar`, nos contornos). `cargos` entrou na B2 |
| `catalogo_admin` | 6 | qualquer usuário ativo lê (o app lê no login); só o papel admin escreve. `audit_colunas_sensiveis` (catálogo da máscara da trilha) entrou na E1 |
| `proprio_user` | 4 | cada usuário lê as suas linhas (`user_roles`, `user_modules`, `user_permissions`, `user_org_units`); só admin escreve |
| `admin` / `admin_leitura` | 8 / 1 | só o papel admin (a segunda: lê, ninguém escreve — `audit_logs`; desde a E1 imutável por trigger e com a policy extra `audit_logs_rh_auditoria_select`, fora do gerador: módulo `rh` e `rh.auditoria.visualizar` leem as linhas do RH) |
| `publico_admin` | 3 | `anon` e logados leem (portal público); só admin escreve |
| `preservar` | 9 | `denuncias` e `profiles`: policies próprias (`has_permission_code`; overlay 12); `fotos_vistoria_inventario`, `avisos`, `avisos_leituras`, `datas_importantes`, `importacoes`, `config_envio` e `envios_log`: policies das próprias migrações, que chegam pelo replay em `schema/03_post_data.sql` (as notas do `mapa.csv` ainda dizem "próxima regeneração"; o schema foi regenerado em 2026-10-10 e já as contém) |

- Toda tabela de `public` precisa de uma linha no mapa e de RLS ligado: o teste de RLS reprova
  tabela fora do mapa (o gerador não enxerga o banco; o teste sim). Tabela nova só passa depois
  que alguém decide o módulo dono.
- Coluna `confianca` (apurado em 2026-10-10, branch dos contornos): `alta` (229), `media` (13), `baixa` (1). **Revise as 14 linhas não-altas**
  (`confianca != alta`), principalmente `documentos`, `acesso_processo_sigiloso` e
  `config_institucional` (tem CPF e contato do responsável legal: só RH e financeiro leem).
- Para mudar uma regra: edite `mapa.csv`, rode `node scripts/db/gerar-rls.mjs` e confirme com
  `scripts/db/validar-baseline.sh`. O gate (`npm run gate`) falha se o SQL gerado estiver defasado.

### Formato da coluna `extra`

Sufixos separados por `;`, em qualquer ordem, cada um no máximo uma vez (a saída não depende da ordem).
O gerador recusa sufixo desconhecido, repetido ou com valor fora do formato. Referência completa no
cabeçalho de `scripts/db/gerar-rls.mjs`.

Classe `permissao`: `escrita=<c1>[|<c2>...][;<sufixo>]...`, com `escrita=` sempre primeiro.

| Parte | Efeito |
|---|---|
| `escrita=a\|b\|c` | INSERT/UPDATE/DELETE exigem o módulo **e** qualquer um dos códigos (OR de `has_permission_code`); com um código só, a saída é a de antes |
| `;proprio` | o próprio servidor também lê (`servidor_id = meu_servidor_id()`) |
| `;pai=<tabela>.<fk>` | posse pela tabela pai (leitura do que é do servidor) |
| `;filho=<tabela>.<fk>` | posse por uma tabela filha com `servidor_id` (ex.: a folha em que o servidor tem ficha) |
| `;coluna=<col>` | coluna de posse de `;proprio` quando não é `servidor_id` |
| `;excluir=<código>` | DELETE com o módulo **e** esse código, em vez da escrita |
| `;excluir=admin` | DELETE só do papel admin |
| `;insere_proprio` | o servidor também insere a linha que é dele (pedido); exige `;proprio` ou `;pai=` |
| `;sem_autoaprovacao` | INSERT/UPDATE/DELETE pelo caminho da permissão (e o DELETE de `;excluir=<código>`) exigem que a linha **não** seja do usuário logado: `is_admin_user(auth.uid()) OR NOT eh_meu_servidor(<posse>)`. `eh_meu_servidor` confere o vínculo do perfil ou, sem vínculo, o CPF; o papel admin passa. Exige `;proprio` ou `;pai=` |
| `;posse=usuario` | a coluna de posse (ou o `servidor_id` do pai, com `;pai=`) guarda o id do **usuário** (FK para `profiles(id)`): leitura e inserção próprias usam `<col> = auth.uid() AND is_active_user()`, e `;sem_autoaprovacao` usa `<posse> IS DISTINCT FROM auth.uid()`. Exige `;proprio` ou `;pai=`; `testar-rls.sql` confere que toda coluna de posse com FK para `profiles` o declara |

`;proprio`, `;pai=` e `;filho=` são excludentes (no máximo uma posse).

Outras classes:

- `proprio_leitura`: aceita `coluna=<col>`, `excluir=<código>|admin` e `sem_autoaprovacao` (este, dos
  contornos: INSERT/UPDATE/DELETE pelo módulo exigem ainda `is_admin_user(auth.uid()) OR NOT
  eh_meu_servidor(<col>)`). `servidores` usa `coluna=id;excluir=rh.servidores.excluir;sem_autoaprovacao`.
- `catalogo`: aceita `escrita=<código>[|<código>...]` (dos contornos): a escrita exige o módulo **e** um dos
  códigos, como na classe `permissao`; a leitura continua para qualquer usuário ativo. `tipos_abono` usa
  `escrita=rh.frequencia.configurar`.
Exemplos: `solicitacoes_abono` usa
`escrita=rh.aprovar|rh.frequencia.lancar;proprio;insere_proprio;sem_autoaprovacao;excluir=rh.frequencia.lancar`;
`banco_horas`, `escrita=rh.frequencia.lancar;proprio;posse=usuario;sem_autoaprovacao`.

Na B2, `;sem_autoaprovacao` está em 11 das 12 tabelas do RH (todas menos `config_fechamento_frequencia`) e
`;posse=usuario` em `banco_horas`, `lancamentos_banco_horas` e `solicitacoes_ajuste_ponto`.

## Verificação

```bash
bash scripts/db/validar-migracoes.sh                       # replay das migrações → banco idjuv_validacao
PG_REPLAY=idjuv_validacao bash scripts/db/validar-baseline.sh   # EXIGIR_REPLAY=1 reprova se o passo 5 for pulado
```

`validar-baseline.sh` recria um banco vazio com o shim do Supabase (`scripts/db/shim-supabase.sql`),
aplica o baseline, confirma que uma segunda aplicação é recusada e que só as 20 tabelas de catálogo têm linhas, roda
`scripts/db/testar-rls.sh` e, com `PG_REPLAY`, compara schema, privilégios e storage com o replay das
migrações + overlays. O teste de RLS cobre, com personas reais (`SET ROLE` + claims do JWT):

- por tabela: `SELECT`, `INSERT`, `UPDATE` e `DELETE` para admin, admin bloqueado, sem módulo, inativo,
  servidores (ativo e bloqueado), cada módulo do mapa e um módulo alheio; `anon` conforme a coluna `anon`;
  na classe `permissao`, mais uma persona por código exigido (`perm_<código>`: módulo + código em
  `user_modules.permissions`) e uma com a permissão avulsa sem o módulo (`perm_avulsa_<código>`) — só a
  primeira e o admin escrevem; o módulo sem o código lê e não altera; a avulsa não lê nem altera;
- folha: `processar_folha_pagamento` deve ser executável por `authenticated` **e** ter guarda
  `has_permission_code` no corpo (não por `anon`); UPDATE direto de `status` em `folhas_pagamento` barrado
  mesmo para quem processa; INSERT de ficha/item em folha fechada recusado (`42501`), exceto para admin;
- sufixos da B2: persona por código da lista; `;insere_proprio` (o servidor sem módulo insere o próprio
  pedido e não o de outro); `;sem_autoaprovacao` (com a permissão e dono da linha A, só alcança a linha B);
  `;posse=usuario` (declarado sempre que a FK da coluna de posse aponta para `profiles`); DELETE por outro
  código ou só admin;
- RH (B2, triggers ligados): campos iniciais isentos por permissão e nunca no próprio pedido; etapas de
  `validar_etapa_frequencia` no abono e no fechamento (`42501` com a etapa); a função de trigger não é
  executável por `authenticated`;
- contornos (N1–N6 em `testar-rls.sql`): a chefia não troca `tipos_abono.exige_aprovacao_rh`; o RH não edita
  a própria ficha em `servidores` (por vínculo nem por CPF); autoria gravada pela etapa e não apagada
  enquanto vale; `created_by` do abono imutável e dados do abono imutáveis sem o RH, também em pendente;
  justificativa e ajuste com decisão só a partir de pendente e exclusão do ajuste só pelo RH; CPF sem o
  zero inicial casa em `eh_meu_servidor`;
- a cobertura é exigida: tabela sem linha semente, fora do mapa ou sem RLS é **falha**;
- storage: 10 buckets × 25 personas, upload anônimo só nas pastas do formulário, limite do bucket;
  `inventario-evidencias` (privado, 10 MB) só deixa sobrescrever ou apagar quem tem `patrimonio.tramitar`;
- storage do RH (B3, bloco "RH: storage" de `testar-rls.sql`): `frequencias` e `documentos-requerimento` gravam
  só com o módulo e o código; o servidor sem módulo lê o próprio PDF e a própria pasta, não os de outro, e
  perfil bloqueado não lê; pasta fora do formato uuid dá `false` sem erro; `documentos` só por módulo; as duas
  funções de dono só executáveis por `authenticated`; limite do bucket `documentos-requerimento`; nenhuma outra
  policy de `storage.objects` cita os três buckets;
- autoria e trilha do RH (E1, bloco "RH: autoria e trilha" de `testar-rls.sql`, triggers ligados): autor mandado
  pelo cliente é ignorado (também para admin) e `created_*` não mudam; `campos_alterados` e UPDATE sem mudança
  sem linha; origens `usuario`, `usuario_sem_vinculo` e `sistema`; colunas de decisão e de criação; máscara de
  CPF, RG, nascimento e CID; tabela sem `id`; IP e user agent dos cabeçalhos; `registrar_evento` (listas
  fechadas, `22023`/`42501`); `fechado_por` e `processado_por` da folha; `audit_logs`, `folha_historico_status`
  e `rubricas_historico` imutáveis para `postgres`, service role e superusuário em réplica (só o GUC de
  expurgo e a cascata do pai passam); admin sem atalho na autoria da etapa; leitura com
  `rh.auditoria.visualizar`; trilha de `profiles`; toda tabela do RH com `zz_fixar_autoria` como último
  trigger BEFORE; privilégios das funções novas;
- inventário de campo: `fotos_vistoria_inventario` (INSERT só em nome próprio, UPDATE só do autor ou com
  `patrimonio.tramitar`, DELETE só com `patrimonio.tramitar`, campos de prova imutáveis), no bloco de
  cobertura adicional de `testar-rls.sql`;
- identidade: auto-ativação, troca de `servidor_id`, auto-promoção, admin bloqueado, `handle_new_user`;
- RPCs: injeção de SQL, `SECURITY DEFINER` sem checagem fora de lista revisada, privilégios padrão,
  campos que o autor não pode escolher nos formulários.

Último resultado (2026-10-10, onda E1, PostgreSQL 16.15): replay de **263 migrações com 0 falhas**;
`validar-baseline.sh` com `EXIGIR_REPLAY=1` **APROVADO** — RLS com 0 falhas em 4534 checagens de UPDATE/DELETE
(235 tabelas), só as 20 tabelas de catálogo com linhas e schema idêntico ao replay (42917 linhas). A migração
`20261011000000` aplicada duas vezes no replay e no baseline: sem erro e sem trigger ou policy a mais. O mesmo
teste reprova com 203 falhas no baseline anterior à E1 (prova de vida). Na correção de contornos: 258 migrações,
schema de 40800 linhas, 54 falhas no baseline da B2 sem os contornos. Antes, na B2: 257 migrações,
0 falhas em 4436 checagens, schema de 40624 linhas. Rodadas anteriores: aprovado em PostgreSQL **15.18, 16.15 e 17.10** (o self-hosted da Supabase
costuma rodar 15; o dump é gerado por `pg_dump` 16).

**Limite da validação:** roda em Postgres puro com um *shim* de `auth`/`storage`/papéis. Não exercita
GoTrue, PostgREST, Storage API nem Realtime, e o `postgres` do shim não é o da imagem da Supabase
(os *default privileges* de `supabase_admin` não são emulados). Teste no Supabase de destino antes de
apontar o front. O teste de UPDATE mede só a policy de UPDATE (`SET coluna = DEFAULT`, que não exige
visibilidade pelas policies de SELECT).

## Regenerar o schema

O dump sai do banco do **replay das migrações, sem os overlays** (os overlays e a RLS são camadas
versionadas à parte):

```bash
bash scripts/db/validar-migracoes.sh                         # deixa o replay em PG_DB (padrão idjuv_validacao)
PG_DB=idjuv_validacao bash scripts/db/gerar-baseline.sh      # reescreve supabase/baseline/schema/
PG_REPLAY=idjuv_validacao bash scripts/db/validar-baseline.sh
```

As sementes saem com **UUIDs e datas novos** a cada geração (snapshot do replay); regenere só quando o
catálogo mudar de fato. O `pg_dump` precisa ser da versão do servidor do replay ou mais nova; o `gerar-baseline.sh`
remove o `SET transaction_timeout` (do `pg_dump` 17, rejeitado pelo Postgres 15/16) e os `\restrict` do `psql`.

## O que NÃO está aqui

- **Dados pessoais.** `servidores` e `vinculos_servidor` (74 nomes de pessoas, com CPF placeholder
  `00000000001`…`74`, inseridos pela migração `20260110184920`), `audit_logs`, `portal_diretoria` e outras tabelas operacionais ficam fora das
  sementes. As migrações antigas continuam com esses dados no histórico (ver pendências).
- Usuários, papéis e módulos: o primeiro administrador nasce com `bootstrap-admin.sql`.
- Extensões da plataforma (`pg_cron`, `pg_net`, `pg_graphql`, `supabase_vault`), configuração do
  Auth (SMTP, URLs, desativar cadastro público e anônimo), Edge Functions e seus segredos.
- Parâmetros institucionais do IDJUV nas sementes (CNPJ, UG, feriados estaduais em `fin_parametros`
  e `dias_nao_uteis`). Para outro cliente, troque-os (skill `onboarding-cliente-idjuv`).

## Pendências e decisões em aberto

Decisões de negócio (o baseline escolheu o mais restritivo que mantém o app funcionando):

- **Sigilo de processos.** As migrações antigas tinham `sigilo` (público/restrito/sigiloso) e
  `acesso_processo_sigiloso`; a migração de 20/02 apagou essas policies. No baseline, qualquer usuário do
  módulo `workflow` lê todos os processos, inclusive os sigilosos, e o bucket `documentos` não respeita
  sigilo. Falta uma classe `sigilo_processo` no gerador.
- **Módulo `rh` amplo demais para saúde e folha.** A escrita na folha (B1) e em férias, licenças, viagens e
  frequência (B2) já exige o código do catálogo; a **leitura** continua para qualquer usuário com o módulo
  `rh`, inclusive o CID de `licencas_afastamentos`. `pensoes_alimenticias` e `remessas_bancarias` seguem
  abertas, para ler e escrever, a quem tem o módulo. O padrão da B2 ("só com permissão": quem tem o módulo
  sem o código deixa de gravar) ainda precisa da confirmação do RH.
- **`role_permissions` dá permissões `admin.*` ao papel `user`.** Quem tem o módulo `admin` passa a ter
  `admin.usuarios`. As Edge Functions `admin-create-user`, `admin-reset-password` e `delete-user` agora exigem o
  **papel** admin (`is_admin_user`), porque `admin-create-user` devolvia o UUID de qualquer e-mail e reativava o
  perfil, e as outras duas tomavam ou apagavam contas de não-administradores. `database-schema` e as demais telas
  de admin ainda aceitam a permissão `admin.*` concedida por módulo.

Limites conhecidos:

- Buckets públicos continuam servindo o arquivo por URL; fechar exige bucket privado + URL assinada no front.
  `inventario-evidencias` já é privado (leitura por URL assinada); `inventario-fotos` e `patrimonio-fotos` seguem públicos.
  `documentos-requerimento` está resolvido desde a B3: privado, o front grava o caminho e abre por URL assinada
  (`src/lib/storageArquivos.ts`). `documentos` é privado, mas portarias, atos e cedência ainda gravam link
  público (`getPublicUrl`), que não abre: falta escolher o dono do bucket e trocar esses links (pendência).
- Os RPCs públicos (`arbitro_cpf_cadastrado`, `registrar_denuncia_publica`, os INSERTs anônimos e o upload em
  `arbitros-docs`) não têm limite de taxa: aplique no proxy e use CAPTCHA no formulário. `arbitro_cpf_cadastrado`
  é um oráculo de existência de CPF.
- Funções auxiliares de RLS (`is_admin_user`, `can_access_module`, `get_user_permission_codes`,
  `listar_permissoes_usuario`…) aceitam um UUID e respondem a qualquer logado: revelam quem é admin e as
  permissões de terceiros. Precisam de EXECUTE para as policies funcionarem; `obter_dado_oficial` (anon) devolve
  qualquer chave de `dados_oficiais`.
- `log_audit` deixa o usuário autenticado gravar entradas de auditoria em seu nome (o `user_id` é sempre o dele,
  o conteúdo é informado pelo cliente).
- Funções novas nascem executáveis por `authenticated` (padrão do Supabase). O teste de RLS falha se aparecer
  uma `SECURITY DEFINER` sem checagem fora da lista revisada, mas a migração nova precisa fazer o `REVOKE` certo
  (skill `migracao-segura-idjuv`).
- `fn_atualizar_situacao_servidor` fica sem EXECUTE para PUBLIC, `anon` e `authenticated` (overlay 40; no banco só
  de migrações, desde a migração `20261010090000` da B2). `processar_folha_pagamento` saiu dessa
  lista na migração `20261010070000`: ganhou guarda `has_permission_code('financeiro.folha.processar')` no corpo e
  EXECUTE para `authenticated` (o botão Processar chama a RPC); `anon` continua sem.
- **Migração `20261010070000` × overlays.** A migração recria, com o texto dos overlays `10` (funções de acesso) e
  `18` (parte da folha: `registrar_transicao_folha`, `folhas_proteger_fechamento`, `fechar_folha`, `reabrir_folha`),
  as funções-base — no banco do baseline é no-op, no replay corrige. Os overlays continuam no baseline (são
  idempotentes). O schema foi regenerado em 2026-10-10 com essa migração no replay: `schema/01_pre_data.sql` e
  `schema/03_post_data.sql` já trazem a guarda da RPC, os triggers `trg_bloquear_insercao_*`, o índice
  `itens_ficha_financeira_ficha_referencia_desconto_uidx`, os triggers de auditoria da folha e o catálogo com
  `financeiro.folha.*` em `module_code = 'rh'`.
- **Migração `20261010090000` (B2) × overlays.** Ela carrega `eh_meu_servidor` (mesmo texto do overlay `10`), o
  SQL gerado das 16 tabelas do RH, o trigger `validar_etapa_frequencia` e `forcar_campos_iniciais` com o formato
  `perm:` e a posse `:usuario` (mesmo texto do overlay `20`; o overlay `40` tira o EXECUTE de `authenticated` da
  função de trigger), além do REVOKE de `fn_atualizar_situacao_servidor`. No banco do baseline só aperta a
  escrita; no replay cria as funções e os triggers que faltavam. Limitação conhecida: o servidor não assina o
  próprio fechamento pela API (o trigger restringe `assinado_servidor*` ao dono, mas não há policy de UPDATE
  para ele; a assinatura não tem tela).
- **Migração `20261010100000` (contornos da B2, mesclada na PR #71) × overlays.** Não altera a `20261010090000`
  (já mesclada): recria `eh_meu_servidor` em plpgsql (mesmo texto do overlay `10`), as policies geradas de
  `tipos_abono`, `servidores` e `solicitacoes_ajuste_ponto` e `validar_etapa_frequencia`, agora também em
  `justificativas_ponto` e `solicitacoes_ajuste_ponto`.
- **Migração `20261010210000` (B3, mesclada na PR #75) × overlays.** Carrega `eh_meu_arquivo_frequencia` e
  `eh_minha_pasta_servidor` (mesmo texto do overlay `10`, privilégios do overlay `40`), o SQL gerado de
  `frequencia_pacotes`, `frequencia_arquivos` e `documentos_requerimento_servidor`, o trigger de campos iniciais
  do pedido (mesmo texto do overlay `20`) e as policies `st_*` dos três buckets (mesmo texto do overlay `50`).
  No banco do baseline aperta a gravação e acrescenta a leitura do dono; no replay troca as policies abertas.
  Limitações: policies permissivas de storage somam no WITH CHECK, então quem grava em dois buckets pode mover
  objeto entre eles por UPDATE (sem leitura nova); policy de `storage.objects` criada fora das migrações no
  banco ao vivo não é removida, a migração só emite `WARNING` (consulta pós-deploy em
  [`docs/RBAC_PERMISSOES.md`](../../docs/RBAC_PERMISSOES.md#arquivos-do-rh-e-download-de-frequência-onda-b--b3)).
- **Migração `20261011000000` (E1, em PR rascunho) × overlays.** Recria `registrar_transicao_folha` com o mesmo
  texto do overlay `18` (que sobrescreveria a função do schema) e repete os REVOKE/GRANT das funções novas no
  overlay `40` (o dump não leva privilégios). O resto (colunas de autoria, triggers `zz_fixar_autoria`,
  `audit_<tabela>` e `trilha_imutavel`, catálogo `audit_colunas_sensiveis`, policy extra de `audit_logs`) chega
  pelo replay em `schema/`. Limitações: a cascata ao excluir uma folha ou rubrica ainda apaga o histórico dela
  (o trigger deixa passar quando o pai já não existe); expurgo da trilha só por SQL direto com
  `SET LOCAL trilha.expurgo = 'autorizado'`; as FKs de autoria para `auth.users` que já existiam (quase todas sem
  `ON DELETE`) passam a barrar a exclusão de quem lançou algo, agora que o banco sempre grava o autor
  (`delete-user` deve passar a desativar).
- **`servidores.situacao`** (anterior à B2): quem tem o módulo `rh` muda a situação de outro servidor, e isso
  bloqueia o perfil vinculado. Sem correção ainda.
- Tabelas com fluxo de aprovação por RPC e UPDATE livre para o módulo: `folhas_pagamento` foi protegida (só quem
  pode fechar/reabrir muda o status), mas `conteudo_rascunho` (comunicação) ainda deixa o módulo marcar
  `status = 'publicado'` sem passar por `promover_rascunho`. Revise outras tabelas com `status` de aprovação.
- A folha está bloqueada e não foi exercitada de ponta a ponta: `fn_gerar_esocial_s1200` usa uma coluna
  inexistente (`lancamentos_folha.folha_id`) e falha para todos; `fechar_folha`/`reabrir_folha` e
  `fn_audit_parametros` foram consertados (auditoria gravava texto em coluna uuid).
- `backup-offsite`: só a própria service role key vale como "cron" e o perfil do usuário precisa estar ativo.
  No self-hosted, confirme `FUNCTIONS_VERIFY_JWT=true` no `.env`; outras Edge Functions (`cpsi-ai-assistant`,
  `enviar-convite-reuniao`) aceitam qualquer sessão, sem checar módulo nem perfil ativo. `download-frequencia`
  exige o módulo `rh` e `rh.frequencia.visualizar` desde a B3 (`docs/EDGE_FUNCTIONS.md`).
- `overlay/40_privilegios.sql` ajusta os privilégios padrão só do papel `postgres`; objetos criados pelo Studio
  self-hosted (que conecta como `supabase_admin`) herdam os padrões da plataforma (EXECUTE para anon e authenticated).
  Funções criadas por ali precisam de `REVOKE` explícito.
- Os 74 nomes de servidores seguem no histórico git e na migração `20260110184920` (os CPFs ali são placeholders).
- **Formulário público de gestores escolares:** a leitura anônima de `gestores_escolares` (CPF, RG, e-mail e celular
  de todos) foi fechada; as telas públicas passam a usar as RPCs `consultar_gestor_por_cpf` e
  `registrar_gestor_publico` (só devolvem id, nome, status e nome da escola). O front foi ajustado
  (`useGestoresEscolares.ts`), que cai no acesso direto à tabela quando a RPC não existe (banco anterior, sem o
  baseline); `anon` executa **6** RPCs públicas no total. O formulário de árbitros segue o mesmo princípio e
  tolera a falta das RPCs (`CadastroArbitroPage.tsx`), mas o log de acesso ao contracheque e o cadastro de
  árbitros só ficam íntegros depois de aplicada a migração `20261006230500`.
- O banco ao vivo nunca foi inspecionado: o baseline foi derivado só dos arquivos do repositório.
