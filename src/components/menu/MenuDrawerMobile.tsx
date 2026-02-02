/**
 * MENU DRAWER MOBILE
 * 
 * Drawer lateral para dispositivos móveis
 * Prioriza acesso rápido, favoritos e busca
 * 
 * @version 1.1.0 - Adicionada busca de menu e melhorias de UX
 */

import { Link } from "react-router-dom";
import { 
  ChevronRight,
  X,
  Star,
  Loader2,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMenu, type MenuItemFiltered, type MenuSectionFiltered } from "@/contexts/MenuContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LogoIdjuv } from "@/components/ui/LogoIdjuv";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { MenuSearch } from "./MenuSearch";

export function MenuDrawerMobile() {
  const {
    sections,
    dashboard,
    isLoading,
    isMobileDrawerOpen,
    setMobileDrawerOpen,
    openSections,
    openItems,
    toggleSection,
    toggleItem,
    isActive,
    getQuickAccessItems,
    getFavoriteItems,
  } = useMenu();

  const quickAccessItems = getQuickAccessItems();
  const favoriteItems = getFavoriteItems();

  const renderMenuItem = (item: MenuItemFiltered, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isItemActive = isActive(item.route);
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
          <button
            className={cn(
              "w-full flex items-center justify-between py-2 px-3 rounded-md hover:bg-accent transition-colors",
              depth > 0 && "pl-6"
            )}
            onClick={() => toggleItem(item.id)}
          >
            <span className="flex items-center gap-2 text-sm">
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.labelShort || item.label}</span>
            </span>
            <ChevronRight className={cn(
              "h-4 w-4 transition-transform duration-200",
              isOpen && "rotate-90"
            )} />
          </button>
          <CollapsibleContent>
            <div className="border-l border-border ml-4 pl-2 space-y-1">
              {item.children?.map((child) => renderMenuItem(child, depth + 1))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      );
    }

    if (!item.route) return null;

    return (
      <Link
        key={item.id}
        to={item.route}
        className={cn(
          "flex items-center gap-2 py-2 px-3 rounded-md transition-colors text-sm",
          isItemActive 
            ? "bg-primary text-primary-foreground" 
            : "hover:bg-accent",
          depth > 0 && "pl-6"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1">{item.labelShort || item.label}</span>
        {item.badge && (
          <Badge variant="secondary" className="text-[10px] px-1.5">
            {item.badge}
          </Badge>
        )}
      </Link>
    );
  };

  const renderSection = (section: MenuSectionFiltered) => {
    const isOpen = openSections.includes(section.id);
    const SectionIcon = section.icon;

    return (
      <Collapsible
        key={section.id}
        open={isOpen}
        onOpenChange={() => toggleSection(section.id)}
      >
        <button
          className="w-full flex items-center justify-between py-2 px-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => toggleSection(section.id)}
        >
          <span className="flex items-center gap-2">
            <SectionIcon className="h-4 w-4" />
            <span>{section.labelShort || section.label}</span>
          </span>
          <ChevronRight className={cn(
            "h-4 w-4 transition-transform duration-200",
            isOpen && "rotate-90"
          )} />
        </button>
        <CollapsibleContent className="space-y-1 mt-1">
          {section.items.map((item) => renderMenuItem(item))}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <Sheet open={isMobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <Link 
              to="/admin" 
              className="flex items-center gap-2" 
              onClick={() => setMobileDrawerOpen(false)}
            >
              <LogoIdjuv className="h-8" />
              <SheetTitle className="text-base font-semibold">IDJUV</SheetTitle>
            </Link>
            <Button variant="ghost" size="icon" onClick={() => setMobileDrawerOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-5rem)]">
          <div className="p-4 space-y-4">
            {/* Busca de Menu */}
            <MenuSearch 
              variant="mobile"
              placeholder="Buscar no menu..."
              onNavigate={() => setMobileDrawerOpen(false)}
            />

            {/* Loading */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {!isLoading && (
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
                    {quickAccessItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.id}
                          to={item.route!}
                          className={cn(
                            "flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors",
                            isActive(item.route)
                              ? "bg-primary text-primary-foreground border-primary"
                              : "hover:bg-accent border-border"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="text-xs text-center">{item.labelShort || item.label}</span>
                        </Link>
                      );
                    })}
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
                        {favoriteItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={`fav-${item.id}`}
                              to={item.route!}
                              className={cn(
                                "flex items-center gap-2 py-2 px-3 rounded-md transition-colors text-sm",
                                isActive(item.route)
                                  ? "bg-primary text-primary-foreground"
                                  : "hover:bg-accent"
                              )}
                            >
                              <Icon className="h-4 w-4" />
                              <span>{item.labelShort || item.label}</span>
                            </Link>
                          );
                        })}
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
                    {sections.map(renderSection)}
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
