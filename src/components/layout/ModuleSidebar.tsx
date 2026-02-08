/**
 * MODULE SIDEBAR
 * 
 * Sidebar específica de cada módulo com navegação contextual
 * 
 * @version 1.0.0
 */

import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, ChevronRight, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { MODULE_MENUS, type ModuleMenuItem } from "@/config/module-menus.config";
import type { Modulo } from "@/shared/config/modules.config";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ModuleSidebarProps {
  module: Modulo;
}

export function ModuleSidebar({ module }: ModuleSidebarProps) {
  const location = useLocation();
  const menuConfig = MODULE_MENUS[module];
  const [openItems, setOpenItems] = useState<string[]>([]);

  if (!menuConfig) {
    return null;
  }

  const isActive = (route: string) => {
    const cleanRoute = route.split('?')[0];
    return location.pathname === cleanRoute || location.pathname.startsWith(cleanRoute + '/');
  };

  const toggleItem = (itemId: string) => {
    setOpenItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const renderMenuItem = (item: ModuleMenuItem, depth = 0) => {
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
              className={cn(
                "flex items-center justify-between w-full px-3 py-2 rounded-md text-sm transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                depth > 0 && "pl-8"
              )}
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </span>
              <ChevronRight className={cn(
                "h-4 w-4 transition-transform",
                isOpen && "rotate-90"
              )} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="ml-4 border-l border-border pl-2 mt-1 space-y-1">
              {item.children?.map((child) => renderMenuItem(child, depth + 1))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <Link
        key={item.id}
        to={item.route}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          isItemActive && "bg-primary text-primary-foreground font-medium",
          depth > 0 && "pl-8"
        )}
      >
        <Icon className="h-4 w-4" />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <aside className="w-56 border-r border-border bg-card flex-shrink-0">
      <ScrollArea className="h-full">
        <div className="p-4 space-y-1">
          {/* Dashboard do módulo */}
          <Link
            to={menuConfig.dashboard.route}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              isActive(menuConfig.dashboard.route) && "bg-primary text-primary-foreground"
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>{menuConfig.dashboard.label}</span>
          </Link>

          {/* Separator */}
          <div className="h-px bg-border my-2" />

          {/* Menu items */}
          {menuConfig.items.map((item) => renderMenuItem(item))}
        </div>
      </ScrollArea>
    </aside>
  );
}
