

# Plano: Organizacao Completa de Formularios por Modulo

## Inventario Completo do Sistema

O sistema possui **70+ formularios/dialogs**, **95+ paginas** e **40+ hooks** que serao organizados em **10 modulos funcionais**.

---

## Distribuicao de Formularios por Modulo

### 1. MODULO RH (Recursos Humanos)

**Rotas:** `/rh/*`, `/folha/*`, `/curriculo/*`

#### Componentes - Pre-Cadastro (14 arquivos)
| Arquivo | Tipo | Origem |
|---------|------|--------|
| DadosPessoaisForm.tsx | Form | src/components/curriculo/ |
| DocumentosForm.tsx | Form | src/components/curriculo/ |
| EnderecoForm.tsx | Form | src/components/curriculo/ |
| PrevidenciaForm.tsx | Form | src/components/curriculo/ |
| EscolaridadeForm.tsx | Form | src/components/curriculo/ |
| AptidoesForm.tsx | Form | src/components/curriculo/ |
| ChecklistForm.tsx | Form | src/components/curriculo/ |
| DadosBancariosForm.tsx | Form | src/components/curriculo/ |
| DependentesForm.tsx | Form | src/components/curriculo/ |
| RevisaoForm.tsx | Form | src/components/curriculo/ |
| ConversaoServidorDialog.tsx | Dialog | src/components/curriculo/ |
| PendenciasPreCadastroDialog.tsx | Dialog | src/components/curriculo/ |
| VerificarCpfDialog.tsx | Dialog | src/components/curriculo/ |
| OrientacoesDocumentosCard.tsx | Card | src/components/curriculo/ |

#### Componentes - Servidor (20 arquivos)
| Arquivo | Tipo | Origem |
|---------|------|--------|
| ProvimentoForm.tsx | Form | src/components/rh/ |
| ExoneracaoForm.tsx | Form | src/components/rh/ |
| DesignacaoForm.tsx | Form | src/components/rh/ |
| CessaoForm.tsx | Form | src/components/rh/ |
| RetornoCessaoForm.tsx | Form | src/components/rh/ |
| VinculoFuncionalForm.tsx | Form | src/components/rh/ |
| LotacaoForm.tsx | Form | src/components/rh/ |
| EdicaoLoteBancarioDialog.tsx | Dialog | src/components/rh/ |
| CessoesSection.tsx | Section | src/components/rh/ |
| DesignacoesSection.tsx | Section | src/components/rh/ |
| NomeacoesProvimentosSection.tsx | Section | src/components/rh/ |
| PortariasServidorSection.tsx | Section | src/components/rh/ |
| SegundoVinculoSection.tsx | Section | src/components/rh/ |
| SeletorDocumentoVinculo.tsx | Selector | src/components/rh/ |
| ServidorFrequenciaConfigCard.tsx | Card | src/components/rh/ |
| HistoricoFuncionalTab.tsx | Tab | src/components/rh/ |
| ExportacaoServidoresCard.tsx | Card | src/components/rh/ |
| RelatorioContatosEstrategicosCard.tsx | Card | src/components/rh/ |
| RelatorioSegundoVinculoCard.tsx | Card | src/components/rh/ |
| RelatorioServidoresDiretoriaCard.tsx | Card | src/components/rh/ |

#### Componentes - Portarias (16 arquivos)
| Arquivo | Tipo | Origem |
|---------|------|--------|
| PortariaForm.tsx | Form | src/components/portarias/ |
| NovaPortariaUnificada.tsx | Form | src/components/portarias/ |
| EditarPortariaDialog.tsx | Dialog | src/components/portarias/ |
| RetificarPortariaDialog.tsx | Dialog | src/components/portarias/ |
| PortariaColetivaDialog.tsx | Dialog | src/components/portarias/ |
| GerarPortariaManualDialog.tsx | Dialog | src/components/portarias/ |
| RegistrarAssinaturaDialog.tsx | Dialog | src/components/portarias/ |
| RegistrarPublicacaoDialog.tsx | Dialog | src/components/portarias/ |
| RelatorioPortariasDialog.tsx | Dialog | src/components/portarias/ |
| PortariaKanban.tsx | View | src/components/portarias/ |
| PortariaTable.tsx | Table | src/components/portarias/ |
| SelecionarServidoresTable.tsx | Table | src/components/portarias/ |
| CamposDinamicos.tsx | Component | src/components/portarias/ |
| ConfiguracaoTabela.tsx | Component | src/components/portarias/ |
| EditorArtigos.tsx | Component | src/components/portarias/ |

#### Componentes - Frequencia (4 arquivos)
| Arquivo | Tipo | Origem |
|---------|------|--------|
| LancarFaltaDialog.tsx | Dialog | src/components/frequencia/ |
| ImprimirFrequenciaDialog.tsx | Dialog | src/components/frequencia/ |
| ImprimirLoteFrequenciaDialog.tsx | Dialog | src/components/frequencia/ |
| config/ | Config | src/components/frequencia/ |

#### Componentes - Folha de Pagamento (20 arquivos)
| Arquivo | Tipo | Origem |
|---------|------|--------|
| NovaFolhaForm.tsx | Form | src/components/folha/ |
| RubricaForm.tsx | Form | src/components/folha/ |
| TabelaINSSForm.tsx | Form | src/components/folha/ |
| TabelaIRRFForm.tsx | Form | src/components/folha/ |
| ParametroForm.tsx | Form | src/components/folha/ |
| ContaAutarquiaForm.tsx | Form | src/components/folha/ |
| FecharFolhaDialog.tsx | Dialog | src/components/folha/ |
| ProcessarFolhaDialog.tsx | Dialog | src/components/folha/ |
| ReabrirFolhaDialog.tsx | Dialog | src/components/folha/ |
| GerarRemessaDialog.tsx | Dialog | src/components/folha/ |
| FichaFinanceiraDialog.tsx | Dialog | src/components/folha/ |
| GerarESocialDialog.tsx | Dialog | src/components/folha/ |
| HistoricoStatusFolhaDialog.tsx | Dialog | src/components/folha/ |
| PendenciasServidoresDialog.tsx | Dialog | src/components/folha/ |
| BancosContasTab.tsx | Tab | src/components/folha/ |
| ConfigAutarquiaTab.tsx | Tab | src/components/folha/ |
| ParametrosTab.tsx | Tab | src/components/folha/ |
| RubricasTab.tsx | Tab | src/components/folha/ |
| TabelasImpostosTab.tsx | Tab | src/components/folha/ |
| StatusFolhaIndicator.tsx | Component | src/components/folha/ |

#### Paginas RH (26 paginas)
| Pagina | Origem |
|--------|--------|
| GestaoServidoresPage.tsx | src/pages/rh/ |
| ServidorDetalhePage.tsx | src/pages/rh/ |
| ServidorFormPage.tsx | src/pages/rh/ |
| CentralPortariasPage.tsx | src/pages/rh/ |
| GestaoFrequenciaPage.tsx | src/pages/rh/ |
| GestaoFeriasPage.tsx | src/pages/rh/ |
| GestaoLicencasPage.tsx | src/pages/rh/ |
| GestaoDesignacoesPage.tsx | src/pages/rh/ |
| GestaoViagensPage.tsx | src/pages/rh/ |
| ConsultaContrachequesPage.tsx | src/pages/rh/ |
| MeuContrachequePage.tsx | src/pages/rh/ |
| AniversariantesPage.tsx | src/pages/rh/ |
| ModelosDocumentosPage.tsx | src/pages/rh/ |
| RelatoriosRHPage.tsx | src/pages/rh/ |
| ExportacaoPlanilhaPage.tsx | src/pages/rh/ |
| ConfiguracaoFrequenciaPage.tsx | src/pages/rh/ |
| ControlePacotesFrequenciaPage.tsx | src/pages/rh/ |
| DiagnosticoPendenciasServidoresPage.tsx | src/pages/rh/ |
| GestaoFolhaPagamentoPage.tsx | src/pages/folha/ |
| FolhaDetalhePage.tsx | src/pages/folha/ |
| FolhaBloqueadaPage.tsx | src/pages/folha/ |
| ConfiguracaoFolhaPage.tsx | src/pages/folha/ |
| GestaoPreCadastrosPage.tsx | src/pages/curriculo/ |
| MiniCurriculoPage.tsx | src/pages/curriculo/ |
| MiniCurriculoSucessoPage.tsx | src/pages/curriculo/ |
| DiagnosticoPendenciasPage.tsx | src/pages/curriculo/ |

#### Formularios Avulsos (para RH)
| Pagina | Origem | Destino |
|--------|--------|---------|
| OrdemMissaoPage.tsx | src/pages/formularios/ | src/modules/rh/pages/formularios/ |
| RelatorioViagemPage.tsx | src/pages/formularios/ | src/modules/rh/pages/formularios/ |

#### Hooks RH (18 hooks)
| Hook | Origem |
|------|--------|
| useServidorCompleto.ts | src/hooks/ |
| useFrequencia.ts | src/hooks/ |
| useFrequenciaPacotes.ts | src/hooks/ |
| useGerarFrequenciaPDF.ts | src/hooks/ |
| useConfigFrequencia.ts | src/hooks/ |
| useParametrizacoesFrequencia.ts | src/hooks/ |
| useConfigVidaFuncional.ts | src/hooks/ |
| useFolhaPagamento.ts | src/hooks/ |
| useMotorFolha.ts | src/hooks/ |
| useFechamentoFolha.ts | src/hooks/ |
| useContracheque.ts | src/hooks/ |
| useDesignacoes.ts | src/hooks/ |
| usePortarias.ts | src/hooks/ |
| usePreCadastro.ts | src/hooks/ |
| useVerificarCpf.ts | src/hooks/ |
| useConfigParametros.ts | src/hooks/ |
| useServidoresPorUnidade.ts | src/hooks/ |
| useRelatorios.ts | src/hooks/ |

---

### 2. MODULO PATRIMONIO (Inventario, Almoxarifado, Unidades)

**Rotas:** `/inventario/*`, `/unidades/*`, `/processos/patrimonio`, `/processos/almoxarifado`

#### Componentes - Inventario (5 arquivos)
| Arquivo | Tipo | Origem |
|---------|------|--------|
| NovaMovimentacaoDialog.tsx | Dialog | src/components/inventario/ |
| NovaBaixaDialog.tsx | Dialog | src/components/inventario/ |
| NovaManutencaoDialog.tsx | Dialog | src/components/inventario/ |
| NovaRequisicaoDialog.tsx | Dialog | src/components/inventario/ |
| NovoItemMaterialDialog.tsx | Dialog | src/components/inventario/ |

#### Componentes - Unidades (8 arquivos)
| Arquivo | Tipo | Origem |
|---------|------|--------|
| UnidadeLocalForm.tsx | Form | src/components/unidades/ |
| AgendaTab.tsx | Tab | src/components/unidades/ |
| DocumentosCedenciaUpload.tsx | Upload | src/components/unidades/ |
| ModalidadesSelector.tsx | Selector | src/components/unidades/ |
| NomeacoesTab.tsx | Tab | src/components/unidades/ |
| PatrimonioTab.tsx | Tab | src/components/unidades/ |
| TermosCessaoTab.tsx | Tab | src/components/unidades/ |
| reports/ | Reports | src/components/unidades/ |

#### Paginas Patrimonio (16 paginas)
| Pagina | Origem |
|--------|--------|
| DashboardInventarioPage.tsx | src/pages/inventario/ |
| BensPatrimoniaisPage.tsx | src/pages/inventario/ |
| BemDetalhePage.tsx | src/pages/inventario/ |
| MovimentacoesPatrimonioPage.tsx | src/pages/inventario/ |
| BaixasPatrimonioPage.tsx | src/pages/inventario/ |
| ManutencoesBensPage.tsx | src/pages/inventario/ |
| AlmoxarifadoEstoquePage.tsx | src/pages/inventario/ |
| RequisicoesMaterialPage.tsx | src/pages/inventario/ |
| CampanhasInventarioPage.tsx | src/pages/inventario/ |
| PlaceholderDetalhePage.tsx | src/pages/inventario/ |
| GestaoUnidadesLocaisPage.tsx | src/pages/unidades/ |
| UnidadeDetalhePage.tsx | src/pages/unidades/ |
| RelatoriosCedenciaPage.tsx | src/pages/unidades/ |
| RelatoriosCentralPage.tsx | src/pages/unidades/ |
| RelatoriosUnidadesLocaisPage.tsx | src/pages/unidades/ |

#### Formularios Avulsos (para Patrimonio)
| Pagina | Origem | Destino |
|--------|--------|---------|
| TermoResponsabilidadePage.tsx | src/pages/formularios/ | src/modules/patrimonio/pages/formularios/ |
| RequisicaoMaterialPage.tsx | src/pages/formularios/ | src/modules/patrimonio/pages/formularios/ |

#### Paginas de Processo (Patrimonio)
| Pagina | Origem |
|--------|--------|
| PatrimonioProcessoPage.tsx | src/pages/processos/ |
| AlmoxarifadoProcessoPage.tsx | src/pages/processos/ |

#### Hooks Patrimonio (3 hooks)
| Hook | Origem |
|------|--------|
| usePatrimonio.ts | src/hooks/ |
| useAlmoxarifado.ts | src/hooks/ |
| useAgrupamentoUnidades.ts | src/hooks/ |

---

### 3. MODULO GOVERNANCA (Estrutura, Organograma, Cargos, Federacoes)

**Rotas:** `/governanca/*`, `/organograma/*`, `/cargos/*`, `/lotacoes/*`, `/federacoes/*`, `/instituicoes/*`, `/programas/*`, `/integridade/*`

#### Componentes - Cargos (3 arquivos)
| Arquivo | Tipo | Origem |
|---------|------|--------|
| CargoForm.tsx | Form | src/components/cargos/ |
| CargoDetailDialog.tsx | Dialog | src/components/cargos/ |
| ComposicaoCargosEditor.tsx | Editor | src/components/cargos/ |

#### Componentes - Lotacoes (2 arquivos)
| Arquivo | Tipo | Origem |
|---------|------|--------|
| MemorandoLotacaoDialog.tsx | Dialog | src/components/lotacoes/ |
| RegistroEntregaDialog.tsx | Dialog | src/components/lotacoes/ |

#### Componentes - Organograma (4 arquivos)
| Arquivo | Tipo | Origem |
|---------|------|--------|
| ExportOrganogramaDialog.tsx | Dialog | src/components/organograma/ |
| OrganogramaCanvas.tsx | Canvas | src/components/organograma/ |
| UnidadeDetailPanel.tsx | Panel | src/components/organograma/ |
| UnidadeNode.tsx | Node | src/components/organograma/ |

#### Componentes - Federacoes (10 arquivos)
| Arquivo | Tipo | Origem |
|---------|------|--------|
| EditarFederacaoDialog.tsx | Dialog | src/components/federacoes/ |
| NovaCompeticaoDialog.tsx | Dialog | src/components/federacoes/ |
| NovaParceriaDialog.tsx | Dialog | src/components/federacoes/ |
| NovoArbitroDialog.tsx | Dialog | src/components/federacoes/ |
| CentralRelatoriosFederacoesDialog.tsx | Dialog | src/components/federacoes/ |
| CalendarioFederacaoTab.tsx | Tab | src/components/federacoes/ |
| CalendarioGeralFederacoesTab.tsx | Tab | src/components/federacoes/ |
| FederacaoParceriasTab.tsx | Tab | src/components/federacoes/ |
| FederacoesErrorBoundary.tsx | Error | src/components/federacoes/ |
| MandatoExpiradoBadge.tsx | Badge | src/components/federacoes/ |

#### Componentes - Instituicoes (4 arquivos)
| Arquivo | Tipo | Origem |
|---------|------|--------|
| InstituicaoFormDialog.tsx | Dialog | src/components/instituicoes/ |
| InstituicaoCard.tsx | Card | src/components/instituicoes/ |
| InstituicaoSelector.tsx | Selector | src/components/instituicoes/ |
| TipoInstituicaoBadge.tsx | Badge | src/components/instituicoes/ |

#### Componentes - Institucional (3 arquivos)
| Arquivo | Tipo | Origem |
|---------|------|--------|
| BadgeRascunho.tsx | Badge | src/components/institucional/ |
| DadoOficialDisplay.tsx | Display | src/components/institucional/ |

#### Paginas Governanca (21 paginas)
| Pagina | Origem |
|--------|--------|
| LeiCriacaoPage.tsx | src/pages/governanca/ |
| RegimentoInternoPage.tsx | src/pages/governanca/ |
| DecretoPage.tsx | src/pages/governanca/ |
| EstruturaOrganizacionalPage.tsx | src/pages/governanca/ |
| MatrizRaciPage.tsx | src/pages/governanca/ |
| PortariasPage.tsx | src/pages/governanca/ |
| RelatorioGovernancaPage.tsx | src/pages/governanca/ |
| OrganogramaPage.tsx | src/pages/governanca/ |
| GestaoOrganogramaPage.tsx | src/pages/organograma/ |
| OrganogramaPage.tsx | src/pages/organograma/ |
| GestaoCargosPage.tsx | src/pages/cargos/ |
| GestaoLotacoesPage.tsx | src/pages/lotacoes/ |
| GestaoFederacoesPage.tsx | src/pages/federacoes/ |
| FederacaoDetalhePage.tsx | src/pages/federacoes/ |
| CadastroFederacaoPage.tsx | src/pages/federacoes/ |
| GestaoInstituicoesPage.tsx | src/pages/instituicoes/ |
| BolsaAtletaPage.tsx | src/pages/programas/ |
| JuventudeCidadaPage.tsx | src/pages/programas/ |
| EsporteComunidadePage.tsx | src/pages/programas/ |
| JogosEscolaresPage.tsx | src/pages/programas/ |
| JovemEmpreendedorPage.tsx | src/pages/programas/ |

#### Paginas Integridade (2 paginas)
| Pagina | Origem |
|--------|--------|
| DenunciasPage.tsx | src/pages/integridade/ |
| GestaoDenunciasPage.tsx | src/pages/integridade/ |

#### Hooks Governanca (4 hooks)
| Hook | Origem |
|------|--------|
| useOrganograma.ts | src/hooks/ |
| useDadosOficiais.ts | src/hooks/ |
| useFederacoesRelatorio.ts | src/hooks/ |
| useInstituicoes.ts | src/hooks/ |

---

### 4. MODULO WORKFLOW (Processos Administrativos)

**Rotas:** `/workflow/*`

#### Componentes (3 arquivos)
| Arquivo | Tipo | Origem |
|---------|------|--------|
| NovoProcessoDialog.tsx | Dialog | src/components/workflow/ |
| NovoDespachoDialog.tsx | Dialog | src/components/workflow/ |
| NovaMovimentacaoDialog.tsx | Dialog | src/components/workflow/ |

#### Paginas (2 paginas)
| Pagina | Origem |
|--------|--------|
| GestaoProcessosPage.tsx | src/pages/workflow/ |
| ProcessoDetalhePage.tsx | src/pages/workflow/ |

#### Hooks (1 hook)
| Hook | Origem |
|------|--------|
| useWorkflow.ts | src/hooks/ |

---

### 5. MODULO COMPRAS (Licitacoes e Aquisicoes)

**Rotas:** `/processos/compras`, `/processos/diarias`, `/processos/convenios`, `/processos/veiculos`

#### Paginas de Processo (4 paginas)
| Pagina | Origem |
|--------|--------|
| ComprasProcessoPage.tsx | src/pages/processos/ |
| DiariasProcessoPage.tsx | src/pages/processos/ |
| ConveniosProcessoPage.tsx | src/pages/processos/ |
| VeiculosProcessoPage.tsx | src/pages/processos/ |

#### Formularios Avulsos (para Compras)
| Pagina | Origem | Destino |
|--------|--------|---------|
| TermoDemandaPage.tsx | src/pages/formularios/ | src/modules/compras/pages/formularios/ |

---

### 6. MODULO FINANCEIRO

**Rotas:** `/financeiro/*`

#### Paginas (11 paginas)
| Pagina | Origem |
|--------|--------|
| DashboardFinanceiroPage.tsx | src/pages/financeiro/ |
| OrcamentoPage.tsx | src/pages/financeiro/ |
| EmpenhosPage.tsx | src/pages/financeiro/ |
| LiquidacoesPage.tsx | src/pages/financeiro/ |
| PagamentosPage.tsx | src/pages/financeiro/ |
| SolicitacoesPage.tsx | src/pages/financeiro/ |
| AdiantamentosPage.tsx | src/pages/financeiro/ |
| ContasBancariasPage.tsx | src/pages/financeiro/ |
| RelatoriosFinanceiroPage.tsx | src/pages/financeiro/ |
| PlaceholderDetalheFinanceiroPage.tsx | src/pages/financeiro/ |
| PagamentosProcessoPage.tsx | src/pages/processos/ |

#### Hooks (1 hook)
| Hook | Origem |
|------|--------|
| useFinanceiro.ts | src/hooks/ |

---

### 7. MODULO ADMIN (Administracao do Sistema)

**Rotas:** `/admin/*`

#### Componentes (7 arquivos)
| Arquivo | Tipo | Origem |
|---------|------|--------|
| CriarUsuarioDialog.tsx | Dialog | src/components/admin/ |
| UsuarioModulosTab.tsx | Tab | src/components/admin/ |
| UsuarioPerfilTab.tsx | Tab | src/components/admin/ |
| AdminBreadcrumbs.tsx | Component | src/components/admin/ |
| AdminLayout.tsx | Layout | src/components/admin/ |
| AdminSearch.tsx | Search | src/components/admin/ |

#### Componentes - Reunioes (14 arquivos)
| Arquivo | Tipo | Origem |
|---------|------|--------|
| NovaReuniaoDialog.tsx | Dialog | src/components/reunioes/ |
| EditarReuniaoDialog.tsx | Dialog | src/components/reunioes/ |
| ExcluirReuniaoDialog.tsx | Dialog | src/components/reunioes/ |
| AdicionarParticipanteDialog.tsx | Dialog | src/components/reunioes/ |
| EnviarConvitesDialog.tsx | Dialog | src/components/reunioes/ |
| FiltrosReuniaoDialog.tsx | Dialog | src/components/reunioes/ |
| RelatoriosReuniaoDialog.tsx | Dialog | src/components/reunioes/ |
| ReuniaoDetailSheet.tsx | Sheet | src/components/reunioes/ |
| GestaoParticipantesTab.tsx | Tab | src/components/reunioes/ |
| AtaReuniaoTab.tsx | Tab | src/components/reunioes/ |
| AssinaturaConfigTab.tsx | Tab | src/components/reunioes/ |
| ModelosMensagemTab.tsx | Tab | src/components/reunioes/ |
| PreviewMensagem.tsx | Component | src/components/reunioes/ |

#### Paginas Admin (20 paginas)
| Pagina | Origem |
|--------|--------|
| AdminDashboardPage.tsx | src/pages/admin/ |
| UsuariosAdminPage.tsx | src/pages/admin/ |
| UsuarioDetalhePage.tsx | src/pages/admin/ |
| GestaoPerfilPage.tsx | src/pages/admin/ |
| AuditoriaPage.tsx | src/pages/admin/ |
| CentralAprovacoesPage.tsx | src/pages/admin/ |
| ReunioesPage.tsx | src/pages/admin/ |
| ConfiguracaoReunioesPage.tsx | src/pages/admin/ |
| CheckinReuniaoPage.tsx | src/pages/admin/ |
| GestaoDocumentosPage.tsx | src/pages/admin/ |
| CentralRelatoriosPage.tsx | src/pages/admin/ |
| RelatorioAdminPage.tsx | src/pages/admin/ |
| BackupOffsitePage.tsx | src/pages/admin/ |
| DisasterRecoveryPage.tsx | src/pages/admin/ |
| DatabaseSchemaPage.tsx | src/pages/admin/ |
| ControleAcessoAdminPage.tsx | src/pages/admin/ |
| SobreSistemaPage.tsx | src/pages/admin/ |
| AdminHelpPage.tsx | src/pages/admin/ |
| UsuariosTecnicosPage.tsx | src/pages/admin/ |
| CalibradorSegadPage.tsx | src/pages/admin/ |

#### Hooks Admin (6 hooks)
| Hook | Origem |
|------|--------|
| useAdminUsuarios.ts | src/hooks/ |
| useAdminPerfis.ts | src/hooks/ |
| useAuditLog.ts | src/hooks/ |
| useBackupOffsite.ts | src/hooks/ |
| useDatabaseSchema.ts | src/hooks/ |
| useApprovalRequests.ts | src/hooks/ |

---

### 8. MODULO COMUNICACAO (ASCOM)

**Rotas:** `/ascom/*`

#### Paginas (5 paginas)
| Pagina | Origem |
|--------|--------|
| GestaoDemandasAscomPage.tsx | src/pages/ascom/ |
| NovaDemandaAscomPage.tsx | src/pages/ascom/ |
| DetalheDemandaAscomPage.tsx | src/pages/ascom/ |
| ConsultaProtocoloAscomPage.tsx | src/pages/ascom/ |
| SolicitacaoPublicaAscomPage.tsx | src/pages/ascom/ |

#### Hooks (1 hook)
| Hook | Origem |
|------|--------|
| useDemandasAscom.ts | src/hooks/ |

---

### 9. MODULO TRANSPARENCIA

**Rotas:** `/transparencia/*`

#### Paginas (5 paginas)
| Pagina | Origem |
|--------|--------|
| PortalLAIPage.tsx | src/pages/transparencia/ |
| LicitacoesPublicasPage.tsx | src/pages/transparencia/ |
| PatrimonioPublicoPage.tsx | src/pages/transparencia/ |
| ExecucaoOrcamentariaPage.tsx | src/pages/transparencia/ |
| CargosRemuneracaoPage.tsx | src/pages/transparencia/ |

---

### 10. MODULO CONTRATOS

**Rotas:** `/contratos/*`

Modulo ainda sem implementacao. Sera criado como estrutura vazia para futuras funcionalidades.

---

## Resumo Quantitativo Final

| Modulo | Forms/Dialogs | Paginas | Hooks | Total |
|--------|---------------|---------|-------|-------|
| **RH** | 54 | 26 | 18 | 98 |
| **Patrimonio** | 13 | 16 | 3 | 32 |
| **Governanca** | 26 | 23 | 4 | 53 |
| **Workflow** | 3 | 2 | 1 | 6 |
| **Compras** | 1 | 5 | 0 | 6 |
| **Financeiro** | 0 | 11 | 1 | 12 |
| **Admin** | 21 | 20 | 6 | 47 |
| **Comunicacao** | 0 | 5 | 1 | 6 |
| **Transparencia** | 0 | 5 | 0 | 5 |
| **Contratos** | 0 | 0 | 0 | 0 |
| **TOTAL** | **118** | **113** | **34** | **265** |

---

## Nova Estrutura de Pastas

```text
src/
├── modules/
│   ├── admin/
│   │   ├── components/
│   │   │   ├── CriarUsuarioDialog.tsx
│   │   │   ├── UsuarioModulosTab.tsx
│   │   │   ├── UsuarioPerfilTab.tsx
│   │   │   ├── AdminBreadcrumbs.tsx
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── AdminSearch.tsx
│   │   │   └── reunioes/
│   │   │       └── (14 arquivos)
│   │   ├── hooks/
│   │   │   └── (6 hooks)
│   │   ├── pages/
│   │   │   └── (20 paginas)
│   │   └── index.ts
│   │
│   ├── rh/
│   │   ├── components/
│   │   │   ├── curriculo/  (14 arquivos)
│   │   │   ├── servidor/   (20 arquivos)
│   │   │   ├── portarias/  (16 arquivos)
│   │   │   ├── frequencia/ (4 arquivos)
│   │   │   └── folha/      (20 arquivos)
│   │   ├── hooks/
│   │   │   └── (18 hooks)
│   │   ├── pages/
│   │   │   ├── formularios/
│   │   │   │   ├── OrdemMissaoPage.tsx
│   │   │   │   └── RelatorioViagemPage.tsx
│   │   │   └── (24 paginas)
│   │   └── index.ts
│   │
│   ├── workflow/
│   │   ├── components/
│   │   │   └── (3 dialogs)
│   │   ├── hooks/
│   │   │   └── useWorkflow.ts
│   │   ├── pages/
│   │   │   └── (2 paginas)
│   │   └── index.ts
│   │
│   ├── compras/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── formularios/
│   │   │   │   └── TermoDemandaPage.tsx
│   │   │   └── (4 paginas processo)
│   │   └── index.ts
│   │
│   ├── contratos/
│   │   ├── components/
│   │   ├── pages/
│   │   └── index.ts
│   │
│   ├── financeiro/
│   │   ├── components/
│   │   ├── hooks/
│   │   │   └── useFinanceiro.ts
│   │   ├── pages/
│   │   │   └── (11 paginas)
│   │   └── index.ts
│   │
│   ├── patrimonio/
│   │   ├── components/
│   │   │   ├── inventario/ (5 dialogs)
│   │   │   └── unidades/   (8 arquivos)
│   │   ├── hooks/
│   │   │   └── (3 hooks)
│   │   ├── pages/
│   │   │   ├── formularios/
│   │   │   │   ├── TermoResponsabilidadePage.tsx
│   │   │   │   └── RequisicaoMaterialPage.tsx
│   │   │   └── (14 paginas)
│   │   └── index.ts
│   │
│   ├── governanca/
│   │   ├── components/
│   │   │   ├── cargos/       (3 arquivos)
│   │   │   ├── lotacoes/     (2 arquivos)
│   │   │   ├── organograma/  (4 arquivos)
│   │   │   ├── federacoes/   (10 arquivos)
│   │   │   ├── instituicoes/ (4 arquivos)
│   │   │   └── institucional/(3 arquivos)
│   │   ├── hooks/
│   │   │   └── (4 hooks)
│   │   ├── pages/
│   │   │   └── (23 paginas)
│   │   └── index.ts
│   │
│   ├── transparencia/
│   │   ├── components/
│   │   ├── pages/
│   │   │   └── (5 paginas)
│   │   └── index.ts
│   │
│   └── comunicacao/
│       ├── components/
│       ├── hooks/
│       │   └── useDemandasAscom.ts
│       ├── pages/
│       │   └── (5 paginas)
│       └── index.ts
│
├── shared/
│   ├── components/
│   │   ├── ui/           (shadcn/ui)
│   │   ├── layout/       (MainLayout, etc)
│   │   ├── menu/         (MenuSidebar, etc)
│   │   ├── navigation/   (NavLink)
│   │   ├── auth/         (ProtectedRoute)
│   │   ├── reports/      (Blocos relatorio)
│   │   └── database/     (Schema viewer)
│   ├── contexts/
│   ├── hooks/
│   │   ├── use-mobile.tsx
│   │   ├── use-toast.ts
│   │   ├── usePermissions.ts
│   │   ├── usePermissoesUsuario.ts
│   │   ├── useModulosUsuario.ts
│   │   ├── useUsuarios.ts
│   │   └── useLogoIdjuv.ts
│   ├── config/
│   │   └── modules.config.ts
│   ├── types/
│   └── lib/
│
├── integrations/
│   └── supabase/
│
├── App.tsx
├── main.tsx
└── index.css
```

---

## Arquivo de Configuracao Central

```typescript
// src/shared/config/modules.config.ts

export const MODULOS = [
  'admin',
  'rh', 
  'workflow',
  'compras',
  'contratos',
  'financeiro',
  'patrimonio',
  'governanca',
  'transparencia',
  'comunicacao',
] as const;

export type Modulo = typeof MODULOS[number];

export interface ModuleConfig {
  codigo: Modulo;
  nome: string;
  descricao: string;
  icone: string;
  cor: string;
  rotas: string[];
}

export const MODULES_CONFIG: ModuleConfig[] = [
  {
    codigo: 'admin',
    nome: 'Administracao',
    descricao: 'Usuarios, perfis, auditoria, reunioes',
    icone: 'Settings',
    cor: 'slate',
    rotas: ['/admin'],
  },
  {
    codigo: 'rh',
    nome: 'Recursos Humanos',
    descricao: 'Servidores, frequencia, ferias, portarias, folha',
    icone: 'Users',
    cor: 'blue',
    rotas: ['/rh', '/folha', '/curriculo'],
  },
  {
    codigo: 'workflow',
    nome: 'Processos',
    descricao: 'Tramitacao de processos administrativos',
    icone: 'GitBranch',
    cor: 'purple',
    rotas: ['/workflow'],
  },
  {
    codigo: 'compras',
    nome: 'Compras',
    descricao: 'Licitacoes e processos de aquisicao',
    icone: 'ShoppingCart',
    cor: 'orange',
    rotas: ['/processos/compras', '/processos/diarias', 
            '/processos/convenios', '/processos/veiculos'],
  },
  {
    codigo: 'contratos',
    nome: 'Contratos',
    descricao: 'Gestao e execucao contratual',
    icone: 'FileText',
    cor: 'amber',
    rotas: ['/contratos'],
  },
  {
    codigo: 'financeiro',
    nome: 'Financeiro',
    descricao: 'Orcamento, empenhos, pagamentos',
    icone: 'DollarSign',
    cor: 'green',
    rotas: ['/financeiro', '/processos/pagamentos'],
  },
  {
    codigo: 'patrimonio',
    nome: 'Patrimonio',
    descricao: 'Bens, inventario, almoxarifado, unidades',
    icone: 'Package',
    cor: 'cyan',
    rotas: ['/inventario', '/unidades', 
            '/processos/patrimonio', '/processos/almoxarifado'],
  },
  {
    codigo: 'governanca',
    nome: 'Governanca',
    descricao: 'Estrutura, organograma, cargos, federacoes, programas',
    icone: 'Building2',
    cor: 'indigo',
    rotas: ['/governanca', '/organograma', '/cargos', '/lotacoes',
            '/federacoes', '/instituicoes', '/programas', '/integridade'],
  },
  {
    codigo: 'transparencia',
    nome: 'Transparencia',
    descricao: 'Portal LAI e dados publicos',
    icone: 'Eye',
    cor: 'teal',
    rotas: ['/transparencia'],
  },
  {
    codigo: 'comunicacao',
    nome: 'Comunicacao',
    descricao: 'ASCOM e demandas de comunicacao',
    icone: 'Megaphone',
    cor: 'pink',
    rotas: ['/ascom'],
  },
];

export function findModuleByRoute(pathname: string): ModuleConfig | undefined {
  return MODULES_CONFIG.find(m => 
    m.rotas.some(r => pathname === r || pathname.startsWith(r + '/'))
  );
}
```

---

## Secao Tecnica

### Ordem de Execucao

1. Criar pasta `src/shared/` com config, lib, types, hooks compartilhados
2. Criar pasta `src/modules/` com 10 subpastas
3. Mover componentes de UI para `src/shared/components/ui/`
4. Mover layouts para `src/shared/components/layout/`
5. Mover cada modulo na ordem: admin -> rh -> patrimonio -> governanca -> workflow -> compras -> financeiro -> comunicacao -> transparencia -> contratos
6. Atualizar todos os imports para usar aliases `@/modules/` e `@/shared/`
7. Atualizar App.tsx com novos imports
8. Criar modules.config.ts
9. Atualizar MenuContext.tsx para filtrar por modulos
10. Testar navegacao em cada modulo

### Aliases a Configurar

```typescript
// vite.config.ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
    '@/modules': path.resolve(__dirname, './src/modules'),
    '@/shared': path.resolve(__dirname, './src/shared'),
  },
}
```

### Formularios Avulsos - Mapeamento Final

| Formulario Avulso | Modulo Destino |
|-------------------|----------------|
| OrdemMissaoPage.tsx | RH (viagens) |
| RelatorioViagemPage.tsx | RH (viagens) |
| TermoDemandaPage.tsx | Compras |
| TermoResponsabilidadePage.tsx | Patrimonio |
| RequisicaoMaterialPage.tsx | Patrimonio |

