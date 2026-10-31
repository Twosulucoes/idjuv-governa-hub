# Módulos

Detalhamento funcional de cada módulo e suas principais páginas. As rotas do sistema vivem
em `src/App.tsx` e as do site institucional (portal público e formulários) em `src/AppSite.tsx`
(só os caminhos de `ROTAS_DO_SITE`, em `src/core/modo-app.ts`); contagem de rotas por módulo em
[ESTADO_DO_SISTEMA.md](./ESTADO_DO_SISTEMA.md#módulos). O menu geral em `src/config/menu.config.ts` e a barra lateral de cada módulo em
`src/config/module-menus.config.ts`; a definição dos módulos em `src/shared/config/modules.config.ts`.

Item de menu só aponta para tela que existe: o teste `src/config/menu.config.test.ts` reprova o PR se algum item
dos dois menus levar a um endereço sem `<Route>` no `App.tsx` (P09, 16/10/2026). Tela que ainda não existe fica fora
do menu até ser construída.

Cada módulo declara em `rotas` os prefixos de URL que são dele; vence o prefixo mais longo
(`/admin/federacoes` é de `organizacoes`, não de `admin`). O `ProtectedRoute` usa esse mapa para
devolver 404 em tela de módulo que a instituição não contratou, mesmo sem `requiredModule` na rota.
Página nova sob um prefixo que não é de módulo nenhum precisa entrar em `rotas` ou na lista de
transversais do teste `src/shared/config/modules.config.test.ts`. Ver
[RBAC_PERMISSOES.md](./RBAC_PERMISSOES.md#permissões-nas-rotas-p08-16102026).

---

## Administração (`admin`)

Gestão do próprio sistema. Páginas em `src/pages/admin/` (~25):

- **Usuários & acesso**: `GestaoUsuariosPage`, `UsuarioDetalhePage`,
  `UsuariosAdminPage`, `UsuariosTecnicosPage`, `ControleAcessoAdminPage`,
  `PainelPermissoesPage`, `GestaoPerfilPage`, `ConfigCamposPreCadastroPage`.
- **Operação**: `AdminDashboardPage`, `CentralAprovacoesPage`,
  `CentralRelatoriosPage`, `RelatorioAdminPage`, `GestaoDocumentosPage`,
  `GestaoModulosPage`, `GerenciadorPaginasPage` (publicação de páginas públicas).
- **Reuniões**: `ReunioesPage`, `ConfiguracaoReunioesPage`, `CheckinReuniaoPage`.
- **Infra**: `AuditoriaPage`, `DisasterRecoveryPage`,
  `DatabaseSchemaPage`, `CalibradorSegadPage`, `SobreSistemaPage`, `AdminHelpPage`.
  `DisasterRecoveryPage` (`/admin/disaster-recovery`) é informativa desde o P13: explica o backup diário, o banco
  novo pelo baseline e o front pelo CI, sem baixar arquivo (ver [BACKUP.md](./BACKUP.md)).
- **Histórico de importações**: `ImportacoesPage` (`/admin/importacoes`, `admin.auditoria`) mostra o histórico
  (`importacoes`) e onde cada arquivo é importado; desde 29/10/2026 cada setor importa no próprio menu (ver
  [ARQUITETURA.md](./ARQUITETURA.md)). Importadores: QDD do FIPLAN, tabelas do FIPLAN (planilhas "Consultar
  ..." de função, programa, elemento, subelemento, fonte e finalidade de pagamento) e arquivo do banco
  (OBN600/CNAB 240), do financeiro, planilha de portarias, do gabinete (com botão "Baixar modelo"), e o espelho da
  folha do SIGRH (PDF FPAG10, relatório analítico de conferência ou planilha analítica), da folha, que grava a folha
  mensal já paga, com a ficha de cada servidor, e a deixa fechada.
- **Envio de e-mail e WhatsApp**: `ConfigEnviosPage` (`/admin/envios`, menu "E-mail e WhatsApp"). O
  cliente configura o remetente (SMTP próprio ou Resend), a identidade visual do e-mail e o WhatsApp
  oficial (Meta Cloud API, templates por uso), grava as credenciais (só escrita, no Vault), envia teste
  e consulta o histórico. Desenho: `docs/superpowers/specs/2026-10-09-envio-email-whatsapp-design.md`.

- **Configuração do cliente**: `ConfiguracaoClientePage` (`/admin/configuracao-cliente`, menu
  "Configuração do Cliente"). Nome do sistema, nome oficial, sigla, CNPJ, base legal, dirigente,
  endereço, contato e integrações da instituição, gravados em `dados_oficiais` e aplicados ao app
  inteiro sem novo deploy. Ver `docs/CONFIGURACAO_CLIENTE.md`.

## Recursos Humanos (`rh`)

O maior módulo. Páginas em `src/pages/rh/` (~20), além de `folha/` e `curriculo/`:

- **Servidores**: `GestaoServidoresPage`, `ServidorFormPage`, `ServidorDetalhePage`,
  `DiagnosticoPendenciasServidoresPage`, `AniversariantesPage`.
- **Lotação/designação**: `GestaoLotacaoPage`, `GestaoDesignacoesPage`. A designação de chefia de unidade local
  (aba da ficha do servidor, `DesignacoesUnidadeTab`) registra o ato feito no SEI: tipo, processo SEI, número do ato,
  assinatura, publicação e DOE, todos completáveis depois (lápis na linha); sem número, "aguardando SEI".
- **Frequência/ponto**: `GestaoFrequenciaPage`, `ConfiguracaoFrequenciaPage`,
  `ControlePacotesFrequenciaPage`, `ValidacaoFrequenciaPage` (`/rh/frequencia/validacao`:
  fila de abonos com aprovação chefia → RH e rejeição com motivo; grade de fechamento
  servidor × validado/consolidado/reaberto, consolidação em lote, reabertura com
  justificativa e fechamento da competência — só sem abono em aberto e com todos
  consolidados). Regras puras em `src/lib/frequenciaFluxo.ts`; `LancarFaltaDialog`
  bloqueia lançamento em competência `consolidado` ou fechamento consolidado sem reabertura.
- **Afastamentos**: `GestaoFeriasPage`, `GestaoLicencasPage`, `GestaoViagensPage`.
  Viagens a serviço (`/rh/viagens`, tabela `viagens_diarias`): criar e editar
  (`ViagemFormDialog`, campos liberados conforme o status), cancelar com motivo
  (`CancelarViagemDialog`; o motivo vai para `observacoes`), excluir fisicamente só como super
  admin em viagem `solicitada` sem SEI/portaria, `Select` de status limitado às transições
  `solicitada → autorizada → em_andamento → concluida` (cancelar só de solicitada/autorizada) e
  workflow DIRAF (nº do SEI). Quantidade de diárias contada pelas datas (uma por pernoite + meia
  no retorno; sem pernoite = meia) e valor unitário sugerido pela tabela de diárias do perfil do
  tenant (`rh.diarias`, por categoria/nível do cargo e faixa de destino: intermunicipal,
  interestadual, internacional), com "ajuste manual" justificado; tabela vazia → valor manual.
  Regras puras em `src/lib/diariasRegras.ts`, dados em `src/hooks/useViagens.ts`.
- **Portarias**: `CentralPortariasPage`, `PendenciasPortariasPage`. O texto do ato é feito no SEI; o sistema só
  acompanha o ciclo (processo SEI, número, assinatura, DOE) e grava na ficha.
- **Contracheques**: `MeuContrachequePage`, `ConsultaContrachequesPage`.
- **Autoatendimento**: `MeusDadosPage` (`/rh/meus-dados`, só leitura: dados pessoais,
  contato, endereço, funcionais, bancários, vínculos e lotações do servidor logado);
  `MinhaFrequenciaPage` (`/rh/minha-frequencia`: resumo mensal, situação do fechamento
  e solicitações de abono do servidor logado, com formulário para abrir uma nova).
- **Relatórios** (`RelatoriosRHPage`, `/rh/relatorios`): PDFs de quadro de pessoal e portarias
  (por diretoria, por vínculo, histórico funcional, vagas por cargo, servidores com portaria,
  situação e agrupamento por portaria) e a seção "Afastamentos, frequência, viagens e folha" com
  cinco cards (`src/components/rh/relatorios/`), cada um com filtros, prévia "N registros" e
  exportação em **PDF e XLSX**: **Férias** (período, unidade, status; por unidade com subtotal de
  dias), **Licenças e afastamentos** (período, unidade, status; por tipo com subtotal de dias),
  **Frequência** (competência ano/mês, unidade, opção de agrupar por unidade no PDF; só
  servidores ativos, limitação de `useFrequenciaResumo`) e **Viagens e diárias** (período,
  unidade, status, ônus; totais de diárias e valor por unidade e geral). O período filtra por
  sobreposição (entra o registro cujo intervalo cruza o período). Dados em
  `src/hooks/useRelatoriosRH.ts` (colunas explícitas, filtro no banco, paginação de 1000),
  regras puras em `src/lib/relatoriosRHRegras.ts`, PDFs em `src/lib/pdfRelatoriosAfastamentos.ts`
  e `src/lib/pdfRelatorioFrequencia.ts`. LGPD: servidor identificado por nome e matrícula; sem
  CPF, CID/CRM/médico, documento comprobatório, observações de licença ou dados bancários.
  O quinto card, **Folha de pagamento** (`RelatorioFolhaCard.tsx`), aparece só para quem tem
  `financeiro.folha.visualizar` ou é super admin e traz três relatórios agregados: **resumo do
  ano** (uma linha por folha de `folhas_pagamento`: competência, tipo, status, servidores, bruto,
  descontos, líquido, INSS servidor/patronal, IRRF, encargos, com total do ano), **por unidade**
  (fichas de uma folha somadas por `unidade_nome`) e **por rubrica** (itens de uma folha somados
  por tipo e descrição, em blocos de proventos e descontos com subtotal). Só folhas `aberta`,
  `fechada` ou `reaberta` podem ser detalhadas (`folhaPermiteDetalhe`). Dados em
  `useFolhasDoAno`, `useFichasDaFolhaAgregadas` e `useItensDaFolha` (`useRelatoriosRH.ts`), regras
  em `src/lib/relatoriosFolhaRegras.ts`, PDFs em `src/lib/pdfRelatoriosFolha.ts`. Sem nome de
  servidor, CPF, PIS ou dados bancários; o relatório nominal de folha ficou fora (decisão pendente).
- **Apoio**: `ModelosDocumentosPage`, `ExportacaoPlanilhaPage`.
- **Folha** (`src/pages/folha/`): `GestaoFolhaPagamentoPage`, `ConfiguracaoFolhaPage`,
  `FolhaDetalhePage`, `FolhaBloqueadaPage`. Inclui cálculo (INSS/IRRF), rubricas,
  consignações, geração de CNAB e eventos eSocial. No detalhe da folha, a ficha de cada
  servidor (`FichaFinanceiraDialog`) permite, com a folha em `previa`/`aberta`/`reaberta` e a
  permissão `financeiro.folha.processar`: incluir/editar/excluir itens (`ItemFichaFormDialog`;
  totais da ficha = vencimento/INSS/IRRF gravados pela RPC + itens, e da folha = soma das fichas,
  recalculados no front por `recalcularTotaisFicha`; INSS/IRRF só no reprocessamento),
  cadastrar/suspender/retomar/quitar consignações do servidor com margem sobre o líquido da ficha
  antes das consignações e "Lançar na ficha" como desconto (`ConsignacoesFichaTab`), e manter
  dependentes IRRF com badge de vigência na competência (`DependentesIRRFFichaTab`; inativar, sem
  excluir). Regras puras em `src/lib/folhaFichaRegras.ts`. `ProcessarFolhaDialog` avisa quantos
  itens serão apagados pelo reprocessamento (a RPC recria as fichas e não lança consignações).
  Spec: `superpowers/specs/2026-10-09-folha-detalhe-edicao-design.md`; migração complementar
  (13b) pendente na Onda B.
  Na configuração da folha, a aba **Atos e reajustes** (`AtosRemuneratoriosTab`, `AtoRemuneratorioForm`, dados em
  `useAtosRemuneratorios.ts`, regras em `src/lib/atosRemuneratorios.ts`) registra a lei, o decreto ou a instrução
  normativa que muda valores, com o que muda: vencimento ou subsídio do cargo, valor da rubrica ou parâmetro da folha,
  um a um ou por reajuste percentual dos cargos. Aplicar (com `financeiro.folha.configurar`) grava o valor anterior e
  a vigência; daí em diante o ato não muda. A folha usa o vencimento do cargo vigente no fim da competência, avisa
  vigência no meio do mês e não calcula diferenças de meses já fechados.
  Na aba **Remessas CNAB** do detalhe da folha, cada remessa recebe o **retorno do banco** (`ImportarRetornoDialog`,
  `src/components/folha/RetornoRemessa.tsx`; regras em `src/lib/bancario/retornoFolha.ts`): o `.ret` é lido, cada
  crédito é casado com a ficha pelo seu número da remessa (ou pelo CPF e o valor) e a tela mostra agendados, pagos e
  recusados com o motivo do banco antes de gravar (`financeiro.folha.processar`). Os retornos gravados aparecem abaixo
  das remessas, com os recusados de cada um.
- **Currículo/pré-cadastro** (`src/pages/curriculo/`): `MiniCurriculoPage` (público),
  `GestaoPreCadastrosPage`, `DiagnosticoPendenciasPage`.

## Processos / Workflow (`workflow`)

Acompanhamento dos processos que correm no SEI (decisão de 13/10/2026; o sistema não é um SEI interno): etapa,
unidade, prazo e checklist de cada processo. Despacho, documento, assinatura e publicação continuam no SEI. Spec:
[`2026-10-13-tramitacao-acompanhamento-sei-design`](./superpowers/specs/2026-10-13-tramitacao-acompanhamento-sei-design.md);
banco e RPCs em [BANCO_DE_DADOS.md](./BANCO_DE_DADOS.md#acompanhamento-de-processos-do-sei); permissões em
[RBAC_PERMISSOES.md](./RBAC_PERMISSOES.md#workflow-acompanhamento-de-processos-do-sei). Dados e ações em
`src/hooks/useAcompanhamentoProcessos.ts` (tabelas e view tipadas por `types.ts`; toda
escrita é por RPC `wf_*`).

- **Menu:** o módulo aparece como "Processos SEI" e o menu tem só "Localizar processo" e "Parados" (a tramitação é
  no SEI). A lista e o "Novo processo" continuam abrindo pelos atalhos do painel.
- **Painel `/workflow`** (`src/pages/modulos/WorkflowDashboardPage`, dados de `useWorkflowDashboardStats`): processos
  ativos, na minha unidade, vencidos, e contagem por tipo e por etapa, com links para a lista filtrada. Os agrupamentos
  leem até 1000 linhas e avisam quando o limite é atingido.
- **Lista `/workflow/processos`** (`GestaoProcessosPage`): abas "Na minha unidade" (unidade da lotação ativa do usuário
  em `lotacoes.ativo`; sem lotação, aviso para pedir ao RH) e "Todos"; colunas Nº interno, Nº SEI, tipo, assunto,
  etapa, unidade, situação e prazo (semáforo: em dia, vence logo, vencido, sem prazo); filtros por tipo, etapa,
  unidade, situação e prazo; busca por assunto, interessado, número interno ou SEI. Lê `?meus=`, `?tipo=`, `?etapa=`,
  `?unidade=`, `?prazo=`, `?status=` e `?acao=novo`. Limite de 1000 linhas com aviso. "Novo processo" (`NovoProcessoDialog`)
  exige `workflow.criar`.
- **Detalhe `/workflow/processos/:id`** (`ProcessoDetalhePage`): cabeçalho com situação, sigilo e prazo; Nº SEI
  (editável com `workflow.tramitar`, em andamento e na etapa 1); trilha das etapas (`TrilhaEtapas`) com unidade e
  prazo; checklist (`ChecklistEtapa`) marcado com `workflow.tramitar`; ações (`AcoesProcesso`) Avançar, Devolver,
  Suspender, Reativar, Concluir e Arquivar conforme permissão e situação; abas Linha do tempo, Despachos e Documentos
  (só leitura: mostram o que já existe, sem botão de despachar ou anexar) e Credenciais (`CredenciaisSigiloTab`, só
  `workflow.admin`: conceder, trocar nível e revogar). Processo antigo, sem modelo, aparece sem trilha nem checklist e só
  pode ser concluído ou arquivado.
- **Guias `/processos/*`** (`src/components/processos/GuiaProcessoModelo`, usado por Compras, Diárias, Convênios,
  Almoxarifado, Pagamentos e Patrimônio): etapas (unidade e prazo) e checklist lidos do modelo no banco, botão
  "Iniciar processo" (exige `workflow.criar`) e aba "Processos" com os processos reais do tipo (exige
  `workflow.visualizar`). Patrimônio tem duas abas, Tombamento e Baixa; Distribuição e Inventário saíram do guia, por
  não terem fluxo nem checklist próprio.
- **Veículos `/processos/veiculos`**: sem dados; mostra "Controle de frota ainda não implantado".
- **Localizar processo `/processos/localizar`** (`src/pages/processos/LocalizarProcessoPage`, dados de
  `useLocalizadorSei`, rota transversal com login; primeiro item do menu de Processos): uma caixa de busca aceita o nº
  SEI em qualquer formato ou palavras do objeto, do assunto ou do setor, e mostra um cartão por processo SEI com o
  objeto, onde está, a última movimentação, o botão "Copiar número" (para colar na pesquisa do SEI) e cada registro
  que o sistema tem dele (processo acompanhado, contratação com a barra de evolução, passagem, demanda do PCA, empenho,
  ato, termo de cessão, diária), com link para a tela dele. A aba Parados (`?aba=parados`, item "Parados" do menu)
  lista contratações e processos acompanhados em andamento sem movimentação há mais de 15 dias, com filtro por setor.
  Só lê; a pessoa só acha o que já veria nos módulos dela (funções em
  [BANCO_DE_DADOS.md](./BANCO_DE_DADOS.md), spec
  [2026-10-25-localizador-processos-sei-design](./superpowers/specs/2026-10-25-localizador-processos-sei-design.md)).
- **Etapas, prazos e checklist** vêm da carga inicial das migrações; os marcados "(proposta)" na spec aguardam
  confirmação do órgão. Não há tela de edição de modelo.
- **Unidades**: a etapa aponta para a unidade pela sigla em `estrutura_organizacional`; sigla sem cadastro deixa a
  unidade nula e a tela mostra a sigla. Ver Backlog em [ROADMAP.md](./planejamento/ROADMAP.md).

## Compras (`compras`) e Contratos (`contratos`)

Licitações, aquisições e gestão contratual. Operados via
`src/pages/processos/ComprasProcessoPage` e dashboards de módulo
(`ComprasDashboardPage`, `ContratosDashboardPage`). Backend: `processos_licitatorios`,
`contratos`, `atas_registro_preco`, `fornecedores`, etc. Atas SRP, fornecedores e as telas de execução e fiscalização
dos contratos ainda não existem (voltam no P20/P21, entregas C3 a C6); alterações e vencimentos chegaram na C2. Os menus seguem
o ciclo: Compras tem PCA, Programação por natureza (`/compras/programacao`: disponível do QDD, reservado em
processos e saldo livre), Processos de contratação e "Como funciona uma compra" (o guia `/processos/compras`, por
último); Contratos tem o que vem depois do contrato assinado (a lista e a ficha dos contratos; as passagens aéreas
foram para o Gabinete da Presidência, que emite os pedidos e confere as faturas, e o contrato da agência continua
aqui). O painel de Contratos mostra os contratos em vigor, os que vencem em até 90 dias, os vencidos sem encerrar, os
vencimentos sem providência, os sem gestor ou fiscal e o valor em vigor (cada número abre a lista ou a tela
Vencimentos já filtrada); os atalhos levam à lista, aos vencimentos, à importação e aos processos de contratação, cada
um só para quem tem a permissão; nenhum aponta mais para o guia de Compras.

- **Contratos (entrega C1):** `/contratos/lista` lista os contratos com nº, processo SEI, objeto, contratado, setor,
  gestor, valor atual e vigência (selo de prazo), com filtros de situação e de prazo (em vigor, vence em até 30, 60, 90
  ou 120 dias, vencidos, sem gestor ou fiscal), busca, planilha e o botão "Importar planilha" (abre ali mesmo,
  importador `contratos_planilha`, com simulação antes de gravar). A ficha (`/contratos/:id`) tem as abas Dados, Itens
  (soma dos itens × valor do contrato), Gestor e fiscais (designar com a portaria do SEI, encerrar com data e motivo;
  aviso quando falta gestor ou fiscal, art. 117 da Lei 14.133) e Histórico (quem mudou o quê); os botões copiam o nº SEI,
  emitem a ficha em PDF, editam e apagam o rascunho. O contrato entra no localizador de processos do SEI. Cadastrar pede
  `contratos.criar`, alterar pede `contratos.editar` e só o rascunho se apaga
  ([spec](./superpowers/specs/2026-10-27-contratos-gestao-completa-design.md)).
- **Contratos (entrega C2):** a ficha ganha a aba **Alterações**: termo aditivo (prazo, valor e/ou objeto),
  apostilamento (reajuste, repactuação, dotação, prorrogação pelo tempo suspenso), suspensão (com a retomada),
  rescisão (unilateral, consensual ou judicial) e a "situação anterior ao sistema", cada uma com o processo e o
  documento do SEI, a data e o DOE. O banco calcula o valor atual, o fim atual e a situação (rescindido, suspenso); o
  cadastro não pede mais esses campos e ganha "Reforma". A aba mostra o quadro (inicial, acréscimos, supressões,
  reajustes, atual; fim original, atual e limite de prorrogação) e avisa, sem bloquear, quando os acréscimos passam de
  25% do valor inicial atualizado (50% em reforma, art. 125) ou o prazo passa do máximo. A tela
  **Vencimentos** (`/contratos/vencimentos`) mostra o que venceu e o que vence em 30, 60, 90 e 120 dias e as garantias
  que acabam antes, com a ação esperada (prorrogar, nova contratação, regularizar), o limite de prorrogação e a
  providência registrada pelo NuAC (com o processo SEI; sai sozinha quando o aditivo de prazo é registrado), filtro
  "Só sem providência" e planilha. O sino avisa "Contratos vencendo" ao gestor e aos fiscais dos contratos deles e a
  quem tem `contratos.editar`. Registrar alteração e providência pede `contratos.editar`. Aviso por e-mail fica para
  depois ([plano](./superpowers/plans/2026-10-30-contratos-c2-alteracoes-vencimentos.md)).

## Financeiro (`financeiro`)

ERP orçamentário. `src/pages/financeiro/` (15 arquivos em 2026-10-11; o painel do módulo em `/financeiro` é
`src/pages/modulos/FinanceiroDashboardPage`): `QDDPage`, `AlteracoesOrcamentariasPage`, `SolicitacoesPage`,
`EmpenhosPage`, `SubEmpenhosPage`, `LiquidacoesPage`, `PagamentosPage`, `PagamentoDetalhePage`,
`AdiantamentosPage`, `RestosAPagarPage`, `ContasBancariasPage`, `ConciliacaoBancariaPage`,
`RelatoriosFinanceiroPage` e `PlaceholderDetalheFinanceiroPage` (ainda usada em
`/financeiro/solicitacoes/:id` e `/financeiro/empenhos/:id`).
Fluxo: dotação (FIPLAN) → solicitação → empenho → liquidação → pagamento → arquivo do banco.
- **Menu enxuto (26/10/2026).** O orçamento é do FIPLAN, então o menu traz só o que lê o FIPLAN ou o
  complementa: Painel, QDD, Empenhos (FIP 614), Favorecidos, Contas Bancárias e Conciliação. Liquidações e
  Pagamentos ficam no submenu **"Contingência (regularizar no FIPLAN)"**: lançamentos que não entram direto no
  FIPLAN (FIPLAN fechado de janeiro a abril, tarifas bancárias, contas de convênio) e saem pela remessa OBN600,
  regularizados depois no FIPLAN. O botão da tela de Empenhos virou "Empenho de contingência". Solicitações,
  Sub-Empenhos, Restos a Pagar, Alterações Orçamentárias e Adiantamentos saíram do menu (e dos
  atalhos do painel e do QDD); as rotas continuam no `App.tsx` até a limpeza do banco. "Relatórios" voltou ao menu em
  30/10/2026 como o Gerador de relatórios (abaixo).
Spec da reorganização: [`2026-10-11-financeiro-fiplan-banco-design.md`](./superpowers/specs/2026-10-11-financeiro-fiplan-banco-design.md).

- **O FIPLAN é a fonte da verdade do orçamento.** O `QDDPage` importa o PDF "Quadro de Detalhamento da
  Despesa - QDD" exportado do FIPLAN (permissão `orcamento.importar`), que cria/atualiza `fin_dotacoes` do
  exercício e sobrescreve empenhado/liquidado/pago; o antigo import de planilha XLSX saiu (a exportação XLSX
  continua). O topo da tela traz os cartões de resumo do exercício (dotação atual, empenhado, saldo disponível)
  e o aviso "Atualizado pelo FIPLAN em <data> · <arquivo>" (ou "Ainda não importado"), lido do último registro
  em `importacoes`. Não há mais "Nova dotação": dotação vem do FIPLAN. Logo abaixo, uma tabela única compara a
  dotação comum (livre, em destaque) com cada tipo de emenda. A tabela de dotações abre na visão **Resumo** (atual,
  reserva, PED, empenhado e disponível, cabendo num notebook de 1366 px sem rolar de lado); **Todas as colunas** mostra
  as 13 colunas de valor do FIPLAN e a escolha fica lembrada no navegador. Valores em números tabulares da fonte do
  sistema (sem fonte monoespaçada).
- **Atualizar o Financeiro `/financeiro/atualizar`** (menu "Atualizar dados"): a rotina de arquivos que mantém o
  módulo em dia, com um cartão por item: QDD e FIP 614 (semanal), retorno do banco (depois de cada remessa),
  conciliação do mês (FIP 630, FIP 103, OFX e extrato do fundo; em dia até o dia 10 do mês seguinte) e Tabelas do
  FIPLAN (anual). Cada cartão traz os passos no FIPLAN, a última importação (`importacoes`) ou o último mês fechado
  (`fin_conciliacoes_mensais`), o selo em dia / atrasado / nunca importado e o botão que abre o importador
  (abre na própria tela, `/financeiro/atualizar?importador=<id>`, só com a permissão dele; os PEDs do FIPLAN entram
  como item semanal, e o FIP 002 – Demonstrativo de Diárias também, com o caminho e os filtros no cartão). Rotina e regras em
  `src/lib/financeiro/rotinaAtualizacao.ts` (com testes). O sistema não baixa nada do FIPLAN sozinho.
- **Diárias `/financeiro/diarias`** (menu "Diárias" no Financeiro e "Diárias pagas (FIPLAN)" no RH;
  `financeiro.diarias.visualizar` ou `rh.viagens.visualizar`): as diárias pagas no
  exercício, lidas do FIP 002 (`fin_diarias_fiplan`): total pago, servidores, sem prestação de contas e atrasadas
  (mais de 10 dias depois do retorno, prazo informado pelo Financeiro), filtro pela prestação, busca e Excel. Cada
  diária é ligada ao servidor pelo nome e à viagem do RH pela data de saída; a viagem em `/rh/viagens` mostra
  "Paga no FIPLAN em dd/mm" e se as contas foram prestadas, e a aba Viagens da ficha funcional do servidor
  (`/rh/servidores/:id`) lista as diárias dele no FIPLAN, com o selo da prestação (`DiariasFiplanServidor`). Regras em `src/lib/financeiro/diariasFiplan.ts`, dados em
  `src/hooks/useDiariasFiplan.ts`, importador `diarias_fiplan` (`financeiro.execucao.importar`).
- **Gerador de relatórios `/financeiro/relatorios`** (menu "Relatórios", `orcamento.visualizar`; spec
  [`2026-10-30-gerador-relatorios-design.md`](./superpowers/specs/2026-10-30-gerador-relatorios-design.md)): o usuário
  escolhe a fonte (QDD, Empenhos do FIP 614, PEDs, Documentos do empenho, Diárias, Emendas, Convênios federais; Diárias e
  Convênios só aparecem com `financeiro.diarias.visualizar` e `financeiro.convenios.visualizar`), marca e ordena as
  colunas, filtra com a barra de filtros do design system, agrupa em até 2 níveis, escolhe soma, média, maior ou menor
  em cada coluna de valor e a ordem; a prévia mostra as primeiras linhas com subtotais e total, o PDF sai pelo motor
  (`relatorios-gerador`, com a linha dos filtros) e a planilha leva tudo, com R$ como número. Modelos: prontos (no código,
  `src/config/relatoriosDinamicos/index.ts`), meus e do setor (`relatorios_modelos`; período como "este mês" fica
  relativo; só o autor altera). Fontes em `src/config/relatoriosDinamicos/financeiro.ts` (leitura de mil em mil até 20 mil
  linhas), lógica pura em `src/lib/relatoriosDinamicos/` (com testes), dados em `src/hooks/useRelatoriosDinamicos.ts`. A
  Central de relatórios da Administração lista o gerador.
- **Painel `/financeiro` (execução do exercício)**, calculado no navegador sobre o QDD (`fin_dotacoes`) e o
  FIP 614 (`fin_empenhos`), sem tabela própria. As contas ficam em `src/lib/financeiro/painelExecucao.ts` (com
  testes) e os quadros em `src/components/financeiro/painel/`:
  - faixa com a data da última importação do QDD e do FIP 614 (amarela quando o QDD tem mais de 7 dias), com o
    link "Ver o que atualizar" para `/financeiro/atualizar`;
  - cartões de autorizado, empenhado, liquidado, pago, saldo para empenhar e reservado (PED). O saldo usa a conta
    do FIPLAN (autorizado − bloqueado − PED, sendo o PED do QDD a soma do empenhado com a Cont./Reserva; vale o
    maior entre o PED e empenhado + reserva), não a coluna `saldo_disponivel`;
  - execução por grupo de despesa, com gráfico e tabela;
  - alertas de saldo: dotações cujo saldo não cobre o resto do ano no ritmo do que já foi liquidado. Os
    vencimentos e as obrigações patronais contam o 13º;
  - fila de pagamento por credor: o que falta liquidar e o que já foi liquidado e falta pagar;
  - as 5 maiores despesas por elemento.

  Para manter o painel em dia, importe o QDD e o FIP 614 toda semana. Spec:
  [`2026-10-23-painel-financeiro-fiplan-design.md`](./superpowers/specs/2026-10-23-painel-financeiro-fiplan-design.md).
- **Orçamento saiu do menu.** `OrcamentoPage` foi removida; `/financeiro/orcamento` redireciona para
  `/financeiro/qdd`.
- **Exercício único no módulo.** O seletor `SeletorExercicio` (hook `useExercicioFinanceiro`, ver
  [GUIA_FRONTEND.md](./GUIA_FRONTEND.md)) aparece no painel, QDD, Alterações, Solicitações, Empenhos,
  Sub-Empenhos, Liquidações, Pagamentos, Adiantamentos e Conciliação. O ano vai para a URL (`?exercicio=`) e os
  links internos o preservam. Liquidações e Adiantamentos passaram a filtrar por exercício.
- **Alterações orçamentárias** ganharam número do processo SEI e a coluna "FIPLAN" (pendente/confirmada, com
  data). A ação "Confirmar no FIPLAN" é manual, com diálogo de confirmação, e exige `orcamento.aprovar` no banco.
- **Solicitações:** "Nova solicitação" abre `SolicitacaoFormDialog` (rascunho no exercício selecionado).
  **Contas bancárias:** "Nova conta" abre `ContaBancariaFormDialog` (banco, agência, conta).
- **Detalhe do pagamento** (`/financeiro/pagamentos/:id`, `PagamentoDetalhePage`): dados da ordem de pagamento
  e o histórico bancário ligado a ela (remessa, retorno e reenvio lidos dos arquivos do banco e lançamentos do
  extrato do BB).
- **Conciliação bancária** (`/financeiro/conciliacao`, `ConciliacaoBancariaPage`, permissão
  `pagamento.conciliar`; ver [RBAC_PERMISSOES.md](./RBAC_PERMISSOES.md)), em três abas:
  - *Movimentos*: importa remessa ou retorno do banco (OBN600 do FIPLAN ou CNAB 240) pelo assistente de
    importação, lista os movimentos do exercício por situação (pago, recusado, enviado, sem pagamento) e permite
    vincular à mão um movimento a um pagamento (`ConciliarMovimentoDialog`);
  - *Recusados*: corrigir banco/agência/conta (`CorrigirContaDialog`, com consulta à API de Validação de Contas
    do BB para conta do banco 001) e gerar o arquivo de reenvio no leiaute do BB Gestão MAX
    (`GerarRemessaDialog`; o NSA é reservado no banco). O arquivo é baixado e enviado pelo usuário no Gestão
    MAX; o retorno volta pela aba Movimentos;
  - *Banco do Brasil (API)*: situação da conexão, botão "Testar conexão" e importação do extrato de uma conta do
    BB por período de até 31 dias (`BancoDoBrasilApiPainel`, Edge Function `bb-api`). Só leitura: nenhum
    pagamento é feito pela API.
  Componentes em `src/components/financeiro/conciliacao/`; dados em `src/hooks/useConciliacaoBancaria.ts`.
- **Convênios federais** (`/financeiro/convenios`, menu "Convênios federais", permissão
  `financeiro.convenios.visualizar`): propostas, emendas e convênios com a União lidos todo dia do Transferegov, com
  valor global, recebido, fim da vigência e alertas (sem assinatura, vigência ou prestação de contas a 60 dias ou
  vencida). A ficha (`/financeiro/convenios/:id`) mostra a proposta, o convênio, as emendas (autor e valor) e os
  empenhos e desembolsos da União. Só leitura: corrigir é no Transferegov. Aviso quando a rotina parou há mais de 3
  dias. Spec: [`2026-10-29-convenios-federais-transferegov-design.md`](./superpowers/specs/2026-10-29-convenios-federais-transferegov-design.md).

## Patrimônio (`patrimonio`) e Mobile (`patrimonio_mobile`)

Bens, inventário, almoxarifado e unidades.

- **Inventário** (`src/pages/inventario/`, ~14): `DashboardInventarioPage`,
  `BensPatrimoniaisPage`, `BemDetalhePage`, `MovimentacoesPatrimonioPage`,
  `CampanhasInventarioPage`, `CampanhaDetalhePage`, `ColetaInventarioPage`,
  `AlmoxarifadoEstoquePage`, `RequisicoesMaterialPage`, `ManutencoesBensPage`,
  `BaixasPatrimonioPage`, `RelatoriosPatrimonioPage`, `CadastroBemSimplificadoPage`,
  `PainelCampoInventarioPage`.
- **Inventário de campo — fase 1** (migração `20261009160000`, aplicada em
  produção em 2026-10-09): `PainelCampoInventarioPage` em `/inventario/campanhas/:id/painel`
  (`patrimonio.visualizar`; link "Painel de campo" no detalhe da campanha) mostra
  mapa satélite/ruas com as unidades por situação, contadores, lista filtrável e
  o detalhe da unidade com as fotos de evidência. Ações: incluir unidades na
  campanha e importar KML (casa placemarks com unidades pelo nome, com
  confirmação). Componentes em `src/components/inventario/`
  (`MapaUnidadesCampanha`, `DetalheUnidadeCampanha`, `ImportarKmlDialog`,
  `IncluirUnidadesCampanhaDialog`); dados em `useVistoriaInventario`.
- **Unidades locais** (`src/pages/unidades/`): `GestaoUnidadesLocaisPage`,
  `UnidadeDetalhePage`, `RelatoriosCentralPage`, `RelatoriosUnidadesLocaisPage`,
  `RelatoriosCedenciaPage` (cessões de espaços). Termo de cessão (aba "Termos de Cessão" do detalhe da unidade,
  `TermosCessaoTab`): o termo é feito e assinado no SEI; o sistema registra o termo da reserva aprovada com processo
  SEI, número do termo no SEI, data da assinatura e DOE (todos opcionais na hora do registro) e permite completar
  ou cancelar depois (lápis na linha). Sem número, a lista mostra "aguardando SEI" e a etapa é "Aguardando SEI";
  numerado, "Numerado no SEI"; com a assinatura, "Assinado". Termos antigos guardam o número interno que o sistema
  gerava.
- **Mobile/PWA** (`src/pages/mobile/`): `PatrimonioMobileUnificadoPage`
  (cadastro + coleta em campo, com leitura de QR via `html5-qrcode` e modo
  offline via `useColetaOffline`), `InstalarAppPage`. O cartão "Vistoria de
  Unidade" abre `src/components/mobile/VistoriaUnidade.tsx`: escolher campanha e
  unidade, ver GPS e precisão, fotografar (as fotos ficam numa fila offline no
  aparelho até haver conexão), marcar situação e observação (salvas só online) e
  ver as fotos pendentes de envio.

## Governança (`governanca`)

Estrutura e compliance. `src/pages/governanca/` + `organograma/` + `cargos/`:
`EstruturaOrganizacionalPage`, `OrganogramaPage`/`GestaoOrganogramaPage`
(diagrama via `reactflow`), `GestaoCargosPage`, `MatrizRaciPage`,
`LeiCriacaoPage`, `DecretoPage`, `RegimentoInternoPage`, `PortariasPage`,
`RelatorioGovernancaPage`. Riscos, controles internos, checklists e decisões administrativas têm tabelas no
banco (`riscos_institucionais`, `controles_internos`, `checklists_conformidade`, `decisoes_administrativas`), mas
ainda não têm tela; saíram do menu no P09 e voltam no P18.

`QuadroVagasPage` (`/cargos/vagas`, botão "Quadro de vagas" em `GestaoCargosPage`): cada vaga com código, cargo,
unidade, situação (livre, ocupada, extinta) e ocupante; KPIs de vagas ativas, ocupadas, livres e extintas; abas
"Vagas" e "Histórico do quadro" e histórico por vaga. "Importar planilha" (`ImportarQuadroVagasDialog`, só com
`governanca.cargos.gerenciar`) baixa o modelo XLSX, lê XLSX/XLS/CSV, simula e depois grava. Dados em
`useQuadroVagas`; regras no banco em [BANCO_DE_DADOS.md](./BANCO_DE_DADOS.md#quadro-de-vagas).

## Integridade (`integridade`)

Ética e canal de denúncias. `src/pages/integridade/`: `DenunciasPage` (público),
`GestaoDenunciasPage` + `IntegridadeDashboardPage` (código de ética, conflito de
interesses, política). A barra do módulo leva a Código de Ética, Conflito de Interesses e Política de Integridade
(antes "Comitê de Ética" e "Compliance", que não tinham tela).

## Transparência (`transparencia`)

Portal público (LGPD-safe, sem login) + gestão. `src/pages/transparencia/`:
`PortalLAIPage` (e-SIC), `CargosRemuneracaoPage`, `LicitacoesPublicasPage`,
`ExecucaoOrcamentariaPage`, `PatrimonioPublicoPage`. Usa views `v_*` para expor
dados sem PII. `TransparenciaDashboardPage` para a parte administrativa.

## Comunicação / ASCOM (`comunicacao`)

Demandas e CMS. `src/pages/ascom/` + `comunicacao/`: `GestaoDemandasAscomPage`,
`NovaDemandaAscomPage`, `DetalheDemandaAscomPage`, `SolicitacaoPublicaAscomPage`
(público) e `ConsultaProtocoloAscomPage` (público). CMS: `CMSConteudosPage`,
`CMSEditorPage`, `CMSBannersPage`, `CMSGaleriasPage`. Mais
`CalendarioComunicacaoPage` e `AniversariantesComunicacaoPage`.

**Avisos e datas importantes** (`src/pages/avisos/AvisosPage.tsx`, rota `/avisos`, item "Avisos e
Datas" no menu da Comunicação). Aberta a qualquer usuário logado: aba **Mural** com os avisos
vigentes do seu público e aba **Datas** com o calendário do mês (datas cadastradas, feriados de
`dias_nao_uteis` completados pela BrasilAPI e aniversariantes do mês). A aba **Gerenciar** aparece
para quem tem `avisos.gerenciar`. Todas as telas de módulo (`ModuleLayout`) mostram o sino de avisos
não lidos e próximas datas (`AvisosSino`) e, no topo do conteúdo, os avisos em destaque ou urgentes
ainda não lidos (`AvisosDestaque`). Desenho: `docs/superpowers/specs/2026-10-09-avisos-e-datas-importantes-design.md`.

## Programas (`programas`)

Programas sociais/esportivos. `src/pages/programas/`: `BolsaAtletaPage`,
`JuventudeCidadaPage`, `EsporteComunidadePage`, `JovemEmpreendedorPage`,
`JogosEscolaresPage`, e o subconjunto **Seleções Estudantis** (hot site público
em `eventos/SeletivaEstudantilV2Page` + gestão em `programas/selecoes/`). A barra do módulo lista os 5 programas e
as Seleções; "Ações" e "Beneficiários" saíram do menu no P09 (sem tela nem tabela) e voltam no P19.

## Gestores Escolares (`gestores_escolares`)

Credenciamento para os Jogos Escolares (JER). `src/pages/cadastrogestores/`:
`FormularioGestorPage` (público), `ConsultaGestorPage` (público),
`AdminGestoresPage`, `ImportarEscolasPage`, `RelatoriosGestoresPage`,
`AuditoriaWorkflowPage`.

## Organizações (`organizacoes`)

Federações e instituições parceiras. `src/pages/federacoes/`
(`CadastroFederacaoPage` público, `GestaoFederacoesPage`, `FederacaoDetalhePage`)
e `src/pages/instituicoes/GestaoInstituicoesPage`.

## Árbitros (`arbitros`)

`src/pages/cadastro-arbitros/`: `CadastroArbitroPage` (público) e
`admin/ArbitrosAdminPage` (gestão e relatórios).

## Gabinete (`gabinete`)

Painel executivo da Presidência. `src/pages/gabinete/GabineteDashboardPage` +
rotas que reaproveitam Central de Portarias, pré-cadastros, ordem de missão e
relatório de viagem. O item "Workflow RH" saiu do menu no P09 (não havia tela); volta no P22 se for construído.

- **Passagens aéreas (entregas 1 a 3; no Gabinete desde a migração `20261110120000`, antes em Contratos):** `/gabinete/passagens` lista os pedidos, um por processo SEI, com
  quem pediu, evento, passageiros, situação e valor emitido, e no alto o valor do contrato da agência, o emitido e o
  saldo. A ficha (`/gabinete/passagens/:id`) tem as abas Passageiros e trechos (cotações, emissão, remarcação,
  cancelamento e reembolso de cada trecho), Prestação de contas, Dados e Histórico. Passageiro é servidor (com a viagem do RH, quando houver)
  ou beneficiário de fora, cadastrado em `/gabinete/passagens/beneficiarios` ou na hora. O ato fica no SEI: a aprovação
  do Presidente é só registrada (nº do documento e data). Na Prestação de contas, cada passageiro entrega o cartão de
  embarque e, no modo individual, o relatório (para servidor, vale o relatório apresentado no RH); no modo evento, um
  relatório só, do responsável da delegação; dispensa sempre com motivo; anexos privados. `/gabinete/passagens/pendencias`
  lista quem voltou e não entregou, com vencimento e atraso; o pedido só conclui sem pendência.
  `/gabinete/passagens/faturas` (entrega 3) mostra o valor do contrato, o emitido, o faturado, o pago, o a faturar e o
  saldo; a aba Faturas lança cada nota da agência com os bilhetes que ela cobre (a conferência mostra a diferença entre a
  nota e os bilhetes) e anda com ela até paga, com o atesto, a liquidação e a OB; a aba A faturar lista os bilhetes sem
  nota, com destaque depois de 30 dias; a aba Empenhos liga os empenhos do FIP 614 ao contrato e mostra o empenho de cada
  ano × emitido. Lançar fatura e ligar empenho pedem `contratos.passagens.financeiro`. Saem a planilha de passagens por
  período (filtre por pessoa ou instituição), a planilha de faturas e os PDFs do saldo e da ficha do pedido
  ([spec](./superpowers/specs/2026-10-24-contratos-passagens-aereas-design.md)).
  O contrato da agência é do setor de Contratos (quem tem `contratos.criar` cadastra ou liga); o Gabinete vê o contrato
  da agência e o saldo sem precisar do módulo Contratos. Os endereços antigos `/contratos/passagens*` abrem o mesmo
  lugar no Gabinete.

- **Importar portarias por planilha:** quem tem `gabinete.portarias.importar` registra portarias já feitas no SEI pelo botão
  "Importar planilha" da Central de Portarias (`/gabinete/portarias`, importador "Portarias (planilha)"): baixa o modelo, preenche uma linha por portaria
  (servidores por matrícula), simula e confirma. Tudo ou nada; portaria que já existe só ganha o que falta. Ver
  [BANCO_DE_DADOS.md](./BANCO_DE_DADOS.md#importar-portarias-importar_portarias_planilha).

---

## Formulários institucionais

`src/pages/formularios/`: `TermoDemandaPage`, `OrdemMissaoPage`,
`RelatorioViagemPage`, `RequisicaoMaterialPage`, `TermoResponsabilidadePage`. A tela CPSI (DFD/ETP/TR) saiu na
onda 5 do P23: esses atos são feitos no SEI.

## Portal público (sem login)

`src/pages/public/` (notícias e galerias),
`PortalPreviewPage`, além das rotas públicas de transparência, currículo, ASCOM,
federações, árbitros e gestores escolares — todas sob `PublicPageGuard`.
