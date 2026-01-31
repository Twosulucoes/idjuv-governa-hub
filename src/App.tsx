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

// Folha de Pagamento
import ConfiguracaoFolhaPage from "./pages/folha/ConfiguracaoFolhaPage";
import GestaoFolhaPagamentoPage from "./pages/folha/GestaoFolhaPagamentoPage";
import FolhaDetalhePage from "./pages/folha/FolhaDetalhePage";

// Unidades Locais
import GestaoUnidadesLocaisPage from "./pages/unidades/GestaoUnidadesLocaisPage";
import UnidadeDetalhePage from "./pages/unidades/UnidadeDetalhePage";
import RelatoriosCedenciaPage from "./pages/unidades/RelatoriosCedenciaPage";
import RelatoriosUnidadesLocaisPage from "./pages/unidades/RelatoriosUnidadesLocaisPage";

import NoticiasPage from "./pages/NoticiasPage";

// Auth Pages
import AuthPage from "./pages/AuthPage";
import AccessDeniedPage from "./pages/AccessDeniedPage";
import GerenciamentoUsuariosPage from "./pages/admin/GerenciamentoUsuariosPage";
import GestaoDocumentosPage from "./pages/admin/GestaoDocumentosPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminHelpPage from "./pages/admin/AdminHelpPage";
import ControleAcessoAdminPage from "./pages/admin/ControleAcessoAdminPage";
import CentralAprovacoesPage from "./pages/admin/CentralAprovacoesPage";
import AuditoriaPage from "./pages/admin/AuditoriaPage";
import GestaoPerfilPage from "./pages/admin/GestaoPerfilPage";
import BackupOffsitePage from "./pages/admin/BackupOffsitePage";
import DisasterRecoveryPage from "./pages/admin/DisasterRecoveryPage";
import UsuariosTecnicosPage from "./pages/admin/UsuariosTecnicosPage";
import ReunioesPage from "./pages/admin/ReunioesPage";
import ConfiguracaoReunioesPage from "./pages/admin/ConfiguracaoReunioesPage";
import CheckinReuniaoPage from "./pages/admin/CheckinReuniaoPage";
import DatabaseSchemaPage from "./pages/admin/DatabaseSchemaPage";
import RelatorioAdminPage from "./pages/admin/RelatorioAdminPage";
import CalibradorSegadPage from "./pages/admin/CalibradorSegadPage";

// ASCOM
import GestaoDemandasAscomPage from "./pages/ascom/GestaoDemandasAscomPage";
import NovaDemandaAscomPage from "./pages/ascom/NovaDemandaAscomPage";
import DetalheDemandaAscomPage from "./pages/ascom/DetalheDemandaAscomPage";
import SolicitacaoPublicaAscomPage from "./pages/ascom/SolicitacaoPublicaAscomPage";
import ConsultaProtocoloAscomPage from "./pages/ascom/ConsultaProtocoloAscomPage";

// Federações
import CadastroFederacaoPage from "./pages/federacoes/CadastroFederacaoPage";
import GestaoFederacoesPage from "./pages/federacoes/GestaoFederacoesPage";

// Mini-Currículo / Pré-Cadastro
import MiniCurriculoPage from "./pages/curriculo/MiniCurriculoPage";
import MiniCurriculoSucessoPage from "./pages/curriculo/MiniCurriculoSucessoPage";
import GestaoPreCadastrosPage from "./pages/curriculo/GestaoPreCadastrosPage";
import DiagnosticoPendenciasPage from "./pages/curriculo/DiagnosticoPendenciasPage";

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
              
              {/* ============================================ */}
              {/* ADMIN - Com permissões mapeadas */}
              {/* ============================================ */}
              
              {/* Apenas autenticação (sem mapeamento específico) */}
              <Route path="/admin" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
              <Route path="/admin/ajuda" element={<ProtectedRoute><AdminHelpPage /></ProtectedRoute>} />
              <Route path="/admin/documentos" element={<ProtectedRoute><GestaoDocumentosPage /></ProtectedRoute>} />
              <Route path="/admin/acesso" element={<ProtectedRoute><ControleAcessoAdminPage /></ProtectedRoute>} />
              <Route path="/admin/relatorio" element={<ProtectedRoute><RelatorioAdminPage /></ProtectedRoute>} />
              <Route path="/acesso" element={<ProtectedRoute><ControleAcessoAdminPage /></ProtectedRoute>} />
              
              {/* Com permissões mapeadas em ROUTE_PERMISSIONS */}
              <Route path="/admin/usuarios" element={
                <ProtectedRoute requiredPermissions="admin.usuarios">
                  <GerenciamentoUsuariosPage />
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
              {/* FOLHA DE PAGAMENTO - Com permissões mapeadas */}
              {/* ============================================ */}
              <Route path="/folha/configuracao" element={
                <ProtectedRoute requiredPermissions="financeiro.folha.configurar">
                  <ConfiguracaoFolhaPage />
                </ProtectedRoute>
              } />
              <Route path="/folha/gestao" element={<ProtectedRoute><GestaoFolhaPagamentoPage /></ProtectedRoute>} />
              <Route path="/folha/:id" element={
                <ProtectedRoute requiredPermissions="financeiro.folha.visualizar">
                  <FolhaDetalhePage />
                </ProtectedRoute>
              } />
              
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
              {/* TRANSPARÊNCIA - Apenas autenticação */}
              {/* ============================================ */}
              <Route path="/transparencia" element={<ProtectedRoute><TransparenciaPage /></ProtectedRoute>} />
              <Route path="/transparencia/cargos" element={<ProtectedRoute><CargosRemuneracaoPage /></ProtectedRoute>} />
              <Route path="/transparencia/relatorios" element={<ProtectedRoute><TransparenciaPage /></ProtectedRoute>} />
              <Route path="/transparencia/pessoal" element={<ProtectedRoute><TransparenciaPage /></ProtectedRoute>} />
              <Route path="/transparencia/licitacoes" element={<ProtectedRoute><TransparenciaPage /></ProtectedRoute>} />
              <Route path="/transparencia/orcamento" element={<ProtectedRoute><TransparenciaPage /></ProtectedRoute>} />
              
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
