// ============================================
// COMPONENTE DE INDICADOR DE STATUS DA FOLHA
// ============================================

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Lock, Unlock, ClipboardCheck, FileCheck, History, Loader2 } from 'lucide-react';
import { STATUS_FOLHA_LABELS, STATUS_FOLHA_COLORS, type StatusFolha } from '@/types/folha';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StatusFolhaIndicatorProps {
  status: StatusFolha;
  fechadoEm?: string | null;
  fechadoPor?: string | null;
  reabertoEm?: string | null;
  conferidoEm?: string | null;
  onHistoricoClick?: () => void;
  showDetails?: boolean;
}

export function StatusFolhaIndicator({
  status,
  fechadoEm,
  reabertoEm,
  conferidoEm,
  onHistoricoClick,
  showDetails = false,
}: StatusFolhaIndicatorProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'fechada':
        return <Lock className="h-4 w-4" />;
      case 'reaberta':
        return <Unlock className="h-4 w-4" />;
      case 'processando':
        return <ClipboardCheck className="h-4 w-4" />;
      case 'aberta':
        return <FileCheck className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    return format(new Date(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const getTooltipContent = () => {
    switch (status) {
      case 'fechada':
        return fechadoEm ? `Fechada em ${formatDate(fechadoEm)}` : 'Folha fechada';
      case 'reaberta':
        return reabertoEm ? `Reaberta em ${formatDate(reabertoEm)}` : 'Folha reaberta';
      case 'processando':
        return conferidoEm ? `Em conferência desde ${formatDate(conferidoEm)}` : 'Em conferência';
      default:
        return STATUS_FOLHA_LABELS[status];
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            className={`${STATUS_FOLHA_COLORS[status]} flex items-center gap-1.5 cursor-default`}
          >
            {getStatusIcon()}
            {STATUS_FOLHA_LABELS[status]}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>{getTooltipContent()}</TooltipContent>
      </Tooltip>

      {showDetails && onHistoricoClick && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onHistoricoClick}
          className="h-7 px-2"
        >
          <History className="h-3.5 w-3.5 mr-1" />
          Histórico
        </Button>
      )}
    </div>
  );
}

// ============================================
// PAINEL DE AÇÕES DE FECHAMENTO
// ============================================

interface AcoesFechamentoFolhaProps {
  folhaId: string;
  status: StatusFolha;
  podeFechar: boolean;
  podeReabrir: boolean;
  onFechar: () => void;
  onReabrir: () => void;
  onEnviarConferencia: () => void;
  isEnviando?: boolean;
}

export function AcoesFechamentoFolha({
  status,
  podeFechar,
  podeReabrir,
  onFechar,
  onReabrir,
  onEnviarConferencia,
  isEnviando,
}: AcoesFechamentoFolhaProps) {
  // Determinar ações disponíveis por status
  const podeEnviarConferencia = ['aberta', 'reaberta'].includes(status) && podeFechar;
  const podeFazerFechamento = ['processando', 'aberta'].includes(status) && podeFechar;
  const podeFazerReabertura = status === 'fechada' && podeReabrir;

  if (!podeEnviarConferencia && !podeFazerFechamento && !podeFazerReabertura) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {podeEnviarConferencia && (
        <Button
          variant="outline"
          size="sm"
          onClick={onEnviarConferencia}
          disabled={isEnviando}
        >
          {isEnviando ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ClipboardCheck className="mr-2 h-4 w-4" />
          )}
          Enviar para Conferência
        </Button>
      )}

      {podeFazerFechamento && (
        <Button
          variant="destructive"
          size="sm"
          onClick={onFechar}
        >
          <Lock className="mr-2 h-4 w-4" />
          Fechar Folha
        </Button>
      )}

      {podeFazerReabertura && (
        <Button
          variant="outline"
          size="sm"
          onClick={onReabrir}
          className="border-purple-300 text-purple-600 hover:bg-purple-50"
        >
          <Unlock className="mr-2 h-4 w-4" />
          Reabrir Folha
        </Button>
      )}
    </div>
  );
}
