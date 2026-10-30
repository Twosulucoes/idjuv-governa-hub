/**
 * Botão "Atualizar agora" dos convênios federais: pede ao GitHub uma rodada da rotina diária do Transferegov e espera a
 * carga nova chegar (a página relê a última sincronização enquanto `aguardando`). A rodada leva cerca de 1 minuto.
 */

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAtualizarConveniosFederais } from "@/hooks/useConveniosFederais";

/** Depois disso para de esperar e avisa (a rodada pode ter falhado no GitHub). */
const ESPERA_MAXIMA_MS = 4 * 60_000;

interface Props {
  /** executada_em da última sincronização que a página tem */
  ultimaExecutadaEm: string | null | undefined;
  /** Quando o pedido foi aceito; null quando não está esperando carga nova */
  aguardandoDesde: number | null;
  aoMudarAguardando: (desde: number | null) => void;
}

export function BotaoAtualizarConvenios({ ultimaExecutadaEm, aguardandoDesde, aoMudarAguardando }: Props) {
  const atualizar = useAtualizarConveniosFederais();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const avisado = useRef(false);
  /** A última sincronização que a página tinha quando o pedido foi aceito; a carga nova é a que vier diferente. */
  const base = useRef<string | null>(null);

  // Chegou carga nova depois do pedido: recarrega a lista e o histórico
  useEffect(() => {
    if (aguardandoDesde === null || !ultimaExecutadaEm) return;
    if (ultimaExecutadaEm !== base.current) {
      aoMudarAguardando(null);
      queryClient.invalidateQueries({ queryKey: ["fin_tg_propostas"] });
      queryClient.invalidateQueries({ queryKey: ["fin_tg_mudancas"] });
      toast({ title: "Convênios atualizados", description: "Os dados do Transferegov foram lidos de novo." });
    }
  }, [ultimaExecutadaEm, aguardandoDesde, aoMudarAguardando, queryClient, toast]);

  useEffect(() => {
    if (aguardandoDesde === null) return;
    avisado.current = false;
    const relogio = setTimeout(() => {
      if (avisado.current) return;
      avisado.current = true;
      aoMudarAguardando(null);
      toast({
        title: "A atualização está demorando",
        description: "Confira daqui a pouco. Se não mudar, avise o administrador do sistema.",
        variant: "destructive",
      });
    }, ESPERA_MAXIMA_MS);
    return () => clearTimeout(relogio);
  }, [aguardandoDesde, aoMudarAguardando, toast]);

  const ocupado = atualizar.isPending || aguardandoDesde !== null;

  return (
    <Button
      variant="outline"
      disabled={ocupado}
      onClick={() =>
        atualizar.mutate(undefined, {
          onSuccess: () => {
            base.current = ultimaExecutadaEm ?? null;
            aoMudarAguardando(Date.now());
            toast({ title: "Atualização pedida", description: "Leva cerca de 1 minuto; a tela se atualiza sozinha." });
          },
          onError: (e) => toast({ title: "Não foi possível atualizar agora", description: (e as Error).message, variant: "destructive" }),
        })
      }
    >
      <RefreshCw className={`h-4 w-4 ${ocupado ? "animate-spin" : ""}`} aria-hidden="true" />
      {aguardandoDesde !== null ? "Atualizando..." : "Atualizar agora"}
    </Button>
  );
}
