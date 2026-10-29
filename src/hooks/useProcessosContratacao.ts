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

// ---------------------------------------------------------------------------------------------------------------
// Entrega 2 (migração 20261030090000): reservas por natureza, PEDs do FIPLAN, fase financeira e programação por
// natureza. Tudo por RPC: Compras não lê fin_peds nem fin_empenhos direto. Ler: ver processos ou o módulo
// financeiro; gravar reserva: compras.processos.editar.
// ---------------------------------------------------------------------------------------------------------------

export interface ReservaDoProcesso {
  id: string;
  exercicio: number;
  acao_id: string;
  acao_codigo: string;
  acao_nome: string;
  fonte_recurso_id: string;
  fonte_codigo: string;
  natureza_despesa_id: string;
  natureza_codigo: string;
  natureza_nome: string;
  pca_item_id: string | null;
  valor: number;
  situacao: 'reservada' | 'cancelada';
  justificativa_saldo: string | null;
  saldo_livre_no_momento: number | null;
  motivo_cancelamento: string | null;
  materializado: number;
  pendente: number;
  saldo_livre: number | null;
  created_at: string;
}

export interface ReservaInput {
  id?: string | null;
  processo_id: string;
  exercicio: number;
  acao_id: string;
  fonte_recurso_id: string;
  natureza_despesa_id: string;
  valor: number;
  pca_item_id?: string | null;
  justificativa?: string | null;
}

export interface PedDoProcesso {
  ped_id: string;
  exercicio: number;
  numero: string;
  empenho_numero: string | null;
  valor: number;
  situacao: string;
  data_solicitacao: string | null;
  data_autorizacao: string | null;
  natureza: string | null;
  fonte: string | null;
  licitacao: string | null;
}

export interface FinanceiroDoProcesso {
  processo_id: string;
  reservado: number;
  pendente: number;
  ped_autorizado: number;
  empenhado: number;
  liquidado: number;
  pago: number;
}

export interface ProcessoNaProgramacao {
  id: string;
  numero_processo: string;
  objeto: string;
  reservado: number;
  pendente: number;
}

export interface LinhaProgramacao {
  acao_id: string;
  acao_codigo: string;
  fonte_recurso_id: string;
  fonte_codigo: string;
  natureza_despesa_id: string;
  natureza_codigo: string;
  natureza_nome: string;
  tem_qdd: boolean;
  dotacao_atual: number;
  empenhado: number;
  bloqueado: number;
  reserva_fiplan: number;
  saldo_fiplan: number;
  pendente_processos: number;
  saldo_livre: number;
  processos: ProcessoNaProgramacao[];
}

const numeros = <T extends object>(linhas: T[] | null, campos: (keyof T)[]): T[] =>
  (linhas ?? []).map((l) => {
    const c = { ...l };
    for (const k of campos) if (c[k] !== null && c[k] !== undefined) (c[k] as unknown) = Number(c[k]);
    return c;
  });

function mensagemErroReserva(e: unknown): string {
  const erro = e as { code?: string; message?: string };
  if (erro?.code === '42501') return 'Você não tem permissão para editar processos de contratação.';
  return erro?.message || 'Erro inesperado.';
}

/** Totais financeiros por processo (lista e ficha); sem exercício, todos. */
export function useFinanceiroDosProcessos(exercicio?: number) {
  return useQuery({
    queryKey: ['processos-financeiro', exercicio ?? 'todos'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('processos_financeiro', exercicio ? { _exercicio: exercicio } : {});
      if (error) throw error;
      const linhas = numeros(data as FinanceiroDoProcesso[] | null, ['reservado', 'pendente', 'ped_autorizado', 'empenhado', 'liquidado', 'pago']);
      return new Map(linhas.map((l) => [l.processo_id, l]));
    },
  });
}

export function useReservasDoProcesso(processoId: string | undefined) {
  return useQuery({
    queryKey: ['processo-reservas', processoId],
    enabled: !!processoId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('processo_reservas_detalhe', { _processo_id: processoId! });
      if (error) throw error;
      return numeros(data as ReservaDoProcesso[] | null, ['valor', 'saldo_livre_no_momento', 'materializado', 'pendente', 'saldo_livre']);
    },
  });
}

export function usePedsDoProcesso(processoId: string | undefined) {
  return useQuery({
    queryKey: ['processo-peds', processoId],
    enabled: !!processoId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('processo_peds', { _processo_id: processoId! });
      if (error) throw error;
      return numeros(data as PedDoProcesso[] | null, ['valor']);
    },
  });
}

/** Saldo livre da combinação, sem a reserva em edição; `null` = sem dotação no QDD. */
export function useSaldoLivre(
  exercicio: number | undefined,
  acaoId: string | undefined,
  fonteId: string | undefined,
  naturezaId: string | undefined,
  ignorarReserva?: string | null,
) {
  return useQuery({
    queryKey: ['processo-saldo-livre', exercicio, acaoId, fonteId, naturezaId, ignorarReserva ?? null],
    enabled: !!exercicio && !!acaoId && !!fonteId && !!naturezaId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('processo_saldo_livre', {
        p_exercicio: exercicio!,
        p_acao: acaoId!,
        p_fonte: fonteId!,
        p_natureza: naturezaId!,
        ...(ignorarReserva ? { p_ignorar_reserva: ignorarReserva } : {}),
      });
      if (error) throw error;
      return data === null ? null : Number(data);
    },
  });
}

export function useProgramacaoPorNatureza(exercicio: number | undefined) {
  return useQuery({
    queryKey: ['programacao-natureza', exercicio],
    enabled: !!exercicio,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('programacao_por_natureza', { _exercicio: exercicio! });
      if (error) throw error;
      return numeros(data as unknown as LinhaProgramacao[] | null, [
        'dotacao_atual', 'empenhado', 'bloqueado', 'reserva_fiplan', 'saldo_fiplan', 'pendente_processos', 'saldo_livre',
      ]).map((l) => ({
        ...l,
        processos: (l.processos ?? []).map((p) => ({ ...p, reservado: Number(p.reservado), pendente: Number(p.pendente) })),
      }));
    },
  });
}

function invalidarReservas(qc: ReturnType<typeof useQueryClient>, processoId?: string) {
  qc.invalidateQueries({ queryKey: ['processo-reservas', processoId] });
  qc.invalidateQueries({ queryKey: ['processos-financeiro'] });
  qc.invalidateQueries({ queryKey: ['processo-saldo-livre'] });
  qc.invalidateQueries({ queryKey: ['programacao-natureza'] });
}

export function useSalvarReserva() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (r: ReservaInput) => {
      const { data, error } = await supabase.rpc('processo_reserva_salvar', {
        p_id: r.id ?? undefined,
        p_processo_id: r.processo_id,
        p_exercicio: r.exercicio,
        p_acao: r.acao_id,
        p_fonte: r.fonte_recurso_id,
        p_natureza: r.natureza_despesa_id,
        p_valor: r.valor,
        p_pca_item_id: r.pca_item_id ?? undefined,
        p_justificativa: r.justificativa ?? undefined,
      });
      if (error) throw error;
      return { processoId: r.processo_id, resultado: data as { id: string; saldo_livre: number | null; faltou: boolean } };
    },
    onSuccess: ({ processoId, resultado }) => {
      invalidarReservas(qc, processoId);
      toast({ title: 'Reserva salva', description: resultado.faltou ? 'Gravada com a justificativa de saldo.' : undefined });
    },
    onError: (e) => toast({ title: 'Não foi possível salvar a reserva', description: mensagemErroReserva(e), variant: 'destructive' }),
  });
}

export function useCancelarReserva() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo: string; processoId: string }) => {
      const { error } = await supabase.rpc('processo_reserva_cancelar', { p_id: id, p_motivo: motivo });
      if (error) throw error;
    },
    onSuccess: (_d, { processoId }) => {
      invalidarReservas(qc, processoId);
      toast({ title: 'Reserva cancelada' });
    },
    onError: (e) => toast({ title: 'Não foi possível cancelar a reserva', description: mensagemErroReserva(e), variant: 'destructive' }),
  });
}

/** Itens ativos do PCA com o mesmo nº SEI do processo (para "Puxar do PCA"); a RLS do PCA decide quem vê. */
export function useItensPcaDoProcesso(numeroSei: string | undefined) {
  return useQuery({
    queryKey: ['processo-pca-itens', numeroSei],
    enabled: !!numeroSei,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pca_itens')
        .select('id, descricao, valor_total, acao_id, fonte_recurso_id, natureza_despesa_id, pca_planos!inner(exercicio)')
        .eq('numero_sei', numeroSei!)
        .eq('situacao', 'ativo');
      if (error) throw error;
      return (data ?? []).map((i) => ({
        id: i.id,
        descricao: i.descricao,
        valor_total: Number(i.valor_total),
        acao_id: i.acao_id,
        fonte_recurso_id: i.fonte_recurso_id,
        natureza_despesa_id: i.natureza_despesa_id,
        exercicio: (i.pca_planos as unknown as { exercicio: number }).exercicio,
      }));
    },
  });
}
