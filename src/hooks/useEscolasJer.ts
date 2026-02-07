/**
 * Hook para gerenciar escolas participantes dos Jogos Escolares de Roraima
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { EscolaJer, EscolaImportData } from '@/types/gestoresEscolares';

const QUERY_KEY = ['escolas-jer'];

export function useEscolasJer() {
  const queryClient = useQueryClient();

  // Listar todas as escolas
  const {
    data: escolas = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<EscolaJer[]> => {
      const { data, error } = await supabase
        .from('escolas_jer')
        .select('*')
        .order('nome');

      if (error) throw error;
      return data as EscolaJer[];
    },
  });

  // Listar apenas escolas disponíveis (sem gestor cadastrado)
  const escolasDisponiveis = escolas.filter((e) => !e.ja_cadastrada);

  // Criar escola
  const criarEscola = useMutation({
    mutationFn: async (dados: EscolaImportData) => {
      const { data, error } = await supabase
        .from('escolas_jer')
        .insert({
          nome: dados.nome,
          municipio: dados.municipio || null,
          inep: dados.inep || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Escola adicionada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao criar escola:', error);
      if (error.message.includes('duplicate')) {
        toast.error('Já existe uma escola com este código INEP.');
      } else {
        toast.error('Erro ao adicionar escola.');
      }
    },
  });

  // Importar múltiplas escolas
  const importarEscolas = useMutation({
    mutationFn: async (dados: EscolaImportData[]) => {
      const { data, error } = await supabase
        .from('escolas_jer')
        .insert(
          dados.map((d) => ({
            nome: d.nome,
            municipio: d.municipio || null,
            inep: d.inep || null,
          }))
        )
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(`${data.length} escolas importadas com sucesso!`);
    },
    onError: (error: Error) => {
      console.error('Erro ao importar escolas:', error);
      toast.error('Erro ao importar escolas. Verifique se há duplicatas.');
    },
  });

  // Atualizar escola
  const atualizarEscola = useMutation({
    mutationFn: async ({ id, ...dados }: Partial<EscolaJer> & { id: string }) => {
      const { data, error } = await supabase
        .from('escolas_jer')
        .update(dados)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Escola atualizada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar escola:', error);
      toast.error('Erro ao atualizar escola.');
    },
  });

  // Deletar escola
  const deletarEscola = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('escolas_jer')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Escola removida com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao deletar escola:', error);
      if (error.message.includes('violates foreign key')) {
        toast.error('Não é possível remover escola com gestor cadastrado.');
      } else {
        toast.error('Erro ao remover escola.');
      }
    },
  });

  return {
    escolas,
    escolasDisponiveis,
    isLoading,
    error,
    refetch,
    criarEscola,
    importarEscolas,
    atualizarEscola,
    deletarEscola,
  };
}
