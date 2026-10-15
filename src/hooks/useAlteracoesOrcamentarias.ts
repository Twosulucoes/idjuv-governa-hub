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
    queryKey: ["fin_alteracoes_orcamentarias", ano, filtros?.status ?? null, filtros?.tipo ?? null],
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
  processo_sei?: string | null;
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

      // `processo_sei` ainda não está nos tipos gerados (types.ts): payload sem checagem do client
      const payload = {
        numero: numeroGerado,
        exercicio: dados.exercicio,
        tipo: dados.tipo,
        data_alteracao: new Date().toISOString().split("T")[0],
        dotacao_origem_id: dados.dotacao_origem_id,
        dotacao_destino_id: dados.dotacao_destino_id,
        valor: dados.valor,
        justificativa: (dados.justificativa || '').trim(),
        fundamentacao_legal: (dados.fundamentacao_legal || '').trim() || undefined,
        processo_sei: (dados.processo_sei || '').trim() || undefined,
        status: "rascunho" as const,
      };

      const { data, error } = await supabase
        .from("fin_alteracoes_orcamentarias")
        .insert(payload)
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

/**
 * Marca a alteração como lançada no FIPLAN (ação manual de quem conferiu lá).
 * A RPC confere a permissão e grava `situacao_fiplan = 'confirmada'` com a data.
 */
export function useConfirmarAlteracaoFiplan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      // RPC nova: ainda não está nos tipos gerados (types.ts)
      const { error } = await supabase.rpc("confirmar_alteracao_fiplan", { p_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fin_alteracoes_orcamentarias"] });
      toast({ title: "Alteração confirmada no FIPLAN" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao confirmar no FIPLAN",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
