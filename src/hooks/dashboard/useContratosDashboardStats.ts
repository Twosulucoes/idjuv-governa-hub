/**
 * Hook para estatísticas do dashboard de Contratos
 */

import { useQuery } from "@tanstack/react-query";
import { countQuery, selectQuery, op } from "./queryUtils";
import { addDays, format } from "date-fns";

interface ContratosStats {
  contratosVigentes: number;
  aVencer90Dias: number;
  aditivosPendentes: number;
  valorTotal: number;
}

async function fetchContratosStats(): Promise<ContratosStats> {
  const hoje = new Date();
  const em90Dias = addDays(hoje, 90);
  const hojeStr = format(hoje, "yyyy-MM-dd");
  const em90DiasStr = format(em90Dias, "yyyy-MM-dd");

  const [contratosData, aditivosPendentes] = await Promise.all([
    selectQuery<{ valor_atual: number; data_fim_atual: string }>(
      "contratos",
      "valor_atual, data_fim_atual",
      { status: "vigente", data_fim_atual: op.gte(hojeStr) }
    ),
    countQuery("aditivos_contrato", { data_publicacao_doe: null }),
  ]);

  const aVencer90Dias = contratosData.filter(
    c => c.data_fim_atual && c.data_fim_atual >= hojeStr && c.data_fim_atual <= em90DiasStr
  ).length;

  const valorTotal = contratosData.reduce((acc, c) => acc + (c.valor_atual || 0), 0);

  return {
    contratosVigentes: contratosData.length,
    aVencer90Dias,
    aditivosPendentes,
    valorTotal,
  };
}

export function useContratosDashboardStats() {
  return useQuery({
    queryKey: ["contratos-dashboard-stats"],
    queryFn: fetchContratosStats,
    staleTime: 1000 * 60 * 5,
  });
}
