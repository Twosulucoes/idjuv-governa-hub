// Hook do Canal de Denúncias (módulo integridade).
// Ver nota de tipagem em @/types/integridade — a tabela `denuncias` e a RPC
// `registrar_denuncia_publica` ainda não estão em
// src/integrations/supabase/types.ts (gerado), daí os `as any` pontuais aqui.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  AtualizarDenunciaInput,
  Denuncia,
  RegistrarDenunciaInput,
} from "@/types/integridade";

const QUERY_KEY = ["denuncias"] as const;

/** Envio público do formulário (anônimo ou identificado). Não exige login. */
export function useRegistrarDenuncia() {
  return useMutation({
    mutationFn: async (input: RegistrarDenunciaInput): Promise<string> => {
      const { data, error } = await supabase.rpc("registrar_denuncia_publica" as never, {
        p_anonima: input.anonima,
        p_tipo: input.tipo,
        p_envolvidos: input.envolvidos,
        p_data_ocorrencia: input.dataOcorrencia,
        p_local_ocorrencia: input.localOcorrencia,
        p_descricao: input.descricao,
        p_evidencias: input.evidencias || null,
        p_nome: input.nome || null,
        p_email: input.email || null,
        p_telefone: input.telefone || null,
        p_cargo: input.cargo || null,
      } as never);

      if (error) throw error;
      return data as unknown as string;
    },
  });
}

/** Lista de denúncias para o painel administrativo (exige integridade.gerenciar via RLS). */
export function useDenuncias() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<Denuncia[]> => {
      const { data, error } = await (supabase.from("denuncias" as any) as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as Denuncia[];
    },
    staleTime: 1000 * 30,
  });
}

/** Atualiza status/parecer de uma denúncia (exige integridade.gerenciar via RLS). */
export function useAtualizarDenuncia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, parecer, responsavel }: AtualizarDenunciaInput) => {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await (supabase.from("denuncias" as any) as any)
        .update({
          status,
          parecer: parecer ?? null,
          responsavel: responsavel ?? null,
          atualizado_por: userData.user?.id ?? null,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
