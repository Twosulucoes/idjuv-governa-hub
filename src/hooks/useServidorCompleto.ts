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

// Hook para buscar servidores com situação completa
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

// Hook para buscar provimentos de um servidor
export function useProvimentosServidor(servidorId: string | undefined) {
  return useQuery({
    queryKey: ["provimentos", servidorId],
    queryFn: async () => {
      if (!servidorId) return [];
      const { data, error } = await supabase
        .from("provimentos")
        .select(`
          *,
          cargo:cargos(id, nome, sigla, natureza),
          unidade:estrutura_organizacional(id, nome, sigla)
        `)
        .eq("servidor_id", servidorId)
        .order("data_nomeacao", { ascending: false });
      
      if (error) throw error;
      return data as Provimento[];
    },
    enabled: !!servidorId,
  });
}

// Hook para buscar cessões de um servidor
export function useCessoesServidor(servidorId: string | undefined) {
  return useQuery({
    queryKey: ["cessoes", servidorId],
    queryFn: async () => {
      if (!servidorId) return [];
      const { data, error } = await supabase
        .from("cessoes")
        .select(`
          *,
          unidade_idjuv:estrutura_organizacional(id, nome, sigla)
        `)
        .eq("servidor_id", servidorId)
        .order("data_inicio", { ascending: false });
      
      if (error) throw error;
      return data as Cessao[];
    },
    enabled: !!servidorId,
  });
}

// Hook para buscar lotações de um servidor
export function useLotacoesServidor(servidorId: string | undefined) {
  return useQuery({
    queryKey: ["lotacoes-servidor", servidorId],
    queryFn: async () => {
      if (!servidorId) return [];
      const { data, error } = await supabase
        .from("lotacoes")
        .select(`
          *,
          unidade:estrutura_organizacional(id, nome, sigla),
          cargo:cargos(id, nome, sigla)
        `)
        .eq("servidor_id", servidorId)
        .order("data_inicio", { ascending: false });
      
      if (error) throw error;
      return data as LotacaoCompleta[];
    },
    enabled: !!servidorId,
  });
}

// Mutations

// Criar provimento
export function useCreateProvimento() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (provimento: Omit<Provimento, 'id' | 'created_at' | 'cargo' | 'unidade'>) => {
      const { data, error } = await supabase
        .from("provimentos")
        .insert(provimento)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["provimentos", data.servidor_id] });
      queryClient.invalidateQueries({ queryKey: ["servidores-situacao"] });
      queryClient.invalidateQueries({ queryKey: ["servidores-rh"] });
      toast.success("Provimento/Nomeação criado!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar provimento: ${error.message}`);
    },
  });
}

// Encerrar provimento
export function useEncerrarProvimento() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      provimentoId, 
      motivo, 
      dataEncerramento,
      atoTipo,
      atoNumero,
      atoData 
    }: { 
      provimentoId: string; 
      motivo: string;
      dataEncerramento: string;
      atoTipo?: string;
      atoNumero?: string;
      atoData?: string;
    }) => {
      const { data, error } = await supabase
        .from("provimentos")
        .update({
          status: 'encerrado' as StatusProvimento,
          data_encerramento: dataEncerramento,
          motivo_encerramento: motivo,
          ato_encerramento_tipo: atoTipo,
          ato_encerramento_numero: atoNumero,
          ato_encerramento_data: atoData,
        })
        .eq("id", provimentoId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["provimentos", data.servidor_id] });
      queryClient.invalidateQueries({ queryKey: ["servidores-situacao"] });
      toast.success("Provimento encerrado!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao encerrar provimento: ${error.message}`);
    },
  });
}

// Criar cessão
export function useCreateCessao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (cessao: Omit<Cessao, 'id' | 'created_at' | 'unidade_idjuv'>) => {
      const { data, error } = await supabase
        .from("cessoes")
        .insert(cessao)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cessoes", data.servidor_id] });
      queryClient.invalidateQueries({ queryKey: ["servidores-situacao"] });
      queryClient.invalidateQueries({ queryKey: ["servidores-rh"] });
      toast.success("Cessão registrada!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar cessão: ${error.message}`);
    },
  });
}

// Encerrar cessão (retorno)
export function useEncerrarCessao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      cessaoId, 
      dataRetorno,
      atoRetornoNumero,
      atoRetornoData 
    }: { 
      cessaoId: string; 
      dataRetorno: string;
      atoRetornoNumero?: string;
      atoRetornoData?: string;
    }) => {
      const { data, error } = await supabase
        .from("cessoes")
        .update({
          ativa: false,
          data_fim: dataRetorno,
          data_retorno: dataRetorno,
          ato_retorno_numero: atoRetornoNumero,
          ato_retorno_data: atoRetornoData,
        })
        .eq("id", cessaoId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cessoes", data.servidor_id] });
      queryClient.invalidateQueries({ queryKey: ["servidores-situacao"] });
      toast.success("Cessão encerrada - Servidor retornou!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao encerrar cessão: ${error.message}`);
    },
  });
}

// Criar lotação
export function useCreateLotacao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (lotacao: {
      servidor_id: string;
      unidade_id: string;
      cargo_id?: string;
      tipo_lotacao: TipoLotacao;
      data_inicio: string;
      funcao_exercida?: string;
      orgao_externo?: string;
      ato_numero?: string;
      ato_data?: string;
      tipo_movimentacao?: string;
      observacao?: string;
    }) => {
      const { data, error } = await supabase
        .from("lotacoes")
        .insert({
          ...lotacao,
          ativo: true,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["lotacoes-servidor", data.servidor_id] });
      queryClient.invalidateQueries({ queryKey: ["servidores-situacao"] });
      queryClient.invalidateQueries({ queryKey: ["servidores-rh"] });
      toast.success("Lotação criada!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar lotação: ${error.message}`);
    },
  });
}

// Atualizar tipo_servidor manualmente
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servidores-rh"] });
      queryClient.invalidateQueries({ queryKey: ["servidores-situacao"] });
      toast.success("Tipo de servidor atualizado!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar tipo: ${error.message}`);
    },
  });
}
