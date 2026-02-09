/**
 * Hook para cadastro simplificado de bens patrimoniais
 * Usado pelo módulo externo de patrimônio
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  // Gerar número de tombamento
  const gerarTombamento = async (unidadeLocalId: string): Promise<string> => {
    const { data, error } = await supabase
      .rpc("gerar_numero_tombamento", { p_unidade_local_id: unidadeLocalId });

    if (error) throw error;
    return data as string;
  };

  // Cadastrar bem
  const cadastrarBemMutation = useMutation({
    mutationFn: async (payload: NovoBemPayload) => {
      setIsSubmitting(true);

      // Gerar ou usar tombamento existente
      let numeroPatrimonio: string;
      if (payload.possui_tombamento_externo && payload.numero_patrimonio_externo) {
        numeroPatrimonio = payload.numero_patrimonio_externo;
      } else {
        numeroPatrimonio = await gerarTombamento(payload.unidade_local_id);
      }

      // Inserir bem
      const { data, error } = await supabase
        .from("bens_patrimoniais")
        .insert({
          numero_patrimonio: numeroPatrimonio,
          descricao: payload.descricao,
          categoria_bem: payload.categoria_bem,
          subcategoria: payload.subcategoria,
          marca: payload.marca,
          modelo: payload.modelo,
          numero_serie: payload.numero_serie,
          estado_conservacao: payload.estado_conservacao,
          localizacao_especifica: payload.localizacao_especifica,
          forma_aquisicao: payload.forma_aquisicao,
          processo_sei: payload.processo_sei,
          nota_fiscal: payload.nota_fiscal,
          data_nota_fiscal: payload.data_nota_fiscal || null,
          fornecedor_cnpj_cpf: payload.fornecedor_cnpj_cpf,
          observacao: payload.observacao,
          unidade_local_id: payload.unidade_local_id,
          situacao: "ativo",
          data_aquisicao: new Date().toISOString().split("T")[0],
          valor_aquisicao: 0, // Não obrigatório no cadastro simplificado
          codigo_qr: numeroPatrimonio, // Usa o mesmo número para QR
        })
        .select()
        .single();

      if (error) throw error;
      return { ...data, numero_patrimonio: numeroPatrimonio };
    },
    onSuccess: (data) => {
      toast.success(`Bem cadastrado com sucesso! Tombamento: ${data.numero_patrimonio}`);
      queryClient.invalidateQueries({ queryKey: ["bens-patrimoniais"] });
    },
    onError: (error: any) => {
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
    gerarTombamento,
  };
}
