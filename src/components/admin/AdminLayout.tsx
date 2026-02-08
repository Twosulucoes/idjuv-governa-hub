/**
 * AdminLayout — Layout Institucional do Sistema Administrativo
 * 
 * Layout responsivo com:
 * - Menu lateral colapsável (desktop)
 * - Drawer hamburger (mobile)
 * - TopBar com breadcrumb e alertas
 * - DevModeSwitcher para testes (quando ativo)
 * 
 * @version 3.1.0 - Adicionado DevModeSwitcher
 */

import { useState } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { MenuSidebar, MenuDrawerMobile, MenuProvider } from "@/components/menu";
import { TopBarDesktop } from "@/components/navigation/TopBarDesktop";
import { TopBarMobile } from "@/components/navigation/TopBarMobile";
import { AdminSearch } from "./AdminSearch";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMenu } from "@/contexts/MenuContext";
import { DevModeSwitcher } from "@/components/dev/DevModeSwitcher";

export interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

function AdminLayoutContent({ children, title, description }: AdminLayoutProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const isMobile = useIsMobile();
  const { setMobileDrawerOpen } = useMenu();

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
        {!isMobile && <MenuSidebar />}

        {/* Drawer Mobile */}
        <MenuDrawerMobile />

        <SidebarInset className="flex flex-col flex-1">
          {/* TopBar Mobile */}
          {isMobile && (
            <TopBarMobile 
              onOpenMenu={() => setMobileDrawerOpen(true)}
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
      
      {/* Dev Mode Switcher */}
      <DevModeSwitcher />
    </SidebarProvider>
  );
}

export function AdminLayout(props: AdminLayoutProps) {
  return (
    <MenuProvider>
      <AdminLayoutContent {...props} />
    </MenuProvider>
  );
}
