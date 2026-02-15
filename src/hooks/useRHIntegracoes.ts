/**
 * Hooks para adicionais por tempo de serviço, margem consignável,
 * geração eSocial e relatório TCE
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ==================== FASE 3C: Adicionais ====================

export interface AdicionalTempoServico {
  id: string;
  servidor_id: string;
  tipo: string;
  percentual: number;
  quantidade: number;
  data_base: string;
  data_concessao: string;
  data_proximo?: string;
  valor_referencia?: number;
  valor_adicional?: number;
  ato_numero?: string;
  ato_data?: string;
  fundamentacao_legal?: string;
  observacoes?: string;
  ativo: boolean;
  created_at?: string;
}

export function useAdicionaisServidor(servidorId: string) {
  return useQuery({
    queryKey: ['adicionais-tempo-servico', servidorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('adicionais_tempo_servico')
        .select('*')
        .eq('servidor_id', servidorId)
        .order('data_concessao', { ascending: false });
      if (error) throw error;
      return data as AdicionalTempoServico[];
    },
    enabled: !!servidorId,
  });
}

export function useCriarAdicional() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (adicional: Omit<AdicionalTempoServico, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('adicionais_tempo_servico')
        .insert(adicional)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['adicionais-tempo-servico', vars.servidor_id] });
      toast.success('Adicional registrado com sucesso');
    },
    onError: (error) => toast.error(`Erro ao registrar adicional: ${error.message}`),
  });
}

// ==================== Margem Consignável ====================

export function useMargemConsignavel(servidorId: string) {
  return useQuery({
    queryKey: ['margem-consignavel', servidorId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('fn_validar_margem_consignavel', {
        p_servidor_id: servidorId,
      });
      if (error) throw error;
      return data?.[0] as {
        salario_liquido: number;
        margem_total_percentual: number;
        margem_total_valor: number;
        margem_utilizada: number;
        margem_disponivel: number;
        percentual_utilizado: number;
        dentro_limite: boolean;
      } | undefined;
    },
    enabled: !!servidorId,
  });
}

// ==================== FASE 3D: eSocial ====================

export function useGerarESocialS2200(servidorId: string) {
  return useQuery({
    queryKey: ['esocial-s2200', servidorId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('fn_gerar_esocial_s2200', {
        p_servidor_id: servidorId,
      });
      if (error) throw error;
      return data;
    },
    enabled: false, // Manual trigger only
  });
}

export function useGerarESocialS1200(servidorId: string, ano: number, mes: number) {
  return useQuery({
    queryKey: ['esocial-s1200', servidorId, ano, mes],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('fn_gerar_esocial_s1200', {
        p_servidor_id: servidorId,
        p_competencia_ano: ano,
        p_competencia_mes: mes,
      });
      if (error) throw error;
      return data;
    },
    enabled: false,
  });
}

// Salvar evento eSocial gerado
export function useSalvarEventoESocial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (evento: {
      tipo_evento: string;
      servidor_id: string;
      competencia_ano: number;
      competencia_mes: number;
      payload: Record<string, unknown>;
      folha_id?: string;
    }) => {
      const { data, error } = await supabase
        .from('eventos_esocial')
        .insert({
          tipo_evento: evento.tipo_evento,
          servidor_id: evento.servidor_id,
          competencia_ano: evento.competencia_ano,
          competencia_mes: evento.competencia_mes,
          payload: evento.payload as any,
          folha_id: evento.folha_id,
          status: 'pendente' as any,
          data_geracao: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventos-esocial'] });
      toast.success('Evento eSocial gerado com sucesso');
    },
    onError: (error) => toast.error(`Erro ao gerar evento: ${error.message}`),
  });
}

// ==================== Relatório TCE ====================

export function useRelatorioTCEPessoal() {
  return useQuery({
    queryKey: ['relatorio-tce-pessoal'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_relatorio_tce_pessoal')
        .select('*')
        .order('nome_completo');
      if (error) throw error;
      return data;
    },
  });
}
