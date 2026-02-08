/**
 * Hook para estatísticas do dashboard de Governança
 */

import { useQuery } from "@tanstack/react-query";
import { countQuery } from "./queryUtils";

interface GovernancaStats {
  unidadesOrg: number;
  cargos: number;
  federacoes: number;
  portarias: number;
}

async function fetchGovernancaStats(): Promise<GovernancaStats> {
  const [unidadesOrg, cargos, federacoes, portarias] = await Promise.all([
    countQuery("estrutura_organizacional", { ativo: true }),
    countQuery("cargos", { ativo: true }),
    countQuery("federacoes_esportivas", { ativo: true }),
    countQuery("designacoes", { ativo: true }),
  ]);

  return {
    unidadesOrg,
    cargos,
    federacoes,
    portarias,
  };
}

export function useGovernancaDashboardStats() {
  return useQuery({
    queryKey: ["governanca-dashboard-stats"],
    queryFn: fetchGovernancaStats,
    staleTime: 1000 * 60 * 5,
  });
}
