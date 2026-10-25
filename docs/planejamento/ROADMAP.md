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
| P14 | 5. Módulos | Patrimônio: telas reais no lugar dos placeholders, relatórios "Em breve", próximas ondas da auditoria (dividido em 11 entregas; entregas 1 a 4 feitas: detalhe de movimentação, manutenção e baixa; editar bem e abas de manutenção/ocorrência na ficha; ver e editar item do almoxarifado; permissões do patrimônio e unidades no banco e nas rotas) | em andamento | | |
| P15 | 5. Módulos | Financeiro: detalhe de solicitação e empenho, regra de estorno, leitor OBN600 conferido, homologação da `bb-api` | a fazer | | |
| P16 | 5. Módulos | Transparência: página LAI sem "em implementação", execução orçamentária completa | a fazer | | |
| P17 | 5. Módulos | Workflow (SEI): unidades da Lei 2.301/2025 e etapas "(proposta)" confirmadas | a fazer | | |
| P18 | 5. Módulos | Governança e Integridade: telas ou fora do menu (D4). Feito: relatório de governança com dados reais (tela e PDF `governanca-relatorio-anual` leem riscos, planos de tratamento, controles, checklists, matriz RACI e denúncias; sem número fixo no código). Falta fonte para capacitações e metas | em andamento | | 20/10/2026 |
| P19 | 5. Módulos | Programas: admin da seleção gravando no banco (D4) | a fazer | | |
| P20 | 5. Módulos | Compras, conforme o escopo (D1, D2) | a fazer | | |
| P21 | 5. Módulos | Contratos, conforme o escopo (D1). Começou pelo controle de passagens aéreas (entrega 1 de 3: pedidos, passageiros, cotação e emissão; entrega 2: prestação de contas e pendências; [spec](../superpowers/specs/2026-10-24-contratos-passagens-aereas-design.md)) | em andamento | #176 | |
| P22 | 5. Módulos | Gabinete: módulo próprio ou só atalhos (D4) | a fazer | | |
| P23 | 6. Pronto para uso | PDFs no padrão único: migrar os geradores `src/lib/pdf*.ts` para `src/lib/documentos/` ([PADRAO_DOCUMENTOS.md](../PADRAO_DOCUMENTOS.md)), em ondas ([spec](../superpowers/specs/2026-10-19-padrao-relatorios-configuravel-design.md)). Onda 0: padronização configurável na tela Configuração do cliente, com pré-visualização ([CONFIGURACAO_CLIENTE.md](../CONFIGURACAO_CLIENTE.md#impressão-de-documentos-padronização-dos-pdfs)); onda 1: relatórios do RH (PR #133); onda 2: fichas ([plano](../superpowers/plans/2026-10-19-padrao-relatorios-onda2.md)); onda 3: comprovantes, contracheque, folha de frequência e reuniões ([plano](../superpowers/plans/2026-10-20-padrao-relatorios-onda3.md), bloco `quebraPagina` para lotes; PR #138, ajustes da revisão: `localDaSede()` único); onda 4: demais relatórios: unidades, cargos, governança, árbitros, federações e organograma ([plano](../superpowers/plans/2026-10-20-padrao-relatorios-onda4.md)); onda 5: limpeza (relatório de portarias migrado: `portarias-relatorio`; cartões do RH sem a base antiga; atos do SEI removidos: DFD/ETP/TR com a tela CPSI, PDF do termo de cessão e memorando de designação; declarações migradas: acumulação, bens, residência e relação de documentos, `declaracoes-*`; formulários administrativos migrados: termo de demanda, ordem de missão, relatório de viagem, requisição de material e termo de responsabilidade, preenchidos e em branco, `formularios-*`; base antiga apagada e travada no gate, [plano](../superpowers/plans/2026-10-20-padrao-relatorios-onda5.md)); termo de cessão e designação de chefia guardam o ciclo do SEI (processo, número do ato, assinatura e DOE; o termo nasce "aguardando SEI" em vez de "emitido" com número interno), com edição do registro nas duas abas (migração `20261023090000`, [BANCO_DE_DADOS.md](../BANCO_DE_DADOS.md#termo-de-cessão-e-designação-de-chefia-ciclo-do-sei)) | em andamento (ondas 0 a 4 entregues; onda 5 na PR #143; registro do SEI no termo e na designação nesta branch) | #143 | |
| P24 | 6. Pronto para uso | White label: tirar os literais do cliente de `src/` e pôr trava no gate ([INVENTARIO_HARDCODE.md](../INVENTARIO_HARDCODE.md)). Fase A (21/10/2026, sem banco novo): PDFs, formulários, rótulos do RH, portal, painel, Apresentação, Estrutura Organizacional (de `estrutura_organizacional`), quadro de cargos calculado (sai o resumo estático de `public/data/`), Matriz RACI (de `matriz_raci_*`) e prazos da LAI (de `prazos_lai`) leem o cadastro. Faltam a Fase B (missão, visão, slogan, sede, tribunal de contas, setor das diárias no cadastro; textos do portal no CMS) e a Fase C (tabelas de diárias, férias por regime, Bolsa Atleta, municípios, normas e eventos); levantamento em `/mnt/project-files/levantamento/dados-instituicao-no-codigo.md` | em andamento | este PR | 21/10/2026 |
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
| D2 | IA de compras (`cpsi-ai-assistant`, PR #94): seguir, reduzir a apoio de pesquisa ou abandonar (DFD/ETP/TR ficou no SEI; a tela CPSI saiu na onda 5 do P23 e a função ficou sem chamador)? | P20 | aberta |
| D3 | Nomes reais na migração `20260110184920` (LGPD): reescrever o histórico do git ou registrar e aceitar? | P28 | aberta |
| D4 | Governança, Integridade, Programas e Gabinete: construir as telas que o menu prometia ou deixar fora do menu (hoje fora, desde o P09)? | P18, P19, P22 | aberta |
| D5 | MFA para admin e RH? | — | aberta |
| D6 | Quem perde escrita no RH | P08 | decidida no P08: o papel `user` não grava no RH |

## Backlog fora do plano

- [ ] **Impressão só pelo motor** (transversal): guard `impressaoForaDoCore` no gate (21/10/2026) conta `window.print`,
  `print:`, `@media print` e pdf-lib fora de `src/lib/documentos/`. Falta migrar para modelo do motor as etiquetas de
  patrimônio, a ficha cadastral geral (pdf-lib) e o Imprimir do organograma ([PADRAO_DOCUMENTOS.md](../PADRAO_DOCUMENTOS.md) §3).
- [ ] **Financeiro — planilhas do FIPLAN** (fora do plano, etapa 1 em PR rascunho): tabelas de classificação
  (função, programa, elemento, subelemento, fonte, finalidade) importadas das consultas do FIPLAN e nomes corrigidos
  nos cadastros ([spec](../superpowers/specs/2026-10-19-classificadores-fiplan-design.md)). Empenhos importados do
  FIP 614 (PR rascunho, 23/10/2026): empenho, liquidações, NOBs e estornos com o FIPLAN como fonte, código do credor
  em `fornecedores`, PDF ou Excel (o Excel traz o IDU e liga a dotação certa) e escolha da dotação quando só há o PDF
  ([spec](../superpowers/specs/2026-10-22-importacao-empenhos-fip614-design.md)). Falta testar com o relatório real.
  O QDD também entra em Excel (o .xls do FIPLAN, PR rascunho de 24/10/2026). Ler em Excel também o FIP 630 e o FIP 103 depende de amostras. Próximas etapas: NPD (programação financeira mensal), UO/UG
  na configuração do cliente.
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
- [ ] **Ambiente de teste** (transversal, PR rascunho): `supabase/baseline/dados-teste.sql` enche um banco do baseline
  com dados fictícios de todos os módulos e liga o login de teste a um servidor ([NOVO_BANCO.md](../NOVO_BANCO.md#9-ambiente-de-teste-com-dados-fictícios)).
  No Coolify: ambiente `teste` do projeto `idjuv` com o Supabase de teste criado em 23/10/2026; o `Dockerfile` passa a pôr na
  CSP o host do banco do build. Supabase de teste enxuto (sem analytics, logs, pooler e realtime); `scripts/db/montar-ambiente-teste.sh` monta o banco
  pelo container. Falta rodá-lo na VPS e publicar o front de teste.
- [ ] **LAI — pedido do SIC não grava** (achado ao montar o ambiente de teste): o trigger `registrar_historico_lai` de
  `solicitacoes_sic` lê `NEW.responsavel_id`, coluna que a tabela não tem, e todo INSERT falha no banco do baseline;
  conferir na produção e corrigir por migração (cabe no P16).
- [ ] **Patrimônio — inventário de campo, fases 2–3**: edificações e instalações, relatórios automáticos, conciliação
  com a relação da SEED, importação de planilha; confirmar os termos de uso da Esri World Imagery para uso institucional.

## Concluído

Plano de finalização e entregas fora dele (uma linha por PR):

- [ ] Vetores de teste comuns com o hrms_brasil (fora do plano, PR rascunho): os casos de INSS e IRRF do hrms_brasil (`scripts/db/casos-folha.json`) rodam no teste do banco do CI contra as funções da folha e precisam dar os mesmos centavos; hoje são 18 iguais, e férias da CLT e 13º ficam fora do porte.
- [x] #144 — Parte patronal da folha (fora do plano; primeiro item do hrms_brasil levado ao Governa Hub): a folha calcula o INSS patronal e o RAT de quem contribui para o regime geral, por ficha e no total, e o total segue a guia do FIPLAN (soma das bases × alíquota, truncada); as alíquotas (0,20 e o RAT com o FAP) são parâmetros da folha no grupo Encargos, que o RH cadastra. Opção para truncar o INSS do servidor em cada faixa, como o SIGRH. Conferido com as guias patronais de 09/2026.
- [x] Conciliação mensal no quadro da SEFAZ (fora do plano, PR #159): na Conciliação bancária, a aba "Fechamento mensal" lê o razão (FIP630), a relação de pagamentos por RE (FIP103) e o extrato OFX do BB, casa sozinha o que corresponde (RE com as NOBs, OB cancelada, repasse do Tesouro, internos do razão, valor e data) junto com as pendências do mês anterior, e mostra o quadro com as quatro listas; saldo do fundo e rendimento são digitados. Casamento manual com justificativa, rascunho, fechamento conferido no banco (ajustado = extrato), reabertura só do administrador e PDF do quadro com os anexos. No primeiro mês, as pendências do último quadro em papel entram como abertura. Conferido com os arquivos reais de julho/2026 (fecha no centavo com o quadro da SEFAZ). Fica para depois: ler o saldo do fundo do extrato em PDF e sugestão de casamento por IA.
- [x] Conciliação mensal, ajuste da leitura do FIP630 (fora do plano, PR #160): o rodapé de página do relatório (data e hora da emissão, usuário e "Página: N de M") não entra mais no histórico do lançamento que vem antes dele.
- [x] Conciliação mensal, saldo do fundo calculado e conferência da conta (fora do plano, PR #161): o saldo do fundo de investimento sai do saldo do mês anterior mais as aplicações, menos os resgates automáticos do extrato OFX, mais o rendimento digitado (no primeiro mês, o saldo de abertura do fundo é digitado uma vez); o FIP630 de outra conta passa a dar aviso, como o OFX.
- [x] Conciliação mensal, sugestão de casamentos pela IA e extrato do fundo em PDF (fora do plano, PR #162): o botão "Sugerir casamentos (IA)" manda só as pendências que sobraram, sem CPF nem CNPJ, para a função `conciliacao-ia-sugestoes` (Gemini); cada grupo que fecha (débitos = créditos) aparece para o usuário aceitar ou recusar, e o aceite vira casamento manual com o motivo na justificativa. Junto, o extrato mensal do fundo do BB em PDF (opcional) preenche o rendimento líquido e, no primeiro mês, o saldo de abertura do fundo, com aviso se for de outra conta ou de outro mês ou se não bater com o mês anterior e com o OFX.
- [x] Conciliação mensal, ajustes do teste de março e abril (fora do plano, PR #163): a tela avisa quando há trabalho sem salvar (os arquivos não ficam guardados, só o resultado ao salvar o rascunho) e o navegador pergunta antes de fechar a página; a "Ordem banc. cancelada" com final diferente de `0000` no `CHECKNUM` (ex.: `0001`) passa a ligar à NOB.
- [x] Conciliação mensal, planilha Excel (fora do plano, PR #164): o botão "Excel da conciliação" baixa uma planilha com o resumo (quadro, fundo do mês, quantos itens casaram e por qual regra), os casamentos (cada grupo com os lançamentos do razão e do banco, a regra e a justificativa), as quatro listas de pendências e todos os itens do mês com a situação de cada um. O PDF do quadro continua sendo o documento oficial.
- [x] Conciliação mensal, planilha Excel formatada (fora do plano, PR #165): a planilha passa a sair com formatação (título e conta no alto de cada aba, cabeçalho destacado, bordas, valores em R$ e datas como data, cada casamento num bloco com a regra, o valor e a justificativa, cada lista de pendências com o seu total, pendentes em destaque, filtro e cabeçalho fixo, impressão em A4). Usa a biblioteca `exceljs`, carregada só ao clicar.
- [x] PCA (Plano de Contratações Anual), entrega 1 de 4 (P20, spec `2026-10-23-compras-gerador-pca-design.md`): em Compras → Plano de Contratações (PCA), Compras cria o PCA do exercício, lança cada DFD do SEI com o tipo de material ou serviço do catálogo federal CATMAT/CATSER (cópia local baixada pela função `catalogo-compras`; o item exato de material vem do portal na hora) e digita o teto da PLOA por ação × fonte; a aba Orçamento mostra quanto sobra ou falta em cada fonte e troca os tetos pelo QDD quando ele é importado. Permissões novas `compras.pca.visualizar` e `compras.pca.editar`. Ficam para as próximas entregas: PDF e planilhas (inclusive a do PNCP), sugestões do que pode estar faltando (cruzamento + IA) e a situação do PCA (SEI, aprovação, publicação).
- [ ] Processos de contratação, entrega 1 de 2 (fora do plano, PR rascunho; spec `2026-10-23-compras-processos-reserva-natureza-design.md`): em Compras → Processos de contratação, a lista mostra cada processo com a etapa, o setor onde está no SEI, os dias parado, o valor estimado e o empenhado (empenhos do FIP 614 ligados pelo nº SEI); a ficha tem os dados, a linha do tempo do andamento (cada movimentação com data, etapa, setor e o que aconteceu) e os empenhos. A planilha de acompanhamento dos processos de 2026 entra pelo botão "Importar planilha" (simula, mostra o que muda e só então grava; reimportar não duplica). O painel de Compras passa a contar pela etapa. Permissões novas `compras.processos.visualizar` e `compras.processos.editar`. Fica para a entrega 2: a reserva por natureza × ação × fonte, o saldo livre (QDD menos as reservas ainda sem PED, com justificativa quando passa), o nº do PED, "Puxar do PCA", a tela Programação por natureza e o cartão no painel do Financeiro.
- [ ] Passagens aéreas, entrega 1 de 3 (P21, PR #176 rascunho; spec `2026-10-24-contratos-passagens-aereas-design.md`): em Contratos → Passagens aéreas, cada pedido é um processo SEI (chegue por SEI, e-mail, pessoa ou instituição), com vários passageiros (servidor, ligado à viagem do RH, ou beneficiário de fora com cadastro próprio e CPF mascarado na lista), os trechos de cada um, as cotações da agência (uma escolhida), a emissão (localizador, bilhete e valores), remarcação, cancelamento e reembolso. O pedido anda de recebido a concluído; a aprovação do Presidente fica no SEI e aqui só se registram o nº do documento e a data. O topo mostra o valor do contrato da agência, o emitido e o saldo. Permissões novas `contratos.passagens.visualizar` e `contratos.passagens.editar` (dadas a quem tem `contratos.criar`). Ficam para depois: entrega 3, faturas da agência, passagens pagas e saldo do empenho.
- [ ] Passagens aéreas, entrega 2 de 3 (P21, PR rascunho; plano `2026-10-25-contratos-passagens-entrega2.md`): a ficha do pedido ganha a aba Prestação de contas: cada passageiro entrega o cartão de embarque e, no modo individual, o relatório (nº SEI opcional; para servidor, vale o relatório apresentado no RH); no modo evento, um relatório só, do responsável da delegação; dispensa do pedido ou do passageiro sempre com motivo. Cartão, bilhete e relatório podem ser anexados (bucket privado, download por link de 60 segundos). A tela Contratos → Pendências de passagens lista quem voltou e não entregou, com o vencimento (5 dias corridos depois do último voo, prazo que o administrador muda) e os dias de atraso. O pedido só vai para concluído sem pendência.
- [ ] Conciliação mensal, busca de somas nas sugestões (fora do plano, PR rascunho): o botão "Sugerir casamentos" procura antes, no navegador, um, dois ou três lançamentos do outro lado, de datas próximas (até 31 dias), que somem o valor de cada pendência no centavo (ex.: uma NOB paga em duas partes no banco) e mostra como sugestão para aceitar ou recusar; só o que sobra vai para a IA. O modelo padrão da IA passa a ser `gemini-flash-latest` e o log da função conta os grupos devolvidos e os válidos.
- [ ] Dotação comum e emendas no QDD, etapa 1 de 2 (fora do plano, PR rascunho): a tela Financeiro → QDD separa o disponível da dotação comum (livre) do disponível de emendas (vinculado ao objeto da emenda), com o quadro das emendas por tipo (ECNI, ECI, EII, escritas por extenso) com atual, reservado, empenhado e disponível. A tabela agrupa por natureza e fonte, com a dotação comum primeiro, subtotal e o quanto é livre e quanto é de emenda; o filtro passa a ser por origem; a exportação ganha a coluna Origem. O importador do QDD aceita o Excel do FIPLAN além do PDF. Nada muda no banco. Etapa 2: cadastro de emendas (número, tipo, autor, objeto, beneficiário e valor) ligado à dotação, com o saldo de cada emenda pelos empenhos ligados a ela.
- [ ] Painel do Financeiro com os dados do FIPLAN (fora do plano, PR rascunho): a tela `/financeiro` passa a mostrar a execução do exercício com o QDD e o FIP 614 já importados. Ela traz cartões de autorizado, empenhado, liquidado, pago, saldo para empenhar e PED, a execução por grupo de despesa, alertas de saldo pelo ritmo do ano (com o 13º), a fila de pagamento por credor e as maiores despesas. O saldo é conferido com o FIP 608 de 23/10/2026. Nada muda no banco. Os relatórios do FIPLAN testados para o painel foram FIP 608, 613, 683, 226, 502 e 076; o resultado está na spec. Contratos vencendo, caixa por fonte e o gráfico mês a mês ficam para depois.
- [ ] Favorecidos e lista de bancos (fora do plano, PR rascunho): tela Financeiro → Favorecidos para listar, cadastrar e editar quem recebe os pagamentos (CPF/CNPJ, nome, endereço e a conta de crédito da remessa OBN600, com agência e conta conferidas pela mesma regra do arquivo); a lista de bancos vem preenchida (19 bancos) e qualquer usuário ativo a lê; o Financeiro passa a ler, cadastrar e editar fornecedores (apagar segue com Compras e Contratos). Contas Bancárias ganha um aviso com os atalhos para Contas pagadoras e Favorecidos.
- [ ] Evolução dos processos de contratação (fora do plano, PR rascunho): as etapas do processo se agrupam em seis fases (planejamento, análise jurídica, seleção, contrato, execução e encerrado; `src/lib/compras/evolucaoProcesso.ts`, com testes). Em Compras → Processos de contratação, a coluna Evolução mostra a fase e o percentual numa barra de seis partes, que fica amarela quando o processo passa de 15 dias sem movimentação; a ficha ganha o quadro Evolução, uma linha do tempo das fases com a data em que cada uma começou e os dias nela. Só lê o andamento já registrado: sem migração, sem permissão nova e sem tramitar fora do SEI.
- [ ] Dados da instituição num lugar só (fora do plano, PR rascunho): razão social, CNPJ, endereço, contato e dirigente se cadastram só na Configuração do cliente; a aba Autarquia da Configuração da Folha mostra esses dados para leitura e edita só o que é da folha e do eSocial (código IBGE, regime tributário, responsável contábil, ambiente do eSocial). eSocial, CNAB da folha e a remessa do Gestão MAX passam a ler a identidade da Configuração do cliente, com o que já estava na Folha como reserva. Sem mudança de banco.
- [x] Remessa OBN600 dos pagamentos (fora do plano, PR #153): na Conciliação bancária, a aba "Remessa OBN600" lista os pagamentos programados ou autorizados que ainda não saíram, e o sistema gera o arquivo de ordens bancárias de crédito em conta no mesmo leiaute do sistema estadual (conferido byte a byte com as remessas de 25/09, 08/10 e 15/10/2026); cada pagamento vira uma OB com o número do pagamento, e o retorno importado dá a baixa (pago ou recusado) pelo nº da OB. A conta pagadora ganha código do cliente no BB, UG e gestão, editáveis na aba "Contas pagadoras" da própria Conciliação (o mesmo cadastro de Configurações da Folha → Bancos, que vale para a folha e para o Financeiro). Falta confirmar com o BB se o arquivo pode ser enviado por fora do sistema estadual e testar uma remessa real.
- [ ] Folha histórica do SIGRH, ajustes da revisão (fora do plano, PR rascunho): só mês encerrado (o corrente era aceito e fechado), CPF cadastrado com mais de 11 dígitos não casa, base de INSS sem a rubrica que não incide, aviso quando faltam as alíquotas patronais e valor "1234.56" da planilha lido como decimal.
- [x] #146 — Folha histórica do SIGRH (fora do plano): na Central de Importações, o importador "Folha do SIGRH (espelho)" lê o espelho do mês (PDF FPAG10, relatório analítico de conferência do SIGRH novo ou planilha analítica por evento), confere a soma de cada servidor e do órgão com o total impresso, acha o servidor pelo CPF e grava a folha mensal fechada com a ficha e as rubricas de cada um, para o contracheque e o informe de rendimentos dos meses pagos antes do sistema. Não grava por cima de folha que já existe nem com servidor não cadastrado. Conferido com os espelhos de 03 a 09/2026 (todos batem centavo a centavo).
- [x] #141 — Retorno do banco da remessa da folha (fora do plano): na aba Remessas CNAB da folha, cada remessa recebe o arquivo de retorno (.ret) que o banco devolveu; a tela casa cada crédito com a ficha pelo seu número que a remessa grava (ou, em arquivo de outro sistema, pelo CPF e o valor), mostra agendados, pagos e recusados com o motivo do banco e grava tudo de uma vez; a prévia do BB deixa a remessa como enviada e o retorno final sem agendado, como processada; o mesmo arquivo não entra duas vezes. Conferido com o retorno real da folha de 09/2026 (94 agendados e 5 recusados). O retorno das ordens bancárias do FIPLAN (OBN) continua pela conciliação do financeiro.
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
