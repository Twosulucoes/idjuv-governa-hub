/**
 * HOOK: GESTÃO DE ALMOXARIFADO
 * 
 * CRUD de itens de material, requisições, entradas e saídas
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

// Types
type ItemMaterial = Database['public']['Tables']['itens_material']['Row'];
type ItemInsert = Database['public']['Tables']['itens_material']['Insert'];
type ItemUpdate = Database['public']['Tables']['itens_material']['Update'];

type RequisicaoMaterial = Database['public']['Tables']['requisicoes_material']['Row'];
type RequisicaoInsert = Database['public']['Tables']['requisicoes_material']['Insert'];

type RequisicaoItem = Database['public']['Tables']['requisicao_itens']['Row'];
type RequisicaoItemInsert = Database['public']['Tables']['requisicao_itens']['Insert'];

type Almoxarifado = Database['public']['Tables']['almoxarifados']['Row'];

// ========== ITENS DE MATERIAL ==========

export function useItensMaterial(filters?: {
  categoria_id?: string;
  abaixoEstoqueMinimo?: boolean;
}) {
  return useQuery({
    queryKey: ['itens-material', filters],
    queryFn: async () => {
      let query = supabase
        .from('itens_material')
        .select(`
          *,
          categoria:categorias_material(id, nome)
        `)
        .order('descricao');

      if (filters?.categoria_id) {
        query = query.eq('categoria_id', filters.categoria_id);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Filtrar itens abaixo do estoque mínimo (usando ponto_reposicao como referência)
      if (filters?.abaixoEstoqueMinimo) {
        return data?.filter(item => 
          item.estoque_minimo && item.ponto_reposicao && 
          item.ponto_reposicao < item.estoque_minimo
        );
      }

      return data;
    },
  });
}

export function useItemMaterial(id: string | undefined) {
  return useQuery({
    queryKey: ['item-material', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('itens_material')
        .select(`
          *,
          categoria:categorias_material(id, nome)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateItemMaterial() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: ItemInsert) => {
      const { data: result, error } = await supabase
        .from('itens_material')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itens-material'] });
      toast.success('Item cadastrado com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao cadastrar item: ${error.message}`);
    },
  });
}

export function useUpdateItemMaterial() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: ItemUpdate & { id: string }) => {
      const { data: result, error } = await supabase
        .from('itens_material')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['itens-material'] });
      queryClient.invalidateQueries({ queryKey: ['item-material', variables.id] });
      toast.success('Item atualizado');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar item: ${error.message}`);
    },
  });
}

// ========== ALMOXARIFADOS ==========

export function useAlmoxarifados() {
  return useQuery({
    queryKey: ['almoxarifados'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('almoxarifados')
        .select(`
          *,
          responsavel:servidores!almoxarifados_responsavel_id_fkey(id, nome_completo),
          unidade:estrutura_organizacional!almoxarifados_unidade_id_fkey(id, nome, sigla)
        `)
        .eq('ativo', true)
        .order('nome');
      if (error) throw error;
      return data;
    },
  });
}

// ========== REQUISIÇÕES ==========

export function useRequisicoesMaterial(filters?: {
  status?: string;
  solicitante_id?: string;
  almoxarifado_id?: string;
}) {
  return useQuery({
    queryKey: ['requisicoes-material', filters],
    queryFn: async () => {
      let query = supabase
        .from('requisicoes_material')
        .select(`
          *,
          solicitante:servidores!requisicoes_material_solicitante_id_fkey(id, nome_completo),
          setor:estrutura_organizacional!requisicoes_material_setor_solicitante_id_fkey(id, nome, sigla),
          almoxarifado:almoxarifados(id, nome, codigo)
        `)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.solicitante_id) {
        query = query.eq('solicitante_id', filters.solicitante_id);
      }
      if (filters?.almoxarifado_id) {
        query = query.eq('almoxarifado_id', filters.almoxarifado_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useRequisicaoMaterial(id: string | undefined) {
  return useQuery({
    queryKey: ['requisicao-material', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('requisicoes_material')
        .select(`
          *,
          solicitante:servidores!requisicoes_material_solicitante_id_fkey(id, nome_completo),
          setor:estrutura_organizacional!requisicoes_material_setor_solicitante_id_fkey(id, nome, sigla),
          almoxarifado:almoxarifados(id, nome, codigo)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateRequisicao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { 
      requisicao: RequisicaoInsert; 
      itens: Omit<RequisicaoItemInsert, 'requisicao_id'>[] 
    }) => {
      // Criar requisição
      const { data: requisicao, error: reqError } = await supabase
        .from('requisicoes_material')
        .insert(data.requisicao)
        .select()
        .single();
      if (reqError) throw reqError;

      // Criar itens
      if (data.itens.length > 0) {
        const itensComRequisicao = data.itens.map(item => ({
          ...item,
          requisicao_id: requisicao.id,
        }));

        const { error: itensError } = await supabase
          .from('requisicao_itens')
          .insert(itensComRequisicao);
        if (itensError) throw itensError;
      }

      return requisicao;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requisicoes-material'] });
      toast.success('Requisição criada com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar requisição: ${error.message}`);
    },
  });
}

export function useAtenderRequisicao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { 
      requisicaoId: string;
      atendenteId: string;
      itensAtendidos: { itemId: string; quantidadeAtendida: number }[];
    }) => {
      // Atualizar cada item
      for (const item of data.itensAtendidos) {
        const { error } = await supabase
          .from('requisicao_itens')
          .update({ quantidade_atendida: item.quantidadeAtendida })
          .eq('id', item.itemId);
        if (error) throw error;
      }

      // Atualizar requisição
      const { error: reqError } = await supabase
        .from('requisicoes_material')
        .update({ 
          status: 'atendida',
          responsavel_entrega_id: data.atendenteId,
          data_entrega: new Date().toISOString(),
        })
        .eq('id', data.requisicaoId);
      if (reqError) throw reqError;

      return true;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['requisicoes-material'] });
      queryClient.invalidateQueries({ queryKey: ['requisicao-material', variables.requisicaoId] });
      queryClient.invalidateQueries({ queryKey: ['itens-material'] });
      toast.success('Requisição atendida');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atender requisição: ${error.message}`);
    },
  });
}

// ========== ESTATÍSTICAS ==========

export function useEstatisticasAlmoxarifado() {
  return useQuery({
    queryKey: ['estatisticas-almoxarifado'],
    queryFn: async () => {
      // Total de itens
      const { count: totalItens } = await supabase
        .from('itens_material')
        .select('*', { count: 'exact', head: true });

      // Itens abaixo do estoque mínimo
      const { data: itens } = await supabase
        .from('itens_material')
        .select('ponto_reposicao, estoque_minimo, valor_unitario_medio');

      const abaixoMinimo = itens?.filter(i => 
        i.estoque_minimo && i.ponto_reposicao && 
        i.ponto_reposicao < i.estoque_minimo
      ).length || 0;

      // Valor total (estimativa baseada no valor médio)
      const valorTotal = itens?.reduce((acc, i) => 
        acc + (i.valor_unitario_medio || 0), 0
      ) || 0;

      // Requisições pendentes
      const { count: requisicoesPendentes } = await supabase
        .from('requisicoes_material')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pendente');

      return {
        totalItens: totalItens || 0,
        abaixoMinimo,
        valorTotal,
        requisicoesPendentes: requisicoesPendentes || 0,
      };
    },
  });
}
