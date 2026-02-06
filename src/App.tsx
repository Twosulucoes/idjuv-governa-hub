import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Pages
import EmBrevePage from "./pages/EmBrevePage";
import ApresentacaoPage from "./pages/ApresentacaoPage";
import SistemaPage from "./pages/Index";
import NotFound from "./pages/NotFound";
import GovernancaPage from "./pages/GovernancaPage";
import ProcessosPage from "./pages/ProcessosPage";
import ManuaisPage from "./pages/ManuaisPage";
import IntegridadePage from "./pages/IntegridadePage";
import TransparenciaPage from "./pages/TransparenciaPage";
import ComprasProcessoPage from "./pages/processos/ComprasProcessoPage";
import DiariasProcessoPage from "./pages/processos/DiariasProcessoPage";
import PatrimonioProcessoPage from "./pages/processos/PatrimonioProcessoPage";
import AlmoxarifadoProcessoPage from "./pages/processos/AlmoxarifadoProcessoPage";
import ConveniosProcessoPage from "./pages/processos/ConveniosProcessoPage";
import VeiculosProcessoPage from "./pages/processos/VeiculosProcessoPage";
import PagamentosProcessoPage from "./pages/processos/PagamentosProcessoPage";
import DenunciasPage from "./pages/integridade/DenunciasPage";
import GestaoDenunciasPage from "./pages/integridade/GestaoDenunciasPage";
import LeiCriacaoPage from "./pages/governanca/LeiCriacaoPage";
import MatrizRaciPage from "./pages/governanca/MatrizRaciPage";
import DecretoPage from "./pages/governanca/DecretoPage";
import RegimentoInternoPage from "./pages/governanca/RegimentoInternoPage";
import OrganogramaPage from "./pages/organograma/OrganogramaPage";
import GestaoOrganogramaPage from "./pages/organograma/GestaoOrganogramaPage";
import GestaoCargosPage from "./pages/cargos/GestaoCargosPage";
import GestaoLotacoesPage from "./pages/lotacoes/GestaoLotacoesPage";
import TermoDemandaPage from "./pages/formularios/TermoDemandaPage";
import OrdemMissaoPage from "./pages/formularios/OrdemMissaoPage";
import RelatorioViagemPage from "./pages/formularios/RelatorioViagemPage";
import RequisicaoMaterialPage from "./pages/formularios/RequisicaoMaterialPage";
import TermoResponsabilidadePage from "./pages/formularios/TermoResponsabilidadePage";
import PortariasPage from "./pages/governanca/PortariasPage";
import RelatorioGovernancaPage from "./pages/governanca/RelatorioGovernancaPage";
import BolsaAtletaPage from "./pages/programas/BolsaAtletaPage";
import JuventudeCidadaPage from "./pages/programas/JuventudeCidadaPage";
import EsporteComunidadePage from "./pages/programas/EsporteComunidadePage";
import JovemEmpreendedorPage from "./pages/programas/JovemEmpreendedorPage";
import JogosEscolaresPage from "./pages/programas/JogosEscolaresPage";
import CargosRemuneracaoPage from "./pages/transparencia/CargosRemuneracaoPage";
import LicitacoesPublicasPage from "./pages/transparencia/LicitacoesPublicasPage";
import ExecucaoOrcamentariaPage from "./pages/transparencia/ExecucaoOrcamentariaPage";
import PatrimonioPublicoPage from "./pages/transparencia/PatrimonioPublicoPage";
import PortalLAIPage from "./pages/transparencia/PortalLAIPage";
import EstruturaOrganizacionalPage from "./pages/governanca/EstruturaOrganizacionalPage";

// RH Pages
import GestaoServidoresPage from "./pages/rh/GestaoServidoresPage";
import ServidorFormPage from "./pages/rh/ServidorFormPage";
import ServidorDetalhePage from "./pages/rh/ServidorDetalhePage";
import GestaoViagensPage from "./pages/rh/GestaoViagensPage";
import GestaoFeriasPage from "./pages/rh/GestaoFeriasPage";
import GestaoLicencasPage from "./pages/rh/GestaoLicencasPage";
import GestaoFrequenciaPage from "./pages/rh/GestaoFrequenciaPage";
import ConfiguracaoFrequenciaPage from "./pages/rh/ConfiguracaoFrequenciaPage";
import RelatoriosRHPage from "./pages/rh/RelatoriosRHPage";
import ModelosDocumentosPage from "./pages/rh/ModelosDocumentosPage";
import GestaoDesignacoesPage from "./pages/rh/GestaoDesignacoesPage";
import CentralPortariasPage from "./pages/rh/CentralPortariasPage";
import DiagnosticoPendenciasServidoresPage from "./pages/rh/DiagnosticoPendenciasServidoresPage";
import ExportacaoPlanilhaPage from "./pages/rh/ExportacaoPlanilhaPage";
import AniversariantesPage from "./pages/rh/AniversariantesPage";
import ControlePacotesFrequenciaPage from "./pages/rh/ControlePacotesFrequenciaPage";
import MeuContrachequePage from "./pages/rh/MeuContrachequePage";
import ConsultaContrachequesPage from "./pages/rh/ConsultaContrachequesPage";

// Folha de Pagamento (FASE FUTURA - Bloqueado)
import FolhaBloqueadaPage from "./pages/folha/FolhaBloqueadaPage";

// Unidades Locais
import GestaoUnidadesLocaisPage from "./pages/unidades/GestaoUnidadesLocaisPage";
import UnidadeDetalhePage from "./pages/unidades/UnidadeDetalhePage";
import RelatoriosCedenciaPage from "./pages/unidades/RelatoriosCedenciaPage";
import RelatoriosUnidadesLocaisPage from "./pages/unidades/RelatoriosUnidadesLocaisPage";
 import RelatoriosCentralPage from "./pages/unidades/RelatoriosCentralPage";

import NoticiasPage from "./pages/NoticiasPage";

// Auth Pages
import AuthPage from "./pages/AuthPage";
import AccessDeniedPage from "./pages/AccessDeniedPage";
import MeuPerfilPage from "./pages/MeuPerfilPage";
import TrocaSenhaObrigatoriaPage from "./pages/TrocaSenhaObrigatoriaPage";
import UsuariosAdminPage from "./pages/admin/UsuariosAdminPage";
import UsuarioDetalhePage from "./pages/admin/UsuarioDetalhePage";
import GestaoDocumentosPage from "./pages/admin/GestaoDocumentosPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminHelpPage from "./pages/admin/AdminHelpPage";
import ControleAcessoAdminPage from "./pages/admin/ControleAcessoAdminPage";
import CentralAprovacoesPage from "./pages/admin/CentralAprovacoesPage";
import AuditoriaPage from "./pages/admin/AuditoriaPage";
import GestaoPerfilPage from "./pages/admin/GestaoPerfilPage";
// Página PerfilPermissoesPage removida - sistema simplificado
import BackupOffsitePage from "./pages/admin/BackupOffsitePage";
import DisasterRecoveryPage from "./pages/admin/DisasterRecoveryPage";
import UsuariosTecnicosPage from "./pages/admin/UsuariosTecnicosPage";
import ReunioesPage from "./pages/admin/ReunioesPage";
import ConfiguracaoReunioesPage from "./pages/admin/ConfiguracaoReunioesPage";
import CheckinReuniaoPage from "./pages/admin/CheckinReuniaoPage";
import DatabaseSchemaPage from "./pages/admin/DatabaseSchemaPage";
import RelatorioAdminPage from "./pages/admin/RelatorioAdminPage";
import CalibradorSegadPage from "./pages/admin/CalibradorSegadPage";
import CentralRelatoriosPage from "./pages/admin/CentralRelatoriosPage";
import SobreSistemaPage from "./pages/admin/SobreSistemaPage";

// ASCOM
import GestaoDemandasAscomPage from "./pages/ascom/GestaoDemandasAscomPage";
import NovaDemandaAscomPage from "./pages/ascom/NovaDemandaAscomPage";
import DetalheDemandaAscomPage from "./pages/ascom/DetalheDemandaAscomPage";
import SolicitacaoPublicaAscomPage from "./pages/ascom/SolicitacaoPublicaAscomPage";
import ConsultaProtocoloAscomPage from "./pages/ascom/ConsultaProtocoloAscomPage";

// Federações
import CadastroFederacaoPage from "./pages/federacoes/CadastroFederacaoPage";
import GestaoFederacoesPage from "./pages/federacoes/GestaoFederacoesPage";
import FederacaoDetalhePage from "./pages/federacoes/FederacaoDetalhePage";
 
 // Instituições
 import GestaoInstituicoesPage from "./pages/instituicoes/GestaoInstituicoesPage";

// Mini-Currículo / Pré-Cadastro
import MiniCurriculoPage from "./pages/curriculo/MiniCurriculoPage";
import MiniCurriculoSucessoPage from "./pages/curriculo/MiniCurriculoSucessoPage";
import GestaoPreCadastrosPage from "./pages/curriculo/GestaoPreCadastrosPage";
import DiagnosticoPendenciasPage from "./pages/curriculo/DiagnosticoPendenciasPage";

// Workflow (SEI-like)
import GestaoProcessosPage from "./pages/workflow/GestaoProcessosPage";
import ProcessoDetalhePage from "./pages/workflow/ProcessoDetalhePage";

// Financeiro (ERP)
import {
  DashboardFinanceiroPage,
  SolicitacoesPage,
  EmpenhosPage,
  LiquidacoesPage,
  PagamentosPage,
  AdiantamentosPage,
  ContasBancariasPage,
  OrcamentoPage,
  RelatoriosFinanceiroPage,
  PlaceholderDetalheFinanceiroPage,
} from "./pages/financeiro";

// Inventário e Patrimônio
import {
  DashboardInventarioPage,
  BensPatrimoniaisPage,
  BemDetalhePage,
  MovimentacoesPatrimonioPage,
  CampanhasInventarioPage,
  AlmoxarifadoEstoquePage,
  RequisicoesMaterialPage,
  ManutencoesBensPage,
  BaixasPatrimonioPage,
  PlaceholderDetalhePage,
} from "./pages/inventario";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* ============================================ */}
              {/* ROTAS PÚBLICAS - Sem autenticação */}
              {/* ============================================ */}
              <Route path="/" element={<EmBrevePage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/acesso-negado" element={<AccessDeniedPage />} />
              <Route path="/curriculo" element={<MiniCurriculoPage />} />
              <Route path="/curriculo/sucesso" element={<MiniCurriculoSucessoPage />} />
              <Route path="/curriculo/:codigo" element={<MiniCurriculoPage />} />
              <Route path="/ascom/solicitar" element={<SolicitacaoPublicaAscomPage />} />
              <Route path="/ascom/consultar" element={<ConsultaProtocoloAscomPage />} />
              <Route path="/federacoes/cadastro" element={<CadastroFederacaoPage />} />
              
              {/* ============================================ */}
              {/* ROTAS PROTEGIDAS - Apenas autenticação */}
              {/* (Sem mapeamento em ROUTE_PERMISSIONS) */}
              {/* ============================================ */}
              
              <Route path="/sistema" element={<ProtectedRoute><SistemaPage /></ProtectedRoute>} />
              <Route path="/apresentacao" element={<ProtectedRoute><ApresentacaoPage /></ProtectedRoute>} />
              <Route path="/noticias" element={<ProtectedRoute><NoticiasPage /></ProtectedRoute>} />
              <Route path="/meu-perfil" element={<ProtectedRoute><MeuPerfilPage /></ProtectedRoute>} />
              <Route path="/trocar-senha-obrigatoria" element={<ProtectedRoute><TrocaSenhaObrigatoriaPage /></ProtectedRoute>} />
              
              {/* ============================================ */}
              {/* ADMIN - Com permissões mapeadas */}
              {/* ============================================ */}
              
              {/* Apenas autenticação (sem mapeamento específico) */}
              <Route path="/admin" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
              <Route path="/admin/ajuda" element={<ProtectedRoute><AdminHelpPage /></ProtectedRoute>} />
              <Route path="/admin/documentos" element={<ProtectedRoute><GestaoDocumentosPage /></ProtectedRoute>} />
              <Route path="/admin/acesso" element={<ProtectedRoute><ControleAcessoAdminPage /></ProtectedRoute>} />
              <Route path="/admin/relatorio" element={<ProtectedRoute><RelatorioAdminPage /></ProtectedRoute>} />
              <Route path="/admin/central-relatorios" element={<ProtectedRoute><CentralRelatoriosPage /></ProtectedRoute>} />
              <Route path="/admin/sobre" element={<ProtectedRoute><SobreSistemaPage /></ProtectedRoute>} />
              <Route path="/acesso" element={<ProtectedRoute><ControleAcessoAdminPage /></ProtectedRoute>} />
              
              {/* Com permissões mapeadas em ROUTE_PERMISSIONS */}
<Route path="/admin/usuarios" element={
                <ProtectedRoute requiredPermissions="admin.usuarios">
                  <UsuariosAdminPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/usuarios/:id" element={
                <ProtectedRoute requiredPermissions="admin.usuarios">
                  <UsuarioDetalhePage />
                </ProtectedRoute>
              } />
              <Route path="/admin/usuarios-tecnicos" element={
                <ProtectedRoute requiredPermissions="admin.usuarios">
                  <UsuariosTecnicosPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/aprovacoes" element={
                <ProtectedRoute requiredPermissions="aprovacoes.visualizar">
                  <CentralAprovacoesPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/auditoria" element={
                <ProtectedRoute requiredPermissions="admin.auditoria">
                  <AuditoriaPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/perfis" element={
                <ProtectedRoute requiredPermissions="admin.perfis">
                  <GestaoPerfilPage />
                </ProtectedRoute>
              } />
              {/* Rota removida - sistema simplificado */}
              <Route path="/admin/backup" element={
                <ProtectedRoute requiredPermissions="admin.backup">
                  <BackupOffsitePage />
                </ProtectedRoute>
              } />
              <Route path="/admin/disaster-recovery" element={
                <ProtectedRoute requiredPermissions="admin.disaster_recovery">
                  <DisasterRecoveryPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/reunioes" element={
                <ProtectedRoute requiredPermissions="admin.reunioes">
                  <ReunioesPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/reunioes/configuracao" element={
                <ProtectedRoute requiredPermissions="admin.reunioes">
                  <ConfiguracaoReunioesPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/reunioes/:reuniaoId/checkin" element={
                <ProtectedRoute requiredPermissions="admin.reunioes">
                  <CheckinReuniaoPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/database" element={
                <ProtectedRoute requiredPermissions="admin.database">
                  <DatabaseSchemaPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/calibrador-segad" element={
                <ProtectedRoute requiredPermissions="admin.segad">
                  <CalibradorSegadPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/pre-cadastros" element={
                <ProtectedRoute requiredPermissions="rh.precadastros.visualizar">
                  <GestaoPreCadastrosPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/pre-cadastros/pendencias" element={
                <ProtectedRoute requiredPermissions="rh.precadastros.visualizar">
                  <DiagnosticoPendenciasPage />
                </ProtectedRoute>
              } />
              
              {/* ============================================ */}
              {/* ASCOM - Com permissões mapeadas */}
              {/* ============================================ */}
              <Route path="/admin/ascom/demandas" element={
                <ProtectedRoute requiredPermissions="ascom.demandas.visualizar">
                  <GestaoDemandasAscomPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/ascom/demandas/nova" element={
                <ProtectedRoute requiredPermissions="ascom.demandas.criar">
                  <NovaDemandaAscomPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/ascom/demandas/:id" element={
                <ProtectedRoute requiredPermissions="ascom.demandas.visualizar">
                  <DetalheDemandaAscomPage />
                </ProtectedRoute>
              } />
              
              {/* ============================================ */}
              {/* FEDERAÇÕES - Apenas autenticação */}
              {/* (rota real é /admin/federacoes, não /federacoes) */}
              {/* ============================================ */}
              <Route path="/admin/federacoes" element={<ProtectedRoute><GestaoFederacoesPage /></ProtectedRoute>} />
              <Route path="/admin/federacoes/:id" element={<ProtectedRoute><FederacaoDetalhePage /></ProtectedRoute>} />
              
               {/* INSTITUIÇÕES */}
               <Route path="/admin/instituicoes" element={<ProtectedRoute><GestaoInstituicoesPage /></ProtectedRoute>} />
 
              {/* ============================================ */}
              {/* GOVERNANÇA - Com permissões mapeadas */}
              {/* ============================================ */}
              <Route path="/governanca" element={
                <ProtectedRoute requiredPermissions="governanca.visualizar">
                  <GovernancaPage />
                </ProtectedRoute>
              } />
              <Route path="/governanca/lei-criacao" element={
                <ProtectedRoute requiredPermissions="governanca.documentos.visualizar">
                  <LeiCriacaoPage />
                </ProtectedRoute>
              } />
              <Route path="/governanca/matriz-raci" element={
                <ProtectedRoute requiredPermissions="governanca.matriz.visualizar">
                  <MatrizRaciPage />
                </ProtectedRoute>
              } />
              <Route path="/governanca/decreto" element={
                <ProtectedRoute requiredPermissions="governanca.documentos.visualizar">
                  <DecretoPage />
                </ProtectedRoute>
              } />
              <Route path="/governanca/regimento" element={
                <ProtectedRoute requiredPermissions="governanca.documentos.visualizar">
                  <RegimentoInternoPage />
                </ProtectedRoute>
              } />
              <Route path="/governanca/organograma" element={<Navigate to="/organograma" replace />} />
              <Route path="/governanca/estrutura" element={
                <ProtectedRoute requiredPermissions="governanca.estrutura.visualizar">
                  <EstruturaOrganizacionalPage />
                </ProtectedRoute>
              } />
              <Route path="/governanca/portarias" element={
                <ProtectedRoute requiredPermissions="governanca.portarias.visualizar">
                  <PortariasPage />
                </ProtectedRoute>
              } />
              <Route path="/governanca/relatorio" element={<ProtectedRoute><RelatorioGovernancaPage /></ProtectedRoute>} />
              
              {/* ============================================ */}
              {/* ORGANOGRAMA - Apenas autenticação */}
              {/* (rotas reais não batem com ROUTE_PERMISSIONS) */}
              {/* ============================================ */}
              <Route path="/organograma" element={<ProtectedRoute><OrganogramaPage /></ProtectedRoute>} />
              <Route path="/organograma/gestao" element={<ProtectedRoute><GestaoOrganogramaPage /></ProtectedRoute>} />
              
              {/* ============================================ */}
              {/* CARGOS / LOTAÇÕES - Com permissões mapeadas */}
              {/* ============================================ */}
              <Route path="/cargos" element={
                <ProtectedRoute requiredPermissions="governanca.cargos.visualizar">
                  <GestaoCargosPage />
                </ProtectedRoute>
              } />
              <Route path="/lotacoes" element={
                <ProtectedRoute requiredPermissions="rh.lotacoes.visualizar">
                  <GestaoLotacoesPage />
                </ProtectedRoute>
              } />
              
              {/* ============================================ */}
              {/* UNIDADES LOCAIS - Apenas autenticação */}
              {/* (rotas reais não batem com ROUTE_PERMISSIONS) */}
              {/* ============================================ */}
              <Route path="/unidades" element={<ProtectedRoute><GestaoUnidadesLocaisPage /></ProtectedRoute>} />
              <Route path="/unidades/gestao" element={<ProtectedRoute><GestaoUnidadesLocaisPage /></ProtectedRoute>} />
              <Route path="/unidades/relatorios" element={<ProtectedRoute><RelatoriosUnidadesLocaisPage /></ProtectedRoute>} />
               <Route path="/unidades/central-relatorios" element={<ProtectedRoute><RelatoriosCentralPage /></ProtectedRoute>} />
              <Route path="/unidades/cedencia" element={<ProtectedRoute><RelatoriosCedenciaPage /></ProtectedRoute>} />
              <Route path="/unidades/:id" element={<ProtectedRoute><UnidadeDetalhePage /></ProtectedRoute>} />
              
              {/* ============================================ */}
              {/* RH - Com permissões mapeadas */}
              {/* ============================================ */}
              <Route path="/rh/servidores" element={
                <ProtectedRoute requiredPermissions="rh.servidores.visualizar">
                  <GestaoServidoresPage />
                </ProtectedRoute>
              } />
              <Route path="/rh/servidores/novo" element={
                <ProtectedRoute requiredPermissions="rh.servidores.criar">
                  <ServidorFormPage />
                </ProtectedRoute>
              } />
              <Route path="/rh/servidores/:id" element={
                <ProtectedRoute requiredPermissions="rh.servidores.visualizar">
                  <ServidorDetalhePage />
                </ProtectedRoute>
              } />
              <Route path="/rh/servidores/:id/editar" element={<ProtectedRoute><ServidorFormPage /></ProtectedRoute>} />
              <Route path="/rh/viagens" element={
                <ProtectedRoute requiredPermissions="rh.viagens.visualizar">
                  <GestaoViagensPage />
                </ProtectedRoute>
              } />
              <Route path="/rh/ferias" element={
                <ProtectedRoute requiredPermissions="rh.ferias.visualizar">
                  <GestaoFeriasPage />
                </ProtectedRoute>
              } />
              <Route path="/rh/licencas" element={
                <ProtectedRoute requiredPermissions="rh.licencas.visualizar">
                  <GestaoLicencasPage />
                </ProtectedRoute>
              } />
              <Route path="/rh/frequencia" element={
                <ProtectedRoute requiredPermissions="rh.frequencia.visualizar">
                  <GestaoFrequenciaPage />
                </ProtectedRoute>
              } />
              <Route path="/rh/designacoes" element={
                <ProtectedRoute requiredPermissions="rh.designacoes.visualizar">
                  <GestaoDesignacoesPage />
                </ProtectedRoute>
              } />
              <Route path="/rh/portarias" element={
                <ProtectedRoute requiredPermissions="rh.portarias.visualizar">
                  <CentralPortariasPage />
                </ProtectedRoute>
              } />
              <Route path="/rh/relatorios" element={
                <ProtectedRoute requiredPermissions="rh.relatorios.visualizar">
                  <RelatoriosRHPage />
                </ProtectedRoute>
              } />
              <Route path="/rh/pendencias" element={
                <ProtectedRoute requiredPermissions="rh.servidores.visualizar">
                  <DiagnosticoPendenciasServidoresPage />
                </ProtectedRoute>
              } />
              <Route path="/rh/modelos" element={
                <ProtectedRoute requiredPermissions="rh.modelos.visualizar">
                  <ModelosDocumentosPage />
                </ProtectedRoute>
              } />
              <Route path="/rh/exportar" element={<ProtectedRoute><ExportacaoPlanilhaPage /></ProtectedRoute>} />
              <Route path="/rh/frequencia/configuracao" element={
                <ProtectedRoute requiredPermissions="rh.frequencia.configurar">
                  <ConfiguracaoFrequenciaPage />
                </ProtectedRoute>
              } />
              <Route path="/rh/aniversariantes" element={
                <ProtectedRoute requiredPermissions="rh.servidores.visualizar">
                  <AniversariantesPage />
                </ProtectedRoute>
              } />
              <Route path="/rh/frequencia/pacotes" element={
                <ProtectedRoute requiredPermissions="rh.frequencia.visualizar">
                  <ControlePacotesFrequenciaPage />
                </ProtectedRoute>
              } />
              
              {/* ============================================ */}
              {/* CONTRACHEQUES */}
              {/* ============================================ */}
              <Route path="/rh/meu-contracheque" element={
                <ProtectedRoute>
                  <MeuContrachequePage />
                </ProtectedRoute>
              } />
              <Route path="/rh/contracheques" element={
                <ProtectedRoute requiredPermissions="rh.servidores.visualizar">
                  <ConsultaContrachequesPage />
                </ProtectedRoute>
              } />
              
              {/* ============================================ */}
              {/* FOLHA DE PAGAMENTO - FASE FUTURA (Bloqueado) */}
              {/* ============================================ */}
              <Route path="/folha/configuracao" element={<ProtectedRoute><FolhaBloqueadaPage /></ProtectedRoute>} />
              <Route path="/folha/gestao" element={<ProtectedRoute><FolhaBloqueadaPage /></ProtectedRoute>} />
              <Route path="/folha/:id" element={<ProtectedRoute><FolhaBloqueadaPage /></ProtectedRoute>} />
              
              {/* ============================================ */}
              {/* PROCESSOS - Com permissões mapeadas */}
              {/* ============================================ */}
              <Route path="/processos" element={<ProtectedRoute><ProcessosPage /></ProtectedRoute>} />
              <Route path="/processos/compras" element={
                <ProtectedRoute requiredPermissions="processos.compras.visualizar">
                  <ComprasProcessoPage />
                </ProtectedRoute>
              } />
              <Route path="/processos/diarias" element={
                <ProtectedRoute requiredPermissions="processos.diarias.visualizar">
                  <DiariasProcessoPage />
                </ProtectedRoute>
              } />
              <Route path="/processos/patrimonio" element={
                <ProtectedRoute requiredPermissions="processos.patrimonio.visualizar">
                  <PatrimonioProcessoPage />
                </ProtectedRoute>
              } />
              <Route path="/processos/convenios" element={
                <ProtectedRoute requiredPermissions="processos.convenios.visualizar">
                  <ConveniosProcessoPage />
                </ProtectedRoute>
              } />
              <Route path="/processos/almoxarifado" element={
                <ProtectedRoute requiredPermissions="processos.almoxarifado.visualizar">
                  <AlmoxarifadoProcessoPage />
                </ProtectedRoute>
              } />
              <Route path="/processos/veiculos" element={
                <ProtectedRoute requiredPermissions="processos.veiculos.visualizar">
                  <VeiculosProcessoPage />
                </ProtectedRoute>
              } />
              <Route path="/processos/pagamentos" element={
                <ProtectedRoute requiredPermissions="processos.pagamentos.visualizar">
                  <PagamentosProcessoPage />
                </ProtectedRoute>
              } />
              
              {/* ============================================ */}
              {/* WORKFLOW (SEI-LIKE) - Com permissões */}
              {/* ============================================ */}
              <Route path="/workflow/processos" element={
                <ProtectedRoute requiredPermissions="workflow.visualizar">
                  <GestaoProcessosPage />
                </ProtectedRoute>
              } />
              <Route path="/workflow/processos/:id" element={
                <ProtectedRoute requiredPermissions="workflow.visualizar">
                  <ProcessoDetalhePage />
                </ProtectedRoute>
              } />
              
              {/* ============================================ */}
              {/* INVENTÁRIO E PATRIMÔNIO */}
              {/* ============================================ */}
              <Route path="/inventario" element={
                <ProtectedRoute requiredPermissions="patrimonio.visualizar">
                  <DashboardInventarioPage />
                </ProtectedRoute>
              } />
              <Route path="/inventario/bens" element={
                <ProtectedRoute requiredPermissions="patrimonio.visualizar">
                  <BensPatrimoniaisPage />
                </ProtectedRoute>
              } />
              <Route path="/inventario/movimentacoes" element={
                <ProtectedRoute requiredPermissions="patrimonio.tramitar">
                  <MovimentacoesPatrimonioPage />
                </ProtectedRoute>
              } />
              <Route path="/inventario/campanhas" element={
                <ProtectedRoute requiredPermissions="patrimonio.visualizar">
                  <CampanhasInventarioPage />
                </ProtectedRoute>
              } />
              <Route path="/inventario/almoxarifado" element={
                <ProtectedRoute requiredPermissions="patrimonio.visualizar">
                  <AlmoxarifadoEstoquePage />
                </ProtectedRoute>
              } />
              <Route path="/inventario/requisicoes" element={
                <ProtectedRoute requiredPermissions="patrimonio.visualizar">
                  <RequisicoesMaterialPage />
                </ProtectedRoute>
              } />
              <Route path="/inventario/manutencoes" element={
                <ProtectedRoute requiredPermissions="patrimonio.visualizar">
                  <ManutencoesBensPage />
                </ProtectedRoute>
              } />
              <Route path="/inventario/baixas" element={
                <ProtectedRoute requiredPermissions="patrimonio.criar">
                  <BaixasPatrimonioPage />
                </ProtectedRoute>
              } />
              
              {/* Rotas de detalhe do inventário */}
              <Route path="/inventario/bens/:id" element={
                <ProtectedRoute requiredPermissions="patrimonio.visualizar">
                  <BemDetalhePage />
                </ProtectedRoute>
              } />
              <Route path="/inventario/bens/:id/editar" element={
                <ProtectedRoute requiredPermissions="patrimonio.criar">
                  <PlaceholderDetalhePage />
                </ProtectedRoute>
              } />
              <Route path="/inventario/campanhas/:id" element={
                <ProtectedRoute requiredPermissions="patrimonio.visualizar">
                  <PlaceholderDetalhePage />
                </ProtectedRoute>
              } />
              <Route path="/inventario/campanhas/:id/coleta" element={
                <ProtectedRoute requiredPermissions="patrimonio.tramitar">
                  <PlaceholderDetalhePage />
                </ProtectedRoute>
              } />
              <Route path="/inventario/movimentacoes/:id" element={
                <ProtectedRoute requiredPermissions="patrimonio.tramitar">
                  <PlaceholderDetalhePage />
                </ProtectedRoute>
              } />
              <Route path="/inventario/manutencoes/:id" element={
                <ProtectedRoute requiredPermissions="patrimonio.visualizar">
                  <PlaceholderDetalhePage />
                </ProtectedRoute>
              } />
              <Route path="/inventario/requisicoes/:id" element={
                <ProtectedRoute requiredPermissions="patrimonio.visualizar">
                  <PlaceholderDetalhePage />
                </ProtectedRoute>
              } />
              <Route path="/inventario/almoxarifado/:id" element={
                <ProtectedRoute requiredPermissions="patrimonio.visualizar">
                  <PlaceholderDetalhePage />
                </ProtectedRoute>
              } />
              <Route path="/inventario/almoxarifado/:id/editar" element={
                <ProtectedRoute requiredPermissions="patrimonio.criar">
                  <PlaceholderDetalhePage />
                </ProtectedRoute>
              } />
              <Route path="/inventario/baixas/:id" element={
                <ProtectedRoute requiredPermissions="patrimonio.criar">
                  <PlaceholderDetalhePage />
                </ProtectedRoute>
              } />
              
              {/* ============================================ */}
              {/* FORMULÁRIOS - Apenas autenticação */}
              {/* (permissão genérica removida) */}
              {/* ============================================ */}
              <Route path="/formularios/termo-demanda" element={<ProtectedRoute><TermoDemandaPage /></ProtectedRoute>} />
              <Route path="/formularios/ordem-missao" element={<ProtectedRoute><OrdemMissaoPage /></ProtectedRoute>} />
              <Route path="/formularios/relatorio-viagem" element={<ProtectedRoute><RelatorioViagemPage /></ProtectedRoute>} />
              <Route path="/formularios/requisicao-material" element={<ProtectedRoute><RequisicaoMaterialPage /></ProtectedRoute>} />
              <Route path="/formularios/termo-responsabilidade" element={<ProtectedRoute><TermoResponsabilidadePage /></ProtectedRoute>} />
              
              {/* ============================================ */}
              {/* MANUAIS - Apenas autenticação */}
              {/* ============================================ */}
              <Route path="/manuais" element={<ProtectedRoute><ManuaisPage /></ProtectedRoute>} />
              <Route path="/manuais/compras" element={<ProtectedRoute><ManuaisPage /></ProtectedRoute>} />
              <Route path="/manuais/diarias" element={<ProtectedRoute><ManuaisPage /></ProtectedRoute>} />
              <Route path="/manuais/patrimonio" element={<ProtectedRoute><ManuaisPage /></ProtectedRoute>} />
              <Route path="/manuais/convenios" element={<ProtectedRoute><ManuaisPage /></ProtectedRoute>} />
              
              {/* ============================================ */}
              {/* INTEGRIDADE - Apenas autenticação */}
              {/* ============================================ */}
              <Route path="/integridade" element={<ProtectedRoute><IntegridadePage /></ProtectedRoute>} />
              <Route path="/integridade/denuncias" element={<ProtectedRoute><DenunciasPage /></ProtectedRoute>} />
              <Route path="/integridade/gestao-denuncias" element={<ProtectedRoute><GestaoDenunciasPage /></ProtectedRoute>} />
              <Route path="/integridade/codigo-etica" element={<ProtectedRoute><IntegridadePage /></ProtectedRoute>} />
              <Route path="/integridade/conflito" element={<ProtectedRoute><IntegridadePage /></ProtectedRoute>} />
              <Route path="/integridade/politica" element={<ProtectedRoute><IntegridadePage /></ProtectedRoute>} />
              
              {/* ============================================ */}
              {/* TRANSPARÊNCIA - Rotas PÚBLICAS (LGPD-Safe) */}
              {/* Portal de Transparência: acesso público, sem login */}
              {/* ============================================ */}
              <Route path="/transparencia" element={<TransparenciaPage />} />
              <Route path="/transparencia/cargos" element={<CargosRemuneracaoPage />} />
              <Route path="/transparencia/licitacoes" element={<LicitacoesPublicasPage />} />
              <Route path="/transparencia/contratos" element={<LicitacoesPublicasPage />} />
              <Route path="/transparencia/orcamento" element={<ExecucaoOrcamentariaPage />} />
              <Route path="/transparencia/patrimonio" element={<PatrimonioPublicoPage />} />
              <Route path="/transparencia/lai" element={<PortalLAIPage />} />
              <Route path="/transparencia/relatorios" element={<ProtectedRoute><TransparenciaPage /></ProtectedRoute>} />
              
              {/* ============================================ */}
              {/* FINANCEIRO (ERP) - Com permissões mapeadas */}
              {/* ============================================ */}
              <Route path="/financeiro" element={
                <ProtectedRoute requiredPermissions="orcamento.visualizar">
                  <DashboardFinanceiroPage />
                </ProtectedRoute>
              } />
              <Route path="/financeiro/orcamento" element={
                <ProtectedRoute requiredPermissions="orcamento.visualizar">
                  <OrcamentoPage />
                </ProtectedRoute>
              } />
              <Route path="/financeiro/solicitacoes" element={
                <ProtectedRoute requiredPermissions="orcamento.visualizar">
                  <SolicitacoesPage />
                </ProtectedRoute>
              } />
              <Route path="/financeiro/empenhos" element={
                <ProtectedRoute requiredPermissions="orcamento.criar">
                  <EmpenhosPage />
                </ProtectedRoute>
              } />
              <Route path="/financeiro/liquidacoes" element={
                <ProtectedRoute requiredPermissions="orcamento.criar">
                  <LiquidacoesPage />
                </ProtectedRoute>
              } />
              <Route path="/financeiro/pagamentos" element={
                <ProtectedRoute requiredPermissions="orcamento.aprovar">
                  <PagamentosPage />
                </ProtectedRoute>
              } />
              <Route path="/financeiro/adiantamentos" element={
                <ProtectedRoute requiredPermissions="orcamento.visualizar">
                  <AdiantamentosPage />
                </ProtectedRoute>
              } />
              <Route path="/financeiro/contas-bancarias" element={
                <ProtectedRoute requiredPermissions="orcamento.aprovar">
                  <ContasBancariasPage />
                </ProtectedRoute>
              } />
              <Route path="/financeiro/relatorios" element={
                <ProtectedRoute requiredPermissions="orcamento.visualizar">
                  <RelatoriosFinanceiroPage />
                </ProtectedRoute>
              } />
              
              {/* Rotas de detalhe do financeiro */}
              <Route path="/financeiro/solicitacoes/:id" element={
                <ProtectedRoute requiredPermissions="orcamento.visualizar">
                  <PlaceholderDetalheFinanceiroPage />
                </ProtectedRoute>
              } />
              <Route path="/financeiro/empenhos/:id" element={
                <ProtectedRoute requiredPermissions="orcamento.criar">
                  <PlaceholderDetalheFinanceiroPage />
                </ProtectedRoute>
              } />
              <Route path="/financeiro/pagamentos/:id" element={
                <ProtectedRoute requiredPermissions="orcamento.aprovar">
                  <PlaceholderDetalheFinanceiroPage />
                </ProtectedRoute>
              } />

              {/* ============================================ */}
              {/* PROGRAMAS - Apenas autenticação */}
              {/* (permissão genérica removida) */}
              {/* ============================================ */}
              <Route path="/programas/bolsa-atleta" element={<ProtectedRoute><BolsaAtletaPage /></ProtectedRoute>} />
              <Route path="/programas/juventude-cidada" element={<ProtectedRoute><JuventudeCidadaPage /></ProtectedRoute>} />
              <Route path="/programas/esporte-comunidade" element={<ProtectedRoute><EsporteComunidadePage /></ProtectedRoute>} />
              <Route path="/programas/jovem-empreendedor" element={<ProtectedRoute><JovemEmpreendedorPage /></ProtectedRoute>} />
              <Route path="/programas/jogos-escolares" element={<ProtectedRoute><JogosEscolaresPage /></ProtectedRoute>} />
              
              {/* ============================================ */}
              {/* 404 */}
              {/* ============================================ */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
