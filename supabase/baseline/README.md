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

## Conteúdo e ordem de aplicação (`aplicar.sh`, uma única transação)

| # | Arquivo | O que faz | Origem |
|---|---|---|---|
| 1 | `schema/01_pre_data.sql` | tipos, funções, tabelas, views | **gerado** (`scripts/db/gerar-baseline.sh`) |
| 2 | `schema/02_dados_catalogo.sql` | 19 tabelas de catálogo/parâmetros (737 linhas) | **gerado** |
| 3 | `schema/03_post_data.sql` | constraints, índices, triggers, RLS ligado, policies do replay | **gerado** |
| 4 | `overlay/10_funcoes_acesso.sql` | `is_admin_user`, `is_admin_atual`, `has_permission_code`, `meu_servidor_id` exigem perfil **ativo**; fim dos stubs “acesso total”; alias `usuario_eh_admin` | à mão |
| 5 | `overlay/12_protecao_profiles.sql` | trigger: quem não é admin não muda `is_active`, `servidor_id`, bloqueio, tipo, CPF, e-mail; policies de `profiles` sem duplicatas | à mão |
| 6 | `overlay/15_novo_usuario.sql` | `handle_new_user` (antes quebrava o cadastro) + trigger em `auth.users` | à mão |
| 7 | `overlay/18_funcoes_rpc.sql` | `fn_gerar_numero_financeiro` com lista fechada (injeção de SQL), `registrar_transicao_folha`, RPCs de leitura com dado pessoal viram `SECURITY INVOKER` | à mão |
| 8 | `overlay/20_campos_iniciais.sql` | trigger: formulários públicos e pedidos do servidor não escolhem `status`/aprovação | à mão |
| 9 | `overlay/30_remover_acesso_total.sql` | apaga as policies `acesso_total_*` e a tabela morta `_backup_usuario_modulos_old` | à mão |
| 10 | `rls/35_policies_geradas.sql` | policies por módulo, **falha fechada** | **gerado** de `rls/mapa.csv` |
| 11 | `overlay/40_privilegios.sql` | `anon` só com as exceções públicas; sem EXECUTE para PUBLIC em função nova; sem TRUNCATE/TRIGGER; `audit_logs` só-acréscimo; RPCs que escrevem fechadas | à mão |
| 12 | `overlay/50_storage.sql` | buckets (com limite de tamanho/tipo no de árbitros) e policies de storage por módulo | à mão |
| 13 | `overlay/60_realtime.sql` | publicação realtime (folha) | à mão |

`lacunas/` guarda a migração que cobre as tabelas usadas e nunca criadas; ela só serve ao replay
(`scripts/db/validar-migracoes.sh`) que alimenta os itens 1–3. O baseline não a aplica.
`bootstrap-admin.sql` cria o primeiro administrador (não faz parte do `aplicar.sh`).

Arquivos **gerados** não se editam à mão. Dados antes das constraints/triggers é proposital: o
INSERT não dispara auditoria e as FKs são validadas depois, contra os dados semeados.

## Modelo de RLS (`rls/mapa.csv`)

O mapa tabela → classe/módulo é a **fonte da verdade** e deve ser lido por quem conhece o negócio.
Classes (detalhe no cabeçalho de `scripts/db/gerar-rls.mjs`):

| Classe | Tabelas | Regra |
|---|---|---|
| `modulo` | 178 | módulo(s) do mapa leem e escrevem; admin (papel) também |
| `trilha` | 9 | módulo lê; **ninguém escreve por API** (auditoria e históricos gravados por trigger) |
| `proprio_leitura` / `proprio` / `proprio_filho` | 12 / 3 / 3 | módulo + o próprio servidor lê; em `proprio*` o servidor também cria o próprio pedido (status/aprovação forçados pelo overlay 20) |
| `catalogo` | 6 | qualquer usuário ativo lê; escrita por módulo |
| `catalogo_admin` | 6 | qualquer usuário ativo lê (o app lê no login); só o papel admin escreve |
| `proprio_user` | 4 | cada usuário lê as suas linhas (`user_roles`, `user_modules`, `user_permissions`, `user_org_units`); só admin escreve |
| `admin` / `admin_leitura` | 8 / 1 | só o papel admin (a segunda: lê, ninguém escreve — `audit_logs`) |
| `publico_admin` | 3 | `anon` e logados leem (portal público); só admin escreve |
| `preservar` | 2 | `denuncias` e `profiles`: policies próprias (`has_permission_code`; overlay 12) |

- Toda tabela de `public` precisa de uma linha no mapa e de RLS ligado: o teste de RLS reprova
  tabela fora do mapa (o gerador não enxerga o banco; o teste sim). Tabela nova só passa depois
  que alguém decide o módulo dono.
- Coluna `confianca`: `alta` (220), `media` (13), `baixa` (2). **Revise as 15 linhas não-altas**
  (`confianca != alta`), principalmente `viagens_diarias`, `documentos` e `acesso_processo_sigiloso`.
- Para mudar uma regra: edite `mapa.csv`, rode `node scripts/db/gerar-rls.mjs` e confirme com
  `scripts/db/validar-baseline.sh`. O gate (`npm run gate`) falha se o SQL gerado estiver defasado.

## Verificação

```bash
bash scripts/db/validar-migracoes.sh                       # replay das migrações → banco PG_REPLAY
PG_REPLAY=idjuv_validacao bash scripts/db/validar-baseline.sh
```

`validar-baseline.sh` recria um banco vazio com o shim do Supabase (`scripts/db/shim-supabase.sql`),
aplica o baseline, confirma que uma segunda aplicação é recusada e que não há dado pessoal, roda
`scripts/db/testar-rls.sh` e, com `PG_REPLAY`, compara schema, privilégios e storage com o replay das
migrações + overlays. O teste de RLS cobre, com personas reais (`SET ROLE` + claims do JWT):

- por tabela: `SELECT`, `INSERT`, `UPDATE` e `DELETE` para admin, admin bloqueado, sem módulo, inativo,
  servidores (ativo e bloqueado), cada módulo do mapa e um módulo alheio; `anon` conforme a coluna `anon`;
- a cobertura é exigida: tabela sem linha semente, fora do mapa ou sem RLS é **falha**;
- storage: 9 buckets × 25 personas, upload anônimo só nas pastas do formulário, limite do bucket;
- identidade: auto-ativação, troca de `servidor_id`, auto-promoção, admin bloqueado, `handle_new_user`;
- RPCs: injeção de SQL, `SECURITY DEFINER` sem checagem fora de lista revisada, privilégios padrão,
  campos que o autor não pode escolher nos formulários.

Último resultado: **aprovado**, 0 falhas, em PostgreSQL **15.18, 16.15 e 17.10** (o self-hosted da
Supabase costuma rodar 15; o dump é gerado por `pg_dump` 16).

**Limite da validação:** roda em Postgres puro com um *shim* de `auth`/`storage`/papéis. Não exercita
GoTrue, PostgREST, Storage API nem Realtime, e o `postgres` do shim não é o da imagem da Supabase
(os *default privileges* de `supabase_admin` não são emulados). Teste no Supabase de destino antes de
apontar o front. O teste de UPDATE mede só a policy de UPDATE (`SET coluna = DEFAULT`, que não exige
visibilidade pelas policies de SELECT).

## Regenerar o schema

O dump sai do banco do **replay das migrações, sem os overlays** (os overlays e a RLS são camadas
versionadas à parte):

```bash
bash scripts/db/validar-migracoes.sh                         # deixa o replay em idjuv_validacao
PG_DB=idjuv_validacao bash scripts/db/gerar-baseline.sh      # reescreve supabase/baseline/schema/
PG_REPLAY=idjuv_validacao bash scripts/db/validar-baseline.sh
```

As sementes saem com **UUIDs e datas novos** a cada geração (snapshot do replay); regenere só quando o
catálogo mudar de fato. O `pg_dump` precisa ser da versão do servidor do replay ou mais nova; um
`pg_dump` 17 emite `SET transaction_timeout`, que o Postgres 15/16 rejeita — mantenha o `pg_dump` 16.

## O que NÃO está aqui

- **Dados pessoais.** `servidores` e `vinculos_servidor` (74 nomes com CPF, inseridos pela migração
  `20260110184920`), `audit_logs`, `portal_diretoria` e outras tabelas operacionais ficam fora das
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
- **Módulo `rh` amplo demais para saúde e folha.** `licencas_afastamentos` (CID), `pensoes_alimenticias`,
  `consignacoes`, `remessas_bancarias` e `fichas_financeiras` abrem a qualquer usuário com o módulo `rh`
  (só `denuncias` usa permissão granular). Separar por `has_permission_code` exige confirmar com o RH.
- **`role_permissions` dá permissões `admin.*` ao papel `user`.** Quem tem o módulo `admin` passa a ter
  `admin.usuarios`; `admin-reset-password` e `delete-user` agora recusam agir sobre administrador sem ser
  um, mas `admin-create-user` e as demais telas de admin continuam abertas a esse perfil.

Limites conhecidos:

- Buckets públicos continuam servindo o arquivo por URL; fechar exige bucket privado + URL assinada no front.
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
- `processar_folha_pagamento` e `fn_atualizar_situacao_servidor` ficam sem EXECUTE para `authenticated` (a folha
  está bloqueada — débito técnico DT-2026-001); ao ativá-la, reabra com guarda `can_access_module` no corpo.
- Os dados pessoais de servidores seguem no histórico git e na migração `20260110184920`.
- O banco ao vivo nunca foi inspecionado: o baseline foi derivado só dos arquivos do repositório.
