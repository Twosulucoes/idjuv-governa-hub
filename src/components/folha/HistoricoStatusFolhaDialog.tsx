// ============================================
// DIALOG PARA VISUALIZAR HISTÓRICO DE STATUS
// ============================================

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Loader2, ArrowRight, User, Clock, FileText } from 'lucide-react';
import { useHistoricoStatusFolha } from '@/hooks/useFechamentoFolha';
import { STATUS_FOLHA_LABELS, STATUS_FOLHA_COLORS, MESES, type StatusFolha } from '@/types/folha';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HistoricoStatusFolhaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folhaId: string;
  competenciaAno: number;
  competenciaMes: number;
}

export function HistoricoStatusFolhaDialog({
  open,
  onOpenChange,
  folhaId,
  competenciaAno,
  competenciaMes,
}: HistoricoStatusFolhaDialogProps) {
  const { data: historico, isLoading } = useHistoricoStatusFolha(open ? folhaId : undefined);

  const competenciaLabel = `${MESES[competenciaMes - 1]}/${competenciaAno}`;

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="outline">-</Badge>;
    const statusKey = status as StatusFolha;
    return (
      <Badge className={STATUS_FOLHA_COLORS[statusKey] || 'bg-gray-100 text-gray-800'}>
        {STATUS_FOLHA_LABELS[statusKey] || status}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <History className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Histórico de Status</DialogTitle>
              <DialogDescription>
                Folha de {competenciaLabel}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : historico?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma transição registrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {historico?.map((item, index) => (
                <div
                  key={item.id}
                  className="relative pl-6 pb-4 border-l-2 border-muted last:border-l-0"
                >
                  {/* Ponto na timeline */}
                  <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-background border-2 border-primary" />
                  
                  <div className="space-y-2">
                    {/* Status transition */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(item.status_anterior)}
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      {getStatusBadge(item.status_novo)}
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{formatDate(item.created_at)}</span>
                      </div>
                      {item.usuario_nome && (
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5" />
                          <span>{item.usuario_nome}</span>
                        </div>
                      )}
                    </div>

                    {/* Justificativa */}
                    {item.justificativa && (
                      <div className="mt-2 p-2 rounded-md bg-muted/50 text-sm">
                        <div className="flex items-start gap-2">
                          <FileText className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                          <p className="text-muted-foreground">{item.justificativa}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
