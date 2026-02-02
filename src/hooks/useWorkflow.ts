/**
 * Hook para gerenciamento de processos administrativos (Workflow SEI-like)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { 
  ProcessoAdministrativo, 
  MovimentacaoProcesso, 
  Despacho, 
  DocumentoProcesso,
  PrazoProcesso,
  TipoProcesso,
  StatusProcesso,
  NivelSigilo
} from '@/types/workflow';

// ========================
// PROCESSOS
// ========================

export function useProcessos(filtros?: {
  status?: StatusProcesso;
  tipo?: TipoProcesso;
  sigilo?: NivelSigilo;
  unidade_id?: string;
  busca?: string;
}) {
  return useQuery({
    queryKey: ['processos-administrativos', filtros],
    queryFn: async () => {
      let query = supabase
        .from('processos_administrativos')
        .select(`
          *,
          unidade_origem:estrutura_organizacional!unidade_origem_id(id, nome, sigla)
        `)
        .order('created_at', { ascending: false });

      if (filtros?.status) {
        query = query.eq('status', filtros.status);
      }
      if (filtros?.tipo) {
        query = query.eq('tipo_processo', filtros.tipo);
      }
      if (filtros?.sigilo) {
        query = query.eq('sigilo', filtros.sigilo);
      }
      if (filtros?.unidade_id) {
        query = query.eq('unidade_origem_id', filtros.unidade_id);
      }
      if (filtros?.busca) {
        query = query.or(`assunto.ilike.%${filtros.busca}%,interessado_nome.ilike.%${filtros.busca}%,numero_processo.ilike.%${filtros.busca}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ProcessoAdministrativo[];
    },
  });
}

export function useProcesso(id: string | undefined) {
  return useQuery({
    queryKey: ['processo-administrativo', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('processos_administrativos')
        .select(`
          *,
          unidade_origem:estrutura_organizacional!unidade_origem_id(id, nome, sigla)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as ProcessoAdministrativo;
    },
    enabled: !!id,
  });
}

export function useCriarProcesso() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (dados: Partial<ProcessoAdministrativo>) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const insertData = {
        tipo_processo: dados.tipo_processo,
        assunto: dados.assunto!,
        descricao: dados.descricao,
        interessado_tipo: dados.interessado_tipo!,
        interessado_nome: dados.interessado_nome!,
        interessado_documento: dados.interessado_documento,
        sigilo: dados.sigilo,
        observacoes: dados.observacoes,
        unidade_origem_id: dados.unidade_origem_id,
        created_by: userData.user?.id,
      };
      
      const { data, error } = await supabase
        .from('processos_administrativos')
        .insert(insertData as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processos-administrativos'] });
      toast.success('Processo criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar processo: ${error.message}`);
    },
  });
}

export function useAtualizarProcesso() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...dados }: Partial<ProcessoAdministrativo> & { id: string }) => {
      const { data, error } = await supabase
        .from('processos_administrativos')
        .update(dados)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['processos-administrativos'] });
      queryClient.invalidateQueries({ queryKey: ['processo-administrativo', variables.id] });
      toast.success('Processo atualizado!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });
}

// ========================
// MOVIMENTAÇÕES
// ========================

export function useMovimentacoes(processoId: string | undefined) {
  return useQuery({
    queryKey: ['movimentacoes-processo', processoId],
    queryFn: async () => {
      if (!processoId) return [];
      const { data, error } = await supabase
        .from('movimentacoes_processo')
        .select(`
          *,
          unidade_origem:estrutura_organizacional!unidade_origem_id(id, nome, sigla),
          unidade_destino:estrutura_organizacional!unidade_destino_id(id, nome, sigla),
          servidor_origem:servidores!servidor_origem_id(id, nome_completo),
          servidor_destino:servidores!servidor_destino_id(id, nome_completo)
        `)
        .eq('processo_id', processoId)
        .order('numero_sequencial', { ascending: true });
      
      if (error) throw error;
      return data as MovimentacaoProcesso[];
    },
    enabled: !!processoId,
  });
}

export function useCriarMovimentacao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (dados: Partial<MovimentacaoProcesso>) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('movimentacoes_processo')
        .insert({
          processo_id: dados.processo_id!,
          tipo_movimentacao: dados.tipo_movimentacao,
          descricao: dados.descricao!,
          prazo_dias: dados.prazo_dias,
          prazo_limite: dados.prazo_limite,
          observacoes: dados.observacoes,
          created_by: userData.user?.id,
        } as any)
        .select()
        .single();
      
      if (error) throw error;
      
      if (dados.processo_id) {
        await supabase
          .from('processos_administrativos')
          .update({ status: 'em_tramitacao' } as any)
          .eq('id', dados.processo_id)
          .eq('status', 'aberto');
      }
      
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['movimentacoes-processo', variables.processo_id] });
      queryClient.invalidateQueries({ queryKey: ['processos-administrativos'] });
      toast.success('Movimentação registrada!');
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
}

// ========================
// DESPACHOS
// ========================

export function useDespachos(processoId: string | undefined) {
  return useQuery({
    queryKey: ['despachos-processo', processoId],
    queryFn: async () => {
      if (!processoId) return [];
      const { data, error } = await supabase
        .from('despachos')
        .select(`
          *,
          autoridade:servidores!autoridade_id(id, nome_completo)
        `)
        .eq('processo_id', processoId)
        .order('numero_despacho', { ascending: true });
      
      if (error) throw error;
      return data as Despacho[];
    },
    enabled: !!processoId,
  });
}

export function useCriarDespacho() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (dados: Partial<Despacho>) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('despachos')
        .insert({
          processo_id: dados.processo_id!,
          texto_despacho: dados.texto_despacho!,
          tipo_despacho: dados.tipo_despacho,
          fundamentacao_legal: dados.fundamentacao_legal,
          decisao: dados.decisao,
          created_by: userData.user?.id,
        } as any)
        .select()
        .single();
      
      if (error) throw error;
      
      if (dados.tipo_despacho === 'conclusivo' && dados.decisao === 'arquivar' && dados.processo_id) {
        await supabase
          .from('processos_administrativos')
          .update({ 
            status: 'arquivado',
            data_encerramento: new Date().toISOString().split('T')[0]
          } as any)
          .eq('id', dados.processo_id);
      }
      
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['despachos-processo', variables.processo_id] });
      queryClient.invalidateQueries({ queryKey: ['movimentacoes-processo', variables.processo_id] });
      queryClient.invalidateQueries({ queryKey: ['processos-administrativos'] });
      toast.success('Despacho registrado!');
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
}

// ========================
// DOCUMENTOS
// ========================

export function useDocumentosProcesso(processoId: string | undefined) {
  return useQuery({
    queryKey: ['documentos-processo', processoId],
    queryFn: async () => {
      if (!processoId) return [];
      const { data, error } = await supabase
        .from('documentos_processo')
        .select('*')
        .eq('processo_id', processoId)
        .order('ordem', { ascending: true });
      
      if (error) throw error;
      return data as DocumentoProcesso[];
    },
    enabled: !!processoId,
  });
}

export function useCriarDocumento() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (dados: Partial<DocumentoProcesso>) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('documentos_processo')
        .insert({
          processo_id: dados.processo_id!,
          tipo_documento: dados.tipo_documento,
          titulo: dados.titulo!,
          arquivo_url: dados.arquivo_url,
          created_by: userData.user?.id,
        } as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documentos-processo', variables.processo_id] });
      toast.success('Documento anexado!');
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
}

// ========================
// PRAZOS
// ========================

export function usePrazosProcesso(processoId: string | undefined) {
  return useQuery({
    queryKey: ['prazos-processo', processoId],
    queryFn: async () => {
      if (!processoId) return [];
      const { data, error } = await supabase
        .from('prazos_processo')
        .select(`
          *,
          responsavel:servidores!responsavel_id(id, nome_completo)
        `)
        .eq('processo_id', processoId)
        .order('data_limite', { ascending: true });
      
      if (error) throw error;
      return data as PrazoProcesso[];
    },
    enabled: !!processoId,
  });
}

export function useCriarPrazo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (dados: Partial<PrazoProcesso>) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('prazos_processo')
        .insert({
          processo_id: dados.processo_id!,
          descricao: dados.descricao!,
          prazo_dias: dados.prazo_dias!,
          data_limite: dados.data_limite!,
          created_by: userData.user?.id,
        } as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['prazos-processo', variables.processo_id] });
      toast.success('Prazo registrado!');
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
}

export function useMarcarPrazoCumprido() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, processoId }: { id: string; processoId: string }) => {
      const { data, error } = await supabase
        .from('prazos_processo')
        .update({
          cumprido: true,
          data_cumprimento: new Date().toISOString().split('T')[0],
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['prazos-processo', variables.processoId] });
      toast.success('Prazo marcado como cumprido!');
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
}
