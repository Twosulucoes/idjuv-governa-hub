/**
 * MODULE SWITCHER
 * 
 * Barra de ícones para navegação rápida entre módulos autorizados
 * 
 * @version 1.0.0
 */

import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useModulosUsuario } from "@/hooks/useModulosUsuario";
import { MODULES_CONFIG, type Modulo } from "@/shared/config/modules.config";

// Rotas de dashboard de cada módulo
const MODULE_ROUTES: Record<Modulo, string> = {
  admin: "/admin",
  rh: "/rh",
  workflow: "/workflow",
  compras: "/compras",
  contratos: "/contratos",
  financeiro: "/financeiro",
  patrimonio: "/inventario",
  governanca: "/governanca",
  integridade: "/integridade",
  transparencia: "/transparencia/admin",
  comunicacao: "/ascom",
  programas: "/programas",
  gestores_escolares: "/cadastrogestores/admin",
  federacoes: "/admin/federacoes",
};

export function ModuleSwitcher() {
  const location = useLocation();
  const { modulosAutorizados, isSuperAdmin, role } = useModulosUsuario();

  // Determinar módulos disponíveis
  const availableModules = isSuperAdmin || role === 'admin'
    ? MODULES_CONFIG
    : MODULES_CONFIG.filter(m => modulosAutorizados.includes(m.codigo));

  // Se só tem 1 módulo, não mostrar
  if (availableModules.length <= 1) return null;

  // Verificar qual módulo está ativo
  const isModuleActive = (modulo: Modulo) => {
    const route = MODULE_ROUTES[modulo];
    return location.pathname === route || location.pathname.startsWith(route + '/');
  };

  return (
    <div className="flex flex-col gap-1 py-2">
      {availableModules.map((module) => {
        const Icon = module.icone;
        const isActive = isModuleActive(module.codigo);
        const route = MODULE_ROUTES[module.codigo];

        return (
          <Tooltip key={module.codigo}>
            <TooltipTrigger asChild>
              <Link
                to={route}
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-lg transition-all",
                  "hover:bg-accent hover:text-accent-foreground",
                  isActive && "bg-primary text-primary-foreground shadow-sm"
                )}
              >
                <Icon className="h-5 w-5" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              <p className="font-medium">{module.nome}</p>
              <p className="text-xs text-muted-foreground">{module.descricao}</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
