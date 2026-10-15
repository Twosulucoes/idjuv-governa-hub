import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TablesUpdate } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import type { 
  Portaria, 
  CreatePortariaData, 
  UpdatePortariaData, 
  StatusPortaria,
  CategoriaPortaria 
} from '@/types/portaria';

// O texto da portaria é feito no SEI; aqui só se acompanha o ciclo (processo SEI, número, assinatura, DOE).
const db = supabase;

/** Número provisório da portaria enquanto o número oficial do SEI não sai (o banco não deixa passar de "aguardando assinatura"). */
export const NUMERO_PORTARIA_PENDENTE = /^PENDENTE/i;
export const numeroPortariaPendente = (ano: number) => `PENDENTE/${ano}`;

const COLUNAS_PORTARIA = `
  id, numero, titulo, categoria, status, data_documento, ementa, observacoes,
  servidores_ids, doe_numero, doe_data, doe_link, data_publicacao, data_vigencia_inicio, data_vigencia_fim,
  data_assinatura, assinado_por, arquivo_url, arquivo_assinado_url, processo_sei,
  cargo_id, unidade_id, provimento_id
`;

/** Campo opcional de texto: vazio vira null (para limpar no banco). */
const textoOuNulo = (v?: string | null) => {
  const t = v?.trim();
  return t ? t : null;
};

interface PortariaFilters {
  status?: StatusPortaria;
  categoria?: CategoriaPortaria;
  servidor_id?: string;
  unidade_id?: string;
  ano?: number;
  busca?: string;
}

// Hook para buscar portarias com filtros
export function usePortarias(filters?: PortariaFilters) {
  return useQuery({
    queryKey: ['portarias', filters],
    queryFn: async () => {
      let query = db
        .from('documentos')
        .select(COLUNAS_PORTARIA)
        .eq('tipo', 'portaria')
        .order('data_documento', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.categoria) {
        query = query.eq('categoria', filters.categoria);
      }
      if (filters?.servidor_id) {
        query = query.contains('servidores_ids', [filters.servidor_id]);
      }
      if (filters?.unidade_id) {
        query = query.eq('unidade_id', filters.unidade_id);
      }
      if (filters?.ano) {
        const startOfYear = `${filters.ano}-01-01`;
        const endOfYear = `${filters.ano}-12-31`;
        query = query.gte('data_documento', startOfYear).lte('data_documento', endOfYear);
      }
      if (filters?.busca) {
        query = query.or(`titulo.ilike.%${filters.busca}%,numero.ilike.%${filters.busca}%,ementa.ilike.%${filters.busca}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as Portaria[];
    },
  });
}

// Hook para buscar uma portaria específica
export function usePortaria(id: string | undefined) {
  return useQuery({
    queryKey: ['portaria', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await db
        .from('documentos')
        .select(COLUNAS_PORTARIA)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as unknown as Portaria;
    },
    enabled: !!id,
  });
}

// Hook para buscar portarias de um servidor específico
export function usePortariasServidor(servidorId: string | undefined) {
  return useQuery({
    queryKey: ['portarias-servidor', servidorId],
    queryFn: async () => {
      if (!servidorId) return [];
      
      const { data, error } = await db
        .from('documentos')
        .select(COLUNAS_PORTARIA)
        .eq('tipo', 'portaria')
        .contains('servidores_ids', [servidorId])
        .order('data_documento', { ascending: false });

      if (error) throw error;
      return data as unknown as Portaria[];
    },
    enabled: !!servidorId,
  });
}

// Hook para criar portaria
export function useCreatePortaria() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (dados: CreatePortariaData) => {
      // O número oficial vem do SEI; sem ele, a portaria fica com o número provisório até ser informado
      const numero = dados.numero?.trim() || numeroPortariaPendente(new Date(dados.data_documento).getFullYear());

      const { data: userData } = await supabase.auth.getUser();
      
      const insertData = {
        ...dados,
        numero,
        status: dados.status || 'minuta',
        tipo: 'portaria' as const,
        created_by: userData.user?.id,
      };

      const { data, error } = await db
        .from('documentos')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portarias'] });
      toast({ title: 'Portaria criada com sucesso!' });
    },
    onError: (error) => {
      console.error('Erro ao criar portaria:', error);
      toast({
        title: 'Erro ao criar portaria',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook para atualizar portaria
export function useUpdatePortaria() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, dados }: { id: string; dados: UpdatePortariaData }) => {
      const { data, error } = await db
        .from('documentos')
        .update(dados)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portarias'] });
      toast({ title: 'Portaria atualizada com sucesso!' });
    },
    onError: (error) => {
      console.error('Erro ao atualizar portaria:', error);
      toast({
        title: 'Erro ao atualizar portaria',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook para deletar portaria
export function useDeletePortaria() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('documentos')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portarias'] });
      toast({ title: 'Portaria excluída com sucesso!' });
    },
    onError: (error) => {
      console.error('Erro ao excluir portaria:', error);
      toast({
        title: 'Erro ao excluir portaria',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook para enviar para assinatura
export function useEnviarParaAssinatura() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('documentos')
        .update({ status: 'aguardando_assinatura' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portarias'] });
      toast({ title: 'Portaria enviada para assinatura!' });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao enviar para assinatura',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook para registrar assinatura
export function useRegistrarAssinatura() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      id, 
      assinado_por, 
      data_assinatura, 
      arquivo_assinado_url,
      numero,
      processo_sei,
    }: { 
      id: string; 
      assinado_por: string;
      data_assinatura: string;
      arquivo_assinado_url?: string;
      /** Número oficial do SEI, quando a portaria ainda está com o provisório. */
      numero?: string;
      processo_sei?: string;
    }) => {
      const updateData: TablesUpdate<'documentos'> = {
        status: 'assinado',
        assinado_por,
        data_assinatura,
        arquivo_assinado_url,
      };
      if (numero?.trim()) updateData.numero = numero.trim();
      if (processo_sei !== undefined) updateData.processo_sei = textoOuNulo(processo_sei);

      const { data, error } = await db
        .from('documentos')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portarias'] });
      toast({ title: 'Assinatura registrada com sucesso!' });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao registrar assinatura',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook para enviar para publicação
export function useEnviarParaPublicacao() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('documentos')
        .update({ status: 'aguardando_publicacao' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portarias'] });
      toast({ title: 'Portaria enviada para publicação!' });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao enviar para publicação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook para registrar publicação no DOE
export function useRegistrarPublicacao() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      id, 
      doe_numero, 
      doe_data,
      data_publicacao,
      doe_link,
      arquivo_url,
      numero,
      processo_sei,
    }: { 
      id: string; 
      doe_numero: string;
      doe_data: string;
      data_publicacao?: string;
      doe_link?: string;
      arquivo_url?: string;
      /** Número oficial do SEI, quando a portaria ainda está com o provisório. */
      numero?: string;
      processo_sei?: string;
    }) => {
      const updateData: TablesUpdate<'documentos'> = { 
        status: 'publicado',
        doe_numero,
        doe_data,
        data_publicacao: data_publicacao || doe_data,
      };
      
      if (doe_link) {
        updateData.doe_link = doe_link;
      }
      if (arquivo_url) {
        updateData.arquivo_url = arquivo_url;
      }
      if (numero?.trim()) updateData.numero = numero.trim();
      if (processo_sei !== undefined) updateData.processo_sei = textoOuNulo(processo_sei);

      const { data, error } = await db
        .from('documentos')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portarias'] });
      toast({ title: 'Publicação registrada com sucesso!' });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao registrar publicação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook para tornar vigente
export function useTornarVigente() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data_vigencia_inicio }: { id: string; data_vigencia_inicio: string }) => {
      const { data, error } = await supabase
        .from('documentos')
        .update({ 
          status: 'vigente',
          data_vigencia_inicio,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portarias'] });
      toast({ title: 'Portaria agora está vigente!' });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook para revogar portaria
export function useRevogarPortaria() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo?: string }) => {
      const { data, error } = await supabase
        .from('documentos')
        .update({ 
          status: 'revogado',
          observacoes: motivo,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portarias'] });
      toast({ title: 'Portaria revogada!' });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao revogar portaria',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/** Linha de rh_pendencias_nomeacao(): servidor com provimento ativo sem portaria de nomeação publicada. */
export interface NomeacaoSemPortaria {
  servidor_id: string;
  nome: string;
  matricula: string | null;
  cargo: string | null;
  provimento_id: string;
  data_nomeacao: string | null;
  portaria_numero: string | null;
  portaria_status: StatusPortaria | null;
}

// Nomeações cuja portaria ainda não saiu no DOE (RPC SECURITY INVOKER: a RLS de quem consulta vale)
export function useNomeacoesSemPortaria() {
  return useQuery({
    queryKey: ['portarias', 'nomeacoes-sem-portaria'],
    queryFn: async () => {
      const { data, error } = await db.rpc('rh_pendencias_nomeacao');
      if (error) throw error;
      return (data ?? []) as NomeacaoSemPortaria[];
    },
  });
}
