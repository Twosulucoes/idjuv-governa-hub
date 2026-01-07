import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeInstitucionalProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "accent" | "highlight";
  className?: string;
}

export const BadgeInstitucional = React.forwardRef<
  HTMLSpanElement, 
  BadgeInstitucionalProps
>(({ children, variant = "primary", className }, ref) => {
  const variantClasses = {
    primary: "bg-primary/10 text-primary border-primary/20",
    secondary: "bg-secondary/10 text-secondary border-secondary/20",
    accent: "bg-accent/10 text-accent border-accent/20",
    highlight: "bg-highlight/10 text-highlight-foreground border-highlight/30",
  };

  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
});

BadgeInstitucional.displayName = "BadgeInstitucional";
