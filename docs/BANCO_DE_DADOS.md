# Banco de Dados (Supabase / Postgres)

O schema `public` tem **231 tabelas**, **15 views** e **47 funções (RPC)**. Os
tipos TypeScript de todo o schema são gerados em
`src/integrations/supabase/types.ts` (**não editar à mão** — regenerar).

> Migrações versionadas em `supabase/migrations/*.sql` (~240 arquivos,
> `YYYYMMDDHHMMSS_<uuid>.sql`). Para mudar o schema, crie uma migração nova
> e regenere os tipos. Não edite migrações antigas.

## Baseline limpo e RLS por módulo (banco novo)

Para criar um banco **novo e vazio** use `supabase/baseline/` (guia: [NOVO_BANCO.md](./NOVO_BANCO.md);
conteúdo e manutenção: [`supabase/baseline/README.md`](../supabase/baseline/README.md)). Ele não substitui
as migrações: é um schema consolidado, gerado do replay delas, mais uma camada de correções. O que
muda em relação ao estado das migrações:

- **RLS por módulo, falha fechada.** As policies `acesso_total_*` (qualquer usuário logado) saem; cada
  tabela recebe policies de `can_access_module` conforme `supabase/baseline/rls/mapa.csv` (fonte da
  verdade, gerada em `rls/35_policies_geradas.sql`). Tabela fora do mapa reprova no teste.
- **RLS por permissão (classe `permissao` do gerador).** Leitura pelo módulo, como em `modulo` (sufixos
  `;proprio`, `;pai=<tabela>.<fk>` e `;filho=<tabela>.<fk>` acrescentam a leitura do próprio servidor, direta,
  pela tabela pai ou por uma tabela filha com `servidor_id`); escrita (INSERT/UPDATE/DELETE) exige o módulo
  **e** a permissão granular do `extra` (`escrita=<código>`), via `can_access_module` + `has_permission_code`.
  Hoje são 29 tabelas (apurado em 2026-10-11): as 10 da folha (`financeiro.folha.processar` para operar,
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
- **`anon`** só tem as 9 RPCs públicas (denúncia, dado oficial, árbitros, gestores escolares, portal da transparência) e as tabelas de formulário/portal declaradas no mapa (coluna `anon`);
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

## Tabelas por domínio

### Autenticação, RBAC e administração
`profiles`, `user_roles`, `user_modules`, `user_org_units`, `module_access_scopes`,
`module_permissions_catalog`, `module_settings`, `form_field_config`,
`audit_logs`, `audit_log_licitacoes`, `approval_requests`, `approval_delegations`,
`backup_config`, `backup_history`, `backup_integrity_checks`,
`_backup_usuario_modulos_old` (legado).

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

Segurança da folha (migração `supabase/migrations/20261010070000_onda_b_folha_rls_permissao.sql`, mesclada
na PR #63; idempotente, vale tanto para o banco do baseline quanto para o produzido só
pelas migrações):

- Policies por permissão nas 10 tabelas da folha (classe `permissao`, acima) e remoção das `acesso_total_*`
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
levantamento em [`planejamento/REVISAO_RH.md`](./planejamento/REVISAO_RH.md) §3. Escopo: as 79 tabelas com `rh` em
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
- **Autoria gravada pelo banco** — nas 77 tabelas de lançamento: colunas `created_at`, `created_by`,
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
- **Trilha (`fn_audit_trigger` v2)**, mesma assinatura `fn_audit_trigger('<módulo>')`, agora em 77 tabelas do RH
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
  `rh` (15 tabelas já auditadas antes da E1) é mascarada pela migração antes de ficar imutável.
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
  em silêncio, porque o hook engole o erro) e `backup-offsite`.
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
  e, desde a regra de setor, `zz_exigir_setor` (`BEFORE INSERT OR DELETE OR UPDATE`, por linha, `exigir_setor()`);
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
regra só roda nas 79 tabelas do RH (as do `mapa.csv` com `rh`, menos as 2 de classe `trilha`) e o RH nasce em modo
`registrar`: **nada é bloqueado**, a trilha anota quem seria.

- **Tabelas novas** (RLS e policies na mesma migração, autoria `zz_fixar_autoria` e trilha `audit_<tabela>`):
  - `setores_modulo` (módulo `app_module`, `unidade_id` → `estrutura_organizacional`, `inclui_subordinadas` padrão
    `true`, `ativo`, `observacao`; único por módulo e unidade) e `regra_lancamento` (`id` PK, `modulo` único, `modo`
    `desligado`/`registrar`/`exigir`, `observacao`): classe `catalogo_admin`. Todo usuário ativo lê, só o **papel**
    admin grava, mesmo sem servidor (premissa 1). Trilha no módulo `admin`, fora da regra.
  - `comissoes` (nome; tipo `inventario`/`licitacao`/`fiscalizacao_contrato`/`outra`; módulo; objeto opcional
    `objeto_tipo` `campanha_inventario`/`contrato`/`processo_licitatorio` + `objeto_id`, os dois ou nenhum; ato
    obrigatório `ato_tipo`, `ato_numero`, `ato_data`, mais `ato_doe_numero`/`ato_doe_data` opcionais; `data_inicio`
    obrigatória, `data_fim`; `motivo` obrigatório; `status` `ativa`/`encerrada`) e `comissoes_membros` (`comissao_id`
    com `ON DELETE CASCADE`, `servidor_id`, `papel` `presidente`/`membro`/`secretario`, período próprio opcional):
    classe `permissao`, o módulo `rh` lê e escreve com `rh.comissoes.gerenciar` (permissão nova, papéis `admin` e
    `manager`). Retirar membro é `DELETE`.
- **Carga:** `regra_lancamento` com uma linha por valor de `app_module`: `rh` = `registrar`, os demais `desligado`.
  Linha existente não muda (`ON CONFLICT DO NOTHING`), então rodar a migração de novo não desfaz a escolha do admin.
  `setores_modulo` nasce vazio: a lista de setores vem do órgão.
- **Fundamento** (`fundamento_lancamento(text[])`, interna): para o login atual (`profiles.servidor_id`, premissa 7)
  e os módulos da tabela, na data de hoje, na ordem:
  1. `lotacao`: `lotacao_vigente(servidor, data)` (lotação ativa e vigente fora de `lotacao_externa`, ou cessão de
     entrada ativa com `unidade_idjuv_id`, premissa 4) numa unidade de `setores_modulo` ativo, ou abaixo dela quando
     `inclui_subordinadas` (subida por `superior_id` com limite de 50 níveis: um ciclo na estrutura não trava a
     gravação);
  2. `designacao`: `status = 'aprovada'`, `ativo`, vigente e com ato (`ato_numero` não vazio e `ato_data`), para uma
     unidade do setor (premissa 5: soma à lotação);
  3. `comissao`: comissão `ativa` do módulo, vigente, com ato, **sem objeto**, e o membro dentro do período dele.
     Comissão com objeto ainda não vale (premissa 6 é por linha: fase 2);
  4. senão `negado_setor`; login sem servidor: `negado_sem_servidor`; sem `auth.uid()`: `sistema` (service role,
     jobs) ou `anonimo` (formulário público), sempre permitidos.
  O papel admin não tem atalho. Tabela com mais de um módulo usa o modo mais restritivo entre eles e aceita o setor
  de qualquer um (`lancamento_modulos_tabela`: folha com `rh` e `financeiro`, premissa 3; `documentos` com `rh`,
  `workflow`, `gabinete`, `governanca` e `admin`; etc.). Cache por transação em variável local, com chave usuário +
  papel da sessão + geração; o trigger `lancamento_cache_invalidar` (lotações, designações, cessões, comissões,
  membros, setores, regra, estrutura e vínculo do perfil) sobe a geração e zera o contexto da trilha.
- **Autoatendimento e chefia** (`fundamento_linha`, só quando o fundamento de setor é negado, e só em
  `solicitacoes_abono`, `solicitacoes_ajuste_ponto`, `justificativas_ponto`, `frequencia_fechamento` e
  `documentos_requerimento_servidor`; exige servidor vinculado):
  - `autoatendimento`: INSERT do pedido do próprio servidor (abono e requerimento por `servidor_id`; ajuste de ponto
    por `servidor_id = auth.uid()`; justificativa pelo dono do registro de ponto) e o UPDATE do próprio fechamento que
    só muda `assinado_servidor`/`assinado_servidor_em`;
  - `chefia`: quem tem `rh.aprovar` e **não** tem `rh.frequencia.lancar`, no UPDATE das quatro tabelas de etapa (a
    etapa já é limitada por `validar_etapa_frequencia`); em `frequencia_fechamento` só se mudar apenas
    `validado_chefia*` e `observacoes`, e no INSERT já com `validado_chefia = true`. O admin tem todos os códigos e
    nunca cai aqui. Férias e licenças não têm etapa de chefia no banco, então não há via chefia nelas. A hierarquia
    (se o aprovador chefia mesmo a unidade do servidor) não é conferida, como já não era.
- **Trigger `zz_exigir_setor`** (`BEFORE INSERT OR UPDATE OR DELETE`, por linha, nas 79 tabelas; o guard
  `check-autoria-rh.mjs` cobra): recusa só em modo `exigir`, sem fundamento de setor e sem fundamento da linha, com
  SQLSTATE **`RHS01`**, mensagem "Seu login não tem servidor vinculado: lançamento em <tabela> recusado (setor de
  <módulos>)" ou "Você não está lotado nem designado no setor de <módulos> (nem é membro de comissão vigente):
  lançamento em <tabela> recusado", `DETAIL` `via=<via>` e `HINT`. Não checa gravação feita por outro trigger
  (`pg_trigger_depth() > 1`). Roda antes de `zz_fixar_autoria`, que perdeu a checagem de vínculo da E1;
  `rh_exige_servidor_vinculado()` passa a responder "o RH está em `exigir`?".
- **Trilha:** `audit_logs.fundamento jsonb` (gravado por `fn_audit_trigger` e `registrar_evento`; nulo com a regra
  desligada ou tabela fora dela) com `permitido`, `via`, `modo`, `modulos`, `modulo`, `servidor_id`, `data`,
  `unidade_id`, `setor_unidade_id` e o registro usado (`lotacao_id` ou `cessao_id`, `designacao_id`, ou
  `comissao_id` + `comissao_membro_id` + `papel`), e `ato` = `{tipo, numero, data, doe_numero, doe_data}` (chaves
  nulas omitidas). Gravação em cascata leva `em_cascata: true` (o relatório de bloqueios deve ignorá-la). Índice
  parcial `idx_audit_logs_fundamento_negado` para "quem seria bloqueado". `org_unit_id` passa a ser a unidade do
  fundamento (designação: a de destino) ou, sem ela, a da lotação vigente (antes: `user_org_units`, que é escopo de
  acesso).
- **RPCs para o front** (só `authenticated`; as demais funções novas sem EXECUTE pela API):
  - `meus_fundamentos_lancamento()` → **linhas**, uma por módulo do enum: `modulo`, `modo`, `permitido`,
    `bloqueado` (`modo = 'exigir'` e sem fundamento de setor), `via`, `unidade_id`, `unidade_nome`, `lotacao_id`,
    `cessao_id`, `designacao_id`, `comissao_id`, `ato` (jsonb como acima). Exige usuário ativo (`42501`).
    Autoatendimento e chefia não aparecem aqui e valem mesmo com `bloqueado`.
  - `saneamento_lancamento()` → servidores ativos (`ativo` e situação fora de exonerado, aposentado, falecido e
    inativo) com problema: `servidor_id`, `nome`, `matricula`, `situacao`, `tem_login`, `login_ativo`,
    `lotacao_unidade_id`, `lotacao_unidade_nome`, `unidade_atual_id`, `unidade_atual_nome`, `problemas` (`text[]` com
    `sem_login`, `sem_lotacao`, `lotacao_divergente`). Sem CPF. Papel admin, ou módulo `rh` com
    `rh.auditoria.visualizar`; senão `42501`.
- **Desempenho** (`processar_folha_pagamento`, 2000 servidores, banco local): antes 0,95 a 1,2 s / reprocessar 1,44 a
  1,48 s; depois, em `registrar` e admin sem servidor, 0,97 a 1,04 s / 1,59 a 1,70 s; em `exigir` com o usuário
  lotado no setor, 1,09 a 1,16 s / 1,57 a 1,71 s (6004 linhas na trilha nos três).
- **Fora da fase 1:** os outros módulos (autoria, trilha e o trigger), comissão por objeto, modo `exigir` em
  qualquer módulo (migração própria, depois de um ciclo em `registrar`) e a Edge Function `enviar-convite-reuniao`.
- No baseline: `mapa.csv` → `35_policies_geradas.sql`; `regra_lancamento` nas sementes do `gerar-baseline.sh`; REVOKE e
  GRANT no `overlay/40_privilegios.sql`. Testes no bloco "Lançamento por setor (fase 1)" de
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

### Patrimônio e inventário
`bens_patrimoniais`, `movimentacoes_bem`, `movimentacoes_patrimonio`,
`historico_patrimonio`, `baixas_patrimonio`, `manutencoes_patrimonio`,
`ocorrencias_patrimonio`, `campanhas_inventario`, `coletas_inventario`,
`conciliacoes_inventario`, `patrimonio_unidade`, `campanhas_inventario_unidades`,
`fotos_vistoria_inventario`. Almoxarifado: `almoxarifados`,
`estoque`, `movimentacoes_estoque`, `categorias_material`, `itens_material`,
`requisicoes_material`, `requisicao_itens`.

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
em produção no mesmo dia**, sob a versão `20261009160000`; `types.ts` ainda não regenerado, por isso o front acessa as tabelas novas com
`supabase as any`):

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

### Processos administrativos (workflow)
`processos_administrativos`, `movimentacoes_processo`, `documentos_processo`,
`despachos`, `encaminhamentos`, `pareceres_tecnicos`, `prazos_processo`,
`acesso_processo_sigiloso`, `acoes`.

### Governança e compliance
`estrutura_organizacional`, `cargos`, `composicao_cargos`,
`cargo_unidade_compatibilidade`, `nomeacoes_chefe_unidade`,
`matriz_raci_papeis`, `matriz_raci_processos`, `matriz_raci_atribuicoes`,
`riscos_institucionais`, `avaliacoes_risco`, `planos_tratamento_risco`,
`controles_internos`, `avaliacoes_controle`, `evidencias_controle`,
`checklists_conformidade`, `itens_checklist`, `respostas_checklist`,
`decisoes_administrativas`, `debitos_tecnicos`, `publicacoes_legais`,
`dados_oficiais`, `config_institucional`.

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
navegador). O bucket `arbitros-docs` deixa de aceitar listagem anônima, mas
**continua público**: quem tem a URL de um arquivo ainda o baixa (fechar isso
exige bucket privado com URL assinada; pendência).

### Gestores escolares (JER)
`gestores_escolares`, `gestores_escolares_historico`, `escolas_jer`.

### Reuniões
`reunioes`, `participantes_reuniao`, `historico_convites_reuniao`,
`modelos_mensagem_reuniao`, `config_assinatura_reuniao`.

### Programas e documentos gerais
`programas`, `documentos`.

### Importação de dados
`importacoes` (migração `20261009153000_importacoes_e_qdd_fiplan.sql`): log de toda importação
aplicada — `tipo` do importador, `modulo` dono dos dados, nome/tamanho/SHA-256 do arquivo (o arquivo
não é guardado), `exercicio`, `resumo` (totais, cadastros criados, ausentes) e `detalhes` (antes/depois
dos campos alterados). RLS: `SELECT` para quem acessa o módulo da linha (`can_access_module`); sem
policy de escrita e sem `INSERT/UPDATE/DELETE` para `anon`/`authenticated` — só as RPCs de importação
gravam. No baseline está como `preservar` em `rls/mapa.csv`.

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
`v_sic_consulta_publica`.

## Funções / RPC (`47`)

Chamadas via `supabase.rpc(...)`. Principais grupos:

- **Permissões / acesso**: `listar_permissoes_usuario`, `has_permission`,
  `has_role`, `usuario_tem_permissao`, `usuario_tem_permissao_financeira`,
  `usuario_tem_acesso_modulo`, `usuario_tem_acesso_rota`, `usuario_eh_super_admin`,
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
  numa lista fechada (as 79 tabelas do RH e `contracheque`, `relatorio_rh`, `exportacao_rh`, `arquivo_esocial`,
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
- **Processos / workflow**: `fn_calcular_sla_processo`,
  `fn_contar_processos_por_status`, `fn_pode_arquivar_processo`.
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

## Convenções

- Nomenclatura **em português, snake_case**; prefixos por domínio (`fin_`, `cms_`,
  `config_`, `frequencia_`, `demandas_ascom_`, `matriz_raci_`).
- **RLS** ativa: o acesso por linha é decidido no banco (apoiado pelas funções de
  permissão acima). A chave anônima no client é segura porque o RLS é a fronteira.
- Tabelas `config_*` e `parametros_*` parametrizam regras de cálculo (folha,
  frequência) sem hardcode no código.
