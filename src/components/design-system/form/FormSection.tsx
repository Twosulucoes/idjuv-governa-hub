import * as React from "react";
import { cn } from "@/lib/utils";

export interface FormSectionProps {
  titulo: React.ReactNode;
  descricao?: React.ReactNode;
  children: React.ReactNode;
  /** Colunas dos campos a partir de `md` (no celular é sempre 1). */
  colunas?: 1 | 2 | 3;
  className?: string;
}

const GRADE = { 1: "", 2: "md:grid-cols-2", 3: "md:grid-cols-2 lg:grid-cols-3" } as const;

/** Agrupa campos relacionados sob um título, como `fieldset` acessível. */
export function FormSection({ titulo, descricao, children, colunas = 2, className }: FormSectionProps) {
  const id = React.useId();
  return (
    <fieldset
      aria-labelledby={`${id}-titulo`}
      aria-describedby={descricao ? `${id}-descricao` : undefined}
      className={cn("space-y-4 border-b border-border pb-6 last:border-0 last:pb-0", className)}
    >
      <legend id={`${id}-titulo`} className="text-h3 text-foreground">
        {titulo}
      </legend>
      {descricao && (
        <p id={`${id}-descricao`} className="!mt-1 text-body text-muted-foreground">
          {descricao}
        </p>
      )}
      <div className={cn("grid grid-cols-1 gap-4", GRADE[colunas])}>{children}</div>
    </fieldset>
  );
}
