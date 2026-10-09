/**
 * Confirmação do fechamento da competência: só libera quando não há abono em
 * aberto e todos os servidores ativos estão consolidados pelo RH
 * (regra em @/lib/frequenciaFluxo.podeFecharCompetencia).
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { MESES } from "@/types/folha";
import { STATUS_FECHAMENTO_LABELS } from "@/types/frequencia";
import { podeFecharCompetencia, type SituacaoFechamentoCompetencia } from "@/lib/frequenciaFluxo";

interface FecharCompetenciaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ano: number;
  mes: number;
  situacao: SituacaoFechamentoCompetencia;
  fechando?: boolean;
  onConfirmar: () => void;
}

export function FecharCompetenciaDialog({
  open,
  onOpenChange,
  ano,
  mes,
  situacao,
  fechando,
  onConfirmar,
}: FecharCompetenciaDialogProps) {
  const { ok, motivos } = podeFecharCompetencia(situacao);
  const competencia = `${MESES[mes - 1]}/${ano}`;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Fechar competência {competencia}</AlertDialogTitle>
          <AlertDialogDescription>
            A competência passa a <strong>{STATUS_FECHAMENTO_LABELS.consolidado}</strong> e nenhum lançamento de
            ocorrência é aceito até que o RH reabra pela parametrização.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status atual</span>
            <Badge variant="outline">{STATUS_FECHAMENTO_LABELS[situacao.statusAtual ?? "aberto"]}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Servidores consolidados</span>
            <span className="font-medium">
              {situacao.consolidados} / {situacao.totalServidores}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Abonos aguardando decisão</span>
            <span className={`font-medium ${situacao.abonosPendentes > 0 ? "text-destructive" : ""}`}>
              {situacao.abonosPendentes}
            </span>
          </div>

          {ok ? (
            <p className="flex items-center gap-2 text-success pt-2">
              <CheckCircle className="h-4 w-4" />
              Tudo pronto para fechar.
            </p>
          ) : (
            <ul className="space-y-1 pt-2">
              {motivos.map((m) => (
                <li key={m} className="flex items-start gap-2 text-destructive">
                  <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={fechando}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={!ok || fechando}
            onClick={(e) => {
              e.preventDefault();
              onConfirmar();
            }}
          >
            {fechando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Fechar competência
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
