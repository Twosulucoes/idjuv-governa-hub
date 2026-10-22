/**
 * Conciliação bancária mensal (quadro da SEFAZ): meses gravados de uma conta, os itens de um mês, as pendências do mês
 * anterior fechado e as RPCs `salvar_conciliacao_mensal`, `fechar_conciliacao_mensal` (confere o quadro no banco) e
 * `reabrir_conciliacao_mensal` (só o admin). Migração 20261026090000; leitura e escrita pela RLS do módulo financeiro
 * com `pagamento.conciliar`. A sugestão de casamentos pela IA chama a Edge Function `conciliacao-ia-sugestoes`.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';
import type { ItemGravado, ItemParaGravar } from '@/lib/conciliacao/registro';
import type { PendenciaParaIa } from '@/lib/conciliacao/sugestoes';

export type ConciliacaoMensal = Tables<'fin_conciliacoes_mensais'>;

export interface ArquivoConciliacao {
  tipo: 'fip630' | 'fip103' | 'ofx' | 'extrato_fundo';
  nome: string;
  /** No OFX: aplicações e resgates automáticos do mês (reais), para refazer o saldo do fundo ao reabrir a tela. */
  aplicacoes?: number;
  resgates?: number;
}

export interface DadosConciliacaoMensal {
  saldo_razao: number;
  saldo_conta: number;
  saldo_fundo: number;
  rendimento_fundo: number;
  arquivos: ArquivoConciliacao[];
  observacoes?: string | null;
}

const CHAVE = 'fin_conciliacao_mensal';

/** "2026-07-01" → "2026-06-01". */
export function competenciaAnterior(competencia: string): string {
  const [ano, mes] = competencia.split('-').map(Number);
  return mes === 1 ? `${ano - 1}-12-01` : `${ano}-${String(mes - 1).padStart(2, '0')}-01`;
}

async function itensDe(conciliacaoId: string): Promise<ItemGravado[]> {
  const { data, error } = await supabase
    .from('fin_conciliacao_itens')
    .select('id, lado, natureza, data, documento, tipo, historico, valor, re, nob, origem, item_origem_id, situacao, grupo, regra, justificativa')
    .eq('conciliacao_id', conciliacaoId)
    .order('lado')
    .order('data')
    .order('id');
  if (error) throw error;
  return data as ItemGravado[];
}

/** Meses gravados da conta, do mais recente para o mais antigo. */
export function useConciliacoesMensais(contaId: string | null) {
  return useQuery({
    queryKey: [CHAVE, 'meses', contaId],
    enabled: !!contaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fin_conciliacoes_mensais')
        .select('*')
        .eq('conta_bancaria_id', contaId!)
        .order('competencia', { ascending: false });
      if (error) throw error;
      return data as ConciliacaoMensal[];
    },
  });
}

/**
 * O mês pedido (se já gravado) com os itens, e o mês anterior: as pendências dele entram neste quando está fechado.
 * Sem mês anterior gravado, o mês é a implantação e as pendências de abertura são lançadas à mão.
 */
export function useMesConciliacao(contaId: string | null, competencia: string | null) {
  return useQuery({
    queryKey: [CHAVE, 'mes', contaId, competencia],
    enabled: !!contaId && !!competencia,
    queryFn: async () => {
      const { data: meses, error } = await supabase
        .from('fin_conciliacoes_mensais')
        .select('*')
        .eq('conta_bancaria_id', contaId!)
        .in('competencia', [competencia!, competenciaAnterior(competencia!)]);
      if (error) throw error;
      const mes = (meses ?? []).find((m) => m.competencia === competencia) ?? null;
      const anterior = (meses ?? []).find((m) => m.competencia !== competencia) ?? null;
      return {
        mes,
        itens: mes ? await itensDe(mes.id) : [],
        anterior,
        itensAnterior: anterior?.situacao === 'fechada' ? await itensDe(anterior.id) : [],
      };
    },
  });
}

export function useSalvarConciliacaoMensal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (p: { contaId: string; competencia: string; dados: DadosConciliacaoMensal; itens: ItemParaGravar[]; fechar: boolean }) => {
      const { data: id, error } = await supabase.rpc('salvar_conciliacao_mensal', {
        p_conta_bancaria_id: p.contaId,
        p_competencia: p.competencia,
        p_dados: p.dados as never,
        p_itens: p.itens as never,
      });
      if (error) throw error;
      if (p.fechar) {
        const { error: erroFechar } = await supabase.rpc('fechar_conciliacao_mensal', { p_id: id });
        if (erroFechar) throw erroFechar;
      }
      return p.fechar;
    },
    onSuccess: (fechou) => {
      queryClient.invalidateQueries({ queryKey: [CHAVE] });
      toast({ title: fechou ? 'Mês fechado' : 'Rascunho salvo' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao gravar a conciliação', description: error.message, variant: 'destructive' });
    },
  });
}

export function useReabrirConciliacaoMensal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (p: { id: string; motivo: string }) => {
      const { error } = await supabase.rpc('reabrir_conciliacao_mensal', { p_id: p.id, p_motivo: p.motivo });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CHAVE] });
      toast({ title: 'Mês reaberto' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao reabrir', description: error.message, variant: 'destructive' });
    },
  });
}

/** Pede à IA grupos de pendências que se correspondem; devolve a resposta crua (a tela confere com `sugestoesValidas`). */
export function useSugerirCasamentos() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (pendencias: PendenciaParaIa[]) => {
      const { data, error } = await supabase.functions.invoke('conciliacao-ia-sugestoes', { body: { pendencias } });
      if (error) {
        // Respostas 4xx da função chegam como FunctionsHttpError; a mensagem útil está no corpo.
        const corpo = await (error as { context?: Response }).context?.json?.().catch(() => null);
        throw new Error(corpo?.error || error.message || 'Falha ao pedir as sugestões');
      }
      return ((data as { sugestoes?: unknown })?.sugestoes ?? []) as { ids: unknown; motivo: unknown }[];
    },
    onError: (error: Error) => {
      toast({ title: 'Não foi possível sugerir casamentos', description: error.message, variant: 'destructive' });
    },
  });
}
