/**
 * Hook para gerenciar configuração de páginas públicas
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ConfigPaginaPublica {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  rota: string;
  ativo: boolean;
  em_manutencao: boolean;
  mensagem_manutencao: string | null;
  titulo_manutencao: string | null;
  previsao_retorno: string | null;
  alterado_por: string | null;
  created_at: string;
  updated_at: string;
}

export interface HistoricoPagina {
  id: string;
  pagina_id: string;
  acao: string;
  dados_anteriores: any;
  dados_novos: any;
  usuario_id: string | null;
  created_at: string;
}

// ACESSO TOTAL: Sem consulta ao banco - retorna lista vazia
export function usePaginasPublicas() {
  return { data: [] as ConfigPaginaPublica[], isLoading: false, error: null };
}

// ACESSO TOTAL: Sem consulta ao banco - página sempre ativa
export function useStatusPagina(_rota: string) {
  return { data: null, isLoading: false, error: null };
}

// Hook para buscar histórico de uma página
export function useHistoricoPagina(paginaId: string | null) {
  return useQuery({
    queryKey: ["historico-pagina", paginaId],
    queryFn: async () => {
      if (!paginaId) return [];
      
      const { data, error } = await supabase
        .from("config_paginas_historico")
        .select("*")
        .eq("pagina_id", paginaId)
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as HistoricoPagina[];
    },
    enabled: !!paginaId,
  });
}

// Mutation para alternar manutenção
export function useToggleManutencao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      emManutencao,
      mensagem,
      titulo,
      previsao 
    }: { 
      id: string; 
      emManutencao: boolean;
      mensagem?: string;
      titulo?: string;
      previsao?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("config_paginas_publicas")
        .update({
          em_manutencao: emManutencao,
          mensagem_manutencao: mensagem,
          titulo_manutencao: titulo,
          previsao_retorno: previsao,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["config-paginas-publicas"] });
      queryClient.invalidateQueries({ queryKey: ["status-pagina"] });
      toast.success(
        data.em_manutencao 
          ? `"${data.nome}" colocada em manutenção` 
          : `"${data.nome}" retirada de manutenção`
      );
    },
    onError: (error: any) => {
      toast.error("Erro ao alterar status: " + error.message);
    },
  });
}

// Mutation para ativar/desativar página
export function useToggleAtivoPagina() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { data, error } = await supabase
        .from("config_paginas_publicas")
        .update({
          ativo,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["config-paginas-publicas"] });
      queryClient.invalidateQueries({ queryKey: ["status-pagina"] });
      toast.success(
        data.ativo 
          ? `"${data.nome}" ativada` 
          : `"${data.nome}" desativada`
      );
    },
    onError: (error: any) => {
      toast.error("Erro ao alterar status: " + error.message);
    },
  });
}

// Mutation para atualizar configuração da página
export function useAtualizarPagina() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id,
      mensagem_manutencao,
      titulo_manutencao,
      previsao_retorno,
    }: { 
      id: string;
      mensagem_manutencao?: string;
      titulo_manutencao?: string;
      previsao_retorno?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("config_paginas_publicas")
        .update({
          mensagem_manutencao,
          titulo_manutencao,
          previsao_retorno,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config-paginas-publicas"] });
      toast.success("Configuração atualizada");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });
}
