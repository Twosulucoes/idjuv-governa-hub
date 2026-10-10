import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText, Loader2 } from "lucide-react";

export type FormatoExportacao = "pdf" | "xlsx";

interface BotoesExportarProps {
  onExportar: (formato: FormatoExportacao) => void;
  /** Formato em geração no momento (desabilita ambos e mostra o spinner no ativo). */
  gerando: FormatoExportacao | null;
  /** Sem dados (ou filtros inválidos): ambos ficam desabilitados. */
  desabilitado?: boolean;
}

/** Par de botões PDF/XLSX dos cards de relatório, com estado de carregamento acessível. */
export function BotoesExportar({ onExportar, gerando, desabilitado }: BotoesExportarProps) {
  const bloqueado = desabilitado || gerando !== null;

  return (
    <div className="grid grid-cols-2 gap-2">
      <Button
        className="w-full"
        onClick={() => onExportar("pdf")}
        disabled={bloqueado}
        aria-busy={gerando === "pdf" || undefined}
      >
        {gerando === "pdf" ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
        ) : (
          <FileText className="h-4 w-4 mr-2" aria-hidden="true" />
        )}
        Gerar PDF
      </Button>
      <Button
        className="w-full"
        variant="outline"
        onClick={() => onExportar("xlsx")}
        disabled={bloqueado}
        aria-busy={gerando === "xlsx" || undefined}
      >
        {gerando === "xlsx" ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
        ) : (
          <FileSpreadsheet className="h-4 w-4 mr-2" aria-hidden="true" />
        )}
        Exportar XLSX
      </Button>
    </div>
  );
}
