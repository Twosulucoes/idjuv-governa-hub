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
    countQuery("servidores", { situacao: "ativo" }),
    // Status válidos de ferias_servidor (CHECK no banco): programada, em_gozo,
    // concluida, interrompida, cancelada — "fruindo" não existe e contava 0.
    countQuery("ferias_servidor", { status: "em_gozo" }),
    // A tela /rh/viagens grava em viagens_diarias; "pendente" = solicitada e
    // ainda não autorizada (status do CHECK: solicitada, autorizada, ...).
    countQuery("viagens_diarias", { status: "solicitada" }),
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
