/**
 * Menu Lateral Desktop — Componente Institucional
 * 
 * Sidebar colapsável com grupos claros, inspirado em SEI/e-Processo
 * Integração RBAC para exibir apenas itens autorizados
 */

import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  ChevronDown, 
  ChevronRight,
  PanelLeftClose, 
  PanelLeft,
  Star,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigacaoPermissoes, type NavItemFiltrado, type NavSectionFiltrada } from "@/hooks/useNavigacaoPermissoes";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LogoIdjuv } from "@/components/ui/LogoIdjuv";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const FAVORITES_KEY = "nav-favorites-v2";

export function MenuLateralDesktop() {
  const location = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
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

  // Auto-expande seção com rota ativa
  useEffect(() => {
    const currentPath = location.pathname;
    
    secoesFiltradas.forEach((section) => {
      const hasActiveItem = section.items.some((item) => {
        if (item.href?.split('?')[0] === currentPath) return true;
        if (item.children?.some((child) => child.href?.split('?')[0] === currentPath)) return true;
        return false;
      });
      
      if (hasActiveItem && !openSections.includes(section.id)) {
        setOpenSections((prev) => [...prev, section.id]);
      }

      // Expande submenus com item ativo
      section.items.forEach(item => {
        if (item.children?.some(child => child.href?.split('?')[0] === currentPath)) {
          if (!openItems.includes(item.id)) {
            setOpenItems(prev => [...prev, item.id]);
          }
        }
      });
    });
  }, [location.pathname, secoesFiltradas]);

  const isActive = (href?: string) => {
    if (!href) return false;
    const cleanHref = href.split('?')[0];
    return location.pathname === cleanHref || location.pathname.startsWith(cleanHref + "/");
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

  const toggleFavorite = (itemId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newFavorites = favorites.includes(itemId)
      ? favorites.filter((id) => id !== itemId)
      : [...favorites, itemId];
    setFavorites(newFavorites);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
  };

  // Loading
  if (loading) {
    return (
      <Sidebar collapsible="icon" className="border-r">
        <SidebarHeader className="border-b p-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </SidebarHeader>
      </Sidebar>
    );
  }

  // Error
  if (error) {
    return (
      <Sidebar collapsible="icon" className="border-r">
        <SidebarContent className="flex items-center justify-center p-4">
          <span className="text-sm text-destructive">Erro ao carregar menu</span>
        </SidebarContent>
      </Sidebar>
    );
  }

  const renderMenuItem = (item: NavItemFiltrado, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isItemActive = isActive(item.href);
    const isFavorite = favorites.includes(item.id);
    const isOpen = openItems.includes(item.id);

    // Item com filhos (submenu)
    if (hasChildren) {
      return (
        <Collapsible 
          key={item.id} 
          open={isOpen}
          onOpenChange={() => toggleItem(item.id)}
        >
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton
                className={cn(
                  "w-full justify-between",
                  depth > 0 && "pl-6"
                )}
              >
                <span className="flex items-center gap-2">
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </span>
                {!isCollapsed && (
                  <ChevronRight className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    isOpen && "rotate-90"
                  )} />
                )}
              </SidebarMenuButton>
            </CollapsibleTrigger>
          </SidebarMenuItem>
          <CollapsibleContent>
            <div className={cn("border-l border-border ml-4 pl-2", depth > 0 && "ml-6")}>
              {item.children?.map((child) => renderMenuItem(child, depth + 1))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      );
    }

    // Item simples (link)
    if (!item.href) return null;

    const menuButton = (
      <SidebarMenuButton
        asChild
        isActive={isItemActive}
        className={cn(depth > 0 && "pl-6")}
      >
        <Link to={item.href} className="flex items-center justify-between w-full group/item">
          <span className="flex items-center gap-2 min-w-0">
            <item.icon className="h-4 w-4 shrink-0" />
            {!isCollapsed && (
              <>
                <span className="truncate">{item.label}</span>
                {item.badge && (
                  <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">
                    {item.badge}
                  </Badge>
                )}
              </>
            )}
          </span>
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0"
              onClick={(e) => toggleFavorite(item.id, e)}
            >
              <Star className={cn(
                "h-3 w-3",
                isFavorite && "fill-primary text-primary"
              )} />
            </Button>
          )}
        </Link>
      </SidebarMenuButton>
    );

    if (isCollapsed) {
      return (
        <SidebarMenuItem key={item.id}>
          <Tooltip>
            <TooltipTrigger asChild>{menuButton}</TooltipTrigger>
            <TooltipContent side="right" className="flex items-center gap-2">
              {item.label}
              {item.badge && <Badge variant="secondary">{item.badge}</Badge>}
            </TooltipContent>
          </Tooltip>
        </SidebarMenuItem>
      );
    }

    return <SidebarMenuItem key={item.id}>{menuButton}</SidebarMenuItem>;
  };

  const renderSection = (section: NavSectionFiltrada) => {
    const isOpen = openSections.includes(section.id);
    const hasActiveChild = section.items.some((item) => {
      if (isActive(item.href)) return true;
      if (item.children?.some((child) => isActive(child.href))) return true;
      return false;
    });

    return (
      <Collapsible
        key={section.id}
        open={isOpen}
        onOpenChange={() => toggleSection(section.id)}
      >
        <SidebarGroup>
          <CollapsibleTrigger asChild>
            <SidebarGroupLabel
              className={cn(
                "cursor-pointer hover:bg-accent rounded-md transition-colors flex items-center justify-between pr-2",
                hasActiveChild && "text-primary font-medium"
              )}
            >
              <span className="flex items-center gap-2">
                <section.icon className="h-4 w-4" />
                {!isCollapsed && <span>{isCollapsed ? section.labelShort : section.label}</span>}
              </span>
              {!isCollapsed && (
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    isOpen && "rotate-180"
                  )}
                />
              )}
            </SidebarGroupLabel>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => renderMenuItem(item))}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    );
  };

  // Favoritos
  const favoriteItems = secoesFiltradas.flatMap((section) =>
    section.items.flatMap((item) => {
      if (favorites.includes(item.id) && item.href) return [item];
      if (item.children) {
        return item.children.filter((child) => favorites.includes(child.id) && child.href);
      }
      return [];
    })
  );

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2">
            <LogoIdjuv className={cn("logo-sidebar", isCollapsed && "h-6")} />
            {!isCollapsed && (
              <span className="font-semibold text-sm text-foreground">IDJUV</span>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleSidebar}
          >
            {isCollapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <ScrollArea className="h-[calc(100vh-8rem)]">
          {/* Favoritos */}
          {favoriteItems.length > 0 && !isCollapsed && (
            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-primary text-primary" />
                Favoritos
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {favoriteItems.map((item) => (
                    <SidebarMenuItem key={`fav-${item.id}`}>
                      <SidebarMenuButton asChild isActive={isActive(item.href)}>
                        <Link to={item.href!} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* Seções */}
          {secoesFiltradas.map(renderSection)}
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        {!isCollapsed && (
          <div className="text-xs text-muted-foreground text-center">
            IDJUV — Sistema Administrativo
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
