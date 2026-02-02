/**
 * TopBar Mobile — Header Institucional Mobile
 * 
 * Barra fixa com:
 * - Botão menu hamburger
 * - Título da tela
 * - Ícone de alertas
 */

import { useLocation } from "react-router-dom";
import { Menu, Bell, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface TopBarMobileProps {
  onOpenMenu: () => void;
  alertas?: number;
  hasUrgent?: boolean;
}

/**
 * Extrai título da página baseado na rota
 */
function getPageTitle(pathname: string): string {
  const labelMap: Record<string, string> = {
    '/admin': 'Painel',
    '/admin/usuarios': 'Usuários',
    '/admin/perfis': 'Perfis',
    '/admin/auditoria': 'Auditoria',
    '/rh/servidores': 'Servidores',
    '/rh/portarias': 'Portarias',
    '/rh/designacoes': 'Designações',
    '/workflow/processos': 'Processos',
    '/processos/compras': 'Compras',
    '/processos/patrimonio': 'Patrimônio',
    '/transparencia': 'Transparência',
    '/governanca': 'Governança',
  };

  // Busca match exato ou parcial
  for (const [route, label] of Object.entries(labelMap)) {
    if (pathname === route || pathname.startsWith(route + '/')) {
      return label;
    }
  }

  // Fallback: última parte da rota
  const parts = pathname.split('/').filter(Boolean);
  const lastPart = parts[parts.length - 1] || 'Sistema';
  return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
}

export function TopBarMobile({ 
  onOpenMenu, 
  alertas = 0,
  hasUrgent = false,
}: TopBarMobileProps) {
  const location = useLocation();
  const currentPage = getPageTitle(location.pathname);

  return (
    <header className="sticky top-0 z-50 flex h-12 items-center gap-3 border-b bg-background px-3 md:hidden">
      {/* Botão Menu */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onOpenMenu}
        className="h-9 w-9 shrink-0"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Título */}
      <h1 className="flex-1 font-medium text-sm truncate">
        {currentPage}
      </h1>

      {/* Alertas */}
      <Button variant="ghost" size="icon" className="relative h-9 w-9 shrink-0">
        {hasUrgent ? (
          <AlertTriangle className="h-5 w-5 text-destructive" />
        ) : (
          <Bell className="h-5 w-5" />
        )}
        {alertas > 0 && (
          <span className={cn(
            "absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full text-[10px] font-medium flex items-center justify-center",
            hasUrgent 
              ? "bg-destructive text-destructive-foreground animate-pulse"
              : "bg-primary text-primary-foreground"
          )}>
            {alertas > 9 ? '9+' : alertas}
          </span>
        )}
      </Button>
    </header>
  );
}
