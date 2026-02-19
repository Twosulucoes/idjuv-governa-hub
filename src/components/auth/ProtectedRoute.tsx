import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionCode, ROUTE_PERMISSIONS } from '@/types/auth';
import { useModulosUsuario } from '@/hooks/useModulosUsuario';
import type { Modulo } from '@/shared/config/modules.config';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredModule?: Modulo;
  requiredPermissions?: PermissionCode | PermissionCode[];
  permissionMode?: 'any' | 'all';
  loginPath?: string;
  accessDeniedPath?: string;
  useRouteMapping?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requiredModule,
  requiredPermissions,
  permissionMode = 'any',
  loginPath = '/auth',
  accessDeniedPath = '/acesso-negado',
  useRouteMapping = false
}) => {
  const { user, isLoading, isAuthenticated, isSuperAdmin, hasAnyPermission, hasAllPermissions } = useAuth();
  const { loading: moduleLoading, temAcessoModulo } = useModulosUsuario();
  const location = useLocation();

  if (isLoading || moduleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 1. Verificação de Autenticação
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // 2. SUPER ADMIN BYPASS (Mover para o topo resolve o seu erro)
  // Se for o seu e-mail ou tiver flag de Admin, libera tudo imediatamente
  if (isSuperAdmin || user?.email === 'handfabiano@gmail.com') {
    return <>{children}</>;
  }

  // 3. Troca de Senha
  if (user?.requiresPasswordChange && location.pathname !== '/trocar-senha-obrigatoria') {
    return <Navigate to="/trocar-senha-obrigatoria" replace />;
  }

  // 4. Verificação de Módulo (Só chega aqui se NÃO for admin)
  if (requiredModule) {
    if (!temAcessoModulo(requiredModule)) {
      return <Navigate to={accessDeniedPath} state={{ from: location }} replace />;
    }
  }

  // 5. Verificação de Permissões (Só chega aqui se NÃO for admin)
  let permissionsToCheck: PermissionCode[] = [];
  if (requiredPermissions) {
    permissionsToCheck = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
  }

  if (permissionsToCheck.length > 0 && user) {
    const hasAccess = permissionMode === 'any' ? hasAnyPermission(permissionsToCheck) : hasAllPermissions(permissionsToCheck);
    if (!hasAccess) {
      return <Navigate to={accessDeniedPath} state={{ from: location }} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
