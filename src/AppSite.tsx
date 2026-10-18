/**
 * Raiz do build `site` (VITE_APP_MODE=site): só o que o site institucional serve.
 * As rotas espelham `ROTAS_DO_SITE` (src/core/modo-app.ts) e os mesmos PublicPageGuard do App.tsx.
 * Nada do sistema interno é importado aqui — o guard `check:bundle-site` falha o gate se vazar.
 * Páginas de notícias e galerias vêm direto dos arquivos (não do barrel `pages/public`).
 */
import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { TenantProvider } from "@/core/tenant";
import { PublicPageGuard } from "@/components/public/PublicPageGuard";
import { destinoForaDoSite } from "@/core/modo-app";
import { ModuloHabilitado } from "@/components/auth/ModuloHabilitado";

import HomeSimplesPage from "./pages/HomeSimplesPage";
import EditaisPublicoPage from "./pages/EditaisPublicoPage";
import BaseLegalPage from "./pages/BaseLegalPage";
import TransparenciaPage from "./pages/TransparenciaPage";
import DenunciasPage from "./pages/integridade/DenunciasPage";
import LeiCriacaoPage from "./pages/governanca/LeiCriacaoPage";
import DecretoPage from "./pages/governanca/DecretoPage";
import NotFound from "./pages/NotFound";
import NoticiasPublicasPage from "./pages/public/NoticiasPublicasPage";
import NoticiaPage from "./pages/public/NoticiaPage";
import CargosRemuneracaoPage from "./pages/transparencia/CargosRemuneracaoPage";
import LicitacoesPublicasPage from "./pages/transparencia/LicitacoesPublicasPage";
import ExecucaoOrcamentariaPage from "./pages/transparencia/ExecucaoOrcamentariaPage";
import PatrimonioPublicoPage from "./pages/transparencia/PatrimonioPublicoPage";
import PortalLAIPage from "./pages/transparencia/PortalLAIPage";
import LinksUteisPage from "./pages/LinksUteisPage";
import GaleriasPublicasPage from "./pages/public/GaleriasPublicasPage";
import GaleriaPage from "./pages/public/GaleriaPage";
import MiniCurriculoSucessoPage from "./pages/curriculo/MiniCurriculoSucessoPage";
import FormularioGestorPage from "./pages/cadastrogestores/FormularioGestorPage";
import ConsultaGestorPage from "./pages/cadastrogestores/ConsultaGestorPage";
import CadastroArbitroPage from "./pages/cadastro-arbitros/CadastroArbitroPage";
import CadastroFederacaoPage from "./pages/federacoes/CadastroFederacaoPage";
import SolicitacaoPublicaAscomPage from "./pages/ascom/SolicitacaoPublicaAscomPage";
import ConsultaProtocoloAscomPage from "./pages/ascom/ConsultaProtocoloAscomPage";
import SeletivaEstudantilV2Page from "./pages/eventos/SeletivaEstudantilV2Page";
import NoticiaDetalhePage from "./pages/eventos/NoticiaDetalhePage";

// O mini-currículo gera PDFs (jsPDF): em chunk separado, que só baixa quando alguém abre /curriculo.
const MiniCurriculoPage = lazy(() => import("./pages/curriculo/MiniCurriculoPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/** Endereço do sistema aberto pelo site (favorito antigo, link de e-mail do login) vai para o app; o resto é 404. */
function ForaDoSite() {
  const { pathname, search, hash } = useLocation();
  const destino = destinoForaDoSite(`${pathname}${search}${hash}`);
  useEffect(() => {
    if (destino) window.location.replace(destino);
  }, [destino]);
  return destino ? null : <NotFound />;
}

const AppSite = () => (
  <TenantProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<PublicPageGuard rota="/"><HomeSimplesPage /></PublicPageGuard>} />
                <Route path="/editais" element={<PublicPageGuard rota="/editais"><EditaisPublicoPage /></PublicPageGuard>} />
                <Route path="/base-legal" element={<PublicPageGuard rota="/base-legal"><BaseLegalPage /></PublicPageGuard>} />
                <Route path="/governanca/lei-criacao" element={<PublicPageGuard rota="/base-legal"><LeiCriacaoPage /></PublicPageGuard>} />
                <Route path="/governanca/decreto" element={<PublicPageGuard rota="/base-legal"><DecretoPage /></PublicPageGuard>} />
                <Route path="/noticias-portal" element={<PublicPageGuard rota="/noticias-portal"><NoticiasPublicasPage /></PublicPageGuard>} />
                <Route path="/noticias-portal/:slug" element={<PublicPageGuard rota="/noticias-portal" fallbackRota="/noticias-portal"><NoticiaPage /></PublicPageGuard>} />
                <Route path="/transparencia" element={<PublicPageGuard rota="/transparencia"><TransparenciaPage /></PublicPageGuard>} />
                <Route path="/transparencia/cargos" element={<PublicPageGuard rota="/transparencia/cargos" fallbackRota="/transparencia"><CargosRemuneracaoPage /></PublicPageGuard>} />
                <Route path="/transparencia/licitacoes" element={<PublicPageGuard rota="/transparencia/licitacoes" fallbackRota="/transparencia"><LicitacoesPublicasPage /></PublicPageGuard>} />
                <Route path="/transparencia/contratos" element={<PublicPageGuard rota="/transparencia/contratos" fallbackRota="/transparencia"><LicitacoesPublicasPage /></PublicPageGuard>} />
                <Route path="/transparencia/orcamento" element={<PublicPageGuard rota="/transparencia/orcamento" fallbackRota="/transparencia"><ExecucaoOrcamentariaPage /></PublicPageGuard>} />
                <Route path="/transparencia/patrimonio" element={<PublicPageGuard rota="/transparencia/patrimonio" fallbackRota="/transparencia"><PatrimonioPublicoPage /></PublicPageGuard>} />
                <Route path="/transparencia/lai" element={<PublicPageGuard rota="/transparencia/lai" fallbackRota="/transparencia"><PortalLAIPage /></PublicPageGuard>} />
                <Route path="/integridade/denuncias" element={<PublicPageGuard rota="/integridade/denuncias"><DenunciasPage /></PublicPageGuard>} />
                <Route path="/links-uteis" element={<PublicPageGuard rota="/links-uteis"><LinksUteisPage /></PublicPageGuard>} />
                <Route path="/galerias" element={<PublicPageGuard rota="/galerias"><GaleriasPublicasPage /></PublicPageGuard>} />
                <Route path="/galerias/:slug" element={<PublicPageGuard rota="/galerias" fallbackRota="/galerias"><GaleriaPage /></PublicPageGuard>} />
                {/* Formulários públicos: mesmos endereços do sistema, porque já circulam em ofícios e redes sociais */}
                <Route path="/curriculo" element={<PublicPageGuard rota="/curriculo"><Suspense fallback={null}><MiniCurriculoPage /></Suspense></PublicPageGuard>} />
                <Route path="/curriculo/sucesso" element={<PublicPageGuard rota="/curriculo" fallbackRota="/curriculo"><MiniCurriculoSucessoPage /></PublicPageGuard>} />
                <Route path="/curriculo/:codigo" element={<PublicPageGuard rota="/curriculo" fallbackRota="/curriculo"><Suspense fallback={null}><MiniCurriculoPage /></Suspense></PublicPageGuard>} />
                <Route path="/cadastrogestores" element={<ModuloHabilitado codigo="gestores_escolares"><PublicPageGuard rota="/cadastrogestores"><FormularioGestorPage /></PublicPageGuard></ModuloHabilitado>} />
                <Route path="/cadastrogestores/consulta" element={<ModuloHabilitado codigo="gestores_escolares"><PublicPageGuard rota="/cadastrogestores" fallbackRota="/cadastrogestores"><ConsultaGestorPage /></PublicPageGuard></ModuloHabilitado>} />
                <Route path="/cadastro-arbitros" element={<ModuloHabilitado codigo="arbitros"><PublicPageGuard rota="/cadastro-arbitros"><CadastroArbitroPage /></PublicPageGuard></ModuloHabilitado>} />
                <Route path="/federacoes/cadastro" element={<PublicPageGuard rota="/federacoes/cadastro"><CadastroFederacaoPage /></PublicPageGuard>} />
                <Route path="/ascom/solicitar" element={<PublicPageGuard rota="/ascom/solicitar"><SolicitacaoPublicaAscomPage /></PublicPageGuard>} />
                <Route path="/ascom/consultar" element={<PublicPageGuard rota="/ascom/consultar"><ConsultaProtocoloAscomPage /></PublicPageGuard>} />
                <Route path="/programas/selecoes" element={<PublicPageGuard rota="/programas/selecoes"><SeletivaEstudantilV2Page /></PublicPageGuard>} />
                <Route path="/programas/selecoes/noticia/:slug" element={<PublicPageGuard rota="/programas/selecoes" fallbackRota="/programas/selecoes"><NoticiaDetalhePage /></PublicPageGuard>} />
                <Route path="/selecoes" element={<Navigate to="/programas/selecoes" replace />} />
                <Route path="/selecao" element={<Navigate to="/programas/selecoes" replace />} />
                <Route path="*" element={<ForaDoSite />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </TenantProvider>
);

export default AppSite;
