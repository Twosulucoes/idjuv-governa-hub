/**
 * MODULE SIDEBAR
 * 
 * Sidebar específica de cada módulo com navegação contextual
 * Suporta colapso para maximizar área de conteúdo
 * Filtra funcionalidades desabilitadas via module_settings
 * Acessível: <nav> rotulado, aria-current na tela ativa, rótulos nos ícones
 * do modo recolhido e grupo da tela ativa aberto ao carregar.
 *
 * @version 3.0.0
 */

import { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, LayoutDashboard, PanelLeftClose, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { MODULE_MENUS, type ModuleMenuItem } from "@/config/module-menus.config";
import { MODULES_CONFIG, type Modulo } from "@/shared/config/modules.config";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useModuleSettings } from "@/hooks/useModuleSettings";

// Foco visível em todo item navegável do menu
const FOCO = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-card";

interface ModuleSidebarProps {
  module: Modulo;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  /** When true, renders content without the outer aside wrapper (for use inside drawers) */
  bare?: boolean;
}

export function ModuleSidebar({ module, isCollapsed = false, onToggleCollapse, bare = false }: ModuleSidebarProps) {
  const location = useLocation();
  const menuConfig = MODULE_MENUS[module];
  const [openItems, setOpenItems] = useState<string[]>([]);
  const { getDisabledFeatures } = useModuleSettings();

  // Filter out disabled features
  const filteredItems = useMemo(() => {
    const disabled = getDisabledFeatures(module);
    if (disabled.length === 0) return menuConfig?.items || [];
    
    return (menuConfig?.items || [])
      .filter(item => !disabled.includes(item.id))
      .map(item => {
        if (item.children) {
          return {
            ...item,
            children: item.children.filter(child => !disabled.includes(child.id)),
          };
        }
        return item;
      });
  }, [menuConfig, module, getDisabledFeatures]);

  const isActive = (route: string) => {
    const cleanRoute = route.split('?')[0];
    return location.pathname === cleanRoute || location.pathname.startsWith(cleanRoute + '/');
  };

  // Abre o grupo que contém a tela atual (quem chega por link vê onde está)
  useEffect(() => {
    const ativos = filteredItems
      .filter((item) => item.children?.some((child) => isActive(child.route)))
      .map((item) => item.id);
    if (ativos.length === 0) return;
    setOpenItems((prev) => (ativos.every((id) => prev.includes(id)) ? prev : [...new Set([...prev, ...ativos])]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, filteredItems]);

  if (!menuConfig) {
    return null;
  }

  // O painel é a raiz do módulo: só fica ativo nele mesmo, não nas subtelas
  const naDashboard = location.pathname === menuConfig.dashboard.route.split('?')[0];
  const rotuloNav = `Menu de ${MODULES_CONFIG.find((m) => m.codigo === module)?.nome ?? "módulo"}`;

  const toggleItem = (itemId: string) => {
    setOpenItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Renderiza item do menu (versão colapsada - apenas ícone)
  const renderCollapsedMenuItem = (item: ModuleMenuItem) => {
    const Icon = item.icon;
    const isItemActive = isActive(item.route);

    return (
      <Tooltip key={item.id}>
        <TooltipTrigger asChild>
          <Link
            to={item.route}
            aria-label={item.label}
            aria-current={isItemActive ? "page" : undefined}
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-md transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              FOCO,
              isItemActive && "bg-primary text-primary-foreground"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          <p>{item.label}</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  // Renderiza item do menu (versão expandida - completa)
  const renderExpandedMenuItem = (item: ModuleMenuItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isItemActive = isActive(item.route);
    const isOpen = openItems.includes(item.id);
    const Icon = item.icon;

    if (hasChildren) {
      return (
        <Collapsible
          key={item.id}
          open={isOpen}
          onOpenChange={() => toggleItem(item.id)}
        >
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex items-center justify-between w-full px-3 py-2 rounded-md text-sm transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                FOCO,
                depth > 0 && "pl-8"
              )}
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{item.label}</span>
              </span>
              <ChevronRight aria-hidden="true" className={cn(
                "h-4 w-4 transition-transform",
                isOpen && "rotate-90"
              )} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="ml-4 border-l border-border pl-2 mt-1 space-y-1">
              {item.children?.map((child) => renderExpandedMenuItem(child, depth + 1))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <Link
        key={item.id}
        to={item.route}
        aria-current={isItemActive ? "page" : undefined}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          FOCO,
          isItemActive && "bg-primary text-primary-foreground font-medium",
          depth > 0 && "pl-8"
        )}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
        <span>{item.label}</span>
      </Link>
    );
  };

  // Versão colapsada da sidebar
  if (isCollapsed && !bare) {
    return (
      <nav aria-label={rotuloNav} className="w-14 border-r border-border bg-card flex-shrink-0 flex flex-col">
        {/* Botão de expandir */}
        <div className="p-2 border-b border-border">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleCollapse}
                className="w-10 h-10"
                aria-label="Expandir menu"
                aria-expanded={false}
              >
                <PanelLeft className="h-4 w-4" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Expandir menu</TooltipContent>
          </Tooltip>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1 flex flex-col items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to={menuConfig.dashboard.route}
                  aria-label={menuConfig.dashboard.label}
                  aria-current={naDashboard ? "page" : undefined}
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-md transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    FOCO,
                    naDashboard && "bg-primary text-primary-foreground"
                  )}
                >
                  <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{menuConfig.dashboard.label}</TooltipContent>
            </Tooltip>
            <div className="h-px w-6 bg-border my-2" aria-hidden="true" />
            {filteredItems.map((item) => renderCollapsedMenuItem(item))}
          </div>
        </ScrollArea>
      </nav>
    );
  }

  // Content for expanded sidebar
  const expandedContent = (
    <>
      {!bare && (
        <div className="p-2 border-b border-border flex justify-end">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleCollapse}
                className="h-8 w-8"
                aria-label="Recolher menu"
                aria-expanded={true}
              >
                <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Recolher menu</TooltipContent>
          </Tooltip>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-1">
          <Link
            to={menuConfig.dashboard.route}
            aria-current={naDashboard ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-colors touch-target-sm",
              "hover:bg-accent hover:text-accent-foreground",
              FOCO,
              naDashboard && "bg-primary text-primary-foreground"
            )}
          >
            <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
            <span>{menuConfig.dashboard.label}</span>
          </Link>
          <div className="h-px bg-border my-2" aria-hidden="true" />
          {filteredItems.map((item) => renderExpandedMenuItem(item))}
        </div>
      </ScrollArea>
    </>
  );

  // Bare mode: no wrapping aside (used inside drawer)
  if (bare) {
    return <nav aria-label={rotuloNav} className="flex flex-col flex-1">{expandedContent}</nav>;
  }

  // Versão expandida da sidebar
  return (
    <nav aria-label={rotuloNav} className="w-56 border-r border-border bg-card flex-shrink-0 flex flex-col">
      {expandedContent}
    </nav>
  );
}
