 import { useCallback } from 'react';
 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { toast } from 'sonner';
 import type { 
   Instituicao, 
   InstituicaoResumo, 
   InstituicaoFormData,
   TipoInstituicao,
   StatusInstituicao
 } from '@/types/instituicoes';
 
 interface UseInstituicoesFilters {
   tipo?: TipoInstituicao;
   status?: StatusInstituicao;
   busca?: string;
 }
 
 export function useInstituicoes(filters?: UseInstituicoesFilters) {
   const queryClient = useQueryClient();
 
   const {
     data: instituicoes = [],
     isLoading,
     error,
     refetch,
   } = useQuery({
     queryKey: ['instituicoes', filters],
     queryFn: async () => {
       let query = supabase
         .from('v_instituicoes_resumo')
         .select('*')
         .eq('ativo', true)
         .order('nome_razao_social');
 
       if (filters?.tipo) {
         query = query.eq('tipo_instituicao', filters.tipo);
       }
 
       if (filters?.status) {
         query = query.eq('status', filters.status);
       }
 
       if (filters?.busca) {
         query = query.or(`nome_razao_social.ilike.%${filters.busca}%,cnpj.ilike.%${filters.busca}%,codigo_instituicao.ilike.%${filters.busca}%`);
       }
 
       const { data, error } = await query;
 
       if (error) throw error;
       return (data || []) as unknown as InstituicaoResumo[];
     },
     staleTime: 5 * 60 * 1000,
   });
 
   const getInstituicao = useCallback(async (id: string): Promise<Instituicao | null> => {
     const { data, error } = await supabase
       .from('instituicoes')
       .select('*')
       .eq('id', id)
       .single();
 
     if (error) {
       console.error('Erro ao buscar instituição:', error);
       return null;
     }
 
     return data as unknown as Instituicao;
   }, []);
 
   const createMutation = useMutation({
     mutationFn: async (formData: InstituicaoFormData) => {
       const { data: userData } = await supabase.auth.getUser();
       
       const { data: result, error } = await supabase
         .from('instituicoes')
         .insert({
           ...formData,
           created_by: userData.user?.id,
           status: 'ativo' as const,
           ativo: true,
         })
         .select()
         .single();
 
       if (error) throw error;
       return result;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['instituicoes'] });
       toast.success('Instituição cadastrada com sucesso!');
     },
     onError: (error: Error) => {
       console.error('Erro ao criar instituição:', error);
       toast.error(error.message || 'Erro ao cadastrar instituição');
     },
   });
 
   const updateMutation = useMutation({
     mutationFn: async ({ id, data: formData }: { id: string; data: Partial<InstituicaoFormData> }) => {
       const { data: userData } = await supabase.auth.getUser();
 
       const { data: result, error } = await supabase
         .from('instituicoes')
         .update({
           ...formData,
           updated_by: userData.user?.id,
         })
         .eq('id', id)
         .select()
         .single();
 
       if (error) throw error;
       return result;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['instituicoes'] });
       toast.success('Instituição atualizada com sucesso!');
     },
     onError: (error: Error) => {
       console.error('Erro ao atualizar instituição:', error);
       toast.error(error.message || 'Erro ao atualizar instituição');
     },
   });
 
   const deleteMutation = useMutation({
     mutationFn: async (id: string) => {
       const { data: userData } = await supabase.auth.getUser();
 
       const { error } = await supabase
         .from('instituicoes')
         .update({
           ativo: false,
           status: 'inativo' as const,
           updated_by: userData.user?.id,
         })
         .eq('id', id);
 
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['instituicoes'] });
       toast.success('Instituição desativada com sucesso!');
     },
     onError: (error: Error) => {
       console.error('Erro ao desativar instituição:', error);
       toast.error(error.message || 'Erro ao desativar instituição');
     },
   });
 
   return {
     instituicoes,
     isLoading,
     error,
     refetch,
     getInstituicao,
     createInstituicao: createMutation.mutateAsync,
     updateInstituicao: updateMutation.mutateAsync,
     deleteInstituicao: deleteMutation.mutateAsync,
     isCreating: createMutation.isPending,
     isUpdating: updateMutation.isPending,
     isDeleting: deleteMutation.isPending,
   };
 }
 
 export function useInstituicoesSelector() {
   const { data: instituicoes = [], isLoading } = useQuery({
     queryKey: ['instituicoes-selector'],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('instituicoes')
         .select('id, codigo_instituicao, nome_razao_social, tipo_instituicao, cnpj, responsavel_nome')
         .eq('ativo', true)
         .eq('status', 'ativo')
         .order('nome_razao_social');
 
       if (error) throw error;
       return (data || []) as Pick<Instituicao, 'id' | 'codigo_instituicao' | 'nome_razao_social' | 'tipo_instituicao' | 'cnpj' | 'responsavel_nome'>[];
     },
     staleTime: 5 * 60 * 1000,
   });
 
   return { instituicoes, isLoading };
 }