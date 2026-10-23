/**
 * PCA (Plano de Contratações Anual) do módulo Compras: planos por exercício, tetos por ação × fonte, itens lançados a
 * partir dos DFDs do SEI e o catálogo CATMAT/CATSER. Migração 20261028090000; leitura com `compras.pca.visualizar`,
 * escrita com `compras.pca.editar` (RLS). Ações, fontes e naturezas vêm de `pca_classificadores` (são do módulo
 * financeiro); itens de um PDM e a atualização do catálogo passam pela Edge Function `catalogo-compras`.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type PcaPlano = Tables<'pca_planos'>;
export type PcaTeto = Tables<'pca_tetos'>;
export type PcaItem = Tables<'pca_itens'>;
export type PcaItemInput = Omit<TablesInsert<'pca_itens'>, 'plano_id'> & { id?: string };
export type PdmCatalogo = Tables<'cat_material_pdms'>;
export type ServicoCatalogo = Tables<'cat_servicos'>;

export interface Classificador {
  id: string;
  codigo: string;
  nome: string;
}

export interface ClassificadoresPca {
  acoes: Classificador[];
  fontes: Classificador[];
  naturezas: Classificador[];
  qdd_linhas: number;
}

export interface ItemCatalogoPortal {
  codigoItem: number;
  descricao: string;
  sustentavel: boolean;
}

const CHAVE = 'pca';

/** Mensagem do banco em português; duplicidade de exercício ganha texto próprio. */
function mensagemErro(e: unknown): string {
  const erro = e as { code?: string; message?: string };
  if (erro?.code === '23505') return 'Já existe PCA para este exercício.';
  if (erro?.code === '42501') return 'Você não tem permissão para editar o PCA.';
  return erro?.message || 'Erro inesperado.';
}

/** Erro da Edge Function com o texto que ela devolveu ({ error }). */
async function erroDaFuncao(error: unknown): Promise<Error> {
  const contexto = (error as { context?: Response })?.context;
  try {
    const corpo = contexto ? await contexto.json() : null;
    if (corpo?.error) return new Error(corpo.error);
  } catch {
    // corpo sem JSON: usa a mensagem padrão
  }
  return new Error('Não foi possível falar com o catálogo de compras.');
}

async function chamarCatalogo<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('catalogo-compras', { body });
  if (error) throw await erroDaFuncao(error);
  return data as T;
}

export function usePcaPlanos() {
  return useQuery({
    queryKey: [CHAVE, 'planos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('pca_planos').select('*').order('exercicio', { ascending: false });
      if (error) throw error;
      return data as PcaPlano[];
    },
  });
}

/** Resumo de cada plano para a lista: quantidade de itens ativos e total. */
export function usePcaResumoPlanos() {
  return useQuery({
    queryKey: [CHAVE, 'resumo'],
    queryFn: async () => {
      const { data, error } = await supabase.from('pca_itens').select('plano_id, valor_total').eq('situacao', 'ativo');
      if (error) throw error;
      const resumo = new Map<string, { itens: number; total: number }>();
      for (const i of data ?? []) {
        const r = resumo.get(i.plano_id) ?? { itens: 0, total: 0 };
        r.itens += 1;
        r.total += Math.round(Number(i.valor_total ?? 0) * 100);
        resumo.set(i.plano_id, r);
      }
      return new Map([...resumo].map(([k, v]) => [k, { itens: v.itens, total: v.total / 100 }]));
    },
  });
}

export function usePcaPlano(exercicio: number | undefined) {
  return useQuery({
    queryKey: [CHAVE, 'plano', exercicio],
    enabled: !!exercicio,
    queryFn: async () => {
      const { data, error } = await supabase.from('pca_planos').select('*').eq('exercicio', exercicio!).maybeSingle();
      if (error) throw error;
      return data as PcaPlano | null;
    },
  });
}

export function useCriarPcaPlano() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (exercicio: number) => {
      const { data, error } = await supabase.from('pca_planos').insert({ exercicio }).select().single();
      if (error) throw error;
      return data as PcaPlano;
    },
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: [CHAVE] });
      toast({ title: `PCA ${p.exercicio} criado` });
    },
    onError: (e) => toast({ title: 'Não foi possível criar o PCA', description: mensagemErro(e), variant: 'destructive' }),
  });
}

export function useClassificadoresPca(exercicio: number | undefined) {
  return useQuery({
    queryKey: [CHAVE, 'classificadores', exercicio],
    enabled: !!exercicio,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('pca_classificadores', { _exercicio: exercicio! });
      if (error) throw error;
      return data as unknown as ClassificadoresPca;
    },
  });
}

export function usePcaTetos(planoId: string | undefined) {
  return useQuery({
    queryKey: [CHAVE, 'tetos', planoId],
    enabled: !!planoId,
    queryFn: async () => {
      const { data, error } = await supabase.from('pca_tetos').select('*').eq('plano_id', planoId!);
      if (error) throw error;
      return data as PcaTeto[];
    },
  });
}

export function useSalvarPcaTeto() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (t: { plano_id: string; acao_id: string; fonte_recurso_id: string; valor_previsto: number }) => {
      const { error } = await supabase
        .from('pca_tetos')
        .upsert({ ...t, origem: 'ploa' }, { onConflict: 'plano_id,acao_id,fonte_recurso_id' });
      if (error) throw error;
    },
    onSuccess: (_d, t) => qc.invalidateQueries({ queryKey: [CHAVE, 'tetos', t.plano_id] }),
    onError: (e) => toast({ title: 'Não foi possível salvar o teto', description: mensagemErro(e), variant: 'destructive' }),
  });
}

export function useUsarQddPca() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (planoId: string) => {
      const { data, error } = await supabase.rpc('pca_usar_qdd', { _plano_id: planoId });
      if (error) throw error;
      return data as number;
    },
    onSuccess: (n, planoId) => {
      qc.invalidateQueries({ queryKey: [CHAVE, 'tetos', planoId] });
      toast({ title: 'Tetos trocados pelo QDD', description: `${n} combinação(ões) de ação e fonte.` });
    },
    onError: (e) => toast({ title: 'Não foi possível usar o QDD', description: mensagemErro(e), variant: 'destructive' }),
  });
}

export function usePcaItens(planoId: string | undefined) {
  return useQuery({
    queryKey: [CHAVE, 'itens', planoId],
    enabled: !!planoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pca_itens')
        .select('*')
        .eq('plano_id', planoId!)
        .order('mes_desejado')
        .order('created_at');
      if (error) throw error;
      return data as PcaItem[];
    },
  });
}

export function useSalvarPcaItem(planoId: string | undefined) {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, ...item }: PcaItemInput) => {
      if (!planoId) throw new Error('PCA não carregado.');
      // o item escolhido no portal entra no catálogo local antes (FK de pca_itens.codigo_item)
      if (item.codigo_item) await chamarCatalogo<{ ok: boolean }>({ acao: 'gravar_item', codigoItem: item.codigo_item });
      const { error } = id
        ? await supabase.from('pca_itens').update(item).eq('id', id)
        : await supabase.from('pca_itens').insert({ ...item, plano_id: planoId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CHAVE] });
      toast({ title: 'Item salvo no PCA' });
    },
    onError: (e) => toast({ title: 'Não foi possível salvar o item', description: mensagemErro(e), variant: 'destructive' }),
  });
}

/** Tira o item do PCA (situacao = excluido; nada se apaga). */
export function useExcluirPcaItem() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pca_itens').update({ situacao: 'excluido' }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CHAVE] });
      toast({ title: 'Item retirado do PCA' });
    },
    onError: (e) => toast({ title: 'Não foi possível retirar o item', description: mensagemErro(e), variant: 'destructive' }),
  });
}

/** Busca local no catálogo (PDMs de material ou serviços), por palavras, até 30 resultados. */
export function useBuscarCatalogo(termo: string, tipo: 'material' | 'servico') {
  const busca = termo.trim();
  return useQuery({
    queryKey: [CHAVE, 'catalogo', tipo, busca],
    enabled: busca.length >= 3,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      if (tipo === 'material') {
        const { data, error } = await supabase
          .from('cat_material_pdms')
          .select('*')
          .eq('ativo', true)
          .textSearch('nome_pdm', busca, { type: 'websearch', config: 'portuguese' })
          .order('nome_pdm')
          .limit(30);
        if (error) throw error;
        return data as PdmCatalogo[];
      }
      const { data, error } = await supabase
        .from('cat_servicos')
        .select('*')
        .eq('ativo', true)
        .textSearch('nome_servico', busca, { type: 'websearch', config: 'portuguese' })
        .order('nome_servico')
        .limit(30);
      if (error) throw error;
      return data as ServicoCatalogo[];
    },
  });
}

/** Nomes do catálogo para a lista de itens (PDMs e serviços usados no plano). */
export function useNomesCatalogo(itens: PcaItem[] | undefined) {
  const pdms = [...new Set((itens ?? []).map((i) => i.codigo_pdm).filter((c): c is number => !!c))].sort();
  const servicos = [...new Set((itens ?? []).map((i) => i.codigo_servico).filter((c): c is number => !!c))].sort();
  return useQuery({
    queryKey: [CHAVE, 'nomes-catalogo', pdms.join(','), servicos.join(',')],
    enabled: pdms.length + servicos.length > 0,
    queryFn: async () => {
      const [p, s] = await Promise.all([
        pdms.length
          ? supabase.from('cat_material_pdms').select('codigo_pdm, nome_pdm, codigo_grupo, nome_grupo').in('codigo_pdm', pdms)
          : Promise.resolve({ data: [], error: null }),
        servicos.length
          ? supabase.from('cat_servicos').select('codigo_servico, nome_servico, codigo_secao, nome_secao').in('codigo_servico', servicos)
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (p.error) throw p.error;
      if (s.error) throw s.error;
      const grupos = new Map<string, string>();
      for (const r of (p.data ?? []) as Pick<PdmCatalogo, 'codigo_pdm' | 'nome_grupo'>[]) grupos.set(`m${r.codigo_pdm}`, r.nome_grupo);
      for (const r of (s.data ?? []) as Pick<ServicoCatalogo, 'codigo_servico' | 'nome_secao'>[]) grupos.set(`s${r.codigo_servico}`, r.nome_secao);
      return grupos;
    },
  });
}

/** Itens ativos de um PDM, buscados no portal na hora (não ficam no banco até serem usados). */
export function useItensDoPdm(codigoPdm: number | null) {
  return useQuery({
    queryKey: [CHAVE, 'itens-pdm', codigoPdm],
    enabled: !!codigoPdm,
    staleTime: 30 * 60_000,
    retry: false,
    queryFn: async () => (await chamarCatalogo<{ itens: ItemCatalogoPortal[] }>({ acao: 'itens_pdm', codigoPdm })).itens,
  });
}

export function useSincronizacoesCatalogo() {
  return useQuery({
    queryKey: [CHAVE, 'sincronizacoes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('cat_sincronizacoes').select('*');
      if (error) throw error;
      return data as Tables<'cat_sincronizacoes'>[];
    },
  });
}

/** Atualiza o catálogo página por página (PDMs e serviços), avisando o progresso. */
export function useSincronizarCatalogo() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (aoProgredir: (texto: string) => void) => {
      for (const tipo of ['pdm', 'servico'] as const) {
        const nome = tipo === 'pdm' ? 'materiais' : 'serviços';
        let pagina = 1;
        let total = 1;
        do {
          aoProgredir(`Baixando ${nome}: página ${pagina} de ${total === 1 && pagina === 1 ? '…' : total}`);
          const r = await chamarCatalogo<{ pagina: number; totalPaginas: number }>({ acao: 'sincronizar', tipo, pagina });
          total = r.totalPaginas;
          pagina += 1;
        } while (pagina <= total);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CHAVE] });
      toast({ title: 'Catálogo atualizado' });
    },
    onError: (e) => toast({ title: 'Atualização do catálogo parou', description: mensagemErro(e), variant: 'destructive' }),
  });
}
