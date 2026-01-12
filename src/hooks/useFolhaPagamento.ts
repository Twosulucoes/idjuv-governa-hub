import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ============== RUBRICAS ==============
export function useRubricas(apenasAtivas = false) {
  return useQuery({
    queryKey: ['rubricas', { apenasAtivas }],
    queryFn: async () => {
      let query = supabase
        .from('rubricas')
        .select('*')
        .order('codigo', { ascending: true });
      
      if (apenasAtivas) {
        query = query.eq('ativo', true);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveRubrica() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (rubrica: Record<string, unknown>) => {
      const id = rubrica.id as string | undefined;
      if (id) {
        const { data, error } = await supabase
          .from('rubricas')
          .update(rubrica)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('rubricas')
          .insert(rubrica)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rubricas'] });
      toast.success('Rubrica salva com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao salvar rubrica: ${error.message}`);
    },
  });
}

export function useDeleteRubrica() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('rubricas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rubricas'] });
      toast.success('Rubrica excluída!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir: ${error.message}`);
    },
  });
}

// ============== PARÂMETROS ==============
export function useParametrosFolha() {
  return useQuery({
    queryKey: ['parametros-folha'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parametros_folha')
        .select('*')
        .order('tipo_parametro', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveParametro() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (param: Record<string, unknown>) => {
      const id = param.id as string | undefined;
      if (id) {
        const { data, error } = await supabase
          .from('parametros_folha')
          .update(param)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('parametros_folha')
          .insert(param)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parametros-folha'] });
      toast.success('Parâmetro salvo com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao salvar parâmetro: ${error.message}`);
    },
  });
}

// ============== TABELAS INSS/IRRF ==============
export function useTabelaINSS() {
  return useQuery({
    queryKey: ['tabela-inss'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tabela_inss')
        .select('*')
        .order('faixa_ordem', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useTabelaIRRF() {
  return useQuery({
    queryKey: ['tabela-irrf'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tabela_irrf')
        .select('*')
        .order('faixa_ordem', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

// ============== BANCOS ==============
export function useBancosCNAB(apenasAtivos = true) {
  return useQuery({
    queryKey: ['bancos-cnab', { apenasAtivos }],
    queryFn: async () => {
      let query = supabase
        .from('bancos_cnab')
        .select('*')
        .order('nome', { ascending: true });
      
      if (apenasAtivos) {
        query = query.eq('ativo', true);
      }
      
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
      const { data, error } = await supabase
        .from('contas_autarquia')
        .select(`*, banco:bancos_cnab(id, codigo_banco, nome)`)
        .order('descricao', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveContaAutarquia() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (conta: Record<string, unknown>) => {
      const { banco, ...contaData } = conta;
      const id = contaData.id as string | undefined;
      
      if (id) {
        const { data, error } = await supabase
          .from('contas_autarquia')
          .update(contaData)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('contas_autarquia')
          .insert(contaData)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-autarquia'] });
      toast.success('Conta salva com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao salvar conta: ${error.message}`);
    },
  });
}

// ============== FOLHAS DE PAGAMENTO ==============
export function useFolhasPagamento(ano?: number) {
  return useQuery({
    queryKey: ['folhas-pagamento', { ano }],
    queryFn: async () => {
      let query = supabase
        .from('folhas_pagamento')
        .select('*')
        .order('competencia_ano', { ascending: false })
        .order('competencia_mes', { ascending: false });
      
      if (ano) {
        query = query.eq('competencia_ano', ano);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateFolha() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (folha: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('folhas_pagamento')
        .insert(folha)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folhas-pagamento'] });
      toast.success('Folha de pagamento criada!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar folha: ${error.message}`);
    },
  });
}

export function useUpdateFolhaStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from('folhas_pagamento')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folhas-pagamento'] });
      toast.success('Status atualizado!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    },
  });
}

// ============== CONFIG AUTARQUIA ==============
export function useConfigAutarquia() {
  return useQuery({
    queryKey: ['config-autarquia'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('config_autarquia')
        .select('*')
        .eq('ativo', true)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });
}

export function useSaveConfigAutarquia() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (config: Record<string, unknown>) => {
      const id = config.id as string | undefined;
      if (id) {
        const { data, error } = await supabase
          .from('config_autarquia')
          .update(config)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('config_autarquia')
          .insert(config)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config-autarquia'] });
      toast.success('Configuração salva!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao salvar: ${error.message}`);
    },
  });
}
