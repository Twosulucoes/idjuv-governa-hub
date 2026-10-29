# Edge Functions (Supabase / Deno)

As Edge Functions ficam em `supabase/functions/<nome>/index.ts` e rodam no
runtime **Deno** do Supabase. Servem para operações que **não podem ser feitas
com a chave anônima no client** — tipicamente porque exigem a *service role*
(privilégios de admin) ou integram serviços externos/segredos.

São invocadas do front via `supabase.functions.invoke('<nome>', { body })`.

## Funções existentes

Todas exigem login: na VPS o roteador do container recusa chamada sem JWT válido (`VERIFY_JWT=true`, conferido de
fora em 2026-10-15: sem cabeçalho e com token malformado, 401) e `supabase/config.toml` declara `verify_jwt = true`
para cada uma. Função nova entra nos dois lugares e confere usuário e permissão no próprio código.

Aposentada no P06 (2026-10-15): `backup-offsite` (backup antigo em JSON para outro projeto Supabase, com a tela
`/admin/backup`). O backup oficial é o da VPS ([BACKUP.md](./BACKUP.md)). As tabelas que ela usava (`backup_config`,
`backup_history`, `backup_integrity_checks`) foram apagadas no P13 pela migração
`supabase/migrations/20261018100000_remove_tabelas_backup_aposentado.sql` ([BANCO_DE_DADOS.md](./BANCO_DE_DADOS.md#limpeza-do-p13-18102026)).

| Função | Propósito |
|---|---|
| `admin-create-user` | Cria usuário no Auth + perfil/permissões (requer service role). Com `convidar: true` manda o e-mail de convite (a pessoa cria a própria senha); com `password`, cria já confirmado e sem e-mail. |
| `admin-reset-password` | Reseta/redefine senha de um usuário pela administração. |
| `delete-user` | Exclui usuário do Auth e dados associados. |
| `enviar-convite-reuniao` | Envia convites de reunião aos participantes por e-mail ou WhatsApp (pelo núcleo `_shared/envio`). |
| `enviar-notificacao` | Disparos pela configuração de envio da instância. Hoje só a ação `teste` (exige `admin.envios.configurar`). |
| `download-frequencia` | Devolve URL assinada (1 h) do arquivo de um pacote de frequência do bucket privado `frequencias`, ou só os dados do pacote (`action=info`). Exige o módulo `rh` e `rh.frequencia.visualizar` (ver abaixo). |
| `database-schema` | Inspeciona o schema do banco (apoia a tela `DatabaseSchemaPage`). |
| `cpsi-ai-assistant` | Assistente de IA do antigo formulário CPSI. A tela saiu na onda 5 do P23 (DFD/ETP/TR são do SEI); a função segue publicada sem chamador no front até a decisão D2 do roadmap. |
| `conciliacao-ia-sugestoes` | Sugere casamentos para as pendências da conciliação mensal (aba "Fechamento mensal") pelo Gemini. Não grava nada: a tela mostra cada sugestão e o usuário aceita ou recusa. Exige o módulo `financeiro` e `pagamento.conciliar` (ver abaixo). |
| `catalogo-compras` | Ponte com o catálogo CATMAT/CATSER do portal de dados abertos do Compras.gov.br para o PCA: baixa os tipos de material e os serviços para o banco, lista os itens de um tipo de material, grava o item escolhido e lê as naturezas de despesa que o catálogo indica. Exige o módulo `compras` e a permissão do PCA (ver abaixo). |
| `pesquisa-precos` | Pesquisa de preços de Compras: lê os preços praticados do Compras.gov.br (módulo Pesquisa de Preço da API de dados abertos) pelo código do CATMAT/CATSER e os resultados homologados de uma compra do PNCP. Só leitura, sem service role: a tela grava os preços escolhidos. Exige o módulo `compras` e a permissão da pesquisa de preços (ver abaixo). |
| `bb-api` | APIs de leitura do Banco do Brasil: `status` da conexão, `extrato` (API Extratos v2, grava em `fin_extrato_lancamentos`) e `validar-conta` (API Validação de Contas v1). Exige o módulo `financeiro` e `pagamento.conciliar` (ver abaixo). |
| `transferegov` | Recebe da rotina diária do GitHub Actions o que o Transferegov tem do CNPJ da instituição e troca o espelho `fin_tg_*` pela RPC `fin_tg_carregar`. Não é chamada pelo navegador: exige o segredo `TRANSFEREGOV_TOKEN` (ver abaixo). |

### Envio de e-mail e WhatsApp (`_shared/envio`)

O núcleo `supabase/functions/_shared/envio/` lê a configuração da instância (`config_envio`, preenchida
pelo cliente em `/admin/envios`) e a credencial do Vault pela RPC `config_envio_servidor`, que só a
service role executa. Funções: `enviarEmail` (SMTP via denomailer ou Resend), `enviarWhatsAppTemplate`
(Meta Cloud API, só templates aprovados), `carregarIdentidade` + `montarEmailInstitucional` (cabeçalho e
rodapé com a marca do cliente) e o registro em `envios_log` (sem corpo da mensagem).

Quem chama autentica o usuário, checa a permissão da própria ação e monta o conteúdo no servidor; o
núcleo não deve virar relay de texto livre. Sem configuração ativa, e-mail cai em `RESEND_API_KEY`/
`RESEND_FROM` e o convite por WhatsApp volta ao link `wa.me`. Um novo uso (ex.: avisos) entra como ação
nova em `enviar-notificacao`, recebendo o id do registro e checando a permissão do domínio.

### CORS e `ALLOWED_ORIGINS` (`_shared/cors.ts`)

Desde o P12 (17/10/2026), todas as funções montam o CORS por `montarCors` (`supabase/functions/_shared/cors.ts`),
que falha fechado: sem `ALLOWED_ORIGINS`, a resposta sai sem `Access-Control-Allow-Origin` (antes caía em `*`) e o
navegador bloqueia a chamada; com a lista (separada por vírgula), a origem que está nela é ecoada. Chamada servidor
a servidor não depende de CORS. Por isso `ALLOWED_ORIGINS` é **obrigatória em toda instância**, no ambiente do
serviço de funções: em produção, os dois endereços do front, `https://idjuv.online,https://app.idjuv.online` (site
e sistema; sem o do sistema, as telas internas que chamam função falham no navegador); em desenvolvimento, a origem
local (ex.: `http://localhost:8080`).

### Erros devolvidos ao cliente

`admin-reset-password`, `admin-create-user`, `delete-user` e `database-schema` devolvem mensagem genérica ao
navegador e deixam o detalhe só no log (P12). `delete-user` sem token responde `401`. `admin-reset-password` grava
na trilha "usuário `<id>`", sem o e-mail; `cpsi-ai-assistant` loga só o status e o tamanho da resposta.

### Gestão de usuários (`admin-create-user`, `admin-reset-password`, `delete-user`)

As três exigem o **papel** `admin` (`is_admin_user`, que também exige perfil ativo), não só a permissão
`admin.usuarios`: o papel `user` recebe essa permissão quando tem o módulo `admin`, e com ela
`admin-create-user` devolvia o UUID de qualquer e-mail (e reativava o perfil), `admin-reset-password` devolvia uma
senha temporária e `delete-user` apagava a conta de qualquer não-administrador. A senha temporária sai de
`crypto.getRandomValues`. Desde a Onda 2 da revisão de permissões (10/10/2026), um administrador não redefine a
senha de **outro** administrador (só a recuperação por e-mail, que chega ao dono) nem exclui um administrador
(`delete-user` recusa qualquer alvo com o papel `admin`; para excluir, tira-se o papel antes, o que fica na
trilha de `user_roles`). Todo reset de senha grava `audit_logs` (`password_reset`, quem fez e para quem, nunca a senha).
`database-schema` também passou a exigir o papel `admin` (antes bastava `admin.usuarios`).

### Assistente de IA (`cpsi-ai-assistant`)

Exige sessão, o módulo `compras` e respeita limites: 10.000 caracteres por campo, 60.000 no pedido inteiro,
16.384 tokens de resposta (com 2.048 de raciocínio) e 30 chamadas por usuário por hora. Resposta cortada pelo
teto vira erro claro (422). Erros internos não vão para o navegador.

### Sugestão de casamentos da conciliação (`conciliacao-ia-sugestoes`)

Exige sessão, o módulo `financeiro` e `pagamento.conciliar` (a mesma permissão que grava a conciliação, conferida com
o token do próprio usuário). Recebe só as pendências que sobraram das regras automáticas (até 400, com id curto
`p0`, `p1`…, data, lado, natureza, tipo, documento, histórico de até 200 caracteres e valor em centavos), apaga CPF e
CNPJ do histórico (também no navegador, `src/lib/conciliacao/sugestoes.ts`) e pede ao Gemini (`GEMINI_API_KEY`,
`GEMINI_MODEL`, as mesmas do assistente do CPSI; sem `GEMINI_MODEL`, usa `gemini-flash-latest`) grupos que se correspondem, em JSON com schema. Devolve só os grupos
que fecham (débitos = créditos), com ids conhecidos e cada id uma vez; a tela confere de novo e o aceite passa pelo
casamento manual, com o motivo da IA na justificativa ("Sugestão da IA aceita: …"). Limite: 20 chamadas por usuário
por hora (cota `conciliacao_ia`), 8.192 tokens de resposta com 4.096 de raciocínio. O log leva só status, tamanho e
contagens (pendências, grupos devolvidos e válidos). Antes da IA, a tela roda a busca de somas no navegador
(`sugestoesPorSoma`) e só manda para a função o que sobrou.

**Tempo limite da IA** (27/10/2026): as duas funções chamam o Gemini por `fetchComTempoLimite`
(`supabase/functions/_shared/tempoLimite.ts`), com 40 s até chegarem os cabeçalhos da resposta. Passou disso, devolvem
`504` com "A IA não respondeu a tempo" em vez de ficar presas até o runtime derrubar a requisição (o que aconteceu em
23/10). O relógio para quando a resposta começa, para não cortar a revisão em streaming do assistente.

No self-hosted, `GEMINI_API_KEY` e `GEMINI_MODEL` vão no `.env` do docker compose do Supabase e só valem depois de
`docker compose up -d functions` (um `docker restart` não relê o `.env`). Chave nova do AI Studio pode receber 404 em
modelo antigo (`gemini-2.5-flash`): use o apelido `gemini-flash-latest`.

### Catálogo de compras (`catalogo-compras`)

Exige sessão e o módulo `compras`, conferidos com o token do próprio usuário. Ações: `sincronizar` (uma página de 500
tipos de material ou serviços, gravada com upsert pelo código em `cat_material_pdms`/`cat_servicos`; na última página
grava o total em `cat_sincronizacoes`) e `gravar_item` (grava em `cat_material_itens` o item escolhido e o tipo de
material dele, se faltar) exigem `compras.pca.editar`; `itens_pdm` (itens ativos de um tipo de material, até 500, sem
gravar) e `naturezas` (naturezas de despesa que o catálogo indica para um tipo de material ou serviço, até 500, sem
gravar; o front descarta as inativas, as de exercícios anteriores e as que o estado não tem, em
`src/lib/pca/naturezaCatalogo.ts`) aceitam também `compras.pca.visualizar`; `itens_pdm` aceita ainda `compras.pesquisa_precos.editar`, para escolher o
item do CATMAT no item da pesquisa de preços. Só chama `https://dadosabertos.compras.gov.br` (host fixo em
`portal.ts`, sem redirecionamento, 20 s por chamada); portal fora do ar vira `502` com mensagem em português. Público e
sem chave: não há segredo novo. A tela faz o laço de páginas e mostra o progresso. O log leva só ação, tipo, página e
quantidade gravada. As funções puras (`portal.ts`) têm teste vitest.

### Pesquisa de preços (`pesquisa-precos`)

Exige sessão, o módulo `compras` e `compras.pesquisa_precos.visualizar` ou `compras.pesquisa_precos.editar`,
conferidos com o token do próprio usuário (sem service role; não grava nada). Ações: `precos_compras` (uma página de
até 500 preços de `1_consultarMaterial` ou `3_consultarServico` do módulo Pesquisa de Preço, por item do catálogo ou
tipo de material, no período pedido; a tela faz o laço de páginas, até 6), `pncp_compra` (dados da compra e itens, pelo
CNPJ, ano e sequencial do número de controle) e `pncp_resultados` (preços homologados de um item). Cada preço volta com
a fonte (órgão, UASG, UF, compra, data, fornecedor, link) e um `idExterno` estável, que impede gravar a mesma linha duas
vezes no item. Só chama `https://dadosabertos.compras.gov.br` e `https://pncp.gov.br` (hosts fixos em `portal.ts`, sem
redirecionamento, 25 s por chamada); portal fora do ar ou resposta fora do formato vira `502` com mensagem em
português, compra inexistente `404`. Público e sem chave: não há segredo novo. O log leva só ação, tipo, página e quantidade. As
funções puras (`portal.ts`) têm teste vitest.

### Convênios federais (`transferegov`)

Ponte entre a rotina `.github/workflows/transferegov.yml` e o banco. Só `POST`; sem CORS (não é para o navegador).
A rotina manda a chave anon como `Bearer` (o roteador exige JWT) e o segredo no cabeçalho `x-transferegov-token`,
comparado em tempo constante (`supabase/functions/transferegov/token.ts`, com testes). Sem `TRANSFEREGOV_TOKEN` no
`.env` das funções, ou com menos de 32 caracteres, a função recusa tudo (`401`). Ações:

- `cnpj`: devolve o CNPJ da Configuração do cliente (`dados_oficiais`), para a rotina não ter nome de cliente;
  `409` se não estiver cadastrado.
- `carregar`: confere o formato e os limites de linhas e chama `fin_tg_carregar` com a service role; recusa da RPC
  vira `422` com a mensagem dela. Corpo acima de 10 MB: `413`. O log só tem contagens.

Configuração: [INTEGRACOES_EXTERNAS.md](./INTEGRACOES_EXTERNAS.md) §4.5.

### Convite de reunião (`enviar-convite-reuniao`)

Só o criador da reunião ou um administrador envia, e desde o P12 ele precisa ter também o módulo `gabinete` ou
`admin`, os mesmos que a RLS da agenda aceita (conferido no banco com o token do próprio usuário). Limites contra uso como disparador de mensagens com a marca
do órgão: 50 participantes por chamada, 200 convites por usuário por hora (reenvios contam), mensagem livre de
até 2.000 caracteres e nenhum link (com esquema, `www.` ou domínio nu) no texto final de cada destinatário,
no local, na pauta, na assinatura, no título da reunião ou no nome de cada participante além do link da própria
reunião (o título e os nomes são conferidos sempre). O link `wa.me` só é gerado para participante externo (número
digitado na reunião); o servidor só recebe pela API oficial e, se o envio não sai, o resultado é sempre "Não
enviado", sem revelar se ele tem telefone ou e-mail cadastrado. CORS por `ALLOWED_ORIGINS`, como as
demais. Pendente (modelo novo): o módulo `gabinete` ainda pode trocar o `created_by` de uma reunião pela API,
e o link da reunião é livre (uma lista de domínios por instância fecharia isso).

### Cota de uso (`consumir_cota_uso`)

As duas funções acima usam a RPC `consumir_cota_uso(usuario, tipo, quantidade, limite, modulo, descricao)`
(migração `supabase/migrations/20261010233100_onda2_cota_uso.sql`): conta o uso da última hora e registra em `audit_logs`
(`entity_type` = tipo, `metadata.quantidade`) na mesma transação, sob lock por usuário, então pedidos em
paralelo não furam o limite. Só a service role executa.

Desde o P12 a RPC também limita `bb-api` na ação `validar-conta` (60 por usuário por hora, tipo `bb_validar_conta`)
e o envio de teste de `enviar-notificacao` (20 por usuário por hora, tipo `envio_teste`). A sugestão de casamentos
da conciliação (`conciliacao-ia-sugestoes`) usa o tipo `conciliacao_ia` (20 por usuário por hora).

Trilha (onda E1, [`BANCO_DE_DADOS.md`](./BANCO_DE_DADOS.md#trilha-de-auditoria-e-servidor-responsável-do-rh--onda-e1)):
as gravações dessas funções rodam pela service role e entram em `audit_logs` com origem `sistema`, sem autor. Por
isso `admin-create-user` grava uma linha complementar (módulo `admin`, `entity_type = 'user'`, ação `create`, ou
`update` quando só garante o perfil de um usuário que já existia) com o administrador que pediu, e `delete-user`
grava outra (`update`, etapa `remover_acessos`) antes de remover módulos, papéis e o vínculo com o servidor, além da
linha `delete` que já gravava depois da exclusão. As linhas novas não levam e-mail nem outro dado pessoal (a linha
`delete` antiga ainda leva o e-mail e o nome em `description`/`before_data`). `delete-user` não é atômica: se a
exclusão no Auth falhar, o usuário fica sem módulos, papéis e vínculo.



### Autorização do `download-frequencia` (Onda B / B3)

A função lê `frequencia_pacotes` e assina URLs com a service role, então, desde a migração
`supabase/migrations/20261010210000_onda_b_rh_storage.sql` (**em PR rascunho**):

- exige `Authorization: Bearer` com token válido (`401` sem ele);
- antes de qualquer leitura com a service role, confere no banco, com o id do usuário do token,
  `can_access_module(rh)` e `has_permission_code(rh.frequencia.visualizar)` (o mesmo código da rota
  `/rh/frequencia/pacotes`). As duas funções já exigem perfil ativo. Sem uma delas, ou com erro na checagem,
  responde `403` genérico (falha fechada);
- só assina caminho relativo seguro (sem `/` inicial, segmento `.` ou `..`, `%`, `\`, `?` ou `#`), a mesma regra do
  CHECK de `arquivo_path` ([BANCO_DE_DADOS.md](./BANCO_DE_DADOS.md)); caminho inseguro responde `404` genérico;
- o log identifica o usuário só pelo `user.id` (antes gravava o e-mail) e não leva token, link nem caminho;
- **trilha obrigatória (onda E2)**: antes de devolver a URL, grava em `audit_logs` `action = 'download'`,
  `module_name = 'rh'`, `entity_type = 'frequencia_pacotes'`, `entity_id` = id do pacote, `user_id` de quem pediu e
  metadados só com `periodo`, `tipo` e `fonte = 'download-frequencia'` (sem nome de arquivo; o banco completa
  servidor, origem e contexto). Se a gravação falhar, a URL não sai: `500` genérico ("Erro ao gerar link de
  download") e o `console.error` só com o código do erro. Antes gravava sem módulo (a linha não aparecia na trilha
  do RH), com `entity_type = 'frequencia_pacote'` e o nome do arquivo, e ignorava a falha.

Desde o P12 a função deixou o `Access-Control-Allow-Origin: *` fixo e usa `montarCors`, como as demais (seção
"CORS e `ALLOWED_ORIGINS`"). O ZIP do pacote nunca é gravado hoje, então o download
fica sem arquivo até isso existir. Regras de acesso completas em
[RBAC_PERMISSOES.md](./RBAC_PERMISSOES.md#arquivos-do-rh-e-download-de-frequência-onda-b--b3).

### Banco do Brasil (`bb-api`)

Spec: [`2026-10-11-financeiro-fiplan-banco-design.md`](./superpowers/specs/2026-10-11-financeiro-fiplan-banco-design.md)
(Etapa 4). Só leitura: pagamento pela API (Pagamentos em Lote/PagBB) está fora.

- **Autorização**: `Authorization: Bearer` obrigatório (`401`); a RPC `pode_conciliar_pagamentos()` roda como o
  próprio usuário (perfil ativo, módulo `financeiro` e `pagamento.conciliar`) antes de criar o cliente com a service
  role. Sem permissão, `403`; erro na checagem, `500` (falha fechada).
- **Ações** (`POST`, body `{acao, ...}`):
  - `status` → `{ambiente, configurado: {BB_*: boolean}, mtls_pronto, token: {extrato, validacao}}`: diz quais
    segredos existem (nunca o valor) e tenta obter o token OAuth de cada escopo.
  - `extrato` `{conta_bancaria_id, data_inicio, data_fim}` (`YYYY-MM-DD`, até 31 dias): lê agência e conta em
    `fin_contas_bancarias` (só banco `001`), chama `GET /conta-corrente/agencia/{agencia}/conta/{conta}` da API
    Extratos v2 com mTLS, paginando (200 lançamentos por página e até 50 chamadas: acima disso responde `422` sem gravar nada e
    pede um período menor) até `numeroPaginaProximo = 0`, descarta as linhas de saldo e grava
    pela RPC `registrar_extrato_bb` (só service role; idempotente). Devolve `periodo`, `paginas`,
    `recebidos_do_banco`, `recebidos`, `inseridos`, `existentes` e `conciliados` (débitos casados com
    `fin_pagamentos`). A API não traz id do lançamento: `identificador_bb` junta data, lote, documento, histórico,
    valor, sinal e a ordem entre lançamentos idênticos do dia.
  - `validar-conta` `{movimento_id, banco?, agencia, conta}` → `{contaAtiva, titularConta}` (API Validação de Contas
    v1, `GET /contas/{agencia}-{conta}/situacao?cpfCnpj=`; sem mTLS). O CPF/CNPJ é lido no servidor do
    `favorecido_documento` do movimento (`fin_movimentos_bancarios`); o corpo com `cpf_cnpj`/`documento` é recusado
    (`400`), assim como `banco` diferente de `001` e movimento sem CPF/CNPJ (`404` se o movimento não existe). Cada
    consulta (ok ou falha do BB) entra em `audit_logs` pela service role: `action = 'view'`, `module_name =
    'financeiro'`, `entity_type = 'fin_movimentos_bancarios'`, `entity_id` = movimento, `user_id` = quem consultou e
    `metadata` `{fonte, acao, ambiente, resultado, conta_ativa, titular_conta}` (ou `etapa`/`status_bb`/`codigo` na
    falha) — sem documento, agência ou conta. Se a trilha não grava, o resultado não é devolvido (`500`).
- **Segredos** (por instância, `supabase secrets set`; nada no banco nem no front): `BB_AMBIENTE`
  (`homologacao`|`producao`, padrão `homologacao`), `BB_CLIENT_ID`, `BB_CLIENT_SECRET`, `BB_APP_KEY`, `BB_CERT_PEM` e
  `BB_KEY_PEM` (certificado e chave do cliente em PEM para o mTLS da API de Extratos; `\n` literal é aceito no lugar
  da quebra de linha). Token: OAuth2 `client_credentials` com Basic auth (`oauth.hm.bb.com.br` /
  `oauth.bb.com.br`), escopos `extrato-info` e `validacao-contas.info`, guardado em memória até expirar. A chave da
  aplicação vai na query como `gw-dev-app-key` em homologação e `gw-app-key` em produção (conferir no portal do BB na
  homologação).
- **Erros**: falha do BB responde `502` com `etapa` (`token`, `extrato`, `validacao`) e `status_bb`, sem o corpo da
  resposta; certificado ausente/inválido, runtime sem `Deno.createHttpClient`, tempo esgotado ou falha de rede
  responde `503` (`codigo` `certificado_ausente`, `certificado_invalido`, `runtime_sem_mtls`, `timeout`,
  `falha_de_rede`). Toda chamada ao BB (token, extrato, validação) tem limite de 20 s (`AbortSignal.timeout`).
- **LGPD**: o log leva só a ação, a etapa e o código HTTP; nunca token, CPF/CNPJ, agência ou conta.
- **Não verificado** contra o BB: a primeira versão passou em `deno check` e nas funções puras (datas, normalização
  do extrato); a revisão (validar-conta pelo movimento, trilha, tempo limite e limite de páginas) foi conferida com
  `esbuild` e `tsc --strict` com tipos mínimos do Deno (sem `deno` no ambiente). Nada foi chamado na homologação do BB
  (exige credenciais e certificado do cliente).

#### Configurar as credenciais do BB numa instância

Cada cliente roda numa instância própria do Supabase ([NOVO_BANCO.md](./NOVO_BANCO.md)), com as próprias
credenciais do BB. Nada disso vai para o repositório, para `tenants/<slug>/`, para o `.env` do front ou para o
banco: a tela não recebe nem guarda segredo.

1. No portal do desenvolvedor do BB, o cliente cria a aplicação, libera as APIs Extratos e Validação de Contas
   e obtém `client_id`, `client_secret`, a chave da aplicação e o certificado do cliente para o mTLS (certificado
   e chave privada em PEM). Comece em homologação.
2. Grave os seis segredos no ambiente das Edge Functions da instância:

   | Segredo | Valor |
   |---|---|
   | `BB_AMBIENTE` | `homologacao` ou `producao` (ausente = `homologacao`; outro valor é tratado como inválido) |
   | `BB_CLIENT_ID` | `client_id` da aplicação no BB |
   | `BB_CLIENT_SECRET` | `client_secret` da aplicação |
   | `BB_APP_KEY` | chave da aplicação (vai como `gw-dev-app-key` ou `gw-app-key`) |
   | `BB_CERT_PEM` | certificado do cliente em PEM (pode ser uma linha só, com `\n` literal no lugar das quebras) |
   | `BB_KEY_PEM` | chave privada do certificado em PEM (mesmo formato) |

   Com a CLI do Supabase: `supabase secrets set BB_AMBIENTE=homologacao BB_CLIENT_ID=... (etc.)`. No Supabase
   self-hosted da VPS, as Edge Functions leem as variáveis de ambiente do serviço de funções do Docker: inclua as
   seis no ambiente desse serviço e reinicie-o. Defina também `ALLOWED_ORIGINS` com os endereços do front
   (seção "CORS e `ALLOWED_ORIGINS`").
3. Publique a função `bb-api` na instância.
4. Em `/financeiro/conciliacao`, aba "Banco do Brasil (API)", use "Testar conexão": a ação `status` mostra o
   ambiente, quais segredos faltam (sem mostrar valores) e se o token de cada API saiu. Só depois importe um
   extrato curto para conferir.
5. Para ir para produção, troque `BB_AMBIENTE` para `producao` e as credenciais/certificado pelos de produção.
   Confira no portal do BB o nome do parâmetro da chave da aplicação (ver "Segredos" acima).

## Boas práticas ao mexer

- **Segredos** (service role key, chaves de e-mail/IA) ficam nas variáveis de
  ambiente da função no Supabase — **nunca** no código do client nem no `.env`
  do front.
- Valide a autorização do chamador dentro da função (verifique o JWT/role) antes
  de executar ações privilegiadas.
- Deploy: só pelo CI (seção "Publicação pelo CI" abaixo). Não copie arquivo à mão para a VPS: a próxima publicação
  apaga o que não estiver no repositório.
- Mantenha o contrato (formato de `body`/resposta) em sincronia com o hook que a
  consome no front.

## Publicação pelo CI

No self-hosted não existe `supabase functions deploy`: o container `supabase-edge-functions` lê as funções de uma
pasta da VPS (`volumes/functions` do docker compose), e o roteador `main/` (do próprio Supabase) cria um worker por
função. O workflow `.github/workflows/deploy-funcoes.yml` (**Deploy das Edge Functions**) roda quando um merge na
`main` muda `supabase/functions/` (e à mão, Actions → Run workflow):

1. `esperar` (sem segredo): **Quality Gates** verde no mesmo commit e migrações aplicadas (como o deploy do front);
2. `publicar`, no ambiente `producao` (pede a aprovação do dono): `rsync --delete` de `supabase/functions/` para
   `VPS_FUNCOES_DIR`, sem tocar em `main/` (função apagada do repositório sai da VPS); `sudo -n docker restart` do
   container; conferência: o runtime volta (401 sem login), cada função sobe (chamada com a chave anon, que nenhuma
   aceita como usuário: espera-se 4xx, nunca erro de boot) e a pasta da VPS fica igual ao repositório.

Os segredos que as funções leem (`SUPABASE_SERVICE_ROLE_KEY`, `BB_*`, `GEMINI_*`, `RESEND_*`…) continuam no `.env`
do docker compose da VPS; o CI não os vê nem os altera. Depois de aposentar o `backup-offsite`, apague de lá
`BACKUP_ENCRYPTION_KEY`, `BACKUP_EXTERNAL_API_KEY`, `BACKUP_DEST_SUPABASE_URL` e `BACKUP_DEST_SERVICE_ROLE_KEY`.

### Preparar a VPS (uma vez, como root)

```bash
# 1. pasta das funções vista do host (a origem do volume montado em /home/deno/functions)
docker inspect supabase-edge-functions --format '{{range .Mounts}}{{.Source}} -> {{.Destination}}{{"\n"}}{{end}}'
DIR=/caminho/da/saida/acima/functions          # ajuste

# 2. usuário só para publicar funções: dono da pasta (menos main/, o roteador que verifica o JWT de todas as
#    funções, que fica do root) e sudo apenas para reiniciar esse container
adduser --disabled-password --gecos "" idjuv-funcoes
chown -R idjuv-funcoes: "$DIR" && chown -R root:root "$DIR/main" && chmod -R u=rwX,go=rX "$DIR/main"
echo "idjuv-funcoes ALL=(root) NOPASSWD: $(command -v docker) restart supabase-edge-functions" \
  > /etc/sudoers.d/idjuv-funcoes && chmod 440 /etc/sudoers.d/idjuv-funcoes && visudo -c

# 3. porteiro da chave: ela só consegue rodar o rsync para $DIR e o restart; qualquer outro comando é recusado
echo "$DIR" > /etc/idjuv-funcoes.dir
cat > /usr/local/bin/idjuv-funcoes-porteiro <<'PORTEIRO'
#!/bin/sh
set -f
dir=$(cat /etc/idjuv-funcoes.dir); dir=${dir%/}
c=$SSH_ORIGINAL_COMMAND
case "$c" in
  *[\;\&\|\`\$\<\>\(\)\'\"\\]*) ;;
  "sudo -n docker restart supabase-edge-functions") exec sudo -n docker restart supabase-edge-functions ;;
  "rsync --server "*" . $dir/") exec $c ;;
esac
echo "comando recusado" >&2; exit 1
PORTEIRO
chmod 755 /usr/local/bin/idjuv-funcoes-porteiro

# 4. chave SSH (gere no seu computador: ssh-keygen -t ed25519 -f idjuv-funcoes -N "") e cole a PÚBLICA aqui,
#    com "restrict" (sem terminal nem túnel) e o porteiro como único comando
install -d -m 700 -o idjuv-funcoes -g idjuv-funcoes /home/idjuv-funcoes/.ssh
echo "restrict,command=\"/usr/local/bin/idjuv-funcoes-porteiro\" $(cat idjuv-funcoes.pub)" \
  > /home/idjuv-funcoes/.ssh/authorized_keys
chown idjuv-funcoes: /home/idjuv-funcoes/.ssh/authorized_keys && chmod 600 /home/idjuv-funcoes/.ssh/authorized_keys

# 5. o .env do Supabase (JWT_SECRET, senha do banco, service role) só para o root
COMPOSE=/caminho/da/pasta/do/docker-compose     # ajuste (a que tem o .env)
chown root:root "$COMPOSE/.env" "$COMPOSE/docker-compose.yml" && chmod 600 "$COMPOSE/.env"

# 6. tire o agendamento antigo do backup-offsite (ele guardava a service role key na linha do comando)
crontab -l | grep -n backup-offsite; systemctl list-timers --all | grep -i backup
```

Depois da primeira publicação, confira que o container lê a pasta publicada (o CI só confere a pasta do
`VPS_FUNCOES_DIR`): `docker exec supabase-edge-functions ls /home/deno/functions` deve listar as mesmas funções do
repositório. Como a função publicada roda com a service role, aprovar o job `publicar` é aprovar código com acesso
total ao banco: olhe o que mudou em `supabase/functions/` antes de aprovar.

No GitHub: segredos `VPS_FUNCOES_USER` (`idjuv-funcoes`) e `VPS_FUNCOES_KEY` (a chave **privada**) no ambiente
`producao` (`VPS_SSH_HOST` e `VPS_SSH_KNOWN_HOSTS` já estão lá); variável do repositório `VPS_FUNCOES_DIR` (o `$DIR`
acima, terminando em `/functions`) e, se o container tiver outro nome, `VPS_FUNCOES_CONTAINER`. A primeira publicação
substitui o que estiver na pasta (menos `main/`); rode-a à mão depois de configurar (Actions → **Deploy das Edge
Functions** → Run workflow) e confira o resumo do job.
