/**
 * Menu Drawer Mobile — Componente Institucional
 * 
 * Drawer hamburger com priorização de ações essenciais
 * Mobile-first, com agrupamentos colapsáveis
 */

import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  ChevronRight,
  X,
  Star,
  Loader2,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigacaoPermissoes, type NavItemFiltrado, type NavSectionFiltrada } from "@/hooks/useNavigacaoPermissoes";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LogoIdjuv } from "@/components/ui/LogoIdjuv";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";

interface MenuDrawerMobileProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FAVORITES_KEY = "nav-favorites-v2";

export function MenuDrawerMobile({ open, onOpenChange }: MenuDrawerMobileProps) {
  const location = useLocation();
  const { secoesFiltradas, loading, error } = useNavigacaoPermissoes();
  
  const [favorites, setFavorites] = useState<string[]>([]);
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [openItems, setOpenItems] = useState<string[]>([]);

  // Carrega favoritos
  useEffect(() => {
    const saved = localStorage.getItem(FAVORITES_KEY);
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch {}
    }
  }, []);

  // Fecha drawer ao navegar
  useEffect(() => {
    if (open) {
      onOpenChange(false);
    }
  }, [location.pathname]);

  const isActive = (href?: string) => {
    if (!href) return false;
    const cleanHref = href.split('?')[0];
    return location.pathname === cleanHref;
  };

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const toggleItem = (itemId: string) => {
    setOpenItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Itens prioritários para acesso rápido (mobile)
  const quickAccessItems = secoesFiltradas
    .flatMap(section => section.items)
    .filter(item => item.priority && item.priority <= 4 && item.href && !item.hideOnMobile)
    .sort((a, b) => (a.priority || 99) - (b.priority || 99))
    .slice(0, 4);

  // Favoritos
  const favoriteItems = secoesFiltradas.flatMap((section) =>
    section.items.flatMap((item) => {
      if (favorites.includes(item.id) && item.href) return [item];
      if (item.children) {
        return item.children.filter((child) => favorites.includes(child.id) && child.href);
      }
      return [];
    })
  ).slice(0, 4);

  const renderMenuItem = (item: NavItemFiltrado, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isItemActive = isActive(item.href);
    const isOpen = openItems.includes(item.id);

    // Ocultar itens marcados para esconder no mobile
    if (item.hideOnMobile && depth === 0) return null;

    // Item com filhos (submenu)
    if (hasChildren) {
      const visibleChildren = item.children?.filter(child => !child.hideOnMobile) || [];
      if (visibleChildren.length === 0) return null;

      return (
        <Collapsible 
          key={item.id} 
          open={isOpen}
          onOpenChange={() => toggleItem(item.id)}
        >
          <button
            className={cn(
              "w-full flex items-center justify-between py-2 px-3 rounded-md hover:bg-accent transition-colors",
              depth > 0 && "pl-6"
            )}
            onClick={() => toggleItem(item.id)}
          >
            <span className="flex items-center gap-2 text-sm">
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.labelShort || item.label}</span>
            </span>
            <ChevronRight className={cn(
              "h-4 w-4 transition-transform duration-200",
              isOpen && "rotate-90"
            )} />
          </button>
          <CollapsibleContent>
            <div className="border-l border-border ml-4 pl-2 space-y-1">
              {visibleChildren.map((child) => renderMenuItem(child, depth + 1))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      );
    }

    if (!item.href) return null;

    return (
      <Link
        key={item.id}
        to={item.href}
        className={cn(
          "flex items-center gap-2 py-2 px-3 rounded-md transition-colors text-sm",
          isItemActive 
            ? "bg-primary text-primary-foreground" 
            : "hover:bg-accent",
          depth > 0 && "pl-6"
        )}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        <span className="flex-1">{item.labelShort || item.label}</span>
        {item.badge && (
          <Badge variant="secondary" className="text-[10px] px-1.5">
            {item.badge}
          </Badge>
        )}
      </Link>
    );
  };

  const renderSection = (section: NavSectionFiltrada) => {
    const isOpen = openSections.includes(section.id);
    const visibleItems = section.items.filter(item => !item.hideOnMobile);
    
    if (visibleItems.length === 0) return null;

    return (
      <Collapsible
        key={section.id}
        open={isOpen}
        onOpenChange={() => toggleSection(section.id)}
      >
        <CollapsibleTrigger asChild>
          <button
            className="w-full flex items-center justify-between py-2 px-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="flex items-center gap-2">
              <section.icon className="h-4 w-4" />
              <span>{section.labelShort || section.label}</span>
            </span>
            <ChevronRight className={cn(
              "h-4 w-4 transition-transform duration-200",
              isOpen && "rotate-90"
            )} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1 mt-1">
          {visibleItems.map((item) => renderMenuItem(item))}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <Link to="/admin" className="flex items-center gap-2" onClick={() => onOpenChange(false)}>
              <LogoIdjuv className="h-8" />
              <SheetTitle className="text-base font-semibold">IDJUV</SheetTitle>
            </Link>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-5rem)]">
          <div className="p-4 space-y-4">
            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="text-sm text-destructive text-center py-4">
                Erro ao carregar menu
              </div>
            )}

            {!loading && !error && (
              <>
                {/* Acesso Rápido */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                    Acesso Rápido
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to="/admin"
                      className={cn(
                        "flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors",
                        isActive("/admin")
                          ? "bg-primary text-primary-foreground border-primary"
                          : "hover:bg-accent border-border"
                      )}
                    >
                      <Home className="h-5 w-5" />
                      <span className="text-xs">Início</span>
                    </Link>
                    {quickAccessItems.map((item) => (
                      <Link
                        key={item.id}
                        to={item.href!}
                        className={cn(
                          "flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors",
                          isActive(item.href)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "hover:bg-accent border-border"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="text-xs text-center">{item.labelShort || item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Favoritos */}
                {favoriteItems.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 flex items-center gap-1">
                        <Star className="h-3 w-3 fill-primary text-primary" />
                        Favoritos
                      </h3>
                      <div className="space-y-1">
                        {favoriteItems.map((item) => (
                          <Link
                            key={`fav-${item.id}`}
                            to={item.href!}
                            className={cn(
                              "flex items-center gap-2 py-2 px-3 rounded-md transition-colors text-sm",
                              isActive(item.href)
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-accent"
                            )}
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.labelShort || item.label}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Menu Completo */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                    Menu Completo
                  </h3>
                  <div className="space-y-1">
                    {secoesFiltradas.map(renderSection)}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
