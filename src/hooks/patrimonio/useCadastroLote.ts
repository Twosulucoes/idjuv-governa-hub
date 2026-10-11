/**
 * Hook para cadastro em lote de bens patrimoniais
 * Os números de tombamento são gerados pelo banco (um por linha do INSERT em lote)
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { TablesInsert } from "@/integrations/supabase/types";
import {
  mensagemErroCadastroBem,
  type CategoriaBem,
  type EstadoConservacao,
  type FormaAquisicao,
} from "./useCadastroBemSimplificado";

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
  /** Bens criados (para impressão de etiquetas). */
  bens: Array<{ numero_patrimonio: string; descricao: string; codigo_qr: string | null }>;
  /** Mensagem do banco quando o lote inteiro falhou (o INSERT é atômico). */
  erro?: string;
}

export function useCadastroLote() {
  const queryClient = useQueryClient();
  const [progresso, setProgresso] = useState({ atual: 0, total: 0 });

  const cadastrarLoteMutation = useMutation({
    mutationFn: async (payload: CadastroLotePayload): Promise<CadastroLoteResult> => {
      const { quantidade, ...dadosBem } = payload;

      setProgresso({ atual: 0, total: quantidade });

      // Um único INSERT em lote, sem numero_patrimonio/codigo_qr: o banco gera um
      // número por linha (sequence, sem corrida). O INSERT é atômico: ou entram
      // todos, ou nenhum. O tipo gerado ainda exige numero_patrimonio, daí o cast.
      const linha = {
        descricao: dadosBem.descricao.trim(),
        categoria_bem: dadosBem.categoria_bem,
        subcategoria: dadosBem.subcategoria?.trim() || null,
        marca: dadosBem.marca?.trim() || null,
        modelo: dadosBem.modelo?.trim() || null,
        estado_conservacao: dadosBem.estado_conservacao,
        localizacao_especifica: dadosBem.localizacao_especifica?.trim() || null,
        forma_aquisicao: dadosBem.forma_aquisicao,
        processo_sei: dadosBem.processo_sei?.trim() || null,
        nota_fiscal: dadosBem.nota_fiscal?.trim() || null,
        data_nota_fiscal: dadosBem.data_nota_fiscal || null,
        observacao: dadosBem.observacao?.trim() || null,
        unidade_local_id: dadosBem.unidade_local_id,
        situacao: "ativo",
        data_aquisicao: new Date().toISOString().split("T")[0],
        valor_aquisicao: 0,
      };
      const linhas = Array.from({ length: quantidade }, () => ({ ...linha })) as unknown as TablesInsert<"bens_patrimoniais">[];

      const { data, error } = await supabase
        .from("bens_patrimoniais")
        .insert(linhas)
        .select("numero_patrimonio, descricao, codigo_qr");

      if (error) {
        console.error("Erro no cadastro em lote:", error.code);
        return { sucesso: 0, falhas: quantidade, tombamentos: [], bens: [], erro: mensagemErroCadastroBem(error) };
      }

      const bens = [...(data ?? [])].sort((a, b) => a.numero_patrimonio.localeCompare(b.numero_patrimonio));
      const tombamentos = bens.map((b) => b.numero_patrimonio);
      setProgresso({ atual: quantidade, total: quantidade });

      return {
        sucesso: tombamentos.length,
        falhas: quantidade - tombamentos.length,
        tombamentos,
        bens,
      };
    },
    onSuccess: (result) => {
      if (result.sucesso > 0) {
        toast.success(
          `${result.sucesso} bens cadastrados com sucesso!` +
          (result.falhas > 0 ? ` (${result.falhas} falhas)` : "")
        );
      } else {
        toast.error(result.erro ? `Nenhum bem foi cadastrado: ${result.erro}` : "Nenhum bem foi cadastrado. Verifique os erros.");
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
