/**
 * MENU SIDEBAR DESKTOP
 * 
 * Sidebar colapsável institucional com grupos, favoritos e busca
 * Integração direta com MenuContext
 * 
 * @version 1.1.0 - Adicionada busca de menu
 */

import { Link } from "react-router-dom";
import { 
  ChevronDown, 
  ChevronRight,
  PanelLeftClose, 
  PanelLeft,
  Star,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMenu, type MenuItemFiltered, type MenuSectionFiltered } from "@/contexts/MenuContext";
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
import { MenuSearch } from "./MenuSearch";

export function MenuSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  
  const {
    sections,
    dashboard,
    isLoading,
    openSections,
    openItems,
    favorites,
    toggleSection,
    toggleItem,
    toggleFavorite,
    isActive,
    getFavoriteItems,
  } = useMenu();

  // Loading
  if (isLoading) {
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

  const renderMenuItem = (item: MenuItemFiltered, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isItemActive = isActive(item.route);
    const isFavorite = favorites.includes(item.id);
    const isOpen = openItems.includes(item.id);
    const Icon = item.icon;

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
                  <Icon className="h-4 w-4 shrink-0" />
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
    if (!item.route) return null;

    const menuButton = (
      <SidebarMenuButton
        asChild
        isActive={isItemActive}
        className={cn(depth > 0 && "pl-6")}
      >
        <Link to={item.route} className="flex items-center justify-between w-full group/item">
          <span className="flex items-center gap-2 min-w-0">
            <Icon className="h-4 w-4 shrink-0" />
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
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleFavorite(item.id);
              }}
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

  const renderSection = (section: MenuSectionFiltered) => {
    const isOpen = openSections.includes(section.id);
    const SectionIcon = section.icon;
    const hasActiveChild = section.items.some((item) => {
      if (isActive(item.route)) return true;
      return item.children?.some((child) => isActive(child.route));
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
                <SectionIcon className="h-4 w-4" />
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

  const favoriteItems = getFavoriteItems();
  const DashboardIcon = dashboard.icon;

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
          {/* Busca de Menu (apenas quando expandido) */}
          {!isCollapsed && (
            <div className="px-3 py-2">
              <MenuSearch 
                variant="desktop" 
                placeholder="Buscar..."
              />
            </div>
          )}

          {/* Dashboard */}
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive(dashboard.route)}>
                    <Link to={dashboard.route!} className="flex items-center gap-2">
                      <DashboardIcon className="h-4 w-4" />
                      {!isCollapsed && <span>{dashboard.label}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Favoritos */}
          {favoriteItems.length > 0 && !isCollapsed && (
            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-primary text-primary" />
                Favoritos
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {favoriteItems.map((item) => {
                    const FavIcon = item.icon;
                    return (
                      <SidebarMenuItem key={`fav-${item.id}`}>
                        <SidebarMenuButton asChild isActive={isActive(item.route)}>
                          <Link to={item.route!} className="flex items-center gap-2">
                            <FavIcon className="h-4 w-4" />
                            <span className="truncate">{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* Seções */}
          {sections.map(renderSection)}
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
