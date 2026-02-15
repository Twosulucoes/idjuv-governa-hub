/**
 * Hook para Alterações Orçamentárias
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/useAuditLog";
import type { AlteracaoOrcamentaria, TipoAlteracaoOrcamentaria } from "@/types/financeiro";

interface FiltrosAlteracao {
  exercicio?: number;
  status?: string;
  tipo?: string;
}

export function useAlteracoesOrcamentarias(filtros?: FiltrosAlteracao) {
  const ano = filtros?.exercicio || new Date().getFullYear();

  return useQuery({
    queryKey: ["fin_alteracoes_orcamentarias", filtros],
    queryFn: async () => {
      let query = supabase
        .from("fin_alteracoes_orcamentarias")
        .select(`
          *,
          dotacao_origem:fin_dotacoes!fin_alteracoes_orcamentarias_dotacao_origem_id_fkey(id, codigo_dotacao, saldo_disponivel),
          dotacao_destino:fin_dotacoes!fin_alteracoes_orcamentarias_dotacao_destino_id_fkey(id, codigo_dotacao, valor_atual)
        `)
        .eq("exercicio", ano)
        .order("data_alteracao", { ascending: false });

      if (filtros?.status && filtros.status !== "todos") {
        query = query.eq("status", filtros.status as any);
      }
      if (filtros?.tipo && filtros.tipo !== "todos") {
        query = query.eq("tipo", filtros.tipo as any);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as AlteracaoOrcamentaria[];
    },
  });
}

interface CriarAlteracaoInput {
  exercicio: number;
  tipo: TipoAlteracaoOrcamentaria;
  dotacao_origem_id?: string | null;
  dotacao_destino_id?: string | null;
  valor: number;
  justificativa: string;
  fundamentacao_legal?: string | null;
}

export function useCriarAlteracaoOrcamentaria() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { logCreate } = useAuditLog();

  return useMutation({
    mutationFn: async (dados: CriarAlteracaoInput) => {
      // Generate numero
      const { data: numero } = await supabase.rpc("fn_gerar_numero_financeiro", {
        p_tipo: "alteracao",
        p_exercicio: dados.exercicio,
      });

      const numeroGerado = numero || `ALT-${Date.now()}`;

      const { data, error } = await supabase
        .from("fin_alteracoes_orcamentarias")
        .insert({
          numero: numeroGerado,
          exercicio: dados.exercicio,
          tipo: dados.tipo,
          data_alteracao: new Date().toISOString().split("T")[0],
          dotacao_origem_id: dados.dotacao_origem_id,
          dotacao_destino_id: dados.dotacao_destino_id,
          valor: dados.valor,
          justificativa: dados.justificativa,
          fundamentacao_legal: dados.fundamentacao_legal,
          status: "rascunho" as const,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      logCreate('fin_alteracoes_orcamentarias', data.id, data, 'financeiro');
      queryClient.invalidateQueries({ queryKey: ["fin_alteracoes_orcamentarias"] });
      queryClient.invalidateQueries({ queryKey: ["fin_dotacoes"] });
      queryClient.invalidateQueries({ queryKey: ["fin_resumo_orcamentario"] });
      toast({ title: "Alteração orçamentária registrada com sucesso" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao registrar alteração",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
