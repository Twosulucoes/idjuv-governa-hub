// ============================================
// HOOK PARA AUDITORIA
// ============================================

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuditAction } from '@/types/auth';

interface LogAuditParams {
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  moduleName?: string;
  beforeData?: any;
  afterData?: any;
  description?: string;
  metadata?: any;
}

export const useAuditLog = () => {
  const logAudit = useCallback(async (params: LogAuditParams) => {
    try {
      const { data, error } = await supabase.rpc('log_audit', {
        _action: params.action,
        _entity_type: params.entityType || null,
        _entity_id: params.entityId || null,
        _module_name: params.moduleName || null,
        _before_data: params.beforeData || null,
        _after_data: params.afterData || null,
        _description: params.description || null,
        _metadata: params.metadata || {}
      });

      if (error) {
        console.error('Erro ao registrar log de auditoria:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro ao registrar log de auditoria:', error);
      return null;
    }
  }, []);

  const logLogin = useCallback(() => {
    return logAudit({ action: 'login', description: 'Usuário realizou login' });
  }, [logAudit]);

  const logLogout = useCallback(() => {
    return logAudit({ action: 'logout', description: 'Usuário realizou logout' });
  }, [logAudit]);

  const logCreate = useCallback((entityType: string, entityId: string, data: any, moduleName?: string) => {
    return logAudit({
      action: 'create',
      entityType,
      entityId,
      moduleName,
      afterData: data,
      description: `Registro criado em ${entityType}`
    });
  }, [logAudit]);

  const logUpdate = useCallback((entityType: string, entityId: string, beforeData: any, afterData: any, moduleName?: string) => {
    return logAudit({
      action: 'update',
      entityType,
      entityId,
      moduleName,
      beforeData,
      afterData,
      description: `Registro atualizado em ${entityType}`
    });
  }, [logAudit]);

  const logDelete = useCallback((entityType: string, entityId: string, data: any, moduleName?: string) => {
    return logAudit({
      action: 'delete',
      entityType,
      entityId,
      moduleName,
      beforeData: data,
      description: `Registro excluído em ${entityType}`
    });
  }, [logAudit]);

  const logApprove = useCallback((entityType: string, entityId: string, moduleName?: string) => {
    return logAudit({
      action: 'approve',
      entityType,
      entityId,
      moduleName,
      description: `Solicitação aprovada em ${entityType}`
    });
  }, [logAudit]);

  const logReject = useCallback((entityType: string, entityId: string, moduleName?: string, reason?: string) => {
    return logAudit({
      action: 'reject',
      entityType,
      entityId,
      moduleName,
      metadata: { reason },
      description: `Solicitação rejeitada em ${entityType}`
    });
  }, [logAudit]);

  return {
    logAudit,
    logLogin,
    logLogout,
    logCreate,
    logUpdate,
    logDelete,
    logApprove,
    logReject
  };
};
