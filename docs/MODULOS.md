# Módulos

Detalhamento funcional de cada módulo e suas principais páginas. As rotas vivem
em `src/App.tsx`; o menu lateral em `src/config/menu.config.ts`; a definição dos
módulos em `src/shared/config/modules.config.ts`.

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
- **Infra**: `AuditoriaPage`, `BackupOffsitePage`, `DisasterRecoveryPage`,
  `DatabaseSchemaPage`, `CalibradorSegadPage`, `SobreSistemaPage`, `AdminHelpPage`.
- **Importação de dados**: `ImportacoesPage` (`/admin/importacoes`) lista os importadores que o usuário
  pode usar e o histórico (`importacoes`). Primeiro importador: QDD do FIPLAN (financeiro).
- **Envio de e-mail e WhatsApp**: `ConfigEnviosPage` (`/admin/envios`, menu "E-mail e WhatsApp"). O
  cliente configura o remetente (SMTP próprio ou Resend), a identidade visual do e-mail e o WhatsApp
  oficial (Meta Cloud API, templates por uso), grava as credenciais (só escrita, no Vault), envia teste
  e consulta o histórico. Desenho: `docs/superpowers/specs/2026-10-09-envio-email-whatsapp-design.md`.

## Recursos Humanos (`rh`)

O maior módulo. Páginas em `src/pages/rh/` (~20), além de `folha/` e `curriculo/`:

- **Servidores**: `GestaoServidoresPage`, `ServidorFormPage`, `ServidorDetalhePage`,
  `DiagnosticoPendenciasServidoresPage`, `AniversariantesPage`.
- **Lotação/designação**: `GestaoLotacaoPage`, `GestaoDesignacoesPage`.
- **Frequência/ponto**: `GestaoFrequenciaPage`, `ConfiguracaoFrequenciaPage`,
  `ControlePacotesFrequenciaPage`, `ValidacaoFrequenciaPage` (`/rh/frequencia/validacao`:
  fila de abonos com aprovação chefia → RH e rejeição com motivo; grade de fechamento
  servidor × validado/consolidado/reaberto, consolidação em lote, reabertura com
  justificativa e fechamento da competência — só sem abono em aberto e com todos
  consolidados). Regras puras em `src/lib/frequenciaFluxo.ts`; `LancarFaltaDialog`
  bloqueia lançamento em competência `consolidado` ou fechamento consolidado sem reabertura.
- **Afastamentos**: `GestaoFeriasPage`, `GestaoLicencasPage`, `GestaoViagensPage`.
- **Portarias**: `CentralPortariasPage`, `PendenciasPortariasPage`,
  `AtribuicaoPortariasPage`.
- **Contracheques**: `MeuContrachequePage`, `ConsultaContrachequesPage`.
- **Autoatendimento**: `MeusDadosPage` (`/rh/meus-dados`, só leitura: dados pessoais,
  contato, endereço, funcionais, bancários, vínculos e lotações do servidor logado);
  `MinhaFrequenciaPage` (`/rh/minha-frequencia`: resumo mensal, situação do fechamento
  e solicitações de abono do servidor logado, com formulário para abrir uma nova).
- **Relatórios** (`RelatoriosRHPage`, `/rh/relatorios`): PDFs de quadro de pessoal e portarias
  (por diretoria, por vínculo, histórico funcional, vagas por cargo, servidores com portaria,
  situação e agrupamento por portaria) e a seção "Afastamentos, frequência e viagens" com
  quatro cards (`src/components/rh/relatorios/`), cada um com filtros, prévia "N registros" e
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
  Relatórios de folha (por competência, unidade e rubrica) ainda não existem (PR 15b).
- **Apoio**: `ModelosDocumentosPage`, `ExportacaoPlanilhaPage`.
- **Folha** (`src/pages/folha/`): `GestaoFolhaPagamentoPage`, `ConfiguracaoFolhaPage`,
  `FolhaDetalhePage`, `FolhaBloqueadaPage`. Inclui cálculo (INSS/IRRF), rubricas,
  consignações, geração de CNAB e eventos eSocial.
- **Currículo/pré-cadastro** (`src/pages/curriculo/`): `MiniCurriculoPage` (público),
  `GestaoPreCadastrosPage`, `DiagnosticoPendenciasPage`.

## Processos / Workflow (`workflow`)

Tramitação de processos administrativos (estilo SEI). `src/pages/workflow/`:
`GestaoProcessosPage`, `ProcessoDetalhePage` (despachos, encaminhamentos,
pareceres, prazos/SLA, documentos, sigilo).

## Compras (`compras`) e Contratos (`contratos`)

Licitações, aquisições e gestão contratual. Operados via
`src/pages/processos/ComprasProcessoPage` e dashboards de módulo
(`ComprasDashboardPage`, `ContratosDashboardPage`). Backend: `processos_licitatorios`,
`contratos`, `atas_registro_preco`, `fornecedores`, etc.

## Financeiro (`financeiro`)

ERP orçamentário. `src/pages/financeiro/` (~14):
`DashboardFinanceiroPage`, `OrcamentoPage`, `QDDPage`,
`AlteracoesOrcamentariasPage`, `SolicitacoesPage`, `EmpenhosPage`,
`SubEmpenhosPage`, `LiquidacoesPage`, `PagamentosPage`, `AdiantamentosPage`,
`RestosAPagarPage`, `ContasBancariasPage`, `RelatoriosFinanceiroPage`.
Fluxo: orçamento → solicitação → empenho → liquidação → pagamento.
O `QDDPage` importa o PDF "Quadro de Detalhamento da Despesa - QDD" exportado do FIPLAN
(permissão `orcamento.importar`), que cria/atualiza `fin_dotacoes` do exercício; o antigo
import de planilha XLSX saiu (a exportação XLSX continua).

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
  `RelatoriosCedenciaPage` (cessões de espaços).
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
`RelatorioGovernancaPage`. Inclui riscos, controles internos, checklists e
decisões administrativas (no menu/banco).

## Integridade (`integridade`)

Ética e canal de denúncias. `src/pages/integridade/`: `DenunciasPage` (público),
`GestaoDenunciasPage` + `IntegridadeDashboardPage` (código de ética, conflito de
interesses, política).

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
em `eventos/SeletivaEstudantilV2Page` + gestão em `programas/selecoes/`).

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
relatório de viagem.

---

## Formulários institucionais

`src/pages/formularios/`: `TermoDemandaPage`, `OrdemMissaoPage`,
`RelatorioViagemPage`, `RequisicaoMaterialPage`, `TermoResponsabilidadePage`,
`CPSIPage` (com assistente de IA via Edge Function `cpsi-ai-assistant`).

## Portal público (sem login)

`src/pages/public/` (notícias e galerias), `EmBrevePage` (home),
`PortalPreviewPage`, além das rotas públicas de transparência, currículo, ASCOM,
federações, árbitros e gestores escolares — todas sob `PublicPageGuard`.
