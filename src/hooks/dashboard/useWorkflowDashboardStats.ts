/**
 * Hook para estatísticas do dashboard de Workflow/Processos
 */

import { useQuery } from "@tanstack/react-query";
import { countQuery, op } from "./queryUtils";
import { format, startOfMonth } from "date-fns";

interface WorkflowStats {
  processosAtivos: number;
  pendentesComigo: number;
  tramitadosHoje: number;
  concluidosMes: number;
}

async function fetchWorkflowStats(userId?: string): Promise<WorkflowStats> {
  const hoje = format(new Date(), "yyyy-MM-dd");
  const inicioMes = format(startOfMonth(new Date()), "yyyy-MM-dd");

  const [abertos, emTramitacao, tramitadosHoje, concluidosMes] = await Promise.all([
    countQuery("processos_administrativos", { status: "aberto" }),
    countQuery("processos_administrativos", { status: "em_tramitacao" }),
    countQuery("encaminhamentos", { created_at: op.gte(`${hoje}T00:00:00`) }),
    countQuery("processos_administrativos", { status: "concluido", updated_at: op.gte(inicioMes) }),
  ]);

  let pendentesComigo = 0;
  if (userId) {
    pendentesComigo = await countQuery("encaminhamentos", {
      destinatario_id: userId,
      data_recebimento: null,
    });
  }

  return {
    processosAtivos: abertos + emTramitacao,
    pendentesComigo,
    tramitadosHoje,
    concluidosMes,
  };
}

export function useWorkflowDashboardStats(userId?: string) {
  return useQuery({
    queryKey: ["workflow-dashboard-stats", userId],
    queryFn: () => fetchWorkflowStats(userId),
    staleTime: 1000 * 60 * 5,
  });
}
