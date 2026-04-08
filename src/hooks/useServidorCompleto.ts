import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { 
  TipoServidor, 
  TipoLotacao,
  StatusProvimento,
  Provimento,
  Cessao,
  LotacaoCompleta,
  ServidorSituacao 
} from "@/types/servidor";

// ============================================================
// QUERIES
// ============================================================

export function useServidoresSituacao() {
  return useQuery({
    queryKey: ["servidores-situacao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_servidores_situacao")
        .select("*")
        .order("nome_completo");
      if (error) throw error;
      return data as ServidorSituacao[];
    },
  });
}

// Queries legadas de provimentos e lotacoes foram removidas.
// Use useVinculosServidor de @/hooks/useVinculosServidor como fonte única de verdade.

export function useCessoesServidor(servidorId: string | undefined) {
  return useQuery({
    queryKey: ["cessoes", servidorId],
    queryFn: async () => {
      if (!servidorId) return [];
      const { data, error } = await supabase
        .from("cessoes")
        .select(`*, unidade_idjuv:estrutura_organizacional(id, nome, sigla)`)
        .eq("servidor_id", servidorId)
        .order("data_inicio", { ascending: false });
      if (error) throw error;
      return data as Cessao[];
    },
    enabled: !!servidorId,
  });
}

// ============================================================
// HELPER: Invalidar todos os caches relacionados ao servidor
// ============================================================

function invalidateServidorCaches(queryClient: ReturnType<typeof useQueryClient>, servidorId: string) {
  queryClient.invalidateQueries({ queryKey: ["provimentos", servidorId] });
  queryClient.invalidateQueries({ queryKey: ["cessoes", servidorId] });
  queryClient.invalidateQueries({ queryKey: ["lotacoes-servidor", servidorId] });
  queryClient.invalidateQueries({ queryKey: ["historico-funcional", servidorId] });
  queryClient.invalidateQueries({ queryKey: ["portarias-servidor", servidorId] });
  queryClient.invalidateQueries({ queryKey: ["servidores-situacao"] });
  queryClient.invalidateQueries({ queryKey: ["servidores-rh"] });
  queryClient.invalidateQueries({ queryKey: ["portarias"] });
}

// ============================================================
// HELPER: Registrar no histórico funcional
// ============================================================

type TipoMovimentacao = "nomeacao" | "exoneracao" | "designacao" | "dispensa" | "promocao" | "transferencia" | "cessao" | "requisicao" | "redistribuicao" | "remocao" | "afastamento" | "retorno" | "aposentadoria" | "vacancia";

async function registrarHistoricoFuncional(params: {
  servidor_id: string;
  tipo: TipoMovimentacao;
  data_evento: string;
  cargo_anterior_id?: string | null;
  cargo_novo_id?: string | null;
  unidade_anterior_id?: string | null;
  unidade_nova_id?: string | null;
  portaria_numero?: string | null;
  portaria_data?: string | null;
  descricao?: string;
}) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from("historico_funcional")
      .insert({
        servidor_id: params.servidor_id,
        tipo: params.tipo,
        data_evento: params.data_evento,
        data_vigencia_inicio: params.data_evento,
        cargo_anterior_id: params.cargo_anterior_id || null,
        cargo_novo_id: params.cargo_novo_id || null,
        unidade_anterior_id: params.unidade_anterior_id || null,
        unidade_nova_id: params.unidade_nova_id || null,
        portaria_numero: params.portaria_numero || null,
        portaria_data: params.portaria_data || null,
        descricao: params.descricao || null,
        created_by: userData?.user?.id,
      });
    
    if (error) {
      console.error("[Histórico Funcional] Erro ao registrar:", error);
    }
  } catch (e) {
    console.error("[Histórico Funcional] Erro inesperado:", e);
  }
}

// ============================================================
// HELPER: Gerar minuta de portaria na tabela documentos
// ============================================================

type CategoriaPortaria = "estruturante" | "normativa" | "pessoal" | "delegacao" | "nomeacao" | "exoneracao" | "designacao" | "dispensa" | "cessao" | "ferias" | "licenca";

async function gerarMinutaPortaria(params: {
  titulo: string;
  ementa: string;
  categoria: CategoriaPortaria;
  servidores_ids: string[];
  cargo_id?: string;
  unidade_id?: string;
  data_documento?: string;
  provimento_id?: string;
}) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const dataDoc = params.data_documento || new Date().toISOString().split("T")[0];
    const ano = new Date(dataDoc).getFullYear();

    // Gerar número automático
    let numero = `PENDENTE/${ano}`;
    try {
      const { data: numData } = await supabase.rpc("gerar_numero_portaria", { p_ano: ano });
      if (numData) numero = numData as string;
    } catch {
      // keep default
    }

    const { data, error } = await supabase
      .from("documentos")
      .insert({
        tipo: "portaria" as const,
        categoria: params.categoria,
        status: "minuta" as const,
        titulo: params.titulo,
        ementa: params.ementa,
        numero,
        data_documento: dataDoc,
        servidores_ids: params.servidores_ids,
        cargo_id: params.cargo_id || null,
        unidade_id: params.unidade_id || null,
        provimento_id: params.provimento_id || null,
        created_by: userData?.user?.id,
      })
      .select("id, numero")
      .single();

    if (error) {
      console.error("[Portaria] Erro ao gerar minuta:", error);
      return null;
    }
    
    return data;
  } catch (e) {
    console.error("[Portaria] Erro inesperado:", e);
    return null;
  }
}

// Mutations legadas de provimentos/lotações removidas.
// Use useVinculoMutations de @/hooks/useVinculosServidor.


/**
 * Atualizar tipo_servidor
 */
export function useUpdateTipoServidor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      servidorId, 
      tipoServidor,
      orgaoOrigem,
      orgaoDestino,
      funcaoExercida
    }: { 
      servidorId: string; 
      tipoServidor: TipoServidor;
      orgaoOrigem?: string;
      orgaoDestino?: string;
      funcaoExercida?: string;
    }) => {
      const { data, error } = await supabase
        .from("servidores")
        .update({
          tipo_servidor: tipoServidor,
          orgao_origem: orgaoOrigem,
          orgao_destino_cessao: orgaoDestino,
          funcao_exercida: funcaoExercida,
        })
        .eq("id", servidorId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      invalidateServidorCaches(queryClient, vars.servidorId);
      toast.success("Tipo de servidor atualizado!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar tipo: ${error.message}`);
    },
  });
}
