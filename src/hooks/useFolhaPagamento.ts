import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';
import { calcularTotaisFicha, calcularTotaisFolha, descreverErroBanco, itemJaLancado, ORDEM_ITEM_MANUAL } from '@/lib/folhaFichaRegras';

type RubricaInsert = Database['public']['Tables']['rubricas']['Insert'];
type ParametroInsert = Database['public']['Tables']['parametros_folha']['Insert'];
type ContaInsert = Database['public']['Tables']['contas_autarquia']['Insert'];
type FolhaInsert = Database['public']['Tables']['folhas_pagamento']['Insert'];
type ConfigInsert = Database['public']['Tables']['config_autarquia']['Insert'];
type FaixaINSSInsert = Database['public']['Tables']['tabela_inss']['Insert'];
type FaixaIRRFInsert = Database['public']['Tables']['tabela_irrf']['Insert'];
export type ConsignacaoRow = Database['public']['Tables']['consignacoes']['Row'];
export type DependenteIRRFRow = Database['public']['Tables']['dependentes_irrf']['Row'];

// ============== RUBRICAS ==============
export function useRubricas(apenasAtivas = false) {
  return useQuery({
    queryKey: ['rubricas', { apenasAtivas }],
    queryFn: async () => {
      let query = supabase.from('rubricas').select('*').order('codigo', { ascending: true });
      if (apenasAtivas) query = query.eq('ativo', true);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveRubrica() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rubrica: Partial<RubricaInsert> & { id?: string }) => {
      if (rubrica.id) {
        const { id, ...rest } = rubrica;
        const { data, error } = await supabase.from('rubricas').update(rest).eq('id', id).select().single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase.from('rubricas').insert(rubrica as RubricaInsert).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rubricas'] }); toast.success('Rubrica salva!'); },
    onError: (e: Error) => { toast.error(`Erro: ${e.message}`); },
  });
}

export function useDeleteRubrica() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('rubricas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rubricas'] }); toast.success('Rubrica excluída!'); },
    onError: (e: Error) => { toast.error(`Erro: ${e.message}`); },
  });
}

// ============== PARÂMETROS ==============
export function useParametrosFolha() {
  return useQuery({
    queryKey: ['parametros-folha'],
    queryFn: async () => {
      const { data, error } = await supabase.from('parametros_folha').select('*').order('tipo_parametro', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveParametro() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (param: Partial<ParametroInsert> & { id?: string }) => {
      if (param.id) {
        const { id, ...rest } = param;
        const { data, error } = await supabase.from('parametros_folha').update(rest).eq('id', id).select().single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase.from('parametros_folha').insert(param as ParametroInsert).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['parametros-folha'] }); toast.success('Parâmetro salvo!'); },
    onError: (e: Error) => { toast.error(`Erro: ${e.message}`); },
  });
}

export function useDeleteParametro() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('parametros_folha').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['parametros-folha'] }); toast.success('Parâmetro excluído!'); },
    onError: (e: Error) => { toast.error(`Erro: ${e.message}`); },
  });
}

// ============== TABELAS INSS ==============
export function useTabelaINSS() {
  return useQuery({
    queryKey: ['tabela-inss'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tabela_inss').select('*').order('faixa_ordem', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveFaixaINSS() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (faixa: Partial<FaixaINSSInsert> & { id?: string }) => {
      if (faixa.id) {
        const { id, ...rest } = faixa;
        const { data, error } = await supabase.from('tabela_inss').update(rest).eq('id', id).select().single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase.from('tabela_inss').insert(faixa as FaixaINSSInsert).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tabela-inss'] }); toast.success('Faixa INSS salva!'); },
    onError: (e: Error) => { toast.error(`Erro: ${e.message}`); },
  });
}

export function useDeleteFaixaINSS() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tabela_inss').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tabela-inss'] }); toast.success('Faixa INSS excluída!'); },
    onError: (e: Error) => { toast.error(`Erro: ${e.message}`); },
  });
}

// ============== TABELAS IRRF ==============
export function useTabelaIRRF() {
  return useQuery({
    queryKey: ['tabela-irrf'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tabela_irrf').select('*').order('faixa_ordem', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveFaixaIRRF() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (faixa: Partial<FaixaIRRFInsert> & { id?: string }) => {
      if (faixa.id) {
        const { id, ...rest } = faixa;
        const { data, error } = await supabase.from('tabela_irrf').update(rest).eq('id', id).select().single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase.from('tabela_irrf').insert(faixa as FaixaIRRFInsert).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tabela-irrf'] }); toast.success('Faixa IRRF salva!'); },
    onError: (e: Error) => { toast.error(`Erro: ${e.message}`); },
  });
}

export function useDeleteFaixaIRRF() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tabela_irrf').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tabela-irrf'] }); toast.success('Faixa IRRF excluída!'); },
    onError: (e: Error) => { toast.error(`Erro: ${e.message}`); },
  });
}

// ============== BANCOS ==============
export function useBancosCNAB(apenasAtivos = true) {
  return useQuery({
    queryKey: ['bancos-cnab', { apenasAtivos }],
    queryFn: async () => {
      let query = supabase.from('bancos_cnab').select('*').order('nome', { ascending: true });
      if (apenasAtivos) query = query.eq('ativo', true);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

// ============== CONTAS DA AUTARQUIA ==============
export function useContasAutarquia() {
  return useQuery({
    queryKey: ['contas-autarquia'],
    queryFn: async () => {
      const { data, error } = await supabase.from('contas_autarquia').select(`*, banco:bancos_cnab(id, codigo_banco, nome)`).order('descricao', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveContaAutarquia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (conta: Partial<ContaInsert> & { id?: string; banco?: unknown }) => {
      const { banco, id, ...rest } = conta;
      if (id) {
        const { data, error } = await supabase.from('contas_autarquia').update(rest).eq('id', id).select().single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase.from('contas_autarquia').insert(rest as ContaInsert).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contas-autarquia'] }); toast.success('Conta salva!'); },
    onError: (e: Error) => { toast.error(`Erro: ${e.message}`); },
  });
}

export function useDeleteContaAutarquia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contas_autarquia').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contas-autarquia'] }); toast.success('Conta excluída!'); },
    onError: (e: Error) => { toast.error(`Erro: ${e.message}`); },
  });
}

// ============== FOLHAS DE PAGAMENTO ==============
export function useFolhasPagamento(ano?: number) {
  return useQuery({
    queryKey: ['folhas-pagamento', { ano }],
    queryFn: async () => {
      let query = supabase.from('folhas_pagamento').select('*').order('competencia_ano', { ascending: false }).order('competencia_mes', { ascending: false });
      if (ano) query = query.eq('competencia_ano', ano);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateFolha() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (folha: Partial<FolhaInsert>) => {
      const { data, error } = await supabase.from('folhas_pagamento').insert(folha as FolhaInsert).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['folhas-pagamento'] }); toast.success('Folha criada!'); },
    onError: (e: Error) => { toast.error(`Erro: ${e.message}`); },
  });
}

// ============== REMESSAS BANCÁRIAS ==============
export function useRemessasFolha(folhaId?: string) {
  return useQuery({
    queryKey: ['remessas-bancarias', folhaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('remessas_bancarias')
        .select(`*, conta:contas_autarquia(descricao, banco:bancos_cnab(nome))`)
        .eq('folha_id', folhaId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!folhaId,
  });
}

// ============== EVENTOS ESOCIAL ==============
export function useEventosESocialFolha(folhaId?: string) {
  return useQuery({
    queryKey: ['eventos-esocial', folhaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('eventos_esocial')
        .select(`*, servidor:servidores(nome_completo)`)
        .eq('folha_id', folhaId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!folhaId,
  });
}

// ============== FICHAS FINANCEIRAS ==============
export function useFichasFinanceiras(folhaId?: string) {
  return useQuery({
    queryKey: ['fichas-financeiras', folhaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fichas_financeiras')
        .select(`
          *,
          servidor:servidores(id, nome_completo, cpf, matricula)
        `)
        .eq('folha_id', folhaId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!folhaId,
  });
}

export function useFichaFinanceiraDetalhe(fichaId?: string) {
  return useQuery({
    queryKey: ['ficha-financeira-detalhe', fichaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fichas_financeiras')
        .select(`
          *,
          servidor:servidores(id, nome_completo, cpf, matricula, pis_pasep, data_nascimento),
          folha:folhas_pagamento(competencia_ano, competencia_mes, tipo_folha, status)
        `)
        .eq('id', fichaId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!fichaId,
  });
}

// ============== ITENS DA FICHA ==============
type ItemFichaInsert = Database['public']['Tables']['itens_ficha_financeira']['Insert'];

export interface ItemFichaInput {
  id?: string;
  ficha_id: string;
  rubrica_id?: string | null;
  descricao: string;
  tipo: 'provento' | 'desconto';
  referencia?: string | null;
  valor: number;
  base_calculo?: number | null;
  percentual?: number | null;
  ordem?: number | null;
}

// Chaves que mudam quando um item da ficha é incluído/alterado/excluído.
function invalidarFichaEFolha(queryClient: ReturnType<typeof useQueryClient>, fichaId?: string) {
  queryClient.invalidateQueries({ queryKey: ['itens-ficha-financeira', fichaId] });
  queryClient.invalidateQueries({ queryKey: ['ficha-financeira-detalhe', fichaId] });
  queryClient.invalidateQueries({ queryKey: ['fichas-financeiras'] });
  queryClient.invalidateQueries({ queryKey: ['folha-detalhe'] });
  queryClient.invalidateQueries({ queryKey: ['folhas-pagamento'] });
  queryClient.invalidateQueries({ queryKey: ['contracheque-detalhe', fichaId] });
  queryClient.invalidateQueries({ queryKey: ['itens-folha-contagem'] });
}

/**
 * Recalcula os totais da ficha a partir dos itens e, em seguida, os da folha a partir das fichas.
 * Não é atômico e não recalcula INSS/IRRF (só o reprocessamento faz isso) — ver spec, premissa 4.
 * Em folha fechada o trigger `trg_bloquear_alteracao_ficha_fechada` recusa o UPDATE.
 */
export async function recalcularTotaisFicha(fichaId: string): Promise<void> {
  const { data: itens, error: erroItens } = await supabase
    .from('itens_ficha_financeira')
    .select('tipo, valor')
    .eq('ficha_id', fichaId);
  if (erroItens) throw erroItens;

  const totais = calcularTotaisFicha(itens ?? []);
  const { data: fichaAtualizada, error: erroFicha } = await supabase
    .from('fichas_financeiras')
    .update({
      total_proventos: totais.total_proventos,
      total_descontos: totais.total_descontos,
      valor_liquido: totais.valor_liquido,
      base_consignavel: totais.valor_liquido,
    })
    .eq('id', fichaId)
    .select('folha_id')
    .single();
  if (erroFicha) throw erroFicha;

  const folhaId = fichaAtualizada?.folha_id;
  if (!folhaId) return;

  const { data: fichas, error: erroFichas } = await supabase
    .from('fichas_financeiras')
    .select('total_proventos, total_descontos, valor_liquido, valor_inss, valor_irrf, inss_patronal, total_encargos')
    .eq('folha_id', folhaId);
  if (erroFichas) throw erroFichas;

  const totaisFolha = calcularTotaisFolha(fichas ?? []);
  const { error: erroFolha } = await supabase
    .from('folhas_pagamento')
    .update(totaisFolha)
    .eq('id', folhaId);
  if (erroFolha) throw erroFolha;
}

export function useItensFichaFinanceira(fichaId?: string) {
  return useQuery({
    queryKey: ['itens-ficha-financeira', fichaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('itens_ficha_financeira')
        .select('*')
        .eq('ficha_id', fichaId)
        .order('tipo', { ascending: true })
        .order('ordem', { ascending: true, nullsFirst: false })
        .order('descricao', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!fichaId,
  });
}

/** Quantidade de itens lançados nas fichas da folha (o reprocessamento apaga todos). */
export function useContagemItensFolha(folhaId?: string) {
  return useQuery({
    queryKey: ['itens-folha-contagem', folhaId],
    queryFn: async () => {
      const { data: fichas, error: erroFichas } = await supabase
        .from('fichas_financeiras')
        .select('id')
        .eq('folha_id', folhaId);
      if (erroFichas) throw erroFichas;
      const ids = (fichas ?? []).map((f) => f.id);
      if (ids.length === 0) return 0;
      const { count, error } = await supabase
        .from('itens_ficha_financeira')
        .select('id', { count: 'exact', head: true })
        .in('ficha_id', ids);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!folhaId,
  });
}

export function useSaveItemFicha() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: ItemFichaInput) => {
      const { id, ...rest } = item;
      const payload: ItemFichaInsert = {
        ficha_id: rest.ficha_id,
        rubrica_id: rest.rubrica_id ?? null,
        descricao: rest.descricao,
        tipo: rest.tipo,
        referencia: rest.referencia ?? null,
        valor: rest.valor,
        base_calculo: rest.base_calculo ?? null,
        percentual: rest.percentual ?? null,
        ordem: rest.ordem ?? ORDEM_ITEM_MANUAL,
      };
      if (id) {
        // `.single()` em 0 linhas vira PGRST116, traduzido em descreverErroBanco (RLS/registro inexistente).
        const { data, error } = await supabase.from('itens_ficha_financeira').update(payload).eq('id', id).select().single();
        if (error) throw error;
        await recalcularTotaisFicha(item.ficha_id);
        return data;
      }
      const { data, error } = await supabase.from('itens_ficha_financeira').insert(payload).select().single();
      if (error) throw error;
      await recalcularTotaisFicha(item.ficha_id);
      return data;
    },
    onSuccess: () => { toast.success('Item salvo e totais da ficha recalculados.'); },
    onError: (e: unknown) => { toast.error(descreverErroBanco(e)); },
    onSettled: (_data, _erro, variables) => { invalidarFichaEFolha(queryClient, variables.ficha_id); },
  });
}

export function useDeleteItemFicha() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, fichaId }: { id: string; fichaId: string }) => {
      // Sem `.select()` o DELETE filtrado pela RLS retorna sucesso com 0 linhas; aqui isso vira erro.
      const { data, error } = await supabase.from('itens_ficha_financeira').delete().eq('id', id).select('id');
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Nenhum item foi excluído: ele não existe ou a política de acesso (RLS) não permite.');
      }
      await recalcularTotaisFicha(fichaId);
      return fichaId;
    },
    onSuccess: () => { toast.success('Item excluído e totais da ficha recalculados.'); },
    onError: (e: unknown) => { toast.error(descreverErroBanco(e)); },
    onSettled: (_data, _erro, variables) => { invalidarFichaEFolha(queryClient, variables.fichaId); },
  });
}

/**
 * "Lançar na ficha": cria um desconto com `referencia = numero_contrato` e `valor = valor_parcela`
 * da consignação, se ainda não houver item com a mesma referência (a RPC real não lança consignações).
 */
export function useLancarConsignacaoNaFicha() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      ficha_id: string;
      rubrica_id?: string | null;
      descricao: string;
      numero_contrato: string | null;
      valor_parcela: number;
    }) => {
      const { data: itens, error: erroItens } = await supabase
        .from('itens_ficha_financeira')
        .select('tipo, referencia')
        .eq('ficha_id', input.ficha_id);
      if (erroItens) throw erroItens;
      if (itemJaLancado(itens ?? [], input.numero_contrato)) {
        throw new Error(`Já existe um desconto com a referência "${input.numero_contrato}" nesta ficha.`);
      }
      const payload: ItemFichaInsert = {
        ficha_id: input.ficha_id,
        rubrica_id: input.rubrica_id ?? null,
        descricao: input.descricao,
        tipo: 'desconto',
        referencia: input.numero_contrato,
        valor: input.valor_parcela,
        ordem: ORDEM_ITEM_MANUAL,
      };
      const { data, error } = await supabase.from('itens_ficha_financeira').insert(payload).select().single();
      if (error) throw error;
      await recalcularTotaisFicha(input.ficha_id);
      return data;
    },
    onSuccess: () => { toast.success('Consignação lançada na ficha como desconto.'); },
    onError: (e: unknown) => { toast.error(descreverErroBanco(e)); },
    onSettled: (_data, _erro, variables) => { invalidarFichaEFolha(queryClient, variables.ficha_id); },
  });
}

// ============== CONSIGNAÇÕES ==============
/**
 * Consignações do servidor (ou de todos, sem `servidorId`). Por padrão só ativas e não quitadas;
 * `incluirInativas` traz também suspensas (já vinham), quitadas e inativas, para a aba da ficha.
 */
export function useConsignacoesAtivas(servidorId?: string, incluirInativas = false) {
  return useQuery({
    queryKey: ['consignacoes-ativas', servidorId, { incluirInativas }],
    queryFn: async () => {
      let query = supabase
        .from('consignacoes')
        .select(`*, servidor:servidores(nome_completo, matricula)`)
        .order('data_inicio', { ascending: false });
      if (!incluirInativas) {
        query = query.eq('ativo', true).eq('quitado', false);
      }
      
      if (servidorId) {
        query = query.eq('servidor_id', servidorId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: servidorId ? !!servidorId : true,
  });
}

export function useSaveConsignacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (consig: Partial<Database['public']['Tables']['consignacoes']['Insert']> & { id?: string }) => {
      if (consig.id) {
        const { id, ...rest } = consig;
        const { data, error } = await supabase.from('consignacoes').update(rest).eq('id', id).select().single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase.from('consignacoes').insert(consig as Database['public']['Tables']['consignacoes']['Insert']).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['consignacoes-ativas'] }); 
      toast.success('Consignação salva!'); 
    },
    onError: (e: unknown) => { toast.error(descreverErroBanco(e)); },
  });
}

// ============== DEPENDENTES IRRF ==============
/** Dependentes ativos do servidor (inclusive os sem dedução de IRRF; a vigência é avaliada na tela). */
export function useDependentesIRRF(servidorId?: string) {
  return useQuery({
    queryKey: ['dependentes-irrf', servidorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dependentes_irrf')
        .select('*')
        .eq('servidor_id', servidorId)
        .eq('ativo', true)
        .order('nome', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!servidorId,
  });
}

export function useSaveDependenteIRRF() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dep: Partial<Database['public']['Tables']['dependentes_irrf']['Insert']> & { id?: string }) => {
      if (dep.id) {
        const { id, ...rest } = dep;
        const { data, error } = await supabase.from('dependentes_irrf').update(rest).eq('id', id).select().single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase.from('dependentes_irrf').insert(dep as Database['public']['Tables']['dependentes_irrf']['Insert']).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, variables) => { 
      queryClient.invalidateQueries({ queryKey: ['dependentes-irrf', variables.servidor_id] }); 
      toast.success('Dependente salvo!'); 
    },
    onError: (e: unknown) => { toast.error(descreverErroBanco(e)); },
  });
}

// ============== CRIAR REMESSA BANCÁRIA ==============
export function useCreateRemessaBancaria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (remessa: {
      folha_id: string;
      conta_autarquia_id: string;
      numero_remessa: number;
      quantidade_registros: number;
      valor_total: number;
      nome_arquivo: string;
      layout?: string;
      status?: string;
    }) => {
      const { data, error } = await supabase
        .from('remessas_bancarias')
        .insert({
          folha_id: remessa.folha_id,
          conta_autarquia_id: remessa.conta_autarquia_id,
          numero_remessa: remessa.numero_remessa,
          quantidade_registros: remessa.quantidade_registros,
          valor_total: remessa.valor_total,
          nome_arquivo: remessa.nome_arquivo,
          layout: remessa.layout || 'cnab240',
          status: remessa.status || 'gerada',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['remessas-bancarias', variables.folha_id] });
      toast.success('Remessa bancária gerada!');
    },
    onError: (e: Error) => { toast.error(`Erro: ${e.message}`); },
  });
}

// ============== CRIAR EVENTO ESOCIAL ==============
export function useCreateEventoESocial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (evento: {
      folha_id?: string;
      servidor_id?: string;
      tipo_evento: string;
      payload_xml?: string;
      competencia_ano?: number;
      competencia_mes?: number;
    }) => {
      const insertData = {
        folha_id: evento.folha_id,
        servidor_id: evento.servidor_id,
        tipo_evento: evento.tipo_evento,
        payload_xml: evento.payload_xml,
        competencia_ano: evento.competencia_ano,
        competencia_mes: evento.competencia_mes,
        status: 'pendente' as const,
      };
      const { data, error } = await supabase
        .from('eventos_esocial')
        .insert(insertData as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      if (variables.folha_id) {
        queryClient.invalidateQueries({ queryKey: ['eventos-esocial', variables.folha_id] });
      }
      toast.success('Evento eSocial gerado!');
    },
    onError: (e: Error) => { toast.error(`Erro: ${e.message}`); },
  });
}

// ============== CONFIG AUTARQUIA ==============
export function useConfigAutarquia() {
  return useQuery({
    queryKey: ['config-autarquia'],
    queryFn: async () => {
      const { data, error } = await supabase.from('config_autarquia').select('*').eq('ativo', true).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });
}

export function useSaveConfigAutarquia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (config: Partial<ConfigInsert> & { id?: string }) => {
      if (config.id) {
        const { id, ...rest } = config;
        const { data, error } = await supabase.from('config_autarquia').update(rest).eq('id', id).select().single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase.from('config_autarquia').insert(config as ConfigInsert).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['config-autarquia'] }); toast.success('Configuração salva!'); },
    onError: (e: Error) => { toast.error(`Erro: ${e.message}`); },
  });
}
