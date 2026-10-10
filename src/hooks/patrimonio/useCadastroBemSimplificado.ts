/**
 * Hook para cadastro simplificado de bens patrimoniais
 * Usado pelo módulo externo de patrimônio
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { buscarBemPorCodigo } from "./useBuscarBemPorCodigo";

export type CategoriaBem = "mobiliario" | "informatica" | "equipamento_esportivo" | "veiculo" | "eletrodomestico" | "outros";
export type FormaAquisicao = "compra" | "doacao" | "cessao" | "transferencia";
export type EstadoConservacao = "otimo" | "bom" | "regular" | "ruim" | "inservivel";

export interface NovoBemPayload {
  unidade_local_id: string;
  descricao: string;
  categoria_bem: CategoriaBem;
  subcategoria?: string;
  marca?: string;
  modelo?: string;
  numero_serie?: string;
  estado_conservacao: EstadoConservacao;
  localizacao_especifica?: string;
  forma_aquisicao: FormaAquisicao;
  processo_sei?: string;
  nota_fiscal?: string;
  data_nota_fiscal?: string;
  fornecedor_cnpj_cpf?: string;
  observacao?: string;
  possui_tombamento_externo?: boolean;
  numero_patrimonio_externo?: string;
}

export interface UnidadeLocal {
  id: string;
  nome_unidade: string;
  codigo_unidade: string;
  tipo_unidade: string;
  municipio: string;
}

/** Bem como gravado pelo banco (com o número de tombamento gerado). */
export type BemCadastrado = Tables<"bens_patrimoniais">;

/** Traduz erros do PostgREST no cadastro de bens para mensagens legíveis. */
export function mensagemErroCadastroBem(error: { code?: string; message: string }): string {
  if (error.code === "23505") {
    return "Número de tombamento já existe. Tente novamente; se persistir, avise o administrador.";
  }
  if (error.code === "42501") {
    return error.message || "Sem permissão para cadastrar bens.";
  }
  return error.message;
}

// Labels para categorias
export const CATEGORIAS_LABEL: Record<CategoriaBem, string> = {
  mobiliario: "Mobiliário",
  informatica: "Equipamentos de TI",
  equipamento_esportivo: "Equipamentos Esportivos",
  veiculo: "Veículos e Transporte",
  eletrodomestico: "Eletrodomésticos",
  outros: "Outros",
};

export const FORMAS_AQUISICAO_LABEL: Record<FormaAquisicao, string> = {
  compra: "Compra/Licitação",
  doacao: "Doação",
  cessao: "Cessão",
  transferencia: "Transferência",
};

export const ESTADOS_CONSERVACAO_LABEL: Record<EstadoConservacao, string> = {
  otimo: "Ótimo",
  bom: "Bom",
  regular: "Regular",
  ruim: "Ruim",
  inservivel: "Inservível",
};

export function useCadastroBemSimplificado() {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Buscar unidades locais ativas
  const { data: unidadesLocais = [], isLoading: loadingUnidades } = useQuery({
    queryKey: ["unidades-locais-ativas"],
    queryFn: async (): Promise<UnidadeLocal[]> => {
      const { data, error } = await supabase
        .from("unidades_locais")
        .select("id, nome_unidade, codigo_unidade, tipo_unidade, municipio")
        .eq("status", "ativa")
        .order("nome_unidade");

      if (error) {
        console.error("Erro ao buscar unidades:", error);
        throw error;
      }
      return data || [];
    },
  });

  // Cadastrar bem.
  // O número de tombamento é SEMPRE gerado pelo banco (trigger: PAT-AAAA-NNNNNN,
  // codigo_qr = número). Um tombamento externo/anterior (plaqueta antiga) vai para
  // patrimonio_anterior e continua achável pela busca por código.
  const cadastrarBemMutation = useMutation({
    mutationFn: async (payload: NovoBemPayload): Promise<BemCadastrado> => {
      setIsSubmitting(true);

      const patrimonioAnterior = payload.possui_tombamento_externo
        ? payload.numero_patrimonio_externo?.trim().toUpperCase() || null
        : null;

      // Bloqueia duplicidade: plaqueta antiga já usada como número, QR ou anterior.
      if (patrimonioAnterior) {
        const existente = await buscarBemPorCodigo(patrimonioAnterior);
        if (existente) {
          throw new Error(
            `Já existe o bem ${existente.numero_patrimonio} (${existente.descricao}) com esse número.`,
          );
        }
      }

      // Sem numero_patrimonio/codigo_qr: o banco gera. O tipo gerado ainda exige
      // numero_patrimonio no Insert, daí o cast.
      const novoBem = {
        descricao: payload.descricao.trim(),
        categoria_bem: payload.categoria_bem,
        subcategoria: payload.subcategoria?.trim() || null,
        marca: payload.marca?.trim() || null,
        modelo: payload.modelo?.trim() || null,
        numero_serie: payload.numero_serie?.trim() || null,
        estado_conservacao: payload.estado_conservacao,
        localizacao_especifica: payload.localizacao_especifica?.trim() || null,
        forma_aquisicao: payload.forma_aquisicao,
        processo_sei: payload.processo_sei?.trim() || null,
        nota_fiscal: payload.nota_fiscal?.trim() || null,
        data_nota_fiscal: payload.data_nota_fiscal || null,
        fornecedor_cnpj_cpf: payload.fornecedor_cnpj_cpf?.trim() || null,
        observacao: payload.observacao?.trim() || null,
        patrimonio_anterior: patrimonioAnterior,
        unidade_local_id: payload.unidade_local_id,
        situacao: "ativo",
        data_aquisicao: new Date().toISOString().split("T")[0],
        valor_aquisicao: 0,
      } as unknown as TablesInsert<"bens_patrimoniais">;

      const { data, error } = await supabase
        .from("bens_patrimoniais")
        .insert(novoBem)
        .select()
        .single();

      if (error) throw new Error(mensagemErroCadastroBem(error));
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Bem cadastrado com sucesso! Tombamento: ${data.numero_patrimonio}`);
      queryClient.invalidateQueries({ queryKey: ["bens-patrimoniais"] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao cadastrar bem: ${error.message}`);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  return {
    unidadesLocais,
    loadingUnidades,
    cadastrarBem: cadastrarBemMutation.mutateAsync,
    isSubmitting,
  };
}
