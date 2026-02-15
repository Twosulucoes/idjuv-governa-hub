/**
 * Hook para Restos a Pagar (RAP)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import type { RestoPagar } from '@/types/financeiro';

export function useRestosPagar(filtros?: {
  exercicio_inscricao?: number;
  tipo?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['fin_restos_pagar', filtros],
    queryFn: async () => {
      let query = supabase
        .from('fin_restos_pagar')
        .select(`
          *,
          empenho:fin_empenhos(
            id, numero, objeto, exercicio, valor_empenhado,
            fornecedor:fornecedores(id, razao_social, cnpj_cpf),
            dotacao:fin_dotacoes(id, codigo_dotacao)
          )
        `)
        .order('created_at', { ascending: false });

      if (filtros?.exercicio_inscricao) {
        query = query.eq('exercicio_inscricao', filtros.exercicio_inscricao);
      }
      if (filtros?.tipo) {
        query = query.eq('tipo', filtros.tipo);
      }
      if (filtros?.status) {
        query = query.eq('status', filtros.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as RestoPagar[];
    },
  });
}

export function useResumoRAP(exercicio_inscricao?: number) {
  const ano = exercicio_inscricao || new Date().getFullYear();

  return useQuery({
    queryKey: ['fin_resumo_rap', ano],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fin_restos_pagar')
        .select('tipo, valor_inscrito, valor_cancelado, valor_pago, status')
        .eq('exercicio_inscricao', ano);

      if (error) throw error;

      const resumo = {
        processados: { inscrito: 0, cancelado: 0, pago: 0, saldo: 0, total: 0 },
        nao_processados: { inscrito: 0, cancelado: 0, pago: 0, saldo: 0, total: 0 },
      };

      data?.forEach((r: any) => {
        const grupo = r.tipo === 'processado' ? resumo.processados : resumo.nao_processados;
        grupo.inscrito += Number(r.valor_inscrito) || 0;
        grupo.cancelado += Number(r.valor_cancelado) || 0;
        grupo.pago += Number(r.valor_pago) || 0;
        grupo.total++;
      });

      resumo.processados.saldo = resumo.processados.inscrito - resumo.processados.cancelado - resumo.processados.pago;
      resumo.nao_processados.saldo = resumo.nao_processados.inscrito - resumo.nao_processados.cancelado - resumo.nao_processados.pago;

      return resumo;
    },
  });
}

export function useInscreverRAP() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { logCreate } = useAuditLog();

  return useMutation({
    mutationFn: async ({ exercicio_origem, exercicio_inscricao }: {
      exercicio_origem: number;
      exercicio_inscricao?: number;
    }) => {
      const { data, error } = await supabase.rpc('fn_inscrever_restos_pagar', {
        p_exercicio_origem: exercicio_origem,
        p_exercicio_inscricao: exercicio_inscricao || null,
      });

      if (error) throw error;
      return data as number;
    },
    onSuccess: (count) => {
      logCreate('fin_restos_pagar', 'batch', { count }, 'financeiro');
      queryClient.invalidateQueries({ queryKey: ['fin_restos_pagar'] });
      queryClient.invalidateQueries({ queryKey: ['fin_resumo_rap'] });
      queryClient.invalidateQueries({ queryKey: ['fin_empenhos'] });
      toast({ title: `${count} empenho(s) inscrito(s) em Restos a Pagar` });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao inscrever RAP', description: error.message, variant: 'destructive' });
    },
  });
}

export function useCancelarRAP() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { logUpdate } = useAuditLog();

  return useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo: string }) => {
      const { data, error } = await supabase
        .from('fin_restos_pagar')
        .update({
          status: 'cancelado',
          data_cancelamento: new Date().toISOString().split('T')[0],
          motivo_cancelamento: motivo,
        } as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      logUpdate('fin_restos_pagar', data.id, null, data, 'financeiro');
      queryClient.invalidateQueries({ queryKey: ['fin_restos_pagar'] });
      queryClient.invalidateQueries({ queryKey: ['fin_resumo_rap'] });
      toast({ title: 'RAP cancelado com sucesso' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao cancelar RAP', description: error.message, variant: 'destructive' });
    },
  });
}
