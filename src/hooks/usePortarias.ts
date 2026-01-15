import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { 
  Portaria, 
  CreatePortariaData, 
  UpdatePortariaData, 
  StatusPortaria,
  CategoriaPortaria 
} from '@/types/portaria';

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
      let query = supabase
        .from('documentos')
        .select(`
          *,
          cargo:cargos(id, nome, sigla),
          unidade:estrutura_organizacional(id, nome, sigla)
        `)
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
      
      const { data, error } = await supabase
        .from('documentos')
        .select(`
          *,
          cargo:cargos(id, nome, sigla),
          unidade:estrutura_organizacional(id, nome, sigla)
        `)
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
      
      const { data, error } = await supabase
        .from('documentos')
        .select(`
          *,
          cargo:cargos(id, nome, sigla),
          unidade:estrutura_organizacional(id, nome, sigla)
        `)
        .eq('tipo', 'portaria')
        .contains('servidores_ids', [servidorId])
        .order('data_documento', { ascending: false });

      if (error) throw error;
      return data as unknown as Portaria[];
    },
    enabled: !!servidorId,
  });
}

// Hook para gerar número automático de portaria
export function useGerarNumeroPortaria() {
  return useMutation({
    mutationFn: async (ano?: number) => {
      const anoAtual = ano || new Date().getFullYear();
      const { data, error } = await supabase.rpc('gerar_numero_portaria', { p_ano: anoAtual });
      if (error) throw error;
      return data as string;
    },
  });
}

// Hook para criar portaria
export function useCreatePortaria() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const gerarNumero = useGerarNumeroPortaria();

  return useMutation({
    mutationFn: async (dados: CreatePortariaData) => {
      // Gerar número automático se não informado
      let numero = dados.numero;
      if (!numero) {
        const ano = new Date(dados.data_documento).getFullYear();
        numero = await gerarNumero.mutateAsync(ano);
      }

      const { data: userData } = await supabase.auth.getUser();
      
      const insertData = {
        ...dados,
        numero,
        status: dados.status || 'minuta',
        tipo: 'portaria' as const,
        created_by: userData.user?.id,
      };

      const { data, error } = await supabase
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
      const { data, error } = await supabase
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
      arquivo_assinado_url 
    }: { 
      id: string; 
      assinado_por: string;
      data_assinatura: string;
      arquivo_assinado_url?: string;
    }) => {
      const { data, error } = await supabase
        .from('documentos')
        .update({ 
          status: 'assinado',
          assinado_por,
          data_assinatura,
          arquivo_assinado_url,
        })
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
      data_publicacao 
    }: { 
      id: string; 
      doe_numero: string;
      doe_data: string;
      data_publicacao?: string;
    }) => {
      const { data, error } = await supabase
        .from('documentos')
        .update({ 
          status: 'publicado',
          doe_numero,
          doe_data,
          data_publicacao: data_publicacao || doe_data,
        })
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

// Hook para gerar minuta automática de nomeação
export function useGerarMinutaNomeacao() {
  const createPortaria = useCreatePortaria();

  return useMutation({
    mutationFn: async ({
      servidor_id,
      servidor_nome,
      cargo_id,
      cargo_nome,
      unidade_id,
      provimento_id,
      tipo_nomeacao = 'comissionado',
    }: {
      servidor_id: string;
      servidor_nome: string;
      servidor_cpf?: string;
      cargo_id: string;
      cargo_nome: string;
      unidade_id: string;
      unidade_nome?: string;
      provimento_id: string;
      tipo_nomeacao?: 'comissionado' | 'efetivo';
    }) => {
      const dataAtual = new Date().toISOString().split('T')[0];
      
      const titulo = `Nomeação - ${servidor_nome}`;
      const ementa = tipo_nomeacao === 'comissionado'
        ? `Nomeia ${servidor_nome} para cargo em comissão de ${cargo_nome}.`
        : `Nomeia ${servidor_nome} para cargo efetivo de ${cargo_nome}.`;

      return createPortaria.mutateAsync({
        titulo,
        tipo: 'portaria',
        categoria: 'nomeacao',
        status: 'minuta',
        data_documento: dataAtual,
        ementa,
        servidores_ids: [servidor_id],
        cargo_id,
        unidade_id,
        provimento_id,
      });
    },
  });
}

// Hook para gerar minuta automática de exoneração
export function useGerarMinutaExoneracao() {
  const createPortaria = useCreatePortaria();

  return useMutation({
    mutationFn: async ({
      servidor_id,
      servidor_nome,
      cargo_id,
      cargo_nome,
      unidade_id,
      motivo = 'pedido',
    }: {
      servidor_id: string;
      servidor_nome: string;
      servidor_cpf?: string;
      cargo_id: string;
      cargo_nome: string;
      unidade_id: string;
      unidade_nome?: string;
      motivo?: 'pedido' | 'oficio';
    }) => {
      const dataAtual = new Date().toISOString().split('T')[0];
      
      const titulo = `Exoneração - ${servidor_nome}`;
      const ementa = motivo === 'pedido'
        ? `Exonera, a pedido, ${servidor_nome} do cargo de ${cargo_nome}.`
        : `Exonera, de ofício, ${servidor_nome} do cargo de ${cargo_nome}.`;

      return createPortaria.mutateAsync({
        titulo,
        tipo: 'portaria',
        categoria: 'exoneracao',
        status: 'minuta',
        data_documento: dataAtual,
        ementa,
        servidores_ids: [servidor_id],
        cargo_id,
        unidade_id,
      });
    },
  });
}

// Hook para gerar minuta automática de designação
export function useGerarMinutaDesignacao() {
  const createPortaria = useCreatePortaria();

  return useMutation({
    mutationFn: async ({
      servidor_id,
      servidor_nome,
      unidade_destino_nome,
      unidade_destino_id,
      designacao_id,
    }: {
      servidor_id: string;
      servidor_nome: string;
      cargo_nome?: string;
      unidade_origem_nome?: string;
      unidade_destino_nome: string;
      unidade_destino_id: string;
      designacao_id: string;
      data_inicio?: string;
      data_fim?: string;
    }) => {
      const dataAtual = new Date().toISOString().split('T')[0];
      
      const titulo = `Designação - ${servidor_nome}`;
      const ementa = `Designa ${servidor_nome} para exercício no(a) ${unidade_destino_nome}.`;

      return createPortaria.mutateAsync({
        titulo,
        tipo: 'portaria',
        categoria: 'designacao',
        status: 'minuta',
        data_documento: dataAtual,
        ementa,
        servidores_ids: [servidor_id],
        unidade_id: unidade_destino_id,
      designacao_id,
    });
  },
});
}

// Hook para registrar portaria no histórico funcional dos servidores
export function useRegistrarPortariaNoHistorico() {
const queryClient = useQueryClient();
const { toast } = useToast();

return useMutation({
  mutationFn: async ({
    servidores_ids,
    portaria_numero,
    portaria_data,
    categoria,
    cargo_id,
    unidade_id,
    descricao_adicional,
  }: {
    servidores_ids: string[];
    portaria_numero: string;
    portaria_data: string;
    categoria: string;
    cargo_id?: string;
    unidade_id?: string;
    descricao_adicional?: string;
  }) => {
    if (!servidores_ids || servidores_ids.length === 0) {
      throw new Error('Nenhum servidor selecionado');
    }

    // Mapear categoria para tipo de movimentação válido
    type TipoHistorico = 'nomeacao' | 'exoneracao' | 'designacao' | 'dispensa' | 'cessao' | 'afastamento' | 'retorno' | 'transferencia' | 'remocao' | 'vacancia' | 'promocao' | 'redistribuicao' | 'requisicao' | 'aposentadoria';
    
    const tipoMap: Record<string, TipoHistorico> = {
      nomeacao: 'nomeacao',
      exoneracao: 'exoneracao',
      designacao: 'designacao',
      dispensa: 'dispensa',
      cessao: 'cessao',
      ferias: 'afastamento',
      licenca: 'afastamento',
      pessoal: 'nomeacao',
      estruturante: 'nomeacao',
      normativa: 'nomeacao',
      delegacao: 'designacao',
    };

    const tipo: TipoHistorico = tipoMap[categoria] || 'nomeacao';
    
    // Buscar dados dos servidores para enriquecer a descrição
    const { data: servidoresData } = await supabase
      .from('v_servidores_situacao')
      .select('id, nome_completo, cargo_nome, unidade_nome')
      .in('id', servidores_ids);

    const registros = (servidoresData || []).map((servidor) => {
      const descricao = descricao_adicional 
        ? `${descricao_adicional} - Portaria nº ${portaria_numero}`
        : `Portaria nº ${portaria_numero}. Cargo: ${servidor.cargo_nome || 'N/A'}. Unidade: ${servidor.unidade_nome || 'N/A'}.`;

      return {
        servidor_id: servidor.id,
        tipo,
        data_evento: portaria_data,
        data_vigencia_inicio: portaria_data,
        portaria_numero: portaria_numero,
        portaria_data: portaria_data,
        cargo_novo_id: ['nomeacao', 'designacao'].includes(categoria) ? cargo_id : null,
        cargo_anterior_id: ['exoneracao', 'dispensa'].includes(categoria) ? cargo_id : null,
        unidade_nova_id: ['nomeacao', 'designacao'].includes(categoria) ? unidade_id : null,
        unidade_anterior_id: ['exoneracao', 'dispensa'].includes(categoria) ? unidade_id : null,
        descricao,
        ato_tipo: 'portaria',
        ato_numero: portaria_numero,
        ato_data: portaria_data,
      };
    });

    const { error } = await supabase
      .from('historico_funcional')
      .insert(registros);

    if (error) throw error;
    
    return registros.length;
  },
  onSuccess: (count) => {
    queryClient.invalidateQueries({ queryKey: ['historico-funcional'] });
    toast({ title: `${count} registro(s) adicionado(s) ao histórico funcional` });
  },
  onError: (error) => {
    console.error('Erro ao registrar histórico funcional:', error);
    toast({
      title: 'Erro ao registrar histórico funcional',
      description: error.message,
      variant: 'destructive',
    });
  },
});
}
