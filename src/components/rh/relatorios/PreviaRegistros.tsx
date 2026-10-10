import type { ReactNode } from "react";
import { Loader2, SearchX } from "lucide-react";
import { EmptyState } from "@/components/design-system";

interface PreviaRegistrosProps {
  /** Filtros ainda não permitem consultar (ex.: período inválido). */
  filtrosInvalidos?: boolean;
  carregando: boolean;
  erro: boolean;
  total: number;
  /** Texto do item contado, singular/plural (padrão "registro"/"registros"). */
  substantivo?: [string, string];
  /** Complemento ao lado da contagem (ex.: "120 dias"). */
  detalhe?: ReactNode;
}

/** Pré-visualização dos cards de relatório: estado dos filtros, carregamento, vazio ou "N registros". */
export function PreviaRegistros({
  filtrosInvalidos,
  carregando,
  erro,
  total,
  substantivo = ["registro", "registros"],
  detalhe,
}: PreviaRegistrosProps) {
  if (filtrosInvalidos) {
    return <p className="text-sm text-muted-foreground">Informe um período válido para consultar.</p>;
  }
  if (carregando) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Consultando…
      </div>
    );
  }
  if (erro) {
    return (
      <p className="text-sm text-destructive" role="alert">
        Não foi possível consultar os dados. Tente novamente.
      </p>
    );
  }
  if (total === 0) {
    return (
      <EmptyState
        icone={SearchX}
        titulo="Nenhum registro no período"
        descricao="Ajuste o período ou os filtros para encontrar registros."
        className="py-4"
      />
    );
  }
  return (
    <p className="text-sm" role="status">
      <span className="font-medium">{total}</span>{" "}
      <span className="text-muted-foreground">{total === 1 ? substantivo[0] : substantivo[1]}</span>
      {detalhe && <span className="text-muted-foreground"> · {detalhe}</span>}
    </p>
  );
}

