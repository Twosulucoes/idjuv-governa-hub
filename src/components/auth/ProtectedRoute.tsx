// ============================================
// COMPONENTE DE ROTA PROTEGIDA
// ============================================
// Envolve rotas e verifica permissões antes de renderizar
// Redireciona para login ou página de acesso negado

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppRole, AppPermission } from '@/types/auth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  
  // Requer autenticação (default: true)
  requireAuth?: boolean;
  
  // Roles permitidos (aceita único ou array)
  allowedRoles?: AppRole | AppRole[];
  
  // Permissões requeridas
  requiredPermissions?: AppPermission | AppPermission[];
  
  // Modo de verificação de permissões: 'any' ou 'all'
  permissionMode?: 'any' | 'all';
  
  // Página de redirecionamento quando não autenticado
  loginPath?: string;
  
  // Página de redirecionamento quando sem permissão
  accessDeniedPath?: string;
  
  // Componente personalizado de loading
  loadingComponent?: React.ReactNode;
  
  // Callback quando acesso negado (antes do redirect)
  onAccessDenied?: () => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  allowedRoles,
  requiredPermissions,
  permissionMode = 'all',
  loginPath = '/auth',
  accessDeniedPath = '/acesso-negado',
  loadingComponent,
  onAccessDenied
}) => {
  const { user, isLoading, isAuthenticated, hasRole, hasAnyRole, hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();
  const location = useLocation();

  // ============================================
  // LOADING STATE
  // ============================================

  if (isLoading) {
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

  // ============================================
  // VERIFICAÇÃO DE ROLES
  // ============================================

  if (allowedRoles && user) {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    // Admin sempre tem acesso
    if (user.role !== 'admin' && !hasAnyRole(roles)) {
      onAccessDenied?.();
      return <Navigate to={accessDeniedPath} state={{ from: location }} replace />;
    }
  }

  // ============================================
  // VERIFICAÇÃO DE PERMISSÕES
  // ============================================

  if (requiredPermissions && user) {
    const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
    
    let hasAccess = false;
    
    if (permissionMode === 'any') {
      hasAccess = hasAnyPermission(permissions);
    } else {
      hasAccess = hasAllPermissions(permissions);
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
