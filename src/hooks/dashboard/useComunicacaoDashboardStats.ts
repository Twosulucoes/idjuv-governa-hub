/**
 * Hook para estatísticas do dashboard de Comunicação (ASCOM)
 */

import { useQuery } from "@tanstack/react-query";
import { countQuery, op } from "./queryUtils";
import { format, startOfMonth } from "date-fns";

interface ComunicacaoStats {
  demandasAbertas: number;
  emProducao: number;
  publicadasMes: number;
  eventosMes: number;
}

async function fetchComunicacaoStats(): Promise<ComunicacaoStats> {
  const inicioMes = format(startOfMonth(new Date()), "yyyy-MM-dd");

  const [demandasAbertas, emProducao, publicadasMes, eventosMes] = await Promise.all([
    countQuery("demandas_ascom", { status: "enviada" }),
    countQuery("demandas_ascom", { status: "em_execucao" }),
    countQuery("demandas_ascom", { status: "concluida", data_conclusao: op.gte(inicioMes) }),
    countQuery("calendario_federacao", { tipo: "evento", data_inicio: op.gte(inicioMes) }),
  ]);

  return {
    demandasAbertas,
    emProducao,
    publicadasMes,
    eventosMes,
  };
}

export function useComunicacaoDashboardStats() {
  return useQuery({
    queryKey: ["comunicacao-dashboard-stats"],
    queryFn: fetchComunicacaoStats,
    staleTime: 1000 * 60 * 5,
  });
}
