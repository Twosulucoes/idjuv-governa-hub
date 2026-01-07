// ============================================
// HOOK PARA SOLICITAÇÕES DE APROVAÇÃO
// ============================================

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ApprovalRequest, ApprovalStatus } from '@/types/auth';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from './useAuditLog';

export const useApprovalRequests = () => {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { logApprove, logReject, logCreate } = useAuditLog();

  const fetchRequests = useCallback(async (filters?: {
    status?: ApprovalStatus;
    moduleName?: string;
    requesterId?: string;
  }) => {
    setLoading(true);
    try {
      let query = supabase
        .from('approval_requests')
        .select(`
          *,
          requester:profiles!approval_requests_requester_id_fkey(full_name),
          approver:profiles!approval_requests_approver_id_fkey(full_name),
          org_unit:estrutura_organizacional!approval_requests_requester_org_unit_id_fkey(nome)
        `)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.moduleName) {
        query = query.eq('module_name', filters.moduleName);
      }
      if (filters?.requesterId) {
        query = query.eq('requester_id', filters.requesterId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const mapped: ApprovalRequest[] = (data || []).map((r: any) => ({
        id: r.id,
        entityType: r.entity_type,
        entityId: r.entity_id,
        moduleName: r.module_name,
        status: r.status,
        requesterId: r.requester_id,
        requesterName: r.requester?.full_name,
        requesterOrgUnitId: r.requester_org_unit_id,
        submittedAt: r.submitted_at,
        justification: r.justification,
        attachments: r.attachments,
        approverId: r.approver_id,
        approverName: r.approver?.full_name,
        approvedAt: r.approved_at,
        approverDecision: r.approver_decision,
        electronicSignature: r.electronic_signature,
        priority: r.priority || 'normal',
        dueDate: r.due_date,
        createdAt: r.created_at,
        updatedAt: r.updated_at
      }));

      setRequests(mapped);
      return mapped;
    } catch (error) {
      console.error('Erro ao buscar solicitações:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createRequest = useCallback(async (data: {
    entityType: string;
    entityId: string;
    moduleName: string;
    justification?: string;
    attachments?: any[];
    priority?: string;
    dueDate?: string;
  }) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) throw new Error('Usuário não autenticado');

      const { data: orgUnit } = await supabase
        .from('user_org_units')
        .select('unidade_id')
        .eq('user_id', session.session.user.id)
        .eq('is_primary', true)
        .maybeSingle();

      const { data: result, error } = await supabase
        .from('approval_requests')
        .insert({
          entity_type: data.entityType,
          entity_id: data.entityId,
          module_name: data.moduleName,
          requester_id: session.session.user.id,
          requester_org_unit_id: orgUnit?.unidade_id,
          justification: data.justification,
          attachments: data.attachments || [],
          priority: data.priority || 'normal',
          due_date: data.dueDate,
          status: 'submitted',
          submitted_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      await logCreate('approval_requests', result.id, result, data.moduleName);

      toast({
        title: 'Solicitação enviada',
        description: 'Sua solicitação foi enviada para aprovação.'
      });

      return result;
    } catch (error) {
      console.error('Erro ao criar solicitação:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível criar a solicitação.'
      });
      return null;
    }
  }, [toast, logCreate]);

  const approveRequest = useCallback(async (
    requestId: string,
    decision: string,
    signature: { name: string; role: string }
  ) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) throw new Error('Usuário não autenticado');

      const electronicSignature = {
        name: signature.name,
        role: signature.role,
        timestamp: new Date().toISOString(),
        hash: btoa(`${signature.name}|${signature.role}|${Date.now()}`)
      };

      const { error } = await supabase
        .from('approval_requests')
        .update({
          status: 'approved',
          approver_id: session.session.user.id,
          approved_at: new Date().toISOString(),
          approver_decision: decision,
          electronic_signature: electronicSignature
        })
        .eq('id', requestId);

      if (error) throw error;

      await logApprove('approval_requests', requestId, 'aprovacoes');

      toast({
        title: 'Solicitação aprovada',
        description: 'A solicitação foi aprovada com sucesso.'
      });

      await fetchRequests();
      return true;
    } catch (error) {
      console.error('Erro ao aprovar solicitação:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível aprovar a solicitação.'
      });
      return false;
    }
  }, [toast, fetchRequests, logApprove]);

  const rejectRequest = useCallback(async (requestId: string, reason: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('approval_requests')
        .update({
          status: 'rejected',
          approver_id: session.session.user.id,
          approved_at: new Date().toISOString(),
          approver_decision: reason
        })
        .eq('id', requestId);

      if (error) throw error;

      await logReject('approval_requests', requestId, 'aprovacoes', reason);

      toast({
        title: 'Solicitação rejeitada',
        description: 'A solicitação foi rejeitada.'
      });

      await fetchRequests();
      return true;
    } catch (error) {
      console.error('Erro ao rejeitar solicitação:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível rejeitar a solicitação.'
      });
      return false;
    }
  }, [toast, fetchRequests, logReject]);

  return {
    requests,
    loading,
    fetchRequests,
    createRequest,
    approveRequest,
    rejectRequest
  };
};
