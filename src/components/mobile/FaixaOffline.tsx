/**
 * COMPONENTE: FAIXA DE STATUS OFFLINE (PWA)
 * Avisa, com texto, que o aparelho está sem conexão. A região `role="status"`
 * fica sempre montada para o leitor de tela anunciar quando o aviso aparece.
 * Não detecta rede: recebe o estado `online` que a tela já calcula.
 */

import { WifiOff } from "lucide-react";

interface FaixaOfflineProps {
  online: boolean;
  mensagem?: string;
}

export function FaixaOffline({
  online,
  mensagem = "Sem conexão. As coletas ficam salvas no aparelho e são enviadas quando a internet voltar.",
}: FaixaOfflineProps) {
  return (
    <div role="status" aria-live="polite">
      {!online && (
        <div className="flex items-start gap-2 border-b border-warning/30 bg-warning/15 px-4 py-3 text-base font-medium text-warning">
          <WifiOff className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p>{mensagem}</p>
        </div>
      )}
    </div>
  );
}
