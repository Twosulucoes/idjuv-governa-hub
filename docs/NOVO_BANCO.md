# Banco novo e vazio (Supabase próprio / validação em PostgreSQL)

Como criar um banco **novo** do sistema a partir do baseline de `supabase/baseline/`
([conteúdo e manutenção](../supabase/baseline/README.md)). Escopo: banco **vazio** — nenhum dado de
servidor, usuário ou documento é levado do banco antigo. Migrar dados não está coberto aqui; para
recuperar os dados da produção, restaure o backup ([BACKUP.md](./BACKUP.md)).

> Este guia substitui o antigo guia de Supabase próprio e o dump parcial do schema, hoje em
> [`historico/`](./historico/) (`MIGRACAO_SUPABASE_PROPRIO.md`, `SCHEMA_SUPABASE_PROPRIO.sql`,
> `EXPORTAR_DADOS.md` e a pasta `disaster-recovery/`): nenhum deles reconstrói o sistema atual.

## 1. Onde rodar

| Destino | Serve para | Observação |
|---|---|---|
| **Supabase self-hosted** na VPS (Docker) | **Produção** | O front usa `supabase-js`: Auth (GoTrue), PostgREST, Storage, Realtime e Edge Functions. Só o Postgres não basta. |
| PostgreSQL puro (15, 16 ou 17) | **Validar** o baseline e o teste de RLS | Usa `scripts/db/shim-supabase.sql` para simular `auth`, `storage` e os papéis. **Nunca** para produção. |
| Supabase na nuvem | Alternativa | Projetos Free têm limite de projetos/recursos; o baseline é o mesmo. |

## 2. Validar localmente (antes de tocar na VPS)

Precisa de um Postgres em que você seja superusuário **e que não se chame `postgres`** (o shim cria
um `postgres` sem superuso e com `BYPASSRLS`, como o do Supabase). Exemplo:

```bash
# `trust` porque o shim cria o papel `postgres` sem senha; a porta fica só no loopback.
docker run -d --name pg-validacao -p 127.0.0.1:54329:5432 \
  -e POSTGRES_USER=supabase_admin -e POSTGRES_HOST_AUTH_METHOD=trust postgres:17
export PGHOST=127.0.0.1 PGPORT=54329
bash scripts/db/validar-baseline.sh
```

Saída esperada: `baseline APROVADO` (aplicação, banco vazio de dados pessoais, RLS por módulo com
UPDATE/DELETE, storage, identidade, RPCs e triggers). O script **apaga e recria** os bancos `idjuv_baseline`,
`idjuv_baseline_ref` e `idjuv_baseline_teste`, e recusa um `PGHOST` que não seja local (exceto com
`PERMITIR_REMOTO=1`). Precisa de `bash` 4+, `node`, `perl`, `psql` e `pg_dump` (da versão do servidor ou mais
nova) no PATH. Para comparar também com o replay das migrações, rode antes `scripts/db/validar-migracoes.sh` e
informe `PG_REPLAY=<banco do replay>` (`EXIGIR_REPLAY=1` reprova se ele faltar).

Para saber em que o banco de **produção** difere das migrações e do baseline, use a fotografia da estrutura:
`bash scripts/db/fotografia-banco.sh` (local, com `FOTO_PROD_URL` opcional) ou o workflow manual
**Fotografia do banco**, que lê a produção pelo túnel SSH em modo só leitura. Ver
[DESENVOLVIMENTO.md](./DESENVOLVIMENTO.md#fotografia-do-banco-de-produção-ci-manual).

`bash scripts/db/gerar-tipos.sh` usa o mesmo replay (mesmos pré-requisitos de `validar-migracoes.sh`) para gerar
`src/integrations/supabase/types.ts`; `--checar` só compara (workflow **Tipos do banco**). Ver
[BANCO_DE_DADOS.md](./BANCO_DE_DADOS.md).

O replay e o `validar-baseline.sh` com `PG_REPLAY` (teste de RLS incluído) também rodam no CI em todo PR que mexe
no banco: workflow **Banco do zero e RLS** ([DESENVOLVIMENTO.md](./DESENVOLVIMENTO.md#banco-do-zero-e-rls-ci)).

## 3. Subir o Supabase self-hosted

Siga o guia oficial de self-hosting com Docker da Supabase. Antes de expor à internet:

1. **Troque todos os segredos de exemplo** do `.env`: `POSTGRES_PASSWORD`, `JWT_SECRET`, `ANON_KEY`,
   `SERVICE_ROLE_KEY` (gerados a partir do novo `JWT_SECRET`), `DASHBOARD_USERNAME/PASSWORD`.
2. **Desative o cadastro público e o login anônimo** (`DISABLE_SIGNUP=true`; confirme também que o
   login anônimo do GoTrue está desligado): o front não tem tela de autocadastro e usuários são criados
   por administrador (Edge Function `admin-create-user`, que usa a API admin e não depende de cadastro
   público). Um usuário criado direto no Auth/Studio nasce **inativo** (`handle_new_user`); o criado pela
   Edge Function `admin-create-user` nasce **ativo** (ela grava `is_active: true`).
3. Configure `SITE_URL`, `ADDITIONAL_REDIRECT_URLS` e o SMTP (recuperação de senha, convites).
4. Coloque o Kong/API atrás de HTTPS e **não publique a porta do Postgres**.
5. Os formulários públicos (árbitros, federações, gestores escolares, denúncia) e o upload anônimo em
   `arbitros-docs` não têm limite de taxa no banco: aplique rate limit no proxy (Kong/nginx) e CAPTCHA
   no formulário.

Os nomes das variáveis mudam entre versões: confira o `.env.example` da versão que você baixou.

## 4. Aplicar o baseline

Conecte **direto ao Postgres** (túnel SSH ou rede do Docker), como o papel `postgres`, em sessão —
não pelo pooler em modo transação:

```bash
# a senha vai em PGPASSWORD (a URL com senha apareceria em `ps` e no histórico do shell)
PGPASSWORD='...' bash supabase/baseline/aplicar.sh "postgresql://postgres@127.0.0.1:5432/postgres"
```

O script recusa um banco cujo `public` já tenha tabelas e aplica tudo numa **única transação**: se
qualquer arquivo falhar, nada fica aplicado e o comando pode ser repetido. Não rode o shim nem
`validar-*.sh` no Supabase real. O `aplicar.sh` não toca em `auth.users` existentes: num projeto com
usuários já criados, o trigger `on_auth_user_created` passa a valer só para os próximos.

## 5. Primeiro administrador

Num banco vazio não há quem ative usuários. Crie o usuário no Studio (Authentication → Add user, marcando
**Auto Confirm User**) e promova (precisa de `psql` 13+; o e-mail é procurado em `auth.users` e precisa estar
confirmado; o script **recusa** se já houver um administrador ativo, a menos que se passe `-v forcar=1`):

```bash
PGPASSWORD='...' psql "postgresql://postgres@127.0.0.1:5432/postgres" \
  -v email='pessoa@orgao.gov.br' -f supabase/baseline/bootstrap-admin.sql
```

Os demais usuários entram pelo app (Admin → Usuários). Guarde as credenciais fora do repositório.

## 6. Front e Edge Functions

- `.env` do front: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (a `ANON_KEY` nova),
  `VITE_SUPABASE_PROJECT_ID` e `VITE_TENANT_SLUG`. Nada de `SERVICE_ROLE_KEY` no front.
- Edge Functions (detalhes em [EDGE_FUNCTIONS.md](./EDGE_FUNCTIONS.md)): `admin-create-user`,
  `admin-reset-password`, `delete-user`, `download-frequencia`,
  `enviar-convite-reuniao`, `enviar-notificacao`, `cpsi-ai-assistant`, `database-schema`, `bb-api`. Segredos lidos pelo código:
  `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ALLOWED_ORIGINS` (os endereços do
  front separados por vírgula; no IDJUV, `https://idjuv.online,https://app.idjuv.online`), `RESEND_API_KEY`/`RESEND_FROM` (e-mail, só como reserva: o cliente configura o envio em
  `/admin/envios`, com credencial no Vault), `GEMINI_API_KEY`/`GEMINI_MODEL` (assistente),
  `BB_AMBIENTE`, `BB_CLIENT_ID`, `BB_CLIENT_SECRET`,
  `BB_APP_KEY`, `BB_CERT_PEM`, `BB_KEY_PEM` (função `bb-api`, APIs de leitura do Banco do Brasil, com as
  credenciais do próprio cliente; passo a passo em
  [EDGE_FUNCTIONS.md](./EDGE_FUNCTIONS.md#configurar-as-credenciais-do-bb-numa-instância)). Defina só os das
  funções que for ligar.
- **Defina `FUNCTIONS_VERIFY_JWT=true`** no `.env` das Edge Functions (no self-hosted o exemplo costuma vir
  `false`; confirme na sua versão): as funções confiam no gateway para validar o JWT. A publicação na VPS é
  feita pelo CI ([EDGE_FUNCTIONS.md](./EDGE_FUNCTIONS.md#publicação-pelo-ci)).
- O baseline **não** cria agendamento (`pg_cron`). O backup fora da VPS é o de [BACKUP.md](./BACKUP.md) (a antiga
  `backup-offsite` foi aposentada no P06, e as tabelas `backup_*` dela foram apagadas no P13).
- A tela **Admin → Disaster recovery** (`/admin/disaster-recovery`) resume este caminho para quem usa o sistema
  (backup diário, banco novo pelo baseline, front pelo CI). É só informativa: desde o P13 não oferece mais o
  download do schema antigo.

## 7. Conferência depois de aplicar

Rode estas consultas como `postgres` no banco novo:

```sql
-- 0 policies "acesso total"
SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND policyname ILIKE 'acesso_total%';
-- anon executa só estas funções (registrar_denuncia_publica, obter_dado_oficial, arbitro_cpf_cadastrado,
-- obter_protocolo_arbitro, consultar_gestor_por_cpf, registrar_gestor_publico, transparencia_execucao_orcamentaria,
-- transparencia_licitacoes, transparencia_patrimonio, transparencia_cargos_publicos, pre_cadastro_publico_criar,
-- pre_cadastro_publico_obter, pre_cadastro_publico_salvar, pre_cadastro_publico_enviar)
SELECT p.oid::regprocedure FROM pg_proc p
 WHERE p.pronamespace = 'public'::regnamespace AND has_function_privilege('anon', p.oid, 'EXECUTE');
-- toda tabela com RLS ligado (esperado: nenhuma linha)
SELECT relname FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relkind IN ('r','p') AND NOT relrowsecurity;
-- ninguém de fora tem TRUNCATE/TRIGGER, e audit_logs não é gravável por API (esperado: nenhuma linha)
SELECT relname FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relkind IN ('r','p')
   AND (has_table_privilege('anon', oid, 'TRUNCATE') OR has_table_privilege('authenticated', oid, 'TRUNCATE')
        OR has_table_privilege('authenticated', 'public.audit_logs', 'INSERT'));
```

Depois, entre no app com o administrador criado, crie um usuário comum, atribua um módulo e confirme
que ele só vê o módulo concedido, e que **não consegue se ativar nem trocar o próprio `servidor_id`**
(o `UPDATE` em `profiles` deve falhar com `42501`). **Não** rode `scripts/db/testar-rls.sh` contra o
banco real: ele cria uma cópia (`CREATE DATABASE ... TEMPLATE`), semeia dados de teste nela e a apaga;
exige superusuário e que ninguém esteja conectado ao banco de origem.

## 8. Limites e pendências

- O baseline foi validado em **PostgreSQL 15.18, 16.15 e 17.10 com shim**, não num Supabase real.
  Faça a conferência do item 7 no destino.
- Revise as linhas `confianca != alta` de [`rls/mapa.csv`](../supabase/baseline/rls/mapa.csv) com as
  áreas donas dos dados (RH, financeiro, patrimônio…) antes de abrir para usuários reais.
- Decisões em aberto (sigilo de processos, granularidade do módulo `rh`, permissões `admin.*` do papel
  `user`, oráculos de permissão, limite de taxa): [`supabase/baseline/README.md`](../supabase/baseline/README.md),
  seção “Pendências e decisões em aberto”.
- O baseline cria **12 buckets** (`overlay/50_storage.sql`; `emails`, público, com os templates do Auth, entrou em
  14/10/2026 porque na produção tinha sido criado à mão). Buckets públicos
  ainda entregam o arquivo a quem tem a URL; fechar exige bucket privado + URL assinada no front. O
  `inventario-evidencias` (fotos da vistoria de inventário) já nasce privado e o front lê por URL assinada.
  Os buckets do RH `frequencias` e `documentos-requerimento` e o `documentos` também são privados; desde a B3
  (migração `supabase/migrations/20261010210000_onda_b_rh_storage.sql`, em PR rascunho) o documento assinado do
  servidor abre por URL assinada, mas portarias, atos e cedência ainda gravam link público (`getPublicUrl`) do
  bucket `documentos`, que num bucket privado não abre (pendência; ver [RBAC_PERMISSOES.md](./RBAC_PERMISSOES.md#arquivos-do-rh-e-download-de-frequência-onda-b--b3)).
- O schema do baseline foi regenerado por inteiro em 2026-10-16 (P11, migrações até `20261016220000`) e aprovado por
  `validar-baseline.sh` com `PG_REPLAY`; o overlay de Realtime saiu (nenhuma tabela publicada).
- O schema do baseline foi regenerado em 2026-10-17 com a migração `20261017090000` (P12: limite por IP dos
  formulários públicos, tabela `limite_requisicoes_publicas` na classe `fechada`, funções de permissão restritas),
  com os overlays 18, 20 e 40 alterados com o mesmo texto, e aprovado por `validar-baseline.sh` com `PG_REPLAY`
  ([detalhe](./BANCO_DE_DADOS.md)).
- O schema do baseline foi regenerado em 2026-10-12 com as migrações até `20261012150000` (RH de 12/10 e quadro de
  vagas, tabela `vagas_cargo` na classe `catalogo`; 252 tabelas no mapa) e aprovado por `validar-baseline.sh` com <!-- numero-datado -->
  `PG_REPLAY` ([detalhe](../supabase/baseline/README.md#verificação)).
- A RPC `importar_portarias_planilha` e a permissão `gabinete.portarias.importar` (migração `20261015120000`) entraram no
  schema do baseline só com os dois trechos do dump (função e linha do catálogo), sem regenerar o resto; testes no bloco
  "Gabinete: importação de portarias" de `scripts/db/testar-rls.sql`.
- A tabela `fin_classificadores_fiplan` e a RPC `importar_classificadores_fiplan` (migração `20261019100000`) entraram
  no schema do baseline com os trechos do dump (tabela, função, constraints, índice e policy) e o rótulo novo de
  `orcamento.importar` no catálogo; classe `preservar` no mapa, privilégio de escrita retirado no overlay 40; testes no
  bloco "Financeiro: tabelas do FIPLAN" de `scripts/db/testar-rls.sql`.
- O cálculo do IRRF pela lei de 2026 e a opção pelo regime próprio de origem (migração `20261019200000`) entraram no
  schema do baseline regenerado a partir do replay; `calcular_irrf_mensal` sem EXECUTE pela API no overlay 40; testes no
  bloco "FOLHA: cálculo do INSS e do IRRF" de `scripts/db/testar-rls.sql` ([detalhe](./BANCO_DE_DADOS.md)).
- Os empenhos do FIPLAN (migração `20261027090000`) entraram no schema do baseline regenerado (colunas novas em
  `fin_empenhos` e `fornecedores`, tabela `fin_empenho_documentos_fiplan`, gatilhos de saldo e
  `importar_empenhos_fip614`) e o rótulo novo de `orcamento.importar` no catálogo; classe `preservar` no mapa,
  escrita retirada no overlay 40; testes no bloco "Financeiro: empenhos do FIPLAN (FIP 614)" de
  `scripts/db/testar-rls.sql` ([detalhe](./BANCO_DE_DADOS.md#empenhos-do-fiplan-fip-614)).
- Os atos remuneratórios e o histórico do vencimento por cargo (migração `20261020100000`) entraram no schema do
  baseline regenerado e no mapa (`atos_remuneratorios` e `atos_remuneratorios_itens` na classe `permissao`,
  `cargo_vencimentos` na `trilha`); privilégios das funções novas no overlay 40; testes no bloco "FOLHA: atos
  remuneratórios" de `scripts/db/testar-rls.sql` ([detalhe](./BANCO_DE_DADOS.md)).
- Os vetores de teste da folha comuns com o hrms_brasil (`scripts/db/casos-folha.json`) rodam no teste de RLS, no
  bloco "FOLHA: vetores comuns": `testar-rls.sh` passa o arquivo ao `psql`, e rodar o `.sql` sem ele reprova.
- O registro do ciclo do SEI no termo de cessão e na designação de chefia (migração `20261023090000`) entrou no
  schema do baseline só com os trechos do dump (colunas novas e `NOT NULL` retirado em `termos_cessao` e
  `nomeacoes_chefe_unidade`, com os comentários), sem regenerar o resto; RLS e privilégios sem mudança
  ([detalhe](./BANCO_DE_DADOS.md#termo-de-cessão-e-designação-de-chefia-ciclo-do-sei)).
- A importação da folha do SIGRH (migração `20261022090000`) entrou no schema do baseline regenerado
  (`importar_folha_sigrh`, com os ajustes da revisão na `20261022100000`); o EXECUTE só para `authenticated` no overlay 40; testes no bloco "FOLHA: importação da
  folha do SIGRH" de `scripts/db/testar-rls.sql` ([detalhe](./BANCO_DE_DADOS.md)).
- A remessa OBN600 dos pagamentos (migração `20261024090000`) entrou no schema do baseline regenerado (colunas novas
  em `contas_autarquia`, `fin_remessas_bancarias` e `fin_pagamentos`, `registrar_remessa_obn600` e as versões finais
  de `confirmar_remessa_bancaria`, `cancelar_remessa_bancaria` e `fin_remessa_bancaria_json`); sem tabela nova nem
  mudança no `rls/mapa.csv`; testes no bloco "Financeiro: remessa OBN600 dos pagamentos" de
  `scripts/db/testar-rls.sql` ([detalhe](./BANCO_DE_DADOS.md)).
- Os gatilhos de saldo do empenho e do contrato (migração `20261107090000`) e o processamento e a reabertura da folha
  (migração `20261107091000`) entraram no schema do baseline (`schema/01_pre_data.sql`; `reabrir_folha` também no
  `overlay/18_funcoes_rpc.sql`); sem tabela nova nem mudança no `rls/mapa.csv`; testes nos blocos "Financeiro e
  contratos: gatilhos de saldo", "E1 folha" e "I4/M3" de `scripts/db/testar-rls.sql` ([detalhe](./BANCO_DE_DADOS.md)).
- As emendas parlamentares (migração `20261108090000`) entraram no mapa (`fin_emendas`, classe `permissao` com
  `orcamento.criar`) e no schema do baseline regenerado; sem permissão nova nem função; semente em `seed_ov` de
  `scripts/db/testar-rls.sql` ([detalhe](./BANCO_DE_DADOS.md)).
- Os processos de contratação, entrega 2 (migração `20261030090000`), entraram no mapa (`fin_peds` e
  `processo_reservas`, classe `preservar`: SELECT pelas policies da migração e escrita só pelas RPCs), no schema do
  baseline regenerado e no `overlay/40_privilegios.sql`; sem linha nova no catálogo; testes no bloco "Compras:
  reservas e PEDs" de `scripts/db/testar-rls.sql` ([detalhe](./BANCO_DE_DADOS.md)).
- As passagens aéreas no Gabinete (migração `20261110120000`): no mapa, as dez tabelas `passagem_*` passam aos módulos
  `gabinete|contratos` (`rls/35_policies_geradas.sql` regenerado); no schema regenerado, as cinco RPCs estreitas com a
  mesma troca e a nova `passagem_contratos_agencia`; no `overlay/40_privilegios.sql` o `EXECUTE` dela e no
  `overlay/50_storage.sql` o bucket `passagens`; no catálogo (à mão), o `module_code` das três permissões das passagens
  vira `gabinete`. Testes de RLS sem bloco novo (as personas por módulo do mapa já cobrem o Gabinete).
- A permissão própria da execução do FIPLAN (migração `20261109090000`) entrou à mão: no schema, a checagem e o comentário
  de `importar_empenhos_fip614` e `importar_peds_fiplan` (de `orcamento.importar` para `financeiro.execucao.importar`);
  no catálogo, a linha nova e o rótulo de `orcamento.importar`. Mapa e overlay sem mudança; testes nos blocos do FIP 614 e
  dos PEDs de `scripts/db/testar-rls.sql` (só `orcamento.importar` passa a ser recusado).
- A migração `20261113090000` (diárias do FIPLAN, FIP 002) entrou no mapa (`fin_diarias_fiplan`, classe `preservar`,
  policy na migração), no schema regenerado, no rótulo de `financeiro.execucao.importar` do catálogo e no
  `overlay/40_privilegios.sql` (só leitura pela API; `importar_diarias_fiplan` e `fin_nome_comparavel` só para
  `authenticated`); testes no bloco "Financeiro: diárias do FIPLAN" de `scripts/db/testar-rls.sql`.
- A migração `20261112090000` (histórico de mudanças dos convênios federais) entrou no mapa (`fin_tg_mudancas`,
  classe `trilha` com `leitura=financeiro.convenios.visualizar`), no schema regenerado e no
  `overlay/40_privilegios.sql` (`fin_tg_mapa` e `fin_tg_registrar_diferencas` sem EXECUTE;
  `pode_atualizar_convenios_federais` só para `authenticated`); testes no bloco "Financeiro: convênios federais,
  histórico de mudanças" de `scripts/db/testar-rls.sql` ([detalhe](./BANCO_DE_DADOS.md)).
- A migração `20261111090000` refez `fin_tg_carregar` com `DELETE ... WHERE true` (o `pg_safeupdate` do PostgREST
  recusa DELETE sem WHERE); schema regenerado e verificação nova no bloco "Financeiro: convênios federais do
  Transferegov" de `scripts/db/testar-rls.sql` ([detalhe](./BANCO_DE_DADOS.md)).
- Os convênios federais (migração `20261105090000`) entraram no mapa (`fin_tg_propostas`, `fin_tg_emendas`,
  `fin_tg_convenios`, `fin_tg_movimentos` e `fin_tg_sincronizacoes`, classe `trilha` com
  `leitura=financeiro.convenios.visualizar`), no schema regenerado, no catálogo (a permissão nova e as concessões aos
  papéis) e no `overlay/40_privilegios.sql` (sem escrita para `authenticated`, `fin_tg_carregar` só para
  `service_role`); testes no bloco "Financeiro: convênios federais do Transferegov" de `scripts/db/testar-rls.sql`
  ([detalhe](./BANCO_DE_DADOS.md)).
- Os contratos, entrega C1 (migração `20261104090000`), mudaram no mapa: `contratos` e `itens_contrato` saíram da classe
  `modulo` para `permissao` (gravar com `contratos.criar` ou `contratos.editar`, apagar com `editar`) e entrou
  `contrato_responsaveis` na mesma classe; schema regenerado, catálogo sem mudança (as permissões já existiam) e
  `overlay/40_privilegios.sql` (gatilhos sem EXECUTE; `contrato_pode_gravar`, `contrato_buscar_servidores` e
  `contratos_importar_planilha` só para `authenticated`); testes no bloco "Contratos C1" de `scripts/db/testar-rls.sql`
  ([detalhe](./BANCO_DE_DADOS.md)).
- Os contratos, entrega C2 (migração `20261114090000`), trocaram `aditivos_contrato` por `contrato_alteracoes` no mapa
  (classe `permissao`: ler com o módulo, gravar e apagar com `contratos.editar`); schema regenerado, catálogo sem
  mudança, `overlay/40_privilegios.sql` (gatilhos `contrato_alteracoes_preparar` e `contrato_alteracoes_aplicar` sem
  EXECUTE; `contratos_meus_vencimentos` só para `authenticated`) e dados de demonstração refeitos em
  `contrato_alteracoes` (os valores e fins atuais saem delas); testes no bloco "Contratos C2" de
  `scripts/db/testar-rls.sql` ([detalhe](./BANCO_DE_DADOS.md)).
- As passagens aéreas, entrega 3 (migração `20261103090000`), entraram no mapa (`passagem_faturas`,
  `passagem_fatura_itens` e `passagem_contrato_empenhos`, classe `permissao` com escrita e exclusão por
  `contratos.passagens.financeiro` e leitura por `visualizar`, `editar` ou `financeiro`), no schema regenerado, no
  catálogo (permissão nova e concessões, copiadas da regeneração) e no `overlay/40_privilegios.sql` (inclui
  `passagem_empenho_candidato` sem EXECUTE e `passagem_salvar_fatura` para `authenticated`); testes no bloco
  "PASSAGENS FATURAS" de `scripts/db/testar-rls.sql`.
- As passagens aéreas, entrega 2 (migração `20261101090000`), entraram no mapa (`passagem_anexos`, classe `permissao`
  com leitura por `visualizar` ou `editar`), no schema regenerado, no `overlay/40_privilegios.sql` e no
  `overlay/50_storage.sql` (bucket privado `passagens`); testes no bloco "PASSAGENS PRESTAÇÃO" de
  `scripts/db/testar-rls.sql`.
- O localizador de processos do SEI (migração `20261102090000`, só funções: `sei_normalizar`, `texto_busca`,
  `localizar_processos_sei` e `processos_parados`) entrou no `schema/01_pre_data.sql` e no `overlay/40_privilegios.sql`
  (`EXECUTE` só para `authenticated`); sem tabela nova nem mudança no `rls/mapa.csv`; testes no bloco "LOCALIZADOR" de
  `scripts/db/testar-rls.sql` ([detalhe](./BANCO_DE_DADOS.md)).
- As passagens aéreas, entrega 1 (migração `20261031090000`), entraram no mapa (`passagem_beneficiarios`,
  `passagem_pedidos`, `passagem_passageiros`, `passagem_trechos` e `passagem_cotacoes`, classe `permissao` com
  `contratos.passagens.editar`; `passagem_historico`, classe `trilha`), no schema do baseline regenerado, no catálogo
  (as duas permissões) e no `overlay/40_privilegios.sql`; testes no bloco "PASSAGENS" de `scripts/db/testar-rls.sql`
  ([detalhe](./BANCO_DE_DADOS.md)).
- A pesquisa de preços, entrega 1 (migração `20261106090000`), entrou no mapa (`pesquisas_precos`,
  `pesquisas_precos_itens` e `pesquisas_precos_amostras`, classe `permissao` com `compras.pesquisa_precos.editar`), no
  schema do baseline regenerado, no catálogo (as duas permissões e a concessão aos papéis que têm `compras.criar`) e no
  `overlay/40_privilegios.sql` (EXECUTE do gatilho `pesquisa_precos_conferir` revogado); testes no bloco "Compras:
  pesquisa de preços" de `scripts/db/testar-rls.sql` ([detalhe](./BANCO_DE_DADOS.md)).
- A pesquisa de preços, entrega 2 (migração `20261110090000`), entrou só no schema do baseline regenerado
  (`pesquisas_precos_itens.pca_item_id` e `preco_comparado`, índice e FK); mapa, catálogo e overlays sem mudança;
  testes novos no bloco "Compras: pesquisa de preços" de `scripts/db/testar-rls.sql` ([detalhe](./BANCO_DE_DADOS.md)).
- Os processos de contratação, entrega 1 (migração `20261029090000`), entraram no mapa (`processo_andamentos`, classe
  `permissao` com `compras.processos.editar`), no schema do baseline regenerado, no catálogo (as duas permissões e a
  concessão aos papéis `admin` e `manager`) e no `overlay/40_privilegios.sql`; testes no bloco "Compras: processos de
  contratação" de `scripts/db/testar-rls.sql` ([detalhe](./BANCO_DE_DADOS.md)).
- O PCA, entrega 1 (migração `20261028090000`), entrou no mapa (`pca_planos`, `pca_tetos`, `pca_itens` e as `cat_*`,
  classe `permissao` com `compras.pca.editar`; `pca_historico`, classe `trilha`), no schema do baseline regenerado, no
  catálogo (as duas permissões e a concessão aos papéis `admin` e `manager`) e no `overlay/40_privilegios.sql`; testes
  no bloco "Compras: PCA" de `scripts/db/testar-rls.sql` ([detalhe](./BANCO_DE_DADOS.md)).
- A conciliação mensal (migração `20261026090000`) entrou no mapa (`fin_conciliacoes_mensais` e
  `fin_conciliacao_itens`, classe `permissao` com `pagamento.conciliar`), no schema do baseline regenerado e no
  `overlay/40_privilegios.sql` (EXECUTE das RPCs só para `authenticated`; trigger fora da API); testes no bloco
  "Financeiro: conciliação mensal" de `scripts/db/testar-rls.sql` ([detalhe](./BANCO_DE_DADOS.md)).
- Os favorecidos e a lista de bancos (migração `20261025090000`) entraram no mapa (`fornecedores` com
  `coletor=financeiro:select|insert|update`; `bancos_cnab` na classe `catalogo`), no schema do baseline regenerado e no
  catálogo (`bancos_cnab` nas `SEMENTES`, 19 bancos). `testar-rls.sql` não escolhe mais o módulo do coletor como
  "módulo alheio", e `validar-baseline.sh`/`gerar-baseline.sh` deixam fora do dump as sequências `rh_protocolo_seq_AAAA`,
  criadas sob demanda quando uma migração grava em tabela com trilha ([detalhe](./BANCO_DE_DADOS.md)).
- As permissões do patrimônio e das unidades (P14 entrega 4, migração `20261023100000`) entraram no mapa com os sufixos
  novos `altera=` e `coletor=` do `scripts/db/gerar-rls.mjs` (documentados em `supabase/baseline/README.md`), no schema
  do baseline regenerado (gatilho `trg_bens_proteger_colunas`, `fn_atualizar_estatisticas_campanha` SECURITY DEFINER) e
  no catálogo (`patrimonio.editar` para admin e manager); EXECUTE retirado das duas funções no overlay 40; testes no
  bloco "Patrimônio: permissões (P14 entrega 4)" de `scripts/db/testar-rls.sql` ([detalhe](./BANCO_DE_DADOS.md)).
- A parte patronal da folha e o INSS truncado por faixa (migração `20261021100000`) entraram no schema do baseline
  regenerado (`folhas_pagamento.total_rat`, CHECK `parametros_folha_encargos_check`, `calcular_inss_servidor` e
  `processar_folha_pagamento` novos, sem mudança de privilégio); testes no bloco "FOLHA: parte patronal e INSS por
  faixa" de `scripts/db/testar-rls.sql` ([detalhe](./BANCO_DE_DADOS.md)).
- O retorno do banco da remessa da folha (migração `20261021090000`) entrou no schema do baseline regenerado; o
  EXECUTE de `registrar_retorno_remessa` só para `authenticated` no overlay 40; testes no bloco "FOLHA: retorno do
  banco da remessa" de `scripts/db/testar-rls.sql` ([detalhe](./BANCO_DE_DADOS.md)).
- A remessa de pensão alimentícia e o número inicial por conta (migração `20261020090000`) entraram no schema do
  baseline regenerado; sem privilégio novo; testes no bloco da remessa de `scripts/db/testar-rls.sql`
  ([detalhe](./BANCO_DE_DADOS.md)).
- A trilha `audit_log_licitacoes` segue o sigilo do processo do workflow (classe `trilha` com `extra=sigilo_workflow`
  no mapa, migração `20261015100000`; [detalhe](../supabase/baseline/README.md)).
- `fotos_vistoria_inventario` é da classe `preservar` do mapa de RLS: as policies vêm da migração
  `20261009160000` pelo replay, não do gerador ([detalhe](../supabase/baseline/README.md)).
- A migração `20260110184920` e o histórico git contêm 74 nomes de servidores (CPF placeholder); o baseline não
  os leva, mas o repositório os mantém até uma decisão sobre limpeza de histórico.

## 9. Ambiente de teste com dados fictícios

Para testar as telas sem tocar na produção, monte **outro** Supabase (no Coolify da VPS, ao lado dos que já rodam)
pelos passos 3 a 5 e depois encha-o com `supabase/baseline/dados-teste.sql`: uma instituição inventada com unidades,
cargos, servidores com provimento, lotação e portaria de nomeação publicada, tabelas de INSS e IRRF e parâmetros da
folha de exemplo, frequência de setembro fechada, férias, licenças, viagens, bens, almoxarifado, fornecedores,
licitações, contratos, programa, ação e dotações do orçamento, solicitações e empenhos, riscos, demandas da ASCOM,
notícias, programas, federações, árbitros, escolas com gestores e reuniões. Nomes, CPFs, CNPJs e e-mails
(`@exemplo.test`) são inventados.

```bash
# depois do aplicar.sh (passo 4) e do bootstrap-admin.sql com o e-mail do login de teste (passo 5)
PGPASSWORD='...' psql "postgresql://postgres@127.0.0.1:5432/postgres" \
  -v confirmo=banco_de_teste -v email='login-de-teste@exemplo.test' -f supabase/baseline/dados-teste.sql
```

- **Atalho pela VPS:** `bash scripts/db/montar-ambiente-teste.sh <container-do-db-de-teste> <email>` faz tudo de uma vez
  rodando o `psql` dentro do container (sem expor porta): baseline, login de teste já confirmado no Auth (senha
  aleatória mostrada só no terminal), `bootstrap-admin.sql` e este script. Recusa o container `supabase-db` (o da
  produção) e banco com tabela em `public`. No Coolify o container é `supabase-db-<uuid do serviço>`.
- **Travas:** sem `-v confirmo=banco_de_teste` o script não roda, e ele recusa banco que já tenha servidor, fornecedor
  ou bem (a produção tem). Uma transação só: se algo falhar, nada fica gravado.
- `email` liga o login de teste ao servidor fictício "Usuário de Teste" (lotado no RH), para as telas que pedem
  servidor vinculado.
- A folha de **setembro/2026** processa sem inconsistência (conferido num banco do baseline com o shim, como o
  login de teste); **outubro** fica sem frequência, para testar o lançamento.
- O front de teste é outra aplicação do Coolify com o mesmo `Dockerfile` e o `.env` apontando para o Supabase de
  teste (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` dele). Ela não entra no `deploy-front.yml`: o
  CI publica só a produção.
- `solicitacoes_sic` fica sem exemplo no `dados-teste.sql`: o trigger `registrar_historico_lai` lê uma coluna que a
  tabela não tem e recusa o INSERT (pendência no [ROADMAP](./planejamento/ROADMAP.md#backlog-fora-do-plano)). A
  demonstração abaixo contorna desligando só esse trigger dentro da própria transação.

### 9.1 Demonstração geral (`supabase/baseline/dados-demo/`)

Para apresentar o sistema, os arquivos de `supabase/baseline/dados-demo/` completam o banco de teste com dados **com
cara de reais** (nomes completos, endereços de Boa Vista, objetos e históricos como os do SEI e do FIPLAN, números SEI
`18101.xxxxxx/2026-xx`), sem nenhum dado pessoal real: CPFs, CNPJs, PIS e telefones são inventados com dígito válido
e os e-mails são `@exemplo.test`. A identidade da instituição (`dados_oficiais`) vem do perfil do tenant.

| Arquivo | O que preenche |
|---|---|
| `00_realismo.sql` | reescreve os textos do `dados-teste.sql` (tira "fictício"/"exemplo"), põe PIS nos servidores e cria as unidades CI, CPL, NuAlm e NuPat que os modelos de processo citam |
| `01_rh.sql` | quadro de vagas, cessões, designações, ponto e frequência de jan. a out., férias, licenças, viagens, portarias da ficha |
| `02_folha.sql` | folhas de julho a outubro e do 13º em situações diferentes, calculadas por `processar_folha_pagamento`; consignações, pensões, dependentes, remessas e retornos CNAB, eSocial, atos remuneratórios |
| `03_financeiro.sql` | QDD, ciclo da despesa (solicitação, empenho, liquidação, pagamento, OBN600), conciliação e fechamento mensal, receitas, adiantamentos, restos a pagar, importações do FIPLAN, PCA e catálogo |
| `04_compras_processos.sql` | licitações em cada fase, contratos com itens, medições e aditivos, atas de registro de preço, comissões, processos administrativos com tramitação |
| `05_patrimonio.sql` | movimentações, manutenções, ocorrências, baixas, campanhas de inventário com coletas e conciliação, requisições e estoque, agenda das unidades locais |
| `06_governanca_admin.sql` | controles internos, checklists, matriz RACI, denúncias, pedidos de LAI, editais, identidade da instituição, envios, acesso total do login de teste |
| `07_comunicacao_portal.sql` | notícias, banners, galerias, demandas da ASCOM, federações, árbitros, escolas e gestores, reuniões com participantes, avisos e portal |
| `08_complementos.sql` | termos de cessão das unidades locais e cadastros de RH que dependem da configuração institucional |

```bash
# na VPS, depois do dados-teste.sql (o montar-ambiente-teste.sh já chama este script no fim)
bash scripts/db/carregar-demo-teste.sh <container-do-db-de-teste>
```

- Cada arquivo é uma transação, exige `-v confirmo=banco_de_teste` e recusa banco sem o `dados-teste.sql`; o mesmo
  módulo não entra duas vezes (o script pula o que já está carregado, então dá para rodar de novo depois de uma falha).
- Onde o próprio sistema calcula (folha, conciliação, remessas, importações do FIPLAN), os arquivos chamam as funções
  do banco em vez de gravar o resultado à mão. Os triggers com defeito encontrados no caminho (LAI, sub-empenho,
  liquidação) são desligados só durante o INSERT, com comentário, e estão no
  [ROADMAP](./planejamento/ROADMAP.md#backlog-fora-do-plano).
- Ficam de fora: arquivos no Storage (fotos de vistoria, anexos e remessas mostram "arquivo indisponível") e tudo
  o que depende das Edge Functions, que o ambiente de teste não tem.
