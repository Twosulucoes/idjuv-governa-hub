/**
 * Processos de contratação do módulo Compras: o processo (processos_licitatorios, com etapa, setor e situação), a linha
 * do tempo do andamento no SEI (processo_andamentos) e os empenhos do FIP 614 ligados pelo nº SEI (processo_empenhos,
 * porque fin_empenhos é do financeiro). Migração 20261029090000; leitura com `compras.processos.visualizar`, escrita
 * com `compras.processos.editar`.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { TablesInsert } from '@/integrations/supabase/types';
import type { ProcessoAndamento, ProcessoContratacao } from '@/types/processos';

export type ProcessoInput = Pick<
  TablesInsert<'processos_licitatorios'>,
  'numero_processo' | 'ano' | 'objeto' | 'objeto_resumido' | 'modalidade' | 'valor_estimado' | 'valor_estimado_obs'
> & { id?: string };

export type AndamentoInput = Pick<TablesInsert<'processo_andamentos'>, 'processo_id' | 'data' | 'etapa' | 'setor' | 'situacao'>;

export interface EmpenhoDoProcesso {
  processo_id: string;
  empenho_id: string;
  numero: string;
  exercicio: number;
  data_empenho: string;
  natureza: string | null;
  fonte: string | null;
  credor: string | null;
  valor_empenhado: number;
  valor_anulado: number;
  valor_liquidado: number;
  valor_pago: number;
}

const CHAVE = 'processos-contratacao';

function mensagemErro(e: unknown): string {
  const erro = e as { code?: string; message?: string };
  if (erro?.code === '23505') return 'Já existe processo com este número SEI.';
  if (erro?.code === '42501') return 'Você não tem permissão para editar processos de contratação.';
  return erro?.message || 'Erro inesperado.';
}

export function useProcessos() {
  return useQuery({
    queryKey: [CHAVE],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('processos_licitatorios')
        .select('*')
        .order('ano', { ascending: false })
        .order('numero_processo');
      if (error) throw error;
      return data as ProcessoContratacao[];
    },
  });
}

export function useProcesso(id: string | undefined) {
  return useQuery({
    queryKey: ['processo-contratacao', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('processos_licitatorios').select('*').eq('id', id!).maybeSingle();
      if (error) throw error;
      return data as ProcessoContratacao | null;
    },
  });
}

export function useSalvarProcesso() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, ...dados }: ProcessoInput) => {
      const consulta = id
        ? supabase.from('processos_licitatorios').update(dados).eq('id', id)
        : supabase.from('processos_licitatorios').insert(dados);
      const { data, error } = await consulta.select('*').single();
      if (error) throw error;
      return data as ProcessoContratacao;
    },
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: [CHAVE] });
      qc.invalidateQueries({ queryKey: ['processo-contratacao', p.id] });
      toast({ title: 'Processo salvo' });
    },
    onError: (e) => toast({ title: 'Não foi possível salvar o processo', description: mensagemErro(e), variant: 'destructive' }),
  });
}

export function useAndamentos(processoId: string | undefined) {
  return useQuery({
    queryKey: ['processo-andamentos', processoId],
    enabled: !!processoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('processo_andamentos')
        .select('*')
        .eq('processo_id', processoId!)
        .order('data', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ProcessoAndamento[];
    },
  });
}

export function useNovaMovimentacao() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (dados: AndamentoInput) => {
      const { error } = await supabase.from('processo_andamentos').insert(dados);
      if (error) throw error;
      return dados.processo_id;
    },
    onSuccess: (processoId) => {
      qc.invalidateQueries({ queryKey: ['processo-andamentos', processoId] });
      qc.invalidateQueries({ queryKey: ['processo-contratacao', processoId] });
      qc.invalidateQueries({ queryKey: [CHAVE] });
      toast({ title: 'Movimentação registrada' });
    },
    onError: (e) => toast({ title: 'Não foi possível registrar a movimentação', description: mensagemErro(e), variant: 'destructive' }),
  });
}

/** Empenhos ligados pelo nº SEI; sem `processoId`, os de todos os processos (a lista soma por processo). */
export function useEmpenhosDosProcessos(processoId?: string) {
  return useQuery({
    queryKey: ['processo-empenhos', processoId ?? 'todos'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('processo_empenhos', processoId ? { _processo_id: processoId } : {});
      if (error) throw error;
      return (data ?? []) as EmpenhoDoProcesso[];
    },
  });
}

/** Empenhado líquido (empenhado − anulado) por processo. */
export function somarEmpenhado(empenhos: EmpenhoDoProcesso[] | undefined): Map<string, number> {
  const total = new Map<string, number>();
  for (const e of empenhos ?? []) {
    total.set(e.processo_id, (total.get(e.processo_id) ?? 0) + Number(e.valor_empenhado) - Number(e.valor_anulado));
  }
  return total;
}
