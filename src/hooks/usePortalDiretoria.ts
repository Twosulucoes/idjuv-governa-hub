/**
 * Hook para buscar dados da diretoria do portal público
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MembroDiretoria {
  id: string;
  nome: string;
  cargo: string;
  unidade: string | null;
  foto_url: string | null;
  email: string | null;
  telefone: string | null;
  bio: string | null;
  linkedin_url: string | null;
  decreto_nomeacao: string | null;
  data_posse: string | null;
  ordem_exibicao: number;
}

export function usePortalDiretoria() {
  return useQuery({
    queryKey: ["portal-diretoria"],
    queryFn: async (): Promise<MembroDiretoria[]> => {
      const { data, error } = await supabase
        .from("portal_diretoria")
        .select("*")
        .eq("ativo", true)
        .order("ordem_exibicao", { ascending: true });

      if (error) {
        console.error("Erro ao buscar diretoria:", error);
        throw error;
      }

      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
  });
}
