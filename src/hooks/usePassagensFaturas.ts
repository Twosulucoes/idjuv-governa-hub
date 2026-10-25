/**
 * Faturas da agência de passagens e empenhos do contrato (migração 20261102090000). Leitura com uma das permissões de
 * passagens; escrita (fatura, bilhetes da fatura, situação e ligação de empenho) só com `contratos.passagens.financeiro`.
 * Os empenhos chegam pelas RPCs estreitas passagem_empenhos_contrato e passagem_empenhos_candidatos: quem tem
 * passagens não lê fin_empenhos. Regras de conferência e saldo em src/lib/passagens/faturas.ts.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { buscarTodasPaginas } from '@/hooks/useRelatoriosRH';
import type { TablesUpdate } from '@/integrations/supabase/types';
import type {
  BilheteDoContrato,
  EmpenhoCandidato,
  EmpenhoDoContrato,
  FaturaComItens,
  FaturaDoTrecho,
} from '@/types/passagens';

const CHAVE_FATURAS = 'passagens-faturas';
const CHAVE_BILHETES = 'passagens-bilhetes-contrato';
const CHAVE_EMPENHOS = 'passagens-empenhos-contrato';
const CHAVE_CANDIDATOS = 'passagens-empenhos-candidatos';

export interface FaturaInput {
  id?: string;
  contrato_id: string;
  numero: string;
  data_emissao: string;
  valor: number;
  processo_sei_pagamento: string | null;
  observacoes: string | null;
  itens: { trecho_id: string; valor: number }[];
}

export type SituacaoFaturaInput = Pick<
  TablesUpdate<'passagem_faturas'>,
  'situacao' | 'atesto_data' | 'atesto_documento_sei' | 'liquidacao_data' | 'pagamento_data' | 'ob_numero' | 'cancelamento_motivo'
> & { id: string };

function mensagemErro(e: unknown): string {
  const erro = e as { code?: string; message?: string; details?: string };
  const texto = `${erro?.message ?? ''} ${erro?.details ?? ''}`;
  if (erro?.code === '23505') {
    if (texto.includes('numero_key')) return 'Já existe fatura com este nº neste contrato.';
    if (texto.includes('trecho_key')) return 'Um dos bilhetes marcados já está em outra fatura.';
    if (texto.includes('contrato_empenhos')) return 'Este empenho já está ligado ao contrato.';
    return 'Registro repetido.';
  }
  if (erro?.code === '42501') {
    return erro.message?.includes('paga') ? erro.message : 'Você não tem permissão para lançar faturas de passagens.';
  }
  if (erro?.code === '23514') return 'Faltam dados obrigatórios para esta situação.';
  if (erro?.code === '22023' && erro.message) return erro.message;
  return erro?.message || 'Erro inesperado.';
}

function useAvisos() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return {
    qc,
    ok: (titulo: string) => toast({ title: titulo }),
    falha: (titulo: string) => (e: unknown) => toast({ title: titulo, description: mensagemErro(e), variant: 'destructive' }),
  };
}

const SELECT_BILHETE =
  'id, origem, destino, data_voo, situacao, localizador, numero_bilhete, companhia, data_emissao, valor_emissao, valor_multa, valor_reembolso, '
  + 'passageiro:passagem_passageiros!inner(id, nome, pedido:passagem_pedidos!inner(id, numero_sei, evento, solicitante_nome, contrato_id))';

/** Bilhetes (trechos com localizador) dos pedidos do contrato. */
export function useBilhetesContrato(contratoId: string | null | undefined) {
  return useQuery({
    queryKey: [CHAVE_BILHETES, contratoId],
    enabled: !!contratoId,
    queryFn: () =>
      buscarTodasPaginas<BilheteDoContrato>((de, ate) =>
        supabase
          .from('passagem_trechos')
          .select(SELECT_BILHETE)
          .not('localizador', 'is', null)
          .eq('passageiro.pedido.contrato_id', contratoId!)
          .order('data_emissao', { ascending: true })
          .order('id')
          .range(de, ate)),
  });
}

export function useFaturas(contratoId: string | null | undefined) {
  return useQuery({
    queryKey: [CHAVE_FATURAS, contratoId],
    enabled: !!contratoId,
    queryFn: () =>
      buscarTodasPaginas<FaturaComItens>((de, ate) =>
        supabase
          .from('passagem_faturas')
          .select('*, itens:passagem_fatura_itens(id, trecho_id, valor)')
          .eq('contrato_id', contratoId!)
          .order('data_emissao', { ascending: false })
          .order('numero')
          .order('id')
          .range(de, ate)),
  });
}

/** Fatura de cada trecho do pedido (para a ficha). */
export function useFaturasDosTrechos(trechoIds: string[]) {
  const ids = [...trechoIds].sort();
  return useQuery({
    queryKey: [CHAVE_FATURAS, 'trechos', ids],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('passagem_fatura_itens')
        .select('trecho_id, valor, fatura:passagem_faturas!inner(id, numero, situacao, pagamento_data, ob_numero)')
        .in('trecho_id', ids);
      if (error) throw error;
      return Object.fromEntries(((data ?? []) as unknown as FaturaDoTrecho[]).map((f) => [f.trecho_id, f]));
    },
  });
}

function invalidar(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: [CHAVE_FATURAS] });
  qc.invalidateQueries({ queryKey: ['passagem-historico'] });
}

/**
 * Grava a fatura e acerta os bilhetes (inclui os novos, tira os que saíram, corrige o valor dos que mudaram) numa
 * transação só, pela RPC passagem_salvar_fatura: se um bilhete falha, a nota não fica gravada pela metade.
 */
export function useSalvarFatura() {
  const { qc, ok, falha } = useAvisos();
  return useMutation({
    mutationFn: async ({ itens, ...fatura }: FaturaInput) => {
      const { data, error } = await supabase.rpc('passagem_salvar_fatura', { _fatura: fatura, _itens: itens });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (_, v) => {
      invalidar(qc);
      ok(v.id ? 'Fatura atualizada' : 'Fatura lançada');
    },
    onError: falha('Não foi possível salvar a fatura'),
  });
}

export function useMudarSituacaoFatura() {
  const { qc, ok, falha } = useAvisos();
  return useMutation({
    mutationFn: async ({ id, ...dados }: SituacaoFaturaInput) => {
      const { data, error } = await supabase.from('passagem_faturas').update(dados).eq('id', id).select('id');
      if (error) throw error;
      if (!data?.length) throw { code: '42501' };
    },
    onSuccess: () => {
      invalidar(qc);
      ok('Situação da fatura atualizada');
    },
    onError: falha('Não foi possível mudar a situação'),
  });
}

// ---------------------------------------------------------------------------- empenhos do contrato
export function useEmpenhosContrato(contratoId: string | null | undefined) {
  return useQuery({
    queryKey: [CHAVE_EMPENHOS, contratoId],
    enabled: !!contratoId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('passagem_empenhos_contrato', { _contrato_id: contratoId! });
      if (error) throw error;
      return (data ?? []) as EmpenhoDoContrato[];
    },
  });
}

export function useEmpenhosCandidatos(contratoId: string | null | undefined, exercicio: number, habilitado: boolean) {
  return useQuery({
    queryKey: [CHAVE_CANDIDATOS, contratoId, exercicio],
    enabled: !!contratoId && habilitado,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('passagem_empenhos_candidatos', {
        _contrato_id: contratoId!,
        _exercicio: exercicio,
      });
      if (error) throw error;
      return (data ?? []) as EmpenhoCandidato[];
    },
  });
}

export function useLigarEmpenho(contratoId: string) {
  const { qc, ok, falha } = useAvisos();
  return useMutation({
    mutationFn: async ({ empenhoId, ligar }: { empenhoId: string; ligar: boolean }) => {
      const { error } = ligar
        ? await supabase.from('passagem_contrato_empenhos').insert({ contrato_id: contratoId, empenho_id: empenhoId })
        : await supabase.from('passagem_contrato_empenhos').delete().eq('contrato_id', contratoId).eq('empenho_id', empenhoId);
      if (error) throw error;
      return ligar;
    },
    onSuccess: (ligar) => {
      qc.invalidateQueries({ queryKey: [CHAVE_EMPENHOS] });
      qc.invalidateQueries({ queryKey: [CHAVE_CANDIDATOS] });
      ok(ligar ? 'Empenho ligado ao contrato' : 'Empenho desligado do contrato');
    },
    onError: falha('Não foi possível mudar a ligação do empenho'),
  });
}

// ---------------------------------------------------------------------------- planilhas
/** Bilhetes emitidos no período (data de emissão), de todos os contratos, com a fatura de cada um. */
export async function buscarBilhetesPeriodo(de: string, ate: string) {
  type Item = { valor: number; fatura: { numero: string; situacao: string; pagamento_data: string | null; ob_numero: string | null } | null };
  // trecho_id é único em passagem_fatura_itens: o PostgREST pode devolver objeto ou lista
  const linhas = await buscarTodasPaginas<BilheteDoContrato & { item: Item | Item[] | null }>((inicio, fim) =>
    supabase
      .from('passagem_trechos')
      .select(SELECT_BILHETE + ', item:passagem_fatura_itens(valor, fatura:passagem_faturas(numero, situacao, pagamento_data, ob_numero))')
      .not('localizador', 'is', null)
      .gte('data_emissao', de)
      .lte('data_emissao', ate)
      .order('data_emissao')
      .order('id')
      .range(inicio, fim));
  return linhas.map(({ item, ...b }) => ({
    ...b,
    item: (Array.isArray(item) ? item[0] : item) ?? null,
  }));
}
