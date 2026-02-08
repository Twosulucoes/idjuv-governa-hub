/**
 * MODULE HEADER
 * 
 * Header específico para cada módulo com logo, nome e user menu
 * 
 * @version 1.0.0
 */

import { Link } from "react-router-dom";
import { LogoIdjuv } from "@/components/ui/LogoIdjuv";
import { UserMenu } from "@/components/auth/UserMenu";
import { MODULES_CONFIG, type Modulo } from "@/shared/config/modules.config";
import { cn } from "@/lib/utils";

interface ModuleHeaderProps {
  module: Modulo;
}

export function ModuleHeader({ module }: ModuleHeaderProps) {
  const moduleConfig = MODULES_CONFIG.find(m => m.codigo === module);
  const Icon = moduleConfig?.icone;

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4">
      {/* Left: Logo + Module Name */}
      <div className="flex items-center gap-4">
        <Link to="/sistema" className="flex items-center gap-2">
          <LogoIdjuv className="h-8" />
        </Link>
        
        {moduleConfig && (
          <>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              {Icon && <Icon className="h-5 w-5 text-primary" />}
              <span className="font-semibold text-foreground">
                {moduleConfig.nome}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Right: User Menu */}
      <div className="flex items-center gap-4">
        <UserMenu />
      </div>
    </header>
  );
}
