/**
 * Hook para estatísticas do dashboard de Compras
 */

import { useQuery } from "@tanstack/react-query";
import { countQuery } from "./queryUtils";

interface ComprasStats {
  licitacoesAtivas: number;
  emAndamento: number;
  dispensasInexigibilidades: number;
  concluidas: number;
}

async function fetchComprasStats(): Promise<ComprasStats> {
  const [licitacoesAtivas, emAndamento, dispensas, inexigibilidades, concluidas] = await Promise.all([
    countQuery("processos_licitatorios", { fase: "publicado" }),
    countQuery("processos_licitatorios", { fase: "elaboracao" }),
    countQuery("processos_licitatorios", { modalidade: "dispensa" }),
    countQuery("processos_licitatorios", { modalidade: "inexigibilidade" }),
    countQuery("processos_licitatorios", { fase: "homologado" }),
  ]);

  return {
    licitacoesAtivas,
    emAndamento,
    dispensasInexigibilidades: dispensas + inexigibilidades,
    concluidas,
  };
}

export function useComprasDashboardStats() {
  return useQuery({
    queryKey: ["compras-dashboard-stats"],
    queryFn: fetchComprasStats,
    staleTime: 1000 * 60 * 5,
  });
}
