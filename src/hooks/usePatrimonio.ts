/**
 * HOOK: GESTÃO DE PATRIMÔNIO
 * 
 * CRUD de bens patrimoniais, movimentações, campanhas de inventário
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

// Types
type BemPatrimonial = Database['public']['Tables']['bens_patrimoniais']['Row'];
type BemInsert = Database['public']['Tables']['bens_patrimoniais']['Insert'];
type BemUpdate = Database['public']['Tables']['bens_patrimoniais']['Update'];

type MovimentacaoPatrimonio = Database['public']['Tables']['movimentacoes_patrimonio']['Row'];
type MovimentacaoInsert = Database['public']['Tables']['movimentacoes_patrimonio']['Insert'];

type CampanhaInventario = Database['public']['Tables']['campanhas_inventario']['Row'];
type ColetaInventario = Database['public']['Tables']['coletas_inventario']['Row'];
type ColetaInsert = Database['public']['Tables']['coletas_inventario']['Insert'];

type ManutencaoPatrimonio = Database['public']['Tables']['manutencoes_patrimonio']['Row'];
type OcorrenciaPatrimonio = Database['public']['Tables']['ocorrencias_patrimonio']['Row'];
type BaixaPatrimonio = Database['public']['Tables']['baixas_patrimonio']['Row'];

// ========== BENS PATRIMONIAIS ==========

export function useBensPatrimoniais(filters?: {
  situacao?: string;
  unidade_id?: string;
  unidade_local_id?: string;
  categoria_bem?: string;
  responsavel_id?: string;
}) {
  return useQuery({
    queryKey: ['bens-patrimoniais', filters],
    queryFn: async () => {
      let query = supabase
        .from('bens_patrimoniais')
        .select(`
          *,
          responsavel:servidores!bens_patrimoniais_responsavel_id_fkey(id, nome_completo),
          unidade:estrutura_organizacional!bens_patrimoniais_unidade_id_fkey(id, nome, sigla),
          unidade_local:unidades_locais!bens_patrimoniais_unidade_local_id_fkey(id, nome_unidade, codigo_unidade, municipio)
        `)
        .order('created_at', { ascending: false });

      if (filters?.situacao) {
        query = query.eq('situacao', filters.situacao);
      }
      if (filters?.unidade_id) {
        query = query.eq('unidade_id', filters.unidade_id);
      }
      if (filters?.unidade_local_id) {
        query = query.eq('unidade_local_id', filters.unidade_local_id);
      }
      if (filters?.categoria_bem) {
        query = query.eq('categoria_bem', filters.categoria_bem as any);
      }
      if (filters?.responsavel_id) {
        query = query.eq('responsavel_id', filters.responsavel_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useBemPatrimonial(id: string | undefined) {
  return useQuery({
    queryKey: ['bem-patrimonial', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('bens_patrimoniais')
        .select(`
          *,
          responsavel:servidores!bens_patrimoniais_responsavel_id_fkey(id, nome_completo, cpf),
          unidade:estrutura_organizacional!bens_patrimoniais_unidade_id_fkey(id, nome, sigla),
          unidade_local:unidades_locais!bens_patrimoniais_unidade_local_id_fkey(id, nome_unidade, codigo_unidade, municipio, tipo_unidade),
          fornecedor:fornecedores!bens_patrimoniais_fornecedor_id_fkey(id, razao_social, cnpj)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateBem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: BemInsert) => {
      const { data: result, error } = await supabase
        .from('bens_patrimoniais')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bens-patrimoniais'] });
      toast.success('Bem patrimonial cadastrado com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao cadastrar bem: ${error.message}`);
    },
  });
}

export function useUpdateBem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: BemUpdate & { id: string }) => {
      const { data: result, error } = await supabase
        .from('bens_patrimoniais')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bens-patrimoniais'] });
      queryClient.invalidateQueries({ queryKey: ['bem-patrimonial', variables.id] });
      toast.success('Bem atualizado com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar bem: ${error.message}`);
    },
  });
}

// ========== MOVIMENTAÇÕES ==========

export function useMovimentacoesPatrimonio(bemId?: string) {
  return useQuery({
    queryKey: ['movimentacoes-patrimonio', bemId],
    queryFn: async () => {
      let query = supabase
        .from('movimentacoes_patrimonio')
        .select(`
          *,
          bem:bens_patrimoniais(id, numero_patrimonio, descricao),
          solicitante:servidores!movimentacoes_patrimonio_solicitante_id_fkey(id, nome_completo),
          aprovador:servidores!movimentacoes_patrimonio_aprovador_id_fkey(id, nome_completo),
          responsavel_origem:servidores!movimentacoes_patrimonio_responsavel_origem_id_fkey(id, nome_completo),
          responsavel_destino:servidores!movimentacoes_patrimonio_responsavel_destino_id_fkey(id, nome_completo),
          origem_unidade_local:unidades_locais!movimentacoes_patrimonio_unidade_local_origem_id_fkey(id, nome_unidade, codigo_unidade),
          destino_unidade_local:unidades_locais!movimentacoes_patrimonio_unidade_local_destino_id_fkey(id, nome_unidade, codigo_unidade)
        `)
        .order('created_at', { ascending: false });

      if (bemId) {
        query = query.eq('bem_id', bemId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateMovimentacao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: MovimentacaoInsert) => {
      const { data: result, error } = await supabase
        .from('movimentacoes_patrimonio')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimentacoes-patrimonio'] });
      toast.success('Movimentação registrada');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao registrar movimentação: ${error.message}`);
    },
  });
}

// ========== CAMPANHAS DE INVENTÁRIO ==========

export function useCampanhasInventario(ano?: number) {
  return useQuery({
    queryKey: ['campanhas-inventario', ano],
    queryFn: async () => {
      let query = supabase
        .from('campanhas_inventario')
        .select(`
          *,
          responsavel:servidores!campanhas_inventario_responsavel_geral_id_fkey(id, nome_completo)
        `)
        .order('created_at', { ascending: false });

      if (ano) {
        query = query.eq('ano', ano);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useCampanhaInventario(id: string | undefined) {
  return useQuery({
    queryKey: ['campanha-inventario', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('campanhas_inventario')
        .select(`
          *,
          responsavel:servidores!campanhas_inventario_responsavel_geral_id_fkey(id, nome_completo)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useColetasInventario(campanhaId: string) {
  return useQuery({
    queryKey: ['coletas-inventario', campanhaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coletas_inventario')
        .select(`
          *,
          bem:bens_patrimoniais(id, numero_patrimonio, descricao, situacao),
          coletor:servidores!coletas_inventario_coletor_id_fkey(id, nome_completo)
        `)
        .eq('campanha_id', campanhaId)
        .order('data_coleta', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!campanhaId,
  });
}

export function useCreateColeta() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: ColetaInsert) => {
      const { data: result, error } = await supabase
        .from('coletas_inventario')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['coletas-inventario', variables.campanha_id] });
      queryClient.invalidateQueries({ queryKey: ['campanhas-inventario'] });
      toast.success('Coleta registrada');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao registrar coleta: ${error.message}`);
    },
  });
}

// ========== CRIAR/ATUALIZAR CAMPANHA ==========

type CampanhaInsert = Database['public']['Tables']['campanhas_inventario']['Insert'];
type CampanhaUpdate = Database['public']['Tables']['campanhas_inventario']['Update'];

export function useCreateCampanhaInventario() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CampanhaInsert) => {
      const { data: result, error } = await supabase
        .from('campanhas_inventario')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campanhas-inventario'] });
      toast.success('Campanha criada com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar campanha: ${error.message}`);
    },
  });
}

export function useUpdateCampanhaStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data: result, error } = await supabase
        .from('campanhas_inventario')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campanhas-inventario'] });
      queryClient.invalidateQueries({ queryKey: ['campanha-inventario', variables.id] });
      toast.success('Status da campanha atualizado');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    },
  });
}

// ========== UNIDADES LOCAIS (para coleta) ==========

interface UnidadeLocalSimples {
  id: string;
  nome_unidade: string;
  codigo_unidade?: string | null;
  municipio?: string | null;
  tipo_unidade?: string | null;
}

export function useUnidadesLocaisPatrimonio() {
  return useQuery<UnidadeLocalSimples[]>({
    queryKey: ['unidades-locais-patrimonio'],
    queryFn: async (): Promise<UnidadeLocalSimples[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (supabase as any)
        .from('unidades_locais')
        .select('id, nome_unidade, codigo_unidade, municipio, tipo_unidade')
        .eq('ativo', true)
        .order('nome_unidade');
      if (response.error) throw response.error;
      return (response.data || []) as UnidadeLocalSimples[];
    },
  });
}

// ========== MANUTENÇÕES ==========

export function useManutencoesPatrimonio(bemId?: string) {
  return useQuery({
    queryKey: ['manutencoes-patrimonio', bemId],
    queryFn: async () => {
      let query = supabase
        .from('manutencoes_patrimonio')
        .select(`
          *,
          bem:bens_patrimoniais(id, numero_patrimonio, descricao),
          solicitante:servidores!manutencoes_patrimonio_solicitante_id_fkey(id, nome_completo)
        `)
        .order('created_at', { ascending: false });

      if (bemId) {
        query = query.eq('bem_id', bemId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

// ========== OCORRÊNCIAS ==========

export function useOcorrenciasPatrimonio(bemId?: string) {
  return useQuery({
    queryKey: ['ocorrencias-patrimonio', bemId],
    queryFn: async () => {
      let query = supabase
        .from('ocorrencias_patrimonio')
        .select(`
          *,
          bem:bens_patrimoniais(id, numero_patrimonio, descricao),
          relator:servidores!ocorrencias_patrimonio_relator_id_fkey(id, nome_completo)
        `)
        .order('created_at', { ascending: false });

      if (bemId) {
        query = query.eq('bem_id', bemId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

// ========== BAIXAS ==========

export function useBaixasPatrimonio(status?: string) {
  return useQuery({
    queryKey: ['baixas-patrimonio', status],
    queryFn: async () => {
      let query = supabase
        .from('baixas_patrimonio')
        .select(`
          *,
          bem:bens_patrimoniais(id, numero_patrimonio, descricao, valor_aquisicao)
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

// ========== RESUMO DASHBOARD ==========

export function useResumoPatrimonio() {
  return useQuery({
    queryKey: ['resumo-patrimonio'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_resumo_patrimonio')
        .select('*');
      if (error) throw error;
      return data;
    },
  });
}

// ========== ESTATÍSTICAS ==========

export function useEstatisticasPatrimonio() {
  return useQuery({
    queryKey: ['estatisticas-patrimonio'],
    queryFn: async () => {
      // Total de bens
      const { count: totalBens } = await supabase
        .from('bens_patrimoniais')
        .select('*', { count: 'exact', head: true });

      // Por situação
      const { data: porSituacao } = await supabase
        .from('bens_patrimoniais')
        .select('situacao')
        .not('situacao', 'is', null);

      // Por categoria
      const { data: porCategoria } = await supabase
        .from('bens_patrimoniais')
        .select('categoria_bem')
        .not('categoria_bem', 'is', null);

      // Valor total
      const { data: valores } = await supabase
        .from('bens_patrimoniais')
        .select('valor_aquisicao')
        .neq('situacao', 'baixado');

      const valorTotal = valores?.reduce((acc, b) => acc + (b.valor_aquisicao || 0), 0) || 0;

      // Contagens
      const situacaoCount: Record<string, number> = {};
      porSituacao?.forEach(b => {
        const sit = b.situacao || 'indefinido';
        situacaoCount[sit] = (situacaoCount[sit] || 0) + 1;
      });

      const categoriaCount: Record<string, number> = {};
      porCategoria?.forEach(b => {
        const cat = b.categoria_bem || 'outros';
        categoriaCount[cat] = (categoriaCount[cat] || 0) + 1;
      });

      return {
        totalBens: totalBens || 0,
        valorTotal,
        porSituacao: situacaoCount,
        porCategoria: categoriaCount,
      };
    },
  });
}

// ========== HISTÓRICO DO BEM ==========

export function useHistoricoPatrimonio(bemId: string | undefined) {
  return useQuery({
    queryKey: ['historico-patrimonio', bemId],
    queryFn: async () => {
      if (!bemId) return [];
      const { data, error } = await supabase
        .from('historico_patrimonio')
        .select(`
          *,
          unidade_local:unidades_locais(id, nome_unidade, codigo_unidade),
          responsavel:servidores(id, nome_completo)
        `)
        .eq('bem_id', bemId)
        .order('data_evento', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!bemId,
  });
}

// ========== PATRIMÔNIO POR UNIDADE LOCAL ==========

export function usePatrimonioPorUnidade() {
  return useQuery({
    queryKey: ['patrimonio-por-unidade'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_patrimonio_por_unidade')
        .select('*')
        .order('total_bens', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
