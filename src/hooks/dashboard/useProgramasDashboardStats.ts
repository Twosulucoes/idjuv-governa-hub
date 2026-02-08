/**
 * Hook para estatísticas do dashboard de Programas
 */

import { useQuery } from "@tanstack/react-query";
import { countQuery, selectQuery, op } from "./queryUtils";

interface ProgramasStats {
  programasAtivos: number;
  beneficiarios: number;
  atletasBolsa: number;
  eventosAno: number;
}

async function fetchProgramasStats(): Promise<ProgramasStats> {
  const anoAtual = new Date().getFullYear();

  const [programasAtivos, acoesData, atletasBolsa, eventosAno] = await Promise.all([
    countQuery("programas", { situacao: "ativo" }),
    selectQuery<{ meta_fisica: number }>(
      "acoes",
      "meta_fisica",
      { situacao: "em_execucao" }
    ),
    countQuery("instituicoes", { ativo: true }),
    countQuery("calendario_federacao", { data_inicio: op.gte(`${anoAtual}-01-01`) }),
  ]);

  const beneficiarios = acoesData.reduce((acc, a) => acc + (a.meta_fisica || 0), 0);

  return {
    programasAtivos,
    beneficiarios,
    atletasBolsa,
    eventosAno,
  };
}

export function useProgramasDashboardStats() {
  return useQuery({
    queryKey: ["programas-dashboard-stats"],
    queryFn: fetchProgramasStats,
    staleTime: 1000 * 60 * 5,
  });
}
