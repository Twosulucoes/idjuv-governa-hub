// ============================================
// COMPONENTE PARA TOGGLE RÁPIDO DE MÓDULOS
// ============================================
// Exibe chips clicáveis para ativar/desativar módulos rapidamente

import { Badge } from '@/components/ui/badge';
import { Check, Plus, Loader2 } from 'lucide-react';
import { MODULES_CONFIG, type Modulo, getModuloCorClass } from '@/shared/config/modules.config';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface QuickModuloToggleProps {
  modulosAtivos: Modulo[];
  onToggle: (modulo: Modulo, temAtualmente: boolean) => void;
  disabled?: boolean;
  isSuperAdmin?: boolean;
}

export function QuickModuloToggle({ 
  modulosAtivos, 
  onToggle, 
  disabled = false,
  isSuperAdmin = false 
}: QuickModuloToggleProps) {
  if (isSuperAdmin) {
    return (
      <Badge className="bg-primary/10 text-primary border-primary/30">
        Acesso Total (Super Admin)
      </Badge>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-1.5">
        {MODULES_CONFIG.map((config) => {
          const ativo = modulosAtivos.includes(config.codigo);
          const Icon = config.icone;
          const corClass = getModuloCorClass(config.cor);

          return (
            <Tooltip key={config.codigo}>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!disabled) onToggle(config.codigo, ativo);
                  }}
                  disabled={disabled}
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all",
                    "border cursor-pointer hover:scale-105",
                    ativo 
                      ? cn(corClass, "border-transparent") 
                      : "bg-muted/30 text-muted-foreground border-dashed border-muted-foreground/30 hover:border-primary hover:text-primary",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {disabled ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : ativo ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Plus className="h-3 w-3" />
                  )}
                  <span className="hidden sm:inline">{config.nome}</span>
                  <Icon className="h-3 w-3 sm:hidden" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{config.nome}</p>
                <p className="text-xs text-muted-foreground">{config.descricao}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
