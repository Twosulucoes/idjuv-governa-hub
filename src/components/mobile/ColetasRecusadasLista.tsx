/**
 * COMPONENTE: COLETAS RECUSADAS PELO SERVIDOR (PWA)
 * Lista as coletas da fila offline que o servidor recusou ao sincronizar, com o
 * motivo, e deixa o usuário descartá-las (reenviar daria o mesmo erro).
 */

import { AlertTriangle, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ColetaPendente } from "@/hooks/useColetaOffline";

interface ColetasRecusadasListaProps {
  coletas: ColetaPendente[];
  onDescartar: (id: string) => void;
}

export function ColetasRecusadasLista({ coletas, onDescartar }: ColetasRecusadasListaProps) {
  if (coletas.length === 0) return null;

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" aria-hidden="true" />
      <AlertTitle>{coletas.length} coleta(s) recusada(s) pelo servidor</AlertTitle>
      <AlertDescription>
        <ul className="mt-2 space-y-3">
          {coletas.map((coleta) => (
            <li key={coleta.id} className="flex items-start justify-between gap-3 border-t border-destructive/30 pt-3">
              <div className="min-w-0 text-sm">
                <p className="font-mono font-medium">{coleta.rotulo || "Bem sem identificação"}</p>
                <p className="break-words">{coleta.ultimo_erro}</p>
              </div>
              <Button
                variant="outline"
                className="min-h-11 shrink-0"
                onClick={() => onDescartar(coleta.id)}
                aria-label={`Descartar coleta ${coleta.rotulo ?? ""}`.trim()}
              >
                <Trash2 className="mr-1 h-4 w-4" aria-hidden="true" />
                Descartar
              </Button>
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
