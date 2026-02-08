/**
 * Hook para estatísticas do dashboard de Gestores Escolares
 * Usa os status corretos: aguardando, em_processamento, cadastrado_cbde, contato_realizado, confirmado, problema
 */

import { useQuery } from "@tanstack/react-query";
import { countQuery } from "./queryUtils";

interface GestoresEscolaresStats {
  gestoresCadastrados: number;
  escolas: number;
  pendentes: number;
  confirmados: number;
}

async function fetchGestoresStats(): Promise<GestoresEscolaresStats> {
  const [gestoresCadastrados, escolas, aguardando, emProcessamento, confirmados] = await Promise.all([
    countQuery("gestores_escolares", {}),
    countQuery("escolas_jer", {}),
    countQuery("gestores_escolares", { status: "aguardando" }),
    countQuery("gestores_escolares", { status: "em_processamento" }),
    countQuery("gestores_escolares", { status: "confirmado" }),
  ]);

  return {
    gestoresCadastrados,
    escolas,
    pendentes: aguardando + emProcessamento,
    confirmados,
  };
}

export function useGestoresEscolaresDashboardStats() {
  return useQuery({
    queryKey: ["gestores-escolares-dashboard-stats"],
    queryFn: fetchGestoresStats,
    staleTime: 1000 * 60 * 5,
  });
}
