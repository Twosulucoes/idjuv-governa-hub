/**
 * Hook para estatísticas do dashboard Financeiro
 */

import { useQuery } from "@tanstack/react-query";
import { countQuery, selectQuery } from "./queryUtils";

interface FinanceiroStats {
  dotacaoAnual: number;
  percentualExecutado: number;
  empenhosPendentes: number;
  valorPagamentos: number;
}

async function fetchFinanceiroStats(): Promise<FinanceiroStats> {
  const anoAtual = new Date().getFullYear();

  const [dotacoesData, empenhosPendentes, pagamentosData] = await Promise.all([
    selectQuery<{ valor_inicial: number; valor_atual: number }>(
      "fin_dotacoes",
      "valor_inicial, valor_atual",
      { exercicio: anoAtual }
    ),
    countQuery("fin_empenhos", { exercicio: anoAtual, status: "emitido" }),
    selectQuery<{ valor_liquido: number }>(
      "fin_pagamentos",
      "valor_liquido",
      { exercicio: anoAtual, status: "pago" }
    ),
  ]);

  const dotacaoAnual = dotacoesData.reduce((acc, d) => acc + (d.valor_atual || d.valor_inicial || 0), 0);
  const valorPagamentos = pagamentosData.reduce((acc, p) => acc + (p.valor_liquido || 0), 0);
  const percentualExecutado = dotacaoAnual > 0 ? Math.round((valorPagamentos / dotacaoAnual) * 100) : 0;

  return {
    dotacaoAnual,
    percentualExecutado,
    empenhosPendentes,
    valorPagamentos,
  };
}

export function useFinanceiroDashboardStats() {
  return useQuery({
    queryKey: ["financeiro-dashboard-stats"],
    queryFn: fetchFinanceiroStats,
    staleTime: 1000 * 60 * 5,
  });
}
