/**
 * Badge de aviso de mandato expirado
 * 
 * Exibe um alerta visual quando o mandato da federação está expirado.
 * Usado tanto na listagem quanto nos detalhes da federação.
 */

import { AlertTriangle } from 'lucide-react';
import { isPast, parseISO, isValid, differenceInDays } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface MandatoExpiradoBadgeProps {
  mandatoFim: string;
  variant?: 'badge' | 'alert' | 'inline';
  className?: string;
}

/**
 * Verifica se o mandato está expirado
 */
export function isMandatoExpirado(mandatoFim: string | null | undefined): boolean {
  if (!mandatoFim) return false;
  try {
    const data = parseISO(mandatoFim);
    return isValid(data) && isPast(data);
  } catch {
    return false;
  }
}

/**
 * Retorna quantos dias o mandato está expirado
 */
export function diasMandatoExpirado(mandatoFim: string | null | undefined): number {
  if (!mandatoFim) return 0;
  try {
    const data = parseISO(mandatoFim);
    if (!isValid(data) || !isPast(data)) return 0;
    return differenceInDays(new Date(), data);
  } catch {
    return 0;
  }
}

export function MandatoExpiradoBadge({ 
  mandatoFim, 
  variant = 'badge',
  className 
}: MandatoExpiradoBadgeProps) {
  if (!isMandatoExpirado(mandatoFim)) {
    return null;
  }

  const diasExpirado = diasMandatoExpirado(mandatoFim);

  if (variant === 'alert') {
    return (
      <Alert variant="destructive" className={cn("border-destructive/50 bg-destructive/10", className)}>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Mandato Expirado</AlertTitle>
        <AlertDescription>
          O mandato desta federação expirou há {diasExpirado} dia{diasExpirado !== 1 ? 's' : ''}.
          É necessário regularizar a situação junto à entidade.
        </AlertDescription>
      </Alert>
    );
  }

  if (variant === 'inline') {
    return (
      <span className={cn(
        "inline-flex items-center gap-1 text-destructive text-sm font-medium",
        className
      )}>
        <AlertTriangle className="h-3.5 w-3.5" />
        Mandato expirado há {diasExpirado} dia{diasExpirado !== 1 ? 's' : ''}
      </span>
    );
  }

  // variant === 'badge' (default)
  return (
    <Badge 
      variant="destructive" 
      className={cn("gap-1 animate-pulse", className)}
    >
      <AlertTriangle className="h-3 w-3" />
      Mandato Expirado
    </Badge>
  );
}
