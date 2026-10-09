/**
 * Autoatendimento do servidor: dados do cadastro vinculado ao usuário logado.
 *
 * Somente leitura. A chave é servidores.user_id = auth.uid(); quem não tem
 * cadastro vinculado recebe null (a página orienta a procurar o RH).
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Servidor } from "@/types/rh";

export function useMeuServidor() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["meu-servidor", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<Servidor | null> => {
      const { data, error } = await supabase
        .from("servidores")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // Cargo e unidade atuais buscados à parte (mesmo padrão de ServidorDetalhePage)
      const [cargoRes, unidadeRes] = await Promise.all([
        data.cargo_atual_id
          ? supabase.from("cargos").select("id, nome, sigla").eq("id", data.cargo_atual_id).maybeSingle()
          : Promise.resolve({ data: null }),
        data.unidade_atual_id
          ? supabase.from("estrutura_organizacional").select("id, nome, sigla").eq("id", data.unidade_atual_id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      return {
        ...(data as unknown as Servidor),
        cargo: cargoRes.data ?? undefined,
        unidade: unidadeRes.data ?? undefined,
      };
    },
  });
}
