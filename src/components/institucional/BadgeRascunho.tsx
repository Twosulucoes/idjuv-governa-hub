import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BadgeRascunhoProps {
  className?: string;
  showTooltip?: boolean;
}

/**
 * Badge visual para indicar que um conteúdo é provisório/rascunho
 * Exibido APENAS no painel administrativo
 */
export const BadgeRascunho = React.forwardRef<
  HTMLSpanElement,
  BadgeRascunhoProps
>(({ className, showTooltip = true }, ref) => {
  const badge = (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
        "bg-warning/10 text-warning border border-warning/30",
        className
      )}
    >
      <AlertCircle className="w-3 h-3" />
      Rascunho
    </span>
  );

  if (!showTooltip) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-xs">
            <strong>Conteúdo provisório</strong> — sujeito a aprovação institucional.
            Este texto não reflete posição oficial do órgão.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

BadgeRascunho.displayName = "BadgeRascunho";
