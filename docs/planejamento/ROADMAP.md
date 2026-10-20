# Roadmap do IDJUV Governa Hub

Documento vivo, mantido pelo agente `documentador-idjuv`. Fluxo de trabalho: ver `AGENTS.md`.
Números do sistema (rotas, páginas, tabelas, migrações): [ESTADO_DO_SISTEMA.md](../ESTADO_DO_SISTEMA.md).

## Como usar

- O trabalho segue o **plano de finalização** (tabela abaixo): um passo = um PR pequeno. Ao abrir o PR, marque o
  passo "em andamento"; ao mesclar, "feito", com o número do PR e a data, e acrescente uma linha em **Concluído**.
- O que depende do dono (GitHub, VPS, Cloudflare, decisões) vai em **Pendências do dono**; nunca valor de segredo.
- Ideia fora do plano vai em **Backlog fora do plano** (uma linha, com o módulo de `src/shared/config/modules.config.ts`).
  Ao priorizar, rode o skill `brainstorming` e ligue a spec de `docs/superpowers/specs/`.
- Mesclar na `main` publica em produção: o CI aplica as migrações (com aprovação no ambiente `producao`) e publica o front.

## Plano de finalização

Plano de 14/10/2026 (levantamento geral do código). Situação: **feito**, **em andamento** ou **a fazer**. Data é a
do merge; "—" quando não registrada aqui.

| Passo | Fase | O que entrega | Situação | PR | Data |
|---|---|---|---|---|---|
| P00 | 1. Regra da documentação | `docs-guard` em toda PR, cobrando a doc dona de cada tipo de mudança e este ROADMAP (`scripts/check-docs-matriz.mjs`, [GOVERNANCA_DOCUMENTACAO.md](../GOVERNANCA_DOCUMENTACAO.md) §6) | feito | #103 | 14/10/2026 |
| P01 | 2. Banco e CI | Workflow manual **Fotografia do banco**: estrutura da produção × replay das migrações × baseline, só leitura ([DESENVOLVIMENTO.md](../DESENVOLVIMENTO.md#fotografia-do-banco-de-produção-ci-manual)). A produção foi montada pelo baseline | feito | #104 | 14/10/2026 |
| P02 | 2. Banco e CI | Migração `20261014120000_convergencia_baseline.sql` leva o histórico ao estado da produção (no-op lá); `fechar_folha`/`reabrir_folha` no overlay 18; bucket `emails` no repositório | feito | #105 | 14/10/2026 |
| P03 | 2. Banco e CI | `types.ts` gerado do replay das migrações (`npm run db:tipos`), workflow **Tipos do banco** reprova tipo defasado; contornos `as any` removidos ([BANCO_DE_DADOS.md](../BANCO_DE_DADOS.md)) | feito | #108 | 14/10/2026 |
| P04 | 2. Banco e CI | Workflow **Banco do zero e RLS**: replay das migrações e teste de RLS por persona em todo PR de banco ([DESENVOLVIMENTO.md](../DESENVOLVIMENTO.md#banco-do-zero-e-rls-ci)) | feito | #110 | 15/10/2026 |
| P05 | 2. Banco e CI | CI seguro: segredos nos ambientes `producao`, `deploy-front` e `backup`; PR sem segredo; deploy só depois do gate e das migrações | feito | #111 | 15/10/2026 |
| P06 | 2. Banco e CI | Edge Functions publicadas só pelo CI (**Deploy das Edge Functions**), `verify_jwt` por função, `admin-reset-password` corrigida, `backup-offsite` aposentada ([EDGE_FUNCTIONS.md](../EDGE_FUNCTIONS.md#publicação-pelo-ci)) | feito | #112 | 15/10/2026 |
| P07a | 3. Backup | Storage obrigatório no backup, cron versionado, teste mensal de restauração e **Vigia do backup** diário ([BACKUP.md](../BACKUP.md)) | feito | #113 | 15/10/2026 |
| P07b | 3. Backup | Na VPS: script e cron novos, pacote de segredos cifrado em bucket separado, retenção pelo ciclo de vida do R2, trava de 7 dias no bucket ([BACKUP.md](../BACKUP.md) §4 e §5) | feito | #114 | 16/10/2026 |
| P08 | 4. Segurança e limpeza | Módulo pela URL em toda rota protegida (404 para módulo não contratado), permissão nas telas sensíveis, `ROUTE_PERMISSIONS` removido; D6 decidida ([RBAC_PERMISSOES.md](../RBAC_PERMISSOES.md#permissões-nas-rotas-p08-16102026)) | feito | #115 | 16/10/2026 |
| P09 | 4. Segurança e limpeza | Itens de menu sem tela corrigidos ou retirados; teste `src/config/menu.config.test.ts`; `/pendencias` lê os dois menus ([MODULOS.md](../MODULOS.md)) | feito | #116 | 16/10/2026 |
| P10 | 4. Segurança e limpeza | Código morto do front removido (`src/modules/`, motor de folha antigo, páginas sem rota, dependências sem uso); teste `src/codigo-alcancavel.test.ts` ([GUIA_FRONTEND.md](../GUIA_FRONTEND.md)) | feito | #117 | 16/10/2026 |
| P11 | 4. Segurança e limpeza | Banco: auditoria de licitações com o papel certo, `search_path` fixo, índices nas FKs de dados, fim do Realtime ([BANCO_DE_DADOS.md](../BANCO_DE_DADOS.md#limpeza-e-desempenho-p11-16102026)) | feito | #118 | 16/10/2026 |
| P12 | 4. Segurança e limpeza | Auditoria de segurança sem achado crítico ou alto: limite por IP nos formulários públicos, CORS em falha fechada, cabeçalhos de segurança versionados, `xlsx` do CDN da SheetJS ([AUDITORIA_USUARIOS.md](../AUDITORIA_USUARIOS.md#auditoria-de-segurança-p12-17102026)) | feito | #119 | 17/10/2026 |
| P13 | 4. Documentação com fonte única | `docs/ESTADO_DO_SISTEMA.md` gerado do código (`npm run estado`, guard no gate); guard de número escrito à mão (`npm run check:numeros`); docs obsoletos e `supabase/disaster-recovery/` em `docs/historico/`; tela de Disaster Recovery só informativa; tabelas `backup_*` apagadas ([BANCO_DE_DADOS.md](../BANCO_DE_DADOS.md#limpeza-do-p13-18102026)); este ROADMAP refeito | em andamento | este PR | 18/10/2026 |
| P14 | 5. Módulos | Patrimônio: telas reais no lugar dos placeholders, relatórios "Em breve", próximas ondas da auditoria (dividido em 11 entregas; entregas 1 a 3 feitas: detalhe de movimentação, manutenção e baixa; editar bem e abas de manutenção/ocorrência na ficha; ver e editar item do almoxarifado) | em andamento | | |
| P15 | 5. Módulos | Financeiro: detalhe de solicitação e empenho, regra de estorno, leitor OBN600 conferido, homologação da `bb-api` | a fazer | | |
| P16 | 5. Módulos | Transparência: página LAI sem "em implementação", execução orçamentária completa | a fazer | | |
| P17 | 5. Módulos | Workflow (SEI): unidades da Lei 2.301/2025 e etapas "(proposta)" confirmadas | a fazer | | |
| P18 | 5. Módulos | Governança e Integridade: telas ou fora do menu (D4) | a fazer | | |
| P19 | 5. Módulos | Programas: admin da seleção gravando no banco (D4) | a fazer | | |
| P20 | 5. Módulos | Compras, conforme o escopo (D1, D2) | a fazer | | |
| P21 | 5. Módulos | Contratos, conforme o escopo (D1) | a fazer | | |
| P22 | 5. Módulos | Gabinete: módulo próprio ou só atalhos (D4) | a fazer | | |
| P23 | 6. Pronto para uso | PDFs no padrão único: migrar os geradores `src/lib/pdf*.ts` para `src/lib/documentos/` ([PADRAO_DOCUMENTOS.md](../PADRAO_DOCUMENTOS.md)), em ondas ([spec](../superpowers/specs/2026-10-19-padrao-relatorios-configuravel-design.md)). Onda 0: padronização configurável na tela Configuração do cliente, com pré-visualização ([CONFIGURACAO_CLIENTE.md](../CONFIGURACAO_CLIENTE.md#impressão-de-documentos-padronização-dos-pdfs)); onda 1: relatórios do RH (PR #133); onda 2: fichas ([plano](../superpowers/plans/2026-10-19-padrao-relatorios-onda2.md)); onda 3: comprovantes, contracheque, folha de frequência e reuniões ([plano](../superpowers/plans/2026-10-20-padrao-relatorios-onda3.md), bloco `quebraPagina` para lotes; PR #138, ajustes da revisão: `localDaSede()` único); onda 4: demais relatórios: unidades, cargos, governança, árbitros, federações e organograma ([plano](../superpowers/plans/2026-10-20-padrao-relatorios-onda4.md)); onda 5: limpeza (cartões do RH sem a base antiga) | em andamento (ondas 0 a 4 entregues; onda 5) | #143 | |
| P24 | 6. Pronto para uso | White label: tirar os literais do cliente de `src/` e pôr trava no gate ([INVENTARIO_HARDCODE.md](../INVENTARIO_HARDCODE.md)) | a fazer | | |
| P25 | 6. Pronto para uso | Testes de fumaça no navegador (Playwright) dos fluxos principais, no CI | a fazer | | |
| P26 | 6. Pronto para uso | Monitoramento: erros do front, queda do site ou do banco, backup que não rodou | a fazer | | |
| P27 | 6. Pronto para uso | Desempenho da folha com volume real | a fazer | | |
| P28 | 6. Pronto para uso | Go-live: usuários e perfis reais, LGPD (D3), treinamento, manual curto por módulo | a fazer | | |

Cada módulo da fase 5 começa com `/finalizar <codigo>` ([FINALIZACAO.md](./FINALIZACAO.md)).

## Pendências do dono

Feitas fora do repositório (GitHub, VPS, Cloudflare). Nenhum valor de segredo vai para o chat ou para o repositório.

- [ ] **Ambientes protegidos** (P05): criar `producao` (com aprovação do dono), `deploy-front` e `backup`, só para a
  `main`; recriar neles os segredos e apagar os mesmos do nível do repositório
  ([DESENVOLVIMENTO.md](../DESENVOLVIMENTO.md#ambientes-protegidos-do-github-segredos-de-produção)).
- [ ] **Checks obrigatórios na `main`**: Settings → Branches, exigir `quality`, `docs-guard`, `tipos` e `banco`. Sem isso
  os checks ficam vermelhos, mas não impedem o merge.
- [ ] **Edge Functions pelo CI** (P06): preparar o usuário de deploy na VPS, segredos `VPS_FUNCOES_USER`/`VPS_FUNCOES_KEY`
  no ambiente `producao`, variável `VPS_FUNCOES_DIR`, tirar os `BACKUP_*` do `.env` das funções e rodar a primeira
  publicação à mão ([EDGE_FUNCTIONS.md](../EDGE_FUNCTIONS.md#publicação-pelo-ci)).
- [ ] **`ALLOWED_ORIGINS`** nas Edge Functions com os dois endereços do front: `https://idjuv.online,https://app.idjuv.online`
  ([EDGE_FUNCTIONS.md](../EDGE_FUNCTIONS.md)).
- [ ] **Backup** (P07): cópia do pacote de segredos no cofre de senhas; token só leitura do R2 para o
  `BACKUP_RCLONE_CONF` do GitHub e depois apagar o token antigo; apagar a isca `teste-trava` do bucket depois de 23/10
  ([BACKUP.md](../BACKUP.md)).
- [ ] **Fotografia do banco** (P02): rodar de novo e conferir que produção × migrações só difere nos triggers internos
  do Storage. Depois, trocar o papel `postgres` da fotografia por um papel só leitura.
- [ ] **Segurança na VPS** (P12): incluir `deploy/nginx/cabecalhos-seguranca.conf` no nginx/Traefik, GoTrue exigindo a
  senha atual na troca e o mínimo de 8, proxy entregando o IP real em `x-real-ip`.
- [ ] **Publicação pelo Coolify** (#121): domínios `app.idjuv.online` (sistema) e `idjuv.online` (site) já no Coolify
  (18/10/2026) e o site manda rota do sistema para o app; falta `COOLIFY_APP_UUID` como variável do repositório (do
  ambiente não basta) e o primeiro merge publicado pelo job `deploy-coolify` ([DESENVOLVIMENTO.md](../DESENVOLVIMENTO.md#publicação-pelo-coolify)).
- [ ] **E-mails do Auth na VPS**: bucket `emails` e override do compose ([EMAILS_AUTH.md](../EMAILS_AUTH.md)).
- [ ] **Configuração do cliente**: nome definitivo do produto e preencher `/admin/configuracao-cliente` em produção
  ([CONFIGURACAO_CLIENTE.md](../CONFIGURACAO_CLIENTE.md)).
- [ ] **Permissões a conceder**: `orcamento.importar` (QDD e tabelas do FIPLAN) e `gabinete.portarias.importar` (planilha de
  portarias) a quem vai importar; importar a planilha de cargos e vagas em `/cargos/vagas`.
- [ ] **Decisões** D1 a D5 (abaixo).

## Decisões

| # | Decisão | Destrava | Situação |
|---|---|---|---|
| D1 | Escopo de Compras e Contratos: licitação, ata, fornecedor, contrato, aditivo e vencimento no sistema, ou só acompanhar o SEI/FIPLAN? | P20, P21 | aberta |
| D2 | IA de compras (`cpsi-ai-assistant`, PR #94): seguir, reduzir a apoio de pesquisa ou abandonar (DFD/ETP/TR ficou no SEI)? | P20 | aberta |
| D3 | Nomes reais na migração `20260110184920` (LGPD): reescrever o histórico do git ou registrar e aceitar? | P28 | aberta |
| D4 | Governança, Integridade, Programas e Gabinete: construir as telas que o menu prometia ou deixar fora do menu (hoje fora, desde o P09)? | P18, P19, P22 | aberta |
| D5 | MFA para admin e RH? | — | aberta |
| D6 | Quem perde escrita no RH | P08 | decidida no P08: o papel `user` não grava no RH |

## Backlog fora do plano

- [ ] **Financeiro — planilhas do FIPLAN** (fora do plano, etapa 1 em PR rascunho): tabelas de classificação
  (função, programa, elemento, subelemento, fonte, finalidade) importadas das consultas do FIPLAN e nomes corrigidos
  nos cadastros ([spec](../superpowers/specs/2026-10-19-classificadores-fiplan-design.md)). Próximas etapas: credores
  com o código do FIPLAN em `fornecedores`, NPD (programação financeira mensal), UO/UG na configuração do cliente.
- [ ] **Design System** (transversal): fases 0 a 2 feitas; fase 3 (RH como piloto) e fase 4 (um módulo por PR, começou
  pelo Patrimônio) em andamento — [spec](../superpowers/specs/2026-10-09-design-system-design.md),
  [plano](../superpowers/plans/2026-10-09-design-system.md).
- [ ] **Site**: página pública de estrutura organizacional (LAI); o card saiu da Transparência pública no #120 porque
  levava a uma tela com login.
- [ ] **Envio e avisos**: ligar os avisos ao envio de e-mail e WhatsApp (ação nova em `enviar-notificacao`).
- [ ] **RH — Fases 2–7** (higiene, fundação de dados, autoatendimento, carreira, eSocial, seguridade) — ver
  [ANALISE_RH.md](./ANALISE_RH.md). Do RH ficam também: dono do bucket `documentos` e troca dos links públicos de
  portarias, atos e cedência; gravar o ZIP do pacote de frequência; o servidor assinar o próprio fechamento;
  relatório nominal de folha (decisão pendente); preservar itens manuais no reprocessamento da folha.
- [ ] **Trilha `audit_log_licitacoes` por módulo dono** (revisão de 15/10/2026): fora as linhas do workflow (já com
  sigilo), quem tem compras ou contratos ainda lê a trilha de governança, financeiro e patrimônio.
- [ ] **Tipos (P03)**: conferir 3 possíveis bugs latentes achados ao tipar, nenhum muda o comportamento hoje:
  `servidor_id` na interface `Portaria` (`src/types/portaria.ts`) não é coluna de `documentos`; `updateArbitro`
  aceita `modalidades_lista`, que não é coluna; create/update de `useDemandasAscom` aceitam objetos de join.
- [ ] **Higiene**: reduzir a dívida de typecheck e lint (valores em `scripts/gate-baseline.json`) e rodar
  `bash scripts/gate.sh --update-baseline`; `package-lock.json` fora de sincronia (`npm ci` falha).
- [ ] **Financeiro**: Pagamentos em Lote / PagBB (depende do contrato e da homologação com o BB); conciliação do retorno
  CNAB da folha (falta um `.RET` de exemplo); credenciais `BB_*` por instância ([EDGE_FUNCTIONS.md](../EDGE_FUNCTIONS.md#configurar-as-credenciais-do-bb-numa-instância)).
  Leitor OBN600, estorno e homologação da `bb-api` estão no P15.
- [ ] **Workflow**: "Na minha unidade" usa `lotacoes.ativo` e não cobre cessão; lista e painel leem até 1000 linhas
  (`LIMITE_LINHAS`), paginar quando o volume chegar perto; modelos sem trigger de `updated_at` (só importa com tela
  de edição de modelo). Unidades e etapas "(proposta)" estão no P17.
- [ ] **Admin — usuários técnicos**: o "Perfil de acesso" da tela de usuários técnicos (TI ou Administrador Geral) só
  vai para o `user_metadata` e não grava papel em `user_roles` (decisão de RBAC pendente); convite por e-mail ao criar
  usuário depende do SMTP do Supabase da VPS (hoje quem cria repassa a senha temporária).
- [ ] **Patrimônio — inventário de campo, fases 2–3**: edificações e instalações, relatórios automáticos, conciliação
  com a relação da SEED, importação de planilha; confirmar os termos de uso da Esri World Imagery para uso institucional.

## Concluído

Plano de finalização e entregas fora dele (uma linha por PR):

- [ ] Retorno do banco da remessa da folha (fora do plano, PR rascunho): na aba Remessas CNAB da folha, cada remessa recebe o arquivo de retorno (.ret) que o banco devolveu; a tela casa cada crédito com a ficha pelo seu número que a remessa grava (ou, em arquivo de outro sistema, pelo CPF e o valor), mostra agendados, pagos e recusados com o motivo do banco e grava tudo de uma vez; a prévia do BB deixa a remessa como enviada e o retorno final sem agendado, como processada; o mesmo arquivo não entra duas vezes. Conferido com o retorno real da folha de 09/2026 (94 agendados e 5 recusados). O retorno das ordens bancárias do FIPLAN (OBN) continua pela conciliação do financeiro.
- [x] #137 — Cálculo da folha pela lei de 2026 (fora do plano): o IRRF mensal usa a maior entre as deduções legais (INSS, dependentes, pensão) e o desconto simplificado, e aplica a redução da Lei 15.270/2025 (isenção até R$ 5.000); a pensão alimentícia sai da base do IRRF; a ficha do servidor tem a opção "contribui para o regime próprio do órgão de origem", com fundamento e início, e a folha deixa de descontar INSS de quem a marca; a tela das tabelas de INSS e IRRF grava a alíquota como fração. Os valores legais são parâmetros da folha (grupo IRRF), que o RH cadastra. Conferido contra o espelho do SIGRH de 09/2026. 13º e rescisão continuam com o IRRF anterior até a regra do redutor no 13º ser conferida.
- [x] #137 — Atos e reajustes da folha (fora do plano): aba na configuração da folha para registrar a lei, o decreto ou a instrução normativa que muda vencimentos, subsídios, rubricas ou parâmetros, com os itens um a um ou por percentual dos cargos; aplicar grava o valor anterior e a vigência, e o ato aplicado não muda mais. A folha lê o vencimento do cargo pela vigência e marca a ficha quando o reajuste começa no meio do mês. Falta calcular diferenças retroativas de meses fechados.
- [x] #137 — Motor da remessa da folha (fora do plano): remessa de servidores ou de pensão alimentícia (beneficiários das pensões descontadas, com o banco do cadastro da pensão), data do crédito escolhida na geração (sugere o dia de pagamento da competência em dia útil, a partir de amanhã, pelos feriados cadastrados), número inicial (NSA) por conta para continuar a sequência do SIGRH, e no BB o convênio passa a ser obrigatório e o endereço do pagador deixa de ser pedido (o leiaute do banco não o leva). O retorno do banco ficou na entrega seguinte; falta testar no Gerenciador Financeiro.
- [x] #135 — Remessa da folha no leiaute aceito pelo BB (fora do plano): conta pagadora no BB gera o CNAB 240 que o banco já aceita da folha (`src/lib/bancario/folhaBbCnab240.ts`), reproduzido byte a byte das remessas de 08/2026 enviadas pelo Gerenciador Financeiro; lote 0001 crédito no BB, lote 0002 outros bancos; poupança no BB é recusada até o banco confirmar a forma. Outros bancos seguem no FEBRABAN genérico. Falta testar uma remessa no Gerenciador Financeiro antes do uso real.

- [x] #124 — Usuário técnico (fora do plano): grava os módulos marcados e mostra a senha temporária, como no usuário de servidor; a mensagem de "e-mail enviado" saiu porque nenhum e-mail é enviado; falha ao salvar módulos agora aparece.
- [x] Usuários (fora do plano): na tela de usuários dá para corrigir o nome e abrir a ficha completa, onde ficam resetar a senha e excluir (antes a ficha não tinha link). O e-mail de acesso não se edita pela tela.
- [x] Usuários (fora do plano): criar usuário (servidor ou técnico) manda um convite por e-mail, pelo SMTP do Resend, e a pessoa cria a própria senha pelo link; a tela não mostra mais senha temporária. Se o link vencer, "Resetar senha" na ficha continua gerando uma.
- [x] Usuários (fora do plano): o primeiro acesso pelo link do convite não cai mais em "Nenhum módulo atribuído" antes de os módulos do usuário serem lidos.
- [x] #121 — Front publicado pelo Coolify (fora do plano): `Dockerfile` na raiz (sistema e site pelo build arg `MODO`) e job `deploy-coolify`; o rsync segue enquanto `COOLIFY_APP_UUID` não existir.
- [x] #120 — Separação do portal público e do sistema interno (fora do plano): menu do site só com rota pública, telas internas no `ModuleLayout`, build `site` com os formulários públicos.
- [x] #119 — P12, auditoria de segurança.
- [x] #118 — P11, limpeza e desempenho do banco.
- [x] #117 — P10, código morto do front (inclusive `lib/supabaseClient.ts`).
- [x] #116 — P09, menu sem tela.
- [x] #115 — P08, permissões nas rotas.
- [x] #114 — P07b, backup na VPS.
- [x] #113 — P07a, backup no repositório.
- [x] #112 — P06, Edge Functions pelo CI.
- [x] #111 — P05, CI seguro.
- [x] #110 — P04, banco do zero e RLS no CI.
- [x] #108 — P03, tipos do banco.
- [x] #104 — P01, fotografia do banco.
- [x] #102 — Workflow: acompanhamento de processos do SEI por etapas, sigilo na RLS, escrita por RPC `wf_*`.
- [x] #83 — RH, Onda E2: trilha consultável em `/admin/auditoria` e `/rh/auditoria`.
- [x] #82 — RH, Onda E1: autoria gravada pelo banco e trilha imutável.
- [x] #80 — Patrimônio, auditoria de 10/10 (ondas 1 e 2).
- [x] #75 — RH, Onda B3: buckets e arquivos do RH por permissão.
- [x] #71 — RH, correção dos contornos da B2.
- [x] #69 — RH, Onda B2: férias, licenças, viagens e frequência por permissão.
- [x] #67 — Identidade (S0): policies de `profiles`, `user_roles`, `user_modules`.
- [x] #63 — RH, Onda B1: segurança da folha.
- [x] #59 — RH, relatórios (15a e 15b, esta incorporada da #61).
- [x] #58 — RH, viagens.
- [x] #56 — RH, detalhe da folha.
- [x] #52 — RH, fluxo de frequência.
- [x] #51 — RH, férias.
- [x] #49 — RH, formulário do servidor.
- [x] #43, #42, #40, #38, #37, #36 — RH, Onda A (correções sem banco).
- [x] #34 — Inventário de campo, fase 1.
- [x] Sem número registrado aqui (migrações já na `main`): envio de e-mail e WhatsApp, avisos e datas importantes,
  importação de dados e QDD do FIPLAN, configuração do cliente, RH Onda E3, financeiro (FIPLAN, arquivos bancários e
  `bb-api`), quadro de vagas, atos formais no SEI, sigilo da trilha do workflow e importação de portarias por planilha.
- [x] Gerador de prompts (`/prompt`, `/pendencias`, `/finalizar`), estrutura de skills e agentes, gate local.

<!-- doc-links-absent: lib/supabaseClient.ts -->
