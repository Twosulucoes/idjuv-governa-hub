import { Link } from "react-router-dom";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LogoIdjuv } from "@/components/ui/LogoIdjuv";
import { MenuDinamico } from "@/components/menu/MenuDinamico";

export function AdminSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2">
            <LogoIdjuv
              className={cn("logo-sidebar", isCollapsed && "h-6")}
            />
            {!isCollapsed && (
              <span className="font-semibold text-sm">Admin</span>
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
          {/* Menu Dinâmico baseado em permissões */}
          <MenuDinamico />
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        {!isCollapsed && (
          <div className="text-xs text-muted-foreground text-center">
            IDJUV - Sistema Administrativo
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
