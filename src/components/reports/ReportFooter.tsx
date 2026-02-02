/**
 * Rodapé Institucional para Relatórios (React)
 * 
 * Componente reutilizável para visualização em tela de relatórios
 * que serão posteriormente exportados para PDF.
 */

import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ReportFooterProps {
  /** Nome do usuário que gerou o relatório */
  usuario?: string | null;
  /** Data de geração (padrão: agora) */
  dataGeracao?: Date;
  /** Número da página atual */
  paginaAtual?: number;
  /** Total de páginas */
  totalPaginas?: number;
  /** Mostrar paginação */
  mostrarPaginacao?: boolean;
  /** Classes adicionais */
  className?: string;
}

export function ReportFooter({
  usuario,
  dataGeracao = new Date(),
  paginaAtual,
  totalPaginas,
  mostrarPaginacao = false,
  className,
}: ReportFooterProps) {
  const dataFormatada = format(dataGeracao, "dd/MM/yyyy 'às' HH:mm", {
    locale: ptBR,
  });

  return (
    <footer
      className={cn(
        "print:fixed print:bottom-0 print:left-0 print:right-0",
        "mt-auto pt-4 border-t border-border/50",
        className
      )}
    >
      <div className="flex items-center justify-between text-xs text-muted-foreground px-4 py-2">
        {/* Sistema */}
        <span>Sistema IDJuv</span>

        {/* Data e Usuário */}
        <span>
          Gerado em {dataFormatada}
          {usuario && ` | Usuário: ${usuario}`}
        </span>

        {/* Paginação */}
        {mostrarPaginacao && paginaAtual && totalPaginas && (
          <span>
            Página {paginaAtual} de {totalPaginas}
          </span>
        )}
      </div>

      {/* Aviso de autenticidade */}
      <p className="text-center text-[10px] text-muted-foreground/70 pb-2">
        Documento gerado eletronicamente pelo Sistema de Governança Digital
      </p>
    </footer>
  );
}
