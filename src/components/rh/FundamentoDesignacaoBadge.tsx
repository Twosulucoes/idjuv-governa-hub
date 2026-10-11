/**
 * Se a designação vale como fundamento de lançamento no setor de destino (regra de lançamento por setor): aprovada,
 * vigente e com número e data do ato. Se não vale, diz o que falta. Quem decide é o banco; isto é só exibição.
 */

import { StatusBadge } from "@/components/design-system";
import { avaliarDesignacaoComoFundamento } from "@/lib/lancamentoSetorRegras";
import type { Designacao } from "@/types/designacao";

interface FundamentoDesignacaoBadgeProps {
  designacao: Pick<Designacao, "status" | "data_inicio" | "data_fim" | "ato_numero" | "ato_data" | "ativo">;
}

export function FundamentoDesignacaoBadge({ designacao }: FundamentoDesignacaoBadgeProps) {
  const { vale, faltas } = avaliarDesignacaoComoFundamento(designacao);
  const encerrada = designacao.status === "encerrada" || designacao.status === "rejeitada";
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <StatusBadge tom={vale ? "sucesso" : encerrada ? "neutro" : "pendente"}>
        {vale ? "Vale para lançar" : "Não vale para lançar"}
      </StatusBadge>
      {!vale && !encerrada && faltas.length > 0 && (
        <span className="text-caption text-muted-foreground">Falta: {faltas.join(", ")}</span>
      )}
    </span>
  );
}
