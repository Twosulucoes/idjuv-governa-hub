import { StatusBadge, type TomStatus } from "@/components/design-system";
import { SITUACAO_LABELS, type SituacaoFuncional } from "@/types/rh";

/** Situação funcional → tom do selo padrão (cor + ícone + texto). */
const TOM_SITUACAO: Record<SituacaoFuncional, TomStatus> = {
  ativo: "sucesso",
  ferias: "andamento",
  licenca: "pendente",
  afastado: "pendente",
  cedido: "neutro",
  exonerado: "erro",
  aposentado: "neutro",
  falecido: "neutro",
};

/** Selo da situação funcional do servidor, no padrão do design system. */
export function SituacaoServidorBadge({ situacao }: { situacao: string | null | undefined }) {
  if (!situacao) return <StatusBadge tom="neutro">Sem situação</StatusBadge>;
  const chave = situacao as SituacaoFuncional;
  return <StatusBadge tom={TOM_SITUACAO[chave] ?? "neutro"}>{SITUACAO_LABELS[chave] ?? situacao}</StatusBadge>;
}
