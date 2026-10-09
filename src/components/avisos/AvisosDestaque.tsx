/**
 * Faixa no topo do conteúdo com os avisos em destaque (ou urgentes) ainda não lidos.
 * Some quando o usuário marca como lido, e no próprio mural (/avisos), que já os lista.
 */

import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAvisosVigentes, useMarcarAvisoLido } from "@/hooks/useAvisos";
import { PRIORIDADE_AVISO_ESTILO } from "./avisosVisual";
import { AvisoLink } from "./AvisoLink";

const MAX_DESTAQUES = 2;

export function AvisosDestaque() {
  const { pathname } = useLocation();
  const { data: avisos = [] } = useAvisosVigentes();
  const marcarLido = useMarcarAvisoLido();

  const destaques = avisos.filter((a) => !a.lido && (a.destaque || a.prioridade === "urgente")).slice(0, MAX_DESTAQUES);
  if (destaques.length === 0 || pathname === "/avisos") return null;

  return (
    <div className="mb-4 space-y-2" role="region" aria-label="Avisos em destaque">
      {destaques.map((aviso) => {
        const { classe, icone: Icone } = PRIORIDADE_AVISO_ESTILO[aviso.prioridade];
        return (
          <div key={aviso.id} className={cn("flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-start", classe)}>
            <Icone className="hidden h-5 w-5 shrink-0 sm:block" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{aviso.titulo}</p>
              <p className="whitespace-pre-line break-words text-sm text-foreground/90">{aviso.conteudo}</p>
              {aviso.link && <AvisoLink href={aviso.link} className="mt-1" />}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 bg-background"
              disabled={marcarLido.isPending}
              onClick={() => marcarLido.mutate([aviso.id])}
            >
              <Check className="mr-1 h-4 w-4" /> Marcar como lido
            </Button>
          </div>
        );
      })}
    </div>
  );
}
