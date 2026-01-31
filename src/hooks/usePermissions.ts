// ============================================
// HOOK DE PERMISSÕES - FASE 6
// ============================================
// Hook customizado para gerenciamento de permissões
// Baseado EXCLUSIVAMENTE em permissões do banco

import { useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionCode, PermissaoUsuario, MODULE_PERMISSIONS, ROLE_LABELS, AppRole } from '@/types/auth';

export interface UsePermissionsReturn {
  // Dados do usuário
  user: ReturnType<typeof useAuth>['user'];
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Verificações de permissão
  hasPermission: (codigo: PermissionCode) => boolean;
  hasAnyPermission: (codigos: PermissionCode[]) => boolean;
  hasAllPermissions: (codigos: PermissionCode[]) => boolean;
  
  // Verificar acesso a módulo inteiro
  hasModuleAccess: (modulo: string) => boolean;
  
  // Utilitários
  getUserPermissions: () => PermissionCode[];
  getPermissoesDetalhadas: () => PermissaoUsuario[];
  getModulosAcessiveis: () => string[];
  
  // Verificações rápidas
  isSuperAdmin: boolean;
  
  // ============================================
  // COMPATIBILIDADE LEGADA
  // ============================================
  // @deprecated - Use isSuperAdmin e verificações de permissão
  isAdmin: boolean;
  isManager: boolean;
  getUserRoleLabel: () => string;
  
  // @deprecated - Use hasPermission com permissões específicas
  canManageUsers: boolean;
  canManageContent: boolean;
  canManageReports: boolean;
  canManageSettings: boolean;
  canManageProcesses: boolean;
  
  // Permissões agrupadas por módulo
  canAccessAdmin: boolean;
  canAccessRH: boolean;
  canAccessGovernanca: boolean;
  canAccessFinanceiro: boolean;
  canAccessAscom: boolean;
  canAccessFederacoes: boolean;
  canAccessUnidades: boolean;
  canAccessProcessos: boolean;
  canAccessAprovacoes: boolean;
  
  // Ações específicas
  canCreateServidores: boolean;
  canEditServidores: boolean;
  canDeleteServidores: boolean;
  canCreatePortarias: boolean;
  canProcessarFolha: boolean;
  canAprovar: boolean;
}

export const usePermissions = (): UsePermissionsReturn => {
  const {
    user,
    isLoading,
    isAuthenticated,
    isSuperAdmin,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getUserPermissions,
    getPermissoesDetalhadas
  } = useAuth();

  // ============================================
  // VERIFICAR ACESSO A MÓDULO
  // ============================================

  const hasModuleAccess = useCallback((modulo: string): boolean => {
    if (isSuperAdmin) return true;
    
    const permissions = getUserPermissions();
    
    // Verifica se tem qualquer permissão do módulo
    return permissions.some(p => p.startsWith(`${modulo}.`) || p === modulo);
  }, [isSuperAdmin, getUserPermissions]);

  // ============================================
  // OBTER MÓDULOS ACESSÍVEIS
  // ============================================

  const getModulosAcessiveis = useCallback((): string[] => {
    if (isSuperAdmin) {
      return Object.keys(MODULE_PERMISSIONS);
    }
    
    const permissions = getUserPermissions();
    const modulos = new Set<string>();
    
    permissions.forEach(p => {
      const partes = p.split('.');
      if (partes.length > 0) {
        modulos.add(partes[0]);
      }
    });
    
    return Array.from(modulos);
  }, [isSuperAdmin, getUserPermissions]);

  // ============================================
  // COMPATIBILIDADE LEGADA
  // ============================================
  
  // Simular isAdmin baseado em permissões (super_admin ou acesso admin)
  const isAdmin = useMemo(() => 
    isSuperAdmin || hasModuleAccess('admin'),
    [isSuperAdmin, hasModuleAccess]
  );

  // Simular isManager (quem tem acesso a aprovações ou gerência)
  const isManager = useMemo(() => 
    isSuperAdmin || hasModuleAccess('aprovacoes') || hasAnyPermission(['rh.gerenciar', 'governanca.gerenciar']),
    [isSuperAdmin, hasModuleAccess, hasAnyPermission]
  );

  // Obter label do "role" baseado em permissões
  const getUserRoleLabel = useCallback((): string => {
    if (isSuperAdmin) return 'Super Administrador';
    if (hasModuleAccess('admin')) return 'Administrador';
    if (hasModuleAccess('aprovacoes')) return 'Gerente';
    if (hasModuleAccess('rh')) return 'Recursos Humanos';
    if (hasModuleAccess('governanca')) return 'Governança';
    if (hasModuleAccess('financeiro')) return 'Financeiro';
    if (hasModuleAccess('ascom')) return 'ASCOM';
    return 'Usuário';
  }, [isSuperAdmin, hasModuleAccess]);

  // Verificações legadas de gerenciamento
  const canManageUsers = useMemo(() => 
    hasAnyPermission(['admin.usuarios', 'admin.usuarios.criar', 'admin.usuarios.editar', 'admin.usuarios.excluir']),
    [hasAnyPermission]
  );

  const canManageContent = useMemo(() => 
    hasAnyPermission(['governanca.documentos.criar', 'governanca.documentos.editar', 'governanca.portarias.criar']),
    [hasAnyPermission]
  );

  const canManageReports = useMemo(() => 
    hasAnyPermission(['rh.relatorios.visualizar', 'governanca.relatorios.visualizar', 'financeiro.relatorios', 'rh.exportar']),
    [hasAnyPermission]
  );

  const canManageSettings = useMemo(() => 
    hasAnyPermission(['admin.configuracoes', 'admin.perfis', 'admin.perfis.gerenciar']),
    [hasAnyPermission]
  );

  const canManageProcesses = useMemo(() => 
    hasModuleAccess('processos') || hasAnyPermission(['aprovacoes.aprovar', 'aprovacoes.rejeitar']),
    [hasModuleAccess, hasAnyPermission]
  );

  // ============================================
  // VERIFICAÇÕES DE ACESSO A MÓDULOS
  // ============================================

  const canAccessAdmin = useMemo(() => 
    hasModuleAccess('admin'),
    [hasModuleAccess]
  );

  const canAccessRH = useMemo(() => 
    hasModuleAccess('rh'),
    [hasModuleAccess]
  );

  const canAccessGovernanca = useMemo(() => 
    hasModuleAccess('governanca'),
    [hasModuleAccess]
  );

  const canAccessFinanceiro = useMemo(() => 
    hasModuleAccess('financeiro'),
    [hasModuleAccess]
  );

  const canAccessAscom = useMemo(() => 
    hasModuleAccess('ascom'),
    [hasModuleAccess]
  );

  const canAccessFederacoes = useMemo(() => 
    hasModuleAccess('federacoes'),
    [hasModuleAccess]
  );

  const canAccessUnidades = useMemo(() => 
    hasModuleAccess('unidades'),
    [hasModuleAccess]
  );

  const canAccessProcessos = useMemo(() => 
    hasModuleAccess('processos'),
    [hasModuleAccess]
  );

  const canAccessAprovacoes = useMemo(() => 
    hasModuleAccess('aprovacoes'),
    [hasModuleAccess]
  );

  // ============================================
  // VERIFICAÇÕES DE AÇÕES ESPECÍFICAS
  // ============================================

  const canCreateServidores = useMemo(() => 
    hasPermission('rh.servidores.criar'),
    [hasPermission]
  );

  const canEditServidores = useMemo(() => 
    hasPermission('rh.servidores.editar'),
    [hasPermission]
  );

  const canDeleteServidores = useMemo(() => 
    hasPermission('rh.servidores.excluir'),
    [hasPermission]
  );

  const canCreatePortarias = useMemo(() => 
    hasAnyPermission(['rh.portarias.criar', 'governanca.portarias.criar']),
    [hasAnyPermission]
  );

  const canProcessarFolha = useMemo(() => 
    hasPermission('financeiro.folha.processar'),
    [hasPermission]
  );

  const canAprovar = useMemo(() => 
    hasAnyPermission(['aprovacoes.aprovar', 'aprovacoes.rejeitar']),
    [hasAnyPermission]
  );

  // ============================================
  // RETORNO
  // ============================================

  return {
    user,
    isLoading,
    isAuthenticated,
    isSuperAdmin,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasModuleAccess,
    getUserPermissions,
    getPermissoesDetalhadas,
    getModulosAcessiveis,
    // Legado
    isAdmin,
    isManager,
    getUserRoleLabel,
    canManageUsers,
    canManageContent,
    canManageReports,
    canManageSettings,
    canManageProcesses,
    // Módulos
    canAccessAdmin,
    canAccessRH,
    canAccessGovernanca,
    canAccessFinanceiro,
    canAccessAscom,
    canAccessFederacoes,
    canAccessUnidades,
    canAccessProcessos,
    canAccessAprovacoes,
    // Ações
    canCreateServidores,
    canEditServidores,
    canDeleteServidores,
    canCreatePortarias,
    canProcessarFolha,
    canAprovar
  };
};

export default usePermissions;
