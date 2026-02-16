// ============================================
// HOOK PARA BACKUP OFFSITE
// ============================================

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BackupConfig {
  id: string;
  enabled: boolean;
  schedule_cron: string;
  weekly_day: number;
  retention_daily: number;
  retention_weekly: number;
  retention_monthly: number;
  buckets_included: string[];
  encryption_enabled: boolean;
  last_backup_at: string | null;
  last_backup_status: 'pending' | 'running' | 'success' | 'failed' | 'partial' | null;
}

interface BackupHistory {
  id: string;
  backup_type: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  triggered_by: string | null;
  trigger_mode: string;
  db_file_path: string | null;
  db_file_size: number | null;
  db_checksum: string | null;
  storage_file_path: string | null;
  storage_file_size: number | null;
  storage_checksum: string | null;
  storage_objects_count: number | null;
  manifest_path: string | null;
  total_size: number | null;
  duration_seconds: number | null;
  error_message: string | null;
  system_version: string | null;
}

interface IntegrityCheck {
  id: string;
  backup_id: string;
  checked_by: string;
  checked_at: string;
  is_valid: boolean;
  db_checksum_valid: boolean;
  storage_checksum_valid: boolean;
  manifest_valid: boolean;
}

export const useBackupOffsite = () => {
  const queryClient = useQueryClient();
  const [isExecuting, setIsExecuting] = useState(false);

  // Buscar configuração
  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['backup-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backup_config')
        .select('*')
        .single();
      
      if (error) throw error;
      return data as BackupConfig;
    }
  });

  // Buscar histórico
  const { data: history, isLoading: historyLoading, refetch: refetchHistory } = useQuery({
    queryKey: ['backup-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backup_history')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as BackupHistory[];
    }
  });

  // Atualizar configuração
  const updateConfig = useMutation({
    mutationFn: async (updates: Partial<BackupConfig>) => {
      if (!config?.id) throw new Error('Configuração não encontrada');
      
      const { error } = await supabase
        .from('backup_config')
        .update(updates)
        .eq('id', config.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backup-config'] });
      toast.success('Configuração atualizada');
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    }
  });

  // Invocar edge function
  const invokeBackupFunction = useCallback(async (action: string, params: Record<string, unknown> = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Não autenticado');

    const response = await supabase.functions.invoke('backup-offsite', {
      body: { action, ...params },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (response.error) {
      throw new Error(response.error.message || 'Falha ao chamar função');
    }

    const data: any = response.data;

    if (!data?.success) {
      const msg = data?.error || data?.message || 'Falha ao executar operação';
      throw new Error(msg);
    }

    return data;
  }, []);

  // Testar conexão
  const testConnection = useMutation({
    mutationFn: async () => {
      return invokeBackupFunction('test-connection');
    },
    onSuccess: () => {
      toast.success('Conexão com Supabase destino OK');
    },
    onError: (error) => {
      toast.error(`Falha na conexão: ${error.message}`);
    }
  });

  // Executar backup com formato
  const executeBackup = useMutation({
    mutationFn: async (params: { backupType?: string; format?: string } = {}) => {
      setIsExecuting(true);
      const backupType = params.backupType || 'manual';
      const format = params.format || 'json';
      return invokeBackupFunction('execute-backup', { backupType, format });
    },
    onSuccess: (data) => {
      setIsExecuting(false);
      queryClient.invalidateQueries({ queryKey: ['backup-history'] });
      queryClient.invalidateQueries({ queryKey: ['backup-config'] });
      toast.success(`Backup concluído! ${data.tablesExported} tabelas, ${formatBytes(data.totalSize)}`);
    },
    onError: (error) => {
      setIsExecuting(false);
      toast.error(`Erro no backup: ${error.message}`);
    }
  });

  // Verificar integridade
  const verifyIntegrity = useMutation({
    mutationFn: async (backupId: string) => {
      return invokeBackupFunction('verify-integrity', { backupId });
    },
    onSuccess: (data) => {
      if (data.isValid) {
        toast.success('Integridade verificada: backup íntegro');
      } else {
        toast.warning('Atenção: inconsistências detectadas no backup');
      }
    },
    onError: (error) => {
      toast.error(`Erro na verificação: ${error.message}`);
    }
  });

  // Sincronizar banco espelho
  const syncDatabase = useMutation({
    mutationFn: async () => {
      setIsExecuting(true);
      return invokeBackupFunction('sync-database');
    },
    onSuccess: (data) => {
      setIsExecuting(false);
      queryClient.invalidateQueries({ queryKey: ['backup-history'] });
      toast.success(`Sincronização concluída! ${data.tablesSynced} tabelas, ${data.totalRecords} registros`);
    },
    onError: (error) => {
      setIsExecuting(false);
      toast.error(`Erro na sincronização: ${error.message}`);
    }
  });

  // Limpar backups antigos
  const cleanupOldBackups = useMutation({
    mutationFn: async () => {
      return invokeBackupFunction('cleanup-old-backups');
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['backup-history'] });
      toast.success(`${data.deletedCount} backups antigos removidos`);
    },
    onError: (error) => {
      toast.error(`Erro na limpeza: ${error.message}`);
    }
  });

  // Download manifest
  const downloadManifest = useCallback(async (backupId: string) => {
    try {
      const data = await invokeBackupFunction('download-manifest', { backupId });
      
      if (data.url) {
        // Fetch actual manifest from signed URL
        const response = await fetch(data.url);
        if (!response.ok) throw new Error('Falha ao baixar manifest');
        const manifestContent = await response.text();
        
        const blob = new Blob([manifestContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `manifest_${backupId}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (data.manifest) {
        const blob = new Blob([JSON.stringify(data.manifest, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `manifest_${backupId}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        throw new Error('Manifest não disponível');
      }
      
      toast.success('Manifest baixado');
    } catch (error) {
      toast.error(`Erro ao baixar manifest: ${(error as Error).message}`);
    }
  }, [invokeBackupFunction]);

  // Gerar e baixar schema DDL do banco destino
  const generateDestSchema = useCallback(async () => {
    try {
      toast.info('Gerando schema DDL...');
      const data = await invokeBackupFunction('generate-dest-schema');
      
      const blob = new Blob([data.sql], { type: 'text/sql' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `schema_idjuv_${new Date().toISOString().slice(0,10)}.sql`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success(`Schema gerado: ${data.tables_count} tabelas, ${data.enums_count} enums`);
    } catch (error) {
      toast.error(`Erro ao gerar schema: ${(error as Error).message}`);
    }
  }, [invokeBackupFunction]);

  // Exportar dados completos para download local (sem precisar de servidor destino)
  const exportLocalBackup = useCallback(async (format: string = 'json') => {
    try {
      toast.info(`Exportando dados em ${format.toUpperCase()}...`);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const response = await supabase.functions.invoke('backup-offsite', {
        body: { action: 'external-export', apiKey: '__local__', format, localExport: true },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (response.error) throw new Error(response.error.message);
      const data: any = response.data;
      
      let content: string;
      let mimeType: string;
      let extension: string;
      
      if (format === 'sql') {
        content = Object.values(data.data as Record<string, string>).join('\n');
        mimeType = 'text/sql';
        extension = 'sql';
      } else if (format === 'csv') {
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        extension = 'json'; // CSV tables inside JSON wrapper
      } else {
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        extension = 'json';
      }
      
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_idjuv_${new Date().toISOString().slice(0,10)}.${extension}`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success(`Exportação concluída: ${data.tables_count} tabelas, ${data.total_records} registros`);
    } catch (error) {
      toast.error(`Erro na exportação: ${(error as Error).message}`);
    }
  }, []);

  return {
    config,
    configLoading,
    history,
    historyLoading,
    isExecuting,
    updateConfig: updateConfig.mutate,
    testConnection: testConnection.mutate,
    executeBackup: executeBackup.mutate,
    verifyIntegrity: verifyIntegrity.mutate,
    cleanupOldBackups: cleanupOldBackups.mutate,
    syncDatabase: syncDatabase.mutate,
    downloadManifest,
    generateDestSchema,
    exportLocalBackup,
    refetchHistory
  };
};

// Utilitário para formatar bytes
export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

// Utilitário para formatar duração
export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}
