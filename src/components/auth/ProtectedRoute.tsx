// ============================================
// COMPONENTE DE ROTA PROTEGIDA - RBAC 2026
// ============================================
// Verificação em 3 níveis:
// 1. Autenticação (sessão válida)
// 2. Módulo (user_modules) - via requiredModule
// 3. Permissão granular (listar_permissoes_usuario) - via requiredPermissions
// Super Admin (role=admin) tem bypass total

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionCode, ROUTE_PERMISSIONS } from '@/types/auth';
import { useModulosUsuario } from '@/hooks/useModulosUsuario';
import type { Modulo } from '@/shared/config/modules.config';
import type { AppRole } from '@/types/rbac';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  
  /** Requer autenticação (default: true) */
  requireAuth?: boolean;
  
  /** Módulo requerido - verificado contra user_modules */
  requiredModule?: Modulo;
  
  /** Roles permitidos - verificados contra user_roles */
  allowedRoles?: AppRole | AppRole[];
  
  /** Permissões granulares requeridas */
  requiredPermissions?: PermissionCode | PermissionCode[];
  
  /** Modo de verificação: 'any' ou 'all' */
  permissionMode?: 'any' | 'all';
  
  /** Página de redirecionamento quando não autenticado */
  loginPath?: string;
  
  /** Página de redirecionamento quando sem permissão */
  accessDeniedPath?: string;
  
  /** Componente personalizado de loading */
  loadingComponent?: React.ReactNode;
  
  /** Callback quando acesso negado */
  onAccessDenied?: () => void;
  
  /** Se true, usa o mapeamento automático de rota para permissão */
  useRouteMapping?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requiredModule,
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
  const { 
    role: userRole, 
    loading: roleLoading, 
    temAcessoModulo 
  } = useModulosUsuario();
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
  // 1. VERIFICAÇÃO DE AUTENTICAÇÃO
  // ============================================
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // ============================================
  // 2. TROCA OBRIGATÓRIA DE SENHA
  // ============================================
  if (user?.requiresPasswordChange && location.pathname !== '/trocar-senha-obrigatoria') {
    return <Navigate to="/trocar-senha-obrigatoria" replace />;
  }

  // ============================================
  // 3. SUPER ADMIN BYPASS (role=admin no banco)
  // ============================================
  if (isSuperAdmin || userRole === 'admin') {
    return <>{children}</>;
  }

  // ============================================
  // 4. VERIFICAÇÃO DE MÓDULO (user_modules)
  // ============================================
  if (requiredModule) {
    if (!temAcessoModulo(requiredModule)) {
      onAccessDenied?.();
      return <Navigate to={accessDeniedPath} state={{ from: location }} replace />;
    }
  }

  // ============================================
  // 5. VERIFICAÇÃO DE ROLES (user_roles)
  // ============================================
  if (allowedRoles) {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    const hasRole = userRole && roles.includes(userRole as AppRole);
    
    if (hasRole) {
      return <>{children}</>;
    }
    
    // Se não tem o role e não há permissões para verificar, negar
    if (!requiredPermissions && !useRouteMapping) {
      onAccessDenied?.();
      return <Navigate to={accessDeniedPath} state={{ from: location }} replace />;
    }
  }

  // ============================================
  // 6. VERIFICAÇÃO DE PERMISSÕES GRANULARES
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
