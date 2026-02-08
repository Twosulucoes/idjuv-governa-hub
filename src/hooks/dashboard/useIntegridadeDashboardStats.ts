/**
 * Hook para estatísticas do dashboard de Integridade
 */

import { useQuery } from "@tanstack/react-query";
import { countQuery, selectQuery } from "./queryUtils";

interface IntegridadeStats {
  denunciasAbertas: number;
  emAnalise: number;
  resolvidasAno: number;
  conformidade: number;
}

async function fetchIntegridadeStats(): Promise<IntegridadeStats> {
  const [identificados, emAnalise, emTratamento, encerrados, controlesAtivos, avaliacoes] = await Promise.all([
    countQuery("riscos_institucionais", { status: "identificado" }),
    countQuery("riscos_institucionais", { status: "em_analise" }),
    countQuery("riscos_institucionais", { status: "em_tratamento" }),
    countQuery("riscos_institucionais", { status: "encerrado" }),
    countQuery("controles_internos", { ativo: true }),
    selectQuery<{ efetividade: string }>(
      "avaliacoes_controle",
      "efetividade",
      {},
      { limit: 50 }
    ),
  ]);

  let conformidade = 0;
  if (avaliacoes.length > 0) {
    const efetivos = avaliacoes.filter(a => a.efetividade === "efetivo").length;
    conformidade = Math.round((efetivos / avaliacoes.length) * 100);
  } else if (controlesAtivos > 0) {
    conformidade = 100;
  }

  return {
    denunciasAbertas: identificados,
    emAnalise: emAnalise + emTratamento,
    resolvidasAno: encerrados,
    conformidade,
  };
}

export function useIntegridadeDashboardStats() {
  return useQuery({
    queryKey: ["integridade-dashboard-stats"],
    queryFn: fetchIntegridadeStats,
    staleTime: 1000 * 60 * 5,
  });
}
