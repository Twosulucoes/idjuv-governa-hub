/**
 * Hook para cadastro em lote de bens patrimoniais
 * Gera sequência automática de tombamentos
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { CategoriaBem, EstadoConservacao, FormaAquisicao } from "./useCadastroBemSimplificado";

export interface CadastroLotePayload {
  unidade_local_id: string;
  quantidade: number;
  descricao: string;
  categoria_bem: CategoriaBem;
  subcategoria?: string;
  marca?: string;
  modelo?: string;
  estado_conservacao: EstadoConservacao;
  localizacao_especifica?: string;
  forma_aquisicao: FormaAquisicao;
  processo_sei?: string;
  nota_fiscal?: string;
  data_nota_fiscal?: string;
  observacao?: string;
}

export interface CadastroLoteResult {
  sucesso: number;
  falhas: number;
  tombamentos: string[];
}

export function useCadastroLote() {
  const queryClient = useQueryClient();
  const [progresso, setProgresso] = useState({ atual: 0, total: 0 });

  const cadastrarLoteMutation = useMutation({
    mutationFn: async (payload: CadastroLotePayload): Promise<CadastroLoteResult> => {
      const { quantidade, ...dadosBem } = payload;
      const tombamentos: string[] = [];
      let falhas = 0;

      setProgresso({ atual: 0, total: quantidade });

      for (let i = 0; i < quantidade; i++) {
        try {
          // Gerar tombamento sequencial via RPC
          const { data: numeroPatrimonio, error: rpcError } = await supabase
            .rpc("gerar_numero_tombamento", { p_unidade_local_id: dadosBem.unidade_local_id });

          if (rpcError) throw rpcError;

          // Inserir bem
          const { error: insertError } = await supabase
            .from("bens_patrimoniais")
            .insert({
              numero_patrimonio: numeroPatrimonio,
              descricao: dadosBem.descricao,
              categoria_bem: dadosBem.categoria_bem,
              subcategoria: dadosBem.subcategoria,
              marca: dadosBem.marca,
              modelo: dadosBem.modelo,
              estado_conservacao: dadosBem.estado_conservacao,
              localizacao_especifica: dadosBem.localizacao_especifica,
              forma_aquisicao: dadosBem.forma_aquisicao,
              processo_sei: dadosBem.processo_sei,
              nota_fiscal: dadosBem.nota_fiscal,
              data_nota_fiscal: dadosBem.data_nota_fiscal || null,
              observacao: dadosBem.observacao,
              unidade_local_id: dadosBem.unidade_local_id,
              situacao: "ativo",
              data_aquisicao: new Date().toISOString().split("T")[0],
              valor_aquisicao: 0,
              codigo_qr: numeroPatrimonio,
            });

          if (insertError) throw insertError;

          tombamentos.push(numeroPatrimonio);
        } catch (error) {
          console.error(`Erro ao cadastrar item ${i + 1}:`, error);
          falhas++;
        }

        setProgresso({ atual: i + 1, total: quantidade });
      }

      return {
        sucesso: tombamentos.length,
        falhas,
        tombamentos,
      };
    },
    onSuccess: (result) => {
      if (result.sucesso > 0) {
        toast.success(
          `${result.sucesso} bens cadastrados com sucesso!` +
          (result.falhas > 0 ? ` (${result.falhas} falhas)` : "")
        );
      } else {
        toast.error("Nenhum bem foi cadastrado. Verifique os erros.");
      }
      queryClient.invalidateQueries({ queryKey: ["bens-patrimoniais"] });
      queryClient.invalidateQueries({ queryKey: ["patrimonio-unidade"] });
      setProgresso({ atual: 0, total: 0 });
    },
    onError: (error: Error) => {
      toast.error(`Erro no cadastro em lote: ${error.message}`);
      setProgresso({ atual: 0, total: 0 });
    },
  });

  return {
    cadastrarLote: cadastrarLoteMutation.mutateAsync,
    isPending: cadastrarLoteMutation.isPending,
    progresso,
  };
}
