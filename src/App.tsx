import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";

// Pages
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
import OrganogramaPageOld from "./pages/governanca/OrganogramaPage";
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
import RelatoriosRHPage from "./pages/rh/RelatoriosRHPage";
import ModelosDocumentosPage from "./pages/rh/ModelosDocumentosPage";

// Unidades Locais
import GestaoUnidadesLocaisPage from "./pages/unidades/GestaoUnidadesLocaisPage";
import UnidadeDetalhePage from "./pages/unidades/UnidadeDetalhePage";
import RelatoriosCedenciaPage from "./pages/unidades/RelatoriosCedenciaPage";

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
              <Route path="/" element={<ApresentacaoPage />} />
              <Route path="/sistema" element={<SistemaPage />} />
              
              {/* Autenticação */}
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/acesso-negado" element={<AccessDeniedPage />} />
              
              {/* Admin */}
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/ajuda" element={<AdminHelpPage />} />
              <Route path="/admin/usuarios" element={<GerenciamentoUsuariosPage />} />
              <Route path="/admin/documentos" element={<GestaoDocumentosPage />} />
              <Route path="/admin/acesso" element={<ControleAcessoAdminPage />} />
              <Route path="/admin/aprovacoes" element={<CentralAprovacoesPage />} />
              <Route path="/admin/auditoria" element={<AuditoriaPage />} />
              <Route path="/admin/perfis" element={<GestaoPerfilPage />} />
              <Route path="/admin/backup" element={<BackupOffsitePage />} />
              <Route path="/admin/disaster-recovery" element={<DisasterRecoveryPage />} />
              <Route path="/admin/usuarios-tecnicos" element={<UsuariosTecnicosPage />} />
              {/* Redirect old /acesso to new admin route */}
              <Route path="/acesso" element={<ControleAcessoAdminPage />} />
              
              {/* Governança */}
              <Route path="/governanca" element={<GovernancaPage />} />
              <Route path="/governanca/lei-criacao" element={<LeiCriacaoPage />} />
              <Route path="/governanca/matriz-raci" element={<MatrizRaciPage />} />
              <Route path="/governanca/decreto" element={<DecretoPage />} />
              <Route path="/governanca/regimento" element={<RegimentoInternoPage />} />
              <Route path="/governanca/organograma" element={<OrganogramaPageOld />} />
              <Route path="/governanca/estrutura" element={<EstruturaOrganizacionalPage />} />
              
              {/* Organograma Interativo */}
              <Route path="/organograma" element={<OrganogramaPage />} />
              <Route path="/organograma/gestao" element={<GestaoOrganogramaPage />} />
              
              {/* Cargos */}
              <Route path="/cargos" element={<GestaoCargosPage />} />
              <Route path="/lotacoes" element={<GestaoLotacoesPage />} />
              
              {/* Unidades Locais */}
              <Route path="/unidades" element={<GestaoUnidadesLocaisPage />} />
              <Route path="/unidades/gestao" element={<GestaoUnidadesLocaisPage />} />
              <Route path="/unidades/relatorios" element={<RelatoriosCedenciaPage />} />
              <Route path="/unidades/:id" element={<UnidadeDetalhePage />} />
              
              {/* RH - Gestão de Servidores */}
              <Route path="/rh/servidores" element={<GestaoServidoresPage />} />
              <Route path="/rh/servidores/novo" element={<ServidorFormPage />} />
              <Route path="/rh/servidores/:id" element={<ServidorDetalhePage />} />
              <Route path="/rh/servidores/:id/editar" element={<ServidorFormPage />} />
              <Route path="/rh/viagens" element={<GestaoViagensPage />} />
              <Route path="/rh/ferias" element={<GestaoFeriasPage />} />
              <Route path="/rh/licencas" element={<GestaoLicencasPage />} />
              <Route path="/rh/relatorios" element={<RelatoriosRHPage />} />
              <Route path="/rh/modelos" element={<ModelosDocumentosPage />} />
              
              <Route path="/governanca/portarias" element={<PortariasPage />} />
              <Route path="/governanca/relatorio" element={<RelatorioGovernancaPage />} />
              
              {/* Processos */}
              <Route path="/processos" element={<ProcessosPage />} />
              <Route path="/processos/compras" element={<ComprasProcessoPage />} />
              <Route path="/processos/diarias" element={<DiariasProcessoPage />} />
              <Route path="/processos/patrimonio" element={<PatrimonioProcessoPage />} />
              <Route path="/processos/convenios" element={<ConveniosProcessoPage />} />
              <Route path="/processos/almoxarifado" element={<AlmoxarifadoProcessoPage />} />
              <Route path="/processos/veiculos" element={<VeiculosProcessoPage />} />
              <Route path="/processos/pagamentos" element={<PagamentosProcessoPage />} />
              
              {/* Formulários */}
              <Route path="/formularios/termo-demanda" element={<TermoDemandaPage />} />
              <Route path="/formularios/ordem-missao" element={<OrdemMissaoPage />} />
              <Route path="/formularios/relatorio-viagem" element={<RelatorioViagemPage />} />
              <Route path="/formularios/requisicao-material" element={<RequisicaoMaterialPage />} />
              <Route path="/formularios/termo-responsabilidade" element={<TermoResponsabilidadePage />} />
              
              {/* Manuais */}
              <Route path="/manuais" element={<ManuaisPage />} />
              <Route path="/manuais/compras" element={<ManuaisPage />} />
              <Route path="/manuais/diarias" element={<ManuaisPage />} />
              <Route path="/manuais/patrimonio" element={<ManuaisPage />} />
              <Route path="/manuais/convenios" element={<ManuaisPage />} />
              
              {/* Integridade */}
              <Route path="/integridade" element={<IntegridadePage />} />
              <Route path="/integridade/denuncias" element={<DenunciasPage />} />
              <Route path="/integridade/gestao-denuncias" element={<GestaoDenunciasPage />} />
              <Route path="/integridade/codigo-etica" element={<IntegridadePage />} />
              <Route path="/integridade/conflito" element={<IntegridadePage />} />
              <Route path="/integridade/politica" element={<IntegridadePage />} />
              
              {/* Transparência */}
              <Route path="/transparencia" element={<TransparenciaPage />} />
              <Route path="/transparencia/cargos" element={<CargosRemuneracaoPage />} />
              <Route path="/transparencia/relatorios" element={<TransparenciaPage />} />
              <Route path="/transparencia/pessoal" element={<TransparenciaPage />} />
              <Route path="/transparencia/licitacoes" element={<TransparenciaPage />} />
              <Route path="/transparencia/orcamento" element={<TransparenciaPage />} />
              
              {/* Programas */}
              <Route path="/programas/bolsa-atleta" element={<BolsaAtletaPage />} />
              <Route path="/programas/juventude-cidada" element={<JuventudeCidadaPage />} />
              <Route path="/programas/esporte-comunidade" element={<EsporteComunidadePage />} />
              <Route path="/programas/jovem-empreendedor" element={<JovemEmpreendedorPage />} />
              <Route path="/programas/jogos-escolares" element={<JogosEscolaresPage />} />
              
              
              {/* Notícias */}
              <Route path="/noticias" element={<NoticiasPage />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
