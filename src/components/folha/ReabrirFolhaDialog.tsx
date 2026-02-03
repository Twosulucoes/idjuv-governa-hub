// ============================================
// DIALOG PARA REABRIR FOLHA DE PAGAMENTO
// ============================================

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Unlock, Loader2, ShieldAlert } from 'lucide-react';
import { useReabrirFolha } from '@/hooks/useFechamentoFolha';
import { MESES } from '@/types/folha';

interface ReabrirFolhaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folhaId: string;
  competenciaAno: number;
  competenciaMes: number;
}

export function ReabrirFolhaDialog({
  open,
  onOpenChange,
  folhaId,
  competenciaAno,
  competenciaMes,
}: ReabrirFolhaDialogProps) {
  const [justificativa, setJustificativa] = useState('');
  const [erro, setErro] = useState('');
  const reabrir = useReabrirFolha();

  const handleReabrir = async () => {
    if (!justificativa.trim()) {
      setErro('Justificativa é obrigatória para reabrir uma folha');
      return;
    }
    
    setErro('');
    await reabrir.mutateAsync({
      folhaId,
      justificativa: justificativa.trim(),
    });
    setJustificativa('');
    onOpenChange(false);
  };

  const competenciaLabel = `${MESES[competenciaMes - 1]}/${competenciaAno}`;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
              <ShieldAlert className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <AlertDialogTitle>Reabrir Folha de Pagamento</AlertDialogTitle>
              <AlertDialogDescription className="mt-1">
                Competência: <strong>{competenciaLabel}</strong>
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3 rounded-lg border border-purple-300 bg-purple-50 dark:bg-purple-900/20 p-3">
            <ShieldAlert className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-purple-700 dark:text-purple-300">Ação de Super Administrador</p>
              <p className="mt-1 text-muted-foreground">
                Esta ação será registrada no log de auditoria e requer justificativa detalhada.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="justificativa-reabertura">
              Justificativa <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="justificativa-reabertura"
              placeholder="Informe o motivo detalhado da reabertura..."
              value={justificativa}
              onChange={(e) => {
                setJustificativa(e.target.value);
                if (e.target.value.trim()) setErro('');
              }}
              rows={4}
              className={erro ? 'border-destructive' : ''}
            />
            {erro && <p className="text-sm text-destructive">{erro}</p>}
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={reabrir.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReabrir}
            disabled={reabrir.isPending || !justificativa.trim()}
            className="bg-purple-600 text-white hover:bg-purple-700"
          >
            {reabrir.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reabrindo...
              </>
            ) : (
              <>
                <Unlock className="mr-2 h-4 w-4" />
                Confirmar Reabertura
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
