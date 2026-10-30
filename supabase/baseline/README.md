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

> **Produção e histórico (14/10/2026).** A Fotografia do banco (`scripts/db/fotografia-banco.sh`, workflow manual)
> mostrou que a produção foi montada por este baseline: as correções acima valem lá. As migrações ficavam para trás;
> a `20261014120000_convergencia_baseline.sql` copia os overlays e as policies geradas para o histórico (no-op num
> banco do baseline: o `pg_dump` de public, storage e auth fica idêntico), e desde então replay e baseline têm a mesma estrutura.
> **Ao mudar um overlay ou o `mapa.csv`, crie também uma migração com a mesma mudança**; a seção "baseline ×
> migrações" do relatório da fotografia deve continuar sem diferença.
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
| 2 | `schema/02_dados_catalogo.sql` | 24 tabelas de catálogo/parâmetros (972 linhas; `bancos_cnab` (lista de bancos, migração `20261025090000`); `processo_modelos`, `processo_modelo_etapas` e `processo_modelo_checklist` (modelos de fluxo do workflow, migração `20261013100000`); `audit_colunas_sensiveis` entrou na E1, `rh.contracheques.visualizar` e seus 2 papéis na E3; `regra_lancamento` (um modo por módulo: `rh` em `registrar`, os demais `desligado`), `rh.comissoes.gerenciar` e o papel `admin` na regra de setor, migração `20261011020000`, que tira o `manager`) | **gerado** |
| 3 | `schema/03_post_data.sql` | constraints, índices, triggers, RLS ligado, policies do replay | **gerado** |
| 4 | `overlay/10_funcoes_acesso.sql` | `is_admin_user`, `is_admin_atual`, `has_permission_code`, `meu_servidor_id` exigem perfil **ativo**; fim dos stubs “acesso total”; alias `usuario_eh_admin`; `eh_meu_servidor(uuid)` (B2: "este servidor é o do usuário?", por vínculo ou, sem vínculo, por CPF); `eh_meu_arquivo_frequencia(text)` e `eh_minha_pasta_servidor(text)` (B3: o objeto do storage é do servidor do usuário?) | à mão |
| 5 | `overlay/12_protecao_profiles.sql` | trigger: quem não é admin não muda `is_active`, `servidor_id`, bloqueio, tipo, CPF, e-mail; policies de `profiles` sem duplicatas | à mão |
| 6 | `overlay/15_novo_usuario.sql` | `handle_new_user` (antes quebrava o cadastro) + trigger em `auth.users` | à mão |
| 7 | `overlay/18_funcoes_rpc.sql` | `fn_gerar_numero_financeiro` com lista fechada (injeção de SQL); RPCs de leitura com dado pessoal viram `SECURITY INVOKER`; `obter_parametro_*` não vazam valor individual; `sync_usuario_servidor_status` não reativa administrador; trigger de fechamento de folha; correção da auditoria de folha/parâmetros (`entity_id` uuid); `log_audit` recusa usuário inativo e, desde a E1, não forja a trilha do RH (mesmo texto da migração `20261011000000`; desde a E2, `20261011000200`, também recusa `entity_type` `storage.*` e tira `servidor_alvo_id` dos metadados); `fechar_folha`/`reabrir_folha` gravam no módulo `rh` desde a E2 (`20261011000300`); `reabrir_folha` trava a folha, recusa folha com remessa ativa e tira da vigência os eventos do eSocial rascunho desde a E3 (`20261011010000`, mesmo texto); `registrar_transicao_folha` grava `fechado_por`/`conferido_por` pelo banco (E1, mesmo texto da migração `20261011000000`); `log_audit` grava em `org_unit_id` a unidade da lotação vigente do servidor do login, não mais `user_org_units` (regra de setor, `20261011020000`, mesmo texto); P12 (`20261017090000`, mesmo texto): as RPCs públicas de gestores escolares consomem o limite por IP (`limite_publico_consumir`, erro `PT429`), `consultar_gestor_por_cpf` devolve só a situação e o nome da escola e `registrar_gestor_publico` devolve a duplicidade como `{erro}` neutro (o resto do P12, como as funções de permissão, chega pelo schema regenerado) | à mão |
| 8 | `overlay/20_campos_iniciais.sql` | triggers: formulários públicos e pedidos do servidor não escolhem `status`, aprovação, autoria (nos pedidos do RH a isenção é por permissão, formato `perm:`, e nunca no próprio pedido); links do formulário de árbitros só do próprio bucket; P12 (`20261017090000`, mesmo texto): `gestores_escolares` sem a policy `insercao_publica_gestores` (o cadastro público é só pela RPC) | à mão |
| 9 | `overlay/30_remover_acesso_total.sql` | apaga as policies `acesso_total_*` e a tabela morta `_backup_usuario_modulos_old` | à mão |
| 10 | `rls/35_policies_geradas.sql` | policies por módulo, **falha fechada** | **gerado** de `rls/mapa.csv` |
| 11 | `overlay/40_privilegios.sql` | `anon` só com as exceções públicas; sem EXECUTE para PUBLIC em função nova; sem TRUNCATE/TRIGGER; `audit_logs` só-acréscimo; RPCs que escrevem fechadas; funções da E1 (autoria e trilha) sem EXECUTE pela API, exceto `registrar_evento` para `authenticated`; `trilha_storage` e `trilha_storage_chave` (E2) sem EXECUTE pela API; `exigir_folha_fechada` e `remessa_integridade` (E3) sem EXECUTE pela API e `cancelar_remessa` só para `authenticated`; regra de setor (`20261011020000`): `lotacao_vigente`, `unidade_e_superiores`, `lancamento_modulos_tabela`, `fundamento_*`, `lancamento_cache_invalidar`, `data_local`, `exigir_setor`, `exigir_setor_fim`, `regra_lancamento_proteger_exigir` e `comissoes_membros_validar` sem EXECUTE pela API, `meus_fundamentos_lancamento(app_module[])` e `saneamento_lancamento` só para `authenticated`; RH de 2026-10-12 (migrações `20261012090000` a `20261012140000`): funções de apoio e de trigger sem EXECUTE pela API e só as 4 RPCs do pré-cadastro público para `anon`; quadro de vagas (`20261012150000`): `rh_provimento_vaga` e `rh_vagas_cargo_validar` sem EXECUTE pela API; workflow (`20261013100000` a `20261013100200`): `anon` sem nada nas tabelas de modelo e nas respostas do checklist, `wf_pode_ver_processo` e `fn_somar_dias_uteis` só para `authenticated`, funções internas (`wf_resolver_unidade`, `wf_travar_processo` e afins) sem EXECUTE pela API, RPCs do acompanhamento só para `authenticated`; P12 (`20261017090000`): `anon` sem INSERT em `gestores_escolares`, `limite_requisicoes_publicas` sem privilégio para `anon`/`authenticated` e `limite_publico_consumir`/`limite_publico_insercao` sem EXECUTE pela API; folha (`20261019200000`): `calcular_irrf_mensal` sem EXECUTE pela API; atos remuneratórios (`20261020100000`): triggers dos atos e de `cargos` sem EXECUTE pela API, `aplicar_ato_remuneratorio` e `vencimento_cargo_em` só para `authenticated`; retorno da remessa (`20261021090000`): `registrar_retorno_remessa` só para `authenticated`; importação da folha do SIGRH (`20261022090000`): `importar_folha_sigrh` só para `authenticated` | à mão |
| 12 | `overlay/50_storage.sql` | buckets (com limite de tamanho/tipo no de árbitros, no privado `inventario-evidencias` e, desde a B3, no privado `documentos-requerimento`) e policies de storage por módulo; `frequencias` e `documentos-requerimento` (B3) gravam com módulo e código e o servidor lê o próprio arquivo; triggers `trilha_rh_storage_*` (E2) gravam na trilha a gravação, troca e exclusão de arquivo nesses dois buckets; bucket privado `remessas-cnab` (E3: ler e enviar `<remessa_id>.rem` com o módulo `rh` e `financeiro.folha.processar`, sem UPDATE/DELETE) | à mão |

`lacunas/` guarda a migração que cobre as tabelas usadas e nunca criadas; ela só serve ao replay
(`scripts/db/validar-migracoes.sh`) que alimenta os itens 1–3. O baseline não a aplica.
`bootstrap-admin.sql` cria o primeiro administrador (não faz parte do `aplicar.sh`). `dados-teste.sql` enche um banco
de **teste** com dados fictícios (fora do `aplicar.sh`; recusa banco que já tenha servidor, fornecedor ou bem; `scripts/db/montar-ambiente-teste.sh` monta o
banco de teste inteiro pelo container). `dados-demo/` completa esse banco com uma demonstração de todos os módulos
com cara de real (`scripts/db/carregar-demo-teste.sh`); guia de ambos em
[`docs/NOVO_BANCO.md` §9](../../docs/NOVO_BANCO.md#9-ambiente-de-teste-com-dados-fictícios).

Arquivos **gerados** não se editam à mão. Dados antes das constraints/triggers é proposital: o
INSERT não dispara auditoria e as FKs são validadas depois, contra os dados semeados.

## Modelo de RLS (`rls/mapa.csv`)

O mapa tabela → classe/módulo é a **fonte da verdade** e deve ser lido por quem conhece o negócio.
Classes (detalhe no cabeçalho de `scripts/db/gerar-rls.mjs`; contagens apuradas em 2026-10-13, 256 tabelas):

| Classe | Tabelas | Regra |
|---|---|---|
| `modulo` | 155 | módulo(s) do mapa leem e escrevem; admin (papel) também. `extra` aceita `excluir=<código>\|admin\|ninguem` (DELETE com o código, só do admin ou de ninguém pela API), `altera=<código>` (UPDATE com o código) e `coletor=<módulo>:<ops>` (app de campo só com as operações listadas; ver "Outras classes") |
| `permissao` | 36 | módulo lê (com `;proprio`/`;pai=` o servidor lê o seu, como `proprio_leitura`/`proprio_filho`; com `;filho=<tabela>.<fk>` lê a linha que tem uma filha sua — a folha em que tem ficha); **escreve só quem tem o módulo E a permissão granular** do `extra` (via `can_access_module` + `has_permission_code`; admin passa). Hoje: as 10 tabelas da folha (B1, `financeiro.folha.processar\|configurar`; migração `20261010070000_onda_b_folha_rls_permissao.sql`) e 12 do RH (B2: férias, licenças, viagens, ponto, frequência, abono, ajuste, justificativa, fechamento, configuração do fechamento, banco de horas e lançamentos; migração `20261010090000_onda_b_rh_permissoes.sql`) e 3 do RH na B3 (`frequencia_pacotes`, `frequencia_arquivos` e `documentos_requerimento_servidor`; migração `20261010210000_onda_b_rh_storage.sql`). Na E3 (migração `20261011010100_rh_contracheques_leitura.sql`) entraram `eventos_esocial`, `remessas_bancarias` (as duas com `excluir=ninguem`), `pensoes_alimenticias` e `itens_retorno_bancario`, e `;leitura=` passou a valer em fichas, itens, lançamentos, consignações, pensões, retorno e eSocial. Na regra de setor (migração `20261011020000_lancamento_por_setor.sql`) entraram `comissoes` e `comissoes_membros` (`escrita=rh.comissoes.gerenciar`). As migrações carregam o mesmo SQL gerado |
| `trilha` | 10 | módulo lê; **ninguém escreve por API** (auditoria e históricos gravados por trigger). `audit_log_licitacoes` usa `extra=sigilo_workflow`: a linha copiada de uma tabela do processo do workflow só aparece com `wf_pode_ver_processo` ou para o papel admin (migração `20261015100000`, testes "wf trilha" no bloco "Workflow: acompanhamento do SEI" de `scripts/db/testar-rls.sql`). Com `extra=leitura=<código>[\|<código>...]` o módulo só lê com um dos códigos (`passagem_historico`, migração `20261031090000`) |
| `proprio_leitura` / `proprio` / `proprio_filho` | 8 / 0 / 0 | módulo + o próprio servidor lê; em `proprio*` o servidor também cria o próprio pedido (status/aprovação forçados pelo overlay 20). Desde a B2, `servidores` (posse pela coluna `id`, DELETE com `rh.servidores.excluir`, e nos contornos `sem_autoaprovacao`: ninguém grava a própria ficha), `vinculos_servidor` e `lotacoes` estão aqui; as tabelas do RH que estavam em `proprio`/`proprio_filho` passaram a `permissao` (a última, `documentos_requerimento_servidor`, na B3). As classes `proprio` e `proprio_filho` continuam no gerador, sem tabela |
| `catalogo` | 8 | qualquer usuário ativo lê; escrita por módulo, ou com `escrita=<código>` também pelo código (`tipos_abono`: `rh.frequencia.configurar`, nos contornos). `cargos` entrou na B2; `vagas_cargo` (quadro de vagas, módulos `rh\|governanca`, `escrita=governanca.cargos.gerenciar`) na migração `20261012150000` |
| `catalogo_admin` | 7 | qualquer usuário ativo lê (o app lê no login); só o papel admin escreve. `audit_colunas_sensiveis` (catálogo da máscara da trilha) entrou na E1; `setores_modulo` e `regra_lancamento` (configuração da regra de setor, premissa 1: o admin sem servidor configura) na migração `20261011020000` (`regra_lancamento` com `excluir=ninguem`: sem policy de DELETE, nem para o admin); `dados_oficiais` saiu para `publico_admin` (migração `20261011023500`) |
| `proprio_user` | 4 | cada usuário lê as suas linhas (`user_roles`, `user_modules`, `user_permissions`, `user_org_units`); só admin escreve |
| `admin` / `admin_leitura` | 8 / 1 | só o papel admin (a segunda: lê, ninguém escreve — `audit_logs`; desde a E1 imutável por trigger e com a policy extra `audit_logs_rh_auditoria_select` da migração `20261011000100`, fora do gerador: módulo `rh` e `rh.auditoria.visualizar` leem as linhas do RH) |
| `publico_admin` | 4 | `anon` e logados leem (portal público); só admin escreve. `dados_oficiais` (configuração do cliente) entrou em 2026-10-11 (migração `20261011023500`) |
| `preservar` | 22 | `denuncias` e `profiles`: policies próprias (`has_permission_code`; overlay 12); `fotos_vistoria_inventario`, `avisos`, `avisos_leituras`, `datas_importantes`, `importacoes`, `config_envio` e `envios_log`: policies das próprias migrações, que chegam pelo replay em `schema/03_post_data.sql` (as notas do `mapa.csv` ainda dizem "próxima regeneração"; o schema foi regenerado em 2026-10-10 e já as contém). `fin_movimentos_bancarios`, `fin_remessas_bancarias` e `fin_extrato_lancamentos` (migrações `20261011100100` a `20261011100300`): só SELECT pelo módulo financeiro, escrita pelas RPCs (e pela service role no extrato); privilégios no overlay 40 e testes no bloco "Financeiro: FIPLAN" de `scripts/db/testar-rls.sql`. `fin_classificadores_fiplan` (migração `20261019100000`): idem, escrita só por `importar_classificadores_fiplan`; testes no bloco "Financeiro: tabelas do FIPLAN". `fin_empenho_documentos_fiplan` (migração `20261027090000`): idem, escrita só por `importar_empenhos_fip614`; testes no bloco "Financeiro: empenhos do FIPLAN (FIP 614)". Workflow (migrações `20261013100100` e `20261013100200`): `processos_administrativos`, `movimentacoes_processo`, `documentos_processo`, `prazos_processo`, `despachos` e `processo_checklist_respostas` leem por `wf_pode_ver_processo` (sigilo) e a escrita é das RPCs; testes no bloco "Workflow: acompanhamento do SEI". Compras (migração `20261030090000`): `fin_peds` (só SELECT pelo módulo financeiro; grava `importar_peds_fiplan`) e `processo_reservas` (SELECT por quem vê processos ou tem o módulo financeiro; grava `processo_reserva_salvar`/`processo_reserva_cancelar`); testes no bloco "Compras: reservas e PEDs" |
| `fechada` | 1 | nada é gerado: RLS ligado e sem policy, negado a todos pela API (a service role ignora a RLS). Hoje só `limite_requisicoes_publicas` (P12, migração `20261017090000`), gravada por `limite_publico_consumir` (`SECURITY DEFINER`) |

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
| `;excluir=ninguem` | sem policy de DELETE: ninguém apaga pela API, nem o admin (o privilégio `DELETE` sai no overlay `40` e na migração) |
| `;leitura=a\|b` | a leitura pelo módulo exige também um dos códigos: `((<módulos>) AND (hp(a) OR hp(b))) OR <posse>`; a posse continua sem código. na E3, `leitura=rh.contracheques.visualizar\|financeiro.folha.processar` em `fichas_financeiras`, `itens_ficha_financeira`, `lancamentos_folha`, `consignacoes`, `pensoes_alimenticias`, `itens_retorno_bancario` e `eventos_esocial` |
| `;insere_proprio` | o servidor também insere a linha que é dele (pedido); exige `;proprio` ou `;pai=` |
| `;sem_autoaprovacao` | INSERT/UPDATE/DELETE pelo caminho da permissão (e o DELETE de `;excluir=<código>`) exigem que a linha **não** seja do usuário logado: `is_admin_user(auth.uid()) OR NOT eh_meu_servidor(<posse>)`. `eh_meu_servidor` confere o vínculo do perfil ou, sem vínculo, o CPF; o papel admin passa. Exige `;proprio` ou `;pai=` |
| `;coletor=<módulo>:<ops>` | o módulo do app de campo recebe só as operações listadas (`select\|insert\|update`), sem código; ex.: `unidades_locais` (`escrita=unidades.gerenciar;coletor=patrimonio_mobile:select`) |
| `;posse=usuario` | a coluna de posse (ou o `servidor_id` do pai, com `;pai=`) guarda o id do **usuário** (FK para `profiles(id)`): leitura e inserção próprias usam `<col> = auth.uid() AND is_active_user()`, e `;sem_autoaprovacao` usa `<posse> IS DISTINCT FROM auth.uid()`. Exige `;proprio` ou `;pai=`; `testar-rls.sql` confere que toda coluna de posse com FK para `profiles` o declara |

`;proprio`, `;pai=` e `;filho=` são excludentes (no máximo uma posse).

Outras classes:

- `proprio_leitura`: aceita `coluna=<col>`, `excluir=<código>|admin|ninguem` e `sem_autoaprovacao` (este, dos
  contornos: INSERT/UPDATE/DELETE pelo módulo exigem ainda `is_admin_user(auth.uid()) OR NOT
  eh_meu_servidor(<col>)`). `servidores` usa `coluna=id;excluir=rh.servidores.excluir;sem_autoaprovacao`.
- `modulo`: aceita `excluir=<código>|admin|ninguem`, `altera=<código>[|<código>...]` (o UPDATE exige o módulo **e** um
  dos códigos; SELECT, INSERT e DELETE seguem por módulo) e `coletor=<módulo>:<ops>` (P14 entrega 4, migração
  `20261023100000`). `bens_patrimoniais` usa `altera=patrimonio.editar;excluir=admin;coletor=patrimonio_mobile:select|insert`.
- `coletor=<módulo>:<ops>` (classes `modulo` e `permissao`): dá ao módulo de um app de campo **só** as operações listadas
  (`select`, `insert` e `update`, separadas por `|`; DELETE nunca), por OU nas policies dessas operações e sem código de
  permissão. O módulo do coletor não pode estar na coluna `modulos` (lá teria tudo). É assim que o app de coleta do
  patrimônio (`patrimonio_mobile`) lê e cadastra bens e coletas (e, fora do app de campo, o Financeiro lê, cadastra e
  edita `fornecedores` com `coletor=financeiro:select|insert|update`, migração `20261025090000`), só pede baixa e movimentação, muda a situação da unidade na
  vistoria e só lê unidades e campanhas; as demais tabelas do patrimônio são só do módulo `patrimonio`. `testar-rls.sql`
  confere cada operação com a persona `mod_<módulo>` (as listadas passam, as outras são negadas).
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

Os dois comandos rodam no CI em todo PR que muda `supabase/migrations/`, `supabase/baseline/` ou estes scripts
(workflow **Banco do zero e RLS**, `.github/workflows/banco-rls.yml`, com `EXIGIR_REPLAY=1`). Migração nova sem
o schema regenerado (seção "Regenerar o schema") reprova no passo 5; tabela nova fora do `rls/mapa.csv` reprova no
teste de RLS ("tabela fora de rls/mapa.csv (decida o módulo dono)"). Se o catálogo não mudou, dá para descartar a
regeneração de `schema/02_dados_catalogo.sql` (`git checkout` do arquivo): o passo 5 compara só a estrutura.

`scripts/db/fotografia-banco.sh` faz uma comparação mais ampla e legível (relatório em markdown) entre o replay,
o baseline e, com `FOTO_PROD_URL`, o banco de produção: diz quais correções do baseline ainda não viraram migração
e o que a produção tem de diferente das migrações. Na produção roda pelo workflow manual **Fotografia do banco**
(`docs/DESENVOLVIMENTO.md`).

`scripts/db/gerar-tipos.sh` gera `src/integrations/supabase/types.ts` do mesmo replay das migrações (não do
baseline); `--checar` só compara e é o que o workflow **Tipos do banco** roda (`docs/BANCO_DE_DADOS.md`).

`validar-baseline.sh` recria um banco vazio com o shim do Supabase (`scripts/db/shim-supabase.sql`),
aplica o baseline, confirma que uma segunda aplicação é recusada e que só as 23 tabelas de catálogo têm linhas, roda
`scripts/db/testar-rls.sh` e, com `PG_REPLAY`, compara schema, privilégios e storage com o replay das
migrações, sem reaplicar os overlays (desde a `20261014120000` o replay já os traz; overlay ou `mapa.csv` mudado sem
migração reprova aqui). O teste de RLS cobre, com personas reais (`SET ROLE` + claims do JWT):

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
  CPF, RG, nascimento, CID e do payload do eSocial; máscara reaplicada sem mudança; tabela sem `id`; IP de
  `x-real-ip` ou do último item de `x-forwarded-for` e user agent; `registrar_evento` (listas fechadas,
  `22023`/`42501`, módulo `rh` exigido, só o próprio contracheque sem ele); `log_audit` sem create/update nem
  antes/depois no módulo `rh`, sem chaves de trigger nos metadados e com limite de 32 KB; decisão não apagada nem
  redatada pela API; `aprovado = true` no ponto grava o aprovador; `enviado_por`/`data_envio` do eSocial;
  `fechado_por`, `processado_por` e `data_processamento` da folha; `sequencia` ordena a trilha; cache do contexto
  relido depois do vínculo do perfil; `audit_logs`, `folha_historico_status` e `rubricas_historico` imutáveis para
  `postgres`, service role e superusuário em réplica (só o GUC de expurgo e a cascata do pai passam; linha com FK
  nula não); admin sem atalho na autoria da etapa; leitura com `rh.auditoria.visualizar`, que nenhum papel recebe;
  trilha de `profiles`; toda tabela do RH com `zz_fixar_autoria` (BEFORE INSERT OR UPDATE, último BEFORE) e
  `audit_<tabela>` (AFTER INSERT OR UPDATE OR DELETE, `'rh'`) ligados, e nas de trilha a imutabilidade também em
  TRUNCATE; privilégios das funções novas;
- consulta e trilha do Storage do RH (E2, bloco "RH: consulta e trilha do Storage" de `testar-rls.sql`): os quatro
  índices de `audit_logs` e os três antigos removidos; gravar, trocar, mover e apagar objeto em `frequencias` e
  `documentos-requerimento` grava linha (`upload`/`update`/`delete`, módulo `rh`, usuário, servidor, origem, IP e
  user agent); só carimbo não grava; outro bucket e gravação negada pela RLS não gravam; service role vira origem
  `sistema`; caminho com nome do servidor só pelo hash, caminho de uuid em claro, servidor dono do arquivo; nada de
  nome, `user_metadata` nem antes/depois na trilha; leitura só com `rh.auditoria.visualizar`; função fora da API;
  extensão de lista fechada e Content-Type só `tipo/subtipo`; `log_audit` recusa `storage.*` e as duas RPCs tiram
  `servidor_alvo_id`/`fonte` do cliente; coluna `alvos` (GIN) com `s:`/`f:` nas linhas do recorte; `fechar_folha` e
  `reabrir_folha` no módulo `rh`;
- integridade de CNAB e eSocial (E3, bloco "RH: integridade de CNAB e eSocial (Onda E3)" de `testar-rls.sql`, triggers
  ligados): remessa e evento recusados com folha aberta (`RHE01`, também para o admin e ao trocar a folha do evento);
  número da remessa do cliente ignorado, seguindo o maior da conta (inclusive remessa antiga) e sem repetir (índice
  único também com os triggers desligados); valor e quantidade calculados das fichas (o do cliente sobrescrito); folha,
  conta, número, valor e quantidade fixos (`RHE02`); uma remessa ativa por folha e conta (`23505`; depois de cancelar,
  outra entra); prévia do número só com o módulo `rh`; caminho e sha256 do arquivo juntos, uma vez, só com
  `financeiro.folha.processar`, por quem gerou a remessa e com o objeto enviado por ele (`42501`/`22023`/`P0002`/`RHE02`,
  inclusive para o admin) e a sequência do front (INSERT → envio → UPDATE pelo mesmo usuário); `reabrir_folha` recusa
  folha com remessa ativa e marca os eventos rascunho como `erro` (o transmitido fica); cancelamento só por
  `cancelar_remessa` (motivo e permissão exigidos, autor, data e trilha gravados; `RHE03` fora dela, em remessa já
  cancelada ou processada; cancelada não muda mais); evento repetido na mesma folha e servidor recusado (`23505`, fora
  `erro`); `enviado`/`aceito` sem recibo e S-1200/S-1210/S-1299 sem folha ou servidor recusados (`23514`) e coluna
  `rascunho`; bucket `remessas-cnab` privado (anon, módulo sem o código, servidor e admin bloqueado não leem nem enviam;
  envio só de `<id>.rem` de remessa do próprio usuário, `gerada` há menos de 1 hora e sem arquivo; ninguém troca nem
  apaga; só as duas policies do bucket, também contra `bucket_id <> outro`); funções de trigger fora da API;
- leitura dos contracheques e fim do DELETE (E3, migração `20261011010100`, bloco "RH: leitura dos contracheques e
  fim do DELETE (Onda E3, 0100)"): catálogo de `rh.contracheques.visualizar` (`action_type` diferente de `visualizar`,
  só admin e manager) e a premissa (o papel `user` com o módulo `rh` tem `financeiro.folha.visualizar`); fichas e itens
  lidos por quem tem o código, `processar` ou o papel admin, e só o próprio pelo servidor; o papel `user` e o módulo
  sem código leem 0, também em lançamentos, consignações, pensões, itens do retorno e eSocial (quem só lê não altera);
  só o módulo não insere evento do eSocial; `fn_validar_margem_consignavel` como o usuário e com a mesma regra;
  remessa lida pelo módulo e inserida ou alterada só com `processar`; DELETE em remessas e eventos recusado (`42501`) até para o admin, sem policy nem privilégio. Nos
  blocos por tabela, `;leitura=` mede persona por código de leitura (lê; a avulsa não; só leitura não insere) e
  `excluir=ninguem` espera DELETE negado a todos;
- importação de portarias (migração `20261015120000`, bloco "Gabinete: importação de portarias" de `testar-rls.sql`):
  `importar_portarias_planilha` recusa (`42501`) quem tem o módulo `gabinete` sem `gabinete.portarias.importar`, a
  permissão sem o módulo e a sessão sem usuário; `anon`/`PUBLIC` sem EXECUTE; lista vazia e dados do arquivo inválidos
  na aplicação (`22023`); permissão no catálogo em `schema/02_dados_catalogo.sql`;
- tabelas do FIPLAN (migração `20261019100000`, bloco "Financeiro: tabelas do FIPLAN" de `testar-rls.sql`):
  `importar_classificadores_fiplan` recusa (`42501`) sem `orcamento.importar`, sem o módulo financeiro e sem sessão;
  tabela desconhecida e lista vazia (`22023`); simulação não grava; aplicação grava, registra e corrige nomes de fonte,
  programa e natureza; código repetido ou fora do padrão não grava nada; INSERT/UPDATE direto pela API não passa;
- vetores comuns com o hrms_brasil (bloco "FOLHA: vetores comuns", `scripts/db/casos-folha.json`, que
  `testar-rls.sh` passa como `-v casos_folha`): cada caso de INSS (com e sem o truncamento por faixa) e de IRRF dá o
  valor esperado em `calcular_inss_servidor` e `calcular_irrf_mensal`; férias da CLT e 13º ficam listados como fora
  do porte; sem o arquivo, o teste reprova;
- empenhos do FIPLAN (migração `20261027090000`, bloco "Financeiro: empenhos do FIPLAN (FIP 614)" de `testar-rls.sql`):
  `importar_empenhos_fip614` recusa (`42501`) sem `financeiro.execucao.importar`, sem o módulo financeiro e sem sessão;
  simulação não grava; aplicação grava empenho e histórico sem somar na dotação; dotação ambígua fica nula com aviso
  e a escolha manual se mantém na reimportação; `origem` não muda; número de empenho do sistema não é sobrescrito;
  INSERT/UPDATE direto no histórico pela API não passa;
- importação da folha do SIGRH (migrações `20261022090000` e `20261022100000`, bloco "FOLHA: importação da folha do SIGRH" de
  `testar-rls.sql`): anon e PUBLIC sem EXECUTE; quem processa a folha sem poder fechá-la recusa (`42501`); competência
  futura, mês corrente e lista vazia (`22023`); simulação não grava e avisa servidor sem provimento e falta das
  alíquotas patronais; provento de rubrica que não incide INSS fora da base; CPF desconhecido é erro da linha,
  sem gravar nem devolver o CPF; aplicação cria a folha fechada com fichas, itens e totais e o log sem CPF; competência
  que já tem folha mensal recusada (`23505`);
- parte patronal e INSS por faixa da folha (migração `20261021100000`, bloco "FOLHA: parte patronal e INSS por faixa"
  de `testar-rls.sql`): INSS truncado por faixa só com `inss_truncar_por_faixa` e na vigência; alíquota em % e opção
  fora de 0/1 recusadas (CHECK `parametros_folha_encargos_check`); folha sem alíquotas processa com patronal zero e
  avisa; INSS patronal e RAT por ficha só de quem contribui para o regime geral; totais da folha truncados como a guia;
- inventário de campo: `fotos_vistoria_inventario` (INSERT só em nome próprio, UPDATE só do autor ou com
  `patrimonio.tramitar`, DELETE só com `patrimonio.tramitar`, campos de prova imutáveis), no bloco de
  cobertura adicional de `testar-rls.sql`;
- quadro de vagas (migração `20261012150000`): `vagas_cargo` entra nos blocos por tabela da classe `catalogo`, com
  semente de código em maiúsculas (exigido pelo CHECK `vagas_cargo_codigo_check`);
- identidade: auto-ativação, troca de `servidor_id`, auto-promoção, admin bloqueado, `handle_new_user`;
- RPCs: injeção de SQL, `SECURITY DEFINER` sem checagem fora de lista revisada (desde 2026-10-12 a lista inclui as 4
  RPCs do pré-cadastro público e `frequencia_competencia_travada`), privilégios padrão, `anon` executando exatamente
  14 funções, campos que o autor não pode escolher nos formulários.

A migração `20261023090000_registro_sei_termo_cessao_designacao.sql` (ciclo do SEI no termo de cessão e na designação
de chefia) entrou em `schema/01_pre_data.sql` só com os trechos do dump: `termos_cessao.processo_sei`, `doe_numero`,
`doe_data` e `numero_termo` sem `NOT NULL`; `nomeacoes_chefe_unidade.processo_sei`, `ato_data_assinatura` e
`ato_numero`/`ato_data_publicacao` sem `NOT NULL`, com os `COMMENT ON COLUMN`. RLS e `rls/mapa.csv` sem mudança.

A migração `20261108090000_fin_emendas.sql` (emendas parlamentares) entrou no schema regenerado (`01_pre_data.sql` e
`03_post_data.sql`; o `02_dados_catalogo.sql` não muda) e no `rls/mapa.csv` (`fin_emendas` na classe `permissao`,
`escrita=orcamento.criar`); semente de `fin_emendas` em `seed_ov` de `scripts/db/testar-rls.sql`.
A migração `20261030090000_compras_processos_reservas_peds.sql` (processos de contratação, entrega 2) entrou no
schema regenerado (`01_pre_data.sql` e `03_post_data.sql`), no `rls/mapa.csv` (`fin_peds` e `processo_reservas` na
classe `preservar`, com as policies da própria migração) e no `overlay/40_privilegios.sql`; o catálogo não muda.
Testes no bloco "Compras: reservas e PEDs" de `scripts/db/testar-rls.sql`.

A migração `20261110120000_passagens_gabinete.sql` (passagens aéreas no Gabinete) entrou no `rls/mapa.csv` (as dez
tabelas `passagem_*` com os módulos `gabinete|contratos`; `rls/35_policies_geradas.sql` regenerado), no schema
regenerado (`01_pre_data.sql`: as RPCs estreitas e a nova `passagem_contratos_agencia`; `03_post_data.sql`: policies do
replay), no `overlay/40_privilegios.sql` (`EXECUTE` da RPC nova), no `overlay/50_storage.sql` (bucket `passagens`) e,
à mão, no `02_dados_catalogo.sql` (`module_code` das três permissões das passagens passa a `gabinete`; o resto da
regeneração do catálogo só trocava ids e datas e foi descartado).

A migração `20261109090000_importacao_permissao_execucao.sql` (importações por setor, entrega 2) entrou à mão no
`01_pre_data.sql` (checagem e comentário de `importar_empenhos_fip614` e `importar_peds_fiplan` passam de
`orcamento.importar` para `financeiro.execucao.importar`) e no `02_dados_catalogo.sql` (linha nova de
`financeiro.execucao.importar` e rótulo de `orcamento.importar`); RLS, `rls/mapa.csv` e privilégios sem mudança. Testes
nos blocos do FIP 614 e dos PEDs de `scripts/db/testar-rls.sql`.

A migração `20261113090000_fin_diarias_fiplan.sql` (diárias do FIPLAN, FIP 002) entrou no schema regenerado
(`01_pre_data.sql` e `03_post_data.sql`), no `02_dados_catalogo.sql` (só o rótulo de `financeiro.execucao.importar`,
editado à mão para não trocar os ids e datas das outras linhas), no `rls/mapa.csv` (`fin_diarias_fiplan` na classe
`preservar`, policy na migração) e no `overlay/40_privilegios.sql` (tabela só leitura; `importar_diarias_fiplan` e
`fin_nome_comparavel` só para `authenticated`). Testes no bloco "Financeiro: diárias do FIPLAN" de
`scripts/db/testar-rls.sql`, com semente de `fin_diarias_fiplan` em `seed_ov`.

A migração `20261112090000_fin_tg_mudancas.sql` (histórico de mudanças dos convênios federais) entrou no schema
regenerado (`01_pre_data.sql` e `03_post_data.sql`; catálogo sem mudança), no `rls/mapa.csv` (`fin_tg_mudancas` na
classe `trilha` com `leitura=financeiro.convenios.visualizar`) e no `overlay/40_privilegios.sql` (`fin_tg_mapa` e
`fin_tg_registrar_diferencas` sem EXECUTE; `pode_atualizar_convenios_federais` só para `authenticated`). Testes no
bloco "Financeiro: convênios federais, histórico de mudanças" de `scripts/db/testar-rls.sql`, com semente de
`fin_tg_mudancas` em `seed_ov`.

A migração `20261111090000_fin_tg_carregar_safeupdate.sql` refez `fin_tg_carregar` com `DELETE ... WHERE true` (o
`pg_safeupdate` do PostgREST recusa DELETE sem WHERE); só `01_pre_data.sql` muda. O teste de RLS reprova a função se
ela voltar a ter DELETE/UPDATE sem WHERE.

A migração `20261105090000_fin_convenios_transferegov.sql` (convênios federais do Transferegov) entrou no schema
regenerado (`01_pre_data.sql` e `03_post_data.sql`), no catálogo (`02_dados_catalogo.sql`: só a linha de
`financeiro.convenios.visualizar` e as concessões aos papéis, copiadas da regeneração), no `rls/mapa.csv` (as cinco
`fin_tg_*` na classe `trilha` com `leitura=financeiro.convenios.visualizar`) e no `overlay/40_privilegios.sql` (sem
INSERT/UPDATE/DELETE/TRUNCATE para `authenticated`; `fin_tg_carregar` só para `service_role`). Testes no bloco
"Financeiro: convênios federais do Transferegov" de `scripts/db/testar-rls.sql`, com sementes em `seed_ov`.

A migração `20261104090000_contratos_c1_cadastro.sql` (contratos, entrega C1) entrou no schema regenerado
(`01_pre_data.sql` e `03_post_data.sql`; catálogo sem mudança), no `rls/mapa.csv` (`contratos` e `itens_contrato`
passam de `modulo` para `permissao` com `escrita=` e `excluir=`; `contrato_responsaveis` entra na mesma classe; as
policies antigas `comp_module_*` de `contratos` seguem em `remover_policies`) e no `overlay/40_privilegios.sql` (gatilhos
`contratos_preparar`, `contratos_conferir_permissao` e `contrato_resp_preparar` sem EXECUTE; `contrato_pode_gravar`,
`contrato_buscar_servidores` e `contratos_importar_planilha` só para `authenticated`); testes no bloco "Contratos C1" de
`scripts/db/testar-rls.sql` (com os gatilhos ligados), que usam a persona, o fornecedor e o servidor já semeados.

A migração `20261103090000_contratos_passagens_faturas.sql` (passagens aéreas, entrega 3) entrou no schema regenerado
(`01_pre_data.sql` e `03_post_data.sql`), no catálogo (`02_dados_catalogo.sql`: só a linha de
`contratos.passagens.financeiro` e as concessões aos papéis, copiadas da regeneração), no `rls/mapa.csv`
(`passagem_faturas`, `passagem_fatura_itens` e `passagem_contrato_empenhos`, classe `permissao` com `leitura=`) e no
`overlay/40_privilegios.sql` (gatilhos e `passagem_empenho_candidato` sem EXECUTE; `passagem_empenhos_contrato`,
`passagem_empenhos_candidatos` e `passagem_salvar_fatura` só para `authenticated`); testes no bloco "PASSAGENS FATURAS" de `scripts/db/testar-rls.sql`, com semente de
`passagem_faturas` em `seed_ov`.

A migração `20261101090000_contratos_passagens_prestacao.sql` (passagens aéreas, entrega 2) entrou no schema
regenerado (`01_pre_data.sql` e `03_post_data.sql`; catálogo sem mudança), no `rls/mapa.csv` (`passagem_anexos`, classe
`permissao` com `leitura=`), no `overlay/40_privilegios.sql` (gatilhos sem EXECUTE; `passagem_relatorio_rh` só para
`authenticated`) e no `overlay/50_storage.sql` (bucket privado `passagens` e as policies de SELECT, INSERT e DELETE);
testes no bloco "PASSAGENS PRESTAÇÃO" de `scripts/db/testar-rls.sql`, com semente de `passagem_anexos` em `seed_ov`.

A migração `20261102090000_localizador_processos_sei.sql` (localizador de processos do SEI) é só de funções:
`sei_normalizar`, `texto_busca`, `localizar_processos_sei` e `processos_parados` entraram à mão em `01_pre_data.sql`
(depois de `processo_empenhos`) e os grants em `overlay/40_privilegios.sql`; as duas de busca são SECURITY INVOKER, então
cada fonte continua com a RLS dela. `rls/mapa.csv` sem mudança; testes no bloco "LOCALIZADOR" de `scripts/db/testar-rls.sql`.

A migração `20261031090000_contratos_passagens.sql` (passagens aéreas, entrega 1) entrou no schema regenerado
(`01_pre_data.sql` e `03_post_data.sql`), no `02_dados_catalogo.sql` (só as linhas das permissões
`contratos.passagens.visualizar`/`editar` e das concessões, copiadas da regeneração), no `rls/mapa.csv` (`passagem_*`
na classe `permissao`, `passagem_historico` em `trilha` com `leitura=`, opção nova da classe que exige também um dos
códigos para ler) e no `overlay/40_privilegios.sql`; testes no bloco "PASSAGENS"
de `scripts/db/testar-rls.sql`, com sementes em `seed_ov` (CPF, solicitante e passageiro válidos para os CHECKs).

A migração `20261106090000_compras_pesquisa_precos.sql` (pesquisa de preços, entrega 1) entrou no schema regenerado
(`01_pre_data.sql` e `03_post_data.sql`), no `02_dados_catalogo.sql` (só as linhas das permissões
`compras.pesquisa_precos.visualizar`/`editar` e da concessão aos papéis, copiadas da regeneração), no `rls/mapa.csv`
(`pesquisas_precos*` na classe `permissao`; a pesquisa com `excluir=ninguem`) e no `overlay/40_privilegios.sql`
(REVOKE do gatilho `pesquisa_precos_conferir`); testes no bloco "Compras: pesquisa de preços" de
`scripts/db/testar-rls.sql`, com sementes de `pesquisas_precos_itens` e `pesquisas_precos_amostras` em `seed_ov`.
Validado com `validar-baseline.sh` em PostgreSQL 16: **APROVADO**, RLS com 0 falhas.

A migração `20261110090000_compras_pesquisa_precos_pca_ata.sql` (pesquisa de preços, entrega 2) entrou só no schema
regenerado (`01_pre_data.sql`: colunas `pca_item_id` e `preco_comparado` de `pesquisas_precos_itens` com o CHECK e os
comentários; `03_post_data.sql`: índice parcial e FK para `pca_itens`); `02_dados_catalogo.sql`, `rls/mapa.csv` e
overlays sem mudança. Testes novos no bloco "Compras: pesquisa de preços" de `scripts/db/testar-rls.sql`. Validado com
`validar-baseline.sh` em PostgreSQL 16: **APROVADO**, RLS com 0 falhas.

A migração `20261029090000_compras_processos_andamento.sql` (processos de contratação, entrega 1) entrou no schema
regenerado (`01_pre_data.sql` e `03_post_data.sql`), no `02_dados_catalogo.sql` (só as linhas das permissões
`compras.processos.visualizar`/`editar` e da concessão a `admin` e `manager`, copiadas da regeneração), no
`rls/mapa.csv` (`processo_andamentos` na classe `permissao`) e no `overlay/40_privilegios.sql`; testes no bloco
"Compras: processos de contratação" de `scripts/db/testar-rls.sql`.

A migração `20261028090000_compras_pca.sql` (PCA, entrega 1) entrou no schema regenerado (`01_pre_data.sql` e
`03_post_data.sql`), no `02_dados_catalogo.sql` (só as linhas das permissões `compras.pca.visualizar`/`editar` e da
concessão a `admin` e `manager`, copiadas da regeneração), no `rls/mapa.csv` (`pca_*` e `cat_*` na classe `permissao`,
`pca_historico` em `trilha`) e no `overlay/40_privilegios.sql`; testes no bloco "Compras: PCA" de
`scripts/db/testar-rls.sql`, com sementes de `pca_itens` e `cat_sincronizacoes` em `seed_ov`.

A migração `20261026090000_fin_conciliacao_mensal.sql` (conciliação mensal, quadro da SEFAZ) entrou no schema
regenerado (`01_pre_data.sql` e `03_post_data.sql`; o `02_dados_catalogo.sql` não muda), no `rls/mapa.csv`
(`fin_conciliacoes_mensais` e `fin_conciliacao_itens`, classe `permissao`, `escrita=pagamento.conciliar`; o cabeçalho
com `excluir=ninguem`) e no `overlay/40_privilegios.sql`; testes no bloco "Financeiro: conciliação mensal" de
`scripts/db/testar-rls.sql`, com sementes das duas tabelas em `seed_ov`.

A migração `20261024090000_fin_remessa_obn600.sql` (remessa OBN600 dos pagamentos) entrou no schema regenerado
(`01_pre_data.sql` e `03_post_data.sql`; o `02_dados_catalogo.sql` não muda). Sem tabela nova: `rls/mapa.csv` sem
mudança; testes no bloco "Financeiro: remessa OBN600 dos pagamentos" de `scripts/db/testar-rls.sql`.

Em 2026-10-18 (P13, migração `20261018100000_remove_tabelas_backup_aposentado.sql`), as tabelas `backup_config`,
`backup_history` e `backup_integrity_checks` e os enums `backup_status` e `backup_type` (do backup antigo, aposentado
no P06) saíram do schema do baseline e do `rls/mapa.csv`.

Último resultado (2026-10-17, P12, migração `20261017090000`): overlays 18, 20 e 40 com o mesmo texto da migração,
schema regenerado do replay e `validar-baseline.sh` com `PG_REPLAY` **APROVADO** (RLS com 0 falhas, incluindo os testes
do bloco "P12" de `testar-rls.sql`: limite por IP, gestores sem INSERT anônimo, situação inicial nos formulários de
federações e árbitros e funções de permissão restritas ao próprio usuário ou ao admin). Antes, em 2026-10-12 (quadro
de vagas, migração `20261012150000`): schema regenerado do replay, incluindo
também as migrações `20261012090000` a `20261012140000`, que ainda não estavam nele; `validar-baseline.sh` com
`PG_REPLAY` **APROVADO**, schema idêntico ao replay. Antes, em 2026-10-11 (onda E3, migrações `20261011010000` e `20261011010100`, PostgreSQL 16): replay de
**270 migrações com 0 falhas**; `validar-baseline.sh` com `EXIGIR_REPLAY=1` **APROVADO** — RLS com 0 falhas em 4550
checagens de UPDATE/DELETE (235 tabelas), schema idêntico ao replay (44102 linhas), policies de storage, buckets, ACL de
funções e triggers de `storage.objects` idênticos. As duas migrações aplicadas duas vezes no replay, no baseline novo e
no baseline anterior à E3: sem erro e sem diferença entre a primeira e a segunda aplicação; o baseline anterior com as
duas migrações dá o mesmo dump do baseline novo. Prova de vida no baseline anterior: 148 falhas sem as migrações, 65 só
com a `20261011010000` (todas da `20261011010100`) e 0 com as duas. Num baseline anterior carregado com legado repetido
(S-1200 sem servidor, S-1299 e S-1200 duplicados, S-1210 transmitido duplicado, remessas com número repetido e duas
ativas da mesma folha), a `20261011010000` cria os três índices, marca 6 eventos como `erro`, valida os dois CHECKs e
reaplica sem mudança; uma policy de `storage.objects` sem filtro de bucket, com `bucket_id <> 'outro'`, `NOT IN` ou
lista com `remessas-cnab` faz a migração abortar, e uma restrita a outro bucket não. Antes, na E2 (migrações `20261011000200` e `20261011000300`): replay de
**268 migrações com 0 falhas**; `validar-baseline.sh` com `EXIGIR_REPLAY=1` **APROVADO** — RLS com 0 falhas em 4534
checagens de UPDATE/DELETE (235 tabelas), schema idêntico ao replay (43775 linhas) e triggers de `storage.objects`
idênticos. As duas migrações aplicadas duas vezes no replay, no baseline novo e no baseline anterior à E2: sem erro e
sem índice, trigger, policy, função ou coluna a mais; o teste passa com 0 falhas no baseline anterior com as migrações
aplicadas e reprova com 34 falhas sem elas (prova de vida). Antes, na E1 depois da revisão de segurança e de código: replay de
**266 migrações com 0 falhas** (com a main até a PR #80); `validar-baseline.sh` com `EXIGIR_REPLAY=1` **APROVADO** — RLS com 0 falhas em
4534 checagens de UPDATE/DELETE (235 tabelas), só as 20 tabelas de catálogo com linhas e schema idêntico ao
replay (43577 linhas). As migrações `20261011000000` e `20261011000100` aplicadas duas vezes no replay, no
baseline e no baseline anterior à E1: sem erro e sem trigger, policy ou linha de catálogo a mais. O mesmo teste
reprova com 225 falhas no baseline da `main` anterior à E1 (prova de vida). Na correção de contornos: 258 migrações,
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
  `rh`, inclusive o CID de `licencas_afastamentos`. Na E3 (`;leitura=`, migração `20261011010100`) a remuneração e o
  dado bancário por pessoa deixam de ser lidos só pelo módulo: fichas, itens, lançamentos, consignações, pensões,
  itens do retorno bancário e eventos do eSocial; `remessas_bancarias` continua lida pelo módulo (só totais) e passa a
  exigir `financeiro.folha.processar` para inserir e alterar (ninguém apaga pela API). Seguem abertos ao módulo
  `dependentes_irrf` (CPF de dependente), `adicionais_tempo_servico` e as colunas de remuneração e banco de
  `servidores`, `vinculos_servidor` e `pre_cadastros` (RLS é por linha; ver `docs/BANCO_DE_DADOS.md`). O padrão da B2 ("só com permissão": quem tem o módulo
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
- **Migrações `20261011000000` e `20261011000100` (E1, em PR rascunho) × overlays.** A primeira recria
  `registrar_transicao_folha` e `log_audit` com o mesmo texto do overlay `18` (que sobrescreveria as funções do
  schema) e repete os REVOKE/GRANT das funções novas no overlay `40` (o dump não leva privilégios). O resto (colunas
  de autoria, `audit_logs.sequencia`, triggers `zz_fixar_autoria`, `audit_<tabela>`, `trilha_imutavel` e
  `trilha_contexto_invalidar`, catálogo `audit_colunas_sensiveis`) chega pelo replay em `schema/`. A segunda
  (permissão `rh.auditoria.visualizar` e policy extra de `audit_logs`) também chega pelo replay e pode ser segurada
  sem a primeira. Limitações: a cascata ao excluir uma folha ou rubrica ainda apaga o histórico dela
  (o trigger deixa passar quando o pai já não existe); expurgo da trilha só por SQL direto com
  `SET LOCAL trilha.expurgo = 'autorizado'`; as FKs de autoria para `auth.users` que já existiam (quase todas sem
  `ON DELETE`) passam a barrar a exclusão de quem lançou algo, agora que o banco sempre grava o autor
  (`delete-user` deve passar a desativar).
- **Migrações `20261011000200` e `20261011000300` (E2, em PR rascunho) × overlays.** Os índices de `audit_logs`, a
  coluna gerada `alvos`, `registrar_evento` e as funções `trilha_storage`/`trilha_storage_chave` chegam pelo replay em
  `schema/`; os triggers `trilha_rh_storage_*` em `storage.objects` estão no overlay `50` (o dump só leva `public`), o
  REVOKE das funções no overlay `40` e `log_audit`, `fechar_folha` e `reabrir_folha` no overlay `18` (que sobrescreve o
  schema), com o mesmo texto das migrações. Limitação: sem o privilégio `TRIGGER` em `storage.objects` no banco de destino, a migração emite
  `WARNING` e os arquivos ficam sem trilha (consulta pós-deploy em
  [`docs/BANCO_DE_DADOS.md`](../../docs/BANCO_DE_DADOS.md#consulta-da-trilha-e-arquivos-do-rh-no-storage--onda-e2-banco)).
- **Migração `20261011010000` (E3, em PR rascunho) × overlays.** Colunas, `exigir_folha_fechada`,
  `remessa_integridade`, `cancelar_remessa`, `get_proximo_numero_remessa` (prévia sem o ano, só com o módulo `rh`), os
  triggers, os três índices únicos e os dois CHECKs do eSocial chegam pelo replay em `schema/`; `reabrir_folha` está no
  overlay `18` (que sobrescreve o schema); o bucket `remessas-cnab` e as policies `st_remessas-cnab_*` no overlay `50` (o
  dump só leva `public`); os REVOKE/GRANT no overlay `40` — todos com o mesmo texto da migração. Num banco com dados
  repetidos antigos, a migração marca os eventos rascunho como `erro` e deixa as remessas repetidas fora do índice pelo
  id: o índice existe sempre, mas com predicado diferente do baseline (que nasce vazio). Uma policy de `storage.objects`
  que valha para o bucket aborta a migração ([`docs/BANCO_DE_DADOS.md`](../../docs/BANCO_DE_DADOS.md#integridade-da-remessa-cnab-e-do-esocial--onda-e3-banco)).
- **Migração `20261011010100` (E3, em PR rascunho, muda RLS existente) × baseline.** As policies das oito
  tabelas (`fichas_financeiras`, `itens_ficha_financeira`, `lancamentos_folha`, `consignacoes`, `pensoes_alimenticias`,
  `itens_retorno_bancario`, `eventos_esocial`, `remessas_bancarias`) na migração são cópia literal
  de `rls/35_policies_geradas.sql` (gerado do `mapa.csv`); o REVOKE de `DELETE` está no overlay `40`; a permissão
  `rh.contracheques.visualizar` e as linhas de `role_permissions` (admin, manager) estão em `schema/02_dados_catalogo.sql`.
  Se a migração for segurada no merge, o baseline fica à frente do banco só-migrações nesses pontos.
- **Migração `20261012150000` (quadro de vagas, em PR rascunho) × baseline.** `vagas_cargo`, `provimentos.vaga_id`, os
  triggers, as views `v_quadro_vagas`/`v_vagas_historico` e as funções chegam pelo replay em `schema/`; as policies de
  `vagas_cargo` na migração são cópia do SQL gerado do `mapa.csv` (classe `catalogo`); os REVOKE das funções de trigger
  estão no overlay `40` (o dump não leva privilégios). Detalhe em
  [`docs/BANCO_DE_DADOS.md`](../../docs/BANCO_DE_DADOS.md#quadro-de-vagas).
- **`servidores.situacao`** (anterior à B2): quem tem o módulo `rh` muda a situação de outro servidor, e isso
  bloqueia o perfil vinculado. Sem correção ainda.
- Tabelas com fluxo de aprovação por RPC e UPDATE livre para o módulo: `folhas_pagamento` foi protegida (só quem
  pode fechar/reabrir muda o status), mas `conteudo_rascunho` (comunicação) ainda deixa o módulo marcar
  `status = 'publicado'` sem passar por `promover_rascunho`. Revise outras tabelas com `status` de aprovação.
- A folha está bloqueada e não foi exercitada de ponta a ponta: `fn_gerar_esocial_s1200` usa uma coluna
  inexistente (`lancamentos_folha.folha_id`) e falha para todos; `fechar_folha`/`reabrir_folha` e
  `fn_audit_parametros` foram consertados (auditoria gravava texto em coluna uuid).
- Edge Functions: no self-hosted, confirme `FUNCTIONS_VERIFY_JWT=true` no `.env`; outras Edge Functions (`cpsi-ai-assistant`,
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
  baseline); `anon` executa **14** RPCs públicas no total (essas 6, as 4 do Portal da Transparência:
  `transparencia_execucao_orcamentaria`, `transparencia_licitacoes`, `transparencia_patrimonio` e
  `transparencia_cargos_publicos`, esta última no lugar de `public/data/cargos.json`, que publicava a indicação dos ocupantes,
  e as 4 do pré-cadastro público, migração `20261012140000`: `pre_cadastro_publico_criar`, `_obter`, `_salvar` e
  `_enviar`, com o token de cada pré-cadastro como guarda). O formulário de árbitros segue o mesmo princípio e
  tolera a falta das RPCs (`CadastroArbitroPage.tsx`), mas o log de acesso ao contracheque e o cadastro de
  árbitros só ficam íntegros depois de aplicada a migração `20261006230500`.
- O banco ao vivo nunca foi inspecionado: o baseline foi derivado só dos arquivos do repositório.

A migração `20261114090000_rh_importar_servidores_sigrh.sql` (servidores pelo arquivo da Seplan) entrou no schema
regenerado (`01_pre_data.sql`: `rh_importar_servidores_sigrh`; `03_post_data.sql` sem mudança), no
`overlay/40_privilegios.sql` (`EXECUTE` só para `authenticated`) e, à mão, no `02_dados_catalogo.sql` (linha nova de
`rh.servidores.importar` no catálogo e nos papéis `admin` e `manager`, os que já tinham `rh.servidores.criar`; o resto
da regeneração do catálogo só trocava ids e datas e foi descartado). RLS e `rls/mapa.csv` sem mudança. Testes no
bloco "RH: servidores pelo arquivo da Seplan" de `scripts/db/testar-rls.sql`.

A migração `20261115090000_rh_importar_cargos_ocupantes.sql` (cargo e lotação pela planilha de ocupantes) entrou no
`01_pre_data.sql` (`rh_importar_cargos_ocupantes`) e no `overlay/40_privilegios.sql` (`EXECUTE` só para
`authenticated`). Usa a permissão `rh.servidores.importar` da migração anterior: catálogo, RLS e `rls/mapa.csv` sem
mudança. Testes no bloco "RH: cargo e lotação pela planilha de ocupantes" de `scripts/db/testar-rls.sql`.
