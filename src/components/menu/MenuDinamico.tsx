/**
 * Componente de Menu Dinâmico baseado em permissões
 * 
 * Renderiza apenas os itens que o usuário tem permissão
 * para acessar, baseado nos dados do Supabase.
 */

import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { ChevronDown, Star, StarOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMenuDinamico, type MenuItemComPermissao, type MenuSectionComPermissao } from "@/hooks/useMenuDinamico";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const FAVORITES_KEY = "admin-favorites";

interface MenuDinamicoProps {
  className?: string;
}

export function MenuDinamico({ className }: MenuDinamicoProps) {
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { menuFiltrado, loading, error } = useMenuDinamico();
  
  const [favorites, setFavorites] = useState<string[]>([]);
  const [openSections, setOpenSections] = useState<string[]>([]);

  // Carrega favoritos do localStorage
  useEffect(() => {
    const saved = localStorage.getItem(FAVORITES_KEY);
    if (saved) {
      setFavorites(JSON.parse(saved));
    }
  }, []);

  // Auto-expande seção com rota ativa
  useEffect(() => {
    const currentPath = location.pathname;
    menuFiltrado.forEach((section) => {
      const hasActiveItem = section.items.some((item) => {
        if (item.href === currentPath) return true;
        if (item.children?.some((child) => child.href === currentPath)) return true;
        return false;
      });
      if (hasActiveItem && !openSections.includes(section.id)) {
        setOpenSections((prev) => [...prev, section.id]);
      }
    });
  }, [location.pathname, menuFiltrado]);

  const toggleFavorite = (itemId: string) => {
    const newFavorites = favorites.includes(itemId)
      ? favorites.filter((id) => id !== itemId)
      : [...favorites, itemId];
    setFavorites(newFavorites);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    return location.pathname === href || location.pathname.startsWith(href + "/");
  };

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className={cn("flex items-center justify-center py-8", className)}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn("p-4 text-sm text-destructive", className)}>
        Erro ao carregar menu
      </div>
    );
  }

  // Itens favoritos (filtrados pelo menu dinâmico)
  const favoriteItems = menuFiltrado.flatMap((section) =>
    section.items.flatMap((item) => {
      if (favorites.includes(item.id) && item.href) return [item];
      if (item.children) {
        return item.children.filter((child) => favorites.includes(child.id) && child.href);
      }
      return [];
    })
  );

  const renderMenuItem = (item: MenuItemComPermissao, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isItemActive = isActive(item.href);
    const isFavorite = favorites.includes(item.id);

    if (hasChildren) {
      return (
        <Collapsible key={item.id} className="w-full">
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              className={cn(
                "w-full justify-between",
                depth > 0 && "pl-8"
              )}
            >
              <span className="flex items-center gap-2">
                <item.icon className="h-4 w-4" />
                {!isCollapsed && <span>{item.label}</span>}
              </span>
              {!isCollapsed && (
                <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              )}
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="ml-4 border-l border-border pl-2">
              {item.children?.map((child) => renderMenuItem(child, depth + 1))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      );
    }

    if (!item.href) return null;

    const menuButton = (
      <SidebarMenuButton
        asChild
        isActive={isItemActive}
        className={cn(depth > 0 && "pl-8")}
      >
        <Link to={item.href} className="flex items-center justify-between w-full group/item">
          <span className="flex items-center gap-2">
            <item.icon className="h-4 w-4" />
            {!isCollapsed && <span>{item.label}</span>}
          </span>
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover/item:opacity-100 transition-opacity"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleFavorite(item.id);
              }}
            >
              {isFavorite ? (
                <Star className="h-3 w-3 fill-primary text-primary" />
              ) : (
                <StarOff className="h-3 w-3" />
              )}
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
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        </SidebarMenuItem>
      );
    }

    return <SidebarMenuItem key={item.id}>{menuButton}</SidebarMenuItem>;
  };

  const renderSection = (section: MenuSectionComPermissao) => {
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
                {!isCollapsed && <span>{section.label}</span>}
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

  return (
    <div className={className}>
      {/* Seção de Favoritos */}
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
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      {/* Seções do Menu */}
      {menuFiltrado.map(renderSection)}
    </div>
  );
}
