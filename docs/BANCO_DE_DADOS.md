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
  Hoje são 25 tabelas (apurado em 2026-10-10): as 10 da folha (`financeiro.folha.processar` para operar,
  `financeiro.folha.configurar` para rubricas, parâmetros e tabelas de INSS/IRRF) — detalhe em
  [RBAC_PERMISSOES.md](./RBAC_PERMISSOES.md#folha-rls-por-permissão-onda-b--b1) —, 12 do RH na B2 (férias,
  licenças, viagens, frequência; seção "RH — frequência e ponto" abaixo) e 3 na B3 (`frequencia_pacotes`,
  `frequencia_arquivos`, `documentos_requerimento_servidor`; mesma seção). A B2 acrescentou ao gerador lista de
  códigos (`escrita=a|b`) e os sufixos `;excluir=`, `;insere_proprio`, `;sem_autoaprovacao`, `;coluna=` e
  `;posse=usuario`; a correção de contornos levou `escrita=` à classe `catalogo` e `sem_autoaprovacao` à
  `proprio_leitura` (formato no [README do baseline](../supabase/baseline/README.md)). `scripts/db/testar-rls.sql`
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
  propósito (dado bancário e CPF iriam inteiros para `audit_logs`).
- `module_permissions_catalog`: `financeiro.folha.%` passa a `module_code = 'rh'` (códigos inalterados).

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
  `list_public_tables()` passa a ser só da service role.
- **Folha / RH**: `calcular_inss_servidor`, `calcular_irrf`, `count_dependentes_irrf`,
  `fn_calcular_ferias`, `calcular_horas_trabalhadas`, `fechar_folha`,
  `reabrir_folha`, `usuario_pode_fechar_folha`, `usuario_pode_reabrir_folha`,
  `processar_folha_pagamento(p_folha_id)` (`SECURITY DEFINER`; exige `financeiro.folha.processar` e folha em
  `aberta|processando|reaberta|previa`), `fn_validar_margem_consignavel`, `fn_validar_teto_remuneratorio`,
  `fn_atualizar_situacao_servidor`.
- **Financeiro**: `fn_gerar_numero_financeiro`, `fn_inscrever_restos_pagar`.
- **Importação**: `importar_qdd_fiplan(p_exercicio, p_linhas, p_arquivo, p_simular)` — `SECURITY DEFINER`,
  exige perfil ativo, módulo financeiro e `orcamento.importar`. Com `p_simular = true` só devolve o
  que mudaria; com `false` grava numa transação (cria programa, ação/PAOE, natureza e fonte que faltarem,
  insere/atualiza `fin_dotacoes`, nunca apaga) e registra em `importacoes`. Dotações do antigo import de
  planilha (`natureza.fonte.IDU`) são reconhecidas e migradas para a chave nova.
- **Processos / workflow**: `fn_calcular_sla_processo`,
  `fn_contar_processos_por_status`, `fn_pode_arquivar_processo`.
- **Patrimônio / unidades**: `gerar_numero_tombamento`, `gerar_protocolo_cedencia`,
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
- **Parâmetros**: `obter_parametro_vigente`, `obter_parametro_simples`,
  `fn_calcular_nivel_parametro`.
- **Reuniões**: `verificar_conflito_agenda`.
- **CMS**: `promover_rascunho`.
- **Avisos**: `pode_gerenciar_avisos`, `alcanca_modulos_alvo` (usadas pelas policies) e
  `aniversariantes_do_mes(p_mes)`, que devolve só nome e dia do aniversário de servidores ativos a
  qualquer usuário ativo (sem ano, CPF, contato ou lotação).
- **Envios**: `pode_ver_envios`, `pode_configurar_envios` (policies), `salvar_segredo_envio(canal, segredo)`
  (grava a credencial no Vault) e `config_envio_servidor(canal)` (só service role).
- **Bancário**: `get_proximo_numero_remessa`.

## Convenções

- Nomenclatura **em português, snake_case**; prefixos por domínio (`fin_`, `cms_`,
  `config_`, `frequencia_`, `demandas_ascom_`, `matriz_raci_`).
- **RLS** ativa: o acesso por linha é decidido no banco (apoiado pelas funções de
  permissão acima). A chave anônima no client é segura porque o RLS é a fronteira.
- Tabelas `config_*` e `parametros_*` parametrizam regras de cálculo (folha,
  frequência) sem hardcode no código.
