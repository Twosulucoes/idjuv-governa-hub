/**
 * SYSTEM CREDITS
 * 
 * Componente reutilizável de identidade da desenvolvedora e versionamento.
 * Deve ser usado em todos os layouts do sistema para padronização.
 * 
 * @version 1.0.0
 */

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const SYSTEM_VERSION = "1.4.0";
const DEVELOPER_NAME = "Two Soluções";
const DEVELOPER_EMAIL = "solucoestwo@gmail.com";
const DEVELOPER_LOGO = "/images/logo-two-icon.png";

interface SystemCreditsProps {
  /** "light" para fundos claros, "dark" para fundos escuros (ex: footer principal) */
  variant?: "light" | "dark";
  /** Exibição compacta (apenas uma linha) para barras laterais ou módulos */
  compact?: boolean;
  className?: string;
}

export const SystemCredits = forwardRef<HTMLDivElement, SystemCreditsProps>(
  ({ variant = "light", compact = false, className }, ref) => {
    if (compact) {
      return (
        <div
          ref={ref}
          className={cn(
            "flex items-center justify-center gap-1.5 py-2 px-3",
            className
          )}
        >
          <img
            src={DEVELOPER_LOGO}
            alt={DEVELOPER_NAME}
            className="h-3.5 w-auto opacity-50"
          />
          <span className="text-[10px] text-muted-foreground/60">
            v{SYSTEM_VERSION}
          </span>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center gap-2 py-3 px-4",
          variant === "dark"
            ? "border-t border-primary-foreground/5"
            : "border-t border-border/50",
          className
        )}
      >
        <img
          src={DEVELOPER_LOGO}
          alt={DEVELOPER_NAME}
          className={cn(
            "h-4 w-auto",
            variant === "dark" ? "opacity-60" : "opacity-50"
          )}
        />
        <p
          className={cn(
            "text-[10px]",
            variant === "dark"
              ? "text-primary-foreground/40 dark:text-muted-foreground/50"
              : "text-muted-foreground/60"
          )}
        >
          Desenvolvido por {DEVELOPER_NAME} · v{SYSTEM_VERSION} · {DEVELOPER_EMAIL}
        </p>
      </div>
    );
  }
);

SystemCredits.displayName = "SystemCredits";
