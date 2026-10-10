import { StatusBadge, type TomStatus } from "@/components/design-system";
import { STATUS_UNIDADE_LABELS, type StatusUnidadeLocal } from "@/types/unidadesLocais";

/** Status da unidade local → tom do selo padrão (cor + ícone + texto). */
const TOM_STATUS_UNIDADE: Record<StatusUnidadeLocal, TomStatus> = {
  ativa: "sucesso",
  inativa: "neutro",
  manutencao: "pendente",
  interditada: "erro",
};

/** Selo do status da unidade local, no padrão do design system. */
export function StatusUnidadeBadge({ status }: { status: string | null | undefined }) {
  if (!status) return <StatusBadge tom="neutro">Sem status</StatusBadge>;
  const chave = status as StatusUnidadeLocal;
  return <StatusBadge tom={TOM_STATUS_UNIDADE[chave] ?? "neutro"}>{STATUS_UNIDADE_LABELS[chave] ?? status}</StatusBadge>;
}
