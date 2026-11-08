/**
 * Prazos dos processos de contratação (P3, migração 20261128090000): prazos de cada processo (processo_prazos), a
 * trilha das remarcações, os tipos com os avisos padrão (compras_prazo_tipos) e a lista do pop-up e do sino
 * (compras_meus_prazos). Ler exige compras.processos.visualizar ou editar; gravar, compras.processos.editar. O prazo
 * da próxima ação nasce e muda pela movimentação (aqui só os avisos dele mudam).
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';
import type { MeuPrazo } from '@/lib/compras/prazos';

export type ProcessoPrazo = Tables<'processo_prazos'>;
export type ProcessoPrazoRemarcacao = Tables<'processo_prazo_remarcacoes'>;
export type TipoPrazo = Pick<Tables<'compras_prazo_tipos'>, 'tipo' | 'rotulo' | 'avisos_padrao'>;

export interface NovoPrazo {
  processo_id: string;
  tipo: string;
  descricao: string | null;
  data_limite: string;
  responsavel_servidor_id: string | null;
  responsavel_setor: string | null;
  avisos_dias: number[];
}

function mensagemErro(e: unknown): string {
  const erro = e as { code?: string; message?: string };
  if (erro?.code === '42501') return 'Você não tem permissão para editar os prazos dos processos.';
  return erro?.message || 'Erro inesperado.';
}

/** Invalida o que mostra prazos: a aba, a trilha, o pop-up e o sino. */
export function invalidarPrazos(qc: ReturnType<typeof useQueryClient>, processoId?: string) {
  qc.invalidateQueries({ queryKey: ['processo-prazos', ...(processoId ? [processoId] : [])] });
  qc.invalidateQueries({ queryKey: ['processo-prazo-remarcacoes', ...(processoId ? [processoId] : [])] });
  qc.invalidateQueries({ queryKey: ['compras-meus-prazos'] });
}

export function usePrazosDoProcesso(processoId: string | undefined) {
  return useQuery({
    queryKey: ['processo-prazos', processoId],
    enabled: !!processoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('processo_prazos')
        .select('*')
        .eq('processo_id', processoId!)
        .order('data_limite');
      if (error) throw error;
      return (data ?? []) as ProcessoPrazo[];
    },
  });
}

export function useRemarcacoesDoProcesso(processoId: string | undefined) {
  return useQuery({
    queryKey: ['processo-prazo-remarcacoes', processoId],
    enabled: !!processoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('processo_prazo_remarcacoes')
        .select('*')
        .eq('processo_id', processoId!)
        .order('feito_em', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ProcessoPrazoRemarcacao[];
    },
  });
}

export function useTiposPrazo() {
  return useQuery({
    queryKey: ['compras-prazo-tipos'],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('compras_prazo_tipos').select('tipo, rotulo, avisos_padrao');
      if (error) throw error;
      return (data ?? []) as TipoPrazo[];
    },
  });
}

export function useNovoPrazo() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (p: NovoPrazo) => {
      const { error } = await supabase.from('processo_prazos').insert(p);
      if (error) throw error;
      return p.processo_id;
    },
    onSuccess: (processoId) => {
      invalidarPrazos(qc, processoId);
      toast({ title: 'Prazo lançado' });
    },
    onError: (e) => toast({ title: 'Não foi possível lançar o prazo', description: mensagemErro(e), variant: 'destructive' }),
  });
}

export type AcaoPrazo =
  | { acao: 'remarcar'; data_limite: string; motivo: string }
  | { acao: 'cumprir' }
  | { acao: 'cancelar'; motivo: string }
  | { acao: 'avisos'; avisos_dias: number[] };

const TITULO_ACAO: Record<AcaoPrazo['acao'], [string, string]> = {
  remarcar: ['Prazo remarcado', 'Não foi possível remarcar o prazo'],
  cumprir: ['Prazo cumprido', 'Não foi possível marcar como cumprido'],
  cancelar: ['Prazo cancelado', 'Não foi possível cancelar o prazo'],
  avisos: ['Avisos salvos', 'Não foi possível salvar os avisos'],
};

/** Remarcar (motivo e data não passada), cumprir, cancelar (motivo) ou mudar os avisos. O banco confere as regras. */
export function useAlterarPrazo() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ prazo, ...a }: AcaoPrazo & { prazo: Pick<ProcessoPrazo, 'id' | 'processo_id'> }) => {
      const campos =
        a.acao === 'remarcar' ? { data_limite: a.data_limite, remarcacao_motivo: a.motivo }
        : a.acao === 'cumprir' ? { situacao: 'cumprido' }
        : a.acao === 'cancelar' ? { situacao: 'cancelado', conclusao_motivo: a.motivo }
        : { avisos_dias: a.avisos_dias };
      const { error } = await supabase.from('processo_prazos').update(campos).eq('id', prazo.id);
      if (error) throw error;
      return { processoId: prazo.processo_id, acao: a.acao };
    },
    onSuccess: ({ processoId, acao }) => {
      invalidarPrazos(qc, processoId);
      toast({ title: TITULO_ACAO[acao][0] });
    },
    onError: (e, v) => toast({ title: TITULO_ACAO[v.acao][1], description: mensagemErro(e), variant: 'destructive' }),
  });
}

/** Avisos padrão por tipo (quem edita processos). Só os tipos que mudaram. */
export function useSalvarTiposPrazo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tipos: Pick<TipoPrazo, 'tipo' | 'avisos_padrao'>[]) => {
      for (const t of tipos) {
        const { error } = await supabase
          .from('compras_prazo_tipos')
          .update({ avisos_padrao: t.avisos_padrao })
          .eq('tipo', t.tipo);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['compras-prazo-tipos'] }),
  });
}

/** Pop-up e sino: vai em todas as telas de módulo, então guarda por 5 minutos. Sem acesso, a lista vem vazia. */
export function useMeusPrazos(ativo = true) {
  return useQuery({
    queryKey: ['compras-meus-prazos'],
    enabled: ativo,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('compras_meus_prazos');
      if (error) throw error;
      return (data ?? []) as MeuPrazo[];
    },
  });
}

export interface ProximoPrazo {
  data_limite: string;
  tipo: string;
}

/** Lista de processos: o prazo em aberto mais próximo de cada processo (qualquer tipo). */
export function useProximosPrazos() {
  return useQuery({
    queryKey: ['processo-prazos', 'proximos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('processo_prazos')
        .select('processo_id, data_limite, tipo')
        .in('situacao', ['aberto', 'remarcado'])
        .order('data_limite')
        .range(0, 4999);
      if (error) throw error;
      const mapa = new Map<string, ProximoPrazo>();
      for (const p of data ?? []) if (!mapa.has(p.processo_id)) mapa.set(p.processo_id, { data_limite: p.data_limite, tipo: p.tipo });
      return mapa;
    },
  });
}
