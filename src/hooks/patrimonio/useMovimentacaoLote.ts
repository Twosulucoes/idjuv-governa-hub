/**
 * Hook para movimentação em lote de bens patrimoniais
 * Transfere múltiplos bens para outra unidade
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MovimentacaoLotePayload {
  bem_ids: string[];
  unidade_destino_id: string;
  responsavel_destino_id?: string;
  tipo_movimentacao: "transferencia_interna" | "cessao" | "emprestimo" | "recolhimento";
  motivo: string;
  observacoes?: string;
}

export interface MovimentacaoLoteResult {
  sucesso: number;
  falhas: number;
}

export function useMovimentacaoLote() {
  const queryClient = useQueryClient();
  const [progresso, setProgresso] = useState({ atual: 0, total: 0 });

  const movimentarLoteMutation = useMutation({
    mutationFn: async (payload: MovimentacaoLotePayload): Promise<MovimentacaoLoteResult> => {
      const { bem_ids, ...dadosMovimentacao } = payload;
      let sucesso = 0;
      let falhas = 0;

      setProgresso({ atual: 0, total: bem_ids.length });

      // Buscar dados dos bens (unidade origem)
      const { data: bens, error: bensError } = await supabase
        .from("bens_patrimoniais")
        .select("id, unidade_local_id")
        .in("id", bem_ids);

      if (bensError) throw bensError;

      const bensMap = new Map(bens?.map(b => [b.id, b.unidade_local_id]) || []);

      for (let i = 0; i < bem_ids.length; i++) {
        const bemId = bem_ids[i];
        const unidadeOrigemId = bensMap.get(bemId);

        try {
          // Criar registro de movimentação
          const { error: movError } = await supabase
            .from("movimentacoes_patrimonio")
            .insert({
              bem_id: bemId,
              tipo: dadosMovimentacao.tipo_movimentacao,
              unidade_local_origem_id: unidadeOrigemId || null,
              unidade_local_destino_id: dadosMovimentacao.unidade_destino_id,
              responsavel_destino_id: dadosMovimentacao.responsavel_destino_id || null,
              motivo: dadosMovimentacao.motivo?.trim() || "",
              observacoes: dadosMovimentacao.observacoes?.trim() || null,
              data_movimentacao: new Date().toISOString().split("T")[0],
              status: "pendente",
            });

          if (movError) throw movError;

          sucesso++;
        } catch (error) {
          console.error(`Erro ao movimentar bem ${bemId}:`, error);
          falhas++;
        }

        setProgresso({ atual: i + 1, total: bem_ids.length });
      }

      return { sucesso, falhas };
    },
    onSuccess: (result) => {
      if (result.sucesso > 0) {
        toast.success(
          `${result.sucesso} movimentações registradas!` +
          (result.falhas > 0 ? ` (${result.falhas} falhas)` : "")
        );
      } else {
        toast.error("Nenhuma movimentação foi registrada.");
      }
      queryClient.invalidateQueries({ queryKey: ["movimentacoes-patrimonio"] });
      queryClient.invalidateQueries({ queryKey: ["bens-patrimoniais"] });
      queryClient.invalidateQueries({ queryKey: ["patrimonio-unidade"] });
      setProgresso({ atual: 0, total: 0 });
    },
    onError: (error: Error) => {
      toast.error(`Erro na movimentação em lote: ${error.message}`);
      setProgresso({ atual: 0, total: 0 });
    },
  });

  return {
    movimentarLote: movimentarLoteMutation.mutateAsync,
    isPending: movimentarLoteMutation.isPending,
    progresso,
  };
}
