import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { PreCadastro } from '@/types/preCadastro';

export function usePreCadastro(codigoAcesso?: string) {
  const queryClient = useQueryClient();

  // Buscar pré-cadastro pelo código de acesso
  const { data: preCadastro, isLoading } = useQuery({
    queryKey: ['pre-cadastro', codigoAcesso],
    queryFn: async () => {
      if (!codigoAcesso) return null;
      
      const { data, error } = await supabase
        .from('pre_cadastros')
        .select('*')
        .eq('codigo_acesso', codigoAcesso)
        .single();
      
      if (error) throw error;
      return data as PreCadastro;
    },
    enabled: !!codigoAcesso,
  });

  // Gerar novo código de acesso
  const gerarCodigo = async (): Promise<string> => {
    const { data, error } = await supabase.rpc('gerar_codigo_pre_cadastro');
    if (error) throw error;
    return data as string;
  };

  // Criar novo pré-cadastro
  const criarMutation = useMutation({
    mutationFn: async (dados: Partial<PreCadastro>) => {
      const codigo = await gerarCodigo();
      
      const { data, error } = await supabase
        .from('pre_cadastros')
        .insert({
          codigo_acesso: codigo,
          nome_completo: dados.nome_completo || '',
          cpf: dados.cpf || '',
          email: dados.email || '',
          status: 'rascunho',
          ...dados,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as PreCadastro;
    },
    onSuccess: () => {
      toast.success('Pré-cadastro iniciado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar pré-cadastro: ' + error.message);
    },
  });

  // Atualizar pré-cadastro existente
  const atualizarMutation = useMutation({
    mutationFn: async ({ id, dados }: { id: string; dados: Partial<PreCadastro> }) => {
      const { data, error } = await supabase
        .from('pre_cadastros')
        .update({
          ...dados,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as PreCadastro;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pre-cadastro'] });
    },
    onError: (error: Error) => {
      toast.error('Erro ao salvar: ' + error.message);
    },
  });

  // Enviar pré-cadastro (finalizar)
  const enviarMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('pre_cadastros')
        .update({
          status: 'enviado',
          data_envio: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as PreCadastro;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pre-cadastro'] });
      toast.success('Pré-cadastro enviado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao enviar: ' + error.message);
    },
  });

  return {
    preCadastro,
    isLoading,
    criar: criarMutation.mutateAsync,
    atualizar: atualizarMutation.mutateAsync,
    enviar: enviarMutation.mutateAsync,
    isSaving: atualizarMutation.isPending,
    isCreating: criarMutation.isPending,
  };
}

// Hook para listar todos os pré-cadastros (admin)
export function usePreCadastros() {
  const queryClient = useQueryClient();

  const { data: preCadastros, isLoading } = useQuery({
    queryKey: ['pre-cadastros'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pre_cadastros')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PreCadastro[];
    },
  });

  // Aprovar pré-cadastro
  const aprovarMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('pre_cadastros')
        .update({
          status: 'aprovado',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as PreCadastro;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pre-cadastros'] });
      toast.success('Pré-cadastro aprovado!');
    },
  });

  // Rejeitar pré-cadastro
  const rejeitarMutation = useMutation({
    mutationFn: async ({ id, observacoes }: { id: string; observacoes?: string }) => {
      const { data, error } = await supabase
        .from('pre_cadastros')
        .update({
          status: 'rejeitado',
          observacoes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as PreCadastro;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pre-cadastros'] });
      toast.success('Pré-cadastro rejeitado.');
    },
  });

  return {
    preCadastros,
    isLoading,
    aprovar: aprovarMutation.mutateAsync,
    rejeitar: rejeitarMutation.mutateAsync,
  };
}
