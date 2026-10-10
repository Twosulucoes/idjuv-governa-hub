/**
 * Confirmação de cancelamento de viagem com motivo obrigatório. O motivo é
 * gravado em `observacoes` com o prefixo "Cancelada em dd/mm/aaaa: ..."
 * (`textoCancelamento` em `@/lib/diariasRegras`), já que não há coluna própria.
 */

import { useEffect, useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { formatarDataViagem } from "@/hooks/useViagens";
import { descreverDestino } from "@/lib/diariasRegras";
import type { ViagemDiariaComServidor } from "@/types/rh";

interface CancelarViagemDialogProps {
  /** Viagem a cancelar; `null` fecha o diálogo. */
  viagem: ViagemDiariaComServidor | null;
  onOpenChange: (open: boolean) => void;
  onConfirmar: (motivo: string) => void;
  pendente?: boolean;
}

export function CancelarViagemDialog({ viagem, onOpenChange, onConfirmar, pendente = false }: CancelarViagemDialogProps) {
  const [motivo, setMotivo] = useState("");
  const open = !!viagem;

  // Limpa o motivo a cada abertura.
  useEffect(() => {
    if (open) setMotivo("");
  }, [open]);

  const motivoValido = motivo.trim().length > 0;

  return (
    <AlertDialog open={open} onOpenChange={(aberto) => !aberto && onOpenChange(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancelar viagem?</AlertDialogTitle>
          <AlertDialogDescription>
            {viagem && (
              <>
                Viagem de <strong>{viagem.servidor?.nome_completo || "servidor"}</strong> para{" "}
                {descreverDestino(viagem)}, de {formatarDataViagem(viagem.data_saida)} a{" "}
                {formatarDataViagem(viagem.data_retorno)}. O registro é mantido como cancelado e o motivo fica nas
                observações.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor="motivo-cancelamento-viagem">Motivo do cancelamento *</Label>
          <Textarea
            id="motivo-cancelamento-viagem"
            rows={3}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex.: evento adiado pelo organizador"
            disabled={pendente}
          />
          <p className="text-xs text-muted-foreground">
            {motivoValido ? "" : "Informe o motivo para confirmar. "}
            Não registre dados de saúde ou outros dados pessoais do servidor: o motivo fica nas observações e na auditoria.
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pendente}>Voltar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              if (motivoValido) onConfirmar(motivo.trim());
            }}
            disabled={pendente || !motivoValido}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {pendente && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Cancelar viagem
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
