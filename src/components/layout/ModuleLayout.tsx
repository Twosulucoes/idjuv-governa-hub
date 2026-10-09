/**
 * MODULE LAYOUT
 * 
 * Layout modular para cada área do sistema
 * Responsivo: sidebar em drawer no mobile, fixa no desktop
 * Acessível: link "pular para o conteúdo", marcos (header/nav/main) e
 * drawer móvel como diálogo (foco preso, Esc fecha, foco volta ao botão).
 *
 * @version 4.0.0
 */

import { ReactNode, useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ModuleSwitcher } from "./ModuleSwitcher";
import { ModuleSidebar } from "./ModuleSidebar";
import { ModuleHeader } from "./ModuleHeader";
import { useSidebarCollapse } from "@/hooks/useSidebarCollapse";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Menu, ArrowUp } from "lucide-react";
import type { Modulo } from "@/shared/config/modules.config";
import { SystemCredits } from "./SystemCredits";
import { AvisosDestaque } from "@/components/avisos";

interface ModuleLayoutProps {
  children: ReactNode;
  module: Modulo;
  title?: string;
  description?: string;
}

export function ModuleLayout({ children, module, title, description }: ModuleLayoutProps) {
  const { isCollapsed, toggle } = useSidebarCollapse(false);
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const { pathname } = useLocation();
  const botaoMenuRef = useRef<HTMLButtonElement>(null);

  // Fecha o menu móvel ao navegar
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Back to top button visibility
  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    const target = e.currentTarget;
    setShowBackToTop(target.scrollTop > 300);
  }, []);

  const scrollToTop = useCallback(() => {
    const mainContent = document.getElementById('module-main-content');
    if (mainContent) {
      const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      mainContent.scrollTo({ top: 0, behavior: reduzir ? 'auto' : 'smooth' });
      mainContent.focus({ preventScroll: true });
    }
  }, []);

  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col bg-background">
        {/* Primeiro item da tabulação: leva direto ao conteúdo (WCAG 2.4.1) */}
        <a
          href="#module-main-content"
          onClick={(e) => {
            // Foca o <main> sem mexer no hash da URL (rotas do react-router)
            e.preventDefault();
            document.getElementById('module-main-content')?.focus();
          }}
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-2 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          Pular para o conteúdo
        </a>

        {/* Header with mobile menu toggle */}
        <ModuleHeader module={module}>
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 mr-2 flex-shrink-0"
              ref={botaoMenuRef}
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="module-mobile-menu"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </Button>
          )}
        </ModuleHeader>

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Module Switcher - Hidden on mobile */}
          {!isMobile && (
            <nav
              aria-label="Módulos do sistema"
              className="w-14 border-r border-border bg-card flex flex-col items-center py-2 flex-shrink-0"
            >
              <ModuleSwitcher />
            </nav>
          )}

          {/* Module Sidebar - Desktop: inline, Mobile: drawer overlay */}
          {!isMobile && (
            <ModuleSidebar 
              module={module} 
              isCollapsed={isCollapsed}
              onToggleCollapse={toggle}
            />
          )}

          {/* Mobile Sidebar Drawer: diálogo modal (foco preso, Esc fecha) */}
          {isMobile && (
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetContent
                id="module-mobile-menu"
                side="left"
                onCloseAutoFocus={(e) => {
                  // Sem SheetTrigger o Radix não sabe para onde devolver o foco
                  e.preventDefault();
                  botaoMenuRef.current?.focus();
                }}
                className="w-72 max-w-[85vw] p-0 flex flex-col gap-0 bg-card safe-area-inset-top safe-area-inset-bottom"
              >
                <SheetHeader className="p-3 pr-12 border-b border-border text-left">
                  <SheetTitle className="text-sm font-semibold">Menu</SheetTitle>
                  <SheetDescription className="sr-only">Navegação entre módulos e telas</SheetDescription>
                </SheetHeader>
                {/* Module switcher icons (horizontal) */}
                <nav aria-label="Módulos do sistema" className="border-b border-border px-3 py-2">
                  <ModuleSwitcher horizontal />
                </nav>
                {/* Sidebar navigation */}
                <div className="flex-1 overflow-auto scroll-container">
                  <ModuleSidebar
                    module={module}
                    isCollapsed={false}
                    onToggleCollapse={() => setMobileMenuOpen(false)}
                    bare
                  />
                </div>
              </SheetContent>
            </Sheet>
          )}

          {/* Page Content */}
          <main
            id="module-main-content"
            tabIndex={-1}
            className="flex-1 overflow-auto p-4 md:p-6 focus:outline-none"
            onScroll={handleScroll}
          >
            {(title || description) && (
              <div className="mb-4 md:mb-6">
                {title && (
                  <h1 className="text-h1 text-foreground">{title}</h1>
                )}
                {description && (
                  <p className="text-sm md:text-base text-muted-foreground">{description}</p>
                )}
              </div>
            )}
            <AvisosDestaque />
            {children}

            {/* Créditos da desenvolvedora */}
            <SystemCredits variant="light" className="mt-8" />
          </main>
        </div>

        {/* Back to top FAB */}
        {showBackToTop && (
          <Button
            variant="secondary"
            size="icon"
            className="fab fab-with-safe-area shadow-lg animate-fade-in"
            onClick={scrollToTop}
            aria-label="Voltar ao topo"
          >
            <ArrowUp className="h-5 w-5" aria-hidden="true" />
          </Button>
        )}
      </div>
    </TooltipProvider>
  );
}
