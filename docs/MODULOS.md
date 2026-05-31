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

## Recursos Humanos (`rh`)

O maior módulo. Páginas em `src/pages/rh/` (~20), além de `folha/` e `curriculo/`:

- **Servidores**: `GestaoServidoresPage`, `ServidorFormPage`, `ServidorDetalhePage`,
  `DiagnosticoPendenciasServidoresPage`, `AniversariantesPage`.
- **Lotação/designação**: `GestaoLotacaoPage`, `GestaoDesignacoesPage`.
- **Frequência/ponto**: `GestaoFrequenciaPage`, `ConfiguracaoFrequenciaPage`,
  `ControlePacotesFrequenciaPage`.
- **Afastamentos**: `GestaoFeriasPage`, `GestaoLicencasPage`, `GestaoViagensPage`.
- **Portarias**: `CentralPortariasPage`, `PendenciasPortariasPage`,
  `AtribuicaoPortariasPage`.
- **Contracheques**: `MeuContrachequePage`, `ConsultaContrachequesPage`.
- **Apoio**: `RelatoriosRHPage`, `ModelosDocumentosPage`, `ExportacaoPlanilhaPage`.
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

## Patrimônio (`patrimonio`) e Mobile (`patrimonio_mobile`)

Bens, inventário, almoxarifado e unidades.

- **Inventário** (`src/pages/inventario/`, ~14): `DashboardInventarioPage`,
  `BensPatrimoniaisPage`, `BemDetalhePage`, `MovimentacoesPatrimonioPage`,
  `CampanhasInventarioPage`, `CampanhaDetalhePage`, `ColetaInventarioPage`,
  `AlmoxarifadoEstoquePage`, `RequisicoesMaterialPage`, `ManutencoesBensPage`,
  `BaixasPatrimonioPage`, `RelatoriosPatrimonioPage`, `CadastroBemSimplificadoPage`.
- **Unidades locais** (`src/pages/unidades/`): `GestaoUnidadesLocaisPage`,
  `UnidadeDetalhePage`, `RelatoriosCentralPage`, `RelatoriosUnidadesLocaisPage`,
  `RelatoriosCedenciaPage` (cessões de espaços).
- **Mobile/PWA** (`src/pages/mobile/`): `PatrimonioMobileUnificadoPage`
  (cadastro + coleta em campo, com leitura de QR via `html5-qrcode` e modo
  offline via `useColetaOffline`), `InstalarAppPage`.

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
</content>
