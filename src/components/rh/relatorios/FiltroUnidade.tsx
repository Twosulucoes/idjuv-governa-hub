import { useMemo } from "react";
import { useUnidadesParaFiltro } from "@/hooks/useRelatorios";
import { rotuloUnidade } from "@/lib/relatoriosRHRegras";
import { FiltroSelect } from "./FiltroSelect";

interface FiltroUnidadeProps {
  unidadeId: string | undefined;
  onChange: (unidadeId: string | undefined) => void;
}

/** Filtro por unidade organizacional ativa (`estrutura_organizacional`). */
export function FiltroUnidade({ unidadeId, onChange }: FiltroUnidadeProps) {
  const { data: unidades = [], isLoading } = useUnidadesParaFiltro();
  const opcoes = useMemo(() => unidades.map((u) => ({ valor: u.id, rotulo: rotuloUnidade(u) })), [unidades]);

  return (
    <FiltroSelect
      label="Unidade"
      valor={unidadeId}
      opcoes={opcoes}
      onChange={onChange}
      rotuloTodos="Todas as unidades"
      carregando={isLoading}
    />
  );
}
