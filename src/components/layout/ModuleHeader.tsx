/**
 * MODULE HEADER
 * 
 * Header específico para cada módulo com logo, nome e user menu
 * 
 * @version 1.0.0
 */

import { Link } from "react-router-dom";
import { Logo } from "@/components/ui/Logo";
import { UserMenu } from "@/components/auth/UserMenu";
import { AvisosSino } from "@/components/avisos";
import { MODULES_CONFIG, type Modulo } from "@/shared/config/modules.config";
import { cn } from "@/lib/utils";

interface ModuleHeaderProps {
  module: Modulo;
  children?: React.ReactNode;
}

export function ModuleHeader({ module, children }: ModuleHeaderProps) {
  const moduleConfig = MODULES_CONFIG.find(m => m.codigo === module);
  const Icon = moduleConfig?.icone;

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4">
      {/* Left: Logo + Module Name */}
      <div className="flex items-center gap-4">
        {children}
        <Link
          to="/sistema"
          aria-label="Início do sistema"
          className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Logo className="h-8" />
        </Link>
        
        {moduleConfig && (
          <>
            <div className="h-6 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2 min-w-0">
              {Icon && <Icon className="h-5 w-5 text-primary flex-shrink-0" aria-hidden="true" />}
              <span className="font-semibold text-foreground truncate hidden sm:inline">
                {moduleConfig.nome}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Right: User Menu */}
      <div className="flex items-center gap-2 sm:gap-4">
        <AvisosSino />
        <UserMenu />
      </div>
    </header>
  );
}
