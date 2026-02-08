/**
 * Hook para estatísticas do dashboard de Patrimônio
 */

import { useQuery } from "@tanstack/react-query";
import { countQuery, selectQuery, op } from "./queryUtils";

interface PatrimonioStats {
  bensAtivos: number;
  unidadesLocais: number;
  itensEstoque: number;
  pendencias: number;
}

async function fetchPatrimonioStats(): Promise<PatrimonioStats> {
  const [bensAtivos, unidadesLocais, estoqueData, pendencias] = await Promise.all([
    countQuery("bens_patrimoniais", { situacao: "ativo" }),
    countQuery("unidades_locais", { ativo: true }),
    selectQuery<{ quantidade: number }>(
      "estoque",
      "quantidade",
      { quantidade: op.gt(0) }
    ),
    countQuery("bens_patrimoniais", { situacao_inventario: "extraviado" }),
  ]);

  const itensEstoque = estoqueData.reduce((acc, e) => acc + (e.quantidade || 0), 0);

  return {
    bensAtivos,
    unidadesLocais,
    itensEstoque,
    pendencias,
  };
}

export function usePatrimonioDashboardStats() {
  return useQuery({
    queryKey: ["patrimonio-dashboard-stats"],
    queryFn: fetchPatrimonioStats,
    staleTime: 1000 * 60 * 5,
  });
}
