/**
 * Aviso de que a lista bateu o limite de linhas por consulta (nada aparece quando está abaixo do limite).
 */
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LIMITE_LINHAS } from '@/hooks/useAcompanhamentoProcessos';

interface AvisoLimiteLinhasProps {
  total: number;
  /** Complemento da frase, ex.: "Os resumos acima consideram só essas linhas." */
  complemento?: string;
}

export function AvisoLimiteLinhas({ total, complemento }: AvisoLimiteLinhasProps) {
  if (total < LIMITE_LINHAS) return null;
  return (
    <Alert>
      <AlertCircle className="h-4 w-4" aria-hidden="true" />
      <AlertDescription>
        Mostrando os primeiros {LIMITE_LINHAS.toLocaleString('pt-BR')} processos; refine a busca ou os filtros.
        {complemento ? ` ${complemento}` : ''}
      </AlertDescription>
    </Alert>
  );
}
