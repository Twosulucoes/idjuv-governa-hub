/**
 * Hook para estatísticas do dashboard de Gestores Escolares
 */

import { useQuery } from "@tanstack/react-query";
import { countQuery } from "./queryUtils";

interface GestoresEscolaresStats {
  gestoresCadastrados: number;
  escolas: number;
  pendentes: number;
  aprovados: number;
}

async function fetchGestoresStats(): Promise<GestoresEscolaresStats> {
  const [gestoresCadastrados, escolas, pendentes, aprovados] = await Promise.all([
    countQuery("gestores_escolares", {}),
    countQuery("escolas_jer", {}),
    countQuery("gestores_escolares", { status: "pendente" }),
    countQuery("gestores_escolares", { status: "aprovado" }),
  ]);

  return {
    gestoresCadastrados,
    escolas,
    pendentes,
    aprovados,
  };
}

export function useGestoresEscolaresDashboardStats() {
  return useQuery({
    queryKey: ["gestores-escolares-dashboard-stats"],
    queryFn: fetchGestoresStats,
    staleTime: 1000 * 60 * 5,
  });
}
