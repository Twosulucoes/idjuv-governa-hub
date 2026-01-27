import * as React from "react";
import { cn } from "@/lib/utils";
import { Lock, FileText } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DadoOficialDisplayProps {
  label?: string;
  valor: string;
  leiReferencia?: string | null;
  bloqueado?: boolean;
  className?: string;
  variant?: "inline" | "block" | "card";
  showLockIcon?: boolean;
}

/**
 * Componente para exibir dados oficiais com indicação visual de status
 * - Dados bloqueados mostram ícone de cadeado
 * - Referência legal aparece como tooltip
 */
export const DadoOficialDisplay = React.forwardRef<
  HTMLDivElement,
  DadoOficialDisplayProps
>(({
  label,
  valor,
  leiReferencia,
  bloqueado = true,
  className,
  variant = "inline",
  showLockIcon = false,
}, ref) => {
  
  const content = (
    <span className="inline-flex items-center gap-1.5">
      {valor}
      {showLockIcon && bloqueado && (
        <Lock className="w-3 h-3 text-muted-foreground/50" />
      )}
      {leiReferencia && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <FileText className="w-3 h-3 text-primary/60 cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Base legal: {leiReferencia}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </span>
  );

  if (variant === "block") {
    return (
      <div ref={ref} className={cn("space-y-1", className)}>
        {label && (
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </p>
        )}
        <p className="text-foreground">{content}</p>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div 
        ref={ref} 
        className={cn(
          "bg-muted rounded-lg p-4 transition-colors",
          className
        )}
      >
        {label && (
          <h3 className="font-semibold mb-2 text-sm">{label}</h3>
        )}
        <p className="text-sm text-muted-foreground">{content}</p>
      </div>
    );
  }

  // variant === "inline"
  return (
    <span ref={ref} className={cn("", className)}>
      {label && <span className="font-medium mr-1">{label}:</span>}
      {content}
    </span>
  );
});

DadoOficialDisplay.displayName = "DadoOficialDisplay";
