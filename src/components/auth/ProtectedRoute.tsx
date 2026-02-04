// ============================================
// COMPONENTE DE ROTA PROTEGIDA - FASE 6
// ============================================
// Baseado EXCLUSIVAMENTE em permissões do banco
// Mantém compatibilidade com allowedRoles para migração gradual
// Integração com sistema de módulos por usuário

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useModulosUsuario } from '@/hooks/useModulosUsuario';
import { PermissionCode, ROUTE_PERMISSIONS, AppRole } from '@/types/auth';
import { Loader2 } from 'lucide-react';

// ============================================
// MAPEAMENTO DE ROLES LEGADOS PARA PERMISSÕES
// ============================================
// Usado durante a migração para converter roles antigos em permissões
const ROLE_TO_PERMISSIONS: Record<string, PermissionCode[]> = {
  'admin': ['admin'],
  'ti_admin': ['admin'],
  'presidencia': ['admin', 'aprovacoes.aprovar'],
  'rh': ['rh.servidores.visualizar', 'rh.portarias.visualizar'],
  'diraf': ['financeiro.folha.visualizar', 'financeiro.pagamentos.visualizar'],
  'ascom': ['ascom.demandas.visualizar', 'ascom.demandas.tratar'],
  'controle_interno': ['admin.auditoria'],
  'manager': ['admin.dashboard'],
  'user': [],
  'guest': [],
};

interface ProtectedRouteProps {
  children: React.ReactNode;
  
  /**
   * Requer autenticação (default: true)
   */
  requireAuth?: boolean;
  
  /**
   * @deprecated Use requiredPermissions em vez de allowedRoles
   * Roles permitidos (mantido para compatibilidade)
   */
  allowedRoles?: AppRole | AppRole[];
  
  /**
   * Permissões requeridas para acessar a rota
   * Pode ser uma permissão única ou array
   */
  requiredPermissions?: PermissionCode | PermissionCode[];
  
  /**
   * Modo de verificação de permissões: 'any' ou 'all'
   * - 'any': precisa de pelo menos uma das permissões
   * - 'all': precisa de todas as permissões
   */
  permissionMode?: 'any' | 'all';
  
  /**
   * Página de redirecionamento quando não autenticado
   */
  loginPath?: string;
  
  /**
   * Página de redirecionamento quando sem permissão
   */
  accessDeniedPath?: string;
  
  /**
   * Componente personalizado de loading
   */
  loadingComponent?: React.ReactNode;
  
  /**
   * Callback quando acesso negado (antes do redirect)
   */
  onAccessDenied?: () => void;
  
  /**
   * Se true, usa o mapeamento automático de rota para permissão
   * baseado na rota atual
   */
  useRouteMapping?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  allowedRoles,
  requiredPermissions,
  permissionMode = 'any',
  loginPath = '/auth',
  accessDeniedPath = '/acesso-negado',
  loadingComponent,
  onAccessDenied,
  useRouteMapping = false
}) => {
  const { 
    user, 
    isLoading, 
    isAuthenticated, 
    isSuperAdmin,
    hasAnyPermission, 
    hasAllPermissions 
  } = useAuth();
  const { rotaAutorizada, loading: loadingModulos, restringirModulos } = useModulosUsuario();
  const location = useLocation();

  // ============================================
  // LOADING STATE
  // ============================================

  if (isLoading || loadingModulos) {
    return loadingComponent || (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // VERIFICAÇÃO DE AUTENTICAÇÃO
  // ============================================

  if (requireAuth && !isAuthenticated) {
    // Salvar localização atual para redirect após login
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // Super Admin tem acesso total
  if (isSuperAdmin) {
    return <>{children}</>;
  }

  // ============================================
  // VERIFICAÇÃO DE MÓDULO (NOVA)
  // ============================================

  // Verifica se a rota está em um módulo autorizado para o usuário
  if (restringirModulos && !rotaAutorizada(location.pathname)) {
    onAccessDenied?.();
    return <Navigate to={accessDeniedPath} state={{ from: location, reason: 'module_restricted' }} replace />;
  }

  // ============================================
  // DETERMINAÇÃO DAS PERMISSÕES REQUERIDAS
  // ============================================

  let permissionsToCheck: PermissionCode[] = [];

  // Se tem permissões explícitas, usar elas
  if (requiredPermissions) {
    permissionsToCheck = Array.isArray(requiredPermissions) 
      ? requiredPermissions 
      : [requiredPermissions];
  }
  // Se tem allowedRoles legado, converter para permissões
  else if (allowedRoles) {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    roles.forEach(role => {
      const rolePermissions = ROLE_TO_PERMISSIONS[role] || [];
      permissionsToCheck.push(...rolePermissions);
    });
    // Remover duplicatas
    permissionsToCheck = [...new Set(permissionsToCheck)];
  }
  // Se deve usar mapeamento de rota
  else if (useRouteMapping) {
    const routePermission = ROUTE_PERMISSIONS[location.pathname];
    if (routePermission) {
      permissionsToCheck = Array.isArray(routePermission) 
        ? routePermission 
        : [routePermission];
    }
  }

  // ============================================
  // VERIFICAÇÃO DE PERMISSÕES
  // ============================================

  if (permissionsToCheck.length > 0 && user) {
    let hasAccess = false;
    
    if (permissionMode === 'any') {
      hasAccess = hasAnyPermission(permissionsToCheck);
    } else {
      hasAccess = hasAllPermissions(permissionsToCheck);
    }
    
    if (!hasAccess) {
      onAccessDenied?.();
      return <Navigate to={accessDeniedPath} state={{ from: location }} replace />;
    }
  }

  // ============================================
  // RENDERIZAR CHILDREN
  // ============================================

  return <>{children}</>;
};

export default ProtectedRoute;
