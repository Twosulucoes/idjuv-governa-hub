// ============================================
// HOOK DE PERMISSÕES
// ============================================
// Hook customizado para gerenciamento de permissões
// Fornece funções utilitárias para verificar acesso

import { useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppRole, AppPermission, ROLE_LABELS, PERMISSION_LABELS } from '@/types/auth';

interface UsePermissionsReturn {
  // Dados do usuário
  user: ReturnType<typeof useAuth>['user'];
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Verificações de permissão
  hasPermission: (permission: AppPermission) => boolean;
  hasAnyPermission: (permissions: AppPermission[]) => boolean;
  hasAllPermissions: (permissions: AppPermission[]) => boolean;
  
  // Verificações de role
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: AppRole[]) => boolean;
  canAccess: (requiredRoles: AppRole[]) => boolean;
  
  // Utilitários
  getRoleLabel: (role: AppRole) => string;
  getPermissionLabel: (permission: AppPermission) => string;
  getUserRoleLabel: () => string;
  
  // Verificações rápidas
  isAdmin: boolean;
  isManager: boolean;
  isUser: boolean;
  isGuest: boolean;
  
  // Permissões agrupadas
  canManageUsers: boolean;
  canManageContent: boolean;
  canManageReports: boolean;
  canManageSettings: boolean;
  canManageProcesses: boolean;
}

export const usePermissions = (): UsePermissionsReturn => {
  const {
    user,
    isLoading,
    isAuthenticated,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    canAccess
  } = useAuth();

  // ============================================
  // UTILITÁRIOS
  // ============================================

  const getRoleLabel = useCallback((role: AppRole): string => {
    return ROLE_LABELS[role] || role;
  }, []);

  const getPermissionLabel = useCallback((permission: AppPermission): string => {
    return PERMISSION_LABELS[permission] || permission;
  }, []);

  const getUserRoleLabel = useCallback((): string => {
    if (!user) return 'Não autenticado';
    return ROLE_LABELS[user.role] || user.role;
  }, [user]);

  // ============================================
  // VERIFICAÇÕES RÁPIDAS DE ROLE
  // ============================================

  const isAdmin = useMemo(() => hasRole('admin'), [hasRole]);
  const isManager = useMemo(() => hasRole('manager'), [hasRole]);
  const isUser = useMemo(() => hasRole('user'), [hasRole]);
  const isGuest = useMemo(() => hasRole('guest'), [hasRole]);

  // ============================================
  // VERIFICAÇÕES DE GRUPOS DE PERMISSÕES
  // ============================================

  // Pode gerenciar usuários (CRUD completo)
  const canManageUsers = useMemo(() => 
    hasAllPermissions(['users.read', 'users.create', 'users.update', 'users.delete']),
    [hasAllPermissions]
  );

  // Pode gerenciar conteúdo (CRUD completo)
  const canManageContent = useMemo(() => 
    hasAllPermissions(['content.read', 'content.create', 'content.update', 'content.delete']),
    [hasAllPermissions]
  );

  // Pode gerenciar relatórios (ver e exportar)
  const canManageReports = useMemo(() => 
    hasAllPermissions(['reports.view', 'reports.export']),
    [hasAllPermissions]
  );

  // Pode gerenciar configurações
  const canManageSettings = useMemo(() => 
    hasAllPermissions(['settings.view', 'settings.edit']),
    [hasAllPermissions]
  );

  // Pode gerenciar processos (CRUD + aprovação)
  const canManageProcesses = useMemo(() => 
    hasAllPermissions(['processes.read', 'processes.create', 'processes.update', 'processes.delete', 'processes.approve']),
    [hasAllPermissions]
  );

  // ============================================
  // RETORNO
  // ============================================

  return {
    user,
    isLoading,
    isAuthenticated,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    canAccess,
    getRoleLabel,
    getPermissionLabel,
    getUserRoleLabel,
    isAdmin,
    isManager,
    isUser,
    isGuest,
    canManageUsers,
    canManageContent,
    canManageReports,
    canManageSettings,
    canManageProcesses
  };
};

export default usePermissions;
