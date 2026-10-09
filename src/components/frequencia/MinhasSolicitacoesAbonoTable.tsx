/**
 * Lista das solicitações de abono do próprio servidor, com status e motivo de rejeição.
 */

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, FileText } from "lucide-react";
import { STATUS_SOLICITACAO_LABELS, type SolicitacaoAbono, type StatusSolicitacaoAbono } from "@/types/frequencia";
import { formatDateBR } from "@/lib/formatters";
import { formatarPeriodoAbono } from "@/lib/frequenciaFluxo";

const STATUS_BADGE_CLASSES: Record<StatusSolicitacaoAbono, string> = {
  pendente: "bg-warning/15 text-warning border-warning/30",
  aprovado_chefia: "bg-primary/15 text-primary border-primary/30",
  aprovado_rh: "bg-success/15 text-success border-success/30",
  aprovado: "bg-success/15 text-success border-success/30",
  rejeitado: "bg-destructive/15 text-destructive border-destructive/30",
  cancelado: "bg-muted text-muted-foreground",
};

export function StatusAbonoBadge({ status }: { status: StatusSolicitacaoAbono }) {
  return (
    <Badge variant="outline" className={STATUS_BADGE_CLASSES[status] ?? ""}>
      {STATUS_SOLICITACAO_LABELS[status] ?? status}
    </Badge>
  );
}

interface MinhasSolicitacoesAbonoTableProps {
  solicitacoes: SolicitacaoAbono[];
  isLoading?: boolean;
}

export function MinhasSolicitacoesAbonoTable({ solicitacoes, isLoading }: MinhasSolicitacoesAbonoTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (solicitacoes.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Você ainda não tem solicitações de abono.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Período</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Justificativa</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Enviada em</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {solicitacoes.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="whitespace-nowrap">{formatarPeriodoAbono(s)}</TableCell>
              <TableCell>{s.tipo_abono?.nome ?? "-"}</TableCell>
              <TableCell className="max-w-md">
                <p className="truncate" title={s.justificativa}>{s.justificativa}</p>
                {s.status === "rejeitado" && s.motivo_rejeicao && (
                  <p className="text-xs text-destructive mt-1">Motivo da rejeição: {s.motivo_rejeicao}</p>
                )}
              </TableCell>
              <TableCell>
                <StatusAbonoBadge status={s.status} />
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {s.created_at ? formatDateBR(s.created_at) : "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
