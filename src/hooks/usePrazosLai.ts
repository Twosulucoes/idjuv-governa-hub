/**
 * Parametrização dos prazos da LAI (`prazos_lai`). A leitura segue a RLS do módulo de
 * transparência: no portal anônimo a consulta volta vazia e a tela usa o padrão legal
 * (`prazosLaiParaExibicao`).
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PrazoLai } from "@/lib/prazosLai";

export function usePrazosLai() {
  return useQuery({
    queryKey: ["prazos-lai"],
    queryFn: async (): Promise<PrazoLai[]> => {
      const { data, error } = await supabase
        .from("prazos_lai")
        .select("tipo_prazo, prazo_dias, prorrogavel, prorrogacao_dias, dias_uteis")
        .eq("ativo", true);
      if (error) throw error;
      return data ?? [];
    },
  });
}
