/**
 * Emendas parlamentares do orçamento (fin_emendas): autor, objeto, beneficiário e valor de cada emenda,
 * ligada à dotação do QDD em que caiu. O empenhado vem dos empenhos com emenda_id.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Emenda } from '@/types/financeiro';

export type EmendaForm = Pick<
  Emenda,
  'exercicio' | 'dotacao_id' | 'numero' | 'idu' | 'autor' | 'objeto' | 'beneficiario' | 'beneficiario_cnpj'
  | 'valor' | 'valor_reservado' | 'ped_numero' | 'processo_sei' | 'observacoes'
>;

/** Emendas ativas do exercício. */
export function useEmendas(exercicio?: number) {
  const ano = exercicio || new Date().getFullYear();
  return useQuery({
    queryKey: ['fin_emendas', ano],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fin_emendas')
        .select('*')
        .eq('exercicio', ano)
        .eq('ativo', true)
        .order('numero');
      if (error) throw error;
      return data as unknown as Emenda[];
    },
  });
}

/** Empenhos do exercício ligados a alguma emenda (só o necessário para o saldo e a lista da emenda). */
export function useEmpenhosDeEmendas(exercicio?: number) {
  const ano = exercicio || new Date().getFullYear();
  return useQuery({
    queryKey: ['fin_empenhos', ano, 'emendas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fin_empenhos')
        .select('id, numero, data_empenho, objeto, emenda_id, dotacao_id, valor_empenhado, valor_anulado, credor_nome, fornecedor:fornecedores(razao_social)')
        .eq('exercicio', ano)
        .not('emenda_id', 'is', null);
      if (error) throw error;
      return data as unknown as {
        id: string;
        numero: string;
        data_empenho: string;
        objeto: string;
        emenda_id: string;
        dotacao_id: string | null;
        valor_empenhado: number;
        valor_anulado: number | null;
        credor_nome: string | null;
        fornecedor: { razao_social: string } | null;
      }[];
    },
  });
}

export function useSalvarEmenda() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, dados }: { id?: string; dados: EmendaForm }) => {
      const { error } = id
        ? await supabase.from('fin_emendas').update(dados).eq('id', id)
        : await supabase.from('fin_emendas').insert(dados);
      if (error) throw error;
    },
    onSuccess: (_d, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['fin_emendas'] });
      toast({ title: id ? 'Emenda atualizada' : 'Emenda cadastrada' });
    },
    onError: (error: Error) => {
      const duplicada = /fin_emendas_numero_exercicio_key/.test(error.message);
      toast({
        title: 'Erro ao salvar a emenda',
        description: duplicada ? 'Já existe emenda com esse número no exercício.' : error.message,
        variant: 'destructive',
      });
    },
  });
}

/** Tira a emenda da lista (ativo = false); os empenhos ligados a ela continuam ligados. */
export function useDesativarEmenda() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('fin_emendas').update({ ativo: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fin_emendas'] });
      toast({ title: 'Emenda removida da lista' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao remover a emenda', description: error.message, variant: 'destructive' });
    },
  });
}

/** Liga (ou desliga, com null) o empenho a uma emenda da mesma dotação. */
export function useDefinirEmendaEmpenho() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ empenhoId, emendaId }: { empenhoId: string; emendaId: string | null }) => {
      const { error } = await supabase.from('fin_empenhos').update({ emenda_id: emendaId }).eq('id', empenhoId);
      if (error) throw error;
    },
    onSuccess: (_d, { empenhoId }) => {
      queryClient.invalidateQueries({ queryKey: ['fin_empenho', empenhoId] });
      queryClient.invalidateQueries({ queryKey: ['fin_empenhos'] });
      toast({ title: 'Emenda do empenho definida' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao definir a emenda', description: error.message, variant: 'destructive' });
    },
  });
}
