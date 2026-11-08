// ============================================
// DIALOG PARA FECHAR FOLHA DE PAGAMENTO
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
import { Lock, Loader2, AlertTriangle } from 'lucide-react';
import { useFecharFolha, useInconsistenciasFolha } from '@/hooks/useFechamentoFolha';
import { JUSTIFICATIVA_MINIMA_FECHAMENTO, ehBloqueante, rotuloInconsistencia } from '@/lib/folhaInconsistencias';
import { MESES } from '@/types/folha';

interface FecharFolhaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folhaId: string;
  competenciaAno: number;
  competenciaMes: number;
}

export function FecharFolhaDialog({
  open,
  onOpenChange,
  folhaId,
  competenciaAno,
  competenciaMes,
}: FecharFolhaDialogProps) {
  const [justificativa, setJustificativa] = useState('');
  const fechar = useFecharFolha();
  // Ficha com inconsistência: de tributo não fecha; as demais só com justificativa (regra de fechar_folha)
  const { data: inconsistentes = [], isLoading: carregandoInconsistencias } = useInconsistenciasFolha(folhaId, open);
  const bloqueadas = inconsistentes.filter((f) => f.bloqueante);
  const exigeJustificativa = inconsistentes.length > 0;
  const justificativaCurta = exigeJustificativa && justificativa.trim().length < JUSTIFICATIVA_MINIMA_FECHAMENTO;
  const impedido = carregandoInconsistencias || bloqueadas.length > 0 || justificativaCurta;

  const handleFechar = async (e: React.MouseEvent) => {
    // o AlertDialogAction fecha o diálogo sozinho: só fecha depois de a folha fechar de fato
    e.preventDefault();
    if (impedido) return;
    await fechar.mutateAsync({
      folhaId,
      justificativa: justificativa.trim() || undefined,
    });
    setJustificativa('');
    onOpenChange(false);
  };

  const competenciaLabel = `${MESES[competenciaMes - 1]}/${competenciaAno}`;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <Lock className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <AlertDialogTitle>Fechar Folha de Pagamento</AlertDialogTitle>
              <AlertDialogDescription className="mt-1">
                Competência: <strong>{competenciaLabel}</strong>
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3 rounded-lg border border-warning/50 bg-warning/10 p-3">
            <AlertTriangle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-warning">Atenção: Ação Irreversível</p>
              <ul className="mt-1 list-disc list-inside text-muted-foreground space-y-1">
                <li>Contracheques ficarão imutáveis</li>
                <li>Rubricas não poderão ser editadas</li>
                <li>Reabertura apenas por super administrador</li>
              </ul>
            </div>
          </div>

          {inconsistentes.length > 0 && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm" role="alert">
              <p className="font-medium text-destructive">
                {bloqueadas.length > 0
                  ? `Não dá para fechar: ${bloqueadas.length} ficha(s) com tributo calculado sem tabela ou alíquota. Cadastre em Configurações da Folha e processe de novo.`
                  : `${inconsistentes.length} ficha(s) com inconsistência. Corrija e processe de novo, ou justifique para fechar assim mesmo.`}
              </p>
              <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-muted-foreground">
                {inconsistentes.map((f) => (
                  <li key={f.fichaId}>
                    <span className="font-medium text-foreground">{f.servidor}</span>:{' '}
                    {f.codigos.map((c) => (ehBloqueante(c) ? `${rotuloInconsistencia(c)} (impede)` : rotuloInconsistencia(c))).join('; ')}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="justificativa">
              {exigeJustificativa ? `Justificativa (obrigatória, pelo menos ${JUSTIFICATIVA_MINIMA_FECHAMENTO} caracteres)` : 'Justificativa (opcional)'}
            </Label>
            <Textarea
              id="justificativa"
              placeholder="Informe o motivo do fechamento..."
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={fechar.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleFechar}
            disabled={fechar.isPending || impedido}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {fechar.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fechando...
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Confirmar Fechamento
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
