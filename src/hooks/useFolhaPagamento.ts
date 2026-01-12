import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type RubricaInsert = Database['public']['Tables']['rubricas']['Insert'];
type ParametroInsert = Database['public']['Tables']['parametros_folha']['Insert'];
type ContaInsert = Database['public']['Tables']['contas_autarquia']['Insert'];
type FolhaInsert = Database['public']['Tables']['folhas_pagamento']['Insert'];
type FolhaStatus = Database['public']['Enums']['status_folha'];
type ConfigInsert = Database['public']['Tables']['config_autarquia']['Insert'];
type FaixaINSSInsert = Database['public']['Tables']['tabela_inss']['Insert'];
type FaixaIRRFInsert = Database['public']['Tables']['tabela_irrf']['Insert'];

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

export function useUpdateFolhaStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: FolhaStatus }) => {
      const { data, error } = await supabase.from('folhas_pagamento').update({ status }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['folhas-pagamento'] }); toast.success('Status atualizado!'); },
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
