/**
 * Hook para estatísticas do dashboard de Contratos: em vigor, vencendo em 90 dias, vencidos sem encerrar, sem
 * providência do vencimento (C2), sem gestor ou fiscal e o valor em vigor. As regras são as da lista
 * (src/lib/contratos/lista.ts), para os números baterem.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { resumoPainel, type ResumoPainel } from "@/lib/contratos/lista";
import type { ContratoLista } from "@/types/contratos";

type LinhaPainel = Pick<ContratoLista, "status" | "data_fim" | "data_fim_atual" | "valor_atual"> & {
  renovacao_providencia: string | null;
  responsaveis: Pick<ContratoLista["responsaveis"][number], "papel" | "data_fim">[];
};

async function fetchContratosStats(): Promise<ResumoPainel> {
  const { data, error } = await supabase
    .from("contratos")
    .select("status, data_fim, data_fim_atual, valor_atual, renovacao_providencia, responsaveis:contrato_responsaveis(papel, data_fim)")
    .not("status", "in", "(rascunho,encerrado,rescindido)")
    .range(0, 999);
  if (error) throw error;
  return resumoPainel((data ?? []) as unknown as LinhaPainel[]);
}

export function useContratosDashboardStats() {
  return useQuery({
    queryKey: ["contratos-dashboard-stats"],
    queryFn: fetchContratosStats,
    staleTime: 1000 * 60 * 5,
  });
}
