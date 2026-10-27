/** Selo da vigência do contrato (vigente, vence em N dias, vencido, encerrado), com o tom pela urgência. */

import { StatusBadge } from "@/components/design-system";
import { descricaoVigencia, tomFaixa, type SituacaoVigencia } from "@/lib/contratos/vigencia";

export function SeloVigencia({ situacao, className }: { situacao: SituacaoVigencia; className?: string }) {
  return (
    <StatusBadge tom={tomFaixa(situacao.faixa)} className={className}>
      {descricaoVigencia(situacao)}
    </StatusBadge>
  );
}
