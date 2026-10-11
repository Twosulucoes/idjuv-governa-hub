/**
 * Selo de situação dos movimentos bancários (conciliação e detalhe do pagamento).
 */

import { StatusBadge, type TomStatus } from "@/components/design-system";
import type { SituacaoMovimentoBancario } from "@/lib/bancario/comum";
import { ROTULO_SITUACAO_MOVIMENTO } from "@/lib/bancario/exibicao";

const TOM_SITUACAO: Record<SituacaoMovimentoBancario, TomStatus> = {
  enviado: "andamento",
  pago: "sucesso",
  recusado: "erro",
};

export function SituacaoMovimentoBadge({ situacao }: { situacao: string }) {
  const s = situacao as SituacaoMovimentoBancario;
  return <StatusBadge tom={TOM_SITUACAO[s] ?? "neutro"}>{ROTULO_SITUACAO_MOVIMENTO[s] ?? situacao}</StatusBadge>;
}
