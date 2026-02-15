/**
 * Hook para Sub-Empenhos (Reforço e Anulação)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import type { SubEmpenho } from '@/types/financeiro';

export function useSubEmpenhos(empenho_id?: string) {
  return useQuery({
    queryKey: ['fin_sub_empenhos', empenho_id],
    queryFn: async () => {
      if (!empenho_id) return [];
      const { data, error } = await supabase
        .from('fin_sub_empenhos')
        .select('*')
        .eq('empenho_id', empenho_id)
        .order('data_registro', { ascending: false });

      if (error) throw error;
      return data as unknown as SubEmpenho[];
    },
    enabled: !!empenho_id,
  });
}

export function useCriarSubEmpenho() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { logCreate } = useAuditLog();

  return useMutation({
    mutationFn: async (dados: {
      empenho_id: string;
      tipo: 'reforco' | 'anulacao';
      valor: number;
      justificativa: string;
      documento_referencia?: string;
      observacoes?: string;
    }) => {
      // Gerar número sequencial
      const { data: existentes } = await supabase
        .from('fin_sub_empenhos')
        .select('numero')
        .eq('empenho_id', dados.empenho_id)
        .order('created_at', { ascending: false })
        .limit(1);

      const seq = (existentes?.length || 0) + 1;
      const prefixo = dados.tipo === 'reforco' ? 'R' : 'A';

      // Buscar número do empenho pai
      const { data: empenho } = await supabase
        .from('fin_empenhos')
        .select('numero')
        .eq('id', dados.empenho_id)
        .single();

      const numero = `${empenho?.numero || 'NE'}-${prefixo}${String(seq).padStart(2, '0')}`;

      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('fin_sub_empenhos')
        .insert({
          empenho_id: dados.empenho_id,
          numero,
          tipo: dados.tipo,
          valor: dados.valor,
          justificativa: dados.justificativa,
          documento_referencia: dados.documento_referencia,
          observacoes: dados.observacoes,
          created_by: userData.user?.id,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      logCreate('fin_sub_empenhos', data.id, data, 'financeiro');
      queryClient.invalidateQueries({ queryKey: ['fin_sub_empenhos', variables.empenho_id] });
      queryClient.invalidateQueries({ queryKey: ['fin_empenhos'] });
      queryClient.invalidateQueries({ queryKey: ['fin_dotacoes'] });
      queryClient.invalidateQueries({ queryKey: ['fin_resumo_orcamentario'] });
      const label = variables.tipo === 'reforco' ? 'Reforço' : 'Anulação';
      toast({ title: `${label} registrado com sucesso` });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao registrar sub-empenho', description: error.message, variant: 'destructive' });
    },
  });
}
