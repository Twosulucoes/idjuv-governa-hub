/**
 * Hook para estatísticas do dashboard de Compras
 */

import { useQuery } from "@tanstack/react-query";
import { countQuery } from "./queryUtils";

interface ComprasStats {
  processosAbertos: number;
  emInstrucao: number;
  dispensasInexigibilidades: number;
  contratados: number;
}

// Etapas de processos_licitatorios (migração 20261029090000); a antiga contagem por "fase" usava coluna inexistente
const EM_INSTRUCAO = ["abertura", "dfd", "etp", "tr", "cotacao", "levantamento_tecnico", "instrucao_adesao", "analise_juridica"];
const CONTRATADOS = ["contrato", "execucao", "encerrado"];
const ENCERRADOS = ["encerrado", "cancelado"];

async function fetchComprasStats(): Promise<ComprasStats> {
  const [todos, encerrados, emInstrucao, dispensasInexigibilidades, contratados] = await Promise.all([
    countQuery("processos_licitatorios"),
    countQuery("processos_licitatorios", { etapa: ENCERRADOS }),
    countQuery("processos_licitatorios", { etapa: EM_INSTRUCAO }),
    countQuery("processos_licitatorios", { modalidade: ["dispensa", "inexigibilidade"] }),
    countQuery("processos_licitatorios", { etapa: CONTRATADOS }),
  ]);

  return { processosAbertos: todos - encerrados, emInstrucao, dispensasInexigibilidades, contratados };
}

export function useComprasDashboardStats() {
  return useQuery({
    queryKey: ["compras-dashboard-stats"],
    queryFn: fetchComprasStats,
    staleTime: 1000 * 60 * 5,
  });
}
