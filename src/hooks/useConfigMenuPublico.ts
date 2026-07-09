/**
 * Hook para gerenciar a visibilidade dos itens do menu de navegação do site público
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ConfigMenuPublico {
  id: string;
  chave: string;
  label: string;
  visivel: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;
}

export function useConfigMenuPublico() {
  return useQuery({
    queryKey: ["config-menu-publico"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("config_menu_publico" as any)
        .select("*")
        .order("ordem", { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as ConfigMenuPublico[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useToggleMenuVisivel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, visivel }: { id: string; visivel: boolean }) => {
      const { data, error } = await supabase
        .from("config_menu_publico" as any)
        .update({ visivel, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as ConfigMenuPublico;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["config-menu-publico"] });
      toast.success(data.visivel ? `"${data.label}" visível no site` : `"${data.label}" oculto do site`);
    },
    onError: (error: any) => {
      toast.error("Erro ao alterar visibilidade: " + error.message);
    },
  });
}
