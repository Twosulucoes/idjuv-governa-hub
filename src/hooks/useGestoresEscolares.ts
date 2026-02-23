/**
 * Hook para gerenciar gestores escolares - Credenciamento JER
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { GestorEscolar, GestorFormData, StatusGestor } from '@/types/gestoresEscolares';

const QUERY_KEY = ['gestores-escolares'];

export function useGestoresEscolares() {
  const queryClient = useQueryClient();

  // Listar todos os gestores com dados da escola
  const {
    data: gestores = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<GestorEscolar[]> => {
      console.log('[useGestoresEscolares] Buscando gestores...');
      const { data, error } = await supabase
        .from('gestores_escolares')
        .select(`
          *,
          escola:escolas_jer(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useGestoresEscolares] Erro na query:', error);
        throw error;
      }
      console.log('[useGestoresEscolares] Gestores carregados:', data?.length);
      return data as GestorEscolar[];
    },
    retry: 2,
    staleTime: 30_000,
  });

  // Buscar gestor por CPF (consulta pública)
  const buscarPorCpf = async (cpf: string): Promise<GestorEscolar | null> => {
    const cpfLimpo = cpf.replace(/\D/g, '');
    
    const { data, error } = await supabase
      .from('gestores_escolares')
      .select(`
        *,
        escola:escolas_jer(*)
      `)
      .eq('cpf', cpfLimpo)
      .maybeSingle();

    if (error) throw error;
    return data as GestorEscolar | null;
  };

  // Criar pré-cadastro (público)
  const criarGestor = useMutation({
    mutationFn: async (dados: GestorFormData): Promise<GestorEscolar> => {
      const cpfLimpo = dados.cpf.replace(/\D/g, '');
      const celularLimpo = dados.celular.replace(/\D/g, '');

      const { data, error } = await supabase
        .from('gestores_escolares')
        .insert({
          escola_id: dados.escola_id,
          nome: dados.nome.toUpperCase().trim(),
          cpf: cpfLimpo,
          rg: dados.rg?.trim() || null,
          data_nascimento: dados.data_nascimento || null,
          email: dados.email.toLowerCase().trim(),
          celular: celularLimpo,
          endereco: dados.endereco?.trim() || null,
          status: 'aguardando' as StatusGestor,
        })
        .select(`
          *,
          escola:escolas_jer(*)
        `)
        .single();

      if (error) throw error;

      // Mark school as already registered
      await supabase
        .from('escolas_jer')
        .update({ ja_cadastrada: true })
        .eq('id', dados.escola_id);

      return data as GestorEscolar;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['escolas-jer'] });
    },
    onError: (error: Error) => {
      console.error('Erro ao criar gestor:', error);
      if (error.message.includes('gestores_escolares_cpf_unique') || error.message.includes('duplicate') && error.message.includes('cpf')) {
        throw new Error('CPF já cadastrado no sistema.');
      }
      if (error.message.includes('gestores_escolares_email_unique') || error.message.includes('duplicate') && error.message.includes('email')) {
        throw new Error('Email já cadastrado no sistema.');
      }
      if (error.message.includes('gestores_escolares_escola_unique') || error.message.includes('duplicate') && error.message.includes('escola')) {
        throw new Error('Esta escola já possui um gestor cadastrado.');
      }
      throw error;
    },
  });

  // Atualizar gestor
  const atualizarGestor = useMutation({
    mutationFn: async ({ id, ...dados }: Partial<GestorEscolar> & { id: string }) => {
      const { data, error } = await supabase
        .from('gestores_escolares')
        .update(dados)
        .eq('id', id)
        .select(`
          *,
          escola:escolas_jer(*)
        `)
        .single();

      if (error) throw error;
      return data as GestorEscolar;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Gestor atualizado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar gestor:', error);
      toast.error('Erro ao atualizar gestor.');
    },
  });

  // Assumir tarefa (responsável)
  const assumirTarefa = useMutation({
    mutationFn: async ({ gestorId, responsavelId, responsavelNome }: {
      gestorId: string;
      responsavelId: string;
      responsavelNome: string;
    }) => {
      const { data, error } = await supabase
        .from('gestores_escolares')
        .update({
          responsavel_id: responsavelId,
          responsavel_nome: responsavelNome,
          status: 'em_processamento' as StatusGestor,
        })
        .eq('id', gestorId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Você assumiu esta tarefa!');
    },
    onError: (error: Error) => {
      console.error('Erro ao assumir tarefa:', error);
      toast.error('Erro ao assumir tarefa.');
    },
  });

  // Marcar como cadastrado no CBDE
  const marcarCadastradoCbde = useMutation({
    mutationFn: async (gestorId: string) => {
      const { data, error } = await supabase
        .from('gestores_escolares')
        .update({
          status: 'cadastrado_cbde' as StatusGestor,
          data_cadastro_cbde: new Date().toISOString(),
        })
        .eq('id', gestorId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Marcado como cadastrado no CBDE!');
    },
    onError: (error: Error) => {
      console.error('Erro:', error);
      toast.error('Erro ao marcar cadastro CBDE.');
    },
  });

  // Marcar contato realizado
  const marcarContatoRealizado = useMutation({
    mutationFn: async (gestorId: string) => {
      const { data, error } = await supabase
        .from('gestores_escolares')
        .update({
          status: 'contato_realizado' as StatusGestor,
          contato_realizado: true,
          data_contato: new Date().toISOString(),
        })
        .eq('id', gestorId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Contato realizado marcado!');
    },
    onError: (error: Error) => {
      console.error('Erro:', error);
      toast.error('Erro ao marcar contato.');
    },
  });

  // Confirmar acesso
  const confirmarAcesso = useMutation({
    mutationFn: async (gestorId: string) => {
      const { data, error } = await supabase
        .from('gestores_escolares')
        .update({
          status: 'confirmado' as StatusGestor,
          acesso_testado: true,
          data_confirmacao: new Date().toISOString(),
        })
        .eq('id', gestorId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Acesso confirmado!');
    },
    onError: (error: Error) => {
      console.error('Erro:', error);
      toast.error('Erro ao confirmar acesso.');
    },
  });

  // Marcar problema
  const marcarProblema = useMutation({
    mutationFn: async ({ gestorId, observacao }: { gestorId: string; observacao: string }) => {
      const { data, error } = await supabase
        .from('gestores_escolares')
        .update({
          status: 'problema' as StatusGestor,
          observacoes: observacao,
        })
        .eq('id', gestorId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Problema registrado.');
    },
    onError: (error: Error) => {
      console.error('Erro:', error);
      toast.error('Erro ao registrar problema.');
    },
  });

  // Adicionar observação
  const adicionarObservacao = useMutation({
    mutationFn: async ({ gestorId, observacao }: { gestorId: string; observacao: string }) => {
      // Buscar observações atuais
      const { data: atual } = await supabase
        .from('gestores_escolares')
        .select('observacoes')
        .eq('id', gestorId)
        .single();

      const novaObs = atual?.observacoes 
        ? `${atual.observacoes}\n\n[${new Date().toLocaleDateString('pt-BR')}] ${observacao}`
        : `[${new Date().toLocaleDateString('pt-BR')}] ${observacao}`;

      const { data, error } = await supabase
        .from('gestores_escolares')
        .update({ observacoes: novaObs })
        .eq('id', gestorId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Observação adicionada!');
    },
    onError: (error: Error) => {
      console.error('Erro:', error);
      toast.error('Erro ao adicionar observação.');
    },
  });

  // Deletar gestor
  const deletarGestor = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('gestores_escolares')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Gestor removido.');
    },
    onError: (error: Error) => {
      console.error('Erro ao deletar gestor:', error);
      toast.error('Erro ao remover gestor.');
    },
  });

  return {
    gestores,
    isLoading,
    error,
    refetch,
    buscarPorCpf,
    criarGestor,
    atualizarGestor,
    assumirTarefa,
    marcarCadastradoCbde,
    marcarContatoRealizado,
    confirmarAcesso,
    marcarProblema,
    adicionarObservacao,
    deletarGestor,
  };
}
