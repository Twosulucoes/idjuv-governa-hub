/**
 * Pesquisa de preços do módulo Compras: pesquisas por processo SEI, itens e amostras com a fonte. Migração
 * 20261105090000; leitura com `compras.pesquisa_precos.visualizar`, escrita com `compras.pesquisa_precos.editar`
 * (RLS). Os preços do Compras.gov.br e do PNCP vêm da Edge Function `pesquisa-precos` (só leitura); a tela grava as
 * amostras escolhidas. O saneamento e o método são calculados em `src/lib/compras/pesquisaPrecos.ts`.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import type { ReferenciaPncp } from '@/lib/compras/pesquisaPrecos';

export type PesquisaPrecos = Tables<'pesquisas_precos'>;
export type PesquisaPrecosItem = Tables<'pesquisas_precos_itens'>;
export type PesquisaPrecosAmostra = Tables<'pesquisas_precos_amostras'>;
export type PesquisaPrecosInput = Omit<TablesInsert<'pesquisas_precos'>, 'situacao'> & { id?: string };
export type PesquisaPrecosItemInput = Omit<TablesInsert<'pesquisas_precos_itens'>, 'pesquisa_id'> & { id?: string };
export type AmostraInput = Omit<TablesInsert<'pesquisas_precos_amostras'>, 'item_id'>;

/** Preço devolvido pela função (mesmo formato de supabase/functions/pesquisa-precos/portal.ts). */
export interface PrecoEncontrado {
  idExterno: string;
  parametro: 1 | 2;
  origem: 'compras_gov' | 'pncp';
  descricao: string | null;
  orgao: string | null;
  uasg: string | null;
  uf: string | null;
  municipio: string | null;
  numeroCompra: string | null;
  idCompra: string | null;
  modalidade: string | null;
  dataReferencia: string | null;
  fornecedorNome: string | null;
  fornecedorNi: string | null;
  marca: string | null;
  unidade: string | null;
  quantidade: number | null;
  precoUnitario: number;
  link: string | null;
}

export interface CompraPncp {
  orgao: string | null;
  unidade: string | null;
  uf: string | null;
  municipio: string | null;
  modalidade: string | null;
  numeroCompra: string | null;
  processo: string | null;
  objeto: string | null;
  numeroControle: string | null;
  dataPublicacao: string | null;
  link: string;
}

export interface ItemPncp {
  numeroItem: number;
  descricao: string | null;
  unidade: string | null;
  quantidade: number | null;
  valorUnitarioEstimado: number | null;
  temResultado: boolean;
  situacao: string | null;
}

const CHAVE = 'pesquisa-precos';

function mensagemErro(e: unknown): string {
  const erro = e as { code?: string; message?: string };
  if (erro?.code === '23505') return 'Esse preço já está no item.';
  if (erro?.code === '42501') return 'Você não tem permissão para alterar a pesquisa de preços.';
  if (erro?.code === '55000') return 'A pesquisa está concluída: reabra para alterar.';
  if (erro?.code === '23514') return 'Confira os campos obrigatórios da fonte do preço.';
  return erro?.message || 'Erro inesperado.';
}

async function erroDaFuncao(error: unknown): Promise<Error> {
  const contexto = (error as { context?: Response })?.context;
  try {
    const corpo = contexto ? await contexto.json() : null;
    if (corpo?.error) return new Error(corpo.error);
  } catch {
    // corpo sem JSON: usa a mensagem padrão
  }
  return new Error('Não foi possível falar com o portal de compras.');
}

async function chamarFuncao<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('pesquisa-precos', { body });
  if (error) throw await erroDaFuncao(error);
  return data as T;
}

export function usePesquisasPrecos() {
  return useQuery({
    queryKey: [CHAVE, 'lista'],
    queryFn: async () => {
      const { data, error } = await supabase.from('pesquisas_precos').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as PesquisaPrecos[];
    },
  });
}

export function usePesquisaPrecos(id: string | undefined) {
  return useQuery({
    queryKey: [CHAVE, 'pesquisa', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('pesquisas_precos').select('*').eq('id', id!).maybeSingle();
      if (error) throw error;
      return data as PesquisaPrecos | null;
    },
  });
}

/** Itens da pesquisa com as amostras de cada um. */
export function useItensPesquisa(pesquisaId: string | undefined) {
  return useQuery({
    queryKey: [CHAVE, 'itens', pesquisaId],
    enabled: !!pesquisaId,
    queryFn: async () => {
      const { data: itens, error } = await supabase
        .from('pesquisas_precos_itens').select('*').eq('pesquisa_id', pesquisaId!).order('numero');
      if (error) throw error;
      const ids = (itens ?? []).map((i) => i.id);
      const { data: amostras, error: e2 } = ids.length
        ? await supabase.from('pesquisas_precos_amostras').select('*').in('item_id', ids).order('preco_unitario')
        : { data: [], error: null };
      if (e2) throw e2;
      return (itens ?? []).map((i) => ({
        ...i,
        amostras: ((amostras ?? []) as PesquisaPrecosAmostra[]).filter((a) => a.item_id === i.id),
      }));
    },
  });
}
export type ItemComAmostras = PesquisaPrecosItem & { amostras: PesquisaPrecosAmostra[] };

function useInvalidar() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: [CHAVE] });
}

export function useSalvarPesquisa() {
  const invalidar = useInvalidar();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (p: PesquisaPrecosInput) => {
      const { id, ...campos } = p;
      const consulta = id
        ? supabase.from('pesquisas_precos').update(campos as TablesUpdate<'pesquisas_precos'>).eq('id', id)
        : supabase.from('pesquisas_precos').insert(campos);
      const { data, error } = await consulta.select().single();
      if (error) throw error;
      return data as PesquisaPrecos;
    },
    onSuccess: () => invalidar(),
    onError: (e) => toast({ title: 'Não foi possível salvar a pesquisa', description: mensagemErro(e), variant: 'destructive' }),
  });
}

export function useSituacaoPesquisa() {
  const invalidar = useInvalidar();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, situacao }: { id: string; situacao: 'em_andamento' | 'concluida' }) => {
      const { error } = await supabase.from('pesquisas_precos').update({ situacao }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidar(),
    onError: (e) => toast({ title: 'Não foi possível mudar a situação', description: mensagemErro(e), variant: 'destructive' }),
  });
}

export function useSalvarItemPesquisa(pesquisaId: string | undefined) {
  const invalidar = useInvalidar();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (item: PesquisaPrecosItemInput) => {
      const { id, ...campos } = item;
      const { error } = id
        ? await supabase.from('pesquisas_precos_itens').update(campos as TablesUpdate<'pesquisas_precos_itens'>).eq('id', id)
        : await supabase.from('pesquisas_precos_itens').insert({ ...campos, pesquisa_id: pesquisaId! });
      if (error) throw error;
    },
    onSuccess: () => invalidar(),
    onError: (e) => toast({ title: 'Não foi possível salvar o item', description: mensagemErro(e), variant: 'destructive' }),
  });
}

export function useExcluirItemPesquisa() {
  const invalidar = useInvalidar();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pesquisas_precos_itens').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidar(),
    onError: (e) => toast({ title: 'Não foi possível apagar o item', description: mensagemErro(e), variant: 'destructive' }),
  });
}

/** Grava várias amostras de uma vez; a mesma linha da fonte que já está no item é ignorada. */
export function useIncluirAmostras(itemId: string | undefined) {
  const invalidar = useInvalidar();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (amostras: AmostraInput[]) => {
      const linhas = amostras.map((a) => ({ ...a, item_id: itemId! }));
      const comChave = linhas.filter((l) => l.id_externo);
      const semChave = linhas.filter((l) => !l.id_externo);
      if (comChave.length) {
        const { error } = await supabase.from('pesquisas_precos_amostras')
          .upsert(comChave, { onConflict: 'item_id,id_externo', ignoreDuplicates: true });
        if (error) throw error;
      }
      if (semChave.length) {
        const { error } = await supabase.from('pesquisas_precos_amostras').insert(semChave);
        if (error) throw error;
      }
      return linhas.length;
    },
    onSuccess: () => invalidar(),
    onError: (e) => toast({ title: 'Não foi possível incluir os preços', description: mensagemErro(e), variant: 'destructive' }),
  });
}

export function useAlterarAmostra() {
  const invalidar = useInvalidar();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, ...campos }: TablesUpdate<'pesquisas_precos_amostras'> & { id: string }) => {
      const { error } = await supabase.from('pesquisas_precos_amostras').update(campos).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidar(),
    onError: (e) => toast({ title: 'Não foi possível alterar o preço', description: mensagemErro(e), variant: 'destructive' }),
  });
}

export function useExcluirAmostra() {
  const invalidar = useInvalidar();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pesquisas_precos_amostras').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidar(),
    onError: (e) => toast({ title: 'Não foi possível apagar o preço', description: mensagemErro(e), variant: 'destructive' }),
  });
}

export interface FiltroComprasGov {
  tipo: 'material' | 'servico';
  campo: 'codigoItemCatalogo' | 'codigoPdm';
  codigo: number;
  dataInicio: string;
  dataFim: string;
}

/** Até MAX_PAGINAS páginas de 500 preços do Compras.gov.br; avisa quando a busca foi cortada. */
export const MAX_PAGINAS_COMPRAS = 6;

export async function buscarPrecosComprasGov(
  filtro: FiltroComprasGov,
  aoProgredir?: (pagina: number, total: number) => void,
): Promise<{ precos: PrecoEncontrado[]; totalRegistros: number; cortado: boolean }> {
  const precos: PrecoEncontrado[] = [];
  let totalPaginas = 1;
  let totalRegistros = 0;
  for (let pagina = 1; pagina <= Math.min(totalPaginas, MAX_PAGINAS_COMPRAS); pagina += 1) {
    const r = await chamarFuncao<{ precos: PrecoEncontrado[]; totalPaginas: number; totalRegistros: number }>({
      acao: 'precos_compras', ...filtro, pagina,
    });
    precos.push(...r.precos);
    totalPaginas = r.totalPaginas;
    totalRegistros = r.totalRegistros;
    aoProgredir?.(pagina, Math.min(totalPaginas, MAX_PAGINAS_COMPRAS));
  }
  return { precos, totalRegistros, cortado: totalPaginas > MAX_PAGINAS_COMPRAS };
}

export const buscarCompraPncp = (ref: ReferenciaPncp) =>
  chamarFuncao<{ compra: CompraPncp; itens: ItemPncp[] }>({ acao: 'pncp_compra', ...ref });

export const buscarResultadosPncp = (ref: ReferenciaPncp, numeroItem: number) =>
  chamarFuncao<{ precos: PrecoEncontrado[] }>({ acao: 'pncp_resultados', ...ref, numeroItem });

/** Preço encontrado → linha de amostra, com a data e hora desta consulta. */
export function amostraDoPreco(p: PrecoEncontrado, consultadoEm: string): AmostraInput {
  return {
    parametro: p.parametro,
    origem: p.origem,
    id_externo: p.idExterno,
    descricao: p.descricao,
    orgao: p.orgao,
    uasg: p.uasg,
    uf: p.uf,
    municipio: p.municipio,
    numero_compra: p.numeroCompra,
    id_compra: p.idCompra,
    modalidade: p.modalidade,
    data_referencia: p.dataReferencia,
    fornecedor_nome: p.fornecedorNome,
    fornecedor_ni: p.fornecedorNi && /^(\d{11}|\d{14})$/.test(p.fornecedorNi) ? p.fornecedorNi : null,
    marca: p.marca,
    unidade: p.unidade?.slice(0, 60) ?? null,
    quantidade: p.quantidade && p.quantidade > 0 ? p.quantidade : null,
    preco_unitario: p.precoUnitario,
    link: p.link,
    consultado_em: consultadoEm,
  };
}
