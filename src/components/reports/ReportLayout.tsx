/**
 * Layout Institucional para Relatórios (React)
 * 
 * Componente principal que envolve QUALQUER relatório do sistema,
 * garantindo padronização visual e estrutural.
 * 
 * USO OBRIGATÓRIO: Todo relatório deve usar este componente.
 * 
 * @example
 * <ReportLayout
 *   title="Relatório de Processos Administrativos"
 *   subtitle="Workflow – Processos em Tramitação"
 * >
 *   {conteudoDoRelatorio}
 * </ReportLayout>
 */

import { cn } from "@/lib/utils";
import { ReportHeader } from "./ReportHeader";
import { ReportFooter } from "./ReportFooter";
import { useAuth } from "@/contexts/AuthContext";

interface ReportLayoutProps {
  /** Título principal do documento (obrigatório) */
  title: string;
  /** Subtítulo opcional */
  subtitle?: string;
  /** Número do documento (opcional) */
  numero?: string;
  /** Variante visual do cabeçalho */
  variante?: "escuro" | "claro";
  /** Mostrar logomarcas no cabeçalho */
  showLogo?: boolean;
  /** Mostrar rodapé com metadados */
  showFooter?: boolean;
  /** Mostrar paginação */
  showPagination?: boolean;
  /** Conteúdo do relatório */
  children: React.ReactNode;
  /** Classes adicionais para o container */
  className?: string;
  /** Classes adicionais para o conteúdo */
  contentClassName?: string;
}

export function ReportLayout({
  title,
  subtitle,
  numero,
  variante = "escuro",
  showLogo = true,
  showFooter = true,
  showPagination = false,
  children,
  className,
  contentClassName,
}: ReportLayoutProps) {
  const { user } = useAuth();
  const nomeUsuario = user?.email?.split("@")[0] || null;

  return (
    <div
      className={cn(
        "min-h-screen bg-background flex flex-col",
        // Estilos de impressão
        "print:bg-white print:min-h-0",
        className
      )}
    >
      {/* Cabeçalho Institucional */}
      <ReportHeader
        titulo={title}
        subtitulo={subtitle}
        numero={numero}
        variante={variante}
        mostrarLogos={showLogo}
      />

      {/* Corpo do Relatório */}
      <main
        className={cn(
          "flex-1 p-4 sm:p-6",
          // Margens de impressão (2cm laterais, 2.5cm superior/inferior)
          "print:p-0 print:mx-[20mm] print:my-[10mm]",
          contentClassName
        )}
      >
        {children}
      </main>

      {/* Rodapé Institucional */}
      {showFooter && (
        <ReportFooter
          usuario={nomeUsuario}
          mostrarPaginacao={showPagination}
        />
      )}
    </div>
  );
}

/**
 * Container para seções do relatório
 */
export function ReportSection({
  title,
  numero,
  children,
  className,
}: {
  title: string;
  numero?: number;
  children: React.ReactNode;
  className?: string;
}) {
  const tituloCompleto = numero ? `${numero}. ${title}` : title;

  return (
    <section className={cn("mb-6", className)}>
      <h2 className="bg-secondary text-secondary-foreground px-4 py-2 font-semibold text-sm uppercase rounded-sm mb-3">
        {tituloCompleto}
      </h2>
      <div className="px-2">{children}</div>
    </section>
  );
}

/**
 * Container para título de seção simples (sem fundo)
 */
export function ReportSectionTitle({
  title,
  numero,
  className,
}: {
  title: string;
  numero?: number;
  className?: string;
}) {
  const tituloCompleto = numero ? `${numero}. ${title}` : title;

  return (
    <h3
      className={cn(
        "text-primary font-semibold text-sm border-b border-primary/20 pb-1 mb-3",
        className
      )}
    >
      {tituloCompleto}
    </h3>
  );
}

/**
 * Campo de dados do relatório (label + valor)
 */
export function ReportField({
  label,
  value,
  inline = false,
  className,
}: {
  label: string;
  value: string | number | null | undefined;
  inline?: boolean;
  className?: string;
}) {
  if (inline) {
    return (
      <div className={cn("flex items-baseline gap-2 text-sm", className)}>
        <span className="text-muted-foreground font-medium">{label}:</span>
        <span className="text-foreground">{value || "-"}</span>
      </div>
    );
  }

  return (
    <div className={cn("mb-2", className)}>
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <p className="text-sm text-foreground">{value || "-"}</p>
    </div>
  );
}

/**
 * Grid de campos para layout organizado
 */
export function ReportFieldGrid({
  children,
  cols = 2,
  className,
}: {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4;
  className?: string;
}) {
  const colsClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4", colsClass[cols], className)}>
      {children}
    </div>
  );
}
