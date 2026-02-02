/**
 * Cabeçalho Institucional para Relatórios (React)
 * 
 * Componente reutilizável para visualização em tela de relatórios
 * que serão posteriormente exportados para PDF.
 */

import { cn } from "@/lib/utils";
import logoGoverno from "@/assets/logo-governo-roraima.jpg";
import logoIdjuv from "@/assets/logo-idjuv-oficial.png";

interface ReportHeaderProps {
  /** Título principal do documento (obrigatório) */
  titulo: string;
  /** Subtítulo opcional */
  subtitulo?: string;
  /** Número do documento (opcional) */
  numero?: string;
  /** Variante visual */
  variante?: "escuro" | "claro";
  /** Mostrar logomarcas */
  mostrarLogos?: boolean;
  /** Classes adicionais */
  className?: string;
}

export function ReportHeader({
  titulo,
  subtitulo,
  numero,
  variante = "escuro",
  mostrarLogos = true,
  className,
}: ReportHeaderProps) {
  const isEscuro = variante === "escuro";

  return (
    <header className={cn("print:break-inside-avoid", className)}>
      {/* Cabeçalho Institucional */}
      <div
        className={cn(
          "relative flex items-center justify-between px-4 py-3",
          isEscuro
            ? "bg-primary text-primary-foreground"
            : "bg-background border-b border-border"
        )}
      >
        {/* Logo Governo (esquerda) */}
        {mostrarLogos && (
          <div className="flex-shrink-0">
            <img
              src={logoGoverno}
              alt="Governo do Estado de Roraima"
              className="h-10 w-auto object-contain"
            />
          </div>
        )}

        {/* Textos Centrais */}
        <div className="flex-1 text-center px-4">
          <p
            className={cn(
              "text-sm font-bold",
              isEscuro ? "text-white" : "text-primary"
            )}
          >
            GOVERNO DO ESTADO DE RORAIMA
          </p>
          <p
            className={cn(
              "text-xs",
              isEscuro ? "text-white/90" : "text-muted-foreground"
            )}
          >
            Instituto de Desporto, Juventude e Lazer do Estado de Roraima
          </p>
        </div>

        {/* Logo IDJuv (direita) */}
        {mostrarLogos && (
          <div className="flex-shrink-0">
            <img
              src={logoIdjuv}
              alt="IDJuv"
              className="h-10 w-auto object-contain"
            />
          </div>
        )}

        {/* Linha dourada inferior */}
        {isEscuro && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B4914B]" />
        )}
      </div>

      {/* Bloco de Título */}
      <div className="text-center py-4 border-b border-border/50">
        <h1
          className={cn(
            "text-lg font-bold uppercase tracking-wide",
            isEscuro ? "text-primary" : "text-foreground"
          )}
        >
          {titulo}
        </h1>

        {subtitulo && (
          <p className="text-sm text-muted-foreground mt-1">{subtitulo}</p>
        )}

        {numero && (
          <p className="text-sm font-medium text-foreground mt-1">
            Nº {numero}
          </p>
        )}
      </div>
    </header>
  );
}
