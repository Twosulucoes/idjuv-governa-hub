/**
 * MODULE LAYOUT
 * 
 * Layout modular para cada área do sistema
 * Substitui o AdminLayout compartilhado por um layout específico por módulo
 * 
 * @version 1.0.0
 */

import { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ModuleSwitcher } from "./ModuleSwitcher";
import { ModuleSidebar } from "./ModuleSidebar";
import { ModuleHeader } from "./ModuleHeader";
import type { Modulo } from "@/shared/config/modules.config";

interface ModuleLayoutProps {
  children: ReactNode;
  module: Modulo;
  title?: string;
  description?: string;
}

export function ModuleLayout({ children, module, title, description }: ModuleLayoutProps) {
  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col bg-background">
        {/* Header */}
        <ModuleHeader module={module} />

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Module Switcher (ícones dos módulos) */}
          <aside className="w-14 border-r border-border bg-card flex flex-col items-center py-2 flex-shrink-0">
            <ModuleSwitcher />
          </aside>

          {/* Module Sidebar (navegação do módulo) */}
          <ModuleSidebar module={module} />

          {/* Page Content */}
          <main className="flex-1 overflow-auto p-6">
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
        </div>
      </div>
    </TooltipProvider>
  );
}
