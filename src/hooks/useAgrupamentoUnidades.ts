/**
 * Hook para gerenciar agrupamentos de unidades para impressão em lote
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AgrupamentoUnidade {
  id: string;
  nome: string;
  descricao?: string;
  cor?: string;
  ordem: number;
  ativo: boolean;
  unidades: UnidadeVinculada[];
}

export interface UnidadeVinculada {
  id: string;
  unidade_id: string;
  nome: string;
  sigla?: string;
  tipo: string;
  ordem: number;
}

// Buscar todos os agrupamentos com suas unidades vinculadas
export function useAgrupamentosUnidades() {
  return useQuery({
    queryKey: ["agrupamentos-unidades"],
    queryFn: async () => {
      // Buscar agrupamentos
      const { data: agrupamentos, error: errAgrup } = await supabase
        .from("config_agrupamento_unidades")
        .select("*")
        .eq("ativo", true)
        .order("ordem");

      if (errAgrup) throw errAgrup;

      // Buscar vínculos com unidades
      const { data: vinculos, error: errVinc } = await supabase
        .from("agrupamento_unidade_vinculo")
        .select(`
          id,
          agrupamento_id,
          unidade_id,
          ordem,
          unidade:estrutura_organizacional(id, nome, sigla, tipo)
        `)
        .order("ordem");

      if (errVinc) throw errVinc;

      // Montar estrutura
      const resultado: AgrupamentoUnidade[] = (agrupamentos || []).map((ag) => {
        const vinculosAgrupamento = (vinculos || [])
          .filter((v) => v.agrupamento_id === ag.id)
          .map((v) => {
            const unidade = v.unidade as { id: string; nome: string; sigla?: string; tipo: string } | null;
            return {
              id: v.id,
              unidade_id: v.unidade_id,
              nome: unidade?.nome || "",
              sigla: unidade?.sigla,
              tipo: unidade?.tipo || "",
              ordem: v.ordem || 0,
            };
          })
          .sort((a, b) => a.ordem - b.ordem);

        return {
          id: ag.id,
          nome: ag.nome,
          descricao: ag.descricao,
          cor: ag.cor,
          ordem: ag.ordem || 0,
          ativo: ag.ativo ?? true,
          unidades: vinculosAgrupamento,
        };
      });

      return resultado;
    },
  });
}

// Buscar unidades disponíveis (não vinculadas a nenhum agrupamento)
export function useUnidadesDisponiveis() {
  return useQuery({
    queryKey: ["unidades-disponiveis-agrupamento"],
    queryFn: async () => {
      // Buscar todas as unidades ativas
      const { data: unidades, error: errUnid } = await supabase
        .from("estrutura_organizacional")
        .select("id, nome, sigla, tipo, nivel, superior_id")
        .eq("ativo", true)
        .order("nivel")
        .order("nome");

      if (errUnid) throw errUnid;

      // Buscar vínculos existentes
      const { data: vinculos, error: errVinc } = await supabase
        .from("agrupamento_unidade_vinculo")
        .select("unidade_id");

      if (errVinc) throw errVinc;

      const unidadesVinculadas = new Set((vinculos || []).map((v) => v.unidade_id));

      // Filtrar unidades não vinculadas
      const disponiveis = (unidades || []).filter((u) => !unidadesVinculadas.has(u.id));

      return disponiveis;
    },
  });
}

// Criar novo agrupamento
export function useCriarAgrupamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dados: { nome: string; descricao?: string; cor?: string }) => {
      const { data, error } = await supabase
        .from("config_agrupamento_unidades")
        .insert({
          nome: dados.nome,
          descricao: dados.descricao,
          cor: dados.cor || "#3b82f6",
          ordem: 99,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agrupamentos-unidades"] });
      toast.success("Agrupamento criado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar agrupamento: ${error.message}`);
    },
  });
}

// Atualizar agrupamento
export function useAtualizarAgrupamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dados: { id: string; nome: string; descricao?: string; cor?: string }) => {
      const { error } = await supabase
        .from("config_agrupamento_unidades")
        .update({
          nome: dados.nome,
          descricao: dados.descricao,
          cor: dados.cor,
          updated_at: new Date().toISOString(),
        })
        .eq("id", dados.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agrupamentos-unidades"] });
      toast.success("Agrupamento atualizado!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });
}

// Excluir agrupamento
export function useExcluirAgrupamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("config_agrupamento_unidades")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agrupamentos-unidades"] });
      queryClient.invalidateQueries({ queryKey: ["unidades-disponiveis-agrupamento"] });
      toast.success("Agrupamento excluído!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir: ${error.message}`);
    },
  });
}

// Vincular unidade a agrupamento
export function useVincularUnidade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dados: { agrupamento_id: string; unidade_id: string; ordem?: number }) => {
      const { error } = await supabase
        .from("agrupamento_unidade_vinculo")
        .insert({
          agrupamento_id: dados.agrupamento_id,
          unidade_id: dados.unidade_id,
          ordem: dados.ordem || 0,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agrupamentos-unidades"] });
      queryClient.invalidateQueries({ queryKey: ["unidades-disponiveis-agrupamento"] });
      toast.success("Unidade vinculada ao agrupamento!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao vincular: ${error.message}`);
    },
  });
}

// Desvincular unidade de agrupamento
export function useDesvincularUnidade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vinculoId: string) => {
      const { error } = await supabase
        .from("agrupamento_unidade_vinculo")
        .delete()
        .eq("id", vinculoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agrupamentos-unidades"] });
      queryClient.invalidateQueries({ queryKey: ["unidades-disponiveis-agrupamento"] });
      toast.success("Unidade removida do agrupamento!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao desvincular: ${error.message}`);
    },
  });
}

// Reordenar agrupamentos
export function useReordenarAgrupamentos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ordenacao: { id: string; ordem: number }[]) => {
      for (const item of ordenacao) {
        const { error } = await supabase
          .from("config_agrupamento_unidades")
          .update({ ordem: item.ordem })
          .eq("id", item.id);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agrupamentos-unidades"] });
    },
  });
}
