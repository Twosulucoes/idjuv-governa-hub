/**
 * Hook para estatísticas do dashboard de RH
 */

import { useQuery } from "@tanstack/react-query";
import { countQuery, selectQuery, op } from "./queryUtils";

interface RHStats {
  servidoresAtivos: number;
  emFerias: number;
  viagensPendentes: number;
  frequenciaHoje: number;
}

async function fetchRHStats(): Promise<RHStats> {
  const mesAtual = new Date().getMonth() + 1;
  const anoAtual = new Date().getFullYear();

  const [servidoresAtivos, emFerias, viagensPendentes, frequenciaData] = await Promise.all([
    countQuery("servidores", { situacao_atual: "ativo" }),
    countQuery("ferias_servidor", { status: "fruindo" }),
    countQuery("processos_administrativos", { tipo: "diarias", status: "aberto" }),
    selectQuery<{ percentual_presenca: number | null }>(
      "frequencia_mensal",
      "percentual_presenca",
      { mes: mesAtual, ano: anoAtual }
    ),
  ]);

  let frequenciaHoje = 0;
  if (frequenciaData.length > 0) {
    const somaPercentuais = frequenciaData.reduce((acc, f) => acc + (f.percentual_presenca || 0), 0);
    frequenciaHoje = Math.round(somaPercentuais / frequenciaData.length);
  }

  return {
    servidoresAtivos,
    emFerias,
    viagensPendentes,
    frequenciaHoje,
  };
}

export function useRHDashboardStats() {
  return useQuery({
    queryKey: ["rh-dashboard-stats"],
    queryFn: fetchRHStats,
    staleTime: 1000 * 60 * 5,
  });
}
