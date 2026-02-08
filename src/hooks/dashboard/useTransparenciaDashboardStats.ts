/**
 * Hook para estatísticas do dashboard de Transparência
 */

import { useQuery } from "@tanstack/react-query";
import { countQuery, op } from "./queryUtils";
import { format, startOfMonth } from "date-fns";

interface TransparenciaStats {
  publicacoes: number;
  downloadsMes: number;
  solicitacoesLai: number;
  acessosMes: number;
}

async function fetchTransparenciaStats(): Promise<TransparenciaStats> {
  const inicioMes = format(startOfMonth(new Date()), "yyyy-MM-dd");

  const [publicacoes, laiPendente, laiAndamento, downloadsMes, acessosMes] = await Promise.all([
    countQuery("dados_oficiais", { status: "publicado" }),
    countQuery("historico_lai", { status: "pendente" }),
    countQuery("historico_lai", { status: "em_andamento" }),
    countQuery("audit_logs", { action: "download", timestamp: op.gte(inicioMes) }),
    countQuery("audit_logs", { action: "view", timestamp: op.gte(inicioMes) }),
  ]);

  return {
    publicacoes,
    downloadsMes,
    solicitacoesLai: laiPendente + laiAndamento,
    acessosMes,
  };
}

export function useTransparenciaDashboardStats() {
  return useQuery({
    queryKey: ["transparencia-dashboard-stats"],
    queryFn: fetchTransparenciaStats,
    staleTime: 1000 * 60 * 5,
  });
}
