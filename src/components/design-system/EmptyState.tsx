import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  titulo: React.ReactNode;
  descricao?: React.ReactNode;
  icone?: LucideIcon;
  /** Próximo passo para sair do vazio (ex.: botão "Cadastrar"). */
  acao?: React.ReactNode;
  className?: string;
}

/** Estado vazio padrão: diz o que aconteceu e qual o próximo passo. */
export function EmptyState({ titulo, descricao, icone: Icone = Inbox, acao, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 px-4 py-10 text-center", className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icone className="h-6 w-6" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="text-h3 text-foreground">{titulo}</p>
        {descricao && <p className="text-body text-muted-foreground max-w-sm">{descricao}</p>}
      </div>
      {acao}
    </div>
  );
}
