# Banco de Dados (Supabase / Postgres)

Contagens do schema `public` (tabelas, views, funções, enums, policies, migrações) ficam em
[ESTADO_DO_SISTEMA.md](./ESTADO_DO_SISTEMA.md), gerado do baseline por `npm run estado`. Os
tipos TypeScript de todo o schema são gerados em
`src/integrations/supabase/types.ts` (**não editar à mão** — regenerar). Desde o P03 ele é gerado
do banco que as **migrações** constroem, não de um projeto remoto: `bash scripts/db/gerar-tipos.sh`
(`npm run db:tipos`) faz o replay de todas as migrações num Postgres local (mesmos pré-requisitos de
`scripts/db/validar-migracoes.sh`: superusuário `supabase_admin` em `127.0.0.1:54329`, ex.: docker
`postgres:17`) e roda o `@supabase/postgres-meta` 0.100.0 (o gerador do `supabase gen types typescript`,
versão fixa). `--checar` (`npm run check:tipos`) só compara e sai 1 se o arquivo estiver defasado. Como a
produção tem a mesma estrutura do replay desde o P02, são os tipos da produção. Todas as tabelas, views e
RPCs estão tipadas, e o P03 removeu ~100 contornos de tipo no client (`supabase as any`, `.from("x" as any)`,
`.rpc("x" as never)`, `as unknown as SupabaseClient`) em ~36 arquivos. Código novo não os reintroduz: tabela
ou RPC de migração nova fica tipada ao regenerar.

> Migrações versionadas em `supabase/migrations/*.sql`
> (`YYYYMMDDHHMMSS_<uuid>.sql` ou `YYYYMMDDHHMMSS_<slug>.sql`), aplicadas na produção só pelo CI
> (`.github/workflows/migracoes-banco.yml`). Para inspecionar o schema, leia `supabase/baseline/` e
> `src/integrations/supabase/types.ts`: o conector MCP do Supabase não alcança o banco da VPS. Para mudar o schema, crie uma migração nova
> e regenere os tipos. Não edite migrações antigas.
> **Migração nova → regenerar `types.ts` no mesmo PR** (`bash scripts/db/gerar-tipos.sh`): o workflow
> `Tipos do banco` (`.github/workflows/tipos-banco.yml`) barra o PR cujo `types.ts` difere do que as
> migrações geram.

## Baseline limpo e RLS por módulo (banco novo)

Para criar um banco **novo e vazio** use `supabase/baseline/` (guia: [NOVO_BANCO.md](./NOVO_BANCO.md);
conteúdo e manutenção: [`supabase/baseline/README.md`](../supabase/baseline/README.md)). Ele não substitui
as migrações: é um schema consolidado, gerado do replay delas, mais uma camada de correções. O que
muda em relação ao estado das migrações antigas:

> **Desde 14/10/2026 as migrações produzem o mesmo banco que o baseline e a produção.** A Fotografia do banco
> mostrou que a produção foi montada pelo baseline; a migração `20261014120000_convergencia_baseline.sql` copia
> para o histórico os overlays e as policies geradas (no-op na produção: num banco do baseline, o `pg_dump` de public, storage e auth fica idêntico).
> Desde então, **toda mudança num overlay ou no `mapa.csv` precisa também de migração nova** com a mesma mudança;
> `PG_REPLAY=<replay> bash scripts/db/validar-baseline.sh` reprova a divergência (passo 5), e a seção "baseline ×
> migrações" de `bash scripts/db/fotografia-banco.sh` deve vir sem diferença.

- **RLS por módulo, falha fechada.** As policies `acesso_total_*` (qualquer usuário logado) saem; cada
  tabela recebe policies de `can_access_module` conforme `supabase/baseline/rls/mapa.csv` (fonte da
  verdade, gerada em `rls/35_policies_geradas.sql`). Tabela fora do mapa reprova no teste.
- **RLS por permissão (classe `permissao` do gerador).** Leitura pelo módulo, como em `modulo` (sufixos
  `;proprio`, `;pai=<tabela>.<fk>` e `;filho=<tabela>.<fk>` acrescentam a leitura do próprio servidor, direta,
  pela tabela pai ou por uma tabela filha com `servidor_id`); escrita (INSERT/UPDATE/DELETE) exige o módulo
  **e** a permissão granular do `extra` (`escrita=<código>`), via `can_access_module` + `has_permission_code`.
  Hoje são 29 tabelas (apurado em 2026-10-11): as 10 da folha <!-- numero-datado --> (`financeiro.folha.processar` para operar,
  `financeiro.folha.configurar` para rubricas, parâmetros e tabelas de INSS/IRRF) — detalhe em
  [RBAC_PERMISSOES.md](./RBAC_PERMISSOES.md#folha-rls-por-permissão-onda-b--b1) —, 12 do RH na B2 (férias,
  licenças, viagens, frequência; seção "RH — frequência e ponto" abaixo) e 3 na B3 (`frequencia_pacotes`,
  `frequencia_arquivos`, `documentos_requerimento_servidor`; mesma seção) e 4 que passaram de `modulo` na E3
  (`eventos_esocial`, `remessas_bancarias`, `pensoes_alimenticias`, `itens_retorno_bancario`; seção "Leitura dos
  contracheques e da remuneração" abaixo). A B2 acrescentou ao gerador lista de
  códigos (`escrita=a|b`) e os sufixos `;excluir=`, `;insere_proprio`, `;sem_autoaprovacao`, `;coluna=` e
  `;posse=usuario`; a correção de contornos levou `escrita=` à classe `catalogo` e `sem_autoaprovacao` à
  `proprio_leitura`; a E3 acrescentou `;leitura=<código>|<código>` (leitura pelo módulo exige também um dos
  códigos) e `excluir=ninguem` (sem policy de DELETE), este também na classe `modulo` (formato no
  [README do baseline](../supabase/baseline/README.md)). `scripts/db/testar-rls.sql`
  cobre a classe com uma persona por código (módulo + código em `user_modules.permissions`) e uma persona
  com a permissão avulsa sem o módulo (não lê nem escreve).
- **Perfil ativo é pré-condição.** `is_admin_user`, `has_permission_code` e `meu_servidor_id` passam a
  exigir `profiles.is_active`; administrador bloqueado deixa de ser administrador. Desde a migração
  `supabase/migrations/20261010070000_onda_b_folha_rls_permissao.sql` essas funções-base (e `usuario_eh_admin`,
  `has_role`/`has_module`/`can_access_module` sem stub, `registrar_transicao_folha`, `folhas_proteger_fechamento`,
  `fechar_folha`, `reabrir_folha`) também são recriadas por migração, com o texto dos overlays 10 e 18: o banco
  produzido só pelo replay das migrações passa a ter as mesmas funções do baseline.
- **`profiles` protegido.** Um trigger impede quem não é admin de mudar `is_active`, `servidor_id`,
  bloqueio, tipo, CPF e e-mail; antes qualquer usuário se ativava e assumia o servidor de outro.
- **RPCs.** `fn_gerar_numero_financeiro` aceita só tipos de uma lista (havia injeção de SQL); as RPCs de
  leitura com dado pessoal rodam como o usuário (`SECURITY INVOKER`); `fn_atualizar_situacao_servidor` perde o
  EXECUTE de `authenticated` (no banco só de migrações, desde a migração `20261010090000` da B2, também de
  PUBLIC e `anon`) (`processar_folha_pagamento` voltou a ser executável por `authenticated` na migração
  `20261010070000`, com guarda `financeiro.folha.processar` no corpo); função nova não nasce executável por
  `anon` nem por PUBLIC.
- **`anon`** só tem as 14 RPCs públicas (denúncia, dado oficial, árbitros, gestores escolares, portal da transparência e,
  desde a migração `20261012140000`, as 4 do pré-cadastro público) e as tabelas de formulário/portal declaradas no mapa (coluna `anon`);
  `authenticated` mantém os privilégios padrão de tabela (menos `TRUNCATE`/`TRIGGER`, e sem escrita em
  `audit_logs`), limitados pela RLS. As exceções são as funções `SECURITY DEFINER` de apoio listadas no teste.
- **Formulários e pedidos.** Quem não gere o módulo não escolhe `status`, aprovação nem autoria (nos pedidos
  de abono, ajuste e justificativa do RH, desde a B2, e no pedido de documento do servidor, desde a B3: quem
  não tem a permissão, ou pede para si); os links
  do formulário de árbitros só podem apontar para o bucket `arbitros-docs`.
- **Fechamento de folha** só por quem pode (trigger em `folhas_pagamento`), e o bloqueio automático por
  `servidores.situacao` nunca reativa administrador nem conta bloqueada à mão.
- **Storage** por módulo; anônimo só envia arquivo (imagem/PDF até 5 MB) nas pastas do formulário de árbitros.
  Desde a B3, `frequencias` e `documentos-requerimento` gravam só com o módulo `rh` **e** o código do catálogo, e
  o servidor lê o próprio arquivo (seção "RH — frequência e ponto").
- Corrige `handle_new_user` (cadastro no Auth falhava) e as funções de folha que dependiam de funções removidas.
- Sementes só de catálogo/parâmetros: sem servidores, usuários ou auditoria.

Alterar RLS do baseline = editar `rls/mapa.csv` e rodar `node scripts/db/gerar-rls.mjs` (o gate confere);
mudança de schema continua por migração nova (e regeneração do baseline). Tabela nova precisa de linha no mapa.

### Limpeza e desempenho (P11, 16/10/2026)

Migração `supabase/migrations/20261016220000_banco_limpeza_desempenho.sql`, idempotente:

- **Auditoria com o papel de quem mexeu.** `fn_audit_log_licitacoes()` (trigger nas 43 tabelas auditadas em <!-- numero-datado -->
  `audit_log_licitacoes`) lia o perfil em `usuario_perfis`/`perfis`, que não existem mais; o erro era engolido e
  `usuario_perfil` ficava sempre vazio. Agora lê `user_roles` (`admin`, `manager` ou `user`).
- **`search_path` fixo** em `folha_avos_13`, `folha_dias_comerciais`, `folha_item`, `get_parametro_vigente` (as
  duas versões) e `update_updated_at_column`. Nenhuma função de `public` fica sem `search_path` fixo.
- **Índice em toda chave estrangeira de dados.** 196 índices `idx_<tabela>_<coluna>` nas FKs que não tinham índice
  cobrindo a coluna (ficha financeira, rubrica, retorno bancário, vínculo, lotação, `fin_*`, movimentações e
  afins). Ficam sem índice, de propósito, as 225 FKs de autoria (`created_by`, `aprovado_por`… para `auth.users`
  ou `profiles`): nenhuma consulta filtra por elas e usuário é desativado, não apagado. Regra daqui em diante: FK de dados
  nova nasce com índice na mesma migração.
- **Sem Realtime.** `folhas_pagamento` e `fichas_financeiras` saíram da publicação `supabase_realtime` (nenhuma
  tela assina mudanças); o overlay de Realtime do baseline (`60_realtime.sql`) saiu junto.
- Já resolvidos antes, sem mudança aqui: `usuario_tem_acesso_modulo`/`usuario_tem_acesso_rota` e a tabela
  `_backup_usuario_modulos_old` (P02); `promover_rascunho` funciona (sem chamador no front).

<!-- doc-links-absent: overlay/60_realtime.sql, 60_realtime.sql -->

### Segurança dos formulários públicos e das funções de permissão (P12, 17/10/2026)

Migração `supabase/migrations/20261017090000_seguranca_formularios_publicos.sql`, idempotente; os overlays 18, 20 e
40 do baseline e o `rls/mapa.csv` trazem a mesma mudança:

- **Limite por IP nos caminhos públicos.** Tabela nova `limite_requisicoes_publicas` (classe `fechada` no mapa: RLS
  ligado, sem policy e sem privilégio para `anon`/`authenticated`) e função `limite_publico_consumir(acao, limite,
  modulo)` (`SECURITY DEFINER`, sem EXECUTE pela API). O IP vem de `trilha_contexto_requisicao()` e é guardado só
  como hash md5 junto da ação; a janela é de 1 hora e o excesso dá o erro `PT429` (HTTP 429). Linhas com mais de 1 dia
  são apagadas a cada uso. Contam `anon` e o logado sem o módulo dono do formulário; a equipe do módulo, a service
  role e as migrações não contam. Limites por hora: `registrar_gestor_publico` 10, `consultar_gestor_por_cpf` 30,
  `arbitro_cpf_cadastrado` 30, `registrar_denuncia_publica` 10 e, pelo trigger `trg_limite_publico`, INSERT em
  `cadastro_arbitros` 20, `cadastro_arbitros_modalidades` 100 e `federacoes_esportivas` 10. Os limites dependem do IP
  real em `x-real-ip`: se o proxy entregar um IP interno, todos caem na mesma cota (conferir na VPS).
- **Gestores escolares.** Sai a policy `insercao_publica_gestores` e o INSERT de `anon` na tabela: o cadastro
  público é só pela RPC `registrar_gestor_publico`. Duplicidade de CPF, e-mail ou escola volta como mensagem neutra
  no corpo (`{erro}`), e a RPC devolve só o nome enviado, o status e o nome da escola. `consultar_gestor_por_cpf`
  devolve só `{status, escola: {nome}}` (sem nome da pessoa e sem ids) e passou a `VOLATILE`; a tela
  `ConsultaGestorPage` não mostra mais o nome e tem mensagem própria para o 429.
- **Cadastro público de federações e árbitros.** O INSERT público deixa de ser `WITH CHECK (true)`:
  `federacoes_esportivas` (`cadastro_publico_insert`) só com `status = 'em_analise'` e `analisado_por`,
  `data_analise` e `observacoes_internas` nulos; `cadastro_arbitros` só com `status = 'enviado'` (o protocolo
  continua forçado pelo `trg_forcar_campos_iniciais`); `cadastro_arbitros_modalidades` só com `status = 'pendente'`
  e `observacoes` nulo.
- **Funções de permissão.** `get_user_permission_codes`, `listar_permissoes_usuario`,
  `get_permissions_from_servidor` e `get_user_permissions`, chamadas pela API (`anon`/`authenticated`) para outro
  usuário por quem não é admin, dão `42501`; o próprio usuário, o admin, a service role e as chamadas internas
  (policies com `auth.uid()`) continuam. `get_chefe_unidade_atual` responde só a quem lê `nomeacoes_chefe_unidade`
  pela RLS (módulos `rh` ou `patrimonio`; admin); os demais recebem vazio.
- **Fica pendente:** `has_permission_code`, `can_access_module` e `is_admin_user` ainda aceitam o uuid de outro
  usuário ([AUDITORIA_USUARIOS.md](./AUDITORIA_USUARIOS.md)).

Testes no bloco "P12" de `scripts/db/testar-rls.sql`; `validar-baseline.sh` com `PG_REPLAY` aprovado (RLS com 0
falhas) e `src/integrations/supabase/types.ts` regenerado.

### Limpeza do P13 (18/10/2026)

A migração `supabase/migrations/20261018100000_remove_tabelas_backup_aposentado.sql` apagou as tabelas
`backup_config`, `backup_history` e `backup_integrity_checks` e os enums `backup_status` e `backup_type`. Eram do
backup antigo em JSON (Edge Function `backup-offsite` e tela `/admin/backup`), aposentado no P06. O backup oficial
é o da VPS ([BACKUP.md](./BACKUP.md)) e não guarda nada no banco.

- Antes, foi verificado que nenhum código (`src/`, `supabase/functions/`, `scripts/`, `.github/`), view, função ou
  tabela de fora delas as usava (a única FK era interna, `backup_integrity_checks` → `backup_history`).
- `DROP` sem `CASCADE`, na ordem da FK: se algo novo passar a depender delas, a migração falha em vez de apagar o
  dependente. Idempotente (`IF EXISTS`).
- Saíram também do `supabase/baseline/rls/mapa.csv` e do catálogo do baseline.

## Tabelas por domínio

### Autenticação, RBAC e administração
`profiles`, `user_roles`, `user_modules`, `user_org_units`, `module_access_scopes`,
`module_permissions_catalog`, `module_settings`, `form_field_config`,
`audit_logs`, `audit_log_licitacoes`, `approval_requests`, `approval_delegations`.
As tabelas do backup antigo (`backup_*`) e a `_backup_usuario_modulos_old` não existem mais (P13 e P02).

### RH — servidores e vida funcional
`servidores`, `vinculos_servidor`, `vinculos_funcionais`, `servidor_regime`,
`regimes_trabalho`, `servidor_tags`, `servidor_tag_vinculos`, `historico_funcional`,
`provimentos`, `ocorrencias_servidor`, `documentos_requerimento_servidor`,
`pre_cadastros`, `lotacoes`, `memorandos_lotacao`, `designacoes`,
`ferias_servidor`, `licencas_afastamentos`, `portarias_servidor`,
`viagens_diarias`, `configuracao_jornada`, `horarios_jornada`.

### RH — frequência e ponto
`frequencia_mensal`, `frequencia_fechamento`, `frequencia_arquivos`,
`frequencia_pacotes`, `registros_ponto`, `justificativas_ponto`,
`solicitacoes_ajuste_ponto`, `solicitacoes_abono`, `tipos_abono`, `banco_horas`,
`lancamentos_banco_horas`, `dias_nao_uteis`, `feriados`,
`config_assinatura_frequencia`, `config_fechamento_frequencia`,
`config_jornada_padrao`, `config_compensacao`, `config_incidencias`.

Segurança do RH — Onda B / B2 (migração `supabase/migrations/20261010090000_onda_b_rh_permissoes.sql`,
mesclada na PR #69 em 2026-10-10, e a correção de contornos
`supabase/migrations/20261010100000_onda_b_rh_contornos.sql`, mesclada na PR #71; as duas idempotentes, valem
para o banco do baseline e para o só-migrações; dependem da S0 `20261010080000` e da B1). Regra por tabela e
quem perde acesso em
[RBAC_PERMISSOES.md](./RBAC_PERMISSOES.md#férias-licenças-viagens-e-frequência-rls-por-permissão-onda-b--b2).
Os itens marcados "(contornos)" são da segunda migração.

<!-- numero-datado:inicio -->
- **Policies** de 16 tabelas do RH (as `acesso_total_*`, `rh_module_*` e `vinculos_*` saem): 12 na classe
  `permissao` — gravar exige o módulo `rh` **e** um código do catálogo (`ferias_servidor`,
  `licencas_afastamentos`, `viagens_diarias`, `registros_ponto`, `frequencia_mensal`, `solicitacoes_abono`,
  `frequencia_fechamento`, `config_fechamento_frequencia`, `solicitacoes_ajuste_ponto`,
  `justificativas_ponto`, `banco_horas`, `lancamentos_banco_horas`); `servidores`, `vinculos_servidor` e
  `lotacoes` em `proprio_leitura` (o servidor lê a própria linha por `meu_servidor_id()`; em `servidores`
  a posse é a coluna `id` e o DELETE exige `rh.servidores.excluir`); `cargos` em `catalogo`. `anon` perde
  todo privilégio nas 16 tabelas e `authenticated` perde TRUNCATE/TRIGGER/REFERENCES.
- **(contornos)** `tipos_abono`: classe `catalogo` com `escrita=rh.frequencia.configurar` (qualquer usuário
  ativo lê; gravar exige o módulo `rh` e o código), porque `exige_aprovacao_rh` decide se a chefia encerra o
  fluxo do abono. `servidores`: `proprio_leitura` com `sem_autoaprovacao` — quem tem o módulo grava qualquer
  ficha menos a própria (`NOT eh_meu_servidor(id)`, também no DELETE); admin passa.
  `solicitacoes_ajuste_ponto`: DELETE só com `rh.frequencia.lancar`.
- **Posse por usuário.** Em `banco_horas` e `solicitacoes_ajuste_ponto` a coluna `servidor_id` tem FK para
  `profiles(id)`, não para `servidores`: a posse é comparada com `auth.uid()` (sufixo `;posse=usuario`), e
  `lancamentos_banco_horas` herda a regra pelo banco de horas pai.
- **Sem autoaprovação** em 11 das 12 tabelas `permissao` (todas menos `config_fechamento_frequencia`):
  quem grava pelo caminho da permissão não grava a própria linha (admin passa). Na justificativa a posse vem
  de `registros_ponto`; nos lançamentos, de `banco_horas`. O servidor insere o próprio pedido de abono,
  ajuste e justificativa pelo caminho da posse.
<!-- numero-datado:fim -->
- **Função `eh_meu_servidor(uuid)`** (`SECURITY DEFINER`, `STABLE`, `search_path` fixo, EXECUTE só para
  `authenticated`; mesmo texto no overlay 10): verdadeira se o id é `meu_servidor_id()` ou, quando o perfil
  não tem vínculo, se os dígitos do CPF do perfil batem com os do servidor (CPF vazio nunca casa). Nunca
  devolve NULL. É a condição "não é sua" das policies e da isenção de `forcar_campos_iniciais`. Nos
  contornos passa a plpgsql: lê `meu_servidor_id()` uma vez só e compara os CPFs com `lpad(dígitos, 11, '0')`
  (CPF gravado sem o zero inicial casa).
- **Exclusão** de abono, fechamento, justificativa e (contornos) ajuste de ponto só com
  `rh.frequencia.lancar`.
- **Trigger `trg_validar_etapa_frequencia`** (função `validar_etapa_frequencia()`, `SECURITY DEFINER`,
  `search_path` fixo, sem EXECUTE para PUBLIC/`anon`/`authenticated`), BEFORE INSERT, UPDATE e DELETE em
  `solicitacoes_abono` e `frequencia_fechamento` e, nos contornos, também em `justificativas_ponto` e
  `solicitacoes_ajuste_ponto`:
  - abono: `created_by` = `auth.uid()` no INSERT (também para quem tem a permissão) e imutável depois
    (contornos); sem `rh.frequencia.lancar`, servidor, tipo, datas, horas, justificativa e `documento_url`
    nunca mudam, nem em pendente (contornos; antes, só fora de pendente), `motivo_rejeicao` só ao rejeitar um
    pendente e `aprovado_chefia_*` só junto com a decisão sobre um pendente; a chefia (`rh.aprovar`) só
    decide a partir de `pendente`, para `aprovado_chefia`, `rejeitado` ou `aprovado` (este só se o tipo de
    abono da linha antes do comando dispensa o RH);
  - fechamento: `servidor_id`, `ano` e `mes` imutáveis; `assinado_servidor*` só pelo dono; linha
    consolidada travada sem `rh.frequencia.lancar`; validar exige `rh.aprovar`; reabrir e consolidar,
    `rh.frequencia.lancar`;
  - (contornos) justificativa e ajuste: sem `rh.frequencia.lancar`, o texto do pedido não muda; a decisão
    só com `rh.aprovar`, de `pendente` para `aprovada` ou `rejeitada`; `aprovador_id`, `data_aprovacao` e
    `observacao_aprovador` só junto com essa decisão;
  - DELETE exige `rh.frequencia.lancar`;
  - autoria: a etapa que acontece no comando grava o seu par (`<etapa>_por`/`<etapa>_em`, ou
    `aprovador_id`/`data_aprovacao`) com `auth.uid()` e `now()`, mesmo que o cliente não o envie (contornos);
    enquanto a etapa vale (status ou flag ativos), o par não pode ser apagado (contornos); fora disso, o par
    que muda para valor não nulo também é gravado pelo banco. O valor do cliente é ignorado.

  O papel admin, a service role e funções internas passam (o teste é o GUC `role`). Recusa com `42501`. O
  nome começa com `trg_v` para rodar depois de `trg_forcar_campos_iniciais`. Limitação: o servidor ainda
  não assina o próprio fechamento pela API (não há policy de UPDATE para o dono).
- **`forcar_campos_iniciais`** aceita no primeiro argumento, além de `<módulo>`, o formato
  `perm:<módulo>:<c1>|<c2>[:<tabela_pai>.<coluna_fk> | :usuario]`: fica isento (pode gravar status e
  aprovação no INSERT) só quem tem o módulo **e** um dos códigos, e mesmo assim não na própria linha (posse
  por `servidor_id` ou pela tabela pai, conferida por `eh_meu_servidor`; com `:usuario`, `servidor_id`
  comparado a `auth.uid()`). Usado em `solicitacoes_abono`, `justificativas_ponto` e
  `solicitacoes_ajuste_ponto` (`:usuario`), sempre com `rh.aprovar|rh.frequencia.lancar`; desde a B3, também
  em `documentos_requerimento_servidor`, com `perm:rh:rh.servidores.editar`. A migração cria a função e os triggers no
  só-migrações, onde não existiam; o overlay 20 tem o mesmo texto. EXECUTE só para `authenticated` e
  `service_role`.
- **`fn_atualizar_situacao_servidor`** sem EXECUTE para PUBLIC, `anon` e `authenticated` (só os triggers a
  chamam), como no overlay 40.
- Pendente, anterior à B2: quem tem o módulo `rh` muda `servidores.situacao` de outro servidor, o que bloqueia
  o perfil vinculado.

Arquivos do RH — Onda B / B3 (migração `supabase/migrations/20261010210000_onda_b_rh_storage.sql`, **em PR
rascunho**; idempotente, vale para o banco do baseline e para o só-migrações; no baseline o mesmo texto está nos
overlays 10, 20, 40 e 50 e em `rls/mapa.csv`). Regra por bucket e tabela, quem perde acesso e a conferência
pós-deploy em
[RBAC_PERMISSOES.md](./RBAC_PERMISSOES.md#arquivos-do-rh-e-download-de-frequência-onda-b--b3).

- **Policies** de `frequencia_pacotes`, `frequencia_arquivos` e `documentos_requerimento_servidor` na classe
  `permissao` (SQL copiado do gerador; as `acesso_total_*` e os nomes antigos saem). Extra no mapa:
  `escrita=rh.frequencia.lancar|rh.frequencia.criar|rh.frequencia.editar` nas duas de frequência (com `;proprio`
  em `frequencia_arquivos`) e `escrita=rh.servidores.editar;proprio;insere_proprio` no pedido de documento. `anon`
  perde todo privilégio nas três e `authenticated` perde TRUNCATE/TRIGGER/REFERENCES.
- **Função `eh_meu_arquivo_frequencia(text)`** (`sql`, `STABLE`, `SECURITY DEFINER`, `search_path` fixo, EXECUTE
  só para `authenticated`; mesmo texto no overlay 10): verdadeira se há linha em `frequencia_arquivos` com
  `arquivo_path` igual ao nome do objeto e `servidor_id = meu_servidor_id()`. Usada na leitura do bucket
  `frequencias`.
- **Função `eh_minha_pasta_servidor(text)`** (`plpgsql`, mesmos atributos): verdadeira se a primeira pasta do
  caminho tem formato de uuid (conferido antes do cast; fora do padrão dá `false`, sem erro) e é
  `meu_servidor_id()`. Usada na leitura do bucket `documentos-requerimento`.
- As duas exigem perfil ativo (`is_active_user()`) e nunca devolvem NULL.
- **CHECK `frequencia_pacotes_arquivo_path_seguro` e `frequencia_arquivos_arquivo_path_seguro`** (`NOT VALID`:
  não reprova linha antiga, vale para toda linha nova ou alterada): `arquivo_path` nulo ou caminho relativo não
  vazio, sem `/` inicial, sem segmento `.` ou `..` e sem `%`, `\`, `?` ou `#`. A Edge Function
  `download-frequencia` confere a mesma regra antes de assinar.
- **Índice** `idx_frequencia_arquivos_arquivo_path` em `frequencia_arquivos(arquivo_path)`, para a busca da
  policy de leitura do bucket.
- **`forcar_campos_iniciais`** em `documentos_requerimento_servidor` passa ao formato
  `perm:rh:rh.servidores.editar`: quem não tem o módulo e o código, ou pede o próprio documento, grava
  `status = pendente`, `arquivo_assinado_url`, `data_upload_assinado` e `modelo_url` nulos e `created_by` =
  `auth.uid()`.
- **Storage**: policies `st_frequencias_*`, `st_documentos-requerimento_*` e `st_documentos_*`; os três buckets
  com `public = false`; `documentos-requerimento` com 10 MB e `application/pdf`, `image/jpeg`, `image/png`,
  `image/webp`. No fim, a migração emite `WARNING` (não erro) para cada outra policy de `storage.objects` que
  ainda valha para esses buckets.

### Folha de pagamento
`folhas_pagamento`, `folha_historico_status`, `fichas_financeiras`,
`itens_ficha_financeira`, `lancamentos_folha`, `rubricas`, `rubricas_historico`,
`config_rubricas`, `config_tipos_rubrica`, `parametros_folha`, `consignacoes`,
`dependentes_irrf`, `pensoes_alimenticias`, `tabela_inss`, `tabela_irrf`,
`adicionais_tempo_servico`, `config_fechamento_folha`, `exportacoes_folha`,
`bancos_cnab`, `remessas_bancarias`, `retornos_bancarios`,
`itens_retorno_bancario`, `eventos_esocial`.

Cálculo do INSS e do IRRF (migração `20261019200000_folha_irrf_lei15270_regime_proprio.sql`):

- `calcular_irrf_mensal(rendimentos, deduções legais, data)` devolve base, dedução usada, imposto pela tabela,
  redução e IRRF. Usa o desconto simplificado quando é maior que as deduções legais e aplica a redução da Lei
  15.270/2025 sobre os rendimentos. Os valores vêm de `parametros_folha` (`desconto_simplificado_irrf`,
  `irrf_reducao_limite_isencao`, `irrf_reducao_maxima`, `irrf_reducao_limite`, `irrf_reducao_constante`,
  `irrf_reducao_coeficiente`); sem eles a parte correspondente não se aplica e a ficha sai com
  `desconto_simplificado_irrf_nao_configurado` ou `reducao_irrf_nao_configurada`. Sem EXECUTE pela API.
- `folha_montar_ficha` (mensal): pensão alimentícia calculada antes do IRRF e deduzida da base; sobre o líquido,
  pensão e IRRF são recalculados até o IRRF parar de mudar. 13º e rescisão seguem com `calcular_irrf` direto.
- `servidores.contribui_rpps_origem`, `rpps_origem_fundamento` e `rpps_origem_inicio`: com a opção (que exige
  fundamento e início, constraint `servidores_rpps_origem_fundamentado`), a folha não desconta INSS; vínculo efetivo
  externo sem a opção marca a ficha com `regime_previdenciario_a_confirmar`.
- `tabela_inss.aliquota` e `tabela_irrf.aliquota` são fração (constraints `*_aliquota_fracao`, 0 a 1); a migração
  converte o que estiver gravado em %. `parametros_folha.valor` passou a `numeric(18,6)`.
- Testes no bloco "FOLHA: cálculo do INSS e do IRRF" de `scripts/db/testar-rls.sql`.

Atos remuneratórios (migração `20261020100000_folha_atos_remuneratorios.sql`, em PR rascunho):

- `atos_remuneratorios` (tipo, número, datas do ato e da publicação, `vigencia_inicio`, ementa, percentual,
  processo SEI, link) e `atos_remuneratorios_itens` (alvo `cargo`, `rubrica` ou `parametro`, `valor_novo`,
  `valor_anterior` gravado ao aplicar; um alvo por item e por ato): classe `permissao` do mapa, o módulo `rh` lê e a
  escrita exige `financeiro.folha.configurar`. O ato nasce `rascunho`; itens só mudam com o ato em rascunho; aplicado,
  ato e itens não mudam nem saem (`RHE02`, triggers `ato_remuneratorio_integridade` e
  `ato_remuneratorio_item_integridade`).
- `cargo_vencimentos` (classe `trilha`, imutável): vencimento ou subsídio do cargo por vigência, com origem `inicial`
  (o valor do cadastro antes do primeiro ato, vigente desde 1900-01-01), `ato` ou `cadastro`.
  `vencimento_cargo_em(cargo, data)` devolve o vigente na data e, sem histórico, `cargos.vencimento_base`. Em cargo com
  histórico, mudar `cargos.vencimento_base` grava uma linha `cadastro` vigente de hoje (trigger
  `trg_cargo_vencimento_pelo_cadastro`).
- `aplicar_ato_remuneratorio(ato)` (`SECURITY DEFINER`, só `authenticated`; exige o módulo `rh` e
  `financeiro.folha.configurar`, senão `42501`): tudo ou nada. Cargo: linha no histórico e
  `cargos.vencimento_base` com o valor vigente hoje (ato com vigência futura não muda o cadastro agora). Rubrica: troca
  `formula_valor` (as rubricas não têm vigência por valor). Parâmetro: fecha a vigência aberta na véspera e cria a nova;
  recusa (`22023`) quando já há valor com vigência igual ou posterior.
- `processar_folha_pagamento` e `folha_montar_ficha` leem o vencimento por `vencimento_cargo_em` no último dia da
  competência; vigência que começa depois do dia 1 marca a ficha com `vencimento_alterado_na_competencia` (o mês sai
  com o valor novo inteiro). Diferenças de meses já fechados não são calculadas.
- Testes no bloco "FOLHA: atos remuneratórios" de `scripts/db/testar-rls.sql`.

Segurança da folha (migração `supabase/migrations/20261010070000_onda_b_folha_rls_permissao.sql`, mesclada
na PR #63; idempotente, vale tanto para o banco do baseline quanto para o produzido só
pelas migrações):

- Policies por permissão nas 10 tabelas da folha (classe `permissao`, acima) e remoção das `acesso_total_*` <!-- numero-datado -->
  delas na mesma transação; `anon` perde todo privilégio nas dez tabelas e `authenticated` perde
  TRUNCATE/TRIGGER/REFERENCES (a RLS não cobre TRUNCATE); as funções-oráculo que as policies chamam
  (`has_module`, `can_access_module`, `get_user_permission_codes`, `folha_esta_bloqueada`,
  `usuario_pode_fechar_folha`, `usuario_pode_reabrir_folha`) deixam de ser executáveis por `anon`.
- `processar_folha_pagamento`: guarda `has_permission_code(auth.uid(), 'financeiro.folha.processar')` no
  início (`42501`, não engolido pelo handler da função); EXECUTE para `authenticated` e `service_role`, não
  para `anon`/PUBLIC. O `DELETE FROM fichas_financeiras` do reprocessamento continua (preservar itens
  manuais é pendência).
- Triggers BEFORE INSERT `trg_bloquear_insercao_ficha_fechada` (`fichas_financeiras`) e
  `trg_bloquear_insercao_item_ficha_fechada` (`itens_ficha_financeira`): folha bloqueada
  (`folha_esta_bloqueada`) recusa a inclusão com `42501`, exceto para `usuario_eh_admin` — espelho dos triggers
  de UPDATE/DELETE já existentes. Novo `trg_folhas_proteger_exclusao` (BEFORE DELETE em `folhas_pagamento`):
  folha fechada só o admin apaga (a cascata levaria fichas e itens). `bloquear_alteracao_ficha_fechada` e
  `bloquear_alteracao_item_ficha_fechada` são recriados para checar também a folha de **origem** (mover
  ficha/item para fora de uma folha fechada era permitido) e passam a usar `ERRCODE 42501`.
- Índice único parcial `itens_ficha_financeira_ficha_referencia_desconto_uidx` em
  `(ficha_id, lower(referencia)) WHERE tipo = 'desconto' AND referencia IS NOT NULL` (um desconto por
  referência em cada ficha). Criado só se não houver duplicata; com duplicata a migração emite `WARNING` no log
  do CI e segue, e o índice fica para depois da limpeza manual.
- Auditoria `fn_audit_trigger('rh')` (AFTER INSERT/UPDATE/DELETE) em `folhas_pagamento`,
  `itens_ficha_financeira` e `consignacoes`. `fichas_financeiras` e `dependentes_irrf` ficam de fora de
  propósito (dado bancário e CPF iriam inteiros para `audit_logs`). Desde a E1 (seção seguinte) as duas têm
  trilha, com conta, agência e CPF mascarados.
- `module_permissions_catalog`: `financeiro.folha.%` passa a `module_code = 'rh'` (códigos inalterados).

### Trilha de auditoria e servidor responsável do RH — Onda E1

Migrações `supabase/migrations/20261011000000_rh_autoria_trilha.sql` (autoria e trilha) e
`supabase/migrations/20261011000100_rh_auditoria_leitura.sql` (permissão e policy de leitura, separada para poder ser
segurada: mexe em RLS existente), **em PR rascunho**. Idempotentes, valem para o banco do baseline e para o
só-migrações; spec [`2026-10-10-rh-trilha-auditoria-design.md`](./superpowers/specs/2026-10-10-rh-trilha-auditoria-design.md),
levantamento em [`planejamento/REVISAO_RH.md`](./planejamento/REVISAO_RH.md) §3. Escopo: as 79 tabelas com `rh` em <!-- numero-datado -->
`modulos` no `supabase/baseline/rls/mapa.csv` (lista explícita na migração; a que não existir é pulada com NOTICE).

- **Responsável** — `trilha_contexto()` (plpgsql, `SECURITY DEFINER`, sem EXECUTE para a API) lê **uma vez por
  transação** `auth.uid()`, o `profiles.servidor_id` desse usuário **naquele momento** (retrato; não exige perfil
  ativo), nome e matrícula do servidor, papel, unidade principal, IP e user agent, e guarda na variável local
  `trilha.contexto` (`set_config(..., true)`, some no fim da transação). A chave do cache é usuário + papel da sessão +
  hash dos cabeçalhos: se mudar, relê; mudança em `profiles` (vínculo), `user_roles` ou `user_org_units` zera o cache
  (trigger `trilha_contexto_invalidar`). A API não define variáveis de sessão (o PostgREST só grava `request.*`), então
  o cliente não forja o cache. `responsavel_atual()` devolve o mesmo em formato de tabela. Origem: `usuario`,
  `usuario_sem_vinculo`, `sistema` (sem `auth.uid()` e fora dos papéis da API: service role, Edge Function, job) ou
  `anonimo` (papel `anon` sem usuário). `rh_exige_servidor_vinculado()` devolve `false` (decisão 1 da revisão: quem
  não tem servidor vinculado lança e a trilha marca `usuario_sem_vinculo`); bloquear é trocar para `true` numa
  migração nova.
- **Autoria gravada pelo banco** — nas 77 tabelas de lançamento: colunas `created_at`, `created_by`, <!-- numero-datado -->
  `created_by_servidor_id`, `updated_at`, `updated_by`, `updated_by_servidor_id` criadas onde faltam (sem DEFAULT nem
  FK: linhas antigas ficam nulas; as `*_by` que já existiam mantêm tipo e FK) e o trigger `zz_fixar_autoria`
  (`BEFORE INSERT OR UPDATE`, função `fixar_autoria()`). INSERT grava `created_*` e `updated_*` com o responsável
  atual; UPDATE devolve os `created_*` antigos (ninguém troca, nem admin) e grava `updated_*`. Em sessão da API o
  valor mandado pelo navegador é sempre ignorado; só a origem `sistema` informa o autor (Edge Function em nome de
  alguém; o servidor vem do perfil informado). O prefixo `zz_` faz o trigger rodar por último entre os BEFORE (ordem
  alfabética): a autoria final é a do banco, depois de `trg_forcar_campos_iniciais`, `trg_validar_etapa_frequencia`
  e `update_*_updated_at`.
- **Colunas de decisão** (argumentos do trigger, formato `por:em[:flag]`): `aprovado_por/data_aprovacao`
  (designações), `aprovador_id/data_aprovacao` (ponto; `aprovado` virando `true` também grava o par),
  `convertido_por/convertido_em` (pré-cadastro), `fechado_por/fechado_em` e `consolidado_por/consolidado_em`
  (fechamento da frequência), `enviado_por/enviado_em` (remessa e exportação), `enviado_por/data_envio` (eSocial;
  `enviado_por` é coluna nova) e `processado_por/data_processamento` (folha). Quando `_por` passa a um valor não nulo
  diferente, o par vira `auth.uid()` e `now()`. Na sessão da API a decisão não é apagada (`_por` mandado nulo volta ao
  valor antigo, com a data) e a data não muda sozinha (com `_por` igual ou sem autor, volta à antiga). A RPC que refaz
  a decisão liga a variável local `trilha.renovar_decisao` só durante o UPDATE dela (`processar_folha_pagamento`: o
  reprocessamento pelo mesmo usuário renova a data). De criação (gravadas no INSERT e imutáveis):
  `gerado_por/data_geracao` (eSocial e remessa), `gerado_por/gerado_em` (exportação), `emitido_por` (memorando),
  `processado_por` (retorno bancário). Sem isenção para admin. As etapas da frequência continuam em
  `validar_etapa_frequencia`, que deixa de isentar o admin da **autoria** (as regras de etapa continuam dispensadas
  para ele).
- **Folha** — `registrar_transicao_folha`: `fechado_por`, `conferido_por` e `reaberto_por` (e as datas) são de quem
  age, agora, e não mudam fora da transição de status (antes `COALESCE` com o valor do cliente; mesmo texto no
  overlay 18). `processar_folha_pagamento` grava `processado_por` e `data_processamento` de quem processou.
- **Trilha (`fn_audit_trigger` v2)**, mesma assinatura `fn_audit_trigger('<módulo>')`, agora em 77 tabelas do RH <!-- numero-datado -->
  (`audit_<tabela>`, módulo `rh`; as multimódulo como `documentos` e `contas_autarquia` também gravam `rh`) e, com
  módulo `admin`, em `profiles` (INSERT, DELETE e UPDATE de `servidor_id`, `is_active`, bloqueio, tipo, CPF, e-mail e
  `restringir_modulos`; troca de nome ou avatar não gera linha), `user_permissions`, `user_org_units` e
  `audit_colunas_sensiveis`. Colunas novas em `audit_logs`: `servidor_id`, `servidor_nome`, `servidor_matricula`
  (retrato, sem FK), `campos_alterados text[]`, `origem` (CHECK com os quatro valores, criado `NOT VALID` e validado
  em seguida), `transacao` (`txid_current()`) e `sequencia` (`bigint GENERATED ALWAYS AS IDENTITY`, com índice: ordem
  de gravação, porque `"timestamp"` é o início da transação e empata dentro dela). UPDATE que só mexe em `updated_*`
  não grava linha. Tabela sem coluna `id` uuid grava `entity_id` nulo e a chave primária em `metadata.chave`. A função
  já grava o contexto completo (papel, unidade, IP, user agent, transação).
- **Contexto completado** — trigger `trilha_completar_contexto` (`BEFORE INSERT` em `audit_logs`, só quando a linha
  chega sem `transacao` ou sem `origem`): quem grava sem informar (`log_audit`, `registrar_evento`, `fechar_folha`,
  `audit_permission_changes`, Edge Functions) recebe servidor do perfil de `user_id`, origem, `role_at_time`, unidade
  principal, IP e user agent de `request.headers`. **IP**: `x-real-ip`; sem ele, o **último** item de
  `x-forwarded-for` (o que o último proxy acrescentou; os anteriores vêm do cliente e podem ser forjados). O IP é
  **indicativo**: só vale o endereço de quem conectou se o nginx da VPS sobrescrever `X-Real-IP` com `$remote_addr`
  (e a cadeia até o PostgREST preservar esse cabeçalho). Cabeçalho ausente ou inválido vira nulo, sem erro.
- **Máscara LGPD** — tabela-catálogo `audit_colunas_sensiveis(tabela, coluna, tratamento, motivo)` (classe
  `catalogo_admin`: todo usuário ativo lê, só o papel admin altera, e a alteração vai à trilha), carregada pela
  migração com 123 colunas (só as que existem no banco): CPF e PIS `parcial` (`***.456.789-**`); RG (com órgão, UF e
  data), títulos e demais documentos, registro de estrangeiro, nascimento, nome social, e-mail pessoal, telefones,
  contato de emergência, endereço, agência e conta, PIX, dependentes (nome, documentos), filiação, raça/cor, saúde
  (CID, médico, CRM, atestado, PcD, tipo sanguíneo, moléstia grave), processo da pensão (número, vara, comarca,
  beneficiário, decisão), declarações e foto (links), indicação, geolocalização, IP e dispositivo do ponto, código de
  acesso do pré-cadastro, link do pacote de frequência e o **payload do eSocial** (`payload` e `payload_xml`: CPF
  completo e remuneração) viram `"[protegido]"`. O nome da coluna continua em `campos_alterados`. Funções
  `mascarar_parcial(text)` e `trilha_mascarar(text, jsonb)` (reaplicar não muda o valor). A trilha antiga do módulo
  `rh` (15 tabelas já auditadas antes da E1) é mascarada pela migração antes de ficar imutável. <!-- numero-datado -->
- **Trilha imutável** — trigger `trilha_imutavel` (`BEFORE UPDATE OR DELETE`, por linha) e
  `trilha_imutavel_truncate` (`BEFORE TRUNCATE`) em `audit_logs`, `folha_historico_status` e `rubricas_historico`,
  ambos `ENABLE ALWAYS` (valem também com `session_replication_role = replica`): recusam o **DML** com `42501` para
  todos, inclusive `postgres`, service role e superusuário. Não protege contra DDL: o dono da tabela e o superusuário
  ainda podem `DROP TRIGGER`/`DISABLE TRIGGER` (a imutabilidade é para o uso, não contra o administrador do banco).
  Exceções: o histórico some na cascata do pai (folha ou rubrica já excluída, exclusão registrada na trilha; linha com
  FK nula não passa por essa exceção) e a sessão com `SET LOCAL trilha.expurgo = 'autorizado'` (reservado a uma rotina
  futura de retenção; hoje nenhum expurgo, decisão 11; a própria migração o usa só para mascarar a trilha antiga).
  `pg_restore --clean` não é afetado (DROP não dispara trigger); restauração só de dados sobre tabela existente
  precisa do GUC. As tabelas do escopo perdem TRUNCATE/TRIGGER/REFERENCES para `anon` e `authenticated`.
- **Eventos sem gravação** — RPC `registrar_evento(acao, entidade, entidade_id, descricao, metadados)`: só
  `authenticated` com perfil ativo; ações `view`, `export`, `download` (imprimir = download); entidades numa lista
  fechada (as tabelas do RH e `contracheque`, `relatorio_rh`, `exportacao_rh`, `arquivo_esocial`, `arquivo_cnab`,
  `trilha_auditoria`). Exige o módulo `rh`; sem ele, só o **próprio** contracheque (`entidade_id` = ficha financeira
  do servidor do usuário). Metadados: objeto de até 4000 caracteres, sem as chaves que marcam linha de trigger.
- **`log_audit` não forja a trilha do RH** — no módulo `rh` (sem diferença de caixa ou espaços) só `view`, `export`
  e `download`, sem antes/depois (lançamento do RH entra pelos triggers); em qualquer módulo, as chaves `trigger`,
  `operation`, `table`, `registrar_evento` e `fonte` saem dos metadados, que levam `fonte = 'log_audit'`, e antes,
  depois e metadados têm limite de 32 KB cada (`22023`). Chamadores conferidos: contracheque (`view` no `rh`, segue
  funcionando), `useAuditLog` (módulos `financeiro` e `aprovacoes`; um `logCreate` com módulo `rh` passaria a falhar
  em silêncio, porque o hook engole o erro); a `backup-offsite`, que também chamava, foi aposentada no P06.
- **Leitura** — além do papel admin, policy `audit_logs_rh_auditoria_select` (migração 20261011000100, fora do
  gerador): quem tem o módulo `rh` **e** `rh.auditoria.visualizar` lê as linhas com `module_name = 'rh'` (ver
  [RBAC_PERMISSOES.md](./RBAC_PERMISSOES.md#trilha-de-auditoria-do-rh-onda-e1)).
- **Edge Functions** — `admin-create-user` e `delete-user` gravam pela service role (origem `sistema`, sem autor);
  cada uma grava também uma linha complementar em `audit_logs` (módulo `admin`, `entity_type = 'user'`) com o
  administrador que pediu, sem e-mail nem outro dado pessoal.
- **Volume e tempo** — `processar_folha_pagamento` apaga e recria as fichas a cada processamento: com a trilha em
  `fichas_financeiras` e `itens_ficha_financeira`, cada reprocessamento grava cerca de N×(2+k) linhas (N servidores,
  k itens apagados em cascata por ficha), com a linha inteira mascarada. Medição local (Postgres 16, 2000 servidores
  com provimento, sem itens): sem a E1, ~265 ms para processar e ~310 ms para reprocessar; com a primeira versão da E1,
  ~3,1 s e ~4,7 s; com o contexto em cache por transação e as funções de apoio em plpgsql, **~0,8–0,9 s e ~1,1–1,2 s**
  (6004 linhas de trilha nas duas passadas). O resto do custo é gravar a linha (jsonb inteiro e índices de
  `audit_logs`). Não bloqueia a folha; partição e retenção de `audit_logs` ficam para depois, e a tela
  `/admin/auditoria` fica pesada depois de processar a folha (a E2 refaz a tela).
- **Guard** — `scripts/check-autoria-rh.mjs` (no `scripts/gate.sh`) reprova tabela com `rh` no mapa sem, no schema do
  baseline, `zz_fixar_autoria` (`BEFORE INSERT OR UPDATE`, por linha, sem `WHEN`, `fixar_autoria`) e
  `audit_<tabela>` (`AFTER INSERT OR DELETE OR UPDATE` de todas as colunas, por linha, `fn_audit_trigger('rh')`)
  e, desde a regra de setor, `zz_exigir_setor` (`BEFORE INSERT OR DELETE OR UPDATE`, por linha, `exigir_setor()`) e
  `zz_exigir_setor_fim` (`AFTER INSERT OR DELETE OR UPDATE`, por comando, `exigir_setor_fim()`);
  classe `trilha`: `trilha_imutavel` e `trilha_imutavel_truncate`, ambos `ENABLE ALWAYS`; e reprova qualquer um deles
  desligado (`DISABLE TRIGGER` ou `ENABLE REPLICA TRIGGER`). Exceção só com motivo em `scripts/autoria-rh-excecoes.txt`
  (hoje nenhuma).
- **Riscos registrados** —
  - as FKs `NO ACTION` de `audit_logs.user_id` (para `auth.users`) e `audit_logs.org_unit_id` (para
    `estrutura_organizacional`), com a trilha imutável, impedem excluir o usuário ou a unidade que aparecem na trilha;
    o mesmo vale para as FKs de autoria antigas (`created_by` etc.) agora que o banco sempre grava o autor. A Edge
    Function `delete-user` passar a desativar em vez de excluir fica para a E2;
  - `delete-user` não é atômica: remove módulos, papéis e o vínculo e só depois exclui em `auth.users`; se a exclusão
    falhar, o usuário fica sem acessos (a trilha registra as duas etapas);
  - arquivos do Storage do RH: `frequencias` e `documentos-requerimento` ganharam trilha na E2 (seção seguinte);
    `documentos` (bucket do workflow e do RH) continua sem;
  - a exclusão de uma folha ou rubrica ainda leva o histórico dela pela cascata (a exclusão do pai fica na trilha).

### Consulta da trilha e arquivos do RH no Storage — Onda E2 (banco)

Migrações `supabase/migrations/20261011000200_rh_trilha_consulta.sql` (índices, trilha do Storage, `log_audit` e
`registrar_evento`) e `supabase/migrations/20261011000300_rh_trilha_alvos_folha.sql` (coluna `alvos` e folha no
módulo `rh`), **em PR rascunho** (saem da E1, PR #82). Idempotentes, valem para o banco do baseline e para o
só-migrações; spec [`2026-10-10-rh-trilha-tela-design.md`](./superpowers/specs/2026-10-10-rh-trilha-tela-design.md)
(item 1). A tela, o hook e as chamadas a `registrar_evento` são do front (mesma spec).

- **Índices de `audit_logs`**, todos na ordem da tela (`sequencia DESC`, paginação por cursor
  `sequencia < último visto`), criados só se não houver um equivalente (btree válido, sem `WHERE`, mesmas colunas
  na mesma ordem, qualquer nome e direção): `idx_audit_logs_entidade_seq (entity_type, entity_id, sequencia DESC)`
  (histórico de um registro), `idx_audit_logs_servidor_seq (servidor_id, sequencia DESC)` (o que um servidor
  lançou), `idx_audit_logs_modulo_seq (module_name, sequencia DESC)` (`/rh/auditoria`) e
  `idx_audit_logs_usuario_seq (user_id, sequencia DESC)`; mais o GIN `idx_audit_logs_alvos` (abaixo). Saem os três
  que viraram prefixo deles (`idx_audit_logs_entity`, `idx_audit_logs_module`, `idx_audit_logs_user`), só depois de
  o substituto existir: toda linha da trilha atualiza todos os índices (ficam 9). `user_id` continua coberto para a
  FK de `auth.users`. O período (`"timestamp"`) fica como filtro. **Ordene por `sequencia DESC` puro** (PostgREST:
  `order=sequencia.desc`, sem `nullsfirst`/`nullslast`): a coluna é `NOT NULL` e única (identity), e
  `NULLS LAST` não casa com nenhum índice (sort da tabela inteira: 32–46 ms com 300 mil linhas).
- **Planos medidos** (Postgres 16, 300 mil linhas sintéticas: 50 usuários, 2000 servidores, 24 folhas,
  `LIMIT 51`):

  | Consulta | Índice | Tempo |
  |---|---|---|
  | módulo `rh` (1ª página e cursor no meio) | `idx_audit_logs_sequencia` (filtro de módulo) | 0,13 ms |
  | módulo `rh` + período recente | `idx_audit_logs_sequencia` | 0,07 ms |
  | módulo `rh` + período antigo (2 h, 3 dias atrás) | `idx_audit_logs_sequencia`, varrendo o que é mais novo | **171 ms** |
  | usuário | `idx_audit_logs_usuario_seq` | 0,12 ms |
  | usuário + período antigo | `idx_audit_logs_timestamp` + top-N sort | 2,6 ms |
  | servidor responsável (sem e com período antigo) | `idx_audit_logs_servidor_seq` / `idx_audit_logs_timestamp` + sort | 0,08 / 1,7 ms |
  | registro (sem e com período) | `idx_audit_logs_entidade_seq` | 0,04 / 0,01 ms |
  | aba do servidor (`alvos`, sem e com período) | `idx_audit_logs_alvos` (bitmap) + top-N sort | 0,6 / 0,3 ms |
  | aba da folha (`alvos`, cursor) | `idx_audit_logs_sequencia` | 1,9 ms |
  | lista geral + período antigo | `idx_audit_logs_sequencia`, varrendo o que é mais novo | **124 ms** |

  O planner não sabe que `sequencia` acompanha `"timestamp"`: com período **antigo** e sem cursor, lê de trás para
  frente tudo o que é mais novo (cresce com a tabela). Saída barata, do lado do front: transformar o período em faixa
  de `sequencia` antes da consulta (`select sequencia from audit_logs where "timestamp" >= <limite> order by
  "timestamp" limit 1`, 0,06 ms pelo `idx_audit_logs_timestamp`, uma vez para o início e outra para o fim) e mandar
  `sequencia=gte.<de>&sequencia=lt.<até>` junto com o filtro de período: 171 ms → **0,13 ms**. Use folga (por
  exemplo 1 hora a mais nos dois lados): `"timestamp"` é o início da transação, então uma transação longa que cruza
  o limite do período tem linhas fora da faixa estrita; com folga e o filtro de período mantido, o resultado é exato.
- **`CREATE INDEX` comum, não `CONCURRENTLY`**: o CI aplica com `supabase db push`, que roda cada migração numa
  transação, e `CREATE INDEX CONCURRENTLY` não roda dentro de transação. Travas em `audit_logs` até o COMMIT da
  migração: o `CREATE INDEX` pega `SHARE` (toda gravação na trilha, ou seja, todo lançamento auditado, espera), o
  `DROP INDEX` dos índices antigos e o `ADD COLUMN alvos` (reescreve a tabela) pegam `ACCESS EXCLUSIVE` (também as
  **leituras** da trilha esperam). Com a tabela pequena do banco novo, segundos. Se `audit_logs` estiver grande na
  hora do merge, crie os índices antes, à mão, com `CREATE INDEX CONCURRENTLY` e as mesmas colunas, e apague os
  antigos com `DROP INDEX CONCURRENTLY`: a migração reconhece o equivalente e só apaga o que ainda existir (a coluna
  `alvos` continua exigindo a reescrita).
- **Recorte da aba "Histórico de alterações"** — coluna gerada `audit_logs.alvos text[]` (`STORED`) com GIN
  `idx_audit_logs_alvos`: `s:<servidor_id>` de `servidores.id` (`entity_type = 'servidores'`), de
  `after_data`/`before_data` `->> 'servidor_id'`, de `metadata ->> 'servidor_id'` e de
  `metadata ->> 'servidor_alvo_id'` **só** quando `metadata ->> 'fonte' = 'storage'`; `f:<folha_id>` de
  `folhas_pagamento.id`, de `after_data`/`before_data` `->> 'folha_id'` e de `metadata ->> 'folha_id'`. Consulta:
  `alvos=cs.{s:<id>}` (supabase-js: `.contains("alvos", ["s:<id>"])`), pela mesma RLS. Antes, um OR de cinco
  expressões em jsonb sem índice varria a trilha (56–470 ms por página com 300 mil linhas; servidor sem linha,
  ~400 ms). Alternativas medidas: 7 índices btree parciais por expressão (o planner seguiu varrendo pelo índice de
  `sequencia` com os mesmos tempos, e cada INSERT na trilha ficou ~24% mais caro: mediana de 100 mil INSERTs 4862 ms
  contra 3914 ms) e RPC `SECURITY INVOKER` (repetiria todos os filtros da tela e ainda dependeria de índice). Com a
  coluna e o GIN: 0,5–1,5 ms por página do servidor, 0,05 ms sem linha, 10–27 ms na página 11 de uma folha com 3000
  linhas, INSERT ~5,5% mais caro (4131 ms). A reescrita do `ADD COLUMN` não é UPDATE: os triggers da trilha imutável
  não disparam e nenhuma linha muda de conteúdo.
- **Folha no módulo `rh`** — `fechar_folha` e `reabrir_folha` gravavam `module_name = 'folha'`, que quem tem
  `rh.auditoria.visualizar` não lê. Desde a `20261011000300` gravam `'rh'` (corpo idêntico, mesmos privilégios; mesmo
  texto no overlay 18). As linhas antigas com `'folha'` **ficam como estão** (trilha imutável): só o papel admin as
  lê, e a aba da folha as acha só se a consulta aceitar os dois módulos.
- **Trilha dos arquivos do RH no Storage** — triggers `trilha_rh_storage_insert`, `trilha_rh_storage_update` e
  `trilha_rh_storage_delete` (`AFTER`, por linha, com `WHEN` nos buckets `frequencias` e `documentos-requerimento`:
  os outros buckets não pagam nada) em `storage.objects`, função `trilha_storage('rh')` (`SECURITY DEFINER`,
  `search_path` fixo, sem EXECUTE para a API). Cada gravação (`action = 'upload'`), troca ou movimentação
  (`'update'`, com `campos_alterados`) e exclusão (`'delete'`) vira uma linha em `audit_logs` com `module_name = 'rh'`,
  `entity_type = 'storage.<bucket>'`, `entity_id` = id do objeto e **`metadata.fonte = 'storage'`**. Quem agiu vem de
  `trilha_contexto()` (E1): o usuário do JWT que a Storage API repassa ao banco, servidor vinculado, origem (`sistema`
  para a service role), papel, unidade, IP e user agent. UPDATE só de carimbo (`updated_at`, `last_accessed_at`) não
  grava, nem o que só preenche `metadata` nula (conclusão do upload). Por ser `AFTER` e na mesma transação, gravação
  negada pela RLS ou desfeita não deixa linha. Quem lê: as mesmas policies da E1 (admin; módulo `rh` com
  `rh.auditoria.visualizar`).
- **Sem conteúdo e sem dado pessoal do caminho** — não há antes/depois. Em `metadata`: `chave`
  (`trilha_storage_chave(bucket, nome)`: bucket; o caminho **em claro só quando cada pasta é um uuid ou `AAAA-MM` e o
  arquivo é `<uuid>` com extensão de lista fechada** (`pdf`, `png`, `jpg`/`jpeg`, `webp`, `zip`, `doc`/`docx`,
  `odt`, `xls`/`xlsx`, `csv`, sem diferença de caixa), como `documentos-requerimento`
  (`<servidor_id>/<documento_id>.<ext>`); nos outros casos (inclusive `<uuid>.MariaSouza`) só `caminho_sha256`,
  porque o PDF de frequência leva matrícula e nome do servidor no nome do arquivo; `periodo` quando a primeira pasta
  é `AAAA-MM`; `extensao` só da lista), `objeto_id`, `tamanho` (do `metadata` da Storage API), `tipo_conteudo` (vem
  do Content-Type do cliente: só entra no formato `tipo/subtipo`, `^[a-z0-9.+-]{1,50}/[a-z0-9.+-]{1,50}$` depois de
  minúsculas, senão nada), `operacao_storage` (GUC `storage.operation`, quando a Storage API informa),
  `servidor_alvo_id` (o servidor dono do arquivo quando dá para saber sem ler o arquivo: linha de
  `frequencia_arquivos` com o mesmo caminho, ou a pasta `<servidor_id>/`; o PDF recém-enviado ainda não tem essa
  linha) e, ao mover, `anterior` (a chave antiga). `user_metadata` (texto livre do cliente) não entra. Para achar o
  arquivo de frequência de uma linha: `encode(sha256(convert_to(arquivo_path, 'UTF8')), 'hex')` em
  `frequencia_arquivos` = `metadata->'chave'->>'caminho_sha256'`.
- **O cliente não forja linha de arquivo** — `log_audit` recusa `entity_type` que comece por `storage.` (sem
  diferença de caixa ou espaços; `22023`), e `log_audit` e `registrar_evento` tiram `servidor_alvo_id` (além de
  `fonte` e das chaves de trigger, como na E1) dos metadados vindos do cliente; cada uma grava a própria `fonte`
  (`log_audit`, `registrar_evento`). Então `metadata.fonte = 'storage'` e `servidor_alvo_id` só existem nas linhas do
  trigger. Mesma assinatura e privilégios; `log_audit` com o mesmo texto no overlay 18.
- **Privilégio em `storage.objects` (limitação)** — a tabela é da plataforma (no Supabase, dono
  `supabase_storage_admin`). Criar trigger exige o privilégio `TRIGGER` nela; o `postgres` que aplica as migrações
  deve tê-lo, porque já cria as policies `st_*` (B3, overlay/50), o que exige ser dono da tabela ou membro do dono.
  Não foi conferido no banco da VPS (nada é aplicado em remoto por agente). Se o banco de destino negar, a
  migração **não falha**: emite `WARNING 'trilha do Storage do RH NÃO ligada ...'`, os índices entram e os arquivos
  ficam sem trilha no banco. Sobra só a trilha das tabelas `frequencia_arquivos` e
  `documentos_requerimento_servidor` (quem registrou ou alterou a linha que aponta para o arquivo); troca e exclusão
  feitas direto no bucket ficam sem registro. O job "Migrações do banco" (`.github/workflows/migracoes-banco.yml`)
  confere depois de aplicar e **fica vermelho** se não houver os 3 triggers `trilha_rh_storage_*` ligados; a mesma
  consulta à mão:
  `select tgname from pg_trigger where tgrelid = 'storage.objects'::regclass and tgname like 'trilha_rh_storage_%'`.
  Atualização da Storage API não apaga trigger de usuário, mas confira depois de trocar a versão do Storage. Validado
  no shim (dono `postgres`) e simulado com dono `supabase_storage_admin`: com `TRIGGER` (direto ou herdado) cria e
  reaplica; sem ele, só o `WARNING`.
- **Edge Function `download-frequencia`** — grava o download do pacote na trilha do RH antes de entregar a URL e
  não a entrega se a gravação falhar ([EDGE_FUNCTIONS.md](./EDGE_FUNCTIONS.md)).
- **No baseline** as funções e a coluna chegam por `schema/`, os triggers pelo `overlay/50_storage.sql`, o REVOKE
  pelo `overlay/40_privilegios.sql` e `log_audit`, `fechar_folha` e `reabrir_folha` pelo `overlay/18_funcoes_rpc.sql`
  (mesmo texto das migrações). O guard `scripts/check-autoria-rh.mjs` reprova o overlay sem os três triggers (ou com
  um deles desligado) e o schema sem `trilha_storage()`; o `validar-baseline.sh` compara também os triggers de
  `storage.objects` com o replay.
- **Fora**: o bucket `documentos` (workflow e RH) continua sem trilha; leitura (download por URL assinada) não passa
  pelo banco e é registrada pelo front com `registrar_evento`.

### Integridade da remessa CNAB e do eSocial — Onda E3 (banco)

Migração `supabase/migrations/20261011010000_rh_cnab_esocial_integridade.sql`, **em PR rascunho**; spec
[`2026-10-11-rh-vazamentos-arquivos-design.md`](./superpowers/specs/2026-10-11-rh-vazamentos-arquivos-design.md)
(itens 3 e 4). Idempotente, vale para o banco do baseline e para o só-migrações. Não mexe em RLS existente: o fim do
DELETE pela API nas duas tabelas e a leitura dos contracheques ficam na `20261011010100` (seção seguinte). O gerador
de CNAB, a tela e o eSocial do front são da mesma spec.

- **Folha fechada** — trigger `trg_exigir_folha_fechada` (função `exigir_folha_fechada`, `SECURITY DEFINER`) em
  `remessas_bancarias` (BEFORE INSERT) e `eventos_esocial` (BEFORE INSERT e UPDATE de `folha_id`): folha com status
  diferente de `fechada` recusa com **`RHE01`**, para todos (admin e service role inclusive). A folha é lida com
  `FOR SHARE`, e `reabrir_folha` a trava com `FOR UPDATE`: geração e reabertura simultâneas se esperam (a que vem
  depois vê o resultado da outra).
- **Número da remessa** — `trg_remessa_integridade` (função `remessa_integridade`) dá `numero_remessa` no INSERT:
  maior número da conta + 1, sob `pg_advisory_xact_lock` por conta (duas gerações simultâneas na mesma conta esperam
  uma pela outra). O valor mandado pelo cliente é **ignorado**; o front lê o número com `.select()` depois do INSERT.
  Não reinicia no ano e não reaproveita número de remessa cancelada. Índice único
  `remessas_bancarias_conta_numero_uidx (conta_autarquia_id, numero_remessa)`. `get_proximo_numero_remessa(p_conta_id,
  p_ano)` passa a ser só prévia com a mesma regra (`p_ano` ignorado; nenhuma tela a chama) e exige o módulo `rh`
  (`42501`; antes qualquer logado consultava; o EXECUTE não mudou).
- **Valor e quantidade** — `valor_total` e `quantidade_registros` são calculados no INSERT das fichas da folha (fechada,
  logo imutável): líquido > 0 com banco, agência e conta preenchidos, a mesma regra dos favorecidos do front
  (`fichaTemBanco`). O que o cliente manda é ignorado; o front deve ler os dois com `.select()` e conferir com o
  arquivo que gerou. O conteúdo do arquivo **não** é validado no servidor (risco aceito: quem processa a folha poderia
  subir um arquivo diferente do que os totais dizem; a trilha guarda quem enviou e o sha256).
- **Campos fixos** — `folha_id`, `conta_autarquia_id`, `numero_remessa`, `valor_total` e `quantidade_registros` não
  mudam depois do INSERT (**`RHE02`**).
- **Uma remessa ativa por folha e conta** — índice único parcial `remessas_bancarias_folha_conta_ativa_uidx
  (folha_id, conta_autarquia_id) WHERE status <> 'cancelada'`: a segunda dá `23505`; para gerar de novo, cancele a
  anterior.
- **Pensão alimentícia e número inicial** (migração `20261020090000_folha_remessa_pensao_nsa.sql`, em PR rascunho) —
  `remessas_bancarias.tipo_credito` (`servidores`, o padrão, ou `pensao`; CHECK; fixo depois do INSERT, `RHE02`). Na
  remessa de pensão, `valor_total` e `quantidade_registros` somam os descontos "Pensão alimentícia — <beneficiário>"
  das fichas da folha cuja pensão (`pensoes_alimenticias` do servidor da ficha, pelo nome do beneficiário) tem banco,
  agência e conta; o front monta os créditos pela mesma regra (`creditosPensao`, `src/lib/bancario/pensaoRemessa.ts`)
  com o banco do cadastro da pensão. O índice `remessas_bancarias_folha_conta_ativa_uidx` (mesmo nome e predicado)
  passa a ser por folha, conta e tipo. `contas_autarquia.nsa_inicial` (1 a 999999, opcional) continua a numeração do
  sistema anterior: o número é o maior entre o último da conta + 1 e o inicial; `get_proximo_numero_remessa` segue a
  mesma regra.
- **Parte patronal e INSS por faixa** (migração `20261021100000_folha_encargos_patronais.sql`, PR #144) —
  `processar_folha_pagamento` grava, em cada ficha de quem teve INSS descontado (quem contribui para o regime próprio
  na origem fica fora), `inss_patronal` e `rat` (base de INSS sem o teto × alíquota, arredondado) e `total_encargos`;
  na folha, `total_inss_patronal`, `total_rat` (coluna nova) e `total_encargos_patronais` são a soma das bases × a
  alíquota, truncada no centavo, como a guia do FIPLAN (conferido com as guias patronais de 09/2026). As alíquotas são
  dados em `parametros_folha`, em fração: `inss_patronal_aliquota` (0,20) e `rat_fap_aliquota` (RAT já ajustado pelo
  FAP); sem elas a parte sai zero e o processamento avisa. `inss_truncar_por_faixa` = 1 faz `calcular_inss_servidor`
  truncar cada faixa nos centavos, como o SIGRH (R$ 988,07 no teto, contra R$ 988,09 arredondando a soma). CHECK
  `parametros_folha_encargos_check` (NOT VALID): alíquota de 0 a 1 e opção 0 ou 1.
- **Retorno do banco** (migração `20261021090000_folha_retorno_remessa.sql`, PR #141) — RPC
  `registrar_retorno_remessa(p_remessa_id, p_retorno, p_itens)` (SECURITY DEFINER; módulo `rh` e
  `financeiro.folha.processar`, senão `42501`; só `authenticated`): grava em `retornos_bancarios` o arquivo (sha256,
  NSA, data, convênio, `previa`) e os totais agendados, pagos e recusados, e um item por crédito em
  `itens_retorno_bancario` (situação `agendado`, `pago` ou `rejeitado`, ocorrência, identificador e nome do favorecido;
  o servidor vem da ficha). Recusa (`22023`) remessa cancelada, retorno sem sha256 ou sem créditos, situação inválida e
  ficha de outra folha; o mesmo arquivo na mesma remessa dá `23505` (índice `retornos_bancarios_remessa_arquivo_key`).
  A remessa `gerada` passa a `enviada` (com `enviado_em`/`enviado_por`); retorno que não é prévia e não tem agendado a
  deixa `processada`. Quem lê o arquivo e casa cada crédito com a ficha é a tela (`src/lib/bancario/retornoFolha.ts`).
  Testes no bloco "FOLHA: retorno do banco da remessa" de `scripts/db/testar-rls.sql`.
- <a id="importar-a-folha-do-sigrh-importar_folha_sigrh"></a>**Importar a folha do SIGRH** (migração
  `20261022090000_folha_importar_sigrh.sql`) — RPC `importar_folha_sigrh(p_competencia, p_fichas, p_arquivo,
  p_simular DEFAULT true)` (SECURITY DEFINER; perfil ativo, módulo `rh`, `financeiro.folha.processar` e
  `usuario_pode_fechar_folha`, senão `42501`; só `authenticated`) para os meses pagos pelo SIGRH antes do sistema.
  Recebe as fichas lidas do espelho no navegador (CPF, função, banco, dependentes e as rubricas com tipo, quantidade,
  competência do retroativo e valor) e grava, tudo ou nada: a folha mensal da competência (observação e justificativa
  "Folha histórica importada do SIGRH (arquivo …)"), uma ficha por servidor casado pelo CPF (só dígitos; o cargo e a
  unidade do provimento vigente no mês, a função como paga no espelho, INSS e IRRF somados das rubricas, base de INSS
  igual aos proventos de quem descontou INSS, menos os de rubrica cadastrada que não incide INSS; `base_irrf` e a
  dedução de dependentes ficam vazias, porque o espelho não as traz), os itens (`origem` `automatico`, rubrica ligada pela descrição, a
  competência do retroativo na descrição), a parte patronal pela regra do processamento e o fechamento por
  `fechar_folha`. Recusa o mês corrente e o futuro (só mês encerrado) e lista vazia (`22023`) e a que já tem folha mensal (`23505`); servidor
  não cadastrado ou CPF em dois cadastros é erro da linha, e com erro nada é gravado; com `p_simular` tudo é desfeito
  no fim. O log em `importacoes` (`tipo` `folha_sigrh`, `exercicio` = ano) guarda competência, totais e a ficha de
  cada linha, sem CPF. Sem as alíquotas patronais no mês, avisa que a parte patronal sai zero. Ajustes da revisão na
  migração `20261022100000` (mês corrente, CPF do cadastro com mais de 11 dígitos não casa, base de INSS, aviso das
  alíquotas). Testes no bloco "FOLHA: importação da folha do SIGRH" de `scripts/db/testar-rls.sql`.
- **Arquivo guardado** — colunas `arquivo_path` (`<remessa_id>.rem` no bucket privado `remessas-cnab`) e
  `arquivo_sha256` (64 dígitos hex minúsculos). Gravadas juntas, de nulo para valor, **uma vez**, depois do INSERT, e só
  por quem: tem o módulo `rh` e `financeiro.folha.processar` (`42501`), **gerou a remessa** (`gerado_por`, fixado pela
  E1; senão `42501`) e **já enviou o objeto** ao bucket — `storage.objects` com `bucket_id = 'remessas-cnab'`, `name =
  arquivo_path` e dono (`owner_id`, ou `owner` nas versões antigas do Storage) igual ao usuário (senão **`P0002`**).
  Caminho ou hash fora do formato: `22023`. Depois não mudam nem somem (`RHE02`, também para o admin). A origem
  `sistema` (service role) dispensa a permissão, o autor e o objeto, não o formato. A checagem do objeto lê
  `storage.objects` como o dono da função: precisa de `BYPASSRLS` (o `postgres` do Supabase e o do shim têm; o CI
  confere). As colunas antigas `arquivo_url` e `hash_arquivo` ficam sem uso.
- **Bucket `remessas-cnab`** (privado, 10 MB, `text/plain` ou `application/octet-stream`): `st_remessas-cnab_select`
  exige o módulo `rh` **e** `financeiro.folha.processar`; `st_remessas-cnab_insert`, o mesmo e o nome `<uuid>.rem` de
  uma remessa que existe, **foi gerada pelo próprio usuário**, está `gerada` (não cancelada nem enviada), ainda não tem
  arquivo e foi gerada **há menos de 1 hora** (`data_geracao`, fixada pela E1). Não há policy de UPDATE nem de DELETE:
  o arquivo não é trocado nem apagado pela API, e baixar de novo serve o mesmo arquivo (URL assinada). `anon` não lê
  nem envia. Mesmo texto no `overlay/50_storage.sql`. Outra policy de `storage.objects` que valha para o bucket (cita o
  bucket, não filtra `bucket_id`, ou o filtra por exclusão: `bucket_id <> 'outro'`, `NOT IN` sem ele) **aborta a
  migração** (`42501`, com o nome da policy): como o CI aplica no merge, o deploy falha até a policy ser restrita.
- **Objeto órfão** — se o envio der certo e a gravação de `arquivo_path` falhar, o objeto fica no bucket sem remessa
  apontando para ele (o front cancela a remessa sem arquivo). A API não apaga; a limpeza é da service role (Studio ou
  `psql` na VPS), depois de conferir que a remessa está cancelada ou que o objeto é de remessa inexistente:
  `select o.name, o.created_at, r.status from storage.objects o left join public.remessas_bancarias r on r.id::text =
  left(o.name, 36) where o.bucket_id = 'remessas-cnab' and (r.id is null or r.arquivo_path is distinct from o.name)`.
  Apague pelo Storage (API com a service role ou o Studio), não por `DELETE` em `storage.objects`, para o arquivo sair
  também do disco.
- **Cancelamento** — colunas `cancelada_em`, `cancelada_por` (sem FK, como a autoria da E1) e `motivo_cancelamento`.
  RPC `cancelar_remessa(p_remessa_id uuid, p_motivo text)` (`SECURITY DEFINER`, `search_path` fixo, EXECUTE só para
  `authenticated`): exige o módulo `rh` e `financeiro.folha.processar` (`42501`), motivo de 5 a 1000 caracteres
  (`22023`), remessa existente (`P0002`) que não esteja cancelada nem `processada` (`RHE03`); grava status
  `cancelada`, `cancelada_em = now()`, `cancelada_por = auth.uid()` e o motivo, e devolve uma linha (`id`,
  `numero_remessa`, `status`, `cancelada_em`, `cancelada_por`, `motivo_cancelamento`). Status `cancelada` ou as
  colunas de cancelamento por UPDATE direto, ou INSERT já cancelado: **`RHE03`**. Remessa cancelada não muda mais
  (`RHE02`). A trilha da E1 (`audit_remessas_bancarias`) registra o cancelamento com o servidor responsável.
- **Reabrir a folha** — `reabrir_folha` (mesmo texto no `overlay/18_funcoes_rpc.sql`) recusa folha com remessa ativa
  (devolve `{success: false, error: "A folha tem remessa bancária ativa (nº …). Cancele a remessa antes de reabrir a
  folha."}`, o padrão de erro dela) e, ao reabrir, tira da vigência os eventos do eSocial rascunho da folha (status
  `erro`, `mensagem_retorno` "Folha reaberta: gere o evento de novo depois de fechar"), para não ficarem presos no
  índice. Evento transmitido (com recibo) fica: a retificação é da onda G.
- **eSocial** — índice único parcial `eventos_esocial_folha_evento_servidor_uidx` em
  `(folha_id, tipo_evento, coalesce(servidor_id, '00000000-…'))` onde `folha_id IS NOT NULL` e status fora de
  `erro`/`rejeitado`: gerar de novo o mesmo evento da mesma folha para o mesmo servidor dá `23505` (o S-1299 conta uma
  vez por folha); evento com `erro` de validação pode ser gerado de novo. CHECK
  `eventos_esocial_periodico_com_folha_check`: S-1200, S-1210 e S-1299 exigem `folha_id`, e S-1200/S-1210 exigem
  `servidor_id` (`23514`; status `erro`/`rejeitado` ficam fora). CHECK `eventos_esocial_transmitido_com_recibo_check`:
  status `enviado` ou `aceito` exige `recibo` (`23514`). Coluna gerada `rascunho` (`recibo IS NULL`): todo evento é
  rascunho não transmitido até existir a transmissão (onda G).
- **Banco já em uso** — os três índices únicos **existem sempre** depois da migração; nada é apagado nem renumerado:
  - eventos rascunho antigos que furam a regra nova viram status `erro` com o motivo em `mensagem_retorno`: S-1200/S-1210
    sem `servidor_id` (o diálogo antigo não gravava o servidor, então todos da folha caíam na mesma chave) e periódicos
    sem `folha_id` ("Sem servidor ou folha antes da E3"); dos repetidos na chave do índice (o S-1299 duplicava a cada
    clique) fica o mais recente e os outros viram `erro` ("Duplicado antes da E3"). O `servidor_id` não é preenchido
    pelo CPF do payload: o formato antigo não é fixo e um CPF errado ligaria o evento a outra pessoa. Sobrando repetição
    só entre transmitidos (não há transmissão antes da onda G), os mais antigos ficam fora do índice pelo id
    (`WARNING` pedindo migração de correção);
  - remessas com número repetido na conta ou mais de uma ativa da mesma folha e conta: o número já foi ao banco e a
    remessa pode ter sido paga, então nada é renumerado nem cancelado; as antigas repetidas, menos a mais recente de cada
    grupo, ficam fora do índice pelo id (predicado `id <> ALL ('{…}')`, lista no `WARNING`). Seguro porque número novo é
    sempre maior que o maior da conta e remessa nova da folha só entra depois de cancelar a ativa que ficou no índice.
  - os CHECKs entram `NOT VALID` e são validados quando nenhuma linha viola (com a limpeza acima, só uma linha
    transmitida impediria; aí ficam `NOT VALID`, valendo para linha nova e alterada, e a migração avisa).
  O CI confere os três índices e o `BYPASSRLS` do dono de `remessa_integridade()` depois de aplicar
  (`.github/workflows/migracoes-banco.yml`, passo "Conferir integridade da remessa e do eSocial").
- **Códigos de erro**: `RHE01` folha não fechada; `RHE02` campo fixo da remessa ou remessa cancelada alterados;
  `RHE03` cancelamento fora da RPC ou remessa que não se cancela; `42501` sem permissão (inclusive arquivo de remessa
  gerada por outro e prévia do número sem o módulo); `22023` valor inválido; `P0002` objeto do arquivo ausente no
  bucket (ou de outro dono) e remessa inexistente; `23505` evento ou número repetido, ou segunda remessa ativa da folha
  e conta; `23514` transmitido sem recibo, ou evento periódico sem folha/servidor.
- **No baseline** colunas, funções, triggers, índices e CHECKs chegam por `schema/`; o bucket e as policies pelo
  `overlay/50_storage.sql`; `reabrir_folha` pelo `overlay/18_funcoes_rpc.sql`; os REVOKE/GRANT pelo
  `overlay/40_privilegios.sql`. Testes no bloco "RH: integridade de CNAB e eSocial (Onda E3)" de
  `scripts/db/testar-rls.sql`.
- **Fora**: retorno CNAB e conciliação (onda H); transmissão, lote e retificação do eSocial (onda G); validação do
  conteúdo do arquivo CNAB no servidor; evento do eSocial não periódico sem `folha_id` não passa pela regra da folha
  fechada.

### Leitura dos contracheques e da remuneração; fim do DELETE — Onda E3 (banco, RLS)

Migração `supabase/migrations/20261011010100_rh_contracheques_leitura.sql`, **em PR rascunho**; mesma spec (item 1,
premissas 1 e 2; "sem DELETE pela API" dos itens 3 e 4). Separada da `20261011010000` porque **muda RLS existente**
(decisão 3 da revisão do RH): pode ser segurada sem segurar a outra; sem ela, todo o módulo `rh` continua lendo
contracheques, lançamentos, consignações, pensões e eventos do eSocial de todos e apagando remessas e eventos.
Idempotente.

- **Permissão nova** `rh.contracheques.visualizar` (módulo `rh`, `action_type = 'consultar'`), papéis `admin` e
  `manager`. `financeiro.folha.visualizar` não serve: o papel `user` a recebe (carga por `action_type = 'visualizar'`).
- **Leitura da remuneração e do dado bancário por pessoa**: o SELECT pelo módulo `rh` passa a exigir também
  `rh.contracheques.visualizar` **ou** `financeiro.folha.processar` em `fichas_financeiras`, `itens_ficha_financeira`
  (o servidor continua lendo os próprios, posse por `meu_servidor_id()`), `lancamentos_folha`, `consignacoes`,
  `eventos_esocial` (payload com CPF e remuneração), `pensoes_alimenticias` (CPF e conta do beneficiário) e
  `itens_retorno_bancario` (valor pago por servidor). `folhas_pagamento` não muda (só totais).
- **Escrita com `financeiro.folha.processar`**: já era assim em fichas, itens, lançamentos e consignações (B1);
  passa a ser em `eventos_esocial`, `pensoes_alimenticias`, `itens_retorno_bancario` e no INSERT/UPDATE de
  `remessas_bancarias` (antes bastava o módulo). A leitura das remessas continua pelo módulo: a linha só tem os
  totais da folha, e o arquivo (com a conta de cada servidor) está no bucket `remessas-cnab`, que já exige
  `processar`.
- **`remessas_bancarias` e `eventos_esocial`**: sem policy de DELETE e sem o privilégio `DELETE` para `anon` e
  `authenticated` (a API recebe `42501`, não "0 linhas"). Remessa se cancela pela RPC `cancelar_remessa`; a service
  role continua podendo apagar.
- **`fn_validar_margem_consignavel(p_servidor_id)`** (líquido do servidor e soma das consignações): era
  `SECURITY DEFINER` sem checagem no banco só de migrações (qualquer logado consultava qualquer servidor). Passa a
  `SECURITY INVOKER` (como o overlay 18 já fazia no baseline) com checagem explícita: módulo `rh` com
  `rh.contracheques.visualizar` ou `financeiro.folha.processar`, ou o próprio servidor; fora disso, `42501`. Limite: o
  próprio servidor não lê as próprias consignações pela RLS, então para ele `margem_utilizada` sai 0 (nenhuma tela do
  servidor usa a função). O EXECUTE não mudou.
- **Ficaram de fora**, com o motivo:
  - `retornos_bancarios` e `exportacoes_folha`: totais por arquivo, sem pessoa na linha. Atenção: `detalhes`
    (jsonb) do retorno e o arquivo de `exportacoes_folha.arquivo_url` não têm formato fixado; o retorno fica para a
    onda H.
  - `dependentes_irrf`: CPF e nascimento de dependentes, sem valor; é dado pessoal sensível, não remuneração. A
    escrita já exige `processar` (B1) e a leitura continua com o módulo, à espera de decisão do RH.
  - `adicionais_tempo_servico` (`valor_adicional`): registro funcional que o RH mantém sem a permissão da folha;
    restringir quebraria o cadastro.
  - `servidores` (`remuneracao_bruta`, `descontos`, `banco_*`), `vinculos_servidor` (`remuneracao_bruta`) e
    `pre_cadastros` (`banco_*`): a RLS restringe linhas, não colunas, e essas tabelas são o cadastro que todo o RH
    lê. **Risco registrado**: quem tem o módulo `rh` lê a remuneração e a conta de todos por aí. Privilégio por coluna
    quebraria os `select('*')` do front; fechar exige view própria ou mover as colunas (decisão futura).
  - `cadastro_arbitros` (banco e conta) e `viagens_diarias` (diárias): fora do RH ou indenização, não remuneração.
- Tabela por tabela e impacto no front em
  [RBAC_PERMISSOES.md](./RBAC_PERMISSOES.md#contracheques-remessas-e-eventos-do-esocial-rls-onda-e3-banco). No
  baseline: `mapa.csv` (sufixos `;leitura=` e `excluir=ninguem`) → `35_policies_geradas.sql`, o REVOKE no
  `overlay/40_privilegios.sql` e as linhas do catálogo em `schema/02_dados_catalogo.sql`. Testes no bloco "RH: leitura
  dos contracheques e fim do DELETE (Onda E3, 0100)" de `scripts/db/testar-rls.sql`, mais as checagens genéricas de
  `leitura=` e `excluir=ninguem`.

### Lançamento por setor (fase 1, banco)

Migração `supabase/migrations/20261011020000_lancamento_por_setor.sql`, **em PR rascunho**; spec
[`2026-10-11-lancamento-por-setor-design.md`](./superpowers/specs/2026-10-11-lancamento-por-setor-design.md)
(premissas 1 a 8, seção "Fase 1"). Idempotente (roda de novo sobre o replay, o baseline novo e o anterior). Nesta fase a
regra só roda nas 79 tabelas do RH (as do `mapa.csv` com `rh`, menos as 2 de classe `trilha`) e o RH nasce em modo <!-- numero-datado -->
`registrar`: **nada é bloqueado**, a trilha anota quem seria.

- **Tabelas novas** (RLS e policies na mesma migração, autoria `zz_fixar_autoria` e trilha `audit_<tabela>`):
  - `setores_modulo` (módulo `app_module`, `unidade_id` → `estrutura_organizacional`, `inclui_subordinadas` com
    **padrão `false`**, `ativo`, `observacao`; único por módulo e unidade) e `regra_lancamento` (`id` PK, `modulo`
    único, `modo` `desligado`/`registrar`/`exigir`, `observacao`): classe `catalogo_admin`. Todo usuário ativo lê, só o
    **papel** admin grava, mesmo sem servidor (premissa 1). Trilha no módulo `admin`, fora da regra.
    `regra_lancamento` não tem policy de DELETE (`excluir=ninguem` no mapa: nem o admin apaga a linha de um módulo) e
    o trigger `trg_regra_lancamento_exigir` recusa (`42501`) INSERT ou UPDATE que leve um módulo a `exigir` quando há
    usuário na sessão: o modo `exigir` só entra por migração, módulo a módulo. Sair de `exigir` continua com o admin
    (saída de emergência).
  - `comissoes` (nome; tipo `inventario`/`licitacao`/`fiscalizacao_contrato`/`outra`; módulo; objeto
    `objeto_tipo` `campanha_inventario`/`contrato`/`processo_licitatorio` + `objeto_id`, os dois ou nenhum, e
    **obrigatórios quando o tipo não é `outra`**; ato obrigatório `ato_tipo`, `ato_numero`, `ato_data`, mais
    `ato_doe_numero`/`ato_doe_data` opcionais; `data_inicio` obrigatória, `data_fim`; `motivo` obrigatório; `status`
    `ativa`/`encerrada`) e `comissoes_membros` (`comissao_id` com `ON DELETE CASCADE`, `servidor_id`, `papel`
    `presidente`/`membro`/`secretario`, período próprio opcional): classe `permissao`, o módulo `rh` lê e escreve com
    `rh.comissoes.gerenciar` (permissão nova, **só o papel `admin`** até o órgão decidir quem cadastra). Retirar
    membro é `DELETE`. O trigger `trg_comissoes_membros_validar` recusa (`42501`) incluir quem cadastrou a comissão e
    incluir o próprio servidor do login (exceto o papel admin).
- **Carga:** `regra_lancamento` com uma linha por valor de `app_module`: `rh` = `registrar`, os demais `desligado`.
  Linha existente não muda (`ON CONFLICT DO NOTHING`), então rodar a migração de novo não desfaz a escolha do admin.
  `setores_modulo` nasce vazio: a lista de setores vem do órgão.
- **Data de hoje** (`data_local()`): a regra não usa `CURRENT_DATE` (no Supabase o fuso da sessão é UTC: à noite já
  seria "amanhã"). `data_local()` usa a variável `app.fuso_horario` do banco, definida por instância
  (`ALTER DATABASE <banco> SET app.fuso_horario = '<zona IANA do órgão>'`, junto com o resto do provisionamento); sem
  ela, ou com nome inválido, `America/Sao_Paulo`. É `now()` no fuso, estável na transação.
- **Fundamento** (`fundamento_lancamento(text[])`, interna): para o login atual (`profiles.servidor_id`, premissa 7)
  e os módulos da tabela, na data de hoje, na ordem:
  1. `lotacao`: `lotacao_vigente(servidor, data)` (lotação ativa e vigente fora de `lotacao_externa`, ou cessão de
     entrada ativa com `unidade_idjuv_id`, premissa 4) numa unidade de `setores_modulo` ativo, ou abaixo dela quando
     `inclui_subordinadas` (subida por `superior_id` com limite de 50 níveis: um ciclo na estrutura não trava a
     gravação). **Não vale** a lotação ou cessão lançada pelo próprio servidor (`created_by_servidor_id` = ele, da
     autoria E1; nulo = legado, vale);
  2. `designacao`: `status = 'aprovada'`, `ativo`, vigente, com ato (`ato_numero` não vazio e `ato_data`), com
     `aprovado_por` preenchido, e o aprovador **não** é o próprio designado nem quem lançou a designação, para uma
     unidade do setor (premissa 5: soma à lotação);
  3. senão `negado_setor`; login sem servidor: `negado_sem_servidor`. Sem `auth.uid()`: papel `anon` é `anonimo`
     (formulário público), papel `authenticated` é `negado_sem_login`, qualquer outro (service role, jobs) é `sistema`.
  **Comissão não é fundamento na fase 1:** pela premissa 6 ela vale só no seu objeto (campanha, contrato, processo), o
  que exige checagem por linha nas tabelas desses módulos (fase 2); nenhuma tabela do RH é objeto de comissão. O
  cadastro já fica pronto.
  O papel admin não tem atalho. Tabela com mais de um módulo usa o modo mais restritivo entre eles e aceita o setor
  de qualquer um (`lancamento_modulos_tabela`: folha com `rh` e `financeiro`, premissa 3; `documentos` com `rh`,
  `workflow`, `gabinete`, `governanca` e `admin`; etc.). Cache por transação em variável local, com chave usuário +
  papel da sessão + geração; o trigger `lancamento_cache_invalidar` (lotações, designações, cessões, comissões,
  membros, setores, regra, estrutura e vínculo do perfil) sobe a geração e zera o contexto da trilha.
- **Autoatendimento e chefia** (`fundamento_linha`, só quando o fundamento de setor é negado, e só em
  `solicitacoes_abono`, `solicitacoes_ajuste_ponto`, `justificativas_ponto`, `frequencia_fechamento` e
  `documentos_requerimento_servidor`; exige servidor vinculado):
  - `autoatendimento`: INSERT do **pedido ainda sem decisão** do próprio servidor (abono e requerimento por
    `servidor_id`; ajuste de ponto por `servidor_id = auth.uid()`; justificativa pelo dono do registro de ponto), com
    `status = 'pendente'` e as colunas de decisão nulas (abono: `aprovado_chefia_*`, `aprovado_rh_*`,
    `motivo_rejeicao`; ajuste e justificativa: `aprovador_id`, `data_aprovacao`, `observacao_aprovador`; requerimento:
    `arquivo_assinado_url`, `data_upload_assinado`); e o UPDATE do próprio fechamento que só muda
    `assinado_servidor`/`assinado_servidor_em`. O pedido que já entra decidido não é autoatendimento;
  - `chefia`: quem tem `rh.aprovar` e **não** tem `rh.frequencia.lancar`, no UPDATE das quatro tabelas de etapa (a
    etapa já é limitada por `validar_etapa_frequencia`); em `frequencia_fechamento` só se mudar apenas
    `validado_chefia*` e `observacoes`, e no INSERT já com `validado_chefia = true`. O admin tem todos os códigos e
    nunca cai aqui. Férias e licenças não têm etapa de chefia no banco, então não há via chefia nelas. A hierarquia
    (se o aprovador chefia mesmo a unidade do servidor) não é conferida, como já não era.
- **Triggers** nas 79 tabelas (o guard `check-autoria-rh.mjs` cobra os dois): <!-- numero-datado -->
  - `zz_exigir_setor` (`BEFORE INSERT OR UPDATE OR DELETE`, por linha): recusa só em modo `exigir`, sem fundamento de
    setor e sem fundamento da linha, com SQLSTATE **`RHS01`**. Mensagens (com o nome do módulo de
    `module_settings.display_name`, ou o código): "Seu login não tem servidor vinculado: lançamento no setor de
    <módulos> recusado", "Sessão sem usuário identificado: lançamento no setor de <módulos> recusado" ou "Você não
    está lotado nem designado no setor de <módulos>: lançamento recusado". `DETAIL` = `via=<via>; tabela=<tabela>`, e
    há `HINT`. Roda antes de `zz_fixar_autoria`, que perdeu a checagem de vínculo da E1;
    `rh_exige_servidor_vinculado()` passa a responder "o RH está em `exigir`?".
  - `zz_exigir_setor_fim` (`AFTER`, por comando): apaga a marca de cascata. **Cascata:** a gravação de nível 1
    aceita deixa a marca `lancamento.cadeia` na transação até o fim do comando; gravação feita por outro trigger
    (`pg_trigger_depth() > 1`) com a marca descende de uma gravação já checada e não é checada de novo. Sem a marca
    (cascata que começa numa tabela fora da regra, ex.: apagar uma unidade em `estrutura_organizacional` leva as
    lotações; ou trigger BEFORE que grava antes da checagem da própria linha) é checada como qualquer gravação.
- **Trilha:** `audit_logs.fundamento jsonb` (gravado por `fn_audit_trigger` e `registrar_evento`; nulo com a regra
  desligada ou tabela fora dela) com `permitido`, `via`, `modo`, `modulos`, `modulo`, `servidor_id`, `data`,
  `unidade_id`, `setor_unidade_id` e o registro usado (`lotacao_id` ou `cessao_id`, ou `designacao_id`), e `ato` =
  `{tipo, numero, data, doe_numero, doe_data}` (chaves nulas omitidas). A gravação feita por trigger AFTER dentro de
  uma gravação checada leva `em_cascata: true` (o relatório de bloqueios deve ignorá-la). Limite: na cascata de FK
  (`ON DELETE CASCADE`) o Postgres enfileira a trilha da linha filha para depois do comando; ela sai sem
  `em_cascata` e com o fundamento calculado para a tabela filha (mesmo login). Índice parcial
  `idx_audit_logs_fundamento_negado` para "quem seria bloqueado" (criado sem `CONCURRENTLY`: nasce vazio).
- **Mudança de significado de `audit_logs.org_unit_id`:** passa a ser a unidade **onde a pessoa trabalha**, não a
  unidade de acesso. Nas linhas da regra, a unidade do fundamento usado (designação: a de destino); nas demais (e em
  `log_audit`, `trilha_completar_contexto` e `registrar_evento`), a da lotação vigente do servidor do login. Antes era
  a unidade principal de `user_org_units` (escopo de acesso). Sem servidor ou sem lotação: nula. Linhas antigas não
  mudam; relatório que filtre a trilha por unidade deve considerar a data da mudança.
- **RPCs para o front** (só `authenticated`; as demais funções novas sem EXECUTE pela API):
  - `meus_fundamentos_lancamento(p_modulos app_module[] DEFAULT NULL)` → **linhas**, uma por módulo do enum (ou só os
    pedidos, na ordem do enum; a chamada sem argumento continua valendo): `modulo`, `modo`, `permitido`, `bloqueado`
    (`modo = 'exigir'` e sem fundamento de setor), `via`, `unidade_id`, `unidade_nome`, `lotacao_id`, `cessao_id`,
    `designacao_id`, `comissao_id` (sempre nulo na fase 1), `ato` (jsonb como acima). Exige usuário ativo (`42501`).
    Autoatendimento e chefia não aparecem aqui e valem mesmo com `bloqueado`.
  - `saneamento_lancamento()` → servidores ativos (`ativo` e situação fora de exonerado, aposentado, falecido e
    inativo) com problema: `servidor_id`, `nome`, `matricula`, `situacao`, `tem_login`, `login_ativo`,
    `lotacao_unidade_id`, `lotacao_unidade_nome`, `unidade_atual_id`, `unidade_atual_nome`, `problemas` (`text[]` com
    `sem_login`, `sem_lotacao`, `lotacao_divergente`, `fundamento_autoconcedido`: lotação ou cessão vigente lançada
    pelo próprio servidor, ou designação aprovada e vigente aprovada por ele ou por quem a lançou). Sem CPF. Papel
    admin, ou módulo `rh` com `rh.auditoria.visualizar`; senão `42501`.
- **Desempenho** (`processar_folha_pagamento`, 2000 servidores, banco local, 3 a 4 rodadas;
  `scripts/db/medir-desempenho-folha.sql`): antes 0,89 a 0,96 s / reprocessar 1,26 a 1,42 s; depois, em `registrar`
  e admin sem servidor, 1,00 a 1,22 s / 1,56 a 1,69 s; em `exigir` com o usuário lotado no setor, 1,10 a 1,26 s / 1,75
  a 1,81 s (6004 linhas na trilha nos três). O custo vem da trilha com fundamento e dos dois triggers por comando.
- **Fora da fase 1:** os outros módulos (autoria, trilha e o trigger), comissão por objeto, modo `exigir` em
  qualquer módulo (migração própria, depois de um ciclo em `registrar`), arquivos do Storage (a regra não roda em
  `storage.objects`: risco aceito, ver a spec) e a Edge Function `enviar-convite-reuniao`.
- No baseline: `mapa.csv` → `35_policies_geradas.sql` (o gerador aceita `excluir=ninguem` em `catalogo_admin`);
  `regra_lancamento` nas sementes do `gerar-baseline.sh`; REVOKE e GRANT no `overlay/40_privilegios.sql`; `log_audit`
  no `overlay/18_funcoes_rpc.sql` (mesmo texto da migração). Testes no bloco "Lançamento por setor (fase 1)" de
  `scripts/db/testar-rls.sql`. Telas e rotas: [RBAC_PERMISSOES.md](./RBAC_PERMISSOES.md#lançamento-por-setor-fase-1).

### Financeiro / orçamento
Núcleo (prefixo `fin_`): `fin_solicitacoes`, `fin_solicitacao_itens`,
`fin_empenhos`, `fin_sub_empenhos`, `fin_empenho_anulacoes`, `fin_liquidacoes`,
`fin_pagamentos`, `fin_adiantamentos`, `fin_adiantamento_itens`,
`fin_restos_pagar`, `fin_dotacoes`, `fin_acoes_orcamentarias`,
`fin_alteracoes_orcamentarias`, `fin_programas_orcamentarios`,
`fin_naturezas_despesa`, `fin_fontes_recurso`, `fin_plano_contas`,
`fin_lancamentos_contabeis`, `fin_receitas`, `fin_contas_bancarias`,
`fin_extratos_bancarios`, `fin_extrato_transacoes`, `fin_fechamentos`,
`fin_checklist_ci`, `fin_documentos`, `fin_parametros`, `fin_audit_log`.
`fin_dotacoes.codigo_dotacao` das linhas importadas do QDD do FIPLAN segue
`função.subfunção.programa.PAOE.regional.natureza.fonte.cod_acomp.IDU` (ex.:
`27.812.030.2544.9900.33903900.1.500.0000.Não`), único por exercício.
Legado/compartilhado: `dotacoes_orcamentarias`, `empenhos`, `liquidacoes`,
`pagamentos`, `creditos_adicionais`, `centros_custo`, `contas_autarquia`,
`config_autarquia`.

#### FIPLAN, arquivos bancários e extrato do BB (banco)

Migrações `20261011100000` a `20261011100400` (**em PR rascunho**), spec
[`2026-10-11-financeiro-fiplan-banco-design.md`](./superpowers/specs/2026-10-11-financeiro-fiplan-banco-design.md).
Todas idempotentes.

- **Alteração orçamentária confirmada no FIPLAN** (`20261011100000`): `fin_alteracoes_orcamentarias` ganha
  `processo_sei`, `situacao_fiplan` (`pendente`|`confirmada`, padrão `pendente`), `confirmado_fiplan_em` e
  `confirmado_fiplan_por`. `confirmar_alteracao_fiplan(p_id uuid) → jsonb` (`id`, `situacao_fiplan`,
  `confirmado_fiplan_em`, `confirmado_fiplan_por`, `ja_confirmada`) exige o módulo financeiro e `orcamento.aprovar`
  (o catálogo não tem permissão própria de alteração) e recusa alteração `cancelado`/`rejeitado`. O trigger
  `trg_fin_alteracoes_proteger_situacao_fiplan` impede `anon`/`authenticated` de mudar a situação direto (`42501`),
  força `pendente` no INSERT e, depois de confirmada, recusa (`42501`) UPDATE de `valor`, `dotacao_origem_id`,
  `dotacao_destino_id`, `tipo`, `exercicio` e `status` (processo SEI e observações seguem editáveis). A policy de
  DELETE da tabela (classe `modulo`) não mudou, mas desde a `20261011100400` o trigger
  `trg_fin_alteracoes_bloquear_exclusao_confirmada` recusa (`42501`) a exclusão de alteração confirmada pela API
  (admin inclusive); a pendente continua podendo ser apagada pelo módulo.
- **Movimentos bancários** (`20261011100100`): `fin_movimentos_bancarios`, um registro por pagamento visto num
  arquivo do banco (OBN600 do FIPLAN, CNAB240 da SEGAD/Gestão MAX), com `chave_unica` =
  `origem|identificador|valor|data_pagamento|tipo_lancamento`, `importacao_id` (quem criou),
  `importacao_retorno_id` (último retorno), `data_efetivacao` (data real do débito, do retorno), `pagamento_id`,
  `conciliado_em`/`conciliado_por` e `conciliacao_justificativa`.
  `importar_arquivo_bancario(p_linhas jsonb, p_arquivo jsonb, p_parametros jsonb, p_simular boolean DEFAULT true) →
  jsonb` segue o `ResultadoBanco` dos importadores (`src/lib/importacao/types.ts`; `criados` lista os pagamentos
  vinculados e os marcados como pagos) e registra em `importacoes` (`tipo = 'arquivo_bancario'`). Aceita de 0 a 20000
  linhas (retorno vazio grava o log com totais zerados); remessa só tem situação `enviado` (`pago`/`recusado` só no
  retorno, senão `22023`); cada linha pode trazer `data_efetivacao` (`YYYY-MM-DD`, fora da chave). Reimportar o mesmo
  arquivo dá `sem_alteracao`; o retorno atualiza situação, código, motivo, autenticação e data de efetivação do
  registro com a mesma chave (nunca rebaixa `pago` para `enviado`). Casamento com `fin_pagamentos`
  (`fin_casar_movimento_pagamento`, versão final na `20261011100200`), só com candidato único: (1) retorno de reenvio
  — crédito de remessa de reenvio confirmada cujo seu número é o identificador (mesmo valor e CPF/CNPJ), ou movimento
  reenviado com o mesmo identificador e valor, já vinculado: usa o pagamento do movimento original (vale para reenvio
  pago em outro ano); (2) `identificador_transacao`; (3) `valor_liquido` + CPF/CNPJ do fornecedor
  (`fornecedores.cpf_cnpj`) + `data_pagamento` a no máximo **5 dias** da data do movimento (sem data, não casa por esse
  caminho). Movimento `pago` vinculado marca o pagamento `pago` com `data_efetivacao` = a da linha (ou
  `data_pagamento`); não mexe em pago, estornado, cancelado ou devolvido. O UPDATE de status não dispara a
  atualização de empenho/dotação (o trigger só age no INSERT): o valor pago vem do QDD do FIPLAN.
  `conciliar_movimento_bancario(p_movimento_id uuid, p_pagamento_id uuid, p_justificativa text DEFAULT NULL) → jsonb`
  (`movimento_id`, `pagamento_id`, `pagamento_numero`, `pagamento_marcado_pago`, `valor_confere`) vincula à mão:
  recusa movimento já vinculado a **outro** pagamento (desvincule antes com `NULL`; o mesmo pagamento é idempotente),
  recusa pagamento que já tem outro movimento `pago` vinculado e, se o valor não confere com o líquido, exige
  `p_justificativa` (gravada em `conciliacao_justificativa`). `p_pagamento_id NULL` desvincula (devolve
  `desvinculado_de` e `status_revertido: false`): **não** reverte o status do pagamento, que continua pago se o
  movimento o marcou (o estorno é no próprio pagamento). `pode_conciliar_pagamentos() → boolean` serve à tela e à
  Edge Function `bb-api`. Permissão nova **`pagamento.conciliar`** (catálogo do financeiro; papéis `admin` e
  `manager`).
- **Reenvio Gestão MAX** (`20261011100200`): `fin_remessas_bancarias` (`UNIQUE (conta_autarquia_id, layout, nsa)`;
  cópia de `convenio`, `agencia`, `agencia_digito`, `conta`, `conta_digito` da conta pagadora; `data_pagamento`;
  `tipo_servico` `98`|`30`; `quantidade` 1–999 e `valor_total` calculados; `creditos jsonb` com o retrato do arquivo;
  `arquivo_sha256` nulo = reserva não confirmada). Em `fin_movimentos_bancarios`: `remessa_id` (preenchido já na
  reserva), `reenviado_em` (na confirmação), `conta_corrigida jsonb` (`{banco, agencia, agencia_dv, conta, conta_dv,
  validado_bb, justificativa}`), `corrigido_por`, `corrigido_em`.
  - `corrigir_conta_movimento(p_movimento_id uuid, p_banco text, p_agencia text, p_agencia_dv text, p_conta text,
    p_conta_dv text, p_justificativa text, p_validado_bb boolean DEFAULT false) → jsonb` (`movimento_id`,
    `conta_corrigida`, `corrigido_por`, `corrigido_em`): só movimento `recusado`, que não seja fatura, não reenviado e
    sem reserva; banco 3 dígitos, agência até 5, conta até 12, dígitos de 1 posição (`0-9`/`X`); justificativa
    obrigatória (até 500); para banco `001`, `p_validado_bb = true` ou justificativa com 15+ caracteres.
    `validado_bb` é declarado pela tela (a consulta em si fica na trilha `audit_logs` gravada pela `bb-api`).
  - `registrar_remessa_bancaria(p_conta_autarquia_id uuid, p_layout text, p_movimentos uuid[], p_data_pagamento date,
    p_nsa_minimo integer DEFAULT NULL, p_tipo_servico text DEFAULT '98') → jsonb` (`id`, `nsa`, `convenio`,
    `agencia`, `agencia_digito`, `conta`, `conta_digito`, `data_geracao`, `data_pagamento`, `tipo_servico`,
    `creditos`): o **servidor** monta os créditos (cada um: `movimento_id`, `pagamento_id`, `nome`, `documento`,
    `banco`, `agencia`, `agencia_dv`, `conta`, `conta_dv`, `valor`, `seu_numero`) a partir dos movimentos, usando
    `conta_corrigida` quando houver (senão separa `"1234-5"`/`"1111-X"` do movimento), e calcula quantidade e valor.
    Recusa (`22023`) lista vazia, com repetição ou acima de 999, data fora de [ontem, hoje + 60], movimento não
    recusado, fatura/guia, sem banco/agência/conta válidos, sem CPF/CNPJ, já reenviado ou reservado por outra remessa
    não confirmada. `seu_numero` = identificador original se numérico com até 20 dígitos, senão `nsa * 1000 + seq`.
    Trava por conta/layout (advisory lock) e os movimentos (`FOR UPDATE`). NSA: na primeira remessa da conta/layout,
    `p_nsa_minimo` (ou 1); depois `max(nsa) + 1` e `p_nsa_minimo` é **ignorado**. Se a última remessa da conta é uma
    reserva não confirmada do mesmo usuário, ela é reaproveitada (mesmo NSA e id; créditos refeitos; movimentos fora
    da nova lista liberados).
  - `confirmar_remessa_bancaria(p_id uuid, p_sha256 text) → jsonb` (`id`, `nsa`, `arquivo_sha256`,
    `movimentos_marcados`, `ja_confirmada`): só o autor da reserva; trava os movimentos e falha (`22023`) se algum não
    estiver mais reservado para a remessa (ou deixou de estar recusado); grava o hash e `reenviado_em`. Idempotente
    com o mesmo hash; outro hash é recusado.
  - `obter_remessa_bancaria(p_id uuid) → jsonb`: o mesmo formato de `registrar_remessa_bancaria` + `arquivo_sha256`,
    para baixar o arquivo de novo (qualquer usuário com `pagamento.conciliar`).
  - `cancelar_remessa_bancaria(p_id uuid) → jsonb` (`id`, `nsa`, `movimentos_liberados`): só reserva não confirmada,
    pelo autor ou por um administrador; **apaga** a linha (a trilha `fin_audit_log` guarda) e limpa `remessa_id` dos
    movimentos. Se era a última remessa da conta, o NSA volta a ficar livre; senão, o número fica pulado.
- **Remessa OBN600 dos pagamentos** (`20261024090000_fin_remessa_obn600.sql`, spec
  [`2026-10-21-financeiro-remessa-obn600-design.md`](./superpowers/specs/2026-10-21-financeiro-remessa-obn600-design.md)):
  o sistema gera o arquivo de ordens bancárias (crédito em conta) que hoje sai do sistema estadual. Colunas novas:
  `contas_autarquia.obn_codigo_cliente` (até 9 dígitos, header 059-067), `obn_unidade_gestora` (até 6) e `obn_gestao`
  (até 5), com CHECK de dígitos (vazias = a conta não gera OBN600); `fin_remessas_bancarias.layout` aceita `obn600`, com
  `pagamentos uuid[]` (ordem das OBs) e `parametros jsonb` (`{unidade_gestora, gestao}`); `convenio` guarda o código do
  cliente e `nsa` o nº da remessa (até 99999); `fin_pagamentos.remessa_bancaria_id` (FK `ON DELETE SET NULL`) aponta a
  reserva ou a remessa em que o pagamento saiu.
  - `registrar_remessa_obn600(p_conta_autarquia_id uuid, p_pagamentos uuid[], p_data_pagamento date,
    p_sequencial_minimo integer DEFAULT NULL) → jsonb` (formato de `fin_remessa_bancaria_json`, sem o hash): o
    **servidor** monta as OBs (`pagamento_id`, `pagamento_numero`, `relacao`, `numero_ob`, `nome`, `documento`,
    `banco`, `agencia`, `agencia_dv`, `conta`, `conta_dv`, `valor` = `valor_liquido`, `endereco`, `municipio`, `cep`,
    `uf`) com o favorecido do fornecedor e a conta do pagamento (vazia, a do fornecedor; agência até 4 dígitos e conta
    até 9, DV depois do hífen). Nº da OB = exercício + sequência do pagamento (`OP-000123` de 2026 → `02026000123`);
    relação = exercício + nº da remessa + tipo (`31` outro banco, `32` BB); OBs ordenadas por tipo. Recusa (`22023`)
    conta sem os dados do OBN600, lista vazia/repetida/acima de 999, data fora de [ontem, hoje + 60], pagamento que
    não esteja programado/autorizado, estornado, sem favorecido com CPF/CNPJ, sem conta válida, fora da numeração
    `OP-` ou já em outra remessa (confirmada, ou reservada por outra pessoa). Numeração e reaproveitamento da reserva
    do mesmo usuário como no reenvio (`p_sequencial_minimo` só na primeira OBN600 da conta).
  - `confirmar_remessa_bancaria` (versão final nesta migração) também confirma a OBN600: confere que os pagamentos
    seguem reservados e programados/autorizados e grava o nº da OB em `fin_pagamentos.identificador_transacao`
    (devolve `pagamentos_marcados`). É por ele que `importar_arquivo_bancario` casa a OB do retorno com o pagamento e
    dá a baixa. `cancelar_remessa_bancaria` também limpa `remessa_bancaria_id` (devolve `pagamentos_liberados`);
    `fin_remessa_bancaria_json` passa a devolver `layout` e `parametros`.
  - `fin_pagamentos_proteger_baixa` (versão final): pela API (`anon`/`authenticated`, admin inclusive) o pagamento não
    nasce com `remessa_bancaria_id`, não muda `remessa_bancaria_id` e, numa remessa (reservada ou enviada), não muda
    `valor_bruto`, `valor_retencoes`, `fornecedor_id`, `banco_favorecido`, `agencia_favorecido`, `conta_favorecido`
    nem `identificador_transacao` (`42501`). Observações e status (salvo a baixa) seguem editáveis.
- **Favorecidos e lista de bancos** (`20261025090000_fin_favorecidos_bancos.sql`; só policies e dados, sem coluna nova):
  `fornecedores` ganha `coletor=financeiro:select|insert|update` no `rls/mapa.csv`, então o Financeiro lê, cadastra e
  edita os favorecidos (tela Financeiro → Favorecidos) sem apagar, que segue com Compras e Contratos. `bancos_cnab`
  passa de `modulo` a `catalogo` (qualquer usuário ativo lê, o RH escreve) e recebe 19 bancos pelo código FEBRABAN
  (`ON CONFLICT (codigo_banco) DO NOTHING`, então não mexe em banco já cadastrado); entrou nas `SEMENTES` do
  `scripts/db/gerar-baseline.sh`. A tela valida agência e conta com as mesmas regras de `registrar_remessa_obn600`
  (`src/lib/bancario/favorecido.ts`).
- **Conciliação mensal (quadro da SEFAZ)** (`20261026090000_fin_conciliacao_mensal.sql`, spec
  [2026-10-21-financeiro-conciliacao-mensal-design.md](./superpowers/specs/2026-10-21-financeiro-conciliacao-mensal-design.md)):
  - `fin_conciliacoes_mensais`: uma por conta (`fin_contas_bancarias`) e competência (dia 1, `UNIQUE`); saldo do razão
    (FIP630), saldo da conta corrente e do fundo no último dia (o extrato do quadro é a soma), rendimento do fundo,
    nomes dos arquivos lidos, observações, `situacao` `rascunho`/`fechada` e quem fechou;
  - `fin_conciliacao_itens`: lançamentos do razão (`contabil`) e do extrato (`bancario`) do mês, `casado` (com `grupo`
    e `regra`: `interno`, `re`, `ob_cancelada`, `repasse`, `valor_data`, `estorno` ou `manual`, este com
    justificativa) ou `pendente` (as quatro listas). `origem` `anterior` aponta (`item_origem_id`) a pendência do mês
    anterior fechado; `abertura` é lançada à mão na implantação;
  - trigger `fin_conciliacao_proteger`: o mês nasce rascunho, só fecha pela RPC e, fechado, nem ele nem os itens mudam
    (`42501`, admin inclusive pela API);
  - `salvar_conciliacao_mensal(conta, competência, dados, itens) → uuid` (INVOKER: a RLS vale) grava o rascunho e troca
    os itens; `fechar_conciliacao_mensal(id)` (INVOKER) recalcula o ajustado no banco e só fecha se for igual a conta +
    fundo (`22023`); as duas conferem que cada pendência `anterior` é pendente do mês imediatamente anterior fechado da
    mesma conta, uma vez só; `reabrir_conciliacao_mensal(id, motivo)` (DEFINER) só do admin, com motivo (vai para as
    observações) e sem mês posterior fechado;
  - RLS classe `permissao` (`escrita=pagamento.conciliar`; cabeçalho com `excluir=ninguem`); testes no bloco
    "Financeiro: conciliação mensal" de `scripts/db/testar-rls.sql`. A leitura dos arquivos e o casamento são do
    navegador (`src/lib/conciliacao/`).
- **PCA, entrega 1** (`20261028090000_compras_pca.sql`, spec
  [2026-10-23-compras-gerador-pca-design.md](./superpowers/specs/2026-10-23-compras-gerador-pca-design.md)):
  - catálogo CATMAT/CATSER: `cat_material_pdms` (grupo → classe → PDM), `cat_servicos` (seção → divisão → grupo →
    classe → serviço), `cat_material_itens` (só os itens de material já usados) e `cat_sincronizacoes` (data e total da
    última atualização). Chave `id` uuid e o código do catálogo `UNIQUE`; gravados pela Edge Function
    `catalogo-compras` (service role);
  - `pca_planos` (um por exercício, `UNIQUE`; `situacao` `rascunho`/`enviado_sei`/`aprovado`/`publicado`, processo SEI e
    datas; nasce rascunho pelo gatilho `pca_carimbar`), `pca_tetos` (PLOA ou QDD por ação × fonte, `UNIQUE`) e
    `pca_itens` (DFD do SEI: setor, material com PDM ou serviço, quantidade, valor unitário, `valor_total` gerado, mês,
    prioridade, ação, fonte, natureza; sai do PCA por `situacao = 'excluido'`);
  - `pca_historico`: trilha gravada pelo gatilho `pca_registrar_historico` (DEFINER): criação do plano, mudança de
    situação, troca dos tetos pelo QDD e inclusão/alteração/exclusão de item, com o autor;
  - `pca_classificadores(exercicio) → jsonb` (DEFINER): ações, fontes e naturezas (código e nome) e as linhas do QDD do
    exercício para quem tem o PCA, sem abrir a RLS do financeiro; `pca_usar_qdd(plano) → integer` (DEFINER, exige
    `compras.pca.editar`) troca os tetos pela soma de `valor_atual` do QDD por ação × fonte (`22023` sem QDD);
  - permissões `compras.pca.visualizar` e `compras.pca.editar` (concedidas a quem tem `compras.criar`); RLS classe
    `permissao` (`pca_*` com `leitura=` das duas, `cat_*` lidas pelo módulo; `excluir=ninguem`) e `trilha` no
    histórico; testes no bloco "Compras: PCA" de `scripts/db/testar-rls.sql`.
- **Processos de contratação, entrega 1** (`20261029090000_compras_processos_andamento.sql`, spec
  [2026-10-23-compras-processos-reserva-natureza-design.md](./superpowers/specs/2026-10-23-compras-processos-reserva-natureza-design.md)):
  - `processos_licitatorios` (que já existia e é referenciada por contratos, atas e solicitações) ganha `etapa` (lista
    fixa: abertura, dfd, etp, tr, cotacao, levantamento_tecnico, instrucao_adesao, analise_juridica, selecao, contrato,
    execucao, encerrado, cancelado), `setor_atual`, `situacao_atual`, `atualizado_em` e `valor_estimado_obs`;
    `modalidade` aceita `NULL` ("a definir") e o tipo `modalidade_licitacao` ganha `adesao_ata`; o gatilho
    `processo_licitatorio_normalizar` grava o nº SEI sem espaço nas pontas. As policies dela não mudam;
  - `processo_andamentos`: uma linha por movimentação no SEI (data, `data_informada`, etapa, setor, situação, autor);
    o gatilho `processo_andamento_no_processo` (DEFINER) copia a mais recente para o processo;
  - `processo_empenhos(processo uuid default null)` (DEFINER, exige ver processos): empenhos de `fin_empenhos` com
    `btrim(processo_sei)` igual ao nº do processo, sem abrir a RLS do financeiro;
  - `importar_processos_planilha(p_linhas, p_arquivo, p_simular)` (DEFINER, exige `compras.processos.editar`): cria o
    processo novo, só completa campo vazio do existente e acrescenta as movimentações que faltam; simulação e
    aplicação tudo ou nada, log em `importacoes` (tipo `processos_planilha`);
  - permissões `compras.processos.visualizar` e `compras.processos.editar` (concedidas a quem tem `compras.criar`);
    RLS classe `permissao` em `processo_andamentos` (`leitura=` das duas, `excluir=ninguem`); testes no bloco
    "Compras: processos de contratação" de `scripts/db/testar-rls.sql`.
- **Processos de contratação, entrega 2** (`20261030090000_compras_processos_reservas_peds.sql`, mesma spec, §10):
  - `processo_chave_fiplan(text)` (IMMUTABLE): leva o nº SEI (`17302.000885/2026.92`) e o nº do FIPLAN (`000885/26-92`)
    à mesma chave (`885/26-92`); é por ela que PED, empenho e processo se ligam (`processo_empenhos` passou a usá-la);
  - `fin_peds`: o relatório "Consultar PED" do FIPLAN, uma linha por PED ou documento de estorno (único por exercício,
    número e nº do estorno; `processo_chave` gerada; `dotacao_id` achada pela mesma regra do FIP 614). Só SELECT pelo
    módulo financeiro, sem escrita direta: grava `importar_peds_fiplan(p_exercicio, p_linhas, p_arquivo, p_simular)`
    (DEFINER, exige o módulo financeiro e `orcamento.importar`; upsert com as mudanças por campo, simulação desfeita,
    devolve os PEDs do exercício que não vieram no arquivo, log em `importacoes` com tipo `peds_fiplan`);
  - `processo_reservas`: reserva do processo por exercício × ação × fonte × natureza (opcionalmente ligada ao item do
    PCA), situação `reservada` ou `cancelada` (cancelar exige motivo; uma reservada por combinação), com a
    justificativa e o saldo livre do momento quando gravada sem saldo. SELECT para quem vê processos ou tem o módulo
    financeiro, sem escrita direta: `processo_reserva_salvar(...)` (DEFINER, `compras.processos.editar`, trava por
    combinação; sem saldo ou sem QDD exige justificativa de 10 caracteres) e `processo_reserva_cancelar(p_id, p_motivo)`;
  - saldo: `fin_dotacao_disponivel` = atual − bloqueado − max(PED, empenhado + reserva), porque no QDD a coluna PED já
    soma o empenhado e a Cont./Reserva; o pendente de uma reserva é o reservado menos o PED autorizado e o empenhado
    líquido do processo na combinação; saldo livre = disponível − pendente das reservas (`processo_saldo_livre`);
  - leitura (DEFINER, exigem ver processos ou o módulo financeiro): `processo_reservas_detalhe`, `processo_peds`
    (sem credor nem estornos), `processos_financeiro` (reservado, pendente, PED autorizado, empenhado, liquidado e pago
    por processo) e `programacao_por_natureza` (QDD × reservas por combinação, com os processos);
  - sem permissão nova; RLS classe `preservar` nas duas tabelas (policies na migração); testes no bloco
    "Compras: reservas e PEDs" de `scripts/db/testar-rls.sql`.
- **Localizador de processos do SEI** (`20261102090000`, só funções; spec
  [2026-10-25-localizador-processos-sei-design.md](./superpowers/specs/2026-10-25-localizador-processos-sei-design.md)).
  Nenhuma tabela, coluna, policy ou permissão nova:
  - `sei_normalizar(text)` (IMMUTABLE): chave `NNNNNN/AA-DV` do nº SEI completo (`17302.000885/2026.92`) ou
    abreviado do FIPLAN (`000885/26-92`), `NULL` se o texto não é nº SEI; espelhada em `src/lib/processos/numeroSei.ts`;
  - `texto_busca(text)` (IMMUTABLE): minúsculas e sem acento por `translate` (o baseline não instala `unaccent`);
  - `localizar_processos_sei(p_termo, p_limite default 50)` (INVOKER, cada fonte com a RLS dela): busca pelo nº (chave
    normalizada, ou os dígitos quando o termo só tem número) ou por palavras em `processos_administrativos`,
    `processos_licitatorios`, `passagem_pedidos`, `pca_itens`, `fin_empenhos`, `documentos`, `termos_cessao` e
    `viagens_diarias`; termo com menos de 3 caracteres não devolve nada; limite de 1 a 200;
  - `processos_parados(p_dias default 15)` (INVOKER): contratação fora de encerrado/cancelado e processo do workflow
    aberto ou em tramitação sem movimentação há mais de N dias (por `current_date`), até 200;
  - `EXECUTE` só para `authenticated`; testes no bloco "LOCALIZADOR" de `scripts/db/testar-rls.sql` (processo
    sigiloso escondido, sem módulo não acha, anon sem acesso).
- **Extrato do BB** (`20261011100300`): `fin_extrato_lancamentos` (`chave_unica` = `conta_bancaria_id|identificador_bb`).
  `registrar_extrato_bb(p_conta_bancaria_id uuid, p_lancamentos jsonb) → jsonb` (`recebidos`, `inseridos`,
  `existentes`, `conciliados`) só é executável pela **service role** (Edge Function `bb-api`, ver
  [EDGE_FUNCTIONS.md](./EDGE_FUNCTIONS.md)); casa débitos sem vínculo com pagamento de mesmo valor líquido, data
  (efetivação ou pagamento) e CPF/CNPJ do fornecedor, só com candidato único. Casar não muda o status do pagamento.
  As tabelas antigas `fin_extratos_bancarios`/`fin_extrato_transacoes` continuam como estão.
- **Baixa do pagamento só pelo banco** (`20261011100400`, decisão "Trancar tudo"; muda regras de `fin_pagamentos`,
  tabela que já existia): o trigger `trg_fin_pagamentos_proteger_baixa` (`BEFORE INSERT OR UPDATE`) recusa (`42501`)
  pela API — `anon`/`authenticated`, admin inclusive — a passagem para `pago`, o INSERT já `pago` ou com
  `data_efetivacao` e qualquer mudança de `data_efetivacao`. A baixa é de `fin_marcar_pagamento_pago`, chamada por
  `importar_arquivo_bancario` e `conciliar_movimento_bancario` (SECURITY DEFINER: rodam como o dono; service role e
  `postgres` também passam). As outras transições (programado, autorizado, cancelado…) seguem como antes.
  `fn_atualizar_empenho_pagamento` (trigger `trg_atualizar_empenho_pagamento`, `AFTER INSERT OR UPDATE OF status`)
  passou a agir também na transição para `pago` por UPDATE (antes só no INSERT já pago): soma `valor_bruto` no
  `valor_pago` do empenho (status `pago`/`parcialmente_pago`) e da dotação e baixa `valor_liquido` do `saldo_atual` de
  `fin_contas_bancarias` (`data_ultimo_saldo` = data de efetivação, ou do pagamento). Só na transição: repetir
  `status = 'pago'` ou reimportar o retorno não soma de novo. Sair de `pago` **não estorna** (a função nunca
  estornou). Junto foi corrigido um defeito antigo: o status do empenho era gravado como `text` em coluna
  `status_empenho` (`42804`), o que derrubava qualquer baixa com empenho real. O QDD do FIPLAN
  (`importar_qdd_fiplan`) continua gravando os valores da dotação por atribuição, então sobrescreve o efeito do
  trigger na próxima importação.
- **Auditoria**: as três tabelas novas têm trigger `trg_audit_<tabela>` (`AFTER INSERT OR UPDATE OR DELETE`,
  `fn_audit_financeiro`, a mesma de empenhos/liquidações/pagamentos), que grava antes/depois, campos alterados e autor
  em `fin_audit_log` (classe `trilha`: o módulo financeiro lê, ninguém escreve pela API).
- **RLS e privilégios**: as três tabelas novas só têm policy de SELECT (perfil ativo + módulo financeiro; CPF/CNPJ e
  conta de favorecido são dado pessoal) e sem INSERT/UPDATE/DELETE para `anon`/`authenticated`. As RPCs são
  `SECURITY DEFINER` com `search_path` fixo e conferem `perfil_ativo_atual()`, `can_access_module(…, 'financeiro')` e
  a permissão; `fin_casar_movimento_pagamento`, `fin_marcar_pagamento_pago` e `fin_remessa_bancaria_json` são de uso
  interno (sem EXECUTE para a API). Erros: `42501` sem permissão; `22023` dado inválido; `P0002` registro inexistente.
- **No baseline**: `schema/` regenerado, as três tabelas como `preservar` no `rls/mapa.csv`, REVOKE/GRANT no
  `overlay/40_privilegios.sql` e testes no bloco "Financeiro: FIPLAN, arquivos bancários e extrato do BB" de
  `scripts/db/testar-rls.sql`. A remessa OBN600 (`20261024090000`) tem o bloco "Financeiro: remessa OBN600 dos
  pagamentos".

### Patrimônio e inventário
`bens_patrimoniais`, `movimentacoes_bem`, `movimentacoes_patrimonio`,
`historico_patrimonio`, `baixas_patrimonio`, `manutencoes_patrimonio`,
`ocorrencias_patrimonio`, `campanhas_inventario`, `coletas_inventario`,
`conciliacoes_inventario`, `patrimonio_unidade`, `campanhas_inventario_unidades`,
`fotos_vistoria_inventario`. Almoxarifado: `almoxarifados`,
`estoque`, `movimentacoes_estoque`, `categorias_material`, `itens_material`,
`requisicoes_material`, `requisicao_itens`.

**Permissões (P14 entrega 4, migração `20261023100000_patrimonio_permissoes_entrega4.sql`).**

- O app de coleta (módulo `patrimonio_mobile`) só tem as operações que usa: lê e cadastra bem (com a foto no próprio
  INSERT), lê e registra coleta, insere baixa e movimentação, lê e atualiza `campanhas_inventario_unidades`, lê
  `unidades_locais` e `campanhas_inventario`. Saiu de almoxarifado, estoque, requisições, manutenções, ocorrências,
  conciliações, agenda e histórico. Sufixo `coletor=` do mapa.
- `bens_patrimoniais`: UPDATE exige `patrimonio.editar` (sufixo `altera=`; a migração concedeu a permissão a quem já tinha
  `patrimonio.criar`, nas três fontes); DELETE só admin. UPDATE em `itens_material` também exige `patrimonio.editar`. O gatilho `trg_bens_proteger_colunas` recusa (42501) a troca
  de `valor_aquisicao`, `data_aquisicao`, `forma_aquisicao` e `situacao` por quem não é admin quando o acesso vem da API
  (`current_user` `authenticated`/`anon`); as funções DEFINER de baixa e movimentação passam.
- `unidades_locais` escreve com `unidades.gerenciar`; `agenda_unidade`, `termos_cessao` e `documentos_cedencia` com
  `unidades.cedencias.gerenciar` (classe `permissao`).
- `fn_atualizar_estatisticas_campanha` passou a SECURITY DEFINER (`search_path=public`, sem EXECUTE pela API), para a coleta
  do app continuar atualizando os totais da campanha sem UPDATE em `campanhas_inventario`.

**Número de tombamento e fluxos (auditoria de 10/10/2026).** Migração
`supabase/migrations/20261010230000_patrimonio_gravacoes_e_tombamento.sql` (aplicada pelo CI no merge):

- Número do bem gerado só pelo banco: `fn_proximo_numero_tombamento()` usa a sequence
  `seq_tombamento_patrimonio` no formato `PAT-AAAA-NNNNNN` (sem corrida e sem reaproveitamento). O trigger
  `trg_gerar_numero_tombamento` (BEFORE INSERT/UPDATE) normaliza `numero_patrimonio`, `codigo_qr` e
  `patrimonio_anterior` (sem espaços nas pontas, maiúsculas), preenche `codigo_qr` com o número e bloqueia
  a troca do número depois de criado (só admin corrige; o número antigo vai para `patrimonio_anterior`).
  Índice único sobre o número normalizado (`uq_bens_patrimoniais_numero_norm`), criado só se os dados
  permitirem. Tombamento de plaqueta antiga (regularização) fica em `patrimonio_anterior`; o bem recebe
  número novo. `gerar_numero_tombamento(uuid)` continua existindo, usa o mesmo gerador e não é executável pelo app;
  `codigo_qr` também só é alterado por admin.
- `patrimonio_buscar_bem_por_codigo(text)` (SECURITY INVOKER, respeita a RLS): busca por número, QR ou
  número anterior, no servidor.
- `patrimonio_decidir_movimentacao(uuid, boolean, text)` e `patrimonio_decidir_baixa(uuid, boolean, text)`
  (SECURITY DEFINER, exigem `patrimonio.tramitar` ou admin): aprovar move o bem (unidade local,
  organizacional e responsável) ou o deixa `baixado`; rejeitar exige motivo. Histórico em
  `historico_patrimonio` para movimentação aprovada, baixa solicitada/aprovada/rejeitada e
  manutenção iniciada/concluída (concluir devolve o bem para `ativo`; bem baixado ou extraviado não abre
  manutenção). O trigger `trg_guardar_decisao` impede quem não tem `patrimonio.tramitar` de gravar uma
  movimentação ou baixa já decidida, ou de mudar status/aprovador direto pela API.
- `campanhas_inventario.status` aceita `pausada`; `status_coleta_inventario` ganhou `sem_etiqueta`;
  `coletas_inventario.localizacao_encontrada_unidade_id` passou a referenciar `unidades_locais` (FK `NOT VALID`).

**Inventário de campo (fase 1).** Migração
`supabase/migrations/20261009160000_inventario_campo_fase1.sql` (criada em 2026-10-09 e **aplicada
em produção no mesmo dia**, sob a versão `20261009160000`; as tabelas novas estão em `types.ts` desde o P03):

- `unidades_locais` ganha geometria: `latitude`, `longitude` (CHECK de faixa), `poligono_geojson`
  (GeoJSON `Polygon`/`MultiPolygon`), `area_terreno_m2`, `area_construida_m2`, `fonte_geometria`
  (`manual`, `gps` ou `kml`), `geometria_atualizada_em`, `geometria_atualizada_por`. As policies
  existentes da tabela cobrem as colunas novas.
- `campanhas_inventario_unidades`: situação de cada unidade numa campanha (`a_visitar`, `em_vistoria`,
  `concluida`, `com_pendencia`, `excluida`), equipe, data prevista, início/conclusão, observação;
  `UNIQUE (campanha_id, unidade_local_id)`. Complementa `campanhas_inventario.unidades_abrangidas`
  (não a substitui nem a migra). RLS por módulo `patrimonio` ou `patrimonio_mobile`.
- `fotos_vistoria_inventario`: evidência fotográfica (caminho no storage, hash SHA-256, coordenadas,
  precisão, data de captura, autor). O `id` é gerado no celular e serve de chave de idempotência da
  fila offline. RLS: quem tem o módulo `patrimonio` ou `patrimonio_mobile` lê; INSERT só em nome
  próprio (`usuario_id = auth.uid()`); UPDATE só do autor ou de quem tem `patrimonio.tramitar`; DELETE
  só com `patrimonio.tramitar`. Um trigger torna a foto imutável depois de gravada, exceto `legenda`,
  `tem_pessoa` e `codigo_objeto`.
- Bucket **privado** `inventario-evidencias` (10 MB, JPEG/WebP): o módulo lê e envia; sobrescrever ou
  apagar exige `patrimonio.tramitar`. O front lê as fotos por URL assinada de curta duração.

No baseline, `campanhas_inventario_unidades` é classe `modulo` e `fotos_vistoria_inventario` é classe
`preservar` (ver [`supabase/baseline/README.md`](../supabase/baseline/README.md)). O banco ao vivo
ainda pode ter policies `acesso_total_*` em `campanhas_inventario` e `coletas_inventario` (vêm do
histórico de migrações; o baseline já as remove); a correção no banco ao vivo aguarda decisão.

### Compras, licitações e contratos
`processos_licitatorios`, `itens_processo_licitatorio`, `itens_licitacao`,
`propostas_licitacao`, `documentos_preparatorios_licitacao`, `atas_registro_preco`,
`itens_ata_registro_preco`, `fornecedores`, `contratos`, `itens_contrato`,
`aditivos_contrato`, `medicoes_contrato`.

**Passagens aéreas (entrega 1, migração `20261031090000_contratos_passagens.sql`).** Controle e cadastro; o ato
(aprovação do Presidente, pedido à agência) continua no SEI e aqui fica só o registro.

- `passagem_beneficiarios`: quem viaja e não é servidor (atleta, técnico, convidado). CPF só com 11 dígitos e único;
  `ativo` em vez de apagar (ninguém exclui).
- `passagem_pedidos`: um por processo SEI (`numero_sei` único). Situação `recebido → cotacao_solicitada →
  cotacao_recebida → aprovado → emitido → concluido` (ou `cancelado`, com motivo). Aprovado, emitido e concluído exigem
  o nº do documento SEI e a data da aprovação. Quem pediu (servidor, beneficiário, instituição ou o próprio órgão),
  contrato da agência (`contrato_id` → `contratos`) e modo da prestação de contas (individual, único do evento ou
  dispensada com motivo). Ninguém exclui: cancela.
- `passagem_passageiros`: servidor **ou** beneficiário (um dos dois), com o nome copiado no momento do cadastro e, para
  servidor, a viagem do RH (`viagem_id`, conferida contra o servidor).
- `passagem_trechos`: origem, destino, data, voo, localizador, bilhete e valores (tarifa, embarque, serviço, desconto,
  multa, reembolso); `valor_emissao` é coluna gerada. Emitido, remarcado e reembolsado exigem localizador e data da
  emissão; trecho com localizador não se apaga (cancela).
- `passagem_cotacoes`: opções da agência por trecho; no máximo uma `escolhida`.
- `passagem_historico`: trilha (pedido criado, mudança de situação do pedido e dos trechos), escrita só por gatilho e
  lida só com a permissão de passagens (classe `trilha` com `leitura=`).
- `contratos.controla_passagens` (coluna nova, padrão `false`): marca o contrato da agência; só os marcados entram no
  saldo e na escolha do pedido. A tela de passagens cadastra o contrato já marcado ou marca um que já existe.

Permissões novas `contratos.passagens.visualizar` e `contratos.passagens.editar`, dadas a quem já tinha
`contratos.criar`. RLS pelo `mapa.csv` (classe `permissao`; histórico na classe `trilha`). Funções:
`passagem_buscar_servidores(_termo)` e `passagem_viagens_servidor(_servidor_id)` (SECURITY DEFINER, só para quem tem
`contratos.passagens.editar`, devolvem só o necessário; na busca, `%` e `_` do termo valem como texto e são exigidas 3
letras ou dígitos) e os gatilhos `passagem_carimbar`, `passagem_copiar_nome` (recusa servidor, beneficiário ou
instituição inexistente), `passagem_propagar_nome_beneficiario` (nome corrigido chega aos pedidos),
`passagem_proteger_emitido` e `passagem_registrar_historico`.

**Passagens aéreas (entrega 2, migração `20261101090000_contratos_passagens_prestacao.sql`).** Prestação de contas:
- `passagem_pedidos` ganha `prestacao_dispensa_motivo` (CHECK `passagem_pedidos_dispensa_check`: pedido dispensado só
  com motivo; os dispensados antigos recebem "Não informado (registro anterior à prestação de contas)"),
  `responsavel_passageiro_id` (responsável da delegação no modo evento; o gatilho `passagem_conferir_responsavel` exige
  passageiro do próprio pedido, `22023`), `relatorio_evento_entregue_em` e `relatorio_evento_documento_sei`.
- `passagem_passageiros` ganha `embarque_entregue_em`, `relatorio_entregue_em`, `relatorio_documento_sei`,
  `prestacao_dispensada` e `prestacao_dispensa_motivo` (CHECK `passagem_passageiros_dispensa_check`).
- `passagem_anexos` (nova): cartão de embarque, bilhete, relatório ou outro, com o caminho no bucket privado
  `passagens` (`<pedido_id>/<passageiro_id ou "pedido">/<uuid>-<nome>`; CHECK `passagem_anexos_caminho_pedido_check`) e
  o passageiro conferido pelo gatilho `passagem_conferir_anexo`. RLS classe `permissao`: lê com `visualizar` ou
  `editar`, grava e apaga com `editar`.
- Bucket `passagens`: privado, 10 MB, PDF/JPEG/PNG/WEBP; ler com o módulo e a permissão de passagens, enviar e apagar
  com `editar` (o envio exige pasta de pedido existente); sem UPDATE.
- Trilha: `passagem_registrar_prestacao` grava `prestacao_pedido` e `prestacao_passageiro` em `passagem_historico`;
  `passagem_registrar_anexo` grava `anexo_incluido` e `anexo_removido` (tipo, passageiro e nome do arquivo).
- Conclusão no banco: `passagem_conferir_conclusao` recusa ir para `concluido` com prestação em aberto (`23514`; conta
  por `passagem_prestacao_em_aberto`, sem olhar a data) e, depois de concluído, recusa mudar a prestação do pedido ou
  do passageiro (`42501`). Anexo de pedido concluído não se apaga e o caminho de um anexo não muda
  (`passagem_conferir_anexo`, `42501`).
- `passagem_relatorio_rh(_passageiro_ids)` (SECURITY DEFINER, quem lê passagens) devolve só se o relatório da viagem
  do RH ligada foi apresentado e a data; `passagem_viagens_servidor` passa a devolver também essas duas colunas.
- O prazo (padrão 5 dias corridos depois do último voo) fica em `module_settings.settings.passagens_prazo_prestacao_dias`
  do módulo `contratos`, gravado só pelo papel admin.

### Processos administrativos (workflow)
`processos_administrativos`, `movimentacoes_processo`, `documentos_processo`,
`despachos`, `encaminhamentos`, `pareceres_tecnicos`, `prazos_processo`,
`acesso_processo_sigiloso`, `acoes`, `processo_modelos`, `processo_modelo_etapas`,
`processo_modelo_checklist`, `processo_checklist_respostas`.

#### Acompanhamento de processos do SEI

Migrações `20261013100000_wf_modelos_fluxo.sql`, `20261013100100_wf_processo_sigilo.sql`,
`20261013100200_wf_rpcs.sql` e `20261013100300_wf_permissoes_catalogo.sql` (catálogo de `workflow.concluir`,
`workflow.arquivar` e `workflow.admin`) (PR #102; spec
[2026-10-13-tramitacao-acompanhamento-sei-design](./superpowers/specs/2026-10-13-tramitacao-acompanhamento-sei-design.md)).
O sistema acompanha o processo que corre no SEI: etapa, unidade, prazo e checklist. Despacho, documento e assinatura
ficam no SEI. `processos_administrativos` virou o "processo acompanhado" e `movimentacoes_processo` registra cada
passagem de etapa.

- **Modelos**: `processo_modelos` (`codigo` único, `nome`, `tipo_processo`, `base_legal`, `ativo`),
  `processo_modelo_etapas` (`ordem` única por modelo, `nome`, `unidade_sigla`, `responsavel_rotulo`,
  `prazo_dias_uteis`, nulo = sem prazo) e `processo_modelo_checklist` (`etapa_ordem`, `codigo` único por modelo,
  `descricao`, `obrigatorio`). `unidade_sigla` é uma sigla de `estrutura_organizacional` ou `@ORIGEM` (unidade de quem
  abriu o processo) / `@CHEFIA` (unidade superior à de origem). RLS (classe `permissao` do mapa): o módulo `workflow`
  lê; escrever exige o módulo **e** `workflow.admin`. Carga inicial por migração de 7 modelos: `compras`, `diarias`,
  `convenios`, `almoxarifado`, `pagamentos`, `patrimonio_tombamento` e `patrimonio_baixa`, com etapas, unidade,
  rótulo, prazo (5 dias úteis, sem prazo em Fiscalização, Execução e Viagem) e checklist. Prazos, `base_legal` de
  compras e pagamentos e as etapas e itens marcados "(proposta)" na spec aguardam confirmação do órgão. Não há
  trigger de `updated_at` nas três tabelas. **Etapa em uso**: o trigger `wf_recusar_etapa_em_uso` (`BEFORE DELETE OR
  UPDATE OF ordem, modelo_id` em `processo_modelo_etapas`; função `SECURITY DEFINER` fora da API) recusa com `22023`
  apagar a etapa ou mudar a ordem ou o modelo dela enquanto algum processo (de qualquer situação) estiver nela
  (`modelo_id` e `etapa_atual_ordem` iguais); vale também na cascata de `processo_modelos`. Mudar nome, unidade ou
  prazo continua livre.
- **Colunas novas em `processos_administrativos`**: `numero_sei` (único quando preenchido, sem espaço e com algum
  dígito), `modelo_id`, `etapa_atual_ordem`, `unidade_atual_id`, `etapa_iniciada_em`, `etapa_prazo_limite` e
  `suspenso_desde` (data em que a suspensão parou o relógio do prazo). **Em `movimentacoes_processo`**:
  `etapa_origem_ordem` e `etapa_destino_ordem`. Processo antigo, sem modelo, continua visível, sem trilha nem
  checklist.
- **`processo_checklist_respostas`**: uma linha por (processo, item), com `marcado`, `marcado_por`, `marcado_em` e
  `observacao`; RLS forçada. Só `wf_marcar_item` grava.
- **Dias úteis e prazo**: `fn_somar_dias_uteis(data, n)` (`STABLE`, `INVOKER`) soma `n` dias úteis sem contar o dia
  de início, pulando sábado, domingo e `feriados` (os recorrentes valem em todo ano). `n` nulo ou 0 devolve a data;
  negativo ou acima de 3650 recusa com `22023`. `fn_situacao_prazo(date)`
  devolve `sem_prazo`, `vencido`, `vence_logo` (vence em até 2 dias úteis, inclusive hoje) ou `em_dia`, com "hoje" no
  fuso do órgão (`app.fuso_horario`, padrão `America/Sao_Paulo`; a regra espelha `data_local()`, que
  `authenticated` não executa). Ambas executáveis por `authenticated`.
- **Sigilo**: `wf_pode_ver_processo(uuid)` (`SECURITY DEFINER`, `STABLE`, exige usuário ativo). Vê o processo quem:
  (1) tem o módulo `workflow` **e** `workflow.visualizar`, quando o processo é público; (2) abriu o processo
  (`created_by`); (3) tem credencial em `acesso_processo_sigiloso`; ou (4) tem `workflow.admin` (o papel admin passa
  por `has_permission_code`). Processo inexistente dá `false`.
- **Policies** de `processos_administrativos`, `movimentacoes_processo`, `despachos`, `documentos_processo`,
  `prazos_processo` e `processo_checklist_respostas`: só `wf_select` (por `wf_pode_ver_processo`) e `wf_delete` (só
  `workflow.admin`). Não há policy de INSERT nem de UPDATE para `authenticated`: **a escrita é só pelas RPCs `wf_*`**.
  A migração apaga as policies antigas (`rls_*`, `acesso_total_*`, `proc_*`, FASE 6) e qualquer outra que encontrar
  nessas tabelas, com `RAISE NOTICE`, porque policies são permissivas (OR) e uma sobra abriria o sigilo. A classe das
  seis tabelas no `supabase/baseline/rls/mapa.csv` é `preservar`.
- **Trilha do processo**: `fn_audit_log_licitacoes` copia para `audit_log_licitacoes` a linha inteira de
  `processos_administrativos`, `despachos`, `documentos_processo`, `movimentacoes_processo` e `prazos_processo`. Desde a
  migração `20261015100000_audit_trilha_sigilo.sql`, a leitura dessa trilha exige, além do módulo `compras` ou `contratos`,
  `wf_pode_ver_processo` do processo de origem (ou o papel admin, que lê também a trilha de processo apagado); antes, quem
  tinha um desses módulos lia pela API o conteúdo de processo restrito/sigiloso. As linhas das outras tabelas auditadas não
  mudam. No mapa de RLS: classe `trilha` com `extra=sigilo_workflow`.
- **RPCs `wf_*`** (`SECURITY DEFINER`, `search_path` fixo, `EXECUTE` só para `authenticated`). As que recebem um
  processo seguem a mesma ordem: sigilo, trava da linha (`FOR UPDATE`, que serializa as movimentações do processo) e
  só então a permissão da ação. Quem não vê o processo recebe `42501` com a **mesma mensagem** de processo
  inexistente. Em processo restrito ou sigiloso, quem só tem credencial `leitura` recebe `42501` ("Sua credencial
  neste processo é só de leitura") em qualquer RPC que altere. Códigos de erro: `42501` (permissão ou sigilo), `22023`
  (regra de negócio, mensagem em português) e `40001` (a etapa mudou desde a leitura: recarregue).

  | RPC | Permissão | O que faz e o que recusa |
  |---|---|---|
  | `wf_abrir_processo(modelo, assunto, descricao, interessado_tipo, interessado_nome, interessado_documento, sigilo, numero_sei)` | módulo `workflow` **e** `workflow.criar` | Abre na etapa 1 do modelo, com unidade de origem = lotação vigente do servidor do login, unidade atual e prazo. Retorna o id. `42501` sem o módulo ou sem a permissão (a permissão avulsa sem o módulo não abre); `22023` para modelo inexistente ou inativo, assunto ou interessado vazio, tipo de interessado fora de `interno`/`externo`, número SEI sem dígito ou já usado |
  | `wf_marcar_item(processo, item_codigo, marcado, observacao)` | `workflow.tramitar` | Marca ou desmarca item do checklist da etapa atual ou de anterior; grava quem e quando. `22023` para processo suspenso, concluído ou arquivado, sem modelo, item inexistente ou de etapa ainda não alcançada |
  | `wf_avancar_etapa(processo, etapa_esperada, observacao)` | `workflow.tramitar` | Avança para a próxima etapa: grava movimentação `encaminhamento`, nova etapa, unidade, prazo, situação `em_tramitacao`. `40001` se `etapa_esperada` difere da atual; `22023` para processo fora de andamento, sem modelo, última etapa (conclua), item obrigatório pendente (lista as descrições dos itens, separadas por `;`, como no checklist da tela) ou sem número SEI ao sair da etapa 1 |
  | `wf_devolver_etapa(processo, etapa_esperada, para_ordem, motivo)` | `workflow.tramitar` | Volta a uma etapa anterior (movimentação `devolucao`). `40001` como acima; `22023` sem motivo, destino que não é anterior à atual ou inexistente |
  | `wf_suspender(processo, motivo)` | `workflow.concluir` | Status `suspenso` e `suspenso_desde` = hoje; o prazo para. `22023` sem motivo ou fora de andamento |
  | `wf_reativar(processo, motivo)` | `workflow.concluir` | Soma, a partir de hoje, os dias úteis que faltavam na suspensão (prazo já vencido continua vencido pelos mesmos dias corridos). Volta a `em_tramitacao` se já houve encaminhamento ou devolução, senão a `aberto`. `22023` se não está suspenso ou sem motivo |
  | `wf_concluir(processo, motivo)` | `workflow.concluir` | Com modelo, só na última etapa e com todo item obrigatório marcado; sem modelo, direto. Grava `data_encerramento`. `22023` fora desses casos (a recusa por pendência lista as descrições dos itens) |
  | `wf_arquivar(processo, motivo)` | `workflow.arquivar` | Aceita processo em andamento, suspenso ou concluído; recusa o já arquivado (`22023`). Não exige despacho |
  | `wf_atualizar_numero_sei(processo, numero_sei)` | `workflow.tramitar` | Corrige o número enquanto o processo está na etapa 1 (ou sem modelo); vazio apaga. `22023` fora da etapa 1, fora de andamento ou número inválido ou repetido |
  | `wf_conceder_acesso(processo, usuario, nivel, motivo)` | `workflow.admin` | Concede ou troca o nível (`leitura`, `tramitacao`, `total`) em `acesso_processo_sigiloso`. Vale em processo de qualquer situação. `22023` para nível inválido ou usuário inexistente ou inativo |
  | `wf_revogar_acesso(processo, usuario)` | `workflow.admin` | Retira a credencial; sem erro se não havia. Vale em qualquer situação do processo |
  | `wf_listar_credenciais(processo)` | `workflow.admin` | Lista usuário, nível, motivo, quem concedeu e data (só `profiles.full_name`: sem e-mail nem CPF); `STABLE`, sem trava. Existe porque a RLS de `acesso_processo_sigiloso` só deixa o papel admin ler e a migração não a mudou. Sigilo primeiro (`42501` com a mensagem de processo inexistente), depois a permissão |
  | `wf_listar_usuarios_ativos()` | `workflow.admin` | Lista `id` e `full_name` dos perfis ativos (`profiles.is_active`, o mesmo critério de `wf_conceder_acesso`), por nome, para escolher quem recebe a credencial; sem e-mail nem CPF. `STABLE`, sem processo. `42501` sem a permissão |

  O número SEI é normalizado (espaços removidos; vazio vira `NULL`); a mensagem de número repetido traz o número interno
  do outro processo só para quem pode vê-lo. Sem lotação vigente (`lotacao_vigente`), `wf_abrir_processo` abre o
  processo sem unidade de origem: as etapas `@ORIGEM` e `@CHEFIA` ficam sem unidade resolvida.
- **Funções internas** (sem `EXECUTE` para `authenticated`, `anon` nem `service_role`; só as RPCs, como dono, as
  chamam): `wf_resolver_unidade(sigla, origem)` (unidade ativa e não extinta com a mesma sigla, sem diferenciar
  maiúsculas; sigla sem correspondência dá `NULL`, e a etapa avança assim mesmo), `wf_travar_processo`,
  `wf_exigir_em_andamento`, `wf_pendencias`, `wf_preparar_numero_sei` e `wf_registrar_movimentacao`.
- **View `v_processos_acompanhamento`** (`security_invoker`, só `SELECT` para `authenticated`): `p.*` mais
  `numero_formatado`, `modelo_codigo`, `modelo_nome`, `etapa_nome`, `etapa_total`, `unidade_sigla` (a da unidade
  resolvida ou, sem ela, a da etapa), `unidade_nome`, `situacao_prazo` (semáforo só para processo `aberto` ou
  `em_tramitacao`; os demais são `sem_prazo`) e `pendencias_obrigatorias`. A RLS das tabelas de origem vale, então o
  sigilo esconde o processo inteiro. Foi criada com `DROP VIEW` + `CREATE VIEW` (o `p.*` é expandido na criação) e os
  privilégios são refeitos na migração.
- **Removido**: os triggers duplicados `tr_audit_processos`, `tr_audit_movimentacoes`, `tr_audit_despachos` (ficam os
  `audit_*`) e `tr_updated_at_*` das cinco tabelas (fica `handle_updated_at`); os triggers
  `tr_verificar_arquivamento` e `tr_validar_arquivamento`, com as funções `verificar_arquivamento_processo` e
  `fn_validar_arquivamento_processo` (exigiam despacho conclusivo para arquivar; agora é `wf_arquivar` com
  `workflow.arquivar`); `fn_proximo_numero_processo(integer)` (4 dígitos, sem uso) e `fn_pode_arquivar_processo(uuid)`.
  O número interno (`00001/ano`) segue vindo do trigger `gerar_numero_processo`, que agora toma um
  `pg_advisory_xact_lock` por ano antes do `MAX+1`.
- **Funções antigas ajustadas**: `fn_contar_processos_por_status()` passou a `SECURITY INVOKER`, e a RLS decide o que
  entra na contagem (antes, `DEFINER`, contava os sigilosos); `fn_calcular_sla_processo(uuid)` continua `DEFINER`, mas
  devolve nenhuma linha para processo que o usuário não vê ou que não existe.
- **Tipos**: as tabelas, a view e as RPCs novas estão em `src/integrations/supabase/types.ts` (gerado) desde o
  P03; `useAcompanhamentoProcessos` as acessa pelo client tipado.

### Governança e compliance
`estrutura_organizacional`, `cargos`, `composicao_cargos`, `vagas_cargo`,
`cargo_unidade_compatibilidade`, `nomeacoes_chefe_unidade`,
`matriz_raci_papeis`, `matriz_raci_processos`, `matriz_raci_atribuicoes`,
`riscos_institucionais`, `avaliacoes_risco`, `planos_tratamento_risco`,
`controles_internos`, `avaliacoes_controle`, `evidencias_controle`,
`checklists_conformidade`, `itens_checklist`, `respostas_checklist`,
`decisoes_administrativas`, `debitos_tecnicos`, `publicacoes_legais`,
`dados_oficiais`, `config_institucional`.

`dados_oficiais` é a configuração do cliente (chave → valor: nome do sistema, identidade, CNPJ,
endereço, dirigente, contato), editada em `/admin/configuracao-cliente`. Desde a migração
`supabase/migrations/20261011023500_configuracao_cliente.sql` a leitura é pública (anon e logados, classe `publico_admin`)
e a escrita só do papel admin. As chaves válidas estão em `CAMPOS_CLIENTE`
(`src/core/tenant/dadosOficiais.ts`). Ver [CONFIGURACAO_CLIENTE.md](./CONFIGURACAO_CLIENTE.md).

#### Quadro de vagas

Migração `supabase/migrations/20261012150000_rh_quadro_vagas.sql` (**em PR rascunho**; spec
[2026-10-12-rh-quadro-vagas-design](./superpowers/specs/2026-10-12-rh-quadro-vagas-design.md)). Antes, o cargo tinha
só um número (`cargos.quantidade_vagas`) e a vaga não tinha identidade.

- **`vagas_cargo`**: uma linha por vaga do cargo — `codigo` único em maiúsculas (ex.: `CDS-1.001`), `cargo_id`,
  `unidade_id` opcional, `data_criacao`/`ato_criacao`, `data_extincao`/`ato_extincao` (extinção não anterior à
  criação), `observacoes` e autoria. RLS no baseline: classe `catalogo`, módulos `rh|governanca`,
  `escrita=governanca.cargos.gerenciar` (qualquer usuário ativo lê; gravar exige um dos módulos **e** o código); a
  migração traz o mesmo SQL do gerador, e `anon` perde todo privilégio. Triggers: `trg_vagas_cargo_validar`
  (normaliza o código; sem data de criação usa `data_local()`; vaga com histórico de ocupação não muda de cargo nem
  de código e não é apagada — registra-se a extinção; não extingue com ocupante depois da data), `zz_fixar_autoria`,
  `audit_vagas_cargo` (trilha no módulo `rh`) e a regra de setor (`zz_exigir_setor`/`zz_exigir_setor_fim`;
  `lancamento_modulos_tabela` devolve `rh` e `governanca` para a tabela).
- **`provimentos.vaga_id`** (FK para `vagas_cargo`): a ocupação da vaga é o provimento, no período
  `[data_nomeacao, data_encerramento)`. O trigger `trg_provimento_vaga` (função `rh_provimento_vaga`, `SECURITY
  DEFINER`, sem EXECUTE pela API): provimento ativo ou suspenso sem vaga, num cargo que tem vagas, recebe a primeira
  vaga livre (mesma unidade primeiro), ou é recusado com `23P01`; trava a vaga (`FOR UPDATE`) e recusa período
  sobreposto com outro ocupante da mesma vaga (o dia da saída já pode ser o da entrada do sucessor), vaga de outro
  cargo e ocupação depois da extinção; provimento `encerrado`/`vacante` sem data de saída recebe `data_local()`.
  Índice único parcial `provimentos_vaga_aberta_uidx`: no máximo um provimento em aberto por vaga.
  `fn_validar_provimento` e `validar_provimento` pulam a contagem por cargo quando há vaga; cargo sem vaga cadastrada
  segue a regra antiga (`cargos.quantidade_vagas`).
- **Views** `v_quadro_vagas` (situação atual de cada vaga e ocupante) e `v_vagas_historico` (vaga criada/extinta,
  entrada e saída de ocupantes), ambas `security_invoker`: o nome do ocupante segue a RLS de `provimentos` e
  `servidores`. A situação (`livre`, `ocupada`, `extinta`) vem de `rh_vaga_situacao(uuid)` (`SECURITY DEFINER`, exige
  usuário ativo, sem dado pessoal) e o ocupante de `rh_vaga_ocupante_atual(uuid)` (`SECURITY DEFINER`, devolve o id do
  provimento só para os módulos rh ou gabinete, que já leem `provimentos`); os demais veem a vaga ocupada sem o nome.
  A mensagem de vaga ocupada do trigger só traz o nome do ocupante para quem tem o módulo rh. Tirar a vaga de um
  provimento em vigor é recusado, assim como provimento em vigor com data de saída já passada. A trava conta com
  READ COMMITTED (padrão da API). Sem vaga, a contagem antiga só roda quando o provimento entra em ativo: encerrar ou
  suspender quem sobrou acima do quadro nunca é barrado. Nomeação com data futura só ocupa a vaga a partir dela.
- **RPC `rh_importar_quadro_vagas(p_linhas jsonb, p_gravar boolean)`**: seção "Funções / RPC" abaixo.

### Transparência / LAI
`solicitacoes_sic`, `recursos_lai`, `prazos_lai`, `historico_lai`, `publicacoes_lai`.

### Comunicação / CMS
`demandas_ascom`, `demandas_ascom_anexos`, `demandas_ascom_comentarios`,
`demandas_ascom_entregaveis`, `cms_conteudos`, `cms_categorias`, `cms_banners`,
`cms_galerias`, `cms_galeria_fotos`, `cms_media`, `conteudo_rascunho`,
`historico_conteudo_oficial`, `config_paginas_publicas`, `config_paginas_historico`,
`portal_diretoria`.

Avisos internos (**migração `20261009120000_avisos_e_datas_importantes.sql`, ainda não aplicada em
remoto**): `avisos` (prioridade, destaque, validade `inicio_em`/`expira_em`, público `todos` ou
`modulos_alvo`), `avisos_leituras` (quem leu) e `datas_importantes` (prazos, eventos, reuniões; feriados
continuam em `dias_nao_uteis`). RLS na própria migração: só o usuário ativo do público-alvo lê o aviso
vigente; escrita exige `avisos.gerenciar` (`pode_gerenciar_avisos()`); cada usuário só registra e vê as
próprias leituras. No baseline as três tabelas estão no `rls/mapa.csv` como `preservar` e entram no
schema na próxima regeneração.

Envio de e-mail e WhatsApp (**migração `20261009150000_config_envio_email_whatsapp.sql`, ainda não
aplicada em remoto**): `config_envio` (uma linha por canal: provedor, remetente, SMTP, identidade visual,
número e templates do WhatsApp) e `envios_log` (trilha dos disparos, sem corpo). A credencial fica no
Supabase Vault: `config_envio.segredo_id` não é legível pela API, `salvar_segredo_envio` só grava e
`config_envio_servidor` (config + segredo decifrado) só a service role executa. RLS: leitura com
`admin.envios` ou `admin.envios.configurar`, escrita com `admin.envios.configurar`; `envios_log` só é
gravada pelas Edge Functions. No baseline as duas tabelas estão no `rls/mapa.csv` como `preservar`.

### Unidades locais e cessões
`unidades_locais`, `agenda_unidade`, `agrupamento_unidade_vinculo`,
`config_agrupamento_unidades`, `cessoes`, `termos_cessao`, `documentos_cedencia`.

#### Termo de cessão e designação de chefia: ciclo do SEI

Mesma regra das portarias ("ato formal é do SEI", P23): o sistema não gera mais o PDF do termo de cessão nem o
memorando de designação; só registra e acompanha o ciclo. Migração
`supabase/migrations/20261023090000_registro_sei_termo_cessao_designacao.sql` (idempotente; só `ADD COLUMN` nulo e
`DROP NOT NULL`, nenhuma linha antiga muda):

- **`termos_cessao`**: colunas novas `processo_sei` (texto), `doe_numero` (texto) e `doe_data` (data);
  `numero_termo` passa a aceitar nulo e é o número que o termo recebe no SEI (as linhas antigas guardam o número
  interno que o sistema gerava); `data_assinatura` já existia. O `status` (enum `status_termo_cessao`, padrão
  `pendente`) segue o SEI: `pendente` = aguardando SEI (sem número), `emitido` = numerado, aguardando assinatura,
  `assinado` = com a data da assinatura, `cancelado`. A etapa é calculada na tela (`statusTermoPeloSei`,
  `src/lib/registroSei.ts`); o banco não tem trigger de ciclo para o termo.
- **`nomeacoes_chefe_unidade`**: colunas novas `processo_sei` (texto) e `ato_data_assinatura` (data); `ato_numero` e
  `ato_data_publicacao` passam a aceitar nulo (designação registrada antes do número no SEI fica "aguardando SEI");
  o DOE continua em `ato_doe_numero`/`ato_doe_data`. O trigger `encerrar_nomeacao_anterior` não muda.
- **RLS**: sem mudança. As policies `rls_*` das duas tabelas (`termos_cessao`: módulo `patrimonio`;
  `nomeacoes_chefe_unidade`: `rh` ou `patrimonio`) são por linha e valem para as colunas novas; os privilégios são
  por tabela.
- **Front**: hooks `useTermosCessao` e `useDesignacoesChefiaUnidade`; validação do registro (assinatura e DOE só com
  o número do ato; DOE com número e data juntos) em `src/lib/registroSei.ts`.

### Esporte: federações, instituições, eventos e árbitros
`federacoes_esportivas`, `federacao_arbitros`, `federacao_espacos_cedidos`,
`federacao_parcerias`, `calendario_federacao`, `instituicoes`,
`noticias_eventos_esportivos`, `galeria_eventos_esportivos`,
`contatos_eventos_esportivos`, `categorias_noticias_eventos`,
`cadastro_arbitros`, `cadastro_arbitros_modalidades`.

`cadastro_arbitros` e `cadastro_arbitros_modalidades` guardam dado pessoal (CPF,
RG, e-mail, dados bancários, links de documentos). **A partir da migração
`supabase/migrations/20261006230500_endurece_audit_logs_e_cadastro_arbitros.sql`
(criada em 2026-10-06, ainda não aplicada em remoto)**, o visitante anônimo só
pode **inserir**; a leitura é só para usuário autenticado. O formulário público usa
as RPCs `arbitro_cpf_cadastrado(p_cpf)` (devolve apenas se o CPF já existe) e
`obter_protocolo_arbitro(p_id)` (devolve só o protocolo do `id` gerado no
navegador). O bucket `arbitros-docs` é **privado** desde a migração
`supabase/migrations/20261010233000_onda2_arbitros_docs_privado.sql`: o formulário público só envia, e
quem tem o módulo `arbitros` abre os arquivos por URL assinada de 10 minutos
(`src/hooks/useArquivoArbitro.ts`). As tabelas continuam guardando o endereço no
formato `/object/public/arbitros-docs/...`, só como referência ao caminho.

### Gestores escolares (JER)
`gestores_escolares`, `gestores_escolares_historico`, `escolas_jer`.

### Reuniões
`reunioes`, `participantes_reuniao`, `historico_convites_reuniao`,
`modelos_mensagem_reuniao`, `config_assinatura_reuniao`.

### Programas e documentos gerais
`programas`, `documentos`.

#### Portaria: ciclo do SEI e registro na ficha

Decisão do dono (12/10/2026): o sistema **não redige** portaria nem outro ato formal; a formalização é no SEI e o
sistema só acompanha o ciclo (processo SEI, número, assinatura, publicação no DOE) e registra na ficha. Migração
`supabase/migrations/20261012165000_rh_portaria_ciclo_sei.sql` (idempotente; nada é apagado — `conteudo_html`,
`conteudo_unificado` e `ementa` antigos ficam como histórico):

- **Coluna `processo_sei`** (texto) em `documentos` e em `historico_funcional`.
- **`documentos_portaria_validar`** (trigger `trg_documentos_portaria_validar`, `BEFORE INSERT OR UPDATE OR DELETE`)
  passa a valer **também na criação**: portaria que já nasce assinada exige quem assinou e a data; nascendo publicada
  ou vigente exige nº e data do DOE (vigente, também o início da vigência); não se cadastra portaria já revogada; o
  número provisório `PENDENTE/AAAA` não passa de "aguardando assinatura". Portaria assinada/publicada não se apaga.
- **`trg_documentos_portaria_ficha`** (`AFTER INSERT OR UPDATE`, função `documentos_portaria_ficha`, `SECURITY
  DEFINER`, sem EXECUTE pela API): quando a portaria vira publicada (ou nasce publicada/vigente), grava número e data
  da portaria, nº e data do DOE e o processo SEI no lançamento do `historico_funcional` de cada servidor do ato (mesmo
  tipo pela categoria e mesmo cargo, ainda sem DOE, o mais próximo da data do ato), sem sobrescrever lançamento que já
  tem outro DOE.
- **`rh_admitir_servidor` e `rh_desligar_servidor`**: a pendência da portaria nasce em `minuta` com número provisório
  `PENDENTE/AAAA` (fora do índice único) e **sem texto** (`ementa` nula), no lugar do número gerado pelo sistema.

### Importação de dados
`importacoes` (migração `20261009153000_importacoes_e_qdd_fiplan.sql`): log de toda importação
aplicada — `tipo` do importador, `modulo` dono dos dados, nome/tamanho/SHA-256 do arquivo (o arquivo
não é guardado), `exercicio`, `resumo` (totais, cadastros criados, ausentes) e `detalhes` (antes/depois
dos campos alterados). RLS: `SELECT` para quem acessa o módulo da linha (`can_access_module`); sem
policy de escrita e sem `INSERT/UPDATE/DELETE` para `anon`/`authenticated` — só as RPCs de importação
gravam. No baseline está como `preservar` em `rls/mapa.csv`.

#### Tabelas do FIPLAN (`fin_classificadores_fiplan`)

Migração `supabase/migrations/20261019100000_fin_classificadores_fiplan.sql`. Spec:
[`2026-10-19-classificadores-fiplan-design.md`](./superpowers/specs/2026-10-19-classificadores-fiplan-design.md).
Uma linha por código das tabelas de classificação do FIPLAN e exercício (`tipo`: `funcao`, `programa`, `elemento`,
`subelemento`, `fonte`, `finalidade_pagamento`; código como o FIPLAN mostra, ex. `39.01`, `1.500`), com as demais
colunas da planilha em `atributos`. RLS: `SELECT` para quem acessa o módulo financeiro; sem escrita pela API (classe
`preservar` no mapa, privilégio retirado no overlay 40). Quem grava é `importar_classificadores_fiplan`, que também
corrige o nome de `fin_fontes_recurso` (mesmos dígitos), de `fin_programas_orcamentarios` do exercício e das
naturezas com o nome provisório do QDD; nada é criado nesses cadastros nem apagado.

#### Empenhos do FIPLAN (FIP 614)

Migração `supabase/migrations/20261027090000_fin_empenhos_fip614.sql`. Spec:
[`2026-10-22-importacao-empenhos-fip614-design.md`](./superpowers/specs/2026-10-22-importacao-empenhos-fip614-design.md).
O FIPLAN é a fonte dos empenhos importados; a dotação continua vindo do QDD.

- `fin_empenhos` ganha `origem` (`sistema` | `fiplan`, padrão `sistema`, não muda depois de gravada),
  `credor_codigo_fiplan`, `credor_nome`, `ped_numero`, `ped_data`, `dotacao_fiplan`, `processo_fiplan`,
  `data_referencia_fiplan` e `importacao_id`; `numero` passa a `varchar(30)`. `fornecedor_id` e `dotacao_id` deixam
  de ser `NOT NULL`, mas o CHECK `fin_empenhos_sistema_vinculos_check` continua exigindo os dois no empenho feito no
  sistema. Os gatilhos de saldo (`fn_atualizar_saldo_dotacao_empenho`, `fn_validar_saldo_empenho`,
  `fn_verificar_saldo_dotacao`) ignoram `origem = 'fiplan'`: o valor da dotação já vem somado no QDD.
- `fornecedores.codigo_credor_fiplan` (formato `2001.00001-1`, único quando preenchido): liga o empenho importado ao
  favorecido na importação.
- `fin_empenho_documentos_fiplan`: histórico do empenho no FIPLAN (EMP, LIQ, NOB, GCV, EST; número, data, P/C, valor
  por coluna e histórico da liquidação), apagado junto com o empenho. RLS: `SELECT` para perfil ativo com o módulo
  financeiro; sem escrita pela API (classe `preservar`, privilégio retirado no overlay 40).
- `importar_empenhos_fip614(p_exercicio, p_linhas, p_arquivo, p_data_referencia, p_simular)` — `SECURITY DEFINER`,
  exige perfil ativo, módulo financeiro e `orcamento.importar`; simula ou aplica tudo ou nada e registra em
  `importacoes` (`tipo = 'empenhos_fip614'`). Cria ou atualiza pelo número, nunca apaga, e recusa número que já é de
  empenho feito no sistema. A dotação liga pelos dígitos de `função…fonte` como prefixo do `codigo_dotacao`; com
  mais de uma candidata, o IDU em número do 11º segmento (1 Não, 4 ECNI, 5 ECI, 6 EII; vem no Excel, o PDF corta a
  dotação antes dele) escolhe pela sigla do QDD. Sem IDU, mantém a escolha anterior se ainda for candidata, senão
  fica nula com aviso, e a escolha é feita na tela do empenho (UPDATE de `dotacao_id` pela policy de `fin_empenhos`).

#### Importar portarias (`importar_portarias_planilha`)

Migração `supabase/migrations/20261015120000_gab_importar_portarias.sql`. Spec:
[`2026-10-15-importacao-portarias-planilha-design.md`](./superpowers/specs/2026-10-15-importacao-portarias-planilha-design.md).
Cria a permissão `gabinete.portarias.importar` no `module_permissions_catalog` (módulo `gabinete`, categoria
"Portarias") e a RPC `importar_portarias_planilha(p_linhas jsonb, p_arquivo jsonb, p_simular boolean DEFAULT true)
RETURNS jsonb`. Nenhuma RLS existente muda.

- **Segurança:** `SECURITY DEFINER`, `search_path = public`. Exige `auth.uid()`, perfil ativo, `can_access_module(uid,
  'gabinete')` e `has_permission_code(uid, 'gabinete.portarias.importar')`; senão `42501`. `REVOKE ALL` de `PUBLIC` e
  `anon`; `EXECUTE` só para `authenticated`. De 1 a 2000 linhas (`22023`); na aplicação, `p_arquivo` precisa de nome,
  `sha256` (64 hex) e tamanho. `pg_try_advisory_xact_lock` impede duas importações de portarias ao mesmo tempo sem
  esperar: com outra em andamento a chamada falha na hora com `55P03` ("Já há uma importação de portarias em andamento;
  tente de novo em instantes").
- **Linha (contrato):** `indice`, `numero`, `data_documento`, `categoria`, `ementa`, `processo_sei`, `status`,
  `status_informado` (boolean: `false` quando o front preencheu a situação por padrão; ausente vale "status
  preenchido"), `assinado_por`, `data_assinatura`, `doe_numero`, `doe_data`, `data_vigencia_inicio`, `data_vigencia_fim`,
  `matriculas[]`, `observacoes`; datas `AAAA-MM-DD`, vazio = `null`. O servidor é identificado **só pela matrícula**
  (CPF não entra, não é lido nem devolvido).
- **Simulação por savepoint:** a RPC faz o INSERT/UPDATE real de cada linha, cada uma num bloco com `EXCEPTION`
  próprio, para os triggers de `documentos` atuarem como na tela (`documentos_portaria_validar`, índice único do
  número, regra de setor, autoria, trilha, ficha). O erro do trigger vira o erro da linha. No fim, com
  `p_simular = true` ou com qualquer erro, um `RAISE` com SQLSTATE próprio `PTI01` é capturado no bloco externo e desfaz
  tudo o que as linhas gravaram; os resultados continuam nas variáveis. Assim a simulação mostra o efeito acumulado.
- **Tudo ou nada:** na aplicação, qualquer linha com erro aborta o lote inteiro (nada gravado, `importacao_id` nulo).
- **Regras de validação:** número `NNN/AAAA` (`1/2026` vira `001/2026`; `PENDENTE` recusado; repetido no arquivo é
  erro); data da portaria obrigatória e não futura; categoria do enum `categoria_portaria`; Nº DOE e Data DOE juntos,
  data DOE não anterior à da portaria; situação aceita `aguardando_assinatura`, `assinado`, `publicado`, `vigente`
  (vazia: `publicado` se houver DOE, senão `aguardando_assinatura`; `revogado` recusada); assinada exige quem
  assinou e a data; publicada/vigente exige DOE; vigente exige início da vigência; fim não anterior ao início;
  matrícula inexistente é erro; matrícula repetida no cadastro de servidores é erro ("ambígua no cadastro"), nunca
  escolhe um servidor qualquer; até 500 matrículas por portaria.
- **Regras de inclusão e atualização:** número que não existe → `inserir` (título = ementa ou "Portaria nº X";
  `data_publicacao` = data do DOE). Número que existe (também se gravado fora do padrão, como `1/2026`) → só
  **preenche o que está vazio** (processo SEI, ementa, DOE quando a portaria já está publicada/vigente, vigência) e
  **soma servidores novos**; nunca muda categoria, status nem data, nunca remove servidor, nunca apaga. Divergência
  de situação, categoria, data ou DOE vira **aviso**, não alteração (o ciclo se avança na tela da portaria); portaria
  revogada no sistema não é alterada. O aviso de situação divergente só sai quando a linha trouxe a
  situação da planilha (`status_informado`), não quando ela foi preenchida por padrão. Sem o que preencher: `sem_alteracao`. Pendência `PENDENTE/AAAA` do mesmo
  servidor e categoria não é alterada: a simulação só avisa. Também são avisos: servidor inativo, portaria de
  pessoal sem matrícula e observações preenchidas (não colocar dado pessoal).
- **LGPD (dado do RH):** a situação funcional do servidor (exonerado, aposentado, falecido...) só aparece no aviso
  para quem tem `can_access_module(uid, 'rh')`; sem o módulo rh o aviso é "Servidor da matrícula X não está ativo".
  Pelo mesmo motivo, sem o módulo rh, `mudancas.servidores_ids` de uma portaria existente não mostra a matrícula dos
  servidores já vinculados que não vieram na planilha: aparecem contados ("N servidor(es) já vinculados").
- **Retorno:** `{ simulacao, importacao_id, totais {inserir, atualizar, sem_alteracao}, linhas [{indice, acao,
  mudancas {campo: [antes, depois]}, avisos}], erros [{indice, mensagem}] }`; servidores aparecem por matrícula em
  `mudancas`, nunca por UUID. Erro de linha traz a mensagem do Postgres só para as classes esperadas (`22xxx`,
  `23xxx`, `P0001`, `RHS01` da regra de setor, `42501`); qualquer outro SQLSTATE vira "Erro inesperado ao gravar a
  linha (código X)".
- **Log:** só a aplicação sem erro grava em `importacoes` (`tipo = 'portarias_planilha'`, `modulo = 'gabinete'`),
  com `detalhes` contendo índice, número, ação, `documento_id` e nomes dos campos alterados (sem valores pessoais).

##### Importar portarias pelo banco

Procedimento manual, operado por uma pessoa, para lotes grandes ou sem a tela. Usa a **mesma RPC** (mesmas regras,
mesmos triggers e mesmo log), por `psql` pelo túnel SSH da VPS (o Postgres não fica exposto). Não há script no repositório.

1. Com o túnel aberto, conecte-se com `psql` (host e credencial vêm do ambiente seguro do operador; nunca em arquivo
   do repositório) e carregue o CSV numa tabela temporária da sessão: `CREATE TEMP TABLE portarias_csv (...)` e
   `\copy portarias_csv FROM 'arquivo.csv' CSV HEADER`. Não use CPF; só matrícula.
2. Monte o `jsonb` no formato do contrato acima (um objeto por linha, datas `AAAA-MM-DD`, vazio = `null`,
   `matriculas` como array) com `jsonb_agg(jsonb_build_object(...))` sobre a tabela temporária, guardando em uma
   variável do `psql` (`\gset`) ou na própria tabela temporária.
3. Assuma um usuário **real** na mesma transação, simule e depois aplique:

```sql
BEGIN;
SET LOCAL role authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"<uuid do usuário>","role":"authenticated"}', true);
-- simulação (nada é gravado): confira linhas, avisos e erros
SELECT public.importar_portarias_planilha(:'linhas'::jsonb, NULL, true);
-- aplicação (tudo ou nada): p_arquivo é obrigatório e vira o log
SELECT public.importar_portarias_planilha(:'linhas'::jsonb,
  '{"nome":"portarias.csv","sha256":"<64 hex>","tamanho":<bytes>}'::jsonb, false);
COMMIT;
```

- **Sem usuário real a RPC recusa** (`auth.uid()` nulo → `42501`). O usuário assumido precisa ter o módulo
  `gabinete`, a permissão `gabinete.portarias.importar` e lotação no setor (a regra de setor dos triggers vale).
- **Não use `INSERT` direto em `documentos`:** ele fura o RBAC e a regra de setor e não gera o log em `importacoes`.
- Se a simulação trouxer `erros`, corrija o CSV e repita; só aplique com `erros` vazio. Se algo der errado antes do
  `COMMIT`, use `ROLLBACK`.

### Parâmetros e catálogos de configuração
`config_parametros_meta`, `config_parametros_valores`, `config_regras_calculo`,
`config_motivos_desligamento`, `config_situacoes_funcionais`, `config_tipos_ato`,
`config_tipos_onus`, `config_tipos_servidor`.

## Views (`v_*`)

Usadas em relatórios e transparência (muitas expõem dados agregados/sem PII):

`v_servidores_situacao`, `v_servidor_tipo_derivado`, `v_relatorio_tce_pessoal`,
`v_relatorio_patrimonio`, `v_resumo_patrimonio`, `v_patrimonio_por_unidade`,
`v_historico_bem_completo`, `v_movimentacoes_completas`,
`v_relatorio_unidades_locais`, `v_relatorio_uso_unidades`, `v_cedencias_a_vencer`,
`v_processos_resumo`, `v_instituicoes_resumo`, `v_gestores_workflow_auditoria`,
`v_sic_consulta_publica`, `v_quadro_vagas`, `v_vagas_historico` (quadro de vagas, `security_invoker`; seção
"Quadro de vagas").

## Funções / RPC

Quantidade em [ESTADO_DO_SISTEMA.md](./ESTADO_DO_SISTEMA.md).

Chamadas via `supabase.rpc(...)`. Principais grupos:

- **Permissões / acesso**: `listar_permissoes_usuario`, `has_permission`,
  `has_role`, `usuario_tem_permissao`, `usuario_tem_permissao_financeira`,
  `usuario_eh_super_admin`,
  `user_has_unit_access`, `user_context`, `get_my_modules`,
  `get_permissions_from_servidor`, `get_diagnostico_acessos`, `can_approve`,
  `log_audit`. **A partir da migração
  `supabase/migrations/20261006230500_endurece_audit_logs_e_cadastro_arbitros.sql`
  (ainda não aplicada em remoto)**, `audit_logs` é só de acréscimo: nem `anon`
  nem `authenticated` (inclusive administrador) inserem direto, alteram ou
  apagam linhas. Grava-se por `log_audit` (só usuário autenticado e service
  role; o front usa essa RPC), pelos triggers de auditoria (`SECURITY DEFINER`)
  e pela service role das Edge Functions. Antes disso, `admin_only_*` permitia
  ao administrador inserir, alterar e apagar a trilha, e `log_audit` aceitava
  chamada anônima. A RPC `log_audit` falhava em toda chamada, porque inseria
  `audit_logs.role_at_time`, coluna que a tabela nunca teve; a migração a cria.
  `list_public_tables()` passa a ser só da service role. Desde a E1 (migração 20261011000000) `log_audit` não
  aceita, no módulo `rh`, outra ação além de `view`/`export`/`download` nem antes/depois, limpa as chaves de
  trigger dos metadados e limita antes/depois/metadados a 32 KB (seção "Trilha de auditoria ... Onda E1").
- **Folha / RH**: `calcular_inss_servidor`, `calcular_irrf`, `count_dependentes_irrf`,
  `fn_calcular_ferias`, `calcular_horas_trabalhadas`, `fechar_folha`,
  `reabrir_folha` (desde a E3 recusa folha com remessa ativa), `usuario_pode_fechar_folha`, `usuario_pode_reabrir_folha`,
  `processar_folha_pagamento(p_folha_id)` (`SECURITY DEFINER`; exige `financeiro.folha.processar` e folha em
  `aberta|processando|reaberta|previa`; grava `processado_por` desde a E1), `fn_validar_margem_consignavel` (desde a
  E3 `SECURITY INVOKER`, só com o módulo `rh` e `rh.contracheques.visualizar` ou `financeiro.folha.processar`, ou para o
  próprio servidor; `42501` fora disso),
  `fn_validar_teto_remuneratorio`, `fn_atualizar_situacao_servidor`.
- **Trilha do RH (E1)**: `registrar_evento(p_acao, p_entidade, p_entidade_id, p_descricao, p_metadados)` —
  `SECURITY DEFINER`, EXECUTE só para `authenticated`, exige perfil ativo. Registra em `audit_logs` (módulo `rh`) uma
  ação sem gravação: `p_acao` em `view`, `export`, `download` (imprimir = `download`), senão `22023`; `p_entidade`
  numa lista fechada (as 79 tabelas do RH e `contracheque`, `relatorio_rh`, `exportacao_rh`, `arquivo_esocial`, <!-- numero-datado -->
  `arquivo_cnab`, `trilha_auditoria`); exige o módulo `rh` (sem ele, `42501`, salvo o próprio contracheque);
  metadados só objeto JSON de até 4000 caracteres, descrição cortada em 500.
  Usuário, servidor, origem, IP, user agent e transação vêm do banco. A E2 liga o front a ela. Funções internas
  (sem EXECUTE para a API): `trilha_contexto`, `trilha_contexto_invalidar`, `responsavel_atual`,
  `rh_exige_servidor_vinculado`, `fixar_autoria`, `trilha_mascarar`,
  `mascarar_parcial`, `trilha_contexto_requisicao`, `trilha_completar_contexto`, `trilha_imutavel`.
- **Financeiro**: `fn_gerar_numero_financeiro`, `fn_inscrever_restos_pagar`.
- **Importação**: `importar_qdd_fiplan(p_exercicio, p_linhas, p_arquivo, p_simular)` — `SECURITY DEFINER`,
  exige perfil ativo, módulo financeiro e `orcamento.importar`. Com `p_simular = true` só devolve o
  que mudaria; com `false` grava numa transação (cria programa, ação/PAOE, natureza e fonte que faltarem,
  insere/atualiza `fin_dotacoes`, nunca apaga) e registra em `importacoes`. Dotações do antigo import de
  planilha (`natureza.fonte.IDU`) são reconhecidas e migradas para a chave nova.
- **Tabelas do FIPLAN**: `importar_classificadores_fiplan(p_tipo, p_exercicio, p_linhas, p_arquivo, p_simular)` —
  `SECURITY DEFINER`, exige perfil ativo, módulo financeiro e `orcamento.importar`; simula ou aplica tudo ou nada
  (código fora do padrão ou repetido barra a aplicação) e registra em `importacoes` (seção "Tabelas do FIPLAN").
- **Empenhos do FIPLAN**: `importar_empenhos_fip614(p_exercicio, p_linhas, p_arquivo, p_data_referencia, p_simular)`
  — `SECURITY DEFINER`, exige perfil ativo, módulo financeiro e `orcamento.importar` (seção "Empenhos do FIPLAN
  (FIP 614)").
- **Importação de portarias**: `importar_portarias_planilha(p_linhas, p_arquivo, p_simular)` — `SECURITY DEFINER`,
  exige módulo `gabinete` e `gabinete.portarias.importar`; simula por savepoint e aplica tudo ou nada (seção
  "Importar portarias").
- **Quadro de vagas**: `rh_importar_quadro_vagas(p_linhas, p_gravar)` (migração `20261012150000`, em PR rascunho) —
  `SECURITY INVOKER` (RLS, autoria, trilha e regra de setor valem para cada gravação), exige
  `governanca.cargos.gerenciar` (`42501`), até 2000 linhas. Cada linha traz `cargo` e, opcionais, `sigla`, `categoria`
  (obrigatória só para cargo novo), `vencimento`, `unidade` (sigla ou nome), `quantidade` **ou** `codigo`,
  `lei_numero`, `lei_data`. Com `p_gravar = false` só simula e devolve o relatório (`cargos_criados`,
  `cargos_existentes`, `vagas_criadas`, `vagas_existentes`, `ocupantes_vinculados`, `erros`, `avisos`); com `true`
  grava tudo ou nada. Nunca apaga nem sobrescreve: cargo com mesmo nome e símbolo é reaproveitado, código existente é
  pulado, por quantidade só cria as vagas que faltam (código `<SIGLA>.001`, ou `VAGA.nnn` sem sigla) e vaga a mais
  vira aviso, não extinção. Depois liga os provimentos ativos sem vaga a vagas livres do cargo (quem sobra vira aviso de
  excesso) e atualiza `cargos.quantidade_vagas` com o número de vagas ativas. `rh_vaga_situacao(uuid)` e
  `rh_vaga_ocupante_atual(uuid)` são executáveis por `authenticated` (seção "Quadro de vagas").
- **Processos / workflow**: `fn_calcular_sla_processo`, `fn_contar_processos_por_status`, `fn_somar_dias_uteis`,
  `fn_situacao_prazo`, `wf_pode_ver_processo` e as RPCs `wf_*` (seção "Acompanhamento de processos do SEI").
  `fn_pode_arquivar_processo` foi removida.
- **Patrimônio / unidades**: `gerar_numero_tombamento`, `patrimonio_buscar_bem_por_codigo`,
  `patrimonio_decidir_movimentacao`, `patrimonio_decidir_baixa`, `gerar_protocolo_cedencia`,
  `gerar_relatorio_responsavel`, `get_hierarquia_unidade`,
  `get_subordinados_unidade`, `get_chefe_unidade_atual`.
- **LAI / transparência**: `calcular_prazo_lai`, `consultar_protocolo_sic`,
  `list_public_tables`.
- **Portal da Transparência (públicas, `anon` executa)** — migração
  `supabase/migrations/20261010200100_transparencia_rpcs_publicas.sql` (ainda não aplicada em remoto).
  `SECURITY DEFINER` + `STABLE`, `search_path` fixo; as tabelas continuam fechadas para `anon`, a função devolve só
  os campos da tela e aplica a LGPD no servidor:
  - `transparencia_execucao_orcamentaria()` — totais de `dotacoes_orcamentarias` por exercício (inicial, atual,
    empenhado, liquidado, pago, quantidade de dotações); nenhuma dotação individual.
  - `transparencia_licitacoes(p_ano, p_modalidade)` — processo, ano, modalidade, objeto, fase, valor estimado,
    abertura, unidade requisitante e vencedor PJ (razão social + CNPJ mascarado `8 dígitos****2`). Processos em
    `planejamento`, `elaboracao` ou `edital` (ou sem fase) não aparecem; o vencedor só aparece em `homologacao`,
    `adjudicacao`, `contratacao` ou `encerrado`. Vencedor pessoa física nunca é exposto (sem PJ, nome e documento
    saem `NULL`). `data_homologacao` sai `NULL` (a tabela não tem a coluna).
  - `transparencia_patrimonio()` — bem (número, descrição, marca, modelo, situação, conservação, valor e data de
    aquisição), nome/município da unidade local e nome da unidade organizacional; nunca o responsável.
  - `transparencia_cargos_publicos()` — migração `supabase/migrations/20261010234000_transparencia_cargos_publicos.sql` (ainda não
    aplicada em remoto). Quadro de cargos em comissão e funções gratificadas ativos, **uma linha por vaga**: cargo,
    símbolo (`cargos.sigla`), categoria, natureza, nível, vencimento (`vencimento_base`), lei de criação (número e
    data), unidade (nome, sigla, unidade superior e diretoria, subindo `superior_id` até a unidade de tipo
    `diretoria` ou a raiz), vagas previstas/ocupadas e o **nome do ocupante** (nome social quando houver). Vagas por
    unidade vêm de `composicao_cargos` (unidades ativas; cargo sem composição usa `cargos.quantidade_vagas` sem
    unidade); ocupante é o vínculo ativo em `vinculos_servidor` (a mesma fonte de ocupação do RH). Nunca CPF,
    matrícula, indicação, contato, endereço, dado bancário nem remuneração individual. Usada por
    `/transparencia/cargos` (`useTransparenciaCargos`). Substitui os arquivos estáticos public/data/cargos.json e cargos.csv,
    removidos porque publicavam a `indicacao` dos ocupantes (no banco, restrita a administradores); os arquivos
    continuam no histórico do git, e reescrever o histórico para apagá-los é decisão do dono do repositório.
- **Parâmetros**: `obter_parametro_vigente`, `obter_parametro_simples`,
  `fn_calcular_nivel_parametro`.
- **Reuniões**: `verificar_conflito_agenda`.
- **CMS**: `promover_rascunho`.
- **Avisos**: `pode_gerenciar_avisos`, `alcanca_modulos_alvo` (usadas pelas policies) e
  `aniversariantes_do_mes(p_mes)`, que devolve só nome e dia do aniversário de servidores ativos a
  qualquer usuário ativo (sem ano, CPF, contato ou lotação).
- **Envios**: `pode_ver_envios`, `pode_configurar_envios` (policies), `salvar_segredo_envio(canal, segredo)`
  (grava a credencial no Vault) e `config_envio_servidor(canal)` (só service role).
- **Bancário**: `get_proximo_numero_remessa` (prévia do número; desde a E3 o número vem do trigger no INSERT) e
  `cancelar_remessa(p_remessa_id, p_motivo)` (E3: cancela com motivo e autor; seção "Integridade da remessa CNAB e do
  eSocial — Onda E3").
- **Financeiro (FIPLAN e banco)**: `confirmar_alteracao_fiplan`, `importar_arquivo_bancario`,
  `conciliar_movimento_bancario`, `pode_conciliar_pagamentos`, `corrigir_conta_movimento`,
  `registrar_remessa_bancaria`, `confirmar_remessa_bancaria`, `obter_remessa_bancaria`, `cancelar_remessa_bancaria`
  e `registrar_extrato_bb` (só service role); seção "FIPLAN, arquivos bancários e extrato do BB".

## Convenções

- Nomenclatura **em português, snake_case**; prefixos por domínio (`fin_`, `cms_`,
  `config_`, `frequencia_`, `demandas_ascom_`, `matriz_raci_`).
- **RLS** ativa: o acesso por linha é decidido no banco (apoiado pelas funções de
  permissão acima). A chave anônima no client é segura porque o RLS é a fronteira.
- Tabelas `config_*` e `parametros_*` parametrizam regras de cálculo (folha,
  frequência) sem hardcode no código.
