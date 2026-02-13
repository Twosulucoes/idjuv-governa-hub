// ============================================
// COMPONENTE DE ROTA PROTEGIDA - FASE 7
// ============================================
// Baseado EXCLUSIVAMENTE em permissões do banco (RBAC)
// Mantém compatibilidade com allowedRoles para migração gradual
// Sistema de módulos removido - usar apenas perfis/permissões

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionCode, ROUTE_PERMISSIONS, AppRole } from '@/types/auth';
import { useModulosUsuario } from '@/hooks/useModulosUsuario';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  
  /**
   * Requer autenticação (default: true)
   */
  requireAuth?: boolean;
  
  /**
   * Roles permitidos - verificados diretamente contra o role do usuário no banco
   */
  allowedRoles?: AppRole | AppRole[];
  
  /**
   * Permissões requeridas para acessar a rota
   */
  requiredPermissions?: PermissionCode | PermissionCode[];
  
  /**
   * Modo de verificação de permissões: 'any' ou 'all'
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
  const { role: userRole, loading: roleLoading } = useModulosUsuario();
  const location = useLocation();

  // ============================================
  // LOADING STATE
  // ============================================

  if (isLoading || roleLoading) {
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
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // ============================================
  // VERIFICAÇÃO DE TROCA OBRIGATÓRIA DE SENHA
  // ============================================

  if (user?.requiresPasswordChange && location.pathname !== '/trocar-senha-obrigatoria') {
    return <Navigate to="/trocar-senha-obrigatoria" replace />;
  }

  // Super Admin tem acesso total
  if (isSuperAdmin) {
    return <>{children}</>;
  }

  // ============================================
  // VERIFICAÇÃO DE ROLES (comparação direta)
  // ============================================

  if (allowedRoles) {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    // Verificar se o role do usuário está na lista permitida
    const hasRole = userRole && roles.includes(userRole as AppRole);
    
    if (hasRole) {
      return <>{children}</>;
    }
    
    // Se não tem o role e não há permissões para verificar, negar acesso
    if (!requiredPermissions && !useRouteMapping) {
      onAccessDenied?.();
      return <Navigate to={accessDeniedPath} state={{ from: location }} replace />;
    }
  }

  // ============================================
  // VERIFICAÇÃO DE PERMISSÕES
  // ============================================

  let permissionsToCheck: PermissionCode[] = [];

  if (requiredPermissions) {
    permissionsToCheck = Array.isArray(requiredPermissions) 
      ? requiredPermissions 
      : [requiredPermissions];
  } else if (useRouteMapping) {
    const routePermission = ROUTE_PERMISSIONS[location.pathname];
    if (routePermission) {
      permissionsToCheck = Array.isArray(routePermission) 
        ? routePermission 
        : [routePermission];
    }
  }

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
