import * as React from "react";
import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

export interface Migalha {
  rotulo: string;
  /** Sem `href` = página atual (último item). */
  href?: string;
}

export interface PageHeaderProps {
  titulo: React.ReactNode;
  descricao?: React.ReactNode;
  migalhas?: Migalha[];
  /** Selo de situação ao lado do título (ex.: `<StatusBadge>`). */
  status?: React.ReactNode;
  /** Ações da página, alinhadas à direita. Uma única ação primária por tela. */
  acoes?: React.ReactNode;
  className?: string;
}

/**
 * Cabeçalho padrão de página do sistema: migalhas, título (h1), situação,
 * descrição curta e ações. Ver docs/GUIA_FRONTEND.md (Design System).
 */
export function PageHeader({ titulo, descricao, migalhas, status, acoes, className }: PageHeaderProps) {
  return (
    <header className={cn("space-y-2 pb-4", className)}>
      {migalhas && migalhas.length > 0 && (
        <Breadcrumb>
          <BreadcrumbList>
            {migalhas.map((m, i) => (
              <React.Fragment key={`${m.rotulo}-${i}`}>
                {i > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {m.href ? (
                    <BreadcrumbLink asChild>
                      <Link to={m.href}>{m.rotulo}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{m.rotulo}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-h1 text-foreground text-balance">{titulo}</h1>
            {status}
          </div>
          {descricao && <p className="text-body text-muted-foreground max-w-prose">{descricao}</p>}
        </div>
        {acoes && <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">{acoes}</div>}
      </div>
    </header>
  );
}
