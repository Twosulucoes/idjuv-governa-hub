/**
 * Próxima ação do processo (P2, migração 20261121090000): o selo do prazo (vencido, vence hoje, próximo, em dia) e o
 * resumo "próxima etapa · responsável · prazo" usados na lista, na ficha e na linha do tempo.
 */

import { StatusBadge, type TomStatus } from "@/components/design-system";
import { formatDateBR } from "@/lib/formatters";
import { hojeLocal, situacaoPrazo, textoPrazo, type SituacaoPrazo } from "@/lib/compras/proximaAcao";
import { rotuloEtapa } from "@/types/processos";

const TOM: Record<SituacaoPrazo, TomStatus> = { vencido: "erro", hoje: "pendente", proximo: "pendente", em_dia: "neutro" };

export function SeloPrazo({ prazo, hoje = hojeLocal(), inicio }: { prazo: string | null | undefined; hoje?: string; inicio?: boolean }) {
  const s = situacaoPrazo(prazo, hoje);
  if (!prazo || !s) return <span className="text-muted-foreground">—</span>;
  return (
    <span className={`inline-flex flex-col gap-0.5 ${inicio ? "items-start" : "items-end"}`}>
      <span className="whitespace-nowrap">{formatDateBR(prazo)}</span>
      <StatusBadge tom={TOM[s]} icone={s === "vencido"}>{textoPrazo(prazo, hoje)}</StatusBadge>
    </span>
  );
}

interface Resumo {
  proxima_etapa: string | null;
  responsavel_nome?: string | null;
  responsavel_setor?: string | null;
  prazo?: string | null;
  /** Sem o selo de vencido (movimentações antigas, cuja próxima ação já passou). */
  semSelo?: boolean;
}

/** "Próximo: TR · Maria Silva · até 15/11/2026". Sem próxima etapa, nada. */
export function ResumoProximaAcao({ proxima_etapa, responsavel_nome, responsavel_setor, prazo, semSelo }: Resumo) {
  if (!proxima_etapa) return null;
  const quem = responsavel_nome || responsavel_setor;
  const hoje = hojeLocal();
  const s = situacaoPrazo(prazo, hoje);
  return (
    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
      <span className="text-muted-foreground">Próximo:</span>
      <span className="font-medium">{rotuloEtapa(proxima_etapa)}</span>
      {quem && <span>· {quem}</span>}
      {prazo && <span>· até {formatDateBR(prazo)}</span>}
      {!semSelo && prazo && s && s !== "em_dia" && <StatusBadge tom={TOM[s]} icone={false}>{textoPrazo(prazo, hoje)}</StatusBadge>}
    </p>
  );
}
