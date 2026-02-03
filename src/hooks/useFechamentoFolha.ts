// ============================================
// HOOK PARA WORKFLOW DE FECHAMENTO DA FOLHA
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

// Tipos para o histórico de status
export interface HistoricoStatusFolha {
  id: string;
  folha_id: string;
  status_anterior: string | null;
  status_novo: string;
  usuario_id: string | null;
  usuario_nome: string | null;
  justificativa: string | null;
  ip_address: string | null;
  created_at: string;
}

// Tipos para informações de governança da folha
export interface GovernancaFolha {
  fechado_por: string | null;
  fechado_em: string | null;
  justificativa_fechamento: string | null;
  reaberto_por: string | null;
  reaberto_em: string | null;
  justificativa_reabertura: string | null;
  conferido_por: string | null;
  conferido_em: string | null;
}

// ============== VERIFICAR PERMISSÕES ==============

export function usePermissoesFolha() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['permissoes-folha', user?.id],
    queryFn: async () => {
      if (!user?.id) return { podeFechar: false, podeReabrir: false };
      
      const [{ data: podeFechar }, { data: podeReabrir }] = await Promise.all([
        supabase.rpc('usuario_pode_fechar_folha', { p_user_id: user.id }),
        supabase.rpc('usuario_pode_reabrir_folha', { p_user_id: user.id }),
      ]);
      
      return {
        podeFechar: podeFechar ?? false,
        podeReabrir: podeReabrir ?? false,
      };
    },
    enabled: !!user?.id,
  });
}

// ============== VERIFICAR SE FOLHA ESTÁ BLOQUEADA ==============

export function useFolhaBloqueada(folhaId?: string) {
  return useQuery({
    queryKey: ['folha-bloqueada', folhaId],
    queryFn: async () => {
      if (!folhaId) return false;
      
      const { data, error } = await supabase.rpc('folha_esta_bloqueada', {
        p_folha_id: folhaId,
      });
      
      if (error) {
        console.error('Erro ao verificar bloqueio:', error);
        return false;
      }
      
      return data ?? false;
    },
    enabled: !!folhaId,
  });
}

// ============== HISTÓRICO DE STATUS ==============

export function useHistoricoStatusFolha(folhaId?: string) {
  return useQuery({
    queryKey: ['historico-status-folha', folhaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('folha_historico_status')
        .select('*')
        .eq('folha_id', folhaId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as HistoricoStatusFolha[];
    },
    enabled: !!folhaId,
  });
}

// ============== FECHAR FOLHA ==============

export function useFecharFolha() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ folhaId, justificativa }: { folhaId: string; justificativa?: string }) => {
      const { data, error } = await supabase.rpc('fechar_folha', {
        p_folha_id: folhaId,
        p_justificativa: justificativa ?? null,
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; message?: string };
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao fechar folha');
      }
      
      return result;
    },
    onSuccess: (_, { folhaId }) => {
      queryClient.invalidateQueries({ queryKey: ['folhas-pagamento'] });
      queryClient.invalidateQueries({ queryKey: ['folha-bloqueada', folhaId] });
      queryClient.invalidateQueries({ queryKey: ['historico-status-folha', folhaId] });
      toast.success('Folha fechada com sucesso');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao fechar folha');
    },
  });
}

// ============== REABRIR FOLHA ==============

export function useReabrirFolha() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ folhaId, justificativa }: { folhaId: string; justificativa: string }) => {
      const { data, error } = await supabase.rpc('reabrir_folha', {
        p_folha_id: folhaId,
        p_justificativa: justificativa,
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; message?: string };
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao reabrir folha');
      }
      
      return result;
    },
    onSuccess: (_, { folhaId }) => {
      queryClient.invalidateQueries({ queryKey: ['folhas-pagamento'] });
      queryClient.invalidateQueries({ queryKey: ['folha-bloqueada', folhaId] });
      queryClient.invalidateQueries({ queryKey: ['historico-status-folha', folhaId] });
      toast.success('Folha reaberta com sucesso');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao reabrir folha');
    },
  });
}

// ============== ENVIAR PARA CONFERÊNCIA ==============

export function useEnviarConferencia() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (folhaId: string) => {
      const { data, error } = await supabase.rpc('enviar_folha_conferencia', {
        p_folha_id: folhaId,
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; message?: string };
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao enviar para conferência');
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folhas-pagamento'] });
      toast.success('Folha enviada para conferência');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao enviar para conferência');
    },
  });
}
