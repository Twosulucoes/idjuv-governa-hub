/**
 * AdminLayout — Layout Institucional do Sistema Administrativo
 * 
 * Layout responsivo com:
 * - Menu lateral colapsável (desktop)
 * - Drawer hamburger (mobile)
 * - TopBar com breadcrumb e alertas
 * 
 * @version 2.0.0
 */

import { useState } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { MenuLateralDesktop } from "@/components/navigation/MenuLateralDesktop";
import { MenuDrawerMobile } from "@/components/navigation/MenuDrawerMobile";
import { TopBarDesktop } from "@/components/navigation/TopBarDesktop";
import { TopBarMobile } from "@/components/navigation/TopBarMobile";
import { AdminSearch } from "./AdminSearch";
import { useIsMobile } from "@/hooks/use-mobile";

export interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  // TODO: Integrar com hook real de pendências
  const pendencias = 0;
  const alertas: Array<{
    id: string;
    tipo: 'prazo' | 'urgente' | 'info';
    mensagem: string;
    link?: string;
  }> = [];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* Menu Lateral Desktop */}
        {!isMobile && <MenuLateralDesktop />}

        {/* Drawer Mobile */}
        <MenuDrawerMobile 
          open={mobileMenuOpen} 
          onOpenChange={setMobileMenuOpen} 
        />

        <SidebarInset className="flex flex-col flex-1">
          {/* TopBar Mobile */}
          {isMobile && (
            <TopBarMobile 
              onOpenMenu={() => setMobileMenuOpen(true)}
              alertas={alertas.length}
              hasUrgent={alertas.some(a => a.tipo === 'urgente')}
            />
          )}

          {/* TopBar Desktop */}
          {!isMobile && (
            <TopBarDesktop 
              onOpenSearch={() => setSearchOpen(true)}
              pendencias={pendencias}
              alertas={alertas}
            />
          )}

          {/* Conteúdo */}
          <main className="flex-1 overflow-auto p-4 lg:p-6">
            {(title || description) && (
              <div className="mb-6">
                {title && (
                  <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                )}
                {description && (
                  <p className="text-muted-foreground">{description}</p>
                )}
              </div>
            )}
            {children}
          </main>
        </SidebarInset>
      </div>

      {/* Modal de Busca */}
      <AdminSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </SidebarProvider>
  );
}
