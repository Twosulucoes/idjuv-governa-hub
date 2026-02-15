/**
 * MODULE LAYOUT
 * 
 * Layout modular para cada área do sistema
 * Responsivo: sidebar em drawer no mobile, fixa no desktop
 * 
 * @version 3.0.0
 */

import { ReactNode, useState, useEffect, useCallback } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ModuleSwitcher } from "./ModuleSwitcher";
import { ModuleSidebar } from "./ModuleSidebar";
import { ModuleHeader } from "./ModuleHeader";
import { useSidebarCollapse } from "@/hooks/useSidebarCollapse";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Menu, ArrowUp, X } from "lucide-react";
import type { Modulo } from "@/shared/config/modules.config";

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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [children]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  // Back to top button visibility
  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    const target = e.currentTarget;
    setShowBackToTop(target.scrollTop > 300);
  }, []);

  const scrollToTop = useCallback(() => {
    const mainContent = document.getElementById('module-main-content');
    if (mainContent) {
      mainContent.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col bg-background">
        {/* Header with mobile menu toggle */}
        <ModuleHeader module={module}>
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 mr-2 flex-shrink-0"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
        </ModuleHeader>

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Module Switcher - Hidden on mobile */}
          {!isMobile && (
            <aside className="w-14 border-r border-border bg-card flex flex-col items-center py-2 flex-shrink-0">
              <ModuleSwitcher />
            </aside>
          )}

          {/* Module Sidebar - Desktop: inline, Mobile: drawer overlay */}
          {!isMobile && (
            <ModuleSidebar 
              module={module} 
              isCollapsed={isCollapsed}
              onToggleCollapse={toggle}
            />
          )}

          {/* Mobile Sidebar Drawer */}
          {isMobile && mobileMenuOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black/50 z-40 animate-fade-in tap-highlight-none"
                onClick={() => setMobileMenuOpen(false)}
                aria-hidden="true"
              />
              {/* Drawer */}
              <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-card z-50 flex flex-col shadow-xl animate-slide-in-right safe-area-inset-top safe-area-inset-bottom"
                style={{ animation: 'slideInLeft 0.25s ease-out' }}
              >
                {/* Drawer header */}
                <div className="flex items-center justify-between p-3 border-b border-border">
                  <span className="text-sm font-semibold text-foreground">Menu</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Fechar menu"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {/* Module switcher icons (horizontal) */}
                <div className="border-b border-border px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    <ModuleSwitcher />
                  </div>
                </div>
                {/* Sidebar navigation */}
                <div className="flex-1 overflow-auto scroll-container">
                  <ModuleSidebar
                    module={module}
                    isCollapsed={false}
                    onToggleCollapse={() => setMobileMenuOpen(false)}
                    bare
                  />
                </div>
              </div>
            </>
          )}

          {/* Page Content */}
          <main
            id="module-main-content"
            className="flex-1 overflow-auto p-4 md:p-6"
            onScroll={handleScroll}
          >
            {(title || description) && (
              <div className="mb-4 md:mb-6">
                {title && (
                  <h1 className="text-xl md:text-2xl font-bold tracking-tight">{title}</h1>
                )}
                {description && (
                  <p className="text-sm md:text-base text-muted-foreground">{description}</p>
                )}
              </div>
            )}
            {children}
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
            <ArrowUp className="h-5 w-5" />
          </Button>
        )}
      </div>
    </TooltipProvider>
  );
}
