import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Designacao, CreateDesignacaoData, StatusDesignacao } from "@/types/designacao";

export function useDesignacoes(filters?: { status?: StatusDesignacao; unidade_id?: string }) {
  return useQuery({
    queryKey: ["designacoes", filters],
    queryFn: async () => {
      let query = supabase
        .from("designacoes")
        .select(`
          *,
          servidor:servidores!designacoes_servidor_id_fkey(id, nome_completo, matricula, cpf),
          unidade_origem:estrutura_organizacional!designacoes_unidade_origem_id_fkey(id, nome, sigla),
          unidade_destino:estrutura_organizacional!designacoes_unidade_destino_id_fkey(id, nome, sigla),
          lotacao:lotacoes!designacoes_lotacao_id_fkey(
            id,
            cargo:cargos!lotacoes_cargo_id_fkey(id, nome, sigla)
          ),
          aprovador:profiles!designacoes_aprovado_por_fkey(id, full_name)
        `)
        .eq("ativo", true)
        .order("created_at", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.unidade_id) {
        query = query.or(`unidade_origem_id.eq.${filters.unidade_id},unidade_destino_id.eq.${filters.unidade_id}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Designacao[];
    },
  });
}

export function useDesignacaoServidor(servidorId: string) {
  return useQuery({
    queryKey: ["designacoes-servidor", servidorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("designacoes")
        .select(`
          *,
          unidade_origem:estrutura_organizacional!designacoes_unidade_origem_id_fkey(id, nome, sigla),
          unidade_destino:estrutura_organizacional!designacoes_unidade_destino_id_fkey(id, nome, sigla)
        `)
        .eq("servidor_id", servidorId)
        .eq("ativo", true)
        .order("data_inicio", { ascending: false });

      if (error) throw error;
      return data as Designacao[];
    },
    enabled: !!servidorId,
  });
}

export function useDesignacaoAtivaServidor(servidorId: string) {
  return useQuery({
    queryKey: ["designacao-ativa", servidorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("designacoes")
        .select(`
          *,
          unidade_origem:estrutura_organizacional!designacoes_unidade_origem_id_fkey(id, nome, sigla),
          unidade_destino:estrutura_organizacional!designacoes_unidade_destino_id_fkey(id, nome, sigla)
        `)
        .eq("servidor_id", servidorId)
        .eq("status", "aprovada")
        .eq("ativo", true)
        .maybeSingle();

      if (error) throw error;
      return data as Designacao | null;
    },
    enabled: !!servidorId,
  });
}

export function useCreateDesignacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDesignacaoData) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("designacoes").insert({
        ...data,
        status: "pendente",
        ativo: true,
        created_by: userData?.user?.id,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["designacoes"] });
      toast.success("Solicitação de designação criada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar designação: ${error.message}`);
    },
  });
}

export function useAprovarDesignacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (designacaoId: string) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("designacoes")
        .update({
          status: "aprovada",
          aprovado_por: userData?.user?.id,
          data_aprovacao: new Date().toISOString(),
        })
        .eq("id", designacaoId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["designacoes"] });
      toast.success("Designação aprovada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao aprovar designação: ${error.message}`);
    },
  });
}

export function useRejeitarDesignacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ designacaoId, motivo }: { designacaoId: string; motivo: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("designacoes")
        .update({
          status: "rejeitada",
          motivo_rejeicao: motivo,
          aprovado_por: userData?.user?.id,
          data_aprovacao: new Date().toISOString(),
        })
        .eq("id", designacaoId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["designacoes"] });
      toast.success("Designação rejeitada.");
    },
    onError: (error: any) => {
      toast.error(`Erro ao rejeitar designação: ${error.message}`);
    },
  });
}

export function useEncerrarDesignacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ designacaoId, dataFim }: { designacaoId: string; dataFim?: string }) => {
      const { error } = await supabase
        .from("designacoes")
        .update({
          status: "encerrada",
          data_fim: dataFim || new Date().toISOString().split("T")[0],
        })
        .eq("id", designacaoId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["designacoes"] });
      toast.success("Designação encerrada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao encerrar designação: ${error.message}`);
    },
  });
}
